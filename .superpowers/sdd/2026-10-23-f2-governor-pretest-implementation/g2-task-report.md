# F2-G2 Developer task report

Дата: 2026-10-23

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

Current evidence-refreeze commit: этот следующий commit; его SHA назначается Git поверх содержимого отчёта и фиксируется в `git log`/Developer handoff. Published commits не переписывались.

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

G0/G1 owners не изменялись. `/4`, Worker, UI, default activation, real ship TTX, station, Unity/server/network/device/deploy не реализовывались.

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

- `shipEnergyJ`, `bufferEnergyJByBank`, `waterEnthalpyJByTank`, `electricalChargeJ`, `resourceMassKg`; температура только производная;
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
- Affected independent QA, scoped Code Review и mandatory Node 24 CI: PM-owned NOT RUN после push; review-fix counter остаётся `0/3` до PASS affected QA.
- `/4`, Worker/UI/persistence integration и default activation: NOT RUN, F2-G3.
- T31 service/rebind: NOT RUN, F2-G4.
- T35/T36: scope OUT / NOT RUN.
- Real ship profiles/TTX и balance acceptance: PRODUCT GAP; synthetic fixtures не канон.
- Unity/server/network/device/deploy, station/payment/session/cloud, detection: NOT RUN / OUT.
- PR остаётся Draft; Ready state, merge, publish и Beads не изменялись.
