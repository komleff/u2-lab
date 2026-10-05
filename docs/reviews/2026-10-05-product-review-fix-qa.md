# QA EXECUTION — Power & Heat v0.1 scoped Review fixes

Result: **PASS for the affected product surface**. Independent runtime probes close Review B1–B3 on the tested candidate. Necessary numerical, Background, shared-ledger, schema, runner, retention and browser regressions pass, including a newly executed physical12h replay on the changed kernel. Same-session Reviewer owns final scoped Review verdict; this report does not grant bootstrap/operator acceptance or merge readiness.

- Role: independent QA, installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5 reused after the single scoped Code Review, no new agents/launches.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `a450d45058890cd9ac6eaeac5aa34b2f1cc84859`; tree `d8ba3c0b24532dcf98c8d75bafc083be11432c3c`; branch `feat/power-heat-lab`; exact tested worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Product source: `docs/product/power-heat-lab-v0.1.md`, SHA256 `61384c1829c6d66d54b3588fac203b1a5fb5f84205f0c626d739bd9af128ec40`.
- Entire unchanged Verification Contract: `docs/verification/power-heat-v0.1-contract.md`, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`, exact bytes below including finalLF.
- Content-Fingerprint: `aae87f0318298e6ca957b928c549a59d32c971cd24d0765ac9ef0186b105d60c`; explicit57-path current package below. Original55 package paths retained; new affected Developer report and `tests/review-regressions.test.ts` added.
- Four-path scoped fix+entire-VC fingerprint independently reproduced: `3c50d8d27786ba102263d9d66d60cb42ab8b802dd0dfcfa09d83efd4d38c308c` for `src/app/main.ts`, `src/model/step.ts`, `tests/browser/lab.spec.ts`, `tests/review-regressions.test.ts`.

The original31 cases were derived from spec/VC before runtime inspection. For this recheck, source numeric/P4/P7/P12 expectations and the preserved Review's literal B1/B2/B3 inputs determine the independent probes; Developer explanations/tests are inspected as implementation evidence rather than the oracle. All new fixtures validate with complete synthetic experimental provenance, valid dry material bill and unchanged SI schema. They are not U2 TTX. QA wrote only ignored transient probes/evidence and this report: no production fixes/durable tests/commits, GitHub/livebd/Dolt/database/applier writes, native/operator work or subagents.

## Immutable history / current scope

| Historical report | Preserved status and exact SHA256 |
|---|---|
| `2026-10-05-product-qa.md` | Original5956 **FAIL7**; `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` |
| `2026-10-05-product-qa-affected.md` |56a5 **PASS affected surface**, original7 + adjacent supplied tank schema closed; `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` |
| `2026-10-05-product-code-review.md` |afcbdc0 **CHANGES_REQUESTED3 BLOCKER**, B1/B2 numerical/physical tank behavior and B3 imported markup display; `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6` |

All three preserved reports remain byte-identical. Their FAIL/CHANGES_REQUESTED observations are not retroactively relabeled. Current affected runtime is DeveloperRVfix9a2c7a2 published by PM as a450d450. QA independently confirms only `src/model/step.ts` and `src/app/main.ts` production blobs changed relative to56a5; source spec/VC/TTX/configuration/base dt/ID policy did not change. New source uses bounded internal integration and physical tank event boundaries and escapes the existing tankId output. The B1 kernel change requires fresh physical evidence; no e91/56a5 byte-equivalence transfer substitutes for this current replay.

## Affected case matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| QB1 / B1 original valid cooling | P5/P8 + Numerical acceptance | Independent valid C100J/K,dry1kg×100,area1m²,T500K,background100K,empty modules/tanks/loads,η1,Q100J; integrate10s using dt10,5 and0.001; sum actual radiationNetW×dt | PASS, closed | CoarseT342.27663792362966K,half342.27663792863365K,refined342.2766380666977K; radiation15772.336207637034/15772.336207136634/15772.33619333018J. Half-step relative integrated-energy difference3.172645703e−11,refined9.070852615e−10≤0.001. Residual6.25e−13J. Original9.5901% divergence eliminated without changing parameter/base dt/tolerance. |
| QB1 adjacent signed incoming radiation | P5/P8 + Numerical acceptance | Same valid fixture, initial100K/background500K; dt10/5/0.001 actual replay | PASS | Integrated radiation−30639.990388131126J,coarseT406.3999038813113K; half relative1.99e−11/refined1.63e−9≤0.001; residual−2.11e−12J. Sign remains inward and no negative-temperature clamp masks divergence. |
| QB2 / B2 exact original physical hot tank stop | P4/P7 | Valid C100,T499,Q0,hull/gen100W,η1,tank10kg/1000Jkg; physical gate100/110/120/450/480/500K while module high570; replay2s atdt2/1/0.001 | PASS, closed | Tank stops exactly1s; coarse/half deliver100J,finalT500K/fuel9.9kg; refinedfuel9.900000000000233kg; residual0. No extra100J/0.1kg past500K. |
| QB2 shared generator+engine+H₂ cooler / permutation | P4/P6/P7 | Same supplied gate and actual sharedhydrogen tank,gen100W,engine1N/α0.1/η1,cooler20W/q1000/aux0;dt2/refined0.001 and reverse module order | PASS | Net host80W→500K at1.25s; generator125J,cooling25J,remainingfuel9.725kg vsrefined9.72500000000844kg. All consumers stop together; fuel ledger (.1+.1+.02)kg/s×1.25s=.275kg. PermutationΔT0/Δfuel0,residual0. |
| QB2 supplied hot tank restart inside passive-cooling dt | P4/P7 | Initial501K,radiationarea1,physicalrestartHigh480K;2s coarse/refined0.001 | PASS | Restart0.6419023333688407s vsrefined0.6419023344551865s; fuel9.864190233336885 vs9.864190233445836kg; residual1.28e−13J. Remaining eligible interval consumes fuel after actual restart. |
| QB2 cold stop/restart analytic + source event tolerance | P4/P7 + Numerical acceptance | Initial249K,physical low250/restartLow260/restartHigh550/high600; direct100W heat,C100,area0,gen/hull100W;12s coarse/half6/refined0.001 | PASS for contract criterion | Coldstop at0,coarse andhalf restart11.000000000003638s,deliver99.9999999996362J/fuel9.900000000000365kg/residual0. Refined restart11.000999999999342s (one refined base dt later),deliver99.9J/fuel9.9001kg; actual flows match100W×eligible interval, with no post-stop/pre-restart extra delivery. Contract permits gate transition≤one base dt; see oracle clarification below. |
| QB3 / B3 harmless identifier rendered literally | P12 | Independent valid renamed tank/reference/fuel-key fixture `<b>tank</b> "quoted"`; fresh Chromium static production build; advancedJSON Apply; inspect literal notes and DOM before/after | PASS, closed | ID accepted; literal text present in2 module notes; `#modules b` count0; all module descendant elements68before/68after; no page exceptions. Quotation marks preserved. No active executable payload used. |
| Original within-dt Background / thermal governor | P7; originalF1/F2 | Reused independent IP04/IP05/IP14 plus fresh current unit fixtures | PASS | Charging coarseBG1.7516572715J vsfine1.7517768507J; cooling crossingBG0.7174916828866J; hot/cold restart sequence and Active belowbg floors unchanged. |
| Electric/shared ledgers / device limits / dry capacity | P3/P4/P5/P6/P8; originalF6 | Reused IP01–03/09/13/15 plus fresh analytic/boundary units | PASS | SharedH₂ budget/permutation, protected allocation, no-powerH₂,finitebuffer,TI movedheat+work,PV40W=10electric+30host; radiator10J→hostT+0.1K and explicit radiatorHostW10,residual0. Dry cargo isolation and signed radiation preserved. |
| Strict schema / supplied and optional tank gate | P12; originalF4+adjacent | Fresh independent14-case validation+createRun group and IP07/10/17 | PASS | Prior numeric-string/missing mandatory/nonfinite/null/array/hysteresis errors reject with path+reason before run; optional tank gate/workLow absence and full valid gates accept; shippedS/M remain valid experimental provenance. |
| Initial peak / immutable replay / resource service / IO/A–B | P9/P11/P12/P13; originalF5 | Fresh IP08/11/16/17; unit/browser groups | PASS | Cooling-only initial/max500K preserved; full/chunked state/metrics exact, cumulative refuel0.8kg; actual8h/dt1 replay28803ticks/work192/fuel3532.888240kg; target809.840s vsown-sortie819.840s; immutable result and normalized JSON/export metadata retained. |
| ACK/backpressure/cancel/reset/stale-run | P10; originalF3 | Fresh IP06,unit protocol/control fixtures,real late Worker browser | PASS | Cancelled step remains0.1s/1chunk aftermatching delayedACK; stale/wrongACK protection and≤1slot remain. Actual late40000buckets/42channels/dt1 pause0.1ms/cancel0.1ms with missingtelemetryACK and matchingcontrolACK. |
| Retained storage/event budget | P10; originalF7 | Fresh independent64/98-channel representation+GC measurements and postmerge refill nearmax; current synthetic4.32M tick fixture | PASS |64×50000 payload76800000+heap34690736=111490736B<134217728; admitted98 after50000samples retains25000buckets/75818984B. Nearmax79510samples/cadence2/39755buckets payload93503760+heap27059464=120563224B<128MiB.20000events/dropped1001 with first128+last19872; synthetic64/4.32M→43200buckets/110592000estimatedB. |
| Fresh physical12h current kernel | P4/P9/P10/P13 | Independently executed realS mining dt0.01 with bounded240s; sequential before browser and after other computation | PASS |4320033ticks,43200buckets,42channels,87782400estimatedB;kernelwall134916.347429ms,Vitesttest134923ms; usefulwork287.99999998510106,fuel5299.332360088376kg,Tmax492.052936788315K; residual−0.07214139105025236J/source64107202559.87655J≈1.1253e−12 relative. Fresh evidence is current a450d450. |

Cold restart oracle clarification: the first transient harness asserted coarse and refined fuel equality within1e−6kg, then provisionally applied a radiation half-step ratio to this nonradiative event transition. Those assertions were stricter/different than the explicit source allowance for thermal-gate timing. Raw provisional harness outputs remain in `review-probes-initial-harness.json` and `review-probes-initial-half-comparison.json`. Final source-derived oracle checks coarse andhalf against analytic11s restart/100J delivery, refined gate timing within its own0.001s base dt and exact100W flow over its observed eligible interval. Current observed refined99.9J is reported, not hidden or forced to100J. Nonlinear radiative energy convergence is separately proved by actual QB1 cooling/heating integrations under unchanged≤0.1% threshold. No production FAIL is downgraded or source/tolerance rewritten.

## Actual commands / execution evidence

Every command executed from the exact current worktree above; logs/JSON under `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/a450d450/`. Probe JSON verdicts are read independently; some reused harnesses capture errors and exit0, so exit alone is insufficient.

| Command | Actual result |
|---|---|
| `node <ignoreda450>/review-probes.mjs` | Final6/6 independent valid numeric/thermal probes PASS; provisional oracle correction explicitly documented above |
| `timeout 120 npm run typecheck` |exit0 PASS |
| `U2_RETENTION_REPORT=<ignoreda450>/retention-unit.json timeout 120 npm test` |exit0,54tests/11files PASS; includes Review3numeric durable regressions and prior source fixes |
| `timeout 120 npm run build` |exit0 PASS;Vite local production assets |
| `timeout 120 node --expose-gc <ignoreda450>/independent-probes.mjs` |18/18 behavioral PASS; original7 + necessary adjacent numeric/ledger/replay/retention |
| `timeout 120 node <ignoreda450>/schema-adjacent.mjs` |14/14 schema validation+run rejection/positive guards PASS |
| `timeout 120 node --expose-gc <ignoreda450>/retained-near-max.mjs` |exit0 PASS;live98-channel buckets aftermerge/refill retained120563224B |
| `U2_PERFORMANCE_REPORT=<ignoreda450>/long-kernel-fresh.json timeout 240 npm run test:long` |exit0 fresh1real12h test PASS;kernel134.916s,totalVitest135.24s |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium U2_BROWSER_REPORT=<ignoreda450>/browser-fresh.json timeout 120 npm run test:browser` |exit0,5PASS/1screenshot-onlySKIP;freshactualChromium153.0.8010.0 |
| Same actual Chromium env + `timeout 120 node <ignoreda450>/harmless-import-browser.mjs` |exit0,independent QB3PASS;Pythonstaticdist HTTP127.0.0.1:4174;servers/browser closed afterward |

Declared host unchanged: IntelXeonPlatinum8573C,9logicalCPUs,cgroup8GiB,Node24.19.0;Chromium153.0.8010.0. Base physicaldt remains0.01 in the long replay;33 extra event-aligned ticks are explicit, not a new userdt. Browser regression runs after long computation, so benchmark/late-control timings are not polluted by concurrent benchmark loads. Command→matching worker acknowledgement latency is measured;0.1ms is browser timer resolution, not a zero-latency claim.

Storage proof remains measured live typed-array payload + GC-stabilized retained-heap/ArrayBuffer delta, not `.bytes` alone or globalRSS. Nearmax checks total79510physicalsamples preserved aftermerge/refill. Dynamic98channels include2explicitledgerchannels. Browser heap snapshot/global baseline/plot copies/transient allocation are separate; no new global128MiB requirement. The original64-channel PASS remains independently refreshed. Fresh current physical replay is separate from the64-channel synthetic fixture and42-channel real-browser late-control fixture.

## NOT TESTED / remaining gates

- Physical second LAN client and actual LAN-IP browser access NOT RUN by this QA; local static browser contexts are one host. No physicalLAN2 claim.
- Combined real-browser64channels/dt0.01 late-control replay and browser-specific retained heap snapshot NOT RUN; separate surfaces are disclosed above. Screenshot regeneration NOT RUN; one existing screenshot-only case SKIPPED with U2_SCREENSHOTS unset.
- RemoteCI not independently fetched/run by QA; supplied PM/Developer metadata is not substituted for actual QA execution.
- Native/operator hooks, liveBeads/Dolt/import/export/auth/restore/re-export/finalize/applier mutations, operator acceptance and merge NOT RUN; B0/B6/B8 remain open and historical auth FAIL preserved. Pending intents are not canonical closures.
- Full authoritative material/slot/SKU/canon closure remains a source gap; current S/M are explicitly experimental. Excluded detector/gameplay/economy/fullflight/privateGDD scope not expanded.
- Same-session final scoped Reviewer closure of B1–B3 remains owned by RV. This PASS is affected PRODUCT verification, not full bootstrap/readiness approval or a new whole-branch audit.

## Tested-Paths / canonical binding

Canonical SHA256: LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below followed by entire exact VC bytes including finalLF, no fences/markers. All57 Git blobs independently equal tested worktree bytes. Original55 package preserved with two material affected additions; historical/documentation/checkpoint/wiring rows bind preservation/inherited surface rather than claiming new live/native/remote execution. QA reports themselves, transient evidence/screenshots and PM remote metadata are excluded. Scope is the tested product surface, not full bootstrap acceptance.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-report.md` | `e883f5cfed153698eff907ee124ff4a4baaf9d1c` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/runtime-report.md` | `837a53fbb54817e971817884af36a9033bd3cbed` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/rv-fix-report.md` | `ac6fe34c9f7072aae44492baffd010c617452e6e` |
| `README.md` | `5b538b06b50719e7a900bc6057f84db32b94acb4` |
| `data/catalog/m-civilian.json` | `beeb0b2ca9fd982022b87e87b7f134e99523f7e2` |
| `data/catalog/modules.json` | `4d67370d31e238bc6b73f3166c141361e937216d` |
| `data/catalog/s-civilian.json` | `4fe437058d9b7d8643b57a1357af1b7d4d8a1ea2` |
| `data/scenarios/mining.json` | `336d956828428c768f0af36fe4b3393a54e98e38` |
| `docs/experiments/first-matrix-results.json` | `de0f93def32b0820dc9809b14131f859cc751b08` |
| `docs/experiments/first-matrix.md` | `939e0c4a6b309ecec806c57f831660050d79353d` |
| `docs/experiments/parameter-intake.json` | `56f2ad10c26f47ed92f393d7c684bbcaff49a2c9` |
| `docs/experiments/parameter-intake.md` | `ef65a3d6944bd6618457073a2fd3b804cc1dee55` |
| `docs/product/power-heat-lab-v0.1.md` | `7fb875dc5b4a7c34ae13ba2e9c297c57c42103ba` |
| `docs/user/local-network.md` | `f02e86b0cdea963d190b41ec87f17748aee573dd` |
| `docs/verification/beads-prepared-checkpoint.jsonl` | `a2878ae959783dce24b119a24a3ad0760f8abe01` |
| `docs/verification/power-heat-v0.1-contract.md` | `4276fff6498f85ba84912105add8f415035867c5` |
| `index.html` | `efcb4db2e7496e7b4be2469766af198001200540` |
| `package-lock.json` | `abf726f701e7847f4add67924bca11f4e256e940` |
| `package.json` | `b23b63d705bc2efa3802a518f445e24229c69590` |
| `playwright.config.ts` | `7640eddd834600b7d75331c878a6eefad3d0e5ad` |
| `scripts/lib/bd-apply-engine.mjs` | `cf0590ef11ecfee75695ca7dd11cb312417aa6d1` |
| `src/app/charts.ts` | `a068ec31eec35cd288525c77e83cd30e77eee695` |
| `src/app/compare.ts` | `03ba109855b80e9628a8055021ff73ac9a311540` |
| `src/app/main.ts` | `855e4091df7d657aff0b03ed40b57bf66af2e050` |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/io/json.ts` | `4d0b518c97bee32bcd0bd9a9d6ac05b603a88cb3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `60b40f07d897a2cab1434bb5624f6007ee30d880` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/browser/lab.spec.ts` | `76d7fd4026b7e18f0a90a0dc223438c4a55efe7b` |
| `tests/catalog.test.ts` | `d03ac5f5af7a0348937acd91342a41b2cc7c9398` |
| `tests/io.test.ts` | `f4c14b9770b215e9098581c0f51f5b43a2c0a003` |
| `tests/long-kernel.test.ts` | `c72942369330adde06d10272a196890114bf7d4e` |
| `tests/matrix.test.ts` | `a24aa01131860590d54ea7a5df5d649d8ed95d66` |
| `tests/metrics.test.ts` | `9e29a208d74eace0cc5bd7b103a3a7edec9c9691` |
| `tests/model/boundaries.test.ts` | `a3b9f1e160d43f2da39bde28bf9e96240e0d8ae9` |
| `tests/model/kernel.test.ts` | `e9526f56158bc080641a193864d0f7c3628c5638` |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` |
| `tests/qa-regressions.test.ts` | `d9c2c3f954d211815c267a161d66072563e97828` |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` |
| `tests/retention-memory.test.ts` | `4d2b7b8c3df1c7f96fa65c3117a61276b62e70f8` |
| `tests/review-regressions.test.ts` | `cbcec8a835be44f56e9fcfe4d6bd0a97f760de2f` |
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

## Frozen execution artifacts

Current ignored evidence path: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/a450d450/`; prior5956/e91/56a5 artifacts remain historical. Auxiliary execution hashes below do not replace the canonical Git-blob+entire-VC primitive. Full current evidence inventory is `execution-evidence-digests.json`.

| Evidence file | SHA256 |
|---|---|
| `review-probes.mjs` | `925c6401c7a03860ac2931e6ca7b08d05fa4fab780bfca61939e9cdcb4986ff1` |
| `review-probes.json` | `b1a4d956015bf3931d55bc45871498ebbaab3b48f88f278a2908dceab0c93f06` |
| `review-probes-initial-harness.json` | `0842ee1cc79712da9a7ad1a8b5c1ee94b15ddc2c4472906a0357a11d30598d1f` |
| `review-probes-initial-half-comparison.json` | `2d86d645b188d1f63ba715b048352b3ce61dd981ec1fdd9c8f2001634351081a` |
| `harmless-id-spec.json` | `346f2cf7739a4d9929a1334d0451a8ea996fd14962b50ff172bf01296acbabfa` |
| `harmless-import-browser.mjs` | `a751e81dd4c57df0efe72fb3fd8cef0710306130ec73c341722e047246ae9dc0` |
| `harmless-import-browser.json` | `e28f056b1be8e56c8601de98f2f888bdf0e6ca7c18dc0a7dd79dbec3fcdeb1cd` |
| `independent-probes.json` | `6eacb9b195ebef6e855bce76f19194b24327a9d157b95cdd679754a0e79bf52a` |
| `schema-adjacent.json` | `bb917fc0274aac6c81d6d894c4179b6e9a1c66adad33046de5b84a3ed2ab50f9` |
| `retained-boundary.json` | `abc27df338952a16896d51eee26e9fe10663778a46a2de6757590ddd5db755b9` |
| `retained-near-max.json` | `5bb959ea3e6843b58962894c2731c515a89d443989649b4b0d9b5d324e3bc443` |
| `retention-unit.json` | `a6463b5e508e835bed5536ac432d784c74f769e133d7b4796e3751e6ec2fb791` |
| `long-kernel-fresh.json` | `11b98dc73ae04f23901579680b8535b0221da95e38813248c2d5ad8d9c878167` |
| `long-kernel-fresh.log` | `8870ff7edeb1fc1b85bd59910b6d4773b0787674900b675fd0ff24b04e644dc8` |
| `browser-fresh.json` | `f14e4c2636e53f17ac60bab610a19c3cb51c1a2e24ee0fc316ee5298ef7db891` |
| `browser.log` | `cdbd9d7713a6e2af2bf8799aa3a197e0f575a79707f6741053679db6b9e31346` |
| `commands.json` | `25525da92638c1731938c865b2289c1448f57024c09ee418a94581c20a013cdb` |
| `binding.json` | `27cd7df8f068bafe496fbab579901c8debd392f59c7f4e59c970398f048bcb5a` |

## Exact entire source Verification Contract

```markdown
# Verification Contract — Power & Heat v0.1

Mode: PRODUCT. Independent verifier budget: 5 launches на этот deliverable:
Plan Review, QA, scoped Code Review, резерв affected QA/scoped re-review.
Product source: `../product/power-heat-lab-v0.1.md`; provenance: source-authority/inventory.
Owner принятия: оператор. Runtime implementation начинается после PLAN_READY и согласования.

| AC | Expected / edge / error behavior | Verification / owner task |
|---|---|---|
| P1 | Доступная по LAN static page показывает конфигурацию, графики, события; simulation backend/CDN не нужен | Build + Chromium smoke на адресе хоста; T4/T6 |
| P2 | S baseline и M Civilian имеют обязательные параметры, units, origin/source/model version. Missing authoritative value показывает gap; experimental substitute явно маркирован. M не получается универсальным multiplier S | Schema/unit/provenance fixtures; two runnable presets; T1 |
| P3 | Все electric load идёт через общий stock. Q ∈ [0,Qmax], capacities sum; no source допускается. Protected hull load раньше оборудования, actual allocation не превышает доступное. Direct fuel propulsion независима от электрического дефицита | Analytic energy fixtures: no source/full/empty/partial-step, electric vs chemical drive; T2 |
| P4 | Базовый electric/heat ledger замкнут в заданной numerical tolerance; actual delivered power определяет actual work/heat/fuel, pulse buffers видны только через recharge. Fuel stocks по tankId/species; shared tank имеет единый simultaneous-flow budget. Overflow не создаёт/не удаляет необъяснённую энергию | Synthetic analytic tests; shared generator/engine/cooler midstep H₂ depletion, tank species isolation, permutation invariance; balance residual trace; T2 |
| P5 | Одна T_ship, сухая теплоёмкость без double count/cargo bonus. Radiation имеет outgoing/incoming/net и меняет знак. Exhaust не охлаждает ранее накопленное hull heat | Analytic constant-heat and radiative equilibrium cases; dry-mass/no cargo cases; T2 |
| P6 | Cooling devices соблюдают finite buffer power/capacity, H₂ tank consumption и электрическую цену. Thermoinverter ejects moved heat + work, ограничен hot side; starvation не оставляет бесплатное охлаждение | Device fixtures with simultaneous stock/power/thermal limits; T2 |
| P7 | Active/Background и Civilian governor следуют U2. Background уступает active/recharge, питается только free source headroom, не battery stock; eligibility при 80% SoC,20% usable fuel и10 K hot margin пересчитывается внутри dt. Active/protected могут тратить ниже bg floors; общего clamp нет. Thermal stop/restart в hot/cold имеет hysteresis, без chatter | Start-boundary и within-step depletion/heating/headroom fixtures; source0/bg100W получает0J; Active ниже bg floors; actual cooling power included; T3 |
| P8 | Effective background и direct input раздельны; source ID не разрешает двойной учёт. PV electric output + heat не превышают absorbed input в baseline. Linear fog только named experiment, default T^4 | Environment double-count rejection, dark/solar/hot/cold, negative net exchange fixtures; T2/T3 |
| P9 | Длительность и workload определяет сценарий. 5/10 мин и 8/12 часов replay сохраняет state; service явно меняет stocks. Cargo full останавливает mining, отдых не равен full reset; useful-action recovery не требует 100% | Scenario replay + repeated work/return/unload/refuel fixture; identical trace for chunked/full runner; T4/T6 |
| P10 | Pause/step/accelerate/cancel UI не меняют kernel dt/results. После reset/import старые worker messages не меняют новый run. Incremental metrics, bounded telemetry/events и ack backpressure сохраняют доступность UI длинного опыта; aggregation/retention видны в export |12h/dt0.01s/64-channel fixture:≤50000 buckets,≤128 MiB telemetry,≤20000 event records,≤1 unacked chunk; controls after≥40000 buckets ack≤500ms на declared host; replay equivalence/stale-run tests; T4 |
| P11 | A/B показывает одинаковую задачу и own-full-sortie; версии моделей/параметров и различия видимы. Re-run одного run spec воспроизводит trace/events/metrics | Comparable target-work vs own-capacity fixtures, immutable run tests, A/B browser smoke; T5 |
| P12 | JSON round trip сохраняет run spec и provenance. Finite dt/duration/Qmax/C_ship>0, Kelvin temperature≥0, initial stocks∈[0,capacity], valid tank/species refs обязательны. Unsupported version/nonfinite/invalid unit/out-of-range показывают path+reason до старта без скрытого clamp. CSV содержит SI units/timestamps и explicit retention/cadence | Zero/negative/nonfinite aggregates/time, initial overfill, wrong tank/species rejection; round trip/CSV metadata/escaping; T1/T5 |
| P13 | Графики и event log показывают actual limiting cause, source/sink channels и resources; downtime/useful work/next-action recovery вычисляются из событий и actual work | Trace aggregation + first constraint/recovery fixture; UI diagnostic smoke; T4/T5 |
| P14 | В v0.1 нет detector sensitivity/radar/detection tuning; исходные energy/heat данные сохранены для дальнейшей работы | Scope review и UI smoke, T6 |

## Numerical acceptance

Тесты используют синтетические SI fixtures, не выдают их числа за ТТХ U2.
Constant-flow analytic energy/heat cases: absolute tolerance 1e-6 J, floating tolerance
1e-9 relative. Для nonlinear radiation/device cycles: half-step convergence ≤0.1% для
integrated energy/peak temperature; переход thermal gate — не дальше одного base dt.
Для replay с тем же dt: одинаковые timestamps/events и значения в floating tolerance.
Если solver не выполняет tolerance, исправляется solver/step, а не product TTX для скрытия ошибки.
Экспериментальный закон может иметь явно заявленный дополнительный balance term;
скрытый residual не является разрешённым игровым упрощением.

## QA execution surface

QA получает source + этот contract + кандидат SHA + команды build/typecheck/unit/browser.
Report: Test case | Source AC | Method | Result | Evidence. Missing measurement = NOT RUN.
12h simulated time не означает 12h wall-clock ожидания. Длительный сценарий проверяется
ускоренным kernel replay и browser responsiveness smoke. Second LAN client проверяется
фактически при наличии устройства; localhost не объявляется двумя LAN-клиентами.
Retained plot data —1s deterministic mean/min/max buckets с bounded merge; metrics по всем
physics ticks. Сохраняются первые128/последние19872 events; dropped count явно в UI/CSV.
Исходная resolution и aggregation policy входят в RunResult, replay и comparison metadata.
Long-run performance report фиксирует CPU/browser/catalog/channel count; pause/cancel latency
считается от UI command до matching worker acknowledgement. Slow UI fixture доказывает queue cap.
Protocol correlation: telemetry-ack command содержит(runId,chunkId), control-ack response —
(runId,commandId,control). Пока telemetry chunk не подтверждён, control commands доступны;
stale/duplicate/wrong ACK не освобождает чужой slot и не запускает cancelled work.

## Scoped Code Review contract

Goal: воспроизводимый энерготепловой стенд для настройки модели и ТТХ.
IN: src/model, src/catalog, src/scenarios, src/runner, src/app, import/export, numeric tests,
AC P1–P14, project build/test wiring. Named risks: silent energy double count; wrong units;
source vs experimental confusion; cross-run worker state; long-session state reset.
OUT: U2 gameplay canon redesign, detector tuning, market/economy, full flight integration,
OverGate policy design (имеет отдельный bootstrap contract).
BLOCKER по формуле ADR 3.28/3.29; advisory не расширяет scope автоматически.

## Evidence binding / rollback

Reports указывают role/model, commit, explicit reviewed paths, source contract, content
fingerprint и NOT TESTED. Fingerprint: sorted `path SP git-blob-id LF` + exact bytes
этого contract; head movement само по себе не требует повторного LLM review.
Runtime rollback: revert рабочей feature ветки/PR; exported run versions остаются immutable.
Никакой миграции или перезаписи U2/пользовательских исходных файлов в v0.1 нет.
```
