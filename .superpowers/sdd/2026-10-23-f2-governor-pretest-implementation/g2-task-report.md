# F2-G2 Developer task report

Дата: 2026-10-24

Роль: основной Developer work item F2-G2

Модель: Codex / GPT-5; точный backend build интерфейсом не раскрыт

Ветка: `feat/f2-governor-g2-staged`

Draft PR: `#39` (state не изменялся)

Base: `4779d1ef883e3064b4c9a331cf715a8b51e3b228`

Launch commit: `0b2f45dc70acbaabd2aaf8f38a4072cb7048d3c6`

Initial QA candidate: `55c25e44b75dc97eef66234583de2c2cd938bb7c`

First blocker-fix kernel commit: `9d74342cd0eac10381be519e5879f32489584b41`

First evidence-refreeze / affected-QA fix1 candidate: `c1b0b96dc84683209134c8b8bdbd2d0bcb83488b`

Exact B1 fix kernel commit: `b35acaa0ae0db47cffb70c3d85ec0d8aefc0894e`

Scoped Code Review blocker-fix kernel commit: `7580538a11e0e7954313c296c435dc4d06c3c511`

Current evidence-refreeze commit: этот следующий commit; его SHA назначается Git поверх содержимого отчёта и фиксируется в `git log`/Developer handoff. Published commits не переписывались.

Раздел 13 содержит текущую authoritative сводку fix cycle 2 и заменяет более ранние snapshots там, где SHA, totals, version или архитектурная деталь изменились. Предыдущие RED/negative guard результаты сохранены как историческое evidence, а не как current verdict.

## 1. Выполненный scope

Реализовано чистое staged-ядро governor 0.3 с production clock 30 Hz, test-only reference clock 120 Hz, режимами, защитами, конечными ресурсами, одним electrical dispatch, preliminary/final allocation, conservation receipt, persisted state и early U2 handoff bundle.

Первоначальные production/test paths сохранены. Blocker-fix commit изменяет только:

- `src/model/governor-v03/governor.ts`;
- `tests/governor-v03/governor-tick.test.ts`;
- `tests/governor-v03/continuation.test.ts`.

Evidence-refreeze commit изменяет:

- `docs/verification/f2-governor-handoff/manifest.json`;
- `docs/verification/f2-governor-handoff/reference-results.json`;
- `docs/verification/f2-governor-handoff/representative-traces.json`;
- `docs/verification/f2-governor-handoff/u2-shared-field-map.json`;
- `tests/governor-v03/handoff.test.ts`;
- этот отчёт.

Affected-QA fix1 сохранил закрытые B2/B3/B4 без redesign. Новый kernel commit изменил только `governor.ts` и exact T38 regression в `governor-tick.test.ts`; текущий evidence-refreeze меняет manifest/results/traces, handoff assertion и этот отчёт.

Accepted G1 algorithm owners не изменялись. В cycle 2 сделано только разрешённое brief минимальное additive G0 state/schema изменение для versioned persisted numeric authority; детали и regressions — §13. `/4`, Worker, UI, default activation, real ship TTX, station, Unity/server/network/device/deploy не реализовывались.

## 2. Source binding и gate

- Independent affected Plan Review: `PLAN_READY` в `g2-source-drift-plan-review.md`.
- U2 source commit: `40ddffb2832d4dcbe7b2b05501a74c98044386a8`.
- Canonical owner: `docs/specs/thermal/spec_ship_thermal_governor_v0.3.md`.
- SHA-256: `3ef04723155e9b9f8e285d3bb01228eccfb254623bb2dd51e2d7c6bcd0fc9034`.
- Source bytes совпали с предыдущей binding; PRODUCT GAP для выполнения G2 не обнаружен.

## 3. RED-first evidence

Команда:

```text
npx vitest run tests/governor-v03/governor-tick.test.ts tests/governor-v03/modes-protection.test.ts tests/governor-v03/convergence.test.ts tests/governor-v03/continuation.test.ts
```

Первый RED до production implementation:

```text
Test Files  4 failed (4)
Tests       25 failed | 1 passed (26)
Expected cause: Failed to load /src/model/governor-v03/governor
```

Единственный прошедший RED-test был static exact-duration check T33; все behavioral вызовы отсутствующего kernel падали ожидаемо. Полный вывод сохранён локально в `/tmp/f2-g2-red.log`; временный файл не является PR artifact.

После independent QA FAIL на `55c25e4` добавлены durable blocker regressions и до production-fix выполнена команда:

```text
npm test -- --run tests/governor-v03/governor-tick.test.ts tests/governor-v03/continuation.test.ts
Test Files  2 failed (2)
Tests       5 failed | 15 passed (20)
```

Целевые RED причины:

- QA-G2-B1/T38: aggregate H2 consumption `0.16 kg` при `maxFlow=0.10 kg/tick`;
- QA-G2-B2/T24: valid Quiet cold-path deficit падал `RangeError: unowned node energy`;
- QA-G2-B3/T22: `mass*q(T)=0.0075 J` не совпадал с outward `0.04 J`, обе координаты карты не влияли на результат;
- QA-G2-B4: новые event-tick/cold-boundary checks сначала выявили неверно выбранные test preconditions; setup был приведён к валидным exact boundary crossings до kernel-fix, без изменения production semantics.

Полный вывод сохранён в `/tmp/f2-g2-qa-blockers-red.log`; фактический vitest summary/failed assertions, а не shell status временного pipeline through `tee`, является RED evidence.

Affected QA fix1 повторно открыл только QA-G2-B1. До нового production fix выполнена точная исходная репродукция без смягчения:

```text
npm test -- --run tests/governor-v03/governor-tick.test.ts -t 'T38 keeps propulsion'
Test Files  1 failed (1)
Tests       1 failed | 14 skipped (15)
RangeError: unowned node energy
Duration    235ms
```

Вход: fixture `T38`; изменены только H2 `maxFlowKgPerS.value=3` (`0.1 kg/tick`) и `state.electricalChargeJ=0`. Сохранены исходные requests `propulsion=30 MW`, `generator=9 MW`, `cooler=3 MW` и `ship.heatCapacityJPerK=1_000_000_000`. Полный вывод сохранён в `/tmp/f2-g2-fix1-b1-red.log`.

Диагноз класса: общий flow budget уже корректно исчерпывался ordinary → source → cooler, но на high-demand T38 абсолютная `shipEnergyJ` около `4e11 J` обновлялась несколькими IEEE-754 сложениями; последующее вычитание двух больших state values теряло больше, чем неизменённая §3.6 tolerance, и stage 9 отвергал валидный tick. Fix накапливает каждый owned ship delta отдельно, сохраняет промежуточную абсолютную энергию для решений и один раз коммитит итоговую state energy; stage 9 проверяет тот же authoritative owned tick delta. `conservation.ts`, tolerance, audit rules, state clipping, requests и fixture TTX не менялись.

## 4. Архитектура и порядок состояния

```text
validated immutable tick
  -> stage 0: mode/protection/failure snapshot
  -> preliminary stages 1-7
  -> one shared stock+maxFlow budget: ordinary -> sources -> coolers
  -> exactly one electrical dispatch
  -> final stages 1-7 with actual caps
  -> work packages / outward owners / W exchange
  -> stage 8 late S->B capture with remaining ports
  -> stage 9 conservation + RNG/protection + tickIndex commit
```

Authority состояния:

- authoritative ship energy — compensated persisted pair `shipEnergyJ + shipEnergyRemainderJ`; далее `bufferEnergyJByBank`, `waterEnthalpyJByTank`, `electricalChargeJ`, `resourceMassKg`; температура только производная;
- requested/effective mode, Quiet entry/hold, mode/stage/bank latches, selected stages, transition direction и surface deployment;
- module durability, first-negative crossing, exposure, cooldown, explicit restart authorization, thermal/durability stop и reasons;
- failure-check counters/policy и `xorshift32/1` seed/state;
- service audit counters сохраняются без реализации service transition;
- last committed limiting reasons;
- checkpoint выдаётся только после stage 9.

QA blocker mapping:

- QA-G2-B1: каждый `reserveUpTo` атомарно уменьшает и stock remainder, и единый per-resource flow remainder; ordinary/source/cooler не могут повторно использовать обещанную массу в текущем tick;
- QA-G2-B1 exact high-demand conservation: ship-node ledger сверяется с суммой отдельных owned tick deltas, не с numerically unstable subtraction двух absolute energies; exact original T38 boundary возвращает результат, а не exception;
- QA-G2-B2: fuel reservation/output учитывают efficiency; chemical input раскладывается на electrical output и loss, loss — на host heat и exhaust; storage не заряжается аварийным surplus;
- QA-G2-B3: H2 `q(T)` линейно интерполируется по `temperatureK`/`specificEnergyJPerKg`; atomic package выполняет `mass*q(T)=useful+electric+exported aux`;
- QA-G2-B4: reopen сравнивает сам event tick и следующий tick; покрыты failure, hot restart, Quiet hysteresis, cold critical stop и cold restart.

Детерминизм:

- вход не мутируется;
- массивы и решения сортируются по stable IDs;
- closed typed reasons не зависят от UI strings;
- production `stepGovernorV03` всегда выполняет full validation и frozen 30 Hz clock;
- reference helper после первого полностью валидированного tick использует только kernel-produced continuation state с тем же физическим алгоритмом. Это снизило CPU-cost exact 30/120 trajectories без изменения production path.

## 5. T-ID matrix

| T-ID | Статус | Evidence/граница |
|---|---|---|
| T01-T19 | PASS | принятые G1 owners и full regression в том же tree; T16 дополнительно проверен G2 independent W protection |
| T20-T28 | PASS | `governor-tick.test.ts`; T22 q(T) metamorphic, T24 valid allowed deficit/source conservation |
| T29-T30 | PASS | `modes-protection.test.ts`; event tick + following tick reopen; hot/cold stop/restart |
| T31 | NOT_RUN | F2-G4 service/rebind owner; вне G2 exit |
| T32-T34 | PASS | outward owner, convergence contract, no water propulsion/reserve |
| T35-T36 | NOT_RUN | scope OUT: water propulsion/local steam |
| T37 | PASS | принятый G1 TI ledger owner |
| T38 | PASS | exact original QA boundary: `3 kg/s = 0.1 kg/tick`, charge `0`, original `30/9/3 MW` requests and heat capacity; reservation order `propulsion=0.1`, source `0`, cooler `0`, no same-tick reuse, conserved returned result |
| T39 | PASS | принятый G1 constrained-bank allocator |

Machine-readable matrix: `reference-results.json`. `runtimeAuthorization=false` независимо от PASS synthetic rows.

## 6. Convergence T33

Все trajectories исполнялись одним algorithm при 30 Hz и 120 Hz на exact physical durations.

| Trajectory | Duration | abs ΔT 30/120 | T tolerance | abs ΔU_ship | Energy tolerance | Coarse useful advantage |
|---|---:|---:|---:|---:|---:|---:|
| steady-exchange | 60 s | `3.454090347077e-9 K` | `0.025 K` | `0.00345408916473389 J` | `190.476203977823 J` | `4.88853402202949e-12 J` |
| threshold-crossing | 30 s | `7.03051546224742e-6 K` | `0.0959629355988767 K` | `7.03051555156708 J` | `75962.9717514542 J` | `-0.115729526116766 J` |
| resource-exhaustion | 120 s | `6.9479142439377e-9 K` | `0.025 K` | `0.00694793462753296 J` | `381.11578000164 J` | `0.0000377587671209767 J` |
| work-recovery-repeat | 180 s | `2.47821958510031e-8 K` | `0.025 K` | `0.0247821807861328 J` | `960.776678265691 J` | `-1.97815097635612e-11 J` |

Ordered discrete transitions совпали, timestamp difference не превысила `1/30 s`; mass differences прошли `1e-9 kg + 0.5%` policy. Подробные values и transitions: `reference-results.json`.

## 7. Continuation evidence

Пять adversarial reopen checks прошли deep equality для event tick и следующего требуемого tick:

- один tick до failure check;
- один tick до hot restart hysteresis;
- один tick до Quiet cold-cooling hysteresis;
- один tick до cold critical stop;
- один tick до cold restart hysteresis.

Сравнивались следующий result, decisions, allocations, reasons, RNG и final persisted state после JSON round-trip.

## 8. Representative traces

`representative-traces.json` содержит:

- shared-port proportional allocation — каждый tick short window;
- Quiet debt → recovery → repeat — exact ticks до/на/после каждого discrete state change;
- power/fuel shortage — exact depletion window;
- T22 temperature-dependent H2 mass/outward receipt;
- T24 allowed Quiet emergency-source receipt с chemical/electrical/host/exhaust ledger entries;
- T38 exact affected-QA input boundary plus ordinary→source→cooler reservations `0.1/0/0 kg`, original requests, heat capacity and typed reasons;
- checkpoint immediately before failure;
- checkpoint immediately before restart;
- checkpoint around thermal hysteresis stop/restart.

Каждая row содержит tick, requests, full finite reservation replay, actual bank/work allocations, SHA-256 before/after state digests и typed limiting reasons. Unused conservative reservation не становится доступным в том же tick.

## 9. Handoff hash inventory

Kernel binding: `b35acaa0ae0db47cffb70c3d85ec0d8aefc0894e`.

| Category | Path | SHA-256 |
|---|---|---|
| source | `src/model/governor-v03/governor.ts` | `dd5eed57ff098cc6fb61521be469d7bb422284f0a6aa948c5cafdcee69a2a3b4` |
| source | `src/model/governor-v03/integrator.ts` | `7e9baf83a242fbf2e79e455e223fbcce4960dc31d94fb45f53b061fddd9fa407` |
| source | `src/model/governor-v03/modes.ts` | `01edcd3ce43f7304d8d28d25e769f977b923b43b6abb621e0c157e858adb2101` |
| source | `src/model/governor-v03/protection.ts` | `542a8193ae227e10539b32c73855a0f710ff3d3e244d12615e212d27fd845253` |
| source | `src/model/governor-v03/trace.ts` | `88b25f597b32ac9951761cc1aa93d5dd4477dcfe070812fb269c619de78e2862` |
| schema | `src/model/governor-v03/schema.ts` | `f0d73abcd41a1a9794da7bb6f1999aee29387bb71b378a537fbb2d7c9c14ca2e` |
| schema | `src/model/governor-v03/tolerances.ts` | `0eb460472e9182dd1fbe032e4e3812abdea33179013029f5344cc0e735150762` |
| schema | `src/model/governor-v03/types.ts` | `9e83f755d9643f28bd4cff3c5d6d92384afcddad5ede1c7368ccfcef4aff1ef2` |
| fixture | `tests/fixtures/f2-governor/manifest.json` | `40916884d446f29aa3c517d0fd0bd37325c2c989b2c1b67682bffb22b3353c3d` |
| fixture | `tests/fixtures/f2-governor/vectors.json` | `5c0729344d375e1b94af02d7903f3acdfb08db29184f4eee8e67757f02d8e583` |
| result | `docs/verification/f2-governor-handoff/reference-results.json` | `518a7d1002a8489707e3265e8c2da3284678846cb185b58ea72247ea0f8d1e23` |
| trace | `docs/verification/f2-governor-handoff/representative-traces.json` | `bed64b1a50f1ca5efdddc0af754a9e6371a9993905b33db6629585799b1da75f` |
| mapping | `docs/verification/f2-governor-handoff/u2-shared-field-map.json` | `3289504426b1abbdb0c1720c29c3eb27768616bcceb0994ec835768548132eb2` |
| limits | `docs/verification/f2-governor-handoff/known-limits.md` | `8a1c43c6a752788347d79848fd30ed08e1ba8b3b32784f303724440d98e6b5a4` |

`verify-f2-handoff.mjs` проверяет exact artifact set, current hashes, присутствие `kernelCommit`, commit-bound hashes source/schema/fixture, source binding и совпадение kernel SHA в results/traces.

## 10. GREEN и guard evidence

Affected QA fix1 GREEN после `b35acaa`:

```text
npm test -- --run tests/governor-v03/governor-tick.test.ts -t 'T38 keeps propulsion'
Test Files  1 passed (1)
Tests       1 passed | 14 skipped (15)
Duration    450ms

npm test -- --run tests/governor-v03
Test Files  12 passed (12)
Tests       211 passed (211)
Duration    23.26s

node scripts/verify-f2-handoff.mjs
F2 handoff PASS: b35acaa0ae0db47cffb70c3d85ec0d8aefc0894e (14 artifacts)

npm run typecheck
PASS
```

Focused blocker GREEN после `9d74342`:

```text
npm test -- --run tests/governor-v03/governor-tick.test.ts tests/governor-v03/continuation.test.ts
Test Files  2 passed (2)
Tests       20 passed (20)
Duration    293ms

npm test -- --run tests/governor-v03
Test Files  12 passed (12)
Tests       211 passed (211)
Duration    8.52s
```

Handoff:

```text
node scripts/verify-f2-handoff.mjs
F2 handoff PASS: 9d74342cd0eac10381be519e5879f32489584b41 (14 artifacts)
```

Typecheck/build:

```text
npm run typecheck
PASS

npm run build
PASS; 111 modules transformed
Known warning: existing chunks >500 kB
```

Normal suite:

```text
npm test
Test Files  125 passed (125)
Tests       1812 passed (1812)
Duration    173.90s
```

До final candidate первый normal run показал два timing timeout (`buffer-recovery`, `long-currentfit`) при одновременном тяжёлом reference validation. Они не были объявлены PASS. Причина устранена test-only validated continuation после первого full validation; повторный exact normal run выше зелёный. Workers/timeouts/global config/dependencies не менялись.

Exact project guard:

```text
bash .agents/project/verify.sh
exit 0
unit: 125 files, 1812 PASS; 130.49s
build: PASS, 111 modules
browser: 185 PASS, 1 existing screenshot skip
offline intent tests: 26 PASS
bd-env/project wrapper tests: 25 PASS
Bootstrap structural/project checks: PASS
```

Guard явно сообщил: `Native hook activation: NOT RUN (requires actual native adapter smoke)`.

Первый exact guard run текущего fix1-кандидата не был объявлен PASS и сохранён как negative evidence:

```text
bash .agents/project/verify.sh
Native hook activation: NOT RUN (requires actual native adapter smoke)
unit: 119 files PASS, 6 FAIL; 1806 PASS, 6 FAIL; 251.60s
FAIL: model-v3/buffer-recovery timeout 30000ms
FAIL: model-v3/experiments measured 23275.97129200001ms, expected <15000ms
FAIL: fitting/matrix timeout 120000ms
FAIL: fitting/mission-recovery timeout 120000ms
FAIL: signatures/long-currentfit timeout 40000ms
FAIL: ui/buffer-recovery timeout 30000ms
build/browser/offline/wrapper/bootstrap stages: NOT RUN after unit failure
```

Одновременно read-only process inspection показал два внешних Vitest worker из основного checkout `/Users/komleff/Documents/GitHub/u2-lab` примерно по 100% CPU; standalone full unit непосредственно до guard был green 1812/1812. Ни workers, ни timeouts, ни global config не менялись.

После завершения этих workers второй exact guard был повторён без overrides и снова не объявлен PASS: те же шесть unrelated long/performance tests, `119 files / 1806 tests PASS`, duration `271.00s`; measured experiments time `17294.734582999998ms > 15000ms`, остальные пять — те же `30/40/120s` timeout classes. Build/browser/offline/wrapper/bootstrap stages снова NOT RUN после unit failure.

Третий exact run без overrides полностью прошёл:

```text
bash .agents/project/verify.sh
exit 0
unit: 125 files, 1812 PASS; 151.97s
build: PASS, 111 modules
browser: 185 PASS, 1 existing screenshot skip
reference/bootstrap structure: PASS
offline intent tests: 26 PASS
bd-env/project wrapper tests: 25 PASS
Bootstrap structural/project checks: PASS
```

Он снова явно сообщил `Native hook activation: NOT RUN (requires actual native adapter smoke)`. Первые два failed attempts и их последующие NOT RUN stages остаются negative evidence выше; successful retry не стирает их.

## 11. Self-review

- Scope diff проверен: только exact G2 production/tests/evidence/report.
- G0 public DTO/schema и G1 allocation/ledger/buffer/water owners не изменены.
- Нет DOM, Worker, app, retention или wall-clock imports в kernel.
- Нет `/4`, catalog/default, real profile, station, network или deploy mutations.
- Invalid input проверяется до tick; production path всегда full validation.
- Resource consumption не превышает reservation; unused reservation не перераспределяется в том же tick.
- Per-resource `maxFlowKgPerS` разделяется всеми ordinary/source/cooler reservations и уменьшается в canonical order.
- H2 `specificExportByTemperature` влияет обеими координатами и проверен atomic mass/outward equality.
- Valid T24 source path сохраняет efficiency, host/exhaust loss owners, no-charge boundary и conservation tolerance без ослабления audit.
- Energy/mass conservation остаётся ledger-based; state не клипуется для маскировки overflow.
- Quiet hot fallback отсутствует; S/W protection независимы; incompatibility имеет typed evidence.
- Checkpoint/JSON continuation сравнивает event tick и following tick; RNG, allocations, decisions и hot/cold boundaries покрыты.
- `git diff --check`, typecheck, focused, normal, build, verifier и exact project guard пройдены.

## 12. Concerns и NOT RUN

- Локальная среда: Node `25.2.1`; зависимости/config не менялись для скрытия warning. Mandatory Node 24 CI PM ещё NOT RUN.
- Native adapter smoke: NOT RUN по явному сообщению project guard.
- Историческая affected QA по предыдущему candidate прошла; scoped Code Review затем открыл текущий fix cycle 2. Current post-fix QA/re-review и mandatory Node 24 CI остаются PM-owned NOT RUN; counter — `1/3` до обоих PASS.
- `/4`, Worker/UI/persistence integration и default activation: NOT RUN, F2-G3.
- T31 service/rebind: NOT RUN, F2-G4.
- T35/T36: scope OUT / NOT RUN.
- Real ship profiles/TTX и balance acceptance: PRODUCT GAP; synthetic fixtures не канон.
- Unity/server/network/device/deploy, station/payment/session/cloud, detection: NOT RUN / OUT.
- PR остаётся Draft; Ready state, merge, publish и Beads не изменялись.

## 13. Scoped Code Review fix cycle 2 — current authoritative evidence

### 13.1 Commit shape и changed paths

Новый immutable kernel+regression commit после `9dafd0e`:

```text
7580538a11e0e7954313c296c435dc4d06c3c511 fix(governor): close scoped review blockers
```

Он изменяет ровно:

- `src/model/governor-v03/{governor,integrator,schema,trace,types}.ts`;
- `tests/fixtures/f2-governor/{manifest,vectors}.json`;
- `tests/governor-v03/{continuation,contract,governor-tick,modes-protection}.test.ts`.

Изменения `types.ts`/`schema.ts` — разрешённый review brief минимальный additive state interface: persisted `shipEnergyRemainderJ`, version `ship-state/2.1`, обязательная fail-closed validation и отказ от legacy `ship-state/2`. Accepted G1 algorithms (`allocation`, `resource-ledger`, `buffer-bank`, `water-tank`, `conservation`) не менялись.

Текущий evidence-refreeze commit меняет только:

- `docs/verification/f2-governor-handoff/{manifest,reference-results,representative-traces,u2-shared-field-map}.json`;
- `tests/governor-v03/handoff.test.ts`;
- этот Developer report.

### 13.2 Exact RED до implementation

CR-G2-B2/B3/B4 и versioned-state gate:

```text
npm test -- --run tests/governor-v03/governor-tick.test.ts tests/governor-v03/modes-protection.test.ts tests/governor-v03/continuation.test.ts tests/governor-v03/contract.test.ts
Test Files  4 failed (4)
Tests       6 failed | 78 passed (84)

CR-G2-B2: capturedJ=0, expected sourceHostJ=0.16666666666666666
CR-G2-B3: expected persisted shipEnergyRemainderJ, received undefined
CR-G2-B4: final allocations [], expected 200000/400000/400000 J
state gate: missing shipEnergyRemainderJ was accepted
```

Первый combined probe показал, что начальная B1 test setup не достигала permitted deficit (падала только на `-0` assertion). До production-изменений test precondition исправлен на тот же valid T24 cold-path boundary, который воспроизвёл reviewer. Exact B1 RED:

```text
npm test -- --run tests/governor-v03/modes-protection.test.ts
Test Files  1 failed (1)
Tests       2 failed | 4 passed (6)
generatedJ=0.03333333333333333, expected 0
```

Exact input сохраняет T24 requests/heat capacity, выставляет zero charge и valid cold path; два cases проверяют `thermalStopped + restartAuthorized=false + critical-hot-stop` и `durabilityStopped + authorized cooldown`. Полные outputs сохранены локально в `/tmp/f2-g2-cr-blockers-red.log` и `/tmp/f2-g2-cr-b1-red.log`; временные файлы не являются PR artifacts.

### 13.3 Root cause и fix mapping

- `CR-G2-B1`: electrical source исключался из ordinary module plans, а source reservation/cap/actual dispatch не консультировались с `applyProtectionV03`. Теперь один `protectedById` gate запрещает reservation, generator cap и actual dispatch для thermal/durability-stopped source; restart authorization/cooldown/reasons и persisted stop state остаются canonical.
- `CR-G2-B2`: source loss/host heat коммитились после stage 8, а trace возвращал только константный stage list. Теперь actual work → source loss/host/exhaust → environment/outward calculation → late capture → stage 9; `trace.executionOrder` заполняется в реальных execution points. Eligible positive late heat использует только remaining bank ports и не становится same-tick work input.
- `CR-G2-B3`: large `shipEnergyJ` терял sub-ULP delta, а audit сверял intended accumulator. `ship-state/2.1` хранит compensated pair `shipEnergyJ + shipEnergyRemainderJ`; temperature вычисляется как два раздельных quotient, checkpoint полностью сериализует remainder, а stage 9 audit использует разность именно committed pair. §3.6 tolerance и conservation audit не ослаблялись.
- `CR-G2-B4`: ordinary work игнорировал final bank allocations, а ранний stage-1 release съедал общий port. Теперь final canonical allocation резервирует shared output для work, actual package выполняет `transferBuffer`, `usefulOutputJ` выводится из actual pickups, `pickupByBank` правдив, а stage-1 release может использовать только оставшийся port. Exact T07 даёт `200/400/400 kJ`, aggregate `1,000,000 J`.

Current state/ordering map:

```text
validated ship-state/2.1 snapshot
  -> mode + protection + failure snapshot
  -> preliminary stages 1-7
  -> shared resource reservations ordinary -> sources -> coolers
  -> exactly one electrical dispatch
  -> final canonical bank allocations
  -> actual packages and shared-bank transfers
  -> actual generator chemical/electrical/host/exhaust ownership
  -> environment/outward calculation
  -> stage 8 late S->B on remaining ports
  -> compensated authoritative ship-energy commit
  -> stage 9 conservation / RNG / persisted checkpoint
```

### 13.4 Current T-ID and continuation matrix

| T-ID | Current status / evidence |
|---|---|
| T01-T06, T08-T19 | PASS — retained accepted G1 and full-tree regression |
| T07 | PASS — exact 50 MW request / 30 MW shared port; actual allocation, pickup and useful output all `1,000,000 J` |
| T20-T23, T25-T28 | PASS — current G2 focused and governor suite |
| T24 | PASS — allowed emergency deficit, stopped-source zero dispatch, source loss ownership, late capture and conservation |
| T29-T30 | PASS — failure/restart/thermal/durability protection plus hot/cold continuation boundaries |
| T31 | NOT_RUN — F2-G4 service/rebind owner |
| T32-T34 | PASS — outward owner, convergence/no-water, versioned sub-ULP JSON continuation |
| T35-T36 | NOT_RUN / OUT — water propulsion/local steam |
| T37-T39 | PASS — retained G1 owner and exact shared-resource regression |

Continuation now имеет шесть durable checks: failure event, hot restart, Quiet hysteresis, cold critical stop, cold restart и десять повторных T34 sub-ULP ticks. Для каждого применимого boundary reopen выполняется JSON round-trip; event tick, следующий необходимый tick, decisions, allocations, reasons, RNG и final state совпадают.

### 13.5 Current T33 convergence

| Trajectory | Duration | abs ΔT 30/120 | T tolerance | abs ΔU pair | Energy tolerance | Coarse useful advantage |
|---|---:|---:|---:|---:|---:|---:|
| steady-exchange | 60 s | `3.4524987313488964e-9 K` | `0.025 K` | `0.003452449891483411 J` | `190.47620397561062 J` | `4.888534022029489e-12 J` |
| threshold-crossing | 30 s | `7.030515007500071e-6 K` | `0.0959629355988784 K` | `7.030515097081661 J` | `75962.9717514536 J` | `-0.11572952611651033 J` |
| resource-exhaustion | 120 s | `6.946777375560487e-9 K` | `0.025 K` | `0.0069468210567720234 J` | `381.1157799960942 J` | `0.000037758767348350375 J` |
| work-recovery-repeat | 180 s | `2.4783275875961408e-8 K` | `0.025 K` | `0.02478331731981598 J` | `960.7766782747387 J` | `-1.978150976356119e-11 J` |

Machine-readable current results содержат `reviewRegressions` для всех CR-G2-B1..B4. Representative traces дополнены `t24-stopped-generator-protection`, `t24-source-loss-late-capture`, `t34-sub-ulp-json-continuation`; T07 trace теперь содержит actual bank allocations и `pickupByBank`, а не только ratio output.

### 13.6 Current handoff inventory

Kernel binding: `7580538a11e0e7954313c296c435dc4d06c3c511`.

| Category | Path | SHA-256 |
|---|---|---|
| source | `src/model/governor-v03/governor.ts` | `4b5fca8a0da02d6b3b5aa954fb83f9844e19fc98d296e0d84afc1cb7745ee37d` |
| source | `src/model/governor-v03/integrator.ts` | `093766073bf85e25dabc0bd6968bbd52cf1aca9f240fdf9f97e4107bed26e497` |
| source | `src/model/governor-v03/modes.ts` | `01edcd3ce43f7304d8d28d25e769f977b923b43b6abb621e0c157e858adb2101` |
| source | `src/model/governor-v03/protection.ts` | `542a8193ae227e10539b32c73855a0f710ff3d3e244d12615e212d27fd845253` |
| source | `src/model/governor-v03/trace.ts` | `4c68d78713b9a88c7814098503df217576585936e47fb6ab065a196d357b50c7` |
| schema | `src/model/governor-v03/schema.ts` | `89f0c8f6cd54441a87772cc310be6cf3000be3c20c7b71f07b9101c01bb725b2` |
| schema | `src/model/governor-v03/tolerances.ts` | `0eb460472e9182dd1fbe032e4e3812abdea33179013029f5344cc0e735150762` |
| schema | `src/model/governor-v03/types.ts` | `2951a64427f28d5dd35fab5de129fa033983d212459092fd6200880e630f0c5a` |
| fixture | `tests/fixtures/f2-governor/manifest.json` | `30d7648a09b9ad8fe1b606c171a878ccbc0c9bc8b21f648671bb8d8ac1853556` |
| fixture | `tests/fixtures/f2-governor/vectors.json` | `c89df5cfd1c68c7e5ecd440826257e159fe8a547c3aaeee22e0aa5cba8ffd7a6` |
| result | `docs/verification/f2-governor-handoff/reference-results.json` | `ee03917ab397e1c50959f703747f4c64158277b5454927ec44916c8d4edb3b78` |
| trace | `docs/verification/f2-governor-handoff/representative-traces.json` | `aefa3d9764e8302b254e6c3de0c7ee5ea629463afb4698ad5aa8948caf0f7f71` |
| mapping | `docs/verification/f2-governor-handoff/u2-shared-field-map.json` | `5bc9f03f56c9d4a9edb0e19f9a0408a57126e856d0912f67a88262873ded2d3a` |
| limits | `docs/verification/f2-governor-handoff/known-limits.md` | `8a1c43c6a752788347d79848fd30ed08e1ba8b3b32784f303724440d98e6b5a4` |

### 13.7 Current GREEN, negative evidence, self-review и boundaries

```text
affected focused: 5 files / 88 tests PASS
all governor:      12 files / 217 tests PASS
handoff verifier:  F2 handoff PASS: 7580538... (14 artifacts)
typecheck:         PASS
full unit:         125 files / 1818 tests PASS; 182.07s
build:             PASS; 111 modules; known >500 kB chunk warning retained
exact project guard PASS on fourth unmodified run:
  typecheck PASS
  unit 125 files / 1818 tests PASS; 126.56s
  build PASS; 111 modules
  browser 185 PASS / 1 existing screenshot skip
  reference/bootstrap structure PASS
  offline intents 26 PASS
  bd-env/project wrapper 25 PASS
  Bootstrap structural/project checks PASS
```

Первые три exact project guard cycle-2 run не объявлены PASS: каждый дал `119 files / 1812 tests PASS` и те же шесть unrelated timing/performance failures (`model-v3/buffer-recovery`, `model-v3/experiments`, `fitting/matrix`, `fitting/mission-recovery`, `signatures/long-currentfit`, `ui/buffer-recovery`); все build/browser/offline/wrapper/bootstrap stages после unit failure — NOT RUN. Read-only process inspection во время первых runs обнаруживал внешние Vitest workers из `/Users/komleff/Documents/GitHub/u2-lab` около 100% CPU. Ни timeout, ни workers, ни dependencies/config не менялись. Полные outputs сохранены в `/tmp/f2-g2-cr-project-guard-final*.log`.

Четвёртый exact run без overrides полностью прошёл с `exit 0`: unit `1818/1818`, build, browser `185 PASS / 1 existing screenshot skip`, reference/bootstrap, offline intents `26/26`, bd-env/project wrapper `25/25`, final `Bootstrap structural/project checks: PASS`. Guard явно сообщил `Native hook activation: NOT RUN (requires actual native adapter smoke)`; этот NOT RUN не скрыт успешным завершением остальных stages.

Self-review cycle 2:

- exact four blockers закрыты общими gates/ownership, не instance-only catches;
- conservation tolerance/audit не менялись, state не клипуется;
- stopped sources не резервируют и не dispatch, protection state/reasons сохраняются;
- actual work равен actual shared-bank pickup, aggregate port cap и canonical proportional order соблюдены;
- stage 8 видит actual source host heat; receipt execution order строится реальными вызовами;
- compensated state versioned, required, finite, envelope-validated и JSON-persisted;
- input immutable, result ordering deterministic, no same-tick resource/port reuse;
- `/4`, Worker/UI/default activation, real TTX, station, Unity/server/network/device/deploy не затронуты.

Current NOT RUN/concerns:

- локальный Node `25.2.1`; Node 24 mandatory CI — PM-owned NOT RUN;
- affected QA и scoped re-review — PM-owned NOT RUN; review-fix counter остаётся `1/3` до обоих PASS;
- native adapter smoke — NOT RUN по явному сообщению project guard;
- T31, T35/T36 и весь OUT scope остаются NOT RUN/OUT;
- real ship TTX/balance — PRODUCT GAP, synthetic PASS не является runtime authorization;
- PR остаётся Draft; Beads, PR state/comments, Ready, merge и publish не менялись.

## 14. Scoped re-review cycle 2 — CR-G2-B2-R1 evidence refreeze

### 14.1 Role, commit shape и changed paths

- Actual role/model: основной `Developer` / Codex GPT-5; точный backend build identifier средой не раскрыт.
- Published history не переписывался. Новый kernel+regression commit после `2d6496c`:

```text
220a8879a2a0793f9b109d3447719ef6a7cdbcf4 fix(governor): commit signed environment before late capture
```

- Evidence-refreeze — следующий отдельный commit (`docs(governor): refreeze signed late-capture evidence`; этот commit, его SHA передаётся PM после создания).
- Kernel commit изменяет только `src/model/governor-v03/governor.ts` и `tests/governor-v03/governor-tick.test.ts`.
- Evidence commit изменяет только `docs/verification/f2-governor-handoff/{manifest,reference-results,representative-traces}.json`, `tests/governor-v03/handoff.test.ts` и этот report.
- `u2-shared-field-map.json`, fixtures/state schema и все закрытые CR-G2-B1/B3/B4 и QA-G2-B1…B4 owners byte-unchanged.

### 14.2 Exact RED и blocker mapping

Exact T24-derived boundary сохраняет исходные requests, source, cooler, heat capacity, пустой cold bank и zero electrical charge; единственная boundary mutation для обязательного counterexample — `externalCoolingW=5`. При `sourceHostJ=externalCoolingJ=1/6 J` кандидат `2d6496c` воспроизвёл ложный capture:

```text
npx vitest run tests/governor-v03/governor-tick.test.ts --reporter=verbose
Test Files  1 failed (1)
Tests       2 failed | 17 passed (19)

zero:     expected lateCaptureJ=0, received 0.16666666666666666
negative: expected lateCaptureJ=0, received 0.16666666666666666
```

Positive case при `externalCoolingW=0` в том же RED прошёл. Exact failure output сохранён в `/tmp/f2-g2-cr-b2-r1-red.log`; temp output не является PR artifact.

Root cause: code применял positive source/environment contributions, записывал `environment-outward`, выполнял stage 8 и только затем применял external/passive cooling. Receipt поэтому утверждал порядок, которого runtime не исполнял. Fix вычисляет один signed exchange из work host heat, source host heat, external/passive heating и external/passive cooling, коммитит authoritative compensated ship pair до receipt/stage 8 и передаёт stage 8 только `max(0, signedLateHeatJ)` с прежними remaining-port caps. Conservation entries остаются раздельными и signed; tolerance/audit не менялись.

Durable sweep покрывает:

| Case | Source host | Environment owner | Signed result | Stage 8 / ship |
|---|---:|---:|---:|---|
| positive source | `1/6 J` | `0 J` | `+1/6 J` | capture `1/6 J`, ship pair `0` |
| exact zero | `1/6 J` | `-1/6 J` external cooling | `0 J` | capture `0`, bank/ship pair `0` |
| negative | `1/6 J` | `-1/3 J` external cooling | `-1/6 J` | capture `0`, ship pair `-1/6 J` |
| passive heating | `1/6 J` | positive passive | positive, port-limited | capture `1/3 J`, remainder stays in ship |
| external heating + passive cooling | `1/6 J` plus external heating | larger passive cooling | negative | capture `0`, ship cools |

Frozen T20 itself теперь отдельно доказывает, что его combined `+100 W` external heating и больший passive cooling являются net-cooling exchange без ложного stage-8 capture. T20/T21 positive-debt/full-bank intent сохранён отдельным positive-net variant без изменения frozen fixture или G0/G1 owner.

### 14.3 Architecture/state map, T-ID и continuation

```text
actual work packages
  -> generator chemical/electrical/host/exhaust ownership
  -> signed environment exchange
       positive: work/source host + external heating + passive heating
       negative: external cooling + passive cooling
  -> compensated shipEnergyJ + shipEnergyRemainderJ commit
  -> environment-outward execution receipt
  -> stage 8 capture of eligible positive net only, remaining ports only
  -> stage 9 conservation / protection / RNG / persisted checkpoint
```

- CR-G2-B2-R1: fixed as the signed class, not equality-only; positive/zero/negative semantics and actual execution order frozen in JSON and semantic handoff assertions.
- T20/T21/T24: PASS in current focused/governor suite; T24 exact zero and negative cases have `energyResidualJ=0`.
- T01–T19, T22–T30, T32–T34, T37–T39: preserved PASS; closed CR-G2-B1/B3/B4 and QA-G2-B1…B4 regressions remain green.
- T31: NOT_RUN (G4); T35/T36: OUT/NOT_RUN.
- Continuation checks остаются byte-unchanged: event tick + following tick deep-equal через JSON reopen для failure, hot restart, Quiet hysteresis, cold stop/cold restart и repeated sub-ULP ticks.
- T33 30/120 convergence inputs/results byte-unchanged; exact four-row matrix остаётся в §13.5 и прошла current full suite.
- Same-tick work reuse не добавлен: signed exchange входит в stage 8 только после actual work, а capture использует только remaining input/shared bank ports.

### 14.4 Handoff inventory

Kernel binding: `220a8879a2a0793f9b109d3447719ef6a7cdbcf4`; `runtimeAuthorization:false`; 14 artifacts.

| Category | Path | SHA-256 |
|---|---|---|
| source | `src/model/governor-v03/governor.ts` | `e7e1b40b6ff21c4b553c9b2d88cb1fd68322710b30f765673a1751d9a507ec22` |
| source | `src/model/governor-v03/integrator.ts` | `093766073bf85e25dabc0bd6968bbd52cf1aca9f240fdf9f97e4107bed26e497` |
| source | `src/model/governor-v03/modes.ts` | `01edcd3ce43f7304d8d28d25e769f977b923b43b6abb621e0c157e858adb2101` |
| source | `src/model/governor-v03/protection.ts` | `542a8193ae227e10539b32c73855a0f710ff3d3e244d12615e212d27fd845253` |
| source | `src/model/governor-v03/trace.ts` | `4c68d78713b9a88c7814098503df217576585936e47fb6ab065a196d357b50c7` |
| schema | `src/model/governor-v03/schema.ts` | `89f0c8f6cd54441a87772cc310be6cf3000be3c20c7b71f07b9101c01bb725b2` |
| schema | `src/model/governor-v03/tolerances.ts` | `0eb460472e9182dd1fbe032e4e3812abdea33179013029f5344cc0e735150762` |
| schema | `src/model/governor-v03/types.ts` | `2951a64427f28d5dd35fab5de129fa033983d212459092fd6200880e630f0c5a` |
| fixture | `tests/fixtures/f2-governor/manifest.json` | `30d7648a09b9ad8fe1b606c171a878ccbc0c9bc8b21f648671bb8d8ac1853556` |
| fixture | `tests/fixtures/f2-governor/vectors.json` | `c89df5cfd1c68c7e5ecd440826257e159fe8a547c3aaeee22e0aa5cba8ffd7a6` |
| result | `docs/verification/f2-governor-handoff/reference-results.json` | `6ec463fcfe6aa16f23c9f3ed5e258d681b7d97b527e0ccea968a4ddeb2dafaf8` |
| trace | `docs/verification/f2-governor-handoff/representative-traces.json` | `ad05bbf2866e3e628735f80a06c6b09d593442d0a458f179bf0723e614642442` |
| mapping | `docs/verification/f2-governor-handoff/u2-shared-field-map.json` | `5bc9f03f56c9d4a9edb0e19f9a0408a57126e856d0912f67a88262873ded2d3a` |
| limits | `docs/verification/f2-governor-handoff/known-limits.md` | `8a1c43c6a752788347d79848fd30ed08e1ba8b3b32784f303724440d98e6b5a4` |

### 14.5 GREEN, guards, self-review и boundaries

```text
focused governor-tick: 1 file / 22 tests PASS
focused + handoff:     2 files / 26 tests PASS
all governor:          12 files / 222 tests PASS
handoff verifier:      F2 handoff PASS: 220a887... (14 artifacts)
typecheck:              PASS
full unit:             125 files / 1823 tests PASS; 126.15s
build:                 PASS; 111 modules; known >500 kB chunk warning retained
exact project guard:   PASS on first unmodified/no-override run
  typecheck PASS
  unit 125 files / 1823 tests PASS; 131.39s
  build PASS; 111 modules
  browser 185 PASS / 1 existing screenshot skip
  reference/bootstrap structure PASS
  offline intents 26 PASS
  bd-env/project wrapper 25 PASS
  Bootstrap structural/project checks PASS
git diff --check: PASS
```

Ожидаемый pre-refreeze negative boundary не скрыт: governor suite до hash update дал `220 PASS / 1 FAIL`, где единственный FAIL был standalone handoff verifier `hash drift: src/model/governor-v03/governor.ts`; после semantic evidence/hash freeze он прошёл. Timing/performance negative runs в этом cycle отсутствуют; exact guard прошёл с первого запуска.

Self-review:

- environment receipt теперь записывается только после commit обоих знаков;
- zero не создаёт фиктивный bank stock и не уменьшает ship pair; negative не захватывается; positive подчиняется remaining ports;
- ledger owners, compensated persisted state и stage-9 audit описывают одно и то же committed изменение; conservation tolerance не ослаблена;
- closed B1/B3/B4, shared resource/port order, continuation, source dispatch protection и no-same-tick-reuse regressions сохранены;
- input immutable, ordering deterministic; fixture TTX, schema, G0/G1 owners и accepted algorithms не менялись.

Current concerns / NOT RUN:

- локальный Node `25.2.1`; Node 24 mandatory CI — PM-owned NOT RUN;
- affected QA и scoped re-review текущего candidate — PM-owned NOT RUN; counter остаётся `1/3` до обоих PASS;
- guard явно сообщил `Native hook activation: NOT RUN (requires actual native adapter smoke)`;
- `/4`, Worker/UI/default activation, T31, T35/T36, real ship TTX/balance, station, Unity/server/network/device/deploy — NOT RUN/OUT; `runtimeAuthorization:false`;
- PR остаётся Draft; Beads, PR state/comments, Ready, merge и publish не изменялись.
