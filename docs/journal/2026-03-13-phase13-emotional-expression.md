# Phase 13 — Emoční exprese (vizuální manifestace nálad)

**Datum:** 2026-03-13
**Řádky:** 3426 → 3715 (+289)

## Co bylo implementováno

### 13A: Chromatoforová exprese nálad
- `CFG.moodChroma` — každá nálada moduluje HSL jinak:
  - curious: teplejší tyrkysová, jemné pulzování saturace
  - playful: vyšší saturace, živější barva
  - shy: bledší, nižší saturace
  - calm: stabilní, minimální variace
  - alert: kontrastnější, vyšší saturace
  - idle: tmavší, usínací efekt
  - exploring: pomalý hue drift, zvýšený glow
- `_chromaBlend` — smooth lerp (0.04/frame ≈ 2s transition)
- Hue drift (exploring) a sat pulse (curious) jako emergentní efekty
- Glow intensity modulován náladou

### 13B: Oční exprese
- Mrkání: `_blink` state machine s eyelid arc clipping
- Blink rate modulován náladou (calm/idle = frequent, alert = rare)
- Pupil dilation: `_eyeBlend.pupilScale` per mood (alert/shy = larger, calm/idle = smaller)
- Squint: playful = mírné přivření
- Gaze: curious/exploring = pupily sledují DOM elementy (via spatial hash), idle = pohled do prázdna

### 13C: Tělesná exprese
- Breathing: mood moduluje frekvenci i amplitudu (calm = slow deep, alert = fast shallow)
- Body scale: shy = 0.92× (stažené), playful = 1.05× (rozevřené)
- Glow pulsation: curious/exploring = 0.4-0.5 Hz pulz

### 13D: Chapadlová exprese
- Swim amplitude: playful = 1.4×, shy = 0.5×
- Spread: playful = 1.3× (wider), shy = 0.6× (tighter)
- Gravity: calm/idle = stronger downward pull, alert = minimal
- Noise: playful/curious = more organic, alert = controlled
- Forward bias: curious/exploring front tentacles reach forward

### 13E: Tooltip & debug integrace
- Tooltip: barevný dot vedle mood textu (7 distinct colors per mood)
- Debug panel: mood history (posledních 5 transitions s timestamps)
- Debug: moodBlend value zobrazeno

### 13F: Mood transition events
- `onMoodChange(prevMood, newMood)` callback systém
- `lili.moodBlend` float 0..1 s smooth lerp (CFG.moodChromaBlendSpeed = 0.04)
- `_moodHistory` ring buffer (max 10 entries)
- Milestone: sustained_mood logging (mood > 5 min continuously)
- All expression params use smooth blending — no jumps

## Klíčová rozhodnutí

1. **Emergentní, ne skriptované:** Nálada nastavuje target parametry, vizuál emerguje z lerp blendování. Žádné hardcoded animace.
2. **Unified blend rate:** Jeden `moodChromaBlendSpeed` pro všechny kanály — jednoduchost, konzistentní přechody.
3. **Eyelid clipping:** Blink implementován jako rect clip na eye circle — přirozený efekt přivření.
4. **Forward bias:** Pouze front tentacles (idx 0,1,6,7) — biologicky motivováno (chobotnice natahuje přední pár).
5. **Gaze DOM:** Curious/exploring oči sledují nejbližší DOM element via spatial hash — emergentní efekt "zkoumání stránky".
