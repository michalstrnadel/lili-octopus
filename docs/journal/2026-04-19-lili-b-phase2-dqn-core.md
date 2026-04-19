# Lili B — Phase 2: DQN Core

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 2 / 10
**Status:** hotovo ✓

## Kontext

Po úspěšné Fázi 1 (NN foundation) pokračuje implementace DQN core smyčkou podle
briefu v `docs/IMPLEMENTATION_PLAN_LILI_B.md` sekce 9 a 10 (bod 1, 2, 6).

Stále self-contained modul v `public/lili-b.js` — žádná integrace s `lili.js`,
žádný canvas, žádný phantom generator, žádná stabilizační sada (ta přijde v
pozdější fázi jako celek).

## Rozsah Fáze 2

Implementovat minimální funkční DQN: replay buffer, target network, ε-greedy,
TD(0) Bellman update, batch training. Validace na toy prostředí (grid-world).

### Scope

1. Replay buffer — circular Float32Array, schema `[s, a, r, s', done, priority]`
2. Target network — druhá instance stejné NN, hard sync každých 100 kroků
3. ε-greedy action selection + decay schedule
4. Bellman TD target: `y = r + γ · (1-done) · max Q_target(s')`
5. Minibatch training (batch=32) s akumulací gradientů
6. Grid-world convergence test (4×4, konvergence na optimum)

### Co **není** v této fázi

- ❌ Prioritized experience replay (flag v bufferu je, ale sampling weighted
  je součástí Fáze pro phantom stimuli)
- ❌ Anchor snapshots / rollback (Fáze stabilizace)
- ❌ Loss explosion detector (Fáze stabilizace)
- ❌ Lr schedule / ε re-juvenilizace (Fáze stabilizace)
- ❌ State vector napojený na `lili.js` — toy prostředí má vlastní state
- ❌ Phantom stimuli generator

## Design decisions

### Replay buffer jako jediný souvislý Float32Array

Per-entry layout `[state | action | reward | nextState | done | priority]`
(celkem `2·stateDim + 4` float32 per entry). Circular index (`head`, `size`),
žádné Array.push, žádná alokace po inicializaci.

Priority flag (1=real, 0=phantom) už je v bufferu — připravené pro Fázi 4
(phantom stimuli). Sampling používá jednoduchou dvoufázovou strategii: nejdřív
`floor(batchSize · priorityFraction)` samples z priority=1 indexu (pokud
existují), zbytek uniform random.

**Pomocné struktury:**
- `priorityIndex: Int32Array(capacity)` — kompaktní seznam indexů priority=1
- `inPriority: Uint8Array(capacity)` — rychlý lookup při overwrite

Při overwrite priority=1 slotu se efektivně vypustí z `priorityIndex` přes
swap-with-last. O(1) push, O(priorityCount) worst-case overwrite — akceptovatelné
u 50k bufferu.

### Akumulace gradientů přes minibatch

Fáze 1 měla `backward(dOutput)` které na začátku zero-uje `grads`. Pro batch
training potřebujeme akumulovat gradienty přes celý batch a pak udělat jeden
Adam krok.

**Řešení:** přidán optional druhý argument `backward(dOutput, zeroFirst)`.
Default `zeroFirst !== false` ⇒ true ⇒ zachovává Fáze 1 chování. DQN
`trainStep()` volá `backward(dOut, b === 0)` — zero-uje jen první sample,
zbytek accumuluje.

Alternativa byla separátní `backwardAccumulate()` ale tím by se duplikoval
veškerý loop kód. Flag je minimální change.

### Pre-allokace batch bufferů v `createDQN()`

`batchStates`, `batchNextStates`, `batchActions`, `batchRewards`, `batchDones`,
`tdTargets`, `scratchState`, `dOut` — všechno alokováno jednou při init.
`trainStep()`, `chooseAction()`, `observe()` → zero allocations.

Při 60 FPS a `batchSize=32` by jinak šlo o ~32×6 = 192 alokací/frame → GC
jitter viditelný v rAF loopu.

### Target network sync přes `copyParamsFrom()`

Hard update. `target.params.set(online.params)` — jediné volání pro celý flat
param layout. Každých 100 training steps (ne 100 env steps — rozdíl v phantom
módu až bude 4:16 ratio).

Soft update (Polyak averaging) je stabilnější ale přidává hyperparametr τ
navíc. Vanilla DQN používá hard update, držíme se toho.

### ε-greedy jako metoda DQN, ne policy object

`chooseAction(state, greedy)` — při `greedy=false` s pravděpodobností ε náhodná
akce. `decayEpsilon()` se volá externě (typicky per-episode). Exponenciální
decay 0.995 → po ~900 epizodách dosáhne floor 0.05.

Pro production Lili B se bude volat `decayEpsilon()` jednou denně (ne per
"episode" — kontinuální běh nemá epizody). Přesný mapping epizoda→tick přijde
ve fázi persistence.

### Grid-world test: 4×4, state = [x/3, y/3]

- Akce: 4 (up/right/down/left)
- Odměna: +1 goal (terminal), -0.01 step, -0.1 wall bump
- Optimum: 6 kroků (3 right + 3 down nebo 3 down + 3 right)
- Síť: 2 → 32 → 32 → 4 (~1.2k parametrů)
- Buffer: 5000 (místo 50k — rychlejší test)
- 1500 epizod × ~7 kroků = ~10k env steps, ~10k train steps (train každý step)

Po 1500 epizodách s ε decay dosahuje `ε=0.05` (floor). Greedy evaluace
dosahuje přesně optima = **6 kroků**.

**Tolerance success criteria:** `greedySteps ≤ 2 × optimal`. Reálně dosaženo
1.0× optimal, rezerva je velká.

## Výsledky testů

```
[LiliB] gradientCheck:  max |num − analytical| = 6.1e-5        — PASS
[LiliB] xorTest:        avg abs error po 10 000 krocích = 0.0000 — PASS
[LiliB] gridWorldTest:  episodes=1500 envSteps=11039 trainSteps=11008
                        targetSyncs=110 finalEps=0.050
                        greedy reached=true in 6 steps (optimal=6) — PASS
```

## Velikost

- `public/lili-b.js`: 25.1 KB uncompressed, **7.1 KB gzipped**
- Vercel budget pro `lili-b.js`: 20 KB gzipped (sekce 15 briefu)
- Zbývá ~13 KB gzipped na fáze 3-10 (state/reward, phantom, canvas render,
  stabilizace, persistence, logging). Pohodlná rezerva.

## Deliverable Fáze 2

- `window.LiliB.createDQN(opts)` — plně funkční DQN agent
- `window.LiliB.createReplayBuffer(capacity, stateDim)` — samostatně použitelné
- `window.LiliB.test()` — 3 testy (gradient check, XOR, grid-world)
- Zpětná kompatibilita: Fáze 1 API (`createNetwork`) beze změny, jen
  `backward()` má novou optional druhý argument

## API reference (Fáze 2)

```js
const dqn = LiliB.createDQN({
  stateDim: 12, actionDim: 7,
  hiddenDims: [64, 32],
  bufferCapacity: 50000, batchSize: 32,
  gamma: 0.95, targetUpdateSteps: 100,
  epsilonStart: 1.0, epsilonMin: 0.05, epsilonDecay: 0.995,
  priorityFraction: 0.5, seed: 12345
});

const a = dqn.chooseAction(state, false);          // ε-greedy
dqn.observe(s, a, r, sNext, done, priority);       // priority: 1=real, 0=phantom
const info = dqn.trainStep();                      // {loss, gradNorm} nebo null
dqn.decayEpsilon();
dqn.getEpsilon(); dqn.getTrainSteps(); dqn.getTargetSyncs(); dqn.getBufferSize();
```

## Další kroky

Fáze 3: Responsive canvas change v `lili.js` + state exposition API
(`window.LiliA.getState()`, `getCanvas()`). To je minimální povolená úprava
A podle briefu sekce 3 — "Co nesmíš udělat".

Nebo paralelně: Fáze 4 (phantom stimuli generator) — může být implementována
bez závislosti na canvas změně.
