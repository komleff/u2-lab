# CODE REVIEW — installed OverGate bootstrap

Verdict: **CHANGES_REQUESTED**. Active BLOCKER: **1**, actual B6 synchronization acceptance.
Code quality/spec compliance of the project-owned verification change: **PASS** within scope;
no implementation defect requiring a source-code fix was found. Complete B1–B8 acceptance is
**FAIL/open**, not merge-ready. Code Review does not replace QA or accept risks for the operator.

- Mode: CODE_REVIEW; Role: independent Reviewer, reused existing Reviewer session.
- Model: actual provider/model identifier unavailable; no assumed model name.
- Candidate Commit: `38ec6c7e9985257ff6494e1734372b0561daa0e6`.
- Observed current HEAD: `4ac2bdf91db86b6f1491f009ece69395b773f653`; only the unchanged QA report
  was added after candidate. All 92 reviewed package paths remain byte-identical to candidate.
- PR: https://github.com/komleff/u2-lab/pull/1, established actual Draft PR.
- Trusted prior source: clean `633937250fa8f47b49f928c1d8781ab17fe8c8e3`, OverGate v4.0.0-rc.1.
- Review Contract: `docs/verification/bootstrap-contract.md` Scoped Code Review, B1–B8;
  SHA256 `58edef817e726bd16dcdb41525e2470771f8142c84ab1f23988c92665bceb39a`.
- QA evidence read first: `docs/reviews/2026-10-05-bootstrap-qa.md`;
  exact SHA256 `fdf6fccbc9c2debea05cc1e67d6326b218e92534d402422c57cda2dbb20266f0`.
- Content-Fingerprint: `62ee1444cc258e7f4975016143d292d1947a0c7a63c72eb80f4536c19e92fb3d`.
- Budget: CRITICAL unique independent verifier sessions remain 2/6 (Reviewer + QA), per PM;
  PRODUCT remains 1/5. No additional agent or review swarm launched.

## Scope and findings

Goal: verify installed/preserved approved distribution and filled project verification without
self-certifying new governance. IN: inventory/state/source hashes/modes, project authority/context,
verification code quality/spec compliance, Beads/gate evidence and B1–B8. OUT: redesign or semantic
re-audit of released generic policy, product runtime/physics/catalog semantics, unrelated U2 search.

| # | Severity | Finding | File:line | Status | Beads ID / Rationale |
|---|---|---|---|---|---|
| 1 | IMPORTANT | [BLOCKER] Actual origin/beads-backup export failed; required restore/re-export is not verified | docs/verification/bootstrap-contract.md:18; docs/verification/bootstrap-evidence.md:25–26,75–81; docs/reviews/2026-10-05-bootstrap-qa.md:23–24 | fix now | Existing B0 ulab-9aa.1 remains blocked; B6 is IN scope and unmet |
| 2 | MINOR | [ADVISORY] Original QA digest is an auxiliary custom format, not the ADR canonical fingerprint | docs/reviews/2026-10-05-bootstrap-qa.md:37–39 | reject with rationale | Do not rewrite original QA facts or demand a code fix; PM already scheduled same-session canonical affected-binding metadata after landing bookkeeping |

Finding 1 is an acceptance failure caused by actual Git authentication limits, not evidence of a
bug in the released helper. The helper attempted export and Git push failed with unavailable
Username/terminal prompts disabled; no origin/beads-backup snapshot was published. Local nine-issue
API/export success and fixture-remotes PASS do not demonstrate cross-machine recovery. Minimal
resolution: when authorized authenticated Git transport is available, run the existing export
helper, then restore/re-export in a separate primary clone, preserving last-seen/drop protections,
and publish affected B6 QA evidence. No force overwrite, handwritten snapshot or fabricated sync
PASS. Alternatively only actual product authority can change acceptance/accept a bound risk;
this report does not request or invent such a decision. Until resolution B0/T1 dependencies
remain blocked. No unrelated runtime implementation or broad source changes are required.

Advisory 2 is scoped metadata portability: retain the custom digest as auxiliary evidence and
add the existing ADR canonical binding at the final metadata snapshot. Original test results
remain unchanged. Changed report/index/context paths need affected metadata recheck; unchanged
released/runtime content does not need another full audit or source-suite rerun.

## Independent code and preservation assessment

Read the task-6 Developer brief/report and explicit project review diff. The project-owned
`verify.sh:2–10` normalizes cwd, uses `set -euo pipefail`, executes actual structure/project checks,
and labels product/native checks NOT RUN separately. The final PASS describes only the two
bootstrap checks; it does not claim native activation, Beads sync or complete bootstrap acceptance.

`check-bootstrap.py:24–36` rejects missing/unsafe/empty/unreadable owners; `:45–70` checks the
explicit project authority/routes/context; `:71–109` validates pinned repository/commit, safe
unique owner paths, blob format, versions/status and owner-set agreement. Invalid input results
in nonzero exit. Its output correctly describes metadata/authority validation, not proof that
private U2 contents or gameplay numbers have been independently fetched. No dependencies,
network mutation, tracker mutation or product physics copy were introduced.

Local independent hash/mode inspection reconfirmed all 67 state entries match approved plan
operations. 66 current targets match the exact approved after bytes/modes; the sole intentional
exception is the filled project-owned verify.sh, required by B4/B7 and preserve policy. Every
source-backed target matches frozen Git bytes; settings/ignore targets match approved embedded
bytes. Exact inventory plan SHA256 remains `2502f1f7158c217e0fdc645b86565433e5c44ac70833441ffeb8a360b02791bf`.
The approval names actual same-PR comment `5983829289`. AGENTS.md remains byte-identical to preapply
64d03c7; authority/context are U2 Lab-owned, not substituted with source project history.

The complete rollback journal contains 68 entries and valid retained original-byte hashes.
The filled verification script deliberately differs from historical installed-template state;
drift refusal protects it from blind rollback, consistent with the existing address-specific
rollback/revert plan. No actual target rollback was performed by this Reviewer.

This is independent content comparison against prior trusted source, not an approval obtained
from newly installed policy. Released generic runtime logic was not re-audited.

## Evidence reused and open boundaries

QA independently reports installed distribution/structure, project command and local Beads API
checks PASS. Developer bounded negative fixtures for invalid owner blob and missing authority
are retained Developer evidence; they were not relabelled as new QA/Reviewer execution. This
Reviewer performed bounded read/hash/mode/journal checks, not broad test reruns or sync retries.

Source evidence has 28 bounded original fixture-group PASS results, plus earlier installer26/
bd-sync23 fixture results. The 180 s driver remains TIMEOUT124, not a single-driver PASS.
Source-frozen fixture evidence and QA's available-check results are reused with those limits.

Actual native Claude/Codex activation remains NOT RUN under the existing declared hosted
execution boundary (contract:24–27). Static activation fixtures are not native activation proof;
no operator ACCEPTED_RISK exists or is created here. Actual remote Beads restore/re-export,
trusted finalize/operator merge, actual target rollback and product runtime/browser/LAN testing
remain NOT RUN. These statements are not downgraded to PASS or used to claim merge readiness.

## Reviewed-Paths / canonical binding

Below is the explicit 92-path package at candidate. Released paths received byte/mode binding
review; project-owned verification code received semantic code review. Product documents are
bound only as unchanged pointer/metadata inputs to the project checker, not newly reviewed
product behavior. QA is bound separately by its exact report SHA256 above because it was added
after candidate; this Code Review report is excluded from its own package.

Fingerprint input: sorted UTF-8 `path SP gitblob LF` rows below, followed by exact LF-normalized
bootstrap-contract bytes (4140 bytes), without marker or fence lines. It is the ADR primitive,
not the QA auxiliary NUL/mode/SHA256 algorithm. This is scoped binding, not full-PR/final readiness.

```text
.agents/AGENT_ROLES.md f298f000c54826c67dfa6a35b088123dde58da2f
.agents/DEV_ROLE.md f0871e3011a589d8d5a378b8b26eb7b5bcba0eb7
.agents/HOW_TO_INSTALL.md 63f7cbb61dd3ac17ce838355a8585bf5f62cb8a5
.agents/HOW_TO_USE.md ae1b8b97eb1af02239c6a4a936700b2782dc5e34
.agents/INSTALL.md a958e4950733e8fda8205601021d015a2e1c4246
.agents/PIPELINE.md 9f90c7a61c5c3da80d624ffff13eb4380e83f7ac
.agents/PIPELINE_ADR.md 473e7f77413284d00588ef9033b5d117e09ac661
.agents/PL_ROLE.md fc7cd89cdd8b394e7c7ffd57eb7b19cca1b6f8d0
.agents/PM_ROLE.md 9861c3e2254b4f16bda32a832e5950d01cee7ea3
.agents/QA_ROLE.md 13c9a16efaa0645de9a585cb7bc38fb98d82b5e4
.agents/REFERENCES.md d96e796263f0a7e559a82783dc1b689bfdeb869e
.agents/RV_ROLE.md 6e13e1023c90621172135e206e01fed8bd6b8c28
.agents/SKILLS.md 0f043332fca95cfa5693f652e07f73d8cf0da3f6
.agents/SV_ROLE.md 7c935ba4fcc6d85dbc174160f7e7440309469451
.agents/distribution-manifest.json 129ff7ed727f01fefe79ead510af24708549a196
.agents/project/authority.md 1b357c2822aa72d4c5d271288e40a6eea171e0dd
.agents/project/check-bootstrap.py 326418a76db6f8d3734d923a2d12c60e3690af27
.agents/project/verify.sh 24974dc44f597b5b95739a4de33ea2bf71f4b5f7
.agents/skills/canon-router/SKILL.md 05fbd58029d2646ac66115a9c50c6ee215693943
.agents/skills/diagnose/SKILL.md b3a6e44f7a439796f12208e07f088650e4d29a1b
.agents/skills/handoff/SKILL.md e23236c38c8a3fda4ac9eb6bc27b410a9230c887
.agents/skills/product-gap/SKILL.md 8a5ec4acc384e33f4336b3a09baba5e718430a48
.agents/skills/product-handoff/SKILL.md 15d7d747243d443eaf53c4d41ab101571a7ad973
.agents/templates/AGENTS.template.md 3ef67b163bd0d762159139772fcf02e52fdb2228
.agents/templates/gitignore.fragment 82d98e271f3c294f118fac24bb81c37b62f9dff2
.agents/templates/project-authority.md 72c4008098f3a38d6eac4117b20b7a9d7a233c1a
.agents/templates/project-verify.sh 1f237b9a45ed6830dcc22567f8dda856b4b4fcfc
.beads/config.yaml d0f62613958316a9f7bf1da25908aa95d9e719f7
.claude/agents/developer.md e01309736c8b2fef74e5045b7b3beb58d5194c29
.claude/agents/planner.md b0b61733b99d6e3c1bc551696123c26f049f79ec
.claude/agents/reviewer.md a2ccf4f4f6b0468a9e9e7c57e5b4ab95d482918a
.claude/agents/tester.md 795406b77b1d24d0ed97e9874e8250c89dce8c00
.claude/hooks/check-merge-ready.py 029409814ec3eb20a13e2601f346379ae66950f3
.claude/hooks/check-repository-mutation.py 4dbe85e877fd56c37cb9dd139ef287e32a1a409b
.claude/hooks/check-tests-before-commit.sh a94ac4dffe1b0db4e3e9b0710161317e917fb90c
.claude/hooks/commit_command_classifier.py 950ddf225277afe02567ba5bfe663af326c36e98
.claude/hooks/pre-bash.sh 3185f50675665d4fa90615954d2ba33cf8a317ae
.claude/hooks/readiness_policy.py 9d698d280d8a0cbec980bb10f6fea06f781be59b
.claude/hooks/shell_comment_parser.py 4af8f3d64c2882afe917dfc77e16469644babb61
.claude/hooks/shell_grammar.py 537a687622fd0bfa431c449fe9e095fa3f2daca6
.claude/rules/beads.md 5fecd9695535bfd6e6e37ffda09b6a7953571087
.claude/rules/large-payloads.md e360b30598dea22d83ee52d62123505addb2d736
.claude/rules/tests.md cfcb1befe97216f56cdcdf01861fe9152e1a082e
.claude/rules/universal.md 08496a59193725f6469ec120dbbbb871802f8223
.claude/settings.json bf8f00d3f9e50490eb5bb64480f676fe36a75a43
.claude/skills/architect/SKILL.md 86576aba026e67059423f470cd4ad2c62a50ba54
.claude/skills/external-review/SKILL.md f58e3fefaad2cb845a6de338daacbebed2d23548
.claude/skills/finalize-pr/SKILL.md 0212854b0220234db9bbe2e7df98c9302c596dad
.claude/skills/finalize-pr/validators/strip_code_spans.sh 45b5ed30d097dfccc79f5d72c25b40afb6d542fc
.claude/skills/finalize-pr/validators/test_validate_review_pass.sh afdde01cce56ff4d654be5d22127a828470ae5cc
.claude/skills/pipeline-audit/SKILL.md 9d09c12fad449be1602acd8b2a6e16c472bce675
.claude/skills/project-manager/SKILL.md 98320d15f9ef6bd394dfb3c829f3218f9a95b38a
.claude/skills/sprint-pr-cycle/SKILL.md b9717ee6b044a5c398025c180239676710cc24d4
.claude/skills/verify/SKILL.md 9a9264200f2946c9884b9aeacf565789ea6754db
.claude/tools/publish-pr-comment.py e969d97fe6c80495466e7b19bea9859a84a9fe6c
.claude/tools/run-python.sh cd6341fa8d73307d28408b84c001fc050e5660b1
.claude/tools/with-timeout.sh a04234d181dcb819076a22763249521ff805ccae
.codex/hooks.json 7ab70059750d8cb1a7630e7136540421bc800831
.gitattributes 519dd4c3e34b7be70c89de237c4a3aa8a594fcdb
.gitignore 592de0a773fe683d565f8460ec5bf37c794d6608
.memory-bank/activeContext.md bc59d5d0d3b15d5b9a9b223a60f34335ee24b794
.memory-bank/productContext.md 8cc61112a6bf31fd18d5b94a5e3e53bc1fbb3861
.memory-bank/progress.md 65a8982fbc7ebad89f3356b690bece1f62d8a19a
.memory-bank/projectbrief.md 17ca5a9203e9299f44f56ef1c69316cf1c3953b0
.memory-bank/systemPatterns.md 7957bda9aecb5a93204087019b7311406f03e0c6
.memory-bank/techContext.md 35078c3cd0983da3e9e45d46a23e5795365df8c3
.overgate/install-state.json 636146cc29af8b6f87cad1a64021ee42b85a73ab
AGENTS.md b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0
LICENSE eecac747717f530b74cea9a9d64e8d4ad724e426
README.md 59fc5b5a0d2446c45c3cb98c3947d560f8754e01
docs/INDEX.md 957826bf936a8cd066e8cf6bf1245eca2431572b
docs/architecture/source-authority.md e75be660520826e1cdc09d98d25af04089421be1
docs/architecture/u2-source-inventory.json 4f9597b66d49fb05701a8e92f941ba1e6e4caa98
docs/baselines/2026-10-01-delivery-first-provenance.json a2e2b15b53d382b5a23efd65f9327a432360a39b
docs/plans/2026-10-05-overgate-bootstrap.md 7f2a1e0585f38a88b6b0e052db19bf7b93041e04
docs/plans/2026-10-05-u2-lab-launch.md ad0ee38d9317c4a0fa6631201da3535699265b96
docs/product/power-heat-lab-v0.1.md 7fb875dc5b4a7c34ae13ba2e9c297c57c42103ba
docs/reviews/2026-10-05-install-plan-review.md 7104b8fb414e63ab9e448b4d21f00f32b613ec0e
docs/verification/bootstrap-contract.md a825a618d80c35728626de6f8eaec896b468a269
docs/verification/bootstrap-evidence.md 4d21b1209b61e674ee3571efa458af88e323b0c2
docs/verification/overgate-install-plan.json 64165e4b81153798a328b974ed0d095111c8bba5
docs/verification/power-heat-v0.1-contract.md 4276fff6498f85ba84912105add8f415035867c5
docs/verification/source-fixture-results.json beb339f780847b8470ee9e75ae9ca591eddf71d7
scripts/bd-read.sh c331e6430ec0938ecead7f3aa02f0703107d844a
scripts/bd-sync-common.sh 9ea9ded9eeb810cc3ce2cee035f997059857d970
scripts/bd-sync-export.sh 0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85
scripts/bd-sync-restore.sh d088d5e8566ee1e5c6f963466e956e0eef3a6f4e
scripts/bd-wt.sh 19ea1442df96e62e706e8b9cb963ba6452f3b9d8
scripts/check-reference.py 1af2da08c18db557672c5690cc00a191530613d6
scripts/install-overgate.py 040a85eab1c0211f273a08c0a4bbf0012d2f3612
scripts/lib/bd-env.sh 11bc2539b7661f4a5a65fb98ec86432990323c6c
scripts/lib/bd-read-engine.mjs fcd7ac786227bb8779e341b5db0eed58e99cb7b4
```

The full relevant contract is `docs/verification/bootstrap-contract.md` at the stated candidate;
its exact byte SHA256 is recorded above. `git diff --check` is a current deterministic format
check; future final HEAD/current-check and metadata equivalence remain PM/finalization work.
Only this requested local report was written. No source fixes, Beads mutations, remote comments
or subagents were made.
