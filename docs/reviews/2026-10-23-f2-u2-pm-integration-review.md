---
title: "F2 governor: оценка принимающего PM U2"
status: advisory accepted / implementation plan PLAN_READY / runtime not reviewed
version: "1.1"
date: 2026-10-23
tags: [review, pm, f2, u2, handoff, persistence, passports]
related:
  - docs/plans/2026-10-23-f2-governor-pretest-design.md
  - docs/plans/2026-10-23-f2-governor-pretest-implementation.md
---

# F2 governor: оценка принимающего PM U2

## 1. Привязка и граница вердикта

Отчёт передан оператором от PM U2, который планирует будущую реализацию F2 в игре.
Проверен сохранённый снимок design v0.2
`/tmp/u2-lab-f2-governor-plan-reviewed.md`, SHA-256
`9b80e3134faca3d4ac3762d71ebd497ed5e7fa7b593708d280ba5ae878ac204a`.
Роль указана как `PM U2`; конкретная модель/инструмент в отчёте не названы.

Вердикт источника: **`PLAN_READY` для перехода к планированию реализации Лабы;
блокеров нет.** Это не `PLAN_READY` implementation plan, не разрешение начать DEV и
не подтверждение готовности переноса в U2. Runtime и тесты этим review не запускались.

Текущий design-файл новее снимка: его SHA-256 —
`351fc231a335a37217b911b2ae7bc406a2c4f0b366b6800ddde201a7973a3628`.
Изменения после снимка прошли отдельную affected adversarial re-review в Lab, но PM U2
не проверял exact current fingerprint. Поэтому его отчёт используется как integration
input, а не как обязательный independent Plan Review по Delivery First.

## 2. Принятые advisory

| ID | Advisory PM U2 | Решение PM U2 Lab | Обязательная проверка |
|---|---|---|---|
| `U2PM-A1` | Зафиксировать передаваемый пакет: SHA ядра, версия профиля, fixtures, expected results, units/tolerances и последовательности тактов с распределением/причинами ограничений | Принято. После G2 создаётся отдельный frozen early handoff, привязанный к parent kernel commit и hashes всех payload-файлов | `scripts/verify-f2-handoff.mjs`, `tests/governor-v03/handoff.test.ts`; manifest обязан иметь `runtimeAuthorization: false` |
| `U2PM-A2` | Полностью описать persisted governor state и проверить сохранение перед событием | Принято. State contract включает tick clock, mode/stage hysteresis, stop causes, restart/cooldown timers, accumulated work до failure check, RNG и service totals. Checkpoint разрешён только между целыми ticks | pure continuation после G2 и JSON/Worker reopen после G3 дают ту же последовательность следующих решений, ledger и RNG |
| `U2PM-A3` | Вести отдельные паспорта Спутника, Мира и Diesel Pony | Принято как параллельный P0 track после G0. Паспорт разделяет принятый F1 identity/fixed-preset и пока отсутствующий F2 thermal/power profile; пропуски остаются `BLOCKED`, без подстановки Lab-пресета как канона U2 | три отдельных passport/result records обязательны даже при `BLOCKED`; общий synthetic PASS не закрывает их |
| `U2PM-A4` | Отдать ядро и проверочные данные после G2, до UI-поставки | Принято. Early handoff содержит kernel, schemas, fixtures, traces, known limits и field map для оценки C#-порта | пакет не включает `/4` acceptance и не разрешает запуск U2 runtime |
| `U2PM-A5` | Уточнить исключение воды | Уже закрыто в current design F2D-02: OUT только водяные движители и локальный пар; `W`/T16 остаются IN | Plan Review проверяет, что формулировка не регрессировала |

## 3. Поддержанная граница обслуживания

U2 Lab владеет проверкой физического state transition: точные входные дельты топлива,
заряда и ремонта, сохранение энергии/массы, receipt и продолжение расчёта. Цена,
достаточность денег, станционные условия, повтор сетевой команды без двойного списания,
identity/session и привязка операции к экземпляру корабля принадлежат U2. Lab не создаёт
station UX и не заявляет проверку этих игровых владельцев.

## 4. Что остаётся обязательным до DEV

Этот gate закрыт отдельным
`docs/reviews/2026-10-23-f2-governor-implementation-plan-review.md`: после исправления
2 BLOCKER и 3 ADVISORY implementation plan получил `PLAN_READY` на exact affected
fingerprint. Advisory выше входят в Acceptance Criteria плана. После DEV отдельно требуются
QA, scoped Code Review, finalize и merge оператором.
