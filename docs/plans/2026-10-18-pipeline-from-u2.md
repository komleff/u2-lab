---
title: "Пайплайн u2 в u2-lab: перенос норм в слой проекта"
status: active
version: "0.3"
date: 2026-10-18
mode: CRITICAL
owner: PM
related:
  - AGENTS.md
  - .agents/PM_ROLE.md
  - .agents/distribution-manifest.json
  - docs/architecture/source-authority.md
  - scripts/check-reference.py
  - .agents/project/check-bootstrap.py
---

# Пайплайн u2 в u2-lab: перенос норм в слой проекта

## 0. Источник и режим

WHAT — поручение оператора 2026-10-18: скопировать настройки пайплайна u2 из `.agents/` и `AGENTS.md`
с учётом того, что у u2-lab свой репозиторий. Оператор выбрал способ «слой проекта» и перенос роли
геймдизайнера проектным файлом. Источник — `komleff/u2` `origin/main`; blob всех нужных файлов
совпадают с `1c9da961bb5f458442cfcdaa789cd62dadafae06` (2026-10-03). Локальный checkout u2 не
используется. Beads: `ulab-bmz`.

Режим CRITICAL: меняется pipeline governance. Именованный риск — сломать структурные проверки
(`check-reference`, `check-bootstrap`) и штатное обновление OverGate.

## 1. Target → as-built → gap

**Target.** В u2-lab действуют нормы пайплайна u2, появившиеся после снимка OverGate, и роль ГД,
адаптированная к Лабе; управляемые файлы OverGate не меняются.

**As-built.** `.agents/` поставлен OverGate v4.0.0-rc.1 (`633937250f…`) — обобщённая копия пайплайна u2
(источник U2 `c450fa7b`). Managed-файлы совпадают по sha256 с `.overgate/install-state.json`; проектные
(`preserve`) — `AGENTS.md`, `.agents/project/**`, `.claude/rules/{beads,tests,universal}.md`. Проверки:
`scripts/check-reference.py` — ROLE-002 смотрит нерекурсивно `.agents/*_ROLE.md` (ровно шесть ролей),
SKILL — ровно пять скиллов, CLOSURE — цели манифеста; `.agents/project/check-bootstrap.py` — шесть
обязательных строк `AGENTS.md`. Installer трогает только цели манифеста (`install-overgate.py:119-139`).

**Gap.** После снимка в u2 по `.agents`/`AGENTS.md` было три коммита (`f26b3cd`, `8757856`, `1c9da96`):
справочники `PM_ERR.md` v1.3 и `DOC_PR.md` и исключение в `PM_ROLE.md` §9 — самосверка PM с `PM_ERR.md`
после каждых трёх итераций QA/ревью. `REVIEW_CYCLE.md` в снимок не попал. На все три справочника уже
ссылаются `.agents/PM_ROLE.md:183` и `.agents/SV_ROLE.md:43`, файлов нет. Общие пункты `AGENTS.md` u2,
которых нет в u2-lab, — таблица §2.3. Роли ГД нет. Исправление hooks u2 `96895dd1b` (bash 3.2) в u2-lab
уже есть (`.claude/hooks/pre-bash.sh:75-76`).

## 2. Scope

### 2.1. Справочники: дословная копия с баннером

`.agents/PM_ERR.md`, `.agents/DOC_PR.md`, `.agents/REVIEW_CYCLE.md` — побайтные копии u2@`1c9da96`,
вне манифеста. Перед текстом — баннер: «Историческая справка U2 @ `1c9da96`. Все ссылки на разделы,
шаги, файлы, номера PR и статусы каналов относятся к репозиторию U2 и в u2-lab не действуют. Канон
u2-lab — `.agents/PIPELINE_ADR.md §3.29` и `.agents/PM_ROLE.md`». Единственная содержательная правка
внутри — в `PM_ERR.md` указатель нормы самосверки «`PM_ROLE.md` §9» заменяется на «`AGENTS.md` u2-lab
(project-исключение к `PM_ROLE.md` §9)»; остальной текст не трогается.

### 2.2. Роль ГД: `.agents/project/GD_ROLE.md`

Адаптация u2 `GD_ROLE.md` v1.4. Закрытый список намеренных отклонений от источника:

| Отклонение | Источник решения |
|---|---|
| Product authority — оператор; ГД предлагает, решение и WHAT — за оператором | `AGENTS.md:3–4`, `.agents/project/authority.md` |
| Маршрут канона U2: закреплённый слой — владелец `docs/architecture/source-authority.md`; домены вне него — текущий `komleff/u2` по `llms.txt` → `docs/INDEX.md` → `docs/architecture/ADR-INDEX.md` с exact commit в каждом предложении | `source-authority.md`; поручение оператора 2026-10-17 («Канон U2 — по маршруту u2: llms.txt → docs/INDEX.md → ADR-INDEX») |
| Эксперимент Лабы не канон U2; расхождение Лабы с U2 не дефект, но называется явно | `.agents/project/authority.md`; поручение оператора 2026-10-17 |
| Предложения ГД, записанные в документах как «решения», сверяются с первоисточником | поручение оператора 2026-10-17 (таблица gd-proposals v2) |
| Скиллы `u2-*` заменены generic `canon-router`, `product-gap`, `product-handoff`, `handoff` с теми же триггерами | `.agents/SKILLS.md` |
| Удалены Unity, сервер, Almanac, `docs-authority.md`, `gdd_overview` и прочие пути U2 без эквивалента | репозиторий u2-lab |
| Размещение артефактов, словарь статусов и реакция на противоречие с ADR — по правилам u2-lab, без своих норм роли | `docs/INDEX.md` u2-lab, `.claude/rules/universal.md` (раздел «Канон-решения») |

Роль опциональна: не стадия Delivery First, не verifier, не расширяет budget, не седьмая роль реестра
(`PIPELINE_ADR.md §3.31`, `AGENT_ROLES.md`). Принцип u2 «не навязывай код в GDD/ТЗ: поведение — словами и
формулами» переносится сюда.

### 2.3. `AGENTS.md`: сопоставление пунктов u2

| Пункт `AGENTS.md` u2 | u2-lab | Действие |
|---|---|---|
| ИИ не merge, не auto-merge, не обновляет `main` | есть, стр. 16 | — |
| Не обходить hooks/permissions | есть, стр. 21 | — |
| Не создавать self-modifying/self-deleting CI с write-доступом | нет | перенести |
| Не читать/не публиковать `.env*`, credentials | есть, стр. 21 | — |
| Работа в рабочей ветке | есть, стр. 16 | — |
| Destructive git/data actions — только с отдельным явным основанием | нет | перенести |
| Verifier evidence с подписью роли/модели; verifier только по адресу | есть, стр. 19–20 | — |
| Прерывание пользователя приоритетнее текущего маршрута | нет | перенести |
| Канон Delivery First, карта процесса, режимы, advisory | есть, стр. 10–13, 18; `PIPELINE.md`, `PM_ROLE.md` | — |
| Первое чтение через `llms.txt`, `docs-authority.md`, `STYLE.md` | своё первое чтение, стр. 6–8 | исключить: пути U2 |
| «Поиск находит кандидата, не истину» | есть, стр. 8 | — |
| Таблица ролей, строка ГД | роли — `AGENT_ROLES.md` | перенести одну строку: роль ГД — `.agents/project/GD_ROLE.md` |
| «Не навязывай код в GDD/ТЗ» | нет | перенести в `GD_ROLE.md` (§2.2) |
| Язык русский, идентификаторы английские | есть, стр. 43 | — |
| Beads: не `bd sync` как канон | своя модель, стр. 27–41 | — |
| Personal IDE/runtime state не коммитится | нет | перенести |
| GitHub-коннектор: batch reads, frozen SHA, не poll'ить CI, stalled call не повторять | нет | перенести |
| Local hooks не защищают коннектор; `main` — GitHub-side protection | есть в `PIPELINE_ADR.md §3.29` | указатель, без дубля |
| Все AI-комментарии в GitHub подписывать фактической моделью/ролью | только evidence | перенести |
| Временные файлы не коммитить | нет | перенести |
| Неоднозначность → эскалация оператору | есть, стр. 22 | — |
| Самосверка PM с `PM_ERR.md` каждые 3 итерации (u2 `PM_ROLE.md` §9) | нет | перенести как project-исключение к `PM_ROLE.md` §9 (решения оператора u2 2026-10-03, u2-lab 2026-10-18) |

Обязательные строки `check-bootstrap` сохраняются.

### 2.4. Прочее

Запись в `.memory-bank/activeContext.md`; задача Beads `ulab-bmz`.

**Non-goals.** Managed-файлы OverGate (`*_ROLE.md`, `PIPELINE*.md`, `SKILLS.md`, `.agents/skills/**`,
`HOW_TO_*`, `INSTALL.md`, манифест) и запись в `PIPELINE_ADR.md` (шаг 6 ADR §7 не выполняется: ADR managed —
объявленное отклонение); `scripts/check-reference.py`; `.claude/**`; `CODEX_AUTH.md`, `SV_PM_PROMPT.md`,
`AGENTIC_PIPELINE.md`, `pipeline-improvement-plan-v3.3.md`, скиллы `u2-*`, Almanac; upstream OverGate.

**DECLARED_LIMIT (Minor).** Если будущая версия OverGate добавит в манифест тот же путь
(например, `.agents/PM_ERR.md`), installer остановится с conflict и не перезапишет файл
(`install-overgate.py:133-137,167`) — fail-closed; разрешение — при обновлении.

## 3. Verification Contract

| AC | Проверка | Ожидается |
|---|---|---|
| PU-01 | `.agents/project/verify.sh` | PASS |
| PU-02 | sha256 записей манифеста с policy `managed` и `settings` против `.overgate/install-state.json` | Все совпадают |
| PU-03 | Живые ссылки (вне баннерных справочников): `AGENTS.md`, `GD_ROLE.md`, баннеры, указатель в `PM_ERR.md` — пути и якоря разделов | Каждая ведёт на существующий путь/раздел u2-lab либо явно на `komleff/u2` с commit |
| PU-04 | Три справочника против u2@`1c9da96` | Отличия — только баннер и одна строка указателя в `PM_ERR.md` |
| PU-05 | `AGENTS.md` | Обязательные строки `check-bootstrap` на месте; все строки «перенести» таблицы §2.3 есть; нет дублей с `.claude/rules/*`, `PIPELINE_ADR.md §3.29`, `AGENT_ROLES.md`; единственное намеренное расхождение с managed — project-исключение к `PM_ROLE.md` §9, названное явно |
| PU-06 | `GD_ROLE.md` против u2 `GD_ROLE.md` v1.4 | Отличия — только из закрытого списка §2.2, у каждой нормы Лабы — источник решения оператора; маршрут канона ссылается на `source-authority.md`; роль опциональна |
| PU-07 | `PM_ROLE.md:183`, `SV_ROLE.md:43` | Ведут на существующие файлы |

Методы: verify, скрипт сверки хэшей и побайтного диффа справочников, чтение; независимые Plan Review и
scoped Review. Бюджет CRITICAL — 6, использовано 3 (Plan Review, QA, Code Review); повторные проверки —
в тех же verifier-сессиях. Rollback: revert PR — изменения аддитивны,
managed-файлы не тронуты.

## История

- 0.3 — по Code Review PR #31 (BLOCKER №1): в закрытый список §2.2 добавлена строка о размещении,
  статусах и реакции на ADR по правилам u2-lab; `GD_ROLE.md` приведён к ней. Учётные поля обновлены.
- 0.2 — по Plan Review PR #31 (CHANGES_REQUIRED, 4B/8A): справочники — дословная копия с баннером; закрытый
  список отклонений роли ГД с источниками; маршрут канона через `source-authority.md`; полная таблица
  пунктов `AGENTS.md` u2; project-исключение к PM_ROLE §9 названо; PU-02 по манифесту; DECLARED_LIMIT;
  Beads.
- 0.1 — исходный план.
