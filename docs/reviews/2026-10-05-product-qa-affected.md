# QA EXECUTION — Power & Heat v0.1 affected recheck

Result: **PASS for the affected product surface**. Original F1–F7 and the subsequently reproduced F4/P12 supplied-tank-gate failure are closed on the tested candidate. Necessary adjacent numeric, shared-ledger, runner, schema, retention and browser regressions pass. Full bootstrap acceptance, operator acceptance and merge readiness are not issued by this report.

- Role: independent QA under installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5, reused for affected verification. No new verifier agents/launches.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `56a5cdfeada6363dd4248520d2595dc54b28a696`; tree `1d3cd374848defda0eb72af63f0bba6c77515607`; branch `feat/power-heat-lab`; tested worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Product source: `docs/product/power-heat-lab-v0.1.md`, SHA256 `61384c1829c6d66d54b3588fac203b1a5fb5f84205f0c626d739bd9af128ec40`.
- Source contract: entire exact unchanged P1–P14 `docs/verification/power-heat-v0.1-contract.md` below; SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Content-Fingerprint: `9e473179e59992b75fac9d3ce0d3ececad75afc6547acd45544f1454b5070330`; explicit 55-path package below, original 51 paths plus affected Developer report and three materially added regression-test files.

The 31 source cases were prepared from spec/VC before implementation inspection in `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-prepared-cases.md`. Their original execution/matrix remains in `docs/reviews/2026-10-05-product-qa.md`. This report repeats affected cases and necessary regression groups rather than claiming a second full original audit. Developer reports are implementation evidence, not acceptance oracles. QA changed no production source or durable tests, and performed no commits, GitHub writes, real bd/Dolt/database/applier mutations, native/operator operations or subagent launches.

## Preserved execution history

| Phase | Actual candidate / result | Evidence binding |
|---|---|---|
| Original product QA | `5956da89b05bab63fe634bef4d1df13780ec5723`: **FAIL**, seven source failures | Original report SHA256 `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` remains byte-identical; original 51-path+entire-VC fingerprint `c7caa134f8099bf758fb00abde0502894537c71c297341fc10dceb260e659da2`. Original passing tests do not erase its failures. |
| First affected phase | `e91fd6dc027a1ab4856e20797d3caf008881d16a`, tree `d7d4e0928878e562ab2ce2f50cc44dc25579198a`: original seven repros PASS, **FAIL** adjacent F4/P12 supplied tank gate | Frozen `qa-evidence/e91fd6dc/`: independent model18/18; unit48; type/build; browser4 PASS/1 SKIP; fresh physical12h128.875s; retained-boundary/near-max PASS; `schema-adjacent.json` preserves both actual failures. Canonical fingerprint `7a121abcb6c4bb3677b29f0fccd3e0b7d6e15f1010643e6347a58a3796d9fa26`. |
| Current schema-only affected phase | `56a5cdfeada6363dd4248520d2595dc54b28a696`: **PASS for affected product surface** | Fresh current schema14/14, model18/18, retention, unit51/type/build, browser4 PASS/1 SKIP. Current canonical package below. First-phase physical12h evidence transfers only through explicit unchanged physical blobs; it is not claimed freshly executed on56a5. |

The adjacent failure was reported promptly without downgrading it: on e91, separately `tank.gate.low="150"` and deletion of `tank.gate.high` both returned validator.ok=true and createRun accepted. Expected P12 behavior was path+reason rejection before a run. Root assigned the same Developer; the only production change from e91 to56a5 is `src/catalog/schema.ts`. Current independent repros reject both with exact named field paths and reject run creation. Original seven failures and this additional failure remain historical FAIL observations.

## Affected case matrix

`IPxx` below refers to the independently derived transient probe reused from original QA. Literal original inputs are in the preserved report; fresh current outputs are in `qa-evidence/56a5cdfe/independent-probes.json`. Schema guard outputs include validator errors and run-creation result in `schema-adjacent.json`.

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| F1 / IP04 charging through80% within dt | P7; Q14 | Same original Q79/100J,100W source/BG,dt0.1 vs independent0.0001 replay | PASS, closed | Coarse BG1.7516572715035323J vs fine1.7517768507425562J; coarseQ87.24834272849J. Eligible within-step interval receives nonzero source headroom. |
| F2 / IP05 cooling through10K margin within dt | P7; Q14 | Same original initial500.1K/workHigh510K,area1/C100,dt0.01 vs0.00001 | PASS, closed | BG0.7174916828865863 vs0.7174916828859358J; finalT499.746386495654K. |
| F3 / IP06 cancelled queued step | P10; Q21 | start→held chunk1→step→cancel→matching telemetry ACK1→pump | PASS, closed | Time remains0.1s, exactly1 chunk; start/step/cancel control ACKs present. Matching ACK does not execute cancelled work. |
| F4 / IP07 mandatory type/field validation | P12; Q27 | Original four independent invalid edits | PASS, closed | tank.energyJKg string, module.gate.low string, missing scenario.targetWork, nonboolean repeat all reject. Fresh schema group also asserts path+reason and createRun rejection for gate defects. |
| F4 adjacent supplied tank gate | P12; Q27 | Separately tank.gate.low="150" and delete tank.gate.high; validate + createRun | PASS, closed | Both validator false with `ship.tanks.diesel.gate.low` / `.high`, code INVALID and reason; createRun throws. Exact historical e91 inputs repeated on56a5. |
| Schema adjacent valid/required/nonfinite guards | P12 | Independent14-case group: supplied complete tank gate, optional absence, absent optional workLow; module string/missing/absent gate; nonfinite mandatory/optional fields; null/array gate; hysteresis | PASS14/14 | Positive three cases validator/createRun accept;11 negative cases reject before start and expose exact field/object path+reason. No implicit clamp/coercion. |
| F5 / IP08 initial peak temperature | P13; Q30 | Same cooling-only500K initial run | PASS, closed | Initial/max500K, final496.9583727760537K; peak includes initial state. |
| F6 / IP13 radiator motor work ledger | P4/P6; Q06/Q11 | Same area0/aux10W,Q100,C100,T300,dt1 | PASS, closed | Q−10J,T+0.10000000000002K, radiatorHostW10, heatInW10, residual0. Tiny radiation−2.27e−12W is roundoff, not missing10J. |
| F7 / IP18 admitted dynamic channel count | P10; Q22 | One real kernel tick validates channel names;98 channels,50000 physical1s samples; fresh-process GC+typed arrays | PASS, closed | 25000 retained buckets aftermerge,max39756; estimate84400000B; numeric58800000B +heap17018928B =75818928B<134217728B. Two new explicit ledger channels are counted dynamically. |
| F7 adjacent refill near new max | P10; Q22 | Fresh-process79510 physical1s samples; aftermerge cadence2s then refill close to39756 cap | PASS | 39755 buckets,98 channels; estimate134212880B; numeric93503760B + retained heap27059480B =120563240B<134217728B. Counts sum to79510; buckets remain live during measurement. Not merely the immediately-aftermerge25000-bucket state. |
| Independent electric/shared stock/cooling | P3/P4/P6; Q03–Q07/Q10–Q12 | IP01–03 analytic cases, same H₂ generator+engine+cooler tank depleted midstep and permutation | PASS | Q40J/delivered100J/residual0; shared1kgH₂ exhausted, untouched10kgdiesel; generator/cooling333.333333W, thrust5/6N, permutationΔT0. StarvedH₂ cooling0/no fuel;TI rejection130W=moved heat+work;buffer capped5J. |
| Dry bill/radiation/environment/governor | P5/P7/P8; Q08/Q09/Q13/Q15/Q16 | IP09/10/14/15 plus current unit analytic fixtures | PASS | Cargo does not change dryC/T; signed radiation−992.0116W; nine invalid/doublecount cases reject; hot/cold restart sequence unchanged; source0BG0;ActiveQ79→69 legally; PV40W=10electric+30heat/residual0. Half-step relativeT3.53e−16/energy1.06e−14≤0.1%. |
| Scenario/shared state/replay/refuel/A–B/JSON | P9/P11/P12; Q17–Q19/Q24–Q26 | IP11/16/17 fresh deterministic chunked/full and actual8h/dt1 replay | PASS | Exact state/metrics chunk replay; cumulative refuel consumption0.8kg; normalized JSON/provenance preserved; frozen snapshot survives edits.8h28803ticks/work192/fuel3532.888240kg; same-task809.840032s vs own-sortie819.840032s. S/M valid and match shippedJSON; experimental origins remain explicit. |
| 64-channel retained/event limits | P10; Q22 | IP12 fresh actual representation plus existing full4.32M synthetic64-channel fixture | PASS | 64×50000 numeric76800000B+heap34668856B=111468856B<128MiB; declared128000000B is separate.21001 events→20000 retained/dropped1001, first128/last19872. Full4.32M ticks→43200 buckets/110592000 estimatedB. |
| Real Worker ACK/control and current UI | P1/P10/P11/P12/P13; Q01/Q20/Q21/Q23/Q24/Q25/Q27/Q30 | Fresh Chromium153 browser regression, sequential after current computation | PASS for measured local surface |4 PASS/1 screenshot-only SKIP; S/M/charts/pause/step/reset/immutable A–B/safe import; small viewport/local assets;40000 buckets/42channels/dt1/missing telemetryACK, matching pause0.2ms/cancel0.1ms≤500ms. Old/wrong ACK safeguards also covered in current units. |
| Physical12h kernel on affected integrators | P4/P9/P10/P13; Q17/Q22 | Fresh actual e91 real S mining dt0.01, bounded240s; current exact physical-blob comparison and current valid-spec guards | PASS, evidence transferred by unchanged blobs |4320033 ticks,43200 buckets,42 channels,128874.781988ms;work287.99999998510106,fuel5299.332360088376kg,maxT492.052936788315K,residual−0.072141391J/source64.107202560GJ. Details/equivalence below; no56a5 fresh12h claim. |

Unaffected original cases retain their original evidence and limitations; the table above identifies fresh or explicitly transferred evidence. It does not turn the original localhost smoke into a physical LAN-client check or the separate64-channel synthetic and42-channel browser fixtures into one combined measurement.

## Actual commands/results

Current commands executed from `/workspace/scratch/faaeb0182a68/u2-lab-feature`, captured under `qa-evidence/56a5cdfe/`; every current command below exit0. JSON verdicts independently inspected, not inferred from probe harness exit.

| Command | Actual current result |
|---|---|
| `node <ignored56a5>/schema-adjacent.mjs` |14/14 PASS; validator + createRun + exact error-path assertions |
| `timeout 120 npm run typecheck` | PASS |
| `U2_RETENTION_REPORT=<ignored56a5>/retention-unit.json timeout 120 npm test` |51 tests/10files PASS; includes synthetic12h64-channel and fresh-process retained-memory fixtures |
| `timeout 120 npm run build` | PASS; Vite local production assets |
| `timeout 120 node --expose-gc <ignored56a5>/independent-probes.mjs` |18/18 actual behavioral PASS, including separate fresh-process admitted98-channel allocation; harness exit0 alone not acceptance |
| `timeout 120 node --expose-gc <ignored56a5>/retained-near-max.mjs` | PASS near cap aftermerge/refill; actual120563240B |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium U2_BROWSER_REPORT=<ignored56a5>/browser-fresh.json timeout 120 npm run test:browser` |4 PASS/1 screenshot-only SKIP; actualChromium153.0.8010.0; fresh matchingACK timing |

Earlier e91 command actually executed independently: `U2_PERFORMANCE_REPORT=<ignorede91>/long-kernel-fresh.json timeout 240 npm run test:long`, exit0, physical test128883ms/wall128874.781988ms. Fresh e91 typecheck/build/unit48/independent18/browser4+1skip and both retention measurements are preserved as phase history, not mislabeled current51-unit execution. Host: Intel Xeon Platinum8573C,9 logical CPUs,cgroup8GiB,Node24.19.0; actualChromium153.0.8010.0. Schema-only phase did not change host or runtime dependencies.

## Physical replay equivalence and retained storage proof

QA independently compared30 relevant path Git blobs from e91 to56a5. All src/model, src/runner, src/scenarios, catalog presets, app/io, physical data/catalog/scenario inputs, parameter-intake.json, package dependencies, physical long fixture and retention fixtures are identical. Sole differing production blob is schema.ts. Current shipped S/M specs pass independent validation and match exact preset/JSON bytes; current8h replay and current unit/browser regressions refresh integration at the new schema boundary. Thus the fresh e91 physical benchmark remains evidence for the exact current physical implementation/input, while current schema behavior is proved freshly. Original5956 benchmark is not used as corrected-integrator proof.

Explicit unchanged physical core and benchmark bindings:

| Path | e91 = current Git blob SHA1 |
|---|---|
| `data/catalog/m-civilian.json` | `beeb0b2ca9fd982022b87e87b7f134e99523f7e2` |
| `data/catalog/modules.json` | `4d67370d31e238bc6b73f3166c141361e937216d` |
| `data/catalog/s-civilian.json` | `4fe437058d9b7d8643b57a1357af1b7d4d8a1ea2` |
| `data/scenarios/mining.json` | `336d956828428c768f0af36fe4b3393a54e98e38` |
| `docs/experiments/parameter-intake.json` | `56f2ad10c26f47ed92f393d7c684bbcaff49a2c9` |
| `package-lock.json` | `abf726f701e7847f4add67924bca11f4e256e940` |
| `package.json` | `b23b63d705bc2efa3802a518f445e24229c69590` |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `fd3de5f381a56e69acff6bd8f1b639fed653ba51` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` |
| `tests/long-kernel.test.ts` | `c72942369330adde06d10272a196890114bf7d4e` |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` |
| `tests/retention-memory.test.ts` | `4d2b7b8c3df1c7f96fa65c3117a61276b62e70f8` |

Schema Git blob changed `22b38b89966ab06f15a4ccef065b3077bc0a6452` → `64a55b20f1b0810073858af41d8a3a191b4cb726`. Complete30-path comparison lives in `qa-evidence/56a5cdfe/physical-equivalence.json`.

Retained storage proof is actual live Float64Array payload byteLengths plus GC-stabilized retained heap and actual ArrayBuffer allocation deltas in fresh processes. Typed-array payload agrees with measured ArrayBuffer delta. The98-channel case is admitted by schema and actual kernel telemetry, not an arbitrary unsupported count. Near-cap postmerge refill checks total physical sample preservation and keeps buckets live.64-channel evidence remains separately passing. `.bytes` is a conservative estimate, not measured heap; RSS/browser baseline/plot copies/transient global allocation are not substituted for retained telemetry or given a new global128MiB limit. Browser-specific heap snapshot remains NOT RUN; this evidence measures the shared Node/V8 retention representation independently.

## NOT TESTED / remaining gates

- Physical second LAN device and actual LAN-IP browser access NOT RUN; local Chromium contexts are one host. Current static/browser local surface passes. Original OS network-interface access limitation remains; no LAN-IP evidence invented.
- Combined actual-browser64channels/dt0.01 late-control replay NOT RUN. Separate64-channel synthetic+actual-retained storage and42-channel/dt1 late real Worker measurements are declared separately.
- Fresh physical12h command on56a5 NOT RUN because sole production change is schema and exact physical blobs/input match fresh e91 proof; the transfer above is explicit. Browser-specific heap snapshot and regenerated screenshots NOT RUN; one screenshot-only existing case SKIPPED because U2_SCREENSHOTS unset.
- Native/operator hooks, real Beads init/import/export/restore/re-export/auth/finalize, actual database/applier mutations, operator acceptance, merge and physicalLAN2 NOT RUN; B0/B6/B8 remain open and historical auth failure preserved. PENDING intents are not canonical closures.
- Remote current CI not independently fetched/run by QA; no current CI success claim. PM publication metadata and Developer historical reports are not substituted for actual QA execution.
- Authoritative U2 material/slot/SKU closure remains a source gap; experimental presets stay explicit. No fitted/approved canon or excluded detector/gameplay redesign claimed.

## Tested-Paths / canonical binding

Canonical SHA256: sorted LC_ALL=C `path SP candidate Git blob SHA1 LF` rows below followed by **entire exact source VC bytes**, including final LF, without fences/markers. All55 candidate blob IDs independently equal tested worktree bytes. This retains original51 package paths and adds Developer affected report plus three relevant new test files. Report itself and transient evidence/screenshots/remote metadata are excluded. Included historical documentation/checkpoint/wiring paths are binding/inherited evidence, not a claim of new real bd/native/remote execution. Package is scoped to the affected product, not full bootstrap acceptance.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-report.md` | `e883f5cfed153698eff907ee124ff4a4baaf9d1c` |
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
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/io/json.ts` | `4d0b518c97bee32bcd0bd9a9d6ac05b603a88cb3` |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` |
| `src/model/step.ts` | `fd3de5f381a56e69acff6bd8f1b639fed653ba51` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `c53489d96d93d88d2d92f4884e332ef322f7003f` |
| `src/runner/metrics.ts` | `135debf2467490b48675eab204b71cf828a45ef4` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `7a95f8491164f5b861916a984d778163a3ec4579` |
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
| `tests/qa-regressions.test.ts` | `d9c2c3f954d211815c267a161d66072563e97828` |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` |
| `tests/retention-memory.test.ts` | `4d2b7b8c3df1c7f96fa65c3117a61276b62e70f8` |
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

## Frozen execution evidence

Transient evidence directories are explicitly ignored; `qa-evidence/5956da89/` and `qa-evidence/e91fd6dc/` remain historical, `qa-evidence/56a5cdfe/` holds current probes/logs/results/binding/equivalence. Auxiliary file digests below prove captured execution artifacts; they are not the canonical content fingerprint primitive. Full phase inventories saved to current `execution-evidence-digests.json`.

| Evidence path | SHA256 |
|---|---|
| `qa-evidence/e91fd6dc/long-kernel-fresh.json` | `552cd48b6c3083312e4a3dc51d20744e2408e59ab3aeac826ed49e6ffdd7a7ae` |
| `qa-evidence/e91fd6dc/long-kernel-fresh.log` | `633afa28755e8e105c26418c1ab5d1af06f6efec4f2d04140a1ab926d6dbee9a` |
| `qa-evidence/e91fd6dc/schema-adjacent.mjs` | `212814536aa21a2699315b11dd8006e6be693e9ad38de37bb7a4172f15959ddd` |
| `qa-evidence/e91fd6dc/schema-adjacent.json` | `f06f71da203a595f4cd5251398f577222c29597802b1e88ce94bcfcc3533120f` |
| `qa-evidence/e91fd6dc/binding.json` | `490a099db3a13ef4ec14e79a8b6450047d5975ac845263fe0c2b1e3e80f40944` |
| `qa-evidence/56a5cdfe/schema-adjacent.mjs` | `4b163880223b76932f78c235b377a2b4dd06beaebc0a072c801748b5c8af8777` |
| `qa-evidence/56a5cdfe/schema-adjacent.json` | `bb917fc0274aac6c81d6d894c4179b6e9a1c66adad33046de5b84a3ed2ab50f9` |
| `qa-evidence/56a5cdfe/independent-probes.mjs` | `7c0c26c8268ab80263c87900f2dba81ccfd8c25d064e260d5a51db716422affe` |
| `qa-evidence/56a5cdfe/independent-probes.json` | `ed3331d93f6c897a97669c78924bc8768bd418102b162957f8d8bcabd4f11a7f` |
| `qa-evidence/56a5cdfe/retained-boundary.mjs` | `901d8f922705abcf843a40b0d1309baf268430c47465407e4a996b898fbc109e` |
| `qa-evidence/56a5cdfe/retained-boundary.json` | `ee927a8223aae5823d7d46ff79d7400338c2a91b123ac672826cf75976cf65c1` |
| `qa-evidence/56a5cdfe/retained-near-max.mjs` | `2c762944c15b39615baa7e42b6c8cd7c901a72f4ec7faef6d8c489378778ec4f` |
| `qa-evidence/56a5cdfe/retained-near-max.json` | `e1b67e860b9454e0b41976d08ab45a812288a7c3f86b04a7a264f4dab184944a` |
| `qa-evidence/56a5cdfe/retention-unit.json` | `1bc80e71cace7f0419036d6cdba2bb1ffd6c8f77e858761a899ad5951cdae331` |
| `qa-evidence/56a5cdfe/browser-fresh.json` | `c939d531496fb10a83928cd04d56fff85b003df065fdb666d335d82f237852fd` |
| `qa-evidence/56a5cdfe/browser.log` | `05a7c58bbf5c4c5e2f8344e981a43cd21712e9aa8917052d51bc34e65edac239` |
| `qa-evidence/56a5cdfe/commands.json` | `30774adb27a48b951d02f6b6b449c8b8337ee2883f4ff17e856d2c277dcfa88f` |
| `qa-evidence/56a5cdfe/physical-equivalence.json` | `8eefb193a5653b71f6f9816cb58400454549103e2aa76cd549baaa40de545894` |
| `qa-evidence/56a5cdfe/binding.json` | `45e03a286a3ed26eadc26c86fd0743119fdf502cf517684531370a0dcad5a752` |

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
