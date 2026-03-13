# 2026-03-12 — Fáze 8: Q-Learning Brain (mood coordinator)

## Co se změnilo

Implementován kompletní Q-Learning engine, který funguje jako hormonální systém — nastavuje nálady/tendence, ne přímé akce.

### 8A: Q-Learning engine

- **Q-tabulka:** Sparse `Map<stateIndex, Float64Array[7]>` — lazy inicializace, pouze navštívené stavy
- **State space:** 4320 stavů (7 senzorů z Fáze 6), mixed-radix encoding
- **Mood space (7 nálad):** curious, playful, shy, calm, alert, idle, exploring
- **Bellman update:** `Q(s,m) ← Q(s,m) + α[R + γ·max(Q(s',m')) - Q(s,m)]`, α=0.1, γ=0.85
- **Epsilon-greedy:** ε dynamicky z age systému (hatchling 0.85 → elder 0.05)
- **Decision cycle:** každých 45 framů (~750ms)
- **Persistence:** save každých ~600 framů + `beforeunload`, klíč `lili_qtable`

### Mood → behavior mapping

Každá nálada mapuje na steering weight profil (nahrazuje action-based systém z Fáze 2):
- `curious` → seekDom 0.8 + followSlow 0.2
- `playful` → wander 0.7 + seekDom 0.4 + followSlow 0.3
- `shy` → flee 1.2 + seekEdge 0.4
- `calm` → seekWhitespace 0.8 + wander 0.2
- `alert` → flee 0.8 + obstacleAvoid 0.9
- `idle` → wander 0.05 (téměř statická)
- `exploring` → seekEdge 0.6 + wander 0.5

### Nové steering behaviors (8A.2)

4 nové funkce pro mood-driven cíle:
- `steerSeekWhitespace()` — sampluje 8 směrů, vybírá ten s nejnižší DOM hustotou
- `steerSeekDom()` — approach nearest DOM element (okraj, ne střed — aby nepřekrývala)
- `steerSeekEdge()` — seek nearest viewport edge
- `steerFollowSlow()` — cautious following z bezpečné vzdálenosti (80% flee distance)

### Reward function (PRD-specified)

| Situace | Reward |
|---------|--------|
| Whitespace + user čte + calm/idle | +1.0 |
| Úspěšný útěk od rychlého kurzoru | +0.8 |
| DOM explorace, nízký stres, curious | +0.5 |
| Tentacles touching DOM, playful | +0.3 |
| Blízko okraje, user aktivní ve středu | +0.3 |
| Nad textem, kurzor stojí (blokuje čtení) | -2.0 |
| Idle příliš dlouho (age-modulated) | -0.5 |
| Shy/alert při pomalém/dalekém kurzoru | -0.3 |
| Opakování stejné nálady > 5 cyklů | -0.2 |

### 8B: Behavioral Journal

- **Ring buffer:** posledních 5000 rozhodnutí (FIFO)
- **Daily aggregates:** mood distribuce, avg reward, exploration rate, Shannon entropy, LZ complexity, Q-table hash
- **Milestones:** phase transitions, first occurrence of each mood
- **Q-table snapshots:** každých 7 dní (automaticky při daily flush)

### 8C: Export systém

- Klávesa **E** → stáhne `lili_export_YYYYMMDD.json`
- Obsahuje: metadata, kompletní Q-tabulku, daily aggregates, milestones, posledních 1000 rozhodnutí
- URL hash místo plného URL (privacy)

## Rozhodnutí

1. **Mood replaces action** — `lili.mood` nahrazuje `lili.currentAction`. Moods mapují na steering weight profily. Čistší architektura: brain = hormonální systém, ne motor controller.
2. **Sparse Q-table** — Map místo plného pole (4320 × 7 = 30240 floats = 242KB). Sparse verze roste jen s navštívenými stavy.
3. **LZ76 complexity** — implementován z Fáze 8 plánu (Research #5), ne aproximace. Měří strukturální redundanci v sekvenci nálad.
4. **Edge-approach v seekDom** — steer k okraji elementu, ne ke středu. Zabraňuje overlapping.
5. **Export key = 'E'** — jednoduché, ne modifier combo. Debug panel ('D') zůstává separátní.

## Impact

- lili.js: 1818 → 2522 řádků (+704)
- Lili se teď autonomně učí. Hatchling zkoumá téměř náhodně (ε=0.85), elder má pevné rutiny (ε=0.05).
- Steering systém reaguje na mood (7 profilů místo jednoho fixního 'wander')
- Kompletní akademická data k dispozici pro analýzu (export JSON)
