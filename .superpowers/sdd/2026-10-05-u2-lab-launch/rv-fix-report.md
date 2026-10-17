# Developer affected scoped Review fixes

Status DONE_WITH_CONCERNS — completed candidate for same independent QA/scoped Review closure;
Developer does not declare acceptance or merge readiness. Role Developer, PM dispatch selected/requested
`gpt-6.1-sol` / reasoning `high`; provider deployment ID unavailable. Date2026-10-05.
Isolated branch `fix/product-qa`, base `764c607e388e148cf2c3ca41b55f36e3b673322d`.
Final candidate is the commit containing this report. Original feature/runtime QA checkout untouched.
Approved authority: `docs/product/power-heat-lab-v0.1.md`,
`docs/verification/power-heat-v0.1-contract.md` P4/P5/P7/P12, `.agents/DEV_ROLE.md`.
Scope: only named Review B1–B3; prior7 source QA fixes and F4 tank-schema adjacent fix retained.
Affected4path+exact VC fingerprint `3c50d8d27786ba102263d9d66d60cb42ab8b802dd0dfcfa09d83efd4d38c308c`; path/blob manifest `rv-fix-evidence/fingerprint.txt`.
No product WHAT, SI TTX, operator dt/duration, schema ID character restrictions, source-authority,
managed framework, task queues or Memory Bank changes.

## RED → GREEN

| Review risk | RED on base / cause | Fix and actual GREEN |
|---|---|---|
| B1 / P5 numerical radiation convergence | C100J/K, εA1m², initial500K, background100K, duration10s. dt10 vs dt5 integrated radiation energy differs9.590108%; single unconstrained RK4 interval unstable/inaccurate. Durable test FAIL before fix. | Bound internal RK4 interval by local thermal Jacobian (dimensionless0.05) and temperature-change scale (2%). Recompute actual source/load/device flows on each internal interval; base dt retained. CoarseT342.2766379236K vs refineddt.001 T342.2766380667K; energy15772.336207637J. Half-step relative energy3.17265e−11, refined9.07085e−10, residual6.25e−13J |
| B2 / P4/P7 tank protection within dt | Supplied physical tank high500K, initial499K, C100, hull/gen100W, η1, Q0, dt2: coarseT501K/fuel9.8kg vs refinedT500K/fuel9.9kg. All shared consumers continued until end ofdt. Durable generator and shared-consumer cases FAIL before fix. | Include supplied tank critical low/high or stopped restartLow/restartHigh in the existing boundary solver, keyed by existing `tank:<id>` state. No new protection policy. CoarseT500K/fuel9.9kg; exactstop t1s; gen+engine sharedfuel9.8kg; passive-cooling restart t0.3224827682965s vs refined0.3224827687561s; fuel9.8644965536593 vs9.8644965537515kg; residual≤1e−6J |
| B3 / P12 imported text rendered as HTML | Named `configuration()` model-note interpolated raw imported `m.tankId` into innerHTML. Harmless `<b>tank</b> "quoted"` advanced JSON browser regression RED: literal ID not present (markup interpreted). | Route tankId through existing `html()` escape. Actual Chromium advanced JSON regression GREEN: accepted arbitrary ID displays literal text and creates0b elements. No ID character whitelist, no active script required |

Initial numeric command `npx vitest run tests/review-regressions.test.ts` RED3/3.
B1 isolated testGREEN, then B2 full3numeric testsGREEN; model probe measurement in
`rv-fix-evidence/model-probes.mjs/json`. B3 harmless browser testRED before source escaping, GREENafterbuild.
Parent corrected B3 method after an earlier already-running command completed: active-payload attempt
is historical only; its fixture was immediately removed and never rerun after correction. Delivered tests,
evidence and verification use harmless markup and quotes; no script execution assertion/payload retained.

## Final verification (unchanged final production code)

```sh
npx vitest run tests/review-regressions.test.ts
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium npx playwright test -g RV-B3
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium bash .agents/project/verify.sh
U2_PERFORMANCE_REPORT=.superpowers/sdd/2026-10-05-u2-lab-launch/rv-fix-evidence/long-kernel.json timeout 240 npm run test:long
node .superpowers/sdd/2026-10-05-u2-lab-launch/rv-fix-evidence/model-probes.mjs
git diff --check
```

Fresh full project verify exit0:54unit tests/11files PASS, typecheck/Vite buildPASS,
5browserPASS and1screenshot-only SKIPPED (U2_SCREENSHOTS unset),26bootstrapPASS,
reference/project structure and shell syntaxPASS. This includes prior schema strictness/optional tanks,
within-dt Background ramp/hot margin, motor/H₂/TI ledger, joint shared-stock permutation, balances,
nonlinear convergence, cumulative refuel and immutable replay/JSON/CSV/A–B, S/M short matrix,
measured64/98-channel retention, synthetic12h/4.32M ticks and event/ACK caps.
Actual Chromium153.0.8010.0. Late real Worker40000buckets/42channels/dt1s: pauseACK0.7ms,
cancelACK0.1ms, correlated ACK and≤1unacked chunk; acceleration does not alter kernel dt.
B3 literal markup regression itself1PASS standalone, alsoPASS in fresh final fullbrowser suite.

Full physical12h real S mining/dt0.01 PASS exit0, kernel130.373945s, Vitest130.76s within timeout240:
4,320,033ticks;43,200buckets;42channels;87,782,400B estimated retained telemetry;
work287.999999985SCU; fuel5299.332360088kg; Tmax492.052936788K;
target809.840031992s/sortie819.840031992s; residual−0.072141391J /
64,107,202,559.877J source = 1.12532427e-12 relative (<1e−9).
Raw fresh evidence `rv-fix-evidence/long-kernel.json`. Full metrics/checkpoints and channel declarations
are preserved; 33 extra event-aligned ticks are not a changed base dt. Source baseline uses passive aux0,
no Background and never reaches tank critical temperature in this run, so unchanged totals are expected;
large-dt radiation and tank stop/restart behavior are proved separately by affected regressions.
Declared reference host from PM: Xeon Platinum8573C,9logical CPUs,cgroup8GiB,node24.19/npm11.9.

## Limits / concerns

Source/code tests complete; same independent QA/RV must verify exact published candidate and closeB1–B3.
Local Developer replay is not an independent verifier verdict. Numerical guard for unresolved event boundaries
remains explicit; no silent dt clamp/residual or parameter changes. No screenshot regeneration/layout changes.
Physical second LAN device, native/operator hooks, livebd/Dolt, remoteCI, GitHub publish, finalize/merge NOT RUN.
No runtime library/network dependencies added. Production source changes restricted to
`src/model/step.ts` and one escaped interpolation in `src/app/main.ts`.
