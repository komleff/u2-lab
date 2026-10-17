# Independent OverGate installation Plan Review

Verdict: **PLAN_READY** — только для exact installation inventory до apply.
Active BLOCKER: **0**. Эта запись не утверждает завершённую установку, actual hooks activation,
runtime QA или готовность PR к merge.

- Mode: PLAN_REVIEW / INSTALL inventory.
- Role: independent Reviewer.
- Model: actual provider/model ID недоступен; предполагаемое имя не подставлено.
- Mode/budget: CRITICAL, named governance/preservation/rollback risk; install launch 1/6.
  Это отдельный deliverable от PRODUCT launch 1/5; reviewer swarm не запускался.
- Target commit: `ae7a704bb2e6e5acc8ac239064fb9ce00b9ab378`.
- Target PR: https://github.com/komleff/u2-lab/pull/1 — independently fetched, open Draft.
- Target branch/base: `bootstrap/overgate-v4` / `main`;
  base `9469d3e8998dada5ec3a6f99712fae8345fb3f7f`.
- Trusted source: clean Git checkout OverGate `v4.0.0-rc.1`,
  `633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
- Source contract: `docs/verification/bootstrap-contract.md`, B1–B8;
  exact SHA256 `58edef817e726bd16dcdb41525e2470771f8142c84ab1f23988c92665bceb39a`.
- Exact inventory: `docs/verification/overgate-install-plan.json`, 27392 bytes;
  SHA256 `2502f1f7158c217e0fdc645b86565433e5c44ac70833441ffeb8a360b02791bf`.
- Publication independently fetched:
  https://github.com/komleff/u2-lab/pull/1#issuecomment-5983753531.
- Content-Fingerprint: `8348d31ea831889464a850e1b3cd30a033ad3e81b1a6d39bc5b1e52703639d2f`.

## Scope and independent evidence

Read frozen `.agents/INSTALL.md`, previously read RV/PM roles and current ADR §§3.28–3.32;
inspected `scripts/install-overgate.py`, `scripts/check-reference.py`, distribution manifest,
project preservation inputs, fresh verification template and rollback tests. Source payload
byte/mode review covered every explicit source/target operation in the bound inventory;
this was not a semantic audit of every generic skill or a redesign of released OverGate.

GitHub metadata independently confirmed public `komleff/u2-lab`, actual Draft PR #1,
its base/head and published inventory comment. Remote inventory fetched at the exact head
has blob `64165e4b81153798a328b974ed0d095111c8bba5` and matches local inventory bytes exactly.

Trusted `make_plan` was independently rerun in memory against the actual target. Regenerated
object and canonical JSON bytes equal the published inventory; target Git status did not change.
This run executes isolated staged-payload structural/closure preflight from frozen Git bytes.
Result: **PASS**, 67 operations / 68 manifest entries, zero conflicts. Existing AGENTS.md is
preserved, accounting for the skipped preserve operation. Every current before hash/mode and
projected after hash was independently checked. All 14 shell outputs have LF and mode 0755.

Guards/helpers precede dispatcher; dispatcher precedes Claude settings. One managed Claude
dispatcher entry and the existing single Codex repository guard pass staged closure. No
Memory Bank/Beads/credentials/personal runtime data operation is present. Existing project
ignore entries are preserved, backups are ignored, Codex hooks remain trackable, and existing
project `.gitattributes` enforces LF. Source SHA/status remained exact and clean.

Seven bounded isolated installer tests were independently executed, **7 PASS** in 11.098 s:

- `test_v39_upgrade_and_rollback_preserve_original_bytes`;
- `test_interrupted_apply_restores_settings_before_dispatcher`;
- `test_target_drift_is_rejected`;
- `test_approval_must_bind_exact_plan`;
- `test_contract_drift_rejected`;
- `test_custom_managed_role_conflict_stops_before_backup`;
- `test_rollback_refuses_changed_managed_file`.

Command: `python -B scripts/tests/install-distribution.test.py InstallTests.<named test> ...`
from the trusted source. Fixtures install only into temporary repositories, not U2 Lab.
Rollback inspection also confirms original bytes/modes are journaled before target mutation,
reverse restoration returns settings before removing dispatcher, and managed drift blocks
rollback rather than discarding subsequent work. `git diff --check`: **PASS**.

## B1–B8 disposition

| AC | Installation-plan disposition | Remaining execution evidence |
|---|---|---|
| B1 | PASS: actual public repo, working branch and Draft PR contain plan/contract before managed apply | No merge approval implied |
| B2 | PASS: clean exact source, explicit inventory, exact regeneration, staged closure and before/after checks | Apply repeats drift/closure checks |
| B3 | PASS for inventory publication and this independent PLAN_READY | PM publishes this report in the same PR, verifies origin and creates exact-plan approval JSON with the real report comment URL |
| B4 | PASS for projected managed scope and preservation | Actual apply/state/backup/project-check completion remains NOT RUN |
| B5 | PASS for six delivery owners, project authority route and exclusion of project context from copy | Installed role/context smoke remains NOT RUN |
| B6 | Plan preserves existing project Beads and specifies helper-only synchronization | Actual bd/task/dependency/export/restore evidence belongs to QA; no synchronization PASS asserted here |
| B7 | Plan explicitly requires filled project verification and separates fixtures from actual activation | Fresh template intentionally exits 2 until filled; full reference suite/current project checks and native activation acceptance remain open |
| B8 | PASS for safe order, original-byte preservation, drift refusal and rollback plan | Actual installation QA/scoped review/finalize/operator merge remain NOT RUN |

The earlier source full-suite mawk failure is not converted into PASS by selected fixtures.
PM reports an official local GNU awk 5.2.1 extraction, unchanged frozen source, a 180 s bounded
reference invocation ending with timeout 124, and remaining source groups still running.
These are PM execution updates, not independently certified full-suite results in this report.
This review did not rerun or certify the full suite. Any remaining B7 deterministic failure
blocks final acceptance; pending groups are an apply/QA completion boundary, not a defect
in the exact inventory authorization.
Hosted Work lacks native Claude/Codex project-hook loading: activation **NOT RUN**, as declared
by the existing contract. Static closure is not activation evidence; no ACCEPTED_RISK is invented.

## Findings

BLOCKER: 0 for exact INSTALL plan readiness.

ADVISORY: bootstrap/context text still describes the old absent-remote state
(`docs/plans/2026-10-05-overgate-bootstrap.md:8,15,84–88`,
`.memory-bank/activeContext.md:8–10,21–22`, `.memory-bank/progress.md:13–18`).
Triage: **reject with rationale** as an install-plan blocker: independently fetched GitHub
metadata and exact inventory supersede those historical status statements. Routine PM
bookkeeping can update them; this is not a new governance feature or extra review stage.

## Reviewed-Paths and binding

Explicit target reviewed package at the stated target commit:

```text
.beads/config.yaml d0f62613958316a9f7bf1da25908aa95d9e719f7
.gitattributes 519dd4c3e34b7be70c89de237c4a3aa8a594fcdb
.gitignore 52e4d57e972cbbd379d13dd0617ebe2602b8e1fe
.memory-bank/activeContext.md 00440a25a7e59005af46026433d36501f56c3913
.memory-bank/progress.md 5afecf1a19547b719b29beda3f0b65b562530f4c
AGENTS.md b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0
docs/plans/2026-10-05-overgate-bootstrap.md cf141cb05c6a63494d1fba98694379c61e5b329e
docs/verification/bootstrap-contract.md a825a618d80c35728626de6f8eaec896b468a269
docs/verification/overgate-install-plan.json 64165e4b81153798a328b974ed0d095111c8bba5
```

Fingerprint input is those sorted UTF-8 `path SP gitblob LF` rows, followed by exact
LF-normalized bootstrap-contract bytes, without marker lines. Contract length: 4140 bytes.
The inventory blob itself binds the full explicit operation/source/target/hash/mode list.
This is scoped content binding, not the fingerprint of the full PR or final installed state.
Plan apply approval must separately bind the exact inventory SHA256 above and the actual
same-PR publication URL of this independent report, not the inventory announcement URL.

## Not reviewed / not tested

No actual target apply/rollback, installation-state verification, filled project verification,
native/Windows activation, Beads remote synchronization, full reference-suite rerun, lab
runtime/browser/LAN testing or final acceptance. Product physics/catalog work is OUT OF SCOPE.
No source or acceptance file was changed; no remote comment was posted by this Reviewer.
Only this requested local report was written.
