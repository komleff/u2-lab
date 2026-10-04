# Bootstrap evidence — installed, final acceptance open

2026-10-05. Role: PM; actual model provider ID not exposed by runtime.
Source: clean komleff/overgate tag v4.0.0-rc.1,
633937250fa8f47b49f928c1d8781ab17fe8c8e3. Target: public komleff/u2-lab,
branch bootstrap/overgate-v4, Draft PR #1. Product runtime NOT RUN.

| Check | Result | Evidence / boundary |
|---|---|---|
| Source clone/tag/SHA/clean | PASS | git clone public official repo; checkout tag; rev-parse; status empty |
| Initial source verify-reference.sh | FAIL,exit2 / history | finalizer-validator: stripper returns100; host mawk REcompile panic |
| Compatible official GNU awk5.2.1 | PASS | Extracted official Ubuntu packages; frozen source unchanged; finalizer55/55 PASS |
| Bounded source driver | TIMEOUT,exit124 | Hard180s limit; first14 fixture groups PASS, no single-driver completion claim |
| Remaining14 source fixture groups | PASS,all exit0 | Independently invoked original source commands,3workers/timeout120s each; summary below |
| Installer fresh/upgrade/rollback fixtures | PASS26 | python3 scripts/tests/install-distribution.test.py; independently executed after suite fail |
| Beads sync fixtures | PASS23 | bash scripts/test-bd-sync.sh; fixture remotes, not real u2-lab origin |
| bd1.0.2 official binary checksum | PASS | SHA25666280bca14581218684027fee000810c2e40a9c6fe00e876ff64bdcb01a036c0 |
| Local bd init/task creation/export | PASS | primary checkout prefix ulab; bd API; export.auto=false/sync.remote unset |
| GitHub public repository / working branch / Draft PR | PASS | Created komleff/u2-lab, initial seed9469d3e…, Draft PR #1 before inventory/apply |
| Installer exact inventory | PASS | 67operations,zero conflicts; SHA2562502f1f7158c217e0fdc645b86565433e5c44ac70833441ffeb8a360b02791bf |
| Independent install Plan Review | PLAN_READY | Exact regeneration/closure/hash/preservation/rollback; report unchanged; PR issuecomment-5983829289 |
| Trusted apply / installed structural check | PASS | 67operations applied; python3 scripts/check-reference.py exit0; state .overgate/install-state.json |
| Six roles / five core skills / Memory Bank preservation | PASS | Structural closure; project context updated; generic source context not copied |
| Filled project verification | PASS | bash .agents/project/verify.sh exit0; Developer negative fixtures invalid blob/missing authority correctly FAIL and restore |
| Real helper Beads export | FAIL,exit1 | bd generated9issues; git push failed: Username unavailable,terminal prompts disabled. Helper rolls back its ref; no remote snapshot published |
| Real Beads restore / re-export | NOT RUN | origin/beads-backup absent because authenticated CLI Git transport is unavailable |
| Actual Claude/Codex hook activation | NOT RUN | Hosted runtime != native CLI activation |
| Product build/unit/browser/LAN | NOT RUN | Runtime implementation not started |

## Source fixture execution

All28 source fixture groups before installer/Beads have current PASS evidence across two
bounded runs. Installer26 and Beads23 independently executed earlier on the same frozen bytes
also PASS. This is30group evidence, **not** PASS for the timed-out single driver.
Group/log hashes and execution boundaries: `source-fixture-results.json`.

The first driver completed structure, structural-mutations, closure-mutations,
pre-bash-dispatch, activation (static fixtures only), mutation-guard, classifier,
commit-gate, readiness, publisher, python-launcher, with-timeout,
with-timeout-transparency, merge-gate-script-run-parity before timeout.

Remaining original commands were invoked without changing source: merge-gate-parse-completeness,
merge-gate-parse-budget, gate-arithmetic-expansion, gate-heredoc-delimiter,
gate-line-continuation-parity, shell-grammar-single-source, module-resolution-closure,
finalize-triage-parse, bd-read, bd-wt, merge-gate-parse-complexity,
readiness-declaration-corpus, readiness-policy-complexity, finalizer-validator. All exit0.
Finalizer-validator55/55 PASS with GNU awk.

Official package SHA256:

- gawk5.2.1-2ubuntu0.1: `baaf6853bea746485bff4ae0e506599b3c5093ebe6ec9b9584e4272f94f75b93`;
- libsigsegv2.14-1ubuntu2: `889f338bea4ebfd999939d946da4ac0a45668264a5aae78e023feeb0529505b8`.

Package source: authenticated APT metadata from official snapshot.ubuntu.com, noble/noble-updates,
snapshot20260828T000000Z. Extracted into local tooling, no frozen source edits or validator replacements.

## Historical reproduction

```bash
bash .claude/skills/finalize-pr/validators/strip_code_spans.sh <<'EOF'
## Review-pass #3
Вердикт: CHANGES_REQUESTED
Архитектура: ISSUE
EOF
```

stderr: `REcompile() - panic: values still on machine stack for ^[ ]{0,3}#{1,6}([ \\t]|$)`.
The same regex in standalone host awk reproduces exit100. Host awk: mawk1.3.4/20240123.
No frozen source modifications; no guard bypass or replacement validator. GNU awk now
proves the previously failing validator group. The180s driver timeout remains a distinct
completion/performance boundary and is not silently rewritten as exit0.

## Actual remaining gates

1. Native Claude/Codex hook loading: NOT RUN; hosted Work cannot load those CLI project hooks.
2. Authenticated Git CLI Beads sync: actual export failed; browser/connector login does not
   authenticate git push or gh. No retry loop, invented auth, force/drop guard override or accepted risk.
3. Independent QA завершено: available checks PASS, overall acceptance FAIL на B6.
   Scoped Code Review завершено: code quality/spec PASS, CHANGES_REQUESTED, один B6 blocker.
   После metadata landing — affected canonical binding; trusted finalize/operator merge NOT RUN.

These are B0 acceptance gates. Pipeline files are installed, but B0 is not closed and
dependent product runtime tasks remain open. The operator has not accepted a native-hook risk.

## Scope

Это PM/Developer deterministic execution record, не independent QA EXECUTION/Code Review
и не final readiness. Independent product/install Plan Reviews имеют отдельные reports.
Independent QA: `../reviews/2026-10-05-bootstrap-qa.md`; Code Review:
`../reviews/2026-10-05-bootstrap-code-review.md`. Факты первых reports сохранены без правок;
canonical binding после status/index landing — `../reviews/2026-10-05-bootstrap-binding.md`.
