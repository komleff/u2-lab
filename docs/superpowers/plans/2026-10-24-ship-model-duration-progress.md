# `/4` Mission Default and Progress Implementation Plan

> Один основной Developer. Реализация начинается только после независимого `PLAN_READY` этой редакции.

**Beads:** `ulab-9aa.24` · **PR:** #44 · **Ветка:** `fix/ship-model-duration-progress`.

**Goal:** Вернуть для `sputnik-d` полноценный повторяемый шахтёрский рейс как fresh-default `/4`, сохранить однофазный стенд отдельным режимом и сделать 3600-секундные прогоны быстрыми и наблюдаемыми.

**Product authority:** прямые решения оператора 2026-10-24: default duration 3600; за час видны повторные рейсы добычи/возврата, руда и редактируемое расстояние; после завершения рейса при оставшемся времени немедленно начинается следующий; stationary режим сохраняется отдельно. Исторические четыре рейса не имеют полного сохранённого input и не задаются константой.

**Architecture:** новый versioned mission wrapper выполняет route/cargo/service state machine над существующим `/4` kernel. Mission разбивает один logical 1-second tick на детерминированные event-limited intervals; старый stationary `stepV3` и его persistence не меняются. Один Worker protocol обслуживает оба режима; bounded chunks дают progress.

**Spec:** `docs/superpowers/specs/2026-10-24-ship-model-duration-progress-design.md`

## Ограничения

- Никакого V3→V2 cast, скрытого запуска старого solver или фиктивных SCU.
- Не менять catalog/TTX, thermal/governor laws или старые сохранённые документы.
- Тепло, питание, fuel, durability, buffer, RNG и signatures считаются `/4` kernel и непрерывны между рейсами.
- Один Developer; один Plan Review, затем affected QA и один scoped Code Review. Не наращивать процесс вместо работающего сценария.

## Task 1 — RED: versioned mission contract and compatibility

**Files:**
- Modify: `src/model/v3/types.ts`
- Modify: `src/model/v3/schema.ts`
- Modify: `src/io/fitting-json.ts`
- Modify: `src/io/fitting-result.ts`
- Modify: `src/io/ship-model-result.ts`
- Test: `tests/model-v3/mission-schema.test.ts`
- Test: `tests/model-v3/persistence.test.ts`

1. Зафиксировать новый model tag `ship-fitting-ship-model-mission-0.1`, отдельный mission state version и strict fields для route/process/stage/cargo/flight clocks. `fitting-result` только маршрутизирует tag, а mission-specific result/checkpoint invariants принадлежат `ship-model-result`.
2. RED проверяет malformed/partial mission state, несовпадающий model/state tag, отрицательные cargo/position/time, неизвестные поля и forged installed roster.
3. Старые stationary `/4`, governor documents и saved results должны оставаться literal byte-semantic inputs без добавления mission fields.

## Task 2 — RED: event-limited `/4` interval and mission outputs

**Files:**
- Modify: `src/model/v3/step.ts`
- Modify: `src/runner/ship-model-telemetry.ts`
- Test: `tests/model-v3/mission-kernel.test.ts`
- Test: `tests/model-v3/power-thermal-ledger.test.ts`

1. Сохранить существующий stationary `stepV3(...)` byte-behavior. Добавить чистый `stepV3Interval(..., dtSeconds)` с `0 < dtSeconds ≤ 1`; вызов stationary без interval остаётся ровно прежним секундным путём.
2. Добавить measured actual force and impulse per engine/role, derived only from the same accepted power/fuel/thermal availability that produced committed interval.
3. Добавить optional mission process coupling: actual laser useful output creates ore work and moves `returnFraction` of beam energy back to hull heat в том же committed interval. Outward work and returned heat must not double-count energy.
4. RED/GREEN доказывает линейное интегрирование fuel/charge/heat/wear/impulse на `dt=1/0.5/0.1`, diesel/electric thrust scaling, zero force without stock/power, отсутствие mutation у preview, byte-identical stationary result и bounded energy residual с process return heat.

## Task 3 — RED: deterministic repeated mission runner

**Files:**
- Create: `src/runner/ship-model-mission.ts`
- Modify: `src/runner/ship-model-run.ts`
- Modify: `src/runner/ship-model-dispatch.ts`
- Modify: `src/runner/protocol.ts` only if the existing dispatch type guard requires the new tag
- Reuse: `src/model/v2/flight.ts` pure kinematics only
- Test: `tests/model-v3/mission-runner.test.ts`
- Test: `tests/model-v3/mission-persistence.test.ts`

1. Реализовать state machine outbound → approach → mining → inbound → service → outbound. Один runner step — logical tick до 1 с; внутри него controller коммитит последовательность event-limited intervals и расходует остаток секунды после перехода стадии.
2. Flight uses actual force/impulse and current dry+fuel+cargo mass. Arrival/service requires station/field position and zero velocity; loss of temporary thrust is not teleport/terminal by itself.
3. Для crossing arrival/zero-velocity/cargo-fill каждый trial начинается от immutable pre-interval state. Детерминированная bisection до `1e-6 с` выбирает boundary; отброшенные trials не меняют RNG, ledgers, signatures или trace. Timed approach/service/horizon ограничивают `dt` напрямую. Guard останавливает только zero-time no-progress loop.
4. Mining converts committed actual useful joules to SCU, caps the final fill without free work, adds cargo mass and returns when the compatible hold or remaining target is filled.
5. Service unloads only at station. Поле `stationReplenish` обязательно у fresh mission: `true` пополняет установленные fuel-контуры и батарею, `false` только разгружает; отсутствие поля принимается только для legacy fuel-only. Endpoint исполняется один раз после service physics, накапливает `receivedFuelKg`/`receivedChargeJ`, учитывает charge как внешний station input и не сбрасывает temperature/buffer/durability/RNG.
6. Один retained frame создаётся на границе logical tick; interval values интегрируются по `dt`, events сохраняют fractional timestamps. Checkpoint/pause возможен только между logical ticks. При `repeat=true` новый outbound начинается в тот же timestamp и использует остаток tick; horizon внутри service не вызывает endpoint.
7. Mission-specific result/checkpoint validator разрешает fractional event/stage clocks и явный ранний terminal при `repeat=false`/достигнутой цели, не ослабляя stationary reader и его tick/second invariants.
8. Uninterrupted и pause/export/import/checkpoint runs должны быть идентичны в mission state, physical state, received resources, retained trace, events and metrics, включая restore непосредственно перед service endpoint.

## Task 4 — Fresh builders and two explicit work modes

**Files:**
- Create or modify: `src/scenarios/ship-model-mission.ts`
- Modify: `src/scenarios/fitting.ts`
- Modify: `src/app/ship-model.ts`
- Modify: `src/app/ship-model-workspace.ts`
- Test: `tests/ui/ship-model-defaults.test.ts`
- Test: `tests/ui/ship-model-mission-workspace.test.ts`

1. Define `DEFAULT_SHIP_MODEL_DURATION_SECONDS = 3600` and `SHIP_MODEL_RUN_CHUNK_STEPS = 2000` once.
2. Fresh workspace/default builder creates Sputnik-D mission with the accepted frozen defaults: H3600, D100km, mission-owned experimental `referenceVfaMS=250`, speed policy `2×V_FA` and `cruiseSpeedMS=500`, full-hold, target10000, approach10, service10, repeat ON, stationReplenish ON and the current explicit LAB-ORE-01 process. Источник V_FA: принятая таблица `docs/product/ship-fitting-catalog-0.2.4.md` (Civil S/M250/225; Industrial S/M225/200; Pony225). Число и provenance принадлежат mission conditions/spec, поскольку numeric V_FA отсутствует в HullV3. Каталог/hull schema не меняются, отсутствие опоры не заменяется fallback; до запуска необходим явный ввод.
3. Preserve the current stationary builder/model as an explicit new-draft choice. Explicit/imported duration and all imported mission/stationary fields remain literal.
4. Mode change creates a new draft only when idle and never converts a stored run/result silently.

## Task 5 — UI: route, ore, cycles, graphs and progress

**Files:**
- Modify: `src/app/ship-model.ts`
- Modify: `src/app/fitting-ui/ship-model-conditions.ts`
- Modify: `src/app/fitting-ui/ship-model-lab-view.ts`
- Modify: `src/app/fitting-ui/ship-model-results.ts`
- Modify: `src/app/fitting-ui/ship-model-channels.ts`
- Modify: `src/app/fitting.css`
- Test: `tests/ui/ship-model-mission-ui.test.ts`
- Test: `tests/browser/ship-model-mission-progress.spec.ts`

1. Add visible work selector: `Шахтёрский рейс` default / `Стационарная нагрузка`.
2. Mission form exposes distance, laboratory V_FA, speed policy, approach, service, target, stop policy, repeat and `Заправлять и заряжать`. Stationary keeps the existing action/phase editor and does not display fake cargo/flight results.
3. Mission overview/live/results show stage, position, velocity, mined, delivered, onboard, SCU/h, completed trips, received fuel and station energy. Add real trace channels for position/velocity/cargo/delivered/cycle count.
4. Progressbar/text uses the same accepted snapshot as graphs. Browser evidence samples at least two increasing accepted progress states and two changed graph endpoints before completion.
5. Ordinary mission/stationary and governor Start/checkpoint use batch 2000 plus existing 80 ms wall budget; Step remains exactly one model step/tick.

## Task 6 — Exact operator browser gate and regressions

**Files:**
- Test: `tests/browser/ship-model-mission-progress.spec.ts`
- Modify as needed without weakening semantics: `tests/browser/ship-model-governor-v03.spec.ts`, `tests/browser/ship-model-ownership.spec.ts`, `tests/browser/ship-model-acceptance.spec.ts`
- Preserve: existing root mission suites

Primary 1440 browser chain:

1. Open fresh `/?shipModel=experimental`, explicitly select `sputnik-d`.
2. Assert mission mode, duration 3600, distance 100 km, explicit mission V_FA250m/s and cruise500m/s (`2×V_FA`), editable distance, repeat ON and station replenishment ON; export contains the new mission model tag and literal route/process/reference/station policy.
3. Start the real Worker. Before completion, observe positive increasing progress, available Pause and changing flight/mining graph data; Pause → paused without error, then resume.
4. Complete within 20 seconds on CI. Assert `3600 / 3600 с · 100%`, empty error, at least two completed services/returns, positive delivered ore, a subsequent trip started without idle tail, visible mined/delivered/onboard values and balance `mined = delivered + onboard`. Record actual service timestamps and freeze this complete input/result as the new `/4` regression fixture; no expected count is hardcoded before the first physical result.
5. Change distance and prove a different arrival/service schedule and cycle count or current stage. This is a behavior check, not only form/export equality.
6. Run station ON and OFF controls plus horizon-inside-service. Prove endpoint-only receipts, no double refill after checkpoint restore, no temperature/buffer reset and separate external station-energy accounting.
7. Select stationary, run a bounded continuous-work case and prove no mission/cargo fields are fabricated and its prior serialized result remains byte-equivalent.

Regression gate: old root mission and stored results; stationary `/4` old imports; governor import/start/checkpoint; ownership, A/B, graphs, CSV/JSON, 1440/820/390 accessibility.

## Task 7 — Version and final verification

**Files:**
- Modify: `README.md`
- Modify: `src/app/fitting.ts`
- Modify: `package.json`
- Modify mechanically: `package-lock.json`
- Modify: version assertions in browser tests

1. Bump visible GD LAB to v2.5 and package patch version consistently.
2. Run focused RED/GREEN after every task, then `npm run typecheck`, `npm run build`, affected Playwright suites and `.agents/project/verify.sh`.
3. Record exact frozen-default Sputnik-D H3600 wall time, actual service event count/timestamps, mined/delivered/onboard balance, station receipts and final energy residual.
4. Only after fresh guard, independent QA and scoped Code Review may PR #44 leave Draft. Merge remains operator-only.
