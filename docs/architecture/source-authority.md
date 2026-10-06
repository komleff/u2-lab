# Current source authority

## Canon route

Domain: энергетика/тепло корабля, автоматическое управление, параметризация модулей.
Product authority: оператор Dmitriy Komlev; U2 является владельцем утверждённого канона.
Route: U2 `docs/INDEX.md` → thematic owner → обязательные dependencies/ADR-INDEX.
Frozen U2 commit: `cdc490e3517c8455f662f82579c45813cdbb9a76`.
Blob IDs/версии: `u2-source-inventory.json`. Полный private GDD в public lab не копируется.

| Область | Primary/current owner U2 |
|---|---|
| Энергобаланс | docs/brand/u2_power_budget_doctrine.md; ADR-0045-Unified-Accumulator-Model.md |
| Источники, аккумулятор, fuel | docs/specs/spec_power_components_v0.1.md |
| Потребители и heat load | docs/specs/spec_power_load_v0.1.md |
| Общая температура/inertia/protection | ADR-0043-Thermodynamics-And-Motoresurs.md; docs/brand/u2_engine_thermal_doctrine.md |
| Active/Background | docs/gdd/gdd_automatic_power_thermal_scheduler_v0.1_draft.md |
| Автоматика Civilian | docs/gdd/gdd_hull_class_governor_architecture_v0.1_draft.md |
| Cooling palette | docs/gdd/gdd_thermal_control_palette_balance_v0.1_draft.md |
| Hot side / incoming heat | docs/gdd/gdd_hot_environment_thermoinverter_balance_v0.1_draft.md |
| Generator/exhaust heat split | docs/gdd/gdd_generator_thermal_topology_v0.1_draft.md |
| Опорный рабочий цикл | docs/gdd/gdd_thermal_progression_work_cycle_reframe_v0.1_draft.md |
| TTX / GenerationState / SKU | docs/specs/balance/spec_ship_module_ttx_master_v0.1_draft.md |
| Среда/парус | ADR-0036-Sector-Fields-Environment.md; ADR-0037-Solar-Sail-And-Cross-Section.md |

ADR paths находятся в U2 `docs/architecture/`. Все owner версии в inventory active, несмотря
на исторический суффикс draft в части filenames. Old energy mastery — reference, не баланс.

## Температурный амендмент 2026-10-07

Оператор принял единую linear hot/cold деградацию мощности плюс повышенный износ.
Отдельный behavioural owner — ADR-0068 и его diagnostic contract; прямые ссылки
записаны в [product contract](../product/thermal-derating-diagnostics.md).
Источник: [U2 PR842](https://github.com/komleff/u2/pull/842), exact commit
`775ea56309c5036cee091068123140014625874d`, active решение независимо от Draft.
Это отдельный амендмент, а не owner в frozen inventory: TTX и физические источники
чисел сохраняются. Lab wear не рассчитывает.

## Formula boundary и lab variants

Hot-environment owner §10 уже допускает отдельный H_env для вклада, не вошедшего в T_env,eff.
ADR-0036 содержит линейное правило thermal fog; ADR-0043/current thermal owner — radiative T^4.
В v0.1 baseline T^4, linear fog — маркированный experiment. Результат требует решения U2
owner; никакого молчаливого supersession и двух cooling terms одного вклада.

## Data provenance

Parameter origin: canonical (точный current source/section), derived (исходные значения и
именованный закон) либо experimental (кандидат, явно редактируемый в lab). Каждый набор
имеет model/catalog version. Не считать M универсальным кратным S. Missing SKU data
публикуется как gap; unusable incomplete preset нельзя показывать как approved baseline.
Материалы, cargo/рабочая производительность и двигатель требуют своих current owners из
INDEX при извлечении чисел в первой implementation task; эту задачу нельзя заменить grep.

## Pipeline authority

Trusted OverGate `v4.0.0-rc.1` = `633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
INSTALL/PM/RV и ADR §§3.28–3.32 — bootstrap owners. До managed apply installer policy
берётся из frozen source; новый installed package не сертифицирует собственную установку.
OverGate MIT notice/provenance сохраняется согласно distribution inventory; это не
назначает автоматически лицензию всему U2 или всему U2 Lab.


## Project cloud Beads authority

Cloud execution contract: `docs/plans/2026-10-05-cloud-execution.md`, C1–C6; independent
PLAN_READY: `docs/reviews/2026-10-05-cloud-plan-review.md`. Project-owned tooling взято
из U2 exact `cdc490e3517c8455f662f82579c45813cdbb9a76`, ADR-0042 single-writer routing;
точные source/target blobs и transformations — `docs/verification/cloud-tooling-provenance.json`.
Installed managed bd-env/reader/sync/hooks/roles не изменяются. Cloud пишет только pending
intents; оператор применяет trusted tooling из primary checkout. Первичный recovery:
`docs/guides/operator-bootstrap.md`; checkpoint не canonical authority. Product WHAT,
P1–P14 и bootstrap acceptance gates сохранены.
