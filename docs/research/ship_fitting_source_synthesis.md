---
title: "Ship Fitting — сводка действующих источников U2"
status: research
version: "1.0"
date: 2026-10-05
related:
  - docs/research/ship_fitting_sources.json
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
---

# Что уже определено в U2

Исследованы41 owner/data файла из current U2 main
`cdc490e3517c8455f662f82579c45813cdbb9a76`. Маршрут: Memory Bank → llms.txt →
docs/INDEX.md → ADR-INDEX и gdd_overview§16 → точные связанные owners.
Использованы `.agents/GD_ROLE.md`1.4 и `.claude/skills/game-designer/SKILL.md` U2.
В лаборатории GD_ROLE отсутствует в управляемом наборе шести delivery roles;
внешняя роль используется по поручению оператора, managed набор не изменяется.
Читались frozen Git blobs, а не отстающий локальный worktree, архив или поиск по словам.
Полные приватные GDD в публичную лабораторию не копируются. Метаданные всех41 файлов
с route/status/version/blob находятся в [manifest](ship_fitting_sources.json).

## 1. Владельцы решений и важные поправки

| Область | Current owner | Что переносим |
|---|---|---|
| Размещение | spec_ship_slots0.8-r14; multifuel delta0.1 | Четыре категории, четыре propulsion roles, встроенные/сменные изделия, один SKU на слот, smaller-fit, отдельные архитектура и движитель |
| Оснастка/готовность | fitting_instances0.9; fit_blueprints0.7 | Можно сохранять неполную сборку; совместимость, комплектность и запасы различаются |
| Cargo | cargo_payload_and_dimensions **primary1.7** | S/M/L Payload2/3/4, SCU=м³, universal/specialized compatibility, новые массы/объёмы |
| Движители | engine_force_grid0.1-r13; power_components0.1-r11; power_load0.5-r4 | Family-specific scaling; F/m текущей массы; coarse electric bridge существует, lab runtime отсутствует |
| Mining | laser_energy_productivity1.0 | Bus→beam efficiency,24MJbeam/SCU reference, возврат тепла; лабораторный process вариант объявляется отдельно |
| Тепло | ADR0043/0045; generator_topology0.1; thermal_palette0.3 | Один T_ship, dry material C, finite stocks, signed radiation и реальные radiating surfaces |
| UX | outfitting_doctrine0.6-r7; UX architecture0.7; station screens0.16 | Preset→swap→build, сравнение дельт, inline soft-fail, F1/F2/F3, автоматическое управление железом |

Наименования выше сокращены; manifest хранит полные пути и точные blobs.
Профильный owner сильнее старого общего fallback. Lifecycle draft не означает автоматически
«отклонено»; accepted внутри naming proposal также не означает утверждённый полный hull SKU.

Cargo1.7 **явно supersedes** старые грузовые значения Master/CSV. UniversalS сейчас
12SCU/8.945439461t, BulkS24SCU/1.800t; объём S→M→L растёт×8, а не×4.
Это разрешённая смена authority, а не повод выбирать старый CSV для удобства.
Старый production CLOSED не доказывает новый рецепт. Старые lab exports должны
оставаться воспроизводимыми с их прежними значениями.

## 2. Корпуса, лазеры и источники

Известные Payload/builtin anchors: CivilS2×S/6SCU, IndustrialS2×S/12SCU,
CivilM3×M/24SCU, IndustrialM3×M/48SCU, IndustrialL4×L/192SCU.
Diesel Pony S/G0: UNKNOWN Class/National, встроенные Solarka tank12t,
MiningLaserS и12SCU; Power3×S, Payload2×S. Pony не следует переименовывать
в обычный Industrial или CivilianG1. Имя Спутник имеет отдельное текущeе PO-решение;
прочие первые профили лучше показывать нейтральными Class/Size labels.

CivilS/G1 laser3MW/η0.5001: два запрашивают6MW, три9MW **до** фона и потерь.
CivilM generator8MW не покрывает постоянный запрос трёх таких лазеров.
IndustrialS/G2 laser3.4MW: три10.2MW. Это nominal arithmetic, не результат опыта.
Нельзя обещать тройную добычу без actual power, cargo и полного thermal bill.

Электротяга имеет coarse anchor P=cF, c≈7.8m/s. Он основан на **полезной**
энергии топлива13.76MJ/kg diesel/66MJ/kg H₂; химические43/120MJ/kg сюда подставлять
нельзя. Численный bus/path/useful/host split каждого lab SKU требуется отдельно.
Прямые engine branches нынешней лаборатории используют typed fuel и не моделируют
такую электрическую конкуренцию; переименования одного поля недостаточно.

Классы имеют floors CivilG1/IndustrialG2, а H₂ generator не ранееG3, active radiatorG2,
thermoinverterG4. MinorStage без engineering owner не интерполируется.
Master39families — roster прошлого среза; только6 family-wide CLOSED,24 PHYSICAL_BLOCKER,
6 DEFERRED,2 RESERVED,1 HYPOTHESIS. Новые Commodity Hold/H₂ Cooler не делают старый
roster исчерпывающим. First-loop six SKU proofs не закрывают весь Cartesian catalog.

Не замкнуты: generic Power/Signature layouts, builtin cargo construction,
часть cryotank/material recipes, полный electric SKU ledger, exact national recipes.
Оператор разрешил lab hypotheses; поэтому они допустимы с полными численными входами,
field provenance и sensitivity, без утверждения production/gameplay readiness.

## 3. Исследования UX, которые уже есть

Действующая outfitting doctrine консолидирует research session2026-06-21 по EVE,
Elite Dangerous, Star Citizen, Warframe, X4, Cosmoteer, Highfleet и MechWarrior Online.
Отдельной зарегистрированной статьи о страницах fitting в frozen INDEX не найдено;
это не утверждение, что прошлых исследований не было. Для текущего решения достаточно
принятых выводов doctrine. Новое внешнее конкурентное исследование в scope не добавлено.

Применимые решения: готовая сборка первым экраном; слот фильтрует каталог; дельта замены
видна до применения; встроенные системы отдельным блоком; сравнение 1/2/3 одинаковых
рабочих изделий без stacking penalties; touch390px без hover/drag обязательности;
предупреждение объясняет проблему, опыт показывает цену ограничения.
Покупки, владение и станционные услуги остаются у game owners, не у публичного lab.

## 4. Решение для лаборатории

Ship Fitting становится входным workflow; Power & Heat — его numerical engine.
Первая роль — mining. Оправданность определяется SCU/h и SCU/cycle, typed fuel/H₂
на добычу, простоем/восстановлением и первым измеренным ограничением. Дополнительный
K_use показывает использование выбранной рабочей группы; universal weighted score
и денежная окупаемость не вводятся. Дизайн и implementation HOW разделены.

Source research не является independent Plan Review. Никакие runtime tests этим
документом не заявляются. Автор: PM/GD Codex; actual provider/model ID недоступен.
