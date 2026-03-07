# 2026-03-07 — Založení projektu Lili

**Čas:** 14:57 – 15:41 UTC
**Účastníci:** Michal Strnadel (autor, vize), Oz/Claude (technická analýza, plánování)

## Co se stalo

### 1. Analýza existující dokumentace

Projekt začal se třemi dokumenty:
- `LILI_PRD_v1.md` — 860 řádků, kompletní Product Requirements Document
- `Lili Autonomní digitální společník.md` — 237 řádků, akademická analýza s 30 citacemi
- `text-77585ACC1A39-1.txt` — 96 řádků, doplňková technická analýza

**Závěr:** PRD je extrémně detailní a dobře promyšlený. Pokrývá RL, steering behaviors, FABRIK, spatial hashing, chromatofory, persistenci. Je to solidní základ.

### 2. Vytvoření implementačního plánu

Vytvořen 12-fázový implementační plán pokrývající:
- Fáze 1-4: Vizuální základ (canvas, pohyb, chapadla, rendering)
- Fáze 5-7: Infrastruktura (spatial hash, senzory, stárnutí)
- Fáze 8: Jádro autonomie (Q-Learning) — nejkritičtější fáze
- Fáze 9-12: Interakce, persistence, polish

### 3. Klíčová rozhodnutí

#### Rozhodnutí: Vizuální filozofie
**Otázka:** Jak má Lili vypadat?
**Rozhodnutí:** Minimalistická, ale biologicky věrná. Důraz na pohyb (jet propulsion pulse-glide), ne na detail textury. Inspirace: reálné chobotnice (Octopus vulgaris, Abdopus aculeatus).
**Důvod:** Vizuální důvěryhodnost přichází z věrného pohybu, ne z komplexní grafiky. Jednoduchý tvar + organický pohyb = nejsilnější dojem.

#### Rozhodnutí: Akademická datová vrstva (Behavioral Journal)
**Otázka:** Jak zaznamenávat učení pro pozdější analýzu?
**Rozhodnutí:** Třívrstvý systém:
1. Decision log — každé rozhodnutí (ring buffer ~5000)
2. Denní agregáty — shrnutí za den (uchovávat navždy, ~500B/den)
3. Q-table snapshoty — kompletní mozek každý týden (~15KB/snapshot)

Plus export systém (klávesa E → JSON soubor).

**Důvod:** Bez dat není akademický rozměr. Data musí být dostatečně granulární pro statistickou analýzu, ale dostatečně kompaktní pro localStorage.

#### Rozhodnutí: Psychosomatická vizuální individualita
**Otázka:** Budou všechny instance Lili vypadat stejně?
**Rozhodnutí:** Ne. Vizuál se mění na základě:
- Genesis seed → subtle variace proporcí a barvy
- Prostředí (stress, DOM hustota) → tmavší/světlejší, menší/větší
- Naučené chování → plachá Lili vypadá jinak než zvědavá
- Věk → přirozeně (Hatchling světlá, Elder tmavá)

**Důvod:** Biologický princip — psychosomatické stavy ovlivňují fyziologii. Stresovaná chobotnice v přírodě vypadá jinak než klidná. Totéž musí platit digitálně.

#### Rozhodnutí: Brain Interface pro budoucí rozšiřitelnost
**Otázka:** Co když budeme chtít vyměnit Q-Learning za AGI/OpenClaw?
**Rozhodnutí:** Clean adapter pattern:
- `brain.chooseAction(stateVector)` → akce
- `brain.learn(state, action, reward, nextState)` → update
- `brain.serialize()` / `brain.deserialize()` → persistence

Všechna rozhodnutí prochází přes brain objekt. Žádné přímé volání Q-tabulky z jiných modulů.

**Důvod:** Triviální interface umožňuje připojit cokoli — DQN, LLM, cloud API. Tělo se nemění.

#### Rozhodnutí: Distribuce pro všechny
**Otázka:** Může Lili žít na cizích stránkách?
**Rozhodnutí:** v1.0 = lokální soubor. v2.0 = CDN + konfigurace přes data atributy. Každá instance automaticky unikátní díky jinému uživateli, stránce a genesis seedu.
**Důvod:** Architektura (IIFE, zero deps, single script) to přirozeně umožňuje.

### 4. Identifikace potřebného research

Definováno 5 deep research promptů:
1. Biomechanika pohybu chobotnic → parametry pro animaci
2. Q-Learning v biologických simulacích → akademická kvalita RL
3. FABRIK IK pro chapadla → konkrétní implementační kód
4. Dlouhodobá persistence v prohlížeči → data přežijí 10 let
5. Akademická metodologie → publikovatelný experiment

Detaily v `docs/research/README.md`.

### 5. Katalogizace foundational deep research

Oba přípravné dokumenty (`Lili Autonomní digitální společník.md` a `text-77585ACC1A39-1.txt`) identifikovány jako plnohodnotné výstupy z deep research sessions. Zařazeny do `docs/research/` jako:
- `00a-conceptual-architectural-analysis.md` — koncepční a architektonická analýza (30 citací)
- `00b-technical-implementation-analysis.md` — technická implementační analýza (steering, FABRIK, Q-Learning, chronobiologie)

Originální prompty nejsou k dispozici (researche provedeny před systematickým výzkumem), ale výsledky mají akademickou kvalitu a slouží jako fundament celého projektu.

### 6. Strukturace repozitáře

Vytvořena adresářová struktura:
- `docs/research/` — deep research s prompty a výsledky
- `docs/journal/` — tento deníček
- `docs/design/` — vizuální rozhodnutí
- `public/` — produkční soubor lili.js

### 7. Vytvoření akademické dokumentace

Vytvořeny dva klíčové dokumenty:
- `docs/PROJECT.md` — akademický popis celého projektu (abstrakt, motivace, architektura, výzkumné otázky, metriky, publikační strategie, porovnání s existujícími systémy)
- `docs/IMPLEMENTATION_PLAN.md` — implementační plán exportovaný do repa (12 fází + testovací kritéria + akademické metriky + architektura rozšiřitelnosti)

Aktualizován README.md s odkazy na veškerou dokumentaci.

## Co je další krok

1. Dokončit zbylé 3 deep researches (#3 FABRIK, #4 persistence, #5 metodologie)
2. Vložit výsledky do `docs/research/`
3. Začít implementaci Fáze 1 (kostra, canvas, Vec2, noise)

## Otevřené otázky

- Konkrétní parametry jet propulsion pulse-glide cyklu (čeká na Research #1)
- localStorage vs. IndexedDB strategie (čeká na Research #4)
- Optimální velikost Q-table snapshotů pro kompresi (čeká na Research #4)
- Konferenční venues pro publikaci (čeká na Research #5)

---

*"Lili ještě neexistuje, ale její DNA je definována."*
