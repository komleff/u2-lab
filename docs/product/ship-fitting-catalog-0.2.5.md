---
title: "Каталог 0.2.5 — D/H/E сборки и встроенный криобак Волны"
status: accepted / implementation authorized
version: "0.3"
date: 2026-10-07
---

# Принятый результат

WHAT — последнее уточнение оператора 2026-10-07: Волна снова водородная серия;
Мир универсальный с двумя базовыми сборками D/E; Ермак и Титан с тремя D/H/E.
Всем M — два лазера и один дополнительный навалочный трюм 192 SCU.
Число +20% прямо уточнено оператором после Plan Review0.2; HOW и остальные AC неизменны.
Это заменяет редакцию0.1 (Волна E и Мир H default); код той редакции не реализовывался.

## Корпуса и пресеты

| Корпус | Architecture корпуса | Штатные сборки | Mining/cargo |
|---|---|---|---|
| Северин Волна M / civilian-M | H | H | 2 mining-civil-M + cargo-bulk-M192 + builtin cargo24 |
| Северин Мир / severin-mir | U | D, E | 2 mining-civil-M + cargo-bulk-M192 + builtin cargo24 |
| Демирмаш Титан / industrial-M | U | D, H, E | 2 mining-industrial-M + cargo-bulk-M192 + builtin cargo48 |
| Демирмаш Ермак / industrial-S | U | D, H, E | сохранить1 mining-industrial-S + cargo-bulk-S24 + builtin cargo12 |

D/H/E в названии сборки обозначает установленную тягу, а не изменение Architecture
самого универсального корпуса. Все четыре роли движителей одного типа; размер S/M
соответствует корпусу. D Титана сохраняет industrial-M движители; H/E используют
существующие M SKU. Отдельные M пресеты1/3 лазера удаляются из меню; ручные сборки
и ранее сохранённые объекты не запрещаются и не удаляются.

## Встроенные системы и штатное питание

Волна .5 H сохраняет builtin cargo24, удаляет унаследованный builtin battery-M,
получает несъёмный Power builtin H₂ cryotank M, который питает двигатели/генератор/охладитель
обычным общим H₂ контуром. Обычный tank-hydrogen-M — текущая численная опора.
Встроенное исполнение по active spec_power_components §4.0 имеет преимущество,
точного M коэффициента в owners нет. Для экспериментальной Лабы задаётся явная
временная гипотеза **+20% вместимости**:3647.570429×1.20=4377.0845148 kg;
сухой bill/C/gates остаются от существующего M бака. Provenance experimental,
не новый canonical SKU и не общий множитель для всех builtin. Отдельный лабораторный
builtin profile должен объяснять эту гипотезу в существующей кнопке i.
Сменный battery-M и generator-hydrogen-M ставятся в свободные Power слоты.

Мир .5 U: builtin cargo24, нет встроенного аккумулятора или топлива;
D — battery-M + generator-diesel-M + tank-diesel-M;
E — battery-M + solar-M, без штатного fuel tank/generator.
Титан: builtin cargo48; D/H — battery-M + соответствующие M generator/tank;
E — battery-M + solar-M. Для D/H штатный XS аккумулятор меняется на M.
Ермак D — точная прежняя операторская сборка .4 с restamp .5;
H/E сохраняют её payload/signature и используют обычный battery-S, H generator/tank-S,
либо solar-S для E. Референсное уменьшение retro сохраняется по существующему
explicit-local-variant правилу, без скрытого коэффициента роли/ослабления bill.
Во всех новых M — прежний passive radiator-M в signature-1, остальные signature пусты.
Бюджет слотов не меняется. Спутник/Пони/L, имена/V_FA/свежие×2условия сохраняются.

## Authority

Маршрут через U2 docs/INDEX.md: active spec_ship_slots_v0.7.md0.8-r14
§6.2/§7/§8 (H встроенный бак, U сменный battery/fuel), spec_power_components_v0.1.md
§4.0 (обычная функция, больше вместимость builtin, fuel aggregation);
active cargo GDD1.7 §2/§3 (CivilianM24/IndustrialM48, триM Payload);
active hull-specialization GDD0.2 (встроенное оборудование учитывается один раз).
Naming catalog_ships_russian_v1.0.md §2 и master-registry1.3 — draft proposal
ВолнаH со встроенным криобаком, теперь явно подтверждён оператором для Лабы.
Новые лабораторные .5 profiles/defaults обозначаются sourceRef operator-2026-10-07,
не выдаются за полностью канонические ТТХ U2. Все50 global SKU и физические формулы неизменны.

## Совместимость и выбор сборки

Новая known edition ship-fitting-0.2.5 текущая в приложении. Все .0–.4 каталоги,
фабрики, fits/run/result сохраняются буквальными snapshots (включая старые Мир/Волна E).
Новые option keys `${hullId}:${laserCount}:${D|H|E}` не меняют JSON schema/hullId:
тип сборки читается из реальных installed propulsion, не сохраняется как скрытый новый режим.
Без suffix default: Мир D, Волна H, Ермак D, Титан D. Old explicitcount API и
ручное переоснащение не запрещаются. Штатные M options только2; Ермак только1.
Если монтаж/версия не соответствует целому предлагаемому пресету, select явно
показывает текущую/пользовательскую сборку, а не другой корпус или ложный preset.
Применение whole preset изменяет только selected next draft, сохраняя active/result/A/reference,
station checkbox и явные импортированные/literal условия/скорость.
