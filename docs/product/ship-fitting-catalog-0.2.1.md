---
title: "Ship Fitting — индустриальный движитель M и штатные лазеры"
status: accepted scope
version: "1.0"
date: 2026-10-06
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
  - docs/plans/2026-10-06-fitting-catalog-0.2.1.md
---

# Принятое изменение

Оператор после расчёта Industrial M поручил «обнови ТТХ в лабе» и «по умолчанию
ставь в корабли лазеры их размера и класса». Цель — сравнивать реальные установленные
изделия: индустриальная тяга несёт индустриальную массу; корпус не меняет класс SKU.
Это уточнение каталога поверх принятого GDD; frozen v4 WHAT/VC и signed reports
не переписываются. Beads: ulab-agx. Режим PRODUCT, один Developer.

## Источники и численные границы

Маршрут U2 INDEX/ADR-INDEX, frozen commit
`cdc490e3517c8455f662f82579c45813cdbb9a76`: engine force-grid0.1-r13 §§8.2/8.8,
compact `propulsion_force_mass_input.csv` M/Industrial, module TTX contract §§5/7,
TTX Master §§2/5/7.1 и generation/national §9; power components §§2.2/2.3;
thermal doctrine §3. Специальный force owner сильнее generic Class/Generation.
Civilian first-loop production closure не доказывает Industrial BOM.

| Поле нового базового diesel M / Industrial G2 | Значение / правило | Происхождение |
|---|---|---|
| Маршевая сила | 16 228 800 N | exact compact input, а не округлённые16.2MN prose |
| Ретро | марш ×3/7 | derived, профиль0.75/1.75 force-grid§8.2 |
| Стрейф-пара | марш ×9/35 | derived, профиль0.45/1.75 |
| Поворот-пара | та же сила, что у стрейф-пары | explicit lab hypothesis по приближению§8.2; это не approved yaw curve |
| Полный пакет,4slots | 160 000 kg | class/size mass reference compact input |
| Масса каждого изделия | 160000 ×F_item /ΣF_four_slots | derived от force-share law; три изделия march/retro/pair, pair установлен дважды |
| КПД | 0.40; sensitivity0.32–0.50 | explicit lab candidate; точный Industrial efficiency owner не замкнут |
| Расход α | 0.565e−6 ×0.32/η kg/(N·s) | derived от diesel reference и actual efficiency, не независимый бонус класса |
| Path efficiency / host fraction | 0.95 /0.70 | прежние explicit lab defaults; поля и provenance сохраняют статус гипотезы |
| Material / cp / gate | существующие lab candidates | не production proof; dry bill и C пересчитываются от новой массы |

Марш и ретро имеют single form factor; pair законно устанавливается в Strafe и Turn.
При cross-fit изделие сохраняет force/mass/efficiency. Слот не умножает SKU.
Новые изделия имеют Class Industrial/G2 без national skew, не получают второго
Generation force multiplier. Каноническое число отделено от гипотезы в origins/UI.

## Штатные сборки

Industrial M1/2/3 используют новый движительный пакет. Civilian изделия остаются
доступны для сознательного смешанного fitting с прежними IDs/числами.
Остальные default двигатели в этой области не меняются.

Лазеры новых presets:

- Sputnik: Civilian S/G1; Industrial S: Industrial S/G2.
- Civilian M: новый Civilian M/G1; Industrial M: существующий Industrial M/G2.
- Industrial L: новый Industrial L/G2.
- Pony: отдельный UNKNOWN/G0 S-anchor, включая съёмные дополнительные лазеры;
  встроенный лазер не заменяется и Pony не получает Industrial/Civilian Class.

Для недостающих Civilian M и Industrial L применяется laser family size-step×4
к power и dry mass:12MW/8.8t/η0.5001 и54.4MW/48t/η0.528093 соответственно.
Это derived lab candidates по existing laser owner, не универсальное правило для
других families. Class/Generation/units/origins видны. Число1/2/3 означает полное
число лазеров, включая builtin. Industrial L3 сохраняет дополнительный bulk M hold.
Пресеты не обещают непрерывную работу: Power & Heat показывает фактический дефицит.

## Совместимость и приёмка

C01: новые Industrial изделия присутствуют в slot-filtered каталоге; действуют
single/pair compatibility и собственные ТТХ при перестановке.
C02: пользовательская Industrial M сборка (2Mлазера,2Mаккумулятора, diesel M generator
и tank,48+192SCU,4passive M radiators) имеет dry mass≈412245.550477kg, diesel capacity24t.
При LAB-ORE-01/full cargo и fuel mass≈796245.550477kg. Никакого hardcoded ship total.
C03: все новые presets используют lasers size/class корпуса; Pony UNKNOWN/G0 отдельно.
C04: все прежние40SKU, hulls и builtin anchors неизменны; готовый старый fit не
получает замену модулей при открытии. Старые результаты сохраняют свой spec/metrics.
C05: новый каталог явно versioned0.2.1; fit/run/result форматы остаются прежними.
Старый0.2.0 поддерживается совместимо без silent replacement. Unknown catalog и
malformed/nonfinite input сохраняют прежние fail-closed/explicit snapshot правила.
C06: fuel/heat/C выводятся из actual нового изделия; experiment provenance не
становится canonical, installed pair не считается дважды внутри одного слота.
C07: LAN UI позволяет выбрать новые изделия, видеть массу/причины ограничения,
выполнить short run, экспортировать fit/run/result и открыть их в свежей странице.
C08: v4 slot identity, navigation/active-vs-next ownership, comparison и native
result analysis сохраняются; старые standalone4183/4186 и frozen4188 artifacts остаются.

Не входят: новая flight/mission/refuel модель, цены/ROI, national/minor-stage система,
весь Cartesian engine catalog, полный BOM production proof и новый численный алгоритм.
Открытие старого fit не означает его автоматическое переоснащение.
