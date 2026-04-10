# Phase 30-35: Alive Final — Anticipation, Energy, Habituation, Cognition

**Date:** 2026-04-10
**Phases:** 30, 31, 32, 33, 34, 35
**Lines added:** ~429 (lili.js: 7117 → 7546)

## What was implemented

### Phase 30: Anticipation (Predictive Pre-reaction)
Lili detects approaching cursor and pre-reacts before contact:
- Tracks cursor distance over 15 frames for consistent approach detection
- Intensity scales with closeness (0..1)
- Body tenses (shrinks by up to 30%) when anticipating
- Smooth decay (relaxRate 0.05) when threat passes

### Phase 31: Energy / Fatigue
Activity budget creating natural rest cycles beyond circadian:
- Energy pool: 100 max, starting at 80
- **Costs:** movement (0.005 × velocity), decision (0.1), exploration (0.15 extra)
- **Regen:** idle/calm (0.02/frame), sleep (0.08/frame)
- **Fatigued** (< 25): speed × 0.6, Boltzmann temperature × 0.5 (less exploration)
- **Critical** (< 10): forced conservative behavior

### Phase 32: Habituation (Stimulus Adaptation)
Repeated stimuli produce weaker responses:
- Cursor habituation: decays at 0.003/frame when cursor active, recovers at 0.001/frame
- Scroll habituation: faster decay (0.01), faster recovery (0.005)
- Floor: never fully habituate (minSensitivity = 0.15)
- Novel stimuli (theme change) reset habituation via `habituationNovelty()`
- Modulates: flee steering weight, stress computation

### Phase 33: Cognitive Map
Enhanced spatial memory with multi-dimensional cell values:
- 80px grid cells (finer than place memory's 120px)
- Each cell stores: safety (0..1), reward (running avg), visits (0..50)
- Familiarity bonus in reward: returning to known-good spots gets +0.2 × value
- Decay per decision cycle (0.998), max 500 cells, auto-pruning of empty cells

### Phase 34: Cursor Pattern Recognition
Classifies visitor cursor behavior:
- Samples cursor position every 3 frames, 60-frame analysis window
- Counts direction changes (velocity sign reversals)
- **Nervous** (8+ changes): +15% stress contribution
- **Calm** (0-2 changes): -10% stress contribution
- **Directed** (low changes, large displacement): reading/scrolling
- **Erratic** (moderate changes): general browsing

### Phase 35: Attention Mechanism
Context-dependent sensor weighting:
- Each sensor gets an attention weight (0.3..2.0)
- Boost (+0.5) when sensor value changes (novel input)
- Decay (-0.02/frame) toward baseline
- Focus sensor (highest weight) modulates reward signal (+15%)
- Enables emergent prioritization: if cursor suddenly moves, cursor attention spikes

## Design decisions

1. **Anticipation uses distance trend, not prediction** — a simple "is distance consistently decreasing?" check over 15 frames. This avoids complex trajectory prediction while producing natural-looking preparation behavior.

2. **Energy regenerates during idle AND calm** — not just sleep. This encourages the brain to learn that resting is valuable, creating natural activity/rest cycles that emerge from the reward structure rather than being hard-coded.

3. **Habituation has a floor** — Lili never fully ignores the cursor (min 0.15). Even a habituated octopus still slightly responds to stimuli. This prevents her from becoming completely unresponsive.

4. **Cognitive map is separate from place memory** — place memory (Phase 15A) is a simple value grid for steering. Cognitive map stores richer per-cell data (safety, reward, visits) used for reward computation. Different purposes, different granularity.

5. **Cursor pattern recognition is frame-based, not time-based** — this means it adapts equally well at 30fps and 60fps. The direction change metric is simple but effective for distinguishing nervous users from calm readers.

6. **Attention weights don't affect the Q-table directly** — they only modulate the reward signal. This is a soft influence that shapes what Lili learns to care about, not a hard constraint on her state representation.
