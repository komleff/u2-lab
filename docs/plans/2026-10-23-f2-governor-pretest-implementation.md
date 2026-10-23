---
title: "F2 governor 0.3: план реализации предварительной квалификации в U2 Lab"
status: PLAN_READY / DEV starts with F2-G0 only / runtime NOT RUN
version: "0.2"
date: 2026-10-23
tags: [pm, product, plan, f2, governor, thermal, power, persistence, handoff]
related:
  - docs/plans/2026-10-23-f2-governor-pretest-design.md
  - docs/reviews/2026-10-23-f2-governor-pretest-adversarial-review.md
  - docs/reviews/2026-10-23-f2-u2-pm-integration-review.md
---

# F2 governor 0.3: план реализации предварительной квалификации в U2 Lab

## 1. Статус, результат и запрет преждевременного DEV

Режим — **PRODUCT**. Этот документ переводит принятый design v0.2 в исполнимый HOW.
Independent Plan Review дал `CHANGES_REQUIRED` на исходном fingerprint, затем
`PLAN_READY` после закрытия 2 BLOCKER и 3 ADVISORY; exact evidence сохранено в
`docs/reviews/2026-10-23-f2-governor-implementation-plan-review.md`. DEV разрешён только
с первого work item F2-G0 по Delivery First, одним основным Developer и после создания
canonical Beads child разрешённым operator workflow. Runtime пока не реализован.

Фраза принимающего PM U2 `PLAN_READY` относилась только к переходу от design к этапу
планирования и не использовалась вместо независимого review этого HOW.

Целевой результат — opt-in implementation `ship-fitting-ship-model-0.2` внутри
существующего `/4`, которая:

- выполняет переносимый pure governor `ship-thermal-governor/0.3` с шагом 30 Hz;
- детерминированно ведёт общие energy/resource/buffer budgets и полный receipt;
- проходит адресованные synthetic T01–T34/T37–T39, кроме OUT T35/T36;
- буквально сохраняет старую model 0.1 и весь привычный `/4` workflow;
- позволяет воспроизвести `work → recovery → repeat` и сравнить выигрыш с ценой;
- после G2 отдаёт U2 замороженный kernel/fixture пакет для ранней оценки C#-порта;
- отдельно показывает результат или честный `BLOCKED` для Спутника, Мира и Diesel Pony.

Результат не доказывает game/server parity, баланс кораблей, station UX, сетевую
идемпотентность, identity/session persistence, physical-device UX или release readiness.

## 2. Exact source binding и исходное состояние

### 2.1. Обязательные источники

| Источник | Exact binding | Как используется |
|---|---|---|
| Lab design v0.2 | commit `6faa5f1c0a7c977473b70faa613bddf69731942a`, file SHA-256 `351fc231a335a37217b911b2ae7bc406a2c4f0b366b6800ddde201a7973a3628` | WHAT, scope, stage order, preservation matrix и delivery G0–G5 |
| Lab adversarial review | тот же commit, file SHA-256 `cca89b119e050d2366cacb3634ec0fd1e656a869f1af77864c15c291298f5fc5` | architecture/GD/engineering corrections already closed |
| U2 thermal governor 0.3 | PR #893 Draft, head `df7e3cd699dafde5175b48a5853c2c04ece244b2`, source SHA-256 `3ef04723155e9b9f8e285d3bb01228eccfb254623bb2dd51e2d7c6bcd0fc9034` | algorithm and T01–T39 source; head drift requires source diff and affected Plan Review |
| Публичный roadmap | revision 21, 23.10.2026 | F2 is in development, window 16–27 November 2026; schedule is not Lab acceptance evidence |
| F1 ship passports | U2 commit `4a7354ea766854cca3fa1cbb2d15f1044522ff55`, `spec_f1_fixed_ship_presets_v0_1.md` SHA-256 `3297631774785a62f802509189553aa0403fe2c0491e922193a2a5588fde09f7` | accepted identity/fixed-preset inputs for Mir/Pony and unchanged Sputnik boundary; it explicitly does not provide F2 power/thermal TTX |
| Принимающий PM U2 | reviewed snapshot SHA-256 `9b80e3134faca3d4ac3762d71ebd497ed5e7fa7b593708d280ba5ae878ac204a` | five advisory and U2 handoff needs; not exact Plan Review of this document |

Перед каждым work item PM сверяет PR #893 head и current `origin/main`. Изменение
алгоритма, T-ID, F1 passport identity или owner fields останавливает affected item до
документированного source diff. Изменение только base SHA без изменения owners не
аннулирует evidence при совпадающих blob hashes.

Live recheck 23.10.2026: PR #893 остаётся `OPEN/DRAFT` на указанном head; единственный
`build-and-test` завершён `FAILURE`. Документ используется как pinned design source, а не как
runtime/CI evidence.

### 2.2. As-built и gap

Текущий base implementation planning: `origin/main=e3cf501f41803b48d3b4456e75884ade3b798773`.
Существующий `/4` уже имеет `StateV3`, model 0.1, step 1 s, Worker ownership,
checkpoint/RNG, JSON/CSV, live/history/journal/A-B и current catalog 0.3.2. Он не имеет
общего предварительного resource reservation, `T_B(Q)`, stage 0–9, integer 30 Hz
clock, model/state 0.2 discriminators или transferable conformance bundle.

Legacy owners остаются буквальными. Новая реализация не исправляет `src/model/v3/step.ts`
«на месте» и не cast-ит `StateV3` в новое состояние.

## 3. Архитектурный контракт

### 3.1. Владельцы и dependency direction

Новый pure owner — `src/model/governor-v03/`. Он не импортирует DOM, Worker,
`src/app/`, retention или UI presentation. Допустимы только versioned DTO, SI-math и
pure helpers. Направление зависимостей фиксировано:

```text
fixtures / profile / tick input
             ↓
src/model/governor-v03 (pure kernel)
             ↓
runner v0.2 adapter → retention/result/checkpoint
             ↓
existing /4 workspace → existing controls/views/export
```

Существующая model 0.1 продолжает исполняться `src/model/v3/step.ts` и
`src/runner/ship-model-run.ts`. Новый adapter живёт отдельно; общий dispatcher выбирает
реализацию по паре `schemaVersion + modelVersion`, а state/result дополнительно проверяет
`stateVersion + governorVersion`. Dispatch только по `schemaVersion: u2-lab/4` запрещён.

### 3.2. Версии и exact public interfaces

G0 создаёт следующие literals:

```ts
export const GOVERNOR_VERSION = "ship-thermal-governor/0.3" as const;
export const GOVERNOR_PROFILE_VERSION = "governor-profile/0.3" as const;
export const MODEL_V02 = "ship-fitting-ship-model-0.2" as const;
export const STATE_V2 = "ship-state/2" as const;
export const TICK_HZ = 30 as const;
export const TICK_SECONDS = 1 / TICK_HZ;
```

`GovernorProfileV03` содержит только явно заданные SI-поля и provenance каждого
численного листа: `kind`, `unit`, `sourceRef`, optional candidate range/derivation.
Обязательные разделы: ship heat capacity/temperature limits; buffer bank
`T_B(Q)`, capacities, conductance и in/out/shared ports; electrical sources/loads;
finite fuel/working-body resources; module requests/caps/costs/aux heat; surface/TI/H2;
water-tank `W`; mode/hysteresis/protection; RNG/failure policy; Lab-only numerical
`maxTickDeltaK` с provenance `experimental`. Missing/NaN/infinite,
unknown versions/fields, incompatible units и physically inadmissible profiles дают
structured refusal до первого tick. Defaults для отсутствующих TTX запрещены.

Минимальный interface pure ядра:

```ts
export type GovernorTickInputV03 = {
  profile: GovernorProfileV03;
  state: GovernorStateV03;
  requestedMode: "Normal" | "Quiet" | "Combat";
  requests: readonly ModuleRequestV03[];
  environment: GovernorEnvironmentV03;
};

export type GovernorTickResultV03 = {
  state: GovernorStateV03;
  packages: readonly WorkPackageV03[];
  ledger: GovernorLedgerV03;
  decisions: readonly GovernorDecisionV03[];
  trace: GovernorTickTraceV03;
};

export function stepGovernorV03(input: GovernorTickInputV03): GovernorTickResultV03;
```

Функция не мутирует input и не читает wall clock. Все массивы в result упорядочены
по canonical stable IDs. `GovernorDecisionV03.reason` — закрытый union, включающий
resource/power/port/temperature/mode/protection/failure/restart causes; UI не разбирает
строки сообщения для определения причины.

### 3.3. Полное persisted state

`GovernorStateV03` — единственный переносимый state между ticks. Checkpoint создаётся
только после полного commit stage 9; mid-tick state не сериализуется. Обязательные поля:

- `tickIndex` как safe non-negative integer; physical time = `tickIndex / 30`, без
  накопления `timeSeconds += 1/30`;
- `effectiveMode`, последний `requestedMode` и все mode/stage/bank hysteresis latches,
  selected stage IDs и previous transition direction; adapter задаёт только
  `requestedMode`, а effective state принадлежит governor;
- `quietEntryTemperatureK`, вычисленная `quietHoldTemperatureK` и
  `surfaceDeploymentById`; эти значения не восстанавливаются из current draft при reopen;
- `shipEnergyJ`, `bufferEnergyJByBank`, `waterEnthalpyJByTank`, electrical charge и
  finite `resourceMassKg`; температура вычисляется из owner map и не клипуется;
- `moduleStateById` с явными `durabilityR`, `firstNegativeCrossing`,
  `emergencyExposureSeconds`, `cooldownUntilTick`, `restartAuthorized`,
  `durabilityStopped`, `thermalStopped` и закрытым набором `stopReasons`;
- накопленная наработка `emergencyExposureSeconds` до следующей failure check, номер
  следующей проверки и точная policy её достижения; это persisted quantity, а не
  вычисление от текущего clock. Простое открытие документа RNG не продвигает;
- `rng: { algorithm: "xorshift32/1"; seed; state }` и counters actual checks;
- cumulative external service inputs и monotonic service receipt sequence для аудита;
- last committed limiting reasons, необходимые для одинакового следующего решения.

`ShipModelStateV02` добавляет только runner-owned `phaseIndex` и
`phaseElapsedTicks`; его `governor` равен exact `GovernorStateV03`. Поля model 0.1 не
используются как скрытые defaults. JSON round-trip обязан сохранить все числа и latches.

Обязательный adversarial checkpoint fixture сохраняется за один tick до failure/restart
check и рядом с переключением hysteresis. Uninterrupted и reopened runs должны дать
deep-equal следующие decisions, allocations, reasons, RNG state и final state. Floating
telemetry сравнивается по policy §3.6; discrete state — exact.

### 3.4. Tick pipeline и allocation

`stepGovernorV03` исполняет ровно один tick в утверждённом порядке:

1. stage 0 snapshot, permissions, failure/restart state и finite reservations;
2. preliminary stages 1–7 без списания; cold protection `S` и `W` независимы;
3. один electrical dispatch с резервами обычной работы, генераторов и охладителей;
4. final stages 1–7 по фактически выданным electrical/resource caps;
5. commit фактических work packages, потерь, среды и outward owners;
6. stage 8 late S→B capture только оставшимся input/shared budget;
7. stage 9 conservation/protection/RNG commit и `tickIndex + 1`.

Распределение следует одно-проходной формуле PR #893 без water-filling и повторного
распределения. Для resource group сначала вычисляется
`gamma = min(1, M_remaining / sum(mu_i * c_i))` и `c'_i = gamma * c_i`, затем
`D_actual = min(D, G_source, sum(c'_i))` и `g_i = D_actual * c'_i / sum(c'_j)`.
`c_i` уже включает request, module/port/temperature/electrical caps; недоступный consumer
имеет ноль. Неиспользованный консервативный reserve не перераспределяется до следующего tick.

Порядок **обработки** банков наследуется буквально из design §5.3.2: сначала агрегируются
полностью одинаковые physical profiles, затем банки идут most-constrained-first по числу
совместимых canonical consumer keys, lexical compatibility signature и profile fingerprint;
instance ID допустим последним ключом только для физически эквивалентных банков. T39 обязан
сначала обслужить constrained bank→B, затем flexible bank→remaining A. Stable IDs задают
порядок суммирования и получателя последнего floating residual, но не gameplay priority.

Для instrumentation пары после выбора processing order записываются canonical
`bankId, consumerId`. На **один allocator call одной stage/direction** проверяются
`compatibilityChecks <= N*K` и `allocationVisits <= 3*N*K + 2*N + 2*K`; полный tick
публикует сумму и число calls для preliminary/final passes, а не сравнивает её с bound одного
call. Permutation fixtures сравнивают result после сортировки по ID и запрещают зависимость
от input array order.

Новый heat/work одного tick не становится доступным для исходящих запросов этого же tick.
Разрешены только явно принятые late S→B capture и B→S→radiator path. Внутренний transfer
в ledger имеет две равные противоположные записи; outward path имеет одного owner.

### 3.5. UI mode boundary

Pure ядро знает только `Normal | Quiet | Combat`. Existing `/4` mapping фиксирован:

| `/4` model 0.1 label | governor 0.3 mode | Условие |
|---|---|---|
| `Efficient` | `Normal` | только adapter новой model 0.2 |
| `Masking` | `Quiet` | только adapter; existing model 0.1 semantics не меняются |
| `Combat` | `Combat` | прямое соответствие |

Mapping хранится в одном `src/runner/ship-model-v02-adapter.ts`, а не повторяется в UI,
Worker и fixtures.

### 3.6. Integrator, admissibility и численные допуски

Source of truth — энергии/массы, не clipped temperatures. G2 использует conservative
explicit energy update на полном committed ledger одного tick. Profile validator до run
считает worst-case single-tick energy change. Совпадающие thresholds сначала объединяются;
профиль отклоняется, если один worst-case tick может пересечь более одного различного
threshold или если оценка `|ΔT|max` превышает четверть минимального положительного расстояния
между соседними distinct thresholds. При менее чем двух distinct thresholds применяется
обязательный Lab-only `maxTickDeltaK`; при двух и более — минимум этого поля и четверти
threshold separation. Это technical admissibility gate, не игровая настройка/TTX;
отклонённый real profile остаётся `BLOCKED`.

Для conservation на одном tick:

- energy: `|residualJ| <= 1e-6 J + 1e-10 * throughputJ`;
- mass по каждому resource: `|residualKg| <= 1e-12 kg + 1e-10 * throughputKg`;
- port/cap overflow: не более соответствующей energy/mass tolerance; state clipping
  не может превращать overflow в PASS.

`throughput` — сумма абсолютных фактических external inputs/outputs и внутренних transfers
адресованного ledger, а не большой `C_S*T_S`. Нулевой throughput использует absolute floor.

T33 сравнивает 30 Hz с reference 120 Hz в одних physical timestamps на четырёх fixtures:
steady exchange 60 s, threshold crossing 30 s, finite-resource exhaustion 120 s и
`work → recovery → repeat` 180 s. Acceptance:

- temperature: `0.02 K + 0.5% * max(1 K, |T_ref - T_initial|)`;
- cumulative energy: `1e-3 J + 0.5% * max(|ΔE_30|, |ΔE_120|, Σ|reference transfer J|)`
  на сравниваемом интервале;
- resource mass: `1e-9 kg + 0.5% * max(actual consumed kg, 1e-6 kg)`;
- ordered discrete reasons/mode/protection transitions одинаковы; timestamp отличается не
  более чем на один coarse tick `1/30 s`;
- 30 Hz не даёт систематического выигрыша useful output или ресурса сверх той же
  normalized tolerance во всех четырёх траекториях.

Production export `stepGovernorV03` всегда передаёт internal engine frozen
`ClockPolicy{tickHz:30}`. Test-only `tests/governor-v03/reference-clock.ts` вызывает тот же
internal `stepGovernorV03WithClock` с `tickHz:120`; другой stage/resource/protection algorithm
запрещён. Reference state начинается в том же physical time: tick indices и absolute
`cooldownUntilTick` масштабируются ×4, а accumulated work/exposure остаётся в seconds.
Cooldown, hysteresis и failure thresholds сравниваются по physical time; RNG вызывается только
при фактическом пересечении той же failure/restart boundary, не раз на reference tick.
Reference helper не входит в production barrel и не создаёт поддерживаемую 120 Hz model version.

Эти tolerances — критерии сходимости Lab, не новые TTX U2. Их изменение после Plan Review
требует affected review T33 и handoff manifest version bump.

## 4. Game-design/balance contract

Каждая balance knob связана с одним изменяемым profile field, измеримым выигрышем,
ценой и failure/robustness case. `src/experiments/f2-governor-balance.ts` строит только
versioned `balance-candidate/1`; он не меняет default/catalog и не сохраняет candidate как
accepted TTX.

Обязательный `BalanceExperimentReceiptV1`:

```ts
type BalanceExperimentReceiptV1 = {
  version: "f2-balance-receipt/1";
  shipPassportId: string;
  baselineProfileVersion: string;
  candidateProfileVersion: string;
  changedField: string;
  scenarios: readonly ("work" | "recovery" | "repeat" | "failure")[];
  gain: readonly MetricDelta[];
  price: readonly MetricDelta[];
  limitingReasons: readonly string[];
  robustness: "PASS" | "FAIL" | "BLOCKED";
  recommendation: "PROPOSE" | "REJECT" | "BLOCKED";
};
```

Минимальные metrics: useful output/request ratio; first derating/critical/resource time;
recovery time; repeated-cycle output; peak/min temperatures and overshoot; electrical/fuel/
working-body cost; buffer usable/unusable energy; area/mass/slot cost; outward heat/IR/EM owner
ledger; cumulative service input. «Стало холоднее» без full-cycle gain/price не является
рекомендацией.

Paired series из design §5.7 обязательны для capacity vs ports, `T_B(Q)`/conductance,
surface/passive/active, TI, H2, hysteresis/profile temperature, electrical reserve/source и
service/reopen. Численные цели реальных кораблей остаются `BLOCKED`, пока U2 authority не
предоставит accepted candidate ranges/target outcomes.

## 5. Паспорта трёх кораблей

После merge G0 отдельный data work item **F2-P0** может идти параллельно G1/G2. Он создаёт:

- `docs/verification/f2-ship-passports/manifest.json`;
- `docs/verification/f2-ship-passports/sputnik.json`;
- `docs/verification/f2-ship-passports/severin-mir.json`;
- `docs/verification/f2-ship-passports/diesel-pony.json`;
- `tests/governor-v03/ship-passports.test.ts`.

Паспорт разделяет два слоя, которые запрещено смешивать:

1. `u2Identity`: exact U2 hull/preset/loadout IDs, revision, initial state и source hashes;
2. `f2QualificationProfile`: fixed power/thermal equipment IDs/revisions, governor profile,
   initial state, field-level provenance и qualification status.

Принятые F1 anchors:

| Passport | U2 identity/fixed preset | Что не разрешено предполагать |
|---|---|---|
| Sputnik | current `configs/ships/strizh.json`, SHA-256 `74fb47b3b02e79ef51266f8ac9192620733107ac5f60b6a625f62f35e076c3c9`; F1 says TTX unchanged | Lab `sputnik-d` не становится автоматически игровым fixed kit |
| Severin Mir | hull `severin_mir`, preset `f1_mir_fixed` rev 1, loadout `f1_mir_fixed_loadout_r1` | F1 dry ledger does not define installed F2 generators/buffers/cooling |
| Diesel Pony | hull `diesel_pony`, preset `f1_pony_fixed` rev 1, loadout `f1_pony_fixed_loadout_r1` | current Lab `pony-d` and Survival thermal drafts do not silently replace accepted F2 TTX |

Каждый file имеет `qualificationStatus: PASS|FAIL|BLOCKED|NOT_RUN`, `missingFields`,
`sourceCommit`, content hashes и отдельный result record. Skeleton может быть committed с
`BLOCKED`, но numeric governor field не может быть `0`, `Infinity` или взят из nearby preset
вместо отсутствующего owner value. Успех synthetic ядра не меняет status паспортов.

До U2 handoff «три real profiles проверены» требуется три `PASS`; для готовности Lab к
предварительному synthetic тестированию достаточно трёх валидных skeletons с полным списком
PRODUCT GAP. Так мы не блокируем kernel, но исключаем ложный общий успех без кораблей.

## 6. Work items и последовательность PR

Каждый item — отдельный Draft PR от актуального `main`, один основной Developer, RED сначала,
focused checks, затем normal guard, independent QA и один scoped Code Review после DEV. Merge
выполняет оператор. Следующий runtime item стартует от main после принятия предыдущего.
F2-P0 — единственный разрешённый параллельный data track после G0; он не меняет runtime.

Markdown ниже описывает execution order и AC; canonical статус остаётся в Beads. Перед
созданием children PM из основного operator checkout сверяет `ulab-9aa` и stale
`ulab-9aa.18`. В hosted Work bd/Dolt/export не запускаются.

### F2-G0 — versioned contract и conformance harness

Создать:

- `src/model/governor-v03/types.ts`;
- `src/model/governor-v03/schema.ts`;
- `src/model/governor-v03/tolerances.ts`;
- `src/model/governor-v03/conformance.ts`;
- `tests/fixtures/f2-governor/manifest.json`;
- `tests/fixtures/f2-governor/vectors.json`;
- `tests/governor-v03/contract.test.ts`;
- `tests/governor-v03/conformance-manifest.test.ts`.

Step G0.1 RED: unknown versions, missing provenance/units, duplicate IDs, NaN/Infinity,
negative capacities, invalid T_B maps, incompatible bank membership, absent W fields for T16,
unknown T-ID и expected output without tolerance must fail exact assertions.

Step G0.2 GREEN: implement DTO/validators and manifest loader only. Every T01–T39 record has
source commit/SHA, status, units, exact input, expected invariant/output, tolerance and future
test owner. T35/T36 are `NOT_RUN` with reason; game-data-dependent rows may be `BLOCKED`.

Step G0.3 verify: focused Vitest files, `npm run typecheck`, `npm test`, `npm run build` and
`.agents/project/verify.sh`. No runtime switch or new default.

Exit G0: versioned invalid input fails closed; complete T-ID map is machine-readable; old `/4`
tests remain unchanged/pass. Independent QA addresses F2D-01/02/04/09 and `U2PM-A5`.

### F2-P0 — passport skeletons и U2.Shared field map

Создать passport paths из §5 и
`docs/handoffs/2026-10-23-f2-u2-shared-field-map.md`. Field map names every kernel/profile/
state/receipt field, SI unit, nullable policy, C# target candidate and owner; it does not create
U2 code.

RED: one passport missing stable U2 ID/revision/source hash, one numeric field without
provenance, Lab preset presented as U2 authority, or `BLOCKED` without explicit missingFields.

GREEN: extract only accepted F1 identity, freeze hashes, create three separate qualification
skeletons and field map. Do not fill F2 thermal/power TTX.

Exit P0: all three artifacts validate and remain individually visible in final qualification;
their likely initial status is `BLOCKED`, not synthetic `PASS`.

### F2-G1 — resource/buffer pure kernel

Создать:

- `src/model/governor-v03/allocation.ts`;
- `src/model/governor-v03/resource-ledger.ts`;
- `src/model/governor-v03/buffer-bank.ts`;
- `src/model/governor-v03/water-tank.ts`;
- `src/model/governor-v03/conservation.ts`;
- `tests/governor-v03/allocation.test.ts`;
- `tests/governor-v03/resource-ledger.test.ts`;
- `tests/governor-v03/buffer-bank.test.ts`;
- `tests/governor-v03/water-tank.test.ts`;
- `tests/governor-v03/conservation.test.ts`.

RED: T01–T19/T37–T39 vectors for shared resource exhaustion, 10/20/20→6/12/12 allocation,
permutation, common ports, no same-tick reuse, equal/opposite transfers, W cold protection
while hot S cooling remains, TI outward accounting and actual O(NK) operation counter.

GREEN: implement exact one-pass proportional allocation from §3.4 and ledgers.
Over-cap/negative result throws before commit. Stable ID ordering affects only deterministic
residual placement. No staged governor, Worker or UI yet.

Exit G1: addressed T01–T19/T37–T39 subset passes with §3.6 tolerances; no unowned mass/energy,
array-order change or hidden free buffer. Run focused tests and normal guard.

### F2-G2 — staged 30 Hz governor и early U2 handoff

Создать:

- `src/model/governor-v03/modes.ts`;
- `src/model/governor-v03/protection.ts`;
- `src/model/governor-v03/integrator.ts`;
- `src/model/governor-v03/governor.ts`;
- `src/model/governor-v03/trace.ts`;
- `tests/governor-v03/reference-clock.ts`;
- `tests/governor-v03/governor-tick.test.ts`;
- `tests/governor-v03/modes-protection.test.ts`;
- `tests/governor-v03/convergence.test.ts`;
- `tests/governor-v03/continuation.test.ts`;
- `scripts/verify-f2-handoff.mjs`;
- `docs/verification/f2-governor-handoff/manifest.json`;
- `docs/verification/f2-governor-handoff/reference-results.json`;
- `docs/verification/f2-governor-handoff/representative-traces.json`;
- `docs/verification/f2-governor-handoff/known-limits.md`;
- `docs/verification/f2-governor-handoff/u2-shared-field-map.json`;
- `tests/governor-v03/handoff.test.ts`.

RED: stage ordering, preliminary vs final cap, Quiet no-hot-fallback, Normal/Combat, independent
W protection, generator reservation, failure/restart, T20–T30/T32–T34, four T33 trajectories,
checkpoint-before-event continuation and malformed/adversarial profiles.

GREEN: implement stages 0–9 and exact state §3.3. T31 remains outside G2 exit gate.

Freeze procedure is two commits inside G2 PR: first commit contains reviewed kernel/tests;
second evidence commit records first commit as `kernelCommit` and SHA-256 of every source,
schema, fixture, result and trace file. `scripts/verify-f2-handoff.mjs` recomputes hashes and
fails on drift. Manifest fields include governor/profile/schema versions, units, tolerances,
T-ID status, known limits and `runtimeAuthorization: false`.

Representative traces contain every tick for short transition windows and, for longer runs,
the exact ticks around each state change. Mandatory scenarios: shared-port proportional
allocation; Quiet debt→recovery→repeat; power/fuel shortage; checkpoint immediately before
failure/restart/hysteresis event. Every trace row contains tick index, requests, reservations,
actual allocations, before/after state digest and typed limiting reasons.

Exit G2: pure kernel and early bundle independently reproducible; handoff verifier PASS; exact
known limits list says no `/4`, U2 runtime, game balance or station acceptance. Focused tests and
normal guard pass.

### F2-G3 — `/4` integration, Worker и persistence

Создать:

- `src/model/governor-v03/run-types.ts`;
- `src/experiments/ship-model-v0.2.ts`;
- `src/runner/ship-model-run-v02.ts`;
- `src/runner/ship-model-v02-adapter.ts`;
- `src/runner/ship-model-dispatch.ts`;
- `src/runner/ship-model-telemetry-v02.ts`;
- `src/io/ship-model-result-v02.ts`;
- `src/io/ship-model-csv-v02.ts`;
- `tests/governor-v03/runner.test.ts`;
- `tests/governor-v03/persistence.test.ts`;
- `tests/ui/ship-model-governor-v03.test.ts`;
- `tests/browser/ship-model-governor-v03.spec.ts`.

Изменить только integration owners:

- `src/io/fitting-json.ts` и `src/io/fitting-result.ts` — exact model/state dispatch;
- `src/runner/protocol.ts` — create/restore/chunk/control union without changing ACK owner;
- `src/app/ship-model-workspace.ts` и `src/app/ship-model.ts` — opt-in document owner;
- `src/app/fitting-ui/ship-model-conditions.ts`;
- `src/app/fitting-ui/ship-model-channels.ts`;
- `src/app/fitting-ui/ship-model-lab-view.ts`;
- `src/app/fitting-ui/ship-model-results.ts`.

Нельзя менять `src/model/v3/step.ts`, literal readers model 0.1, default experiment/catalog,
global workers/timeouts/dependencies. New model появляется только через versioned imported
qualification document/fixture.

RED и acceptance по preservation matrix:

| Цепочка | Test owner | Обязательный assertion |
|---|---|---|
| Open / fit | UI + browser new spec и existing `ship-model-v0.1.spec.ts` | 0.1 byte/literal behavior preserved; 0.2 explicit and visible |
| Conditions | UI | phases/requests/environment/mode preserved; dt locked to 30 Hz |
| Worker controls | runner + browser | Start/Pause/Step/Resume/Cancel/Reset and ACK owner; Step advances exactly one tick |
| Graphs/live/time/journal | UI + browser | only real v0.2 producers; `tickIndex/30` consistent in every view |
| Frozen A/B | browser | frozen result immutable under draft edits, service preview and other run |
| JSON/checkpoint | persistence + browser | exact discriminators; atomic refusal; reopen next decisions equal; no repeated tick/RNG |
| CSV | CSV test | versions, SI units, tick/retention bounds and actual values |
| Saved data/versioning | parser tests | no migration/recompute/cast; unknown version leaves workspace unchanged |
| Deployment | scope assertion | no publish in G3; LAN/native/server remain NOT RUN |

Exit G3: full preservation matrix PASS on exact candidate SHA; all old model 0.1 regression
tests pass; pure continuation from G2 is repeated through JSON+Worker. Normal guard runs with
existing Node 24 toolchain and unchanged project configuration.

### F2-G4 — service transition и T31

Создать:

- `src/model/governor-v03/service.ts`;
- `src/model/governor-v03/profile-rebind.ts`;
- `src/runner/ship-model-service-v02.ts`;
- `tests/governor-v03/service.test.ts`;
- `tests/governor-v03/service-eligibility.test.ts`;
- `tests/governor-v03/profile-rebind.test.ts`;
- `tests/governor-v03/service-persistence.test.ts`;
- `tests/fixtures/f2-governor/service-vectors.json`.

Изменить `src/runner/ship-model-run-v02.ts` и `src/runner/protocol.ts`: только runner/Worker
пишет `RunContextV02.lifecycle = running|paused|complete|cancelled` при принятых controls.
Service request не может передать или подделать lifecycle.

Public API:

```ts
export function applyGovernorServiceV1(
  profile: GovernorProfileV03,
  state: GovernorStateV03,
  request: GovernorServiceRequestV1,
): { state: GovernorStateV03; receipt: GovernorServiceReceiptV1 };
```

Request содержит только exact additive `chargeJ`, additive `fuelKg` по species и **целевые**
`durabilityR` по instance. Profile/fit rebind в service ABI отсутствует. Receipt содержит
requested/applied/refused values, before/after totals, conservation entries и typed refusal
reasons. Операция atomic: unknown IDs, negative/non-finite values, capacity overflow или
illegal repair target refuse whole request without mutation. Время/tick, `shipEnergyJ`,
buffer/W state, mode/hysteresis, surfaces, timers, RNG, fit/profile и telemetry history всегда
сохраняются; service request не владеет ими. Price, money, station availability и network
command ID отсутствуют; Lab не реализует idempotency повторной команды.

Единственный eligibility owner — `applyShipModelServiceV02` в
`src/runner/ship-model-service-v02.ts`. Он читает trusted `run.lifecycle` и допускает только
`paused|complete`; для `running|cancelled` возвращает typed refusal **до** вызова pure service.
Qualification harness вызывает этот adapter напрямую; нового station UI/Worker command нет.
RUNNING refusal не меняет state, cumulative service totals, receipt sequence, runId, pending ACK
или active ownership.

T31 fit/profile transition выполняется отдельно через `rebindGovernorProfileV03`, не через
service. Он атомарно сохраняет time/tick, `shipEnergyJ`/температуру, buffer/W по stable physical
IDs, mode/hysteresis, surfaces, RNG, durability/history и fit identity; изменение capacity,
которое не вмещает существующий state, либо исчезновение stateful physical ID отклоняется без
переноса энергии в другой узел.

RED: no-service/charge/refuel/repair/combination, capacity boundary, fit/profile rebind,
serialize immediately before and after service, reopen then same next tick, repeated API call
shown as two physical inputs rather than hidden deduplication. Отдельный RED вызывает service
на RUNNING context и доказывает неизменность state/totals/sequence/ownership; PAUSED и COMPLETE
с тем же governor state проходят eligibility и затем pure validation.

Exit G4: T31 PASS only in Lab physical-transition scope; external input appears once in ledger
and cumulative totals; no free buffer/resource/repair. Normal guard pass.

### F2-G5 — qualification, balance receipts и final evidence

Создать:

- `src/experiments/f2-governor-balance.ts`;
- `src/model/governor-v03/recommendation.ts`;
- `tests/governor-v03/balance-receipt.test.ts`;
- `tests/governor-v03/qualification.test.ts`;
- `scripts/run-f2-qualification.mjs`;
- `docs/verification/f2-governor-qualification/conformance.json`;
- `docs/verification/f2-governor-qualification/balance.json`;
- `docs/verification/f2-governor-qualification/performance.json`;
- `docs/verification/f2-governor-qualification/report.md`.

Изменить `.agents/project/verify.sh` только здесь: добавить
`node scripts/verify-f2-handoff.mjs` после deterministic tests. Global timeout, workers и
dependency versions не менять без отдельного AC.

Qualification runner исполняет весь manifest, preservation matrix, four convergence series,
paired balance cases и три passport records. Performance report фиксирует Node/OS/CPU,
N/K, ticks, operation counts, median/p95 wall time и allocations. Gate — bounded O(NK)
operation count and no unbounded iteration; wall time reported as observation, not U2 server
budget or parity claim.

Exit G5:

- каждый required synthetic vector **T01–T34 и T37–T39 имеет `PASS`**; его
  `BLOCKED|NOT_RUN|FAIL` сохраняет qualification незавершённой;
- T35/T36 имеют exact `NOT_RUN` как OUT; `BLOCKED` допустим только для трёх real
  passports, игровых balance series и иных records, явно зависящих от отсутствующих U2 TTX;
- каждый paired experiment даёт full-cycle receipt and recommendation or explicit `BLOCKED`;
- early handoff still verifies against its frozen kernel, later changes documented separately;
- `.agents/project/verify.sh` PASS on exact final SHA;
- runtime QA publishes `Test case | Source AC | Method | Result | Evidence`;
- one scoped Code Review uses explicit Review Contract; blockers receive affected QA/re-review;
- finalize records all NOT RUN/accepted risks; operator alone merges.

Допустимый final claim: «Lab governor 0.3 проходит перечисленные synthetic vectors и
сохраняет проверенный `/4` workflow на SHA X; passports have statuses ...». Claim «F2 ready»,
«три корабля сбалансированы» или «server parity» запрещён.

## 7. Verification Contract

### 7.1. Acceptance Criteria

- **F2I-01 Source:** exact source bindings verified; PR #893 drift handled by source diff.
- **F2I-02 Versions:** model/state/governor/profile/result dispatch fail closed; model 0.1
  remains literal and default.
- **F2I-03 Kernel:** pure 30 Hz step follows fixed stages 0–9 and does not depend on DOM,
  Worker, wall clock or input order.
- **F2I-04 Conservation:** all internal transfers are equal/opposite; energy/mass/ports meet
  §3.6 without corrective clipping.
- **F2I-05 Resources:** one finite reservation ledger covers ordinary work, sources and
  coolers; actual unused reservation is not available until the defined next tick.
- **F2I-06 Buffers/W:** `T_B(Q)`, conductance and common ports are finite; W/T16 remains IN;
  water propulsion/local steam remains OUT.
- **F2I-07 Modes/protection:** Normal/Quiet/Combat, hysteresis, failure/restart and typed
  reasons match T20–T30; Quiet has no hidden hot fallback.
- **F2I-08 Persistence:** exact state list §3.3 survives JSON/Worker reopen immediately before
  an event and produces identical subsequent decisions/RNG.
- **F2I-09 Workflow:** every preservation row in G3 passes; old `/4` is not replaced or
  recomputed.
- **F2I-10 Service:** runner refuses non-paused/non-complete lifecycle before pure physical
  charge/refuel/repair transition; transition is atomic and auditable; no station/payment/
  idempotency/session implementation enters Lab.
- **F2I-11 Conformance:** каждый synthetic T01–T34/T37–T39 имеет PASS; T31 exits at G4;
  любой иной status сохраняет qualification незавершённой; T35/T36 remain NOT RUN.
- **F2I-12 Convergence:** four T33 trajectories meet absolute+relative tolerances and show no
  systematic coarse-step energy advantage.
- **F2I-13 Balance:** every exposed knob has one-field paired full-cycle receipt with gain,
  price and robustness; missing game numbers produce `BLOCKED`.
- **F2I-14 Passports:** Sputnik, Severin Mir and Diesel Pony have separate stable identity,
  fixed-kit revision, initial state, field provenance and result/status.
- **F2I-15 Early handoff:** G2 bundle freezes kernel SHA, profile version, fixtures, expected
  results, units/tolerances, traces with allocations/reasons and known limits; verifier detects
  any drift; `runtimeAuthorization=false`.
- **F2I-16 Performance:** actual N/K and scaled fixtures prove bounded operations and report
  timing honestly without server readiness claim.
- **F2I-17 Lifecycle:** each item has RED/focused/normal evidence, QA and scoped review;
  operator owns merge; no publish/deploy occurs from plan/runtime PRs.

### 7.2. Hostile/edge inputs

Mandatory negative set: unknown/duplicate IDs; array permutation; empty equipment; no buffer;
multiple incompatible banks; exactly empty/full resources; same-tick charge/discharge attempt;
NaN/Infinity/negative/cap overflow; unknown unit/version; missing provenance; thermal bands with
zero/overlap; inadmissible integrator profile; T_env above/equal/below T_ship; H2 at 300 K;
failure and restart on boundary; service for running/cancelled lifecycle; corrupted checkpoint; imported
result with matching schema but wrong model/state/governor version. Every refusal is atomic.

### 7.3. Verification commands per runtime item

Developer first runs only the named RED file and records the expected failure. After GREEN:

```bash
npx vitest run tests/governor-v03/<owned-test>.test.ts
npm run typecheck
npm test
npm run build
bash .agents/project/verify.sh
```

Browser-focused command is added only for G3/G5:

```bash
npx playwright test tests/browser/ship-model-governor-v03.spec.ts
```

Final guard already includes full browser/project checks. Physical LAN, OS-native picker/touch,
Unity/server runtime, network replay and real catalog balance remain `NOT RUN` until separately
executed; isolated/focused PASS never substitutes for the guard.

## 8. Rollback и безопасная деградация

- G0–G2 rollback: remove qualification entry/bundle exposure; pure files have no runtime owner.
- G3 rollback: remove model 0.2 dispatcher registration. Old model 0.1 documents/results remain
  readable; new documents refuse as unsupported/newer rather than being downgraded.
- G4 rollback: remove service harness/API exposure; persisted model 0.2 state remains unchanged.
- G5 rollback: remove qualification report/verify hook only if its source work item is reverted;
  never edit evidence to hide a failed vector.
- No migration rewrites stored data. No force/skip/trust override, silent fallback, automatic
  catalog promotion, merge, deploy or direct main update is allowed.

## 9. Independent Plan Review contract

Reviewer receives this plan, design v0.2, both review files and exact fingerprints. Review
scope: acceptance/ownership boundaries, dependency direction, persisted state completeness,
allocation determinism, numerical policy, passport authority, early handoff reproducibility,
testability, rollback and rework risk. Named high-risk surfaces are persistence/data loss and
cross-repo handoff semantics.

Required verdict был `PLAN_READY` or `CHANGES_REQUIRED`, with BLOCKER/ADVISORY and reviewed
paths/fingerprint. Старый verdict design snapshot не переиспользовался. Отдельный report
зафиксировал initial `CHANGES_REQUIRED` и affected `PLAN_READY`; DEV начинается только с F2-G0
после establishment первого Beads work item через permitted operator workflow.
