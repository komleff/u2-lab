---
description: Project Beads — single operator writer, cloud read-snapshot/write-intents
globs: "**/*"
---

# Beads в U2 Lab

Beads (`bd`) — единственный task tracker. Memory Bank — контекст, PR/Git — evidence,
не task state. Project routing соответствует pinned U2 ADR-0042 и cloud amendment
`docs/plans/2026-10-05-cloud-execution.md`, C1–C6 (independent PLAN_READY).

## Hosted Work / изолированный cloud

- Читать опубликованный snapshot только через `scripts/bd-read.sh ready|list|show <id>`.
  Отсутствующий/недоступный remote snapshot — read FAIL, не пустая canonical база.
- Записывать только append-only `.bd-intents/<queue>.jsonl` с уникальными intent IDs;
  формат/реальные `ulab-*` refs и earlier-declared `tmp:*` handles — `.bd-intents/README.md`.
- Очередь и новые work updates помечать PENDING: это unapplied requests, не canonical
  статус. Нельзя считать `close` intent доказательством закрытия задачи.
- Не запускать bd (даже read-команды могут поднять Dolt), не ставить bd, не мутировать
  `.beads/dolt/**`, не запускать applier wrapper/restore/export или push beads-backup.
- Offline проверки разрешены на engine с fixture index и изолированным stub:
  `node --test scripts/tests/test-bd-cloud.mjs`. Wrapper `--dry-run` читает live bd export;
  engine comment к existing issue может читать bd comments. Это не offline/no-bd API.

## Основной checkout оператора — единственный writer

Source of truth синхронизации — `origin/beads-backup:.beads/issues.jsonl` (bd export).
Dolt — деталь хранения, не интерфейс синхронизации. Использовать только bd API из
доверенного primary checkout, не из linked worktree/второго concurrent writer.
Project config держит `export.auto: false` и `backup.git-push: false`, `sync.remote` unset;
Dolt remotes не назначать. Автоматический `bd prime/setup/onboard` не меняет этот канон.

Первоначальный импорт неизменного generated checkpoint и первый export для отсутствующей
remote authority: `docs/guides/operator-bootstrap.md`. Только новый primary clone без DB;
existing remote/nonempty DB требует reconciliation, не повторного импорта поверх данных.
Первый export — внешний проверенный frozen OverGate v4.0.0-rc.1
`633937250fa8f47b49f928c1d8781ab17fe8c8e3`. Новый applier не становится trusted от запуска
из bootstrap PR-ветки: сначала независимый review и operator merge tooling в trusted main.

После принятия tooling: restore-before-apply/export через `scripts/bd-sync-restore.sh`,
`scripts/bd-apply-intents.sh <queue>`, `scripts/bd-sync-export.sh`. Wrapper сохраняет
fetch/divergence/trust/lock guards, валидирует всю очередь до mutations и публикует
snapshot после изменений. Receipt — локальный кэш внутри Git common dir; database
markers сохраняют idempotency после его потери. Validation failure = zero mutations;
execution failure может оставить частичные изменения и требует согласованного retry.

Last-seen/drop/divergence/trusted-tooling guard failure нельзя обходить. Не применять
`BD_SYNC_FORCE`, `BD_APPLY_SKIP_SYNC_CHECK`, `BD_APPLY_TRUST_LOCAL_TOOLING`, `--no-export`
в operator recovery или landing. При failure остановиться и reconcile через trusted
helpers. Snapshot/Dolt руками не править, ветку snapshot не force-push/delete.

## Gates

Исходные девять generated IDs/data checkpoint сохраняются побайтно; checkpoint не remote
authority. Bootstrap queue содержит notes, не дубли задач и не close B0. Cloud amendment
разрешает reversible stacked T1–T6 preparation после deterministic cloud checks; B0/B6/B8,
P1–P14 и независимые QA/review/finalize/operator merge сохраняются. Пока bootstrap base
не принят, product PR merge-ineligible. Native activation в hosted Work NOT RUN; выполнять
на operator machine по frozen INSTALL с отдельным evidence.
