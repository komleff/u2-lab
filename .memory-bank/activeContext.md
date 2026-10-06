# Текущий пакет: единая температурная кривая, 2026-10-07

Принято оператором: одно linear hot/cold правило с индивидуальными границами
ТТХ, повышенным износом вне рабочего диапазона и защитой на критических порогах.
U2 canon: Draft PR842, branch gd/thermal-derating-wear-20261007, HEAD775ea5630.
Лаба: Draft PR10, branch feat/thermal-diagnostics, runtimea6c7430; source/build
binding в .overgate-runtime/thermal-release-legacy-fix/binding.json linked checkout
/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics.
WHAT/HOW и неизменные отчёты — docs/INDEX.md linked thermal checkout,
раздел температурной диагностики; primaryroot ещё checkout предыдущей base.

Локально: http://192.168.68.65:4196/?v=thermal-a6c7430; ownedPID39692,
.overgate-runtime/thermal-preview-server.json в thermal checkout. HTTP17assets,
bootstrap/Start/advance/Pause PASS; обе температурные полосы отображаются.
Старая station86 остаётся на4189; предыдущие версии/Legacy сохранены.

PlanReview READY. QA2/QA3 FAIL на glyph overlap/empty-axis clip сохранены.
QA4 TD05-B1 CLOSED/PASS:18styled samples/2nativeLANStarts; остальные5TD
перенесены по неизменности кода. Developer finalnormalguard489unit/49browser+1SKIP/
26cloud PASS. CodeReview5 CHANGES_REQUESTED: CR-TD-B1 Legacy Active-load теряет native
thermal-stop/restart. Минимальный observer/test fix a6 детерминированно проверен и опубликован.
Whole contracts/30 численных owner blobs/renderer неизменны. PRODUCTbudget5/5
исчерпан. Повторная affected QA/scoped Review требует явного budget оператора.
PM запросил расширение на2адресованные проверки; ответа пока нет.
Численная эквивалентность:4physical oracles exact;81pre-change captures,
30protected owner blobs и исходные3goldens неизменны. Source freezea6; independent postfix closure PENDING.
Полное содержание контрактов неизменно; после PM metadata commit требуется
обычный текущий guard и content-equivalence, не новый LLM verifier.

Wear численно не рассчитывается; H₂ always-on governor/TTX/физика не менялись.
Повышенный износ отмечается в журнале явно как игровой канон, не измерение.
Unity/server/public/base/main/operator merge отдельно, обеPR остаютсяDraft.
Beads — solecanonical tracker; ulab-6ty, rootprimary единственный API writer.
Самоаудит PM_ERR/DOC_PR после3 QA/triage/fix циклов выполнен; counter0/3.
CodeReview5 завершён, counter1/3; новых verifier launches нет.

# Предыдущий результат

Station86/порт4189: физические повторные рейсы,50SKU/M-модули/гибриды,
stationfuel+chargeON/OFF и обратная совместимость старого fuel-only snapshot.
QA/scopedReview локально закрыли missionB1/B2 и stationCR-ST-B1; PR9Draft
base feat/pony-signature-slot/PR8Draft. Полная прежняя evidence — docs/INDEX.md.
В rootprimary сохранены прежняя activeContext и записи owned/rollbackserver.
Старые результаты не переоснащать и не пересчитывать при открытии; H₂governor,
public/main/native acceptance и прежние open work items здесь не закрываются.
