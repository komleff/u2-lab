---
title: "Инвентаризация возможностей интерфейсов v1 / v2 / v3 для аудита v4"
status: reference
version: "0.1"
date: 2026-10-06
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
  - docs/product/ship-fitting-gd-workspace-v4.md
---

# Инвентаризация возможностей интерфейсов v1 / v2 / v3 для аудита v4

Дата: 2026-10-06. Роль: единственный primary Developer `/root/ship_fitting_developer`, Codex GPT-6. Работа read-only: исходники, Git blobs, документы и существующие тесты прочитаны; runtime, тесты, assets, схемы и численная модель не изменялись. Это технический inventory для GD/UX/PO, не принятый WHAT и не новый implementation plan.

## Снимки и границы доказательства

| Интерфейс | Точный источник | Назначение |
|---|---|---|
| v1 Legacy | `903d36b2ac4a2bfa90997803770ace13d520fbe9:src/app/legacy.ts` | Сохранённый интерфейс Power & Heat с `u2-lab/1`, не исторический архивный bundle |
| v2 Ship Fitting | `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`, HEAD `903d36b2ac4a2bfa90997803770ace13d520fbe9` | Первая оснастка, одна редактируемая сборка, непрерывная страница |
| v3 Claude UI | primary `/Users/komleff/Documents/GitHub/u2-lab`, HEAD `131015414b12995af355de42f25d019862413c83`; runtime commit `30a1c9b0953bf61723cd8a9deb570044e1f26862` | Варианты сборок, три взаимоисключающих экрана, новые presentation views |

Маршрут чтения: `.memory-bank/{activeContext,progress}.md` → `docs/INDEX.md` → продуктовые документы, HOW ownership map, user guides → конкретные `src/app/*`, domain/IO owners. Все source observations привязаны к `git show SHA:path`; изменения PM в Memory Bank во время аудита не меняют этот snapshot. Поиск ключевых слов для source authority и архивы не использовались. Единственная созданная запись — этот ignored report.

Указанные PM стенды: v3 `http://192.168.68.65:4183/`, v2 `http://192.168.68.65:4186/`, Legacy `http://192.168.68.65:4186/?mode=legacy`. В этом audit браузерные сценарии и HTTP probes **NOT RUN**; серверы/операторские страницы не затрагивались. Наличие controls доказано source, удобство конкретного устройства здесь не переоценивалось. Ранее sealed QA/Review — унаследованные evidence, не новые результаты Developer.

Прямая Git-проверка: **29 blobs** во всех `src/model`, `src/runner`, `src/scenarios`, `src/fitting`, `src/io`, `tests/fitting/fixtures` совпадают между 903d36b и 1310154. Пустой `git diff --stat` в этой области; SHA256 отсортированной JSON-карты path→Git blob: `fc4b81b31bee4dda85f57212123af5abeb5860a75d500afefec14c81d48b780c`. `legacy.ts` также один blob `9b9dd1f720782ea9e97f80f82933d6c46937b22a` в обеих ветках. Это собственное ограниченное proof численных owners, не повторная проверка всего ранее bound списка 85+2.

Ниже `L:` означает общий `src/app/legacy.ts` (903 и 131 одинаковы), `V2:` — файл при 903d36b, `V3:` — файл при 1310154. Номера строк относятся к указанным immutable blobs.

## Матрица возможностей

| Работа пользователя | v1 Legacy | v2 Ship Fitting | v3 Claude UI | Классификация / source anchors |
|---|---|---|---|---|
| Открыть корпус / исходную сборку | Два S/M Civilian Diesel preset | Шесть hull profiles, 1/2/3 laser presets по допустимым payload slots | Те же profiles/presets, независимо для выбранного варианта | v2 расширяет оснастку, численные owners v2→v3 одинаковы. L:50; V2:fitting.ts:107–117; V3:ship-view.ts:47; fitting/catalog.ts:16–146 |
| Произвольное редактирование корпуса | Формы C, hull εA, accumulator capacity, cargo capacity; остальное через JSON | Паспорт массы/C/cargo read-only, корпус выбирается preset; hull-owned builtins нельзя менять | То же, паспорт и карточки/readonly details | Это сознательная смена model/ownership v1→v2, а не исчезнувший hull editor того же каталога. L:92–116; V2:fitting.ts:234–258; V3:ship-view.ts:23–67 |
| Монтаж / слоты / снятие | Слотов нет. Palette добавляет численные модули, enabled toggles; удаления в форме нет, JSON может изменить список | Список всех сменных слотов, select каталога, swap/remove, несовместимость до Apply; builtins readonly | Карточки всех слотов, optional ring, modal catalog, atomic Apply/Remove, batch всех сменных payload slots | Не переносить свободную palette как обход текущих слотных правил. L:117–164,546–634; V2:fitting.ts:82–92,214–233,272–309,580–599; V3:ship-view.ts:68–116, swap-dialog.ts:26–118, presentation.ts:74–100 |
| Открыть параметры конкретного модуля | Editable family-specific numeric forms внутри details; provenance рядом с полем | F3 JSON installed/selected item после выбора слота; многие builtins только label/mass | Whole-card action; builtins и Lab instances открывают полный item/bill/gates/provenance и имеющиеся measurements | В v3 детали присутствуют, но **readonly**. Сменная карточка открывает замену, не численный редактор. L:120–164; V2:fitting.ts:193–213,255–258; V3:fitting.ts:264–290, instance-details.ts:5–11 |
| Изменить номинальные ТТХ изделия | Широкая family-specific форма | F3 создаёт отдельный local variant: только `powerW` выбранного кандидата | F3 создаёт отдельный local variant: только `powerW` установленного изделия в последнем selectedSlot | Остальные ТТХ отсутствуют в форме, доступны в существующем fit JSON с полным provenance и validation. V2:fitting.ts:720–742; V3:fitting.ts:429–452; fitting/types.ts:13–40; validate.ts:43–147 |
| Выключить изделие | enabled checkbox любого module | enabled сменных и builtin mining; фиксированная выбранная mining group не уменьшается | То же, подписи Laser 1/2/3 и separate enable hit target | Семантика K и group неизменна, это не инструмент скрытого улучшения знаменателя. L:163,198; V2:fitting.ts:255–270,302–309; V3:ship-view.ts:109; scenarios/fitting.ts:31–45 |
| Исходные запасы / начальная T | Заряд J, diesel kg, T K; буферы/H₂/прочее JSON | Charge/diesel/H₂ fractions; начальная T только RunSpec JSON | Fractions в Lab; active form locked по actual active snapshot; T всё ещё не в форме | Начальная T выражается существующим `makeMiningRun.temperatureK`, потеря affordance без изменения модели. L:105–114; V2:fitting.ts:85,601–612; V3:lab-view.ts:78–122; scenarios/fitting.ts:85–99 |
| Горизонт / dt / quick durations | Duration, dt, targetWork; 5min/10min/8h/12h shortcuts | Duration и targetM3; dt только JSON | То же; speed ×1/×10/×60/max — pacing, не dt | dt и duration shortcuts отсутствуют в v2/v3 form. L:50,185–190; V2:fitting.ts:88–89; V3:lab-view.ts:78–86, fitting.ts:228–239 |
| Фазы / повторы / selected group | Mining/idle/stress/burst presets; произвольные phases/repeat/service через JSON editor | Только фиксированный mining cycle; work duration/duty editable; остальное RunSpec JSON | То же, actual phase strip read-only и пояснение про фиксированную рабочую фазу | Phase duration/repeat уже выразимы existing scenario owner; реальная миссия/до полного трюма/ETA не реализованы и отложены. L:50,501–545,702–709; scenarios/fitting.ts:6–21,34–65,111–118; V3:lab-view.ts:122 |
| Среда / тепловой закон | Cold/normal/hot/solar/direct-heat presets; backgroundK, solarFlux, T⁴/linear experiment и linearWK | Только backgroundK; остальные environment fields RunSpec JSON | То же, environment event filter читает лишь реальные events | Environment model не исчез, но advanced environment controls скрыты. L:166–184,490–499; V2:fitting.ts:88; V3:lab-view.ts:78–86,169–185; model/v2/types.ts:26,38 |
| Процесс добычи | Generic load `workPerJ`, efficiency и targetWork | Density, returnFraction, duty, work, target; LAB-ORE-01 beam/process | То же, nominal preview всю сборку / live delivered отдельно | Generic-load work v1 не эквивалентен actual mining v2. Нельзя молча вернуть `workPerJ` как новый канон. L:132–135; scenarios/fitting.ts:101–110; V3:swap-dialog.ts:113–118,180–182 |
| Первичные графики | Четыре одновременных canvas: power request/delivered/generator; T+work/critical; selected heat+radiation in/out; selected stock/work | Два fixed canvas: request/delivered и T, без threshold overlays / source curve | Один SVG, energy/heat/stocks/work group + единица, по умолчанию все каналы этой группы/единицы, legend toggles | v2 потерял видимые heat/stocks/source/thermal threshold plots. v3 возвращает доступ к retained channels, но не прежние четыре коротких обзора и не threshold overlay. L:53,254–307; V2:fitting.ts:381–399; V3:lab-channels.ts:24–79 |
| Выбор измерений / per-instance detail | Два selectors; отдельный last actual SI/ledger table | Только fixed charts, metrics/state/ledger, динамические каналы экспортируются | Все retained channels группируются и подписываются; per-instance table/details, selected bucket mean/min/max/count | Каналы в v2 **данные есть, plotted UI нет**; v3 широкий доступ есть, primary energy graph перегружен множеством series. L:53–54,347; V2:fitting.ts:402–473; V3:lab-view.ts:159–169, lab-channels.ts:24–79 |
| Оси / окно / cursor / hover | Auto scales и весь доступный trace; thresholds; без hover/zoom/manual range | То же auto canvas, два plots | Unit/group picker, auto range, event cursor и prev/next выбирают bucket; trace visible first–last | Manual bounds, arbitrary time window, zoom/drag/crosshair/pointer hover **нет во всех трёх**. Это новые presentation controls, не возвращение потерянного feature. charts.ts:9–84; V3:lab-channels.ts:18–42,58–79; fitting.ts:454–485 |
| A/B quantitative compare | Frozen A + current B; same-task / own-sortie checkpoint modes, detailed path/A/B value differences | Frozen A + current B, fixed horizon mining metrics и conditions categories | То же + Δ, rate bars, mobile A-only/B-only, previous-result labels | v1 checkpoint modes не идентичны v2 horizon metrics; их возврат затрагивает semantics. Все версии без A/B time-series overlay. L:352–399; compare.ts:13–60; V2:fitting.ts:474–518; V3:compare-view.ts:24–43 |
| Несколько сборок / кораблей | Один editable spec + один frozen A, можно поменять S→M для B | Одна editable fit + frozen A, смена hull/preset | A/B/C/+ независимые fit/conditions/last result, могут иметь разные hulls; сортировка name/rate/K/diesel оба направления; mobile cards | v3 добавляет multiship experiment workspace. Один глобальный active Worker, не parallel simulation; нет пользовательского rename/delete и полного history. fitting-workspace.ts:7–45,85–97,129–162; compare-view.ts:45–153 |
| Навигация / controls при active test | Одна длинная страница; toolbar верхний sticky на desktop, static ≤700 | Continuous page + anchor nav, встроенные controls в Lab sticky bottom | Header screen buttons, hidden sections; F1 sticky, global controls fixed bottom | Навигация **не заблокирована** predicate active. Header не sticky; foreign fitting main action disabled; Cancel/Step доступны на Lab/Compare, не на Fitting. V2:fitting.ts:82–92; V3:fitting.ts:186–250; fitting.css:170–200,227–237,736–749 |
| Сохранение / импорт / экспорт | Experiment JSON, raw JSON modal editor, result JSON, trace CSV, **events CSV** | Fit JSON + numerical experiment JSON, file import, result JSON, trace CSV в F3 | То же; invalid import сохраняет fit/result/A; result export selected variant, experiment export active spec во время active | Нет localStorage/IndexedDB/autosave/workspace document во всех трёх. V3 сохраняет fit, а не весь workspace. Raw JSON textarea и events CSV отсутствуют в v2/v3. L:56,656–709; V2:fitting.ts:638–716; V3:fitting.ts:137–146,354–418; fitting-workspace.ts:181–220 |
| Tablet / phone | Responsive continuous page, четыре graphs/таблицы ниже config; smaller control sizes | Responsive panels, две plots, 44px numeric/buttons, длинная scroll page | Explicit Lab 767/768/1279/1280 layouts, 44px controls, responsive modal, phone compare cards/A-only/B-only; ring fallback | Формальная responsiveness присутствует; always-reachable nav отсутствует. До800 hero-result скрыт; F1 остаётся. Новое physical device proof в этом audit NOT RUN. styles.css:461–542; V2:fitting.css:1; V3:fitting.css:99–110,871–1042,1124–1165 |

## Независимая проверка утверждений о блокировке и потере сравнения

### Навигация

В `V3:fitting.ts:199` три `data-screen` кнопки не имеют `disabled`. Handler `243–250` выполняется независимо от active: устанавливает screen, закрывает неподтверждённый swap/instance dialog, render и scrollTo(0,0). Меняется только presentation, `w` остаётся тем же. Source не подтверждает «во время теста переход запрещён».

Препятствия, которые source действительно подтверждает:

1. Header с navigation находится выше sticky F1. CSS `.ui-header` — обычный flex, а sticky только `.fit-f1` (fitting.css:170–179,227–237). После длинной прокрутки nav требует возврата вверх.
2. Только один section видим, остальные hidden (fitting.ts:227; fitting.css:44–46). Это уже не общий рабочий лист v2 с anchors.
3. На экране Fitting показываются main action + Reset. При выборе другого варианта во время теста main action disabled «Тест другого варианта». Pause/Resume/Step/Cancel остаются на Lab/Compare (fitting.ts:227). Такое состояние легко принять за общий lock.
4. Lab condition inputs и initial fractions disabled при running **и paused**, поскольку immutable RunSpec зафиксирован; UI объясняет это общим текстом (lab-view.ts:89–122). Второй Start disabled для всей страницы; замены fit/вариантов разрешены для следующего опыта. Это принятая ownership semantics, её нельзя устранить снятием numerical guards.

Минимальная reuse-идея: непрерывные sections с всегда достижимым anchor nav, оставить один global Worker/control state и honest active banner. Это организация presentation, не параллельные тесты и не редактирование active RunSpec.

### Что сохраняется, что заменяется, что выглядит потерянным

| Действие v3 | Фактическое state-поведение | Пользовательская неоднозначность |
|---|---|---|
| Screen switch / variant select | `w.select` меняет только selectedId; navigation не вызывает reset | F1 описывает selected variant, Lab — active owner; при foreign selection это разные сущности |
| Apply valid fit / preset | Меняет next fit, очищает replaySpec; прежний result сохраняет old resolved snapshot | Heading Compare выводит **draft** revision `v.fit.fitRevision`, а metrics принадлежат `r.spec.resolvedShip.fit.fitRevision`; последняя там не написана |
| Freeze A | Deep clone selected terminal result в отдельный frozen; result остаётся в варианте | Буква frozen test A совпадает с названием workspace variant A; explanatory sentence есть, identity всё равно требует внимания |
| Повторный Start до первого chunk | Прежний result сохраняется. `getCurrentResult` не отдаёт его как новый result; предыдущий run явно помечен в F1/Compare/export context | Пользователь видит «ожидается первое измерение» рядом с retained prior result в Compare; это разные интервалы, не потерянные данные |
| Matching new chunk / terminal | Перезаписывает единственный `owner.result`; другие variant results и frozen A остаются | Полного списка истории запусков нет. Предыдущий результат этого варианта уже недоступен, если не frozen/exported заранее |
| Reset | Удаляет result active owner (либо selected при отсутствии active); frozen A не удаляет | Это явная потеря последнего result по действию, не по navigation |
| Invalid import | Valid last state атомарно сохраняется | Ошибка показана полностью; D12 wrapping уже существует |
| Page reload / переход в Legacy | Workspace живёт в JS памяти страницы; переход загружает отдельный режим | Автоматического сохранения всего workspace нет; пользователь должен сохранить нужные документы |

Доказательство: `fitting-workspace.ts:62–83,85–122,129–179,181–220`; `fitting.ts:219–258,354–418`; `compare-view.ts:24–43,75–136`. Ранее написанные meaningful tests прочитаны: `tests/ui/workspace.test.ts:18–121` и `tests/browser/claude-ui-review.spec.ts:3–88` проверяют variant ownership, retained previous/A, foreign variant, invalid import и повторный Start. В этом audit они не запускались.

У v1 и v2 Freeze сознательно делает `currentResult/current = undefined`, оставляя frozen A. Это отключает current result/CSV export, хотя старые нарисованные графики/цифры могут ещё оставаться на странице: `L:639–647`, `V2:fitting.ts:623–628`. В v3 эта механика исправлена presentation workspace: Freeze сохраняет обе сущности. Нельзя описывать текущую v3 как снова теряющую B на Freeze.

Отдельный workflow: v1 при отсутствии current result может запросить Worker `snapshot` и после него Freeze A (`L:451–455,639–647`), в том числе пока опыт paused/active. v2 Freeze использует только уже полученный current result и не запрашивает snapshot. v3 `freeze()` принимает только complete/cancelled, а button disabled для running result (`fitting-workspace.ts:175–179`, `lab-view.ts:185`). Значит Freeze **не доступен непосредственно на Pause** в v3; обход Cancel→Freeze меняет статус на partial cancelled. Это отличие UI workflow, не отсутствие численного промежуточного snapshot у Worker; нового действия audit не добавляет.

Ещё один подтверждённый source риск контекста: импорт numerical replay записывает только `selected.replaySpec`, не переносит его hull/conditions в draft fit/conditions (`fitting-workspace.ts:207–208`). До запуска Lab form берёт `v.conditions`, паспорт — `w.getFit`; следующий Start в `prepare` использует replaySpec. Поясняющий banner есть, но значения условий/корпус imported snapshot до запуска не раскрыты как отдельный видимый context (`fitting.ts:227`; `lab-view.ts:90–106`; `ship-view.ts:23–47`). Во время active теста Lab правильно переключается на actual spec. Поэтому риск — hidden replay identity перед запуском, не порча imported spec.

Compare conditions в v3 действительно сравнивает stored RunSpecs, а не current form. Сравниваются hull, process, environment, initial, horizon, dt, target, repeat, phases/mining duties (`scenarios/fitting.ts:134–169`). Но UI печатает только названия изменившихся групп, без пары A/B значений. В multivariant table baseline — первый measured variant **после сортировки**, поэтому изменение sort может изменить подписи «одинаковые условия / отличаются» (`compare-view.ts:75–87`). Метрики не меняются. Frozen A остаётся фиксированной базой в нижнем A/B compare.

## Точные утраченные / скрытые численные affordances

Важное различие: v1 — `radiative-host-ledger-0.1`, v2/v3 — `ship-fitting-ledger-0.2`. Сохранять все старые физические допущения под новым UI нельзя. Inventory описывает доступность, а не разрешает автоматически переносить каждое поле.

### Уже принимает `makeMiningRun`, но v2/v3 не показывают в форме

| Поле | Existing default / область | Что требуется лишь для presentation |
|---|---|---|
| `stepSeconds` | 0.01 s, validator определяет допустимый диапазон | Явный physics dt отдельно от расчётного pacing |
| `temperatureK` | Initial 300 K | Отдельный начальный T input |
| `approachSeconds` | 10 s, march request1 | Редактируемая длительность заданной thrust phase, без обещания расстояния/ETA |
| `brakingSeconds` | 10 s, retro request1 | Та же semantics для braking |
| `serviceSeconds` | 10 s, unload true, refuel/charge false | Длительность существующего unload service, не заправка |
| `idleSeconds` | 30 s | Длительность существующего recovery/idle |
| `repeat` | true | Repeat switch существующего scenario, не новый termination rule |
| `selectedWorkGroup` | Все установленный mining instances | Explicit group selection потребует сохранить существующую validation и неизменный K denominator; enabled toggle ей не эквивалентен |

Source: `scenarios/fitting.ts:6–21,31–65,85–118`. Уже отображаются duration/background/work/duty/density/return/target, initial charge/diesel/H₂ fractions (`lab-view.ts:78–122`); остальные поля через manual numerical JSON replay. Существующие values можно подавать через `MiningConditions`/`FittingWorkspace.setConditions`/`prepare` без новой схемы или численного owner. Это кандидаты для PO/GD restoration; автоматического release на implementation нет.

### Численные поля в Legacy формах, которых нет в v2/v3 формах

- Hull effective C, hull radiation εA, accumulator capacity J, cargo capacity SCU; absolute charge J и diesel kg вместо fractions.
- Generator rated W / efficiency / pathEfficiency; engine force N / alpha / efficiency / hostFraction; load W / efficiency / workPerJ.
- Radiator area / pump W; buffer capacity / transfer cap / absorb/release temperatures; H₂ cooler cooling cap / auxiliary W / J/kg.
- Thermoinverter cooling cap / hot-side K / hot area / copEfficiency; PV area / efficiency.
- Solar flux, linear thermal law/coefficient, ready environment presets (solar/direct heat); scenario preset menu idle/stress/burst и quick-duration buttons.
- Raw editable JSON modal (включая phases, repeat, tank/policy/gates и прочие численные поля).

Source: `L:92–191,490–545,702–709`. Thermal gates/policy/tank — **readonly text** в v1 form и editable лишь JSON, не потерянные прежние отдельные sliders. В v2/v3 field-level origins, dry bills/gates/required numerics уже существуют в ModuleItem и JSON (`fitting/types.ts:13–40`; `validate.ts:43–147`). Inline local variant form меняет только `powerW`, даёт новый ID и experimental origin (`fitting.ts:429–452`). Отдельного `createLocalVariant` helper нет; название в обсуждении относилось к этому handler.

Широкая local-variant форма может работать с существующим fit format, но нуждается в явном списке редактируемых полей и их SI/provenance/validation. Нельзя заменить readonly derived mass/C одним свободным C slider, менять curated SKU без нового variant ID, редактировать встроенные hull items через сменный module, или вернуть v1 generic-load `workPerJ` в accepted LAB-ORE-01 без WHAT. Full numerical editor является отдельно принимаемой UI surface; audit его не внедряет.

## Графики и экспорт: что реально доступно

v1 `charts.ts` имеет простой reusable canvas renderer с auto X/Y, четырьмя y labels, dashed horizontal limits, mean curve и bucket min/max bands (`charts.ts:9–84`). v1 вызывает его четырежды и передаёт min module workHigh/high как thermal limits (`L:254–307`). После complete Legacy plotted buckets выбираются каждый ceil(N/1000)-й, а полный retained result остаётся для CSV (`L:440–448,675–683`); это важная особенность старой presentation, не образец для нового ложного «полного trace».

v2 использует тот же renderer дважды без `limits`; остальные retained channels остаются в result/CSV. Поэтому отсутствие в UI heat/resource plots не означает отсутствие расчётных данных. v3 показывает все channels текущей group/unit и переключаемые legends; signed auto extrema теперь finite scan по всем visible retained buckets. Но это один graph с множеством включённых series; выбор отображаемых curves не задаёт собственное временное окно. Event selector выбирает первый bucket с end≥eventtime и ставит event cursor. Нет свободного выбора arbitrary bucket по pointer. «Ось и единицы» выбирает unit, не ручные диапазоны Y. Все statements source-backed `lab-channels.ts:18–79` и `fitting.ts:454–485`.

Stable semantic colors отсутствуют в v3: graph assigns colors по `curves` после hidden filtering, legend — по всем rows той unit (`lab-channels.ts:43–54,71–75`). Скрытие одной кривой меняет индексы оставшихся; legend и line могут даже получить разные цвета. Это конкретный presentation risk для v4 readable primary plots, без необходимости менять telemetry/data.

Thermal work/critical overlays в v3 отсутствуют, хотя gate temperatures доступны в stored snapshot. A/B time trace overlay отсутствует **во всех трёх**, нынешний `.ab-plot` — две bars SCU/h из тех же metrics (`compare-view.ts:43`). Hover/crosshair/window/zoom также не были функциональностью v1; возможное добавление — новая presentation UX, не восстановление старого numerical feature.

Для reuse пригодны существующие channels, buckets start/end/sum/min/max/count, units `fittingChannelUnit`, existing gates и A/B RunSpec/result snapshots. Один renderer может дать первичные несколько aggregate plots с стабильными colors и optional detail channels, A/B trace по simulation seconds и общим осмысленным scale. Рендер не должен вычислять новые physical values или подменять metrics downsampled plot values; temporal alignment и units должны быть явны. Это техническая возможность, не окончательный дизайн/план.

JSON операции различаются по объекту:

| UI действие | Что сохраняется / читается |
|---|---|
| «Сохранить сборку» v2/v3 | `u2-ship-fit/1`: hull/assignments/instances/localVariants/initial fractions, без результатов и без workspace variants |
| «Экспорт теста JSON» v3 | Пока active — **active.spec**, даже при выборе чужого variant; после terminal — selected next prepared/replay spec. Это не гарантированный JSON уже показанного результата |
| «Экспорт результата JSON» v3 | Selected variant retained result, включая собственный immutable spec, metrics/state/channels/buckets/events/retention. При repeat до первого chunk может быть предыдущий run; context явно помечен |
| «Экспорт измерений CSV» v3 | Тот же selected retained result; bucket intervals/tick_count, все channels mean/min/max, units и metadata; не все physical ticks |
| Импорт fit | Validation/apply selected fit. v3 сохраняет прежние result/frozen A и помечает stale; v2 valid import вызывает reset |
| Импорт numerical experiment / result envelope | `parseExperimentJson` извлекает `.spec ?? document` и валидирует RunSpec. Из result JSON восстанавливается **только численный опыт**, не charts/metrics/workspace history |
| Неизвестный catalog | Только explicit allowSnapshotReplay после supported numerical validation; слоты не подтверждены |
| Старый `u2-lab/1` | Передача через sessionStorage import bridge и открытие Legacy. Это единственный технический sessionStorage use, не autosave workspace |

Source: `fitting.ts:137–146,354–418`; `fitting-workspace.ts:181–208`; `fitting-json.ts:10–59`; `fitting-csv.ts:33–73`; `V2:fitting.ts:669–709`. v1 `parseRunJson` принимает raw RunSpec, не result envelope (`io/json.ts:4–16`). Separate **events CSV** v1 exporter имеет columns time_s/kind/message и retention metadata (`io/json.ts:61–70`); не присутствует в v2/v3 UI, но retained events входят result JSON. Его presentation reuse возможно без новой схемы событий; нельзя выдумать отсутствующие event instance/cause fields. В v3 disabled instance filter честно сообщает отсутствие attribution (`lab-view.ts:169–185`).

## Минимальная структура reuse для полезной непрерывной v4 страницы

Это ограниченная техническая рекомендация для будущей принятой UX/spec, без implementation и без нового model WHAT.

1. Сохранить `FittingWorkspace` как единственного owner selected variants, next fits/conditions, active immutable test и frozen result. Один Worker и тот же protocol/ACK/revision filtering; не создавать скрытую копию состояния на каждую section.
2. Вернуть continuous page composition из v2, с всегда достижимыми anchors: «Сборка» → «Условия» → «Измерения» → «Сравнение» → «Документы/источники». На desktop compact sticky nav, на tablet/phone компактный reachable equivalent. Existing views разбить на sections; не держать mandatory controls только в hidden screen.
3. В shared context явно показывать hull/name выбранного варианта, draft revision, active owner/run/revision, displayed result run/measured revision/interval/status. Выбор другого hull/variant не меняет владельца текущего Worker. Variant name хранится уже сейчас, пользовательского rename affordance нет; его presentation может пользоваться существующим `Variant.name` без workspace persistence schema, после принятого UI design.
4. Flat slot cards сделать обычным способом работы; нынешние category groups/modal search/compatibility/nominal whole-fit preview/atomic batch reuse. Ring может быть optional details, не единственный путь выбора slot. Не менять 40-item catalog и builtin ownership.
5. Existing makeMiningRun conditions controls расположить рядом с запуском; advanced existing settings явно отличить от immutable active values. Если active — показать реальные active fields и причину lock, next fit edits подписать отдельно. Не создавать real flight/full-hold termination/refuel.
6. Primary plots показывают небольшой осмысленный aggregate roster и стабильные colors, detailed group/instance explorer остаётся ниже. Threshold overlays доступны из snapshots. A/B time trace может использовать те же retained channels с label run/hull/revision/interval. Все axes, window, pointer interaction — только presentation, если PO примет; это не новые расчётные channels.
7. Compare rows привязать к measured snapshot identity, показывать current draft отдельно; condition differences раскрывать как stored A/B values и фиксированную обозначенную baseline, а не незаметно меняющуюся с sort. Preserve old variant results/frozen A, экспорт до их явного overwrite/reset; без новой autosave/history schema в этом scope.
8. JSON buttons подписать объектом («сборка», «следующий/активный опыт», «результат run…»), сохранить parser/serializer/CSV owners. Result import как numerical replay честно объяснить, не обещать restore traces. Raw editor и family-specific numeric variant form требуют explicit accepted presentation list и provenance mapping; неизвестные значения не объявлять каноном.

### Предметные ограничения

Текущие v2/v3 phase durations — заданные thrust pulses/service/idle, не actual route/ETA. «Рабочая фаза» не означает mine-until-full. Реальная mining mission, refuel, canonical C# flight runtime и numerical fixes остаются отложены оператором. Производители неизвестных модулей не заполняются DEMO-данными. Claude assets — допустимый design input, обязательный layout для v4 этот inventory не устанавливает.

## Собственные проверки и незапущенные поверхности

Выполнено: `git rev-parse HEAD`, `git status --short`, `git show SHA:<exact owner> | nl -ba | sed -n <bounded range>`, `git ls-tree -r` для конкретных known ownership subtrees/существующих tests, `git diff --stat 903d36b… 1310154… -- <numerical owner subtrees>`, read-only Python сравнение path→blob 29 owners. Прочитаны user guides, legacy/fitting/workspace/views/charts/presentation/CSS/JSON/CSV/types/validator/scenario owners и адресные existing tests; никаких runtime тестов из них не запускалось. Одно обращение к несуществующему `src/fitting/variants.ts` и `src/io/csv.ts` вернуло path-not-found; authority для local variants/CSV установлен прямыми фактическими imports/types/handlers, не поиском выдуманного helper.

**NOT RUN:** guards, browser probes, build, runtime simulations, local HTTP/TLS smoke, физический tablet/user workflow, screenshots, full numeric matrices/12h, hosted CI. Числа результатов существующих запусков не пересчитывались. Native export, scroll/focus/occlusion здесь source inventory, не новое device PASS. Никакие серверы не стартовали/останавливались; все старые immutable artifacts/evidence/report seals сохранены.

Статические findings о nav и compare identity переданы PM, текущему QA `/root/ship_fitting_qa` и Reviewer `/root/fitting_adversarial_review`. Developer после этого отчёта IDLE до отдельного v4 design/plan release. Acceptance/merge readiness не заявляется.
