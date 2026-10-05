# Ship Fitting v0.2 — независимый scoped Code Review r1

**Вердикт: CHANGES_REQUESTED. BLOCKER=2, новых ADVISORY=0.** Требуются исправления входной числовой schema и ложного завершения accepted v2 run. Два дефекта выявлены собственными адресными контрпримерами на замороженном candidate. Это один scoped Code Review после independent QA в существующей Reviewer session; повторное планирование и новые агенты не запускались.

Дата: 2026-10-06, Asia/Novosibirsk (завершение 00:23, 2026-10-05 17:23 UTC). Actual role: independent Reviewer, CODE_REVIEW, `.agents/RV_ROLE.md` v2.1 / PM lifecycle v3.0. Model: Codex; точный provider/model ID среда не сообщает, поэтому ID не выдуман. Подпись: `/root/fitting_adversarial_review`, independent Reviewer.

## Candidate, контракт и authority

Worktree: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`.
Exact source HEAD: `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac`.
Feature base: `6fb7166513627941e2ba2c4a9a01c79ae1667820`.
Repaired Developer source: `d54dd4bd6beaa92e532c2bf537bb3a05860c4c0b`; его report является explanation/evidence, не oracle.
Formal Review Contract: `docs/verification/ship-fitting-v0.2-code-review-contract.md`, прочитан до анализа; verdict token взят из него. Product authority: `docs/product/ship-fitting-v0.2-acceptance.md`, явное одобрение оператора принятого GDD/T1–T7.

Пять accepted WHAT/plan/source/VC blobs независимо сверены неизменными: **`550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`**. Исторический PLAN_READY r2 сохранён; план не пересматривался. Старые planning B1/B2 (fixed group и bounded metrics) закрыты; ниже используются отдельные IDs **CR-B1/CR-B2**. Исторические plan A1/A2 не расширяют текущий scope и здесь не переоценивались.

U2 source authority — frozen `cdc490e3517c8455f662f82579c45813cdbb9a76`. Неизменные synthesis/41-source manifest и source owner proof из предыдущего independent review этой session сохранены. Source selection опирается на INDEX/direct owner links, а не repository keyword search или старый U2 worktree. Новых исследований full game/production recipes нет. Source-backed cargo1.7, D/electric hybrid и ordinary SKU vs explicit reference variant проверены по принятому owner/AC и коду; lab hypotheses не объявляются новым каноном.

**Runtime binding независимо реконструирован из actual HEAD:** 81 explicit paths плюс полный текст `docs/verification/ship-fitting-v0.2-contract.md`. Content-Fingerprint **`25b73e117daa583617617dcb4c2fc25ae3e6acf74b3774dccfb1a8b093f4826c`**. Метод: SHA256 UTF-8 canonical JSON `{blobs:[{path,blob}],contract:{path,text}}`, пути sorted, keys sorted, separators compact, весь VC без excerpt. Полученный объект побайтово эквивалентен declared binding. Полная таблица actual paths/blobs ниже.

Artifact: ZIP `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/u2-lab-ship-fitting-v0.2.0-fix-r1.zip`; собственный SHA256 **`3f8467bc07b256a1c6435a900bad59bdf7410d86fe46ca68941d57c66cf37b49`**. Declared distDigest `a1d561744a60fb06b79b60b58ff442a515c33eb88bcd8e81429aa5e07c37e810`; artifact source fingerprint `8107ca70d7ad8c4b3aa797236a48cfa1a74fe8544bb8257539a1aea56a5ffe89`. Дайджест каждого extracted/origin asset повторно runtime не измерялся Reviewer: для этой части рассмотрено отдельное independent QA evidence, явно атрибутированное ниже.

## CR-B1 — BLOCKER: неполные числовые guards пропускают NaN в принятый run

**Адрес:** `src/fitting/validate.ts:121` (required family fields), `:141–149` (positive efficiency guards); `src/model/v2/step.ts:344–345` (electric conversion); `src/model/v2/physics.ts:169–178` (COP); import boundary `src/io/fitting-json.ts`. AC: SF01 complete finite numerics, SF08/SF10/SF11 finite energy/stocks/thermal ledger, SF18 trusted complete supported numerical snapshot.

Один общий schema defect имеет два независимых воспроизводимых входа. Это не предложение изменить допустимый fitting/баланс: импорт объявляет вход полноценным и допускает модель, которая немедленно портит физическое состояние.

1. `sputnik:1`; все четыре propulsion roles заменены явными local variants обычных `engine-electric-S-single`/`pair`. У каждого удалены `numerics.pathEfficiency` и соответствующий origin. Остальные поля, dry bill, typed graph и роли сохранены. `parseFitJson` → ok; `validateFit` → valid/complete/canRun=true; `makeMiningRun` → ok; `validateRunSpecV2` → ok; `parseExperimentJson` того же supported snapshot → ok. Первый `stepV2(spec, initialStateV2(spec), .01, {march:1})` даёт `NaN` в temperatureK, loadHostW, engineUsefulW, radiationOutW/radiationNetW, heatInW/heatOutW и energyResidualJ. Force остаётся2950000N. Required fields engine не включают pathEfficiency, хотя runtime безусловно использует его произведение с drive efficiency.
2. `sputnik:1`; Signature1 заменён явным local `thermoinverter-S` с `copEfficiency=0`, полноценным SI origin и остальными исходными данными. `validateFit` → valid/complete/canRun=true; `makeMiningRun` и supported `parseExperimentJson` → ok. Первый idle step .01s даёт `NaN` в chargeJ, fuelKg:diesel, temperatureK/currentMassKg и многих ledger channels. При нулевом COP выражение `q/cop` становится0/0. Общая проверка fraction[0,1] допускает0, отдельного >0 для thermoinverter нет.

В сохранённом JSON stdout `NaN` сериализован стандартным JSON.stringify как `null`; массивы `nonFinite` получены непосредственно через `Number.isFinite` на actual telemetry. Это не nullable штатный результат.

**Минимальный fix:** в общем `itemIssues` требовать для electric engine finite `pathEfficiency∈(0,1]` с provenance; для thermoinverter finite `copEfficiency∈(0,1]`. Сохранить существующие generator/primary efficiency checks и разрешённые zero-stock cases. Эти проверки должны одинаково закрывать fit/local variant и supported resolved numerical snapshot/replay до изменения действующей сборки. Не подставлять скрытые default efficiency и не лечить NaN постфактум clamp.

**Проверка closure:** адресные negative fixtures missing/zero electric pathEfficiency и zero thermoinverter copEfficiency на fit/import/run snapshot; ошибка с полем до запуска, last valid fit/run/result сохраняются. Положительные ordinary electric и finite-COP examples остаются finite и с закрытым ledger. Текущие tests/io/run-validation проходят, но этих двух negative domain cases в них нет.

## CR-B2 — BLOCKER: accepted положительный шаг выдаёт complete при нулевом времени

**Адрес:** `src/model/v2/step.ts:166–175` принимает любой finite physicsdt∈(0,1]; `src/runner/fitting-run.ts:109–116` для dt≤1e−10 выставляет done вместо расчёта/отказа; kernel `src/model/v2/physics.ts:17,79` использует тот же numerical epsilon. AC: корректное выполнение accepted SF07/SF18 scenario/run, точные measured horizon/time/throughput SF12/SF19 и обязательный numerical completion invariant.

**Контрпример:** обычный valid `fixture('sputnik:1')`, durationSeconds=1, stepSeconds=1e−12, неизменные остальные условия. `validateRunSpecV2` и `createRun` принимают spec. Первый `runChunk(run,1)` возвращает steps=0 и выставляет done=true; actual timeSeconds=0, ticks=0, несмотря на accepted1s horizon. Общий Worker/result путь использует done как complete. Дефицит ресурсов здесь не причина: физика вообще не выполнялась. Заявленный supported численный run молча завершается до своего горизонта.

**Минимальный fix:** согласовать supported dt domain между validator/runner/kernel. Неподдерживаемый положительный шаг должен отклоняться с точным path/reason до запуска; альтернативно расчёт должен действительно поддерживать принятый положительный шаг. Не выдавать complete при positive remaining horizon только из-за малого dt и не молча менять replay step. Scope fix — v2, exact legacy golden behavior сохраняется.

**Проверка closure:** адресный imported supported snapshot с step1e−12 отклоняется до запуска либо реально доходит до1s с согласованным ticks/time/metrics. Добавить boundary near numerical epsilon и обычный .01/.005/.0025 positive control; status complete возможен лишь при достигнутом горизонте, неподдерживаемое значение не удаляет предыдущий fit/result. Повторное выполнение12h этим guard change само по себе не требуется; тестировать affected numerical boundary и необходимые regressions.

## Что проверено независимо

Выполнен bounded review changed fitting/catalog/compile/cargo, v2 model/finite stock dispatch, scenario/online metrics, worker identity/backpressure, fitting UI/revision/IO/security и test coverage. Targeted diff выполнен от feature base только по принятой surface. Shared direct dependencies сопоставлены по exact blobs; `src/catalog/presets.ts`, legacy model/step/types, scheduler/thermal-gates, runner metrics/retention, charts/compare/styles и legacy scenario schema равны baseline. Legacy UI — исходный main без изменения его логики, плюс три строки явного sessionStorage legacy import; reviewed dispatch сохраняет v1 model/catalog values.

Generated experiment JSON прочитан структурно, без полного9MB textual dump: все7matrix series и13sensitivity cases, resolved fields/group/material rows/status/metrics; mass/C соответствуют declared dry bills (maximum observed floating C difference2.98e−8J/K при C261302033.5769822J/K, существенно внутри tolerance). Reviewed cargoM data: universal45082.189909896595kg/96SCU, bulk11136kg/192SCU; builtin recipe отдельно. Ordinary single/pair SKU clone не изменяется по роли; reference retro variants явно существуют в localVariants, preview/F3/export показывают derived0.4/provenance/material bill. D homogeneous electric+diesel generator разрешён с физическим контуром; E/A fuel guards сохраняются.

Собственные probes через source-bound Vite SSR на actual HEAD, Node **24.21.0**:

| Probe | Actual observation | Review result |
|---|---|---|
| Missing electric pathEfficiency | Fit/readiness/run/supported snapshot import приняты; первый step non-finite thermal/ledger | FAIL, CR-B1 |
| Zero thermoinverter COP | Fit/readiness/run/supported snapshot import приняты; первый step non-finite charge/fuel/mass/thermal/ledger | FAIL, CR-B1 |
| step1e−12 / horizon1s | Validator/createRun принимают; first chunk done=true/time0/ticks0 | FAIL, CR-B2 |
| Tiny positive battery1e−8J, zero source/hotel | beam4.5009e−9J = Qinitial×.9×.5001, Qfinal0, no source electric | PASS |
| Tiny positive battery1e−4J, zero source/hotel | beam4.5009e−5J, Qfinal0, no source electric | PASS |
| Tiny positive battery1J, zero source/hotel | beam.45009J, Qfinal0, no source electric | PASS |

Tiny-stock probes проверяют actual source energy против actual stock delta/beam, а не только internal residual. Residual каждого ≤1.46e−11J. Тот конкретный T7 battery-boundary regression закрыт в reviewed candidate.

Собственно выполнена узкая regression команда:
`npx vitest run tests/fitting/run-validation.test.ts tests/fitting/io.test.ts tests/fitting/legacy.test.ts --reporter=verbose` после source абсолютного env helper. **3files/10tests PASS**,301ms; в том числе три exact v1 golden state/metrics/spec replays. Это не full121suite/12h повтор. Test PASS не отменяет выявленные uncovered counterexamples.

Собственные tested entry paths: `tests/fitting/run-validation.test.ts`, `tests/fitting/io.test.ts`, `tests/fitting/legacy.test.ts`, три `tests/fitting/fixtures/legacy-*.json`, `tests/fitting/test-spec.ts`; directly exercised source APIs `src/fitting/catalog.ts`, `validate.ts`, `compile.ts`, `cargo.ts`, обе catalog JSON, `src/scenarios/fitting.ts`, `src/model/v2/step.ts`, `physics.ts`, `src/model/types.ts`, `scheduler.ts`, `thermal-gates.ts`, `src/catalog/schema.ts`, `src/runner/run.ts`, `fitting-run.ts`, `mining-metrics.ts`, `retention.ts`, `metrics.ts`, `src/io/fitting-json.ts`, `fitting-csv.ts`. Все actual git blobs приведены в81path таблице. Compile-time types и остальные файлы рассматриваются read-only по risk/dependency scope; таблица не означает каждый branch/line покрыт тестом.

Initial/current/final source freeze проверен: HEAD точный, `git status --short` пуст, scoped `git diff --check` exit0. Продуктовый код, requirements, tests, durable source files, Beads/Dolt/GitHub/commits Reviewer не изменял. Единственная durable запись Reviewer — этот ignored report; собственные probes/stdout в/tmp.

## Independent QA evidence — рассмотрено, не выдано за собственное исполнение

Получен immutable QA affected r2 `.overgate-runtime/ship-fitting-qa-affected-r2.md`, SHA256 **`b6b302a705ce0eb99d500e20e21c10b4e8f794b84321bc2a4f84a034018c70d3`**,68718B, independently checked. Evidence manifest SHA256 **`44ff1963201839443dc4da326b5513d884e1b6d8c90dc8a91947a5059998125c`**; все26sealedfiles независимо сверены по size/SHA, mismatches0. PR4 immutable publication: <https://github.com/komleff/u2-lab/pull/4#issuecomment-5999512907> (publication поручена/выполнена PM, Reviewer GitHub не мутировал).

QA report: исходные100cases, final99PASS/0FAIL/1externalSF20-05NOTRUN;10own affected groups+3own necessary regression groups, fresh own physical43200s/4320455ticks/118channels/21601buckets, integrated residual.0001036726579367311J, actual heap75894040B; fullcap34807+20000events actual126539040B<128MiB. Actual corrected ZIP/10assets наlocalhostHTTP/nonloopbackHTTP/localselfsignedTLS prefix3origins PASS; secondphysical/publicPages/native/bootstrap остаютсяNOTRUN. Fresh PM121unit/12browser+1screenshotSKIP/type/build — отдельно атрибутированное PM evidence.

QA source-backed F1cargoM/F2Dhybrid/F3hiddenSKU closes рассмотрены и согласуются с кодом и accepted source semantics. QA r1 FAIL history и r2 independent execution не переписываются. CR-B1/CR-B2 — дополнительные проверенные input-domain/completion gaps, которых в prepared QA100case set не было; они препятствуют Code Review APPROVED. Этот review не объявляет QA чужие команды своим исполнением.

## Не проверено / границы вывода

Не повторялись full121suite, full12h, actual heap/GC, slow Worker large-trace browser, all3origin browser execution; здесь рассмотрено sealed independent QA proof. Не выполнены operator/native/bootstrap/finalize, secondphysicaldevice/publicPages deployment/mainmerge, внешний Claude mock visual integration. Не пересматривались pipeline governance, full flight, market/ROI/detection/full game balance, production recipes. Ничего из этого не превращено в новый code blocker/advisory scope.

Вне двух отмеченных defects иных подтверждённых blockers в named surface не найдено. Это scoped statement, не universal correctness proof и не global merge readiness. После fixes необходим affected re-review **CR-B1/CR-B2 в этой же Reviewer session** с новым exact source/binding и independent affected QA; полный plan/governance/long-run reaudit не требуется автоматически.

## Полная actual reviewed binding surface

81 explicit acceptance paths: changed runtime/tests/data + accepted source/WHAT и direct shared dependencies. Для unchanged dependencies применена content-equivalence review; generated JSON parsed relevant records; coverage ограничена described named risks. Полный VC дополнительно включён целиком в fingerprint, а не только строкой пути.

| Actual path | Actual git blob |
|---|---|
| .github/workflows/verify.yml | e037b53e4e0cc99685b2bfd2912bc0fadc3f1536 |
| docs/experiments/ship-fitting-matrix.json | 7bfc29b46603bf3e67eefdb3f27f2c7623b3c8d2 |
| docs/experiments/ship-fitting-sensitivity.json | 64721a3b787bdcc6ab9b9f8b6f722091fef35a3b |
| docs/gdd/gdd_u2_ship_fitting_v0.2.md | eac9ece236840af775181d5936799df1e8cff2bd |
| docs/plans/2026-10-05-ship-fitting-v0.2.md | aa48875c5c40aae0b3b98f137c704edc11bd0b44 |
| docs/product/ship-fitting-v0.2-acceptance.md | 49d640538146c38114e195dae9d796074c785588 |
| docs/research/ship_fitting_source_synthesis.md | a98c69894d98c688a0c4b19d4e7f39ff44004a67 |
| docs/research/ship_fitting_sources.json | a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec |
| docs/verification/ship-fitting-v0.2-code-review-contract.md | 8566261f46d864e6212d4abaadc49b706e609ae1 |
| index.html | 616d3e500291d24f43d2ecdd96d4a054f2c2680e |
| package-lock.json | af0a9d91cb82c090ac960f32dee6dfbed37ff4ff |
| package.json | 8c4e0cd7fa3722937070955d20d65fe6668c698e |
| src/app/charts.ts | a068ec31eec35cd288525c77e83cd30e77eee695 |
| src/app/compare.ts | 03ba109855b80e9628a8055021ff73ac9a311540 |
| src/app/fitting-session.ts | 79d13341654ba9f4ae32f77dfbd82940df5e2d32 |
| src/app/fitting.css | 18ea45fd7bc6257b023ccabed0781d548de661d9 |
| src/app/fitting.ts | bb8c9235c7e367f53d18c3cd7cd5f97f8dca8e00 |
| src/app/legacy.ts | 9b9dd1f720782ea9e97f80f82933d6c46937b22a |
| src/app/main.ts | 5519fb48cf46d01abec46f91b139a847e4e69975 |
| src/app/styles.css | 831ca51d176678d70628aaad4e432185c0f18390 |
| src/catalog/presets.ts | 1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3 |
| src/catalog/schema.ts | 1df4dd7e084fd760b7d740e7d63739bdcec00e45 |
| src/fitting/cargo.ts | db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0 |
| src/fitting/catalog.ts | 57cd8b5deaa723e30736c1a5f9a9d70871c60a61 |
| src/fitting/compile.ts | 15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4 |
| src/fitting/data/hulls.json | e3e58cae57d5868f3459c444f6543590899f1939 |
| src/fitting/data/modules.json | 8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d |
| src/fitting/types.ts | 3d424945b306c669b6216bc56d1b00be6ee606d6 |
| src/fitting/validate.ts | 671add1dd3302cd1c47852a9fc7c7f6ee74c3ee1 |
| src/io/fitting-csv.ts | 04780f50e258c773fe567ab321386bdf0e14d993 |
| src/io/fitting-json.ts | f77387afd849d765ad24e8b2ba973637e6ad92a5 |
| src/io/json.ts | 1068b436e651c290bf14f4a81b103b188bffdcf5 |
| src/model/scheduler.ts | 79dfea044f13c224c65c8a914fd9f04c5c75ea3f |
| src/model/step.ts | 1ac60444582b26ff610eba6e3cd943c51a3a4285 |
| src/model/thermal-gates.ts | 55b0cd91c368016f2485d3ccbb3924ab915d0e3d |
| src/model/types.ts | e317006703d9f63a88018b13d26ac93c4648a749 |
| src/model/v2/physics.ts | 611cfb32566bf46128308357e6dc2224503d915a |
| src/model/v2/step.ts | 3b861c68aaa26960e76aca87bf0a74822be5b230 |
| src/model/v2/types.ts | a3d839c0837a3abe14a477945bae8f0d98f6e956 |
| src/runner/fitting-run.ts | f6e6e22071a2641233484a0a573e9e175c2e93f9 |
| src/runner/metrics.ts | 7f43b033a956174d01d2ebb0249cdda118adb470 |
| src/runner/mining-metrics.ts | dd3125d63322cc07cbaef504bcad1933be6debc7 |
| src/runner/protocol.ts | 7d6b7a95e2c11c775e4ce961c1a350f582d77268 |
| src/runner/retention.ts | 412803e9de6c2bfcfc5275060a8f439ed35c3782 |
| src/runner/run.ts | 8145e6149237b37148c37056d0c8966f8f918daf |
| src/runner/worker.ts | 7a74cd0f2a16999ff195aee1c24fc095d948a447 |
| src/scenarios/fitting.ts | 92042fa5db627550c9c0fe824cd75d3c5a38ba58 |
| src/scenarios/schema.ts | d10c5101743da454e1ce0b647bd791e87ee94a41 |
| tests/artifact-smoke.mjs | a30437d621ba60feeac718494439b3991c4e07f0 |
| tests/browser/fitting.spec.ts | b243175b7747db4a161f55286bbf8c14b31a3deb |
| tests/browser/lab.spec.ts | 10cd77037856ebb119161dbf6a6b289d971ac463 |
| tests/fitting-long.mjs | b1210da55c15e09d11f21aeecda3d7811c42e6f4 |
| tests/fitting-memory.mjs | 1f35c7f02842cca147ef16df5e0eccb8847b020f |
| tests/fitting/bill.test.ts | 7724b9de8980a9fedb2ace73bc9b90be3b1aed8c |
| tests/fitting/bounded-state.test.ts | ba419869f018c8422db9a3fc373523fa42733aed |
| tests/fitting/cargo.test.ts | 3cfa32399765b681e8daa49874c884c88ede20ce |
| tests/fitting/catalog.test.ts | a817a29b7ef712bd5c8a20eeb3c12aa0da3e1986 |
| tests/fitting/comparison.test.ts | 492fb14ed6f023a314c90eb5af72954b1d309efd |
| tests/fitting/compatibility.test.ts | 1f94ff58d2464b40cd6f0f2ad4d758b3521d76d4 |
| tests/fitting/controller.test.ts | e2c1fb818a36c9fc7758b45adb37db16335d23e8 |
| tests/fitting/fixtures/legacy-0.json | 5e969149e2adaeb9a7811dc10a450cc7cf25276c |
| tests/fitting/fixtures/legacy-1.json | 98c1716219ad17bdb7d46b74619f9f53a8ba625f |
| tests/fitting/fixtures/legacy-external.json | 971d8e1837368020285c0f9d7bc3c6213e9360a4 |
| tests/fitting/io.test.ts | 1f90266c8c196d260de907fecf02da4aa45167b7 |
| tests/fitting/legacy.test.ts | 7828ff24c2bfedea4f8ff635b2b8788686ff94e7 |
| tests/fitting/matrix.test.ts | 3fa7e51e8a2d839b2437df72fdda5d25f1f15bd1 |
| tests/fitting/mining-metrics.test.ts | c6f5e394bbd52953865a33a4fce2a7ef5cac487e |
| tests/fitting/run-validation.test.ts | 6fa4480599efd63f48194438e490d717df9b0e51 |
| tests/fitting/scenarios.test.ts | b5d3fdba30804951802262dfad6ca25a3ddc42ce |
| tests/fitting/source-fidelity.test.ts | 6c2f162d5c35c13a260342ed0e6ad349d68bd5a4 |
| tests/fitting/test-spec.ts | 5ef1e0f932818a3f0275575a365c96f9f2976bcc |
| tests/fitting/worst-fit.ts | 70e48b70c0af9762eb1c1b345dde95f7032371f0 |
| tests/long-kernel.test.ts | 278de7b315a0a894ba9b4b20ca02e82137ff7be7 |
| tests/model/fitting-dispatch.test.ts | bd0d83364d3fc78c18826626be98285f65ed6389 |
| tests/model/fitting-drive.test.ts | c193815c0546ca443f55278aaa0f6eb6b4e89306 |
| tests/model/fitting-energy.test.ts | 0f5254d1e51896702d9d590f202bdf150f82a008 |
| tests/model/fitting-refinement.test.ts | 1d9164c4cdce5a37be750f2e3d24206e9da53b74 |
| tests/model/fitting-stocks.test.ts | 4b587883564c7df6f07e96dd254368e100a6a50a |
| tests/retention-memory.test.ts | e9c3f2d652fc26fb3f94f7b196bb82a63185c164 |
| tests/runner.test.ts | 71bb7286b55c00439ef3912fc00b7abdac6a4477 |
| vite.config.ts | 10e2c43ff8cb04792699695e9678d0d36c36d465 |

Whole VC path: `docs/verification/ship-fitting-v0.2-contract.md`; actual git blob `314d1770363d642df4c2dec069a308b715911c58`; SHA256 полного UTF-8 текста `024d9e086cf6d14629c8c438f1939593c12b8e576b657b258121eaafcea22115`.

## Собственная воспроизводимая evidence

Probe `/tmp/ship-fitting-review-probe-r1.mjs`, SHA256 `a3db0941818c5b71b3ab9519344a8da9f81194e1bcf81cf2903b45ca5d923bcb`. Stdout `/tmp/ship-fitting-review-probe-r1.out.jsonl`, SHA256 `22a701d3f5c21933b96d49d0e48d722102ce8d0ef6077b7d553a84cc7e50a1c4`. Команда: `source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh && node /tmp/ship-fitting-review-probe-r1.mjs`. Ниже exact executed probe, чтобы опубликованный report оставался самодостаточным без/tmp. Source candidate проверяется по binding выше.

```javascript
import {createServer} from "/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/node_modules/vite/dist/node/index.js";
const root="/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2";
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false}});
try {
const {getPresetFit,loadCandidateCatalog}=await server.ssrLoadModule("/src/fitting/catalog.ts");
const {validateFit}=await server.ssrLoadModule("/src/fitting/validate.ts");
const {makeMiningRun}=await server.ssrLoadModule("/src/scenarios/fitting.ts");
const {validateRunSpecV2,initialStateV2,stepV2}=await server.ssrLoadModule("/src/model/v2/step.ts");
const {parseFitJson}=await server.ssrLoadModule("/src/io/fitting-json.ts");
const c=loadCandidateCatalog(),f=getPresetFit("sputnik:1");
for(const role of ["march","retro","strafe","turn"]){const i=f.instances[f.assignments[role]],m=structuredClone(c.items[`engine-electric-S-${["strafe","turn"].includes(role)?"pair":"single"}`]);m.id="local:missing-path:"+role;delete m.numerics.pathEfficiency;delete m.origins["numerics.pathEfficiency"];f.localVariants[m.id]=m;i.itemId=m.id;}
const parsed=parseFitJson(JSON.stringify(f),c),validated=validateFit(f,c),prepared=makeMiningRun(f,c,{durationSeconds:1});
let runValidation,physical;
if(prepared.ok){runValidation=validateRunSpecV2(prepared.value);const state=initialStateV2(prepared.value);const r=stepV2(prepared.value,state,.01,{march:1});physical={temperatureK:r.state.temperatureK,chargeJ:r.state.chargeJ,thrustN:r.telemetry.thrustN,energyResidualJ:r.telemetry.energyResidualJ,nonFinite:Object.entries(r.telemetry).filter(([k,v])=>!Number.isFinite(v)).map(([k])=>k)};}
console.log(JSON.stringify({case:"missing-electric-path-efficiency",parseOK:parsed.ok,fitValidation:validated,preparedOK:prepared.ok,runValidationOK:runValidation?.ok,physical},null,2));
const f2=getPresetFit("sputnik:1");
const ti=structuredClone(c.items["thermoinverter-S"]);ti.id="local:zero-cop";ti.numerics.copEfficiency=0;ti.origins["numerics.copEfficiency"]={kind:"experimental",sourceRef:"lab:review",unit:"1",note:"zero COP test"};
f2.localVariants[ti.id]=ti;f2.assignments["signature-1"]="fit:signature-1";f2.instances["fit:signature-1"]={id:"fit:signature-1",itemId:ti.id,enabled:true};
const prep2=makeMiningRun(f2,c,{durationSeconds:1});let phys2;
if(prep2.ok){const r=stepV2(prep2.value,initialStateV2(prep2.value),.01,{});phys2={nonFinite:Object.entries(r.telemetry).filter(([k,v])=>!Number.isFinite(v)).map(([k])=>k),temperatureK:r.state.temperatureK};}
console.log(JSON.stringify({case:"zero-thermoinverter-cop",fitValidation:validateFit(f2,c),preparedOK:prep2.ok,preparedError:prep2.ok?undefined:prep2.errors,phys:phys2},null,2));
const {fixture}=await server.ssrLoadModule("/tests/fitting/test-spec.ts");
for(const q of [1e-8,1e-4,1]){
const s=fixture("sputnik:1");s.resolvedShip.hull.hullPowerW=0;s.initial.chargeJ=q;
for(const i of s.resolvedShip.instances) if(i.item.family==="generator") i.enabled=false;
s.resolvedShip.resources.diesel.consumerIds=s.resolvedShip.resources.diesel.consumerIds.filter(id=>s.resolvedShip.instances.find(i=>i.id===id).item.family!=="generator");
const init=initialStateV2(s),r=stepV2(s,init,.01,s.scenario.phases[0].requests);
const beamJ=r.telemetry.beamW*.01,allowedBeamJ=q*.9*.5001;
console.log(JSON.stringify({case:"tiny-positive-battery",q,beamJ,allowedBeamJ,afterChargeJ:r.state.chargeJ,residualJ:r.telemetry.energyResidualJ,sourceElectricJ:(r.telemetry.generatorW+r.telemetry.solarW+r.telemetry.externalElectricW)*.01,withinStock:beamJ<=allowedBeamJ+1e-12&&r.state.chargeJ>=0},null,2));
}
const {parseExperimentJson}=await server.ssrLoadModule("/src/io/fitting-json.ts");
for(const [name,prep] of [["missing-electric-path-efficiency",prepared],["zero-thermoinverter-cop",prep2]]){
console.log(JSON.stringify({case:name+":supported-snapshot-import",parsedOK:prep.ok&&parseExperimentJson(JSON.stringify(prep.value)).ok},null,2));
}
const {createRun,runChunk}=await server.ssrLoadModule("/src/runner/run.ts");
const small=fixture("sputnik:1");small.stepSeconds=1e-12;const smallvalid=validateRunSpecV2(small);const smallrun=createRun("review:tiny-dt",small);const smallstep=runChunk(smallrun,1);
console.log(JSON.stringify({case:"accepted-tiny-step",validationOK:smallvalid.ok,requestedHorizon:small.durationSeconds,stepSeconds:small.stepSeconds,done:smallrun.done,actualSeconds:smallrun.state.timeSeconds,ticks:smallrun.metrics.ticks,step:smallstep.steps},null,2));
}finally{await server.close();}
```

Подпись: independent Reviewer `/root/fitting_adversarial_review`, Codex (exact model ID unavailable). Final verdict **CHANGES_REQUESTED**, active **CR-B1/CR-B2**, BLOCKER2.
