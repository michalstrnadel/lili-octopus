# Repository Blueprint — Jak stavět projekt od nuly

Tento dokument je šablona a prompt pro AI (i pro tebe samotného) jak strukturovat repozitář, když začínáš nový projekt. Nahrај ho do konverzace s AI a řekni: „Stavíme nový projekt. Postupuj podle tohoto blueprintu."

---

## 0. Než začneš cokoliv vytvářet

### 0.1 Definuj projekt v jedné větě
Než napíšeš jediný řádek kódu nebo vytvoříš jedinou složku, odpověz na:

- **Co to je?** (jedna věta)
- **Pro koho to je?** (cílový uživatel)
- **Jaký problém to řeší?**
- **Jaký je hlavní technický constraint?** (jazyk, platforma, velikost, závislosti...)
- **Jaký je scope v1.0?** (co tam NEBUDE je důležitější než co tam bude)

### 0.2 Zvol typ projektu
Struktura se mírně liší podle typu:

- **Aplikace** (web app, mobile app, desktop app) — nejvíc vrstev
- **Knihovna / SDK** — důraz na API docs, příklady, testy
- **Experiment / Research** — důraz na journal, research, data
- **Single-file projekt** — minimální struktura, ale dokumentace stále plná
- **Microservice** — důraz na API kontrakt, deployment, monitoring

---

## 1. Struktura repozitáře

### 1.1 Univerzální kostra

```
projekt/
│
├── AGENTS.md                    ← AI entry point (VŽDY PRVNÍ)
├── README.md                    ← Lidský přehled
├── .gitignore                   ← Od prvního commitu
│
├── docs/                        ← Veškerá dokumentace
│   ├── PROJECT.md               ← Akademický/technický popis
│   ├── IMPLEMENTATION_PLAN.md   ← Fázový implementační plán
│   ├── research/                ← Deep research dokumenty
│   │   └── README.md            ← Katalog researches
│   ├── journal/                 ← Vývojový deníček
│   │   └── README.md            ← Jak číst deníček
│   └── design/                  ← Vizuální/UX filozofie
│       └── README.md            ← Design principy
│
├── src/ nebo public/            ← Zdrojový kód (dle typu projektu)
│
└── _archive/                    ← Původní materiály, brainstormy, draft
```

### 1.2 Volitelné složky (přidej podle potřeby)

```
├── tests/                       ← Testy (pokud nejsou co-located)
├── scripts/                     ← Build, deploy, utility skripty
├── config/                      ← Konfigurace prostředí
├── assets/                      ← Obrázky, fonty, statické soubory
├── api/                         ← API specifikace (OpenAPI, GraphQL schema)
├── data/                        ← Vzorová data, fixtures, seeds
├── .github/                     ← GitHub Actions, issue templates
└── docker/                      ← Dockerfiles, compose
```

---

## 2. Dokumenty — co vytvořit a v jakém pořadí

### Krok 1: AGENTS.md (AI entry point)

**Vytvoř VŽDY jako první.** Toto je vstupní bod pro jakékoli AI pracující na projektu.

Musí obsahovat:
- **Co je tento projekt** (2-3 věty)
- **Aktuální stav** (co je hotovo, co čeká, další krok)
- **Co číst a kdy** (navigace pro různé úkoly)
- **Mapa souborů** (ASCII strom s popisky)
- **Konvence a pravidla** (kód, architektura, výkon)
- **Co NEDĚLAT** (explicitní zákazy — tohle je kritické)
- **Klíčové technické koncepty** (rychlý přehled pro implementaci)

Formát sekcí:

```markdown
## Aktuální stav

**Fáze: [název aktuální fáze]**

Hotovo:
- ✅ ...

Čeká:
- ⏳ ...

**Další krok:** [konkrétní akce]
```

**Pravidlo:** AGENTS.md se aktualizuje při KAŽDÉ významné změně stavu projektu.

### Krok 2: README.md (lidský přehled)

Pro lidi, ne pro AI. Stručný, přehledný, s odkazem na AGENTS.md pro AI kolaborátory.

Musí obsahovat:
- Název + jednořádkový popis
- Quick start (jak spustit)
- Odkaz na dokumentaci
- Odkaz na AGENTS.md (sekce „Pro AI")
- Licence + autor

### Krok 3: PRD nebo specifikace

Detailní specifikace produktu. Může být:
- `PRD.md` — Product Requirements Document
- `SPEC.md` — technická specifikace
- `RFC.md` — Request for Comments (pro knihovny)

Toto je **zdroj pravdy** pro implementační detaily. Vše ostatní z něj vychází.

Musí obsahovat:
- Problém a motivace
- Cílový uživatel / use cases
- Architektura (high-level)
- Detailní specifikace features
- Parametry, prahy, konstanty (přesné hodnoty!)
- Co je out of scope
- Budoucí rozšíření (v2.0+)

### Krok 4: docs/PROJECT.md (akademický/technický popis)

Strukturovaný popis projektu pro kontextuální porozumění. Ne specifikace (to je PRD), ale vysvětlení *proč* a *jak*.

Musí obsahovat:
- Abstrakt
- Motivace a kontext
- Architektura (diagram + popis vrstev)
- Klíčové technické rozhodnutí s odůvodněním
- Výkonnostní/kvalitativní cíle
- Porovnání s existujícími řešeními

### Krok 5: docs/IMPLEMENTATION_PLAN.md

Fázový plán implementace. Každá fáze má:
- **Číslo a název**
- **Cíl** (jedna věta)
- **Úkoly** (konkrétní, technické)
- **Výstup** (co existuje po dokončení fáze)
- **Závislosti** (na kterých předchozích fázích staví)

Pravidla:
- Fáze jsou sekvenční, ale mohou mít paralelní úkoly
- Každá fáze by měla být dokončitelná v rozumném čase (hodiny až dny, ne týdny)
- Plán se aktualizuje průběžně — je to živý dokument

### Krok 6: docs/research/README.md (katalog researches)

Seznam všech provedených i plánovaných deep researches.

Pro každý research:
- **ID a název** (číslované: 00, 01, 02...)
- **Status** (✅ hotovo / ⏳ čeká)
- **Prompt** (přesný prompt použitý pro deep research)
- **Soubor** (odkaz na výstupní .md)
- **Klíčové závěry** (2-3 věty)

### Krok 7: docs/journal/README.md + zápisky

Vývojový deníček pro zaznamenávání rozhodnutí.

Formát zápisů: `YYYY-MM-DD-topic.md`

Každý zápis obsahuje:
- **Kontext** — co se řešilo
- **Rozhodnutí** — co bylo rozhodnuto
- **Důvody** — proč (tohle je nejdůležitější!)
- **Alternativy** — co bylo zvažováno a zamítnuto
- **Důsledky** — co to mění v architektuře/plánu

**Pravidlo:** Každé netriviální architektonické rozhodnutí MUSÍ mít journal entry.

### Krok 8: docs/design/README.md

Vizuální a UX filozofie. Nemusí být od začátku, ale jakmile se řeší jakýkoli vizuální aspekt:
- Design principy
- Barevná paleta / typografie (pokud relevantní)
- Interakční vzory
- Reference a inspirace

---

## 3. AI entry points (multi-tool podpora)

Pokud pracuješ s více AI nástroji, vytvoř entry point pro každý:

```
├── AGENTS.md          ← Univerzální (hlavní zdroj pravdy)
├── CLAUDE.md          ← Claude Code entry point
├── .cursorrules       ← Cursor entry point
├── COPILOT.md         ← GitHub Copilot instrukce
└── .windsurfrules     ← Windsurf entry point
```

Každý z nich by měl odkázat na AGENTS.md jako zdroj pravdy. Obsah:

```markdown
# [Název nástroje] — Instrukce

Přečti `AGENTS.md` jako první — je to hlavní zdroj kontextu pro tento projekt.

[Případné specifické instrukce pro daný nástroj]
```

---

## 4. Git workflow

### 4.1 První commit

```
git init
git add AGENTS.md README.md .gitignore
git commit -m "init: project skeleton + AI entry points"
```

**Pravidlo:** První commit obsahuje AGENTS.md. Kód až potom.

### 4.2 Konvence commitů

Používej prefixované zprávy:

- `init:` — počáteční setup
- `docs:` — dokumentace
- `feat:` — nová funkcionalita
- `fix:` — oprava bugu
- `refactor:` — refaktoring bez změny chování
- `research:` — přidání research dokumentu
- `journal:` — přidání journal entry
- `chore:` — údržba (gitignore, config, tooling)

### 4.3 Kdy commitovat

- Po každé dokončené fázi z implementation plánu
- Po každém významném dokumentu
- Po každém architektonickém rozhodnutí (journal + dotčené soubory)
- NIKDY commitovat nedokončenou práci na main (používej branches pro experimentální věci)

---

## 5. Pořadí práce (workflow)

### Fáze A: Fundament (před jakýmkoli kódem)

1. Vytvoř repozitář + `.gitignore`
2. Napiš `AGENTS.md` (i když je stručný — rozšíříš ho)
3. Napiš `README.md`
4. Napiš PRD / specifikaci (nebo alespoň hrubý draft)
5. **Commit: init**

### Fáze B: Architektura (stále bez kódu)

6. Proveď deep research na klíčové technické otázky
7. Zapiš výsledky do `docs/research/`
8. Na základě researchů napiš `docs/PROJECT.md`
9. Vytvoř `docs/IMPLEMENTATION_PLAN.md`
10. **Commit: docs**

### Fáze C: Design rozhodnutí

11. Zapiš klíčová architektonická rozhodnutí do `docs/journal/`
12. Pokud má projekt vizuální komponentu — `docs/design/`
13. Aktualizuj `AGENTS.md` (aktuální stav, koncepty, pravidla)
14. **Commit: docs + journal**

### Fáze D: Implementace

15. Začni implementovat podle plánu (fáze po fázi)
16. Po každé fázi: aktualizuj AGENTS.md (stav), příp. IMPLEMENTATION_PLAN.md
17. Při každém netriviálním rozhodnutí: journal entry
18. **Commit po každé dokončené fázi**

---

## 6. Pravidla pro AGENTS.md

AGENTS.md je nejdůležitější soubor v celém repozitáři pro AI spolupráci. Musí být:

### Kompletní
AI, které ho přečte, musí být schopné:
- Pochopit co je projekt a kde stojí
- Najít jakýkoli relevantní soubor
- Znát pravidla a konvence
- Vědět co NEDĚLAT
- Začít pracovat bez dalších otázek

### Aktuální
- Sekce „Aktuální stav" reflektuje skutečnost
- „Další krok" je vždy konkrétní
- Mapa souborů odpovídá realitě

### Strukturovaný
Dodržuj tuto strukturu sekcí:

```
1. Co je tento projekt (2-3 věty)
2. Aktuální stav (✅ hotovo, ⏳ čeká, další krok)
3. Co číst a kdy (navigace podle účelu)
4. Mapa souborů (ASCII strom)
5. Konvence a pravidla
   5a. Kód (jazyk, styl, constraints)
   5b. Architektura (patterns, klíčové principy)
   5c. Výkonnostní cíle
   5d. Dokumentace (kdy co aktualizovat)
   5e. Co NEDĚLAT (explicitní zákazy)
6. Klíčové technické koncepty (rychlý přehled)
7. Autor
```

---

## 7. Research workflow

Když potřebuješ prozkoumat technickou otázku:

### 7.1 Vytvoř prompt
Napiš přesný prompt pro deep research. Ulož ho do `docs/research/README.md` ještě před provedením.

### 7.2 Proveď research
Použij AI deep research tool (Gemini, Perplexity, ChatGPT deep research...). Výstup ulož jako:

`docs/research/NN-stručný-název.md`

Kde NN je pořadové číslo (00, 01, 02...).

### 7.3 Katalogizuj
Aktualizuj `docs/research/README.md` — status, klíčové závěry, odkaz.

### 7.4 Aplikuj
Závěry z researche promítni do relevantních dokumentů (PROJECT.md, IMPLEMENTATION_PLAN.md, AGENTS.md).

---

## 8. Journal workflow

### Kdy psát journal entry
- Změna architektury
- Přidání/odebrání technologie
- Změna scope
- Netriviální trade-off rozhodnutí
- Pivotnutí přístupu

### Formát

```markdown
# [Datum] — [Téma]

## Kontext
Co se řešilo a proč.

## Rozhodnutí
Co bylo rozhodnuto (konkrétně).

## Důvody
Proč právě takhle (nejdůležitější sekce!).

## Alternativy
Co bylo zvažováno a proč zamítnuto.

## Důsledky
Co to mění v projektu, co je třeba aktualizovat.
```

---

## 9. Checklist pro nový projekt

Zkopíruj a odškrtávej:

```
[ ] Repozitář vytvořen + .gitignore
[ ] AGENTS.md — AI entry point
[ ] README.md — lidský přehled
[ ] PRD / Specifikace — zdroj pravdy
[ ] docs/PROJECT.md — technický popis
[ ] docs/IMPLEMENTATION_PLAN.md — fázový plán
[ ] docs/research/README.md — katalog researches
[ ] docs/journal/README.md — deníček
[ ] docs/design/README.md — design principy (pokud vizuální projekt)
[ ] Alespoň 1 deep research provedený
[ ] Alespoň 1 journal entry
[ ] AGENTS.md aktualizovaný a kompletní
[ ] První commit na main
[ ] Připraveno na implementaci Fáze 1
```

---

## 10. Prompt pro AI: „Založ mi projekt"

Když chceš, aby AI založilo nový projekt podle tohoto blueprintu, použij tento prompt:

```
Zakládáme nový projekt. Přečti docs/REPOSITORY_BLUEPRINT.md (nebo tento soubor)
a postupuj podle něj.

Projekt: [název]
Popis: [jedna věta]
Pro koho: [cílový uživatel]
Problém: [co řeší]
Hlavní constraint: [technický limit]
Scope v1.0: [co tam BUDE]
Co tam NEBUDE: [co je out of scope]
Typ: [aplikace / knihovna / experiment / single-file / microservice]
Jazyk/stack: [technologie]
Adresář: [cesta]

Začni Fází A (fundament) — vytvoř strukturu a dokumenty.
Ještě NEPROGRAMUJ, nejdřív dokumentace.
```

---

*Tento blueprint vychází z přístupu použitého při stavbě projektu Lili (2026). Aktualizuj ho podle zkušeností z dalších projektů.*

*Autor: Michal Strnadel*
*Verze: 1.0 — 8. března 2026*
