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
- [Проверка прежнего preview0.1](verification/standalone-preview.json) — history
- [Проверка standalone0.1.1 / non-local HTTP](verification/lan-http-preview.json)
- [Отчёт и передача агенту на Mac](handoffs/2026-10-05-mac-lan-http.md)

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
| [LAN HTTP baseline QA](reviews/2026-10-05-lan-http-qa.md) | FAIL / history | secure=false / randomUUID unavailable, Start/Reset/Step падали до Worker |
| [LAN HTTP affected QA](reviews/2026-10-05-lan-http-qa-affected.md) | PASS affected P1/P10 | Start/reset/new M/step, ID и stale-message cases; фактический Xiaomi NOT RUN |
| [LAN HTTP scoped Code Review](reviews/2026-10-05-lan-http-code-review.md) | APPROVED / 0 blockers | Opaque IDs, HTTP API gate, regression и exact QA evidence |
| [LAN HTTP итоговая привязка](reviews/2026-10-05-lan-http-final-binding.md) | PM SELF-CHECK | Metadata landing; не новый verifier/full acceptance |
| [Cloud QA](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-qa.md) | C1–C6 PASS | В bootstrap base, не full acceptance |
| [Cloud Code Review](https://github.com/komleff/u2-lab/blob/bootstrap/overgate-v4/docs/reviews/2026-10-05-cloud-code-review.md) | scoped APPROVED | В bootstrap base, B0/B6/B8 остаются открытыми |

Предыдущий runtime0.1.1 подготовлен для локальных экспериментов.56unit и6browser checks PASS,
1screenshot-only case SKIP; type/build PASS. Exact source CI37272666370/37272662118 SUCCESS.
LAN HTTP affected QA/scoped review закрыли отсутствие randomUUID вне secure context;
контекст браузера secure=false воспроизведён собственными assets, физический Xiaomi NOT RUN.
Предшествующий physical12h132.595s сохранён для неизменных model/kernel/Worker paths;
новый локальный12h ради UI fix не запускался. QB1/P13 closure сохранён. S/M не утверждают U2 SKU.
Физическое второе LAN устройство,native hooks,operator export/restore,trusted finalize
и merge остаются открытыми. Beads notes — PENDING,canonical9 задач неизменны.

## U2 Ship Fitting v0.2 — дизайн

- [GDD: оснастка и полезность корабля](gdd/gdd_u2_ship_fitting_v0.2.md) — принят оператором2026-10-05; runtime implementation started.
- [Исследование current owners и UX](research/ship_fitting_source_synthesis.md) — routed41-source synthesis.
- [Source manifest](research/ship_fitting_sources.json) — exact U2commit/blob/status/version.
- [План реализации](plans/2026-10-05-ship-fitting-v0.2.md) — T1–T7, independent PLAN_READY; PO approval recorded; T1–T7 execution started.
- [Verification Contract SF01–20](verification/ship-fitting-v0.2-contract.md) — numerical/domain/UI/replay/retention AC и review scope.
- [Первоначальный proposal](product/ship-fitting-v0.2-proposal.md) — historical reference, superseded.

- [Независимый design/plan review r1](reviews/2026-10-05-ship-fitting-plan-review-r1.md) — CHANGES_REQUIRED/history; B1 group accounting и B2 metric history закрыты affected r2.

- [Affected design/plan review r2](reviews/2026-10-05-ship-fitting-plan-review-r2.md) — PLAN_READY для обеих частей; active BLOCKER0, A1/A2 advisory сохранены.
- [Итоговая привязка design evidence](reviews/2026-10-05-ship-fitting-final-binding.md) — PM deterministic check, не runtime QA.
- [Draft PR3](https://github.com/komleff/u2-lab/pull/3) — scoped docs/design/plan, PO approval recorded; plan evidence preserved.

- [Принятие дизайна и запуск реализации](product/ship-fitting-v0.2-acceptance.md) — current operator authority поверх frozen GDD/плана.
- [ТЗ UX/UI для Claude Design](ux/ship-fitting-v0.2-claude-design-brief.md) — самодостаточный brief для HTML/SVG desktop/mobile макетов.

## Ship Fitting0.2.0 — история candidate до interval closure

- [Работа с оснасткой и экспортом](user/ship-fitting.md) — функциональный workflow и границы лаборатории.
- [Контролируемая серия Pony/IndustrialM1/2/3 и L3+hold](experiments/ship-fitting-matrix.json) — полные условия, численные snapshots и фактические незавершённые исходы.
- [Чувствительность и ограничивающие сценарии](experiments/ship-fitting-sensitivity.json) — экспериментальные крайние условия, не вероятности.

Исторический QA r2: 99 PASS / 1 external NOT RUN; Code Review r1 выявил CR-B1/CR-B2. Их окончательное закрытие — QA r4 / Review r3, зарегистрированные ниже. Public Pages, физическое второе
устройство, native/bootstrap/operator acceptance и merge остаются отдельными gates.

- [Power & Heat Lab — UX/UI ТЗ для Claude Design](ux/power-heat-lab-claude-design-brief.md).

- [QA r1](reviews/2026-10-05-ship-fitting-qa-r1.md) — immutable FAIL history.
- [Developer fix r1](reviews/2026-10-05-ship-fitting-developer-fix-r1.md) — cargo/architecture/ordinary SKU fixes.
- [QA r2](reviews/2026-10-06-ship-fitting-qa-r2.md) — 99 PASS / 1 external NOT RUN.
- [Code Review r1](reviews/2026-10-06-ship-fitting-code-review-r1.md) — CHANGES_REQUESTED: CR-B1/CR-B2.
- [Developer fix r2](reviews/2026-10-06-ship-fitting-developer-fix-r2.md) — input guards, boundary/atomic-import regression.
- [Runtime binding](verification/ship-fitting-v0.2-runtime-binding.json) — explicit paths and entire VC; no verdict.

## Ship Fitting — история interval fix до QA r4 / Review r3

- [2026-10-06-ship-fitting-qa-r3.md](reviews/2026-10-06-ship-fitting-qa-r3.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-code-review-r2.md](reviews/2026-10-06-ship-fitting-code-review-r2.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-developer-fix-r3.md](reviews/2026-10-06-ship-fitting-developer-fix-r3.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.
- [2026-10-06-ship-fitting-developer-fix-r3-tablet-addendum.md](reviews/2026-10-06-ship-fitting-developer-fix-r3-tablet-addendum.md) — immutable history; closure — QA r4 / scoped Review r3 ниже.

## Claude Design v2.1 — текущий приоритет интерфейса

- [Передача Claude](ux/claude-design/README.md) и [обоснование v2.1](ux/claude-design/ship-fitting-power-heat-ux-v2.1.md) — exact PR5abbd2943 source; 22артборда, canvas/tokens.
- [Принятая UI-область и решения переноса](product/claude-design-ui-v0.2-acceptance.md) — поручение оператора; новые шахтёрские миссии/багфиксы отложены.
- [План интерфейса](plans/2026-10-06-claude-design-ui.md) — U1–U6; PLAN_READY и реализация, текущая affected QA ещё открыта.
- [Приёмка UI01–18](verification/claude-design-ui-v0.2-contract.md) — функции/данные/mobile/LAN и сохранение модели.

## Claude Design UI — проверка и локальный запуск

- [Независимый Plan Review: PLAN_READY](reviews/2026-10-06-claude-design-ui-plan-review-r1.md) — exact9aa, историческая связка плана,0blockers.
- [72 source-first QA cases](verification/claude-design-ui-v0.2-qa-cases.md) — методы приёмки UI01–18; подготовка не runtime verdict.
- [Локальный интерфейс и варианты](user/ship-fitting-ui.md) — запуск4183, поведение сборок/снимка A.
- [Численный QA r4](reviews/2026-10-06-ship-fitting-qa-affected-r4.md) и [scoped Code Review r3](reviews/2026-10-06-ship-fitting-code-review-r3.md) — immutable закрытие прежних interval/source дефектов на903; UI туда не входит.

- [Scoped Code Review Contract](verification/claude-design-ui-code-review-contract.md) и [полный runtime/source binding](verification/claude-design-ui-runtime-binding.json) — affected UI scope, не verdict.

## Claude Design UI — initial QA и исправленная промежуточная сборка

- [Developer r1](reviews/2026-10-06-claude-design-ui-developer-r1.md) — исходный перенос на ab8353d; immutable history.
- [Независимая QA r1](reviews/2026-10-06-claude-design-ui-qa-execution-r1.md) — 54 PASS / 17 FAIL / 1 deferred NOT RUN, 11 групп UI-дефектов; исходный FAIL сохранён.
- [Sealed QA evidence manifest](reviews/2026-10-06-claude-design-ui-qa-r1-evidence.json) — hashes 52 файлов локальных доказательств.
- [Developer fix r1](reviews/2026-10-06-claude-design-ui-developer-fix-r1.md) — ff01dfa, D01–D11 исправлены, guard 185 unit / 26 browser PASS + 1 inherited SKIP; independent affected QA и scoped Review pending.
- Промежуточный стенд — 4183; прежний Ship Fitting и первая Лаба Legacy — 4186. Ссылки и сохранение вариантов в [руководстве](user/ship-fitting-ui.md).

## Claude Design UI — D12 mobile error fix

- [Affected QA r2](reviews/2026-10-06-claude-design-ui-qa-affected-r2.md) — immutable FAIL: 39 PASS / 3 FAIL из 42 исходных ID; D01–D11 закрыты, один новый D12 на трёх адресах.
- [Sealed affected evidence](reviews/2026-10-06-claude-design-ui-qa-affected-r2-evidence.json) — hashes 55 read-only files.
- [Developer fix r2](reviews/2026-10-06-claude-design-ui-developer-fix-r2.md) — c8f8b36, один CSS-перенос длинной ошибки и true-mobile регрессия; 185 unit / 27 browser PASS + 1 inherited SKIP.
- Текущий стенд: [4183](http://192.168.68.65:4183/?v=claude-ui-c8f8b36). Независимая targeted QA D12 и один scoped UI Code Review ещё pending; model/mission остаются за рамками.
