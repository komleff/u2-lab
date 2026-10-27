---
title: "Ермак: физическое торможение и фактический счётчик рейсов"
version: "0.2"
status: "HOW для независимого Plan Review; НЕ PLAN_READY"
date: 2026-10-27
beads: [ulab-9do, ulab-b3y]
mode: PRODUCT
---

# План исправлений E4/E6 после сверки E1–E7

Принятый WHAT — прямое поручение оператора 27.10.2026 и
[PR #52, раздел «Передача агенту VS Code»](https://github.com/komleff/u2-lab/blob/575f02ddf58a227111ce9b7f6d55919d9c9fc34a/docs/research/2026-10-27-ermak-radiators/README.md).
Это готовый product source: нового продуктового проекта и выбора физических
правил не требуется. PM выбирает HOW; продуктовый код пишет один основной Developer.
Этот черновик не разрешает реализацию до независимого PLAN_READY.

## Граница поставки и регистрация

| Находка | Текущий результат сверки | Canonical Beads / поставка |
|---|---|---|
| E1: D engine 40%, ordinary 500/550 K | Уже реализовано в каталоге0.3.4 C2; старые0.3.3 сохранены буквально | ulab-16h / PR51 |
| E2: ordinary, built-in cargo, local variants | Новая редакция проверяется целиком; сохранённый старый input не мигрируется | ulab-16h / PR51 |
| E3: полезность Active | Exact old0.210K воспроизведён; whole-hour Δhost не равен generator loss. Новый C2 independently проверен по net heat/работе на1200/3600/10800s | ulab-1x6 / адресная QA4/5 в PR51 |
| E4: пролёт станции | Реально воспроизведён и вC2. Новый IN-scope по прямому поручению оператора | ulab-9do / эта поставка |
| E5: A/epsilon/K passive | Уже исправлено: S490×.9=441, M1960×.9=1764; Active TTX не переопределяются этим амендментом | ulab-16h / PR51 |
| E6: шкала вместо фактического счётчика | Actual UI воспроизведён: «1 рейсы» при completed0/delivered0/onboard36 | ulab-b3y / эта поставка |
| E7: powered service | В0.3.4 используется отдельный обесточенный пассивный helper; older replay прежний | ulab-16h / PR51 |

`tmp:ermak-radiator-thermal-20261027` зарегистрирован локальным разрешённым путём
как существующий `ulab-1x6`; create-intent `0633a826-4ced-4a00-9b85-e5783bd2cdf0`
связан штатным `external_ref=intent:0633a826-4ced-4a00-9b85-e5783bd2cdf0`.
Связи с `ulab-dwi` и `ulab-a3r` добавлены как related, не новые blockers.
Очередь source PR не редактируется; applier/sync/export не запускаются.
Статусы задач — только Beads, план содержит порядок и AC.

## Источник и изоляция

- Унаследованный numerical package: PR51 `cb67fcf096b5b2c046b7f65cc41500795803def0` (C2).
- GitHub base итогового PR53 — `main` после49:
  `3b6c4622435b7d6ea3353ef41899085e1731d7f9`; дерево равно прежней base51.
  История53 содержит весь C2 и новые исправления. PR51 остаётся frozen OPEN/Draft,
  его source/evidence не теряются и отдельно сливать промежуточный C2 не требуется.
- Отдельная рабочая ветка `fix/ermak-flight-counter`, worktree
  `/Users/komleff/Documents/GitHub/u2-lab-ermak-flight-counter`.
- Baseline Node24.22.0:26 addressed unit tests/4files PASS; это не новый whole guard.
- Ветка51/его данные/evidence остаются неизменными. Документальный PR52 — чужая
  сохранённая диагностика, его runtime source не подменяет C2.

## Обязательные ограничения

Обычные: critical200/550 K, work220–500 K, restart230/480 K. Diesel tanks:
critical150/570, work200–500, restart180/550. D engine host =40% собственных потерь
после engine/path efficiencies; генераторные доли и износ на двигатель не переносить.
Масса, C, тяга и фактические fuel/electric/thermal limits остаются физическими.
Никаких скрытой тяги, температурного сброса, телепортации к станции или глобальной
смены физического шага. Service300K/G10000, onboardOFF и реальное время сохраняются.
Экономика, новая ремонтная система и новый автопилот как отдельный продукт OUT.

Frozen0.3.0–0.3.3 и сохранённые C2 specs/results0.3.4 остаются literal. Исправление
численного flight-control требует явной границы версии/политики для fresh runs;
отсутствующее старое поле не означает молчаливое применение нового алгоритма.

## Подтверждённая причина E4 и рассмотренные варианты

У constant-force C2activeON в972.199299s coast достигает x3958.704660m. Новый preview
получает stop3958.704429m: gap0.000231m больше guard1e-4m, но until≈5.1e-7s меньше
clipping guard1e-6s. Оставшиеся0.800701s ошибочно проходят как coast — торможение
опаздывает примерно на360m при исправной тяге. В hot-none дополнительно падает
реальная тормозная сила2.052→1.360MN, а прогноз постоянной силы этого не учитывает.

1. Только согласовать один coast guard — недостаточно: spike оставляет32/27/794m.
2. Глобально уменьшить dt — меняет все численные опыты и не исправляет событие;
   отклонено как способ скрыть причину.
3. Согласовать event handoff и физический прогноз торможения при переменной тяге/
   массе, с явной совместимостью и измеренной стоимостью — выбранное направление HOW.

Полные diagnosis/spikes опубликованы отдельным Developer evidence к этой поставке.
Более позднее HOW v0.2 явно отзывает ошибочный вариант ограничения прогноза
`spec.durationSeconds`: горизонт наблюдения не может управлять кораблём.

## Выбранный HOW

### Версия и сохранение прошлого

Использовать существующий discriminator `mission.version`:
`ship-mission/1` — неизменное legacy исполнение, `ship-mission/2` — исправленный
контроллер. `modelVersion`, физический каталог0.3.4, state/checkpoint format1
не меняются: структура физического состояния остаётся прежней.
Fresh current0.3.4 без явно переданного mission получает2; older catalogs и
любой явно переданный/импортированный mission сохраняют свою version и route.
Unknown version отвергается, new2 → старый reader fail-closed. Copy/reopen/
resume старого C2 mission1 не становятся2 автоматически. Новые результаты
содержат discriminator явно; никакого выбора физических законов в UI нет.

### Физический прогноз и события

1. Работать с клоном полного State, включая RNG, stocks, governor и module gates.
   Настоящие brake requests идут в `stepV3Interval`; движение использует actual
   impulse и начальную/конечную полную массу через прежний `advanceFlight`.
   Forecast не коммитит actual физику и не выдаёт номинальную тягу за фактическую.
2. Сетка shadow steps якорится в `spec.initialState.timeSeconds` и step1:
   остаток до общего outer boundary, затем1s. Из fractional candidate нельзя
   начинать независимую сетку1s. Глобальный dt и формулы ядра сохраняются.
3. Domain прогноза — физические события `StoppedBeforeTarget`,
   `CrossedTargetBeforeRest`, `NoForceCurrent` или `NumericalUnresolved`.
   `spec.durationSeconds` и computational cap не являются физическими исходами.
   Future authority loss не подменяет текущее отсутствие силы; actual и
   speculative witnesses всегда связаны с точным input key.
4. Проверять projected rest после реального coast/accel trial длительностиh.
   Safe endpoint разрешает команду; unsafe уже наh0 требует actual braking.
   Safe/unsafe bracket уточнять классификационным bisection, без выдуманного
   отрицательного rest-distance. Новый cached full rollout не вкладывается в
   каждую итерацию каждого обычного tick; refiner работает только у события.
5. `Ready` требует настоящего stop witness с обоими существующими условиями:
   `abs(x-target) <= 1e-3m`, `abs(v) <= 1e-4m/s`. Ни малая ширина bracket, ни
   wall deadline не дают разрешения на service. Если representable interior
   закончился без witness, вернуть numerical error через существующий error
   path, сохранив last actual state; не подставлять координату или бесплатную силу.
6. Terminal velocity root решать safeguarded momentum trials на том же physical
   kernel. Если event root ближе допустимого положительного dt, передавать
   управление следующей команде на границе, а не выполнять прежний coast/accel
   на весь остаток. Approach/service только после actual arrival, не от forecast.

### Cooperative work без нового физического состояния

Новый pure job принадлежит RunContext, не State/RunSpec/checkpoint. Он содержит
immutable input key, shadow cursor, bracket/root continuation и проверенные
witnesses. Внешние исходы — `Pending`, `Ready(MissionInterval)`,
`NumericalUnresolved`; физический interval коммитится только у Ready и ровно раз.

Рабочие интерфейсы новой узкой реализации:

```ts
type MissionInterval = ReturnType<typeof stepV3Interval> & { events: LabEvent[] };
createMissionV2Job(spec: RunSpecV3, input: StateV3, memo?: FlightMemo): MissionV2Job;
advanceMissionV2Job(job: MissionV2Job, deadlineMs: number):
  { kind: 'pending' } |
  { kind: 'ready'; interval: MissionInterval } |
  { kind: 'numerical-error'; message: string };
```

Job может хранить незакоммиченные local segments outer tick, но они не попадают
в actual state, metrics, events, retention и счётчики до завершения interval.
Использовать существующий pump80ms: deadline проверяется между bounded physical
leaf/root operations. При Pending вернуть0 actual steps и управление event loop,
на следующем pump продолжить cursor. Clock выбирает только yield, не команду.
Step intent сохраняется через Pending до одного actual tick либо Pause/Cancel.
Pause/Cancel/новый input безопасно discard job; snapshot содержит прежнее actual
состояние. Restore/recompute создаёт cold job и даёт тот же результат.
Memo повторно используется только при exact state+spec match, не является latch
управления и не сериализуется. Изменение CPU slicing/очистка cache не меняют выход.

Никаких256 physical steps как operating limit. Подтверждённый weak-E counterexample
нуждается в1058.88s торможения и физически работоспособен. Прогноз допускается
дальше observation H1; при уже небезопасном x100km он заканчивается target-cross
на252s. Долгое вычисление остаётся cooperative Pending, не превращается в
source-readiness отказ, скрытый cruise cap или accel/brake oscillation.

### Минимальный E6

Сохранить series/buckets/масштаб. Только count panel явно подписывает верхнюю
отметку как «Шкала:0–1», а figcaption — фактический целый completedTrips из
того же наблюдаемого `result.state.mission`, с фактическими delivered/onboard.
Не использовать среднее выбранного bucket, редактируемый fit или чужой frozen
result. Без наблюдаемого результата — отсутствие данных, не придуманный0.
Числовую арифметику existing Results/Live summary не менять: она уже верна.

## Файлы и последовательность

1. Developer фиксирует RED и legacy digests до исправления. Fixtures находятся
   в репозитории, не зависят от `/tmp` в CI; источник575f02/C2/spec SHA записан.
2. `src/model/v3/types.ts`, `schema.ts`,
   `src/scenarios/ship-model-mission.ts`: version1/2 и fresh dispatch; targeted
   `tests/model-v3/mission-v2-persistence.test.ts`. Старый result/fit не мигрировать.
3. `src/runner/ship-model-flight-v2.ts`: narrow pure forecast/event job;
   `ship-model-mission.ts`: legacy1 и explicit2 dispatch;
   `ship-model-run.ts`, `protocol.ts`: transient job и Pending/Step semantics.
   `src/model/v2/flight.ts`, thermal/power kernel и catalog data не меняются.
   Новые `tests/model-v3/mission-v2-flight.test.ts` и
   `mission-v2-budget.test.ts` проверяют исходные FAIL, физический результат,
   horizon/slicing/cache invariance и отсутствие preview side effects.
4. `src/app/fitting-ui/ship-model-lab-view.ts`, `trace-chart.ts`: E6 caption и
   адресный scale-label option, прочие графики прежние. Unit/DOM проверки и
   `tests/browser/ship-model-mission-v2.spec.ts` с настоящим Worker,0→1 рейсом,
   old import, новым2, pause/resume, Step через Pending, frozen/export/reopen,
   desktop1440/mobile390. Existing shared chart consumers охраняются normal guard.
5. `docs/research/2026-10-27-ermak-flight-corrections/`: standalone producer,
   exact specs/seed/source hashes, results/CSV, event/energy/stock receipts и
   явное разграничение legacy/C2/new2. Исходные18 C2 receipts не переписываются.
   Большие raw results допустимы в ignored evidence; в Git остаётся полный
   воспроизводитель и проверяемые digests/условия/события/измерения.
6. После addressed GREEN — обычный `.agents/project/verify.sh` и current CI,
   независимые QA/Review по этому контракту, landing и finalize на final HEAD.
   При timing FAIL — diagnose; никаких global worker/timeouts cap или обхода guards.

## Review Focus и адресные AC

| AC | Проверка | Условие PASS |
|---|---|---|
| EF01 event handoff | Три exact C2 reproductions и stable gap0.000231m | Нет прежнего skipped-coast; actual stop/arrival удовлетворяет существующим x/v tolerances без широкого clamp |
| EF02 paid variable-force flight | Hot/cold D/H/E/mixed, fuel/cargo mass, weak/empty power | Реальный impulse и energy/fuel/heat ledger; zero resources не создают service или скрытую тягу |
| EF03 observer prefix | Same inputs H1/1200/3600/10800, coupled и weak1059s | First-tick и полный1200s common prefix state/metrics/events/channels/signatures/buckets одинаковы; spec/status/done сравниваются отдельно |
| EF04 computational purity | CPU slices1/7/64/unlimited, cold/hit/evicted cache, Pause/Cancel/Step/restore | Pending не коммитит физику/RNG/счётчики; one Step = один actual tick; cold resume numerical-exact; actual Worker остаётся управляемым во время long planning |
| EF05 compatibility | 0.3.0–0.3.3 и saved C2 mission1/0.3.4 | Old results/checkpoints/literal routes и18 receipts прежние; new2 явно сериализуется, unknown reject и new→old reader fail-closed без потери workspace |
| EF06 factual UI | OldH1200 completed0/delivered0/onboard36, затем service1, selected bucket/frozen | Шкала явно не результат; actual counter integer из нужного результата, no-data не0, desktop/mobile без поломки существующих цепочек |
| EF07 useful workload | Ermak none/passive3/Active2ON/OFF на1200/3600/10800 + fixed-heat и условия PR52 | Установившиеся циклы/работа/доставка/топливо/пики/первые ограничения/позиция измерены; net cooling source losses учтены, TTX и пределы неизменны, нет обещания любогоfit/вечной работы |
| EF08 numerical/performance | Fractional roots и0.5/0.25 reference, whole slow feasible leg, actual Worker latency | Нет маскировки через globaldt; ошибки/сходимость и стоимость предъявлены; нет budget-driven физического лимита или ложного service |

EF01 начинается из исходных полных воспроизводимых spec до ошибки управления.
Отдельный checkpoint, уже физически слишком близкий к станции для имеющейся
тяги, не получает невозможной гарантии остановки до неё: actual paid braking и
возможный recovery сохраняются, ложный service запрещён. Аналогично no-resource
control не обязан прибыть, но не может получить фиктивный impulse/приёмку груза.
Reference0.5/0.25 — verifier instrumentation, не изменение публичного stepSeconds1.

## Процесс и бюджет

Новая навигационная/UI поверхность `ulab-9do` + `ulab-b3y`: PRODUCT budget5
(Plan Review → QA → scoped Code Review; reserve affected QA/re-review).
Это новая работа после прямого расширения scope; прежний физический PR51 остаётся
на своих4/5 и его unchanged content evidence переносится по fingerprint, без
ритуального второго Code Review. Один основной Developer на эту поставку.

Перед DEV: реальный Draft PR53 и независимый PLAN_READY по этому HOW/AC/paths.
Root-cause proposal v0.2 проверен Developer probes; это ещё не production QA.
После DEV: normal checks,
адресная QA, scoped Review, landing/finalize. Main/merge/production — операторские.
