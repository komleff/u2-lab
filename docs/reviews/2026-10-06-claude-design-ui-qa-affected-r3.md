# Independent QA — Claude Design UI targeted affected r3

**Targeted affected QA: PASS, D12 CLOSED.** Current scope — four original IDs: UI16-03/UI18-02/UI18-03 and linked UI15-02. Own actual native workflows pass on all three origins with `isMobile:true`, `hasTouch:true`, viewport390×844, plus desktop1440×1000. Original72 mapping: **71 PASS /1 deferred NOT RUN**, including **4 current PASS +67 historical own PASS**. Это не full72 fresh acceptance campaign и не overall bootstrap/native/public/physical PASS.

Actual role: independent QA, `.agents/QA_ROLE.md` v2.1. Model: Codex; exact provider model ID unavailable. Same QA session, no subagents. Signature `/root/ship_fitting_qa`, UTC 2026-10-05T22:14:26.949120+00:00. Immutable bytes are sealed SHA-256/read-only0444; no provider model identity fabricated.

## Exact candidate and independent binding

- Worktree `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`; exact clean HEAD `1d6dd472706572f36d5aaf993d694bdaa078fae2`, runtime source `c8f8b36ee300fa0adf9c739755efab9f05ddd265`. Head/working blobs independently checked before browser execution and after it; `git diff --check` PASS.
- Formal146 paths +whole `docs/verification/claude-design-ui-v0.2-contract.md`: canonical reconstructed fingerprint `e8fcb471b0ce47aab34099774438891d7268e520408a7e3e25a5ace676e9e3a3`. Whole accepted WHAT/UIVC/sourceExpected unchanged. Full blob/text proof in `qa-d12-ui-binding-r3.json`, SHA-256 `6ad91b8aeab4419cb8d0a09b9c7bef94058039abd68102e58e4b73d392db8483`; ReviewContract metadata1.2 separately bound, not product oracle.
- Immutable candidate `.overgate-runtime/claude-design-ui-v0.2-candidate-fix-r2/`; manifest SHA-256 `f6594ea71008aa32708947a5f7e9e68c47bc64c5fc8684f00a6484e670b84803`; ZIP `fe45e0fde7c17b147b66253cdc18d832392bad90f59f7f67279d18c440998e29`; distDigest `eb127afa9fa367effd37308388293528322ba58a8a9c886c528ae691cfdcec2d`; source66 fingerprint `bb9639216d1a582680bf8475d578bddb9d739c95ac6b88cad4633ea8fa040593`. Own66 Git/SHA bindings,85protectedbase+2experiments,6compiledcore assets,17dist/extracted/prefix/ZIPCRC/files and51served200 bodies independently PASS.
- Actual source delta since ddd0614: only runtime `src/app/fitting.css`, one scoped `overflow-wrap:anywhere` under existing `#fit-error:not(:empty)` with `white-space:pre-wrap` retained. Existing browser test changed; accepted product/VC/numerical/Worker/IO/Legacy owners unchanged. Artifact66 changedpaths are CSS +browser regression test; every other `src/**` source blob identical r2. Metadata paths listed in `qa-d12-ui-delta-r3.txt`; CSS diff in `qa-d12-ui-delta-r3.diff`. Developer tests/report not oracles.

Read/tested paths: original source-first accepted overlay/UX§6,§11.7 and wholeVC; immutable original72/affected42 source case methods; `src/app/fitting.css` and actual Git delta, all146 formal blobs,66 artifact sources/85protected+2experiments/source manifests; real native UI at three exact current artifact origins. No runtime/test/source/requirements/Beads/GitHub or root server edits by QA.

## Current executed rows

`qa-d12-ui-case-results-r3.json`, SHA-256 `6a66510e270eb96c4440633947a4c837a90a5caa8b1358a1170027280880f5aa`, retains unchanged sourceAC/sourceExpected/preparedMethod for the four original IDs and separate original72 carryover map. `qa-d12-ui-methods-r3.json` records current adapter method from existing source-first oracles and sealed D12 observations; no WHAT changes.

| Case | Source AC | Current method / actual | Result | Evidence |
|---|---|---|---|---|
|UI15-02|UX5.10/UC13; SF18; invariant DOMtext|Malformed whilepaused +missingPath aftercancel: fit/result/CSV/RunSpec/frozenA/startmessage byte-stable; native exports afterrefusal; full literalerror; valid positive import/export|**PASS**|`qa-d12-ui-browser-r3.json` +binding|
|UI16-03|UX11.7/6; UI functional accessibility|True390touch native F3/error/export with page andvisualwidth390/scale1 before/after; desktop1440/keyboard/Reset linkedpositive|**PASS**|`qa-d12-ui-browser-r3.json` +binding|
|UI18-02|SF18–20; named ordinaryLAN Start; accepted UI boundaries|ActualordinaryLANsecure=false true390touch Start/Worker→Pause/Step/Resume/Cancel/Freeze/F3/invalidimport/nativeexport/Reset|**PASS**|`qa-d12-ui-browser-r3.json` +binding|
|UI18-03|SF18–20; named ordinaryLAN Start; accepted UI boundaries|Same true390workflow localhost and localTLS /u2-lab/; fulltext/nativeexports/relativeassets/currentbytebinding|**PASS**|`qa-d12-ui-browser-r3.json` +binding|

Native flow for each context: Pony3 →Lab→Start with actual positive Worker chunk →Pause; malformed JSON while paused rejected with same fit/startmessage; Step and Resume advance, secondPause→Cancel→FreezeA→native F3 summary; native baseline fit/result/run/CSV downloads; missingPath rejected; exact eight-line error and geometry; native downloads again byte-identical; keyboard result export matches; valid fit import clears error and produces next revision+1 with all other fields unchanged; native roundtrip export, Reset clears B while frozenA preserved.

| Actual origin/context | secure | layout/client/scroll/visual before→after | error lines/chars | native exports after refusal | max control ACK | errors/requestfail/HTTPbad |
|---|---|---|---|---|---|---|
|http://localhost:4183/ ·true mobile touch390|true|390→390 /scale1|8/671|fit/result/run/CSV PASS|29.60ms|0/0/0|
|http://192.168.68.65:4183/ ·true mobile touch390|false|390→390 /scale1|8/671|fit/result/run/CSV PASS|31.40ms|0/0/0|
|https://192.168.68.65:4184/u2-lab/ ·true mobile touch390|true|390→390 /scale1|8/671|fit/result/run/CSV PASS|31.80ms|0/0/0|
|http://localhost:4183/ ·desktop1440|true|1440→1440 /scale1|8/671|fit/result/run/CSV PASS|26.00ms|0/0/0|

Ordinary LAN first real chunk time0.01/ticks1/measured0.01; pause0.34s→Step0.35s→cancel0.62s, max31.4ms ACK. Other origins and desktop own chunks/timings in rawJSON. No Worker simulation/forced click or keyboard substitution for native touch proof; wrapper observes and passes original messages through. File chooser uses native file input; F3/control/download activation uses native tap/click. Keyboard Enter is a separate positive control.

Error text equals sealed old failing-candidate content byte-for-byte:8lines/671characters, actual `.textContent` and `.innerText` identical, no child elements, `white-space:pre-wrap` retained. Paths march/retro/strafe/turn each retain both missing-field/finite(0,1] validation messages. No truncation, rewritten payload, hidden error, dropped newline or validator/model/IO/schema change. Layout/visual/client/scroll widths all390 andscale1; old D12 measured405px counterexample no longer reproduces.

Fit/result/run/CSV strings before/after rejection and frozenA text have equal raw SHA-256 in each context, saved `baselineSHA` and verified by exact string comparisons. Start-message JSON unchanged; error cleared only after supported positive fit import. Valid import revision2→3 is expected committed edit, all remaining fit fields equal; Reset preserves A. UI15-02 retained all8 invalid-class historical r2 proof; current targeted rerun covers linked missingPath +malformed paths, not all8 re-executed.

## Source-equivalent carryover and honest totals

| Evidence stage | Original IDs | PASS | FAIL | NOT RUN |
|---|---:|---:|---:|---:|
|Initial r1 immutable campaign|72|54|17|1|
|Affected r2 immutable measured subset|42|39|3|0|
|Current targeted r3 measured subset|4|4|0|0|
|Eligible historical own carryover, excludes these4|68|67|0|1|
|Final original72 mapping|72|71|0|1|

No sum72+42+4, no fresh71-case claim. UI15-02 is one original regression ID already PASS in r2; current targeted measurement replaces its carried evidence rather than adding a new independent acceptance case. The three prior D12 FAIL IDs become current PASS. Remaining38 r2 measuredPASS +29initial eligiblePASS =67historicalPASS; unchanged UI13-02 remains NOT RUN. Complete ID mapping explicitly marks fresh/historical in current JSON; historical carryover reasons/source surfaces stay as immutable r2 report.

Source-equivalence is independently measured: scoped fit-error CSS change only; other runtime sources, numerical/runner/catalog/IO/Worker/Legacy, protected85+2 and6compiledcore assets exact; wholeacceptedVC/WHAT/sourceExpected identical. Thus r2 D01–D11 closures, unaffected navigation/variant/batch/Compare/channels/ownership and prior numerical evidence remain historical own evidence. No new numerical matrix/12h/fullUI replay required or claimed.

Preserved reports: initial SHA-256 `d0492e963e0bf74d1b1ecb2513ea8391aab474d2e278f4abf3606208b931b571`, manifest `0188258dbb55681569aa3c89df5cba13796c36547cb74a7b5cfd7ca7d5ab51dc` /52files; r2 report `2635f044e7cff48f1717eab5bb90d4f936741579f6c316797f9c54044f6c96e5`, manifest `e0780679b6e14d014621b34e0c1742e73c92abbbbe9c9da8753e18d78a354943` /55files. All hashes/sizes/read-only flags independently unchanged before and after runtime. PM published r2 exact: https://github.com/komleff/u2-lab/pull/6#issuecomment-6003702374. Prior genuine FAIL history remains immutable.

Historical ShipFitting r4 physical12h/maxheap evidence transferred only for exactunchanged core as in r2; 23seals independently checked unchanged. No fresh12h or native/physical/public deployment acceptance in this UI correction.

## Adapter corrections / guard attribution

Private raw attempts preserved: initial binding adapter treated artifact nonCSS browser-test path as runtime; subsequent adjustment named wrong nonruntime metadata path. Direct Git comparison corrected to actual CSS+browser regression test, with unchanged-runtime invariant limited to `src/**`; full binding already verified before any browser import. First browser positive-import oracle required identical fitRevision, incorrectly rejecting correct commit2→3; D12 geometry/literal/nativeexport/dataatomicity had already passed all4contexts before that assertion. Corrected only source-derived positive oracle to next revision+1 and other fitfields unchanged, reran scoped workflows. Raw `.initial.*`/binding attempts and explanations in `qa-d12-ui-harness-corrections-r3.json`; these are harness errors, not productFAILs erased from history.

Own current verification: independent binding/artifact/network/history/source-equivalence and four scoped realbrowser workflows described above, all PASS. No new fullnormalguard run by QA in this targeted turn. PM reported fresh exactcandidate guard185unit/27browser+1inheritedSKIP/typecheck/build/reference/bootstrap26PASS; that is attributed PM evidence. Previous own QA normalguard185unit/26browser+1SKIP stays immutable historical r2 evidence. Neither external guard nor Developer ownsmoke replaces current independent native probes.

## NOT RUN / handoff

- UI13-02 is deferred unchanged Lab kernel named propulsion event/time/instance attribution; flag alone does not support a PASS. No new cause/instance fields/events invented and no model/Worker fix in this task.
- New UI full physical-device suite, native adapter, actual public Pages deployment, base bootstrap acceptance/operator merge remain separate NOT RUN gates. ActualLAN-origin/browser-mobile emulation is not a second physical device claim; localTLS prefix is not publicPages. Earlier PO Xiaomi partialStart/results is not current full physical suite.
- No broad cosmetic/a11y/screenshot-polish audit, new Lab features/mining-fullhold/route/refuel work,42/72rerun or numericallongloop. Stable4183/4184 and old4186 untouched.

Current evidence manifest `claude-design-ui-qa-affected-r3-evidence.json`, 20 scoped files, SHA-256 `409d5064daed47a8470887b4b5db177cb5679ebe900540b024706442a8409c0e`; ledger/binding hashes above. Report+newfiles sealed0444 with perfileSHA/sizeverification. No remaining commands/probes/source reads required. **Evidence frozen; source freeze released for PM publication/scoped Code Review. Targeted verdict PASS/D12 CLOSED, original mapping71PASS/1deferred NOT RUN.**
