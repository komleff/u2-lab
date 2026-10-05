# QA EXECUTION — Product metadata supplement

Result: **PASS for docs-only affected surface**. Current README/status metadata accurately describes the published product QA/scoped Review and preserves full bootstrap/operator gates. Runtime acceptance evidence is inherited from the unchanged tested code; no new runtime execution is claimed.

- Role: independent QA under installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5, no new agent/launch.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `820a21dbc2fbe21ee72e79385cd6a5d7a80e0551`; tree `6ca5d5008c95f46b879c9391c054bc8e80fffaae`; branch `feat/power-heat-lab`; worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Source: unchanged `docs/product/power-heat-lab-v0.1.md`; entire exact `docs/verification/power-heat-v0.1-contract.md` below, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Previous execution report: `docs/reviews/2026-10-05-product-review-fix-qa.md`, exact unchanged SHA256 `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46`, actual runtime tested candidate `a450d45058890cd9ac6eaeac5aa34b2f1cc84859`.
- Prior57-path+entire-VC fingerprint: `aae87f0318298e6ca957b928c549a59d32c971cd24d0765ac9ef0186b105d60c`.
- Current57-path+entire-VC Content-Fingerprint: `c0b62eab738cf4d8e90b5c05d8892e41e0e77fec18cf3a2244dd93dd25d7afea`.

## Docs-only case matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| M01 README current status and launch instructions | P1/source scope | Semantic diff against actual QA/RV reports; byte-compare launch/gate sections | PASS | Status38/pending→54unit/5browserPASS/1screenshotSKIP, independent12h134.916s and affected scopedAPPROVED/0blockers match immutable reports. All text from OverGate/bootstrap paragraph onward, including clone/npm/staticLAN commands and experimental/merge guards, is byte-identical to a450. Full bootstrap/operator acceptance and merge readiness explicitly not claimed. |
| M02 Unchanged runtime/evidence package | P1–P14/evidence binding | Compare each previous57 candidate Git blob with current and worktree; source/test/data/dependency diff | PASS | Only README blob changes `5b538b06b50719e7a900bc6057f84db32b94acb4`→`7b283d04d6d80d29dedf16861b579b1d0c8ab4a0`; all56others identical. Allsrc/tests/data/package/index/buildconfig unchanged from actualQAa450. EntireVC unchanged. No physical/unit/browser rerun justified for this metadata-only change. |
| M03 Scoped Review and history preservation | P1–P14/scope evidence | Exact report SHA256 + four-code/test-path+entireVC primitive | PASS | Current APPROVED report `2026-10-05-product-code-review-affected.md` SHA256 `9ce7e788f1d5f2b8e7f94472ab6d84d1bb89e3b17a5687ec1a1956d76c207b18`; scope fingerprint unchanged `3c50d8d27786ba102263d9d66d60cb42ab8b802dd0dfcfa09d83efd4d38c308c`. Four preceding QA/RV reports unchanged, hashes below. Original FAIL/CHANGES_REQUESTED outcomes remain historical. |
| M04 INDEX/Memory Bank describe bounded readiness | P1/source scope | Read changed metadata only | PASS | INDEX retains FAIL/history rows and links current affectedPASS/APPROVED with specific measured counts. Both MemoryBank files distinguish preparation, actual QA evidence, scoped closure and PM standalone smoke; physicalLAN2/native/operator/finalize/merge and B0/B6/B8 remain open. Experimental S/M/canon/source gaps preserved. No canonical task closure claimed. |
| M05 New note queue does not change tasks/dependencies | Scope/gates | Read/parse2JSONL records; compare original checkpoint blob/hash | PASS | Exactly2 records, `op=note`, text startsPENDING, fields limited intent_id/op/ref/actor/created_at/text. No create/update/status/dependency/close operation. Queue explicitly unapplied/operator action. Original9 checkpoint unchanged SHA256 `8abd77244e2cb6f580f923f37016d9fb77ad84745eddbcf219673c6f41e3d92a`. |

PM supplied offline-engine fixture result: dry-run with `/NO_LIVE_BD_ALLOWED`, original9checkpoint as fixture,2notes/0other mutations/no receipt/checkpoint preserved. That is PM evidence; QA did not rerun the engine or perform live bd/Dolt/application. Independent QA verified the queue bytes/operation types and unchanged checkpoint directly.

Actual deterministic checks here: Git SHA/tree/status/diff, per-path Git/worktree hash comparison, SHA256 report/VC checks, JSONL parsing, unchanged README launch/gate bytes, canonical fingerprint calculation and `git diff --check` exit0. Full diff9be→820a consists only six metadata files listed below; a450→820a additionally publishes the preserved QA report. No code/TTX/start-command change. Metadata review is bounded; no new whole-product/bootstrap audit.

## Inspected metadata blobs

These six current metadata paths were inspected semantically or as report evidence. The57-path product aggregate below changes only README; other metadata rows are supplemental binding of this docs-only inspection, not an expanded runtime execution claim.

| Metadata path | Current Git blob SHA1 |
|---|---|
| `.bd-intents/verification-results.jsonl` | `8b50a152b73100f72b6da54e23b36513e112ce1d` |
| `.memory-bank/activeContext.md` | `17e67ba3d6d70b5873ab71aba5f7b7c9d3fba572` |
| `.memory-bank/progress.md` | `b5329ce7ba6b3cf1d393aef735d3cc3f9342a0cc` |
| `README.md` | `7b283d04d6d80d29dedf16861b579b1d0c8ab4a0` |
| `docs/INDEX.md` | `09a0855eeb5c87bf5f31fc49e4605ec42b049724` |
| `docs/reviews/2026-10-05-product-code-review-affected.md` | `247e52025fcf73f4b182a8bed1816fcc0d6b09fb` |

## Preserved producer reports

| Report | Exact unchanged SHA256 |
|---|---|
| `2026-10-05-product-qa.md` | `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` |
| `2026-10-05-product-qa-affected.md` | `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` |
| `2026-10-05-product-code-review.md` | `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6` |
| `2026-10-05-product-review-fix-qa.md` | `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46` |

## Limits

Prior runtime PASS evidence remains at its actual execution SHA; this report rebinds unchanged source after README metadata movement. PhysicalLAN2/LAN-IP, combined real-browser64channels/dt0.01 late-control, browser heap snapshot and screenshots were not newly executed. RemoteCI/native/operator/livebd/Dolt/export/restore/auth/finalize/merge NOT RUN by this recheck; B0/B6/B8 remain open. This PASS is documentation/evidence-binding only, not full acceptance/readiness or canonical Beads closure. No source fixes/durable tests/commits/GitHub writes or subagents.

## Tested-Paths / current57-path rebinding

Canonical primitive: SHA256 of LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below followed by **entire exact VC bytes**, including finalLF, without fences/markers. All57 IDs independently equal current Git/worktree bytes. Exactly56 IDs match the originalQAa450 manifest; README is the sole replacement. Reports themselves/transient evidence/remote metadata excluded. Binding does not relabel inherited runtime execution as a fresh current replay.

| Tested-Path | Current candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-report.md` | `e883f5cfed153698eff907ee124ff4a4baaf9d1c` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/runtime-report.md` | `837a53fbb54817e971817884af36a9033bd3cbed` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/rv-fix-report.md` | `ac6fe34c9f7072aae44492baffd010c617452e6e` |
| `README.md` | `7b283d04d6d80d29dedf16861b579b1d0c8ab4a0` |
| `data/catalog/m-civilian.json` | `beeb0b2ca9fd982022b87e87b7f134e99523f7e2` |
| `data/catalog/modules.json` | `4d67370d31e238bc6b73f3166c141361e937216d` |
| `data/catalog/s-civilian.json` | `4fe437058d9b7d8643b57a1357af1b7d4d8a1ea2` |
| `data/scenarios/mining.json` | `336d956828428c768f0af36fe4b3393a54e98e38` |
| `docs/experiments/first-matrix-results.json` | `de0f93def32b0820dc9809b14131f859cc751b08` |
| `docs/experiments/first-matrix.md` | `939e0c4a6b309ecec806c57f831660050d79353d` |
| `docs/experiments/parameter-intake.json` | `56f2ad10c26f47ed92f393d7c684bbcaff49a2c9` |
| `docs/experiments/parameter-intake.md` | `ef65a3d6944bd6618457073a2fd3b804cc1dee55` |
| `docs/product/power-heat-lab-v0.1.md` | `7fb875dc5b4a7c34ae13ba2e9c297c57c42103ba` |
| `docs/user/local-network.md` | `f02e86b0cdea963d190b41ec87f17748aee573dd` |
| `docs/verification/beads-prepared-checkpoint.jsonl` | `a2878ae959783dce24b119a24a3ad0760f8abe01` |
| `docs/verification/power-heat-v0.1-contract.md` | `4276fff6498f85ba84912105add8f415035867c5` |
| `index.html` | `efcb4db2e7496e7b4be2469766af198001200540` |
| `package-lock.json` | `abf726f701e7847f4add67924bca11f4e256e940` |
| `package.json` | `b23b63d705bc2efa3802a518f445e24229c69590` |
| `playwright.config.ts` | `7640eddd834600b7d75331c878a6eefad3d0e5ad` |
| `scripts/lib/bd-apply-engine.mjs` | `cf0590ef11ecfee75695ca7dd11cb312417aa6d1` |
| `src/app/charts.ts` | `a068ec31eec35cd288525c77e83cd30e77eee695` |
| `src/app/compare.ts` | `03ba109855b80e9628a8055021ff73ac9a311540` |
| `src/app/main.ts` | `855e4091df7d657aff0b03ed40b57bf66af2e050` |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/io/json.ts` | `4d0b518c97bee32bcd0bd9a9d6ac05b603a88cb3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `60b40f07d897a2cab1434bb5624f6007ee30d880` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/browser/lab.spec.ts` | `76d7fd4026b7e18f0a90a0dc223438c4a55efe7b` |
| `tests/catalog.test.ts` | `d03ac5f5af7a0348937acd91342a41b2cc7c9398` |
| `tests/io.test.ts` | `f4c14b9770b215e9098581c0f51f5b43a2c0a003` |
| `tests/long-kernel.test.ts` | `c72942369330adde06d10272a196890114bf7d4e` |
| `tests/matrix.test.ts` | `a24aa01131860590d54ea7a5df5d649d8ed95d66` |
| `tests/metrics.test.ts` | `9e29a208d74eace0cc5bd7b103a3a7edec9c9691` |
| `tests/model/boundaries.test.ts` | `a3b9f1e160d43f2da39bde28bf9e96240e0d8ae9` |
| `tests/model/kernel.test.ts` | `e9526f56158bc080641a193864d0f7c3628c5638` |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` |
| `tests/qa-regressions.test.ts` | `d9c2c3f954d211815c267a161d66072563e97828` |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` |
| `tests/retention-memory.test.ts` | `4d2b7b8c3df1c7f96fa65c3117a61276b62e70f8` |
| `tests/review-regressions.test.ts` | `cbcec8a835be44f56e9fcfe4d6bd0a97f760de2f` |
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

Transient deterministic binding record: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/820a21db/binding.json`; SHA256 `ded021ffe14d59cf3386acf4294a9d801cecffa44fe52f473c4954be6f8b9878`. Auxiliary proof is not the canonical fingerprint primitive.

## Exact entire source Verification Contract

```markdown
# Verification Contract — Power & Heat v0.1

Mode: PRODUCT. Independent verifier budget: 5 launches на этот deliverable:
Plan Review, QA, scoped Code Review, резерв affected QA/scoped re-review.
Product source: `../product/power-heat-lab-v0.1.md`; provenance: source-authority/inventory.
Owner принятия: оператор. Runtime implementation начинается после PLAN_READY и согласования.

| AC | Expected / edge / error behavior | Verification / owner task |
|---|---|---|
| P1 | Доступная по LAN static page показывает конфигурацию, графики, события; simulation backend/CDN не нужен | Build + Chromium smoke на адресе хоста; T4/T6 |
| P2 | S baseline и M Civilian имеют обязательные параметры, units, origin/source/model version. Missing authoritative value показывает gap; experimental substitute явно маркирован. M не получается универсальным multiplier S | Schema/unit/provenance fixtures; two runnable presets; T1 |
| P3 | Все electric load идёт через общий stock. Q ∈ [0,Qmax], capacities sum; no source допускается. Protected hull load раньше оборудования, actual allocation не превышает доступное. Direct fuel propulsion независима от электрического дефицита | Analytic energy fixtures: no source/full/empty/partial-step, electric vs chemical drive; T2 |
| P4 | Базовый electric/heat ledger замкнут в заданной numerical tolerance; actual delivered power определяет actual work/heat/fuel, pulse buffers видны только через recharge. Fuel stocks по tankId/species; shared tank имеет единый simultaneous-flow budget. Overflow не создаёт/не удаляет необъяснённую энергию | Synthetic analytic tests; shared generator/engine/cooler midstep H₂ depletion, tank species isolation, permutation invariance; balance residual trace; T2 |
| P5 | Одна T_ship, сухая теплоёмкость без double count/cargo bonus. Radiation имеет outgoing/incoming/net и меняет знак. Exhaust не охлаждает ранее накопленное hull heat | Analytic constant-heat and radiative equilibrium cases; dry-mass/no cargo cases; T2 |
| P6 | Cooling devices соблюдают finite buffer power/capacity, H₂ tank consumption и электрическую цену. Thermoinverter ejects moved heat + work, ограничен hot side; starvation не оставляет бесплатное охлаждение | Device fixtures with simultaneous stock/power/thermal limits; T2 |
| P7 | Active/Background и Civilian governor следуют U2. Background уступает active/recharge, питается только free source headroom, не battery stock; eligibility при 80% SoC,20% usable fuel и10 K hot margin пересчитывается внутри dt. Active/protected могут тратить ниже bg floors; общего clamp нет. Thermal stop/restart в hot/cold имеет hysteresis, без chatter | Start-boundary и within-step depletion/heating/headroom fixtures; source0/bg100W получает0J; Active ниже bg floors; actual cooling power included; T3 |
| P8 | Effective background и direct input раздельны; source ID не разрешает двойной учёт. PV electric output + heat не превышают absorbed input в baseline. Linear fog только named experiment, default T^4 | Environment double-count rejection, dark/solar/hot/cold, negative net exchange fixtures; T2/T3 |
| P9 | Длительность и workload определяет сценарий. 5/10 мин и 8/12 часов replay сохраняет state; service явно меняет stocks. Cargo full останавливает mining, отдых не равен full reset; useful-action recovery не требует 100% | Scenario replay + repeated work/return/unload/refuel fixture; identical trace for chunked/full runner; T4/T6 |
| P10 | Pause/step/accelerate/cancel UI не меняют kernel dt/results. После reset/import старые worker messages не меняют новый run. Incremental metrics, bounded telemetry/events и ack backpressure сохраняют доступность UI длинного опыта; aggregation/retention видны в export |12h/dt0.01s/64-channel fixture:≤50000 buckets,≤128 MiB telemetry,≤20000 event records,≤1 unacked chunk; controls after≥40000 buckets ack≤500ms на declared host; replay equivalence/stale-run tests; T4 |
| P11 | A/B показывает одинаковую задачу и own-full-sortie; версии моделей/параметров и различия видимы. Re-run одного run spec воспроизводит trace/events/metrics | Comparable target-work vs own-capacity fixtures, immutable run tests, A/B browser smoke; T5 |
| P12 | JSON round trip сохраняет run spec и provenance. Finite dt/duration/Qmax/C_ship>0, Kelvin temperature≥0, initial stocks∈[0,capacity], valid tank/species refs обязательны. Unsupported version/nonfinite/invalid unit/out-of-range показывают path+reason до старта без скрытого clamp. CSV содержит SI units/timestamps и explicit retention/cadence | Zero/negative/nonfinite aggregates/time, initial overfill, wrong tank/species rejection; round trip/CSV metadata/escaping; T1/T5 |
| P13 | Графики и event log показывают actual limiting cause, source/sink channels и resources; downtime/useful work/next-action recovery вычисляются из событий и actual work | Trace aggregation + first constraint/recovery fixture; UI diagnostic smoke; T4/T5 |
| P14 | В v0.1 нет detector sensitivity/radar/detection tuning; исходные energy/heat данные сохранены для дальнейшей работы | Scope review и UI smoke, T6 |

## Numerical acceptance

Тесты используют синтетические SI fixtures, не выдают их числа за ТТХ U2.
Constant-flow analytic energy/heat cases: absolute tolerance 1e-6 J, floating tolerance
1e-9 relative. Для nonlinear radiation/device cycles: half-step convergence ≤0.1% для
integrated energy/peak temperature; переход thermal gate — не дальше одного base dt.
Для replay с тем же dt: одинаковые timestamps/events и значения в floating tolerance.
Если solver не выполняет tolerance, исправляется solver/step, а не product TTX для скрытия ошибки.
Экспериментальный закон может иметь явно заявленный дополнительный balance term;
скрытый residual не является разрешённым игровым упрощением.

## QA execution surface

QA получает source + этот contract + кандидат SHA + команды build/typecheck/unit/browser.
Report: Test case | Source AC | Method | Result | Evidence. Missing measurement = NOT RUN.
12h simulated time не означает 12h wall-clock ожидания. Длительный сценарий проверяется
ускоренным kernel replay и browser responsiveness smoke. Second LAN client проверяется
фактически при наличии устройства; localhost не объявляется двумя LAN-клиентами.
Retained plot data —1s deterministic mean/min/max buckets с bounded merge; metrics по всем
physics ticks. Сохраняются первые128/последние19872 events; dropped count явно в UI/CSV.
Исходная resolution и aggregation policy входят в RunResult, replay и comparison metadata.
Long-run performance report фиксирует CPU/browser/catalog/channel count; pause/cancel latency
считается от UI command до matching worker acknowledgement. Slow UI fixture доказывает queue cap.
Protocol correlation: telemetry-ack command содержит(runId,chunkId), control-ack response —
(runId,commandId,control). Пока telemetry chunk не подтверждён, control commands доступны;
stale/duplicate/wrong ACK не освобождает чужой slot и не запускает cancelled work.

## Scoped Code Review contract

Goal: воспроизводимый энерготепловой стенд для настройки модели и ТТХ.
IN: src/model, src/catalog, src/scenarios, src/runner, src/app, import/export, numeric tests,
AC P1–P14, project build/test wiring. Named risks: silent energy double count; wrong units;
source vs experimental confusion; cross-run worker state; long-session state reset.
OUT: U2 gameplay canon redesign, detector tuning, market/economy, full flight integration,
OverGate policy design (имеет отдельный bootstrap contract).
BLOCKER по формуле ADR 3.28/3.29; advisory не расширяет scope автоматически.

## Evidence binding / rollback

Reports указывают role/model, commit, explicit reviewed paths, source contract, content
fingerprint и NOT TESTED. Fingerprint: sorted `path SP git-blob-id LF` + exact bytes
этого contract; head movement само по себе не требует повторного LLM review.
Runtime rollback: revert рабочей feature ветки/PR; exported run versions остаются immutable.
Никакой миграции или перезаписи U2/пользовательских исходных файлов в v0.1 нет.
```
