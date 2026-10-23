---
title: "Beads — самостоятельный доступ локальных агентов (embedded + beads-backup)"
status: proposed
version: "0.4"
date: 2026-10-18
tags: [plan, beads, pipeline, worktree, critical]
---

# Beads: доступ локальных агентов

Режим: **CRITICAL** — pipeline governance (правила доступа к трекеру, разрешения агента,
managed-обёртка OverGate). Ветка `chore/beads-agent-access` от `main` 6372717, отдельная
worktree `u2-lab-wt-beads-access`. Закрывает `ulab-oz6`.

Authority: решения оператора 2026-10-18 — (1) схема «embedded Dolt + синхронизация через
`origin/beads-backup`», без миграции базы; (2) узкий allow-список в `.claude/settings.json`.
Канон доступа по классу окружения — pinned U2 ADR-0042
(`cdc490e3517c8455f662f82579c45813cdbb9a76`). Embedded-режим — **адаптация Lab** к ADR-0042,
не новый канон: single-writer = одна физическая база основного checkout.

v0.2 — исправлены B1–B4 Plan Review r1 и учтены A1–A8 (см. «Изменения v0.2»).

## Target → as-built → gap

**Target.** Локальный агент u2-lab — в основном checkout и в git-worktree рядом с ним —
без участия оператора читает и пишет задачи Beads через одну точку входа
`scripts/bd-wt.sh` и только разрешённым набором подкоманд. Dolt — деталь хранения;
кросс-машинная синхронизация — только `origin/beads-backup`. Штатный applier очереди
`.bd-intents/` работает на embedded-базе. Облачный класс не меняется.

**As-built (проверено 2026-10-17/18, macOS, bd 1.2.2 Homebrew, bash 3.2.57).**

1. База u2-lab — **embedded**: `.beads/metadata.json` `dolt_mode: embedded`, данные в
   `.beads/embeddeddolt/ulab`, `dolt-server.pid/port` нет. В U2 — `dolt_mode: server`.
2. Managed `scripts/bd-wt.sh` + `scripts/lib/bd-env.sh` написаны под server U2:
   `bd_env_main_db` → `<main>/.beads/dolt`, `bd_env_dolt_alive` требует pid/port. Из worktree:
   `BD_BIN=echo bash scripts/bd-wt.sh ready` → «основная база Beads не найдена: …/.beads/dolt»,
   rc=1. Project-owned `scripts/bd-apply-intents.sh` шаг 4 (стр. 103–111) — тот же
   `bd_env_dolt_alive` → exit 3; очереди 2026-10-17/18 применялись в обход (`ulab-oz6`).
3. Обёртка отклоняет только export/import/dolt, `--db` и неизвестный глобальный флаг; `delete`,
   `config`, `sql`, `init`, `purge` и др. пропускает (Plan Review r1, B1).
4. `.claude/rules/beads.md` и `AGENTS.md` знают два класса (cloud; «основной checkout оператора —
   единственный writer»); класса «локальная worktree» и `bd-wt.sh` нет.
5. Auto mode Claude Code отклоняет `bd ready` как «Modify Shared Resources»; широкое `Bash(*)` в
   auto mode не действует, узких правил нет.
6. Эксперимент на одноразовом репозитории (scratchpad, bd 1.2.2 embedded, метаданные `.beads/`
   закоммичены как в u2-lab): из worktree auto-discover находит основную базу, пустую не создаёт;
   `bd --db <main>/.beads/embeddeddolt` работает; 3 записи из worktree + 3 из main + 3 чтения
   одновременно — 9/9 rc=0, 7/7 задач, `bd export --all` — 7 строк.
7. Хуки пайплайна на macOS исправны: класс U2-3ukfq — 0 находок; `verify.sh` rc=0. Перенос
   пайплайна U2 целиком не нужен (расхождения — префикс env и путь gate).

**Gap.** Нерабочие обёртка и applier в embedded (2), широкая обёртка (3), нет класса окружения
и порядка sync при многих локальных писателях (4), нет разрешений (5).

## Scope

1. `scripts/lib/bd-env.sh` — **новая** функция режима основной базы (имя — на Developer):
   читает `dolt_mode` из `<main>/.beads/metadata.json` через `python3` (уже обязателен для
   verify; jq на macOS нет). `embedded` → каталог `.beads/embeddeddolt`; `server` →
   `.beads/dolt` + требование живого сервера. Отсутствующий/нечитаемый файл, пустой или
   неизвестный `dolt_mode`, отсутствующий каталог → fail-closed. Существующие
   `bd_env_main_db` и `bd_env_dolt_alive` сохраняют прежнюю семантику (на них опираются
   прочие потребители).
2. `scripts/bd-wt.sh`:
   - **allowlist подкоманд** во всех режимах, включая основной checkout: `ready show list
     search blocked children create q update close reopen dep comment comments note label`.
     Всё прочее и пустая подкоманда → rc=2, bd не вызван;
   - в worktree база и проверка сервера — по функции режима из п. 1;
   - флаги `--db`, `-C`/`--directory`, `--global` отклоняются **в любой позиции** аргументов
     (cobra принимает persistent-флаги и после подкоманды), а не только до подкоманды;
   - (v0.4) флаги чтения локального файла отклоняются в любой позиции: `--body-file`,
     `--design-file`, `--reason-file`, `--file`, `--graph` (с пробелом и с `=`), короткий `-f`
     (в том числе в связке однодефисных флагов — по образцу `-C`) и `--metadata`, значение
     которого начинается с `@`. Длинный текст передаётся через `--stdin` или `--description`;
   - (v0.4) заданная непустая переменная окружения `BEADS_DIR` или `BEADS_DB` → rc=2 во всех
     режимах, bd не вызван: в основном checkout она уводила pass-through в другую базу;
   - прежние отказы (неизвестный глобальный флаг до подкоманды) сохраняются; export/import/dolt
     отклоняются как не входящие в allowlist, с прежним текстом-подсказкой про sync-скрипты.
3. `scripts/bd-apply-intents.sh` шаг 4 — проверка сервера только для `server`; для
   `embedded` — существование каталога базы. Остальные шаги, guards, engine не меняются.
4. Тесты на заглушке `BD_BIN` (без живой базы) для обёртки, функции режима и шага 4 applier;
   подключение в `.agents/project/verify.sh`. Регресс `bd-read.sh` и `test-bd-cloud.mjs` —
   прежние результаты.
5. `.claude/rules/beads.md` (policy `preserve`) — три класса окружения, точка входа
   `scripts/bd-wt.sh`, раздел «Порядок синхронизации» (ниже).
6. `AGENTS.md` (policy `preserve`) — замена ровно строк 28–31 (текст ниже). Текст одобрен
   оператором 2026-10-23.
7. `.claude/settings.json` (policy `settings`) — четыре allow-правила (ниже); `deny`, hooks,
   прочие ключи без изменений.
8. `docs/verification/beads-wrapper-drift.json` — drift managed-файлов: пути, blob из
   манифеста, новый blob, причина, ссылка на upstream-задачу. Отступление от
   `managed_policy` и от C4 cloud amendment (C4 был AC его Task 1) — только для
   `scripts/bd-wt.sh` и `scripts/lib/bd-env.sh`; остальной managed inventory неизменен.
   Upgrade OverGate на этих файлах остановится конфликтом «project override», а не
   перезапишет их — их судьба решается upstream-задачей. В
   `docs/verification/cloud-tooling-provenance.json` обновить target blob
   `scripts/bd-apply-intents.sh` (после правки шага 4) со ссылкой на этот PR.
9. Beads: очередь `.bd-intents/beads-agent-access.jsonl` — note/comment к `ulab-oz6` и
   upstream-задача OverGate; новой задачи-дубля нет.
10. Memory Bank: `activeContext.md` — одна запись.

## Non-goals

- Миграция базы в server-режим, смена версии bd, правка `.beads/**`.
- Изменение `bd-sync-restore.sh` / `bd-sync-export.sh` / `bd-sync-common.sh`, engine applier,
  их guards. Публикация снимка остаётся за оператором из основного checkout.
- Изменение облачного класса, формата intents, C1–C3, C5–C6, P1–P14.
- Прочие расхождения с U2, обновление OverGate.

## Порядок синхронизации (текст для `beads.md`)

Правило закрывает B3: sync-скрипты рассчитаны на одного писателя, а теперь в базу основного
checkout пишут локальные агенты.

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

## Предлагаемый текст для `AGENTS.md`

Заменить **только** строки 28–31 (от «Cloud — read-snapshot/write-intents…» до
«`scripts/bd-sync-restore.sh` / `scripts/bd-sync-export.sh` и `origin/beads-backup`.»).
Строка 27 и строки 32–41 (начиная с «Не писать Dolt или JSONL руками…») сохраняются
дословно.

```text
Доступ по классу окружения (ADR-0042, адаптация Lab для embedded, `.claude/rules/beads.md`):
локальный агент в основном checkout или git-worktree читает и пишет только через
`scripts/bd-wt.sh <cmd>` (allowlist подкоманд); sync/apply-скрипты не запускает.
Cloud — read-snapshot/write-intents: `scripts/bd-read.sh` и append-only `.bd-intents/*.jsonl`.
В hosted Work не запускать bd/Dolt, applier wrapper, export и не пушить beads-backup.
Single-writer: физическая база одна — в основном checkout; второй clone/машина не пишет
параллельно. Синхронизация — только оператор: `scripts/bd-sync-restore.sh` /
`scripts/bd-sync-export.sh` и `origin/beads-backup`, в тишине и export-first.
```

## Allow-правила `.claude/settings.json`

```text
Bash(scripts/bd-wt.sh *)     Bash(bash scripts/bd-wt.sh *)
Bash(scripts/bd-read.sh *)   Bash(bash scripts/bd-read.sh *)
```

Правило для обёртки безопасно только вместе с allowlist подкоманд (Scope 2). Прямые
`bd …` не разрешаются: одна точка входа, в основном checkout обёртка — pass-through.
Существующие deny (`bd delete*`, `bd dolt push/pull*`, `*BD_SYNC_FORCE*`) остаются.

## Шаги

1. RED: тесты фиксируют нынешние отказ embedded-случая, пропуск `delete/config/sql` и exit 3
   applier.
2. Developer: Scope 1–4; GREEN + affected regression.
3. Developer: Scope 5–10.
4. `.agents/project/verify.sh` на macOS — PASS.
5. QA по AC → один scoped Code Review → finalize → operator merge.
6. Оператор после merge: live smoke AC-9; применение очереди этого PR — штатным trusted
   applier из `main` (после merge шаг 4 работает), в тишине и после export-first, с явным
   путём очереди (в каталоге их несколько). Отступление от lifecycle README (обычно apply
   pre-merge): applier до merge этого PR нерабочий. Follow-up — `git rm`
   `.bd-intents/beads-agent-access.jsonl` из `main` отдельным PR после apply.

## Verification Contract

| AC | Ожидаемое поведение | Метод |
|---|---|---|
| AC-1 | Linked worktree, main `dolt_mode: embedded`, каталог `.beads/embeddeddolt` есть → `bd --db <main>/.beads/embeddeddolt <args>` с аргументами без изменений; pid/port не требуются | тест, заглушка `BD_BIN` |
| AC-2 | Main `dolt_mode: server` → `.beads/dolt`; без живого сервера rc=3, с живым (`BD_ENV_ASSUME_DOLT_ALIVE=1`) — `--db <main>/.beads/dolt` | тест |
| AC-3 | Fail-closed: нет/нечитаем/невалиден `metadata.json`, пустой/неизвестный `dolt_mode`, нет каталога базы → rc≠0, сообщение с путём, bd не вызван | тест |
| AC-4 | Каждая подкоманда allowlist проходит; `delete config init sql batch prune purge flatten gc compact admin rename-prefix migrate bootstrap export import dolt`, пустая подкоманда, неизвестный глобальный флаг, `--ignore-schema-skew`, а также `--db`, `-C`/`--directory`, `--global` в любой позиции (например `list -C /other`) → rc=2, bd не вызван — в основном checkout и в worktree, в обоих режимах | тест |
| AC-5 | Основной checkout, разрешённая подкоманда → `exec bd <args>` без `--db` | тест |
| AC-6 | `beads.md`: три класса, точка входа `bd-wt.sh`, раздел «Порядок синхронизации» со всеми пунктами, пометка «адаптация Lab»; облачные запреты не ослаблены. `AGENTS.md`: изменены только стр. 28–31; присутствуют строки single-writer, «в hosted Work не запускать bd/Dolt, applier wrapper, export и не пушить beads-backup», стр. 32–41 дословно (включая «Не писать Dolt или JSONL руками…»); `check-bootstrap.py` PASS | QA, чтение + diff |
| AC-7 | `settings.json`: добавлены ровно четыре правила; `deny`, hooks и прочие ключи побайтно прежние; JSON валиден | тест/diff |
| AC-8 | `verify.sh` включает новые тесты и проходит на macOS bash 3.2; лексическая проверка U2-3ukfq по изменённым shell-файлам — 0 находок | verify |
| AC-9 | Оператор, после merge, отдельное evidence: агент Claude Code в auto mode без prompt/denial выполняет из worktree и из основного checkout `scripts/bd-wt.sh ready` (совпадает с `bd ready` оператора) и одну безвредную запись — `scripts/bd-wt.sh comment ulab-oz6 "<smoke>"`, затем `show` подтверждает; `scripts/bd-wt.sh delete ulab-oz6` → rc=2, задача на месте | live smoke |
| AC-10 | `docs/verification/beads-wrapper-drift.json`: оба managed-файла, blob манифеста и новый, причина, ссылка на upstream; очередь intents ссылается на `ulab-oz6`, новых дублей нет, формат валиден (офлайн dry-run engine) | QA, чтение + dry-run |
| AC-12 | (v0.4) Флаги чтения файла `--body-file`, `--design-file`, `--reason-file`, `--file`, `--graph` (с пробелом и `=`), `-f` и связки с `f`, `--metadata @…`/`--metadata=@…` — rc=2, bd не вызван, в 4 контекстах; `--metadata '{"k":"v"}'` и `--stdin` проходят. На настоящем bd в одноразовом репозитории содержимое файла в базу не попадает | тест + real bd |
| AC-13 | (v0.4) `BEADS_DIR` или `BEADS_DB` заданы непустыми → rc=2 с сообщением, bd не вызван, в основном checkout и в worktree; пустые/не заданные — прежнее поведение | тест |
| AC-11 | Applier шаг 4: `embedded` + каталог есть → проходит к шагу 5; `embedded` без каталога → отказ; `server` без живого сервера → exit 3 как прежде. `bd-read.sh` и `test-bd-cloud.mjs` — прежние результаты | тест (`BD_BIN` и заглушка режима) |

Edge: оба каталога `.beads/dolt` и `.beads/embeddeddolt` → решает только `dolt_mode`; путь
основного checkout с пробелом; worktree, созданная из подкаталога; `metadata.json` с иным
порядком ключей/пробелами.

Инварианты: обёртка не запускает bd до валидации; не создаёт и не меняет `.beads/**`;
sync-скрипты, engine и облачный канал побайтно прежние.

## Риски и rollback

- Конкуренция embedded-блокировки при многих агентах: эксперимент 9/9. Критерий: при
  конфликте bd-команда завершается rc≠0 с понятной ошибкой, данные не портятся, повтор
  безопасен.
- Неэкспортированные локальные записи блокируют restore/apply — так и задумано; порядок —
  раздел «Порядок синхронизации». TOCTOU restore (guard-export → import) закрывается тишиной.
- Upgrade OverGate остановится конфликтом на двух managed-файлах — drift-запись + upstream.
- Агенты пишут в базу оператора: allowlist подкоманд, deny на delete/dolt/force, sync — только
  оператор.

Rollback: `git revert` PR. База не мигрируется; записи агентов после revert остаются в базе
(ожидаемо).

## Изменения v0.2

- B1: allowlist подкоманд в обёртке (Scope 2, AC-4); allow-правила только для обёртки и reader.
- B2: замена `AGENTS.md` — ровно стр. 28–32, single-writer и полный облачный запрет сохранены.
- B3: раздел «Порядок синхронизации»; риски обновлены.
- B4: AC-9 — поведенческий smoke записи и снятия отказа auto mode, негатив `delete`.
- A1/A2/A3: закрывает `ulab-oz6`, applier шаг 4 в scope (AC-11), путь посадки очереди.
- A4: drift-файл, явное отступление от C4; формулировка про конфликт upgrade.
- A5–A8: пометка «адаптация Lab», парсер `python3`, edge cases, измеримый критерий риска.

## Изменения v0.3 (affected recheck v0.2)

- B2 остаток: замена `AGENTS.md` — стр. 28–31, стр. 32–41 дословно; AC-6 исправлен.
- A1: `--db`, `-C/--directory`, `--global` отклоняются в любой позиции (Scope 2, AC-4).
- A2: уточнено, что allow-ограничение действует только в auto mode.
- A3: обновление `cloud-tooling-provenance.json` для applier.
- A4: посадка очереди после merge с явным путём и follow-up `git rm`.

## Изменения v0.4 (решения оператора 2026-10-23)

- Advisory Code Review №2 / QA known issue №1: флаги чтения файла отклоняются (Scope 2, AC-12).
- Advisory Code Review №3: непустые `BEADS_DIR` / `BEADS_DB` → отказ (Scope 2, AC-13).
- Scope 6: текст замены `AGENTS.md` стр. 28–31 одобрен оператором.
- Advisory Code Review №4 (доверие к содержимому обёртки) и нагрузочные таймауты commit gate — вне этого PR.
