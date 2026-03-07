# **Architektonická a konceptuální analýza autonomních digitálních organismů v prostředí Document Object Modelu: Projekt Lili**

Zkoumání průniku umělé inteligence, procedurální animace a webového inženýrství přináší nové paradigma v návrhu digitálních rozhraní. Tradiční webové aplikace jsou navrhovány jako statické nebo deterministické struktury, které čekají na explicitní vstup uživatele. Předložený návrh projektu „Lili — Autonomous Digital Companion“ definuje zcela odlišný přístup: vytvoření autonomního digitálního organismu (ve formě chobotnice), který obývá Document Object Model (DOM) webové stránky jako svůj přirozený habitat. Tento dokument představuje vyčerpávající architektonickou, technickou a filozofickou analýzu tohoto konceptu, zkoumá existující open-source repozitáře a referenční implementace a hodnotí proveditelnost tohoto zero-dependency JavaScriptového modulu.

Zásadní otázkou předloženou k analýze je, zda podobný projekt již v prostředí internetu existuje a zda jsou k dispozici open-source repozitáře, které tento koncept realizují. Odpověď vyžaduje detailní dekonstrukci jednotlivých technických požadavků – od bezmodelového zpětnovazebného učení (Q-Learning) přes procedurální inverzní kinematiku (FABRIK) až po chronobiologický model s desetiletým životním cyklem.

## **Analýza existujících open-source projektů a filozofických předobrazů**

Při zkoumání dostupné open-source scény a existujících repozitářů je zřejmé, že přesná implementace projektu Lili – tedy plně autonomní, učící se entita žijící v DOMu bez jakýchkoliv externích závislostí – v současné době neexistuje. Koncept je však hluboce zakořeněn v existujících teoretických rámcích a dílčích open-source projektech, které slouží jako stavební kameny pro navrhovanou architekturu.

### **Projekt Dosidicus: Kognitivní pískoviště a neurogeneze**

Nejvýznamnějším filozofickým a konceptuálním předobrazem je open-source projekt Dosidicus (repozitář ViciousSquid/Dosidicus).1 Tento projekt je definován jako „transparentní kognitivní pískoviště maskované jako digitální chobotnice“ a představuje klíčový referenční bod pro autonomní digitální organismy.1 Dosidicus sdílí s projektem Lili vizuální metaforu hlavonožce a základní filozofii autonomie – zvíře, které se učí ze svého prostředí a vyvíjí se.

Technologická a architektonická realizace projektu Dosidicus se však od návrhu Lili radikálně odlišuje, což potvrzuje originalitu zkoumaného konceptu:

| Parametr | Projekt Dosidicus | Projekt Lili (Návrh) |
| :---- | :---- | :---- |
| **Běhové prostředí** | Desktopová aplikace, Python, PyQt5.2 | Webový prohlížeč, Vanilla JavaScript, DOM. |
| **Závislosti** | NumPy, custom STRINg engine.1 | Zero dependencies (nulové závislosti). |
| **Model učení** | Hebbovské učení, strukturální neurogeneze.1 | Tabulkové zpětnovazebné učení (Q-Learning). |
| **Architektura sítě** | Viditelná topologie neuronů (startuje s 8 neurony).1 | Skrytá Q-tabulka v localStorage. |
| **Vztah k uživateli** | Vyžaduje krmení a stimulaci (Tamagotchi styl).1 | Ambientní společník, nevyžaduje péči, nezemře. |

Z analýzy repozitáře a komunitních diskuzí vyplývá, že ačkoliv existovaly návrhy na převedení (portování) enginu Dosidicus do JavaScriptu (například pomocí nástrojů pro kompilaci z Pythonu do JS) 5, žádný plnohodnotný JavaScriptový port, který by operoval transparentně nad webovým DOMem, nebyl realizován. Dosidicus zůstává izolovanou simulací, zatímco Lili je navržena jako symbiotický překryv (overlay) existujících webových struktur. Filozofie transparentního mozku u projektu Dosidicus 1 je v případě Lili nahrazena behaviorální transparentností – uživatel nevidí synapsy, ale vidí výsledky Q-hodnot skrze emergentní chování.

### **Fenomén Thronglets a popkulturní rezonance**

Zajímavým kontextuálním zjištěním je vliv populární kultury, konkrétně seriálu Black Mirror (epizoda S07E04 „Plaything“). V této epizodě vystupují fiktivní digitální organismy zvané Thronglets, které žijí vlastním životem a mají výhradně digitální biologii.7 Koncept těchto digitálních entit vyvolal značný ohlas a vedl k vytvoření reálných herních adaptací.10

Při bližším zkoumání herních mechanik spojených s Thronglets je však zřejmé, že se jedná o simulátory budování společnosti (city-building) a správu zdrojů.10 Hráč se stará o množící se entity, těží zdroje a čelí morálním dilematům (například využití kostí entit pro stavbu mostů).10 V open-source komunitě existují pokusy o klonování tohoto chování, například projekt Vivarium, který modeluje evoluční neuronové sítě v mřížkovém světě.13 Tyto projekty, stejně jako Thronglets, jsou však uzavřené v dedikovaných herních oknech nebo aplikacích.14 Architektura Lili tento model odmítá; entita se nemnoží, nevyžaduje management zdrojů a především – její herní plochou není prázdné plátno, nýbrž samotný text, nadpisy a obrázky webové stránky, na kterou je připojena.

### **Knihovna ReinforceJS jako referenční standard**

Z hlediska implementace umělé inteligence v čistém JavaScriptu je absolutním standardem a referenčním bodem knihovna reinforcejs, jejímž autorem je Andrej Karpathy (repozitář karpathy/reinforcejs).15 Tato knihovna poskytuje referenční implementace algoritmů jako Dynamic Programming (DP), Temporal Difference (TD) učení a Deep Q-Networks (DQN) v prostředí prohlížeče bez externích závislostí.18

Návrh projektu Lili na tuto filozofii navazuje, avšak aplikuje ji s extrémním zaměřením na minimalismus a perzistenci. Zatímco reinforcejs se často používá pro demonstrace v izolovaných prostředích (gridworlds, waterworld) 20, Lili implementuje tabulkový Q-Learning s diskretizovaným stavovým prostorem tak, aby celý „mozek“ organismu mohl být serializován do formátu JSON a ukládán do localStorage (s přísným limitem pod 15 KB). Tento přístup umožňuje dlouhodobou paměť napříč návštěvami stránky bez nutnosti backendových serverů.

Posun k autonomním systémům, které nevyžadují explicitní instrukce, nýbrž se učí z prostředí, je tématem, které rezonuje i v odborných kruzích a na vývojářských konferencích. Koncept „když produkt mluví zpět“ nebo autonomně interaguje, jak zaznělo například v diskuzích o budoucnosti webového designu na WebExpo 22, ukazuje, že statické webové stránky jsou postupně obohacovány o proaktivní prvky. Lili tento koncept dovádí do extrému tím, že produkt nejen interaguje, ale stává se nezávislou formou digitálního života.

## **Architektura izolace a integrace do webového rozhraní**

Základním předpokladem pro úspěšné nasazení projektu typu Lili je striktní izolační rámec. Požadavek na spuštění prostřednictvím jediného \<script defer\> tagu bez jakéhokoliv modifikování \<head\>, meta tagů nebo existujících CSS stylů představuje ukázkový příklad defenzivního programování a je z hlediska moderního JavaScriptu zcela proveditelný.

### **Canvas Overlay a propustnost událostí**

Architektura předepisuje dynamické vytvoření elementu \<canvas id="lili-canvas"\> s CSS vlastnostmi position: fixed, rozměry 100vw × 100vh a vysokým z-index: 9999\. Zásadní je zde použití vlastnosti pointer-events: none. Tento atribut zajišťuje, že plátno, ačkoliv překrývá celý obsah stránky, neblokuje uživateli prokliknutí na odkazy, tlačítka nebo výběr textu. DOM pod plátnem zůstává plně interaktivní.

Tento přístup však přináší architektonickou výzvu: jak může uživatel interagovat (klikat) na samotnou entitu, když plátno propouští všechny události myši? Návrh toto řeší delegováním detekce kliknutí na globální objekt document. Při každém kliknutí (click event) se vypočítá Euklidovská vzdálenost mezi kurzorem a aktuálními souřadnicemi těla entity. Je-li vzdálenost menší než tolerantní poloměr (bodyR \* 2.5), událost je interpretována jako kliknutí na entitu. Tento matematický *hit-testing* je mnohem efektivnější a spolehlivější než pokusy o dynamické přepínání pointer-events na specifických oblastech plátna.

### **Reverzibilita a ochrana DOM rozložení**

Klíčovým architektonickým pravidlem, které definuje „zdvořilost“ tohoto digitálního společníka, je nulový zásah do rozložení (layoutu) stránky. Veškeré haptické interakce, při kterých chapadla entity manipulují s textem nebo obrázky, musí být prováděny výhradně pomocí CSS vlastnosti transform (např. translate a rotate) a úpravou barvy (color).

Z hlediska renderovacího enginu prohlížeče je tento přístup optimální. Modifikace vlastností jako width, height, margin nebo display by způsobila přepočítání rozložení celé stránky (tzv. *reflow* nebo *layout recalculation*), což by při interakci se stovkami prvků vedlo k drastickým propadům snímkové frekvence (FPS). Naproti tomu CSS transform je obvykle zpracováván odděleně (compositing) a může být hardwarově akcelerován na GPU. Tím je zaručeno, že pohyb chapadel, která „oťukávají“ slova, nezpůsobí posun textu na dalších řádcích a nenaruší čitelnost dokumentu.

Pro detekci dynamických změn obsahu (např. při použití na Single Page Applications nebo při lazy-loadingu) architektura správně navrhuje využití rozhraní MutationObserver. Tento observer sleduje změny ve struktuře DOM a spouští přepočet prostorových map. Z důvodu výkonové optimalizace je nezbytné, aby byly tyto přepočty časově omezeny (throttled), v návrhu specifikováno na maximálně jeden přepočet za 500 ms.

## **Zpětnovazebné učení (Reinforcement Learning) jako motor emergentního chování**

Jádrem autonomie entity není deterministický stavový automat s větvením if/else, nýbrž Markovský rozhodovací proces (MDP) řešený pomocí bezmodelového zpětnovazebného učení, konkrétně Q-Learningu. Agent si nevytváří mapu prostředí, ale učí se optimální strategii přímou interakcí a vyhodnocováním okamžitých odměn.

### **Diskretizace stavového prostoru**

Jedním z největších problémů tabulkového Q-Learningu je exploze stavového prostoru (State Space Explosion). Pokud by agent vnímal přesné souřadnice kurzoru a přesný počet DOM elementů, Q-tabulka by narostla do milionů kombinací, což by znemožnilo ukládání do localStorage a dramaticky zpomalilo konvergenci učení.

Návrh tento problém elegantně řeší silnou diskretizací spojitých (kontinuálních) proměnných. Stav prostředí je definován jako vektor složený ze senzorických vstupů:

| Senzor | Typ a rozsah | Způsob diskretizace | Popis vlivu na agenta |
| :---- | :---- | :---- | :---- |
| **Cursor Proximity** | Spojitý → Diskrétní (3 stavy) | far / medium / near | Detekce hrozby nebo zájmu. |
| **Cursor Velocity** | Spojitý → Diskrétní (4 stavy) | still / slow / fast / aggressive | Odlišuje čtení uživatele od prudkých pohybů. |
| **DOM Density** | Spojitý → Diskrétní (3 stavy) | sparse / medium / dense | Využito k rozhodnutí, zda provádět exploraci prvků. |
| **Whitespace Proximity** | Spojitý → Diskrétní (3 stavy) | in\_whitespace / near / far | Určuje preferenční klidové zóny. |
| **Scroll State** | Diskrétní (2 stavy) | idle / active | Zamezuje interakci při rychlém posunu stránky. |
| **Time of Day** | Diskrétní (4 stavy) | morning / afternoon / evening / night | Ovlivňuje cirkadiánní rytmus a barvu. |
| **Age Phase** | Diskrétní (5 stavů) | hatchling až elder | Moduluje parametry fyziky a rychlost učení. |

Tato komprese dat zaručuje, že celkový počet možných stavů zůstává v řádech několika tisíců. Bellmanova rovnice pro aktualizaci Q-hodnot je implementována v cyklech:

![][image1]  
Kde ![][image2] (learning rate) je nastaveno na stabilních ![][image3] a ![][image4] (discount factor) na ![][image5], což klade silný důraz na budoucí odměny a nutí entitu plánovat kroky (například přesun do bezpečné zóny předtím, než kurzor udeří).

### **Návrh funkce odměn (Reward Function)**

Chování entity zcela emerguje z tabulky odměn a trestů. Funkce odměn je v kontextu autonomních digitálních organismů ekvivalentem DNA – definuje, co je žádoucí a co je škodlivé.

Nejkritičtější penalizace v systému (![][image6]) je aplikována v situaci, kdy agent překrývá text a kurzor se nehýbe, což indikuje, že uživatel čte. Toto je označeno za "nejhorší hřích", neboť to přímo narušuje primární funkci webové stránky. Odměna ![][image7] je udělena za sdílení prázdného prostoru (whitespace), zatímco uživatel čte. Penalizace za stereotypii (![][image8] za opakování stejné akce) zabraňuje tomu, aby se agent zacyklil v lokálním minimu a neustále opakoval stejný pohyb v rohu obrazovky.

Toto matematické formování „zdvořilosti“ je mnohem robustnější než pevně naprogramované trasy pohybu. Algoritmus učí entitu, aby si postupem času našla okrajové části obrazovky a stala se ambientním, nerušivým společníkem.

### **Dynamická epsilon-greedy strategie a rozhodovací cyklus**

Klasické modely Q-učení využívají pro vyvážení explorace (zkoušení nových akcí) a exploatace (využití naučených znalostí) parametr ![][image9] (epsilon). Běžně se ![][image9] snižuje s počtem trénovacích iterací. Zde je implementován zásadní koncepční obrat: parametr ![][image9] neklesá s počtem výpočetních smyček, nýbrž se strukturálně váže na *biologický věk* entity.

Ve fázi líhnutí (Hatchling) je ![][image10], což znamená, že v 85 % případů agent provede náhodnou akci. Zkoumá svět, naráží do DOM elementů a učí se. S přibývajícím věkem se míra explorace snižuje. Fáze Elder (stáří), dosažená po několika letech, má ![][image10]. Agent se stává téměř deterministickým, využívá pouze akce s nejvyšší naučenou Q-hodnotou.

Z výkonnostního hlediska je kritické, že Q-Learning rozhodovací cyklus není volán v každém vykresleném snímku (což by při 60 FPS představovalo 60 maticových operací za sekundu). Vyhodnocení stavu a odměny probíhá každých 30 až 60 snímků (zhruba 1–2 Hz). Mezi těmito rozhodnutími přebírají řízení plynulé fyzikální kormidelní algoritmy.

## **Kormidelní chování (Steering Behaviors) a prostorové hashování**

Rozhodnutí Q-Learning modulu je diskrétní (např. „uteč“ nebo „hledej prázdný prostor“). Pro převod tohoto diskrétního rozhodnutí na plynulý, organický pohyb v prostředí prohlížeče využívá architektura vektorový model kormidelních chování (Steering Behaviors), popsaný Craigem Reynoldsem pro simulaci pohybu hejn.23

Pohyb je modelován akumulací sil ovlivňujících zrychlení (acceleration) a rychlost (velocity) entity. Akce wander nevyužívá náhodné generování souřadnic (což by vedlo ke strojovému, škubavému pohybu), nýbrž projekci kružnice před agentem, po jejímž obvodu se posouvá cílový bod řízený Perlinovým nebo Simplexním šumem. Výsledkem je organické plutí po křivkách, typické pro podvodní živočichy. Bezpečnostní vrstvy, jako je odpuzování od okrajů (boundary) a vyhýbání se překážkám (obstacle avoidance), jsou aktivní neustále bez ohledu na aktuální akci zvolenou Q-tabulkou.

### **Výkonová optimalizace: Spatial Hashing**

Pro realizaci efektivního vyhýbání se překážkám a interakce s DOM elementy je nutné detekovat kolize mezi agentem a bounding boxy HTML elementů na stránce. Webové stránky mohou běžně obsahovat stovky až tisíce DOM uzlů. Testování kolizí mezi entitou a všemi elementy metodou hrubé síly v každém snímku má kvadratickou složitost ![][image11], což by spolehlivě způsobilo zablokování hlavního vlákna (main thread) prohlížeče a propad FPS.

Architektura zavádí algoritmus **Spatial Hash Grid**. Viewport je virtuálně rozdělen na mřížku buněk (například 120 × 120 pixelů). Během inicializace a při událostech jako window.resize nebo při triggeru MutationObserver jsou všechny relevantní viditelné DOM elementy (jako odstavce, nadpisy a obrázky) indexovány a vloženy do hashovací mapy na základě toho, do kterých buněk fyzicky zasahují.

Agent během pohybu vypočítá klíč buňky, ve které se právě nachází, a testuje kolize výhradně s elementy v této buňce a jejích osmi bezprostředních sousedech. Tento postup radikálně redukuje časovou složitost hledání překážek z lineární/kvadratické na konstantní ![][image12]. V kombinaci s voláním requestAnimationFrame, které zajišťuje, že se výpočty a vykreslování pozastaví, pokud je záložka prohlížeče neaktivní (document.hidden), je zajištěno splnění cíle využití procesoru (CPU overhead pod 2 % v nečinnosti a pod 5 % při plném pohybu).

## **Fyzika chapadel: FABRIK algoritmus a inverzní kinematika**

Biologická volba chobotnice jako referenčního organismu není samoúčelná. Chobotnice disponují silně decentralizovaným nervovým systémem, kde jsou neurony distribuovány napříč chapadly.1 Tento biologický fakt je v architektuře zrcadlen použitím osmi nezávislých řetězců inverzní kinematiky (IK).

Pro animaci těchto chapadel je specifikován algoritmus **FABRIK** (Forward And Backward Reaching Inverse Kinematics), který vyvinuli Aristidou a Lasenby v roce 2011\.24 Tento algoritmus představuje dramatický posun oproti tradičním metodám řešení IK, jako jsou Jacobian Transpose nebo Cyclic Coordinate Descent (CCD).25

Tradiční IK řešiče spoléhají na výpočty úhlů rotace kloubů a složité inverze matic, které jsou výpočetně nákladné a často trpí singularitami (kdy se systém zablokuje ve stavu, kdy není schopen dosáhnout cíle). FABRIK naproti tomu využívá jednoduché lineární algebraické operace. Pracuje na principu pozicování bodů na přímce a zachování konstantních délek segmentů v iterativním procesu.

Pro každé chapadlo se v každém snímku provádí:

1. **Forward Reach (Dosah vpřed):** Koncový bod chapadla (tip) je posunut přímo na cílové souřadnice. Následně se každý další segment směrem k základně přepočítá tak, aby délka segmentu zůstala zachována. Tím se základna chapadla odtrhne od těla.  
2. **Backward Reach (Dosah vzad):** Základna je vrácena na svůj pevný kotevní bod na obvodu těla organismu. Proces zachování délek se zopakuje směrem ke špičce.

Tento obousměrný proces konverguje k cíli mimořádně rychle. Pro 8 segmentů jednoho chapadla jsou zapotřebí pouze 3 až 4 iterace na jeden snímek, aby byla vizuální odchylka nepostřehnutelná. Vzhledem k tomu, že JavaScript běží v jednom vlákně (single-threaded), je tato extrémní výpočetní úspornost FABRIK algoritmu klíčovým faktorem, který umožňuje plynulé vykreslování 64 interagujících uzlů v reálném čase.28 Godot Engine a další moderní rámce využívají FABRIK právě pro jeho stabilitu v 2D prostoru.28

Vykreslování těchto uzlů neprobíhá pomocí přímých čar, nýbrž spojením uzlů skrze kvadratické Bézierovy křivky. Šířka čáry se interpoluje od silné základny k tenké špičce, s aplikací Perlinova šumu na profil tloušťky. Výsledkem je organický, nemechanický vzhled chapadla, bez nutnosti stahování externích textur.

## **Procedurální vizualizace: Chromatofory jako informační vrstva**

V souladu s pravidlem absolutní autonomie projekt neobsahuje žádné tradiční uživatelské rozhraní (UI), indikátory stavu nebo dialogová okna. Jediným prvkem poskytujícím textová data je skrytý debugovací panel (aktivovaný stiskem klávesy D) a minimalistický informativní tooltip při kliknutí na entitu.

Veškerá komunikace vnitřního stavu entity probíhá prostřednictvím vizualizačního systému tvořeného chromatofory – buněčnými strukturami schopnými změny barvy. Architektura využívá barevný model HSL (Hue, Saturation, Lightness) pro dynamické mapování skrytých stavů MDP modelu do viditelného spektra na elementu \<canvas\>.

Barevný vzorec agreguje tři hlavní vektory:

1. **Biologický věk (ageNormalized)**: Ovlivňuje základní odstín (Hue) a světlost (Lightness). Mláďata jsou světle akvamarínová, zatímco staré entity nabývají temně indigové barvy se sníženou světelností.  
2. **Cirkadiánní rytmus (timeOfDay)**: Ráno se barvy zahřívají a zesvětlují, v noci se sytost snižuje a odstín se posouvá k chladnějším tónům, simulujícím sníženou aktivitu v nočním cyklu.  
3. **Model stresu (stress)**: Stres roste při rychlých pohybech kurzoru v bezprostřední blízkosti nebo při sérii kolizí. Zvýšení stresu způsobuje prudký posun odstínu k teplým (červeným) tónům a okamžitý nárůst sytosti. Akce úspěšného útěku (flee) generuje krátkodobé, 300ms probliknutí vysoce kontrastní barvy, což je přímá vizuální odezva na funkci odměny v RL algoritmu.

Tento přístup, využívající procedurální generování gradientů (radialGradient) a aplikaci šumu na eliptické okraje těla, udržuje paměťovou náročnost (memory footprint) pod hranicí 5 MB JavaScriptového heapu. Absence WebGL shaderů a bitmapových souborů zásadním způsobem pomáhá splnit cíl udržet velikost souboru pod 50 KB po minifikaci.

## **Chronobiologie a koncept asanace prostředí (Midnight Cleanup)**

Digitální produkty jsou převážně navrhovány pro okamžitou spotřebu, maximalizaci zapojení uživatele (user engagement) nebo rychlé provedení konkrétního úkolu. Koncept Lili představuje *Calm Technology* (Klidnou technologii), kde je prvek času ústředním motivem návrhu.

### **Desetiletý životní cyklus a perzistence**

Většina autonomních systémů operuje s časem ve formě diskrétních iterací nebo epoch učení. Architektura Lili mapuje tyto proměnné na reálný čas od okamžiku vytvoření záznamu lili\_genesis (uloženého jako timestamp v localStorage). Věk entity je rozdělen do pěti fází – Hatchling, Juvenile, Adult, Mature a Elder.

| Fáze | Časový horizont | Parametry dynamiky a explorace (ϵ) | Filozofický projev |
| :---- | :---- | :---- | :---- |
| **Hatchling** | 0 – 2 týdny | Vysoká rychlost (![][image13]), ![][image10] | Chaotická explorace, časté narážení, neposednost. |
| **Juvenile** | 2 týdny – 3 měsíce | Střední rychlost (![][image14]), ![][image10] | Formování preferencí na základě naučené Q-tabulky. |
| **Adult** | 3 měsíce – 2 roky | Stabilní rychlost (![][image15]), ![][image10] | Teritoriální chování, vyhledávání klidových zón. |
| **Mature** | 2 roky – 6 let | Nízká rychlost (![][image16]), ![][image10] | Silné zvyky, minimální reaktivita na běžné podněty. |
| **Elder** | 6 let – 10 let | Téměř statické (![][image17]), ![][image10] | Monumentální klid, téměř deterministické chování. |

Návrh výslovně zdůrazňuje, že „Elder Lili je téměř nehybná. To není bug, to je vlastnost.“ Toto rozhodnutí zcela převrací typické interakční paradigma softwaru. Uživatel si v průběhu let zvyká na postupně slábnoucí aktivitu entity, což vytváří ambientní vazbu. Zcela se eliminuje nutkavá potřeba se o virtuální bytost starat (syndrom úzkosti Tamagotchi) – Lili nevyžaduje potravu a bez interakce neumírá.

### **Haptická interakce s DOM a indexace textu**

Zvědavost entity je realizována fyzickým ohmatáváním obsahu stránky. Během inicializace systému se provádí operace obalení jednotlivých textových slov do HTML značek \<span\> (tzv. word-level interakce). Když se chapadlo, řízené FABRIK algoritmem, přiblíží k těmto značkám, element je vychýlen pomocí mírné rotace a posunu (transform: rotate(Xdeg) translate(Ypx)).

Aplikace CSS transformací na tisíce malých elementů představuje potenciální úzké hrdlo výkonu. Proto architektura zavádí striktní omezení: interakce se týká maximálně 4 elementů současně a transformace probíhají plynule přes CSS transition.

### **Asanace prostředí (Midnight Cleanup)**

Pravidelné vychylování prvků by po několika hodinách prohlížení jedné statické stránky mohlo vést ke stavu, kdy je text vizuálně rozházený a ztěžuje čtení. Navržený systém tento problém řeší procesem „nočního úklidu“.

Mechanismus každou minutu asynchronně kontroluje aktuální čas proti uloženému časovému razítku lili\_last\_cleanup. Jakmile čas překročí půlnoc (přechod do nového kalendářního dne), aktivuje se proces, který vybere všechny elementy modifikované entitou (označené přes datový atribut data-lili-touched) a aplikuje na ně plynulou reverzní animaci (ease-out o délce 1.2 sekundy) zpět do nulového stavu. Tato technika má nejen funkční, paměťově-očistný přesah, ale především poetický efekt: včerejší stopy organismu se vymažou, struktura webu je obnovena, zatímco entita samotná žije dál, uchovávající si své kognitivní zkušenosti v nezávislé vrstvě localStorage.

## **Porovnání s příbuznými trendy v oblasti umělé inteligence a autonomních společníků**

V současném diskurzu vývoje umělé inteligence se objevuje velké množství projektů využívajících pokročilé techniky (od strojového učení přes velkojazyčné modely až po cloudové agenty). Přesto se koncept Lili od těchto systémů diametrálně liší svou fundamentální architekturou a účelem.

Tradiční weboví AI agenti, často označovaní jako rozhraní pro navigaci na webu (např. WebVoyager nebo experimenty ve frameworku World of Bits) 29, jsou navrhováni primárně za účelem **vykonávání úkolů (Task-oriented)**. Jejich účelem je porozumět uživatelskému vstupu (např. „rezervuj letenku“), lokalizovat relevantní prvky v DOMu a simulovat kliknutí či zadání textu, aby bylo dosaženo stanoveného cíle. Spoléhají na cloudové zpracování dat velkými jazykovými modely (LLM) s mohutnou infrastrukturou.

Projekt Lili se naproti tomu definuje výlučně jako **ambientní koexistence**. Neposkytuje žádnou užitnou automatizační hodnotu. Její chování je izolované a zcela lokální, opírající se o tabulkovou Q-tabulku uloženou v paměti prohlížeče, která reflektuje výhradně vlastní přežití a adaptaci organismu na webovou stránku jako fyzické prostředí.

Zatímco průmyslový standard pro virtuální společníky se přesouvá směrem ke konverzačním modelům generujícím přirozený jazyk (například chatboti simulující emoce a dialog), Lili se opírá o základní behaviourismus a symbolickou inteligenci. Generativní dialogy jsou výslovně v architektuře zakázány s odůvodněním, že by to narušilo iluzi autonomního, nelidského zvířete. Z psychologického hlediska tento neantropomorfní design zamezuje pádu do tzv. efektu „mrtvého údolí“ (Uncanny Valley) a nepředstírá porozumění lidské řeči, což buduje hlubší a upřímnější ambientní empatii.

| Charakteristika | Běžní AI agenti a chatboti | Projekt „Lili“ |
| :---- | :---- | :---- |
| **Cílové zaměření** | Automatizace, řešení úkolů, generování textu | Ambientní koexistence, adaptace, zkoumání |
| **Běhové prostředí** | Připojení na API velkých jazykových modelů (cloud) | Lokální běh v prohlížeči (100% Vanilla JavaScript) |
| **Komunikační rozhraní** | Přirozený jazyk (NLP), konverzační rozhraní | Nekomunikační, vizuální chromatofory, haptika |
| **Mechanismus učení** | Pre-trénované modely (LLMs, Deep Learning) | Lokální online Q-Learning (tabulkový MDP) |
| **Paměť a perzistence** | Kontextové okno (vektorové databáze na serverech) | Q-tabulka v limitovaném lokálním úložišti (15 KB) |

Vyloučení jakýchkoli síťových dotazů a cizích API znamená naprostou bezpečnost pro hostitelskou stránku. Všechny informace o interakci kurzoru či scrollingu zůstávají bezpečně na uživatelově zařízení, což představuje ostrý kontrast k současným nástrojům extrahujícím osobní data pro analýzu v cloudu.

## **Závěrečná syntéza a zhodnocení proveditelnosti**

Rozsáhlá analýza dostupných open-source ekosystémů, úložišť zdrojových kódů a teoretických rámců zaměřených na virtuální zvířata, algoritmické kormidelní chování, inverzní kinematiku a Reinforcement Learning vede k několika stěžejním závěrům ohledně projektu „Lili — Autonomous Digital Companion“.

1. **Unikátnost a neexistence přímé kopie:** K dnešnímu dni neexistuje žádný dokončený, dostupný open-source repozitář, který by kompletně replikoval zadanou specifikaci. Koncept autonomního, nezávislého organismu implementovaného ve striktně jednom bez-závislostním souboru, který trvale operuje napříč strukturovaným rozložením DOM a kombinuje dekádu trvající RL evoluci s asanací prostředí, představuje zcela neprozkoumanou doménu designu softwarových rozhraní. Filozofičtí sourozenci jako Dosidicus operují v jiných programovacích prostředích (Python) a s odlišnou kognitivní teorií (Hebbovské učení vs. Q-Learning).1  
2. **Validace stavebních bloků:** Ačkoliv celý systém jako celek neexistuje, všechny jeho podkladové technologické vrstvy byly v izolaci akademicky i komerčně ověřeny a fungují spolehlivě. Algoritmus FABRIK pro inverzní kinematiku v 2D JavaScriptových implementacích vykazuje vysoký výkon a stabilitu potřebnou pro plynulou animaci složitých struktur.24 Prostorové hashování (Spatial Hashing) efektivně řeší problémy kolizních detekcí v prostředí s vysokým počtem DOM uzlů. Zásadní je také to, že koncept bez-závislostního zpětnovazebného učení (RL) uvnitř webového prohlížeče byl excelentně prokázán v projektech, jako je Karpathyho reinforcejs.17 Z toho vyplývá, že syntéza těchto ověřených přístupů do jednoho celku nečelí žádné zjevné teoretické ani technologické bariéře.  
3. **Paradigmatický posun v digitálním designu:** Projekt překračuje hranice pouhého inženýrství a zasahuje do oblasti Calm Technology a digitální chronobiologie. Zavedení desetiletého biologického stárnutí, kde se snížená pohyblivost organismu (fáze Elder) neklasifikuje jako technická chyba, ale jako funkční charakteristika přinášející ambientní klid, ukazuje vyspělé pochopení uživatelské psychologie. Odmítnutí potřeby neustálé pozornosti – organismus nezemře, ani když není stimulován – ostře kontrastuje s návykovými mechanismy spotřebních technologií.

Realizace tohoto konceptu na základě specifikovaného Product Requirements Documentu nevyžaduje objevování nových matematických algoritmů, ale bezchybné softwarové inženýrství při propojování roztříštěných konceptů. Striktní dodržení výkonnostních limitů (CPU pod 2 %, paměť pod 5 MB, nulový vliv na překreslování layoutu) je při inteligentním využití optimalizací (throttling, izolace transformačních vlastností CSS, delegované hit-testingy) plně proveditelné. Projekt Lili má tak předpoklady nejen posunout chápání toho, co je možné implementovat pomocí čistého JavaScriptu nad DOMem, ale především nabídnout novou poetickou dimenzi v dlouhodobé interakci člověka s uměle inteligentními strukturami. Tím se vymezuje jako vysoce inovativní akademický a vývojářský experiment na poli digitální ontogeneze.

#### **Citovaná díla**

1. ViciousSquid/Dosidicus: A transparent cognitive sandbox ... \- GitHub, použito března 7, 2026, [https://github.com/ViciousSquid/Dosidicus](https://github.com/ViciousSquid/Dosidicus)  
2. Dosidicus: A digital pet squid with a neural network : r/gamedev \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/gamedev/comments/1rlla49/dosidicus\_a\_digital\_pet\_squid\_with\_a\_neural/](https://www.reddit.com/r/gamedev/comments/1rlla49/dosidicus_a_digital_pet_squid_with_a_neural/)  
3. neuro-evolution · GitHub Topics, použito března 7, 2026, [https://github.com/topics/neuro-evolution](https://github.com/topics/neuro-evolution)  
4. digital-pet · GitHub Topics, použito března 7, 2026, [https://github.com/topics/digital-pet?l=python](https://github.com/topics/digital-pet?l=python)  
5. Claude Sonnet 4.6 with extended thinking: Give me your hardest prompts/riddles/etc and I'll run them. : r/singularity \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/singularity/comments/1r7il6y/claude\_sonnet\_46\_with\_extended\_thinking\_give\_me/](https://www.reddit.com/r/singularity/comments/1r7il6y/claude_sonnet_46_with_extended_thinking_give_me/)  
6. What are you building today? : r/SideProject \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/SideProject/comments/1riot4p/what\_are\_you\_building\_today/](https://www.reddit.com/r/SideProject/comments/1riot4p/what_are_you_building_today/)  
7. Jake Lee (u/JakeSteam) \- Reddit, použito března 7, 2026, [https://www.reddit.com/user/JakeSteam/submitted/](https://www.reddit.com/user/JakeSteam/submitted/)  
8. Black Mirror Has An Addictive Companion Video Game You Likely Never Knew Existed, použito března 7, 2026, [https://www.slashfilm.com/1866256/black-mirror-video-game-thronglets/](https://www.slashfilm.com/1866256/black-mirror-video-game-thronglets/)  
9. You Can Actually Play the Terrifying Video Game From Black Mirror Season 7 \- Gizmodo, použito března 7, 2026, [https://gizmodo.com/black-mirror-thronglets-game-netflix-2000587677](https://gizmodo.com/black-mirror-thronglets-game-netflix-2000587677)  
10. I Played the Black Mirror Easter Egg 'Thronglets.' It gets Dark — Just Like My Coffee. \- Elisa Mascarpone, použito března 7, 2026, [https://elisamascarpone.medium.com/i-played-the-black-mirror-easter-egg-thronglets-it-gets-dark-just-like-my-coffee-908f97ca68cf](https://elisamascarpone.medium.com/i-played-the-black-mirror-easter-egg-thronglets-it-gets-dark-just-like-my-coffee-908f97ca68cf)  
11. Thronglets from Black Mirror: Plaything is a real game, and it's better than you'd think, použito března 7, 2026, [https://www.radiotimes.com/technology/gaming/thronglets-black-mirror-plaything-comment/](https://www.radiotimes.com/technology/gaming/thronglets-black-mirror-plaything-comment/)  
12. Kacper Wojciechowski jog1t \- GitHub, použito března 7, 2026, [https://github.com/jog1t](https://github.com/jog1t)  
13. Vivarium \- an open source evolutionary simulation : r/Simulated \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/Simulated/comments/1rh0ogo/vivarium\_an\_open\_source\_evolutionary\_simulation/](https://www.reddit.com/r/Simulated/comments/1rh0ogo/vivarium_an_open_source_evolutionary_simulation/)  
14. Were the Throng Malicious? An in depth analysis. : r/blackmirror \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/blackmirror/comments/1jxi93e/were\_the\_throng\_malicious\_an\_in\_depth\_analysis/](https://www.reddit.com/r/blackmirror/comments/1jxi93e/were_the_throng_malicious_an_in_depth_analysis/)  
15. Proceedings Scientific Training in Multi-Agent Systems Workshop STMAS 2021 Danny Weyns, Federico Quin, Omid Gheibi \- KU Leuven, použito března 7, 2026, [https://people.cs.kuleuven.be/danny.weyns/papers/Proceedings-STMAS-2021.pdf](https://people.cs.kuleuven.be/danny.weyns/papers/Proceedings-STMAS-2021.pdf)  
16. 11.1: App. C: Reinforcement Learning | AI Safety, Ethics, and Society Textbook, použito března 7, 2026, [https://www.aisafetybook.com/textbook/appendix-reinforcement-learning](https://www.aisafetybook.com/textbook/appendix-reinforcement-learning)  
17. Andrej Karpathy Academic Website \- Stanford Computer Science, použito března 7, 2026, [https://cs.stanford.edu/people/karpathy/](https://cs.stanford.edu/people/karpathy/)  
18. utensil/awesome-stars: A curated list of my GitHub stars\!, použito března 7, 2026, [https://github.com/utensil/awesome-stars](https://github.com/utensil/awesome-stars)  
19. A Beginner's Guide to Deep Reinforcement Learning | Pathmind, použito března 7, 2026, [https://wiki.pathmind.com/deep-reinforcement-learning](https://wiki.pathmind.com/deep-reinforcement-learning)  
20. STUDY GUIDES, použito března 7, 2026, [https://www.dipae.ac.cy/archeia/pistopoiimena\_programmata/mathimata/07.14.327.039\_mathimata1\_old.pdf](https://www.dipae.ac.cy/archeia/pistopoiimena_programmata/mathimata/07.14.327.039_mathimata1_old.pdf)  
21. Automata-Theoretic Techniques for Reasoning and Learning in Linear-Time Temporal Logics on Finite Traces \- I.R.I.S., použito března 7, 2026, [https://iris.uniroma1.it/retrieve/8c54ec8c-dc8c-406c-9bac-4d8ba254e74a/Tesi\_dottorato\_Favorito.pdf](https://iris.uniroma1.it/retrieve/8c54ec8c-dc8c-406c-9bac-4d8ba254e74a/Tesi_dottorato_Favorito.pdf)  
22. Blog \- WebExpo Conference, použito března 7, 2026, [https://webexpo.net/blog/](https://webexpo.net/blog/)  
23. CDC 2025 Program | Thursday December 11, 2025 \- PaperPlaza, použito března 7, 2026, [https://css.paperplaza.net/conferences/conferences/CDC25/program/CDC25\_ContentListWeb\_2.html](https://css.paperplaza.net/conferences/conferences/CDC25/program/CDC25_ContentListWeb_2.html)  
24. Physical Embodiment in VR: Interchangeable Web-Based Modules using Ubi-Interact, použito března 7, 2026, [https://collab.dvb.bayern/download/attachments/77832874/Bachelorarbeit.pdf?version=1\&modificationDate=1655453047707\&api=v2](https://collab.dvb.bayern/download/attachments/77832874/Bachelorarbeit.pdf?version=1&modificationDate=1655453047707&api=v2)  
25. Principles of inverse kinematics for a basic 2D humanoid stickman \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/11807538/principles-of-inverse-kinematics-for-a-basic-2d-humanoid-stickman](https://stackoverflow.com/questions/11807538/principles-of-inverse-kinematics-for-a-basic-2d-humanoid-stickman)  
26. Neural Network-Based Shape Analysis and Control of Continuum Objects \- MDPI, použito března 7, 2026, [https://www.mdpi.com/2313-7673/9/12/772](https://www.mdpi.com/2313-7673/9/12/772)  
27. Virtual Marionette \- Interaction Model for Digital Puppetry \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/profile/Luis-Leite-3/publication/350236635\_Virtual\_Marionette\_-\_Interaction\_Model\_for\_Digital\_Puppetry/links/605727a192851cd8ce574112/Virtual-Marionette-Interaction-Model-for-Digital-Puppetry.pdf](https://www.researchgate.net/profile/Luis-Leite-3/publication/350236635_Virtual_Marionette_-_Interaction_Model_for_Digital_Puppetry/links/605727a192851cd8ce574112/Virtual-Marionette-Interaction-Model-for-Digital-Puppetry.pdf)  
28. SkeletonModification2DFABRIK — Godot Engine (stable) documentation in English, použito března 7, 2026, [https://docs.godotengine.org/en/stable/classes/class\_skeletonmodification2dfabrik.html](https://docs.godotengine.org/en/stable/classes/class_skeletonmodification2dfabrik.html)  
29. WebFactory: Automated Compression of Foundational Language Intelligence into Grounded Web Agents \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2603.05044v1](https://arxiv.org/html/2603.05044v1)  
30. Reinforcement Learning on Web Interfaces Using Workflow-Guided Exploration, použito března 7, 2026, [https://www.researchgate.net/publication/323410979\_Reinforcement\_Learning\_on\_Web\_Interfaces\_Using\_Workflow-Guided\_Exploration](https://www.researchgate.net/publication/323410979_Reinforcement_Learning_on_Web_Interfaces_Using_Workflow-Guided_Exploration)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAYCAYAAABHuaHbAAAGhElEQVR4Xu3cV6gkRRTG8WPEhIoZDDvmiJgwPKhreFAEs6gorhlERQygGHDVFxEjggEDdw3Iog8qRhRWwYQBxRxQVwVzzlnro6vsM+d2z/Tdnbu74P8HxVSd6qmdnr7QZ6uqxwwAAAAAAAAAAAAA/hcuS+VM174rlWmu7W0SA3NpkVSei0Hnn9BeIZXPU1k8xNucmF//7osuuB5I5ctc13fzSiqv1t3/WSiVx2JwBK6LgTn0WSpbxGCD5VM5NZWnYkcDjRf/HibilFTuDrFbrPuYn+bXKalc7jsAAJhst1vzDUuxq0Ps99AeleVSmRmD2Xup7BRiM6x7whYTzHtCe0HyTiq/xKBVCduBIdZ03CjsnMoJMTgH1knl+xgcoEvCJk1/qxMR3792Q6xNPG7hVLYJMQAARk6zVboJHRw7kmut/wZ1QyoXuvaofZfKyjGYrJLKryE2Zt0StqnWn7A9ncp9rr2g0fe9ZgxalRj4a/F6Kru69qjFxKTJm6kcEINBl3GKeZWwvRTaPes25mI2/jjN2pKwAQAmnZKXeBMqlrWq7+bcjscdm8rRuf6h72ixmtVjKEHUkpm3gY3/NwolB96Y9Sdsl+bXPVJ51MW11LaVa2v8O11bn2F316eb8qK5rqVIHau6lr/0qiT2XasTyB/zq6hf35kowfKzkWXsQmNEWuJsO39R3xGu7t2Wyrq53nXp148Rr8XxNnycLgnbGlZ/J/K4q8fxS8K2Vyo/WDUTeloq11j/Z1X9CatmXaencn/oK+I5eRe5es/636cl6aVyXfGVcn3L3PbU3jTEAAAYOd00403IU59usgfluveaVbNusr7vaLG11XuzlFzE8aQpJpoJXNW1x6xO2PZ0cfFjNCVsfun1p1SWdn3Tcl176mJCof7Zrn1SKsu4tpIw/x7/Of60KqmSzaxOAjzNmLWdv6jvAlf31D4810sSPUy5FhLH67JM2CVhk5dd/QNX/8jVxc+w3WhVgl/os5Q9Y/Fz+fagc/J8Xy+0H3J1xX/O9baEbeMQAwBg5DQbFW9ChfaVqU/LoNNz3dsox84K8WG0yXzQvrk22stWjFmdsM22arbFl6IpYbvDtYuTrerT8TLLqv1knvpLgipK9rztrf/zq35MritRKX1a+m2iBwwGnb/6yjLoX77DqkRT/W+H+DC6Fk/a+H+3aflPXrAq3lSm1of1ieNoBvPBVL4JcZ+w6Xte0bU1k/lWrsfxYrvtnLxvrdpjJz3rP1azqE1/T20J24YhBgDAyGnpRzedw2JHcpPVNyjNpMSbVfGMVX29EI98QqObZdN4TbFCN+3Vc33M6oTti/zqLZlfmxI2JYuFNsWv5/omkrB9bP3Lsqr7z1+WlMsxSlA0S6SEok3b9xiTubbv6VCr+nT8MIPGG7Q8XXSdYdvNqj13Ul4lLqMPS9iuyvX4udrOIx4Xlf6eq4uSuSZtCVuX2WUAAObawzb+RiSKXRzanpZEi09SOc+1S2LlaV+SZmhEy6NxPL/HrYneU27yY1YnQkem8mKuy76pLJHr2gOl9xV6slLnK3EWSfXTc32WDU/YdrH+J073t+rnRjy9549c116nQecn2ncVH7CQN1LZ27XjOM+6uvp2dO2mBFHnXq6FxPEOaYhFXRM2KWP5MWNiNChhi9fJK+1h5xRp+VSzYz0bP77/OZJyTZX4xzHV3iHEAACYNGNWLXuKNszfm8pxpTP7zfpvolp+09428TeyK0K7uNWquPaHbZvrfj+Z3qcySBlX+8X8jVJxFf1OljbMF9p/d65rl6XYs3O7vE83eiWD2mumz6mbeTwHteOskGJTcl371/TdeVoSPce145hNNGNZkhklnkqMNJvnxXHULnupfJ8SWf8ZPcV1LfRdqu6vhd63j2s3mUjCpv17Z1j177yfytdWfc+PWHWO2tPol0iVsGnpWDOFmsHaz/VpjPJQQGn7ets5RRpX11l7/vwYcdlXD4OI9g/640TXXGP4/9gAADDpykMIbYlT3Ig/Krop+uUy1AmDZu6adL0WSrKbZjzb6PgZMTiPxRk2AAAQPG9VorBd7MjWioFAydf5MTiEf6AANS3H6Vr4nyIptCQ87Dfl9OBIW8LXxv8syvxCwgYAQEd6EOESG/9U5ah/d0q/54bB9NMlV6ZyfewYsc1jYD75KpWjYhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMJ/9C9rIp4D7t4ahAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAZCAYAAAAFbs/PAAAAiklEQVR4XmNgGAXDAswG4v9AfABK16HIooFfQHwBTQykyRHK/o0scYMBIokOQGIgg0BgN7rEc2QBKPjHAJEzB+JomKADVNAdJoAEHjFA5FBsX40ugASuMUDkJJEFG6CC2MBFBhxyIEFVNLF7QLwWKgcCfUhyDEJA/JcB4d4ZSHL3oWLxSGKjgLoAACgOJkiAxK1GAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAXCAYAAAD+4+QTAAABAUlEQVR4XmNgGAWDGXAD8S4g/g/Ep4GYEVWaKHAGXQAZSDNADOeE8oWhfCa4CtzgJANELQzjBF+BeCWaGMhVP9DE8IEiBgKWgCTD0MSqoOLEAryW2DFAJG3QxOOh4kJo4rgAXksKGCCSRmjioVBxczRxXACvJU0MEEk9NPFAqHg0mjgugNeSNAaIpAGaeAhU3BlNHBfAawksTizRxGOh4qDkTQzAawk7A0SSpqkLBECSk9DEtkHFkQEoMYijicEAQUuwuRrED0Lig4oZkBi6OhjoYoDIiaJLIIPlQPwXSoMUg5I2OtgAxCVoYr+A+AUQPwHix1D6NRAvRlY0CkYBbQAAvFZD8ftbiu8AAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAYCAYAAAAs7gcTAAAAf0lEQVR4XmNgGAX0BtJAvAyIc9ElgMAWmXMMiP8j4TfIkkBwA8bIA+K3QMwK5UsyQDTIQvkLgZgNygZLoAMHID4AZYMMIghAhmQBsQi6BDYAcz9R4D0Q16AL4gJP0AXwAaKdwATEr9AFcYE6IO5GF8QF3gExH7ogLvAbXWAQAQAYqBfQoq3vPwAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAXCAYAAABu8J3cAAABvElEQVR4Xu2VvyuGURTHDynEIAaJSTEKi+TXwGAlPwbxbhYpg8lG/gDZlEFJEoWEEiVGBgM2g012P1LifN1zn+c8p+t93975+dS35z3fe+59z73vc+5LlJKSPxWsM9YP64ZVlBzOygDri9zcUzMG2ljnrHZWMauRtcI60Emgntwi5RLXSIxJuRhkrau4idxcDQqFp/WayBDeWDvGu2V9Gi+E/VKwx1pTcR/rmFzBS6xKNZYAi40Zb0H8XCCnynj7rA0Vd7MWVRykl9xiSNZkxK82vsUf9YzxNF2URyFz5CbiRdKMit9hfEsPxcV8yNMefSdrS8a2We+sq0QGud8MCS3GHxJ/wvghZikuBlpODv9t8tl4yLvWxrSYrdpkRsTvN77liHUhn9GSvpipKCPMC7m8CP+O4Pg0k+Kjtf+jmcxi5K4AX0w2Lsnl1HqjVIxCuuaBtWlNiovxhArD9QCvTJswVrXBnIivwQsc7YA5ZN2rWGML2VUx8DdxgtDuEQ+rGFe+3VmJxA3KA0+scRXfkWthTx25eRnlRaCtvuWJJLS1Bf8N88bzfw8Qrm080XGWR3Jj/iRw7aekpBTML9padyomHr0qAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAXCAYAAAB50g0VAAABQUlEQVR4Xu2UPS9EQRiFj4SSxGp0Wyp0QpaESu8X6P0GlUah0dpCpSUSf0AtUUiITiMShYKgEd/ekxkxOTOXyd6r2cyTnGTnmXd2vu69QKHQH2xYXi1vlh3p+4tNy4vl1jIvfY3wYJnyv8csnz45cOx60H6C22xjdCw3luHAzcAt8CRwKRYRb6SVcLXgbvmH5+JzTpHXmqqhW1ZZhz3LiLicBbKfz61Cf6aySebgJuHCf4M1jyrhPJ/Ff4MTfKhMwLo7lag4fb5905mZ8GNS7FveVVbARdyrRMUG25alzCz4McoK0hNWwYU8q4TzFyrrMmu5FBddk5C8SjjXVVmHccupSsSTr0l7C3HNgHdD4ntmED8noTkK6g682w0coZsM2sdIv9k9s414Yd9ZDepGLdeIv5dtuNpDyxVcTaFQ6Cu+APpWXimQoTl5AAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAXCAYAAAB50g0VAAABHUlEQVR4Xu2UPYoCQRCFn4FgoIKCsQcwNRQ2MDc18RSCsYnBIpgY7KaC2UZ7AQ+gGJma+QOCKK6JqKBW0QZNWeqMOApLf/AY+utieNDTAzgc/4u+FB5oUHaUBSUn9p5Cl3K04oc/Ss1abyif1vomYUpFyhuU4a9gHpfzScVdJYJgC/KxavPsSlJqRBFsQZ7dSwnjB1JqxBB8wbWUMJ6/xbu8ouBSSly5bFklH5Sm4jkajxRcSQnjD1IWlBQpLcVzNB4puJUSxg+l1HjFEWvz7L6l1Hh2wapYf+FyPnR2/A++i9+CdZiXp+QG8Quz9yM8u4y17kG/2SpeC/IPd0aZUMbn55zStmYSlCklbjkmDVOyQxnBzHjGa0GHw/FOTtn+VF81UNDqAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAXCAYAAAB50g0VAAABQ0lEQVR4Xu2VvytGYRTHvwuyKKRMlEVWGSySP4As/gdlY5QYlR+j0SIDk1JGm8GoKCmZiJIUixTO6Ty3jm/nfe/tvnd6u5/6Ds/nPOfe0/0J1NS0BzOSW8mv5JBqeVzC+p4k01SrhGXJj1svwk6YR6fk2623YX0XzlWCHnQscJvkmE/JLrkXWG8/+dLMI75aX4i9R+uaAeeWkjtyriXOEQ/ygNh7xiVb5DZgfTvkS/OOeJAbxD6PN1hfFxfKkt0m5gqxb8YQrGePC4o+lBMFM5p6FP00RINcI/bN0P37LDOGJXMFM5V6lEbP4D1i34gPyQrLKlhFPEiRtzjjTjJL7oDWLaGD9AXulNw6rRXdM0luIaUynmGflYxB2IAdzp0kd+zcWnJRut2+SniF/QXOYCcY+V9Gr+RR0uMcD+VTU1PTNvwBv81cfhWx9KQAAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAWCAYAAAAM2IbtAAAAYklEQVR4XmNgGLmADYg9gNgdWVAViP8D8XEgLgHiWJhEBFRCHCaADEASN4GYBQmDgSlUEmTcDiQMBsVQSSaYADIwYIBIsqNLwMAfID6KxAeZIoPEB9sDMgGEDwIxI7LkoAAAUvwSyCHUYewAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAAWCAYAAACcy/8iAAAAoElEQVR4XmNgGAWjYBSMglEwCkbBYAJsQOwBxO7oEsMNqALxfyA+DsQlQByLKj28QAQDxLPi6BJ4wGI8eCEQLwDieUA8F4hnA7EKWNcgASDP3gRiFiQ8bIEpAyIp70DCwxYUM0A8zIQuQQB0kYi1IdoGHhgwQDzMji4xnMEfID6KxAfFtgwSf1gCUL4FxTQIHwRiRlTpUTAKRsEoGAV0BwC61CEbVBF3vQAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAYCAYAAAC4CK7hAAACXElEQVR4Xu2WzUsVURjG31JDEzVBamVBf0Arw9RFaBCuLSoiuhYEuXEjiLpw5wdtKgipRYtsoSD1F7TIRSBI0MemD3AREVEuDAyV0nwfzxk995kzc+cOd7DF/cHDnfm958ydOTPnzIiUyYRFzT/NKy7sB+dZJGTZ2Z7W/HH2wRXaL4oTmoeaB5p6qvm4rRlimRDciUm7fcDuu5zUvCVXkHtiDnTd7h/X/NCs77YI06z5xjIlpyV8IeC+5hFLHwfFHGCeC5a/mi2WFvSrZpkSPFZXWVp8FxgCjZZYOnSJaXOOfLtmg1xaHkv8fHgqBR6xr1L4aoM7NkceI5h2brjc1Jyx2x1uwaFBYs7zrJjiS/JMo5h2K+ThasgFzGh6nP1LmlnZO+GAFjGTvVdzS/Mxr5oP/s+7+GBEkzzj18S0e+O4Out8bNpf1C+IGYAjYi4azn2EsM+JArVhlqBQx4BPYtphmQ3otI7ByWKVAahjoXCBe0EuKej7hOVRW/CdDONrd8PjwClNheaYmPrh/PKOGyCXlDXNAkv8GQ6KYhwXxbTjpTlnfRRTEq63WYcXXxp+a16zBL6RZqLaYNL6fABq/Lnx3fq0oO9zluCXxB/4i5h6FRdkbyWLArUJjxt3tosFfUZYBqD4jqXyU8IjyqDvIZZKk5gaL81weCfhbvZRLQnojwGMBF+gaISJhDmD7da8Fn7QzjdxL4t/xN+L8Xe5kIBa8R+zJAxqVllmBL7Gn7EsJRilSpYZkNndCOjWfGZZYkY1Yyyz4I6Y76QswIv1A8ssybEoEf0syvzPbAMOhpRP83ejOwAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAYCAYAAACIhL/AAAABv0lEQVR4Xu2VTStFURSGX98MiAFlgIHfIDKRj/ADFAO5GShzJfkJSkkG/oOfYMJEMhITXWWADDCgFPK5Vnsf93jv3nfvm0sG96m3zn3W2vuuTufsA5T5f4yyCNAuqWQZS5dkU7IhaaKai3nJEssIPliEWINZNGN/d0quJU9fHfl0SK5YpmiGf5BayTtLF3qrdZNdLlhe4d9I19WTa5Wc21oSH3uSVZaMbnDGMsUQTM8w+X7JMzkmNGAVCtdxiUADcnd4i/wLws9eaEBF6yMslQGY4g55pgWm7468ugZyTMyAJ5IDloreAV3MzxAzDdN3mHKN1oWIGXAZnp6YxUoWpk+Pk4RB60LE/McUHD1tVuYVHLj6Zh3OhWst0wtHT/L2PHKBmIDp4yMoY32ImAF74OmJWezr6YPbM771aSbh6bmHp2BJDtsaLiD3ZoeIGVCPKm+PFo5YCjcwb3khdK1+rgoRM+Axvp8QedzCbLIP80zqtT64IbRvgaVFz0z9Rl/Y6DWfowm6zxjLUrAoeWBZJBUI3+EfoZtXsyyCbck6y1IyLjllGYl+499Y/gYrkjmWEfzJcAkZFgG6JXUsy5SKT7BCf4Wmd65tAAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAAA6ElEQVR4XmNgGAUDBeSB+D+6IB7gCMQ3GCB6lqLJoQCQAmINLgLif0j8DAYcencB8VcGHJJYAEidJhYxFCADxBuA+A0DFkksIIABu7qf6AIwRcQavI8Bu7r7yJy1QCwLZRNr8AcG7OquwhjCDBDbYYBYg3FF8kUYA12SWIOfMWBXdwVEzARiDTQJYg3GFcZ3QcR2ID6MhmFeBLHnwFRjAdUM2A3GSBUwgCvsQoFYHE0MpE4IixhWgM1gRhziLxhQk5cEA6YahnMMEIWPoRjEPo0kD8o8JUh8GADFyUsg3sYAMVQJVXpEAwBr4EzfAN9yKQAAAABJRU5ErkJggg==>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAABEElEQVR4Xu2TPwtBYRTGjwxWWSibzUKZLbKZlHwHs0x8BQtlsrKYDDKarYqyyCJRlNXgzzn3ve/t3NO5N5OFXz31nud5z7nH7QL4803yqCvqhVqi4v44lBJqC6Z3zIMGqs/qEZhLBeYF0UQ9WU2zqNeBDl4R4mnQnaziORx44fLJ4Crod+7SsLTBNFRkIFiAPngvDcJu0ZOBwg30wRtpdFET1ANVFplG0OtaScOSBtMwk4HgCPrgtTQ4Qdtwgt7xzh7opw9ZQNjBReFzOqAPdr6KGujbWS/KvDoqyWqC7iQUzzvEWJBzvTnzIq4nFziB//NKAbtDT6S/JeniBgMbMqaoljTB9JzBLEK9GX/807wB4OJNQXbEWy0AAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAABBUlEQVR4Xu2UvQ4BURCFh0ZCRSIkOp0nUNB4A413UItO6REkXkD0KqVaS0g0ohMShYqQ+JnZe+8aY3azlYYvOcmdM2cm2V+AP9+kijqgHqgpKv7eDqWGWoGZHfJGD9Vn9QlMqMi8IFqoO6ubYGY96FB+9XzPD4RAmZLiQcoe5BLNk9RBz1zcoYuqsAYRZfEE9MxGGhwa4PdO4wj64qU0HHMwA0nZEARd1UwaBD1ECmdlQ2EL+uKFNNJgggnZCCDoHq95QR+EDA1ELenA5wzhvxWE9qBuom6gcsKjxRnF87jaQpMjpnjEDt5frzzYTMEeNJ1d2jJCtYVH0D9mjxqDmYvyK/gVno7GTiOW7XA3AAAAAElFTkSuQmCC>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAAA2klEQVR4Xu2UzwoBYRTFr7JlQ/EcSngQzyBElIew8AZWVhZSXkV5AMVGNmz9P9d8k9uZMjOZsuBXv2Y6d74zNTPfiPz5BgPY5DCEITzDC5zYwRSe4N3ZssMQjrDkznPy6ggQp7gCdzBjsrIkUKyPQK9fUf5xsTKDWcoSKWZq8qa4zWEMdP2NQ0UHHQ4jModXDn20uMthBBrwwKFFi3schlCFaw4ZLe5z6KjDAmVFuKQsQF684hEPQEq8mX3jaZOxT/Rb3MMt3Lij7ijd5paFeP8Sn7EEC/nmv84D4IY/kOt80rIAAAAASUVORK5CYII=>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAABG0lEQVR4XmNgGAX0BNxAvAuI/wPxaSBmRJUmGkwC4sswjjQDxEBOKF8YymeCKSAScDFA9MEN/grEK+HSEHAGiH+giREC/xjQDAZxwuDSEFAFFScW9ACxKQOSwXZQjg2SIhCIh4oLoYljA+xAfAPKhhtcAOUYQSVgIBQqbo4mjg38RmLDDW6CcvSQJEEgECoejSaODmqA2AGJDzc4DcoxQJIEgRCouDOaODIApZqHaGIYYWyJIs3AEAsVByVFXACUmtAB3GBQwIM45KSKw1gwSA/cQhAHlGOQwTaoODIARag4mhg6gLsYBLC5DsQPQuKDsjhIDF0dOgDJP0EWWA7Ef6E0SBKUDNHBBiAuQReEApD3nwHxYwY0g0c4AACrxk3ztEDKggAAAABJRU5ErkJggg==>