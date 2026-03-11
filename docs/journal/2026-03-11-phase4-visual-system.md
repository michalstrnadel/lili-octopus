# 2026-03-11 — Fáze 4: Vizuální systém

## Co bylo implementováno

### 4A: Hull/envelope rendering chapadel
- Catmull-Rom → Bézier konverze (tension=6) pro organické křivky
- `polyTangent()` — výpočet tangentních a normálových vektorů per FABRIK uzel
- Lineární tapering (base → tip) s noise modulací pro organický profil
- State batching: všechna chapadla jako sub-paths jedné cesty, jeden `ctx.fill()`
- Tip highlights s recoil feedback (červená záblesk)

### 4B: Tělo s noise deformací
- 24-bodová perimetrální elipsa s Simplex noise deformací
- Radiální gradient pro hloubku (světlejší nahoře, tmavší na okrajích)
- Breathing + pulse-glide modulace zachovány z Fáze 2
- Bioluminiscenční glow s age-dependent intenzitou

### 4C: Oči
- 2 oči na horní třetině těla, rotované s heading
- Pupily sledují kurzor (max offset = eyeR × 0.3)
- Dynamická velikost pupil (dilatace při rychlém pohybu)
- Spekulární highlight (bílý odlesk pro „život")

### 4D: Chromatoforový systém (HSL)
- `computeColors()` — centrální color computation per frame
- Base hue: lerp 200→240 (ocean blue → deep indigo) dle věku
- Cirkadiánní posun: ráno +10° teplejší, noc -15° chladnější + tmavší
- Tentacle barvy mírně odlišné od těla (lighter, less saturated)

### 4E: Rendering pipeline
- Správné Z-pořadí: chapadla → glow → tělo → oči
- Barvy počítané jednou per frame (ne per objekt)

## Rozhodnutí o velikosti
- Hatchling bodyRadius snížen: 10 → 7 px
- Tentacle segmentLength: 5 → 3 px (hatchling)
- Celková velikost Lili na všech stupních snížena o ~10-15%
- Na request uživatele: "chtěl bych aby byla trošku menší jako první stádium po narození"

## Technické detaily
- `lili.bodyR` se nyní aktualizuje každý frame (předtím jen při bootu)
- Hull rendering: ~210 řádků nového kódu
- Žádné nové dependencies, vše v jednom souboru
- Soubor: 1270 → 1480 řádků
