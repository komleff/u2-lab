---
title: "Независимый Plan Review: рабочее пространство ГД v4"
status: PLAN_READY
version: "1.0"
date: "2026-10-06"
related:
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/plans/2026-10-06-gd-workspace-v4.md
  - docs/verification/gd-workspace-v4-contract.md
---

# Verdict: PLAN_READY

**BLOCKER=0, ADVISORY=1 (не требует изменения плана).** HOW достижимо покрывает принятые WF01–15, сохраняет один Worker и численные источники, предусматривает проверки открытия результата и атомарного отказа. Оператор уже одобрил выполнение и футер; повторного согласования WHAT не требуется. Это разрешение перейти к Developer, не утверждение готового runtime/UX PASS и не merge approval.

- Mode: `PLAN_REVIEW`, по `.agents/RV_ROLE.md` v2.1 и релевантному lifecycle PM_ROLE3.0.
- Role: независимый Reviewer, существующая session `/root/fitting_adversarial_review`.
- Model: Codex; точный provider/model ID среда не сообщила, конкретная модель не выдумывается.
- Commit: `f52fa386a71183267e75d9b03def8dfa579d6af3`.
- Initial read: HEAD `66fb5529011f892045eee4947d2a70fb1fbfba4c` и три working documents. После commit независимо подтверждено byte/blob equivalence; движения HEAD не изменили acceptance surface.
- Source WHAT: accepted0.2 `ship-fitting-gd-workspace-v4.md`; HOW: plan0.2; весь Verification Contract0.1.
- Content-Fingerprint: `19d33e57db386243979ea5bfc76adf169f96c25958099c87f62d9eee32952e22`.

# Reviewed-Paths и binding

Три документа прочитаны полностью, включая весь contract. Таблица связывает рабочие SHA256 с фактически committed Git blobs:

| Explicit acceptance path | Git blob | SHA256 working/committed bytes |
|---|---|---|
| `docs/plans/2026-10-06-gd-workspace-v4.md` | `2f93b80e7b2b86906cc4cf021d39eade5459a4c6` | `15a814280f18df460e530bb5cf8bcbc9235ceb98d5eeb2f0ce9b76bd7905060f` |
| `docs/product/ship-fitting-gd-workspace-v4.md` | `1881e6d09c8d551eb2d2a6f07fa99f16a59495cc` | `747e3494bb22d1f1f42922c4d08da4777d7d61ec9099b3bd9b6baec14d1bafdb` |
| `docs/verification/gd-workspace-v4-contract.md` | `f71682ad5a7a6820d5a6b1c8eb9c0963da9ba853` | `f50fca6976ac2f73daf4e4cc5653b6aabf23b7071e83e34f2febdf2c0a9160e5` |

Метод ADR3.28: SHA256 от UTF-8 `path SP git-blob-id LF` для этих трёх paths, отсортированных по path, затем **точных bytes всего** `docs/verification/gd-workspace-v4-contract.md` (не выбранных paragraphs). CRLF нормализуется в LF; в прочитанном contract LF,7970B. Payload8225B. Head и начальные working SHAs — audit metadata, не замена content binding.

Для проверки технической достижимости прочитаны relevant supporting owners/snippets (это context, не новый Code Review):

| Supporting path | Git blob at reviewed HEAD |
|---|---|
| `.agents/RV_ROLE.md` | `6e13e1023c90621172135e206e01fed8bd6b8c28` |
| `.agents/PM_ROLE.md` | `9861c3e2254b4f16bda32a832e5950d01cee7ea3` |
| `.agents/PIPELINE_ADR.md` §§3.28–3.29 | `473e7f77413284d00588ef9033b5d117e09ac661` |
| `src/app/fitting-workspace.ts` | `6abda3960cfae3e6b18eb0e72a8692695bba0d3d` |
| `src/app/fitting-session.ts` | `79d13341654ba9f4ae32f77dfbd82940df5e2d32` |
| `src/io/fitting-json.ts` | `f77387afd849d765ad24e8b2ba973637e6ad92a5` |
| `src/model/v2/types.ts` | `a3d839c0837a3abe14a477945bae8f0d98f6e956` |
| `src/fitting/types.ts` | `3d424945b306c669b6216bc56d1b00be6ee606d6` |
| `src/scenarios/fitting.ts` | `92042fa5db627550c9c0fe824cd75d3c5a38ba58` |
| `src/runner/run.ts` (relevant result/owner context) | `8145e6149237b37148c37056d0c8966f8f918daf` |

# Acceptance, порядок и границы

| Принятый outcome | HOW / проверка | Оценка достижимости |
|---|---|---|
| WF01–03: открыть объект, собрать/clone/применить preset | Этап1 identity/workspace; этап3 typed opening; V4-01/05/06 | Переиспользуются fit/session/catalog validation. Preset честно заменяет весь fit, автоматический hull-transform не требуется |
| WF04–06: run/navigation/controls/next draft | Этап1; V4-02, invariants1–2/5 | Current workspace уже разделяет active.spec/variant owner. Меняется next-conditions policy, не active spec или Worker protocol; второй Start запрещён |
| WF07–09: обзорные/полные графики, стабильные каналы, выбранный interval | Этап2; V4-03, invariant4 | Используется реальный retained trace. Mean/min/max/count и selected interval явно отличены от instant/final; overview не требует нового ядра или восстановления отброшенных ticks |
| WF10–12: paused reference, fixed baseline, stale result | Этап2; V4-04; V4-02 для ownership | Frozen snapshot копируется независимо от variant/draft; baseline не зависит от sort. Tested revision/fit/conditions показываются из result spec, draft отдельно |
| WF13: supported result opening, экспорт, atomic refusal | Этап3; V4-06/07, invariant3 | Нынешний spec-only parser недостаточен — план прямо требует проверки потребляемых result fields, конечности/размеров/интервалов/ownership до показа и атомарного отказа. Format/model owners не меняются |
| WF14: реальная цепочка desktop/tablet/LAN touch | V4-07, durable regressions и own QA execution | Названы1440/820/plain LAN390, genuine Worker, RUNNING/PAUSED/MAX; физический tablet отдельно, эмуляция не выдаётся за него |
| WF15: версия в футере | Этап1; V4-01/07 | Точный текст «интерфейс v4.0» desktop/touch; package/model/schema не переименовываются, controls/chart не перекрываются |

Существующие `MiningConditions`/`makeMiningRun` уже поддерживают temperatureK, длительности фаз и repeat; expose этих полей не требует новой физики. Local variants и experimental origins уже существуют. V4-05 проверяет хотя бы одно поддерживаемое численное поле помимо powerW и valid/invalid input, не открывает произвольный канон ТТХ.

Этапы связаны разумно: сначала постоянные identity/next draft, затем trace/comparison, затем открытие того же typed snapshot. Один Developer и переиспользование owners уменьшают rework shared state. Изолированные screen-tests обновляются на принятый WHAT; numerical/ownership assertions сохраняются. Новой зависимости, миграции формата или data-store не требуется.

Проверки адресны и воспроизводимы: toggle первого канала, measured/draft mismatch, sorting baseline, paused reference, imported hull/conditions, malformed/nonfinite/invalid arrays/intervals, atomic preservation. Полные native export→fresh page→open цепочки дополняют unit tests и guards. Invariants удерживают late messages, previous-result-before-first-chunk, literal labels и long-array behavior. QA не подменяется элементными selectors.

Rollback достаточно конкретен для обратимого frontend: отдельный4188/standalone LAN build, сохранённые4183/4186 dist не подменяются; оператор возвращается к прежней ссылке. План не делает release нового UI условием работоспособности старых стендов.

Scope уже минимизирован по outcome: full history/autosave, overlay/zoom, arbitrary ТТХ, hull transplantation, mission/refuel и protocol attribution исключены. Их добавление не требуется для формального закрытия аудита. Повторный broad audit текущего v3, matrix/12h или reviewer swarm не нужен.

# Finding / triage

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| 1 | MINOR | [ADVISORY] В V4-04 явно отмечать освобождение Worker перед запуском B | `docs/verification/gd-workspace-v4-contract.md:26` | reject with rationale | Обязательная правка плана не требуется: singleWorker invariant и WF05 уже определяют допустимый путь; PM подтвердил Cancel/terminal A перед Start B. Это уточнение execution, не расширение WHAT |

Контрпример к буквальному shorthand: paused A → Freeze → Start B немедленно обязан отказать, поскольку pause не завершает Worker. Минимальная допустимая последовательность: Freeze копирует A, штатный Cancel/terminal освобождает active, затем Start B; reference A остаётся прежним partial snapshot. Нельзя ради V4-04 скрыто разрешать второй Worker, подменять frozen A terminal snapshot или принимать draft conditions за active. Блокера нет: outcome достижим существующими разрешёнными командами и явно согласованной HOW-интерпретацией.

# Own verification и not-tested surface

Own: полное чтение трёх acceptance docs; relevant owner/role reads; сценарная проверка порядка/ownership/testability/rollback; независимый SHA256/Git blob/fingerprint расчёт и сравнение working bytes с committed HEAD. Старый signed GD/UX audit использован как контекст триажа, не переисполнен и не изменён. Это evidence плана; исторические runtime counts не выдаются за новые тесты.

Runtime v4 ещё не реализован. Unit/browser/build/CI/verify/live servers не запускались и не менялись Reviewer. Не проверены готовая UX/completion, actual mobile/rendering, новый result parser, физическое устройство, numerical kernel/catalog широким sweep, full matrix/12h/GC, public/native/base/main acceptance. Эти проверки относятся к Developer/QA/последующему scoped Code Review по contract, а не текущему PLAN_READY.

Подпись: независимый Reviewer, Codex (exact model ID unavailable), `/root/fitting_adversarial_review`,2026-10-06. Blockers отсутствуют, advisory не расширяет scope. PM — единственный publisher; runtime/tests/product/Beads/Git/PR/server writes Reviewer не выполнял. Предыдущие audit seals неизменны.
