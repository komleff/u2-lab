# План поставки «Стелс и тепло», 2026-10-17

PM: `docs/plans/2026-10-17-stealth-thermal-delivery.md`, ветка `docs/stealth-thermal-plan` от
`main` 6372717, Draft PR с планом до кода. Семь work items, каждый — свой PR от `main` после слияния
предыдущего (без стека): WI1 буфер+оболочка → WI2 каталог 0.3.2 (без встроенного обогрева, антенны,
RAM) → WI3 национальные оси+EM → WI4 радар `/4`+max(IR,EM) → WI5 описания → WI6 каталог 0.4.0 →
WI7 опыты сессии. Очередь `gd-stealth-2026-10-13.jsonl` применена оператором: эпик `ulab-4fl`,
P1 `ulab-zym` (буфер) и `ulab-rpy` (печь), каталог `ulab-81m`. Plan Review v0.1 (запуск 1/5):
CHANGES_REQUIRED — правило температуры заряда (ТЗ v1.10 §5.5) несовместимо с полной разгрузкой
стелса в поле 250 K; PRODUCT GAP оператору, рекомендация PM (а) по канону U2 quiet-equipment §3.4.
v0.2 исправила B2/B3 и advisory; affected recheck на c57ba43: WI2–WI7 PLAN_READY, WI1 ждёт
решения оператора (при (а) — с правкой B4 «отдача ≤ свободного теплосброса», внесена в v0.3).
Первым идёт WI2. Новая очередь `stealth-plan-2026-10-17.jsonl` (2 deps, 2 notes) не применена.

# ГД-ревью стелса и класс «Стелс», 2026-10-13

Оператор принял класс «Стелс» (`docs/product/stealth-class-v0.1.md`, ТТХ — кандидаты): корпуса
S/M/L, тихий водородный двигатель, радиаторы назад, буфер под окно сессии (S 0,4 ГДж), девять
именных кораблей Sinclair/Тензор/Guanzhao, национальные оси, конструктивная EM-чистота английской
школы, геометрия моделей. Встроенной электропечи нет ни у одного корпуса. Ошибки движка и задачи —
очередь `.bd-intents/gd-stealth-2026-10-13.jsonl` (13 задач, эпик «Стелс и тепло»; P1 — разрядка
буфера после маскировки и встроенная печь); применяет оператор после слияния PR #25. Опыты —
`docs/research/2026-10-13-stealth-class/`. В таблице «Решения оператора» gd-proposals v2 строки про
электропечь и штраф экрана к антеннам — предложения ГД, оператором отвергнуты.

# Перенос стека в main, 2026-10-12

До PR #25 `main` содержал только Initial commit; вся работа шла стеком Draft PR #1→#23
(+#24, влит в #23 оператором). PR #25 `chore/land-stack-to-main` переносит вершину стека
`6155590` в `main` и добавляет только документы: два cloud-отчёта bootstrap из #1,
`docs/archive/thermoinverter-radiator-coupling-v0.1.md` (superseded → тепловой насос v0.4)
и `docs/archive/2026-10-09-pm-context-snapshot/` (незакоммиченный журнал PM 06–09.10).
#3 и #5 закрыты как вошедшие в стек; #1, #2, #4, #6–#23 закрываются после merge #25.
Merge — оператор. После merge новые рабочие ветки создаются от `main`.

# Ship-model v0.1 — checkpoint перед независимой проверкой, 2026-10-11

Draft PR22: https://github.com/komleff/u2-lab/pull/22. Актуальные статусы — только
canonical Beads ulab-9aa.10–.16 и опубликованные evidence PR; эта запись фиксирует
подготовку кандидата, не окончательный verdict. Один Developer GPT-6.1 Sol/xhigh.
D0/T1 b5cb313 и T2/T3 476392d прошли обычный full guard. T4–T6 подготовлены
в той же рабочей ветке; адресные проверки T4 и real Worker CP05, T5 UI1440/390/820
и pause/save/import/resume пройдены. Последняя квитанция T6:55 production cases,
versioned measured artifacts/CP full-state export, literal reproduction и bounded
10,000s/5000+restore5000 equivalence GREEN. Итоговый full guard/commit ещё впереди.

Следующий переход: frozen candidate + обычный verify → independent QA SM-01–14
внутри Lab → один scoped Code Review → только blocker fixes/affected rechecks.
PRODUCT verifier budget до запуска QA:1/5; review/fix counter0/3. Каждая третья
итерация — PM_ERR.md/DOC_PR.md самоаудит PM (references в primary U2 .agents/).
Полезная функция важнее полировки; advisory не расширяет поставку автоматически.
Новые guards/переопределение WHAT не добавлены. PM runtime не реализует.

Preview: http://127.0.0.1:4197/?shipModel=experimental, explicit opt-in candidate;
это не acceptance. Старые4196/4189/Pages/archive не менялись. После проверок
читать актуальный SHA/verdict/CI/риски в PR22; не переносить прошлый PLAN_READY
на runtime и не выдавать внешний server/native/base/bootstrap gate за PASS.

## Контракт и запуск реализации

Оператор одобрил план v1.2 и поручил реализацию. Frozen plan692385d:
docs/plans/2026-10-10-ship-model-v0.1-update.md, весь SM-01–14. Affected PLAN_READY:
PR21comment6100571178,0B0A/noPRODUCTGAP, FP95d7430f13b91ba9650fbdf2a4ec016bb9b842031435eafd5b095f85c1a2b314.
Поздние U2 owners PR842/5140593 и PR848/db32125 supersede старый handoff:
Military hull+Combat/all temperature-sensitive active modules hot-only f_T=1 с wear;
mandatory own critical stop, обычная cold/Masking, hysteresis→durability/cooldown.

Рабочая ветка feat/ship-model-v0.1-runtime в этом isolated checkout; DraftPR22
base fix/lab-durability-adr0066. Один основной Developer /root/ship_model_developer,
GPT-6.1 Sol/xhigh. DEV_RELEASE D0/T1 после baseline5f209e7 fullguardPASS:
1075unit/117browser+1inheritedskip/26cloud/type/build/structure/bootstrap metadata.
Canonical work items ulab-9aa.10–.16 с последовательными dependencies; только
primary bd API writer, snapshot опубликован0ba144a. Текущий статус читать в Beads;
эта запись — recovery context. PM не реализует runtime. Далее T2→T3→T4→T5→T6,
independent QA + один scoped Code Review. Budget PRODUCT:1/5(existing PlanReview).
Evidence launch: docs/reviews/2026-10-11-ship-model-implementation-launch.md.

Новая версия u2-lab/4/model ship-fitting-ship-model-0.1/catalog0.3.0 explicit opt-in;
legacy /1|2|3, catalog0.2.x/history literal-compatible. Missing numeric TTX явно
experimental candidates, никогда canonical by green tests. Cold-H2 Masking позже.
Server runtime/U2 implementation OUT; actual SM14 parity, physical second LAN,
native activation/playtest/base/bootstrap acceptance/operator merge separate gates.
Существующие LAN4196/4189/Pages и архивы не менять в ходе разработки.

## Предыдущий checkpoint

# Operator result-dock fix, 2026-10-07

ulab-p2w, PR13/fix/catalog-dialog-focus от7eef0c0. Accepted WHAT0.7:
нижняя панель дублирует SCU/ч текущего опыта; paused/final/stale/import/reset
и active-owner понятны, старое число не выдаётся за новый run. WF03–06/12–14,
MC04; HOW0.1 прежний, no physics/runner/workspace/IO. Один existing Developer,
короткий actual Worker lifecycle и нормальный guard, затем experimental4196/Pages.
Семейства и menu-only уже LIVE7eef, сохраняются; старые архивы/4189 не трогать.
PM_ERR/DOC_PR аудит после трёх operator UI-итераций выполнен, counter0/3;
UI independent budget5/5/final+1 pending прежний, новых verifier нет.

# Operator sort-menu fix каталога, 2026-10-07

ulab-p2w/MC03, один прежний Developer, PR13/fix/catalog-dialog-focus от55279fd.
WHAT0.6: удалить весь ряд duplicate сортировочных кнопок; правое dropdown меню
и все его варианты/порядок/совместимые-first сохраняются. No physics/catalog/IO.
HOW0.1/PLAN_READY прежний. Source/tests/обычный guard → experimental4196/Pages;
старые архивы и hashed assets сохраняются. Бюджет independent5/5/final+1 pending
прежний; no new verifier. Счётчик самоаудита1/3→после этогоfix-turn2/3.
Текущая55279fd поставка доступна до нового проверенного build; history ниже.

# Operator family-filter fix каталога, 2026-10-07

ulab-p2w/MC03, один существующий Developer, PR13/fix/catalog-dialog-focus от2ede529.
WHAT0.5: семейства и All только category+families выбранного слота; search/size
не сужают список семейств, refusals внутри семейства остаются. Неполный fit
можно чинить, stale family→all; initial Close/intentional search сохраняются.
HOW0.1/PLAN_READY прежний; no physics/catalog/schema. Developer RED/GREEN+
normalguard → experimentalLAN4196/Pages с сохранением архивов/старого4189.
Независимый budget5/5/final+1 pending прежний; не запускать новых verifier.
Последний самоаудит выполнен, counter0/3; эта fix-итерация затем1/3.
Прежняя поставка2ede529 live до новой проверенной сборки; history ниже.

# Operator focus-fix каталога, 2026-10-07

ulab-p2w/MC03, existing Developer fix-turn; fix/catalog-dialog-focus от4339eca2.
WHAT v0.4: каталог открывается с фокусом Close, manual search/Tab/caret сохраняются.
ROOT reproducedLAN1024: nativeClose→explicitsearch, keyboard trigger confirmed.
Цель — genuine open/reopen без любого editablefocus; OSkeyboard физически NOT RUN.
Developer RED/GREEN и normalguard → experimentalLAN/Pages, no new physics/hour.
Independent UI budget5/5 прежний, final+1 ожидаетоператора, не брать cooling budget.
Самоаудит после QA4+Review5+operatorfix3/3, counter0/3; PR Draft/merge-ineligible.
Существующие публичная cooling версия и архивы/старый4189 сохраняются до нового build.

## Предыдущий checkpoint

# Автоматика охлаждения — поставлен, 2026-10-07

Beads ulab-6xr; PRODUCT5/5: QA4 PASS, Review5 APPROVED/0B0A, CR-CC-B1 CLOSED. Accepted WHAT:
H₂ Efficient Auto по потребности;≤300K own heat/aux/H₂0. Active закрывает
площадь/насос при Tenv≥Tship. Signed hull/Passive и TI сохраняются; generator
независим. U2 current INDEX→palette0.4/doctrine0.2.8, DraftPR843/18d2c82.
HOW/CC01–05: docs/plans/2026-10-07-cooling-control.md, весь контракт неизменен.

Runtime c9e09b2: исходная физика a3 + observer/test fix CR-CC-B1,2paths;
57other src exacta3. Guard520unit/54browser+1SKIP/26cloud/type/build PASS.
Plan1 READY; QA2 PASS; Review3 historical CHANGES_REQUESTED1B0A. QA4 PASS, Review5 APPROVED/0B0A, обе независимые проверки sealed. Selfaudit PM_ERR/DOC_PR выполнен3/3, counter2/3 после QA4+Review5.
Immutable release .overgate-runtime/cooling-control-interval-fix-release/.
LAN4196 c9e09b2/PID13066,17HTTPassets exact, Start1.5s/Pause/iClose/errors0.
http://192.168.68.65:4196/?v=cooling-c9e09b2
PUBLIC https://komleff.github.io/u2-lab/?v=cooling-c9e09b2
Pages c13791a built/error=null;41HTTPSfiles exact, actualStart1.5/Pause/iClose/errors0.
Archive thermal-v0.1/17 exact/Start1.8/Pause/errors0; legacy-v1/4+root3 unchanged.
Metadata-only normalguard commit и reviewed-content equivalence — финальный checkpoint PR12.

UI4.1 PR11 base a97262b: QA5 PASS/CR-MC-B1 closed по QA, numerical unchanged.
Его budget5/5 отдельный, +1 final closure ожидает оператора. Не объявлять UI
review APPROVED и не заимствовать budget thermal/cooling. PR12/PR843 Draft,
main/bootstrap/native/physicalXiaomi/operator merge отдельно OPEN.
Sole Beads writer rootprimary bd API; старый4189 и Legacy-v1 сохранить.

## История checkpoint ниже; ссылки/процессы могут быть прежними

# Исторический checkpoint: автоматика охлаждения, 2026-10-07

Beads ulab-6xr, PRODUCT5: PlanReview1 PLAN_READY0B0A. Exact HOW/CC01–05 —
docs/plans/2026-10-07-cooling-control.md, source authority через INDEX.
U2 DraftPR843/18d2c82: Efficient Auto demand + H₂<=300K OFF; Active закрывает
площадь/насос при Tenv>=Tship, hull/Passive signed law сохраняется.
Новая изолированная feat/cooling-control от UI721e815; protected numerical
owners baselineebd unchanged. Сейчас docs-only checkpoint: никакой новой
физики/DEV_RELEASE ещё нет. Реальный Draft PR предшествует implementation.
UI PR11: QA3 закрыла colon-ID, Review4 нашёл empty-invoker CR-MC-B1;
Developer721e815 исправил общую строку, guard489/52+SKIP/26 PASS, affectedQA5
в работе, finalscopedclosure потребует +1 operator call. Это отдельный budget.
Старые LAN4196/4189 и public thermal/legacy-v1 сохранены. PM sole Beads writer
rootprimary. Следующие coolingQA2 и scopedReview3 только CC01–05, no81/12h.

# Исторический checkpoint: чистка карточек модулей, 2026-10-07

Прямое поручение оператора: собственные профильные ТТХ, без неприменимых полей,
итогов всей сборки и неизвестного объёма; служебные данные под компактной i.
Beads ulab-p2w; PRODUCT default5, PlanReview1 PLAN_READY/0B0A, затем один Developer,
QA2 и scopedReview3. HOW/MC01-05: docs/plans/2026-10-07-module-card-cleanup.md.
Ветка feat/module-card-cleanup от ebd4814 в existing isolated thermal checkout;
product code до PLAN_READY и Draft PR не начинать. Никакой новой физики/TTX/IO.
Существующая acceptedthermalPages/LAN4196 и первая Lab остаются доступны.
Новый screenshot/layout QA только по module UI; не повторять thermal кампанию.
Review/QA+triage counter1/3; следующий аудит после QA2 и scopedReview3.

# Исторический checkpoint: температурная диагностика, 2026-10-07

Принято оператором: единая линейная hot/cold кривая с индивидуальными ТТХ,
износом вне рабочего диапазона и критической защитой. Канон — U2 Draft PR842,
775ea5630; Unity/server не менялись. Lab Draft PR10, feat/thermal-diagnostics,
runtime a6c7430; contracts/reports через docs/INDEX.md thermal checkout
/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics.

PUBLIC: https://komleff.github.io/u2-lab/?v=thermal-a6c7430
Pages gh-pages b2842bc built/error=null;17asset hashes exact, actual Start1.9s/
Pause/cold+hot bands/errors0 PASS. Первая Lab /legacy-v1/ сохранена:
4files exact443af7, actual Start1s/Pause/errors0 PASS.
LAN: http://192.168.68.65:4196/?v=thermal-a6c7430, ownedPID39692,
thermal .overgate-runtime/thermal-preview-server.json. Старый4189/station86 и
прочие версии не остановлены; не убивать чужие процессы или вкладки.

PlanReview READY; QA2/QA3 FAIL и Review5 CHANGES_REQUESTED остаются историей.
QA4 закрыла TD05 axis/glyph класс:18styled/2LANStarts; без нового повтора.
a6 исправила CR-TD-B1 — пропажу настоящих Legacy Active thermal stop/restart.
QA6 sealed PASS:5riskrows/26API+7native assertions,1LANtouch390 LegacyWorker.
ScopedReview7 sealed APPROVED/0BLOCKER/0ADVISORY, CR-TD-B1 CLOSED. Reports
qa-legacy-fix.md/code-review-legacy-fix.md в docs/reviews зарегистрированы INDEX.
Source17/wholeWHAT+HOW2/freshbuild17 byte-equivalent immutablea6; protected
numeric/TTX owners неизменны. Normalguard489unit/49browser+1SKIP/26cloud PASS;
последний metadata commit проходит обычный guard, его SHA/result фиксируется в PR.

Оператор дал +5 verifier calls; использовано7/10, reserve3. Аудит PM_ERR1.3/
DOC_PR сделан передQA6 и повторён при Review5+QA6+Review7=3/3; counter2/3 после QA4+Review5.
Не повторять всю кампанию по metadataHEAD; новый verifier только по namedFAIL.
Wear численно не рассчитывается; H₂ always-on governor отдельный knowndefect.
Физический планшет/native adapters/fullbootstrap/base/main/operator merge
отдельно OPEN; обеPR Draft. Public preview не означает merge.
Beads solecanonical tracker ulab-6ty; bd API/export только rootprimary writer.

# Предыдущий результат

Station86/порт4189: физические повторные рейсы,50SKU/M-модули/гибриды,
stationfuel+chargeON/OFF и обратная совместимость старого fuel-only snapshot.
QA/scopedReview локально закрыли missionB1/B2 и stationCR-ST-B1; PR9Draft
base feat/pony-signature-slot/PR8Draft. Полная прежняя evidence — docs/INDEX.md.
В rootprimary сохранены прежняя activeContext и записи owned/rollbackserver.
Старые результаты не переоснащать и не пересчитывать при открытии; H₂governor,
public/main/native acceptance и прежние open work items здесь не закрываются.
