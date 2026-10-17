---
title: "ГД v4 + каталог 0.2.1 — scoped Code Review r2, closure CR-V4-B1"
status: sealed / APPROVED
version: "2.0"
date: 2026-10-06
related:
  - .agents/RV_ROLE.md
  - docs/reviews/2026-10-06-gd-v4-catalog-code-review-r1.md
  - docs/reviews/2026-10-06-fitting-catalog-0.2.1-qa-affected-r1.md
  - docs/verification/gd-workspace-v4-contract.md
---

**Verdict: APPROVED. BLOCKER: 0. ADVISORY: 0. CR-V4-B1: CLOSED.**

**Mode:** CODE_REVIEW. **Role:** независимый Reviewer / Codex, существующая
verifier session. **Model:** Codex; точный provider/model/deployment ID средой
не сообщается. **Commit:** `15f5d90e97b696b8738a204953af852942bec704`.
**Affected baseline:** `131570d8f018d3617067bb558099f68aff7c9a53`.

Scoped Contract `.overgate-runtime/gd-v4-catalog-scoped-review-contract-r2.md`
прочитан полностью: 3797 B, SHA256
`80c1d7dfdc636f2943af98d25ed4a63f44fde8fee5d77450f72f6b378565f20c`.
Original combined Contract и signed review r1 сохраняют authority остальных
WF01–15/C01–08. Это affected closure одного blocker, не новый полный review.

# Решение по CR-V4-B1

У разрешённой неполной сборки больше нет недопустимого fallback `hull:3`.
`setConditions()` сначала проверяет реальный монтаж и declared edition, а затем
строит временную законную опору `hull:1` **той же версии** только для проверки
условий. Опора не применяется к пользовательскому монтажу и не делает Start
доступным. Полная сборка по-прежнему проверяет условия на своём actual fit.

Payload ID, фактические изделия/local variants, enabled flags и builtin modes
перенесены в временную проверку без подмены selectedWorkGroup. Служебные instance
IDs выбираются с учётом всех actual instance/builtin IDs; конфликт с импортированным
`fit:march` или `conditions:march` не превращает лазер в служебный engine.
Применение conditions происходит только после успешного существующего validator.
Invalid input и неизвестный mining ID дают false без изменения workspace.

**Own proof, Node 24.21.0:** повторён исходный Sputnik counterexample — удалён
`power-1`, приняты T310/repeat=false/dt.005; fit сохранён, Start blocked, dt0
отклонён атомарно. Второй короткий proof открыл old-edition Industrial S run с
локальным лазером и payload IDs `fit:march`/`conditions:march`; после удаления
обязательного power, edits и ремонта оба ID и edition0.2.0 сохранены, prepared
run имеет T315/repeat=false. Non-installed group ID отклонён атомарно.
Оба proofs PASS; browser или numerical trajectory Reviewer заново не запускал.

Прочитаны новые durable tests: 39 unit cases по incomplete fit, custom IDs/группам
и active/reference boundaries; четыре native browser cases по small hull/edition.
Это review assertions, а не заявление собственного запуска всего test suite.
Существующая active state не мутируется validation reference; independent QA
подтвердила genuine advancing A → foreign incomplete B → Pause/Freeze/Cancel
→ repair B и сохранность active exports/reference.

Новых подтверждённых blockers или advisory в этой delta не найдено. Требование
r1 выполнено без расширения slot capacity, numerical/catalog/schema/Worker scope.

# Reviewed-Paths и fingerprint

| Reviewed path | Exact HEAD Git blob |
|---|---|
| src/app/fitting-workspace.ts | 9eeb774ab637b0545f339005c0df6aa73ad45696 |
| tests/ui/gd-workspace-v4.test.ts | c8263bc5ae5c5b9239163cb2370f77878a6d2b3f |
| tests/browser/gd-workspace-v4.spec.ts | c526f2385d915c3bf52e3e611c14e15e977c4736 |

Необходимый неизменный owner context: `scenarios/fitting.ts`,
`fitting/catalog.ts`, `fitting/editions.ts`, `fitting/validate.ts`,
`fitting/compile.ts`, `app/fitting.ts`, `app/fitting-ui/conditions.ts`
и `app/fitting-ui/lab-view.ts` под `src/`. Прежнее чтение этих boundaries
наследовано при фактическом совпадении bytes; широкой проверки ядра не выполнялось.

**Content-Fingerprint:**
`9458f05433fb89123d514d00aadb82a46daf48d3528dde054ca5c22e3f1d5988`.

Независимо сверены все 137 relevant rows с actual working bytes и exact HEAD
Git blobs; расхождений 0. Пересчитан SHA256 от sorted UTF-8
`path NUL gitBlob LF` + literal bytes **семи полных** contracts sorted by path
+ layout note + defects note, без разделителей между appended literal files.
Полные owners/contracts и оба notes не менялись; изменились только три rows.
Raw binding `.overgate-runtime/fitting-catalog-0.2.1-fix-runtime-binding.json`,
42775 B / SHA256 `6dac0b7f08e93c163bded9875440d001a8f6a37803e10cd1ac995bcf7b25dbbc`.

Все остальные **36** cumulative reviewed paths независимо сопоставлены с r1:
HEAD blobs равны 131570d8. Их substantive review наследован; нового semantic
review всех 39 файлов не заявляется. Signed r1 17308 B / SHA256
`430ae60211cad25f2ff5f70022e42df92226db6be527e9768464a1001d854953`
и его path sidecar сохранены byte-identical.

Own evidence sidecar `.overgate-runtime/2026-10-06-gd-v4-catalog-code-review-r2-evidence.json`,
7609 B / SHA256 `9bd5d761edfbf39a688eb4bc09318064da8a373f7ba0bfa7ddf445db42966764`:
три exact path/blob/working hashes, список 36 carryover paths, whole contracts,
notes, binding verification и два фактических proof outputs.

# Evidence и ограничения

Independent affected QA report прочитан полностью и hash сверён:
`docs/reviews/2026-10-06-fitting-catalog-0.2.1-qa-affected-r1.md`, 9281 B /
`4c2f822f9be19e2859a738b08651ff98bb2d3edcfddd18a14de8e4f4ac7ab750`.
Его sidecar 19789 B /
`f08c0eb5386c4ebb3deb6a67301efca4050f580e7e5af10c1970f1853ae32679`.
QA: четыре affected risk rows PASS, API small-hull/edition representatives,
custom/empty group, native LAN1440 и touch390 chains, active-next ownership.
49 raw seals и 191 historical seals проверены PM; Reviewer их заново не исполнял.

Artifact identity из PM/QA, не own сетевой sweep: linked
`.overgate-runtime/fitting-catalog-0.2.1-candidate-fix-r1`, ZIP525792 B /
`0c2e16b9f593adbd21273c1727deafffc1b4b41428004f8a42c8a0c3c184bf82`;
dist18files digest
`702bf1bf914892e37a5ddc3e0b81d4907dde5948a0783e2d55a3d3e866229f3d`.
Normal guard313unit/41browser PASS +1 inherited SKIP — Developer evidence,
не собственный повтор Reviewer. Предыдущие catalog/v4 QA сохраняются историческими.

**NOT REVIEWED / NOT TESTED заново:** полный39/WF/C sweep, broad34/24edge suites,
matrix/H3600/12h, unchanged numerical/Worker/Legacy algorithms, все local hypotheses,
physical/native/public/bootstrap/base/main/merge. Новый mining/flight/refuel,
protocol/history/persistence вне contract. Не изменены product/runtime/tests,
Git/PR/Beads/servers или пользовательские tabs. Первое чтение metadata использовало
r1 field names; ошибка reader исправлена до независимого расчёта binding и не была
product FAIL. Итоговый HEAD15f5 и tracked clean подтверждены.

Подпись: Independent Reviewer / Codex, 2026-10-06.
**Source freeze release:** scoped closure завершена, Reviewer больше не удерживает
freeze. Combined review с immutable r1 carryover — APPROVED на этом source;
PM единственный publisher. Полная product/main/base/physical приёмка и merge
этим вердиктом не объявляются. После передачи — IDLE.
