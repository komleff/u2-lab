# U2 Lab Power & Heat Implementation Plan

Для agentic workers: PM оркестрирует по OverGate; DEV реализует задачи, QA проверяет AC,
RV выполняет один scoped review. После согласования используется сохранённый метод PM,
а не новая развилка выбора execution method. Номер task — ссылка на deliverable, не tracker status.

Goal: запускаемый в локальной сети browser lab для воспроизводимой настройки энергии/тепла S/M.
Architecture: чистое SI расчётное ядро; versioned data/scenarios; worker runner; простой UI.
Tech stack: TypeScript, Vite, Vitest, Playwright, Web Worker; lockfile без runtime CDN.
Spec: `../product/power-heat-lab-v0.1.md`.
Verification Contract: `../verification/power-heat-v0.1-contract.md`.
Status: PROPOSED; operator approved concept, detailed plan awaits independent review/согласование.

## Target → as-built → gap

Target: static LAN app, конфигурация+графики+события, model/parameter A/B, real work cycles.
As-built: новый локальный checkout, project authority/Memory Bank/планы. Runtime отсутствует.
Gap: remote/Draft PR/OverGate install/Beads publication, runnable catalog, solver/policy,
worker/UI, scenarios, A/B/export, QA/review/current checks. Ничего из gap не объявляется PASS.

## Global constraints

- WHAT и AC принадлежат spec/оператору; baseline parameters — current U2 source owners.
- Scalar power + unified accumulator + shared T_ship; no wires/pipes.
- Physics deviations допускаются как видимые named experiments, не silently canonical numbers.
- First ships: S baseline + M Civilian. No universal M=S×constant.
- Session support: 5/10m, 8/12h и произвольная конечная duration; actual work cycles, not idle calendar burn.
- No detection/sensor/radar tuning. No cloud simulation/backend/auth/multiplayer/CDN.
- PRODUCT needs Draft PR, independent PLAN_READY, затем согласование оператора перед runtime.
- Merge только оператор. Beads task state / Git+PR evidence / Memory Bank context.

## Review focus

1. Partial-step battery/fuel exhaustion: actual work/heat нельзя посчитать по requested power (T2).
2. Противоположный знак радиации в горячем фоне и двойной environmental source (T2).
3. Background floors и recovery могут ошибочно запрещать полезное Active действие (T3).
4. Cancel/reset/import во время batch оставляет stale worker messages/результат (T4).
5. A/B разных трюмов и incomplete/experimental TTX создаёт ложный вывод об апгрейде (T1/T5).

## Последовательность и files

B0 → T1 → T2 → T3 → T4 → T5 → T6. Один основной Developer на work item.
T1 data/schema сначала устраняет неопределённость чисел; не начинать балансный эксперимент
с выдуманным approved preset. T2–T3 одна kernel ownership boundary, без UI physics copies.

| Task | Deliverable / files | AC |
|---|---|---|
| B0 | OverGate install, project verify, Beads/Memory Bank; отдельный bootstrap plan | B1–B8 |
| T1 | Catalog/schema + test toolchain: package.json/lockfile, tsconfig, src/model/types.ts, src/catalog/schema.ts, provenance.ts, data/catalog/{s-civilian,m-civilian,modules}.json, tests/catalog.test.ts | P2/P12 |
| T2 | Coupled balances: src/model/{energy,thermal,cooling,environment,step}.ts, tests/model/{energy,thermal,cooling,environment}.test.ts | P3–P6/P8 |
| T3 | Policy: src/model/{scheduler,governor,thermal-gates}.ts, tests/model/policy.test.ts | P7/P8 |
| T4 | Runner/scenarios/UI slice: src/runner/{protocol,run,worker}.ts, src/scenarios/schema.ts, data/scenarios/*.json, src/app/{main,configuration,charts,event-log}.ts, src/app/styles.css, index.html, tests/{runner,scenarios}.test.ts, tests/browser/lab.spec.ts | P1/P9/P10/P13 |
| T5 | A/B + import/export: src/app/compare.ts, src/runner/metrics.ts, src/io/{json,csv}.ts, tests/{compare,io,metrics}.test.ts | P11–P13 |
| T6 | Release candidate: docs/user/local-network.md, docs/experiments/first-matrix.md, .github/workflows/verify.yml; full AC evidence | P1/P9/P14 + all |

## B0 — инфраструктура до runtime

Исполнить `2026-10-05-overgate-bootstrap.md`. После реального Draft PR, install inventory,
independent approval, apply, QA и scoped review — оператор merge infrastructure.
Не объединять installer self-certification с product review. Продуктовая ветка/PR открываются
на accepted infrastructure; ранее reviewed plan можно перенести без нового LLM review только
при доказанном совпадении reviewed blobs/contract и отсутствии новой reviewed surface.

## T1 — данные и проверяемый контракт

Interfaces:
- `validateRunSpec(input: unknown): ValidationResult<RunSpec>`; errors `{path,code,message}`.
- `RunSpec {schemaVersion,modelVersion,catalogVersion,ship,environment,scenario,initial,stepSeconds}`.
- `ShipConfig` имеет hull/material heat capacity, accumulator, fuel tanks, typed module instances.
- `ParameterOrigin {kind:'canonical'|'derived'|'experimental',sourceRef,derivation?,note?}`.
- `ModelState` содержит timeSeconds, chargeJ, shipTemperatureK,
  `fuelTanks: Record<TankId,FuelTankState>`, buffersJ/capacitorsJ, module gate states и scenario
  progress. `FuelTankState {species:'diesel'|'hydrogen',usableMassKg,capacityKg}`; каждый реальный
  бак учитывается один раз. Resolved module consumer references связывают source/engine/cooler
  с допустимым tankId по current owner и species, без проводки/труб или пользовательской priority.
  Cargo H₂ не входит в power cryotank. Общий бак генератора/двигателя/cooler имеет один actual
  расход, а не независимые device clamps. Если для multiple tanks owner route отсутствует,
  такой preset остаётся gap, а не получает придуманную fuel allocation policy.
- `EnvironmentSample {effectiveBackgroundK,incidentSolarFluxWm2,directHeatInputs,energyInputs}`;
  каждому independently counted input назначается sourceId/representation.
- `ActionRequest {moduleId,duty,targetWork?}`; duty ∈ [0,1], значения мощности/тепла берутся из SKU.

Steps:
1. DEV проверяет current official toolchain versions, фиксирует package versions и lockfile,
   команды `npm run typecheck`, `npm test`, `npm run build`, `npm run test:browser`.
2. Написать failing schema tests: valid synthetic S/M, missing origin, invalid units/version,
   nonfinite/negative capacity, duty out of range, unknown module, missing referenced source;
   dt=0/negative/nonfinite, duration=0/negative/nonfinite, aggregate Qmax=0/C_ship=0,
   temperature below0 K/nonfinite, initial charge/fuel/buffer/capacitor outside [0,capacity],
   wrong-species/missing tank reference. Required dt/duration/Qmax/C_ship finite и >0;
   temperature finite и ≥0 K. Optional zero-capacity parts допустимы при valid aggregates.
   Reject before run with path+reason; не скрытый clamp импортированного initial state.
3. Реализовать types/schema/provenance и повторить tests до PASS.
4. По U2 INDEX открыть необходимые material/cargo/engine/TTX owners, извлечь S/M и базовые
   module family параметры с section+blob IDs. Missing value — explicit candidate или PRODUCT GAP,
   решение оператора до использования такого значения как baseline. GenerationState/MinorStage
   следуют TTX Master, не конструируются из приблизительной оценки.
5. Проверить runnable S/M provenance, сохранить data audit в docs/experiments; commit T1.

## T2 — энерготепловое ядро

Consumes: T1 types, device parameters; environment и requested duty.
Produces: `stepModel(config: ShipConfig,state: ModelState,environment: EnvironmentSample,
requests: readonly ActionRequest[],dtSeconds: number,resolvePolicy:DispatchResolver): StepResult`.
`StepResult {state:ModelState,telemetry:TickTelemetry,events:LabEvent[]}`;
telemetry хранит requested/delivered W, source/heat channels, stocks, actual work и residuals.
`DispatchResolver = (config:ShipConfig,state:ModelState,environment:EnvironmentSample,
requests:readonly ActionRequest[],remainingSeconds:number)=>DispatchPolicy`;
`DispatchPolicy` — target source output/background allowance, выбранные governor/scheduler.
Ядро joint-budget actual flows каждого tankId и electric stock, продвигается до ближайшего
resource/floor/thermal boundary внутри base dt и пересчитывает policy на остаток interval.
T2 tests используют deterministic fixture resolver; T3 поставляет governor resolver.
Это исключает order-dependent double spend shared H₂ без новой игровой priority policy.
Delivered generation/direct thrust/cooling/waste heat интегрируются только за оплаченный interval.

Steps:
1. Failing analytic tests: constant P no source; battery full/empty/within-step exhaustion;
   protected hull vs proportional active shortage; summed capacities; chemical thrust unaffected
   by empty electric stock; requested vs actual load heat/fuel; bounded pulse recharge.
2. Implement energy/step balance with explicit delivered power and curtailment terms; tests PASS.
3. Failing thermal tests: constant heat ΔT=H·dt/C; no cargo heat capacity; outgoing−incoming=net;
   T_surface below background → net heating; exhaust acts only on source's own waste heat.
4. Implement thermal/environment ledgers, source heat split and radiation; tests PASS with
   specified numerical tolerances. Reject duplicate source representation before run.
5. Failing cooling cases: buffer capacity AND power exhaustion; H₂ empty mid-step; active radiator
   electric starvation; thermoinverter moved+work heat, hot-side/area/COP caps. Implement owner
   device laws. Shared tank fixture:1 kg H₂, одновременно generator/cooler хотят0.75 kg каждый;
   total actual consumption≤1 kg, flows соответствуют общей event-aligned depletion, результат
   не меняется от порядка модулей; diesel tank не расходуется H₂ cooler. Проверить совместную
   engine/generator/cooler depletion и aftermath. Half-step convergence/ledger PASS; commit T2.

## T3 — scheduler/governor/protection

Consumes: T1 configuration/state/requests and T2 telemetry/device feasibility.
Produces: `resolveDispatch(config:ShipConfig,state:ModelState,environment:EnvironmentSample,
requests:readonly ActionRequest[],remainingSeconds:number):DispatchPolicy`;
`updateThermalGates(config:ShipConfig,state:ModelState):GateTransition[]`.
Нет user-authored per-device priority rules; Civilian profile parameters from current owner.

Steps:
1. Failing boundary fixtures: bg SoC 79.9/80/80.1/100%, usable fuel 19.9/20/20.1%, exact hot
   margin 10 K; active below bg-only floors; source headroom/recharge precedence; no idle fuel burn.
   Within-step cases: usable fuel20.1% достигает20%; Background нагрев достигает10 K margin;
   source/Active/recovery changes within dt пересчитывают SoC/headroom eligibility. Background
   питается только actual free source headroom и никогда намеренно не тратит battery stock:
   Qmax1000J/Q801J/source0/Active0/bg100W/dt1s → bg delivered0J (protected load учитывается отдельно).
   Active/protected вправе опустить SoC ниже80%; общего80%-clamp нет. Fuel/thermal within-step
   лимиты рассчитываются после actual protected/Active/cooling с электрической ценой cooling.
2. Implement scheduler/Civilian governor from owner; assert recovery to requested next action,
   not forced full charge. Keep user workload independent of operation-policy family.
   Bind resolveDispatch to T2 DispatchResolver and re-resolve every event-aligned subinterval;
   Background stops at its boundary, не тратит запас до конца большого dt.
3. Failing hot/cold work/crit/restart hysteresis cases incl. exact boundaries and repeated
   crossing; implement gate transitions, automatic restart without chatter.
4. Run P7/P8 regressions + T2 balances (including electricity consumed by cooling itself);
   no duplicated thermal/electric allocations. Commit T3.

## T4 — рабочий вертикальный срез

Consumes: validated RunSpec, stepModel/resolveDispatch and scenario phases.
Produces: `runChunk(run:RunContext,maxSteps:number):RunChunkResult`;
`RunContext {runId,spec,state,scenarioCursor}`;
`WorkerCommand = {runId,commandId,type:'start'|'pause'|'resume'|'step'|'cancel',payload?}
| {runId,type:'telemetry-ack',chunkId}`;
`WorkerMessage = {runId,type:'chunk',chunkId,payload}
| {runId,type:'control-ack',commandId,control:'start'|'pause'|'resume'|'step'|'cancel'}
| {runId,type:'complete'|'error',payload}`.
UI drops noncurrent runId; telemetry ACK releases only matching(runId,chunkId) slot;
control ACK matches(runId,commandId). Controls обрабатываются, пока worker ждёт telemetry ACK.

Steps:
1. Failing replay fixtures: idle/work/burst/recovery/environment change/service; mining stops
   at cargo capacity; repeated cycle retains stocks/temperature; chunked/full equality.
2. Implement scenario runner + worker protocol; bounded chunks permit control messages;
   acceleration changes scheduling/steps per chunk, not spec dt. Cancel is explicit, no stale output.
   Retention: incremental full-step metrics; charts use deterministic1s buckets with mean/min/max,
   max50000 buckets and total retained telemetry budget128 MiB. При достижении лимита старые
   plot buckets сливаются детерминированно с сохранением extrema/count/time, kernel dt неизменен.
   Events max20000 records: первые128 и последние19872, total/dropped counts и явное retention
   notice. Event DOM virtualized. CSV сообщает bucket cadence/aggregation и dropped-events count;
   не выдаёт retained aggregates за полный raw tick archive. Run metrics всегда по всем steps.
   Queue≤1 unacknowledged telemetry chunk; следующий только после UI ack. Control messages
   обрабатываются между chunks с worker wall-time target≤100ms; очередь не растёт от slow UI.
   ACK tests: slow/missing telemetry ACK не блокирует pause/cancel и matching control-ack;
   stale/duplicate/wrong chunkId ACK не освобождает другой slot и не возобновляет cancelled run.
3. Add browser failing smoke: configure S/M → start/pause/step/reset; live charts/events;
   reset during long run; local import during paused run; no hidden source parameter edits.
   Long-run fixture:12h/dt0.01s/64 numeric channels, retain counts/bytes≤declared limits,
   queue≤1 with artificially slow UI; final metrics/events match nonplotting replay. Проверить
   controls после накопления≥40000 buckets: pause/cancel ack≤500ms на documented Chromium
   reference host. Отдельно force event cap и verify retention notice/export metadata.
4. Implement configuration/charts/event UI from telemetry, read-only completed result; scenario
   configs include 5/10 min and 8/12 h repeat cycles. Show named cause of first constraint.
5. Run browser smoke/runner tests/build; commit runnable vertical slice T4.

## T5 — A/B и воспроизводимый экспорт

Consumes: immutable RunSpec, RunResult, actual-work traces/events.
Produces: `summarizeRun(result:RunResult):RunMetrics`; metrics usefulWork, firstConstraint,
forcedDowntimeSeconds, nextActionReadySeconds, fuel/coolant consumed.
`compareRuns(a:RunResult,b:RunResult,mode:'same-task'|'own-sortie'):Comparison`;
`parseRunJson(text:string):ValidationResult<RunSpec>`; `serializeRun(run:RunSpec):string`;
`exportTelemetryCsv(result:RunResult):string`; `exportEventsCsv(result:RunResult):string`.

Steps:
1. Failing equal-task vs different-cargo own-sortie fixtures; no comparison hides unmatched
   scenario conditions, model versions or experimental parameters. Implement comparison/metrics.
2. Failing JSON roundtrip/version/input cases; CSV SI headers, timestamps, escaping. Implement I/O.
3. Browser A/B smoke: freeze A, edit B, run both, inspect parameter differences, save/reload
   exact spec and reproduce results. Error import leaves previous valid configuration intact.
4. Run comparison/I/O/browser tests + model regression; commit T5.

## T6 — опытная матрица, LAN и приёмка

Steps:
1. Publish reproducible matrix: S/M × idle/work/burst/recovery/repeated sortie × ordinary/cold/hot/
   solar/declared EM energy environment × 5/10m/8/12h where meaningful. Indefinite full thrust
   отдельный named stress; исходные параметры и версии у каждого результата.
2. Document install/build/LAN host commands; smoke served production build with runtime network
   access blocked except local assets. Prove real second LAN client only when available;
   otherwise report NOT RUN, not invented PASS.
3. Wire CI to actual typecheck/unit/build/browser commands and OverGate structure check.
   .agents/project/verify.sh runs current project checks; no placeholder PASS.
4. PM launches QA against P1–P14 then one scoped Code Review from contract; blockers return DEV
   with reproducible failure. Affected rechecks only; advisory no automatic scope increase.
5. Landing/bookkeeping → fresh current checks → fingerprint comparison → one trusted finalize.
   Operator merge. Итоги баланса/числа утверждаются отдельно в U2, не автоматически в release.

## Rollback / known limits / handoff

OverGate rollback — отдельный B0 plan. Runtime changes reversible by feature PR revert.
Exported experiments immutable; schema version rejection avoids silent migrations.
Live hooks activation текущего hosted runtime не доказана статическими fixtures.
Remote/Draft PR blocked сейчас, installer apply forbidden до снятия этого blocker.
До runtime требуется detailed-plan consent оператора; этот файл не является self-approval.
При передаче незавершённого PM work use frozen OverGate handoff skill, без extra review stage.
