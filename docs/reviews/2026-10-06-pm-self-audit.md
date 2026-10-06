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

# Дополнение после последующего UX-сигнала оператора

Оператор затем указал более существенную ошибку: технические PASS были приняты мной
за достаточное доказательство полезности инструмента ГД. Проверялись состояния и
элементы, но не целые цепочки открытия, правки, анализа и сравнения. Я также придал
раскладке дизайнера обязательную силу, которой последнее решение оператора её лишает.
Изолированные представления были закреплены в моей UI-приёмке и потому проходили
проверки, хотя ухудшили рабочий процесс. Это ошибка WHAT и приёмки, а не повод
переписать старые независимые signed reports.

Продолжение изменено: отдельное многоаспектное адверсальное ревью, сравнение трёх
версий и реальная сценарная QA; `ulab-bn1`. Приоритеты и критерии рабочего процесса —
`docs/product/ship-fitting-gd-workspace-v4.md`. Прежний UI доступен, но UX-приёмка OPEN.
Численная миссия остаётся deferred. Технический PASS и пользовательский verdict
отныне указываются раздельно. Счётчик самоаудита обновляется после завершения триажа.

Аудит завершён: независимый Review NEEDS_REVISION/12 findings и сценарная QA
GD/UX FAIL; две завершённые verifier+triage итерации, counter2/3. Следующая
итерация требует самоаудита. Во время проверки я преждевременно обобщил paused
навигацию на running. Проверка исходных шагов обнаружила границу доказательств;
QA выполнила только недостающие RUNNING×1 срезы, Reviewer запечатал отдельное
уточнение. MAX и физический планшет остаются NOT RUN. Урок: проверять конкретное
действие пользователя в том же состоянии, а не соседний технический сценарий.

# Третий проход: Plan Review v4 и самоаудит

После GD/UX Review+triage, сценарной QA+triage и нового Plan Review+triage достигнут
3/3. PLAN_READY0B1minor наf52fa386 получен; operator execute approval учтён, footer
WF15 включён. Counter сброшен0/3 через Beads API. Это PM self-check, не новый verifier.

Цель сейчас — полезная v4, доступная оператору, с восстановленными сценариями.
Фактически код ещё не поставлен: единственный Developer получил release, QA готовит
7целых цепочек. Корень прежней ошибки остаётся проверяемым: измерения/корабль/черновик
во всех UI поверхностях, обзорные графики, сравнение и повторное открытие результата.

Тактика по PM_ERR/DOC_PR: единый связанный scope и один Developer; не заводить
per-task reviewer swarm/новую историю хранения; metadata собрать с итоговым evidence
вместо коммита на каждое продвижение. Следующий полезный шаг — standalone preview
на4188 сразу после coherent candidate, затем адресная QA7chains/Code Review.
Mandatory guards остаются, широкие повторные matrix/12h/72case sweep не добавляются.
PLAN_READY не будет назван UX PASS, physical device не подменяется viewport.

# Следующие три прохода: QA1, affected QA2, catalog Plan Review

QA1 выявила настоящий desktop held-pointer defect, fixff8 и affected QA2 закрыли
его по всему классу flat/ring/builtin targets. Catalog Plan Review PLAN_READY
добавил прямое поручение оператора без mission scope. После triage3/3 счётчик
сброшен0/3 через Beads API. Это self-check PM, не новая verifier campaign.

Урок предыдущего аудита сохраняется: работающий4188 доступен, old4183/4186
не остановлены; после catalog DEV только C01–08 и один combined Code Review.
Новые широкие matrix/12h/H3600 не нужны без нового FAIL/namedrisk.
Повторившееся угадывание PM имён файлов и формы dataobject исправлено чтением
actual inventory/manifest. QA adapter errors оставлены в raw history и проверены
continuations; не объявлены productFAIL либо незаслуженнымPASS.

Memory Bank сокращён до текущего статуса и ссылок; exact signed report/seals
не переписываются. Один planning checkpoint перед новым runtime amendment,
один итоговый metadata checkpoint после QA/review, вместо commits на каждый
счётчик. Оператору сообщены результат самоаудита и изменение тактики.
