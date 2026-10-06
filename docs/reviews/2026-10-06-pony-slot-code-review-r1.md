---
title: "Pony0.2.2 — независимый scoped Code Review"
status: CHANGES_REQUESTED
version: "1.0"
date: 2026-10-06
role: Independent Reviewer
model: "Codex; exact provider/model ID unavailable"
related:
  - docs/plans/2026-10-06-pony-signature-slot.md
  - docs/product/ship-fitting-catalog-0.2.1.md
---

# Вердикт

**CHANGES_REQUESTED: BLOCKER=1, ADVISORY=1 (ранее известный baseline concern).**
Новые presets и resolver сохраняют различие one-slot0.2.2 / two-slot0.2.0–0.2.1.
Однако known0.2.2 импорт допускает численный второй signature module, если удалить его
только из вложенного fit. Это нарушает цель ограничения и атомарного отказа P04.

Mode: **CODE_REVIEW**, один independent Reviewer, существующая session.
Model: Codex; точный provider/model/deployment ID средой не сообщается.
Commit: `0de894d67085dabe641488fd2a69ed964d8ccd9e`.
Developer source: `3265a6870578d409586b416eb0adfabff3b9a574`;
baseline diff: `03826203eb5cef1d0102f71a98b07ec469fab1cb`.
Роли: RV_ROLE2.1 / PM_ROLE3.0; WHAT — явное принятое ограничение оператора и whole P01–P05,
совместимость — whole C04/C05. Номер миссииv2.2 не меняет этот scope.

# Привязка и Reviewed-Paths

Explicit Review Contract: `.overgate-runtime/pony-slot-code-review-binding.json`,
21021B / SHA256 `158505de6b41431e2fc8646a8072415cac70af7c3dea5504f287e6a702250777`.
**Content-Fingerprint:** `e21ee3b95fe57b0c22721598bb87da95cd498089bf0858fcbcc592e89de5f698`.
Независимый расчёт: SHA256 UTF8 canonical JSON объекта `contract`; recursive sorted keys,
compact separators, Unicode unescaped, без final LF. Canonical payload19358B содержит
17 source rows и literal bytes **обоих целых** contracts; computed=declared.
Working bytes всех17 путей = HEAD = Developer SHA; actual src/tests diff имеет ровно эти17.
Metadata/self-audit и untracked M document не входят в проверку или freeze release.

| Reviewed-Paths | Git blob на Commit |
|---|---|
| src/app/fitting-ui/presentation.ts | 0eb0452ce8e5582102113555e85acfaf2d4e8323 |
| src/app/fitting-ui/ship-view.ts | e56fd5c0df80ab29f11175fd90b98b17a025f21e |
| src/app/fitting-ui/swap-dialog.ts | 007d2c3459fb6d3265ee344946f6d002e51c22bd |
| src/app/fitting-workspace.ts | ce856fbd54b73a0b01504b8d68f893ca774ec132 |
| src/app/fitting.ts | 8162393a1ec9555523b0e27f4cec2ced65d3762d |
| src/fitting/catalog.ts | dd42b8ef2d2b5a6d9511437e503ca178dedc3ad8 |
| src/fitting/compile.ts | 04775389b8d37311eac2c4aec03202de1aa554cf |
| src/fitting/editions.ts | 963b895e4af3bbd7bff7ee2bbf917d6684db0dcc |
| src/fitting/types.ts | 52e087931186fd5911317459ace3ef62e0cc140d |
| src/fitting/validate.ts | 99945b6f72f97159af150f57a29d782f2d3a5240 |
| src/io/fitting-json.ts | e094b6aedfe70a86000129ad25a002f4bb46959b |
| tests/browser/catalog-0.2.1.spec.ts | dcd004617ef2e8bf60dd0f315b017e5ca01c4a55 |
| tests/browser/pony-signature-slot.spec.ts | 61a500fa6ccf2ecff11fb8ef70760b3963ab3973 |
| tests/fitting/catalog-0.2.1.test.ts | 465c776b3d214ef7e18efcebe53483c3ae35b9e8 |
| tests/fitting/catalog-editions.test.ts | 0a6ce7b1518930c52a35a43ecc87aadb5664b3f3 |
| tests/fitting/fixtures/catalog-0.2.1-pony-digests.json | 730f0cec1f612df2eb37be097e0658fad578eeb0 |
| tests/fitting/pony-signature-slot.test.ts | b11bface0ed7c323b4f50c497f332f193fd67b30 |

Whole contracts, прочитаны полностью и bytes равны binding:
`docs/plans/2026-10-06-pony-signature-slot.md`7821B / blob
`47e8249b91cb82b09d3388495d29da4839e0b970`;
`docs/product/ship-fitting-catalog-0.2.1.md`7363B. Их SHA256 и blob, все17 bytes/SHA256,
direct context blobs, exact command и output — в sidecar
`2026-10-06-pony-slot-code-review-r1-evidence.json`18242B / SHA256
`57f4fc51f4c443271b20bb51790dfd842a4e0bdfde01bbd5860b6c92ec9e25e0`.
Context прочитан только для named import/ownership риска:
`src/model/v2/step.ts` validation, `src/io/fitting-result.ts` parser,
`src/scenarios/fitting.ts`, `src/runner/run.ts` dispatch; это не полный kernel/runner review.

# Findings

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| CR-PONY-B1 | IMPORTANT | [BLOCKER] Legal nested fit маскирует второй работающий signature module в known0.2.2 snapshot | src/io/fitting-json.ts:50 | fix now | P01 / HOW3 / P04; подтверждённый import и расчёт |
| CR-PONY-A1 | MINOR | [ADVISORY] Первый Start после duration blur импортированного result теряется | src/app/fitting.ts:303 | defer to Beads | ulab-w7j; unchanged baseline, inherited evidence |

**CR-PONY-B1.** `validateFit` проверяет nested `resolvedShip.fit`, inventory branch
проверяет только принадлежность SKU/stamp. Ни эта branch, ни existing numerical
validator не связывают fit assignment/instances с `resolvedShip.instances` и hull mount.
Ресурсный/material ledger проверяется относительно resolved roster, поэтому внутренне
согласованный старый roster остаётся допустимым. Result parser делегирует этому же
experiment parser (`src/io/fitting-result.ts:18`).

Минимальный own repro на exact HEAD, Node24.21.0:

1. Создать обычный `makeMiningRun(getPresetFit("pony:2", ".1"), loadCandidateCatalog(".1"))`
   с полными version strings, horizon1s.
2. Поставить `spec.catalogVersion` и `spec.resolvedShip.fit.catalogVersion` в0.2.2.
3. Удалить только `fit.assignments["signature-2"]` и соответствующий
   `fit.instances["fit:signature-2"]`. Hull, resolved roster/materials/resources не менять.
4. Импортировать experiment либо полученный настоящий1s result.

Actual: nested fit valid; old legal control accepted; forged experiment=true,
forged result=true, `FittingWorkspace.importDocument(result)`=true и workspace изменён.
В accepted snapshot hull содержит signature-1/2, resolved roster сохраняет
non-builtin `buffer-S` в signature-2, capacity2e9J; actual1s complete run накопил
`19999999.999999985J` в этом буфере. В fit instance уже отсутствует.
Это действующий второй module, а не декоративное поле старого снимка.

Literal адрес: P01 «Нельзя установить два signature modules»; HOW3 «переименование stamp
не позволяет выдать старый двухслотовый Pony за новый»; P04 требует отказа false0.2.2
run/result. Обычный restamp без шага3 тестируется и отклоняется, но он не покрывает
две расходящиеся representations. Historical QA PASS сохраняется для выполненных cases.

Минимальный fix: в known-edition import проверить структурную согласованность declared
hull/fit и resolved mount roster — IDs, slot/item binding, enabled/builtin ownership,
отсутствие extra/missing mounted instances и законность mount для declared edition.
При несогласованности вернуть ошибку до изменения workspace. Сохранить numerical
snapshot и допустимые local authored numerics; silent recompile или сравнение всех ТТХ
с текущим каталогом не требуется. Regression addresses: этот experiment/result,
refusal с explicit replay opt-in и сохранение workspace; legal старые двухслотовые
.0/.1 и matching-edition overrides должны остаться допустимыми. Полная новая QA кампания
не нужна.

**CR-PONY-A1.** QA report:107 честно описывает PM/Developer baseline reproduction
на15f5 и candidate: duration onchange заменяет кнопку между pointerdown/up.
P05 QA использует native fill+Tab; этот workaround не означает исправление UX.
Я не повторял browser repro. Handler не изменён данным Pony diff. Это отдельный
tracked concern, не новый blocker nerf и не основание автоматической UX правки здесь.

# Собственная и унаследованная проверка

Own: static diff/context всех17 changed paths, whole contracts, edition resolver callers
(validation/compile/passport/nominals/replacement/dialog/F3/incomplete conditions);
независимая byte/fingerprint сверка; один named P04 counterexample с legal old control,
parser/result/workspace admission и actual1s kernel run. Финальный proof exit0.
Две подготовительные invocation ошибки были моими: неправильные positional arguments
`getPresetFit` и `createRun`; исправлены по owner signatures, сохранены в tool history/
sidecar как harness faults. Experimental Transform Types warning не продуктовый FAIL.

Inherited: whole signed QA P01–P05 report14089B
`c0ed14deaeb2c09d17c4c9f3cb51c6c81e4cd6fc308d87c13cb0899c89498e29`,
manifest50743B `ba5985660f8d93041176791cb51cedec145b83faa837ae7ee203c31c71b82c22`;
оба hashes независимо сверены. Две genuine LAN chains1440/390, historical digests,
12 fresh opens — QA evidence, не мои свежие browser/tests. Root guard328unit /
43browser+1inheritedSKIP, type/build/reference/bootstrap/cloud PASS — handoff evidence,
не повторный Reviewer guard.

Build identity унаследована из QA/PM: Developer3265 source, ZIP
`1d17422c6c68e6e9404bebd15c7b0bb2c37701c70d2b4d1015766a785aa94b7b`,
dist `b5f8f267f27917c8fd44c91a744af5808fbcfdbc896a01bd6e22cbbc8f5d0128`.
137-source/tar/ZIP/served HTTP proofs не повторялись. P02/defaults/old editing и
active-next пути не дали иных подтверждённых blockers в reviewed delta.

# Отложенные и непроверенные поверхности

Не проверялись заново полнаяv4 UX/72/WF/C матрица,12h/H3600, все численные algorithms,
M/hybrid/миссия/refuel/detection/баланс Pony, physical device/native OS/public deployment,
bootstrap/base/main merge. Unknown explicit numerical replay сохраняет отдельную
семантику; blocker относится к known0.2.2 false mount claim, не отменяет этот режим.
Никакого требования нового schema/catalog archive или обновления old oracles нет.

Source freeze для scoped review **RELEASED** после seal; это разрешение PM организовать
один blocker fix и affected QA/re-review, не APPROVED и не разрешение merge.
Source/product/tests/Git/Beads/server/user tabs не изменялись. Предыдущие seals сохранены.
Отчёт и sidecar передаются PM для публикации exact bytes; Reviewer **SEALED / IDLE**.

Подпись: Independent Reviewer / Codex / CODE_REVIEW / 2026-10-06.

