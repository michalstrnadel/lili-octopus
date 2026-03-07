# Lili — Akademický popis projektu

## Abstrakt

Projekt Lili je longitudinální experiment v digitální ontogenezi — studiu vzniku, vývoje a stárnutí autonomního digitálního organismu v prostředí webového prohlížeče. Organismus ve formě procedurálně animované chobotnice žije na HTML stránce jako ambientní společník, jehož chování emerguje výhradně z bezmodelového zpětnovazebného učení (tabulární Q-Learning). Entita se rodí jako chaotický, explorativní Hatchling a v průběhu 10 reálných let konverguje k deterministickému, téměř nehybnému Elderovi — přičemž veškerá rozhodnutí, stavy a transformace jsou zaznamenávány pro pozdější vědeckou analýzu.

Projekt je implementován jako jediný JavaScript soubor bez jakýchkoli externích závislostí (`lili.js`, < 50 KB minified), nasaditelný jedním `<script>` tagem do libovolného HTML dokumentu.

**Autor:** Michal Strnadel
**Datum zahájení:** 7. března 2026
**Plánovaná doba běhu experimentu:** 10 let (2026–2036)
**Licence:** TBD

---

## 1. Motivace a kontext

### 1.1 Problém

Současné digitální společníky a virtuální entity trpí fundamentálními nedostatky:

- **Reaktivita bez autonomie:** Tradiční modely (Tamagotchi, Neko, clippy) jsou deterministické stavové automaty reagující na explicitní vstup. Nemají vnitřní paměť ani schopnost adaptace.
- **Závislost na cloudu:** Moderní AI agenti (chatboti, LLM integrace) vyžadují permanentní síťové spojení, cloudovou infrastrukturu a generují obavy o soukromí.
- **Absence času:** Většina digitálních entit nemá koncept biologického stárnutí. Jejich chování je identické v den 1 i v den 1000.
- **Rušivost:** Interaktivní webové prvky typicky soupeří o pozornost uživatele místo aby koexistovaly.

### 1.2 Přístup

Lili tyto problémy řeší radikální kombinací:

- **Lokální autonomie:** Veškeré rozhodování probíhá v prohlížeči uživatele prostřednictvím tabulárního Q-Learningu. Žádné síťové požadavky, žádná API, žádná data opouštějí zařízení.
- **Emergentní chování:** Nic není skriptované. Chování (zdvořilost, plachost, zvědavost) emerguje z reward function — ekvivalentu DNA organismu.
- **Biologický čas:** Parametry entity (rychlost, velikost, exploration rate, vizuální vzhled) se plynule mění s reálným časem od narození (`lili_genesis` timestamp).
- **Ambientní koexistence:** Organismus nevyžaduje péči, nekomunikuje přirozeným jazykem a aktivně se učí nevyrušovat uživatele při čtení.

### 1.3 Inspirace a předobrazy

- **Dosidicus** (ViciousSquid/Dosidicus) — transparentní kognitivní pískoviště s digitální chobotnicí v Pythonu (Hebbovské učení, PyQt5). Filozofický sourozenec, architektonicky odlišný.
- **ReinforceJS** (karpathy/reinforcejs) — referenční implementace RL v čistém JavaScriptu od Andreje Karpathyho.
- **Craig Reynolds Steering Behaviors** (1987) — vektorový model autonomní navigace pro simulaci organického pohybu.
- **FABRIK** (Aristidou & Lasenby, 2011) — Forward And Backward Reaching Inverse Kinematics pro efektivní procedurální animaci řetězců.
- **Thronglets** (Black Mirror S07E04) — fiktivní digitální organismy s výhradně digitální biologií, popkulturní rezonance konceptu digitálního života.

Podrobný rozbor předobrazů: viz `docs/research/00a-conceptual-architectural-analysis.md`

---

## 2. Architektura systému

### 2.1 Přehled vrstev

```
┌─────────────────────────────────────────────────┐
│                   RENDERING                      │
│  Canvas 2D · Procedurální tělo · FABRIK chapadla │
│  HSL chromatofory · Oči · Glow                   │
├─────────────────────────────────────────────────┤
│                 STEERING (tělo)                   │
│  Reynolds Behaviors · Wander · Flee · Seek        │
│  Obstacle Avoidance · Boundary                    │
├─────────────────────────────────────────────────┤
│                 BRAIN (mozek)                      │
│  brain.chooseAction() · brain.learn()             │
│  v1.0: QLearningBrain (tabulární Q-Learning)      │
├─────────────────────────────────────────────────┤
│               SENZORY + PROSTŘEDÍ                 │
│  Cursor · Scroll · DOM density · Whitespace       │
│  Denní doba · Stress model · Spatial Hash Grid    │
├─────────────────────────────────────────────────┤
│               AGE SYSTEM + JOURNAL                │
│  Genesis timestamp · Life phases · Interpolace    │
│  Behavioral Journal · Q-table snapshoty · Export  │
├─────────────────────────────────────────────────┤
│                 PERSISTENCE                       │
│  localStorage · Q-tabulka · Journal · Position     │
│  Midnight Cleanup · beforeunload                  │
└─────────────────────────────────────────────────┘
```

### 2.2 Brain Interface (adapter pattern)

Veškerá rozhodování prochází jedním rozhraním, které odděluje mozek od těla:

- `brain.chooseAction(stateVector)` → akce (string)
- `brain.learn(state, action, reward, nextState)` → update interního modelu
- `brain.serialize()` / `brain.deserialize(json)` → persistence
- `brain.getMetrics()` → data pro journal a debug

Toto oddělení umožňuje v budoucnu záměnu QLearningBrain za DQNBrain, LLMBrain nebo HiveBrain bez změny těla.

### 2.3 Q-Learning specifikace

**Stavový prostor:** 7 diskretizovaných senzorických vstupů:

- Cursor proximity (3 stavy: far, medium, near)
- Cursor velocity (4 stavy: still, slow, fast, aggressive)
- DOM density (3 stavy: sparse, medium, dense)
- Whitespace proximity (3 stavy: in_whitespace, near, far)
- Scroll state (2 stavy: idle, active)
- Time of day (4 stavy: morning, afternoon, evening, night)
- Age phase (5 stavů: hatchling, juvenile, adult, mature, elder)

**Celkem:** 3 × 4 × 3 × 3 × 2 × 4 × 5 = **4 320 stavů**

**Akční prostor:** 7 akcí — wander, seek_whitespace, flee, explore_dom, idle, seek_edge, follow_slow

**Hyperparametry:** α = 0.1 (learning rate), γ = 0.85 (discount factor)

**Epsilon-greedy strategie:** ε je vázáno na biologický věk (0.85 pro Hatchling → 0.05 pro Elder), nikoli na počet iterací — zásadní koncepční obrat oproti standardnímu RL.

**Reward function:** Biologicky inspirovaný reward shaping, kde nejvyšší penalizace (-2.0) je za blokování čtení uživatele a nejvyšší odměna (+1.0) za sdílení prázdného prostoru. Funkce odměn je ekvivalentem DNA organismu.

### 2.4 Vizuální systém

- **Procedurální rendering:** Canvas 2D, žádné textury, žádné sprity. Vše generováno matematicky.
- **FABRIK IK:** 8 chapadel × 8 segmentů, 3-4 iterace solveru per frame, Bézier curve rendering.
- **Chromatofory:** HSL barevný model mapující biologický věk (Hue), cirkadiánní rytmus (Lightness) a stress (Saturation + Hue shift k červené).
- **Psychosomatická individualita:** Vizuál je funkcí života — genesis seed (vrozené proporce), prostředí (adaptace), věk (ontogeneze), naučené chování (osobnost).

### 2.5 Prostorová optimalizace

- **Spatial Hash Grid:** Virtuální mřížka (120 × 120 px) indexující DOM elementy pro O(1) kolizní detekce.
- **MutationObserver:** Detekce dynamických změn DOM (SPA, lazy loading), throttlováno na max 1×/500 ms.

### 2.6 DOM interakce

- Chapadla hapticky interagují s textovými elementy pomocí `transform` (rotate, translate) — nikdy `width`, `margin`, `innerHTML`.
- **Midnight Cleanup:** Při přechodu kalendářního dne se veškeré modifikace plynule revertují (transition 1.2s). Poetický efekt: stopy včerejška se mažou, entita žije dál.

---

## 3. Životní cyklus a ontogeneze

Čas plyne v reálném čase od `lili_genesis` timestamp (localStorage). Životní cyklus trvá 10 reálných let.

### Fáze života

**Hatchling (0–2 týdny)**
- Vysoká rychlost, velká explorace (ε = 0.85)
- Chaotický pohyb, časté narážení do DOM elementů
- Světlé barvy, vysoký glow, rychlé chromatoforové změny
- Malé tělo (8-12 px)

**Juvenile (2 týdny – 3 měsíce)**
- Formování preferencí na základě naučené Q-tabulky
- Postupná stabilizace pohybu
- Rostoucí tělo, stabilizující se barva

**Adult (3 měsíce – 2 roky)**
- Stabilní chování, teritoriální preference
- Vyhledávání klidových zón
- Plná velikost (20-24 px), hluboké barvy

**Mature (2–6 let)**
- Silné zvyky, minimální reaktivita na běžné podněty
- Nízká explorace (ε → 0.15)
- Tmavnoucí barvy, pomalejší změny

**Elder (6–10 let)**
- Téměř nehybná, deterministická
- ε → 0.05 — téměř výhradně exploatace naučeného
- Tmavá, monumentální (28-32 px), minimální glow
- *"Elder Lili je téměř nehybná. To není bug, to je vlastnost."*

Přechody mezi fázemi jsou plynulé (lineární interpolace), nikoli skokové.

---

## 4. Akademická datová vrstva

### 4.1 Behavioral Journal

Třívrstvý systém záznamu:

**Decision log** (ring buffer ~5000 záznamů):
Každé rozhodnutí RL agenta je zaznamenáno s plným kontextem — timestamp, věk, state vector, zvolená akce, zda byla explorativní, reward, Q-hodnoty před a po updatu, stress level, pozice kurzoru a agenta.

**Denní agregáty** (uchovávány navždy, ~500 B/den):
Action distribution, průměrný reward, skutečná exploration rate, top 20 navštěvovaných stavů, prostorová heatmapa, histogram stresu, hash Q-tabulky.

**Q-table snapshoty** (týdenní, ~15 KB/snapshot):
Kompletní kopie Q-tabulky umožňující rekonstrukci evoluce „mozku" v čase.

**Event/milestone log:**
Phase transitions, first occurrences, convergence events, behavioral shifts.

### 4.2 Export

Klávesa `E` → kompletní export jako `lili_export_YYYYMMDD.json`:
- Metadata (genesis, věk, fáze, URL hash)
- Aktuální Q-tabulka
- Všechny denní agregáty od genesis
- Všechny Q-table snapshoty
- Event log + decision ring buffer
- Alternativní CSV export pro denní agregáty

### 4.3 Storage management

- Decision log: FIFO ring buffer (konstantní velikost)
- Denní agregáty: ~180 KB/rok
- Q-table snapshoty: ~780 KB/rok
- Celkový footprint: ~1-2 MB/rok (v rámci localStorage limitu 5-10 MB)

---

## 5. Výzkumné otázky

### Primární otázky

1. **Konvergence v otevřeném prostředí:** Dokáže tabulární Q-Learning agent konvergovat k stabilní policy v nestatickém DOM prostředí?
2. **Ontogenetický efekt:** Je rozdíl mezi emergentním chováním Hatchling a Elder kvalitativně pozorovatelný lidským okem?
3. **Korelace s uživatelem:** Existuje měřitelná korelace mezi uživatelským chováním (scroll patterns, cursor speed) a naučenou Q-tabulkou?
4. **Biologický reward shaping:** Je biologicky inspirovaný reward shaping efektivnější než náhodný pro dosažení „zdvořilého" chování v DOM prostředí?
5. **Minimální komplexita:** Jaká je minimální velikost stavového prostoru pro emergenci netriviálního chování v tomto kontextu?

### Měřené metriky

**Krátkodobé (dny/týdny):**
- Q-value convergence curve
- Exploration/exploitation ratio (reálný, ne jen ε)
- Kumulativní reward per session
- State visitation distribution (Zipfovo rozdělení?)
- Action entropy (Shannon) — chaos → specializace?

**Střednědobé (měsíce):**
- Behavioral repertoire shift mezi fázemi
- Evoluce prostorových preferencí
- Cirkadiánní behaviorální vzory
- Policy stability index
- Stress habituation

**Dlouhodobé (roky):**
- Kompletní ontogenetická křivka
- Knowledge retention po neaktivitě
- Q-table final state — konvergence vs. oscilace
- Cross-site comparison (různé stránky, různí uživatelé)
- Behavioral fingerprint

---

## 6. Technické specifikace

- **Runtime:** Vanilla JavaScript ES6+, zero dependencies, zero build pipeline
- **Rendering:** Canvas 2D API
- **Deployment:** `<script src="lili.js" defer>` v libovolném HTML
- **Velikost:** < 50 KB minified, < 80 KB unminified
- **Výkon:** 60 FPS target, < 2% CPU idle, < 5% CPU aktivní, < 5 MB JS heap
- **Persistence:** localStorage (< 15 KB jádro, ~1-2 MB/rok journal)
- **Inicializace:** < 200 ms od DOMContentLoaded
- **Kompatibilita:** Libovolná stránka s 500+ DOM elementy

---

## 7. Struktura repozitáře

```
lili-octopus/
├── AGENTS.md                    ← AI entry point (čti jako první)
├── CLAUDE.md                    ← Claude Code entry point
├── .cursorrules                 ← Cursor entry point
├── README.md                    ← Přehled projektu
├── LILI_PRD_v1.md               ← Product Requirements Document (860 řádků)
├── public/
│   └── lili.js                  ← Jediný produkční soubor
├── docs/
│   ├── PROJECT.md               ← Tento dokument — akademický popis
│   ├── IMPLEMENTATION_PLAN.md   ← 12-fázový implementační plán
│   ├── research/                ← 7 deep researches
│   ├── journal/                 ← Vývojový deníček
│   └── design/                  ← Vizuální filozofie
└── _archive/                    ← Originální zdrojové dokumenty
```

---

## 8. Navigace dokumentace

- **Chci pochopit co Lili je →** Tento dokument (`docs/PROJECT.md`)
- **Chci vědět jak se to staví →** `docs/IMPLEMENTATION_PLAN.md`
- **Chci vidět research →** `docs/research/README.md`
- **Chci vidět vizuální rozhodnutí →** `docs/design/README.md`
- **Chci vidět historii rozhodování →** `docs/journal/`
- **Chci vidět původní zadání →** `LILI_PRD_v1.md`
- **Chci rychlý přehled →** `README.md`

---

## 9. Porovnání s existujícími systémy

**vs. Tamagotchi / Neko:** Lili nevyžaduje péči, má vnitřní paměť, adaptuje se, stárne.

**vs. AI chatboti (GPT, Claude integrace):** Lili běží 100% lokálně, nekomunikuje přirozeným jazykem, neodesílá data. Využívá symbolickou inteligenci (Q-Learning), ne generativní modely.

**vs. Dosidicus:** Lili žije v DOM webové stránky (ne v izolované aplikaci), je implementována v čistém JavaScriptu (ne Python/PyQt5), používá Q-Learning (ne Hebbovské učení).

**vs. WebVoyager / task-oriented agenti:** Lili neprovádí úkoly. Nemá cíl kromě přežití a adaptace. Je to ambientní koexistence, ne automatizace.

**vs. Thronglets (Black Mirror):** Lili se nemnoží, nevyžaduje management zdrojů, její herní plochou není prázdné plátno ale živá webová stránka s reálným obsahem.

---

## 10. Publikační strategie

### Potenciální venues

- **ALIFE** (Conference on Artificial Life) — přímá relevance: digitální ontogeneze, emergentní chování
- **CHI** (Conference on Human Factors in Computing Systems) — ambientní interakce, calm technology
- **NeurIPS Workshop** — RL v netradiční doméně
- **GECCO** (Genetic and Evolutionary Computation Conference) — biologicky inspirované systémy
- **Creative Coding / Generative Art** venues — procedurální animace, digitální umění

### Formát publikace

Primární výstup: longitudinální studie s daty nasbíranými přes měsíce/roky. Sekundární: technický report o architektuře a implementaci.

---

*Tento dokument je živý. Aktualizuje se s vývojem projektu a přibývajícími daty z experimentu.*

*„Neperformuje. Prostě je."*
