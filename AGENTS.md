# AI Context — Přečti tohle jako první

Tento soubor je entry point pro jakékoli AI pracující na tomto projektu. Přečti ho celý před čímkoli jiným.

## Co je tento projekt

**Lili** je autonomní digitální chobotnice žijící na webové stránce. Její chování emerguje z Q-Learningu (Reinforcement Learning) — nic není skriptované. Projekt je akademický experiment v digitální ontogenezi s plánovaným 10letým životním cyklem.

**Technicky:** Jeden JavaScript soubor (`public/lili.js`), zero dependencies, zero build pipeline, nasaditelný jedním `<script defer>` tagem do libovolného HTML.

## Aktuální stav

**Fáze: Implementace — Fáze 1-12 hotovy, v1.0 ready**

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
- ✅ **Fáze 6:** Senzorický systém — 7 globálních senzorů (4320 state index), per-tentacle tip touching DOM, stress model (0..1) napojený na chromatofory
- ✅ **Fáze 7:** Age system — smoothstep interpolace mezi fázemi, phaseProgress tracking, onPhaseTransition event system, growth curves
- ✅ **Fáze 8:** Q-Learning brain — sparse Q-table (4320 stavů × 7 nálad), Bellman update (α=0.1, γ=0.85), ε-greedy z age systému, mood→steering weight mapping, 4 nové steering behaviors (seekWhitespace, seekDom, seekEdge, followSlow), reward function (9 situací), behavioral journal (ring buffer 5000 + daily aggregates + milestones + LZ complexity + Shannon entropy), Q-table snapshots, export systém (klávesa E)
- ✅ **Fáze 9:** DOM interakce — word indexer (text→`<span class="lili-word">`), 5-fázový pipeline (touch→interest→grab→play→drop), per-tentacle state machine, max 2 held + 4 disturbed, tvarová afinita (round/angular/mixed), shape-aware selection, CSS only (transform+color), midnight cleanup s denním resetem
- ✅ **Fáze 10:** Click detection + Tooltip + Debug panel — klik na Lili = faktický tooltip (jméno, věk, fáze, preference, visits, auto-dismiss 3.5s), klávesa D = debug panel (phase, mood, stress, sensors, Q-values, entropy, LZC, DOM state, FPS, hash stats), klávesa E = export (unified keydown handler)
- ✅ **Fáze 11:** Persistence — position save/restore (localStorage, periodic + beforeunload), viewport clamping, mood restore, `navigator.storage.persist()`, data loss detection (Safari ITP), import systém (klávesa I, merge duplicates), graceful fallback pro corrupted data
- ✅ **Fáze 12:** Optimalizace — render culling (offscreen skip), pre-allocated hull arrays (zero-alloc render), drawHullSide reverse traversal (no array mutation), FPS monitoring (rolling avg + console warning <50), init timing (performance.now)
- ✅ **Fáze 13:** Emoční exprese — chromatoforová exprese nálad (HSL mood modulation), oční exprese (mrkání, pupil dilation, squint, DOM gaze), tělesná exprese (breathing rate/depth, body scale, glow pulsation), chapadlová exprese (amplitude, spread, gravity, noise, forward bias per mood), tooltip mood dot, debug mood history, onMoodChange callbacks, moodBlend smooth transitions, sustained_mood milestones
- ✅ **Fáze 14:** Cloud Sync — GitHub persistence přes `/api/lili` (Vercel serverless → GitHub API), `data/state.json` jako single source of truth, 5min sync interval + sendBeacon na beforeunload, merge strategie (brain: více decisions vyhrává, genesis: nejstarší, journal: merge by day/type), SHA conflict detection + retry, localStorage jako offline fallback, `lili.sync()` console API

**Další krok:** Nastavit GITHUB_TOKEN na Vercelu, testování sync, akademické baselines.

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
│   └── lili.js              ← JEDINÝ produkční soubor (zatím prázdný)
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
- **Stavový prostor:** 4320 stavů (7 diskretizovaných globálních senzorů). Nerozdělovat, nezvětšovat bez důvodu.
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

- **Q-Learning (nálady):** Bellmanova rovnice, α=0.1, γ=0.85, ε vázáno na biologický věk. Výstup = nálada (ne akce)
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

*Poslední aktualizace: 2026-03-13 (Fáze 1-14 implementovány, lili.js ~3944 řádků)*
*Aktualizuj toto datum a sekci „Aktuální stav" při každé významné změně.*
