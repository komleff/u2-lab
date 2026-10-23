---
title: "F2 governor 0.3 implementation plan: independent Plan Review"
status: PLAN_READY / 0 blocker / 0 advisory after affected re-review
version: "1.1"
date: 2026-10-23
tags: [review, plan-review, product, f2, governor, architecture, balance, engineering]
related:
  - docs/plans/2026-10-23-f2-governor-pretest-design.md
  - docs/plans/2026-10-23-f2-governor-pretest-implementation.md
  - docs/reviews/2026-10-23-f2-u2-pm-integration-review.md
---

# F2 governor 0.3 implementation plan: independent Plan Review

## 1. Роль, scope и binding

Фактическая роль: независимый PRODUCT Plan Reviewer, единый review архитектуры,
game-design/balance и engineering plausibility. Модель: Codex/GPT-6 по идентификации
сессии; точный backend ID harness не предоставил. Reviewer работал READ-ONLY.

Reviewed paths:

- `docs/plans/2026-10-23-f2-governor-pretest-design.md`;
- `docs/reviews/2026-10-23-f2-governor-pretest-adversarial-review.md`;
- `docs/reviews/2026-10-23-f2-u2-pm-integration-review.md`;
- `docs/plans/2026-10-23-f2-governor-pretest-implementation.md`.

Рецепт fingerprints: `shasum -a 256` четырёх файлов, затем `LC_ALL=C sort`, затем
`shasum -a 256`. Repository HEAD во время review:
`6faa5f1c0a7c977473b70faa613bddf69731942a`; новые документы были untracked, поэтому
binding относится к их exact reviewed bytes.

Reviewer отдельно подтвердил SHA-256 source PR #893 на U2 commit
`df7e3cd699dafde5175b48a5853c2c04ece244b2`, F1 passport owner и `strizh.json`.

## 2. Исходный review

Fingerprint:
`3227c82897f266790bdd6e8c682587554001aaca64decb3135d275a56b24d733`.

Вердикт: **CHANGES_REQUIRED — 2 BLOCKER / 3 ADVISORY**.

| ID | Класс | Finding |
|---|---|---|
| `F2PR-B1` | BLOCKER | G5 разрешал closure при обязательном synthetic vector в `BLOCKED`; отсутствие `FAIL` недостаточно |
| `F2PR-B2` | BLOCKER | Pure service API не имел trusted paused/complete lifecycle owner и не мог отличить RUNNING state |
| `F2PR-A1` | ADVISORY | Нужно буквально отличить most-constrained-first bank processing от canonical instrumentation order |
| `F2PR-A2` | ADVISORY | Не был назван test-only 120 Hz execution path с теми же physical timer/RNG semantics |
| `F2PR-A3` | ADVISORY | Требовалось явно сохранить Quiet entry/hold и surfaces, использовать repair target и отделить profile rebind от service ABI |

Runtime-код не проверялся; findings относились только к исполнимости HOW.

## 3. Исправления PM

- Required synthetic T01–T34/T37–T39 получили обязательный final status `PASS`;
  любой другой status оставляет qualification незавершённой. T35/T36 остаются
  `NOT_RUN`; real passports/game balance могут честно оставаться `BLOCKED`.
- `RunContextV02.lifecycle` принадлежит runner/Worker. Единственный adapter
  `applyShipModelServiceV02` допускает `paused|complete` и отказывает
  `running|cancelled` до pure transition, без изменения state/totals/sequence/ownership.
- Bank processing буквально следует most-constrained-first comparator design §5.3.2;
  canonical pair order используется для evidence, а operation bound указан per allocator call.
- Test-only 120 Hz clock вызывает тот же internal algorithm и сохраняет physical meaning
  cooldown/exposure/failure/RNG; production export остаётся frozen 30 Hz.
- Persisted state явно содержит Quiet entry/hold и surface deployment. Service принимает
  additive charge/fuel и target durability; fit/profile rebind вынесен в отдельный
  conservative atomic transition.

## 4. Affected Plan Re-review

Fingerprint:
`8d396f38cf40e432befbce261cee778a8dfe2bd34d2073848c02be2b3732f7b7`.

Вердикт: **PLAN_READY — F2PR-B1/B2 и A1–A3 CLOSED; 0 open BLOCKER /
0 open ADVISORY.** Fingerprint независимо подтверждён reviewer до и после affected
проверки. Изменённая surface новых blocker-сценариев не дала; неизменённый ранее
проверенный scope не переоткрывался.

`git diff --check`: PASS. Для untracked implementation Markdown whitespace diagnostics
отсутствовали. Reviewer файлов и внешнего состояния не менял.

## 5. Границы вердикта

Runtime/tests/T-vectors, benchmark, browser/Worker, реальные passports и balance,
server/Unity transfer, station/session и native acceptance: **NOT RUN**. `PLAN_READY`
относится только к implementation plan на affected fingerprint и разрешает начать
Delivery First DEV с F2-G0 после создания canonical work item. Он не подтверждает
реализацию, готовность переноса в U2 или готовность F2.
