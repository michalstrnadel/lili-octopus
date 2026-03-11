# 2026-03-11 — Fáze 2B: Ontogeneticky přesný pohyb

## Problém

První implementace Fáze 2 měla plynulý, rychlý pohyb pro všechny věkové fáze. Paralarva (hatchling) se pohybovala jako dospělec — hladce, koherentně, s dlouhým glidem. To je biologicky nepřesné a porušuje klíčový princip projektu: **realistická ontogeneze pohybu**.

## Co říká výzkum

### Research #1 (Biomechanika chobotnic):

> "Paralarva se chová spíše jako těžkopádný mechanický oscilátor. Spoléhá téměř výhradně na vertikálně směřovaný tryskající proud z velmi malého sifonu a ve vodním sloupci poskakuje nahoru a dolů (bobbing) za pomocí extrémně vysokých frekvencí pulzů přesahujících 5 Hz."

> "Geometrie jejich jetu netvoří ony účinné oddělené víry charakteristické pro dospělce, ale zanechávají za sebou jen turbulentní protáhlou stopu."

> "Z hlediska 2D matematiky by juvenilní jedinec měl disponovat FSM se zcela zredukovaným počtem stavů, zakázaným využíváním veslování chapadly a frekvencí sinusového tlukotu pláště zrychlenou faktorem pěti."

### Research #2 (Q-Learning v biologických simulacích):

> "V raném stadiu (larva/mládě) je parametr ε uměle uzamčen na vysoké hodnotě (např. 0.8), bez ohledu na počet interakcí. Organismus je nucen mapovat prostředí a zažívat široké spektrum odměn i penalizací."

> "Integrace věkově závislého ε transformuje samotný proces učení do podoby přírodního kurikula."

## Co bylo změněno

### 1. Pulse-glide cyklus — plně věkově závislý

| Parametr | Hatchling | Juvenile | Adult | Mature | Elder |
|----------|-----------|----------|-------|--------|-------|
| Frekvence | 5.0 Hz | 2.5 Hz | 0.9 Hz | 0.7 Hz | 0.4 Hz |
| Power ratio | 0.45 | 0.38 | 0.30 | 0.28 | 0.25 |
| Speed boost | 1.15× | 1.35× | 1.6× | 1.4× | 1.1× |
| Mantle kontrakce | 4% | 7% | 10% | 8% | 5% |

Hatchling: rychlé, neefektivní pulsování (5 Hz), minimální speed boost (1.15×), krátká glide fáze.
Adult: efektivní pulse-glide (0.9 Hz), silný boost (1.6×), dlouhý plynulý glide.

### 2. Tři nové ontogenetické parametry

- **`movementCoherence`** (0.15 → 0.95): Jak koherentní je směr pohybu.
  - Hatchling (0.15): rapidní změny směru, erratický pohyb
  - Adult (0.8): plynulé, organické křivky
  - Elder (0.95): minimální a velmi promyšlený pohyb

- **`verticalBobbing`** (0.8 → 0.01): Intenzita vertikálního poskakování.
  - Hatchling (0.8): dominantní vertikální oscilace (paralarva ve vodním sloupci)
  - Adult (0.05): téměř žádný vertikální bobbing

- **`directionalNoise`** (0.35 → 0.01): Random perturbace směru per frame.
  - Hatchling (0.35): turbulentní, nepředvídatelný pohyb
  - Adult (0.04): jemný, organický šum

### 3. Efektivní damping model

PRD damping (0.97 hatchling → 0.85 elder) modifikován koherencí:

```
effectiveDamping = baseDamping × (0.6 + coherence × 0.4)
```

Výsledek:
- Hatchling: 0.97 × 0.66 = **0.64** → velocita rychle umírá → žádný glide → bobbing
- Adult: 0.93 × 0.92 = **0.86** → velocita přetrvává → plynulý glide
- Elder: 0.85 × 0.98 = **0.83** → pomalý ale koherentní pohyb

### 4. Heading stabilita

```
headingLerp = 0.1 + coherence × 0.6
```

- Hatchling (0.25): heading se škubavě mění → erratický organismus
- Adult (0.58): plynulé otáčení → elegantní plavec

### 5. Wander přepracován

- `wanderDistance` a `wanderRadius` jsou věkově závislé (hatchling: 15/8, adult: 80/40)
- Noise-driven angle step škálován inverzně s koherencí
- Vertikální bobbing přičten k cílovému bodu
- Power stroke má ease-out-quint tvar (Research #1: exponenciální kontrakce)
- Glide fáze má koherenci-závislou podlahu (hatchling téměř zastaví, adult udržuje rychlost)

## Výsledný pohybový profil

```
HATCHLING: 10px tělo, 5Hz pulsování, damping 0.64, noise 0.35
  → Erratický bobbing, minimální displacement, "mechanický oscilátor"

JUVENILE: 16px, 2.5Hz, damping 0.72, noise 0.15
  → Získává koordinaci, občas koherentní směr

ADULT: 22px, 0.9Hz, damping 0.86, noise 0.04
  → Plynulý pulse-glide, efektivní navigace

MATURE: 27px, 0.7Hz, damping 0.86, noise 0.02
  → Rozvážný, nespěchá, hledá klid

ELDER: 30px, 0.4Hz, damping 0.83, noise 0.01
  → Téměř stacionární, meditativní přítomnost
```

## Verifikace

Numerická simulace potvrdila:
- Hatchling: ~0.15 body-lengths/sec (biologicky odpovídá paralarvě)
- Adult: ~0.06 bl/s (efektivní ale ne rychlý — ambientní společník)
- Elder: ~0.01 bl/s (prakticky stacionární)

## Rozhodnutí

1. **PRD maxSpeed hodnoty zachovány** (4.0 hatchling → 0.4 elder), ale efektivní pohyb dramaticky změněn přes coherence + efektivní damping. PRD je zdroj pravdy pro raw parametry, biologická modulace je overlay.

2. **Mantle deformace má sinusový envelope** místo ostrého přepnutí — biologicky přesnější (sval se stahuje plynule, ne digitálně).

3. **Vertikální bobbing je multiplikátor bodyR** — škáluje se s velikostí organismu.
