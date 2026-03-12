# 2026-03-12 — Fáze 5: Spatial Hash Grid

## Co bylo implementováno

### Spatial Hash Grid
- `Map` s klíčem `"col,row"`, buňky 120×120px
- `buildSpatialHash()` — projde všechny DOM elementy (`querySelectorAll`), filtruje neviditelné/malé/canvas, vloží do hash mapy podle překrytých buněk
- `getNearby(x, y)` — vrátí deduplikované obstacles z vlastní buňky + 8 sousedů
- `getNearbyCount(x, y)` — počet blízkých elementů (připraveno pro Fázi 6 senzory — DOM density)

### Rebuild triggers
- Resize (debounced)
- Scroll (passive listener, force rebuild)
- `MutationObserver` na `document.body` (childList + subtree) s throttle 500ms

### Napojení na obstacle avoidance
- `steerObstacleAvoid()` nyní volá `getNearby(ax, ay)` místo iterace přes celé `domObstacles[]` pole
- Složitost: O(n²) → O(k) kde k = počet elementů v 9 okolních buňkách

## Rozhodnutí
- Obstacle entry nyní obsahuje `el` referenci na DOM element — připraveno pro Fázi 9 (DOM interakce)
- `getNearbyCount()` připravena jako vstup pro budoucí DOM density senzor (Fáze 6)
- Scroll listener je `passive: true` pro výkon
