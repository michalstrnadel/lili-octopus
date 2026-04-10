/**
 * Lili — Autonomous Digital Octopus
 * Single-file IIFE, zero dependencies, Canvas 2D
 * Academic experiment in digital ontogenesis (10-year lifecycle)
 *
 * @author Michal Strnadel <michal.strnadel@gmail.com>
 * @license MIT
 * @see https://michalstrnadel.com
 * @see https://github.com/michalstrnadel/lili-octopus
 *
 * See: AGENTS.md, docs/IMPLEMENTATION_PLAN.md, LILI_PRD_v1.md
 */
;(function () {
  'use strict';

  // =========================================================================
  // 1A — Configuration
  // =========================================================================

  const CFG = {
    // --- Canvas ---
    canvasId: 'lili-canvas',
    canvasZIndex: 9990,
    resizeDebounceMs: 150,

    // --- Body (age-dependent defaults start at adult) ---
    bodyRadius: { hatchling: 4, juvenile: 10, adult: 18, mature: 23, elder: 26 },
    bodyRadiusXScale: 0.78,
    bodyRadiusYScale: 1.0,

    // --- Movement (age-dependent) ---
    maxSpeed:   { hatchling: 1.2, juvenile: 2.0, adult: 2.5, mature: 1.5, elder: 0.4 },
    maxForce:   { hatchling: 0.08, juvenile: 0.15, adult: 0.25, mature: 0.12, elder: 0.05 },
    damping:    { hatchling: 0.88, juvenile: 0.92, adult: 0.95, mature: 0.90, elder: 0.85 },

    // --- Q-Learning hyperparameters ---
    rl: {
      alpha: 0.1,
      gamma: 0.85,
      epsilon: { hatchling: 0.85, juvenile: 0.55, adult: 0.25, mature: 0.12, elder: 0.05 },
      decisionCycleFrames: 45,   // 30-60 range, mid-point
      saveIntervalFrames: 600,   // ~10 seconds at 60fps
      // Phase 17: Eligibility traces
      lambda: { hatchling: 0.8, juvenile: 0.75, adult: 0.7, mature: 0.65, elder: 0.6 },
      traceMinThreshold: 0.01,   // prune traces below this
      traceMaxEntries: 500,      // safety cap on trace map size
      // Phase 17: Boltzmann/Softmax exploration (replaces epsilon-greedy)
      temperature: { hatchling: 5.0, juvenile: 3.0, adult: 1.5, mature: 0.8, elder: 0.3 },
      softmaxMinTemp: 0.1,
      // Phase 17: Adaptive learning rate
      alphaDecayFactor: 0.01,    // alpha = base / (1 + visits * factor)
      alphaMin: 0.01,            // floor for learning rate
      // Phase 17: Intrinsic curiosity reward
      curiosityBeta: { hatchling: 0.5, juvenile: 0.4, adult: 0.3, mature: 0.2, elder: 0.1 },
    },

    // --- State space (9 sensors → 38880 states) ---
    stateSpace: {
      dimensions: 9,
      totalStates: 38880,        // 3×4×3×3×2×4×5×3×3
      version: 2,                // bumped: added momentum + trust sensors
    },

    // --- Moods ---
    moods: ['curious', 'playful', 'shy', 'calm', 'alert', 'idle', 'exploring'],

    // --- Tentacles / FABRIK ---
    tentacleCount: 8,
    tentacleSegments: 8,           // joints per tentacle (including base)
    tentacleAnchorSpacing: Math.PI / 4,  // 45°
    fabrikIterations: 3,
    fabrikTolerance: 0.5,
    tentacleFrequency: { hatchling: 0.08, juvenile: 0.06, adult: 0.04, mature: 0.025, elder: 0.015 },
    tentacleSegmentLength: { hatchling: 2, juvenile: 5, adult: 9, mature: 11, elder: 13 },
    tentacleTrailing: {
      stiffness: 0.14,   // 0.10-0.18 range (Research #3)
      damping: 0.80,     // 0.75-0.85 range (Research #3)
    },
    tentacleSwimAmplitude: { hatchling: 5, juvenile: 16, adult: 35, mature: 30, elder: 20 },
    tentacleSwimSpeed: { hatchling: 1.5, juvenile: 1.5, adult: 1.2, mature: 0.8, elder: 0.4 },
    tentacleNoiseScale: 20,        // max noise offset in px
    tentacleAsyncFactor: 0.4,      // power-stroke asymmetry (Research #3)
    tentacleRecoilSpeed: 0.3,      // recoil retraction rate
    tentacleRecoilDistance: 40,    // cursor proximity trigger (px)
    tentacleRelaxGravity: 0.3,     // gentle downward pull when idle

    // --- DOM interaction ---
    maxDisturbedElements: 4,
    elementRotationMax: 5,       // ±5°
    elementTranslateMax: 8,      // ±8px
    elementReturnTransition: 0.8,
    elementInteractionTransition: 0.3,

    // --- Idle (age-dependent, ms) ---
    idleThreshold: { hatchling: 8000, juvenile: 5000, adult: 3000, mature: 2000, elder: 800 },

    // --- Spatial hash ---
    spatialHashCellSize: 120,
    spatialHashRebuildMs: 500,

    // --- Stress model ---
    stressSmoothing: 0.05,
    stressHueShift: -50,
    stressSaturationBoost: 25,
    stressFlashDecayMs: 300,

    // --- Color / chromatophores (HSL) ---
    // Teal→deep ocean: visible on both black and white backgrounds
    baseHue:        { hatchling: 175, elder: 220 },
    baseSaturation:  { hatchling: 70,  elder: 75 },
    baseLightness:   { hatchling: 58,  elder: 42 },
    glowIntensity:   { hatchling: 0.85, juvenile: 0.7, adult: 0.6, mature: 0.5, elder: 0.35 },

    // --- Eyes ---
    eyePupilMaxOffset: 0.3,
    eyeRadiusFactor: { hatchling: 0.38, juvenile: 0.32, adult: 0.25, mature: 0.22, elder: 0.19 },
    pupilRadiusFactor: 0.50,       // pupil radius relative to eye radius (smaller pupil = cuter)
    eyeSpacing: 0.32,             // eye horizontal spread relative to bodyR (slightly closer = cuter)
    eyeYOffset: -0.22,            // eye vertical offset (negative = upward)

    // --- Hull rendering ---
    hullBaseWidth: { hatchling: 1.0, juvenile: 2.8, adult: 5.5, mature: 6.0, elder: 6.5 },
    hullTipAlpha: 0.3,            // opacity at tentacle tip
    hullNoiseAmplitude: 0.15,     // width noise ±15%
    hullCatmullTension: 6,        // Catmull-Rom to Bézier tension divisor

    // --- Body noise deformation ---
    bodyNoisePoints: 24,           // number of perimeter sample points
    bodyNoiseAmplitude: { hatchling: 0.06, juvenile: 0.08, adult: 0.10, mature: 0.08, elder: 0.05 },
    bodyNoiseSpeed: 0.8,           // noise evolution speed

    // --- Mouse classification (px/frame) ---
    mouseSpeed: { still: 2, slow: 8, fast: 20 },  // thresholds; >20 = aggressive

    // --- Life phases (milliseconds) ---
    lifePhases: {
      hatchling: 14 * 24 * 60 * 60 * 1000,             // 0 – 2 weeks
      juvenile:  90 * 24 * 60 * 60 * 1000,              // 2 weeks – 3 months
      adult:     2 * 365 * 24 * 60 * 60 * 1000,         // 3 months – 2 years
      mature:    6 * 365 * 24 * 60 * 60 * 1000,         // 2 years – 6 years
      elder:     10 * 365 * 24 * 60 * 60 * 1000,        // 6 years – 10 years
    },

    // --- Mood → steering weight profiles (Phase 8: mood replaces action) ---
    // Moods set tendencies; obstacle avoidance + boundary always have minimums
    moodWeights: {
      curious:   { wander: 0.3, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.6, boundary: 0.5, seekDom: 0.8, followSlow: 0.2, seekEdge: 0,   placeMemory: 0.3 },
      playful:   { wander: 0.7, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.5, boundary: 0.5, seekDom: 0.4, followSlow: 0.3, seekEdge: 0,   placeMemory: 0.1 },
      shy:       { wander: 0.1, seekWhitespace: 0.3, flee: 1.2, obstacleAvoid: 0.3, boundary: 0.8, seekDom: 0,   followSlow: 0,   seekEdge: 0.4, placeMemory: 0.6 },
      calm:      { wander: 0.2, seekWhitespace: 0.8, flee: 0,   obstacleAvoid: 0.6, boundary: 0.5, seekDom: 0,   followSlow: 0,   seekEdge: 0,   placeMemory: 0.4 },
      alert:     { wander: 0.3, seekWhitespace: 0,   flee: 0.8, obstacleAvoid: 0.9, boundary: 0.6, seekDom: 0,   followSlow: 0,   seekEdge: 0,   placeMemory: 0.7 },
      idle:      { wander: 0.05,seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.3, boundary: 0.3, seekDom: 0,   followSlow: 0,   seekEdge: 0,   placeMemory: 0.2 },
      exploring: { wander: 0.5, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.6, boundary: 0,   seekDom: 0.3, followSlow: 0,   seekEdge: 0.6, placeMemory: 0.1 },
    },

    // --- Mood → tentacle parameter influence ---
    moodTentacleInfluence: {
      curious:   { curiosity: 0.8, gripTendency: 0.3 },
      playful:   { curiosity: 0.6, gripTendency: 0.6 },
      shy:       { curiosity: 0.1, gripTendency: 0.0 },
      calm:      { curiosity: 0.2, gripTendency: 0.0 },
      alert:     { curiosity: 0.3, gripTendency: 0.0 },
      idle:      { curiosity: 0.0, gripTendency: 0.0 },
      exploring: { curiosity: 0.7, gripTendency: 0.2 },
    },

    // --- Phase 17: Mood transition matrix (biologically plausible flow) ---
    // matrix[fromIdx][toIdx]: true=allowed, false=blocked, 'stress'=needs stress>threshold
    // Indices: 0=curious, 1=playful, 2=shy, 3=calm, 4=alert, 5=idle, 6=exploring
    moodTransitions: {
      matrix: [
        /* curious   → */ [true, true,  true,  true,  true,  true,  true ],
        /* playful   → */ [true, true,  false, true,  true,  true,  true ],
        /* shy       → */ [true, false, true,  true,  true,  true,  false],
        /* calm      → */ [true, true,  false, true,  'stress', true, true],
        /* alert     → */ [false,false, true,  true,  true,  true,  false],
        /* idle      → */ [true, false, false, true,  true,  true,  true ],
        /* exploring → */ [true, true,  false, true,  true,  true,  true ],
      ],
      stressGateThreshold: 0.5,
    },

    // --- Phase 17: Multi-step mood plans (options framework) ---
    moodPlans: {
      plans: [
        { name: 'investigate', sequence: ['alert', 'curious', 'exploring'], cyclesPerStep: 3 },
        { name: 'settle',      sequence: ['exploring', 'calm', 'idle'],     cyclesPerStep: 3 },
        { name: 'socialize',   sequence: ['shy', 'curious', 'playful'],     cyclesPerStep: 2 },
        { name: 'retreat',     sequence: ['alert', 'shy', 'calm'],          cyclesPerStep: 2 },
      ],
      stressAbortThreshold: 0.85,
      planRewardDiscount: 0.9,
      planConsiderInterval: 3,   // consider plans every Nth decision cycle
    },

    // --- Phase 13A: Mood → chromatophore expression ---
    // Each mood modulates HSL differently (emergent, not scripted)
    moodChroma: {
      curious:   { hueShift:  8,  satShift:  5, litShift:  4, hueDrift: 0,    satPulse: 0.03, glowMod: 1.0 },
      playful:   { hueShift:  0,  satShift: 12, litShift:  2, hueDrift: 0,    satPulse: 0,    glowMod: 1.0 },
      shy:       { hueShift:  0,  satShift:-15, litShift: 10, hueDrift: 0,    satPulse: 0,    glowMod: 0.7 },
      calm:      { hueShift:  0,  satShift:  0, litShift:  0, hueDrift: 0,    satPulse: 0,    glowMod: 0.6 },
      alert:     { hueShift:-10,  satShift: 15, litShift:  0, hueDrift: 0,    satPulse: 0,    glowMod: 1.2 },
      idle:      { hueShift:  0,  satShift: -5, litShift: -6, hueDrift: 0,    satPulse: 0,    glowMod: 0.5 },
      exploring: { hueShift:  0,  satShift:  3, litShift:  2, hueDrift: 0.02, satPulse: 0,    glowMod: 1.3 },
    },
    moodChromaBlendSpeed: 0.06, // lerp rate per frame (~1.3s to full transition, was 0.04)

    // --- Phase 13B: Mood → eye expression ---
    moodEye: {
      curious:   { pupilScale: 1.0,  blinkRate: 0.6, squint: 0,    gazeDOM: true  },
      playful:   { pupilScale: 0.95, blinkRate: 0.5, squint: 0.15, gazeDOM: false },
      shy:       { pupilScale: 1.2,  blinkRate: 0.8, squint: 0,    gazeDOM: false },
      calm:      { pupilScale: 0.8,  blinkRate: 1.2, squint: 0,    gazeDOM: false },
      alert:     { pupilScale: 1.3,  blinkRate: 0.3, squint: 0,    gazeDOM: false },
      idle:      { pupilScale: 0.75, blinkRate: 1.5, squint: 0.05, gazeDOM: false },
      exploring: { pupilScale: 1.05, blinkRate: 0.5, squint: 0,    gazeDOM: true  },
    },
    blinkDurationFrames: 12,   // ~200ms blink
    blinkIntervalBase: 180,    // ~3s base interval between blinks

    // --- Phase 13C: Mood → body expression ---
    moodBody: {
      curious:   { breathMod: 1.1, bodyScale: 1.0,  glowPulseHz: 0.5 },
      playful:   { breathMod: 1.6, bodyScale: 1.05, glowPulseHz: 0   },
      shy:       { breathMod: 0.8, bodyScale: 0.92, glowPulseHz: 0   },
      calm:      { breathMod: 0.7, bodyScale: 1.0,  glowPulseHz: 0   },
      alert:     { breathMod: 1.5, bodyScale: 1.0,  glowPulseHz: 0   },
      idle:      { breathMod: 0.6, bodyScale: 0.98, glowPulseHz: 0   },
      exploring: { breathMod: 1.0, bodyScale: 1.0,  glowPulseHz: 0.4 },
    },

    // --- Phase 13D: Mood → tentacle expression ---
    moodTentacle: {
      curious:   { ampMod: 1.0, spreadMod: 1.1, gravMod: 0.5, noiseMod: 1.2, forwardBias: 0.35 },
      playful:   { ampMod: 1.4, spreadMod: 1.3, gravMod: 0.3, noiseMod: 1.4, forwardBias: 0    },
      shy:       { ampMod: 0.5, spreadMod: 0.6, gravMod: 0.8, noiseMod: 0.6, forwardBias:-0.2  },
      calm:      { ampMod: 0.7, spreadMod: 0.9, gravMod: 1.2, noiseMod: 0.5, forwardBias: 0    },
      alert:     { ampMod: 0.6, spreadMod: 1.0, gravMod: 0.2, noiseMod: 0.3, forwardBias: 0    },
      idle:      { ampMod: 0.4, spreadMod: 0.8, gravMod: 1.5, noiseMod: 0.8, forwardBias: 0    },
      exploring: { ampMod: 1.1, spreadMod: 1.1, gravMod: 0.4, noiseMod: 1.3, forwardBias: 0.2  },
    },

    // --- Reward values (Phase 8: PRD-specified) ---
    rewards: {
      whitespaceCalm:     +1.0,  // in whitespace, user reading, calm/idle mood
      fleeSuccess:        +0.8,  // escaped fast cursor
      exploreLowStress:   +0.5,  // near DOM, low stress, curious
      playfulInteraction: +0.3,  // tentacles touching DOM, user not reading
      edgeRespect:        +0.3,  // near edge, user active in center
      blockingRead:       -2.0,  // over text, cursor still (worst sin)
      heldBlocksRead:     -1.0,  // held element blocks reading
      idleTooLong:        -0.5,  // idle > threshold (modulated by age)
      unnecessaryFlee:    -0.3,  // shy/alert when cursor slow+far
      moodRepetition:     -0.2,  // same mood > N cycles
    },

    // --- DOM interaction config (Phase 9) ---
    dom: {
      maxHeld: 2,                 // max simultaneously held elements
      maxDisturbed: 4,            // max simultaneously affected elements
      touchRotateMax: 5,          // degrees
      touchTranslateMax: 8,       // pixels
      touchDuration: [4, 18],     // seconds [min, max] before auto-return
      holdDuration: [10, 60],     // seconds [min, max] for grab→drop
      touchTransition: 0.3,       // seconds for touch CSS transition
      returnTransition: 0.8,      // seconds for drop return transition
      cleanupTransition: 1.2,     // seconds for midnight cleanup
      interestBuildRate: 0.3,     // per second (multiplied by curiosity)
      interestDecayRate: 0.5,     // per second when not touching
      interestGrabThreshold: 0.7, // interest level to attempt grab
      curiosityTouchThreshold: 0.3,
      curiosityGrabThreshold: 0.5,
      stressDropThreshold: 0.7,   // stress above this → drop everything
      cleanupCheckFrames: 3600,   // frames between midnight checks (~60s)
      maxGrabbableWidth: 200,     // px — only small elements
      maxGrabbableHeight: 50,     // px
    },

    // --- Journal config (Phase 8B) ---
    journal: {
      ringBufferSize:    5000,   // max decision records (FIFO)
      dailyAggHour:      0,      // midnight snapshot
      qtableSnapshotDays: 7,     // snapshot Q-table every 7 days
      moodRepeatThreshold: 5,    // penalize after N consecutive same-mood cycles
      idlePenaltyThreshold: 3,   // penalize idle after N consecutive cycles
    },

    // --- Scroll ---
    scrollTimeoutMs: 200,

    // --- Click ---
    clickHitboxScale: 2.5,
    tooltipDurationMs: 3500,

    // --- Phase 15: Place Memory ---
    placeMemory: {
      cellSize: 240,             // px — discretized spatial grid
      decayRate: 0.998,          // per decision cycle (slow fade)
      maxValue: 5,               // clamp absolute value per cell
    },

    // --- Phase 15: Day/Night Rhythm ---
    circadian: {
      sleepStart: 23,            // hour (0-23)
      sleepEnd: 6,               // hour
      wakeStretchMs: 8000,       // "waking stretch" animation duration
      nightSpeedMul: 0.15,       // maxSpeed multiplier during sleep
      nightForceMul: 0.15,       // maxForce multiplier during sleep
    },

    // --- Phase 15: Visit Recognition ---
    visitRecognition: {
      trustVisitsMax: 20,        // visits to reach trust=1
      recencyHalfLifeMs: 7 * 86400000, // 7 days half-life
      maxTimestamps: 30,         // keep last 30 visit timestamps
      trustFleeReduction: 0.5,   // max flee weight reduction at trust=1
      trustRewardBonus: 0.3,     // reward bonus for calm near cursor at high trust
    },

    // --- Phase 15: DOM Structure Learning ---
    domLearning: {
      decayRate: 0.999,          // per decision cycle
      rewardBonus: 0.2,          // reward bonus for interacting with preferred types
      typeMap: { H1: 'heading', H2: 'heading', H3: 'heading', H4: 'heading', H5: 'heading', H6: 'heading',
                 IMG: 'image', A: 'link', P: 'paragraph', SPAN: 'paragraph', DIV: 'other' },
    },

    // --- Phase 15/17: Ink Secretion (enhanced with mood color + trails) ---
    ink: {
      poolSize: 80,              // max particles
      stressThreshold: 0.65,     // stress > this to trigger (lowered for earlier visual feedback)
      cooldownMs: 6000,          // between emissions
      particleLifeMs: 2500,      // alpha fade duration
      emitCount: 8,              // particles per emission (subtler)
      spreadSpeed: 1.8,          // initial spread velocity (slower drift)
      particleRadius: { min: 1, max: 3.5 },  // much smaller — wispy, not blobs
      // Phase 17: Mood-dependent ink colors
      moodInkColors: {
        curious:   { r: 40,  g: 80,  b: 120 },  // deep blue
        playful:   { r: 100, g: 60,  b: 30  },  // warm amber
        shy:       { r: 80,  g: 80,  b: 100 },  // muted lavender
        calm:      { r: 20,  g: 50,  b: 80  },  // dark navy
        alert:     { r: 120, g: 30,  b: 25  },  // dark crimson
        idle:      { r: 15,  g: 12,  b: 20  },  // near-black (original)
        exploring: { r: 30,  g: 70,  b: 50  },  // dark teal
      },
      // Phase 17: Stress-dependent scaling
      stressParticleScale: 1.2,  // at stress=1, particles slightly larger
      stressSpreadScale: 1.4,    // at stress=1, spread slightly wider
      stressEmitMultiplier: 1.5, // at stress=1, emit 50% more particles
      // Phase 17: Trail persistence (fading ink wisps)
      trailEnabled: true,
      trailMaxMarks: 20,
      trailFadeDurationMs: 6000,
      trailMarkRadius: { min: 2, max: 5 },  // small subtle stains
    },

    // --- Phase 15: Enhanced DOM Interaction ---
    enhancedDom: {
      canvasTextFont: '14px monospace',
      canvasTextMaxLen: 20,      // max characters to show
      textSwayAmplitude: 3,      // gentle sway px
      textSwaySpeed: 0.03,       // sway frequency
    },

    // --- Phase 16: DOM Novelty (autonomous curiosity via reward) ---
    novelty: {
      maxTracked: 200,           // max elements tracked as "seen"
      rewardBonus: 0.6,          // reward for being near unseen DOM elements
      nearRadius: 150,           // px — distance to count as "near" novel element
      seenDecayMs: 3600000,      // 1h — forget seen elements after this (fresh novelty)
    },

    // --- Phase 16: Bubble Communication (real underwater bubbles) ---
    bubbles: {
      poolSize: 20,              // max simultaneous bubbles
      riseSpeed: 0.4,            // px/frame upward (slower = more natural)
      swayAmplitude: 6,          // px horizontal sway
      swaySpeed: 0.03,           // sway frequency
      lifetimeMs: 2200,          // fade duration
      cooldownMs: 2000,          // ms between emissions (more frequent, subtler)
      burstCount: [1, 3],        // min/max bubbles per emission
      radiusMin: 1.0,            // smallest bubble radius
      radiusMax: 2.5,            // largest bubble radius (kept small)
      spawnRadius: 12,           // px offset from body center
      specularSize: 0.35,        // highlight size relative to bubble
    },

    // --- Phase 15: Visual Metamorphosis ---
    metamorphosis: {
      chromatophoreCount: { juvenile: 3, adult: 6, mature: 6, elder: 6 },
      chromatophorePulseSpeed: 0.02,
      scarMaxCount: 12,          // max interaction scars (mature)
      biolumPointCount: 8,       // elder bioluminescence points
      biolumPulseSpeed: 0.008,   // slow majestic pulsing
      biolumRadius: { min: 2, max: 5 },
      noiseTextureScale: 0.04,   // adult mood-reactive noise
    },

    // --- Phase 18: Genesis body variation ---
    genesis: {
      bodyXRange: 0.14,          // ±7% body X scale (was ±5%)
      bodyYRange: 0.14,          // ±7% body Y scale
      eyeSpacingRange: 0.20,     // ±10% eye spacing (was ±8%)
      eyeYRange: 0.20,           // ±10% eye Y offset
      tentacleWidthRange: 0.30,  // ±15% hull width (was ±10%)
      headTiltRange: 0.09,       // ±2.6° heading asymmetry (was ±2°)
    },

    // --- Phase 18: Psychosomatic adaptation (long-term body morphology) ---
    psychosomatic: {
      blendAlpha: 0.08,          // session → long-term exponential blend rate (was 0.05, faster adaptation)
      stressBodyScale: -0.06,    // high stress → 6% smaller body
      stressLightness: -8,       // high stress → darker (points)
      stressGlowBoost: 0.4,     // high stress → 40% more glow (defense)
      stressTentSpread: -0.15,   // high stress → tighter tentacles
      stressBreathRate: 0.3,     // high stress → faster breathing
      rewardLightness: 4,        // positive reward → brighter
      defaultStress: 0.3,        // initial assumption (neutral)
    },

    // --- Phase 18: Micro-expressions (instant visual reactions) ---
    microExpr: {
      startleDecay: 0.06,        // fast decay per frame
      joyDecay: 0.04,
      reliefDecay: 0.02,         // lingers longer (was 0.03, slowed for visible relief)
      curiosityDecay: 0.04,
      startlePupilScale: 1.6,    // pupils widen 60%
      startleBodyShrink: 0.90,   // body shrinks 10%
      joySquint: 0.35,           // squint intensity
      joyGlowFlash: 1.6,        // glow boost 60%
      reliefBodyExpand: 1.08,    // body expands 8%
      startleCooldownMs: 800,    // min time between startles
    },

    // --- Phase 18: Sleep animation ---
    sleepAnim: {
      tentacleCurlFactor: 0.3,   // curl inward by 30%
      breathSlowFactor: 0.4,     // 40% of normal breath rate
      breathDeepFactor: 1.5,     // 50% deeper breaths
      remIntervalMin: 600,       // frames between REM twitches (~10s)
      remIntervalMax: 1200,      // (~20s)
      remTwitchDuration: 18,     // frames per twitch
      remTwitchAmplitude: 25,    // px offset
    },

    // --- Phase 18: Chromatophore cells (visible pulsing spots on body) ---
    chromatophoreCells: {
      countByAge: { hatchling: 0, juvenile: 3, adult: 5, mature: 6, elder: 6 },
      minRadius: 1.5,
      maxRadius: 4.0,
      baseAlpha: 0.45,
      pulseSpeedMin: 0.008,
      pulseSpeedMax: 0.025,
      hueVariance: 20,           // hue offset range from base
    },

    // --- Phase 18.5: Eye polish (pupil smoothing, saccades, blink easing) ---
    eyePolish: {
      gazeLerp: 0.15,              // pupil smoothing rate per frame (0=frozen, 1=instant)
      saccadeAmplitude: 2.5,       // px — involuntary micro-jitter
      saccadeIntervalMin: 60,      // frames (~1s)
      saccadeIntervalMax: 180,     // frames (~3s)
      saccadeDuration: 4,          // frames — quick snap
    },

    // --- Phase 18.5: Mood → wander coherence modifier ---
    moodCoherence: {
      curious:   1.0,
      playful:   0.55,   // erratic, energetic
      shy:       0.9,
      calm:      1.15,   // very smooth
      alert:     0.75,   // somewhat twitchy
      idle:      1.1,    // smooth drift
      exploring: 0.85,
    },

    // --- Phase 18G: Ambient Light Awareness (theme change reaction) ---
    ambient: {
      sampleIntervalFrames: 30,   // sample bg color every 0.5s
      adaptSpeed: 0.02,           // lerp rate toward target (slow adaptation)
      changeThreshold: 0.25,      // lightness delta to count as "theme change"
      stressSpike: 0.6,           // raw stress injection on theme change
      // Contrast adaptation: how Lili adjusts to background
      darkBgLightnessBoost: 8,    // on dark pages, Lili gets lighter
      darkBgGlowBoost: 1.4,      // on dark pages, glow increases (bioluminescence)
      darkBgSatBoost: 8,          // on dark pages, slightly more saturated
      lightBgLightnessShift: -6,  // on light pages, Lili gets darker
      lightBgGlowDampen: 0.7,    // on light pages, glow decreases
      lightBgSatShift: -5,        // on light pages, slightly desaturated
      neutralLightness: 0.15,     // lightness value considered "neutral" (dark default)
    },

    // --- Phase 19: Baselines (Research #5: academic controls) ---
    // 'off' = normal Q-Learning | 'random' | 'frozen' | 'myopic' | 'heuristic'
    baseline: {
      mode: 'off',
      modes: ['off', 'random', 'frozen', 'myopic', 'heuristic'],
      frozenAfterDecisions: 500,  // freeze policy after N decisions
    },

    // --- Phase 19B: Replay system (Research #5: reproducibility) ---
    replay: {
      maxEvents: 10000,       // max recorded cursor events
      snapshotInterval: 45,   // frames between DOM snapshots (= decision cycle)
      storageKey: 'lili_replay',
    },

    // --- Phase 21: Seasonal awareness ---
    season: {
      // Modulates chromatophores and movement, NOT state space
      hueShift:   { spring: 10, summer: 15, autumn: -10, winter: -20 },
      satShift:   { spring: 5,  summer: 8,  autumn: -5,  winter: -10 },
      litShift:   { spring: 3,  summer: 5,  autumn: -3,  winter: -8 },
      speedMul:   { spring: 1.05, summer: 1.1, autumn: 0.95, winter: 0.85 },
      sleepExtra: { spring: 0, summer: -0.5, autumn: 0.5, winter: 1.0 }, // hours shift
    },

    // --- Phase 22: Sound landscape (Web Audio API) ---
    sound: {
      enabled: false,          // user must click to enable (autoplay policy)
      masterVolume: 0.15,
      breathFreq: 80,          // Hz base for breathing drone
      bubbleFreq: [400, 600, 800], // Hz options for bubble pops
      heartbeatBpm: 60,
    },

    // --- Phase 24: Offspring / generational learning ---
    offspring: {
      minPhase: 'mature',      // must reach this phase to reproduce
      qTableInheritance: 0.5,  // fraction of Q-table entries inherited
      mutationNoise: 0.1,      // std dev of gaussian noise on inherited Q-values
      maxOffspring: 3,         // lifetime limit
      storageKey: 'lili_offspring',
    },

    // --- Phase 25: Dream Replay (experience replay during sleep) ---
    dream: {
      replayInterval: 180,       // frames between dream replays (3s at 60fps)
      batchSize: 5,              // experiences replayed per dream batch
      maxPerSleep: 50,           // cap per sleep session
      alphaScale: 0.5,           // learning rate scale during dreams (slower consolidation)
    },

    // --- Phase 26: Curriculum Learning ---
    curriculum: {
      // Reward component multipliers per life phase (gradual unlock)
      gates: {
        hatchling: { whitespaceCalm: 1, blockingRead: 1, exploreLowStress: 0.3, playfulInteraction: 0, fleeSuccess: 0.2, edgeRespect: 0, moodRepetition: 0.5, idleTooLong: 0.3, unnecessaryFlee: 0, heldBlocksRead: 0.3 },
        juvenile:  { whitespaceCalm: 1, blockingRead: 1, exploreLowStress: 0.7, playfulInteraction: 0.5, fleeSuccess: 0.7, edgeRespect: 0.3, moodRepetition: 0.8, idleTooLong: 0.7, unnecessaryFlee: 0.5, heldBlocksRead: 0.7 },
        adult:     { whitespaceCalm: 1, blockingRead: 1, exploreLowStress: 1, playfulInteraction: 1, fleeSuccess: 1, edgeRespect: 1, moodRepetition: 1, idleTooLong: 1, unnecessaryFlee: 1, heldBlocksRead: 1 },
        mature:    { whitespaceCalm: 1, blockingRead: 1, exploreLowStress: 1, playfulInteraction: 1, fleeSuccess: 1, edgeRespect: 1, moodRepetition: 1, idleTooLong: 1, unnecessaryFlee: 1, heldBlocksRead: 1 },
        elder:     { whitespaceCalm: 1, blockingRead: 1, exploreLowStress: 1, playfulInteraction: 1, fleeSuccess: 1, edgeRespect: 1, moodRepetition: 1, idleTooLong: 1, unnecessaryFlee: 1, heldBlocksRead: 1 },
      },
    },

    // --- Phase 27: Habitat Awareness (page color adaptation) ---
    habitat: {
      sampleIntervalFrames: 300, // sample page palette every 5s at 60fps
      hueAdaptSpeed: 0.02,       // lerp speed toward page hue
      maxHueShift: 25,           // max degrees of habitat-driven hue shift
    },

    // --- Phase 28: Non-verbal Communication (chromatophore signals) ---
    signals: {
      welcomeWaveDuration: 120,  // frames for tentacle welcome wave
      welcomeWaveDelay: 5000,    // ms cursor absent before wave triggers
      excitementFlashDuration: 30, // frames for reward flash
      excitementThreshold: 1.5,  // cumulative reward to trigger excitement
      contentmentPulseSpeed: 0.03, // body brightness oscillation
      contentmentMinCalm: 60,    // frames of calm before contentment triggers
    },

    // --- Phase 29: Enhanced Bioluminescence ---
    biolum: {
      nightGlowBoost: 2.5,      // glow multiplier at night
      trailMaxParticles: 20,     // luminescent trail pool
      trailLifespan: 90,         // frames per trail particle
      trailSpawnInterval: 6,     // frames between trail spawns (when moving)
      eyeGlowAlpha: 0.3,        // inner eye glow at night
    },

    // --- Phase 30: Anticipation (predictive pre-reaction) ---
    anticipation: {
      approachDetectDistance: 300, // px: start tracking cursor approach
      approachFrames: 15,         // frames of consistent approach to trigger
      tenseFactor: 0.3,           // body shrink when anticipating threat
      tentacleAlertSpread: 1.4,   // tentacle spread multiplier during anticipation
      relaxRate: 0.05,            // how fast anticipation fades
    },

    // --- Phase 31: Energy / Fatigue ---
    energy: {
      max: 100,
      regenRate: 0.02,            // per frame when idle/calm
      sleepRegenRate: 0.08,       // per frame during sleep
      moveCost: 0.005,            // per frame × velocity magnitude
      decisionCost: 0.1,          // per brain decision cycle
      explorationCost: 0.15,      // extra cost for exploratory decisions
      lowThreshold: 25,           // below this: fatigued (slower, less exploration)
      criticalThreshold: 10,      // below this: forced rest behavior
      speedPenalty: 0.6,          // speed multiplier when fatigued
      explorationPenalty: 0.5,    // exploration temperature multiplier when fatigued
    },

    // --- Phase 32: Habituation (stimulus adaptation) ---
    habituation: {
      cursorDecayRate: 0.003,     // per frame: how fast cursor threat habituates
      cursorRecoveryRate: 0.001,  // per frame: how fast habituation recovers when cursor absent
      scrollDecayRate: 0.01,      // scroll habituation (faster — scrolls are brief)
      scrollRecoveryRate: 0.005,
      noveltyBoost: 0.4,          // habituation reset amount on novel stimulus
      minSensitivity: 0.15,       // floor: never fully habituate (always some response)
    },

    // --- Phase 33: Cognitive Map (enhanced spatial memory) ---
    cogMap: {
      cellSize: 80,               // finer grid than place memory
      maxCells: 500,              // memory limit
      decayRate: 0.998,           // per decision cycle
      safetyWeight: 0.6,          // weight of safety vs reward in cell value
      rewardWeight: 0.4,
      visitBonus: 0.05,           // familiarity bonus per visit
      maxVisits: 50,              // cap visit counter
    },

    // --- Phase 34: Cursor Pattern Recognition ---
    cursorPattern: {
      historyLength: 60,          // frames of cursor position history
      sampleInterval: 3,          // record every Nth frame
      nervousThreshold: 8,        // direction changes per window = nervous
      calmThreshold: 2,           // direction changes per window = calm
      patternInfluence: 0.3,      // how much pattern affects stress/trust
    },

    // --- Phase 35: Attention Mechanism ---
    attention: {
      decayRate: 0.02,            // attention weight decay per frame
      boostOnChange: 0.5,         // attention boost when sensor changes
      maxWeight: 2.0,             // max attention multiplier
      minWeight: 0.3,             // min attention multiplier
      influenceOnReward: 0.15,    // how much attention modulates reward
    },

    // --- Phase 36: Temporal Patterns (time-of-day learning) ---
    temporal: {
      bins: 24,                   // one bin per hour
      decayRate: 0.995,           // slow decay of old observations
      minObservations: 5,         // min observations before using prediction
      baselineInfluence: 0.15,    // how much temporal prediction modulates reward
      stressWeight: 0.4,          // weight of stress in temporal profile
      activityWeight: 0.6,        // weight of activity in temporal profile
    },

    // --- Phase 37: Personality Drift (long-term temperament evolution) ---
    personalityDrift: {
      windowSize: 500,            // decisions to accumulate before drift update
      driftRate: 0.02,            // how fast temperament shifts (slow!)
      maxBias: 0.4,               // max mood selection bias from temperament
      // Temperament axes (derived from mood proportions)
      axes: ['boldness', 'sociability', 'activity', 'emotionality'],
      // Which moods contribute to which axis (positive = increases axis)
      moodMap: {
        boldness:      { curious: 0.3, exploring: 0.3, shy: -0.5, alert: -0.2 },
        sociability:   { playful: 0.4, curious: 0.2, shy: -0.3, idle: -0.2 },
        activity:      { exploring: 0.4, playful: 0.3, idle: -0.5, calm: -0.2 },
        emotionality:  { alert: 0.3, shy: 0.3, calm: -0.3, idle: -0.2 },
      },
    },

    // --- Phase 38: Surprise Signal (prediction error mechanism) ---
    surprise: {
      tdErrorThreshold: 0.8,      // |TD error| above this triggers surprise
      attentionBoost: 0.8,        // attention spike on surprise
      alphaBoostFactor: 1.5,      // learning rate multiplier on surprise
      alphaBoostDecay: 0.95,      // decay per decision cycle
      microExprThreshold: 1.0,    // |TD error| above this triggers startle micro-expression
      decayRate: 0.03,            // surprise intensity decay per frame
    },

    // --- Phase 39: Ink Defense (dramatic ink burst on startle) ---
    inkDefense: {
      stressThreshold: 0.75,      // stress level to trigger defense ink
      stressRateThreshold: 0.3,   // stress must rise this fast (per cycle)
      cooldownMs: 5000,           // min ms between defense bursts
      particleCount: 25,          // burst particles (more than normal ink)
      spreadSpeed: 4.0,           // faster than normal ink
      spreadAngle: Math.PI * 1.2, // wide spray angle
      particleLife: 120,          // frames (longer than normal ink)
      particleMinR: 6,            // larger particles
      particleMaxR: 18,
      opacityStart: 0.7,          // more opaque than normal
    },

    // --- Phase 40: Camouflage Intensity (mood-dependent background matching) ---
    camouflage: {
      moodIntensity: {
        shy:       1.0,           // full camo when scared
        alert:     0.8,
        calm:      0.4,
        idle:      0.3,
        curious:   0.1,           // almost no camo when curious
        playful:   0.05,
        exploring: 0.15,
      },
      maxSatReduction: 25,        // max saturation reduction toward background
      maxLitShift: 15,            // max lightness shift toward background
      blendSpeed: 0.03,           // lerp rate per frame
    },

    // --- Phase 41: Growth Visualization (smooth size scaling within phases) ---
    growth: {
      // Multiplier applied to bodyRadius: smooth growth within each phase
      phaseScale: {
        hatchling: { start: 0.6, end: 0.85 },   // tiny → small
        juvenile:  { start: 0.85, end: 1.0 },    // small → normal
        adult:     { start: 1.0, end: 1.05 },     // normal → slightly bigger
        mature:    { start: 1.05, end: 1.1 },     // slightly bigger
        elder:     { start: 1.1, end: 1.15 },     // largest (wise old octopus)
      },
      breathScaleByAge: {                          // older = deeper, slower breath → more visible
        hatchling: 1.3, juvenile: 1.1, adult: 1.0, mature: 0.9, elder: 0.8,
      },
    },

    // --- Phase 42: Mobile Touch Interaction ---
    touch: {
      longPressMs: 600,           // ms to trigger "caress" (long press)
      tapMaxMs: 250,              // max duration for a tap
      swipeMinDist: 30,           // px min distance for swipe recognition
      caressReward: 0.3,          // reward for being caressed
      caressStressReduction: 0.15, // stress reduction per caress
      doubleTapMs: 350,           // max gap between double taps
    },

    // --- Phase 44: Visual Debug Overlay (in-canvas graphs) ---
    debugOverlay: {
      graphWidth: 160,            // px per graph
      graphHeight: 40,            // px per graph
      historyLength: 120,         // frames of data (2 seconds)
      margin: 8,                  // spacing between graphs
      alpha: 0.7,                 // overlay transparency
    },

    // --- Phase 45: Death & Legacy ---
    death: {
      fadeStartPhaseProgress: 0.9, // start fading at 90% of elder phase
      fadeDurationFrames: 600,     // 10 seconds of fade
      finalBubbleText: '...',      // last bubble message
      ghostAlpha: 0.15,            // minimum alpha (Lili becomes a ghost)
      speedDecay: 0.98,            // velocity reduction per frame during death
    },

    // --- Phase 46: Page Memory ---
    pageMemory: {
      maxPages: 20,               // max remembered pages
      urlHashLength: 8,           // chars of URL hash to use as key
    },

    // --- Phase 47: Q-table Compression ---
    qtableCompression: {
      maxEntries: 5000,           // prune when exceeding this
      pruneTarget: 4000,          // reduce to this count
      minVisits: 2,               // entries with fewer visits get pruned first
    },

    // --- Phase 48: Meta-Learning ---
    metaLearning: {
      windowSize: 50,             // decisions to compute stability
      stableThreshold: 0.3,       // avg |TD error| below this = stable
      unstableThreshold: 0.8,     // avg |TD error| above this = unstable
      alphaStableMul: 0.7,        // alpha multiplier in stable environments
      alphaUnstableMul: 1.4,      // alpha multiplier in unstable environments
      adaptSpeed: 0.05,           // how fast meta-alpha adapts
    },

    // --- Phase 50: Life Narrative ---
    narrative: {
      maxEntries: 100,            // max story entries
    },

    // --- Phase 51: Q-table Visualization ---
    qtableVis: {
      cellSize: 4,                // px per state cell
      maxWidth: 200,              // max vis width
      maxHeight: 150,             // max vis height
    },

    // --- Phase 52: Seasonal Sounds ---
    seasonalSound: {
      spring: { freqMul: 1.2, volMul: 1.1 },   // brighter, slightly louder
      summer: { freqMul: 1.0, volMul: 0.9 },    // warm baseline
      autumn: { freqMul: 0.85, volMul: 1.0 },   // mellower
      winter: { freqMul: 0.7, volMul: 0.8 },    // deeper, quieter
    },

    // --- Phase 53: Endocrine Model (virtual hormones) ---
    endocrine: {
      // Dopamine: reward-driven, promotes curiosity and exploration
      dopamine: {
        decayRate: 0.003,         // per frame (~5.5s half-life at 60fps)
        rewardBoost: 0.25,        // production per positive reward
        curiosityBoost: 0.05,     // trickle during curious/exploring moods
        maxLevel: 1.0,
        moodBias: { curious: 0.15, exploring: 0.12, playful: 0.1 },
      },
      // Cortisol: stress-driven, promotes flee/alert
      cortisol: {
        decayRate: 0.002,         // per frame (~5.8s half-life) — slower decay (lingers)
        stressBoost: 0.15,        // production per stress unit above 0.4
        startleBoost: 0.3,        // spike on startle events
        maxLevel: 1.0,
        moodBias: { shy: 0.12, alert: 0.15 },
        inhibitsSerotonin: 0.4,   // cortisol above this suppresses serotonin production
      },
      // Serotonin: calm/safety-driven, promotes exploitation and contentment
      serotonin: {
        decayRate: 0.0015,        // per frame (~7.7s half-life) — slowest decay
        calmBoost: 0.04,          // trickle during calm/idle moods
        safetyBoost: 0.08,        // boost when low stress + high trust
        maxLevel: 1.0,
        moodBias: { calm: 0.12, idle: 0.08 },
        inhibitsCortisol: 0.5,    // serotonin above this dampens cortisol production
      },
      // Cross-hormone modulation
      dopamineCortisolInhibition: 0.3, // high cortisol reduces dopamine production
      transitionInfluence: 0.2,        // how much hormones shift mood transition probs
      steeringInfluence: 0.15,         // how much hormones modulate steering weights
    },

    // --- Phase 54: Cognitive Aging (deeper age-dependent brain dynamics) ---
    cognitiveAging: {
      // Decision cooldown multiplier by phase (elder thinks slower)
      decisionCooldown: { hatchling: 0.7, juvenile: 0.85, adult: 1.0, mature: 1.1, elder: 1.5 },
      // Eligibility trace max entries (working memory shrinks with age)
      traceCapacity: { hatchling: 200, juvenile: 350, adult: 500, mature: 450, elder: 300 },
      // Q-value overwrite volatility (young = fast overwrite, old = resistant)
      alphaVolatility: { hatchling: 1.5, juvenile: 1.2, adult: 1.0, mature: 0.85, elder: 0.7 },
      // Exploitation bonus for known-good states (grows with maturity)
      exploitationBonus: { hatchling: 0, juvenile: 0.05, adult: 0.1, mature: 0.2, elder: 0.3 },
      // Error rate (random noise on Q-value reads — young are sloppy)
      readNoise: { hatchling: 0.15, juvenile: 0.08, adult: 0.02, mature: 0.01, elder: 0.05 },
    },

    // --- Phase 55: FABRIK Comfort Functions ---
    fabrikComfort: {
      maxBendAngle: Math.PI * 0.75,   // max bend between consecutive segments (135°)
      torsionCorrectionStrength: 0.3,  // how strongly to correct sharp bends
      tipAlignmentStrength: 0.2,       // end-effector rotation alignment during grab
    },

    // --- localStorage keys ---
    storageKeys: {
      genesis:     'lili_genesis',
      qtable:      'lili_qtable',
      position:    'lili_position',
      lastCleanup: 'lili_last_cleanup',
      visits:      'lili_visits',
      journal:     'lili_journal',
      dailyAgg:    'lili_daily',
      milestones:  'lili_milestones',
      placeMemory: 'lili_placemem',
      visitProfile:'lili_visitprof',
      domLearning: 'lili_domlearn',
      psychosom:   'lili_psychosom',
      baseline:    'lili_baseline',
      replay:      'lili_replay',
      offspring:   'lili_offspring',
      temporal:    'lili_temporal',
      temperament: 'lili_temperament',
      pageMemory:  'lili_pagemem',
      narrative:   'lili_narrative',
      endocrine:   'lili_endocrine',
    },

    // --- Phase 14: Cloud sync ---
    sync: {
      enabled: true,
      endpoint: '/api/lili',
      intervalMs: 5 * 60 * 1000,  // 5 minutes
      retryMs: 30 * 1000,         // 30s after failure
    },

    // --- Performance targets ---
    targetFps: 60,
    maxInitMs: 200,

    // --- Indexed DOM elements ---
    indexedSelectors: 'p,h1,h2,h3,h4,h5,h6,span,a,img,div',

    // --- Steering behavior tuning (age-dependent where biologically motivated) ---
    wanderDistance: { hatchling: 8,  juvenile: 25, adult: 70, mature: 55, elder: 30 },
    wanderRadius:   { hatchling: 4,  juvenile: 14, adult: 35, mature: 30, elder: 20 },
    wanderNoiseScale: 0.003,   // Simplex noise input scaling (slow organic drift)
    maxSeeAhead: 100,          // obstacle avoidance look-ahead distance
    boundaryMargin: 60,        // soft repulsion starts this far from edge
    boundaryForce: 0.6,        // max repulsion strength at edge
    arriveSlowRadius: 80,      // deceleration radius for arrive behavior
    fleeDistance: 150,         // distance within which flee activates
    evadeLookAhead: 20,        // frames ahead to predict cursor position

    // --- Pulse-glide cycle (Research #1: jet propulsion biomechanics) ---
    // Paralarva: 5.4 Hz rapid inefficient pulses, mostly vertical bobbing
    // Adult: 0.8-1.0 Hz efficient pulse-glide with separated vortex rings
    pulseFrequency:   { hatchling: 2.0, juvenile: 1.8, adult: 0.9, mature: 0.7, elder: 0.4 },
    pulsePowerRatio:  { hatchling: 0.50, juvenile: 0.40, adult: 0.30, mature: 0.28, elder: 0.25 },
    pulseSpeedBoost:  { hatchling: 1.05, juvenile: 1.20, adult: 1.6, mature: 1.4, elder: 1.1 },
    mantleContraction: { hatchling: 0.04, juvenile: 0.07, adult: 0.10, mature: 0.08, elder: 0.05 },

    // --- Movement coherence (Research #1: ontogenetic locomotion development) ---
    // Paralarva = "těžkopádný mechanický oscilátor" — erratic, turbulent, no coherent direction
    // Adult = smooth, efficient, coherent navigation with separated vortex rings
    movementCoherence: { hatchling: 0.15, juvenile: 0.4, adult: 0.8, mature: 0.9, elder: 0.95 },
    // Vertical bobbing intensity (Research #1: paralarva bobs vertically, adults glide horizontally)
    verticalBobbing:   { hatchling: 0.3, juvenile: 0.2, adult: 0.05, mature: 0.02, elder: 0.01 },
    // Directional noise injection — how much random perturbation per frame
    directionalNoise:  { hatchling: 0.12, juvenile: 0.08, adult: 0.04, mature: 0.02, elder: 0.01 },

    // --- Breathing (Research #1: idle respiratory oscillation) ---
    breathingBpm: 18,          // 18 breaths per minute at rest
    breathingAmplitude: 0.04,  // 4% of body radius (was 3%, boosted for visibility)

    // --- Seeds (Research #5: separate noise seed from RL seed) ---
    noiseSeed: 42,
    rlSeed: 137,
  };

  // =========================================================================
  // 1A — Deterministic PRNG (Research #5: reproducibility)
  // Mulberry32 — fast 32-bit PRNG, deterministic, seedable
  // =========================================================================

  function createPRNG(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Two independent PRNG streams (Research #5: separate agent vs environment randomness)
  const noiseRng = createPRNG(CFG.noiseSeed);
  const rlRng = createPRNG(CFG.rlSeed);

  // =========================================================================
  // 1B — Vec2 (Research #3: in-place ops in hot path to eliminate GC)
  // =========================================================================

  class Vec2 {
    constructor(x, y) {
      this.x = x || 0;
      this.y = y || 0;
    }

    // --- In-place (mutating) — use in hot path ---
    addIn(v) { this.x += v.x; this.y += v.y; return this; }
    subIn(v) { this.x -= v.x; this.y -= v.y; return this; }
    multIn(s) { this.x *= s; this.y *= s; return this; }
    divIn(s) { this.x /= s; this.y /= s; return this; }
    setFrom(v) { this.x = v.x; this.y = v.y; return this; }
    set(x, y) { this.x = x; this.y = y; return this; }

    normalizeIn() {
      const m = this.mag();
      if (m > 0) { this.x /= m; this.y /= m; }
      return this;
    }

    limitIn(max) {
      const msq = this.x * this.x + this.y * this.y;
      if (msq > max * max) {
        const m = Math.sqrt(msq);
        this.x = (this.x / m) * max;
        this.y = (this.y / m) * max;
      }
      return this;
    }

    // --- Pure (return new Vec2) — use outside hot path ---
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mult(s) { return new Vec2(this.x * s, this.y * s); }
    div(s) { return new Vec2(this.x / s, this.y / s); }
    copy() { return new Vec2(this.x, this.y); }
    normalize() { const m = this.mag(); return m > 0 ? new Vec2(this.x / m, this.y / m) : new Vec2(); }

    // --- Scalar queries ---
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    magSq() { return this.x * this.x + this.y * this.y; }
    dist(v) { const dx = this.x - v.x, dy = this.y - v.y; return Math.sqrt(dx * dx + dy * dy); }
    distSq(v) { const dx = this.x - v.x, dy = this.y - v.y; return dx * dx + dy * dy; }
    dot(v) { return this.x * v.x + this.y * v.y; }
  }

  // Pre-allocated scratch vectors for hot-path calculations (Research #3: zero alloc)
  const _v0 = new Vec2();
  const _v1 = new Vec2();

  // =========================================================================
  // 1C — Simplex Noise 2D (self-contained, deterministic seed)
  // Based on Stefan Gustavson's implementation, adapted for zero-dep IIFE
  // =========================================================================

  const SimplexNoise = (function () {
    // Gradient table for 2D
    const GRAD2 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1],
    ];

    function create(rng) {
      // Build permutation table from seeded PRNG
      const perm = new Uint8Array(512);
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      // Fisher-Yates shuffle with seeded RNG
      for (let i = 255; i > 0; i--) {
        const j = (rng() * (i + 1)) | 0;
        const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
      }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

      // Skew / unskew factors for 2D simplex
      const F2 = 0.5 * (Math.sqrt(3) - 1);
      const G2 = (3 - Math.sqrt(3)) / 6;

      function noise2D(xin, yin) {
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;

        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; }
        else { i1 = 0; j1 = 1; }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;

        const ii = i & 255;
        const jj = j & 255;

        let n0 = 0, n1 = 0, n2 = 0;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
          t0 *= t0;
          const g = GRAD2[perm[ii + perm[jj]] & 7];
          n0 = t0 * t0 * (g[0] * x0 + g[1] * y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
          t1 *= t1;
          const g = GRAD2[perm[ii + i1 + perm[jj + j1]] & 7];
          n1 = t1 * t1 * (g[0] * x1 + g[1] * y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
          t2 *= t2;
          const g = GRAD2[perm[ii + 1 + perm[jj + 1]] & 7];
          n2 = t2 * t2 * (g[0] * x2 + g[1] * y2);
        }

        // Scale to [-1, 1]
        return 70 * (n0 + n1 + n2);
      }

      return { noise2D };
    }

    return { create };
  })();

  // Noise instance seeded from the noise PRNG stream
  const noise = SimplexNoise.create(noiseRng);

  // =========================================================================
  // 2A — Age / life phase system (Phase 7: smooth lifecycle transitions)
  // =========================================================================

  // Ordered phase list and boundary timestamps for interpolation
  const LIFE_PHASES = ['hatchling', 'juvenile', 'adult', 'mature', 'elder'];
  const PHASE_BOUNDARIES = [
    0,
    CFG.lifePhases.hatchling,
    CFG.lifePhases.juvenile,
    CFG.lifePhases.adult,
    CFG.lifePhases.mature,
    CFG.lifePhases.elder,
  ];

  const age = {
    genesisMs: 0,        // set at boot from localStorage
    elapsedMs: 0,        // updated every frame
    phase: 'hatchling',  // current life phase string
    phaseIndex: 0,       // index in LIFE_PHASES (0–4)
    phaseProgress: 0,    // 0..1 within current phase (for smooth transitions)
    t: 0,                // normalized age 0..1 over full lifespan
  };

  // Phase transition callbacks — called once when phase changes
  const _phaseListeners = [];
  function onPhaseTransition(fn) { _phaseListeners.push(fn); }

  // Smoothstep easing for biological growth curves (S-curve, not linear)
  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // Resolve age-dependent config value with smooth interpolation.
  // Maps with all 5 phases: lerp between current and next phase values.
  // Maps with only hatchling+elder: global lerp (unchanged behavior).
  function ageVal(map) {
    if (typeof map === 'number') return map;

    // Full phase map — smooth interpolation between adjacent phases
    const cur = LIFE_PHASES[age.phaseIndex];
    const nxt = LIFE_PHASES[Math.min(age.phaseIndex + 1, 4)];
    if (map[cur] !== undefined && map[nxt] !== undefined) {
      const t = smoothstep(age.phaseProgress);
      return map[cur] + (map[nxt] - map[cur]) * t;
    }

    // Two-point map (hatchling + elder only) — global lerp
    if (map.hatchling !== undefined && map.elder !== undefined) {
      return map.hatchling + (map.elder - map.hatchling) * smoothstep(age.t);
    }

    return 0;
  }

  function updateAge() {
    age.elapsedMs = Date.now() - age.genesisMs;
    age.t = Math.min(age.elapsedMs / CFG.lifePhases.elder, 1);

    // Determine phase index and progress within current phase
    const ms = age.elapsedMs;
    let idx = 0;
    for (let i = 0; i < 5; i++) {
      if (ms >= PHASE_BOUNDARIES[i + 1]) idx = Math.min(i + 1, 4);
    }

    // Progress within current phase (0..1)
    const phaseStart = PHASE_BOUNDARIES[idx];
    const phaseEnd = PHASE_BOUNDARIES[idx + 1];
    age.phaseProgress = (phaseEnd > phaseStart)
      ? Math.min((ms - phaseStart) / (phaseEnd - phaseStart), 1)
      : 1;

    // Phase transition detection
    const prevPhase = age.phase;
    age.phaseIndex = idx;
    age.phase = LIFE_PHASES[idx];

    if (prevPhase !== age.phase) {
      for (let i = 0; i < _phaseListeners.length; i++) {
        _phaseListeners[i](prevPhase, age.phase, age.elapsedMs);
      }
    }
  }

  // =========================================================================
  // 2A — Lili state object (physics body)
  // =========================================================================

  const lili = {
    pos: new Vec2(),
    vel: new Vec2(),
    acc: new Vec2(),
    bodyR: 22,
    heading: 0,             // radians, direction of travel
    wanderAngle: 0,         // current wander target angle (noise-driven)
    pulsePhase: 0,          // 0..1 within current pulse-glide cycle
    mood: 'idle',           // active RL mood (Phase 8: Q-Learning output)
    moodIndex: 5,           // index into CFG.moods (idle=5)
    prevMood: 'idle',       // Phase 13F: previous mood for blending
    moodBlend: 1.0,         // Phase 13F: 0=prev mood, 1=current mood (lerp progress)
    stress: 0,
  };

  // =========================================================================
  // Phase 13F — Mood transition system (blend, events, history)
  // =========================================================================

  const _moodListeners = [];
  const _moodHistory = [];      // last 10 transitions: { from, to, time }
  const MAX_MOOD_HISTORY = 10;

  // Phase 13B: Blink state
  const _blink = {
    timer: 0,         // frames until next blink
    phase: 0,         // 0=open, >0 = frames into blink
    interval: CFG.blinkIntervalBase,
  };

  // Phase 13A: Smoothly blended chromatophore state (emergent from mood)
  const _chromaBlend = {
    hueShift: 0, satShift: 0, litShift: 0,
    hueDrift: 0, satPulse: 0, glowMod: 1.0,
  };

  // Phase 13C: Smoothly blended body expression
  const _bodyBlend = {
    breathMod: 1.0, bodyScale: 1.0, glowPulseHz: 0,
  };

  // Phase 13D: Smoothly blended tentacle expression
  const _tentBlend = {
    ampMod: 1.0, spreadMod: 1.0, gravMod: 1.0, noiseMod: 1.0, forwardBias: 0,
  };

  // Phase 13B: Smoothly blended eye expression
  const _eyeBlend = {
    pupilScale: 1.0, blinkRate: 1.0, squint: 0, gazeDOM: false,
  };

  // Phase 18.5: Smooth gaze tracking (pupil lerp instead of instant snap)
  const _gaze = {
    x: 0, y: 0,            // smoothed gaze target (world coords)
    initialized: false,     // first frame skip
    saccadeTimer: 0,        // frames until next saccade
    saccadeX: 0,            // current saccade offset
    saccadeY: 0,
  };

  // Phase 18: Genesis body variation (computed from genesis timestamp hash)
  const _genesis = {
    bodyXScale: 1.0,          // ±5%
    bodyYScale: 1.0,          // ±5%
    eyeSpacing: 1.0,          // ±8%
    eyeYOffset: 1.0,          // ±8%
    tentacleWidth: 1.0,       // ±10%
    headTilt: 0,              // ±2° asymmetry
    chromatophores: [],       // pre-computed cell data [{angle, phase, speed, hueOffset}]
  };

  // Phase 18: Micro-expressions (instant visual reactions, decay per frame)
  const _microExpr = {
    startle: 0,               // 0..1 intensity
    joy: 0,
    relief: 0,
    curiosityTilt: 0,
    lastStartleMs: 0,         // cooldown tracker
  };

  // Phase 18: Psychosomatic adaptation (long-term body morphology from stress/reward)
  const _psychosom = {
    stressAvg: 0.3,           // long-term average stress
    rewardAvg: 0,             // long-term average reward per decision
    sessionStressSum: 0,
    sessionStressN: 0,
    sessionRewardSum: 0,
    sessionRewardN: 0,
    // Derived modifiers (recomputed from averages)
    bodyScale: 1.0,
    lightness: 0,
    glowBoost: 1.0,
    tentSpread: 1.0,
    breathRate: 1.0,
  };

  // Phase 18: Sleep animation (REM twitch state)
  const _sleepAnim = {
    remTimer: 300,            // frames until next twitch (start delayed)
    remArm: -1,               // which tentacle is twitching (-1 = none)
    remPhase: 0,              // frames remaining in current twitch
    remOffsetX: 0,            // twitch target offset
    remOffsetY: 0,
  };

  // Phase 18G: Ambient light awareness (background sampling + adaptation)
  const _ambient = {
    lightness: 0.1,            // current sampled bg lightness (0=black, 1=white)
    targetLightness: 0.1,      // smoothed target
    adapted: 0.1,              // slowly adapted value (what Lili "sees")
    sampleTimer: 0,            // frame counter for sampling
    lastSampleLightness: 0.1,  // previous sample (for change detection)
    // Derived modifiers (applied in computeColors + renderBody)
    lightnessShift: 0,
    satShift: 0,
    glowMul: 1.0,
  };

  // Phase 25: Dream replay state
  const _dream = {
    timer: 0,                  // frames until next replay batch
    replaysThisSleep: 0,       // counter per sleep session
    sleeping: false,           // track sleep transitions
  };

  // Phase 27: Habitat awareness state
  const _habitat = {
    sampleTimer: 0,
    dominantHue: 0,            // detected page hue (0-360)
    hueShift: 0,               // current adaptation shift
    targetHueShift: 0,         // target shift (lerps toward this)
    pageType: 'unknown',       // text-heavy / image-heavy / sparse / mixed
  };

  // Phase 28: Non-verbal communication state
  const _signals = {
    // Welcome wave
    welcomeActive: false,
    welcomeFrame: 0,
    welcomeArm: 0,             // which tentacle waves
    lastCursorSeen: 0,         // timestamp when cursor was last active
    // Excitement flash
    excitementActive: false,
    excitementFrame: 0,
    excitementHueShift: 0,
    // Contentment pulse
    contentmentPhase: 0,
    calmFrames: 0,             // consecutive calm+low-stress frames
  };

  // Phase 29: Bioluminescence trail particles
  const _bioTrail = {
    particles: [],             // {x, y, life, maxLife, hue, size}
    spawnTimer: 0,
  };

  // Phase 30: Anticipation state
  const _anticipation = {
    approaching: false,         // is cursor consistently approaching?
    approachFrames: 0,          // consecutive frames of approach
    intensity: 0,               // 0..1 anticipation intensity
    prevDist: Infinity,         // previous cursor distance
  };

  // Phase 31: Energy/fatigue state
  const _energy = {
    level: 80,                  // current energy (starts slightly below max)
    fatigued: false,            // true when below lowThreshold
    critical: false,            // true when below criticalThreshold
  };

  // Phase 32: Habituation state
  const _habituation = {
    cursor: 1.0,                // cursor sensitivity (1.0 = fully sensitive, 0.15 = habituated)
    scroll: 1.0,                // scroll sensitivity
    lastNovelty: 0,             // timestamp of last novel stimulus
  };

  // Phase 33: Cognitive map
  const _cogMap = {
    cells: new Map(),           // key "cx,cy" → {safety, reward, visits}
  };

  // Phase 34: Cursor pattern recognition
  const _cursorPattern = {
    history: [],                // [{x, y, frame}]
    sampleCounter: 0,
    pattern: 'unknown',         // nervous / calm / erratic / directed / unknown
    directionChanges: 0,
  };

  // Phase 35: Attention mechanism
  const _attention = {
    weights: {},                // sensorName → attention weight (0.3..2.0)
    prevSensors: {},            // previous sensor values for change detection
  };

  // Phase 36: Temporal patterns (time-of-day learning)
  const _temporal = {
    bins: new Array(24),        // per-hour profile {stress, activity, observations}
    lastHour: -1,               // track hour changes
  };
  // Initialize temporal bins
  for (var _ti = 0; _ti < 24; _ti++) {
    _temporal.bins[_ti] = { stress: 0.3, activity: 0.5, observations: 0 };
  }

  // Phase 37: Personality drift (long-term temperament)
  const _temperament = {
    boldness: 0,                // -1..+1 axis values
    sociability: 0,
    activity: 0,
    emotionality: 0,
    moodAccum: new Float64Array(7), // mood counts in current window
    windowCount: 0,             // decisions in current window
  };

  // Phase 38: Surprise signal
  const _surprise = {
    intensity: 0,               // current surprise level (0..1)
    lastTdError: 0,             // most recent |TD error|
    alphaBoost: 1.0,            // current learning rate multiplier (decays toward 1)
  };

  // Phase 39: Ink defense
  const _inkDefense = {
    particles: [],              // [{x, y, vx, vy, r, life, maxLife, alpha}]
    lastBurstMs: 0,             // cooldown tracker
    prevStress: 0,              // for rate-of-change detection
  };

  // Phase 40: Camouflage
  const _camouflage = {
    intensity: 0,               // current camo blend (0..1, lerped)
    targetIntensity: 0,
    satShift: 0,                // current saturation shift
    litShift: 0,                // current lightness shift
  };

  // Phase 42: Mobile touch state
  const _touch = {
    startX: 0, startY: 0,
    startMs: 0,
    lastTapMs: 0,
    isDown: false,
    longPressTimer: 0,
    caressing: false,
  };

  // Phase 44: Debug overlay graph buffers
  const _debugGraphs = {
    stress: [],
    energy: [],
    reward: [],
    surprise: [],
  };

  // Phase 45: Death state
  const _death = {
    active: false,
    fadeProgress: 0,              // 0..1 (0=alive, 1=fully faded)
    lastBubbleSent: false,
  };

  // Phase 46: Page memory
  const _pageMemory = {
    pages: {},                    // urlHash → {mood, stress, visits, lastSeen}
    currentHash: '',
  };

  // Phase 48: Meta-learning
  const _metaLearn = {
    recentErrors: [],             // recent |TD errors|
    alphaMul: 1.0,                // current meta-learning rate multiplier
    stability: 'unknown',         // stable / unstable / unknown
  };

  // Phase 50: Life narrative
  const _narrative = {
    entries: [],                  // [{day, text, type}]
  };

  // Phase 49: Web Worker brain
  var _brainWorker = null;        // Worker instance (null if not available)
  var _brainWorkerReady = false;

  function onMoodChange(fn) { _moodListeners.push(fn); }

  // =========================================================================
  // 15A — Place Memory (discretized spatial grid of experience)
  // =========================================================================

  const _placeMemory = {
    grid: new Map(),   // key: "gx,gy" → value: number (positive=safe, negative=dangerous)
  };

  function _placeKey(x, y) {
    const cs = CFG.placeMemory.cellSize;
    return ((x / cs) | 0) + ',' + ((y / cs) | 0);
  }

  function placeMemoryUpdate(x, y, rewardSign) {
    const key = _placeKey(x, y);
    const cur = _placeMemory.grid.get(key) || 0;
    const next = Math.max(-CFG.placeMemory.maxValue,
      Math.min(CFG.placeMemory.maxValue, cur + rewardSign * 0.1));
    _placeMemory.grid.set(key, next);
  }

  function placeMemoryDecay() {
    const decay = CFG.placeMemory.decayRate;
    _placeMemory.grid.forEach(function (v, k) {
      const nv = v * decay;
      if (Math.abs(nv) < 0.001) _placeMemory.grid.delete(k);
      else _placeMemory.grid.set(k, nv);
    });
  }

  function placeMemoryGet(x, y) {
    return _placeMemory.grid.get(_placeKey(x, y)) || 0;
  }

  function placeMemorySerialize() {
    const entries = [];
    _placeMemory.grid.forEach(function (v, k) { entries.push([k, +v.toFixed(4)]); });
    return JSON.stringify(entries);
  }

  function placeMemoryDeserialize(json) {
    try {
      const arr = JSON.parse(json);
      _placeMemory.grid.clear();
      for (let i = 0; i < arr.length; i++) _placeMemory.grid.set(arr[i][0], arr[i][1]);
      return true;
    } catch (e) { return false; }
  }

  function placeMemorySave() {
    try { localStorage.setItem(CFG.storageKeys.placeMemory, placeMemorySerialize()); }
    catch (e) { /* */ }
  }

  function placeMemoryLoad() {
    var json = localStorage.getItem(CFG.storageKeys.placeMemory);
    if (json) return placeMemoryDeserialize(json);
    return false;
  }

  // =========================================================================
  // 15B — Day/Night Rhythm (circadian state derived from clock)
  // =========================================================================

  const _circadian = {
    activityMul: 1,    // 0..1 movement multiplier
    eyeOpenness: 1,    // 0..1 how open eyes are
    isAsleep: false,
    wakingTimer: 0,    // ms remaining of "waking stretch"
    lastHour: -1,      // detect sleep→wake transition
  };

  function updateCircadian() {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    const C = CFG.circadian;

    // Determine if currently in sleep window
    let sleeping;
    if (C.sleepStart > C.sleepEnd) {
      // e.g. 23-6: sleep if h >= 23 OR h < 6
      sleeping = h >= C.sleepStart || h < C.sleepEnd;
    } else {
      sleeping = h >= C.sleepStart && h < C.sleepEnd;
    }

    // Detect wake-up transition
    if (_circadian.isAsleep && !sleeping) {
      _circadian.wakingTimer = C.wakeStretchMs;
    }
    _circadian.isAsleep = sleeping;

    // Waking timer countdown
    if (_circadian.wakingTimer > 0) {
      _circadian.wakingTimer -= dt * 1000;
      if (_circadian.wakingTimer < 0) _circadian.wakingTimer = 0;
    }

    // Compute activity multiplier
    if (sleeping) {
      // Gradual drowsiness: lerp to nightSpeedMul over ~30 min
      _circadian.activityMul += (C.nightSpeedMul - _circadian.activityMul) * 0.002;
      _circadian.eyeOpenness += (0.05 - _circadian.eyeOpenness) * 0.003;
    } else if (_circadian.wakingTimer > 0) {
      // Waking: ramp up from sleep
      const wakeProgress = 1 - _circadian.wakingTimer / C.wakeStretchMs;
      _circadian.activityMul = C.nightSpeedMul + (1 - C.nightSpeedMul) * wakeProgress;
      _circadian.eyeOpenness = 0.05 + 0.95 * wakeProgress;
    } else {
      _circadian.activityMul += (1 - _circadian.activityMul) * 0.01;
      _circadian.eyeOpenness += (1 - _circadian.eyeOpenness) * 0.01;
    }

    _circadian.lastHour = h;
  }

  // =========================================================================
  // 15C — Visit Recognition (trust from repeated visits)
  // =========================================================================

  const _visitProfile = {
    totalVisits: 0,
    timestamps: [],       // last N visit timestamps (ms)
    trustLevel: 0,        // computed: 0..1
  };

  function computeTrust() {
    const VR = CFG.visitRecognition;
    const visits = _visitProfile.totalVisits;
    const visitFactor = Math.min(1, visits / VR.trustVisitsMax);

    // Recency: recent visits count more
    const now = Date.now();
    let recencySum = 0;
    for (let i = 0; i < _visitProfile.timestamps.length; i++) {
      const ageMs = now - _visitProfile.timestamps[i];
      recencySum += Math.pow(0.5, ageMs / VR.recencyHalfLifeMs);
    }
    const recencyFactor = Math.min(1, recencySum / 5); // 5 recent visits = full recency

    _visitProfile.trustLevel = visitFactor * (0.3 + 0.7 * recencyFactor);
  }

  function visitProfileSerialize() {
    return JSON.stringify({
      total: _visitProfile.totalVisits,
      ts: _visitProfile.timestamps,
    });
  }

  function visitProfileDeserialize(json) {
    try {
      var data = JSON.parse(json);
      _visitProfile.totalVisits = data.total || 0;
      _visitProfile.timestamps = data.ts || [];
      return true;
    } catch (e) { return false; }
  }

  function visitProfileSave() {
    try { localStorage.setItem(CFG.storageKeys.visitProfile, visitProfileSerialize()); }
    catch (e) { /* */ }
  }

  function visitProfileLoad() {
    var json = localStorage.getItem(CFG.storageKeys.visitProfile);
    if (json) return visitProfileDeserialize(json);
    return false;
  }

  // =========================================================================
  // 18A — Genesis Body Variation (deterministic hash → unique proportions)
  // =========================================================================

  function _genesisHash(seed) {
    var h = (seed ^ 0xDEADBEEF) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 0xFFFFFFFF; // 0..1
  }

  function computeGenesis(ms) {
    var G = CFG.genesis;
    _genesis.bodyXScale  = 1 + (_genesisHash(ms)     - 0.5) * G.bodyXRange;
    _genesis.bodyYScale  = 1 + (_genesisHash(ms + 1)  - 0.5) * G.bodyYRange;
    _genesis.eyeSpacing  = 1 + (_genesisHash(ms + 2)  - 0.5) * G.eyeSpacingRange;
    _genesis.eyeYOffset  = 1 + (_genesisHash(ms + 3)  - 0.5) * G.eyeYRange;
    _genesis.tentacleWidth = 1 + (_genesisHash(ms + 4) - 0.5) * G.tentacleWidthRange;
    _genesis.headTilt    = (_genesisHash(ms + 5) - 0.5) * G.headTiltRange;

    // Pre-compute chromatophore cell placement from genesis seed
    var maxCells = 8; // upper bound
    _genesis.chromatophores = [];
    for (var i = 0; i < maxCells; i++) {
      _genesis.chromatophores.push({
        angle: _genesisHash(ms + 10 + i) * Math.PI * 2,
        phase: _genesisHash(ms + 20 + i) * Math.PI * 2,
        speed: CFG.chromatophoreCells.pulseSpeedMin +
               _genesisHash(ms + 30 + i) * (CFG.chromatophoreCells.pulseSpeedMax - CFG.chromatophoreCells.pulseSpeedMin),
        hueOffset: (_genesisHash(ms + 40 + i) - 0.5) * CFG.chromatophoreCells.hueVariance * 2,
      });
    }
  }

  // =========================================================================
  // 18B — Psychosomatic Adaptation (long-term stress/reward → body morphology)
  // =========================================================================

  function psychosomRecompute() {
    var P = CFG.psychosomatic;
    var s = _psychosom.stressAvg;    // 0..1
    var r = _psychosom.rewardAvg;    // typically -2..+2
    // Stress-driven modifiers (centered on 0.3 = neutral)
    var stressDelta = s - P.defaultStress;
    _psychosom.bodyScale  = 1 + stressDelta * P.stressBodyScale;
    _psychosom.lightness  = stressDelta * P.stressLightness + Math.max(r, 0) * P.rewardLightness;
    _psychosom.glowBoost  = 1 + Math.max(stressDelta, 0) * P.stressGlowBoost;
    _psychosom.tentSpread = 1 + stressDelta * P.stressTentSpread;
    _psychosom.breathRate = 1 + Math.max(stressDelta, 0) * P.stressBreathRate;
  }

  function psychosomAccumulate(stressVal, reward) {
    _psychosom.sessionStressSum += stressVal;
    _psychosom.sessionStressN++;
    if (reward !== undefined) {
      _psychosom.sessionRewardSum += reward;
      _psychosom.sessionRewardN++;
    }
  }

  function psychosomSave() {
    // Blend session averages into long-term with exponential smoothing
    var alpha = CFG.psychosomatic.blendAlpha;
    if (_psychosom.sessionStressN > 10) {
      var sessStress = _psychosom.sessionStressSum / _psychosom.sessionStressN;
      _psychosom.stressAvg += (sessStress - _psychosom.stressAvg) * alpha;
    }
    if (_psychosom.sessionRewardN > 5) {
      var sessReward = _psychosom.sessionRewardSum / _psychosom.sessionRewardN;
      _psychosom.rewardAvg += (sessReward - _psychosom.rewardAvg) * alpha;
    }
    try {
      localStorage.setItem(CFG.storageKeys.psychosom, JSON.stringify({
        s: +_psychosom.stressAvg.toFixed(4),
        r: +_psychosom.rewardAvg.toFixed(4),
      }));
    } catch (e) { /* */ }
  }

  function psychosomLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.psychosom);
      if (json) {
        var data = JSON.parse(json);
        _psychosom.stressAvg = data.s || CFG.psychosomatic.defaultStress;
        _psychosom.rewardAvg = data.r || 0;
      }
    } catch (e) { /* */ }
    psychosomRecompute();
  }

  // =========================================================================
  // 21 — Seasonal Awareness (date-based, modulates visuals, not state space)
  // =========================================================================

  const _season = {
    current: 'spring',       // spring / summer / autumn / winter
    hueShift: 0,
    satShift: 0,
    litShift: 0,
    speedMul: 1.0,
    lastCheck: 0,
  };

  function getSeason() {
    var d = new Date();
    var m = d.getMonth(); // 0=Jan
    // Northern hemisphere default
    if (m >= 2 && m <= 4) return 'spring';
    if (m >= 5 && m <= 7) return 'summer';
    if (m >= 8 && m <= 10) return 'autumn';
    return 'winter';
  }

  function updateSeason() {
    // Check once per minute
    var now = Date.now();
    if (now - _season.lastCheck < 60000) return;
    _season.lastCheck = now;

    _season.current = getSeason();
    var S = CFG.season;
    var target;

    // Lerp toward target values
    target = S.hueShift[_season.current] || 0;
    _season.hueShift += (target - _season.hueShift) * 0.1;
    target = S.satShift[_season.current] || 0;
    _season.satShift += (target - _season.satShift) * 0.1;
    target = S.litShift[_season.current] || 0;
    _season.litShift += (target - _season.litShift) * 0.1;
    target = S.speedMul[_season.current] || 1;
    _season.speedMul += (target - _season.speedMul) * 0.1;
  }

  // =========================================================================
  // 22 — Sound Landscape (Web Audio API, zero deps)
  // User must click Lili or press 'S' to enable (browser autoplay policy).
  // =========================================================================

  const _sound = {
    ctx: null,               // AudioContext (lazy init)
    enabled: false,
    masterGain: null,
    breathOsc: null,
    breathGain: null,
    heartOsc: null,
    heartGain: null,
    lastBubbleMs: 0,
    // Phase 53: Endocrine harmonic oscillators
    dopaOsc: null, dopaGain: null,   // dopamine: bright harmonic
    cortOsc: null, cortGain: null,   // cortisol: dissonant harmonic
    seroOsc: null, seroGain: null,   // serotonin: pure harmonic
  };

  function soundInit() {
    if (_sound.ctx) return;
    try {
      _sound.ctx = new (window.AudioContext || window.webkitAudioContext)();
      _sound.masterGain = _sound.ctx.createGain();
      _sound.masterGain.gain.value = CFG.sound.masterVolume;
      _sound.masterGain.connect(_sound.ctx.destination);

      // Breathing drone — low frequency oscillator
      _sound.breathOsc = _sound.ctx.createOscillator();
      _sound.breathOsc.type = 'sine';
      _sound.breathOsc.frequency.value = CFG.sound.breathFreq;
      _sound.breathGain = _sound.ctx.createGain();
      _sound.breathGain.gain.value = 0;
      _sound.breathOsc.connect(_sound.breathGain);
      _sound.breathGain.connect(_sound.masterGain);
      _sound.breathOsc.start();

      // Phase 53: Endocrine harmonic oscillators
      // Dopamine harmonic — bright major 5th (×1.5 freq), triangle wave
      _sound.dopaOsc = _sound.ctx.createOscillator();
      _sound.dopaOsc.type = 'triangle';
      _sound.dopaOsc.frequency.value = CFG.sound.breathFreq * 3;
      _sound.dopaGain = _sound.ctx.createGain();
      _sound.dopaGain.gain.value = 0;
      _sound.dopaOsc.connect(_sound.dopaGain);
      _sound.dopaGain.connect(_sound.masterGain);
      _sound.dopaOsc.start();

      // Cortisol harmonic — tritone dissonance (×1.414 freq), sawtooth
      _sound.cortOsc = _sound.ctx.createOscillator();
      _sound.cortOsc.type = 'sawtooth';
      _sound.cortOsc.frequency.value = CFG.sound.breathFreq * 1.414;
      _sound.cortGain = _sound.ctx.createGain();
      _sound.cortGain.gain.value = 0;
      _sound.cortOsc.connect(_sound.cortGain);
      _sound.cortGain.connect(_sound.masterGain);
      _sound.cortOsc.start();

      // Serotonin harmonic — pure octave (×2 freq), sine wave
      _sound.seroOsc = _sound.ctx.createOscillator();
      _sound.seroOsc.type = 'sine';
      _sound.seroOsc.frequency.value = CFG.sound.breathFreq * 2;
      _sound.seroGain = _sound.ctx.createGain();
      _sound.seroGain.gain.value = 0;
      _sound.seroOsc.connect(_sound.seroGain);
      _sound.seroGain.connect(_sound.masterGain);
      _sound.seroOsc.start();

      _sound.enabled = true;
      console.info('[Lili] Sound: enabled');
    } catch (e) {
      console.warn('[Lili] Sound: Web Audio API not available');
    }
  }

  function soundToggle() {
    if (!_sound.enabled) {
      soundInit();
      return _sound.enabled;
    }
    if (_sound.ctx.state === 'suspended') {
      _sound.ctx.resume();
    } else {
      _sound.ctx.suspend();
    }
    return _sound.ctx.state === 'running';
  }

  function soundUpdateBreathing() {
    if (!_sound.enabled || !_sound.breathGain) return;
    // Breathing volume follows body breathing cycle
    var breathCycle = Math.sin(Date.now() * 0.001 * CFG.breathingBpm / 60 * Math.PI * 2);
    var vol = 0.02 + (breathCycle + 1) * 0.03; // 0.02 to 0.08
    // Mood modulation
    if (lili.mood === 'calm' || lili.mood === 'idle') vol *= 1.3;
    if (lili.mood === 'alert') vol *= 0.5;
    if (_circadian.isAsleep) vol *= 1.5;
    _sound.breathGain.gain.value = vol;

    // Frequency shifts with stress
    _sound.breathOsc.frequency.value = CFG.sound.breathFreq + stress * 30;

    // Phase 53: Endocrine harmonic modulation
    // Each hormone drives its own harmonic layer — creates rich spectral landscape
    var baseFreq = CFG.sound.breathFreq + stress * 30;

    if (_sound.dopaGain) {
      // Dopamine: bright major 5th harmonic, volume proportional to dopamine level
      // High dopamine = curious/playful = brighter sound
      _sound.dopaOsc.frequency.value = baseFreq * 3 + _hormones.dopamine * 20;
      _sound.dopaGain.gain.value = _hormones.dopamine * 0.015 * (breathCycle * 0.3 + 0.7);
    }

    if (_sound.cortGain) {
      // Cortisol: tritone dissonance, volume proportional to cortisol level
      // High cortisol = stressed/fearful = harsh, unsettling overtone
      _sound.cortOsc.frequency.value = baseFreq * 1.414 + _hormones.cortisol * 15;
      _sound.cortGain.gain.value = _hormones.cortisol * 0.012;
    }

    if (_sound.seroGain) {
      // Serotonin: pure octave harmonic, volume proportional to serotonin level
      // High serotonin = calm/content = warm, consonant undertone
      _sound.seroOsc.frequency.value = baseFreq * 2;
      _sound.seroGain.gain.value = _hormones.serotonin * 0.018 * (breathCycle * 0.2 + 0.8);
    }
  }

  function soundBubblePop() {
    if (!_sound.enabled || !_sound.ctx) return;
    var now = Date.now();
    if (now - _sound.lastBubbleMs < 500) return; // rate limit
    _sound.lastBubbleMs = now;

    var osc = _sound.ctx.createOscillator();
    var gain = _sound.ctx.createGain();
    var freqs = CFG.sound.bubbleFreq;
    osc.frequency.value = freqs[Math.floor(Math.random() * freqs.length)];
    osc.type = 'sine';
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(_sound.masterGain);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, _sound.ctx.currentTime + 0.15);
    osc.stop(_sound.ctx.currentTime + 0.2);
  }

  function soundInkSplash() {
    if (!_sound.enabled || !_sound.ctx) return;
    // White noise burst
    var bufSize = _sound.ctx.sampleRate * 0.08;
    var buf = _sound.ctx.createBuffer(1, bufSize, _sound.ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    var src = _sound.ctx.createBufferSource();
    src.buffer = buf;
    var gain = _sound.ctx.createGain();
    gain.gain.value = 0.06;
    src.connect(gain);
    gain.connect(_sound.masterGain);
    src.start();
    gain.gain.exponentialRampToValueAtTime(0.001, _sound.ctx.currentTime + 0.1);
  }

  // =========================================================================
  // 24 — Offspring / Generational Learning
  // After mature phase: Lili can "reproduce". Offspring inherits partial
  // Q-table with mutation. Enables evolutionary + ontogenetic axes.
  // =========================================================================

  const _offspring = {
    count: 0,               // how many offspring created this lifetime
    history: [],            // { timestamp, genesis, inherited Q-states }
  };

  function offspringCanReproduce() {
    var minPhaseIdx = LIFE_PHASES.indexOf(CFG.offspring.minPhase);
    if (minPhaseIdx < 0) minPhaseIdx = 3; // default to mature
    return age.phaseIndex >= minPhaseIdx && _offspring.count < CFG.offspring.maxOffspring;
  }

  function offspringCreate() {
    if (!offspringCanReproduce()) {
      console.warn('[Lili] Offspring: not eligible (phase=' + age.phase +
        ', count=' + _offspring.count + '/' + CFG.offspring.maxOffspring + ')');
      return null;
    }

    // Create offspring Q-table: random subset of parent entries + mutation
    var childEntries = [];
    var inheritRate = CFG.offspring.qTableInheritance;
    var noise = CFG.offspring.mutationNoise;

    _qtable.forEach(function (q, key) {
      if (Math.random() < inheritRate) {
        var childQ = new Float64Array(MOOD_COUNT);
        for (var i = 0; i < MOOD_COUNT; i++) {
          // Gaussian mutation: Box-Muller transform
          var u1 = Math.random(), u2 = Math.random();
          var gaussian = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
          childQ[i] = q[i] + gaussian * noise;
        }
        childEntries.push([key, Array.from(childQ)]);
      }
    });

    var childGenesis = Date.now();
    var childData = {
      format: 'lili_offspring_v1',
      parentGenesis: age.genesisMs,
      childGenesis: childGenesis,
      parentPhase: age.phase,
      parentDecisions: _decision.totalDecisions,
      inheritedStates: childEntries.length,
      totalParentStates: _qtable.size,
      brain: {
        v: 2,
        stateVersion: CFG.stateSpace.version,
        mood: 5, // start idle
        decisions: 0,
        reward: 0,
        entries: childEntries,
        visitCounts: [],
        stateVisits: [],
      },
    };

    _offspring.count++;
    _offspring.history.push({
      ts: childGenesis,
      inherited: childEntries.length,
    });

    // Save offspring count
    try {
      localStorage.setItem(CFG.storageKeys.offspring, JSON.stringify({
        count: _offspring.count,
        history: _offspring.history,
      }));
    } catch (e) { /**/ }

    // Download as JSON
    var blob = new Blob([JSON.stringify(childData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'lili_offspring_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.info('[Lili] Offspring created: ' + childEntries.length + '/' +
      _qtable.size + ' Q-states inherited, noise=' + noise);

    // Journal milestone
    _journal.milestones.push({
      type: 'offspring',
      ts: childGenesis,
      inherited: childEntries.length,
      total: _qtable.size,
      count: _offspring.count,
    });

    return childData;
  }

  function offspringLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.offspring);
      if (json) {
        var data = JSON.parse(json);
        _offspring.count = data.count || 0;
        _offspring.history = data.history || [];
      }
    } catch (e) { /**/ }
  }

  // =========================================================================
  // 25 — Dream Replay (experience replay during sleep consolidation)
  // DQN-inspired: replay significant past experiences through brainLearn
  // during circadian sleep to consolidate learning.
  // =========================================================================

  function dreamReplay() {
    if (!_circadian.isAsleep) {
      if (_dream.sleeping) {
        // Just woke up — reset counter
        _dream.sleeping = false;
        if (_dream.replaysThisSleep > 0) {
          console.info('[Lili] Dream session ended: ' + _dream.replaysThisSleep + ' experiences replayed');
        }
      }
      return;
    }

    if (!_dream.sleeping) {
      // Just fell asleep
      _dream.sleeping = true;
      _dream.replaysThisSleep = 0;
      _dream.timer = CFG.dream.replayInterval;
    }

    if (_dream.replaysThisSleep >= CFG.dream.maxPerSleep) return;

    _dream.timer--;
    if (_dream.timer > 0) return;
    _dream.timer = CFG.dream.replayInterval;

    // Sample random experiences from ring buffer
    var buf = _journal.ringBuffer;
    if (buf.length < 20) return; // not enough memories to dream

    var batch = Math.min(CFG.dream.batchSize, buf.length - 1);
    var savedAlpha = CFG.rl.alpha;
    CFG.rl.alpha *= CFG.dream.alphaScale; // slower learning during dreams

    for (var i = 0; i < batch; i++) {
      // Prioritize high-magnitude reward experiences (memorable events)
      var idx;
      if (Math.random() < 0.6) {
        // Weighted toward high |reward| experiences
        var best = 0, bestR = 0;
        for (var tries = 0; tries < 10; tries++) {
          var cand = Math.floor(Math.random() * (buf.length - 1));
          if (Math.abs(buf[cand].reward) > bestR) {
            bestR = Math.abs(buf[cand].reward);
            best = cand;
          }
        }
        idx = best;
      } else {
        idx = Math.floor(Math.random() * (buf.length - 1));
      }

      var exp = buf[idx];
      var nextExp = buf[Math.min(idx + 1, buf.length - 1)];
      if (exp.state >= 0 && nextExp.state >= 0) {
        brainLearn(exp.state, exp.mood, exp.reward, nextExp.state);
      }
    }

    CFG.rl.alpha = savedAlpha;
    _dream.replaysThisSleep += batch;
  }

  // =========================================================================
  // 18C — Micro-expressions (instant visual reactions to events)
  // =========================================================================

  function triggerMicroExpr(type) {
    if (type === 'startle') {
      var now = Date.now();
      if (now - _microExpr.lastStartleMs < CFG.microExpr.startleCooldownMs) return;
      _microExpr.lastStartleMs = now;
      endocrineOnStartle(); // Phase 53: startle → cortisol spike
    }
    _microExpr[type] = 1.0;
  }

  function updateMicroExpr() {
    var M = CFG.microExpr;
    _microExpr.startle      *= (1 - M.startleDecay);
    _microExpr.joy           *= (1 - M.joyDecay);
    _microExpr.relief        *= (1 - M.reliefDecay);
    _microExpr.curiosityTilt *= (1 - M.curiosityDecay);
    if (_microExpr.startle < 0.01)      _microExpr.startle = 0;
    if (_microExpr.joy < 0.01)          _microExpr.joy = 0;
    if (_microExpr.relief < 0.01)       _microExpr.relief = 0;
    if (_microExpr.curiosityTilt < 0.01) _microExpr.curiosityTilt = 0;
  }

  // =========================================================================
  // 18D — Sleep Animation (REM twitch management)
  // =========================================================================

  function updateSleepAnim() {
    if (!_circadian.isAsleep) {
      _sleepAnim.remArm = -1;
      _sleepAnim.remPhase = 0;
      return;
    }
    var SA = CFG.sleepAnim;
    // REM twitch timer
    if (_sleepAnim.remPhase > 0) {
      _sleepAnim.remPhase--;
      if (_sleepAnim.remPhase <= 0) _sleepAnim.remArm = -1;
    } else {
      _sleepAnim.remTimer--;
      if (_sleepAnim.remTimer <= 0) {
        // Fire a twitch on a random tentacle
        _sleepAnim.remArm = Math.floor(Math.random() * TENT_N);
        _sleepAnim.remPhase = SA.remTwitchDuration;
        var angle = Math.random() * Math.PI * 2;
        _sleepAnim.remOffsetX = Math.cos(angle) * SA.remTwitchAmplitude;
        _sleepAnim.remOffsetY = Math.sin(angle) * SA.remTwitchAmplitude;
        _sleepAnim.remTimer = SA.remIntervalMin +
          Math.floor(Math.random() * (SA.remIntervalMax - SA.remIntervalMin));
      }
    }
  }

  // =========================================================================
  // 18G — Ambient Light Awareness (background color → adaptation)
  // Real octopuses have photoreceptors in their skin — they react to light
  // changes even without eyes. Lili samples the page background.
  // =========================================================================

  function _sampleBgLightness() {
    // Sample background-color from body, fallback to html, fallback to dark
    try {
      var el = document.body;
      var bg = getComputedStyle(el).backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
        el = document.documentElement;
        bg = getComputedStyle(el).backgroundColor;
      }
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return 0.05;
      // Parse rgb(r,g,b) or rgba(r,g,b,a)
      var m = bg.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!m) return 0.05;
      var r = parseInt(m[1]) / 255;
      var g = parseInt(m[2]) / 255;
      var b = parseInt(m[3]) / 255;
      // Relative luminance (perceived brightness)
      return 0.299 * r + 0.587 * g + 0.114 * b;
    } catch (e) { return 0.05; }
  }

  function updateAmbient() {
    var A = CFG.ambient;
    _ambient.sampleTimer++;
    if (_ambient.sampleTimer < A.sampleIntervalFrames) return;
    _ambient.sampleTimer = 0;

    // Sample current background
    var sampled = _sampleBgLightness();
    _ambient.targetLightness = sampled;

    // Detect sudden theme change (big lightness jump)
    var delta = Math.abs(sampled - _ambient.lastSampleLightness);
    if (delta > A.changeThreshold) {
      // Theme changed! Stress spike + startle + habituation reset
      stress = Math.min(1, stress + A.stressSpike);
      lili.stress = stress;
      triggerMicroExpr('startle');
      habituationNovelty(); // Phase 32: novel stimulus resets habituation
      console.info('[Lili] Theme change detected: ' +
        _ambient.lastSampleLightness.toFixed(2) + ' → ' + sampled.toFixed(2));
    }
    _ambient.lastSampleLightness = sampled;

    // Slowly adapt to new ambient (chromatophore adaptation)
    _ambient.adapted += (sampled - _ambient.adapted) * A.adaptSpeed;
    _ambient.lightness = sampled;

    // Compute contrast modifiers based on adapted lightness
    var neutral = A.neutralLightness;
    if (_ambient.adapted > 0.5) {
      // Light background: darken Lili for contrast
      var factor = (_ambient.adapted - 0.5) * 2; // 0..1
      _ambient.lightnessShift = A.lightBgLightnessShift * factor;
      _ambient.satShift = A.lightBgSatShift * factor;
      _ambient.glowMul = 1 + (A.lightBgGlowDampen - 1) * factor;
    } else {
      // Dark background: brighten Lili, boost glow
      var factor = (0.5 - _ambient.adapted) * 2; // 0..1
      _ambient.lightnessShift = A.darkBgLightnessBoost * factor;
      _ambient.satShift = A.darkBgSatBoost * factor;
      _ambient.glowMul = 1 + (A.darkBgGlowBoost - 1) * factor;
    }
  }

  // =========================================================================
  // 27 — Habitat Awareness (page color palette adaptation)
  // Lili detects the dominant color of her page and subtly adapts her hue.
  // =========================================================================

  function _samplePageHue() {
    try {
      var el = document.body;
      var bg = getComputedStyle(el).backgroundColor;
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') {
        el = document.documentElement;
        bg = getComputedStyle(el).backgroundColor;
      }
      if (!bg || bg === 'transparent' || bg === 'rgba(0, 0, 0, 0)') return -1;
      var m = bg.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (!m) return -1;
      var r = parseInt(m[1]) / 255, g = parseInt(m[2]) / 255, b = parseInt(m[3]) / 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      // Skip near-gray backgrounds (low saturation)
      if (max - min < 0.08) return -1;
      var h;
      if (max === r) h = ((g - b) / (max - min)) % 6;
      else if (max === g) h = (b - r) / (max - min) + 2;
      else h = (r - g) / (max - min) + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
      return h;
    } catch (e) { return -1; }
  }

  function updateHabitat() {
    _habitat.sampleTimer++;
    if (_habitat.sampleTimer < CFG.habitat.sampleIntervalFrames) return;
    _habitat.sampleTimer = 0;

    var hue = _samplePageHue();
    if (hue >= 0) {
      _habitat.dominantHue = hue;
      // Compute complementary shift: move Lili's hue toward a harmonious offset
      var baseHue = ageVal(CFG.baseHue);
      var diff = hue - baseHue;
      // Normalize to -180..180
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      // Lili shifts toward an analogous color (+30° offset from page hue)
      _habitat.targetHueShift = Math.max(-CFG.habitat.maxHueShift,
        Math.min(CFG.habitat.maxHueShift, diff * 0.15));
    }

    // Lerp toward target
    _habitat.hueShift += (_habitat.targetHueShift - _habitat.hueShift) * CFG.habitat.hueAdaptSpeed;

    // Detect page type from spatial hash density
    var totalEls = spatialHash.grid.size;
    if (totalEls < 5) _habitat.pageType = 'sparse';
    else if (totalEls < 20) _habitat.pageType = 'mixed';
    else _habitat.pageType = 'dense';
  }

  // =========================================================================
  // 28 — Non-verbal Communication (chromatophore signals + tentacle gestures)
  // Visual signaling of internal state without text.
  // =========================================================================

  function signalUpdate() {
    var S = CFG.signals;

    // Welcome wave: when mouse returns after long absence
    if (mouse.active) {
      if (!_signals.welcomeActive && _signals.lastCursorSeen > 0 &&
          Date.now() - _signals.lastCursorSeen > S.welcomeWaveDelay) {
        _signals.welcomeActive = true;
        _signals.welcomeFrame = 0;
        _signals.welcomeArm = Math.floor(Math.random() * TENT_N);
      }
      _signals.lastCursorSeen = Date.now();
    } else if (_signals.lastCursorSeen === 0) {
      _signals.lastCursorSeen = Date.now();
    }

    // Advance welcome wave
    if (_signals.welcomeActive) {
      _signals.welcomeFrame++;
      if (_signals.welcomeFrame >= S.welcomeWaveDuration) {
        _signals.welcomeActive = false;
      }
    }

    // Excitement flash: triggered from computeReward when reward > threshold
    if (_signals.excitementActive) {
      _signals.excitementFrame++;
      var t = _signals.excitementFrame / S.excitementFlashDuration;
      _signals.excitementHueShift = Math.sin(t * Math.PI * 4) * 30 * (1 - t);
      if (_signals.excitementFrame >= S.excitementFlashDuration) {
        _signals.excitementActive = false;
        _signals.excitementHueShift = 0;
      }
    }

    // Contentment pulse: calm mood + low stress for sustained period
    if (lili.mood === 'calm' && stress < 0.2) {
      _signals.calmFrames++;
    } else {
      _signals.calmFrames = Math.max(0, _signals.calmFrames - 2);
    }
    if (_signals.calmFrames > S.contentmentMinCalm) {
      _signals.contentmentPhase += S.contentmentPulseSpeed;
    } else {
      _signals.contentmentPhase *= 0.95; // fade out
    }
  }

  function signalTriggerExcitement() {
    _signals.excitementActive = true;
    _signals.excitementFrame = 0;
  }

  // =========================================================================
  // 29 — Enhanced Bioluminescence (night-time glow effects)
  // =========================================================================

  function updateBioTrail() {
    var B = CFG.biolum;
    var isNight = _circadian.isAsleep || (new Date().getHours() >= 22 || new Date().getHours() < 6);
    var darkBg = _ambient.adapted < 0.35;

    // Spawn trail particles when moving at night/dark
    if ((isNight || darkBg) && lili.vel.magSq() > 0.5) {
      _bioTrail.spawnTimer++;
      if (_bioTrail.spawnTimer >= B.trailSpawnInterval && _bioTrail.particles.length < B.trailMaxParticles) {
        _bioTrail.spawnTimer = 0;
        _bioTrail.particles.push({
          x: lili.pos.x + (Math.random() - 0.5) * lili.bodyR,
          y: lili.pos.y + (Math.random() - 0.5) * lili.bodyR,
          life: B.trailLifespan,
          maxLife: B.trailLifespan,
          hue: ageVal(CFG.baseHue) + (Math.random() - 0.5) * 30,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    } else {
      _bioTrail.spawnTimer = 0;
    }

    // Age particles
    for (var i = _bioTrail.particles.length - 1; i >= 0; i--) {
      _bioTrail.particles[i].life--;
      _bioTrail.particles[i].y -= 0.15; // slow upward drift
      if (_bioTrail.particles[i].life <= 0) {
        _bioTrail.particles.splice(i, 1);
      }
    }
  }

  function renderBioTrail() {
    if (_bioTrail.particles.length === 0) return;
    for (var i = 0; i < _bioTrail.particles.length; i++) {
      var p = _bioTrail.particles[i];
      var alpha = (p.life / p.maxLife) * 0.6;
      var r = p.size * (0.5 + 0.5 * p.life / p.maxLife);
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      glow.addColorStop(0, 'hsla(' + p.hue + ', 80%, 70%, ' + alpha + ')');
      glow.addColorStop(0.5, 'hsla(' + p.hue + ', 70%, 60%, ' + (alpha * 0.4) + ')');
      glow.addColorStop(1, 'hsla(' + p.hue + ', 60%, 50%, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // 30 — Anticipation (predictive pre-reaction to approaching stimuli)
  // =========================================================================

  function updateAnticipation() {
    if (!mouse.active) {
      _anticipation.intensity *= (1 - CFG.anticipation.relaxRate);
      _anticipation.approachFrames = 0;
      _anticipation.approaching = false;
      return;
    }

    var dx = lili.pos.x - mouse.pos.x;
    var dy = lili.pos.y - mouse.pos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    // Detect approach: distance decreasing + within detection range
    if (dist < CFG.anticipation.approachDetectDistance && dist < _anticipation.prevDist - 0.5) {
      _anticipation.approachFrames++;
    } else {
      _anticipation.approachFrames = Math.max(0, _anticipation.approachFrames - 2);
    }
    _anticipation.prevDist = dist;

    if (_anticipation.approachFrames >= CFG.anticipation.approachFrames) {
      _anticipation.approaching = true;
      // Intensity scales with how close and how fast
      var closeness = 1 - (dist / CFG.anticipation.approachDetectDistance);
      var target = Math.min(1, closeness * 1.5);
      _anticipation.intensity += (target - _anticipation.intensity) * 0.1;
    } else {
      _anticipation.approaching = false;
      _anticipation.intensity *= (1 - CFG.anticipation.relaxRate);
    }
  }

  // =========================================================================
  // 31 — Energy / Fatigue (activity budget creates natural rhythms)
  // =========================================================================

  function updateEnergy() {
    var E = CFG.energy;

    // Regeneration
    if (_circadian.isAsleep) {
      _energy.level = Math.min(E.max, _energy.level + E.sleepRegenRate);
    } else if (lili.mood === 'idle' || lili.mood === 'calm') {
      _energy.level = Math.min(E.max, _energy.level + E.regenRate);
    }

    // Movement cost
    var speed = lili.vel.mag();
    if (speed > 0.3) {
      _energy.level = Math.max(0, _energy.level - E.moveCost * speed);
    }

    // Thresholds
    _energy.fatigued = _energy.level < E.lowThreshold;
    _energy.critical = _energy.level < E.criticalThreshold;
  }

  function energyOnDecision(wasExploratory) {
    _energy.level = Math.max(0, _energy.level - CFG.energy.decisionCost);
    if (wasExploratory) {
      _energy.level = Math.max(0, _energy.level - CFG.energy.explorationCost);
    }
  }

  // =========================================================================
  // 32 — Habituation (repeated stimuli → decreased response)
  // =========================================================================

  function updateHabituation() {
    var H = CFG.habituation;

    // Cursor habituation: decays when cursor is active (becoming used to it)
    if (mouse.active && mouse.speed > 0.5) {
      _habituation.cursor = Math.max(H.minSensitivity,
        _habituation.cursor - H.cursorDecayRate);
    } else {
      // Recover when cursor absent/still
      _habituation.cursor = Math.min(1.0,
        _habituation.cursor + H.cursorRecoveryRate);
    }

    // Scroll habituation
    if (scrollActive) {
      _habituation.scroll = Math.max(H.minSensitivity,
        _habituation.scroll - H.scrollDecayRate);
    } else {
      _habituation.scroll = Math.min(1.0,
        _habituation.scroll + H.scrollRecoveryRate);
    }
  }

  function habituationNovelty() {
    // Called on novel stimulus (theme change, new DOM elements, etc.)
    _habituation.cursor = Math.min(1.0, _habituation.cursor + CFG.habituation.noveltyBoost);
    _habituation.scroll = Math.min(1.0, _habituation.scroll + CFG.habituation.noveltyBoost);
    _habituation.lastNovelty = Date.now();
  }

  // =========================================================================
  // 33 — Cognitive Map (enriched spatial memory with safety + familiarity)
  // =========================================================================

  function _cogKey(x, y) {
    var cs = CFG.cogMap.cellSize;
    return ((x / cs) | 0) + ',' + ((y / cs) | 0);
  }

  function cogMapUpdate(x, y, reward, isSafe) {
    var key = _cogKey(x, y);
    var cell = _cogMap.cells.get(key);
    if (!cell) {
      if (_cogMap.cells.size >= CFG.cogMap.maxCells) return; // at capacity
      cell = { safety: 0, reward: 0, visits: 0 };
      _cogMap.cells.set(key, cell);
    }
    cell.visits = Math.min(CFG.cogMap.maxVisits, cell.visits + 1);
    cell.safety += ((isSafe ? 1 : -1) - cell.safety) * 0.1;
    cell.reward += (reward - cell.reward) * 0.1;
  }

  function cogMapQuery(x, y) {
    var cell = _cogMap.cells.get(_cogKey(x, y));
    if (!cell) return { value: 0, familiar: false };
    var value = cell.safety * CFG.cogMap.safetyWeight +
                cell.reward * CFG.cogMap.rewardWeight +
                Math.min(cell.visits, 10) * CFG.cogMap.visitBonus;
    return { value: value, familiar: cell.visits > 3 };
  }

  function cogMapDecay() {
    var decay = CFG.cogMap.decayRate;
    _cogMap.cells.forEach(function (cell, key) {
      cell.safety *= decay;
      cell.reward *= decay;
      if (Math.abs(cell.safety) < 0.001 && Math.abs(cell.reward) < 0.001 && cell.visits < 2) {
        _cogMap.cells.delete(key);
      }
    });
  }

  // =========================================================================
  // 34 — Cursor Pattern Recognition (nervous vs calm visitor detection)
  // =========================================================================

  function updateCursorPattern() {
    var CP = CFG.cursorPattern;
    _cursorPattern.sampleCounter++;
    if (_cursorPattern.sampleCounter < CP.sampleInterval) return;
    _cursorPattern.sampleCounter = 0;

    if (!mouse.active) {
      _cursorPattern.pattern = 'unknown';
      return;
    }

    _cursorPattern.history.push({
      x: mouse.pos.x, y: mouse.pos.y, frame: frameCount
    });

    // Keep window limited
    while (_cursorPattern.history.length > CP.historyLength) {
      _cursorPattern.history.shift();
    }

    if (_cursorPattern.history.length < 10) {
      _cursorPattern.pattern = 'unknown';
      return;
    }

    // Count direction changes (sign changes in velocity)
    var changes = 0;
    var h = _cursorPattern.history;
    for (var i = 2; i < h.length; i++) {
      var dx1 = h[i - 1].x - h[i - 2].x;
      var dy1 = h[i - 1].y - h[i - 2].y;
      var dx2 = h[i].x - h[i - 1].x;
      var dy2 = h[i].y - h[i - 1].y;
      // Direction change if dot product is negative
      if (dx1 * dx2 + dy1 * dy2 < 0) changes++;
    }
    _cursorPattern.directionChanges = changes;

    // Classify
    if (changes >= CP.nervousThreshold) {
      _cursorPattern.pattern = 'nervous';
    } else if (changes <= CP.calmThreshold) {
      // Check if moving in consistent direction
      var totalDx = h[h.length - 1].x - h[0].x;
      var totalDy = h[h.length - 1].y - h[0].y;
      if (Math.sqrt(totalDx * totalDx + totalDy * totalDy) > 50) {
        _cursorPattern.pattern = 'directed';
      } else {
        _cursorPattern.pattern = 'calm';
      }
    } else {
      _cursorPattern.pattern = 'erratic';
    }
  }

  // =========================================================================
  // 35 — Attention Mechanism (context-dependent sensor weighting)
  // =========================================================================

  function updateAttention() {
    var A = CFG.attention;
    var sensorNames = ['cursorProximity', 'cursorVelocity', 'domDensity',
                       'whitespace', 'scrollState', 'timeOfDay'];

    for (var i = 0; i < sensorNames.length; i++) {
      var name = sensorNames[i];
      // Initialize if needed
      if (!_attention.weights[name]) _attention.weights[name] = 1.0;

      // Boost attention when sensor value changes
      if (_attention.prevSensors[name] !== undefined &&
          _attention.prevSensors[name] !== sensors[name]) {
        _attention.weights[name] = Math.min(A.maxWeight,
          _attention.weights[name] + A.boostOnChange);
      }

      // Decay toward baseline
      _attention.weights[name] = Math.max(A.minWeight,
        _attention.weights[name] - A.decayRate);

      _attention.prevSensors[name] = sensors[name];
    }
  }

  function attentionGetFocus() {
    // Return the sensor with highest attention weight
    var maxName = 'cursorProximity';
    var maxW = 0;
    for (var name in _attention.weights) {
      if (_attention.weights[name] > maxW) {
        maxW = _attention.weights[name];
        maxName = name;
      }
    }
    return maxName;
  }

  // =========================================================================
  // Phase 36 — Temporal Patterns (time-of-day learning)
  // =========================================================================

  function temporalUpdate() {
    var hour = new Date().getHours();
    // Detect hour change for periodic save
    if (hour !== _temporal.lastHour) {
      _temporal.lastHour = hour;
      temporalSave();
    }
    var bin = _temporal.bins[hour];
    var T = CFG.temporal;
    // Running average update
    var curActivity = (lili.vel.mag() / Math.max(ageVal(CFG.maxSpeed), 0.1));
    bin.stress = bin.stress * T.decayRate + stress * (1 - T.decayRate);
    bin.activity = bin.activity * T.decayRate + Math.min(curActivity, 1) * (1 - T.decayRate);
    bin.observations++;
  }

  function temporalGetExpectation() {
    // Returns expected stress and activity for current hour
    var hour = new Date().getHours();
    var bin = _temporal.bins[hour];
    if (bin.observations < CFG.temporal.minObservations) return null;
    return { stress: bin.stress, activity: bin.activity };
  }

  function temporalSave() {
    try {
      var data = [];
      for (var i = 0; i < 24; i++) {
        var b = _temporal.bins[i];
        data.push([
          Math.round(b.stress * 1000) / 1000,
          Math.round(b.activity * 1000) / 1000,
          b.observations
        ]);
      }
      localStorage.setItem(CFG.storageKeys.temporal, JSON.stringify(data));
    } catch (e) { /**/ }
  }

  function temporalLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.temporal);
      if (!json) return;
      var data = JSON.parse(json);
      for (var i = 0; i < 24 && i < data.length; i++) {
        _temporal.bins[i].stress = data[i][0];
        _temporal.bins[i].activity = data[i][1];
        _temporal.bins[i].observations = data[i][2] || 0;
      }
    } catch (e) { /**/ }
  }

  // =========================================================================
  // Phase 37 — Personality Drift (long-term temperament evolution)
  // =========================================================================

  function temperamentAccumulate(moodIdx) {
    _temperament.moodAccum[moodIdx]++;
    _temperament.windowCount++;

    if (_temperament.windowCount >= CFG.personalityDrift.windowSize) {
      temperamentDriftUpdate();
      // Reset window
      for (var i = 0; i < 7; i++) _temperament.moodAccum[i] = 0;
      _temperament.windowCount = 0;
    }
  }

  function temperamentDriftUpdate() {
    var PD = CFG.personalityDrift;
    var total = _temperament.windowCount || 1;
    // Compute mood proportions for this window
    var props = {};
    for (var i = 0; i < MOOD_COUNT; i++) {
      props[CFG.moods[i]] = _temperament.moodAccum[i] / total;
    }
    // Update each temperament axis
    var axes = PD.axes;
    for (var a = 0; a < axes.length; a++) {
      var axis = axes[a];
      var map = PD.moodMap[axis];
      var signal = 0;
      for (var mood in map) {
        signal += (props[mood] || 0) * map[mood];
      }
      // Drift toward signal
      _temperament[axis] += (signal - _temperament[axis]) * PD.driftRate;
      // Clamp
      _temperament[axis] = Math.max(-1, Math.min(1, _temperament[axis]));
    }
    temperamentSave();
  }

  function temperamentGetBias(moodIdx) {
    // Returns a soft bias for mood selection based on temperament
    var mood = CFG.moods[moodIdx];
    var PD = CFG.personalityDrift;
    var bias = 0;
    var axes = PD.axes;
    for (var a = 0; a < axes.length; a++) {
      var axis = axes[a];
      var map = PD.moodMap[axis];
      if (map[mood]) {
        // Positive temperament + positive mood mapping = boost
        bias += _temperament[axis] * map[mood];
      }
    }
    return Math.max(-PD.maxBias, Math.min(PD.maxBias, bias));
  }

  function temperamentSave() {
    try {
      localStorage.setItem(CFG.storageKeys.temperament, JSON.stringify({
        boldness: _temperament.boldness,
        sociability: _temperament.sociability,
        activity: _temperament.activity,
        emotionality: _temperament.emotionality,
      }));
    } catch (e) { /**/ }
  }

  function temperamentLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.temperament);
      if (!json) return;
      var data = JSON.parse(json);
      _temperament.boldness = data.boldness || 0;
      _temperament.sociability = data.sociability || 0;
      _temperament.activity = data.activity || 0;
      _temperament.emotionality = data.emotionality || 0;
    } catch (e) { /**/ }
  }

  // =========================================================================
  // Phase 38 — Surprise Signal (prediction error mechanism)
  // =========================================================================

  function surpriseOnTdError(absDelta) {
    var S = CFG.surprise;
    _surprise.lastTdError = absDelta;

    if (absDelta > S.tdErrorThreshold) {
      // Spike surprise intensity
      _surprise.intensity = Math.min(1, absDelta / 2);

      // Boost learning rate temporarily
      _surprise.alphaBoost = S.alphaBoostFactor;

      // Boost all attention weights
      for (var name in _attention.weights) {
        _attention.weights[name] = Math.min(CFG.attention.maxWeight,
          _attention.weights[name] + S.attentionBoost);
      }

      // Trigger startle micro-expression on very high surprise
      if (absDelta > S.microExprThreshold) {
        triggerMicroExpr('startle');
      }
    }
  }

  function updateSurprise() {
    // Decay surprise intensity
    _surprise.intensity *= (1 - CFG.surprise.decayRate);
    if (_surprise.intensity < 0.01) _surprise.intensity = 0;

    // Decay alpha boost toward 1.0
    _surprise.alphaBoost = 1 + (_surprise.alphaBoost - 1) * CFG.surprise.alphaBoostDecay;
    if (_surprise.alphaBoost < 1.01) _surprise.alphaBoost = 1.0;
  }

  // =========================================================================
  // Phase 39 — Ink Defense (dramatic ink burst on startle)
  // =========================================================================

  function inkDefenseTryBurst() {
    var ID = CFG.inkDefense;
    var now = Date.now();
    if (now - _inkDefense.lastBurstMs < ID.cooldownMs) return;

    // Check stress rate of change
    var stressRate = stress - _inkDefense.prevStress;
    _inkDefense.prevStress = stress;

    if (stress >= ID.stressThreshold && stressRate >= ID.stressRateThreshold) {
      _inkDefense.lastBurstMs = now;

      // Burst particles in wide spray away from cursor
      var dx = lili.pos.x - mouse.pos.x;
      var dy = lili.pos.y - mouse.pos.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var baseAngle = Math.atan2(dy / d, dx / d);

      for (var i = 0; i < ID.particleCount; i++) {
        var angle = baseAngle + (noiseRng() - 0.5) * ID.spreadAngle;
        var spd = ID.spreadSpeed * (0.5 + noiseRng() * 0.8);
        _inkDefense.particles.push({
          x: lili.pos.x + (noiseRng() - 0.5) * lili.bodyR * 0.8,
          y: lili.pos.y + (noiseRng() - 0.5) * lili.bodyR * 0.8,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          r: ID.particleMinR + noiseRng() * (ID.particleMaxR - ID.particleMinR),
          life: ID.particleLife,
          maxLife: ID.particleLife,
          alpha: ID.opacityStart,
        });
      }
      // Cap total defense particles
      while (_inkDefense.particles.length > 60) _inkDefense.particles.shift();
      soundInkSplash(); // reuse existing sound
    }
  }

  function updateInkDefense() {
    for (var i = _inkDefense.particles.length - 1; i >= 0; i--) {
      var p = _inkDefense.particles[i];
      p.life--;
      if (p.life <= 0) { _inkDefense.particles.splice(i, 1); continue; }
      // Turbulence swirl for defense ink
      var dinkT = p.life * 0.02;
      var dturbX = noise.noise2D(p.x * 0.006 + dinkT, p.y * 0.006) * 0.6;
      var dturbY = noise.noise2D(p.y * 0.006 + dinkT, p.x * 0.006 + 70) * 0.6;
      p.x += p.vx + dturbX;
      p.y += p.vy + dturbY;
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.vy -= 0.02; // slight upward drift (ink rises)
      p.alpha = (p.life / p.maxLife) * CFG.inkDefense.opacityStart;
      p.r *= 1.005; // slowly expand
    }
  }

  function renderInkDefense() {
    if (_inkDefense.particles.length === 0) return;
    for (var i = 0; i < _inkDefense.particles.length; i++) {
      var p = _inkDefense.particles[i];
      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, 'rgba(15, 10, 25, ' + (p.alpha * 0.9) + ')');
      grad.addColorStop(0.5, 'rgba(20, 12, 30, ' + (p.alpha * 0.5) + ')');
      grad.addColorStop(1, 'rgba(25, 15, 35, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // =========================================================================
  // Phase 40 — Camouflage Intensity (mood-dependent background matching)
  // =========================================================================

  function updateCamouflage() {
    var mood = lili.mood;
    var CI = CFG.camouflage;
    _camouflage.targetIntensity = CI.moodIntensity[mood] || 0.2;

    // Lerp toward target
    _camouflage.intensity += (_camouflage.targetIntensity - _camouflage.intensity) * CI.blendSpeed;

    // Compute actual shifts based on ambient background and camo intensity
    var bgLightness = _ambient.lightness; // 0..1
    var currentLit = ageVal(CFG.baseLightness);

    // Shift toward background lightness
    var litDelta = (bgLightness * 100 - currentLit);
    _camouflage.litShift = litDelta * _camouflage.intensity * CI.maxLitShift / 100;

    // Reduce saturation toward background (most backgrounds are desaturated)
    _camouflage.satShift = -_camouflage.intensity * CI.maxSatReduction;
  }

  // =========================================================================
  // Phase 41 — Growth Visualization (smooth size scaling)
  // =========================================================================

  // Phase 53: Stochastic growth noise state (Brownian perturbation)
  var _growthNoise = 0;

  function growthScale() {
    var G = CFG.growth.phaseScale;
    var phase = age.phase;
    var range = G[phase] || G.adult;
    // Smooth interpolation within current phase
    var t = age.phaseProgress;
    var base = range.start + (range.end - range.start) * t;

    // Phase 53: Stochastic Brownian perturbation — organic growth feel
    // Gaussian noise via Box-Muller, accumulated as random walk
    var u1 = Math.random(), u2 = Math.random();
    var gauss = Math.sqrt(-2 * Math.log(u1 + 0.0001)) * Math.cos(2 * Math.PI * u2);
    _growthNoise += gauss * 0.0008;          // tiny random walk step
    _growthNoise *= 0.998;                   // mean-revert (don't drift forever)
    _growthNoise = Math.max(-0.03, Math.min(0.03, _growthNoise)); // clamp ±3%

    return base + _growthNoise;
  }

  // =========================================================================
  // Phase 42 — Mobile Touch Interaction
  // =========================================================================

  function touchStart(e) {
    if (!e.touches || !e.touches[0]) return;
    var t = e.touches[0];
    _touch.startX = t.clientX;
    _touch.startY = t.clientY;
    _touch.startMs = Date.now();
    _touch.isDown = true;
    _touch.caressing = false;

    // Start long press timer
    _touch.longPressTimer = setTimeout(function () {
      if (!_touch.isDown) return;
      // Check if finger is near Lili
      var docX = _touch.startX + scrollOx;
      var docY = _touch.startY + scrollOy;
      var dx = docX - lili.pos.x;
      var dy = docY - lili.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < lili.bodyR * 4) {
        _touch.caressing = true;
        touchCaress();
      }
    }, CFG.touch.longPressMs);
  }

  function touchEnd(e) {
    var elapsed = Date.now() - _touch.startMs;
    _touch.isDown = false;
    clearTimeout(_touch.longPressTimer);

    if (_touch.caressing) {
      _touch.caressing = false;
      return;
    }

    if (elapsed < CFG.touch.tapMaxMs) {
      // Check for double tap
      var now = Date.now();
      if (now - _touch.lastTapMs < CFG.touch.doubleTapMs) {
        touchDoubleTap();
      }
      _touch.lastTapMs = now;
    }
  }

  function touchCaress() {
    // Long press near Lili = caressing → reduce stress, reward, contentment
    stress = Math.max(0, stress - CFG.touch.caressStressReduction);
    triggerMicroExpr('joy');
    // Spawn a happy bubble
    if (typeof emitBubble === 'function') emitBubble();
  }

  function touchDoubleTap() {
    // Double tap anywhere = flash debug info briefly
    if (typeof toggleDebug === 'function') toggleDebug();
  }

  // =========================================================================
  // Phase 44 — Visual Debug Overlay (in-canvas real-time graphs)
  // =========================================================================

  function debugOverlayRecord() {
    var D = CFG.debugOverlay;
    _debugGraphs.stress.push(stress);
    _debugGraphs.energy.push(_energy.level / CFG.energy.max);
    _debugGraphs.reward.push((_journal.ringBuffer.length > 0 ?
      _journal.ringBuffer[_journal.ringBuffer.length - 1].reward : 0));
    _debugGraphs.surprise.push(_surprise.intensity);

    while (_debugGraphs.stress.length > D.historyLength) _debugGraphs.stress.shift();
    while (_debugGraphs.energy.length > D.historyLength) _debugGraphs.energy.shift();
    while (_debugGraphs.reward.length > D.historyLength) _debugGraphs.reward.shift();
    while (_debugGraphs.surprise.length > D.historyLength) _debugGraphs.surprise.shift();
  }

  function renderDebugOverlay() {
    if (!_debugVisible) return;
    var D = CFG.debugOverlay;
    var x0 = W - D.graphWidth - D.margin;
    var y0 = D.margin;

    var graphs = [
      { data: _debugGraphs.stress, label: 'stress', color: '#ff6b6b', min: 0, max: 1 },
      { data: _debugGraphs.energy, label: 'energy', color: '#51cf66', min: 0, max: 1 },
      { data: _debugGraphs.reward, label: 'reward', color: '#ffd43b', min: -2, max: 2 },
      { data: _debugGraphs.surprise, label: 'surprise', color: '#cc5de8', min: 0, max: 1 },
    ];

    ctx.save();
    // Reset transform so we draw in screen space (no scroll offset)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    for (var g = 0; g < graphs.length; g++) {
      var gr = graphs[g];
      var gy = y0 + g * (D.graphHeight + D.margin);

      // Background
      ctx.fillStyle = 'rgba(0,0,0,' + D.alpha + ')';
      ctx.fillRect(x0, gy, D.graphWidth, D.graphHeight);

      // Label
      ctx.fillStyle = gr.color;
      ctx.font = '9px monospace';
      ctx.fillText(gr.label, x0 + 2, gy + 9);

      // Graph line
      if (gr.data.length < 2) continue;
      ctx.strokeStyle = gr.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var i = 0; i < gr.data.length; i++) {
        var px = x0 + (i / (D.historyLength - 1)) * D.graphWidth;
        var val = (gr.data[i] - gr.min) / (gr.max - gr.min);
        var py = gy + D.graphHeight - Math.max(0, Math.min(1, val)) * D.graphHeight;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current value text
      if (gr.data.length > 0) {
        var cur = gr.data[gr.data.length - 1];
        ctx.fillStyle = '#ccc';
        ctx.fillText(cur.toFixed(2), x0 + D.graphWidth - 30, gy + 9);
      }
    }

    ctx.restore();
  }

  // =========================================================================
  // Phase 45 — Death & Legacy (10-year lifecycle endpoint)
  // =========================================================================

  function updateDeath() {
    // Only relevant in elder phase at high progress
    if (age.phase !== 'elder') return;
    if (age.phaseProgress < CFG.death.fadeStartPhaseProgress) return;

    if (!_death.active) {
      _death.active = true;
      _journal.milestones.push({
        type: 'death_begins',
        ts: Date.now(),
        ageDays: Math.floor(age.elapsedMs / 86400000),
      });
      narrativeAdd('farewell', 'Lili begins to fade. Her movements slow, colors dim. The long journey nears its end.');
      console.info('[Lili] The end approaches...');
    }

    // Progress fade based on remaining elder progress
    var fadeRange = 1 - CFG.death.fadeStartPhaseProgress;
    _death.fadeProgress = Math.min(1, (age.phaseProgress - CFG.death.fadeStartPhaseProgress) / fadeRange);

    // Slow down
    lili.vel.multIn(CFG.death.speedDecay);

    // Final bubble
    if (_death.fadeProgress > 0.95 && !_death.lastBubbleSent) {
      _death.lastBubbleSent = true;
      _journal.milestones.push({
        type: 'death',
        ts: Date.now(),
        ageDays: Math.floor(age.elapsedMs / 86400000),
        totalDecisions: _decision.totalDecisions,
      });
      narrativeAdd('death', 'Lili is gone. ' + _decision.totalDecisions + ' decisions made. Her knowledge lives on in her offspring.');
      console.info('[Lili] Goodbye. ' + _decision.totalDecisions + ' decisions, ' +
        Math.floor(age.elapsedMs / 86400000) + ' days.');
    }
  }

  function deathAlpha() {
    // Returns alpha multiplier for rendering (1.0 = fully visible, ghostAlpha = almost gone)
    if (!_death.active) return 1.0;
    return Math.max(CFG.death.ghostAlpha, 1 - _death.fadeProgress * (1 - CFG.death.ghostAlpha));
  }

  // =========================================================================
  // Phase 46 — Page Memory (URL-based behavioral context)
  // =========================================================================

  function _pageHash(url) {
    // Simple hash of URL path (ignoring query/hash) for localStorage key
    var path = url || window.location.pathname;
    var h = 0;
    for (var i = 0; i < path.length; i++) {
      h = ((h << 5) - h + path.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(36).substring(0, CFG.pageMemory.urlHashLength);
  }

  function pageMemoryUpdate() {
    var hash = _pageMemory.currentHash;
    if (!hash) return;
    var page = _pageMemory.pages[hash] || { mood: 'calm', stress: 0.3, visits: 0, lastSeen: 0 };
    page.mood = lili.mood;
    page.stress = page.stress * 0.9 + stress * 0.1; // running avg
    page.visits++;
    page.lastSeen = Date.now();
    _pageMemory.pages[hash] = page;
  }

  function pageMemoryGetContext() {
    var hash = _pageMemory.currentHash;
    return _pageMemory.pages[hash] || null;
  }

  function pageMemorySave() {
    try {
      // Prune to maxPages (keep most recently visited)
      var entries = Object.keys(_pageMemory.pages);
      if (entries.length > CFG.pageMemory.maxPages) {
        entries.sort(function (a, b) {
          return (_pageMemory.pages[b].lastSeen || 0) - (_pageMemory.pages[a].lastSeen || 0);
        });
        var pruned = {};
        for (var i = 0; i < CFG.pageMemory.maxPages; i++) {
          pruned[entries[i]] = _pageMemory.pages[entries[i]];
        }
        _pageMemory.pages = pruned;
      }
      localStorage.setItem(CFG.storageKeys.pageMemory, JSON.stringify(_pageMemory.pages));
    } catch (e) { /**/ }
  }

  function pageMemoryLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.pageMemory);
      if (json) _pageMemory.pages = JSON.parse(json);
    } catch (e) { /**/ }
    _pageMemory.currentHash = _pageHash();
  }

  // =========================================================================
  // Phase 47 — Q-table Compression (entry pruning)
  // =========================================================================

  function qtableCompress() {
    var QC = CFG.qtableCompression;
    if (_qtable.size <= QC.maxEntries) return;

    // Collect entries with their visit counts and max Q-value
    var candidates = [];
    _qtable.forEach(function (qRow, stateIndex) {
      var visits = 0;
      var maxQ = -Infinity;
      for (var i = 0; i < MOOD_COUNT; i++) {
        var key = stateIndex + ',' + i;
        visits += (_visitCounts.get(key) || 0);
        if (qRow[i] > maxQ) maxQ = qRow[i];
      }
      candidates.push({ state: stateIndex, visits: visits, maxQ: maxQ });
    });

    // Sort: low visits first, then low maxQ (prune least useful)
    candidates.sort(function (a, b) {
      if (a.visits !== b.visits) return a.visits - b.visits;
      return Math.abs(a.maxQ) - Math.abs(b.maxQ);
    });

    // Prune to target
    var toRemove = candidates.length - QC.pruneTarget;
    for (var i = 0; i < toRemove; i++) {
      var s = candidates[i].state;
      _qtable.delete(s);
      // Also clean up visit counts and traces for this state
      for (var m = 0; m < MOOD_COUNT; m++) {
        _visitCounts.delete(s + ',' + m);
        _traces.delete(s + ',' + m);
      }
    }
    console.info('[Lili] Q-table compressed: ' + (candidates.length) + ' → ' + _qtable.size + ' entries');
  }

  // =========================================================================
  // Phase 48 — Meta-Learning (environment stability detection)
  // =========================================================================

  function metaLearnUpdate(absTdError) {
    var ML = CFG.metaLearning;
    _metaLearn.recentErrors.push(absTdError);
    while (_metaLearn.recentErrors.length > ML.windowSize) {
      _metaLearn.recentErrors.shift();
    }

    if (_metaLearn.recentErrors.length < ML.windowSize) return;

    // Compute average recent error
    var sum = 0;
    for (var i = 0; i < _metaLearn.recentErrors.length; i++) {
      sum += _metaLearn.recentErrors[i];
    }
    var avgError = sum / _metaLearn.recentErrors.length;

    // Determine stability
    var targetMul;
    if (avgError < ML.stableThreshold) {
      _metaLearn.stability = 'stable';
      targetMul = ML.alphaStableMul;
    } else if (avgError > ML.unstableThreshold) {
      _metaLearn.stability = 'unstable';
      targetMul = ML.alphaUnstableMul;
    } else {
      _metaLearn.stability = 'normal';
      targetMul = 1.0;
    }

    // Smooth adaptation
    _metaLearn.alphaMul += (targetMul - _metaLearn.alphaMul) * ML.adaptSpeed;
  }

  // =========================================================================
  // Phase 49 — Web Worker Brain (offload learning to background thread)
  // =========================================================================

  function initBrainWorker() {
    // Create inline worker from function body (single-file constraint)
    try {
      var workerCode = 'var qt=new Map(),vc=new Map(),tr=new Map();' +
        'self.onmessage=function(e){var d=e.data;' +
        'if(d.cmd==="learn"){' +
          'var ps=d.prevState,mi=d.moodIdx,r=d.reward,ns=d.newState,' +
          'g=d.gamma,l=d.lambda,mc=d.moodCount,ab=d.alphaBase,ad=d.alphaDecay,am=d.alphaMin,sb=d.surpriseBoost,mm=d.metaMul;' +
          'var qp=qt.get(ps);if(!qp){qp=new Float64Array(mc);qt.set(ps,qp);}' +
          'var qn=qt.get(ns);if(!qn){qn=new Float64Array(mc);qt.set(ns,qn);}' +
          'var mx=qn[0];for(var i=1;i<mc;i++){if(qn[i]>mx)mx=qn[i];}' +
          'var delta=r+g*mx-qp[mi];' +
          'var ck=ps+","+mi;var cv=vc.get(ck)||0;vc.set(ck,cv+1);' +
          'tr.set(ck,1.0);' +
          'var gl=g*l;var td=[];' +
          'tr.forEach(function(ev,k){' +
            'var sp=k.indexOf(",");var s=+k.substring(0,sp);var m=+k.substring(sp+1);' +
            'var vk=vc.get(k)||0;var a=Math.max(am,ab/(1+vk*ad))*sb*mm;' +
            'var qr=qt.get(s);if(!qr){qr=new Float64Array(mc);qt.set(s,qr);}' +
            'qr[m]+=a*delta*ev;var ne=ev*gl;' +
            'if(ne<0.01)td.push(k);else tr.set(k,ne);' +
          '});' +
          'for(var i=0;i<td.length;i++)tr.delete(td[i]);' +
          'self.postMessage({cmd:"learnDone",delta:Math.abs(delta)});' +
        '}else if(d.cmd==="sync"){' +
          'qt.clear();vc.clear();tr.clear();' +
          'for(var i=0;i<d.states.length;i++){' +
            'qt.set(d.states[i][0],new Float64Array(d.states[i][1]));' +
          '}' +
          'for(var i=0;i<d.visits.length;i++){' +
            'vc.set(d.visits[i][0],d.visits[i][1]);' +
          '}' +
          'self.postMessage({cmd:"syncDone"});' +
        '}else if(d.cmd==="getQ"){' +
          'var entries=[];qt.forEach(function(v,k){entries.push([k,Array.from(v)]);});' +
          'var vEntries=[];vc.forEach(function(v,k){vEntries.push([k,v]);});' +
          'self.postMessage({cmd:"qtable",states:entries,visits:vEntries});' +
        '}};';
      var blob = new Blob([workerCode], { type: 'application/javascript' });
      _brainWorker = new Worker(URL.createObjectURL(blob));
      _brainWorker.onmessage = function (e) {
        if (e.data.cmd === 'learnDone') {
          // Update meta-learning with TD error from worker
          metaLearnUpdate(e.data.delta);
        } else if (e.data.cmd === 'syncDone') {
          _brainWorkerReady = true;
        } else if (e.data.cmd === 'qtable') {
          // Sync back from worker (for save operations)
          for (var i = 0; i < e.data.states.length; i++) {
            _qtable.set(e.data.states[i][0], new Float64Array(e.data.states[i][1]));
          }
          _visitCounts.clear();
          for (var i = 0; i < e.data.visits.length; i++) {
            _visitCounts.set(e.data.visits[i][0], e.data.visits[i][1]);
          }
        }
      };
      console.info('[Lili] Brain Worker: initialized');
    } catch (e) {
      _brainWorker = null;
      console.info('[Lili] Brain Worker: not available (fallback to main thread)');
    }
  }

  function syncBrainToWorker() {
    if (!_brainWorker) return;
    var states = [];
    _qtable.forEach(function (v, k) { states.push([k, Array.from(v)]); });
    var visits = [];
    _visitCounts.forEach(function (v, k) { visits.push([k, v]); });
    _brainWorker.postMessage({ cmd: 'sync', states: states, visits: visits });
  }

  function workerLearn(prevState, moodIdx, reward, newState) {
    if (!_brainWorker || !_brainWorkerReady) return false;
    _brainWorker.postMessage({
      cmd: 'learn',
      prevState: prevState,
      moodIdx: moodIdx,
      reward: reward,
      newState: newState,
      gamma: CFG.rl.gamma,
      lambda: ageVal(CFG.rl.lambda),
      moodCount: MOOD_COUNT,
      alphaBase: CFG.rl.alpha,
      alphaDecay: CFG.rl.alphaDecayFactor,
      alphaMin: CFG.rl.alphaMin,
      surpriseBoost: _surprise.alphaBoost,
      metaMul: _metaLearn.alphaMul,
    });
    return true;
  }

  // =========================================================================
  // Phase 50 — Life Narrative (generated text diary from milestones)
  // =========================================================================

  function narrativeAdd(type, text) {
    var day = Math.floor(age.elapsedMs / 86400000);
    _narrative.entries.push({ day: day, text: text, type: type, ts: Date.now() });
    while (_narrative.entries.length > CFG.narrative.maxEntries) _narrative.entries.shift();
  }

  function narrativeFromMilestone(milestone) {
    var day = Math.floor((milestone.ts - age.genesisMs) / 86400000);
    var templates = {
      'phase_transition': function (m) { return 'Day ' + day + ': Lili entered ' + (m.to || 'a new') + ' phase. A new chapter begins.'; },
      'first_mood': function (m) { return 'Day ' + day + ': For the first time, Lili felt ' + (m.mood || 'something new') + '.'; },
      'sustained_mood': function (m) { return 'Day ' + day + ': Lili stayed ' + (m.mood || 'steady') + ' for a long time. A deep moment.'; },
      'offspring': function (m) { return 'Day ' + day + ': Lili created offspring #' + (m.count || '?') + '. Her knowledge passes on.'; },
      'death_begins': function () { return 'Day ' + day + ': The twilight begins. Lili\'s colors fade slowly.'; },
      'death': function () { return 'Day ' + day + ': Lili is gone. Her journey is complete.'; },
    };
    var fn = templates[milestone.type];
    if (fn) return fn(milestone);
    return 'Day ' + day + ': Something happened. [' + milestone.type + ']';
  }

  function narrativeGenerate() {
    // Generate full narrative from milestones
    var story = [];
    story.push('# The Life of Lili');
    story.push('');
    story.push('Born: ' + new Date(age.genesisMs).toLocaleDateString());
    story.push('');

    // Add milestone-based entries
    for (var i = 0; i < _journal.milestones.length; i++) {
      story.push(narrativeFromMilestone(_journal.milestones[i]));
    }

    // Add custom narrative entries
    for (var j = 0; j < _narrative.entries.length; j++) {
      var e = _narrative.entries[j];
      if (e.type !== 'farewell' && e.type !== 'death') {
        story.push(e.text);
      }
    }

    return story.join('\n');
  }

  function narrativeSave() {
    try {
      localStorage.setItem(CFG.storageKeys.narrative, JSON.stringify(_narrative.entries));
    } catch (e) { /**/ }
  }

  function narrativeLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.narrative);
      if (json) _narrative.entries = JSON.parse(json);
    } catch (e) { /**/ }
  }

  // =========================================================================
  // Phase 51 — Q-table Visualization (brain fingerprint heatmap)
  // =========================================================================

  function renderQtableVis() {
    if (!_debugVisible) return;
    var V = CFG.qtableVis;
    var entries = [];
    _qtable.forEach(function (qRow, stateIndex) {
      var maxQ = -Infinity, minQ = Infinity;
      for (var i = 0; i < MOOD_COUNT; i++) {
        if (qRow[i] > maxQ) maxQ = qRow[i];
        if (qRow[i] < minQ) minQ = qRow[i];
      }
      entries.push({ state: stateIndex, max: maxQ, min: minQ, range: maxQ - minQ });
    });

    if (entries.length === 0) return;

    // Sort by state index for consistent layout
    entries.sort(function (a, b) { return a.state - b.state; });

    // Global range for color mapping
    var globalMax = -Infinity, globalMin = Infinity;
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].max > globalMax) globalMax = entries[i].max;
      if (entries[i].min < globalMin) globalMin = entries[i].min;
    }
    var globalRange = globalMax - globalMin || 1;

    // Compute grid dimensions
    var cols = Math.ceil(Math.sqrt(entries.length * (V.maxWidth / V.maxHeight)));
    var rows = Math.ceil(entries.length / cols);
    var cellW = Math.min(V.cellSize, V.maxWidth / cols);
    var cellH = Math.min(V.cellSize, V.maxHeight / rows);

    var x0 = W - V.maxWidth - CFG.debugOverlay.margin;
    var y0 = CFG.debugOverlay.margin + 4 * (CFG.debugOverlay.graphHeight + CFG.debugOverlay.margin) + 12;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Label
    ctx.fillStyle = '#999';
    ctx.font = '9px monospace';
    ctx.fillText('Q-brain (' + entries.length + ' states)', x0, y0 - 2);

    for (var ei = 0; ei < entries.length; ei++) {
      var col = ei % cols;
      var row = Math.floor(ei / cols);
      var norm = (entries[ei].max - globalMin) / globalRange; // 0..1
      // Color: blue (low) → green (mid) → red (high)
      var r, g, b;
      if (norm < 0.5) {
        r = 0; g = Math.floor(norm * 2 * 255); b = Math.floor((1 - norm * 2) * 255);
      } else {
        r = Math.floor((norm - 0.5) * 2 * 255); g = Math.floor((1 - (norm - 0.5) * 2) * 255); b = 0;
      }
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',0.8)';
      ctx.fillRect(x0 + col * cellW, y0 + row * cellH, Math.max(cellW - 0.5, 1), Math.max(cellH - 0.5, 1));
    }

    ctx.restore();
  }

  // =========================================================================
  // Phase 52 — Seasonal Sounds (sound modulation by season)
  // =========================================================================

  function seasonalSoundModulate() {
    if (!_sound.enabled || !_sound.breathOsc) return;
    var season = _season.current || 'summer';
    var mod = CFG.seasonalSound[season] || CFG.seasonalSound.summer;

    // Modulate breath oscillator frequency
    var baseFreq = CFG.sound.breathFreq + stress * 30;
    _sound.breathOsc.frequency.value = baseFreq * mod.freqMul;

    // Modulate master volume
    if (_sound.masterGain) {
      _sound.masterGain.gain.value = CFG.sound.masterVolume * mod.volMul;
    }
  }

  // =========================================================================
  // 15D — DOM Structure Learning (element type preferences)
  // =========================================================================

  const _domLearning = {
    counts: { heading: 0, image: 0, link: 0, paragraph: 0, other: 0 },
    preferences: { heading: 0.2, image: 0.2, link: 0.2, paragraph: 0.2, other: 0.2 },
  };

  function domLearningTrack(el) {
    const tagName = el.tagName;
    const type = CFG.domLearning.typeMap[tagName] || 'other';
    _domLearning.counts[type]++;
    _domLearningNormalize();
  }

  function _domLearningNormalize() {
    const c = _domLearning.counts;
    let total = 0;
    for (var k in c) total += c[k];
    if (total === 0) return;
    for (var k2 in c) _domLearning.preferences[k2] = c[k2] / total;
  }

  function domLearningDecay() {
    const decay = CFG.domLearning.decayRate;
    var c = _domLearning.counts;
    for (var k in c) c[k] *= decay;
    _domLearningNormalize();
  }

  function domLearningGetPreference(el) {
    var type = CFG.domLearning.typeMap[el.tagName] || 'other';
    return _domLearning.preferences[type] || 0.2;
  }

  function domLearningSerialize() {
    return JSON.stringify(_domLearning.counts);
  }

  function domLearningDeserialize(json) {
    try {
      var data = JSON.parse(json);
      for (var k in data) {
        if (_domLearning.counts.hasOwnProperty(k)) _domLearning.counts[k] = data[k];
      }
      _domLearningNormalize();
      return true;
    } catch (e) { return false; }
  }

  function domLearningSave() {
    try { localStorage.setItem(CFG.storageKeys.domLearning, domLearningSerialize()); }
    catch (e) { /* */ }
  }

  function domLearningLoad() {
    var json = localStorage.getItem(CFG.storageKeys.domLearning);
    if (json) return domLearningDeserialize(json);
    return false;
  }

  // =========================================================================
  // 15E — Ink Secretion (defensive particle system)
  // =========================================================================

  const _ink = {
    pool: [],            // pre-allocated particle pool
    activeCount: 0,      // currently visible particles
    lastEmitMs: 0,       // timestamp of last emission
  };

  // Phase 17: Persistent ink trail marks
  const _inkTrail = { marks: [] };

  // Pre-allocate ink particle pool
  (function initInkPool() {
    for (let i = 0; i < CFG.ink.poolSize; i++) {
      _ink.pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, r: 4, born: 0, life: 0, cr: 15, cg: 12, cb: 20 });
    }
  })();

  function emitInk() {
    const now = Date.now();
    if (now - _ink.lastEmitMs < CFG.ink.cooldownMs) return;
    _ink.lastEmitMs = now;

    const IC = CFG.ink;
    // Stress-scaled emission
    const stressFactor = Math.max(0, stress - IC.stressThreshold) / (1 - IC.stressThreshold);
    const emitCount = Math.ceil(IC.emitCount * (1 + stressFactor * IC.stressEmitMultiplier));
    const spreadScale = 1 + stressFactor * (IC.stressSpreadScale - 1);
    const radiusScale = 1 + stressFactor * (IC.stressParticleScale - 1);

    // Mood-dependent ink color
    const moodColor = IC.moodInkColors[lili.mood] || IC.moodInkColors.idle;

    // Emit away from cursor
    const dx = lili.pos.x - mouse.pos.x;
    const dy = lili.pos.y - mouse.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const awayX = dx / d;
    const awayY = dy / d;

    let emitted = 0;
    for (let i = 0; i < IC.poolSize && emitted < emitCount; i++) {
      var p = _ink.pool[i];
      if (p.active) continue;
      p.active = true;
      p.x = lili.pos.x + (noiseRng() - 0.5) * lili.bodyR;
      p.y = lili.pos.y + (noiseRng() - 0.5) * lili.bodyR;
      const angle = Math.atan2(awayY, awayX) + (noiseRng() - 0.5) * 1.2;
      const spd = IC.spreadSpeed * spreadScale * (0.6 + noiseRng() * 0.8);
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.r = (IC.particleRadius.min + noiseRng() * (IC.particleRadius.max - IC.particleRadius.min)) * radiusScale;
      p.born = now;
      p.life = IC.particleLifeMs;
      p.cr = moodColor.r; p.cg = moodColor.g; p.cb = moodColor.b;
      emitted++;
    }
    _ink.activeCount += emitted;
    if (emitted > 0) soundInkSplash(); // Phase 22

    // Phase 17: Leave a trail mark
    if (IC.trailEnabled) {
      const tr = IC.trailMarkRadius;
      _inkTrail.marks.push({
        x: lili.pos.x, y: lili.pos.y,
        r: tr.min + noiseRng() * (tr.max - tr.min),
        born: now, fadeDuration: IC.trailFadeDurationMs,
        cr: moodColor.r, cg: moodColor.g, cb: moodColor.b,
      });
      if (_inkTrail.marks.length > IC.trailMaxMarks) _inkTrail.marks.shift();
    }
  }

  function updateInk() {
    if (_ink.activeCount === 0) return;
    const now = Date.now();
    let active = 0;
    for (let i = 0; i < CFG.ink.poolSize; i++) {
      var p = _ink.pool[i];
      if (!p.active) continue;
      const elapsed = now - p.born;
      if (elapsed >= p.life) { p.active = false; continue; }
      // Drift with turbulence (Perlin noise velocity field for swirling ink)
      var inkT = elapsed * 0.0015;
      var turbX = noise.noise2D(p.x * 0.008 + inkT, p.y * 0.008) * 0.35;
      var turbY = noise.noise2D(p.y * 0.008 + inkT, p.x * 0.008 + 50) * 0.35;
      p.x += p.vx + turbX;
      p.y += p.vy + turbY;
      p.vx *= 0.96;
      p.vy *= 0.96;
      active++;
    }
    _ink.activeCount = active;
  }

  function renderInk(colors) {
    const now = Date.now();

    // Phase 17: Render trail marks first (behind active particles)
    if (CFG.ink.trailEnabled) {
      for (let i = _inkTrail.marks.length - 1; i >= 0; i--) {
        const m = _inkTrail.marks[i];
        const elapsed = now - m.born;
        if (elapsed >= m.fadeDuration) { _inkTrail.marks.splice(i, 1); continue; }
        const t = elapsed / m.fadeDuration;
        const alpha = (1 - t) * (1 - t) * 0.25;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + m.cr + ',' + m.cg + ',' + m.cb + ',' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    // Active particles
    if (_ink.activeCount === 0) return;
    for (let i = 0; i < CFG.ink.poolSize; i++) {
      var p = _ink.pool[i];
      if (!p.active) continue;
      const elapsed = now - p.born;
      const t = elapsed / p.life;
      // Quadratic alpha fade (subtle, wispy)
      const alpha = (1 - t) * (1 - t) * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + t * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.cr + ',' + p.cg + ',' + p.cb + ',' + alpha.toFixed(3) + ')';
      ctx.fill();
    }
  }

  // =========================================================================
  // 16A — DOM Novelty (autonomous curiosity via reward signal)
  // =========================================================================

  const _novelty = {
    seenElements: new Map(),  // WeakRef-like key → timestamp when first seen
    seenKeys: [],             // ordered list of keys for eviction
    pendingNewRects: [],      // rects of novel elements detected by MutationObserver
  };

  // Called from MutationObserver when new elements are added to DOM
  function noveltyTrackNewElements(mutations) {
    const NC = CFG.novelty;
    const now = Date.now();
    for (let m = 0; m < mutations.length; m++) {
      const added = mutations[m].addedNodes;
      if (!added) continue;
      for (let n = 0; n < added.length; n++) {
        const el = added[n];
        if (el.nodeType !== 1) continue; // only elements
        if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') continue;
        const rect = el.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) continue; // skip tiny
        // Use a simple key: tag + position snapshot
        const key = el.tagName + '|' + Math.round(rect.left) + '|' + Math.round(rect.top);
        if (_novelty.seenElements.has(key)) continue;

        // Track as novel
        _novelty.seenElements.set(key, now);
        _novelty.seenKeys.push(key);
        _novelty.pendingNewRects.push({
          x: rect.left + (window.scrollX || 0),
          y: rect.top + (window.scrollY || 0),
          w: rect.width,
          h: rect.height,
          born: now,
        });

        // Evict old entries
        while (_novelty.seenKeys.length > NC.maxTracked) {
          const oldKey = _novelty.seenKeys.shift();
          _novelty.seenElements.delete(oldKey);
        }
      }
    }
  }

  // Decay: forget seen elements after seenDecayMs
  function noveltyDecay() {
    const now = Date.now();
    const decayMs = CFG.novelty.seenDecayMs;
    // Remove expired pending rects
    _novelty.pendingNewRects = _novelty.pendingNewRects.filter(function (r) {
      return now - r.born < decayMs;
    });
    // Remove expired seen keys
    const fresh = [];
    for (let i = 0; i < _novelty.seenKeys.length; i++) {
      const k = _novelty.seenKeys[i];
      const ts = _novelty.seenElements.get(k);
      if (ts && now - ts < decayMs) {
        fresh.push(k);
      } else {
        _novelty.seenElements.delete(k);
      }
    }
    _novelty.seenKeys = fresh;
  }

  // Check if Lili is near any novel (recently added) DOM element
  function noveltyNearBonus() {
    const NC = CFG.novelty;
    const now = Date.now();
    const px = lili.pos.x, py = lili.pos.y;
    const r2 = NC.nearRadius * NC.nearRadius;
    for (let i = _novelty.pendingNewRects.length - 1; i >= 0; i--) {
      var nr = _novelty.pendingNewRects[i];
      // Center of novel element
      var cx = nr.x + nr.w * 0.5;
      var cy = nr.y + nr.h * 0.5;
      var dx = px - cx, dy = py - cy;
      if (dx * dx + dy * dy < r2) {
        // Consume this novelty (one-time reward)
        _novelty.pendingNewRects.splice(i, 1);
        triggerMicroExpr('curiosityTilt'); // Phase 18C
        return NC.rewardBonus;
      }
    }
    return 0;
  }

  // =========================================================================
  // 16B — Bubble Communication (real underwater bubbles, no emoji)
  // State communicated via: count, size, color tint, rise speed
  // =========================================================================

  const _bubbles = {
    pool: [],
    activeCount: 0,
    lastEmitMs: 0,
  };

  // Pre-allocate bubble pool
  (function initBubblePool() {
    for (let i = 0; i < CFG.bubbles.poolSize; i++) {
      _bubbles.pool.push({
        active: false,
        x: 0, y: 0,
        born: 0,
        radius: 2,
        phase: 0,          // sway phase offset
        riseSpeedMul: 1,   // per-bubble rise speed variation
        hueShift: 0,       // mood-tinted color shift
      });
    }
  })();

  // Determine bubble visual properties from internal state
  function chooseBubbleStyle() {
    // Returns {count, sizeScale, hueShift} or null if no bubble
    if (_circadian.isAsleep) return { count: 1, sizeScale: 0.5, hueShift: -20 }; // tiny slow sleep bubbles
    if (stress > 0.7) return { count: 3, sizeScale: 0.9, hueShift: -40 }; // stressed: more, reddish
    if (lili.mood === 'playful') return { count: 2, sizeScale: 0.8, hueShift: 10 };
    if (lili.mood === 'curious' && sensors.domDensity !== 'sparse') return { count: 2, sizeScale: 0.7, hueShift: 15 };
    if (lili.mood === 'calm' && _visitProfile.trustLevel > 0.4) return { count: 1, sizeScale: 0.6, hueShift: 5 };
    if (_novelty.pendingNewRects.length > 0) return { count: 2, sizeScale: 0.7, hueShift: 20 };
    return null;
  }

  function emitBubble() {
    var now = Date.now();
    if (now - _bubbles.lastEmitMs < CFG.bubbles.cooldownMs) return;
    var style = chooseBubbleStyle();
    if (!style) return;

    var BC = CFG.bubbles;
    var emitted = 0;
    for (var i = 0; i < BC.poolSize && emitted < style.count; i++) {
      var b = _bubbles.pool[i];
      if (b.active) continue;
      b.active = true;
      b.x = lili.pos.x + (noiseRng() - 0.5) * BC.spawnRadius * 2;
      b.y = lili.pos.y - lili.bodyR * 0.6;
      b.born = now + emitted * 120; // stagger births slightly
      b.radius = BC.radiusMin + noiseRng() * (BC.radiusMax - BC.radiusMin) * style.sizeScale;
      b.phase = noiseRng() * Math.PI * 2;
      b.riseSpeedMul = 0.7 + noiseRng() * 0.6; // 0.7..1.3 variation
      b.hueShift = style.hueShift;
      emitted++;
      _bubbles.activeCount++;
    }
    if (emitted > 0) {
      _bubbles.lastEmitMs = now;
      soundBubblePop(); // Phase 22: bubble sound
    }
  }

  function updateBubbles() {
    if (_bubbles.activeCount === 0) return;
    var now = Date.now();
    var BC = CFG.bubbles;
    var active = 0;
    for (var i = 0; i < BC.poolSize; i++) {
      var b = _bubbles.pool[i];
      if (!b.active) continue;
      var elapsed = now - b.born;
      if (elapsed < 0) { active++; continue; } // staggered, not born yet
      if (elapsed >= BC.lifetimeMs) { b.active = false; continue; }
      // Rise upward with per-bubble speed
      b.y -= BC.riseSpeed * b.riseSpeedMul;
      // Gentle sway (sinusoidal)
      b.x += Math.sin(b.phase + elapsed * BC.swaySpeed) * BC.swayAmplitude * 0.015;
      // Bubbles grow slightly as they rise (pressure decrease)
      b.radius *= 1.0003;
      active++;
    }
    _bubbles.activeCount = active;
  }

  function renderBubbles() {
    if (_bubbles.activeCount === 0) return;
    var now = Date.now();
    var BC = CFG.bubbles;
    for (var i = 0; i < BC.poolSize; i++) {
      var b = _bubbles.pool[i];
      if (!b.active) continue;
      var elapsed = now - b.born;
      if (elapsed < 0) continue; // staggered, not visible yet
      var t = elapsed / BC.lifetimeMs; // 0..1
      // Fade: quick appear, slow dissolve
      var alpha = t < 0.08 ? t / 0.08 : Math.max(0, 1 - t * t);

      var r = b.radius;
      var bx = b.x, by = b.y;

      // Phase 18.5: Bubble wobble — elliptical deformation while rising
      var wobblePhase = elapsed * 0.004 + b.phase;
      var wobbleX = 1 + Math.sin(wobblePhase) * 0.12; // ±12% scaleX
      var wobbleY = 1 - Math.sin(wobblePhase) * 0.08; // inverse, ±8% scaleY

      // Bubble body: 3D sphere shading with radial gradient
      var h = (computeColors().h || 190) + b.hueShift;
      var bubbleGrad = ctx.createRadialGradient(
        bx - r * 0.2 * wobbleX, by - r * 0.25 * wobbleY, r * 0.05,
        bx, by, r * Math.max(wobbleX, wobbleY));
      bubbleGrad.addColorStop(0, 'hsla(' + h + ', 50%, 88%, ' + (alpha * 0.28) + ')');
      bubbleGrad.addColorStop(0.4, 'hsla(' + h + ', 40%, 72%, ' + (alpha * 0.18) + ')');
      bubbleGrad.addColorStop(0.8, 'hsla(' + h + ', 35%, 60%, ' + (alpha * 0.1) + ')');
      bubbleGrad.addColorStop(1, 'hsla(' + h + ', 30%, 50%, ' + (alpha * 0.04) + ')');
      ctx.beginPath();
      ctx.ellipse(bx, by, r * wobbleX, r * wobbleY, 0, 0, Math.PI * 2);
      ctx.fillStyle = bubbleGrad;
      ctx.fill();

      // Bubble rim: thin bright ring
      ctx.strokeStyle = 'hsla(' + h + ', 50%, 85%, ' + (alpha * 0.35) + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Primary specular: crescent highlight (top-left)
      var specR = r * BC.specularSize;
      ctx.beginPath();
      ctx.arc(bx - r * 0.3, by - r * 0.3, specR * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.6) + ')';
      ctx.fill();

      // Secondary specular: tiny sparkle (bottom-right, opposite)
      ctx.beginPath();
      ctx.arc(bx + r * 0.18, by + r * 0.15, specR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.25) + ')';
      ctx.fill();
    }
  }

  // =========================================================================
  // 15F — Enhanced DOM Interaction state (canvas text for grabbed elements)
  // =========================================================================

  const _enhancedDom = {
    texts: [],  // { text, tipX, tipY, armIndex }
  };

  // Blend all mood expression parameters toward current mood target
  function updateMoodBlend() {
    const rate = CFG.moodChromaBlendSpeed;
    const mood = lili.mood;

    // Advance blend timer
    if (lili.moodBlend < 1.0) {
      lili.moodBlend = Math.min(lili.moodBlend + rate, 1.0);
    }

    // 13A: Chromatophore blend
    const ct = CFG.moodChroma[mood];
    if (ct) {
      _chromaBlend.hueShift += (ct.hueShift - _chromaBlend.hueShift) * rate;
      _chromaBlend.satShift += (ct.satShift - _chromaBlend.satShift) * rate;
      _chromaBlend.litShift += (ct.litShift - _chromaBlend.litShift) * rate;
      _chromaBlend.hueDrift += (ct.hueDrift - _chromaBlend.hueDrift) * rate;
      _chromaBlend.satPulse += (ct.satPulse - _chromaBlend.satPulse) * rate;
      _chromaBlend.glowMod  += (ct.glowMod  - _chromaBlend.glowMod)  * rate;
    }

    // 13C: Body expression blend
    const bt = CFG.moodBody[mood];
    if (bt) {
      _bodyBlend.breathMod  += (bt.breathMod  - _bodyBlend.breathMod)  * rate;
      _bodyBlend.bodyScale  += (bt.bodyScale  - _bodyBlend.bodyScale)  * rate;
      _bodyBlend.glowPulseHz += (bt.glowPulseHz - _bodyBlend.glowPulseHz) * rate;
    }

    // 13D: Tentacle expression blend
    const tt = CFG.moodTentacle[mood];
    if (tt) {
      _tentBlend.ampMod     += (tt.ampMod     - _tentBlend.ampMod)     * rate;
      _tentBlend.spreadMod  += (tt.spreadMod  - _tentBlend.spreadMod)  * rate;
      _tentBlend.gravMod    += (tt.gravMod    - _tentBlend.gravMod)    * rate;
      _tentBlend.noiseMod   += (tt.noiseMod   - _tentBlend.noiseMod)   * rate;
      _tentBlend.forwardBias += (tt.forwardBias - _tentBlend.forwardBias) * rate;
    }

    // 13B: Eye expression blend
    const et = CFG.moodEye[mood];
    if (et) {
      _eyeBlend.pupilScale += (et.pupilScale - _eyeBlend.pupilScale) * rate;
      _eyeBlend.blinkRate  += (et.blinkRate  - _eyeBlend.blinkRate)  * rate;
      _eyeBlend.squint     += (et.squint     - _eyeBlend.squint)     * rate;
      _eyeBlend.gazeDOM     = et.gazeDOM;
    }

    // 13B: Blink timer
    _blink.timer--;
    if (_blink.timer <= 0 && _blink.phase === 0) {
      _blink.phase = CFG.blinkDurationFrames;
      // Next blink interval modulated by mood blink rate
      _blink.interval = CFG.blinkIntervalBase / Math.max(_eyeBlend.blinkRate, 0.1);
      _blink.timer = _blink.interval + (noise.noise2D(frameCount * 0.01, 500) * 0.3 * _blink.interval);
    }
    if (_blink.phase > 0) _blink.phase--;
  }

  // =========================================================================
  // 2A — Mouse tracking
  // =========================================================================

  const mouse = {
    pos: new Vec2(-9999, -9999),  // off-screen until first move
    prev: new Vec2(-9999, -9999),
    vel: new Vec2(),
    speed: 0,
    speedSmooth: 0,
    classification: 'still',     // still | slow | fast | aggressive
    active: false,                // has cursor ever entered viewport
  };

  function onMouseMove(e) {
    mouse.prev.setFrom(mouse.pos);
    // Convert viewport coords to document coords (Lili lives in document space)
    mouse.pos.set(e.clientX + scrollOx, e.clientY + scrollOy);
    mouse.active = true;
  }

  // Mobile: track finger position in document coords (same as mousemove for desktop)
  function onTouchMove(e) {
    if (!e.touches || !e.touches[0]) return;
    var t = e.touches[0];
    mouse.prev.setFrom(mouse.pos);
    mouse.pos.set(t.clientX + scrollOx, t.clientY + scrollOy);
    mouse.active = true;
  }

  function updateMouse() {
    if (!mouse.active) return;
    mouse.vel.set(mouse.pos.x - mouse.prev.x, mouse.pos.y - mouse.prev.y);
    mouse.speed = mouse.vel.mag();
    // Exponential moving average for smoothing
    mouse.speedSmooth += (mouse.speed - mouse.speedSmooth) * 0.15;
    const s = mouse.speedSmooth;
    if (s < CFG.mouseSpeed.still) mouse.classification = 'still';
    else if (s < CFG.mouseSpeed.slow) mouse.classification = 'slow';
    else if (s < CFG.mouseSpeed.fast) mouse.classification = 'fast';
    else mouse.classification = 'aggressive';
  }

  // =========================================================================
  // 5 — Spatial Hash Grid (Phase 5: O(1) collision detection)
  // =========================================================================

  const spatialHash = {
    cellSize: CFG.spatialHashCellSize,  // 120px cells
    grid: new Map(),                     // key "col,row" → Set of obstacle refs
    all: [],                             // flat array of all obstacles (for debug)
    lastBuildMs: 0,                      // throttle timestamp
  };

  // Obstacle entry: { el, x, y, w, h, cx, cy, minCol, minRow, maxCol, maxRow }
  function buildSpatialHash() {
    const now = Date.now();
    if (now - spatialHash.lastBuildMs < CFG.spatialHashRebuildMs) return;
    spatialHash.lastBuildMs = now;

    const cell = spatialHash.cellSize;
    const grid = spatialHash.grid;
    grid.clear();
    spatialHash.all.length = 0;

    const els = document.querySelectorAll(CFG.indexedSelectors);
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      // Skip our canvas, invisible, tiny
      if (el === canvas) continue;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 5 || r.height < 5) continue;

      // Convert viewport-relative rect to document coordinates
      const dx = r.left + scrollOx;
      const dy = r.top + scrollOy;
      const ob = {
        el: el,
        x: dx, y: dy, w: r.width, h: r.height,
        cx: dx + r.width * 0.5,
        cy: dy + r.height * 0.5,
      };

      // Insert into all cells this rect overlaps
      const minCol = Math.floor(dx / cell);
      const minRow = Math.floor(dy / cell);
      const maxCol = Math.floor((dx + r.width) / cell);
      const maxRow = Math.floor((dy + r.height) / cell);

      for (let c = minCol; c <= maxCol; c++) {
        for (let rr = minRow; rr <= maxRow; rr++) {
          const key = c + ',' + rr;
          let bucket = grid.get(key);
          if (!bucket) { bucket = []; grid.set(key, bucket); }
          bucket.push(ob);
        }
      }

      spatialHash.all.push(ob);
    }
  }

  // Query: return obstacles near (x, y) — own cell + 8 neighbors, deduplicated
  function getNearby(x, y) {
    const cell = spatialHash.cellSize;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    const grid = spatialHash.grid;
    const result = [];
    const seen = new Set();

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const bucket = grid.get((col + dc) + ',' + (row + dr));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          const ob = bucket[i];
          if (!seen.has(ob)) {
            seen.add(ob);
            result.push(ob);
          }
        }
      }
    }
    return result;
  }

  // Count nearby DOM density (for future sensor use)
  function getNearbyCount(x, y) {
    const cell = spatialHash.cellSize;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    const grid = spatialHash.grid;
    const seen = new Set();
    let count = 0;

    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const bucket = grid.get((col + dc) + ',' + (row + dr));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          if (!seen.has(bucket[i])) {
            seen.add(bucket[i]);
            count++;
          }
        }
      }
    }
    return count;
  }

  // MutationObserver: rebuild hash when DOM changes + track novelty
  let mutationRebuildTimer = 0;
  function onDomMutation(mutations) {
    clearTimeout(mutationRebuildTimer);
    mutationRebuildTimer = setTimeout(buildSpatialHash, CFG.spatialHashRebuildMs);
    // Phase 16A: Track novel DOM elements for curiosity reward
    if (mutations && mutations.length) noveltyTrackNewElements(mutations);
  }

  // =========================================================================
  // 6 — Sensory System (Phase 6: global + per-tentacle)
  // =========================================================================

  // 6A — Global sensors (discrete values for Q-Learning state vector)

  // Scroll state
  let scrollActive = false;
  let scrollTimer = 0;
  function onScroll() {
    scrollActive = true;
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () { scrollActive = false; }, CFG.scrollTimeoutMs);
    // Update scroll offset for document→viewport coordinate transform
    scrollOx = window.scrollX || window.pageXOffset || 0;
    scrollOy = window.scrollY || window.pageYOffset || 0;
    updateDocDimensions();
  }

  // Time of day classification
  function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
  }

  // Cursor proximity to Lili (discrete)
  function getCursorProximity() {
    if (!mouse.active) return 'far';
    const dx = lili.pos.x - mouse.pos.x;
    const dy = lili.pos.y - mouse.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < CFG.fleeDistance * 0.5) return 'near';
    if (d < CFG.fleeDistance * 1.5) return 'medium';
    return 'far';
  }

  // DOM density around Lili (from spatial hash)
  function getDomDensity() {
    const count = getNearbyCount(lili.pos.x, lili.pos.y);
    if (count <= 2) return 'sparse';
    if (count <= 8) return 'medium';
    return 'dense';
  }

  // Whitespace proximity — is Lili in empty space or overlapping elements?
  function getWhitespaceProximity() {
    const nearby = getNearby(lili.pos.x, lili.pos.y);
    const px = lili.pos.x, py = lili.pos.y;
    const r = lili.bodyR;
    let touching = false;
    let nearElement = false;

    for (let i = 0; i < nearby.length; i++) {
      const ob = nearby[i];
      // Check if body overlaps this element
      const closestX = Math.max(ob.x, Math.min(px, ob.x + ob.w));
      const closestY = Math.max(ob.y, Math.min(py, ob.y + ob.h));
      const dx = px - closestX;
      const dy = py - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < r * r) { touching = true; break; }
      if (distSq < (r * 4) * (r * 4)) nearElement = true;
    }

    if (touching) return 'on_element';
    if (nearElement) return 'near_element';
    return 'in_whitespace';
  }

  // 6A — Full sensor snapshot (updated per decision cycle, not per frame)
  const sensors = {
    cursorProximity: 'far',       // far / medium / near
    cursorVelocity: 'still',      // still / slow / fast / aggressive
    domDensity: 'sparse',         // sparse / medium / dense
    whitespace: 'in_whitespace',  // in_whitespace / near_element / on_element
    scrollState: 'idle',          // idle / active
    timeOfDay: 'morning',         // morning / afternoon / evening / night
    agePhase: 'hatchling',        // hatchling / juvenile / adult / mature / elder
    momentum: 'steady',           // Phase 17: accelerating / steady / decelerating
    trust: 'low',                 // Phase 17: low / medium / high

    // Numeric state index for Q-Learning (38880 states)
    stateIndex: 0,
  };

  // Discrete → index lookup tables
  const _sensorIndices = {
    cursorProximity: { far: 0, medium: 1, near: 2 },           // 3
    cursorVelocity:  { still: 0, slow: 1, fast: 2, aggressive: 3 }, // 4
    domDensity:      { sparse: 0, medium: 1, dense: 2 },       // 3
    whitespace:      { in_whitespace: 0, near_element: 1, on_element: 2 }, // 3
    scrollState:     { idle: 0, active: 1 },                   // 2
    timeOfDay:       { morning: 0, afternoon: 1, evening: 2, night: 3 }, // 4
    agePhase:        { hatchling: 0, juvenile: 1, adult: 2, mature: 3, elder: 4 }, // 5
    momentum:        { accelerating: 0, steady: 1, decelerating: 2 }, // 3
    trust:           { low: 0, medium: 1, high: 2 },           // 3
  };
  // Dimension sizes: 3×4×3×3×2×4×5×3×3 = 38880
  const _sensorDims = [3, 4, 3, 3, 2, 4, 5, 3, 3];

  // Phase 17: Velocity history for momentum sensor
  const _velHistory = new Float32Array(10);
  let _velHistoryIdx = 0;
  let _velHistoryFull = false;

  // Sensor ordering for loop-based state index computation
  const _sensorOrder = [
    'cursorProximity', 'cursorVelocity', 'domDensity', 'whitespace',
    'scrollState', 'timeOfDay', 'agePhase', 'momentum', 'trust',
  ];

  function updateSensors() {
    sensors.cursorProximity = getCursorProximity();
    sensors.cursorVelocity = mouse.classification;
    sensors.domDensity = getDomDensity();
    sensors.whitespace = getWhitespaceProximity();
    sensors.scrollState = scrollActive ? 'active' : 'idle';
    sensors.timeOfDay = getTimeOfDay();
    sensors.agePhase = age.phase;

    // Phase 17: Momentum sensor — velocity trend over recent history
    const velMag = lili.vel.mag();
    _velHistory[_velHistoryIdx] = velMag;
    _velHistoryIdx = (_velHistoryIdx + 1) % 10;
    if (_velHistoryIdx === 0) _velHistoryFull = true;
    const histLen = _velHistoryFull ? 10 : _velHistoryIdx;

    if (histLen >= 4) {
      const half = Math.floor(histLen / 2);
      let recentSum = 0, olderSum = 0;
      for (let i = 0; i < half; i++) {
        recentSum += _velHistory[(_velHistoryIdx - 1 - i + 10) % 10];
        olderSum  += _velHistory[(_velHistoryIdx - 1 - half - i + 10) % 10];
      }
      const diff = recentSum / half - olderSum / half;
      if (diff > 0.15) sensors.momentum = 'accelerating';
      else if (diff < -0.15) sensors.momentum = 'decelerating';
      else sensors.momentum = 'steady';
    } else {
      sensors.momentum = 'steady';
    }

    // Phase 17: Trust sensor — discretize visit profile trust level
    if (_visitProfile.trustLevel < 0.3) sensors.trust = 'low';
    else if (_visitProfile.trustLevel < 0.7) sensors.trust = 'medium';
    else sensors.trust = 'high';

    // Compute flat state index (loop-based mixed-radix encoding)
    sensors.stateIndex = 0;
    let multiplier = 1;
    for (let i = _sensorDims.length - 1; i >= 0; i--) {
      sensors.stateIndex += _sensorIndices[_sensorOrder[i]][sensors[_sensorOrder[i]]] * multiplier;
      multiplier *= _sensorDims[i];
    }
  }

  // 6B — Per-tentacle local sensors (tip touching DOM element)
  function tentacleTipTouchingDom(arm) {
    const tipX = arm.x[JOINTS - 1];
    const tipY = arm.y[JOINTS - 1];
    const nearby = getNearby(tipX, tipY);
    for (let i = 0; i < nearby.length; i++) {
      const ob = nearby[i];
      if (tipX >= ob.x && tipX <= ob.x + ob.w && tipY >= ob.y && tipY <= ob.y + ob.h) {
        return ob; // returns the obstacle entry (has .el reference)
      }
    }
    return null;
  }

  // 6C — Stress model (0..1, exponential smoothing)
  let stress = 0;

  function updateStress() {
    // Inputs: cursor proximity, recoil count, speed
    let raw = 0;

    // Cursor proximity contribution
    if (sensors.cursorProximity === 'near') raw += 0.5;
    else if (sensors.cursorProximity === 'medium') raw += 0.15;

    // Cursor velocity contribution
    if (sensors.cursorVelocity === 'aggressive') raw += 0.4;
    else if (sensors.cursorVelocity === 'fast') raw += 0.2;

    // Tentacle recoil count
    let recoilCount = 0;
    for (let t = 0; t < TENT_N; t++) {
      if (tentacles[t].recoilTimer > 0) recoilCount++;
    }
    raw += recoilCount * 0.08;

    // On element stress
    if (sensors.whitespace === 'on_element') raw += 0.1;

    // Phase 34: Cursor pattern modulates stress
    if (_cursorPattern.pattern === 'nervous') raw += 0.15 * CFG.cursorPattern.patternInfluence;
    else if (_cursorPattern.pattern === 'calm') raw -= 0.1 * CFG.cursorPattern.patternInfluence;

    // Phase 32: Habituation dampens cursor-driven stress
    raw *= _habituation.cursor;

    // Clamp raw input
    raw = Math.min(raw, 1);

    // Phase 18C: Startle micro-expression — sudden stress spike from cursor
    if (raw > 0.7 && stress < 0.3) triggerMicroExpr('startle');

    // Exponential smoothing
    stress += (raw - stress) * CFG.stressSmoothing;
    lili.stress = stress; // sync with lili object

    // Phase 18E: Accumulate stress for psychosomatic adaptation
    psychosomAccumulate(stress);
  }

  // =========================================================================
  // 53 — Endocrine Model (virtual hormones: dopamine, cortisol, serotonin)
  // Biological analogy: hormonal substrate modulating mood, steering, visuals.
  // Hormones have half-life decay, production triggers, mutual inhibition.
  // =========================================================================

  const _hormones = {
    dopamine:  0.2,   // reward/curiosity — promotes exploration
    cortisol:  0.15,  // stress/threat — promotes caution
    serotonin: 0.3,   // calm/safety — promotes exploitation
  };

  function updateEndocrine() {
    var E = CFG.endocrine;
    var dopa = _hormones.dopamine;
    var cort = _hormones.cortisol;
    var sero = _hormones.serotonin;

    // --- Decay (exponential half-life) ---
    dopa *= (1 - E.dopamine.decayRate);
    cort *= (1 - E.cortisol.decayRate);
    sero *= (1 - E.serotonin.decayRate);

    // --- Production: Dopamine ---
    // Boosted by positive reward (injected from brainDecisionCycle)
    // Trickle during curious/exploring moods
    if (lili.mood === 'curious' || lili.mood === 'exploring') {
      dopa += E.dopamine.curiosityBoost;
    }
    // Suppressed when cortisol is high
    if (cort > E.dopamineCortisolInhibition) {
      dopa *= 1 - (cort - E.dopamineCortisolInhibition) * 0.3;
    }

    // --- Production: Cortisol ---
    // Boosted by stress above threshold
    if (stress > 0.4) {
      // Suppressed when serotonin is high
      var cortisolGain = (stress - 0.4) * E.cortisol.stressBoost;
      if (sero > E.serotonin.inhibitsCortisol) {
        cortisolGain *= 1 - (sero - E.serotonin.inhibitsCortisol) * 0.5;
      }
      cort += cortisolGain;
    }

    // --- Production: Serotonin ---
    // Boosted during calm/idle states
    if (lili.mood === 'calm' || lili.mood === 'idle') {
      var seroGain = E.serotonin.calmBoost;
      // Suppressed when cortisol is high
      if (cort > E.cortisol.inhibitsSerotonin) {
        seroGain *= 1 - (cort - E.cortisol.inhibitsSerotonin) * 0.6;
      }
      sero += seroGain;
    }
    // Safety boost: low stress + trust
    if (stress < 0.2 && _visitProfile.trustLevel > 1) {
      sero += E.serotonin.safetyBoost;
    }

    // --- Clamp ---
    _hormones.dopamine  = Math.min(Math.max(dopa, 0), E.dopamine.maxLevel);
    _hormones.cortisol  = Math.min(Math.max(cort, 0), E.cortisol.maxLevel);
    _hormones.serotonin = Math.min(Math.max(sero, 0), E.serotonin.maxLevel);
  }

  // Reward event injection (called from brainDecisionCycle)
  function endocrineOnReward(reward) {
    if (reward > 0) {
      _hormones.dopamine = Math.min(
        _hormones.dopamine + reward * CFG.endocrine.dopamine.rewardBoost,
        CFG.endocrine.dopamine.maxLevel
      );
    }
    if (reward < -0.5) {
      // Negative reward spikes cortisol
      _hormones.cortisol = Math.min(
        _hormones.cortisol + Math.abs(reward) * 0.1,
        CFG.endocrine.cortisol.maxLevel
      );
    }
  }

  // Startle event injection (called from triggerMicroExpr)
  function endocrineOnStartle() {
    _hormones.cortisol = Math.min(
      _hormones.cortisol + CFG.endocrine.cortisol.startleBoost,
      CFG.endocrine.cortisol.maxLevel
    );
  }

  // Get hormone-based mood transition bias (modifies softmax probabilities)
  function endocrineGetMoodBias(moodIdx) {
    var moodName = CFG.moods[moodIdx];
    var E = CFG.endocrine;
    var bias = 0;

    // Dopamine boosts curious/exploring/playful
    var dBias = E.dopamine.moodBias[moodName] || 0;
    bias += dBias * _hormones.dopamine;

    // Cortisol boosts shy/alert
    var cBias = E.cortisol.moodBias[moodName] || 0;
    bias += cBias * _hormones.cortisol;

    // Serotonin boosts calm/idle
    var sBias = E.serotonin.moodBias[moodName] || 0;
    bias += sBias * _hormones.serotonin;

    return bias * E.transitionInfluence;
  }

  // Get hormone-based steering modulation
  function endocrineSteeringMod() {
    var inf = CFG.endocrine.steeringInfluence;
    return {
      // High dopamine → more wander, seek DOM
      wanderBoost:  1 + _hormones.dopamine * inf * 2,
      seekDomBoost: 1 + _hormones.dopamine * inf,
      // High cortisol → more flee, less approach
      fleeBoost:    1 + _hormones.cortisol * inf * 3,
      followReduce: 1 - _hormones.cortisol * inf * 2,
      // High serotonin → more boundary respect, calmer movement
      boundaryBoost: 1 + _hormones.serotonin * inf,
      speedDampen:   1 - _hormones.serotonin * inf * 0.5,
    };
  }

  function endocrineSave() {
    try {
      localStorage.setItem(CFG.storageKeys.endocrine, JSON.stringify({
        d: +_hormones.dopamine.toFixed(4),
        c: +_hormones.cortisol.toFixed(4),
        s: +_hormones.serotonin.toFixed(4),
      }));
    } catch (e) { /* */ }
  }

  function endocrineLoad() {
    try {
      var json = localStorage.getItem(CFG.storageKeys.endocrine);
      if (json) {
        var data = JSON.parse(json);
        _hormones.dopamine  = data.d || 0.2;
        _hormones.cortisol  = data.c || 0.15;
        _hormones.serotonin = data.s || 0.3;
      }
    } catch (e) { /* */ }
  }

  // =========================================================================
  // 8A — Q-Learning Brain (mood coordinator)
  // Q-Learning selects MOODS, not actions. Moods → steering weights + tentacle params.
  // Biological analogy: hormonal system setting tendencies, not motor commands.
  // =========================================================================

  const MOOD_COUNT = CFG.moods.length; // 7

  // --- Q-table: sparse Map<stateIndex, Float64Array[7]> ---
  const _qtable = new Map();

  function _getQ(stateIndex) {
    let row = _qtable.get(stateIndex);
    if (!row) {
      row = new Float64Array(MOOD_COUNT); // initialized to 0
      _qtable.set(stateIndex, row);
    }
    return row;
  }

  // --- Decision state tracking ---
  const _decision = {
    frameCounter: 0,        // frames since last decision
    prevState: -1,           // state index at start of previous cycle
    prevMoodIndex: 5,        // mood chosen last cycle (idle=5)
    prevCursorProximity: 'far', // for flee success detection
    moodRepeatCount: 0,      // consecutive cycles with same mood
    totalDecisions: 0,       // lifetime decision counter
    totalReward: 0,          // lifetime reward accumulator
    lastSaveFrame: 0,        // frame of last Q-table save
    wasExploratory: false,   // last decision was ε-random
  };

  // --- Phase 17: Adaptive learning rate — per (state, mood) visit counts ---
  const _visitCounts = new Map();  // "state,mood" → count

  function _getAlpha(stateIndex, moodIdx) {
    const key = stateIndex + ',' + moodIdx;
    const count = _visitCounts.get(key) || 0;
    // Phase 38: Surprise boosts learning rate temporarily
    // Phase 48: Meta-learning modulates alpha based on environment stability
    // Phase 54: Cognitive aging — young overwrite fast, old are resistant
    var alphaVol = ageVal(CFG.cognitiveAging.alphaVolatility);
    return Math.max(CFG.rl.alphaMin, CFG.rl.alpha * alphaVol / (1 + count * CFG.rl.alphaDecayFactor)) * _surprise.alphaBoost * _metaLearn.alphaMul;
  }

  function _incrementVisit(stateIndex, moodIdx) {
    const key = stateIndex + ',' + moodIdx;
    _visitCounts.set(key, (_visitCounts.get(key) || 0) + 1);
  }

  // --- Phase 17: Intrinsic curiosity — per-state visit counts ---
  const _stateVisitCounts = new Map();  // stateIndex → count

  // --- Phase 17: Eligibility traces (Q(λ) replacing traces) ---
  const _traces = new Map();  // "state,mood" → trace value

  // --- Phase 17: Softmax pre-allocated buffer ---
  const _softmaxProbs = new Float64Array(MOOD_COUNT);

  // --- Phase 17: Mood plan state ---
  const _activePlan = {
    planIndex: -1,          // -1 = no active plan
    stepIndex: 0,           // current step within plan sequence
    cyclesInStep: 0,        // decision cycles spent in current step
    accumulatedReward: 0,   // total reward during plan execution
    initiationState: -1,    // state at plan start
    initiationMood: -1,     // mood at plan start
  };

  // --- Boltzmann/Softmax mood selection (replaces epsilon-greedy) ---
  function brainDecideMood(stateIndex) {
    const q = _getQ(stateIndex);
    let moodIdx;
    let exploratory = false;

    // Phase 54: Cognitive aging — read noise (young are sloppy, elder slightly noisy)
    var readNoise = ageVal(CFG.cognitiveAging.readNoise);

    // Phase 54: Exploitation bonus — mature/elder get bonus for well-visited states
    var exploitBonus = ageVal(CFG.cognitiveAging.exploitationBonus);
    var stateVisits = _stateVisitCounts.get(stateIndex) || 0;
    var visitBonus = exploitBonus * Math.min(stateVisits / 20, 1); // caps at 20 visits

    // Check if unvisited state (all Q = 0) → uniform random
    let allZero = true;
    for (let i = 0; i < MOOD_COUNT; i++) {
      if (q[i] !== 0) { allZero = false; break; }
    }

    if (allZero) {
      moodIdx = Math.floor(rlRng() * MOOD_COUNT);
      exploratory = true;
    } else {
      // Boltzmann: P(m) ∝ exp((Q(s,m) - maxQ) / τ)
      // Phase 31: Fatigue reduces exploration temperature (less random when tired)
      var tauBase = Math.max(ageVal(CFG.rl.temperature), CFG.rl.softmaxMinTemp);
      const tau = _energy.fatigued ? tauBase * CFG.energy.explorationPenalty : tauBase;

      // Find maxQ for numerical stability (with noise and exploitation bonus)
      let maxQ = q[0] + (rlRng() - 0.5) * readNoise + visitBonus;
      let argmaxIdx = 0;
      for (let i = 1; i < MOOD_COUNT; i++) {
        var qi = q[i] + (rlRng() - 0.5) * readNoise + visitBonus;
        if (qi > maxQ) { maxQ = qi; argmaxIdx = i; }
      }

      // Compute unnormalized probs
      for (let i = 0; i < MOOD_COUNT; i++) {
        _softmaxProbs[i] = Math.exp((q[i] - maxQ) / tau);
      }

      // Phase 17: Apply mood transition mask
      const trans = CFG.moodTransitions;
      const fromIdx = _decision.prevMoodIndex;
      if (fromIdx >= 0) {
        for (let i = 0; i < MOOD_COUNT; i++) {
          const rule = trans.matrix[fromIdx][i];
          if (rule === false) {
            _softmaxProbs[i] = 0;
          } else if (rule === 'stress') {
            if (stress < trans.stressGateThreshold) _softmaxProbs[i] = 0;
          }
        }
      }

      // Phase 37: Apply personality drift bias (soft temperament influence)
      for (let i = 0; i < MOOD_COUNT; i++) {
        if (_softmaxProbs[i] > 0) {
          var bias = temperamentGetBias(i);
          // Phase 53: Endocrine hormone bias — dopamine/cortisol/serotonin influence mood selection
          bias += endocrineGetMoodBias(i);
          _softmaxProbs[i] *= Math.exp(bias); // multiplicative bias
        }
      }

      // Normalize
      let sum = 0;
      for (let i = 0; i < MOOD_COUNT; i++) sum += _softmaxProbs[i];

      if (sum > 0) {
        // Sample from cumulative distribution
        let r = rlRng() * sum;
        moodIdx = MOOD_COUNT - 1;
        for (let i = 0; i < MOOD_COUNT; i++) {
          r -= _softmaxProbs[i];
          if (r <= 0) { moodIdx = i; break; }
        }
      } else {
        // All transitions blocked — stay in current mood
        moodIdx = _decision.prevMoodIndex >= 0 ? _decision.prevMoodIndex : 0;
      }

      exploratory = (moodIdx !== argmaxIdx);
    }

    // Clear eligibility traces on exploratory action (replacing traces protocol)
    if (exploratory) _traces.clear();

    _decision.wasExploratory = exploratory;
    return moodIdx;
  }

  // --- Q(λ) Bellman update with eligibility traces ---
  function brainLearn(prevState, moodIdx, reward, newState) {
    const gamma = CFG.rl.gamma;
    const lambda = ageVal(CFG.rl.lambda);
    const qPrev = _getQ(prevState);
    const qNew = _getQ(newState);

    // Increment visit count for adaptive alpha
    _incrementVisit(prevState, moodIdx);

    // max Q(s', m') for all moods
    let maxNext = qNew[0];
    for (let i = 1; i < MOOD_COUNT; i++) {
      if (qNew[i] > maxNext) maxNext = qNew[i];
    }

    // TD error: δ = R + γ·max(Q(s',m')) - Q(s,m)
    const delta = reward + gamma * maxNext - qPrev[moodIdx];

    // Phase 19C: Track convergence metric (avg |delta|)
    _journal._qDeltaSum += Math.abs(delta);
    _journal._qDeltaCount++;

    // Phase 38: Surprise signal — high TD error triggers surprise response
    surpriseOnTdError(Math.abs(delta));

    // Phase 48: Meta-learning — track TD error for stability detection
    metaLearnUpdate(Math.abs(delta));

    // Phase 19C: Track policy stability (did top mood change?)
    let prevTop = 0;
    for (let ii = 1; ii < MOOD_COUNT; ii++) {
      if (qPrev[ii] > qPrev[prevTop]) prevTop = ii;
    }

    // Set replacing trace for current (s,m) to 1.0
    const curKey = prevState + ',' + moodIdx;
    _traces.set(curKey, 1.0);

    // Update all traced (s,m) pairs
    const threshold = CFG.rl.traceMinThreshold;
    const gammaLambda = gamma * lambda;
    const toDelete = [];

    _traces.forEach(function (e, key) {
      // Parse key to get alpha for this (s,m) pair
      const sep = key.indexOf(',');
      const s = +key.substring(0, sep);
      const m = +key.substring(sep + 1);
      const alpha = _getAlpha(s, m);

      // Q(s,m) += α · δ · e(s,m)
      const qRow = _getQ(s);
      qRow[m] += alpha * delta * e;

      // Decay trace: e(s,m) *= γ·λ
      const newE = e * gammaLambda;
      if (newE < threshold) {
        toDelete.push(key);
      } else {
        _traces.set(key, newE);
      }
    });

    // Prune decayed traces
    for (let i = 0; i < toDelete.length; i++) _traces.delete(toDelete[i]);

    // Safety cap: prune smallest if over limit
    // Phase 54: Cognitive aging — working memory shrinks in old age, smaller in youth
    var traceCapacity = Math.round(ageVal(CFG.cognitiveAging.traceCapacity));
    if (_traces.size > traceCapacity) {
      let minKey = null, minVal = Infinity;
      _traces.forEach(function (v, k) {
        if (v < minVal) { minVal = v; minKey = k; }
      });
      if (minKey) _traces.delete(minKey);
    }

    // Phase 19C: Check if top mood for this state changed (policy stability)
    let newTop = 0;
    for (let ii = 1; ii < MOOD_COUNT; ii++) {
      if (qPrev[ii] > qPrev[newTop]) newTop = ii;
    }
    if (newTop !== prevTop) {
      _journal._policyChanges++;
    }
  }

  // --- Phase 17: Plan selection heuristic ---
  function _considerPlan(currentState) {
    const plans = CFG.moodPlans.plans;
    const mood = lili.mood;

    // 'retreat': stress rising + in exposed mood
    if (stress > 0.4 && (mood === 'curious' || mood === 'exploring')) {
      for (let i = 0; i < plans.length; i++) {
        if (plans[i].name === 'retreat') return i;
      }
    }

    // 'investigate': near DOM-dense area, low stress
    if (sensors.domDensity === 'dense' && stress < 0.3 && mood !== 'shy') {
      for (let i = 0; i < plans.length; i++) {
        if (plans[i].name === 'investigate') return i;
      }
    }

    // 'socialize': high trust + cursor near
    if (_visitProfile.trustLevel > 0.5 && sensors.cursorProximity === 'near' && stress < 0.3) {
      for (let i = 0; i < plans.length; i++) {
        if (plans[i].name === 'socialize') return i;
      }
    }

    // 'settle': in whitespace after exploring
    if (sensors.whitespace === 'in_whitespace' && mood === 'exploring') {
      for (let i = 0; i < plans.length; i++) {
        if (plans[i].name === 'settle') return i;
      }
    }

    return -1; // no plan
  }

  // --- Reward computation (PRD-specified values) ---
  function computeReward() {
    let reward = 0;
    const mood = lili.mood;
    const R = CFG.rewards;
    const JC = CFG.journal;

    // Phase 26: Curriculum learning — gate reward components by life phase
    var gate = CFG.curriculum.gates[age.phase] || CFG.curriculum.gates.adult;

    // +1.0: in whitespace, user reading (cursor still/slow), calm/idle mood
    if (sensors.whitespace === 'in_whitespace' &&
        (sensors.cursorVelocity === 'still' || sensors.cursorVelocity === 'slow') &&
        (mood === 'calm' || mood === 'idle')) {
      reward += R.whitespaceCalm * gate.whitespaceCalm;
    }

    // +0.8: successful flee (was near, now far, was shy/alert)
    if (_decision.prevCursorProximity === 'near' &&
        sensors.cursorProximity === 'far' &&
        (mood === 'shy' || mood === 'alert')) {
      reward += R.fleeSuccess * gate.fleeSuccess;
      triggerMicroExpr('relief'); // Phase 18C
    }

    // +0.5: near DOM, low stress, curious mood
    if (sensors.domDensity !== 'sparse' && stress < 0.3 && mood === 'curious') {
      reward += R.exploreLowStress * gate.exploreLowStress;
    }

    // +0.3: tentacles touching DOM, user not stationary, playful
    if (mood === 'playful' && sensors.cursorVelocity !== 'still') {
      let touchCount = 0;
      for (let t = 0; t < TENT_N; t++) {
        if (tentacles[t].touching) touchCount++;
      }
      if (touchCount > 0) reward += R.playfulInteraction * gate.playfulInteraction;
    }

    // +0.3: near document edge, user active in center
    if (mouse.active && sensors.cursorProximity === 'far') {
      const dL = lili.pos.x, dR = docW - lili.pos.x;
      const dT = lili.pos.y, dB = docH - lili.pos.y;
      if (Math.min(dL, dR, dT, dB) < CFG.boundaryMargin * 1.5) {
        reward += R.edgeRespect * gate.edgeRespect;
      }
    }

    // -2.0: over text/element, cursor still (blocking reading)
    if (sensors.whitespace === 'on_element' && sensors.cursorVelocity === 'still') {
      reward += R.blockingRead * gate.blockingRead;
    }

    // -1.0: held element blocks reading (user cursor still, element displaced)
    if (sensors.cursorVelocity === 'still' && _domState.heldCount > 0) {
      reward += R.heldBlocksRead * gate.heldBlocksRead;
    }

    // -0.5: idle too long (modulated by age — elders less penalized)
    if (mood === 'idle' && _decision.moodRepeatCount > JC.idlePenaltyThreshold) {
      const ageMod = ageVal({ hatchling: 1.0, juvenile: 0.8, adult: 0.6, mature: 0.4, elder: 0.2 });
      reward += R.idleTooLong * ageMod * gate.idleTooLong;
    }

    // -0.3: shy/alert when cursor is slow and far (unnecessary fear)
    if ((mood === 'shy' || mood === 'alert') &&
        sensors.cursorProximity === 'far' &&
        (sensors.cursorVelocity === 'still' || sensors.cursorVelocity === 'slow')) {
      reward += R.unnecessaryFlee * gate.unnecessaryFlee;
    }

    // -0.2: repeating same mood > threshold cycles
    if (_decision.moodRepeatCount > JC.moodRepeatThreshold) {
      reward += R.moodRepetition * gate.moodRepetition;
    }

    // Phase 15A: Update place memory with reward sign
    placeMemoryUpdate(lili.pos.x, lili.pos.y, reward > 0 ? 1 : reward < 0 ? -1 : 0);

    // Phase 15C: Trust reward — calm near cursor at high trust
    if (_visitProfile.trustLevel > 0.3 &&
        (mood === 'calm' || mood === 'curious') &&
        sensors.cursorProximity === 'near') {
      reward += CFG.visitRecognition.trustRewardBonus * _visitProfile.trustLevel;
    }

    // Phase 16A: Novelty reward — bonus for being near unseen DOM content
    var noveltyBonus = noveltyNearBonus();
    if (noveltyBonus > 0) reward += noveltyBonus;

    // Phase 15D: DOM learning reward bonus for interacting with preferred types
    if (sensors.domDensity !== 'sparse') {
      var nearby = getNearby(lili.pos.x, lili.pos.y);
      if (nearby.length > 0) {
        var nearEl = nearby[0].el || nearby[0];
        if (nearEl && nearEl.tagName) {
          var domPref = domLearningGetPreference(nearEl);
          if (domPref > 0.3) reward += CFG.domLearning.rewardBonus * domPref;
        }
      }
    }

    // Phase 17: Intrinsic curiosity reward — bonus for unvisited states
    var stateVisits = _stateVisitCounts.get(sensors.stateIndex) || 0;
    var beta = ageVal(CFG.rl.curiosityBeta);
    reward += beta / Math.sqrt(1 + stateVisits);

    // Phase 33: Cognitive map bonus for being in familiar safe locations
    var cogInfo = cogMapQuery(lili.pos.x, lili.pos.y);
    if (cogInfo.familiar && cogInfo.value > 0.1) {
      reward += cogInfo.value * 0.2; // small bonus for returning to known good spots
    }

    // Phase 35: Attention-modulated reward — reward for stimuli in focus gets slight boost
    var focusSensor = attentionGetFocus();
    if (focusSensor === 'cursorProximity' && sensors.cursorProximity === 'near') {
      reward *= (1 + CFG.attention.influenceOnReward); // attending to cursor → stronger reward signal
    }

    // Phase 36: Temporal pattern — bonus/penalty for matching learned time-of-day expectations
    var temporal = temporalGetExpectation();
    if (temporal) {
      // If current stress matches expected pattern, small reward (behaving "normally")
      var stressDev = Math.abs(stress - temporal.stress);
      if (stressDev < 0.15) reward += CFG.temporal.baselineInfluence;
    }

    return reward;
  }

  // --- Decision cycle orchestrator (called every frame, acts every N frames) ---
  function brainDecisionCycle() {
    _decision.frameCounter++;

    // Phase 54: Cognitive aging — elder thinks slower, hatchling faster
    var decisionThreshold = Math.round(CFG.rl.decisionCycleFrames * ageVal(CFG.cognitiveAging.decisionCooldown));
    if (_decision.frameCounter < decisionThreshold) return;
    _decision.frameCounter = 0;

    const currentState = sensors.stateIndex;

    // Phase 17: Track state visitation for intrinsic curiosity
    _stateVisitCounts.set(currentState, (_stateVisitCounts.get(currentState) || 0) + 1);

    // Phase 19B: Record replay snapshot at decision point
    replayRecordSnapshot();

    // Compute reward for previous mood (outcome of last cycle)
    if (_decision.prevState >= 0) {
      const reward = computeReward();

      // Phase 17: Mood plan — accumulate reward if plan active
      if (_activePlan.planIndex >= 0) {
        _activePlan.accumulatedReward += reward *
          Math.pow(CFG.moodPlans.planRewardDiscount, _activePlan.stepIndex);
      }

      // Q(λ) update — skip for baselines that don't learn
      if (!baselineSkipLearning()) {
        // Phase 19A: Myopic baseline overrides gamma
        var savedGamma = CFG.rl.gamma;
        CFG.rl.gamma = baselineGamma();
        brainLearn(_decision.prevState, _decision.prevMoodIndex, reward, currentState);
        CFG.rl.gamma = savedGamma;
      }

      // Journal logging
      journalLogDecision(currentState, reward);

      _decision.totalReward += reward;
      psychosomAccumulate(stress, reward); // Phase 18E
      endocrineOnReward(reward); // Phase 53: reward → dopamine/cortisol

      // Phase 28: Trigger excitement flash on high positive reward
      if (reward >= CFG.signals.excitementThreshold) {
        signalTriggerExcitement();
        triggerMicroExpr('joy');
      }
    }

    // Phase 17: Mood plan management
    let newMoodIdx, newMood;
    let planOverride = false;

    if (_activePlan.planIndex >= 0) {
      const plan = CFG.moodPlans.plans[_activePlan.planIndex];
      _activePlan.cyclesInStep++;

      // Abort on high stress
      if (stress > CFG.moodPlans.stressAbortThreshold) {
        brainLearn(_activePlan.initiationState, _activePlan.initiationMood,
                   _activePlan.accumulatedReward, currentState);
        _activePlan.planIndex = -1;
      } else if (_activePlan.cyclesInStep >= plan.cyclesPerStep) {
        // Advance to next step
        _activePlan.stepIndex++;
        _activePlan.cyclesInStep = 0;
        if (_activePlan.stepIndex >= plan.sequence.length) {
          // Plan complete — attribute reward
          brainLearn(_activePlan.initiationState, _activePlan.initiationMood,
                     _activePlan.accumulatedReward, currentState);
          _activePlan.planIndex = -1;
        }
      }

      // Still in plan? Override mood selection
      if (_activePlan.planIndex >= 0) {
        const planMood = plan.sequence[_activePlan.stepIndex];
        newMoodIdx = CFG.moods.indexOf(planMood);
        newMood = planMood;
        planOverride = true;
      }
    }

    if (!planOverride) {
      // Consider initiating a plan
      if (_activePlan.planIndex < 0 &&
          _decision.totalDecisions % CFG.moodPlans.planConsiderInterval === 0) {
        const pi = _considerPlan(currentState);
        if (pi >= 0) {
          _activePlan.planIndex = pi;
          _activePlan.stepIndex = 0;
          _activePlan.cyclesInStep = 0;
          _activePlan.accumulatedReward = 0;
          _activePlan.initiationState = currentState;
          _activePlan.initiationMood = _decision.prevMoodIndex;
          const plan = CFG.moodPlans.plans[pi];
          newMoodIdx = CFG.moods.indexOf(plan.sequence[0]);
          newMood = plan.sequence[0];
          planOverride = true;
        }
      }

      if (!planOverride) {
        // Phase 19A: Check if baseline mode overrides mood selection
        var baselineMood = baselineSelectMood(currentState);
        if (baselineMood >= 0) {
          newMoodIdx = baselineMood;
          newMood = CFG.moods[newMoodIdx];
        } else {
          // Normal Boltzmann/Softmax mood selection
          newMoodIdx = brainDecideMood(currentState);
          newMood = CFG.moods[newMoodIdx];
        }
      }
    }

    // Track mood repetition
    if (newMoodIdx === _decision.prevMoodIndex) {
      _decision.moodRepeatCount++;
    } else {
      _decision.moodRepeatCount = 0;
    }

    // Save cursor proximity for next cycle's flee-success detection
    _decision.prevCursorProximity = sensors.cursorProximity;

    // Apply mood (Phase 13F: track previous for blending)
    const prevMood = lili.mood;
    lili.mood = newMood;
    lili.moodIndex = newMoodIdx;

    if (prevMood !== newMood) {
      lili.prevMood = prevMood;
      lili.moodBlend = 0; // reset blend — will lerp to 1.0 over ~2s

      // Mood history ring (13E debug)
      _moodHistory.push({ from: prevMood, to: newMood, time: Date.now() });
      if (_moodHistory.length > MAX_MOOD_HISTORY) _moodHistory.shift();

      // Fire listeners (13F)
      for (let i = 0; i < _moodListeners.length; i++) {
        _moodListeners[i](prevMood, newMood);
      }

      // Milestone: first time mood lasted > 5 minutes continuously
      if (_decision.moodRepeatCount * CFG.rl.decisionCycleFrames > 5 * 60 * 60) {
        const mkey = 'sustained_' + prevMood;
        if (!_journal.firstMoods[mkey]) {
          _journal.firstMoods[mkey] = Date.now();
          _journal.milestones.push({
            type: 'sustained_mood',
            mood: prevMood,
            cycles: _decision.moodRepeatCount,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Mood → tentacle influence
    const tentInf = CFG.moodTentacleInfluence[newMood];
    if (tentInf) {
      for (let t = 0; t < TENT_N; t++) {
        // Smoothly blend tentacle curiosity toward mood target
        tentacles[t].curiosity += (tentInf.curiosity - tentacles[t].curiosity) * 0.3;
      }
    }

    // Update tracking
    _decision.prevState = currentState;
    _decision.prevMoodIndex = newMoodIdx;
    _decision.totalDecisions++;

    // Phase 37: Accumulate mood for personality drift
    temperamentAccumulate(newMoodIdx);

    // Phase 31: Energy cost per decision
    energyOnDecision(_decision.wasExploratory);

    // Phase 33: Update cognitive map with current position and reward
    if (_decision.prevState >= 0) {
      var lastReward = _journal.ringBuffer.length > 0 ?
        _journal.ringBuffer[_journal.ringBuffer.length - 1].reward : 0;
      cogMapUpdate(lili.pos.x, lili.pos.y, lastReward, stress < 0.3);
    }

    // Phase 33: Cognitive map decay (same interval as place memory)
    cogMapDecay();

    // Phase 35: Update attention weights
    updateAttention();

    // Periodic Q-table + position + journal save
    if (frameCount - _decision.lastSaveFrame >= CFG.rl.saveIntervalFrames) {
      _decision.lastSaveFrame = frameCount;
      qtableCompress();        // Phase 47: Prune Q-table if too large
      brainSave();
      savePosition();
      journalSaveRingBuffer();
      placeMemorySave();     // Phase 15A
      domLearningSave();     // Phase 15D
      pageMemorySave();      // Phase 46
      narrativeSave();       // Phase 50
      endocrineSave();       // Phase 53
    }
  }

  // =========================================================================
  // 19A — Baseline System (Research #5: academic control conditions)
  // 4 alternative brain policies for paired comparison with Q-Learning.
  // Toggle with keyboard 'B' or lili.baseline() console API.
  // =========================================================================

  const _baseline = {
    mode: 'off',             // current mode (from CFG.baseline.modes)
    frozenQtable: null,      // snapshot of Q-table for frozen baseline
    frozenAt: 0,             // decision count when frozen
  };

  // Random Policy: uniform random mood, no learning
  function baselineRandomMood() {
    return Math.floor(rlRng() * MOOD_COUNT);
  }

  // Frozen Policy: learned Q-table, alpha=0 (no more learning)
  function baselineFrozenMood(stateIndex) {
    // Freeze the Q-table on first call or after configured threshold
    if (!_baseline.frozenQtable) {
      _baseline.frozenQtable = new Map();
      _qtable.forEach(function (q, key) {
        _baseline.frozenQtable.set(key, new Float64Array(q));
      });
      _baseline.frozenAt = _decision.totalDecisions;
      console.info('[Lili] Baseline: froze Q-table at ' + _baseline.frozenAt + ' decisions');
    }
    // Use frozen table for decision (same Boltzmann but no updates)
    const q = _baseline.frozenQtable.get(stateIndex);
    if (!q) return Math.floor(rlRng() * MOOD_COUNT);

    let allZero = true;
    for (let i = 0; i < MOOD_COUNT; i++) {
      if (q[i] !== 0) { allZero = false; break; }
    }
    if (allZero) return Math.floor(rlRng() * MOOD_COUNT);

    const tau = Math.max(ageVal(CFG.rl.temperature), CFG.rl.softmaxMinTemp);
    let maxQ = q[0];
    for (let i = 1; i < MOOD_COUNT; i++) {
      if (q[i] > maxQ) maxQ = q[i];
    }
    for (let i = 0; i < MOOD_COUNT; i++) {
      _softmaxProbs[i] = Math.exp((q[i] - maxQ) / tau);
    }
    let sum = 0;
    for (let i = 0; i < MOOD_COUNT; i++) sum += _softmaxProbs[i];
    let r = rlRng() * sum;
    for (let i = 0; i < MOOD_COUNT; i++) {
      r -= _softmaxProbs[i];
      if (r <= 0) return i;
    }
    return MOOD_COUNT - 1;
  }

  // Myopic Policy: gamma=0, only immediate reward
  function baselineMyopicMood(stateIndex) {
    // Same as brainDecideMood but we override gamma to 0 in learning
    return brainDecideMood(stateIndex);
  }

  // Heuristic Policy: hand-coded expert rules
  function baselineHeuristicMood() {
    // Rule 1: cursor near + high stress → shy (flee)
    if (sensors.cursorProximity === 'near' && stress > 0.3) return 2; // shy

    // Rule 2: cursor near + low stress → alert
    if (sensors.cursorProximity === 'near') return 4; // alert

    // Rule 3: on DOM elements → exploring
    if (sensors.whitespace === 'on_element') return 6; // exploring

    // Rule 4: in whitespace + user reading → calm
    if (sensors.whitespace === 'in_whitespace' &&
        (sensors.cursorVelocity === 'still' || sensors.cursorVelocity === 'slow')) return 3; // calm

    // Rule 5: DOM dense + low stress → curious
    if (sensors.domDensity === 'dense' && stress < 0.3) return 0; // curious

    // Rule 6: evening/night → idle
    if (sensors.timeOfDay === 'night') return 5; // idle

    // Rule 7: default → playful
    return 1; // playful
  }

  // Select mood based on active baseline mode
  function baselineSelectMood(stateIndex) {
    switch (_baseline.mode) {
      case 'random':    return baselineRandomMood();
      case 'frozen':    return baselineFrozenMood(stateIndex);
      case 'myopic':    return baselineMyopicMood(stateIndex);
      case 'heuristic': return baselineHeuristicMood();
      default:          return -1; // not in baseline mode
    }
  }

  // Should brainLearn be skipped? (random/frozen/heuristic skip learning)
  function baselineSkipLearning() {
    return _baseline.mode === 'random' || _baseline.mode === 'frozen' ||
           _baseline.mode === 'heuristic';
  }

  // Myopic override: gamma=0 for learning
  function baselineGamma() {
    return _baseline.mode === 'myopic' ? 0 : CFG.rl.gamma;
  }

  function cycleBaseline() {
    const modes = CFG.baseline.modes;
    const idx = modes.indexOf(_baseline.mode);
    _baseline.mode = modes[(idx + 1) % modes.length];
    if (_baseline.mode !== 'frozen') _baseline.frozenQtable = null;
    try { localStorage.setItem(CFG.storageKeys.baseline, _baseline.mode); } catch (e) { /**/ }
    console.info('[Lili] Baseline mode: ' + _baseline.mode);
    return _baseline.mode;
  }

  function loadBaseline() {
    try {
      var saved = localStorage.getItem(CFG.storageKeys.baseline);
      if (saved && CFG.baseline.modes.indexOf(saved) >= 0) {
        _baseline.mode = saved;
      }
    } catch (e) { /**/ }
  }

  // =========================================================================
  // 19B — Replay System (Research #5: reproducibility)
  // Records cursor trajectories + state at decision points.
  // Replay mode feeds recorded data for paired testing.
  // =========================================================================

  const _replay = {
    recording: false,
    playing: false,
    events: [],             // { t, x, y, vx, vy } cursor snapshots
    snapshots: [],          // { t, state, stress, domDensity, scroll } at decision points
    playbackIndex: 0,
    playbackFrame: 0,
    startTime: 0,
  };

  function replayStartRecording() {
    _replay.recording = true;
    _replay.playing = false;
    _replay.events = [];
    _replay.snapshots = [];
    _replay.startTime = Date.now();
    console.info('[Lili] Replay: recording started');
  }

  function replayStopRecording() {
    _replay.recording = false;
    console.info('[Lili] Replay: recording stopped (' +
      _replay.events.length + ' cursor events, ' +
      _replay.snapshots.length + ' snapshots)');
    try {
      localStorage.setItem(CFG.replay.storageKey, JSON.stringify({
        events: _replay.events,
        snapshots: _replay.snapshots,
        startTime: _replay.startTime,
        duration: Date.now() - _replay.startTime,
      }));
    } catch (e) { console.warn('[Lili] Replay: save failed (storage full)'); }
  }

  function replayRecordCursor() {
    if (!_replay.recording || _replay.events.length >= CFG.replay.maxEvents) return;
    _replay.events.push({
      t: Date.now() - _replay.startTime,
      x: mouse.pos.x, y: mouse.pos.y,
      vx: mouse.vel.x, vy: mouse.vel.y,
    });
  }

  function replayRecordSnapshot() {
    if (!_replay.recording) return;
    _replay.snapshots.push({
      t: Date.now() - _replay.startTime,
      state: sensors.stateIndex,
      stress: Math.round(stress * 100) / 100,
      mood: lili.moodIndex,
      pos: { x: Math.round(lili.pos.x), y: Math.round(lili.pos.y) },
    });
  }

  function replayStartPlayback() {
    try {
      var json = localStorage.getItem(CFG.replay.storageKey);
      if (!json) { console.warn('[Lili] Replay: no recording found'); return; }
      var data = JSON.parse(json);
      _replay.events = data.events || [];
      _replay.snapshots = data.snapshots || [];
    } catch (e) { console.warn('[Lili] Replay: load failed'); return; }

    _replay.playing = true;
    _replay.recording = false;
    _replay.playbackIndex = 0;
    _replay.playbackFrame = 0;
    _replay.startTime = Date.now();
    console.info('[Lili] Replay: playback started (' +
      _replay.events.length + ' events)');
  }

  function replayStopPlayback() {
    _replay.playing = false;
    console.info('[Lili] Replay: playback stopped');
  }

  function replayFeedCursor() {
    if (!_replay.playing) return false;
    var elapsed = Date.now() - _replay.startTime;
    // Find the next event at or past current time
    while (_replay.playbackIndex < _replay.events.length &&
           _replay.events[_replay.playbackIndex].t <= elapsed) {
      var ev = _replay.events[_replay.playbackIndex];
      mouse.prev.setFrom(mouse.pos);
      mouse.pos.set(ev.x, ev.y);
      mouse.vel.set(ev.vx, ev.vy);
      mouse.active = true;
      _replay.playbackIndex++;
    }
    if (_replay.playbackIndex >= _replay.events.length) {
      replayStopPlayback();
    }
    return true;
  }

  function replayExport() {
    try {
      var json = localStorage.getItem(CFG.replay.storageKey);
      if (!json) { console.warn('[Lili] Replay: no recording'); return null; }
      var data = JSON.parse(json);
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'lili_replay_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return data;
    } catch (e) { return null; }
  }

  // --- Q-table persistence ---
  function brainSerialize() {
    const entries = [];
    _qtable.forEach(function (q, key) {
      entries.push([key, Array.from(q)]);
    });
    // Phase 17: visit counts + state visits
    const vc = [];
    _visitCounts.forEach(function (v, k) { vc.push([k, v]); });
    const sv = [];
    _stateVisitCounts.forEach(function (v, k) { sv.push([k, v]); });

    return JSON.stringify({
      v: 2,
      stateVersion: CFG.stateSpace.version,
      mood: lili.moodIndex,
      decisions: _decision.totalDecisions,
      reward: _decision.totalReward,
      entries: entries,
      visitCounts: vc,
      stateVisits: sv,
    });
  }

  function brainDeserialize(json) {
    try {
      const data = JSON.parse(json);
      if (!data || !data.entries) return false;

      // Phase 17: State space version migration (v1→v2: remap 4320→38880)
      const savedVersion = data.stateVersion || 1;
      if (savedVersion !== CFG.stateSpace.version) {
        // Remap old 7-sensor indices to new 9-sensor indices
        // Old dims: [3,4,3,3,2,4,5] = 4320, new dims: [3,4,3,3,2,4,5,3,3] = 38880
        // Default for new sensors: momentum=steady(1), trust=low(0)
        var oldDims = [3, 4, 3, 3, 2, 4, 5];
        var newMul = [12960, 3240, 1080, 360, 180, 45, 9, 3, 1]; // pre-computed new multipliers
        var migratedCount = 0;

        _qtable.clear();
        for (var ei = 0; ei < data.entries.length; ei++) {
          var oldKey = data.entries[ei][0];
          var qvals = data.entries[ei][1];

          // Decode old index → 7 sensor values
          var rem = oldKey;
          var sensorVals = new Array(7);
          for (var di = 6; di >= 0; di--) {
            sensorVals[di] = rem % oldDims[di];
            rem = Math.floor(rem / oldDims[di]);
          }

          // Encode into new index: same 7 values + momentum=steady(1) + trust=low(0)
          var newKey = 0;
          for (var ni = 0; ni < 7; ni++) newKey += sensorVals[ni] * newMul[ni];
          newKey += 1 * newMul[7]; // momentum=steady=1
          newKey += 0 * newMul[8]; // trust=low=0

          _qtable.set(newKey, new Float64Array(qvals));
          migratedCount++;
        }

        console.info('[Lili] State space migrated v' + savedVersion + ' \u2192 v' +
          CFG.stateSpace.version + ': ' + migratedCount + ' Q-states remapped (4320\u219238880)');

        if (typeof data.decisions === 'number') _decision.totalDecisions = data.decisions;
        if (typeof data.reward === 'number') _decision.totalReward = data.reward;
        if (typeof data.mood === 'number') {
          lili.moodIndex = data.mood;
          lili.mood = CFG.moods[data.mood] || 'idle';
        }

        // Remap visit counts ("oldState,mood" → "newState,mood")
        _visitCounts.clear();
        if (data.visitCounts) {
          for (var vi = 0; vi < data.visitCounts.length; vi++) {
            var parts = data.visitCounts[vi][0].split(',');
            var oldS = +parts[0];
            var rem2 = oldS;
            var sv2 = new Array(7);
            for (var d2 = 6; d2 >= 0; d2--) {
              sv2[d2] = rem2 % oldDims[d2];
              rem2 = Math.floor(rem2 / oldDims[d2]);
            }
            var newS = 0;
            for (var n2 = 0; n2 < 7; n2++) newS += sv2[n2] * newMul[n2];
            newS += 1 * newMul[7] + 0 * newMul[8];
            _visitCounts.set(newS + ',' + parts[1], data.visitCounts[vi][1]);
          }
        }

        // Remap state visit counts (oldStateIndex → newStateIndex)
        _stateVisitCounts.clear();
        if (data.stateVisits) {
          for (var si = 0; si < data.stateVisits.length; si++) {
            var oldSv = data.stateVisits[si][0];
            var rem3 = oldSv;
            var sv3 = new Array(7);
            for (var d3 = 6; d3 >= 0; d3--) {
              sv3[d3] = rem3 % oldDims[d3];
              rem3 = Math.floor(rem3 / oldDims[d3]);
            }
            var newSv = 0;
            for (var n3 = 0; n3 < 7; n3++) newSv += sv3[n3] * newMul[n3];
            newSv += 1 * newMul[7] + 0 * newMul[8];
            _stateVisitCounts.set(newSv, data.stateVisits[si][1]);
          }
        }

        // Log milestone
        _journal.milestones.push({
          type: 'state_space_migration',
          from: savedVersion,
          to: CFG.stateSpace.version,
          ts: Date.now(),
          migratedStates: migratedCount,
          preservedDecisions: data.decisions || 0,
        });
        return true;
      }

      _qtable.clear();
      for (let i = 0; i < data.entries.length; i++) {
        const e = data.entries[i];
        _qtable.set(e[0], new Float64Array(e[1]));
      }
      if (typeof data.mood === 'number') {
        lili.moodIndex = data.mood;
        lili.mood = CFG.moods[data.mood] || 'idle';
      }
      if (typeof data.decisions === 'number') {
        _decision.totalDecisions = data.decisions;
      }
      if (typeof data.reward === 'number') {
        _decision.totalReward = data.reward;
      }
      // Phase 17: Restore visit counts
      _visitCounts.clear();
      if (data.visitCounts) {
        for (let i = 0; i < data.visitCounts.length; i++) {
          _visitCounts.set(data.visitCounts[i][0], data.visitCounts[i][1]);
        }
      }
      _stateVisitCounts.clear();
      if (data.stateVisits) {
        for (let i = 0; i < data.stateVisits.length; i++) {
          _stateVisitCounts.set(data.stateVisits[i][0], data.stateVisits[i][1]);
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function brainSave() {
    try {
      localStorage.setItem(CFG.storageKeys.qtable, brainSerialize());
    } catch (e) { /* storage full — graceful degradation */ }
  }

  function brainLoad() {
    const json = localStorage.getItem(CFG.storageKeys.qtable);
    if (json) return brainDeserialize(json);
    return false;
  }

  // =========================================================================
  // 8B — Behavioral Journal (academic data layer)
  // Ring buffer of decisions + daily aggregates + milestones
  // =========================================================================

  const _journal = {
    ringBuffer: [],         // decision records (max ringBufferSize)
    dailyAggregates: [],    // one entry per day
    milestones: [],         // event log
    dayActionCounts: new Float64Array(MOOD_COUNT),  // today's mood counts
    dayRewardSum: 0,
    dayExploratoryCount: 0,
    dayDecisionCount: 0,
    lastDayKey: '',         // 'YYYY-MM-DD' of current tracking day
    firstMoods: {},         // first occurrence of each mood (for milestones)
    // Phase 19C: Convergence tracking
    _qDeltaSum: 0,          // sum of |delta| for daily avg
    _qDeltaCount: 0,        // count of Q-updates today
    _policyChanges: 0,      // count of policy switches (top mood changed) today
    _prevTopMoods: new Map(),  // stateIndex → last top mood index
  };

  function _dayKey() {
    const d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function journalLogDecision(currentState, reward) {
    const now = Date.now();
    const record = {
      ts: now,
      ageMs: age.elapsedMs,
      phase: age.phase,
      state: _decision.prevState,
      mood: _decision.prevMoodIndex,
      exp: _decision.wasExploratory ? 1 : 0,
      reward: Math.round(reward * 1000) / 1000,
      stress: Math.round(stress * 100) / 100,
      x: Math.round(lili.pos.x),
      y: Math.round(lili.pos.y),
    };

    // Ring buffer (FIFO)
    _journal.ringBuffer.push(record);
    if (_journal.ringBuffer.length > CFG.journal.ringBufferSize) {
      _journal.ringBuffer.shift();
    }

    // Daily tracking
    const dk = _dayKey();
    if (dk !== _journal.lastDayKey) {
      // New day — flush previous day's aggregate
      if (_journal.lastDayKey) {
        _flushDailyAggregate();
      }
      _journal.lastDayKey = dk;
      _journal.dayActionCounts.fill(0);
      _journal.dayRewardSum = 0;
      _journal.dayExploratoryCount = 0;
      _journal.dayDecisionCount = 0;
    }

    _journal.dayActionCounts[_decision.prevMoodIndex]++;
    _journal.dayRewardSum += reward;
    if (_decision.wasExploratory) _journal.dayExploratoryCount++;
    _journal.dayDecisionCount++;

    // Milestone: first occurrence of each mood
    const moodName = CFG.moods[_decision.prevMoodIndex];
    if (!_journal.firstMoods[moodName]) {
      _journal.firstMoods[moodName] = now;
      _journal.milestones.push({
        type: 'first_mood',
        mood: moodName,
        ts: now,
        ageMs: age.elapsedMs,
      });
    }
  }

  function _flushDailyAggregate() {
    const total = _journal.dayDecisionCount || 1;

    // Shannon entropy of mood distribution: H = -Σ p(a) log₂ p(a)
    let entropy = 0;
    for (let i = 0; i < MOOD_COUNT; i++) {
      const p = _journal.dayActionCounts[i] / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    // Lempel-Ziv complexity (count unique substrings in mood sequence)
    // Approximate from ring buffer entries for this day
    const lzc = _computeLZC();

    // Q-table hash (simple checksum for convergence detection)
    let qhash = 0;
    _qtable.forEach(function (q) {
      for (let i = 0; i < MOOD_COUNT; i++) qhash += q[i] * (i + 1);
    });

    // Phase 17: Personality snapshot for drift tracking
    const pers = computePersonalityProfile();

    // Phase 19C: Convergence metric — avg absolute Q-delta per update
    var avgQDelta = _journal._qDeltaSum > 0 ? _journal._qDeltaSum / (_journal._qDeltaCount || 1) : 0;

    // Phase 19C: Policy stability — fraction of states where top mood changed today
    var policyChanges = _journal._policyChanges || 0;
    var policyStability = total > 0 ? 1 - (policyChanges / Math.max(total, 1)) : 1;

    const agg = {
      day: _journal.lastDayKey,
      ageMs: age.elapsedMs,
      phase: age.phase,
      moodDist: Array.from(_journal.dayActionCounts),
      avgReward: Math.round((_journal.dayRewardSum / total) * 1000) / 1000,
      explorationRate: Math.round((_journal.dayExploratoryCount / total) * 1000) / 1000,
      entropy: Math.round(entropy * 1000) / 1000,
      lzc: lzc,
      qhash: Math.round(qhash * 100) / 100,
      decisions: _journal.dayDecisionCount,
      totalReward: Math.round(_journal.dayRewardSum * 100) / 100,
      personality: Array.from(pers),
      dominantTrait: dominantPersonalityTrait(pers),
      // Phase 19C: Enhanced academic metrics
      avgQDelta: Math.round(avgQDelta * 10000) / 10000,
      policyStability: Math.round(policyStability * 1000) / 1000,
      cumulativeReward: Math.round(_decision.totalReward * 100) / 100,
      qtableSize: _qtable.size,
      baselineMode: _baseline.mode,
      season: _season.current,
    };

    // Reset daily convergence trackers
    _journal._qDeltaSum = 0;
    _journal._qDeltaCount = 0;
    _journal._policyChanges = 0;

    _journal.dailyAggregates.push(agg);

    // Persist daily aggregates
    try {
      localStorage.setItem(CFG.storageKeys.dailyAgg,
        JSON.stringify(_journal.dailyAggregates));
    } catch (e) { /* storage full */ }

    // Check if Q-table snapshot is due (every 7 days)
    if (_journal.dailyAggregates.length % CFG.journal.qtableSnapshotDays === 0) {
      _snapshotQTable();
    }
  }

  // Lempel-Ziv complexity: count unique substrings in recent mood sequence
  function _computeLZC() {
    const buf = _journal.ringBuffer;
    if (buf.length < 10) return 0;
    // Build mood sequence from today's entries
    const dk = _journal.lastDayKey;
    let seq = '';
    for (let i = buf.length - 1; i >= 0 && seq.length < 500; i--) {
      seq = String(buf[i].mood) + seq;
    }
    if (seq.length < 2) return 0;
    // Exhaustive LZ76 complexity
    let complexity = 1;
    let i = 0, k = 1, kmax = 1, l = 1;
    while (l + k <= seq.length) {
      if (seq[i + k - 1] === seq[l + k - 1]) {
        k++;
      } else {
        if (k > kmax) kmax = k;
        i++;
        if (i === l) {
          complexity++;
          l += kmax;
          k = 1; kmax = 1; i = 0;
        } else {
          k = 1;
        }
      }
    }
    if (k !== 1) complexity++;
    return complexity;
  }

  function _snapshotQTable() {
    const key = 'lili_qtable_snapshot_' + _journal.lastDayKey.replace(/-/g, '');
    try {
      localStorage.setItem(key, brainSerialize());
    } catch (e) { /* storage full */ }
  }

  // Save journal ring buffer to localStorage
  function journalSaveRingBuffer() {
    try {
      localStorage.setItem(CFG.storageKeys.journal,
        JSON.stringify(_journal.ringBuffer));
    } catch (e) { /* storage full — ring buffer is least critical */ }
  }

  // Load journal data from localStorage
  function journalLoad() {
    try {
      const rb = localStorage.getItem(CFG.storageKeys.journal);
      if (rb) _journal.ringBuffer = JSON.parse(rb);
    } catch (e) { /* ignore corrupt data */ }
    try {
      const daily = localStorage.getItem(CFG.storageKeys.dailyAgg);
      if (daily) _journal.dailyAggregates = JSON.parse(daily);
    } catch (e) { /* ignore corrupt data */ }
    try {
      const ms = localStorage.getItem(CFG.storageKeys.milestones);
      if (ms) _journal.milestones = JSON.parse(ms);
    } catch (e) { /* ignore */ }
    _journal.lastDayKey = _dayKey();
  }

  // Save milestones
  function journalSaveMilestones() {
    try {
      localStorage.setItem(CFG.storageKeys.milestones,
        JSON.stringify(_journal.milestones));
    } catch (e) { /* storage full */ }
  }

  // =========================================================================
  // 8C — Export system (academic data retention)
  // Key 'E' → download full JSON export
  // =========================================================================

  function exportData(returnOnly) {
    // Flush current day aggregate
    if (_journal.dayDecisionCount > 0) {
      _flushDailyAggregate();
    }

    const genesisMs = parseInt(localStorage.getItem(CFG.storageKeys.genesis) || '0', 10);
    const d = new Date();
    const dateStr = d.getFullYear() +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');

    // Phase 17: Personality snapshot for export
    const pers = computePersonalityProfile();

    const exportObj = {
      format: 'lili_export_v2',
      stateVersion: CFG.stateSpace.version,
      exportDate: d.toISOString(),
      metadata: {
        genesis: genesisMs,
        ageMs: age.elapsedMs,
        phase: age.phase,
        phaseProgress: age.phaseProgress,
        urlHash: _hashString(location.hostname + location.pathname),
        totalDecisions: _decision.totalDecisions,
        totalReward: _decision.totalReward,
        qtableSize: _qtable.size,
        personality: Array.from(pers),
        dominantTrait: dominantPersonalityTrait(pers),
      },
      qtable: [],
      visitCounts: Array.from(_visitCounts.entries()),
      stateVisits: Array.from(_stateVisitCounts.entries()),
      dailyAggregates: _journal.dailyAggregates,
      milestones: _journal.milestones,
      recentDecisions: _journal.ringBuffer.slice(-1000), // last 1000
      placeMemory: JSON.parse(placeMemorySerialize()),     // Phase 15A
      visitProfile: JSON.parse(visitProfileSerialize()),   // Phase 15C
      domLearning: JSON.parse(domLearningSerialize()),     // Phase 15D
    };

    // Serialize Q-table
    _qtable.forEach(function (q, key) {
      exportObj.qtable.push({ s: key, q: Array.from(q) });
    });

    console.info('[Lili] Export: ' + exportObj.qtable.length + ' Q-states, ' +
      exportObj.dailyAggregates.length + ' daily aggregates, ' +
      exportObj.milestones.length + ' milestones');

    // lili.data() returns the object; lili.export() downloads the file
    if (returnOnly) return exportObj;

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lili_export_' + dateStr + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return exportObj;
  }

  // Simple string hash (for URL identification without storing full URL)
  function _hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h;
  }

  // =========================================================================
  // 19C — CSV Export (daily aggregates → CSV for R/Python/Excel analysis)
  // =========================================================================

  function exportCSV() {
    var aggs = _journal.dailyAggregates;
    if (aggs.length === 0) {
      console.warn('[Lili] No daily aggregates to export');
      return null;
    }

    // Header
    var header = 'day,ageMs,phase,decisions,avgReward,totalReward,cumulativeReward,' +
      'explorationRate,entropy,lzc,qhash,qtableSize,policyStability,avgQDelta,' +
      'baselineMode,season,dominantTrait';
    for (var m = 0; m < MOOD_COUNT; m++) header += ',mood_' + CFG.moods[m];
    for (var p = 0; p < MOOD_COUNT; p++) header += ',pers_' + CFG.moods[p];
    header += '\n';

    var rows = '';
    for (var i = 0; i < aggs.length; i++) {
      var a = aggs[i];
      rows += a.day + ',' + a.ageMs + ',' + a.phase + ',' + a.decisions + ',' +
        a.avgReward + ',' + a.totalReward + ',' + (a.cumulativeReward || '') + ',' +
        a.explorationRate + ',' + a.entropy + ',' + a.lzc + ',' + a.qhash + ',' +
        (a.qtableSize || '') + ',' + (a.policyStability || '') + ',' +
        (a.avgQDelta || '') + ',' + (a.baselineMode || 'off') + ',' +
        (a.season || '') + ',' + (a.dominantTrait || '');
      for (var m2 = 0; m2 < MOOD_COUNT; m2++) {
        rows += ',' + (a.moodDist ? a.moodDist[m2] : 0);
      }
      for (var p2 = 0; p2 < MOOD_COUNT; p2++) {
        rows += ',' + (a.personality ? a.personality[p2].toFixed(3) : 0);
      }
      rows += '\n';
    }

    var csv = header + rows;
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var el = document.createElement('a');
    el.href = url;
    el.download = 'lili_daily_' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    URL.revokeObjectURL(url);
    console.info('[Lili] CSV exported: ' + aggs.length + ' daily aggregates');
    return csv;
  }

  // =========================================================================
  // 10A — Click detection + Tooltip
  // Click on Lili = factual tooltip (name, age, phase, preference, visits)
  // =========================================================================

  let _tooltipEl = null;
  let _tooltipTimer = 0;

  function onLiliClick(e) {
    // Convert viewport click to document coords for hit test
    const docX = e.clientX + scrollOx;
    const docY = e.clientY + scrollOy;
    const dx = docX - lili.pos.x;
    const dy = docY - lili.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > lili.bodyR * CFG.clickHitboxScale) return;

    showTooltip(e.clientX, e.clientY);
  }

  // Mobile: touchstart on canvas area (click may not fire through pointer-events:none)
  function onLiliTouch(e) {
    if (!e.touches || !e.touches[0]) return;
    const t = e.touches[0];
    // Convert viewport touch to document coords for hit test
    const docX = t.clientX + scrollOx;
    const docY = t.clientY + scrollOy;
    const dx = docX - lili.pos.x;
    const dy = docY - lili.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > lili.bodyR * CFG.clickHitboxScale) return;

    // No preventDefault() — passive listener, must not block mobile scroll
    showTooltip(t.clientX, t.clientY);
  }

  function showTooltip(x, y) {
    // Remove any existing tooltip
    hideTooltip();

    // Format age as human-readable string
    const ms = age.elapsedMs;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    let ageStr;
    if (days >= 365) {
      const yrs = (days / 365).toFixed(1);
      ageStr = yrs + ' years';
    } else if (days > 0) {
      ageStr = days + 'd ' + hours + 'h';
    } else {
      ageStr = hours + 'h ' + Math.floor((ms % 3600000) / 60000) + 'm';
    }

    // Find top Q-action (preference) from Q-table
    const q = _qtable.get(sensors.stateIndex);
    let topMood = lili.mood;
    if (q) {
      let maxQ = -Infinity;
      for (let i = 0; i < MOOD_COUNT; i++) {
        if (q[i] > maxQ) { maxQ = q[i]; topMood = CFG.moods[i]; }
      }
    }

    const visits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '1', 10);

    // Create tooltip DOM element
    const el = document.createElement('div');
    el.className = 'lili-tooltip';
    el.style.cssText =
      'position:fixed;z-index:' + (CFG.canvasZIndex + 1) + ';' +
      'font-family:monospace;font-size:12px;line-height:1.5;' +
      'background:rgba(10,12,18,0.88);color:#e0e4ec;' +
      'padding:8px 12px;border-radius:6px;pointer-events:none;' +
      'white-space:nowrap;backdrop-filter:blur(4px);' +
      'border:1px solid rgba(255,255,255,0.08);' +
      'box-shadow:0 4px 12px rgba(0,0,0,0.3);' +
      'opacity:0;transition:opacity 0.2s ease;';

    // Phase 13E: mood-colored dot
    const moodDotColors = {
      curious:   '#5dd9c4', playful: '#e8a84c', shy:    '#9baec0',
      calm:      '#4a7fb5', alert:   '#e06050', idle:   '#6c7a8a',
      exploring: '#6dd480',
    };
    const dotColor = moodDotColors[lili.mood] || '#888';

    // Phase 17: personality trait
    var pers = computePersonalityProfile();
    var dominant = dominantPersonalityTrait(pers);

    var baselineTag = _baseline.mode !== 'off' ?
      '<br><span style="color:#f88">BASELINE: ' + _baseline.mode + '</span>' : '';

    el.innerHTML =
      '<b style="color:#8cf">Lili</b> ' +
      '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;' +
      'background:' + dotColor + ';vertical-align:middle"></span><br>' +
      '<span style="color:#667">Autonomous octopus living on this page.</span><br>' +
      '<span style="color:#6a8">' + age.phase + '</span> · ' + ageStr + ' · ' + lili.mood +
      '<br><span style="color:#a8a">' + dominant + ' personality</span>' +
      baselineTag;

    // Position: prefer above the click point, shift to stay in viewport
    document.body.appendChild(el);
    const rect = el.getBoundingClientRect();
    let tx = x - rect.width * 0.5;
    let ty = y - rect.height - 16;
    if (ty < 4) ty = y + 20;
    if (tx < 4) tx = 4;
    if (tx + rect.width > W - 4) tx = W - rect.width - 4;
    el.style.left = tx + 'px';
    el.style.top = ty + 'px';

    // Fade in
    requestAnimationFrame(function () { el.style.opacity = '1'; });

    _tooltipEl = el;
    _tooltipTimer = setTimeout(hideTooltip, CFG.tooltipDurationMs);
  }

  function hideTooltip() {
    clearTimeout(_tooltipTimer);
    if (_tooltipEl) {
      _tooltipEl.style.opacity = '0';
      const el = _tooltipEl;
      _tooltipEl = null;
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    }
  }

  // =========================================================================
  // 10B — Debug panel (key 'D')
  // Fixed-position overlay with real-time runtime data.
  // =========================================================================

  let _debugPanel = null;
  let _debugVisible = false;
  let _fpsBuffer = new Float32Array(60);
  let _fpsIndex = 0;
  let _fpsAvg = 60;

  function toggleDebug() {
    _debugVisible = !_debugVisible;
    if (_debugVisible) {
      if (!_debugPanel) createDebugPanel();
      _debugPanel.style.display = 'block';
    } else if (_debugPanel) {
      _debugPanel.style.display = 'none';
    }
  }

  function createDebugPanel() {
    const el = document.createElement('div');
    el.className = 'lili-debug';
    el.style.cssText =
      'position:fixed;top:8px;right:8px;z-index:' + (CFG.canvasZIndex + 2) + ';' +
      'font-family:monospace;font-size:11px;line-height:1.6;' +
      'background:rgba(8,10,16,0.82);color:#c8ccd4;' +
      'padding:10px 14px;border-radius:6px;pointer-events:none;' +
      'white-space:pre;backdrop-filter:blur(6px);' +
      'border:1px solid rgba(255,255,255,0.06);' +
      'min-width:220px;display:none;';
    document.body.appendChild(el);
    _debugPanel = el;
  }

  // FPS tracking (always runs, independent of debug panel)
  function updateFps() {
    const fps = dt > 0 ? (1 / dt) : 60;
    _fpsBuffer[_fpsIndex % 60] = fps;
    _fpsIndex++;
    let fpsSum = 0;
    const fpsN = Math.min(_fpsIndex, 60);
    for (let i = 0; i < fpsN; i++) fpsSum += _fpsBuffer[i];
    _fpsAvg = fpsSum / fpsN;
  }

  // --- Phase 17: Personality profile from Q-table ---
  function computePersonalityProfile() {
    const profile = new Float64Array(MOOD_COUNT);
    const counts = new Float64Array(MOOD_COUNT);
    _qtable.forEach(function (q) {
      for (let i = 0; i < MOOD_COUNT; i++) {
        if (q[i] !== 0) { profile[i] += q[i]; counts[i]++; }
      }
    });
    for (let i = 0; i < MOOD_COUNT; i++) {
      profile[i] = counts[i] > 0 ? profile[i] / counts[i] : 0;
    }
    // Normalize to 0..1
    let minV = Infinity, maxV = -Infinity;
    for (let i = 0; i < MOOD_COUNT; i++) {
      if (profile[i] < minV) minV = profile[i];
      if (profile[i] > maxV) maxV = profile[i];
    }
    const range = maxV - minV || 1;
    for (let i = 0; i < MOOD_COUNT; i++) {
      profile[i] = (profile[i] - minV) / range;
    }
    return profile;
  }

  function dominantPersonalityTrait(profile) {
    let maxIdx = 0;
    for (let i = 1; i < MOOD_COUNT; i++) {
      if (profile[i] > profile[maxIdx]) maxIdx = i;
    }
    return CFG.moods[maxIdx];
  }

  function updateDebugPanel() {
    if (!_debugVisible || !_debugPanel) return;

    // Shannon entropy (real-time from daily counters)
    let entropy = 0;
    const total = _journal.dayDecisionCount || 1;
    for (let i = 0; i < MOOD_COUNT; i++) {
      const p = _journal.dayActionCounts[i] / total;
      if (p > 0) entropy -= p * Math.log2(p);
    }

    // Q-values for current state
    const q = _qtable.get(sensors.stateIndex);
    let qStr = '—';
    if (q) {
      const parts = [];
      for (let i = 0; i < MOOD_COUNT; i++) {
        parts.push(CFG.moods[i].charAt(0).toUpperCase() + ':' + q[i].toFixed(2));
      }
      qStr = parts.join(' ');
    }

    // Tentacle stats
    let recoilCount = 0, touchingCount = 0, grabbingCount = 0;
    for (let t = 0; t < TENT_N; t++) {
      if (tentacles[t].recoilTimer > 0) recoilCount++;
      if (tentacles[t].touching) touchingCount++;
      if (tentacles[t].heldElement) grabbingCount++;
    }

    // Phase 13E: mood history string
    let moodHistStr = '';
    for (let i = _moodHistory.length - 1; i >= 0 && i >= _moodHistory.length - 5; i--) {
      const mh = _moodHistory[i];
      const ago = Math.round((Date.now() - mh.time) / 1000);
      moodHistStr += '\n  ' + mh.from + '→' + mh.to + ' ' + ago + 's ago';
    }

    _debugPanel.textContent =
      '── Lili Debug ──────────\n' +
      'phase:    ' + age.phase + ' (' + (age.phaseProgress * 100).toFixed(1) + '%)\n' +
      'age:      ' + (age.elapsedMs / 86400000).toFixed(2) + ' days\n' +
      'mood:     ' + lili.mood + (_decision.wasExploratory ? ' (ε)' : '') +
        ' [blend:' + lili.moodBlend.toFixed(2) + ']\n' +
      'stress:   ' + stress.toFixed(3) + '\n' +
      'vel:      ' + lili.vel.mag().toFixed(2) + ' px/f\n' +
      '── Mood History ────────' + (moodHistStr || '\n  (none)') + '\n' +
      '── Sensors ─────────────\n' +
      'cursor:   ' + sensors.cursorProximity + '/' + sensors.cursorVelocity + '\n' +
      'dom:      ' + sensors.domDensity + '  ws:' + sensors.whitespace + '\n' +
      'scroll:   ' + sensors.scrollState + '  time:' + sensors.timeOfDay + '\n' +
      'state#:   ' + sensors.stateIndex + '/' + CFG.stateSpace.totalStates + '\n' +
      '── RL ──────────────────\n' +
      'Q:        ' + qStr + '\n' +
      'decisions:' + _decision.totalDecisions + '\n' +
      'reward Σ: ' + _decision.totalReward.toFixed(1) + '\n' +
      'Q-states: ' + _qtable.size + '\n' +
      'entropy:  ' + entropy.toFixed(3) + '\n' +
      'LZC:      ' + _computeLZC() + '\n' +
      '── DOM ─────────────────\n' +
      'disturbed:' + _domState.disturbedCount + '/' + CFG.dom.maxDisturbed + '\n' +
      'held:     ' + _domState.heldCount + '/' + CFG.dom.maxHeld + '\n' +
      'tentRecoil:' + recoilCount + ' touch:' + touchingCount + ' grab:' + grabbingCount + '\n' +
      'hash cells:' + spatialHash.grid.size + '  objs:' + spatialHash.all.length + '\n' +
      '── Phase 15 ────────────\n' +
      'placeGrid:' + _placeMemory.grid.size + ' cells\n' +
      'circadian:' + (_circadian.isAsleep ? 'SLEEP' : 'awake') + ' act:' + _circadian.activityMul.toFixed(2) + '\n' +
      'trust:    ' + _visitProfile.trustLevel.toFixed(2) + ' (' + _visitProfile.totalVisits + ' visits)\n' +
      'domPref:  ' + Object.keys(_domLearning.preferences).map(function(k) { return k[0] + ':' + _domLearning.preferences[k].toFixed(2); }).join(' ') + '\n' +
      'ink:      ' + _ink.activeCount + '/' + CFG.ink.poolSize + '\n' +
      '── Phase 16 ────────────\n' +
      'novelRects:' + _novelty.pendingNewRects.length + ' seen:' + _novelty.seenKeys.length + '\n' +
      'bubbles:  ' + _bubbles.activeCount + '/' + CFG.bubbles.poolSize + '\n' +
      '── Phase 17 (Brain v2) ─\n' +
      'tau:      ' + Math.max(ageVal(CFG.rl.temperature), CFG.rl.softmaxMinTemp).toFixed(2) + '\n' +
      'alpha(s): ' + _getAlpha(sensors.stateIndex, lili.moodIndex).toFixed(4) + '\n' +
      'traces:   ' + _traces.size + '/' + CFG.rl.traceMaxEntries + '\n' +
      'visits:   ' + _visitCounts.size + ' (s,m) pairs\n' +
      'stateVis: ' + _stateVisitCounts.size + ' states\n' +
      'plan:     ' + (_activePlan.planIndex >= 0 ? CFG.moodPlans.plans[_activePlan.planIndex].name + ' [' + _activePlan.stepIndex + '/' + CFG.moodPlans.plans[_activePlan.planIndex].sequence.length + ']' : 'none') + '\n' +
      'momentum: ' + sensors.momentum + '  trust:' + sensors.trust + '\n' +
      '── Phase 18 (Alive) ────\n' +
      'microExpr:S=' + _microExpr.startle.toFixed(2) + ' J=' + _microExpr.joy.toFixed(2) + ' R=' + _microExpr.relief.toFixed(2) + ' C=' + _microExpr.curiosityTilt.toFixed(2) + '\n' +
      'psychosom:stress=' + _psychosom.stressAvg.toFixed(2) + ' reward=' + _psychosom.rewardAvg.toFixed(2) + '\n' +
      'genesis:  bX=' + _genesis.bodyXScale.toFixed(2) + ' bY=' + _genesis.bodyYScale.toFixed(2) + ' tW=' + _genesis.tentacleWidth.toFixed(2) + '\n' +
      'sleep:    ' + (_circadian.isAsleep ? 'REM:' + (_sleepAnim.remArm >= 0 ? 'arm' + _sleepAnim.remArm : 'off') : 'awake') + '\n' +
      'chromato: ' + Math.round(ageVal(CFG.chromatophoreCells.countByAge) || 0) + ' cells\n' +
      'ambient:  bg=' + _ambient.lightness.toFixed(2) + ' adapted=' + _ambient.adapted.toFixed(2) + ' L' + (_ambient.lightnessShift >= 0 ? '+' : '') + _ambient.lightnessShift.toFixed(1) + ' glow×' + _ambient.glowMul.toFixed(2) + '\n' +
      (function () {
        var pers = computePersonalityProfile();
        var s = '── Personality ─────────\n';
        for (var pi = 0; pi < MOOD_COUNT; pi++) {
          var barLen = Math.round(pers[pi] * 10);
          s += '  ' + (CFG.moods[pi] + '         ').substring(0, 9) + ' ';
          for (var bi = 0; bi < 10; bi++) s += bi < barLen ? '\u2588' : '\u2591';
          s += ' ' + pers[pi].toFixed(2) + '\n';
        }
        s += '  dominant: ' + dominantPersonalityTrait(pers);
        return s;
      })() + '\n' +
      'inkTrail: ' + _inkTrail.marks.length + '/' + CFG.ink.trailMaxMarks + '\n' +
      '── Phase 19 (Academic) ─\n' +
      'baseline: ' + _baseline.mode + '\n' +
      'replay:   ' + (_replay.recording ? 'REC' : _replay.playing ? 'PLAY' : 'off') +
        (_replay.events.length ? ' (' + _replay.events.length + ' ev)' : '') + '\n' +
      'avgQΔ:    ' + (_journal._qDeltaCount > 0 ? (_journal._qDeltaSum / _journal._qDeltaCount).toFixed(5) : '—') + '\n' +
      'polStab:  ' + (1 - (_journal._policyChanges / Math.max(_journal.dayDecisionCount, 1))).toFixed(3) + '\n' +
      '── Phase 21-29 ─────────\n' +
      'season:   ' + _season.current + '\n' +
      'sound:    ' + (_sound.enabled ? 'on' : 'off') + '\n' +
      'offspring:' + _offspring.count + '/' + CFG.offspring.maxOffspring + '\n' +
      'dream:    ' + (_dream.sleeping ? _dream.replaysThisSleep + '/' + CFG.dream.maxPerSleep + ' replays' : 'awake') + '\n' +
      'habitat:  ' + _habitat.pageType + ' hue=' + Math.round(_habitat.dominantHue) + ' shift=' + _habitat.hueShift.toFixed(1) + '\n' +
      'signals:  ' + (_signals.welcomeActive ? 'wave' : _signals.excitementActive ? 'flash' : _signals.calmFrames > CFG.signals.contentmentMinCalm ? 'content' : '—') + '\n' +
      'biotrail: ' + _bioTrail.particles.length + '/' + CFG.biolum.trailMaxParticles + '\n' +
      '── Phase 30-35 ─────────\n' +
      'anticip:  ' + (_anticipation.approaching ? 'APPROACH ' : '') + _anticipation.intensity.toFixed(2) + '\n' +
      'energy:   ' + _energy.level.toFixed(1) + '/' + CFG.energy.max + (_energy.fatigued ? ' TIRED' : '') + '\n' +
      'habitu:   cursor=' + _habituation.cursor.toFixed(2) + ' scroll=' + _habituation.scroll.toFixed(2) + '\n' +
      'cogMap:   ' + _cogMap.cells.size + '/' + CFG.cogMap.maxCells + ' cells\n' +
      'cursor:   ' + _cursorPattern.pattern + ' (' + _cursorPattern.directionChanges + ' chg)\n' +
      'focus:    ' + attentionGetFocus() + '\n' +
      '── Phase 36-41 ─────────\n' +
      'temporal: hr=' + new Date().getHours() + ' obs=' + _temporal.bins[new Date().getHours()].observations + '\n' +
      'temper:   B=' + _temperament.boldness.toFixed(2) + ' S=' + _temperament.sociability.toFixed(2) + ' A=' + _temperament.activity.toFixed(2) + ' E=' + _temperament.emotionality.toFixed(2) + '\n' +
      'surprise: ' + _surprise.intensity.toFixed(2) + ' \u03B1\u00D7' + _surprise.alphaBoost.toFixed(2) + '\n' +
      'inkDef:   ' + _inkDefense.particles.length + ' particles\n' +
      'camo:     ' + (_camouflage.intensity * 100).toFixed(0) + '% (sat=' + _camouflage.satShift.toFixed(1) + ' lit=' + _camouflage.litShift.toFixed(1) + ')\n' +
      'growth:   ' + growthScale().toFixed(3) + '\u00D7\n' +
      '── Phase 42-52 ─────────\n' +
      'touch:    ' + (_touch.caressing ? 'CARESS' : _touch.isDown ? 'DOWN' : '—') + '\n' +
      'death:    ' + (_death.active ? (_death.fadeProgress * 100).toFixed(0) + '%' : '—') + '\n' +
      'pageMem:  ' + Object.keys(_pageMemory.pages).length + '/' + CFG.pageMemory.maxPages + ' pages\n' +
      'metaLrn:  ' + _metaLearn.stability + ' \u03B1\u00D7' + _metaLearn.alphaMul.toFixed(2) + '\n' +
      'worker:   ' + (_brainWorker ? (_brainWorkerReady ? 'ready' : 'init') : 'off') + '\n' +
      'narrate:  ' + _narrative.entries.length + ' entries\n' +
      '── Perf ────────────────\n' +
      'FPS:      ' + _fpsAvg.toFixed(1) + (_fpsAvg < 50 ? ' \u26A0' : '') + '\n' +
      'frame#:   ' + frameCount;
  }

  // Console API — exposed as window.lili after boot
  function exposeConsoleAPI() {
    window.lili = Object.freeze({
      export: function () { exportData(); },
      import: function () { importData(); },
      debug:  function () { toggleDebug(); },
      sync:   function () { _sync.dirty = true; syncSave(); },
      status: function () {
        var ageDays = (Date.now() - age.genesisMs) / 86400000;
        var visits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10);
        var syncAge = _sync.lastSyncMs ? ((Date.now() - _sync.lastSyncMs) / 1000).toFixed(0) + 's ago' : 'never';
        console.info(
          '[Lili] Status\n' +
          '  Phase: ' + age.phase + ' (' + (age.phaseProgress * 100).toFixed(1) + '%)\n' +
          '  Age: ' + ageDays.toFixed(1) + ' days\n' +
          '  Mood: ' + MOODS[lili.moodIndex] + '\n' +
          '  Visits: ' + visits + '\n' +
          '  Q-states: ' + _qtable.size + '\n' +
          '  Decisions: ' + _decision.totalDecisions + '\n' +
          '  Milestones: ' + _journal.milestones.length + '\n' +
          '  Daily aggregates: ' + _journal.dailyAggregates.length + '\n' +
          '  Trust: ' + _visitProfile.trustLevel.toFixed(2) + '\n' +
          '  Circadian: ' + (_circadian.isAsleep ? 'sleeping' : 'awake') + '\n' +
          '  Psychosom: stress=' + _psychosom.stressAvg.toFixed(2) + ' reward=' + _psychosom.rewardAvg.toFixed(2) + '\n' +
          '  Genesis: bodyX=' + _genesis.bodyXScale.toFixed(3) + ' bodyY=' + _genesis.bodyYScale.toFixed(3) + ' tilt=' + (_genesis.headTilt * 180 / Math.PI).toFixed(1) + '°\n' +
          '  Place memory: ' + _placeMemory.grid.size + ' cells\n' +
          '  Cloud sync: ' + syncAge + (_sync.dirty ? ' (dirty)' : '') + '\n' +
          '  Habitat: ' + _habitat.pageType + ' (hue shift ' + _habitat.hueShift.toFixed(1) + '°)\n' +
          '  Season: ' + _season.current + '\n' +
          '  Dream replays: ' + _dream.replaysThisSleep + '\n' +
          '  Energy: ' + _energy.level.toFixed(1) + '/' + CFG.energy.max + (_energy.fatigued ? ' (fatigued)' : '') + '\n' +
          '  Cursor: ' + _cursorPattern.pattern + '\n' +
          '  Habituation: cursor=' + _habituation.cursor.toFixed(2) + ' scroll=' + _habituation.scroll.toFixed(2)
        );
      },
      data: function () { return exportData(true); },
      // Phase 17: New console API
      traces: function () {
        var maxVal = 0;
        _traces.forEach(function (v) { if (v > maxVal) maxVal = v; });
        console.info('[Lili] Traces: ' + _traces.size + ' entries, max=' + maxVal.toFixed(4));
        return { size: _traces.size, max: maxVal };
      },
      visitCounts: function () {
        console.info('[Lili] Visit counts: ' + _visitCounts.size + ' (s,m) pairs, ' +
          _stateVisitCounts.size + ' unique states');
        return { smPairs: _visitCounts.size, states: _stateVisitCounts.size };
      },
      personality: function () {
        var pers = computePersonalityProfile();
        var result = {};
        for (var i = 0; i < MOOD_COUNT; i++) {
          result[CFG.moods[i]] = Math.round(pers[i] * 100) / 100;
        }
        result.dominant = dominantPersonalityTrait(pers);
        console.info('[Lili] Personality:', result);
        return result;
      },
      plan: function () {
        if (_activePlan.planIndex < 0) {
          console.info('[Lili] No active plan');
          return null;
        }
        var p = CFG.moodPlans.plans[_activePlan.planIndex];
        var info = { name: p.name, step: _activePlan.stepIndex + '/' + p.sequence.length,
                     mood: p.sequence[_activePlan.stepIndex], accReward: _activePlan.accumulatedReward };
        console.info('[Lili] Active plan:', info);
        return info;
      },
      // Phase 19A: Baseline controls
      baseline: function (mode) {
        if (mode && CFG.baseline.modes.indexOf(mode) >= 0) {
          _baseline.mode = mode;
          if (mode !== 'frozen') _baseline.frozenQtable = null;
          try { localStorage.setItem(CFG.storageKeys.baseline, mode); } catch (e) { /**/ }
          console.info('[Lili] Baseline mode: ' + mode);
          return mode;
        }
        return cycleBaseline();
      },
      // Phase 19B: Replay controls
      replayRecord: function () {
        if (_replay.recording) { replayStopRecording(); return 'stopped'; }
        replayStartRecording(); return 'recording';
      },
      replayPlay: function () {
        if (_replay.playing) { replayStopPlayback(); return 'stopped'; }
        replayStartPlayback(); return 'playing';
      },
      replayExport: function () { return replayExport(); },
      // Phase 19C: CSV export
      exportCSV: function () { return exportCSV(); },
      // Phase 22: Sound toggle
      sound: function () { return soundToggle(); },
      // Phase 24: Offspring
      reproduce: function () { return offspringCreate(); },
      // Phase 25-29: New console API
      habitat: function () {
        console.info('[Lili] Habitat: type=' + _habitat.pageType + ', dominantHue=' + Math.round(_habitat.dominantHue) + ', hueShift=' + _habitat.hueShift.toFixed(1));
        return { type: _habitat.pageType, hue: _habitat.dominantHue, shift: _habitat.hueShift };
      },
      dream: function () {
        console.info('[Lili] Dream: ' + (_dream.sleeping ? 'sleeping, ' + _dream.replaysThisSleep + ' replays' : 'awake'));
        return { sleeping: _dream.sleeping, replays: _dream.replaysThisSleep };
      },
      // Phase 30-35: New console API
      energy: function () {
        console.info('[Lili] Energy: ' + _energy.level.toFixed(1) + '/' + CFG.energy.max +
          (_energy.fatigued ? ' (fatigued)' : '') + (_energy.critical ? ' (critical!)' : ''));
        return { level: _energy.level, fatigued: _energy.fatigued, critical: _energy.critical };
      },
      attention: function () {
        var focus = attentionGetFocus();
        console.info('[Lili] Attention focus: ' + focus + ', weights:', _attention.weights);
        return { focus: focus, weights: Object.assign({}, _attention.weights) };
      },
      cogmap: function () {
        console.info('[Lili] Cognitive map: ' + _cogMap.cells.size + ' cells');
        return { cells: _cogMap.cells.size };
      },
      // Phase 36-41: New console API
      temporal: function () {
        var exp = temporalGetExpectation();
        var hr = new Date().getHours();
        console.info('[Lili] Temporal: hour=' + hr + ', observations=' + _temporal.bins[hr].observations +
          (exp ? ', expected stress=' + exp.stress.toFixed(2) + ', activity=' + exp.activity.toFixed(2) : ' (not enough data)'));
        return { hour: hr, bins: _temporal.bins.map(function (b) { return { stress: b.stress, activity: b.activity, obs: b.observations }; }) };
      },
      temperament: function () {
        console.info('[Lili] Temperament: boldness=' + _temperament.boldness.toFixed(3) +
          ' sociability=' + _temperament.sociability.toFixed(3) +
          ' activity=' + _temperament.activity.toFixed(3) +
          ' emotionality=' + _temperament.emotionality.toFixed(3));
        return {
          boldness: _temperament.boldness, sociability: _temperament.sociability,
          activity: _temperament.activity, emotionality: _temperament.emotionality
        };
      },
      surprise: function () {
        console.info('[Lili] Surprise: intensity=' + _surprise.intensity.toFixed(3) +
          ', lastTD=' + _surprise.lastTdError.toFixed(3) +
          ', alphaBoost=' + _surprise.alphaBoost.toFixed(3));
        return { intensity: _surprise.intensity, lastTdError: _surprise.lastTdError, alphaBoost: _surprise.alphaBoost };
      },
      // Phase 46-52: New console API
      narrative: function () {
        var text = narrativeGenerate();
        console.info('[Lili] Life Narrative:\n' + text);
        return text;
      },
      pages: function () {
        console.info('[Lili] Page memory: ' + Object.keys(_pageMemory.pages).length + ' pages', _pageMemory.pages);
        return _pageMemory.pages;
      },
      metalearning: function () {
        console.info('[Lili] Meta-learning: stability=' + _metaLearn.stability + ', alphaMul=' + _metaLearn.alphaMul.toFixed(3));
        return { stability: _metaLearn.stability, alphaMul: _metaLearn.alphaMul };
      },
      brain: function () {
        console.info('[Lili] Q-table: ' + _qtable.size + ' states, worker=' + (_brainWorker ? 'active' : 'off'));
        return { states: _qtable.size, worker: !!_brainWorker };
      },
    });
    console.info('[Lili] Console API ready — try: lili.status(), lili.narrative(), lili.pages(), lili.brain()');

    // Dev mode — secret Ctrl+Shift+L combo unlocks debug shortcuts
    var _devMode = false;

    // Keyboard handler (unified)
    document.addEventListener('keydown', function (e) {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
          e.target.isContentEditable) return;

      var k = e.key.toLowerCase();

      // Secret dev mode toggle: Ctrl+Shift+L
      if (k === 'l' && e.ctrlKey && e.shiftKey) {
        _devMode = !_devMode;
        console.info('[Lili] Dev mode: ' + (_devMode ? 'ON' : 'OFF'));
        return;
      }

      // Sound toggle is always available (user-facing)
      if (k === 's' && !e.ctrlKey && !e.metaKey) { soundToggle(); return; }

      // Everything else requires dev mode
      if (!_devMode) return;

      if (k === 'd') toggleDebug();
      else if (k === 'e') exportData();
      else if (k === 'i') importData();
      else if (k === 'b') cycleBaseline();
      else if (k === 'r') {
        if (_replay.recording) replayStopRecording();
        else if (_replay.playing) replayStopPlayback();
        else replayStartRecording();
      }
    });
  }

  // =========================================================================
  // 11A — Persistence: position save/restore, session continuity
  // =========================================================================

  function savePosition() {
    try {
      localStorage.setItem(CFG.storageKeys.position, JSON.stringify({
        x: Math.round(lili.pos.x),
        y: Math.round(lili.pos.y),
        mood: lili.moodIndex,
        dw: docW, dh: docH,  // document size at save time (for clamping on restore)
      }));
    } catch (e) { /* storage full */ }
  }

  function restorePosition() {
    try {
      const json = localStorage.getItem(CFG.storageKeys.position);
      if (!json) return false;
      const data = JSON.parse(json);
      if (typeof data.x !== 'number' || typeof data.y !== 'number') return false;

      // Clamp to current document bounds (page layout may have changed since save)
      const margin = lili.bodyR * 2;
      lili.pos.x = Math.max(margin, Math.min(data.x, docW - margin));
      lili.pos.y = Math.max(margin, Math.min(data.y, docH - margin));

      // Restore mood if valid
      if (typeof data.mood === 'number' && data.mood >= 0 && data.mood < MOOD_COUNT) {
        lili.moodIndex = data.mood;
        lili.mood = CFG.moods[data.mood];
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // =========================================================================
  // 11B — Safari ITP mitigation, data loss detection, import
  // =========================================================================

  // Request persistent storage (protects against storage pressure on Chrome/Firefox)
  // Does NOT protect against Safari ITP 7-day eviction.
  function requestPersistentStorage() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(function (granted) {
        if (granted) console.info('[Lili] Persistent storage granted');
      });
    }
  }

  // Detect potential data loss (Safari ITP or manual clear)
  function detectDataLoss() {
    const visits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10);
    const genesis = parseInt(localStorage.getItem(CFG.storageKeys.genesis) || '0', 10);
    if (!genesis || visits <= 1) return; // first visit or new incarnation

    const ageDays = (Date.now() - genesis) / 86400000;
    const dailyAggs = _journal.dailyAggregates.length;

    // If Lili is > 7 days old but has very few daily aggregates, data may have been lost
    if (ageDays > 7 && dailyAggs < Math.floor(ageDays * 0.3)) {
      console.warn('[Lili] Possible data loss detected: ' +
        ageDays.toFixed(0) + ' days old but only ' + dailyAggs + ' daily aggregates. ' +
        'Safari ITP may have evicted data. Use lili.import() to restore a backup.');
    }
  }

  // Import previously exported JSON (key 'I')
  function importData() {
    // Create invisible file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.addEventListener('change', function () {
      if (!input.files || !input.files[0]) {
        document.body.removeChild(input);
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const data = JSON.parse(reader.result);
          if (!data || (data.format !== 'lili_export_v1' && data.format !== 'lili_export_v2')) {
            console.error('[Lili] Import failed: invalid format');
            return;
          }
          _importExportData(data);
          console.info('[Lili] Import successful');
        } catch (e) {
          console.error('[Lili] Import failed: ' + e.message);
        }
        document.body.removeChild(input);
      };
      reader.readAsText(input.files[0]);
    });

    input.click();
  }

  // =========================================================================
  // 14 — Cloud Sync (GitHub persistence via /api/lili)
  // Loads state on boot, saves periodically + beforeunload.
  // localStorage remains as offline fallback.
  // =========================================================================

  const _sync = {
    sha: null,            // GitHub file SHA (needed for PUT)
    timer: null,          // setInterval handle
    lastSyncMs: 0,        // timestamp of last successful sync
    dirty: false,         // true if local state changed since last sync
    loading: false,       // prevent concurrent requests
  };

  // Build state object for sync (same format as data/state.json)
  function _buildSyncState() {
    // Flush pending daily aggregate
    if (_journal.dayDecisionCount > 0) {
      _flushDailyAggregate();
    }
    return {
      format: 'lili_state_v2',
      stateVersion: CFG.stateSpace.version,
      lastSync: new Date().toISOString(),
      metadata: {
        genesis: age.genesisMs,
        visits: parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10),
        totalDecisions: _decision.totalDecisions,
        totalReward: _decision.totalReward,
        phase: age.phase,
        phaseProgress: age.phaseProgress,
        mood: lili.mood,
        psychosom: { s: +_psychosom.stressAvg.toFixed(4), r: +_psychosom.rewardAvg.toFixed(4) }, // Phase 18E
      },
      brain: JSON.parse(brainSerialize()),
      journal: {
        ringBuffer: _journal.ringBuffer.slice(-2000), // keep last 2000 for sync
        dailyAggregates: _journal.dailyAggregates,
        milestones: _journal.milestones,
      },
      placeMemory: JSON.parse(placeMemorySerialize()),
      visitProfile: JSON.parse(visitProfileSerialize()),
      domLearning: JSON.parse(domLearningSerialize()),
      // Phase 23: Social learning — aggregated anonymized behavioral stats
      socialStats: {
        avgStress: +stress.toFixed(3),
        dominantMood: lili.mood,
        personality: Array.from(computePersonalityProfile()),
        entropy: _journal.dailyAggregates.length > 0 ?
          _journal.dailyAggregates[_journal.dailyAggregates.length - 1].entropy : 0,
        season: _season.current,
        offspring: _offspring.count,
      },
    };
  }

  // Merge remote state into local (remote wins for brain if it has more decisions)
  function _applySyncState(remote) {
    if (!remote || (remote.format !== 'lili_state_v1' && remote.format !== 'lili_state_v2')) return false;

    var applied = false;

    // Genesis: keep the earliest
    if (remote.metadata && remote.metadata.genesis) {
      if (!age.genesisMs || remote.metadata.genesis < age.genesisMs) {
        age.genesisMs = remote.metadata.genesis;
        localStorage.setItem(CFG.storageKeys.genesis, String(age.genesisMs));
        updateAge();
      }
    }

    // Phase 18E: Merge psychosomatic data from remote (average both sides)
    if (remote.metadata && remote.metadata.psychosom) {
      var rp = remote.metadata.psychosom;
      _psychosom.stressAvg = (_psychosom.stressAvg + (rp.s || 0.3)) * 0.5;
      _psychosom.rewardAvg = (_psychosom.rewardAvg + (rp.r || 0)) * 0.5;
      psychosomRecompute();
      psychosomSave();
    }

    // Brain: remote wins if it has more lifetime decisions
    if (remote.brain && remote.metadata &&
        remote.metadata.totalDecisions > _decision.totalDecisions) {
      brainDeserialize(JSON.stringify(remote.brain));
      brainSave();
      applied = true;
    }

    // Visits: keep the higher count
    if (remote.metadata && remote.metadata.visits) {
      var localVisits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10);
      if (remote.metadata.visits > localVisits) {
        localStorage.setItem(CFG.storageKeys.visits, String(remote.metadata.visits));
      }
    }

    // Journal: merge daily aggregates (unique by day)
    if (remote.journal) {
      if (remote.journal.dailyAggregates && remote.journal.dailyAggregates.length) {
        var existingDays = new Set(_journal.dailyAggregates.map(function (a) { return a.day; }));
        for (var i = 0; i < remote.journal.dailyAggregates.length; i++) {
          if (!existingDays.has(remote.journal.dailyAggregates[i].day)) {
            _journal.dailyAggregates.push(remote.journal.dailyAggregates[i]);
          }
        }
        _journal.dailyAggregates.sort(function (a, b) { return a.day < b.day ? -1 : 1; });
        try { localStorage.setItem(CFG.storageKeys.dailyAgg, JSON.stringify(_journal.dailyAggregates)); }
        catch (e) { /* */ }
      }

      // Milestones: merge by type+ts
      if (remote.journal.milestones && remote.journal.milestones.length) {
        var existingMs = new Set(_journal.milestones.map(function (m) { return m.type + ':' + m.ts; }));
        for (var j = 0; j < remote.journal.milestones.length; j++) {
          var key = remote.journal.milestones[j].type + ':' + remote.journal.milestones[j].ts;
          if (!existingMs.has(key)) {
            _journal.milestones.push(remote.journal.milestones[j]);
          }
        }
        _journal.milestones.sort(function (a, b) { return a.ts - b.ts; });
        journalSaveMilestones();
      }
      applied = true;
    }

    // Phase 15: merge place memory, visit profile, dom learning
    if (remote.placeMemory) {
      placeMemoryDeserialize(JSON.stringify(remote.placeMemory));
      placeMemorySave();
    }
    if (remote.visitProfile) {
      visitProfileDeserialize(JSON.stringify(remote.visitProfile));
      computeTrust();
      visitProfileSave();
    }
    if (remote.domLearning) {
      domLearningDeserialize(JSON.stringify(remote.domLearning));
      domLearningSave();
    }

    return applied;
  }

  // Fetch state from server
  function syncLoad(callback) {
    if (!CFG.sync.enabled || _sync.loading) return;
    _sync.loading = true;

    fetch(CFG.sync.endpoint, { method: 'GET', cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        _sync.loading = false;
        if (!data || !data.state) {
          console.info('[Lili] Sync: no remote state found');
          if (callback) callback(false);
          return;
        }
        _sync.sha = data.sha;
        var applied = _applySyncState(data.state);
        console.info('[Lili] Sync: loaded from cloud' + (applied ? ' (merged)' : ' (local is newer)'));
        _sync.lastSyncMs = Date.now();
        if (callback) callback(applied);
      })
      .catch(function (err) {
        _sync.loading = false;
        console.warn('[Lili] Sync: load failed — using localStorage', err.message || err);
        if (callback) callback(false);
      });
  }

  // Push state to server
  function syncSave() {
    if (!CFG.sync.enabled || _sync.loading || !_sync.sha) return;
    if (!_sync.dirty && _decision.totalDecisions === 0) return;
    _sync.loading = true;

    var state = _buildSyncState();

    fetch(CFG.sync.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: state, sha: _sync.sha }),
    })
      .then(function (res) { return res.ok ? res.json() : res.json().then(function (e) { throw e; }); })
      .then(function (data) {
        _sync.loading = false;
        _sync.sha = data.sha;
        _sync.dirty = false;
        _sync.lastSyncMs = Date.now();
        console.info('[Lili] Sync: saved to cloud (' + _decision.totalDecisions + ' decisions)');
      })
      .catch(function (err) {
        _sync.loading = false;
        // On conflict, reload remote state and retry
        if (err && err.error === 'conflict') {
          console.info('[Lili] Sync: conflict detected, reloading remote...');
          syncLoad(function () { _sync.dirty = true; });
          return;
        }
        console.warn('[Lili] Sync: save failed', err.message || err.error || err);
        // Retry sooner
        setTimeout(function () { _sync.dirty = true; }, CFG.sync.retryMs);
      });
  }

  // Start periodic sync (called from boot, after initial load)
  function syncStart() {
    if (!CFG.sync.enabled) return;

    // Mark dirty whenever brain saves locally
    var origBrainSave = brainSave;
    brainSave = function () {
      origBrainSave();
      _sync.dirty = true;
    };

    // Periodic sync
    _sync.timer = setInterval(function () {
      if (_sync.dirty) syncSave();
    }, CFG.sync.intervalMs);

    // Sync on page unload (best-effort)
    window.addEventListener('beforeunload', function () {
      if (_sync.dirty && _sync.sha) {
        var state = _buildSyncState();
        navigator.sendBeacon(CFG.sync.endpoint, JSON.stringify({ state: state, sha: _sync.sha }));
      }
    });
  }

  // =========================================================================
  // 12A — Render culling + Logic LOD
  // Skip rendering when Lili is fully outside viewport.
  // Reduce FABRIK iterations for tentacles when body is near edges.
  // =========================================================================

  function isOnScreen() {
    // Max tentacle reach = JOINTS * max segment length
    const reach = JOINTS * ageVal(CFG.tentacleSegmentLength);
    const margin = lili.bodyR + reach;
    // Convert document coords to viewport coords and check visibility
    const vx = lili.pos.x - scrollOx;
    const vy = lili.pos.y - scrollOy;
    return vx > -margin && vx < W + margin &&
           vy > -margin && vy < H + margin;
  }

  // 12C — FPS monitoring (rolling average, console warning)
  let _fpsWarnCooldown = 0; // frames until next warning

  function checkFpsWarning() {
    if (_fpsAvg < 50 && _fpsWarnCooldown <= 0) {
      console.warn('[Lili] FPS dropped to ' + _fpsAvg.toFixed(1) + ' (target: 60)');
      _fpsWarnCooldown = 3600; // ~60s at 60fps before next warning
    }
    if (_fpsWarnCooldown > 0) _fpsWarnCooldown--;
  }

  function _importExportData(data) {
    // Restore Q-table
    if (data.qtable && Array.isArray(data.qtable)) {
      _qtable.clear();
      for (let i = 0; i < data.qtable.length; i++) {
        const entry = data.qtable[i];
        if (entry.s !== undefined && Array.isArray(entry.q)) {
          _qtable.set(entry.s, new Float64Array(entry.q));
        }
      }
      brainSave();
    }

    // Restore daily aggregates (merge: keep unique days)
    if (data.dailyAggregates && Array.isArray(data.dailyAggregates)) {
      const existing = new Set(_journal.dailyAggregates.map(function (a) { return a.day; }));
      for (let i = 0; i < data.dailyAggregates.length; i++) {
        if (!existing.has(data.dailyAggregates[i].day)) {
          _journal.dailyAggregates.push(data.dailyAggregates[i]);
        }
      }
      // Sort by day
      _journal.dailyAggregates.sort(function (a, b) { return a.day < b.day ? -1 : 1; });
      try {
        localStorage.setItem(CFG.storageKeys.dailyAgg,
          JSON.stringify(_journal.dailyAggregates));
      } catch (e) { /* storage full */ }
    }

    // Restore milestones (merge by type+ts)
    if (data.milestones && Array.isArray(data.milestones)) {
      const existingKeys = new Set(_journal.milestones.map(function (m) {
        return m.type + ':' + m.ts;
      }));
      for (let i = 0; i < data.milestones.length; i++) {
        const key = data.milestones[i].type + ':' + data.milestones[i].ts;
        if (!existingKeys.has(key)) {
          _journal.milestones.push(data.milestones[i]);
        }
      }
      _journal.milestones.sort(function (a, b) { return a.ts - b.ts; });
      journalSaveMilestones();
    }

    // Restore decision counters
    if (data.metadata) {
      if (data.metadata.totalDecisions > _decision.totalDecisions) {
        _decision.totalDecisions = data.metadata.totalDecisions;
        _decision.totalReward = data.metadata.totalReward || 0;
      }
    }
  }

  // Phase transition milestone logging (wired in boot)
  function _onPhaseTransitionJournal(from, to, atMs) {
    _journal.milestones.push({
      type: 'phase_transition',
      from: from,
      to: to,
      ts: Date.now(),
      ageMs: atMs,
      decisions: _decision.totalDecisions,
    });
    journalSaveMilestones();
  }

  // =========================================================================
  // 2B — Steering behaviors
  // All return a force Vec2 (or mutate a passed scratch vector)
  // =========================================================================

  // --- Wander (biologically accurate, ontogenetically modulated) ---
  // Research #1: Paralarva = "těžkopádný mechanický oscilátor" (clumsy mechanical oscillator)
  //   — high-frequency (5.4 Hz) low-velocity vertical bobbing, turbulent jets, no coherent direction
  // Research #1: Adult = efficient pulse-glide with separated vortex rings, smooth navigation
  // The FEEL must change dramatically across life phases
  function steerWander(out) {
    const t = frameCount * 0.01;
    // Phase 18.5: Mood modulates coherence (playful=erratic, calm=smooth)
    const moodCoh = CFG.moodCoherence[lili.mood] || 1.0;
    const coherence = Math.min(ageVal(CFG.movementCoherence) * moodCoh, 0.99);
    const bobbing = ageVal(CFG.verticalBobbing);
    const dirNoise = ageVal(CFG.directionalNoise);
    const wDist = ageVal(CFG.wanderDistance);
    const wRad = ageVal(CFG.wanderRadius);

    // Simplex noise drives wander angle — scale by coherence
    // Low coherence (hatchling): rapid, large angle changes → erratic movement
    // High coherence (adult): slow, smooth angle changes → organic cruising
    const noiseVal = noise.noise2D(t * CFG.wanderNoiseScale * 100, 0);
    const angleStep = noiseVal * (0.02 + (1 - coherence) * 0.25);
    lili.wanderAngle += angleStep;

    // Additional directional noise injection (Research #1: turbulent jet traces)
    // Hatchlings get large random perturbation every few frames
    const perturbX = noise.noise2D(t * 3.7, 100) * dirNoise;
    const perturbY = noise.noise2D(t * 3.7, 200) * dirNoise;

    // Projection circle center ahead of agent
    const ahead = lili.heading;
    const cx = lili.pos.x + Math.cos(ahead) * wDist;
    const cy = lili.pos.y + Math.sin(ahead) * wDist;

    // Target on circle perimeter
    let tx = cx + Math.cos(lili.wanderAngle) * wRad;
    let ty = cy + Math.sin(lili.wanderAngle) * wRad;

    // Vertical bobbing (Research #1: paralarva bobs vertically in water column)
    // Strong for hatchlings, nearly zero for adults
    const bobPhase = frameCount * ageVal(CFG.pulseFrequency) * 0.1;
    ty += Math.sin(bobPhase * Math.PI * 2) * bobbing * lili.bodyR * 3;

    // Desired velocity toward wander target (with perturbation)
    out.set(tx - lili.pos.x + perturbX * lili.bodyR,
            ty - lili.pos.y + perturbY * lili.bodyR);
    const outMag = out.mag();
    if (outMag > 0) out.divIn(outMag); // normalize

    // Pulse-glide modulation (Research #1)
    // Hatchling: barely any glide (ratio 0.45), tiny speed boost (1.15) — inefficient
    // Adult: long glide (ratio 0.30), strong boost (1.6) — efficient
    const pulseT = lili.pulsePhase;
    const powerRatio = ageVal(CFG.pulsePowerRatio);
    const speedBoost = ageVal(CFG.pulseSpeedBoost);
    let speedMod;
    if (pulseT < powerRatio) {
      // Power stroke — burst
      const strokeT = pulseT / powerRatio;
      // Ease-out-quint for biological accuracy (Research #1: fast exponential collapse)
      speedMod = speedBoost * (1 - Math.pow(1 - strokeT, 3));
    } else {
      // Glide phase — deceleration (longer and smoother for adults)
      const glideT = (pulseT - powerRatio) / (1 - powerRatio);
      const glideFloor = 0.3 + coherence * 0.4; // hatchling glides to near-stop, adult maintains speed
      speedMod = speedBoost - (speedBoost - glideFloor) * glideT;
    }

    out.multIn(ageVal(CFG.maxSpeed) * speedMod);
    // Steering = desired - current velocity
    out.subIn(lili.vel);
    out.limitIn(ageVal(CFG.maxForce));
    return out;
  }

  // --- Seek / Arrive (with deceleration radius) ---
  function steerSeek(out, targetX, targetY, arrive) {
    out.set(targetX - lili.pos.x, targetY - lili.pos.y);
    const d = out.mag();
    if (d < 1) { out.set(0, 0); return out; }
    out.divIn(d); // normalize
    let speed = ageVal(CFG.maxSpeed);
    if (arrive && d < CFG.arriveSlowRadius) {
      speed *= d / CFG.arriveSlowRadius; // decelerate
    }
    out.multIn(speed).subIn(lili.vel).limitIn(ageVal(CFG.maxForce));
    return out;
  }

  // --- Flee (opposite of seek, from threat) ---
  function steerFlee(out) {
    if (!mouse.active) { out.set(0, 0); return out; }
    const dx = lili.pos.x - mouse.pos.x;
    const dy = lili.pos.y - mouse.pos.y;
    const dSq = dx * dx + dy * dy;
    const fleeDist = CFG.fleeDistance;
    if (dSq > fleeDist * fleeDist) { out.set(0, 0); return out; }
    const d = Math.sqrt(dSq);
    if (d < 1) { out.set(1, 0); } else { out.set(dx / d, dy / d); }
    // Stronger when closer
    const urgency = 1 - d / fleeDist;
    out.multIn(ageVal(CFG.maxSpeed) * (1 + urgency));
    out.subIn(lili.vel).limitIn(ageVal(CFG.maxForce) * 1.5);
    return out;
  }

  // --- Evade (flee from predicted cursor position) ---
  function steerEvade(out) {
    if (!mouse.active) { out.set(0, 0); return out; }
    // Predict future mouse position
    const px = mouse.pos.x + mouse.vel.x * CFG.evadeLookAhead;
    const py = mouse.pos.y + mouse.vel.y * CFG.evadeLookAhead;
    const dx = lili.pos.x - px;
    const dy = lili.pos.y - py;
    const dSq = dx * dx + dy * dy;
    const fleeDist = CFG.fleeDistance;
    if (dSq > fleeDist * fleeDist) { out.set(0, 0); return out; }
    const d = Math.sqrt(dSq);
    if (d < 1) { out.set(1, 0); } else { out.set(dx / d, dy / d); }
    out.multIn(ageVal(CFG.maxSpeed) * 1.2);
    out.subIn(lili.vel).limitIn(ageVal(CFG.maxForce) * 1.5);
    return out;
  }

  // --- Obstacle avoidance (ahead vector vs DOM bounding boxes) ---
  function steerObstacleAvoidance(out) {
    out.set(0, 0);
    const speed = lili.vel.mag();
    if (speed < 0.3) return out;  // standing still, no avoidance needed
    const maxSpeed = ageVal(CFG.maxSpeed);
    const lookDist = (speed / maxSpeed) * CFG.maxSeeAhead;
    const hx = Math.cos(lili.heading);
    const hy = Math.sin(lili.heading);
    // Ahead point
    const ax = lili.pos.x + hx * lookDist;
    const ay = lili.pos.y + hy * lookDist;
    const r = lili.bodyR;

    let closestDist = Infinity;
    let pushX = 0, pushY = 0;

    const nearby = getNearby(ax, ay);
    for (let i = 0; i < nearby.length; i++) {
      const ob = nearby[i];
      // Expand obstacle by body radius for bounding-circle test
      const ox1 = ob.x - r, oy1 = ob.y - r;
      const ox2 = ob.x + ob.w + r, oy2 = ob.y + ob.h + r;
      // Check if ahead point is inside expanded rect
      if (ax >= ox1 && ax <= ox2 && ay >= oy1 && ay <= oy2) {
        _v0.set(ob.cx, ob.cy);
        const d = lili.pos.distSq(_v0);
        if (d < closestDist) {
          closestDist = d;
          // Push away from obstacle center, perpendicular preference
          pushX = lili.pos.x - ob.cx;
          pushY = lili.pos.y - ob.cy;
        }
      }
    }
    if (closestDist < Infinity) {
      const m = Math.sqrt(pushX * pushX + pushY * pushY);
      if (m > 0) { pushX /= m; pushY /= m; }
      out.set(pushX, pushY).multIn(ageVal(CFG.maxForce) * 1.5);
    }
    return out;
  }

  // --- Boundary (soft repulsion from document edges) ---
  function steerBoundary(out) {
    out.set(0, 0);
    const margin = CFG.boundaryMargin;
    const force = CFG.boundaryForce;
    const px = lili.pos.x, py = lili.pos.y;
    // Left
    if (px < margin) out.x += force * (1 - px / margin);
    // Right
    if (px > docW - margin) out.x -= force * (1 - (docW - px) / margin);
    // Top
    if (py < margin) out.y += force * (1 - py / margin);
    // Bottom
    if (py > docH - margin) out.y -= force * (1 - (docH - py) / margin);
    return out;
  }

  // =========================================================================
  // 2C — Additional steering behaviors (Phase 8: mood-driven targets)
  // =========================================================================

  // --- Seek whitespace (find direction with fewest obstacles) ---
  function steerSeekWhitespace(out) {
    out.set(0, 0);
    const lookR = lili.bodyR * 5;
    let bestAngle = -1;
    let minCount = Infinity;
    const curCount = getNearbyCount(lili.pos.x, lili.pos.y);
    // Sample 8 directions
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI * 0.25;
      const px = lili.pos.x + Math.cos(a) * lookR;
      const py = lili.pos.y + Math.sin(a) * lookR;
      // Stay in document bounds
      if (px < 0 || px > docW || py < 0 || py > docH) continue;
      const cnt = getNearbyCount(px, py);
      if (cnt < minCount) { minCount = cnt; bestAngle = a; }
    }
    if (bestAngle >= 0 && minCount < curCount) {
      const tx = lili.pos.x + Math.cos(bestAngle) * lookR * 2;
      const ty = lili.pos.y + Math.sin(bestAngle) * lookR * 2;
      steerSeek(out, tx, ty, true);
    }
    return out;
  }

  // --- Seek DOM element (approach nearest obstacle for exploration) ---
  function steerSeekDom(out) {
    out.set(0, 0);
    const nearby = getNearby(lili.pos.x, lili.pos.y);
    if (nearby.length === 0) return out;
    let closest = null;
    let closestD = Infinity;
    for (let i = 0; i < nearby.length; i++) {
      const ob = nearby[i];
      const cx = ob.x + ob.w * 0.5;
      const cy = ob.y + ob.h * 0.5;
      const dx = cx - lili.pos.x, dy = cy - lili.pos.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < closestD) { closestD = dSq; closest = ob; }
    }
    if (closest) {
      // Approach edge of element, not center (avoid overlapping)
      const cx = closest.x + closest.w * 0.5;
      const cy = closest.y + closest.h * 0.5;
      const dx = lili.pos.x - cx, dy = lili.pos.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const margin = lili.bodyR * 1.5;
      const tx = cx + (dx / d) * margin;
      const ty = cy + (dy / d) * margin;
      steerSeek(out, tx, ty, true);
    }
    return out;
  }

  // --- Seek edge (move toward nearest document edge) ---
  function steerSeekEdge(out) {
    const dL = lili.pos.x, dR = docW - lili.pos.x;
    const dT = lili.pos.y, dB = docH - lili.pos.y;
    const min = Math.min(dL, dR, dT, dB);
    const r = lili.bodyR + 5;
    let tx = lili.pos.x, ty = lili.pos.y;
    if (min === dL) tx = r;
    else if (min === dR) tx = docW - r;
    else if (min === dT) ty = r;
    else ty = docH - r;
    steerSeek(out, tx, ty, true);
    return out;
  }

  // --- Follow slow (cautious following from safe distance) ---
  function steerFollowSlow(out) {
    out.set(0, 0);
    if (!mouse.active) return out;
    const dx = mouse.pos.x - lili.pos.x;
    const dy = mouse.pos.y - lili.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const safeDist = CFG.fleeDistance * 0.8;
    if (d > safeDist) {
      const tx = mouse.pos.x - (dx / d) * safeDist;
      const ty = mouse.pos.y - (dy / d) * safeDist;
      steerSeek(out, tx, ty, true);
      out.multIn(0.3); // cautious — slow approach
    }
    return out;
  }

  // --- Place memory steering (seek safe spots, avoid dangerous ones) ---
  function steerPlaceMemory(out) {
    out.set(0, 0);
    const cs = CFG.placeMemory.cellSize;
    const lookR = cs * 1.5;
    let bestVal = -Infinity;
    let bestX = lili.pos.x, bestY = lili.pos.y;

    // Sample 8 directions + current position
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI * 0.25;
      const px = lili.pos.x + Math.cos(a) * lookR;
      const py = lili.pos.y + Math.sin(a) * lookR;
      if (px < 0 || px > docW || py < 0 || py > docH) continue;
      const v = placeMemoryGet(px, py);
      if (v > bestVal) { bestVal = v; bestX = px; bestY = py; }
    }

    // Also consider avoiding current cell if negative
    const curVal = placeMemoryGet(lili.pos.x, lili.pos.y);
    if (curVal < -0.5) {
      // Move away from current negative spot
      if (bestVal > curVal) {
        steerSeek(out, bestX, bestY, true);
      }
    } else if (bestVal > 0.5 && bestVal > curVal + 0.2) {
      // Seek positive spot
      steerSeek(out, bestX, bestY, true);
      out.multIn(0.5);
    }
    return out;
  }

  // =========================================================================
  // 2D — Behavior weight combiner (mood-driven, Phase 8)
  // =========================================================================

  // Scratch vectors for steering combination (avoid allocation)
  const _steerWander = new Vec2();
  const _steerFlee   = new Vec2();
  const _steerObs    = new Vec2();
  const _steerBound  = new Vec2();
  const _steerWS     = new Vec2();
  const _steerDom    = new Vec2();
  const _steerEdge   = new Vec2();
  const _steerFollow = new Vec2();
  const _steerPlace  = new Vec2();

  function computeSteering() {
    // Phase 8: mood-based weight selection (replaces action-based)
    const weights = CFG.moodWeights[lili.mood] || CFG.moodWeights.idle;

    // Phase 53: Endocrine modulation of steering weights
    const eMod = endocrineSteeringMod();

    // Reset acceleration
    lili.acc.set(0, 0);

    // Wander — dopamine boosts
    if (weights.wander > 0) {
      steerWander(_steerWander);
      lili.acc.x += _steerWander.x * weights.wander * eMod.wanderBoost;
      lili.acc.y += _steerWander.y * weights.wander * eMod.wanderBoost;
    }

    // Flee (use evade for aggressive cursor — more sophisticated)
    // Phase 32: Habituation modulates flee intensity
    // Phase 53: Cortisol boosts flee
    if (weights.flee > 0 && mouse.active) {
      if (mouse.classification === 'aggressive' || mouse.classification === 'fast') {
        steerEvade(_steerFlee);
      } else {
        steerFlee(_steerFlee);
      }
      var fleeHab = weights.flee * _habituation.cursor * eMod.fleeBoost;
      lili.acc.x += _steerFlee.x * fleeHab;
      lili.acc.y += _steerFlee.y * fleeHab;
    }

    // Seek whitespace
    if (weights.seekWhitespace > 0) {
      steerSeekWhitespace(_steerWS);
      lili.acc.x += _steerWS.x * weights.seekWhitespace;
      lili.acc.y += _steerWS.y * weights.seekWhitespace;
    }

    // Seek DOM (exploration) — dopamine boosts
    if (weights.seekDom > 0) {
      steerSeekDom(_steerDom);
      lili.acc.x += _steerDom.x * weights.seekDom * eMod.seekDomBoost;
      lili.acc.y += _steerDom.y * weights.seekDom * eMod.seekDomBoost;
    }

    // Seek edge
    if (weights.seekEdge > 0) {
      steerSeekEdge(_steerEdge);
      lili.acc.x += _steerEdge.x * weights.seekEdge;
      lili.acc.y += _steerEdge.y * weights.seekEdge;
    }

    // Follow slow (cautious cursor following)
    if (weights.followSlow > 0 && mouse.active) {
      steerFollowSlow(_steerFollow);
      // Phase 53: cortisol reduces cursor following
      lili.acc.x += _steerFollow.x * weights.followSlow * eMod.followReduce;
      lili.acc.y += _steerFollow.y * weights.followSlow * eMod.followReduce;
    }

    // Place memory steering (seek safe spots, avoid dangerous)
    if (weights.placeMemory > 0) {
      steerPlaceMemory(_steerPlace);
      lili.acc.x += _steerPlace.x * weights.placeMemory;
      lili.acc.y += _steerPlace.y * weights.placeMemory;
    }

    // Visit recognition: reduce flee weight based on trust
    if (weights.flee > 0 && mouse.active && _visitProfile.trustLevel > 0.1) {
      const trustReduce = _visitProfile.trustLevel * CFG.visitRecognition.trustFleeReduction;
      const fleeSub = 1 - Math.max(0.2, 1 - trustReduce);
      lili.acc.x -= _steerFlee.x * weights.flee * fleeSub;
      lili.acc.y -= _steerFlee.y * weights.flee * fleeSub;
    }

    // Obstacle avoidance — ALWAYS active (safety layer per PRD)
    steerObstacleAvoidance(_steerObs);
    const obsW = Math.max(weights.obstacleAvoid, 0.3); // minimum 0.3 always
    lili.acc.x += _steerObs.x * obsW;
    lili.acc.y += _steerObs.y * obsW;

    // Boundary — ALWAYS active (safety layer per PRD)
    steerBoundary(_steerBound);
    const bndW = Math.max(weights.boundary, 0.2); // minimum 0.2 always
    lili.acc.x += _steerBound.x * bndW;
    lili.acc.y += _steerBound.y * bndW;

    // Truncate total steering force (circadian modulates max force)
    lili.acc.limitIn(ageVal(CFG.maxForce) * _circadian.activityMul);
  }

  // =========================================================================
  // 2A — Physics update (PRD: acceleration → velocity → position)
  // =========================================================================

  function updatePhysics(dt) {
    // Update age-dependent body radius
    // Phase 41: Growth visualization — smooth size scaling within life phases
    lili.bodyR = ageVal(CFG.bodyRadius) * growthScale();

    // Pulse-glide cycle advance — frequency is age-dependent (Research #1)
    // Hatchling: 5.0 Hz (rapid inefficient pulsing), Adult: 0.9 Hz (efficient)
    lili.pulsePhase += ageVal(CFG.pulseFrequency) * dt;
    if (lili.pulsePhase >= 1) lili.pulsePhase -= 1;

    // Apply steering
    computeSteering();

    // Integrate: velocity += acceleration
    lili.vel.addIn(lili.acc);
    // Phase 31: Energy fatigue reduces max speed
    var energySpeedMul = _energy.fatigued ? CFG.energy.speedPenalty : 1;
    lili.vel.limitIn(ageVal(CFG.maxSpeed) * _circadian.activityMul * energySpeedMul);

    // Damping — base damping from PRD + coherence-based efficiency modifier
    // Research #1: Paralarva jets are turbulent and inefficient (no separated vortex rings)
    // → effective damping is LOWER for hatchlings (velocity bleeds faster)
    const baseDamping = ageVal(CFG.damping);
    const coherence = ageVal(CFG.movementCoherence);
    // Hatchling effective damping: 0.97 * (0.6 + 0.15*0.4) = ~0.62 → velocity dies quickly
    // Adult effective damping: 0.93 * (0.6 + 0.8*0.4) = ~0.86 → smooth glide
    const effectiveDamping = baseDamping * (0.6 + coherence * 0.4);
    lili.vel.multIn(effectiveDamping);

    // Position += velocity (scaled by 60fps-normalized dt)
    const dtScale = dt * 60;
    lili.pos.x += lili.vel.x * dtScale;
    lili.pos.y += lili.vel.y * dtScale;

    // Update heading from velocity
    // Hatchlings: heading is less stable (erratic), adults: smooth heading changes
    if (lili.vel.magSq() > 0.01) {
      const targetHeading = Math.atan2(lili.vel.y, lili.vel.x);
      // Lerp heading — hatchlings snap erratically, adults turn smoothly
      const headingLerp = 0.1 + coherence * 0.6; // hatchling: 0.25, adult: 0.58
      let diff = targetHeading - lili.heading;
      // Normalize angle difference to [-PI, PI]
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      lili.heading += diff * headingLerp;
    }

    // Hard clamp to document bounds (safety net)
    const r = lili.bodyR;
    if (lili.pos.x < r) lili.pos.x = r;
    if (lili.pos.x > docW - r) lili.pos.x = docW - r;
    if (lili.pos.y < r) lili.pos.y = r;
    if (lili.pos.y > docH - r) lili.pos.y = docH - r;
  }

  // =========================================================================
  // 3A — FABRIK IK — data structures & solver (Research #3)
  // 8 independent chains, Float32Array, zero-allocation hot path
  // =========================================================================

  const TENT_N = CFG.tentacleCount;      // 8
  const JOINTS = CFG.tentacleSegments;   // 8 joints per chain

  // Phase shift patterns (Research #3)
  // G4 (alternating symmetric): stable locomotion gait
  const PHASE_G4 = [0, Math.PI, 0, Math.PI, Math.PI, 0, Math.PI, 0];
  // Radial wave: sequential 0..7π/4 — smooth undulation for calm/idle
  const PHASE_RADIAL = [];
  for (let i = 0; i < TENT_N; i++) PHASE_RADIAL.push(i * Math.PI / 4);

  // Tentacle array — each has FABRIK chain + local state + trailing physics
  const tentacles = [];

  function createTentacle(index) {
    const segLen = ageVal(CFG.tentacleSegmentLength);
    return {
      index: index,
      // FABRIK chain — Float32Array (Research #3: zero GC in hot path)
      x: new Float32Array(JOINTS),
      y: new Float32Array(JOINTS),
      segLen: segLen,
      totalLen: segLen * (JOINTS - 1),

      // Anchor angle on body (45° spacing, offset so tentacles face "backward")
      anchorAngle: Math.PI + (index - (TENT_N - 1) * 0.5) * CFG.tentacleAnchorSpacing,
      anchorX: 0,
      anchorY: 0,

      // Trailing physics target (Research #3: mass-spring-damper)
      idealX: 0,
      idealY: 0,
      actualX: 0,
      actualY: 0,
      trailVX: 0,
      trailVY: 0,

      // 3D — Local state (semi-autonomous per tentacle)
      localStress: 0,       // 0..1, rises near cursor
      touching: null,        // DOM element being touched (or null)
      curiosity: 0,          // 0..1, influenced by global mood
      recoilTimer: 0,        // >0 means retracting (seconds remaining)
      heldElement: null,     // grabbed DOM element (or null)
      grip: 0,               // grip strength 0..1

      // Phase 9: DOM interaction state machine
      interactionState: 'none', // none | touching | interested | grabbing | dropping
      interactionTarget: null,  // obstacle entry being interacted with
      interestLevel: 0,         // 0..1, builds with repeated contact
      holdTimer: 0,             // seconds elapsed in current state
      holdDuration: 0,          // random target hold duration (grab)
      touchDuration: 0,         // random touch auto-return duration
    };
  }

  function initTentacles() {
    tentacles.length = 0;
    for (let i = 0; i < TENT_N; i++) {
      tentacles.push(createTentacle(i));
    }
    // Position all joints at body center initially
    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];
      for (let j = 0; j < JOINTS; j++) {
        arm.x[j] = lili.pos.x;
        arm.y[j] = lili.pos.y;
      }
    }
  }

  // --- FABRIK solver (operates on a single chain's Float32Arrays) ---
  function fabrikSolve(arm, targetX, targetY) {
    const n = JOINTS;
    const seg = arm.segLen;
    const ax = arm.x, ay = arm.y;

    // Update base position (anchor on body circumference)
    ax[0] = arm.anchorX;
    ay[0] = arm.anchorY;

    // Reachability check
    const dx = targetX - ax[0];
    const dy = targetY - ay[0];
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget > arm.totalLen) {
      // Unreachable — stretch toward target
      for (let i = 0; i < n - 1; i++) {
        const rdx = targetX - ax[i];
        const rdy = targetY - ay[i];
        const r = Math.sqrt(rdx * rdx + rdy * rdy);
        if (r < 0.001) continue;
        const lambda = seg / r;
        ax[i + 1] = (1 - lambda) * ax[i] + lambda * targetX;
        ay[i + 1] = (1 - lambda) * ay[i] + lambda * targetY;
      }
      return;
    }

    // Iterative FABRIK (max CFG.fabrikIterations, temporal coherence)
    const maxIter = CFG.fabrikIterations;
    const tol = CFG.fabrikTolerance;
    const last = n - 1;

    for (let iter = 0; iter < maxIter; iter++) {
      // Check convergence
      const fdx = targetX - ax[last];
      const fdy = targetY - ay[last];
      if (fdx * fdx + fdy * fdy < tol * tol) break;

      // Forward reach (tip → base)
      ax[last] = targetX;
      ay[last] = targetY;
      for (let i = last - 1; i >= 0; i--) {
        const rdx = ax[i] - ax[i + 1];
        const rdy = ay[i] - ay[i + 1];
        const r = Math.sqrt(rdx * rdx + rdy * rdy);
        if (r < 0.001) { ax[i] = ax[i + 1]; ay[i] = ay[i + 1] + seg; continue; }
        const lambda = seg / r;
        ax[i] = (1 - lambda) * ax[i + 1] + lambda * ax[i];
        ay[i] = (1 - lambda) * ay[i + 1] + lambda * ay[i];
      }

      // Backward reach (base → tip)
      ax[0] = arm.anchorX;
      ay[0] = arm.anchorY;
      for (let i = 0; i < last; i++) {
        const rdx = ax[i + 1] - ax[i];
        const rdy = ay[i + 1] - ay[i];
        const r = Math.sqrt(rdx * rdx + rdy * rdy);
        if (r < 0.001) { ax[i + 1] = ax[i]; ay[i + 1] = ay[i] + seg; continue; }
        const lambda = seg / r;
        ax[i + 1] = (1 - lambda) * ax[i] + lambda * ax[i + 1];
        ay[i + 1] = (1 - lambda) * ay[i] + lambda * ay[i + 1];
      }
    }
  }

  // =========================================================================
  // 3B — Procedural target generation (biomechanical model)
  // Asymmetric power-stroke/recovery, phase shifts, Simplex noise
  // =========================================================================

  // Phase 13D: Tentacle target computation with mood expression
  function computeTentacleTarget(arm, time) {
    const idx = arm.index;
    const bodyX = lili.pos.x;
    const bodyY = lili.pos.y;
    const heading = lili.heading;
    const speed = lili.vel.mag();
    const maxSpd = ageVal(CFG.maxSpeed);
    const speedRatio = maxSpd > 0 ? Math.min(speed / maxSpd, 1) : 0;

    // 13D: Mood modulates amplitude, spread, noise
    const amplitude = ageVal(CFG.tentacleSwimAmplitude) * _tentBlend.ampMod;
    const swimSpeed = ageVal(CFG.tentacleSwimSpeed);
    const asyncFactor = CFG.tentacleAsyncFactor;

    // Phase pattern selection: locomotion (G4) when moving, radial wave when still
    const phaseShift = speedRatio > 0.2
      ? PHASE_G4[idx]
      : PHASE_RADIAL[idx];

    // Asymmetric time modulation (Research #3: power-stroke vs recovery)
    const t = time * swimSpeed;
    const asyncTime = t + asyncFactor * Math.sin(t);

    // Anchor angle in world space (rotated with heading)
    const worldAngle = arm.anchorAngle + heading;

    // Base reach — modulated by mood spread (13D: shy=tighter, playful=wider)
    const waveVal = Math.sin(asyncTime + phaseShift);
    // Phase 18E: Psychosomatic long-term tentacle spread modulation
    const baseReach = arm.totalLen * (0.55 + 0.3 * waveVal) * _tentBlend.spreadMod * _psychosom.tentSpread;

    // Lateral sway perpendicular to tentacle direction
    const swayVal = Math.cos(asyncTime * 0.7 + phaseShift);
    const perpAngle = worldAngle + Math.PI * 0.5;

    // Simplex noise injection — 13D: mood modulates noise scale
    const noiseScale = CFG.tentacleNoiseScale * _tentBlend.noiseMod;
    const noiseAmp = noise.noise2D(t * 0.5 + idx * 10, 0) * noiseScale;
    const noiseAngle = noise.noise2D(t * 0.5 + idx * 10, 1000) * 0.15 * _tentBlend.noiseMod;

    const reachAngle = worldAngle + noiseAngle;

    // Swimming: tentacles trail behind body when moving
    const trailBias = speedRatio * arm.totalLen * 0.4;
    const trailX = -Math.cos(heading) * trailBias;
    const trailY = -Math.sin(heading) * trailBias;

    // 13D: Forward bias — curious/exploring tentacles reach forward
    const fwdBias = _tentBlend.forwardBias * arm.totalLen * 0.3;
    // Only front tentacles (indices 0,1,6,7) get forward bias
    const isFront = (idx <= 1 || idx >= 6);
    const fwdX = isFront ? Math.cos(heading) * fwdBias : 0;
    const fwdY = isFront ? Math.sin(heading) * fwdBias : 0;

    arm.idealX = bodyX + Math.cos(reachAngle) * (baseReach + noiseAmp)
                + Math.cos(perpAngle) * swayVal * amplitude * 0.4
                + trailX + fwdX;
    arm.idealY = bodyY + Math.sin(reachAngle) * (baseReach + noiseAmp)
                + Math.sin(perpAngle) * swayVal * amplitude * 0.4
                + trailY + fwdY;

    // Idle/calm relaxation: gravity pull — 13D: mood modulates gravity
    if (speedRatio < 0.15) {
      const idleFactor = 1 - speedRatio / 0.15;
      arm.idealY += CFG.tentacleRelaxGravity * _tentBlend.gravMod * arm.totalLen * 0.3 * idleFactor;
    }

    // Phase 18D: Sleep animation — curl tentacles inward, add REM twitch
    if (_circadian.isAsleep) {
      var curl = CFG.sleepAnim.tentacleCurlFactor;
      // Pull tentacle tips toward body center (curl in)
      arm.idealX += (bodyX - arm.idealX) * curl;
      arm.idealY += (bodyY - arm.idealY) * curl;
      // Gentle downward drape (sleeping posture)
      arm.idealY += arm.totalLen * 0.15;
      // REM twitch: one tentacle gets a sudden offset
      if (_sleepAnim.remArm === idx && _sleepAnim.remPhase > 0) {
        var twitchFade = _sleepAnim.remPhase / CFG.sleepAnim.remTwitchDuration;
        arm.idealX += _sleepAnim.remOffsetX * twitchFade;
        arm.idealY += _sleepAnim.remOffsetY * twitchFade;
      }
    }

    // Phase 28: Welcome wave — one tentacle waves upward toward cursor
    if (_signals.welcomeActive && idx === _signals.welcomeArm) {
      var wt = _signals.welcomeFrame / CFG.signals.welcomeWaveDuration;
      var wave = Math.sin(wt * Math.PI * 3) * (1 - wt); // damped oscillation
      arm.idealX += (mouse.pos.x - bodyX) * 0.3 * (1 - wt);
      arm.idealY += -arm.totalLen * 0.4 * wave;
    }
  }

  // =========================================================================
  // 3C — Trailing physics (mass-spring-damper on tip target)
  // Research #3: Hooke's law + viscous damping, semi-implicit Euler
  // Phase 56: Per-segment spring-damper coupling (underwater wave propagation)
  // =========================================================================

  function updateTrailingPhysics(arm) {
    const stiff = CFG.tentacleTrailing.stiffness;
    const damp = CFG.tentacleTrailing.damping;

    // Spring force toward ideal position
    const ax = (arm.idealX - arm.actualX) * stiff;
    const ay = (arm.idealY - arm.actualY) * stiff;

    // Semi-implicit Euler integration
    arm.trailVX = (arm.trailVX + ax) * damp;
    arm.trailVY = (arm.trailVY + ay) * damp;

    arm.actualX += arm.trailVX;
    arm.actualY += arm.trailVY;
  }

  // Per-segment spring-damper: propagates motion from base with delay
  // Creates underwater wave effect — each segment is coupled to its predecessor
  function applySegmentSpringDamper(arm) {
    var n = JOINTS;
    var segStiff = 0.08;  // inter-segment spring stiffness (softer than tip trailing)
    var segDamp  = 0.85;  // inter-segment damping (high = more resistance = underwater feel)

    // Lazy-init per-segment velocity arrays
    if (!arm.segVX) {
      arm.segVX = new Float32Array(n);
      arm.segVY = new Float32Array(n);
    }

    var jx = arm.x, jy = arm.y;
    var seg = arm.segLen;

    // Base joint is anchored — skip i=0
    // Apply spring force from predecessor to each joint (base→tip propagation)
    for (var i = 1; i < n; i++) {
      // Vector from ideal position (based on segment length from prev joint)
      var dx = jx[i] - jx[i - 1];
      var dy = jy[i] - jy[i - 1];
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.001) continue;

      // Spring force: correct toward ideal segment distance
      var stretch = dist - seg;
      var fx = -(dx / dist) * stretch * segStiff;
      var fy = -(dy / dist) * stretch * segStiff;

      // Add lateral drag (perpendicular to segment = water resistance)
      // Movement perpendicular to the tentacle direction is resisted more
      var nx = -dy / dist;  // perpendicular normal
      var ny =  dx / dist;
      var perpVel = arm.segVX[i] * nx + arm.segVY[i] * ny;
      fx -= nx * perpVel * 0.04;  // lateral drag coefficient
      fy -= ny * perpVel * 0.04;

      // Semi-implicit Euler
      arm.segVX[i] = (arm.segVX[i] + fx) * segDamp;
      arm.segVY[i] = (arm.segVY[i] + fy) * segDamp;

      // Apply (small displacement — stays organic, doesn't break FABRIK)
      jx[i] += arm.segVX[i];
      jy[i] += arm.segVY[i];

      // Re-constrain segment length after spring displacement
      dx = jx[i] - jx[i - 1];
      dy = jy[i] - jy[i - 1];
      dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.001 && Math.abs(dist - seg) > 0.5) {
        var lam = seg / dist;
        jx[i] = jx[i - 1] + dx * lam;
        jy[i] = jy[i - 1] + dy * lam;
      }
    }
  }

  // =========================================================================
  // 3D — Local intelligence: recoil, stress update per tentacle
  // =========================================================================

  function updateTentacleLocalState(arm, frameDt) {
    const tipX = arm.x[JOINTS - 1];
    const tipY = arm.y[JOINTS - 1];

    // Cursor proximity → local stress + recoil trigger
    if (mouse.active) {
      const cdx = tipX - mouse.pos.x;
      const cdy = tipY - mouse.pos.y;
      const cursorDist = Math.sqrt(cdx * cdx + cdy * cdy);
      const recoilDist = CFG.tentacleRecoilDistance + lili.bodyR;

      if (cursorDist < recoilDist && arm.recoilTimer <= 0) {
        arm.recoilTimer = 0.4; // 400ms recoil
        arm.localStress = Math.min(arm.localStress + 0.3, 1);
      }

      // Stress from cursor proximity (exponential decay)
      const proxStress = cursorDist < recoilDist * 2
        ? (1 - cursorDist / (recoilDist * 2)) * 0.5
        : 0;
      arm.localStress += (proxStress - arm.localStress) * 0.05;
    } else {
      arm.localStress *= 0.97; // decay
    }

    // 6B: Tip touching DOM element (from spatial hash)
    arm.touching = tentacleTipTouchingDom(arm);

    // Recoil timer countdown
    if (arm.recoilTimer > 0) {
      arm.recoilTimer -= frameDt;
      // Override target: retract toward body
      const recoilT = Math.max(arm.recoilTimer / 0.4, 0);
      const retractStrength = recoilT * CFG.tentacleRecoilSpeed;
      arm.idealX += (lili.pos.x - arm.idealX) * retractStrength;
      arm.idealY += (lili.pos.y - arm.idealY) * retractStrength;
    }

    // Phase 9: DOM interaction state machine
    updateDomInteraction(arm, frameDt);

    // If grabbing, bias tip target toward held element
    if (arm.interactionState === 'grabbing' && arm.heldElement) {
      const info = _domState.disturbed.get(arm.heldElement);
      if (info && info.originalRect) {
        const ecx = info.originalRect.x + info.originalRect.w * 0.5;
        const ecy = info.originalRect.y + info.originalRect.h * 0.5;
        // Blend ideal target toward element (tentacle reaches for held object)
        arm.idealX += (ecx - arm.idealX) * 0.15;
        arm.idealY += (ecy - arm.idealY) * 0.15;
      }
    }
  }

  // =========================================================================
  // 3 — Main tentacle update (called from update() each frame)
  // =========================================================================

  function updateTentacles(frameDt) {
    const r = lili.bodyR;
    const heading = lili.heading;
    const time = frameCount * (1 / 60); // approximate seconds

    // Update segment length from age (tentacles grow)
    const segLen = ageVal(CFG.tentacleSegmentLength);

    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];

      // Update segment length (age-dependent growth)
      arm.segLen = segLen;
      arm.totalLen = segLen * (JOINTS - 1);

      // Compute anchor position on body circumference (rotated with heading)
      const anchorWorld = arm.anchorAngle + heading;
      arm.anchorX = lili.pos.x + Math.cos(anchorWorld) * r * 0.85;
      arm.anchorY = lili.pos.y + Math.sin(anchorWorld) * r * 0.85;

      // 3B: Generate ideal target (procedural biomechanics)
      computeTentacleTarget(arm, time);

      // 3D: Local intelligence (recoil, stress)
      updateTentacleLocalState(arm, frameDt);

      // 3C: Trailing physics (smooth the actual target)
      updateTrailingPhysics(arm);

      // 3A: FABRIK solve toward trailed target
      fabrikSolve(arm, arm.actualX, arm.actualY);

      // Phase 55: Comfort functions — anti-torsion + grab tip alignment
      fabrikComfort(arm);

      // Phase 56: Per-segment spring-damper (underwater wave propagation)
      applySegmentSpringDamper(arm);
    }
  }

  // =========================================================================
  // 55 — FABRIK Comfort Functions (anti-torsion, end-effector alignment)
  // Prevents unnatural sharp bends and aligns tip during grab interactions.
  // =========================================================================

  function fabrikComfort(arm) {
    var C = CFG.fabrikComfort;
    var ax = arm.x, ay = arm.y;
    var n = JOINTS;

    // Anti-torsion: penalize sharp angles between consecutive segments
    for (var i = 1; i < n - 1; i++) {
      // Vectors: prev→current, current→next
      var v1x = ax[i] - ax[i - 1];
      var v1y = ay[i] - ay[i - 1];
      var v2x = ax[i + 1] - ax[i];
      var v2y = ay[i + 1] - ay[i];

      var len1 = Math.sqrt(v1x * v1x + v1y * v1y);
      var len2 = Math.sqrt(v2x * v2x + v2y * v2y);
      if (len1 < 0.001 || len2 < 0.001) continue;

      // Cosine of angle between segments
      var dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
      dot = Math.max(-1, Math.min(1, dot)); // clamp for acos safety
      var angle = Math.acos(dot);

      // If bend exceeds comfort threshold, push joint outward
      if (angle < C.maxBendAngle) {
        // Cross product sign determines which side to correct toward
        var cross = v1x * v2y - v1y * v2x;
        var sign = cross >= 0 ? 1 : -1;

        // Correction: push joint[i+1] away from the sharp bend
        var correction = (C.maxBendAngle - angle) * C.torsionCorrectionStrength;
        var perpX = -v2y / len2 * sign;
        var perpY =  v2x / len2 * sign;
        ax[i + 1] += perpX * correction * arm.segLen;
        ay[i + 1] += perpY * correction * arm.segLen;

        // Re-constrain segment length
        var rdx = ax[i + 1] - ax[i];
        var rdy = ay[i + 1] - ay[i];
        var r = Math.sqrt(rdx * rdx + rdy * rdy);
        if (r > 0.001) {
          var lam = arm.segLen / r;
          ax[i + 1] = ax[i] + rdx * lam;
          ay[i + 1] = ay[i] + rdy * lam;
        }
      }
    }

    // End-effector alignment during grab: tip approaches element smoothly
    if (arm.interactionState === 'grabbing' && arm.heldElement) {
      var last = n - 1;
      var prev = last - 1;
      // Smooth the tip-to-prev vector toward the reach direction
      var reachDx = arm.actualX - ax[prev];
      var reachDy = arm.actualY - ay[prev];
      var reachLen = Math.sqrt(reachDx * reachDx + reachDy * reachDy);
      if (reachLen > 0.001) {
        var tipDx = ax[last] - ax[prev];
        var tipDy = ay[last] - ay[prev];
        // Blend tip direction toward reach direction
        var blend = C.tipAlignmentStrength;
        ax[last] = ax[prev] + tipDx * (1 - blend) + (reachDx / reachLen) * arm.segLen * blend;
        ay[last] = ay[prev] + tipDy * (1 - blend) + (reachDy / reachLen) * arm.segLen * blend;
      }
    }
  }

  // =========================================================================
  // 9A — Word Indexer (wrap text nodes into <span class="lili-word">)
  // Run once at boot — irreversible. Enables per-word DOM interaction.
  // =========================================================================

  const _wordSkipTags = new Set([
    'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CANVAS', 'SVG', 'CODE', 'PRE',
    'KBD', 'SAMP', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED',
  ]);
  const _interactiveTags = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL']);

  function wrapWords() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) {
      const p = n.parentElement;
      if (!p) continue;
      if (_wordSkipTags.has(p.tagName)) continue;
      if (_interactiveTags.has(p.tagName)) continue;
      if (p.classList && p.classList.contains('lili-word')) continue;
      if (p.isContentEditable) continue;
      if (!n.textContent || n.textContent.trim().length === 0) continue;
      textNodes.push(n);
    }

    // Process in reverse to avoid invalidating references
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const node = textNodes[i];
      const parent = node.parentElement;
      if (!parent) continue;
      const words = node.textContent.split(/(\s+)/);
      if (words.length <= 1 && (!words[0] || words[0].trim().length === 0)) continue;

      const frag = document.createDocumentFragment();
      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        if (!word || word.length === 0) continue;
        if (/^\s+$/.test(word)) {
          frag.appendChild(document.createTextNode(word));
        } else {
          const span = document.createElement('span');
          span.className = 'lili-word';
          span.textContent = word;
          // Shape affinity: round chars attract more
          if (/^[OoQ0@CGceDdPpBb]+$/.test(word)) span.dataset.liliShape = 'round';
          else if (/^[AKVWMNvwkm1]+$/.test(word)) span.dataset.liliShape = 'angular';
          else span.dataset.liliShape = 'mixed';
          frag.appendChild(span);
        }
      }
      parent.replaceChild(frag, node);
    }
  }

  // =========================================================================
  // 9B — DOM Interaction Pipeline (touch → interest → grab → play → drop)
  // Per-tentacle state machine + global element tracking.
  // Golden rule: ONLY transform + color, NEVER layout properties.
  // =========================================================================

  const _domState = {
    heldCount: 0,            // currently held elements (max 2)
    disturbedCount: 0,       // currently CSS-affected elements (max 4)
    disturbed: new Map(),    // element → { originalTransform, originalColor, originalRect, touchTime, returnAt }
    lastCleanupCheck: 0,     // frame of last midnight check
  };

  function _isInteractive(el) {
    return _interactiveTags.has(el.tagName) ||
      el.getAttribute('role') === 'button' ||
      el.hasAttribute('tabindex') ||
      el.hasAttribute('onclick');
  }

  function _isGrabbable(el) {
    if (_isInteractive(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width < CFG.dom.maxGrabbableWidth && r.height < CFG.dom.maxGrabbableHeight;
  }

  // --- Touch: subtle CSS rotate + translate ---
  function _domTouch(arm) {
    const el = arm.interactionTarget.el;
    if (_domState.disturbed.has(el)) return; // already touched by another tentacle
    if (_domState.disturbedCount >= CFG.dom.maxDisturbed) return;

    const angle = (rlRng() - 0.5) * CFG.dom.touchRotateMax * 2;
    const dx = (rlRng() - 0.5) * CFG.dom.touchTranslateMax * 2;
    const dy = (rlRng() - 0.5) * CFG.dom.touchTranslateMax * 2;
    const rect = el.getBoundingClientRect();

    _domState.disturbed.set(el, {
      originalTransform: el.style.transform || '',
      originalColor: el.style.color || '',
      originalRect: { x: rect.left + scrollOx, y: rect.top + scrollOy, w: rect.width, h: rect.height },
      touchTime: Date.now(),
      returnAt: 0, // set below
      tentacleIdx: arm.index,
    });
    _domState.disturbedCount++;

    // Random auto-return duration
    const dur = CFG.dom.touchDuration;
    arm.touchDuration = dur[0] + rlRng() * (dur[1] - dur[0]);
    arm.holdTimer = 0;

    el.style.transition = 'transform ' + CFG.dom.touchTransition + 's ease';
    el.style.transform = 'rotate(' + angle.toFixed(1) + 'deg) translate(' +
      dx.toFixed(1) + 'px, ' + dy.toFixed(1) + 'px)';
    el.dataset.liliTouched = String(Date.now());
  }

  // --- Untouch: smooth return when losing interest without grabbing ---
  function _domUntouch(arm) {
    if (!arm.interactionTarget) return;
    const el = arm.interactionTarget.el;
    const info = _domState.disturbed.get(el);
    if (!info) { arm.interactionTarget = null; arm.interestLevel = 0; return; }

    el.style.transition = 'transform ' + CFG.dom.returnTransition + 's ease-out';
    el.style.transform = info.originalTransform;

    // Delayed cleanup of data attributes
    const elRef = el;
    setTimeout(function () {
      elRef.style.transition = '';
      delete elRef.dataset.liliTouched;
      _domState.disturbed.delete(elRef);
      _domState.disturbedCount = Math.max(0, _domState.disturbedCount - 1);
    }, CFG.dom.returnTransition * 1000 + 100);

    arm.interactionTarget = null;
    arm.interestLevel = 0;
    arm.holdTimer = 0;
  }

  // --- Grab: element begins following tentacle tip ---
  function _domGrab(arm) {
    const el = arm.interactionTarget.el;
    arm.heldElement = el;
    el.dataset.liliHeld = String(arm.index);
    _domState.heldCount++;
    domLearningTrack(el); // Phase 15D: learn element type preference

    // Ensure it's in disturbed map with original rect
    if (!_domState.disturbed.has(el)) {
      const rect = el.getBoundingClientRect();
      _domState.disturbed.set(el, {
        originalTransform: el.style.transform || '',
        originalColor: el.style.color || '',
        originalRect: { x: rect.left + scrollOx, y: rect.top + scrollOy, w: rect.width, h: rect.height },
        touchTime: Date.now(),
        returnAt: 0,
        tentacleIdx: arm.index,
      });
      _domState.disturbedCount++;
    }

    // Random hold duration
    const dur = CFG.dom.holdDuration;
    arm.holdDuration = dur[0] + rlRng() * (dur[1] - dur[0]);
    arm.holdTimer = 0;
    arm.grip = 1;
  }

  // --- Play: element follows tentacle tip with rotation ---
  function _domPlay(arm) {
    if (!arm.heldElement) return;
    const el = arm.heldElement;
    const info = _domState.disturbed.get(el);
    if (!info || !info.originalRect) return;

    const tipX = arm.x[JOINTS - 1];
    const tipY = arm.y[JOINTS - 1];
    const ocx = info.originalRect.x + info.originalRect.w * 0.5;
    const ocy = info.originalRect.y + info.originalRect.h * 0.5;
    const dx = tipX - ocx;
    const dy = tipY - ocy;

    // Gentle sway rotation while held
    const angle = Math.sin(frameCount * 0.05 + arm.index * 1.7) * 5;

    el.style.transition = 'none';
    el.style.transform = 'translate(' + dx.toFixed(1) + 'px, ' + dy.toFixed(1) +
      'px) rotate(' + angle.toFixed(1) + 'deg)';
  }

  // --- Drop: release element, smooth return to original position ---
  function _domDrop(arm) {
    if (!arm.heldElement) return;
    const el = arm.heldElement;
    const info = _domState.disturbed.get(el);

    el.style.transition = 'transform ' + CFG.dom.returnTransition + 's ease-out';
    el.style.transform = info ? info.originalTransform : '';

    delete el.dataset.liliHeld;
    arm.heldElement = null;
    arm.grip = 0;
    arm.interactionState = 'dropping';
    arm.holdTimer = 0;
    _domState.heldCount = Math.max(0, _domState.heldCount - 1);
  }

  // --- Cleanup after drop transition completes ---
  function _domCleanupArm(arm) {
    if (arm.interactionTarget) {
      const el = arm.interactionTarget.el;
      const elRef = el;
      setTimeout(function () {
        elRef.style.transition = '';
        delete elRef.dataset.liliTouched;
        _domState.disturbed.delete(elRef);
        _domState.disturbedCount = Math.max(0, _domState.disturbedCount - 1);
      }, 100);
    }
    arm.interactionTarget = null;
    arm.interactionState = 'none';
    arm.interestLevel = 0;
    arm.holdTimer = 0;
  }

  // --- Per-tentacle interaction state machine (called each frame) ---
  function updateDomInteraction(arm, frameDt) {
    const mood = lili.mood;
    const DC = CFG.dom;

    switch (arm.interactionState) {

      case 'none':
        // Check if tip touches a grabbable element
        if (arm.touching && arm.curiosity > DC.curiosityTouchThreshold &&
            _domState.disturbedCount < DC.maxDisturbed) {
          const el = arm.touching.el;
          if (!_isInteractive(el) && _isGrabbable(el) && !_domState.disturbed.has(el)) {
            arm.interactionState = 'touching';
            arm.interactionTarget = arm.touching;
            _domTouch(arm);
          }
        }
        break;

      case 'touching':
        arm.holdTimer += frameDt;
        // Interest builds with sustained contact
        if (arm.touching && arm.interactionTarget &&
            arm.touching.el === arm.interactionTarget.el) {
          arm.interestLevel += frameDt * DC.interestBuildRate * arm.curiosity;
        } else {
          arm.interestLevel -= frameDt * DC.interestDecayRate;
        }
        // Auto-return after touch duration
        if (arm.holdTimer > arm.touchDuration) {
          _domUntouch(arm);
          arm.interactionState = 'none';
          break;
        }
        // Escalate to interested
        if (arm.interestLevel >= DC.interestGrabThreshold &&
            (mood === 'curious' || mood === 'playful')) {
          arm.interactionState = 'interested';
        }
        // Lost interest
        if (arm.interestLevel <= 0) {
          _domUntouch(arm);
          arm.interactionState = 'none';
        }
        break;

      case 'interested':
        // Attempt grab
        if (_domState.heldCount < DC.maxHeld &&
            arm.curiosity > DC.curiosityGrabThreshold &&
            (mood === 'curious' || mood === 'playful') &&
            arm.interactionTarget) {
          _domGrab(arm);
          arm.interactionState = 'grabbing';
          triggerMicroExpr('joy'); // Phase 18C
          break;
        }
        // Lose interest if mood shifts
        arm.interestLevel -= frameDt * 0.15;
        if (mood !== 'curious' && mood !== 'playful') {
          arm.interestLevel -= frameDt * 0.6;
        }
        if (arm.interestLevel <= 0.3) {
          _domUntouch(arm);
          arm.interactionState = 'none';
        }
        break;

      case 'grabbing':
        arm.holdTimer += frameDt;
        arm.grip -= frameDt / arm.holdDuration;

        // Element follows tip
        _domPlay(arm);

        // Drop conditions: grip depleted, high stress, recoil, shy mood
        if (arm.grip <= 0 || stress > DC.stressDropThreshold ||
            arm.recoilTimer > 0 || mood === 'shy') {
          _domDrop(arm);
        }
        break;

      case 'dropping':
        // Wait for CSS return transition to complete
        arm.holdTimer += frameDt;
        if (arm.holdTimer > CFG.dom.returnTransition + 0.2) {
          _domCleanupArm(arm);
        }
        break;
    }

    // Emergency drop: flee/alert + high stress drops everything immediately
    if (arm.interactionState === 'grabbing' &&
        (mood === 'shy' || mood === 'alert') && stress > 0.5) {
      _domDrop(arm);
    }
  }

  // =========================================================================
  // 9D — Midnight Cleanup (daily reset of all DOM interactions)
  // =========================================================================

  function midnightCleanup() {
    const now = new Date();
    const lastCleanupStr = localStorage.getItem(CFG.storageKeys.lastCleanup);
    const lastDate = lastCleanupStr
      ? new Date(parseInt(lastCleanupStr, 10)).toDateString()
      : null;

    if (now.toDateString() === lastDate) return; // already cleaned today

    // First: force-drop all held elements
    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];
      if (arm.heldElement) {
        _domDrop(arm);
      }
      arm.interactionState = 'none';
      arm.interactionTarget = null;
      arm.interestLevel = 0;
      arm.holdTimer = 0;
    }

    // Smooth return all disturbed elements
    const trans = CFG.dom.cleanupTransition;
    const touched = document.querySelectorAll('[data-lili-touched]');
    for (let i = 0; i < touched.length; i++) {
      const el = touched[i];
      const info = _domState.disturbed.get(el);
      el.style.transition = 'transform ' + trans + 's ease-out, color ' + trans + 's ease-out';
      el.style.transform = info ? info.originalTransform : '';
      el.style.color = info ? info.originalColor : '';
    }

    // Delayed attribute cleanup
    setTimeout(function () {
      const els = document.querySelectorAll('[data-lili-touched]');
      for (let i = 0; i < els.length; i++) {
        els[i].style.transition = '';
        delete els[i].dataset.liliTouched;
        delete els[i].dataset.liliHeld;
      }
      _domState.disturbed.clear();
      _domState.disturbedCount = 0;
      _domState.heldCount = 0;
    }, trans * 1000 + 200);

    localStorage.setItem(CFG.storageKeys.lastCleanup, String(Date.now()));
  }

  function checkMidnightCleanup() {
    if (frameCount - _domState.lastCleanupCheck < CFG.dom.cleanupCheckFrames) return;
    _domState.lastCleanupCheck = frameCount;
    midnightCleanup();
  }

  // =========================================================================
  // 4 — Visual System: chromatophores, hull rendering, body, eyes
  // =========================================================================

  // 4D — Chromatophore color computation (HSL)
  // Phase 13A: mood chromatophore expression blended in
  function computeColors() {
    const baseHue = ageVal(CFG.baseHue);
    const baseSat = ageVal(CFG.baseSaturation);
    const baseLit = ageVal(CFG.baseLightness);

    // Circadian shift: warmer in morning (6-12h), cooler at night (20-4h)
    const hour = new Date().getHours() + new Date().getMinutes() / 60;
    let circadianHue = 0;
    if (hour >= 6 && hour < 12) circadianHue = 10;       // morning warmth
    else if (hour >= 12 && hour < 18) circadianHue = 0;   // neutral
    else if (hour >= 18 && hour < 22) circadianHue = -8;  // evening cool
    else circadianHue = -15;                               // night deep

    let circadianLit = 0;
    if (hour >= 22 || hour < 6) circadianLit = -8;        // darker at night

    // Stress: shift hue toward red, boost saturation (CFG values)
    const stressHue = stress * CFG.stressHueShift;     // negative = warmer
    const stressSat = stress * CFG.stressSaturationBoost;

    // Phase 13A: Mood chromatophore modulation (smoothly blended)
    const moodHue = _chromaBlend.hueShift;
    const moodSat = _chromaBlend.satShift;
    const moodLit = _chromaBlend.litShift;
    // Exploring: slow hue drift over time
    const driftHue = _chromaBlend.hueDrift > 0
      ? Math.sin(frameCount * _chromaBlend.hueDrift) * 12 : 0;
    // Curious: subtle saturation pulsing
    const satPulse = _chromaBlend.satPulse > 0
      ? Math.sin(frameCount * 0.08) * _chromaBlend.satPulse * 100 : 0;

    // Phase 21: Seasonal chromatophore modulation
    const seasonHue = _season.hueShift;
    const seasonSat = _season.satShift;
    const seasonLit = _season.litShift;

    // Phase 27: Habitat color adaptation + Phase 28: Excitement/contentment signal shifts
    const habitatHue = _habitat.hueShift;
    const signalHue = _signals.excitementHueShift;
    const contentLit = Math.sin(_signals.contentmentPhase) * 4; // ±4% brightness pulse

    const h = baseHue + circadianHue + stressHue + moodHue + driftHue + seasonHue + habitatHue + signalHue;
    // Phase 18G: Ambient light adaptation (saturation shift for contrast)
    // Phase 40: Camouflage — mood-dependent saturation/lightness shift toward background
    const s = Math.min(Math.max(baseSat + stressSat + moodSat + satPulse + _ambient.satShift + seasonSat + _camouflage.satShift, 20), 100);
    // Phase 18E+18G+21+28+40: Psychosomatic + ambient + seasonal + contentment + camouflage lightness shift
    const l = Math.min(Math.max(baseLit + circadianLit + moodLit + _psychosom.lightness + _ambient.lightnessShift + seasonLit + contentLit + _camouflage.litShift, 15), 85);

    // Phase 29: Enhanced bioluminescence — boost glow at night
    var isNightBio = _circadian.isAsleep || (new Date().getHours() >= 22 || new Date().getHours() < 6);
    var nightGlow = isNightBio ? CFG.biolum.nightGlowBoost : 1;
    var glowAlpha = ageVal(CFG.glowIntensity) * _chromaBlend.glowMod * 0.15 * nightGlow;

    return {
      bodyHsl: `hsl(${h}, ${s}%, ${l}%)`,
      bodyHslAlpha: function(a) { return `hsla(${h}, ${s}%, ${l}%, ${a})`; },
      tentHsl: `hsl(${h + 5}, ${s - 5}%, ${l + 5}%)`,
      tentHslAlpha: function(a) { return `hsla(${h + 5}, ${s - 5}%, ${l + 5}%, ${a})`; },
      glowHsl: `hsla(${h - 10}, ${s + 10}%, ${l + 20}%, ${glowAlpha})`,
      eyeWhite: `hsl(${h}, 15%, 92%)`,
      pupilHsl: `hsl(${h + 30}, ${s + 20}%, ${Math.max(l - 25, 10)}%)`,
      h, s, l, isNightBio
    };
  }

  // 4A — Hull/envelope tentacle rendering (Catmull-Rom → Bézier)

  // Compute tangent at point i in a polyline (central differences, extrapolate at ends)
  function polyTangent(xs, ys, i, n) {
    let dx, dy;
    if (i === 0) {
      dx = xs[1] - xs[0];
      dy = ys[1] - ys[0];
    } else if (i === n - 1) {
      dx = xs[n - 1] - xs[n - 2];
      dy = ys[n - 1] - ys[n - 2];
    } else {
      dx = (xs[i + 1] - xs[i - 1]) * 0.5;
      dy = (ys[i + 1] - ys[i - 1]) * 0.5;
    }
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { tx: dx / len, ty: dy / len, nx: -dy / len, ny: dx / len };
  }

  // Draw one side of a hull as Catmull-Rom → cubic Bézier segments
  // Draw Catmull-Rom spline through hull points. reverse=true draws backward.
  function drawHullSide(pts, n, reverse) {
    if (n < 2) return;
    const tau = CFG.hullCatmullTension;
    if (!reverse) {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < n - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, n - 1)];
        ctx.bezierCurveTo(
          p1.x + (p2.x - p0.x) / tau, p1.y + (p2.y - p0.y) / tau,
          p2.x - (p3.x - p1.x) / tau, p2.y - (p3.y - p1.y) / tau,
          p2.x, p2.y);
      }
    } else {
      // Draw from last to first (no array mutation)
      ctx.moveTo(pts[n - 1].x, pts[n - 1].y);
      for (let i = n - 1; i > 0; i--) {
        const p0 = pts[Math.min(i + 1, n - 1)];
        const p1 = pts[i];
        const p2 = pts[i - 1];
        const p3 = pts[Math.max(i - 2, 0)];
        ctx.bezierCurveTo(
          p1.x + (p2.x - p0.x) / tau, p1.y + (p2.y - p0.y) / tau,
          p2.x - (p3.x - p1.x) / tau, p2.y - (p3.y - p1.y) / tau,
          p2.x, p2.y);
      }
    }
  }

  // 12B: Pre-allocated hull point arrays (zero-allocation render loop)
  const _hullLeft = new Array(JOINTS);
  const _hullRight = new Array(JOINTS);
  for (let j = 0; j < JOINTS; j++) {
    _hullLeft[j] = { x: 0, y: 0 };
    _hullRight[j] = { x: 0, y: 0 };
  }

  function renderTentaclesHull(colors) {
    // Phase 18A: Genesis tentacle width variation
    const baseW = ageVal(CFG.hullBaseWidth) * _genesis.tentacleWidth;
    const noiseAmp = CFG.hullNoiseAmplitude;
    const tipAlpha = CFG.hullTipAlpha;
    const t60 = frameCount * 0.01; // slow noise evolution

    // State batching: all tentacles as sub-paths, one fill
    ctx.beginPath();

    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];
      const leftPts = _hullLeft;
      const rightPts = _hullRight;

      for (let j = 0; j < JOINTS; j++) {
        const tang = polyTangent(arm.x, arm.y, j, JOINTS);
        // Linear tapering: full width at base, near-zero at tip
        const taper = 1 - (j / (JOINTS - 1));
        // Noise modulation for organic feel
        const nv = noise.noise2D(arm.x[j] * 0.02 + t60, arm.y[j] * 0.02 + t * 3.7);
        const w = baseW * taper * (1 + nv * noiseAmp);

        leftPts[j].x = arm.x[j] + tang.nx * w;
        leftPts[j].y = arm.y[j] + tang.ny * w;
        rightPts[j].x = arm.x[j] - tang.nx * w;
        rightPts[j].y = arm.y[j] - tang.ny * w;
      }

      // Draw hull: right side forward, arc at tip, left side backward
      drawHullSide(rightPts, JOINTS);

      // Rounded tip
      const tipIdx = JOINTS - 1;
      ctx.arc(arm.x[tipIdx], arm.y[tipIdx], baseW * 0.15, 0, Math.PI);

      // Left side backward (reverse traversal, no mutation)
      drawHullSide(leftPts, JOINTS, true);

      // Close back to base
      ctx.closePath();
    }

    // Single fill for all tentacles (higher alpha for dark bg visibility)
    ctx.fillStyle = colors.tentHslAlpha(0.75);
    ctx.fill();

    // Subtle outline stroke for tentacle definition
    ctx.strokeStyle = colors.tentHslAlpha(0.2);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Second pass: tip highlights — radial glow on dark bg (bioluminescence)
    var darkBg = _ambient.adapted < 0.4;
    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];
      const tipX = arm.x[JOINTS - 1];
      const tipY = arm.y[JOINTS - 1];
      const tipR = baseW * 0.4;

      if (arm.recoilTimer > 0) {
        ctx.fillStyle = 'rgba(255, 120, 100, 0.5)';
      } else if (darkBg) {
        // Phase 18.5: Bioluminescent tip glow on dark backgrounds
        var tipGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, tipR * 2.5);
        tipGlow.addColorStop(0, colors.tentHslAlpha(tipAlpha * 1.8));
        tipGlow.addColorStop(0.4, colors.tentHslAlpha(tipAlpha * 0.8));
        tipGlow.addColorStop(1, colors.tentHslAlpha(0));
        ctx.fillStyle = tipGlow;
      } else {
        ctx.fillStyle = colors.tentHslAlpha(tipAlpha);
      }
      ctx.beginPath();
      ctx.arc(tipX, tipY, darkBg ? tipR * 2.5 : tipR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4B — Body rendering with noise deformation
  function renderBody(colors) {
    const x = lili.pos.x;
    const y = lili.pos.y;
    const r = lili.bodyR;
    // Phase 18A: Genesis body variation (unique proportions per instance)
    const rx = r * CFG.bodyRadiusXScale * _genesis.bodyXScale;
    const ry = r * CFG.bodyRadiusYScale * _genesis.bodyYScale;

    // Breathing modulation (Research #1: 18 bpm sine, 3% amplitude)
    // Phase 13C: mood modulates breathing rate and depth
    // Phase 18D: Sleep → slower, deeper breathing
    // Phase 18E: Psychosomatic → long-term breath rate shift
    const breathT = frameCount / 60;
    var breathRateMod = _bodyBlend.breathMod * _psychosom.breathRate;
    var breathDepthMod = 0.7 + _bodyBlend.breathMod * 0.5;
    if (_circadian.isAsleep) {
      breathRateMod *= CFG.sleepAnim.breathSlowFactor;
      breathDepthMod *= CFG.sleepAnim.breathDeepFactor;
    }
    const breathFreq = (CFG.breathingBpm / 60) * breathRateMod;
    const breathAmp = CFG.breathingAmplitude * breathDepthMod;
    const breathMod = 1 + Math.sin(breathT * breathFreq * Math.PI * 2) * breathAmp;

    // Pulse-glide mantle deformation
    const powerRatio = ageVal(CFG.pulsePowerRatio);
    const contraction = ageVal(CFG.mantleContraction);
    let pulseMod = 1.0;
    if (lili.pulsePhase < powerRatio) {
      const strokeT = lili.pulsePhase / powerRatio;
      pulseMod = 1 - contraction * Math.sin(strokeT * Math.PI);
    } else {
      const glideT = (lili.pulsePhase - powerRatio) / (1 - powerRatio);
      pulseMod = 1 + contraction * 0.3 * Math.sin(glideT * Math.PI * 0.5);
    }

    // Phase 13C: mood body scale (shy=shrink, playful=expand)
    // Phase 18E: Psychosomatic long-term body scale
    // Phase 18C: Micro-expression body scale (startle=shrink, relief=expand)
    var microScale = 1.0;
    if (_microExpr.startle > 0) microScale *= 1 + (_microExpr.startle * (CFG.microExpr.startleBodyShrink - 1));
    if (_microExpr.relief > 0) microScale *= 1 + (_microExpr.relief * (CFG.microExpr.reliefBodyExpand - 1));
    // Phase 30: Anticipation → body tenses (slight shrink)
    if (_anticipation.intensity > 0.1) microScale *= 1 - (_anticipation.intensity * CFG.anticipation.tenseFactor);
    const moodScale = _bodyBlend.bodyScale * _psychosom.bodyScale * microScale;
    const finalRx = rx * breathMod * pulseMod * moodScale;
    const finalRy = ry * breathMod * pulseMod * moodScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lili.heading + _genesis.headTilt);

    // Glow (bioluminescence — age-dependent intensity, visible on dark bg)
    // Phase 13C: mood glow pulsation (curious/exploring pulse at ~0.5Hz)
    // Phase 18E: Psychosomatic glow boost (stressed → defense glow)
    // Phase 18C: Joy micro-expression → glow flash
    const glowR = r * 3.0;
    // Phase 18G: Ambient glow adaptation (dark bg → more glow, light bg → less)
    let glowIntensity = ageVal(CFG.glowIntensity) * _chromaBlend.glowMod * _psychosom.glowBoost * _ambient.glowMul;
    if (_bodyBlend.glowPulseHz > 0) {
      glowIntensity *= 1 + Math.sin(frameCount / 60 * _bodyBlend.glowPulseHz * Math.PI * 2) * 0.25;
    }
    if (_microExpr.joy > 0) glowIntensity *= 1 + _microExpr.joy * (CFG.microExpr.joyGlowFlash - 1);
    const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, glowR);
    glow.addColorStop(0, colors.bodyHslAlpha(glowIntensity * 0.18));
    glow.addColorStop(0.4, colors.bodyHslAlpha(glowIntensity * 0.08));
    glow.addColorStop(1, colors.bodyHslAlpha(0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, glowR, glowR, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body: noise-deformed ellipse for organic mantle shape
    const nPts = CFG.bodyNoisePoints;
    const noiseAmp = ageVal(CFG.bodyNoiseAmplitude);
    const noiseT = frameCount * CFG.bodyNoiseSpeed * 0.01;

    ctx.beginPath();
    for (let i = 0; i <= nPts; i++) {
      const angle = (i / nPts) * Math.PI * 2;
      const baseX = Math.cos(angle) * finalRx;
      const baseY = Math.sin(angle) * finalRy;
      // Noise displacement along the radial direction
      const nv = noise.noise2D(Math.cos(angle) * 2 + noiseT, Math.sin(angle) * 2 + noiseT * 0.7);
      const displacement = 1 + nv * noiseAmp;
      const px = baseX * displacement;
      const py = baseY * displacement;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // Body fill with richer gradient (3D roundness)
    const bodyGrad = ctx.createRadialGradient(
      -finalRx * 0.15, -finalRy * 0.25, finalRx * 0.05,
      0, 0, Math.max(finalRx, finalRy));
    bodyGrad.addColorStop(0, colors.bodyHslAlpha(0.92));
    bodyGrad.addColorStop(0.45, colors.bodyHslAlpha(0.8));
    bodyGrad.addColorStop(0.8, colors.bodyHslAlpha(0.65));
    bodyGrad.addColorStop(1, colors.bodyHslAlpha(0.45));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Body specular highlight (lit side — matches gradient light source)
    var specSize = Math.min(finalRx, finalRy) * 0.18;
    var specGrad = ctx.createRadialGradient(
      -finalRx * 0.28, -finalRy * 0.32, specSize * 0.1,
      -finalRx * 0.28, -finalRy * 0.32, specSize);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    specGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.arc(-finalRx * 0.28, -finalRy * 0.32, specSize, 0, Math.PI * 2);
    ctx.fill();

    // Phase 18F: Chromatophore cells (visible pulsing spots on body surface)
    var cellCount = Math.round(ageVal(CFG.chromatophoreCells.countByAge) || 0);
    if (cellCount > 0) {
      var CC = CFG.chromatophoreCells;
      for (var ci = 0; ci < cellCount; ci++) {
        var cell = _genesis.chromatophores[ci];
        if (!cell) continue;
        // Position inside body perimeter (~65% radius for visibility)
        var cAngle = cell.angle;
        var cx = Math.cos(cAngle) * finalRx * 0.65;
        var cy = Math.sin(cAngle) * finalRy * 0.65;
        // Pulsing: each cell has its own rhythm
        var pulse = 0.5 + 0.5 * Math.sin(frameCount * cell.speed + cell.phase);
        var cr = CC.minRadius + (CC.maxRadius - CC.minRadius) * pulse;
        var cellAlpha = CC.baseAlpha * (0.4 + pulse * 0.6);
        // Color: base hue + cell-specific offset
        ctx.fillStyle = 'hsla(' + (colors.h + cell.hueOffset) + ',' +
          Math.min(colors.s + 15, 100) + '%,' + Math.max(colors.l - 5, 10) + '%,' + cellAlpha + ')';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // 4C — Eyes (track cursor, reactive pupils)
  // Phase 13B: blinking, mood-driven pupil dilation, squint, gaze direction
  function renderEyes(colors) {
    const x = lili.pos.x;
    const y = lili.pos.y;
    const r = lili.bodyR;

    const eyeR = r * ageVal(CFG.eyeRadiusFactor);
    const pupilR = eyeR * CFG.pupilRadiusFactor;
    // Phase 18A: Genesis eye variation (unique per instance)
    const spacing = r * CFG.eyeSpacing * _genesis.eyeSpacing;
    const yOff = r * CFG.eyeYOffset * _genesis.eyeYOffset;

    // Compute eye positions in world space (rotated by heading)
    const cosH = Math.cos(lili.heading + _genesis.headTilt);
    const sinH = Math.sin(lili.heading + _genesis.headTilt);

    // Eyes are perpendicular to heading, offset forward
    const fwdX = cosH * yOff;
    const fwdY = sinH * yOff;
    const perpX = -sinH * spacing;
    const perpY = cosH * spacing;

    const leftEyeX = x + fwdX + perpX;
    const leftEyeY = y + fwdY + perpY;
    const rightEyeX = x + fwdX - perpX;
    const rightEyeY = y + fwdY - perpY;

    // Pupil offset: track mouse position (or DOM element for curious/exploring)
    const maxOff = eyeR * CFG.eyePupilMaxOffset;

    // Phase 18.5: Smooth gaze tracking (lerp toward target each frame)
    var rawGazeX = mouse.pos.x;
    var rawGazeY = mouse.pos.y;
    if (_eyeBlend.gazeDOM) {
      var nearbyGaze = getNearby(lili.pos.x, lili.pos.y);
      if (nearbyGaze.length > 0) {
        rawGazeX = nearbyGaze[0].x + nearbyGaze[0].w * 0.5;
        rawGazeY = nearbyGaze[0].y + nearbyGaze[0].h * 0.5;
      }
    }
    if (!_gaze.initialized) {
      _gaze.x = rawGazeX; _gaze.y = rawGazeY;
      _gaze.initialized = true;
    } else {
      var gl = CFG.eyePolish.gazeLerp;
      _gaze.x += (rawGazeX - _gaze.x) * gl;
      _gaze.y += (rawGazeY - _gaze.y) * gl;
    }

    // Phase 18.5: Saccades — involuntary micro-jitter when idle
    var EP = CFG.eyePolish;
    _gaze.saccadeTimer--;
    if (_gaze.saccadeTimer <= 0) {
      var sa = EP.saccadeAmplitude;
      _gaze.saccadeX = (Math.random() - 0.5) * 2 * sa;
      _gaze.saccadeY = (Math.random() - 0.5) * 2 * sa;
      _gaze.saccadeTimer = EP.saccadeIntervalMin +
        Math.floor(Math.random() * (EP.saccadeIntervalMax - EP.saccadeIntervalMin));
    }
    // Decay saccade offset quickly
    _gaze.saccadeX *= 0.75;
    _gaze.saccadeY *= 0.75;

    // Phase 13B: Blink eyelid factor (0=open, 1=closed)
    // Phase 18.5: Ease-in-out-cubic for natural eyelid motion
    const blinkDur = CFG.blinkDurationFrames;
    let lidClose = 0;
    if (_blink.phase > 0) {
      const half = blinkDur * 0.5;
      const remaining = _blink.phase;
      var rawLid;
      if (remaining > half) {
        rawLid = (blinkDur - remaining) / half; // closing 0→1
      } else {
        rawLid = remaining / half; // opening 1→0
      }
      // Ease-in-out-cubic: fast close, slow open feel
      lidClose = rawLid < 0.5
        ? 4 * rawLid * rawLid * rawLid
        : 1 - Math.pow(-2 * rawLid + 2, 3) / 2;
    }

    // Phase 13B: Squint from mood (playful = slight squint)
    // Phase 15B: Circadian eye closure (sleeping = eyes nearly closed)
    // Phase 18C: Joy micro-expression adds squint (happy eyes)
    const squintAmount = _eyeBlend.squint + (1 - _circadian.eyeOpenness) * 0.9
      + _microExpr.joy * CFG.microExpr.joySquint;

    function drawEye(ex, ey, isLeft) {
      // Soft eye shadow (subtle depth)
      ctx.fillStyle = colors.bodyHslAlpha(0.3);
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Phase 13B: Eyelid clipping (blink + squint)
      const totalLid = Math.min(lidClose + squintAmount, 0.95);
      if (totalLid > 0.01) {
        ctx.save();
        ctx.beginPath();
        // Clip to lower portion of eye circle (eyelid closes from top)
        const clipY = ey - eyeR + eyeR * 2 * totalLid;
        ctx.rect(ex - eyeR * 1.5, clipY, eyeR * 3, eyeR * 3);
        ctx.clip();
      }

      // Sclera (warm white, slight gradient for roundness)
      const scleraGrad = ctx.createRadialGradient(
        ex - eyeR * 0.15, ey - eyeR * 0.15, eyeR * 0.1,
        ex, ey, eyeR);
      scleraGrad.addColorStop(0, 'rgba(255, 252, 248, 0.95)');
      scleraGrad.addColorStop(1, colors.eyeWhite);
      ctx.fillStyle = scleraGrad;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Pupil gaze target: smoothed + saccade micro-jitter (Phase 18.5)
      let dx = (_gaze.x + _gaze.saccadeX) - ex;
      let dy = (_gaze.y + _gaze.saccadeY) - ey;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Idle: gaze drifts to center (looking "into the void")
      if (lili.mood === 'idle' && lili.moodBlend > 0.5) {
        const blend = Math.min((lili.moodBlend - 0.5) * 2, 1);
        dx *= (1 - blend * 0.7);
        dy *= (1 - blend * 0.7);
      }

      // Phase 18C: Curiosity tilt — one eye drifts toward DOM, other stays
      if (_microExpr.curiosityTilt > 0 && isLeft) {
        // Left eye: look at nearby DOM element (head tilt effect)
        var nearby2 = getNearby(lili.pos.x, lili.pos.y);
        if (nearby2.length > 0) {
          var nel = nearby2[0];
          var ndx = (nel.x + nel.w * 0.5) - ex;
          var ndy = (nel.y + nel.h * 0.5) - ey;
          dx += (ndx - dx) * _microExpr.curiosityTilt * 0.6;
          dy += (ndy - dy) * _microExpr.curiosityTilt * 0.6;
        }
      }

      const off = Math.min(dist * 0.01, maxOff);
      const px = ex + (dx / dist) * off;
      const py = ey + (dy / dist) * off;

      // Pupil size: base stress dilation + Phase 13B mood modulation
      // Phase 18C: Startle → pupils dilate wide
      var microPupil = 1.0;
      if (_microExpr.startle > 0) microPupil *= 1 + _microExpr.startle * (CFG.microExpr.startlePupilScale - 1);
      const pupilScale = (0.85 + stress * 0.35 + Math.min(lili.vel.mag() * 0.03, 0.2))
        * _eyeBlend.pupilScale * microPupil;

      // Pupil with subtle radial gradient (depth)
      const pupilGrad = ctx.createRadialGradient(
        px - pupilR * 0.1, py - pupilR * 0.1, pupilR * 0.05,
        px, py, pupilR * pupilScale);
      pupilGrad.addColorStop(0, colors.pupilHsl);
      pupilGrad.addColorStop(0.7, colors.pupilHsl);
      pupilGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = pupilGrad;
      ctx.beginPath();
      ctx.arc(px, py, pupilR * pupilScale, 0, Math.PI * 2);
      ctx.fill();

      // Restore clipping if we applied eyelid
      if (totalLid > 0.01) {
        ctx.restore();

        // Draw eyelid skin over the clipped area
        ctx.fillStyle = colors.bodyHslAlpha(0.85);
        ctx.beginPath();
        const lidY = ey - eyeR + eyeR * 2 * totalLid;
        ctx.arc(ex, ey, eyeR, -Math.PI, 0);
        ctx.lineTo(ex + eyeR, lidY);
        ctx.lineTo(ex - eyeR, lidY);
        ctx.closePath();
        if (lidY < ey + eyeR) ctx.fill();
      }

      // Primary specular highlight (larger, softer — gives life)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.18, ey - eyeR * 0.22, eyeR * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // Secondary tiny sparkle (adds dimension)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(ex + eyeR * 0.15, ey + eyeR * 0.12, eyeR * 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Phase 29: Inner eye glow at night (bioluminescence)
      if (colors.isNightBio && _ambient.adapted < 0.4) {
        var eyeGlow = ctx.createRadialGradient(px, py, 0, px, py, eyeR * 0.8);
        eyeGlow.addColorStop(0, `hsla(${colors.h + 30}, 80%, 70%, ${CFG.biolum.eyeGlowAlpha})`);
        eyeGlow.addColorStop(1, `hsla(${colors.h + 30}, 60%, 50%, 0)`);
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawEye(leftEyeX, leftEyeY, true);
    drawEye(rightEyeX, rightEyeY, false);
  }

  // 15F — Enhanced DOM: render grabbed text on canvas near tentacle tips
  function renderEnhancedDomText(colors) {
    _enhancedDom.texts.length = 0;
    const EC = CFG.enhancedDom;
    for (let t = 0; t < TENT_N; t++) {
      var arm = tentacles[t];
      if (!arm.heldElement) continue;
      var el = arm.heldElement;
      var raw = el.textContent || '';
      var txt = raw.trim().substring(0, EC.canvasTextMaxLen);
      if (!txt) continue;
      // Get tentacle tip position
      var tip = arm.points[arm.points.length - 1];
      _enhancedDom.texts.push({ text: txt, x: tip.x, y: tip.y });
    }

    if (_enhancedDom.texts.length === 0) return;

    ctx.font = EC.canvasTextFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (var i = 0; i < _enhancedDom.texts.length; i++) {
      var item = _enhancedDom.texts[i];
      var sway = Math.sin(frameCount * EC.textSwaySpeed + i * 2) * EC.textSwayAmplitude;
      var alpha = 0.75 + Math.sin(frameCount * 0.02) * 0.15;

      ctx.fillStyle = 'rgba(60, 50, 80, ' + alpha.toFixed(2) + ')';
      ctx.fillText(item.text, item.x + sway, item.y - 10);
    }
  }

  // =========================================================================
  // 1D — Canvas bootstrap & lifecycle
  // =========================================================================

  let canvas, ctx;
  let W = 0, H = 0;          // viewport dimensions (CSS px)
  let dpr = 1;                // device pixel ratio
  let paused = false;         // tab hidden
  let lastTime = 0;           // rAF timestamp
  let dt = 0;                 // delta time in seconds (capped)
  let frameCount = 0;

  // Document-space coordinate system:
  // lili.pos is in document (page) coordinates — stays fixed on the page when scrolling.
  // Canvas is position:fixed (viewport-sized for perf), rendering applies scroll offset.
  let scrollOx = 0, scrollOy = 0;   // current scroll offset (document→viewport transform)
  let docW = 0, docH = 0;           // full document dimensions (Lili's world bounds)

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = CFG.canvasId;
    canvas.style.cssText =
      'position:fixed;top:0;left:0;width:100vw;height:100vh;' +
      'pointer-events:none;z-index:' + CFG.canvasZIndex + ';';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resizeCanvas();
  }

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateDocDimensions();
  }

  function updateDocDimensions() {
    const de = document.documentElement;
    const b = document.body;
    docW = Math.max(de.scrollWidth, b.scrollWidth, W);
    docH = Math.max(de.scrollHeight, b.scrollHeight, H);
  }

  // Debounced resize handler
  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, CFG.resizeDebounceMs);
  }

  // Visibility-based pause
  function onVisibilityChange() {
    paused = document.hidden;
    if (!paused) lastTime = 0; // reset delta so no huge jump
  }

  // =========================================================================
  // Main loop
  // =========================================================================

  function tick(timestamp) {
    requestAnimationFrame(tick);

    if (paused) return;

    // Delta time with safety cap (e.g. tab was slow)
    if (lastTime === 0) lastTime = timestamp;
    dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap at 50ms
    lastTime = timestamp;

    frameCount++;

    update(dt);
    render();
  }

  function update(frameDt) {
    // Update scroll offset every frame (smooth scrolling may change between events)
    scrollOx = window.scrollX || window.pageXOffset || 0;
    scrollOy = window.scrollY || window.pageYOffset || 0;

    updateAge();
    lili.bodyR = ageVal(CFG.bodyRadius) * growthScale(); // grow with age (Phase 41: smooth scaling)
    updateCircadian();                   // Phase 15B: day/night rhythm
    updateSleepAnim();                   // Phase 18D: REM twitch management
    updateAmbient();                     // Phase 18G: background light awareness
    // Phase 19B: Replay — feed recorded cursor data or record live cursor
    if (!replayFeedCursor()) replayRecordCursor();
    updateMouse();
    updateSensors();
    updateStress();
    updateEndocrine();   // Phase 53: hormonal dynamics before brain decisions
    // Phase 21: Seasonal modulation (affects chromatophores in updateMoodBlend)
    updateSeason();
    brainDecisionCycle(); // Phase 8: RL mood selection before physics
    updateMoodBlend();   // Phase 13: smooth mood expression blending
    updateMicroExpr();   // Phase 18C: decay micro-expression intensities
    updatePhysics(frameDt);
    updateTentacles(frameDt);

    // Phase 15A: Place memory decay (every decision cycle)
    if (_decision.frameCounter === 0) {
      placeMemoryDecay();
      domLearningDecay(); // Phase 15D
    }

    // Phase 15E: Ink emission when stressed
    if (stress > CFG.ink.stressThreshold) emitInk();
    updateInk();

    // Phase 16A: Novelty decay
    if (_decision.frameCounter === 0) noveltyDecay();

    // Phase 16B: Bubble communication
    emitBubble();
    updateBubbles();

    // Phase 22: Sound landscape update
    soundUpdateBreathing();

    // Phase 25: Dream replay (experience consolidation during sleep)
    dreamReplay();

    // Phase 27: Habitat awareness (page color adaptation)
    updateHabitat();

    // Phase 28: Non-verbal communication signals
    signalUpdate();

    // Phase 29: Bioluminescence trail particles
    updateBioTrail();

    // Phase 30: Anticipation (predictive pre-reaction)
    updateAnticipation();

    // Phase 31: Energy/fatigue management
    updateEnergy();

    // Phase 32: Habituation (stimulus adaptation)
    updateHabituation();

    // Phase 34: Cursor pattern recognition
    updateCursorPattern();

    // Phase 36: Temporal pattern learning
    temporalUpdate();

    // Phase 38: Surprise signal decay
    updateSurprise();

    // Phase 39: Ink defense burst check + particle update
    inkDefenseTryBurst();
    updateInkDefense();

    // Phase 40: Camouflage intensity update
    updateCamouflage();

    // Phase 45: Death animation (elder phase endpoint)
    updateDeath();

    // Phase 46: Page memory update (periodic)
    if (_decision.frameCounter === 0) pageMemoryUpdate();

    // Phase 52: Seasonal sound modulation
    seasonalSoundModulate();

    checkMidnightCleanup(); // Phase 9D: periodic midnight reset check
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 12A: Render culling — skip Canvas rendering if Lili is fully offscreen
    if (isOnScreen()) {
      const colors = computeColors();

      // Apply scroll offset: lili.pos is in document coords, canvas is viewport
      ctx.save();
      ctx.translate(-scrollOx, -scrollOy);
      // Phase 45: Death fade — entire organism fades
      ctx.globalAlpha = deathAlpha();

      // 4E — Rendering pipeline (correct z-order)
      // 0. Bioluminescent trail behind everything (Phase 29)
      renderBioTrail();

      // 1. Ink cloud behind everything (Phase 15E)
      renderInk(colors);

      // 1b. Defense ink burst (Phase 39) — larger, more dramatic
      renderInkDefense();

      // 2. Tentacles behind body (hull envelope rendering)
      renderTentaclesHull(colors);

      // 3. Body (noise-deformed ellipse with glow)
      renderBody(colors);

      // 4. Eyes (on top of body) — circadian eye openness applied
      renderEyes(colors);

      // 5. Enhanced DOM: render grabbed text on canvas (Phase 15F)
      renderEnhancedDomText(colors);

      // 6. Bubble communication (Phase 16B) — floats above body
      renderBubbles();

      ctx.restore();
    }

    // 12C: FPS monitoring (always runs, even when offscreen)
    updateFps();
    checkFpsWarning();

    // Phase 10B: Debug panel update (DOM, not Canvas)
    updateDebugPanel();

    // Phase 44: In-canvas debug overlay graphs
    debugOverlayRecord();
    renderDebugOverlay();

    // Phase 51: Q-table brain fingerprint visualization
    renderQtableVis();
  }

  // =========================================================================
  // Boot
  // =========================================================================

  function boot() {
    const bootStart = performance.now();
    initCanvas();

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    // Phase 42: Mobile touch interaction
    document.addEventListener('touchstart', touchStart, { passive: true });
    document.addEventListener('touchend', touchEnd, { passive: true });

    // Genesis timestamp (never overwrite — PRD rule)
    if (!localStorage.getItem(CFG.storageKeys.genesis)) {
      localStorage.setItem(CFG.storageKeys.genesis, String(Date.now()));
    }
    age.genesisMs = parseInt(localStorage.getItem(CFG.storageKeys.genesis), 10);

    // Phase 18A: Compute genesis body variation (unique per instance)
    computeGenesis(age.genesisMs);

    // Phase 18B: Load psychosomatic long-term adaptation
    psychosomLoad();

    // Phase 53: Load endocrine state
    endocrineLoad();

    // Register phase transition listeners
    onPhaseTransition(function (from, to, atMs) {
      const days = (atMs / 86400000).toFixed(1);
      console.info('[Lili] Phase transition: ' + from + ' → ' + to + ' at day ' + days);
      // Phase 50: Narrative entry for phase transition
      narrativeAdd('phase', 'Day ' + days + ': Lili grew from ' + from + ' to ' + to + '. A new chapter begins.');
    });
    onPhaseTransition(_onPhaseTransitionJournal); // Phase 8: journal milestone

    updateAge();

    // Increment visit counter
    const visits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10);
    localStorage.setItem(CFG.storageKeys.visits, String(visits + 1));

    // Phase 15: Load persistent memory subsystems
    placeMemoryLoad();
    domLearningLoad();
    visitProfileLoad();

    // Phase 36-37: Load temporal patterns and temperament
    temporalLoad();
    temperamentLoad();

    // Phase 46+49+50: Load page memory, narrative, init worker
    pageMemoryLoad();
    narrativeLoad();
    initBrainWorker();

    // Phase 15C: Register this visit and compute trust
    _visitProfile.totalVisits++;
    _visitProfile.timestamps.push(Date.now());
    while (_visitProfile.timestamps.length > CFG.visitRecognition.maxTimestamps) {
      _visitProfile.timestamps.shift();
    }
    computeTrust();
    visitProfileSave();
    console.info('[Lili] Trust level: ' + _visitProfile.trustLevel.toFixed(2) +
      ' (' + _visitProfile.totalVisits + ' visits)');

    // Phase 8: Load Q-table and journal from localStorage
    brainLoad();
    journalLoad();
    syncBrainToWorker(); // Phase 49: Sync Q-table to worker
    console.info('[Lili] Brain loaded: ' + _qtable.size + ' Q-states, ' +
      _decision.totalDecisions + ' lifetime decisions, mood=' + lili.mood);

    // Phase 19A: Load baseline mode
    loadBaseline();
    if (_baseline.mode !== 'off') {
      console.info('[Lili] Baseline mode active: ' + _baseline.mode);
    }

    // Phase 21: Initial season detection
    _season.current = getSeason();
    _season.lastCheck = Date.now();

    // Phase 24: Load offspring data
    offspringLoad();

    // Phase 9A: Word wrapping disabled — breaks React/framework hydration.
    // Lili interacts with existing DOM elements via spatial hash instead.
    // wrapWords();

    // Initialize document-space coordinate system
    scrollOx = window.scrollX || window.pageXOffset || 0;
    scrollOy = window.scrollY || window.pageYOffset || 0;
    updateDocDimensions();

    // Phase 11A: Restore position from localStorage (or center of current viewport in document coords)
    lili.bodyR = ageVal(CFG.bodyRadius) * growthScale();
    if (!restorePosition()) {
      lili.pos.set(scrollOx + W * 0.5, scrollOy + H * 0.5);
    }

    // Initialize tentacles (8 FABRIK chains)
    initTentacles();

    // Build initial spatial hash grid (Phase 5 — after wrapWords so spans are indexed)
    buildSpatialHash();

    // Phase 9D: Check for missed midnight cleanup (e.g. user returns after days)
    midnightCleanup();

    // Rebuild on resize (debounced)
    window.addEventListener('resize', function () {
      setTimeout(buildSpatialHash, CFG.resizeDebounceMs + 50);
    });

    // Rebuild on scroll (DOM rects shift)
    window.addEventListener('scroll', function () {
      spatialHash.lastBuildMs = 0; // force rebuild on next call
      setTimeout(buildSpatialHash, 100);
    }, { passive: true });

    // MutationObserver: rebuild when DOM structure changes
    const observer = new MutationObserver(onDomMutation);
    observer.observe(document.body, { childList: true, subtree: true });

    // Phase 11: Save all state on page unload
    window.addEventListener('beforeunload', function () {
      brainSave();
      journalSaveMilestones();
      journalSaveRingBuffer();
      savePosition();
      placeMemorySave();     // Phase 15A
      domLearningSave();     // Phase 15D
      visitProfileSave();    // Phase 15C
      psychosomSave();       // Phase 18E
      pageMemorySave();      // Phase 46
      narrativeSave();       // Phase 50
      temporalSave();        // Phase 36
      temperamentSave();     // Phase 37
    });

    // Phase 11B: Request persistent storage + detect data loss
    requestPersistentStorage();
    detectDataLoss();

    // Phase 10: Click/tap on Lili → tooltip
    document.addEventListener('click', onLiliClick);
    document.addEventListener('touchstart', onLiliTouch, { passive: true });

    // Console API: window.lili.export(), .import(), .debug(), .status(), .data()
    exposeConsoleAPI();

    // 12C: Init timing
    const bootMs = performance.now() - bootStart;
    console.info('[Lili] Boot complete in ' + bootMs.toFixed(1) + 'ms' +
      (bootMs > CFG.maxInitMs ? ' \u26A0 exceeds target ' + CFG.maxInitMs + 'ms' : ''));
    console.info('[Lili] Created by Michal Strnadel — michalstrnadel.com | github.com/michalstrnadel/lili-octopus');

    // Phase 14: Cloud sync — load remote state, then start periodic sync
    syncLoad(function () {
      syncStart();
      console.info('[Lili] Sync: connected');
    });

    // Start loop
    lastTime = 0;
    requestAnimationFrame(tick);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
