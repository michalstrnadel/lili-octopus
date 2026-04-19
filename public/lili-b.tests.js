/* Lili B — test suite (dev-only, extracted from lili-b.js in Phase 11).
 *
 * Loaded via <script src="lili-b.tests.js" defer> AFTER lili-b.js. Registers
 * LiliB.test as runAllTests and exposes individual tests on LiliB._internal.
 *
 * Production deploys (michalstrnadel.com) include lili-b.js only; this file
 * stays in the repo for local dev + CI regression checks.
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !window.LiliB) {
    // Runtime environment without LiliB — nothing to do. Keeps this file
    // safe to import in node without LiliB present (it won't register).
    return;
  }

  const LB = window.LiliB;
  const createNetwork        = LB.createNetwork;
  const createDQN            = LB.createDQN;
  const createPhantomGenerator = LB.createPhantomGenerator;
  const createLiliBBrain     = LB.createLiliBBrain;
  const createLiliBKinematics = LB.createLiliBKinematics;
  const createPersistence    = LB.createPersistence;
  const createInstrumentation = LB.createInstrumentation;
  const createLiliBRuntime   = LB.createLiliBRuntime;
  const createStabilizer     = LB.createStabilizer;
  const computeReward        = LB.computeReward;
  const BRAIN                = LB.BRAIN;
  const _I                   = LB._internal || {};
  const makeRng              = _I.makeRng;
  const CFG                  = _I.CFG;

  // Numerical vs. analytical gradient comparison on tiny net + MSE.
  // Float32 precision floor is ~1e-5; tolerance 1e-3 is standard for f32 gradcheck.
  function gradientCheck() {
    const net = createNetwork(3, [4], 2, 42);
    const rng = makeRng(7);
    const input  = new Float32Array([rng(), rng(), rng()]);
    const target = new Float32Array([rng(), rng()]);
    const dOut   = new Float32Array(2);

    function lossAt() {
      const out = net.forward(input);
      let L = 0;
      for (let i = 0; i < 2; i++) {
        const d = out[i] - target[i];
        L += 0.5 * d * d;
      }
      return L;
    }

    const out0 = net.forward(input);
    for (let i = 0; i < 2; i++) dOut[i] = out0[i] - target[i];
    net.backward(dOut);
    const analytical = new Float32Array(net.paramCount);
    analytical.set(net.grads);

    const eps = 1e-3;
    let maxAbsDiff = 0;
    let maxRelDiff = 0;
    for (let i = 0; i < net.paramCount; i++) {
      const orig = net.params[i];
      net.params[i] = orig + eps;  const lp = lossAt();
      net.params[i] = orig - eps;  const lm = lossAt();
      net.params[i] = orig;
      const num = (lp - lm) / (2 * eps);
      const ana = analytical[i];
      const absDiff = Math.abs(num - ana);
      const rel = absDiff / (Math.abs(num) + Math.abs(ana) + 1e-8);
      if (absDiff > maxAbsDiff) maxAbsDiff = absDiff;
      if (rel > maxRelDiff) maxRelDiff = rel;
    }

    const ok = maxAbsDiff < 1e-3;
    console.log(
      '[LiliB] gradientCheck: max |num - analytical| = ' +
      maxAbsDiff.toExponential(3) +
      ' (rel ' + maxRelDiff.toExponential(2) + ') — ' +
      (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function xorTest() {
    const net = createNetwork(2, [16], 1, 1337);
    const samples = [
      { x: [0, 0], y: 0 },
      { x: [0, 1], y: 1 },
      { x: [1, 0], y: 1 },
      { x: [1, 1], y: 0 }
    ];
    const xBuf = new Float32Array(2);
    const dBuf = new Float32Array(1);
    const maxSteps = 10000;

    for (let step = 0; step < maxSteps; step++) {
      const s = samples[step & 3];
      xBuf[0] = s.x[0]; xBuf[1] = s.x[1];
      const out = net.forward(xBuf);
      dBuf[0] = out[0] - s.y;
      net.backward(dBuf);
      net.clipGradients(CFG.gradClipMaxNorm);
      net.adamStep();
    }

    let totalErr = 0;
    for (let i = 0; i < 4; i++) {
      xBuf[0] = samples[i].x[0]; xBuf[1] = samples[i].x[1];
      const out = net.forward(xBuf);
      totalErr += Math.abs(out[0] - samples[i].y);
    }
    const avgErr = totalErr / 4;
    const ok = avgErr < 0.1;
    console.log(
      '[LiliB] xorTest: avg abs error after ' + maxSteps + ' steps = ' +
      avgErr.toFixed(4) + ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function gridWorldTest() {
    const n = 4;
    const stateDim = 2;
    const actionDim = 4;
    const maxEpisodeSteps = n * n;
    const numEpisodes = 1500;
    const optimalSteps = 2 * (n - 1);

    const dqn = createDQN({
      stateDim: stateDim,
      actionDim: actionDim,
      hiddenDims: [32, 32],
      bufferCapacity: 5000,
      batchSize: 32,
      gamma: 0.95,
      targetUpdateSteps: 100,
      epsilonStart: 1.0,
      epsilonMin: 0.05,
      epsilonDecay: 0.995,
      priorityFraction: 0.5,
      seed: 2024
    });

    const state     = new Float32Array(stateDim);
    const nextState = new Float32Array(stateDim);

    function encode(buf, x, y) {
      buf[0] = x / (n - 1);
      buf[1] = y / (n - 1);
    }

    function step(x, y, a) {
      let nx = x, ny = y;
      if      (a === 0) ny = y - 1;
      else if (a === 1) nx = x + 1;
      else if (a === 2) ny = y + 1;
      else if (a === 3) nx = x - 1;
      const bumped = nx < 0 || nx >= n || ny < 0 || ny >= n;
      if (bumped) { nx = x; ny = y; }
      return { x: nx, y: ny, bumped: bumped };
    }

    let trainedSteps = 0;
    for (let ep = 0; ep < numEpisodes; ep++) {
      let x = 0, y = 0;
      encode(state, x, y);
      for (let s = 0; s < maxEpisodeSteps; s++) {
        const a = dqn.chooseAction(state, false);
        const r = step(x, y, a);
        const atGoal = r.x === n - 1 && r.y === n - 1;
        let reward = atGoal ? 1.0 : -0.01;
        if (r.bumped) reward -= 0.1;
        encode(nextState, r.x, r.y);
        dqn.observe(state, a, reward, nextState, atGoal, 1);
        dqn.trainStep();
        trainedSteps++;
        x = r.x; y = r.y;
        encode(state, x, y);
        if (atGoal) break;
      }
      dqn.decayEpsilon();
    }

    let x = 0, y = 0;
    encode(state, x, y);
    let greedySteps = 0;
    let reachedGoal = false;
    const evalCap = maxEpisodeSteps * 2;
    for (let s = 0; s < evalCap; s++) {
      const a = dqn.chooseAction(state, true);
      const r = step(x, y, a);
      greedySteps++;
      x = r.x; y = r.y;
      encode(state, x, y);
      if (x === n - 1 && y === n - 1) { reachedGoal = true; break; }
    }

    const ok = reachedGoal && greedySteps <= optimalSteps * 2;
    console.log(
      '[LiliB] gridWorldTest: ' +
      'episodes=' + numEpisodes +
      ' envSteps=' + trainedSteps +
      ' trainSteps=' + dqn.getTrainSteps() +
      ' targetSyncs=' + dqn.getTargetSyncs() +
      ' finalEps=' + dqn.getEpsilon().toFixed(3) +
      ' → greedy reached=' + reachedGoal +
      ' in ' + greedySteps + ' steps (optimal=' + optimalSteps + ') — ' +
      (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function phantomTest() {
    const W = 1000, H = 800;
    let clock = 0;
    const gen = createPhantomGenerator({
      absenceMs: 30000,
      seed: 777,
      nowFn: function () { return clock; }
    });

    gen.notifyRealMouse(500, 400, clock);
    let stepOk = !gen.isPhantomMode();

    const dt = 0.016;
    const framesToAbsence = Math.ceil(30000 / 16) + 2;
    for (let i = 0; i < framesToAbsence; i++) {
      clock += 16;
      gen.update(dt, { W: W, H: H, now: clock });
    }
    const activated = gen.isPhantomMode();

    const framesRun = (20 / dt) | 0;
    let prev = gen.getCursor();
    let maxDelta = 0;
    let avgDelta = 0;
    let jumps = 0;
    let oob = 0;
    const liliA = { x: 300, y: 300 };
    const liliB = { x: 700, y: 500 };
    for (let i = 0; i < framesRun; i++) {
      clock += 16;
      gen.update(dt, { W: W, H: H, liliA: liliA, liliB: liliB, now: clock });
      const c = gen.getCursor();
      if (c.x < 0 || c.x > W || c.y < 0 || c.y > H) oob++;
      const dx = c.x - prev.x;
      const dy = c.y - prev.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      avgDelta += d;
      if (d > maxDelta) maxDelta = d;
      if (d > 100) jumps++;
      if (!c.isPhantom || c.priority !== 0) stepOk = false;
      prev = c;
    }
    avgDelta /= framesRun;

    gen.notifyRealMouse(450, 400, clock);
    const exited = !gen.isPhantomMode() && gen.getCursor().priority === 1;

    const boundsOk = oob === 0;
    const jumpsOk  = jumps <= 5;
    const smoothOk = avgDelta < 30;
    const ok = stepOk && activated && boundsOk && jumpsOk && smoothOk && exited;

    console.log(
      '[LiliB] phantomTest: ' +
      'activated=' + activated +
      ' oob=' + oob +
      ' jumps=' + jumps +
      ' avgDelta=' + avgDelta.toFixed(2) +
      ' maxDelta=' + maxDelta.toFixed(1) +
      ' exited=' + exited +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function brainInterfaceTest() {
    const brain = createLiliBBrain({ seed: 42, shadowKey: 'lili_a_shadow_reward_log__test' });
    brain.resetShadowLog();

    const rng = makeRng(7);

    const aState = {
      xn: 0.5, yn: 0.5, vx: 0, vy: 0, stress: 0.2,
      moodIndex: 0, phaseIndex: 1, phaseProgress: 0.3,
      mouseActive: false, mouseX: 500, mouseY: 400, mouseSpeed: 0,
      bodyR: 30, frameCount: 0, paused: false
    };
    const aWorld = { W: 1000, H: 800, dpr: 1, docW: 1000, docH: 800, scrollOx: 0, scrollOy: 0 };
    const cursor = { xn: 0.5, yn: 0.5, speed: 0, isPhantom: 1 };
    const bState = { xn: 0.3, yn: 0.3, vxNorm: 0, vyNorm: 0, stress: 0.0 };

    let prevB = { xn: bState.xn, yn: bState.yn, speed: 0, stress: bState.stress };
    let prevA = { xn: aState.xn, yn: aState.yn, speed: 0, stress: aState.stress };

    let totalReward = 0;
    let actionRangeOk = true;
    let shadowSeen = 0;
    const n = 200;

    for (let i = 0; i < n; i++) {
      bState.xn = Math.max(0.01, Math.min(0.99, bState.xn + (rng() - 0.5) * 0.05));
      bState.yn = Math.max(0.01, Math.min(0.99, bState.yn + (rng() - 0.5) * 0.05));
      bState.vxNorm = (rng() - 0.5) * 0.3;
      bState.vyNorm = (rng() - 0.5) * 0.3;
      aState.xn = Math.max(0.01, Math.min(0.99, aState.xn + (rng() - 0.5) * 0.03));
      aState.yn = Math.max(0.01, Math.min(0.99, aState.yn + (rng() - 0.5) * 0.03));
      aState.moodIndex = (rng() * 7) | 0;

      const action = brain.chooseAction(aState, aWorld, cursor, bState, false);
      if (action < 0 || action >= BRAIN.ACTION_DIM) actionRangeOk = false;

      const currB = {
        xn: bState.xn, yn: bState.yn,
        speed: Math.sqrt(bState.vxNorm * bState.vxNorm + bState.vyNorm * bState.vyNorm),
        stress: bState.stress
      };
      const currA = { xn: aState.xn, yn: aState.yn, speed: 0.05, stress: aState.stress };

      const result = brain.observe(
        prevB, currB, prevA, currA,
        aState, aWorld, cursor, bState,
        false, cursor.isPhantom ? 0 : 1, true
      );
      totalReward += result.reward.total;
      if (result.shadow) shadowSeen++;

      prevB = currB; prevA = currA;
    }

    const shadowStats = brain.getShadowStats();

    const snap = brain.serialize();
    const brain2 = createLiliBBrain({ seed: 99, shadowKey: 'lili_a_shadow_reward_log__test2' });
    const restored = brain2.deserialize(snap);
    const a1 = brain.chooseAction(aState, aWorld, cursor, bState, true);
    const a2 = brain2.chooseAction(aState, aWorld, cursor, bState, true);
    const serializeOk = restored && a1 === a2;

    const p = { xn: 0.2, yn: 0.2, speed: 0.1, stress: 0.3 };
    const c = { xn: 0.3, yn: 0.3, speed: 0.08, stress: 0.25 };
    const o = { xn: 0.4, yn: 0.4, present: true };
    const r1 = computeReward(p, c, o, null, 2, 0.03).total;
    const r2 = computeReward(p, c, o, null, 2, 0.03).total;
    const pureOk = r1 === r2;

    brain.resetShadowLog();
    brain2.resetShadowLog();

    const ok = actionRangeOk && serializeOk && pureOk &&
               shadowSeen === n && shadowStats.steps === n;

    console.log(
      '[LiliB] brainInterfaceTest: ' +
      'steps=' + n +
      ' totalReward=' + totalReward.toFixed(3) +
      ' avgR=' + (totalReward / n).toFixed(4) +
      ' actionRange=' + actionRangeOk +
      ' shadow=' + shadowStats.steps + '/' + n +
      ' avgShadow=' + shadowStats.avgReward.toFixed(4) +
      ' serialize=' + serializeOk +
      ' pure=' + pureOk +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function kinematicsTest() {
    const kin = createLiliBKinematics({ seed: 123 });
    const W = 1200, H = 800;
    const dt = 1 / 60;
    const steps = 600;
    const margin = 30;

    let inBounds = true, stressOk = true, moved = 0;
    let prevX = 0, prevY = 0;
    const aPos = { x: W * 0.5, y: H * 0.5 };
    const cursor = { x: W * 0.3, y: H * 0.3 };

    for (let i = 0; i < steps; i++) {
      const mood = (i / 86) | 0;
      kin.update(dt, {
        aPos: aPos,
        cursor: cursor,
        world: { docW: W, docH: H },
        bodyR: 20,
        mood: mood > 6 ? 6 : mood
      });
      const s = kin.getState();
      if (s.x < margin - 1 || s.x > W - margin + 1) inBounds = false;
      if (s.y < margin - 1 || s.y > H - margin + 1) inBounds = false;
      if (s.stress < 0 || s.stress > 1.0001) stressOk = false;
      if (i > 0) moved += Math.abs(s.x - prevX) + Math.abs(s.y - prevY);
      prevX = s.x; prevY = s.y;
    }

    const ok = inBounds && stressOk && moved > 100;
    console.log(
      '[LiliB] kinematicsTest: ' +
      'bounds=' + inBounds +
      ' stressOk=' + stressOk +
      ' totalMotion=' + moved.toFixed(0) +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function persistenceTest() {
    const testKey = 'lili_b_weights__test_' + (Date.now() & 0xffff);
    const persist = createPersistence(testKey, 0, 3);
    persist.clear();

    const initial = persist.load();
    const freshOk = initial === null;

    const brainA = createLiliBBrain({ seed: 2026 });
    for (let i = 0; i < 5; i++) brainA.endEpisode();

    const saved1 = persist.save(brainA, { note: 'first' });

    const brainB = createLiliBBrain({ seed: 99 });
    const restoredOk = persist.restore(brainB);

    const aState = {
      xn: 0.4, yn: 0.6, vx: 0, vy: 0, stress: 0.1,
      moodIndex: 2, phaseIndex: 1, phaseProgress: 0.5,
      mouseActive: false, mouseX: 0, mouseY: 0, mouseSpeed: 0,
      bodyR: 20, frameCount: 0, paused: false
    };
    const aWorld = { W: 1000, H: 800, dpr: 1, docW: 1000, docH: 800, scrollOx: 0, scrollOy: 0 };
    const cursor = { xn: 0.5, yn: 0.5, speed: 0, isPhantom: 0 };
    const bState = { xn: 0.7, yn: 0.3, vxNorm: 0, vyNorm: 0, stress: 0 };
    const a1 = brainA.chooseAction(aState, aWorld, cursor, bState, true);
    const a2 = brainB.chooseAction(aState, aWorld, cursor, bState, true);
    const greedyMatch = a1 === a2;

    const saved2 = persist.save(brainA, { note: 'second' });
    const anchors = persist.getAnchors();
    const anchoredOk = anchors.length >= 1;

    persist.clear();

    const ok = freshOk && saved1 && restoredOk && greedyMatch && saved2 && anchoredOk;
    console.log(
      '[LiliB] persistenceTest: ' +
      'freshNull=' + freshOk +
      ' save1=' + saved1 +
      ' restore=' + restoredOk +
      ' greedyMatch=' + greedyMatch +
      ' save2=' + saved2 +
      ' anchors=' + anchors.length +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function runtimeTest() {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('[LiliB] runtimeTest: SKIPPED (no DOM env)');
      return true;
    }

    const prevLiliA = window.LiliA;
    const prevRuntime = window.LiliB && window.LiliB.runtime;

    const W = 1024, H = 768;
    let drawCalls = 0;
    const stubCtx = {
      save: function () {}, restore: function () {}, translate: function () {},
      beginPath: function () { drawCalls++; },
      arc: function () {}, ellipse: function () {}, moveTo: function () {},
      quadraticCurveTo: function () {}, fill: function () {}, stroke: function () {},
      set fillStyle(v) {}, set strokeStyle(v) {}, set lineWidth(v) {},
      set lineCap(v) {}, set globalAlpha(v) {}
    };
    const hooks = [];
    window.LiliA = {
      version: 'stub',
      getState: function () {
        return {
          x: W * 0.5, y: H * 0.5, xn: 0.5, yn: 0.5,
          vx: 0, vy: 0, speed: 0, stress: 0, moodIndex: 0,
          moodCount: 7, ageT: 1, phaseIndex: 1, phaseProgress: 0.2,
          mouseActive: false, mouseX: 0, mouseY: 0, mouseSpeed: 0,
          bodyR: 18, frameCount: 0, paused: false
        };
      },
      getWorld: function () {
        return { W: W, H: H, dpr: 1, docW: W, docH: H, scrollOx: 0, scrollOy: 0 };
      },
      getCanvas: function () { return null; },
      getCtx: function () { return stubCtx; },
      onAfterRender: function (fn) { hooks.push(fn); },
      offAfterRender: function (fn) {
        const i = hooks.indexOf(fn); if (i >= 0) hooks.splice(i, 1);
      }
    };

    const testKey = 'lili_b_weights__runtime_test_' + (Date.now() & 0xffff);
    let runtime = null, threw = false;
    try {
      runtime = createLiliBRuntime({
        persistKey: testKey,
        forceMobile: false,
        decisionFrames: 10,
        saveIntervalMs: 1e12
      });
      window.LiliA.onAfterRender(runtime.tick);
      for (let i = 0; i < 400; i++) {
        hooks[0](stubCtx);
      }
    } catch (_err) { threw = true; }

    const stats = runtime ? runtime.getStats() : null;
    const flushed = runtime ? runtime.flushSave() : false;
    if (runtime) runtime.detach();
    try { localStorage.removeItem(testKey); } catch (_e) {}

    window.LiliA = prevLiliA;
    if (window.LiliB) window.LiliB.runtime = prevRuntime;

    const ok = !threw && stats && stats.frameCount >= 400
             && stats.decisionCount >= 1 && drawCalls > 0 && flushed;
    console.log(
      '[LiliB] runtimeTest: ' +
      'threw=' + threw +
      ' frames=' + (stats && stats.frameCount) +
      ' decisions=' + (stats && stats.decisionCount) +
      ' drawCalls=' + drawCalls +
      ' flushed=' + flushed +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function persistenceHardenTest() {
    const testKey = 'lili_b_weights__harden_' + (Date.now() & 0xffff);
    const persist = createPersistence(testKey, 0, 3);
    persist.clear();

    let corruptOk = false;
    try {
      localStorage.setItem(testKey, '{not-json');
      corruptOk = persist.load() === null;
    } catch (_e) {}
    persist.clear();

    localStorage.setItem(testKey, JSON.stringify({
      schema: 'some-other-schema', current: { foo: 1 }
    }));
    const badSchemaOk = persist.load() === null;
    persist.clear();

    const brain = createLiliBBrain({ seed: 77 });
    for (let i = 0; i < 6; i++) persist.save(brain, { n: i });
    const anchors = persist.getAnchors();
    const capOk = anchors.length === 3;
    persist.clear();

    const ok = corruptOk && badSchemaOk && capOk;
    console.log(
      '[LiliB] persistenceHardenTest: ' +
      'corrupt=' + corruptOk +
      ' badSchema=' + badSchemaOk +
      ' maxAnchors=' + anchors.length + '/3' +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function stabilizerTest() {
    const stab = createStabilizer({
      explosionSigma: 5.0,
      driftSigma: 3.0,
      minSamplesBeforeRollback: 20,
      emaAlpha: 0.05,
      lrDecayIntervalMs: 1000,
      lrDecayFactor: 0.9,
      lrFloor: 1e-5,
      baseLr: 0.001,
      rejuvIntervalMs: 1000,
      rejuvEpsilon: 0.3,
      now: 1_000_000_000
    });

    const boot = stab.recordLoss(0.5);
    const bootOk = boot.action === 'bootstrap';

    let stableOk = true;
    const seedRng = makeRng(42);
    for (let i = 0; i < 40; i++) {
      const noise = (seedRng() - 0.5) * 0.02;
      const r = stab.recordLoss(0.5 + noise);
      if (r.action === 'rollback') { stableOk = false; break; }
    }
    const stats = stab.getStats();
    const baselineOk = Math.abs(stats.lossEMA - 0.5) < 0.05;

    const spike = stab.recordLoss(50.0);
    const spikeOk = spike.action === 'rollback' && spike.sigma > 5;

    const preDecayOk = stab.maybeDecayLr(1_000_000_500) === false;
    const postDecayOk = stab.maybeDecayLr(1_000_001_001) === true;
    const lrAfterOne = stab.getLrMultiplier();
    const lrDecayOk = Math.abs(lrAfterOne - 0.9) < 1e-6;

    const preRejuvOk = stab.maybeRejuvenate(1_000_000_500) === false;
    const postRejuvOk = stab.maybeRejuvenate(1_000_001_001) === true;

    let t = 1_000_001_001;
    for (let i = 0; i < 500; i++) { t += 1001; stab.maybeDecayLr(t); }
    const floorRatio = 1e-5 / 0.001;
    const floorOk = Math.abs(stab.getLrMultiplier() - floorRatio) < 1e-9;

    const snap = stab.serialize();
    const stab2 = createStabilizer({ baseLr: 0.001 });
    const deOk = stab2.deserialize(snap);
    const roundtripOk = deOk
      && Math.abs(stab2.getLrMultiplier() - stab.getLrMultiplier()) < 1e-9
      && stab2.getRollbackCount() === stab.getRollbackCount();

    const beforeCount = stab.getRollbackCount();
    stab.onRollback();
    const afterCount = stab.getRollbackCount();
    const resetOk = stab.getStats().lossSamples === 0 && afterCount === beforeCount + 1;

    const ok = bootOk && stableOk && baselineOk && spikeOk
            && preDecayOk && postDecayOk && lrDecayOk
            && preRejuvOk && postRejuvOk && floorOk
            && roundtripOk && resetOk;

    console.log(
      '[LiliB] stabilizerTest: ' +
      'bootstrap=' + bootOk +
      ' stable=' + stableOk +
      ' baseline=' + baselineOk +
      ' spike=' + spikeOk + '(σ=' + spike.sigma.toFixed(1) + ')' +
      ' lrDecay=' + lrDecayOk + '(' + lrAfterOne.toFixed(3) + ')' +
      ' floor=' + floorOk +
      ' rejuv=' + postRejuvOk +
      ' roundtrip=' + roundtripOk +
      ' reset=' + resetOk +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function rollbackTest() {
    const brain = createLiliBBrain({ seed: 314 });

    const stateDim = brain.dqn.stateDim;
    const s  = new Float32Array(stateDim);
    const sp = new Float32Array(stateDim);
    const rng = makeRng(99);
    for (let i = 0; i < 200; i++) {
      for (let k = 0; k < stateDim; k++) { s[k] = rng(); sp[k] = rng(); }
      brain.dqn.observe(s, (rng() * brain.dqn.actionDim) | 0, rng() * 0.5, sp, 0, 1);
    }
    for (let step = 0; step < 5; step++) brain.dqn.trainStep();

    const anchorSnap = brain.serialize();
    const anchorWeights = new Float32Array(anchorSnap.weights);

    const params = brain.dqn.online.params;
    for (let i = 0; i < params.length; i++) params[i] += (rng() - 0.5) * 10;
    for (let i = 0; i < 50; i++) {
      for (let k = 0; k < stateDim; k++) { s[k] = rng(); sp[k] = rng(); }
      brain.dqn.observe(s, 0, 0, sp, 0, 1);
    }
    brain.dqn.setEpsilon(0.05);
    const preBufferSize = brain.dqn.getBufferSize();
    const preRollbackCount = brain.stabilizer.getRollbackCount();

    const ok1 = brain.rollback(anchorSnap);

    let maxDiff = 0;
    for (let i = 0; i < params.length; i++) {
      const d = Math.abs(params[i] - anchorWeights[i]);
      if (d > maxDiff) maxDiff = d;
    }
    const weightsOk = maxDiff < 1e-5;
    const bufferOk = brain.dqn.getBufferSize() === 0;
    const epsOk = Math.abs(brain.dqn.getEpsilon() - 0.3) < 1e-6;
    const countOk = brain.stabilizer.getRollbackCount() === preRollbackCount + 1;
    const lossResetOk = brain.stabilizer.getStats().lossSamples === 0;

    const ok = ok1 && weightsOk && bufferOk && epsOk && countOk && lossResetOk
            && preBufferSize > 0;

    console.log(
      '[LiliB] rollbackTest: ' +
      'applied=' + ok1 +
      ' weightsRestored=' + weightsOk + '(maxΔ=' + maxDiff.toExponential(2) + ')' +
      ' bufferFlushed=' + bufferOk + '(' + preBufferSize + '→0)' +
      ' epsBumped=' + epsOk + '(→' + brain.dqn.getEpsilon().toFixed(3) + ')' +
      ' count=' + countOk +
      ' lossReset=' + lossResetOk +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function exportImportTest() {
    if (typeof window === 'undefined') {
      console.log('[LiliB] exportImportTest: SKIPPED (no window env)');
      return true;
    }

    const keyA = 'lili_b_weights__export_test_a_' + (Date.now() & 0xffff);
    const keyB = 'lili_b_weights__export_test_b_' + (Date.now() & 0xffff);

    const prevLiliA = window.LiliA;
    if (!window.LiliA) window.LiliA = { isDevMode: function () { return false; } };

    const runtimeA = createLiliBRuntime({
      seed: 101, persistKey: keyA, forceMobile: false,
      decisionFrames: 10, saveIntervalMs: 1e12, bindKeys: false
    });

    const stateDim = runtimeA.brain.dqn.stateDim;
    const s  = new Float32Array(stateDim);
    const sp = new Float32Array(stateDim);
    const rng = makeRng(501);
    for (let i = 0; i < 200; i++) {
      for (let k = 0; k < stateDim; k++) { s[k] = rng(); sp[k] = rng(); }
      runtimeA.brain.dqn.observe(s, (rng() * runtimeA.brain.dqn.actionDim) | 0,
        rng() * 0.5, sp, 0, 1);
    }
    for (let step = 0; step < 10; step++) runtimeA.brain.dqn.trainStep();

    const payload = runtimeA.exportBrain();
    const formatOk = payload && payload.format === 'lili_b_export_v2';
    const hasBrain = payload && payload.brain && payload.brain.schema === 'lili-b-brain-v1';
    const hasTelem = payload && payload.runtime
      && typeof payload.runtime.trainSteps === 'number'
      && typeof payload.runtime.epsilon === 'number'
      && typeof payload.runtime.rollbacks === 'number'
      && payload.runtime.stabilizer != null
      && payload.runtime.ratio != null
      && typeof payload.runtime.ratio.totalReal === 'number'
      && typeof payload.runtime.ratio.totalPhantom === 'number';
    const hasHistory = payload && payload.history
      && payload.history.schema === 'lili-b-history-v1'
      && payload.history.loss && Array.isArray(payload.history.loss.t)
      && Array.isArray(payload.history.loss.v)
      && payload.history.loss.t.length === payload.history.loss.v.length
      && Array.isArray(payload.history.rollbacks);
    const hasPersistMeta = payload && payload.persistence
      && payload.persistence.key === keyA
      && typeof payload.persistence.anchorCount === 'number';

    let roundTripOk = false;
    let parsed = null;
    try {
      parsed = JSON.parse(JSON.stringify(payload));
      roundTripOk = parsed.format === 'lili_b_export_v2';
    } catch (_e) {}

    const runtimeB = createLiliBRuntime({
      seed: 999, persistKey: keyB, forceMobile: false,
      decisionFrames: 10, saveIntervalMs: 1e12, bindKeys: false
    });

    const paramsA = runtimeA.brain.dqn.online.params;
    const paramsB = runtimeB.brain.dqn.online.params;
    let preMaxDiff = 0;
    for (let i = 0; i < paramsA.length; i++) {
      const d = Math.abs(paramsA[i] - paramsB[i]);
      if (d > preMaxDiff) preMaxDiff = d;
    }
    const weightsDifferedBefore = preMaxDiff > 1e-6;

    const importOk = runtimeB.importBrain(parsed);
    let postMaxDiff = 0;
    for (let i = 0; i < paramsA.length; i++) {
      const d = Math.abs(paramsA[i] - paramsB[i]);
      if (d > postMaxDiff) postMaxDiff = d;
    }
    const weightsMatchAfter = postMaxDiff < 1e-6;

    const beforeBadWeights = new Float32Array(paramsB);
    const rejectedJunk = runtimeB.importBrain({ format: 'wrong', brain: { schema: 'nope' } });
    let badDrift = 0;
    for (let i = 0; i < paramsB.length; i++) {
      const d = Math.abs(paramsB[i] - beforeBadWeights[i]);
      if (d > badDrift) badDrift = d;
    }
    const rejectOk = (rejectedJunk === false) && (badDrift === 0);

    const rawSnap = runtimeA.brain.serialize();
    const rawOk = runtimeB.importBrain(rawSnap);

    runtimeA.detach();
    runtimeB.detach();
    try { localStorage.removeItem(keyA); } catch (_e) {}
    try { localStorage.removeItem(keyB); } catch (_e) {}
    window.LiliA = prevLiliA;

    const ok = formatOk && hasBrain && hasTelem && hasHistory && hasPersistMeta
            && roundTripOk && weightsDifferedBefore && importOk
            && weightsMatchAfter && rejectOk && rawOk;

    console.log(
      '[LiliB] exportImportTest: ' +
      'format=' + formatOk +
      ' brain=' + hasBrain +
      ' telem=' + hasTelem +
      ' history=' + hasHistory +
      ' persistMeta=' + hasPersistMeta +
      ' roundTrip=' + roundTripOk +
      ' preΔ=' + preMaxDiff.toExponential(2) +
      ' postΔ=' + postMaxDiff.toExponential(2) +
      ' rejectBad=' + rejectOk +
      ' rawSnap=' + rawOk +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function instrumentationTest() {
    const a = createInstrumentation({ lossCap: 4, now: 1000 });
    a.recordLoss(1100, 0.5);
    a.recordLoss(1200, 0.4);
    a.recordLoss(1300, 0.3);
    a.recordLoss(1400, 0.2);
    a.recordLoss(1500, 0.1);
    a.recordLoss(1600, 0.05);
    const hist = a.getLossHistory();
    const lossWrapOk = hist.t.length === 4
      && hist.v.length === 4
      && Math.abs(hist.v[0] - 0.3) < 1e-6
      && Math.abs(hist.v[3] - 0.05) < 1e-6
      && hist.t[0] < hist.t[3];

    const statsBeforeBadLoss = a.getStats().lossCount;
    a.recordLoss(1700, NaN);
    a.recordLoss(1800, Infinity);
    const nanRejectOk = a.getStats().lossCount === statsBeforeBadLoss;

    const b = createInstrumentation({ ratioWindow: 4 });
    b.recordDecision(false); b.recordDecision(false);
    b.recordDecision(true);  b.recordDecision(true);
    let r = b.getRatio();
    const ratioPhase1Ok = r.totalReal === 2 && r.totalPhantom === 2
      && r.recentReal === 2 && r.recentPhantom === 2 && r.windowSize === 4;
    b.recordDecision(false); b.recordDecision(false);
    r = b.getRatio();
    const ratioEvictOk = r.totalReal === 4 && r.totalPhantom === 2
      && r.recentReal === 2 && r.recentPhantom === 2 && r.windowSize === 4;

    const c = createInstrumentation({ rollbackCap: 2 });
    c.recordRollback({ at: 1, sigma: 5.1, baseline: 0.01, anchorAgeMs: 1e6, count: 1 });
    c.recordRollback({ at: 2, sigma: 6.0, baseline: 0.02, anchorAgeMs: 2e6, count: 2 });
    c.recordRollback({ at: 3, sigma: 7.0, baseline: 0.03, anchorAgeMs: 3e6, count: 3 });
    const log = c.getRollbackLog();
    const rollbackCapOk = log.length === 2
      && log[0].count === 2 && log[1].count === 3
      && Math.abs(log[1].sigma - 7.0) < 1e-6;

    let markOk = false;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const key = 'lili_b_weights__instr_test_' + (Date.now() & 0xffff);
      localStorage.setItem(key, JSON.stringify({
        schema: 'lili-b-persist-v1',
        savedAt: 111, firstSavedAt: 111, lastAnchorAt: 111,
        meta: {}, current: null, anchors: []
      }));
      const pp = createPersistence(key);
      const stamp = 123456;
      const wroteOk = pp.markExport(stamp);
      const reloaded = pp.load();
      markOk = wroteOk === true && reloaded != null && reloaded.lastExportAt === stamp;
      try { localStorage.removeItem(key); } catch (_e) {}
    } else {
      markOk = true;
    }

    let reminderFired = false, reminderSuppressed = true;
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const key = 'lili_b_weights__reminder_test_' + (Date.now() & 0xffff);
      const veryOld = Date.now() - 60 * 24 * 3600 * 1000;
      localStorage.setItem(key, JSON.stringify({
        schema: 'lili-b-persist-v1',
        savedAt: veryOld, firstSavedAt: veryOld, lastAnchorAt: veryOld,
        lastExportAt: null, meta: {}, current: null, anchors: []
      }));
      const origInfo = console.info;
      const spy = function () {
        const msg = String(arguments[0] || '');
        if (msg.indexOf('export reminder') !== -1) reminderFired = true;
        return origInfo.apply(console, arguments);
      };

      const prevLiliA = window.LiliA;
      if (!window.LiliA) window.LiliA = { isDevMode: function () { return false; } };

      console.info = spy;
      const rt1 = createLiliBRuntime({
        seed: 77, persistKey: key, forceMobile: false,
        saveIntervalMs: 1e12, bindKeys: false
      });
      rt1.detach();
      console.info = origInfo;

      let suppressedFired = false;
      const spy2 = function () {
        const msg = String(arguments[0] || '');
        if (msg.indexOf('export reminder') !== -1) suppressedFired = true;
        return origInfo.apply(console, arguments);
      };
      console.info = spy2;
      const rt2 = createLiliBRuntime({
        seed: 78, persistKey: key, forceMobile: false,
        saveIntervalMs: 1e12, bindKeys: false, suppressReminder: true
      });
      rt2.detach();
      console.info = origInfo;
      reminderSuppressed = suppressedFired === false;

      try { localStorage.removeItem(key); } catch (_e) {}
      window.LiliA = prevLiliA;
    }

    const ok = lossWrapOk && nanRejectOk && ratioPhase1Ok && ratioEvictOk
            && rollbackCapOk && markOk && reminderFired && reminderSuppressed;
    console.log(
      '[LiliB] instrumentationTest: ' +
      'lossWrap=' + lossWrapOk +
      ' nanReject=' + nanRejectOk +
      ' ratio1=' + ratioPhase1Ok +
      ' ratioEvict=' + ratioEvictOk +
      ' rollbackCap=' + rollbackCapOk +
      ' markExport=' + markOk +
      ' reminderFired=' + reminderFired +
      ' reminderSuppressed=' + reminderSuppressed +
      ' — ' + (ok ? 'PASS' : 'FAIL')
    );
    return ok;
  }

  function runAllTests() {
    console.log('[LiliB] tests starting…');
    const a = gradientCheck();
    const b = xorTest();
    const c = gridWorldTest();
    const d = phantomTest();
    const e = brainInterfaceTest();
    const f = kinematicsTest();
    const g = persistenceTest();
    const gh = persistenceHardenTest();
    const h = runtimeTest();
    const i = stabilizerTest();
    const j = rollbackTest();
    const k = exportImportTest();
    const l = instrumentationTest();
    const ok = a && b && c && d && e && f && g && gh && h && i && j && k && l;
    console.log('[LiliB] tests: ' + (ok ? 'ALL PASS ✓' : 'FAIL ✗'));
    return ok;
  }

  // Register into LiliB surface. Overwrites the stub left by lili-b.js.
  LB.test = runAllTests;
  if (!LB._internal) LB._internal = {};
  LB._internal.gradientCheck        = gradientCheck;
  LB._internal.xorTest              = xorTest;
  LB._internal.gridWorldTest        = gridWorldTest;
  LB._internal.phantomTest          = phantomTest;
  LB._internal.brainInterfaceTest   = brainInterfaceTest;
  LB._internal.kinematicsTest       = kinematicsTest;
  LB._internal.persistenceTest      = persistenceTest;
  LB._internal.persistenceHardenTest = persistenceHardenTest;
  LB._internal.runtimeTest          = runtimeTest;
  LB._internal.stabilizerTest       = stabilizerTest;
  LB._internal.rollbackTest         = rollbackTest;
  LB._internal.exportImportTest     = exportImportTest;
  LB._internal.instrumentationTest  = instrumentationTest;
})();
