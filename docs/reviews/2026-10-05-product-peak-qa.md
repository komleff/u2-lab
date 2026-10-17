# QA EXECUTION — named within-dt peak device cycle

Result: **FAIL** for the single named QB1/P13 device-cycle peak case. Current integrated-energy solver converges, but `RunMetrics.maxTemperatureK` loses the physical internal peak after a supplied tank thermal stop and subsequent cooling within the same base dt. The observed half-step peak difference exceeds the unchanged Numerical Acceptance threshold. No new policy/tolerance is introduced.

- Role: independent QA under installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5 reused, no new verifier agent/launch.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `820a21dbc2fbe21ee72e79385cd6a5d7a80e0551`; tree `6ca5d5008c95f46b879c9391c054bc8e80fffaae`; branch `feat/power-heat-lab`; idle worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`. Runtime production bytes still match the actual a450d450 QA candidate.
- Source: `docs/product/power-heat-lab-v0.1.md`; exact entire P1–P14 `docs/verification/power-heat-v0.1-contract.md` below, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Content-Fingerprint: `6d0505eef0eea318100a78ef4a6108814ebfee753017075af5a83a58a9b9a8e8`; seven directly tested source paths + entire exact VC, explicit binding below.

Scope is only the PM-named necessary B1/Numerical-Acceptance/P13 concern: one nonmonotonic thermal device cycle and its dt20/dt10/refined0.001 replay. No whole-product/bootstrap audit, new parameter canon, active payload or extra experiments. Prior reports remain immutable history; their passing measured surfaces do not supply the previously unmeasured internal-peak proof. This source-backed failure was sent promptly to PM; Developer owns any fix and same-session affected verification will use a stable fixed candidate.

## Literal valid SI reproducer

Transient probe imports actual `presets`, `moduleBase`, `markEdits`, validator and `createRun/runChunk` through local Vite SSR. Each spec is a cloned shipped preset, replacements below followed by `markEdits`; `validateRunSpec` accepts all three, and `createRun` accepts all three. Synthetic values are SI component fixtures, not U2 TTX.

- Dry material bill:1kg×100J/(kgK), C_ship100J/K; initialT490K; hull radiationarea0.01m²; radiative background100K; no solar/direct/external input.
- Accumulator100J, initialQ0J; charge/dischargeη1; protected hull load250W.
- One generator250W electrical,ηgen0.5,pathη1,exportFraction0; all250W generation waste heat enters host. No other modules, loads or buffers. Generator uses existing `moduleBase` thermal corridor:low150,workLow200,restartLow180,workHigh510,restartHigh550,high570K, so the tank's500K stop is the active constraint.
- One diesel tank `d`,capacity10kg,initial10kg,1000J/kg, supplied gate:low100,workLow120,restartLow110,workHigh450,restartHigh480,high500K.
- One idle20s phase,duration20s,repeatfalse. Three otherwise identical specs differ only in configured base `stepSeconds`:20,10,0.001. Each advances actual `runChunk(run,1)` until done; integrated powers use telemetry×actual elapsed base step.

Actual command from exact candidate root:

```sh
node .superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/820a21db/peak-cycle.mjs
```

Harness exits0 after capturing the observations; JSON `result=FAIL` is the verdict, not exit0. No source or prior report edited.

## Single case matrix and actual observations

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| QB1/P13 within-base-dt peak at tank stop, then cooling | B1 Numerical Acceptance nonlinear-device-cycle half-step integrated-energy/peak tolerance≤0.1%; P13 actual incremental metrics | Actual validated createRun/runChunk replay20s atdt20/dt10/refined0.001; read peak metric, thermal events and integrated energies | **FAIL** | Physical tank stop records500.000K at≈2.1459s. Peak metric493.83798K coarse vs497.25152K half-step vs499.99996K refined. Relative coarse/half peak difference0.006864818894675434=0.6864818894675%, greater than≤0.001=0.1%. Coarse/refined difference1.2323976498411%. Energy convergence itself passes as below. |

| Measurement | dt20s | dt10s | dt0.001s |
|---|---:|---:|---:|
| Base ticks |1 |2 |20000 |
| Final temperature,K |493.837976651701 |493.8379766628059 |493.8379766631366 |
| Reported maxTemperatureK |493.837976651701 |497.25151826972507 |499.9999644629485 |
| Thermal-stop event time,s |2.1458995659049984 |2.1458995659049984 |2.145899564989869 |
| Event-reported temperature,K |500.000 |500.000 |500.000 |
| Fuel remaining,kg |8.9270502170475 |8.9270502170475 |8.927050217503693 |
| Integrated generator electricity,J |536.4748914762496 |536.4748914762496 |536.4748912474978 |
| Integrated generator host heat,J |536.4748914762496 |536.4748914762496 |536.4748912474978 |
| Integrated total host heatIn,J |1072.9497829524992 |1072.9497829524992 |1072.9497824949956 |
| Integrated chemical input,J |1072.9497829524992 |1072.9497829524992 |1072.9497824949956 |
| Integrated net radiation,J |689.1521177823979 |689.1521166719106 |689.1521161813307 |
| Ledger residual,J |9.658940314238862e−14 |9.658940314238862e−14 |−1.834435381375954e−13 |

Integrated net-radiation relative half-step difference1.6113820441932077e−9/refined2.3232420817556823e−9 is well below0.001. The physical solver reaches the500K tank boundary and then cools; the residual and integrated-energy agreement therefore do not demonstrate peak-metric correctness. Expected peak is≈500K for every replay, and the actual coarse/half peak convergence failure is independent of the near-zero energy residual.

Observed source cause: `src/runner/metrics.ts` updates `m.maxTemperatureK = Math.max(m.maxTemperatureK, s.temperatureK)` once per base step using only its final state. Actual telemetry has no max/peak field. Initial490K is included, but the within-step500K state before final493.838K is unavailable to that metrics update. The half-step replay's first endpoint is497.252K, making the same physical experiment report a different peak. This is the existing named B1 device-cycle peak/P13 surface; it is not a new input restriction, timestamp convention or accepted-risk substitute.

## Preserved reports / limits

QA independently verifies these report hashes unchanged, including the untracked metadata supplement:

| Report | Exact unchanged SHA256 |
|---|---|
| `2026-10-05-product-qa.md` | `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` |
| `2026-10-05-product-qa-affected.md` | `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` |
| `2026-10-05-product-code-review.md` | `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6` |
| `2026-10-05-product-review-fix-qa.md` | `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46` |
| `2026-10-05-product-metadata-qa.md` | `70e177a3c24635eda024e53d6ff2eb4c0cf11a255b79224d2d5080199f50e0fb` |
| `2026-10-05-product-code-review-affected.md` | `9ce7e788f1d5f2b8e7f94472ab6d84d1bb89e3b17a5687ec1a1956d76c207b18` |

No archive/readiness inference may treat the single named failure as passing until a stable fix is independently rechecked. Existing historical scoped APPROVED/PASS bytes remain preserved rather than rewritten. No physical12h/unit/browser/remoteCI rerun was performed for this single probe; other prior execution remains bound to its actual candidate and measured surface. B0/B6/B8/native/operator/physicalLAN2/livebd/Dolt/finalize/merge remain open or NOT RUN. QA wrote this immutable report and ignored probe/evidence only, with no product fixes/commits/GitHub writes/reset/subagents.

## Tested-Paths / canonical binding

Canonical primitive: SHA256 of LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below followed by **entire exact source VC bytes** including finalLF, without fences/markers. All seven candidate blobs independently equal tested worktree bytes. Report/transient probes/remote metadata excluded. This binding names the directly tested physical/metric surface, not full bootstrap acceptance.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/model/step.ts` | `60b40f07d897a2cab1434bb5624f6007ee30d880` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |

## Frozen execution evidence

Actual local ignored directory: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/820a21db/`. These auxiliary hashes are execution proof, not substitutes for the canonical Git-blob+entire-VC primitive.

| Evidence file | SHA256 |
|---|---|
| `peak-cycle.mjs` | `b46931e07d8f06620b68852d2e71014cd46fe73e5a3de04032f7e04c5a748275` |
| `peak-cycle.json` | `2ae30d7ce7dd9e9d6eaeeebe592bec9bb14ecaaf6a051038f262e1aefce118ff` |
| `peak-cycle-binding.json` | `9d730a53b280e4140ae41a88f4046a738f610728c896271578ab5640b0e1188c` |

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
