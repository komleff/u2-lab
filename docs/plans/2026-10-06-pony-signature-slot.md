---
title: "Дизельный Пони — один слот контроля сигнатур"
status: proposed
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/product/ship-fitting-gd-workspace-v4.md
---

# Принятое WHAT и цель

Оператор: «вместо двух слотов сигнатур оставим один». Для новых сборок Pony
оставить `signature-1`, убрать `signature-2`. Ограничить выбор сочетаний охлаждения;
конкурентоспособность относительно Industrial S — гипотеза для последующих опытов,
а не заранее объявленный численный результат. Industrial S сохраняет три слота.
Остальные корпуса, ТТХ, встроенные изделия и размеры/классы штатных лазеров неизменны.
Изменение принято для Лабы; это не обновление внешнего канона U2.

Совместимость наследуется из C04/C05 каталога0.2.1: старые fit/run/result сохраняют
свою редакцию, без удаления модулей и пересчёта измеренных результатов при открытии.
Новое ограничение имеет редакцию `ship-fitting-0.2.2`; прежние0.2.0/0.2.1 сохраняют
двухслотового Pony. Это номер каталога, отдельно от проектируемой миссии v2.2.

# Состояние, граница и HOW

Baseline runtime15f5d90e97b696b8738a204953af852942bec704, эквивалентные product blobs
в root44a2632360e80f0b9a1fffb4c7ad613dbf255cd9. Сейчас все редакции берут общий
`hulls.json`; validation, compile и UI читают `c.hulls` без версии текущего fit.
`current === 0.2.1` также нужно распространить на0.2.2, иначе откатятся новые presets.
Режим PRODUCT: один существующий Plan Reviewer, Developer, QA, scoped Reviewer.
PM не пишет runtime. Новая миссия, схема файлов, численный kernel, Worker, графики,
редизайн и дополнительные изменения баланса не входят в эту задачу.

1. Developer работает в существующем isolated `u2-lab-claude-ui`, новая ветка от
   PM plan HEAD после PLAN_READY. До кода сохранить независимую исходную опору0.2.1
   для Pony1/2/3: fit/spec/zero/partial/completed digests. Existing0.2.0 oracle не менять.
2. TDD: добавить проверки P01–P04, получить RED; расширить known-edition/type/default
   до0.2.2. Общий resolver hull по declared fit edition: при совпадении edition
   уважать переданный catalog (включая test/local overrides); при несовпадении брать
   корпус объявленной известной edition. Не создавать circular imports или менять
   исторический `hulls.json`. В0.2.2 только Pony overlay без `signature-2`.
3. Использовать resolver в validation/installed instances/compile, passport,
   replacement/nominal, ship-view/dialog/F3, incomplete-conditions validation.
   Known experiment/result import проверяет законность слотов объявленного fit;
   переименование stamp не позволяет выдать старый двухслотовый Pony за новый.
4. GREEN: targeted tests, typecheck, build, browser P05 и нормальный project guard.
   Исторические tests0.2.1 явно фиксируют свою edition; unknown fixture становится
   действительно неизвестной0.2.3, без ослабления отказа. Source/kernel/runner paths
   вне scope сохраняют blobs. Новый immutable dist/ZIP с manifest и Developer report.
5. QA проверяет P01–P05 на exact candidate, затем один scoped Code Review этой delta.
   PM импортирует runtime commit, публикует evidence и после PASS/APPROVED обновляет
   owned4188. Старые4183/4186 и артефакт0.2.1 сохраняются. Merge выполняет оператор.

Ожидаемые файлы: `src/fitting/{types,editions,catalog,validate,compile}.ts`,
`src/io/fitting-json.ts`, `src/app/fitting-workspace.ts`, `src/app/fitting.ts`,
`src/app/fitting-ui/{presentation,ship-view,swap-dialog}.ts`; relevant tests в
`tests/fitting/` и `tests/browser/`. Новый data файл — только если нужен для ясного
versioned overlay. Serializers/schema/model/runner не переписывать.

# Verification Contract и Review Focus

| Адрес | Проверка и ожидаемый результат |
|---|---|
| P01 | New Pony1/2/3 presets и UI имеют только removable `signature-1`, штатный passive radiator; buffer из прежнего `signature-2` не установлен. Нельзя установить два signature modules. Прочие power/payload/builtin настройки сохранены. |
| P02 | Все45 SKU, пять других hulls и все Pony fields/builtins кроме удалённого слота и записи происхождения этой правки равны baseline; Industrial S имеет3signature slots. Provenance нового ограничения указывает принятое lab решение. |
| P03 | Existing0.2.0 oracle и pre-change0.2.1 Pony hashes совпадают. Старые fit/run/result импортируются/редактируются/экспортируются в свежей странице с исходным stamp и двумя слотами; active/result/reference не мутируют при выборе нового preset в другом варианте. |
| P04 | Подложный0.2.2 fit с `signature-2`, его run/result, malformed/unknown edition отклоняются атомарно. Неполные Pony обеих редакций принимают valid conditions без remount actual fit; invalid conditions не меняют состояние. |
| P05 | Genuine LAN desktop и mobile viewport: новый Pony→замена sole radiator→short run→анализ→fit/run/result export→fresh reopen; старый Pony→второй slot/dialog→Apply→short run. В UI видна edition; группы слотов, управление во время Worker, сравнение и F3 согласованы с measured/draft ownership. |

Review Focus — P03 historical second-slot editing, P04 false edition claim,
P04 incomplete conditions, P05 active-vs-next, P02 inherited0.2.1 defaults.
Каждый риск имеет адрес проверки; новый verifier запускается только по этим адресам.
Полные12h/H3600/Cartesian matrices не требуются для этой delta.

Rollback: вернуть owned4188 на сохранённый immutable0.2.1 dist. Старые файлы сборок
и результаты не переписываются; страницы пользователя не reload автоматически.
Self-audit counter до первого Plan Review1/3; после следующего QA+triage будет3/3.
