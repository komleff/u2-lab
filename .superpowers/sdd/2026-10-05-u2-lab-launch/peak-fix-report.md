# Developer QB1/P13 internal peak fix

Status DONE_WITH_CONCERNS — stable candidate for exact affected independent QA/RV;
acceptance/merge readiness not declared. Developer; PM dispatch selected/requested `gpt-6.1-sol`,
reasoning `high`, provider deployment ID unavailable. Date2026-10-05.
Isolated `fix/product-qa` base `806af2ad7341106654b6c55734811f91093f6b42`.
Final source candidate is commit containing this report; PM overlays onto newer820 history.
Original feature/QA checkout unchanged; no reset, source authority/task queue/managed-framework edits.
Authority: approved product spec, unchanged `docs/verification/power-heat-v0.1-contract.md` P13/NAC,
installed DEV_ROLE. Scope one confirmed blocker QB1; no policy/parameter/tolerance changes.
Current8path+exact VC fingerprint `d0b46f628590c49393e39ecead3818aef09faafde6f29919036330f139441fa3`;
manifest `peak-fix-evidence/fingerprint.txt` (QA seven source paths plus new regression test).

## Reproduction and fix

Exact QA fixture SHA256 `b46931e07d8f06620b68852d2e71014cd46fe73e5a3de04032f7e04c5a748275` verified.
QA820 binding and original FAIL retained as `peak-fix-evidence/before-binding.json` /
`before-peak-cycle.json`; identical fixture copy `peak-cycle.mjs`, final actual output `peak-cycle.json`.
Valid dry bill/C100J/K, initial490K, tank high500K, hull/gen250W and η0.5, passive0.01m²,
duration20s: internal solver reaches500K at tankstop then cools. Metrics previously read only end
of base physics tick: dt20→493.83797665K, dt10→497.25151827K, refined.001→499.99996446K.
Half-step relative peak0.00686482>0.001. Initial `tests/peak-cycle.test.ts` RED2/2 confirms
wrong cumulative peak and absent kernel peak result.

Kernel now retains maxTemperatureK from initial state and every actual thermal/resource substep
endpoint, including gate boundaries; StepResult returns this unaveraged scalar. Runner passes it
to updateMetrics, whose cumulative peak feeds existing UI/JSON/A–B snapshots. No averaged telemetry
channel added; channel declaration, source/resource/thermal evolution and allocation unchanged.
Within each constant-flow scalar thermal interval the solution is monotone; peaks at its physical
boundaries survive later cooling. RK4 stage estimates are not treated as physical sample peaks.

Durable GREEN2/2 verifies kernel peak500K, initial-state cooling peak500K and complete valid runs
at dt20/10/.001 with cumulative peak500K despite final<494K. Original exact QA probe nowPASS:
500.00000000000534K /500.00000000000534K /500K;
half-step relativepeak0 and refined1.06866e−14 (<0.001).
Python exact comparison of original/fixed3fixtures confirms identical ticks/finalT/fuel,
integrated source/sink channels, energy residuals and thermal events.

## Actual final verification

```sh
npx vitest run tests/peak-cycle.test.ts
npm run typecheck
npx vitest run tests/peak-cycle.test.ts tests/metrics.test.ts tests/review-regressions.test.ts tests/runner.test.ts
node .superpowers/sdd/2026-10-05-u2-lab-launch/peak-fix-evidence/peak-cycle.mjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium bash .agents/project/verify.sh
U2_PERFORMANCE_REPORT=.superpowers/sdd/2026-10-05-u2-lab-launch/peak-fix-evidence/long-kernel.json timeout 240 npm run test:long
git diff --check
```

Initial first commandRED2/2; final targeted12testsPASS/typecheckPASS. Fresh full project verify exit0:
56unit tests/12filesPASS, typecheck/Vite buildPASS,5browserPASS+1screenshot-onlySKIPPED
(U2_SCREENSHOTS unset),26bootstrap fixturesPASS, structure/shell syntaxPASS. Covers previous
QB source fixes, RV radiation/tank boundaries, unaveraged/cumulative metrics, shared balances,
replay/refuel/A–B/import literal text, S/M matrix,64/98memory and synthetic12h retention.
Actual Chromium153.0.8010.0; real late40k buckets/42channels/dt1 controls: pauseACK1ms/cancelACK0ms.

Fresh full physical12h real S/dt0.01 PASS exit0 within240s: kernel132.595329s,
Vitest132.94s;4,320,033ticks;43,200buckets;42channels;87,782,400B estimated telemetry.
Work287.999999985101SCU,fuel5299.332360088kg,
Tmax492.052936788K,target809.840031992s/sortie819.840031992s.
Residual-0.072141391050J /source64107202559.877J
=1.12532427e-12 relative (<1e−9).
Raw complete metrics/checkpoints: `peak-fix-evidence/long-kernel.json`.
Host per PM: Xeon Platinum8573C,9logical CPUs,cgroup8GiB,node24.19/npm11.9.

## Limits

Developer evidence is not independent acceptance. Same QA/RV must recheck exact published candidate.
No physical second LAN device, native/operator hooks, livebd/Dolt, remoteCI/GitHub publication,
finalize/merge run. No screenshots regenerated or UI layout changes. No new telemetry channel,
TTX/model policy, dt/duration/tolerances, dependency or security payload. Four production paths only:
step.ts/types.ts/metrics.ts/run.ts. All current code tested before report-only write/commit.
