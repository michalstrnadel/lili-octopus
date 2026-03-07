# Claude Code Context

**Přečti `AGENTS.md` jako první** — obsahuje kompletní kontext projektu, aktuální stav, co číst, konvence a pravidla.

## Quick Summary

Lili = autonomní digitální chobotnice (Q-Learning RL agent) na webové stránce. Jeden JS soubor, zero deps, 10letý životní cyklus. Akademický experiment.

## Klíčové soubory

- `AGENTS.md` — **HLAVNÍ AI KONTEXT** (čti první)
- `docs/IMPLEMENTATION_PLAN.md` — co implementovat
- `LILI_PRD_v1.md` — specifikace (zdroj pravdy)
- `public/lili.js` — jediný produkční soubor
- `docs/journal/` — zaznamenávej rozhodnutí sem

## Pravidla

- Vše v jednom souboru `public/lili.js` (IIFE, 'use strict')
- Zero dependencies — žádné importy, žádné npm
- Brain Interface pattern: `brain.chooseAction()`, `brain.learn()`, `brain.serialize()`
- Komentáře v angličtině, dokumentace v češtině
- Zaznamenávej rozhodnutí do `docs/journal/`
- Aktualizuj `AGENTS.md` při změně stavu
