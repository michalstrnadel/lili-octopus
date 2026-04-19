# Lili B — Phase 9: Export / Import

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 9 / 10
**Status:** hotovo ✓

## Kontext

Fáze 8 uzavřela stabilizační sadu (rollback, LR schedule, ε rejuvenace,
loss explosion detector). Fáze 9 má na stole **jedinou otázku**: jak
dostat váhy + telemetrii ven bez serveru a bez rozbití Lili A
handlerů.

Brief sekce 12 to rámuje takto:

- Export vah: klávesa `E` v `lili.js` rozšířená o Lili B, **nebo**
  vlastní klávesa (journal návrh: `Shift+E`)
- Metriky: reward per episode, avg loss, ε, rollback eventy, train
  step count, phantom vs real ratio
- Milestone snapshoty: měsíční, ne týdenní (Vercel repo bloat)
- On-demand export: klávesa spustí download JSON

## Rozhodnutí: Shift+E / Shift+I, gatované LiliA.isDevMode()

Tři varianty byly ve hře:

1. **Rozšířit `E` v lili.js** — přidat volání Lili B k stávajícímu
   `exportData()`. Produkuje jeden kombinovaný download.
2. **Vlastní chord `Ctrl+Shift+E`** — žádná vazba na Lili A vůbec.
3. **`Shift+E` s dev-mode gate přes `LiliA.isDevMode()`** — oddělené
   downloady, sdílený unlock.

Zvoleno #3:

- **Dva downloady, ne jeden** zachovávají čistý *artifact split*: Lili
  A export (Q-table, daily aggregates, personality) × Lili B export
  (weights, DQN telemetry). Každý se dá načíst do příslušného agenta
  bez filtrace. Budoucí dashboard / paper scripts mají jasné vstupy.
- **Sdílený dev-mode chord (`Ctrl+Shift+L`)** znamená, že uživatel si
  pamatuje jedno přepnutí. Lili B nemusí vlastní tajný chord, ale
  není ani hardcoded "vždy zapnuté" (což by vystavilo waifu-mode
  random návštěvníkům).
- **Brief explicitně povoluje jen state exposition API change v
  `lili.js`** (sekce 3). `isDevMode()` je read-only accessor — není
  to modifikace state vectoru, rewardu, Q-table, renderu ani canvas
  handlingu. Takže rámec ctí.

## Rozhodnutí: plain E/I v lili.js dostaly `!e.shiftKey` guard

Důvod: `e.key.toLowerCase()` vrací `'e'` i pro plain E i pro Shift+E.
Bez guardu by Shift+E triggeroval oba handlery současně (Lili A
`exportData()` + Lili B download). Přidán `&& !e.shiftKey` k E i I
routing větvím. Plain E/I chování nezměněno.

Alternativa — modifikace key handleru v lili.js je drobná, neviditelná
z perspektivy Lili A logiky. Zvažoval jsem delegační pattern (Lili A
emituje custom event pro nezpracované klávesy, Lili B poslouchá), ale
pro dvě klávesy je to over-engineered.

## Rozhodnutí: payload zabalený jako `lili_b_export_v1` s třemi sekcemi

Export payload:

```
{
  format: 'lili_b_export_v1',
  exportedAt: ISO8601,
  brain: <brain.serialize()>,  // schema: 'lili-b-brain-v1'
  runtime: {
    frameCount, decisionCount, mobile, restored, currentMood,
    epsilon, trainSteps, targetSyncs, bufferSize,
    rollbacks, lrMultiplier,
    stabilizer: <stats>, shadow: <stats>, novelty: <stats>
  },
  persistence: {
    key, firstSavedAt, savedAt, lastAnchorAt,
    anchorCount, anchorAges: [ms, ms, ms]
  }
}
```

Proč tři sekce:

- **brain** je to, co se dá deserializovat zpět do fresh Lili B
  (weights + ε + novelty + stabilizer state). Schema stejné jako
  persist layer — downstream nástroje můžou reusovat brain parser.
- **runtime** je snapshot-in-time telemetrie. Nejsou to time series
  (to je Fáze 10). Dává odpověď na "jaký byl stav při exportu".
- **persistence** je meta o anchor rotaci — kdy byla poslední anchor,
  kolik jich je. Důležité pro akademické analýzy "kolik týdnů
  training historie je zaznamenáno".

`importBrain()` přijímá buď full `lili_b_export_v1` payload, nebo
raw `lili-b-brain-v1` snapshot. Druhá cesta je pro bootstrap z
minulých běhů / test rigů. Bad format → `false`, beze změny vah
(ověřeno v testu: `badDrift === 0`).

## Rozhodnutí: import persistuje okamžitě

```js
function importBrain(obj) {
  ...
  const ok = brain.deserialize(snap);
  if (!ok) return false;
  prevB = null; prevA = null;
  persist.save(brain, { decisionCount, mobile, importedAt: Date.now() });
  return true;
}
```

Bez okamžité `persist.save()` by periodický 5-min save přepsal
naimportované váhy stavem, který běžel před importem (fresh brain
loadnutý na init). Uživatel by si myslel, že import proběhl, ale po
reloadu by dostal původní stav.

`prevB = null; prevA = null` zajistí, že hned po importu se neprovede
`observe(stale_prev, fresh_curr)` s přechodem mezi dvěma nesouvisejícími
policies.

## Rozhodnutí: `bindKeys: false` opt-out pro testy

Runtime `createLiliBRuntime` teď `addEventListener('keydown', ...)`
při instanciaci. V testech (`runtimeTest`, `exportImportTest`) vzniká
víc runtime instancí, což by bez opt-outu pověsilo víc listenerů na
`document` → flaky test isolace.

`opts.bindKeys !== false` defaultně zapíná, opt-out `{ bindKeys: false }`
v testu vypne. Produkční `autoAttach` defaults na zapnuto.

## Rozhodnutí: `FileReader` + hidden `<input type="file">` pro import

Jednoduchý drag-and-drop zone nebo URL.createObjectURL(blob) parsing
by vyžadovaly UI. Hidden input + `.click()` programmaticky otevře
native file picker. Defer removal `setTimeout(..., 0)` kvůli Safari,
které v některých verzích potřebuje input ještě v DOM při propagaci
`change` eventu.

Žádný drop target, žádný custom UI — konzistentní se zero-deps
filozofií.

## Integrace

`window.LiliA` (lili.js):
- Přidáno `isDevMode: function () { return _devMode; }` na frozen
  exposition API
- Key handler: `if (k === 'e' && !e.shiftKey)` a `if (k === 'i' && !e.shiftKey)`

`window.LiliB` (lili-b.js):
- Version bump `phase8-stabilization` → `phase9-export`
- `runtime.exportBrain()` → payload objekt
- `runtime.downloadExport()` → payload + triggered download
- `runtime.importBrain(obj)` → bool
- `runtime.pickImportFile()` → opens file picker, async import
- Keydown listener gated na `LiliA.isDevMode() && e.shiftKey` pro E/I
- `detach()` sundá i keydown listener

## Test coverage

**exportImportTest** (new, 9 assertions):
- format === 'lili_b_export_v1'
- brain snapshot má správné schema
- runtime telemetrie má všechny číselné fieldy + stabilizer nested
- persistence meta obsahuje key + anchorCount
- JSON stringify → parse round-trip
- Dva runtimes s různými seedy mají různé váhy (preΔ = 1.46)
- Po import se váhy shodují na Float32 přesnost (postΔ = 0.00e+0)
- Bad payload (`format: 'wrong'`) → `importBrain` vrátí `false`,
  váhy beze změny (badDrift = 0)
- Raw snapshot path (přímý `lili-b-brain-v1` objekt) taky funguje

**Headless browser test (Playwright, manual):**
- Shift+E před dev-mode ON → ignored (žádný download event)
- Ctrl+Shift+L → dev mode ON
- Shift+E → `lili_b_export_20260419.json` stažen s platným payloadem
- `runtime.importBrain(downloadedPayload)` → `true`, round-trip end-to-end

**Plné výsledky (Node + headless Chromium, 12/12 PASS):**

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
rollbackTest: applied=true weightsRestored=true bufferFlushed=true ... — PASS
exportImportTest: format=true brain=true telem=true persistMeta=true
  roundTrip=true preΔ=1.46e+0 postΔ=0.00e+0 rejectBad=true rawSnap=true — PASS
tests: ALL PASS ✓
```

Velikost: 112 KB raw / ~31 KB gzipped (+14 KB raw / +3 KB gzip vs.
Fáze 8). Test kód stále zabírá velkou část — Phase 10 production
minify cíl 15 KB gzipped.

## Co NENÍ ve Fázi 9

- ❌ **Time-series telemetrie v exportu** — reward history, loss per
  decision, rollback event log (timestamps+sigmas) chybí, protože
  neexistují jako ring buffery. Phase 10 instrumentation to přidá;
  export potom dostane `history: { loss: [...], rollbacks: [...] }`.
- ❌ **CSV export** (Shift+Shift+E nebo jiná klávesa, podle briefu
  sekce 12) — odloženo na Phase 10, kde už budou time series.
- ❌ **Monthly snapshot scheduler** — brief říká "měsíční milestone
  snapshoty", ale Vercel Hobby nedovoluje server-side job. Phase 10
  design: uživatel dostane console notification jednou měsíčně
  "export time — stiskni Shift+E".
- ❌ **Shift+I jako cesta přes drag-and-drop** — zatím jen file
  picker. Drag-and-drop by vyžadoval viditelnou drop zone (UI),
  což by kolidovalo s fullscreen canvas.

## Integrity check — brief vs. implementace

| Brief požadavek | Implementace | OK |
|-----------------|--------------|----|
| Export vah (E klávesa, JSON download) | Shift+E, dev-mode gated | ✅ |
| Telemetrie v exportu: ε, rollback, trainSteps | runtime.{epsilon,rollbacks,trainSteps,...} | ✅ |
| On-demand = žádný server | `<a download>` trick, 100 % client-side | ✅ |
| Import route (restore z JSON) | Shift+I file picker → importBrain | ✅ |
| Neporušit Lili A | `isDevMode()` je read-only, Shift guard je routing-only | ✅ |

## Další kroky

**Fáze 10 — Instrumentation & production:**
- Loss per-decision ring buffer (lze hned exportovat v payload.history.loss)
- Rollback event log (timestamp, sigma, baseline, anchor age)
- Phantom vs real ratio delta over time (accumulator v runtime)
- Monthly snapshot reminder (console.info po 30 dnech od posledního exportu)
- Debug overlay hook (optional) — sdílet místo v Lili A debug panelu?
- **Minify pass:** strip tests, uglify identifiers, target 15 KB gzipped
- `.vercelignore` check — data/snapshots/ nesmí bloatovat deploy
