---
title: "Upgrade пайплайна u2-lab: OverGate v4.0.0-rc.1 → v4.0.0-rc.2"
status: proposed
version: "0.2"
date: 2026-10-24
tags: [plan, pipeline, overgate, upgrade, beads, critical]
---

# Upgrade пайплайна: OverGate rc.1 → rc.2

Режим: **CRITICAL** — pipeline governance: managed payload, hooks/settings и Beads-обёртка.
Ветка `chore/overgate-v4-rc2` от `main` `4779d1e`, worktree `u2-lab-wt-overgate-rc2`.
Beads: `ulab-c5p`; после merge закрывается `ulab-oz6`.

**Authority:** решение оператора 2026-10-24 — обновить пайплайн u2-lab до OverGate
`v4.0.0-rc.2` (`073595ae6fb51c16fa49576acca40d94d068af83`,
https://github.com/komleff/overgate/releases/tag/v4.0.0-rc.2). Процедура — `.agents/INSTALL.md`
источника: `install-overgate.py plan → PLAN_READY → apply`. Budget 6: Plan Review, ревью
install-плана, QA, Code Review, affected QA и re-review; резерв.

**Решения оператора 2026-10-24 (v0.2):**
1. Нужно полное соответствие текущему OverGate, чтобы проверить его на реальном проекте. После
   upgrade каждый managed- и settings-файл manifest rc.2 побайтно равен источнику; отличаются
   только preserve/ignore-файлы проекта.
2. Правка `AGENTS.md` из §5 одобрена.
3. Расхождение «узкого allow-списка» с `Bash(*)` — отдельная задача `ulab-4tq`.

## 1. Target → as-built → gap

| Объект | Состояние |
|---|---|
| Установлено | OverGate `v4.0.0-rc.1` `633937250f…` (`.overgate/install-state.json`) |
| Дрейф | managed `scripts/bd-wt.sh`, `scripts/lib/bd-env.sh` — project override (#30, `docs/verification/beads-wrapper-drift.json`); `.claude/settings.json` + 4 project allow-правила |
| rc.2 | upstream-версия этих двух файлов: embedded/server по `dolt_mode`, allowlist, отказ флагов включая скрытый `--description-file`, Python через launcher; страж bash 3.2; `bash scripts/bd-*.sh` |
| Applier u2-lab | `scripts/bd-apply-intents.sh` (project-owned) зовёт `bd_env_resolve_main_db`: имя, аргумент, коды 0/1/3 и `BD_ENV_DB_MODE`/`BD_ENV_DB_PATH` в rc.2 те же; меняются тексты и запуск Python |
| Preserve | `AGENTS.md`, `.claude/rules/beads.md`, `.agents/project/*` установщик не обновляет |

**Gap:** managed payload rc.2; разрешение override; перенос правил rc.2 в preserve-файлы;
снятие записи дрейфа; привязки «установлено rc.1» в текущих документах; тесты проекта.

## 2. Scope

**IN:**
1. Вернуть managed `scripts/bd-wt.sh` и `scripts/lib/bd-env.sh` к известным байтам rc.1 (INSTALL
   «Apply и конфликты»: возврат к known baseline, затем новый план). Их поведение заменяет
   upstream rc.2, проверку перенос прошёл в OverGate PR #10.
2. Чистый trusted source: отдельный `git clone` OverGate на тег `v4.0.0-rc.2`, exact SHA.
3. `install-overgate.py plan` → публикация JSON и SHA256 в этом PR → ревью install-плана →
   approval JSON → `apply`.
4. Снять 4 project allow-правила обёрток (`Bash([bash ]scripts/bd-wt.sh *)`,
   `Bash([bash ]scripts/bd-read.sh *)`) из `.claude/settings.json` до генерации плана. Это
   единственный дрейф settings от managed-версии, а сужения они не дают (`Bash(*)`). Тогда
   settings после merge побайтно равны rc.2. Упоминание этих правил в `beads.md` — снять, норма
   «только через обёртку» остаётся нормой.
5. Preserve-файлы:
   - `.claude/rules/beads.md` — предписания запуска `bash scripts/bd-*.sh`; отметка, что embedded
     и allowlist теперь upstream OverGate, а не адаптация Lab; флаг `--description-file` в перечне;
   - `AGENTS.md` — правка §5, одобрена оператором 2026-10-24.
6. `docs/verification/beads-wrapper-drift.json` — дрейф снят: перенос в `docs/archive/` со
   статусом superseded и ссылкой на этот PR; `cloud-tooling-provenance.json` — managed policy
   без отступления.
7. Текущие привязки к rc.1: `.memory-bank/techContext.md` и требование в
   `.agents/project/check-bootstrap.py` — на rc.2. Исторические документы (reviews, bootstrap
   evidence, archive, первый export в `beads.md`) не меняются.
8. Тесты проекта: `scripts/tests/test-bd-local-access.mjs` — кейсы applier сохраняются; кейсы,
   завязанные на тексты или прямой `python3` старой обёртки, приводятся к rc.2. Дублирующие
   managed-тест — по выбору Developer с обоснованием.
9. `.memory-bank/{activeContext,progress}.md`.

**OUT:**
- managed `Bash(*)` и `defaultMode` — не меняются: это managed rc.2 (задача `ulab-4tq`);
- никаких project overrides managed-файлов после apply;
- PR #31 (нормы u2 в слое проекта) — отдельная линия; при пересечении `AGENTS.md` второй по
  merge PR rebase'ится;
- продуктовый код Лабы; follow-up OverGate `og-jx3`, `og-m42`, `og-vjp`, `og-7sr`.

## 3. Шаги

1. Commit 1: возврат двух managed-файлов к rc.1 (`git show 633937250f…:<path>` из trusted
   source) и снятие 4 project allow-правил из settings. Сразу после него обёртка в ветке временно не работает на embedded — допустимо до
   apply; `bd` ветка не трогает.
2. Clone source, `plan` с `--target` worktree, `--contract` этот план, `--target-pr` этот PR.
   Ожидание: conflicts пусто; operations — только managed inventory; settings merge
   сохраняет project allow/deny/env.
3. Публикация `docs/verification/overgate-rc2-install-plan.json` + SHA256 в PR; ревью
   install-плана; approval JSON (локально, не коммитится).
4. `apply`; commit managed payload и `.overgate/install-state.json`.
5. Preserve-файлы, привязки, запись дрейфа, тесты — отдельными коммитами.
6. Проверки — §4. Затем QA → Code Review → `/finalize-pr`.

## 4. Verification Contract

| AC | Требование | Метод |
|---|---|---|
| UG-01 | Managed payload побайтно равен manifest rc.2 `073595ae…`; install-state ссылается на rc.2 | сверка blob по manifest; `install-state.json` |
| UG-02 | Install-план без conflicts; опубликован с SHA256; apply выполнен по approval того же PR | JSON плана, approval, лог apply |
| UG-03 | Settings побайтно равны managed `.claude/settings.json` rc.2; 4 project allow-правила сняты, прочее не потеряно | `cmp` с источником + diff `permissions` до и после |
| UG-11 | Полное соответствие: каждый файл manifest rc.2 с policy managed/settings побайтно равен источнику `073595ae`; отличаются только preserve/ignore, и каждый такой файл назван в PR | скрипт сверки по manifest на exact HEAD |
| UG-04 | Обёртка из worktree u2-lab работает на embedded-базе с настоящим bd: `bash scripts/bd-wt.sh ready`/`show ulab-c5p`; отказ `delete`, `--global`, `--description-file` | live smoke |
| UG-05 | Applier: шаг 4 на embedded работает с rc.2 `bd-env.sh` | `test-bd-local-access.mjs` (кейсы applier) + `bash -n` |
| UG-06 | `python3 scripts/check-reference.py` и полный `bash .agents/project/verify.sh` PASS на exact HEAD | локально + CI |
| UG-07 | Preserve-файлы: все предписания запуска `scripts/bd-*.sh` — `bash scripts/...`; нет утверждения «адаптация Lab» для embedded как текущего факта | grep |
| UG-08 | Дрейф снят: в `docs/verification/` нет активной записи override; архивная копия со статусом superseded | ls + содержимое |
| UG-09 | Текущие привязки «установлено rc.1» отсутствуют вне исторических документов; `check-bootstrap.py` требует rc.2 | grep |
| UG-10 | Rollback: backup apply сохранён; `rollback` по нему возвращает байты rc.1-состояния (проверка в одноразовой копии) | rollback на копии |

**Edge:**
- source checkout грязный или не на теге — installer отказывает, план не создаётся;
- если план покажет conflict, apply не делается: разбор в PR, новый план.

**Инварианты:** без force, без ручной правки managed файлов после apply, без `.beads/**`
вручную, `bd` с мутациями только из основного checkout; merge — оператор.

**Named risks:**
- R1 — applier ломается на rc.2 `bd-env.sh` (UG-05);
- R2 — settings merge теряет project permissions (UG-03);
- R3 — тесты проекта ложно краснеют на новых текстах или ложно зеленеют, перестав покрывать applier (UG-05, UG-06);
- R4 — конфликт с PR #31 в `AGENTS.md`;
- R5 — hooks rc.2 побайтно равны rc.1 (проверено: `pre-bash.sh`, settings hooks, `.codex` не менялись), поэтому live activation — NOT RUN, если оператор не попросит smoke.

## 5. Правка AGENTS.md (одобрена оператором 2026-10-24)

```diff
-Bootstrap pipeline source: `komleff/overgate`, `v4.0.0-rc.1`,
-`633937250fa8f47b49f928c1d8781ab17fe8c8e3`. До установки роли читаются в этом frozen
-trusted Git checkout. После установки: …
+Pipeline: `komleff/overgate` `v4.0.0-rc.2` `073595ae6fb51c16fa49576acca40d94d068af83`
+(bootstrap — `v4.0.0-rc.1` `633937250fa8f47b49f928c1d8781ab17fe8c8e3`). До установки роли
+читаются в frozen trusted Git checkout источника. После установки: …
-Доступ по классу окружения (ADR-0042, адаптация Lab для embedded, `.claude/rules/beads.md`):
+Доступ по классу окружения (ADR-0042, embedded и server поддержаны OverGate, `.claude/rules/beads.md`):
-`scripts/bd-wt.sh <cmd>` (allowlist подкоманд); sync/apply-скрипты не запускает.
-Cloud — read-snapshot/write-intents: `scripts/bd-read.sh` и append-only `.bd-intents/*.jsonl`.
+`bash scripts/bd-wt.sh <cmd>` (allowlist подкоманд); sync/apply-скрипты не запускает.
+Cloud — read-snapshot/write-intents: `bash scripts/bd-read.sh` и append-only `.bd-intents/*.jsonl`.
-параллельно. Синхронизация — только оператор: `scripts/bd-sync-restore.sh` /
-`scripts/bd-sync-export.sh` и `origin/beads-backup`, в тишине и export-first.
+параллельно. Синхронизация — только оператор: `bash scripts/bd-sync-restore.sh` /
+`bash scripts/bd-sync-export.sh` и `origin/beads-backup`, в тишине и export-first.
```

## 6. Вне scope: allow-список

Решение 2026-10-18 «узкий allow-список» в `.claude/settings.json` не сужает фактические
разрешения: managed `allow` содержит `Bash(*)`, а `defaultMode` — `bypassPermissions`. Этот
upgrade снимает только избыточные project-правила ради соответствия rc.2. Политика разрешений —
задача `ulab-4tq`.

## 7. Rollback

До merge — revert PR / `rollback` по backup apply. После merge — revert PR; ветка rc.1-состояния
восстанавливается из истории, override PR #30 — из `docs/archive/`.
