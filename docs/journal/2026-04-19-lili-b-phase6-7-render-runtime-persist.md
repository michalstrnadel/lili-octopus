# Lili B — Phase 6 + 7: Render, Runtime Glue, Persistence, Auto-Attach

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 6 & 7 / 10
**Status:** hotovo ✓

## Kontext

Navazuje na Fázi 5 (brain interface + state assembly + shadow reward).
Cílem bylo uzavřít "computational core → living agent on the page"
smyčku: kinematics, render na sdíleném canvasu, runtime glue který všechno
stahuje dohromady, persistence vah a DOMContentLoaded auto-attach.

Fáze 6 a 7 jsou v briefu rozdělené, ale implementačně tvoří jeden závislý
blok — runtime potřebuje kinematics+render pro tick, persistence pro
save/restore, a autoAttach pro napojení na A. Sloučeno do jednoho journal
entry.

## Rozhodnutí: mobile detection — heuristika místo feature detect

```js
function isMobileEnv() {
  const narrow = (window.innerWidth || 9999) < 768;
  const uaMobile = /Mobi|Android|iPhone|iPad|iPod|...Mini/i.test(navigator.userAgent);
  return narrow || uaMobile;
}
```

Viewport < 768 OR mobile UA string. Zachytí:

- Telefony a malé tablety (narrow + mobile UA)
- iPad v desktop režimu (široký viewport, UA iPhone-style stále obsahuje "iPad")
- Okna prohlížeče split/resized pod 768 — uživatel nemusí být na mobilu,
  ale malá plocha = pravděpodobně nechceme trénovat

**Proč ne pointer: coarse/fine media query:** starší iPady raportují fine
pointer v desktop módu ale pořád mají slabý CPU; user-agent je v tomhle
případě spolehlivější signál než capability detection.

**Dopad:** mobile = `greedy=true` forever (žádný ε exploration), žádné
observe → replay buffer zůstane prázdný, žádný trainStep, replay buffer
alokován pouze s kapacitou 100 (vs. 50 000 na desktopu) → **šetří 10.7 MB
RAM** na slabých zařízeních.

## Rozhodnutí: 4 tentacles místo 8

Lili A má 8 FABRIK-driven chapadel (~400 řádků renderu). Lili B má **4
quadratic-curve tentacles** (~20 řádků):

- Vizuální diferenciace od A (A = 8 komplexních, B = 4 jednodušších)
- ~20× levnější render (4 beziery + 3 chromatofory + ellipse)
- Dostatečně "chobotničí" aby byla rozpoznatelná
- Ladí s "budget" identitou B jako experimentálního / druhotného agenta

**Palette:** cool spectrum (HSL hue 195–250), kontrast k A (teplé tóny).
Mood moduluje hue base (+9 per mood index) → subtle signál bez rozbití
palety.

**Co v renderu není:**
- Žádné oční expresse (no blink, no saccades, no gaze)
- Žádná deformace těla (body je ellipse, ne noise-deformed organická forma)
- Žádný procedural ink, žádné bubliny
- Žádný sleep/wake stav

Tyhle věci nejsou blokující pro akademický experiment (učení architektur,
ne vizuální bohatost). Lze přidat v polish fázi po 2-letém checkpointu,
pokud experiment pokračuje na 10 let.

## Rozhodnutí: shared-canvas render v onAfterRender hook

```js
window.LiliA.onAfterRender(runtime.tick);
```

`_liliAAfterRenderHooks` v `lili.js` se volá **po** `ctx.restore()` které
ukončí A's scroll-offset transform. Hook dostane "čistý" ctx ve viewport
coords. B si musí sám re-apply scroll offset:

```js
ctx.save();
ctx.translate(-world.scrollOx, -world.scrollOy);
renderLiliB(ctx, kSt, currentMood, kSt.phaseT);
ctx.restore();
```

Save/restore izoluje B's style state (fillStyle, strokeStyle, lineWidth,
globalAlpha) od A, kdyby A po B ještě něco kreslila. V praxi B je
poslední v pořadí, ale isolation ochrání proti budoucím změnám.

**Proč B nemá vlastní canvas:** brief sekce 4 — fullscreen canvas v A je
už responsive a DPR-aware. Druhý canvas = duplikace práce + z-index
conflict risk + zdvojnásobená bandwidth při DPR rescale.

## Rozhodnutí: decision cadence = A's (45 frames), train cadence z briefu

- **Decision:** každých 45 frames (~0.75 s @ 60 FPS), stejné jako A →
  fair comparison ve wall-clock okně.
- **Train real:** každé 4 decisions (každé ~3 s real užívání).
- **Train phantom:** každých 16 decisions (každé ~12 s v idle režimu).

**Proč decision > frame cadence pro observe:** brain.observe očekává
state *transitions* (s, a, s'). Frame není transition — agent se hýbe
plynule ale "rozhodnutí" o náladě se dějí diskrétně. Observe per frame by
generoval 60× víc replay samples s téměř identickými state (over-fit na
temporal correlation). Observe per decision = jeden replay entry per
action choice, čistá Markov transition.

## Rozhodnutí: phantom fallback v runtime, ne v brain

Phantom generator byl ve Fázi 4 napsaný jako samostatný modul. Runtime
ho drží a používá jeho cursor **jen když `aState.mouseActive` je false**:

```js
const cursorX = aState.mouseActive ? aState.mouseX : ph.x;
const cursorY = aState.mouseActive ? aState.mouseY : ph.y;
const cursorPhantom = !aState.mouseActive && ph.isPhantom;
```

Lili A vidí vlastní real cursor; Lili B vidí A-real-cursor když je user
aktivní a phantom cursor když ne. Phantom nikdy neovlivní A's state nor
A's Q-learning — A's `mouseActive` je autoritativní signál.

**Priority flag na replay:** `cursorPhantom ? 0 : 1`. 50% batch sampling
z priority=1 podle briefu sekce 6 brání sim-to-real gapu když se většina
trénovacích dat nasbírá v phantom módu.

## Rozhodnutí: persist schema v1 s anchor rotation stubem

```json
{
  "schema": "lili-b-persist-v1",
  "savedAt": 1712345678901,
  "firstSavedAt": 1712300000000,
  "lastAnchorAt": 1712300000000,
  "meta": { "frameCount": 84000, "decisionCount": 1860, "mobile": false },
  "current": { /* brain.serialize() output */ },
  "anchors": [
    { "at": 1711695200000, "snap": { /* brain snap 7 days ago */ } },
    { "at": 1711090400000, "snap": { /* 14 days ago */ } },
    { "at": 1710485600000, "snap": { /* 21 days ago */ } }
  ]
}
```

- **current:** nejnovější snapshot po každém save
- **anchors:** FIFO do 3 slotů (21 dní hloubky při weekly rotation)
- **lastAnchorAt:** kdy byl poslední rotate; rotace trigeruje když
  `now - lastAnchorAt >= anchorIntervalMs` (default 7 dní)

**Proč to takhle teď:** Phase 8 stabilization bude potřebovat rollback
na nejstarší "dobrý" anchor při loss explosion. Schéma ready, jen chybí
rollback logika. Současná "pasivní" rotace = každý týden se uloží
snapshot předtím než ho nahradí nová verze, takže máme 3 snapshots o
znění {-7d, -14d, -21d} ready k rollbacku.

**Rotation interval 0 ms použitý v testech:** `anchorIntervalMs=0`
znamená každý druhý save anchorne. Pro unit testy deterministické i při
nízkém Date.now() rozlišení v prohlížečích (některé Chromium klampují na
celé ms kvůli timing attack mitigation).

## Flush triggery

- **Periodický save:** každých 5 minut (opts.saveIntervalMs)
- **beforeunload:** final flush před zavřením tabu
- **visibilitychange → hidden:** backup pokud beforeunload nevystřelí
  (typické na mobilu kde browser zabije tab místo navigace)

**Co NENÍ:** kontinuální save per-decision. localStorage writes ve
`requestAnimationFrame` loopu = I/O contention a V8 slowdown. 5min
interval je kompromis mezi data loss risk a performance.

## Auto-attach flow

```
script load
 → autoAttach()
   → document.readyState === 'loading' → DOMContentLoaded listener
   → else → tryAttach() synchronously
      → window.LiliA present? → createLiliBRuntime, wire hooks
      → not present? → setTimeout(tryAttach, 100ms) until timeout (10s)
      → after timeout → console.warn, Lili B inactive
```

**Opt-out:** `window.__LILIB_NO_AUTO_ATTACH = true` před script tag →
runtime se nezapne. Použité v Node unit testech a potenciálně v dev/debug
flow kde chceme runtime ručně držet.

**Graceful degradation:** pokud `window.LiliA` nikdy nenaběhne (script
tag chybí, A crashnul v boot, namespace kolize), B zaloguje warning a
tiše nic nekreslí. index.html není rozbitá.

## Test suite rozšířena — teď 8 testů

```
[LiliB] gradientCheck: max |num - analytical| = 6.132e-5 — PASS
[LiliB] xorTest: avg abs error after 10000 steps = 0.0000 — PASS
[LiliB] gridWorldTest: reached goal in 6 steps (optimal=6) — PASS
[LiliB] phantomTest: activated=true oob=0 avgDelta=1.93 exited=true — PASS
[LiliB] brainInterfaceTest: steps=200 shadow=200/200 serialize=true pure=true — PASS
[LiliB] kinematicsTest: bounds=true stressOk=true totalMotion=678 — PASS
[LiliB] persistenceTest: save/restore/anchor rotation all green — PASS
[LiliB] runtimeTest: threw=false frames=400 decisions=40 drawCalls=4000 — PASS
[LiliB] tests: ALL PASS ✓
```

Ověřeno:

- **Node:** 7 testů pass, runtimeTest skip (no DOM)
- **Headless Chromium přes Playwright:** všech 8 pass, runtime reálně
  attachnutý (mobile=false, restored=false, bufferSize=0 při cold start)

## Velikost

```
lili-b.js: 82 110 B raw
           23 257 B gzipped
```

Nad brief targetem (15 KB gzipped). 8 unit testů tvoří ~40 % souboru —
v produkci by se stripnuly (Phase 10 — instrumentation). Pro fázi
vývoje ponecháno v bundlu kvůli diagnosis.

**Runtime RAM:**
- Desktop: 10.8 MB replay buffer + ~0.5 MB NN váhy + drobnosti
- Mobile: ~22 KB replay buffer (capacity=100) + 0.5 MB NN váhy

## Integrace do index.html

```html
<script src="lili.js" defer></script>
<script src="lili-b.js" defer></script>
```

Defer zachová execution order — `lili.js` se spustí první, exponuje
`window.LiliA`, pak `lili-b.js` autoAttachuje. Oba scripty jsou non-blocking
na parsing; HTML se zobrazí bez čekání.

## Co NENÍ v Fázi 6+7

- ❌ **Stabilizační sada (7 mechanismů)** — Phase 8:
  - anchor-based rollback on loss divergence (schema ready, logic ne)
  - periodic ε re-juvenilization
  - Adam lr schedule
  - loss explosion detector (rolling EMA, 5σ threshold)
- ❌ **Export přes E key** — Phase 9 (instrumentation) rozšíří A's export
  handler o LiliB weights+telemetry
- ❌ **Debug overlay pro B** — žádný mini debug panel pro B (na rozdíl od A).
  Lze přidat v Phase 10 pokud bude potřeba
- ❌ **Lili B perception A's DOM grabbing** — state vector má A's pozici
  a mood, ale ne informaci o jejích drženích elementech. Přidání vyžaduje
  rozšíření LiliA.getState() — vyžaduje diskusi o briefu Sekci 3

## Integrity check — brief vs. implementace

| Brief pravidlo | Stav |
|----------------|------|
| Zero deps | ✅ |
| Zero build | ✅ (static script tag) |
| Nerozbít Lili A | ✅ (jen additive onAfterRender hook, state exposition z Fáze 3) |
| Žádná alokace v rAF loop | ✅ (všechno pre-alokované v createLiliBBrain + kinematics) |
| Shared canvas | ✅ |
| Normalizované 0–1 souřadnice | ✅ (v brain state, render ve viewport) |
| Mobile inference-only | ✅ |
| Phantom priority flag | ✅ |
| INPUT_DIM konstanta | ✅ (26) |
| Same 7 actions jako A | ✅ |
| localStorage persistence | ✅ |
| Wall-clock ontogenesis | ✅ (bodyR mirror from aState.bodyR) |

## Další kroky

**Fáze 8 — Stabilizační sada** (7 mechanismů z briefu Sekce 10):

1. Anchor rollback — load anchors[0] when loss > 3σ baseline
2. Adam lr schedule — 0.9× decay every 90 days, floor 1e-5
3. Periodická re-juvenilizace ε → 0.3 každé X měsíců
4. Loss explosion detector — rolling EMA baseline + 5σ instant rollback
5. (Experience replay + target hard sync + gradient clipping už jsou)

**Fáze 9 — Export/import** — rozšířit klávesu E v `lili.js` o `window.LiliB.runtime.flushSave()` → JSON download snapshots + telemetry.

**Fáze 10 — Instrumentation** — loss per-decision buffer, rollback log,
phantom vs. real ratio, monthly milestone snapshot schema.

## Akademická poznámka — mutual perception day

User's plán (z dnešní konverzace): **Fáze 8+9+10 bez interakce mezi A a
B, pak jeden day X → zapne se mutual perception na OBĚ**. Phase 6+7
tohle **umožňují bez další úpravy**:

- A's state vector je aktuálně slepý k B (nepředává LiliB.getState) → A
  běží dál v "solo ontogeneze" paradigmatu
- B už "vidí" A přes state exposition + přidané relative dimensions
  (Fáze 5 already done)
- Den X = jednorázová úprava `lili.js` která přidá `otherX, otherY,
  distance_to_B` do A's state vectoru + interaction bonus do A's reward

Phase 6+7 tedy dodržují brief sekci 3 ("nerozbít A") zatímco posouvají
experiment do stavu kde den X je clean single-PR milestone, ne
rollout-drama.
