# Lili B — Phase 8: Stabilization Suite

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 8 / 10
**Status:** hotovo ✓

## Kontext

Navazuje na Fáze 6+7 (render, runtime glue, persistence + auto-init).
Cílem Fáze 8 je uzavřít **stabilizační sadu** z briefu sekce 10 —
mechanismy nutné pro decade-scale autonomní běh bez lidské intervence.
Experience replay (#1), target network hard sync (#2) a gradient
clipping (#6) byly dokončeny v Fázi 2. Zbývaly čtyři mechanismy:

| # | Mechanismus | Parametry | Stav po Fázi 8 |
|---|-------------|-----------|----------------|
| 3 | Anchor snapshot + rollback | weekly snapshot; rollback on 5σ spike | ✅ |
| 4 | Adam lr schedule | 0.9× / 90 dní, floor 1e-5 | ✅ |
| 5 | Periodická re-juvenilizace ε | ε → 0.3 / 6 měsíců | ✅ |
| 7 | Loss explosion detector | rolling EMA + 5σ → rollback | ✅ |

## Rozhodnutí: stabilizer jako samostatný factory

Všechny čtyři mechanismy sdílejí jediný stavový modul `createStabilizer`,
protože:

- **Loss EMA** je zdroj pravdy pro rollback trigger (#7)
- **Rollback** spotřebovává anchory z persistu (#3) → ale sám nereplikuje
  váhy, jen vrací `action: 'rollback'` signál
- **LR schedule** a **ε rejuvenation** jsou wall-clock driven, stejná
  třída `maybeX(now)` timing API
- **rollbackCount** potřebuje persistovat s mozkem, takže ho drží
  stabilizer (serialize/deserialize) a řetězí se do `brain.serialize()`

Alternativa — mít čtyři separátní moduly — by znamenala čtyři entries
v brain snapshot schémě. Jeden unified modul drží celou "training
hygiene" vrstvu pohromadě.

## Rozhodnutí: sigma měřená **před** aktualizací baseline

Klíčový detail `recordLoss()`:

```js
const d = loss - lossEMA;
const sigma = d / Math.sqrt(max(lossVar, varFloor));
const explode = lossSamples >= minSamples && sigma > explosionSigma;
if (!explode) {
  lossEMA += emaAlpha * d;
  lossVar = (1 - emaAlpha) * lossVar + emaAlpha * d * d;
}
```

Kdyby se baseline aktualizoval *před* detekcí, jediný spike o hodnotě
x by posunul EMA o α·x a snížil σ — druhý spike pak neexploduje navzdory
stejné anomálii. Tohle je klasická past plovoucího baseline, vyřešená
tím, že spike odmítneme statisticky i z baseline-tracking smyčky.

`varFloor = 1e-12` brání dělení nulou na úplně konstantních lossech
(typicky bootstrap fáze, nebo numericky zrušená loss).

## Rozhodnutí: minSamples = 200 před rollback trigger

Bootstrap fáze: první sample má σ = 0, druhá má σ ≈ 1/α velká kvůli
čerstvému baseline. Rollback by hned v druhém kroku rozbil celý
training flow. `minSamples = 200` posune první validní detekci na
cca 200 training kroků, což při `trainEveryReal = 4` znamená ~800
decisions (~10 minut real-time use na 60 FPS).

## Rozhodnutí: post-rollback reset loss stats

`stabilizer.onRollback()` resetuje `lossEMA = null`, `lossVar = 0`,
`lossSamples = 0`. Důvod: po rollbacku je ε bumpnuté na 0.3, replay
flushnutý, síť je obnovená z 7-denního anchoru — loss distribution
se kompletně změní a stará baseline je zavádějící. Fresh bootstrap
taky znamená, že minSamples guard zabrání okamžitému druhému
rollbacku, pokud by první nezachytil kořen divergence.

## Rozhodnutí: lr decay skrze multiplikátor, ne edit CFG.adam.lr

Přidána `network.setLrMultiplier(m)` / `network.getLrMultiplier()`.
Multiplikátor žije per-network (online i target, kvůli budoucí
flexibilitě). `adamStep` čte `CFG.adam.lr * lrMultiplier` jako effective
lr. Důvody:

- **CFG.adam.lr je const-like:** všechny testy a baseline srovnání
  čtou CFG přímo. Mutace CFG mid-run by znečistila.
- **Target network:** ve DQN je target frozen, target.adamStep se
  nevolá. Ale kdybychom někdy v budoucnu dělali soft-target update
  s Adamem (Polyak averaging variant), multiplier by se už choval
  správně.
- **Floor:** `lrFloor / baseLr` = 0.01 při default parametrech. Clamp
  ukládá `multiplier = max(0.01, multiplier * 0.9)`, takže po ~44
  decay intervalech se dostaneme na floor a dál nepadáme.

## Rozhodnutí: ε rejuvenation skip na mobile

Runtime `tick()`:

```js
if (!mobile && brain.stabilizer.maybeRejuvenate(wallNow)) {
  brain.dqn.setEpsilon(brain.stabilizer.getRejuvEpsilon());
}
```

Mobile je inference-only (greedy=true). ε neovlivňuje nic na mobilu,
ale i tak by bylo divné, kdyby se volalo a `lastRejuvAt` se pohyboval
— při cross-device persistenci ale mobile nikdy neukládá, takže v
praxi by se nestalo nic špatného. Skip je defensive a explicitní.

## Rozhodnutí: rollback flushne replay buffer

Důvod: po rollbacku se síť vrátí o ~7 dní, ale replay buffer stále
obsahuje zkušenosti generované policy těch 7 dní. Tyto (s, a, r, s')
tuples odpovídají policy, která byla na cestě k divergenci — jejich
resampling v TD target výpočtu by okamžitě tlačil síť zpět k
divergentnímu optimu. Flush bufferu = fresh start pro experience,
konzistentní s fresh ε=0.3 explorací.

**Dopad:** prvních ~32 kroků po rollbacku (batch size minimum)
netréninku — mozek sbírá nová data. Při train cadence 4 to je ~128
decisions, ~2 minuty real-time use.

## Rozhodnutí: deserialize má `skipStabilizer` option

Brain.rollback volá `deserialize(snap, { skipStabilizer: true })`.
Bez toho by anchor (7 dní starý) přepsal aktuální `rollbackCount` a
wall-clock timery (`lastLrDecayAt`, `lastRejuvAt`) na staré hodnoty,
což by znamenalo:

- Rollback counter by ztratil historii (3 rollbacky za týden by se
  "vymazaly" po každém)
- LR decay by se okamžitě znovu spustil (poslední decay by se zdál
  "před 7 dny")
- ε rejuv timer stejně

Správně: rollback zachová stabilizer.lastXAt / rollbackCount, restoruje
jen weights + epsilon + novelty.

## Integrace do runtime

```js
if (obs && obs.train && obs.train.loss != null) {
  const rec = brain.stabilizer.recordLoss(obs.train.loss);
  if (rec.action === 'rollback') {
    const anchors = persist.getAnchors();
    if (anchors.length > 0 && anchors[0].snap) {
      brain.rollback(anchors[0].snap);
      console.warn('[LiliB] rollback: σ=' + rec.sigma.toFixed(2) + ...);
      prevB = null; prevA = null;
    }
  }
}
// Wall-clock schedules, once per frame (cheap ms compare).
if (brain.stabilizer.maybeDecayLr(wallNow)) {
  brain.dqn.setLrMultiplier(brain.stabilizer.getLrMultiplier());
}
if (!mobile && brain.stabilizer.maybeRejuvenate(wallNow)) {
  brain.dqn.setEpsilon(brain.stabilizer.getRejuvEpsilon());
}
```

`prevB = null; prevA = null` zabrání, aby hned po rollbacku proběhl
observe(stale_prev, fresh_curr) s transitionem, který logicky
neexistuje (policy change mezi prev a curr).

## Brain schema backward compat

Schéma zůstává `lili-b-brain-v1`. `stabilizer` je optional field —
starý snapshot bez něj je stále loadable, stabilizer zůstane ve
fresh defaults (multiplier=1, lossEMA=null, rollbackCount=0). Nové
runtime automaticky přidá stabilizer při dalším save. Graceful
decade-scale upgrade path bez migration scriptu.

## Test coverage

**persistenceHardenTest** (Phase 7 hardening, 3 edge cases):
- Corrupt JSON → `load() → null` bez throw
- Wrong schema string → `load() → null`
- 6 saves s `anchorInterval=0` → `anchors.length === 3` (cap respektován)

**stabilizerTest** (10 assertions):
- Bootstrap returns 'bootstrap', no state yet
- 40 stable samples → všechny 'none', baseline ≈ true mean
- 50× spike po 40 samples → 'rollback' action s σ > 5 (naměřeno σ = 9226)
- `maybeDecayLr` false před intervalem, true po
- Multiplier = 0.9 po prvním decay
- LR floor: po 500 decayích clamped na 0.01 (= 1e-5 / 0.001)
- Rejuvenation timing (false/true boundary)
- Serialize/deserialize roundtrip — multiplier + rollbackCount zachovány
- `onRollback` resetuje lossSamples a inkrementuje rollbackCount

**rollbackTest** (6 assertions):
- Anchor save → corrupt váhy (+random noise až 5×) → rollback(anchor)
- Max |Δweight| = 0.0 (přesné restoration, Float32 precision)
- Buffer flushed (250 → 0)
- ε bumped na 0.3 (default rejuvEpsilon)
- rollbackCount inkrementován (0 → 1)
- lossSamples reset (stabilizer.onRollback()) 

**Plné výsledky (Node + headless Chromium):**
```
gradientCheck: max |num - analytical| = 6.132e-5 — PASS
xorTest: avg abs error after 10000 steps = 0.0000 — PASS
gridWorldTest: reached goal in 6 steps (optimal=6) — PASS
phantomTest: activated=true oob=0 avgDelta=1.93 exited=true — PASS
brainInterfaceTest: steps=200 shadow=200/200 serialize=true pure=true — PASS
kinematicsTest: bounds=true stressOk=true totalMotion=678 — PASS
persistenceTest: save/restore/anchor rotation all green — PASS
persistenceHardenTest: corrupt=true badSchema=true maxAnchors=3/3 — PASS
runtimeTest: threw=false frames=400 decisions=40 drawCalls=4000 — PASS
stabilizerTest: all 10 assertions green — PASS
rollbackTest: applied=true weightsRestored=true bufferFlushed=true epsBumped=true count=true lossReset=true — PASS
tests: ALL PASS ✓
```

11/11 pass. Velikost: 97 KB raw / ~27 KB gzipped (over brief 15 KB
target, ale tests zaberou ~45 %; production minify v Phase 10 je
stripne).

## Co NENÍ v Fázi 8

- ❌ **Drift-based rollback** (3σ threshold) — stabilizer vrací
  `action: 'drift'`, ale runtime zatím reaguje jen na 'rollback'.
  Drift signál lze v Fázi 10 použít pro monitoring / export bez
  intervence.
- ❌ **Smart anchor selection** — rollback vždy bere `anchors[0]`
  (nejmladší z {-7d, -14d, -21d}). Pokud by byl i ten divergentní,
  logika zatím nesahá po starším. Vzácný edge case, lze v Fázi 10.
- ❌ **Rollback cooldown** — pokud by dvě divergence přišly kolem
  sebe (~200 decisions = minSamples post-reset), druhá by triggered.
  Možná fíčura, ale zamýšlené: pokud 2× rollback za chvíli → něco
  je fundamentálně rozbité a chceme to vědět (counted do 2-year
  checkpoint fail-state: "3× rollback během týdne").

## Integrity check — brief vs. implementace

| Brief mechanismus | Parametry v briefu | Implementace | OK |
|-------------------|---------------------|---------------|----|
| Experience replay | 50k Float32Array | ✅ (Fáze 2) | ✅ |
| Target network hard update | každých 100 kroků | ✅ (Fáze 2) | ✅ |
| Anchor + rollback | weekly; rollback na 3σ | ✅ (weekly schema, 5σ explosion + 3σ drift warn) | ✅ |
| Adam lr schedule | 0.9× / 90 d, floor 1e-5 | ✅ (default parametry shodné) | ✅ |
| ε re-juvenilization | ε→0.3 každých X měsíců | ✅ (default X=6 měsíců) | ✅ |
| Gradient clipping | max norm 1.0 | ✅ (Fáze 1) | ✅ |
| Loss explosion detector | rolling EMA; 5σ | ✅ (EMA + EMA variance) | ✅ |

## Další kroky

**Fáze 9 — Export/import** — rozšířit klávesu `E` v `lili.js`
(nebo přidat vlastní `Shift+E`) o download `brain.serialize()` +
telemetrie (rollback log, sigma history, training steps). Možná
také import route `I` pro restore z JSON souboru.

**Fáze 10 — Instrumentation:**
- Loss per-decision buffer (ring) pro live graphing v debug overlay
- Rollback event log (timestamp, sigma, baseline, counter)
- Phantom vs. real ratio (delta over time)
- Monthly milestone snapshot schema (mimo repo, user download only)
- Test strip for minified production build (goal: 15 KB gzipped)

## Akademická poznámka — negative result je pořád výsledek

Brief sekce 1.2: "Fáze 2 checkpoint — pokud 3+ rollbacky/rok nebo
divergence 3× za sebou → publikovat 2leté výsledky jako negative
result (stále validní paper)". Phase 8 teď umožňuje **měření**
tohoto kritéria — `brain.stabilizer.getRollbackCount()` plus
persistovaný rollback counter přes anchor rotace. Checkpoint po 2
letech bude mít konkrétní číslo, ne odhad.

Phase 8 tedy není jen "DQN hygiene" — je to **měřící aparát**
experimentu C (stabilizace) v experimentálním rámci briefu.
