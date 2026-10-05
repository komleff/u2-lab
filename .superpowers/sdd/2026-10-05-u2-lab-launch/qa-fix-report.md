# Developer affected QA fix report

Status: DONE_WITH_CONCERNS — готово к affected independent QA; acceptance/merge readiness не заявляется.
Role: Developer. PM dispatch: selected/requested `gpt-6.1-sol`, reasoning `high`; provider deployment ID unavailable.
Date: 2026-10-05 UTC. Isolated branch `fix/product-qa`, base `5956da89b05bab63fe634bef4d1df13780ec5723`.
Final candidate — commit, содержащий этот report. Original `u2-lab-feature` не изменялся.
Authority: `docs/product/power-heat-lab-v0.1.md`, `docs/verification/power-heat-v0.1-contract.md` P1–P14,
installed `.agents/DEV_ROLE.md`; unchanged approved product WHAT/configuration SI values.
Scoped code/test fingerprint: `50b8f3411c4addaeb2716d56920739932a28f294ef848389e89451a683982770`. Exact path/blob manifest: `qa-fix-evidence/fingerprint.txt`.

## Reproduction and fixes

Первоначальный `npx vitest run tests/qa-regressions.test.ts` на base: RED6/6.
После исправлений: GREEN6/6; дополнительные3 affected regressions и1 measured-memory regression PASS.

| QA issue / source | Root cause and fix | Actual evidence |
|---|---|---|
| IP04 / P7 | SoC eligibility frozen at dt start. Split at80% crossing in both directions; internally recompute continuous BG ramp after at most0.00025 change in share. Base physics dt and product parameters unchanged. | BG coarse1.7516572715J vs refined1.7517768507J; Q87.2483427285J. Analytic continuous Q100−20exp(−5×0.09) error<0.001J, integrated BG error<0.1%; residual<1e−7J |
| IP05 / P7 | Hot10K boundary watched only while BG already running. Watch requested BG in both directions; cross the strict numerical eligibility margin with a cooling-rate-based interval. | BG coarse0.7174916828866J vs refined0.7174916828859J; T499.746386495654K. Slow exact-margin crossing regression avoids stalled/chattering integration |
| IP06 / P10 | Cancel left `stepping=true` behind held telemetry. Pause/cancel flush queued step. | start→heldchunk→step→cancel→ACK1→pump leaves t0.1, one chunk, correlated cancel ACK |
| IP07 / P12 | Numeric comparisons coerced strings; scenario target/repeat unchecked. Require finite numeric tanks/gates/stocks/target and boolean repeat/service fields. | Four exact rejected repro: tank energy string, gate low string, missing targetWork, string repeat; path+reason and createRun rejection |
| IP08 / P13 | Peak initialized to0 and only end-of-tick temperatures considered. Initialize from initial Kelvin state. | Cooling-only initial500K, final496.9583727761K, peak500K |
| IP13 / P4/P6 | Radiator motor work incorrectly shared H₂ exported auxiliary sink. Split radiator host heat from H₂ auxiliary exhaust; expose `radiatorHostW`, `h2AuxRejectW`. | Zero-area rad: Q−10J, T+0.1K, heatIn10W, residual0. Partial electricity5J becomes5J host heat. H₂ still exports auxiliary work and consumes(q+aux)/qJKg |
| IP18 / P10 (added QA finding) | Numeric buffer estimate omitted actual object/wrapper overhead. Account1024B/bucket conservatively instead of256B; aggregation algorithm unchanged. | RED98channels×50k: actual151,318,080B>134,217,728B, estimate130,400,000B. GREEN max39756, after50k ticks25000 merged buckets, actual121,685,752B. 64channels retains50000 buckets, actual110,776,280B |

New sink/heat telemetry increases default channel count40→42. No fixed channel count is a source requirement.
IP18 original hardcoded assertion96 fails at98 before measuring memory; standalone replay uses actual admitted
count and preserves its measurement/memory criterion. `memory-before.json` retains actual RED;
`memory-probe.json` records actual GREEN. Original probe snapshot/output retains that count-mismatch failure,
not presented as an all-green independent QA verdict. Developer replay is supporting evidence, not independent QA.

## Verification

Commands in this isolated checkout (all final code unchanged after final verify):

```sh
timeout 120 npm ci --no-audit --no-fund --fetch-timeout=20000 --fetch-retries=1
npx vitest run tests/qa-regressions.test.ts tests/retention-memory.test.ts
node --expose-gc .superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-evidence/memory-probe.mjs
node --expose-gc tests/retention-memory.mjs 64
node --expose-gc tests/retention-memory.mjs 98
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium bash .agents/project/verify.sh
git diff --check
```

Fresh final project verify exit0: typecheck PASS;48 unit tests in10files PASS; Vite production build PASS;
4 browser tests PASS,1 screenshot-only case SKIPPED (U2_SCREENSHOTS unset);26 bootstrap fixtures,
reference/project structure and shell syntax PASS. Actual Chromium153.0.8010.0. Late real Worker fixture:
40000buckets,42kernel channels,dt1s, matching pause ACK0.2ms/cancel ACK0.1ms; ≤1unacked chunk.
The final48 tests include unchanged synthetic12h/dt0.01/64-channel4,320,000ticks and43,200buckets
(estimate110,592,000B under128MiB), exact replay, cumulative refuel, balances and nonlinear half-step.
Affected replay snapshot also passed shared H₂ gen+engine+cooler/permutation, power starvation/TI,
PV ledger/radiation convergence, strict negative/doublecount input, immutable JSON/CSV/A–B,
hot/cold gates, and real8h/dt1 S replay:28803ticks,192SCU,fuel3532.888240kg,target809.840s/sortie819.840s.

A full verify attempt initially found fixture-output parsing error due to concurrent Vite HMR-port diagnostics,
not product failure; memory fixture now disables HMR and parses its explicit JSON record. Fresh full verify above PASS.

## Limits / concerns

Full physical12h/dt0.01 benchmark not repeated for this affected fix; prior132.46s evidence remains bound to
its original candidate/channel count. Default S/M contain no Background load and passive radiator aux0;
physical source/resource/thermal dispatch therefore unchanged for that benchmark, but memory estimates/channels
have changed. Fresh affected balances/convergence, S/M short matrix, real8h and synthetic12h retention ran.
Screenshots not regenerated; no new UI layout. Native/operator hooks, physical second LAN device, live bd/Dolt,
remote CI, GitHub publication, acceptance/finalize/merge NOT RUN by Developer. Same independent QA/review
must close source issues; parent PM owns publication. No live task queue/Memory Bank changes.
