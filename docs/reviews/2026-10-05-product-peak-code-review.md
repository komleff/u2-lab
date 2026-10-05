# CODE REVIEW — QB1/P13 affected peak closure

Verdict: **APPROVED** для единственной affected QB1/P13 surface. Active BLOCKER: **0**; ADVISORY: **0**. QB1 закрыт сохранением физического внутреннего пика и independent affected QA. Full bootstrap/operator acceptance, finalize и merge readiness этим verdict не заявляются.

- Mode: CODE_REVIEW; scoped affected re-review.
- Role: independent OverGate Reviewer (RV), same PRODUCT Reviewer/session #3/5 reused; новых verifier launches/agents нет.
- Model: selected/requested `gpt-6.1-sol`, reasoning `high`; actual provider deployment ID среда не раскрыла.
- Commit: `f4e7e8e0bcb20e5bd59f185d2c8152becc61ad2d`; tree `7dc2401c394e63b1edbdc0f79643f8eb3ae3981c`; worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- QA-tested source: `d469d5d8adcda69f1aefe958628d81c43a347ca7`, tree `ebde00eeeba741e6d60ad1be26b44a082944b1f3`. Все пять reviewed code/test paths и entire VC byte-identical в tested source, published candidate и текущем worktree.
- Pre-fix comparison base: `820a21dbc2fbe21ee72e79385cd6a5d7a80e0551`; только named QB1 changes, без rebase/merge.
- RV owner: installed `.agents/RV_ROLE.md`, frozen-equivalent role; source Review Contract `/workspace/scratch/faaeb0182a68/u2-lab/.superpowers/sdd/2026-10-05-u2-lab-launch/peak-review-brief.md`.
- Source acceptance: entire unchanged `docs/verification/power-heat-v0.1-contract.md`, exact bytes ниже; P13, all-physics-ticks metrics и Numerical acceptance integrated-energy/peak half-step ≤0.1%.
- QA read FIRST: `docs/reviews/2026-10-05-product-peak-qa-affected.md`; exact SHA256 independently verified: `1b460d5b141d76986f8ef2d10f4de4054993eedd478497db9bd889cf4025f136`.
- Content-Fingerprint: `f105ca38817e9fab939597b063b562264e64ba871aa845248fb02af8f1fe1a72` (five affected code/test paths + entire exact VC).
- Entire VC SHA256: `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`; Git blob `4276fff6498f85ba84912105add8f415035867c5`.

## Actual review scope

IN: только ранее подтверждённый QB1: initial/internal thermal boundary maxima, scalar handoff в cumulative metrics, checkpoint/result preservation, type/call consistency и durable regression. Named risks: endpoint-only collection, averaging/RK4 stage estimates mistaken for physical peaks, unintended energy/resource/retention changes. Reviewed-Paths — ровно пять code/test files в binding ниже; source diff, relevant existing loop/runner context и evidence inspected.

OUT: новый whole-product/source/UI/security audit, новые physical laws/TTX/parameters/tolerances, runtime source fixes, active HTML/JS payloads, OverGate/native/operator/Beads activation, full readiness/finalize/merge. QA 59-path package fingerprint `fa0a6865d0032024e634ccccf2f2f9ecda4c40282ccaaf3b90b4b09a27b412ef` и direct8 fingerprint `d0b46f628590c49393e39ecead3818aef09faafde6f29919036330f139441fa3` остаются QA evidence; RV не заявляет semantic rereview всех этих unchanged paths.

## Finding closure

| Finding | Verdict | Source / evidence |
|---|---|---|
| QB1 — within-base-dt tank-stop peak lost by endpoint-only cumulative max | CLOSED | `step.ts:36,413–414,518` collects initial temperature and each accepted physical substep endpoint; `types.ts:150` requires separate scalar; `run.ts:181` passes it to `metrics.ts:67` cumulative max before target checkpoint creation. Exact original validated three-dt fixture and initial cooling regression pass in independent affected QA. |

`maxTemperatureK` starts at `input.temperatureK` and is updated immediately after accepted `tNext` becomes the physical state. It includes the existing thermal/resource boundary at ≈500K before the remainder of the base step cools. RK4 intermediate estimates and averaged power telemetry are not used as peaks. The scalar is returned separately from telemetry and passed without dt weighting; cumulative `Math.max` retains earlier peaks. Existing target snapshots are created after this update; sortie snapshots/result cloning preserve accumulated metrics. No new retained channel is introduced.

The production diff only collects, types, returns, passes and aggregates this scalar: eight added production lines and two replacements. Thermal integration, dispatch, energy/resource evolution, events, base dt and telemetry/retention expressions are unchanged. The new two-test file exercises the original hot tank-stop/cooling sequence at dt20/dt10/refined0.001, numerical peak criterion, residual, direct unaveraged scalar and cooling-only initial maximum. It does not alter source thresholds or acceptance tolerance.

Reviewer independently recomputed the following ratios from the captured QA JSON; this is safe arithmetic on existing evidence, not new simulation execution:

| Measurement | dt20s | dt10s | dt0.001s |
|---|---:|---:|---:|
| Corrected cumulative peak, K | 500.00000000000534 | 500.00000000000534 | 500 |
| Old endpoint-only peak, K | 493.837976651701 | 497.25151826972507 | 499.9999644629485 |
| Final temperature, K | 493.837976651701 | 493.8379766628059 | 493.8379766631366 |
| Integrated net radiation, J | 689.1521177823979 | 689.1521166719106 | 689.1521161813307 |

Old peak half-relative error was `0.006864818894675434` (0.68648%, exceeding 0.1%). Corrected peak half-relative error is **0**; refined difference **1.0686562745831907e−14**, both ≤0.001. Integrated-radiation half-relative error remains **1.6113820441932077e−9**; peak failure was not concealed through changed physics. Captured physical-output comparison states exact equality of finalT/fuel/integrated channels/residual/events per dt before/after; the source diff corroborates this limited invariance. Direct scalar/cooling proof gives initial/max500K while final493.1176029702483K. Cumulative 40s/chunked/full/JSON/frozen-result proof retains500K with42channels and no new peak telemetry channel.

## Verification and evidence ownership

RV performed scoped static source/diff/test review, QA report/evidence reading, Git/hash verification and safe arithmetic. No fresh RV runtime/browser/long test execution is claimed.

| Evidence / check | Result and owner |
|---|---|
| Published HEAD/tree, tested-source/current-worktree five paths + entire VC | RV independently verified exact equality |
| Five-path + entire VC canonical fingerprint / QA byte hash / exact VC inside QA | RV independently recomputed and verified |
| Pre-fix→candidate affected `git diff --check` | RV exit0 |
| Original validated three-dt physical fixture, scalar/cumulative/JSON/replay probes | Independent QA fresh PASS; exact fixture unchanged |
| Targeted source group, typecheck/build | Independent QA fresh40 tests/7files PASS; typecheck/build exit0, not a fresh full56 suite |
| Selected original numeric/metrics/replay and prior device probes | Independent QA fresh13 +6 PASS |
| Physical12h/browser/full56 suite | Prior own QA12h134.916s inherited from a450; current Developer12h132.595329s/full56/type/build/5browserPASS+1SKIP/cloud26 supplied evidence; no fresh QA/RV long/browser rerun |
| Exact-source two CI runs and extracted ZIP smoke | PM supplied SUCCESS/PASS evidence; RV did not use GitHub or run browser smoke |

QA execution artifacts actually read by RV are under `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/d469d5d8/`:

| Artifact | Exact SHA256 |
|---|---|
| `peak-cycle.json` | `77e942c241c984981311c8edbde846a1b3710cb52f0bb94e98c8fc9190f7aeab` |
| `peak-adjacent.json` | `d5500110531b11d87f5cc1c7c354bc88329d13d5489aeeff236768b307b48bf1` |
| `physical-output-comparison.json` | `8d469cb0435b9213b4157b875dd495c57a6431b170f242f9d4a5c3b9a63064ad` |

These are transient execution evidence, separate from canonical source binding. QA preserved the provisional exact20s timestamp oracle and its correction for observed19.999999999999996s under the unchanged floating tolerance; strict same-dt replay equality already passed. No source failure or peak threshold was relabeled by that harness correction.

## Preserved history / remaining gates

Earlier reports remain immutable. RV independently reconfirmed original product CHANGES_REQUESTED report SHA256 `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6`, prior B1–B3 APPROVED closure `9ce7e788f1d5f2b8e7f94472ab6d84d1bb89e3b17a5687ec1a1956d76c207b18`, and original QB1 QA FAIL `47cd51e2e6925501ce015bb7d76ee3c46e3ca03cad02fd4fcfb15e1ee028c706`. This report closes only QB1 on the bound affected content; history is not rewritten.

Full B0/B6/B8, native/operator acceptance, live Beads/auth/export/restore/applier/finalize and merge remain open. Historical original Git push authentication FAIL remains actual FAIL. Experimental S/M/canonical authority gaps are unchanged. APPROVED here means no active blocker in the supplied QB1 Review Contract.

## Reviewed-Paths / canonical binding

SHA256 of the following LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows followed by **entire exact VC bytes**, including finalLF, is `f105ca38817e9fab939597b063b562264e64ba871aa845248fb02af8f1fe1a72`. Fences/markers are not fingerprint input.

| Reviewed-Path | Candidate Git blob SHA1 |
|---|---|
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/runner/metrics.ts` | `7f43b033a956174d01d2ebb0249cdda118adb470` |
| `src/runner/run.ts` | `1a1e929ae19ce829fd21cb8fbc85ed181113dd33` |
| `tests/peak-cycle.test.ts` | `e0c0f3efc81e9a4231f9a7c382344a7967e9d505` |

## Entire exact Verification Contract

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

## NOT TESTED / not-reviewed surface

RV fresh source numerical replay, full unit suite, physical12h, browser smoke/heap/late ACK/screenshots, LAN-IP/second physical LAN client and remoteCI NOT RUN in this recheck. Execution ownership above remains explicit. Broader unchanged product/security/TTX/authority surface, active HTML/JS execution and OverGate/native/operator/Beads acceptance OUT OF SCOPE. No source edits, commits, GitHub/bd writes, agents or new experiments; only this new report is written. PM owns publication.
