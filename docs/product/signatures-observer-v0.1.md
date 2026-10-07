---
title: "Сигнатуры и наблюдатель — входной пакет первого стенда"
status: "proposed / spectral experiment decision pending"
version: "0.1"
date: 2026-10-07
tags: [signatures, sensors, radar, observer, gd-lab, experimental, server-contract]
related:
  - docs/plans/2026-10-07-signatures-sensors-sprint-v1.0.md
  - docs/architecture/source-authority.md
---

# Первый стенд: текущий корабль и условный наблюдатель

Оператор утвердил выполнение плана и упростил первый стенд: наблюдатель выбирается
из пресетов приборов. Корабль против корабля/станции — последующее расширение.
Новое уточнение оператора: направленный IR обязателен уже сейчас, EM всенаправленное.
Этот пакет структурирует принятый WHAT; **спектральная гипотеза §3 пока не принята**.
Runtime DEV_RELEASE до её решения и independent PLAN_READY этого пакета отсутствует.

## 1. Граница и условия опыта

Испытуемый — один существующий fitting из каталога 0.2.5 или буквальный исторический
snapshot. Его рейсы, топливо, заряд, тепло, полезная работа и первый ограничитель
продолжают рассчитываться существующей моделью. Новый режим сигнатур включается
явно; выключенный режим и исторические модели остаются без новых физических taps.

Наблюдатель — измерительный прибор с внешним питанием, **не второй корабль**.
Потребление его сенсоров, заряд радара, RF и тепло отражаются в отдельном приборном
ledger, не снимаются с батареи испытуемого и не образуют вторую T_ship.

Измерительная геометрия постоянна относительно испытуемого: расстояние стенда
16 000 м по умолчанию, ракурс 0° по носу. Это не текущая дистанция шахтёрского рейса.
R должен быть конечным и >0; угол конечный, нормализуется на [0,360).
Опыт учитывает время распространения истории источника, c′=3000 м/с; изменение
параметров во время запуска касается следующего черновика. Реальные траектории
двух кораблей/станции не входят в этот релиз; moving golden vectors отдельные.

## 2. Пресеты наблюдателя и геометрия цели

Четыре пресета G1: S выделенные IR+EM и радар S; S «три в одном» и радар S;
M выделенные IR+EM и радар M; M «три в одном» и радар M. Default — S выделенные.
Photo в «три в одном» не симулируется и не даёт бесплатную дальность.

S IR detect/hold: 0.000274542277 / 0.0001647253662 Вт/м²;
S EM detect/hold: 3.592038646e-8 / 2.1552231876e-8 Вт/м².
M делит пороги на 4; «три в одном» умножает на 2.25, то есть дальность ×2/3.
Приём passive без намеренного RF; электрическая обработка отражается в приборном
ledger. Для S: IR 375 Вт, EM 375 Вт, «три в одном» 750 Вт; M мощность ×4.
Статусы источников accepted_design_direction / working_reference сохраняются.

Радар выключен по умолчанию. Включённый радар автоматически делает одиночные
полноэнергетические ping с заданным интервалом ≥2 с, default 2 с. Это лабораторное
повторение одинакового одиночного ping, не новый игровой AUTO/survey режим.
Local capacitor default FULL; EMPTY — отдельное сохранённое начальное условие.
S: 12 500 Дж electrical, 5625 Дж RF, 6875 Дж host heat; 6250 Вт recharge,
5 мс pulse, RF peak 1 125 000 Вт, A_rx=1 м², echo threshold=5.217880169e-14 Дж.
M capacitor/RF/recharge/A_rx ×4, G1 echo threshold тот же. Приборный ledger включает
initial capacitor energy и external recharge; зарядка и pulse не тратят одни Дж дважды.
Приборный physical capacitor хранит Q∈[0,12500] Дж: recharge добавляет только в Q;
ping один раз снимает 12500 Дж и распределяет их в 5625 Дж RF + 6875 Дж host heat.
3437.5 Вт — среднее тепла полного двухсекундного цикла, не второе тепло recharge.
Для radar-only ledger: initialCap + externalRecharge − RF − hostHeat − remainingCap=0.
Общий ledger добавляет external receiver-processing energy и escaped parasitic EM;
паразитный экспорт зарядки/обработки списывается из общего electrical host-loss
budget той же политикой §3, не создаёт дополнительные Дж или отдельный расход Q.
Заряд даёт собственную паразитную EM; intentional pulse не экранируется.
Fresh после reception 3 с, затем stale ещё 10 с. OFF не удаляет уже летящие сигналы.
Один ping не даёт velocity/course или identity. Self-reveal показывается как
намеренный RF/поток опорному приёмнику, без выдуманного сенсора испытуемого.

Реальные named hulls пока не имеют CS-геометрии в каталоге. Измерительный overlay
использует опубликованный reference S 22×16×6 м; M — подобный размер ×2 по длинам.
L/W/H можно изменить, все конечные >0. Label: «Геометрия стенда», provenance reference,
**не канонический силуэт Спутника/Ермака/Пони**. CS=H(|W cos α|+|L sin α|),
α — ракурс; S nose 96 м², broadside 132 м². Масса/C корабля от overlay не меняются.

## 3. Источники, спектр и направление

Не читать heatOutW как IR: он включает внутреннее поглощение буфером.
Поверхностные источники берутся из actual radiationOut/net и их K=εA;
эти K в текущей физике уже эффективные, повторно ε не умножается.
Body и radiators при общей T_ship делятся по фактическим K; отдельный горячий
вывод термоинвертора учитывается по собственному контракту, не повторно как body heat.
Absolute outward power ≥0 и signed thermal contrast — разные поля. Standard IR
видит max(contrast,0), advanced контроль — |contrast|; фон не вычитается дважды.

Plume engine, self-export generator и H₂+aux plume отделяются в physical substeps.
Их exported heat не возвращается в host heat и не складывается дважды с поверхностями.
**PG-SS-IR, решение ожидается:** для первого измерительного эксперимента предложены
профили f_IR=0.10 / 0.50 / 1.00 для этих mass/export путей, с возможностью явно
задать каждую долю отдельно в [0,1]. P_IR,path=f_IR,path·P_export,path.
Это гипотеза спектральной видимости exported heat, не всего engine useful/chemical
power и не канонический КПД/ТТХ. До ответа оператора default не назначается.
Неполный профиль не запускается и не подменяется нулём. Профиль, статус, версии
и все выбранные доли сохраняются в input/result; сравнение разных гипотез помечается.

IR проецируется непрерывно по signature owner §6.7:
g(Δ)=π·max(cos Δ,0), круговое среднее g равно 1. Body текущих Civilian/Industrial
изотропен; радиаторы, горячий TI-вывод, маршевый plume — назад; ретро — вперёд;
стрейф/поворот — ½[g(φ−90°)+g(φ−270°)]. Generator/H₂ export в этом стенде
выводится назад по уточнению оператора о горячих выхлопах. Magnitude — от actual
source, без class bonus. Нос/корма/левый/правый — четыре удобных ракурса в UI,
а не ступенчатая смена физики на границе четверти. Среднее по полному кругу
сохраняет исходную мощность. Дальность в IR зависит от ракурса; EM g=1.
Одна T_ship и изотропный тепловой фон сохраняются; направленный звёздный нагрев отложен.

EM: κ=0.0000215 от суммы фактических положительных электрических stages внутри
evaluate до усреднения: generator output, battery charge/discharge отдельно,
consumer inputs и protected active processing. Не весь requested bus, не net batteryRate.
Escaped parasitic EM вычитается ровно один раз из общего electrical host-loss
budget и добавляется в outward energy ledger. Captured shielding EM уже осталась
host heat: второй add запрещён. Если electrical waste budget недостаточен,
контракт данных отклоняется, не скрытый clamp. Новый opt-in physical modelVersion
сохраняет прежние режимы и буквальные исторические fixtures без restamp.

Функциональные countermeasure references: insulation 0.5 intrinsic hull K;
shielding 0.5 только паразитной EM; RAM 0.25 effective CS; strongest-only,
не произведение повторных одинаковых покрытий. В первом стенде — явно обозначенные
аналитические controls/fixtures, **не новые fitted SKU** с выдуманными массой/C/слотом.
Стоимость таких серийных модулей и реальная специализация новых корпусов отложены.

## 4. Наблюдение, статистика и сохранение

Один Worker и simulation clock, causal source history, очередь ping/reflection/echo,
исходные pulse ID, capacitor, passive hold и track TTL. Изменение sampling/chunk/
retention не меняет интегральное среднее или экстремум 5 мс pulse.
Для каждого IR direction/EM/CS: live/final min, integral/time mean, max и по фазам;
пустой интервал — нет измерения. Для direction показывать и наблюдаемый IR,
и intrinsic total с явными единицами; четыре значения не складывать как общую мощность.

GDTruth доступна ГД; ObserverView содержит только channel/bearing/brightness,
а при действительном echo — measured range/pulse ID/reception/freshness.
Пассив не получает target ID/true R/emission time/age/source count/identity;
первый radar track без скорости. Полная диагностика не смешивается с observer export,
tooltip, DOM или логом этого представления. Условная геометрия самого опыта остаётся
GD input, не переносится в ObserverView даже как вспомогательное поле.

Snapshot явно хранит signatures model/data revision и все параметры стенда.
Изменения условий для следующего запуска не меняют active/result/A/B/reference.
JSON round trip и CSV возвращают те же измерения/статусы; unknown/partial/несогласованный
импорт отклоняется атомарно. Checkpoint включает события в пути и приёмный state;
возобновление даёт те же observations. Исторические результаты открываются буквально.

## 5. UX, приёмка и перенос в игру

Текущая длинная страница, навигация при запуске, sticky результат/ограничитель,
графики тепла/энергии/добычи и A/B сохраняются. Один компактный select observer,
range, select ракурса и radar toggle; геометрия/спектр/countermeasures/угол — под
раскрытием. Custom угол не изображается ложным cardinal preset. Без автофокуса поиска,
больших дублирующих кнопок, горизонтального overflow или новой трёхэкранной навигации.
Версия интерфейса 4.4, модуль signatures-observer 0.1; каталог остаётся 0.2.5.

SS00–08 и SS12–16 относятся к этому стенду с уточнениями плана v1.1.
SS09–11: в первой поставке reference matrix пяти ролей и golden source vectors
из routed CSV с сохранёнными diagnostic статусами. Они не обещают готовых
Sport/Military/Stealth изделий, реального ухода/боя или замкнутого Quiet governor.
Эти runtime сценарии — дальнейшее расширение, NOT RUN, а не поддельный PASS.

Нужны meaningful unit/integration RED→GREEN, legacy golden digests, реальный Worker
3600 с и lifecycle controls, A/B и atomic IO, 11 прежних responsive envelopes/LAN,
обязательный verify.sh. Numeric/threshold/timing policy — §8 плана, без 1 SI floor.
Дополнительно: интеграл g по кругу; одинаковая EM во всех ракурсах; непрерывность
±45° и 0/360°; разгон ярче с кормы/торможение с носа; body floor не исчезает;
raw/escaped/captured EM energy closure; 2 ping/checkpoint/OFF/TTL exact boundaries.

Пакет handoff: source manifest/provenance, versioned inputs/state/observations,
golden vectors и allowlisted observer DTO, named open balance/production questions.
Реальные U2 server/protocol/client изменения отдельно, server parity NOT RUN.
Rollback — отключение нового режима; прежний mission/каталог/IO сохраняются.

## 6. Источники и состояние

Routed snapshot U2 0fe06927ab496918b3547f43412134c100a6e0b4 — те же owners §11 плана,
плюс ship_radar_active_first_slice_v0.1.csv и countermeasure/RAM CSV data router.
Различаются accepted core, accepted_design_direction, working_reference,
reference_diagnostic/class_diagnostic и experimental. Public bundle содержит
разрешённую компактную projection anchors, не полные GDD/private runtime configs.

Пять ролевых CSV — проверочные входы, не доказательство пересчёта named fitting:
даже calibration EM_stage_basis упрощён и не заменяет actual stage закон §3.
Материальные production blockers, Quiet limits, новые class geometry/C/T и
short-pulse passive matched detection не ратифицируются этим пакетом.
