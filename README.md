# Lili — Autonomous Digital Companion

**Akademický experiment v digitální ontogenezi**

Lili je autonomní digitální organismus ve formě chobotnice, žijící na webové stránce jako ambientní společník. Její chování emerguje z Reinforcement Learning (Q-Learning) — nic není skriptované. Životní cyklus: 10 reálných let.

## Co Lili JE

- Autonomní RL agent řízený odměnami a tresty
- Procedurálně animovaná chobotnice s 8 FABRIK IK chapadly
- Ambientní společník, který se učí a stárne s webovou stránkou
- Akademický experiment s exportovatelnými daty pro analýzu
- Sezónně adaptivní organismus s ambientním zvukovým krajobrazem
- Schopná reprodukce — potomci dědí naučené Q-hodnoty s genetickou mutací

## Co Lili NENÍ

- Tamagotchi (nepotřebuje péči, neumírá)
- Skriptovaná animace (žádné keyframes, žádné předepsané trasy)
- Chatbot (nemá generativní dialogy)
- Gimmick (je to tichý společník, ne efekt)

## Technický stack

- **Runtime:** Vanilla JavaScript, zero dependencies, zero build pipeline
- **Deployment:** Jeden `<script>` tag v jakémkoli HTML
- **AI:** Q(λ)-Learning s eligibility traces, Boltzmann/softmax exploration
- **Pohyb:** Craig Reynolds Steering Behaviors
- **Animace:** FABRIK Inverse Kinematics, procedurální micro-expressions
- **Optimalizace:** Spatial Hash Grid
- **Vizuál:** Canvas 2D, procedurální rendering, HSL chromatofory, sezónní modulace
- **Zvuk:** Web Audio API (zero deps) — breathing drone, bubble pops, ink splash
- **Persistence:** localStorage + cloud sync (GitHub API via Vercel serverless)
- **Analýza:** CSV export, observability dashboard, baseline porovnání, replay systém

## Aktuální stav (2026-04-10)

**29 implementačních fází hotovo** — `public/lili.js` (~7117 řádků)

| Fáze | Popis |
|------|-------|
| 1-4 | Canvas bootstrap, steering behaviors, FABRIK IK, vizuální systém |
| 5-7 | Spatial hash grid, senzorický systém (9 senzorů, 38880 stavů), age system |
| 8-9 | Q-Learning brain (Q(λ), Boltzmann, adaptive α, curiosity), DOM interakce |
| 10-12 | Click/tooltip/debug, persistence (localStorage), optimalizace (60 FPS) |
| 13 | Emoční exprese (chromatofory, oči, dýchání, chapadla per mood) |
| 14 | Cloud sync (GitHub persistence, 5min interval, merge strategie) |
| 17 | Brain v2 (eligibility traces, softmax, momentum/trust senzory, mood plans) |
| 18-18.5 | "Alive & Polish" (micro-expressions, sleep, genesis variation, chromatophore cells) |
| **19A** | **Baseline System** — 4 kontrolní podmínky pro akademické srovnání |
| **19B** | **Replay System** — nahrávání/přehrávání cursor trajektorií |
| **19C** | **Enhanced Metrics** — convergence křivky, policy stability, CSV export |
| **20** | **Observability Dashboard** — vizualizace exportovaných dat |
| **21** | **Seasonal Awareness** — chromatoforová + pohybová modulace dle ročního období |
| **22** | **Sound Landscape** — Web Audio API ambientní zvukový svět |
| **23** | **Social Learning** — anonymizované behavioral stats v cloud sync |
| **24** | **Offspring** — reprodukce s Q-table crossover a genetickou mutací |
| **25** | **Dream Replay** — experience replay během spánku (DQN konsolidace) |
| **26** | **Curriculum Learning** — postupné odemykání reward komponent dle věku |
| **27** | **Habitat Awareness** — detekce barevné palety stránky, hue adaptace |
| **28** | **Non-verbal Communication** — welcome wave, excitement flash, contentment pulse |
| **29** | **Enhanced Bioluminescence** — zesílený noční glow, luminiscenční trail |

## Akademické funkce (Fáze 19-24)

### Baseline porovnání (19A)
4 alternativní politiky pro párové akademické srovnání:
- **Random Policy** — uniformní náhodný výběr nálady (bez učení)
- **Frozen Policy** — zmrazená Q-tabulka (měří nestacionaritu prostředí)
- **Myopic Policy** — γ=0, pouze okamžitá odměna (dokazuje hodnotu plánování)
- **Heuristic Policy** — expertní if/else pravidla (reference pro ruční design)

### Replay systém (19B)
Nahrávání cursor trajektorií + senzorických snapshotů pro reprodukovatelné experimenty. Playback mode přehraje identický vstup s jinou politikou → paired testing.

### Rozšířené metriky (19C)
- **Convergence:** průměrné |δQ| per Bellman update (sledováno denně)
- **Policy stability:** podíl stavů kde se top nálada změnila za den
- **CSV export:** denní agregáty ke stažení pro R/Python/Excel analýzu

### Observability Dashboard (20)
Samostatný `public/dashboard.html` — drag-and-drop vizualizace exportovaných JSON dat:
- Časové řady: entropy, reward, exploration rate, LZC, convergence, policy stability
- Mood distribution pie chart, personality radar (7-axis polygon)
- Behavioral etogram (stacked mood proporce v čase)
- Tabulka denních agregátů, milestones log

### Sezónní awareness (21)
Detekce ročního období (severní polokoule, date-based):
- Chromatofory: hue shift (+15 léto, -20 zima), saturace, světlost
- Rychlost pohybu: 1.1× léto, 0.85× zima
- Sezóna nerozšiřuje stavový prostor (zůstává 38880, ne 155520)

### Zvukový krajobraz (22)
Zero-dependency ambientní soundscape (Web Audio API):
- Breathing drone (sinus ~80Hz, modulovaný náladou a stresem)
- Bubble pop (randomizovaná frekvence)
- Ink splash (white noise burst)
- Opt-in — vyžaduje uživatelský gesture (klávesa S)

### Reprodukce (24)
Po dosažení fáze "mature":
- Q-table crossover: 50% náhodný podmnožina rodičovských Q-hodnot
- Gaussovská mutace (σ=0.1) na zděděných hodnotách
- Max 3 potomci za život, export jako JSON
- Potomek začíná jako hatchling se "zděděnými instinkty"

### Dream Replay (25)
DQN-inspired experience replay během spánku:
- Během cirkadiánního spánku přehrává paměťové zážitky přes brainLearn
- Prioritizace memorable událostí (vysoké |reward|)
- Pomalejší učení (αScale 0.5) pro konsolidaci bez přeučení
- Max 50 replays per sleep session

### Curriculum Learning (26)
Postupné odemykání složitosti odměňovací funkce:
- Hatchling: jen základní rewards (whitespace + blocking read)
- Juvenile: 50-80% reward komponent aktivních
- Adult+: plná reward function

### Habitat Awareness (27)
Detekce a adaptace na prostředí stránky:
- Extrakce dominantní barvy pozadí (RGB → HSL)
- Lili subtilně posouvá svůj hue k harmonii s page paletou
- Rozpoznání typu stránky (sparse/mixed/dense)

### Non-verbal Communication (28)
Vizuální signalizace bez textu:
- Welcome wave: chapadlo zamává při návratu kurzoru po dlouhé absenci
- Excitement flash: rychlé chromatoforové záblesky na vysokou odměnu
- Contentment pulse: pomalá jasová oscilace při klidném stavu

### Enhanced Bioluminescence (29)
Zesílené noční glow efekty:
- Noční glow boost (2.5×) na těle a chapadlech
- Luminiscenční trail particles za pohybem v temnu
- Inner eye glow v nočních hodinách

## Zpětná kompatibilita

Všechny nové funkce (Fáze 19-24) jsou **zpětně kompatibilní** s existujícími daty:
- Nové funkce defaultně vypnuté/pasivní — neovlivňují stávající chování
- Genesis timestamp (`lili_genesis`) se nikdy nepřepisuje
- Existující Q-tabulka, journal a denní agregáty zůstávají nedotčeny
- Nové localStorage klíče (`lili_baseline`, `lili_replay`, `lili_offspring`) nekonfliktují
- Brain format v1 → v2 migrace probíhá automaticky v `brainDeserialize`
- Cloud sync akceptuje oba formáty (`lili_state_v1` i `lili_state_v2`)

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
├── AGENTS.md                    ← AI entry point (kontext pro Claude/Cursor)
├── public/
│   ├── lili.js                  ← jediný produkční soubor (~6727 řádků)
│   └── dashboard.html           ← observability dashboard (vizualizace dat)
├── data/
│   └── state.json               ← produkční stav (cloud sync source of truth)
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

| Klávesa | Funkce |
|---------|--------|
| **Klik na Lili** | Tooltip se stavem (věk, fáze, preference) |
| **D** | Debug panel (state vector, Q-values, FPS, stress, convergence) |
| **E** | Export dat jako JSON (pro akademickou analýzu) |
| **I** | Import dat z JSON souboru |
| **B** | Přepínání baseline módů (off → random → frozen → myopic → heuristic) |
| **R** | Toggle replay nahrávání/přehrávání |
| **S** | Toggle ambientní zvuk |

## Console API

```javascript
lili.baseline()      // přepnout baseline mód
lili.replayRecord()  // začít nahrávání
lili.replayPlay()    // přehrát nahranou sekvenci
lili.replayExport()  // exportovat replay data
lili.exportCSV()     // stáhnout CSV denních agregátů
lili.sound()         // toggle zvuk
lili.reproduce()     // vytvořit potomka (pokud eligible)
lili.personality()   // zobrazit personality radar
lili.sync()          // vynutit cloud sync
lili.habitat()       // zobrazit habitat awareness stav
lili.dream()         // zobrazit dream replay stav
```

## Akademický rozměr

Veškerá data učení jsou zaznamenávána a exportovatelná:
- Q-tabulka snapshoty (týdenní evoluce "mozku")
- Denní agregáty chování (action distribution, reward, stress, convergence, policy stability)
- Behavioral journal (každé rozhodnutí s kontextem)
- Milestone log (přechody fází, behavioral shifts)
- CSV export pro statistickou analýzu (R, Python, Excel)
- Baseline srovnání (Random, Frozen, Myopic, Heuristic vs Q-Learning)
- Replay systém pro reprodukovatelné experimenty
- Observability dashboard pro vizuální inspekci

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
