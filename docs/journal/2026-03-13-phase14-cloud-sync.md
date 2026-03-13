# Phase 14 — Cloud Sync (GitHub Persistence)

**Datum:** 2026-03-13

## Motivace

localStorage je per-origin a per-browser. Lili nemá kontinuitu mezi zařízeními a smazání cache = ztráta celé ontogeneze. Autor chce jednu Lili, která žije nezávisle na prohlížeči.

## Architektura

```
lili.js (klient)
  ├── boot: GET /api/lili → načte stav z GitHubu
  ├── každých 5 min: POST /api/lili → uloží stav do GitHubu
  ├── beforeunload: sendBeacon → best-effort save
  └── localStorage: offline fallback (beze změny)

/api/lili (Vercel serverless)
  ├── GET: čte data/state.json z lili-octopus repo (GitHub API)
  └── POST: zapisuje data/state.json do lili-octopus repo (GitHub API)

lili-octopus/data/state.json (GitHub)
  └── single source of truth pro Lili stav
```

## Merge strategie

- **Brain:** remote wins pokud má víc `totalDecisions` (= víc zkušeností)
- **Genesis:** zachovává se nejstarší timestamp (= skutečné narození)
- **Daily aggregates:** merge by unique day key
- **Milestones:** merge by type+timestamp
- **Visits:** vyšší číslo vyhrává
- **SHA conflict:** reload remote, mark dirty, retry

## Klíčová rozhodnutí

1. **GitHub jako DB** — ne Vercel KV, ne SQLite. Data jsou viditelná jako JSON v repu, git history = přirozený audit trail.
2. **5 min interval** — kompromis mezi aktuálností a GitHub API rate limits (5000/h authenticated).
3. **sendBeacon na beforeunload** — fire-and-forget, prohlížeč garantuje odeslání i při zavření tabu.
4. **localStorage zůstává** — offline fallback, zero-downtime pokud API selže.
5. **Formát `lili_state_v1`** — verzovaný, forward-compatible.

## Potřebné env vars na Vercelu

- `GITHUB_TOKEN` — Personal Access Token s `repo` scope
