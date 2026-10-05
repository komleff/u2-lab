---
title: "Ship Fitting v0.2 — принятие дизайна и запуск реализации"
status: active
version: "1.0"
date: 2026-10-05
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
  - docs/plans/2026-10-05-ship-fitting-v0.2.md
  - docs/verification/ship-fitting-v0.2-contract.md
---

# Решение оператора

2026-10-05, Asia/Novosibirsk. Дмитрий Комлев:

> Дизайн и план одобрен. Приступай к выполнению как PM_ROLE.md.

Приняты GDD0.2, implementation planT1–T7 и Verification Contract SF01–20 на reviewed
candidate676862a980d4f6c41f6de279ebe41231cf2289ba. Five-path + entire-VC fingerprint:
`550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`.
Metadata HEAD446bade сохраняет те же reviewed blobs. Independent design/plan PLAN_READY
уже получен; повторный Plan Review для неизменного принятого WHAT не требуется.

Принятие включает количественные lab hypotheses, UX hierarchy, K_use fixed mining group,
first limiter и bounded recovery summaries. Это разрешение лабораторного эксперимента;
оно не утверждает неизвестные ТТХ/производственные рецептуры каноном U2.
Draft-формулировки в frozen GDD/плане описывают прошлую стадию. Current authority — это
решение поверх них, без изменения прошедших review содержательных blobs.

PM организует одного Developer на всё work item, затем independent QA и один scoped
Code Review. Existing PRODUCT verifier budget: использован1/5, affected r2 не новыйlaunch.
Runtime acceptance, base bootstrap gates, native/operator acceptance и merge остаются
отдельными условиями. Реализация — reversible working-branch preparation; main не меняется.

Дополнительный запрос: подготовить UX/UI ТЗ для Claude Design, который оператор может
попросить собрать HTML/SVG макет. ТЗ конкретизирует размещение принятого интерфейса;
не меняет численные правила. Расчётная часть не ждёт внешний макет.
