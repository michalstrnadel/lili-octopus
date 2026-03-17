# Phase 15 — 7 Autonomy Features

**Datum:** 2026-03-17 (commit b06a328)

## Motivace

Lili potřebuje hlubší autonomii — nejen se pohybovat a reagovat, ale pamatovat si místa, rozpoznávat uživatele, učit se z DOM struktury, bránit se inkoustem, a vizuálně dozrávat. Všechny featury posilují Q-Learning reward signál, takže chování emerguje z učení, ne z hardcoded pravidel.

## Implementované featury

### 15A — Place Memory (prostorová paměť)
- Diskretizovaná mřížka 240px, ukládá +/- zkušenosti na pozicích
- Decay over time, steering bias směrem k bezpečným místům
- Persistence v localStorage

### 15B — Day/Night Rhythm (cirkadiánní rytmus)
- Hodiny 23:00–6:00 = spánek (zavřené oči, snížená aktivita)
- Postupná ospalost, probuzení se stretch animací
- `activityMul` redukuje rychlost a sílu v noci

### 15C — Visit Recognition (rozpoznání návštěv)
- Sleduje počet návštěv + timestampy
- Trust level 0–1 s recency half-life
- Vysoký trust snižuje flee weight, přidává calm-near-cursor reward

### 15D — DOM Structure Learning (preference typů elementů)
- Tracking interakcí s heading/image/link/paragraph/other
- Normalizované preference, reward bonus za preferované typy
- Decay pro adaptaci na nový obsah

### 15E — Ink Secretion (inkoustová obrana)
- 50-particle pool, emituje 8 částic od kurzoru při stress > 0.8
- 8s cooldown, quadratic alpha fade, drift s friction
- Renderuje se za tělem (nejnižší z-order)

### 15F — Enhanced DOM Interaction (zobrazení textu)
- Renderuje text z uchopených DOM elementů na canvasu
- Zobrazuje u špiček chapadel s gentle sway animací

### 15G — Visual Metamorphosis (vizuální proměna)
- CFG pro chromatophores, scars, bioluminescence points
- Cirkadiánní efekt na oči
- Inkoustový oblak za tělem

## Architektonická rozhodnutí

- **Vše jako reward signál**: Místo hardcoded chování, featury přidávají reward bonusy do Q-Learning → brain se učí optimální chování sám
- **Pooled particles**: Ink používá pre-alokovaný pool pro zero-alloc rendering
- **Brain Interface pattern zachován**: Nové moduly používají serialize/deserialize pro persistence

## Dopad

- Soubor narostl z ~4013 na ~4578 řádků
- Lili nyní má prostorovou paměť, sociální povědomí, vizuální zrání a obranný mechanismus
