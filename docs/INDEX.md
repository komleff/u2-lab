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
| [Cloud execution amendment](plans/2026-10-05-cloud-execution.md) | independent PLAN_READY / cloud QA PASS / scoped APPROVED | Single operator writer, stacked preparation, C1–C6 |
| [Cloud Plan Review](reviews/2026-10-05-cloud-plan-review.md) | PLAN_READY | Scoped amendment; bootstrap acceptance не заменяет |
| [Operator bootstrap](guides/operator-bootstrap.md) | operator actions NOT RUN | Exact checkpoint import, external trusted first export, later trusted applier |
| [Cloud tooling provenance](verification/cloud-tooling-provenance.json) | pinned source / exact target blobs | Узкая ulab adaptation, managed inventory unchanged |

Утверждённые правила и параметры остаются в U2. Search result — candidate, не authority.

## Power & Heat runtime v0.1

- [LAN / standalone запуск](user/local-network.md)
- [Первичная матрица](experiments/first-matrix.md)
- [Actual short matrix](experiments/first-matrix-results.json)
- [Retained64channels](verification/runtime-retention.json)
- [Worker/browser latency](verification/runtime-browser.json)
- [Фактический12h kernel](verification/runtime-long-kernel.json)
- [Проверка распакованного preview](verification/standalone-preview.json)

## Проверка реализации

| Документ | Статус | Область |
|---|---|---|
| [Исходная продуктовая QA](reviews/2026-10-05-product-qa.md) | FAIL / history | Семь воспроизводимых исходных ошибок |
| [Повторная QA](reviews/2026-10-05-product-qa-affected.md) | PASS affected surface / history | Закрыты семь ошибок и соседняя проверка gate бака |
| [Исходное Code Review](reviews/2026-10-05-product-code-review.md) | CHANGES_REQUESTED / history | Три отдельных blockers |
| [QA исправлений ревью](reviews/2026-10-05-product-review-fix-qa.md) | PASS affected surface / history | Численные/DOM/long/retention проверки предыдущего candidate |
| [Повторное scoped Code Review](reviews/2026-10-05-product-code-review-affected.md) | APPROVED / history | Четыре предыдущих code/test paths и exact QA evidence |
| [QA метаданных предыдущего candidate](reviews/2026-10-05-product-metadata-qa.md) | PASS / history | Документы candidate820, без нового runtime запуска |
| [Проверка внутреннего пика](reviews/2026-10-05-product-peak-qa.md) | FAIL / history | QB1/P13: пик внутри base-dt терялся в метрике |
| [QA исправления пика](reviews/2026-10-05-product-peak-qa-affected.md) | PASS affected QB1/P13 | Три dt,40 tests и необходимые численные/replay проверки |
| [Scoped review исправления пика](reviews/2026-10-05-product-peak-code-review.md) | APPROVED / 0 blockers,0 advisories | Пять code/test paths, entire VC и exact QA hash |
| [Итоговая привязка метаданных](reviews/2026-10-05-product-final-binding.md) | PM SELF-CHECK | Не новый verifier и не full acceptance |
| [Cloud QA](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-qa.md) | C1–C6 PASS | В bootstrap base, не full acceptance |
| [Cloud Code Review](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-code-review.md) | scoped APPROVED | В bootstrap base, B0/B6/B8 остаются открытыми |

Текущий runtime подготовлен для локальных экспериментов.56 unit tests и5 browser checks PASS,
1 screenshot-only case SKIP; свежий Developer S12h/dt0.01 —132.595s. Последняя независимая QA
и scoped review закрыли QB1/P13. Экспериментальные S/M не утверждают U2 SKU.
Физическое второе LAN устройство, native hooks, operator export/restore, trusted finalize
и merge остаются открытыми. Beads notes — PENDING, canonical9 задач неизменны.
