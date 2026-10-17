---
title: "CR-TD-B1 — independent affected QA Legacy transitions"
status: PASS
date: 2026-10-07
role: independent QA
canonical_target: docs/reviews/2026-10-07-thermal-diagnostics-qa-legacy-fix.md
---

# QA EXECUTION — TD02/TD04, call6/10

**PASS · CR-TD-B1 CLOSED ·0BLOCKER/0ADVISORY.** Requested Legacy Active loads retain real cold/hot protection and hysteresis restart, exact individual ID (including `laser: secondary`), native eventtime and safe restart bounds. Aggregate mining output is retained without fake aggregate hardware transitions.

Role: independent QA, `.agents/QA_ROLE.md`2.1. Model: Codex; exact provider/deployment ID unavailable. Operator explicitly extended verifier budget; this is the bounded affected QA6, not a restart of the old matrix. No source/requirements/tests/Git/Beads edits, subagents or guards.

## Tested binding

Runtime `a6c7430b795ca79377e210cfb032c53732d0654e`; metadata HEAD `4975facb0d0dd14f2f8203a614f155f41d2493ef`; before `48f1fba4686b9069c05db073e84512f39f28c536`. Immutable artifact `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics/.overgate-runtime/thermal-release-legacy-fix/dist`. PM buildFP `352a78bc10557fe76a08ffbda01c50e3bf7cc9943bb353b764146828ed013400`; sourceFP `446976869a26ccd1f8effbe9f2ebe6ec881dec160b3a1d330d092d0fa1e271f7`; wholeWHAT/HOW `b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d` unchanged.

Whole WHAT/HOW/ReviewContract and signed Review5 were read before methods; source-derived `methods.md` saved before current diagnostics/Developer explanation. Expected transitions come from unchanged native kernel and TD02/04, not future test output. Necessary owner surfaces read: Legacy types/kernel/gates/run, diagnostics, presets, actual LegacyUI/JSON/CSV; actual V2 runner regression uses own existing saved RunSpec. Explicit11 bound paths/three whole contracts in [source-binding.json](source-binding.json). Own FP `57583ff7a2b85a18da1819100cbc09e2bc1a18f25fa2241cec1a4f4ed88be128`: sorted necessary path NUL Gitblob LF + literalwhole WHAT, HOW, ReviewContract in listed order.

Global runtime delta vs48f is only `src/runner/diagnostics.ts` and `tests/fitting/thermal-diagnostics.test.ts`. The ten other bound owner blobs match48f. Test delta is external content, not own executed oracle. Candidate source bytes used by SSR API match runtime Git blobs; native browser used immutable built artifact. PM17assets/package and Developer489unit/49browser+1SKIP/26cloud/type/build evidence were not repeated.

## Affected ledger

| TestCase | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| B1-01 | CR-TD-B1; TD02/D02 | Own short supported radiative cold225/hot570 actual crossings; directkernel native events vs accepted runner | PASS | `api-checks.json`, `api-records.json` |
| B1-02 | TD02 hysteresis restart | Held259/551 controls; physical safe260/550 crossings with prior gate true; laser+colon-secondary | PASS | `api-records.json` |
| B1-03 | TD04 disabled/idle/fullcargo | Secondary-only, disabled-secondary, zero-duty actualstep; idle/fullcargo actual runner | PASS | `api-checks.json`, `api-records.json` |
| B1-04 | TD02/04 accepted-step/ownership; V2 aggregate delta | Raw state/telemetry and observer immutability; short chunk1vs100/sparse/fresh run; one actual V2 group | PASS | `api-summary.json`, `api-records.json` |
| B1-05 | Affected export/native regression | API JSON/CSV + one actual LAN touch390 Legacy Worker import→Start×1→Pause→Resume→complete→JSON/CSV | PASS | `native.json`, result/events exports, journal PNG |

Fresh scope: **5risk rows PASS;26API +7native assertions PASS/0FAIL**, one native Worker start. These are33 assertions, not33acceptance cases or six fresh wholeTDmethods. No failed assertion, harness exception or corrected runtime attempt occurred; a nonexistent guessed CSV source filename was resolved to actual `src/io/json.ts` before probes, not recorded as a product failure.

## Actual independent evidence

Cold native stop:225K at `2.5523750082356862e−8s`, finalT224.9216984543K. Hot native stop:570K at `3.565976842235308e−9s`, finalT570.5608555265K. Two-load cold case emits one event per exact full ID, including `[laser: secondary]`; no parent-ID misattribution. Native restart crossings occur at260K (`0.02000000356596754s`) and550K (`0.020000000688006624s`); translated events preserve these times and260–550K bounds. Held controls outside that corridor do not restart.

Disabled/idle/fullcargo raw kernel may update gate states, but observer does not narrate an unrequested load stop. Active aggregate group retains actual useful output, emits no hardware stop/restart; V2 selected real load transitions and `Добыча0.0% [mining-group]` coexist honestly. No individual Legacy useful throughput was invented. Raw physical state/telemetry match direct accepted kernel steps; observer leaves previous/raw inputs unchanged. Short sparse run has one wear notice per episode; chunk grouping doesn't change eventarray; healthy fresh run inherits no old episode.

Actual insecure LAN `http://192.168.68.65:4213/?mode=legacy&v=thermal-legacy-a6c7430`. Chromium true `isMobile+hasTouch`390, not physical Xiaomi. Own lawful edited fixture imports with no validation error; genuine advancing Worker paused at0.1s/T224.609622K before completion, then resumes to2s. Visible journal contains both actual individual IDs and restart bounds; one saved journal screenshot visually inspected. Independent CSV parser equals all exported JSON `[time,kind,message]` tuples. Pageexceptions0/requestfailures0. Own ephemeral4213 server stopped only; root4196/4189/other stable ports/user pages untouched.

Developer FIX report SHA `1ba00fa8c0227c108688a25afe6fb9757d6e55cd2e15234f54e46d0fe7f67105` read **after** own API/native measurements, external evidence only. Original Review5 CHANGES_REQUESTED SHA `413226bf986443298e3217ededed9fffaa224d7e659ffbae47e5d25752ce8b93` remains immutable; this report supplies new affected evidence, not retroactive approval.

## Carryover / NOT RUN / signature

TD02/TD04 addressed risk now PASS. Other original thermal acceptance evidence—including TD05 axis/label closure—carries by unchanged owners/wholecontracts; not freshly replayed. Prior initial/label FAIL reports and their raw history remain intact. Existing four physical/81historical digests inherited; no new weaker oracle/expected was substituted.

NOT RUN: full six-AC matrix,18graphs,81numeric/4physical reruns, hour/12h matrices, U2/guard/pipeline audit, physicaltablet/nativeOS/public/base/main/merge, Unity/server/wear numerics/H₂fix. Private controlled numerical fields are lawful experiment fixtures, not new canonical TTX.

Signed independent QA/Codex (deployment ID unavailable),2026-10-07. Compact raw manifest/receipt binds final0444 bytes. Execution complete; tested source freeze RELEASED to PM publication and scoped Review. QA IDLE.
