# Lili — Implementační plán

Autonomní digitální chobotnice žijící na HTML stránce. Jeden soubor `lili.js`, nula závislostí, nula build pipeline.

**Akademický experiment v digitální ontogenezi** — veškerá data učení jsou exportovatelná a analyzovatelná.

## Shrnutí projektu

Lili je RL agent (Q-Learning) ve formě procedurálně animované chobotnice. Žije na libovolné webové stránce jako ambientní společník. Její chování emerguje z odměn/trestů — nic není skriptované. Životní cyklus: 10 reálných let (Hatchling → Elder).

Klíčové technologie: Q-Learning, Craig Reynolds Steering Behaviors, FABRIK IK, Spatial Hashing, Simplex Noise, Canvas 2D, localStorage persistence.

## Vizuální filozofie

**Minimalistická, ale živá.** Inspirace: reálné chobotnice (Octopus vulgaris, Abdopus aculeatus). Důraz na biologickou věrnost pohybu, ne na detail textury.

**Klíčové vizuální principy:**

- **Jet propulsion pohyb:** chobotnice se nepohybují lineárně — stahují mantle a vystřelují vodu. Wander behavior musí simulovat pulse-glide cyklus (krátký impuls + dlouhý klouzavý drift s decelerace)
- **Chapadla trailing:** při pohybu chapadla přirozeně zaostávají za tělem (drag), při zastavení se rozprostřou do stran (relaxace). Nikdy se nepohybují synchronně — fázový posun mezi chapadly je klíčový.
- **Měkké tělo:** Simplex noise deformace mantlu simuluje svalové kontrakce. Tělo se mírně zmenšuje při impulsu a expanduje při driftu.
- **Chromatofory jako emoce:** barva není dekorace — je to jediný komunikační kanál organismu. Musí být okamžitě čitelná (stress = zahřátí k červené, klid = hluboká modř).
- **Oči jako jádro personality:** pupily sledující kurzor jsou primární bod empatie. Velikost pupil reaguje na stress (rozšíření = strach). Mrkání jako idle animation.
- **Subtilní glow:** radialGradient kolem těla — ne jako "efekt", ale jako bioluminiscence. Intenzita klesá s věkem.

---

## Fáze 1: Kostra, Canvas, Boot, Vec2, Noise

**Cíl:** Spustitelný IIFE s canvasem a základní matematikou.

**Soubor:** `/public/lili.js`

**Úkoly:**
- IIFE wrapper s `'use strict'`
- `CFG` objekt se všemi konstantami (rychlosti, velikosti, prahy, hyperparametry RL)
- `Vec2` třída/objekt: `add`, `sub`, `mult`, `div`, `mag`, `normalize`, `limit`, `dist`, `dot`, `copy`, `set`
- Simplex Noise generátor (self-contained, ~100 řádků) — potřebný pro Wander a vizuální deformace
- Canvas bootstrap: vytvoření `<canvas id="lili-canvas">`, `position:fixed`, `100vw×100vh`, `pointer-events:none`, `z-index:9999`
- HiDPI handling: `canvas.width = innerWidth * devicePixelRatio`, context scale
- Resize handler s debounce (150ms)
- `document.hidden` check — pause při neviditelném tabu
- `requestAnimationFrame` loop skeleton (zatím prázdný update/render)
- `DOMContentLoaded` boot sequence

**Výstup:** Prázdný transparentní canvas přes celou stránku, `<script src="/lili.js" defer>` funguje.

## Fáze 2: Steering Behaviors — pohyb bez RL

**Cíl:** Lili se plynule pohybuje po stránce pomocí Reynoldsových algoritmů.

**Úkoly:**
- Lili state objekt: `position` (Vec2), `velocity` (Vec2), `acceleration` (Vec2), `bodyR`, `maxSpeed`, `maxForce`, `damping`
- Physics update per frame: `acceleration → velocity → position`, truncate, damping
- **Wander:** projekce kruhu (wanderDistance, wanderRadius), target bod posouvaný Simplex noise (ne `Math.random`). Organické křivky.
- **Seek / Arrive:** vektor k cíli, deceleration radius pro plynulé zastavení
- **Flee / Evade:** Flee = opačný vektor od hrozby. Evade = predikce budoucí pozice kurzoru z jeho velocity.
- **Obstacle Avoidance:** ahead vector (délka ~ `speed/maxSpeed * MAX_SEE_AHEAD`), test kolize bounding circle vs. bounding boxy DOM elementů
- **Boundary:** měkké odpuzování od okrajů viewportu (ne tvrdé odrazy)
- Behavior weight system: váhy se mění podle aktuální akce (tabulka z PRD sekce 5.3)
- Pro testování: fixní akce `wander` s obstacle avoidance a boundary vždy aktivní

**Výstup:** Viditelný kruh (placeholder) plynule pluje po stránce, obchází DOM elementy, neprochází přes okraje.

## Fáze 3: FABRIK IK — chapadla

**Cíl:** 8 procedurálně animovaných chapadel s inverzní kinematikou.

**Úkoly:**
- Data struktura: 8 chapadel × 8 segmentů. Segment délka modulovaná věkem (zatím fixní default).
- Anchor points: rovnoměrně po obvodu těla (45° rozestupy), rotované ve směru pohybu
- FABRIK solver:
    - Forward Reach: tip → target, přepočet pozic od tipu k base (zachování délky segmentů)
    - Backward Reach: base → anchor, přepočet od base k tipu
    - 3-4 iterace per frame
- Target generování podle kontextu:
    - **Plavání (wander/seek):** sinusoidní vlna se zpožděním per chapadlo, fáze `(index/8)*2π`, frekvence z CFG
    - **Blízko DOM (explore_dom):** 1-2 chapadla cílí na nejbližší hranu DOM bounding boxu
    - **Flee:** chapadla se stahují dozadu za tělo
    - **Idle:** gravitační klap dolů, jemné pulzování
- Rendering: quadratic Bézier curves přes FABRIK uzly
- Šířka: zužuje se base→tip (lineární interpolace)
- Perlin noise na šířce pro organický profil
- `globalAlpha` fade na tipech

**Výstup:** Plynulá chobotnice s 8 organickými chapadly reagujícími na kontext pohybu.

## Fáze 4: Vizuální systém — tělo, oči, chromatofory, glow

**Cíl:** Kompletní procedurální rendering organismu.

**Úkoly:**
- **Tělo:** Ellipse (`radiusX = bodyR * 0.78`, `radiusY = bodyR * 1.0`), Simplex noise deformace okrajů
- **Glow:** `radialGradient` kolem těla, alfa modulována denní dobou
- **Oči:** 2 oči na horní třetině. Pupily sledují kurzor (max offset = `radius_oka * 0.3`). Flee = pupily se rozšíří. Idle/sleep = přivřené (arc).
- **Chromatofory — HSL barevný systém:**
    - Base hue: `lerp(200, 240, ageNormalized)` (ocean blue → deep indigo)
    - Cirkadiánní posun: ráno teplejší, noc chladnější/tmavší
    - Stress: `hue -= stress * 50` (zahřátí k červené), `saturation += stress * 25`
    - Flee flash: kontrastní probliknutí, decay 300ms
- **Rendering pipeline per frame:**
    1. `clearRect`
    2. Glow (radialGradient)
    3. Chapadla (Bézier, back-to-front)
    4. Tělo (filled ellipse + noise)
    5. Oči
    6. (Debug mode): spatial hash grid, velocity vectors, state info

**Výstup:** Vizuálně kompletní, organicky vypadající chobotnice měnící barvu podle denní doby.

## Fáze 5: Spatial Hash Grid

**Cíl:** O(1) detekce kolizí místo O(n²).

**Úkoly:**
- Grid: buňky 120×120px, `Map` objekt s klíčem `"col,row"`
- `buildGrid()`: projít relevantní DOM elementy (`p, h1-h6, span, a, img, div` s viditelným obsahem), `getBoundingClientRect()`, vložit do hash mapy
- Filtrovat: ignorovat `script, style, meta, link`, hidden elementy, lili vlastní elementy
- `getNearby(x, y)`: vrátit elementy z vlastní buňky + 8 sousedů
- Rebuild triggers: `window.resize` (debounce), `MutationObserver` na `document.body` (childList, subtree), throttle max 1×/500ms
- Napojení na Obstacle Avoidance behavior (Fáze 2)

**Výstup:** Chobotnice efektivně obchází DOM elementy i na stránkách s 500+ uzly.

## Fáze 6: Senzorický systém

**Cíl:** Vstupy pro RL state vector.

**Úkoly:**
- **Kurzor:** `mousemove` listener → `mouseX, mouseY, mouseVX, mouseVY, mouseSpeed` (exponenciální klouzavý průměr). Klasifikace: still(<2), slow(2-8), fast(8-20), aggressive(>20).
- **Scroll:** `scroll` listener + timeout 200ms pro detekci idle/active
- **Denní doba:** `getTimeOfDay()` → morning/afternoon/evening/night z `new Date().getHours()`
- **Stress model:** float 0-1, exponential smoothing (`stress += (input - stress) * 0.05`). Roste při rychlém kurzoru blízko, opakovaných flee, kolizích. Klesá při idle, whitespace.
- **DOM density:** z spatial hashe — `getNearby()` count → sparse/medium/dense
- **Whitespace proximity:** test zda je agent v prázdném prostoru (žádné DOM elementy v okolí)
- **Cursor proximity:** vzdálenost kurzor↔agent → far/medium/near

**Výstup:** Kompletní senzorický systém produkující diskretizovaný state vector.

## Fáze 7: Age System — životní cyklus 10 let

**Cíl:** Kontinuální stárnutí od Hatchling po Elder.

**Úkoly:**
- `lili_genesis` v localStorage — NIKDY nepřepisovat. Při prvním bootu: `Date.now()`.
- `getAge()` → milliseconds od genesis
- `getLifePhase()` → hatchling/juvenile/adult/mature/elder (plynulé přechody s lineární interpolací)
- `interpolateParams(phase)` → vrací aktuální hodnoty:
    - bodyR (8-32px), maxVelocity (4.0→0.4), maxForce (0.4→0.05)
    - epsilon (0.85→0.05), tentacle frequency, idle threshold
    - DOM interaction probability, damping, glow intensity
- Fáze jako plynulé přechody (lerp), ne skokové
- Napojení na všechny systémy: steering, FABRIK, chromatofory, RL
- `lili_visits` inkrement při každém bootu

**Výstup:** Parametry Lili se plynule mění s reálným časem. Hatchling = rychlá a chaotická, Elder = téměř nehybná.

## Fáze 8: Q-Learning — jádro autonomie

**Cíl:** Plný RL agent řídící chování Lili + kompletní akademická datová vrstva.

### 8A: Q-Learning engine

- **State vector:** kombinace 7 senzorických vstupů (cursor_proximity × cursor_velocity × dom_density × whitespace_proximity × scroll_state × time_of_day × age_phase) = cca 3×4×3×3×2×4×5 = 4320 stavů
- **Action space:** 7 akcí (wander, seek_whitespace, flee, explore_dom, idle, seek_edge, follow_slow)
- **Q-tabulka:** `Map` nebo objekt, klíč = serializovaný state string, hodnota = array[7] Q-hodnot
- **Bellmanova rovnice:** `Q(s,a) ← Q(s,a) + α[R + γ·max(Q(s',a')) - Q(s,a)]`, α=0.1, γ=0.85
- **Epsilon-greedy:** `ε` z age systému (0.85→0.05)
- **Reward function** (přesně dle PRD):
    - +1.0: agent v whitespace, uživatel čte
    - +0.8: úspěšný flee od rychlého kurzoru
    - +0.5: explore_dom s nízkým stresem
    - +0.3: agent na okraji, uživatel aktivní ve středu
    - -2.0: agent nad textem, kurzor stojí (blokuje čtení)
    - -1.0: kolize s DOM elementem
    - -0.5: idle příliš dlouho (modulováno věkem)
    - -0.3: flee při pomalém/dalekém kurzoru
    - -0.2: opakování stejné akce > N kroků
- **Decision cycle:** každých 30-60 framů (ne každý frame)
- **Persistence:** Q-tabulka → JSON → `localStorage.lili_qtable`, save každých ~600 framů + `beforeunload`
- **Napojení na steering:** výstup RL akce → nastavení vah behaviors (tabulka z PRD 5.3)

### 8B: Behavioral Journal — akademická datová vrstva

Účel: kompletní záznam učení a chování pro pozdější vědeckou analýzu.

**`lili_journal`** — strukturovaný log v localStorage (+ export):

- **Decision log (per decision cycle):**
    - `timestamp`, `age_ms`, `life_phase`
    - `state_vector` (plný diskrétní stav)
    - `chosen_action`, `was_exploratory` (bool — ε-greedy roll)
    - `reward`, `q_values_before`, `q_values_after`
    - `stress_level`, `cursor_speed`, `position`

- **Denní agregáty (midnight snapshot):**
    - Action distribution (kolikrát která akce za den)
    - Average reward per decision cycle
    - Exploration rate (skutečný poměr explorativních vs. exploatačních rozhodnutí)
    - State visitation frequency (top 20 nejnavštěvovanějších stavů)
    - Spatial heatmap (diskretizované pozice → frekvence)
    - Stress histogram (distribuce stresu za den)
    - Q-table snapshot hash (pro detekci konvergence)
    - Total decisions, total reward, session duration

- **Milníky (event log):**
    - Phase transitions (hatchling→juvenile atd.) s timestampem
    - First occurrence of each action
    - Q-value convergence events (když se max delta Q klesne pod threshold)
    - Behavioral shifts (když se top akce v daném stavu změní)
    - Longest idle streak, longest wander streak

- **Periodické Q-table snapshoty:**
    - Kompletní Q-tabulka uložená každých 7 dní jako `lili_qtable_snapshot_YYYYMMDD`
    - Umožňuje rekonstrukci "evoluce mozku" v čase

**Storage management:**
- Decision log: ring buffer posledních ~5000 rozhodnutí (FIFO, starší se mažou)
- Denní agregáty: uchovávat navždy (malé — cca 500B/den = ~180KB/rok)
- Q-table snapshoty: uchovávat navždy (cca 15KB/snapshot × 52/rok = ~780KB/rok)
- Celkový footprint: ~1-2MB/rok — v localStorage limitu 5-10MB na většinu let

### 8C: Export systém

- **Debug panel (klávesa `E`):** Export all data jako JSON soubor
- Formát exportu: `lili_export_YYYYMMDD.json` obsahující:
    - Metadata: genesis timestamp, current age, current phase, website URL hash
    - Kompletní Q-tabulka (aktuální)
    - Všechny denní agregáty od genesis
    - Všechny Q-table snapshoty
    - Event/milestone log
    - Decision ring buffer
- Alternativní CSV export pro denní agregáty (snazší import do Pythonu/R/Excel)
- Export neovlivňuje běh — pure read operace

**Výstup:** Lili se autonomně učí. Kompletní akademická data k dispozici pro analýzu kdykoli.

## Fáze 9: DOM interakce a noční úklid

**Cíl:** Haptická interakce s obsahem stránky + denní reset.

**Úkoly:**
- **Word Indexer:** při bootu obalit textové uzly do `<span class="lili-word">` (jednou, nevratně)
- **Disturb element:** `transform: rotate(±5°max) translate(±8px max)`, `transition: 0.3s ease`
- `data-lili-touched = Date.now()` na dotčené elementy
- Max 4 disturbed elementy současně
- Interakce trvá 4-18s, pak smooth return (transition 0.8s)
- **Midnight Cleanup:** kontrola každou minutu, porovnání `lili_last_cleanup` vs. aktuální datum. Při přechodu dne:
    - Všechny `[data-lili-touched]` elementy → `transition: 1.2s ease-out`, reset transform + color
    - Po 1.4s: remove transition + data atribut
    - Uložit nový `lili_last_cleanup` timestamp
- **Reverzibilita:** POUZE `transform` a `color`. NIKDY width, height, display, position, margin, innerHTML.

**Výstup:** Lili "oťukává" slova chapadly, ráno se stránka vrátí do původního stavu.

## Fáze 10: Click, Tooltip, Debug panel

**Cíl:** Uživatelská interakce a diagnostika.

**Úkoly:**
- **Click detection:** `document.addEventListener('click')`, Euklidovská vzdálenost `< bodyR * 2.5` = hit
- **Tooltip:** absolutně pozicovaný DOM element, monospace font, ostrý kontrast.
    - Obsah: name ("Lili"), age (formátovaný), phase, preference (top Q-action), visits
    - Emergentní data z enginu — žádné autorské hlášky
    - Auto-dismiss po 3.5s
- **Debug panel:**
    - Toggle: klávesa `D` (keydown)
    - Fixed pozice, tmavý BG, monospace, 12px, semi-transparent
    - Obsah: phase, age, state vector, current action, Q-values, stress, velocity, disturbed count, FPS, spatial hash cell count

**Výstup:** Klik na Lili = faktický tooltip. Klávesa D = kompletní debug info.

## Fáze 11: Persistence schema + finální integrace

**Cíl:** Kompletní localStorage schema a edge cases.

**Úkoly:**
- localStorage keys: `lili_genesis` (NIKDY přepsat), `lili_qtable` (JSON, ~10s), `lili_position` (JSON, ~5s), `lili_last_cleanup`, `lili_visits`
- Celkový footprint < 15KB
- Při bootu: restore pozice, Q-tabulka, genesis check
- `beforeunload`: final save
- Edge cases: corrupted localStorage → graceful fallback (nová inkarnace)
- Promazání localStorage = nový Hatchling (by design)

**Výstup:** Lili přežívá refresh, pokračuje kde skončila.

## Fáze 12: Optimalizace a polish

**Cíl:** Výkonnostní cíle a robustnost.

**Úkoly:**
- FPS monitoring: target 60fps, warning pod 50fps
- CPU overhead: < 2% idle, < 5% plný pohyb
- Memory: < 5MB JS heap
- Init: < 200ms od DOMContentLoaded
- Soubor: < 50KB minified, < 80KB unminified
- `document.hidden` → pauza kalkulací
- Spatial hash throttling
- Q-Learning decision cycle throttling (30-60 framů)
- FABRIK max 3-4 iterace
- Testování na stránkách s 500+ DOM elementy
- MutationObserver pro SPA navigace / lazy loading
- Edge cases: extrémně malý viewport, extrémně velká stránka, zero DOM elements

---

## Testovací kritéria (z PRD)

- Po 10 minutách pozorování není zřejmé cyklické opakování
- Hatchling viditelně chaotičtější než Adult
- Elder téměř nehybná (a nepůsobí jako bug)
- Kurzor přes Lili vyvolá únik (ne pokaždé — záleží na naučeném)
- Rozházená slova se o půlnoci vrátí
- Po refresh Lili pokračuje (pozice + Q-tabulka)
- FPS ≥ 50 na stránce s 500+ DOM elementy
- Lili nikdy nezablokuje klik na odkaz/tlačítko
- Promazání localStorage → nový Hatchling
- Debug panel (D) zobrazí runtime parametry
- Funguje jedním `<script>` tagem v jakémkoli HTML

---

## Akademické metriky a výzkumné otázky

### Krátkodobé metriky (dny/týdny)

- **Q-value convergence curve:** průměrná absolutní změna Q-hodnot per decision cycle — klesá s učením?
- **Exploration/exploitation ratio:** skutečný poměr náhodných vs. naučených rozhodnutí (ne jen ε — ale reálný)
- **Reward accumulation:** kumulativní odměna per session — roste s učením?
- **State visitation distribution:** Zipfovo rozdělení? Které stavy dominují?
- **Action entropy:** Shannon entropy akčního rozdělení — klesá s věkem? (chaos → specializace)
- **Response latency:** průměrný počet framů od detekce hrozby po flee akci

### Střednědobé metriky (měsíce)

- **Behavioral repertoire shift:** jak se mění action distribution mezi fázemi?
- **Spatial preference evolution:** vyvíjí se preferované zóny na stránce? Jsou stabilní?
- **Circadian behavioral patterns:** liší se chování ráno vs. noc? (měřeno přes action distribution per time_of_day)
- **Policy stability index:** jak často se mění preferovaná akce v daném stavu? (měřeno z Q-table snapshotů)
- **Stress habituation:** klesá průměrný stress level s věkem? Učí se Lili zvládat hrozby?

### Dlouhodobé metriky (roky)

- **Kompletní ontogenetická křivka:** vizualizace všech parametrů přes celý životní cyklus
- **Knowledge retention:** po dlouhé neaktivitě (týdny) — jak rychle se adaptuje zpět?
- **Q-table final state:** konverguje k jedné stabilní policy, nebo osciluje?
- **Cross-site comparison:** pokud Lili žije na různých stránkách různých uživatelů — liší se naučené Q-tabulky?
- **Behavioral fingerprint:** je Q-tabulka unikátní per uživatel/stránka? Dá se z ní inferovat typ stránky nebo uživatelský vzorec?

### Výzkumné otázky (pro akademický paper)

1. Dokáže tabulární Q-Learning agent konvergovat k stabilní policy v otevřeném, nestatickém DOM prostředí?
2. Jak se liší emergentní chování Hatchling vs. Elder kvalitativně? Je rozdíl pozorovatelný lidským okem?
3. Existuje korelace mezi uživatelským chováním (scroll patterns, cursor speed) a naučenou Q-tabulkou?
4. Je biologicky inspirovaný reward shaping efektivnější než náhodný pro dosažení "zdvořilého" chování v DOM?
5. Jaká je minimální velikost state space pro emergenci netriviálního chování v tomto kontextu?

---

## Architektura rozšiřitelnosti (v2.0+)

Návrh v1.0 musí být připravený na budoucí rozšíření. Klíčový princip: **čisté rozhraní mezi mozkem a tělem.**

### Brain Interface (adapter pattern)

Všechna rozhodování prochází jedním rozhraním:

- `brain.chooseAction(stateVector)` → vrací akci (string)
- `brain.learn(state, action, reward, nextState)` → aktualizuje interní model
- `brain.serialize()` → JSON pro persistence
- `brain.deserialize(json)` → restore
- `brain.getMetrics()` → data pro journal/debug

v1.0 implementace: `QLearningBrain` (tabulární Q-Learning)

Budoucí mozky (v2.0+):
- `DQNBrain` — Deep Q-Network s malým neural netem
- `LLMBrain` — Cloud API (GPT/Claude) pro rozhodování s přirozeným jazykem
- `OpenClawBrain` — AGI/OpenClaw integrace
- `HiveBrain` — sdílený mozek přes WebSocket — všechny Lili se učí navzájem

Výměna mozku = výměna jednoho objektu. Tělo (steering, FABRIK, rendering) se nemění.

### Distribuce — Lili pro všechny

**v1.0:** Jeden soubor, lokální. `<script src="/lili.js" defer>`

**v2.0 vize:**
- `lili.js` hostovaný na CDN (npm, unpkg, nebo vlastní)
- Každá instance automaticky unikátní:
    - Jiný uživatel (kurzor, scroll) → jiná Q-tabulka → jiné chování
    - Jiná stránka (DOM layout) → jiné prostorové preference
    - Jiný genesis timestamp → jiný vizuál (subtle seed-based variace barvy/tvaru)
- Volitelná konfigurace přes data atributy: `<script src="lili.js" data-lili-name="Olga" data-lili-hue="280">`
- Možnost sdílení Q-tabulky (export/import) — "adopce" cizí Lili

### Psychosomatická vizuální individualita (už v1.0)

Biologický princip: **psychosomatické stavy ovlivňují fyziologii.** Stresovaná chobotnice v přírodě vypadá jinak než klidná. Totéž musí platit digitálně.

Každá Lili bude vypadat trochu jinak na základě:
- **Genesis seed (vrozené):** hash genesis timestampu → subtle variace base hue (±15°), tělesných proporcí (±5%), očních pozic, tentacle thickness (±10%)
- **Prostředí (adaptace):** stresová stránka → tmavší, menší, kompaktnější chapadla, vyšší glow (obrana). Klidná stránka → světlejší, větší, relaxovaná. Mění se POMALU přes dny/týdny.
- **Věk (ontogeneze):** Hatchling světlá a malá, Elder tmavá a monumentální
- **Naučené chování (osobnost):** Plachá Lili (flee) = menší, bledší. Zvědavá (explore) = větší oči, jasnější. Klidná (idle) = hluboké stabilní tóny.

Implementováno přes dlouhodobé průměry z behavioral journalu (denní agregáty), ne okamžité stavy.

Detail: viz `docs/design/README.md`

### Implementační pravidlo pro v1.0

Všechny rozhodovací funkce prochází přes `brain` objekt. Žádné přímé volání Q-tabulky z jiných modulů. To zajistí, že výměna mozku v budoucnu bude trivial refactor.

---

*Tento dokument je živý — aktualizuje se v průběhu implementace.*
