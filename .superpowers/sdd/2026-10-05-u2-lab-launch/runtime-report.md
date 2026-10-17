# Runtime Developer report — U2 Power & Heat Lab v0.1

Статус: DONE_WITH_CONCERNS для передачи independent QA и scoped Code Review; это не
acceptance/merge readiness. Роль Developer; по PM dispatch metadata selected/requested model `gpt-6.1-sol`, reasoning effort
`high`. Provider deployment ID недоступен; actual provider deployment не выдаётся за проверенный. Изолированная ветка feat/power-heat-lab,
база4b98d41d98a54ffa937838c676a2666a76f143ed. Subagents, GitHub mutation, bd/Dolt, main/merge
не использовались. Managed framework сохранён; project-owned verify теперь запускает реальные tests.

## Реализованная поверхность T1–T6

- T1: versioned RunSpec SI schema, поле-level origins, два runnable S/M experimental presets,
  source-linked intake и экспортированные JSON в data/catalog. Exact α5.65e-7 kg/(N s),
  σ5.670374419e-8. S stock3.6825GJ, discharge0.9 ровно один раз. M thrust8.82MN не S×4.
- T2/T3: общий аккумулятор; protected hull→proportional active/cooling→Background source-only;
  simultaneous tank flows и depletion boundaries; фактические heat/work/fuel; generator governor,
  path/charge/discharge losses, exhaust channel; одна T_ship, проверяемый dry mass×cp bill.
  Signed incoming/outgoing radiation RK4, finite buffer, powered radiator, power-priced H₂ cooler,
  COP/hot-side-limited thermoinverter, PV и distinct thermal/EM inputs; hot/cold hysteresis.
- T4: русскоязычная responsive страница — конфигурация/модули, четыре графика, events и metrics;
  S/M, module palette и JSON editing, среда, сценарий, duration/dt, start/pause/resume/step/reset/
  cancel/acceleration. Physics dt immutable; runId/commandId ACK и matching chunkId telemetry ACK,
  queue≤1, missing ACK не блокирует control. State-preserving sorties, immediate cargo-full→return,
  явный unload/refuel/charge, service не скрывается.
- T5: immutable A, следующий опыт B; одинаковый target work либо own-full-sortie checkpoints с
  actual metrics. Cumulative consumption survives refuel; H₂ coolant consumption отдельно от
  общей tank consumption. JSON spec/result, CSV trace/events с SI units/cadence/retention.
  Invalid import сохраняет valid prior config; active run display использует frozen ship.
- T6: standalone dist, LAN guide, npm lockfile, actual CI checks/browser setup,24case short matrix,
 12h real kernel/64channel retention и real Worker latency evidence. Ни detector tuning, ни
 3D/wires/backend/accounts/CDN/stock auto-reset в реализации нет.

## Проверки и измерения

Toolchain: Node24.19.0/npm11.9.0; pinned Vite8.3.2/Vitest5.0.3/TypeScript7.0.2/
Playwright test1.63.0. npm engines verified; lockfile install PASS. Typecheck/build — actual exit0.
Project verify запускает typecheck/unit/build/browser и legacy structural/cloud checks без bd writes.

Команды:

```bash
npm run typecheck
npm test
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium npm run test:browser
U2_PERFORMANCE_REPORT=docs/verification/runtime-long-kernel.json timeout 240 npm run test:long
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium bash .agents/project/verify.sh
```

`npm test` — быстрые kernel/schema/scenario/ACK/metrics/I-O/matrix/retention regressions;
`test:long` — отдельный фактический4.32M-step physical replay, не пропуск теста. CI запускает оба.
TDD RED evidence: kernel7 assertions, runner4, I/O3; later red guards/cargo transition/low band/
EM channels/thermal requested visibility; browser fresh-step/frozen display; cumulative refuel,
equal-task checkpoint и aggregate overflow — все affected GREEN. Initial schema tests были
сразу green после реализации: failing initial schema run не захвачен; полного TDD compliance не заявляю.

| Поверхность | Actual результат | Ограничение evidence |
|---|---|---|
| Real S mining12h/dt0.01 |PASS exit0,132.462s,4,320,033 ticks,43,200 buckets,40 channels,52,531,200 estimated retained bytes |33 extra event-aligned substeps; actual memory budget — retained telemetry, не process RSS |
| Real12h metrics |work287.999999985SCU; fuel5299.332360kg; Tmax492.052937K; target809.840s/full-sortie819.840s; residual−0.072141J /64.1072GJ source≈1.13e−12 |benchmark preceding final diagnostic/metric-only fixes; S physical flows/dt unchanged, no post-fix perf repeat claim |
| Synthetic64-channel retention12h/dt0.01 |PASS4,320,000 ticks,43,200 buckets,77,414,400 conservative bytes;7.542s under concurrent compute |distinct synthetic numeric storage fixture, не S ship physics |
| Real Worker late control |≥40,000 buckets,40channels,dt1s idle actual kernel; pause/cancel ACK<500ms |actual Chromium153.0.8010.0; latest exact values runtime-browser.json; deliberately missing telemetry ACK |
| Browser app |S/M live work; A/B; invalid import preservation; pause/step/reset/stale output;390px no overflow; local-only requests; own screenshots |production preview127.0.0.1, не second LAN device |
| Short matrix |24 actual S/M×cold/hot/solar/EM×work/idle/stress×300s finite ledger/work/resource cases |source and exact outputs tests/matrix.test.ts + first-matrix-results.json |
| Legacy structural/cloud |reference/check-bootstrap PASS;26 node cloud fixtures PASS; shell syntax PASS |no actual bd/Dolt/operator/auth export/native acceptance claim |

История bounded failures: default Playwright install CDN zip0MiB / invalid central-directory FAIL,
не browser PASS. PM supplied npm-packed local Chromium153; project Playwright then actually ran.
One refined12h process killed timeout120, затем completed132s test сначала FAIL из-за inner120s.
Inner timeout поднят до240s и unchanged physical replay реально PASS exit0; successful JSON
перезаписал промежуточный output. Native npm/browser tooling остаётся локальной QA surface,
не runtime dependency страницы. Warnings npm http-proxy/NO_COLOR — environment warnings.

## AC mapping / точные границы

P1: production build и actual desktop/mobile Chromium preview PASS; second LAN device NOT RUN.
P2/P12: strict SI/version/provenance/range/species/aggregate/schema cases + S/M round trip PASS;
полный fitted hull/material proof/slot validation остаются source gaps, presets explicitly experimental.
P3/P4: partial battery, no source, protected/active, direct engine, shared H₂ order invariance,
actual-flow heat/work, all path losses/residual analytic fixtures PASS.
P5/P6: dry bill closure/no contents bonus, signed radiation/convergence; finite buffer,
H₂ aux price/starvation/shared consumption, hot-side TI moved+work и powered radiator starvation PASS.
P7/P8: source0/bg0, active below floors, full source headroom, within-step fuel20%/hot margin10K,
thermal hot/cold restart, no idle fuel waste, PV split/EM distinct/source double-count rejection PASS.
P9: chunked/full exact replay, repeated state preservation, cargo stop→return/unload, explicit service
и cumulative consumption, action-ready below100% fixture PASS; real S12h work replay PASS.
P10: missing/stale/wrong/duplicate ACK correlation, queue1, controls while pending, late real Worker,
bounded1s mean/min/max/count with deterministic merge, event first128/last19872/drop notice PASS.
P11: immutable snapshot, different capacities, condition/model/config differences and target/own-sortie
actual checkpoints PASS; unfinished objectives remain explicitly unfinished, no fabricated completion.
P13: actual channel table/plots, limits/events, first constraint/downtime/recovery/work metrics PASS;
DOM shows bounded recent events, complete retained event set exists in export.
P14: scope review through own UI/source — no detector/radar tuning, energy/heat data retained.

Физический long benchmark не повторялся после raw requested-channel visibility, cumulative
consumption/checkpoint metrics и UI fresh-step/frozen-display regressions: эти исправления не меняют
S default dispatch/resource/thermal flows. Последние actual quick tests/typecheck/build/browser/
project verify запущены после fixes; финальные commit/check counts переданы PM отдельно.

## Concerns / NOT RUN

Real second LAN client, native hooks, bootstrap B0/B6/B8 actual operator export/restore/finalize/merge,
CI remote execution — NOT RUN. CI configured, не remote CI PASS. Separate full8h physical case
не выполнялся; arbitrary finite duration/8h preset/repeated runner validated, full12h actual есть.
Собственный frozen A хранится до refresh; durable сохранение — явные JSON downloads, без backend.
Thermal dry assembly Cp — прозрачная experimental effective mixture, не полный canonical material
ledger. Palette adds experimental material band/PV/Background signals (first-matrix.md); M palette
не утверждает production SKU. Whole ship stock initial inputs не silently clamp imported config.

Операторская установка: docs/user/local-network.md. Собственные screenshots:
docs/verification/lab-desktop.png и lab-mobile.png, просмотрены; visible configuration/charts/events,
experimental provenance. PM публикует exact tree, независимые QA/review и operator merge — далее.

Финальная fresh project verify после всех fixes: exit0, typecheckPASS,38 unit testsPASS, buildPASS,
5 actual Chromium browser testsPASS (including screenshots),26 cloud fixture testsPASS, structural/syntaxPASS.
Последний actual late-worker capture:41 760 retained buckets /40channels /dt1s, pause2.2ms, cancel0.2ms.
Reference host: Intel Xeon Platinum8573C,9 logical CPUs, cgroup8GiB, Node24.19.0/npm11.9.0;
Chromium153.0.8010.0. Long report timestamp/values связаны с указанным actual command, не CI host.
