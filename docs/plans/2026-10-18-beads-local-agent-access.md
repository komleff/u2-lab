---
title: "Beads — самостоятельный доступ локальных агентов (embedded + beads-backup)"
status: proposed
version: "0.1"
date: 2026-10-18
tags: [plan, beads, pipeline, worktree, critical]
---

# Beads: доступ локальных агентов

Режим: **CRITICAL** — pipeline governance (правила доступа к трекеру, разрешения агента,
managed-обёртка OverGate). Ветка `chore/beads-agent-access` от `main` 6372717, отдельная
worktree `u2-lab-wt-beads-access`.

Authority: решения оператора 2026-10-18 — (1) схема «embedded Dolt + синхронизация через
`origin/beads-backup`», без миграции базы; (2) узкий allow-список bd-команд в
`.claude/settings.json`. Канон доступа по классу окружения — pinned U2 ADR-0042
(`cdc490e3517c8455f662f82579c45813cdbb9a76`); `docs/plans/2026-10-05-cloud-execution.md` C1–C6
не меняется.

## Target → as-built → gap

**Target.** Локальный агент u2-lab — в основном checkout и в git-worktree рядом с ним —
сам читает и пишет задачи Beads (`ready/show/list/create/update/close/dep/comment`) без
участия оператора. Dolt остаётся деталью хранения; кросс-машинная синхронизация — только
`origin/beads-backup` (`scripts/bd-sync-restore.sh` / `scripts/bd-sync-export.sh`). Облачный
класс работает как раньше: снимок + `.bd-intents/`.

**As-built (проверено 2026-10-17/18 на macOS, bd 1.2.2 Homebrew, bash 3.2.57).**

1. База u2-lab — **embedded**: `.beads/metadata.json` `dolt_mode: embedded`, данные в
   `.beads/embeddeddolt/ulab`, `dolt-server.pid/port` нет. В U2 — `dolt_mode: server`,
   `.beads/dolt` + живой sql-server.
2. `scripts/bd-wt.sh` и `scripts/lib/bd-env.sh` (managed OverGate) написаны под server-режим U2:
   `bd_env_main_db` ищет `<main>/.beads/dolt`, `bd_env_dolt_alive` требует pid/port сервера.
   Факт из worktree: `BD_BIN=echo bash scripts/bd-wt.sh ready` → `ERROR: основная база Beads не
   найдена: …/u2-lab/.beads/dolt`, rc=1. Обёртка в u2-lab нерабочая при любом состоянии базы.
3. `.claude/rules/beads.md` и `AGENTS.md` описывают только два класса: hosted/cloud («не запускать
   bd») и «основной checkout оператора — единственный writer». Класса «локальная worktree» и
   упоминания `bd-wt.sh` нет. Агенты читают это как запрет на bd и уходят в intents.
4. Claude Code auto mode отклоняет `bd ready` в основном checkout как «Modify Shared Resources»:
   широкое `Bash(*)` в auto mode не действует, узких allow-правил для bd нет.
5. Эксперимент в одноразовом репозитории (scratchpad, bd 1.2.2 embedded, метаданные `.beads/`
   закоммичены как в u2-lab): из worktree auto-discover находит основную базу и **не** создаёт
   пустую; `bd --db <main>/.beads/embeddeddolt` работает; 3 записи из worktree + 3 из main +
   3 чтения одновременно — 9/9 rc=0, 7/7 задач в базе, `bd export --all` — 7 строк. Поломка U2
   («пустая база в worktree», lock сервера) — свойство server-режима и не воспроизводится.
6. Хуки пайплайна на macOS исправны: класс U2-3ukfq (`$имя` вплотную к не-ASCII под bash 3.2)
   — 0 находок по `.claude`, `.agents`, `scripts`, командам `settings.json`; `pre-bash.sh` уже
   содержит `${label}`. `.agents/project/verify.sh` — rc=0 (typecheck, unit, build, 178 browser,
   reference, bootstrap, 26 bd-cloud). Расхождения хуков с U2 — только префикс `U2_*`/`OVERGATE_*`
   и путь gate (`verify.sh` вместо `npm run test`); перенос пайплайна U2 целиком сломал бы gate.

**Gap.** (2) нерабочая обёртка, (3) нет класса окружения в правилах, (4) нет разрешений.

## Scope

1. `scripts/lib/bd-env.sh`, `scripts/bd-wt.sh` — режим базы определяется по
   `<main>/.beads/metadata.json`: `embedded` → `--db <main>/.beads/embeddeddolt`, проверка сервера
   не выполняется; `server` → прежнее поведение (`.beads/dolt` + живой сервер). Отказы
   export/import/dolt/пользовательский `--db`/неизвестный глобальный флаг — без изменений.
2. Тест обёртки на заглушке `BD_BIN` (без живой базы) + подключение в `.agents/project/verify.sh`.
3. `.claude/rules/beads.md` (policy `preserve`) — три класса окружения по ADR-0042: основной
   checkout, локальная worktree, облако; единая точка входа для локального агента —
   `scripts/bd-wt.sh <cmd>` (в основном checkout — прозрачный pass-through).
4. `AGENTS.md` (policy `preserve`) — точечная замена абзаца Beads, текст ниже на одобрение.
5. `.claude/settings.json` (policy `settings`) — узкие allow-правила (список ниже); `deny` без
   изменений.
6. Запись drift managed-файлов и upstream-задача OverGate (очередь `.bd-intents/`).
7. Memory Bank: `activeContext.md` — одна запись.

## Non-goals

- Миграция базы в server-режим, смена bd-версии, правка `.beads/**`.
- Изменение sync-скриптов, их guards, кто и когда публикует `beads-backup`. Публикация снимка
  остаётся за основным checkout по существующим правилам; локальные записи видны облаку после
  очередного `bd-sync-export.sh`.
- Изменение облачного класса, applier, формата intents, C1–C6, P1–P14.
- Порт прочих расхождений с U2 и обновление OverGate.

## Предлагаемый текст для `AGENTS.md`

Заменить абзац со строки «Beads — единственный task tracker…» до «Pending intent не canonical
status.…» на:

```text
Beads — единственный task tracker, Memory Bank — контекст, Git/PR — документы и evidence.
Доступ по классу окружения (ADR-0042, `.claude/rules/beads.md`): локальный агент в основном
checkout или git-worktree читает и пишет через `scripts/bd-wt.sh <cmd>`; cloud —
read-snapshot `scripts/bd-read.sh` и append-only `.bd-intents/*.jsonl`, без bd/Dolt.
Синхронизация между машинами — только `origin/beads-backup` через
`scripts/bd-sync-restore.sh` / `scripts/bd-sync-export.sh` из основного checkout.
Не писать Dolt или JSONL руками и не считать локальный JSONL авторитетным.
```

Остальные строки абзаца (generated checkpoint, bootstrap, override envs, cloud amendment)
сохраняются дословно.

## Allow-правила `.claude/settings.json`

```text
Bash(scripts/bd-wt.sh *)        Bash(bash scripts/bd-wt.sh *)
Bash(scripts/bd-read.sh *)      Bash(bash scripts/bd-read.sh *)
Bash(bd ready*)  Bash(bd show *)  Bash(bd list*)  Bash(bd create *)
Bash(bd update *)  Bash(bd close *)  Bash(bd dep *)  Bash(bd comments *)
```

Не разрешаются: `bd export/import/dolt/delete/init/config`, sync/apply-скрипты. Существующие
deny (`bd delete*`, `bd dolt push/pull*`, `*BD_SYNC_FORCE*`) остаются.

## Шаги

1. RED: тест обёртки фиксирует нынешний отказ embedded-случая.
2. Developer: `bd-env.sh`/`bd-wt.sh` по Verification Contract; GREEN + affected regression.
3. Developer: правила, `AGENTS.md`, `settings.json`, drift-запись, Memory Bank.
4. `.agents/project/verify.sh` на macOS — PASS.
5. QA по AC → один scoped Code Review → finalize → operator merge.
6. Оператор после merge: live smoke AC-9 на своей машине.

## Verification Contract

| AC | Ожидаемое поведение | Метод |
|---|---|---|
| AC-1 | Linked worktree, main `dolt_mode: embedded`, каталог `.beads/embeddeddolt` есть → обёртка вызывает `bd --db <main>/.beads/embeddeddolt <args>` с аргументами без изменений; pid/port сервера не требуются | тест, заглушка `BD_BIN` |
| AC-2 | Main `dolt_mode: server` → прежнее: `.beads/dolt`, без живого сервера rc=3, с живым (`BD_ENV_ASSUME_DOLT_ALIVE=1`) — `--db <main>/.beads/dolt` | тест |
| AC-3 | Fail-closed: нет/нечитаем `metadata.json`, неизвестный или пустой `dolt_mode`, нет каталога базы → rc≠0, сообщение с путём, bd не вызван | тест |
| AC-4 | `export`/`import`/`dolt`, пользовательский `--db`, неизвестный глобальный флаг отклоняются rc=2 в обоих режимах | тест |
| AC-5 | Основной checkout → `exec bd <args>` без `--db`, режим не читается | тест |
| AC-6 | `beads.md` содержит три класса, worktree — через `bd-wt.sh`; облачный класс и запреты дословно по смыслу не ослаблены; нет противоречий с `AGENTS.md` | QA, чтение |
| AC-7 | `settings.json`: добавлены ровно правила из списка; `deny`, hooks, прочие ключи побайтно прежние; JSON валиден | тест/diff |
| AC-8 | `.agents/project/verify.sh` включает новый тест и проходит на macOS bash 3.2; лексическая проверка U2-3ukfq по изменённым shell-файлам — 0 находок | verify |
| AC-9 | Оператор, после merge: из worktree `scripts/bd-wt.sh ready` совпадает с `bd ready` основного checkout; `scripts/bd-wt.sh show ulab-4fl` читается | live smoke, отдельное evidence |
| AC-10 | Drift managed `scripts/bd-wt.sh`, `scripts/lib/bd-env.sh` записан с причиной; upstream-задача OverGate в очереди intents PENDING | QA, чтение |

Edge: путь основного checkout с пробелом; worktree, созданная из подкаталога; `metadata.json`
с другим порядком ключей/пробелами — режим определяется корректно.

Инварианты: обёртка не запускает bd до валидации; не создаёт и не меняет файлы `.beads/**`;
sync-скрипты, applier и облачный канал не меняются.

## Риски и rollback

- Конкуренция embedded-блокировки при многих параллельных агентах: эксперимент 9/9; при
  зависании — bd-команда завершается ошибкой, повтор безопасен. Наблюдать в AC-9.
- Upgrade OverGate перезапишет managed-обёртку — смягчение: drift-запись + upstream-задача.
- Агенты пишут в базу оператора: защита — deny на delete/dolt/force, sync-guards прежние.

Rollback: `git revert` PR. База не мигрируется, данные не затрагиваются.
