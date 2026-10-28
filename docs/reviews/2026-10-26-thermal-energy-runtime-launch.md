---
title: "Запуск физической реализации каталога 0.3.4"
status: "PRODUCT / DEV pending source closure"
version: "0.1"
date: 2026-10-26
beads: ulab-16h
---

# Контракт физической реализации

Источник: plan0.5 `docs/plans/2026-10-26-thermal-fitting-implementation.md`,
plan blob `0e732e46acf8f06f3706118f704cd6bd77beff87`,
независимый PLAN_READY 0 blocker / 0 advisory в
`2026-10-26-thermal-fitting-plan-review.md` и его JSON binding.
База: документальный #49 `b1cbc3dbffcd4a6277c8b908cfb645d2d8f787c9`;
U2 физические данные `f08558a9bcdf2de5e3226ea46cfed90f310f7f8b`.

IN: TF01–TF12 в окончательной физической трактовке плана: температуры/restart,
тепловыделение/обмен, mass/C, generation/battery/fuel/actual consumption,
radiators/cooling/heating/automation, mount/source readiness, пассивная
обесточенная стоянка, физическое пополнение ресурсов без оплаты, actual
experiments/telemetry и сохранение старых каталогов/результатов.
Существующая прочность сохраняется; согласованные численные коэффициенты
износа отделяют генератор от двигателей. Новых failure/exposure/repair механик нет.
OUT: деньги/кошелёк/тарифы/покупки/стоимость ремонта/торговля/страховая выдача/
экономическая прогрессия, новые economic payload/UI, обязательные courier меню,
U2 configs/game runtime/protocol/server deployment и detection acceptance.

Один основной Developer; после реализации — независимая QA TF01–12 и один
scoped Code Review по actual diff и named risks плана, без дополнительных кругов.
Бюджет PRODUCT: PlanReview1/5, QA и CodeReview ещё NOT RUN.
Code Review IN — изменённые physical catalog/model/runner/validation/UI/IO paths
и необходимые callers; named risks — old replay drift, epsilon², panel reopening,
hidden dock consumption/reset, source bypass, смешение class/manufacturer и
перенос generator wear на engines. QA/report paths и fingerprints ADR3.28 обязательны.

# Аудит перехода веток

PR #50 содержал только план и independent PlanReview evidence. При интеграции
этих коммитов в документальную base-ветку GitHub автоматически отметил #50
merged (2026-10-26). PM ошибочно выбрал такой порядок интеграции; runtime в #50
не существовал. Main/production не менялись, GitHub merge/auto-merge API не вызывались.
Новая реализация начинается отдельным Draft PR от проверенного #49; история
#50 сохраняется, force push/revert чужой работы не используются.

Этот документ не заменяет source closure #49, runtime QA или finalize.
Merge в main и production-активация остаются действиями оператора.
