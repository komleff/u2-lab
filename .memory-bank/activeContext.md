# Текущий результат: v2.2, рейсы/M/HY и станционное обслуживание

Рабочий стенд: http://192.168.68.65:4189/?v=station-86dee5d
localhost4189; owned PID93528, .overgate-runtime/mission-medium-preview-server.json.
Immutable source86dee5da9e8a9c45723b7e9a476b8b16bfb98f2b;
source3FP76bfc9aa33ca24f79697b50a368822f7f731b419752963c2cd80fe0a0112b8eb;
build17FPcd7c227ad4150f707b6b1d2e79d71e9bc54dd3db1f33db33c3d5b5b2798a9ba4.
Exact station-service-v2.2-candidate-fix-r1/extracted/dist на linkedcheckout.
Прежние4183/4186+Legacy/4188 и d57 QA4193 сохранены; rollbackrecord
.overgate-runtime/mission-medium-preview-server-d57-before-station.json.

PR9 https://github.com/komleff/u2-lab/pull/9 Draft: feat/ship-fitting-mission-medium
base feat/pony-signature-slot/PR8Draft. Runtime/test root byte-equivalent86;
finalrootSHA и свежий normalguard — в FINAL ACCEPTANCE PR9 и
.overgate-runtime/station-service-root-commit-guard-final.txt. Guard выполняется
перед finalcommit; нельзя подменять его Developer evidence. Main/base/bootstrap/
native/physical/public/operator merge остаются отдельными OPEN.

WHAT: missionbriefv0.3 + mediumcontract; HOWv1.2 M01–09/MF01–04/HY01–02;
все whole contracts через docs/INDEX.md.50SKU/пять M, однородный propulsion,
разрешённые auxiliaryPower hybrids. DefaultsH3600/bg100/rho1500/return.35/
target10000SCU/distance100km/Max/fullhold/repeat. Событийная добыча, физические
порожний/загруженный перелёты, разгрузка после actual stationarrival.

MissionB1/B2 CLOSED: d57 affectedQA5PASS/scopedReview2APPROVED, root447unit/
46browser+1SKIP PASS, root3ced pushed. OldSputnikH3600:3services/90сдано/30наборту
на legacyfuel-only; эти числа НЕ свежий опыт с новой зарядкой. CivilianM безgen
тогда разряжался; сH₂gen работал час при power bottleneck. Operatorfits, где Power
не указан, assumed. Старые reports/FAIL сохраняются immutable вINDEX.

ulab-558 — прямое поручение «Заправлять и заряжать», принято отдельно.
Wholeplan docs/plans/2026-10-06-station-service.md7955/05f63be7 frozen.
FreshON: actual completedservice пополняет каждый установленный fuelконтур и
суммарную battery доcapacity; OFF только разгрузка. Температура/buffer/consumption
не сбрасываются; stationenergyJ/GJ явная. Это endpoint abstraction внутри заданной
servicephase, не новая shorepower/chargeheat/price model. Отсутствие flag в старых
mission1/.3 означает fuel-only/noCharge; редактируемые условия задают явныйboolean.

PlanReview1 PLAN_READY0B/1A; noBatteryadvisory rejectedwithrationale, validfit
batteryrequired unchanged. Dev a625455unit/47browser+SKIP, initialQA2ST01–06
PASS59API/16nativeactualLANtouch390. Review3 CR-ST-B1: explicitOFF принимал
positivefuel import. Fix86: одна IO line +два durable isolatedD/H₂ cases;457unit/
47browser+1SKIP Developer normalguardPASS. AffectedQA4B1-01–04PASS13API/7native
import-only; scopedReview5APPROVED0B0A/B1CLOSED; exactreports опубликованы PR9
6017499964/6017529185. Sourcefreeze RELEASED. Budget5/5; новыхlaunches нет.
Current root source/wholeplan fingerprints независимо сверены; numericalbody
step.ts отinitialStateV2 SHA d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08
unchanged baseline3ced. Не повторять QA6ST/QA15/52review/ZIP/H3600/full155proof.

Beads solecanonicaltracker/rootAPIwriter. ulab-w6w/ulab-dwi.1/.2 CLOSEDlocal;
ulab-dwi ordinaryclose blocked openulab-zk2, noforce. ulab-558 localQA/reviewaccepted;
канонический текущий статус черезbdshow, финальный trustedexport после milestone.
ulab-w7j oldreplay-durationblur OUT/unfixed. Исходные9IDs сохраняются; user
docs/.DS_Store НЕstage. U2currentowner0fe06927 дляreferencePM_ERR1.2/DOC_PR.

По срочному поручению самоаудит выполнен; признана задержка доставки из-за proof
bookkeeping. Каждые3 завершённые review/QA+триаж/фикс итерации обязателен аудит.
IO fix +affectedQA4 +scopedReview5 =3/3 → selfaudit done/reset0/3 доfinalrootguard.
Следующая такая итерация станет1/3. Ручной аудит не новыйverifier или новыйgate.
