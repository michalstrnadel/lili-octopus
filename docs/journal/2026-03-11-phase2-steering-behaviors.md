# 2026-03-11 — Fáze 2: Steering Behaviors — pohyb bez RL

## Co se stalo

Implementovány všechny komponenty Fáze 2. Lili se nyní autonomně pohybuje po stránce jako placeholder elipsa s biologicky věrným pohybem.

## Co bylo vytvořeno

### 2A: Age / Life Phase systém
- Objekt `age` s `genesisMs`, `elapsedMs`, `phase`, `t` (normalizovaný věk 0-1)
- Funkce `ageVal(map)` — resolvuje věkově závislé konfigurace (hatchling/juvenile/adult/mature/elder)
- `updateAge()` volaná každý frame — počítá elapsed time z genesis timestamp
- Systém je klíčový pro všechny věkově závislé parametry (rychlost, síla, damping, epsilon...)

### 2A: Lili state objekt
- `lili.pos`, `lili.vel`, `lili.acc` — Vec2 fyzikální stav
- `lili.bodyR` — aktuální poloměr (věkově závislý)
- `lili.heading` — směr pohybu v radiánech
- `lili.wanderAngle` — aktuální úhel wander targetu (noise-driven)
- `lili.pulsePhase` — pozice v pulse-glide cyklu (0-1)
- `lili.currentAction` — aktivní RL akce (Phase 2: fixně 'wander')
- `lili.stress` — stresový level (připraveno pro Phase 7+)

### 2A: Mouse tracking
- `mouse.pos`, `mouse.prev`, `mouse.vel`, `mouse.speed`, `mouse.speedSmooth`
- Exponential moving average pro vyhlazení (α=0.15)
- Klasifikace: still (<2), slow (2-8), fast (8-20), aggressive (>20) — přesně dle PRD
- `mouse.active` flag — ignoruje mouse events dokud kurzor nevstoupí do viewportu

### 2B: Steering behaviors
Všech 5 základních Reynoldsových algoritmů:

1. **Wander** — Simplex noise řídí úhel targetu na projekčním kruhu (wanderDistance=80, wanderRadius=40). Modulovaný pulse-glide cyklem (Research #1):
   - Power stroke (30% cyklu): speedBoost 1.6× — krátký impuls
   - Glide phase (70% cyklu): postupná decelerace od 1.6× k 0.7× — dlouhý klouzavý drift
   - Frekvence cyklu 0.9 Hz (Research #1: adult octopus 0.8-1.0 Hz)

2. **Seek / Arrive** — vektor k cíli s deceleration radius (80px). Plynulé zastavení.

3. **Flee** — opačný vektor od kurzoru, urgency škálovaná vzdáleností. Aktivní do 150px.

4. **Evade** — predikce budoucí pozice kurzoru (20 frames ahead) + flee od predikované pozice. Použito automaticky při aggressive/fast cursor.

5. **Obstacle Avoidance** — ahead vector (délka škálovaná rychlostí, max 100px). Test bounding circle vs. expanded DOM rects. Odpuzovací vektor kolmo od středu překážky.

6. **Boundary** — měkké odpuzování od okrajů viewportu (margin 60px, max force 0.6). Plynulé stočení, ne tvrdé odrazy.

### 2B: DOM obstacle cache
- `rebuildDomObstacles()` queryuje DOM přes `CFG.indexedSelectors`
- Cachuje bounding rects (`x, y, w, h, cx, cy`) — přestavěno při resize
- Filtruje neviditelné a příliš malé elementy
- Příprava pro spatial hash (Phase 5) — snadno nahraditelné

### 2C: Behavior weight combiner
- `computeSteering()` kombinuje všechny steering forces podle vah z `CFG.behaviorWeights`
- **Obstacle avoidance a boundary VŽDY aktivní** (bezpečnostní vrstva dle PRD) — s minimální vahou 0.3 resp. 0.2 i kdyby akce měla váhu 0
- Automatický evade místo flee při aggressive kurzorueru

### 2A: Physics update
- PRD přesný model: `acceleration → velocity (+ damping) → position`
- Delta-time normalizovaný na 60fps (parametry tuned at 60fps)
- Heading aktualizovaný z velocity (jen při pohybu)
- Hard clamp na viewport jako safety net (steering by měl stačit)
- Pulse-glide cycle advance per frame

### Placeholder rendering
- Elipsa orientovaná podle heading (`bodyR × 0.78` × `bodyR × 1.0` — PRD proporce)
- **Breathing modulation** (Research #1): sinusová deformace 18 bpm, 3% amplituda
- **Pulse-glide mantle deformation** (Research #1): kontrakce -10% při power stroke, expanze při glide
- Subtilní glow (radial gradient — bioluminiscence)
- Velocity indicator (jemná čára ve směru pohybu)

## Research integrace

- **Research #1 (Biomechanika chobotnic):**
  - Pulse-glide cyklus 0.9 Hz, 30/70 power/glide ratio
  - Mantle kontrakce 10% během power stroke
  - Breathing oscillation 18 bpm, 3% amplituda
  - Asymetrický power-stroke/recovery (rychlý impuls + pomalý drift)

- **Research #0b (Technická analýza):**
  - Reynoldsův vektorový model — steering = desired - velocity
  - Obstacle avoidance: ahead vector scaling, bounding circle test
  - Evade s predikcí budoucí pozice hrozby

- **PRD:**
  - Behavior weights tabulka (7 akcí × 7 behaviors)
  - Mouse speed klasifikace prahy
  - Physics update sekvence
  - Obstacle avoidance + boundary vždy aktivní

## Rozhodnutí

1. **Delta-time normalizace na 60fps** (`dt * 60`): Všechny parametry (maxSpeed, maxForce, damping) jsou tunované pro 60fps. Normalizace zajistí konzistentní pohyb i při frame drops.

2. **Evade automaticky při aggressive cursor**: PRD specifikuje evade jako sofistikovanější variantu flee. Implementováno jako automatický switch — flee pro slow threats, evade pro fast/aggressive.

3. **DOM obstacles bez spatial hash**: Phase 2 používá jednoduchou iteraci přes cachované bounding rects. Spatial hash přijde ve Phase 5 — pro většinu stránek je lineární scan dostatečný.

4. **Pulse-glide moduluje wander, ne velocity přímo**: Biologicky přesnější — chobotnice nemění konstantní rychlost, ale cyklicky pulzují. Modulace je na úrovni desired speed ve wander behavior.

## CFG rozšíření

Přidány nové konstanty do CFG:
- `wanderDistance`, `wanderRadius`, `wanderNoiseScale`
- `maxSeeAhead`, `boundaryMargin`, `boundaryForce`
- `arriveSlowRadius`, `fleeDistance`, `evadeLookAhead`
- `pulseFrequency`, `pulsePowerRatio`, `pulseSpeedBoost`, `mantleContraction`
- `breathingBpm`, `breathingAmplitude`

## Stav souboru

`public/lili.js`: 862 řádků, syntax OK.

## Výstup

Viditelná elipsa plynule pluje po stránce s biologicky věrným pulse-glide pohybem, obchází DOM elementy, neprochází přes okraje, a utíká před kurzorem.

## Další krok

Fáze 3: FABRIK IK — 8 chapadel s inverzní kinematikou a semi-autonomním chováním.
