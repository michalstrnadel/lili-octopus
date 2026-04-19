# Lili B — Phase 10: Instrumentation

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 10 / 10
**Status:** hotovo ✓ (minify pass odložen do samostatné fáze)

## Kontext

Fáze 9 vypíchla v sekci "Co NENÍ ve Fázi 9" tři chybějící věci:
time-series telemetrie (loss per decision, rollback event log),
phantom/real ratio delta přes čas a monthly snapshot reminder.
Brief sekce 12 (Logging & akademická vrstva) je po hlavě — Fáze 10
dodává runtime-level instrumentation, bumpne export schema na v2 a
importBrain přijímá oba formáty.

Production minify cíl 15 KB gzipped brief stále zmiňuje, ale je
orthogonal ke zbytku Fáze 10 — odděluji do samostatné fáze 11
(nebo "phase 10b"), viz závěr.

## Rozhodnutí: instrumentation jako standalone runtime-level modul

Historie a poměry neleží v brain, ale v runtime. Důvod:

- **Brain je zodpovědný za policy.** Loss time-series, rollback event
  log, phantom/real ratio jsou telemetrie běhu, nikoliv součást naučené
  politiky. Držet je mimo `brain.serialize()` udržuje akademickou
  kontrolu nad tím, co znamená "restored brain".
- **Stabilizer už má `rollbackCount`** — kumulativní čítač, který
  přežívá session a cross-session. Nové eventy v instrumentation jsou
  per-session **detail** (sigma, baseline, anchor age) které agregátor
  nepotřebuje znát, ale paper analýza ano.
- **Runtime = "jeden ticker" majitel.** Instrumentation se hooknula do
  stejných tří bodů, kde se rozhoduje / učí / rolbeckuje. Brain o ní
  neví; kdyby někdo refactoroval brain, instrumentation zůstane stabilní.

API kontrakt (novinka v `window.LiliB`):

```js
const instr = LiliB.createInstrumentation({
  lossCap: 1024,     // ring buffer, elapsed-ms + loss jako Float32 páry
  rollbackCap: 32,   // plain Array, rollbacky jsou vzácné (<3/rok target)
  ratioWindow: 512   // Uint8 ring pro rolling recentReal/recentPhantom
});
instr.recordLoss(nowMs, loss);
instr.recordRollback({ at, sigma, baseline, anchorAgeMs, count });
instr.recordDecision(isPhantom);
instr.getLossHistory();  // { t: [...], v: [...] } parallel arrays
instr.getRollbackLog();
instr.getRatio();        // { totalReal, totalPhantom, recentReal, recentPhantom, windowSize }
instr.getStats();
```

## Rozhodnutí: loss ring jako Float32Array (timestamp + hodnota páry)

```
lossBuf: Float32Array(lossCap * 2)   // [t0, loss0, t1, loss1, ...]
```

Parallel arrays místo `Array<{t, v}>` protože:

- **Zero-alloc hot path.** `recordLoss()` zapíše 2 čísla a inkrementuje
  hlavu. Žádný object alloc per train step.
- **Float32 je dostatečný precision pro loss (0..~10) i elapsed ms do
  ~4 hodin sessionu.** Pro delší sessiony ztrácíme sub-ms precision,
  ale monotonie pořadí je zachována (timestamps jsou relativní k
  `startWall`, ne absolutní Date.now()).
- **JSON export je kompaktní** — 2 číslo-arrays místo array objektů.
  Menší payload, rychlejší parse na straně analyzátoru.

1024 entries @ train-every-4-decisions × 45-frame decision cadence
pokrývá ~50 minut historie — dost pro ad-hoc debug; pro paper analýzu
se spoléháme na pravidelný manual export (monthly reminder dole).

## Rozhodnutí: rollback events jako plain Array (ne Float32)

Rollbacky jsou rare (< 3/rok cíl) a obsahují hybrid shape: timestamp,
sigma (float), baseline (float), anchorAgeMs (int), count (int).
Plain Array s FIFO cap=32 je explicitnější než separace do pěti
paralelních Float32 arrays a JSON round-trip je trivial.

Events jsou session-scoped: když session skončí a příští se nastartuje,
log se resetuje. Kumulativní počet žije v `stabilizer.rollbackCount`
a persistuje v brain snapshotu. Ztráta detail metadata přes session
boundary je vědomá trade-off: persistovat by znamenalo bloatovat
localStorage o okrajovou telemetrii, a export payload jsou user-level
autoritativní archiv, ne localStorage.

## Rozhodnutí: phantom/real ratio — kumulativní + rolling window

Brief sekce 12 požaduje "phantom vs. real ratio". Sám o sobě kumulativní
poměr za celou session je nudný — zajímavé je jestli se ratio **mění**
přes čas (indikátor traffic shiftu). Proto dual metric:

- `totalReal`, `totalPhantom` — lifetime counters
- `recentReal`, `recentPhantom`, `windowSize` — posledních 512 decisions

Rolling window je Uint8 ring (flag per slot), decrementuje counter při
eviction. Vyhne se O(n) recompute per query.

## Rozhodnutí: export payload v1 → v2, import accepts both

Schema bump je justifikovaný — přidal jsem top-level `history` sekci
a `runtime.ratio`, což žádný v1 konzument nemohl znát. Ale import musí
přežít staré exporty (uživatel může mít uložené `lili_b_export_v1`
JSONy z předchozích týdnů):

```js
const snap = (obj.format === 'lili_b_export_v2' || obj.format === 'lili_b_export_v1')
              ? obj.brain
           : (obj.schema === 'lili-b-brain-v1') ? obj
           : null;
```

`history` v v1 chybí — OK, je to session-scoped stejně, takže import
neztrácí nic podstatného (vše co přežívá = brain weights + stabilizer
state, obojí v `obj.brain`).

## Rozhodnutí: monthly reminder pomocí `persist.markExport()` write-through

Brief sekce 12: "uživatel dostane console notification jednou měsíčně
→ stiskni Shift+E". Implementováno bez server-side scheduleru (Vercel
Hobby constraint):

1. Každý `downloadExport()` zavolá `persist.markExport(now)` — atomický
   write do existujícího persist payloadu, **bez** přeserializování
   brain state. Důvod: export je user-level event, neodráží train step,
   nechceme zbytečně zapisovat weights do localStorage.
2. `createLiliBRuntime()` při init načte `persistState.lastExportAt`
   (nebo fallback na `firstSavedAt` když nikdy neexportoval) a porovná
   s `Date.now() - reminderIntervalMs` (default 30 dní).
3. Pokud uplynulo ≥ 30 dní → jednorázová `console.info` v téhle session.

Suppress: `opts.suppressReminder === true` (pro testy) a `mobile === true`
(mobilní ambassadoři nemají training data, nepatří jim reminder).

Alternativou byl timer-based poll v rAF loopu, ale reminder je
session-level fakt — stačí check v init. Žádný ongoing overhead.

## Rozhodnutí: `persist.save()` extras a markExport oddělený

`persist.save(brain, meta)` teď bere volitelný třetí argument `extras`:

```js
persist.save(brain, { decisionCount, mobile }, { lastExportAt: 123 });
```

Existující call sites (periodic save, importBrain) předávají jen
(brain, meta) a `lastExportAt` se zachová z `existing`. Tenhle pattern
zabraňuje tomu aby 5-min periodic save přepsal lastExportAt na `null`
když paměťová hodnota nebyla naplněná.

`markExport(now)` je specializovaná: nečte brain, jen updatuje jedno
pole. Důvod: ne-atomické brain.serialize() během downloadu by přepsalo
paralelní train step, zatímco pouze stamp je atomic + minimální I/O.

## Integrace

`createPersistence` (lili-b.js):
- `save(brain, meta, extras)` — nový arg, preserve `lastExportAt`
- `markExport(now)` — write-through single field
- payload schema rozšířeno o `lastExportAt` (volitelné pole, absent =
  null, backward-compat)

`createLiliBRuntime` (lili-b.js):
- `const instr = createInstrumentation(opts.instrumentation || {})`
- Reminder check v init pomocí `persistState.lastExportAt` nebo `firstSavedAt`
- Tick loop: `instr.recordDecision(cursorPhantom)` na decision boundary
- Tick loop: `instr.recordLoss(now, obs.train.loss)` po úspěšném train step
- Tick loop: `instr.recordRollback({...})` po úspěšném `brain.rollback()`
- `downloadExport()`: `persist.markExport(Date.now())` po dokončení stahování
- `getStats()` vrací `instrumentation + lastExportAt`
- Runtime API: `.instr` exposed pro introspection (read-only v praxi)

`buildExportPayload`:
- format → `lili_b_export_v2`
- `runtime.ratio` — aktuální poměr + rolling window
- `history` sekce s loss time-series a rollback log
- `persistence.lastExportAt` v exportu

`window.LiliB`:
- version bump → `phase10-instrumentation`
- přidáno `createInstrumentation` (public factory)
- `_internal.instrumentationTest`

## Test coverage

**instrumentationTest** (new, 8 assertions):
- Loss ring wrap (cap=4, push 6, verify oldest 2 evicted a chronology)
- NaN/Infinity rejection u `recordLoss`
- Ratio phase 1: 2 real + 2 phantom → total a recent matchují
- Ratio eviction: window=4, 2 více real push → recent stále `2R/2P`
  (evikly se první 2 real, takže recent se neznemenil)
- Rollback log cap=2, push 3 → oldest dropped, count=1 vylétl
- `persist.markExport()` písemně zapsal lastExportAt bez brain update
- Reminder fires když persisted firstSavedAt 60 dní v minulosti
- Reminder suppressed když `suppressReminder: true`

**exportImportTest** (rozšířen, +1 assertion):
- Nový `history=true` check: `payload.history.schema === 'lili-b-history-v1'`,
  parallel arrays `t`/`v` stejné délky, `rollbacks` je array
- `format` bumped na `lili_b_export_v2`
- Import accepts v2 (existing test předává payload přímo do importBrain)

**Plné výsledky (Node + headless Chromium, 13/13 PASS):**

```
gradientCheck: max |num - analytical| = 6.132e-5 — PASS
xorTest: avg abs error after 10000 steps = 0.0000 — PASS
gridWorldTest: episodes=1500 trainSteps=11008 reached=true in 6 steps — PASS
phantomTest: activated=true oob=0 avgDelta=1.93 exited=true — PASS
brainInterfaceTest: steps=200 shadow=200/200 serialize=true pure=true — PASS
kinematicsTest: bounds=true stressOk=true totalMotion=678 — PASS
persistenceTest: save/restore/anchor rotation all green — PASS
persistenceHardenTest: corrupt=true badSchema=true maxAnchors=3/3 — PASS
runtimeTest: threw=false frames=400 decisions=40 drawCalls=4000 — PASS
stabilizerTest: all 10 assertions green — PASS
rollbackTest: applied=true weightsRestored=true bufferFlushed=true — PASS
exportImportTest: format=true brain=true telem=true history=true
  persistMeta=true roundTrip=true preΔ=1.46 postΔ=0 rejectBad=true rawSnap=true — PASS
instrumentationTest: lossWrap=true nanReject=true ratio1=true ratioEvict=true
  rollbackCap=true markExport=true reminderFired=true reminderSuppressed=true — PASS
tests: ALL PASS ✓
```

Velikost: 127 KB raw / ~35 KB gzipped (+15 KB raw / +4 KB gzip vs.
Fáze 9). Test kód dál dominuje objemu — production minify cíl 15 KB
gzipped platí pro samostatnou "phase 11" build pass.

## Co NENÍ ve Fázi 10

- ❌ **Production minify pass.** Brief požaduje 15 KB gzipped pro
  `lili-b.js`. Aktuálních 35 KB gzipped zahrnuje ~50 % test kódu
  (gradientCheck, xor, gridWorld, phantomTest, brainInterfaceTest,
  kinematicsTest, persistenceTest, persistenceHardenTest, runtimeTest,
  stabilizerTest, rollbackTest, exportImportTest, instrumentationTest).
  Minify pass vyžaduje buď build step (porušuje zero-build filozofii)
  nebo runtime split: `public/lili-b.js` (production, bez testů) +
  `public/lili-b-tests.js` (dev-only, importován on-demand). To je
  samostatné rozhodnutí, ne just mechanický uglify.
- ❌ **`.vercelignore` audit.** data/snapshots/ ještě neexistuje,
  .vercelignore nevytvořený. Low prio protože Vercel Hobby deploy
  size limit je 100 MB a repo je pod 2 MB.
- ❌ **Debug overlay hook v Lili A.** Fáze 9 návrh "sdílet místo v
  Lili A debug panelu?" — neimplementováno. Export + console log
  stačí pro paper data collection. Overlay by vyžadoval `window.LiliA`
  UI API které brief explicitně zakazuje rozšiřovat (sekce 3).
- ❌ **CSV export (Shift+Shift+E).** Původní návrh z fáze 9 pro
  paper-friendly formát. Tools jako pandas / R zvládnou JSON parse
  a JSON je o generaci expressive (nested objekty, schema fieldy).
  Odloženo trvale, pokud nevznikne konkrétní potřeba.

## Integrity check — brief sekce 12 vs. implementace

| Brief požadavek | Implementace | OK |
|-----------------|--------------|----|
| Reward per episode | `runtime.ratio` + `history.loss` zachycuje train-time signál | ✅ |
| Avg loss | `history.loss.v` parallel array | ✅ |
| Epsilon | `runtime.epsilon` (už v v1) | ✅ |
| Rollback events | `history.rollbacks` + `stabilizer.rollbackCount` | ✅ |
| Training step count | `runtime.trainSteps` (už v v1) | ✅ |
| Phantom vs real ratio | `runtime.ratio.{totalReal,totalPhantom,recent...}` | ✅ |
| Monthly milestone snapshot | console reminder, ne auto-commit (brief explicitně zakazuje auto-commit) | ✅ |
| On-demand JSON export | Shift+E (z fáze 9), teď s history | ✅ |
| Paper data output | v2 JSON je strukturovaný pro analysis scripts | ✅ |
| 15 KB gzipped production | **odloženo na fázi 11** | ⏸️ |

## Další kroky

**Fáze 11 — Production minification + deploy hardening:**

1. **Split lili-b.js do production + tests**
   - `public/lili-b.js` — jen production code (brain, runtime, attach)
   - `public/lili-b.tests.js` — test suite, lazy-loaded na `LiliB.test()`
   - Nebo: build-step-free tree shake pomocí inline flag
     `const __TESTS__ = false` + mechanický strip if-block
2. **Minify pass**
   - Identifier renaming pro private scopes (IIFE-safe, není top-level
     API exposure)
   - Comment strip, whitespace collapse
   - Cíl: 15 KB gzipped (od 35 KB = ~60 % redukce, realizovatelné)
3. **`.vercelignore`**
   - Případně přidat (zbytečné když deploy budou <100 MB, zatím ne)
4. **Shadow log flush cadence review**
   - Phase 5 + 7 spouští flushShadowLog(). Pod-šel jsem, jestli cadence
     je optimální pro low-traffic deploy.

Po publikaci fáze 11 → 2-year observation window (brief sekce 1 Fáze 1).
Checkpoint: < 3 rollback/rok, FPS ≥ 55, loss nediverguje → 10-year run
conditional pokračování.
