# Ship Fitting v0.2 — QA EXECUTION affected r3

**Result: PASS — measured CR-B1/CR-B2 и функциональные origins. BLOCKER=0; ADVISORY=0 в этом scoped QA.** Новые13 cases:13PASS/0FAIL/0NOT RUN; functional browser3origins:3PASS. Это отдельная affected выборка, не новый113-case общий счёт и не повтор старых100 cases.

Actual role: independent QA по `.agents/QA_ROLE.md` v2.1; Model: Codex, exact provider model ID unavailable. Same QA session, PRODUCT verifier launch2/5; без новых subagents. Требования/product code/durable tests/Beads/Dolt/GitHub/commits не менялись. PM публикует exact bytes; operator merge/deployment здесь не выполняются.

Commit / exact candidate: `0c5ead9f179f7e5dfae6db2e325959c7d4f08d13`. Sole Developer guard source: `a9f3a84ff6fa42b5c830bceb965a7812feb1ffbb`. Последний измеренный HEAD clean; evidence frozen UTC `2026-10-05T18:01:59.054975+00:00` (местная дата2026-10-06). Source freeze явно released PM после последнего измерения; assembly использует saved evidence, без новых live probes.

Среда: Node24.21.0/npm11.6.2 через `/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh`; Darwin25.5.0 arm64 (та же QA host session); headless Chromium153.0.8010.12.390×844 touch/mobile browser contexts — эмуляция на одном host, не второе физическое устройство. Тесты функциональные; visual/layout/style/screenshot-polish/broad a11y audit исключён последним PO steering.

## Source-first expected и identity

Expected подготовлены до объяснения fixes в ignored `qa-codeblocker-methods.md`, SHA256 `b664ccbb288901bc3c74b25e07b318b8c9085f88cedcc4d2fe9ca4682e63f2c2`; исходная12-case версия также сохранена (`42a3a202d7125b2a747d15f7d0cde001b6ae46e2ee8a47305ba8ff858c0f01cf`). Accepted WHAT: GDD§2/5/6/9 + PO overlay; whole VC SF01/SF05/SF07/SF08/SF10/SF11/SF12/SF17/SF18/SF20. Полные numerical item/snapshot должны быть finite с SI/provenance; ошибка import не уничтожает valid state; completion не подменяет измеренное время.

B1 oracle: required electric `pathEfficiency` и origin обязательны, supported inverter `copEfficiency=0` invalid до Run на fit/local numeric variant и resolved supported v2 snapshot границах. Positive declared coefficients остаются finite. B2 oracle: explicit invalid dt1e−12 получает error до создания/импорта/старта; отдельный tiny horizon не может завершаться приtime0/0ticks. Нижнюю границу QA не назначает: actual engineering domain Developer `(1e−10,1]s` для dt и horizon`>1e−10s` записан из exact validator и проверен по обе стороны. Accepted .01/.005/.0025 сохранены; supported1s — positive control, не новая WHAT норма.

Content-Fingerprint: `bb3b442f129483a15e1b1e2929c188fb391dc8a225a7cedda91daecb3881eefe`; independently recomputed SHA256 canonical sorted-key compact UTF8 JSON `{blobs:[{path,blob}],contract:{path,text}}`. Проверены все83explicit HEAD blobs, соответствующие current working bytes и entire whole VC text до imports; current VC blob `314d1770363d642df4c2dec069a308b715911c58`. Approved WHAT fingerprint `550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce` unchanged; approved5 planning/WHAT blobs+PO overlay/VC проверены отдельно. Полный actual binding/wholeVC text: `qa-codeblocker-binding.json` (sealed evidence ниже).

Approved source identity:

| Path | Actual approved blob |
|---|---|
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `eac9ece236840af775181d5936799df1e8cff2bd` |
| `docs/plans/2026-10-05-ship-fitting-v0.2.md` | `aa48875c5c40aae0b3b98f137c704edc11bd0b44` |
| `docs/product/ship-fitting-v0.2-acceptance.md` | `49d640538146c38114e195dae9d796074c785588` |
| `docs/research/ship_fitting_source_synthesis.md` | `a98c69894d98c688a0c4b19d4e7f39ff44004a67` |
| `docs/research/ship_fitting_sources.json` | `a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec` |
| `docs/verification/ship-fitting-v0.2-contract.md` | `314d1770363d642df4c2dec069a308b715911c58` |

Build/extracted artifact `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/`:

- manifest SHA256 `917b94cb56f91f98c85ba40d270ea16d611d9a29c761b8bf8c7e2a4753af8b8f`.
- ZIP `u2-lab-ship-fitting-v0.2.0-fix-r2.zip`, SHA256 `4efe485b200d456705b84429ee8dbe42fe8a6f1a1f50f06e835437008c0e4970`; ZIP CRC pass.
- distDigest `5f18d8d6cb13cd7fa44b1307b8ee50e2998fdec5c11cf6a5228084734d387ba2`; all10 asset sizes/hash/bytes independently match dist, prefix/u2-lab, ZIP and default dist.
- artifact40runtime paths+wholeVC fingerprint `42767008891dbb09d64367956d30c604920fa0916e820af8e0f79c238c47c921`; all40actual HEAD blobs+wholeVC checked independently.
- Все10 HTTP-fetched asset hashes на каждом из3origins совпали с new manifest. Измерялись именно новые extracted bytes; archive сам по себе не объявляется deployed/public Pages.

## Новые13 cases

Fixtures: ready CivilM local declared electric march clone; ready IndustrialM legal Signature3 declared thermoinverter clone. Negative mutation меняет только нужный numeric/origin, сохраняет legal slot/type/gates/material bill/resource references. Numerical snapshots сначала построены из valid positive spec; patch resolved item и соответствующий local metadata согласованы. Required fields/bill не ломались для случайного альтернативного reject. Positive fit/run roundtrip и recursive finite scan executed. Invalid guards не обходились; rejected specs в physics не отправлялись.

| Case | Source AC | Prepared method / expected | Actual result | Evidence |
|---|---|---|---|---|
| B1-E-FIT | SF01 finite item; SF05; SF18 | Electric local variant missing pathEfficiency+origin; call validateFit/parseFitJson/compileFit/makeMiningRun. Expected: Invalid fit, canRun=false; parse/compile/run preparation reject with reason identifying field. No fabricated default path or numeric repair. | **PASS** — Все4 fit/preparation entry points reject; canRun=false; NUMBER/RANGE с path `instances.fit:march.numerics.pathEfficiency`. | `qa-codeblocker-results-final.json` → `B1-E-FIT`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-E-SNAPSHOT | SF18; SF10 finite ledger | Valid known supported v2 spec patched only resolved electric pathEfficiency+origin; validateRunSpecV2/parseExperimentJson/createRun. Also explicit unknown-catalog snapshot replay option. Expected: Both known-catalog and explicit snapshot-replay modes reject numerical incompleteness; createRun refuses. Explicit replay grants no schema exemption. | **PASS** — validate/parse/create reject missing electric path; explicit unknown-catalog snapshot replay также reject до Run. | `qa-codeblocker-results-final.json` → `B1-E-SNAPSHOT`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-COP-FIT | SF11 finite inverter rejection; SF18 | Declared local inverter copEfficiency0, origin intact; same four fit/preparation boundaries as E-FIT. Expected: Invalid coefficient rejected before Run, even though0 is finite; no NaN ledger/battery creation. | **PASS** — Все4 fit/preparation entry points reject coefficient0, origin/materials сохранены; path `.numerics.copEfficiency`. | `qa-codeblocker-results-final.json` → `B1-COP-FIT`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-COP-SNAPSHOT | SF11; SF18 | Valid known supported v2 inverter spec patched coefficient0; validate/parse/create; unknown-catalog explicit replay same numerical input. Expected: All supported snapshot modes reject before execution with coefficient reason. | **PASS** — validate/parse/create и explicit unknown-catalog replay reject coefficient0 до запуска. | `qa-codeblocker-results-final.json` → `B1-COP-SNAPSHOT`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-E-POSITIVE | SF08; SF10/SF18 | Original declared electric item with pathEfficiency/origin present; local fit and resolved snapshot roundtrip; stepV2 dt.01,march1. Expected: Valid, full snapshot values preserved, recursive numeric leaves finite; charge within0..capacity, time advances. Drive output gives no ore; one-step residual remains VC bound. | **PASS** — dt.01: force8,820,000N; engine useful68,796,000W; SCU0; charge58,919,097,076.023384J; residual8.917413651943207e−8J; nonfinite paths0. | `qa-codeblocker-results-final.json` → `B1-E-POSITIVE`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-COP-POSITIVE | SF11/SF18 | Original declared inverter with positive copEfficiency, same slot/bill; valid fit/run import; actual .01s cooling step. Expected: Valid finite numerical state/ledger/stocks; physical hot rejection and electricity remain actual, no free cooling. Declared positive coefficient not rejected as a workaround. | **PASS** — Объявленный copEfficiency.5: dt.01, cooling2,363,100.187246155W, hot rejection10,240,100.811400006W; residual1.2983218766748905e−7J; nonfinite paths0. | `qa-codeblocker-results-final.json` → `B1-COP-POSITIVE`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-PROVENANCE-GUARD | SF01/SF18 | Separate negative mutations: required electric numeric deleted while old origin remains; valid numeric present but its origin removed. Other fields exact positive control. Expected: Numeric and provenance completeness checked independently; both reject. Error not triggered accidentally by changed bill/role/ID. | **PASS** — Numeric-only deletion и origin-only deletion отдельно reject во всех fit/preparation + known/explicit replay snapshot entry points; target error path совпадает. | `qa-codeblocker-results-final.json` → `B1-PROVENANCE-GUARD`; raw fixture `qa-codeblocker-fixtures.json` |
| B1-ATOMIC-IMPORT | SF17/SF18 | Prepare valid running numerical snapshot and frozen A; attempt each malformed B1 fit/run import/apply via existing session/browser flow. Expected: Last valid fitRevision, running spec, A/result stay byte-equivalent; inline path/reason visible. Rejected import emits no new successful run start. | **PASS** — 2API setups сохраняют fit/revision, live run.spec, last result и frozen A. В browser на3origins malformed electric/COP fit+run и explicit replay: нет нового start, active export bytes/результат/A/revision неизменны. | `qa-codeblocker-results-final.json` → `B1-ATOMIC-IMPORT`; raw fixture `qa-codeblocker-fixtures.json` |
| B2-TINY-IMPORTED | SF07/SF18; honest interval SF12 | Known supported RunSpecV2 duration1,dt1e−12, valid1s idle phase/requests{}, complete finite ship; parse/validate/create entry outcomes. Expected: Explicit invalid1e−12 step rejected consistently before create/import start with numerical-field reason. No successful start or complete/t0/zero ticks; no1e12-step loop. | **PASS** — duration1/dt1e−12: validate, parse known/explicit replay reject `stepSeconds`; createRun throws до создания context. | `qa-codeblocker-results-final.json` → `B2-TINY-IMPORTED`; raw fixture `qa-codeblocker-fixtures.json` |
| B2-TINY-HORIZON | SF07/SF18; same honest completion invariant | Separate numerical spec duration1e−12,dt.01; preserve valid1s idle phase and all other positive-control fields, change horizon only. Parse/validate/create; if declared supported, one bounded runChunk maxSteps1. Expected: Rejected unsupported horizon produces error before start. Any supported horizon completes only with measured actualSeconds reaching duration, positive steps/ticks and finite state; done=true/time0/zero steps is FAIL. QA does not assign a new duration threshold or change phase semantics. | **PASS** — duration1e−12/dt.01: validate, parse known/explicit replay reject `durationSeconds`; createRun throws; false complete/time0 отсутствует. | `qa-codeblocker-results-final.json` → `B2-TINY-HORIZON`; raw fixture `qa-codeblocker-fixtures.json` |
| B2-SUPPORTED-CONTROLS | SF07; accepted numerical refinement | Same1s finite idle spec atdt1,.01,.005,.0025. Call one-step chunk, then bounded full-horizon loop (ceil1/dt+small guard). Expected: One-step advances requested dt, steps/ticks positive; dt<1 not prematurely done. Finished supported replay measures1s with finite state/metrics; no silent dt clamping/substitution. | **PASS** — dt1/.01/.005/.0025: first chunk1step, requested dt preserved; measured1s with1/100/200/400ticks, final finite; .0025 accumulated duration.9999999999999897s within tolerance. | `qa-codeblocker-results-final.json` → `B2-SUPPORTED-CONTROLS`; raw fixture `qa-codeblocker-fixtures.json` |
| B2-DECLARED-DOMAIN-BOUNDARY | SF07/SF18; no new WHAT | After handshake inspect actual documented validator/runtime dt and horizon domains chosen Developer, record exact bounds; test below/at/above relevant bound and equivalent parse/runner entry. Preserve ordinary accepted baseline/phases. Expected: Boundary policies agree across validation/import/createRun/runner; accepted lower boundary progresses, rejected below produces reason; supported accepted refinement inputs retained. No minimum invented by QA. | **PASS** — 10boundary fixtures: step1e−12/9.999e−11/1e−10 reject;1.0001e−10 and1 accept;1.0001 reject. Horizon1e−12/9.999e−11/1e−10 reject;1.0001e−10 accepts and completes at that measured time with1step/1tick. All parse/schema/create outcomes agree. | `qa-codeblocker-results-final.json` → `B2-DECLARED-DOMAIN-BOUNDARY`; raw fixture `qa-codeblocker-fixtures.json` |
| B2-ATOMIC-CONTROL | SF17/SF18 | Import tiny-dt and separate tiny-horizon numerical specs into existing valid fit/result; verify rejected inputs preserve identity/A/result. Exercise positive accepted control through bounded Worker chunk + controls. Expected: Both rejected imports retain valid state; positive accepted control produces real time and matching controls, no fabricated completed result. ACK≤500ms existing AC, no new performance threshold. | **PASS** — Tiny step/horizon imports retain valid state/API A; WorkerController first chunk advances.01, held telemetry не мешает pause/step ACK; после telemetry ACK step advances to.02. На3actualbrowser origins controls ACK≤18.1ms; bad imports emit0newstart. | `qa-codeblocker-results-final.json` → `B2-ATOMIC-CONTROL`; raw fixture `qa-codeblocker-fixtures.json` |

Actual numerical positive residuals <.001J, поэтому удовлетворяют unchanged VC one-step bound≤max(.001J,1e−8sourceJ). Leaf finiteness и physical stock0..capacity проверены без ослабления. B2 actual measured duration берётся из `metrics.durationSeconds`, время state проверено независимо; нет invented completion в0 или silent dt substitution.

## Реальные functional browser origins

На каждом origin: Start длинного valid run при speed1 → observed actual Worker chunk сtime.01/steps1/ticks1/measured.01; Pause; Reset→time0; Start12s→actualcomplete; freezeA; новый run/pause;8invalid imports; Reset/newfit→nextrevision; touch Step→.01 и keyboard second Step→.02. Каждая control команда получила matching runId/commandId ACK; run IDs уникальны. Atomic import проверял visible result/time/revision/runningRevision/A comparison/status, отсутствие нового start и точные active spec/fit export payload bytes. Unknown supported catalog replay был явно включён и не обходил numerical guards.

| Actual origin | secure / randomUUID | Worker/time и controls | Atomic errors / asset / network evidence | Result |
|---|---|---|---|---|
| `http://192.168.68.65:4183/` | `false` / `undefined` | firsttime0.01s,steps1,ticks1; maxACK17.7ms<500ms; newfit/Step.01/.02s | 8rejected imports/no newstart;10assets SHA match; pageexceptions0/requestfailures0/HTTPfailures0; sameorigin+prefix | **PASS** |
| `http://localhost:4183/` | `true` / `function` | firsttime0.01s,steps1,ticks1; maxACK18.1ms<500ms; newfit/Step.01/.02s | 8rejected imports/no newstart;10assets SHA match; pageexceptions0/requestfailures0/HTTPfailures0; sameorigin+prefix | **PASS** |
| `https://192.168.68.65:4184/u2-lab/` | `true` / `function` | firsttime0.01s,steps1,ticks1; maxACK17.7ms<500ms; newfit/Step.01/.02s | 8rejected imports/no newstart;10assets SHA match; pageexceptions0/requestfailures0/HTTPfailures0; sameorigin+prefix | **PASS** |

Evidence `qa-codeblocker-browser.json` сохраняет raw Worker messages/timing, all requested URLs, capabilities, exact import error paths и asset hashes. LAN-IP — действительно nonloopback ordinary HTTP origin на одном host: `crypto.randomUUID` undefined, `getRandomValues` function, Start работает. TLS — local self-signed emulation с ignoreHTTPSerrors только в test context; это не публичный Pages deployment.

## Собственная regression и carryover

Own scoped command (Node24 env): `npx vitest run tests/fitting/input-guards.test.ts tests/fitting/run-validation.test.ts tests/fitting/controller.test.ts tests/fitting/io.test.ts` — **35tests/4files PASS**,448ms; `qa-codeblocker-scoped-unit.log`. Independent private source-first/API/browser measurements выше дополняют suite; existing tests их не заменяют. PM сообщил fresh guard146unit/13browser+1SKIP/type/build/reference/bootstrap26PASS на этом exact candidate; это отдельно attributed PM evidence, не мои самостоятельно запущенные проверки. Broad bootstrap re-audit не проводился.

Старые100-case результаты перенесены из immutable r2:99PASS/0FAIL/1externalNOT RUN (`SF20-05`). Они не выданы за fresh rerun на0c5ead9f. R2 exact report `ship-fitting-qa-affected-r2.md` SHA256 `b6b302a705ce0eb99d500e20e21c10b4e8f794b84321bc2a4f84a034018c70d3`; r2 evidence manifest `44ff1963201839443dc4da326b5513d884e1b6d8c90dc8a91947a5059998125c`; все26старых sealed evidence заново hash/size verified. R1 FAIL история сохранена byte-identical (report SHA256 `4775cf7e7a0906e9c257ab7075d82e9f34276604809bb053605b63066a5bc090`).

Carryover обоснован independently verified `unchanged-numerical-proof.json`, а не Developer объяснением. R2→r3 runtime delta: только `src/fitting/validate.ts` item guards и `src/model/v2/step.ts` pre-run validateRunSpecV2 dt/horizon guards. Valid numeric recipes/inputs/data/kernel и post-validator numerical body остались идентичны.9declared proof blobs проверены с обеих сторон; body `initialStateV2` onward byte-identical, SHA256 `d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08`. Остальные83binding rows/diff сохранены в actual binding evidence.

Поэтому не повторялись unrelated88cases, full matrix и physical12h/GC: r2 own12h4,320,455ticks,118channels,21,601retained(max34,807), GC75,894,040B, Tmax445.79598283372053K, residual.0001036726579367311J; отдельный full-retention20,000events/max34,807 buckets actualheap126,539,040B<128MiB. Это предыдущие измерения r2, применимые к unchanged numerical/retention paths; fresh r3 измерения — guards/positive controls/artifact/functional origins.

| Independently verified numerical carryover path | Actual unchanged identity |
|---|---|
| `src/model/v2/physics.ts` | `611cfb32566bf46128308357e6dc2224503d915a` |
| `src/runner/fitting-run.ts` | `f6e6e22071a2641233484a0a573e9e175c2e93f9` |
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/fitting/data/modules.json` | `8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d` |
| `src/fitting/data/hulls.json` | `e3e58cae57d5868f3459c444f6543590899f1939` |
| `docs/experiments/ship-fitting-matrix.json` | `7bfc29b46603bf3e67eefdb3f27f2c7623b3c8d2` |
| `docs/experiments/ship-fitting-sensitivity.json` | `64721a3b787bdcc6ab9b9f8b6f722091fef35a3b` |
| `src/model/v2/step.ts` | `d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08` (post-validator body only) |

## Adapter corrections и ограничения исполнения

Новые confirmed product FAIL:0. Initial private probe остановился в4cases на absent helper fields `telemetry.sourceEnergyJ`/`metrics.actualSeconds`: реальные поля и raw telemetry проверены; остаток был8.9e−8/1.3e−7J, а measured metric — `durationSeconds`. Исправлен только ignored adapter, затем rerun только4affected cases; initial scripts/results/logs сохранены. Descriptive empty-request `declaredNumerics` выбрал role-less cargo: исправлена только метка из already saved positive inverter fixture; physical measurements/expectations не изменены, исходный finalJSON сохранён.

Первый browser adapter ошибочно требовал текст `12 s` вместо actual `12.0000 s`; заменён numeric parse без cosmetic AC. Следующий adapter получил native third-download event timeout после двух успешно полученных downloads. Причина browser download gating здесь не измерялась; этот timeout не выдан за успешное скачивание. Финальный functional adapter сравнивает actual Blob payload, созданный существующим export handler до native browser download handling; native click сохраняется, product code не меняется. Repeated native-file download policy не проверена в этом followup; snapshot/export numerical bytes проверены. Все initial browser attempts сохранены, без маскировки как product PASS.

**NOT RUN / вне scoped verdict:** физическое второе устройство `SF20-05`; public Pages deployment; native acceptance; отдельная bootstrap acceptance/finalize/operator merge. Нет fresh12h/heap rerun вследствие proof unchanged validation-only fix. UI visual/style/layout/a11y broad audit не проводился по PO steering. Unsupported arbitrary dt либо production balance/simulation scope не расширялись.

## Actual83path content binding

Все пути ниже независимо сверены against exact HEAD+working bytes до probes. Это fingerprint coverage, не утверждение execution каждого исходного testfile. WholeVC path/text включён полностью в sealed `qa-codeblocker-binding.json`; SHA canonical whole binding приведён выше.

| Bound path | Actual HEAD blob |
|---|---|
| `.github/workflows/verify.yml` | `e037b53e4e0cc99685b2bfd2912bc0fadc3f1536` |
| `docs/experiments/ship-fitting-matrix.json` | `7bfc29b46603bf3e67eefdb3f27f2c7623b3c8d2` |
| `docs/experiments/ship-fitting-sensitivity.json` | `64721a3b787bdcc6ab9b9f8b6f722091fef35a3b` |
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `eac9ece236840af775181d5936799df1e8cff2bd` |
| `docs/plans/2026-10-05-ship-fitting-v0.2.md` | `aa48875c5c40aae0b3b98f137c704edc11bd0b44` |
| `docs/product/ship-fitting-v0.2-acceptance.md` | `49d640538146c38114e195dae9d796074c785588` |
| `docs/research/ship_fitting_source_synthesis.md` | `a98c69894d98c688a0c4b19d4e7f39ff44004a67` |
| `docs/research/ship_fitting_sources.json` | `a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec` |
| `docs/verification/ship-fitting-v0.2-code-review-contract.md` | `8243df95b19ba0b813898fa8c59310db3b193d82` |
| `index.html` | `616d3e500291d24f43d2ecdd96d4a054f2c2680e` |
| `package-lock.json` | `af0a9d91cb82c090ac960f32dee6dfbed37ff4ff` |
| `package.json` | `8c4e0cd7fa3722937070955d20d65fe6668c698e` |
| `src/app/charts.ts` | `a068ec31eec35cd288525c77e83cd30e77eee695` |
| `src/app/compare.ts` | `03ba109855b80e9628a8055021ff73ac9a311540` |
| `src/app/fitting-session.ts` | `79d13341654ba9f4ae32f77dfbd82940df5e2d32` |
| `src/app/fitting.css` | `18ea45fd7bc6257b023ccabed0781d548de661d9` |
| `src/app/fitting.ts` | `bb8c9235c7e367f53d18c3cd7cd5f97f8dca8e00` |
| `src/app/legacy.ts` | `9b9dd1f720782ea9e97f80f82933d6c46937b22a` |
| `src/app/main.ts` | `5519fb48cf46d01abec46f91b139a847e4e69975` |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `1df4dd7e084fd760b7d740e7d63739bdcec00e45` |
| `src/fitting/cargo.ts` | `db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0` |
| `src/fitting/catalog.ts` | `57cd8b5deaa723e30736c1a5f9a9d70871c60a61` |
| `src/fitting/compile.ts` | `15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4` |
| `src/fitting/data/hulls.json` | `e3e58cae57d5868f3459c444f6543590899f1939` |
| `src/fitting/data/modules.json` | `8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d` |
| `src/fitting/types.ts` | `3d424945b306c669b6216bc56d1b00be6ee606d6` |
| `src/fitting/validate.ts` | `8b49296c785a5fa75edfd840ddf2c784ff93f74c` |
| `src/io/fitting-csv.ts` | `04780f50e258c773fe567ab321386bdf0e14d993` |
| `src/io/fitting-json.ts` | `f77387afd849d765ad24e8b2ba973637e6ad92a5` |
| `src/io/json.ts` | `1068b436e651c290bf14f4a81b103b188bffdcf5` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/model/v2/physics.ts` | `611cfb32566bf46128308357e6dc2224503d915a` |
| `src/model/v2/step.ts` | `b5eed666341800e1c085c476718ebfe28ffa91f5` |
| `src/model/v2/types.ts` | `a3d839c0837a3abe14a477945bae8f0d98f6e956` |
| `src/runner/fitting-run.ts` | `f6e6e22071a2641233484a0a573e9e175c2e93f9` |
| `src/runner/metrics.ts` | `7f43b033a956174d01d2ebb0249cdda118adb470` |
| `src/runner/mining-metrics.ts` | `dd3125d63322cc07cbaef504bcad1933be6debc7` |
| `src/runner/protocol.ts` | `7d6b7a95e2c11c775e4ce961c1a350f582d77268` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `8145e6149237b37148c37056d0c8966f8f918daf` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/fitting.ts` | `92042fa5db627550c9c0fe824cd75d3c5a38ba58` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/artifact-smoke.mjs` | `a30437d621ba60feeac718494439b3991c4e07f0` |
| `tests/browser/fitting.spec.ts` | `ee2c678e93a817514f8c276b062a7c3b970344ce` |
| `tests/browser/lab.spec.ts` | `10cd77037856ebb119161dbf6a6b289d971ac463` |
| `tests/fitting-long.mjs` | `b1210da55c15e09d11f21aeecda3d7811c42e6f4` |
| `tests/fitting-memory.mjs` | `1f35c7f02842cca147ef16df5e0eccb8847b020f` |
| `tests/fitting/bill.test.ts` | `7724b9de8980a9fedb2ace73bc9b90be3b1aed8c` |
| `tests/fitting/bounded-state.test.ts` | `ba419869f018c8422db9a3fc373523fa42733aed` |
| `tests/fitting/cargo.test.ts` | `3cfa32399765b681e8daa49874c884c88ede20ce` |
| `tests/fitting/catalog.test.ts` | `a817a29b7ef712bd5c8a20eeb3c12aa0da3e1986` |
| `tests/fitting/comparison.test.ts` | `492fb14ed6f023a314c90eb5af72954b1d309efd` |
| `tests/fitting/compatibility.test.ts` | `1f94ff58d2464b40cd6f0f2ad4d758b3521d76d4` |
| `tests/fitting/controller.test.ts` | `e2c1fb818a36c9fc7758b45adb37db16335d23e8` |
| `tests/fitting/fixtures/legacy-0.json` | `5e969149e2adaeb9a7811dc10a450cc7cf25276c` |
| `tests/fitting/fixtures/legacy-1.json` | `98c1716219ad17bdb7d46b74619f9f53a8ba625f` |
| `tests/fitting/fixtures/legacy-external.json` | `971d8e1837368020285c0f9d7bc3c6213e9360a4` |
| `tests/fitting/input-fixtures.ts` | `b6c2ad31b1c15149c409cd8862012c1f638d36d9` |
| `tests/fitting/input-guards.test.ts` | `38b884eed3f649f92f9504e09814d0982f4ab5ca` |
| `tests/fitting/io.test.ts` | `1f90266c8c196d260de907fecf02da4aa45167b7` |
| `tests/fitting/legacy.test.ts` | `7828ff24c2bfedea4f8ff635b2b8788686ff94e7` |
| `tests/fitting/matrix.test.ts` | `3fa7e51e8a2d839b2437df72fdda5d25f1f15bd1` |
| `tests/fitting/mining-metrics.test.ts` | `c6f5e394bbd52953865a33a4fce2a7ef5cac487e` |
| `tests/fitting/run-validation.test.ts` | `6fa4480599efd63f48194438e490d717df9b0e51` |
| `tests/fitting/scenarios.test.ts` | `b5d3fdba30804951802262dfad6ca25a3ddc42ce` |
| `tests/fitting/source-fidelity.test.ts` | `6c2f162d5c35c13a260342ed0e6ad349d68bd5a4` |
| `tests/fitting/test-spec.ts` | `5ef1e0f932818a3f0275575a365c96f9f2976bcc` |
| `tests/fitting/worst-fit.ts` | `70e48b70c0af9762eb1c1b345dde95f7032371f0` |
| `tests/long-kernel.test.ts` | `278de7b315a0a894ba9b4b20ca02e82137ff7be7` |
| `tests/model/fitting-dispatch.test.ts` | `bd0d83364d3fc78c18826626be98285f65ed6389` |
| `tests/model/fitting-drive.test.ts` | `c193815c0546ca443f55278aaa0f6eb6b4e89306` |
| `tests/model/fitting-energy.test.ts` | `0f5254d1e51896702d9d590f202bdf150f82a008` |
| `tests/model/fitting-refinement.test.ts` | `1d9164c4cdce5a37be750f2e3d24206e9da53b74` |
| `tests/model/fitting-stocks.test.ts` | `4b587883564c7df6f07e96dd254368e100a6a50a` |
| `tests/retention-memory.test.ts` | `e9c3f2d652fc26fb3f94f7b196bb82a63185c164` |
| `tests/runner.test.ts` | `71bb7286b55c00439ef3912fc00b7abdac6a4477` |
| `vite.config.ts` | `10e2c43ff8cb04792699695e9678d0d36c36d465` |

Changed paths относительно r2 (saved git diff, не новый source-read после freeze release):

| Path | Before blob | Current blob |
|---|---|
| `.memory-bank/activeContext.md` | `4c94f5a04e445a7e1226742d59bc8385ec5739a7` | `5d81da330e20674fcfc77f37916ee67ecdaf585b` |
| `.memory-bank/progress.md` | `68a86f3d6ee11c0c68b99e87569bbe8350a729f9` | `68f91b2dc7ee2d9cfd43fd24a1633205f74d54ea` |
| `docs/INDEX.md` | `1e31ef2e72456a09d98820d76a102344303a54d1` | `ba205e26b143d0ef5f1fc761f8c7f91a57d4e156` |
| `docs/reviews/2026-10-06-ship-fitting-code-review-r1.md` | `NEW` | `a621297d10795355bdd7c3e948f4992d8e9d1d45` |
| `docs/reviews/2026-10-06-ship-fitting-developer-fix-r2.md` | `NEW` | `4b9fa4dc7162ddd103486644bf7f715c3d592b3e` |
| `docs/reviews/2026-10-06-ship-fitting-qa-r2.md` | `NEW` | `8b58b7d543d8298108bb50f4ca79c78233fa69b2` |
| `docs/verification/ship-fitting-v0.2-code-review-contract.md` | `8566261f46d864e6212d4abaadc49b706e609ae1` | `8243df95b19ba0b813898fa8c59310db3b193d82` |
| `docs/verification/ship-fitting-v0.2-runtime-binding.json` | `090e5a9538c8de670eec08714b63b9918352297d` | `501c50a4274c83f94952f9dbbfa2ce2b2281d42c` |
| `src/fitting/validate.ts` | `671add1dd3302cd1c47852a9fc7c7f6ee74c3ee1` | `8b49296c785a5fa75edfd840ddf2c784ff93f74c` |
| `src/model/v2/step.ts` | `3b861c68aaa26960e76aca87bf0a74822be5b230` | `b5eed666341800e1c085c476718ebfe28ffa91f5` |
| `tests/browser/fitting.spec.ts` | `b243175b7747db4a161f55286bbf8c14b31a3deb` | `ee2c678e93a817514f8c276b062a7c3b970344ce` |
| `tests/fitting/input-fixtures.ts` | `NEW` | `b6c2ad31b1c15149c409cd8862012c1f638d36d9` |
| `tests/fitting/input-guards.test.ts` | `NEW` | `38b884eed3f649f92f9504e09814d0982f4ab5ca` |

Tested-Paths / executed surfaces: direct APIs `src/fitting/catalog.ts`, `src/fitting/validate.ts`, `src/fitting/compile.ts`, `src/scenarios/fitting.ts`, `src/model/v2/step.ts`, `src/io/fitting-json.ts`, `src/runner/run.ts`, `src/app/fitting-session.ts`, `src/runner/protocol.ts` + their bound numerical dependencies; actual extracted browser UI `src/app/fitting.ts`/`src/runner/worker.ts` and10bundled assets on3origins; own4scoped testfiles above. No read of Developer report as expected-value oracle.

## Signed evidence

Evidence manifest: `ship-fitting-qa-affected-r3-evidence.json`, SHA256 `46ef79a722368c49580357d1fd5707c4d731b5635262a84eaaf9a33e37901e67`; 30private preparation/probe/result/log/integrity files (включая initial adapter attempts), sealed readonly после assembly. Полные probe source остаются evidence artifacts, не дублируются в report.

| Evidence path | Bytes | SHA256 |
|---|---|
| `.overgate-runtime/qa-codeblocker-adapter-diagnose.log` | 5420 | `68e38c69bc9a82363e029ecd388b2d409383a68cac3a36a4cd72cfb25780cc49` |
| `.overgate-runtime/qa-codeblocker-adapter-diagnose.mjs` | 786 | `3eb4a78c0f614afb26661227bbd1ab110d825ae2370b878631283d74e1282535` |
| `.overgate-runtime/qa-codeblocker-assemble-report.py` | 21024 | `bfd0c0e4ff073631619ee9a0369da2b5c2aeb550f4e3d97134b3e137765079cc` |
| `.overgate-runtime/qa-codeblocker-binding-initial.py` | 5661 | `adb05d07d89c389b798a459850fe53f0b4d1196a5d4a3869da97d9e95ffc38ae` |
| `.overgate-runtime/qa-codeblocker-binding.json` | 38802 | `cf19d7450dc7caa20890dc92ec476d23125787e5acf7965e3fbe0271a136f8e7` |
| `.overgate-runtime/qa-codeblocker-binding.py` | 5605 | `4d1c76f85194241b43726f0bfca7ab2b9649a87b22b8fd3b087002a8ee3f95a1` |
| `.overgate-runtime/qa-codeblocker-browser-download-event.json` | 66457 | `6f9782f2703c633c35a2fc9c5e565314f985da7b535c0661fe3510417a203db1` |
| `.overgate-runtime/qa-codeblocker-browser-download-event.log` | 1188 | `5bebc11f7cf1a7ed7fb3693685413e7839f9548dd55bc9fb81f59bbb23c04b6a` |
| `.overgate-runtime/qa-codeblocker-browser-download-event.mjs` | 10995 | `4b367dd19bd844b2b478eec8368b5368f7a633e6ffbe1d8b1128e4ab1b9c64ba` |
| `.overgate-runtime/qa-codeblocker-browser-initial.json` | 36642 | `41318eb599c35ceaad44d996fcdb000f5812c5334dc386150ad362310ea2925e` |
| `.overgate-runtime/qa-codeblocker-browser-initial.log` | 822 | `129a3f8f75a99ac18795ccd5852a8ef15bdb60d3e9af62a2561f99cef0fdc1cf` |
| `.overgate-runtime/qa-codeblocker-browser-initial.mjs` | 10973 | `d15ffc2bb1667d285959a8407a25dfd4abdc0a7dceaa23a0f1ac626065d5e2f9` |
| `.overgate-runtime/qa-codeblocker-browser.json` | 107869 | `b458a8184e18d7519dec3e58df8b2dad004c7f8b2274d725803daa883f68c4fa` |
| `.overgate-runtime/qa-codeblocker-browser.log` | 566 | `ee206c2a93e9a10078556548b64c668b8af3fd1e62ca11b072e714a995635664` |
| `.overgate-runtime/qa-codeblocker-browser.mjs` | 11567 | `73d5cc6e258bd301b1b2bc0175d36a5224d8509faf93cc3206be2ab4a772fcbf` |
| `.overgate-runtime/qa-codeblocker-final-integrity.json` | 782 | `fdf4fc139b0dc36567327aa923b0b83bc4d5442545d43585b70deae53f79e3ba` |
| `.overgate-runtime/qa-codeblocker-fixtures.json` | 2016393 | `488109ba4aaf968ddd15dc113fc9b13fef21ee6d508e3772e8d500c9204d010e` |
| `.overgate-runtime/qa-codeblocker-methods-before-b2-clarification.md` | 13770 | `42a3a202d7125b2a747d15f7d0cde001b6ae46e2ee8a47305ba8ff858c0f01cf` |
| `.overgate-runtime/qa-codeblocker-methods.md` | 15174 | `b664ccbb288901bc3c74b25e07b318b8c9085f88cedcc4d2fe9ca4682e63f2c2` |
| `.overgate-runtime/qa-codeblocker-probes-initial.log` | 1467 | `7fd30b71f19472b88eab0f73d738edde76d332786a460facc0d671703ed1cac9` |
| `.overgate-runtime/qa-codeblocker-probes-initial.mjs` | 13051 | `7e0f18e69c911eb07b7c16e5a5a2ea0e25ebc50ca91ac5d827c5223116e9f3b2` |
| `.overgate-runtime/qa-codeblocker-probes-retry.log` | 255 | `dae973453500ece527089af96fb66862d1195d13a3d10074f01715586f8a5457` |
| `.overgate-runtime/qa-codeblocker-probes.log` | 1467 | `7fd30b71f19472b88eab0f73d738edde76d332786a460facc0d671703ed1cac9` |
| `.overgate-runtime/qa-codeblocker-probes.mjs` | 13165 | `a11d37ed42a4a6fc4537d29710c3cc9e4c2df68105fddc131041984ffaa5a44d` |
| `.overgate-runtime/qa-codeblocker-results-before-descriptive-metadata.json` | 49711 | `2e30a100f5beddd0f7b7ae8c887f20ea16d1735e683170c29f476d768e3d95df` |
| `.overgate-runtime/qa-codeblocker-results-final.json` | 50019 | `d1abdfa6097aa891dc53e3d0c579e7dc19290474cfe03c8542f91bb43982986b` |
| `.overgate-runtime/qa-codeblocker-results-initial.json` | 34083 | `f0b62fedec5d86f9402182270466303827557d9b42e1a4bb9f4b04a75d3e2659` |
| `.overgate-runtime/qa-codeblocker-results-retry.json` | 20271 | `ad88bd5c9fa21dd03970d3e8faf8552d506b24f26665d8373737aaef72b38046` |
| `.overgate-runtime/qa-codeblocker-results.json` | 34083 | `f0b62fedec5d86f9402182270466303827557d9b42e1a4bb9f4b04a75d3e2659` |
| `.overgate-runtime/qa-codeblocker-scoped-unit.log` | 219 | `922f616af39e38c59d92251eada113c546b5b990027673a009bccf76459f7312` |

— Signed: independent QA, Codex; exact provider model ID unavailable. Scope CR-B1/CR-B2 + explicit LAN-IP functional request, same QA session. Result PASS; BLOCKER=0/ADVISORY=0. External gates NOT RUN остаются открыты; QA не утверждает deployment/native/bootstrap/merge.
