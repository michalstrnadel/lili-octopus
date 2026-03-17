# Phase 16 — DOM Novelty & Bubble Communication

**Datum:** 2026-03-17 (commit 75c3ec9)

## Motivace

Dva kroky k bohatší autonomii:
1. **Zvědavost** — Lili by měla reagovat na nový obsah na stránce, ale ne hardcoded "jeď tam". Zvědavost má emergovat z reward systému.
2. **Komunikace** — Lili dosud jen mění nálady. Měla by občas "bublat" — krátké symboly na canvasu vyjadřující vnitřní stav.

## 16A — DOM Novelty (autonomní zvědavost)

### Princip
MutationObserver už existoval (Phase 5 — spatial hash rebuild). Rozšířen o tracking nových DOM elementů:
- Nové elementy (> 10x10px, ne SCRIPT/STYLE) se zaznamenají jako "novel rects" s pozicí a timestampem
- Když Lili připluje do 150px od novel elementu → +0.6 reward (jednorázový, consumed)
- Seen elements decay po 1h → obsah se stane opět novým

### Klíčové rozhodnutí
**Žádná navigační logika.** Q-Learning brain dostane reward za blízkost k novému obsahu a sám se naučí být zvědavý. Curiosity je emergentní, ne naprogramovaná.

### Stav
- `_novelty.seenElements` — Map klíčů (tag+pozice) → timestamp
- `_novelty.pendingNewRects` — rects čekající na Lili "návštěvu"
- Max 200 tracked, FIFO eviction

## 16B — Bubble Communication

### Symboly dle vnitřního stavu
| Symbol | Podmínka |
|--------|----------|
| 💤 | Spánek (circadian) |
| ♥ | Vysoký trust + kurzor blízko |
| ? | Curious mood + blízko DOM |
| ! | Vysoký stress |
| ~ | Playful mood |
| ✦ | Detekován nový DOM obsah |
| ◦ | Calm + moderate trust |

### Rendering
- 12-slot pre-alokovaný pool
- Bubliny stoupají vzhůru (0.6 px/frame), kývají se sinusoidou
- Fade in 10% → fade out, lifetime 2.8s
- Cooldown 5s mezi emisemi (ne spam)
- Renderuje se nad tělem (nejvyšší z-order)

## Dopad

- Soubor: 4598 → 4801 řádků (+203)
- Debug panel rozšířen o Phase 16 sekci (novelRects, seen, bubbles)
- Reward systém obohacen o novelty bonus
- MutationObserver nyní předává mutations do noveltyTrackNewElements()
