---
title: "Автоматическое охлаждение: H₂ и активный радиатор"
status: active
version: "0.1"
date: 2026-10-07
---

# Цель и источник

Оператор2026-10-07 поручил проверить H₂ охладитель и активный радиатор:
не переохлаждать корабль самим охладителем; ниже300K отключать H₂;
закрывать активный радиатор, когда среда горячее корабля. PM ведёт поставку,
один Developer реализует. Beads ulab-6xr; отдельная PRODUCT задача, budget5:
Plan1 → DEV → QA2 → scopedReview3, reserve2.

Canon route: U2 docs/INDEX.md → active cooling palette0.3 §§4/7–10,
automatic scheduler0.2 §Active Cooling, ADR0043 v1.6 п.4/5/9/11;
U2 source775ea56309c5036cee091068123140014625874d. Efficient Auto уже требует
расхода только при необходимости. Радиативный поток знаковый: открытая
поверхность нагревается от более горячей среды. Точный floor300K и явное
автозакрытие — новое уточнение оператора, а не прежние численные ТТХ.
Теплоперенос корпуса/пассивной площади и назначение Thermoinverter сохраняются.

As-built: src/model/v2/physics.ts запрашивает coolingW при наличии H₂ без
нижнего floor/теплового спроса; auxW тоже остаётся нагрузкой. Активная площадь
добавляется при отрицательном радиативном градиенте. DiagnosticObserver
полагает cooling requested=true даже когда автоматика должна не запрашивать.
Это source hypothesis; Developer до исправления воспроизводит2 адресных RED
по ledger. Чистка карточек/PR11 не является исправлением этой физики.

# Граница принятого поведения

- Нормальная Efficient Auto следует тепловой потребности; не вентит H₂ при
  холодном корабле или когда обычный радиативный/буферный путь покрывает запрос.
  Рабочую потребность определяют существующие рабочие температурные границы
  установленного оборудования; новая нижняя safety граница300K не является
  приказом постоянно охлаждать до300K. Не вводить настройку Kelvin игроку.
- При T_ship≤300K нет host heat pickup, auxiliary operating draw и расхода
  H₂ именно охладителем. Генератор/двигатель могут независимо брать H₂ из
  общего бака. Выше floor — только нужный поток в пределах существующих
  capacity, thermal gate, питания и ресурса; без нового unlimited sink.
- Активный радиатор при T_env≥T_ship закрыт: deployed active area0,
  pump demand/heat0. При полезном градиенте вновь доступен согласно тем же
  thermal/power constraints. Hull и Passive signed exchange остаются; не
  подменять физику формулой max(0, весь поток). Thermoinverter отдельный.
- Через границы управление разрешается внутри физического шага; не обрезать
  готовую температуру без учёта энергии. Не создать zero-time/chattering loop.
- Журнал отличает «H₂ охлаждение не требуется / защита от переохлаждения300K»
  и «активный радиатор закрыт: фон теплее корпуса» от depletion, нехватки
  мощности и critical thermal-stop. Повтор сообщений каждый dt не нужен.
- Новые правила применяются к текущему v2 ledger/mission и всем S/M instances.
  Первая Lab/v1 остаётся исторической моделью. Старые измеренные результаты
  сохраняют записанные числа; открытие файла ничего не пересчитывает.
  Поставка явно подписывает thermal controls v0.1 и принятый floor; новых
  JSON schemas/миграций/catalog TTX для этого не вводить.

# HOW / owners

После отдельного PLAN_READY и настоящего Draft PR новая изолированная ветка
от принятого module-card UI. Не менять текущий UI candidate под его QA/review.

1. Developer: small deterministic RED на холодный H₂, горячую среду/Active;
   определить тепловой запрос после доступных обычных путей и обеспечивать
   ограничение нижней границы. Один owner расчёта автоматики; никаких новых
   слоёв расписаний/пользовательских sliders/систем восстановления.
2. Реализовать demand и закрытую площадь в src/model/v2/physics.ts; вынести
   небольшой helper только если расчёт/диагностика иначе расходятся. Existing
   event boundaries/trace сохраняют conservation и dt refinement.
3. Необходимая диагностика src/runner/diagnostics.ts, telemetry binding
   src/model/v2/step.ts/src/model/v2/types.ts/src/model/types.ts лишь по нужде.
   Footer/понятная подпись src/app/fitting.ts. Existing compile/scenario
   origins могут отмечать правило, без реорганизации snapshot/IO.
4. Meaningful tests в tests/fitting: thermal controls/ledger/convergence;
   одна короткая actual Worker/LAN цепочка с журналом. Обычный guard→immutable
   source/build→QA→один scopedReview. Не повторять81digests/12h campaigns.
5. PM закрепляет принятое уточнение в current U2 cooling owner отдельной
   doc-only веткой/PR и в Lab source-authority; не копирует полный GDD в public
   Lab. После acceptance обновляет существующие LAN/Pages, старые версии
   сохраняются. Merge только оператор.

OUT: redesign UI/TTX/cargo/лазеры/полет/износ/сигнатуры/Stealth modes/новая
универсальная governor architecture. Топливный генератор проверяется как
сопряжённый источник: спрос, расход и own heat/export. Дополнительный runtime
fix генератора только при названном воспроизводимом defect, без «заодно».

# Verification / Review Contract

| AC | Expected / edge / error | Метод |
|---|---|---|
| CC01 | T<300 и ровно300: H₂ cooler host removal/aux/consumer mass0; >300 включение только при реальном запросе. При достаточной обычной radiation/buffer расход0 | RED→GREEN S/M synthetic ledger + actual compiled fit |
| CC02 | Active закрыт при Tenv≥Tship; отдельно hull/passive import heat сохраняется; при обратном пересечении radiator возобновляется без применения нового fit | Signed ledger/переходы в обе стороны; control без Active и с Passive |
| CC03 | dt crossing floor/gradient: finite advancing time, stock≥0; H₂ consumed*q = host export+aux; electric/heat ledger замыкается. Нет post-hoc clamp или скрытой энергии | Targeted refinement малый/средний/крупный dt, существующие time/conservation tests; не новая большая матрица |
| CC04 | Причины автоматики читаемы, нет ложного «нехватка энергии/топлива/термозащита» и dt-log spam; true starvation/critical gates сохранены | Transition tests + короткий native Worker/LAN Start/Pause/log, desktop и touch390 по необходимому риску |
| CC05 | Один Pony-DH H3600 на стандартных условиях показывает реальный прогресс/рейсы без artificial freeze; powered/no-gen stock ledger, S/M профиль; сохранённый результат/fit открывается корректно, Legacy unchanged | Один coupled-hour case с H₂-OFF control по named regression, representative medium short case; old stored result no recompute; ordinary guard |

Review IN только actual cooling/necessary diagnostics/callers/tests + этот whole
contract. Риски cutoff chatter, auxiliary power whileOFF, doubled cooling,
closed area still importing heat, same tank double-use, false log causes.
BLOCKER только acceptance/regression/correctness/build; advisory не расширяет
задачу. QA не исправляет. Source/contract/build fingerprints обязательны;
report краткий, PM single literal publisher. Самоаудит после3 review/QA+triage.

Rollback: immutable accepted module-cleanup dist/Pages source commit (фиксируется
при передаче ветки); предыдущие LAN/Legacy сохраняются. Численные владельцы до
DEV неизменны относительно ebd4814. Base/open Draft gates не заменяют local
product acceptance; PR остаётся Draft до решения оператора.
