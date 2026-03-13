# Phase 10: Click, Tooltip, Debug Panel

**Datum:** 2026-03-12

## Co se změnilo

Uživatelská interakce a diagnostický systém pro Lili.

### 10A: Click Detection + Tooltip

- `document.addEventListener('click')` s Euklidovskou vzdáleností `< bodyR * 2.5`
- Tooltip: absolutně pozicovaný DOM element, monospace, tmavý backdrop-filter
- Obsah: **Lili** (jméno), phase, age (formátovaný — hodiny/dny/roky), preference (top Q-mood), visits
- Auto-dismiss po 3.5s s fade-out 250ms
- Pozicování: preferuje nad klikem, shift aby zůstal ve viewportu

### 10B: Debug Panel

- Toggle: klávesa `D` (keydown, bez modifikátorů)
- Fixed pozice top-right, 11px monospace, semi-transparent s backdrop-filter
- Obsah:
  - **Phase:** phase + progress %
  - **Age:** dny (float)
  - **Mood:** aktuální nálada + (ε) flag pokud exploratory
  - **Stress:** float 0..1
  - **Velocity:** px/frame
  - **Sensors:** cursor proximity/velocity, DOM density, whitespace, scroll, time
  - **State#:** state index / 4320
  - **Q-values:** aktuální pro current state (per mood)
  - **RL stats:** total decisions, cumulative reward, Q-table size
  - **Entropy:** Shannon entropy (real-time)
  - **LZC:** Lempel-Ziv complexity
  - **DOM:** disturbed/max, held/max, tentacle recoil/touch/grab counts
  - **Hash:** grid cells, total objects
  - **FPS:** 60-frame rolling average s ⚠ pod 50

### Unified Key Handler

- `onKeyDown()` nahrazuje separátní E key listener
- D = debug toggle, E = export

## Rozhodnutí

- Debug panel se updatuje v `render()` (jednou za frame), ne v `update()` — je to čistě prezentační
- FPS kalkulace z `dt` s 60-frame rolling buffer (Float32Array, zero-alloc)
- Tooltip a debug panel mají `pointer-events:none` — neblokují uživatele
- z-index tooltip = canvasZIndex + 1, debug = canvasZIndex + 2

## Metriky

- 2951 → 3163 řádků (+212)
- Zero nových dependencies
