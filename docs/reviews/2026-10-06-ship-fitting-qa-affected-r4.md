# Ship Fitting v0.2 — independent QA EXECUTION affected r4

**Result: PASS** для уже авторизованного CR-B2 affected scope и current functional artifact. BLOCKER=0; ADVISORY=0.13prepared groups:13PASS/0FAIL/0NOT RUN. Внутри групп выполнены64nominal parameter/chunk runs,7current matrix series,12refinement runs и fresh v2 physical12h. Они не добавлены к старому100-case ledger как новый общий case count.

Actual role: independent QA по QA_ROLE v2.1. Model: Codex; exact provider model ID unavailable. Same QA session / PRODUCT verifier launch2/5; без subagents. Requirements/product code/durable tests/Beads/Dolt/GitHub/commits не менялись. Только ignored private probes/reports. PM — sole publisher; scoped Code Review и operator gates остаются отдельными.

Exact candidate `903d36b2ac4a2bfa90997803770ace13d520fbe9`; source fix `7d9460421e9a4b12e451c5add81f2785e9205309`; последняя проверка HEAD clean. Все measurement outputs frozen UTC `2026-10-05T18:55:50.939647+00:00`. Source freeze явно released после final measurement; report assembly только по saved evidence. Persistent preview4183/4184 не остановлен/не изменён QA.

Среда: Node24.21.0/npm11.6.2 из absolute approved env path; тот же Darwin25.5.0 arm64 QA host; Chromium153.0.8010.12.390×844 touch/mobile contexts — browser emulation на одном host. По последнему PO steering выполнялись только functional checks; без visual/style/layout/screenshot-polish/broad a11y audit. Full-hold/refuel/новая Aurora/Crossroads↔Northerncenter/3FVA mission — deferred future WHAT; этот кандидат по ним не оценивался.

## Source-first identity и artifact

Expected до fix explanation: `qa-completion-methods.md`, SHA256 `20cc201d571d65fb9d1ae2f810a544122c3026b81edbac08a0c76c2bca960ef2`. Whole VC SF07/SF09/SF10/SF12/SF13/SF17/SF18/SF19/SF20, accepted GDD/PO. Approved WHAT5/overlay/wholeVC blobs unchanged; accepted WHAT fingerprint `550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`, U2 source `cdc490e3517c8455f662f82579c45813cdbb9a76`. Developer reports/tablet addendum не использовались как expected-value oracle.

Content-Fingerprint `46ae5968310c61e731342a17ce7a2977540b6742c996692375b242a4a15b52d8` — independently computed canonical sorted-key compact UTF8 SHA256 `{blobs:[{path,blob}],contract:{path,text}}`; actual84HEAD blobs/current working bytes + entire VC text checked before imports. Полный84path/blob список, wholeVC text, approved source identities и saved changed-path list сохранены в sealed `qa-completion-binding.json`; это binding coverage, не assertion execution каждого testfile.

Artifact `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/`: manifest `842c8c7800483fd1eaa18f009cfac4b516c34874f20df3cf235427a2c519a15e`; ZIP `u2-lab-ship-fitting-v0.2.0-fix-r3.zip` SHA256 `2c910bc3f203ba0c2ff809a34ad51fa3e0649e7177ec9a11c923f20b7df102bc`; distDigest `5b23d780c28adbcf8f946310561cd22c801f6e55f64b4904369edbeee6ec3f81`. ZIP CRC pass;10sizes/hashes/bytes equal dist, prefix/u2-lab, ZIP и defaultdist. Artifact40actualsource blobs + wholeVC independently recomputed fingerprint `2cc85b43685cca09dff252452420d6379824e44264ead1e27be561be81877559`. На каждом3origins все10fetched asset SHA matched new manifest.

## Completion oracle и результаты

Для supported пары dt/H фактические time, measured duration и nominal work покрывают H. Unsupported input должен отвергаться до Start. State clock patch/clamp без интегрирования work не считается completion. Actual domain остался nominal dt`(1e−10,1]`/H`>1e−10`; positive clipped remainder kernel интегрирует. QA не выбирал engineering minimum. Accepted .01/.005/.0025 и ordinary clipped controls сохранены.

Independent oracle из SF10: CivilS3MW×η.5001 /24MJ =.0625125SCU/s, return.35. Группа ровно1declared installed laser, full finite charge/gate, no propulsion, LAB-ORE factors1/ρ1500. Work-only `SCU=R×H`, `SCU/h=225.045`, K=1. Beam energy1,500,300×workSeconds; return525,105×workSeconds. Relative tiny time/work comparisons не используют max(1,expected), поэтому50–98% shortfall не скрывается scalar tolerance.

| Named pair | First actual chunk | Final measured/state time | Actual/expected SCU | Result |
|---|---|---|---|---|
| B2C-01-NAMED-A:dt1.0001e-10,H2e-10 | 1step/1tick,time=measured1.0001e-10;done=false | 2e-10 / 2e-10;2ticks | 1.2502500000000001e-11 / 1.2502500000000001e-11 | PASS |
| B2C-02-NAMED-B:dt2e-10,H1e-08 | 1step/1tick,time=measured2e-10;done=false | 1e-08 / 1e-08;50ticks | 6.251249999999991e-10 / 6.251249999999999e-10 | PASS |

| Case group | Source AC | Method | Actual result | Evidence |
|---|---|---|---|---|
| B2C-01-NAMED-A | SF07/SF10/SF12/SF18 | dt1.0001e−10/H2e−10; firstchunk1 + bounded full replay | **PASS** — First notdone; final2ticks, full1.25025e−11SCU, matching measured/stateH. | `qa-completion-results-final.json` |
| B2C-02-NAMED-B | SF07/SF10/SF12/SF18 | dt2e−10/H1e−8; independent nominal integral | **PASS** — First notdone; final50ticks, measured/state1e−8,6.251249999999991e−10SCU vs6.25125e−10. | `qa-completion-results-final.json` |
| B2C-03-TINY-CROSS | SF07/SF10/SF12 | 30prepared dt×H pairs, first/final time/work ratios | **PASS** — All30supported and correctly integrate; finite state/metrics/stock, nominal beam/return ratios within source bound. | `qa-completion-results-final.json` |
| B2C-04-DOMAIN-BOUNDARY | SF07/SF18 | Actual validator boundary below/at/above + upper edge | **PASS** — dt/H1e−12 and1e−10 rejected; next declared1.0001e−10 accepted/progresses;dt1 accepted,1.0001 rejected; schema/parse/create agree. | `qa-completion-results-final.json` |
| B2C-05-ORDINARY-ALIGNED | SF07/SF10/refinement | dt.01/.005/.0025 ×H.03/1 | **PASS** — 6positive runs integrate fullH andR×H;225.045SCU/h/K1. | `qa-completion-results-final.json` |
| B2C-06-ORDINARY-CLIPPED | SF07/SF10/SF12 | dt.01/.005/.0025 ×H.031/.0375/1.003 +H1.00000000005/.01 | **PASS** — All10supported clipped cases integrate positive tail; no patched clock or throughput loss. | `qa-completion-results-final.json` |
| B2C-07-CHUNK-INVARIANCE | SF12/SF17 | A/B/H1.003:.01 atmaxSteps1/2/32 | **PASS** — 9batch runs agree in completed time/work; partial snapshot remains paused. | `qa-completion-results-final.json` |
| B2C-08-PHASE-CLIPPED | SF07/SF12/SF13 | Work.013→idle.007,H.018 at3baseline dt | **PASS** — Independent work.0008126625SCU, measured/state.018,K=.013/.018,0completed cycles; planned idle keeps denominator. | `qa-completion-results-final.json` |
| B2C-09-ATOMIC-UNSUPPORTED | SF17/SF18 | Current rejected dt1e−12/H1e−12 into valid run/result/A; known+explicit replay | **PASS** — API and3origins reject before start; valid fit/revision,active snapshot/result/A preserved; no new successfulstart. | `qa-completion-results-final.json` |
| B2C-10-WORKER-COMPLETE | SF12/SF17 | Controller +actual extracted Worker A/B/clipped1.003 on3origins; heldtelemetry | **PASS** — First chunks notdone; all9actualWorker finals match physicalH/work. Pause/Step ACK without telemetry ACK; freshmax19.8ms<500ms. | `qa-completion-results-final.json / qa-completion-browser.json` |
| B2C-11-LEDGER-FINITE | SF09/SF10/SF11 | Tiny+ordinary clipped per-group beam/return/work integrals | **PASS** — Actual beam andreturn correspond to actually integrated duration, no duplicated return; finite stocks/metrics and accepted ledger tolerances. | `qa-completion-results-final.json` |
| B2C-12-DELTA-PERFORMANCE | SF15/SF19 | Fresh currentv2 physical43200s+GC/maxcap;7matrix series;4families×3dt | **PASS** — Full43200measured/state,allchannelpeak/retention bounds; freshmatrix/refinement andheapPASS. Details below. | `qa-completion-12h.json / qa-completion-maxheap.json / qa-completion-matrix-refinement.json` |
| B2C-13-ARTIFACT-FUNCTIONAL | SF17/SF18/SF20 | ActualLANHTTP/localhost/TLSprefix390touch Start/Pause/Reset/newfit/Step+validclippedimport | **PASS** — 3originsPASS,10assetSHAs each; invalidimports atomic; replay1.003s complete withmatchingWorker measuredtime; exceptions/requestfailures0. | `qa-completion-results-final.json / qa-completion-browser.json` |

Все64nominal replay measurements включают first chunk/partial status и raw final time/metrics/ticks/work/beam/return. Actual finite numerical recipe осталась объявленной: никаких stock refills/reset внутри опыта. Machine-precision comparison учитывает только объяснимый accumulation roundoff; unchanged VC energy bounds и1% SCU refinement не ослаблялись.

## Fresh current-v2 performance и matrix

Physical12h: exactly state=`metrics.durationSeconds`=`43200s`; `4320455`actual physics ticks наdt.01;20installed instances,118channels. Retained `21601`buckets/cadence2s/max`34807`; all channel min/max match full step stream; latest bucket ends43200; metric/retention tick counts agree. Actual retained heap+arrays afterGC `75913416`B<128MiB (includes run context/online metrics); metric cells50→54,limitations80→80. Events total1204/retained1204/dropped0.

Fresh raw physical output:SCU1256.6828988994616,K0.1551150138983884,Tmax445.79598283372053K,residual0.00010367296159427466J/source1048366588797.9028J;wall281946ms. Это новое измерение903candidate, не старый carryover. Private12h adapter использует current curated existing fixture/harness с дополнительным independent measured-duration equality/head guard и raw peak instrumentation; source-first nominal/edge oracles выше выполнялись отдельно.

Fresh max-cap GC:118channels,34807retained buckets,20000retained events,metric1391B,limitation cells80; actualheap+arrays`126534336`B<128MiB. Synthetic retention filling отделено от physical12h.34,807 — actual adaptive cap для118channels; новый40000/50000retained requirement не придуман.

Own matrix: Pony1/2/3,IndustrialM1/2/3,L3+hold —600s each. Independent Σm andΣm·cp/material delta from added installed laser verified; same-task hull/ore/environment/phases/service/horizon/initialstock remain comparable. Actual full600s state/metrics agree; source K full-window denominator сохранён. L3bulk192m³.

| Matrix run | Measured seconds | SCU | K_use | Actual first limiter |
|---|---|---|---|---|
| pony:1 | 600 | 5.9791666666733905 | 0.6833333333345052 | `null` |
| pony:2 | 600 | 31.609291666707247 | 0.6833333333343105 | `null` |
| pony:3 | 600 | 42.98041666672395 | 0.513107105195802 | `{"timeSeconds":95.95475437238287,"causes":["cargo"]}` |
| industrial-M:1 | 600 | 25.630125000000174 | 0.683333333333338 | `null` |
| industrial-M:2 | 600 | 51.26025000000035 | 0.683333333333338 | `null` |
| industrial-M:3 | 600 | 76.89037500001567 | 0.6833333333334726 | `null` |
| industrial-L:3+hold | 600 | 76.89037500001567 | 0.6833333333334726 | `null` |

Refinement own measurements: cargo/return/depletion/gate at.01/.005/.0025,2s each, actual physical time equals measured duration. Output differences≤1%, first cause/tie identical, event-time difference≤.01s, accepted residuals. Cargo extra.01SCU and expected fill time.01/.0625125 checked independently; return case expected.125025SCU. Full raw matrices/causes in `qa-completion-matrix-refinement.json`.

Own scoped suite `npx vitest run tests/fitting/time-integration.test.ts tests/model/fitting-refinement.test.ts tests/model/fitting-energy.test.ts tests/model/fitting-stocks.test.ts` —28tests/4filesPASS,734ms. Existing suite — regression evidence; независимые source-first measurements не заменены suite assertions. Whole unit/browser/bootstrap suites повторно QA не запускались.

## Functional extracted origins

| Origin | Capabilities / actualStart | Controls / atomic imports | Worker/asset/network result |
|---|---|---|---|
| `http://192.168.68.65:4183/` | secure=`false`,randomUUID=`undefined`;Start→.01s/1tick/1step | Pause/Reset/newfit/Step.01/keyboard.02;maxACK19.1ms;4unsupported known/explicit replay imports retain bytes/A/result/no newstart | 3actualWorker completion pairsPASS;valid1.003 replay;10newasset hashes;pageexceptions0/requestfailures0/HTTPfailures0,sameorigin/prefix |
| `http://localhost:4183/` | secure=`true`,randomUUID=`function`;Start→.01s/1tick/1step | Pause/Reset/newfit/Step.01/keyboard.02;maxACK19.8ms;4unsupported known/explicit replay imports retain bytes/A/result/no newstart | 3actualWorker completion pairsPASS;valid1.003 replay;10newasset hashes;pageexceptions0/requestfailures0/HTTPfailures0,sameorigin/prefix |
| `https://192.168.68.65:4184/u2-lab/` | secure=`true`,randomUUID=`function`;Start→.01s/1tick/1step | Pause/Reset/newfit/Step.01/keyboard.02;maxACK17.5ms;4unsupported known/explicit replay imports retain bytes/A/result/no newstart | 3actualWorker completion pairsPASS;valid1.003 replay;10newasset hashes;pageexceptions0/requestfailures0/HTTPfailures0,sameorigin/prefix |

Actual nonloopback LAN HTTP на этом host проверен; randomUUID undefined не блокирует Start. LocalTLS prefix — self-signed browser emulation с ignoreHTTPSerrors, не actual public Pages. Для atomic byte comparisons captured actual export-handler Blob до native repeated-download policy; product handlers не менялись. Browser raw Worker messages/control timing/asset URLs/capabilities сохранены в evidence. Native repeated file-download policy не была самостоятельной целью этого followup.

## Checked paths, carryover и external NOT RUN

Read/reviewed runtime delta:

| Changed runtime path | Prior0c5ead9 blob | Current903 blob |
|---|---|---|
| `src/model/v2/physics.ts` | `611cfb32566bf46128308357e6dc2224503d915a` | `ab8a765826db1f035769327ee3a0a526d5ff73af` |
| `src/model/v2/step.ts` | `b5eed666341800e1c085c476718ebfe28ffa91f5` | `5b403a856c0c04869e2a511d797f94eef0fd1b50` |
| `src/runner/fitting-run.ts` | `f6e6e22071a2641233484a0a573e9e175c2e93f9` | `9bee614bd5be7eba1f4504224b1f8465996da630` |

Tested-Paths: public API imports `src/fitting/catalog.ts`, `src/scenarios/fitting.ts`, `src/model/v2/step.ts`, `src/runner/run.ts`, `src/runner/protocol.ts`, `src/app/fitting-session.ts`, `src/runner/mining-metrics.ts` and bound `src/model/v2/physics.ts`/`src/runner/fitting-run.ts`; current worst fixture `tests/fitting/worst-fit.ts` + existing fixture builder `tests/fitting/test-spec.ts`;4scoped testfiles above; actual extracted `src/app/fitting.ts`/`src/runner/worker.ts`10bundled assets on3origins. All84binding paths/wholeVC verified as content identity before runtime.

Old100-case ledger status сохраняется как99PASS/1externalSF20-05NOT RUN из immutable r2/r3, а не fresh100-case rerun. Current13groups — affected overlay закрытия named CR-B2 и необходимой regression. CR-B1/new item guards в delta не изменялись; closure из r3 переносится по exact unchanged blobs. Kernel/runner time surface изменилась, поэтому physical12h/performance/matrix/refinement получили fresh evidence выше. Legacy v1/source paths не изменились; blanket v1 physical12h не повторялся.

Независимо verified unchanged path identity для carryover:

| Carryover path | Actual unchanged blob |
|---|---|
| `src/fitting/validate.ts` | `8b49296c785a5fa75edfd840ddf2c784ff93f74c` |
| `src/fitting/compile.ts` | `15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4` |
| `src/fitting/cargo.ts` | `db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0` |
| `src/fitting/data/modules.json` | `8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d` |
| `src/fitting/data/hulls.json` | `e3e58cae57d5868f3459c444f6543590899f1939` |
| `src/io/fitting-json.ts` | `f77387afd849d765ad24e8b2ba973637e6ad92a5` |
| `src/runner/run.ts` | `8145e6149237b37148c37056d0c8966f8f918daf` |
| `src/runner/protocol.ts` | `7d6b7a95e2c11c775e4ce961c1a350f582d77268` |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` |
| `src/runner/mining-metrics.ts` | `dd3125d63322cc07cbaef504bcad1933be6debc7` |
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` |
| `src/catalog/schema.ts` | `1df4dd7e084fd760b7d740e7d63739bdcec00e45` |

Prior evidence byte-identical: r1report`4775cf7e7a0906e9c257ab7075d82e9f34276604809bb053605b63066a5bc090`;r2report`b6b302a705ce0eb99d500e20e21c10b4e8f794b84321bc2a4f84a034018c70d3`;r3report`a2b83530204554c9301dd9f71550e6a7da30b611c18423946de9a4e8ce650545`,r3manifest`46ef79a722368c49580357d1fd5707c4d731b5635262a84eaaf9a33e37901e67`. All r2sealed26/r3sealed30 files hash/size verified after current probes. Old FAIL histories и earlier scoped PASS не переписаны.

Confirmed new product FAIL:0; adapter faults in this r4 execution:0. Initial group12/13 NOT RUN обозначали pending long/browser commands; finalstatus изменён наPASS только по completed raw evidence. Дальнейшее обнаружение/features не добавлялось в этот QA.

**External NOT RUN:** current fix-r3 physical second device/full controls; publicPages deployment; native acceptance; отдельная bootstrap acceptance/finalize/operator merge. PO сообщил Xiaomi physical fix-r2 page+Start/time/resultsPASS; это user-reported partial evidence предыдущего artifact, не independent current fix-r3 full-control acceptance. Original white-page cause неизвестна и этим report не устанавливается. Source WHAT gap не обнаружен; new mission/full-hold/refuel отложены отдельно.

## Signed evidence

Evidence manifest `ship-fitting-qa-affected-r4-evidence.json`, SHA256 `e73bbf54b018aa7b41701d145524558acbbd20326794db8a98ba3fda8e3226f5`;23readonly private prep/probe/result/log/integrity files. Полные84blob/wholeVC binding и all40artifactsource/file digests — `qa-completion-binding.json`; pergroup raw measured results — `qa-completion-results-final.json`. Probe sources не дублируются в compactreport.

| Evidence | Bytes | SHA256 |
|---|---|---|
| `.overgate-runtime/qa-completion-12h.json` | 8132 | `68c64bf4e6ac43325d5fa544871d473d1be8918b8be3279131b4c98157318d48` |
| `.overgate-runtime/qa-completion-12h.log` | 6886 | `a76f9dc49de8566338fe463fe11bd780f124e4b8fd29f95b41a6508ed31a318a` |
| `.overgate-runtime/qa-completion-12h.mjs` | 5518 | `5f09d5d4cc3cdd3dedf55e96f4793a94174bfdda4d4fb6ea1e0cd0ddd13fcec7` |
| `.overgate-runtime/qa-completion-assemble-report.py` | 19179 | `e2fe3d6c04a4f7ae31ceabf3ba9ef3f93145e8af08af27b0a295d6579628da94` |
| `.overgate-runtime/qa-completion-binding.json` | 37818 | `5678c61aaeaefd7dcf080a1ff48d21cb331da0124936f1e90458b2cb80a0e4a1` |
| `.overgate-runtime/qa-completion-binding.py` | 5359 | `2be81bf976ba22960c2662050b0764d02adcbff098928a1935d07f3cb6c2186c` |
| `.overgate-runtime/qa-completion-browser.json` | 321417 | `32093e30971c3a56da8d4466897397ab929409cbeeb4c078032b315040c85b37` |
| `.overgate-runtime/qa-completion-browser.log` | 597 | `56229a12aabceed6a4885b1d09d6b9a2a1742d706651e120a8ab7bac95ddbf6e` |
| `.overgate-runtime/qa-completion-browser.mjs` | 14729 | `aad3ec294f52f5ddf0a999a0af815ca31587eca3c6f17d4de43c097223abd530` |
| `.overgate-runtime/qa-completion-final-integrity.json` | 1047 | `49fea3014eef1d74bd388e125f674f9f4324810ccf92abeb4139c4a6d2a73164` |
| `.overgate-runtime/qa-completion-fixtures.json` | 1885715 | `f4fd9c84ee605f848e8fcf629935a25467067bc0b56555c10f3d1dfa9644bd4b` |
| `.overgate-runtime/qa-completion-matrix-refinement.json` | 18787 | `579fc888c8c999f555a95649fb5976be2a34bf200bf8c38759f409b6f41bb543` |
| `.overgate-runtime/qa-completion-matrix-refinement.log` | 107 | `838662d2f58f961797f0766819920456a9ac31ab036fc899abf6ca176ef51c9a` |
| `.overgate-runtime/qa-completion-matrix-refinement.mjs` | 5947 | `3d07307ef9fc65c85717225d7004a2ed78e53d60e52a6d3dd7492c6b0e9b91c6` |
| `.overgate-runtime/qa-completion-maxheap.json` | 619 | `633eeedcaa1cf1d0459b3bb4db4f193e06da2d43f5ad10934c8fa43708675ef3` |
| `.overgate-runtime/qa-completion-maxheap.log` | 584 | `2de5333c43948824009e46fdb5672dee41ae208c58a482ba455f9e82b41713f3` |
| `.overgate-runtime/qa-completion-maxheap.mjs` | 2865 | `07a75e9dfecb4e3c3e0deb92e402da8afff60b1d93ae22c5b718ef072c342c0c` |
| `.overgate-runtime/qa-completion-methods.md` | 18234 | `20cc201d571d65fb9d1ae2f810a544122c3026b81edbac08a0c76c2bca960ef2` |
| `.overgate-runtime/qa-completion-probes.log` | 854 | `95bb0342bba795e228575f5cf954256256063a7e7b6eae658830648be8c8fe92` |
| `.overgate-runtime/qa-completion-probes.mjs` | 12769 | `d2719c8de9fcce709bdc3cf3239060e0a4b32cf8d6a2dc07bbc51681fb3b065f` |
| `.overgate-runtime/qa-completion-results-final.json` | 135352 | `7bc4bf43c624a1afb63c15837e68839c3772a8f94db9f56f169de25e744c1d9f` |
| `.overgate-runtime/qa-completion-results.json` | 134512 | `4527c98ba6e1c821941a814a2998e45a2ee033579fc8508726546484524c80ab` |
| `.overgate-runtime/qa-completion-scoped-unit.log` | 218 | `3b7a046b5c770147874369e757ef7800e2e60ab2b94b7ccccfaf6037d03cca8d` |

— Signed: independent QA, Codex; exact provider model ID unavailable. Current affected r4 result PASS/BLOCKER0/ADVISORY0; external gates NOT RUN. Ready for same-session scoped CodeReview/PM exact-byte publication.
