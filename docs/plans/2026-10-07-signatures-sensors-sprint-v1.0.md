---
title: "Спринт S1 — сигнатуры и сенсоры, баланс пяти классов"
status: proposed
version: "1.0"
date: 2026-10-07
tags: [sprint, pm, signatures, sensors, radar, class-balance, server-contract]
related:
  - docs/plans/2026-10-07-lab-development-v1.0.md
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/product/ship-fitting-catalog-0.2.5.md
  - docs/architecture/source-authority.md
---

# Спринт S1 — сигнатуры и сенсоры

## 1. Цель, вход и граница

ГД получает инструмент, который показывает, **кто, когда и каким каналом замечает корабль**,
как охлаждение и работа меняют заметность, и какую полезную работу/манёвр приходится
отдать ради скрытности. Результат — сравнение пяти классов и воспроизводимый пакет для
серверной спецификации U2, после которой проектируется клиентская поддержка.

WHAT: решение оператора от 2026-10-07 о следующем модуле и пяти ролевых стратегиях;
действующие владельцы U2 из §11. HOW: этот план. Дорожная карта v1.0 остаётся зонтичным
документом; здесь объединены E1 и необходимые границы E0, без переноса всей архитектуры
игры в Лабу. Планирование не является разрешением реализовывать новые правила игры.

Режим будущей поставки — PRODUCT, один основной Developer, общий budget 5 независимых
запусков: Plan Review, QA, scoped Code Review, резерв affected QA/re-review. Это новая
работа, не продолжение исчерпанных бюджетов старых UI-задач. S0–S5 — последовательные
шаги одного work item, а не шесть самостоятельных циклов ревью. Beads: `ulab-5vs`;
статусы ведутся там, не галочками в плане. Вход в runtime: принятое WHAT, закрытый SS00
и независимое PLAN_READY именно исполнимого контракта. Текущее поручение — подготовить план.

## 2. As-built → gap → target

| Сейчас | Пробел | Итог спринта |
|---|---|---|
| UI 4.3, каталог 0.2.5, повторяемые шахтёрские рейсы, энергия/тепло/топливо, A/B и импорт | Нет IR/EM/CS и выбранного наблюдателя | Причинные сигнатуры своего корабля и результат конкретного наблюдения |
| Есть фактические `exhaustW`, `radiationOutW/InW`, `loadHostW`, заряд и работа модулей | Энергетический экспорт ещё не описывает спектр/направленность сигнала | Явная карта источников → сигнатура, без повторного теплового расчёта |
| `ModuleItem.class` ограничен Civilian/Industrial/UNKNOWN; остальных готовых физических сборок нет | Нельзя честно обещать пять серийных кораблей только сменой class label | Пять ролевых стендов; authored физические данные отдельно от сценария и статуса замыкания |
| Текущий Worker ведёт один опыт и один ship ledger | Нет пары кораблей, событий распространения и observer view | Один Worker-опыт с двумя участниками, общей шкалой времени и ограниченным хранением |
| U2 задаёт азимутальные контакты, radar first slice и рабочие сенсорные опоры | Не все параметры спектра, Quiet/восстановления и материалов замкнуты | S0 фиксирует достаточные входы; неполные наборы не запускаются как готовый баланс |

Исходный runtime: `6238af3cea874bb8643a0c3545eb7e1e8755cc26` / PR #16;
дорожная карта: PR #17. `main` Лабы на момент подготовки — initial commit
`9469d3e8998dada5ec3a6f99712fae8345fb3f7f`; продуктовые stacked PR ещё Draft.
Это снимок подготовки, не долговечная норма или основание переоткрывать старую QA.

## 3. Минимальный срез и исключения

В срез входят:

- IR/EM/CS во время обычного рейса и отдельного парного опыта; мгновенное значение,
  min / среднее по времени / max, разрез по фазам и виновнику пика;
- чистое пространство с заданным тепловым фоном, два корабля и аналитические fixtures
  с несколькими источниками для проверки слияния пятен;
- выделенные IR/EM-приёмники, их matching «три в одном» и одиночный Active Radar ping;
  сопоставление размера S/M и поколения по принятому закону, без полного каталога XS–XL;
- пять ролевых сценариев, графики, журнал причин, сравнение A/B, JSON/CSV и эталоны;
- фильтр наблюдателя и формат данных для обсуждения реализации на сервере.

Вне среза: полная игра боя/оружия/урона, износ и ремонт E2, конфликты контрактов,
пространственные поля E4, реализация stereo Photo/recognition/IFF и транспондера,
полный каталог новых корпусов, MMO interest management, смена игрового протокола,
новые частоты snapshots и публичный игровой клиент. Контракты оставляют место для
Photo/cooperative range sources; в этом срезе их отсутствие **не** подменяется бесплатной дальностью.
Обнаружение входит только в новую SS-приёмку Лабы; прежняя приёмка P1–P14 не расширяется.

## 4. Классы: пять стратегий, а не пять множителей

| Класс | Принятое намерение | Парный опыт и главный вопрос | Метрики кроме сигнатур |
|---|---|---|---|
| Civilian | Универсал, подстраивается оснасткой; Balanced без бесплатного специализированного governor | Одно основание с рабочим и тихим fitting: насколько дорого переключение роли? | Полезная работа, потеря эффективности против специалиста, цена восстановления |
| Industrial | Сознательно яркий ради устойчивой работы и защиты от перегрева | Добыча + полезное охлаждение при приближении наблюдателя: когда надо прервать работу? | Сданные SCU/ч, время до thermal limitation, резерв энергии/топлива, окно реакции |
| Sport | Яркий рывок, ставка на скорость и манёвр | Уход после первого доступного контакта с фактической тягой: успел ли уйти до сближения? | Дистанция/время ухода, расход резерва, реальный тормозной путь, восстановление после burst |
| Military | Низкий профиль при сближении, затем открытая высокая нагрузка | Обычная экономная фаза → раскрытие/пакет нагрузки → восстановление | Кто обнаружен первым, время до заработанной дальности, длительность доступной мощности |
| Stealth | Скрытность с сознательной потерей работы/тяги и накоплением тепла | Quiet → явный выход → Recovery: как долго скрытен и чем оплачено окно? | Время до раскрытия/ограничения, тепловой и электрический долг, пик восстановления |

«Военный из засады» не получает QuietGovernor бесплатно. Combat — высокая готовность
и полезное охлаждение, а не невидимость. Двухключевой military thermal override не
вводится заново этим спринтом; используется только при наличии своего замкнутого
контракта, а обычные и чужие модули сохраняют защиту. Без него сценарий проверяет
пакет нагрузки в нормальном envelope и так и подписан.

Стелс может терять производительность в рабоче-критическом коридоре, но не отменяет
принятое hot/cold derating и safety. Достижение горячего порога не открывает радиаторы
и не выводит из Quiet молча: отказ/ограничение работы виден, явный выход из Quiet
задаётся оператором или сценарием. После выхода проверяется Recovery. Износ пока
заменён **только индикатором времени вне рабочего диапазона**, без фиктивного процента ресурса.

Сравнения двух типов: (а) одинаковые физические входы + разная тактика, чтобы выделить
эффект режима; (б) реальные class-specific сборки из владельцев ТТХ, чтобы проверить
полную роль. Если first unlock отличается G1/G2/G3/G4/G5, это явно разные поколения,
а не доказательство чистого эффекта класса. Ни единый «КПД корабля», ни обязательный
порядок радиусов пяти классов не вводятся. Показывать набор метрик и первый ограничитель.

## 5. Данные и расчётные правила

S0 выпускает реестр каждого поля: единица, source path/section/blob, статус владельца,
canonical/derived/experimental, способ вывода, область действия. `active` документа не
повышает его CSV `working_reference`, `candidate` или `class_diagnostic` до final SKU.

Доступные опоры из U2: ordinary parasitic EM fraction `0.0000215` по **электрическим
ступеням**, не старые 0.005 от целой шины; S/G1 IR detect/hold
`0.000274542277 / 0.0001647253662 W/m²`, EM
`0.00000003592038646 / 0.000000021552231876 W/m²`. Это accepted design directions,
не завершённый игровой баланс. Matching 3-in-1 даёт 2/3 линейной дальности; Class и
National не дают скрытого range bonus. Приём не имеет намеренного излучения, но
его электрическая обработка потребляет энергию, греет и имеет обычную паразитную утечку.

IR читает фактические наружные источники: поверхности корпуса/радиаторов, propulsion
plume, собственный экспорт генератора, H₂ coolant plume. Signed thermal contrast и
наружная мощность — разные поля. Простой переход `heatOutW → IR` запрещён. Для
поверхностей используются radiative T⁴ и данные ε/площади, а спектральное/угловое
отображение каждого потока фиксируется в S0. Нет отрицательной мощности излучения:
standard IR видит положительный контраст, advanced IR — оба знака. Фон не вычитается дважды.

Не замкнутые сегодня входы S0: отображение выхлопа и coolant plume в IR-диапазон;
конкретная Quiet containment/source limit и условия восстановления; собственная геометрия
и законченные C/T-параметры новых class-specific изделий. ГД/оператор согласуют
входной пакет либо явно маркированный измерительный эксперимент. Отсутствие числа
не становится нулём, отсутствие рецепта — filler mass. Если пакет не принят,
SS00 остаётся незакрытым и S1–S5 не получают DEV_RELEASE. Само исследование и
публикация этого плана продолжаются; новые параметры игры не ратифицируются планом.

EM делится на parasitic и intentional. Суммируются только применимые **фактические**
ступени, с их собственной энергетической проводкой; mining beam — работа, не RF.
Экранирование перехватывает только parasitic EM и возвращает его в host heat ledger.
Если вводится явный EM-экспорт, он одновременно вычитается из соответствующей статьи
тепла, чтобы energy ledger закрылся; нельзя поверх старого host heat добавить ещё ту же
энергию экрана. Изоляция меняет intrinsic hull emission/cooling, не plume и не открытый
радиатор. RAM меняет effective CS; одинаковые покрытия не перемножаются, strongest valid only.

Радарная опора S/Civil/G1: 0.70 т, 12.5 кДж electrical, 5.625 кДж intentional RF,
6.875 кДж host heat, recharge 6.25 кВт / 2 с; pulse 5 мс / 1.125 МВт.
Эхо `E_RF · A_rx · σ_CS / ((4π)² R⁴)`, `A_rx=1 m²`, reference CS=96 m²,
reference range 16 км. Pulse живёт отдельным событием: шаг 0.1 с не превращает его
в импульс на 100 мс. Local capacitor — не второй общий запас энергии. Для полного
радара его начальный заряд явно сохранён: штатный готовый прибор заряжен;
разряженный — отдельный контрольный опыт с видимым ожиданием recharge.

Источник и наблюдатель разделены. Дальность — результат **пары**, включая ракурс,
чувствительность и момент наблюдения. Для IR/EM — inverse square, radar — R⁻⁴.
Чистая среда не получает искусственных fog/noise эффектов. Для движения использовать
общие причинные thrust/mass/fuel/heat и фактическую историю; истинная позиция цели
не подменяет задержанное измерение. `c′` берётся из входов опыта, reference 3000 м/с.

## 6. Границы реализации и ранние сетевые риски

Отделить четыре ответственности: каталог/provenance; текущее состояние источника;
расчёт распространения/наблюдений; отображение/экспорт. Конкретные серверные DTO и
wire encoding выбираются в U2, а не закрепляются TypeScript-интерфейсами Лабы.

Минимальные данные опыта: две фиксированные сборки, workload/траектория каждого,
сенсорный пакет каждого, режимы/события по simulation time, фон, `c′`, версии модели
и параметров. Две ship state machine живут в одном Worker с общей шкалой времени.
Сценарий не мутирует каталог или активный снимок; его действия валидируются до Start.

| Риск | Проверка в Лабе и выход для сервера |
|---|---|
| Утечка позиции пассивной цели | `ObserverView` содержит spot channel/bearing/brightness; без target entity ID, R, физического emission time/age, мощности источника, личности и числа источников |
| Вычисление дальности из возраста | Физический age/emission time пассивного spot остаётся только в `GDTruth`; receipt time не раскрывает время излучения |
| Старое эхо приписано новому ping | Pulse ID и очередь событий сохраняются; несколько pending ping до первого эха, source OFF не уничтожает уже летящий сигнал |
| Движение ломает range/time | Retarded emission/reflection/reception события определяются по траекториям; аналитические stationary и constant-velocity fixtures, без подстановки текущего R в уже отправленный ping |
| Одно эхо бесплатно раскрывает скорость | Первый range track без velocity/course и identity; history estimation отдельно, в этом срезе может оставаться отсутствующей |
| Радарное измерение сразу исчезает/живёт вечно | Fresh 3 с после reception, затем stale 10 с; stale только память, не свежая дальность для решений |
| Pause/повтор/восстановление теряют события | Сохранить clock, pulse counters/queue, sensor hold state и track TTL; повтор из checkpoint даёт тот же observer output |
| Диагностика стала сетевым payload | Отдельный экспорт `GDTruth` и allowlisted `ObserverView`; игровые секреты и реальные private runtime configs не попадают в public Lab bundle |

Полная диагностика разрешена в инструменте ГД, но не является игровым клиентским
контрактом. Публикуются только разрешённые design anchors/candidates, как в текущей
Лабе; игровые server-private файлы не импортируются. Перенос в игру — отдельный PR U2:
сначала authoritative server + паритет эталонов, затем протокол/клиент. До этого не
заявлять server parity PASS. Общий cloud/protocol refactor не является зависимостью спринта.

## 7. Последовательность работ и владельцы

| Шаг / Beads | Владелец и действия | Проверяемый выход / зависимость |
|---|---|---|
| S0 / `ulab-5vs.1` | PM + ГД: оформить входной signature contract; сверить источники и промежуточные статусы; определить карту IR, EM ledger, class benches и режимы; оператор принимает недостающие WHAT, Developer уточняет технические интерфейсы | SS00: достаточный versioned пакет, без скрытых defaults; до кода independent PLAN_READY этого пакета |
| S1 / `ulab-5vs.2` | Developer: source ledger, causal IR/EM/CS, фиксируемые параметры, корректные countermeasures и потоковая статистика | SS01–04; компонентные unit/integration tests, no-double-count и legacy regression; после S0 |
| S2 / `ulab-5vs.3` | Тот же Developer: observer/propagation/event queue, passive threshold/hold/merging, radar capacitor и echo lifecycle | SS05–08; аналитические fixtures и один парный headless опыт; после S1 |
| S3 / `ulab-5vs.4` | ГД задаёт сценарии из §4; Developer добавляет пять стендов и парные серии с явной ценой тактики | SS09–11; не все корпуса серийные, статус данных виден; после S1/S2 |
| S4 / `ulab-5vs.5` | Developer: встроить live/final signatures и observer controls в текущую длинную страницу, сравнение и IO; сохранить компактную адаптивную вёрстку | SS12–14; реальный browser Worker и round trip; после S2/S3 |
| S5 / `ulab-5vs.6` | Developer: эталоны и server handoff; QA исполняет SS00–16; Reviewer проверяет только изменённые owners и named risks; PM публикует результат | SS15–16 и evidence; перенос в U2/его серверные tests — следующая отдельная работа |

Исходные пути для Developer: `src/model/v2/physics.ts`, `src/model/v2/step.ts`,
`src/fitting/types.ts`, `src/fitting/compile.ts`, `src/runner/fitting-run.ts`,
`src/runner/mission.ts`, `src/runner/protocol.ts`, `src/runner/worker.ts`,
`src/io/fitting-result.ts`, `src/io/fitting-json.ts`, `src/io/fitting-csv.ts` и
`src/app/fitting-ui/{lab-view,lab-channels,compare-view,trace-chart}.ts`.
Предлагаемые focused owners: `src/signatures/` (sources/observer/events/statistics),
`src/scenarios/signatures.ts`, `tests/signatures/` и один browser signature workflow.
Не превращать большой `physics.ts` или presenter в хозяина всей новой подсистемы.
Новый versioned signature result не переписывает численные legacy snapshots или
catalog editions 0.2.0–0.2.5; миграция IO проверяется отдельно и fail-closed.

## 8. Verification Contract

Общие методы: Developer пишет долговечные tests; QA независимо исполняет таблицу.
Во всех cases различаются FAIL, PASS и NOT RUN. Для numeric fixtures:
`|actual−expected| ≤ 1e-6·|expected| + 1e-12·Q_ref`, где `Q_ref>0` — зафиксированная
физическая опора **того же observable** в golden vector, а не универсальная «1 SI».
Для echo energy `Q_ref` равен порогу эха данного радара; для receiver flux — detect
порогу данного канала/пакета; для energy residual — сумме входных энергий изолированной
фикстуры. Для остальных observable опора — модуль ненулевого ожидаемого значения;
ожидаемый точный ноль проверяется как 0, без такого абсолютного допуска. Поэтому
нулевое эхо вместо ~5.21788e-14 J не проходит. Наличие контакта и detect/hold crossings
проверяются отдельно точными предикатами ниже / ровно на / выше порога — численный
допуск не меняет порог обнаружения. Для времён arrival/TTL — не больше одного шага
и convergence 0.1→0.05 с; порядок событий и свежесть имеют отдельные assertions.
Для узких pulse используется интегральная энергия, а не усреднённый screenshot peak.
Смена sampling/chunk/retention не меняет итог.

| AC | Expected / edge / ошибка | Метод и evidence |
|---|---|---|
| SS00 | Все обязательные источники/параметры имеют версии, единицы и статус; неготовая IR mapping или role construction блокирует готовый stand, а не становится 0/filler | Проверка входного пакета S0; operator decision для новых WHAT; independent PLAN_READY before DEV |
| SS01 | IR отдельно объясняет hull/radiators/exhaust/coolant; закрытие радиатора меняет outward signal и накопленное тепло; energy export не становится IR 1:1 без принятого mapping | Source isolation fixtures: генератор OFF/ON, radiators open/closed, H₂ OFF/ON; energy accounting |
| SS02 | EM учитывает actual stages; intentional RF не экранируется; выключенный источник не имеет активной утечки, charging/discharging даёт свой вклад | Изолированные stages, screen ON/OFF, radar pulse; residual energy не растёт из-за double count |
| SS03 | CS зависит от geometry/aspect/deployment и RAM, не T_ship; одинаковый duplicate не даёт повторное подавление | Нос/борт 96/132 м² reference; RAM 0.25, radar reach ×0.7071; isolation не подавляет plume |
| SS04 | Min/max ловят вычисленный экстремум, mean = integral/time отдельно по фазам; пустой интервал — «нет измерения», не 0; pulse peak не теряется в больших buckets | Один fixture с unequal dt и событием 5 мс, разные retention/chunk settings, точная статистика live/final/export |
| SS05 | IR/EM spot появляется по detect и удерживается по hold, без free range/age/identity; близкие источники складываются; 359°/1° дают ~0°, не 180° | Headless passive fixtures, threshold crossings и schema allowlist observer export |
| SS06 | 16 км radar reference даёт echo ~10.6667 с при c′=3000; одно echo без velocity; recharge не расходует pulse energy второй раз, пустой capacitor ждёт | Аналитический stationary target + resource ledger; на 16 км EM pulse слышен сопоставимым passive observer не позже self-disclosure criterion |
| SS07 | При нескольких ping старое echo сохраняет исходный ID; signal in flight survives source OFF; для движущейся цели используется emission/reflection history | Queue fixture с interval 2 с / RTT>10 с, constant velocity и source OFF; deterministic checkpoint replay |
| SS08 | Fresh 3 с → stale 10 с → забыто; отключение/потеря контакта не обновляет fresh; стандартный cold-negative IR не видит, advanced может видеть | Exact TTL boundary и signed contrast fixture; observer не получает true position через retained state |
| SS09 | Industrial sustain демонстрирует реальную цену охлаждения; Civilian может сменить оснащение без получения specialist governor/скрытого range bonus | Pair within-class A/B и five-role ledger с generation/status provenance; нет заданного победителя |
| SS10 | Sport уход оплачивается actual thrust/charge/fuel/heat; thermal derate ухудшает ускорение/торможение; Military normal→open workload не становится Quiet | Сценарий сближения и самостоятельное торможение; проверка role action/log и first limiter |
| SS11 | Quiet имеет конечный heat/charge budget; critical safety не снимается; радиаторы не открываются молча; explicit exit запускает измеримый recovery debt | Quiet horizon, working/critical edge, explicit exit/recovery; peak+duration и причина ограничения |
| SS12 | Графики IR/EM/CS раздельны по единицам; observer и ракурс явно выбраны; события объясняют пик, acquisition/loss/stale, раскрытие и recovery | Реальный Worker Start/Pause/Step/Resume/Cancel/Reset, live/final и сохранённый результат |
| SS13 | A/B фиксирует обе сборки, observer и model/data revisions; JSON/CSV возвращают те же метрики; неверный/unknown/partial импорт сохраняет текущий опыт | Round trip и atomic refusal; старые fitting/result fixtures открываются без пересчёта или restamp |
| SS14 | Компактная длинная страница, навигация во время запуска, sticky результат/ограничитель; нет автоклавиатуры при slot dialog | Browser 360×780, 780×360, 820×1101, 1101×820 и 1440×900; прежние 11 responsive envelopes; LAN HTTP Start |
| SS15 | Handoff содержит inputs/state/observations и эталоны; GDTruth и ObserverView не смешаны; 2-ping pause/checkpoint replay сохраняет события | Versioned sample package, allowlist tests, перечень server-persisted state; actual U2 parity пока NOT RUN |
| SS16 | Рейсы, первый ограничитель, fuel/charge service, исторические fits, A/B и управление Worker не регрессируют; running/pause ownership не потерян | `.agents/project/verify.sh`, legacy golden digests, mission regression и один 3600 с реальный опыт; performance A/B на одной машине |

Баланс-гипотезы проверяются измерением, а не assertions «Industrial всегда заметнее»
или «Stealth всегда победил». Для каждого сценария итог: кто замечен первым, passive
notice vs earned range, первый ограничитель роли, полезный выход, запасы и восстановление.
Если horizon не достиг события, показывать «не наступило за опыт», не выдуманную длительность.
Performance: одни и те же два входа, MAX режим, медиана 3 запусков baseline/new;
зафиксировать overhead signature-only и paired режима. Цель ≤20% для signature-only;
превышение требует профилирования, а не отказа от корректной физики или немого замедления UI.

## 9. UX и пакет результата

Сохранить текущий рабочий процесс: одна длинная страница, доступ к fitting/conditions/
charts/comparison во время расчёта, результаты в нижней панели. Новый блок «Сигнатуры
и наблюдение» рядом с текущими графиками, компактный выбор наблюдателя и ракурса;
детали источников/настроек под раскрытием. Температура, энергия, добыча остаются.
Role preset запускает осмысленный сценарий, а не перекрашивает график.

Два явно различимых представления: «Полная диагностика ГД» и «Что видит наблюдатель».
В первом доступны истинные расстояния и источники; во втором анонимные пятна и только
заработанные дальности. Переход между ними не меняет расчёт. Нельзя показывать одному
observer spot истинные значения в tooltip, CSV, DOM data attributes или журнале.

Финальный пакет спринта: versioned parameter manifest, role scenario matrix,
golden vectors (стационарная цель, движение, late echo, Quiet/recovery), causal source
breakdown, allowed observer payloads, persisted-state list, нерешённые численные/production
вопросы и рекомендации ГД. Для U2 согласуются числа/спека; Lab CSV не становится вторым
runtime SSoT — projection идёт через controlled validation ADR-0049.

## 10. Риски, сокращение, rollback и самоаудит

Самый короткий полезный путь: causal signatures → passive/radar pair → пять role cases
→ текущий UI/экспорт. Полный каталог корпусов, Photo, поля и бой отложены. Если S0 не
замыкается, публиковать конкретный missing-input record и варианты решения оператору;
не заменять его недоказанными классами или очередным инфраструктурным проектом.

Rollback: новый signature mode отключается; прежний каталог и mission model сохраняются.
Новые файлы результатов имеют явную модель/схему; старый reader отклоняет неизвестную
без повреждения активного результата. Старые snapshots не мигрируются массово.
Публикация новой версии на LAN/Pages — после QA/review и реального browser smoke;
main/merge/auto-merge выполняет только оператор. Base bootstrap и прежние открытые
acceptance gates не закрываются этой приёмкой.

PM_ERR/DOC_PR baseline self-check выполнен при планировании: удержана цель инструмента
ГД, одна система AC, один independent Reviewer, без runtime-кода PM и review swarm.
Повторять самоаудит после каждых трёх завершённых review/QA → triage/fix циклов;
advisory не расширяет scope автоматически. Сроки не выдумываются: после S0 Developer
оценивает объём по замкнутым данным, PM фиксирует календарный timebox с оператором.

## 11. Источники и authority

Маршрут: U2 `docs/INDEX.md` / `docs/architecture/ADR-INDEX.md` → профильный owner.
Снимок чтения U2: `0fe06927ab496918b3547f43412134c100a6e0b4`;
remote main при подготовке `9935d40c80b00992b5adcc57bf82380bc870e5be`.
Для шести основных signature/sensor/governor/radar owners diff между этими снимками
пуст; thermal/cooling amendments учитываются отдельно по принятым решениям оператора.

| Owner U2 | Что определяет |
|---|---|
| [ADR-0046 v1.3](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/architecture/ADR-0046-Azimuthal-Sensing-And-Track-Firing-Solution.md) | Spot, earned range, slow-light, identity; одна ping не даёт velocity |
| [Signature model v0.34](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/specs/server/spec_signature_model_v0.1.md) | Source/observer separation, merging, фильтрация; отменённые тепловые формулы не использовать |
| [Governor v0.2](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/gdd/gdd_hull_class_governor_architecture_v0.1_draft.md) | Balanced/Sustain/Burst/Combat/Quiet, module policy отдельно |
| [Radar v1.1](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/gdd/gdd_active_radar_clean_space_first_slice_v0.1_draft.md) | 16 км, энергопакет, R⁻⁴, pulse ID, fresh/stale |
| [Countermeasures v1.0](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/gdd/gdd_signature_countermeasure_first_slice_v0.1_draft.md) | Изоляция, parasitic shielding, RAM, strongest coverage |
| [Stealth S/G5 v0.2](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/gdd/gdd_s_stealth_g5_signature_control_first_slice_v0.1_draft.md) | Built-in RAM, масса 0.8 т, EM-слабость и production boundary |
| [Power classes v1.0](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/gdd/gdd_s_power_class_specialization_balance_v0.1_draft.md) | Разные физические конструкции, first-unlock различия |
| [Data router v1.0](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/data/README_ship_module_ttx.md) | Channel/noise/power/package/parasitic/source CSV, их собственные статусы |
| [TTX Master v1.4](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/specs/balance/spec_ship_module_ttx_master_v0.1_draft.md) | Бесшовная owner cascade, no class/national range multiplier, fail-closed SKU |
| [Thermal doctrine](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/brand/u2_engine_thermal_doctrine.md) | Реальные outward paths, Quiet не раскрывается молча, spectral mapping отдельно |
| [ADR-0049](https://github.com/komleff/u2/blob/0fe06927ab496918b3547f43412134c100a6e0b4/docs/architecture/ADR-0049-Config-Schema-Hulls-Modules-Sectors.md) | Design → controlled config projection → server/runtime DTO |

Точные CSV из data router: `ship_sensor_ir_em_receiver_noise_first_slice_v0.1.csv`,
`ship_sensor_ir_em_m_reference_scenarios_v0.1.csv`,
`ship_signature_em_parasitic_stage_first_slice_v0.1.csv`,
`ship_sensor_range_profile_v0.1.csv`, `ship_sensor_physical_progression_profile_v0.1.csv`,
`ship_sensor_power_profile_v0.1.csv`, `ship_sensor_class_profile_v0.1.csv`,
`ship_hull_governor_profile_v0.1.csv`. Они находятся в U2 `docs/data/` и не копируются
в план как полный приватный GDD. S0 проверяет соответствующий gameplay-complete пакет;
материальные production blockers не снимаются экспериментом Лабы.

## 12. Глоссарий и история

- IR — инфракрасный сигнал и его контраст с фоном; EM — паразитное/намеренное излучение.
- CS — effective radar cross-section, м²; не универсальная «видимость».
- Spot — анонимный пеленг и яркость; track — память наблюдений с отдельно заработанной дальностью.
- Quiet / Recovery — тихое окно и погашение накопленного теплового/энергетического долга.
- Governor — автоматика корпуса; её профиль не заменяет физические ТТХ или module policy.
- GDTruth / ObserverView — диагностическая истина ГД и только легитимные данные наблюдателя.

| Версия | Дата | Изменение |
|---|---|---|
| 1.0 | 2026-10-07 | План следующего модуля: пять ролевых стратегий, causal signature/sensor slice, входной data gate, SS00–16, ранние server/client границы |
