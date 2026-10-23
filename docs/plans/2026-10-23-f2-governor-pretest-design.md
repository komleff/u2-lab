---
title: "F2: предварительная квалификация питания, тепла и обслуживания в U2 Lab"
status: proposed / operator scope accepted / adversarial review fixes integrated / independent Plan Review pending
version: "0.2"
date: 2026-10-23
tags: [pm, product, f2, thermal, power, governor, service, persistence, compatibility]
related:
  - docs/gdd/gdd_ship_energy_thermal_model_v0.1.md
  - docs/specs/spec_u2_lab_ship_model_v0.1.md
  - docs/plans/2026-10-11-ship-model-ui4-integration.md
  - docs/plans/2026-10-17-stealth-thermal-delivery.md
---

# F2: предварительная квалификация питания, тепла и обслуживания в U2 Lab

## 1. Решение оператора и продуктовый результат

Режим работы — PRODUCT. Оператор 2026-10-23 выбрал первый вариант подготовки:
U2 Lab квалифицирует переносимое ядро центрального регулятора теплосети 0.3 и
контракты состояния F2 внутри существующего маршрута `/4`.

Целевой результат — стенд, на котором до переноса в U2 можно воспроизводимо
проверить:

- один расчётный такт питания и тепла при `dt=1/30 s`;
- общий учёт электричества, топлива и рабочих тел до окончательного теплового
  распределения;
- температурное качество и общие порты тепловых буферов;
- фиксированные стадии регулятора 0–9, Normal/Quiet/Combat и защиты;
- сохранение энергии, массы и владельцев наружных сигналов;
- атомарные операции пополнения, ремонта и повторного открытия состояния;
- переносимые входы/выходы проверок для последующей server qualification.

Это **не** означает готовность F2 в U2. Server/Unity runtime, station UX,
баланс реальных кораблей и повторный вход через игровую identity/session систему
остаются отдельной реализацией и отдельной приёмкой.

## 2. Source binding и CANON ROUTE

### 2.1. Публичная цель

Публичный roadmap `https://u2game.space/roadmap/`, редакция 21 от 23.10.2026:
F2 «Питание, тепло и обслуживание» находится в разработке, плановое окно —
16–27 ноября 2026. Игрок получает расход топлива и энергии, нагрев и охлаждение,
приборы, заправку и ремонт; состояние переживает повторный вход.

F3 отдельно владеет полями, течением и горячим газом. Эти игровые воздействия не
входят в приёмку F2 Lab; ядро только сохраняет существующий абстрактный вход среды.

### 2.2. Тепло и энергия

Первичный новый источник — U2 PR #893, точный head
`df7e3cd699dafde5175b48a5853c2c04ece244b2`, файл
`docs/specs/thermal/spec_ship_thermal_governor_v0.3.md` v0.3. PR остаётся Draft:
его текст используется как явно закреплённый источник предварительной
квалификации, но не выдаётся за merged runtime evidence. Любое изменение head,
затрагивающее алгоритм, T01–T39 или открытые данные, требует source diff и
affected Plan Review до DEV.

Действующие владельцы, проверенные через U2 `docs/INDEX.md` и
`docs/architecture/ADR-INDEX.md`:

- ADR-0043 — одна `T_ship`, материальная теплоёмкость и полный баланс энергии;
- ADR-0045 — единый корабельный аккумулятор;
- ADR-0068 и ADR-0066 — temperature derating, критические границы, износ и отказ;
- `gdd_automatic_power_thermal_scheduler_v0.1_draft.md` v0.4 — Active и
  Background, Quiet и аварийный генератор;
- `gdd_thermal_control_palette_balance_v0.1_draft.md` v0.5 — поверхности,
  буфер, H2 и TI;
- `gdd_multifuel_power_and_h2_cooling_v0.1_draft.md` v0.2 — общий физический
  запас одинакового ресурса;
- `gdd_quiet_thermal_class_equipment_v0.1.md` v0.3 — Quiet без скрытого выхода и
  горячего fallback.

При расхождении новый алгоритмический контракт PR #893 применяется только в
этой предварительной ветке. Принятые законы ADR и поздние прямые решения
оператора имеют приоритет. План или код U2 Lab не назначает отсутствующие ТТХ.

### 2.3. Явно исключённые источники и утверждения

- legacy/archive и прежние планы не устанавливают новый WHAT;
- водяные движители, локальный запас пара и T35/T36 исключены; стадия 2 пуста,
  стадия 3 не получает скрытого корабельного резерва. Ограниченное состояние
  содержимого водяного термобака `W`, нужное T16, остаётся IN и не является
  движителем или трубопроводным графом;
- detection, earned range и sensor/radar acceptance не входят в F2;
- успешные проверки U2 Lab не доказывают server parity, Unity UI, сетевую
  детерминированность или готовность релиза.

## 3. Target → as-built → gap

### Target

Один portable governor получает снимок начала такта, запросы модулей и конечные
бюджеты ресурсов, выполняет два ограниченных тепловых прохода и один electrical
dispatch, затем единожды фиксирует энергию, массу, состояние защит и наружные
пути. Игрок не управляет клапанами, температурой или приоритетами устройств.

### As-built на `origin/main=d67ac61`

Модель `/4` уже имеет:

- одну `temperatureK`, материальную `heatCapacityJK` и signed environment;
- единый аккумулятор, генераторы, топливо и фактические electrical losses;
- радиаторы, H2, TI, буферы, durability и режимы;
- настоящий Worker, telemetry/history, A/B, JSON/CSV, checkpoint/resume;
- сохранённый familiar workflow open/fit → conditions → controls → graphs/live/
  journal → compare → export/reopen;
- 1575 unit tests, build, 184 browser PASS + 1 унаследованный screenshot skip и
  26 project checks на baseline этого design worktree.

### Gap

Текущий `stepV3` принимает решения с шагом 1 s и повторно вычисляет локальные
flows. Буфер хранит `minimumCaptureK`, а не `T_B(Q)`. Топливо списывается после
распределения, без общего предварительного резерва внешних потребителей и
источников питания. Нет явного request/cap/cost-контракта, стадий 0–9, двух
thermal passes, 30/120 Hz convergence и полного T01–T39 evidence map.

У `/4` есть repair-control и checkpoint, но нет отдельного атомарного F2 service
контракта для точного пополнения топлива/заряда, ремонта и receipt. Старый
station-service относится к модели mission `/2|3` и не переносится cast-ом.

## 4. Scope

### IN

- чистое параметрическое ядро governor 0.3 без DOM и Worker ownership;
- агрегированные совместимые buffer banks и конечный список несовместимых банков;
- единые входной, выходной и при необходимости общий port budgets банка;
- `request_i`, `cap_i`, `cap_i,S`, `cap_i,B`, `T_min,i`, electrical/resource cost
  и auxiliary heat как явный модульный контракт;
- единый resource reservation ledger для обычной работы, генераторов и
  охладителей;
- фиксированные стадии 0–9, включая поздний S→B capture и B→S→radiator path;
- `dt=1/30 s`, сравнение выбранных траекторий с `dt=1/120 s`;
- Normal/Quiet/Combat, H2 off при `T_ship<=300 K`, critical/restart semantics;
- versioned `/4` opt-in model и полная совместимость старого model 0.1;
- реальная telemetry нового ядра в прежнем `/4` workflow;
- точные service request/receipt для charge, refuel и repair; checkpoint/reopen;
- ограниченное состояние содержимого водяного термобака `W`, обмен `S↔W` и
  локальная защита от замерзания только в объёме T16;
- T01–T34 и T37–T39 как executable conformance map;
- synthetic conformance fixtures с недвусмысленно неигровыми значениями.
- versioned balance-candidate profiles и paired experiment/recommendation route,
  не включающий их в default или каталог.

### OUT

- водяные движители, локальный запас пара и T35/T36; состояние хранения воды
  `W` для T16 из этого исключения не следует;
- новые поля/горячий газ/течение F3 и их игровая синхронизация;
- station UI, цены, недостаток денег, выбор частичной заправки и primary resource;
- identity/login/session transport, cloud save и сетевой конфликт состояний;
- новый каталог или балансные ТТХ кораблей и модулей;
- изменение flight, towing, cargo, mining или detection;
- ручные настройки автоматики игроком;
- новый standalone экран или параллельный reduced workflow;
- merge, deploy и объявление F2 готовой к релизу.

## 5. Архитектура

### 5.1. Версии и совместимость

Маршрут и верхняя schema остаются `/4`. Новое исполнение получает отдельный
`modelVersion: "ship-fitting-ship-model-0.2"`, `stateVersion: "ship-state/2"` и
`governorVersion: "ship-thermal-governor/0.3"`.

`ship-fitting-ship-model-0.1` и `ship-state/1` остаются буквальными readers и
исполнителями. Старый JSON не дополняется `T_B(Q)`, не пересчитывается и не
мигрирует автоматически. Новый результат не открывается старым solver. UI
показывает model/state version и отказывается атомарно при неизвестной версии.

До отдельного решения оператора current/default model и каталог 0.3.2 не
переключаются. Новая модель доступна только через явный qualification fixture или
versioned новый документ. Rollback — убрать opt-in entry, сохранив новые файлы как
unsupported/newer; старые результаты остаются читаемыми.

### 5.2. Профиль без выдуманных ТТХ

`GovernorProfileV03` — обязательный валидируемый вход, а не набор fallback:

- profile temperature, cold/hot margins, separation и hysteresis;
- параметры `T_B(Q)` каждого банка, общие port limits и conductance/temperature
  head каждого разрешённого направления;
- для установленного водяного термобака — state/enthalpy map `W`, масса,
  phase/protection limits, `S↔W` conductance/port и heater cap;
- реальные H2 `q(T)`/mass-cost inputs и температурные разрешения;
- дополнительные mode thresholds, если они требуются установленному оборудованию;
- provenance каждого численного поля.

Отсутствующее или неfinite значение делает профиль `UNQUALIFIED` до старта.
Нельзя подставить бесконечную мощность, температуру из `Q_B,max`, общую цель 300 K
или значения старого `minimumCaptureK`.

В conformance fixtures разрешены малые synthetic values, выбранные только для
однозначной арифметики теста. Они имеют `origin.kind="experimental"`, sourceRef на
конкретный vector и не появляются в каталоге, пользовательских preset или balance
report. Реальный ship profile остаётся PRODUCT GAP до отдельного решения.

Для исследования настройки вводится третий, неканонический класс
`origin.kind="balance-candidate"`. Он содержит версию, provenance, проверяемую
гипотезу, изменяемое поле, исходное значение, допустимую владельцем область и
ссылку на baseline. Такой профиль запускается только в balance experiment,
никогда не становится current/default, preset или каталогом и не считается
принятым ТТХ. Если исходное значение или разрешённая область не утверждены,
эксперимент получает `BLOCKED`, а не synthetic подстановку.

### 5.3. Чистое ядро

#### 5.3.1. Минимальные физические состояния

| Узел | Authoritative state и ownership |
|---|---|
| `S` | `U_S` в J и `C_S>0` в J/K; `T_S` выводится из энергии. Сухая конструкция каждого компонента входит в `C_S` ровно один раз. При изменении состава нельзя одновременно сохранять и `U_S`, и `T_S` без явно учтённого внешнего переноса энергии. |
| `B` | `Q_B` в J, границы и однозначная `T_B(Q)`; оболочка/крепление принадлежат либо `C_S`, либо характеристике банка, но не обеим. Совместимая агрегация разрешена только при одинаковой температурной характеристике, направлении и port semantics. |
| `W` | Для профиля с водяным термобаком: собственная энергия или энтальпийная карта, масса, вычисляемая температура/фазовая область, предел малого нагревателя и ограниченный `S↔W`. Один внутренний перенос записывается равными величинами с противоположными знаками. Сухой бак учитывается в `S`; содержимое не дублируется в `C_S` или `Q_B`. Водяной движитель, локальный пар и свободный pipe graph не появляются. |
| Электросеть | Один общий electrical ledger: requested, reserved, accepted/delivered, conversion losses и actual generation. Неиспользованный резерв не списывается. |
| TI / поверхности | Составной пакет хранит отбор с холодной стороны, электрическую работу, auxiliary heat и внешний экспорт; одна физическая площадь принадлежит одному пути. |
| H2 / другие ресурсы | Общий species ledger связывает reserve и actual use; температурная производительность и `q(T)>0` приходят из профиля. |

Профиль без водяного термобака не имеет `W`. Для T16 используется отдельный
synthetic fixture с явными `W`-полями. Реальные карты воды остаются PRODUCT GAP;
их отсутствие не блокирует прочие fixtures и не разрешает подменить `T_W` на
`T_S`.

#### 5.3.2. Детерминированное распределение между банками

Массив input не задаёт gameplay-приоритет. При qualification fit строятся
канонические списки consumers и банков. Consumers упорядочиваются по
`stage → role/profile key → stable instance id`. Банки сначала агрегируются по
полностью одинаковой характеристике, затем упорядочиваются **most-constrained
first**: по числу совместимых canonical consumer keys, их лексикографической
compatibility signature и fingerprint физического профиля. Instance id допустим
последним ключом только для физически эквивалентных банков, где перестановка не
меняет суммарные allocations.

Для каждой стадии и направления все requests/caps снимаются до распределения.
Каждый банк ровно один раз пропорционально делит свой конечный budget между
совместимыми remaining requests с учётом `cap_i`, `cap_i,S`, `cap_i,B` и shared
ports; выданное уменьшает remaining request/cap следующих банков. Повторного
прохода, backtracking и max-flow solver нет. Политика ограничена `O(NK)`,
детерминирована и не обещает глобально оптимального использования произвольного
графа. Реальный профиль с `K>1` требует отдельной balance qualification; до неё
он не включается в default/catalog.

T39 обязан включать пересекающуюся совместимость: hot bank → A/B, constrained
bank → только B, одинаковые конечные budgets/caps, а также перестановки input
arrays. В этом vector constrained bank обслуживает B первым, flexible bank —
оставшийся A; allocations и totals не зависят от порядка массивов.

#### 5.3.3. Ответственности ядра

Ядро разделяется по ответственности:

1. profile qualification и построение фиксированных списков модулей/банков при
   изменении fit;
2. immutable tick input со снимком начала такта;
3. resource ledger с резервами и остатками общих контуров;
4. температурно ограниченные buffer transfers и пропорциональное распределение;
5. thermal pass с фиксированными стадиями;
6. один electrical dispatch, затем final thermal pass;
7. одна commit-функция состояния и полный conservation receipt.

Ядро не знает DOM, Worker, графики или station UI. Оно не ищет произвольный путь
по трубам и не выполняет convergence loop. Сложность измеряется как `O(NK)` для
`N` consumers и `K` несовместимых банков; безусловный `O(N)` не заявляется.

### 5.4. Порядок одного такта

Порядок обязателен и является частью результата:

1. Stage 0: snapshot, permissions, budgets и внешние resource reservations;
2. preliminary thermal stages 1–7 без списания ресурсов; stage 1 независимо
   рассчитывает cold protection корпуса и `W`, не отменяя охлаждение горячего `S`;
3. один electrical dispatch с конечным топливным резервом источников;
4. final thermal stages 1–7 с фактическими electrical/resource caps;
5. фактические work packages, потери, среда и наружные пути;
6. единственная late stage 8 S→B из нового непокрытого нагрева;
7. stage 9 commit энергии, массы, защит, сигналов и diagnostics.

Новое тепло и новый заряд буфера не расходуются повторно в том же такте. Разрешены
только явно описанные B→S→radiator и late S→B. Встречный S→B и B→S в одном такте
запрещён. Неиспользованный консервативный ресурс остаётся в запасе до следующего
такта и не перераспределяется задним числом.

### 5.5. Адаптер `/4`, Worker и telemetry

Новый runner выполняет 30 substeps на физическую секунду, сохраняя responsive
Pause/Step/Resume/Cancel. `Step` означает один authoritative tick `1/30 s`; UI
отображает точное время, а retention может агрегировать историю без изменения
физики. Нельзя вернуть 1 s физику под видом 30 Hz.

Authoritative clock — целый `tickIndex`; физическое время равно
`tickIndex/30 s`. Phase boundaries, checkpoints и RNG/work-package consumption
привязываются к этому clock, а не к числу UI updates. Сравнение с 120 Hz идёт в
одинаковых физических timestamps. Implementation plan обязан выбрать
ограниченный integrator, который не создаёт отрицательные энергию/массу/
температуру и либо квалифицирует synthetic profile для `dt`, либо fail closed до
такта; исправление overshoot обрезанием committed state запрещено.

Telemetry строится только из фактического tick receipt. Обязательны:

- `T_ship`, `Q_B` и вычисленное `T_B` по каждому банку; при наличии термобака —
  `U_W`, `T_W`, phase/protection state и `S↔W` transfer;
- shared port requested/allocated/remaining;
- requested/delivered electrical power и resource reservations/actual use;
- host heat, outward export, passive/active/TI/H2 paths;
- stage/mode, limiting module, requested/delivered useful output, typed limiting
  reason (`no_request|power|resource|temperature|incompatible|protection`) и
  conservation residuals;
- current charge/fuel/durability/stops/surfaces и IR/EM владельцы.

История не заполняется последним snapshot. Отсутствующий producer отображается как
недоступный, а не как ноль. IR не выводится напрямую из всего latent heat.

### 5.6. Контракт обслуживания и повторного входа

Lab проверяет не станцию, а чистый state transition:

- request перечисляет точные добавляемые `chargeJ`, `fuelKg` по species и целевые
  `durabilityR` по instance;
- операция допустима только над paused/complete versioned state и не меняет время,
  температуру, buffer energy, mode, RNG, fit или telemetry history;
- каждая прибавка ограничена реальной capacity, отрицательные/NaN/неизвестные поля
  отклоняются атомарно;
- repair использует существующие правила durability и не стирает историю самовольно;
- receipt хранит requested/accepted/rejected amounts и reason без цены/экономики;
- accepted charge/mass/repair записываются также в отдельный cumulative external
  service ledger; conservation report не выдаёт их за замкнутый внутренний такт;
- serialize → validate → reopen/resume даёт тот же post-service state и следующий
  governor tick, что непрерывное выполнение от этого состояния.

Это предоставляет U2 переносимый контракт для F2. Выбор услуги, оплата и визуальное
представление принадлежат station/runtime owner.

### 5.7. Контракт настройки баланса

Неизменяемые правила — conservation, отсутствие повторного расхода, stage order,
shared resources/ports, mode permissions, индивидуальные защиты и сохранение
state. Они не становятся ручками баланса. Настраиваемы только versioned поля
профиля с provenance: `Q_B,max`, ports, `T_B(Q)`, conductance/head; площадь,
эмиссивность и обслуживание radiator; owner-defined TI performance/power;
`q(T)` и производительность H2; profile temperature/margins/hysteresis;
существующие ёмкость электрозапаса и источник разрешённого fit.

Каждая обязательная balance-серия — paired experiment `baseline ↔ один candidate`
при одинаковых задаче, нагрузке, среде, начальных ресурсах и thermal debt,
durability/RNG, составе кроме одного поля, versions и физическом горизонте. Серия
включает `work → recovery → repeat`, конечный checkpoint и соседнюю robustness-
проверку (нагрузка/температура, частичный ресурс или неполное восстановление).
Недостигнутое событие записывается как `not reached within H`, а не бесконечность.

| Ручка / сравнение | Ожидаемое направление и constraint | Обязательный наблюдаемый исход | Обязательная paired series |
|---|---|---|---|
| `Q_B,max` отдельно от in/out ports | capacity покупает время только при доступной мощности и температуре; запас в J не задаёт conductance или port power | absorbed J, unusable remainder, время до первого ограничения и recovery | короткий мощный / длинный слабый импульс равной энергии; отдельные one-field sweeps capacity и ports |
| `T_B(Q)`, conductance/head | холоднее обычно облегчает приём, но может ухудшить отдачу; конечные неотрицательные параметры | фактические S↔B flows, доступная при состоянии энергия, thermal debt | холодный / горячий initial bank; `work → recovery → repeat` для одного изменяемого поля |
| surface/epsilon, Passive/Active | площадь помогает в холодном фоне и усиливает внешний приток в горячем; насос имеет цену | полезная работа, net outward heat, электричество, масса/слоты | существующие сравнимые fits в обычном / холодном / горячем фоне, без нового каталога |
| TI performance/power | выигрыш ограничен питанием, hot-side площадью и нагревом источника | отбор с S, work, export, полезная работа полного цикла | малая / большая доступная площадь × battery / generator около границы положительного эффекта |
| H2 `q(T)`/performance/stock | больший `q` уменьшает kg/J, но общий finite stock и reservations сохраняются | kg по consumers, время истощения, output и residual debt | общий почти пустой бак; достаточная / недостаточная площадь; load-off; Normal / Quiet |
| profile temperature/margins/hysteresis | меняют момент ограничения, не порядок критических границ | switches, overshoot, useful output, wear при наличии принятого закона | one-field sweeps около порога и малые возмущения нагрузки/initial state в Normal / Combat |
| electrical reserve/source | запас покупает автономность, источник — восстановление с потерями | delivered/requested output, min charge/fuel, deficit/recovery time | work / peak / recovery / repeat; Quiet deficit → independent coverage → deficit |
| service / reopen | внешний ввод обязан быть видим; `T_S`, `B` и история не обнуляются | interventions, cumulative external input, next tick и repeat outcome | no service / charge / refuel / repair / combination; serialize/reopen перед повтором |

Производные игровые метрики: доля фактического полезного выхода от запроса; время
до derating/critical stop/resource exhaustion; время до следующего полезного
пакета и полного восстановления; средняя полезная производительность повторяемого
цикла; накопленные thermal/resource debts; цена улучшения в массе, слотах,
электричестве, топливе, ремонте и внешнем обслуживании.

Рекомендация имеет фиксированный receipt:
`question → baseline profile → one change → measured gain → measured price →
failure/robustness conditions → operator proposal`. Она отдельно помечает
доминирующий путь, бесполезный buffer, постоянный необязательный H2 расход,
generator→heat→cooler positive feedback и накопление долга. Меньшая температура
сама по себе не является рекомендацией. Без утверждённых candidate values серия и
balance verdict остаются `BLOCKED`; conformance fixture не заменяет их.

## 6. Preservation matrix существующего `/4`

| Цепочка | Требование |
|---|---|
| Open / fit | Старые 0.1 документы открываются буквально; 0.2 opt-in видим и не заменяет default |
| Conditions | Те же phases/requests/mode/environment; tick rate фиксирован моделью, не ручной настройкой |
| Worker controls | Start/Pause/Step/Resume/Cancel/Reset сохраняют active owner и ACK; `Step=1/30 s` только для 0.2 |
| Graphs / live / time / journal | Только реальные новые producers; selected time согласован во всех представлениях |
| Frozen A/B | Замороженный результат не меняется от draft, service preview или другого run; несовместимые версии объясняются |
| JSON / checkpoint | Literal 0.1 compatibility; строгие 0.2 discriminator и atomic refusal; resume без повторного tick |
| CSV | Явные model/governor/profile versions, units, tick/retention boundaries и реальные values |
| Saved data / versioning | Нет silent migration, recompute старой истории или V3→V2 cast |
| Deployment | В design/plan PR нет publish; runtime PR проходит обычный project guard и отдельную Pages/LAN границу |

Удаление или намеренное изменение любой строки требует отдельного PRODUCT решения и
affected Plan Review. Само наличие старой страницы рядом не считается сохранением.

## 7. Conformance и границы утверждений

### 7.1. Набор PR #893

- T01–T19: обязательны для pure kernel и resource/buffer ledgers;
- T16 внутри этого диапазона отдельно проверяет `W`, защиту замерзающего
  содержимого при горячем `S` и равные противоположные записи `S↔W` transfer;
- T20–T30: обязательны на synthetic profile для mode/protection semantics;
- T31: service transition, fit/state conservation и no-free-buffer checks;
- T32: полный outward ledger без двойного IR/latent heat;
- T33: выбранные траектории `1/30` против `1/120`, заданная относительная и
  абсолютная погрешность фиксируется в implementation plan;
- T34: подтверждает полную работу без водяных движителей;
- T37–T38: обязательные TI и shared-tank exact vectors;
- T39: overlapping-compatibility/permutation vector из §5.3.2, benchmark по
  фактическим `N/K` fixture и честный `O(NK)` report;
- T35–T36: OUT / NOT RUN до отдельного решения о водяных движителях.

Каждый vector хранит source SHA, units, точный input, ожидаемый output/invariant,
implementation fingerprint и статус `PASS|FAIL|BLOCKED|NOT_RUN`. `BLOCKED` по
игровым параметрам не превращается в synthetic PASS.

### 7.2. Что может считаться результатом

Допустимая формулировка после runtime-поставки: «U2 Lab governor 0.3 проходит
перечисленные synthetic conformance vectors и сохраняет существующий `/4`
workflow на проверенном SHA».

Недопустимые формулировки без отдельных доказательств:

- «F2 готова»;
- «server parity подтверждён»;
- «корабли сбалансированы»;
- «station/re-login gameplay работает»;
- «все T01–T39 пройдены», если T35/T36 исключены или игровые профили BLOCKED;
- «30 Hz укладывается в production budget» без серверного profiling.

## 8. PRODUCT GAP

До real-profile testing оператору/U2 owners нужны:

1. `T_B0`, `C_B` либо иная утверждённая `T_B(Q)` для каждого разрешённого банка;
2. conductance, `Delta T` и общие port limits направлений S↔B и B→consumer;
3. profile temperature, margins, separation и hysteresis корпусов;
4. реальные H2 `q(T)`/mass-cost curves и Quiet cold threshold/hysteresis;
5. energy/enthalpy map, phase limits, `S↔W` conductance/ports и heater cap
   водяного термобака для real-profile T16;
6. допустимые диапазоны и target outcomes balance-candidate profiles;
7. закон dispatch нескольких расходных generators, если их сочетание разрешено;
8. station owner для цены, partial refuel и primary-resource ordering.

Пункты 1–6 блокируют соответствующий real-profile/balance verdict, но не блокируют
pure kernel и synthetic conformance. Пункты 7–8 не подменяются порядком массива или
самовольным выбором Lab. Qualification policy §5.3.2 однозначна для стенда, но не
объявляет `K>1` profile сбалансированным или принятым в каталог.

## 9. Последовательность поставки

Каждый work item — отдельный PR от актуального `main`, один основной Developer,
адресная QA, один scoped Code Review и operator merge. Следующий runtime item
начинается от main после принятия предыдущего; stacked preparation разрешена только
в явно допустимых проектным amendment границах и не делает PR merge-ready.

1. **F2-G0 — frozen contract и conformance harness.** Source pin, versioned vectors,
   profile/candidate validators, experiment/recommendation receipts и status/evidence
   format; без переключения runtime.
2. **F2-G1 — resource/buffer kernel.** Общие резервы, банки, порты,
   пропорциональное распределение, conservation receipts; T01–T19/T37–T39 subset.
3. **F2-G2 — staged 30 Hz governor.** Два thermal passes, electrical dispatch,
   stages 0–9, modes/protections, T20–T30/T32–T34 и convergence; T31 здесь не gate.
4. **F2-G3 — `/4` integration.** Model/state versioning, runner, Worker controls,
   persistence, real telemetry и вся preservation matrix.
5. **F2-G4 — service state contracts.** Refuel/charge/repair receipt, reopen/resume,
   T31 и отсутствие station UX.
6. **F2-G5 — qualification closure.** Full project guard, conformance и paired
   balance matrix reports, recommendation receipts, bounded performance evidence,
   QA, scoped review и честный список BLOCKED/NOT RUN.

Beads использует существующий epic `ulab-9aa`. Перед созданием новых children PM
должен из основного checkout сверить фактический статус `ulab-9aa.18`, потому что
read-snapshot всё ещё помечает уже поставленную UI integration как `in_progress`.
Markdown-список выше не заменяет tracker.

## 10. Acceptance Criteria дизайна

- **F2D-01:** source pin PR #893, roadmap и действующие ADR/GDD указаны; Draft и
  runtime-evidence границы не скрыты.
- **F2D-02:** водяные движители/локальный пар, F3, detection, station UX и
  identity/session находятся OUT; ограниченный `W`-state термобака для T16 — IN.
- **F2D-03:** `/4` сохраняется, но новая физика получает отдельные model/state/
  governor versions; 0.1 literal-compatible.
- **F2D-04:** отсутствующие численные данные fail closed и не получают defaults.
- **F2D-05:** pure kernel отделён от Worker/DOM, порядок tick, owners и bounded
  deterministic bank allocation однозначны и permutation-tested.
- **F2D-06:** resource reservations, shared ports, `T_B(Q)` и late capture входят в
  обязательный контракт.
- **F2D-07:** service проверяется как атомарный state transition без station UX.
- **F2D-08:** preservation matrix охватывает open/fit, conditions, controls,
  graphs/live/time/journal, A/B, JSON/CSV/reopen/resume и deployment.
- **F2D-09:** T01–T34/T37–T39 имеют маршрут к executable evidence; T35/T36 NOT RUN.
- **F2D-10:** server parity, balance, native device и release readiness не
  выводятся из Lab PASS.
- **F2D-11:** delivery разложена на отдельные reviewable PR/work items и не
  разрешает PM реализовывать runtime.
- **F2D-12:** до DEV нужен independent Plan Review реализации на точном fingerprint.
- **F2D-13:** versioned balance-candidate проходит paired полный цикл и выдаёт
  измеримую рекомендацию; без утверждённых значений результат честно `BLOCKED`.

## 11. Verification Contract для следующего этапа планирования

Implementation plan обязан:

- назвать точные создаваемые/изменяемые файлы и discriminated interfaces;
- начать каждый runtime work item с RED test и закончить focused + normal guard;
- связать каждый T-ID и каждую строку preservation matrix с конкретным тестом;
- закрепить dispatch по model/state discriminator, mapping Normal/Quiet/Combat к
  существующим mode names и полный create/restore/result/Worker adapter;
- задать integer clock/checkpoint/RNG contract и сравнение 30/120 Hz на общих
  физических timestamps;
- задать численные допуски conservation и T33: absolute + relative normalization
  по фактическим transfer energies/masses, не по одному большому `C_ST_S`;
- доказать admissibility выбранного integrator на synthetic profiles либо
  отклонять непригодный profile до tick; state clipping не считается исправлением;
- оставить T31 exit gate за F2-G4, не за F2-G2;
- связать каждую balance knob с metric, paired experiment, full-cycle receipt и
  recommendation schema §5.7; реальные численные цели могут остаться `BLOCKED`;
- проверить hostile/malformed input, неизвестные versions и atomic refusal;
- не менять global timeouts, workers, guards или зависимости без отдельного AC;
- оставить physical LAN, OS-native picker/touch, server/Unity и real catalog balance
  как `NOT RUN`, пока они фактически не выполнены;
- требовать отдельные QA и scoped Code Review после DEV; merge выполняет оператор.

## 12. Самопроверка PM

- Authority route пройден INDEX-first; legacy search не использован как источник.
- Выбранный оператором вариант 1 отражён без расширения station/runtime scope.
- Существующий `/4` workflow не заменён новой страницей.
- Неутверждённые ТТХ не назначены и не спрятаны за fallback.
- Старый 1 s controller не объявлен совместимым с governor 0.3.
- Synthetic conformance отделён от balance acceptance реальных кораблей.
- PR #893 Draft и красный/неполный CI не выданы за runtime completion.
- Beads snapshot не изменён и не объявлен текущим canonical status.
- Runtime tests этой спецификацией не добавлены; baseline guard зафиксирован отдельно.
