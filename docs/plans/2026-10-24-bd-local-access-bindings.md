---
title: "Тесты AC-7/AC-10: внешние привязки установки OverGate rc.3"
status: proposed
version: "0.1"
date: 2026-10-24
---

# Цель

Тесты AC-7 и AC-10 в `scripts/tests/test-bd-local-access.mjs` (PR #40) подтверждают, что
`.claude/settings.json`, `scripts/bd-wt.sh` и `scripts/lib/bd-env.sh` — managed-байты
OverGate `v4.0.0-rc.3`. Независимые QA и Code Review PR #40 нашли три места, где тесты
полагаются на согласованность закоммиченных файлов между собой и не имеют внешней опоры.
Задача закрывает эти места тестами. Beads: `ulab-dk7`.

Режим PRODUCT: меняется исполняемый тестовый код. Производственный код, managed payload
OverGate и документы установки не меняются.

# Найденные пробелы

1. **Approval не сверяется (CR advisory 3).** `installed()` проверяет
   `state.plan_sha256 == sha256(плана)`, но не проверяет `state.approval`. Install-state
   с approval от другого плана или с verdict не PLAN_READY проходит.
2. **Archive-запись дрейфа не проверяется (CR advisory 4, UG-08).** AC-10 проверяет только
   отсутствие `docs/verification/beads-wrapper-drift.json`. Если удалить
   `docs/archive/2026-10-18-beads-wrapper-drift.json` или сменить её статус, тест не упадёт.
3. **Нет внешней константы байтов (QA advisory 2).** Ожидаемые sha256 берутся из закоммиченного
   плана. Если согласованно перегенерировать план, install-state и файл с другими байтами,
   тест пройдёт. Внешне зашит только `RC3_SHA`.

# Scope

IN:

1. В `installed()`:
   - `state.approval.verdict === 'PLAN_READY'`;
   - `state.approval.plan_sha256 === state.plan_sha256`;
   - `state.approval.evidence` — URL комментария PR u2-lab
     (`https://github.com/komleff/u2-lab/pull/<N>#issuecomment-<id>`).
2. В AC-10 — archive-запись дрейфа:
   - `docs/archive/2026-10-18-beads-wrapper-drift.json` существует;
   - `status === 'superseded'`;
   - `superseded_by.install_plan === RC3_PLAN`.
3. Внешние константы sha256 rc.3 для трёх файлов — рядом с `RC3_SHA`, с комментарием,
   откуда они взяты (blob source `b830d5ed`). `assertManagedBytes` сверяет файл и с
   `after.sha256` плана, и с константой.
   - `.claude/settings.json` — `1f518c77696c98922e7044e1857acf50a100d158fce61d2c68ac22f5aaa1f5fb`;
   - `scripts/bd-wt.sh` — `54f4a9a1b70517b532774f0acde6e72d006399c0b0995ddba590b0d26d141547`;
   - `scripts/lib/bd-env.sh` — `5e4ffb08ed0791150e4b51c3df73828bf47170f474b18b1c5c0c8b8af268fd27`.

   Значения PM сверил с файлами чистого клона тега `v4.0.0-rc.3` и с `after.sha256` в
   `docs/verification/overgate-rc3-install-plan.json`. Developer пересчитывает их
   независимо от source, не копирует из плана.

OUT:

- Изменения managed-файлов, install-state, install-плана, архивной записи.
- Остальные кейсы `test-bd-local-access.mjs` и `test-bd-cloud.mjs`.
- Обезличивание абсолютных путей (OverGate `og-9ic.5`, WI-1 rc.4).
- Общий механизм обновления констант при следующем upgrade. Следующий upgrade, как и в
  PR #40, переписывает AC-7/AC-10 вместе с `RC3_SHA`.

# Verification Contract

| ID | Проверяемое поведение | Метод |
|---|---|---|
| DK-01 | На текущем main все 25 кейсов `test-bd-local-access.mjs` зелёные, новых пропусков нет | `node --test scripts/tests/test-bd-local-access.mjs` |
| DK-02 | `approval.plan_sha256` ≠ `plan_sha256` → AC-7 и AC-10 FAIL с сообщением про approval | мутация копии дерева: правка install-state |
| DK-03 | `approval.verdict` ≠ `PLAN_READY` или `evidence` не URL комментария PR u2-lab → FAIL | мутация копии |
| DK-04 | Archive-записи нет, или `status` ≠ `superseded`, или `superseded_by.install_plan` другой → AC-10 FAIL | мутация копии |
| DK-05 | Согласованная перегенерация: изменённые байты файла плюс подогнанные `after.sha256` плана, `installed` и `plan_sha256` в install-state → FAIL по внешней константе | мутация копии |
| DK-06 | Константы равны sha256 файлов в source `b830d5ed` | Developer пересчитывает по клону тега, QA — независимо |
| DK-07 | Полный `.agents/project/verify.sh` и CI зелёные | verify + CI |

RED: до правки тестов мутации DK-02…DK-05 проходят (тест зелёный на сломанной копии).
GREEN: после правки — FAIL. Чистая копия — PASS.

# Реализация и границы

Мутации выполняются на копии дерева (`git archive HEAD` во временный каталог) прогоном
теста с `root` копии. Сам тестовый файл мутационный стенд не содержит: стенд — evidence
Developer и QA, не новый кейс. Комментарии в коде — на русском.

Rollback: revert PR. Тесты — единственная затронутая поверхность.
