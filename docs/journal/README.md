# Journal — Deníček vývoje

Tato složka je chronologický záznam vývoje projektu Lili. Každý zápis dokumentuje rozhodnutí, úvahy a implementační kroky.

## Formát zápisů

Soubory jsou pojmenovány `YYYY-MM-DD-topic.md`. Každý zápis obsahuje:
- **Datum a čas**
- **Co se řešilo** (otázka, problém, rozhodnutí)
- **Jaké byly alternativy**
- **Proč jsme se rozhodli tak, jak jsme se rozhodli**
- **Co z toho vyplývá pro implementaci**

## Jak číst journal

Zápisky jsou chronologické. Pro pochopení evoluce projektu čtěte od nejstaršího. Pro aktuální stav čtěte nejnovější.

## Index zápisů

| Datum | Soubor | Téma |
|-------|--------|------|
|| 2026-03-07 | `2026-03-07-project-inception.md` | Založení projektu, analýza PRD, vytvoření implementačního plánu |
| 2026-03-07 | `2026-03-07-distributed-intelligence.md` | Distribuovaná inteligence chapadel, hravá DOM manipulace |
| 2026-03-11 | `2026-03-11-phase1-foundation.md` | Základní IIFE struktura, Vec2, PRNG, Canvas |
| 2026-03-11 | `2026-03-11-phase2-steering-behaviors.md` | Steering behaviors, wander, flee |
| 2026-03-11 | `2026-03-11-phase2b-ontogenetic-movement.md` | Ontogenetický pohyb — věkové změny dynamiky |
| 2026-03-11 | `2026-03-11-phase3-fabrik-tentacles.md` | FABRIK chapadla, procedurální animace |
| 2026-03-11 | `2026-03-11-phase4-visual-system.md` | Vizuální systém — tělo, oči, barvy |
| 2026-03-12 | `2026-03-12-phase5-spatial-hash.md` | Spatial hash pro DOM elementy |
| 2026-03-12 | `2026-03-12-phase6-sensors.md` | Senzorický systém (globální + per-tentacle) |
| 2026-03-12 | `2026-03-12-phase7-age-system.md` | Věkový systém, genesis, fáze života |
| 2026-03-12 | `2026-03-12-phase8-qlearning.md` | Q-Learning RL brain, mood selection |
| 2026-03-12 | `2026-03-12-phase9-dom-interaction.md` | DOM interakce — disturb, grab, recoil |
| 2026-03-12 | `2026-03-12-phase10-click-tooltip-debug.md` | Click tooltip, debug panel |
| 2026-03-12 | `2026-03-12-phase11-persistence.md` | localStorage persistence, data loss detection |
| 2026-03-12 | `2026-03-12-phase12-optimization.md` | Optimalizace — culling, FPS monitoring |
| 2026-03-13 | `2026-03-13-document-space-coordinates.md` | Document-space souřadnice |
| 2026-03-13 | `2026-03-13-phase13-emotional-expression.md` | Emocionální exprese, mood blending |
| 2026-03-13 | `2026-03-13-phase14-cloud-sync.md` | Cloud sync přes GitHub API |
| 2026-03-17 | `2026-03-17-phase15-autonomy-features.md` | 7 autonomních schopností (place memory, circadian, trust, DOM learning, ink, enhanced DOM, metamorphosis) |
| 2026-03-17 | `2026-03-17-phase16-novelty-bubbles.md` | DOM Novelty (emergentní zvědavost) + Bubble Communication (symboly vnitřního stavu) |

---

*Tento deníček je součástí akademické dokumentace projektu. Slouží k zajištění reprodukovatelnosti a transparentnosti rozhodovacího procesu.*
