# Phase 11: Persistence — Schema, Strategy, Data Protection

**Datum:** 2026-03-12

## Co se změnilo

Kompletní persistence vrstva pro 10letý životní cyklus.

### 11A: Position Save/Restore

- `savePosition()` ukládá `{x, y, mood, w, h}` do `lili_position`
- `restorePosition()` v boot() — clamping na aktuální viewport (stránka mohla změnit rozměr)
- Mood restore z uloženého indexu
- Periodicita: každých ~600 framů (sdíleno s Q-table save) + `beforeunload`
- Graceful fallback: corrupted JSON → `false` → default center position

### 11B: Safari ITP Mitigation

- `navigator.storage.persist()` volání při bootu (Chrome/Firefox ochrana)
- **Data loss detection:** porovnání věku Lili vs. počet daily aggregates
  - Pokud >7 dní stará ale <30% očekávaných aggregates → console warning
  - Informuje uživatele o možné Safari ITP evikci
- **Import systém (klávesa I):**
  - File input dialog (`.json` accept)
  - Validace formátu (`lili_export_v1`)
  - Q-table: complete replacement
  - Daily aggregates: merge by day (deduplicate)
  - Milestones: merge by type+timestamp (deduplicate)
  - Decision counters: take max of existing vs imported

### Unified Key Handler

- D = debug panel, E = export, I = import (všechno v `onKeyDown()`)

## Rozhodnutí

- Position save sdílí interval s Q-table save (netřeba další timer)
- Import merguje data místo úplné náhrady — bezpečnější pro neúplné exporty
- `navigator.storage.persist()` je fire-and-forget (promise se neblokuje)
- Viewport clamping s margin = `bodyR * 2` — Lili nikdy nezmizí za okraj

## localStorage schema (kompletní)

| Key | Format | Size | Save freq |
|-----|--------|------|-----------|
| `lili_genesis` | timestamp string | 13B | once |
| `lili_visits` | number string | ~4B | per boot |
| `lili_position` | JSON `{x,y,mood,w,h}` | ~50B | ~10s + unload |
| `lili_qtable` | JSON `{v,mood,decisions,reward,entries}` | ~10KB | ~10s + unload |
| `lili_last_cleanup` | timestamp string | 13B | per cleanup |
| `lili_daily` | JSON array of aggregates | ~500B/day | per flush |
| `lili_milestones` | JSON array of events | variable | per event |
| `lili_qtable_snapshot_YYYYMMDD` | JSON | ~15KB | weekly |

## Metriky

- 3163 → 3325 řádků (+162)
- Zero nových dependencies
