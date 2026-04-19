/* Evrin (aka Lili B internally) — DQN agent, companion to Lili A Q-Learning
 * Name from Ray Nayler's "The Mountain in the Sea" (CZ: "Hora v moři") —
 * Evrim is the novel's sentient AI android; "evrim" is Turkish for "evolution".
 * Internal identifiers (window.LiliB, persist key, API functions) kept for
 * backward compatibility with saved weights and Lili A integration hooks.
 *
 * Phase 1: NN Foundation
 *   - Float32Array-only tiny NN engine
 *   - Dense layers, ReLU, He init, i-k-j cache-friendly matmul
 *   - Adam optimizer with global-norm gradient clipping
 *
 * Phase 2: DQN Core
 *   - Circular replay buffer (Float32Array, phantom/real priority flag)
 *   - Target network with hard sync
 *   - ε-greedy action selection
 *   - Bellman TD target + minibatch training
 *   - Grid-world convergence test
 *
 * Phase 4: Phantom stimuli generator
 *   - User-absence detection (30 s default)
 *   - Smooth phantom cursor trajectory (target lerp + jitter + jumps)
 *   - Priority=0 flag for replay buffer (real=1)
 *
 * Phase 5: Brain Interface + state assembly
 *   - INPUT_DIM=26, ACTION_DIM=7 (mood-equivalent to Lili A)
 *   - Pure reward function: novelty, approach-band, stagnation, edge, stress-delta
 *   - Separate novelty grids for A and B
 *   - Shadow reward logger for A (log-only, never feeds Q-table)
 *   - Brain Interface: chooseAction, observe, serialize, deserialize
 *
 * Phase 6: Render layer + kinematics + runtime glue
 *   - Mobile detection → inference-only path (no replay buffer, no training)
 *   - B kinematics: mood-modulated steering in document coords (7 moods)
 *   - Render: cool-palette body, 4 wavy tentacles, 3 chromatophore dots
 *   - Runtime: phantom + brain + kinematics + render stitched into onAfterRender hook
 *   - Decision cadence matches A (~45 frames); train every 4 real / 16 phantom decisions
 *
 * Phase 7: Persistence + auto-init
 *   - localStorage key `lili_b_weights`, schema `lili-b-persist-v1`
 *   - Periodic save (5 min) + beforeunload + visibilitychange hidden
 *   - Anchor rotation (current + 3 anchors, weekly) — structural stub for Phase 8 rollback
 *   - autoAttach(): DOMContentLoaded → poll for window.LiliA → wire runtime
 *
 * Phase 8: Stabilization suite (decade-scale resilience)
 *   - Anchor rollback on loss explosion (consumes anchors[0])
 *   - Adam lr schedule: 0.9× every 90 days, floor 1e-5
 *   - Periodic ε re-juvenilization (ε → 0.3 every 6 months)
 *   - Loss explosion detector: rolling EMA + 5σ instant rollback
 *   - Replay buffer flush on rollback (old policy experiences invalidated)
 *
 * Design brief: docs/IMPLEMENTATION_PLAN_LILI_B.md
 * Journal:      docs/journal/2026-04-19-lili-b-phase1-nn-foundation.md
 *               docs/journal/2026-04-19-lili-b-phase2-dqn-core.md
 *               docs/journal/2026-04-19-lili-b-phase3-4-exposition-phantom.md
 *               docs/journal/2026-04-19-lili-b-phase5-brain-interface.md
 *               docs/journal/2026-04-19-lili-b-phase6-7-render-runtime-persist.md
 *               docs/journal/2026-04-19-lili-b-phase8-stabilization.md
 *
 * Zero dependencies. IIFE. Strict mode. Pre-allocation only (no alloc in loops).
 */
(function () {
  'use strict';

  // ============================================================
  // CONFIG
  // ============================================================
  const CFG = {
    adam: { lr: 0.001, beta1: 0.9, beta2: 0.999, eps: 1e-8 },
    gradClipMaxNorm: 1.0,
    defaultSeed: 12345,
    dqn: {
      bufferCapacity: 50000,
      batchSize: 32,
      gamma: 0.95,
      targetUpdateSteps: 100,
      epsilonStart: 1.0,
      epsilonMin: 0.05,
      epsilonDecay: 0.995,
      priorityFraction: 0.5
    }
  };

  // ============================================================
  // RNG — mulberry32 (deterministic for reproducible tests)
  // ============================================================
  function makeRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Box-Muller gaussian from uniform rng
  function makeRandn(rng) {
    let spare = null;
    return function () {
      if (spare !== null) { const v = spare; spare = null; return v; }
      let u, v, s;
      do {
        u = rng() * 2 - 1;
        v = rng() * 2 - 1;
        s = u * u + v * v;
      } while (s === 0 || s >= 1);
      const mul = Math.sqrt(-2 * Math.log(s) / s);
      spare = v * mul;
      return u * mul;
    };
  }

  // ============================================================
  // VISUAL PRIMITIVES — ported from Lili A render pipeline.
  // Vec2 (minimal), Simplex noise, shared hull helpers. All are pure
  // except noise which owns a seeded permutation table.
  // ============================================================

  function vec2Mag(x, y) { return Math.sqrt(x * x + y * y); }

  const SimplexNoise = (function () {
    const GRAD2 = [
      [1, 1], [-1, 1], [1, -1], [-1, -1],
      [1, 0], [-1, 0], [0, 1], [0, -1]
    ];
    function create(rng) {
      const perm = new Uint8Array(512);
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      for (let i = 255; i > 0; i--) {
        const j = (rng() * (i + 1)) | 0;
        const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
      }
      for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
      const F2 = 0.5 * (Math.sqrt(3) - 1);
      const G2 = (3 - Math.sqrt(3)) / 6;
      function noise2D(xin, yin) {
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t, Y0 = j - t;
        const x0 = xin - X0, y0 = yin - Y0;
        let i1, j1;
        if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255;
        let n0 = 0, n1 = 0, n2 = 0;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) { t0 *= t0; const g = GRAD2[perm[ii + perm[jj]] & 7]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) { t1 *= t1; const g = GRAD2[perm[ii + i1 + perm[jj + j1]] & 7]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) { t2 *= t2; const g = GRAD2[perm[ii + 1 + perm[jj + 1]] & 7]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }
        return 70 * (n0 + n1 + n2);
      }
      return { noise2D: noise2D };
    }
    return { create: create };
  })();

  // ============================================================
  // VISUAL CONFIG — warm palette equivalent of Lili A's visual CFG.
  // Tuning mirrors A so behavior looks identical; only hue differs.
  // Age-dependent values are derived from bodyR at runtime (A uses
  // phased age tables; we approximate via body-radius ratios).
  // ============================================================
  const VCFG = {
    // FABRIK chain
    tentacleCount: 8,
    tentacleSegments: 8,
    tentacleAnchorSpacing: Math.PI / 4,
    fabrikIterations: 3,
    fabrikTolerance: 0.5,
    tentacleSegLenRatio: 0.62,       // segLen ≈ bodyR × ratio (A: 2/4 hatchling → 13/26 elder ≈ 0.5)
    tentacleSwimAmplitudeRatio: 0.9, // amp ≈ bodyR × ratio
    tentacleSwimSpeed: 0.9,
    tentacleAsyncFactor: 0.4,
    tentacleNoiseScale: 20,
    tentacleRecoilSpeed: 0.3,
    tentacleRecoilDistance: 40,
    tentacleRelaxGravity: 0.3,
    tentacleTrailing: { stiffness: 0.14, damping: 0.80 },
    segSpringStiff: 0.08,
    segSpringDamp: 0.85,
    segLateralDrag: 0.04,
    fabrikComfort: { maxBendAngle: Math.PI * 0.75, torsionCorrectionStrength: 0.3 },
    // Hull envelope
    hullBaseWidthRatio: 0.26,         // baseWidth ≈ bodyR × ratio (A: 6.5/26 ≈ 0.25)
    hullTipAlpha: 0.3,
    hullNoiseAmplitude: 0.15,
    hullCatmullTension: 6,
    // Body
    bodyRadiusXScale: 0.78,
    bodyRadiusYScale: 1.0,
    bodyNoisePoints: 24,
    bodyNoiseAmplitude: 0.06,
    bodyNoiseSpeed: 0.8,
    breathingBpm: 18,
    breathingAmplitude: 0.04,
    // Eyes
    eyeRadiusFactor: 0.28,
    pupilRadiusFactor: 0.50,
    eyeSpacing: 0.32,
    eyeYOffset: -0.22,
    eyePupilMaxOffset: 0.30,
    gazeLerp: 0.15,
    saccadeAmplitude: 2.5,
    saccadeIntervalMin: 60,
    saccadeIntervalMax: 180,
    blinkDurationFrames: 12,
    blinkIntervalBase: 180,
    blinkIntervalVar: 240,
    // Chromatophore cells
    chromatophoreCount: 6,
    chromatophoreMinRadius: 1.5,
    chromatophoreMaxRadius: 4.0,
    chromatophoreBaseAlpha: 0.22,
    chromatophorePulseMin: 0.008,
    chromatophorePulseMax: 0.025,
    chromatophoreHueVariance: 20,
    // Color — WARM palette (Lili A uses 175–220 cool teal; B uses 0–30 red-orange)
    baseHue: 12,
    baseSaturation: 55,
    baseLightness: 38,
    glowIntensity: 0.15,
    stressHueShift: -25,               // stress pulls hue toward deep red (345+)
    stressSaturationBoost: 15,
    nightGlowBoost: 1.3,
    eyeGlowAlpha: 0.25,
    // Genesis per-instance variation (±proportions)
    bodyXRange: 0.14,
    bodyYRange: 0.14,
    eyeSpacingRange: 0.20,
    eyeYRange: 0.20,
    tentacleWidthRange: 0.30,
    headTiltRange: 0.09,
    // Heading smoothing
    headingLerp: 0.10
  };

  // Mood → visual modulation lookup (instantaneous; no smoothing unlike A).
  // Index order mirrors A: 0 curious, 1 playful, 2 shy, 3 calm, 4 alert, 5 idle, 6 exploring.
  const MOOD_VIS = [
    { ampMod: 1.10, spreadMod: 1.05, gravMod: 0.80, noiseMod: 1.20, forwardBias: 0.30, bodyScale: 1.00, breathMod: 1.10, glowPulseHz: 0.5, pupilScale: 1.10, squint: 0.00, hueShift:  8, satShift:  5, litShift:  0 },
    { ampMod: 1.20, spreadMod: 1.15, gravMod: 0.30, noiseMod: 1.10, forwardBias: 0.15, bodyScale: 1.05, breathMod: 1.25, glowPulseHz: 0.0, pupilScale: 1.00, squint: 0.08, hueShift:  0, satShift: 12, litShift:  4 },
    { ampMod: 0.60, spreadMod: 0.70, gravMod: 1.10, noiseMod: 0.60, forwardBias: 0.00, bodyScale: 0.92, breathMod: 0.80, glowPulseHz: 0.0, pupilScale: 0.85, squint: 0.20, hueShift:  0, satShift:-15, litShift: 10 },
    { ampMod: 0.80, spreadMod: 0.90, gravMod: 1.20, noiseMod: 0.70, forwardBias: 0.00, bodyScale: 1.00, breathMod: 0.85, glowPulseHz: 0.0, pupilScale: 0.95, squint: 0.05, hueShift: -5, satShift: -5, litShift:  3 },
    { ampMod: 1.15, spreadMod: 1.00, gravMod: 0.60, noiseMod: 1.30, forwardBias: 0.20, bodyScale: 1.00, breathMod: 1.30, glowPulseHz: 0.8, pupilScale: 1.20, squint: 0.00, hueShift:-10, satShift: 15, litShift:  0 },
    { ampMod: 0.70, spreadMod: 0.95, gravMod: 1.30, noiseMod: 0.80, forwardBias: 0.00, bodyScale: 0.98, breathMod: 0.90, glowPulseHz: 0.0, pupilScale: 0.90, squint: 0.10, hueShift:  0, satShift:-10, litShift: -6 },
    { ampMod: 1.05, spreadMod: 1.10, gravMod: 0.70, noiseMod: 1.15, forwardBias: 0.25, bodyScale: 1.02, breathMod: 1.15, glowPulseHz: 0.4, pupilScale: 1.05, squint: 0.00, hueShift:  5, satShift:  8, litShift:  2 }
  ];

  // Phase patterns — G4 alternating (stable gait when moving) / radial (calm undulation).
  const PHASE_G4 = [0, Math.PI, 0, Math.PI, Math.PI, 0, Math.PI, 0];
  const PHASE_RADIAL = [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];

  // Catmull-Rom → cubic Bézier tangent & hull-side drawing helpers.
  function polyTangent(xs, ys, i, n) {
    let dx, dy;
    if (i === 0) { dx = xs[1] - xs[0]; dy = ys[1] - ys[0]; }
    else if (i === n - 1) { dx = xs[n - 1] - xs[n - 2]; dy = ys[n - 1] - ys[n - 2]; }
    else { dx = (xs[i + 1] - xs[i - 1]) * 0.5; dy = (ys[i + 1] - ys[i - 1]) * 0.5; }
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { tx: dx / len, ty: dy / len, nx: -dy / len, ny: dx / len };
  }

  function drawHullSide(ctx, pts, n, reverse, tension) {
    if (n < 2) return;
    const tau = tension;
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

  // ============================================================
  // PRIMITIVES — all operate on pre-allocated Float32Array buffers
  // ============================================================

  // y[rows] = W[rows,cols] * x[cols] + b[rows]
  // i-k-j order for matrix-vector: rows-first outer loop, cols-first inner.
  // W stored row-major → inner loop accesses contiguous memory.
  function matVecMul(W, x, b, y, rows, cols) {
    for (let i = 0; i < rows; i++) {
      let sum = b[i];
      const row = i * cols;
      for (let k = 0; k < cols; k++) {
        sum += W[row + k] * x[k];
      }
      y[i] = sum;
    }
  }

  function reluInPlace(a, n) {
    for (let i = 0; i < n; i++) {
      if (a[i] < 0) a[i] = 0;
    }
  }

  // He initialization: randn * sqrt(2 / fanIn). Recommended for ReLU.
  function heInit(W, rows, cols, randn) {
    const scale = Math.sqrt(2 / cols);
    const n = rows * cols;
    for (let i = 0; i < n; i++) W[i] = randn() * scale;
  }

  // ============================================================
  // NETWORK — input → hidden[] → output
  //
  // Flat param layout: [W0 | b0 | W1 | b1 | ... | W_L | b_L]
  // params, grads, adamM, adamV all share this layout.
  // Pre-allocates ALL buffers at creation time; forward/backward/step
  // perform zero allocations thereafter.
  // ============================================================
  function createNetwork(inputDim, hiddenDims, outputDim, seed) {
    const rng = makeRng(seed == null ? CFG.defaultSeed : seed);
    const randn = makeRandn(rng);

    const dims = [inputDim].concat(hiddenDims).concat([outputDim]);
    const numLayers = dims.length - 1;

    const layers = [];
    let paramCount = 0;
    for (let L = 0; L < numLayers; L++) {
      const inDim = dims[L];
      const outDim = dims[L + 1];
      layers.push({
        inDim: inDim,
        outDim: outDim,
        wOffset: paramCount,
        bOffset: paramCount + outDim * inDim,
        isOutput: L === numLayers - 1
      });
      paramCount += outDim * inDim + outDim;
    }

    const params = new Float32Array(paramCount);
    const grads  = new Float32Array(paramCount);
    const adamM  = new Float32Array(paramCount);
    const adamV  = new Float32Array(paramCount);

    // He-init each weight block; biases stay zero.
    for (let L = 0; L < numLayers; L++) {
      const lay = layers[L];
      const W = params.subarray(lay.wOffset, lay.wOffset + lay.outDim * lay.inDim);
      heInit(W, lay.outDim, lay.inDim, randn);
    }

    // acts[0]  = input buffer
    // acts[L]  = post-activation output of layer L-1 (L = 1..numLayers)
    // zs[L]    = pre-activation of layer L-1
    // dActs[L] = gradient w.r.t. acts[L]
    const acts  = [new Float32Array(inputDim)];
    const zs    = [null];
    const dActs = [new Float32Array(inputDim)];
    for (let L = 0; L < numLayers; L++) {
      acts.push(new Float32Array(dims[L + 1]));
      zs.push(new Float32Array(dims[L + 1]));
      dActs.push(new Float32Array(dims[L + 1]));
    }

    let adamStepCount = 0;
    // Multiplicative scalar on Adam learning rate. Phase 8 stabilizer
    // decays this over decade-scale runs (0.9× every 90 d, floor 1e-5/base_lr).
    let lrMultiplier = 1.0;

    function forward(input) {
      acts[0].set(input);
      for (let L = 0; L < numLayers; L++) {
        const lay = layers[L];
        const W = params.subarray(lay.wOffset, lay.wOffset + lay.outDim * lay.inDim);
        const b = params.subarray(lay.bOffset, lay.bOffset + lay.outDim);
        const z = zs[L + 1];
        const a = acts[L + 1];
        matVecMul(W, acts[L], b, z, lay.outDim, lay.inDim);
        a.set(z);
        if (!lay.isOutput) reluInPlace(a, lay.outDim);
      }
      return acts[numLayers];
    }

    function zeroGrads() {
      for (let i = 0; i < paramCount; i++) grads[i] = 0;
    }

    // dOutput = dLoss/dOutput, length = outputDim
    // If zeroFirst !== false (default), grads are cleared before accumulation.
    // Pass zeroFirst=false to accumulate gradients across a minibatch.
    function backward(dOutput, zeroFirst) {
      if (zeroFirst !== false) zeroGrads();
      dActs[numLayers].set(dOutput);

      for (let L = numLayers - 1; L >= 0; L--) {
        const lay = layers[L];
        const W  = params.subarray(lay.wOffset, lay.wOffset + lay.outDim * lay.inDim);
        const dW = grads.subarray(lay.wOffset, lay.wOffset + lay.outDim * lay.inDim);
        const db = grads.subarray(lay.bOffset, lay.bOffset + lay.outDim);
        const xPrev = acts[L];
        const z = zs[L + 1];
        const dA = dActs[L + 1];
        const dAPrev = dActs[L];

        // ReLU derivative for hidden layers: dZ = dA * (z > 0).
        // Output layer is linear: dZ = dA (no change).
        if (!lay.isOutput) {
          for (let i = 0; i < lay.outDim; i++) {
            if (z[i] <= 0) dA[i] = 0;
          }
        }

        // dW[i,k] += dZ[i] * xPrev[k]; db[i] += dZ[i]
        for (let i = 0; i < lay.outDim; i++) {
          const dZi = dA[i];
          db[i] += dZi;
          const row = i * lay.inDim;
          for (let k = 0; k < lay.inDim; k++) {
            dW[row + k] += dZi * xPrev[k];
          }
        }

        // dAPrev[k] = Σ_i W[i,k] * dZ[i]
        for (let k = 0; k < lay.inDim; k++) {
          let sum = 0;
          for (let i = 0; i < lay.outDim; i++) {
            sum += W[i * lay.inDim + k] * dA[i];
          }
          dAPrev[k] = sum;
        }
      }
    }

    // Global-norm gradient clipping. Returns pre-clip norm.
    function clipGradients(maxNorm) {
      let sumSq = 0;
      for (let i = 0; i < paramCount; i++) sumSq += grads[i] * grads[i];
      const norm = Math.sqrt(sumSq);
      if (norm > maxNorm && norm > 0) {
        const scale = maxNorm / norm;
        for (let i = 0; i < paramCount; i++) grads[i] *= scale;
      }
      return norm;
    }

    function adamStep() {
      adamStepCount++;
      const lr = CFG.adam.lr * lrMultiplier;
      const b1 = CFG.adam.beta1;
      const b2 = CFG.adam.beta2;
      const eps = CFG.adam.eps;
      const b1t = 1 - Math.pow(b1, adamStepCount);
      const b2t = 1 - Math.pow(b2, adamStepCount);
      for (let i = 0; i < paramCount; i++) {
        const g = grads[i];
        adamM[i] = b1 * adamM[i] + (1 - b1) * g;
        adamV[i] = b2 * adamV[i] + (1 - b2) * g * g;
        const mHat = adamM[i] / b1t;
        const vHat = adamV[i] / b2t;
        params[i] -= lr * mHat / (Math.sqrt(vHat) + eps);
      }
    }

    // Copy weights from another network with identical shape.
    // Used for DQN target-network hard sync.
    function copyParamsFrom(otherParams) {
      params.set(otherParams);
    }

    return {
      forward: forward,
      backward: backward,
      zeroGrads: zeroGrads,
      clipGradients: clipGradients,
      adamStep: adamStep,
      copyParamsFrom: copyParamsFrom,
      params: params,
      grads: grads,
      paramCount: paramCount,
      inputDim: inputDim,
      outputDim: outputDim,
      dims: dims,
      layers: layers,
      getAdamStep: function () { return adamStepCount; },
      setLrMultiplier: function (m) { lrMultiplier = m; },
      getLrMultiplier: function () { return lrMultiplier; }
    };
  }

  // ============================================================
  // REPLAY BUFFER — circular Float32Array
  //
  // Per-entry layout (contiguous):
  //   [state (stateDim) | action (1) | reward (1) |
  //    nextState (stateDim) | done (1) | priority (1)]
  //
  // priority flag: 1 = real user experience, 0 = phantom/simulated.
  // sampleBatch() pulls priorityFraction of samples from priority=1 when
  // available, filling the rest uniformly. This prevents sim-to-real gap.
  // ============================================================
  function createReplayBuffer(capacity, stateDim) {
    const entrySize = 2 * stateDim + 4;
    const buffer = new Float32Array(capacity * entrySize);
    let head = 0;
    let size = 0;
    let priorityCount = 0;

    // priorityIndex tracks positions of priority=1 entries for efficient sampling.
    const priorityIndex = new Int32Array(capacity);
    const inPriority = new Uint8Array(capacity);

    function push(state, action, reward, nextState, done, priority) {
      const off = head * entrySize;
      for (let i = 0; i < stateDim; i++) buffer[off + i] = state[i];
      buffer[off + stateDim] = action;
      buffer[off + stateDim + 1] = reward;
      for (let i = 0; i < stateDim; i++) buffer[off + stateDim + 2 + i] = nextState[i];
      buffer[off + 2 * stateDim + 2] = done ? 1 : 0;
      buffer[off + 2 * stateDim + 3] = priority ? 1 : 0;

      if (inPriority[head]) {
        for (let j = 0; j < priorityCount; j++) {
          if (priorityIndex[j] === head) {
            priorityIndex[j] = priorityIndex[priorityCount - 1];
            priorityCount--;
            break;
          }
        }
        inPriority[head] = 0;
      }
      if (priority) {
        priorityIndex[priorityCount++] = head;
        inPriority[head] = 1;
      }

      head = (head + 1) % capacity;
      if (size < capacity) size++;
    }

    // rng: () -> [0,1) uniform
    // outStates, outNextStates: Float32Array(batchSize * stateDim)
    // outActions: Int32Array(batchSize)
    // outRewards, outDones: Float32Array(batchSize)
    function sampleBatch(batchSize, priorityFraction, rng,
                         outStates, outActions, outRewards, outNextStates, outDones) {
      const targetPriority = Math.min(
        Math.floor(batchSize * priorityFraction),
        priorityCount
      );

      for (let b = 0; b < batchSize; b++) {
        let idx;
        if (b < targetPriority) {
          idx = priorityIndex[(rng() * priorityCount) | 0];
        } else {
          idx = (rng() * size) | 0;
        }
        const off = idx * entrySize;
        const so = b * stateDim;
        for (let i = 0; i < stateDim; i++) outStates[so + i] = buffer[off + i];
        outActions[b] = buffer[off + stateDim] | 0;
        outRewards[b] = buffer[off + stateDim + 1];
        for (let i = 0; i < stateDim; i++) outNextStates[so + i] = buffer[off + stateDim + 2 + i];
        outDones[b] = buffer[off + 2 * stateDim + 2];
      }
    }

    // Wipe buffer contents without reallocating storage. Used on rollback
    // where old-policy experiences are no longer representative of the
    // policy's post-rollback distribution.
    function flush() {
      head = 0;
      size = 0;
      priorityCount = 0;
      for (let i = 0; i < capacity; i++) inPriority[i] = 0;
    }

    return {
      push: push,
      sampleBatch: sampleBatch,
      flush: flush,
      getSize: function () { return size; },
      getPriorityCount: function () { return priorityCount; },
      capacity: capacity,
      stateDim: stateDim,
      entrySize: entrySize
    };
  }

  // ============================================================
  // DQN — online network + frozen target network + replay buffer
  //
  // TD target: y = r + γ · (1 − done) · max_a' Q_target(s', a')
  // Loss: 0.5 · (Q_online(s, a) − y)²
  //
  // Per call to trainStep():
  //   1. Sample batch (with priority fraction) into pre-allocated buffers
  //   2. Forward target on all next-states, take max per row
  //   3. Forward online on states, compute TD error at chosen action
  //   4. Accumulate gradients across batch (dOut scaled by 1/batchSize)
  //   5. Global-norm clip, Adam step
  //   6. Every targetUpdateSteps: hard-copy online → target
  //
  // All allocations happen in createDQN(); trainStep/chooseAction/observe
  // perform zero allocations.
  // ============================================================
  function createDQN(opts) {
    opts = opts || {};
    const stateDim = opts.stateDim;
    const actionDim = opts.actionDim;
    const hiddenDims = opts.hiddenDims || [64, 32];
    const bufferCapacity = opts.bufferCapacity != null ? opts.bufferCapacity : CFG.dqn.bufferCapacity;
    const batchSize = opts.batchSize != null ? opts.batchSize : CFG.dqn.batchSize;
    const gamma = opts.gamma != null ? opts.gamma : CFG.dqn.gamma;
    const targetUpdateSteps = opts.targetUpdateSteps != null ? opts.targetUpdateSteps : CFG.dqn.targetUpdateSteps;
    const epsilonStart = opts.epsilonStart != null ? opts.epsilonStart : CFG.dqn.epsilonStart;
    const epsilonMin = opts.epsilonMin != null ? opts.epsilonMin : CFG.dqn.epsilonMin;
    const epsilonDecay = opts.epsilonDecay != null ? opts.epsilonDecay : CFG.dqn.epsilonDecay;
    const priorityFraction = opts.priorityFraction != null ? opts.priorityFraction : CFG.dqn.priorityFraction;
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed;

    const online = createNetwork(stateDim, hiddenDims, actionDim, seed);
    const target = createNetwork(stateDim, hiddenDims, actionDim, seed + 1);
    target.copyParamsFrom(online.params);

    const buffer = createReplayBuffer(bufferCapacity, stateDim);

    // Pre-allocated batch buffers. Never resized, never reallocated.
    const batchStates     = new Float32Array(batchSize * stateDim);
    const batchNextStates = new Float32Array(batchSize * stateDim);
    const batchActions    = new Int32Array(batchSize);
    const batchRewards    = new Float32Array(batchSize);
    const batchDones      = new Float32Array(batchSize);
    const tdTargets       = new Float32Array(batchSize);
    const scratchState    = new Float32Array(stateDim);
    const dOut            = new Float32Array(actionDim);

    const rng = makeRng(seed + 100);
    let epsilon = epsilonStart;
    let trainStepCount = 0;
    let targetSyncCount = 0;

    function chooseAction(state, greedy) {
      if (!greedy && rng() < epsilon) {
        return (rng() * actionDim) | 0;
      }
      const q = online.forward(state);
      let best = 0;
      let bestQ = q[0];
      for (let i = 1; i < actionDim; i++) {
        if (q[i] > bestQ) { bestQ = q[i]; best = i; }
      }
      return best;
    }

    function observe(state, action, reward, nextState, done, priority) {
      buffer.push(state, action, reward, nextState, done, priority == null ? 1 : priority);
    }

    function trainStep() {
      if (buffer.getSize() < batchSize) return null;

      buffer.sampleBatch(
        batchSize, priorityFraction, rng,
        batchStates, batchActions, batchRewards, batchNextStates, batchDones
      );

      // TD targets from frozen target network
      for (let b = 0; b < batchSize; b++) {
        const so = b * stateDim;
        for (let i = 0; i < stateDim; i++) scratchState[i] = batchNextStates[so + i];
        const qNext = target.forward(scratchState);
        let maxQ = qNext[0];
        for (let i = 1; i < actionDim; i++) if (qNext[i] > maxQ) maxQ = qNext[i];
        tdTargets[b] = batchRewards[b] + gamma * (1 - batchDones[b]) * maxQ;
      }

      // Accumulate gradients over the minibatch
      let totalLoss = 0;
      const invBatch = 1 / batchSize;
      for (let b = 0; b < batchSize; b++) {
        const so = b * stateDim;
        for (let i = 0; i < stateDim; i++) scratchState[i] = batchStates[so + i];
        const q = online.forward(scratchState);
        const a = batchActions[b];
        const tdError = q[a] - tdTargets[b];
        totalLoss += 0.5 * tdError * tdError;

        for (let i = 0; i < actionDim; i++) dOut[i] = 0;
        dOut[a] = tdError * invBatch;

        online.backward(dOut, b === 0);
      }

      const gradNorm = online.clipGradients(CFG.gradClipMaxNorm);
      online.adamStep();

      trainStepCount++;
      if (trainStepCount % targetUpdateSteps === 0) {
        target.copyParamsFrom(online.params);
        targetSyncCount++;
      }

      return { loss: totalLoss * invBatch, gradNorm: gradNorm };
    }

    function decayEpsilon() {
      epsilon = Math.max(epsilonMin, epsilon * epsilonDecay);
      return epsilon;
    }

    function setEpsilon(v) { epsilon = v; }

    // Apply a new Adam learning-rate multiplier to both online and target
    // nets. Target is frozen anyway; keeping multipliers in sync is purely
    // defensive for any future code path that calls target.adamStep().
    function setLrMultiplier(m) {
      online.setLrMultiplier(m);
      target.setLrMultiplier(m);
    }

    function flushBuffer() { buffer.flush(); }

    return {
      chooseAction: chooseAction,
      observe: observe,
      trainStep: trainStep,
      decayEpsilon: decayEpsilon,
      setEpsilon: setEpsilon,
      setLrMultiplier: setLrMultiplier,
      flushBuffer: flushBuffer,
      getEpsilon: function () { return epsilon; },
      getLrMultiplier: function () { return online.getLrMultiplier(); },
      getTrainSteps: function () { return trainStepCount; },
      getTargetSyncs: function () { return targetSyncCount; },
      getBufferSize: function () { return buffer.getSize(); },
      online: online,
      target: target,
      buffer: buffer,
      stateDim: stateDim,
      actionDim: actionDim
    };
  }

  // ============================================================
  // PHANTOM STIMULI GENERATOR
  //
  // When the real user is absent for > absenceMs, switch to phantom mode:
  // generate a plausible cursor trajectory (smooth lerp toward a target
  // point resampled every 2–5 s, mixing random viewport points, points near
  // Lili A/B, and edge regions; occasional "jumps"). Phantom samples carry
  // priority=0 in the replay buffer so Lili B's policy is biased toward
  // learning from real-user experience (see brief sec. 6).
  //
  // Lili A itself never sees the phantom cursor — B just substitutes it in
  // its own state assembly when deriving cursor-related features.
  // ============================================================
  function createPhantomGenerator(opts) {
    opts = opts || {};
    const absenceMs = opts.absenceMs != null ? opts.absenceMs : 30000;
    const targetMinMs = opts.targetMinMs != null ? opts.targetMinMs : 2000;
    const targetMaxMs = opts.targetMaxMs != null ? opts.targetMaxMs : 5000;
    const lerpRate = opts.lerpRate != null ? opts.lerpRate : 2.5;
    const jitterPxPerSec = opts.jitterPxPerSec != null ? opts.jitterPxPerSec : 12;
    const jumpProbPerSec = opts.jumpProbPerSec != null ? opts.jumpProbPerSec : 0.05;
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed;
    const nowFn = opts.nowFn || (function () {
      return (typeof performance !== 'undefined' && performance.now)
        ? function () { return performance.now(); }
        : function () { return Date.now(); };
    })();

    const rng = makeRng(seed);

    let lastRealMs = -Infinity;
    let phantom = false;
    let cx = 0, cy = 0;
    let tx = 0, ty = 0;
    let nextTargetAt = 0;
    let W = 1024, H = 768;
    let initialized = false;

    function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

    function chooseTarget(liliA, liliB) {
      const r = rng();
      let x, y;
      if (r < 0.4) {
        x = rng() * W;
        y = rng() * H;
      } else if (r < 0.7 && liliA) {
        const rad = 80;
        x = liliA.x + (rng() * 2 - 1) * rad;
        y = liliA.y + (rng() * 2 - 1) * rad;
      } else if (r < 0.9 && liliB) {
        const rad = 80;
        x = liliB.x + (rng() * 2 - 1) * rad;
        y = liliB.y + (rng() * 2 - 1) * rad;
      } else {
        const edge = (rng() * 4) | 0;
        if      (edge === 0) { x = rng() * W;             y = rng() * 40; }
        else if (edge === 1) { x = W - rng() * 40;        y = rng() * H; }
        else if (edge === 2) { x = rng() * W;             y = H - rng() * 40; }
        else                  { x = rng() * 40;            y = rng() * H; }
      }
      return { x: clamp(x, 0, W), y: clamp(y, 0, H) };
    }

    // ctx: optional { W, H, liliA: {x,y}, liliB: {x,y}, now: number }
    function update(dt, ctx) {
      ctx = ctx || {};
      if (ctx.W) W = ctx.W;
      if (ctx.H) H = ctx.H;
      const now = ctx.now != null ? ctx.now : nowFn();

      if (!initialized) {
        cx = W * 0.5; cy = H * 0.5;
        tx = cx; ty = cy;
        initialized = true;
      }

      const absent = (now - lastRealMs) > absenceMs;
      if (absent && !phantom) {
        phantom = true;
        nextTargetAt = now;
      }

      if (!phantom) return;

      if (now >= nextTargetAt) {
        const pick = chooseTarget(ctx.liliA, ctx.liliB);
        tx = pick.x; ty = pick.y;
        nextTargetAt = now + targetMinMs + rng() * (targetMaxMs - targetMinMs);
      }

      if (rng() < jumpProbPerSec * dt) {
        const pick = chooseTarget(ctx.liliA, ctx.liliB);
        cx = pick.x; cy = pick.y;
        tx = pick.x; ty = pick.y;
        nextTargetAt = now + targetMinMs + rng() * (targetMaxMs - targetMinMs);
      }

      const a = 1 - Math.exp(-lerpRate * dt);
      cx += (tx - cx) * a;
      cy += (ty - cy) * a;

      cx += (rng() * 2 - 1) * jitterPxPerSec * dt;
      cy += (rng() * 2 - 1) * jitterPxPerSec * dt;

      cx = clamp(cx, 0, W);
      cy = clamp(cy, 0, H);
    }

    function notifyRealMouse(x, y, t) {
      const now = t != null ? t : nowFn();
      lastRealMs = now;
      if (phantom) phantom = false;
      cx = x; cy = y;
      tx = x; ty = y;
      initialized = true;
    }

    function getCursor() {
      return {
        x: cx, y: cy,
        isPhantom: phantom,
        priority: phantom ? 0 : 1
      };
    }

    function reset() {
      lastRealMs = -Infinity;
      phantom = false;
      initialized = false;
      cx = 0; cy = 0; tx = 0; ty = 0;
    }

    return {
      update: update,
      notifyRealMouse: notifyRealMouse,
      getCursor: getCursor,
      isPhantomMode: function () { return phantom; },
      reset: reset
    };
  }

  // ============================================================
  // BRAIN INTERFACE — Lili B DQN wrapper, compatible with Lili A pattern
  //
  // State vector (INPUT_DIM = 26):
  //   A observables (16):  xn, yn, vxNorm, vyNorm, stress,
  //                        phaseProgress, phaseIdxNorm, moodOneHot[7]
  //   Cursor (4):          cxn, cyn, cSpeedNorm, isPhantomFlag
  //   B own (5):           bxn, byn, bvxNorm, bvyNorm, bstress
  //   Relative (3):        (bxn-axn), (byn-ayn), distanceAB
  //
  // Action space (ACTION_DIM = 7): mood index, mirroring Lili A
  //   0=curious, 1=playful, 2=shy, 3=calm, 4=alert, 5=idle, 6=exploring
  //
  // Reward (pure function, identical for B and A's shadow log):
  //   novelty / (1 + visitsBefore·0.1)
  //   + approach band (peak at d≈0.12, overlap penalty, far decay)
  //   - stagnation penalty when speed < threshold
  //   - edge penalty within 5% of border
  //   + stress_delta·0.1 (reward shrinking stress)
  // ============================================================
  const BRAIN = {
    INPUT_DIM: 26,
    ACTION_DIM: 7,
    HIDDEN_DIMS: [64, 32],
    MAX_SPEED_NORM: 300,
    NOVELTY_CELLS: 32
  };

  function _clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function _clampSym(v) { return v < -1 ? -1 : (v > 1 ? 1 : v); }

  // Novelty grid: counts visits per normalized (xn, yn) cell.
  // Separate instances for A and B — no cross-contamination.
  function createNoveltyGrid(cellsX, cellsY) {
    cellsX = cellsX || BRAIN.NOVELTY_CELLS;
    cellsY = cellsY || BRAIN.NOVELTY_CELLS;
    const visits = new Uint32Array(cellsX * cellsY);
    let totalVisits = 0;
    let uniqueCells = 0;

    function idx(xn, yn) {
      let cx = (xn * cellsX) | 0;
      let cy = (yn * cellsY) | 0;
      if (cx < 0) cx = 0; else if (cx >= cellsX) cx = cellsX - 1;
      if (cy < 0) cy = 0; else if (cy >= cellsY) cy = cellsY - 1;
      return cy * cellsX + cx;
    }
    function observe(xn, yn) {
      const i = idx(xn, yn);
      const before = visits[i];
      if (before === 0) uniqueCells++;
      visits[i] = before + 1;
      totalVisits++;
      return before;
    }
    function getCount(xn, yn) { return visits[idx(xn, yn)]; }
    function serialize() {
      return { cellsX: cellsX, cellsY: cellsY, visits: Array.from(visits) };
    }
    function deserialize(obj) {
      if (!obj || !obj.visits) return false;
      if (obj.cellsX !== cellsX || obj.cellsY !== cellsY) return false;
      totalVisits = 0; uniqueCells = 0;
      for (let i = 0; i < visits.length; i++) {
        const v = obj.visits[i] | 0;
        visits[i] = v;
        totalVisits += v;
        if (v > 0) uniqueCells++;
      }
      return true;
    }
    return {
      observe: observe,
      getCount: getCount,
      stats: function () { return { total: totalVisits, unique: uniqueCells, capacity: cellsX * cellsY }; },
      serialize: serialize,
      deserialize: deserialize
    };
  }

  // Pure reward function. No side effects, no state reads beyond arguments.
  //   prev:  { xn, yn, speed, stress } — previous step for this agent
  //   curr:  { xn, yn, speed, stress } — current step
  //   other: { xn, yn, present } or null — other agent's current position
  //   cursor:{ xn, yn, active } or null — human attention focus (real or phantom)
  //   visitsBefore: int — pre-increment visit count for curr cell
  //   bodyRadiusN:  normalized body radius (for overlap detection)
  //
  // Reward hierarchy (animal-kingdom grounded): social + attention > exploration.
  //   approach (companion):     up to +0.6 — strongest positive signal (pair bond)
  //   attention (cursor focus): up to +0.5 — second strongest (engagement burst)
  //   novelty   (exploration):  up to +0.3 — tertiary drive
  //   stress relief, stagnation/edge penalties: small modulators
  //
  // Note: "attention" was earlier called "food" — renamed for honest semantics.
  // Cursor isn't food, it's the human-attention focal point that Evrin orients to.
  //
  // Returns { total, components }.
  function computeReward(prev, curr, other, cursor, visitsBefore, bodyRadiusN) {
    // Novelty demoted from 0.5 → 0.3 so exploration doesn't dominate social drive.
    const novelty = 0.3 / (1 + visitsBefore * 0.1);

    // Companion approach — strongest positive motivator (like pair-bonding,
    // conspecific herding). Peaks at ideal distance, penalty on overlap, falloff far.
    let approach = 0;
    if (other && other.present) {
      const dx = curr.xn - other.xn;
      const dy = curr.yn - other.yn;
      const d = Math.sqrt(dx * dx + dy * dy);
      const ideal = 0.12;
      const minD = Math.max(0.001, bodyRadiusN * 2);
      if (d < minD) {
        approach = -0.3;
      } else if (d < ideal) {
        approach = 0.6 * (d - minD) / (ideal - minD);
      } else {
        approach = 0.6 * Math.exp(-(d - ideal) * 6);
      }
    }

    // Attention — cursor represents the human's focal point. Phantom cursor
    // (during user-absent periods) also produces signal so Evrin keeps training
    // through idle hours. Peaks at close range, decays fast.
    let attention = 0;
    if (cursor && cursor.active) {
      const dx = curr.xn - cursor.xn;
      const dy = curr.yn - cursor.yn;
      const d = Math.sqrt(dx * dx + dy * dy);
      const range = 0.08;
      if (d < range) {
        attention = 0.5 * (1 - d / range);
      }
    }

    const stagSpeedThresh = 0.002;
    const stagnation = (curr.speed != null && curr.speed < stagSpeedThresh) ? -0.05 : 0;

    const edgeMargin = 0.05;
    const edgeDist = Math.min(curr.xn, 1 - curr.xn, curr.yn, 1 - curr.yn);
    const edge = edgeDist < edgeMargin ? -0.05 * (1 - edgeDist / edgeMargin) : 0;

    const stressPrev = (prev && prev.stress != null) ? prev.stress : (curr.stress || 0);
    const stress = (stressPrev - (curr.stress || 0)) * 0.1;

    return {
      total: novelty + approach + attention + stagnation + edge + stress,
      components: {
        novelty: novelty, approach: approach, attention: attention,
        stagnation: stagnation, edge: edge, stress: stress
      }
    };
  }

  // Shadow reward logger — persists A's shadow reward trajectory in
  // localStorage under a dedicated key. Strictly log-only: A's Q-table
  // never consumes this value. Flushes every N steps to avoid per-frame
  // localStorage writes.
  function createShadowLogger(storageKey, flushEveryN) {
    flushEveryN = flushEveryN || 200;
    storageKey = storageKey || 'lili_a_shadow_reward_log';
    const maxRecent = 100;
    const recent = new Array(maxRecent);
    for (let i = 0; i < maxRecent; i++) recent[i] = null;
    let recentHead = 0;
    let cumulative = 0;
    let steps = 0;
    let lastFlush = 0;

    const hasLS = (function () {
      try { return typeof localStorage !== 'undefined' && localStorage !== null; }
      catch (_e) { return false; }
    })();

    function nowT() {
      return (typeof performance !== 'undefined' && performance.now)
        ? performance.now() : Date.now();
    }

    if (hasLS) {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.schema === 'v1') {
            cumulative = parsed.cumulative || 0;
            steps = parsed.steps || 0;
          }
        }
      } catch (_err) { /* corrupt / privacy → start fresh */ }
    }

    function log(reward, components) {
      cumulative += reward;
      steps++;
      recent[recentHead] = {
        t: nowT() | 0,
        r: +reward.toFixed(4),
        c: components
      };
      recentHead = (recentHead + 1) % maxRecent;
      if (steps - lastFlush >= flushEveryN) flush();
    }

    function flush() {
      if (!hasLS) { lastFlush = steps; return false; }
      try {
        const samples = [];
        for (let i = 0; i < maxRecent; i++) {
          const s = recent[(recentHead + i) % maxRecent];
          if (s) samples.push(s);
        }
        localStorage.setItem(storageKey, JSON.stringify({
          schema: 'v1',
          cumulative: cumulative,
          steps: steps,
          avgReward: steps > 0 ? cumulative / steps : 0,
          recentSamples: samples,
          flushedAt: Date.now()
        }));
        lastFlush = steps;
        return true;
      } catch (_err) { return false; }
    }

    function reset() {
      cumulative = 0; steps = 0; lastFlush = 0;
      for (let i = 0; i < maxRecent; i++) recent[i] = null;
      recentHead = 0;
      if (hasLS) { try { localStorage.removeItem(storageKey); } catch (_e) {} }
    }

    return {
      log: log,
      flush: flush,
      reset: reset,
      getStats: function () {
        return {
          cumulative: cumulative,
          steps: steps,
          avgReward: steps > 0 ? cumulative / steps : 0
        };
      },
      storageKey: storageKey
    };
  }

  // State assembly: fills outBuf (Float32Array of length INPUT_DIM).
  //   aState:  window.LiliA.getState() shape
  //   aWorld:  window.LiliA.getWorld() shape (currently unused in vector
  //            but kept in signature so we can drop in world-scale features
  //            later without signature churn)
  //   cursor:  { xn, yn, speed, isPhantom } — speed in px/s, xn/yn in 0..1
  //   bState:  { xn, yn, vxNorm, vyNorm, stress } — B's own kinematic state
  function assembleState(outBuf, aState, aWorld, cursor, bState) {
    let i = 0;
    outBuf[i++] = _clamp01(aState.xn);
    outBuf[i++] = _clamp01(aState.yn);
    outBuf[i++] = _clampSym((aState.vx || 0) / BRAIN.MAX_SPEED_NORM);
    outBuf[i++] = _clampSym((aState.vy || 0) / BRAIN.MAX_SPEED_NORM);
    outBuf[i++] = _clamp01(aState.stress || 0);
    outBuf[i++] = _clamp01(aState.phaseProgress || 0);
    outBuf[i++] = _clamp01((aState.phaseIndex || 0) / 4);
    const mIdx = (aState.moodIndex | 0);
    for (let m = 0; m < 7; m++) outBuf[i++] = (m === mIdx) ? 1 : 0;

    outBuf[i++] = _clamp01(cursor.xn);
    outBuf[i++] = _clamp01(cursor.yn);
    outBuf[i++] = _clamp01((cursor.speed || 0) / BRAIN.MAX_SPEED_NORM);
    outBuf[i++] = cursor.isPhantom ? 1 : 0;

    outBuf[i++] = _clamp01(bState.xn);
    outBuf[i++] = _clamp01(bState.yn);
    outBuf[i++] = _clampSym(bState.vxNorm || 0);
    outBuf[i++] = _clampSym(bState.vyNorm || 0);
    outBuf[i++] = _clamp01(bState.stress || 0);

    const dx = bState.xn - aState.xn;
    const dy = bState.yn - aState.yn;
    outBuf[i++] = _clampSym(dx);
    outBuf[i++] = _clampSym(dy);
    outBuf[i++] = _clamp01(Math.sqrt(dx * dx + dy * dy));
  }

  // ============================================================
  // STABILIZER (Phase 8) — decade-scale training hygiene.
  //
  // Tracks a rolling EMA of training loss with EMA of squared deviations
  // (Welford-style online variance, exponentially weighted). A sample
  // whose sigma exceeds `explosionSigma` signals runaway divergence and
  // instructs the runtime to roll back to the last anchor. The
  // stabilizer does NOT restore weights itself — it just classifies
  // events and tracks wall-clock schedules.
  //
  // Wall-clock schedules:
  //   - Adam lr decay: multiplier × lrDecayFactor every lrDecayIntervalMs,
  //     clamped so effective lr ≥ lrFloor.
  //   - ε re-juvenilization: every rejuvIntervalMs the runtime can bump
  //     DQN ε back up to rejuvEpsilon, simulating renewed curiosity.
  //
  // Persisted under brain.serialize().stabilizer — schema v1.
  // ============================================================
  function createStabilizer(opts) {
    opts = opts || {};
    const explosionSigma = opts.explosionSigma != null ? opts.explosionSigma : 5.0;
    const driftSigma = opts.driftSigma != null ? opts.driftSigma : 3.0;
    const minSamples = opts.minSamplesBeforeRollback != null ? opts.minSamplesBeforeRollback : 200;
    const emaAlpha = opts.emaAlpha != null ? opts.emaAlpha : 0.01;
    const varFloor = opts.varFloor != null ? opts.varFloor : 1e-12;
    const baseLr = opts.baseLr != null ? opts.baseLr : CFG.adam.lr;
    const lrDecayFactor = opts.lrDecayFactor != null ? opts.lrDecayFactor : 0.9;
    const lrDecayIntervalMs = opts.lrDecayIntervalMs != null ? opts.lrDecayIntervalMs : 90 * 24 * 3600 * 1000;
    const lrFloor = opts.lrFloor != null ? opts.lrFloor : 1e-5;
    const rejuvIntervalMs = opts.rejuvIntervalMs != null ? opts.rejuvIntervalMs : 180 * 24 * 3600 * 1000;
    const rejuvEpsilon = opts.rejuvEpsilon != null ? opts.rejuvEpsilon : 0.3;

    let lossEMA = null;
    let lossVar = 0;
    let lossSamples = 0;
    let lrMultiplier = 1.0;
    let rollbackCount = 0;
    const bootNow = opts.now != null ? opts.now : Date.now();
    let lastLrDecayAt = bootNow;
    let lastRejuvAt = bootNow;

    // Compute sigma BEFORE updating the baseline so spikes don't poison
    // the very statistics we're using to detect them.
    function recordLoss(loss) {
      lossSamples++;
      if (lossEMA === null) {
        lossEMA = loss;
        lossVar = varFloor;
        return { action: 'bootstrap', sigma: 0, loss: loss };
      }
      const d = loss - lossEMA;
      const std = Math.sqrt(Math.max(lossVar, varFloor));
      const sigma = d / std;
      const explode = lossSamples >= minSamples && sigma > explosionSigma;
      if (!explode) {
        lossEMA = lossEMA + emaAlpha * d;
        lossVar = (1 - emaAlpha) * lossVar + emaAlpha * d * d;
        if (lossVar < varFloor) lossVar = varFloor;
      }
      return {
        action: explode ? 'rollback' : (sigma > driftSigma ? 'drift' : 'none'),
        sigma: sigma, loss: loss, baseline: lossEMA
      };
    }

    function maybeDecayLr(now) {
      now = now != null ? now : Date.now();
      if (now - lastLrDecayAt < lrDecayIntervalMs) return false;
      const floorRatio = lrFloor / baseLr;
      lrMultiplier = Math.max(floorRatio, lrMultiplier * lrDecayFactor);
      lastLrDecayAt = now;
      return true;
    }

    function maybeRejuvenate(now) {
      now = now != null ? now : Date.now();
      if (now - lastRejuvAt < rejuvIntervalMs) return false;
      lastRejuvAt = now;
      return true;
    }

    function onRollback() {
      rollbackCount++;
      // Loss stats are invalidated — post-rollback the network behaves
      // like a fresh session w.r.t. loss distribution.
      lossEMA = null;
      lossVar = 0;
      lossSamples = 0;
    }

    function serialize() {
      return {
        schema: 'lili-b-stabilizer-v1',
        lossEMA: lossEMA,
        lossVar: lossVar,
        lossSamples: lossSamples,
        lrMultiplier: lrMultiplier,
        lastLrDecayAt: lastLrDecayAt,
        lastRejuvAt: lastRejuvAt,
        rollbackCount: rollbackCount
      };
    }

    function deserialize(obj) {
      if (!obj || obj.schema !== 'lili-b-stabilizer-v1') return false;
      lossEMA = (obj.lossEMA == null) ? null : +obj.lossEMA;
      lossVar = +(obj.lossVar || 0);
      lossSamples = obj.lossSamples | 0;
      lrMultiplier = +(obj.lrMultiplier || 1.0);
      lastLrDecayAt = +(obj.lastLrDecayAt || bootNow);
      lastRejuvAt = +(obj.lastRejuvAt || bootNow);
      rollbackCount = obj.rollbackCount | 0;
      return true;
    }

    return {
      recordLoss: recordLoss,
      maybeDecayLr: maybeDecayLr,
      maybeRejuvenate: maybeRejuvenate,
      onRollback: onRollback,
      serialize: serialize,
      deserialize: deserialize,
      getLrMultiplier: function () { return lrMultiplier; },
      getRollbackCount: function () { return rollbackCount; },
      getRejuvEpsilon: function () { return rejuvEpsilon; },
      getStats: function () {
        return {
          lossEMA: lossEMA, lossVar: lossVar, lossSamples: lossSamples,
          lrMultiplier: lrMultiplier,
          lastLrDecayAt: lastLrDecayAt, lastRejuvAt: lastRejuvAt,
          rollbackCount: rollbackCount
        };
      }
    };
  }

  // Lili B brain wrapper. Ties DQN + novelty grids + shadow logger into
  // an interface mirroring Lili A's brain pattern.
  //
  // Typical frame integration (Phase 6 will wire this):
  //   const a = brain.chooseAction(aState, aWorld, cursor, bState, false);
  //   // ... apply action, step kinematics ...
  //   brain.observe(prevB, currB, prevA, currA,
  //                 aState, aWorld, cursor, bState,
  //                 done, priorityFlag, canTrain);
  function createLiliBBrain(opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed;
    const bodyRadiusN = opts.bodyRadiusN != null ? opts.bodyRadiusN : 0.03;
    const shadowKey = opts.shadowKey != null ? opts.shadowKey : 'lili_a_shadow_reward_log';
    const shadowFlushEveryN = opts.shadowFlushEveryN != null ? opts.shadowFlushEveryN : 200;

    const dqn = createDQN({
      stateDim: BRAIN.INPUT_DIM,
      actionDim: BRAIN.ACTION_DIM,
      hiddenDims: BRAIN.HIDDEN_DIMS,
      seed: seed,
      // Allow runtime to shrink the replay buffer on mobile (inference-only path).
      // When undefined, createDQN falls back to CFG.dqn.bufferCapacity (50 000).
      bufferCapacity: opts.bufferCapacity
    });
    const noveltyB = createNoveltyGrid(BRAIN.NOVELTY_CELLS, BRAIN.NOVELTY_CELLS);
    const noveltyA = createNoveltyGrid(BRAIN.NOVELTY_CELLS, BRAIN.NOVELTY_CELLS);
    const shadowLogger = createShadowLogger(shadowKey, shadowFlushEveryN);
    const stabilizer = createStabilizer(opts.stabilizer || {});

    const prevStateBuf = new Float32Array(BRAIN.INPUT_DIM);
    const nextStateBuf = new Float32Array(BRAIN.INPUT_DIM);
    let hasPrevState = false;
    let lastAction = -1;

    function chooseAction(aState, aWorld, cursor, bState, greedy) {
      assembleState(nextStateBuf, aState, aWorld, cursor, bState);
      const action = dqn.chooseAction(nextStateBuf, !!greedy);
      // Stash chosen action so the *next* observe() links (s, a, r, s').
      lastAction = action;
      return action;
    }

    function observe(prevB, currB, prevA, currA, aState, aWorld, cursor, bState,
                     done, priority, canTrain) {
      // Cursor payload for reward — treat any visible cursor (real OR phantom)
      // as the human-attention focal point. Phantom cursor gives training signal even
      // during idle human hours so Evrin learns resource-seeking consistently.
      const cursorRew = cursor ? {
        xn: cursor.xn, yn: cursor.yn,
        active: true
      } : null;

      // B reward — feeds DQN
      const bVisits = noveltyB.getCount(currB.xn, currB.yn);
      noveltyB.observe(currB.xn, currB.yn);
      const other = (currA != null) ? { xn: currA.xn, yn: currA.yn, present: true } : null;
      const bReward = computeReward(prevB, currB, other, cursorRew, bVisits, bodyRadiusN);

      // Shadow reward for A — log-only, never feeds A's Q-table
      let aShadow = null;
      if (prevA && currA) {
        const aVisits = noveltyA.getCount(currA.xn, currA.yn);
        noveltyA.observe(currA.xn, currA.yn);
        const otherForA = (currB != null) ? { xn: currB.xn, yn: currB.yn, present: true } : null;
        aShadow = computeReward(prevA, currA, otherForA, cursorRew, aVisits, bodyRadiusN);
        shadowLogger.log(aShadow.total, aShadow.components);
      }

      // Assemble s' and push (s, a, r, s', done) into replay buffer
      assembleState(nextStateBuf, aState, aWorld, cursor, bState);
      let trainResult = null;
      if (hasPrevState && lastAction >= 0) {
        dqn.observe(
          prevStateBuf, lastAction, bReward.total, nextStateBuf,
          done ? 1 : 0, priority == null ? 1 : priority
        );
        if (canTrain) trainResult = dqn.trainStep();
      }
      prevStateBuf.set(nextStateBuf);
      hasPrevState = true;

      return { reward: bReward, shadow: aShadow, train: trainResult };
    }

    function endEpisode() { return dqn.decayEpsilon(); }

    function serialize() {
      return {
        schema: 'lili-b-brain-v1',
        weights: Array.from(dqn.online.params),
        epsilon: dqn.getEpsilon(),
        trainSteps: dqn.getTrainSteps(),
        targetSyncs: dqn.getTargetSyncs(),
        novelty: noveltyB.serialize(),
        aNovelty: noveltyA.serialize(),
        stabilizer: stabilizer.serialize(),
        inputDim: BRAIN.INPUT_DIM,
        actionDim: BRAIN.ACTION_DIM
      };
    }

    // opts.skipStabilizer=true leaves the stabilizer untouched — used on
    // rollback where we don't want to revert the rollbackCount / loss EMA.
    function deserialize(obj, dOpts) {
      dOpts = dOpts || {};
      if (!obj || obj.schema !== 'lili-b-brain-v1') return false;
      if (obj.inputDim !== BRAIN.INPUT_DIM || obj.actionDim !== BRAIN.ACTION_DIM) return false;
      if (obj.weights && obj.weights.length === dqn.online.paramCount) {
        dqn.online.params.set(obj.weights);
        dqn.target.copyParamsFrom(dqn.online.params);
      }
      if (obj.epsilon != null) dqn.setEpsilon(obj.epsilon);
      if (obj.novelty) noveltyB.deserialize(obj.novelty);
      if (obj.aNovelty) noveltyA.deserialize(obj.aNovelty);
      if (obj.stabilizer && !dOpts.skipStabilizer) {
        stabilizer.deserialize(obj.stabilizer);
        // Sync network lr multiplier with restored schedule state.
        dqn.setLrMultiplier(stabilizer.getLrMultiplier());
      }
      hasPrevState = false;
      lastAction = -1;
      return true;
    }

    // Rollback: restore weights from an anchor snapshot, flush the replay
    // buffer (old-policy experiences are stale), bump ε back to the
    // rejuvenation value so the post-rollback policy re-explores rather
    // than immediately diverging again, and increment the stabilizer's
    // rollback count. Stabilizer loss stats are reset to avoid chain
    // rollbacks on the same baseline.
    function rollback(snap, rejuvEps) {
      if (!snap) return false;
      if (!deserialize(snap, { skipStabilizer: true })) return false;
      dqn.flushBuffer();
      const eps = (rejuvEps != null) ? rejuvEps : stabilizer.getRejuvEpsilon();
      dqn.setEpsilon(eps);
      stabilizer.onRollback();
      return true;
    }

    return {
      chooseAction: chooseAction,
      observe: observe,
      endEpisode: endEpisode,
      serialize: serialize,
      deserialize: deserialize,
      rollback: rollback,
      flushShadowLog: function () { return shadowLogger.flush(); },
      getShadowStats: function () { return shadowLogger.getStats(); },
      resetShadowLog: function () { return shadowLogger.reset(); },
      getNoveltyStats: function () {
        return { b: noveltyB.stats(), a: noveltyA.stats() };
      },
      stabilizer: stabilizer,
      dqn: dqn,
      _internal: {
        noveltyA: noveltyA,
        noveltyB: noveltyB,
        shadowLogger: shadowLogger,
        stabilizer: stabilizer
      },
      INPUT_DIM: BRAIN.INPUT_DIM,
      ACTION_DIM: BRAIN.ACTION_DIM
    };
  }

  // ============================================================
  // MOBILE DETECTION — desktop trains; mobile is inference-only.
  // Heuristic: narrow viewport OR touch-first UA string.
  // ============================================================
  function isMobileEnv() {
    if (typeof window === 'undefined') return false;
    const narrow = (window.innerWidth || 9999) < 768;
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
    const uaMobile = /Mobi|Android|iPhone|iPad|iPod|Silk|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    return narrow || uaMobile;
  }

  // ============================================================
  // KINEMATICS — B's body physics in document-space coordinates.
  //
  // Mood shapes steering: curious seeks cursor, playful seeks A at ideal
  // distance, shy flees both, calm drifts toward center, alert is fast
  // wander + repel on close cursor, idle is near-stationary, exploring
  // expands wander radius.
  //
  // Pre-allocation: one object literal per frame for steering context is
  // fine (V8 inlines these), but no Float32Array / buffer allocation.
  // ============================================================
  function createLiliBKinematics(opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed + 200;
    const rng = makeRng(seed);
    const noise = SimplexNoise.create(makeRng(seed + 7));

    // Per-mood tuning (indices match CFG.moods in lili.js):
    //   0 curious, 1 playful, 2 shy, 3 calm, 4 alert, 5 idle, 6 exploring
    const MAX_SPEED       = [55, 75, 45, 25, 100, 12, 65];   // px/s ceiling
    const MOOD_COHERENCE  = [0.7, 0.45, 0.55, 0.85, 0.35, 0.9, 0.6];
    // Pulse-glide rate (Hz) — mood-modulated octopus propulsion rhythm.
    const PULSE_FREQ      = [1.1, 1.6, 0.9, 0.7, 2.0, 0.5, 1.2];

    // Octopus physics constants (frame-rate-independent).
    const DAMPING_PER_FRAME = 0.94;        // equiv to A's 0.93-0.97 band
    const MAX_FORCE         = 180;         // px/s² acceleration cap
    const BOUNDARY_MARGIN   = 80;          // soft-steer zone near edges
    const BOUNDARY_GAIN     = 2.5;         // boundary steering stiffness

    const state = {
      x: 0, y: 0,
      vx: 0, vy: 0,
      bodyR: 18,
      stress: 0,
      mood: 5,
      wanderAngle: rng() * Math.PI * 2,
      pulsePhase: rng(),
      phaseT: 0,
      heading: 0,
      born: false
    };

    function ensureBorn(docW, docH, aX, aY) {
      if (state.born) return;
      const sideX = rng() < 0.5 ? 1 : -1;
      const sideY = rng() < 0.5 ? 1 : -1;
      state.x = Math.max(40, Math.min(docW - 40, aX + docW * 0.22 * sideX));
      state.y = Math.max(40, Math.min(docH - 40, aY + docH * 0.12 * sideY));
      state.born = true;
    }

    // ctx: { aPos:{x,y}, cursor:{x,y}, world:{docW,docH}, bodyR, mood }
    function update(dt, ctx) {
      const W = ctx.world.docW, H = ctx.world.docH;
      if (W <= 0 || H <= 0) return;
      ensureBorn(W, H, ctx.aPos.x, ctx.aPos.y);

      state.bodyR = ctx.bodyR || state.bodyR;
      const m = state.mood = (ctx.mood | 0) & 7;
      state.phaseT += dt;

      // --- Pulse-glide cycle (octopus jet propulsion rhythm) ---
      const pulseHz = PULSE_FREQ[m] || 1.1;
      state.pulsePhase = (state.pulsePhase + pulseHz * dt) % 1;

      // --- Simplex-noise wander (smooth organic drift, not RNG jitter) ---
      const t = state.phaseT;
      const coherence = MOOD_COHERENCE[m] || 0.6;
      const noiseVal = noise.noise2D(t * 0.3, seed * 0.01);
      const angleStep = noiseVal * (0.3 + (1 - coherence) * 1.5) * dt;
      state.wanderAngle += angleStep;

      // Wander target projected ahead of heading on a circle.
      const wDist = 50 + state.bodyR * 1.5;
      const wRad  = 30 + state.bodyR;
      const ahead = state.heading;
      const wcx = state.x + Math.cos(ahead) * wDist;
      const wcy = state.y + Math.sin(ahead) * wDist;
      const wx = wcx + Math.cos(state.wanderAngle) * wRad;
      const wy = wcy + Math.sin(state.wanderAngle) * wRad;

      // --- Mood-specific seek target blended with wander ---
      const aX = ctx.aPos.x, aY = ctx.aPos.y;
      const cx = ctx.cursor.x, cy = ctx.cursor.y;
      const dAx = aX - state.x, dAy = aY - state.y;
      const distA = Math.sqrt(dAx * dAx + dAy * dAy) + 1e-6;
      const dCx = cx - state.x, dCy = cy - state.y;
      const distC = Math.sqrt(dCx * dCx + dCy * dCy) + 1e-6;

      let seekWt = 0, seekX = state.x, seekY = state.y;
      if (m === 0) {              // curious → cursor
        seekWt = 0.55; seekX = cx; seekY = cy;
      } else if (m === 1) {       // playful → A, pulled to ideal distance
        const ideal = 180;
        const pull = (distA - ideal) / distA;
        seekX = state.x + dAx * pull;
        seekY = state.y + dAy * pull;
        seekWt = 0.6;
      } else if (m === 2) {       // shy → flee both
        seekX = state.x - dAx * 0.5 - dCx * 0.3;
        seekY = state.y - dAy * 0.5 - dCy * 0.3;
        seekWt = 0.65;
      } else if (m === 3) {       // calm → soft center drift
        seekX = W * 0.5; seekY = H * 0.5; seekWt = 0.12;
      } else if (m === 4) {       // alert → flee cursor when close
        if (distC < 220) {
          seekX = state.x - dCx; seekY = state.y - dCy; seekWt = 0.55;
        }
      } else if (m === 6) {       // exploring → amplified wander
        seekX = wx; seekY = wy; seekWt = 0.2;
      }
      // m === 5 idle → seekWt = 0 (pure wander).

      const tx = wx * (1 - seekWt) + seekX * seekWt;
      const ty = wy * (1 - seekWt) + seekY * seekWt;

      // --- Desired velocity toward target ---
      const maxSp = MAX_SPEED[m] || 55;
      const ddx = tx - state.x, ddy = ty - state.y;
      const ddMag = Math.sqrt(ddx * ddx + ddy * ddy) + 1e-6;
      let desVx = (ddx / ddMag) * maxSp;
      let desVy = (ddy / ddMag) * maxSp;

      // --- Pulse-glide speed modulation (burst → glide) ---
      const pulseT = state.pulsePhase;
      const powerRatio = 0.32 + coherence * 0.08;   // 0.32..0.40
      const speedBoost = 1.15 + coherence * 0.45;   // 1.15..1.60
      let pulseMod;
      if (pulseT < powerRatio) {
        // Power stroke — ease-out burst.
        const stT = pulseT / powerRatio;
        pulseMod = 1 + (speedBoost - 1) * (1 - Math.pow(1 - stT, 3));
      } else {
        // Glide phase — decelerate toward glideFloor.
        const glT = (pulseT - powerRatio) / (1 - powerRatio);
        const glideFloor = 0.35 + coherence * 0.35;
        pulseMod = speedBoost - (speedBoost - glideFloor) * glT;
      }
      desVx *= pulseMod;
      desVy *= pulseMod;

      // --- Acceleration = (desired - current), clamped to max force ---
      let accX = desVx - state.vx;
      let accY = desVy - state.vy;
      const accMag = Math.sqrt(accX * accX + accY * accY);
      if (accMag > MAX_FORCE) {
        accX = (accX / accMag) * MAX_FORCE;
        accY = (accY / accMag) * MAX_FORCE;
      }

      // --- Soft boundary steering (replaces hard reflection) ---
      if (state.x < BOUNDARY_MARGIN) {
        accX += (BOUNDARY_MARGIN - state.x) * BOUNDARY_GAIN;
      } else if (state.x > W - BOUNDARY_MARGIN) {
        accX -= (state.x - (W - BOUNDARY_MARGIN)) * BOUNDARY_GAIN;
      }
      if (state.y < BOUNDARY_MARGIN) {
        accY += (BOUNDARY_MARGIN - state.y) * BOUNDARY_GAIN;
      } else if (state.y > H - BOUNDARY_MARGIN) {
        accY -= (state.y - (H - BOUNDARY_MARGIN)) * BOUNDARY_GAIN;
      }

      // --- Integrate: velocity += acc * dt, then damping ---
      state.vx += accX * dt;
      state.vy += accY * dt;

      // Frame-rate-independent damping (equiv to 0.94 per 60fps frame).
      const damping = Math.pow(DAMPING_PER_FRAME, dt * 60);
      state.vx *= damping;
      state.vy *= damping;

      // Hard speed cap (safety — prevents runaway near boundaries).
      const spd = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      const hardCap = maxSp * 1.6;
      if (spd > hardCap) {
        state.vx = (state.vx / spd) * hardCap;
        state.vy = (state.vy / spd) * hardCap;
      }

      // --- Integrate position ---
      state.x += state.vx * dt;
      state.y += state.vy * dt;

      // Smooth heading from velocity (lerp factor depends on coherence).
      if (spd > 0.5) {
        const targetH = Math.atan2(state.vy, state.vx);
        let diff = targetH - state.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        const headingLerp = 0.08 + coherence * 0.12;
        state.heading += diff * headingLerp;
      }

      // Safety clamp (should rarely trigger with soft boundary).
      const safetyR = 10;
      if (state.x < safetyR)      state.x = safetyR;
      if (state.x > W - safetyR)  state.x = W - safetyR;
      if (state.y < safetyR)      state.y = safetyR;
      if (state.y > H - safetyR)  state.y = H - safetyR;

      // Stress from A-proximity (overlap signal). Decays otherwise.
      const overlap = state.bodyR * 2.5;
      if (distA < overlap) {
        state.stress = Math.max(state.stress, 1 - distA / overlap);
      } else {
        state.stress = Math.max(0, state.stress - dt * 0.5);
      }
    }

    function getState() {
      const speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
      return {
        x: state.x, y: state.y,
        vx: state.vx, vy: state.vy,
        speed: speed,
        stress: state.stress,
        bodyR: state.bodyR,
        phaseT: state.phaseT,
        heading: state.heading,
        mood: state.mood,
        born: state.born
      };
    }

    return { update: update, getState: getState, _raw: state };
  }

  // ============================================================
  // VISUAL — full-fidelity body port from Lili A (warm palette).
  //
  // Owns persistent state: 8 FABRIK tentacle chains + heading smoothing
  // + eye gaze + blink + saccade + genesis (per-instance individuality)
  // + own Simplex noise instance + frame counter.
  //
  // Pipeline per frame:
  //   update(dt, sensorCtx) — advances tentacles, eyes, blink, frame counter
  //   render(ctx)           — draws hull, body, chromatophores, eyes
  //
  // sensorCtx: { x, y, vx, vy, bodyR, heading, mood, stress, cursorX, cursorY, cursorActive }
  // Everything the visual responds to comes from Lili B's own sensors/brain.
  // ============================================================
  function createLiliBVisual(opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed + 500;
    const rng = makeRng(seed);
    const noise = SimplexNoise.create(makeRng(seed + 1));

    const TENT_N = VCFG.tentacleCount;
    const JOINTS = VCFG.tentacleSegments;

    // --- Genesis: seeded per-instance body proportions ---
    function gh(k) { return rng(); }
    const genesis = {
      bodyXScale: 1 + (gh(1) - 0.5) * 2 * VCFG.bodyXRange,
      bodyYScale: 1 + (gh(2) - 0.5) * 2 * VCFG.bodyYRange,
      eyeSpacing: 1 + (gh(3) - 0.5) * 2 * VCFG.eyeSpacingRange,
      eyeYOffset: 1 + (gh(4) - 0.5) * 2 * VCFG.eyeYRange,
      tentacleWidth: 1 + (gh(5) - 0.5) * 2 * VCFG.tentacleWidthRange,
      headTilt: (gh(6) - 0.5) * 2 * VCFG.headTiltRange,
      chromatophores: []
    };
    for (let i = 0; i < VCFG.chromatophoreCount; i++) {
      genesis.chromatophores.push({
        angle: gh(10 + i) * Math.PI * 2,
        phase: gh(20 + i) * Math.PI * 2,
        speed: VCFG.chromatophorePulseMin
          + gh(30 + i) * (VCFG.chromatophorePulseMax - VCFG.chromatophorePulseMin),
        hueOffset: (gh(40 + i) - 0.5) * 2 * VCFG.chromatophoreHueVariance
      });
    }

    // --- Tentacle chains (FABRIK state) ---
    const tentacles = [];
    for (let i = 0; i < TENT_N; i++) {
      tentacles.push({
        index: i,
        x: new Float32Array(JOINTS),
        y: new Float32Array(JOINTS),
        segLen: 0,
        totalLen: 0,
        anchorAngle: Math.PI + (i - (TENT_N - 1) * 0.5) * VCFG.tentacleAnchorSpacing,
        anchorX: 0, anchorY: 0,
        idealX: 0, idealY: 0,
        actualX: 0, actualY: 0,
        trailVX: 0, trailVY: 0,
        segVX: new Float32Array(JOINTS),
        segVY: new Float32Array(JOINTS),
        localStress: 0,
        recoilTimer: 0
      });
    }

    // --- Pre-allocated hull point arrays (zero-alloc render loop) ---
    const hullLeft = new Array(JOINTS);
    const hullRight = new Array(JOINTS);
    for (let j = 0; j < JOINTS; j++) {
      hullLeft[j] = { x: 0, y: 0 };
      hullRight[j] = { x: 0, y: 0 };
    }

    // --- Eye/blink/gaze state ---
    const gaze = { x: 0, y: 0, initialized: false, saccadeX: 0, saccadeY: 0, saccadeTimer: 0 };
    const blink = { phase: 0, nextAt: VCFG.blinkIntervalBase };

    // Persistent runtime counters (frameCount drives noise, breathing, chromatophore pulse).
    const _s = {
      frameCount: 0,
      x: 0, y: 0, bodyR: 18,
      vx: 0, vy: 0,
      heading: 0,
      mood: 5,
      stress: 0,
      cursorX: 0, cursorY: 0, cursorActive: false,
      tentaclesInitialized: false
    };

    function initTentaclePositions() {
      for (let t = 0; t < TENT_N; t++) {
        const arm = tentacles[t];
        for (let j = 0; j < JOINTS; j++) {
          arm.x[j] = _s.x;
          arm.y[j] = _s.y;
        }
      }
      _s.tentaclesInitialized = true;
    }

    // --- FABRIK solver (matches Lili A line-for-line, adapted to be closure-local) ---
    function fabrikSolve(arm, targetX, targetY) {
      const n = JOINTS;
      const seg = arm.segLen;
      const ax = arm.x, ay = arm.y;
      ax[0] = arm.anchorX;
      ay[0] = arm.anchorY;
      const dx = targetX - ax[0];
      const dy = targetY - ay[0];
      const distToTarget = Math.sqrt(dx * dx + dy * dy);
      if (distToTarget > arm.totalLen) {
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
      const maxIter = VCFG.fabrikIterations;
      const tol = VCFG.fabrikTolerance;
      const last = n - 1;
      for (let iter = 0; iter < maxIter; iter++) {
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

    function computeTentacleTarget(arm, time, moodVis, speedRatio, amplitude) {
      const idx = arm.index;
      const bodyX = _s.x, bodyY = _s.y;
      const heading = _s.heading;
      const asyncFactor = VCFG.tentacleAsyncFactor;
      const phaseShift = speedRatio > 0.2 ? PHASE_G4[idx] : PHASE_RADIAL[idx];
      const t = time * VCFG.tentacleSwimSpeed;
      const asyncTime = t + asyncFactor * Math.sin(t);
      const worldAngle = arm.anchorAngle + heading;
      const waveVal = Math.sin(asyncTime + phaseShift);
      const baseReach = arm.totalLen * (0.55 + 0.3 * waveVal) * moodVis.spreadMod;
      const swayVal = Math.cos(asyncTime * 0.7 + phaseShift);
      const perpAngle = worldAngle + Math.PI * 0.5;
      const noiseScale = VCFG.tentacleNoiseScale * moodVis.noiseMod;
      const noiseAmp = noise.noise2D(t * 0.5 + idx * 10, 0) * noiseScale;
      const noiseAngle = noise.noise2D(t * 0.5 + idx * 10, 1000) * 0.15 * moodVis.noiseMod;
      const reachAngle = worldAngle + noiseAngle;
      const trailBias = speedRatio * arm.totalLen * 0.4;
      const trailX = -Math.cos(heading) * trailBias;
      const trailY = -Math.sin(heading) * trailBias;
      const fwdBias = moodVis.forwardBias * arm.totalLen * 0.3;
      const isFront = (idx <= 1 || idx >= 6);
      const fwdX = isFront ? Math.cos(heading) * fwdBias : 0;
      const fwdY = isFront ? Math.sin(heading) * fwdBias : 0;
      arm.idealX = bodyX + Math.cos(reachAngle) * (baseReach + noiseAmp)
                 + Math.cos(perpAngle) * swayVal * amplitude * 0.4
                 + trailX + fwdX;
      arm.idealY = bodyY + Math.sin(reachAngle) * (baseReach + noiseAmp)
                 + Math.sin(perpAngle) * swayVal * amplitude * 0.4
                 + trailY + fwdY;
      if (speedRatio < 0.15) {
        const idleFactor = 1 - speedRatio / 0.15;
        arm.idealY += VCFG.tentacleRelaxGravity * moodVis.gravMod * arm.totalLen * 0.3 * idleFactor;
      }
    }

    function updateTrailingPhysics(arm) {
      const stiff = VCFG.tentacleTrailing.stiffness;
      const damp = VCFG.tentacleTrailing.damping;
      const ax = (arm.idealX - arm.actualX) * stiff;
      const ay = (arm.idealY - arm.actualY) * stiff;
      arm.trailVX = (arm.trailVX + ax) * damp;
      arm.trailVY = (arm.trailVY + ay) * damp;
      arm.actualX += arm.trailVX;
      arm.actualY += arm.trailVY;
    }

    function applySegmentSpringDamper(arm) {
      const n = JOINTS;
      const segStiff = VCFG.segSpringStiff;
      const segDamp = VCFG.segSpringDamp;
      const latDrag = VCFG.segLateralDrag;
      const jx = arm.x, jy = arm.y;
      const seg = arm.segLen;
      for (let i = 1; i < n; i++) {
        let dx = jx[i] - jx[i - 1];
        let dy = jy[i] - jy[i - 1];
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.001) continue;
        const stretch = dist - seg;
        let fx = -(dx / dist) * stretch * segStiff;
        let fy = -(dy / dist) * stretch * segStiff;
        const nx = -dy / dist;
        const ny = dx / dist;
        const perpVel = arm.segVX[i] * nx + arm.segVY[i] * ny;
        fx -= nx * perpVel * latDrag;
        fy -= ny * perpVel * latDrag;
        arm.segVX[i] = (arm.segVX[i] + fx) * segDamp;
        arm.segVY[i] = (arm.segVY[i] + fy) * segDamp;
        jx[i] += arm.segVX[i];
        jy[i] += arm.segVY[i];
        dx = jx[i] - jx[i - 1];
        dy = jy[i] - jy[i - 1];
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001 && Math.abs(dist - seg) > 0.5) {
          const lam = seg / dist;
          jx[i] = jx[i - 1] + dx * lam;
          jy[i] = jy[i - 1] + dy * lam;
        }
      }
    }

    function fabrikComfort(arm) {
      const C = VCFG.fabrikComfort;
      const ax = arm.x, ay = arm.y;
      const n = JOINTS;
      for (let i = 1; i < n - 1; i++) {
        const v1x = ax[i] - ax[i - 1];
        const v1y = ay[i] - ay[i - 1];
        const v2x = ax[i + 1] - ax[i];
        const v2y = ay[i + 1] - ay[i];
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
        if (len1 < 0.001 || len2 < 0.001) continue;
        let dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
        dot = Math.max(-1, Math.min(1, dot));
        const angle = Math.acos(dot);
        if (angle < C.maxBendAngle) {
          const cross = v1x * v2y - v1y * v2x;
          const sign = cross >= 0 ? 1 : -1;
          const correction = (C.maxBendAngle - angle) * C.torsionCorrectionStrength;
          const perpX = -v2y / len2 * sign;
          const perpY = v2x / len2 * sign;
          ax[i + 1] += perpX * correction * arm.segLen;
          ay[i + 1] += perpY * correction * arm.segLen;
          const rdx = ax[i + 1] - ax[i];
          const rdy = ay[i + 1] - ay[i];
          const r = Math.sqrt(rdx * rdx + rdy * rdy);
          if (r > 0.001) {
            const lam = arm.segLen / r;
            ax[i + 1] = ax[i] + rdx * lam;
            ay[i + 1] = ay[i] + rdy * lam;
          }
        }
      }
    }

    function updateTentacleLocalState(arm, frameDt, cursorActive, cursorX, cursorY, bodyR) {
      const tipX = arm.x[JOINTS - 1];
      const tipY = arm.y[JOINTS - 1];
      if (cursorActive) {
        const cdx = tipX - cursorX;
        const cdy = tipY - cursorY;
        const cursorDist = Math.sqrt(cdx * cdx + cdy * cdy);
        const recoilDist = VCFG.tentacleRecoilDistance + bodyR;
        if (cursorDist < recoilDist && arm.recoilTimer <= 0) {
          arm.recoilTimer = 0.4;
          arm.localStress = Math.min(arm.localStress + 0.3, 1);
        }
        const proxStress = cursorDist < recoilDist * 2
          ? (1 - cursorDist / (recoilDist * 2)) * 0.5 : 0;
        arm.localStress += (proxStress - arm.localStress) * 0.05;
      } else {
        arm.localStress *= 0.97;
      }
      if (arm.recoilTimer > 0) {
        arm.recoilTimer -= frameDt;
        const recoilT = Math.max(arm.recoilTimer / 0.4, 0);
        const retractStrength = recoilT * VCFG.tentacleRecoilSpeed;
        arm.idealX += (_s.x - arm.idealX) * retractStrength;
        arm.idealY += (_s.y - arm.idealY) * retractStrength;
      }
    }

    // --- Color computation (warm palette, sensor-driven HSL) ---
    function computeColors(moodVis) {
      const stressHue = _s.stress * VCFG.stressHueShift;
      const stressSat = _s.stress * VCFG.stressSaturationBoost;
      const hour = new Date().getHours();
      const isNightBio = hour >= 22 || hour < 6;
      const circadianLit = isNightBio ? -8 : 0;

      let h = VCFG.baseHue + moodVis.hueShift + stressHue;
      // Normalize hue into 0-360
      while (h < 0) h += 360;
      while (h >= 360) h -= 360;
      const s = Math.max(20, Math.min(100, VCFG.baseSaturation + moodVis.satShift + stressSat));
      const l = Math.max(15, Math.min(85, VCFG.baseLightness + moodVis.litShift + circadianLit));

      const nightGlow = isNightBio ? VCFG.nightGlowBoost : 1;
      const glowAlpha = VCFG.glowIntensity * 0.15 * nightGlow;

      const tentH = (h + 5) % 360;
      const pupilH = (h + 30) % 360;

      return {
        bodyHsl: 'hsl(' + h + ',' + s + '%,' + l + '%)',
        bodyHslAlpha: function (a) { return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')'; },
        tentHslAlpha: function (a) { return 'hsla(' + tentH + ',' + (s - 5) + '%,' + (l + 5) + '%,' + a + ')'; },
        glowHsl: 'hsla(' + ((h + 360 - 10) % 360) + ',' + Math.min(s + 10, 100) + '%,' + Math.min(l + 20, 85) + '%,' + glowAlpha + ')',
        eyeWhite: 'hsl(' + h + ',15%,92%)',
        pupilHsl: 'hsl(' + pupilH + ',' + Math.min(s + 20, 100) + '%,' + Math.max(l - 25, 10) + '%)',
        h: h, s: s, l: l, isNightBio: isNightBio
      };
    }

    // --- Main update: advance tentacles + eyes + counters ---
    function update(dt, sensor) {
      _s.x = sensor.x; _s.y = sensor.y;
      _s.vx = sensor.vx; _s.vy = sensor.vy;
      _s.bodyR = sensor.bodyR || _s.bodyR;
      _s.heading = sensor.heading || 0;
      _s.mood = (sensor.mood | 0) & 7;
      _s.stress = sensor.stress || 0;
      _s.cursorX = sensor.cursorX;
      _s.cursorY = sensor.cursorY;
      _s.cursorActive = !!sensor.cursorActive;
      _s.frameCount++;

      if (!_s.tentaclesInitialized) initTentaclePositions();

      const frameDt = Math.min(dt, 0.05);
      const time = _s.frameCount / 60;
      const r = _s.bodyR;

      const segLen = r * VCFG.tentacleSegLenRatio;
      const speed = vec2Mag(_s.vx, _s.vy);
      // maxSpeed approx from kinematics table peak 120; use 120 as ceiling for ratio.
      const speedRatio = Math.min(speed / 120, 1);
      const amplitude = r * VCFG.tentacleSwimAmplitudeRatio * MOOD_VIS[_s.mood].ampMod;

      for (let t = 0; t < TENT_N; t++) {
        const arm = tentacles[t];
        arm.segLen = segLen;
        arm.totalLen = segLen * (JOINTS - 1);
        const anchorWorld = arm.anchorAngle + _s.heading;
        arm.anchorX = _s.x + Math.cos(anchorWorld) * r * 0.85;
        arm.anchorY = _s.y + Math.sin(anchorWorld) * r * 0.85;
        computeTentacleTarget(arm, time, MOOD_VIS[_s.mood], speedRatio, amplitude);
        updateTentacleLocalState(arm, frameDt, _s.cursorActive, _s.cursorX, _s.cursorY, r);
        updateTrailingPhysics(arm);
        fabrikSolve(arm, arm.actualX, arm.actualY);
        fabrikComfort(arm);
        applySegmentSpringDamper(arm);
      }

      // Gaze — track cursor (or B position if cursor inactive)
      const rawGazeX = _s.cursorActive ? _s.cursorX : (_s.x + Math.cos(_s.heading) * r * 3);
      const rawGazeY = _s.cursorActive ? _s.cursorY : (_s.y + Math.sin(_s.heading) * r * 3);
      if (!gaze.initialized) {
        gaze.x = rawGazeX; gaze.y = rawGazeY; gaze.initialized = true;
      } else {
        gaze.x += (rawGazeX - gaze.x) * VCFG.gazeLerp;
        gaze.y += (rawGazeY - gaze.y) * VCFG.gazeLerp;
      }
      gaze.saccadeTimer--;
      if (gaze.saccadeTimer <= 0) {
        const sa = VCFG.saccadeAmplitude;
        gaze.saccadeX = (rng() - 0.5) * 2 * sa;
        gaze.saccadeY = (rng() - 0.5) * 2 * sa;
        gaze.saccadeTimer = VCFG.saccadeIntervalMin
          + ((rng() * (VCFG.saccadeIntervalMax - VCFG.saccadeIntervalMin)) | 0);
      }
      gaze.saccadeX *= 0.75;
      gaze.saccadeY *= 0.75;

      // Blink — triggered at blinkIntervalBase + random jitter
      if (blink.phase > 0) blink.phase--;
      blink.nextAt--;
      if (blink.nextAt <= 0 && blink.phase <= 0) {
        blink.phase = VCFG.blinkDurationFrames;
        blink.nextAt = VCFG.blinkIntervalBase + ((rng() * VCFG.blinkIntervalVar) | 0);
      }
    }

    // --- Render the whole body: hull → body → eyes (z-order) ---
    function render(ctx) {
      const moodVis = MOOD_VIS[_s.mood];
      const colors = computeColors(moodVis);

      ctx.save();

      // ===== Tentacles hull =====
      const baseW = _s.bodyR * VCFG.hullBaseWidthRatio * genesis.tentacleWidth;
      const noiseAmp = VCFG.hullNoiseAmplitude;
      const tipAlpha = VCFG.hullTipAlpha;
      const t60 = _s.frameCount * 0.01;

      ctx.beginPath();
      for (let t = 0; t < TENT_N; t++) {
        const arm = tentacles[t];
        for (let j = 0; j < JOINTS; j++) {
          const tang = polyTangent(arm.x, arm.y, j, JOINTS);
          const taper = 1 - (j / (JOINTS - 1));
          const nv = noise.noise2D(arm.x[j] * 0.02 + t60, arm.y[j] * 0.02 + t * 3.7);
          const w = baseW * taper * (1 + nv * noiseAmp);
          hullLeft[j].x = arm.x[j] + tang.nx * w;
          hullLeft[j].y = arm.y[j] + tang.ny * w;
          hullRight[j].x = arm.x[j] - tang.nx * w;
          hullRight[j].y = arm.y[j] - tang.ny * w;
        }
        drawHullSide(ctx, hullRight, JOINTS, false, VCFG.hullCatmullTension);
        const tipIdx = JOINTS - 1;
        ctx.arc(arm.x[tipIdx], arm.y[tipIdx], baseW * 0.15, 0, Math.PI);
        drawHullSide(ctx, hullLeft, JOINTS, true, VCFG.hullCatmullTension);
        ctx.closePath();
      }
      ctx.fillStyle = colors.tentHslAlpha(0.75);
      ctx.fill();
      ctx.strokeStyle = colors.tentHslAlpha(0.2);
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Tentacle tip highlights — bioluminescent glow (always on for dark bg).
      // A gates this on ambient-brightness; we always apply it since B runs on
      // the same shared canvas (typically dark test page), giving the "water
      // droplets / bubbles" look at each tentacle tip.
      for (let t = 0; t < TENT_N; t++) {
        const arm = tentacles[t];
        const tipX = arm.x[JOINTS - 1];
        const tipY = arm.y[JOINTS - 1];
        const tipR = baseW * 0.5;
        if (arm.recoilTimer > 0) {
          ctx.fillStyle = 'rgba(255, 140, 110, 0.55)';
          ctx.beginPath();
          ctx.arc(tipX, tipY, tipR, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const glowR = tipR * 2.5;
          const tipGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, glowR);
          tipGlow.addColorStop(0, colors.tentHslAlpha(tipAlpha * 1.6));
          tipGlow.addColorStop(0.4, colors.tentHslAlpha(tipAlpha * 0.7));
          tipGlow.addColorStop(1, colors.tentHslAlpha(0));
          ctx.fillStyle = tipGlow;
          ctx.beginPath();
          ctx.arc(tipX, tipY, glowR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ===== Body =====
      const x = _s.x, y = _s.y, r = _s.bodyR;
      const rx = r * VCFG.bodyRadiusXScale * genesis.bodyXScale;
      const ry = r * VCFG.bodyRadiusYScale * genesis.bodyYScale;
      const breathT = _s.frameCount / 60;
      const breathFreq = (VCFG.breathingBpm / 60) * moodVis.breathMod;
      const breathMod = 1 + Math.sin(breathT * breathFreq * Math.PI * 2) * VCFG.breathingAmplitude * (0.7 + moodVis.breathMod * 0.5);
      const moodScale = moodVis.bodyScale;
      const finalRx = rx * breathMod * moodScale;
      const finalRy = ry * breathMod * moodScale;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(_s.heading + genesis.headTilt);

      // Outer glow — subtle rim, not a halo
      const glowR = r * 2.2;
      let glowIntensity = VCFG.glowIntensity;
      if (moodVis.glowPulseHz > 0) {
        glowIntensity *= 1 + Math.sin(breathT * moodVis.glowPulseHz * Math.PI * 2) * 0.2;
      }
      const glow = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, glowR);
      glow.addColorStop(0, colors.bodyHslAlpha(glowIntensity * 0.12));
      glow.addColorStop(0.5, colors.bodyHslAlpha(glowIntensity * 0.04));
      glow.addColorStop(1, colors.bodyHslAlpha(0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(0, 0, glowR, glowR, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body contour (noise-deformed ellipse)
      const nPts = VCFG.bodyNoisePoints;
      const bodyNoiseAmp = VCFG.bodyNoiseAmplitude;
      const noiseT = _s.frameCount * VCFG.bodyNoiseSpeed * 0.01;
      ctx.beginPath();
      for (let i = 0; i <= nPts; i++) {
        const angle = (i / nPts) * Math.PI * 2;
        const baseX = Math.cos(angle) * finalRx;
        const baseY = Math.sin(angle) * finalRy;
        const nv = noise.noise2D(Math.cos(angle) * 2 + noiseT, Math.sin(angle) * 2 + noiseT * 0.7);
        const displacement = 1 + nv * bodyNoiseAmp;
        const px = baseX * displacement;
        const py = baseY * displacement;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      // Body fill (very translucent — ghostly glow, not solid sphere).
      // Warm hues pop more than A's teal at same alpha, so we dim further.
      const bodyGrad = ctx.createRadialGradient(
        -finalRx * 0.15, -finalRy * 0.25, finalRx * 0.05,
        0, 0, Math.max(finalRx, finalRy));
      bodyGrad.addColorStop(0, colors.bodyHslAlpha(0.35));
      bodyGrad.addColorStop(0.45, colors.bodyHslAlpha(0.22));
      bodyGrad.addColorStop(0.8, colors.bodyHslAlpha(0.12));
      bodyGrad.addColorStop(1, colors.bodyHslAlpha(0.04));
      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // Body rim — soft outline at perimeter (matches A's ghostly feel).
      ctx.strokeStyle = colors.bodyHslAlpha(0.45);
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Specular highlight (tiny spec, not a bright bulb)
      const specSize = Math.min(finalRx, finalRy) * 0.12;
      const specGrad = ctx.createRadialGradient(
        -finalRx * 0.28, -finalRy * 0.32, specSize * 0.1,
        -finalRx * 0.28, -finalRy * 0.32, specSize);
      specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      specGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
      specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.arc(-finalRx * 0.28, -finalRy * 0.32, specSize, 0, Math.PI * 2);
      ctx.fill();

      // Chromatophore cells
      for (let ci = 0; ci < VCFG.chromatophoreCount; ci++) {
        const cell = genesis.chromatophores[ci];
        if (!cell) continue;
        const cAngle = cell.angle;
        const cx = Math.cos(cAngle) * finalRx * 0.65;
        const cy = Math.sin(cAngle) * finalRy * 0.65;
        const pulse = 0.5 + 0.5 * Math.sin(_s.frameCount * cell.speed + cell.phase);
        const cr = VCFG.chromatophoreMinRadius + (VCFG.chromatophoreMaxRadius - VCFG.chromatophoreMinRadius) * pulse;
        const cellAlpha = VCFG.chromatophoreBaseAlpha * (0.4 + pulse * 0.6);
        let ch = colors.h + cell.hueOffset;
        while (ch < 0) ch += 360; while (ch >= 360) ch -= 360;
        ctx.fillStyle = 'hsla(' + ch + ','
          + Math.min(colors.s + 15, 100) + '%,'
          + Math.max(colors.l - 5, 10) + '%,' + cellAlpha + ')';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // ===== Eyes =====
      const eyeR = r * VCFG.eyeRadiusFactor;
      const pupilR = eyeR * VCFG.pupilRadiusFactor;
      const spacing = r * VCFG.eyeSpacing * genesis.eyeSpacing;
      const yOff = r * VCFG.eyeYOffset * genesis.eyeYOffset;
      const cosH = Math.cos(_s.heading + genesis.headTilt);
      const sinH = Math.sin(_s.heading + genesis.headTilt);
      const fwdX2 = cosH * yOff;
      const fwdY2 = sinH * yOff;
      const perpX = -sinH * spacing;
      const perpY = cosH * spacing;
      const leftEyeX = x + fwdX2 + perpX;
      const leftEyeY = y + fwdY2 + perpY;
      const rightEyeX = x + fwdX2 - perpX;
      const rightEyeY = y + fwdY2 - perpY;

      // Blink lidClose 0..1 with ease-in-out-cubic
      const blinkDur = VCFG.blinkDurationFrames;
      let lidClose = 0;
      if (blink.phase > 0) {
        const half = blinkDur * 0.5;
        const remaining = blink.phase;
        let rawLid;
        if (remaining > half) rawLid = (blinkDur - remaining) / half;
        else rawLid = remaining / half;
        lidClose = rawLid < 0.5
          ? 4 * rawLid * rawLid * rawLid
          : 1 - Math.pow(-2 * rawLid + 2, 3) / 2;
      }
      const squintAmount = moodVis.squint;
      const pupilScaleMood = moodVis.pupilScale;
      const maxOff = eyeR * VCFG.eyePupilMaxOffset;
      const speedNow = vec2Mag(_s.vx, _s.vy);

      function drawEye(ex, ey, isLeft) {
        // Shadow halo
        ctx.fillStyle = colors.bodyHslAlpha(0.3);
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 1.15, 0, Math.PI * 2);
        ctx.fill();

        const totalLid = Math.min(lidClose + squintAmount, 0.95);
        if (totalLid > 0.01) {
          ctx.save();
          ctx.beginPath();
          const clipY = ey - eyeR + eyeR * 2 * totalLid;
          ctx.rect(ex - eyeR * 1.5, clipY, eyeR * 3, eyeR * 3);
          ctx.clip();
        }

        // Sclera
        const scleraGrad = ctx.createRadialGradient(
          ex - eyeR * 0.15, ey - eyeR * 0.15, eyeR * 0.1,
          ex, ey, eyeR);
        scleraGrad.addColorStop(0, 'rgba(255, 252, 248, 0.95)');
        scleraGrad.addColorStop(1, colors.eyeWhite);
        ctx.fillStyle = scleraGrad;
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // Pupil position (gaze + saccade)
        let dx = (gaze.x + gaze.saccadeX) - ex;
        let dy = (gaze.y + gaze.saccadeY) - ey;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (_s.mood === 5) {
          // idle → drift toward center
          dx *= 0.3; dy *= 0.3;
        }
        const off = Math.min(dist * 0.01, maxOff);
        const px = ex + (dx / dist) * off;
        const py = ey + (dy / dist) * off;

        const pupilScale = (0.85 + _s.stress * 0.35 + Math.min(speedNow * 0.03, 0.2)) * pupilScaleMood;

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

        if (totalLid > 0.01) {
          ctx.restore();
          ctx.fillStyle = colors.bodyHslAlpha(0.85);
          ctx.beginPath();
          const lidY = ey - eyeR + eyeR * 2 * totalLid;
          ctx.arc(ex, ey, eyeR, -Math.PI, 0);
          ctx.lineTo(ex + eyeR, lidY);
          ctx.lineTo(ex - eyeR, lidY);
          ctx.closePath();
          if (lidY < ey + eyeR) ctx.fill();
        }

        // Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(ex - eyeR * 0.18, ey - eyeR * 0.22, eyeR * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.15, ey + eyeR * 0.12, eyeR * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Night bioluminescence inner glow
        if (colors.isNightBio) {
          const glowH = (colors.h + 30) % 360;
          const eyeGlow = ctx.createRadialGradient(px, py, 0, px, py, eyeR * 0.8);
          eyeGlow.addColorStop(0, 'hsla(' + glowH + ',80%,70%,' + VCFG.eyeGlowAlpha + ')');
          eyeGlow.addColorStop(1, 'hsla(' + glowH + ',60%,50%,0)');
          ctx.fillStyle = eyeGlow;
          ctx.beginPath();
          ctx.arc(ex, ey, eyeR * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      drawEye(leftEyeX, leftEyeY, true);
      drawEye(rightEyeX, rightEyeY, false);

      ctx.restore();
    }

    function getState() {
      return {
        frameCount: _s.frameCount,
        genesis: genesis,
        mood: _s.mood,
        stress: _s.stress,
        heading: _s.heading,
        tentacleCount: TENT_N,
        joints: JOINTS
      };
    }

    return { update: update, render: render, getState: getState };
  }

  // ============================================================
  // PERSISTENCE — localStorage save/load + anchor rotation.
  //
  // Payload schema `lili-b-persist-v1`:
  //   { schema, savedAt, firstSavedAt, lastAnchorAt, meta,
  //     current: brainSnapshot, anchors: [{ at, snap }, ...] }
  //
  // Anchor rotation: every `anchorIntervalMs` (default 7 days) the
  // prior `current` is pushed into anchors[0], capped at 3 anchors.
  // Phase 8 will consume anchors for loss-explosion rollback.
  // ============================================================
  function createPersistence(key, anchorIntervalMs, maxAnchors) {
    key = key || 'lili_b_weights';
    anchorIntervalMs = anchorIntervalMs != null ? anchorIntervalMs : 7 * 24 * 3600 * 1000;
    maxAnchors = maxAnchors != null ? maxAnchors : 3;

    const hasLS = (function () {
      try { return typeof localStorage !== 'undefined' && localStorage !== null; }
      catch (_e) { return false; }
    })();

    function load() {
      if (!hasLS) return null;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (!p || p.schema !== 'lili-b-persist-v1') return null;
        return p;
      } catch (_err) { return null; }
    }

    function save(brain, meta, extras) {
      if (!hasLS) return false;
      try {
        const now = Date.now();
        const existing = load() || {};
        const snap = brain.serialize();
        const lastAnchor = existing.lastAnchorAt || 0;
        const shouldAnchor = existing.current && (now - lastAnchor) >= anchorIntervalMs;
        const anchors = (existing.anchors || []).slice();
        if (shouldAnchor) {
          anchors.unshift({ at: existing.savedAt || now, snap: existing.current });
          while (anchors.length > maxAnchors) anchors.pop();
        }
        // lastExportAt is preserved across saves; callers update it only via
        // markExport() so periodic brain saves don't clobber user-level state.
        const nextExportAt = (extras && extras.lastExportAt != null)
          ? extras.lastExportAt
          : (existing.lastExportAt != null ? existing.lastExportAt : null);
        const payload = {
          schema: 'lili-b-persist-v1',
          savedAt: now,
          firstSavedAt: existing.firstSavedAt || now,
          lastAnchorAt: shouldAnchor ? now : (existing.lastAnchorAt || now),
          lastExportAt: nextExportAt,
          meta: meta || {},
          current: snap,
          anchors: anchors
        };
        localStorage.setItem(key, JSON.stringify(payload));
        return true;
      } catch (_err) { return false; }
    }

    // Write-through for lastExportAt without requiring a brain snapshot.
    // Used by runtime.downloadExport() to stamp export time atomically.
    function markExport(now) {
      if (!hasLS) return false;
      try {
        const existing = load();
        if (!existing) return false;
        existing.lastExportAt = (now != null) ? now : Date.now();
        localStorage.setItem(key, JSON.stringify(existing));
        return true;
      } catch (_err) { return false; }
    }

    function restore(brain) {
      const p = load();
      if (!p || !p.current) return false;
      return brain.deserialize(p.current);
    }

    function clear() {
      if (!hasLS) return false;
      try { localStorage.removeItem(key); return true; }
      catch (_e) { return false; }
    }

    function getAnchors() {
      const p = load();
      return p ? (p.anchors || []) : [];
    }

    return {
      save: save,
      load: load,
      restore: restore,
      clear: clear,
      getAnchors: getAnchors,
      markExport: markExport,
      key: key
    };
  }

  // ============================================================
  // INSTRUMENTATION — Phase 10 runtime-level telemetry:
  //   - Loss ring buffer (timestamp + value pairs, pre-allocated Float32Array)
  //   - Rollback event log (small regular array; events are rare, <3/year target)
  //   - Phantom/real decision ratio with rolling window
  //
  // Session-scoped: history resets on each runtime init. Cumulative counters
  // (rollbackCount) live on the stabilizer and already persist. Detailed event
  // metadata is captured per-session and exported via runtime.exportBrain().
  //
  // Pre-allocation: buffers sized at construction; hot paths (recordLoss,
  // recordDecision) do zero allocations. recordRollback uses Array.push but
  // fires at most a handful of times per year.
  // ============================================================
  function createInstrumentation(opts) {
    opts = opts || {};
    const lossCap = opts.lossCap != null ? opts.lossCap : 1024;
    const rollbackCap = opts.rollbackCap != null ? opts.rollbackCap : 32;
    const ratioWindow = opts.ratioWindow != null ? opts.ratioWindow : 512;
    const startWall = opts.now != null ? opts.now : Date.now();

    // Loss ring: pair of (elapsedMs, loss) per slot, stored flat as Float32.
    // Elapsed ms fits in f32 without precision loss up to ~4 hours; longer
    // sessions lose sub-ms precision but timestamps remain monotonic.
    const lossBuf = new Float32Array(lossCap * 2);
    let lossHead = 0;
    let lossCount = 0;

    const rollbacks = [];

    let totalReal = 0;
    let totalPhantom = 0;
    // Uint8 flag ring for rolling phantom-ratio window (0=real, 1=phantom).
    const ratioBuf = new Uint8Array(ratioWindow);
    let ratioHead = 0;
    let ratioCount = 0;
    let recentReal = 0;
    let recentPhantom = 0;

    function recordLoss(now, loss) {
      if (!Number.isFinite(loss)) return;
      const t = (now != null ? now : Date.now()) - startWall;
      const idx = lossHead * 2;
      lossBuf[idx] = t;
      lossBuf[idx + 1] = loss;
      lossHead = (lossHead + 1) % lossCap;
      if (lossCount < lossCap) lossCount++;
    }

    function recordRollback(event) {
      // Normalize into a plain JSON-safe object; callers pass whatever is
      // handy. Oldest drops off FIFO once cap is hit.
      const safe = {
        at: event && event.at != null ? event.at : Date.now(),
        sigma: event && Number.isFinite(event.sigma) ? +event.sigma : null,
        baseline: event && Number.isFinite(event.baseline) ? +event.baseline : null,
        anchorAgeMs: event && Number.isFinite(event.anchorAgeMs) ? +event.anchorAgeMs : null,
        count: event && event.count != null ? (event.count | 0) : null
      };
      rollbacks.push(safe);
      while (rollbacks.length > rollbackCap) rollbacks.shift();
    }

    function recordDecision(isPhantom) {
      const flag = isPhantom ? 1 : 0;
      if (flag) totalPhantom++; else totalReal++;
      if (ratioCount === ratioWindow) {
        const evicted = ratioBuf[ratioHead];
        if (evicted) recentPhantom--; else recentReal--;
      }
      ratioBuf[ratioHead] = flag;
      if (flag) recentPhantom++; else recentReal++;
      ratioHead = (ratioHead + 1) % ratioWindow;
      if (ratioCount < ratioWindow) ratioCount++;
    }

    function getLossHistory() {
      // Return chronological order (oldest first) as parallel plain arrays.
      const ts = new Array(lossCount);
      const vs = new Array(lossCount);
      const startIdx = (lossHead - lossCount + lossCap) % lossCap;
      for (let i = 0; i < lossCount; i++) {
        const slot = (startIdx + i) % lossCap;
        ts[i] = +lossBuf[slot * 2];
        vs[i] = +lossBuf[slot * 2 + 1];
      }
      return { t: ts, v: vs };
    }

    function getRollbackLog() {
      return rollbacks.slice();
    }

    function getRatio() {
      return {
        totalReal: totalReal,
        totalPhantom: totalPhantom,
        windowSize: ratioCount,
        recentReal: recentReal,
        recentPhantom: recentPhantom
      };
    }

    function getStats() {
      return {
        lossCount: lossCount,
        lossCap: lossCap,
        rollbackEvents: rollbacks.length,
        ratio: getRatio(),
        startWall: startWall
      };
    }

    return {
      recordLoss: recordLoss,
      recordRollback: recordRollback,
      recordDecision: recordDecision,
      getLossHistory: getLossHistory,
      getRollbackLog: getRollbackLog,
      getRatio: getRatio,
      getStats: getStats
    };
  }

  // ============================================================
  // RUNTIME — stitches phantom + brain + kinematics + render + persist
  // into a per-frame tick() registered as a window.LiliA.onAfterRender hook.
  //
  // Decision cadence mirrors A (decisionFrames, default 45 ≈ 0.75 s @ 60 FPS).
  // Training cadence: real input → every 4 decisions; phantom → every 16.
  // Mobile: inference-only (greedy=true, no observe/train), shrunken replay.
  // ============================================================
  function createLiliBRuntime(opts) {
    opts = opts || {};
    const seed = opts.seed != null ? opts.seed : CFG.defaultSeed;
    const persistKey = opts.persistKey || 'lili_b_weights';
    const decisionFrames = opts.decisionFrames != null ? opts.decisionFrames : 45;
    const trainEveryReal = opts.trainEveryReal != null ? opts.trainEveryReal : 4;
    const trainEveryPhantom = opts.trainEveryPhantom != null ? opts.trainEveryPhantom : 16;
    const saveIntervalMs = opts.saveIntervalMs != null ? opts.saveIntervalMs : 5 * 60 * 1000;
    const mobile = opts.forceMobile != null ? !!opts.forceMobile : isMobileEnv();
    // Monthly export reminder (Phase 10). Brief says "ne týdně — Vercel bloat";
    // we emit a one-shot console.info per session if the user hasn't exported
    // in > reminderIntervalMs. Mobile sessions skip — no training happens there.
    const reminderIntervalMs = opts.reminderIntervalMs != null
      ? opts.reminderIntervalMs
      : 30 * 24 * 3600 * 1000;

    // Mobile shrinks replay buffer; never trains, so 100 is enough to keep
    // internal structures valid without the 10.8 MB desktop footprint.
    const brain = createLiliBBrain({
      seed: seed,
      bufferCapacity: mobile ? 100 : undefined
    });
    const kin = createLiliBKinematics({ seed: seed + 200 });
    const visual = createLiliBVisual({ seed: seed + 500 });
    const phantom = createPhantomGenerator({ seed: seed + 11 });
    const persist = createPersistence(persistKey);
    const instr = createInstrumentation(opts.instrumentation || {});

    const restored = persist.restore(brain);

    // Read export-reminder state from persist; only emit once per runtime.
    const _loaded = persist.load();
    let lastExportAt = (_loaded && _loaded.lastExportAt != null)
      ? _loaded.lastExportAt
      : null;
    const _firstSavedAt = (_loaded && _loaded.firstSavedAt != null)
      ? _loaded.firstSavedAt
      : null;
    if (!mobile && opts.suppressReminder !== true) {
      const nowWall = Date.now();
      // Reference point: last export if set, else firstSavedAt (treat as
      // "you've been running this long without exporting"). Brand-new users
      // with no persistence never trigger the reminder.
      const ref = lastExportAt != null ? lastExportAt : _firstSavedAt;
      if (ref != null && (nowWall - ref) >= reminderIntervalMs) {
        const daysSince = Math.round((nowWall - ref) / (24 * 3600 * 1000));
        console.info('[Evrin] export reminder: ' + daysSince + ' days since last '
          + (lastExportAt != null ? 'export' : 'first save')
          + ' — press Shift+E to download training snapshot.');
      }
    }

    let frameCount = 0;
    let decisionCount = 0;
    let currentMood = 5;             // idle default
    let prevB = null, prevA = null;
    let lastSaveAt = 0;
    let lastTickMs = 0;
    let attached = true;

    // Phantom feeder — real mousemove notifications swap the cursor source.
    function onMouseMove(e) {
      phantom.notifyRealMouse(e.pageX || 0, e.pageY || 0);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    function tick(ctx) {
      if (!attached || typeof window === 'undefined' || !window.LiliA) return;
      const aState = window.LiliA.getState();
      const world = window.LiliA.getWorld();
      if (aState.paused) return;
      if (world.docW <= 0 || world.docH <= 0) return;

      const now = (typeof performance !== 'undefined' && performance.now)
        ? performance.now() : Date.now();
      if (lastTickMs === 0) lastTickMs = now;
      const dt = Math.min((now - lastTickMs) / 1000, 0.05);
      lastTickMs = now;

      // Phantom cursor update (idle > absenceMs → phantom trajectory).
      phantom.update(dt, {
        W: world.docW, H: world.docH,
        liliA: { x: aState.x, y: aState.y },
        liliB: { x: kin._raw.x, y: kin._raw.y },
        now: now
      });
      const ph = phantom.getCursor();
      const cursorX = aState.mouseActive ? aState.mouseX : ph.x;
      const cursorY = aState.mouseActive ? aState.mouseY : ph.y;
      const cursorPhantom = !aState.mouseActive && ph.isPhantom;

      // Advance B's body in document space.
      kin.update(dt, {
        aPos: { x: aState.x, y: aState.y },
        cursor: { x: cursorX, y: cursorY },
        world: { docW: world.docW, docH: world.docH },
        bodyR: aState.bodyR,           // match A's ontogenesis-driven size
        mood: currentMood
      });
      const kSt = kin.getState();
      frameCount++;

      // Brain-interface-shaped observations.
      const cursorNorm = {
        xn: world.docW > 0 ? cursorX / world.docW : 0,
        yn: world.docH > 0 ? cursorY / world.docH : 0,
        speed: aState.mouseSpeed || 0,
        isPhantom: cursorPhantom ? 1 : 0
      };
      const bStateVec = {
        xn: world.docW > 0 ? kSt.x / world.docW : 0,
        yn: world.docH > 0 ? kSt.y / world.docH : 0,
        vxNorm: kSt.vx / BRAIN.MAX_SPEED_NORM,
        vyNorm: kSt.vy / BRAIN.MAX_SPEED_NORM,
        stress: kSt.stress
      };

      // Decision boundary: choose action + observe transition.
      if (frameCount % decisionFrames === 0) {
        currentMood = brain.chooseAction(aState, world, cursorNorm, bStateVec, /*greedy*/ mobile);
        decisionCount++;
        instr.recordDecision(cursorPhantom);

        const currB = {
          xn: bStateVec.xn, yn: bStateVec.yn,
          speed: kSt.speed / BRAIN.MAX_SPEED_NORM,
          stress: kSt.stress
        };
        const currA = {
          xn: aState.xn, yn: aState.yn,
          speed: (aState.speed || 0) / BRAIN.MAX_SPEED_NORM,
          stress: aState.stress
        };
        const priorityFlag = cursorPhantom ? 0 : 1;
        const trainEvery = cursorPhantom ? trainEveryPhantom : trainEveryReal;
        const canTrain = !mobile && (decisionCount % trainEvery === 0);

        if (prevB && prevA) {
          const obs = brain.observe(
            prevB, currB, prevA, currA,
            aState, world, cursorNorm, bStateVec,
            false, priorityFlag, canTrain
          );
          // Phase 8: loss-explosion detection + anchor rollback.
          if (obs && obs.train && obs.train.loss != null) {
            instr.recordLoss(now, obs.train.loss);
            const rec = brain.stabilizer.recordLoss(obs.train.loss);
            if (rec.action === 'rollback') {
              const anchors = persist.getAnchors();
              if (anchors.length > 0 && anchors[0].snap) {
                const ok = brain.rollback(anchors[0].snap);
                if (ok) {
                  const anchor0 = anchors[0];
                  const anchorAgeMs = anchor0 && anchor0.at
                    ? Date.now() - anchor0.at : null;
                  instr.recordRollback({
                    at: Date.now(),
                    sigma: rec.sigma,
                    baseline: rec.baseline,
                    anchorAgeMs: anchorAgeMs,
                    count: brain.stabilizer.getRollbackCount()
                  });
                  console.warn(
                    '[Evrin] rollback: loss sigma=' + rec.sigma.toFixed(2)
                    + ' baseline=' + (rec.baseline != null ? rec.baseline.toFixed(4) : 'n/a')
                    + ' count=' + brain.stabilizer.getRollbackCount()
                  );
                  prevB = null; prevA = null; // force fresh transition pair
                }
              }
            }
          }
        }
        prevB = currB; prevA = currA;
      }

      // Phase 8 wall-clock schedules (cheap — ms comparisons only).
      const wallNow = Date.now();
      if (brain.stabilizer.maybeDecayLr(wallNow)) {
        brain.dqn.setLrMultiplier(brain.stabilizer.getLrMultiplier());
      }
      if (!mobile && brain.stabilizer.maybeRejuvenate(wallNow)) {
        brain.dqn.setEpsilon(brain.stabilizer.getRejuvEpsilon());
      }

      visual.update(dt, {
        x: kSt.x, y: kSt.y,
        vx: kSt.vx, vy: kSt.vy,
        bodyR: kSt.bodyR,
        heading: kSt.heading,
        mood: currentMood,
        stress: kSt.stress,
        cursorX: cursorX,
        cursorY: cursorY,
        cursorActive: aState.mouseActive
      });

      // Render on A's shared canvas. A's render() already called restore on
      // its scroll translate, so we re-apply it for document-coord drawing.
      ctx.save();
      ctx.translate(-world.scrollOx, -world.scrollOy);
      visual.render(ctx);
      ctx.restore();

      // Periodic persist (5 min default). beforeunload/visibilitychange
      // hooks registered by autoAttach() handle tail flushes.
      if (now - lastSaveAt > saveIntervalMs) {
        persist.save(brain, {
          frameCount: frameCount,
          decisionCount: decisionCount,
          mobile: mobile,
          restored: restored,
          rollbacks: brain.stabilizer.getRollbackCount(),
          lrMult: brain.stabilizer.getLrMultiplier()
        });
        lastSaveAt = now;
      }
    }

    function flushSave() {
      try { brain.flushShadowLog(); } catch (_e) {}
      return persist.save(brain, { decisionCount: decisionCount, mobile: mobile });
    }

    // Phase 9/10 — Export/import payload.
    // Shape: lili_b_export_v2 wraps the v1 brain snapshot + runtime telemetry +
    // persistence meta + session history. v1 payloads are still accepted on
    // import (they lack `history`, which is session-scoped anyway).
    function buildExportPayload() {
      const persistState = persist.load() || {};
      const anchors = persistState.anchors || [];
      const ratio = instr.getRatio();
      return {
        format: 'lili_b_export_v2',
        exportedAt: new Date().toISOString(),
        brain: brain.serialize(),
        runtime: {
          frameCount: frameCount,
          decisionCount: decisionCount,
          mobile: mobile,
          restored: restored,
          currentMood: currentMood,
          epsilon: brain.dqn.getEpsilon(),
          trainSteps: brain.dqn.getTrainSteps(),
          targetSyncs: brain.dqn.getTargetSyncs(),
          bufferSize: brain.dqn.getBufferSize(),
          rollbacks: brain.stabilizer.getRollbackCount(),
          lrMultiplier: brain.stabilizer.getLrMultiplier(),
          stabilizer: brain.stabilizer.getStats(),
          shadow: brain.getShadowStats(),
          novelty: brain.getNoveltyStats(),
          ratio: ratio
        },
        history: {
          schema: 'lili-b-history-v1',
          sessionStartWall: instr.getStats().startWall,
          loss: instr.getLossHistory(),
          rollbacks: instr.getRollbackLog()
        },
        persistence: {
          key: persist.key,
          firstSavedAt: persistState.firstSavedAt || null,
          savedAt: persistState.savedAt || null,
          lastAnchorAt: persistState.lastAnchorAt || null,
          lastExportAt: persistState.lastExportAt || null,
          anchorCount: anchors.length,
          anchorAges: anchors.map(function (a) { return a && a.at ? a.at : null; })
        }
      };
    }

    function downloadExport() {
      const payload = buildExportPayload();
      if (typeof document === 'undefined' || typeof Blob === 'undefined'
          || typeof URL === 'undefined' || !URL.createObjectURL) {
        return payload;
      }
      try {
        const blob = new Blob([JSON.stringify(payload, null, 2)],
          { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const d = new Date();
        const dateStr = d.getFullYear() +
          String(d.getMonth() + 1).padStart(2, '0') +
          String(d.getDate()).padStart(2, '0');
        a.href = url;
        a.download = 'lili_b_export_' + dateStr + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // Stamp lastExportAt so the next session won't trigger the monthly
        // reminder. Runtime-local cache mirrors the persisted value so
        // subsequent exportBrain() calls see it without a re-read.
        const exportWall = Date.now();
        lastExportAt = exportWall;
        try { persist.markExport(exportWall); } catch (_e) {}
        console.info('[Evrin] export: ' + payload.runtime.trainSteps
          + ' trainSteps, rollbacks=' + payload.runtime.rollbacks
          + ', anchors=' + payload.persistence.anchorCount
          + ', loss=' + payload.history.loss.v.length
          + ', ratio=' + payload.runtime.ratio.totalReal + 'R/'
          + payload.runtime.ratio.totalPhantom + 'P');
      } catch (_e) {}
      return payload;
    }

    // Accepts lili_b_export_v1 or v2 payloads and raw brain snapshots
    // (lili-b-brain-v1). Persists the restored weights so the next reload
    // keeps them — otherwise the periodic save would overwrite.
    function importBrain(obj) {
      if (!obj) return false;
      const snap = (obj.format === 'lili_b_export_v2' || obj.format === 'lili_b_export_v1')
                    ? obj.brain
                 : (obj.schema === 'lili-b-brain-v1') ? obj
                 : null;
      if (!snap) return false;
      const ok = brain.deserialize(snap);
      if (!ok) return false;
      prevB = null; prevA = null;
      try {
        persist.save(brain, {
          decisionCount: decisionCount,
          mobile: mobile,
          importedAt: Date.now()
        });
      } catch (_e) {}
      console.info('[Evrin] import: restored brain'
        + ' (trainSteps=' + brain.dqn.getTrainSteps()
        + ', rollbacks=' + brain.stabilizer.getRollbackCount() + ')');
      return true;
    }

    function pickImportFile() {
      if (typeof document === 'undefined' || typeof FileReader === 'undefined') return;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.style.display = 'none';
      input.addEventListener('change', function () {
        const f = input.files && input.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = function () {
          try {
            const obj = JSON.parse(String(reader.result));
            const ok = importBrain(obj);
            if (!ok) console.warn('[Evrin] import: bad format or dim mismatch');
          } catch (err) {
            console.error('[Evrin] import parse error:', err);
          }
        };
        reader.readAsText(f);
      });
      document.body.appendChild(input);
      input.click();
      // Defer removal so the change event has time to propagate in Safari.
      setTimeout(function () {
        try { document.body.removeChild(input); } catch (_e) {}
      }, 0);
    }

    // Shift+E / Shift+I keybinds. Gated on LiliA.isDevMode() so the Lili A
    // dev-mode chord (Ctrl+Shift+L) unlocks B's export too. Plain E/I remain
    // Lili A's (lili.js routes them only when shiftKey is false).
    let _keyHandler = null;
    function _isDevModeOn() {
      return !!(typeof window !== 'undefined'
        && window.LiliA
        && typeof window.LiliA.isDevMode === 'function'
        && window.LiliA.isDevMode());
    }
    if (typeof document !== 'undefined' && opts.bindKeys !== false) {
      _keyHandler = function (e) {
        if (!e.shiftKey) return;
        const tgt = e.target;
        if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA'
            || tgt.isContentEditable)) return;
        if (!_isDevModeOn()) return;
        const k = (e.key || '').toLowerCase();
        if (k === 'e') { e.preventDefault(); downloadExport(); }
        else if (k === 'i') { e.preventDefault(); pickImportFile(); }
      };
      document.addEventListener('keydown', _keyHandler);
    }

    function detach() {
      attached = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', onMouseMove);
      }
      if (_keyHandler && typeof document !== 'undefined') {
        document.removeEventListener('keydown', _keyHandler);
        _keyHandler = null;
      }
    }

    return {
      tick: tick,
      flushSave: flushSave,
      detach: detach,
      brain: brain,
      kin: kin,
      phantom: phantom,
      persist: persist,
      instr: instr,
      exportBrain: buildExportPayload,
      downloadExport: downloadExport,
      importBrain: importBrain,
      pickImportFile: pickImportFile,
      getStats: function () {
        return {
          frameCount: frameCount,
          decisionCount: decisionCount,
          mobile: mobile,
          restored: restored,
          epsilon: brain.dqn.getEpsilon(),
          bufferSize: brain.dqn.getBufferSize(),
          trainSteps: brain.dqn.getTrainSteps(),
          targetSyncs: brain.dqn.getTargetSyncs(),
          shadow: brain.getShadowStats(),
          novelty: brain.getNoveltyStats(),
          stabilizer: brain.stabilizer.getStats(),
          rollbacks: brain.stabilizer.getRollbackCount(),
          lrMultiplier: brain.stabilizer.getLrMultiplier(),
          instrumentation: instr.getStats(),
          lastExportAt: lastExportAt,
          currentMood: currentMood,
          body: kin.getState()
        };
      }
    };
  }

  // ============================================================
  // AUTO-ATTACH — wire a runtime to window.LiliA once both are ready.
  //
  // Polls for LiliA up to `timeoutMs` (default 10 s). Registers:
  //   - onAfterRender(tick) — per-frame hook
  //   - beforeunload → flushSave
  //   - visibilitychange hidden → flushSave
  //
  // Exposes the live runtime as window.LiliB.runtime once attached.
  // Bypass with window.__LILIB_NO_AUTO_ATTACH = true before script load.
  // ============================================================
  function autoAttach(opts) {
    opts = opts || {};
    const timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : 10000;
    const pollMs = 100;

    if (typeof window === 'undefined' || typeof document === 'undefined') return null;

    let runtime = null;
    const start = Date.now();

    function tryAttach() {
      if (runtime) return runtime;
      if (!window.LiliA || typeof window.LiliA.onAfterRender !== 'function') {
        if (Date.now() - start < timeoutMs) {
          setTimeout(tryAttach, pollMs);
        } else {
          console.warn('[Evrin] autoAttach: window.LiliA not found within '
            + timeoutMs + ' ms; Evrin inactive.');
        }
        return null;
      }
      try {
        runtime = createLiliBRuntime(opts);
      } catch (err) {
        console.error('[Evrin] runtime init failed:', err);
        return null;
      }
      window.LiliA.onAfterRender(runtime.tick);
      window.addEventListener('beforeunload', function () {
        try { runtime.flushSave(); } catch (_e) {}
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
          try { runtime.flushSave(); } catch (_e) {}
        }
      });
      window.LiliB.runtime = runtime;
      const st = runtime.getStats();
      console.info('[Evrin] attached: mobile=' + st.mobile + ' restored=' + st.restored
        + ' bufferSize=' + st.bufferSize);
      return runtime;
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      tryAttach();
    } else {
      document.addEventListener('DOMContentLoaded', tryAttach);
    }
    return { tryAttach: tryAttach };
  }

  // ============================================================
  // EXPORTS
  // ============================================================
  // Stub for test suite — real implementation is injected by
  // public/lili-b.tests.js (dev-only, not shipped to production).
  function runAllTests() {
    console.log('[Evrin] test suite not loaded. Include lili-b.tests.js in dev.');
    return false;
  }

  window.LiliB = {
    version: 'phase11-split',
    createNetwork: createNetwork,
    createReplayBuffer: createReplayBuffer,
    createDQN: createDQN,
    createPhantomGenerator: createPhantomGenerator,
    createLiliBBrain: createLiliBBrain,
    createStabilizer: createStabilizer,
    createNoveltyGrid: createNoveltyGrid,
    createShadowLogger: createShadowLogger,
    createLiliBKinematics: createLiliBKinematics,
    createLiliBVisual: createLiliBVisual,
    createPersistence: createPersistence,
    createInstrumentation: createInstrumentation,
    createLiliBRuntime: createLiliBRuntime,
    autoAttach: autoAttach,
    isMobileEnv: isMobileEnv,
    computeReward: computeReward,
    assembleState: assembleState,
    BRAIN: BRAIN,
    test: runAllTests,
    runtime: null,                 // populated by autoAttach once wired
    _internal: {
      // Helpers exposed for lili-b.tests.js; do not rely on in production.
      makeRng: makeRng,
      makeRandn: makeRandn,
      matVecMul: matVecMul,
      reluInPlace: reluInPlace,
      heInit: heInit,
      CFG: CFG
    }
  };

  console.log('[Evrin] ' + window.LiliB.version + ' loaded. Run LiliB.test() to verify.');

  // Auto-attach to Lili A on DOMContentLoaded unless caller opted out via
  // `window.__LILIB_NO_AUTO_ATTACH = true` before script load. Tests and
  // offline tooling can import LiliB without activating the runtime.
  if (typeof window !== 'undefined' && !window.__LILIB_NO_AUTO_ATTACH) {
    autoAttach();
  }
})();
