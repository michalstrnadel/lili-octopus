# Research — Přehled

Tato složka obsahuje výsledky deep research prováděného před implementací. Každý research má vlastní soubor s výsledky a je zde dokumentováno proč byl proveden a jaký prompt byl použit.

## Přehled researches

| # | Soubor | Téma | Status | Proč je kritický |
|---|--------|------|--------|------------------|
| 0a | `00a-conceptual-architectural-analysis.md` | Koncepční a architektonická analýza | ✅ Hotovo | Fundament celého projektu — open-source analýza, architektura, proveditelnost |
| 0b | `00b-technical-implementation-analysis.md` | Technická implementační analýza | ✅ Hotovo | Steering behaviors, spatial hashing, FABRIK, Q-Learning, chronobiologie |
| 1 | `01-octopus-locomotion.md` | Biologie pohybu chobotnic | ✅ Hotovo | Parametry pro věrohodný pohyb a vizuál |
| 2 | `02-qlearning-biological-simulations.md` | Q-Learning v biologických simulacích | ✅ Hotovo | RL engine, reward shaping, akademické reference |
| 3 | `03-fabrik-tentacle-animation.md` | FABRIK IK pro chapadla | ⏳ Čeká na výsledky | Konkrétní animační kód a parametry |
| 4 | `04-browser-persistence-longterm.md` | Dlouhodobá perzistence v prohlížeči | ⏳ Čeká na výsledky | Data přežijí 10 let |
| 5 | `05-academic-methodology.md` | Akademická metodologie | ⏳ Čeká na výsledky | Publikovatelná kvalita, konference, metriky |

## Research #0a: Koncepční a architektonická analýza autonomních digitálních organismů

**Účel:** Vyčerpávající akademická analýza celého konceptu projektu Lili — existující open-source projekty, architektonické vzory, proveditelnost. Dokument s 30 citacemi, který sloužil jako základ pro tvorbu PRD.

**Soubor:** `00a-conceptual-architectural-analysis.md` (původně `../../Lili Autonomní digitální společník.md`)

**Původní prompt:** Není k dispozici (deep research provedený před zahájením systematického výzkumu).

**Co z toho použijeme:**
- Architektonický základ celého systému → všechny implementační fáze
- Reward shaping a RL rámec → Fáze 8
- Proveditelnostní argumentace a reference → akademická dokumentace projektu

---

## Research #0b: Technická implementační analýza

**Účel:** Podrobná technická analýza implementačních detailů — steering behaviors, spatial hashing, FABRIK, Q-Learning, chronobiologie a Easter egg interakce.

**Soubor:** `00b-technical-implementation-analysis.md` (původně `../../text-77585ACC1A39-1.txt`)

**Původní prompt:** Není k dispozici (deep research provedený před zahájením systematického výzkumu).

**Co z toho použijeme:**
- Kinematika a steering specifikace → Fáze 2–3
- Spatial hash a výkonové vzory → Fáze 5 a 12
- Q-learning a chronobiologie vzory → Fáze 7–8
- Interakční a UX návrhy → Fáze 10

---

## Research #1: Biomechanika pohybu chobotnic

**Účel:** Získat konkrétní číselné parametry pro procedurální animaci — frekvence, úhly, poměry. Bez těchto dat bude pohyb Lili vypadat jako generická animace, ne jako chobotnice.

**Prompt:**

> "Octopus locomotion biomechanics and movement patterns for procedural animation"
>
> Potřebuji detailní technické informace o tom, jak se chobotnice pohybují, specificky pro účely procedurální 2D animace v JavaScriptu (Canvas 2D). Zaměř se na:
>
> 1. **Jet propulsion mechanika:** Jak funguje pulse-glide cyklus? Jaký je poměr kontrakční fáze vs. klouzavé fáze? Jak se mění tvar mantlu (mantle) během kontrakce? Jaká je typická frekvence pulzů při plavání vs. při útěku?
>
> 2. **Pohyb chapadel při plavání:** Jak se chapadla chovají během jet propulsion? Zaostávají za tělem (trailing)? Jak se seskupují? Existuje fázový posun mezi jednotlivými chapadly? Jak se liší pozice chapadel při pomalém plavání vs. rychlém útěku?
>
> 3. **Crawling/walking po povrchu:** Jak chobotnice chodí po dně? Kolik chapadel používá najednou? Existují popsané gait patterns (vzory chůze)? Jak chobotnice Abdopus aculeatus chodí po dvou chapadlech (bipedal locomotion)?
>
> 4. **Chromatoforová komunikace:** Jak rychle reagují chromatofory na podněty? Jaká je latence změny barvy? Jak se liší vzory při stresu, klidu, zvědavosti? Existují specifické "flash" patterns (např. při útěku)?
>
> 5. **Autonomní nervový systém chapadel:** Jak funguje decentralizovaný nervový systém? Mohou se chapadla pohybovat nezávisle na centrálním mozku? Jak se projevuje tato autonomie v pozorovaném chování?
>
> 6. **Relaxační a klidové stavy:** Jak vypadá chobotnice v klidu? Jak se rozprostřou chapadla? Existuje něco jako "dýchací" rytmus mantlu? Jak se mění s věkem (juvenilní vs. dospělá)?
>
> Hledám konkrétní číselné parametry (frekvence, úhly, poměry), reference na akademické studie a videa, a matematické aproximace vhodné pro 2D simulaci.

**Co z toho použijeme:**
- Pulse-glide parametry → Wander behavior (Fáze 2)
- Chapadla trailing data → FABRIK target generování (Fáze 3)
- Chromatofory latence → HSL color system timing (Fáze 4)
- Klidové stavy → Idle behavior (Fáze 2, 3)

---

## Research #2: Q-Learning v biologických simulacích

**Účel:** Akademické reference a best practices pro RL v kontextu digitálních organismů. Zajistit, že naše reward function a metriky mají akademickou kvalitu.

**Prompt:**

> "Tabular Q-Learning in biological simulations and autonomous digital organisms"
>
> Potřebuji akademické reference a best practices pro nasazení tabulárního Q-Learningu v kontextu autonomních digitálních organismů. Zaměř se na:
>
> 1. **Reward shaping pro biologicky inspirované agenty:** Jaké jsou osvědčené postupy pro návrh reward function, když cílem není optimalizace úkolu, ale emergentní "zdvořilé" chování?
>
> 2. **Měření konvergence Q-Learning:** Jaké metriky se používají pro hodnocení, zda Q-tabulka konverguje? (průměrná delta Q, policy stability, Bellman error). Jaké jsou typické konvergenční křivky?
>
> 3. **Epsilon decay strategie vázané na biologický věk:** Existují precedenty pro vázání exploration rate na simulovaný biologický věk místo na počet iterací?
>
> 4. **Dlouhodobá perzistence RL agentů:** Jaké problémy vznikají při RL učení přes měsíce/roky reálného času? Catastrophic forgetting? Non-stationarity prostředí?
>
> 5. **Existující akademické projekty:** Existují publikované projekty kombinující RL s procedurální animací digitálních organismů v prohlížeči?
>
> 6. **Metriky pro akademický paper:** Jaké metriky a vizualizace by měl obsahovat akademický paper o dlouhodobém chování RL agenta v otevřeném prostředí?

**Co z toho použijeme:**
- Reward shaping guidelines → Reward function (Fáze 8)
- Konvergenční metriky → Behavioral journal (Fáze 8B)
- Reference na papers → Akademická sekce projektu
- Epsilon strategie → Age system napojení na RL (Fáze 7+8)

---

## Research #3: FABRIK IK pro animaci chapadel

**Účel:** Konkrétní implementační kód a parametry pro FABRIK algoritmus v 2D Canvas kontextu.

**Prompt:**

> "FABRIK inverse kinematics for tentacle animation in 2D Canvas JavaScript"
>
> Potřebuji konkrétní implementační detaily algoritmu FABRIK pro procedurální animaci chapadel chobotnice v 2D Canvas kontextu. Zaměř se na:
>
> 1. **FABRIK algoritmus v 2D:** Konkrétní pseudokód pro Forward a Backward Reaching fáze. Kolik iterací je potřeba pro vizuálně dostatečnou konvergenci v 2D?
>
> 2. **Procedurální target generování pro chapadla:** Jak generovat přirozené cíle pro špičky chapadel při plavání? Jaké sinusoidní/noise funkce produkují nejrealističtější vlnový pohyb?
>
> 3. **Bézier curve rendering přes IK uzly:** Jak spojit FABRIK uzly pomocí Bézierových křivek? Jak implementovat zužující se šířku (tapering) od base k tipu?
>
> 4. **Drag a momentum pro trailing efekt:** Jak simulovat, že chapadla zaostávají za tělem při pohybu?
>
> 5. **Existující JavaScript implementace:** Open-source JS implementace FABRIK pro tentacle/snake/rope animaci?
>
> 6. **Performance v Canvas 2D:** Kolik IK řetězců × segmentů zvládne Canvas 2D při 60fps?

**Co z toho použijeme:**
- FABRIK pseudokód → Implementace (Fáze 3)
- Bézier rendering → Tentacle drawing (Fáze 3)
- Drag parametry → Trailing efekt (Fáze 3)
- Performance čísla → Optimalizace (Fáze 12)

---

## Research #4: Dlouhodobá perzistence v prohlížeči

**Účel:** Strategie pro uchování dat po dobu 10 let v prostředí prohlížeče. Kritické pro akademický rozměr projektu.

**Prompt:**

> "Long-term browser data persistence strategies for multi-year web applications"
>
> Buduji webovou aplikaci (single JavaScript file, zero dependencies), která musí uchovávat data v prohlížeči uživatele po dobu až 10 reálných let. Zaměř se na:
>
> 1. **localStorage limity:** Skutečný limit v Chrome, Firefox, Safari. Co se stane když se limit naplní?
>
> 2. **IndexedDB jako alternativa:** Limit, API surface pro jednoduchý key-value store bez závislostí?
>
> 3. **Rizika ztráty dat:** Za jakých okolností prohlížeč smaže localStorage/IndexedDB?
>
> 4. **Komprese dat v JS:** Jak komprimovat JSON bez závislostí? (LZ-string, delta encoding)
>
> 5. **Export jako záloha:** Best practices pro "save reminder" a import/restore.
>
> 6. **Fingerprinting a identita:** Izolace dat per domain.

**Co z toho použijeme:**
- Storage limity → Fáze 11 (persistence schema)
- IndexedDB fallback → Fáze 11
- Komprese → Fáze 8B (journal storage management)
- Export strategie → Fáze 8C (export systém)

---

## Research #5: Akademická metodologie

**Účel:** Zajistit, že projekt má kvalitu publikovatelnou na konferencích (ALIFE, CHI, NeurIPS workshop).

**Prompt:**

> "Academic methodology for longitudinal autonomous agent experiments and digital ontogenesis"
>
> Připravuji akademický experiment: autonomní RL agent s 10letým životním cyklem. Zaměř se na:
>
> 1. **Struktura longitudinálního experimentu:** Kontrolní podmínky, baseline porovnání.
>
> 2. **Reprodukovatelnost:** Seed management, logování podmínek prostředí.
>
> 3. **Statistická analýza behavioral dat:** Testy pro porovnání fází, behavioral complexity metriky.
>
> 4. **Konference a venues:** Kde publikovat výzkum o digitálních organismech?
>
> 5. **Etické aspekty:** Cursor tracking, GDPR, lokální data.
>
> 6. **Existující práce v digital ontogenesis:** Karl Sims, Thomas Ray, Tierra, referenční práce.
>
> 7. **Metriky pro peer review:** Grafy a vizualizace pro recenzenty.

**Co z toho použijeme:**
- Kontrolní podmínky → Experiment design
- Metriky → Behavioral journal (Fáze 8B)
- Konference → Publikační strategie
- Reference → Akademický kontext projektu

---

*Každý research bude po dokončení uložen jako samostatný .md soubor v této složce s plnými výsledky.*
