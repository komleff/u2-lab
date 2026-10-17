---
title: "Ship Fitting v4 — сценарная приёмка и scoped Review Contract"
status: accepted WHAT / plan review pending
version: "0.1"
date: 2026-10-06
related:
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/plans/2026-10-06-gd-workspace-v4.md
  - docs/verification/2026-10-06-gd-workflow-cases.md
---

# Authority и цель

Оператор одобрил выполнение v4 и номер версии в футере. WF01–15 из product owner
определяют WHAT; аудит v3 сообщает проблемы, но не расширяет принятую область.
Цель — удобный GD workflow, не pixel-perfect перенос или новый численный канон.
PRODUCT, один Developer, одна QA session, один scoped Code Review. Draft PR6 открыт.

# Целые сценарии QA

| Цепочка | AC | Метод / ожидаемое поведение |
|---|---|---|
| V4-01 Открыть и собрать | WF01–03/15 | Реальные пресеты Pony1/2/3, трюм, каталог preview/apply/cancel; независимый clone/variant. Видимый корпус/состав/ёмкость соответствуют fit. Применение целого пресета подписано. Footer «интерфейс v4.0» видим и не перекрывает действия. |
| V4-02 Работающий опыт и следующий черновик | WF04–06/12 | Start H180×1 с advancing Worker time → оснастка → подготовить следующий fit/conditions → графики → сравнение → Pause/Step/Resume/Cancel. Immutable active identity/spec/export прежние, next draft явно подписан; второй Start объясняет владельца. Навигация якорями не скрывает секции. Дополнительный короткий MAX-прогон проверяет ту же reachability/termination. |
| V4-03 Причина ограничения | WF07–09 | Настоящий завершённый trace: обзорные request/delivery, T/пороги, запасы/добыча → подробные каналы → hide/show первого канала и смена группы/единиц → выбор времени/события. Цвет/стиль закреплён за channel ID; legend/graph/table согласованы. Обзор не требует отключить десятки линий. Selected interval, summary и mean/min/max/count различены. |
| V4-04 Эталон и сравнение | WF10–12 | Genuine pause → Freeze неизменяемого частичного A → другой корпус B с2лазерами → complete B → изменить next fit → Compare/sort. Эталон A сохраняется; строки показывают измеренные корпус, состав, ревизию, интервал и конкретные отличия. Sorting не меняет baseline; stale result доступен со своей ревизией. |
| V4-05 Управляемая гипотеза | WF01/03/06/13 | Изменить поддерживаемое initial T, фазовые длительности/repeat и хотя бы одно existing local numerical поле помимо powerW. Validation/experimental provenance явны; экспорт/повторный запуск использует эти значения. Invalid input не меняет последний valid fit или текущий active snapshot. Не переносить v1 физику в v2. |
| V4-06 Файл исследования | WF01/06/13 | Native fit/run/result/CSV export → fresh QA-owned page → открыть fit, run, result по очереди. Fit восстанавливает сборку, run — правильный snapshot для повторения, result — уже измеренные trace/metrics для анализа без Worker rerun. Корпус/условия/ревизия своего объекта видимы. Export labels честны, reload/recovery limits раскрыты; workspace autosave не обещается. |
| V4-07 Ошибка и touch | WF13–15 | Malformed JSON, nonfinite/invalid result, несовместимая модель или канал/интервал: атомарный отказ без потери прежнего fit/result/reference. Целую representative цепочку open/edit/run/analyze/compare/export/reopen пройти1440,820,plain LAN390(hasTouch). Нет page exception/overflow/перекрытия controls, номер версии читается. Physical tablet отмечается отдельно, не подменяется эмуляцией. |

Result schema validation проверяет все потребляемые UI поля: допустимые конечные
числа, согласованные размеры channel/bucket arrays, временные интервалы/агрегацию,
supported model/catalog, ownership spec/revision/fit. При неподдерживаемом файле
отказ честный; импорт одного spec не считается открытием измеренных результатов.
Guard project tests подтверждают техническую регрессию, не заменяют эти цепочки.

# Invariants и Review Focus

1. Immutable active.spec/owner/runId не меняются от edits/import/nav; late message
   не перехватывает новый или чужой result. Один Worker, второй Start не разрешается.
2. Draft, active, measured и frozen reference различены во всех затронутых view,
   заголовках, графиках, Compare, details и exports; первый chunk новой попытки не
   маркирует старые числа как новые. Нельзя фиктивно менять измеренную ревизию.
3. Imported result до показа валидирован, html-like labels остаются literal,
   malformed/unsupported отказ атомарен. Legacy format/model сохраняются отдельно.
4. Retention/aggregation/long-trace behavior не ухудшаются; overview не применяет
   spread по длинному массиву, событие/selected interval не выдаёт mean за instant.
5. Navigation/scroll/focus на RUNNING, PAUSED и MAX, stable channel colors,
   fixed comparison baseline, touch reachability/footer — адресные UX regressions.

# Scoped Code Review

Goal: WF01–15 и устранение подтверждённых GD-UX потерь в принятой области v4.
IN: изменённые UI/CSS/state/result-validation/helpers и их durable tests, source
ownership, data identity, error atomicity, long array bounds, поддерживаемые controls,
общая страница, chart/Compare semantics и footer. Reviewer получает explicit actual
changed paths и content fingerprint после Developer, плюс QA exact report.
OUT: переаудит unchanged numerical kernel, новые mission/flight/refuel, новая цена/ROI,
новый каталог/канон, event attribution protocol, новая persistence/history/overlay,
pipeline governance, public/main/base/native approval и каждый старый UX пиксель.

Один scoped review. После реального blocker fix — affected cases и scoped re-review,
без нового полного audit sweep. Старые signed reports не переписываются; content
equivalence наследуется только для фактически unchanged owners.
