# Independent QA — Claude Design UI affected r2

**Вердикт: FAIL.** Проверены 42 исходных адреса: **39 PASS / 3 FAIL**. Один новый UI-дефект D12: отклонённый JSON с длинным `instances.…numerics.pathEfficiency` расширяет страницу 390→405 px и прерывает native touch export. Исходные D01–D11 counterexamples исправлены; общий PASS не заявляется.

Actual role: independent QA, `.agents/QA_ROLE.md` v2.1. Model: Codex; exact provider model ID unavailable. Та же QA session, без субагентов. Подпись QA `/root/ship_fitting_qa`, UTC 2026-10-05T21:46:33.483779+00:00. Подпись закрепляется SHA-256 immutable report/evidence; это не provider model attest.

## Exact candidate и независимая привязка

- Worktree `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`, clean HEAD `ddd06148108462cb97c656efd6f266442ccdba9c`; runtime source `ff01dfa1b2411aa472bb7500babfde8277694f35`. Перед импортами и после измерений HEAD/source bindings независимо проверены; `git diff --check` PASS.
- Formal `docs/verification/claude-design-ui-runtime-binding.json`: **146 actual committed/working blobs + whole UI VC text**, independently canonical fingerprint `51d7abe3cfd7fd2cc6b18786f90f3239ae7e74a5db75f2fbc04ac82b9da7d4f0`. Полный список blobs/whole VC в `qa-affected-ui-binding-r2.json`, SHA-256 `1b7fcbc0b2a3d61272537c0876c6e0d6ea2bc321f453256c24b6c70c0f2ec0fb`; дублировать 146 строк здесь не требуется.
- Accepted WHAT/UI VC/sourceExpected unchanged. Sealed source-first affected plan: 42 original IDs =17 initial FAIL +25 necessary regressions, expected fingerprint `b6189477be8a746bc35849954f338d0ac879805635a4f75b9efbf31b94854f56`. Plan MD SHA-256 `85a1e1cc06ddff138cf2fad11664198b149b9a843eeef4351a060b65e65ee1df`; JSON `61914fe49bfce6e27cf073e21e8f6ef9d1c5ecaa99eb5c6dc86dd5a056718266`. Независимые oracles сохранены до fix explanation; Developer report/tests не oracle.
- Immutable artifact `.overgate-runtime/claude-design-ui-v0.2-candidate-fix-r1/`: manifest SHA-256 `ef224a0588381c48f8bf70852bf57e59739acaf80b24fec9e6b8e54716ea4c3f`; ZIP `6d55860893fe0cccc63242df33aacc37d69fc7bd2f5afe875ac1311894508ab5`; distDigest `55ee3288d859bff990b40cbc91a269d744655086465b183cea365cb1058b2d55`. ZIP CRC/extraction PASS; 17 files /1,275,829 B, archive518,040 B. Source66 fingerprint `cd53343b38ccdf9d938a0c88d40bcfe7141058c6298d71dacc50efb306d4d1f0`, actual66 blobs checked.
- Protected85 baseline903d36b +2 experiment files identical, 6 compiled catalog/Worker/IO/Legacy/style assets identical initial artifact. All17 dist/extracted/prefix/ZIP files and all51 served bodies across3origins match. Own normal guard-built default dist also identical17; evidence `qa-affected-ui-final-source-build-r2.json`. Initial52 seals and historicalSF r4 23 seals independently unchanged.

Read-only reviewed/tested paths: accepted UI overlay, full UI VC, UXv2.1, committed72-case source plan, formal binding/ReviewContract; actual changed runtime `src/app/fitting-ui/{compare-view,instance-details,lab-view,presentation,ship-view,swap-dialog,telemetry}.ts`, `src/app/fitting.ts`, `src/app/fitting.css`. Relevant unchanged owners `fitting-session`, `compare`, `charts`, `lab-channels`, fitting catalog/compiler/validation, IO, numerical/runner/Worker sources and immutable build source manifests. Exact delta saved in `qa-affected-ui-delta-r2.txt` and `qa-affected-ui-runtime-delta-r2.diff`; no product/code/test/requirements/Beads/GitHub edits by QA.

## Подсчёт и перенос истории

| Этап | Original IDs | PASS | FAIL | NOT RUN | Тип evidence |
|---|---:|---:|---:|---:|---|
| Initial r1 |72|54|17|1|Immutable own initial measurements|
| Current affected r2 |42|39|3|0|Current own measurements, 17 former FAIL+25 necessary regressions|
| Eligible carryover |30|29|0|1|Historical own evidence after actual delta/core equality proof; не свежие измерения|
| Final mapping original72 |72|68|3|1|39 current PASS+29 historical PASS; no inflated114-case count|

Initial report SHA-256 `d0492e963e0bf74d1b1ecb2513ea8391aab474d2e278f4abf3606208b931b571`, manifest `0188258dbb55681569aa3c89df5cba13796c36547cb74a7b5cfd7ca7d5ab51dc`, all52 read-only files byte-identical. Published by PM unchanged: https://github.com/komleff/u2-lab/pull/6#issuecomment-6002600430. История FAIL сохраняется; текущий report её не заменяет.

D01–D11 original counterexamples закрыты текущими измерениями: ring spacing/fallback; catalog columns/sort/full preview; Compare sorts/cards; Pony numbering; honest event filters; A-only/B-only; speed options; Reset/44px hit areas; replaced identity telemetry; whole cardbutton/name; source canvas breakpoints. **14 former FAIL IDs now PASS; UI16-03/UI18-02/UI18-03 remain FAIL for the distinct new D12**, а не за прежний Reset. 25 necessary regressions PASS.

## D12 — длинная ошибка импорта нарушает мобильный workflow

Source: UI16/18, UXv2.1 §6 и §11.7; prepared UI16-03 expected «document no horizontal overflow; controls/errors reachable»; UI18-02/03 actual390 touch import/export controls. Это существующий accepted functional boundary, не косметическое пожелание и не новый WHAT.

Repro на exact artifact, Playwright actual390×844, touch=true, scale1:

1. Открыть любой из three actual origins ниже; fresh page scrollWidth/innerWidth390, visualViewport390.
2. Через native file input импортировать source-first fixture `missingPath`: supported fit с electric engine без обязательных `pathEfficiency/origin` (fixture `qa-claude-ui-fixtures.json`, frozen initial bytes). Валидатор корректно отклоняет JSON, показывает строки `instances.fit:march.numerics.pathEfficiency` и аналогичные retro/strafe/turn.
3. После ошибки innerWidth/scrollWidth=**405**, visualViewport.width=**390**, scale=1 на каждом origin. Это horizontal page overflow, не labelled table scroll.
4. В реальном nominal-run/frozen-A workflow native result export после той же ошибки timeout; до неё тот же native target успешно загружает Blob. Keyboard Enter остаётся positive control; он не засчитан как native touch PASS.

| Actual origin | secure context | Before width | After width | visual width | exceptions/requestfailures |
|---|---|---:|---:|---:|---|
| http://localhost:4183/ |true|390|405|390|0/0|
| http://192.168.68.65:4183/ |**false**|390|405|390|0/0|
| https://192.168.68.65:4184/u2-lab/ |true, local selfsigned|390|405|390|0/0|

Exact evidence: `qa-affected-ui-three-origin-overflow-r2.json`; `qa-affected-ui-import-geometry-observations-r2.json` (native export succeeds for preceding5negative classes, blocks at missingPath); `qa-affected-ui-negative-final-r2.json` /`.mjs`; fresh native-positive controls `qa-affected-ui-export-hit-r2.json` and `qa-affected-ui-export-sequence-hit-r2.json`. Область дефекта — UI отображение error paths. Валидатор/model/Worker/IO/schema correctness не опровергнута.

All8invalid classes завершены отдельно: malformed JSON, unknown fit/run schemas, model, catalog w/o explicit replay, missingPath, copEfficiency0, outside selected group. Fit/result/frozen-A bytes сохраняются во всех8; во время active run source-first workspace atomic probes также PASS. Actual phone final fitSHA `cb892ec96a261d376148d7fe1fcf892aa6a3e655e86f1662fc6fbde1c9fbe4f7`, resultSHA `2356aef225ccec95bd2a9a219bd7f16deaffb2a7f951be4186005773d4333aab`; evidence `qa-affected-ui-all8negative-phone-r2.json` +final rows. Последующие cop0/outsideGroup возвращают width390. UI15-02 — PASS data atomicity, native pointer availability после missingPath отдельно FAIL D12.

## Текущие 42 source-first адреса

Полные неизменные `sourceExpected`/`preparedMethod` и actual result/evidence в `qa-affected-ui-case-results-r2.json`, SHA-256 `34fd61127615cd6c7fd0a6c855651e7c563c4d97a5d5f700405ef2fd1a667a08`. Ни raw aggregate assertion, ни passing automated tests автоматически не заменяют независимый verdict.

| Case | Source AC | Current method / actual | Result | Evidence |
|---|---|---|---|---|
|UI01-01|UX4.1/5.1/7; overlay1,4–6|Actual navigation, сохранение fit/revision/conditions; нет start/newrun/reset|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI01-03|UX4.1/5.1/7; overlay1,4–6|Active owner A, выбрать/edit B и навигация; second Start запрещён, один Worker|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI01-04|UX4.1/5.1/7; overlay1,4–6|Paused navigation сохраняет time; stale chunk после Reset игнорируется|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI04-01|UX4.4/11.5; Main/V2-Flat/M2-Fitting|Инвентарь source S/Pony и пропорции ring по фактическим группам|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI04-02|UX4.4/11.5; Main/V2-Flat/M2-Fitting|Независимый angular/gap budget; ширины439/440/441, Sputnik12/Pony14/L20|**PASS**|`qa-affected-ui-supplement-r2.json`|
|UI04-03|UX4.4/11.5; Main/V2-Flat/M2-Fitting|20×18°+4×2°=368°>360°: industrialL fallback даже при ширине441|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI04-04|UX4.4/11.5; Main/V2-Flat/M2-Fitting|Ring/row открывают тот же dialog; actual mobile flat после settle resize|**PASS**|`qa-affected-ui-followup-r2.json`|
|UI05-02|UX4.6/4.7; SF03; overlay2|Builtin readonly; неизвестный слот не меняет builtin, атомарная validation|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI05-03|UX4.6/4.7; SF03; overlay2|Pony actual три distinctID и видимые Лазер1/2/3, builtin origin|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI06-01|UX4.8/UC02–04; SF02/16|Rendered catalog rows: mass/power/cargo обе стороны, compatible first, unknown volume/source|**PASS**|`qa-affected-ui-supplement-r2.json`|
|UI06-03|UX4.8/UC02–04; SF02/16|Whole-fit laser→cargo preview: Δbus−3MW, ΔR−0.0625125 SCU/s; без commit|**PASS**|`qa-affected-ui-supplement-r2.json`|
|UI06-04|UX4.8/UC02–04; SF02/16|Cancel/Esc сохраняют fit; apply/remove каждый ровно +1 revision|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI07-01|UX4.8/7; SF16/17; overlay7|Pony batch2removable: +1 revision, cargo+24, builtin mining остаётся|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI07-02|UX4.8/7; SF16/17; overlay7|Whole batch unknown/builtin/duplicate assignment rejected атомарно|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI07-04|UX4.8/7; SF16/17; overlay7|Active batch только next revision; RunSpec/result/frozen/foreign ownership сохраняются|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI08-01|UX4.5/4.10/9; overlay4–6|Applied variants/copy независимы; selection сохраняет commit и удаляет только dialog draft|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI08-02|UX4.5/4.10/9; overlay4–6|Own stale result отличается от foreign/frozen A; current selected variant ownership|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI08-03|UX4.5/4.10/9; overlay4–6|Global test принадлежит A при выборе/edit B; conditions locked и второй Start запрещён|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI08-04|UX4.5/4.10/9; overlay4–6|Terminal release, run B с новой identity; delayed A rejected; frozen A сохраняется|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI09-01|UX5.3/5.4/UC06/11; SF17|Actual Worker Start/Pause/Step/Resume; ×1/×10/×60/max selectable|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI09-02|UX5.3/5.4/UC06/11; SF17|Active conditions locked, редактирование fit next revision, разрешённые нули|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI09-03|UX5.3/5.4/UC06/11; SF17|Actual touch Cancel→Freeze→Reset; no-test/result cleared, frozen A preserved; old chunk ignored|**PASS**|`qa-affected-ui-followup-r2.json`|
|UI10-01|UX4.7/4.9/5.5/9; SF12–14; overlay Честные измерения|Независимые R и полный10s denominator; rendered SCU/K/rate|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI10-02|UX4.7/4.9/5.5/9; SF12–14; overlay Честные измерения|Sputnik20s actual Worker; laser100% bucket19–20→cargo12SCU без старого bar|**PASS**|`qa-affected-ui-followup-r2.json`|
|UI11-03|UX4.10/M2-Compare; SF15|Own measured1/2/3 results projection: K/diesel asc+desc, unmeasuredN/A last|**PASS**|`qa-affected-ui-supplement-r2.json`|
|UI11-04|UX4.10/M2-Compare; SF15|Current actual nominal run: desktop cells=390 mobile cards, units/provenance/sort selectors|**PASS**|`qa-affected-ui-final-corrected-r2.json`|
|UI13-03|UX5.7/5.8; SF05/09–11|Environment filter actualempty; instance control honestdisabled с отсутствующей attribution|**PASS**|`qa-affected-ui-supplement-r2.json`|
|UI14-01|UX5.10/UC12; SF15; overlay4|Frozen A bytes сохраняются после edit/runB/select/reset|**PASS**|`qa-affected-ui-functional-r2.json`|
|UI14-04|UX5.10/UC12; SF15; overlay4|Actual A/B runs: mobile A-only/B-only visibility, values и immutable provenance|**PASS**|`qa-affected-ui-final-corrected-r2.json`|
|UI15-01|UX5.10/UC13; SF18; invariant DOMtext|Native Blob fit/run/result/CSV SI/version/retention, roundtrip actual browser|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI15-02|UX5.10/UC13; SF18; invariant DOMtext|Все8negativeclasses: fit/result/frozenA digests unchanged; mobile keyboard download control|**PASS**|`qa-affected-ui-negative-final-r2.json`|
|UI15-03|UX5.10/UC13; SF18; invariant DOMtext|Unknown snapshot explicit replay only; known legacy actual ?mode=legacy route|**PASS**|`qa-affected-ui-followup-r2.json`|
|UI15-04|UX5.10/UC13; SF18; invariant DOMtext|Hostile labels literalDOM/noattack; tiny domain guards before commit atomic|**PASS**|`qa-affected-ui-followup-r2.json`|
|UI16-01|UX11.7/6; UI functional accessibility|Whole cardbutton/name, 30Tab/30Shift trap, Esc возвратfocus|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI16-02|UX11.7/6; UI functional accessibility|Actual390 groups collapsed +26targets≥44; linked touchReset standalone/tablet|**PASS**|`qa-affected-ui-browser-r2.json`|
|UI16-03|UX11.7/6; UI functional accessibility|Actual390 all3origins rejected missingPath error: scroll/inner405>390; native export blocked|**FAIL**|`qa-affected-ui-negative-final-r2.json`|
|UI16-04|UX11.7/6; UI functional accessibility|Actual390touch all4groups/legend/time+keyboard/textsummary/fold expanded state|**PASS**|`qa-affected-ui-channel-controls-r2.json`|
|UI17-02|UX10/11; Main/Lab/mobile; canvas labhand|Source finite canvas767/768/1279/1280/1440; tablet outercolumns BELOW center|**PASS**|`qa-affected-ui-final-corrected-r2.json`|
|UI18-01|SF18–20; named ordinaryLAN Start; accepted UI boundaries|Independent146paths+wholeVC/66sources/85protected+2experiments/17filesZIPCRC+51servedbodies/sourceExpected seals|**PASS**|`qa-affected-ui-binding-r2.json`, `qa-affected-ui-final-source-build-r2.json`|
|UI18-02|SF18–20; named ordinaryLAN Start; accepted UI boundaries|ActualLANsecure=false Start/control/IO pass; rejectedmissingPath phone workflow overflow FAIL|**FAIL**|`qa-affected-ui-negative-final-r2.json`|
|UI18-03|SF18–20; named ordinaryLAN Start; accepted UI boundaries|Actuallocalhost/TLS-prefix same17bytes and controls pass; phone error overflow bothorigins FAIL|**FAIL**|`qa-affected-ui-negative-final-r2.json`|
|UI18-04|SF18–20; named ordinaryLAN Start; accepted UI boundaries|Own normal .agents/project/verify.sh Node24.21.0 + source/defaultdist equality|**PASS**|`qa-affected-ui-binding-r2.json`, `qa-affected-ui-final-source-build-r2.json`|

Существенные независимые численные oracles, только для отображения/регрессии UI: nominal selected R=0.0625125 SCU/s, productive4.5s/full10s gives0.28130625 SCU, K=0.45, rate101.27025 SCU/h. Текущие actual Worker результаты совпадают (finite roundoff≤1e−12). Ring positive12/14 nodes `(360−4×2)/N`=29⅓°/25.142857°; L20=17.6°<18° требуетfallback. Catalog sort projected mass1800/2200/3000/8945.439461 kg; power0/0/3MW/3.4MW; cargo6/6/18/30, reverse orders independently checked. Whole-fit preview −3MW/−0.0625125 SCU/s соответствует installed-source replacement, а не одиночному card number.

## Реальные controls, ownership и IO

Fresh own actual3origin smoke: real Worker time/ticks advance, native touch Start/Pause/Step/Resume/Cancel/Reset; fit/run/result JSON и CSV native downloads до longerror PASS, no pageexception/requestfail/404. Actual ordinary LAN secure=false; first chunk time0.01/ticks1/measured0.01, pause0.25→Step0.26. LAN control ACK measured11.8/26.1/16.3/16.9ms, ≤500ms. Localhost/prefix have own positive advancing runs and measured controls in `qa-affected-ui-browser-r2.json`. Это LAN-origin execution на машине QA, не second physical device PASS.

Touch Reset исходный дефект закрыт: state «Отменён»→«Ещё не запускался», B/result cleared, frozenA side stable, old Worker chunk ignored (`qa-affected-ui-followup-reset-repro.json`). Current fresh768/1024 full workflows проходят preset/swap/variant, Start/Pause/Step/Resume/Cancel, freezeA, all8badimports, fit/run/result/CSV, Reset, newfit/newrun with new identity; controls min44, no overflow, frozenA stable. Mobile390 full negative workflow прерывается только при D12; полный mobile workflow после него не заявлен PASS.

UI10-02 fresh20s Sputnik actual Worker: oldlaser100%nominal bucket19–20s; после replacementcargo12SCU — «не измерено — изменено после теста», oldbar absent (`qa-affected-ui-followup-stale-bar-repro.json`). Это поддерживает distinct valid-stale vs replaced identity. Active/frozen/foreign variants и whole batch/atomic import ownership проверены исходными prepared public methods и реальным DOM/Worker workflow.

UI13-03 honest UI affordances: environment filter возвращает actual empty result; instance disabled with honest unavailable explanation. Отдельных instance/cause fields, propulsion/environment events kernel не придумано. UI13-02 сохраняет NOT RUN, как ниже.

Finite UI17 source transfer geometry PASS:767 one column;768–1279 outer columns BELOW main, могут стоять рядом;1280 grid256/664/280;1440 grid256/824/280. Source не требует one-column tablet. Current populated Compare desktop cell/mobile card values equal; A-only/B-only имеют реальные A/B run IDs и immutable provenance. Broad visual/a11y/style/screenshot-polish audit не выполнялся.

## Carryover 29 PASS и unchanged-core evidence

Основание не сводится к metadata claim: independently matched all85 protected current/base Git blobs,2 experiments,6 compiled core chunks; full actual9UI delta inspected. Expected/WHAT/fullVC unchanged,52initial evidence seals verified. Изменённые display/ownership/controls пересекающиеся surfaces адресно проверены42cases. Допустимый перенос следующих historical PASS указан явно:

| Historical original IDs | Carryover scope / current supporting evidence |
|---|---|
|UI01-02, UI02-01/02/03/04|F1/state readiness source expressions and owners unchanged; current navigation/active/paused/reset verifiedUI01/08/09. Historical status coverage retained.|
|UI03-01/02/03/04, UI05-01/04|Passport/source/load owners/compiler/catalog/bill exact; card action/name changes coveredUI05-02/03/UI16-01, catalog projections currentUI06. Historical origin/caliber/nominal coverage retained.|
|UI06-02, UI07-03|Existing pair/caliber/resource validators unchanged; current catalog compatibility and whole-batch rejection/current revision probes UI06-04/UI07-01/02/04.|
|UI09-04, UI10-03/04|Runner/metrics/stop/recovery/K/zero cases unchanged; current nominal10s finite values and replaced identity checkedUI10-01/02. Historical edge metrics retained.|
|UI11-01/02|Compare value/conditions ownership API and calculations unchanged; current actual filled desktop/mobile sort/selection/provenance checkedUI11-03/04.|
|UI12-01/02/03/04|Unchanged lab-channels/charts/retention/runner; current touch channelgroups/legend/time/textsummary/fold UI16-04. Historical interval/bucket semantics retained.|
|UI13-01/04|Existing event count/drop/filter rendering and bounded retention unchanged; changed honest affordances UI13-03 checked. UI13-02 is not PASS.|
|UI14-02/03|Compare fields/B−A/different-condition labels unchanged; current frozenA ownership +A-only/B-only actual views UI14-01/04 checked.|
|UI17-01/03/04|Exact mock26/assets/fonts/tokens accepted sources, no added remote resources; full17asset51served hashes and current finite layout/current source functional cards checked. Historical finite source transfer retained, no new cosmetic claim.|

ShipFitting numerical physical12h/maxheap historical independent report carried only for exactly unchanged core: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-qa-affected-r4.md` SHA-256 `704254bd2f0155a0b00550855e3a6f2bfb2da5d24919d10176d19e3b58280c56`; manifest `e73bbf54b018aa7b41701d145524558acbbd20326794db8a98ba3fda8e3226f5`,23seals. Historical actual43200s/4320455ticks,118channels,21601buckets,cadence2,GC75,913,416B; maxcapGC126,534,336B. Новой12h UI campaign нет; UI изменён, core proof exact. Lab mission/mining-until-full/flight/refuel не добавлены в UI acceptance.

## Harness corrections и own guard

Raw corrections сохранены отдельными files, не переписаны в PASS: (1) new experiments manifest wrapper `.proof`, corrected before imports; (2) old instance filter CSS selector заменён observable actualcontrol check; (3) async resize/center-scroll settle corrected; (4) initial tablet assertion wrongfully required sameX/onecolumn хотя source permits outercols belowcenter; (5) Reset oracle initially compared fullA/Btext, B legitimately clears, corrected frozenA-only; (6) raw full.length aggregate assertions не являются отдельными Reset/44px/atomicity failures; (7) prior combinedreplay stale-label assertion отделена от fresh20s replaced-module counterexample. `qa-affected-ui-harness-corrections-r2.json` объясняет каждую коррекцию. Genuine405px D12 не списан на adapter.

Own `source …/env.sh; bash .agents/project/verify.sh`, Node24.21.0, complete exit0: **185 unit/37files PASS;26browser PASS+1 inherited screenshot SKIP; typecheck/build/reference/bootstrap structural/cloud26 PASS**. Native hook activation NOT RUN. Log `qa-affected-ui-guard-r2.log`; defaultbuild17 equality independently verified. No competing guard/server mutation. Passing guard does not override D12 FAIL.

## NOT RUN / ограничения / handoff

- **UI13-02**: unchanged kernel propulsionShortfall flag lacks accepted named event/time/instance attribution; deferred Lab finding. Existing acceptance case remains NOT RUN, не fakePASS, не новый WHATgap/mandatory model/Worker fix.
- Physical newUI device full suite, native adapter, actual public Pages deployment, base/bootstrap/operator merge external gates NOT RUN. PO partial oldfix-r2 Xiaomi Start/results evidence не засчитано как current UI/device suite PASS.
- Mobile390 full native-touch negative/error/export workflow after missingPath is FAIL D12; keyboard exportpositivecontrol лишь подтверждает preserved data. Other initial54/17 history retained,29 eligiblePASS not remeasured. No broad visual or fresh numerical long loop.

Evidence manifest `claude-design-ui-qa-affected-r2-evidence.json`, **55 new scoped evidence files**, SHA-256 `e0780679b6e14d014621b34e0c1742e73c92abbbbe9c9da8753e18d78a354943`. Manifest hashes private scripts/raw results/logs/ledger/binding/affectedplan; report hash сообщается PM отдельно, чтобы не создавать circular hash. Initial report52/r4report23 seals verified unchanged. All new evidence/report sealed read-only0444 after assembly; no subsequent source reads/runtime probes required. Stable4183/4184 and old4186 оставлены online без изменений.

**QA evidence frozen; source freeze released for PM handoff after seal.** Candidate verdict remains FAIL for D12. Sole Developer may receive targeted presentation-only fix from PM; follow-up scope is existing UI16-03/UI18-02/UI18-03 plus linked UI15-02 error/export/atomicity regression, не новая42/72campaign. Публикует PM exact immutable bytes.
