---
title: "Передача PM по модернизации U2 Lab"
status: handoff / product acceptance stopped
date: 2026-10-11
related:
  - docs/plans/2026-10-10-ship-model-v0.1-update.md
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/plans/2026-10-11-ship-model-entry-ux.md
---

# Передача PM по модернизации U2 Lab

Модернизация **не завершена**. Новое численное ядро и каталог реализованы, но
пользовательский результат не соответствует поручению: новая модель открывается
в отдельном урезанном экране вместо расширения существующей Лабы. Оператор
отклонил результат. Сохранность старого приложения без нового функционала эту
ошибку не исправляет.

Это снимок состояния для следующего PM, а не новый источник продуктовых правил,
план реализации или подтверждение готовности. Git/PR/Beads сверены 2026-10-11;
CI PR #23 повторно сверена после terminal SUCCESS в 12:24 по Новосибирску /
05:24 UTC. При продолжении необходимо повторно проверить freshness, а не
доверять этому снимку как канону.

## Проект и роль

- PROJECT: `komleff/u2-lab`; product authority — Дмитрий Комлев / `komleff`.
- BOOTSTRAP: OverGate `v4.0.0-rc.1`, frozen trusted SHA
  `633937250fa8f47b49f928c1d8781ab17fe8c8e3`. Managed payload установлен;
  bootstrap/base acceptance не закрывается этим отчётом.
- PIPELINE: `.agents/PIPELINE.md`, `.agents/PIPELINE_ADR.md` §§3.28–3.32;
  PRODUCT: independent Plan Review → PLAN_READY → Developer → QA → один scoped
  Code Review → finalize → merge оператором.
- ROLE: PM. ROLE OWNER: `.agents/PM_ROLE.md`. ROLE MODE: PRODUCT orchestration;
  PM не реализует runtime за Developer.
- Настройка, заданная оператором: GPT-6.1 Sol / effort `xhigh`.
  Developer/QA/Reviewer указали эту модель и effort в опубликованных reports.
- MISSION: модернизировать существующий инструмент ГД новой моделью, модулями и
  расчётом сигнатур, сохранив его рабочие возможности и привычный интерфейс.

## Задача и авторитетные источники

TASK / MODE: незавершённая интеграция ship-model v0.1 в существующую Лабу,
PRODUCT. Текущий work item — `ulab-9aa.18`, PR #23.

Последнее уточнение оператора в этой сессии 2026-10-11:

> Я хотел просто модернирнизировать старую версию, а не строить ее заново!

Оператор не должен заново перечислять, какие функции вернуть. Существующая
Лаба и принятые требования уже задают базу. Новый дизайн и новый пользовательский
процесс не поручались. Старый UI с прежними числами не является выполненной
модернизацией; новые графики должны показывать настоящие данные новой модели.

PRODUCT SOURCE / PLAN / VERIFICATION CONTRACT:

1. Первое чтение для нового PM: `.memory-bank/activeContext.md`,
   `.memory-bank/progress.md`, `docs/INDEX.md`, затем role/pipeline owners.
   Memory Bank разных worktrees может отставать; проверять привязку к PR/HEAD.
2. [Согласованный план v1.2](../plans/2026-10-10-ship-model-v0.1-update.md)
   на `692385dfae5232b6e2ab91d22d7431e144194a1c`, §2, D0/T1–T6, SM-01–14.
   [Affected PLAN_READY](https://github.com/komleff/u2-lab/pull/21#issuecomment-6100571178);
   оператор одобрил реализацию.
3. [ТЗ стенда](../specs/spec_u2_lab_ship_model_v0.1.md) v0.11 и
   [модель PR #19](../gdd/gdd_ship_energy_thermal_model_v0.1.md) v0.11;
   поздние решения оператора и thermal matrix §1 плана разрешают старые
   противоречащие формулировки. Данные GPT-агента из PR #19 были назначены
   оператором авторитетным входом; отсутствующие ТТХ не придумывать.
4. [Рабочий процесс ГД](../product/ship-fitting-gd-workspace-v4.md): WF01–15,
   UI48-01–06. В HEAD — v0.8; в рабочем дереве есть **незакоммиченный PM draft
   v0.9**, фиксирующий отказ оператора от отдельного урезанного экрана.
   Проверить этот diff; не считать draft независимым PLAN_READY.
5. [Прежний entry-план](../plans/2026-10-11-ship-model-entry-ux.md), UE-01–06:
   исторический узкий HOW. Его PLAN_READY на `124ab51` не разрешает новую
   интеграцию и не подтверждает сохранность WF/UI48.
6. [Передача согласований в U2](2026-10-10-u2-gdd-ship-specs-update-list.md).
   Источники основного U2 выбирать через его `docs/INDEX.md` и
   `docs/architecture/ADR-INDEX.md`, не через совпадения поисковых слов.

Уже согласованные правила не переоткрывать как PRODUCT GAP:

- Military hull + Combat: горячий температурный множитель `f_T=1` для всех
  установленных температурно-чувствительных активных модулей независимо от их
  класса только при `T_work_high < T_ship < T_crit_high`. Ускоренный износ
  действует; питание, топливо и состояние по-прежнему ограничивают результат.
- При `T_ship >= T_crit_high` обязательное выключение, включая Combat.
  Холодная ветвь Combat обычная. Restart: допустимая температура с гистерезисом,
  затем прочность и cooldown; температурная остановка не сбрасывает прочность.
- Masking не наследует Combat override. Критическая защита и действующий
  restart уже определены. Численный холодный H₂/упреждение/гистерезис — следующий
  этап, не обещанная готовая возможность текущей поставки.
- Quiet action-policy применяется до нагрузки/тепла/излучения. IR positive-only
  и `|contrast|` — два профиля приёмника; сохраняются модель и выбранный профиль.
  После ремонта в `R>=0` первый отрицательный переход снова требует отказа.
- Первый набор — Спутник, Мир и отдельная Stealth-сборка. Принятое оснащение
  Military не разрешает выдумывать полный военный паспорт и численные ТТХ.

Frozen inputs U2: [PR #842](https://github.com/komleff/u2/pull/842)
`5140593658bd315951129ffddd0ded240845dc2f` и
[PR #848](https://github.com/komleff/u2/pull/848)
`db32125f769d12d4307ed88356a0907e2f4e148c`.
На сверке оба OPEN, не merged; U2 main —
`c780ffafcd1fd027fb5e3dfd99e2d2bc457b9087`. Не утверждать, что эти решения уже
влиты в main; принятые решения оператора не отменяются их draft/PR-статусом.

## Репозиторий и кандидаты

REPOSITORY: `/Users/komleff/Documents/GitHub/u2-lab`.
Удалённый U2 Lab main на сверке — `9469d3e8998dada5ec3a6f99712fae8345fb3f7f`.
Все три PR OPEN / Draft; merge/auto-merge не выполнялись.

| PR | BRANCH | BASE SHA | CANDIDATE SHA |
|---|---|---|---|
| [#21](https://github.com/komleff/u2-lab/pull/21), согласование плана | `fix/lab-durability-adr0066`; base ref `plan/ship-model-v0.1-update` | `bad4ad5257df575b73ed658585d4c25dfebdbe7a` | `692385dfae5232b6e2ab91d22d7431e144194a1c` |
| [#22](https://github.com/komleff/u2-lab/pull/22), runtime | `feat/ship-model-v0.1-runtime`; base ref PR #21 | `692385dfae5232b6e2ab91d22d7431e144194a1c` | `d03fb99ac5c34914843baf765edc8b3a9a994bae` |
| [#23](https://github.com/komleff/u2-lab/pull/23), entry UX; приёмка STOP | `feat/ship-model-entry-ux`; base ref PR #22 | `d03fb99ac5c34914843baf765edc8b3a9a994bae` | `dedd6af978a104a076101088b22da99d343c3844` |

Нужные локальные worktrees:

- `/Users/komleff/Documents/GitHub/u2-lab-ship-model-entry` — PR #23, текущая
  точка продолжения; runtime HEAD `dedd6af`. До handoff единственный tracked diff
  — PM-owned `docs/product/ship-fitting-gd-workspace-v4.md` v0.9.
- `/Users/komleff/Documents/GitHub/u2-lab-durability-adr0066` — PR #22,
  `d03fb99`; на сверке clean.
- `/Users/komleff/Documents/GitHub/u2-lab-gd-energy-research` — исходная линия
  плана, `plan/ship-model-v0.1-update`, HEAD
  `bad4ad5257df575b73ed658585d4c25dfebdbe7a`.
- `/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime` — сохранённый
  UI4.8, HEAD `01b15fdbb31464df84e9c3c6297383f90bf43a5b`.

Основной checkout находится на `feat/ship-fitting-mission-medium`, HEAD
`e4d3926a82ef76761a567c726837ceb5be3f8d25`, а не на runtime branch. В нём были и
сохранены dirty `.memory-bank/activeContext.md`, `productContext.md`,
`progress.md`, `docs/reviews/2026-10-06-pm-self-audit.md` и untracked
`docs/.DS_Store`. Не включать их в чужой commit и не очищать.

## Выполненная работа и пределы её приёмки

DONE — реализация Developer в PR #22:

- D0/T1: conformance input, `/4` schema, catalog `ship-fitting-0.3.0`,
  model `ship-fitting-ship-model-0.1`, fit compilation с diff/provenance.
- T2/T3: контроллер 1 s, power/heat, каскады, температурный долг буфера,
  раздельные поверхности/радиаторы и TI.
- T4: прочность/износ, остановки/restart/repair, RNG/latches и полный checkpoint.
- T5/T6: Masking/сигнатуры/observer, кандидатные опыты, seed/replay/retention,
  production checks и отдельный experimental экран.
- Начальные runtime blockers и UI-B1/B2 были исправлены: imported task не
  заменяется скрыто, active/measured/next draft ownership разделён.

DONE — узкий entry patch PR #23, `dedd6af`:

- Видимый выбор/открытие и путь **реальный старый Спутник → preview/diff →
  explicit Apply → actual Worker**; native reference не подменяет старую сборку.
- Literal открытие fit/run/result, atomic/stale/async guards, measured initial
  T/mode в A/B, группировка controls и отображение чисел.
- Исправлены две соседние old-import/browser регрессии без изменения физики.
  Commit: 13 paths, 303 insertions / 53 deletions.

Это полезные реализованные части, но **не выполненный исходный пользовательский
результат**. Сохранить их evidence; не считать, что старый «FINAL ACCEPTANCE —
Lab Exit PASS» разрешает завершить модернизацию после отказа оператора.

IN PROGRESS: `ulab-9aa.18` — `in_progress`, P1. Canonical `bd show` подтверждает
`.10`–`.17` как `closed`; это отражает прежний учёт и опубликованные узкие
вердикты, а не отменяет незавершённость исходной задачи. В `.18` есть комментарий
операторского отказа от отдельного UI и остановки приёмки. Description/AC/ранние
notes `.18` ещё описывают entry-only scope и требуют актуализации новым PM.

OPEN: новый HOW/Verification Contract интеграции не написан, affected Plan Review
не проведён, новый DEV_RELEASE не выдавался. Runtime интеграции не начат.
В начале PR #23 body опубликован STOP; `CONTRACT-BEGIN/END` пока содержит прежний
entry-only контракт. Его надо актуализировать до нового affected review.

Beads — единственный task tracker; Memory Bank — контекст, Git/PR — документы и
evidence. Единственный writer — основной checkout оператора, только через `bd`
API. В hosted Work использовать read-snapshot/write-intents по AGENTS.md, не
запускать bd/Dolt/applier/export и не писать Dolt/JSONL вручную. Pending intent
не canonical status; handoff не закрывает и не переоткрывает задачи.

## Проверки и evidence

EVIDENCE — опубликованные источники, сохраняющие свои собственные scope:

| Источник | Что действительно подтверждает |
|---|---|
| [PR #22 runtime affected QA](https://github.com/komleff/u2-lab/pull/22#issuecomment-6102660174), [runtime Review](https://github.com/komleff/u2-lab/pull/22#issuecomment-6102704482) | Адресованные численные/сохранённые состояния после runtime fixes; не сохранность полного UI4.8 workflow |
| [UI-B1/B2 QA](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103421614), [scoped Review](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103483698) | 15 unit, 5 Worker/browser, 2 automated file-input probes; scoped closure двух ownership/import blockers |
| [Прежний PM Lab Exit](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103659416) | Исторические counts/SHA/bindings; его обобщение о завершении плана было ошибочным |
| [Ревью ГД/UX/UI](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103661908) | Ограниченный desktop/исходниковый осмотр и A1–A3; ошибочная рамка не сочла отсутствие графиков регрессией для новой модели |
| [Entry PLAN_READY](https://github.com/komleff/u2-lab/pull/23#issuecomment-6105341288) | Только UE-01–06 на `124ab513e4cb110380d0d6140165f03f6a876118`, 0B/0A; не новый integration contract |
| [Entry Developer report](https://github.com/komleff/u2-lab/pull/23#issuecomment-6105555012) | Авторский RED/GREEN, normal guard и 13-path binding `dedd6af`; не independent QA |
| [PM operator-triggered audit / STOP](https://github.com/komleff/u2-lab/pull/23#issuecomment-6105587502) | Ошибка scope, отказ оператора, остановка QA/Review/finalize и дальнейший read-only discovery |

Исторический normal local guard `d03fb99`: 1266 unit, 127 browser PASS +
1 inherited skip, 26 cloud, type/build/reference/bootstrap PASS по опубликованным
reports. Оба exact CI PR #22 — terminal SUCCESS:
[push 38095515623](https://github.com/komleff/u2-lab/actions/runs/38095515623),
[PR 38095518610](https://github.com/komleff/u2-lab/actions/runs/38095518610).

Исторический normal local guard `dedd6af`: первый exit1 сохранён;
после адресного fix повторный exit0 — 1269 unit, 138 browser PASS +
1 inherited skip, 26 cloud, type/build/reference/bootstrap PASS.
Exact CI PR #23 на повторной сверке: [push 38112530823](https://github.com/komleff/u2-lab/actions/runs/38112530823)
terminal SUCCESS (05:04:33 UTC);
[PR 38112534263](https://github.com/komleff/u2-lab/actions/runs/38112534263)
terminal SUCCESS (05:24:12 UTC), оба на `dedd6af`.
Это не новый запуск тестов автором handoff и не пользовательская приёмка.

Примеры разных bindings, не взаимозаменяемых:

- PR #22 QA182: `2ba16a2b55a237b9ca337af143b0371d49f3480ab2c5fdcf6ad1ec40c097f086`;
  UI Review17: `0ed183892b48361587fc4957d56dacc89af5e63c3befa2838b669631512287cb`.
- Entry Plan Review20: `76fef7c785fb2689ad9b2155fe4ad1c959f501b817fd439b2a19585d7a6b5976`.
- Entry Developer13: `b4f05ba6b8c86e48202f295916cf7313f920db6e84fc5f127246891fd4c64383`;
  recipe — SHA256 JSON ordered path/file-SHA pairs, не ADR contract fingerprint.

## Реальная причина и результат технического исследования

`src/app/fitting.ts:78` вызывает `mountShipModel`, а `:180` делает early return
в отдельный render. `src/app/ship-model.ts:39` строит сокращённую страницу.
Существующие `conditions`, `ship-view`, `lab-view`, `lab-channels`, `trace-chart`,
общий time/events, comparison и exports не удалены, но не подключены к `/4`.
План §2 прямо описывал существующий workflow, T5 перечислял эти UI helpers.

Основной Developer завершил **read-only** исследование повторного использования.
Локальный полный отчёт:
`.superpowers/sdd/2026-10-11-ship-model-entry-ux/integration-discovery.md`.
Это ignored recovery artifact; на чистом клоне его может не быть. Главное:

- Настоящие V3 fit/slots/instances/catalog уже есть. Существующие карточки,
  каталог/поиск, swap preview/Apply можно использовать с V3 validation;
  Workspace пока не даёт обычного validated slot replacement.
- Составные phases/repeat/per-instance requests и phase mode/environment уже
  исполняются. Не объявлять их отсутствующей физикой; нужен доступ из существующей
  области условий с сохранением целого imported task.
- Retained buckets, channels/events и power/heat/T/charge/buffer/`signal:*`
  доступны. Общий chart/time/legend/event UI может получать узкие typed selectors.
- Latest state содержит fuel/R/stops/cooldown/phase и поверхности. Для исторических
  кривых этих полей нужны реальные producer channels, а не размножение latest
  значения по прошлым bins. Проверить стабильную доступность условных TI channels.
- Для редактирования следующего draft нужен captured active variant owner;
  для A/B — отдельный frozen measured baseline. Не снимать busy guard без ownership.
- Exact pre-retention IR/EM statistics пока отсутствуют:
  `RunResultV3.signatures` — `{version,last}`, IO допускает эти поля.
  Для сохранения UI48 нужны адресные accumulator/persistence additions;
  retained approximation не выдавать за точные saved statistics.
- `/4` не содержит прежних mission/cargo/SCU/trajectory/delivery и
  CS/paid-radar/contact runtime. Это обнаруженная техническая недостача, **не
  разрешение вычеркнуть старые сценарии** и не автоматически доказанный PRODUCT
  GAP. Новый PM должен сверить действующие owners/ранее принятые миссии и
  зависимость от нового расчёта прежде, чем предлагать продуктовый выбор.

Рекомендация Developer для HOW: **существующая единая Lab shell + узкие
model-specific selectors**, ShipModelWorkspace остаётся owner реальных `/4`
draft/active/results. Это технический вариант для нового плана, не PLAN_READY.
Не копировать прежние panels в очередной standalone screen и не создавать
универсальный Workspace framework без необходимости. Raw spec/result/checkpoint
и экспорт остаются настоящими versioned объектами; view adapter не сериализуется.

## Ошибки PM и корректировка тактики

1. Я принял отдельный урезанный экран как допустимую реализацию вместо расширения
   прежнего инструмента. Разделение numerical schema не требовало разделять UI.
2. Я сузил acceptance до новой поверхности и принял technical PASS за достижение
   исходной цели. Отсутствие новых графиков было ошибочно отделено от регрессии
   пользовательского процесса только потому, что old plots оставались в old mode.
3. После первых жалоб я продолжил исправлять entry/цвета/типографику, не остановив
   потерю возможностей сразу. Перекрашивание не исправляет интеграцию.
4. Я обязан был сам проверить сохранность прежних рабочих цепочек, а не создавать
   оператору необходимость перечислять утраченные функции.

Причина «гниение контекста/компактификация» **не доказана**. Часть истории сессии
сжата, но нет установленной связи между конкретным сжатием и решением. Ошибка
PM доказуема по доступному плану, коду и рамке приёмки; не списывать её на контекст.

Оператор требует самоаудит по `PM_ERR.md` и `DOC_PR.md` каждые три реальные
review/fix итерации. Последние обычные audits: [итерация 12](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103321287),
[13–15](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103487843);
после жалобы выполнен ранний [operator-triggered audit](https://github.com/komleff/u2-lab/pull/23#issuecomment-6105587502).
Reference files читались из `/Users/komleff/Documents/GitHub/u2/.agents/`.
Аудит не добавляет verifier launch и не обнуляет budget. Баланс, заданный
оператором: внутренний инструмент, правильная функциональность и быстрый
результат важнее перфекционизма; защита от review не должна превышать функционал.

## Остановка, открытые вопросы и ограничения

BLOCKERS: операторский отказ от отдельного урезанного UI; отсутствие интеграции
новой модели в прежний workflow; отсутствие актуального HOW/VC и PLAN_READY для
этой интеграции. Текущая поставка не готова к приёмке/finalize.

PRODUCT GAP: отдельный thermal gap закрыт согласованным планом v1.2. Новых
доказанных продуктовых неопределённостей этот handoff не устанавливает.
Отсутствующие producers/runtime исследовать по owners; не превращать техническую
недоработку в запрос оператору повторно сформулировать задачу.

DECLARED LIMIT: actual U2 server/client parity SM-14, physical second LAN device,
native hook activation, physical touch/OS picker, playtest/balance и canonical
TTX не подтверждены. Detection не включать в текущую приёмку. Bootstrap/base
B0/B6/B8 и merge — внешние незакрытые gates, не разрешённые PM риски.

Verifier budget PR #23: **2/5 использовано** — Plan Review и остановленная QA.
QA вывела 14 source-first cases, но **tests/probes не запускала**, final verdict
и fingerprint не выпускала. Code Review новой редакции не запускался.
Предыдущий PLAN_READY `124ab51` не переносится; бюджет не сбрасывается сменой PM,
переименованием задачи или остановкой QA. Для PR #22 опубликован учёт 3/5;
не смешивать budgets work items и не запускать recovery swarm.

Существующие агенты на момент сверки завершили свои turns и находятся в STOP:
`ship_model_developer` (после discovery), `ship_model_qa` (после остановки),
`ship_model_code_review` (после прежнего Plan Review). Текущего DEV_RELEASE нет.

Preview сохранён: `http://127.0.0.1:4197/` — существующая Лаба со старой моделью;
`?shipModel=experimental` — отдельный отвергнутый `/4` экран. Второй preview —
`http://127.0.0.1:4198/`. На сверке 4197/4198 слушают PID24592/PID23279,
4197 отдаёт HTML; это проверка доступности HTTP, не новый native workflow smoke.
Ранее verified build: `fitting-DUiHcdE3.js`, SHA256
`c6ba25407c13f4d33f181319d41bac68bde349893a90bf2984ec7a1395beef22`;
Worker `CvVkapPV`, SHA256
`146c91a445e721453ace0f2132d270df0d63bf59e262ba608e31b212499adeb5`.
Не перезапускать/пересобирать стенд оператора только ради оформления передачи.

## Следующее безопасное действие

NEXT SAFE ACTION для свежего PM:

1. Независимо перечитать исходный согласованный план/ТЗ и current owners;
   проверить HEAD/PR/Beads и PM draft v0.9. Не наследовать мой вердикт «готово».
2. Самому сопоставить существующую Лабу с новой моделью по целым рабочим цепочкам:
   открыть/переоснастить → составные условия → Worker/control → graphs/live/time/
   journal → frozen A/B → export/reopen. Использовать реальный сохранённый UI4.8
   и действующие specs, а не просить оператора перечислить потери.
3. Исправить HOW/Verification Contract для расширения **существующего приложения**,
   включая необходимые producer/IO/ownership additions; актуализировать PR/task
   scope. Отдельно исследовать техническую недостачу mission/signature instrument
   по ранее принятым owners, не выдумывать числа и не вычёркивать требования молча.
4. Провести один affected Plan Review с адресом сохранения WF/UI48 и новых
   SM-правил. Затем один основной Developer, QA на whole user chains и один scoped
   Code Review. Пользователь уже разрешил автономную реализацию; routine
   подтверждения, особенно пока он спит, не запрашивать.
5. Принимая результат, показать новые модули и реальные новые графики/live данные
   в привычной Лабе. Не считать доступный old mode доказательством модернизации.
   Соблюдать budget и требуемый самоаудит, без новой программы review ради review.

DO NOT: не реализовывать runtime как PM; не строить ещё один UI; не удалять полезное
ядро, старые workflows/evidence/saved data; не подменять новые измерения V2 casts,
fake SCU/stats или скрытым old solver; не мигрировать историю молча; не менять
принятые правила U2; не закрывать `.18` по прежнему PASS; не переносить historical
PLAN_READY; не bypass guards/credentials; не обновлять main и не merge/auto-merge.

## Изменения при создании этого handoff

Созданы только этот отчёт и ссылка на него в `docs/INDEX.md` worktree PR #23.
PM draft v0.9 сохранён без изменения; runtime/tests/dist/preview/Beads/PR не
менялись. Отчёт и индекс оставлены **незакоммиченными**; кандидат HEAD остаётся
`dedd6af`. Проверка документа — readback и `git diff --check`; новая
`.agents/project/verify.sh`, runtime QA или Review ради handoff не запускались.
