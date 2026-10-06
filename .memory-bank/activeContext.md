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
