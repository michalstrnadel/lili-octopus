# 2026-03-12 — Fáze 6: Senzorický systém

## Co bylo implementováno

### 6A: Globální senzory (7 dimenzí → 4320 stavů)
- **Cursor proximity:** far / medium / near (vzdálenost kurzor↔Lili)
- **Cursor velocity:** still / slow / fast / aggressive (z existujícího mouse trackingu)
- **DOM density:** sparse / medium / dense (z `getNearbyCount()` spatial hashe)
- **Whitespace proximity:** in_whitespace / near_element / on_element (closest-point test)
- **Scroll state:** idle / active (scroll listener + 200ms timeout)
- **Time of day:** morning / afternoon / evening / night
- **Age phase:** hatchling / juvenile / adult / mature / elder

### State vector pro Q-Learning
- Mixed-radix encoding: 3×4×3×3×2×4×5 = **4320 stavů**
- `sensors.stateIndex` — single integer index, přímo použitelný jako klíč do Q-tabulky
- `_sensorIndices` + `_sensorDims` lookup tabulky pro konstantní výpočet

### 6B: Per-tentacle lokální senzory
- `tentacleTipTouchingDom(arm)` — dotýká se špička chapadla DOM elementu? Vrací obstacle s `.el` referencí.
- `arm.touching` — aktualizováno každý frame per chapadlo

### 6C: Stress model
- `stress` — float 0..1, exponential smoothing (`CFG.stressSmoothing = 0.05`)
- Vstupy: cursor proximity, cursor velocity, počet chapadel v recoil, on_element
- Napojení na chromatofory: stress → hue shift k červené + saturation boost

## Bugfix
- `renderEyes()`: `mouse.x` → `mouse.pos.x` (oči nyní správně sledují kurzor)

## Poznámky
- Senzory se aktualizují každý frame (budoucí optimalizace: jen per decision cycle)
- Stress model je připraven pro Q-Learning reward function (Fáze 8)
