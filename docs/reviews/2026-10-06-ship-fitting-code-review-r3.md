# Ship Fitting v0.2 — affected Code Review r3

**APPROVED для уже реализованного CR-B2 affected scope. CR-B2 CLOSED; CR-B1 CLOSED сохраняется. BLOCKER=0, ADVISORY=0.** Это завершение прежнего review, не разрешение продолжать новые Lab features/fixes. Оператор явно переносит приоритет на Claude UI; отложенная hold mission/новые модели здесь не рассматриваются.

Actual role: independent Reviewer CODE_REVIEW, `.agents/RV_ROLE.md`v2.1/PMv3.0; та же session `/root/fitting_adversarial_review`, без новых агентов. Model: Codex; exact provider/model ID недоступен. Дата2026-10-06,Asia/Novosibirsk.
Exact source HEAD **`903d36b2ac4a2bfa90997803770ace13d520fbe9`**, worktree `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`, clean. Fix source `7d9460421e9a4b12e451c5add81f2785e9205309`. Prior affected review `0c5ead9f179f7e5dfae6db2e325959c7d4f08d13`, featurebase `6fb7166513627941e2ba2c4a9a01c79ae1667820`.

Formal Code Review Contract прочитан до анализа. **84actual paths + весь Verification Contract** независимо пересчитаны из exact HEAD; canonical sorted/compact UTF8 JSON `{blobs:[{path,blob}],contract:{path,text}}` SHA256 **`46ae5968310c61e731342a17ce7a2977540b6742c996692375b242a4a15b52d8`**, actual/declared object equal. Полная таблица ниже. Accepted WHAT5/wholeVC/source immutable по той же reviewed authority `550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`; U2 frozen `cdc490e3517c8455f662f82579c45813cdbb9a76`. План/source fidelity/B1 заново не открывались.

Artifact: `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/u2-lab-ship-fitting-v0.2.0-fix-r3.zip`, собственный SHA256 **`2c910bc3f203ba0c2ff809a34ad51fa3e0649e7177ec9a11c923f20b7df102bc`**. QA independently measured manifestSHA `842c8c7800483fd1eaa18f009cfac4b516c34874f20df3cf235427a2c519a15e`, distDigest `5b23d780c28adbcf8f946310561cd22c801f6e55f64b4904369edbeee6ec3f81`,artifact40source+wholeVCfp `2cc85b43685cca09dff252452420d6379824e44264ead1e27be561be81877559`. Origin/asset/browser commands ниже — independent QA evidence, не собственное browser исполнение Reviewer.

## Закрытие CR-B2

Reviewed delta только: `src/model/v2/physics.ts`, `src/model/v2/step.ts` (comment), `src/runner/fitting-run.ts`, новый `tests/fitting/time-integration.test.ts`, структурно refreshed7matrix/13sensitivity records. Kernel интегрирует все положительные clipped tails; stock epsilon больше не обрывает физическое время. Runner завершает по actual elapsed horizon, без absolute1e−8 раннего complete и присваивания недосчитанному состоянию horizon; no-progress/non-positive remainder до horizon даёт явный error. Clock kernel согласуется сdt после завершённого интегрирования, а полнота work/energy проверена отдельным oracle. Номинальные допустимые input domains не меняются; positive clipped kernel intervals не отбрасываются.

**Собственные source-based probes11PASS**, Node24.21.0/ViteSSR на exactHEAD:

| Проверка | Actual completion / independent oracle |
|---|---|
| dt1.0001e−10/H2e−10 | Первый chunk notdone,time=measured1.0001e−10; final2ticks,time=measured2e−10;work1.25025e−11SCU=R×H |
| dt2e−10/H1e−8 | Первый notdone; final50ticks,time=measured1e−8;work6.251249999999991e−10 vs6.25125e−10 expected |
| dt.01/H.01+5e−12 и +5e−11 | Первый notdone; tail действительно mined/measured, final2ticks/time=measuredH, fullR×H |
| dt.01/.005/.0025,H.025 | fullR×H=.0015628125SCU; elapsed=measured.025, finite;3/5/11retained actualticks (последний включает положительный floating tail) |
| work.013→idle.007,H.018,chunk1/2/32 | Все3 batching runs согласованы: elapsed=measured.018,work.0008126625SCU=R×.013 |
| Internal battery-empty split:dt2e−10,stock for1.5e−10 | Full measured2e−10;actualwork9.376875e−12=R×1.5e−10,requested1.25025e−11=R×dt,Qfinal0; finite ledger |

Oracle R=.0625125SCU/s из declared CivilS3MW×.5001/24MJ; tiny relative comparison1e−12, без max(1,expected), поэтому прежние49.995%/98% shortfalls не скрываются. State clock/metric duration/actual work проверены отдельно. Closed input guards/B1 и ранее допустимые ordinary cases сохраняются.

Собственный focused command: `npx vitest run tests/fitting/time-integration.test.ts tests/fitting/legacy.test.ts --reporter=verbose` после absolute env source; **20tests/2filesPASS**,260ms. Включены17durable completion regressions и3exactv1 state/metrics/spec golden replays. Это не собственный повтор всего163suite/13browser/12h.

Own probe `/tmp/ship-fitting-review-probe-r3.mjs` SHA256 **98e53306f3980ab0b05e863e0025c245fd0f3978369467cd485b896025c557a4**; stdout `/tmp/ship-fitting-review-probe-r3.out.json` SHA256 **aa98978509e9d42adb86e2383b977b696b0e506957ff0c07dbf05cde5c3df5fc**. Команда `source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh && node /tmp/ship-fitting-review-probe-r3.mjs`. Actual tested entries: privateprobe, time-integration.test, legacy.test, test-spec/3legacyfixtures; source APIs fitting/catalog/scenario/v2kernel/runner/metrics/retention. Actual reviewed delta выше; прочие84bound paths проверены для unchanged identity/carryover, без повторной broad review всехbranches.

## Independent QA и carried evidence

QA r4 immutable `.overgate-runtime/ship-fitting-qa-affected-r4.md`,21901B,SHA256 **`704254bd2f0155a0b00550855e3a6f2bfb2da5d24919d10176d19e3b58280c56`**. ManifestSHA **`e73bbf54b018aa7b41701d145524558acbbd20326794db8a98ba3fda8e3226f5`**; все23sealedfiles самостоятельно hash/size checked,mismatches0.13preparedgroupsPASS,64nominal/chunk runs,7matrix series,12refinement runs,9actualWorker completions и atomic imports/3actualorigins PASS. QA не подменён Developer report/tablet explanation.

Из-за kernel change QA выполнил **fresh current v2 actual12h**: elapsed=measured43200s,4320455ticks,118channels/21601buckets/allchannelpeaks preserved; SCU1256.6828988994616; residual.00010367296159427466J; actualGC75913416B. Full-cap34807buckets/20000events heap126534336B<128MiB. Эти результаты прочитаны из immutable QA, повторно Reviewer не запускались.

Actual extracted nonloopbackHTTP192.168.68.65:4183 /localhost4183/localselfsignedHTTPS4184/u2-lab: Start/Pause/Reset/newfit/Step и9Workercompletion probes PASS; maxACK19.8ms,network/errors0,all10assetSHA/origin matched. Physical PO сообщил прежний fix-r2 page+Start/time/resultsPASS; fullcontrols/currentfix-r3 physical device **NOTRUN**, исходная white-page причина не установлена. PublicPages/native/bootstrap/finalize/operator merge остаются отдельными **NOTRUN** gates.

R1 SHA774b54fb8d3f322ade421f95f1f723ada318f6d6ee170fe2002553937764c8c1 и r2 SHA6e3b9c141ecffda209325ff26aa2e9b68a268d2d6dfddfbe088717282e24eee9 independently unchanged. CR-B1 closure переносится по unchanged validator/catalog/IO; accepted WHAT/legacy sources не изменились. Никаких source-fidelity/model feature changes не предписывается.

## Limits / release

Не выполнялись новые Lab features/hold mission/Aurora route/refuel, whole100case/governance/source research audit, UI redesign/layout/style/Claude visual integration, физический текущийartifact/fulldevicecontrols,publicdeploy/native/operator merge. Нет новых findings/automatic advisory expansion. Global readiness/merge authorization не утверждается.

Reviewer не менял runtime/tests/requirements/Beads/GitHub/commits; только ignored report и/tmpprobes. FinalHEAD903/statusclean; live probes завершены. Old Lab review sealed; source freeze released. Следующая независимая работа этой session — отдельный PLAN_REVIEW Claude UI, с отдельным контрактом/вердиктом.

## Exact84path binding

| Actual path | Actual git blob |
|---|---|
| .github/workflows/verify.yml | e037b53e4e0cc99685b2bfd2912bc0fadc3f1536 |
| docs/experiments/ship-fitting-matrix.json | 249226c0b8b29bc00a4902282569087b28f9a634 |
| docs/experiments/ship-fitting-sensitivity.json | 7778e9766062c1b52769d54eb80f9810d88a24a1 |
| docs/gdd/gdd_u2_ship_fitting_v0.2.md | eac9ece236840af775181d5936799df1e8cff2bd |
| docs/plans/2026-10-05-ship-fitting-v0.2.md | aa48875c5c40aae0b3b98f137c704edc11bd0b44 |
| docs/product/ship-fitting-v0.2-acceptance.md | 49d640538146c38114e195dae9d796074c785588 |
| docs/research/ship_fitting_source_synthesis.md | a98c69894d98c688a0c4b19d4e7f39ff44004a67 |
| docs/research/ship_fitting_sources.json | a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec |
| docs/verification/ship-fitting-v0.2-code-review-contract.md | f2cd50f16c366662ee63833cbd8e0e32f026170e |
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
| src/fitting/validate.ts | 8b49296c785a5fa75edfd840ddf2c784ff93f74c |
| src/io/fitting-csv.ts | 04780f50e258c773fe567ab321386bdf0e14d993 |
| src/io/fitting-json.ts | f77387afd849d765ad24e8b2ba973637e6ad92a5 |
| src/io/json.ts | 1068b436e651c290bf14f4a81b103b188bffdcf5 |
| src/model/scheduler.ts | 79dfea044f13c224c65c8a914fd9f04c5c75ea3f |
| src/model/step.ts | 1ac60444582b26ff610eba6e3cd943c51a3a4285 |
| src/model/thermal-gates.ts | 55b0cd91c368016f2485d3ccbb3924ab915d0e3d |
| src/model/types.ts | e317006703d9f63a88018b13d26ac93c4648a749 |
| src/model/v2/physics.ts | ab8a765826db1f035769327ee3a0a526d5ff73af |
| src/model/v2/step.ts | 5b403a856c0c04869e2a511d797f94eef0fd1b50 |
| src/model/v2/types.ts | a3d839c0837a3abe14a477945bae8f0d98f6e956 |
| src/runner/fitting-run.ts | 9bee614bd5be7eba1f4504224b1f8465996da630 |
| src/runner/metrics.ts | 7f43b033a956174d01d2ebb0249cdda118adb470 |
| src/runner/mining-metrics.ts | dd3125d63322cc07cbaef504bcad1933be6debc7 |
| src/runner/protocol.ts | 7d6b7a95e2c11c775e4ce961c1a350f582d77268 |
| src/runner/retention.ts | 412803e9de6c2bfcfc5275060a8f439ed35c3782 |
| src/runner/run.ts | 8145e6149237b37148c37056d0c8966f8f918daf |
| src/runner/worker.ts | 7a74cd0f2a16999ff195aee1c24fc095d948a447 |
| src/scenarios/fitting.ts | 92042fa5db627550c9c0fe824cd75d3c5a38ba58 |
| src/scenarios/schema.ts | d10c5101743da454e1ce0b647bd791e87ee94a41 |
| tests/artifact-smoke.mjs | a30437d621ba60feeac718494439b3991c4e07f0 |
| tests/browser/fitting.spec.ts | ee2c678e93a817514f8c276b062a7c3b970344ce |
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
| tests/fitting/input-fixtures.ts | b6c2ad31b1c15149c409cd8862012c1f638d36d9 |
| tests/fitting/input-guards.test.ts | 38b884eed3f649f92f9504e09814d0982f4ab5ca |
| tests/fitting/io.test.ts | 1f90266c8c196d260de907fecf02da4aa45167b7 |
| tests/fitting/legacy.test.ts | 7828ff24c2bfedea4f8ff635b2b8788686ff94e7 |
| tests/fitting/matrix.test.ts | 3fa7e51e8a2d839b2437df72fdda5d25f1f15bd1 |
| tests/fitting/mining-metrics.test.ts | c6f5e394bbd52953865a33a4fce2a7ef5cac487e |
| tests/fitting/run-validation.test.ts | 6fa4480599efd63f48194438e490d717df9b0e51 |
| tests/fitting/scenarios.test.ts | b5d3fdba30804951802262dfad6ca25a3ddc42ce |
| tests/fitting/source-fidelity.test.ts | 6c2f162d5c35c13a260342ed0e6ad349d68bd5a4 |
| tests/fitting/test-spec.ts | 5ef1e0f932818a3f0275575a365c96f9f2976bcc |
| tests/fitting/time-integration.test.ts | 650894dd5bfe3e57840ff6690496ff961c8c3ebb |
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

EntireVC `docs/verification/ship-fitting-v0.2-contract.md`,blob `314d1770363d642df4c2dec069a308b715911c58`,SHA256 fullUTF8text `024d9e086cf6d14629c8c438f1939593c12b8e576b657b258121eaafcea22115`.

Подпись independent Reviewer `/root/fitting_adversarial_review`, Codex(exact model ID unavailable). **APPROVED affected CR-B2; BLOCKER0/ADVISORY0.**
