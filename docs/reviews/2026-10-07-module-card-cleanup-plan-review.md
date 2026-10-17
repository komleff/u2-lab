---
title: "Компактные карточки модулей — независимый Plan Review"
status: reference
version: "0.1"
date: 2026-10-07
related:
  - docs/plans/2026-10-07-module-card-cleanup.md
---

**Verdict: PLAN_READY · BLOCKER=0 · ADVISORY=0.**

Mode: PLAN_REVIEW, ulab-p2w, call1/5. Независимый Reviewer
`/root/fitting_adversarial_review`; Model: Codex/GPT-6 family, точный deployment
ID средой не сообщается. Подписано 2026-10-07.

Commit: `ebd481433b0de027625d8970d14a32aa75245970`, ветка feat/module-card-cleanup.
WHAT — прямое поручение оператора; whole HOW/Review Contract MC01–05 прочитан.
План пока untracked frozen working bytes, 9281B, SHA256 `59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4`;
до Developer product-кода предусмотрен реальный Draft PR. Согласование WHAT
повторно не требуется.

Reviewed-Paths / Git blobs:

| Path | Blob |
|---|---|
| src/app/fitting-ui/swap-dialog.ts | `007d2c3459fb6d3265ee344946f6d002e51c22bd` |
| src/app/fitting-ui/ship-view.ts | `7ffd0043441ed3b3901824fc61d8a1f273149ba0` |
| src/app/fitting-ui/instance-details.ts | `c5f1037a3365dc3b089018b689e0c2214fa8c7d1` |
| src/app/fitting-ui/presentation.ts | `0eb0452ce8e5582102113555e85acfaf2d4e8323` |
| src/app/fitting.ts | `ada108ddfdcc1a3dc7f6909b781a495a01457ebe` |
| src/app/fitting.css | `a5170feecea57e92bd8ae88a86fec92f5e45af93` |

Bound whole HOW: `docs/plans/2026-10-07-module-card-cleanup.md`.
**Content-Fingerprint:** `a12d5e737e4d83c348e7130511de709033d1ca6e54ee78d21d8820048105a81b`.
Рецепт: sorted шесть owner `path + NUL + Gitblob + LF`, затем whole HOW
`path + NUL + raw SHA256 + LF`. Явные SHA256 и состояние bytes — sealed
`.overgate-runtime/2026-10-07-module-card-cleanup-plan-review-binding.json`.
Рассмотрены представление и необходимые callback/CSS участки; это не Code Review
неизменной app и не проверка будущей реализации.

План достижим малой UI-правкой. Сейчас swap-dialog повторяет whole-fit cargo/laser
итоги для каждого кандидата и вычисляет cargo-sort по заменённой сборке. HOW
разделяет собственные характеристики изделия, общую свёрнутую preview и служебные
сведения. Existing nominalProcess/miningNominal/mass обеспечивают профильные
числа без нового расчётного owner; вместимость сортируется по модулю, удаляется
sort по числу лазеров. Источники и technical TTX сохраняются за раскрытием.

MC02 адресует реальный риск: кандидат и слот сейчас являются кнопками, поэтому
«i» должна быть sibling/native disclosure, а не вложенным interactive control.
Действие информации не меняет candidate/монтаж; existing apply/remove/close и
возврат фокуса сохраняются. MC03 проверяет их одной сквозной цепочкой, включая
несовместимость и batch. MC01 перебирает профильные данные всех семейств через
styled UI, без матрицы симуляций. Проверять нужно видимые строки; сохранённый
raw technical payload за «i» не равен видимой простыне карточки.

MC04 сохраняет реальные measured/stale/incompatible сигналы при удалении
неприменимого filler; скрытие предупреждения не разрешено. MC05 ограничивает diff
UI/test owners и сохраняет model/catalog/runner/IO/workspace значения. Footer4.1
меняет только номер интерфейса. Новых зависимостей, schema migration или крупной
реорганизации для этих AC не требуется. Rollback на immutable a6/Pages b2842bc
прямой; сохранённые результаты и сборки не мигрируются.

**NOT RUN:** runtime/browser/QA, tests/guards/build, numerical/historical/thermal
повторы, public/LAN/physical/native/U2/pipeline audit. Настоящая QA/Code Review
будущего diff остаются этапами плана. Advisory не расширяет scope; новых
обязательных требований не добавлено.

Report/binding0444, readback выполнен. Frozen reviewed plan RELEASED для PM
публикации; Reviewer **SEALED / IDLE**, PM solepublisher.
