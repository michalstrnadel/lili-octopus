# Fáze 58 — Koevoluce: Lili ↔ Evrin + animal-kingdom reward hierarchie

**Datum:** 2026-04-19
**Rozsah:** reward function + senzory v obou agentech. Žádná strukturální změna state space (Lili Q-tabulka beze ztrát).

## Motivace

Dosud byla Lili "frozen reference agent" — 10 let beze změny, jen exposition API
pro Evrina. Evrin viděl Lili a byl odměňován za přiblížení; Lili Evrina ignorovala.
To neodpovídá biologické realitě: **živočišný druh by měl mít motivaci sbližovat se
s jiným jedincem, a primární rewardem zvířete není explorace, ale sociální
interakce a potrava.**

Uživatel zkontextualizoval jako "zvířecí říše / evidence autonomie based" —
nic scriptovaného, chování emerguje z reward signálu.

## Klíčové rozhodnutí: non-destructive přidání do Lili

Lilina Q-tabulka má 38 880 stavů. Přidání nových state dimenzí by změnilo klíče
→ všechna naučená data by zůstala uložená, ale nikdy by se nezrekonstruovala
(policy read by indexoval jiné bucket). **Proto neměníme state vector** — jen
přidáváme nové reward komponenty, které čtou Evrina a kurzor z globálního
prostředí a přispívají do sumy reward.

Důsledek: Lilina naučená Q(s,a) zůstává 100% platná. Nové signály modifikují
existující hodnoty přes běžné Bellman updates. Stavy korelované s "Evrin poblíž"
postupně získají vyšší Q — organická adaptace bez resetu. Fáze 48 (meta-learning,
non-stationary detection) absorbuje drift.

Evrin má 2-3 minuty života → jeho malé "naučené chování" obětujeme bez váhání;
reward changes platí okamžitě pro živý replay buffer.

## Reward hierarchie (obě agentky)

```
+0.6  companionNear      sociální vazba (ideální vzdálenost k druhému octopus)
+0.5  food               aktivní kurzor v dosahu (pozornost = potrava)
+0.3  novelty            explorace (bylo 0.5 — sníženo v Evrinovi)
-0.3  companionOverlap   tělesný overlap s druhým (kolize)
± 0.1 stress relief      úleva ze stresu
-0.05 stagnation/edge    drobné penalty
```

Biologické zdůvodnění: **sociální a trophické motivace dominují novelty**. V přírodě
zvíře se primárně snaží být s druhy a najít potravu; teprve nasycený a v bezpečí
exploruje. Novelty zůstává non-zero (zvědavost existuje) ale přestává být nejsilnější.

## Změny v kódu

### `public/lili-b.js` (Evrin)

- `computeReward(prev, curr, other, cursor, visitsBefore, bodyRadiusN)` — rozšířena
  signatura o `cursor`
- `novelty`: 0.5 → 0.3
- `approach`: max 0.3 → 0.6
- `food`: **nová** komponenta, max +0.5 (cursor.active && d < 0.08)
- Brain `observe()` zabaluje cursor do `cursorRew` a předává do reward fn
  (funguje i pro phantom cursor → training signal i v idle hodinách)
- Test suite upraven — extra `null` v `computeReward(p, c, o, null, 2, 0.03)`

### `public/lili.js` (Lili) — non-destructive přidání

- `CFG.rewards.companionNear: +0.6`
- `CFG.rewards.food: +0.5`
- `CFG.rewards.companionOverlap: -0.3`
- Všechny curriculum gates rozšířeny (hatchling→elder) o nové klíče
- `computeReward()` — nový blok před `return reward;`:
  - Null-safe read `window.LiliB.runtime.kin.getState()` (funguje i bez Evrina)
  - Gate na `evrinState.born` (Evrin se spawnuje s jitterem)
  - Hysterisní overlap/ideal/falloff stejně jako u Evrina (symmetrical reward)
  - Food: jen když `mouse.active` (reálný kurzor, ne phantom — Lili nemá phantom generator)

### `README.md`

- Intro reframing: "Two Autonomous Digital Octopuses", animal-kingdom reward
  hierarchy uvedena explicitně, poznámka o coevolution a non-destructive přidání
  do Liliny Q-tabulky

## Ověření

- `node --check lili.js` — OK
- `node --check lili-b.js` — OK
- `node --check lili-b.tests.js` — OK
- Browser: pending (uživatel ověří vizuálně + behaviorálně po několika minutách)

## Co by se mělo pozorovat (hypotézy)

1. **Evrin**: výraznější pohyb ke kurzoru (nová food komponenta) a k Lili (boosted
   approach). Decisions vykazují vyšší variabilitu (novelty demoted → méně
   "mechanical scanning").
2. **Lili**: pomalý (řádově hodiny-dny) drift Q-values pro stavy typické, když
   je Evrin poblíž. Nečekat okamžitou změnu chování — Q-learning s γ=0.99 a malým
   α vyžaduje stovky až tisíce Bellman updates pro viditelný policy shift.
3. **Meta-learning** (Fáze 48) detekuje non-stationary signal → dočasně zvýší
   α-scale → rychlejší absorbce.
4. **Sdílené skóre**: `LiliB.runtime.instr` už zaznamenává decisions; shadow
   logger v Evrinovi zaznamenává i Lilin "co by byla odměna" → po týdnech lze
   porovnat, jestli Lilin skutečný reward stream (= včetně companion/food)
   konverguje k shadow odhadům nebo se liší.

## Co NEMĚNIT (pro eventuální paper)

- State space pořád 38 880 — Lilina Q-tabulka struktur beze ztrát
- Evrin INPUT_DIM 26 nezměněno (už obsahuje other_x, other_y, other_stress)
- Shadow reward logger stále běží — lze retrospektivně rekonstruovat Lilinu
  "pre-Evrin" policy pro kontrolní srovnání

---

## Revize 2026-04-19 — čištění reward designu

Po code review jsme zjistili, že přidání `food` do Lili bylo konceptuálně nečisté
(duplicita s existujícími `playfulInteraction`, `domLearning.rewardBonus`,
`noveltyNearBonus`) a že `eDN` v Lili používala asymetrickou normalizaci
(dělila x/docW a y/docH zvlášť → "natažená" Euclidean v ne-čtvercovém viewportu).

### Opravy

1. **`food` zcela odstraněno z Lili** (z `CFG.rewards`, ze všech 5 curriculum gates,
   z `computeReward()`). Lili má vlastní bohatou reward stack pro environment
   interakce — další "food" komponenta byla redundantní. Lili tedy nyní z Phase 58
   přijímá pouze `companionNear` / `companionOverlap` (sociální vztah s Evrinem).

2. **`food` v Evrinovi přejmenováno na `attention`** (kód + komentáře +
   components map). Cursor není potrava — je to human-attention focal point.
   Evrin si `attention` reward ponechává, protože nemá Liliny rich rewardy
   a `attention` (real i phantom cursor) mu dává hustý training signal.

3. **Symetrická normalizace v Lili**: `eDN = sqrt(dx² + dy²) / docDiag`,
   stejně tak `bodyRN = lili.bodyR / docDiag`. True isotropic Euclidean,
   nezávislé na poměru stran viewportu.

4. **Mood gate na `companionNear`**: reward se nestartuje, když je Lili v módu
   `shy` nebo `alert`. Modeluje že fearful/avoiding zvíře nečerpá komfort
   z přítomnosti druha. `companionOverlap` (kolizní penalty) fires vždy.
   Tím odpadá problém continuous-flood reinforcementu.

5. **`idealDistance` a `falloffRate` extrahovány do `CFG.companion`**:
   ```js
   companion: {
     idealDistance: 0.12,
     falloffRate:   6,
   }
   ```

### Důsledky

- Žádná regrese: tests volají `computeReward(p, c, o, null, 2, 0.03)` s `null`
  cursor → attention=0 (stejně jako dříve food=0), test passing beze změny.
- Lilina Q-tabulka beze ztrát (struktura nezměněna).
- Reward magnitudy v Lili: bez food (max +0.5) je celkový "dop" Phase 58
  +0.6 (companionNear peak) místo +1.1. Méně agresivní policy shift,
  zachovává rovnováhu se stávajícími rewardy (-2.0 až +1.0).
- `node --check` všech tří souborů: OK.
