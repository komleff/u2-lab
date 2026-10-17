# Ship Fitting v0.2 — affected Code Review r2

**CHANGES_REQUESTED. BLOCKER=1; новых ADVISORY=0. CR-B1 CLOSED, CR-B2 OPEN (частично исправлен).** Проверены только исправления двух r1 blockers, допустимые input/time boundaries, необходимые exactv1/carryover доказательства. Unequal accepted step/horizon сохраняет тот же false-completion defect CR-B2; это не новый work item или scope.

Дата2026-10-06, Asia/Novosibirsk; UTC observation2026-10-05 18:12. Actual role: independent Reviewer CODE_REVIEW, `.agents/RV_ROLE.md`v2.1 / PMv3.0. Model: Codex; exact provider/model ID средой не сообщается. Подпись `/root/fitting_adversarial_review`, та же independent Reviewer session, без дополнительных агентов. Execution handshake получен после immutable independent QA r3. Prepare-only стадия до него использовала только чтение; runtime probes разрешены/выполнены после handshake.

## Exact identity / scope

Worktree `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`; frozen HEAD **`0c5ead9f179f7e5dfae6db2e325959c7d4f08d13`**, clean. Guard source `a9f3a84ff6fa42b5c830bceb965a7812feb1ffbb`. Prior reviewed source `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac`; feature base `6fb7166513627941e2ba2c4a9a01c79ae1667820`.
Formal Review Contract `docs/verification/ship-fitting-v0.2-code-review-contract.md` прочитан целиком; current PO overlay `docs/product/ship-fitting-v0.2-acceptance.md`. Последнее PO steering исключает visual/layout/style/interface redesign до Claude mocks. Новых UI advisories/полировки нет.

**83 actual paths + весь VC независимо реконструированы:** SHA256 canonical UTF8 JSON `{blobs:[{path,blob}],contract:{path,text}}`, sorted paths/keys, compact separators; fingerprint **`bb3b442f129483a15e1b1e2929c188fb391dc8a225a7cedda91daecb3881eefe`**, declared/actual object equal. Таблица ниже. Accepted5WHAT/plan/source + entireVC fingerprint **`550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`** независимо unchanged; frozen U2 source `cdc490e3517c8455f662f82579c45813cdbb9a76`. План/source authority/полный набор SF01–20 заново не пересматривались.

Build reference: guard-only candidate ZIP `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/u2-lab-ship-fitting-v0.2.0-fix-r2.zip`, собственный SHA256 **`4efe485b200d456705b84429ee8dbe42fe8a6f1a1f50f06e835437008c0e4970`**,89428B. Declared distDigest `5f18d8d6cb13cd7fa44b1307b8ee50e2998fdec5c11cf6a5228084734d387ba2`; artifact40paths+wholeVC fp `42767008891dbb09d64367956d30c604920fa0916e820af8e0f79c238c47c921`; manifestSHA `917b94cb56f91f98c85ba40d270ea16d611d9a29c761b8bf8c7e2a4753af8b8f`. Origin/asset runtime measurements атрибутированы independent QA, не собственному browser исполнению Reviewer.

Immutable r1 report `.overgate-runtime/ship-fitting-code-review-r1.md` SHA256 **`774b54fb8d3f322ade421f95f1f723ada318f6d6ee170fe2002553937764c8c1`** повторно сверён unchanged. Этот affected report не переписывает исходную историю FAIL.

## CR-B1 CLOSED

Изменения `src/fitting/validate.ts` добавляют условно required electric pathEfficiency; коэффициенты electric pathEfficiency и thermoinverter copEfficiency принимаются только finite∈(0,1], precise field path; существующие numeric SI origin guards остаются общими для fit и resolved snapshot validator. Не вводится default/clamp и не затрагиваются рецептуры/zero-stock правила.

Собственные independent probes проверили14negative variants: для каждого коэффициента missing,0,negative,>1,NaN,Infinity и valid numeric без origin. Все отвергнуты на fit/readiness, parseFitJson, makeMiningRun, validateRunSpecV2, known supported parseExperimentJson, unknown-catalog explicit snapshot replay и createRun; field diagnosis совпадает. Четыре positive controls (каждый коэффициент.45 и1) дают finite state/ledger, actualdt.01s, residual≤2.352e−7J<.001J, roundtrip без hidden coefficient substitution. Две failed local-variant session apply сохраняют fitRevision/current fit/live resolved spec/frozenA побайтово.

Independent QA r3 отдельно измерил browser atomic refusal и положительную физику наactual3origins. Исходные r1 missing-electric/COP0 inputs закрыты; подтвердившихся остаточных CR-B1 defects в affected scope нет.

## CR-B2 OPEN — BLOCKER: unequal supported boundary всё ещё подменяет рассчитанное время

Исходный1e−12 step и отдельный tiny horizon теперь отвергаются на exact field до импорта/создания context. Собственные6boundary negatives (ниже/включая1e−10 по step и horizon) PASS. Это закрывает исходную admission часть CR-B2, но заявленный supported domain `(1e−10,1]`step/horizon`>1e−10` остаётся несогласован с completion.

**Адрес:** `src/model/v2/step.ts:166–179` (новый supported domain), неизменный `src/runner/fitting-run.ts:154–156` (absolute1e−8 completion + принудительная запись horizon). Также учитывать `fitting-run.ts:109–116`/kernel time epsilon при обработке final clipped remainder. Source AC/инвариант остаётся из r1: accepted SF07/SF18 run, честное measured time/SCU/h/cycle SF12/SF19 и numerical completion. Классификация BLOCKER, не advisory: accepted run получает complete с недосчитанным физическим временем/выдачей и несогласованными clock/metrics.

**Собственный контрпример:** обычный `fixture('sputnik:1')`, начальный charge1e9J для full-powerCivilS mining, неизменный beam24MJ/SCU процесс, horizon иdt ниже. Validator/createRun принимают оба. Первый `runChunk(run,1)` даёт:

| Accepted dt / horizon | Actual steps/ticks | State time после принудительной записи | Measured metrics.durationSeconds | Actual SCU / expected full horizon | Result |
|---|---|---|---|---|---|
| 1.0001e−10 / 2e−10s | 1/1 | 2e−10s | 1.0001e−10s | 6.251875125e−12 /1.25025e−11 (−49.995%) | complete |
| 2e−10 /1e−8s | 1/1 | 1e−8s | 2e−10s | 1.25025e−11 /6.25125e−10 (−98%) | complete |

Expected rate — accepted fully-powered CivilS `3MW×.5001/24MJ=.0625125SCU/s`. Work фактически соответствует одному обработанномуdt, а не объявленному горизонту. После первого step абсолютный done tolerance1e−8s покрывает весь tiny horizon, state time искусственно заменяется его концом. Поэтому simple state==horizon check не удостоверяет closure: raw processed metric duration/steps/SCU противоречат ему. Ни depletion, ни thermal/cargo stop здесь не причина.

**Минимальный fix:** согласовать completion/accepted time domain с фактически интегрированным временем. Supported unequal boundary должен полностью обрабатываться с согласованными state time, measured duration и analytical work либо неподдерживаемая комбинация должна отвергаться последовательно до запуска/импорта. Не объявлять complete только из absolute1e−8 proximity и не присваивать horizon недосчитанному состоянию. Положительный final clipped remainder ниже kernel cutoff тоже требует согласованной обработки, а не ещё одного premature done. Не менять legacy numerical semantics.

**Closure oracle:** обе unequal пары выше; dt<horizon и final clipped remainder; исходные below/at cutoff refusals; ordinarydt.01/.005/.0025 с clipped horizon.025; exactv1goldens. Проверять actual metrics.duration/SCU/ticks и состояние до/после chunk, не только записанный финальный clock. Это targeted продолжение CR-B2 в этой session; полного review/плана/visual scope не требуется.

## Собственное исполнение / evidence

Node24.21.0, absolute env helper `/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh`; Vite SSR загружает actual source в замороженном clean worktree. `/tmp/ship-fitting-review-probe-r2.mjs` и stdout `/tmp/ship-fitting-review-probe-r2.out.json` содержат31observations:14negative B1PASS,4finitepositivePASS,2atomicPASS,6tinytime refusalsPASS,3ordinary unequal positivePASS,2accepted micro unequalFAIL. Probe не подменяет expected Developer explanation.

Ordinarydt.01/.005/.0025,horizon.025: соответственно3/5/10ticks, measured.025s (последняя floating difference3.47e−18s), work.0015628125SCU; first chunk не complete. Это positive regression и не основание закрыть micro-boundary FAIL.

Собственная команда `npx vitest run tests/fitting/input-guards.test.ts tests/fitting/legacy.test.ts --reporter=verbose`: **2files/28testsPASS**,406ms; три exactv1golden state/metrics/spec сохраняются. Новые correlated near-boundary unit controls используют dt==horizon либо horizon<ordinarydt; unequal microstep/horizon case в них отсутствует. Existing green tests не заменяют собственный failing oracle.

Actual affected reviewed paths: `src/fitting/validate.ts`, `src/model/v2/step.ts`, `tests/fitting/input-fixtures.ts`, `tests/fitting/input-guards.test.ts`, functional diff `tests/browser/fitting.spec.ts`, formal contract/binding; named dependency `src/runner/fitting-run.ts`. Собственные tested entries — privateprobe, `tests/fitting/input-guards.test.ts`, `tests/fitting/legacy.test.ts`, `tests/fitting/test-spec.ts`, inputfixtures и3legacyJSON; exercised fitting/compile/cargo/catalog/scenario/v2/runner/IO/session APIs. Остальные83bound paths проверены по current blob/content-equivalence для carryover, а не заново целиком/всем branches. Explicit actual blobs ниже.

Post-validator body `initialStateV2` onward в `src/model/v2/step.ts` независимо побайтово равен r1, SHA256 **`d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08`**. Physics/kernel, runner, metrics/protocol, IO/UI/legacy, catalog data и7+13matrix JSON blobs unchanged. Поэтому actual r2 physical12h/GC/default numerical evidence переносится для тех же ordinary inputs; новое12h исполнение не заявляется и не закрывает данный вне той матрицы boundary.

## Independent QA r3 / ограничения

Final QA r3 `.overgate-runtime/ship-fitting-qa-affected-r3.md`,37178B,SHA256 **`a2b83530204554c9301dd9f71550e6a7da30b611c18423946de9a4e8ce650545`**; evidence manifestSHA **`46ef79a722368c49580357d1fd5707c4d731b5635262a84eaaf9a33e37901e67`**. Все30sealedfiles independently size/hash checked,mismatches0. Immutable publication PM: <https://github.com/komleff/u2-lab/pull/4#issuecomment-6000265200>. Draft superseded QA hash не используется.

QA:13prepared owncasesPASS,35scopedunitPASS,3actualfunctionalbrowseroriginsPASS — nonloopbackHTTPsecure=false/randomUUIDundefined, Start/timeadvancement/Pause/Reset/newfit/Step.01→.02, invalid import atomicity/no newstart,10assetbytes/origin,errors0. Эти измерения — самостоятельное QA evidence. Reviewer browser/full suite/12h не повторял. QA13preparedcase ledger остаётся исторически PASS; unequal accepted cross-boundary pair в нём не измерялась, собственный CR-B2 FAIL не переписывает её результаты и препятствует APPROVED.

OUT/NOTTESTED: interface visual/layout/style redesign, Claude mock integration, broadnewrisk/general100case repeat, governance/native/bootstrap/operator mainmerge/publicPages deployment/secondphysicaldevice, fullgameflight/market/detection/balance. Новых требований или UI advisories нет. Трекер/GitHub/requirements/runtime/tests/commits Reviewer не изменял; ignored report и/tmpprobes — единственные записи. Signedr1 unchanged; final HEAD0c5ead9/statusclean/scoped diffcheckPASS. Все live probes завершены, source freeze можно отпустить soleDeveloper для targeted CR-B2 closure. Следующее re-review only CR-B2 в той же session после independent affectedQA.

## Exact83path binding

Полный bound acceptance set, including unchanged carryover paths; не утверждение повторного покрытия каждой строки.

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
| docs/verification/ship-fitting-v0.2-code-review-contract.md | 8243df95b19ba0b813898fa8c59310db3b193d82 |
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
| src/model/v2/physics.ts | 611cfb32566bf46128308357e6dc2224503d915a |
| src/model/v2/step.ts | b5eed666341800e1c085c476718ebfe28ffa91f5 |
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

WholeVC `docs/verification/ship-fitting-v0.2-contract.md`,actualblob `314d1770363d642df4c2dec069a308b715911c58`,SHA256 entire UTF8text `024d9e086cf6d14629c8c438f1939593c12b8e576b657b258121eaafcea22115`.

## Минимальная самодостаточная репродукция открытого CR-B2

Команда собственного полногоprobe: `source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh && node /tmp/ship-fitting-review-probe-r2.mjs`; probeSHA256 `d97f2cae4cc9973ddd51d70739fc97f3e58f5f78c274977428d76c9291c2b520`; stdoutSHA256 `f73787d746a5e5c44204172b2ccfdcc2460c0a2eeb8954e275ed20671ff34402`. Сохранить следующий bounded extract в/tmp и выполнить тем же Node24 env в exact worktree:

```javascript
import {createServer} from "/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/node_modules/vite/dist/node/index.js";
const root="/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2";
const server=await createServer({root,configFile:false,server:{middlewareMode:true,hmr:false}});
try {
 const {fixture}=await server.ssrLoadModule("/tests/fitting/test-spec.ts");
 const {createRun,runChunk,result}=await server.ssrLoadModule("/src/runner/run.ts");
 for(const [dt,horizon] of [[1.0001e-10,2e-10],[2e-10,1e-8]]) {
  const s=fixture("sputnik:1");s.initial.chargeJ=1e9;s.stepSeconds=dt;s.durationSeconds=horizon;
  const r=createRun("boundary",s);const chunk=runChunk(r,1);
  console.log({dt,horizon,steps:chunk.steps,ticks:r.metrics.ticks,state:r.state.timeSeconds,
    measured:r.metrics.durationSeconds,scu:r.metrics.usefulWork,expectedScu:.0625125*horizon,status:result(r).status});
 }
}finally{await server.close();}
```

Подпись: independent Reviewer `/root/fitting_adversarial_review`, Codex (exact model ID unavailable). **CHANGES_REQUESTED: CR-B1CLOSED/CR-B2OPEN; BLOCKER1.**
