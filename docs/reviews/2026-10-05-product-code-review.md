# CODE REVIEW — Power & Heat v0.1

Verdict: **CHANGES_REQUESTED**. Active BLOCKER: **3**; ADVISORY: **0**.
P1–P14 implementation не готова к acceptance: scoped numerical/thermal и import-display
дефекты ниже требуют исправления. Это не повторное открытие исходных QA F1–F7.

- Mode: CODE_REVIEW.
- Role: independent OverGate Reviewer (RV), same RV session; единственный PRODUCT scoped Code Review, launch #3/5 по PM dispatch. Дополнительных agents/review launches нет.
- Model: selected/requested `gpt-6.1-sol`, reasoning `high`; actual provider deployment ID среда не раскрыла.
- Commit: `afcbdc0e62914ab4ba4b5e953ee1990a13d35557`; tree `2d38ee8e578f90780fd2853582aa9a8682378af3`; branch `feat/power-heat-lab`.
- Remote base supplied by PM: `bootstrap/overgate-v4` at `319da067b715edac16655e0f2ef7b7e28efc306d`; actual stack common base `c226669bcaae95284df18bd5d22824a1f6a7a00d`. No rebase/merge выполнялся Reviewer.
- Stable workspace: `/workspace/scratch/faaeb0182a68/u2-lab-feature`; candidate/bytes проверены независимо.
- Source: `docs/product/power-heat-lab-v0.1.md`; entire `docs/verification/power-heat-v0.1-contract.md`, включая Scoped Code Review contract.
- RV owner: installed `.agents/RV_ROLE.md`, frozen-equivalent blob `6e13e1023c90621172135e206e01fed8bd6b8c28`.
- PM brief: `/workspace/scratch/faaeb0182a68/u2-lab/.superpowers/sdd/2026-10-05-u2-lab-launch/product-review-brief.md`.
- QA read FIRST: `docs/reviews/2026-10-05-product-qa-affected.md`, PASS affected surface; exact SHA256 `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` independently matches bytes.
- Original QA history: `docs/reviews/2026-10-05-product-qa.md`, original FAIL7, exact unchanged SHA256 `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605`.
- Content-Fingerprint: `9e473179e59992b75fac9d3ce0d3ececad75afc6547acd45544f1454b5070330`.
- Entire VC SHA256: `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.

## Scope

Goal: reproducible LAN energy/heat laboratory under P1–P14. IN: src/model/catalog/scenarios/
runner/app/IO, SI/provenance and shared fuel budgets, within-step Background/thermal gates,
radiative exchange/powered cooling, cross-run ACK/long-session state/retention and meaningful
numeric/schema/browser tests, project build/CI wiring. OUT: full OverGate/bootstrap policy
or reinstall, native/operator acceptance, live Beads redesign/mutations, detection, economy,
flight, invented mandatory canonical TTX/material closure and whole private GDD audit.

Review inspected changed runtime and tests, accepted source/contract, QA evidence and current
55-path package binding. Source-reference/historical/wiring rows are preservation/evidence
binding, not fresh live/native/Beads execution. Experimental presets remain explicitly
unapproved; source gaps do not become new canon requirements. Bootstrap B0/B6/B8 and actual
operator merge remain open; historical Git auth/export FAIL preserved. Product PR remains
merge-ineligible until its base and product acceptance complete.

## Findings

| # | Severity | Finding | File:line | Status | Beads ID / rationale |
|---|---|---|---|---|---|
| B1 | IMPORTANT | [BLOCKER] Unbounded single RK4 thermal interval violates accepted half-step integrated-energy tolerance for a valid editable experience | src/model/step.ts:302–311,388–390; src/catalog/schema.ts:54–62 | fix now | P5 + Numerical acceptance: integrated energy half-step convergence ≤0.1%; accepted finite positive dt has no safe solver subdivision |
| B2 | IMPORTANT | [BLOCKER] Physical tank thermal gates are omitted from within-step event boundaries, allowing fuel-powered delivery after the tank high stop | src/model/step.ts:345–358; src/model/thermal-gates.ts:8–11 | fix now | P4/P7 + accepted T2 event-aligned budget/thermal boundary: extra100J delivery and0.1kg burn versus half-step/analytic stop |
| B3 | IMPORTANT | [BLOCKER] Valid imported tank identifiers are interpolated into innerHTML as markup | src/app/main.ts:163,683–696; src/catalog/schema.ts:195–205 | fix now | Changed import/UI security boundary under P12: imported data can create DOM elements rather than literal text |

### B1 — half-step integrated energy, not merely final temperature

Valid synthetic SI input: no modules/tanks/loads, C_ship100J/K with one dry1kg×100J/(kgK)
material, hull εA1m², initial500K, background100K, accumulator100J at100J, charge/discharge
η1, idle10s and physics dt10s. Complete origins are experimental via existing `markEdits`.
Validator accepted this input in the initial numerical probe. Source temperatureAfter applies
one RK4 integration of `dT/dt=−SIGMA*(T^4−100^4)/100` over the entire available interval;
no battery/fuel/module threshold forces a smaller h in this case.

Observed initial source execution: dt10→326.7155347830526K; refined dt0.001 over10s→
342.2766380666977K, while reported residual remained0. The exact half-step comparison below
is static arithmetic evaluation of the inspected RK4 expression, not a new application run:

| Replay over10s | Final T, K | Integrated net radiated energy C×(500−T), J |
|---|---:|---:|
|1×10s |326.7155347830526 |17328.446521694743 |
|2×5s |341.87946502764567 |15812.053497235433 |

Relative integrated-energy difference is **9.5901081%**, versus required **≤0.1%**.
Peak temperature remains500K in both, so final-temperature difference alone is not the
acceptance argument. Computing radiationNet from thermalDelta makes ledger residual0
without detecting this integration error. Fix solver subdivision/error handling, not catalog
numbers or the tolerance. Minimal affected validation: this coarse/half-step valid input,
signed hot/cold exchange, buffer/device constraints and existing analytic/long replay group.

### B2 — missing tank boundaries changes actual fuel/delivery budget

Valid constant-flow fixture: dry C100J/K; no radiation; initial499K; Q0/Qmax100J; hull100W;
one generator100W, ηgen/path/charge/discharge1, moduleBase generator corridor high570K;
diesel tank10kg,1000J/kg, complete physical tank gate
`low100,workLow120,restartLow110,restartHigh480,workHigh450,high500` K. No other source/load.
Over2s the tank reaches500K after1s and must stop feeding the generator. The module gate
is higher; matching it accidentally to the tank would hide this defect.

Initial source probe accepted the fixture and observed dt2→T501K,fuel9.8kg,average
source100W, tank stopped only after the complete interval. Refined dt0.001→T≈500K,
fuel≈9.9kg. Source arithmetic for the exact half-step gives:

| Replay over2s | Final T, K | Fuel remaining, kg | Delivered generator/electric/host energy, J |
|---|---:|---:|---:|
|1×2s |501 |9.8 |200 |
|2×1s |500 |9.9 |100 |

This is an extra100J delivered/host heat and0.1kg fuel burned past the tank protection;
it is not only a gate-event timestamp shifted by≤one base dt. Constant-flow analytic
acceptance1e−6J and half-step integrated-energy acceptance are violated. P4 requires actual
constrained flows; P7 thermal stop/restart must apply to the supplied physical gate.
Accepted launch plan T2 (`docs/plans/2026-10-05-u2-lab-launch.md:110–111`) explicitly advances
the shared ledger to the nearest resource/floor/thermal boundary inside base dt and
recomputes policy over the remainder. Existing thermal-gates.ts recognizes tank gates;
step.ts thresholds only contains buffers/modules, omitting tanks' high/low/restart bounds.
Minimal affected validation: supplied tank stop and restart crossings, shared
engine/generator/cooler consumption and permutation, existing Background/gate group.

### B3 — import data must remain literal display data

configuration() escapes module.id with html(), but inserts module.tankId directly into
the model-note innerHTML string. apply() first validates imported JSON, then invokes
configuration(); schema accepts string IDs matching tank references and fuel keys without
making them safe HTML text. This is a genuine changed UI import trust-boundary defect.

Harmless reproducer data: rename one existing tank ID to literal `<b>tank</b>`, update its
modules' tankId and initial.fuelKg key consistently, retain complete numeric provenance.
The intended display is the literal identifier; current source interprets it as a b element.
Fix by safe text rendering/escaping at the output boundary; numeric or provenance validation
cannot substitute for this. Regression should assert literal text and absence of extra DOM
markup when importing that benign identifier. No active execution payload is included in
this report or needed for the fix/recheck; no further active import test is requested.

## Reproduction instructions and evidence ownership

The exact transient initial numerical probes were run through local Vite SSR imports of
`src/catalog/presets.ts`, `src/model/step.ts`, `src/model/types.ts`, `src/catalog/schema.ts`
on the bound stable candidate. Source was not edited. Both fixtures were assembled from
`structuredClone(presets[0])`, replacements listed above, then `markEdits(p)` and
`validateRunSpec(p)`. B1 replay used source `stepModel(...,10)` and10000×0.001; B2 used
`stepModel(...,2)` and2000×0.001. The preserved observed outputs and static half-step
calculations are printed in this report itself; there is no fabricated separate artifact path.
Exact repro/evidence path for Developer: this report, B1/B2/B3 sections; named source paths
and accepted source files above. Existing durable starting point for relevant failing
regressions is `tests/model/boundaries.test.ts` plus `tests/qa-regressions.test.ts`;
benign import display regression belongs in `tests/browser/lab.spec.ts`.

Following PM instruction, final review completion uses static inspection and existing
numerical evidence only; active import execution is not repeated or embedded. The three
findings were reported promptly to PM. Developer fixes may be prepared in an isolated fix
worktree; this reviewed candidate remains unchanged.

## Checks and retained QA evidence

| Method | Actual result / meaning |
|---|---|
| Reviewer `timeout120 npm run typecheck` |exit0 PASS |
| Reviewer `timeout120 npm run build` |exit0 PASS; production local assets |
| Reviewer `timeout120 npm test` |exit0,51 tests/10files PASS; existing suite does not cover B1–B3 inputs |
| Reviewer initial targeted numerical probes |valid accepted B1/B2 fixtures exposed incorrect coarse thermal/fuel flows; observed results above |
| Reviewer final static half-step source arithmetic |B1 net energy17328.4465 vs15812.0535J,9.5901%; B2 delivered200 vs100J,100% difference relative to half-step |
| Reviewer source/schema/UI inspection |tank event omission and raw imported tankId→innerHTML verified; harmless markup reproducer described above |
| Reviewer package/QA report/entire VC binding |all55 current blobs equal published candidate and QA package; exact report byte hash matches; canonical fingerprint reproduced |
| Independent affected QA retained |Original F1–F7 and adjacent supplied tank schema failure closed;51unit/type/build,14schema/18model probes, affected browser/retention and explicitly transferred fresh e91 physical12h evidence remain as reported. They do not cover the three new inputs. |

The original FAIL7 report is preserved byte-for-byte. The e91 physical12h→56a5 transfer
uses explicitly unchanged physical blobs/input; final report-inclusive publication changes
no reviewed physical source. This review does not repeat that benchmark or substitute old
5956 evidence for the corrected integrator. Missing combined browser64-channel/dt0.01
late-control, browser heap snapshot and physical second LAN-client evidence remain NOT RUN
as stated by QA. There is no newly invented universal TTX/model rule in these findings.

## Reviewed-Paths / canonical binding

Explicit55-path scoped PRODUCT package matches independently rechecked QA binding.
Runtime/model/schema/runner/IO/UI/build/tests reviewed semantically; source-reference,
historical report/checkpoint/cloud wiring paths are read/preservation/evidence binding,
not a new broad upstream audit. Canonical ADR3.28З/3.29 primitive: SHA256 of LC_ALL=C sorted
`path SP candidate Git blob SHA1 LF` rows below followed by **entire exact VC bytes**,
including final LF, without fences/markers. This report/QA report/transient artifacts/
remote metadata are excluded. Scope fingerprint is not full bootstrap acceptance.

| Reviewed-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-report.md` | `e883f5cfed153698eff907ee124ff4a4baaf9d1c` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/runtime-report.md` | `837a53fbb54817e971817884af36a9033bd3cbed` |
| `README.md` | `5b538b06b50719e7a900bc6057f84db32b94acb4` |
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
| `src/app/main.ts` | `98ba7ddca98f990f2353567844ce5fea92d45879` |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/io/json.ts` | `4d0b518c97bee32bcd0bd9a9d6ac05b603a88cb3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `fd3de5f381a56e69acff6bd8f1b639fed653ba51` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/browser/lab.spec.ts` | `dee01deb41d88f6ce3821ddb52e6d181b917b2de` |
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
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

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

Real second LAN client, browser-specific retained heap snapshot, combined64channel/dt0.01
late real Worker replay, fresh current physical12h and actual remote CI executions were not
performed by Reviewer. Supplied PM CI metadata is not independent Reviewer CI execution.
No live Beads/Dolt/applier/import/export/auth/restore, native hooks, trusted finalize,
operator acceptance or merge occurred. B0/B6/B8 and historical auth FAIL stay open.
Full private U2 canon/material proof and excluded detector/gameplay work OUT OF SCOPE.
Only report written; no source fixes/commits/GitHub writes/Beads mutations/subagents.
After fixes: affected QA and same-session scoped re-review of B1–B3 and necessary adjacent
regressions; no new whole-branch audit or reviewer launch required for unchanged surface.
