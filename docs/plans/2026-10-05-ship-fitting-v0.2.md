---
title: "U2 Ship Fitting v0.2 — implementation plan"
status: draft
version: "0.2"
date: 2026-10-05
beads: [ulab-73w]
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
  - docs/verification/ship-fitting-v0.2-contract.md
---

# U2 Ship Fitting v0.2 Implementation Plan

> Для исполнителя: использовать `superpowers:executing-plans` и один основной Developer
> по `.agents/PM_ROLE.md`. Repository authority требует Beads как единственный tracker:
> ниже нумерованные шаги, без checkbox статусов. PRODUCT имеет один independent Reviewer,
> а не новый review gate на каждый task. Этот документ описывает HOW, не принимает новый WHAT.

**Goal:** собирать законные лабораторные корабли и проверять полезность1/2/3 mining lasers.

**Architecture:** catalog и fit domain компилируются в immutable resolved numerical snapshot.
Версионированный v2 kernel рассчитывает per-instance нагрузки, electric propulsion и typed
mining/cargo; существующий v1 kernel остаётся для exact legacy replay. UI fitting controller
использует существующие Worker/charts/retention, новые role metrics и сравнение условий.

**Tech Stack:** текущие TypeScript7.0.2/Vite8.3.2/Vitest5.0.3/Playwright1.63.0, Web Worker,
static HTML/CSS; без новых dependencies и backend.

**Spec:** [GDD](../gdd/gdd_u2_ship_fitting_v0.2.md),
[VC SF01–20](../verification/ship-fitting-v0.2-contract.md),
[sources](../research/ship_fitting_source_synthesis.md).

## 1. Target → as-built → gap

Target: hull/slot/module fitting с конечными запасами, рабочим результатом и измеренным
первым ограничением; Power & Heat обслуживает fitting, не задаёт всю продуктовую навигацию.
Baseline `origin/feat/power-heat-lab@6fb7166513627941e2ba2c4a9a01c79ae1667820`:
hardcoded S/M snapshots,8module kinds, один общий duty, любой load производит work,
direct fuel-only engine, untyped cargo, нет слотов и field catalog items.
Уже есть finite stocks, thermal/energy ledger, Worker ACK, retention, A/B и JSON/CSV.
LAN HTTP0.1.1 имеет affected QA PASS и scoped APPROVED; переоткрывать исправленный bug
или чинить его заново не нужно. Public Pages пока0.1.0, не current candidate0.1.1.

Gap закрывается новым domain и v2 semantics. Не копируем игровые runtime configs и не
расширяем старый v1 catalog под видом сохранения модели. Не делаем whole-app refactor.
Малые этапы: T1–T2 independently testable fitting domain; T3–T4 executable mining model;
T5–T7 complete browser workflow и release candidate. До T7 не публикуем промежуточный
вводящий в заблуждение ship simulator.

## 2. Global constraints

1. Четыре категории/propulsion roles; one-slot-one-item, single/pair, smaller-fit, built-ins
   не снимаются. Mixed Class законен, Class не меняется от корпуса; floors по GDD§4–5.
2. Six hull profiles и40 curated items из GDD§4–5; не Cartesian catalog. Каждый preset
   complete declared SI/material numerics, field-level source/derivation/experiment ranges.
3. Cargo owner1.7 primary, SCU=1m³; density1500kg/m³ LAB-ORE-01, ranges1000–3000;
  24MJbeam/SCU, process factors1, return fraction0.35(range0.30–0.40).
4. K_use фиксирует selected group до Run, включая выключенные в процессе изделия;
   знаменатель не изменяется duty/выключением. Нет universal ranking или денежного ROI.
5. Mass/C/dry bills, typed shared stocks, signed radiation, thermal hysteresis, finite
   cooling и электрические потери сохраняются; no free contentsC и nominal fake output.
6. Runtime snapshot immutable; schema `u2-ship-fit/1`, run schema `u2-lab/2`, model
   `ship-fitting-ledger-0.2`, catalog `ship-fitting-0.2.0`; старый `u2-lab/1` остаётся
   model `radiative-host-ledger-0.1`. Никакого автоматического v1→slot-valid v2 upgrade.
7. Max50000buckets/128MiB retained traces; max20000events(first128+last19872),
   one unacked telemetry chunk, controls ACK≤500ms. Dynamic channel roster фиксируется
   при Run; aggregate metrics считаются на physics step, не по downsampled events.
8. Ship profiles S/M/L, sources typed diesel/H₂; electric drive не новый fuel species.
   Generator optional, battery mandatory, XL reactor вне curated scope, XXL inactive.
9.390px touch/keyboard, обычный HTTP LAN, HTTPS Pages с `/u2-lab/` prefix,
   standalone extracted dist, same-origin requests, user labels только text.
10. Нет detection/сensors/combat/economy/ownership/manufacturing/full flight solver,
    аккаунтов или game-config writer. Service duration — scenario parameter; F/m не ETA.
11. Новый код только после принятия PO новых design деталей **и** independent PLAN_READY.
    Runtime QA/Code Review/finalize/merge ещё впереди; агент не merge/push main.

## 3. Review focus

- Заменить встроенный трюм/аккумулятор или потерять его массу при swap: T2 positive/negative.
- Сохранить zero-stock и partial fit, затем запустить: T2 readiness/T5 buttons/T4 truthful stop.
- Shared H₂ и same-SKU instances при simultaneous deficit: T3 stock/ID accounting.
- Неполный cycle/0SCU и выключение laser ради красивого K: T4 exact metrics.
- Unknown catalog/version либо late chunk после import: T6 atomic failure/T5 run identity.

Все пять имеют адресные тесты ниже. Future implementation может уточнять HOW без новой
WHAT surface; изменение метрик/слотных правил/численных hypotheses возвращается GD/PO.

## 4. File and ownership map

| Unit | Create | Modify / reuse | Responsibility |
|---|---|---|---|
| Catalog | src/fitting/types.ts, catalog.ts, data/hulls.json, data/modules.json | Source manifest read-only | Hull profiles, items, candidate bill/provenance; no simulation |
| Fitting | src/fitting/validate.ts, compile.ts, cargo.ts | Existing ValidationResult shape | Assignments, readiness, resource graph, bill→resolved snapshot |
| v2 kernel | src/model/v2/types.ts, step.ts | Pure thermal-gates.ts/scheduler.ts; existing v1step stays isolated | Per-instance consumers, electric drive, beam return, shared stocks |
| Scenarios/metrics | src/scenarios/fitting.ts, src/runner/mining-metrics.ts | runner/run.ts, metrics dispatch | Phase requests, cargo output, role result/first cause |
| UI | src/app/fitting.ts | main.ts, charts.ts, compare.ts, styles.css, index.html | Fit revision/controller/view; preserve existing legacy lab mode |
| Persistence | src/io/fitting-json.ts, fitting-csv.ts | io/json.ts, catalog/schema.ts dispatch, runner/protocol.ts | Version envelope, validation, snapshot replay, units |
| Tests | tests/fitting/*.test.ts, tests/model/fitting-*.test.ts, tests/browser/fitting.spec.ts | Existing kernel/runner/retention/long/browser tests | AC coverage + affected regression |

Data is lab-owned frozen source-derived/experimental authoring. U2 owners remain WHAT
authority. Fit domain owns assignment/resource references; numerical kernel never infers
slots from mass. UI never computes a second independent physical bill. Runner selects
supported model version explicitly; old model/config/type path remains available.

## T1. Author the curated catalog — SF01/SF05/SF15

**Files:** new fitting/types.ts,catalog.ts,data/{hulls,modules}.json;
tests/fitting/catalog.test.ts; docs/research source manifest remains frozen.

**Interfaces:** define/export `HullProfile`, `ModuleItem`, `ModuleInstance`, `ShipFit`,
`ResolvedShip`, `FitIssue`, `FitReadiness`, `FitValidation`, `CandidateCatalog`.
ShipFit includes `schemaVersion`, `fitRevision`, `catalogVersion`, hullId,
assignments(slotId→instanceId), instances(instanceId→itemId/variant/mode), localVariants;
builtins are separate immutable hull-owned instances. IDs unique across both sets.
ModuleItem includes category/size/family/formFactor/propulsionType/generationState,
dry material bill, operating numerics, origins. No nullable numeric holes in ready items.
`loadCandidateCatalog(): CandidateCatalog`; `getPresetFit(id: string): ShipFit`.

1. Write failing `six_presets_and_40_items`, `cargo_17_supersedes_csv`,
   `pony_identity_and_builtin_bill`, `no_unbounded_generation_interpolation` tests.
   Assert SF01 constants, exact UniversalS12/8945.439461kg and BulkS24/1800kg;
   derived mass/C match1e−8, numerical fields finite with units/origins/ranges.
2. Run `npx vitest run tests/fitting/catalog.test.ts` → RED on missing authored data.
3. Author exact40 items and six profiles in GDD, sourcing stronger owners for known fields.
   Fill unclosed material bills with explicit LAB-STEEL-MIX470J/kgK, builtin cargo recipe
  6V^(2/3)×120kg/m² and shell hypotheses from GDD§5. Freeze source anchors/generation floors.
   Missing non-anchor mass/material/gate fields use explicit engineering candidate recipe
   recorded in each item, range±25% for dry mass, cp350–900; selected gate defaults
   lab candidate low200/workLow250/restartLow260/workHigh500/restartHigh480/high550K
   only if no stronger family gate. Values are not canonical or production proofs.
4. Author one complete starting fit per hull and named1/2/3 control variants. Prefer source
   Civil diesel/electric items; IndustrialM/L may mount smaller items. Include typed tanks,
   mandatory battery/roles and a legal cooler/radiator; E no generators/tanks.
5. Run catalog test + `npm run typecheck` → PASS. Commit catalog with field provenance.

## T2. Validate and compile fitting — SF02–06

**Files:** fitting/{validate,compile,cargo}.ts; tests/fitting/{compatibility,bill,cargo}.test.ts.

**Interfaces:** consumes T1 types;
`validateFit(fit: ShipFit, catalog: CandidateCatalog): FitValidation` (issues+readiness,
separate placement error and missing mandatory warning);
`compileFit(fit: ShipFit, catalog: CandidateCatalog): ValidationResult<ResolvedShip>`;
`allocateCargo(ship: ResolvedShip, amountsM3: Record<string, number>): ValidationResult<CargoAllocation>`.
CargoAllocation holds specialized and universal per-commodity allocations. ResolvedShip
contains installed instance roster, frozen dry bill/C, capacities and typed resource graph.
Fit edits always clone; compile rejects incomplete mandatory modules but save allows draft.

1. Write failing tests with S2×S, Pony3total, M3, L3+hold, XS battery in S, paired/single
   conflict, builtin removal, duplicate IDs, mixed diesel/H₂ powered roles, E/A fuel,
   XL reactor in L and compatible D+H₂ utility cryotank. Assert actual slot errors/paths.
2. Add `swap_rebuilds_bill_once`, `zero_stock_is_warning`, `generator_optional_battery_required`,
   `universal_volume_not_duplicated`: U12+Bulk24+Liquid18 **не**54для каждого товара;
   compatible aggregate≤54, bulk alone≤36, liquid alone≤30, fuel source excludes cargo.
3. Run named tests → RED. Implement signatures using one frozen resolved bill and explicit
   origin-preserving resource references, not copies of tank stock. Save readiness returns
   complete/incomplete plus structural/scenario issues separately from resource warnings.
4. Run `npx vitest run tests/fitting` + typecheck → PASS; commit domain.

## T3. Versioned per-instance numerical model — SF07–11

**Files:** model/v2/{types,step}.ts; runner/run.ts model dispatch;
tests/model/fitting-{energy,stocks,drive}.test.ts; tests/fitting/run-validation.test.ts.

**Interfaces:** consumes ResolvedShip; define `RunSpecV2`, `StateV2`, `StepResultV2`,
`RequestFrame`, `MiningProcess`, `TelemetryDescriptor`, `AnyRunSpec = RunSpec | RunSpecV2`.
RunSpecV2 has schema/model/catalog versions, resolvedShip/fit snapshot, SI origins,
initial stocks/cargo, environment, phases with requests(instanceId/role→duty), fixed
selectedWorkGroup, process, duration/step. StateV2 owns shared tanks, gates, charge,
buffers, cargo allocations/current mass, cumulative extraction and limitation intervals.
`validateRunSpecV2(input: unknown): ValidationResult<RunSpecV2>`;
`initialStateV2(spec: RunSpecV2): StateV2`;
`stepV2(spec: RunSpecV2, state: StateV2, dt: number, requests: RequestFrame): StepResultV2`.
Runner `createRun`/`runChunk`/`result` dispatch by model; exported result has tagged spec.
Keep legacy step.ts and radiative-host-ledger-0.1 values/algorithm unchanged.

1. Write failing isolated tests: electric bus0→force0/noSCU; requested force ratio after
   deficit; diesel direct consumesαF;3CivilS demand9MW vs8MW finitebattery; sharedH₂
   generator/cooler depletion sum≤stock; beam output/return0.35/host ledger exactly once.
   Electric cF useful, bus=cF/(.95×.90), heat=bus−useful, self-export0.
2. Add unknown/duplicate instance IDs, malformed gates/ranges, nonfinite values, invalid
   request duty/duration tests; module kinds carry typed output rather than generic load mining.
3. Run failing files → RED. Implement proportional governor delivery after protected loads,
   finite within-step stock exhaustion, independent ID state and authoritative energy ledger.
   Reuse pure signed radiation/gate math; explicitly dispatch legacy rather than modifying
   its cargo/laser anchor. Delivered useful electricity is distinct from chemical energy.
4. Run named files + existing tests/model + qa-regressions/review-regressions/peak-cycle → PASS
   with VC numerical tolerances. Commit model and version dispatch.

## T4. Scenarios, cargo and useful-result metrics — SF06/SF07/SF10/SF12–15

**Files:** scenarios/fitting.ts, runner/mining-metrics.ts; runner/run.ts;
tests/fitting/{scenarios,mining-metrics,comparison}.test.ts.

**Interfaces:** `makeMiningRun(fit: ShipFit, catalog: CandidateCatalog, conditions: MiningConditions): ValidationResult<RunSpecV2>`;
`initialMiningMetrics(spec: RunSpecV2): MiningMetrics`;
`updateMiningMetrics(metrics: MiningMetrics, previous: StateV2, step: StepResultV2, dt: number, spec: RunSpecV2): void`;
`compareMiningConditions(a: RunSpecV2, b: RunSpecV2): { comparable: boolean; differences: string[] }`.
MiningMetrics defines cycle/horizon SCU/time, species+purpose consumption, forced downtime,
partial loss, recovery/null, K_use/interval label, earliest limiter grouped causes and
per-cause overlapped intervals. Metrics are accumulated before retention and UI display.

1. Write failing tests: one laser1s→.0625125SCU; chosen group3 lasers,10swork+10sidle,
   fully powered work→K=.5, turning one off→K=1/3 with same denominator; no extraction→
   per-unit N/A, 0group→N/A. Assert target success not limiter, simultaneous power/heat
   grouped, cooler exhausted without work loss not main limiter, missing recovery null.
2. Add `cargo_full_partial_step`, `unload_not_stock_reset`, `repeat_carries_stocks`,
   `unfinished_cycle_not_complete`, `approach_requests_march_only`, `conditions_mismatch`.
   Direct propulsion shortfall is its own warning; fixed phase duration is not route completion.
3. Run named tests → RED. Implement signatures, clipping useful extraction to remaining
   compatible volume and applying returned heat according to actual emitted beam.
   Define target checkpoint/horizon/full cycle labels exactly as GDD, include planned
   transit/service in denominator, forced downtime only during requested mining.
4. Run tests/fitting + dt0.01/.005/.0025 depletion/gate/cargo fixtures → PASS≤VC bounds.
   Commit scenarios/metrics with deterministic oracle fixtures.

## T5. Browser fitting workflow and comparison — SF03/SF13/SF15–17

**Files:** app/fitting.ts, app/{main,styles,charts,compare}; index.html;
tests/browser/fitting.spec.ts, tests/fitting/controller.test.ts.

**Interfaces:** `mountFitting(root: HTMLElement, catalog: CandidateCatalog, onRun: (spec: RunSpecV2) => void): FittingController`;
FittingController methods `getFit(): ShipFit`, `applyFit(fit: ShipFit): FitValidation`,
`showRun(result: RunResultV2): void`, `destroy(): void`. Define RunResultV2 as tagged
v2 result from runner/run.ts; keep legacy chart adapter rather than duplicate graph engine.
Controller owns next fitRevision; Worker owns running numerical snapshot; A/B frozen copies.

1. Write failing preset→slot→filtered catalog→delta→swap→Run test at390px and desktop;
   test incompatible/builtin swap explanation, partial-save/missing-mandatory Run disabled,
   stock warning permits complete-run, F3 sources/units, zero-output/missing-recovery labels.
2. Add edit-during-run immutable snapshot, reset/import old chunk/ACK ignored, A unchanged,
   same-SKU toggles independent. Render user labels with textContent/escaped text only.
3. Run named tests → RED. Implement F1/F2/F3 view from GDD with inline warnings and keyboard
   selectors; reuse chart channels and existing controls. Show static estimates separately
   from measured result. Comparability guard labels mismatch; no opaque composite score.
4. Run `npx playwright test tests/browser/fitting.spec.ts` and controller tests → PASS.
   Commit workflow; no deployment yet.

## T6. Durable versioned export/replay — SF18/SF19

**Files:** io/{fitting-json,fitting-csv}.ts; io/json.ts,catalog/schema.ts dispatch;
tests/fitting/{io,legacy}.test.ts; existing tests/io.test.ts.

**Interfaces:** `parseFitJson(text: string, catalog: CandidateCatalog): ValidationResult<ShipFit>`;
`serializeFit(fit: ShipFit): string`; `parseExperimentJson(text: string): ValidationResult<AnyRunSpec>`;
`serializeExperiment(spec: AnyRunSpec): string`; `exportFittingTelemetryCsv(result: RunResultV2): string`.
Main imports atomically only after successful validation; supported model snapshot replay
separate from slot validation. Unknown schema/model rejects; unknown catalog fit rejects,
known v2 model full numerical snapshot can explicit replay with “slots unverified” label.

1. Write failing roundtrip of builtins/duplicates/local variants/full origins, changed
   catalog after saved run no mutation, malformed file no previous result loss, malicious
   label remains text, unknown versions clear error, exportedSCU/s/kg/N/K/J/W units.
2. Save representative **baseline v1** files and expected results before new model changes;
   assert exact numeric values/results replay through legacy dispatch, untyped cargo kept
   legacy, no automatic new source reinterpretation. Include out-of-catalog snapshots.
3. Run named tests → RED. Implement envelope parser/serialization and schema selection,
   never lookup-latest to reproduce numerical result. CSV carries schema/model/retention
   and instance/role units; metrics use full accumulator rather than raw event trace.
4. Run fitting IO+legacy+existing io/runner tests → PASS; commit persistence.

## T7. Comparative evidence and static candidate — SF15/SF17/SF19/SF20

**Files:** tests/fitting/matrix.test.ts, tests/long-kernel.test.ts,
tests/retention-memory{.test.ts,.mjs}, tests/browser/fitting.spec.ts;
docs/experiments/ship-fitting-{matrix,sensitivity}.json, docs/user/ship-fitting.md;
existing package version/footer/README release copy only at final candidate.

**Interfaces:** uses T1–T6 public interfaces. New source/model fingerprint bound to exact
build. No new dispatcher/format invented here. Developer owns deterministic tests;
one independent QA then scoped Code Review follow PM pipeline.

1. Build controlled1/2/3laser series on Pony and IndustrialM, plus L3+hold; same conditions
   and declared stocks. Include3laser9MW/8MW deficit, hot background, H₂ utility depletion,
   cargo-first, repeated cycles and CP/mass/ore density/return-heat endpoints. Save failed
   and incomplete outcomes too. Report SCU/h, typedkg/SCU, downtime/recovery/K/first limiter.
2. Test maximum installable curated roster and dynamic telemetry with12h physical run,
   retained heap/GC, peak preservation and event truncation. Channel roster includes every
   installed instance; reuse adaptive retention lower maxBuckets for higher channel count.
   Test ACK withholding + Pause/Step/Cancel≤500ms and newrun stale ACK, not only happy-path.
3. Run `npm run typecheck`, `npm test`, `npm run build`, `npm run test:browser`,
   `npm run test:long` and actual extracted dist over HTTP/non-local-origin/prefix HTTPS
   smoke. Verify checksum/version and same-origin assets. Physical second device marked
   NOT RUN until actual operator check; no substitution with two same-Mac tabs.
4. Publish fresh Developer evidence and proposed matrices, independent QA against SF01–20,
   then one Code Review explicit changed surface. True blockers get affected QA/re-review,
   advisories triaged without auto-expansion. Metadata-only binding preserves matching evidence.
5. Once runtime acceptance and base bootstrap gates pass, prepare static Pages artifact;
   publish under existing authorized Pages workflow only on operator-approved candidate.
   No agent main merge. Verify actual served build and retain prior deployment for rollback.

## 5. Rollback, sequencing and budget

T1→T2→T3→T4; T5/T6 use T3–T4 and complete before T7. One primary Developer sequentially
owns the work item. T1 data authoring may discover stronger owner conflict; stop only affected
field, resolve source/GD, amend contract and affected review before runtime relying on it.
Do not use that as reason to launch unrelated audits or silently fabricate canon.

Legacy v1 route and exports are preserved throughout. v2 schema is additive, no destructive
storage migration or game-config writes. If candidate regresses, revert v2/UI commits and
restore prior Pages artifact, leaving exported files untouched; don't reinterpret them under
old model. Failed load keeps previous state. Data/model revisions invalidate only affected
snapshots; immutable exports remain usable through supported matching model.

This planning Draft PR bases on feature0.1.1, not main; operator later handles stacked merge
order bootstrap→Power&Heat→fitting. Design PR can be reviewed now; runtime delivery waits
for PO detail acceptance + PLAN_READY, final release waits for unresolved bootstrap gates.
Do not amend managed hooks/skills/governance or re-audit old install inventory in this feature.

PRODUCT verification budget5: plan/design Reviewer1, QA2, Code Review3, affected QA4,
scoped re-review5 **if separate sessions are required**. Affected turns inside existing
verifier sessions are not new launches. Source research agents are not verifier launches.
Beads work item ulab-73w tracks design stage; runtime milestones are separate future issues,
not prematurely completed by this document. No runtime tests have run for this proposal.
