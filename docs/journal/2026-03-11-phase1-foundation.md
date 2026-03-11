# 2026-03-11 — Fáze 1: Kostra, Canvas, Boot, Vec2, Noise

## Co se stalo

Implementována kompletní Fáze 1 projektu Lili — první spustitelný kód v `public/lili.js`.

## Co bylo vytvořeno

### 1A: IIFE + CFG + Seed systém
- IIFE wrapper s `'use strict'`, celý kód v jednom souboru
- `CFG` objekt obsahuje **všechny** konstanty z PRD: věkově závislé parametry (bodyRadius, maxSpeed, maxForce, damping, epsilon), RL hyperparametry (α=0.1, γ=0.85), reward values, behavior weights pro všech 7 akcí, storage keys, spatial hash config, stress model, chromatofory HSL parametry
- **Mulberry32 PRNG** — dvě nezávislé instance:
  - `noiseRng` (seed 42) — pro Simplex Noise a vizuální procedurální efekty
  - `rlRng` (seed 137) — pro RL rozhodování (epsilon-greedy explorace)
  - Oddělení seedů umožňuje párové testování (Research #5: akademická metodologie)

### 1B: Vec2 matematika
- Třída `Vec2` s kompletní sadou operací
- **In-place** varianty (`addIn`, `subIn`, `multIn`, `limitIn`, `normalizeIn`, `setFrom`) pro hot-path bez GC alokací (Research #3)
- **Pure** varianty (`add`, `sub`, `mult`, `copy`, `normalize`) pro setup a non-critical code
- Optimalizované `magSq()` a `distSq()` bez `Math.sqrt`
- Pre-alokované scratch vektory `_v0`, `_v1` (Research #3: zero allocation in render loop)

### 1C: Simplex Noise 2D
- Self-contained implementace (~80 řádků) uvnitř IIFE
- Seeded z `noiseRng` přes Fisher-Yates shuffle permutační tabulky
- Deterministický výstup pro reprodukovatelnost experimentu
- Výstup v rozsahu [-1, 1], připravený pro wander, deformace mantlu, pohyb chapadel

### 1D: Canvas bootstrap + lifecycle
- `<canvas id="lili-canvas">` s `position:fixed`, `100vw×100vh`, `pointer-events:none`, `z-index:9999`
- HiDPI handling: `canvas.width = innerWidth * devicePixelRatio`, `ctx.setTransform(dpr, ...)`
- Debounced resize handler (150ms)
- `visibilitychange` listener — pause při skrytém tabu (šetří CPU)
- `requestAnimationFrame` loop s delta-time (capped na 50ms pro bezpečnost po tab switch)
- Genesis timestamp v localStorage (nikdy se nepřepisuje — pravidlo z PRD)
- Visit counter v localStorage
- Boot sekvence respektuje `DOMContentLoaded`

### Testovací stránka
- `public/index.html` — minimální HTML s instrukcemi pro DevTools ověření

## Research integrace
- **Research #3 (FABRIK):** Vec2 in-place operace, scratch vektory, zero-alloc architektura
- **Research #5 (Akademická metodologie):** Oddělené PRNG streamy pro noise vs. RL, deterministické seedy

## Rozhodnutí
- Mulberry32 zvolen jako PRNG — rychlý, 32-bit, dostatečná kvalita pro noise i RL, tiny footprint
- Delta-time cap na 50ms (ne 33ms) — toleruje drobné zpomalení bez viditelného skoku
- Seed values 42 a 137 — arbitrární, ale fixní. Lze změnit v CFG pro experimentální varianty.

## Další krok
Fáze 2: Steering Behaviors — fyzikální model těla, wander, seek, flee, obstacle avoidance, boundary.
