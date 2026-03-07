# AI Context — Přečti tohle jako první

Tento soubor je entry point pro jakékoli AI pracující na tomto projektu. Přečti ho celý před čímkoli jiným.

## Co je tento projekt

**Lili** je autonomní digitální chobotnice žijící na webové stránce. Její chování emerguje z Q-Learningu (Reinforcement Learning) — nic není skriptované. Projekt je akademický experiment v digitální ontogenezi s plánovaným 10letým životním cyklem.

**Technicky:** Jeden JavaScript soubor (`public/lili.js`), zero dependencies, zero build pipeline, nasaditelný jedním `<script defer>` tagem do libovolného HTML.

## Aktuální stav

**Fáze: Pre-implementace (research + dokumentace)**

Hotovo:
- ✅ PRD (860 řádků) — `LILI_PRD_v1.md`
- ✅ Akademický popis — `docs/PROJECT.md`
- ✅ 12-fázový implementační plán — `docs/IMPLEMENTATION_PLAN.md`
- ✅ Deep research 0a, 0b, 1, 2 — viz `docs/research/README.md`
- ✅ Vizuální filozofie — `docs/design/README.md`
- ✅ Vývojový deníček — `docs/journal/`

Čeká:
- ⏳ Deep research #3 (FABRIK IK), #4 (persistence), #5 (akademická metodologie)
- ⏳ Implementace — začíná Fází 1 (`public/lili.js`)

**Další krok:** Implementace Fáze 1 (IIFE, Canvas bootstrap, Vec2, Simplex Noise, requestAnimationFrame loop).

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
│   │   ├── 03-*.md          ← ⏳ FABRIK IK
│   │   ├── 04-*.md          ← ⏳ Browser persistence
│   │   └── 05-*.md          ← ⏳ Akademická metodologie
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
- **Brain Interface pattern:** Veškerá rozhodování prochází přes `brain.chooseAction()`, `brain.learn()`, `brain.serialize()`, `brain.deserialize()`. Žádné přímé volání Q-tabulky z jiných modulů.
- **Stavový prostor:** 4320 stavů (7 diskretizovaných senzorů). Nerozdělovat, nezvětšovat bez důvodu.
- **Akční prostor:** 7 akcí (wander, seek_whitespace, flee, explore_dom, idle, seek_edge, follow_slow).
- **Reward function** přesně dle PRD (sekce 5.2). Neměnit bez zdůvodnění.

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

- **Q-Learning:** Bellmanova rovnice, α=0.1, γ=0.85, ε vázáno na biologický věk
- **Steering Behaviors:** Craig Reynolds (1987) — wander, seek, flee, evade, obstacle avoidance
- **FABRIK IK:** Forward And Backward Reaching (Aristidou & Lasenby 2011) — 8 chapadel × 8 segmentů
- **Spatial Hash Grid:** 120×120px buňky, O(1) kolizní detekce místo O(n²)
- **Simplex Noise:** Procedurální šum pro wander a vizuální deformace (ne Math.random)
- **Chromatofory:** HSL barevný model, base hue podle věku, stress shift k červené
- **Midnight Cleanup:** O půlnoci se revertují CSS transformace dotčených DOM elementů

## Autor

**Michal Strnadel** — koncept, vize, PRD, research coordination

---

*Poslední aktualizace: 2026-03-07*
*Aktualizuj toto datum a sekci „Aktuální stav" při každé významné změně.*
