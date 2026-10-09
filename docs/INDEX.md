# U2 Lab — индекс документов

| Документ | Статус | Область |
|---|---|---|
| [Простая модель корабля для U2 Lab](gdd/gdd_ship_energy_thermal_model_v0.1.md) | draft v0.4 / предложение ГД 2026-10-10 | Краткая модель: общий тепловой узел, конечный буфер, сохранённые каскады, площадь корпуса и контур TI, отрицательная прочность; ТТХ предлагает ИИ, документ ещё на рассмотрении |
| [ТЗ: простой стенд баланса U2 Lab](specs/spec_u2_lab_ship_model_v0.1.md) | draft v0.4 / SM-01–12 | Существующий стенд, подготовка кандидатов ИИ, сравнение работы и полного теплового цикла; Спутник/Мир и выбранные проверки до G20; без редактора законов и ручного заполнения каталога |
| [Контрольные расчёты модели](research/2026-10-10-ship-model-checks.json) | analytical evidence / не runtime QA | Излучение, температурный кредит и возврат тепла, контур и выгода TI, EM и порог наблюдателя; исходные данные и границы проверки |
| [Предложения ГД v2: слоты, тихий ход, пределы, термоинвертор](product/gd-proposals-v2-2026-10-10.md) | accepted v2.2 / решения оператора 2026-10-10 (два раунда); уровень тихого хода игрок не выбирает; обшивка-радиатор у всех корпусов — по умолчанию | Одна смешанная категория «Сенсоры и тепло» + встроенные исполнения по классам (опоры Спутник, Мир); сброс шины в тепло встроен, печи 0,90/0,95; честные цены покрытий; порог тихого хода по калибру (S 10 / M 20 / L 40 км) с уровнем игрока; электростелс — экран и гиродины; матрица пределов класс × ярус × поколение и прогон G1…G∞; два модуля теплового насоса |
| [Математическая модель корабля v1.0](product/ship-model-v1.0-proposal.md) | proposal v1.0 / сводная модель с происхождением каждого закона | Тепловой узел, энергошина ИБП, средства терморегуляции, каскады и режимы, коридор и прочность, сигнатуры и обнаружение, полёт, классы и поколения, инварианты, дискретизация, константы |
| [ТЗ: Лаба как стенд настройки](product/lab-tuning-tz-v0.1.md) | proposal v0.1 / Л1–Л10 | Матрица прогонов и метрики, перебор параметров с инвариантами, собственные сенсоры и «дуэль», режимы и прочность, классы и поколения как физика, редактор слотов, среда, проверочные векторы, гигиена данных |
| [Передача творческой сессии ГД](reviews/2026-10-09-gd-session-handoff.md) | handoff / 2026-10-09 | Для следующего ведущего (GPT) и оператора: принятые решения, отклонённые варианты, открытые вопросы (слоты, порог тихого хода, пределы классов и поколений, термоинвертор), ошибки ГД |
| [ГД-ревью: энергия, тепло, IR и EM модулей](reviews/2026-10-09-gd-energy-heat-em-review.md) | review report / 2026-10-09 | Баланс энергии сходится (~10⁻¹⁵); термоинвертор подтверждён оператором как дефект; сбой часов сигнатур у Каравана 2/3; буфер и насос активного радиатора без потребности; κ EM — калибровка баланса; три Титана D/H/E |
| [Термоинвертор: тепловой насос радиаторного контура](product/thermoinverter-heat-pump-v0.1.md) | accepted v0.4 / Р1–Р4 решены оператором; карта выгодности с насосом | Без своей площади и фиксированных 800 K: регулятор выбирает минимальную T_rad, простой без потребности, примеры с балансом энергии |
| [ТЗ: правки энергии, охлаждения и EM](product/energy-cooling-em-fixes-tz-v1.0.md) | accepted v1.10 / ТЗ для PM; поставки П0–П5 (П4а/П4б); Г1–Г8 приняты, Г9–Г10 обсуждаются | EM по ступеням и классам («всё, что вращается, шумит»), пороги EM-сенсоров ×2,027·10⁻⁵; каскад от T_weak; активный радиатор по потоку; буфер без защиты; пределы Civilian по ярусам; солнце в тепло; сбой часов Каравана; карточки; аккумулятор отложен |
| [Температурные зоны космоса](product/space-thermal-zones-v0.1.md) | accepted v1.1 / поставки П4а и П4б ТЗ | Стандарт 250 K; холодные и горячие поля (теплообмен со средой); каскад прогрева; печи электрическая, дизельная, водородная; буфер в двух режимах; IR-пороги ×0,9146; пассивные радиаторы не убираются |
| [Адверсальная проверка ТЗ v1.3](reviews/2026-10-09-tz-adversarial-review.md) | review report / 4 аспекта | Физика, архитектура, геймдизайн, продюсер: 4 блокера исправлены (термоинвертор от генератора греет корабль, горячая среда, таблица EM, версии); решения оператора В1–В5 |
| [Слоты, пределы классов и термоинвертор](product/slots-classes-thermoinverter-proposal-v0.1.md) | superseded v0.2 → [предложения v2](product/gd-proposals-v2-2026-10-10.md); раздел слотов отклонён оператором | Семь категорий слотов вместо «Контроля сигнатур», 5-й слот двигателей для гиродинов и паруса; пределы «класс × ярус × поколение» с корпусом; термоинвертор — спасать слотами и поколениями |
| [Вторая адверсальная проверка ТЗ v1.8](reviews/2026-10-09-tz-adversarial-review-r2.md) | review report / 4 аспекта | Пересчёт: холод с генератором (мёрзнут электрокорабли), карта термоинвертора с насосом, EM маскировки при 200 кВт; порядок расчёта, перенос в U2; предложения Г1–Г10 (Г10 — слоты) |
| [Профили охлаждения и пределы по классам](product/thermal-control-cascade-civilian-v0.1.md) | accepted v1.4 / следующий этап — корабли военных и стелс | Эффективный у всех; Боевой у военных, Маскировка у стелс (два режима); сдвиги Industrial/Sport/Military/Stealth; предел контура по классам |
| [Данные исследования энергии и сигнатур](research/2026-10-09-gd-energy-em/README.md) | research evidence | Таблицы IR/EM по модулям S/M и 13 кораблям в рейсе, скрипты опытов |
| [Анализ и сравнение UI4.8](plans/2026-10-09-gd-analysis-ui4.8.md) | accepted WHAT / HOW proposed; independent Plan Review pending | ulab-7lp, UI48-01–06: время над графиками, IR/EM и дальности A/B, читаемые отличия и компактный паспорт; текущий live UI4.7 остаётся до поставки |
| [Стенд сигнатур: работа и handoff](guides/signatures-observer.md) | implemented / численная модель прошла scoped QA/Review; UI4.7 final candidate | UI4.7: 100 равных bins, текущий endpoint; EM под электричеством, IR под температурой, mean/min–max; три расчётные GD дальности без изменения earned contact; model/schema3, compatibility0.1→0.2/weighted CSV; final QA/Review pending, server parity NOT RUN |
| [Равномерная история сигнатур](plans/2026-10-09-signature-history-100.md) | PLAN_READY / implemented candidate; final acceptance pending | ulab-i4g: 100 равных интервалов, live IR/EM, compatibility0.1→0.2, H01–06; intermediate LAN UI4.7, финальная поставка отдельно |
| [План развития Лабы v1.0](plans/2026-10-07-lab-development-v1.0.md) | active / roadmap | Серверная спецификация и параметры: архитектурные границы, сигнатуры/сенсоры, износ, перевозки, поля, роли и размеры; эргономика и эталонные опыты |
| [Спринт S1: сигнатуры и сенсоры](plans/2026-10-07-signatures-sensors-sprint-v1.0.md) | accepted / v1.6, first bench scoped acceptance passed | Вход0.7 получил affected PLAN_READY; runtime, full QA и scoped closure выполнены; будущие расширения отдельно |
| [Первый стенд: входной пакет](product/signatures-observer-v0.1.md) | accepted / temporary Lab experiment; implemented | Preset S/M sensors/radar; фактические тепловые источники, сумма контрастов и порог сенсора; базовый H₂-сброс не даёт отрицательный IR-контраст; далее баланс H₂ Stealth, силуэты, короткий пассивный импульс и движение |
| [Задача ГД: IR выхлопа и H₂](handoffs/2026-10-07-ir-source-model-gd.md) | resolved for temporary Lab experiment / implemented | PG-SS-IR, Beads ulab-5vs.7; решение оператора по двигателям, генератору и H₂-сбросу зафиксировано в product owner |
| [Температурное правило H₂-охладителя](product/h2-cooler-temperature-law-v0.1.md) | accepted / temporary Lab experiment; Stealth boundaries accepted for later stage | Удельный унос от разницы температур и энергетический баланс; для будущего Stealth приняты цель IR, стартовый порог, эталон сравнения и закон расхода от относительного предела температуры газа; численное ΔT открыто, газовый IR-контраст считается относительно фона |
| [Теплообмен корабля с ангаром](product/station-hangar-thermal-exchange-v0.1.md) | accepted game-design rule / future station server | Все станции: 300 K и 10 кВт/К штатного ангарного теплообмена; корпус хранит температуру при переоснащении, стоянка/офлайн считаются по времени; в 10-секундный сервис Лабы не включено |
| [Каталог 0.2.5: средние сборки](product/ship-fitting-catalog-0.2.5.md) | accepted / implementation authorized | Волна H/builtin cryotank, Мир D/E, Ермак/Титан D/H/E, M 2 lasers + bulk192; old .0–.4 unchanged |
| [План каталога 0.2.5](plans/2026-10-07-fitting-catalog-0.2.5.md) | proposed / awaiting Plan Review | ulab-jc1, MD01–07, scoped PRODUCT |
| [Каталог0.2.4 и базовые корабли](product/ship-fitting-catalog-0.2.4.md) | accepted / implementation authorized | JSON оператора, имена, Мир, V_FA, свежие ×2 условия; старые опыты сохраняются |
| [План каталога0.2.4](plans/2026-10-07-fitting-catalog-0.2.4.md) | proposed / awaiting Plan Review | ulab-9kh, CD01–08, один Developer, scope отдельно от открытого UI closure |
| [Продуктовый контракт](product/power-heat-lab-v0.1.md) | accepted scope / structured contract | WHAT из решений оператора |
| [Источники и границы authority](architecture/source-authority.md) | current | Current owners U2, versions, unresolved formula boundary |
| [План запуска](plans/2026-10-05-u2-lab-launch.md) | PLAN_READY / B0 blocked | HOW лаборатории и зависимости |
| [План установки OverGate](plans/2026-10-05-overgate-bootstrap.md) | installed / final acceptance open | Trusted bootstrap, inventory, QA, rollback |
| [Verification Contract: bootstrap](verification/bootstrap-contract.md) | proposed | Приёмка установки |
| [Verification Contract: лаборатория](verification/power-heat-v0.1-contract.md) | reviewed | Приёмка первой версии |
| [Source inventory](architecture/u2-source-inventory.json) | pinned metadata | SHA/blob/versions U2, без копирования полного GDD |
| [Адверсальное review, round1](reviews/2026-10-05-plan-review-round-1.md) | CHANGES_REQUIRED / history | Четыре blockers и контрпримеры |
| [Affected review, round2](reviews/2026-10-05-plan-review-round-2.md) | PLAN_READY | Все blockers закрыты; scoped binding |
| [Install inventory](verification/overgate-install-plan.json) | exact / applied | Frozen source,67operations, before/after hashes |
| [Независимое ревью установки](reviews/2026-10-05-install-plan-review.md) | PLAN_READY / history | Binding inventory до apply, без runtime acceptance |
| [Bootstrap checks](verification/bootstrap-evidence.md) | installed / acceptance open | Фактические результаты и ограничения |
| [Независимое bootstrap QA](reviews/2026-10-05-bootstrap-qa.md) | overall FAIL / available checks PASS | Реальный B6 auth failure, native/restore NOT RUN |
| [Scoped Code Review](reviews/2026-10-05-bootstrap-code-review.md) | CHANGES_REQUESTED / code PASS | Один acceptance blocker B6, без новых code defects |
| [Canonical metadata binding](reviews/2026-10-05-bootstrap-binding.md) | affected snapshot | Binding после status/index landing; gates не отменяет |
| [Cloud execution amendment](plans/2026-10-05-cloud-execution.md) | independent PLAN_READY / cloud QA PASS / scoped APPROVED | Single operator writer, stacked preparation, C1–C6 |
| [Cloud Plan Review](reviews/2026-10-05-cloud-plan-review.md) | PLAN_READY | Scoped amendment; bootstrap acceptance не заменяет |
| [Operator bootstrap](guides/operator-bootstrap.md) | operator actions NOT RUN | Exact checkpoint import, external trusted first export, later trusted applier |
| [Cloud tooling provenance](verification/cloud-tooling-provenance.json) | pinned source / exact target blobs | Узкая ulab adaptation, managed inventory unchanged |

Утверждённые правила и параметры остаются в U2. Search result — candidate, не authority.

## Текущий приоритет — рабочий процесс ГД

- [Чистка карточек модулей](plans/2026-10-07-module-card-cleanup.md) — прямое поручение оператора: профильные ТТХ без чужих показателей и итогов сборки; служебные подробности под «i», MC01–05; небольшая UI-задача, расчёт неизменен.
- [Plan Review чистки карточек](reviews/2026-10-07-module-card-cleanup-plan-review.md) — PLAN_READY/0BLOCKER/0ADVISORY; MC01–05,6 UI owners.
- [Developer](reviews/2026-10-07-module-card-cleanup-developer.md) и [исправление i](reviews/2026-10-07-module-card-cleanup-developer-fix-r1.md) —85fee8c, общий scoped ID lookup; guard489unit/51browser+1SKIP/26cloud PASS, численные52owners неизменны.
- [Первичная QA](reviews/2026-10-07-module-card-cleanup-qa-r1.md) — исторический FAIL: MC-UI-B1, colon-ID ломал render/Close.
- [Affected QA](reviews/2026-10-07-module-card-cleanup-qa-affected-r1.md) — PASS/MC-UI-B1 CLOSED;8 native cycles1440/touch390/errors0, exact fit bytes/revision; остальное покрытие перенесено по неизменности, не полный повтор.
- [Code Review r1](reviews/2026-10-07-module-card-cleanup-code-review-r1.md) — CHANGES_REQUESTED/CR-MC-B1: пустой ID существующего ring/table invoker; отдельное минимальное исправление, не повтор colon-ID QA.
- [Developer idless fix](reviews/2026-10-07-module-card-cleanup-developer-idless-fix.md) и [QA5](reviews/2026-10-07-module-card-cleanup-qa-idless-fix.md) —721e815/CR-MC-B1 CLOSED по QA,6idless+2named cycles/errors0, прежние bytes. Verifierbudget5/5, финальная scoped closure требует явного +1 оператора.
- Исторический UI721e815 preview4196:17exactassets, Start1.7s/Pause/iClose/errors0; физика тогда неизменна. Текущая поставка охлаждения ниже сохраняет эти UI blobs, отдельная финальная UI closure по budget остаётся открыта.

- [Пони: один слот контроля сигнатур](plans/2026-10-06-pony-signature-slot.md) — принятое изменение баланса, план/VC P01–P05; новый каталог0.2.2, исторические0.2.0/0.2.1 сохраняются.
- [Pony Plan Review](reviews/2026-10-06-pony-signature-slot-plan-review.md), [Developer](reviews/2026-10-06-pony-signature-slot-developer.md), [QA](reviews/2026-10-06-pony-signature-slot-qa.md), [Review1](reviews/2026-10-06-pony-slot-code-review-r1.md) — history: known resolved ghost buffer B1.
- [Pony B1 fix](reviews/2026-10-06-pony-signature-slot-developer-fix-r1.md), [affected QA](reviews/2026-10-06-pony-signature-slot-qa-affected-r1.md), [scoped Review2](reviews/2026-10-06-pony-slot-code-review-r2.md) — local PASS/APPROVED bbe3fc; old numeric snapshots unchanged; live4188. Не M/mission acceptance.

- [Задание v2.2: событийная добыча и рейс](product/ship-fitting-v2.2-mission-brief.md) — accepted v0.3; основной рейс до полного трюма реализован в локальном кандидате4189. Лабораторные опоры явно подписаны; QA PASS и scoped review APPROVED в local scope d57; rootguard перед commit, base/native/main отдельно открыты.
- [M-модули и гибридные сборки](product/ship-fitting-medium-modules.md) — MF01–04/HY01–02, независимый PLAN_READY;50 SKU доступны в исправленном черновике4189 (d57); независимая QA PASS и scoped review APPROVED local scope; rootguard перед commit, base/main отдельно открыты.
- [План рейса и M-поставки](plans/2026-10-06-mission-medium-delivery.md) — PRODUCT HOW/VC v1.2 M01–09 + medium contract, PLAN_READY; DEV_RELEASE одному исполнителю.
- [Plan Review M/HY](reviews/2026-10-06-medium-hybrid-plan-review.md) — READY0BLOCKER/0ADVISORY; exact whole contract e6088c0a… .
- [Plan Review рейса/M integration](reviews/2026-10-06-mission-medium-plan-review.md) — PLAN_READY0B/0A; M09 fixture B1 закрыт v1.2, три whole contracts/24owner paths, fingerprint fef78c6c… .
- [Developer: восстановление и повтор рейсов](reviews/2026-10-06-mission-medium-developer-fix-r1.md) — ec259, 427unit/46browser+1SKIP; operator FAIL исправлен и независимо проверен; immutable история первого fix; последующее закрытие B1/B2 ниже.
- [Независимая QA рейса/M/HY](reviews/2026-10-06-mission-medium-qa.md), [15 AC](reviews/2026-10-06-mission-medium-qa-case-ledger.json), [source binding](reviews/2026-10-06-mission-medium-qa-source-binding.json), [evidence manifest](reviews/2026-10-06-mission-medium-qa-evidence.json) — PASS в адресованном local PRODUCT scope ec259; две сквозные LAN цепочки и реальные часовые рейсы. Исторический PASS; последующее affected закрытие ниже, native/base/main gates отдельно.
- [Code Review рейса/M/HY r1](reviews/2026-10-06-mission-medium-code-review-r1.md), [52-path binding](reviews/2026-10-06-mission-medium-code-review-r1-reviewed-paths.json) — CHANGES_REQUESTED: CR-MISSION-B1 renewable recovery и CR-MISSION-B2 zero-time repeat,2BLOCKER/0ADVISORY; один Developer fix, affected QA/scoped re-review. Immutable CHANGES_REQUESTED history; B1/B2 CLOSED scoped r2 ниже.
- [Developer fix-r2](reviews/2026-10-06-mission-medium-developer-fix-r2.md) — d57ad5bc, только mission owner +20 durable tests;447unit/46browser+1SKIP PASS. Immutable d57 LIVE4189: affectedQA5PASS, scopedReview2APPROVED;20 tests добавлены.

- [Affected QA B1/B2](reviews/2026-10-06-mission-medium-qa-affected-r2.md), [source binding](reviews/2026-10-06-mission-medium-qa-affected-r2-source-binding.json), [case ledger](reviews/2026-10-06-mission-medium-qa-affected-r2-case-ledger.json), [evidence](reviews/2026-10-06-mission-medium-qa-affected-r2-evidence.json) —5 адресованных PASS/0productFAIL на d57; один Sputnik H3600/3service/90SCU, один LANtouch390 Worker workflow. Не повторный QA15.

- [Scoped Code Review r2](reviews/2026-10-06-mission-medium-code-review-r2.md), [2 delta/51 carryover binding](reviews/2026-10-06-mission-medium-code-review-r2-reviewed-paths.json) — APPROVED, CR-MISSION-B1/B2 CLOSED,0BLOCKER/0ADVISORY; source d57, fullguard/base/main отдельно.
- [Следующее дополнение: «Заправлять и заряжать»](plans/2026-10-06-station-service.md) — прямое поручение оператора, PLAN_READY HOW/AC ST01–06; stationcharge локально поставлена на4189/86; отдельнаяQA иscopedclosure ниже.

- [Plan Review станции](reviews/2026-10-06-station-service-plan-review.md), [binding](reviews/2026-10-06-station-service-plan-review-binding.json) — PLAN_READY0BLOCKER/1ADVISORY; noBatterycontrol остаётсяsynthetic/refusal, не новоеvalidmission разрешение.

- [Developer станции](reviews/2026-10-06-station-service-developer.md) — a625c79c,455unit/47browser+1SKIP PASS; галочка и station GJ реализованы; historical QA ST01–06 PASS, Review1B требует IO fix; последующийfix86 LIVE4189; initialreport preserved.


- [QA станции ST01–06](reviews/station-service-qa/execution-r1/report.md), [binding](reviews/station-service-qa/execution-r1/source-binding.json) — PASS методов59API/16native наa625; независимый Review выявил неохваченный OFF/fuel import ниже.
- [Code Review станции r1](reviews/2026-10-06-station-service-code-review-r1.md), [binding](reviews/2026-10-06-station-service-code-review-r1-binding.json) — CHANGES_REQUESTED1BLOCKER/0ADVISORY: CR-ST-B1, positivefuel при explicitOFF; history; CLOSED вaffectedQA/scopedclosure ниже.

- [Developer station fix](reviews/2026-10-06-station-service-developer-fix-r1.md) —86dee5d: oneIOguard/twoisolatedtests,457unit47browser+SKIPPASS; oldabsence preserved.
- [Affected QA station B1](reviews/station-service-qa/affected-b1/execution-r1/report.md), [binding](reviews/station-service-qa/affected-b1/execution-r1/source-binding.json) — B1-01–04PASS13API/7native import-only; обаspecies/atomicA/ON/OFF/absence.
- [Scoped Review station r2](reviews/2026-10-06-station-service-code-review-r2.md), [binding](reviews/2026-10-06-station-service-code-review-r2-binding.json) — APPROVED0BLOCKER0ADVISORY; CR-ST-B1 CLOSED; exact86 LIVE4189, rootnormalguard передfinalcommit/PR9.

Оператор отклонил UX v3 и поручил адверсальное ревью GD, UX/UI и пользовательских
сценариев. Claude Design теперь рассматривается как ассеты и предложение макета.
Прежние технические QA/review не являются пользовательской приёмкой удобства.

- [Рабочий процесс и критерии v4](product/ship-fitting-gd-workspace-v4.md) — accepted0.7/WF01–15, компактные ТТХ/кнопка i, начальный Close, семейства по слоту, одно меню сортировки и результат в нижней панели; интерфейс v4.1.
- [Компактная адаптивная вёрстка v4.3](plans/2026-10-07-responsive-compact-v4.3.md) — поручение оператора, измеренный mobile baseline, ограниченный план/RC01–07 для Pad/S25/Fold обоих экранов и ориентаций; independent Plan Review pending, runtime пока ca0/v4.2.
- [Инвентаризация v1/v2/v3](research/2026-10-06-ui-capability-inventory.md) — 22 рабочих сценария, сохранённые/потерянные/скрытые возможности и source anchors; read-only Developer, не runtime QA.
- [План восстановления v4](plans/2026-10-06-gd-workspace-v4.md) и [сценарная приёмка](verification/gd-workspace-v4-contract.md) — frozenf52 sources; signed PLAN_READY ниже; initial candidate17bb6b6 сохранён; текущий runtime15f5d90e LIVE4188 с каталогом0.2.1 и исправлением условий неполных сборок; история ниже.
- [Независимый Plan Review v4](reviews/2026-10-06-gd-workspace-v4-plan-review.md) — PLAN_READY,0BLOCKER/1ADVISORY; три exact docs+wholeVC fingerprint19d33e57… . Один Developer, один Worker, сохранённые стенды.
- [Developer v4](reviews/2026-10-06-gd-workspace-v4-developer.md) — DONE_WITH_CONCERNS/IDLE,21paths/17bb6b6,231unit/33browserPASS+1SKIP; immutable standalone4188, numerical source85+2 unchanged, compiled4/6 exact. Physical latency/gesture отдельно NOTRUN.
- [Developer: исправление slot identity](reviews/2026-10-06-gd-workspace-v4-developer-fix-r1.md) — ff8f3e8, стабильные DOM targets при RUNNING,231unit/35browserPASS+1SKIP; отдельный immutable candidate4188.
- [QA1 v4](reviews/2026-10-06-gd-workspace-v4-qa-r1.md), [семь адресов](verification/2026-10-06-gd-workspace-v4-qa-cases-r1.md), [sealed evidence](reviews/2026-10-06-gd-workspace-v4-qa-evidence-r1.json) — historical FAIL,6PASS/1FAIL, три representative whole chains;245raw files, один desktop pointer blocker. Closure — affected QA ниже.
- [Affected QA v4 slot fix](reviews/2026-10-06-gd-workspace-v4-qa-affected-fix-r1.md), [sealed evidence](reviews/2026-10-06-gd-workspace-v4-qa-affected-fix-r1-evidence.json) — PASS, V4-B1 CLOSED,4affected risk rows1440/820/LAN390;60new rawfiles, без full7/H3600 replay.
- [Каталог0.2.1: принятое уточнение](product/ship-fitting-catalog-0.2.1.md) и [план/C01–08](plans/2026-10-06-fitting-catalog-0.2.1.md) — прямое поручение оператора: Industrial diesel M и штатные lasers размера/класса; PLAN_READY; реализовано15f5d90e, C01–08 и affected QA PASS. Сохранённые0.2.0 объекты не переоснащаются автоматически.
- [Plan Review catalog0.2.1](reviews/2026-10-06-fitting-catalog-0.2.1-plan-review.md) — PLAN_READY0BLOCKER/1ADVISORY, exact whole WHAT+HOW/C01–08; combined Review r1 и closure ниже.
- [Developer каталога0.2.1](reviews/2026-10-06-fitting-catalog-0.2.1-developer.md), [evidence](reviews/2026-10-06-fitting-catalog-0.2.1-developer-evidence.json) — source131570d8,45SKU/совместимость/defaults, обязательные проверки PASS.
- [Независимая QA C01–08](reviews/2026-10-06-fitting-catalog-0.2.1-qa-r1.md), [evidence](reviews/2026-10-06-fitting-catalog-0.2.1-qa-evidence-r1.json) — PASS131570d8, две LAN-цепочки1440/touch390, fresh opens/limiter/ownership;189rawfiles — доказательства, не189tests.
- [Combined Code Review r1](reviews/2026-10-06-gd-v4-catalog-code-review-r1.md), [39-path binding](reviews/2026-10-06-gd-v4-catalog-code-review-r1-reviewed-paths.json) — historical CHANGES_REQUESTED, один CR-V4-B1 в редактировании условий неполного черновика.
- [Developer: CR-V4-B1](reviews/2026-10-06-fitting-catalog-0.2.1-developer-fix-r1.md), [evidence](reviews/2026-10-06-fitting-catalog-0.2.1-developer-fix-r1-evidence.json) —15f5d90e, три owner/test paths;313unit/41browserPASS+1inheritedSKIP, actualfit/Start сохраняются.
- [Affected QA: CR-V4-B1](reviews/2026-10-06-fitting-catalog-0.2.1-qa-affected-r1.md), [evidence](reviews/2026-10-06-fitting-catalog-0.2.1-qa-affected-r1-evidence.json) — PASS, четыре risk rows, две LAN-цепочки1440/touch390;49rawfiles. Без повторной полной WF/C/long кампании.
- [Scoped Code Review r2](reviews/2026-10-06-gd-v4-catalog-code-review-r2.md), [evidence](reviews/2026-10-06-gd-v4-catalog-code-review-r2-evidence.json) — APPROVED15f5d90e, CR-V4-B1 CLOSED,0BLOCKER/0ADVISORY;3fixpaths/36unchangedcarryover.
- [Адверсальное ревью GD / UX/UI / пользователя](reviews/2026-10-06-gd-ux-user-adversarial-review.md) — NEEDS_REVISION, 12 групп проблем; факты, потери и новые предложения разделены.
- [Уточнение навигации во время расчёта](reviews/2026-10-06-gd-ux-user-adversarial-review-running-addendum.md) — отдельное неизменяемое приложение: RUNNING ×1 на desktop и LAN390; MAX и физический планшет не проверены.
- [Сценарная QA](reviews/2026-10-06-gd-workflow-qa.md) и [матрица 24 адресов](verification/2026-10-06-gd-workflow-cases.md) — GD/UX FAIL; шесть сквозных цепочек исполнены и два RUNNING-среза; не 24 новых полных теста.
- [Манифест QA evidence](reviews/2026-10-06-gd-workflow-evidence.json) — hashes 141 локального файла доказательств, не количество тестов.

## Power & Heat runtime v0.1

- [LAN / standalone запуск](user/local-network.md)
- [Первичная матрица](experiments/first-matrix.md)
- [Actual short matrix](experiments/first-matrix-results.json)
- [Retained64channels](verification/runtime-retention.json)
- [Worker/browser latency](verification/runtime-browser.json)
- [Фактический12h kernel](verification/runtime-long-kernel.json)
- [Проверка прежнего preview0.1](verification/standalone-preview.json) — history
- [Проверка standalone0.1.1 / non-local HTTP](verification/lan-http-preview.json)
- [Отчёт и передача агенту на Mac](handoffs/2026-10-05-mac-lan-http.md)

## Проверка реализации

| Документ | Статус | Область |
|---|---|---|
| [Исходная продуктовая QA](reviews/2026-10-05-product-qa.md) | FAIL / history | Семь воспроизводимых исходных ошибок |
| [Повторная QA](reviews/2026-10-05-product-qa-affected.md) | PASS affected surface / history | Закрыты семь ошибок и соседняя проверка gate бака |
| [Исходное Code Review](reviews/2026-10-05-product-code-review.md) | CHANGES_REQUESTED / history | Три отдельных blockers |
| [QA исправлений ревью](reviews/2026-10-05-product-review-fix-qa.md) | PASS affected surface / history | Численные/DOM/long/retention проверки предыдущего candidate |
| [Повторное scoped Code Review](reviews/2026-10-05-product-code-review-affected.md) | APPROVED / history | Четыре предыдущих code/test paths и exact QA evidence |
| [QA метаданных предыдущего candidate](reviews/2026-10-05-product-metadata-qa.md) | PASS / history | Документы candidate820, без нового runtime запуска |
| [Проверка внутреннего пика](reviews/2026-10-05-product-peak-qa.md) | FAIL / history | QB1/P13: пик внутри base-dt терялся в метрике |
| [QA исправления пика](reviews/2026-10-05-product-peak-qa-affected.md) | PASS affected QB1/P13 | Три dt,40 tests и необходимые численные/replay проверки |
| [Scoped review исправления пика](reviews/2026-10-05-product-peak-code-review.md) | APPROVED / 0 blockers,0 advisories | Пять code/test paths, entire VC и exact QA hash |
| [Итоговая привязка метаданных](reviews/2026-10-05-product-final-binding.md) | PM SELF-CHECK | Не новый verifier и не full acceptance |
| [LAN HTTP baseline QA](reviews/2026-10-05-lan-http-qa.md) | FAIL / history | secure=false / randomUUID unavailable, Start/Reset/Step падали до Worker |
| [LAN HTTP affected QA](reviews/2026-10-05-lan-http-qa-affected.md) | PASS affected P1/P10 | Start/reset/new M/step, ID и stale-message cases; фактический Xiaomi NOT RUN |
| [LAN HTTP scoped Code Review](reviews/2026-10-05-lan-http-code-review.md) | APPROVED / 0 blockers | Opaque IDs, HTTP API gate, regression и exact QA evidence |
| [LAN HTTP итоговая привязка](reviews/2026-10-05-lan-http-final-binding.md) | PM SELF-CHECK | Metadata landing; не новый verifier/full acceptance |
| [Cloud QA](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-qa.md) | C1–C6 PASS | В bootstrap base, не full acceptance |
| [Cloud Code Review](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-code-review.md) | scoped APPROVED | В bootstrap base, B0/B6/B8 остаются открытыми |

Предыдущий runtime0.1.1 подготовлен для локальных экспериментов.56unit и6browser checks PASS,
1screenshot-only case SKIP; type/build PASS. Exact source CI37272666370/37272662118 SUCCESS.
LAN HTTP affected QA/scoped review закрыли отсутствие randomUUID вне secure context;
контекст браузера secure=false воспроизведён собственными assets, физический Xiaomi NOT RUN.
Предшествующий physical12h132.595s сохранён для неизменных model/kernel/Worker paths;
новый локальный12h ради UI fix не запускался. QB1/P13 closure сохранён. S/M не утверждают U2 SKU.
Физическое второе LAN устройство,native hooks,operator export/restore,trusted finalize
и merge остаются открытыми. Beads notes — PENDING,canonical9 задач неизменны.

## U2 Ship Fitting v0.2 — дизайн

- [GDD: оснастка и полезность корабля](gdd/gdd_u2_ship_fitting_v0.2.md) — принят оператором2026-10-05; runtime implementation started.
- [Исследование current owners и UX](research/ship_fitting_source_synthesis.md) — routed41-source synthesis.
- [Source manifest](research/ship_fitting_sources.json) — exact U2commit/blob/status/version.
- [План реализации](plans/2026-10-05-ship-fitting-v0.2.md) — T1–T7, independent PLAN_READY; PO approval recorded; T1–T7 execution started.
- [Verification Contract SF01–20](verification/ship-fitting-v0.2-contract.md) — numerical/domain/UI/replay/retention AC и review scope.
- [Первоначальный proposal](product/ship-fitting-v0.2-proposal.md) — historical reference, superseded.

- [Независимый design/plan review r1](reviews/2026-10-05-ship-fitting-plan-review-r1.md) — CHANGES_REQUIRED/history; B1 group accounting и B2 metric history закрыты affected r2.

- [Affected design/plan review r2](reviews/2026-10-05-ship-fitting-plan-review-r2.md) — PLAN_READY для обеих частей; active BLOCKER0, A1/A2 advisory сохранены.
- [Итоговая привязка design evidence](reviews/2026-10-05-ship-fitting-final-binding.md) — PM deterministic check, не runtime QA.
- [Draft PR3](https://github.com/komleff/u2-lab/pull/3) — scoped docs/design/plan, PO approval recorded; plan evidence preserved.

- [Принятие дизайна и запуск реализации](product/ship-fitting-v0.2-acceptance.md) — current operator authority поверх frozen GDD/плана.
- [ТЗ UX/UI для Claude Design](ux/ship-fitting-v0.2-claude-design-brief.md) — самодостаточный brief для HTML/SVG desktop/mobile макетов.

## Ship Fitting0.2.0 — история candidate до interval closure

- [Работа с оснасткой и экспортом](user/ship-fitting.md) — функциональный workflow и границы лаборатории.
- [Контролируемая серия Pony/IndustrialM1/2/3 и L3+hold](experiments/ship-fitting-matrix.json) — полные условия, численные snapshots и фактические незавершённые исходы.
- [Чувствительность и ограничивающие сценарии](experiments/ship-fitting-sensitivity.json) — экспериментальные крайние условия, не вероятности.

Исторический QA r2: 99 PASS / 1 external NOT RUN; Code Review r1 выявил CR-B1/CR-B2. Их окончательное закрытие — QA r4 / Review r3, зарегистрированные ниже. Public Pages, физическое второе
устройство, native/bootstrap/operator acceptance и merge остаются отдельными gates.

- [Power & Heat Lab — UX/UI ТЗ для Claude Design](ux/power-heat-lab-claude-design-brief.md).

- [QA r1](reviews/2026-10-05-ship-fitting-qa-r1.md) — immutable FAIL history.
- [Developer fix r1](reviews/2026-10-05-ship-fitting-developer-fix-r1.md) — cargo/architecture/ordinary SKU fixes.
- [QA r2](reviews/2026-10-06-ship-fitting-qa-r2.md) — 99 PASS / 1 external NOT RUN.
- [Code Review r1](reviews/2026-10-06-ship-fitting-code-review-r1.md) — CHANGES_REQUESTED: CR-B1/CR-B2.
- [Developer fix r2](reviews/2026-10-06-ship-fitting-developer-fix-r2.md) — input guards, boundary/atomic-import regression.
- [Runtime binding](verification/ship-fitting-v0.2-runtime-binding.json) — explicit paths and entire VC; no verdict.

## Ship Fitting — история interval fix до QA r4 / Review r3

- [2026-10-06-ship-fitting-qa-r3.md](reviews/2026-10-06-ship-fitting-qa-r3.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-code-review-r2.md](reviews/2026-10-06-ship-fitting-code-review-r2.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-developer-fix-r3.md](reviews/2026-10-06-ship-fitting-developer-fix-r3.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-developer-fix-r3-tablet-addendum.md](reviews/2026-10-06-ship-fitting-developer-fix-r3-tablet-addendum.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.

## Claude Design v2.1 — прежняя область переноса интерфейса

- [Передача Claude](ux/claude-design/README.md) и [обоснование v2.1](ux/claude-design/ship-fitting-power-heat-ux-v2.1.md) — exact PR5abbd2943 source; 22артборда, canvas/tokens.
- [Принятая UI-область и решения переноса](product/claude-design-ui-v0.2-acceptance.md) — поручение оператора; новые шахтёрские миссии/багфиксы отложены.
- [План интерфейса](plans/2026-10-06-claude-design-ui.md) — U1–U6; PLAN_READY; итог локальной QA/review зарегистрирован ниже.
- [Приёмка UI01–18](verification/claude-design-ui-v0.2-contract.md) — функции/данные/mobile/LAN и сохранение модели.

## Claude Design UI — проверка и локальный запуск

- [Независимый Plan Review: PLAN_READY](reviews/2026-10-06-claude-design-ui-plan-review-r1.md) — exact9aa, историческая связка плана,0blockers.
- [72 source-first QA cases](verification/claude-design-ui-v0.2-qa-cases.md) — методы приёмки UI01–18; подготовка не runtime verdict.
- [Локальный интерфейс и варианты](user/ship-fitting-ui.md) — текущее v4 на4188 и сохранённые4183/4186, сборки/снимок A.
- [Численный QA r4](reviews/2026-10-06-ship-fitting-qa-affected-r4.md) и [scoped Code Review r3](reviews/2026-10-06-ship-fitting-code-review-r3.md) — immutable закрытие прежних interval/source дефектов на903; UI туда не входит.

- [Scoped Code Review Contract](verification/claude-design-ui-code-review-contract.md) и [полный runtime/source binding](verification/claude-design-ui-runtime-binding.json) — affected UI scope, не verdict.

## Claude Design UI — история initial QA и промежуточных исправлений

- [Developer r1](reviews/2026-10-06-claude-design-ui-developer-r1.md) — исходный перенос на ab8353d; immutable history.
- [Независимая QA r1](reviews/2026-10-06-claude-design-ui-qa-execution-r1.md) — 54 PASS / 17 FAIL / 1 deferred NOT RUN, 11 групп UI-дефектов; исходный FAIL сохранён.
- [Sealed QA evidence manifest](reviews/2026-10-06-claude-design-ui-qa-r1-evidence.json) — hashes 52 файлов локальных доказательств.
- [Developer fix r1](reviews/2026-10-06-claude-design-ui-developer-fix-r1.md) — ff01dfa, D01–D11 исправлены; исторический guard 185 unit / 26 browser PASS + 1 inherited SKIP.
- Промежуточный стенд — 4183; прежний Ship Fitting и первая Лаба Legacy — 4186. Ссылки и сохранение вариантов в [руководстве](user/ship-fitting-ui.md).

## Claude Design UI — история D12 mobile error fix

- [Affected QA r2](reviews/2026-10-06-claude-design-ui-qa-affected-r2.md) — immutable FAIL: 39 PASS / 3 FAIL из 42 исходных ID; D01–D11 закрыты, один новый D12 на трёх адресах.
- [Sealed affected evidence](reviews/2026-10-06-claude-design-ui-qa-affected-r2-evidence.json) — hashes 55 read-only files.
- [Developer fix r2](reviews/2026-10-06-claude-design-ui-developer-fix-r2.md) — c8f8b36, один CSS-перенос длинной ошибки и true-mobile регрессия; 185 unit / 27 browser PASS + 1 inherited SKIP.
- Исторический D12 checkpoint: source c8f8b36. Итоговая сборка и closure — ниже; model/mission остаются за рамками.

## Claude Design UI — исправления первого Code Review

- [Targeted QA r3](reviews/2026-10-06-claude-design-ui-qa-affected-r3.md) — D12 CLOSED,4 собственных PASS; исходная72-case mapping71PASS/1deferred включает historical carryover, не71 новый прогон.
- [QA r3 evidence manifest](reviews/2026-10-06-claude-design-ui-qa-affected-r3-evidence.json) — 20 sealed files.
- [Первое scoped UI Code Review](reviews/2026-10-06-claude-design-ui-code-review-r1.md) — immutable CHANGES_REQUESTED: CR-UI-B1 длинный trace/RangeError и CR-UI-B2 wrong-run projection;2BLOCKER/0ADVISORY.
- [Developer fix r3](reviews/2026-10-06-claude-design-ui-developer-fix-r3.md) — final source30a1c9b,9UI/test paths;189unit/28browserPASS+1inheritedSKIP. Only final artifact candidate-fix-r3-final3 is current; BF/589/33f superseded snapshots сохранены.
- Итоговая [сборка4183](http://192.168.68.65:4183/?v=claude-ui-30a1c9b): affected QA r4 и scoped re-review r2 — ниже.

## Claude Design UI — итоговая локальная QA и scoped closure

- [Targeted QA r4](reviews/2026-10-06-claude-design-ui-qa-affected-r4.md) — scoped PASS: CR-UI-B1/B2 и linked D12 CLOSED; 10 адресованных affected slices с явно указанными historical portions, не новый полный 72-case прогон.
- [QA r4 evidence manifest](reviews/2026-10-06-claude-design-ui-qa-affected-r4-evidence.json) — 27 новых sealed evidence files; 127 прежних seals сохранены.
- [Scoped Code Review r2](reviews/2026-10-06-claude-design-ui-code-review-r2.md) — APPROVED, 0 BLOCKER / 0 ADVISORY; 9 изменённых UI/test paths, 19 прежних paths перенесены по actual byte equality.
- [Новый локальный UI](http://192.168.68.65:4183/?v=claude-ui-30a1c9b), [прежний Ship Fitting](http://192.168.68.65:4186/) и [Legacy Power & Heat](http://192.168.68.65:4186/?mode=legacy) доступны параллельно.
- Численное ядро сохранено; full mining mission/refuel и UI13-02 attribution deferred. Physical/native/public/base/main gates остаются отдельными, PR #6 Draft.

- [Самоаудит PM по сигналу оператора](reviews/2026-10-06-pm-self-audit.md) — ошибки организации, сокращение Memory Bank и правило повторения после каждых3 review/QA+триаж/фикс итераций; не новый verifier launch.

## Температурная диагностика 2026-10-07

- [Принятое WHAT](product/thermal-derating-diagnostics.md) — ADR-0068 U2, одно hot/cold правило плюс wear; Lab wear не рассчитывает.
- [План и TD01–06](plans/2026-10-07-thermal-diagnostics.md) — PLAN_READY, PRODUCT; независимые QA и scoped Review после реализации.
- [Plan Review](reviews/2026-10-07-thermal-diagnostics-plan-review.md) и [fixture addendum](reviews/2026-10-07-thermal-diagnostics-plan-review-fixture-addendum.md) — sealed, PLAN_READY; опубликованы в PR10.
- [Контракт scoped Review](reviews/2026-10-07-thermal-diagnostics-review-contract.md) — наблюдение, график, экспорты и принятый U2 canon; физика/TTX/wear runtime вне scope.
- [Самоаудит PM](reviews/2026-10-07-pm-self-audit.md) — возвращение к результату и повтор после каждых3 итераций.
- [Первичная QA](reviews/2026-10-07-thermal-diagnostics-qa.md) — sealed FAIL history на ecf: TD05 наложение подписей; остальные5TD PASS. Закрытие класса — QA48f ниже.
- [Affected QA c10](reviews/2026-10-07-thermal-diagnostics-qa-label-fix.md) — sealed FAIL history: обычные подписи исправлены, empty-axis fallback ещё обрезался. Исходный отчёт сохранён.
- [Affected QA48f](reviews/2026-10-07-thermal-diagnostics-qa-axis-fix.md) — PASS/TD05-B1 CLOSED:18 styled samples и2 native LAN starts; остальные5TD наследовались по неизменности кода. Code Review затем выявил Legacy transition regression ниже.
- [Code Review48f](reviews/2026-10-07-thermal-diagnostics-code-review.md) — сохранённый CHANGES_REQUESTED/1BLOCKER/0ADVISORY: CR-TD-B1, Legacy Active laser теряет реальное thermal-stop/restart событие. Оператор предоставил ещё5 проверок после самоаудита PM_ERR/DOC_PR; общий предел10.
- [Developer Legacy fix a6](reviews/2026-10-07-thermal-diagnostics-legacy-fix.md) — детерминированный FIX VERIFICATION/489unit/49browser+1SKIP/26cloud PASS; exact ID/stop/restart и aggregate-not-hardware. Независимое закрытие подтверждено последующими QA6 и Review7.
- [Affected QA a6](reviews/2026-10-07-thermal-diagnostics-qa-legacy-fix.md) — sealed PASS/CR-TD-B1 CLOSED:5 affected risk rows,26API+7native assertions, один настоящий Legacy Worker запуск/пауза/продолжение/JSON/CSV; прежняя матрица не повторялась.
- [Scoped Review a6](reviews/2026-10-07-thermal-diagnostics-code-review-legacy-fix.md) — sealed APPROVED/CR-TD-B1 CLOSED/0BLOCKER/0ADVISORY; два изменённых файла и необходимые callers, без новой полной кампании. Budget7/10, reserve3; самоаудит повторён при3/3.
- [Предыдущий thermal-стенд](https://komleff.github.io/u2-lab/thermal-v0.1/) — exact a6,17public assets/Start/Pause/bands/errors0 PASS; [первая Lab](https://komleff.github.io/u2-lab/legacy-v1/) сохранена и проверена. Публикация не означает merge Draft PR.
- Историческая LAN-проверка thermala6 на4196: HTTP17assets и Start/advance/Pause PASS; порт теперь обслуживает текущую cooling-поставку ниже. Прежняя [station86, порт4189](http://192.168.68.65:4189/?v=station-86dee5d) сохранена.

## Автоматическое охлаждение — CC01–05

- [План H₂/Active](plans/2026-10-07-cooling-control.md) — direct operator WHAT и existing Efficient Auto; PRODUCT; выполнены Developer и QA2, один blocker журнала закрыт QA4 и Review5; local acceptance PASS/APPROVED.
- [Plan Review](reviews/2026-10-07-cooling-control-plan-review.md) — PLAN_READY/0BLOCKER/0ADVISORY, whole HOW; budget1/5.
- [Current source authority](architecture/source-authority.md#автоматика-охлаждения-уточнение-2026-10-07) — U2 palette0.4/PR843, floor именно H₂, signed hull/Passive сохранён.

- [Developer a3](reviews/2026-10-07-cooling-control-developer.md) — исходный физический фикс и normal guard514unit/54browser+SKIP/26cloud; default Pony3600 и H₂-OFF контроль.
- [Независимая QA2](reviews/2026-10-07-cooling-control-qa.md) — PASS CC01–05: S/M ledger/transitions, actual default-hour pair, touch390/LAN, old/new export. Историческое evidence a3, numerical carryover по точным blobs.
- [Code Review3](reviews/2026-10-07-cooling-control-code-review-r1.md) — CHANGES_REQUESTED/1BLOCKER/0ADVISORY; CR-CC-B1: усреднённое управление ошибочно подписано мгновенным состоянием/фактическим открытием.
- [Developer FIX c9](reviews/2026-10-07-cooling-control-developer-fix.md) — весь класс H₂/Active: принятому интервалу соответствуют доли режимов и реальное питание, запрос не обещает открытие. RED6→GREEN48; guard520/54+SKIP/26,2delta/57unchangedsrc/wholecontracts exact; QA4 PASS/Review5 APPROVED ниже.

- [Affected QA4](reviews/2026-10-07-cooling-control-qa-interval-fix.md) — PASS/CR-CC-B1 CLOSED:4riskrows/12APIassertions и один bounded nativeLAN390 DOM proof; observer counts прежней QA2 не объявлены новыми.
- [Scoped Review5](reviews/2026-10-07-cooling-control-code-review-interval-fix.md) — APPROVED/0BLOCKER/0ADVISORY/CR-CC-B1 CLOSED;2delta/whole2/57protected exact, UI closure OUT. Budget5/5; PM audit3/3 ранее выполнен, counter2/3.
- [PM Final Acceptance](reviews/2026-10-07-cooling-control-final-acceptance.md) — local scope accepted; independent verdict/evidence, live delivery/limitations. PR12/PR843 остаются Draft, operator merge отдельно.
- [Текущий LAN4196](http://192.168.68.65:4196/?v=cooling-c9e09b2) — c9e09b2,17HTTPassets и actualStart1.5s/Pause/iClose/errors0 PASS. Старый4189 сохранён.

- [Публичная cooling-поставка](https://komleff.github.io/u2-lab/?v=cooling-c9e09b2) — exactc9/Pagesc13791a,17assets и actualStart/Pause/iClose/errors0 PASS; [архив thermal](https://komleff.github.io/u2-lab/thermal-v0.1/)17exact/Start/Pause и [первая Lab](https://komleff.github.io/u2-lab/legacy-v1/)4+root3 exact сохранены. Публикация не заменяет operator merge.


## Каталог: исправление начального фокуса

- [Accepted WHAT v0.4](product/ship-fitting-gd-workspace-v4.md#начальный-фокус-каталога-решение-оператора-2026-10-07) — direct operator MC03 clarification: начальный Close, поиск по намеренному нажатию/Tab, повторное открытие без автоклавиатуры.
- Один Developer fix-turn ulab-p2w, ветка fix/catalog-dialog-focus от4339eca2; никакого нового verifier budget. Старые QA/Review source bindings остаются историческими; formal UI closure после budget5/5 ждёт явного+1.
- [Самоаудит](reviews/2026-10-07-pm-self-audit.md#каталог-возврат-к-результату-после-qa4--review5--операторского-focus-fix-33) — минимальный путь, корректность genuine focusin trace и граница OS keyboard, counter0/3 после fix-turn.

## Каталог: семейства выбранного слота

- [Accepted WHAT v0.5](product/ship-fitting-gd-workspace-v4.md#семейства-каталога-по-слоту-решение-оператора-2026-10-07) — прямое уточнение MC03: семейства и «Все» ограничены категорией и разрешёнными семействами слота; поиск не меняет список семейств, объяснения отказов внутри семейства сохраняются.
- Продолжение ulab-p2w/PR13 в fix/catalog-dialog-focus, один прежний Developer; HOW0.1/PLAN_READY сохраняется. Без нового независимого verifier и без обхода budget5/5: formal closure+1 ожидает оператора. Никакой новой численной поверхности.

## Каталог: одно меню сортировки

- [Accepted WHAT v0.6](product/ship-fitting-gd-workspace-v4.md#один-элемент-сортировки-решение-оператора-2026-10-07) — удалить дублирующий ряд кнопок; оставить правое меню со всеми прежними сортировками и приоритетом совместимых кандидатов.
- Продолжение MC03/ulab-p2w/PR13, тот же Developer; HOW0.1 прежний. Только представление и удаление неиспользуемой привязки кнопок; новый независимый verifier не запускается, formal closure+1 после budget5/5 прежняя. Счётчик самоаудита после этого fix-turn2/3.
