# QA EXECUTION — OverGate bootstrap

Дата: 2026-10-05 (project report date; hosted UTC execution 2026-10-04).
Role: independent QA / `/root/bootstrap_qa`, CRITICAL launch2/6.
Model: requested `gpt-6.1-sol`; actual provider/model identifier unavailable in this runtime.
Commit: `38ec6c7e9985257ff6494e1734372b0561daa0e6`.
Source contract: `docs/verification/bootstrap-contract.md`, B1–B8.
Trusted prior source: `633937250fa8f47b49f928c1d8781ab17fe8c8e3`, clean frozen Git checkout.
Named risks: installed governance preservation and false hook/sync PASS.

**Result: FAIL for complete bootstrap acceptance.** Available installation/distribution and local project checks PASS; actual Beads export remains FAIL, native activation and downstream restore/finalize remain NOT RUN. This report does not certify merge readiness or product runtime.

Cases were derived from installed QA_ROLE and B1–B8 before reading PM bootstrap evidence/source-fixture results. QA made no fixes, contract edits, Beads mutations, remote publication or subagent launches. All current local commands were bounded by20s where potentially blocking; no source-suite rerun or sync push retry.

| Test case | AC | Method | Result | Evidence |
|---|---|---|---|---|
| Actual public repository and Draft PR identity | B1 | Read-only GitHub connector metadata + local Git history | PASS | Search metadata visibility public; PR #1 open/draft, base main9469d3e…, head bootstrap/overgate-v4 exact candidate38ec6c7…; plan/contract committed before inventory/apply. One target PR; no exhaustive duplicate-PR search. PR opening body remains historical pre-install wording; current commit/evidence and comments establish installed state. |
| Exact clean source and approved inventory | B2 | SHA/status + independent SHA256 +67-entry bytes/mode comparison | PASS | Source exact6339372…, status empty; plan2502f1f…; zero conflicts; source-backed entries all exact frozen bytes/modes. Current verification script is the explicit project-owned filled exception. Installer plan nonmutation/drift rejection not rerun: prior independent Plan Review seven selected cases and earlier26 fixtures are reference evidence. |
| Independent approval binds actual target PR | B3 | Read-only PR comment + local plan/state/report hashes | PASS | Real issuecomment-5983829289 names independent Reviewer launch1/6, exact plan2502f1f…, contract58edef81…, report4c483445… and prior-source SHA; install-state approval matches. Session origin established by prior Plan Review/PM; QA did not invent or self-approve evidence. |
| Applied distribution and preserved project authority | B4 | Independent inventory/source/state comparison + trusted checker + Git inspection | PASS |67 operations/state entries match planned hashes/modes;66 installed targets exact approved after state, verify.sh deliberately filled. AGENTS.md and project authority byte-identical to preapply64d03c7; docs/INDEX and active/progress have project status updates, not reference overwrite. All inventory/state tracked; backups ignored. Trusted source check-reference.py --root target exit0. |
| Fresh U2 context and role/skill routes | B5 | Owner-path/manual route smoke + exact role hashes | PASS | Six delivery role owners SV/DEV/PL/RV/QA/PM and five core skills exist with exact trusted hashes; registry/operator authority routes preserved. Memory Bank describes U2 Lab, U2 pinned source, blocked bootstrap and independent evidence; generic OverGate history not substituted. |
| Local Beads API/config/task graph | B6 local | bd1.0.2 ready/show/export/config/dolt remote read-only commands | PASS | Official local binary reports1.0.2(a3f834b3); primary checkout API export yields9 ulab issues including closed planning task. B0 ulab-9aa.1 blocked with B1–B8 AC; T1 depends on B0; T2–T6 sequential dependencies and product AC references. export.auto=false; sync.remote unset; no Dolt remotes. |
| Actual Beads export to origin/beads-backup | B6 remote | Assess actual prior helper failure + current ref/config inspection | FAIL | PM actual installed bd-sync-export exit1: Git push Username unavailable/terminal prompts disabled. This is unauthenticated Git transport, not a demonstrated race despite helper generic message. No origin/beads-backup ref; no cross-machine PASS. No retry or handcrafted snapshot. |
| Actual restore/re-export from published backup | B6 remote | Boundary check | NOT RUN | Required published origin/beads-backup absent after export failure. Local generated export/checkpoint does not prove restoration on another machine. |
| Real project bootstrap verification | B7 local | timeout20s bash .agents/project/verify.sh + git diff --check | PASS | exit0: reference structure PASS, project authority/source metadata PASS; script runs real structural/project Python checks. Explicit product typecheck/unit/build/browser and native activation NOT RUN lines. Trusted structural checker independently exit0. Earlier Developer negative invalid-blob/missing-authority fixtures are PM evidence, not new QA execution. |
| Source deterministic fixtures and timeout honesty | B7 reference | Bound evidence review, no rerun | PASS | PM source-fixture-results records14 completed driver groups plus14 remaining original commands exit0, installer26/bd-sync23 separately PASS. GNU awk finalizer55/55; original full driver180s TIMEOUT124 remains distinct. PASS here means accurate retained fixture evidence, not an independent full-driver PASS or native activation proof. |
| Actual Claude/Codex hook activation | B7 native | Hosted boundary assessment | NOT RUN | Hosted Work does not load project native CLI hooks. Static wiring/source fixtures do not prove runtime activation; operator has not accepted this risk. |
| Rollback journal preservation | B8 journal | Journal JSON/data hashes + ignore/tracking inspection | PASS | Complete journal68 entries bound to plan/source; all retained before-data hashes valid, including original .gitignore; created entries retain null-before information and install-state entry. Project authority/context not included in managed overwrite. Actual target rollback deliberately not executed; existing installer rollback fixtures reference only. |
| QA → scoped review → fresh checks → trusted finalize/operator merge | B8 lifecycle | Current gate disposition | NOT RUN | This QA completes one step. Scoped Code Review, refreshed landing checks, one trusted finalize and operator merge remain subsequent work; unresolved native/sync gates prevent complete acceptance. |

Available-check disposition: B1–B5 and B6 local/B7 local installed checks PASS. B6 remote export FAIL. B6 restore, B7 native, B8 lifecycle NOT RUN. B0 stays blocked and T1–T6 remain dependent. No failed gate was downgraded to advisory or accepted risk.

Not-tested surface: product implementation/physics/catalog semantics, browser/LAN/build/unit/runtime; actual Claude/Codex/Windows activation; authenticated real Beads export/restore/re-export; target rollback execution; complete single-driver source suite; scoped Code Review/finalize/operator merge. Prior trusted source semantics were not re-audited.

## Tested-Paths and Content-Fingerprint

Fingerprint algorithm: sorted target path + NUL + octal filesystem mode + NUL + candidate Git blob SHA1 + NUL + SHA256(file bytes) + newline for each table row, then append **exact bootstrap contract bytes** below, without wrapper/fence bytes. Hash excludes this report, local Dolt contents and remote metadata. Local Beads API results and GitHub metadata are execution evidence, not Git content fingerprint inputs.

Content-Fingerprint: `d5e3b93cb286631decc821b18b681e2b1bb8e6bea70f533c3f5799c898b58fdc`.

| Tested path | Mode | Candidate blob SHA1 | SHA256 bytes |
|---|---|---|---|
| `.agents/AGENT_ROLES.md` | 0644 | `f298f000c54826c67dfa6a35b088123dde58da2f` | `e606a4633a5e2c5ce34b20d9d09008b195f31097050918bf6ec60445ad238352` |
| `.agents/DEV_ROLE.md` | 0644 | `f0871e3011a589d8d5a378b8b26eb7b5bcba0eb7` | `b6cb405467d397c14b0b85bd359cc1f16071b4dd12977317510009429d6f07dd` |
| `.agents/HOW_TO_INSTALL.md` | 0644 | `63f7cbb61dd3ac17ce838355a8585bf5f62cb8a5` | `afcea9607ffede6222822ba66880c51254cdeca48a7c36edde39ee90153a1d5f` |
| `.agents/HOW_TO_USE.md` | 0644 | `ae1b8b97eb1af02239c6a4a936700b2782dc5e34` | `b6da5776a9afe07e869c2a682e0a7d94d4fd060cc6d2b0db8ace2be4f4290757` |
| `.agents/INSTALL.md` | 0644 | `a958e4950733e8fda8205601021d015a2e1c4246` | `cde321c1cfae3496a52d78406e510889f2d0c330133ba2334ae0b42025a64dce` |
| `.agents/PIPELINE.md` | 0644 | `9f90c7a61c5c3da80d624ffff13eb4380e83f7ac` | `1d723daa20a5798a1569e179c160fde667f788f5d2b0f47a3cff6e942453742b` |
| `.agents/PIPELINE_ADR.md` | 0644 | `473e7f77413284d00588ef9033b5d117e09ac661` | `a3f2ebba8971ba6425d038980e76aaffe57ffebe24f3b66dc10356354bc7dabe` |
| `.agents/PL_ROLE.md` | 0644 | `fc7cd89cdd8b394e7c7ffd57eb7b19cca1b6f8d0` | `d9f403b3060c0765f6d317c296bbe6eb5b587ea5ddb5ab0c60226371fa4aa75b` |
| `.agents/PM_ROLE.md` | 0644 | `9861c3e2254b4f16bda32a832e5950d01cee7ea3` | `36d37434c9544f053de5819ed0536089837407e3e7f730ac3a46c4e5bfe7410c` |
| `.agents/QA_ROLE.md` | 0644 | `13c9a16efaa0645de9a585cb7bc38fb98d82b5e4` | `ed21dc4f85a515c60ba8cc062d23b69d63519a9504b408c8dad0459fd1ea842c` |
| `.agents/REFERENCES.md` | 0644 | `d96e796263f0a7e559a82783dc1b689bfdeb869e` | `b29dd7b4bb94729733086454f97138f45fbc0452f0b030f5c25adc53a64bbeca` |
| `.agents/RV_ROLE.md` | 0644 | `6e13e1023c90621172135e206e01fed8bd6b8c28` | `361403255f04c6b7ded784d1a4437c513e5dc082b6f832844fc39644a4daeba1` |
| `.agents/SKILLS.md` | 0644 | `0f043332fca95cfa5693f652e07f73d8cf0da3f6` | `f792410c843dd103900329689912735460a6c185913f40dfe1fe97361d11bfda` |
| `.agents/SV_ROLE.md` | 0644 | `7c935ba4fcc6d85dbc174160f7e7440309469451` | `8dea453ec5985c8c65a67f2a74b6c78e70b70841f3f4a2fdad5a9e55528f59e8` |
| `.agents/distribution-manifest.json` | 0644 | `129ff7ed727f01fefe79ead510af24708549a196` | `5df1d66824ce16ff071302333beff05e65d0a5aacc532b2421313dcc11a2d97d` |
| `.agents/project/authority.md` | 0644 | `1b357c2822aa72d4c5d271288e40a6eea171e0dd` | `cf5dea103ce6d6d79f1c38a25640d41d2fdd87678cc5466e6461fb887c64cf35` |
| `.agents/project/check-bootstrap.py` | 0644 | `326418a76db6f8d3734d923a2d12c60e3690af27` | `623f3d9dd13049d6f7c334024af7ad13c7a40d2cca3f86fc58ef2f77c8479ecd` |
| `.agents/project/verify.sh` | 0755 | `24974dc44f597b5b95739a4de33ea2bf71f4b5f7` | `3c59b47fac24afa557fef4078e4e5f50523f5362d217cbd1bab94939ca7fc8b4` |
| `.agents/skills/canon-router/SKILL.md` | 0644 | `05fbd58029d2646ac66115a9c50c6ee215693943` | `ded820769c7d5ecea5032982246e3b75813b2a0f4e79ad4b654e22a0a6b893bf` |
| `.agents/skills/diagnose/SKILL.md` | 0644 | `b3a6e44f7a439796f12208e07f088650e4d29a1b` | `97e5033b3c8253c97b43b1c43244c18d8c7bab1b904a7e43367d3301d95673fa` |
| `.agents/skills/handoff/SKILL.md` | 0644 | `e23236c38c8a3fda4ac9eb6bc27b410a9230c887` | `bd5146c2b32b8634a9650d066883e0ef81ff81e22af8643b91222d884d55554f` |
| `.agents/skills/product-gap/SKILL.md` | 0644 | `8a5ec4acc384e33f4336b3a09baba5e718430a48` | `50387c083b72ee89a09768e806c0c2b9f0e33148fc0de316fd96465fffc112e9` |
| `.agents/skills/product-handoff/SKILL.md` | 0644 | `15d7d747243d443eaf53c4d41ab101571a7ad973` | `2b3ef08ecd31f87082955749efc22413c2c9f73d2b4ffe77bb6d559b1c794cc4` |
| `.agents/templates/AGENTS.template.md` | 0644 | `3ef67b163bd0d762159139772fcf02e52fdb2228` | `dbb7c6a896554e438274635601e2da0464ee816fbe14492e22b0b12dd819794f` |
| `.agents/templates/gitignore.fragment` | 0644 | `82d98e271f3c294f118fac24bb81c37b62f9dff2` | `5326c2e5579af8feea13cc603edbf8e09d7be872dff812cbc30d7b1bca25e8bc` |
| `.agents/templates/project-authority.md` | 0644 | `72c4008098f3a38d6eac4117b20b7a9d7a233c1a` | `b612be7583691c7daf6cc92f10e9469d4c8e556071b3d0c395f8bc44986125f5` |
| `.agents/templates/project-verify.sh` | 0755 | `1f237b9a45ed6830dcc22567f8dda856b4b4fcfc` | `c4c66cffa8de7578d8737c4026cc257f6a8540cc1fbc4e3ae0273587262d3f38` |
| `.beads/config.yaml` | 0600 | `d0f62613958316a9f7bf1da25908aa95d9e719f7` | `94b74f5927f4730f5e3924eba15622be616387810d5756eafacabdd4c5a1dd45` |
| `.claude/agents/developer.md` | 0644 | `e01309736c8b2fef74e5045b7b3beb58d5194c29` | `be3495d660244a6ffb75d225a2f5c40c04342f68b8fcf69410425913eb5be983` |
| `.claude/agents/planner.md` | 0644 | `b0b61733b99d6e3c1bc551696123c26f049f79ec` | `597ce57700d341564f8a860e9b49f0227b8f273f851f591588d5534b927a1108` |
| `.claude/agents/reviewer.md` | 0644 | `a2ccf4f4f6b0468a9e9e7c57e5b4ab95d482918a` | `04728a46b5928c5c845fdd94564c97dcd254ae209e9c833596a7f6d3b429ca5f` |
| `.claude/agents/tester.md` | 0644 | `795406b77b1d24d0ed97e9874e8250c89dce8c00` | `ec8bafff1518c0f01d180fcb2cf2185de9a0eb06740cd169c8ab58c9ef0f14ff` |
| `.claude/hooks/check-merge-ready.py` | 0644 | `029409814ec3eb20a13e2601f346379ae66950f3` | `5fcae317d1831f92ef3bdba48bd700ca8cc1c12cfc419dbada2e092c4dd8d8f9` |
| `.claude/hooks/check-repository-mutation.py` | 0644 | `4dbe85e877fd56c37cb9dd139ef287e32a1a409b` | `0bce1e3f250d968256b0f709c80e199441d98facc74cfe63c57fed5e86a7bd57` |
| `.claude/hooks/check-tests-before-commit.sh` | 0755 | `a94ac4dffe1b0db4e3e9b0710161317e917fb90c` | `df55d239d92afe2d9f1a7ce9033f36ba2316f1d82aa146c5dd856d7b5a7bdf4d` |
| `.claude/hooks/commit_command_classifier.py` | 0644 | `950ddf225277afe02567ba5bfe663af326c36e98` | `7fbd8224d6e01e2b9d44d4e2b4149bca97b508927d9e2b005a1cefa7f55b2e64` |
| `.claude/hooks/pre-bash.sh` | 0755 | `3185f50675665d4fa90615954d2ba33cf8a317ae` | `ee62ec23aab0328f8cb3aff9b5bdf32222abf00d4a3968f1136d78aa9e8c3a04` |
| `.claude/hooks/readiness_policy.py` | 0644 | `9d698d280d8a0cbec980bb10f6fea06f781be59b` | `e87001607a47cb1dc311be5fb6b2029a04ac9ea4693dc8aebfa5749c9c43f34b` |
| `.claude/hooks/shell_comment_parser.py` | 0644 | `4af8f3d64c2882afe917dfc77e16469644babb61` | `70ce684867ecb33fd5e7ec73e04ff5e7eba19ae8f3167abd6be5d824a6d59e95` |
| `.claude/hooks/shell_grammar.py` | 0644 | `537a687622fd0bfa431c449fe9e095fa3f2daca6` | `f90151ec57fc0628e6bd84c66a1136ecf0fade5c36e87b2cb425ef3b99f32a57` |
| `.claude/rules/beads.md` | 0644 | `5fecd9695535bfd6e6e37ffda09b6a7953571087` | `6eb40d66779e6d06f65befc350d7280f812733a23c13ca1524d86ace3b3a5f28` |
| `.claude/rules/large-payloads.md` | 0644 | `e360b30598dea22d83ee52d62123505addb2d736` | `01a1a1b11b0a8de1ba83ad8269d21036606cdb1773795103ea06cbb9360f300f` |
| `.claude/rules/tests.md` | 0644 | `cfcb1befe97216f56cdcdf01861fe9152e1a082e` | `7097259cebddfb823915da111e758f24261a8ff33db958f96d35e4643d89eb5a` |
| `.claude/rules/universal.md` | 0644 | `08496a59193725f6469ec120dbbbb871802f8223` | `ed543e232e1ef55af4fa64c3665c306fe13e9854b3a88ee7c7ad2a3834e4affb` |
| `.claude/settings.json` | 0644 | `bf8f00d3f9e50490eb5bb64480f676fe36a75a43` | `1f518c77696c98922e7044e1857acf50a100d158fce61d2c68ac22f5aaa1f5fb` |
| `.claude/skills/architect/SKILL.md` | 0644 | `86576aba026e67059423f470cd4ad2c62a50ba54` | `e9e5bd93b917234e59f3d2cff5aadcfbaf2eb7efd7937c5e20581d53848c021f` |
| `.claude/skills/external-review/SKILL.md` | 0644 | `f58e3fefaad2cb845a6de338daacbebed2d23548` | `8a9af8d59881fd7fed91fbaeeee4b7e3b0d398d30ccbd30dcdc05d64d1de96b8` |
| `.claude/skills/finalize-pr/SKILL.md` | 0644 | `0212854b0220234db9bbe2e7df98c9302c596dad` | `ffa01b9cc9ea5f287c95d89a3d51835dd26c6c9fdf6cf01862bdf61a7a374162` |
| `.claude/skills/finalize-pr/validators/strip_code_spans.sh` | 0755 | `45b5ed30d097dfccc79f5d72c25b40afb6d542fc` | `52cf023ca81d294eab36f14042a687e2c58a5187abe55e7ca460f986c56cf6f3` |
| `.claude/skills/finalize-pr/validators/test_validate_review_pass.sh` | 0755 | `afdde01cce56ff4d654be5d22127a828470ae5cc` | `00b0902c4bf810012bafa66b51013932048aa6787434dcff960b5533cbb4dfd3` |
| `.claude/skills/pipeline-audit/SKILL.md` | 0644 | `9d09c12fad449be1602acd8b2a6e16c472bce675` | `8734e4e80937401ee66564c45ea33ac261250320e8e3de2475bbb2ebb1f08fa9` |
| `.claude/skills/project-manager/SKILL.md` | 0644 | `98320d15f9ef6bd394dfb3c829f3218f9a95b38a` | `fb77f26fada4b9e825154d929d86a30e5f0fbc9dac49b459907c5348aed4b7da` |
| `.claude/skills/sprint-pr-cycle/SKILL.md` | 0644 | `b9717ee6b044a5c398025c180239676710cc24d4` | `70a94c61bbeb4f260ed86c2824d1877caf5d90d357962cbda27d7fef0b3ea81a` |
| `.claude/skills/verify/SKILL.md` | 0644 | `9a9264200f2946c9884b9aeacf565789ea6754db` | `e7177e5f44ccf882b16b380825d65222585a7bd8187669574337a82f7925eba7` |
| `.claude/tools/publish-pr-comment.py` | 0644 | `e969d97fe6c80495466e7b19bea9859a84a9fe6c` | `a19b837c1fe07cf5d4432ad310c9bce6afec0933fb4d46f1ec609f040389f0bd` |
| `.claude/tools/run-python.sh` | 0755 | `cd6341fa8d73307d28408b84c001fc050e5660b1` | `6b174974380f2e3c76ea06cb3e89d1811aeddd3d5258db9c4343cd180217d1a8` |
| `.claude/tools/with-timeout.sh` | 0755 | `a04234d181dcb819076a22763249521ff805ccae` | `0b3ee3dab6b65e1bc5d7a5b854fa567b9d962c1d993f0ddfcce8e3f817c5d717` |
| `.codex/hooks.json` | 0644 | `7ab70059750d8cb1a7630e7136540421bc800831` | `050300922c0791e38f9dc5a509e0d370637cab6fd8dffb1ae60cb1bda9b89eb2` |
| `.gitignore` | 0644 | `592de0a773fe683d565f8460ec5bf37c794d6608` | `669a7fe132ddd39aa779576bafcd53fbacc68c95f58ca8d93746b41f707f3d70` |
| `.memory-bank/activeContext.md` | 0644 | `bc59d5d0d3b15d5b9a9b223a60f34335ee24b794` | `fa98db29213c754f4f38d0e10fe5291a9b1de4be0f298fad381f531815c6383c` |
| `.memory-bank/productContext.md` | 0644 | `8cc61112a6bf31fd18d5b94a5e3e53bc1fbb3861` | `5aaccf97f5c725e18ba306131d809c883663ba559950ebc3d85edd18dcb6825d` |
| `.memory-bank/progress.md` | 0644 | `65a8982fbc7ebad89f3356b690bece1f62d8a19a` | `03f0fdb90e17d716fd23e4058b2e0f2eb2041338f193c8ac3df84ae0973d2c94` |
| `.memory-bank/projectbrief.md` | 0644 | `17ca5a9203e9299f44f56ef1c69316cf1c3953b0` | `a168a21b7bd69bd526299bf80f56f97ffffb4eed753dc19a3efcd8611128e732` |
| `.memory-bank/systemPatterns.md` | 0644 | `7957bda9aecb5a93204087019b7311406f03e0c6` | `ef1ec7202c8f832e54eaf06d14a34d679de4c1b02a0366fbf8dade614527ace0` |
| `.memory-bank/techContext.md` | 0644 | `35078c3cd0983da3e9e45d46a23e5795365df8c3` | `69ff7e044b9765f15a8eea20bc212d7e4a6a0e88a40da6b05f8ada37cd8ed301` |
| `.overgate/install-state.json` | 0644 | `636146cc29af8b6f87cad1a64021ee42b85a73ab` | `ef8c1d5ee3290978c6894483f060a20554032f604fab26e9387930e4b783a4a5` |
| `AGENTS.md` | 0644 | `b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0` | `0a3bd0c5cbe22893f1d1655941aacd5044d819bf52a1b11919e3d489a350f63d` |
| `LICENSE` | 0644 | `eecac747717f530b74cea9a9d64e8d4ad724e426` | `a52aa2956376e177bd9bcb1bb1ebb5489a507a7cbed4b3ba94a11fa2ddf992e1` |
| `docs/INDEX.md` | 0644 | `957826bf936a8cd066e8cf6bf1245eca2431572b` | `bde60dd65e2eca31d30d1b3079b09880eb07fa7fde8d5f629998b1029dcea115` |
| `docs/architecture/source-authority.md` | 0644 | `e75be660520826e1cdc09d98d25af04089421be1` | `a0c860fc0c39a47d52b2b0d86145a0c0a65de24739be23a09c62081911d7f1dc` |
| `docs/architecture/u2-source-inventory.json` | 0644 | `4f9597b66d49fb05701a8e92f941ba1e6e4caa98` | `b38083261dba7881ca0e1e480ea06fd1b644fbd6e6f9107f3b4ae3119f24ccf3` |
| `docs/baselines/2026-10-01-delivery-first-provenance.json` | 0644 | `a2e2b15b53d382b5a23efd65f9327a432360a39b` | `a5cbd5279c2d0efda49c44caec3f77ed028c3b6287339d467e85cdadb3373742` |
| `docs/plans/2026-10-05-overgate-bootstrap.md` | 0644 | `7f2a1e0585f38a88b6b0e052db19bf7b93041e04` | `430335a70a7ff18872a6bd109e2aea9457c34c54318e10b763dc643ef2df232c` |
| `docs/reviews/2026-10-05-install-plan-review.md` | 0644 | `7104b8fb414e63ab9e448b4d21f00f32b613ec0e` | `4c483445dbe709f0964262bc18ff099a61bcc76ad83324e8a283e2661f69584a` |
| `docs/verification/bootstrap-contract.md` | 0644 | `a825a618d80c35728626de6f8eaec896b468a269` | `58edef817e726bd16dcdb41525e2470771f8142c84ab1f23988c92665bceb39a` |
| `docs/verification/bootstrap-evidence.md` | 0644 | `4d21b1209b61e674ee3571efa458af88e323b0c2` | `c7125452863d00d3fba4d6cca9adbacb62c96bd44fa5d8bd1ba6c8c1ae430b5b` |
| `docs/verification/overgate-install-plan.json` | 0644 | `64165e4b81153798a328b974ed0d095111c8bba5` | `2502f1f7158c217e0fdc645b86565433e5c44ac70833441ffeb8a360b02791bf` |
| `docs/verification/source-fixture-results.json` | 0644 | `beb339f780847b8470ee9e75ae9ca591eddf71d7` | `d2bb2c45171c4da0e103b3df63dbe27a3b70853090f5624b41f0c0be77e4b26d` |
| `scripts/bd-read.sh` | 0755 | `c331e6430ec0938ecead7f3aa02f0703107d844a` | `6ed0541f73eeac97ea352292875a8e76f7c869bc2238dd9ee9848314c76794f4` |
| `scripts/bd-sync-common.sh` | 0755 | `9ea9ded9eeb810cc3ce2cee035f997059857d970` | `a51de9460ccf17094af73fd502cd8c0caf918d929a9ca1f3bb563f97ce0e56a0` |
| `scripts/bd-sync-export.sh` | 0755 | `0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85` | `4ae5fc0aa6e4cf89ac5a36976de06ef2ca1d39b275a194fd0521475bdfd25d10` |
| `scripts/bd-sync-restore.sh` | 0755 | `d088d5e8566ee1e5c6f963466e956e0eef3a6f4e` | `afecc624ba65eed44b21238bb97ec76e72399a33e7d9b1ced2dd338ef3e696cf` |
| `scripts/bd-wt.sh` | 0755 | `19ea1442df96e62e706e8b9cb963ba6452f3b9d8` | `c6daf6128190fa2030986d52d7d5fc3694646851a827f550818c14777f9a46bf` |
| `scripts/check-reference.py` | 0644 | `1af2da08c18db557672c5690cc00a191530613d6` | `20bb5a117df0c8b374502e8e8a5fb336dbf9738c4113a4d078f4b13b8d49c3e1` |
| `scripts/install-overgate.py` | 0755 | `040a85eab1c0211f273a08c0a4bbf0012d2f3612` | `c94d94b6e365329c3513bf28460bbbfd93abd2066548210a125c63846219e77c` |
| `scripts/lib/bd-env.sh` | 0755 | `11bc2539b7661f4a5a65fb98ec86432990323c6c` | `8ff375c86b9cc81c4e1d9976961199f46c3a021bcae06f76214a1863c76eda7c` |
| `scripts/lib/bd-read-engine.mjs` | 0644 | `fcd7ac786227bb8779e341b5db0eed58e99cb7b4` | `df581a2d632230de1f78015c03f840cd07296218840207d9ec76525a3289498b` |

## Relevant exact contract bytes

Entire bootstrap contract is relevant to B1–B8. UTF-8 bytes below are copied unchanged including final newline; original contract SHA256 is `58edef817e726bd16dcdb41525e2470771f8142c84ab1f23988c92665bceb39a`.

```text
# Verification Contract — OverGate bootstrap

Mode: CRITICAL. Named risk: установка governance/runtime guards в новый проект;
ложный PASS hooks/Beads, повреждение authority или self-certification установщика.
Budget: 6 independent verifier launches. Первый install review ещё не запущен.
Trusted source: komleff/overgate v4.0.0-rc.1,
`633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
Trusted instructions: frozen `.agents/INSTALL.md`, PM/RV roles, ADR §§3.28–3.32.
Project authority: AGENTS.md / оператор. Product runtime OUT OF SCOPE.

| AC | Expected / error / edge | Verification |
|---|---|---|
| B1 | Реальный public komleff/u2-lab, рабочая ветка и один target Draft PR с plan/contract до managed copy | GitHub metadata + draft/base/head + tracked plan |
| B2 | Clean Git source, exact RC SHA, explicit inventory. Installer plan не меняет target; missing entry/source drift/conflict блокирует запись | Trusted installer plan, source status/SHA, before/after hashes, reference evidence |
| B3 | Install inventory опубликован с SHA256; independent PLAN_READY привязан к exact bytes и evidence того же фактического PR | PM validates report origin/paths/fingerprint; approval JSON; no fabricated URL/self-approval |
| B4 | Apply переносит managed .agents/skills/adapters/closure строго inventory; AGENTS/project overrides/context сохраняются, project verify заполнен. Backups ignored, state tracked | Installer apply + check-reference.py + manifest path/hash review + git status |
| B5 | Fresh Memory Bank описывает U2 Lab, не OverGate reference history. Six delivery role owners и PM role доступны, product authority остаётся оператором | Current context/role route smoke, exact managed role hashes |
| B6 | Local bd 1.0.2 функционален в primary checkout, fresh prefix ulab; task graph имеет dependencies/AC. export.auto=false, no Dolt remote; cross-machine source origin/beads-backup, generated only by helper | bd ready/show/export; export/restore/re-export helper smoke after remote; no handwritten snapshot |
| B7 | .agents/project/verify.sh выполняет реальные checks этапа, не unconfigured template. Source/reference deterministic tests PASS; runtime hooks smoke имеет честный PASS/FAIL/NOT RUN | structural/reference + bash project verify + live adapter evidence on actual runtime |
| B8 | QA → scoped review → current checks → one trusted finalize; rollback journal сохраняет managed originals и project state | QA/review reports + fingerprints/current SHA; install rollback fixtures; operator merge |

## Declared execution boundary

Этот hosted Work runtime не предоставляет загрузку project hooks как Claude/Codex CLI.
Static wiring/guard fixtures не доказывают actual activation. До фактического smoke native
adapter: NOT RUN, без заявления activation PASS. PM не оформляет known risk как принятый;
если это препятствует final acceptance, оператор решает по фактическому evidence.

Отсутствие repository/PR access сейчас — blocker B1/B3, не accepted risk и не повод
подставлять URLs. Beads local preparation не является cross-machine synchronization PASS.

## Scoped Code Review

IN: install state/inventory/hashes, preserved project authority/context/verification,
Beads config/task graph, B1–B8, actual hooks integration evidence, rollback/publication paths.
OUT: redesign OverGate policy, lab runtime/physics, unrelated U2 documents/catalog, extra reviewer swarm.
Report fields/triage/fingerprint follow trusted RV_ROLE and ADR 3.28/3.29.
Installer governance не сертифицируется новой installed версией; QA/review/finalize используют
prior trusted frozen source и bound plan/contract.
```
