# Lili B — Phase 1: NN Foundation

**Date:** 2026-04-19
**Agent:** Lili B (DQN)
**Phase:** 1 / 10
**Status:** in progress

## Kontext

Start nového akademického experimentu — druhý RL agent **Lili B** (Deep Q-Network) na stejném canvasu jako existující Lili A (tabulární Q-Learning). Cíl je srovnávací paper:

> *"Vanilla Q-Learning vs. stabilizovaný DQN — co unese decade-scale autonomní ontogenezi v browseru?"*

Kompletní design brief: `docs/IMPLEMENTATION_PLAN_LILI_B.md` (16 sekcí, finalizováno 2026-04-19).

## Experimentální rámec

- **Exp A — Lili A:** Q-Learning, 10 let, beze změny, referenční agent
- **Exp B — Srovnání:** Lili A vs. Lili B, hlavní akademické okno prvních 2 let
- **Exp C — Stabilizace:** jak udržet DQN stabilní na decade-scale autonomii (samostatný výzkumný přínos)

Staged commitment: 2letý checkpoint rozhoduje o pokračování na 10 let, nebo publikaci negative result.

## Rozsah Fáze 1

Pouze NN fundament, **žádná integrace s lili.js, žádný canvas, žádný DQN wrapper**. Self-contained modul v `public/lili-b.js` testovatelný konzolovými unit testy.

### Scope

1. Skeleton IIFE + `'use strict'`
2. Float32Array primitives: matmul (i-k-j cache-friendly), ReLU + derivative, He init
3. Dense layer forward + backward
4. Síť: `input → 64 → 32 → output` (dim parametrizovatelné zatím)
5. Adam optimizer (`lr=0.001, β1=0.9, β2=0.999, ε=1e-8`)
6. Gradient clipping (max global norm 1.0)
7. Unit test harness:
   - Numerický gradient check (finite differences vs. analytical), tolerance < 1e-4
   - XOR konvergence do ~5000 kroků

## Design decisions

### Float32Array všude, žádné Arrays

Důvod: V8 a JavaScriptCore typed arrays → contiguous memory, předvídatelná rychlost, žádný GC jitter. Kritické pro `requestAnimationFrame` loop v pozdějších fázích.

### Pre-alokace při init

Žádná alokace paměti po boot. Všechny buffery (váhy, biasy, aktivace, gradienty, Adam m/v momenty) se alokují jednou při `createNetwork()`. Tím splníme constraint briefu: "žádná alokace v rAF loopu".

### i-k-j matmul (ne i-j-k)

Pro matrix-vector multiply `y = Wx`:
- i-j-k: čte W po sloupcích → cache miss každou iteraci
- i-k-j: čte W po řádcích → cache-friendly, ~2-3× rychlejší na V8

### He initialization (ne Xavier, ne random)

He = `randn() * sqrt(2 / fanIn)` — doporučeno pro ReLU sítě (Xavier je pro tanh/sigmoid). Bez toho gradient exploduje nebo mizí v prvních krocích.

### Adam místo SGD

Důvod: RL reward signál je šumivý, SGD by divergoval. Adam adaptivně normalizuje kroky per-parameter, dramaticky stabilnější. Default β hodnoty.

### Gradient clipping max norm 1.0

Už v Phase 1 (ne až v Phase 7 stabilizační sadě). Důvod: gradient check a XOR trénink by měly projít i s clippingem aktivním, jinak by Phase 7 přidávala funkcionalitu která mění chování base learneru.

## Deliverable Fáze 1

- `public/lili-b.js` obsahuje tiny NN engine
- `window.LiliB.test()` v konzoli:
  - `gradientCheck()` vrací ✅ (max diff < 1e-4)
  - `xorTest()` vrací ✅ (final loss < 0.01)
- Žádný dopad na Lili A, žádný dopad na UX stránky

## Co **není** v této fázi

- ❌ Experience replay buffer
- ❌ Target network
- ❌ ε-greedy policy
- ❌ State vector assembly
- ❌ Reward funkce
- ❌ Render layer / canvas integrace
- ❌ Phantom stimuli
- ❌ Persistence / localStorage
- ❌ Mobile handling

Vše výše = Fáze 2-10.

## Vercel Hobby constraints (globální)

Deploy běží na free plánu. Fáze 1 je pouze client-side JS, žádné API endpointy, zero-deps. Velikost: target `lili-b.js` < 50 KB uncompressed po dokončení všech fází; Phase 1 samotné by mělo být ~5-10 KB.

## Další kroky

Fáze 2: DQN Core (experience replay, target net, ε-greedy, Bellman update, toy grid-world test).
