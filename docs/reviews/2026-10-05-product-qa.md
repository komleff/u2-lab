# QA EXECUTION — Power & Heat v0.1

Result: **FAIL**. На stable candidate найдены7 воспроизводимых source-AC failures. Passing existing tests/CI не закрывают эти failures. Acceptance и merge readiness не выданы.

- Role: independent QA, installed `.agents/QA_ROLE.md`; PRODUCT launch #2/5, original independent Plan Review #1/5. Эта QA session повторно используется для affected rechecks; новых агентов нет.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high` по PM dispatch; provider deployment ID unavailable.
- Commit: `5956da89b05bab63fe634bef4d1df13780ec5723`; published tree `436d52f934ff3f20684dbde4ced3b9bb21095b19`; branch `feat/power-heat-lab`, worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Source: `docs/product/power-heat-lab-v0.1.md`, SHA256 `61384c1829c6d66d54b3588fac203b1a5fb5f84205f0c626d739bd9af128ec40`; entire exact P1–P14 VC below, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Content-Fingerprint: `c7caa134f8099bf758fb00abde0502894537c71c297341fc10dceb260e659da2`; explicit 51-path package below.

31 cases prepared in primary ignored `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-prepared-cases.md` from spec/VC **before** runtime inspection. Both source files independently byte-identical in preparation and stable feature. Developer report subsequently inspected as implementation evidence, not source oracle. All execution below uses unchanged5956 candidate. QA wrote transient probes/evidence and this report only: no product code fixes, durable tests, commits, GitHub/bd/Dolt mutations, merge or other agents. Exact evidence directory locally ignored and candidate remained clean before this report.

## Reproduced failures

All repros: `node --expose-gc .superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/independent-probes.mjs` from candidate root; individual JSON result determines verdict (harness deliberately captures failures and exits0). Original inputs/scripts/outputs frozen under `qa-evidence/5956da89/`. Constants are synthetic SI, not U2 TTX. `synthetic()` in probe defines C100J/K, T300K, Qmax40+60J, efficiencies1, no hull radiation/load/tanks, baseline module gate150/200/510/570K; each case changes listed fields.

| ID | Source AC | Literal trigger | Expected | Actual on5956 |
|---|---|---|---|---|
| F1 / IP04 | P7 | initialQ79/100J, external100W, Background100W, dt0.1s | Eligibility recomputed after within-dt80% crossing; eligible interval receives nonzero Background from free source | Coarse BG0J,Q89J; refined dt0.0001 BG1.751127971J,Q87.248872029J. Entire coarse interval remains incorrectly disabled. |
| F2 / IP05 | P7 | initialT500.1K, workHigh510K, radiation area1m²/C100J/K/background100K, external100W, Background100W, dt0.01s | BG resumes after cooling through10K hot margin inside dt | Both coarse/refined finalT499.746386496K; coarse BG0J, refined dt0.00001 BG0.717J. Threshold for re-enable omitted. |
| F3 / IP06 | P10 | start(maxSteps1) → pump(chunk1 held) → step(command2) → cancel(command3) → matching telemetry-ack1 → pump | Cancel clears pending step; ACK must not launch cancelled work | Time advances0.1→0.2s; second telemetry chunk emitted after cancel ACK. |
| F4 / IP07 | P12 | Separately set tank.energyJKg=`"43000000"`, module gate.low=`"150"`, delete scenario.targetWork, or set scenario.repeat=`"false"` | Mandatory fields/types rejected with path+reason before run; no coercion | `validateRunSpec(...).ok===true` for all4 invalid inputs. Existing guards reject some numeric strings but omit these fields/types. |
| F5 / IP08 | P13 | Valid cooling-only run initialT500K, area1m²/C100J/K/environment300K, duration=dt0.1s | Peak temperature includes initial state:500K | `maxTemperatureK=496.958372776K`, equal to cooled first tick; initial peak lost. |
| F6 / IP13 | P4/P6 | Powered radiator area0, aux10W, Q100J, C100J/K, T300K, dt1s; no other source/sink | Motor work10J accounted as host heat or an explicitly authorized/output heat-work channel; no hidden rejection | Q90J,T300K, heatIn/out/radiation/exhaust/beam/etc0, yet residual0. All auxHeat is cancelled in constantHeat and treated as hidden outward sink in residual, including radiator motor. No declared active-radiator heat pump/extra sink. |
| F7 / IP18 | P10 | Valid spec produces96 channels (original tank +56 extra physical tanks; one actual kernel tick confirms channels96); allowed duration50000s. Retention50000 buckets, fresh-process GC measurement | Existing retained telemetry≤128MiB for admitted config/duration; budget tracks actual representation, no global RSS requirement | Declared128000000B<134217728B limit; actual typed-array buffers115200000B + retained heap33950000B =149150000B>limit. `maxBuckets=50000` fails to budget wrapper/object overhead. Separate64-channel case remains PASS. |

F1/F2 demonstrate missing within-dt re-enable behavior without changing accepted Background floors. F6 is not a tolerance-only concern: an exact10J disappears from exposed physical ledger. F7 uses the existing128MiB bound and an admitted runtime channel count; no new browser/process RSS bound is introduced. Failures sent promptly to PM; fixes belong to Developer and are not applied here.

## Independent source case matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| Q01 Static independent client | P1 | Build + real Chromium on static HTTP; desktop/mobile views and two local browser contexts | PASS for local surface | IB01/IB06: Python serves dist bound0.0.0.0, Chromium URL127.0.0.1; configuration/4 graphs/events accessible,4 asset requests all same origin, second context remains0s. Physical LAN/IP-client check NOT RUN below. |
| Q02 Runnable S/M provenance | P2 | Shipped JSON validate + preset equality + visible origins | PASS | IP17: both valid, approvedBaseline=false, versions/origins present; α5.65e−7 experimentalX2; S thrust2.95MN/M8.82MN rather than S×4; IB01/02 experimental badge/field origins. |
| Q03 Shared electric stock/capacity | P3 | Independent analytic SI kernel | PASS | IP01:40+60=100J; initial100/source20W/load50W/dt2→Q40J, delivered100J, temperature300.5K, residual0. No source accepted. |
| Q04 Empty/partial protected allocation | P3/P4 | Independent partial depletion + existing empty/load fixtures | PASS | IP01 partial10J yields actual delivery10J/Q0, protected served first; existing tests verify empty/starved work/heat scaling and bounds. |
| Q05 Direct fuel vs electric propulsion | P3 | Synthetic shared engine case + chemical empty-stock fixture | PASS | IP02 engine produces thrust despite empty electrical stock/deficit; native kernel test checks diesel0.565kg and1MN at electricQ0. Electric loads remain allocated from common stock. |
| Q06 Closed electric ledger/overflow | P4 | Analytic loss/overflow/PV tests + independent motor sink probe | FAIL | Loss/overflow cases PASS; F6/IP13 exposes10J hidden active-radiator motor rejection with residual falsely0. |
| Q07 Shared H₂ midstep/permutation | P4/P6 | Independent generator+engine+cooler same tank + species isolation | PASS | IP02:1kg H₂ depleted simultaneously; gen333.333333W/cooling333.333333W average, thrust5/6N, untouched diesel10kg; reversed device order ΔT0/residual0. |
| Q08 Constant heat/dry capacity | P5 | Analytic actual-load heat + dry bill/cargo isolation | PASS | IP01 actual50J host heat/C100→+0.5K; IP09 cargo capacity change leavesT identical; duplicate dry material rejected; shipped dry bill checks pass. Exhaust fixture does not cool prior hull heat. |
| Q09 Signed radiation/convergence | P5/P8 | Independent signed input and half-step replay | PASS | IP09 colder ship net−992.0116W heats; IP15 half-step relativeT3.53e−16/integrated radiation1.06e−14≤0.1%; existing outgoing/incoming separation test PASS. |
| Q10 Finite Heat Buffer | P6 | Independent capacity boundary + existing discharge band | PASS | IP03 buffer5J/100W absorbs only5J; existing release20J fixture and bands PASS. |
| Q11 Powered cooling starvation | P6/P7 | Independent no-power H₂/TI + powered radiator ledger | FAIL | H₂ aux10W atQ0 gives cooling0 and no fuel draw; TI starvation/powered radiator allocation tests PASS. F6 active-radiator delivered motor work has hidden heat sink. |
| Q12 Thermoinverter hot side | P6 | Independent moved+work accounting and finite rejection fixtures | PASS | IP03 tiReject130W=moved heat+delivered work; residual0; existing finite hot-side and starvation fixture PASS. |
| Q13 Background headroom/floors | P7 | Start boundaries/source0/Active below floors | PASS | IP14 source0/bg0 despite full battery; Active initialQ79→69J crosses bg floor legally. Existing fuel20% and Background headroom fixtures PASS. |
| Q14 Within-step eligibility crossing | P7 | Coarse vs independent refined run, charging and cooling | FAIL | F1/F2; existing loss-of-eligibility fuel/hot tests cover only disable, not within-dt re-enable. |
| Q15 Governor/hysteresis | P7 | Idle fuel + independent hot/cold sequence | PASS | IP14 gates [stop,stop,restart,stop,stop,restart] at100/105/110/400/390/379K; no chatter. Existing PV+idle no generator fuel waste and low-band derating PASS. |
| Q16 Environment identity/PV | P8 | Duplicate-input validation + independent PV energy +24-case matrix | PASS | IP10 duplicate background source rejected; IP15 absorbed40W=electric10+heat30W/residual0; defaultT⁴, visible named linear experiment; matrix cold/hot/solar/EM PASS. |
| Q17 Persistent durations/cycles | P9 | Real8h independent and fresh12h physical replay + short matrix | PASS | IP16 real8h/dt1:28803 ticks/work192/fuel3532.888240kg; fresh12h/dt0.01:4320033 ticks/work287.999999985/fuel5299.332360kg. Shared state survives cycles;300s matrix/600s existing runner cases PASS. |
| Q18 Mining/recovery semantics | P9/P13 | Existing cargo/recovery regressions + completed checkpoint replay | PASS | Cargo-full advances to return/unload; next useful action before100%Q; IP16 target809.840032s/sortie819.840032s confirms actual work/full-sortie checkpoints. |
| Q19 Chunked/full determinism | P9/P10/P11 | Independent variable chunk replay + existing Worker controls | PASS | IP11 full vs7-step chunks exact state/metrics; repeated refuel preserves cumulative0.8kg; wall chunk schedule never changes physics dt. |
| Q20 Reset/import stale-run isolation | P10 | Actual browser old-message injection + old-run ACK tests | PASS | IB05 injects old run telemetry time98765 after reset; current UI remains0s. Existing old ACK cannot free new-run slot. |
| Q21 ACK correlation/backpressure | P10 | Existing wrong/old ACK+queue cap + independent cancel/step sequence | FAIL | Slot≤1/wrong ACK guards PASS, but F3 matching delayed ACK runs pending step after cancellation. |
| Q22 Retention/storage/events | P10 |4.32M synthetic64-channel ticks, actual measured representations, larger admitted boundary | FAIL |64-channel50k: numeric76800000B + measured retained heap, combined≈111.48MB<128MiB; EventRetention21001 inputs→20000 records/dropped1001, first128+last19872. F7 valid96-channel case exceeds actual128MiB. |
| Q23 Late-run control latency | P10 | Real Chromium Worker late/missing telemetry ACK + declared host | PASS for measured surface | Fresh existing browser:40000 buckets/40channels/dt1, pause0.2ms/cancel timer reading0ms≤500; matching command IDs2/3.64dt0.01 retention fixture is separate; combined64-channel/dt0.01 real-browser late replay NOT RUN. |
| Q24 A/B own-full-sortie | P11 | Independent completed target/sortie checkpoints + actual A/B UI | PASS | IP16 compares same-task useful work12 at809.840032 vs own-sortie819.840032 and different consumption. IB04 S/M and different env visibly labeled; unfinished14s sorties stay unfinished. |
| Q25 Result immutability | P11/P12 | Actual export before/after config edit + independent frozen snapshots | PASS | IB02 completed result JSON byte-identical after cargo edit, SHA256820a378b9659c73176349d2bcf67df460f52d551a7a7b44c1a9f4f2e7f43ee54; new run uses new spec; A retained. |
| Q26 JSON roundtrip | P12 | Independent serialize/parse + shipped JSON equality | PASS | IP11 parsed JSON normalized exact spec/provenance; IP17 shipped S/M equal serialized presets; IB02 units/model/experimental origin retained. Optional undefined JS properties are not JSON content. |
| Q27 Strict numeric validation | P12 | Independent invalid input matrix | FAIL | Common zero/negative/nonfinite/unit/overfill errors reject with path+reason; F4 numeric tank/gate strings and missing/invalid scenario fields accepted. |
| Q28 Resource references | P12 | Wrong/missing tank/species/overfill/dry aggregate guards | PASS | IP10 bad tank/initial overfill reject; existing H₂ species/unreferenced stock/nonfinite summed capacity tests PASS; valid no-source fixture accepted. |
| Q29 CSV metadata/escaping | P12/P13 | Independent Python csv parser + export fixtures | PASS |12 rows/123 columns, Kelvin/SI timestamp fields and physics dt/retention cadence; complex a,"b" newline event roundtrips through csv.reader; metadata/drop count explicit. |
| Q30 Limiting cause/metrics | P13 | Controlled kernel/metrics cases + actual UI diagnostics | FAIL | Power/fuel/thermal channels and downtime/recovery/checkpoints tested; F5 initial peak temperature absent from reported metric. |
| Q31 Excluded detector scope | P14 | UI/source scope and exports | PASS | IB06 no radar/detector/sensitivity controls; standalone energy/heat/resources exported. No canon approval claimed for experimental presets. |

## Commands and observed results

| Command | Actual result |
|---|---|
| `timeout 120 npm run typecheck` | exit0 |
| `U2_RETENTION_REPORT=<ignored path> timeout 120 npm test` | exit0;8 files/38 tests PASS, includes4.32M-tick64-channel synthetic retention |
| `timeout 120 npm run build` | exit0; local dist assets built |
| `U2_PERFORMANCE_REPORT=<ignored path> timeout 240 npm run test:long` | exit0;1 real physical12h test PASS;125.361s; benchmark run freshly on5956 after final Developer fixes |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<actual153 binary> U2_BROWSER_REPORT=<ignored path> timeout 120 npm run test:browser` | exit0;4 passed/1 screenshot test skipped (avoids overwriting tracked Developer PNGs); separate QA screenshots taken/viewed |
| `node --expose-gc <ignored>/independent-probes.mjs` | harness exit0;18 behavioral probes:11 PASS/7 FAIL; F7 independently measures allocation in fresh process |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<actual153 binary> timeout 90 node <ignored>/browser-probes.mjs` | exit0;6 independent UI probes PASS using Python static dist server |
| Python standard csv parser | exit0; CSV units/metadata/escaping roundtrip PASS |
| Node engine offline pending-note dry-run with `--bd <nonexistent NO_BD>` | exit0;7 planned PENDING notes only, no create/close/update/dependency change, receipt absent; exact original checkpoint SHA256 preserved |

Host: Intel Xeon Platinum8573C,9 logical CPUs, cgroup8GiB; Node24.19.0; Chromium153.0.8010.0. Model radiative-host-ledger-0.1/catalog intake-0.1. Fresh physical S replay40 channels,43,200 buckets,52,531,200 **estimated** retained bytes; residual−0.072141391J /64.107202560GJ source≈1.13e−12. Synthetic64-channel12h/dt0.01 full tick retention and actual late40-channel/dt1 browser control are distinct evidence surfaces. Control latency measured command→matching worker ACK; cancel0ms is timer resolution, not a claim of zero real time.

Independent storage proof uses actual3 Float64Array byteLengths per bucket plus GC-stabilized Node/V8 retained-heap delta, not declared `.bytes` alone.64-channel/max50k payload76.8MB; heap≈34.68MB; actual≈111.48MB PASS.96-channel valid boundary payload115.2MB+heap33.95MB=149.15MB FAIL against134.217728MB. No threshold imposed on RSS, browser baseline, plot copies or total VM memory. Browser-specific heap snapshot not captured; allocation counter and typed-array payload agree in fresh standalone boundary measurement.

PM supplied actual remote evidence for **same5956 SHA**: [CI run37247218496](https://github.com/komleff/u2-lab/actions/runs/37247218496) completedSUCCESS, verify job checkout/setupNode24/npmci/normal Playwright install/long/project verify/upload stepsSUCCESS. Это PM API metadata, не самостоятельный remote CI fetch QA; исторический Developer NOT RUN claim был точным на момент report и не переписан. CI passing assertions do not erase independent failures.

## NOT TESTED / remaining gates

- Real second physical LAN client and real LAN-IP browser access NOT RUN. Two contexts above are one local Chromium host. Python dist server0.0.0.0/localhost works; environment OS interface query denied (`uv_interface_addresses` error1), so no actual LAN-IP evidence invented.
- Combined real-browser64channels/dt0.01 late-control run NOT RUN; separate64 synthetic retention and40-channel late Worker measurements reported honestly.
- Native/operator hooks, actual Beads init/import/export/restore/re-export/auth/finalize/merge NOT RUN; original B0/B6/B8 gates open and historical B6 auth FAIL preserved.7 intents PENDING, not canonical task statuses/closures.
- Full fitted U2 material/slot/SKU closure not proven; presets openly experimental, missing authoritative values remain source gaps. No gameplay redesign, detector tuning or accepted-risk substitution.
- Corrected candidate not tested in this report. PM/Developer owns fixes; same QA session will run affected cases/regression against a supplied stable new SHA.

## Tested-Paths / canonical binding

SHA256(sorted LC_ALL=C `path SP candidate Git blob SHA1 LF` rows below + **entire exact VC bytes** below including final LF, without fences/markers). Every candidate blob independently equals tested worktree bytes. Report itself, transient evidence/fixtures, screenshots produced by QA and remote metadata excluded from Git package. Evidence digests are auxiliary execution proof, not a replacement canonical primitive. This binds product tested surface, not full bootstrap acceptance or a future fixed candidate.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/runtime-report.md` | `837a53fbb54817e971817884af36a9033bd3cbed` |
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
| `src/app/main.ts` | `98ba7ddca98f990f2353567844ce5fea92d45879` |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `59b5010645ff920b35e4b1f512d2b6d5e7d7bc48` |
| `src/io/json.ts` | `4d0b518c97bee32bcd0bd9a9d6ac05b603a88cb3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `a57107124e6d9e46bfe64c58a73b3d62d4b14c28` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `2fc1422922b38b3b27eef2a4e7f563814b3ca195` |
| `src/runner/protocol.ts` | `d65b8036fdb63ff612723ec4bc5faa57141ca2da` |
| `src/runner/retention.ts` | `1c9bf795a37b325be3eb7a73da4d056aaaf5a943` |
| `src/runner/run.ts` | `ae0b021705bf1f06dc018836adddc592afbbfd45` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/browser/lab.spec.ts` | `dee01deb41d88f6ce3821ddb52e6d181b917b2de` |
| `tests/catalog.test.ts` | `d03ac5f5af7a0348937acd91342a41b2cc7c9398` |
| `tests/io.test.ts` | `f4c14b9770b215e9098581c0f51f5b43a2c0a003` |
| `tests/long-kernel.test.ts` | `c72942369330adde06d10272a196890114bf7d4e` |
| `tests/matrix.test.ts` | `a24aa01131860590d54ea7a5df5d649d8ed95d66` |
| `tests/metrics.test.ts` | `9e29a208d74eace0cc5bd7b103a3a7edec9c9691` |
| `tests/model/boundaries.test.ts` | `a3b9f1e160d43f2da39bde28bf9e96240e0d8ae9` |
| `tests/model/kernel.test.ts` | `e9526f56158bc080641a193864d0f7c3628c5638` |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` |
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

## Frozen execution evidence

Directory: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/5956da89/` (ignored). Probes load current working directory via Vite SSR; reproduce original candidate only from5956 root. Original archived evidence preserved before any affected recheck.

| Evidence file | SHA256 |
|---|---|
| `commands.json` | `acf9f4ab9819361fccc0eaeb990bc874d9c9f5a4309fb2f0762ed6f55e881b8d` |
| `independent-probes.mjs` | `8d20a25e1f6c9e1b8e846088b03accdb926811f800eeea8ec8c2fb024ce5e57a` |
| `independent-probes.json` | `5d1a28fb36b987beac37f6044fcd7e507e028908add916a61746edd9b5002459` |
| `retained-boundary.mjs` | `41c7b3373e914193de86cf502e72cf6e158918f3f0df03c9f1d3278becf8ecba` |
| `retained-boundary.json` | `d6ca1b15cccf8f2d475102011bffcb4c5427f189a9ff2b073119a9be839d5da5` |
| `browser-probes.mjs` | `db94759dd547ad9298f8359f8e4f2680ee17622a8e0ce4ab064cdfb817bda40a` |
| `browser-probes.json` | `1069af014678b18983054fb30936f991993f2d2d904c03530fbf61f1696f8ecd` |
| `browser-existing-fresh.json` | `d3f6a4a9c7225adc9e9802b6752cf9e4e7767ba00fcef62069dc95ca5dbafc0f` |
| `long-kernel-fresh.json` | `305e4867da657a5be653c836b0d2fc9072638c36f6812b35d1195ef9276c301e` |
| `host.json` | `7d9d775704383491be6de881e651c8937a9a7c3f20b6bed7893fcf1072dcea6e` |
| `csv-parser.json` | `d8c134d397c651a70eb584b961c1c9c83c1c47de11abafa42d661203705f6c89` |
| `qa-desktop.png` | `3097b3096b0ea99c03b2dc59bfca75d80077d8fa6f73908154eb7d5fe5d75a0d` |
| `qa-mobile.png` | `4e21b14a48a78714e665467f7a03ea6792aa308d8609ab3555ac6e2fdf790fc8` |

## Exact entire source Verification Contract

```text
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
