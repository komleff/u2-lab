---
title: "Самоаудит PM после сигнала оператора"
status: reference
version: "1.0"
date: 2026-10-06
related:
  - .agents/PM_ROLE.md
  - docs/verification/claude-design-ui-v0.2-contract.md
---

# Результат и фактическое состояние

Цель оператора — работающий промежуточный Claude Design UI с возможностью собственного тестирования, сохранением прежних версий и продолжением функциональной QA. Стенд4183 работает; прежние Ship Fitting/Legacy доступны на4186. QA r4 закрыла CR-UI-B1/B2 и D12, scoped Review r2 APPROVED/0 blockers. Основная копия переключена на feature;189unit/28browser PASS,1 inherited screenshot SKIP. Источники: `docs/reviews/2026-10-06-claude-design-ui-qa-affected-r4.md:3`, `docs/reviews/2026-10-06-claude-design-ui-code-review-r2.md:3`.

Прочитаны reference-файлы основного U2(main), HEAD0fe06927ab496918b3547f43412134c100a6e0b4: `.agents/PM_ERR.md` и `.agents/DOC_PR.md`. В u2-lab эти optional reference-файлы отсутствуют. Их уроки применены к самоаудиту; действующая норма — локальный PM_ROLE3.0/Delivery First. Полная диагностика библиотеки Superpowers выходит за границу ручного PM-самоаудита; новых аналитиков не запускалось.

# Подтверждённые ошибки PM

- **Процессная нагрузка стала чрезмерной.** В линии накоплены4 QA-отчёта и2 Code Review:152342B по размерам шести committed files. Повторные сверки и оформление затянули передачу уже доступного результата. Это сигнал «защита растёт быстрее результата»: `/Users/komleff/Documents/GitHub/u2/.agents/PM_ERR.md:66`. Сами проверки обоснованы найденными функциональными blockers; вывод относится к организации и объёму оформления.
- **Неполная проверка класса при первом исправлении B2.** После основного runId fix понадобились отдельные F1 wrap, active scalar и instance callback fixes: bf26c8d→589f800→33f1fb1→30a1c9b. Источник: `docs/reviews/2026-10-06-claude-design-ui-developer-fix-r3.md:35` и`:45`. Урок «правь класс»: `/Users/komleff/Documents/GitHub/u2/.agents/DOC_PR.md:55`; заранее охватывать Main/Compare/Lab/F1/details/exports одной проверкой ownership.
- **Угадывание в обвязке добавило повторную работу.** В QA были неверные предположения об units/selector; в моей PM-сверке — выдуманное имя build.json вместо существующего build-manifest.json. Источники: `docs/reviews/2026-10-06-claude-design-ui-qa-affected-r4.md` (раздел «Исправления harness»), `.overgate-runtime/claude-ui-primary-handover-after-source.json:13`. Runtime PASS сохранены; ошибочную PM-сверку исправил без повторного продуктового прогона.

# Изменённая тактика

1. Пользователь получает работающий стенд сразу. Следующий тест получает конкретный адрес AC/FAIL/изменённого поведения; при закрытом scope этап завершается.
2. Findings группируются по классу; один Developer исправляет весь затронутый workflow. Advisory и документальная форма не расширяют scope.
3. Memory Bank содержит текущее состояние и ссылки. История остаётся в Git/immutable reports. В отчётах — краткий вердикт и evidence pointers; hashes/raw data — в manifest.
4. По поручению оператора: самоаудит после каждого третьего завершённого прохода QA/Review с триажем. Внутренние тесты/ожидание/оформление не отдельные циклы. После этого аудита счётчик0/3; отметки ведутся через Beads API, без отдельных Git-коммитов на каждое увеличение.

Минимальное продолжение: синхронизировать canonical Beads checkpoint и передать локальные ссылки. Дальнейшая функциональная работа — воспроизводимые замечания оператора. Full mining mission/refuel остаётся deferred; physical/native/public/base/main gates открыты отдельно. Продуктовый код, WHAT/VC и signed QA/Review не меняются; обязательные guards сохраняются.
