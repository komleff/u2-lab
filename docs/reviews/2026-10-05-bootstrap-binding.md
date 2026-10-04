# QA EXECUTION — affected bootstrap metadata binding

Role: independent QA / `/root/bootstrap_qa`, same verifier session and CRITICAL launch2/6.
Model: requested `gpt-6.1-sol`; actual provider/model identifier unavailable.
Candidate: `186906af1b18c00282686ceb165de269c815d3a7`.
Prior QA candidate: `38ec6c7e9985257ff6494e1734372b0561daa0e6`.
Source contract: `docs/verification/bootstrap-contract.md`, B1–B8; exact contract bytes unchanged.

Result: **PASS for affected metadata portability/landing checks; overall bootstrap acceptance remains FAIL.** This is a same-session scoped recheck, not a new QA launch, broad acceptance, source audit or risk acceptance.

| Test case | AC | Method | Result | Evidence |
|---|---|---|---|---|
| Changed owner metadata retains U2 authority and truthful gates | B4/B5/B7/B8 | Manual four-file diff against prior QA candidate | PASS | activeContext/progress remain U2-owned; completed verification/QA/review recorded without changing WHAT. INDEX adds actual report routes. PM evidence preserves actual Beads auth FAIL, native/restore/finalize NOT RUN and180s driver TIMEOUT124. |
| Original87-path tested package portability | B2–B5/B7/B8 | Compare Git tree entries (blob and mode) at both candidates | PASS | Exactly4 paths changed: .memory-bank/activeContext.md, .memory-bank/progress.md, docs/INDEX.md, docs/verification/bootstrap-evidence.md. Other83 tested paths have identical blobs/modes, including authority, managed distribution, install state/inventory, trusted source owners, verification code and contract. No blanket fingerprint equivalence is claimed. |
| Current actual project command | B7 | timeout20s bash .agents/project/verify.sh | PASS | exit0; reference structure PASS, bootstrap project authority/source metadata PASS; explicit product typecheck/unit/build/browser and native activation NOT RUN. |
| Current whitespace check | B7/B8 | git diff --check | PASS | exit0. Candidate worktree was clean before report replacement. |
| Preserved original independent QA report | B8 | SHA256 exact bytes | PASS | Original report unchanged: fdf6fccbc9c2debea05cc1e67d6326b218e92534d402422c57cda2dbb20266f0. Its documented custom NUL/mode/blob/SHA256 fingerprint remains auxiliary factual evidence, not the ADR canonical primitive. |
| Generated local checkpoint status | B6 | Read-only9-record checkpoint inspection | PASS | B0 ulab-9aa.1 blocked, planning .8 closed, epic/T1–T6 open. Local generated checkpoint remains preparation evidence, not origin/beads-backup authority or cross-machine sync. |
| Actual remote Beads export | B6 | Retain original execution disposition; no network/retry | FAIL | Unauthenticated Git CLI push remains unresolved; no new sync proof. |
| Native hooks, restore/re-export and finalize/operator merge | B6/B7/B8 | Retain declared execution boundary | NOT RUN | No actual native activation, authenticated remote restore/re-export, trusted finalize or operator merge performed. Product runtime remains OUT OF SCOPE/NOT RUN. |

Complete metadata diff also adds original QA/Code Review reports and the pending binding placeholder, and updates the bd-generated checkpoint. These are report/status artifacts; only the four changed owners above belong to the original87 tested paths. Their truthful gates were inspected. No Beads or other-file mutation, network call, source-suite rerun or subagent launch occurred in this recheck.

Available checks from original QA remain PASS; B6 export FAIL prevents complete bootstrap acceptance. Native/restore/finalize remain NOT RUN. B0 stays blocked and dependent product tasks remain open. Static wiring and local exports are not activation/synchronization PASS. Original full source driver remains TIMEOUT124, with separate retained group evidence; this recheck did not rerun it.

## Canonical content binding

ADR primitive: SHA256 of concatenation, in sorted UTF-8 path order, of `path SP candidate_git_blob_sha1 LF` for the original87 tested paths, then exact bootstrap Verification Contract bytes. This report excludes itself and both added report artifacts; a later commit changing only this report retains the canonical package binding. This does not authorize changing any bound owner without a new comparison.

Old canonical: `dd00f20d6fd989d1675d2be42f4bce958213f82f937468520d904113419bcc36`.
Current Content-Fingerprint: `9644b65514fde322ba69a3d9564183fa4b87a9570250efffae1adaa3840be6c1`.
Original custom auxiliary fingerprint: `d5e3b93cb286631decc821b18b681e2b1bb8e6bea70f533c3f5799c898b58fdc`.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/AGENT_ROLES.md` | `f298f000c54826c67dfa6a35b088123dde58da2f` |
| `.agents/DEV_ROLE.md` | `f0871e3011a589d8d5a378b8b26eb7b5bcba0eb7` |
| `.agents/HOW_TO_INSTALL.md` | `63f7cbb61dd3ac17ce838355a8585bf5f62cb8a5` |
| `.agents/HOW_TO_USE.md` | `ae1b8b97eb1af02239c6a4a936700b2782dc5e34` |
| `.agents/INSTALL.md` | `a958e4950733e8fda8205601021d015a2e1c4246` |
| `.agents/PIPELINE.md` | `9f90c7a61c5c3da80d624ffff13eb4380e83f7ac` |
| `.agents/PIPELINE_ADR.md` | `473e7f77413284d00588ef9033b5d117e09ac661` |
| `.agents/PL_ROLE.md` | `fc7cd89cdd8b394e7c7ffd57eb7b19cca1b6f8d0` |
| `.agents/PM_ROLE.md` | `9861c3e2254b4f16bda32a832e5950d01cee7ea3` |
| `.agents/QA_ROLE.md` | `13c9a16efaa0645de9a585cb7bc38fb98d82b5e4` |
| `.agents/REFERENCES.md` | `d96e796263f0a7e559a82783dc1b689bfdeb869e` |
| `.agents/RV_ROLE.md` | `6e13e1023c90621172135e206e01fed8bd6b8c28` |
| `.agents/SKILLS.md` | `0f043332fca95cfa5693f652e07f73d8cf0da3f6` |
| `.agents/SV_ROLE.md` | `7c935ba4fcc6d85dbc174160f7e7440309469451` |
| `.agents/distribution-manifest.json` | `129ff7ed727f01fefe79ead510af24708549a196` |
| `.agents/project/authority.md` | `1b357c2822aa72d4c5d271288e40a6eea171e0dd` |
| `.agents/project/check-bootstrap.py` | `326418a76db6f8d3734d923a2d12c60e3690af27` |
| `.agents/project/verify.sh` | `24974dc44f597b5b95739a4de33ea2bf71f4b5f7` |
| `.agents/skills/canon-router/SKILL.md` | `05fbd58029d2646ac66115a9c50c6ee215693943` |
| `.agents/skills/diagnose/SKILL.md` | `b3a6e44f7a439796f12208e07f088650e4d29a1b` |
| `.agents/skills/handoff/SKILL.md` | `e23236c38c8a3fda4ac9eb6bc27b410a9230c887` |
| `.agents/skills/product-gap/SKILL.md` | `8a5ec4acc384e33f4336b3a09baba5e718430a48` |
| `.agents/skills/product-handoff/SKILL.md` | `15d7d747243d443eaf53c4d41ab101571a7ad973` |
| `.agents/templates/AGENTS.template.md` | `3ef67b163bd0d762159139772fcf02e52fdb2228` |
| `.agents/templates/gitignore.fragment` | `82d98e271f3c294f118fac24bb81c37b62f9dff2` |
| `.agents/templates/project-authority.md` | `72c4008098f3a38d6eac4117b20b7a9d7a233c1a` |
| `.agents/templates/project-verify.sh` | `1f237b9a45ed6830dcc22567f8dda856b4b4fcfc` |
| `.beads/config.yaml` | `d0f62613958316a9f7bf1da25908aa95d9e719f7` |
| `.claude/agents/developer.md` | `e01309736c8b2fef74e5045b7b3beb58d5194c29` |
| `.claude/agents/planner.md` | `b0b61733b99d6e3c1bc551696123c26f049f79ec` |
| `.claude/agents/reviewer.md` | `a2ccf4f4f6b0468a9e9e7c57e5b4ab95d482918a` |
| `.claude/agents/tester.md` | `795406b77b1d24d0ed97e9874e8250c89dce8c00` |
| `.claude/hooks/check-merge-ready.py` | `029409814ec3eb20a13e2601f346379ae66950f3` |
| `.claude/hooks/check-repository-mutation.py` | `4dbe85e877fd56c37cb9dd139ef287e32a1a409b` |
| `.claude/hooks/check-tests-before-commit.sh` | `a94ac4dffe1b0db4e3e9b0710161317e917fb90c` |
| `.claude/hooks/commit_command_classifier.py` | `950ddf225277afe02567ba5bfe663af326c36e98` |
| `.claude/hooks/pre-bash.sh` | `3185f50675665d4fa90615954d2ba33cf8a317ae` |
| `.claude/hooks/readiness_policy.py` | `9d698d280d8a0cbec980bb10f6fea06f781be59b` |
| `.claude/hooks/shell_comment_parser.py` | `4af8f3d64c2882afe917dfc77e16469644babb61` |
| `.claude/hooks/shell_grammar.py` | `537a687622fd0bfa431c449fe9e095fa3f2daca6` |
| `.claude/rules/beads.md` | `5fecd9695535bfd6e6e37ffda09b6a7953571087` |
| `.claude/rules/large-payloads.md` | `e360b30598dea22d83ee52d62123505addb2d736` |
| `.claude/rules/tests.md` | `cfcb1befe97216f56cdcdf01861fe9152e1a082e` |
| `.claude/rules/universal.md` | `08496a59193725f6469ec120dbbbb871802f8223` |
| `.claude/settings.json` | `bf8f00d3f9e50490eb5bb64480f676fe36a75a43` |
| `.claude/skills/architect/SKILL.md` | `86576aba026e67059423f470cd4ad2c62a50ba54` |
| `.claude/skills/external-review/SKILL.md` | `f58e3fefaad2cb845a6de338daacbebed2d23548` |
| `.claude/skills/finalize-pr/SKILL.md` | `0212854b0220234db9bbe2e7df98c9302c596dad` |
| `.claude/skills/finalize-pr/validators/strip_code_spans.sh` | `45b5ed30d097dfccc79f5d72c25b40afb6d542fc` |
| `.claude/skills/finalize-pr/validators/test_validate_review_pass.sh` | `afdde01cce56ff4d654be5d22127a828470ae5cc` |
| `.claude/skills/pipeline-audit/SKILL.md` | `9d09c12fad449be1602acd8b2a6e16c472bce675` |
| `.claude/skills/project-manager/SKILL.md` | `98320d15f9ef6bd394dfb3c829f3218f9a95b38a` |
| `.claude/skills/sprint-pr-cycle/SKILL.md` | `b9717ee6b044a5c398025c180239676710cc24d4` |
| `.claude/skills/verify/SKILL.md` | `9a9264200f2946c9884b9aeacf565789ea6754db` |
| `.claude/tools/publish-pr-comment.py` | `e969d97fe6c80495466e7b19bea9859a84a9fe6c` |
| `.claude/tools/run-python.sh` | `cd6341fa8d73307d28408b84c001fc050e5660b1` |
| `.claude/tools/with-timeout.sh` | `a04234d181dcb819076a22763249521ff805ccae` |
| `.codex/hooks.json` | `7ab70059750d8cb1a7630e7136540421bc800831` |
| `.gitignore` | `592de0a773fe683d565f8460ec5bf37c794d6608` |
| `.memory-bank/activeContext.md` | `d2a2ce8d1d9ea8d397e8790cfcc331c244282e97` |
| `.memory-bank/productContext.md` | `8cc61112a6bf31fd18d5b94a5e3e53bc1fbb3861` |
| `.memory-bank/progress.md` | `894c1c10dfe3659aa3f7879951a6c0e8a08fb87e` |
| `.memory-bank/projectbrief.md` | `17ca5a9203e9299f44f56ef1c69316cf1c3953b0` |
| `.memory-bank/systemPatterns.md` | `7957bda9aecb5a93204087019b7311406f03e0c6` |
| `.memory-bank/techContext.md` | `35078c3cd0983da3e9e45d46a23e5795365df8c3` |
| `.overgate/install-state.json` | `636146cc29af8b6f87cad1a64021ee42b85a73ab` |
| `AGENTS.md` | `b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0` |
| `LICENSE` | `eecac747717f530b74cea9a9d64e8d4ad724e426` |
| `docs/INDEX.md` | `a577f15e5dac6804a41f5db07f33a27b84db1204` |
| `docs/architecture/source-authority.md` | `e75be660520826e1cdc09d98d25af04089421be1` |
| `docs/architecture/u2-source-inventory.json` | `4f9597b66d49fb05701a8e92f941ba1e6e4caa98` |
| `docs/baselines/2026-10-01-delivery-first-provenance.json` | `a2e2b15b53d382b5a23efd65f9327a432360a39b` |
| `docs/plans/2026-10-05-overgate-bootstrap.md` | `7f2a1e0585f38a88b6b0e052db19bf7b93041e04` |
| `docs/reviews/2026-10-05-install-plan-review.md` | `7104b8fb414e63ab9e448b4d21f00f32b613ec0e` |
| `docs/verification/bootstrap-contract.md` | `a825a618d80c35728626de6f8eaec896b468a269` |
| `docs/verification/bootstrap-evidence.md` | `f0143176ec38dad3bb34ef4306ede599596d98a3` |
| `docs/verification/overgate-install-plan.json` | `64165e4b81153798a328b974ed0d095111c8bba5` |
| `docs/verification/source-fixture-results.json` | `beb339f780847b8470ee9e75ae9ca591eddf71d7` |
| `scripts/bd-read.sh` | `c331e6430ec0938ecead7f3aa02f0703107d844a` |
| `scripts/bd-sync-common.sh` | `9ea9ded9eeb810cc3ce2cee035f997059857d970` |
| `scripts/bd-sync-export.sh` | `0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85` |
| `scripts/bd-sync-restore.sh` | `d088d5e8566ee1e5c6f963466e956e0eef3a6f4e` |
| `scripts/bd-wt.sh` | `19ea1442df96e62e706e8b9cb963ba6452f3b9d8` |
| `scripts/check-reference.py` | `1af2da08c18db557672c5690cc00a191530613d6` |
| `scripts/install-overgate.py` | `040a85eab1c0211f273a08c0a4bbf0012d2f3612` |
| `scripts/lib/bd-env.sh` | `11bc2539b7661f4a5a65fb98ec86432990323c6c` |
| `scripts/lib/bd-read-engine.mjs` | `fcd7ac786227bb8779e341b5db0eed58e99cb7b4` |

## Relevant exact Verification Contract bytes

The entire bootstrap contract applies. SHA256: `58edef817e726bd16dcdb41525e2470771f8142c84ab1f23988c92665bceb39a`.
Fingerprint includes exact UTF-8 text below and its final newline; fences are excluded.

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
