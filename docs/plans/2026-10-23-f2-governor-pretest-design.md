---
title: "F2: предварительная квалификация питания, тепла и обслуживания в U2 Lab"
status: proposed / operator scope accepted / independent Plan Review pending
version: "0.1"
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
- водяные движители и T35/T36 исключены; стадия 2 пуста, стадия 3 не получает
  скрытого корабельного резерва;
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
- T01–T34 и T37–T39 как executable conformance map;
- synthetic conformance fixtures с недвусмысленно неигровыми значениями.

### OUT

- водяные движители, локальный запас пара и T35/T36;
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

### 5.3. Чистое ядро

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
2. preliminary thermal stages 1–7 без списания ресурсов;
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

Telemetry строится только из фактического tick receipt. Обязательны:

- `T_ship`, `Q_B` и вычисленное `T_B` по каждому банку;
- shared port requested/allocated/remaining;
- requested/delivered electrical power и resource reservations/actual use;
- host heat, outward export, passive/active/TI/H2 paths;
- stage/mode/first limiting reason и conservation residuals;
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
- serialize → validate → reopen/resume даёт тот же post-service state и следующий
  governor tick, что непрерывное выполнение от этого состояния.

Это предоставляет U2 переносимый контракт для F2. Выбор услуги, оплата и визуальное
представление принадлежат station/runtime owner.

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
- T20–T30: обязательны на synthetic profile для mode/protection semantics;
- T31: service transition, fit/state conservation и no-free-buffer checks;
- T32: полный outward ledger без двойного IR/latent heat;
- T33: выбранные траектории `1/30` против `1/120`, заданная относительная и
  абсолютная погрешность фиксируется в implementation plan;
- T34: подтверждает полную работу без водяных движителей;
- T37–T38: обязательные TI и shared-tank exact vectors;
- T39: benchmark по реальным `N/K` fixture и честный `O(NK)` report;
- T35–T36: OUT / NOT RUN до отдельного решения о воде.

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
5. закон dispatch нескольких расходных generators, если их сочетание разрешено;
6. station owner для цены, partial refuel и primary-resource ordering.

Пункты 1–4 блокируют продвижение реального каталога на model 0.2, но не блокируют
pure kernel и synthetic conformance. Пункты 5–6 не подменяются порядком массива или
самовольным выбором Lab.

## 9. Последовательность поставки

Каждый work item — отдельный PR от актуального `main`, один основной Developer,
адресная QA, один scoped Code Review и operator merge. Следующий runtime item
начинается от main после принятия предыдущего; stacked preparation разрешена только
в явно допустимых проектным amendment границах и не делает PR merge-ready.

1. **F2-G0 — frozen contract и conformance harness.** Source pin, versioned vectors,
   profile validator, status/evidence format; без переключения runtime.
2. **F2-G1 — resource/buffer kernel.** Общие резервы, банки, порты,
   пропорциональное распределение, conservation receipts; T01–T19/T37–T39 subset.
3. **F2-G2 — staged 30 Hz governor.** Два thermal passes, electrical dispatch,
   stages 0–9, modes/protections, T20–T34 и convergence.
4. **F2-G3 — `/4` integration.** Model/state versioning, runner, Worker controls,
   persistence, real telemetry и вся preservation matrix.
5. **F2-G4 — service state contracts.** Refuel/charge/repair receipt, reopen/resume,
   T31 и отсутствие station UX.
6. **F2-G5 — qualification closure.** Full project guard, matrix report, bounded
   performance evidence, QA, scoped review и честный список BLOCKED/NOT RUN.

Beads использует существующий epic `ulab-9aa`. Перед созданием новых children PM
должен из основного checkout сверить фактический статус `ulab-9aa.18`, потому что
read-snapshot всё ещё помечает уже поставленную UI integration как `in_progress`.
Markdown-список выше не заменяет tracker.

## 10. Acceptance Criteria дизайна

- **F2D-01:** source pin PR #893, roadmap и действующие ADR/GDD указаны; Draft и
  runtime-evidence границы не скрыты.
- **F2D-02:** вода, F3, detection, station UX и identity/session находятся OUT.
- **F2D-03:** `/4` сохраняется, но новая физика получает отдельные model/state/
  governor versions; 0.1 literal-compatible.
- **F2D-04:** отсутствующие численные данные fail closed и не получают defaults.
- **F2D-05:** pure kernel отделён от Worker/DOM, порядок tick и owners однозначны.
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

## 11. Verification Contract для следующего этапа планирования

Implementation plan обязан:

- назвать точные создаваемые/изменяемые файлы и discriminated interfaces;
- начать каждый runtime work item с RED test и закончить focused + normal guard;
- связать каждый T-ID и каждую строку preservation matrix с конкретным тестом;
- задать численные допуски conservation и T33, не заимствуя игровые ТТХ;
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
