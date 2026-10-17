---
title: "Внедрение Claude Design v2.1"
status: active
version: "1.0"
date: 2026-10-06
related:
  - docs/product/claude-design-ui-v0.2-acceptance.md
  - docs/verification/claude-design-ui-v0.2-contract.md
---
# Цель, текущее состояние и разница

Результат: работающие экраны Ship Fitting и Power & Heat по принятому Claude Design v2.1,
со всеми текущими данными и функциями, отдельными вариантами и удобной заменой.
Оператор требует сейчас перенести интерфейс и отложил изменения самой лабораторной модели.

Base: feat/ship-fitting-v0.2, 903d36b2ac4a2bfa90997803770ace13d520fbe9. Доступный immutable
fix-r3 stand работает на4183; исходные 163unit PASS в новом worktree. Ранее выполненный
interval fix уже входит в base; дальнейшие модельные исправления не включаются.

Сейчас mountFitting в src/app/fitting.ts создаёт все секции одной страницы, постоянный
каталог справа, один FittingSession, Worker и снимок A. Доступны реальные fitting,
compile/validation, controls, telemetry, JSON/CSV и Legacy. Разница с макетом:
самостоятельные экраны, новый паспорт/схема, группы и карточки, modal-каталог,
варианты, мобильная навигация, диагностические представления существующей телеметрии.

Source: docs/ux/claude-design/ целиком, exact26 новых файлов PR5abbd2943, без замены
нашего INDEX. Mock DSL/support.js/private canvas runtime не переносится.
Числа/модель/правила — GDD/SF01–20; accepted UI overlay уточняет перенос и владельцев состояния.

# Режим и границы

PRODUCT: независимый Plan Review → PLAN_READY → один Developer → QA по UI01–18 →
один scoped Code Review → исправление только blockers интерфейса → affected проверки →
metadata/finalize → операторский merge. Новых автоматических ревью-каналов нет.

IN: src/app presentation/controller state, стили, локальные визуальные assets,
тесты UI/workspace, пользовательская документация. Допустимо менять bootstrap UI import
в main.ts и package UI-версию; numerical modelVersion остаётся прежним.
Допустимый runtime surface: src/app/fitting.ts, fitting-session.ts, fitting.css, main.ts,
новые небольшие src/app/fitting-* / lab-* / fitting-ui/ files, public/assets/ и локальные
font files. Shared charts.ts менять только через необязательные presentation options,
с сохранением прежних defaults для Legacy. Не вносить root CSS, ломающее Legacy.

OUT: src/model, runner/Worker protocol, fitting catalog/compile/validate, scenarios,
io serializers, numerical fixtures/matrix, новое топливо/слоты/рынок/детекция,
реальный полёт, динамический шахтёрский цикл/заправка, database/persistence/schema migrations,
новый public deploy, main merge, native/bootstrap re-audit. Не делать лабораторные
bugfixes «заодно»; обнаружение вне интерфейса — запись отдельного факта оператору.

# Владельцы

PM: Beads primary solewriter, документация/план/контракты, публикация immutable evidence,
fingerprint и локальные servers, конкретный handover оператору.
Один Developer: весь runtime и durable automated tests; isolated
/Users/komleff/Documents/GitHub/u2-lab-claude-ui, feat/claude-design-ui.
QA: source-first cases, функциональная проверка по AC, никакого code fix.
Один Reviewer: Plan Review, затем scoped Code Review. Advisory не расширяет scope.

# Структура и последовательность

## U1. Рабочее состояние и оболочка

Разделить прежнюю монолитную mountFitting на session/controller + представления.
src/app/fitting-workspace.ts владеет вариантами, ревизиями, результатами/условиями,
selected variant, неизменяемым active snapshot и frozen A. Это UI-слой поверх текущих
FittingSession/compile/makeMiningRun/Worker, а не новая схема опыта.

Сохранить mountFitting/FittingController integration contract либо его совместимый адаптер.
Один Worker, opaque IDs через getRandomValues, фильтрация runId/commandId и ACK.
src/app/fitting-ui/ shell/state rendering разделяет fitting/lab/compare, не перезапускает
контроллер при навигации. Проверки UI01/02/07/08/09/16/18.

## U2. Fitting: паспорт, круг, группы

src/app/fitting-ui/ship-view.ts и slot-layout.ts: F1, фактический passport, ring geometry,
группы в порядке Payload/Propulsion/Power/Signature, встроенное внутри категории.
Использовать токены/иерархию Main и резерв V2-Flat. На390px — M2-Fitting: плоский
паспорт, сворачиваемые группы, закреплённое действие с safe area.
Подставлять существующие slot calibre/instance/label/nominal/mass/C/cargo.
Нельзя выводить чужие DEMO производители или фактическое измерение из номинала.
Проверки UI03/04/05/10/17.

## U3. Замена и варианты

src/app/fitting-ui/swap-dialog.ts: поиск/семейство/калибр/сортировка, причины несовместимости,
выбор → whole-ship preview → atomic apply/remove/batch. Dialog focus/Esc/return;
мобильный sheet M2-Swap. Варианты A/B/C доступны; «+ Вариант» копирует текущую сборку,
явно показывает своё имя и отсутствие измерения, без бесконечного фонового расчёта.
Успешная транзакция меняет только выбранный вариант на одну ревизию.
Сравнение вариантов и frozen test A/B используют existing compareMiningConditions.
Проверки UI06/07/08/11/14.

## U4. Power & Heat Lab

src/app/fitting-ui/lab-view.ts, lab-channels.ts, instance-details.ts: layout Lab,
навигация обратно в fitting, controls/cancel confirmation, locked conditions,
девять плиток, first limiter/resources/cooling, переключаемые группы каналов,
легенда, выбор события кнопками, таблица выбранного bucket, instance details/origins,
фильтры событий, ledger/sources/export и frozen A/B.
Использовать actual metric/state/event/channel fields и явные units.
Телефон — LabM-Run/Channels/AB, одна колонка и закреплённые controls.
Не добавлять под видом формы реальную миссию: существующая workSeconds остаётся
«Рабочая фаза · s» внутри подписанного лабораторного сценария.
Проверки UI09/10/12/13/14/15/17/18.

## U5. Проверки и candidate

Developer automated tests проверяют workspace owner/atomicity/stale result и meaningful
browser workflows; не писать snapshot tests, повторяющие HTML.
Обновить browser selectors на semantic роли и реальные новые переходы, сохранить
старые numerical/replay/input regressions. Normal project verify guard обязателен:
typecheck, allunit, build, browser, bootstrap/reference/offline checks.
Добавить standalone smoke actual localhost и ordinary non-loopback HTTP плюс
selfsigned HTTPS /u2-lab prefix; запуск/пауза/сброс/шаг/импорт, assets same-origin.
Не использовать только localhost для Start. Node API absence randomUUID проверяется.

Новый immutable artifact dir, ZIP, manifest и per-file digests; старый stand не трогать
до handoff. UI asset network requests локальные, никакого support.js/CDN runtime.
Физический Xiaomi — operator check отдельно; desktop device context не выдавать за него.
PM безопасно переключит4183 на проверенный candidate;4173 резервирован проверкам.

## U6. Независимая приёмка и передача

QA получает accepted source + entire UI VC и final exact SHA/path binding; подготовка
source-first методов может идти до implementation, runtime verdict — только final handshake.
Code Review Contract перед review перечисляет изменённые UI paths, AC и риски:
variant/result owner, atomic import/batch, run snapshot/late messages, same-origin/LAN,
honest measurement and mobile reachability. Визуальная сверка с источником — конечная
проверка раскладки, без дополнительного cosmetic review-loop.

Сверить неизменность numerical/legacy/catalog/scenario/io/Worker paths с base; старые
физические12h evidence переносятся только при exact source equivalence, не запускаются
ради CSS. Детерминированные проверки на текущем HEAD после metadata обязательны.
Опубликовать immutable QA/review, обновить Beads/memory/INDEX/PR body, Draft сохраняется
по base-bootstrap gates. Main merge только оператором.

# Синхронизация документов

В этой UI-ветке presentation-поправка GDD§3/8 и brief§4 отражает builtin внутри групп,
отдельные экраны и слово «тест». Numeric/domain paragraphs/formulas сохраняются.
Это явно принятая UX-поправка; старые scoped reports остаются историей exact frozen
source, новый UI binding включает новые тексты. SF IDs/требования сохраняются;
интерфейсные подписи «опыт» синхронизируются через overlay, schema/API не переименуются.

# Rollback

Вернуться к immutablefix-r3 dist и прежнему root server path; old artifacts/reports остаются.
Ветка UI stacked отдельно; при blocker не публиковать её как готовую и не merge.
Никакой migration/persistent data write: в-memory variants пропадают только при закрытии
страницы, пользователь сохраняет существующий fit/run JSON. При сбое импорта остаётся
последняя валидная сборка/результат. Не force-push и не обходить guards.

# Verification

Весь docs/verification/claude-design-ui-v0.2-contract.md обязателен. Отдельное расширение
полной игры/рейса не является acceptance этой ветки. Plan Review открывается на exact
committed documents, до начала runtime кода.

