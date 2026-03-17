/**
 * Lili — Autonomous Digital Octopus
 * Single-file IIFE, zero dependencies, Canvas 2D
 * Academic experiment in digital ontogenesis (10-year lifecycle)
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
    },

    // --- State space (7 sensors → 4320 states) ---
    stateSpace: {
      dimensions: 7,
      totalStates: 4320,
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
    hullBaseWidth: { hatchling: 0.8, juvenile: 2.2, adult: 4.0, mature: 4.5, elder: 5.0 },
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
    moodChromaBlendSpeed: 0.04, // lerp rate per frame (~2s to full transition)

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
      playful:   { breathMod: 1.3, bodyScale: 1.05, glowPulseHz: 0   },
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

    // --- Phase 15: Ink Secretion ---
    ink: {
      poolSize: 50,              // max particles
      stressThreshold: 0.8,      // stress > this to trigger
      cooldownMs: 8000,          // between emissions
      particleLifeMs: 2500,      // alpha fade duration
      emitCount: 8,              // particles per emission
      spreadSpeed: 2.5,          // initial spread velocity
      particleRadius: { min: 3, max: 7 },
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

    // --- Phase 16: Bubble Communication ---
    bubbles: {
      poolSize: 12,              // max simultaneous bubbles
      riseSpeed: 0.6,            // px/frame upward
      swayAmplitude: 8,          // px horizontal sway
      swaySpeed: 0.04,           // sway frequency
      lifetimeMs: 2800,          // fade duration
      cooldownMs: 5000,          // min ms between bubble emissions
      fontSize: 16,              // symbol size
      spawnRadius: 15,           // px offset from body center
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
    breathingAmplitude: 0.03,  // 3% of body radius

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

  // Pre-allocate ink particle pool
  (function initInkPool() {
    for (let i = 0; i < CFG.ink.poolSize; i++) {
      _ink.pool.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, r: 4, born: 0, life: 0 });
    }
  })();

  function emitInk() {
    const now = Date.now();
    if (now - _ink.lastEmitMs < CFG.ink.cooldownMs) return;
    _ink.lastEmitMs = now;

    const IC = CFG.ink;
    // Emit away from cursor
    const dx = lili.pos.x - mouse.pos.x;
    const dy = lili.pos.y - mouse.pos.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const awayX = dx / d;
    const awayY = dy / d;

    let emitted = 0;
    for (let i = 0; i < IC.poolSize && emitted < IC.emitCount; i++) {
      var p = _ink.pool[i];
      if (p.active) continue;
      p.active = true;
      p.x = lili.pos.x + (noiseRng() - 0.5) * lili.bodyR;
      p.y = lili.pos.y + (noiseRng() - 0.5) * lili.bodyR;
      const angle = Math.atan2(awayY, awayX) + (noiseRng() - 0.5) * 1.2;
      const spd = IC.spreadSpeed * (0.6 + noiseRng() * 0.8);
      p.vx = Math.cos(angle) * spd;
      p.vy = Math.sin(angle) * spd;
      p.r = IC.particleRadius.min + noiseRng() * (IC.particleRadius.max - IC.particleRadius.min);
      p.born = now;
      p.life = IC.particleLifeMs;
      emitted++;
    }
    _ink.activeCount += emitted;
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
      // Drift
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      active++;
    }
    _ink.activeCount = active;
  }

  function renderInk(colors) {
    if (_ink.activeCount === 0) return;
    const now = Date.now();
    for (let i = 0; i < CFG.ink.poolSize; i++) {
      var p = _ink.pool[i];
      if (!p.active) continue;
      const elapsed = now - p.born;
      const t = elapsed / p.life;
      // Quadratic alpha fade
      const alpha = (1 - t) * (1 - t) * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + t * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 12, 20, ' + alpha.toFixed(3) + ')';
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
        return NC.rewardBonus;
      }
    }
    return 0;
  }

  // =========================================================================
  // 16B — Bubble Communication (symbol emissions based on internal state)
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
        symbol: '',
        x: 0, y: 0,
        born: 0,
        phase: 0, // sway phase offset
      });
    }
  })();

  // Determine which symbol to emit based on Lili's internal state
  function chooseBubbleSymbol() {
    if (_circadian.isAsleep) return '💤';
    if (_visitProfile.trustLevel > 0.7 && sensors.cursorProximity === 'near') return '♥';
    if (lili.mood === 'curious' && sensors.domDensity !== 'sparse') return '?';
    if (stress > 0.7) return '!';
    if (lili.mood === 'playful') return '~';
    if (_novelty.pendingNewRects.length > 0) return '✦';
    if (lili.mood === 'calm' && _visitProfile.trustLevel > 0.4) return '◦';
    return null; // no bubble
  }

  function emitBubble() {
    const now = Date.now();
    if (now - _bubbles.lastEmitMs < CFG.bubbles.cooldownMs) return;
    const symbol = chooseBubbleSymbol();
    if (!symbol) return;

    // Find inactive slot
    for (let i = 0; i < CFG.bubbles.poolSize; i++) {
      var b = _bubbles.pool[i];
      if (b.active) continue;
      b.active = true;
      b.symbol = symbol;
      b.x = lili.pos.x + (noiseRng() - 0.5) * CFG.bubbles.spawnRadius * 2;
      b.y = lili.pos.y - lili.bodyR * 0.8;
      b.born = now;
      b.phase = noiseRng() * Math.PI * 2;
      _bubbles.activeCount++;
      _bubbles.lastEmitMs = now;
      return;
    }
  }

  function updateBubbles() {
    if (_bubbles.activeCount === 0) return;
    const now = Date.now();
    const BC = CFG.bubbles;
    let active = 0;
    for (let i = 0; i < BC.poolSize; i++) {
      var b = _bubbles.pool[i];
      if (!b.active) continue;
      const elapsed = now - b.born;
      if (elapsed >= BC.lifetimeMs) { b.active = false; continue; }
      // Rise upward
      b.y -= BC.riseSpeed;
      // Sway
      b.x += Math.sin(b.phase + elapsed * BC.swaySpeed) * BC.swayAmplitude * 0.02;
      active++;
    }
    _bubbles.activeCount = active;
  }

  function renderBubbles() {
    if (_bubbles.activeCount === 0) return;
    const now = Date.now();
    const BC = CFG.bubbles;
    ctx.font = BC.fontSize + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < BC.poolSize; i++) {
      var b = _bubbles.pool[i];
      if (!b.active) continue;
      const t = (now - b.born) / BC.lifetimeMs; // 0..1
      const alpha = t < 0.1 ? t / 0.1 : (1 - t); // fade in briefly, then fade out
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillText(b.symbol, b.x, b.y);
    }
    ctx.globalAlpha = 1;
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

    // Numeric state index for Q-Learning (4320 states)
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
  };
  // Dimension sizes: 3 × 4 × 3 × 3 × 2 × 4 × 5 = 4320
  const _sensorDims = [3, 4, 3, 3, 2, 4, 5];

  function updateSensors() {
    sensors.cursorProximity = getCursorProximity();
    sensors.cursorVelocity = mouse.classification;
    sensors.domDensity = getDomDensity();
    sensors.whitespace = getWhitespaceProximity();
    sensors.scrollState = scrollActive ? 'active' : 'idle';
    sensors.timeOfDay = getTimeOfDay();
    sensors.agePhase = age.phase;

    // Compute flat state index (mixed-radix encoding)
    sensors.stateIndex =
      _sensorIndices.cursorProximity[sensors.cursorProximity]
      * _sensorDims[1] * _sensorDims[2] * _sensorDims[3] * _sensorDims[4] * _sensorDims[5] * _sensorDims[6]
      + _sensorIndices.cursorVelocity[sensors.cursorVelocity]
      * _sensorDims[2] * _sensorDims[3] * _sensorDims[4] * _sensorDims[5] * _sensorDims[6]
      + _sensorIndices.domDensity[sensors.domDensity]
      * _sensorDims[3] * _sensorDims[4] * _sensorDims[5] * _sensorDims[6]
      + _sensorIndices.whitespace[sensors.whitespace]
      * _sensorDims[4] * _sensorDims[5] * _sensorDims[6]
      + _sensorIndices.scrollState[sensors.scrollState]
      * _sensorDims[5] * _sensorDims[6]
      + _sensorIndices.timeOfDay[sensors.timeOfDay]
      * _sensorDims[6]
      + _sensorIndices.agePhase[sensors.agePhase];
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

    // Clamp raw input
    raw = Math.min(raw, 1);

    // Exponential smoothing
    stress += (raw - stress) * CFG.stressSmoothing;
    lili.stress = stress; // sync with lili object
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

  // --- Epsilon-greedy mood selection ---
  function brainDecideMood(stateIndex) {
    const eps = ageVal(CFG.rl.epsilon);
    const q = _getQ(stateIndex);
    let moodIdx;
    let exploratory = false;

    if (rlRng() < eps) {
      // Explore: random mood
      moodIdx = Math.floor(rlRng() * MOOD_COUNT);
      exploratory = true;
    } else {
      // Exploit: argmax Q
      moodIdx = 0;
      let maxQ = q[0];
      for (let i = 1; i < MOOD_COUNT; i++) {
        if (q[i] > maxQ) { maxQ = q[i]; moodIdx = i; }
      }
    }

    _decision.wasExploratory = exploratory;
    return moodIdx;
  }

  // --- Bellman update ---
  function brainLearn(prevState, moodIdx, reward, newState) {
    const alpha = CFG.rl.alpha;
    const gamma = CFG.rl.gamma;
    const qPrev = _getQ(prevState);
    const qNew = _getQ(newState);

    // max Q(s', m') for all moods
    let maxNext = qNew[0];
    for (let i = 1; i < MOOD_COUNT; i++) {
      if (qNew[i] > maxNext) maxNext = qNew[i];
    }

    // Q(s,m) ← Q(s,m) + α[R + γ·max(Q(s',m')) - Q(s,m)]
    qPrev[moodIdx] += alpha * (reward + gamma * maxNext - qPrev[moodIdx]);
  }

  // --- Reward computation (PRD-specified values) ---
  function computeReward() {
    let reward = 0;
    const mood = lili.mood;
    const R = CFG.rewards;
    const JC = CFG.journal;

    // +1.0: in whitespace, user reading (cursor still/slow), calm/idle mood
    if (sensors.whitespace === 'in_whitespace' &&
        (sensors.cursorVelocity === 'still' || sensors.cursorVelocity === 'slow') &&
        (mood === 'calm' || mood === 'idle')) {
      reward += R.whitespaceCalm;
    }

    // +0.8: successful flee (was near, now far, was shy/alert)
    if (_decision.prevCursorProximity === 'near' &&
        sensors.cursorProximity === 'far' &&
        (mood === 'shy' || mood === 'alert')) {
      reward += R.fleeSuccess;
    }

    // +0.5: near DOM, low stress, curious mood
    if (sensors.domDensity !== 'sparse' && stress < 0.3 && mood === 'curious') {
      reward += R.exploreLowStress;
    }

    // +0.3: tentacles touching DOM, user not stationary, playful
    if (mood === 'playful' && sensors.cursorVelocity !== 'still') {
      let touchCount = 0;
      for (let t = 0; t < TENT_N; t++) {
        if (tentacles[t].touching) touchCount++;
      }
      if (touchCount > 0) reward += R.playfulInteraction;
    }

    // +0.3: near document edge, user active in center
    if (mouse.active && sensors.cursorProximity === 'far') {
      const dL = lili.pos.x, dR = docW - lili.pos.x;
      const dT = lili.pos.y, dB = docH - lili.pos.y;
      if (Math.min(dL, dR, dT, dB) < CFG.boundaryMargin * 1.5) {
        reward += R.edgeRespect;
      }
    }

    // -2.0: over text/element, cursor still (blocking reading)
    if (sensors.whitespace === 'on_element' && sensors.cursorVelocity === 'still') {
      reward += R.blockingRead;
    }

    // -1.0: held element blocks reading (user cursor still, element displaced)
    if (sensors.cursorVelocity === 'still' && _domState.heldCount > 0) {
      reward += R.heldBlocksRead;
    }

    // -0.5: idle too long (modulated by age — elders less penalized)
    if (mood === 'idle' && _decision.moodRepeatCount > JC.idlePenaltyThreshold) {
      const ageMod = ageVal({ hatchling: 1.0, juvenile: 0.8, adult: 0.6, mature: 0.4, elder: 0.2 });
      reward += R.idleTooLong * ageMod;
    }

    // -0.3: shy/alert when cursor is slow and far (unnecessary fear)
    if ((mood === 'shy' || mood === 'alert') &&
        sensors.cursorProximity === 'far' &&
        (sensors.cursorVelocity === 'still' || sensors.cursorVelocity === 'slow')) {
      reward += R.unnecessaryFlee;
    }

    // -0.2: repeating same mood > threshold cycles
    if (_decision.moodRepeatCount > JC.moodRepeatThreshold) {
      reward += R.moodRepetition;
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

    return reward;
  }

  // --- Decision cycle orchestrator (called every frame, acts every N frames) ---
  function brainDecisionCycle() {
    _decision.frameCounter++;

    if (_decision.frameCounter < CFG.rl.decisionCycleFrames) return;
    _decision.frameCounter = 0;

    const currentState = sensors.stateIndex;

    // Compute reward for previous mood (outcome of last cycle)
    if (_decision.prevState >= 0) {
      const reward = computeReward();

      // Bellman update
      brainLearn(_decision.prevState, _decision.prevMoodIndex, reward, currentState);

      // Journal logging
      journalLogDecision(currentState, reward);

      _decision.totalReward += reward;
    }

    // Choose new mood
    const newMoodIdx = brainDecideMood(currentState);
    const newMood = CFG.moods[newMoodIdx];

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

    // Periodic Q-table + position + journal save
    if (frameCount - _decision.lastSaveFrame >= CFG.rl.saveIntervalFrames) {
      _decision.lastSaveFrame = frameCount;
      brainSave();
      savePosition();
      journalSaveRingBuffer();
      placeMemorySave();     // Phase 15A
      domLearningSave();     // Phase 15D
    }
  }

  // --- Q-table persistence ---
  function brainSerialize() {
    const entries = [];
    _qtable.forEach(function (q, key) {
      entries.push([key, Array.from(q)]);
    });
    return JSON.stringify({
      v: 1,
      mood: lili.moodIndex,
      decisions: _decision.totalDecisions,
      reward: _decision.totalReward,
      entries: entries,
    });
  }

  function brainDeserialize(json) {
    try {
      const data = JSON.parse(json);
      if (!data || !data.entries) return false;
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
    };

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

    const exportObj = {
      format: 'lili_export_v1',
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
      },
      qtable: [],
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

    el.innerHTML =
      '<b style="color:#8cf">Lili</b> ' +
      '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;' +
      'background:' + dotColor + ';vertical-align:middle"></span><br>' +
      '<span style="color:#667">Autonomous octopus living on this page.</span><br>' +
      '<span style="color:#6a8">' + age.phase + '</span> · ' + ageStr + ' · ' + lili.mood;

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
      '── Perf ────────────────\n' +
      'FPS:      ' + _fpsAvg.toFixed(1) + (_fpsAvg < 50 ? ' ⚠' : '') + '\n' +
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
          '  Place memory: ' + _placeMemory.grid.size + ' cells\n' +
          '  Cloud sync: ' + syncAge + (_sync.dirty ? ' (dirty)' : '')
        );
      },
      data: function () { return exportData(true); },
    });
    console.info('[Lili] Console API ready — try: lili.status(), lili.sync(), lili.export()');
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
          if (!data || data.format !== 'lili_export_v1') {
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
      format: 'lili_state_v1',
      lastSync: new Date().toISOString(),
      metadata: {
        genesis: age.genesisMs,
        visits: parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10),
        totalDecisions: _decision.totalDecisions,
        totalReward: _decision.totalReward,
        phase: age.phase,
        phaseProgress: age.phaseProgress,
        mood: lili.mood,
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
    };
  }

  // Merge remote state into local (remote wins for brain if it has more decisions)
  function _applySyncState(remote) {
    if (!remote || remote.format !== 'lili_state_v1') return false;

    var applied = false;

    // Genesis: keep the earliest
    if (remote.metadata && remote.metadata.genesis) {
      if (!age.genesisMs || remote.metadata.genesis < age.genesisMs) {
        age.genesisMs = remote.metadata.genesis;
        localStorage.setItem(CFG.storageKeys.genesis, String(age.genesisMs));
        updateAge();
      }
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
    const coherence = ageVal(CFG.movementCoherence);
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

    // Reset acceleration
    lili.acc.set(0, 0);

    // Wander
    if (weights.wander > 0) {
      steerWander(_steerWander);
      lili.acc.x += _steerWander.x * weights.wander;
      lili.acc.y += _steerWander.y * weights.wander;
    }

    // Flee (use evade for aggressive cursor — more sophisticated)
    if (weights.flee > 0 && mouse.active) {
      if (mouse.classification === 'aggressive' || mouse.classification === 'fast') {
        steerEvade(_steerFlee);
      } else {
        steerFlee(_steerFlee);
      }
      lili.acc.x += _steerFlee.x * weights.flee;
      lili.acc.y += _steerFlee.y * weights.flee;
    }

    // Seek whitespace
    if (weights.seekWhitespace > 0) {
      steerSeekWhitespace(_steerWS);
      lili.acc.x += _steerWS.x * weights.seekWhitespace;
      lili.acc.y += _steerWS.y * weights.seekWhitespace;
    }

    // Seek DOM (exploration)
    if (weights.seekDom > 0) {
      steerSeekDom(_steerDom);
      lili.acc.x += _steerDom.x * weights.seekDom;
      lili.acc.y += _steerDom.y * weights.seekDom;
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
      lili.acc.x += _steerFollow.x * weights.followSlow;
      lili.acc.y += _steerFollow.y * weights.followSlow;
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
    lili.bodyR = ageVal(CFG.bodyRadius);

    // Pulse-glide cycle advance — frequency is age-dependent (Research #1)
    // Hatchling: 5.0 Hz (rapid inefficient pulsing), Adult: 0.9 Hz (efficient)
    lili.pulsePhase += ageVal(CFG.pulseFrequency) * dt;
    if (lili.pulsePhase >= 1) lili.pulsePhase -= 1;

    // Apply steering
    computeSteering();

    // Integrate: velocity += acceleration
    lili.vel.addIn(lili.acc);
    lili.vel.limitIn(ageVal(CFG.maxSpeed) * _circadian.activityMul);

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
    const baseReach = arm.totalLen * (0.55 + 0.3 * waveVal) * _tentBlend.spreadMod;

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
  }

  // =========================================================================
  // 3C — Trailing physics (mass-spring-damper on tip target)
  // Research #3: Hooke's law + viscous damping, semi-implicit Euler
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

    const h = baseHue + circadianHue + stressHue + moodHue + driftHue;
    const s = Math.min(Math.max(baseSat + stressSat + moodSat + satPulse, 20), 100);
    const l = Math.min(Math.max(baseLit + circadianLit + moodLit, 15), 85);

    return {
      bodyHsl: `hsl(${h}, ${s}%, ${l}%)`,
      bodyHslAlpha: function(a) { return `hsla(${h}, ${s}%, ${l}%, ${a})`; },
      tentHsl: `hsl(${h + 5}, ${s - 5}%, ${l + 5}%)`,
      tentHslAlpha: function(a) { return `hsla(${h + 5}, ${s - 5}%, ${l + 5}%, ${a})`; },
      glowHsl: `hsla(${h - 10}, ${s + 10}%, ${l + 20}%, ${ageVal(CFG.glowIntensity) * _chromaBlend.glowMod * 0.15})`,
      eyeWhite: `hsl(${h}, 15%, 92%)`,
      pupilHsl: `hsl(${h + 30}, ${s + 20}%, ${Math.max(l - 25, 10)}%)`,
      h, s, l
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
    const baseW = ageVal(CFG.hullBaseWidth);
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

    // Second pass: translucent tip highlights for depth
    for (let t = 0; t < TENT_N; t++) {
      const arm = tentacles[t];
      const tipX = arm.x[JOINTS - 1];
      const tipY = arm.y[JOINTS - 1];
      const tipR = baseW * 0.4;

      if (arm.recoilTimer > 0) {
        // Recoil: reddish flash
        ctx.fillStyle = 'rgba(255, 120, 100, 0.5)';
      } else {
        ctx.fillStyle = colors.tentHslAlpha(tipAlpha);
      }
      ctx.beginPath();
      ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4B — Body rendering with noise deformation
  function renderBody(colors) {
    const x = lili.pos.x;
    const y = lili.pos.y;
    const r = lili.bodyR;
    const rx = r * CFG.bodyRadiusXScale;
    const ry = r * CFG.bodyRadiusYScale;

    // Breathing modulation (Research #1: 18 bpm sine, 3% amplitude)
    // Phase 13C: mood modulates breathing rate and depth
    const breathT = frameCount / 60;
    const breathFreq = (CFG.breathingBpm / 60) * _bodyBlend.breathMod;
    const breathAmp = CFG.breathingAmplitude * (0.7 + _bodyBlend.breathMod * 0.5);
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
    const moodScale = _bodyBlend.bodyScale;
    const finalRx = rx * breathMod * pulseMod * moodScale;
    const finalRy = ry * breathMod * pulseMod * moodScale;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lili.heading);

    // Glow (bioluminescence — age-dependent intensity, visible on dark bg)
    // Phase 13C: mood glow pulsation (curious/exploring pulse at ~0.5Hz)
    const glowR = r * 3.0;
    let glowIntensity = ageVal(CFG.glowIntensity) * _chromaBlend.glowMod;
    if (_bodyBlend.glowPulseHz > 0) {
      glowIntensity *= 1 + Math.sin(frameCount / 60 * _bodyBlend.glowPulseHz * Math.PI * 2) * 0.25;
    }
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
    const spacing = r * CFG.eyeSpacing;
    const yOff = r * CFG.eyeYOffset;

    // Compute eye positions in world space (rotated by heading)
    const cosH = Math.cos(lili.heading);
    const sinH = Math.sin(lili.heading);

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

    // Phase 13B: Blink eyelid factor (0=open, 1=closed)
    const blinkDur = CFG.blinkDurationFrames;
    let lidClose = 0;
    if (_blink.phase > 0) {
      const half = blinkDur * 0.5;
      const remaining = _blink.phase;
      // Ease in/out: close then open
      if (remaining > half) {
        lidClose = (blinkDur - remaining) / half; // closing
      } else {
        lidClose = remaining / half; // opening
      }
    }

    // Phase 13B: Squint from mood (playful = slight squint)
    // Phase 15B: Circadian eye closure (sleeping = eyes nearly closed)
    const squintAmount = _eyeBlend.squint + (1 - _circadian.eyeOpenness) * 0.9;

    function drawEye(ex, ey) {
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

      // Pupil gaze target: mouse by default, nearby DOM for curious/exploring
      let gazeX = mouse.pos.x;
      let gazeY = mouse.pos.y;
      if (_eyeBlend.gazeDOM) {
        // Look at nearest spatial hash element if close enough
        const nearby = getNearby(lili.pos.x, lili.pos.y);
        if (nearby.length > 0) {
          const el = nearby[0];
          gazeX = el.x + el.w * 0.5;
          gazeY = el.y + el.h * 0.5;
        }
      }

      let dx = gazeX - ex;
      let dy = gazeY - ey;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Idle: gaze drifts to center (looking "into the void")
      if (lili.mood === 'idle' && lili.moodBlend > 0.5) {
        const blend = Math.min((lili.moodBlend - 0.5) * 2, 1);
        dx *= (1 - blend * 0.7);
        dy *= (1 - blend * 0.7);
      }

      const off = Math.min(dist * 0.01, maxOff);
      const px = ex + (dx / dist) * off;
      const py = ey + (dy / dist) * off;

      // Pupil size: base stress dilation + Phase 13B mood modulation
      const pupilScale = (0.85 + stress * 0.35 + Math.min(lili.vel.mag() * 0.03, 0.2))
        * _eyeBlend.pupilScale;

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
    }

    drawEye(leftEyeX, leftEyeY);
    drawEye(rightEyeX, rightEyeY);
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
    lili.bodyR = ageVal(CFG.bodyRadius); // grow with age
    updateCircadian();                   // Phase 15B: day/night rhythm
    updateMouse();
    updateSensors();
    updateStress();
    brainDecisionCycle(); // Phase 8: RL mood selection before physics
    updateMoodBlend();   // Phase 13: smooth mood expression blending
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

      // 4E — Rendering pipeline (correct z-order)
      // 0. Ink cloud behind everything (Phase 15E)
      renderInk(colors);

      // 1. Tentacles behind body (hull envelope rendering)
      renderTentaclesHull(colors);

      // 2. Body (noise-deformed ellipse with glow)
      renderBody(colors);

      // 3. Eyes (on top of body) — circadian eye openness applied
      renderEyes(colors);

      // 4. Enhanced DOM: render grabbed text on canvas (Phase 15F)
      renderEnhancedDomText(colors);

      // 5. Bubble communication (Phase 16B) — floats above body
      renderBubbles();

      ctx.restore();
    }

    // 12C: FPS monitoring (always runs, even when offscreen)
    updateFps();
    checkFpsWarning();

    // Phase 10B: Debug panel update (DOM, not Canvas)
    updateDebugPanel();
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

    // Genesis timestamp (never overwrite — PRD rule)
    if (!localStorage.getItem(CFG.storageKeys.genesis)) {
      localStorage.setItem(CFG.storageKeys.genesis, String(Date.now()));
    }
    age.genesisMs = parseInt(localStorage.getItem(CFG.storageKeys.genesis), 10);

    // Register phase transition listeners
    onPhaseTransition(function (from, to, atMs) {
      const days = (atMs / 86400000).toFixed(1);
      console.info('[Lili] Phase transition: ' + from + ' → ' + to + ' at day ' + days);
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
    console.info('[Lili] Brain loaded: ' + _qtable.size + ' Q-states, ' +
      _decision.totalDecisions + ' lifetime decisions, mood=' + lili.mood);

    // Phase 9A: Word wrapping disabled — breaks React/framework hydration.
    // Lili interacts with existing DOM elements via spatial hash instead.
    // wrapWords();

    // Initialize document-space coordinate system
    scrollOx = window.scrollX || window.pageXOffset || 0;
    scrollOy = window.scrollY || window.pageYOffset || 0;
    updateDocDimensions();

    // Phase 11A: Restore position from localStorage (or center of current viewport in document coords)
    lili.bodyR = ageVal(CFG.bodyRadius);
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
      (bootMs > CFG.maxInitMs ? ' ⚠ exceeds target ' + CFG.maxInitMs + 'ms' : ''));

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
