---
title: "Пайплайн u2 в u2-lab: перенос норм в слой проекта"
status: proposed
version: "0.1"
date: 2026-10-18
mode: CRITICAL
owner: PM
related:
  - AGENTS.md
  - .agents/PM_ROLE.md
  - .agents/distribution-manifest.json
  - scripts/check-reference.py
  - .agents/project/check-bootstrap.py
---

# Пайплайн u2 в u2-lab: перенос норм в слой проекта

## 0. Источник и режим

WHAT — поручение оператора 2026-10-18: скопировать настройки пайплайна u2 из `.agents/` и `AGENTS.md`
с учётом того, что у u2-lab свой репозиторий. Оператор выбрал способ «слой проекта» и перенос роли
геймдизайнера проектным файлом. Источник — `komleff/u2` `origin/main`, последняя правка пайплайна
`1c9da961bb5f458442cfcdaa789cd62dadafae06` (2026-10-03). Локальный checkout u2 не используется: он
отстаёт и содержит чужие правки.

Режим CRITICAL: меняется pipeline governance. Именованный риск — сломать структурные проверки
(`check-reference`, `check-bootstrap`) и штатное обновление OverGate.

## 1. Target → as-built → gap

**Target.** В u2-lab действуют нормы пайплайна u2, появившиеся после снимка OverGate, и роль ГД,
адаптированные к Лабе; управляемые файлы OverGate не меняются.

**As-built.** `.agents/` поставлен OverGate v4.0.0-rc.1 (`633937250f…`) — обобщённая копия пайплайна u2
на 2026-10-02. Хэши всех managed-файлов совпадают с `.overgate/install-state.json`; проектные файлы —
`AGENTS.md`, `.agents/project/**`, `.claude/rules/{beads,tests,universal}.md`. Проверки:
`scripts/check-reference.py` (ровно шесть `*_ROLE.md` в `.agents/`, ровно пять скиллов в `SKILLS.md` и
`.agents/skills/`, все цели манифеста на месте) и `.agents/project/check-bootstrap.py` (обязательные строки
`AGENTS.md`: `Dmitriy Komlev`, `komleff`, `.memory-bank/activeContext.md`, `docs/INDEX.md`,
`.agents/PM_ROLE.md`, `.agents/project/verify.sh`).

**Gap.** После снимка в u2 появились: правило PM «самосверка с `PM_ERR.md` после каждых трёх итераций QA
или ревью» (PM_ROLE 3.1 §9), справочники `PM_ERR.md` v1.3 и `DOC_PR.md`; `REVIEW_CYCLE.md` в u2-lab не
попал. На `PM_ERR.md`, `DOC_PR.md`, `REVIEW_CYCLE.md` уже ссылаются `.agents/PM_ROLE.md:183` и
`.agents/SV_ROLE.md:43`, но файлов нет. В `AGENTS.md` u2 есть общие пункты, которых нет в u2-lab:
приоритет прерывания оператором, работа с GitHub-коннектором и защита `main`, временные файлы не
коммитятся. Роли ГД в u2-lab нет.

## 2. Scope и non-goals

**Scope.**

1. `.agents/PM_ERR.md`, `.agents/DOC_PR.md`, `.agents/REVIEW_CYCLE.md` — новые проектные файлы вне
   манифеста, адаптированные копии u2@`1c9da96`. Адаптация: шапка «адаптировано для u2-lab из
   u2@`1c9da96`»; ссылки на файлы, которых в u2-lab нет, либо заменяются эквивалентом u2-lab, либо
   помечаются как история u2 (номера PR u2 — «U2 PR #…»); префикс Beads `ulab-`; суть норм не меняется.
2. `.agents/project/GD_ROLE.md` — адаптированная роль ГД. Лаба: ГД ведёт опыты на движке Лабы,
   предлагает решения оператору, канон U2 читает по маршруту u2 (`llms.txt` → `docs/INDEX.md` →
   `docs/architecture/ADR-INDEX.md`); предложения ГД — кандидаты, решение — оператор
   (product authority по `AGENTS.md`); расхождение Лабы с U2 называется явно. Ссылки на Unity, сервер,
   Almanac и скиллы u2 убираются.
3. `AGENTS.md` — точечные дополнения: приоритет прерывания оператором; самосверка PM с
   `.agents/PM_ERR.md` после каждых трёх итераций QA/ревью в одном PR (уточняет `PM_ROLE.md` §9 для
   u2-lab); GitHub-коннектор (batch reads, frozen SHA, не poll'ить CI) и защита `main` на стороне GitHub;
   временные файлы не коммитятся; роль ГД — `.agents/project/GD_ROLE.md`. Обязательные строки
   `check-bootstrap` сохраняются, дублей и противоречий нет.
4. Запись в `.memory-bank/activeContext.md`.

**Non-goals.** Managed-файлы OverGate (`*_ROLE.md`, `PIPELINE*.md`, `SKILLS.md`, `.agents/skills/**`,
`HOW_TO_*`, `INSTALL.md`, манифест); `scripts/check-reference.py`; `.claude/**` (hooks, rules, skills);
`CODEX_AUTH.md`, `SV_PM_PROMPT.md`, `AGENTIC_PIPELINE.md`, `pipeline-improvement-plan-v3.3.md`, скиллы
`u2-*` и Almanac; upstream-правка OverGate.

## 3. Verification Contract

| AC | Проверка | Ожидается |
|---|---|---|
| PU-01 | `.agents/project/verify.sh` (check-reference, check-bootstrap, тесты) | PASS |
| PU-02 | sha256 managed-файлов против `.overgate/install-state.json` | Все совпадают: managed не тронуты |
| PU-03 | Ссылки в новых файлах | Каждый путь существует в u2-lab, либо явно помечен как u2 (внешний репозиторий или история) |
| PU-04 | Сверка с источником u2@`1c9da96` | Отличия — только адаптация (пути, имена, префикс, шапка); нормы не изменены и не добавлены |
| PU-05 | `AGENTS.md` | Обязательные строки `check-bootstrap` на месте; нет дублей и противоречий с `.claude/rules/universal.md`, `beads.md` и `PM_ROLE.md` |
| PU-06 | `GD_ROLE.md` | Не противоречит authority u2-lab: product authority — оператор; эксперимент Лабы не канон U2; маршрут канона U2 верный |
| PU-07 | Висячие ссылки | `PM_ROLE.md:183` и `SV_ROLE.md:43` теперь ведут на существующие файлы |

Граничные случаи: новый файл не должен попасть под `ROLE-002` (поэтому роль ГД — в `.agents/project/`,
а не `.agents/GD_ROLE.md`). Методы: verify, скрипт сверки хэшей и ссылок, независимые Plan Review и
scoped Review. Бюджет CRITICAL — 6.

Rollback: revert PR — все изменения аддитивны, managed-файлы не тронуты.
