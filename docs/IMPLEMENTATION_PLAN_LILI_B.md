# Lili B — DQN Agent Implementation Brief

**Status:** design finalizován, připraveno k implementaci
**Cíl:** druhý RL agent (DQN) na stejném canvasu jako Lili A (Q-Learning) pro srovnávací akademický experiment
**Datum finalizace briefu:** 2026-04-19

---

## 1. Experimentální rámec

### Tři paralelní experimenty, ne dva

- **Exp A — Lili A:** Q-Learning, 10 let, ontogeneze, **beze změny**, referenční agent
- **Exp B — Srovnání:** Q-Learning vs. DQN, hlavní akademické okno **prvních 2 let**
- **Exp C — Stabilizace:** jak udržet DQN stabilní na decade-scale autonomním běhu bez lidské intervence (samostatný výzkumný přínos)

### Staged commitment

- **Fáze 1 — 2 roky:** Lili B běží s plnou stabilizační sadou
- **Fáze 2 — checkpoint:** po 2 letech vyhodnocení
  - ✅ < 3 rollbacky/rok, váhy stabilní, loss nediverguje, FPS ≥ 55 → **pokračovat na 10 let**
  - ❌ Divergence 3× za sebou, rollback > 3/rok → **publikovat 2leté výsledky jako negative result** (stále validní paper)
- **Fáze 3 — 10 let:** podmíněné fází 2

### Paper framing

> *"Vanilla Q-Learning vs. stabilizovaný DQN — co unese decade-scale autonomní ontogenezi v browseru?"*

Závěr "DQN vyžaduje 7 stabilizačních mechanismů aby dohnal naivní Q-table" je sám o sobě zajímavý výsledek.

---

## 2. Filozofie (neporušovat)

- Zero dependencies — čistý vanilla JS
- Zero build pipeline — nový soubor `public/lili-b.js`
- Žádné keyframes, chování emerguje z učení
- Brain Interface pattern kompatibilní s `lili.js`: `brain.chooseAction()`, `brain.learn()`, `brain.serialize()`, `brain.deserialize()`
- Komentáře v angličtině, dokumentace v češtině

---

## 3. Co **nesmíš** udělat

- ❌ Žádné npm packages
- ❌ Žádné `<script src="tensorflow...">`, žádné externí ML knihovny
- ❌ Žádná alokace paměti v `requestAnimationFrame` loopu (pre-alokuj vše při init)
- ❌ **Nerozbít Lili A:** jediná povolená úprava v `lili.js` je **jednořádkové state exposition API** (`window.LiliA = { getState: () => ({...}) }`). **Žádná změna state vectoru A, reward funkce A, Q-table A, render logiky A, canvas handling A.**

---

## 4. Vizuální layout & canvas

### Princip

Canvas v `lili.js` **je už plně responsive a fullscreen** — nic se nemění.

### Ověřený stav canvasu v lili.js

- `position: fixed; width: 100vw; height: 100vh; pointer-events: none; z-index: ...`
- DPR-aware resize (`window.devicePixelRatio`)
- Debounced resize handler (150 ms, `CFG.resizeDebounceMs`)
- `document.hidden` → `paused = true` (tab-pause pattern — pozor, platí i pro Lili B)

### Co to znamená pro Lili B

- ❌ **Žádná nová canvas logika.** Lili B kreslí na ten **stejný** canvas co A
- ❌ **Žádný vlastní `<canvas>` element**
- ✅ Lili B si získá referenci na existující canvas přes `window.LiliA.getCanvas()` (součást exposition API) nebo přes `document.querySelector` podle znalosti id/class
- ✅ Pozice obou Lili v **normalizovaných souřadnicích 0–1**, render násobí aktuálním `canvas.width / dpr` a `canvas.height / dpr`
- ✅ Mobile responsive funguje automaticky — fullscreen viewport na každém zařízení

### Lili B render layer

- Kreslí se **po** Lili A ve stejném `tick()` / hook point
- Bez změny z-indexu canvasu (sdílejí jeden)
- Chladné chromatofory: modrá / fialová / tyrkysová (vs. teplé tóny A)
- Stejná velikost jako A
- `ctx.save()` / `ctx.restore()` kolem vlastního renderu aby nekontaminoval state Lili A

---

## 5. Platform strategy (desktop vs. mobile)

### Reálný problém: DQN na mobilním CPU

Forward pass (64→32) je levný. Ale backprop + Adam + batch 32 každé 4 kroky = jistý frame drop + battery drain na starších mobilech.

### Řešení: mobile = read-only ambassador

| Prostředí | Inference | Training | Zdroj vah |
|-----------|-----------|----------|-----------|
| Desktop   | ✅ ano    | ✅ ano, každé 4 kroky | localStorage (vlastní zápis) |
| Mobile    | ✅ ano    | ❌ ne     | localStorage (read-only) |

- Obě Lili se hýbou na mobilu i desktopu
- Trénink běží **jen na desktopu**
- Ti co navštíví stránku na desktopu = ti přispívají k učení
- Detekce: `window.innerWidth < 768 || /Mobi|Android/.test(navigator.userAgent)` → `training=false`

**Dopad na paper:** trénovací data pocházejí jen z desktop sessions. Fair, čisté, reprodukovatelné.

---

## 6. Training volume & phantom stimuli generator (NEW)

### Kritický nález

**Lili A nemá explicitní simulated environment / phantom cursor.** To co vypadalo jako "simulace když není user" je jen `idle` mood a autonomní behaviors (`wander`, `seekWhitespace`, `placeMemory`) které generují state transitions samy od sebe. To stačí pro Q-Learning na malé tabulce, ale **nestačí pro DQN** s 50k replay bufferem a batch 32.

### Low-traffic realita

Primární hostitel stránky = autor. Trénink kroků bude řádově méně než u typického public deploye. Pro DQN to znamená: bez phantom stimuli generátoru by B trénovala jen když je autor u PC.

### Phantom stimuli generator — nová feature (nikoliv import z A)

Nový modul v `lili-b.js` (volitelně sdílený s A přes malé API):

- Detekce user absence: `mousemove` timeout > 30 s → switch to phantom mode
- Phantom cursor: plausible trajektorie generované low-frequency Perlin noise, občasné "cílené" pohyby k Lili A/B, občasné skoky
- Phantom interakce: občasný simulovaný klik, občasná "přečtená oblast" (whitespace dwell)
- **Lili A state B stále pozoruje přímo** — A běží pořád, phantom jen nahrazuje kurzor

### Training frequency podle modu

| Mód | Frequency | Důvod |
|-----|-----------|-------|
| Real user (mousemove < 30 s) | train každé 4 kroky | plný signál |
| Phantom (idle > 30 s) | train každých 16 kroků | 4× nižší CPU + prevent sim-overfit |

### Prioritized Experience Replay

- Replay buffer ukládá `priority_flag: bool` (1 = real user, 0 = phantom)
- Při sampling batch 32: 50% s priority=1 pokud jsou dostupné, zbytek random
- **Důvod:** zabránit sim-to-real gapu — aby naučená policy odrážela i real cursor chování, ne jen simulátor

---

## 7. State, akce, reward

### State vector — FIX input dim jako konstantu PŘED psaním NN

```
S_B = [ ...base_state_of_A, other_x, other_y, other_stress, distance_to_other ]
```

- `base_state_of_A` = stejné features jako interní state Lili A (normalizované 0–1)
- `other_*` = pozice, stress a vzdálenost Lili A v normalizovaných souřadnicích
- **Dim musí být konstanta** definovaná jako `const INPUT_DIM = N;` před inicializací sítě

### Action space — stejný jako Lili A

Žádná asymetrie. Pokud A má 7 moods/actions, B má 7 stejných.

### Reward funkce — stejná filozofie jako A

- Odměna za průzkum (novelty bonus — navštívení nových oblastí)
- Odměna za interakci (přiblížení k druhé Lili do prahové vzdálenosti, ne překryv)
- Odměna za pohyb (penalizace stagnace)
- Malá penalizace za okraje canvasu

**Kritická podmínka fair comparison:** Lili A a B musí mít **funkčně ekvivalentní reward**. Pokud Lili B dostane "exploration + interaction bonus" který A nemá, není to srovnání architektur ale úloh. Rozšíření reward funkce aplikuj na obě.

### Ontogeneze

- Stejná jako Lili A, **stejné wall-clock délky fází** (hatchling → juvenile → adult → mature → elder)
- Žádná "zhuštěná verze" — fair comparison vyžaduje srovnávat ekvivalentní stádia ve stejném wall-clock okně

---

## 8. Tiny NN Engine

### Architektura

```
input (INPUT_DIM) → Dense(64, ReLU) → Dense(32, ReLU) → output (ACTION_DIM, linear)
```

### Implementační pravidla

- **Float32Array** pro všechno (váhy, biasy, aktivace, gradienty, replay buffer)
- **Pre-alokace** všech bufferů při init — žádná alokace v `rAF` loopu
- **Matrix multiply:** i-k-j loop order (cache friendly)
- Aktivace: **ReLU** hidden, **linear** output
- Inicializace: **He initialization** (`randn * sqrt(2/fanIn)`)
- Backprop s **gradient clipping max norm 1.0**
- **Adam** optimizer: `lr=0.001`, `β1=0.9`, `β2=0.999`, `ε=1e-8`

### Kompaktní layout

Jedno souvislé Float32Array na model:
```
[W1 | b1 | W2 | b2 | W3 | b3]
```
Offsety jako konstanty. Target network = druhá alokace stejné struktury.

---

## 9. DQN wrapper

- **Experience replay:** circular Float32Array, **size = 50 000** (zvětšeno z 10k kvůli decade-scale)
  - Schema: `[state, action, reward, next_state, done, priority_flag]`
  - Pre-alokováno jako jeden blok
- **Target network:** frozen copy, hard update každých **100 kroků**
- **ε-greedy:** start `1.0`, min `0.05`, decay `0.995` per episode
- **Batch size:** 32
- **Discount γ:** 0.95
- **Training frequency:** viz sekce 6 (real=4, phantom=16)

---

## 10. Plná stabilizační sada (všech 7, nevynechat)

| # | Mechanismus | Parametry |
|---|-------------|-----------|
| 1 | Experience replay | 50k circular Float32Array |
| 2 | Target network hard update | každých 100 kroků |
| 3 | **Anchor snapshot + rollback** | snapshot každých 7 dní; rollback pokud loss > 3σ nad baseline |
| 4 | **Adam lr schedule** | start 0.001, slow decay (např. × 0.9 každých 90 dní), floor 1e-5 |
| 5 | **Periodická re-juvenilizace ε** | curiosity spike (ε → 0.3) 1× za X měsíců; biologicky: mladické období zvědavosti se vrátí |
| 6 | Gradient clipping | max norm 1.0 |
| 7 | **Loss explosion detector** | rolling baseline (EMA); jakýkoliv sample > 5σ → okamžitý rollback na poslední anchor |

**Rollback mechanika:**
- Uchovávat poslední 3 anchor snapshoty (21 dní hloubky)
- Rollback = načti předchozí anchor, flush replay buffer, ε zpět na spike hodnotu
- Počítat rollbacky pro fáze 2 checkpoint

---

## 11. Persistence

- **localStorage key:** `lili_b_weights`
- **Formát:** JSON obsahující `{ weights: base64(Float32Array), anchors: [...], step: N, epoch: N, rollbacks: N, meta: {...} }`
- Snapshot rotation: current + 3 anchors
- Serializace/deserializace přes Brain Interface: `brain.serialize()`, `brain.deserialize(json)`

---

## 12. Logging & akademická vrstva

- **Export vah:** rozšířit klávesu `E` v `lili.js` o export Lili B vah jako JSON
- **Metriky logované průběžně:** reward per episode, avg loss, epsilon, rollback events, training step count, phantom vs. real ratio
- **Milestone snapshots:** měsíční (ne týdenní — Vercel repo bloat). Ukládají se do `data/snapshots/lili-b/` **mimo deploy** (`.vercelignore`), pro akademické účely
- **On-demand export:** klávesa `E` stáhne aktuální váhy + telemetrii jako JSON (žádný server involved)
- **Paper data output:** CSV export přes samostatnou klávesu (např. `Shift+E`)

---

## 13. Implementační pořadí (doporučené)

1. **Tiny NN engine** samostatně — unit-testovatelné forward/backward
2. **Adam optimizer + gradient clipping**
3. **Responsive canvas změna v `lili.js`** + state exposition API
4. **Phantom stimuli generator** (sdílený modul)
5. **DQN wrapper** (replay, target net, ε-greedy)
6. **Brain Interface pro Lili B** kompatibilní s A
7. **Render layer Lili B** (chladné chromatofory)
8. **Stabilizační sada** (všech 7, postupně)
9. **Persistence + export**
10. **Instrumentation + logging**

---

## 14. Success criteria (checkpoint po 2 letech)

| Kritérium | Threshold |
|-----------|-----------|
| Konvergence stabilního chování | do 30 dní |
| FPS s oběma agenty (desktop) | ≥ 55 |
| Rollback počet | < 3 za rok |
| Loss divergence events (bez rollback intervence) | 0 |
| Váhy stabilní (norm ratio) | během 90 dní beze změny > 2× |

**Fail state:** 3× rollback během týdne = experiment zastaven, 2letá data publikována.

---

## 15. Vercel Hobby (free tier) constraints

Deploy běží na Vercel free plánu. Implementace **musí zůstat** v těchto mantinelech:

### Hard constraints

- ❌ **Žádné serverless functions** (`/api/*`, Edge Functions) — 100k invocations/month limit, navíc 10s execution limit. Celá Lili B musí zůstat client-side.
- ❌ **Žádné server-side persistence** (žádné Postgres/KV/Blob) — váhy žijí v `localStorage` uživatele. Žádný cross-device sync.
- ❌ **Žádná auto-commit weekly snapshotů do repo** — 10 let × 52 týdnů × ~50-100 KB = 26-52 MB bloatu. Místo toho: **manual/milestone export** (měsíční nebo quarterly) přes klávesu `E` → uživatel stáhne JSON.

### Bandwidth management

- Current `lili.js`: 356 KB (~80-100 KB gzipped)
- Target pro `lili-b.js`: **< 50 KB uncompressed** (~15 KB gzipped)
- Vercel Hobby: 100 GB bandwidth/měsíc — při nízkém traffic mnohonásobná rezerva, ale nepouštět pod kontrolu
- Žádné externí CDN assety, žádné fonty, žádné images navíc

### Build & deploy

- Static deploy only, žádný build step (zero deps filozofie)
- Deployment size limit 100 MB — nedovolit `data/snapshots/` růst nekontrolovaně, použít `.vercelignore` pokud tam snapshoty nepatří pro runtime
- Git repo: zvážit `.gitignore` pro snapshoty, nebo git LFS pokud je commitovat

### Runtime cost (uživatelův browser, ne Vercel)

- Replay buffer 50k × state_dim × 4 bytes — např. 50k × 20 × 4 = **4 MB RAM** per user
- Desktop: OK. Mobile: na starších zařízeních hraniční → mobile = inference-only už tohle řeší
- localStorage kvóta ~5-10 MB per origin → snapshot rotace (current + 3 anchors) musí respektovat tenhle strop

### Checklist před deployem

- [ ] Žádný `fetch()` na vlastní doménu (kromě static assetů)
- [ ] Žádné `/api/*` routes
- [ ] `lili-b.js` gzip size < 20 KB
- [ ] `data/snapshots/` v `.vercelignore` nebo `.gitignore`
- [ ] localStorage usage kontrolován (rotace funguje)

---

## 16. Ověřené premisy (vs. dohady)

- ✅ Lili A používá `requestAnimationFrame` tick loop → training jen když je stránka otevřená a **tab aktivní** (lili.js má `visibilitychange` handler → `paused = true`)
- ✅ Lili A **nemá** explicitní phantom cursor / simulated environment → phantom stimuli generator je **nová feature**, ne import
- ✅ Lili A má Brain Interface pattern (`brain.decideMood()`, `brain.learn()`, `brain.serialize()`, `brain.deserialize()`) — Lili B ho musí zrcadlit
- ✅ `localStorage` se v `lili.js` používá pro `placeMemory`, `visitProfile`, `psychosom`, `offspring` — Lili B přidá vlastní klíč bez kolize
- ✅ Canvas v `lili.js` je **plně responsive a fullscreen** (`100vw × 100vh`, DPR-aware, debounced resize) — Lili B se na něj přidá bez vlastního canvasu a bez úprav resize logiky
- ✅ Mobile responsive: funguje automaticky díky fullscreen viewport layoutu
