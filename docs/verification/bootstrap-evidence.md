# Bootstrap evidence — preparation only

2026-10-05. Role: PM; actual model provider ID not exposed by runtime.
Source: clean komleff/overgate tag v4.0.0-rc.1,
633937250fa8f47b49f928c1d8781ab17fe8c8e3. Target managed install NOT RUN.

| Check | Result | Evidence / boundary |
|---|---|---|
| Source clone/tag/SHA/clean | PASS | git clone public official repo; checkout tag; rev-parse; status empty |
| Source verify-reference.sh | FAIL,exit2 | finalizer-validator: stripper returns100; host mawk REcompile panic |
| Structure/closure/guards/parser/publisher/launcher/readiness fixtures before fail | PASS in source | Source suite logs; not target actual activation |
| Installer fresh/upgrade/rollback fixtures | PASS26 | python3 scripts/tests/install-distribution.test.py; independently executed after suite fail |
| Beads sync fixtures | PASS23 | bash scripts/test-bd-sync.sh; fixture remotes, not real u2-lab origin |
| bd1.0.2 official binary checksum | PASS | SHA25666280bca14581218684027fee000810c2e40a9c6fe00e876ff64bdcb01a036c0 |
| Local bd init/task creation/export | PASS | primary checkout prefix ulab; bd API; export.auto=false/sync.remote unset |
| Real origin/beads-backup sync | NOT RUN | Remote repository absent; no fabricated origin evidence |
| GitHub repository-create UI | BLOCKED | Requested create page redirects to Sign in; no authenticated session |
| Installer inventory/approval/apply | NOT RUN | Real target Draft PR required before plan/apply |
| Actual Claude/Codex hook activation | NOT RUN | Hosted runtime != native CLI activation |
| Product build/unit/browser/LAN | NOT RUN | Runtime implementation not started |

## Reproduction of source-suite failure

```bash
bash .claude/skills/finalize-pr/validators/strip_code_spans.sh <<'EOF'
## Review-pass #3
Вердикт: CHANGES_REQUESTED
Архитектура: ISSUE
EOF
```

stderr: `REcompile() - panic: values still on machine stack for ^[ ]{0,3}#{1,6}([ \\t]|$)`.
The same regex in standalone host awk reproduces exit100. Host awk: mawk1.3.4/20240123.
No frozen source modifications; no guard bypass or replacement validator. Overall suite
remains FAIL despite separate installer/sync fixture PASS. A compatible awk host/toolchain
must be proved before bootstrap finalizer acceptance; not an automatically accepted risk.

## Scope

Это deterministic preparation record, не independent QA EXECUTION/Code Review, не install
PLAN_READY и не final readiness. Independent product Plan Review имеет отдельные reports.
