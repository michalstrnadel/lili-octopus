# **Procedurální animace flexibilních struktur: Komplexní implementace algoritmu FABRIK pro modely chapadel v prostředí 2D Canvas**

Inverzní kinematika (IK) představuje základní pilíř moderní procedurální animace, který umožňuje dynamicky a realisticky reagovat na proměnlivé prostředí bez nutnosti ručního klíčování každého jednotlivého snímku. Pro animaci vysoce flexibilních biologických struktur, jako jsou chapadla chobotnice, je tradiční dopředná kinematika (Forward Kinematics – FK) zcela neefektivní, neboť vyžaduje výpočet a manuální řízení rotací pro každý článek v hierarchii. V tomto specifickém kontextu se jako výpočetně i vizuálně optimální řešení jeví heuristický algoritmus FABRIK (Forward And Backward Reaching Inverse Kinematics). Tento algoritmus namísto složitých maticových operací, typických pro analytické metody, využívá elementární geometrické hledání bodu na přímce.1 Tento report přináší vyčerpávající technickou a matematickou analýzu implementace algoritmu FABRIK primárně pro 2D Canvas v jazyce JavaScript. Součástí analýzy je procedurální generování lokomoce inspirované mořskou biologií, vykreslování hladkých Bézierových křivek s proměnlivou tloušťkou, integrace fyzikálního tlumení pro dosažení organického vzhledu a hloubková optimalizace pro stabilní běh při frekvenci 60 snímků za sekundu (fps).

## **1\. Algoritmus FABRIK ve 2D: Matematická formulace, pseudokód a topologie**

Algoritmus FABRIK se zásadně odlišuje od tradičních metod inverzní kinematiky založených na Jacobiánu (například Damped Least Squares nebo Jacobian Transpose), stejně jako od jiných heuristických přístupů, jako je CCD (Cyclic Coordinate Descent).2 Zatímco CCD řeší pozici článků iterativními rotacemi od koncového efektoru ke kořeni, což často vede k nepřirozenému kroucení, oscilacím a vizuálním diskontinuitám, FABRIK pracuje čistě v polohovém prostoru. Metody využívající Jacobián navíc trpí problémy se singularitami a vysokou výpočetní náročností spojenou s inverzí matic. Oproti nim vykazuje FABRIK nízké výpočetní náklady na každý kloub a iteraci, přičemž produkuje vysoce realistické a plynulé pózy.3

### **Fáze Forward a Backward Reaching z matematického hlediska**

Jádro algoritmu spočívá ve dvou směrových průchodech podél kinematického řetězce, který je definován uspořádanou množinou uzlů (kloubů) ![][image1] a konstantními vzdálenostmi mezi nimi ![][image2].3 Každý bod je ve 2D prostoru reprezentován vektorem ![][image3].

Prvním krokem je kontrola dosažitelnosti (Reachability Check). Než algoritmus zahájí jakékoliv přesuny, vypočítá se euklidovská vzdálenost mezi kořenovým uzlem ![][image4] a cílovým bodem (target) ![][image5]. Pokud je tato vzdálenost striktně větší než součet délek všech segmentů (![][image6]), systém vyhodnotí cíl jako nedosažitelný. V takovém případě se celý řetězec jednoduše narovná do přímky směřující k cíli. Každý uzel ![][image7] je posunut na vektorové spojnici mezi předchozím uzlem a cílem, přičemž je přesně zachována vzdálenost ![][image8].3

Pokud je cíl dosažitelný (vzdálenost je menší nebo rovna ![][image9]), algoritmus iniciuje iterativní proces skládající se z dopředné a zpětné fáze. Dopředná fáze (Forward Reaching) začíná u koncového efektoru ![][image10], který je okamžitě přesunut přesně na pozici cíle ![][image5]. Následně algoritmus postupuje zpětně podél řetězce směrem ke kořeni. Pro každý uzel ![][image7] (kde ![][image11] klesá od ![][image12] k ![][image13]) se vypočítá nová pozice tak, aby ležela na přímce spojující novou pozici ![][image14] a původní pozici ![][image7]. Vzdálenost mezi těmito uzly je upravena na požadovanou délku segmentu ![][image8].3

Protože dopředná fáze obvykle přesune kořenový uzel ![][image4] z jeho původní, fixní pozice, následuje zpětná fáze (Backward Reaching). Tato fáze začíná navrácením uzlu ![][image4] na jeho počáteční ukotvenou souřadnici (base). Algoritmus pak postupuje vpřed směrem ke koncovému efektoru. Pro každý uzel ![][image14] hledá novou polohu na přímce spojující nově ukotvený uzel ![][image7] a pozici ![][image14] z dopředné fáze, opět při striktním zachování vzdálenosti ![][image8].3 Tento cyklus se opakuje, dokud vzdálenost koncového efektoru od cíle není menší než stanovená tolerance.

### **Specifický pseudokód a implementace v JavaScriptu**

Pro dosažení absolutního výkonu při frekvenci 60 fps ve webovém prohlížeči je kritické vyvarovat se instancování nových objektů v rámci výpočetní smyčky. Následující produkční kód využívá existující vektorové struktury, čímž eliminuje aktivitu Garbage Collectoru, a implementuje logiku FABRIK optimalizovanou pro 2D pole uzlů reprezentujících chapadlo o 8 segmentech.7

JavaScript

class FabrikChain2D {  
    constructor(numJoints, segmentLength, baseX, baseY) {  
        this.numJoints \= numJoints;  
        this.segmentLength \= segmentLength;  
        this.totalLength \= (numJoints \- 1\) \* segmentLength;  
          
        // Alokace do optimalizovaných TypedArrays pro maximální výkon  
        this.x \= new Float32Array(numJoints);  
        this.y \= new Float32Array(numJoints);  
          
        // Inicializace napřímeného chapadla  
        for (let i \= 0; i \< numJoints; i++) {  
            this.x\[i\] \= baseX;  
            this.y\[i\] \= baseY \+ (i \* segmentLength);  
        }  
          
        this.baseX \= baseX;  
        this.baseY \= baseY;  
        this.tolerance \= 0.01;  
    }

    solve(targetX, targetY) {  
        // Výpočet vzdálenosti od kořene k cíli  
        const dx \= targetX \- this.x;  
        const dy \= targetY \- this.y;  
        const distanceToTarget \= Math.sqrt(dx \* dx \+ dy \* dy);

        if (distanceToTarget \> this.totalLength) {  
            // Cíl je nedosažitelný: Natáhnutí do přímky  
            for (let i \= 0; i \< this.numJoints \- 1; i++) {  
                const rdx \= targetX \- this.x\[i\];  
                const rdy \= targetY \- this.y\[i\];  
                const r \= Math.sqrt(rdx \* rdx \+ rdy \* rdy);  
                const lambda \= this.segmentLength / r;  
                  
                this.x\[i+1\] \= (1 \- lambda) \* this.x\[i\] \+ lambda \* targetX;  
                this.y\[i+1\] \= (1 \- lambda) \* this.y\[i\] \+ lambda \* targetY;  
            }  
        } else {  
            // Cíl je dosažitelný: Iterativní konvergence  
            let n \= this.numJoints \- 1;  
            let diff \= Infinity;  
            let iterations \= 0;  
            const maxIterations \= 3; // Omezení pro 60fps běh  
              
            while (diff \> this.tolerance && iterations \< maxIterations) {  
                // Forward Reaching (od špičky ke kořeni)  
                this.x\[n\] \= targetX;  
                this.y\[n\] \= targetY;  
                  
                for (let i \= n \- 1; i \>= 0; i--) {  
                    const rdx \= this.x\[i+1\] \- this.x\[i\];  
                    const rdy \= this.y\[i+1\] \- this.y\[i\];  
                    const r \= Math.sqrt(rdx \* rdx \+ rdy \* rdy);  
                    const lambda \= this.segmentLength / r;  
                      
                    this.x\[i\] \= (1 \- lambda) \* this.x\[i+1\] \+ lambda \* this.x\[i\];  
                    this.y\[i\] \= (1 \- lambda) \* this.y\[i+1\] \+ lambda \* this.y\[i\];  
                }  
                  
                // Backward Reaching (od kořene ke špičce)  
                this.x \= this.baseX;  
                this.y \= this.baseY;  
                  
                for (let i \= 0; i \< n; i++) {  
                    const rdx \= this.x\[i\] \- this.x\[i+1\];  
                    const rdy \= this.y\[i\] \- this.y\[i+1\];  
                    const r \= Math.sqrt(rdx \* rdx \+ rdy \* rdy);  
                    const lambda \= this.segmentLength / r;  
                      
                    this.x\[i+1\] \= (1 \- lambda) \* this.x\[i\] \+ lambda \* this.x\[i+1\];  
                    this.y\[i+1\] \= (1 \- lambda) \* this.y\[i\] \+ lambda \* this.y\[i+1\];  
                }  
                  
                const fdx \= targetX \- this.x\[n\];  
                const fdy \= targetY \- this.y\[n\];  
                diff \= Math.sqrt(fdx \* fdx \+ fdy \* fdy);  
                iterations++;  
            }  
        }  
    }  
      
    updateBase(x, y) {  
        this.baseX \= x;  
        this.baseY \= y;  
    }  
}

### **Konvergence a analýza počtu iterací**

Rychlost konvergence FABRIK algoritmu je kritickým parametrem pro jeho nasazení ve hrách s vysokou snímkovou frekvencí. V komparativních testech proti konvenčním metodám prokazuje FABRIK bezkonkurenční výpočetní rychlost. Metody založené na SVD-DLS (Singular Value Decomposition Damped Least Squares) často vyžadují přes 700 iterací pro dosažení cíle, a metody Jacobian Transpose dokonce přes 1300 iterací. FABRIK ve stejných scénářích dosahuje cíle v řádu nízkých desítek iterací při testování "z nuly".3

V kontextu procedurální lokomoce ve 2D Canvasu se však projevuje takzvaná časová koherence (temporal coherence). Vzhledem k tomu, že simulace probíhá při 60 fps, rozdíl v poloze cíle mezi snímkem ![][image15] a snímkem ![][image16] je minimální. Řetězec zahajuje výpočet v póze, která je již téměř identická s pózou požadovanou pro nový snímek. Díky tomuto faktoru postačuje pro organické struktury, jakými jsou chapadla chobotnice s 8 segmenty, aplikovat striktní limit **1 až 3 iterací na snímek**.1 Zvýšení iterací nad tuto hodnotu nezlepšuje podstatně vizuální realismus, avšak zvyšuje procesorový čas, což je při 8 chapadlech nežádoucí. Pokud systém po 3 iteracích nedosáhne přesné pozice cíle s milimetrovou tolerancí, drobná nepřesnost u měkkého hydrostatu působí spíše jako žádoucí přirozená měkkost tkáně než jako vizuální chyba.

| Parametr konvergence | Jacobian Transpose | Cyclic Coordinate Descent (CCD) | FABRIK (z nulové pozice) | FABRIK (časová koherence ve 60fps) |
| :---- | :---- | :---- | :---- | :---- |
| Průměrný počet iterací pro přesnost 0.01 | \> 1000 | 60 \- 80 | 15 \- 60 | **1 \- 3** |
| Výpočetní složitost na iteraci | Velmi vysoká (inverze) | Střední (goniometrické funkce) | Nízká (skalární násobení vektorů) | Velmi nízká |
| Náchylnost na singularity | Ano (kolaps matice) | Ne | Ne (vyjma přímé linie chráněné if podmínkou) | Ne |
| Vhodnost pro měkké tkáně | Nízká | Střední (způsobuje oscilace) | Vysoká (plynulý pohyb) | Excelentní |

### **Rozdíly v implementaci topologie: Řetězec (Chain) vs. Strom (Tree)**

Pro architektonický návrh modelu chobotnice existují dvě základní topologické struktury. První z nich je stromová topologie (Tree Structure). Ve stromové struktuře více nezávislých koncových efektorů sdílí společné předky (kosti) a setkává se ve sdílených uzlech (tzv. sub-bases). Implementace algoritmu FABRIK pro stromy vyžaduje pokročilou logiku. Při zpětném průchodu (Forward Reaching od efektorů ke kořeni) dojde k situaci, kdy se v sub-bázi setká více navržených pozic od různých větví. Algoritmus musí shromáždit všechny navrhované polohy z napojených větví a vypočítat jejich centroid (průměrnou polohu, těžiště). Tato průměrná pozice se stává dočasným cílem pro nadřazený řetězec pokračující ke skutečnému kořeni organismu.9 Pokud vzdálenosti nebo hmotnosti chapadel nejsou rovnoměrné, může být nutné počítat vážený průměr.

Druhou, výpočetně mnohem elegantnější variantou pro modelování chobotnice je vícenásobná řetězcová topologie (Multiple Independent Chains). Z biologického i strukturálního hlediska chobotnice nemá pevnou kostru se složitým větvením kloubů, její tělo slouží jako flexibilní plášť, po jehož obvodu vyrůstá koruna chapadel.10 Z hlediska enginu to znamená, že se model definuje jako hlavní rigidní středový bod (tělo) o poloměru ![][image17], přičemž každé chapadlo je instancováno jako zcela izolovaný kinematický řetězec se svým vlastním kořenem ukotveným na kružnici kolem středu těla. Tato topologie zcela eliminuje nutnost průměrování uzlů, odstraňuje z komplexity výpočtu centroidy a dovoluje aplikaci paralelního zpracování, jelikož žádné chapadlo neovlivňuje výpočet polohy jiného chapadla. V aplikaci 2D Canvas je tento přístup pro sestavu "8 chapadel x 8 segmentů" naprostým produkčním standardem, který zajišťuje čistotu kódu a maximální rychlost.

## **2\. Procedurální generování pohybu a adaptace biologických reálií**

Aby virtuální model vykazoval vizuálně přesvědčivý plavací pohyb pod vodou, nepostačuje cíle (targets) koncových efektorů přesouvat pouze lineárně. Mořská biologie nabízí rozsáhlé studie o biomechanice lokomoce hlavonožců, ze kterých lze matematicky odvodit plynulé procedurální trajektorie pohybů.11 Křivky dráhy špiček chapadel je nutné modelovat pomocí syntézy asymetrických harmonických funkcí obohacených o kontrolovaný pseudonáhodný šum.

### **Biomechanický model lokomoce chobotnice**

Chobotnice se pod vodou pohybují primárně reaktivním pohonem (vypuzováním vody), což často doplňují takzvaným veslovacím pohybem (sculling movement) chapadel. Alternativně některé druhy, jako například *Amphioctopus marginatus* (kokosová chobotnice), vykazují schopnost kráčet po mořském dně, přičemž využívají specifický fázovaný dvounohý pohyb.12 Pro účely prostorové plavací procedurální animace se aplikuje vzor veslování.

Zásadním zjištěním biomimetických studií je, že pohyb se dělí do dvou asymetrických fází: power stroke (silový záběr, který uzavírá chapadla k tělu a generuje tah) a recovery stroke (návratová fáze, při které se chapadla rozevírají s menším odporem vody, aby zaujala výchozí pozici).12 Aby algoritmus tento vzor reflektoval, nemůže se target pohybovat po dokonalé kružnici či statické sinusoidě. Časová rovina musí být modulována tak, aby návratová fáze proběhla pomaleji a extenzivněji, zatímco silový záběr bleskově a úžeji.

Základní trajektorii cíle pro ![][image11]\-té chapadlo určují parametrické rovnice modifikované elipsy závislé na vnitřním čase organismu ![][image15]. Základní rovnice pro posun targetu vůči relativní pozici ukotvení chapadla jsou:

![][image18]  
![][image19]  
V těchto rovnicích:

* ![][image20] odpovídá rychlosti přesunu samotného těla.  
* ![][image21] je statický úhel, pod kterým chapadlo ![][image11] vyrůstá z těla (např. ![][image22]).  
* ![][image23] definují amplitudu (šířku a výšku rozmachu chapadla do prostoru).  
* ![][image24] je frekvence pohybu (rychlost lokomoce).  
* ![][image25] představuje fázový posun přidělený konkrétnímu chapadlu.  
* Člen ![][image26] zavádí nelinearitu, která zplošťuje vrcholy trajektorie a vytváří charakteristické prudké stáhnutí chapadel typické pro power stroke. Parametr ![][image27] obvykle nabývá hodnot ![][image28].

### **Konfigurace fázového posunu pro 8 chapadel**

Pro stabilitu lokomoce se v přírodě zřídkakdy pohybují všechna chapadla současně. Rozdílné distribuce fází vytvářejí rozličné vizuální projevy, známé z analýz podvodních robotických mechanismů.11

Tabulka níže ilustruje dva ověřené biomechanické vzory rozložení fáze ![][image25] pro 8chapadelný systém, definovaný uspořádáním od L1 do L4 (levá strana zepředu dozadu) a R1 do R4 (pravá strana).

| Biologický vzor (Gait) | Skupina A (Fáze ϕ=0) | Skupina B (Fáze ϕ=π) | Vizuální projev |
| :---- | :---- | :---- | :---- |
| **G4 (Střídavý symetrický)** | L1, L3, R2, R4 | L2, L4, R1, R3 | Extrémně stabilní "kráčivý" plavací pohyb, minimalizující výkyvy těžiště.16 Působí mechanicky efektivně. |
| **G5 (Paralelní blokový)** | L1, L4, R1, R4 | L2, L3, R2, R3 | Pohyb, při němž vnější chapadla vytvářejí masivní rozevření, po kterém následuje pulz vnitřních chapadel.16 |
| **Radial Wave (Vlnivý)** | Postupně od ![][image29] do ![][image30] po krocích ![][image31] | N/A (Sekvenční posun) | Plynulé vlnění připomínající pohyb medúzy nebo sasanky. Nejpůsobivější pro pomalu plující klidové stavy. |

### **Integrace Perlinova šumu pro prolomení strojové linearity**

Dokonale matematické goniometrické funkce vytvářejí vizuál, který divák podvědomě detekuje jako "počítačově generovaný". Každý živočich bojuje s turbulentními mořskými proudy a drobnými korekcemi polohy. Z tohoto důvodu se do rovnic generování cíle injektuje Perlinův nebo Simplexní šum, což je spojitá pseudonáhodná gradientní funkce hojně využívaná pro tvorbu organických textur a pohybů.17

Aplikace šumu se neprovádí přímo na samotné souřadnice, ale přičítá se jako nízko-frekvenční ofset k amplitudě nebo úhlu. V JavaScriptu, pomocí standardní 1D šumové funkce, se kód upraví takto:

JavaScript

// Procedurální aktualizace polohy cíle pro konkrétní chapadlo  
updateTarget(time, noiseFunction, index, angleOffset) {  
    // Čas modulovaný pro asymetrický power-stroke  
    const t \= time \* this.swimSpeed;  
    const asyncTime \= t \+ 0.4 \* Math.sin(t);  
      
    // Organický ofset pomocí Perlin noise  
    const noiseOffsetX \= noiseFunction(t \* 0.5 \+ index \* 10\) \* 20;  
    const noiseOffsetY \= noiseFunction(t \* 0.5 \+ index \* 10 \+ 1000\) \* 20;  
      
    // Základní rozevření targetu podle radiálního úhlu vůči tělu  
    const baseRadius \= 150 \+ Math.sin(asyncTime \+ this.phaseShift) \* 50;  
      
    this.targetIdealX \= this.bodyX \+ Math.cos(angleOffset) \* baseRadius \+ noiseOffsetX;  
    this.targetIdealY \= this.bodyY \+ Math.sin(angleOffset) \* baseRadius \+ noiseOffsetY;  
}

Tato implementace zaručí, že dosah chapadla se neustále mírně mění a žádná vlnová perioda není absolutně totožná s periodou předchozí, čímž vzniká iluze živého chování.19

## **3\. Rendering a vyhlazování: Od Catmull-Rom splinu k Bézierovým křivkám**

Výstupem matematického modelu FABRIK je série ostrých lomených čar tvořených pevnými body.20 Ačkoliv se v dřívější videoherní grafice takové modely považovaly za akceptovatelné, moderní 2D design vyžaduje organické, absolutně hladké kontury s variabilní tloušťkou.21 Rozhraní HTML5 Canvas poskytuje příkazy pro kreslení čar a křivek, z nichž nejzásadnější je bezierCurveTo(), definující kubickou Bézierovu křivku. Aplikace této funkce však skrývá zásadní matematickou výzvu.

### **Catmull-Rom spline a jeho matematická transformace do Bézierových křivek**

Problém s Bézierovými křivkami spočívá ve faktu, že křivka sice prochází svým počátečním a koncovým bodem, ale obecně neprochází svými vnitřními řídicími (control) body. Je pouze přitahována jejich vahou.23 Inverzní kinematika vyžaduje přesný opak: vizuální tkáň chapadla musí bezpodmínečně procházet přes uzly ![][image32], které FABRIK spočítal. K tomuto účelu slouží Catmull-Romův spline, což je třída lokálně interpolujících kubických křivek garantujících průchod každým řídicím bodem.25

Jelikož API Canvasu Catmull-Rom nativně neobsahuje, je nutné křivku analyticky rozebrat a konvertovat na posloupnost kubických Bézierových křivek.27 Představme si úsek mezi uzly ![][image4] a ![][image33], zasazený v kontextu předcházejícího uzlu ![][image34] a následujícího uzlu ![][image35]. Standardní (uniformní) Catmull-Rom derivuje tečny v bodech ![][image4] a ![][image33] výhradně ze spojnic okolních bodů. Směr křivky v bodě ![][image4] je rovnoběžný s vektorem ![][image36], což se matematicky projeví výpočtem dvou skrytých řídicích bodů Bézierovy křivky ![][image37] a ![][image38].26

Transformační rovnice pro uniformní Catmull-Rom (kde parametr tension napětí splinu se rovná ![][image39]) jsou dány takto:

![][image40]  
![][image41]  
V případech, kdy jde o krajní úseky chapadla, kde bod ![][image34] neexistuje (kořen) nebo ![][image35] neexistuje (špička), se tyto chybějící body virtuálně extrapolují zrcadlením nebo prodloužením existujícího úseku, aby byla zajištěna spojitost první derivace ![][image42] po celé délce.31

Zde je implementace této matematiky v JavaScriptu navržená tak, aby plynule naplnila cestu plátna (Path2D):

JavaScript

function drawCatmullRomToCanvas(ctx, points, tension \= 6\) {  
    if (points.length \< 2\) return;  
      
    ctx.beginPath();  
    ctx.moveTo(points.x, points.y);  
      
    for (let i \= 0; i \< points.length \- 1; i++) {  
        // Zabezpečení krajních bodů extrapolací  
        const p0 \= (i \=== 0)?   
            { x: points.x \- (points.x \- points.x), y: points.y \- (points.y \- points.y) } : points\[i \- 1\];  
        const p1 \= points\[i\];  
        const p2 \= points\[i \+ 1\];  
        const p3 \= (i \+ 2 \=== points.length)?   
            { x: points\[i \+ 1\].x \+ (points\[i \+ 1\].x \- points\[i\].x), y: points\[i \+ 1\].y \+ (points\[i \+ 1\].y \- points\[i\].y) } : points\[i \+ 2\];  
          
        // Transformace Catmull-Rom logiky do Bézierových řídicích bodů  
        const cp1x \= p1.x \+ (p2.x \- p0.x) / tension;  
        const cp1y \= p1.y \+ (p2.y \- p0.y) / tension;  
          
        const cp2x \= p2.x \- (p3.x \- p1.x) / tension;  
        const cp2y \= p2.y \- (p3.y \- p1.y) / tension;  
          
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);  
    }  
}

### **Problém tapering efektu a generování tvarových obálek (Hulls)**

Popsaný kód sice nakreslí dokonale plynulou čáru procházející uzly FABRIK, avšak neřeší masivnost organické struktury. Chapadlo chobotnice má u těla širokou základnu, která se plynule zužuje do ostré špičky (tapering efekt).21

Nativní 2D Canvas API trpí závažným fundamentálním omezením: atribut ctx.lineWidth nelze dynamicky alterovat podél jedné spojité cesty. Jakákoliv snaha o postupnou úpravu tloušťky uprostřed volání bezierCurveTo povede pouze k tomu, že celý tah získá tloušťku odpovídající poslední nastavené hodnotě těsně před zavoláním finálního ctx.stroke().21 Existují snahy obcházet tento problém segmentováním tahů – rozříznutím chapadla na krátké čárky, každá s menším lineWidth. Výsledkem jsou ale defektní, zubaté překryvy v záhybech, protože koncová zakončení (caps) a spojení tahů (joins) nedokážou správně navázat křivost.33

Standardním a vysoce profesionálním řešením tohoto problému je procedurální modelování 2D polygonu neboli obálky (hull). Tento přístup zcela zavrhuje vykreslování pomocí tahů stroke() a místo toho konstruuje uzavřenou křivkovou cestu, která se nakonec vylije barvou pomocí ctx.fill().35

Pro vytvoření obálky se využívá vektorové matematiky normál:

1. V každém IK uzlu ![][image7] se vypočte směrový vektor (tangenta) ke křivce. Obvykle jako střední směr sousedních vektorů.  
2. Z tangenty se vygeneruje normála ![][image43], což je kolmý vektor mířící "do strany". Matematicky se ve 2D prostoru získá tak, že vektor tangenty ![][image44] se přetočí o 90 stupňů: ![][image45] a následně normalizuje na délku 1\.  
3. Definujeme tloušťku ![][image46] pro každý uzel ![][image11]. Pro lineární ztenčení platí: ![][image47].  
4. Kolem uzlu se vygenerují dva odsazené body tvořící tělo chapadla:  
   Levý bod ![][image48]  
   Pravý bod ![][image49].

Nakonec se volá funkce drawCatmullRomToCanvas přes pole všech bodů ![][image50], přičemž na špičce se pomocí ctx.arc() cesta uzavře s poloměrem rovným koncovému zúžení, a plynule se vrací po levé straně přes pole všech bodů ![][image51] zpět k tělu, kde se tvar uzavře do souvislého polygonu. Aplikace gradientních výplní přes ctx.fill() v tomto těle vytváří bezkonkurenční organický vizuál simulující měkké tkáně v plném rozlišení bez ohledu na velikost přiblížení.33

## **4\. Simulace odporu vody a setrvačnosti: Fyzika vlečného efektu**

Navzdory tomu, že doposud popsané procesy vytvářejí precizní geometrickou projekci pohybu, chybí jim interakce s prostředím. Voda jako viskózní médium silně působí na všechny pohybující se entity. Pokud by byla poloha ideálního cíle generovaná asymetrickým vlněním (bod 2\) ihned a přímo předávána algoritmu FABRIK (bod 1), animace by působila zcela rigidně, jako by byla chobotnice vytesána z oceli pohybující se ve vakuu. Tkáně cephalopodů fungují jako "svalový hydrostat", jsou vysoce kompresibilní, elastické a vykazují zjevnou setrvačnost (momentum) zpožďující reálný pohyb za ideálním svalovým signálem.14

Aby se dosáhlo iluze "vlečení" chapadel (trailing efekt), kdy chapadla znatelně zaostávají za impulzivním pohybem těla, aplikuje se fyzikální model tlumeného harmonického oscilátoru (Mass-Spring-Damper) na úroveň manipulace s cílem IK.37

### **Modelování Hookova zákona a viskózního odporu**

Každé chapadlo místo přímého následování vypočítaného TargetIdeal vlastní virtuální proměnnou TargetActual. Tento skutečný cíl se snaží ideální bod dohnat rychlostí, na kterou působí dvě protichůdné síly:

1. **Pružná obnovující síla (Stiffness/Spring Force):** Táhne cíl k jeho ideální poloze. Roste lineárně se vzdáleností (dle Hookova zákona: ![][image52], kde ![][image53] je konstanta tuhosti a ![][image54] odchylka).37  
2. **Viskózní tlumení (Damping/Drag Force):** Brzdí rychlost pohybu. Je úměrná rychlosti pohybu skrz prostředí, simulující odpor proudící vody (Stokesův zákon, případně Newtonův odpor prostředí: ![][image55], kde ![][image27] je koeficient tlumení a ![][image56] aktuální vektor rychlosti).39

V diskrétním světě vykreslovací smyčky se tato fyzika řeší nejčastěji pomocí semidekripční Eulerovy integrace.41 Integrace do objektově orientovaného JavaScript kódu pro chapadlo pak vypadá takto:

JavaScript

class PhysicsTarget {  
    constructor(startX, startY) {  
        this.actualX \= startX;  
        this.actualY \= startY;  
        this.velocityX \= 0;  
        this.velocityY \= 0;  
          
        // Fyzikální parametry kalibrované pro podvodní prostředí  
        this.stiffness \= 0.12;   
        this.damping \= 0.78;     
    }

    update(idealX, idealY) {  
        // Výpočet zrychlení z Hookova zákona (směr k ideální pozici)  
        const ax \= (idealX \- this.actualX) \* this.stiffness;  
        const ay \= (idealY \- this.actualY) \* this.stiffness;  
          
        // Integrace zrychlení do rychlosti  
        this.velocityX \+= ax;  
        this.velocityY \+= ay;  
          
        // Aplikace tlumení prostředí (ztráta kinetické energie)  
        this.velocityX \*= this.damping;  
        this.velocityY \*= this.damping;  
          
        // Integrace rychlosti do polohy  
        this.actualX \+= this.velocityX;  
        this.actualY \+= this.velocityY;  
    }  
}

### **Kalibrace parametrů pro realistické tlumení**

Klíčem k organickému projevu je nalezení jemné balance v rovnováze kritického tlumení (critical damping). Pokud se nastaví špatné koeficienty, fyzikální model zcela devalvuje veškeré vizuální snahy. Následující tabulka ukazuje odhadované výsledky pro typické nastavení.38

| Stav koeficientů | Hodnota Stiffness (k) | Hodnota Damping (c) | Vizuální manifestace pohybu |
| :---- | :---- | :---- | :---- |
| **Příliš tuhé (Undamped)** | 0.40 \- 0.60 | 0.90 \- 0.98 | Chapadla kmitají a pruží tam a zpět kolem cíle jako napjaté gumové lano mimo vodu. Působí velmi nepatřičně. |
| **Robotické (Rigid)** | 0.80 \- 1.00 | \< 0.50 | Skutečný cíl okamžitě přeskakuje na ideální. Trailing efekt neexistuje. Chobotnice připomíná mechanického pavouka. |
| **Kriticky tlumené (Realistické)** | **0.10 \- 0.18** | **0.75 \- 0.85** | Cíl dožene tělo asynchronním plynulým přesunem bez překmitu (overshoot). Voda působí viskózně a hutně. Dokonalý vzhled. |
| **Přetlumené (Sluggish)** | 0.05 | 0.40 | Extrémní odpor. Chapadla se vlečou dalekosáhle za tělem a vlnivý pohyb cíle není schopen se projevit na struktuře chapadla. |

Tyto rovnice a kalibrované parametry transformují dříve popsanou sinusovou křivku tak, že ve chvíli, kdy chobotnice vystřelí prudce vpřed plnou silou, TargetIdeal pro všechna chapadla odskočí s tělem, ale TargetActual všech chapadel zaostane na původních souřadnicích. Fyzikální model je pozvolna vtáhne zpět. IK Fabrik je nucen všechny segmenty masivně ohnout směrem dozadu a natáhnout je do prodloužené přímky protínající trajektorii. Tato souhra vzorců vytváří dokonalou procedurální animaci tažného drag efektu za pohybujícím se tělesem.39

## **5\. Analýza otevřených (Open-Source) implementací v ekosystému JavaScript**

Ačkoliv je výše prezentovaný matematický a algoritmický rozbor dostatečný k implementaci na zelené louce, v produkčním prostředí nebo pro složitější topologické restrikce (omezování úhlů otočení kosti vůči kloubům) se vývojáři běžně opírají o hotové, komunitou testované komponenty. Ekosystém webového vývoje obsahuje několik prověřených portů IK řešení.44 Zde je nutné důrazně oddělit sémantiku hledaných termínů, jelikož populární manipulační 2D knihovna "Fabric.js" nemá absolutně nic společného s inverzní kinematikou FABRIK.45 Skutečný FABRIK algoritmus v JS reprezentují následující architektury.

### **1\. RGBboy / fabrik-2d**

Tato minimalistická repozitářová knihovna ztělesňuje puristický přístup k aplikaci matematiky. Omezuje se striktně na vektorové operace potřebné pro řešení 2D řetězců (Chain topology) a nezahrnuje grafické vykreslování v Canvasu, což zamezuje technologickému uzamčení (lock-in). Vykazuje excelentní optimalizaci pro dopředný a zpětný průchod s podporou nastavitelných délek prvků.44 Implementačně je nejvhodnější jako matematické jádro (solver) vložené do jakéhokoliv frameworku (Phaser, PIXI.js, nebo čistý Vanilla Canvas API).

### **2\. THREE.IK (autor jsantell)**

Zatímco RGBboy řeší 2D struktury, THREE.IK je objemná knihovna integrovaná do oblíbeného 3D enginu Three.js. Tento projekt však v sobě skrývá plně implementovaný FABRIK Solver s podporou stromových topologií, složitých úhlových restrikcí pro kulové i pantové klouby (ball-and-socket, hinge constraints) a podporuje vícenásobné efektory (multiple end-effectors) propojené pomocí výpočtu dříve zmiňovaného centroidu.44 Přestože knihovna běží nativně nad 3D objekty, architektonická logika řešení omezujících podmínek z ní činí cenný referenční materiál pro případy, kdy by model chobotnice vyžadoval omezit kroucení chapadla tak, aby se vyhnulo samo-křížení (self-intersection).

### **3\. Knihovny Caliko a fullik**

A. Aristidou a J. Lasenby (původní tvůrci FABRIK algoritmu) verifikovali rozličné aplikace své práce, ze kterých vzešla knihovna Caliko postavená primárně v jazyce Java pro velmi rozsáhlé systémy v biomechanice i robotice. Z důvodu rostoucí popularizace HTML5 her byla celá tato rozsáhlá knihovna plně portována do JavaScriptu pod repozitářem fullik.44 Caliko (a tím pádem fullik) se vyznačuje stoprocentní přesností v dodržování originální bílé knihy, a to i ve zvládání okrajových podmínek singularit (pokud se kloub ocitne naprosto dokonale v linii a potřebuje aplikovat infinitezimální uhnutí, aby se nezablokoval). Tato knihovna je na rozdíl od fabrik-2d navržena i pro struktury o stovkách napojených řetězců simulujících obratlovce.

### **4\. Příkladová řešení v Codepen a P5.js ekosystému**

V oblasti tutoriálových referencí se vyjímá kód Yanneeh "Fabrik-Inverse-kinematics" 50, demonstrující jasné oddělení 2D a 3D logiky. Velká část otevřeného učebního materiálu se rovněž soustřeďuje na platformě CodePen a v ekosystému P5.js. Vývojáři zde často kombinují FABRIK v p5.js prostředí přímo s generováním hluku procedurálních hadů a draků, nicméně kód v P5.js bývá zatížen abstraktní režií enginu a pro čisté, tvrdě optimalizované aplikace při limitu 60fps u masy objektů je vhodnější transformovat nalezenou logiku do surového Vanilla JS využívajícího nativní kontext.

## **6\. Optimalizace výkonu a limity API Canvas 2D při 60 fps**

Ačkoliv heuristika algoritmu FABRIK zajišťuje výpočetní lineární růst ![][image57] úměrně k počtu uzlů 3, renderování rozsáhlé fluidní struktury do 2D bitmapy narušuje propustnost celkového procesového cyklu na vrstvě vykreslovacího enginu prohlížeče (tzv. CPU bound nebo rasterizace).8 Splnění primárního zadání – stabilního běhu na 60 snímků za sekundu bez mikro-záškubů pro systémy s vysokým počtem entit – vyžaduje inženýrský přístup přesahující triviální iteraci ve smyčce.

### **Dimenzování zátěže: Matematický aparát vs. Canvas Rasterizace**

Vezměme standardní entitu simulované chobotnice disponující ![][image58] chapadly, každé o délce ![][image58] nezávislých segmentů. Tato architektura zavádí do systému celkem 64 polohových bodů vyžadujících neustálou polohovou aktualizaci IK systému. Pro každou iteraci FABRIK dopředným a zpětným zásahem provede přibližně ![][image59] uzlových polohových rekalkulací. I kdyby engine potřeboval stanovené 3 iterace pro nalezení dokonalé tolerance (tj. zhruba 400 matematických operací násobení, odčítání a limitně drahého zjišťování odmocniny vzdálenosti Math.sqrt() per entita) 6, engine jako Google V8 (Chrome) nebo SpiderMonkey (Firefox) provádí matematiku na úrovni JIT kompilátoru v řádu mikrosekund.3

Problém nikdy nedříme v matematice algoritmu FABRIK. Klesání frekvence pod 60 fps je z více než ![][image60] důsledkem API propustnosti samotného prvku Canvas.52 Problém spočívá v přepínání interních stavů plátna a ve výplních komplexních vyhlazovaných křivek o velkém množství control pointů přes operace jako beginPath(), bezierCurveTo() a následném fill().35 Dále situaci komplikuje Garbage Collector, který periodicky zastavuje hlavní vlákno (tzv. "stop-the-world" události), pokud v kódu během vykreslovací smyčky requestAnimationFrame dochází k instancování nových dočasných JS objektů.8

### **Architektura vysoce propustného řešení**

Udržení výkonu masivních hejn (skupin o 20 až 50 chobotnicích v jediné scéně) vyžaduje aplikaci několika pilířů grafické a paměťové optimalizace.

**1\. Paměťový pooling a eliminace Garbage Collectoru:** Tradiční objektově orientované modelování bodů pomocí { x: valX, y: valY } nebo neustálé vracení instancovaných vektorů new Vector2D(x, y) uvnitř vyhodnocovací smyčky masivně alokuje paměť v haldě a vede ke gc zásekům o délce 5 až 15 milisekund, čímž dochází k opoždění celého snímku (frame drop).8 Optimalizované řešení reprezentuje polohová data uvnitř předem vyčleněných jednorozměrných polí formátu Float32Array. K těmto číslům přistupuje logika chapadla pomocí indexace (i \* 2\) pro pozici X a (i \* 2 \+ 1\) pro pozici Y.54 V paměti se tak během vykreslování alokuje přesně 0 nových Bytů dat a nedochází k jakýmkoliv fluktuacím ve využití mezipaměti.

**2\. Minimalizace změn stavu v Canvasu (State Batching):** Operace typu ctx.fillStyle nebo zahajování nové cesty ctx.beginPath() jsou vnitřně nejdražšími instrukcemi, protože komunikují skrz softwarovou vrstvu rovnou se shaderovou logikou hardwarové akcelerace. V případě osmi stejných chapadel téže entity se nikdy nesmí postupovat naivním způsobem cyklování: "vytvořit tah chapadla ![][image61] vyplnit chapadlo barvou ![][image61] vytvořit druhé chapadlo ![][image61] vyplnit". Výrazného zlepšení výkonnosti propustnosti grafické karty lze dosáhnout spojením všech definic bodů. Zavolá se jedno plošné ctx.beginPath(). Všechny křivky Catmull-Romova splinu všech osmi struktur se do této jediné cesty spojí (Canvas umožňuje diskrétní pod-cesty bez kreslení propojovací čáry za použití sekvenčního zavolání moveTo mezi objekty). Teprve na úplném konci proběhne jediné volání ctx.fill() pro všechny entity shodné grafické povahy.35 Tím vzroste vykreslovací kapacita několikanásobně.

**3\. Prostorové vyřazování (Spatial Culling a Skip Frames):**

Logika zjišťování kolizí a ořezu umožňuje v případě plavání chobotnice mimo aktivní výřez obrazovky absolutně minimalizovat zátěž na výpočetní systém.

* *Ořez Vykreslování (Render Culling):* Pokud je středové tělo mimo okraj Viewportu \+ průměr maximálního dosahu nataženého chapadla, kompletně se pro danou iteraci přeruší komunikace s grafickým API.  
* *Ořez Kinematiky (Logic LOD \- Level of Detail):* Pokud je zvíře umístěno blízko kraje, ale reálně není na scéně vizualizováno, z fyzikálního hlediska není nezbytné dosahovat extrémní přesnosti FABRIK. Počet iterací ![][image11] se u entit "mimo kameru" dynamicky tlumí na limit jediné iterace na frame, případně systém dovolí asynchronní řešení posuvu bodů (např. řešit chapadla sudých entit v sudý frame a liché v lichý), přičemž fyzika i target drag nadále fungují. Vizuální integrita pozadí světa přitom netrpí pozorovatelnými artefakty.51

**4\. Ukládání fixních vzorů přes Path2D Cache:** Množina aplikací obsahuje i nečinné chobotnice kotvící na textuře útesu. Algoritmus FABRIK po ustálení zredukuje odchylky v kloubech k absolutní nule. Z takto uzamčené geometrie se vyrobí fixní strukturový objekt API třídy Path2D. Renderovací cyklus pouze přesměruje rotaci a transformaci vrstvy. Až při vyprovokovaném pohybu se znovu dekomprimuje systém procedurálních kontrolních bodů z cache do operační dynamické fronty.56

| Scénář a architektonický styl | Počet IK řetězců (8 segmentů) | Počet chobotnic na scéně | Předpokládané dosažitelné FPS bez optimalizace | FPS s pre-alokací a Spatial Culling |
| :---- | :---- | :---- | :---- | :---- |
| Nízká zátěž (Demonstrace) | 8 | 1 | 60 stabilní | 60 stabilní |
| Standardní zátěž (Hejno) | 160 | 20 | 45 \- 55 (častý GC drop) | 60 stabilní |
| Extrémní zátěž (Simulace) | 800 | 100 | \< 15 fps (přehlcení Canvas API) | 40 \- 50 fps (hratelné maximum 2D kontextu) |

Spojení elegantního heuristického vzorce FABRIK pracujícího s milisekundovými objemy vektorových výpočtů s efektivně řešenou 2D grafikou vyústí ve vznik silně optimalizované procedurální entity. Tvarování za pomoci harmonických biologických modelů chování pak odstiňuje mechanický vizuál původního kódu ve prospěch obdivuhodné imitace fluidní reality simulovaného vodního světa, čímž je absolutně naplněn cíl generování organického chapadlového plavání v prohlížečovém enginu.

#### **Citovaná díla**

1. This is the Simplest Inverse Kinematics solution. Also the most stable. Pseudo-code included (reposted from r/gamedev) \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/robotics/comments/6paxf7/this\_is\_the\_simplest\_inverse\_kinematics\_solution/](https://www.reddit.com/r/robotics/comments/6paxf7/this_is_the_simplest_inverse_kinematics_solution/)  
2. FABRIK.pdf \- Andreas Aristidou, použito března 7, 2026, [https://www.andreasaristidou.com/publications/papers/FABRIK.pdf](https://www.andreasaristidou.com/publications/papers/FABRIK.pdf)  
3. FABRIK: A fast, iterative solver for the Inverse Kinematics problem, použito března 7, 2026, [https://andreasaristidou.com/publications/papers/FABRIK.pdf](https://andreasaristidou.com/publications/papers/FABRIK.pdf)  
4. (PDF) Inverse Kinematics: a review of existing techniques and introduction of a new fast iterative solver \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/publication/273166356\_Inverse\_Kinematics\_a\_review\_of\_existing\_techniques\_and\_introduction\_of\_a\_new\_fast\_iterative\_solver](https://www.researchgate.net/publication/273166356_Inverse_Kinematics_a_review_of_existing_techniques_and_introduction_of_a_new_fast_iterative_solver)  
5. Unlocking FABRIK for Inverse Kinematics | by anurubha\_ | Medium, použito března 7, 2026, [https://medium.com/@anurubha1998/unlocking-fabrik-for-inverse-kinematics-fd4e6b223038](https://medium.com/@anurubha1998/unlocking-fabrik-for-inverse-kinematics-fd4e6b223038)  
6. FABRIK – Forward And Backward Reaching Inverse Kinematics in Processing, použito března 7, 2026, [https://barbegenerativediary.com/en/tutorials/fabrik-forward-and-backward-reaching-inverse-kinematics-in-processing/](https://barbegenerativediary.com/en/tutorials/fabrik-forward-and-backward-reaching-inverse-kinematics-in-processing/)  
7. HTML5 Canvas Performance and Optimization Tips, Tricks and Coding Best Practices \- GitHub Gist, použito března 7, 2026, [https://gist.github.com/jaredwilli/5469626](https://gist.github.com/jaredwilli/5469626)  
8. is smooth 60fps canvas animation really possible \- even with requestAnimationFrame ? : r/javascript \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/javascript/comments/hucn8/is\_smooth\_60fps\_canvas\_animation\_really\_possible/](https://www.reddit.com/r/javascript/comments/hucn8/is_smooth_60fps_canvas_animation_really_possible/)  
9. How to prove FABRIK algorithm also converges in the multiple end effector case?, použito března 7, 2026, [https://math.stackexchange.com/questions/4519957/how-to-prove-fabrik-algorithm-also-converges-in-the-multiple-end-effector-case](https://math.stackexchange.com/questions/4519957/how-to-prove-fabrik-algorithm-also-converges-in-the-multiple-end-effector-case)  
10. Octopus Simulation Tips and Tricks \- Kate Xagoraris, použito března 7, 2026, [https://www.katexagoraris.com/misc-4/octopus-simulation-tips-and-tricks](https://www.katexagoraris.com/misc-4/octopus-simulation-tips-and-tricks)  
11. Turning Maneuvers of an Octopus-inspired Multi-arm Robotic Swimmer \- ICS-FORTH, použito března 7, 2026, [https://projects.ics.forth.gr/cvrl/octopus/publications/MED13\_0280\_MS.pdf](https://projects.ics.forth.gr/cvrl/octopus/publications/MED13_0280_MS.pdf)  
12. (PDF) Swimming Patterns of the Octopus Vulgaris \- ResearchGate, použito března 7, 2026, [https://www.researchgate.net/publication/240048531\_Swimming\_Patterns\_of\_the\_Octopus\_Vulgaris](https://www.researchgate.net/publication/240048531_Swimming_Patterns_of_the_Octopus_Vulgaris)  
13. Design and Experimental Study of Octopus-Inspired Soft Underwater Robot with Integrated Walking and Swimming Modes \- PMC, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC12838968/](https://pmc.ncbi.nlm.nih.gov/articles/PMC12838968/)  
14. Patterns of Arm Muscle Activation Involved in Octopus Reaching Movements \- PMC, použito března 7, 2026, [https://pmc.ncbi.nlm.nih.gov/articles/PMC6793066/](https://pmc.ncbi.nlm.nih.gov/articles/PMC6793066/)  
15. Octopus-Swimming-Like Robot with Soft Asymmetric Arms \- arXiv, použito března 7, 2026, [https://arxiv.org/html/2410.11764v1](https://arxiv.org/html/2410.11764v1)  
16. Octopus-inspired Eight-arm Robotic Swimming by Sculling Movements \- ICS-FORTH, použito března 7, 2026, [https://projects.ics.forth.gr/cvrl/octopus/publications/ICRA13\_2200\_MS.pdf](https://projects.ics.forth.gr/cvrl/octopus/publications/ICRA13_2200_MS.pdf)  
17. Procedural Pixel Art Tentacle in 6min \- YouTube, použito března 7, 2026, [https://www.youtube.com/watch?v=-h2dkiKy\_4I](https://www.youtube.com/watch?v=-h2dkiKy_4I)  
18. How would you go with animating the "tentacles"? : r/AfterEffects \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/AfterEffects/comments/1i7o3kn/how\_would\_you\_go\_with\_animating\_the\_tentacles/](https://www.reddit.com/r/AfterEffects/comments/1i7o3kn/how_would_you_go_with_animating_the_tentacles/)  
19. Procedural tentacle animation for game enemy limbs in game Shut \- Reddit, použito března 7, 2026, [https://www.reddit.com/r/proceduralgeneration/comments/1oe9lk5/procedural\_tentacle\_animation\_for\_game\_enemy/](https://www.reddit.com/r/proceduralgeneration/comments/1oe9lk5/procedural_tentacle_animation_for_game_enemy/)  
20. Forward and Backward Reaching Inverse Kinematics (FABRIK) Solver for DHM: A Pilot Study \- University of Iowa Libraries Publishing, použito března 7, 2026, [https://pubs.lib.uiowa.edu/dhm/article/31772/galley/140227/view/](https://pubs.lib.uiowa.edu/dhm/article/31772/galley/140227/view/)  
21. Drawing width varying bezier curves on HTML5 using Javascript \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/14121949/drawing-width-varying-bezier-curves-on-html5-canvas-using-javascript](https://stackoverflow.com/questions/14121949/drawing-width-varying-bezier-curves-on-html5-canvas-using-javascript)  
22. HTML5 Canvas demo with lines smoothed using Bézier curve \- GitHub Gist, použito března 7, 2026, [https://gist.github.com/upsuper/2633348](https://gist.github.com/upsuper/2633348)  
23. How to draw a polyBezier or polyCurve using Canvas HTML \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/2155210/how-to-draw-a-polybezier-or-polycurve-using-canvas-html](https://stackoverflow.com/questions/2155210/how-to-draw-a-polybezier-or-polycurve-using-canvas-html)  
24. Splines from Scratch: Bézier Curves \- DEV Community, použito března 7, 2026, [https://dev.to/ndesmic/splines-from-scratch-bezier-curves-1c1m](https://dev.to/ndesmic/splines-from-scratch-bezier-curves-1c1m)  
25. Calculate Catmull-Rom splines using forward differencing \- Lektion des Tages, použito března 7, 2026, [https://lektiondestages.art.blog/2011/08/17/calculate-catmull-rom-splines-using-forward-differencing/](https://lektiondestages.art.blog/2011/08/17/calculate-catmull-rom-splines-using-forward-differencing/)  
26. Catmull–Rom spline \- Wikipedia, použito března 7, 2026, [https://en.wikipedia.org/wiki/Catmull%E2%80%93Rom\_spline](https://en.wikipedia.org/wiki/Catmull%E2%80%93Rom_spline)  
27. Convert Beziér control points to Catmull-Rom control points \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/10071998/convert-bezi%C3%A9r-control-points-to-catmull-rom-control-points](https://stackoverflow.com/questions/10071998/convert-bezi%C3%A9r-control-points-to-catmull-rom-control-points)  
28. \[2011.08232\] Conversion Between Cubic Bezier Curves and Catmull-Rom Splines, použito března 7, 2026, [https://arxiv.org/abs/2011.08232](https://arxiv.org/abs/2011.08232)  
29. A routine to compute the cubic Bézier spline parameters to fit a curve to points, using the Catmull-Rom algorithm. \- gists · GitHub, použito března 7, 2026, [https://gist.github.com/6925609](https://gist.github.com/6925609)  
30. Catmull-Rom interpolation on SVG Paths \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/30748316/catmull-rom-interpolation-on-svg-paths](https://stackoverflow.com/questions/30748316/catmull-rom-interpolation-on-svg-paths)  
31. Parameterization and Applications of Catmull-Rom Curves \- Texas A\&M University, použito března 7, 2026, [https://people.engr.tamu.edu/schaefer/research/cr\_cad.pdf](https://people.engr.tamu.edu/schaefer/research/cr_cad.pdf)  
32. The Cubic α-Catmull-Rom Spline \- MDPI, použito března 7, 2026, [https://www.mdpi.com/2297-8747/21/3/33](https://www.mdpi.com/2297-8747/21/3/33)  
33. Exploring canvas drawing techniques — Perfection Kills, použito března 7, 2026, [https://perfectionkills.com/exploring-canvas-drawing-techniques/](https://perfectionkills.com/exploring-canvas-drawing-techniques/)  
34. Path with ascending stroke width \- canvas \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/36720680/path-with-ascending-stroke-width](https://stackoverflow.com/questions/36720680/path-with-ascending-stroke-width)  
35. CanvasRenderingContext2D: fill() method \- Web APIs \- MDN \- Mozilla, použito března 7, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fill)  
36. CanvasRenderingContext2D: fillRect() method \- Web APIs | MDN \- Mozilla.org, použito března 7, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillRect)  
37. Coral tentacle elasticity promotes an out-of-phase motion that improves mass transfer, použito března 7, 2026, [https://royalsocietypublishing.org/rspb/article/287/1929/20200180/85661/Coral-tentacle-elasticity-promotes-an-out-of-phase](https://royalsocietypublishing.org/rspb/article/287/1929/20200180/85661/Coral-tentacle-elasticity-promotes-an-out-of-phase)  
38. The effect of viscous drag on damped simple harmonic motion, použito března 7, 2026, [https://emerginginvestigators.org/articles/22-182](https://emerginginvestigators.org/articles/22-182)  
39. Numerical Assessment of Roll Motion Characteristics and Damping Coefficient of a Ship, použito března 7, 2026, [https://www.mdpi.com/2077-1312/6/3/101](https://www.mdpi.com/2077-1312/6/3/101)  
40. How to calculate the viscous damping coefficient given drag force, použito března 7, 2026, [https://engineering.stackexchange.com/questions/29462/how-to-calculate-the-viscous-damping-coefficient-given-drag-force](https://engineering.stackexchange.com/questions/29462/how-to-calculate-the-viscous-damping-coefficient-given-drag-force)  
41. React drag animation guide \- Motion.dev, použito března 7, 2026, [https://motion.dev/docs/react-drag](https://motion.dev/docs/react-drag)  
42. A Friendly Introduction to Spring Physics Animation in JavaScript \- Josh Comeau, použito března 7, 2026, [https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/](https://www.joshwcomeau.com/animation/a-friendly-introduction-to-spring-physics/)  
43. Is there a simple way to tweak the momentum/inertia on draggable elements in Framer Motion? \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/74739076/is-there-a-simple-way-to-tweak-the-momentum-inertia-on-draggable-elements-in-fra](https://stackoverflow.com/questions/74739076/is-there-a-simple-way-to-tweak-the-momentum-inertia-on-draggable-elements-in-fra)  
44. jsantell/THREE.IK: inverse kinematics for three.js \- GitHub, použito března 7, 2026, [https://github.com/jsantell/THREE.IK](https://github.com/jsantell/THREE.IK)  
45. GitHub \- fabricjs/fabric.js: Javascript Canvas Library, SVG-to-Canvas (& canvas-to-SVG) Parser, použito března 7, 2026, [https://github.com/kangax/fabric.js/](https://github.com/kangax/fabric.js/)  
46. FabricJS Autolayout? (demo included) \#10819 \- GitHub, použito března 7, 2026, [https://github.com/fabricjs/fabric.js/discussions/10819](https://github.com/fabricjs/fabric.js/discussions/10819)  
47. Implementation of the FABRIK in 2D: A fast, iterative solver for the Inverse Kinematics problem. \- GitHub, použito března 7, 2026, [https://github.com/RGBboy/fabrik-2d](https://github.com/RGBboy/fabrik-2d)  
48. THREE.IK \- Jordan Santell, použito března 7, 2026, [https://jsantell.com/three-ik/](https://jsantell.com/three-ik/)  
49. The Caliko library is an implementation of the FABRIK inverse kinematics algorithm in Java. \- GitHub, použito března 7, 2026, [https://github.com/FedUni/caliko](https://github.com/FedUni/caliko)  
50. A very simple implementation of the Fabrik inverse kinematics algorithm. Useful for games and animations. \- GitHub, použito března 7, 2026, [https://github.com/Yanneeh/Fabrik-Inverse-kinematics](https://github.com/Yanneeh/Fabrik-Inverse-kinematics)  
51. Understanding Performance for Mixed Reality \- Microsoft Learn, použito března 7, 2026, [https://learn.microsoft.com/en-us/windows/mixed-reality/develop/advanced-concepts/understanding-performance-for-mixed-reality](https://learn.microsoft.com/en-us/windows/mixed-reality/develop/advanced-concepts/understanding-performance-for-mixed-reality)  
52. \[Feature\]: Add Support for Configurable Rendering Context (2D and WebGL) · Issue \#10449 · fabricjs/fabric.js \- GitHub, použito března 7, 2026, [https://github.com/fabricjs/fabric.js/issues/10449](https://github.com/fabricjs/fabric.js/issues/10449)  
53. CanvasRenderingContext2D: beginPath() method \- Web APIs \- MDN, použito března 7, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/beginPath](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/beginPath)  
54. How can I optimize canvas performance for a 60fps emulator? \- Stack Overflow, použito března 7, 2026, [https://stackoverflow.com/questions/53067088/how-can-i-optimize-canvas-performance-for-a-60fps-emulator](https://stackoverflow.com/questions/53067088/how-can-i-optimize-canvas-performance-for-a-60fps-emulator)  
55. FABRIK Algorithm \- Node Security, použito března 7, 2026, [https://node-security.com/posts/fabrik-algorithm/](https://node-security.com/posts/fabrik-algorithm/)  
56. Drawing shapes with canvas \- Web APIs \- MDN, použito března 7, 2026, [https://developer.mozilla.org/en-US/docs/Web/API/Canvas\_API/Tutorial/Drawing\_shapes](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAAAYCAYAAAAI94jTAAACyElEQVR4Xu2YS8iMURjHH7cQIhShvqJsXYoIIRbkLkVYoKRvJRuXEqVsbGzYsZAiITbYKGKFklixkSLkEhvXXP7/OefMPO/zzTkzY0bfN9P51b/O+3/O+573zDPn9opkMplMJpPJZDKZTCbTIs5DD6FX0E9okPdeQ0+gfZWqLWE5dA96Dn3x3hHoKfQWOu69TuQu9Az6BG2G1kH3oW/QOWhUparISegr9EdpKzQZ+qi8VrFY3Mvp9pj8Luiq8saFGzqIm1Ls9xVoBrRTefvLtcEGFbAE/5YNNEl47ljjf1exTiT07YTxT6lYmTXVTM8PqR6bAP0yXiPEEnNIxQJDxA1/ekeV347EEjNAxTYFc5UyLbelZ+yYVIbfvxJLzCLvU1O8xzUwwHXwgrpuN2KJISF2NhgrlWnhpqBajGuF9Rohlhg93wZYHu7LB0ys3agnMRuDsUKZluBzR6FJJWYotNuahlhiam04rolbhyycAlPMgmZa01DrGWuhidZU9IMOWtMQSww3QCHG55TQieEPwy1zf4mPFpJKTLhntg0oQh1qvPe4VQ5eYeuoYGyY8bi7oX/d+JpYPwIPxMVT2/Vaz/ggLr7XBhS636u9t0B5e7xXQidmOvTZl99Dh1U9TSox68Ul9YwNKEJ7XdAjX+b6cUlXMvC9RloTjIbeSfx9CI8FVIxJ0Etxf8oYFyU9IqaJS84LG1CEfnPEnFbXd8TNNAVSU1mMVGLICEkfTkN7diqL8Rga6Mv8garBxPUFblhDoRNTk/+RmNRoIY0khl8idkDboG5xJ2XLVGiLNXuB7eJGX4y6E8NPL6FyEKezFPxSwLWIUx3PF0uLYRkj7pRbjV3Ssz2e+FPY+peL4RK/rdFLvLGGwvaDirIMmg/NgeaKO0fEFt56GWwNBT/1LBTXFtvkwsdys5R3Mn2YJVLp9zxxx5RMJtM0fwGLfPkVMO8IyQAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHIAAAAYCAYAAAAmsqlBAAACeUlEQVR4Xu2Yz4tOYRTHD41GKfJjYWGjCJE/gYUUNTvZK0mTnbIQIlnIjyFZWBIjZEGzGgtldmNhoWQnFlJi40dKwjk95zFnvjNz3+dezz3vfev51Lfu8z33vd977nO797kvUaFQKBT6wFrWOjRbwCunK7j1e4v1R3UUajnxyukKfel3C4XAISxkxiunK7j3e59CYNt45XQF934l7DuaLeCV0xVc+r3EOqvbEnjS1HLildMV3Po9zvqp2xtp5oU8/G+PPHjldAXXfg9ROPhS471ULydeOV3BvV858Id5vB/gCSOsC2gmkppzXv3PrOVQGyRS+83CHgoHPwy+eGfMeBWF755pajaRqTmnaGZZvolavHtbJrXfbNyluRdrg3r2kRB5Rs0mMjXnDeuXGUtdngKDRmq/2bhOcwPvGG/cFqh6IrezdqOp1M2JSH01eFU5kdNoALsoLD6qOIEGsJe1FU0ltd8rrI+slaz3rEnWQ63VYhnNDtyn4+jhychEXgQvYn+H1M0RpNkXaFJ1jvCIQv0BFgy9jiEXVerHsKAsoupjpPY7yrrHeqdjW6uN3J0x5Ih6v3Us70aLTORl8CI3WK9Z67Gg1MnZxpoCL9IrJ97dVQulm7Twk0XYzHqLJvCYqvdJ7VfGS3RbztlO5G0Ki6OF1BiZyDE0DXJx4kk1ZQWFP5cjO8x2JEdODp6j0QA7cRPk9Ge6TORVNA3x47cp8sh6xTrAOsi6xlpsd1D+NycXjR+DiiyAvplxPJ68N1vjC4Vvu0+sr1ATZHGwE82aSEZ8HEUhOXJy8IS1Bs2anGPtN+OnFG7kviJ3lwdeOb3oteotFAqFwuDyF3h60FSEuCdGAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAYCAYAAAB5j+RNAAABzElEQVR4Xu2UTSsFYRTHj5eEUl4WSllYsFGShWThbSHZWFlZ3ISSlShh4QMoScnCRlYWFkoSH4CShZWEJBYKCykWkpdz7jwz98x/5o4ZdO9d3F/9m+f8njMzTzPzDFGW/6UbRYppRGEzyplGmQa+UFRz7lCmiRoUstpClJlAK+cNZabwTpnxrfkir7QIpaKXs8opNXU/Z52T53SEo4GzwSkDn0+Ja7soIZ/doXjlVHAKyOrb43Rx2k0dFjlngfzPk/oKXJxO8jbbbHHqVS19D2r8oeZ+wr7HmhrbSD0GLs4geZttZqGWvmEzjvpKO8xRrnGufJNxOco5xCj54jTNFK4viGKyrqHfxo5xvrRQwKRin8L1BbFE3mtI/QTOQXYOnmAj39eNGUvPvZqrIu/vZw5q5Iy895J6ApwLaZDdiIhf4dSa8TXMaWTziNsFr1km93lHps5VzoM0TKJkDsmaOzC1PH6pb52OBOWcR/IuGjklq0dyYo6BTHFeUP6SZxQK2ZkaWdgmOF+kUf7Uf6GOM4DScEzup7QIdSA9nEuUEflEobjgzJjxEFkLS/avrEQhzHNGUEbA90eqGOdsc/pwAkj6RGMoUkwbiixR+AZQq2Sm5LSPNAAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAtUlEQVR4XmNgGAWjYAiC5UB8DoifAvFvIGaFij0H4stAXI5QShhMBeLvQPwfCccAsRIQv0MSIxqEMODWBBPfjy6BC/gx4DbsDgOm3DwGSJBgU8/gw4CpAQbOM2CXc8QiBgb4DIOJo8vhNMybAaFBDUncBIc4CBBlGAh/A+LXSHx3hFI4IMowGDBAYmMDJBlGCGA1jAmIfaESIAziEwKGQNzNAFFvBsQ8MAlQtkEOLxAm5MUhBgBCB0cnbmaoFAAAAABJRU5ErkJggg==>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAYAAAAaCAYAAACU2C2oAAAAUUlEQVR4XmNgGLJAAoj/owuCQDcDDgmQIIpEGZIgCJ+AYoZ+IN6LJAHigzAYZCBJoADSJdJwScTjknBDk5BFkmP4A5X4C6XhwBFJcimyxOABAH/MIzdDcAblAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAAAYCAYAAAD04qMZAAAEGklEQVR4Xu2ZWahNURjHP0PIECFDRAlliAeZylQ8KFMi04MHMpRZIlKmB/PMA8KVIZQiyosH5MFU4lFxr1mZSUKG73/WWnd/+zvDXvvec+/d53Z+9e+s9a21z9l7fet8a+1vERVJAk1Yn7WxSPI5yBrI+qcbihQGdajovJwMYE1kTWZNYU1lTWNN91Q/CnOX9YXVnXWD9Z3VIdTDnypzXjtWR20sQOaTGaC/rF6sHlY9rXqz+rL6s2aw9rN+2mucHHAmgG2ILc9kXbbluOTdeScouOnlqq1QeUHmeY7qhggekLmugbLLAcc/Ef9mx48ceiv6gbjOe08e/TEz0am+bihg3ITsohsiwGS+KOpzWNdEPXIwcxDXeeCcNmjQIe6XJp1OFDgwLvKal6zBttyS9YdVj8zOMS4VcV5kf3TAQlzbOEzm2d7ohhjowcP6eFXZfPjF+kgmFH5ibQo3Z0X/foodrI22jA5rRVttAmsPnq9Q1vPmrOOsuWQ2WCHnrSYzC0A3CkJLw/IetQ/3jE11Q8J4zLpny0tIhX0svqg0cgbmkbUlhSOsk1mEzUQJ6xiZnST6jkldlZvhpAYigTyl9PtDHZGjvKLjf6iDAHk4X3xnNOI8fq+9bqgGbpH57Tu6IQG0InNv85QdtnUojLaVTB3WKxvQsyAbiNF4IfbF93urAvw2siRJ4zalj4tb0lJR8oytSLpamwyjYALrobJlYzdrrzZmoRml34MGm6htMTTOXBZJCzK7vCSCMdHjckraDsiKRXY4bT/dF+kvHMp6RSbDgDUHyH4ym7CCdYVVSuFU0haKn/XIF/rZ49Ca9VwbPRlLZpLlAvf2O4MNryUpsIbJB5hk684m2/SDzmZdF3W041/kypKFFGQokGaS7bjBmsif4sW6rjbGoA2lJ6yjwAs9Xk+wxkY5bw2Fx+m6rV8gkxBIMdIaoQXWhvUKdfyYQzskUx1JX4Qivd7JvrMof6mlivKMTLYlDn20oRJgjY1yHkDkw/hgPDtTsOa51zovxpN5fXBg1ulBd/VdrH3CjqMS2beMgmw8dqT6e6qas2SOheIi7/MJpU/QOPg6Ly/cpCBrvsp+yodBSNxsywhHbVmNWYOsTfZ15UtkQkMJ+aeFKguOe7CmxwWO2mDL2LghbGH2u8iEs8E9SpjEO1nbKd1RcB7s1QJCTBkFGxiAM6xvrA+sEcKOnd59Cr9q4HwMmxpskDB47r0KSVkcalZHGg5hp1QbI0DmCZMtU3TIZPMFzoNji3iAjQkGGxPtHZld8GsypwMQyrDhtcE5S0uylXVI1EexVkZIAufhn1nEA0QDbMYWs5aylpHZ9UnBhjbkD9FvEZldMq4bRmGcM5G+qghwHkJrkRrgPJkTdn267sNXMhEAx0BYdirEf5D8KoU01ffsAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAAxUlEQVR4XmNgGAWjgEpgORCfA+KnQPwbiFmhYs+B+DIQlyOUYgdTgfg7EP9HwjFArATE75DE8IIQBtwKYeL70SWQgR8DbgPuMGCXA3m5EcbxYcCuCATOM+CWgwN8BsDEkeVkgJgLic/gzYBQpIYkboJFPByIOaFicIBsAAh/A+LXSHx3hFKGfUDMDBWHA2QDYMAAiY0OVgJxBbIANgPwAZi6KyCCCYh9oYIgDOITAiB1IBdygzigJIvsf5gkPgBK7mDNAw8AHRVD+x0JyMYAAAAASUVORK5CYII=>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAZCAYAAAABmx/yAAAA00lEQVR4XmNgGNkgBog/AvF/IF6DJkcQKDBANJqiiRMEmQwQjSSDlwxkagRp2oMuiA0cA+IXQPyPARI4II22KCqwAJCiOjQ+QWeCbEFX9AyLGAYAKXiORew7mhgInARiPhDDgwGiKB1FGiLWgCYGAq0wxjIGTCepQMU40MRRwBQGTI1LkMSWQml5IN4HxHOhfAZuBlSNwVA+TAxG3wZiISD+C+WDgTMDQnE2VAwUlyA+SDEMgAImAolPNED3ElHAgQHiXF4gFkCVIgx+APFydMHhCgDsADVjjSCH1gAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAYCAYAAACSuF9OAAABo0lEQVR4Xu2VTStEURjHHyXkJbLwElmxkC9gQSkbGyws7CxIFqykRBZiwULkZUumUHbE0kJ2ZMMXYCM2FpIUefk/nefMPPPM3OnazNU0v/o15/mf07nnzj3nXqI8OUgdbLRhFMTgjzhp+iKjldyCCm1HVBySW9C/gRfzZsNsswIXpM0LmlN9WWUGfki7hRIbujg+IouMkrt4icpuJYsEvvBjmuzdZEyZDTJQboMAFsldr56LHinG9AjJ5k3GhP3XKuG3DTMQn/dAF0KzZPoRMv3wxmRBrMF1GwZQQWoNW7oQ9lS2L79+k3s9nfABXsEdyfS4J8mYKXgK7+CJypfhti94T+gLDEjtM91nFz4Cz1XN/Xy3vq2ZgEfSLqLk/k8y38tuSixiXDJ+/lxX+0FSa9LVbbCKUvePHjsMz1Rt5wlFH7lXgaeGUify9SrcUHmD6mPuYYe0+STaeUJxAQelPS2/eiJ+HEvS/oK1sBS2S6bH+vYxnIW75I7+n2gid2d+kzND8BU+wy6V98JrSn5tbJLb+HyI+NBcSl4AXyjCT1Se3OIXBf1ox7HO5goAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA4klEQVR4XmNgGAWjYAiC5UB8DoifAvFvIGaFij0H4stAXI5QShhMBeLvQPwfCccAsRIQv0MSIxqEMODWBBPfjy6BC/gx4DbsDgNuOazAhwG3hvMMuOWwAnyGwcSR5cKAmAnKdgVidiQ5Bm8GhAY1JHETLOIFUBokNgPKBkWgMJSNYhgIfwPi10h8d5hCIFgPxKpA/AVJ7BcQS8A4yIbBgAESGx0sBeJqJD5K8GAzDB8AqWODskF6b8D4oID0hSoAYVjA4gPIlvYzQBL5dRAHlG2QwwuE8XkRBOCBDQW6aPxBBgCaBEjvdUDvwgAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAaCAYAAAB/75arAAAAXklEQVR4XmNgGCCwBoj/owu+xSZIHOgE4gRkgR9QGmSeI4gxE4iZkARdQYxaqEA/VBAFvMImCBIoRBbIgwqCgDBMECTwDsp+DBN8BsSHGCCWZsIEQSAAiMWQBQYRAAD9NhVAnbARcQAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAYCAYAAAB5j+RNAAAAqUlEQVR4XmNgGAWjYBSMgpEBdIF4HhBzQ/m8QNwAxBOAmAkqNiCAHYi3AnE0EP8H4mYgXgCVq4eKDRjYC6VhjmtEkgOF4IA6rhRKX2PAdEg2FjFswIQETBYAOeIYmthHqDgh4EcCZobqIQmAHOGBRawSTYzuIJwBM4RCkcSEgHgKkhxdwWUGTMdtQRJ7gSxBb/AHiCejibEyQBwHwgJocqNgFIyCUTBUAACR9iVxcbJXzQAAAABJRU5ErkJggg==>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAWCAYAAAD5Jg1dAAAAVElEQVR4XmNgGJqgBIgz0QVhYDkQ/wLi/1CchSqNHQwVhdnogtgASGEuuiA2AFKYjy6IDYAUFqILYgMghUXogjBQD8QHgfgLAyJ2jgHxXmRFIw8AAJc8F2WkjIZ2AAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAYCAYAAADtaU2/AAABGUlEQVR4XmNgGAWjYBSMAgrAciA+B8RPgfg3ELNCxZ4D8WUgLkcopS6YCsTfgfg/Eo4BYiUgfockRhMQwoDbApj4fnQJagB/BtwW/2LALpcFxMVoYsSCPhjDlwG74SBwgAG7XBgQc6KJwUAFugAUpAJxNAOSWT5QDrrhIABKdLjkcIFedAE0ADfLG8rBZjhM/DCSGMgxX5D46IAsi0EpGZSlmBiw+xaU9UAAmyNhgCyLDYD4I5T9BojrYYqQgCcQX0fig7IjMv6Dxs9DKAUDrBYTA34AsQy6IBIgy8fEAJi6OhRRBCDKYlDRCLMUObjxgddA/ABdEAngsrgKiD8wQKKQwQOIbYDYAogtgdgBiAVgKskETegCowAAbPBgBwkpZAgAAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAaCAYAAAB/75arAAAAZUlEQVR4XmNgGCDgCMS26ILfgPgUuuB/IC5AFtCHCjKBODZA7AXEu6GCviDBIiAugQq8hfLhACSYiyygCxVkRBbMgQqigNfYBEECm7AJWkDZGciCIGfVAfEKmCAIgBwtgSwwiAAA7HAW64NYggAAAAAASUVORK5CYII=>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAYCAYAAABwZEQ3AAAAu0lEQVR4Xu2SMQoCQQxFowhexFZsLD2BoDcRRDzGHmVbK1ttxKtoKVppQmZhCbOQ4AdF58GHyQ8DD2aICoUf4sY52fJTPDlrWzrZ2eIdJqQyfbtwApGZceacPanMIs1RIDIbzpZU5JJmSRSITIPIrGwZACYzJpXp2UWGaUeOmU4S/oM1qYyHZUfOmU4y1Gt+RORqyyCwZxIZ+cQNh9bZC1RmlM6P9iIATKYiFbpzBmbnBSaD4KtkCoX/5gWtkyY65t5R+AAAAABJRU5ErkJggg==>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAYCAYAAADOMhxqAAAArUlEQVR4Xu2QMQ4BYRCFn8oNnELhDKLVu4sLKJQqZ9GuQqUiOpVOEBIRK7wx/59sntlOJb7kNd+b2cz+wO8xZk7MM+XK7Jl7xYXUlTMVGRsuVJKuCmMAX+hpQaYqjBXic4zQR/d3mJLZin9jw/YyC2bJ3JJrVocy+X79uXXyH2wQFyO4b2kR3W9c4L6hhcm5StR8aJhkXwvIwoQ5Mwf46xyZRy4TbfjCTvyf7/ACnaU1cNthUj8AAAAASUVORK5CYII=>

[image18]: <data:image/png;base64,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>

[image19]: <data:image/png;base64,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>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAYCAYAAACSuF9OAAABkUlEQVR4Xu2VzStFURTFt0TIHyBkxNjEgBQGBkoYECMDUYz8A1JITI2QkuRjwMRAUpRkKjGimBERZcLAR6zd2Y91z3vpXYN33+Cu+nXX3vueez7uueeKxIoVK1b2aAT0erklL86Y3u36BRrM91s8ZnHGtAiKzesAGqn2KREMaNSuM+IGxJoDZeaXJbmeribFta31C39JG9x6uXvy7eCC4rAKPRlt0OHlTsmfgB6KwyrUgCokucEwKKVY6+vGOOULwBNYleAK54A7sCPudR9YvhlsgQGLVW/kf6QdVpsvBFdUU/GAE14/Bs6vgSnznNcOm8zr8dIJziyuA9fmA2oV9xBl16u1gEuK9Z588AG6KK8z3wQrEpyQv/qvoNL8PhiiWlrS19RHcaIDvyONq+zKh2yq+1L5tKX7qdv8Nhg0zw+rAY/m98TtS9UsOJLgB5Fop/vsXwNSPYNz0Ea5EnEPPJbgAZor7lB9AEXi/gQLVN8Q99UeghvKR6IJ+T1sX0A51SKRrmgemAfTXi0y1fuJrNU31j9cgK20Dx4AAAAASUVORK5CYII=>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAA4UlEQVR4Xt2TPwuBURSHjz/FZJGMSlZfQDZhVgazwcAiow9hNJmUxSxWq13ZfAsKid/pvXH8vHgZPfXEfe55r0sR+VtasMsxCHF4gWlYhIfH7c/owwVax8z6LTN4oqYHlKn5khRvuEZdW4+aL3Pxhi0516rUfdHBMwy7dQgOXf9IVLzBLVwatQU6oCneYIa6tg21FUxQk4k8f9LYp72kI8/DutabWSq0vqFXtwcM4N6slbV7PT5Uww7WYd+9ZxqwDRe8YSnBFEeD3lL/Kz8RkfvX5N8mEHk4hSPe+IYshz/hCiPZL37D2v3MAAAAAElFTkSuQmCC>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAZCAYAAABKM8wfAAABTUlEQVR4XmNgwASngfg/EB9FlxiM4A0SexEQ/0biD0oACtkOKJsRyh8ywJQB1cGToHx0PGgAKDlEQdkrgVgEiOWAmBOIC2CKBguYC8QR6IJAcBFKX0ARHWCQBMQWULY1sgQQfIbSgyYpmDBAMl0CEKcC8U0kuSogzoWyQQ5mR5IjBpijC2ABGugChAB6hkIOSWT2ESDWQuITA1iA+B+6IBIYNLGGDNgYsDsMm9igAeiOHtSOhQGYo0EYVEGRBdDTLimYVMDEQL5eugOYY0GAGYk9KAG29gnVHT0RiJ8B8VV0CTIALochhzpFoIEBEgIw8B2JTSpwRxdAA6DQBzW4KAK3gVgZiU+VUKAlcGCAOHITA6RBj+z4QQvWMSCKIFE0uUEHjgMxH5R9lmEIJAl0B95ngOToQQvQHfwejT/oAKxQnwHEH4FYAUV2FBAGAKvBVcpOF/dTAAAAAElFTkSuQmCC>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAYCAYAAACFms+HAAABuklEQVR4Xu2WzysFURTHD/m5sBA2VpItSzYiKxtZWErJiixYWkiUpT0bkYWUUqSUko2SspX8AWThR/Ir+RHf49zx7hxz39O8NzOp+dS3mfmee+45M+/OnUeUklJQuqFTbcbIpzb+CieGTs6TXQpZe5WSa7ycQtYuhu4pZHIBeIKWSWo3qlhWrqESSqbxDmgBGiGp3esPu2mG1s35O8XfuFePb4DPJ61YVuxGeUeJs/F5qN2c15HUXsuE3cxCPdb1JklyreVFCb9XNlz7RHmBvKjrOZLkLuVHwTlUqjyu/aG8X5yR3LGtZ5LkMWtcFDSRPDRdP+fmUA8daRO0kCQu6kCBcTWXs3FXsIwkdqz8VmgbeoUGoSVo2DeCqBIaV14QM9CANg3OxiugS5IlEQS/lJz4pvwpc9yBpkluYisT/sYryjfpYpRkjF7bHt4cRbbJW88ddEPS+KMdJHkpvDivN97T23wjZFL+UAXRB11AKzpg4K8jz/1AMrfNhvFvSXrg9X/lG5EngT+jRRU0oc2k4PXIDXeaI8PLofpnRAbX006EBugA6ocOoX1oyB5gqIH2tPkf4L+mKSlJ8QU813OH2pbMmQAAAABJRU5ErkJggg==>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAYCAYAAADKx8xXAAAAhUlEQVR4XmNgGAXDDSShCyABGSAuRhcEgV1AnIEuiAT+QzEG+IcugAbkGLBoLANiTTSxH0DMhiaGofEvGl+UAYsiINiLLoCuKAqLWAcQG6GJgRWxIvHfAvFLJL44A6ZBYPCdASLxDEo/gtIg/AtKq8NVIwEBBoTCmVCxFCQxS6jYKBi8AADlWCC2Arrp6gAAAABJRU5ErkJggg==>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAA+UlEQVR4XmNgGJaAB12AFPASXYAU8B9dgFjACMRz0AWJBQVALIMuSAgwA3EVEH8D4jYg5kSVxg1OAPEVIJZjgPiXHYhfA/EaZEXogJUBorgIygf5dzZCGiynicRHAX+B+BUSPweIZZH4IM3nkPg2QLwRxBCGSkohSb5AYoMASH4mEt+YAao+HCqJDJD5QlA+KBwwAEwSGcxCYv8A4u1I/DdA/AeJz3AfiA9A2RlALMEACTRQSC+AioNAP5RGt4yhEioIw5uAmANFBQQIMkACGCvAMBUNnATiSHRBGECOX2wAZvg+FFEgSGVAjTJs4AYDJIwwQDO6wDAEAFTaMEPsx+hgAAAAAElFTkSuQmCC>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAAAYCAYAAACC2BGSAAAAlklEQVR4Xu3QMQrCQBSE4XcOi4CdJ7BPISGFeIFYeChLL2CRi0guYuEJFPMeK7gOxBUs838wxc5jmzEDAAAAfrPz9J6DHlDWep6e+vU+eob3GSUbSwNWWRfvS/ZGQQx2lW4pbxV/HlrO1drSIFs9FDBi5mRpEPxhb9MjdlpgWoy4ku7maaTDFwvP3dKYkfPnGQAAADMzAnkRGGg4hYoeAAAAAElFTkSuQmCC>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAXCAYAAADZTWX7AAAAcElEQVR4XmNgGAXkAn8gXgfEiegSIOAJxP+B2BHKnwrEZxHSDAyuDBAFckhiIP5pJD5Y4BWyABAoInMyGSCKeJEF0cEMBogivECJAbsiZSD+hizwFIg/ADELEBsB8Q0g3oisAAakgDgZiK3QJYY3AAB4ThMRMt39uAAAAABJRU5ErkJggg==>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAXCAYAAACyCenrAAABZUlEQVR4Xu2WzytFURDHh41kR7HwN9BLIoWShZ0ibCQ7WxaiLGWllPwFspGdlYWVsmRnZe8fUJSSH/Nt5mrudN3rvvR6p+ZT396bzzmn7pzePecRBUEQ/A89nGvOF+eO05EfLmWH80my9jQ/lCaDJM10a92ndefPjN955EyZ+pVkbdKgiQvn7jlvzhWB5u0GbGp9blxyoIEV5/bUV4E52NCMXXVHxiXFNEkDk86vq+91vopnknV1zqC2YoukgRHnl9WPO1/GIcmaIT+QEvskTQw7v6B+1fki+jnHnFvOE8mhnCwbJI03nF9SP+t8FQck6/AqljFaIy0lO0MmnF9Tjyu5Djg7sA4pY75GWkoXycM3c8tgEzFnzPm/bEhbg4c/ce5KvQUH7YCpH0jm3BgHkt+Qol8D6kVTF70KuJneTQ3OSObMOZ8c+Gf5oZ9oCNex55Kz7Vx2Pb+QrMf3mdyMIAiCIAiYb3syV8d4kVvuAAAAAElFTkSuQmCC>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAVCAYAAAB7R6/OAAAAoUlEQVR4XmNgGJxAHl0ABk4A8VUgdgPix0B8AFlyLhD/RRYAgv9AXIqVAwUzoOIM0lCGJ4o0A0MOVJwhAcowRZYFggioOEMBlGGEIs3AEAoVZ2iCMvRQpBkYAqHiDGlQhgGKNANDCFScwQ7KsESRZmCIhYozsEMZYSjSDAxVUHEwADEmIeTAYBtUHAxQVEMBiB+ELLCcARLcIBokCfI+PQAAUGAnxYvZp3IAAAAASUVORK5CYII=>

[image30]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAVCAYAAACg/AXsAAAAs0lEQVR4XmNgQAVzgPgsEC8G4nlAPBeIK1BUEAFeAvE5ID4CxIeA+BUQC6KoIAJcQmKzAXEtEp8s8BWNPwmI/2PBOEEcEOsi8VcCsQgQywExJxAXIMnhBLhsuAilL6CI4gC4DPkMpXHJw4E3A3ZFVUCcC2WD5NmR5DCAPQN2Q5DFQElAC4k/XAF6IiIFD0FwgIFA2iAEFBkgfqfIkKMMFBqyA0qTbYgEA6JIINsQ5CyP0xAA5pI1KpwC9w0AAAAASUVORK5CYII=>

[image31]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAVCAYAAACQcBTNAAAAd0lEQVR4XmNgGJRAB4j/Y8HzkBWBgAAQN0PZh6B0NpTGCUSB2IEBotkcVQoT3IDSOUCcgCSOFYDcCAKJDAjnYAUg0/KhbG4gfoCQGpQAPSKw4QEAjAwkWP2FgUjFGUBszECk4nIgNmAgQvELKE1QcRgQs0LZGIoBStogeWHgYUgAAAAASUVORK5CYII=>

[image32]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAAAYCAYAAAAI94jTAAAC2klEQVR4Xu2Yy+uMURjHHyRJSiiK+omydQkRQjbkLkXYUJIFsvmxEMUfYEMWbklYUKxYUG4r1xQlNhJC7gv3wvc755yZZ56Zc2ammfr9Zjqf+tZ7vs+Z98x5n/c973NekUwmk8lkMplMJpPJZFrEWegB9Br6A/X33hvoEbSz1LUlLIRuQ8+h797bBz2F3kEHvNeJ3IKeQV+gtdAK6A70EzoDDSl1FTkE/YD+Ka2HxkKflNcq5on7c3o8Jr8Luqi8EeEHHcRVKZ/3BWgStEl5u4q9wSoVsAT/mg00STjvcOP/UrFOJMztoPGPqliRZdVMz2+pjA2EXkEfoCnKb4RYYvaomKYv9MR47UgsMf1UbE0wlyjTcl0qY/qYyRmk2vUSS8xc71PjvHccmu+9dieWGBJip4KxWJkWFgU6xiS+LIVlP3RCtesllhi93lqqee1GPYlZHYxFyrQEnxUFOQ3dL4VlG/RNtQmXuu3Gs8QSkyo4qnkBLoEppkKTrWmodY7l0ChrKvpAu61piCWGBVCI8TwFdGJ4YVgyc023Twu5Iq7cDWyRygsWfjPN+JrQhxrpPZbKwSsrHT12nACrG8Yu2YDCzsNyV1w8Va7XOsdHcfFuG1DoeS/13mzl7fBeAZ2YidBXf8z3x17VjxyB7qn2VnEFgmaluKSeNL4mjNcFPfTH3Eed150MsYsyFHov8TjhtoCKMVpcQcObMsY5ST8RE8Ql54UNKMK8+cQcU+2b4laaMlJLmWWjVL5jeFLLYElvTsN4dilLUev/8YbqDVy2hkInpiaNJIbofo+hMaodSD0tpNWJGQ+ts2YPsEHc0xej7sTw00voHMTlLMUs6K24guCwiZFh4na51dgsleNxx5+CXyY+i1ta+Q68UR4u8NcaPQSvSww779SNJgvEXejp0Axx+4hqL95GGGANBT/1zBE3Fsfki4/HzVKsZHox3IuFec8Ut03JZDJN8x8ryvmBqPBagAAAAABJRU5ErkJggg==>

[image33]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA2UlEQVR4XmNgGAWjYAiC5UB8DoifAvFvIGaFij0H4stAXI5QShhMBeLvQPwfCccAsRIQv0MSIxqEMODWBBPfjy6BC/gx4DbsDgOm3EcglgLiOWjiYOADFcSQAILzDKhyXkD8BSENFu9F4uM1DCYOk+MH4sMIaYafQHwQic/gzYDQoIYkboJDHBmA5GSRBZANA+FvQPwaie+OUIoCDgFxJrogsmEwYIDExgZqGXBYgs0wfMATiLWR+ItgDCYg9mVAGAbi4wOKDKhBAsKgdAoGoGyDLknIi0MMAAC6dEuguanWFgAAAABJRU5ErkJggg==>

[image34]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA8klEQVR4XmNgGAWjYAiC5UB8DoifAvFvIGaFij0H4stAXI5QShhMBeLvQPwfCccAsRIQv0MSIxqEMODWBBPfjy6BC/gx4DbsDgOm3GEg1gRidiD+gyQOBj4MmBpg4DwDqhwzAyRsYWABEIcj8fEaBhOHybUA8VWENEMpEN9D4jN4MyA0qCGJm2AR3wTEp+AqGBiyGdAcgWwYCH8D4tdIfHeEUob1DKiGZTHgMQwGDJDYyKCdAZL+YKAYiJ8h8bEahguIAvFPJP4cIC6CcZiA2JcBYRiITwi8BWI2KBvFAaBsgxxeIIzLi8jAAYjj0AUHJwAAA45OyTnLXQcAAAAASUVORK5CYII=>

[image35]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAA4ElEQVR4XmNgGAWjYAiC5UB8DoifAvFvIGaFij0H4stAXI5QShhMBeLvQPwfCccAsRIQv0MSIxqEMODWBBPfjy6BC/gx4DbsDgOm3CsgVgZiCzRxMPCBCmJIAMF5Bkw5EJsRie2PJIfXMJg4shzMIBAAiTMh8Rm8oYIgrIYkboJDHASaGCCxz4smjmIYCH8D4tdIfHeEUhQgCMQ/GfC4DAYMkNj4AEjPLWQBbIbhAhMZUNWB2AdhHJATfaGCIIziZCxAEohXQdlcDBA9IBoMQNkGObxAmBgvRgFxNrrg4AQAm2VLAOl9sDgAAAAASUVORK5CYII=>

[image36]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAAYCAYAAACsnTAAAAABeElEQVR4Xu2WTSsGURTHT0gsLKy8ZYmUrCyQFAspZSXbIcnLwkbkE1jY2FtZ+gZ8AtlaWbCi7JRCkcL/NOd67hxzp+ZJT92591e/uvd/ZmruaebOJYpEIv/MnA5CZxMe6DBk+uGjDkPnG7bpMGQm4YcOQ+eT4l7yB/502lXWBy/hHXyBvXAbXsv8BDb/Xl0xOihtiqYHXlFaMx7DQXhoZbPmhioxQ/lNMZjFL6n8xqpVjlUqXpirKdNWrdvK7yU7s7IixkrYMBKqrylNVm1NsrdamW7hgzV3sVjChjFO9TVlwKp1ScbjeRlPyNxLOqn44V1NObdqeeyRu+YF/PCtOhTMwtlRyRIr4zctD64N69AneAG7OhTM4pfhhYy/KH1TXPBZZkSHvrEPX3UomKboz8fFKdX2GFejvYEX3qJDKteULbgDV+AGfM9UPYT/GvwbNQxRdj9hn616Hvr6p2zZT47guoz5+M+nXf618mY6BRekFhyJDiKB8wPE+WqYWJ3+JwAAAABJRU5ErkJggg==>

[image37]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAZCAYAAAA4/K6pAAAAuElEQVR4XmNgGAWjgIZAEF2AGDAbiP9D8S8kNiOyIlzgCgNE8WUkMZgBZUhiOAFMcQEWMWskMaxAmwGhmBVNTgSNDwJ9QMyFLFDDgDAAH0gF4mgGiDoUA0KgghgSOABWdTADQM5DBs5AfAdNDKsBoVAJEG5hgESdE5Qvh6QOBEBi3GhiYADStJcBYdBtIBZGUQEBIDledEFSAMgAPnRBUgDIAAF0QWJAFRB/AOI3QPwWiH+gSg9ZAAAuWC7ppd+G4AAAAABJRU5ErkJggg==>

[image38]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAZCAYAAAA4/K6pAAAAxUlEQVR4XmNgGAWjgIZAEF2AGDAbiP9D8S8kNiOyIlzgCgNE8WUkMZgBZUhiOAFMcQEWMWskMaxAmwGhmBVNTgSNf5oBou4osmANVBCE8YE3SOxFQPwbxglhQBjABRPEAkDyHVA2KGBRLIQZ0IcsCATOQHwHTQwETBnQDAiFCoBwCwPEBicoXw5JHQyAnB+FLgjStJcBYdBtIBZGUQEBc4E4Al2QWJAExBZQNsHoRQcmDJBATADiVCC+iSJLBIB5DRkPBwAAjrg1UNNQRZYAAAAASUVORK5CYII=>

[image39]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAXCAYAAAD+4+QTAAABLklEQVR4Xu2UQStEURiGv5KVYqOUlbK2s5+F5F+YYoWIGguL+QWs2FCzUyz4EfwCWcuKQnayQni/zrnu8XTHzKmrLDz1djvP931z5t7OvWb/fGeSom6mlCXKXrQsb+iOIjKh3CsfhThWXqLwLBeFPniiEPvKK2VKziYLygycr7/+fTdyNnmnsDB/RUlyNrnEetjC/F5czymDZbmk3012lXE4PzA+v6WcKkPKWdpQ4E0rlBVUPfcDKw/Pj3jDKiUYUQ4pxbaF+SMWiDetUYJzZYBSNC3ML7JAvGmdEnR7HH6HXuv5MnvTBmXCtLJJmeDzHcqUUQtNOywkPFAAf0Er7/REeVRulZt49R/zTw15pqjAj7dvdB2vWcwrs5R180bxG1xQ1E1bGaOsmwbFn+ITmvJCv11yElYAAAAASUVORK5CYII=>

[image40]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA9CAYAAAAQ2DVeAAAD1UlEQVR4Xu3dTchtUxgH8OVjIlPlYsQtrm4yIV8DKSkREwMlUsLMQMnkZmB0B0pMfcQ1IglTEhlIJOqWmLxxUz6HRBJrtde6Z531rnM71333+djv71dPZ61nr3POPrN/e5+9dwgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwPR/G+j7Wn3n+cay/Yr0T68rcW7XbYx2P9Uusb2I9nV9/inVbtQ4AYN/4N9eTVe+H3Huo6q3SiTDbr1qvBwAweb0QdNaC/sFmPpavQv/7S++tpn9BMwcAmJReMEra/oOxrm56PQ+H2XtPVXeUN3R8EXZ/f1J6f+f587HuyuMj+RUAYHJ6wSip+w/EOprH6ejb53k8lvT5vf0qva+reb0NAGCSesHoutz7rekn18Z6pm3usc9Cf79Kr1x80Aa2tG8AAJNTQtA/eX6o6vWU05FjqgPbgdx7Ns+/K4vyvB7fW80BACajBKOLq3E6JXlJvSh7KawmFNWB7cv8moLi9fWi3K/HN1ZzAIDJONXRtFq6X1txrBqPYdEp0VYb2AAAtsq3baPj7DALRmm8yKVhti7VPfOb91S5qKF8V5ov8mmYnTId+0IIAIA9t8wRpzqELbN+FR4N8/v09vzmXdKtRh5rmwDA9ns9DI9gSoEgnX5blfTYpXRUaCfWH7Eui/V+rN/D8Kf6vbQpAQwA4LSlIJOuiDwcZnf0/2BuxXhuCcOpynL06Ocw3KLihqp34cnVZ0ZgAwC2UrqvWAoy5+Z5+Q/XeydXnJ7XFtSrsV6J9XKsF2M9l9cXJZzVyhG/tv9/7dXnAACsVC8QlfBWpBBX7qQ/lt5+PLWgf2cz70nP+LymqfQ5bS8VAMBG6wWinmXWnInefty9oP9RM19W+zkAAFuhF4h6llmTpNOYy9Sv5Q1Zbz/SadReX2ADAPaVF8IQZN5t+u3jlsYOOyWY1fcYK730v7eawAYA7Es7YRaQ3mi2JWOHnfLdj4ThitU0fnNuxYzABgDQMXbYKYFtGQIbAEDH2GFnFYHtnLaxYveF4TeeCLuvxAUA2FjtY5eWDW3b5FAYftd5eT7V3wkAsLVSOPukmu/E+rGaAwCwZimwXdU2AQDYHCmwpduVpHvPpfHR+c0AAKzTRWEIafWFEumUqP+wAQBsiPPDEM4ur3rlGalXVD0AANaoPZr2eO490fQBAFiTNrAdyb2bmj4AAGuSwtn91fx47gEAsCEOhyGg3Rzr1jw+MLcCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACbpPy0JFfum28owAAAAAElFTkSuQmCC>

[image41]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA9CAYAAAAQ2DVeAAAEBElEQVR4Xu3dS6hvUxwH8EUm3IGBgXvJxICrSwzkkSIlJQMDQykRUkYkExFFBuqmGIhEJh43YSaP3AzkkdCVmJy4Kc88ii4S69de+/7Xf519joOzz/mffT6f+vXf67vXv//6z37tZ0oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwPW/k+iLXoTJ+M9dvuV7MdVrJNtpluQ7k+jbXp7nuKZ9f57q0mgcAsG38Ver2KvuyZNdV2UY6mGbrqg1lAACTN9QEHbFCfkIzHsuHafj3++z5Jj+uGQMATMpQYxTa/Nby+XOVDbk+zb67Wl3ef2HA+2n574c++6OMH871Q8kAACZrqDEKbf5A+dyX68wqH8N7afnvhz77pMr6o4EAAJM11BidW7Lvmzy0c8fwbhpeV5/VNx9o2ACAyeuboD/LeHeV1c7J9Uiu15p8DHXDtrNke8v4835SoWEDACavb4zihoJ+O05JnlhPqlyZ6+Y2XGd1w/ZB+Yzr1s6rJxUaNgBg8oaOprUezHV32Y7Gbn+1bwwrnRIdomEDACbtyDRrjGJ7Jbty7Sjbb+c6ptq33qIBq286iPFKzsp1VermjX0jBADApuiborUczTop131p/Dcg3Jjm1/TC/G4AYLt4JnWvYIqGIE6/bZR47VIcoVrK9Wuuk3O9muuX1F1UDwBA6pq0uCNyT5pd//T63IzxXJzrszQ7evRN6h5RcX6VHX94NgDANhTPFYum6Kgy7q/heuXwjH/nqRXqyVxP5Ho812Opu2i/NnQKsj/i1+YAANvKUEPUN2+9H1M3594mX09D67hzIL+/jNeylrPXUBv1LlAAgP+sbYha71TbT6fxXio+tI4rmjzW8nLZjrX8XrYBACZtqFGqxSMienel7pqz1cRpzLXUd/0XiqF1xGnUOo+13FG2Yy3tfACASXo0dY3PS00eT9FvxZ2bY+kbs/oZY30W1721Yi0PtSEAwJQtpVmD9GyzL/yU69g2XEf9b9+QujtWY3vf3IyZ09O4awEA2HI+SrMbES6sd6yj+tTnaqJRi1Ol4bl6BwDAdhWnKK/NdU2um9Lqr2v6P9bSsMVaPk6ztRya27v4+ldGHUzL78QFAFhY7WuX/qlp24p2p+5/HV3GU/2fAABbVjRnb1XjpVxfVWMAADZZNGxntCEAAIsjGra4/i6ePRfb8bYGAAAWxK7UNWn7qyxOibqGDQBgQexIXXN2SpX170g9tcoAANhE7dG0W0p2W5MDALBJ2oYt3oca2QVNDgDAJonm7OpqfKBkAAAsiD2pa9AuynVJ2d45NwMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJulvPwoPrkzh5NIAAAAASUVORK5CYII=>

[image42]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAYCAYAAAD+vg1LAAAA7klEQVR4Xu2TvQ4BQRSFb6JSSbQ6iVKjwitQeQKNXnRegRCVRO0xVEqtkqjFXyJE5+9cs2EdIzsbkSh8yZfdnLtzZjLJivw4Rdjg8BPisAZHErI4AauwB5O+PO97V4biWNyHFziFBZiCXTiHOW/mx6lYF51hjAegLmY+plyLm5Q9cZTX0zA6L1GmxS3K7mzFLIrygLBtrMVtDpW0mAUTHlh4V9zhUDmJWWC71yB2cAPXcE+zW6ntJB/zleKImNIFDyyE3tzlxFlY5jCImZhiPb0NzZccuqLF+oNweQauKAvNQB7XcvCelacv/vz5Pa6o0Tl8A0nhoQAAAABJRU5ErkJggg==>

[image43]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAAoUlEQVR4XmNgGAWjgEogD4jPAPFjIP4FFVMC4ptA/A2ItwIxE1QcK0gE4mdA/B+K9wDxEiBmBeJVSOJ4AQsDQuECJHFGJHGCAJdCXOJPgbgRWQCXQlziGACXQmziMkDMhSaGVSEIoIuHAzEnsthMKAcZ1wJxNxbxHiDeB8TMUD7ZYCUQV6ALkgJgtl9BESUBgAwwAGJudAliASiVkq2ZugAAdAs0sbgfemwAAAAASUVORK5CYII=>

[image44]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADkAAAAYCAYAAABA6FUWAAACYklEQVR4Xu2XvWsUURTFrxI/EhFNTJMiFhFEQQsRkhArIYr/QKoUwSKgjY0iamFlpSiIpNaQxFZEFEHBoBZKwCKFjYWdFn5jiKiJes/eN9nn2fdm325mxY3+4LA75915H3fezNwR+c/K5iAbTUqXajWb4IjqFJtNzE82ulWvyFsrFpiqQTttWXCfeXrszomB+f8GTlpP3nXVU/JuisV2kg9vFXm1sl31XdXqeXvE+r7ieeCl6gR5uQyovrIp1jmTZZEJebXyTNVG3g2xvjvIv6DqIS8XZI/vxTWqq+QBDLjIphSzyB9sSDypj9ioBjrxtwjYSccg2zqXuEE5xkYd7GZD4kk9ykYeGyWcqRC3xGI3c0OD2Cs23kVuqJX9kr7I2NZpFLfFxtvEDbVyWNInjrgFNhtIYUkdkbSO+sTi8FT7UxSW1H5JW+RdKWjrJJLNq5CktkvaIqttHRQHqEC+iD0wrqkm/QDHWTYi3JP8pJ5RTat2uWMUIu+WWgOgs4oSyMMv72Lcd78nVQ9Ux1Vvy80lshf7HfJDVBtvn1gVdNkdn1ZNlJsrQWeYFIP74ZNYhjDhj2JXCi9tvHpCvFb1sulA1fJG4pPH+/Cz6r3YeB9U884/58VloJ+slETcDq+tAmR/js06iS3AB4krAn+slHFLQS1sJrJV7PwN7hfgSh9YiiiDInyYzTrYovrm/U9a5CHVCzYTwT37XKwyGRN7IMSqlFB9Wi8zqieqWdUUtYHgR/N51SibBbPcz7GMce8/rmJoQaGat8QIG38p+HICD1VDfoNjm2odm80GdkTsKf5v8QvK1ZqzEJjkdgAAAABJRU5ErkJggg==>

[image45]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAAYCAYAAABDX1s+AAACW0lEQVR4Xu2XzUsVURjGn7SsIKNA2pREEIS7QCFpV0EEhYhrQYqCVrUQIxHcSJuE+gPatIhAaKEQtGnZLkpQgiDICpEWFdEXpX29r+8ZPD73zDhzz52r4P3Bw537nI/3zJlz3jkDNGhQDafZ2MxcFl1nc7PSLlpgM4JB0b8CioX7y9If1yYTrbiDzQi0v+GAxzffEvCKsgXWx37Pa3LerOcp90UPyavguOgXm5G8ZwM2wL9sIn5Cbok6ybsK67eX/LOiC+RVsITa5o4h0SHyjsIGeJt85TkbBQlN6CeE/THRbjYZbbiTzQgusSFMweLs4QJUPt2i6FNnQttTCdVdRSvCDWtN2gDLoBkW6xkX5OEE6jNQjfGbzZLQLavxznFBHs4je0K6CiiNY7AY41xQEl+QfU+ZDCC7cU8BpfEIFmPNZFYjorZnNyIa5yRqgAXZBov1lAvyshflD1b7zzodzou+e//1jaQHK59roq3khRjB2vnjpeixqE/0WvR2dbF1oCfGMuiH9X+X/ITk1Og/FH5AV5z3lfwQi7C6PKEJk951EofjLRv67VEr2kQ/RZ9FH5000elpuCK4cFL0zl2nHeXnkP6WmhF9gx3GPrhfXXFa/4lXz+cIbExBdDlqh+uFLtlT7npUNOGV+YQmqloewO47FQ2WZ4+WgcbWZKj8EHV4ZQnbRXfYrAKNtc/9Jqfz4Eo5I3rFZp04ANtO+mWatgqyknIR3ohewI4AuqU1qaZyE+HvkDLRfHPPXeuX6bRX5rOLjXoxwEbJ3BBdFB3E+uaxDcVhrOSQBhuF/5XCn51C4/NYAAAAAElFTkSuQmCC>

[image46]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAXCAYAAADtNKTnAAAA8klEQVR4Xu2RPQ4BURSFbygsgAVIaEQiaqWorEDUlqBUq6xAZQVqEdEpqDT+Oo1GSKjET8K5efclL3feEHTiS75izj3zMvcN0Z9XtOAR3sUT3MOrkyVt+RX2Bc2ATJ7SAx9cHOkQFMnMZnqgqZAplvQAtMnMOioPMCf/KkzYmgF8xTy8wbXKQ+ED+I9M4BSeJYu5pWfY++ALdFlI7iOhA98qTJ9MHtcDH1y86JDCD4/CrBukyRSbbijoQ1YwAmtwyUEZjqXEbuHQtoWdzPhyc7ALGzLzfWEoVdiDdSfLwIPz/BEbWNDhu/AqfDdfwz/kl3gAedVAelc55fYAAAAASUVORK5CYII=>

[image47]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANMAAAAaCAYAAAAt4GmlAAADqElEQVR4Xu2aW4iNURTHl0tEuSTjUtLgwQMPiieUXB684EFyKaXEM155mPCA4U1CbqHEA+WFokxCkdsLkktCcsktt9ytf2tvZ7dmnznnm3PmO/ub1q/+zZ7/3jOzvtnf+r6919lEhmEYhmEYnaEPa4g2DcPIzi9tGGmznfWR9dfpG+st62fgNfvBCbGQ9Z5KMf4gift74M38P7p4/Gb11GbAdW0Y6eBvQM15En+c7kiEcnG3kPhLlV8EDrBOa5O5SqXrjV2zkQiYnMvaZGaR9N3RHYng30oa7DeKetNVinkdVR5jNIglJJMzR3cwe0n6Dik/BUaQxLZZdzDLSPoe647EWUSVE8WSKWHuUvnJSfnpvosktn66g0px99IdifOUdUmbCkumhIklzCSSatIT5adELO5RrDesT9TxBj5VcD2rtKmwZEoYTAwqYddYt6lUEesbDuoELawjZXSYZOl4kLWftY+1Fj+UAcSI/RLivsX64Lwx4aCCgfhna1NhyZQofr+EQkPIPefHGEqyHGkkfr+0UflIyljcrST+cN2RA71J/nY1/7NqHgZZk2lKBhk1cJ/iE7OFxB+mO0i8ydrMmT0k8fVX/lznYyOviV1nHvhkeqA7ImBcszYVWZNpfgYZNYBJiU3MZxK/h+7IwGrWtgxaIz9WFeXiPkviT1f+YOenDmKs9GFz1mQycgKTckWbVP5mfcT6o80GgNhiny/5uEcqfwfJ3uoM61Xg42GBkxTHWQtIlr0hL0n2d9hLerCXfEey38ObvZ4g9pXaVFgyJch6kkmZpzuofTKhjZsNpWbcxI08gDmNJB4kiMbHjX2d/x6gMjnDtXGzbnLt8BoxZmrwPRJsrGv7cQODNog9iGrhBeuCNhV4iyOGJt1h5M9OktIxnsio4qEKhrNgIRNJJgyTi/N6A4K+Rj0VF5MsP8O49WHQQSTxfWU9Z01wfhgzihRtrA2sh4Gvr+uo81Bq9+BNhf/JRdZrqv8NvYLax+HBQwx/H9f1zH1FbKiOGgVkK8nmv2iENyja/qTBcuWHYAk4nnWTSgmFMV19TlHHYXRT/EQX7ZiOf/NieYoT8eAca7Rr7yZZsuHtB9A+6dooVfsSPN5KYSUTJfd6c4p1TJtG9+MEyQekOEhaJPCBMJZmbYGH/R+SDMtGlNiRZDiLCLBcxJLyBsmyMOQLye/BMayuwt5OhlEnUDHEXtUwjDqAyiHekIZhGIZhGIZhGB2B0wzVnLg2jFz5BzKQB1A0WQiEAAAAAElFTkSuQmCC>

[image48]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHwAAAAYCAYAAAA4e5nyAAACjUlEQVR4Xu2YT4hNURzHfxsLirAmGxv5s6IoIqXIn0gNJU3JQjbCQineQihMNnYiZhZiO3ZKs5ONomRB8qepKWJGSP5/f845c8/9Offe987MO/e9md+nPr3u995b953ve+ec94gURVEURVGUruAc/FOiMkU5SlnJp8Q5ZQqihRezCa6SYbejhRezmbTwWrkHH8MR+AvOg4PwA3wAD2SXTgrbKK7wIfiMzHOdsFkDfocv4W6b1UI3FX6b8htLHsBdcBn8abMv41dPnO0UV/hdyp7xvH1dDhd6+c7xqxPTzsIHSrwJb8Dr8Bq8Chf/u6ucK5Q9r88ML2+Ic7HEFs74H0yfbzZ7IfJkVBW+AL4X2WF4XGSpuEzhgWSKBvkhnCMyycqAx2BvIGercM/xVeSjNudlSfJRBgH4Xl7Ooqkq/CT9P4A9cKbIUtFH4VKZ3xQ+d1Ych9gR8AyZD7bM2Srcs8hiuVTOeX2XHJFBgLYXzuvkUxk2yYUWXWpuK+UShUtlXB46F8NEpnRX+BuRu8L5m14LZYXvtzmvsY5h+Nk7Ts1FKi7V5e4bvQjep/zzt0KqwhtkvlRLvGzSWQH3wH7KBuoO3AsPkSnV5QftPY/sa2iwU+EX/sRms+APm/GmyPEczqf4KTC2cB5XVzjvf/jY5fwrgnNe213eS2ap4v1J26j6L92Xf/Y4tpD5jVkXfuFbKdv1viYzI0l4w8Yf4hhiCx8jMxO+ta+fCnI+dvB76Eh4gHnnXhdlU3qIZq8LEVt4q/AfSLGzUNtxA3g6l6ajlcI3kJnWZ8O5+VMdxRDcR/WNaSnv4CsZJkIuNc2UzjPSLRl2GOvIbNrWyxPTHZ5i18LVcA3cmD+tKIoyHfkLNaLzcP57u4kAAAAASUVORK5CYII=>

[image49]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH0AAAAYCAYAAADXufLMAAACpUlEQVR4Xu2Yu2sVQRTGjwo2vkWLCGplq4IiCmoCauOrEx+VnWCllVYSRC1ESSeEoPhArP0DtFYQCxEVBA2J7xcWKuL7fM6Mc3bc2Tsbc3fujecHH0nOmSHfzNmZ2VkiRVEURVEUpWs5wfqZoPesHttHmSAcJF/gDUHuuMidDnJKF1NVdCBXvTJBqFP06UFO6VLqFL2TOMy6xRphfbaxM6xh1iPWMRvLzVnWbdYz1jcbW8N6QeZ96byNNUpZ0SexVrB+iNxMm+sU9rNeUvGh3MdayLorYhhLTk6xPpL3g4f0CBlfzueXP60bQhYdT+JX8Td03zf9J4ZYlyK6QOaJP0dmZaDtlt+9qplH3meIi78JExnYSN7PXhHHio/5bytlKx3gSXRxt32WsZZ1NQw2xCyKT9p1Ks+l+J3KWpko7Iit6KVyL8sjcXCTWu+uz8n0nRwmWhErOvgkclOCnAODXhAGG2IGxSetn8pzKX6nsbYnapvtU8V6KveyLBIHuC63YpRM39pHWFXRh20c6itk6nOUdbKGUiYTt4nYpF2meK5pxlL0tlJV9DsiJz/O7LE/cV66N9IcYEXGJs3F34pYLr91ir6YzNGEd5txZylrJ+si+X+Maw5ii2ybzSLnjO2wvw/Yv8OBNIks+nfy3xGuibgjl1/MYT95P5jf+axNrENBHMfOQ9ZcMuMZd/DtHavgKZmzAcJd8h1rl2i3msx90pn7QOYsBXOoTeYSkUXHhLkzDlekQdHOkcPvPTJ3cnh7wnrNWse6EcRfsbbaPniJkzXoKGBudxhskKrtvYzcflNJHU8WnDmcQTmoW/TcflPoI7PFYzedXUx1Bg9Yj8NgQ1whX3CnA4UWf5PTbx3wXQTjUwJWkXkrxlctqJe1pNBCURTlv+MXCeH/2gC7vngAAAAASUVORK5CYII=>

[image50]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAYCAYAAAAh8HdUAAAAYklEQVR4XmNgGAVw0AbE//FgvKCQAaGwFk0OJxjVBAWENMkA8Rt0QUKaqhggciiAkKZfQHwVXRCfplio+FyYgB4QhwPxIqgECK8C4gggzgDiL0jiKVA9BNMeMtaB6hkFZAMAZIA9joTNRAsAAAAASUVORK5CYII=>

[image51]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAYCAYAAADKx8xXAAAAsElEQVR4XmNgGAV4QRsQ/ycCfwBiSageFFDIgFDkjCbXiiTXiyaHVyMIINuOAkjRyIMsQYpGFIBNIyMQGwPxPyQ5PqgcHCBr/APEv5H4IHwdoRQVYLMRBEC2wsR/IInDAS6NIPANSY4ZTQ6vxgdQcRB2QJFhwK/xEpIcPAHoAXE4EC9CkmyBislB1XghyYEwGIDS6lsgfgrEj6H4GRC/A+IImCIgsGCApFcUzaOAmgAAUYhXkhY+nNoAAAAASUVORK5CYII=>

[image52]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFcAAAAYCAYAAACPxmHVAAABC0lEQVR4Xu3YwUoCURTG8dO253Cbm8geoIdw28plVC5aCa5a9AZCYdjOXsW1i2iXCAZuQxdR3+HemMNt7jhzZzbK94M/zPUoyBFGUYSIiOhA3KOfClGCG8kWOAhm52ZGCYqWq47FzY7CAe0WW+6tudZZx5yppNhy7a3gHfXNmUqyyx2iFpr5M9VklxvWlCF6iTRBz2iMntCjuPd0EPJuC6f+TDXlLVdxuQ2ILbdJPfRQoWv3sv2Xslz9zbtBUzQKZgRt1BX3hfK3XF2WPqYVWZnrb3NNnv63sEZL9OFbiFvcl3leHn2efhhv4YCacYY+0Ws4oHRbdOWvL9FFNqK6TsTdTuboLpgREdF/vxBMXqTUd+BTAAAAAElFTkSuQmCC>

[image53]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAZCAYAAADjRwSLAAAAmklEQVR4XmNgGNzgKhD/AeL/QMyJJocC9jJAFOEFIAVEKZqOLogMpBggiiTQJZDBLAZUq9qA+CmaGIp7DgExHxCvQhIDAxBnLhBfAmJWqNg8IL4HV8EAUbQTiGciCyKDCAaIIlCAgug9qNIQcJ0B1W4QewoSHy54DY2/Esr+iCwYBuNA+dlAzAjEx0ACYlBBZOAHFfuAJj5SAQAiTSqrPFD8eAAAAABJRU5ErkJggg==>

[image54]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAXCAYAAAAyet74AAAAbUlEQVR4XmNgGAV0BweBeB0Qr4bSe6HinUC8EYjXQGmGfij+D8VHoQqTofwrUHk4CIJKgDAPEN8F4i/ICpABPwNC8So0OQzwkwGhmBdNDg5uAvE3BoinYIoxwHwGVIl3UD7cnTCd6CbgEh9BAADQnyedA0sqPgAAAABJRU5ErkJggg==>

[image55]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAAAYCAYAAAB+zTpYAAABmUlEQVR4Xu2YPUsDQRCGx0JQS0sbLRQRwcLPwsLC3tbG0sJKUDtBEAsLC1sRUfwoBP0PgqVgL6hFJCIKioUiWPjxjrvHza25y21ySTTMAw9kdm7J7suyHEekKIqiKHXMKvzyUCmROQpDXHJ6I6KnlEhSwEwLmV6D21DSERfwvPjNvWFRKx7EBSyvhWu4IOp6ohGuwA3Y6fQyQQa8TOZPzm1d75zBV9hk60/YGrazQQbsmiUHCe7BXbgDt+EWVeg0CW4ousdNW1c04OCKGLB1GoKF1YIOOJjSNjPlh1Eya+4TY0yzU0uOyczpdhvFKBQw4xOaz7NZwgdhIqU9dg7zQv5rPiQzp91tFCMu4LTMwBN3sABrnvaaaRUh2G9VKCVg3nwO3sF7OBbp/n14rzl3kMy7ftI14QXfP5Nwn8KAj+wYGwffZR+irtpJyJBF+r3uLoruq2z4W8QTmVOYt97CB/gmnnPhRUyJ2l3of2GdwoP1Dmej7dohA52Gp6JWMkAG/AzH4YUYU8qkHz7CSzgEr8i8LimKoijp+Ab/CYOf/DNYCwAAAABJRU5ErkJggg==>

[image56]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAYCAYAAADDLGwtAAAAc0lEQVR4XmNgGAV0BweBeB0QrwbitUC8C01uPVSeoR/K+A/FID4MgNggscVIYnCFs5DENKBiKGAmVBBZ4jsQNyLx4QCmMBWIOaBsrOAiA0LxNQZUj6EANgaEQhBmRJVGBV8ZIIpeoEugA3EGiEJedImRBwDZjiI1z0HGPAAAAABJRU5ErkJggg==>

[image57]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAYCAYAAAB9ejRwAAABz0lEQVR4Xu2WTStEURjHH6+hiBIbL1nYys7LglCyRljIZKFYK/kElA1K8g2o+QoW7CzFjrKQJBSKkNfn8ZyZOfO/587ce2fKZn71b+79Pc+9d86Zc09DVOD/GEYRkE4UfrRydjhbnBqouZjnLKMMwQ8Kmw3Shhlz3sK55bwlO7w0c65RhqSN84CymPTLHGLB8Mn5RmmQ6ypQRuAFhdz4AqXFIGnPEPhezju4qLTbJ1eU5Tel1EzGwX9QbmvJST/pww7AI3WkfY/gxVWCS7DLGbXOJzh7nG7LOZGRBlkT06R9x5arNs7Fl/mU+hjpYGpJByBuytSdSIPfjW3OSPvk1U8wYBwiD940x1KXl8RG3D64JA0U/Eu5+mYdTujglHAaSetV6eU/twguiVwoDa9YAMZJ+3C7iBnvxzZ56z3GFYFPwzUDiF+PLFiXTyA1WbM2N8Zn5IkyN12S1suwQKk30g+prTrcinXsixRPUDJ35B0pIteWo2TqSWu4XYiTPU9meQFqHu5JLzgiXWNy3JXW4Ub6XIt2ktwzcUrq17GQT5Y4zygj0oQiF2TkpSgj4PmXkAsjnHOUIZE9Td7MvLLGmUMZAtf6ywsxFAHpQ1EgG79HU3AoU2f7PwAAAABJRU5ErkJggg==>

[image58]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAWCAYAAAD5Jg1dAAAAoUlEQVR4XmNgGFpACIifAfF/IL4HxPyo0hDAxgBRBAOMDBANhkhiYPABXQAIdID4L7ogSHcmmpg+VBwFvIcK7kESA9lii8QHA2YGiEIYBinyQVGBBKQYUBVfRZWGgF9AHIHE72VAaIADaXQBKFBlgIgLwgSCoQLYAEhcAMZhggqAaHSAYUA7VBAUdiDgBOVrw1UgAT4gXgTEp4C4DE1ueAEAquclUONMGA8AAAAASUVORK5CYII=>

[image59]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGMAAAAXCAYAAAAfiPFCAAACHklEQVR4Xu2Yu0skQRDGS0EUxcDgIgPhAkGQyw7RM1gNLjnBQBE0OIxOEPRfELlAMFVMFMUTA1PBVHwkIiLqBYdwF/kAUfARKAin1kfXSG9tz+72Biuz9g8+duqr2Z2urZ7pmSEKBAKBQKAwaln/WM+sfZVzccfq0WYRaGddkRnnDqs8PZ18BskUVyHxGOv2NZvJEJn9i92MKdaMFd+TGcdHy0s0H8gUVGV5iKE4LultmoFjtji8bGNNFK5iqlVscyOfPs34pA3FsDYc1JB7rC4vsaCQ37LdSmbtiOM7mUsa8GnGMatNm8IGq1ubMfxkfVFeyTSjiUwhy6xDMrNvWjwXWLQjfJoB/rJSytskv99wgXE8aTOJ9JN7ZqG4B+VdsMqs2LcZAHdrHbK9xeqzcoVwRGYc2S6rEUsx+sVaZC2w5llzrFn5TlH5RqaYc+Wvix+B/UatGBTSDICG7LEGdMITLOQYA25ASoIGMgVhhtisiv9ZYn2WgEKbgWcYNOSrTnhQR+b4lTqRdFDUivLWxG+UeFsJMxv5PxLnCxrRK9u4xHRauXzBQ56+rOrJ5GLSU28CCsPianMgfhxoku+ZYTciAg1JKS8XrsX6vzaSSjNl/vGIx5Vng9tL7PNDJ2LYZXVpU8BdHF5x5MMjmeO6VDKMkCkoejc1kZ5O45p1xjphnUqci5Q2FHh+yEU9ZTYgkmtNCwQCgUAgEAi8G14AGy2TYmWPz2MAAAAASUVORK5CYII=>

[image60]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAXCAYAAACBMvbiAAAB6klEQVR4Xu2UvStHURjHHy+hiMhCTEpEoQwWGSQKSbEoNoPZpiwWBgMDi9VfIJkwoWwUeQmDkEFh8JKI53vPOff3nOd3f9eCUr9Pfbvn+T7Pufe83HOI0vw9vdqIoFEbP00d69U+31nNfjrklNWvTUcJ64b1ybpgFfnpgAfWMKuYTH6Ade9VmP5Vto26F9YHa5zVwVqyNbe2JokcMgNxZJDp0CQ8AE+rwqswXqq4zD6xcinBjDX1ZGYkwYunWYusdpUDpRQ/GDBBMdsD0GFMeQ3Wl+g4Cl0j42yK2R4H9h2d1oWH1WoVMdAfiuKNNWTbWL1RlfuWLPL/Awykx6swIIdTcMjaIXNaMFsN6pZZd8KbYvWJOJZy8geED2rg54p4zXrfoQ9ILeuZtSm8kE4yRxC0UWJA+2FFNDVk6iZ1QoEVdBRSYgL5rCORC4ia3SUl+9hOSSaZmqQXCmZY3SLGe1dEfCbaNEjJH3XAb7FtdEKcl0hTgfW2hCdB7ZXyUL8g4jnRDi62uME4MKMnEYMuMjXu9Gj0PQX0YOZFOwAF+NsliPdEXMk6FzHATer+Nc0sRV+Mu6xVEXvb5HgkM6hj+8TR1IyQyV3b57afDsH2RH6EzGl0K44f+EDkfoUTbSiqyVyAGzqRJs2/5Quu6X9C5nwp2QAAAABJRU5ErkJggg==>

[image61]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAVUlEQVR4XmNgGAWjgKpgL7oAJeAfugAlwAaIy9AFKQHngNgcXRAETMjEt4B4HwMa8CMTX4NiFgYKwUQg9kYXJAcoAnEnuiC54BO6ACXgMLrAKBhuAACnlhESw2iRqwAAAABJRU5ErkJggg==>