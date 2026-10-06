---
title: "Независимый Code Review: компактные карточки модулей"
status: changes-requested
version: "1.0"
date: 2026-10-07
related:
  - docs/plans/2026-10-07-module-card-cleanup.md
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/reviews/2026-10-07-module-card-cleanup-qa-r1.md
  - docs/reviews/2026-10-07-module-card-cleanup-qa-affected-r1.md
---

Mode: CODE_REVIEW. Item: ulab-p2w, вызов4/5.
Reviewer: независимый `/root/fitting_adversarial_review`.
Model: Codex, семейство GPT-6; точный serving/model ID среда не сообщает.
Commit: `85fee8c413bba111b0d9b5a58d8d77d4111bef8d`, base `ebd481433b0de027625d8970d14a32aa75245970`.

**Verdict: CHANGES_REQUESTED. BLOCKER=1, ADVISORY=0.**

Whole HOW/Review Contract MC01–05 прочитан целиком:9281B/SHA256 `59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4`. Whole accepted working WHAT:11824B/SHA256 `234255da891419ea6754282a7c5cdd850c3b4ea2449bdc1b1e3567b45ab830ee`; это frozen uncommitted PM bytes. Content-Fingerprint: `4b6022a0a7392317756adf28a9af6f0c0356e646b7f8709eb8f8f868ee656db8`; явные Reviewed-Paths/Gitblob/SHA256 и literal whole-contract recipe — в sibling `binding.json`.

Собственно проверены cumulative diff11paths: шесть UI owners (`presentation`, `swap-dialog`, `ship-view`, `instance-details`, `fitting.ts`, `fitting.css`) и пять изменённых tests. Необходимый unchanged контекст: DOM patcher, lab-view instance buttons, workspace read/prepare ownership, scenario process. Все11 текущих blobs/complete bytes независимо совпали с commit/release; sourceFP `97e3006935d5b0ff028397ab41d811dec460bc37f4e8c317ff9060c84ce05810`. Все52 остальных tracked src независимо byte-equal базе; это проверка равенства, не новый core audit. BuildFP `d887f51bfafe196dc358430f7d2c28a433ff387130ef577140ed84cc0a857559` — external release provenance, assets/build не перепроверял.

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|----------|-----------|-------------|--------|------------------------|
| 1 | IMPORTANT | [BLOCKER] CR-MC-B1: пустой ID invoker вызывает исключение при закрытии сведений | src/app/fitting.ts:159 | fix now | MC02/03/04, новая регрессия focus/Close/Escape |

**CR-MC-B1.** `[data-instance]` handler сохраняет `b.id` (fitting.ts:280). Существующие builtin ring button (ship-view.ts:65) и измеренная таблица (lab-view.ts:171) имеют этот атрибут, но не имеют `id`. Их ID — `''`; nullish fallback в closeDialog:159 его не заменяет. `el(returnId)` в166 строит в73 `'#'+CSS.escape('')`, то есть невалидный selector `'#'`. Close/Escape закрывает dialog, затем бросает SyntaxError и не выполняет нормальный возврат фокуса. В baseline этих путей instance return ID не использовался, fallback был fit-start.

Воспроизведение: раскрыть desktop «Схема слотов», нажать встроенный узел, закрыть сведения ✕/Escape; аналогично открыть экземпляр в таблице измерений. Expected: без exception, рабочий возврат фокуса. Собственный bounded Chromium DOM proof exact source-expression получил SyntaxError для обоих id-less callers, тогда как именованный `info-builtin:laser` прошёл; baseline fallback прошёл. Raw `idless-focus-proof.json` и запускаемый `.mjs` сохранены рядом. Это source/DOM proof, **не** новый полный native app workflow.

Минимальный fix класса: не отправлять пустой ID в lookup; восстановить реальный invoker либо безопасный baseline fallback и сохранить точный focus для именованных i. Durable regression должна включать оба id-less caller, Close/Escape, отсутствие page exception и неизменность fit/result. Одного повторного colon-ID test недостаточно.

Остальная адресная поверхность: профильный renderer берёт собственные numerics/material mass, cargo/mining не суммирует фит; auxiliary выводится только положительный. Каталожная i — sibling native details, installed i — sibling button; JSON/текст экранируются. Применение/снятие/validation/batch owners сохранены, preview свёрнут, warnings/stale и measured channels остаются. Fallback nominalProcess очищает foreign group только в копии условий для reference; пользовательская readiness не нормализуется. Изменения старых test assertions соответствуют принятому cleanup; новые тесты действительно проверяют selection, fit bytes/revision и focus, но пропустили id-less invoker.

QA2 literal FAIL и QA3 affected PASS полностью прочитаны и hashes сверены. QA3 закрывает **исходный MC-UI-B1 colon-ID**:4groups/8cycles/errors0 и export equality; MC01/03/05 плюс Worker/stale/footer перенесены исторически. Этот корректный узкий PASS не покрывает CR-MC-B1. Guard489unit/51browser+SKIP/26cloud — evidence Developer/PM, не мой fresh run.

**NOT RUN / OUT:** полный guard/build/browser replay, numerical/thermal/H₂/TTX/flight/Worker campaigns, packaging/Pages/native physical device, общий redesign и operator merge. Пользовательские tabs/серверы не менялись. Не требуются новые стилистические или физические правки. Review завершён; source freeze RELEASED для PM triage/fix, Reviewer IDLE. Прежние signed reports не изменены.

Подписано: независимый Reviewer `/root/fitting_adversarial_review`, 2026-10-07.
