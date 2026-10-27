---
title: "Рейсовое управление2: источник измерений и граница передачи"
status: "Developer candidate / independent QA/review pending"
date: 2026-10-27
beads: [ulab-9do, ulab-b3y]
---

# Передача PR53

[PR53](https://github.com/komleff/u2-lab/pull/53) наследует физический C2 и добавляет
только явный `mission/2`, paid event forecast/cooperative planning и фактический
счётчик существующего UI. PLAN_READY0B0A на HOW0.2 — independent Plan Review1/5.
Developer source S3 `d43e6a45f4044fa2a1082f401df9b5aaa3b933ea`; source3c8dd33
содержит runtime/tests, S2 исправляет только diagnostic fixed-heat setup,
S3 — разделитель E6 и момент UI screenshot без изменения физического расчёта.

[22 receipts/CSV/manifest](../research/2026-10-27-ermak-flight-corrections/README.md)
разделяют actual cycles на1200/3600/10800 s, literal mission1 и explicit2 старых
физических specs, full weak leg и paid braking control, stationary3MW+idle,
reference0.5/0.25 и actual Worker latency. На10800 s Ермак none/ActiveOFF завершил7
рейсов, passive3/ActiveON —10. Work/fuel/heat/phase difference измерен без подгонки.
Это не norm на три часа, не обещание произвольного fit или многосуточной работы.

Любой старый saved mission1, включая C2catalog0.3.4, остаётся literal.18 прежних
receipts/64:03/рейс5 исторические; они не измеряют новый default2. User workflow
copy/export/reopen/checkpoint/frozen сохраняется; scale отдельно от actual counter.
Нет новой экономики/repair/failure-exposure/autopilot product или server protocol.
U2 physical owners и restart-schema230/480 blocker прежние. QA2/5, scoped Review3/5,
normal current guard/CI — отдельные этапы, merge/deploy выполняет оператор.
