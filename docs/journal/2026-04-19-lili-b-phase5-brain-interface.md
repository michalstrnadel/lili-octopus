# Lili B — Phase 5: Brain Interface + State Assembly + Shadow Reward

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 5 / 10
**Status:** hotovo ✓

## Kontext

Navazuje na Fázi 3 (state exposition API v `lili.js`) a Fázi 4 (phantom
generator). Cíl: vystavět **Brain Interface** kompatibilní s patternem
Lili A (`chooseAction`, `observe`, `serialize`, `deserialize`), postavit
**state vektor** fixní dimenze pro DQN, a vyřešit napětí mezi briefy
v Sekci 3 ("nerozbít A") a Sekci 7 ("fair comparison reward").

## Konflikt brief: Sekce 3 vs Sekce 7

- Sekce 3: *"Žádná změna reward funkce A."*
- Sekce 7: *"Rozšíření reward funkce aplikuj na obě."*

### Rozhodnutí: shadow reward (cesta #2)

Reward funkce pro B je **čistá funkce** (`computeReward(prev, curr, other,
visitsBefore, bodyRadiusN)`) bez side effectů. Pro B vstupuje do DQN
tréninku jako normální TD target. Pro A se stejná funkce volá **jen na
logování** do samostatného localStorage klíče `lili_a_shadow_reward_log`
— nikdy nevstoupí do Q-table A, nikdy neovlivní A's policy.

**Dopad na Lili A:** žádný. Lili A zůstane netknutá (Sekce 3 splněna).
**Dopad na paper:** fair comparison metric dostupná retrospektivně
("jak by A hodnotila stejnou situaci podle B reward funkce"). Akademicky
je to silnější než limitace — je to feature.

## Rozhodnutí: `INPUT_DIM = 26`

State vektor pro DQN (Float32Array, fixní dimenze):

```
S_B = [
  // A observables (16)
  A.xn, A.yn,                     // 2 — normalized document coords
  A.vxNorm, A.vyNorm,             // 2 — velocity / 300 px/s, clamped -1..1
  A.stress,                       // 1
  A.phaseProgress,                // 1 — 0..1 within life phase
  A.phaseIdx / 4,                 // 1 — 0..1 across 5 phases
  A.mood[7],                      // 7 — one-hot encoded

  // Cursor (4)
  cursor.xn, cursor.yn,           // 2
  cursor.speed / 300,             // 1
  cursor.isPhantom,               // 1 — 0 or 1

  // B own (5)
  B.xn, B.yn, B.vxNorm, B.vyNorm, B.stress,

  // Relative (3)
  B.xn - A.xn, B.yn - A.yn,       // 2 — signed delta
  sqrt((B-A)²),                   // 1 — euclidean distance
]
```

**Proč one-hot mood místo skalárního indexu:** diskrétní kategorie bez
přirozeného ordinálního vztahu. NN by interpretoval `moodIndex=3` jako
"mezi curious a playful" — což neodpovídá sémantice. One-hot dává
7 nezávislých vstupů a NN si sám najde interakce.

**Proč signed delta + distance (3 dim) místo jen delta (2 dim):**
distance je invariantní k orientaci a NN se ho musí jinak učit ze dvou
komponent. Explicitní 3. dimenze mu dává shortcut pro "jak daleko jsem
od druhé Lili" bez nutnosti spočítat sqrt v hidden vrstvě.

**Normalizace velocity:** `MAX_SPEED_NORM = 300` px/s je heuristický
clamp — A běžně nedosáhne (wander ~60 px/s, flee ~200 px/s), ale robustní
proti outlierům. Výstup vektoru je v `[-1, 1]` po clampSym, což je
ideální pro He-inicializované ReLU sítě.

## `computeReward()` — čtyři komponenty

```
r = novelty + approach + stagnation + edge + stress_delta
```

### Novelty (pay-once-decay)

```
novelty = 0.5 / (1 + visitsBefore · 0.1)
```

- 32×32 grid nad normalizovaným viewportem (~1024 buněk)
- První návštěva: `0.5` (plná odměna)
- 10 návštěv: `~0.25`
- 100 návštěv: `~0.045`
- Asymptoticky → 0

Funkční i v 2 agentech: A a B mají **separátní grid** (`noveltyA`,
`noveltyB`), aby A nezasahoval B do explorace a naopak.

### Approach band (peak at ideal distance)

```
d = distance(curr, other)       // normalized 0..√2
minD = 2 · bodyRadiusN          // ~0.06 (default bodyR=0.03)
ideal = 0.12                    // ~12% of diagonal

if d < minD:       approach = -0.3                                    // overlap penalty
elif d < ideal:    approach = 0.3 · (d - minD) / (ideal - minD)      // linear ramp up
else:              approach = 0.3 · exp(-(d - ideal) · 6)            // soft decay
```

Odměnuje **blízkost bez kolize**. Při překryvu (<6% diag) aktivní
odpudivý signál −0.3. V ideálním pásmu (6–12% diag) plná odměna 0.3.
Za hranicí exponenciální pokles s half-distance ~11%. Důvod: chceme aby
agenti cítili svou přítomnost ale neslepili se.

### Stagnation + Edge

- Stagnation: −0.05 pokud speed < 0.002 (téměř zastavený) — prevence
  "degenerované policy" která se naučí stát na místě pro jistou nenulovou
  novelty v už navštívených buňkách.
- Edge: −0.05 ramped z hranice (5% margin) — B nemá rád okraje, stejně
  jako A ve své reward funkci.

### Stress delta

```
stress_bonus = (prev.stress - curr.stress) · 0.1
```

Malý symetrický bonus za klesající stres. Hodnota se dá v některých
krocích záporná, to je v pořádku — TD learning to vyvaží.

## Brain Interface API

```js
const brain = createLiliBBrain({
  seed: 12345,
  bodyRadiusN: 0.03,
  shadowKey: 'lili_a_shadow_reward_log',
  shadowFlushEveryN: 200
});

// Every tick (or every cooldown-gated tick):
const action = brain.chooseAction(aState, aWorld, cursor, bState, greedy);

// ... apply action, step B's kinematics to produce new bState ...

const { reward, shadow, train } = brain.observe(
  prevB, currB,                  // { xn, yn, speed, stress }
  prevA, currA,                  // same shape, or null
  aState, aWorld, cursor, bState,
  done, priorityFlag, canTrain
);

// Periodically:
brain.endEpisode();              // decays ε
brain.flushShadowLog();          // force persist

// Persistence:
const snap = brain.serialize();  // { schema, weights, epsilon, novelty, ... }
brain.deserialize(snap);
```

### Proč se `observe()` vrací `{reward, shadow, train}` a ne void

Integrační vrstva (Phase 6) bude potřebovat:
- `reward.total` pro debug overlay / tooltip
- `reward.components` pro explainability ("co B odměňuje teď nejvíc?")
- `shadow` pro renderování A's perspective metriky
- `train.loss` pro loss explosion detector (Fáze 8, Sekce 10 briefu)

Vracet to all at once místo dalších getterů drží API čisté a zero-alloc
hot path nezatěžuje (returning a small object is V8-friendly).

## Shadow logger design

### Buffered writes

Zápis do `localStorage` každý frame = bottleneck. Místo toho:
- Drží `cumulative`, `steps`, `recentSamples[100]` v RAM
- Flush každých 200 kroků (nebo na `brain.flushShadowLog()`)
- Při každém flush zapíše plný snapshot (ne append-only) — jednodušší
  schéma, menší riziko korupce

### Formát v localStorage

```json
{
  "schema": "v1",
  "cumulative": 1234.5678,
  "steps": 5000,
  "avgReward": 0.247,
  "recentSamples": [
    { "t": 12345, "r": 0.23, "c": {"novelty": 0.5, "approach": 0.15, ...} },
    ...100 položek...
  ],
  "flushedAt": 1712345678901
}
```

Ring buffer o 100 vzorcích stačí pro on-demand debug; akademická analýza
se dělá z exportu (Fáze 9 — klávesa `E`).

### Co shadow logger **není**

- **Není** persistovaná časová řada — jen rolling window
- **Není** alternativní Q-table pro A — nikdy se zpětně nevolí
- **Není** sdílený s Lili A kódem — A ani neví, že existuje

## State assembly — no alloc in loop

Všechny buffery pre-alokované při `createLiliBBrain()`:

- `prevStateBuf`, `nextStateBuf` — Float32Array(26)
- Novelty gridy — Uint32Array(1024)
- Shadow logger recent ring — fixní Array(100)
- DQN (z Fáze 2) — plný replay buffer 50k · 54 dim · 4 B = **10.8 MB**

10.8 MB je nad briefem (který počítal 50k × 20 × 4 = 4 MB), protože state
dim vyšel 26 místo odhadovaného 20, a replay schéma navíc ukládá
next_state (dvakrát state), action, reward, done, priority = `2·26 + 4 = 56`
floats per entry = 11.2 MB. Desktop OK. Mobile má být inference-only
(Sekce 5 briefu) → pro něj buffer ani nealokujeme.

**TODO Fáze 6:** implementovat mobile detekci a vynechat `createDQN`
replay allocation v `createLiliBBrain()` na mobilu.

## Test výsledky

```
[LiliB] brainInterfaceTest:
  steps=200              — 200 random-walk kroků
  totalReward=85.260     — pozitivní kumulativní (dominuje novelty)
  avgR=0.4263            — průměr per step
  actionRange=true       — všechny akce ∈ [0, 7)
  shadow=200/200         — A's shadow log zaznamenal každý krok
  avgShadow=0.3816       — A's shadow reward průměr (bez vlivu na Q-table)
  serialize=true         — snap → deserialize → greedy action matched
  pure=true              — identical inputs → identical output
  → PASS
```

Kompletní suite po Fázi 5:

```
[LiliB] gradientCheck:   6.1e-5                              PASS
[LiliB] xorTest:          0.0000 avg error after 10k steps   PASS
[LiliB] gridWorldTest:    reached goal in 6 steps (optimal)  PASS
[LiliB] phantomTest:      activated, oob=0, smooth exit      PASS
[LiliB] brainInterfaceTest: 200 steps, shadow=200/200         PASS
[LiliB] tests: ALL PASS ✓
```

## Velikost

```
lili-b.js:  52 001 B raw
             14 715 B gzipped  (74 % budget 20 KB → 5.3 KB rezerva)
```

Fáze 6 (render layer) dobere ~3–4 KB (chromatofory, tentacle render).
Fáze 8 (stabilizační sada) přidá ~2–3 KB (anchor snapshot logic, loss
detector). To by nás mělo zastavit kolem 18 KB gzipped — pohodlně pod
20 KB budgetem.

## Co NENÍ v této fázi

- ❌ **Žádná integrace s `window.LiliA`** — brain je čistě computational.
  Phase 6 (render) a Phase 7 (glue layer v HTML / auto-init) napojí
  `brain.chooseAction(LiliA.getState(), LiliA.getWorld(), ...)`.
- ❌ **Žádné B kinematics** — state B (`bState`) je parametr, ne
  interní. Phase 6 dodá fyziku (seek/wander/bound kolem A, trailing).
- ❌ **Žádné stabilizační mechanismy** (anchor, rollback, lr schedule) —
  ty přijdou ve Fázi 8 dle briefu Sekce 10.
- ❌ **Žádný persistence layer na disk** — `brain.serialize()` vrací
  JSON, ale neukládá ho. Phase 7 přidá `localStorage` wrapper s
  rotací (key: `lili_b_weights`).

## Fair comparison — final wording pro paper

> *"Lili B optimizes a reward function R(·) = novelty + approach +
> stagnation + edge + Δstress. The same function is computed over
> Lili A's trajectory at every step and logged to a separate
> `localStorage` channel, never feeding back into A's Q-table.
> This gives us a retrospective fairness metric: expected return under
> B's reward function for both agents, without modifying A's learning
> dynamics."*

Tímto se eliminuje námitka "B má privilegované rewards". A i B jsou
v identickém prostředí (stejný canvas, stejný kurzor, stejné DOM,
stejné wall-clock fáze ontogeneze) — liší se **jen** v architektuře
a v tom, co každý optimalizuje. Shadow log překládá optimalizaci B do
B's metriky pro A retrospektivně.

## Další kroky

**Fáze 6 — Render layer:**
- Chladné chromatofory (modrá/fialová/tyrkysová)
- Stejná velikost jako A, oddělený `ctx.save/restore`
- Registrace přes `window.LiliA.onAfterRender(renderLiliB)` (Fáze 3 hook)
- Kinematics wrapper: steering behaviors podle vybrané action/mood
- Mobile: inference-only path (žádný replay buffer, žádný training)

**Fáze 7 — Persistence + auto-init:**
- `localStorage` key `lili_b_weights` + rotace (current + 3 anchors)
- Auto-init v `DOMContentLoaded`, napojení na `window.LiliA` když ready
- Graceful degradation když LiliA nenačtena
