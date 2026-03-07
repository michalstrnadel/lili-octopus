# 2026-03-07 — Distribuovaná inteligence a hravá DOM manipulace

**Čas:** ~21:24 UTC
**Účastníci:** Michal Strnadel (koncepční korekce), Oz/Claude (analýza dopadů)

## Co se stalo

Michal identifikoval dva zásadní problémy v aktuální architektuře:

### Problém 1: Centralizovaný mozek je nerealistický

**Původní návrh:** `brain.chooseAction(stateVector)` → centrální mozek rozhodne → tělo vykoná.

**Problém:** Reálné chobotnice mají 2/3 neuronů v chapadlech, ne v hlavě. Každé chapadlo má vlastní nervový systém schopný lokálních rozhodnutí (chuť, hmat, reflexy). Centrální mozek koordinuje, ale nemikromanažuje. Dosidicus projekt má podobný princip — neurony distribuované v chapadlech.

Citát Michala: *"Lidi taky nemají oddělenou hlavu od těla... chobotnice je chytrá tak jak jsou její chapadla... mozek není v hlavě, ale všude.. a její inteligence všude po těle."*

### Problém 2: DOM interakce je příliš pasivní

**Původní návrh:** Chapadlo se dotkne elementu → mírný rotate/translate → po chvíli návrat.

**Nová vize:** Lili si aktivně vybere element (třeba písmenko "O"), odnese ho pryč z jeho místa, hraje si s ním — a midnight cleanup ho vrátí. Stránka pak má viditelně chybějící obsah — stopa života.

## Rozhodnutí: Distribuovaná nervová architektura

### Nový model

```
BYLO:  Brain (centrální) ──→ rozhodnutí ──→ tělo vykoná

BUDE:  Chapadla (lokální senzory + lokální reakce)
         ↕ signály ↕
       Tělo (agreguje, stress, tendence)
         ↕ nálada ↕
       Q-Learning (nastavuje tendence/nálady, ne přímé příkazy)
```

### Chapadlo jako autonomní jednotka

Každé chapadlo (8 celkem) má vlastní lokální stav:
- `localStress` — roste při kontaktu s kurzorem, klesá v klidu
- `touching` — jaký DOM element právě cítí (nebo null)
- `curiosity` — jak moc chce zkoumat (ovlivněno globální náladou)
- `recoilTimer` — reflexní stažení po kontaktu s hrozbou
- `heldElement` — element který nese (nebo null)
- `grip` — síla úchopu (klesá s časem, stresem)

### Lokální chování chapadel (bez čekání na mozek)

- **Reflexní stažení:** Tip se přiblíží kurzoru → okamžité stažení (ne za 30-60 framů čekání na decision cycle)
- **Hmatová explorace:** Tip narazí na DOM element → lokální zvědavost → ohmatání hrany
- **Uchopení:** Pokud je globální nálada „zvědavá" a tip je na zajímavém elementu → uchopení
- **Samovolná relaxace:** V klidu se chapadla rozprostřou nezávisle, každé trochu jinak

### Q-Learning jako „nálada", ne „příkaz"

Brain interface se mění z `brain.chooseAction()` (přímý příkaz) na `brain.setMood()` (tendence):
- **Mood: zvědavá** → chapadla aktivněji explorují, vyšší pravděpodobnost uchopení
- **Mood: plachá** → chapadla se stahují za tělo, nízká interakce
- **Mood: klidná** → chapadla se rozprostřou, pomalé pohyby, whitespace seeking
- **Mood: hravá** → chapadla aktivně hledají elementy k manipulaci

Q-Learning se učí JAKOU NÁLADU mít v jakém stavu — ne jaký konkrétní pohyb udělat. Chování pak emerguje z kombinace nálady + lokální inteligence chapadel + prostředí.

**Důvod:** Toto je biologicky věrnější a zároveň produkuje zajímavější emergentní chování. Také to přidává další vrstvu akademické zajímavosti — multi-agent systém uvnitř jednoho organismu.

### Dopad na Brain Interface

```
BYLO:
  brain.chooseAction(stateVector) → "flee"
  
BUDE:
  brain.setMood(stateVector) → { tendency: "curious", intensity: 0.7 }
  Chapadla interpretují náladu lokálně → emergentní chování
  Tělo agreguje feedback z chapadel → nový stav pro brain
```

Brain Interface zůstává jako pattern pro budoucí rozšiřitelnost (DQN, LLM...), ale jeho role se mění z velitele na koordinátora nálad.

## Rozhodnutí: Hravá DOM manipulace

### Nový systém

**Fáze interakce chapadla s DOM elementem:**

1. **Ohmatání (touch):** Tip chapadla se dotkne elementu → mírný rotate/translate (stávající chování)
2. **Zájem (interest):** Pokud nálada = zvědavá/hravá, chapadlo element „uchopí" → `data-lili-held`
3. **Nesení (carry):** Element se pohybuje s tipem chapadla (`transform: translate()` sleduje tip pozici)
4. **Hra (play):** Element rotuje, houpá se, případně se předává mezi chapadly
5. **Pustení (drop):** Ztráta zájmu, stress (flee), nebo midnight cleanup → element se vrátí (animovaně)

### Výběr elementů

Proč by si Lili vybrala zrovna písmenko "O"?
- **Tvarová afinita:** Kulaté tvary mohou mít vyšší „atraktivitu" (kulatost → tělo chobotnice?)
- **Emergentní preference:** Nechat RL, aby se naučil co je „zajímavé"
- **Dostupnost:** Element musí být dostatečně malý (single character nebo slovo) a v dosahu chapadla
- **Nemá být `<a>` nebo `<button>`:** Interaktivní elementy se nikdy neuchopí (pravidlo reverzibility)

### Technické omezení

- Stále POUZE `transform` a `color` — žádný layout reflow
- Max 2 held elementy současně (chapadla mají omezenou „sílu")
- Element se nikdy neodnese mimo viewport
- Reverzibilita: midnight cleanup + okamžitý drop při flee
- `data-lili-held="tentacle_index"` a `data-lili-held-since="timestamp"`

### Dopad na uživatele

Uživatel vidí: na stránce chybí písmenko. Někde u Lili se to písmenko houpá na chapadle. Stopa života — ambientní, nenásilná, ale viditelná.

## Dopad na implementační fáze

- **Fáze 3 (FABRIK):** Rozšířit o lokální stav per chapadlo + autonomní chování tipu
- **Fáze 6 (Senzory):** Přidat chapadlové senzory (per-tentacle touch/proximity)
- **Fáze 8 (Q-Learning):** Změna action space z přímých akcí na nálady/tendence
- **Fáze 9 (DOM interakce):** Zásadní rozšíření — carry/play systém
- **Nová výzkumná otázka:** Jak přispívá lokální autonomie chapadel k celkové emergenci chování?

## Otevřené otázky

- Jak přesně diskretizovat „nálady" pro Q-Learning state/action space?
- Kolik lokální inteligence je dost a kolik je moc? (výkon vs. realismus)
- Jak penalizovat/odměňovat uchopení v reward function?
- Měla by existovat „osobnost chapadla" — některá chapadla zvědavější než jiná?

---

*Toto je pravděpodobně nejzásadnější architektonická změna od vzniku projektu. Posouvá Lili z „RL agent s procedurální animací" na „distribuovaný nervový systém s emergentním chováním".*
