# В работе: чистка карточек модулей, 2026-10-07

Прямое поручение оператора: собственные профильные ТТХ, без неприменимых полей,
итогов всей сборки и неизвестного объёма; служебные данные под компактной i.
Beads ulab-p2w; PRODUCT default5, PlanReview1 PLAN_READY/0B0A, затем один Developer,
QA2 и scopedReview3. HOW/MC01-05: docs/plans/2026-10-07-module-card-cleanup.md.
Ветка feat/module-card-cleanup от ebd4814 в existing isolated thermal checkout;
product code до PLAN_READY и Draft PR не начинать. Никакой новой физики/TTX/IO.
Существующая acceptedthermalPages/LAN4196 и первая Lab остаются доступны.
Новый screenshot/layout QA только по module UI; не повторять thermal кампанию.
Review/QA+triage counter1/3; следующий аудит после QA2 и scopedReview3.

# Текущий пакет: температурная диагностика, 2026-10-07

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
DOC_PR сделан передQA6 и повторён при Review5+QA6+Review7=3/3; counter0/3.
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
