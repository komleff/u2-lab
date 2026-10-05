# QA EXECUTION — named within-dt peak affected closure

Result: **PASS for the affected QB1/P13 product surface**. The original single valid tank-stop/cooling case now retains its≈500K internal physical peak for dt20/dt10/refined0.001. Necessary scalar/cumulative metric, replay/export, numeric/shared-ledger and prior device-boundary regressions pass. Original FAIL report remains immutable; same-session scoped Reviewer owns Review closure. This report does not grant bootstrap/operator acceptance or merge readiness.

- Role: independent QA, installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5 reused, no new verifier agent/launch.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `d469d5d8adcda69f1aefe958628d81c43a347ca7`; tree `ebde00eeeba741e6d60ad1be26b44a082944b1f3`; branch `feat/power-heat-lab`; exact tested worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Source: `docs/product/power-heat-lab-v0.1.md`; entire unchanged `docs/verification/power-heat-v0.1-contract.md` below, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Direct affected8-path+entire-VC fingerprint: `d0b46f628590c49393e39ecead3818aef09faafde6f29919036330f139441fa3`; seven original peak source paths plus new `tests/peak-cycle.test.ts`.
- Content-Fingerprint for inherited package plus material additions: current59 paths + entire VC `fa0a6865d0032024e634ccccf2f2f9ecda4c40282ccaaf3b90b4b09a27b412ef`. Previous57 metadata-bound paths retained with four changed production blobs; new peak test and Developer report added.
- Developer report read as implementation evidence: `.superpowers/sdd/2026-10-05-u2-lab-launch/peak-fix-report.md`, SHA256 `19bebac6c8499bb965cbb74c152137f4a75756c97df45290be6e2cac5cfd6be1`.

Scope is the single named QB1/P13/Numerical-Acceptance peak failure and necessary adjacent tests; no whole audit/policy/TTX/tolerance change. Original fixture is reused **unmodified**, SHA256 `b46931e07d8f06620b68852d2e71014cd46fe73e5a3de04032f7e04c5a748275`. Its valid SI/provenance setup remains as specified in `2026-10-05-product-peak-qa.md`:C100,dry1kg×100,initial490K,Q0/100J,hull250W,gen250W/η0.5/allwastehost,passivearea0.01/background100K,10kg/1000Jkg tankhigh500/restartHigh480,20s idle duration. All three specs independently validate/createRun before actual execution; synthetic numbers are not U2 TTX.

## Independent affected matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| Original QB1/P13 internal peak then cooling | Numerical Acceptance nonlinear-device-cycle peak half-step≤0.1%; P13 | Actual unmodified validated createRun/runChunk replaydt20/dt10/refined0.001 | PASS, closed | Max500.00000000000534/500.00000000000534/500K. Half relative0/refined1.0686562745831907e−14≤0.001. FinalT remains493.83797665K and physical tankstop≈2.145899565905s. Original coarse493.838/half497.252 metrics failure eliminated without changing source threshold. |
| Unaveraged kernel scalar and cooling initial peak | P13/initial peak | Independently call stepModel on original fixture, then valid cooling-only initial500K case | PASS | StepResult.maxTemperatureK500.00000000000534 despite final493.837976651701; cooling initial/max500/final493.1176029702483. Actual telemetry42channels and no max/peak channel; scalar is not averaged bybase dt. |
| Incremental/replay/JSON/frozen peak | P9/P11/P12/P13 | Valid40s run atdt20; first paused frozen result, JSON roundtrip of result,1-step vsfull-chunk replay | PASS | First/cumulative/JSON max500.00000000000534; frozen20s snapshot remains unchanged after context reaches40s/final487.2826271922132K. Exact state/metrics equality for same-dt chunked/full. Retention42channels/no peak channel. |
| Physics/resource/event preservation for original3replays | P4/P5/P7 | Compare captured originalFAIL and currentPASS JSON physical fields perdt | PASS | Ticks/finalT/fuel/integrated source/sink channels/residual/thermal events/endpoint-only peak all exactly equal perdt; only reported cumulative peak changed. No altered solver/tank/resource parameter hides failure. |
| Targeted existing+new source regressions | P4/P5/P6/P7/P9/P10/P13 | Fresh7-file Vitest group plus typecheck/build | PASS |40tests PASS covering new2peak tests,metrics,review3numeric,runner,priorQA regressions,kernel andboundaries; typecheck/Vite production build exit0. Full56unit suite not independently rerun here. |
| Selected necessary numeric/metrics/replay probes | P3–P13 affected adjacency |13 selected independent original probes, not new case derivation | PASS13/13 | IP01–06/08/09/11/13–16:analytic/sharedH₂/cooling/BG/tankgates/cancel/initialpeak/drybill/immutable refuel replay/PV/halfstep radiation/actual8h cumulative metrics. No schema/catalog/UI-wide audit. |
| Necessary prior Review numerical/device cases | P4/P5/P7/Numerical Acceptance | Reused independent6 review probes | PASS6/6 | Large-dt signed cooling/heating integrated energy,exacthotstop/shared gen+engine+H₂/permutation,hotrestart,coldstop/restart under existing source event allowance. Source energy/peak criteria unchanged. |

## Exact original case results

| Measurement | dt20s | dt10s | dt0.001s |
|---|---:|---:|---:|
| Base ticks |1 |2 |20000 |
| Corrected reported maxTemperatureK |500.00000000000534 |500.00000000000534 |500 |
| Base endpoint-only maximum,K |493.837976651701 |497.25151826972507 |499.9999644629485 |
| Final temperature,K |493.837976651701 |493.8379766628059 |493.8379766631366 |
| Tankstop time,s |2.1458995659049984 |2.1458995659049984 |2.145899564989869 |
| Fuel remaining,kg |8.9270502170475 |8.9270502170475 |8.927050217503693 |
| Integrated generator electricity/host heat,J(each) |536.4748914762496 |536.4748914762496 |536.4748912474978 |
| Integrated chemical/total host heatIn,J(each) |1072.9497829524992 |1072.9497829524992 |1072.9497824949956 |
| Integrated net radiation,J |689.1521177823979 |689.1521166719106 |689.1521161813307 |
| Energy residual,J |9.658940314238862e−14 |9.658940314238862e−14 |−1.834435381375954e−13 |

Integrated-radiation half/refined relative differences remain1.6113820441932077e−9/2.3232420817556823e−9, identical to original physical observations. The kernel's new scalar tracks initial state and actual internal substep endpoints, including500K boundary; runner passes it into the existing cumulative metric. It is not a new averaged telemetry/retained plotting channel. QA directly checked source diff: onlystep.ts/types.ts/metrics.ts/run.ts production paths changed; added operations collect/return/pass/aggregate the peak scalar without changingintegration/flow/state expressions, base dt orretention. Reviewer owns final interpretation of this scoped fix.

## Actual own commands / inherited execution

Current own commands captured under ignored `qa-evidence/d469d5d8/`:

| Command | Actual independent result |
|---|---|
| `node <ignoredd469>/peak-cycle.mjs` |PASS original3dt;capturingharness exit0,JSONverdict read |
| `timeout 120 npm run typecheck` |exit0 PASS |
| `timeout 120 npx vitest run tests/peak-cycle.test.ts tests/metrics.test.ts tests/review-regressions.test.ts tests/runner.test.ts tests/qa-regressions.test.ts tests/model/kernel.test.ts tests/model/boundaries.test.ts` |exit0,40tests/7filesPASS |
| `timeout 120 npm run build` |exit0 PASS |
| `timeout 120 node <ignoredd469>/peak-adjacent.mjs` |finalexit0,2/2 scalar/cumulative/JSON probesPASS |
| `timeout 120 node --expose-gc <ignoredd469>/independent-probes.mjs` |13 selected behavioral verdictsPASS,notall18originalprobes |
| `timeout 120 node <ignoredd469>/review-probes.mjs` |exit0,6/6 necessary existing numerical/device probesPASS |

One provisional adjacent harness demanded frozen timestamp exactly20s, but actual floating timestamp was19.999999999999996s (4e−15s). Same-dt replay state equality already passed strictly. Final oracle uses source floating tolerance for comparison to the mathematical20s value; raw provisional output is preserved as `peak-adjacent-provisional.json` and command note. No metric/source requirement/tolerance was weakened or production failure relabeled.

**No fresh own12h/browser rerun.** This narrow fix collects one scalar and changes no integration/flow logic, telemetry channels or retained representation. Fresh original3dt physical outputs are exactly preserved; own targeted cumulative/JSON/numeric integration is refreshed. Prior own physical12h134.916s remains bound to a450 execution, not relabeled current. Fresh **Developer** physical12h132.595329s was executed on current exact eight-path source:4,320,033ticks/43,200buckets/42channels/87,782,400estimatedB;work287.99999998510106,fuel5299.332360088376kg,max492.052936788315K,residual−0.072141391050J/source64.107202560GJ. QA read current raw Developer `peak-fix-evidence/long-kernel.json`; every captured metric/physical field except walltime equals prior owna450 JSON. That is Developer execution plus independent comparison, not an own new long command or whole-kernel byte-equivalence claim.

Developer fresh full56unit/type/build/5browserPASS+1screenshotSKIP/cloud26 are supplied/read evidence; only own targeted40/type/build above are claimed freshly by QA. PM separately supplied exactd469 CI SUCCESS runs37253950268/37253946567 and exactZIP standalone S/M14s,A/B,390px,two localcontexts,sameorigin/no pageerrors PASS. Those are PM execution/API metadata, not QA remote fetch/browser/physicalLAN2 measurements. No additional own runtime load was justified by the scalar-only fix.

## Preserved history / limits

All seven preceding reports independently remain byte-identical:

| Report | Exact unchanged SHA256 |
|---|---|
| `2026-10-05-product-qa.md` | `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` |
| `2026-10-05-product-qa-affected.md` | `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` |
| `2026-10-05-product-code-review.md` | `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6` |
| `2026-10-05-product-review-fix-qa.md` | `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46` |
| `2026-10-05-product-code-review-affected.md` | `9ce7e788f1d5f2b8e7f94472ab6d84d1bb89e3b17a5687ec1a1956d76c207b18` |
| `2026-10-05-product-metadata-qa.md` | `70e177a3c24635eda024e53d6ff2eb4c0cf11a255b79224d2d5080199f50e0fb` |
| `2026-10-05-product-peak-qa.md` | `47cd51e2e6925501ce015bb7d76ee3c46e3ca03cad02fd4fcfb15e1ee028c706` |

Original QB1FAIL47cd and metadataPASS70e remain historical bytes, not rewritten. Current FAIL closure is scoped to the named surface with actual new evidence; same-session scoped RV pending. PhysicalLAN2/LAN-IP, combined real-browser64channels/dt0.01 latecontrol, browser heap snapshot and new screenshots NOT RUN by this recheck; prior separate measurements stay explicit. RemoteCI/native/operator/livebd/Dolt/auth/export/restore/applier/finalize/merge NOT RUN by QA. B0/B6/B8 remain open; experimental S/M/U2 authority/source gaps and pending notes/canonical task state unchanged. No product fixes/durable tests/commits/GitHub mutations/reset/subagents.

## Direct affected8-path binding

SHA256 of sorted LC_ALL=C `path SP candidate Git blob SHA1 LF` rows below + entire exact VC bytes including finalLF = `d0b46f628590c49393e39ecead3818aef09faafde6f29919036330f139441fa3`. This is the direct named peak surface and matching Developer source/test scope.

| Direct affected path | Candidate Git blob SHA1 |
|---|---|
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` |
| `src/catalog/schema.ts` | `64a55b20f1b0810073858af41d8a3a191b4cb726` |
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/runner/metrics.ts` | `7f43b033a956174d01d2ebb0249cdda118adb470` |
| `src/runner/run.ts` | `1a1e929ae19ce829fd21cb8fbc85ed181113dd33` |
| `tests/peak-cycle.test.ts` | `e0c0f3efc81e9a4231f9a7c382344a7967e9d505` |

## Tested-Paths / current59-path package binding

Canonical Content-Fingerprint uses LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below followed by **entire exact source VC bytes**, including finalLF, no fences/markers. All59 candidate IDs independently equal tested worktree bytes. Inherited documentation/checkpoint/wiring/UI/unchangedtest rows are preservation/evidence binding, not a claim of new live/native/browser/full-package execution. Direct peak/numeric/metric scope and own commands are explicit above. Reports themselves/transient evidence/remote metadata excluded.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `.agents/project/verify.sh` | `b33ba689099eb2208e0be8e99995e9a3e3227f02` |
| `.bd-intents/runtime-preparation.jsonl` | `83582abfa8922690101e5ed2de78cfcbe53eea63` |
| `.github/workflows/verify.yml` | `882d5c0935113bc812c9eae7aaf79677fae4d10f` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/peak-fix-report.md` | `e9678c07965d4bdefee17cf09cb4d6521b31082e` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-fix-report.md` | `e883f5cfed153698eff907ee124ff4a4baaf9d1c` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/runtime-report.md` | `837a53fbb54817e971817884af36a9033bd3cbed` |
| `.superpowers/sdd/2026-10-05-u2-lab-launch/rv-fix-report.md` | `ac6fe34c9f7072aae44492baffd010c617452e6e` |
| `README.md` | `7b283d04d6d80d29dedf16861b579b1d0c8ab4a0` |
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
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/runner/metrics.ts` | `7f43b033a956174d01d2ebb0249cdda118adb470` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/run.ts` | `1a1e929ae19ce829fd21cb8fbc85ed181113dd33` |
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
| `tests/peak-cycle.test.ts` | `e0c0f3efc81e9a4231f9a7c382344a7967e9d505` |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` |
| `tests/qa-regressions.test.ts` | `d9c2c3f954d211815c267a161d66072563e97828` |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` |
| `tests/retention-memory.test.ts` | `4d2b7b8c3df1c7f96fa65c3117a61276b62e70f8` |
| `tests/review-regressions.test.ts` | `cbcec8a835be44f56e9fcfe4d6bd0a97f760de2f` |
| `tests/runner.test.ts` | `1dc1500388d3a2bfdaae6efe6c9d4f35d0f45f0d` |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` |
| `vite.config.ts` | `6a347911e545a1eb8e631c975c6b032d90bf1578` |

## Frozen auxiliary execution artifacts

Current local ignored directory `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/d469d5d8/`; old820 peakFAIL artifacts remain unchanged. Auxiliary hashes do not replace the canonical Git-blob+entireVC primitive.

| Evidence file | SHA256 |
|---|---|
| `peak-cycle.mjs` | `b46931e07d8f06620b68852d2e71014cd46fe73e5a3de04032f7e04c5a748275` |
| `peak-cycle.json` | `77e942c241c984981311c8edbde846a1b3710cb52f0bb94e98c8fc9190f7aeab` |
| `peak-adjacent.mjs` | `ada7385cab64df3c52adf46f90d803e8bdf1e750163ea9f3c434d284dd65df79` |
| `peak-adjacent.json` | `d5500110531b11d87f5cc1c7c354bc88329d13d5489aeeff236768b307b48bf1` |
| `peak-adjacent-provisional.json` | `d20f2f46dead72416d5ca679f17de94385955f68b2b0b0147c09130396f49640` |
| `independent-probes.mjs` | `f8aca1de44edd6f04c7d6ff9a9614f1507abe2e7d60c7b4b29e8a39a94ef3692` |
| `independent-probes.json` | `816bb5b1bd2be92dc231e3fac56dc82bd0d40bebd19e5f6067e7f762fc04da83` |
| `review-probes.json` | `b1a4d956015bf3931d55bc45871498ebbaab3b48f88f278a2908dceab0c93f06` |
| `physical-output-comparison.json` | `8d469cb0435b9213b4157b875dd495c57a6431b170f242f9d4a5c3b9a63064ad` |
| `commands.json` | `c088bea54c7f0290edcf19ed49073d0dc90ae783e07063d11dec80dafbf9e746` |
| `regressions.log` | `18c5e3791cf6ce6361a232ccb8aa72fd648c5bac7395dfae9c7e15df8ca99c04` |
| `binding.json` | `50cea9ddc92c4eddac91ddb4f067c071cd467f19479ec29b100b78b5e76890eb` |
| Developer current `peak-fix-evidence/long-kernel.json` | `2c7545ef9ffe61bbd9f632d8f6750a9359e4f588be42023af9269f3292462a40` |

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
