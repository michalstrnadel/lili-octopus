# Lili — Implementační plán

Autonomní digitální chobotnice žijící na HTML stránce. Jeden soubor `lili.js`, nula závislostí, nula build pipeline.

**Akademický experiment v digitální ontogenezi** — veškerá data učení jsou exportovatelná a analyzovatelná.

## Shrnutí projektu

Lili je RL agent (Q-Learning) ve formě procedurálně animované chobotnice. Žije na libovolné webové stránce jako ambientní společník. Její chování emerguje z odměn/trestů — nic není skriptované. Životní cyklus: 10 reálných let (Hatchling → Elder).

Klíčové technologie: Q-Learning, Craig Reynolds Steering Behaviors, FABRIK IK, Spatial Hashing, Simplex Noise, Canvas 2D, localStorage persistence.

## Vizuální filozofie

**Minimalistická, ale živá.** Inspirace: reálné chobotnice (Octopus vulgaris, Abdopus aculeatus). Důraz na biologickou věrnost pohybu, ne na detail textury.

**Klíčové vizuální principy:**

- **Jet propulsion pohyb:** chobotnice se nepohybují lineárně — stahují mantle a vystřelují vodu. Wander behavior musí simulovat pulse-glide cyklus (krátký impuls + dlouhý klouzavý drift s decelerací)
- **Chapadla trailing:** při pohybu chapadla přirozeně zaostávají za tělem (drag), při zastavení se rozprostřou do stran (relaxace). Nikdy se nepohybují synchronně — fázový posun mezi chapadly je klíčový.
- **Měkké tělo:** Simplex noise deformace mantlu simuluje svalové kontrakce. Tělo se mírně zmenšuje při impulsu a expanduje při driftu.
- **Chromatofory jako emoce:** barva není dekorace — je to jediný komunikační kanál organismu. Musí být okamžitě čitelná (stress = zahřátí k červené, klid = hluboká modř).
- **Oči jako jádro personality:** pupily sledující kurzor jsou primární bod empatie. Velikost pupil reaguje na stress (rozšíření = strach). Mrkání jako idle animation.
- **Subtilní glow:** radialGradient kolem těla — ne jako „efekt", ale jako bioluminiscence. Intenzita klesá s věkem.

---

## Fáze 1: Kostra, Canvas, Boot, Vec2, Noise

**Cíl:** Spustitelný IIFE s canvasem a základní matematikou.

**Soubor:** `/public/lili.js`

**Pracovní celky:**

### 1A: IIFE a konfigurační systém
- IIFE wrapper s `'use strict'`
- `CFG` objekt se všemi konstantami (rychlosti, velikosti, prahy, hyperparametry RL)
- Deterministický seed systém pro reprodukovatelnost (Research #5): fixní seed pro Simplex Noise, oddělený seed pro RL rozhodování — umožňuje přesné párové testování

### 1B: Vec2 matematika
- `Vec2` třída/objekt: `add`, `sub`, `mult`, `div`, `mag`, `normalize`, `limit`, `dist`, `dot`, `copy`, `set`
- Všechny operace in-place (mutující) i pure (vracející nový) — preferovat in-place v hot path pro eliminaci GC (Research #3)

### 1C: Simplex Noise generátor
- Self-contained implementace (~100 řádků)
- Potřebný pro Wander behavior, vizuální deformace, organický pohyb chapadel
- Deterministický seed (viz 1A) — klíčové pro reprodukovatelnost experimentu

### 1D: Canvas bootstrap a lifecycle
- Vytvoření `<canvas id="lili-canvas">`, `position:fixed`, `100vw×100vh`, `pointer-events:none`, `z-index:9999`
- HiDPI handling: `canvas.width = innerWidth * devicePixelRatio`, context scale
- Resize handler s debounce (150ms)
- `document.hidden` check — pause při neviditelném tabu
- `requestAnimationFrame` loop skeleton (zatím prázdný update/render)
- `DOMContentLoaded` boot sequence

**Výstup:** Prázdný transparentní canvas přes celou stránku, `<script src="/lili.js" defer>` funguje.

## Fáze 2: Steering Behaviors — pohyb bez RL

**Cíl:** Lili se plynule pohybuje po stránce pomocí Reynoldsových algoritmů.

**Pracovní celky:**

### 2A: Fyzikální model těla
- Lili state objekt: `position` (Vec2), `velocity` (Vec2), `acceleration` (Vec2), `bodyR`, `maxSpeed`, `maxForce`, `damping`
- Physics update per frame: `acceleration → velocity → position`, truncate, damping

### 2B: Steering behaviors
- **Wander:** projekce kruhu (wanderDistance, wanderRadius), target bod posouvaný Simplex noise (ne `Math.random`). Organické křivky.
- **Seek / Arrive:** vektor k cíli, deceleration radius pro plynulé zastavení
- **Flee / Evade:** Flee = opačný vektor od hrozby. Evade = predikce budoucí pozice kurzoru z jeho velocity.
- **Obstacle Avoidance:** ahead vector (délka ~ `speed/maxSpeed * MAX_SEE_AHEAD`), test kolize bounding circle vs. bounding boxy DOM elementů
- **Boundary:** měkké odpuzování od okrajů viewportu (ne tvrdé odrazy)

### 2C: Behavior weight system
- Váhy se mění podle aktuální akce (tabulka z PRD sekce 5.3)
- Pro testování: fixní akce `wander` s obstacle avoidance a boundary vždy aktivní

**Výstup:** Viditelný kruh (placeholder) plynule pluje po stránce, obchází DOM elementy, neprochází přes okraje.

## Fáze 3: FABRIK IK — chapadla jako autonomní jednotky

**Cíl:** 8 procedurálně animovaných chapadel s inverzní kinematikou a lokální inteligencí.

**Biologický princip:** Reálné chobotnice mají 2/3 neuronů v chapadlech. Každé chapadlo je semi-autonomní — dokáže samostatně reagovat na podněty bez čekání na centrální mozek.

**Pracovní celky:**

### 3A: FABRIK solver — datové struktury a algoritmus
- **Topologie: 8 nezávislých řetězců** (ne strom). Každé chapadlo je izolovaný kinematický řetězec s vlastním kořenem ukotveným na kružnici těla. Eliminuje centroidy, umožňuje paralelní zpracování. (Research #3)
- **Float32Array alokace:** Pozice uzlů uloženy v `Float32Array` (index `i*2` = X, `i*2+1` = Y). Zero-allocation v render loop — žádné `new` objekty v hot path. Eliminuje GC stutter. (Research #3)
- 8 chapadel × 8 segmentů. Segment délka modulovaná věkem (zatím fixní default).
- Anchor points: rovnoměrně po obvodu těla (45° rozestupy), rotované ve směru pohybu
- FABRIK solver:
    - Forward Reach: tip → target, přepočet pozic od tipu k base (zachování délky segmentů)
    - Backward Reach: base → anchor, přepočet od base k tipu
    - **Max 1-3 iterace per frame** (díky temporal coherence při 60fps je to dostatečné — Research #3). Drobná nepřesnost u měkkého hydrostatu působí jako přirozená měkkost tkáně.
    - Reachability check: pokud `dist(base, target) > totalLength` → natáhnout do přímky

### 3B: Procedurální generování pohybu — biomechanický model
- **Asymetrický power-stroke/recovery model** (Research #3, #1): Pohyb chapadel se dělí do dvou fází — rychlý silový záběr (power stroke, chapadla se stahují k tělu) + pomalá návratová fáze (recovery, chapadla se rozevírají). Nelineární časová modulace: `asyncTime = t + 0.4 * sin(t)`.
- **Fázový posun per chapadlo:** Distribuce fází pro 8 chapadel:
    - G4 (střídavý symetrický): L1,L3,R2,R4 fáze=0; L2,L4,R1,R3 fáze=π — stabilní „kráčivý" pohyb
    - Radial Wave (vlnivý): postupně od 0 do 7π/4 po krocích π/4 — plynulé vlnění pro klidové stavy
    - Výběr vzoru řídí aktuální nálada organismu
- **Simplex noise injection** (Research #3): Šum se přičítá jako offset k amplitudě a úhlu targetu (ne přímo na souřadnice). `noiseFunction(t * 0.5 + index * 10) * 20` — každé chapadlo má unikátní noise offset.

### 3C: Trailing physics — Mass-Spring-Damper model
- **Fyzikální model vlečného efektu** (Research #3): Každé chapadlo místo přímého následování `TargetIdeal` vlastní `TargetActual` s vlastní velocity.
- **Hookův zákon + viskózní tlumení:**
    - Pružná síla: `F_spring = stiffness * (idealPos - actualPos)`
    - Viskózní tlumení: `F_damp = damping * velocity`
    - Semi-implicitní Eulerova integrace per frame
- **Kalibrované parametry pro kritické tlumení** (Research #3):
    - `stiffness = 0.10–0.18` (realistické podvodní prostředí)
    - `damping = 0.75–0.85` (žádný overshoot, plynulý dojezd)
    - Hodnoty mimo tento rozsah → buď robotický pohyb (příliš tuhé) nebo „gumový" efekt (příliš měkké)

### 3D: Lokální stav a inteligence per chapadlo
- `localStress` — roste při kontaktu s kurzorem, klesá v klidu
- `touching` — jaký DOM element právě cítí (nebo null)
- `curiosity` — jak moc chce zkoumat (ovlivněno globální náladou)
- `recoilTimer` — reflexní stažení po kontaktu s hrozbou
- `heldElement` — DOM element který nese (nebo null)
- `grip` — síla úchopu (klesá s časem, stresem)
- **Lokální chování tipů (bez centrálního mozku):**
    - Reflexní stažení: tip se přiblíží kurzoru → okamžitý recoil
    - Hmatová explorace: tip narazí na DOM element → lokální zvědavost → ohmatání hrany
    - Uchopení: globální nálada „zvědavá" + zajímavý element → grab
    - Samovolná relaxace: v klidu se chapadla rozprostřou nezávisle
- Target generování podle kontextu + nálady:
    - **Plavání:** sinusoidní vlna se zpožděním per chapadlo, fáze `(index/8)*2π`
    - **Explorace:** 1-3 chapadla cílí na nejbližší DOM elementy
    - **Útěk:** chapadla se stahují dozadu za tělo
    - **Klid:** gravitační klap dolů, jemné pulzování

**Výstup:** Chobotnice s 8 semi-autonomními chapadly — každé cítí, reaguje a rozhoduje lokálně.

## Fáze 4: Vizuální systém — tělo, oči, chromatofory, glow

**Cíl:** Kompletní procedurální rendering organismu.

**Pracovní celky:**

### 4A: Rendering chapadel — hull/envelope přístup
- **Zásadní rozhodnutí z Research #3:** Nepoužívat `ctx.stroke()` s `lineWidth` — Canvas API neumí dynamicky měnit tloušťku podél jedné cesty. Segmentované tahy vedou k vizuálním defektům v záhybech.
- **Hull (obálka) rendering:**
    1. V každém FABRIK uzlu spočítat tangentní vektor (střední směr sousedních vektorů)
    2. Z tangenty vygenerovat normálu (kolmý vektor, rotace o 90°)
    3. Definovat tloušťku `w_i` per uzel: `w_i = baseWidth * (1 - i/numJoints)` (lineární tapering base→tip)
    4. Pro každý uzel vygenerovat dva odsazené body: `L_i = P_i + n_i * w_i` a `R_i = P_i - n_i * w_i`
    5. Nakreslit Catmull-Rom spline přes pravou stranu, `arc()` na špičce, zpět přes levou stranu
    6. Uzavřít cestu a `ctx.fill()` — organický tvar bez artefaktů
- **Catmull-Rom → Bézier konverze** (Research #3): Canvas API nemá nativní Catmull-Rom. Konverze: z bodů P0,P1,P2,P3 vypočítat Bézierovy kontrolní body `CP1 = P1 + (P2-P0)/tension` a `CP2 = P2 - (P3-P1)/tension` (tension=6). Krajní body extrapolovat zrcadlením.
- Simplex noise na šířce obálky pro organický profil
- `globalAlpha` fade na tipech

### 4B: Tělo a glow
- **Tělo:** Ellipse (`radiusX = bodyR * 0.78`, `radiusY = bodyR * 1.0`), Simplex noise deformace okrajů
- **Glow:** `radialGradient` kolem těla, alfa modulována denní dobou

### 4C: Oči
- 2 oči na horní třetině. Pupily sledují kurzor (max offset = `radius_oka * 0.3`).
- Flee = pupily se rozšíří. Idle/sleep = přivřené (arc).

### 4D: Chromatofory — HSL barevný systém
- Base hue: `lerp(200, 240, ageNormalized)` (ocean blue → deep indigo)
- Cirkadiánní posun: ráno teplejší, noc chladnější/tmavší
- Stress: `hue -= stress * 50` (zahřátí k červené), `saturation += stress * 25`
- Flee flash: kontrastní probliknutí, decay 300ms

### 4E: Rendering pipeline per frame
1. `clearRect`
2. Glow (radialGradient)
3. **State batching** (Research #3): Jedno `ctx.beginPath()`, všechny chapadlové hull cesty jako sub-paths (oddělené `moveTo`), jedno `ctx.fill()` na konci. Dramaticky snižuje počet state changes v Canvas API.
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

## Fáze 6: Senzorický systém (globální + per-chapadlo)

**Cíl:** Dvouúrovňový senzorický systém — globální vstupy pro Q-Learning + lokální vstupy per chapadlo.

**Pracovní celky:**

### 6A: Globální senzory (vstupy pro Q-Learning nálady)
- **Kurzor:** `mousemove` listener → `mouseX, mouseY, mouseVX, mouseVY, mouseSpeed` (exponenciální klouzavý průměr). Klasifikace: still(<2), slow(2-8), fast(8-20), aggressive(>20).
- **Scroll:** `scroll` listener + timeout 200ms pro detekci idle/active
- **Denní doba:** `getTimeOfDay()` → morning/afternoon/evening/night z `new Date().getHours()`
- **DOM density:** z spatial hashe — `getNearby()` count → sparse/medium/dense
- **Whitespace proximity:** test zda je agent v prázdném prostoru
- **Cursor proximity:** vzdálenost kurzor↔agent → far/medium/near

### 6B: Lokální senzory per chapadlo
- **Tip proximity to cursor:** vzdálenost špičky chapadla od kurzoru → recoil trigger
- **Tip touching DOM:** jaký element tip právě dotýká (z spatial hashe)
- **Held element state:** nese něco? jak dlouho? jak daleko od původní pozice?

### 6C: Agregace a stress model
- **Stress model:** float 0-1, exponential smoothing. Agreguje: globální kurzor input + počet chapadel v recoil stavu + počet kolizí.
- **Tentacle feedback:** kolik chapadel právě exploruje / drží element / je v recoilu → informuje globální stav

**Výstup:** Globální state vector pro Q-Learning + lokální stav každého chapadla pro autonomní reakce.

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

## Fáze 8: Q-Learning — koordinátor nálad

**Cíl:** RL agent nastavující nálady/tendence organismu + kompletní akademická datová vrstva.

**Biologický princip:** Q-Learning nefunguje jako velitel vydávající příkazy. Funguje jako hormonální systém — nastavuje nálady/tendence, které chapadla a tělo interpretují lokálně. Chování emerguje z kombinace nálady + lokální inteligence chapadel + prostředí.

### 8A: Q-Learning engine

- **State vector:** kombinace 7 senzorických vstupů (cursor_proximity × cursor_velocity × dom_density × whitespace_proximity × scroll_state × time_of_day × age_phase) = cca 3×4×3×3×2×4×5 = 4320 stavů
- **Mood space (místo action space):** Q-Learning vybírá náladu, ne přímou akci:
    - `curious` — chapadla aktivně explorují, vyšší pravděpodobnost uchopení
    - `playful` — chapadla hledají elementy k manipulaci
    - `shy` — chapadla se stahují za tělo, nízká interakce
    - `calm` — chapadla se rozprostřou, pomalé pohyby, whitespace seeking
    - `alert` — zvýšená pozornost, připravena na flee
    - `idle` — minimální aktivita, „meditace"
    - `exploring` — seek okrajů, zkoumání neznámých oblastí
- **Q-tabulka:** `Map` nebo objekt, klíč = serializovaný state string, hodnota = array[7] Q-hodnot pro 7 nálad
- **Bellmanova rovnice:** `Q(s,m) ← Q(s,m) + α[R + γ·max(Q(s',m')) - Q(s,m)]`, α=0.1, γ=0.85
- **Epsilon-greedy:** `ε` z age systému (0.85→0.05)
- **Reward function:**
    - +1.0: agent v whitespace, uživatel čte (nálada calm/idle)
    - +0.8: úspěšný únik od rychlého kurzoru (chapadla reflexně + nálada shy)
    - +0.5: explorace DOM s nízkým stresem (nálada curious)
    - +0.3: hravá interakce s elementem, uživatel nečte (nálada playful)
    - +0.3: agent na okraji, uživatel aktivní ve středu
    - -2.0: agent nad textem, kurzor stojí (blokuje čtení)
    - -1.0: držený element překáží čtení
    - -0.5: idle příliš dlouho (modulováno věkem)
    - -0.3: shy nálada při pomalém/dalekém kurzoru (zbytečný strach)
    - -0.2: opakování stejné nálady > N cyklů
- **Decision cycle:** každých 30-60 framů (ne každý frame)
- **Persistence:** Q-tabulka → JSON → `localStorage.lili_qtable`, save každých ~600 framů + `beforeunload`
- **Napojení:** výstup nálady → ovlivňuje: steering váhy + chapadlové parametry (curiosity, grip) + chromatoforovou reaktivitu

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
    - **Shannon entropy akčního rozdělení** (Research #5): `H = -Σ p(a) log₂ p(a)` — míra neurčitosti v rozložení akcí. Vysoká = chaotická explorace, nízká = specializované chování.
    - **Lempel-Ziv komplexita** (Research #5): LZC denní sekvence akcí — počet unikátních podřetězců. Komprimovatelnost sekvence měří strukturální redundanci (naučené rutiny vs. náhodný šum).

- **Milníky (event log):**
    - Phase transitions (hatchling→juvenile atd.) s timestampem
    - First occurrence of each action
    - Q-value convergence events (když se max delta Q klesne pod threshold)
    - Behavioral shifts (když se top akce v daném stavu změní)
    - Longest idle streak, longest wander streak

- **Periodické Q-table snapshoty:**
    - Kompletní Q-tabulka uložená každých 7 dní jako `lili_qtable_snapshot_YYYYMMDD`
    - Umožňuje rekonstrukci „evoluce mozku" v čase
    - **Policy transition matrix** per snapshot (Research #5): matice pravděpodobností přechodů mezi náladami — vizualizuje strukturální evoluci politiky

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
- **Export je KRITICKÝ** (Research #4): Vzhledem k Safari ITP 7-day eviction riziku a obecné křehkosti localStorage pro 10letý horizont je JSON export jediná spolehlivá záchranná síť pro akademická data.

**Výstup:** Lili se autonomně učí. Kompletní akademická data k dispozici pro analýzu kdykoli.

## Fáze 9: DOM interakce — hmatová explorace, hra a noční úklid

**Cíl:** Víceúrovňová haptická interakce s obsahem stránky + denní reset.

**Biologický princip:** Chapadla chobotnic zkoumají prostředí hmatem a chutí. Mohou uchopovat objekty, manipulovat s nimi, předávat si je. Toto není skriptované — je to lokální rozhodnutí chapadla ovlivněné globální náladou.

**Pracovní celky:**

### 9A: Word Indexer
- Při bootu obalit textové uzly do `<span class="lili-word">` (jednou, nevratně)
- Každý span dostává `data-lili-shape` atribut (round/angular/mixed) pro tvarovou afinitu

### 9B: Úrovně DOM interakce

1. **Ohmatání (touch):** Tip chapadla se dotkne elementu → mírný `rotate(±5°) translate(±8px)`, `transition: 0.3s`
    - `data-lili-touched = Date.now()`
    - Spouštěč: chapadlo v dosahu + curiosity > threshold

2. **Zájem (interest):** Opakovaný kontakt se stejným elementem → chapadlo zůstává déle
    - Spouštěč: mood = curious/playful + element není `<a>` nebo `<button>`

3. **Uchopení (grab):** Chapadlo element uchopí → `data-lili-held="tentacle_index"`
    - Element začne sledovat pozici tipu chapadla (`transform: translate()`)
    - Max 2 held elementy současně (omezená „síla")
    - Nikdy neuchopí interaktivní elementy (`<a>`, `<button>`, `<input>`)

4. **Hra (play):** Element se houpá, rotuje, případně se předává mezi chapadly
    - Vizuelně: písmenko/slovo putuje po stránce s Lili
    - Doba držení: 10-60s, pak grip klesá → pustení

5. **Puštění (drop):** Ztráta zájmu / stress (flee drops vše) / midnight cleanup
    - Element se animovaně vrátí na původní místo (`transition: 0.8s ease-out`)
    - Remove `data-lili-held`

### 9C: Výběr elementů a afinita
- Dostupnost: element v dosahu tipu chapadla (ze spatial hashe)
- Velikost: pouze malé elementy (single character nebo krátké slovo)
- Tvarová afinita: kulaté tvary (O, 0, o, Q...) mohou mít vyšší atraktivitu
- Emergentní preference: RL se učí, které interakce generují pozitivní reward

### 9D: Midnight Cleanup
- Kontrola každou minutu, porovnání `lili_last_cleanup` vs. aktuální datum
- Při přechodu dne:
    - Všechny `[data-lili-touched]` a `[data-lili-held]` elementy → `transition: 1.2s ease-out`, reset transform + color
    - Po 1.4s: remove transition + data atributy
    - Uložit nový `lili_last_cleanup` timestamp
- **Reverzibilita:** POUZE `transform` a `color`. NIKDY width, height, display, position, margin, innerHTML.

**Výstup:** Chapadla autonomně zkoumají, uchopují a hrají si s obsahem stránky. Ráno se vše vrátí.

## Fáze 10: Click, Tooltip, Debug panel

**Cíl:** Uživatelská interakce a diagnostika.

**Úkoly:**
- **Click detection:** `document.addEventListener('click')`, Euklidovská vzdálenost `< bodyR * 2.5` = hit
- **Tooltip:** absolutně pozicovaný DOM element, monospace font, ostrý kontrast.
    - Obsah: name („Lili"), age (formátovaný), phase, preference (top Q-action), visits
    - Emergentní data z enginu — žádné autorské hlášky
    - Auto-dismiss po 3.5s
- **Debug panel:**
    - Toggle: klávesa `D` (keydown)
    - Fixed pozice, tmavý BG, monospace, 12px, semi-transparent
    - Obsah: phase, age, state vector, current action, Q-values, stress, velocity, disturbed count, FPS, spatial hash cell count
    - **Shannonova entropie a LZC** v reálném čase (Research #5)

**Výstup:** Klik na Lili = faktický tooltip. Klávesa D = kompletní debug info.

## Fáze 11: Persistence — schema, strategie a ochrana dat

**Cíl:** Kompletní localStorage schema, edge cases a strategie pro 10letý horizont.

**Pracovní celky:**

### 11A: localStorage schema
- localStorage keys: `lili_genesis` (NIKDY přepsat), `lili_qtable` (JSON, ~10s), `lili_position` (JSON, ~5s), `lili_last_cleanup`, `lili_visits`
- Celkový footprint < 15KB (jádro) + ~1-2MB/rok (journal)
- Při bootu: restore pozice, Q-tabulka, genesis check
- `beforeunload`: final save
- Edge cases: corrupted localStorage → graceful fallback (nová inkarnace)
- Promazání localStorage = nový Hatchling (by design)

### 11B: Strategie pro Safari ITP a 10letý horizont (Research #4)
- **Kritický problém:** Safari ITP automaticky smaže VŠECHNA skriptově zapisovatelná úložiště (localStorage, IndexedDB, SessionStorage, Cache API, OPFS) po 7 dnech uživatelské neaktivity. `navigator.storage.persist()` NECHRÁNÍ před ITP — pouze před storage pressure eviction.
- **Dopad na Lili:** Uživatel na Safari nenavštíví stránku 8+ dní → kompletní ztráta Q-tabulky, genesis, journalu.
- **Mitigační strategie:**
    1. **Export jako primární záchranná síť:** Periodické připomínky exportu (tooltip po N návštěvách). JSON export musí být 100% self-contained pro reimport.
    2. **`navigator.storage.persist()` volání** při bootu — chrání alespoň proti storage pressure na Chrome/Firefox.
    3. **Detekce data loss:** Při bootu porovnat `lili_visits` vs. denní agregáty. Pokud chybí data za období > 7 dní, informovat uživatele o možné ITP evikci.
    4. **Inkrementální reimport:** Klávesa `I` pro import předchozího exportu — obnoví Q-tabulku a journal.
    5. **Budoucí v2.0:** Volitelný cloud backup (opt-in), IndexedDB jako primární storage (větší kapacita), Compression Streams API pro zmenšení dat.
- **localStorage limity:** 5-10 MiB per origin, synchronní blokování — veškerá data musí být kompaktní. JSON.stringify/parse musí být obalené v try/catch pro QuotaExceededError.

**Výstup:** Lili přežívá refresh, pokračuje kde skončila. Uživatel je informován o rizicích a má export/import k dispozici.

## Fáze 12: Optimalizace a polish

**Cíl:** Výkonnostní cíle a robustnost.

**Pracovní celky:**

### 12A: Canvas rendering optimalizace (Research #3)
- **State batching:** Minimalizace `ctx.fillStyle`, `beginPath()`, `fill()` volání. Všechna chapadla stejné barvy = jedna cesta, jeden fill.
- **Path2D cache pro idle pózy:** Když FABRIK konverguje (chapadla se nehýbou), uložit geometrii do `Path2D` objektu. Při dalším frame jen `ctx.fill(cachedPath)` s transformací. Při pohybu dekomprimovat zpět do procedurálních bodů.
- **Render culling:** Pokud je středové tělo mimo viewport + maximální dosah chapadla → přeskočit rendering.
- **Logic LOD:** Entity mimo viewport: snížit FABRIK iterace na 1, nebo řešit chapadla ob snímek (sudá/lichá).

### 12B: Paměťová optimalizace
- **Zero-allocation render loop:** Žádné `new` v hot path. Všechny dočasné vektory pre-alokované.
- **Float32Array** pro FABRIK data (viz Fáze 3A)
- Memory: < 5MB JS heap

### 12C: Výkonnostní cíle a monitoring
- FPS monitoring: target 60fps, warning pod 50fps
- CPU overhead: < 2% idle, < 5% plný pohyb
- Init: < 200ms od DOMContentLoaded
- Soubor: < 50KB minified, < 80KB unminified
- `document.hidden` → pauza kalkulací
- Spatial hash throttling
- Q-Learning decision cycle throttling (30-60 framů)
- FABRIK max 1-3 iterace (temporal coherence)
- Testování na stránkách s 500+ DOM elementy
- MutationObserver pro SPA navigace / lazy loading
- Edge cases: extrémně malý viewport, extrémně velká stránka, zero DOM elements

---

## Fáze 13: Emoční exprese — vizuální manifestace nálad

**Cíl:** Nálady (moods), které Q-Learning už vybírá, se musí vizuálně projevit na těle Lili — autonomně, emergentně, bez skriptovaných animací.

**Biologický princip:** Chobotnice komunikují emoce chromatofory (barva), texturou kůže (papily), pozicí chapadel, tvarem těla a očí. Nejde o „obličejové výrazy" — jde o celotělové somatické stavy. Lili by měla dělat totéž: nálada = fyziologický stav celého organismu, ne nalepená emoji.

**Klíčový constraint:** Žádné skriptované animace typu „když curious, přehraj animaci X". Mood ovlivňuje parametry (rychlosti, amplitudy, prahy), vizuální projev emerguje z těchto parametrů.

**Pracovní celky:**

### 13A: Chromatoforová exprese nálad
- Každá nálada moduluje HSL jinak (ne jen stress → červená):
  - `curious` — hue posun k teplejší tyrkysové, zvýšený jas, jemné pulzování saturace
  - `playful` — rychlejší hue oscilace (±8°), vyšší saturace, „živá" barva
  - `shy` — bledší (vyšší lightness, nižší saturace), zmenšení těla o ~5%
  - `calm` — hluboká stabilní barva, minimální variace, nejnižší glow
  - `alert` — kontrastnější (vyšší saturace), flash při přechodu do alert
  - `idle` — postupné ztmavnutí, „usínací" efekt (lightness klesá)
  - `exploring` — hue drift (pomalé barevné putování), zvýšený glow
- Přechody mezi náladami plynulé (lerp přes ~2s), ne skokové

### 13B: Oční exprese
- Mrkání: idle/calm = častější pomalé mrkání (přivření víček arc clipping)
- Rozšíření pupil: alert/shy = větší pupily (strach), calm/idle = menší (relaxace)
- Pohled: curious = pupily aktivněji sledují DOM elementy (ne jen kurzor), idle = pohled „do prázdna" (pupily se centreují)
- Squint: playful = mírné přivření (arc od ~-0.8π do 0.8π místo plného kruhu)

### 13C: Tělesná exprese
- Dýchání: calm/idle = pomalejší a hlubší (větší amplituda), alert = rychlejší a mělčí
- Mantle kontrakce: shy = stažené tělo (bodyR × 0.92), playful = rozevřené (bodyR × 1.05)
- Glow pulsace: curious/exploring = glow pulzuje v rytmu „zvědavosti" (~0.5 Hz), idle = steady
- Pulse-glide: playful = vyšší frekvence pulzů, calm = minimální pohyb

### 13D: Chapadlová exprese (rozšíření lokální inteligence)
- Poloha/rozprostření:
  - `curious` — 1-3 chapadla se natahují dopředu (explorační póza)
  - `shy` — chapadla stažená za tělo, menší amplituda, tighter cluster
  - `playful` — širší rozprostření, vyšší swim amplituda, živější vlnění
  - `calm` — gravitační klap dolů, pomalé sinusoidní vlnění
  - `alert` — chapadla napjatá, připravená na pohyb, minimální vlnění
  - `idle` — relaxovaně visí, random jemné pohyby
  - `exploring` — asymetrické — některá explorují dopředu, jiná trailing
- Implementace: mood ovlivňuje parametry `swimAmplitude`, `phasePattern`, `relaxGravity`, `noiseScale` per mood (ne per-frame override, ale smooth blend target)

### 13E: Tooltip a debug integrace
- Tooltip: zobrazit aktuální náladu s vizuálním indikátorem (barevný dot vedle textu odpovídající chromatoforové barvě nálady)
- Debug panel: přidat mood history (posledních 10 přechodů s timestampy)
- Console log při mood přechodu (volitelně, jen v debug mode)

### 13F: Mood transition events
- `onMoodChange(prevMood, newMood)` callback systém (analogie k `onPhaseTransition`)
- Transition smoothing: `moodBlend` float 0..1 interpolující mezi předchozí a novou náladou po dobu ~2s
- Milestone logging: „first time mood X lasted > 5 minutes continuously"

**Výstup:** Lili vizuálně „cítí" — pozorovatel rozpozná náladu bez debug panelu. Každá instance Lili má unikátní emoční profil emergující z Q-Learningu a prostředí.

**Poznámka:** Tato fáze NEROZŠIŘUJE mood space (zůstává 7 nálad). Pouze přidává vizuální kanály pro existující nálady. Q-Learning se nemění.

---

## Testovací kritéria (z PRD)

- Po 10 minutách pozorování není zřejmé cyklické opakování
- Hatchling viditelně chaotičtější než Adult
- Elder téměř nehybná (a nepůsobí jako bug)
- Kurzor přes Lili vyvolá únik (ne pokaždé — záleží na naučeném)
- Rozházená slova a odnešené elementy se o půlnoci vrátí
- Lili si občas uchopí písmenko a nosí ho (viditelně chybí na stránce)
- Po refresh Lili pokračuje (pozice + Q-tabulka)
- FPS ≥ 50 na stránce s 500+ DOM elementy
- Lili nikdy nezablokuje klik na odkaz/tlačítko
- Promazání localStorage → nový Hatchling
- Debug panel (D) zobrazí runtime parametry
- Funguje jedním `<script>` tagem v jakémkoli HTML

---

## Akademické metriky a výzkumné otázky

### Kontrolní podmínky — Baselines (Research #5)

Pro akademické prokázání ontogeneze je kritické srovnávat Lili s kontrolními modely:

1. **Random Policy (agent bez učení):** Akce voleny rovnoměrně náhodně, Q-tabulka se neaktualizuje. Absolutní spodní hranice výkonu — pokud Lili nepřekoná random, reward function je chybná.
2. **Frozen Policy (zmrazená politika):** Agent se učí po inicializační dobu, pak `α = 0`, `ε` konstantní. Měří dopad nestacionarity prostředí — výkon by měl s časem degradovat (DOM se mění, uživatel se mění), zatímco učící se Lili by si měla udržet výkon.
3. **Myopic Policy (krátkozraký agent):** Diskontní faktor `γ = 0`. Maximalizuje pouze okamžitou odměnu. Prokazuje schopnost plánovat v dlouhodobém horizontu — „dospělá" Lili by měla vykazovat složitější sekvence chování než myopický agent.
4. **Hard-coded Baseline (pevná heuristika):** Expertní pravidla (např. „kurzor < 50px → flee do rohu"). Referenční bod pro srovnání lidsky definované strategie s emergentním chováním.

**Implementace baselines:** Baselines nemusí běžet live. Stačí implementovat jako alternativní `brain` objekty, které lze přepnout klávesovou zkratkou nebo konfigurací. Data z baselinů se exportují stejným systémem jako hlavní agent.

### Krátkodobé metriky (dny/týdny)

- **Q-value convergence curve:** průměrná absolutní změna Q-hodnot per decision cycle — klesá s učením?
- **Exploration/exploitation ratio:** skutečný poměr náhodných vs. naučených rozhodnutí (ne jen ε — ale reálný)
- **Reward accumulation:** kumulativní odměna per session — roste s učením?
- **State visitation distribution:** Zipfovo rozdělení? Které stavy dominují?
- **Action entropy** (Research #5): Shannon entropy `H = -Σ p(a) log₂ p(a)` akčního rozdělení — Hatchling = vysoká (chaos), Elder = nízká (specializace)
- **Response latency:** průměrný počet framů od detekce hrozby po flee akci

### Střednědobé metriky (měsíce)

- **Behavioral repertoire shift:** jak se mění action distribution mezi fázemi?
- **Spatial preference evolution:** vyvíjí se preferované zóny na stránce? Jsou stabilní?
- **Circadian behavioral patterns:** liší se chování ráno vs. noc? (měřeno přes action distribution per time_of_day)
- **Policy stability index:** jak často se mění preferovaná akce v daném stavu? (měřeno z Q-table snapshotů)
- **Stress habituation:** klesá průměrný stress level s věkem? Učí se Lili zvládat hrozby?
- **Lempel-Ziv komplexita** (Research #5): Komprimovatelnost behaviorálních sekvencí — nízká u Hatchling (šum), vyšší u Elder (naučené rutiny = komprimovatelnější)

### Dlouhodobé metriky (roky)

- **Kompletní ontogenetická křivka:** vizualizace všech parametrů přes celý životní cyklus
- **Knowledge retention:** po dlouhé neaktivitě (týdny) — jak rychle se adaptuje zpět?
- **Q-table final state:** konverguje k jedné stabilní policy, nebo osciluje?
- **Cross-site comparison:** pokud Lili žije na různých stránkách různých uživatelů — liší se naučené Q-tabulky?
- **Behavioral fingerprint:** je Q-tabulka unikátní per uživatel/stránka? Dá se z ní inferovat typ stránky nebo uživatelský vzorec?

### Vizualizační standardy pro publikaci (Research #5)

- **Q-value heatmaps:** Poloprůhledná vrstva přes DOM vizualizující hodnotovou funkci. Červená = vysoké riziko, zelená = bezpečná zóna. Demonstrují prostorovou orientaci agenta.
- **Policy transition matrices:** Matice pravděpodobností přechodů mezi náladami per fáze. Hatchling = rovnoměrná/stochastická, Elder = silné deterministické hrany.
- **Behavioral etograms:** Časová osa kategorizující kontinuální aktivitu do diskrétních stavů. Hatchling vs. Elder vedle sebe = markantní ilustrace ontogeneze.
- **Complexity-entropy maps:** Kombinace Shannon entropy × LZC zobrazená jako trajektorie v 2D prostoru — balanc explorace vs. exploatace.
- **Ontogenetické trajektorie:** Makroskopické grafy evoluce metrik přes měsíce/roky. Prokazují robustnost a lifelong learning vs. catastrophic forgetting.

### Výzkumné otázky (pro akademický paper)

1. Dokáže tabulární Q-Learning agent konvergovat k stabilní policy v otevřeném, nestatickém DOM prostředí?
2. Jak se liší emergentní chování Hatchling vs. Elder kvalitativně? Je rozdíl pozorovatelný lidským okem?
3. Existuje korelace mezi uživatelským chováním (scroll patterns, cursor speed) a naučenou Q-tabulkou?
4. Je biologicky inspirovaný reward shaping efektivnější než náhodný pro dosažení „zdvořilého" chování v DOM?
5. Jaká je minimální velikost state space pro emergenci netriviálního chování v tomto kontextu?
6. Jak přispívá lokální autonomie chapadel (distribuovaná inteligence) k celkové emergenci chování?
7. Liší se preference DOM elementů (co Lili uchopí a s čím si hraje) mezi instancemi?

### Etické aspekty a GDPR (Research #5)

- **GDPR Článek 89 — výzkumná výjimka:** Lili loguje pouze vektorové rysy interakce (relativní vzdálenosti, rychlost kurzoru), nikdy identifikační data. Veškeré zpracování probíhá lokálně (on-device) — žádné síťové požadavky. Toto odpovídá principu Privacy by Design a umožňuje využití výzkumné výjimky.
- **Informovaný souhlas:** Pokud bude Lili nasazena na web třetí strany, stránka by měla informovat uživatele o přítomnosti experimentu a získat opt-in souhlas pro logování kurzorových dat.
- **IRB konzultace:** Pro publikaci na ALIFE/CHI/NeurIPS doporučeno projít formálním IRB procesem. S ohledem na lokální povahu dat a anonymizaci je pravděpodobná klasifikace „IRB exempt".
- **Minimalizace dat:** Agent loguje pouze to, co je nezbytné pro Q-Learning update — žádná surová telemetrie kurzoru, žádné fingerprinting.

### Publikační strategie a deadliny (Research #5)

- **ALIFE 2026** (Waterloo, Kanada, 17.–21. srpna):
    - **Full Paper deadline: 30. března 2026 (AoE)**
    - Formát: max 8 stran + reference, double-blind, US Letter, MIT Press Open Access
    - Notification: 7. června 2026
    - Late-Breaking Abstracts: 20. července 2026
    - Nejpřirozenější venue pro digitální ontogenezi
- **ACM CHI 2026** (Barcelona, 13.–17. dubna):
    - Full Paper deadline: 11. září 2025 (prošel)
    - Interactive Demos/Posters: 22. ledna 2026 (prošel)
    - Alternativa pro HCI zaměření
- **ACM C&C 2026** (Londýn, 13.–16. července):
    - Full Paper deadline: 5. února 2026
    - Art Exhibition: 19. února 2026
    - Multidisciplinární platforma (AI + design + generative art)
- **NeurIPS 2025 Workshopy** (San Diego, 6.–7. prosince 2025):
    - Workshop contributions deadline: ~22. srpna 2025
    - Vhodné pro „Embodied AI" tracky

---

## Architektura rozšiřitelnosti (v2.0+)

Návrh v1.0 musí být připravený na budoucí rozšíření. Klíčový princip: **distribuovaná inteligence s centrální koordinací nálad.**

### Brain Interface (koordinátor nálad)

Brain není velitel — je koordinátor. Nastavuje nálady/tendence, které chapadla a tělo interpretují lokálně:

- `brain.decideMood(stateVector)` → vrací náladu ({ tendency, intensity })
- `brain.learn(state, mood, reward, nextState)` → aktualizuje interní model
- `brain.serialize()` → JSON pro persistence
- `brain.deserialize(json)` → restore
- `brain.getMetrics()` → data pro journal/debug

v1.0 implementace: `QLearningBrain` (tabulární Q-Learning nad náladami)

Budoucí mozky (v2.0+):
- `DQNBrain` — Deep Q-Network s malým neural netem
- `LLMBrain` — Cloud API (GPT/Claude) pro rozhodování o náladách
- `HiveBrain` — sdílené nálady přes WebSocket — všechny Lili sdílí emocionální stavy

Výměna mozku = výměna jednoho objektu. Tělo + chapadla (steering, FABRIK, lokální inteligence, rendering) se nemění.

### Distribuce — Lili pro všechny

**v1.0:** Jeden soubor, lokální. `<script src="/lili.js" defer>`

**v2.0 vize:**
- `lili.js` hostovaný na CDN (npm, unpkg, nebo vlastní)
- Každá instance automaticky unikátní:
    - Jiný uživatel (kurzor, scroll) → jiná Q-tabulka → jiné chování
    - Jiná stránka (DOM layout) → jiné prostorové preference
    - Jiný genesis timestamp → jiný vizuál (subtle seed-based variace barvy/tvaru)
- Volitelná konfigurace přes data atributy: `<script src="lili.js" data-lili-name="Olga" data-lili-hue="280">`
- Možnost sdílení Q-tabulky (export/import) — „adopce" cizí Lili

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

Dvě úrovně rozhodování:
1. **Globální nálady** prochází přes `brain` objekt. Žádné přímé volání Q-tabulky z jiných modulů.
2. **Lokální reakce chapadel** (recoil, grab, explore) probíhají autonomně na základě lokálních senzorů + aktuální nálady.

Brain nastavuje kontext. Chapadla jednají.

---

*Tento dokument je živý — aktualizuje se v průběhu implementace.*
