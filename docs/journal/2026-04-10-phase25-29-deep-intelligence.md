# Phase 25-29: Deep Intelligence & Environmental Awareness

**Date:** 2026-04-10
**Phases:** 25, 26, 27, 28, 29 + Cron v2 upgrade
**Lines added:** ~390 (lili.js: 6727 → 7117)

## What was implemented

### Phase 25: Dream Replay (Experience Replay during Sleep)
DQN-inspired sleep consolidation — during circadian sleep, Lili replays past experiences:
- Samples from journal ring buffer, prioritizing high-|reward| memories (60% weighted sampling)
- Runs brainLearn with αScale=0.5 (slower consolidation to prevent catastrophic forgetting)
- Max 50 replays per sleep session, batch of 5 every 3 seconds
- Tracks sleep transitions to reset per-session counter

Architecture: `dreamReplay()` called every frame in update loop. Only active when `_circadian.isAsleep`. Uses existing `brainLearn()` — no new learning algorithm, just replay scheduling.

### Phase 26: Curriculum Learning
Reward function complexity gated by life phase:
- **Hatchling:** Only whitespaceCalm (1.0) and blockingRead (1.0) at full strength. Other rewards at 0-30%.
- **Juvenile:** Most rewards at 50-80%. Still learning the basics.
- **Adult+:** Full reward function unlocked (all gates = 1.0).

Implementation: `CFG.curriculum.gates` defines per-phase multipliers. Applied multiplicatively in `computeReward()` — each reward component multiplied by its gate value. Zero lines of new functions, just multipliers on existing code.

### Phase 27: Habitat Awareness
Page color detection and adaptation:
- `_samplePageHue()` extracts dominant hue from `document.body` or `document.documentElement` background-color
- Skips near-gray backgrounds (saturation < 0.08)
- Computes harmonious hue shift (analogous color, +30° offset direction)
- Lerps toward target at 0.02/sample, max ±25° shift
- Detects page type from spatial hash grid size (sparse/mixed/dense)

Integrated into `computeColors()` as `habitatHue` additive shift.

### Phase 28: Non-verbal Communication
Three visual signaling mechanisms:

1. **Welcome wave:** When cursor returns after 5+ seconds of absence, one random tentacle performs a damped sinusoidal wave toward the cursor. Duration: 120 frames (2s).

2. **Excitement flash:** Triggered when cumulative reward ≥ 1.5 in a single decision. Rapid chromatophore hue oscillation (±30° at 4× frequency, decaying). Duration: 30 frames.

3. **Contentment pulse:** After 60+ consecutive frames of calm mood with stress < 0.2, body lightness oscillates ±4% at a slow rate. Naturally fades when mood changes.

### Phase 29: Enhanced Bioluminescence
Night-time visual enhancement:
- **Night glow boost:** 2.5× glow intensity multiplier during night hours (22:00-06:00) or circadian sleep
- **Luminescent trail:** Up to 20 particles spawned behind moving Lili in dark conditions. Each particle: radial gradient glow, upward drift, 90-frame lifespan, genesis-hue-based coloring.
- **Inner eye glow:** Subtle radial glow emanating from pupils at night on dark backgrounds (alpha 0.3).

### Cron Tick v2 Upgrade
- State space: 7 sensors (4320 states) → 9 sensors (38880 states)
- Added `momentum` sensor (accelerating/steady/decelerating, varies during simulation)
- Added `trust` sensor (low/medium/high, based on visit count)
- Output format: `lili_state_v1` → `lili_state_v2`, brain `v: 1` → `v: 2`
- No more v1→v2 migration needed on every cron tick load

## Design decisions

1. **Dream replay uses existing brainLearn** — no new learning algorithm. This is intentional: the academic value is in showing that replay scheduling alone improves convergence, using the same TD update.

2. **Curriculum gates are multiplicative, not additive** — a gate of 0.3 means 30% of the reward signal. This prevents hatchlings from being overwhelmed by a complex reward landscape while still getting some signal from all components.

3. **Habitat hue shift is subtle (max ±25°)** — Lili should still look like herself on any page. The adaptation is barely noticeable consciously but contributes to a feeling of belonging.

4. **Welcome wave uses one tentacle** — not all eight. A single wave is more natural and animal-like. The damped sinusoidal motion mimics how an octopus might reach out cautiously.

5. **Bioluminescence trail particles are behind Lili in z-order** — rendered before ink, tentacles, and body. This creates a subtle wake effect rather than overlapping with the body.

6. **Cron v2 uses visit count for trust** — since cron has no live cursor, trust is derived from metadata.visits which accumulates across browser sessions.
