# 2026-03-12 — Fáze 7: Age System (smooth lifecycle transitions)

## Co se změnilo

Přepracovaný age systém ze step-based na smooth interpolation:

### Před (Fáze 2 implementace)
- `ageVal()` vracela fixní hodnotu pro aktuální fázi (skok na hranici)
- Žádná detekce přechodů mezi fázemi
- Pouze `phase` a globální `t` (0..1)

### Po (Fáze 7)
- **Smoothstep interpolace** — hodnoty plynule přecházejí mezi sousedními fázemi (S-křivka, ne lineární)
- **`phaseProgress`** (0..1) — kde přesně je organismus v rámci aktuální fáze
- **`phaseIndex`** (0–4) — numerický index pro efektivní přístup
- **`onPhaseTransition(fn)`** — callback systém pro detekci přechodů (Phase 8 journal ho bude konzumovat)
- **`LIFE_PHASES`** a **`PHASE_BOUNDARIES`** — explicitní pole pro čistou interpolaci

### Smoothstep vs. linear
Biologický růst není lineární — organismy rostou S-křivkou (pomalý start, zrychlení, zpomalení). `smoothstep(t) = t²(3-2t)` přesně toto modeluje. Výsledek: hatchling neroste "konstantně" ale má přirozenější průběh vývoje.

## Rozhodnutí

1. **Smoothstep easing** místo lineárního lerpu — biologicky věrnější růstové křivky
2. **Event system místo polling** — phase transitions se detekují v `updateAge()` a emitují callbacky, ne polling v jiných systémech
3. **Žádný false positive na boot** — první `updateAge()` volání v boot() detekuje catch-up transition (user se vrátí po týdnech → korektní hatchling→juvenile event)

## Ověření

Interpolace testována na klíčových bodech:
- Day 0: bodyR=4.0, Day 7: bodyR=7.0, Day 14: bodyR=10.0 (boundary), Day 365: bodyR=20.0, Day 3650: bodyR=26.0
- Dvou-bodové mapy (hatchling+elder only) fungují beze změny

## Impact

Všechny systémy napojené na `ageVal()` (steering, FABRIK, chromatofory, pulzace, glow) teď dostávají plynulé hodnoty místo skoků. Vizuálně by měl být růst organismu přirozenější.
