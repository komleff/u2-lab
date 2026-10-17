---
title: "Температурная диагностика — независимая QA"
status: FAIL
date: 2026-10-07
role: independent QA
model: "Codex; exact provider/deployment model ID unavailable"
source_sha: ecf0074d9aa77ec0cb2b5f1c09cf7aeeecf17537
canonical_target: docs/reviews/2026-10-07-thermal-diagnostics-qa.md
---

**Result: FAIL. TD01–06:5 PASS/1 FAIL; BLOCKER1, ADVISORY0.** Диагностика и физические invariants прошли адресованные проверки; обязательная читаемость температурных границ TD05 не выполнена. Это QA execution PRODUCT call2, не новый review/pipeline audit. Исполненный artifact сохраняется; последующий label fix здесь не проверялся.

Source `ecf0074d9aa77ec0cb2b5f1c09cf7aeeecf17537`, base `0aa458b1e22f4d346178ee9538c736efdd81d86a`. Exact immutable dist: `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics/.overgate-runtime/thermal-release/dist`. Собственный QA HTTP0.0.0.0:4210, actual LAN `http://192.168.68.65:4210/?v=thermal-ecf0074`; прежние root-owned ports/пользовательские вкладки не изменялись.

Прочитаны current AGENTS/QA_ROLE и INDEX route; source-first [cases.md](cases.md) составлен до Developer explanation. Whole Lab WHAT/HOW и U2 ADR0068/spec D01–06 перечислены в [source-binding.json](source-binding.json), включая literal bytes/hashes и canon775ea5630. Все17 committed source rows сверены с ecf; sourceFP **97c0d13765763470e95f8fe050c94ce3407c218f0a4222ac02e661bab7750a27**, отдельный wholecontractFP **b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d**. BuildFP **6a5a5f78569466366d44a6980b2d52195c4689c6ecd8ba0b98acd8ca38c560d5**;17asset proof PM inherited, rebuild/guard QA не повторял. Own contentFP **7c16df46232c4b6c56fce3de859a69414b1bd1dc401b843f9519f00e2cc77858**: nine runtime pathNULblobLF +wholeLabproduct/plan +wholeU2ADR/spec. Tested-Paths: diagnostics, fitting/mission/legacy runners, Lab view/telemetry/trace chart/caller и CSV;30 protected model/TTX/IO/protocol blobs отдельно проверены.

| TestCase | SourceAC | Method | Result | Evidence |
|---|---|---|---|---|
| T01 | TD01/D01 | Actual distinctη useful beam: cold50%×.2 +healthy100%×.8 →90%, не75%. Exact uploaded Pony H500 default cold; Ermak H₂OFF/T525/H20. | PASS | `api-final.json`, `oracle4-actual.json`, `Ermak-hot-summary.json`, `exact-downloads-readback.json` |
| T02 | TD02/D02 | Partial→critical→restart с remainingpower→healthy; actual positive-fuel tank gate, positiveQbus deficit, healthygen part-load; one wear notice/episode. | PASS | `transitions.json`, `api-final.json` |
| T03 | TD03/D03 | Requested march/retro/strafe/turn roles, actual/request; conditional finite estimate, zero force честно unavailable. Independent m·c′²(γ−1)/F:621.859052m vs621.859m. | PASS | `api-final.json`, `braking-arithmetic.json` |
| T04 | TD04/D04 | Chunk1/batch events identical; no-demand idle/cargo/service; real Worker pause/step/resume/two runs/A perwidth; reset corrected readback. | PASS | `native-1440.json`, `native-390.json`, `reset-readback-*.json`, `api-final.json` |
| T05 | TD05/D05 | Both bands, max lower/min upper, empty/disjoint/savedTTX; real cold≈200 graph inspected at1440/touch390. Text geometry overlaps. | **FAIL** | `cold-1440.png`, `cold-390.png`, `graph-geometry-*.json` |
| T06 | TD06/D06 | Four captured pre0aa numerical fingerprints exact; original81 full-hash fixtures unchanged, protected30. Actual native JSON/CSV literal text; bad result preserves fit/result/A; no-observation opening honest. | PASS | `oracle-evidence-refs.json`, `protected-blobs.json`, `oracle4-actual.json`, native JSON/CSV |

**TD05-B1 — BLOCKER, all thermal label class.** Actual labels share x80 and18SVG-unit baseline spacing, but getBBox height25.727592 at1440 /36.130810 at390. Thus adjacent hot500/550 and cold200/250 glyph boxes overlap7.727592/18.130810 units; mobile550 label extends to y−4.356283. Required nonoverlap/readability/inbounds fails. Blue/red fills correct, measured cold200 curve visible; these do not cure the label defect. Both screenshots were visually inspected.

Repro on ecf: import own `native-spec.json` with initialT200 (private lawful initial-condition change), H5×1→Start→Pause→Step→FreezeA→MAX/Resume→completion→«Графики»/overview→temperature figure. Repeat with1440 and true isMobile/hasTouch390. Actual steps and uploaded hashes in native JSON; source `src/app/fitting-ui/trace-chart.ts` increments label position18 without matching rendered text bounds. No product fixes by QA. Absolute evidence root: **`/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/thermal-qa/`**.

Own execution counts: **23 API assertions PASS**, one saved-data braking arithmetic PASS; two native width slices each originally8PASS/2FAIL. Each has one real geometry FAIL and one reset harness-oracle FAIL. Addressed import/reset-only readback subsequently3PASS/width (includes duplicate page/request checks). Counts overlap and are not extra independent cases. Genuine Worker starts4 total, bounded5s cold/hot perwidth; native page exceptions/requestfailures0/0. Frozen cold A remains unchanged by second hot run and failed import.

The reset adapter incorrectly required an export button to be disabled; source does not promise that UI state. Corrected actual readback proves current label/time/diagnostics reset and A preserved, no extra Worker. Original FAIL rows remain. Two private API exceptions are retained: guessed nonexistent `maneuver` role corrected to actual resolved engine IDs; missing `gate` variable after slicing corrected only in remaining graph probes. Passed physical oracles were not rerun. Source fingerprint reader initially concatenated contract rows with runtime rows; exact package helper clarified separate recipes, hashes matched; no product mismatch.

Four current fingerprints equal captured old baseline **without deriving new expected from current code**: timed225/timed525, uploaded Pony500, Ermak20. State minus textualconstraints plus **all** metrics/channels/buckets included. Exact uploaded file identities independently matched. All81 original full golden expected hashes are unchanged versus0aa; captured historical runner blob/source and projection file verified. Historical81 execution and mandatory481unit/49browser+1skip/type/build/reference/bootstrap/cloud26 remain **inherited**, not81 freshly measured QA passes. No weaker golden replacement is claimed. Developer report read only after own measurements. Additional observer text/eventcounts are distinct from physical comparison.

**NOT RUN / OUT:** physical tablet/Xiaomi/OS gesture, Unity/server, numerical wear, H₂always-on governor fix, all-hullhour/12h/fullguard, public/native/main/base/merge gates. Authored old-no-observation control verifies honest absence; it is not a fabricated historical measurement. Label-only next candidate requires separate PM release; original FAIL is immutable.

Signed `/root/ship_fitting_qa`, independent QA; Codex, exact deployment ID unavailable;2026-10-07. [Case ledger](case-ledger.json), [manifest](evidence-manifest.json), `seal-receipt.json` contain exact hashes. Current execution complete; source freeze released to already-authorized label-only fix, no more probes this call.
