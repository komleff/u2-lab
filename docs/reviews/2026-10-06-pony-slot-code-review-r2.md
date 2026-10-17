---
title: "Pony CR-PONY-B1 — scoped Code Review closure"
status: APPROVED
version: "2.0"
date: 2026-10-06
role: Independent Reviewer
model: "Codex; exact provider/model ID unavailable"
related:
  - docs/plans/2026-10-06-pony-signature-slot.md
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/reviews/2026-10-06-pony-slot-code-review-r1.md
---

# Вердикт

**APPROVED: CR-PONY-B1 CLOSED; BLOCKER=0, новых ADVISORY=0.**
Historical CR-PONY-A1 / ulab-w7j неизменён и OUT; его исправление не заявляется.
Mode: CODE_REVIEW, тот же sole Independent Reviewer. Model: Codex; точный
provider/model/deployment ID недоступен.

Commit context: `545c7229b8a2359b001568888dcb6073921b8baa`;
Developer fix: `bbe3fc9914109dfa2b671666fb0585bdcb38337c`;
baseline: `3265a6870578d409586b416eb0adfabff3b9a574`.
Scope — только3 changed paths и known snapshot structural linkage/atomic refusal,
authored/local/unknown positives; прочие14 прежних review paths перенесены по exact blob equality.
Это affected closure после signed QA, не новая общая P01–P05 или mission/M приёмка.

# Reviewed-Paths и binding

| Path | Git blob |
|---|---|
| src/io/fitting-json.ts | ef679f906db0d7a090919f872aaa15f59e0c0f0d |
| tests/fitting/pony-signature-slot.test.ts | ebed61b4f8b37dbd13f0b29fa4c0ab0316150e4c |
| tests/browser/pony-signature-slot.spec.ts | 882afa979341ee43f135c5f483d1a434cd8f2846 |

Review Contract: `.overgate-runtime/pony-slot-code-review-fix-r1-binding.json`,
17293B / SHA256 `eeaee8bcf86d67b0392f63d3bbd556d983cf0b8e83f9ee33dabcadfec8fb6f1b`.
**Content-Fingerprint:** `55bb0cf865db2de21163c1821466cceb41863a7bc6f0c0b9aa848a37efa2fb28`.
Own calculation: SHA256 UTF8 canonical JSON объекта `contract`, recursive sorted keys,
compact separators, Unicode unescaped, no final LF;16569B, computed=declared.
Все3 working/root/Developer bytes и14 carry blobs независимо сверены.

Fingerprint содержит также **целые** unchanged Pony plan7821B /
`36b0498e16b163a44b5fb843ea2cb814cc7f1a2fa654d77edef4a5be538e7319`
и C05 product7363B /
`a5c55604317116c29734c4f4775d541d3109879d918f63df857281bcc8aa89a7`;
literal bytes совпали. Exact rows/carry/probe command/output/evidence hashes:
`2026-10-06-pony-slot-code-review-r2-evidence.json`,8972B /
`a1d89a9cab803975504a18828e1e52af7e66f152926682ee4cef98e6dceacc3b`.

# Проверка закрытия

Known import сначала сохраняет existing numerical validation и legal nested fit,
затем сравнивает declared hull/slots/builtin ownership и resolved roster по mounted
ID/item structural identity, slot/role, enabled/builtin. Counts + per-ID matching
исключают extra/missing mounts; duplicate IDs ловит numerical validator.
`sameItem` связывает family/category/size/formFactor/species/propulsionType вместе с ID.
Числа, materials, C, gates, origins и сохранённые измерения не перекомпилируются.
Unknown explicit snapshot-only branch и Legacy не изменены.

Own exact-source proof, Node24.21.0: прежний hidden-buffer counterexample численно
валиден и raw1s run всё ещё демонстрирует20MJ, но experiment / explicit opt-in /
result / Workspace import теперь отказываются с `RESOLVED_MOUNT`; workspace byte-exact
не меняется. Positive old0.2.1 authored hullPower123 принимается exact, без recompile.
Reviewed tests дополнительно адресуют coherent mismatch classes, legal numeric/
local/builtin-mode positives и native refusal/export/frozenA цепочку. Их coverage
проверено статически; Developer suite не запускался Reviewer заново.

Signed independent QA прочитан полностью и hash-verified:
`.overgate-runtime/pony-signature-slot-qa/affected-b1-r1/report.md`10539B /
`05af0ccd3f768eb522aaf59d46eb4e9847c763f882244019c00e71a36c35204f`;
manifest19048B /
`226e68c93a3766abbec966a86bc6a97f4718d67d4a2ed80aded88c31d2998702`.
Четыре risk rows PASS:81API +25browser **внутренних assertions**, одна whole touch LAN390
цепочка и два fresh legal slices. Это inherited QA execution, не106 новых AC/мой browser run.
QA собственные harness corrections раскрыты; они не названы productFAIL.

Developer fix report7853B /
`f8c534b29797280b120ab53fa642e04e729d22a5b7e76c857f608c529fc7ff7c`
прочитан как explanation, не oracle. Normal363unit/43browser+1existingSKIP,
package proof и compiled4/6 exact — inherited evidence, не свежая Review кампания.
Artifact identity: ZIP `af385ba4f010e349f4be4edce904033dfd5f5598637b5ceb575ba466e73a78eb`,
dist `54d4048e12703a62cec0eecd8066b1b4749a676efc7492cf1ad45e515fa90c5c`.

# NOT REVIEWED и release

Не повторялись14 carry semantics/137-source/tar/ZIP/HTTP/guards, full old UI/P01–P05,
matrix/H3600/12h, physical/native/public/bootstrap/main gates. Авторские numerics
при легальной структуре и explicit unknown numerical replay — разрешённые поведения;
их canonical recompile не требовался. ulab-w7j не исследовался повторно и не исправлен.
Новых blocker/advisory findings нет; r1 sealed history не переписана.

Scoped Pony3-path source freeze **RELEASED** для PM finalization; это не operator merge.
Mission contracts остаются отдельной frozen Plan Review surface. Только новый ignored
report/sidecar; никаких source/tests/Memory/Git/Beads/PR/server/user-tabs изменений.
PM sole publisher exact bytes. Первый assignment SEALED; далее отдельный Mission Plan Review.

Подпись: Independent Reviewer / Codex / CODE_REVIEW / 2026-10-06.

