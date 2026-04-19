# Lili B — UI parita s Lili A (teplá paleta)

**Datum:** 2026-04-19
**Rozsah:** pouze UI/vizuál, algoritmy/senzory/brain netknuté

## Motivace

Lili B původně renderovala jako stick-figure (4 quadratické chapadlo-křivky,
elipsové tělo, 3 tečky, 2 oči) v chladné tyrkysové paletě. Uživatel žádal
vizuální paritu s Lili A (FABRIK IK, hull envelope, chromatofory, oči se
saccadou/blinkem) při zachování barevného odlišení — teplá červeno-oranžová
paleta místo chladné tyrkysové.

## Co se změnilo

### `public/lili-b.js`

1. **`VCFG` visual config** — konstanty (tentacleCount=8, tentacleSegments=8,
   chromatophoreCount=12, poměry bodyR, rozsahy genesis), `MOOD_VIS` lookup
   table (7 nálad × ampMod/spreadMod/gravMod/noiseMod/forwardBias/bodyScale/
   breathMod/glowPulseHz/pupilScale/squint/hueShift/satShift/litShift).
   **Teplá paleta:** `baseHue=12`, `baseSaturation=72`, `baseLightness=50`.

2. **`SimplexNoise`** — seedovaná 2D noise (Gustavson impl, stejná jako v A).

3. **`createLiliBVisual({seed})`** — factory s metodami `update(dt, sensor)`,
   `render(ctx)`, `getState()`. Uvnitř closure:
   - FABRIK IK (8 chain × 8 segments, Float32Array zero-alloc)
   - Mass-spring-damper trailing physics
   - Per-segment spring-damper wave propagace
   - Anti-torsion FABRIK comfort (bend angle penalty)
   - Genesis (seeded proporce těla/očí/chapadel)
   - Chromatofory (age-dependent, seeded angle/phase/speed/hue)
   - Hull envelope (Catmull-Rom → cubic Bézier)
   - Oči: gaze lerp + saccade mikro-jitter + ease-in-out-cubic blink
   - Warm HSL color model (base 12° hue + mood modulace + night bio-boost)

4. **`createLiliBKinematics`** — přidáno `heading` do state (atan2(vy,vx),
   lerp 0.10, π-wrap normalizace), exposed přes `getState()`.

5. **`createLiliBRuntime`** — instancuje `visual = createLiliBVisual({seed: seed+500})`,
   v `tick()` volá `visual.update(dt, sensorCtx)` → `visual.render(ctx)`.

6. **`window.LiliB` export map** — `renderLiliB` → `createLiliBVisual`.

## Napojení senzorů

`visual.update(dt, sensor)` přijímá:

| Sensor         | Odkud                        | Jak ovlivní render                          |
|----------------|------------------------------|---------------------------------------------|
| `x, y`         | `kSt.x, kSt.y`               | pozice těla + anchor chapadel                |
| `vx, vy`       | `kSt.vx, kSt.vy`             | trailing physics, heading                   |
| `bodyR`        | `kSt.bodyR`                  | size (dědeno z A's ontogeneze)              |
| `heading`      | `kSt.heading` (smoothed)     | rotace těla, orientace chapadel             |
| `mood`         | `currentMood` (DQN action)   | MOOD_VIS lookup → amp/spread/hue/pupil/glow |
| `stress`       | `kSt.stress`                 | body pulse + chromatofor desaturace         |
| `cursorX/Y`    | real/phantom cursor          | gaze target + tentacle recoil trigger       |
| `cursorActive` | `aState.mouseActive`         | gaze saccade vs. idle drift                 |

## Nezměněno

- Celý DQN pipeline (`createLiliBBrain`, `createDQN`, replay buffer, target net)
- Phantom cursor generator
- Sensor/reward/observation layer
- Persistence + anchors + stabilizer + instrumentation
- Lili A (`public/lili.js`) — 0 změn

## Ověření

- `node --check lili-b.js` → OK
- `node --check lili-b.tests.js` → OK
- `grep renderLiliB` → no matches (clean cutover)
- Browser verification: pending (uživatel ověří vizuálně)
