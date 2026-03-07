# LILI — Autonomous Digital Companion

## Project Requirements Document v1.0

**Autor:** Michal Strnadel
**Target runtime:** Claude Code (Opus)
**Typ:** Standalone JavaScript modul, zero dependencies
**Jméno entity:** Lili

---

## 0. Executive Summary pro Claude Code

Postav `lili.js` — jeden soubor, nula závislostí, nula build-pipeline vazeb. Lili je chobotnice žijící na HTML stránce jako autonomní organismus řízený Reinforcement Learning (Q-Learning). Vše co dělá, vychází z jejího učení a interakce s prostředím. Nic není skriptované autorem — žádné předepsané hlášky, žádné řízené Easter eggy, žádné naprogramované "vtipné" reakce.

Lili je akademický experiment v digitální ontogenezi. Její chování emerguje z RL odměn a trestů, ne z if/else větví.

Životní cyklus: 10 reálných let. Začíná jako maličká, chaotická hatchling. Končí jako tichý, téměř nehybný elder. Vše mezi tím se vyvíjí kontinuálně.

**Soubor musí fungovat připojením jednoho `<script>` tagu do jakéhokoliv HTML. Žádná konfigurace, žádné závislosti, žádný build.**

---

## 1. Filozofický rámec

### 1.1 Co Lili JE

Autonomní digitální organismus. Zvíře s prvkem inteligence, které žije na webové stránce jako ve svém habitatu. Referenční charakter: zvíře z knihy "Hora mezi námi" — má vlastní logiku přežití, vlastní rytmus, nepotřebuje člověka. Neperformuje. Prostě je.

Inspirační zdroje:
- **Dosidicus** (GitHub: ViciousSquid/Dosidicus) — Tamagotchi-style digital pet squid s Hebbian learning, neurogenesis, transparentní neural network. Klíčový koncept: "A transparent cognitive sandbox disguised as a digital pet squid."
- **Black Mirror: Thronglets** (S7, "Plaything") — fiktivní digitální organismy jejichž biologie je výhradně digitální.
- **Karpathy's reinforcejs** (GitHub: karpathy/reinforcejs) — Reinforcement Learning agents v čistém JavaScriptu. Referenční implementace Q-Learning a DQN v prohlížeči.
- **Craig Reynolds' Steering Behaviors** — matematický základ autonomní navigace ("Boids", 1986).
- **FABRIK IK algoritmus** — Forward And Backward Reaching Inverse Kinematics pro organickou procedurální animaci chapadel.

### 1.2 Co Lili NENÍ

- Není to Tamagotchi. Nepotřebuje péči uživatele, neumírá bez interakce.
- Není to skriptovaná animace. Žádné předepsané trasy, žádné keyframes.
- Není to Easter egg s autorskými hláškami. Žádné `if (age > 100) return "Preferuji klidná místa."` — to je protimluv k autonomii.
- Není to gimmick na upoutání pozornosti. Je to tichý společník, ambientní přítomnost.
- Není to chatbot, nemá generativní dialogy.

### 1.3 Proč chobotnice

Biologicky decentralizovaný nervový systém (8 chapadel s vlastními neuronovými sítěmi) přirozeně mapuje na:
- 8 nezávislých IK řetězců pro procedurální animaci
- Chromatofory pro vizualizaci vnitřních stavů bez UI
- Absence kostry = plynulý pohyb kolem DOM elementů
- Symbolická inteligence: chobotnice jsou nejinteligentnější bezobratlí

---

## 2. Architektura — Izolace a nezávislost

### 2.1 Deployment model

```
/public/lili.js          ← jediný soubor, MIMO build pipeline
```

Integrace do webu:
```html
<script src="/lili.js" defer></script>
```

Lili si při bootu sama vytvoří:
- `<canvas id="lili-canvas">` — position: fixed, 100vw × 100vh, pointer-events: none, z-index: 9999
- Vše ostatní co potřebuje (tooltip div, debug div) — samo, žádné HTML prerequisity

### 2.2 Izolační pravidla

- Žádný zásah do `<head>`, meta tagů, existujících stylesheetů
- Žádné globální CSS (vše scoped na lili-* selektory)
- Žádné zachytávání klávesových zkratek (kromě debug toggle)
- Žádné síťové požadavky — zero network, zero API, zero cookies
- Canvas neblokuje prokliknutí (pointer-events: none)
- Žádné změny DOM layoutu — pouze CSS transform a color na dotčených elementech
- MutationObserver pro detekci dynamických změn obsahu (lazy loading, SPA navigace)

### 2.3 Co Lili NEOVLIVŇUJE

- Head, meta tagy, stylesheety
- Layout, position, display, width, height jakéhokoliv DOM elementu
- Keyboard shortcuts (kromě debug klávesy)
- Síťové požadavky
- Cookies
- Prokliknutí na stránku

---

## 3. Reinforcement Learning — Jádro autonomie

**Toto je nejdůležitější sekce celého dokumentu. Lili NENÍ state machine s if/else větvením. Je to RL agent.**

### 3.1 Paradigma

Q-Learning — bezmodelová forma Reinforcement Learning. Agent se učí optimalizovat chování formou pokus-omyl. Nevyžaduje model prostředí, učí se přímo z interakcí.

Referenční implementace: `karpathy/reinforcejs` (GitHub) — čistý JS, žádné závislosti, funguje v prohlížeči.

### 3.2 Markovský rozhodovací proces (MDP)

**State Space (stavy prostředí):**

Stav je vektor tvořený kombinací těchto senzorických vstupů:

| Senzor | Typ | Rozsah | Popis |
|--------|-----|--------|-------|
| cursor_proximity | continuous → discretized | far / medium / near | Vzdálenost kurzoru od těla Lili |
| cursor_velocity | continuous → discretized | still / slow / fast / aggressive | Rychlost pohybu kurzoru |
| dom_density | continuous → discretized | sparse / medium / dense | Hustota DOM elementů v okolí (spatial hash) |
| whitespace_proximity | continuous → discretized | in_whitespace / near / far | Blízkost prázdného prostoru |
| scroll_state | discrete | idle / active | Uživatel scrolluje / nescrolluje |
| time_of_day | discrete | morning / afternoon / evening / night | Z `new Date().getHours()` |
| age_phase | discrete | hatchling / juvenile / adult / mature / elder | Aktuální životní fáze |

Diskretizace: Continuous hodnoty se mapují na 3-4 buckety pro udržení velikosti Q-tabulky v řádech tisíců (ne milionů) záznamů.

**Action Space (dostupné akce):**

| Akce | Popis |
|------|-------|
| wander | Reynoldsův wander — organický drift po křivkách |
| seek_whitespace | Aktivní hledání prázdného prostoru na stránce |
| flee | Útěk od hrozby (kurzor) s predikcí trajektorie (Evade) |
| explore_dom | Přiblížení k DOM elementu, haptická interakce chapadlem |
| idle | Zastavení, minimální pohyb, "meditace" |
| seek_edge | Přesun k okraji viewportu |
| follow_slow | Pomalé, opatrné sledování kurzoru z bezpečné vzdálenosti |

**Reward Function (odměny a tresty):**

Toto je klíčové — odměny DEFINUJÍ chování Lili. Žádné jiné mechanismy neřídí co dělá.

| Situace | Odměna | Důvod |
|---------|--------|-------|
| Agent v whitespace zóně, uživatel čte (kurzor pomalý/stojí) | +1.0 | Správné sdílení prostoru — tichý společník |
| Agent úspěšně utekl od rychlého kurzoru | +0.8 | Sebezáchova — zdravý instinkt |
| Agent u DOM elementu, interaguje chapadlem, nízký stres | +0.5 | Zvědavost — zdravé explorativní chování |
| Agent na okraji viewportu, uživatel aktivní ve středu | +0.3 | Respektování uživatelského prostoru |
| Agent nad textem, kurzor stojí (uživatel čte přes Lili) | -2.0 | Blokování čtení — nejhorší hřích |
| Agent idle příliš dlouho (> threshold modulovaný věkem) | -0.5 | Stagnace (snižuje se s věkem — elder idle je OK) |
| Agent ve flee, ale kurzor je pomalý/daleko | -0.3 | Zbytečný poplach |
| Agent opakuje stejnou akci > N kroků | -0.2 | Stereotypie — penalizace za zaseknutí |
| Agent kolize s DOM elementem (překrývá ho) | -1.0 | Narušení stránky |

### 3.3 Bellmanova rovnice

```
Q(s, a) ← Q(s, a) + α * [R + γ * max_a'(Q(s', a')) - Q(s, a)]
```

Hyperparametry:
- `α` (learning rate): 0.1 — stabilní učení
- `γ` (discount factor): 0.85 — silný důraz na budoucí odměny
- `ε` (exploration rate): DYNAMICKÝ — mění se s věkem (viz sekce 4)

### 3.4 Epsilon-Greedy strategie

```
if (Math.random() < epsilon) {
    action = randomAction();  // explorace
} else {
    action = argmax(Q[state]); // exploatace naučeného
}
```

Epsilon se mění s věkem:
- Hatchling: ε = 0.85 (téměř náhodné — vše zkouší)
- Juvenile: ε = 0.55 (mix)
- Adult: ε = 0.25 (převážně naučené)
- Mature: ε = 0.12 (silné rutiny)
- Elder: ε = 0.05 (téměř deterministický — moudrý)

### 3.5 Decision cycle

- Q-Learning rozhodnutí se vyhodnocuje každých 30-60 framů (ne každý frame — příliš drahé a šum)
- Mezi rozhodnutími steering behaviors plynule vykonávají zvolenou akci
- Reward se počítá na konci každého decision cycle na základě výsledku akce

### 3.6 Persistence Q-tabulky

- Q-tabulka se serializuje do JSON a ukládá do `localStorage` klíč `lili_qtable`
- Ukládání: každých ~600 framů (~10s) a při `beforeunload`
- Při startu: načtení existující Q-tabulky = Lili pokračuje tam kde skončila
- Při prázdném localStorage: inicializace Q-tabulky na nuly = nová inkarnace

### 3.7 Co Q-Learning NEDĚLÁ

- Neřídí vizuální styl (barvy řeší chromatofory na základě stavů)
- Neřídí fyziku chapadel (ta je procedurální přes FABRIK)
- Neřídí stárnutí (to je čistě časové)
- Negeneruje text ani hlášky

---

## 4. Životní cyklus — Chronobiologie na 10 let

### 4.1 Genesis a perzistence

```javascript
// První návštěva — NIKDY nepřepisovat
if (!localStorage.getItem('lili_genesis')) {
    localStorage.setItem('lili_genesis', Date.now().toString());
}
```

Věk = `(Date.now() - lili_genesis)` mapovaný na biologický čas.

### 4.2 Časový model

**Životní rozpětí: 10 reálných let.**

Mapování fází na reálný čas:

| Fáze | Reálný čas od genesis | Popis |
|------|----------------------|-------|
| Hatchling | 0 — 2 týdny | Maličká, chaotická, všechno zkouší |
| Juvenile | 2 týdny — 3 měsíce | Roste, učí se, vytváří preference |
| Adult | 3 měsíce — 2 roky | Stabilní, teritoriální, sebevědomá |
| Mature | 2 roky — 6 let | Klidná, má silné rutiny, moudrá |
| Elder | 6 let — 10 let | Téměř nehybná, meditující, monument |

Poznámka: Fáze jsou plynulé přechody, ne skoky. Parametry se interpolují lineárně mezi fázemi.

### 4.3 Co se mění s věkem

| Parametr | Hatchling | Juvenile | Adult | Mature | Elder |
|----------|-----------|----------|-------|--------|-------|
| Tělo radius (px) | 8-12 | 14-18 | 20-24 | 26-28 | 28-32 |
| Max velocity | 4.0 | 3.0 | 2.0 | 1.2 | 0.4 |
| Max steering force | 0.4 | 0.3 | 0.2 | 0.12 | 0.05 |
| ε (exploration) | 0.85 | 0.55 | 0.25 | 0.12 | 0.05 |
| Tentacle frequency (Hz) | 0.08 | 0.06 | 0.04 | 0.025 | 0.015 |
| Tentacle count visible | 8 | 8 | 8 | 8 | 8 |
| Idle threshold (ms) | 8000 | 5000 | 3000 | 2000 | 800 |
| DOM interaction probability | 0.7 | 0.5 | 0.3 | 0.15 | 0.05 |
| Damping factor | 0.97 | 0.95 | 0.93 | 0.90 | 0.85 |
| Glow intensity | 0.4 | 0.5 | 0.6 | 0.5 | 0.3 |

**Klíčový princip: Elder Lili je téměř nehybná. To NENÍ bug. To je vlastnost.**

### 4.4 Promazání localStorage = nová inkarnace

Pokud uživatel promaže localStorage:
- `lili_genesis` zmizí
- Při dalším načtení se vytvoří nový genesis timestamp
- Q-tabulka je prázdná
- Lili začíná znovu jako Hatchling — nový život

---

## 5. Navigace — Steering Behaviors (Reynolds)

### 5.1 Vektorový model pohybu

Lili má:
- `position` — Vec2 (x, y)
- `velocity` — Vec2 (aktuální rychlost)
- `acceleration` — Vec2 (aktuální zrychlení)

Každý frame:
```
steering = sum(weighted_behaviors)
steering = truncate(steering, maxForce)  // modulováno věkem
velocity += steering
velocity = truncate(velocity, maxSpeed)  // modulováno věkem
velocity *= damping                      // modulováno věkem
position += velocity
```

### 5.2 Behaviory

**Wander:**
- Projekce kruhu před agentem na vzdálenost `d`
- Na obvodu kruhu se v čase posouvá target bod (Perlin noise, ne random)
- Výsledek: organický, plynulý pohyb po křivkách
- NIKDY náhodné koordináty

**Seek / Arrive:**
- Vektor k cíli, normalizovaný × maxSpeed
- Arrive = Seek se zpomalením v blízkosti cíle (deceleration radius)

**Flee / Evade:**
- Flee: opačný vektor od pozice hrozby
- Evade: predikce budoucí pozice kurzoru na základě jeho velocity
- Evade >> Flee (sofistikovanější únik)

**Obstacle Avoidance:**
- Ahead vector délky proportionální k rychlosti: `lookAheadDist = speed / maxSpeed * MAX_SEE_AHEAD`
- Test kolize: bounding circle agenta posunutý o ahead vector vs. bounding boxy DOM elementů (ze spatial hashe)
- Při detekci: odpuzovací vektor kolmo k překážce

**Boundary:**
- Měkké odpuzování od okrajů viewportu
- Ne tvrdé odrazy — plynulé stočení

### 5.3 Vážení behaviourů podle aktuální RL akce

| RL Akce | Wander | Seek WS | Flee | Obstacle | Boundary | Seek DOM | Follow |
|---------|--------|---------|------|----------|----------|----------|--------|
| wander | 1.0 | 0.2 | 0 | 0.8 | 0.5 | 0 | 0 |
| seek_whitespace | 0.1 | 1.0 | 0 | 0.8 | 0.5 | 0 | 0 |
| flee | 0 | 0 | 1.5 | 0.3 | 0.8 | 0 | 0 |
| explore_dom | 0.2 | 0 | 0 | 0.5 | 0.5 | 1.0 | 0 |
| idle | 0 | 0 | 0 | 0 | 0.3 | 0 | 0 |
| seek_edge | 0.1 | 0 | 0 | 0.6 | 0 | 0 | 0 |
| follow_slow | 0.1 | 0 | 0 | 0.8 | 0.5 | 0 | 0.6 |

Obstacle avoidance a boundary VŽDY aktivní (bezpečnostní vrstva).

---

## 6. Spatial Hashing — Výkonová optimalizace

### 6.1 Problém

DOM stránky může mít stovky elementů. Testování kolizí agent vs. všechny = O(n²) = smrt FPS.

### 6.2 Řešení

Spatial Hash Grid:
- Viewport rozdělen na buňky 120 × 120 px
- Při bootu + window resize + MutationObserver: všechny relevantní DOM elementy se vloží do hash mapy podle buněk
- Klíč buňky: `key = Math.floor(x / cellSize) + "," + Math.floor(y / cellSize)`
- Agent testuje kolize pouze v 9 buňkách (vlastní + 8 sousedů)
- Složitost: O(1) místo O(n²)

### 6.3 Relevantní DOM elementy

Indexovat:
- `<p>`, `<h1>`-`<h6>`, `<span>`, `<a>`, `<img>`, `<div>` s viditelným obsahem
- Elementy s `offsetWidth > 0 && offsetHeight > 0`

Ignorovat:
- `<script>`, `<style>`, `<meta>`, `<link>`
- Hidden elementy (`display: none`, `visibility: hidden`)
- Lili vlastní canvas a DOM elementy

### 6.4 Rebuild triggers

- `window.resize`
- `MutationObserver` na `document.body` (childList, subtree)
- Throttled: max 1× za 500ms

---

## 7. FABRIK Inverzní Kinematika — Chapadla

### 7.1 Konfigurace

- 8 chapadel, každé 8 segmentů
- Segment délka: modulována věkem (kratší u hatchling, delší u adult)
- Ukotvení: rovnoměrně po obvodu těla (45° rozestupy)
- Každé chapadlo = nezávislý IK řetězec

### 7.2 FABRIK algoritmus

Pro každé chapadlo v každém frame:

**Forward Reach:**
1. Přesuň tip (špičku) na target pozici
2. Pro každý segment od tipu k base: přepočítej pozici tak aby délka segmentu zůstala konstantní

**Backward Reach:**
1. Vrať base zpět na anchor point u těla
2. Pro každý segment od base k tipu: přepočítej pozici

3-4 iterace per frame = dostatečná konvergence.

### 7.3 Target generování

Targets pro špičky chapadel se generují podle kontextu:

- **Plavání (wander/seek):** Vlnová funkce se zpožděním vůči těžišti. Sinusoidní offset per chapadlo, fáze posunutá o `(index / 8) * 2π`. Frekvence modulována věkem.
- **Blízko DOM elementu (explore_dom):** 1-2 chapadla cílí na nejbližší hranu DOM bounding boxu (z spatial hashe). Ostatní pokračují v plavání.
- **Flee:** Chapadla se stahují dozadu (za tělo) — aerodynamika strachu
- **Idle:** Chapadla gravitačně klesají dolů, minimální pohyb — jen jemné pulzování

### 7.4 Rendering chapadel

- Quadratic Bézier curves přes FABRIK uzly (ne přímé linie)
- Šířka se zužuje od base (tlusté) k tipu (tenké)
- Perlin noise na šířce pro organickou variabilitu
- `globalAlpha` fade na tipech pro jemný efekt

---

## 8. DOM Interakce a Noční Úklid

### 8.1 Princip

Lili interaguje s prvky stránky jako zvíře — fyzicky, zvědavě, ne jako UI. Žádné "označování textu", žádné "čtení". Haptická zvědavost.

### 8.2 Typy interakcí

| Cíl | Chování | CSS efekt |
|-----|---------|-----------|
| Písmena/slova | Chapadlo se přiblíží → slovo se mírně pootočí, poposune | `transform: rotate(Xdeg) translate(Ypx, Zpx)` |
| Obrázky | Zastaví se, chapadlo se natáhne k hraně | Žádný efekt na obrázek — jen vizuální "koukání" |
| Nadpisy | Větší objekty — obejde je, opakovaně navštíví | `transform: rotate(Xdeg)` velmi mírně |
| Whitespace | Preferovaná zóna odpočinku | Žádné efekty |

### 8.3 Implementace DOM interakce

```javascript
// Dotknutí elementu
el.style.transition = 'transform 0.3s ease';
el.style.transform = `rotate(${angle}deg) translate(${dx}px, ${dy}px)`;
el.dataset.liliTouched = Date.now().toString();
```

Pravidla:
- Max `rotate`: ±5°
- Max `translate`: ±8px
- Max 4 disturbed elementy současně
- Nové interakce NEnahrazují staré — počkají až slot se uvolní
- Každá interakce trvá náhodně 4-18 sekund, pak se prvek vrátí (smooth transition 0.8s)

### 8.4 Word-level interakce

Pro interakci s jednotlivými slovy potřebujeme je obalit do `<span>`:

```javascript
// Při bootu — jednou, nevratně
// Procházet textové uzly a obalit slova do <span class="lili-word">
```

**Důležité:** Toto se provede jednou při inicializaci. Neprovádět opakovaně.

### 8.5 Noční úklid (Midnight Cleanup)

Každý den o **00:00** se stránka vrátí do původního stavu.

```javascript
// Každou minutu:
const now = new Date();
const lastCleanup = localStorage.getItem('lili_last_cleanup');
const lastDate = lastCleanup ? new Date(parseInt(lastCleanup)).toDateString() : null;

if (now.toDateString() !== lastDate && now.getHours() >= 0) {
    // Cleanup: all touched elements → smooth return
    document.querySelectorAll('[data-lili-touched]').forEach(el => {
        el.style.transition = 'transform 1.2s ease-out, color 1.2s ease-out';
        el.style.transform = '';
        el.style.color = '';
    });
    
    setTimeout(() => {
        document.querySelectorAll('[data-lili-touched]').forEach(el => {
            el.style.transition = '';
            delete el.dataset.liliTouched;
        });
    }, 1400);
    
    localStorage.setItem('lili_last_cleanup', Date.now().toString());
}
```

**Efekt:** Jako když ráno uklidíš byt. Prvky jsou na místě, ale včerejší stopy zmizely. Lili stále žije — její interakce jen začínají nanovo.

### 8.6 Reverzibilita — Zlaté pravidlo

**Žádná interakce Lili s DOM nesmí změnit layout.** Pouze:
- `transform` (rotate, translate)
- `color` (mírná změna tónu)
- `data-*` atributy

**Nikdy:**
- `width`, `height`, `display`, `position`, `margin`, `padding`
- `innerHTML`, `textContent`
- Přidávání/odebírání DOM elementů (kromě wrappování slov při bootu)

---

## 9. Vizuální systém — Procedurální rendering

### 9.1 Canvas

```javascript
const canvas = document.createElement('canvas');
canvas.id = 'lili-canvas';
canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
document.body.appendChild(canvas);
```

- `canvas.width = window.innerWidth * devicePixelRatio`
- `canvas.height = window.innerHeight * devicePixelRatio`
- Rescale context pro HiDPI
- Resize handler s debounce

### 9.2 Tělo

- Ellipse: `radiusX = bodyR * 0.78`, `radiusY = bodyR * 1.0` (mírně oválné jako reálná chobotnice)
- `bodyR` modulován věkem (viz tabulka v sekci 4)
- Perlin/Simplex noise na okrajích pro organickou deformaci
- Glow: `radialGradient` kolem těla, alfa modulována denní dobou

### 9.3 Oči

- 2 oči, pozicované na horní třetině těla
- Pupily: sledují kurzor v omezené míře (max offset = radius oka × 0.3)
- Při flee: pupily se rozšíří (stress)
- Při idle/sleep: oči přivřené (arc místo circle)

### 9.4 Chromatofory — Barevný systém

Barva je funkční vizualizace vnitřních stavů. Žádná dekorace.

**Báze: HSL model**

```javascript
function getLiliColor(timeOfDay, age, stress) {
    // Base hue: 200° (ocean blue) → 240° (deep indigo) s věkem
    let hue = lerp(200, 240, ageNormalized);
    
    // Cirkadiánní posun
    // Ráno (6-12): hue -= 20 (teplejší, světlejší)
    // Odpoledne (12-18): neutral
    // Večer (18-22): hue += 10
    // Noc (22-6): hue += 30, saturation -= 15
    
    // Stres: hue -= 50 (zahřátí k červené), saturation += 25
    hue -= stress * 50;
    
    let saturation = lerp(60, 80, ageNormalized) + stress * 25;
    let lightness = lerp(55, 35, ageNormalized); // tmavne s věkem
    
    // Cirkadiánní lightness
    // Ráno: +10
    // Noc: -15
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}
```

| Faktor | Efekt | Implementace |
|--------|-------|-------------|
| Denní doba | Ráno = světlá akvamarínová, noc = tmavá indigová | `new Date().getHours()` → HSL interpolace |
| Věk | Mladý = světlejší, starší = hlubší, sytější | `ageNormalized` → hue posun 200°-240° |
| Stres | Vysoký stres = zahřátí tónu, perturbace barvy | `stress` (0-1) → hue shift, saturation boost |
| Flee event | Okamžité probliknutí kontrastní barvou | Flash efekt, decay 300ms |

### 9.5 Rendering pipeline (per frame)

1. `ctx.clearRect(0, 0, width, height)`
2. Render glow (radialGradient)
3. Render chapadla (bezier curves, back-to-front)
4. Render tělo (filled ellipse s noise deformací)
5. Render oči
6. (Debug mode): render spatial hash grid, velocity vectors, state info

---

## 10. Senzorický systém — Vstupy

### 10.1 Kurzor

```javascript
let mouseX = 0, mouseY = 0, mouseVX = 0, mouseVY = 0, mouseSpeed = 0;
document.addEventListener('mousemove', (e) => {
    mouseVX = e.clientX - mouseX;
    mouseVY = e.clientY - mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseSpeed = Math.sqrt(mouseVX*mouseVX + mouseVY*mouseVY);
});
```

- `mouseSpeed` smoothed přes exponenciální klouzavý průměr
- Klasifikace: still (< 2), slow (2-8), fast (8-20), aggressive (> 20)

### 10.2 Scroll

```javascript
let scrolling = false, scrollTimeout;
window.addEventListener('scroll', () => {
    scrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => scrolling = false, 200);
});
```

### 10.3 Denní doba

```javascript
function getTimeOfDay() {
    const h = new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 18) return 'afternoon';
    if (h >= 18 && h < 22) return 'evening';
    return 'night';
}
```

### 10.4 Stress model

```javascript
// Stress je floating point 0-1, smoothed
// Roste při: rychlém kurzoru blízko, opakovaných flee, kolizích
// Klesá při: idle, whitespace, čas bez hrozby
stress += (stressInput - stress) * 0.05; // exponential smoothing
```

---

## 11. Interakce s uživatelem — Kliknutí

### 11.1 Detekce

Canvas má `pointer-events: none`, takže klik projde do stránky. Lili potřebuje vlastní click detection:

```javascript
document.addEventListener('click', (e) => {
    const dx = e.clientX - lili.x;
    const dy = e.clientY - lili.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < lili.bodyR * 2.5) {
        onLiliClicked();
    }
});
```

- Hitbox = `bodyR * 2.5` (tolerantní — Lili se hýbe, je těžké trefit)
- Elder/stressed Lili: ještě větší hitbox (kompenzace)

### 11.2 Co se stane při kliknutí

Lili **nepřeruší** svou akci. Pouze se zobrazí tooltip.

**Tooltip obsah — emergentní, ne skriptovaný:**

```javascript
function getTooltipContent() {
    const age = getAge(); // formátovaný věk
    const phase = getLifePhase();
    const topAction = getTopQAction(); // akce s nejvyšší Q-hodnotou v aktuálním stavu
    const visits = localStorage.getItem('lili_visits') || 0;
    
    return {
        name: 'Lili',
        age: age,           // "3 dny" / "2 měsíce" / "1 rok, 4 měsíce"
        phase: phase,       // "hatchling" / "juvenile" / etc.
        preference: topAction, // "wander" / "seek_whitespace" / etc.
        visits: visits
    };
}
```

Tooltip zobrazí **fakta o stavu enginu**, ne autorské hlášky:
- Jméno: Lili
- Věk (formátovaný lidsky čitelně)
- Fáze života
- Aktuální preferovaná akce (top Q-value)
- Počet návštěv stránky

**Formát tooltipu:** Minimalistický, monospace font, ostrý kontrast s organickým canvasem. Zmizí po 3.5s.

### 11.3 Debug panel

- Toggle: klávesa `D` (pouze `keydown`, nekonflikuje s ničím)
- Obsah: phase, age, current state vector, current action, Q-values pro aktuální stav, stress, velocity magnitude, disturbed elements count, FPS, spatial hash cell count
- Styl: fixed pozice, tmavý background, monospace, 12px, semi-transparent
- Neviditelný pro běžné návštěvníky

---

## 12. Persistence — localStorage schema

| Klíč | Typ | Popis | Přepisovatelný |
|------|-----|-------|---------------|
| `lili_genesis` | string (timestamp) | Moment narození. NIKDY nepřepisovat. | NE |
| `lili_qtable` | string (JSON) | Serializovaná Q-tabulka | ANO (každých ~10s) |
| `lili_position` | string (JSON: {x, y}) | Poslední pozice | ANO (každých 5s) |
| `lili_last_cleanup` | string (timestamp) | Timestamp posledního midnight cleanup | ANO |
| `lili_visits` | string (number) | Počet načtení stránky | ANO (inkrement při bootu) |

Celkový localStorage footprint: < 15KB

---

## 13. Modulární struktura (IIFE pattern)

Lili.js je jeden soubor, ale interně čistě organizovaný:

```javascript
(function() {
    'use strict';
    
    // ══════════════════════════════════════════
    // CONFIG — všechny konstanty na jednom místě
    // ══════════════════════════════════════════
    const CFG = { /* ... */ };
    
    // ══════════════════════════════════════════
    // VEC2 — minimální vektorová matematika
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // NOISE — Simplex/Perlin noise generátor
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // PERSISTENCE — localStorage read/write
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // AGE SYSTEM — getAge(), getLifePhase(), interpolateParams()
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // CANVAS — setup, resize handler, HiDPI
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // SENSORS — mouse tracking, scroll, time-of-day, stress
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // SPATIAL HASH — buildGrid(), getNearby(), rebuild triggers
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // Q-LEARNING — qTable, chooseAction(), updateQ(), computeReward(), getState()
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // WORD INDEXER — wrap words in spans (boot only)
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // DOM INTERACTOR — disturbWord(), cleanupElement(), midnightCleanup()
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // STEERING — wander, seek, flee, evade, obstacleAvoid, boundary
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // FABRIK IK — solveFABRIK(), tentacle management
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // CHROMATIC — getLiliColor(), stress flash, circadian
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // LILI STATE — hlavní state objekt, position, velocity, acceleration
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // UPDATE LOOP — requestAnimationFrame, decision cycle, physics
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // RENDER — canvas drawing pipeline
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // UI — click detection, tooltip, debug panel
    // ══════════════════════════════════════════
    
    // ══════════════════════════════════════════
    // BOOT — DOMContentLoaded, init sequence
    // ══════════════════════════════════════════
    
})();
```

---

## 14. Výkonové cíle

| Metrika | Cíl |
|---------|-----|
| FPS | 60fps stabilně na moderním desktopu |
| CPU overhead | < 2% idle, < 5% při plném pohybu |
| Memory footprint | < 5MB JS heap |
| Inicializace | < 200ms od DOMContentLoaded |
| localStorage | < 15KB celkový zápis |
| Soubor velikost | < 50KB minified (target), < 80KB unminified |

Optimalizace:
- Spatial hashing eliminuje O(n²)
- requestAnimationFrame — rendering jen když tab je aktivní
- `document.hidden` check — pozastavení při neviditelném tabu
- Canvas clearRect na začátku každého frame
- Word indexing (span wrapping) pouze jednou při boot
- Q-Learning decision cycle throttled (ne každý frame)
- Chapadla: FABRIK pouze 3-4 iterace (ne více)

---

## 15. Open Source reference a závislosti

**Zero runtime závislosti.** Ale tyto projekty slouží jako referenční implementace pro studium:

| Projekt | Co z něj vzít | URL |
|---------|--------------|-----|
| Dosidicus | Filozofie transparentního cognitive sandboxu, Hebbian learning patterns | github.com/ViciousSquid/Dosidicus |
| karpathy/reinforcejs | Q-Learning a DQN implementace v čistém JS | github.com/karpathy/reinforcejs |
| ConvNetJS RL demo | Deep Q-Learning v prohlížeči, eye-sensing agent | cs.stanford.edu/people/karpathy/convnetjs/demo/rldemo.html |
| Craig Reynolds' Steering | Originální Boids a steering behaviors paper | red3d.com/cwr/steer/ |
| FABRIK paper | Aristidou & Lasenby, 2011 | andreasaristidou.com/FABRIK.html |
| LearnSnake | Q-Learning v JS prohlížeči s canvas | italolelis.com/snake |

---

## 16. Out of Scope (v1.0)

- Mobilní touch interakce (budoucí iterace)
- WebGL / WebAssembly renderer (Canvas 2D dostačuje)
- Více instancí Lili na stránce
- Serverová perzistence / sync mezi zařízeními
- Generativní dialogy přes LLM API
- Audio / zvukové efekty
- Accessibility (ARIA, screen reader) — ambientní easter egg je definičně skrytý
- Deep Q-Network (DQN s neural net) — tabulární Q-Learning dostačuje pro state space této velikosti

---

## 17. Implementační pořadí (doporučené)

1. **Kostra + Canvas + Boot** — IIFE, canvas setup, resize, HiDPI
2. **Vec2 + Noise** — vektorová matematika, Simplex noise
3. **Steering Behaviors** — wander, seek, flee, boundary (bez RL, fixní behaviour pro testování)
4. **FABRIK IK** — 8 chapadel, procedurální targets, bezier rendering
5. **Vizuální systém** — tělo, oči, chromatofory, glow
6. **Spatial Hash** — grid, DOM indexing, collision detection
7. **Age System** — genesis, fáze, parameter interpolace
8. **Q-Learning** — state vector, action space, reward function, epsilon-greedy, Q-tabulka persistence
9. **Senzory** — mouse tracking, scroll, stress model
10. **DOM Interakce** — word wrapping, disturb/cleanup, midnight cleanup
11. **Click + Tooltip** — hit detection, emergentní tooltip
12. **Debug panel** — D key toggle, state visualization
13. **Polish** — performance profiling, edge cases, mobile viewport

---

## 18. Testovací kritéria

### Lili je úspěšná když:

- [ ] Po 10 minutách pozorování není zřejmé, že se chování opakuje v cyklech
- [ ] Hatchling je viditelně chaotičtější než Adult
- [ ] Elder se téměř nehýbe a to nepůsobí jako bug
- [ ] Kurzor přes Lili vyvolá únik (ne pokaždé — záleží na naučeném chování)
- [ ] Slova rozházená Lili se o půlnoci vrátí na místo
- [ ] Po refresh stránky Lili pokračuje tam kde skončila (pozice + Q-tabulka)
- [ ] FPS neklesne pod 50 ani na stránce s 500+ DOM elementy
- [ ] Lili nikdy nezablokuje kliknutí na odkaz nebo tlačítko
- [ ] Po promazání localStorage začne Lili znovu jako Hatchling
- [ ] Debug panel (D) zobrazí všechny runtime parametry
- [ ] Soubor funguje přidáním jednoho `<script>` tagu do jakéhokoliv HTML

---

*Lili PRD v1.0 · Michal Strnadel · 2025*
*"Neperformuje. Prostě je."*
