---
description: Project Beads — access by environment class (cloud intents, local agent via bd-wt.sh, operator sync)
globs: "**/*"
---

# Beads в U2 Lab

Beads (`bd`) — единственный task tracker. Memory Bank — контекст, PR/Git — evidence,
не task state. Project routing соответствует pinned U2 ADR-0042 и cloud amendment
`docs/plans/2026-10-05-cloud-execution.md`, C1–C6 (independent PLAN_READY).

Доступ — по классу окружения, их три: изолированный cloud, локальный агент (основной
checkout или git-worktree), оператор (синхронизация). Класс локального агента и embedded-режим
базы — **адаптация Lab** к ADR-0042, не новый канон: план
`docs/plans/2026-10-18-beads-local-agent-access.md`.

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

## Локальный агент: основной checkout и git-worktree

База u2-lab — embedded Dolt (`.beads/metadata.json`: `dolt_mode: embedded`, данные в
`.beads/embeddeddolt`, сервера нет). Single-writer в адаптации Lab — одна физическая база
основного checkout, а не один процесс: в неё пишут агенты основного checkout и его worktree.

- Читать и писать Beads только через `scripts/bd-wt.sh <cmd>` — и в основном checkout, и в
  worktree. Прямой `bd` не вызывать: в worktree auto-discovery может создать пустую базу.
- Обёртка пропускает только allowlist подкоманд: `ready show list search blocked children
  create q update close reopen dep comment comments note label`. Всё прочее (`delete`,
  `config`, `sql`, `init`, `export`, `import`, `dolt` и т.д.), пустая подкоманда, а также
  `--db`, `-C`/`--directory`, `--global`, `--ignore-schema-skew` в любой позиции → rc=2 до
  запуска bd. Значение аргумента, точно равное такому флагу, тоже отклоняется (fail-closed).
- В worktree обёртка сама подставляет `--db` основной базы по `dolt_mode`: `embedded` →
  `.beads/embeddeddolt`, `server` → `.beads/dolt` и живой dolt-сервер. Нет/невалиден
  `metadata.json`, неизвестный режим или нет каталога базы → отказ, bd не вызывается.
- В auto mode Claude Code без подтверждения разрешены только `scripts/bd-wt.sh` и
  `scripts/bd-read.sh` (`.claude/settings.json`); прямые `bd …` не разрешаются.
- Конфликт embedded-блокировки при параллельных агентах: команда завершается rc≠0 —
  повторить позже. Базу и `.beads/**` руками не править.
- `bd-sync-restore.sh`, `bd-sync-export.sh`, `bd-apply-intents.sh` агент не запускает —
  см. «Порядок синхронизации».

## Оператор: синхронизация и единственная физическая база

Source of truth синхронизации — `origin/beads-backup:.beads/issues.jsonl` (bd export).
Dolt — деталь хранения, не интерфейс синхронизации. Физическая база одна — в доверенном
primary checkout; пишут в неё только через bd API: оператор напрямую, локальные агенты —
через `scripts/bd-wt.sh`. Второй clone/машина параллельно не пишет.
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

## Порядок синхронизации

Sync-скрипты рассчитаны на одного писателя, а в базу основного checkout пишут локальные агенты.

- Локальные агенты **не** запускают `bd-sync-restore.sh`, `bd-sync-export.sh`,
  `bd-apply-intents.sh`. В auto mode их нет в allow-правилах; в остальных режимах действует
  прежнее `Bash(*)`, и защита — этот текст правил (deny для них — отдельное решение оператора).
- Оператор выполняет restore/apply/export только в **тишине**: локальные агенты в этот момент
  не пишут в Beads.
- **Export-first.** Есть неопубликованные локальные записи → сначала `bd-sync-export.sh`, потом
  apply. Applier требует совпадения живой базы со снимком.
- **Restore** — только когда remote ушёл вперёд (опубликовала другая машина) и локальных
  неопубликованных записей нет. Иначе restore отказывает конфликтом; это сигнал к ручной
  сверке, не к FORCE.
- **Одна пишущая машина.** В каждый момент локальные агенты пишут только на одной машине;
  перед сменой машины — export на старой, restore на новой.
- Записи локальных агентов видны облаку только после очередного export.

## Gates

Исходные девять generated IDs/data checkpoint сохраняются побайтно; checkpoint не remote
authority. Bootstrap queue содержит notes, не дубли задач и не close B0. Cloud amendment
разрешает reversible stacked T1–T6 preparation после deterministic cloud checks; B0/B6/B8,
P1–P14 и независимые QA/review/finalize/operator merge сохраняются. Пока bootstrap base
не принят, product PR merge-ineligible. Native activation в hosted Work NOT RUN; выполнять
на operator machine по frozen INSTALL с отдельным evidence.
