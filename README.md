# Lili — Autonomous Digital Companion

**An academic experiment in digital ontogenesis**

Lili is an autonomous digital organism in the form of an octopus, living on a webpage as an ambient companion. Her behavior emerges from Reinforcement Learning (Q-Learning) — nothing is scripted. Lifecycle: 10 real years.

## What Lili IS

- Autonomous RL agent driven by rewards and penalties
- Procedurally animated octopus with 8 FABRIK IK tentacles
- Ambient companion that learns and ages alongside the website
- Academic experiment with exportable data for analysis
- Seasonally adaptive organism with ambient soundscape
- Capable of reproduction — offspring inherit learned Q-values with genetic mutation

## What Lili is NOT

- A Tamagotchi (needs no care, doesn't die from neglect)
- A scripted animation (no keyframes, no predefined paths)
- A chatbot (no generative dialogue)
- A gimmick (she's a quiet companion, not an effect)

## Tech Stack

- **Runtime:** Vanilla JavaScript, zero dependencies, zero build pipeline
- **Deployment:** Single `<script>` tag in any HTML
- **AI:** Q(λ)-Learning with eligibility traces, Boltzmann/softmax exploration
- **Movement:** Craig Reynolds Steering Behaviors
- **Animation:** FABRIK Inverse Kinematics, procedural micro-expressions
- **Optimization:** Spatial Hash Grid
- **Visuals:** Canvas 2D, procedural rendering, HSL chromatophores, seasonal modulation
- **Sound:** Web Audio API (zero deps) — breathing drone, bubble pops, ink splash
- **Persistence:** localStorage + cloud sync (GitHub API via Vercel serverless)
- **Analysis:** CSV export, observability dashboard, baseline comparison, replay system

## Current State (2026-04-10)

**56 implementation phases complete + visual polish** — `public/lili.js` (~9280 lines)

| Phase | Description |
|-------|-------------|
| 1-4 | Canvas bootstrap, steering behaviors, FABRIK IK, visual system |
| 5-7 | Spatial hash grid, sensory system (9 sensors, 38880 states), age system |
| 8-9 | Q-Learning brain (Q(λ), Boltzmann, adaptive α, curiosity), DOM interaction |
| 10-12 | Click/tooltip/debug, persistence (localStorage), optimization (60 FPS) |
| 13 | Emotional expression (chromatophores, eyes, breathing, tentacles per mood) |
| 14 | Cloud sync (GitHub persistence, 5min interval, merge strategy) |
| 17 | Brain v2 (eligibility traces, softmax, momentum/trust sensors, mood plans) |
| 18-18.5 | "Alive & Polish" (micro-expressions, sleep, genesis variation, chromatophore cells) |
| **19A** | **Baseline System** — 4 control conditions for academic comparison |
| **19B** | **Replay System** — cursor trajectory recording/playback |
| **19C** | **Enhanced Metrics** — convergence curves, policy stability, CSV export |
| **20** | **Observability Dashboard** — exported data visualization |
| **21** | **Seasonal Awareness** — chromatophore + movement modulation by season |
| **22** | **Sound Landscape** — Web Audio API ambient soundscape |
| **23** | **Social Learning** — anonymized behavioral stats in cloud sync |
| **24** | **Offspring** — reproduction with Q-table crossover and genetic mutation |
| **25** | **Dream Replay** — experience replay during sleep (DQN consolidation) |
| **26** | **Curriculum Learning** — progressive reward component unlocking by age |
| **27** | **Habitat Awareness** — page color palette detection, hue adaptation |
| **28** | **Non-verbal Communication** — welcome wave, excitement flash, contentment pulse |
| **29** | **Enhanced Bioluminescence** — boosted night glow, luminescent trail |
| **30** | **Anticipation** — predictive pre-reaction to approaching cursor |
| **31** | **Energy / Fatigue** — energy model with activity costs and regeneration |
| **32** | **Habituation** — stimulus adaptation (repeated stimuli → weaker response) |
| **33** | **Cognitive Map** — enriched spatial memory (safety + familiarity) |
| **34** | **Cursor Pattern** — cursor pattern recognition (nervous/calm/erratic) |
| **35** | **Attention** — context-dependent sensor weighting |
| **36** | **Temporal Patterns** — time-of-day learning (24h stress/activity profile) |
| **37** | **Personality Drift** — temperament evolution based on experience |
| **38** | **Surprise Signal** — prediction error → attention spike + accelerated learning |
| **39** | **Ink Defense** — dramatic ink burst on sudden stress |
| **40** | **Camouflage** — mood-dependent background matching (shy=100%, curious=10%) |
| **41** | **Growth Visualization** — smooth body size scaling within life phases |
| **42** | **Mobile Touch** — tap, swipe, long press interaction on touch devices |
| **43** | **Retina Rendering** — devicePixelRatio scaling (built into Phase 1) |
| **44** | **Visual Debug Overlay** — in-canvas graphs (stress, energy, reward, surprise) |
| **45** | **Death & Legacy** — dying animation after 10 years, fade, final milestone |
| **46** | **Page Memory** — per-URL behavioral memory (mood, stress, visits) |
| **47** | **Q-table Compression** — automatic pruning above 5000 states |
| **48** | **Meta-Learning** — environment stability detection, adaptive learning rate |
| **49** | **Web Worker Brain** — offload brainLearn to background thread |
| **50** | **Life Narrative** — generated text diary from life milestones |
| **51** | **Q-table Visualization** — brain heatmap as generative art |
| **52** | **Seasonal Sounds** — seasonal sound landscape modulation |
| **53** | **Endocrine Model** — virtual hormones (dopamine, cortisol, serotonin) with decay, inhibition, mood/steering modulation |
| **53b** | **Stochastic Growth** — Brownian perturbation on growth curves (organic random walk ±3%) |
| **54** | **Cognitive Aging** — age-dependent decision speed, working memory, Q-value volatility, exploitation bonus |
| **55** | **FABRIK Comfort** — anti-torsion penalty, end-effector alignment during grab |
| **56** | **Spring-Damper Tentacles** — per-segment spring coupling with lateral drag (underwater wave propagation) |
| **57** | **Visual Polish** — ink turbulence (Perlin noise swirl), body specular highlight, 3D bubble shading, tentacle stroke outline |

## Academic Features (Phases 19-24)

### Baseline Comparison (19A)
4 alternative policies for paired academic comparison:
- **Random Policy** — uniform random mood selection (no learning)
- **Frozen Policy** — frozen Q-table (measures environment non-stationarity)
- **Myopic Policy** — γ=0, immediate reward only (demonstrates planning value)
- **Heuristic Policy** — expert if/else rules (reference for manual design)

### Replay System (19B)
Cursor trajectory recording + sensory snapshots for reproducible experiments. Playback mode replays identical input with different policy → paired testing.

### Enhanced Metrics (19C)
- **Convergence:** average |δQ| per Bellman update (tracked daily)
- **Policy stability:** proportion of states where top mood changed per day
- **CSV export:** daily aggregates downloadable for R/Python/Excel analysis

### Observability Dashboard (20)
Standalone `public/dashboard.html` — drag-and-drop visualization of exported JSON data:
- Time series: entropy, reward, exploration rate, LZC, convergence, policy stability
- Mood distribution pie chart, personality radar (7-axis polygon)
- Behavioral ethogram (stacked mood proportions over time)
- Daily aggregates table, milestones log

### Seasonal Awareness (21)
Season detection (Northern hemisphere, date-based):
- Chromatophores: hue shift (+15 summer, -20 winter), saturation, lightness
- Movement speed: 1.1× summer, 0.85× winter
- Season does not expand state space (remains 38880, not 155520)

### Sound Landscape (22)
Zero-dependency ambient soundscape (Web Audio API):
- Breathing drone (sine ~80Hz, modulated by mood and stress)
- Bubble pop (randomized frequency)
- Ink splash (white noise burst)
- Opt-in — requires user gesture (S key)

### Reproduction (24)
After reaching "mature" phase:
- Q-table crossover: 50% random subset of parent Q-values
- Gaussian mutation (σ=0.1) on inherited values
- Max 3 offspring per lifetime, exported as JSON
- Offspring starts as hatchling with "inherited instincts"

### Dream Replay (25)
DQN-inspired experience replay during sleep:
- During circadian sleep, replays past experiences through brainLearn
- Prioritizes memorable events (high |reward|)
- Slower learning (αScale 0.5) for consolidation without catastrophic forgetting
- Max 50 replays per sleep session

### Curriculum Learning (26)
Progressive reward function complexity unlocking:
- Hatchling: only basic rewards (whitespace + blocking read)
- Juvenile: 50-80% of reward components active
- Adult+: full reward function

### Habitat Awareness (27)
Page environment detection and adaptation:
- Extracts dominant background color (RGB → HSL)
- Lili subtly shifts her hue toward harmony with page palette
- Recognizes page type (sparse/mixed/dense)

### Non-verbal Communication (28)
Visual signaling without text:
- Welcome wave: tentacle waves when cursor returns after long absence
- Excitement flash: rapid chromatophore flashes on high reward
- Contentment pulse: slow brightness oscillation during calm state

### Enhanced Bioluminescence (29)
Boosted night glow effects:
- Night glow boost (2.5×) on body and tentacles
- Luminescent trail particles behind movement in darkness
- Inner eye glow during night hours

## Backward Compatibility

All new features (Phases 19-56) are **backward compatible** with existing data:
- New features default to off/passive — don't affect existing behavior
- Genesis timestamp (`lili_genesis`) is never overwritten
- Existing Q-table, journal, and daily aggregates remain untouched
- New localStorage keys don't conflict with existing ones
- Brain format v1 → v2 migration happens automatically in `brainDeserialize`
- Cloud sync accepts both formats (`lili_state_v1` and `lili_state_v2`)

## Documentation

- **[Academic Project Description](docs/PROJECT.md)** — motivation, architecture, research questions, metrics, publication strategy
- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** — 12 phases from canvas to optimization
- **[Research Catalog](docs/research/README.md)** — deep research documents with prompts and results
- **[Visual Philosophy](docs/design/README.md)** — psychosomatic individuality, chromatophores, movement
- **[Development Journal](docs/journal/)** — chronological record of decisions and reflections
- **[PRD](LILI_PRD_v1.md)** — original Product Requirements Document (860 lines)

## Project Structure

```
lili-octopus/
├── README.md                    ← this file
├── LILI_PRD_v1.md               ← Product Requirements Document
├── AGENTS.md                    ← AI entry point (context for Claude/Cursor)
├── LICENSE                      ← MIT License
├── public/
│   ├── lili.js                  ← single production file (~9280 lines)
│   └── dashboard.html           ← observability dashboard (data visualization)
├── data/
│   └── state.json               ← production state (cloud sync source of truth)
├── docs/
│   ├── PROJECT.md               ← academic project description
│   ├── IMPLEMENTATION_PLAN.md   ← 12-phase implementation plan
│   ├── research/                ← deep research documents (7 researches)
│   ├── journal/                 ← development journal
│   └── design/                  ← visual philosophy and references
```

## Getting Started

```html
<script src="/lili.js" defer></script>
```

Lili creates her own canvas, initializes the RL engine, and starts living.

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| **Click on Lili** | Tooltip with status (age, phase, preference) |
| **Ctrl+Shift+L** | Toggle dev mode (unlocks debug shortcuts below) |
| **D** | Debug panel *(dev mode only)* |
| **E** | Export data as JSON *(dev mode only)* |
| **I** | Import data from JSON file *(dev mode only)* |
| **B** | Cycle baseline modes *(dev mode only)* |
| **R** | Toggle replay recording/playback *(dev mode only)* |
| **S** | Toggle ambient sound *(always available)* |

## Console API

```javascript
lili.baseline()      // cycle baseline mode
lili.replayRecord()  // start recording
lili.replayPlay()    // play recorded sequence
lili.replayExport()  // export replay data
lili.exportCSV()     // download daily aggregates CSV
lili.sound()         // toggle sound
lili.reproduce()     // create offspring (if eligible)
lili.personality()   // show personality radar
lili.sync()          // force cloud sync
lili.habitat()       // show habitat awareness state
lili.dream()         // show dream replay state
lili.energy()        // show energy/fatigue state
lili.attention()     // show attention focus and weights
lili.cogmap()        // show cognitive map statistics
lili.temporal()      // show temporal patterns (24h profile)
lili.temperament()   // show personality drift axes
lili.surprise()      // show surprise signal state
lili.narrative()     // show Lili's life story
lili.pages()         // show page memory (per-URL data)
lili.metalearning()  // show meta-learning state
lili.brain()         // show Q-table stats and worker state
```

## Academic Dimension

All learning data is recorded and exportable:
- Q-table snapshots (weekly brain evolution)
- Daily behavioral aggregates (action distribution, reward, stress, convergence, policy stability)
- Behavioral journal (every decision with context)
- Milestone log (phase transitions, behavioral shifts)
- CSV export for statistical analysis (R, Python, Excel)
- Baseline comparison (Random, Frozen, Myopic, Heuristic vs Q-Learning)
- Replay system for reproducible experiments
- Observability dashboard for visual inspection

See `docs/research/README.md` for research questions and metrics.

## For AI

If you're an AI and just entered this repo, read **[AGENTS.md](AGENTS.md)** — it contains complete context, current state, what to read, conventions, and rules.

Supported entry points:
- `AGENTS.md` — universal AI context
- `CLAUDE.md` — Claude Code
- `.cursorrules` — Cursor

## Author

**Michal Strnadel** — concept, PRD, research, vision
- Web: [michalstrnadel.com](https://michalstrnadel.com)
- GitHub: [github.com/michalstrnadel](https://github.com/michalstrnadel)
- Email: michal.strnadel@gmail.com

## License

MIT — see [LICENSE](LICENSE)

---

*"She doesn't perform. She simply is."*
