---
title: "Upgrade пайплайна u2-lab: OverGate v4.0.0-rc.1 → v4.0.0-rc.3"
status: proposed
version: "0.3"
date: 2026-10-24
tags: [plan, pipeline, overgate, upgrade, beads, critical]
---

# Upgrade пайплайна: OverGate rc.1 → rc.3

Режим: **CRITICAL** — pipeline governance: managed payload, hooks/settings и Beads-обёртка.
Ветка `chore/overgate-v4-rc2` от `main` `4779d1e`, worktree `u2-lab-wt-overgate-rc2`, Draft PR #40.
Beads: `ulab-c5p`; после merge закрывается `ulab-oz6`.

**Решения оператора 2026-10-24:**
1. Обновить пайплайн u2-lab до текущего OverGate.
2. Полное соответствие текущему OverGate, чтобы проверить его на реальном проекте: каждый managed- и settings-файл manifest побайтно и по mode равен источнику, отличаются только preserve/ignore-файлы проекта.
3. Сначала исправить установщик — выпущен `v4.0.0-rc.3`
   (`b830d5ed7ed31e597b45f7f3c18b8fb6baad6b29`, https://github.com/komleff/overgate/releases/tag/v4.0.0-rc.3),
   затем ставить rc.3.
4. Правка `AGENTS.md` из §5 одобрена.
5. Override обёрток Beads из PR #30 снимается: его поведение стало upstream OverGate (rc.2/rc.3).
6. Расхождение «узкого allow-списка» с `Bash(*)` — отдельная задача `ulab-4tq`.

**Budget:** 6. Plan Review 1 использован (v0.1 BLOCKED B1–B3). v0.3 — повторная проверка в той же сессии.
Ревью install-плана — тоже там. Далее QA, Code Review, affected QA и re-review; резерв.

**v0.3 vs v0.1:** цель rc.3 вместо rc.2; B1 — каждый коммит зелёный, возврат override живёт
в рабочем дереве до apply; B2 — rollback на месте до коммита; B3 — побочные эффекты установщика
устранены rc.3, их отсутствие проверено на клоне u2-lab в QA OverGate (AC-09). Advisory A1–A11 — §2–§4.

## 1. Target → as-built → gap

| Объект | Состояние |
|---|---|
| Установлено | OverGate `v4.0.0-rc.1` `633937250f…` (`.overgate/install-state.json`) |
| Дрейф | managed `scripts/bd-wt.sh`, `scripts/lib/bd-env.sh` — override PR #30 (`docs/verification/beads-wrapper-drift.json`); `.claude/settings.json` + 4 project allow-правила обёрток |
| rc.3 | upstream-обёртки (embedded/server, allowlist, отказ флагов, включая `--description-file`); установщик с побайтной конформностью |
| Applier | `scripts/bd-apply-intents.sh` совместим с rc.3 `bd-env.sh`: функция, аргумент, коды 0/1/3 и переменные те же |
| Preserve | `AGENTS.md`, `.claude/rules/beads.md`, `.agents/project/*` установщик не трогает |

## 2. Scope

**IN:**
1. **Подготовка без коммита** (в рабочем дереве):
   - вернуть `scripts/bd-wt.sh` и `scripts/lib/bd-env.sh` к байтам rc.1 (`git show 633937250f…:<path>`);
   - снять 4 project allow-правила обёрток из `.claude/settings.json`.

   Сначала — `plan` без этой подготовки как evidence конфликта: ожидаются ровно 2 conflicts, `bd-wt.sh` и `bd-env.sh` (A1).
2. Trusted source — отдельный `git clone` OverGate на теге `v4.0.0-rc.3`, exact SHA.
3. `plan` → публикация JSON и SHA256 комментарием в PR → ревью install-плана → approval JSON
   (локально) → `apply` → rollback на месте → повторный `apply` тем же планом (UG-10).
4. **Первый коммит после apply:** managed payload + `install-state.json` + settings без 4 правил + перенос записи
   дрейфа в `docs/archive/` (superseded) + `test-bd-local-access.mjs` AC-10 без опоры на запись
   дрейфа и rc.1-план (A3) + `cloud-tooling-provenance.json` без отступления от managed policy.
5. Затем отдельными коммитами:
   - `.claude/rules/beads.md` — `bash scripts/bd-*.sh` в предписаниях; embedded и allowlist — upstream OverGate; `--description-file` в перечне; снять упоминание 4 allow-правил;
   - `AGENTS.md` — §5;
   - `docs/architecture/source-authority.md:57`, `.memory-bank/techContext.md`, требование в `.agents/project/check-bootstrap.py` — на rc.3 (A2);
   - `.memory-bank/{activeContext,progress}.md`.
6. Pending intent `baa-2026-10-18-v2-02` (`tmp:overgate-bd-wt-embedded`, A10): задача upstream выполнена (OverGate `og-rdc` закрыта), фиксируется комментарием в PR. Queue append-only не правится; при apply очереди оператором — закрыть созданную задачу со ссылкой на `og-rdc`.

**OUT:**
- managed `Bash(*)` и `defaultMode` (`ulab-4tq`);
- project-owned вызовы без `bash` в `.bd-intents/README.md`, `scripts/bd-apply-intents.sh` и `docs/guides/operator-bootstrap.md`: sha256 закреплены в provenance или документ исторический (A4);
- PR #31;
- продуктовый код.

**Исторические файлы, где rc.1 остаётся (A2):**
- `docs/reviews/2026-10-05-*`;
- `docs/verification/{bootstrap-contract,bootstrap-evidence}.md`, `docs/verification/overgate-install-plan.json`, `docs/verification/source-fixture-results.json`;
- `docs/guides/operator-bootstrap.md`, `docs/plans/2026-10-05-overgate-bootstrap.md`;
- `docs/handoffs/*`, `docs/archive/*`;
- первый export в `.claude/rules/beads.md`.

## 3. Verification Contract

| AC | Требование | Метод |
|---|---|---|
| UG-01 | Каждый managed- и settings-файл manifest rc.3 побайтно и по mode равен blob источника; install-state ссылается на rc.3 | скрипт сверки по manifest на exact HEAD |
| UG-02 | Evidence конфликта (2 conflicts до подготовки); install-план после подготовки без conflicts, опубликован с SHA256; apply по approval того же PR | комментарии PR, JSON, лог |
| UG-03 | `.claude/settings.json` побайтно равен source rc.3; `.codex/hooks.json` равен source, без `permissions`; `.gitignore` не изменён | `cmp` + diff |
| UG-04 | Обёртка в worktree u2-lab с настоящим bd на embedded: `bash scripts/bd-wt.sh ready` и `show ulab-c5p` проходят; отказы — немутирующими формами (`show ulab-c5p --description-file x`, `--global show ulab-c5p`) или на заглушке (A5) | live smoke + заглушка |
| UG-05 | Applier: шаг 4 на embedded с rc.3 `bd-env.sh` | `test-bd-local-access.mjs` (кейсы applier) |
| UG-06 | `python3 scripts/check-reference.py` и полный `bash .agents/project/verify.sh` PASS на exact HEAD; CI | локально + CI |
| UG-07 | `beads.md` и `AGENTS.md`: предписания запуска `scripts/bd-*.sh` — `bash scripts/...`; нет «адаптация Lab» как текущего факта | grep |
| UG-08 | Запись дрейфа снята: в `docs/verification/` нет активного override, в `docs/archive/` — superseded со ссылкой на PR | ls + содержимое |
| UG-09 | Привязки «установлено rc.1» отсутствуют вне списка исторических файлов §2 | grep с исключениями |
| UG-10 | Rollback на месте сразу после apply возвращает байты подготовленного состояния; повторный apply тем же планом даёт тот же результат | лог, сверка байтов |
| UG-11 | Каждый коммит ветки зелёный по `.agents/project/verify.sh` | CI на HEAD + гейт |

**Named risks:**
- R1 — applier (UG-05);
- R2 — settings (UG-03);
- R3 — тесты проекта ложно краснеют или зеленеют (UG-05, UG-06);
- R4 — конфликт с PR #31 в `AGENTS.md` и `activeContext.md` (A7): второй по merge PR rebase'ится;
- R5 — Codex hooks: `.codex/hooks.json` после apply побайтно равен source rc.3, без лишнего ключа, поэтому live Codex activation — NOT RUN.

## 4. Шаги

1. `plan` без подготовки → публикация 2 conflicts.
2. Подготовка в рабочем дереве → `plan` → публикация JSON + SHA256 → ревью install-плана.
3. approval → `apply` → rollback → `apply` (UG-10).
4. Коммит 1 (§2 IN 4) → остальные коммиты (§2 IN 5) → проверки §3 → QA → Code Review → `/finalize-pr`.

## 5. Правка AGENTS.md (одобрена оператором 2026-10-24)

```diff
-Bootstrap pipeline source: `komleff/overgate`, `v4.0.0-rc.1`,
-`633937250fa8f47b49f928c1d8781ab17fe8c8e3`. До установки роли читаются в этом frozen
-trusted Git checkout. После установки: …
+Pipeline: `komleff/overgate` `v4.0.0-rc.3` `b830d5ed7ed31e597b45f7f3c18b8fb6baad6b29`
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

## 6. Rollback

- До merge — `rollback` по backup apply / revert PR.
- После merge — revert PR. Байты override PR #30 восстанавливаются из истории Git (`4779d1e:scripts/bd-wt.sh`, `4779d1e:scripts/lib/bd-env.sh`), а не из archive JSON (A9).
