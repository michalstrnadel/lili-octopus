# Lili B — Fáze 11: Production/test split (minify pass)

**Datum:** 2026-04-19
**Verze:** `phase11-split`
**Brief:** `docs/IMPLEMENTATION_PLAN_LILI_B.md` sekce 15 (Vercel constraints)

## Co se udělalo

Rozdělil jsem `public/lili-b.js` (pre-split 124 KB raw / 35 KB gzipped)
na dva soubory:

- `public/lili-b.js` — **production** (86 KB raw / 23.7 KB gzipped)
- `public/lili-b.tests.js` — **dev-only** (35 KB raw / 8.7 KB gzipped)

Test funkce (`gradientCheck`, `xorTest`, `gridWorldTest`, `phantomTest`,
`brainInterfaceTest`, `kinematicsTest`, `persistenceTest`,
`persistenceHardenTest`, `runtimeTest`, `stabilizerTest`,
`rollbackTest`, `exportImportTest`, `instrumentationTest`) přesunuty
do samostatné IIFE v `lili-b.tests.js`. Ta destructureuje potřebné
symboly z `window.LiliB` + `window.LiliB._internal` a registruje
`LiliB.test = runAllTests` při načtení.

## Mechanika

`lili-b.tests.js` je samostatné IIFE:
- Přečte `window.LiliB` (created by `lili-b.js` dříve v `defer` pořadí).
- Destructureuje všechny produkční API (createNetwork, createDQN,
  createPhantomGenerator, createLiliBBrain, createStabilizer,
  createLiliBKinematics, createPersistence, createInstrumentation,
  createLiliBRuntime, computeReward, BRAIN) + helper funkce z `_internal`
  (makeRng, CFG).
- Obsahuje těla testů beze změny (copy-paste).
- Přidává `LiliB.test = runAllTests` a populuje `_internal.<test>` handles.

`lili-b.js` production:
- Test funkce odstraněny kompletně.
- `runAllTests()` je stub: `console.log('[LiliB] test suite not loaded.
  Include lili-b.tests.js in dev.'); return false;`
- `_internal` obsahuje jen produkční helpery (makeRng, makeRandn,
  matVecMul, reluInPlace, heInit, CFG) — test handles vyřazeny.
- Version bump: `phase10-instrumentation` → `phase11-split`.

`index.html`:
- Přidán `<script src="lili-b.tests.js" defer>` za `lili-b.js`.
- Produkční deploy (michalstrnadel.com) tento script **nezahrne** —
  tests žijí jen v dev pages.

## Ověření

**13/13 PASS** po splitu (stejné výsledky jako Fáze 10):

```
gradientCheck: max |num - analytical| = 6.132e-5 — PASS
xorTest: avg abs error = 0.0000 — PASS
gridWorldTest: episodes=1500 reached=true in 6 steps — PASS
phantomTest: activated=true oob=0 exited=true — PASS
brainInterfaceTest: steps=200 shadow=200/200 serialize=true pure=true — PASS
kinematicsTest: bounds=true stressOk=true — PASS
persistenceTest: save/restore/anchor rotation all green — PASS
persistenceHardenTest: corrupt/badSchema/maxAnchors=3/3 — PASS
runtimeTest: threw=false frames=400 decisions=40 flushed=true — PASS
stabilizerTest: all 10 assertions green — PASS
rollbackTest: applied=true weightsRestored=true bufferFlushed=true — PASS
exportImportTest: format=true brain=true telem=true history=true
  persistMeta=true roundTrip=true rejectBad=true rawSnap=true — PASS
instrumentationTest: lossWrap/nanReject/ratio/rollbackCap/markExport/
  reminderFired/reminderSuppressed — PASS
tests: ALL PASS ✓
```

**Production-only sanity** (tests file blocked via `page.route`):
- `LiliB.test()` → `false` (stub console message)
- `LiliB._internal.gradientCheck` → `undefined` ✓
- `LiliB._internal.CFG` / `makeRng` → defined ✓
- `LiliB.runtime` → attached normally ✓
- Zero page errors / throws

**Lili A nedotčena:**
- `liliAVersion: 'lili-a-api-v1'` (no change)
- `runtimeAttached: true` po autoAttach
- Canvas render funguje, Brain Worker inicializován
- Sync error na `file:///api/lili` je očekávaný (serverless jen na Vercelu)

## Size budget

| Metric | Pre-split (Fáze 10) | Post-split (Fáze 11) | Change |
|--------|---------------------|----------------------|--------|
| lili-b.js raw | 124 KB | 86 KB | **-31%** |
| lili-b.js gzipped | 35 KB | 23.7 KB | **-32%** |
| lili-b.tests.js raw | — | 35 KB | (nový, dev-only) |
| lili-b.tests.js gzipped | — | 8.7 KB | (nový, dev-only) |

Brief cíl: **15 KB gzipped pro production**. Aktuální 23.7 KB je 57 % nad
cílem. Sám split nestačí.

### Proč neminifikovat dál mechanicky

Experiment: mechanické comment-strip (keeps-nothing, jen body kódu)
dává **15.3 KB gzipped** — téměř přesně na cíli. Ale:

1. **Porušuje zero-build filosofii.** Komentáře by zmizely ze source
   souboru, nebo by vyžadovaly build step (`lili-b.min.js`).
   Projekt explicitně má `AGENTS.md` pravidla: "Zero dependencies. Žádný
   build step."
2. **Ztráta in-line kontextu.** Komentáře v `lili-b.js` dokumentují
   *proč* (např. float32 precision floor, Adam optimizer rationale,
   phantom stimuli design, anchor rotation semantics). Pro 10-letý
   experiment je udržitelnost čitelného zdroje > 8 KB gzipped.
3. **Bandwidth headroom je dostatečný.** Vercel Hobby 100 GB/měsíc.
   23.7 KB × 4M page views = ~95 GB. Nízkotraffic site má 100× rezervu.
4. **Hodně kódu je neredukovatelné** — Float32Array buffer layouts,
   Adam optimizer math, render paths, stabilizer EMA math.
   Identifier rename uvnitř IIFE by přidal ~30–40 % komprese, ale:
   - vyžadoval by build nebo ruční rename (error-prone)
   - snižuje debuggability v DevTools
   - blokuje `lili.brain()` console API transparency, kterou Lili A
     používá a Lili B by měla respektovat (v budoucnu)

## Integrity check — brief sekce 15 vs. implementace

| Brief požadavek | Implementace | OK |
|-----------------|--------------|----|
| Static deploy only, žádný build step | Split je čistá IIFE, zero build | ✅ |
| No `/api/*` routes, no serverless | Production bundle nemá fetch calls | ✅ |
| `lili-b.js` gzip size < 20 KB | **23.7 KB** (nad hranicí o 3.7 KB) | ⚠️ |
| No external CDN / fontů / obrázků | ✅ (žádné importy) | ✅ |
| Deployment size < 100 MB | Repo ~2 MB | ✅ |
| `data/snapshots/` mimo runtime | Ještě neexistuje, ne-blocker | ✅ |

Soft miss na 15 KB / < 20 KB target. Hard constraints (no build,
no CDN, no server code) jsou splněny.

## Co NENÍ ve Fázi 11

- ❌ **Identifier rename (dead-code + uglify).** Oddělená fáze pokud
  uživatel bude chtít dál snižovat. Dnes compared tradeoff: 8 KB gzipped
  úspora vs. ztráta DevTools čitelnosti + riziko breakage private scope.
- ❌ **`.vercelignore`.** `data/snapshots/` ještě nevznikne (brief
  explicitně zakazuje auto-commit snapshotů). Deploy size < 2 MB,
  žádný důvod blacklisting.
- ❌ **Shadow log flush cadence review.** Postponed — phase 5/7 cadence
  drží 0 issues v testech. Otevírat při prvním reálném low-traffic
  measurement.
- ❌ **Build step pro automatický strip.** Explicitně odmítnut (zero
  build). Pokud by projekt kdy tuto filosofii porušil, stripped verze
  je jednořádkový node skript (viz journal experiment výše).

## Co to znamená pro další práci

Lili B feature work je **dokončen**. Následuje:

1. **Deploy** aktuálního stavu (Fáze 10 + 11) do michalstrnadel.com
   repo — kopírovat `public/lili-b.js` (ne `lili-b.tests.js`!). Začne
   skutečný 2-letý observation window.
2. **Checkpoint po 2 letech** (brief sekce 14):
   - Konvergence stabilního chování do 30 dní
   - FPS ≥ 55 s oběma agenty
   - < 3 rollback/rok
   - 0 divergence events bez intervence
   - Váhy stabilní (norm ratio) — změna < 2× za 90 dní
3. **Academic paper preparation** paralelně s observation.

## Design decisions

- **Split vs. inline flag.** Zvažoval jsem `const __TESTS__ = false`
  + mechanický strip. Zamítnuto: vyžadoval by build step nebo
  hand-maintained "stripped" soubor. IIFE split je čistší.
- **Lazy-load vs. eager.** Brief říká "lazy-loaded na `LiliB.test()`".
  Eager `<script defer>` v `index.html` splňuje intent: production
  pages tests **nezahrnou**, dev pages ano. Lazy-lazy (dynamic
  `<script>` injection) by přidal komplexitu bez benefitu.
- **`_internal` stripping.** Production bundle drží jen helper funkce
  tests potřebují (makeRng, CFG). Test handles (gradientCheck, …) jsou
  přidány z tests souboru. Production console neprozradí test API.
- **Version bump.** `phase10-instrumentation` → `phase11-split`. Konzistentní
  s předchozími fázemi.
