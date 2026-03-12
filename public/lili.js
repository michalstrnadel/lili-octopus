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
    canvasZIndex: 9999,
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
    baseHue:        { hatchling: 200, elder: 240 },
    baseSaturation:  { hatchling: 60,  elder: 80 },
    baseLightness:   { hatchling: 62,  elder: 35 },
    glowIntensity:   { hatchling: 0.7, juvenile: 0.6, adult: 0.55, mature: 0.45, elder: 0.3 },

    // --- Eyes ---
    eyePupilMaxOffset: 0.3,
    eyeRadiusFactor: { hatchling: 0.32, juvenile: 0.28, adult: 0.22, mature: 0.20, elder: 0.18 },
    pupilRadiusFactor: 0.55,       // pupil radius relative to eye radius
    eyeSpacing: 0.35,             // eye horizontal spread relative to bodyR
    eyeYOffset: -0.25,            // eye vertical offset (negative = upward)

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

    // --- Reward values ---
    rewards: {
      inWhitespaceIdle:  +1.0,
      successfulFlee:    +0.8,
      domExploration:    +0.5,
      edgeRespect:       +0.3,
      blockingText:      -2.0,
      idleTooLong:       -0.5,
      fleeWhenSafe:      -0.3,
      actionRepetition:  -0.2,
      domCollision:      -1.0,
    },

    // --- Behavior weights per action ---
    behaviorWeights: {
      wander:         { wander: 1.0, seekWhitespace: 0.2, flee: 0,   obstacleAvoid: 0.8, boundary: 0.5, seekDom: 0,   followSlow: 0 },
      seek_whitespace: { wander: 0.1, seekWhitespace: 1.0, flee: 0,   obstacleAvoid: 0.8, boundary: 0.5, seekDom: 0,   followSlow: 0 },
      flee:           { wander: 0,   seekWhitespace: 0,   flee: 1.5, obstacleAvoid: 0.3, boundary: 0.8, seekDom: 0,   followSlow: 0 },
      explore_dom:    { wander: 0.2, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.5, boundary: 0.5, seekDom: 1.0, followSlow: 0 },
      idle:           { wander: 0,   seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0,   boundary: 0.3, seekDom: 0,   followSlow: 0 },
      seek_edge:      { wander: 0.1, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.6, boundary: 0,   seekDom: 0,   followSlow: 0 },
      follow_slow:    { wander: 0.1, seekWhitespace: 0,   flee: 0,   obstacleAvoid: 0.8, boundary: 0.5, seekDom: 0,   followSlow: 0.6 },
    },

    // --- Scroll ---
    scrollTimeoutMs: 200,

    // --- Click ---
    clickHitboxScale: 2.5,
    tooltipDurationMs: 3500,

    // --- localStorage keys ---
    storageKeys: {
      genesis:     'lili_genesis',
      qtable:      'lili_qtable',
      position:    'lili_position',
      lastCleanup: 'lili_last_cleanup',
      visits:      'lili_visits',
    },

    // --- Performance targets ---
    targetFps: 60,
    maxInitMs: 200,

    // --- Debug ---
    debugToggleKey: 'D',

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
  // 2A — Age / life phase system
  // =========================================================================

  const age = {
    genesisMs: 0,        // set at boot from localStorage
    elapsedMs: 0,        // updated every frame
    phase: 'hatchling',  // current life phase string
    t: 0,                // normalized age 0..1 over full lifespan
  };

  // Resolve age-dependent config value: { hatchling: x, ..., elder: y }
  function ageVal(map) {
    if (typeof map === 'number') return map;
    if (map[age.phase] !== undefined) return map[age.phase];
    // Lerp between hatchling and elder if only those two are defined
    if (map.hatchling !== undefined && map.elder !== undefined) {
      return map.hatchling + (map.elder - map.hatchling) * age.t;
    }
    return 0;
  }

  function updateAge() {
    age.elapsedMs = Date.now() - age.genesisMs;
    age.t = Math.min(age.elapsedMs / CFG.lifePhases.elder, 1);
    const ms = age.elapsedMs;
    if (ms < CFG.lifePhases.hatchling) age.phase = 'hatchling';
    else if (ms < CFG.lifePhases.juvenile) age.phase = 'juvenile';
    else if (ms < CFG.lifePhases.adult) age.phase = 'adult';
    else if (ms < CFG.lifePhases.mature) age.phase = 'mature';
    else age.phase = 'elder';
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
    currentAction: 'wander', // active RL action (Phase 2: fixed to wander)
    stress: 0,
  };

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
    mouse.pos.set(e.clientX, e.clientY);
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

      const ob = {
        el: el,
        x: r.left, y: r.top, w: r.width, h: r.height,
        cx: r.left + r.width * 0.5,
        cy: r.top + r.height * 0.5,
      };

      // Insert into all cells this rect overlaps
      const minCol = Math.floor(r.left / cell);
      const minRow = Math.floor(r.top / cell);
      const maxCol = Math.floor((r.left + r.width) / cell);
      const maxRow = Math.floor((r.top + r.height) / cell);

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

  // MutationObserver: rebuild hash when DOM changes
  let mutationRebuildTimer = 0;
  function onDomMutation() {
    clearTimeout(mutationRebuildTimer);
    mutationRebuildTimer = setTimeout(buildSpatialHash, CFG.spatialHashRebuildMs);
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
        const d = lili.pos.distSq(new Vec2(ob.cx, ob.cy));
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

  // --- Boundary (soft repulsion from viewport edges) ---
  function steerBoundary(out) {
    out.set(0, 0);
    const margin = CFG.boundaryMargin;
    const force = CFG.boundaryForce;
    const px = lili.pos.x, py = lili.pos.y;
    // Left
    if (px < margin) out.x += force * (1 - px / margin);
    // Right
    if (px > W - margin) out.x -= force * (1 - (W - px) / margin);
    // Top
    if (py < margin) out.y += force * (1 - py / margin);
    // Bottom
    if (py > H - margin) out.y -= force * (1 - (H - py) / margin);
    return out;
  }

  // =========================================================================
  // 2C — Behavior weight combiner
  // =========================================================================

  // Scratch vectors for steering combination (avoid allocation)
  const _steerWander = new Vec2();
  const _steerFlee   = new Vec2();
  const _steerObs    = new Vec2();
  const _steerBound  = new Vec2();

  function computeSteering() {
    const weights = CFG.behaviorWeights[lili.currentAction] || CFG.behaviorWeights.wander;

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

    // Truncate total steering force
    lili.acc.limitIn(ageVal(CFG.maxForce));
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
    lili.vel.limitIn(ageVal(CFG.maxSpeed));

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

    // Hard clamp to viewport (safety net)
    const r = lili.bodyR;
    if (lili.pos.x < r) lili.pos.x = r;
    if (lili.pos.x > W - r) lili.pos.x = W - r;
    if (lili.pos.y < r) lili.pos.y = r;
    if (lili.pos.y > H - r) lili.pos.y = H - r;
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

  function computeTentacleTarget(arm, time) {
    const idx = arm.index;
    const bodyX = lili.pos.x;
    const bodyY = lili.pos.y;
    const heading = lili.heading;
    const speed = lili.vel.mag();
    const maxSpd = ageVal(CFG.maxSpeed);
    const speedRatio = maxSpd > 0 ? Math.min(speed / maxSpd, 1) : 0;

    const amplitude = ageVal(CFG.tentacleSwimAmplitude);
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

    // Base reach — tentacles extend outward from body along their anchor direction
    // Modulated by swimming wave
    const waveVal = Math.sin(asyncTime + phaseShift);
    const baseReach = arm.totalLen * (0.55 + 0.3 * waveVal);

    // Lateral sway perpendicular to tentacle direction
    const swayVal = Math.cos(asyncTime * 0.7 + phaseShift);
    const perpAngle = worldAngle + Math.PI * 0.5;

    // Simplex noise injection (Research #3: break mechanical linearity)
    // Noise on amplitude and angle, not directly on coordinates
    const noiseAmp = noise.noise2D(t * 0.5 + idx * 10, 0) * CFG.tentacleNoiseScale;
    const noiseAngle = noise.noise2D(t * 0.5 + idx * 10, 1000) * 0.15;

    const reachAngle = worldAngle + noiseAngle;

    // Swimming: tentacles trail behind body when moving
    // Trailing bias proportional to speed (chapadla zaostávají za tělem)
    const trailBias = speedRatio * arm.totalLen * 0.4;
    const trailX = -Math.cos(heading) * trailBias;
    const trailY = -Math.sin(heading) * trailBias;

    arm.idealX = bodyX + Math.cos(reachAngle) * (baseReach + noiseAmp)
                + Math.cos(perpAngle) * swayVal * amplitude * 0.4
                + trailX;
    arm.idealY = bodyY + Math.sin(reachAngle) * (baseReach + noiseAmp)
                + Math.sin(perpAngle) * swayVal * amplitude * 0.4
                + trailY;

    // Idle relaxation: gentle gravity pull downward (Research #3)
    if (speedRatio < 0.15) {
      const idleFactor = 1 - speedRatio / 0.15;
      arm.idealY += CFG.tentacleRelaxGravity * arm.totalLen * 0.3 * idleFactor;
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
  // 4 — Visual System: chromatophores, hull rendering, body, eyes
  // =========================================================================

  // 4D — Chromatophore color computation (HSL)
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

    const h = baseHue + circadianHue + stressHue;
    const s = Math.min(baseSat + stressSat, 100);
    const l = baseLit + circadianLit;

    return {
      bodyHsl: `hsl(${h}, ${s}%, ${l}%)`,
      bodyHslAlpha: function(a) { return `hsla(${h}, ${s}%, ${l}%, ${a})`; },
      tentHsl: `hsl(${h + 5}, ${s - 5}%, ${l + 5}%)`,
      tentHslAlpha: function(a) { return `hsla(${h + 5}, ${s - 5}%, ${l + 5}%, ${a})`; },
      glowHsl: `hsla(${h - 10}, ${s + 10}%, ${l + 20}%, ${ageVal(CFG.glowIntensity) * 0.15})`,
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
  function drawHullSide(pts, n) {
    if (n < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    const tau = CFG.hullCatmullTension;
    for (let i = 0; i < n - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, n - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / tau;
      const cp1y = p1.y + (p2.y - p0.y) / tau;
      const cp2x = p2.x - (p3.x - p1.x) / tau;
      const cp2y = p2.y - (p3.y - p1.y) / tau;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
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
      const leftPts = [];
      const rightPts = [];

      for (let j = 0; j < JOINTS; j++) {
        const tang = polyTangent(arm.x, arm.y, j, JOINTS);
        // Linear tapering: full width at base, near-zero at tip
        const taper = 1 - (j / (JOINTS - 1));
        // Noise modulation for organic feel
        const nv = noise.noise2D(arm.x[j] * 0.02 + t60, arm.y[j] * 0.02 + t * 3.7);
        const w = baseW * taper * (1 + nv * noiseAmp);

        leftPts.push({ x: arm.x[j] + tang.nx * w, y: arm.y[j] + tang.ny * w });
        rightPts.push({ x: arm.x[j] - tang.nx * w, y: arm.y[j] - tang.ny * w });
      }

      // Draw hull: right side forward, arc at tip, left side backward
      drawHullSide(rightPts, JOINTS);

      // Rounded tip
      const tipIdx = JOINTS - 1;
      ctx.arc(arm.x[tipIdx], arm.y[tipIdx], baseW * 0.15, 0, Math.PI);

      // Left side backward
      drawHullSide(leftPts.reverse(), JOINTS);

      // Close back to base
      ctx.closePath();
    }

    // Single fill for all tentacles
    ctx.fillStyle = colors.tentHslAlpha(0.65);
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
    const breathT = frameCount / 60;
    const breathFreq = CFG.breathingBpm / 60;
    const breathMod = 1 + Math.sin(breathT * breathFreq * Math.PI * 2) * CFG.breathingAmplitude;

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

    const finalRx = rx * breathMod * pulseMod;
    const finalRy = ry * breathMod * pulseMod;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lili.heading);

    // Glow (bioluminescence — age-dependent intensity)
    const glowR = r * 2.5;
    const glowAlpha = ageVal(CFG.glowIntensity) * 0.12;
    const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, glowR);
    glow.addColorStop(0, colors.bodyHslAlpha(glowAlpha));
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

    // Body fill with subtle gradient
    const bodyGrad = ctx.createRadialGradient(0, -finalRy * 0.2, finalRx * 0.1, 0, 0, Math.max(finalRx, finalRy));
    bodyGrad.addColorStop(0, colors.bodyHslAlpha(0.85));
    bodyGrad.addColorStop(0.7, colors.bodyHslAlpha(0.75));
    bodyGrad.addColorStop(1, colors.bodyHslAlpha(0.55));
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.restore();
  }

  // 4C — Eyes (track cursor, reactive pupils)
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

    // Pupil offset: track mouse position
    const maxOff = eyeR * CFG.eyePupilMaxOffset;

    function drawEye(ex, ey) {
      // Sclera (white)
      ctx.fillStyle = colors.eyeWhite;
      ctx.beginPath();
      ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
      ctx.fill();

      // Pupil direction toward mouse
      let dx = mouse.pos.x - ex;
      let dy = mouse.pos.y - ey;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const off = Math.min(dist * 0.01, maxOff);
      const px = ex + (dx / dist) * off;
      const py = ey + (dy / dist) * off;

      // Pupil size: dilate when fleeing (speed-based), constrict when idle
      const speed = lili.vel.mag();
      const pupilScale = 0.8 + Math.min(speed * 0.05, 0.4);

      ctx.fillStyle = colors.pupilHsl;
      ctx.beginPath();
      ctx.arc(px, py, pupilR * pupilScale, 0, Math.PI * 2);
      ctx.fill();

      // Specular highlight (tiny white dot for life)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(ex - eyeR * 0.2, ey - eyeR * 0.25, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    drawEye(leftEyeX, leftEyeY);
    drawEye(rightEyeX, rightEyeY);
  }

  // =========================================================================
  // 1D — Canvas bootstrap & lifecycle
  // =========================================================================

  let canvas, ctx;
  let W = 0, H = 0;          // logical (CSS) dimensions
  let dpr = 1;                // device pixel ratio
  let paused = false;         // tab hidden
  let lastTime = 0;           // rAF timestamp
  let dt = 0;                 // delta time in seconds (capped)
  let frameCount = 0;

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
    updateAge();
    lili.bodyR = ageVal(CFG.bodyRadius); // grow with age
    updateMouse();
    updateSensors();
    updateStress();
    updatePhysics(frameDt);
    updateTentacles(frameDt);
    // Phase 8+ : RL decision, Phase 9+ : DOM interaction
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // 4E — Rendering pipeline (correct z-order)
    const colors = computeColors();

    // 1. Tentacles behind body (hull envelope rendering)
    renderTentaclesHull(colors);

    // 2. Body (noise-deformed ellipse with glow)
    renderBody(colors);

    // 3. Eyes (on top of body)
    renderEyes(colors);
  }

  // =========================================================================
  // Boot
  // =========================================================================

  function boot() {
    initCanvas();

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });

    // Genesis timestamp (never overwrite — PRD rule)
    if (!localStorage.getItem(CFG.storageKeys.genesis)) {
      localStorage.setItem(CFG.storageKeys.genesis, String(Date.now()));
    }
    age.genesisMs = parseInt(localStorage.getItem(CFG.storageKeys.genesis), 10);
    updateAge();

    // Increment visit counter
    const visits = parseInt(localStorage.getItem(CFG.storageKeys.visits) || '0', 10);
    localStorage.setItem(CFG.storageKeys.visits, String(visits + 1));

    // Initialize Lili's position (center of viewport or restored)
    lili.pos.set(W * 0.5, H * 0.5);
    lili.bodyR = ageVal(CFG.bodyRadius);

    // Initialize tentacles (8 FABRIK chains)
    initTentacles();

    // Build initial spatial hash grid (Phase 5)
    buildSpatialHash();

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
