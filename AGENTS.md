# AI Context — Přečti tohle jako první

Tento soubor je entry point pro jakékoli AI pracující na tomto projektu. Přečti ho celý před čímkoli jiným.

## Co je tento projekt

**Lili** je autonomní digitální chobotnice žijící na webové stránce. Její chování emerguje z Q-Learningu (Reinforcement Learning) — nic není skriptované. Projekt je akademický experiment v digitální ontogenezi s plánovaným 10letým životním cyklem.

**Technicky:** Jeden JavaScript soubor (`public/lili.js`), zero dependencies, zero build pipeline, nasaditelný jedním `<script defer>` tagem do libovolného HTML.

## Aktuální stav

**Fáze: Implementace — Fáze 1-29 hotovy, akademická + technologická expanze**

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

**Další krok:** Testování všech nových fází, tuning parametrů, příprava akademického paperu.

**Keyboard shortcuts:**
- `D` — toggle debug panel
- `E` — export JSON
- `I` — import JSON
- `B` — cycle baseline modes (off → random → frozen → myopic → heuristic)
- `R` — toggle replay recording/playback
- `S` — toggle sound

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
│   ├── lili.js              ← JEDINÝ produkční soubor (~7117 řádků)
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

*Poslední aktualizace: 2026-04-10 (Fáze 1-29 implementovány, lili.js ~7117 řádků, dashboard.html)*
*Aktualizuj toto datum a sekci „Aktuální stav" při každé významné změně.*
