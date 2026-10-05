# CODE REVIEW — Power & Heat v0.1 affected closure

Verdict: **APPROVED** для affected product review surface. Active BLOCKER: **0**;
ADVISORY: **0**. Исходные B1–B3 закрыты текущими fixes и independent affected QA.
Это scoped Code Review closure, не full bootstrap/operator acceptance или merge readiness.

- Mode: CODE_REVIEW; affected re-review, не новый whole-branch audit.
- Role: independent OverGate Reviewer (RV), same RV session / PRODUCT launch #3/5 reused; новых agents/verifier launches нет.
- Model: selected/requested `gpt-6.1-sol`, reasoning `high`; actual provider deployment ID среда не раскрыла.
- Commit: `9be844e9e33d6957a1a259dd3980cbc4b6771569`; tree `dc05ef82a4d58cbb81d069f6ba50f4f231ccd6eb`; branch `feat/power-heat-lab`.
- QA-tested source: `a450d45058890cd9ac6eaeac5aa34b2f1cc84859`; current candidate добавляет только QA report, source/test/evidence package bytes совпадают.
- Previous reviewed candidate: `afcbdc0e62914ab4ba4b5e953ee1990a13d35557`. Stack common base `c226669bcaae95284df18bd5d22824a1f6a7a00d`; supplied bootstrap remote base `319da067b715edac16655e0f2ef7b7e28efc306d`. Rebase/merge не выполнялся.
- RV owner: installed `.agents/RV_ROLE.md`, unchanged frozen-equivalent blob `6e13e1023c90621172135e206e01fed8bd6b8c28`.
- Source contract: entire unchanged `docs/verification/power-heat-v0.1-contract.md`, exact bytes ниже; P4/P5/P7/P12 и Numerical acceptance для B1–B3.
- QA read FIRST: `docs/reviews/2026-10-05-product-review-fix-qa.md`, PASS affected product surface; exact SHA256 `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46` independently verified.
- Content-Fingerprint: `3c50d8d27786ba102263d9d66d60cb42ab8b802dd0dfcfa09d83efd4d38c308c` (four affected runtime/test paths + entire exact VC).
- Independent QA full57-path package fingerprint: `aae87f0318298e6ca957b928c549a59d32c971cd24d0765ac9ef0186b105d60c`; retained as QA binding, not a new full57-path semantic Review.
- Entire VC SHA256: `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.

## Affected Review Contract

IN: только closing B1–B3 из исходного Code Review и necessary regressions изменённой
surface. Семантически rereviewed paths: `src/model/step.ts`, `src/app/main.ts`,
`tests/review-regressions.test.ts`, added benign regression в `tests/browser/lab.spec.ts`.
Developer `rv-fix-report.md` и независимый current QA/пробы — evidence inputs.
Named risks остаются прежними: nonlinear integrated energy tolerance, actual shared fuel
budget at tank stop/restart, imported ID interpreted as DOM markup. Stable old 55-path
package проверен на binding/equivalence; новый Developer report/test дают57 paths.

OUT: новый whole-source/product audit, ранее неизменённые physics/UI policy/TTX/schema/ID
правила, full OverGate/reinstall/native/bootstrap acceptance, live Beads и excluded
canon/detection/economy/flight. Active executable import payload не применяется и не
включается в evidence; B3 проверяется безопасным literal-ID доказательством QA и source.
No source fixes, commits, GitHub/bd mutations или дополнительные агенты.

## Findings closure

| Finding | Verdict | Source / evidence |
|---|---|---|
| B1 — unconstrained RK4 interval | CLOSED | step.ts internal h ограничен local thermal Jacobian и finite temperature-change scale; actual flows пересчитываются на subinterval. QA исходный валидный dt10/dt5/refined fixture и adjacent inward radiation PASS без смены пользовательского dt, параметров или допуска. |
| B2 — missing physical tank boundaries | CLOSED | supplied tank low/high либо stopped restartLow/restartHigh добавлены в тот же threshold solver с existing `tank:<id>` state. QA exact original hot stop, shared generator/engine/H₂ cooler/permutation, hot restart и cold stop/restart PASS. |
| B3 — raw imported tankId→innerHTML | CLOSED | m.tankId теперь проходит existing html() при model-note output. Независимый benign import сохраняет literal ID/quotes,0 extra b elements и неизменное DOM element count. Schema/ID policy не ограничивалась для сокрытия дефекта. |

**B1.** В source только internal interval выбирается по `0.05 / thermalSlope` и
`0.02 × max(1,T_ship,T_env) / abs(thermalRate)` для ненулевого thermal slope/rate, перед
существующими stock/temperature boundary limits. Внешний dt/clock не изменяются;
после каждого h цикл заново рассчитывает electric/fuel/device actual flows. Это устраняет
предыдущий единственный10s RK4 jump, сохраняя existing boundary/zero-rate behavior.
Новый durable test использует radiationNetW×dt для integrated energy, а не только finalT
или ledger residual. Independent QA дополняет его валидным dry bill/provenance и signed
heating case, так что fixture не служит собственным acceptance oracle.

На исходном C100J/K,area1m²,T500K,background100K опыте QA observed net radiation:
15772.336207637034J (dt10),15772.336207136634J (dt5),15772.33619333018J (dt0.001).
Reviewer независимо пересчитал ratio из captured JSON: **3.172645703e−11** для half-step,
против contract≤0.001; refined difference9.070852615e−10. Residual6.25e−13J.
Signed inward radiation probe также PASS; не заявляется универсальная точность любых
неизмеренных параметров из совпадения одного теста. Fresh current physical12h QA replay
подтверждает необходимую regression изменённого kernel, старый benchmark не подменяет его.

**B2.** Добавленный tank threshold set использует тот же state key, что
updateThermalGates/tankLive. После crossing event update пересчитывает gate и следующий
subinterval закрывает все привязанные consumers либо возобновляет их внутри remainingdt.
Существующие generator/engine/cooler joint flows, depletion/floor boundaries и permutation
не менялись. QA original2s coarse/half: exactly100J generator delivery,T500K,fuel9.9kg,
thermal-stop at1s; прежние extra100J/0.1kg устранены. Shared-H₂ consumers stop at1.25s,
125J generator+25J cooling,0.275kg total burn, permutation delta0. Passive-cooling tank
restart0.64190233337s agrees with refined0.64190233446s and actual eligible fuel interval.

QA честно сохранил provisional overstrict cold oracle. Final cold coarse/half совпадает с
analytic11s restart/100J delivery; refined restart11.001s and99.9J отражён открыто.
Thermal event deviation0.001s находится в explicit≤one refined base dt allowance;
actual fuel/delivery соответствует наблюдаемому eligible interval. Nonlinear radiative
half-step requirement отдельно проверен QB1, не переопределялся для этой nonradiative
event case. Никакая production failure не переименована в PASS с заменой VC/tolerance.

**B3.** Changed interpolation применяет существующий escape для текстового HTML context.
Independent QA supplied valid literal `<b>tank</b> "quoted"` ID, consistent tank/module/fuel
refs и provenance. После advanced JSON Apply этот текст остаётся literal в двух notes;
`#modules b` count0, descendant elements68 до/после, pageErrors empty. Это bounded display
regression, без active execution fixture. Source escaping matches this output boundary;
новых restrictions на допустимые ID или silent import transformations нет.

## Checks / exact evidence

Reviewer здесь не запускает app/browser/source numerical replay повторно: метод — scoped
source diff/test/evidence inspection, safe arithmetic и Git/hash binding. Не выдаётся QA
execution за новый Reviewer execution.

| Method | Result |
|---|---|
| Reviewer original→current source/test diff |Only2 production paths +2 affected test paths changed; known root causes addressed, no base dt/TTX/VC/authority change |
| Reviewer `git diff --check` original→current |exit0 PASS |
| Reviewer current QA hash/57 published candidate blobs/current filesystem/entire VC |PASS; package `aae87f0318298e6ca957b928c549a59d32c971cd24d0765ac9ef0186b105d60c` reproduced |
| Reviewer affected4-path+entireVC primitive |PASS; `3c50d8d27786ba102263d9d66d60cb42ab8b802dd0dfcfa09d83efd4d38c308c` reproduced |
| Reviewer named execution JSON hashes |review-probes.json,harmless-import-browser.json,long-kernel-fresh.json match published QA digests;6 numeric probe verdicts and benign browser fields inspected |
| Independent current QA |54unit/11files,typecheck/build,18model/14schema,6review probes,current64/98nearmax retention,5browserPASS/1screenshotSKIP;fresh physical12h134.916s and actual late Worker ACK0.1ms/0.1ms PASS as reported |

QA execution artifact paths below are actual ignored transient files read during review:
`.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/a450d450/review-probes.json`
SHA256 `b1a4d956015bf3931d55bc45871498ebbaab3b48f88f278a2908dceab0c93f06`;
`harmless-import-browser.json` SHA256
`e28f056b1be8e56c8601de98f2f888bdf0e6ca7c18dc0a7dd79dbec3fcdeb1cd`;
`long-kernel-fresh.json` SHA256
`11b98dc73ae04f23901579680b8535b0221da95e38813248c2d5ad8d9c878167`.
They are execution evidence, not substitutes for canonical source binding.

## Preserved history / gates

Reviewer independently reconfirmed immutable historical report hashes:

| Report | Historical outcome | Exact SHA256 |
|---|---|---|
|2026-10-05-product-qa.md |Original FAIL7 |320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605 |
|2026-10-05-product-qa-affected.md |Earlier affected PASS |d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059 |
|2026-10-05-product-code-review.md |Original CHANGES_REQUESTED3 |09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6 |

Original reports не переписаны; новый report закрывает только current defects. P1–P14 и
experimental status сохраняются. B0/B6/B8, native/operator synchronization/auth/finalize
и operator merge не закрываются. Actual original Git push FAIL сохраняется; pending
intents не canonical closures. Product merge-ineligible до принятой bootstrap base и
завершения всех необходимых acceptance/current checks, независимо от этого scoped APPROVED.

## Reviewed-Paths / canonical binding

Explicit affected Review set — four paths only. QA binds the full57-path package separately;
this closure does not assert a new review of unchanged product surface. Canonical SHA256:
LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below then **entire exact VC
bytes**, including finalLF, without fences/markers. New/current reports and QA artifacts
are outside the reviewed path set and their byte hashes are recorded separately.
Equivalent later docs/report/base movement does not change these reviewed code bytes.

| Reviewed-Path | Candidate Git blob SHA1 |
|---|---|
| `src/app/main.ts` | `855e4091df7d657aff0b03ed40b57bf66af2e050` |
| `src/model/step.ts` | `60b40f07d897a2cab1434bb5624f6007ee30d880` |
| `tests/browser/lab.spec.ts` | `76d7fd4026b7e18f0a90a0dc223438c4a55efe7b` |
| `tests/review-regressions.test.ts` | `cbcec8a835be44f56e9fcfe4d6bd0a97f760de2f` |

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

## NOT TESTED / remaining gates

Reviewer fresh runtime tests, physical12h and browser executions NOT RUN in this recheck;
current independent QA executions explicitly retained above. No active executable import
payload used. Real LAN-IP/second LAN client, combined browser64channels/dt0.01 late-control,
browser retained heap snapshot, screenshots and remoteCI not independently tested by RV.
Native/operator hooks, liveBeads/Dolt/import/export/auth/restore/re-export/applier/finalize,
operator acceptance and merge NOT RUN; historical bootstrap gates remain open.
Full U2 canon/material closure and new whole-source/security audit OUT OF SCOPE.
No source fixes, commits, GitHub/bd writes/subagents; only this new report written.
