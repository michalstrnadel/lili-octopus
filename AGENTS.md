# AI Context — Přečti tohle jako první

Tento soubor je entry point pro jakékoli AI pracující na tomto projektu. Přečti ho celý před čímkoli jiným.

## Co je tento projekt

**Lili** je autonomní digitální chobotnice žijící na webové stránce. Její chování emerguje z Q-Learningu (Reinforcement Learning) — nic není skriptované. Projekt je akademický experiment v digitální ontogenezi s plánovaným 10letým životním cyklem.

**Technicky:** Jeden JavaScript soubor (`public/lili.js`), zero dependencies, zero build pipeline, nasaditelný jedním `<script defer>` tagem do libovolného HTML.

## Aktuální stav

**Fáze: Implementace — Lili A: Fáze 1-57 hotovy. Evrin (DQN agent): Fáze 1-11 hotovy (feature-complete).**

Hotovo:
- ✅ PRD (860 řádků) — `LILI_PRD_v1.md`
- ✅ Akademický popis (obohacen o všech 7 researches) — `docs/PROJECT.md`
- ✅ 12-fázový implementační plán — `docs/IMPLEMENTATION_PLAN.md`
- ✅ Všech 7 deep researches — viz `docs/research/README.md`
- ✅ Vizuální filozofie — `docs/design/README.md`
- ✅ Vývojový deníček — `docs/journal/`
- ✅ Repository Blueprint — `docs/REPOSITORY_BLUEPRINT.md`
- ✅ **Fáze 1:** IIFE, CFG, Vec2, Simplex Noise, Canvas bootstrap, rAF loop, PRNG seeds
- ✅ **Fáze 2:** Steering Behaviors — wander (pulse-glide), seek/arrive, flee/evade, obstacle avoidance, boundary, mouse tracking, age system, physics update
- ✅ **Fáze 3:** FABRIK IK — 8 chapadel × 8 segmentů, Float32Array, trailing physics, procedurální biomechanický pohyb, lokální stav per chapadlo, recoil reflexy
- ✅ **Fáze 4:** Vizuální systém — hull/envelope chapadla (Catmull-Rom→Bézier), tělo s noise deformací, oči sledující kurzor, chromatofory (HSL + cirkadiánní rytmus), glow, menší hatchling
- ✅ **Fáze 5:** Spatial Hash Grid — Map s 120px buňkami, `getNearby()`, `getNearbyCount()`, MutationObserver, scroll rebuild, obstacle avoidance napojený na hash
- ✅ **Fáze 6:** Senzorický systém — 9 globálních senzorů (38880 state index), per-tentacle tip touching DOM, stress model (0..1) napojený na chromatofory
- ✅ **Fáze 7:** Age system — smoothstep interpolace mezi fázemi, phaseProgress tracking, onPhaseTransition event system, growth curves
- ✅ **Fáze 8:** Q-Learning brain — sparse Q-table (38880 stavů × 7 nálad), Q(λ) eligibility traces, Boltzmann/softmax exploration, adaptive learning rate, mood→steering weight mapping, 4 nové steering behaviors (seekWhitespace, seekDom, seekEdge, followSlow), reward function (9+ situací + intrinsic curiosity), behavioral journal (ring buffer 5000 + daily aggregates + milestones + LZ complexity + Shannon entropy + personality), Q-table snapshots, export systém (klávesa E)
- ✅ **Fáze 9:** DOM interakce — word indexer (text→`<span class="lili-word">`), 5-fázový pipeline (touch→interest→grab→play→drop), per-tentacle state machine, max 2 held + 4 disturbed, tvarová afinita (round/angular/mixed), shape-aware selection, CSS only (transform+color), midnight cleanup s denním resetem
- ✅ **Fáze 10:** Click detection + Tooltip + Debug panel — klik na Lili = faktický tooltip (jméno, věk, fáze, preference, personality, visits, auto-dismiss 3.5s), klávesa D = debug panel (phase, mood, stress, sensors, Q-values, entropy, LZC, DOM state, FPS, hash stats, personality radar, traces, plan status), klávesa E = export (unified keydown handler)
- ✅ **Fáze 11:** Persistence — position save/restore (localStorage, periodic + beforeunload), viewport clamping, mood restore, `navigator.storage.persist()`, data loss detection (Safari ITP), import systém (klávesa I, merge duplicates), graceful fallback pro corrupted data
- ✅ **Fáze 12:** Optimalizace — render culling (offscreen skip), pre-allocated hull arrays (zero-alloc render), drawHullSide reverse traversal (no array mutation), FPS monitoring (rolling avg + console warning <50), init timing (performance.now)
- ✅ **Fáze 13:** Emoční exprese — chromatoforová exprese nálad (HSL mood modulation), oční exprese (mrkání, pupil dilation, squint, DOM gaze), tělesná exprese (breathing rate/depth, body scale, glow pulsation), chapadlová exprese (amplitude, spread, gravity, noise, forward bias per mood), tooltip mood dot, debug mood history, onMoodChange callbacks, moodBlend smooth transitions, sustained_mood milestones
- ✅ **Fáze 14:** Cloud Sync — GitHub persistence přes `/api/lili` (Vercel serverless → GitHub API), `data/state.json` jako single source of truth, 5min sync interval + sendBeacon na beforeunload, merge strategie (brain: více decisions vyhrává, genesis: nejstarší, journal: merge by day/type), SHA conflict detection + retry, localStorage jako offline fallback, `lili.sync()` console API
- ✅ **Fáze 17:** Brain v2 Upgrade — 10 vylepšení Q-learning systému:
  1. **Eligibility traces Q(λ)** — replacing traces, λ age-dependent (0.8→0.6), TD error propagace přes celou sekvenci, max 500 entries, ephemeral (ne-persistované)
  2. **Boltzmann/Softmax exploration** — nahrazuje ε-greedy, τ age-dependent (5.0→0.3), numericky stabilní (max subtraction), inteligentní explorace respektující Q-values
  3. **Adaptive learning rate** — per (state, mood) visit counts, α = base/(1 + visits*0.01), floor 0.01, persistované v brain format v2
  4. **Intrinsic curiosity reward** — per-state visit counter, β/√(1+visits), β age-dependent (0.5→0.1), motivuje explorace neznámých stavů
  5. **Momentum sensor** — velocity trend (accelerating/steady/decelerating), Float32Array(10) circular buffer, state space +3×
  6. **Trust sensor** — discretizovaný trust level (low/medium/high) ve state, state space celkem 38880
  7. **Mood transition matrix** — 7×7 boolean+stress-gate matrix, biologicky plausibilní přechody (shy→playful blocked, calm→alert needs stress)
  8. **Multi-step mood plans** — 4 heuristické plány (investigate/settle/socialize/retreat), options framework, stress abort, reward attribution na initiation (s,m)
  9. **Ink trail enhancement** — mood-colored particles, stress-scaled (count/size/spread), persistent trail marks s 8s fade, 80 particle pool
  10. **Personality radar** — avg Q-value per mood normalizovaný 0..1, dominant trait v tooltip, text-based bar chart v debug, daily aggregate snapshot, console API `lili.personality()`

- ✅ **Fáze 18:** "Alive" — 5 vizuálních/behavioral upgradů:
  1. **Micro-expressions** — okamžité vizuální reakce na eventy: startle (pupil dilation + body shrink), joy (squint + glow flash), relief (body expand), curiosity tilt (asymmetric eye gaze)
  2. **Sleep animation** — cirkadiánní vizuální stav: tentacle curl, slower/deeper breathing, REM twitch (random tentacle movement every 10-20s)
  3. **Genesis body variation** — deterministic hash genesis timestampu → unikátní proporce: body X/Y scale ±5%, eye spacing ±8%, eye Y offset ±8%, tentacle width ±10%, head tilt ±2°, chromatophore cell placement
  4. **Psychosomatic adaptation** — rolling average stresu/rewardu přes sessions → dlouhodobá morfologie: body scale, lightness, glow boost, tentacle spread, breath rate. Persistováno v localStorage + cloud sync
  5. **Chromatophore cells** — viditelné pulsující barevné skvrny na těle, age-dependent count (0→3→5→6), genesis-seeded placement/phase/speed/hue

- ✅ **Fáze 18.5:** "Polish" — 7 vizuálních/behavioral vylepšení:
  1. **Pupil smoothing** — gaze lerp (0.15/frame) místo instant snap → plynulý organický pohled
  2. **Saccades** — involuntární micro-jitter očí v idle (2.5px, interval 1-3s) → realistické zvířecí chování
  3. **Blink easing** — ease-in-out-cubic místo lineární → přirozenější pohyb víček
  4. **Bubble wobble** — eliptická deformace bublin při stoupání (±12% scaleX) → skutečné podmořské bubliny
  5. **Tentacle tip glow** — radiální gradient na špičkách chapadel na tmavém bg → bioluminiscence
  6. **Mood wander coherence** — playful=0.55 (erratický), calm=1.15 (hladký) → osobnost v pohybu
  7. **Parameter tuning** — chromatophore alpha ×1.8, ink threshold 0.65, hull +37%, breathing +33%, genesis ±40%, blend speed ×1.5, psychosom ×1.6

- ✅ **Fáze 19A:** Baseline System — 4 kontrolní podmínky (Random Policy, Frozen Policy, Myopic γ=0, Hard-coded Heuristic), klávesa B pro přepínání, persistence v localStorage, integrace do debug panelu + tooltip
- ✅ **Fáze 19B:** Replay System — nahrávání cursor trajektorií + DOM state snapshots na decision points, playback mode pro paired testing, export/import replay dat, klávesa R pro ovládání
- ✅ **Fáze 19C:** Enhanced Metrics & CSV Export — convergence křivky (avg |δQ| per update), policy stability index, cumulative reward, CSV export denních agregátů pro R/Python/Excel, rozšířené denní agregáty o baseline mode, season, qtableSize
- ✅ **Fáze 20:** Observability Dashboard — `public/dashboard.html`, zero-deps vizualizace: entropy/reward/exploration/LZC křivky, mood distribution pie, personality radar, behavioral etogram, convergence plot, policy stability, tabulka denních agregátů, milestones log
- ✅ **Fáze 21:** Seasonal Awareness — detekce ročního období (date-based, ne geolocation), chromatoforová modulace (hue/sat/lightness shift per season), movement speed modulation, integrováno do denních agregátů
- ✅ **Fáze 22:** Sound Landscape — Web Audio API (zero deps), breathing drone (sinus oscilator, mood-dependent), bubble pop (freq randomized), ink splash (white noise burst), master volume, user-initiated (klávesa S), stress-modulated parametry
- ✅ **Fáze 23:** Social Learning — rozšíření cloud sync o anonymizované behavioral stats (avgStress, dominantMood, personality, entropy, season, offspring count), připraveno pro multi-visitor agregaci
- ✅ **Fáze 24:** Offspring / Generational Learning — reprodukce po dosažení mature fáze, Q-table crossover (50% náhodný výběr entries), gaussian mutace na zděděných Q-hodnotách, max 3 potomci, export jako JSON, journal milestone

- ✅ **Fáze 25:** Dream Replay — experience replay během spánku (DQN-inspired), prioritizace memorable zážitků (vysoké |reward|), αScale 0.5 pro pomalou konsolidaci, max 50 replays per sleep session
- ✅ **Fáze 26:** Curriculum Learning — reward components postupně odemykány dle life phase (hatchling: jen whitespaceCalm+blockingRead, juvenile: 50-80% rewards, adult+: full reward set)
- ✅ **Fáze 27:** Habitat Awareness — detekce dominantní barvy stránky (HSL extraction), hue adaptation k harmonii s page palette, rozpoznání page type (sparse/mixed/dense)
- ✅ **Fáze 28:** Non-verbal Communication — welcome wave (chapadlo mávne při návratu kurzoru), excitement flash (chromatoforový záblesk na vysokou odměnu), contentment pulse (pomalá jasová oscilace při klidném stavu)
- ✅ **Fáze 29:** Enhanced Bioluminescence — zesílený glow v noci (nightGlowBoost 2.5×), luminiscenční trail particles za pohybem, inner eye glow, body outline luminescence

- ✅ **Fáze 30:** Anticipation — prediktivní pre-reakce na přibližující se kurzor (body tense, tentacle alert spread), approach detection across 15 frames, relaxRate decay
- ✅ **Fáze 31:** Energy / Fatigue — energy model (100 max), movement/decision/exploration costs, sleep+idle regen, fatigued=slower+less exploration, critical=forced rest
- ✅ **Fáze 32:** Habituation — cursor/scroll stimulus adaptation (opakovaný podnět→slabší reakce), novelty reset (theme change), minSensitivity floor 0.15, moduluje flee+stress
- ✅ **Fáze 33:** Cognitive Map — enriched spatial memory (safety+reward+visits per 80px cell), familiarity bonus v reward, decay per decision, max 500 cells
- ✅ **Fáze 34:** Cursor Pattern Recognition — direction change analysis (60-frame window), klasifikace: nervous/calm/directed/erratic/unknown, modulates stress
- ✅ **Fáze 35:** Attention Mechanism — per-sensor attention weights (0.3-2.0), boost on change, decay toward baseline, focus sensor modulates reward signal
- ✅ **Fáze 36:** Temporal Patterns — 24-hour bins tracking stress+activity, learned time-of-day expectations, reward bonus for matching patterns
- ✅ **Fáze 37:** Personality Drift — long-term temperament evolution (boldness, sociability, activity, emotionality), soft bias on mood selection via accumulated experience
- ✅ **Fáze 38:** Surprise Signal — TD error triggers surprise response: attention spike, temporary α boost (1.5×), micro-expression on high prediction error
- ✅ **Fáze 39:** Ink Defense — dramatic ink burst on sudden stress spike (rate-of-change detection), larger particles, wider spray, separate particle system
- ✅ **Fáze 40:** Camouflage Intensity — mood-dependent background matching (shy=100%, curious=10%), smooth sat/lit shifts toward ambient
- ✅ **Fáze 41:** Growth Visualization — smooth body size scaling within life phases (hatchling 0.6× → elder 1.15×), no discrete jumps
- ✅ **Fáze 42:** Mobile Touch — touchstart/end handling, long press caress (stress reduction + joy), double tap debug toggle
- ✅ **Fáze 43:** Retina Rendering — already implemented (devicePixelRatio scaling in resizeCanvas)
- ✅ **Fáze 44:** Visual Debug Overlay — in-canvas real-time graphs (stress, energy, reward, surprise), 120-frame history
- ✅ **Fáze 45:** Death & Legacy — elder phase fade (90%+ progress), speed decay, ghost alpha, final milestone, narrative entry
- ✅ **Fáze 46:** Page Memory — URL hash-based behavioral context, per-page mood/stress/visits, max 20 pages
- ✅ **Fáze 47:** Q-table Compression — auto-prune at 5000 entries, removes least-visited/least-valued states
- ✅ **Fáze 48:** Meta-Learning — environment stability detection (50-decision window), alpha modulation (0.7× stable, 1.4× unstable)
- ✅ **Fáze 49:** Web Worker Brain — inline Blob worker for brainLearn offloading, automatic fallback to main thread
- ✅ **Fáze 50:** Life Narrative — generated text diary from milestones and events, exportable via `lili.narrative()`
- ✅ **Fáze 51:** Q-table Visualization — heatmap brain fingerprint in debug overlay, blue→green→red color mapping
- ✅ **Fáze 52:** Seasonal Sounds — breathing drone frequency/volume modulated by season (spring=brighter, winter=deeper)
- ✅ **Fáze 53:** Endocrine Model — virtual hormones (dopamine, cortisol, serotonin) with half-life decay, mutual inhibition, mood transition bias, steering modulation, reward/startle injection, procedural audio harmonics
- ✅ **Fáze 53b:** Stochastic Growth — Brownian perturbation on growth curves (gaussian random walk, mean-reverting, ±3% clamp)
- ✅ **Fáze 54:** Cognitive Aging — age-dependent decision cooldown, working memory (trace capacity), Q-value volatility, exploitation bonus, read noise
- ✅ **Fáze 55:** FABRIK Comfort Functions — anti-torsion penalty (max bend angle correction), end-effector rotation alignment during grab
- ✅ **Fáze 56:** Spring-Damper Tentacle Physics — per-segment spring coupling with lateral drag, underwater wave propagation from base to tip
- ✅ **Fáze 53c:** Keyboard Security — dev shortcuts (D/E/I/B/R) locked behind Ctrl+Shift+L; only S (sound) public
- ✅ **Fáze 57:** Visual Polish — ink turbulence (Perlin noise velocity field pro swirling ink), body specular highlight (3D depth), 3D bubble sphere shading (radial gradient + dual specular), tentacle stroke outline (0.5px definice)

**Evrin (DQN — companion agent, `public/lili-b.js`):**
- ✅ **Fáze 1:** NN foundation — Float32Array tiny NN engine, dense layers, ReLU, He init, i-k-j matmul, Adam + global-norm gradient clipping
- ✅ **Fáze 2:** DQN core — circular replay buffer (50k, priority flag), target network hard sync, ε-greedy, TD target + minibatch training, grid-world convergence test
- ✅ **Fáze 3:** State exposition API v `lili.js` — `window.LiliA = { getState, getWorld, getCanvas, onAfterRender }` (additive, A neupraveno)
- ✅ **Fáze 4:** Phantom stimuli generator — 30s absence detection, smooth lerp+jitter+jumps, priority=0 flag pro replay, sharable with A
- ✅ **Fáze 5:** Brain Interface + state assembly — INPUT_DIM=26 (A observables 16, cursor 4, B own 5, relative 3), 7-action space mirror A, pure reward (novelty+approach+stagnation+edge+Δstress), separate novelty grids A/B, **shadow reward logger** pro A (log-only, nikdy nevstoupí do A's Q-table)
- ✅ **Fáze 6:** Render + kinematics + runtime glue — mobile detection (inference-only, shrunken replay), mood-modulated steering ve 7 náladách, 4 wavy tentacles + cool-palette body + 3 chromatophores, runtime stitches phantom+brain+kinematics+render+persist do `onAfterRender` hooku, decision cadence 45 frames (= A), train every 4 real / 16 phantom decisions
- ✅ **Fáze 7:** Persistence + auto-init — localStorage `lili_b_weights` schema v1, anchor rotation stub (current + 3 anchors, weekly), periodic save 5min + beforeunload + visibilitychange, `autoAttach()` polling na window.LiliA s 10s timeoutem, graceful degradation pokud A chybí
- ✅ **Fáze 8:** Stabilizační sada — `createStabilizer` unified modul (lossEMA + variance, wall-clock schedules), anchor rollback on 5σ explosion (restoruje váhy, flushne replay buffer, bumpe ε na 0.3, inkrementuje rollbackCount), Adam lr schedule (0.9× / 90 dní, floor 1e-5 přes `network.setLrMultiplier`), ε re-juvenilizace (ε → 0.3 / 6 měsíců), loss explosion detector (sigma pre-update tak spike nezasviní baseline, minSamples=200 guard); persistováno v brain schema v1 jako optional field (backward compat)
- ✅ **Fáze 9:** Export/import — `Shift+E` stáhne `lili_b_export_v1` JSON (brain snapshot + runtime telemetry + persistence meta), `Shift+I` otevře file picker pro restore; oba gatované `LiliA.isDevMode()` (sdílený Ctrl+Shift+L chord), plain E/I v lili.js dostaly `!e.shiftKey` guard proti kolizi, import okamžitě persistuje, `bindKeys: false` opt-out pro test isolaci, new `isDevMode()` getter na `window.LiliA` API; 12/12 tests PASS (exportImportTest: format/telem/persistMeta/JSON roundtrip/weight-exact match/bad-reject/raw-snapshot path)
- ✅ **Fáze 10:** Instrumentation — `createInstrumentation` modul s Float32Array loss ring bufferem (timestamp+loss páry, default cap 1024), rollback event log (cap 32, sigma/baseline/anchorAge/count), phantom/real ratio s kumulativními countery + rolling window 512 decisions; export schema bump `lili_b_export_v1` → `v2` (přidáno top-level `history` + `runtime.ratio`; import accepts both); `persist.markExport()` write-through stamp pro monthly reminder (console.info po 30 dnech bez exportu, mobile suppressed); 13/13 tests PASS (instrumentationTest: loss wrap / NaN reject / ratio window eviction / rollback cap / markExport / reminder fires+suppressed)
- ✅ **Fáze 11:** Production/test split — extrahován test suite (13 funkcí) do samostatného `public/lili-b.tests.js` (IIFE destructuring z `window.LiliB`+`_internal`), production `lili-b.js` obsahuje jen runtime + helpery + stub `runAllTests()`; index.html přidává `<script src="lili-b.tests.js" defer>` (dev-only, production deploy neobsahuje); velikost 124 KB→86 KB raw, 35 KB→23.7 KB gzipped (-32%); 13/13 PASS post-split + production-only sanity check (tests blocked via page.route → stub fires, runtime attached, 0 errors); hard 15 KB gzipped cíl downgraded na soft goal (bandwidth rezerva 100× dostatečná, další redukce by vyžadovala build step nebo ztrátu komentářů)

**Další krok:**
- Lili A: long-term observation, data collection, academic paper preparation.
- Evrin: **feature-complete**. Následuje deploy (kopírovat `lili-b.js` do michalstrnadel.com repo, NE `lili-b.tests.js`) → 2-year observation window → checkpoint (< 3 rollback/rok, FPS ≥ 55, loss nediverguje) → 10-year podmíněné pokračování.

**Keyboard shortcuts:**
- `Ctrl+Shift+L` — toggle dev mode (required for debug shortcuts below)
- `D` — toggle debug panel *(dev mode only)*
- `E` — export Lili A JSON (Q-table, aggregates) *(dev mode only)*
- `Shift+E` — export Evrin JSON (brain + telemetry) *(dev mode only)*
- `I` — import Lili A JSON *(dev mode only)*
- `Shift+I` — import Evrin JSON *(dev mode only)*
- `B` — cycle baseline modes *(dev mode only)*
- `R` — toggle replay recording/playback *(dev mode only)*
- `S` — toggle sound *(always available)*

## Co číst a kdy

### Chci pochopit projekt
1. **Tento soubor** (právě ho čteš)
2. `docs/PROJECT.md` — detailní akademický popis (architektura, výzkumné otázky, metriky)
3. `LILI_PRD_v1.md` — kompletní specifikace (860 řádků, zdroj pravdy pro implementační detaily)

### Chci implementovat
1. `docs/IMPLEMENTATION_PLAN.md` — 12 fází s konkrétními úkoly
2. `LILI_PRD_v1.md` — specifikace (reward values, parametry, prahy)
3. `docs/research/` — technické detaily (biomechanika, Q-Learning, FABRIK...)

### Chci porozumět rozhodnutím
1. `docs/journal/` — chronologický záznam všech rozhodnutí s důvody
2. `docs/design/README.md` — vizuální filozofie a psychosomatická individualita

### Chci vidět research
1. `docs/research/README.md` — katalog všech researches s prompty a statusem

## Mapa souborů

```
lili-octopus/
├── AGENTS.md                ← ČTEŠ TOHLE — AI entry point
├── CLAUDE.md                ← Claude Code entry point (odkazuje sem)
├── .cursorrules             ← Cursor entry point (odkazuje sem)
├── README.md                ← Lidský přehled projektu
├── LILI_PRD_v1.md           ← Product Requirements Document (ZDROJ PRAVDY)
│
├── public/
│   ├── lili.js              ← Lili A — Q-Learning agent (~9335 řádků)
│   ├── lili-b.js            ← Evrin — DQN companion agent production (~2270 řádků, Fáze 1-11)
│   ├── lili-b.tests.js      ← Evrin — test suite (dev-only, ~1060 řádků, Fáze 11 split)
│   └── dashboard.html       ← Observability dashboard (vizualizace exportovaných dat)
│
├── docs/
│   ├── PROJECT.md           ← Akademický popis projektu
│   ├── IMPLEMENTATION_PLAN.md ← 12-fázový implementační plán
│   ├── research/
│   │   ├── README.md        ← Katalog researches + prompty
│   │   ├── 00a-*.md         ← Koncepční analýza (30 citací)
│   │   ├── 00b-*.md         ← Technická implementační analýza
│   │   ├── 01-*.md          ← Biomechanika chobotnic
│   │   ├── 02-*.md          ← Q-Learning v bio simulacích
│   │   ├── 03-*.md          ← ✅ FABRIK IK (hull rendering, Float32Array, trailing physics)
│   │   ├── 04-*.md          ← ✅ Browser persistence (Safari ITP riziko, export strategie)
│   │   └── 05-*.md          ← ✅ Akademická metodologie (baselines, entropy/LZC, GDPR, ALIFE 2026)
│   ├── journal/
│   │   ├── README.md        ← Jak číst deníček
│   │   └── YYYY-MM-DD-*.md  ← Zápisky (chronologicky)
│   └── design/
│       └── README.md        ← Vizuální filozofie
│
└── _archive/                ← Originální zdrojové dokumenty (historické)
```

## Konvence a pravidla

### Kód (`public/lili.js`)
- **Jeden soubor.** Vše musí být v `public/lili.js`. Žádné moduly, žádné importy.
- **Zero dependencies.** Žádné npm, žádné CDN, žádné externí knihovny.
- **IIFE wrapper** s `'use strict'`.
- **Vanilla JavaScript ES6+.** Žádný TypeScript, žádný framework.
- **Canvas 2D API** pro rendering (ne WebGL, ne SVG, ne DOM animace).
- **localStorage** pro persistence (ne IndexedDB v v1.0, ne cookies, ne server).
- Komentáře v angličtině, dokumentace v češtině.

### Architektura
- **Distribuovaná inteligence:** Mozek (Q-Learning) nastavuje nálady/tendence. Chapadla mají lokální inteligenci a reagují autonomně. Chování emerguje z kombinace obou.
- **Brain Interface (koordinátor nálad):** `brain.decideMood()`, `brain.learn()`, `brain.serialize()`, `brain.deserialize()`. Žádné přímé volání Q-tabulky z jiných modulů.
- **Chapadla (semi-autonomní):** Každé chapadlo má lokální stav (stress, curiosity, grip, heldElement) a autonomně reaguje na podněty (recoil, explorace, grab).
- **Stavový prostor:** 38880 stavů (9 diskretizovaných globálních senzorů: cursor proximity/velocity, DOM density, whitespace, scroll, time, age, momentum, trust).
- **Mood space (místo action space):** 7 nálad (curious, playful, shy, calm, alert, idle, exploring).
- **DOM interakce:** 5 fází — touch → interest → grab → play → drop. Max 2 held elementy. Nikdy interaktivní elementy.
- **Reward function** přesně dle IMPLEMENTATION_PLAN.md (Fáze 8). Neměnit bez zdůvodnění.

### Výkonnostní cíle
- 60 FPS target, minimum 50 FPS
- < 2% CPU idle, < 5% CPU aktivní
- < 5 MB JS heap
- < 50 KB minified
- < 200 ms init

### Dokumentace
- Každé významné rozhodnutí zaznamenat do `docs/journal/YYYY-MM-DD-topic.md`
- Při změně architektury aktualizovat `docs/IMPLEMENTATION_PLAN.md`
- Při přidání researche aktualizovat `docs/research/README.md`
- Aktualizovat tento soubor (`AGENTS.md`) při změně stavu projektu

### Co NEDĚLAT
- **Nerozdělovat `lili.js` na více souborů** — celý projekt je single-file IIFE
- **Nepřidávat závislosti** — zero deps je fundamentální constraint
- **Nepoužívat generativní dialog** — Lili nekomunikuje přirozeným jazykem
- **Neměnit reward function** bez akademického zdůvodnění
- **Nemazat `lili_genesis`** v kódu — je to birth timestamp, nikdy se nepřepisuje
- **Nemodifikovat DOM layout** (width, height, margin, display) — pouze `transform` a `color`
- **Neodesílat data** — vše je 100% lokální, žádné network requesty

## Klíčové technické koncepty

Pokud implementuješ a potřebuješ rychlý přehled:

- **Q(λ)-Learning (nálady):** Eligibility traces (λ age-dependent), Boltzmann/softmax exploration (τ age-dependent), adaptive α per (s,m), γ=0.85. Výstup = nálada (ne akce)
- **Distribuovaná inteligence:** Brain = hormonální systém (nálady). Chapadla = lokální neurony (reflexy, explorace, grab). Chování = emergence.
- **Steering Behaviors:** Craig Reynolds (1987) — wander, seek, flee, evade, obstacle avoidance (ovlivněno náladou)
- **FABRIK IK:** Forward And Backward Reaching (Aristidou & Lasenby 2011) — 8 chapadel × 8 segmentů, každé semi-autonomní
- **Tentacle Local State:** localStress, touching, curiosity, recoilTimer, heldElement, grip
- **DOM Manipulation:** touch → interest → grab → play → drop. Max 2 held. Pouze transform + color.
- **Spatial Hash Grid:** 120×120px buňky, O(1) kolizní detekce místo O(n²)
- **Simplex Noise:** Procedurální šum pro wander a vizuální deformace (ne Math.random)
- **Chromatofory:** HSL barevný model, base hue podle věku, stress shift k červené
- **Midnight Cleanup:** O půlnoci se revertují CSS transformace + vrátí se odnešené elementy

## Autor

**Michal Strnadel** — koncept, vize, PRD, research coordination

---

*Poslední aktualizace: 2026-04-19 (Lili A: Fáze 1-57; Evrin: Fáze 1-11 hotovy — production/test split, `lili-b.js` 23.7 KB gzipped, `lili-b.tests.js` dev-only, 13/13 tests pass. Feature work complete → 2-year observation window.)*
*Aktualizuj toto datum a sekci „Aktuální stav" při každé významné změně.*
