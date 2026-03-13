# Phase 12: Optimization and Polish

**Datum:** 2026-03-12

## Co se změnilo

Performance optimalizace a monitoring pro produkční nasazení.

### 12A: Render Culling

- `isOnScreen()` — kontroluje zda body + max tentacle reach je v viewportu
- Pokud offscreen → přeskočí Canvas rendering (clearRect stále běží)
- Physics a Q-Learning pokračují normálně (Lili se vrátí zpět na stránku)

### 12B: Zero-Allocation Render Loop

- Pre-alokované hull point arrays: `_hullLeft[8]` a `_hullRight[8]` (object pool)
- `renderTentaclesHull` přepoužívá existující objekty místo `push()`
- `drawHullSide` dostává `reverse` parametr — backwards traversal bez `Array.reverse()` mutace
- Eliminuje ~128 object allocations per frame (16 arrays × 8 objects)

### 12C: FPS Monitoring

- Rolling average přes 60 framů (Float32Array buffer)
- Console warning při < 50 FPS (cooldown 60s aby nespamoval)
- `performance.now()` timing v boot → log init ms + warning pokud > 200ms

## Rozhodnutí

- Path2D cache pro idle pózy odložen — složitost invalidace při noise deformaci vs. benefit nejistý. Současný state batching (1 beginPath + 1 fill pro všechna chapadla) je dostatečný.
- Logic LOD (snížení FABRIK iterací offscreen) odložen — Lili je typicky na stránce, offscreen je edge case.
- Soubor ~124KB raw (~83KB stripped). Target <80KB unminified je blízko. Minified <50KB dosažitelné s terser/uglify.

## Metriky

- 3325 → 3387 řádků (+62)
- Zero nových dependencies
- Hull render: ~128 méně alokací per frame
