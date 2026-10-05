# PM Code Review Contract — U2 Ship Fitting v0.2

Mode: CODE_REVIEW / PRODUCT. One existing Reviewer session; no additional reviewers.
Status: active contract, not a verdict. Independent QA precedes Code Review. Exact candidate and explicit paths are bound in ship-fitting-v0.2-runtime-binding.json; metadata movement requires content-equivalence checks. Accepted WHAT remains unchanged.

Goal: determine whether the approved six-hull, forty-item fitting laboratory meets SF01–20 and preserves exact v1 replay on the current runtime candidate.
Acceptance surface: docs/product/ship-fitting-v0.2-acceptance.md, accepted GDD §1–10, approved T1–T7 plan, whole docs/verification/ship-fitting-v0.2-contract.md. Source synthesis and frozen manifest supply field authority; no new full-game research.
Changed runtime surface: explicit base 6fb7166513627941e2ba2c4a9a01c79ae1667820 → final candidate runtime/data/config/test/tool paths, listed individually in the final binding. Include catalog JSON, numerical model, scenario/metrics, Worker protocol, fitting UI, import/export, retention and new tests. Metadata reports are evidence, not numerical runtime authority.

Named risks:
1. Double-counted builtins/materials, missing dry mass/C, free contents C, wrong slots/pairs/architecture or cargo volume allocation (SF01–06).
2. Optimistic nominal mining under shared power/fuel/heat/cargo limits, fictional electric energy/force or duplicated return heat (SF07–11). Include the actual T7 tiny positive battery remainder/depletion-boundary regression and its source-energy vs stock-delta invariant; do not infer safety only from an internally closed ledger.
3. Misleading cycle throughput/K/downtime/recovery/first-limiter claims, hidden group clamp, changed comparison conditions or unbounded online metric state (SF12–15/SF19).
4. Mutable running snapshots, stale Worker messages, controls blocked by telemetry ACK, mobile interaction failures and ordinary HTTP or Pages-prefix regression (SF16–17/SF20).
5. Legacy reinterpretation, unsupported versions trusted implicitly, non-atomic imports, text labels rendered as markup, incomplete resolved export/replay (SF18).

IN: changed runtime/test/data surface, source-faithful accepted behavior, numerical/protocol/persistence invariants, targeted independent counterexamples, QA failures and meaningful regression risk. Developer tests are evidence, not a replacement for independent review.
OUT: bootstrap/native governance re-audit, operator main merge, unrelated legacy refactor, full flight/market/detection/game balance, external Claude visual polish not yet delivered, advisory scope expansion.

Classification: true SF/mandatory invariant/regression/build/security/data-loss defect = BLOCKER. Other suggestions = ADVISORY. Advisory does not become an automatic fix. Return an immutable signed report with actual role/model, exact SHA/build, explicit paths+blob hashes+entire VC canonical fingerprint, APPROVED or CHANGES_REQUESTED, evidence, findings/triage and not-reviewed surface. No code/GitHub/Beads edits. After blocker fixes, affected review only in this same session.

Artifact reference: repaired Developer candidate d54dd4bd6beaa92e532c2bf537bb3a05860c4c0b; ZIP SHA256 3f8467bc07b256a1c6435a900bad59bdf7410d86fe46ca68941d57c66cf37b49; distDigest a1d561744a60fb06b79b60b58ff442a515c33eb88bcd8e81429aa5e07c37e810. Source-backed QA r1 F1 cargoM, F2 D/electric hybrid, F3 hidden retro coefficient are corrected in this candidate and await independent affected verification. Initial r1 FAIL history remains immutable. Review explicit local preset variants vs ordinary SKU TTX, bill and provenance.

Evidence method: source-first100cases. The118-channel adaptive cap is34807retained buckets; no new40000retained-bucket requirement for v2. Legacy40000 behavior remains separate. Affected QA closes failed/changed surface and seven previously unmeasured exact variants; external physical/native/publicdeploy gates remain NOTRUN. LocalTLS prefix is deployment emulation, not publicPages or second-device acceptance.
