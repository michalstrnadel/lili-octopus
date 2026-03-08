# **Akademická metodologie pro longitudinální experimenty s autonomními agenty a digitální ontogenezí**

Rozvoj systémů zpětnovazebného učení (Reinforcement Learning, RL) v posledním desetiletí umožnil přechod od řešení izolovaných, epizodických úloh směrem k vývoji agentů schopných dlouhodobé adaptace v komplexních prostředích. Koncept implementace autonomního RL agenta, který využívá algoritmus tabulárního Q-učení a obývá dynamické prostředí webové stránky (Document Object Model, DOM) s plánovaným životním cyklem v horizontu deseti let, představuje zcela paradigmatický posun. Tento přístup opouští tradiční rámec strojového učení a vstupuje do interdisciplinární sféry digitální ontogeneze – tedy do studia postupného vývoje, stárnutí a behaviorální adaptace umělého organismu v reakci na nestacionární prostředí a neustále se měnící podněty lidského uživatele.

Aby takový experimentální design překročil hranici technologické demonstrace a etabloval se jako rigorózní vědecký příspěvek publikovatelný na nejprestižnějších konferencích (ALIFE, ACM CHI, NeurIPS), je absolutně nezbytné ukotvit jej v pevném a neprůstřelném metodologickém rámci. Akademická komunita, recenzenti a editoři vyžadují naprostou transparentnost, reprodukovatelnost, prokazatelnou validitu výsledků a precizní kvantifikaci všech pozorovaných jevů. Zvláště u longitudinálních experimentů, kde experimentální jednotka existuje a modifikuje svou vnitřní strukturu po extrémně dlouhou dobu, je nutné eliminovat vliv náhodných fluktuací a jednoznačně prokázat, že emergentní chování je skutečným důsledkem kognitivní ontogeneze, nikoliv jen artefaktem stochastického prohledávání stavového prostoru.

Tato výzkumná zpráva poskytuje vyčerpávající metodologický manuál pro návrh, exekuci, evaluaci a publikaci longitudinálního experimentu s autonomním digitálním organismem. Analyzuje nezbytné kontrolní podmínky, definuje standardy reprodukovatelnosti v nestacionárním webovém prostředí, aplikuje pokročilé metriky z informační teorie pro měření behaviorální komplexity a podrobně mapuje etické a publikační aspekty tohoto inovativního výzkumného směru.

## **Strukturace longitudinálního experimentu s RL agentem**

Základem každého experimentálního designu je schopnost izolovat vliv nezávislé proměnné (procesu zpětnovazebného učení) na proměnnou závislou (chování agenta a jeho úspěšnost v prostředí). V kontextu tabulárního Q-učení je agent formálně definován jako Markovův rozhodovací proces (Markov Decision Process, MDP), který sestává z konečné množiny stavů, množiny dostupných akcí, přechodových pravděpodobností a odměnové funkce.1 Ve webovém prostředí je stavový prostor definován geometrickou a sémantickou topologií DOMu, pozicí agenta, vzdáleností od kurzoru a komplexitou stránky, zatímco akční prostor zahrnuje navigaci, interakci s elementy či nečinnost.

Vzhledem k desetiletému horizontu experimentu je nutné navrhnout metodologii, která dokáže měřit výkon a adaptabilitu agenta napříč časem v prostředí, které je inherentně nestacionární. Nestacionarita se projevuje jak na straně softwaru (změny struktury webu, updaty DOMu), tak na straně uživatele (změny v chování, různé vzorce pohybu kurzoru).2

### **Definice kontrolních podmínek (Baselines) a referenčních modelů**

Pro akademické prokázání faktu, že Q-Learning agent skutečně vykazuje smysluplnou ontogenezi, je kritické srovnávat jeho chování s pečlivě definovanými kontrolními podmínkami. Recenzní řízení vyžaduje nevyvratitelný důkaz, že dosažená komplexita není triviální a že agent překonává elementární heuristiky. Výběr správných referenčních modelů (baselines) je v literatuře o zpětnovazebném učení považován za fundamentální indikátor metodologické kvality studie.3

Analýza experimentální kontroly v longitudinálních studiích je založena na vizuálním i statistickém srovnání mezi fází intervence (učení) a základními fázemi (baselines), během kterých není proces učení přítomen.5 Pro longitudinální webový experiment je nezbytné definovat následující sadu kontrolních podmínek:

| Typ kontrolního modelu | Architektonický princip a fungování | Metodologický účel a relevance pro evaluaci |
| :---- | :---- | :---- |
| **Agent bez učení (Random Policy)** | Agent volí akce ze svého akčního prostoru zcela náhodně, s rovnoměrným rozdělením pravděpodobnosti. Hodnota Q-tabulky se neaktualizuje. | Tento model slouží jako absolutní spodní hranice výkonu (lower bound). Pokud učící se agent statisticky signifikantně nepřekoná tuto náhodnou politiku, indikuje to selhání algoritmu nebo chybně definovanou odměnovou funkci.3 |
| **Zmrazená politika (Fixed Epsilon / Zero Learning Rate)** | Agent se učí po předem definovanou inicializační dobu. Následně se parametr učení (learning rate) nastaví na nulu, zatímco míra explorace (epsilon) zůstává konstantní. | Zjišťuje důsledky absence celoživotního učení. Slouží k měření dopadu nestacionarity prostředí.2 V průběhu deseti let by výkon tohoto zmrazeného agenta měl postupně degradovat v důsledku změn v DOMu, zatímco kontinuálně se učící agent si udrží nebo zlepší svůj výkon. |
| **Myopický agent (Myopic Policy)** | Diskontní faktor (discount factor) je nastaven na nulu. Agent se snaží maximalizovat výhradně okamžitou odměnu v bezprostředně následujícím kroku. | Tato kontrolní podmínka rigorózně prokazuje schopnost hlavního agenta plánovat v dlouhodobém horizontu. Ukazuje, že chování "dospělého" agenta je tvořeno složitými sekvencemi, nikoliv jen "chamtivými" (greedy) reakcemi na okamžité stimuly.3 |
| **Pevně naprogramovaná heuristika (Hard-coded Baseline)** | Agent se řídí statickým expertním systémem pravidel (např. "pokud je kurzor blíž než 50 pixelů, přesuň se do opačného rohu"). | Poskytuje referenční bod pro srovnání lidsky definované optimální strategie s emergentním chováním, které si RL agent vytvořil na základě vlastních interakcí.7 |

### **Fázování experimentu a komparativní analýza chování**

Desetiletý ontogenetický cyklus vyžaduje rozdělení života agenta do distinktních, formálně definovaných vývojových fází. Tato periodizace umožňuje formulaci a testování hypotéz o strukturálních změnách v politice chování. Tradičně se ontogeneze digitálního organismu rozděluje na fázi rané explorace a pozdní exploatace.

Fáze **"Hatchling" (Novorozenec)** je charakterizována vysokou hodnotou parametru epsilon v rámci epsilon-greedy strategie. V tomto období agent dominantně provádí náhodné akce, aby zmapoval rozsáhlý stavový prostor DOMu a zjistil kauzální vazby mezi svými akcemi, pohybem kurzoru a následnou odměnou. Chování je v této fázi z definice vysoce stochastické, chaotické a vykazuje jen velmi nízkou míru organizovanosti.

Na opačném konci spektra se nachází fáze **"Elder" (Stařešina)**, která reprezentuje období hluboké exploatace a strukturální krystalizace. Během této fáze došlo v Q-tabulce ke konvergenci u většiny relevantních a často navštěvovaných stavů. Agentova závislost na exploraci klesá k minimu. Chování je efektivní, minimalizuje redundantní pohyby a vykazuje vysokou míru komplexity a reaktivity na specifické vzorce chování lidského uživatele.

Pro relevantní metodologické srovnání naučeného a nenaučeného chování mezi těmito fázemi se v moderním výzkumu uplatňuje metoda spárovaného testování (paired testing). Výzkumník izoluje stav Q-tabulky agenta z rané fáze a Q-tabulky z pozdní fáze. Následně jsou oba modely vystaveny absolutně identickému testovacímu prostředí (např. zaznamenanému a přesně přehrávanému vzorci pohybu uživatelského kurzoru na identické verzi DOMu). Měří se diference (delta) v metrikách jako je celková akumulovaná odměna, latence reakce a schopnost vyhnout se negativním stimulům. Tento spárovaný přístup je klíčový pro snížení rozptylu (variance) při testování algoritmů a bez zkreslení prokazuje, že pozorované rozdíly v chování jsou striktně výsledkem kognitivní ontogeneze agenta, a nikoliv externalitami prostředí.4

## **Standardy reprodukovatelnosti v nestacionárním webovém prostředí**

Reprodukovatelnost představuje fundamentální požadavek pro přijetí experimentální vědecké práce, přičemž oblast umělé inteligence a zpětnovazebného učení čelí v tomto ohledu značným výzvám. Výsledky RL algoritmů jsou často vysoce senzitivní na inicializační podmínky, nastavení hyperparametrů a pseudonáhodné procesy. V kontextu longitudinálního experimentu probíhajícího v reálném čase v částečně pozorovatelném (partially observable) a stochastickém prostředí webového prohlížeče je zajištění reprodukovatelnosti o to složitější.8

Kritický rámec pro zajištění reprodukovatelnosti longitudinálního RL experimentu spočívá v implementaci rigorózního systému řízení náhodnosti, precizním logování okrajových podmínek a verzování veškerých datových výstupů.

### **Striktní správa náhodnosti (Seed Management)**

RL algoritmy jsou inherentně závislé na prvcích náhodnosti. Průzkum prostředí (exploration) v Q-učení by bez stochastického výběru akcí nevedl k objevení optimálních strategií.6 Tato náhodnost však musí být deterministicky reprodukovatelná, aby bylo možné experiment kdykoliv zopakovat se stejným výsledkem.

Základním pravidlem je explicitní fixace tzv. náhodných seedů (random seeds) pro všechny použité knihovny a výpočetní rámce před zahájením jakékoliv experimentální epochy.9 V případě použití jazyka Python a klientských rozhraní je nutné definovat pevné počáteční stavy pro generátory pseudonáhodných čísel (např. pomocí funkcí jako random.seed(), numpy.random.seed()). Zásadním aspektem pro zamezení nedeterminismu, na který se často zapomíná, je fixace systémové proměnné PYTHONHASHSEED na pevnou hodnotu. Zajišťuje se tak stejné hašování datových struktur v paměti napříč různými běhy experimentu.11

Pro pokročilý empirický design v RL se doporučuje metodologické oddělení zdrojů náhodnosti. Znamená to nezávislou inicializaci seedu pro rozhodovací procesy agenta a nezávislou inicializaci seedu pro stochastické události v simulovaném nebo webovém prostředí. Tento přístup umožňuje přesnější párové testování a hlubší pochopení toho, do jaké míry je variabilita výsledků způsobena samotným agentem oproti variabilitě plynoucí z vnějších vlivů.4 Vzhledem k vysokému rozptylu RL algoritmů je navíc nutné evaluovat model napříč vícenásobnými nezávislými běhy s různými seedy a reportovat statistický rozptyl, čímž se zamezí publikačnímu zkreslení (tzv. cherry-picking), kdy by byl prezentován pouze anomálně úspěšný běh.4

### **Logování a abstrakce stavů webového prostředí**

Longitudinální experiment trvající dekádu generuje obrovské penzum dat. Logování kompletního HTML stromu a všech vlastností DOMu při každém výpočetním kroku agenta je z důvodu paměťové i výpočetní náročnosti naprosto neřešitelné. Akademickým standardem pro tyto případy je implementace účelné abstrakce stavového prostoru a ukládání agregovaných metrik prostředí.

Logovací mechanismus musí zachycovat environmentální proměnné, které mají přímý formativní vliv na ontogenezi agenta, aniž by vedly k zahlcení databáze. Mezi tyto kritické parametry patří:

1. **Senzorický Viewport:** Průběžné ukládání rozměrů aktivního okna prohlížeče, které definují fyzické hranice agentova světa.  
2. **Strukturální složitost DOMu (DOM Complexity):** Místo celého stromu se extrapolují klíčové metriky, jako je celkový počet uzlů na stránce, maximální hloubka zanoření elementů, distribuce blokových versus inline prvků a lokální hustota interaktivních prvků v bezprostředním okolí agenta. Tyto strukturální indikátory poskytují dostatečný kontext o topologii prostoru.  
3. **Kvantifikace uživatelských interakcí:** Chování uživatele je primárním dynamickým stimulem. Systém musí agregovaně logovat frekvenci a charakter interakcí – průměrnou rychlost pohybu kurzoru (v pixelech za sekundu), mapy kliknutí, vzorce skrolování (vertikální a horizontální zrychlení) a míru klidových fází (idle time) uživatele.

Záznamy o průběhu učení a interakcí musí být strukturovány do transparentních a auditovatelných datových formátů (např. JSON protokoly ukládající čtveřice stav, akce, odměna, následující stav pro každou epizodu).13 Pro uchování a systematickou správu logů v čase se doporučuje využití dedikovaných verzovacích platforem a nástrojů pro experiment tracking, jako jsou DVC (Data Version Control) či MLflow. Tyto systémy zajišťují plnou provenienci dat a umožňují návrat k historickým stavům experimentu.8 Současně je vhodné zvážit izolaci experimentálního prostředí do kontejnerů, byť v případě front-endových webových aplikací toto řeší spíše konzistenci back-endu než absolutní uniformitu na straně klientského prohlížeče.14

## **Statistická analýza a kvantifikace behaviorální komplexity**

Vzhledem k povaze experimentu, jehož cílem je prokázat vývoj a "dospívání" digitální entity, nelze se spoléhat výhradně na konvenční metriky typu průměrné kumulativní odměny. Prokazování ontogeneze vyžaduje aplikaci sofistikovaných nástrojů pro analýzu dynamiky chování. Jak se agent vyvíjí, jeho interakce s prostředím přecházejí od náhodného prohledávání k vysoce strukturovaným, komplexním a predikovatelným vzorcům. Tuto behaviorální trajektorii lze exaktně popsat pomocí metrik odvozených z teorie informace a algoritmické složitosti.15

### **Aplikace metrik informační teorie**

V průběhu svého života generuje agent kontinuální sekvenci pozorování a akcí. Evaluace složitosti těchto sekvencí je klíčem k pochopení jeho kognitivního vývoje.17

**Shannonova informační entropie:** Shannonova entropie poskytuje fundamentální míru neurčitosti a překvapení v rozložení agentových akcí. Výpočet entropie ![][image1] (kde ![][image2] reprezentuje výskyt konkrétní akce nebo symbolu chování) definuje minimální průměrný počet bitů potřebných k zakódování tohoto chování.18 V kontextu longitudinálního experimentu se entropie chová jako vynikající indikátor stadia učení:

* Ve fázi *Hatchling*, která je ovládnuta stochastickou explorací, agent zkouší široké spektrum akcí bez jasného cíle. Rozložení pravděpodobností je relativně rovnoměrné, což vede k **vysoké hodnotě Shannonovy entropie**.21  
* V kontrastu s tím, ve fázi *Elder*, kdy agent optimalizoval svou politiku a využívá naučené postupy (exploatace), začne preferovat malou podmnožinu vysoce efektivních sekvencí. Entropie jeho chování se proto **snižuje**, což matematicky prokazuje stabilizaci a determinističtější výkon.19

**Lempel-Ziv komplexita (LZC) a algoritmická komprese:** Zatímco Shannonova entropie analyzuje pouze frekvenci výskytu jednotlivých akcí a ignoruje jejich vzájemné sekvenční uspořádání, Lempel-Ziv komplexita se zaměřuje na strukturální nepředvídatelnost. LZC kvantifikuje algoritmickou složitost konečné sekvence na základě počtu unikátních podřetězců (vzorců), které jsou nutné k její plné rekonstrukci.17 V praxi se tento přístup implementuje aplikací kompresních algoritmů (např. z rodiny LZ77 nebo gzip) na sekvenci agentova chování.19 Z pohledu principu minimální délky popisu (Minimum Description Length) platí, že chování, které obsahuje strukturované a pravidelné vzorce, je komprimovatelnější a má tedy nižší algoritmickou složitost než čistě náhodný šum.15

* Chování nezkušeného agenta (Hatchling) se podobá bílému šumu; obsahuje minimum pravidelností a vykazuje **vysokou LZC** (je téměř nekomprimovatelné).  
* Chování starého agenta (Elder), který si osvojil reaktivní rutiny (např. sekvence typu: identifikace blížícího se kurzoru ![][image3] okamžitý přesun do bezpečného nodu ![][image3] vyčkávání), obsahuje strukturální redundanci. Jeho sekvence je snáze komprimovatelná. V literatuře umělého života se kompresibilita používá jako přesná míra pro posouzení, do jaké míry si agent internalizoval pravidla prostředí a přešel od chaosu ke strukturované adaptaci.18

Díky kombinaci těchto dvou metrik lze v manuskriptu zkonstruovat tzv. mapy komplexity-entropie (complexity-entropy maps). Tyto diagramy explicitně demonstrují balanc mezi produkcí nových informací (explorací) a využíváním existujících korelací v chování, čímž poskytují komplexní obraz ontogeneze.21

### **Statistické testování a evaluace fází**

Pro rigorózní testování hypotéz o rozdílech mezi fázemi Hatchling a Elder recenzenti často kritizují prosté použití aritmetických průměrů. Rozložení výkonnostních metrik v RL experimentech vykazuje asymetrické distribuce, dlouhé chvosty nebo bimodální rysy, které klasické konfidenční intervaly nedokážou správně postihnout.4

Akademický standard vyžaduje sofistikovanější přístupy:

1. **Toleranční intervaly s mediánovým výkonem:** Lépe zachycují vnitřní nestabilitu chování agenta během jednotlivých výpočetních běhů a odolávají vlivu extrémních odchylek.4  
2. **Smíšené modely s lineárními efekty (Linear Mixed-Effects Models):** Vhodné pro modelování závislostí behaviorálních metrik v průběhu času, které dokážou zohlednit náhodné efekty plynoucí z rozdílného chování lidských uživatelů při jednotlivých sezeních.26  
3. **Částečná dekompozice informací (Partial Information Decomposition, PID):** Tato moderní metoda analyzuje úroveň vnitřní autonomie agenta. PID dokáže matematicky rozlišit, do jaké míry se agentovo rozhodování opírá o jeho vnitřní paměť (naučené Q-hodnoty v průběhu 10 let) ve srovnání s bezprostředním, reaktivním spoléháním na aktuální senzorické vstupy z okolí.27 Využití PID jednoznačně odliší triviální agenty od systémů, které si úspěšně internalizovaly dynamiku svého světa.

## **Standardy vizualizace a metriky pro peer review**

Požadavek na interpretovatelnost umělé inteligence (Explainable AI, XAI) se stal pro konference typu NeurIPS a CHI naprosto stěžejním. Recenzní řízení neposuzuje pouze koncový výkon systému, ale především schopnost autorů otevřít "černou skříňku" a vysvětlit, jaké strategie si model vytvořil a jak dospívá ke svým rozhodnutím.28 Předložení pokročilých vizualizačních nástrojů je proto kritickou podmínkou úspěchu.

### **Mapování hodnotové funkce (Q-value Heatmaps)**

Nejintuitivnějším nástrojem pro demonstraci prostorové orientace RL agenta ve 2D webovém prostředí je vizualizace hodnotové funkce prostřednictvím teplotních map. Tyto mapy převádějí abstraktní matice čísel z Q-tabulky do srozumitelné topografie. Teplotní mapa vizualizovaná formou poloprůhledné vrstvy (overlay) přes samotný DOM ukazuje, jak agent subjektivně vnímá různé sekce stránky z hlediska budoucí kumulativní odměny.30 Barevný gradient (např. sytě červená pro oblasti s rizikem těsné blízkosti kurzoru a sytě zelená pro bezpečné, zónově stabilní uzly DOMu) dává recenzentům bezprostřední důkaz o tom, že se agent vyvinul v entitu s hlubokým pochopením prostorové dynamiky svého prostředí.30

### **Matice přechodů politik (Policy Transition Matrices)**

Pro analýzu dynamických změn v chování se využívají matice přechodů. Tyto vizualizace odhalují pravděpodobnosti, s jakými agent přechází mezi různými kognitivními či behaviorálními makro-stavy (např. přechod ze stavu "explorace neznámého div elementu" do stavu "okamžitý únik před skrolováním"). Publikace těchto matic prokazuje strukturální evoluci politiky v čase. Zatímco u mladého agenta bude matice přechodů značně rovnoměrná a stochastická, u dlouhodobě trénovaného agenta očekává recenzent vizuální důkaz konsolidace – silně zvýrazněné hrany v matici (nebo grafových reprezentacích aktivačních sítí), které indikují vysoce deterministické a účelné behaviorální smyčky optimalizované pro přežití a zisk.31

### **Behaviorální etogramy**

Etogramy představují inovativní vizualizační techniku přejatou primárně z etologie zvířat a translační biomedicíny, která se v posledních letech etablovala jako klíčový nástroj pro hodnocení autonomních systémů a umělého života.33 Etogram vizualizuje sekvenční "tok chování" (behavioral flow) na časové ose, přičemž kategorizuje kontinuální aktivitu do diskrétních stavů (např. sledování kurzoru, ukrývání se, cyklický pohyb). Zobrazením časových os etogramů pro fázi Hatchling a Elder vedle sebe lze markantně ilustrovat přerod od fragmentovaného, náhodného přepínání akcí k dlouhým, smysluplným blokům kontinuálního chování.34

### **Ontogenetické trajektorie**

Ontogenetické grafy zachycují makroskopickou evoluci agenta napříč měsíci a roky. Umožňují sledovat dlouhodobé trendy v metrikách, jako je celková komplexita, entropie či adaptace na prudké změny (například na kompletní redesign layoutu stránky, který nasimuluje ekologický šok). Tyto trajektorie prokazují robustnost modelu a demonstrují, zda si systém udržel schopnost kontinuálního učení (lifelong learning), nebo zda podlehl fenoménům jako je katastrofické zapomínání (catastrophic forgetting).36

## **Etické aspekty a GDPR implikace**

Jakýkoli experiment založený na sběru a analýze interakcí lidského uživatele – včetně polohy kurzoru (cursor tracking), trajektorie pohybu myši, hloubky skrolování nebo frekvence kliknutí – otevírá mimořádně závažné etické a právní otázky z hlediska ochrany soukromí. Evropské nařízení GDPR pohlíží na behaviorální a biometrické stopy jako na vysoce riziková data, z nichž lze za pomoci moderních algoritmů často derivovat identitu, kognitivní stavy či dokonce emocionální rozpoložení uživatele.37

Fakt, že v architektuře experimentu zůstávají data zpracovávána výhradně lokálně (na zařízení uživatele bez odesílání na centrální server), sice představuje excelentní implementaci principu *Privacy by Design*, avšak nezbavuje experiment působnosti GDPR. Nařízení se aplikuje vždy, dochází-li k prokazatelnému "monitorování chování" osob nacházejících se na území Evropského hospodářského prostoru.39

### **Výzkumná výjimka v rámci GDPR (Článek 89\)**

Významnou výhodou pro akademický sektor je skutečnost, že vědecký výzkum, jehož cílem je rozšiřování kolektivního poznání, požívá v rámci GDPR do jisté míry privilegovaného postavení.41 Nařízení obsahuje tzv. "výzkumné výjimky" (zakotvené v Článku 89 a vysvětlené v Recitálech 157 a 159). Tyto výjimky umožňují flexibilnější nakládání s daty (například možnost dalšího zpracování či limitace práva na výmaz, pokud by toto právo vážně ohrozilo cíle výzkumu), ovšem striktně podmiňují tuto flexibilitu existencí odpovídajících technických a organizačních záruk.41

Při prezentaci článku na konferencích bude vyžadováno podrobné vysvětlení těchto záruk. Autoři musí deklarovat striktní uplatnění principu minimalizace dat – agent loguje pouze vektorové rysy interakce (např. numerické hodnoty relativní vzdálenosti) nezbytné pro úpravu Q-hodnot, nikoli identifikační data uživatele. Dalším silným argumentem je obfuskace, pseudonymizace v reálném čase, nebo odesílání výlučně agregovaných RL modelů namísto surových telemetrických dat.39 Tento model (tzv. federated nebo on-device learning architecture) zcela zásadně snižuje míru rizika narušení soukromí.45

### **Etická kontrola a informovaný souhlas**

Zákonné uvolnění nevyvazuje akademické výzkumníky z povinnosti dodržovat rigorózní etické standardy.41 Recenzenti v oborech interakce člověka s počítačem (HCI) jsou k etickým nedostatkům obzvláště nesmlouvaví a absence etické sekce v článku téměř jistě povede k zamítnutí.

1. **Informovaný souhlas:** Zjišťování pohybů myši a behaviorální profilování uživatelů vyžaduje jasný, dobrovolný a ničím nepodmíněný souhlas (opt-in). Souhlas musí být srozumitelný a musí obsahovat identifikaci výzkumníka, účel zpracování dat (vědecký experiment zaměřený na digitální ontogenezi), rozsah sbíraných parametrů a garanci, že analýza probíhá výhradně lokálně.47  
2. **Schválení etickou komisí (IRB):** Každý longitudinální výzkum využívající data o lidském chování by měl projít schvalovacím procesem institucionální etické komise (Institutional Review Board, IRB). Ačkoli může být projekt s ohledem na lokální povahu dat a anonymizaci následně klasifikován jako "IRB exempt" (osvobozen od plného dohledu) 49, předchozí konzultace a formální získání tohoto statusu představují kritický důkaz metodologické integrity pro peer review.

## **Relevantní rešeršní kontext a State-of-the-Art**

Pro přesvědčivé ukotvení projektu jako seriózního a originálního vědeckého díla je nezbytné jeho zařazení do existující taxonomie umělého života (ALife) a digitální ontogeneze. Experimenty zkoumající dlouhodobý vývoj a adaptaci autonomních digitálních entit navazují na bohatý historický odkaz. Zmiňovaný paper musí explicitně diskutovat fundamentální referenční rámec.

**Karl Sims a Evolved Virtual Creatures (1994):** Monumentální dílo Karla Simse z MIT a Thinking Machines Corporation ustanovilo standard pro simulaci vývoje digitálních organismů.50 Sims vyvinul evoluční algoritmus pro 3D virtuální bytosti v plně fyzikálním simulovaném prostředí. Namísto tradičního kinematického skriptování a expertního dohledu nechal morfologii těl a neurální řízení organismů, kódované pomocí orientovaných grafů, vyvíjet spontánně na základě kompetice a přirozeného výběru.50 Vzniklo zcela emergentní chování, jako plavání, plížení či sofistikované strategie k odepření přístupu protivníka k cíli.53 Vztaženo k popisovanému longitudinálnímu experimentu: Sims prokázal, že fyzikální omezení stimulují komplexitu. U tabulárního Q-agenta plní roli těchto "fyzikálních omezení" restrikce struktury DOMu a dynamika uživatelského kurzoru.

**Thomas S. Ray a systém Tierra (1990):** Ekolog Thomas Ray vytvořil softwarový systém Tierra, který představoval vůbec první úspěšnou demonstraci evoluce darwinovského typu realizovanou výhradně v logickém a informačním prostoru.55 Samoreplikující se počítačové programy (digitální organismy) v tomto prostředí bojovaly o čas procesoru (analogický energii) a diskový prostor (materiál). Tierra prokázala, že umělé entity ponechané dlouhodobému evolučnímu tlaku vytvářejí bez zásahu stvořitele udivující ekologickou komplexitu, včetně vzniku parazitů, hyper-parazitů, obranných imunitních struktur a kooperativních organizací.56 Váš projekt navazuje na Rayovu vizi "open-ended evolution" (nekonečného evolučního prostoru), nicméně přenáší tento koncept z úrovně evoluce druhu (fylogeneze) na úroveň adaptace v rámci jednoho celoživotního cyklu inteligentního agenta (ontogeneze) pomocí RL.58

**Hiroki Sayama a distribuovaná samoorganizace:** Mostem k současným přístupům je rozsáhlá publikační činnost Hiroki Sayamy (SUNY Binghamton), který se zaměřuje na samoorganizaci, evoluční komplexní systémy a emergentní jevy v distribuovaných výpočetních médiích.59 Jeho práce (např. objev samoreplikujících se struktur "evoloops" v rámci celulárních automatů) ukazuje, jak lokální pravidla a interakce v prostoru generují globální, hierarchicky nadřazené vzorce chování.61 Odkazy na Sayamovy teoretické koncepce samoorganizace a "open-endedness" propůjčí studii o 10letém RL agentovi potřebnou teoretickou a terminologickou hloubku, obzvláště při vysvětlování toho, jak ze sekvencí kliknutí a posunů v DOMu vzniká stabilní a adaptabilní architektura.64

## **Publikační fóra, konference a deadliny (Výhled 2025/2026)**

Volba publikační platformy je strategickým krokem, který by měl odrážet primární ohnisko rukopisu. Lze volit mezi zaměřením na biologickou fenomenologii (ALIFE), interakci a dopady na uživatele (CHI) nebo algoritmický přínos modelu učení (NeurIPS). Pro nadcházející publikační cyklus jsou relevantní následující akce a jejich parametry:

### **ALIFE 2026 (Conference on Artificial Life)**

Z hlediska tématu (digitální ontogeneze a životní cyklus agenta) se jedná o nejpřirozenější a nejvíce profilové vědecké fórum na světě.

* **Místo a datum konání:** Waterloo, Ontario, Kanada, 17\. – 21\. srpna 2026 (tradičně v hybridním formátu).65  
* **Hlavní téma konference:** „Living and Life-like Complex Adaptive Systems“.66  
* **Klíčové termíny (Deadlines):**  
  * Návrhy speciálních sekcí (Special Sessions) a workshopů: 20\. února 2026\.67  
  * **Uzávěrka pro plné články (Full Papers submission): 30\. března 2026 (dle časové zóny AoE \- Anywhere on Earth)**.65  
  * Oznámení autorům o přijetí/zamítnutí: 7\. června 2026\.68  
  * Podání tzv. Late-Breaking Abstracts (předběžné výsledky formou plakátu): 20\. července 2026\.68  
* **Formát a publikační standardy:** Preferovaným výstupem je Full Paper. Článek nesmí překročit délku 8 stran (bez zahrnutí referencí) a prochází striktním double-blind (dvoustranně anonymním) recenzním řízením. Odevzdává se jako jeden ucelený PDF soubor s formátováním na US Letter (LaTeX šablony jsou volně k dispozici).69 Sborníky konference ALIFE vydává v plně Open Access režimu prestižní nakladatelství MIT Press.64

### **ACM CHI 2026 (Conference on Human Factors in Computing Systems)**

Pokud bude experiment formulován primárně přes optiku interakce člověka s umělou inteligencí, hodnocení adaptace front-endového prostředí a zkoumání odezvy uživatelů na autonomní chování webových elementů, je konference CHI absolutním vrcholem oboru.

* **Místo a datum konání:** Barcelona, Španělsko, 13\. – 17\. dubna 2026\.73  
* **Klíčové termíny (Deadlines):**  
  * Registrace abstraktu a metadat: 4\. září 2025 (AoE).75  
  * **Odevzdání plného textu (Full Paper): 11\. září 2025 (AoE)**.75  
  * Prvotní vyrozumění a fáze Revise & Resubmit: 4\. listopadu 2025\.75  
  * Finální rozhodnutí: 15\. ledna 2026\.75  
  * Kategorie Interactive Demos a Posters (vynikající alternativa k hlavnímu tracku pro prezentaci samotného agenta): uzávěrka podání 22\. ledna 2026\.75  
* **Formát:** CHI od nedávna upustila od pevných stránkových limitů a rozděluje příspěvky do kategorií Short Papers (do 5000 slov) a Standard-length Papers (5000 až 12000 slov).76 Výzkum musí jasně deklarovat výběr specifické podkomise (Subcommittee, např. "Blending Interaction" nebo "Interacting with Devices") a článek bude nemilosrdně posuzován s ohledem na originální přínos (Significance) a etickou robustnost.78

### **NeurIPS 2025 a Workshopy**

Prezentovat empirický experiment tabulárního Q-učení na hlavní scéně NeurIPS je kvůli jeho teoretickému zaměření vysoce nepravděpodobné. Workshopy konané u příležitosti NeurIPS však poskytují ideální a vysoce respektovanou platformu pro netradiční přístupy v oblastech rozhodovacích modelů a "Embodied AI".

* **Místo a datum konání:** San Diego, Kalifornie (hlavní konference 2\. – 7\. prosince 2025, přičemž samotné workshopy proběhnou 6\. – 7\. prosince).80  
* **Tematické okruhy a deadliny:** Témata jako *Embodied World Models for Decision Making* se zaměřují na přesun od teoretických k simulovaným agendám.81 Samotné workshopy se hlásí do konce května, ale pro přispěvatele do již vypsaných workshopových tracků (Call for Contributions) platí sjednocený doporučený orientační **deadline 22\. srpna 2025 (AoE)**. Finální oznámení o akceptaci či zamítnutí v rámci všech workshopů pak proběhne nejpozději 22\. září 2025\.80

### **ACM Creativity & Cognition (C\&C) 2026**

Pro případ, že experiment balancuje na pomezí umělé inteligence, designu rozhraní a generativní digitální tvorby, konference C\&C poskytuje skvělou multidisciplinární platformu.

* **Místo a datum konání:** Londýn, Velká Británie (Central Saint Martins, University of the Arts London), 13\. – 16\. července 2026\.83  
* **Klíčové termíny (Deadlines):**  
  * **Zaslání plných článků (Full Submission): 5\. února 2026 (s povinným vkladem abstraktu do 29\. ledna 2026\)**.83  
  * Alternativní umělecké a vizuální expozice (Art Exhibition): do 19\. února 2026\.83

Tento souhrn ukazuje, že z hlediska časového plánování představuje podání na podzimní deadliny konference CHI 2025 prioritní a velmi brzký cíl, zatímco hlavní konference ALIFE a C\&C dávají na přípravu plnohodnotného textu prostor až do jarních měsíců roku 2026\.

## **Závěr a doporučení**

Úspěšný přesun návrhu od technologické ukázky (dema) směrem k průlomové akademické publikaci nevyžaduje dramatickou změnu algoritmu, ale výhradně aplikaci striktní formální metodologie. Experiment simulující celoživotní vývoj a digitální ontogenezi autonomního agenta ve variabilním ekosystému webového prohlížeče je vysoce inovativní. Tento koncept má fundamentální potenciál otestovat schopnosti RL algoritmů kontinuálně řešit balanc mezi exploatací a explorací mimo hranice statických datasetů a sterilních iterací.

Klíčovým předpokladem úspěchu v recenzním řízení je implementace kontrolních stavů (zejména srovnání s fixní politikou a myopickým modelem), které izolují skutečný kognitivní zisk algoritmu. Ke kvantifikaci pokroku napříč fázemi ("Hatchling" a "Elder") nelze použít pouze prostou odměnu. Namísto ní autoři musí využít kombinaci Shannonovy entropie a algoritmické komprese pomocí Lempel-Zivovy komplexity k tomu, aby demonstrovali strukturální přesun od chaotického vyhledávání k uspořádaným, efektivním a smysluplným behaviorálním sekvencím.

Aplikace moderních vizualizačních standardů, obzvláště teplotních map (heatmaps) chování na topologii DOMu a etogramů sekvenční akce, uspokojí poptávku recenzentů po transparentní a interpretovatelné umělé inteligenci (XAI). Současně ale nesmí být podceněny etické limity longitudinálního sledování lidských interakcí na webu. Otevřená transparentní deklarace postupů, zajišťujících minimalizaci dat a zpracování bez přenosu (on-device), v souladu s příslušnými vědeckými výjimkami GDPR (Článek 89), vytvoří z tohoto textu nejen hluboce inspirativní příspěvek oboru ALife, ale zároveň učebnicový příklad eticky koncipovaného výzkumu interakce člověka se strojem.

#### **Citovaná díla**

1. Shaping and policy search in Reinforcement learning \- University of California, Berkeley, použito března 7, 2026, [https://rail.eecs.berkeley.edu/deeprlcourse-fa17/docs/ng-thesis.pdf](https://rail.eecs.berkeley.edu/deeprlcourse-fa17/docs/ng-thesis.pdf)  
2. A Collaborative Multi-Agent Reinforcement Learning Approach for Non-Stationary Environments with Unknown Change Points \- MDPI, použito března 7, 2026, [https://www.mdpi.com/2227-7390/13/11/1738](https://www.mdpi.com/2227-7390/13/11/1738)  
3. Three Baseline Policies Your Reinforcement Learning Algorithm Absolutely Should Outperform \- Medium, použito března 7, 2026, [https://medium.com/data-science/three-baseline-policies-your-reinforcement-learning-algorithm-absolutely-should-outperform-d2ff4d1175b8](https://medium.com/data-science/three-baseline-policies-your-reinforcement-learning-algorithm-absolutely-should-outperform-d2ff4d1175b8)  
4. Empirical Design in Reinforcement Learning, použito března 7, 2026, [https://jmlr.org/papers/volume25/23-0183/23-0183.pdf](https://jmlr.org/papers/volume25/23-0183/23-0183.pdf)  
5. Single-Subject Experimental Design for Evidence-Based Practice \- PMC \- NIH, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC3992321/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3992321/)  
6. Why do you need to include a random element, epsilon, in reinforcement learning? \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/reinforcementlearning/comments/18zmrfl/why\_do\_you\_need\_to\_include\_a\_random\_element/](https://www.reddit.com/r/reinforcementlearning/comments/18zmrfl/why_do_you_need_to_include_a_random_element/)  
7. towards interpretable reinforcement learning interactive visualizations to increase insight, použito března 7, 2026, [https://www.ri.cmu.edu/app/uploads/2020/12/Magister\_Scientiae\_Thesis.pdf](https://www.ri.cmu.edu/app/uploads/2020/12/Magister_Scientiae_Thesis.pdf)  
8. Reproducibility in Machine Learning-based Research: Overview, Barriers and Drivers, použito března 7, 2026, [https://arxiv.org/html/2406.14325v3](https://arxiv.org/html/2406.14325v3)  
9. Reproducibility in Machine Learning \- GeeksforGeeks, použito března 7, 2026, [https://www.geeksforgeeks.org/machine-learning/reproducibility-in-machine-learning/](https://www.geeksforgeeks.org/machine-learning/reproducibility-in-machine-learning/)  
10. Configure Exploration for Reinforcement Learning Agents \- MATLAB & Simulink, použito března 7, 2026, [https://www.mathworks.com/help/reinforcement-learning/ug/use-visualization-to-configure-exploration.html](https://www.mathworks.com/help/reinforcement-learning/ug/use-visualization-to-configure-exploration.html)  
11. Properly Setting the Random Seed in ML Experiments. Not as Simple as You Might Imagine, použito března 7, 2026, [https://odsc.medium.com/properly-setting-the-random-seed-in-ml-experiments-not-as-simple-as-you-might-imagine-219969c84752](https://odsc.medium.com/properly-setting-the-random-seed-in-ml-experiments-not-as-simple-as-you-might-imagine-219969c84752)  
12. Reproducibility in Machine Learning-based Research: Overview, Barriers and Drivers, použito března 7, 2026, [https://arxiv.org/html/2406.14325v2](https://arxiv.org/html/2406.14325v2)  
13. simple rl: Reproducible Reinforcement Learning in Python \- David Abel, použito března 7, 2026, [https://david-abel.github.io/papers/simple\_rl.pdf](https://david-abel.github.io/papers/simple_rl.pdf)  
14. Reproducibility standards for machine learning in the life sciences \- PMC \- NIH, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC9131851/](https://pmc.ncbi.nlm.nih.gov/articles/PMC9131851/)  
15. Measuring and Optimizing Behavioral Complexity for Evolutionary Reinforcement Learning \- IDSIA, použito března 7, 2026, [https://www.idsia.ch/\~tino/papers/gomez.icann09.pdf](https://www.idsia.ch/~tino/papers/gomez.icann09.pdf)  
16. Behavioral Entropy-Guided Dataset Generation for Offline Reinforcement Learning \- arXiv, použito března 7, 2026, [https://arxiv.org/abs/2502.04141](https://arxiv.org/abs/2502.04141)  
17. Measuring and Optimizing Behavioral Complexity, použito března 7, 2026, [https://people.idsia.ch/\~juergen/icann2009gomez.pdf](https://people.idsia.ch/~juergen/icann2009gomez.pdf)  
18. Measuring and Optimizing Behavioral Complexity for Evolutionary Reinforcement Learning, použito března 7, 2026, [https://www.researchgate.net/publication/221079720\_Measuring\_and\_Optimizing\_Behavioral\_Complexity\_for\_Evolutionary\_Reinforcement\_Learning](https://www.researchgate.net/publication/221079720_Measuring_and_Optimizing_Behavioral_Complexity_for_Evolutionary_Reinforcement_Learning)  
19. Seq2Seq2Seq: Lossless Data Compression via Discrete Latent Transformers and Reinforcement Learning \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2602.12146v1](https://arxiv.org/html/2602.12146v1)  
20. Entropy-based metrics for predicting choice behavior based on local response to reward \- PMC, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC8590026/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8590026/)  
21. Complexity-entropy analysis at different levels of organisation in written language \- PMC, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC6505741/](https://pmc.ncbi.nlm.nih.gov/articles/PMC6505741/)  
22. On-Policy RL with Optimal Reward Baseline \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2505.23585v1](https://arxiv.org/html/2505.23585v1)  
23. Entropy and Complexity Tools Across Scales in Neuroscience: A Review \- MDPI, použito března 7, 2026, [https://www.mdpi.com/1099-4300/27/2/115](https://www.mdpi.com/1099-4300/27/2/115)  
24. Complexity measures in automatic design of robot swarms: An exploratory study \- SciSpace, použito března 7, 2026, [https://scispace.com/pdf/complexity-measures-in-automatic-design-of-robot-swarms-an-1mdbynyoti.pdf](https://scispace.com/pdf/complexity-measures-in-automatic-design-of-robot-swarms-an-1mdbynyoti.pdf)  
25. Measuring and Optimizing Behavioral Complexity for Evolutionary Reinforcement Learning \- SciSpace, použito března 7, 2026, [https://scispace.com/pdf/measuring-and-optimizing-behavioral-complexity-for-3l9hmghwve.pdf](https://scispace.com/pdf/measuring-and-optimizing-behavioral-complexity-for-3l9hmghwve.pdf)  
26. Navigating the chaos of psychedelic fMRI brain-entropy via multi-metric evaluations of acute psilocybin effects \- medRxiv.org, použito března 7, 2026, [https://www.medrxiv.org/content/10.1101/2023.07.03.23292164v3.full](https://www.medrxiv.org/content/10.1101/2023.07.03.23292164v3.full)  
27. Quantifying Reinforcement-Learning Agent's Autonomy, Reliance on Memory and Internalisation of the Environment \- MDPI, použito března 7, 2026, [https://www.mdpi.com/1099-4300/24/3/401](https://www.mdpi.com/1099-4300/24/3/401)  
28. Explainable AI and Reinforcement Learning—A Systematic Review of Current Approaches and Trends \- Frontiers, použito března 7, 2026, [https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2021.550030/full](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2021.550030/full)  
29. Explainable Reinforcement Learning for Longitudinal Control \- the University of Groningen research portal, použito března 7, 2026, [https://research.rug.nl/en/publications/explainable-reinforcement-learning-for-longitudinal-control/](https://research.rug.nl/en/publications/explainable-reinforcement-learning-for-longitudinal-control/)  
30. Visualizing Policies and Value Functions in Reinforcement Learning \- CodeSignal, použito března 7, 2026, [https://codesignal.com/learn/courses/game-on-integrating-rl-agents-with-environments/lessons/visualizing-policies-and-value-functions-in-reinforcement-learning](https://codesignal.com/learn/courses/game-on-integrating-rl-agents-with-environments/lessons/visualizing-policies-and-value-functions-in-reinforcement-learning)  
31. Visualizing Reinforcement Learning: A Hands-On Guide to Value and Policy Iteration with the MDP Simulator | by Thiruthanigesan | Medium, použito března 7, 2026, [https://medium.com/@thiru.sliit/visualizing-reinforcement-learning-a-hands-on-guide-to-value-and-policy-iteration-with-the-mdp-0558851de8b3](https://medium.com/@thiru.sliit/visualizing-reinforcement-learning-a-hands-on-guide-to-value-and-policy-iteration-with-the-mdp-0558851de8b3)  
32. REVEAL-IT: REinforcement learning with Visibility of Evolving Agent poLicy for InTerpretability \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2406.14214v1](https://arxiv.org/html/2406.14214v1)  
33. An autonomous AI agent for universal behavior analysis \- bioRxiv, použito března 7, 2026, [https://www.biorxiv.org/content/10.1101/2025.05.15.653585v1.full.pdf](https://www.biorxiv.org/content/10.1101/2025.05.15.653585v1.full.pdf)  
34. Analysis of behavioral flow resolves latent phenotypes \- PMC \- NIH, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC11621029/](https://pmc.ncbi.nlm.nih.gov/articles/PMC11621029/)  
35. Dogs' Social Referencing towards Owners and Strangers \- CoLab.ws, použito března 7, 2026, [https://colab.ws/articles/10.1371%2Fjournal.pone.0047653](https://colab.ws/articles/10.1371%2Fjournal.pone.0047653)  
36. Geographic Information Systems technology as a morphometric tool for quantifying morphological variation in an ammonoid clade | Request PDF \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/publication/264157798\_Geographic\_Information\_Systems\_technology\_as\_a\_morphometric\_tool\_for\_quantifying\_morphological\_variation\_in\_an\_ammonoid\_clade](https://www.researchgate.net/publication/264157798_Geographic_Information_Systems_technology_as_a_morphometric_tool_for_quantifying_morphological_variation_in_an_ammonoid_clade)  
37. Fines for GDPR violations in AI systems and how to avoid them \- DPO Europe, použito března 7, 2026, [https://data-privacy-office.eu/fines-for-gdpr-violations-in-ai-systems-and-how-to-avoid-them/](https://data-privacy-office.eu/fines-for-gdpr-violations-in-ai-systems-and-how-to-avoid-them/)  
38. Combating Web Tracking: Analyzing Web Tracking Technologies for User Privacy \- MDPI, použito března 7, 2026, [https://www.mdpi.com/1999-5903/16/10/363](https://www.mdpi.com/1999-5903/16/10/363)  
39. Web Scraping for Research: Legal, Ethical, Institutional, and Scientific Considerations This is a non-peer reviewed working paper. \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2410.23432v1](https://arxiv.org/html/2410.23432v1)  
40. Guidance for EU General Data Protection Regulations (GDPR) compliance in the conduct of human research., použito března 7, 2026, [https://irb.northwestern.edu/resources-guidance/policies-guidance/docs/guidance-for-general-data-protection-regulations-gdpr-compliance---general---19171.pdf](https://irb.northwestern.edu/resources-guidance/policies-guidance/docs/guidance-for-general-data-protection-regulations-gdpr-compliance---general---19171.pdf)  
41. Data protection laws apply to anyone who collects information about a living individual. So what do researchers in arts, humanities and social sciences need to know? \- LSE Blogs, použito března 7, 2026, [https://blogs.lse.ac.uk/impactofsocialsciences/2020/09/16/data-protection-laws-apply-to-anyone-who-collects-information-about-a-living-individual-so-what-do-researchers-need-to-know/](https://blogs.lse.ac.uk/impactofsocialsciences/2020/09/16/data-protection-laws-apply-to-anyone-who-collects-information-about-a-living-individual-so-what-do-researchers-need-to-know/)  
42. How GDPR changes the rules for research \- IAPP, použito března 7, 2026, [https://iapp.org/news/a/how-gdpr-changes-the-rules-for-research](https://iapp.org/news/a/how-gdpr-changes-the-rules-for-research)  
43. A Preliminary Opinion on data protection and scientific research, použito března 7, 2026, [https://www.edps.europa.eu/sites/default/files/publication/20-01-06\_opinion\_research\_en.pdf](https://www.edps.europa.eu/sites/default/files/publication/20-01-06_opinion_research_en.pdf)  
44. Is behavioral data private information? \- Netquest, použito března 7, 2026, [https://www.netquest.com/en/blog/is-behavioral-data-private-information](https://www.netquest.com/en/blog/is-behavioral-data-private-information)  
45. Privacy-preserving local analysis of digital trace data: A proof-of-concept \- PMC, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC9058917/](https://pmc.ncbi.nlm.nih.gov/articles/PMC9058917/)  
46. Implications for research | Data protection, information security and data privacy | Loughborough University, použito března 7, 2026, [https://www.lboro.ac.uk/data-privacy/help/implicationsforresearch/](https://www.lboro.ac.uk/data-privacy/help/implicationsforresearch/)  
47. The impact of the European Union (EU) General Data Protection Regulation (GDPR) on research data collected from human participants, použito března 7, 2026, [https://researchservices.cornell.edu/sites/default/files/2020-02/GDPR%20Research%20Guidance%20-%20Final.pdf](https://researchservices.cornell.edu/sites/default/files/2020-02/GDPR%20Research%20Guidance%20-%20Final.pdf)  
48. Importance of GDPR Compliance in Tracking Locator Data \- MetaLocator, použito března 7, 2026, [https://www.metalocator.com/news/gdpr-compliance-tracking-locator-data/](https://www.metalocator.com/news/gdpr-compliance-tracking-locator-data/)  
49. Understanding Users' Security and Privacy Concerns and Attitudes Towards Conversational AI Platforms \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2504.06552v1](https://arxiv.org/html/2504.06552v1)  
50. Evolving 3D Morphology and Behavior by Competition \- Karl Sims, použito března 7, 2026, [https://www.karlsims.com/papers/alife94.pdf](https://www.karlsims.com/papers/alife94.pdf)  
51. Analysis of “Evolved Virtual Creatures — Evolution Simulation, 1994” | by June Bee, použito března 7, 2026, [https://medium.com/@junesthoughts/analysis-of-evolved-virtual-creatures-evolution-simulation-1994-9bab510157e9](https://medium.com/@junesthoughts/analysis-of-evolved-virtual-creatures-evolution-simulation-1994-9bab510157e9)  
52. “Evolving virtual creatures” by Sims \- ACM SIGGRAPH HISTORY ARCHIVES, použito března 7, 2026, [https://history.siggraph.org/learning/evolving-virtual-creatures-by-sims/](https://history.siggraph.org/learning/evolving-virtual-creatures-by-sims/)  
53. Evolving Virtual Creatures \- Karl Sims, použito března 7, 2026, [https://www.karlsims.com/papers/siggraph94.pdf](https://www.karlsims.com/papers/siggraph94.pdf)  
54. Evolving Virtual Creatures \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/publication/372873160\_Evolving\_Virtual\_Creatures](https://www.researchgate.net/publication/372873160_Evolving_Virtual_Creatures)  
55. Tierra (computer simulation) \- Wikipedia, použito března 7, 2026, [https://en.wikipedia.org/wiki/Tierra\_(computer\_simulation)](https://en.wikipedia.org/wiki/Tierra_\(computer_simulation\))  
56. Evolution, Ecology and Optimization of Digital Organisms, použito března 7, 2026, [https://faculty.cc.gatech.edu/\~turk/bio\_sim/articles/tierra\_thomas\_ray.pdf](https://faculty.cc.gatech.edu/~turk/bio_sim/articles/tierra_thomas_ray.pdf)  
57. Biological Information : Tierra: The Character of Adaptation \- World Scientific Publishing, použito března 7, 2026, [https://www.worldscientific.com/doi/pdf/10.1142/9789814508728\_0005](https://www.worldscientific.com/doi/pdf/10.1142/9789814508728_0005)  
58. Evolving Digital Ecological Networks \- PMC \- NIH, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC3605903/](https://pmc.ncbi.nlm.nih.gov/articles/PMC3605903/)  
59. ‪Hiroki Sayama‬ \- ‪Google Scholar‬, použito března 7, 2026, [https://scholar.google.com/citations?user=IwDCodEAAAAJ\&hl=en](https://scholar.google.com/citations?user=IwDCodEAAAAJ&hl=en)  
60. Hiroki Sayama \- Our faculty | Systems Science and Industrial Engineering | Binghamton University, použito března 7, 2026, [https://www.binghamton.edu/ssie/people/profile.html?id=sayama](https://www.binghamton.edu/ssie/people/profile.html?id=sayama)  
61. Evolution of Self-Replicators within Cellular Automata: 25 Years After Evoloops, použito března 7, 2026, [https://www.nichele.eu/ALIFE-DistributedGhost/4-Sayama.pdf](https://www.nichele.eu/ALIFE-DistributedGhost/4-Sayama.pdf)  
62. \[1903.07456\] Self-Organization and Artificial Life \- arXiv, použito března 7, 2026, [https://arxiv.org/abs/1903.07456](https://arxiv.org/abs/1903.07456)  
63. (PDF) Self-Organization and Artificial Life \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/publication/343142320\_Self-Organization\_and\_Artificial\_Life](https://www.researchgate.net/publication/343142320_Self-Organization_and_Artificial_Life)  
64. ALIFE 2018 \- The 2022 Conference on Artificial Life \- MIT Press, použito března 7, 2026, [https://direct.mit.edu/isal/alife2018/volume/30](https://direct.mit.edu/isal/alife2018/volume/30)  
65. Conferences \- Artificial Life, použito března 7, 2026, [https://alife.org/conference/](https://alife.org/conference/)  
66. Announcement of ALIFE 2026 venue, dates and organizers\! \- Artificial Life, použito března 7, 2026, [https://alife.org/2025/08/15/announcement-of-alife-2026-venue-dates-and-organizers/](https://alife.org/2025/08/15/announcement-of-alife-2026-venue-dates-and-organizers/)  
67. Call for Papers \- The 2026 Artificial Life Conference, použito března 7, 2026, [https://2026.alife.org/call-for-papers/](https://2026.alife.org/call-for-papers/)  
68. The 2026 Artificial Life Conference, použito března 7, 2026, [https://2026.alife.org/](https://2026.alife.org/)  
69. Call for Papers \- ALIFE 2024 Copenhagen \- Artificial Life, použito března 7, 2026, [https://2024.alife.org/call\_paper.html](https://2024.alife.org/call_paper.html)  
70. Call for Papers & Summaries \- ALife 2025 \- Artificial Life, použito března 7, 2026, [https://2025.alife.org/submit](https://2025.alife.org/submit)  
71. Instructions for Authors: Alife XII Proceedings, použito března 7, 2026, [https://di.ulb.ac.be/map/tlenaert/Home\_Tom\_Lenaerts/INFO-F-409-projects\_files/formatting\_instructions.pdf](https://di.ulb.ac.be/map/tlenaert/Home_Tom_Lenaerts/INFO-F-409-projects_files/formatting_instructions.pdf)  
72. Publications \- Artificial Life, použito března 7, 2026, [https://alife.org/publications/](https://alife.org/publications/)  
73. CHI 2026 \- SIGCHI, použito března 7, 2026, [https://sigchi.org/events/chi-2026/](https://sigchi.org/events/chi-2026/)  
74. HOME \- CHI 2026 \- web.cvent.com, použito března 7, 2026, [https://web.cvent.com/event/0dcbc575-efe9-44c1-87fc-c65e8e0d12b8/summary](https://web.cvent.com/event/0dcbc575-efe9-44c1-87fc-c65e8e0d12b8/summary)  
75. ACM CHI 2026: Welcome to CHI 2026 in Barcelona\!, použito března 7, 2026, [https://chi2026.acm.org/](https://chi2026.acm.org/)  
76. Papers \- ACM CHI 2026, použito března 7, 2026, [https://chi2026.acm.org/authors/papers/](https://chi2026.acm.org/authors/papers/)  
77. Workshops \- ACM CHI 2026, použito března 7, 2026, [https://chi2026.acm.org/workshops/](https://chi2026.acm.org/workshops/)  
78. Selecting a Subcommittee \- ACM CHI 2026, použito března 7, 2026, [https://chi2026.acm.org/authors/papers/selecting-a-subcommittee/](https://chi2026.acm.org/authors/papers/selecting-a-subcommittee/)  
79. Guide to a Successful Submission \- ACM CHI 2026, použito března 7, 2026, [https://chi2026.acm.org/guide-to-a-successful-submission/](https://chi2026.acm.org/guide-to-a-successful-submission/)  
80. 2025 Dates and Deadlines \- NeurIPS, použito března 7, 2026, [https://neurips.cc/Conferences/2025/Dates](https://neurips.cc/Conferences/2025/Dates)  
81. NeurIPS 2025 Workshops, použito března 7, 2026, [https://neurips.cc/virtual/2025/events/workshop](https://neurips.cc/virtual/2025/events/workshop)  
82. NeurIPS 2025 Call for Workshops, použito března 7, 2026, [https://neurips.cc/Conferences/2025/CallForWorkshops](https://neurips.cc/Conferences/2025/CallForWorkshops)  
83. Creativity & Cognition 2026, použito března 7, 2026, [https://cc.acm.org/2026/](https://cc.acm.org/2026/)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAYCAYAAAAcYhYyAAAAyUlEQVR4XmNgGAWjgHQwEYhTkfgdQFyDxMcLxIH4EpSdC8S/gPg/lH8WiHugbLwApgEEeKB8fSC2gLIjkORxAiMkdhkDqqEcSGwYOAnEfOiCyOATA6oh2EArugA6ABmwGF2QEBBggGhUZkCEhxaS/FUktjwQ7wPiuUhiYDCTAaKRE4jPQdmKUDlQ4K6AskHgNhALAfFfJDEwYGSAaARhVwaIi2D8OiR1MAAKVKJiCx8gFOgEgQMDxEu8DJCwJBv8AOLl6IKjABUAAOZLJemxiJROAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAVUlEQVR4XmNgGAWjgKpgL7oAJeAfugAlwAaIy9AFKQHngNgcXRAETMjEt4B4HwMa8CMTX4NiFgYKwUQg9kYXJAcoAnEnuiC54BO6ACXgMLrAKBhuAACnlhESw2iRqwAAAABJRU5ErkJggg==>