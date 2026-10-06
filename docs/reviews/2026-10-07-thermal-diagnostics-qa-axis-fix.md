---
title: "Температурные оси и подписи — affected QA"
status: PASS
date: 2026-10-07
role: independent QA
canonical_target: docs/reviews/2026-10-07-thermal-diagnostics-qa-axis-fix.md
---

# QA EXECUTION — TD05-B1, call4/5

**Result: PASS. TD05-B1 CLOSED в адресованном классе осей/подписей;0BLOCKER/0ADVISORY.** Обычные четыре подписи и upper-axis, empty/no-limits, disjoint, detailedK, hidden/absent channels и sharedW проходят реальную styled glyph-геометрию. Два предыдущих подписанных FAIL сохранены; они не переписаны в PASS.

Role: independent QA, `.agents/QA_ROLE.md`2.1. Model: Codex; exact provider/deployment model ID unavailable. QA не изменял runtime/requirements/tests/Git/Beads и не запускал новый full guard.

## Source / content / build

Tested source `48f1fba4686b9069c05db073e84512f39f28c536`; before `c10dee068d3efb20e6e67e69b9628bb3a241bc10`. Immutable `.overgate-runtime/thermal-release-final-fix/dist` в `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics`.

SourceFP `e9d402ab2a898d331770952e575640d52040c3faa8e53e41f62ba7cee57f4973`; buildFP `4626bc3aa39d37673af35f4c512dd9b8ace94166f4c6ff70d5d1d878ed43d5ba`; unchanged whole WHAT/HOWFP `b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d`. Source recipe ordered17 path NUL Gitblob LF; contracts separately ordered2 path NUL workingSHA256 LF. Own affectedFP `1dd9354f8f6397ac11f75d26ec4ddb6b43ee8f96e190bdd359091498352ea29e`: two actual delta path NUL Gitblob LF, then literalwhole WHAT and HOW. Full explicit rows, hashes and old report links: [source-binding.json](source-binding.json).

Actual global Git delta contains only `src/app/fitting-ui/trace-chart.ts` and existing `tests/browser/thermal-diagnostics.spec.ts`. QA read the current renderer/sharedchannel owner and accepted whole contracts, bound both delta blobs and reconstructed source/contractFP. Browser spec is bound external test content, not own oracle execution. Other15 original thermal owner/test blobs equal initial ecf; events/observer/Worker/data/physics/IO untouched by this delta. Controlled renderer used exact committed source bytes, checked before and after execution. Canonical U2 ADR0068/D05 authority remains the original report binding; no new WHAT or typography threshold was introduced.

PM independently supplied17-asset/source/package/normalguard481unit49browser+1SKIP26cloud evidence. QA did not repeat asset sweep, full guard, API23, four physical numerical oracles,81 historical capture, protected-model scan or long run.

## Fresh affected ledger

| TestCase | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| TD05-AX01 | TD05/D05 empty; residual B1 upperaxis | Isolated exact renderer with all resolved operations disabled; actual production styled DOM1440/touch390. ALL3glyphboxes and screenshots | PASS | `sweep.json` samples empty; `empty-{1440,390}.png` |
| TD05-AX02 | TD05 common4bounds/cold/saved | Native saved own hot JSON open without simulation; own cold200spec Start×1→advance≥1.1s→Pause→Graphs. ALL7glyphs, four boundaryfonts≥12px | PASS | saved-common/paused-cold samples and PNGs |
| TD05-AX03 | Named detailedK/hidden/absent edges | Real Heat/K selection and curve-toggle; isolated absenttemperature and absentallchannels/emptybuckets; shared-axis glyph geometry | PASS | detailed-K/hidden-K/absent samples; detailed-K PNGs |
| TD05-AX04 | TD05 disjoint | Controlled saved mining gate580/600/650/700; correct warning/individualmarks/noaggregatefill; same four-label class | PASS | disjoint samples/PNGs, `renderer-edges.json` |
| TD05-AX05 | Shared changed-path W-axis regression | Actual Energy/W native controls; quick ALL3axis-text geometry only | PASS | shared-W samples in `sweep.json` |

**Scope/counts:**5addressed risk rows PASS;9named views×2widths=18geometry samples PASS/0FAIL. These are not18whole acceptance cases or a repeat of six AC methods. Two bounded native width slices PASS; one genuine Worker Start perwidth, two total. Pageexceptions0/requestfailures0 in both contexts. No harness exception/correction or failed attempt occurred.

## Actual measurements / visual readback

Ordinary insecure LAN `http://192.168.68.65:4212/?v=thermal-axis-48f1fba`; own ephemeral0.0.0.0server served immutable dist. Desktop1440 and true `isMobile+hasTouch`390. Touch is emulated Chromium, not a physical Xiaomi claim. Production fonts awaited `document.fonts.ready`; every SVG text used actual `getBBox`, pairwise rectangular intersections and viewBox containment. Ten key screenshot artifacts were visually inspected.

Former empty-axis upper «225,38 K» now has y=14.632324/h=25.727592SVGunits at1440 and y=5.643718/h=36.130806 at390, both inside viewBox0..205. All18samples have no glyph overlaps/out-of-bounds. Four colored common thresholdlabels200/250/500/550 have screenfont26.12px/12.40px, meeting the released≥12px boundary requirement. Detailed/nonthermal axes were measured separately (touch screenfont9.37px); the report does not assert a new12px requirement for those non-boundary values. Their actual boxes also fit and remain separate. Blue/red bands remain present on common/paused graphs; disjoint retains no misleading aggregatefill.

Genuine paused cold state:1440 time1.19s/T200.006545K;390 time1.20s/T200.006600K. Two actual buckets each, one Start command each; native pause reachable. The near200 trace is present inside the displayed domain. Saved hot result523.89K was opened without rerun; only representation was measured. Native detailed group/unit/toggle controls came from actual `lab-channels.ts`/DOM. The hidden-curve view keeps its existing fallbackaxis behaviour; no new physical measurement claim is made.

Empty/disjoint/absent samples are **controlled renderer edges**, mounted into an own actual LAN temperature figure with production styles/fonts. They are not claims of legal current-model empty RunSpec imports. Four edge fixtures share one `renderer-edges.json`; no model run or per-tick dump was generated. Detailed screenshots preserve native sticky controls where present; the asserted geometry is containment/nonoverlap within the SVG, not a new whole-page overlay audit.

## Inherited / not tested / signature

TD05-B1 is freshly closed by the label-class sweep. TD01/02/03/04/06 inherit prior accepted PASS via unchanged owner blobs/whole contracts. Original six-AC mapping is therefore6PASS, consisting of **one fresh affected AC +five inherited ACs**, not six fresh complete methods. Initial report SHA `ea19640095549547641d831e9694437d799112110c949ecea71601b8d1ab3b55` and affected FAIL SHA `823cece69af189dc5a3cc68407797dbb15cdb9329ba4cf54c77fc0ed91a0dd25` checked unchanged. Original reset harness history remains preserved there.

NOT RUN: physicaltablet/Xiaomi/nativeOSgestures, Unity/server/wear numerics/H₂ governor fix, public/base/main/operator merge. No broad UI layout, physical matrix, full chains/API23/oracles/81capture/fullguard or12h replay. PM solepublisher; scoped CodeReview5 follows independently.

Signed: independent QA/Codex (deployment ID unavailable),2026-10-07. `evidence-manifest.json` indexes compact raw artifacts; final files0444 with SHA/readback receipt. Own4212 server stopped after measurements only; root stable ports/user pages untouched. Execution complete; source freeze RELEASED for PM publication/review. QA IDLE.
