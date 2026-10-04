# U2 Lab — индекс документов

| Документ | Статус | Область |
|---|---|---|
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

Утверждённые правила и параметры остаются в U2. Search result — candidate, не authority.
