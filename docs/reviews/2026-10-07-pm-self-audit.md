---
title: "Самопроверка PM: температурная диагностика"
status: reference
version: "1.0"
date: 2026-10-07
---

Цель: отдельный U2 PR принятого hot/cold+wear правила и рабочая Lab с понятными
причинами/процентами и обеими зонами. Прочитаны current U2 PM_ERR1.3/DOC_PR;
нормативный owner PM_ROLE/ADR3.29. PRODUCT verifier budget1/5: Plan Review и
same-session scoped addendum, без новой кампании; самоаудит не verifier.

Дрейф: последовательное ожидание публикации U2 начало блокировать Lab код;
несколько чрезмерных чтений снова обрезали stdout, два поиска использовали
предполагаемые, а не подтверждённые пути. Git guard действительно выявил
Bash3.2/UTF8 несовместимость и inherited-budget fixture bug. Первую закрывает
LC_ALL=C без source change; второй — только изоляция child test, READY addendum.
Попытка installer отклонена классификатором; установка не выполнялась и не нужна.
PR comment body-file отклонён; используем штатный проверяемый publisher с body
внутри checkout, без токена/bypass. Не повторяем эти неправильные команды.

Тактика: DEV_RELEASE Lab сразу после основного PLAN_READY и Draft10; U2 fixture
после addendum. Один Developer, PM параллельно доки/публикация. Проверить exact
Pony cold и Ermak hot, numeric equality, affected edge tests, нормальный guard,
затем одна QA и один scoped Review. Не новая матрица корпусов/часовых запусков,
не artifact forest, не новая wear/H₂ governor/Unity реализация. Обязательные
проверки остаются; проблемы среды не выдаются за новый product scope.

Счётчик review/QA+триаж/фикс: основной Plan Review+addendum1, environment
FAIL/triage2; проведён ранний аудит и reset0/3. Следующий завершённый fix/QA/review
считается1/3; при3/3 перечитать нормы и повторить короткий аудит.

## Самопроверка после 3 итераций

Fixture fix/proof1 + native harness triage/fix rounds1/2 =3/3. Перечитаны
релевантные current PM_ERR/DOC_PR: чинить класс, не расширять обещания и
отличать оснастку от реальности. Дефект относится к сравнению transport packet
и публичного persisted результата/входного spec. Persistence не расширяем,
assertion на last-valid export после Freeze и atomic failure остаётся целиком.
Новые runtime возможности из FAIL не выведены. Промежуточный4196 уже дан
оператору (HTTPIP200, app boot/errors0),4189 сохранён. У2 PR842 открыт; ещё одна
proof-программа не нужна. Следующее: закончить проверяемый native workflow,
обычный guard/commit, независимые QA и scoped review. Counter reset0/3.

## Следующие 3 итерации: регрессии и source metadata

Numerical-oracle triage/fix1, footer regression/fix2, frozen source-route
metadata triage/fix3. Перечитаны PM_ERR/DOC_PR из current U2 worktree, не старого
main. Численные goldens не переписаны: observer исключён из сравнения только
по event text/count, исходные81 full hashes отдельно подтверждены на старом
source blob. Версию в footer перенесли в конец, сохранив старую строку. Новую
норму с отдельным SHA нельзя выдавать за owner на frozen CDC: source-authority
ссылается на отдельный product contract/PR, inventory и validator неизменны.

Диагноз: хвосты исходных предположений тестов/метаданных; исправлен класс без
новых игровых правил, защитных подсистем и расширения scope. Повтор широких
чтений также создавал шум; дальнейшие проверки адресные. Функциональный пакет
481unit/49browser+1skip уже GREEN, source metadata отдельно PASS; нужен новый
normal guard на совместном состоянии. Затем одна независимая QA и один scoped
Review, публикация свежей immutable LAN сборки. Budget verifier остаётся1/5,
counter reset0/3. H₂ governor и numerical wear по-прежнему вне этого пакета.

## Ранний аудит при повторе TD05

QA2+label-fix1 и affectedQA3+триаж2: тот же класс не закрыт в empty fallback.
Ранний аудит не сбрасывает счётчик2/3; affectedQA4 завершит3/3. Перечитаны current
PM_ERR/DOC_PR: проявился «чинить экземпляр вместо класса». Первый fix исправил
четыре подписи и верхнюю ось только при наличии limits, оставив ось без limits
на y16. PM следовало явно потребовать sweep всех ветвей общего renderer.

Тактика изменена: один общий способ размещения верхней оси с реальными glyph
bounds для common/disjoint/empty/detail/replay; отсутствие каналов отдельно
проверяется как отсутствие данных. Developer добавляет регрессию реального
styled empty-case, численные данные и event observer не трогает. QA4 проверяет
только оставшийся класс; CodeReview5 — один финальный scoped проход. Budget3/5,
новых verifier calls сверх5 нет. В репо попадают только sealed reports, без
переноса временных raw export bundles в product. Начальная ecf и c10 immutable
FAIL evidence остаются. Цель прежняя: рабочая Лаба и отдельный U2 canon PR.

## Обязательный аудит после affectedQA4 — 3/3

QA2+fix1, QA3+class-fix2, affectedQA4=3/3. Перечитаны релевантные current
PM_ERR/DOC_PR. Общая ось исправлена48f без зависимости от наличия limits;
actual styled sweep18/18 на1440/touch390 закрывает common/replay/empty/disjoint/
detail/hidden/missing data/W axis. Нет numerical/observer/TTX delta относительно
ecf; Worker и остальные15 thermal source rows неизменны. Source/build frozen,
normalguard481unit/49browser+1skip/26cloud PASS, прежние FAIL не переписаны.

Класс теперь закрыт, новые защитные контуры не нужны. Следующее — один scoped
Reviewer5, затем PM reports/content-equivalence/обычный commit guard и свежий
LAN4196, сохраняя4189/legacy. Задержка из-за неполного class sweep признана;
тактика — общая ветвь renderer и реальные glyph bounds, не baseline constants.
Budget4/5, counter reset0/3; CodeReview5 будет1/3. Новый QA/Review после advisory
без blocker не запускается. Unity/wear/H₂ governor остаются вне пакета.

## Code Review5 — реальный blocker и budget stop

Reviewer выявил CR-TD-B1: фильтрация всех native thermal-stop/restart при
отсутствующем Active-load ID в Legacy observer теряет событие защиты. PM
подтвердил по run164/diagnostics118–125 и sealed accepted-step reproduction;
это TD02/TD04 regression, не новая физика или advisory. Исходный48f
CHANGES_REQUESTED сохранён. Developer выполняет один минимальный fix с
RED/GREEN protection/restart controls; численный kernel неизменен.

PRODUCTbudget5/5 исчерпан, новых independentlaunches нет. После fix
обычный guard и локальный experimental build допустимы; нельзя выдать
deterministic PASS за independent QA/re-review или закрыть blocker принятой
ревьювером. Повторная affected QA+scoped Review требует явного budget
оператора по PM_ROLE§4. Review5 завершает counter1/3; reset не делаем.

Fix a6c7430 завершён: только observer/test,32targeted GREEN,489unit/49browser
+1SKIP/26cloud fresh Developer guard PASS. Disabled colon-ID identity counterexample
был найден в том же fix и закрыт exact generated-native ID, без расширения scope.
LIVE4196/?v=thermal-a6c7430:17HTTPasset hashes, Start/advance/Pause PASS;
старый4189 сохранён. Signed Reviewer48f и прежние FAIL не переписаны.
Независимое закрытие TD02/TD04 послеfix pending; оператору показан конкретный
проверенный result и задан вопрос о2дополнительных адресованных verifier calls.
До ответа budgetstop5/5 и Draft/merge-ineligible сохраняются. Counter1/3.

## Аудит по поручению оператора и дополнительный budget

Оператор явно предоставил ещё5 verifier calls: общий предел10, использовано5.
До новых запусков перечитаны current U2 PM_ERR1.3 и DOC_PR2026-10-03.
Цель — доступная публичная Лаба с понятной температурной диагностикой и отдельный
PR игрового правила. Фактически a6 работает по LAN, тесты489/49+1skip/26 PASS,
но независимое закрытие Legacy protection/restart ещё pending, Pages ещё старая.

Диагноз: «чинить экземпляр вместо класса» (обычная/пустая ось; Active-ID и disabled
colon-ID), «защита растёт быстрее результата» (учёт доказательств задержал Pages).
Blocker Legacy — реальная потеря событий защиты по TD02/TD04, не пожелание к форме.
Новые правила, H₂ governor и численный износ для его закрытия не нужны. Повторные
широкие чтения/предполагаемые пути также дали шум; далее только известные пути.

Тактика: QA6 проверяет только класс Legacy переходов и необходимую V2 регрессию;
Review7 — только два изменённых source/test файла и связанные вызовы. Три вызова
остаются в резерве для конкретного нового FAIL. Старые FAIL и CHANGES_REQUESTED
сохраняются. Параллельно публикуем exact a6 static build на gh-pages, сохраняем v1,
проверяем публичные asset hashes и настоящий Start/Pause. Это разрешённая публикация
экспериментального стенда, не merge. Новые защитные подсистемы/полные кампании не нужны.
Ранний аудит не сбрасывает counter1/3; после QA6 и Review7 повторить аудит при3/3.

## Обязательный повтор после QA6 и Review7 — 3/3

Review5/Legacy fix + affectedQA6 + scopedReview7 =3/3. Перечитаны релевантные
current PM_ERR1.3/DOC_PR. QA6 PASS и Review7 APPROVED закрыли CR-TD-B1 целым
классом: реальные cold/hot stop/restart, exact IDs, disabled/idle/cargo и aggregate.
Исходные FAIL/CHANGES_REQUESTED не переписаны, WHAT/HOW/численный kernel неизменны.
Pages уже опубликована: exact17files, настоящий Start/Pause, первая Lab сохранена.
Дрейф proof bookkeeping остановлен; лишние чтения и угаданные пути ещё давали шум,
дальше только завершение текущих артефактов. Новые нормы/защиты/кампании не добавлены.
Использовано7/10, reserve3; новых verifier launches не нужно. Следующее — один
обычный финальный commit guard, sync PR/Memory Bank/Beads. Counter reset0/3;
следующая review/QA+triage/fix итерация станет1/3. Merge/base/native остаются отдельно.


## Чистка карточек: Plan Review → QA/фикс → affected QA, 3/3

Цель оператора — компактные собственные ТТХ и доступная кнопка i без потери
фиттинга. QA2 действительно обнаружила MC-UI-B1: colon-ID ломал render/Close.
Общий CSS.escape lookup исправлен85fee8c; QA3 закрыла installed/builtin класс
на1440/touch390,8 native cycles/errors0 и exact fit bytes/revision. MC01/03/05
перенесены по неизменности, не представлены новым полным прогоном. PR11 Draft.

Перечитаны current U2 PM_ERR1.3/DOC_PR. Ошибки: устаревшие presentation assertions
задержали guard; focus-only oracle не замечал исключение благодаря браузеру;
PM опять угадывал пути и перегружал чтения. Диагноз — неполный class sweep и
избыточный учёт evidence. Теперь проверяется один scoped ID lookup, native
Close/Escape/render/focus с pageerror oracle; numeric/action invariants сохранены.
Не добавлены защитные подсистемы, новый контракт или повторная часовая кампания.

Counter reset0/3; следующий один scoped Review4/5. После него один metadata
checkpoint/обычный guard и поставка того же immutable UI. H₂/Active — отдельное
ulab-6xr с готовым планом и U2 PR843; runtime этой задачи ещё не исправлен.
Новые проверки адресованы только CC01–05, источник выбирается через INDEX.


## Review4 → class fix → QA5: повторный аудит 3/3

Настоящий CR-MC-B1 найден у соседних idless ring/table callers. Прежний аудит
сырого colon-ID был неполным: исправленная общая функция всё ещё получала
пустую строку. 721e815 восстановил общий baseline fallback без новых IDs/state.
QA5:6idless+2named cycles/errors0, exact fit/result/revision; чужие GUI/native
или часовые результаты не присвоены. Новый Review closure требует1extra call;
запрошен явно по PM_ROLE§4, самостоятельного превышения5/5 нет.

PM_ERR1.3/DOC_PR применены: не менять контракт ради зелёного статуса, проверять
всех actual callers/пустой input, не превращать stateful focus в новую подсистему.
Диагноз — «чинить экземпляр вместо класса» и задержка поставки учётом evidence.
Counter reset0/3. Тот же QA-tested immutable preview можно дать оператору как
экспериментальный; финальный reviewer verdict не заявлен. Отдельная H₂ задача
имеет PLAN_READY и изолированный docs-only checkout; никаких cooling edits
под UI frozen candidate. Новый scope и budget отделены, прежние FAIL сохранены.
