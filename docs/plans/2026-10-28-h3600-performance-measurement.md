# H3600: строгая fresh-производительность и завершение функциональных опытов

Beads: `ulab-f6d.1`, parent `ulab-f6d`. PRODUCT, план v0.3.
WHAT — [принятый дизайн, AC6/7](../superpowers/specs/2026-10-24-ship-model-duration-progress-design.md).
Свежий Sputnik-D H3600 в штатном CI обязан завершаться быстрее 20 секунд.
Этот предел, физические параметры, температурные границы и полный расчёт сохраняются.

## Подтверждённый блокер

Первый таймер включал Pause/export/Resume. Их отделение уже реализовано:
строгий cold-fresh beforeStart→observedComplete и отдельный полный lifecycle.
В CI c31c07c fresh19190мс и lifecycle20319мс прошли, но три функциональных
complete20 ожидания не дождались результата. В зависимом CI7043fc0 с тем же
runtime сам fresh20 не завершился; также упали три C031 graph-context и primary
IR/EM ожидания. Два long и1978unit прошли в обоих CI. FAIL сохранены в задаче;
удачный повтор не считается исправлением AC7.

Bounded Developer CPU-profile production H3600:6143мс/77chunks;
`createMissionV2Job` self1511мс,24.5% CPU — повторный полный `JSON.stringify(spec)`
на каждом фактическом tick. Полные spec/state/metrics/events/signatures совпали
с прежним uninterrupted эталоном,3рейса/90SCUдоставлено/30наборту.
Это фактический кандидат для устранения лишней работы, ещё не CI PASS.

## Минимальное исправление

Один основной Developer, та же ветка/PR56. До runtime-кода — независимый Review
этого уточнения HOW. Никакой новой подсистемы или ветки.

1. В `src/runner/ship-model-run.ts` вычислять прежний полный JSON fingerprint
   лениво один раз за синхронный вызов `runShipModelChunk`, только когда реально
   нужен новый mission/2 job. Не добавлять работу на done/maxSteps0/stationary.
2. В `src/runner/ship-model-flight-v2.ts` использовать этот уже вычисленный ключ
   при создании jobs данного chunk. Ключ, сравнение и очистка memo остаются
   прежними; самостоятельный `createMissionV2Job` продолжает проверять spec сам.
   Между chunks изменение того же объекта spec обязано обнаруживаться.
   Не менять forecast keys, клонирование состояния, арифметику, порядок операций,
   root-finding, шаг, точность, ресурсы, RNG, telemetry или retention.
3. В существующем `tests/model-v3/mission-v2-budget.test.ts` добавить адресные
   semantic regression checks: изменение spec между chunks и в standalone job
   не использует старый forecast; hot и cold результаты совпадают. Не проверять
   число вызовов stringify как замену корректности. Прежние tests сохранить.
4. `ship-model-mission-progress.spec.ts` сохраняет отдельные cold-fresh и lifecycle.
   Fresh — новый page/context/Worker, без prior run, импорта, checkpoint, прогрева
   и вычитания паузы; часы доStart→complete, строгий wall<20000/complete20.
   Lifecycle сохраняет Pause/checkpoint/Resume и все32 прежних assertions,
   complete20/global30. H3600, progress, graphs, ore/cargo и errors сохраняются.
5. В двух функциональных test files ожидание complete40000 и local timeout60000
   применяется только к наблюдаемому классу: C031 graph-context widths1440/820/390
   и primary completed-fresh IR/EM в `ship-model-catalog-0.3.1.spec.ts`, TB1–3
   widths1440/820/390 в `ship-model-thermal-frontiers.spec.ts`. Итого7 cases.
   Сохраняются все старые assertions/input,495K,200/220/500/550K и crossing500,
   геометрия/видимость/IR/EM. Эти ожидания не являются benchmark AC7.

OUT: все остальные runtime/tests/config/managed/data paths, global timeout,
workers/retries/skips, новые API продукта, экономические механики, изменение
физических правил и server restart. Согласованные ТТХ/правила U2 не меняются.

## Проверка и доказательства

| AC | Обязательное evidence |
|---|---|
| FC-01 | Cold fresh H3600 <20000мс в штатном CI, не локальная замена |
| FC-02 | Все прежние lifecycle assertions, Pause/export/Resume, complete20/global30 сохранены |
| FC-03 | Один production H3600 before/after: полный serialized result включая spec/state/metrics/events/signatures/retention побайтно совпадает; одинаковые inputs/runId; время отдельно |
| FC-04 | Semantic invalidation между chunks/standalone; прежние Pending/Step/checkpoint/eviction tests; никакого изменения физической арифметики или cache keys |
| FC-05 | Адресные9 browser cases (7functional+fresh+lifecycle), affectedQA и scopedReview изменённой surface; final normalguard/currentCI PASS |

Один cold before/after timing pair достаточно; profiler уже дал конкретный hotpath.
Не строить новую benchmark-матрицу. Developer сохраняет старые raw FAIL, partial
superseded guard и actual reports. QA выполняет только адресные tests/проверку
эквивалентности; Reviewer проверяет изменённые6 source/test paths и план,
не повторяет полную кампанию. Ранее проверенные участки используются по binding.

Реальный freshCI>20 или functional>40 — FAIL, без повышения порога, skip или
слепого retry. Полный guard после финального кода один; повтор только по факту
нового исправления. Между этапами не менять замороженный source.

Rollback — revert этой ограниченной оптимизации и test changes.
DocPR41 получает исправление явной base-зависимостью; все63frozenfiles/67ownedpaths
и doc-review fingerprint сохраняются. Его qualification NOT_RUN остаётся честным.
Финализация по current checks и content binding; merge выполняет оператор.
