# Developer — Claude UI D12 fix, r2

Actual role: **primary Developer**, sole implementer. Model: **Codex / GPT-6 inherited; exact serving model identifier unavailable**. Signed source/evidence report, sealed SHA256 supplied to PM. Status **DONE_WITH_CONCERNS / IDLE** for PM metadata and independent affectedQA/scopedReview. No acceptance/merge-readiness claim.

Exact clean HEAD **c8f8b36ee300fa0adf9c739755efab9f05ddd265**, feat/claude-design-ui; start ddd06148108462cb97c656efd6f266442ccdba9c; protected base 903d36b2ac4a2bfa90997803770ace13d520fbe9. Delta exactly2paths: one CSS property and durable browser regression. Accepted WHAT/HOW/full UI/SF VC unchanged. Authorization: PM released freeze after sealed QA r2 report SHA2635f044e7cff48f1717eab5bb90d4f936741579f6c316797f9c54044f6c96e5 /manifest e0780679b6e14d014621b34e0c1742e73c92abbbbe9c9da8753e18d78a354943. Complete report read; original52+r2 55 QA seals byte-verified preserved; both prior artifacts ZIP/17files/dist/extracted/prefix checked unchanged. No GitHub/push/main/Beads/validator/model/IO/protocol/mission edits.

## D12 / AC and minimal change

Addresses **UI16-03, UI18-02/03**, linked **UI15-02** atomic rejection/export. Long literal instance paths in existing #fit-error had white-space:pre-wrap but no wrap inside uninterrupted tokens. At true-mobile390, those tokens expanded document/layout viewport to405 while visual viewport stayed390/scale1. Short errors did not trigger the defect; result data/validation remained correct. Native tap export became unavailable due changed layout/viewport geometry.

Added **overflow-wrap:anywhere** only to existing #fit-error:not(:empty). Entire error text/newlines/role=alert retained; no clipping/truncation or validation/format changes. Durable regression uses **isMobile:true+hasTouch:true**, real Pony Worker Start→advance→Pause→Cancel→FreezeA→F3; own source-backed electric missing-path fit rejected; asserts complete8literal error lines, document/inner/visual widths390 at scale1, native result export and byte-identical fit/result plus unchanged frozen A representation. Original touch-only contexts had not exercised the mobile layout viewport; this test closes that coverage gap.

## Fresh RED→GREEN / normal guard

- Own RED: npm exec -- playwright test tests/browser/claude-ui-fixes.spec.ts --grep D12. Failed at exact **document405/inner405/visual390/scale1**, before production CSS change. Native positive export before invalid input and full literal rejection text succeeded. Raw browser-red.log retained.
- After one-line CSS: build and same targeted test **PASS**, including native tap/result download after rejection, unchanged exported fit/result bytes and snapshot A fields/identity. Raw browser-green.log retained.
- Normal pre-bash commit guard invoked literal commit payload and project /verify on stabilized source. **typecheck PASS,185unit/37files PASS,build PASS,27browser PASS+1inherited screenshot SKIP,reference/bootstrap structural PASS,26offline checks PASS**, diff/syntax checks PASS. Native adapter activation NOT RUN. Full raw .overgate-runtime/claude-ui-fix-r2/full-commit-guard.log. Normal atomic commit c8f8b36; no skip/force/hook bypass.
- Actual extracted three-origin smoke, each **isMobile:true+hasTouch:true390×844**: localhostHTTP4198, ordinary non-loopback192.168.68.65HTTP4198, selfsignedTLS4199 /u2-lab. On each: real advancing partial Worker run→pause→cancel→freeze→F3; native fit/result export before invalid input; own missingPath stimulus generated from exported fit+frozen catalog; full8literal error lines preserved; widths remain390/390/390/scale1; native result export after rejection; identical fit/result bytes and entire frozenA DOM representation. Actual state time=measured partial duration>0. All17 served files match build hashes on every origin, no exceptions/HTTP errors/remote requests/prefix leaks.
- Ordinary LAN capabilities secure=false/randomUUIDundefined/getRandomValuesfunction. TLS is explicitly local selfsigned prefix emulation, not publicPages. Own4198/4199 stopped after checks; root live4183/4184/4186 untouched.

## Protected evidence / carried numerical checks

All85 protected base source/fixture/config/package blobs unchanged, plus2matrix/sensitivity Gitblobs unchanged. Six protected compiled core assets exactly equal initial artifact, including Worker SHA2566fcc3c6a8906bff3e9b2db8f38435fb129f4fecca1363c1848575b8ff116cfe6. No numerical body or valid runtime input changed. Therefore no fresh12h/matrix/refinement/CI rerun for CSS-only change; historical source-identical numerical evidence carried only under this equality proof, while current short/replay/retention/ACK tests ran in normal guard. Previous D01–D11 source/report/artifact history remains immutable and is not rewritten as a fresh independent verdict.

## Immutable artifact / exact hashes

Directory /Users/komleff/Documents/GitHub/u2-lab-claude-ui/.overgate-runtime/claude-design-ui-v0.2-candidate-fix-r2/

- ZIP **u2-lab-claude-design-ui-v0.2-fix-r2.zip**, **518042B**, SHA256 **fe45e0fde7c17b147b66253cdc18d832392bad90f59f7f67279d18c440998e29**; CRC/extraction PASS.
- Dist17files/**1275852B**, sorted per-file digest **eb127afa9fa367effd37308388293528322ba58a8a9c886c528ae691cfdcec2d**; serve extracted/dist; TLSroot https-root, prefix app https-root/u2-lab. All copies byte-exact.
- Source manifest actual66paths+whole UI/SF contracts; fingerprint **bb9639216d1a582680bf8475d578bddb9d739c95ac6b88cad4633ea8fa040593** (sorted path+NUL+Gitblob+LF); source-manifest.json SHA256 **06f8a954ed456baaac0b4a34ffe7a02239d449fc272fcd63b6cba1f8e69c1491**.
- Whole UI VC SHA25603912849841e9f6939282b73e6def4dd746892e15b0fb717b070fbfefff8f2f2; SF VC024d9e086cf6d14629c8c438f1939593c12b8e576b657b258121eaafcea22115.
- build-manifest.json SHA256b0f01e78dd27f30f02876a775ea59c37cd6d6e6e16bb71c56e00f5f30f46d8ae.
- three-origin-smoke.json SHA2560d4f0b512858cdba90a076419b43d1c36da30df9c8361788222f0a110c5d2557.
- evidence-ledger.json SHA2560d1b69d9255c7b230cbcafed4e7aa513eaf78f342e5e477aa11ec0e4b14fb3e5;14raw files with RED/GREEN/fullguard/sourceproof/priorseals/artifactproof/scripts.
- unchanged-runtime.json SHA25617e1204ed2bae98558581d4d7548ce23ce1437230598b476babda33d8d15b2f4; unchanged-experiments.json SHA25613d4b8bebe5eff4e18779f824db027417f54b9f39a0d04dd9399856fc58cb495.
- artifact-manifest.json SHA256f6594ea71008aa32708947a5f7e9e68c47bc64c5fc8684f00a6484e670b84803.

## Limits / own paths

Independent affectedQA/scopedUIReview pending; physical device for this artifact **NOT RUN** (true-mobile browser/actualLAN socket is not physical Xiaomi). Native adapter/publicPages/bootstrap/operator finalize/merge NOT RUN. UI13-02 unchanged unavailable named propulsion-event attribution remains DEFERRED/NOT RUN, outside D12. Inherited screenshot case SKIP; no new cosmetic review loop. No further mutations after IDLE until PM release.

| Path | Exact Git blob |
|---|---|
| src/app/fitting.css | 0194821577a63d67e45cf1c180162d610a934efb |
| tests/browser/claude-ui-fixes.spec.ts | fe9512b555dbb744d9c1187289d2d78e427bb501 |
