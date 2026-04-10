# Phase 36-41: Behavioral Depth & Visual Polish

**Date:** 2026-04-10
**Phases:** 36, 37, 38, 39, 40, 41
**Lines added:** ~485 (lili.js: 7546 → 8031)

## What was implemented

### Phase 36: Temporal Patterns (Time-of-Day Learning)
24-hour bin structure tracking stress and activity levels:
- One bin per hour, each storing running average of stress, activity, and observation count
- Slow decay (0.995) preserves long-term patterns while adapting to changes
- Reward modulation: small bonus when current behavior matches learned time-of-day expectation
- Persisted to localStorage, loaded on boot
- Console API: `lili.temporal()`

### Phase 37: Personality Drift (Long-term Temperament Evolution)
Four temperament axes evolve based on cumulative mood history:
- **Boldness:** curious/exploring increase it, shy/alert decrease it
- **Sociability:** playful/curious increase it, shy/idle decrease it
- **Activity:** exploring/playful increase it, idle/calm decrease it
- **Emotionality:** alert/shy increase it, calm/idle decrease it
- Window of 500 decisions before drift update (slow evolution over weeks)
- Drift rate 0.02 — very gradual shift, max bias ±0.4
- Applied as multiplicative bias on softmax mood probabilities
- Persisted to localStorage
- Console API: `lili.temperament()`

### Phase 38: Surprise Signal (Prediction Error Mechanism)
Explicit surprise response when TD error exceeds threshold:
- |TD error| > 0.8 triggers surprise: attention weights spike (+0.8), learning rate temporarily boosted (1.5×)
- Alpha boost decays per decision cycle (0.95 decay rate)
- Very high surprise (|TD error| > 1.0) triggers startle micro-expression
- Surprise intensity decays at 0.03/frame
- Creates emergent "curiosity from confusion" — unexpected outcomes make Lili learn faster
- Console API: `lili.surprise()`

### Phase 39: Ink Defense (Dramatic Ink Burst)
Dramatic visual response to sudden stress spikes:
- Triggers when stress > 0.75 AND stress rate-of-change > 0.3 (sudden startle, not sustained stress)
- 25 particles (vs 6-8 for normal ink), larger (6-18px), wider spray (216° arc)
- Particles drift upward slightly, expand slowly, 120-frame lifespan
- Deep purple/indigo color palette (rgb 15-25, 10-15, 25-35)
- 5-second cooldown between bursts
- Separate particle system from normal ink (doesn't interfere)

### Phase 40: Camouflage Intensity (Mood-Dependent Background Matching)
Octopus-like chromatophore camouflage modulated by emotional state:
- Each mood has a camo intensity: shy=100%, alert=80%, calm=40%, curious=10%, playful=5%
- Applies saturation reduction (up to -25%) and lightness shift toward background
- Smooth lerp at 0.03/frame — gradual fade in/out
- Works with existing ambient light detection system

### Phase 41: Growth Visualization (Smooth Size Scaling)
Continuous body size growth within life phases:
- Hatchling: 0.6× → 0.85× (tiny, growing)
- Juvenile: 0.85× → 1.0× (reaching normal size)
- Adult: 1.0× → 1.05× (slight maturation)
- Mature: 1.05× → 1.1× (growing wisdom)
- Elder: 1.1× → 1.15× (largest, wisest)
- Multiplied into all bodyR computations (physics, rendering, boot)
- No discrete jumps at phase transitions (smooth interpolation using phaseProgress)

## Design decisions

1. **Temporal patterns use running averages, not raw counters** — this automatically gives more weight to recent behavior while maintaining long-term patterns. A simple and robust approach that doesn't require complex time-series analysis.

2. **Personality drift is extremely slow (0.02 rate, 500-decision windows)** — a Lili that becomes cautious should take weeks of consistent negative experiences, not minutes. This matches biological temperament change timescales (relatively).

3. **Surprise boosts learning rate, not exploration** — higher alpha means stronger Q-value updates, not more random behavior. This is neuroscience-aligned: surprise makes you learn faster from the surprising event, it doesn't make you act randomly.

4. **Ink defense requires stress RATE, not just level** — sustained high stress (habituated) shouldn't trigger defense bursts. Only sudden spikes do. This prevents defense ink from becoming a constant visual noise.

5. **Camouflage is mood-dependent, not stress-dependent** — shy Lili camouflages because she wants to hide, not because she's stressed. A curious Lili stands out because she's engaged. This is more biologically accurate — octopus camouflage is voluntary.

6. **Growth visualization uses multiplicative scaling on existing bodyRadius** — this means the per-phase radius values in CFG still work correctly as base values. The growth multiplier just smooths the transitions and adds within-phase progression.
