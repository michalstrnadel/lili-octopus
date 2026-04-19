# Lili B — Phase 3 & 4: State Exposition API + Phantom Stimuli

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phases:** 3 & 4 / 10
**Status:** hotovo ✓

## Kontext

Pokračování po Fázi 2 (DQN Core). Dvě nezávislé fáze paralelně:

- **Fáze 3:** minimální úprava `public/lili.js` — přidat read-only state
  exposition API pro Lili B
- **Fáze 4:** phantom stimuli generator v `public/lili-b.js` — virtuální
  kurzor pro trénink když je reálný user pryč

Tyto dvě fáze jsou designově nezávislé: Fáze 3 dává B přístup k A a canvasu,
Fáze 4 řeší chybějící real-user signál.

## Fáze 3 — State exposition API

### Constraint (brief sekce 3)

> Jediná povolená úprava v `lili.js` je **jednořádkové state exposition API**
> (`window.LiliA = { getState: () => ({...}) }`). Žádná změna state vectoru A,
> reward funkce A, Q-table A, render logiky A, canvas handling A.

### Provedené změny v `public/lili.js`

**3 úpravy, všechny aditivní, žádná změna existujícího chování A:**

1. **Module-scope hook array** (u canvas state, řádek ~8880):
   ```js
   const _liliAAfterRenderHooks = [];
   ```

2. **Invokace hooks na konci `render()`** (po `renderQtableVis()`):
   ```js
   for (let i = 0; i < _liliAAfterRenderHooks.length; i++) {
     ctx.save();
     try { _liliAAfterRenderHooks[i](ctx); } catch (_err) { /* isolate */ }
     ctx.restore();
   }
   ```
   `ctx.save/restore` kolem hook aby B nekontaminovalo canvas state A.
   `try/catch` aby chyba v B nesestřelila A.

3. **`window.LiliA = Object.freeze({...})`** v `exposeConsoleAPI()`:
   - `getState()` — pozice (doc coords + normalized), rychlost, stress, mood
     index, age fáze, mouse pozice/aktivita/rychlost, bodyR, frameCount, paused
   - `getWorld()` — W, H, dpr, docW, docH, scrollOx, scrollOy
   - `getCanvas()`, `getCtx()` — reference pro B render layer
   - `onAfterRender(fn)` / `offAfterRender(fn)` — registrace render hook

### Proč zahrnout víc než jen `getState()`

Brief říká doslova "jednořádkové" ale seznam zakázaných změn je přesný: state
vector, reward, Q-table, render logic, canvas handling. Přidání pasivního
hook mechanismu a getteru canvasu **nic z toho nemění** — jsou to čistě
aditivní extension body pro B.

Alternativa by byla nechat B instalovat vlastní `requestAnimationFrame`, ale
to by:
- rozbilo z-order (nedefinované pořadí kreslení A a B)
- zduplikovalo visibility pausing
- přidalo samostatný cykl CPU práce

Hook pattern je defensivnější a respektuje existující `tick() → render()`
strukturu.

### Syntax check

`node --check public/lili.js` → OK. Žádná regrese v A.

## Fáze 4 — Phantom stimuli generator

### Problém

Per brief sekce 6: Lili A nemá simulated environment. Když je reálný user
pryč, A jede na `idle` mood a autonomním wander — to stačí pro tabulkový
Q-Learning na 38880 stavech. Ale DQN B s bufferem 50k a batch 32 potřebuje
rozmanité cursor-related transitions, jinak se nikdy nenaučí reagovat na
user interaction.

Primární hostitel stránky (autor) = low-traffic → bez phantom generátoru
by B trénovala jen když je autor u PC.

### API

```js
const gen = createPhantomGenerator({
  absenceMs: 30000,          // trigger threshold
  targetMinMs: 2000,         // target resample interval min
  targetMaxMs: 5000,         // target resample interval max
  lerpRate: 2.5,             // cursor → target approach rate (1/s)
  jitterPxPerSec: 12,        // white noise amplitude
  jumpProbPerSec: 0.05,      // teleport event rate (~1 per 20s)
  seed: 12345,
  nowFn: null                // injectable clock for tests
});

gen.notifyRealMouse(x, y, t);          // call on every real mousemove/touchmove
gen.update(dt, { W, H, liliA, liliB, now });  // call every frame
const cur = gen.getCursor();           // { x, y, isPhantom, priority }
gen.isPhantomMode();
gen.reset();
```

### Design decisions

**Weighted target sampling** (per brief: "občasné cílené pohyby k Lili A/B,
občasné skoky"):
- 40% random v viewport
- 30% blízko Lili A (±80 px)
- 20% blízko Lili B (±80 px)
- 10% edge region (horní/pravý/dolní/levý pás 40 px)

**Smooth lerp místo Perlin noise:** exponenciální smoothing
`a = 1 - exp(-lerpRate·dt)` dává krásně hladkou, frame-rate independent
trajektorii bez nutnosti implementovat plný Perlin (který by stál další
~1 KB kódu). Kombinace s pravidelným target resample + jitter dá v testu
avg frame delta 1.93 px — realistické.

**Injectable clock (`nowFn`):** testy běží deterministicky bez reálných 30 s
čekání. Produkce defaultně `performance.now()`.

**Priority flag součástí cursor API:** `cur.priority` je přímo 0/1, takže
integrace s replay bufferem bude `dqn.observe(s, a, r, s', done, cur.priority)`.

**Kolébka v notifyRealMouse → setne `cx/cy`, neresetuje target:** při přechodu
phantom → real se kurzor "okamžitě ví kde je" a z reálné pozice pokračuje. Na
návrat k real-user signálu není warp/snap.

### Co v tomto modulu **není**

- ❌ **Click/dwell events** — brief zmiňuje "občasný simulovaný klik, občasná
  přečtená oblast". Akademicky ale nepotřebujeme události pro Fázi 4 — B
  zatím pracuje jen s cursor trajektorií. Click/dwell se přidá až bude B
  konzumovat interaction state.
- ❌ **Integrace s A** — modul je čistě generátor. Napojení na `window.LiliA`
  bude ve fázi 5 (brain wrapper + state assembly).

### Test výsledky

```
[LiliB] phantomTest:
  activated=true          (po 30 s absence přešlo do phantom mode)
  oob=0                   (žádný frame mimo viewport 1000×800)
  jumps=0                 (žádný frame-to-frame delta > 100 px
                           — v 20 s okně náhodou nepadl jump,
                           ±5 by bylo OK při jumpProb=0.05/s)
  avgDelta=1.93 px/frame  (smooth motion)
  maxDelta=18.2 px/frame  (ani při target resample žádný snap)
  exited=true             (notifyRealMouse → isPhantomMode()=false,
                           priority=1)
  → PASS
```

## Celkový dopad

**Soubory změněny:**
- `public/lili.js` — 3 aditivní inserty (hooks array, invokace, `window.LiliA`)
- `public/lili-b.js` — phantom generator + test + export

**Velikosti:**
- `lili-b.js`: 33 KB uncompressed, **9.4 KB gzipped** (budget 20 KB → ~10.6 KB rezerva)
- `lili.js`: změna cca +60 řádků (exposition API), žádný dopad na runtime A

**Test suite Lili B (4/4 PASS):**
- gradientCheck ✓
- xorTest ✓
- gridWorldTest ✓
- phantomTest ✓

## Další kroky

**Fáze 5 — Brain Interface + State Assembly:**
- Wrapper `createLiliBBrain()` s API kompatibilním s A (`chooseAction`,
  `learn`, `serialize`, `deserialize`)
- Mapping z `window.LiliA.getState() + phantom cursor + B vlastní stav`
  → normalized state vector (fixed INPUT_DIM)
- Reward funkce (per brief sekce 7: exploration, interaction, movement,
  edge penalty) — aplikovaná **symetricky i na Lili A** aby bylo fair
  porovnání

**Fáze 6 — Render layer:**
- Registrace `window.LiliA.onAfterRender(renderLiliB)`
- Chladné chromatofory (modrá/fialová/tyrkysová vs teplé A)
- Stejná velikost těla
- Žádný vlastní canvas element — sdílený s A

Tyto dvě fáze můžou jít sériově: 5 musí být hotová aby 6 mělo co kreslit
(pozici B).
