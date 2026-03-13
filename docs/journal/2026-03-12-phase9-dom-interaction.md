# 2026-03-12 — Fáze 9: DOM Interaction (haptická explorace)

## Co se změnilo

Chapadla Lili teď autonomně zkoumají, dotýkají se, uchopují a hrají si s obsahem stránky. Ráno se vše vrátí.

### 9A: Word Indexer

- `wrapWords()` běží jednou v boot(), obaluje textové uzly do `<span class="lili-word">`
- Přeskakuje: `<script>`, `<style>`, `<textarea>`, `<code>`, `<pre>`, interactive elementy (`<a>`, `<button>`)
- Tvarová afinita: `data-lili-shape` = round (O, Q, 0...) / angular (A, K, V...) / mixed
- Zpracování v reverse order aby se neinvalidovaly reference
- Spatial hash se buduje **po** wrappingu → nové spany jsou automaticky indexované

### 9B: 5-fázový DOM interaction pipeline

Per-tentacle state machine:

| Stav | Trigger | Akce |
|------|---------|------|
| **none** → touching | tip touches element + curiosity > 0.3 + element grabbable | CSS rotate(±5°) translate(±8px), transition 0.3s |
| **touching** → interested | interest > 0.7 + mood curious/playful | Interest builds s sustained contact |
| **interested** → grabbing | held < 2 + curiosity > 0.5 + mood curious/playful | Element begins following tip |
| **grabbing** → dropping | grip depleted / stress > 0.7 / recoil / shy mood | Element returns with 0.8s ease-out |
| **dropping** → none | transition complete (~1s) | Cleanup data attributes |

Globální omezení:
- Max **2 held** elementy současně
- Max **4 disturbed** elementy současně
- Nikdy interaktivní elementy (`<a>`, `<button>`, `<input>`, `[role=button]`, `[tabindex]`)
- Pouze malé elementy (< 200px × 50px)

### 9C: Element selection a CSS pravidla

- Pouze `transform` (rotate, translate) a `color` — **nikdy** layout properties
- Touch: náhodný rotate ±5° + translate ±8px, auto-return po 4-18s
- Grab: element sleduje tip chapadla, grip decay = 1/holdDuration per second
- Hold duration: random 10-60s
- Gentle sway rotation při držení: sin(t) * 5°

### 9D: Midnight Cleanup

- Kontrola každých ~60s (3600 framů)
- Při přechodu dne: force-drop vše → smooth return 1.2s ease-out → cleanup atributy po 1.4s
- Ukládá `lili_last_cleanup` timestamp
- Běží i při boot() pro catch-up po dnech absence

### Tentacle → held element physics

Když chapadlo drží element, ideální target tipu se blenduje směrem k elementu (15% per frame). Chapadlo se tak fyzicky natahuje k drženému objektu.

## Rozhodnutí

1. **State machine per tentacle** — ne globální, protože každé chapadlo je semi-autonomní (distribuovaná inteligence)
2. **Original rect stored at grab time** — element position tracking přes `originalRect`, ne live `getBoundingClientRect()` (feedback loop prevention)
3. **wrapWords() before buildSpatialHash()** — aby nové `<span>` elementy byly přirozeně indexované v hash gridu
4. **Emergency drop** na flee/alert + high stress — biologicky: organismus upustí vše při útěku
5. **setTimeout pro attribute cleanup** — CSS transitions potřebují čas dokončit, synchronní cleanup by zrušil animaci

## Impact

- lili.js: 2522 → 2951 řádků (+429)
- Lili teď fyzicky interaguje se stránkou — dotýká se slov, občas je uchopí a nosí
- Mood systém (Phase 8) přímo ovlivňuje interakce: curious/playful → grab, shy → drop
- Midnight cleanup zajišťuje reversibilitu — ráno je stránka čistá
