# Design — Vizuální filozofie a rozhodnutí

## Princip: Psychosomatická vizuální individualita

Každá instance Lili vypadá jinak. To není náhodné — je to důsledek biologického principu: **psychosomatické stavy ovlivňují fyziologii.**

V přírodě se stresovaná chobotnice vizuálně liší od klidné — tmavší barvy, stažené chapadla, rychlejší chromatoforové změny. Chobotnice žijící v útesu plném predátorů vypadá jinak než chobotnice v klidné zátoce.

Totéž musí platit pro Lili. Její vizuál je **funkce jejího života** — ne kosmetika.

## Co ovlivňuje vizuál

### 1. Genesis seed (vrozené)
Hash genesis timestampu generuje subtle variace:
- Base hue offset (±15°) — každá Lili má mírně jinou základní barvu
- Tělesné proporce — poměr radiusX/radiusY ±5%
- Oční pozice — mírně výš/níž na těle
- Tentacle base thickness — variace ±10%

Analogie: genetická výbava. Dvě chobotnice téhož druhu vypadají podobně, ale ne identicky.

### 2. Prostředí (adaptace)
Typ stránky a uživatel formují dlouhodobý vizuál:
- **Stresová stránka** (hodně DOM, agresivní kurzor): tmavší base color, menší bodyR, kompaktnější chapadla, vyšší glow (obranný mechanismus)
- **Klidná stránka** (málo DOM, pomalý kurzor): světlejší, větší, relaxovaná chapadla, nižší glow
- Toto se mění POMALU — přes dny/týdny na základě průměrného stresu a reward accumulation

Analogie: chobotnice žijící v korálech vs. na písečném dně vyvíjí jiné vzory.

### 3. Věk (ontogeneze)
- Hatchling: světlá, malá (8-12px), rychlé chromatoforové změny, vysoký glow
- Juvenile: rostoucí, stabilizující se barva
- Adult: plná velikost (20-24px), hluboké barvy, stabilní
- Mature: tmavnoucí, pomalejší změny
- Elder: tmavá, monumentální (28-32px), téměř statická barva, minimální glow

### 4. Naučené chování (osobnost)
Q-tabulka definuje "charakter" — a ten se vizuálně projevuje:
- **Plachá Lili** (naučila se flee): menší, bledší, stažené pupily
- **Zvědavá Lili** (naučila se explore_dom): větší oči, jasnější barvy
- **Klidná Lili** (naučila se idle/seek_whitespace): hluboké, stabilní tóny

Toto je implementováno přes dlouhodobé průměry z behavioral journalu, ne přes okamžité stavy.

## Vizuální reference

### Minimalistický tvar
- Tělo: jednoduchá elipsa s noise deformací
- Oči: dva kruhy s pupilami
- Chapadla: Bézier curves, zužující se
- Žádné textury, žádné detaily — čistá procedurální geometrie

### Biologická věrnost pohybu
- Jet propulsion: pulse-glide cyklus (kontrakce mantlu → klouzání)
- Chapadla trailing: zaostávají za tělem při pohybu
- Relaxace: chapadla se rozprostřou při zastavení
- Dýchání: jemná mantle pulsace i v klidu

### Chromatoforový systém
- HSL model (ne RGB) — přirozenější interpolace
- Cirkadiánní rytmus: ráno teplé, noc studené
- Stress: okamžitý shift k červené
- Flee flash: 300ms kontrastní probliknutí

## Soubory v této složce

Zde budou ukládány:
- Vizuální reference (screenshoty, skici)
- Color palette experimenty
- Animační testy a GIFy
- Porovnání různých instancí Lili

---

*"Jak žiješ, tak vypadáš."*
