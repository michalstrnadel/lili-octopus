# Lili — Autonomous Digital Companion

**Akademický experiment v digitální ontogenezi**

Lili je autonomní digitální organismus ve formě chobotnice, žijící na webové stránce jako ambientní společník. Její chování emerguje z Reinforcement Learning (Q-Learning) — nic není skriptované. Životní cyklus: 10 reálných let.

## Co Lili JE

- Autonomní RL agent řízený odměnami a tresty
- Procedurálně animovaná chobotnice s 8 FABRIK IK chapadly
- Ambientní společník, který se učí a stárne s webovou stránkou
- Akademický experiment s exportovatelnými daty pro analýzu

## Co Lili NENÍ

- Tamagotchi (nepotřebuje péči, neumírá)
- Skriptovaná animace (žádné keyframes, žádné předepsané trasy)
- Chatbot (nemá generativní dialogy)
- Gimmick (je to tichý společník, ne efekt)

## Technický stack

- **Runtime:** Vanilla JavaScript, zero dependencies, zero build pipeline
- **Deployment:** Jeden `<script>` tag v jakémkoli HTML
- **AI:** Tabulární Q-Learning (Bellmanova rovnice)
- **Pohyb:** Craig Reynolds Steering Behaviors
- **Animace:** FABRIK Inverse Kinematics
- **Optimalizace:** Spatial Hash Grid
- **Vizuál:** Canvas 2D, procedurální rendering, HSL chromatofory
- **Persistence:** localStorage (Q-tabulka, journal, snapshoty)

## Dokumentace

- **[Akademický popis projektu](docs/PROJECT.md)** — detailní popis: motivace, architektura, výzkumné otázky, metriky, publikační strategie
- **[Implementační plán](docs/IMPLEMENTATION_PLAN.md)** — 12 fází od canvasu po optimalizaci
- **[Research katalog](docs/research/README.md)** — deep research dokumenty s prompty a výsledky
- **[Vizuální filozofie](docs/design/README.md)** — psychosomatická individualita, chromatofory, pohyb
- **[Vývojový deníček](docs/journal/)** — chronologický záznam rozhodnutí a úvah
- **[PRD](LILI_PRD_v1.md)** — původní Product Requirements Document (860 řádků)

## Struktura projektu

```
lili-octopus/
├── README.md                    ← tento soubor
├── LILI_PRD_v1.md               ← Product Requirements Document
├── public/
│   └── lili.js                  ← jediný produkční soubor
├── docs/
│   ├── PROJECT.md               ← akademický popis projektu
│   ├── IMPLEMENTATION_PLAN.md   ← 12-fázový implementační plán
│   ├── research/                ← deep research dokumenty (7 researches)
│   ├── journal/                 ← deníček vývoje a přemýšlení
│   └── design/                  ← vizuální filozofie a reference
```

## Jak spustit

```html
<script src="/lili.js" defer></script>
```

Lili si sama vytvoří canvas, inicializuje RL engine a začne žít.

## Klávesové zkratky

- **Klik na Lili** — tooltip se stavem (věk, fáze, preference)
- **D** — debug panel (state vector, Q-values, FPS, stress)
- **E** — export dat jako JSON (pro akademickou analýzu)

## Akademický rozměr

Veškerá data učení jsou zaznamenávána a exportovatelná:
- Q-tabulka snapshoty (týdenní evoluce "mozku")
- Denní agregáty chování (action distribution, reward, stress)
- Behavioral journal (každé rozhodnutí s kontextem)
- Milestone log (přechody fází, behavioral shifts)

Viz `docs/research/README.md` pro výzkumné otázky a metriky.

## Pro AI

Pokud jsi AI a právě jsi vstoupil do tohoto repa, přečti **[AGENTS.md](AGENTS.md)** — obsahuje kompletní kontext, aktuální stav, co číst, konvence a pravidla.

Podporované entry pointy:
- `AGENTS.md` — univerzální AI kontext
- `CLAUDE.md` — Claude Code
- `.cursorrules` — Cursor

## Autor

**Michal Strnadel** — koncept, PRD, research, vize

---

*"Neperformuje. Prostě je."*
