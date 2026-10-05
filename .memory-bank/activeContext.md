# Active Context

## Текущий этап Ship Fitting — 2026-10-05, Asia/Novosibirsk

Оператор поручил PM/GD исследовать U2 fitting/модули/UX, подготовить идеи/дизайн/план и
независимое адверсальное review дизайна + аудит плана. Runtime implementation сейчас
не выполняется. Ветка design/ship-fitting-v0.2 от refreshed feature6fb7166513627941e2ba2c4a9a01c79ae1667820,
а не прежнего c2ea755. Feature0.1.1 LAN HTTP fix уже affected QA PASS/scoped APPROVED.
Public Pages https://komleff.github.io/u2-lab/ пока0.1.0; design не деплоит новую сборку.

GD_ROLE отсутствует в lab managed6roles: применена роль/skill из frozen current U2
cdc490e3517c8455f662f82579c45813cdbb9a76, проверенного fetch. Источники выбирались INDEX,
ADR-INDEX/overview§16 и directlinks, без grep/keyword repo search/archive.41точный blob
в manifest; cargo primary1.7 supersedes старый CSV и anchors прежнего proposal211b432.
Документы в docs/INDEX.md: GDD, synthesis, VC SF01–20, planT1–T7. Пользователь принял
SCU/cycle,h,typedfuel/H₂/SCU,downtime,recovery; ROI later. K_use role-specific и first
measured limiter добавлены как проверяемые детали. Шесть профилей/40items — curated
candidate; неизвестные ТТХ честно experimental, не U2 production proof.

Beads ulab-73w in_progress; source researchers2, не verifier sessions. Independent
PRODUCT reviewer launch1/5: r1 CHANGES_REQUIRED, two BLOCKER. B1 selected-group
numerator/membership и B2 unbounded metric histories исправлены targeted в GDD/VC/плане;
affected closure pending той же session. Immutable report в docs/reviews, advisory не
расширяет обязательный fix. One Reviewer для двух scope частей. Новые
WHAT details требуют PO принятия, review не заменяет его. Нет code/QA/merge claim.

Локальный checkout — sole Beads writer, не hosted Work. Node24.21.0/bd1.0.2 через
source .overgate-runtime/env.sh. First import/export/отдельныйrestore-reexport уже
выполнены в ops/local-development; не повторять bootstrap/import. Проверенные локальные
metadata/evidence остаются в ops commits, не включены в этот scoped design diff.
Native Codex guard smoke прошёл ранее; full native/Claude/Windows/bootstrap finalize/
affected independent acceptance и операторский merge остаются открытыми.

Ниже история cloud и прежнего runtime, не текущая инструкция заново импортировать Beads.

2026-10-05, Asia/Krasnoyarsk. Оператор утвердил концепцию и поручил:
создать u2-lab → установить OverGate v4 с Memory Bank/Beads/.agents → прочитать PM_ROLE →
закоммитить план → независимое review по pipeline → после согласования выполнять как PM.

PM_ROLE v3.0 прочитан в frozen OverGate Git checkout. PM управляет работой, Developer кодит.
Созданы public komleff/u2-lab, ветка bootstrap/overgate-v4 и реальный Draft PR #1.
План/VC/product review опубликованы без изменения reviewed blobs. Exact inventory
2502f1f7158c217e0fdc645b86565433e5c44ac70833441ffeb8a360b02791bf
получил независимый install PLAN_READY; origin/binding проверен PM, отчёт опубликован
в том же PR (issuecomment-5983829289), затем trusted installer apply выполнен.
67 managed operations, zero conflicts; installed structural checker PASS. Шесть delivery
ролей и пять core skills доступны; исходный project authority/Memory Bank/Beads сохранены.

Current U2 main: cdc490e3517c8455f662f82579c45813cdbb9a76. Тематические owner blobs
соответствуют изученным в брейнсторме версиям; route зафиксирован в source-authority.
Независимый PLAN_REVIEW launch1 вернул CHANGES_REQUIRED: shared H₂ stocks, within-step
Background limits, long-run retention/backpressure и numerical input guards. План/VC
уточнены; тот же Reviewer закрыл B1–B4 и дополнительную ACK protocol несовместимость,
affected verdict PLAN_READY. Evidence находится в docs/reviews
и затем публикуется в фактическом Draft PR. Это не install inventory approval.

Оператор поручил продолжать автономно и как минимум завершить план/адверсальное review.
Оператор подтвердил GitHub Mobile login; create repo выполнен. GitHub connector публикует
ветку/PR и evidence; Git CLI fetch работает, authenticated push/gh отсутствуют.
Исторический runtime gate уточнён cloud amendment ниже; B0 acceptance остаётся открыт.
Frozen source unchanged. Исходный mawk panic воспроизведён и устранён на совместимом
официальном GNU awk5.2.1 из пакета Ubuntu без изменения source. Общий driver ограничен180s
и завершился TIMEOUT124 после14 PASS groups; оставшиеся14 groups, включая finalizer55,
выполнены отдельно и PASS. Installer26/bd-sync23 ранее PASS на тех же frozen bytes.
Все30 fixture groups имеют PASS evidence; single-driver completion не заявляется.
Native Claude/Codex hooks NOT RUN: hosted runtime не загружает project CLI hooks.
Beads sync export через официальный helper FAIL из-за Git CLI auth; не считать PASS.
Developer завершил project-owned verification (bootstrap step6), без product runtime;
real checks/negative fixtures PASS. Independent QA: available checks PASS, full acceptance
FAIL на B6 actual export/auth. Scoped Code Review: code quality/spec PASS, CHANGES_REQUESTED,
один acceptance blocker B6; native/restore/finalize NOT RUN. Reports — через docs/INDEX.md.
При продолжении НЕ повторять planning/install/полный audit: уже выполнены и опубликованы.
Следующий адрес работы — authenticated CLI Beads export, restore/re-export в отдельном primary
clone, actual native-hook smoke по INSTALL; затем affected QA/Code Review и trusted finalize.
До этих обязательных gates не закрывать B0/не объявлять готовность; merge оператором.
Canonical T1–T6 dependencies от B0 сохраняются; reversible preparation регулирует amendment ниже. Unique verifier sessions: CRITICAL2/6 (Reviewer reused
для plan/code phases + separate QA); PRODUCT1/5. Metadata landing не меняет runtime/WHAT.
Product acceptance fingerprint:6d1d4bc86e8f465e58d6412010d5226e26b44fbfc6f771f66cefd0b4dfbeb673.
Scoped6 paths в round2 report; это не install approval/QA/full-PR readiness.


Cloud amendment: `docs/plans/2026-10-05-cloud-execution.md`, independent PLAN_READY в
`docs/reviews/2026-10-05-cloud-plan-review.md`. Это утверждённая HOW-поправка порядка
обратимой подготовки: после deterministic cloud checks разрешена stacked T1–T6 work
на базе bootstrap candidate; product PR merge-ineligible до acceptance base. P1–P14,
B0/B6/B8, независимые product QA/review и operator finalize/merge неизменны.
Cloud теперь read-snapshot/write-intents, больше не writer: не запускать bd/Dolt,
wrapper/apply/export или push beads-backup из hosted Work. Исходный checkpoint сохраняет
exact nine generated IDs и bytes; bootstrap queue — unapplied PENDING notes. Only writer —
primary checkout оператора. First empty-remote import/export по
`docs/guides/operator-bootstrap.md` через verified external frozen OverGate helper;
новый project applier использовать только после review/merge trusted main. Current Task1
implementation evidence — `.superpowers/sdd/2026-10-05-cloud-execution/task-1-report.md`;
независимые cloud QA/code review ещё не выполнены этой Developer session.

## Runtime preparation — history before LAN HTTP patch

Power & Heat v0.1 подготовлен для локальных экспериментов в Draft PR2, base bootstrap PR1.
Product и cloud планы получили independent PLAN_READY; cloud C1–C6 QA PASS/scoped APPROVED.
Исходные7 QA failures, соседняя tank-gate schema validation,3 blockers Code Review и
новый QB1/P13 (within-base-dt peak metric) исправлены. Все исходные FAIL/CHANGES_REQUESTED
и предыдущие scoped closures сохранены как immutable history.
Current affected QA PASS: `docs/reviews/2026-10-05-product-peak-qa-affected.md`, SHA256 `1b460d5b141d76986f8ef2d10f4de4054993eedd478497db9bd889cf4025f136`;
current scoped Review APPROVED/0 blockers/0 advisories: `docs/reviews/2026-10-05-product-peak-code-review.md`, SHA256 `5fe484abeef401f3a3bbfdedde998fe24052839cfa0bc4213ebee362219ded08`.
Exact tested source d469d5d8adcda69f1aefe958628d81c43a347ca7, review candidate f4e7e8e0.
Direct8 paths+entire VC: d0b46f628590c49393e39ecead3818aef09faafde6f29919036330f139441fa3;
review5 paths+entire VC: f105ca38817e9fab939597b063b562264e64ba871aa845248fb02af8f1fe1a72. Metadata landing не меняет эти code/test blobs.
Independent current QA:3dt peak500K,40 targeted tests/type/build,13 selected numeric/replay
и6 prior device probes PASS. Current Developer/actual source CI:56unit,5browser PASS,
1 screenshot-only SKIP. Fresh Developer physical12h132.595s,4,320,033ticks/43,200buckets/
42channels; residual−0.072141J/64.1072GJ. Prior own QA a45012h134.916s — inherited physical
evidence, не новый current own run. No source/resource/integration/channel evolution change.

PM exact packed-and-extracted ZIP smoke PASS: S/M14s,A/B,390px,independent local contexts,
same-origin4requests/no page exceptions. Archive SHA256a3b64a96fac04534b44fc01837088ca6ce91a359b89c41028ad141009ca9d479,
6 files/39,859B,CRC/dist digest PASS. Physical second LAN device NOT RUN.
Source CI37253950268/37253946567 SUCCESS on exactd469; later report/docs-only CI separate.

S/M/palette origins remain canonical/derived/experimental; fitting/material/Cp/throughput gaps
явно экспериментальные. Detection отложен до согласования энергии/тепла/параметров модулей.
Exact U2/current WHAT/P1–P14/67-operation install inventory unchanged.
Hosted Beads — read-snapshot/write-intents ONLY: no livebd/Dolt/applier wrapper/export/push.
Original recovery checkpoint9IDs/bytes unchanged; queues append-only PENDING NOTE intents,
no canonical status/dependency/close. B0/B6/B8/operator export/restore/native hooks/finalize/
merge remain open. Next operator procedure: docs/guides/operator-bootstrap.md.
PRODUCT verifier sessions3/5: same Plan/QA/RV; affected turns are not new launches.
This is reversible preparation; full bootstrap/readiness/merge acceptance не заявляется.

## LAN HTTP patch0.1.1 — current state

Operator Xiaomi/Chrome page opened at http://192.168.68.65:4173 but simulation did not start.
Baseline non-local HTTP QA FAIL is preserved: reset() called secure-context-only randomUUID;
actual secure=false browser threw TypeError before Worker. The former two localhost contexts
did not cover this boundary. Developer replaced only opaque runId generation with16CSPRNG
bytes via getRandomValues; new durable browser regression RED→GREEN, footer/package0.1.1.
Model/catalog/schema/protocol/physical source blobs and accepted WHAT/P1–P14 unchanged.
Fix source fead162208d1e7d1918f36d8f51089110e924c51; affected QA candidate c2ea755cc47ca9f8f3ac62dc0da8fc45e1abfa2d.
Current affected QA PASS: docs/reviews/2026-10-05-lan-http-qa-affected.md,
SHA256 c21055922e1e73d4039a83027b0719f90c82fdbe7b0034e05c68ba3f3827dc12.
Current scoped Review APPROVED: docs/reviews/2026-10-05-lan-http-code-review.md,
SHA256 1d04eb5b65303860cbe56a8ad9e56b25dd539cdcbcce69d588bcdbdda7a5bab9.
Exact4changedpaths+entireVC fingerprint ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8.
Developer56unit/6browser PASS+1screenshotSKIP,type/build/26bootstrap PASS. Source CI
37272666370/37272662118 SUCCESS; actual extracted ZIP0.1.1 localhost/non-local HTTP PASS,
SHA2562738ebf9b24a2f4694c9705e72afc228db5391962622f5457c3b9a02fea72c1c,40075B/6files.
Real Xiaomi/second physical LAN NOTRUN; browser origin emulation is not physical acceptance.
No new local12h replay for UI-only delta; previous physical evidence retained honestly.
Detailed current transfer: docs/handoffs/2026-10-05-mac-lan-http.md; launch/checkfooter/tablet
commands: docs/user/local-network.md. Same QA/Reviewer affected sessions reused; no new swarm.
No queue/livebd/Dolt/export/task status or dependency mutations in this fix. Original9ID
checkpoint/managed install bytes unchanged. B0/B6/B8/native/operator export+restore/finalize/
operator merge OPEN; PR2 remains stacked/draft. Detection remains out of scope.
