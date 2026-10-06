---
title: "Температурные подписи — independent affected QA"
status: FAIL
date: 2026-10-07
role: independent QA
canonical_target: docs/reviews/2026-10-07-thermal-diagnostics-qa-label-fix.md
---

# QA EXECUTION — TD05 label class, call3/5

**Result: FAIL — 1 BLOCKER, 0 ADVISORY.** Перекрытие четырёх температурных подписей на обычном графике исправлено. Класс ещё не закрыт: в empty-графике верхнее осевое значение обрезается сверху. Исходный FAIL на ecf и его raw-файлы остаются неизменными.

Role: independent QA по `.agents/QA_ROLE.md`2.1. Model: Codex; точный provider/deployment model ID недоступен. QA не менял product/runtime/tests/requirements/Git/Beads, не запускал дополнительные verifier или full guard.

## Binding и границы

Tested source: `c10dee068d3efb20e6e67e69b9628bb3a241bc10`; baseline `ecf0074d9aa77ec0cb2b5f1c09cf7aeeecf17537`. Immutable artifact: `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics/.overgate-runtime/thermal-release-fix/dist`.

Source fingerprint `eb5d39655dc005c24effd143eec37299b67a5744b437227dfa01719182fe928e`; recipe — ordered17 path NUL gitBlob LF, contracts separately. Whole WHAT/HOW fingerprint `b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d`; ordered2 path NUL workingSHA256 LF. Build fingerprint `3a43f8c05c49ce3bce38528fc301b98a0966ba759be5642f3931cb5004b4ae52`. PM's17-asset verification/481unit/49browser+1SKIP/26cloud evidence is external; QA did not repeat it.

Own affected fingerprint `d9049c3d2143e5c639d24be7c44f0de9a13e62273009afaea523391b49643368`: actual two delta path NUL Gitblob LF, then literal whole Lab WHAT and HOW. Full rows/hashes/recipe in [source-binding.json](source-binding.json). The canonical U2 D05 authority remains the original ADR0068/spec binding documented in prior report; no authority revision was substituted.

Git diff ecf→c10 contains **only** `src/app/fitting-ui/trace-chart.ts` and existing `tests/browser/thermal-diagnostics.spec.ts`. QA read the actual renderer and whole WHAT/HOW, compared both delta blobs, reconstructed source/contract fingerprints and verified the other15 prior thermal-package owner/test blobs equal. Browser-spec content was bound, not treated as an independent oracle or executed. Empty/disjoint SSR renderer source bytes were additionally checked equal committed c10. Physics, observer/events, IO, ownership and historical oracle data are inherited unchanged; API23/four physical oracles/81 historical capture were **not** repeated.

Actual plain LAN endpoint was `http://192.168.68.65:4211/?v=thermal-fix-c10dee0`, served only from the immutable artifact. Headless Chromium desktop1440 and true `isMobile+hasTouch`390, `isSecureContext=false`. Only own ephemeral4211 server was stopped after execution; root servers/user tabs untouched.

## Affected case ledger

| TestCase | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| TD05-B1-L01 | TD05/D05 readable nonoverlap; native desktop | Saved own hot JSON import→Graphs; own cold200 spec→native Start×1→advancing Worker→Pause→Graphs. ALL7text getBBox, screenshots/fonts at1440 | PASS | `native-1440.json`, `geometry-{saved-hot,paused-cold}-1440.json`, matching PNGs |
| TD05-B1-L02 | Same, plain LAN touch-width | Same bounded workflow390 with actual coordinate taps; all7texts including axes | PASS | `native-390.json`, `geometry-{saved-hot,paused-cold}-390.json`, matching PNGs |
| TD05-B1-L03 | TD05 disjoint corridor | Isolated exact renderer with mining gate580/600/650/700; actual production-styled LAN DOM1440/390, all7texts and screenshots | PASS | `disjoint-frontier.json`, `geometry-edge-disjoint-{1440,390}.json`, matching PNGs |
| TD05-B1-L04 | TD05 empty edge; call3 explicit all-text inbounds/readability | Isolated exact renderer with all resolved instances disabled, production fonts/styles1440/390; all3texts real getBBox + visual inspection | **FAIL** | `empty-frontier.json`, `geometry-edge-empty-{1440,390}.json`, `edge-empty-{1440,390}.png` |

**Fresh scope:** four affected-risk rows,3PASS/1FAIL; two native Worker starts total. Native assertions16PASS/0FAIL; isolated renderer assertions6PASS/2FAIL (one same defect perwidth). These are not24 independent cases, six full AC replays or a new numerical campaign. All four browser contexts had pageexceptions0/requestfailures0.

Normal graph: both colored bands preserved, four dashed thresholds200/250/500/550 present. ALL7glyph boxes are separate and contained. Four boundary labels have36.45SVG-unit glyph height at1440 and36.13 at390,40-unit baseline gaps. Boundary screen font is26.12px/12.40px; all eight screenshots were visually inspected. Genuine paused cold state is near200K; saved hot state523.89K is opened without rerunning its simulation. Disjoint graph keeps explicit warning, individual markers and no aggregate fill; labels remain separate/inbounds.

## Remaining BLOCKER TD05-B1-empty-axis

**Reproduction:** use the TD05 explicit empty-operations renderer edge, or run `edge-render.mjs` then `edge-native.mjs` against the frozen source/artifact. The own saved timed-result fixture is cloned; every resolved instance gets `enabled=false`. This is an isolated representation edge, **not** a claim of a lawfully imported current-model empty RunSpec. `thermalFrontiers` returns no limits/bands and the honest note «Нет включённых операций с температурными порогами». Its temperature figure is mounted into an own actual LAN page with production CSS/fonts. Capture ALL3text `getBBox` and screenshot.

`trace-chart.ts` still chooses the no-label upper-axis branch `<text x="42" y="16">`. Upper value «225,38 K» has bbox y=−4.3676772118/h=25.7275924683 at1440, and y=−13.3562831879/h=36.1308097839 at390. SVG viewBox starts y=0. The upper glyphs visibly disappear at its top in both screenshots. This violates the released all-temperature-text inbounds/readability scope and the empty TD05 edge. No physics/error/parser issue is alleged.

The original 500/550 and200/250 overlap symptom is resolved, including the upper-axis value on the ordinary/disjoint graphs. **TD05-B1 class remains OPEN** because empty upper-axis geometry still fails. No product changes were made by QA; PM owns triage and any fix release.

## Carryover / NOT RUN / signature

TD01/02/03/04/06 retain original accepted PASS by exact source/content equivalence to the separately signed [prior report](../thermal-qa/report.md), SHA256 `ea19640095549547641d831e9694437d799112110c949ecea71601b8d1ab3b55`. Overall original six-AC mapping therefore remains5 inherited PASS/1 current TD05 FAIL; not6 fresh cases. The first report's reset harness error/corrected readback and all prior evidence remain untouched. No fresh harness exceptions or corrected selectors occurred in this affected execution.

NOT RUN: physical Xiaomi/tablet/native Chrome gestures, Unity/server/wear numerics/H₂ governor fix, public deployment/base/main/merge. Empty/disjoint checks are controlled renderer edge fixtures, not whole native import workflows. No broad layout audit, full chains, four physical numerical oracles,81capture,12h or full guard rerun.

Signed by independent QA (Codex; exact deployment ID unavailable),2026-10-07. Local paths/hashes indexed in `evidence-manifest.json`; final bytes0444 with readback receipt. Execution complete; tested c10 freeze may be released for PM triage/authorized label-only fix. Original FAIL preserved. QA waits for any explicit next release.
