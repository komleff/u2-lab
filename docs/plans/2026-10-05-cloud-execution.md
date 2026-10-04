---
title: "U2 Lab — cloud Beads and stacked implementation"
status: proposed
version: "0.1"
date: 2026-10-05
tags: [plan, beads, cloud, execution]
---

# Cloud execution amendment

Goal: continue the approved lab implementation while the operator sleeps, with U2's
single-writer Beads workflow and explicit uncompleted operator acceptance.
Authority: operator's instruction to inspect Beads in U2 and continue autonomously;
U2 ADR-0042 active at `cdc490e3517c8455f662f82579c45813cdbb9a76`.
Product WHAT/P1–P14 and the accepted launch plan are unchanged.

## As-built and correction

Generic OverGate RC provides readers and primary-checkout snapshot helpers, but not the
U2 intent applier. Local preparation contains nine bd-generated tasks; its attempted
push failed due to Git CLI authentication. Connector access works. The hosted checkout
is transient and must not become the authoritative Beads writer.

Cloud agents will write requests, not mutate Dolt or publish beads-backup. The existing
generated recovery checkpoint is retained unchanged as bootstrap input, not remote authority.
The operator's primary checkout imports it once, preserving the original nine IDs, and
publishes with the trusted frozen OverGate helper. Future intents refer to these IDs.

## Task 1: project cloud channel

Files: add `scripts/bd-apply-intents.sh`, `scripts/lib/bd-apply-engine.mjs`,
`.bd-intents/README.md`, `.bd-intents/bootstrap-cloud.jsonl`,
`scripts/tests/test-bd-cloud.mjs`, `docs/guides/operator-bootstrap.md`.
Modify only project-owned `AGENTS.md`, `.claude/rules/beads.md`, project verification/context.
Managed OverGate files and original reports/checkpoint are preserved.

Use the pinned U2 applier/engine with narrow project adaptation. Installed bd-env APIs are
compatible; retain the installed helper. No upstream security/validation/receipt guard removal.
Queue contains notes recording cloud routing and outstanding bootstrap actions. Do not close B0
or pretend any queue is applied. Subsequent work updates are append-only intents, marked pending.

Failing tests then implementation: valid queue dry-run does not invoke bd; forward references,
unknown operations/fields, invalid ref/priority/status, duplicate intent IDs fail before mutation;
idempotent reapplication against a stub does not duplicate create/note; mixed invalid queue causes
zero mutations. Reject symlink/unsafe queue/receipt paths if upstream does so; preserve its boundaries.
Run existing reader/sync/reference tests affected by integration, and project verification.

Operator guide must be executable from a primary clone and explain initial empty-remote setup:
bd init (skip agent/hooks rewriting), bd import the generated checkpoint, then invoke the
verified external frozen OverGate export helper. No force/drop bypass or manual snapshot editing.
The new intent applier is used only after operator review/merge establishes trusted tooling.
Native hook activation follows frozen INSTALL and remains NOT RUN here.

## Task 2: stacked product implementation

After independent PLAN_READY for this amendment and deterministic cloud-channel checks,
create `feat/power-heat-lab` from the reviewed bootstrap candidate and a Draft PR based on
`bootstrap/overgate-v4`. Execute accepted T1–T6 with one Developer, then QA and one scoped Review.
This is reversible implementation preparation, not completion of B0 or permission to merge.
Original bootstrap acceptance B6/B8 remains open until operator synchronization/finalize;
live native activation remains NOT RUN. Product PR is merge-ineligible while its base is unaccepted.
The later operator bootstrap is a landing dependency rather than a reason to stop cloud engineering.
No pending Beads intent is described as canonical task state.

## Verification Contract: C1–C6

| AC | Expected | Method |
|---|---|---|
| C1 | Cloud is read-snapshot/write-intents; no further local bd mutation or snapshot push | Authority/context/queue review |
| C2 | Applier validates whole queue before mutation; handles/refs/idempotency preserved | Negative dry-run + stub fixtures |
| C3 | Original nine task IDs/data recoverable; no duplicate task creation queue | Checkpoint hash + guide + queue audit |
| C4 | Managed OverGate inventory unchanged; new cloud tooling provenance explicit | Blob comparisons + check-reference/project verify |
| C5 | Operator commands distinguish trusted external first export from later merged applier | Guide/first-remote fixture review; actual operator run NOT RUN |
| C6 | Stacked product work preserves P1–P14, full bootstrap/merge gates and honest task status | Branch/PR metadata and acceptance reports |

Mode CRITICAL for cloud tooling/data-loss boundaries; historical bootstrap verifier budget 2/6.
One independent reviewer handles this plan and scoped code; one QA checks C1–C6. No broad
bootstrap re-audit. Product implementation uses its existing reviewed plan/contract separately.
Rollback: revert new project cloud additions/authority amendment; keep generated checkpoint.
Never restore/overwrite a live operator database as part of code rollback.
