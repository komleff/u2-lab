---
title: "Станция: независимое Plan Review заправки и зарядки"
status: sealed
version: "1.0"
date: 2026-10-06
related:
  - docs/plans/2026-10-06-station-service.md
  - docs/reviews/2026-10-06-mission-medium-qa-affected-r2.md
---

# Station service — Plan Review

**Verdict: PLAN_READY. BLOCKER=0, ADVISORY=1.** План проверен по всему ST01–ST06; implementation ещё не начиналась. Это отдельное дополнение ulab-558, а не повторное ревью mission/M.

- Mode: PLAN_REVIEW; роль: независимый Reviewer, session `/root/fitting_adversarial_review`.
- Model: Codex, семейство GPT-6 согласно среде; точный serving/deployment model ID средой не сообщён.
- Commit: `3ced4ba1fd69df6f7c03d298d340ee69593113dd`. Runtime baseline: `d57ad5bc75c77954e7eefe63fbe5630ca4529c62`. Все десять рассмотренных owner blobs совпадают между baseline и текущим commit.
- Product authority: прямое поручение оператора о галочке «Заправлять и заряжать» и полной зарядке на станции. Полный WHAT/HOW/Review Contract — `docs/plans/2026-10-06-station-service.md`, 7955 bytes, SHA256 `05f63be7874e759af7b95f01c35de28692aad4922350562b509dd49e136b20aa`; опубликован до DEV: https://github.com/komleff/u2-lab/pull/9#issuecomment-6016253306.
- Content-Fingerprint: `54e67e5a8d764126bffd02969eeb617a2f4356fb8d3f24b943934a23494a4fdb`; полный текст документа, включая ST01–ST06, участвует в вычислении. Recipe и точные blobs/bytes/SHA каждого owner находятся в sidecar `2026-10-06-station-service-plan-review-binding.json` (SHA256 `4a3c4bc762a9c568335cc11aa6891db65154a3fe635ceacb314e544d04d4223c`).

## Вывод по достижимости

| AC | Проверенная граница и достаточный путь реализации |
|---|---|
| ST01 | Свежий builder явно записывает ON. Checkbox/readback меняют next conditions; сохранённый replaySpec, RUNNING spec и frozen A остаются собственниками своих снимков. Текущий workspace уже разделяет эти состояния; новый framework не нужен. |
| ST02–ST04 | Единственный владелец пополнения — `finishService`, после обычной физики обслуживания и реального прибытия. ON заполняет каждый существующий fuel species и суммарную Q; OFF лишь разгружает. Received равен фактической положительной разнице до/после endpoint, а не ёмкости. Вдали от станции, на частичном service и в passive recovery пополнения нет. Однократный выход из service сохраняет bounded zero-phase repeat. |
| ST05 | Три состояния имеют ясный смысл: true — fuel+charge; false — unload only; отсутствие — исторический fuel-only. Старый RunSpec не получает ON при импорте, повторном запуске или экспорте. Отсутствующий received charge читается как legacy zero без дописывания поля в старый результат. Boolean/finite nonnegative validation адресует новые поля, numeric kernel остаётся прежним. |
| ST06 | Накопленный station received J отделён от kernel source/consumed и топлива/полезной работы. `syncMetrics` должен сохранять его при обновлении mission summary, UI выводит GJ отдельно. Сравнение whole mission conditions отражает отличие политики, включая legacy absence; JSON и frozen A сохраняют измеренную политику. |

Current service уже разгружает и доливает топливо в одной точке (`src/runner/mission.ts:163–185`), а не на arrival. Поэтому минимальный diff — policy guard плюс Q/received delta в этом endpoint, типы/валидация/summary и существующие controls. План прямо требует обновить charge-related last telemetry перед следующим outbound: Q/SOC/retained battery stocks не остаются до-сервисными. Температура, буфер, mass/consumption ledger и модельный tag не переопределяются. Накопленная received энергия за несколько рейсов закономерно может превышать ёмкость батареи.

Последовательность RED → targeted unit/browser → normalguard → короткая QA ST01–06 → scoped Code Review достаточна. Различие OFF и обычной service physics проверяемо: Q может физически измениться от корабельного источника, но станционный received остаётся нулём. Endpoint oracle должен измерять delta после этой физики. Rollback на неизменный d57 snapshot4189 и сохранение старых exports объявлены; отдельные charging curve, shorepower, converter, model tag и storage не нужны.

## Advisory

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| ST-P-A1 | MINOR | [ADVISORY] No-battery control не является новым разрешённым mission fit | docs/plans/2026-10-06-station-service.md:60; src/model/v2/step.ts:102 | reject with rationale | В текущем валидном resolvedShip суммарная enabled battery capacity обязана быть >0. Нулевое пополнение без батареи проверяется синтетическим endpoint/capacity control либо отказом невалидного fit. Это технический выбор теста; расширять валидные входы ради ST03 не требуется. |

Обязательных изменений плана нет; advisory не расширяет работу и не требует нового verifier.

## Reviewed-Paths

- `docs/plans/2026-10-06-station-service.md`
- `src/scenarios/mission.ts`
- `src/model/v2/types.ts`
- `src/model/v2/step.ts`
- `src/runner/mission.ts`
- `src/runner/mining-metrics.ts`
- `src/io/fitting-result.ts`
- `src/app/fitting-ui/conditions.ts`
- `src/app/fitting-ui/lab-view.ts`
- `src/app/fitting-ui/result-context.ts`
- `src/app/fitting-workspace.ts`

Owner context рассмотрен только в объявленных местах обслуживания, типов/валидации, метрик, readback, сравнения, импорта и immutable active/next/A; весь численный kernel и старый UI повторно не ревьюились. Exact reviewed sections и blobs — в sidecar. Whole plan просмотрен полностью, включая rollback и все шесть AC.

## NOT RUN / за пределами

Runtime implementation, собственные runner/browser прогоны, QA, normalguard/build/packaging, H3600/12h/matrix, physical/native/public и operator merge здесь **NOT RUN**. Предыдущее mission APPROVED относится к d57 и не удостоверяет ещё не написанный station service. Каталог/ТТХ, полётный контроллер, экономика и interface redesign не входят в данный Plan Review.

Подпись: Independent Reviewer `/root/fitting_adversarial_review`, 2026-10-06. **SEALED; plan freeze RELEASED после readback; IDLE.** PM — единственный publisher.
