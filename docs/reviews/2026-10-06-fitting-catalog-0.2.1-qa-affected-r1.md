---
title: "CR-V4-B1 — независимая affected QA неполных сборок"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
candidate: 15f5d90e97b696b8738a204953af852942bec704
baseline: 131570d8f018d3617067bb558099f68aff7c9a53
result: PASS
scope: CR-V4-B1 / четыре подготовленных risk slices
---

**Affected QA CR-V4-B1: PASS; product FAIL0, harness FAIL0.** Проверены четыре подготовленных risk rows и две representative native LAN-цепочки. Это closure неполных сборок/conditions/ownership; не новая полная WF01–15/C01–08 кампания и не повтор всех прежних methods.

Ожидания зафиксированы до fix explanation: `preparation.md`,2443B, SHA256da50efde45c35300aff3c34a799002f163b1e8c64c3492d74d10a23f6545ba4a. Authority: WF02/06/error в product/whole v4 VC и signed `docs/reviews/2026-10-06-gd-v4-catalog-code-review-r1.md`,17308B/SHA430ae60211cad25f2ff5f70022e42df92226db6be527e9768464a1001d854953. Expected: разрешённый неполный next draft принимает допустимые условия, не становится готовым к Start; invalid input даёт штатный атомарный отказ. Imported selectedWorkGroup ID/edition не заменяются default IDs. Developer report/tests не oracle.

| Risk / sourceAC | Собственное исполнение и actual | Result / evidence¹ |
|---|---|---|
| B1-01 · WF02/06/error; CR-B1 | Sputnik/IndustrialS ×0.2.0/0.2.1 ×missing power-1/march:8 fixture addresses. T310K/repeat=false приняты, fit/mount/edition неизменны, Start refused. NaN/Infinity/−1 дают false без exception и сохраняют snapshot. Один empty-payload/missing-march Sputnik: default и explicit[] принимают условия, prepare остаётся blocked | PASS · api-results; LAN-* |
| B1-02 · WF06/13; imported group | Четыре imported2laser hull/edition fixtures с IDs qa:laser:alpha/beta. После удаления battery и edits оба ID сохранены; ремонт даёт selectedWorkGroup из тех же IDs, T310/repeat=false/actualedition. Removed explicit mining ID даёт штатный атомарный refusal. Native exports подтвердили обе representative editions | PASS · api-results; *-repaired-run |
| B1-03 · WF04/06/10/12 | Genuine completeA8s/MAX→H180/×1 advancingA→foreign incompleteB→T315/repeat=false→anchors→Pause/FreezeA→invalidT→Cancel→repairB4s/MAX. Active exports byte-equal до/после edits/refusal; frozenA/reference/base сохранены. IncompleteB blocked после terminalA, repairedB использует свою T/group/edition | PASS · LAN-*; *-active-*; *-B-complete-result |
| B1-04 · WF02/06/14 | Actual ordinary LAN1440 mouse/oldSputnik2 и true isMobile+hasTouch390/newIndustrialS2. Native slot removal, form controls, refusal/recovery, downloads и RUNNING anchors. Один genuine Worker, время растёт без Pause, secure=false. Page exceptions/request failures0 | PASS · LAN-*; *-active-next.png; *-final-compare.png |

¹ Raw root: primary `.overgate-runtime/catalog-0.2.1-qa/affected-cr-v4-b1/execution-r1/`; сокращения означают `.json`, кроме указанного `.png`. Полные case/source/method/results — `case-results.json`; все hashes/scripts/logs/native states/screens/downloads — отдельный `qa-affected-evidence-r1.json`.

Native воспроизведение: импортировать собственный2laser RunSpec, открыть «Питание»/power-1 и нажать «Удалить», затем «Условия», T310 и выключить «Повторять заданный цикл». Начальная T и repeat сохранены, Start disabled. T−1 показала «Условия отклонены текущей валидацией…» и вернула последний valid310; native fit bytes не изменились. После native ремонта обязательного item подготовленный run export сохранил оба исходных workgroup IDs и declared0.2.0/0.2.1. Неполная сборка не превращена в готовую посредством validation reference.

В workingA-nextB ветке реально удалён march у B, T315/repeat=false применены во время advancingA. Native active exports совпали с исходным command.spec/H180; next B conditions не изменили активный опыт. После Freeze genuine pausedA повторный invalidT сохранил active export, next fit и точный frozen comparison text. Cancel освободил Worker, но B Start оставался disabled до ремонта. CompletedB4s сохранил T315, оба ID, repeat=false и edition; явная Compare base осталась referenceA. H180 — RUNNING/Cancel slice, **не completed180s**. Полностью завершены только выбранные8s A и4s B; MAX проверен на этих коротких positive controls.

Own execution: Node24 private Vite SSR api.mjs с cache только в ignored folder; Playwright browser.mjs использует actual DOM/source labels/units и настоящие coordinate mouse/touch действия, file input и download bytes. Worker instrumentation лишь записывает genuine commands/messages, fake frames/results не вводятся. API46PASS — внутренние assertions, не46 новых AC; browser14PASS на каждой ширине — assertions двух цепочек, не28 independent cases. Browser state client/scroll1440/1440 и390/390 на сохранённых checkpoints; это адресное control evidence, не общий visual audit. Разъясняющих harness corrections в этой affected попытке не потребовалось.

Source/build привязка независимо проверена **до product imports**: clean tracked HEAD15f5d90e97b696b8738a204953af852942bec704; all149 actual committed/working blobs/bytes совпали. Source-blob fingerprint(sortedpath+NUL+GitBlob+LF):
`5306313d0ee48094673655b2ae8bf151af7b75f1e019bae80ff020dfd809fa33`.
137 relevant paths + literalwhole7 sorted contracts +2 accepted notes:
`9458f05433fb89123d514d00aadb82a46daf48d3528dde054ca5c22e3f1d5988`.
Полный список и actual rows — `binding.json`. Дельта к131570d8 ровно src/app/fitting-workspace.ts, tests/browser/gd-workspace-v4.spec.ts, tests/ui/gd-workspace-v4.test.ts. Direct owners/контекст прочитаны: workspace, fitting controller, lab-view/conditions, scenarios/fitting и catalog/validation boundaries; это не новый kernel review.

Immutable artifact: linked `.overgate-runtime/fitting-catalog-0.2.1-candidate-fix-r1/extracted/dist`, owned4188. Обе UI цепочки по `http://192.168.68.65:4188/?v=cat021-15f5d90e`, secure=false; localhost только asset-body verification. ZIP525792B SHA2560c2e16b9f593adbd21273c1727deafffc1b4b41428004f8a42c8a0c3c184bf82; declared dist18files/1328268B digest702bf1bf914892e37a5ddc3e0b81d4907dde5948a0783e2d55a3d3e866229f3d. Own18 extracted/dist+dist+ZIP entry bytes/hashes, ZIP CRC и36 actual HTTP bodies совпали. Product/source/tests/build/server/user tabs и docs/.DS_Store QA не меняла.

Прежний CQA1 PASS на131570d8 остаётся historical scoped C01–08 evidence; не объявляется freshfull8 на15f. Его189raw+report+manifest191file seal проверен bytes/SHA/mode0444, включая false harness history; прежние v4 QA1/QA2 не переписаны. Текущий fix не меняет numerical/data/Worker algorithms; новый full numerical sweep/old replay/long outcome здесь не наследуется как freshly executed. :3 у Sputnik/IndustrialS остаются штатными C03 negatives, slot capacity не расширена; их source unchanged, новое :3 исполнение не заявляется.

NOT RUN: Developer broad34/6hull или24edge suites как own execution, fullC01–08/WF15/7/72, H3600/12h/matrix/fullguard/CI; все комбинации ручных local hypotheses; physicalXiaomi/tablet/nativeOSgesture/publicPages/base/merge. Empty-payload representative проверен явно; остальные дополнительные cargo-only/Pony-disabled варианты не заявляются. Physical device не подменён true-touch emulation. PM/DEV guard не own evidence. Незакрытого WHAT и новых product blockers в выполненном scope нет.

Подпись: independent QA / Codex; exact provider model ID unavailable. Runtime execution завершено, affected verdict PASS. После readback/seal source freeze RELEASED для PM и same-session scoped Reviewer closure; это не merge approval. После передачи — IDLE.
