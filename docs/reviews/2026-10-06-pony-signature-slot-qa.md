---
title: "Пони0.2.2 — независимая QA P01–P05"
status: PASS
version: "1.0"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
related:
  - docs/plans/2026-10-06-pony-signature-slot.md
---

# Вердикт и граница

Result: **PASS по P01–P05** на `3265a6870578d409586b416eb0adfabff3b9a574`.
Новое ограничение применено только к новым Pony каталога0.2.2; исторические0.2.0/0.2.1
остаются двухслотовыми и редактируемыми. Подложные новые двухслотовые документы
отклоняются атомарно. Новый продуктовый FAIL в указанной delta не обнаружен.
Существующий first-Start после duration blur остаётся отдельным нерешённым UX concern
ниже. PASS не означает исправление этого поведения или полную пользовательскую приёмку.

QA — один independent verifier, та же source-first session; подпись: Codex,
точный provider model ID недоступен. Expected подготовлены до Developer explanation;
численные опоры собственные, сняты до изменения на immutable15f5d90e.
Developer report прочитан полностью как handoff, его результаты не использованы как oracle.

# Привязка

Источник: linked `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`, exact SHA выше.
Authority — **весь** accepted plan/VC `docs/plans/2026-10-06-pony-signature-slot.md`
на03826203eb5cef1d0102f71a98b07ec469fab1cb:7821B, blob
`47e8249b91cb82b09d3388495d29da4839e0b970`, whole literal SHA256
`36b0498e16b163a44b5fb843ea2cb814cc7f1a2fa654d77edef4a5be538e7319`.
Его frontmatter proposed сохранён; authority принятия — явное поручение оператора,
PLAN_READY и TEST_RELEASE PM. Scope не расширяется миссиейv2.2 или будущими M+E modules.

До probes independently проверены137 source entries по Git/working/snapshot/tar,
включая8 whole contracts. Source fingerprint:
`f626e0eb1f1ef3e2228cd5d26103efb14b3620ed6e1240caa06037e0d6aeb88f`.
Рецепт: SHA256 UTF8 sorted `path + NUL + gitBlob + LF`; whole contracts входят
обычными rows. Дополнительный собственный acceptance fingerprint:
`d5b98bbbb854cd8585719359d575d33593c1d5405d98c2f7ee79e1115c884de8`:
тот же137-row stream + literal bytes8 whole contracts в manifest order, без separators.
Списки путей/блобы/полный build и served-body proof: `execution-r1/binding.json`.
Внешняя loader dependency parameter-intake.json59761B отдельно связана в binding;
её bytes равны собственному frozen15f fixture.

Artifact: linked `.overgate-runtime/pony-signature-slot-candidate/extracted/dist`.
Dist17 SHA256 `b5f8f267f27917c8fd44c91a744af5808fbcfdbc896a01bd6e22cbbc8f5d0128`
по sorted relative path/NUL/fileSHA/LF. ZIP525365B SHA256
`1d17422c6c68e6e9404bebd15c7b0bb2c37701c70d2b4d1015766a785aa94b7b`;
CRC/dist/extracted/ZIP exact. Source manifest41755B SHA256
`3bac67f9012e9f9638feb01fd2ecdb8b8b71b3c4a731230df9452594d40f54d0`;
build manifest4032B SHA256
`0e09c55542431bd6d9a4d3ca34817624ad299d1911c75357abedc69d0230e09b`.
34 localhost/LAN4190 HTTP bodies exact. Runtime UI execution — actual ordinary
`http://192.168.68.65:4190/?qa=pony3265`, secure=false; owned servers/user tabs untouched.

# Test case → Source AC → Method → Result → Evidence

Пять acceptance addresses, не173 независимых AC. Выполнены57 внутренних API assertions,
две whole LAN chains и12 fresh-open slices (116 внутренних browser assertions).
Все173 assertions PASS; подсчёт не подменяет методы пяти строк ниже.

| Test case | Source AC | Method и source-derived expected | Result | Evidence relative к этому report |
|---|---|---|---|---|
| P01 new sole-slot | Whole plan WHAT + VC P01 | Inspect/compile newPony1/2/3 против ownold0.2.1: удалить только signature-2 и его buffer instance, stamp0.2.2; сохранить signature-1 passive radiator и остальные настройки. Actual UI всех1/2/3 на обеих ширинах; genuine sole slot→buffer-S Apply→real6s Worker. Нет второго removable mount. | PASS | `execution-r1/api-results.json` P01; `new-pony{1,2,3}-fit.json`; `LAN-{1440,390}.json`; `LAN-*-new-{fit,run,result}.json` |
| P02 catalogue/edition resolver | Whole plan HOW2/3 + VC P02 | Structural equality all45SKU,5otherhulls, Pony fields/builtins кроме removed slot и его experimental lab origin. IndustrialS3signature slots. Каждый other matching defaultcount1 наследует old0.2.1. Matching caller hull label override respected в resolver/compile; mismatched caller выбирает declared old hull2slots. | PASS | `execution-r1/api-results.json` P02; `new-inventory.json`; own `old-baseline/old-inventory.json`; `binding.json` |
| P03 historical identity/ownership | Whole plan compatibility + VC P03 | Ownold0.2.1 Pony1/2/3 и old0.2.0 Pony1: parse/compile/spec и zero/partial/complete digests exact. Protected0.2.0 oracle blob unchanged. Native old second-slot Apply остаётся old; fresh oldfit/run/result обеих editions без implicit calculation. Running oldA180s×1→foreign newB→Pause/Freeze→Cancel→newB: immutable active spec/reference сохраняются. | PASS | `execution-r1/old-replay-proof.json`, `api-results.json` P03; `LAN-1440-old-open-*.json`, `LAN-390-old-open-*.json`; `LAN-*-active-A-run.json`, `LAN-*-foreign-active-A-run.json`, `LAN-*.json` |
| P04 refusal/incomplete | Whole plan HOW3 + VC P04 | Ownold2slot fit/run/measuredresult restamp0.2.2→refusal. Unknown0.2.3/malformed default fail closed; known illegal slot не обходится explicit replay opt-in. Incomplete Pony0.0/.1/.2 безmarch принимаетT310/repeatfalse без remount, invalid−1/NaN атомарен, Startblocked. Native five refused classes сохраняют nextfit/oldactivespec/frozenA. | PASS | `execution-r1/api-results.json` P04; `bad-*.json`; `LAN-*-bad-*-after-fit.json`, `LAN-*-bad-*-active.json`, `LAN-*.json` |
| P05 genuine LAN workflows | Whole VC P05 + inherited v4 ownership | Two whole chains1440 and true isMobile+hasTouch390: new sole replacement→6s MAX→analysis/F3→native Unicode fit/run/result exports→fresh opens; old.1/.0 second-slot dialog/Apply→6s real Worker. Advancing180s×1 navigation/foreign nextincomplete/validconditions/Pause/Freeze/Cancel→repair→4s MAX/Compare with explicit reference. Visible edition/F3 resolve chosen draft; active export resolves immutable oldA; measured graphs derive actual result. | PASS | `execution-r1/browser.mjs`, `browser.log`, `browser-results.json`, `LAN-{1440,390}.json`; new/old open-fit/run/result JSON + download files; screenshots referenced in each workflow JSON |

# Измеренные цепочки и old oracle

Desktop1440 проверяет old0.2.1, touch390 — old0.2.0. На каждой ширине newPony1/2/3
действительно показали единственный signature-1; собственная замена radiator→buffer-S
легальна и не устанавливает второй модуль. Старый signature-2 buffer→passive radiator
применён настоящим click/tap в диалоге; F3 показывает исторический двухслотовый hull.
Все native downloads сверены с фактическими Blob bytes; fresh run export сохраняет
exact numerical spec, fresh result export сохраняет exact spec/state/metrics/trace/events.
Открытие fit допускает только новый draft fitRevision; mount/localVariants/initial/edition
сравнивались без этого revision. Ни один из12 fresh opens не отправлял start/resume/step.
Измеренный result даёт графики сразу, без нового расчёта.

Короткие controls: H6/dt.01/T300, phases1/2/1/1/1, repeatfalse; MAX — maxSteps20000.
Terminal status complete, time6. Next B после recovery H4 complete, edition0.2.2.
Active ownership slice H180×1 не обещает завершение180s: реальный Worker time рос
до и после navigation, затем Pause/snapshot/Cancel. Frozen A runId retained после
отказов и после завершения новогоB; second Start был disabled. Экспорт активного опыта
до и после foreignB/всех отказов semantically exact исходному postMessage spec.
Next B T310/incomplete mount был отдельным nextdraft, Start оставался blocked послеCancel.

57 API assertions воспроизводят собственные old digests: old0.2.1 Pony1/2/3 и0.2.0 Pony1,
zero0, partial50ticks≈0.5s, complete6s. Recursive sorted-object-key digest, arrayorder
retained, typedarrays→arrays; runId/events/partition metadata не входят в numeric digest.
Формулы/digests извлечены из baseline заранее, future test oracle не регенерировался.
21 explicit model/runner/scenario/Worker/data owner blobs unchanged vsown15f (в binding).
Этим не объявляется blanketbinary equality всех compiled assets или новый12h PASS.

Page exceptions0 и requestfailed0 во всех14 own browser contexts. В трёх saved checkpoints
каждой main chain inner/client/document/visual widths1440/1440/1440/1440 и390/390/390/390,
secure=false. Screenshots сохраняют фактическую позицию native UI после действия:
`LAN-*-old-two-slots.png` показывает F3/экспорт old измерений, а сам второй slot доказан
DOM/state и native dialog steps, не названием screenshot. Physical tablet здесь не тестировался.

# Existing concern и adapter history

**Existing first-click Start concern — не исправлен и не маскируется PASS.** По PM/Developer
read-only baseline evidence одинаково на15f5@4188 и candidate после importedresult→duration edit
без предварительного blur первый native Start теряется: onchange снимает replay section
и заменяет button между pointerdown/up; click/Workerstart отсутствует. Это inherited
finding, не собственный новый repro этого Pony QA. В моих P05 inputs намеренно
native fill+Tab; PASS доказывает committed-input chain. Workaround не является fixed UX.
Source owner `fitting.ts` conditions onchange/render/start; Developer report concern и
его baseline-pointer.json — external supporting evidence, не собственные173 assertions.
PM ведёт дефект отдельно; новых runtime fixes QA не делал.

Новый private API loader использовал два middleware Vite servers: один HMR warning
«Port24678 is already in use» сохранён в api.log; actual API завершился exit0/57PASS,
оба private loaders закрыты, root LAN servers не тронуты. Это adapter warning,
не продуктовый FAIL. В старом prep сохранён original missing parameter-intake dependency
loader fault и исправленный private frozen-Git JSON adapter; ни source snapshot, ни
artifact не правились. Originalfalse harness history не удалён.

# Reviewed/Tested-Paths и NOT RUN

Own runtime/context read/test: `src/fitting/{types,editions,catalog,validate,compile}.ts`,
`src/io/fitting-json.ts`, `src/app/fitting-workspace.ts`, `src/app/fitting.ts`,
`src/app/fitting-ui/{presentation,ship-view,swap-dialog}.ts`; context owners
`src/app/fitting-ui/{lab-view,compare-view}.ts`, scenario/runner/result parsers через API.
Actual delta17paths связана в binding:11runtime +6tests/fixtures.137source binding —
проверка bytes, не137 semantic CodeReview; Developer tests не мой expectedoracle.
Whole plan и inherited8contracts bound, подготовка `preparation.md` остаётся прежней.

NOT RUN в этой delta: physical Xiaomi/другой реальный device, native OS download dialogs,
public Pages/HTTPS, native hook/bootstrap/base/full-product gates, operator merge;
H3600/12h/Cartesian matrix/полная старая WF/C/UI кампания; конкурентоспособность Pony,
обнаружение/mission/refuel/M+E utilitymodules. Их результата этот report не присваивает.
DEV normalguard328unit/43browser+1inheritedSKIP — handoff evidence, не собственный QA guard.
Старые technical/user-workflow PASS/FAIL остаются историей отдельных scopes.

# Seal и передача

Own raw manifest: `qa-evidence-r1.json`, explicit absolute paths/bytes/SHA256 каждого
fresh raw файла; fingerprint sorted relativepath/NUL/fileSHA/LF. Report/manifest/raw
после readback0444. Source-first preparation/44ownoldraw seals сохранены;
прошлые CQA1/affected/v4 reports не перезаписаны. Новых product/tests/Git/Beads/server
изменений нет. Execution завершено; **source freeze release** для PM/scoped Review.
Дальнейших probes не требуется. QA IDLE.

Подпись: independent QA / Codex; exact provider model ID unavailable / 2026-10-06.
