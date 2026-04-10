# Phase 19-24: Academic & Technological Expansion

**Date:** 2026-04-10
**Phases:** 19A, 19B, 19C, 20, 21, 22, 23, 24
**Lines added:** ~768 (lili.js: 5959 → 6727) + dashboard.html (~400 lines)

## What was implemented

### Phase 19A: Baseline System (Academic Controls)
Four alternative brain policies for paired academic comparison:
1. **Random Policy** — uniform random mood selection, no learning
2. **Frozen Policy** — snapshots Q-table, then α=0 (measures environment non-stationarity)
3. **Myopic Policy** — γ=0, only immediate reward (proves long-term planning)
4. **Hard-coded Heuristic** — expert if/else rules (reference for human-designed strategy)

Architecture: `baselineSelectMood()` intercepts `brainDecisionCycle`. When baseline is active:
- Random/Frozen/Heuristic skip `brainLearn()` entirely
- Myopic overrides `CFG.rl.gamma` to 0 during learning

Keyboard `B` cycles modes. Persisted in localStorage.

### Phase 19B: Replay System (Reproducibility)
Records cursor trajectories + decision state for paired testing (Hatchling vs Elder on identical input):
- `replayRecordCursor()` — captures mouse position/velocity each frame
- `replayRecordSnapshot()` — captures sensor state at each decision point
- `replayFeedCursor()` — in playback mode, feeds recorded data instead of live mouse events
- Max 10000 cursor events, stored in localStorage
- Keyboard `R` toggles recording/playback

### Phase 19C: Enhanced Metrics & CSV Export
- **Convergence metric:** avg |δQ| per Bellman update (tracked per-day)
- **Policy stability:** fraction of states where top mood changed today
- **CSV export:** daily aggregates downloadable as CSV for R/Python analysis
- Daily aggregates extended: `avgQDelta`, `policyStability`, `cumulativeReward`, `qtableSize`, `baselineMode`, `season`

### Phase 20: Observability Dashboard
Separate `public/dashboard.html` — zero-dependency visualization page:
- Loads `lili_export_*.json` via drag-and-drop
- Charts: entropy, reward, exploration rate, LZC, convergence, policy stability (all as time series)
- Mood distribution pie chart (lifetime totals)
- Personality radar chart (7-axis polygon)
- Behavioral etogram (stacked mood proportions over time)
- Daily aggregates table with sorting
- Milestones log

### Phase 21: Seasonal Awareness
Date-based season detection (spring/summer/autumn/winter) affecting:
- Chromatophore colors: hue shift (+15 summer, -20 winter), saturation, lightness
- Movement speed multiplier (1.1x summer, 0.85x winter)
- NOT added to state space (would 4x the 38880 states → convergence disaster)
- Included in daily aggregate exports for analysis

### Phase 22: Sound Landscape (Web Audio API)
Zero-dependency ambient soundscape:
- Breathing drone: sine oscillator at ~80Hz, volume follows breathing cycle, mood-modulated
- Bubble pops: randomized frequency (400/600/800 Hz), exponential gain ramp
- Ink splash: white noise burst, 80ms duration
- User-initiated (browser autoplay policy): keyboard `S` or `lili.sound()`
- Stress modulates breathing frequency

### Phase 23: Social Learning
Extended cloud sync payload with anonymized behavioral stats:
- `socialStats`: avgStress, dominantMood, personality vector, entropy, season, offspring count
- API unchanged — server can aggregate these across all visitors for "collective memory"

### Phase 24: Offspring / Generational Learning
Reproduction system enabling evolutionary axis alongside ontogenetic:
- Eligible after `mature` phase, max 3 offspring per lifetime
- Q-table crossover: 50% random subset of parent's entries inherited
- Gaussian mutation: Box-Muller noise (σ=0.1) added to each inherited Q-value
- Exported as `lili_offspring_*.json` — can be imported as new Lili instance
- Journal milestone logged

## Design decisions

1. **Baselines don't run simultaneously** — they replace the brain's decision function. This means only one mode can be active at a time. For paired testing, use replay: record with Q-Learning, then replay with each baseline.

2. **Season modulates parameters, not state space** — adding 4 season values would multiply states to 155520, severely slowing convergence. Instead, season affects chromatophores and movement cosmetically.

3. **Sound is opt-in** — browser autoplay policy requires user gesture. We don't auto-enable to avoid annoyance.

4. **Offspring inherits Q-values, not the full brain** — visit counts and state visits are reset. This means the offspring starts as a hatchling with "inherited instincts" (Q-knowledge) but fresh exploration statistics.

5. **Dashboard is a separate file** — keeping it out of lili.js respects the "single production file" constraint. Dashboard is a development/analysis tool.
