# Fáze 3: FABRIK IK — chapadla jako autonomní jednotky

**Datum:** 2026-03-11

## Co se změnilo

### 3A: FABRIK solver
- 8 nezávislých kinematických řetězců, každý 8 jointů (Float32Array)
- Anchory rovnoměrně po obvodu těla (45° spacing), rotované s headingem
- FABRIK solver: forward + backward reach, max 3 iterace per frame (temporal coherence)
- Reachability check — nedosažitelný cíl = natažení do přímky
- Zero-allocation hot path: žádné `new` v solver loop

### 3B: Procedurální generování pohybu
- Asymetrický power-stroke/recovery model (`asyncTime = t + 0.4 * sin(t)`)
- Dva fázové vzory:
  - **G4** (střídavý symetrický): L1,L3,R2,R4 vs L2,L4,R1,R3 — pro lokomoci
  - **Radial Wave**: postupně 0..7π/4 — pro klidové stavy
- Automatické přepínání podle rychlosti (> 0.2 speedRatio → G4)
- Simplex noise injection na amplitudu a úhel (ne přímo na souřadnice)
- Trailing bias: chapadla zaostávají za tělem proporcionálně k rychlosti
- Idle relaxace: gravitační tah dolů při zastavení

### 3C: Trailing physics
- Mass-spring-damper model na tip target (Hooke + viskózní tlumení)
- `stiffness: 0.14`, `damping: 0.80` — kalibrováno pro podvodní prostředí
- Semi-implicitní Eulerova integrace, žádný overshoot

### 3D: Lokální stav per chapadlo
- `localStress`: roste při blízkosti kurzoru, exponenciální decay
- `recoilTimer`: reflexní stažení k tělu (400ms) při kontaktu s kurzorem
- `curiosity`, `touching`, `heldElement`, `grip` — připraveno pro Fázi 9

### Rendering
- Placeholder polylines (strokeStyle) — hull rendering bude v Fázi 4
- Tip dot: červený při recoilu, modrý normálně
- Segment length věkově závislý (5px hatchling → 15px elder)

## Klíčová rozhodnutí

1. **Independent chains, ne strom** — eliminuje centroid výpočty, umožňuje paralelní zpracování
2. **Float32Array** — cache-friendly, zero GC pressure
3. **Trailing physics na target, ne na jointy** — FABRIK řeší geometrii, spring-damper řeší dynamiku. Čisté oddělení.
4. **Anchor na 0.85 * bodyR** — chapadla vyrůstají mírně uvnitř těla, ne na okraji (biologicky přesnější)
5. **Fázový vzor řízený rychlostí** — G4 pro pohyb, radial wave pro klid. Mood-driven přepínání přijde s Fází 8.

## Metriky

- Soubor: 862 → 1270 řádků (+408)
- Nové CFG parametry: 8
- Nové funkce: 9 (createTentacle, initTentacles, fabrikSolve, computeTentacleTarget, updateTrailingPhysics, updateTentacleLocalState, updateTentacles, renderTentacles + PHASE arrays)
