# Ship Fitting v0.2 — independent QA affected r2

**Result: PASS — scoped runtime SF01–20 acceptance; BLOCKER=0, ADVISORY=0.** На exact candidate `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac` закрыты три source-backed дефекта r1 и семь непроверенных точных nonphysical cases. Совмещённый исходный100case статус: **99 PASS,0 FAIL,1 NOT RUN (SF20-05 отдельные внешние gates)**. PublicPages/secondphysical/native/bootstrap/finalize/operator merge не объявлены прошедшими. Это не merge authorization.

Дата:2026-10-06,Asia/Novosibirsk. Actual role: independent QA, `.agents/QA_ROLE.md`v2.1. Model:Codex; точный provider model ID недоступен, не выдуман. PRODUCTlaunch2/5, та же QA session; новый unique verifier не запускался, субагенты отсутствуют. PM sole publisher в DraftPR4 <https://github.com/komleff/u2-lab/pull/4>.

Source-first100case plan выведен до Developer explanation; r2 использует те же acceptedGDD/VC/source-derived expected. Prepare-only10probes были записаны до final handshake. Developer fix report не использован как oracle. Runtime/requirements/durable automatedtests/Beads/Dolt/GitHub/commits не изменялись QA; только ignored private probes/evidence. Кодовые исправления не выполнялись.

## Exact candidate/build/authority

Worktree `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`. Handshake/current/final HEAD `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac`; Developer numeric fix `d54dd4bd6beaa92e532c2bf537bb3a05860c4c0b`. Initial и final `git status --short` пустые, `git diff --check 8568ffee9303f1b8c6d7ab1573da8944c22511f0...d8859b1d7a690ce6882a2a9f76a4255172ccb3ac` exit0. Source freeze был удержан во время исполнения; после завершения всех commands и сохранения outputs явно освобождён PM. Report assembly использует сохранённые данные и exact `git show d8859b1d7a690ce6882a2a9f76a4255172ccb3ac:path`.

Formal binding `docs/verification/ship-fitting-v0.2-runtime-binding.json`: **81 explicit paths + whole VC**, каждый actual HEADblob и полный VCtext независимо пересчитаны. Content-Fingerprint **`25b73e117daa583617617dcb4c2fc25ae3e6acf74b3774dccfb1a8b093f4826c`**. SHA256 UTF-8 canonical JSON `{blobs:[{path,blob}],contract:{path,text}}`,sortedkeys/compactseparators,paths sorted,не excerpt. Полная81path/blob таблица ниже. Handed claimed hash не принят без independent reconstruction.

Accepted5WHATblobs,wholeVC и POoverlay unchanged. Approved source fingerprint `550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`, source U2 frozen `cdc490e3517c8455f662f82579c45813cdbb9a76`. Exact POoverlay blob49d640538146c38114e195dae9d796074c785588 и source AC route retained из signedr1. Product ambiguity найдено0; WHAT не выбран QA.

New artifact `.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/`: manifestSHA256 `dbdb6594ffe2d57ffa8cb21dbe58b23909fcf7c3225c4623da235e92d8ccf306`; ZIP **`3f8467bc07b256a1c6435a900bad59bdf7410d86fe46ca68941d57c66cf37b49`**; distDigest **`a1d561744a60fb06b79b60b58ff442a515c33eb88bcd8e81429aa5e07c37e810`**. Artifact runtime40paths+wholeVC fingerprint **`8107ca70d7ad8c4b3aa797236a48cfa1a74fe8544bb8257539a1aea56a5ffe89`** independently recomputed against exact HEAD. Каждый10file size/SHA проверен в dist,prefix/u2-lab,ZIP entries; CRC PASS. Defaultdist использованный scopedPlaywright также exact10filematch. A2 каждый10file fetched с каждого3origins independently matches newmanifest.

Immutable r1 `8568ffee9303f1b8c6d7ab1573da8944c22511f0` сохранён byte-identical в `docs/reviews/2026-10-05-ship-fitting-qa-r1.md`,SHA256 **4775cf7e7a0906e9c257ab7075d82e9f34276604809bb053605b63066a5bc090**; PM публикация PR4comment5998855076. Originalreport и все27sealed evidence повторно hash-verified неизменными. r2 не удаляет историю FAIL.

## Fix verification и закрытие measurement gaps

P2 —10 source-first private groups; R2 —3 own necessary regression groups. Все PASS.

F1/SF06-01: universalM actual45082.189909896595kg/96m³ =source8945.439461·8·4^(−1/3); bulkM actual11136kg/192m³ =source(.816·4+.984·8)·1000. S8945.439461/1800kg unchanged; исправленные cargoM masses/C включены ровно один раз, не смешаны с experimentalbuiltinrecipe. O5expected сохранён, tolerance1e−8 не ослаблен.

F2/SF04-02: D Pony homogeneous4electricroles +physicaldiesel tank/generator теперь complete/canRun true; dieselcapacity12000kg,consumeronlygenerator,no mixedpropulsion. Mixedelectric/directnegative сохраняется; U29 дополнительно сохраняет DdirectH₂/E/A nofuel и matchingtank guards. Expected получен из acceptedslots§6.2, не из Developer report.

F3/SF05-01/SF08-05: explicit same ordinary diesel-Ssingle march/retro обе роли2950000N/2650kg и полныйdeclaredmaterial/numericitemequal. Дополнительно electric-Msingle обе роли force8820000N,dry10600kg,power80463157.89473684W. Compiler не меняет TTX по роли. Ready presets используют явно объявленные retro localvariants; их declaredfields/provenance/bill сохраняются в compile/fit/run/export и при editingне мутируют snapshot. ExactsameSKUnamedcounterexample устанавливает ordinarySKU отдельно от этих variants.

Семь gaps измерены по сохранённым методам: SF05-03fivefamilies add/remove exact mass/C/capacity withrestoration; SF06-05cargo-only diesel/H₂ withstock0→no fuel/force/work/cooling andpositiveoperatingcontrol; SF08-04mixed electric+mining50%share afterprotected100W; SF11-04buffer10J/dt.2,exactCOP2/rejection150W→cooling100+electric50W plusstarved/reject0; SF13-04actualpartial5s→.125025SCU/K.4/90.018SCU/h/no completecycle,emptygroup/time0N/A; SF14-02independentO9/near-tie onsettrace three dt; SF15-04all6hulls twelve physical builtin80/160surface endpoint experiments. Full inputs/results сохранены P2JSON и percase ниже.

SF14 source semantics явно: ties≤eachphysicsdt. O9power4.000,thermal4.005,resource4.020 →groups power+thermal atdt.01/.005 and earliestpower atdt.0025; resourceexcluded. Pair4.000/4.00125 grouped всех3dt,включая swappedcauseonset. Fixed.005separation exceeds.0025; это не ложное изменение firstcauseorder или WHAT. Eventtimes остаются exactsourceonsets/durations.

Один QAadapter fault в initialSF13emptygroup использовал nativepresetcharge выше declared isolated accumulatorcap. K/N/A был correct,но energyresidual fixture был бессмысленным. Исправлен только privateinitialstate на isolatedzeroQ; повторён толькоSF13-04,empty2s residual0. Initialscript/output сохранены `*-initial`; finalaggregate `qa-affected-results-final.json` заменяет толькоэтотcase. ProductFAIL не заявлен,expected не изменён. Других probe/freshregression failures нет.

## Реальное исполнение и host

HostDarwin25.5.0 arm64/AppleM3Pro;Node24.21.0,npm11.6.2,Chromium153.0.8010.12. Env sourced `/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh`,не выводился. Source-bound10probe command requiresexplicit fullSHA/fingerprint/newZIP/newSHA prior runtimeimports; guard independently matched allbinding/source/artifactfields. Команды ниже завершились, live tasks не осталось.

| ID | Command / exact evidence | Result |
|---|---|---|
| P2 | `node .overgate-runtime/qa-affected-probes.mjs --candidate d8859b1d7a690ce6882a2a9f76a4255172ccb3ac --binding-fingerprint 25b73e117daa583617617dcb4c2fc25ae3e6acf74b3774dccfb1a8b093f4826c --archive .overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/u2-lab-ship-fitting-v0.2.0-fix-r1.zip --archive-sha256 3f8467bc07b256a1c6435a900bad59bdf7410d86fe46ca68941d57c66cf37b49`; later samecommand`--case SF13-04` | 10groups PASS; initial/history/finalaggregate/log retained |
| R2 | `node .overgate-runtime/qa-affected-regression.mjs` с теми жеfourbindingCLIfields | 3groups PASS:all6declaredpresetbills/localvariants;fit/runroundtrip/snapshot;explicitretro/marchtypedforceledger |
| U29 | `npx vitest run tests/fitting/source-fidelity.test.ts tests/fitting/bill.test.ts tests/fitting/controller.test.ts tests/fitting/io.test.ts tests/fitting/compatibility.test.ts tests/model/fitting-drive.test.ts --reporter=verbose` | 29PASS/6files,411ms;qa-affected-scoped-unit.log |
| UI2 | `npx playwright test tests/browser/fitting.spec.ts:2` (exact namedchangedretropreview/exportcase) | 1PASS,1.4s;qa-affected-retro-browser.log |
| L2 | `U2_FITTING_LONG_REPORT=.overgate-runtime/qa-affected-12h.json node --expose-gc tests/fitting-long.mjs` | actualphysical43200s/dt.01 PASS,275478.142583ms |
| H2 | `U2_FITTING_MEMORY_REPORT=.overgate-runtime/qa-affected-max-heap.json node --expose-gc tests/fitting-memory.mjs` | actualfullretentionheap PASS |
| A2 | `node .overgate-runtime/qa-affected-artifact-browser.mjs` | all3actualorigins/newarchive10fileSHA/touch390flow PASS |

PMprovided freshmanualguard on exact candidate:121unit/12browser+1screenshotSKIP,typecheck/buildPASS. Это отдельно attributable PM evidence, **не QAownfullsuite rerun** и не replacement независимыхP2/R2/L2/H2/A2measurements. Непрошедший screenshot-onlycase остаётсяSKIP,а raw screenshotsA2 сохранены. Blanketrepeat88unchangedcases,wholebootstrapaudit и повторныйlegacy12h не запускались.

## Fresh12h / heap / artifact metrics

L2 fixedmaximumlegalIndustrialL roster20instances,3CivilSlasers+correctbulkM/all6Power/all5Signature. Actual43200s,dt.01,4320455ticks,118channels;retained21601buckets,originalcadence1s/coarsened2s,max34807;estimate83293456B. Events1204/total1204/drop0. ActualGCheap+arrayBuffersdelta **75894040B**, includeswholecontext/traces/events/snapshot/metric+openstate. Metriccells50→54,limitationcells80→80; **allchannelmin/max equal fullstepstream**. Tmax **445.79598283372053K**; integratedresidual **0.0001036726579367311J** / source **1048366588797.9028J** within unchangedVCtolerance. Usefulwork **1256.6828988994616SCU**,K **0.15511501389838755**,SCU/h **104.7235749082879**,firstlimiter **5786.015527888386s power/resource**. Freshvalues supersede oldr1physicalnumbers because cargoC changed; remaininglimit is measuredexperience outcome, не acceptanceerror или unlimitedsustainability claim.

H2 separate syntheticretentionfill +actualGC:118channels,34807buckets,20000events,metricJSON1414B,80limitationcells, actual **126539040B <134217728B(128MiB)**;estimate134215792B. Syntheticfill не объявленphysical12h. Neither estimate substituted actualheap. Changeddata/billnecessitated freshL2/H2; r1proofboundedO7N30000/eventfirst128+last19872 stillvalidunder unchangedmetrics/retentioncode.

A2 actualhandednewbytes наhttp://localhost:4183/,realnonloopbackhttp://192.168.68.65:4183/,localselfsignedhttps://192.168.68.65:4184/u2-lab/. Each390x844touch+keyboard,width≤390,slotpreview/apply/run/reset/step/freezeA/failedimport/F3;9samoriginpageruntime requests/noerrors/noCDN/backend;all10fetchedfileSHA matchnewmanifest. HTTPsecure=false/randomUUIDundefined/getRandomValuesfunction;uniqueStartIDs andmatchingcontrolACK11–13.9ms (max13.9ms). LocalTLS `ignoreHTTPSErrors` onlyforhandedselfsignedtestcert. НовыеPNG saved withqa-affectedprefix. UI2extra explicitretroTTX/source§8.2/derivation.4 beforeordinarySKUreplacement andfit/runexport checked.

Worker/kernel/protocolunchangedbyfix; r1realWorkerlarge30176/118channels/max34807 controlsACK≤500ms/queuecap1/staleACKproof carryover. FreshA2actualWorkerACK confirmsnewarchivewiring. 40000retainedv2неinventednewAC:118channelscap34807;oldv1real40000/42channels regression belongsr1. Physical2nddevice и publicPages не выведены из этих3origins наодномhost.

## 100case final acceptance ledger

100initialcases сохранены. `Carryover r1` означает exactpreviousownmeasurement при unchangedrelevantkernel/parser/retention/protocol bytes; outcomeнепереписанкакnewexecution. Changedcompiler/catalog/validator/data/UI checkedP2/R2/U29/UI2/A2/L2/H2; affectednumerics неунаследованы. SevenformerlyNOTRUN теперьactualPASS; fourformerlyFAIL rows close three defects. AllSF01–20 acceptance surface has source-backed evidence within runtime scope; onlyexternalSF20-05 remainsNOTRUN.

| Case | Source AC | Prepared method | Source expected / conditions | Final result | Actual new evidence / explicit carryover |
|---|---|---|---|---|---|
| SF01-01 Six hull anchors | SF01; GDD§4 | C3 catalog data | Спутник2×S/6SCU; Pony2×S/12; IndustrialS2×S/12; CivilM3×M/24; IndustrialM3×M/48; IndustrialL4×L/192. Builtin cargo сохраняется при заполненных Payload. | PASS | Carryover r1 8568ffee: P:catalog-six; U:catalog/compatibility; six builtin capacity/readiness JSON. |
| SF01-02 Pony identity | SF01; GDD§4–5 | C3 + C5 | Pony имеет builtin S laser, tank12000kg diesel capacity, Power3×S, G0 Class/National UNKNOWN. Его не переименовать CivilG1/Industrial; IndustrialS builtin laser не наследует. | PASS | Carryover r1 8568ffee: P:Pony-and-no-inheritance; U:catalog; B:F3/builtin DOM. |
| SF01-03 Ready presets | SF01; GDD§3–5 | C3 presets integration | Для каждого ready preset march/retro/strafe-pair/turn-pair и аккумулятор установлены; pair одно изделие; defaults U/D/U/E/U/U, electric CivilM. Полные finite SI bill и stocks. | PASS | R2 independently confirms all6compiled ready presets declared retro localvariants; P2 F3 explicit ordinary sameSKU override legal. r1 slot/type/stock readiness assertions carryover. |
| SF01-04 Curated catalog roster | SF01; GDD§5 | C3 data + C5 | 40 curated authored items по declared family/caliber roster, до local variants; builtins не дают бесплатные removable SKUs/slots. Civil≥G1, Industrial≥G2, H₂ generator≥G3, active radiator≥G2, inverter≥G4. | PASS | Carryover r1 8568ffee: U:catalog six/40 and finite authored origins; P preset/circuit construction. |
| SF01-05 Provenance/local variants | SF01; GDD§5 | C3 + C5 | Каждый numerical field содержит unit, canonical/derived/experimental, version и anchor/rule/hypothesis+sensitivity. Edit создаёт variant и не меняет original/provenance на canonical; missing/nonfinite bill не ready. | PASS | R2 all6declared retro numerics/materials/unit/sourceRef survive compile; fit/catalog immutable. U29 explicit variant provenance/roundtrip; UI2 preview,F3,download. Other field cases r1 carryover. |
| SF02-01 Slot cardinality | SF02; GDD§3 | C3 domain | 1slot=1instance. Повторная установка не создаёт второе изделие/упаковку XS в S. Несовместимое assignment не применяется атомарно; last valid fit остаётся. | PASS | Carryover r1 8568ffee: P:duplicates-builtin-incomplete-zero + slots-smaller-negative; U:compatibility/controller atomic assignment. |
| SF02-02 Smaller fit | SF02; GDD§3–4 | C3 domain | S mining можно поставить в M/L compatible Payload; M в S и L в M reject. Не использовать универсальный размерный multiplier по всем TTX. | PASS | Carryover r1 8568ffee: P:slots-smaller-negative; U:compatibility SIZE and legal smaller payloads. |
| SF02-03 Category/role/pair | SF02; GDD§3 | C3 domain | Generator в Payload, laser в Power, single в strafe/turn-pair и paired в march/retro reject. Category/caliber alone не обходят declared role/family allowlist. | PASS | Carryover r1 8568ffee: P:slots-smaller-negative paths CATEGORY/FORM_FACTOR; U:compatibility. |
| SF02-04 Legal laser boundaries | SF02; GDD§4 | C3 domain | Спутник2swappable максимум; третий reject. Pony builtin+2swappable=3total legal; IndustrialM3swappable legal; L3laser+1cargo legal. Ни extra Payload, ни builtin slot consumption. | PASS | Carryover r1 8568ffee: U:compatibility S2/Pony3/M3/L3+hold plus denied S third slot; P/L compiled legal rosters. |
| SF02-05 Mixed class/duplicates | SF02; GDD§4–5 | C3 + C5 | CivilS laser в IndustrialM legal; его power/η/rate остаются CivilS. Два одинаковых SKU получают distinct installed IDs без stacking penalties. | PASS | Carryover r1 8568ffee: P:O2-O3-additive-finite-battery; U:bill duplicate IDs + catalog-class constants. |
| SF03-01 Builtin immutability | SF03; GDD§3,8 | C3 + C5 | Видимые builtin cargo/tank/laser/accumulator доступны по полям и допустимым modes; снять/заменить reject; свободные сменные slots сохраняют число. | PASS | Carryover r1 8568ffee: P:duplicates-builtin-incomplete-zero; U:compatibility builtin assignment refusal; B:builtin block. |
| SF03-02 Independent duplicate state | SF03; GDD§3 | C3 + C5 | У двух одинаковых laser IDs разные commands/gates/states: выключение одного не выключает другой и не объединяет ledger channels. | PASS | Carryover r1 8568ffee: U:fitting-dispatch/scenarios; P fixed-group single requested ID; P permutation preserves per-ID values. |
| SF03-03 Incomplete draft readiness | SF03; GDD§2 | C3 + C5 | Удалить mandatory retro или battery: save/export draft разрешён, completeness warning, Run закрыт. Readiness scenario отличается от совместимости установки. | PASS | Carryover r1 8568ffee: P:duplicates-builtin-incomplete-zero; U:compatibility/controller; B:incomplete readiness disables Run. |
| SF03-04 Optional generator | SF03; GDD§3 | C3 kernel/UI | Complete battery-only fit без generator legal/Run доступен при допустимом scenario. No battery не ready. Battery разряжается конечным stock без созданной генерации. | PASS | Carryover r1 8568ffee: U:compatibility optional generator/mandatory battery; P:finiteQ-refinement-permutation finite withdrawal. |
| SF03-05 Zero initial stocks | SF03; GDD§2 | C3 + C5 | Complete allowed scenario с Q0/fuel0 показывает warning; legal fitting не объявляется incompatible. Run даёт actual stop/no target, finite values и resource event, не invented completion. | PASS | Carryover r1 8568ffee: P:duplicates-builtin-incomplete-zero; U:matrix zero resources; B:zero-stock warning; P:zero-output trace. |
| SF04-01 Direct homogeneous type | SF04; GDD§3 | C3 table-driven | Diesel march+H₂ retro/strafe/turn reject; также electric/direct mix reject. Четыре powered propulsion roles одного declared type; изменение только generator не меняет propulsion type. | PASS | Carryover r1 8568ffee: P:U-hybrid-and-mixed-reject; U:compatibility four homogeneous roles. |
| SF04-02 Electric architecture separate | SF04; GDD§3–4 | C3 domain | Electric propulsion на U с legal fuel generator+tank — electric hybrid, не новый fourth propulsion type; E остаётся архитектурой hull, не синоним любого electric engine. | PASS | P2: F2 D Pony homogeneous electric hybrid complete/canRun true; builtin diesel12000kg, only fuel generator consumer; mixed-type negative; U29 source-fidelity matching-tank/E/A negatives. |
| SF04-03 Legal H₂ utility | SF04; GDD§3; multifuel§2–3 | C3 + C3 kernel | На U diesel drive + diesel tank + real H₂ Power cryotank + cooler/H₂ generator legal при всех slots. Нет cryotank/неправильная species/нет slot → reject/readiness reason, не hidden cooler store. | PASS | Carryover r1 8568ffee: P:U-hybrid-and-mixed-reject; U:compatibility real cryotank readiness; M:shared-H2-generator-engine-cooler-actual. |
| SF04-04 E/A restrictions | SF04; GDD§3–4; slots§6.2 | C3 table-driven | E/A не приобретают fuel tank/fuel generator даже при свободном Power slot; дополнительный H₂ utility не обходят restriction. E принимает declared environment source; A не входит в curated six. | PASS | Carryover r1 8568ffee: U:compatibility E/A ARCHITECTURE errors and E preset; P:catalog-six. |
| SF04-05 Reactor/XXL boundary | SF04; GDD§3 | C3 domain/UI | XL reactor в S/M/L reject по caliber; reactor source не двигатель. XXL не активный playable preset/fit, reserved label не выдаёт готовое изделие. | PASS | Carryover r1 8568ffee: U:compatibility explicit XL SIZE / XXL INACTIVE_SIZE; catalog fixed six; no playable XXL. |
| SF05-01 Exact dry bill | SF05; GDD§5–6 | C3 numerical | Независимая сумма shell+каждый builtin+каждый installed dry bill ровно один раз; C=Σm_material·cp. Для partial CivilS shell42500kg+6SCU O6 subtotal44877.387619kg, при cp470 subtotal C=21092372.181026J/K. | PASS | P2: F3 same diesel-S declared2950000N/2650kg preserved in march/retro; electric-M full material/numeric equality. R2 all6presets declared bill/localvariants; material mass/C sums exact. U29 one compiled bill. |
| SF05-02 Included mass decomposition | SF05; GDD§5 | C3 numerical | Если source shell anchor включает изделие, decomposition исключает повторное сложение. Старые assembled Pony46.7t не переносятся поверх new shell+builtin cargo. Нет скрытого балласта/free zero builtin. | PASS | R2/P2 compile all6independent sum(m*cp)/dry; explicit localvariant recorded instead hidden compiler coefficient. r1 shell/builtin decomposition sources unchanged. |
| SF05-03 Module add/remove deltas | SF05; GDD§6 | C3 numerical | Добавить/снять battery, generator, buffer, radiator, cargo по одному: Δdry и ΔC их real bill; одновременно изменяются Qmax, source cap, buffer cap, radiator area, cargo volume. Одна reversible замена не теряет остальные sums. | PASS | P2: five separate add/remove families measured; batteryΔ24000kg/C11280000J/K/Q58.92GJ; generator6400kg/C3008000/sourcebus7.2MW; buffer5000kg/C2350000/2GJ; radiator3000kg/C1410000/1764m²; bulkcargo11136kg/C5233920/192m³. Each removal restores original. |
| SF05-04 Contents vs dry C | SF05; GDD§6 | C3 numerical | Добавить2SCU LAB-ORE-01: +3000kg current mass, Δdry=0, ΔC=0. Изменить operating fuel на100kg: current+100kg, ΔC=0. Unload/refuel не перестраивает dry heat buffer. | PASS | Carryover r1 8568ffee: P:cargo-allocation-density + U:bill unchanged C after fuel edits; M:repeated-unload-no-free-reset current cargo boundary. |
| SF05-05 Builtin cargo recipe | SF05; GDD§5 | C3 numerical | V6/12/24/48/192 дают O6 masses/C. Не mass0 и не interchangeable universal SKU mass; surface120kg/m² marked experiment, endpoints80/160 и cp350/900. | PASS | P2 builtin recipe baseline plus80/160 all6hulls physically verified; distinct from corrected cargoM SKU. r1 O6five source anchors carryover. |
| SF06-01 Cargo1.7 exact anchors | SF06; GDD§5; cargo§4–5 | C3 catalog/numerical | O5 universal/bulk S/M volumes/masses, ×8 capacity; old1.20t/×4 не authoritative для v2. Builtin volumes используют свою ×4 source curve. No automatic class/generation/national cargo multipliers. | PASS | P2: F1 universal-M45082.189909896595kg/96m³,bulk-M11136kg/192m³ match source; S unchanged; cargoM mass/C deltas U29/P2; builtin separate recipe preserved. |
| SF06-02 Universal shared allocation | SF06; GDD§6; cargo§4.3 | C3 cargo boundaries | U12: goods7+ore5 legal, goods7+ore6 reject; U нельзя по12SCU каждому виду. Universal+bulk24: goods12+ore24 legal; goods13 не берут bulk capacity. | PASS | Carryover r1 8568ffee: P:cargo-allocation-density; U:cargo specialized/shared allocation negative boundaries. |
| SF06-03 Density and forms | SF06; GDD§6 | C3 cargo | Ore2SCU at1500kg/m³=3000kg; endpoint1000→2000kg,3000→6000kg. Bulk не принимает liquid/goods; liquid commodity и packaged commodity не конвертируются бесплатно. Unsupported form reject с reason. | PASS | Carryover r1 8568ffee: P:cargo-allocation-density; U:cargo mass54000kg at36m3; U:matrix density endpoints. |
| SF06-04 Fill/unload boundary | SF06; GDD§6 | C3 kernel dt | Remaining cargo=.1SCU при O1 full rate: full time=.1/.0625125≈1.599680063987s, output≤.1SCU, mass≤150kg. Unload освобождает только cargo; Q/fuel/T/buffer сохраняются, subsequent mining возможен. | PASS | Carryover r1 8568ffee: P:cargo-fill-exact-dt: output.1,time1.599680063987s; M:repeated-unload-no-free-reset. |
| SF06-05 Liquid is not operating fuel | SF06; GDD§3; multifuel§4 | C3 kernel/domain | Payload compatible liquid H₂/diesel с operating Power stock0 не питает generator/engine/cooler. Cargo неизменен без explicit unload/refuel; auto transfer отсутствует. | PASS | P2: Diesel and H₂ fits with cargo2m³diesel+2m³H₂ operatingstock0,Q0: force/generator/cooling/mining/consumption0; cargo unchanged,current+1842kg. Positive.01kg operating control burns physical stock; liquid cargo untouched. |
| SF07-01 Explicit propulsion roles | SF07; GDD§6 | C3 scenario/kernel | Approach включает только march; braking только retro; strafe/turn0 до явного request. Нельзя автоматически включить все4roles или один SKU-ID трактовать как все duplicate instances. | PASS | Carryover r1 8568ffee: U:scenarios/fitting-dispatch role→instance; P:single march electric trace, nonrequested outputs0. |
| SF07-02 Instance target validation | SF07; GDD§6–7 | C3 schema | Requests называют installed instance/propulsion role; неизвестный instance и mismatched role reject до Run; valid duplicate target действует только на названный ID. | PASS | Carryover r1 8568ffee: P:group-and-schema-negative; U:run-validation/scenarios references; no orphan IDs in final valid adapters. |
| SF07-03 Fixed group membership errors | SF07; GDD§7 | C3 schema | Unknown group ID, repeated ID, non-mining ID и positive mining request outside group reject. 3installed/1selected/3positive не запускается; outside duty0 разрешён. | PASS | Carryover r1 8568ffee: P:group-and-schema-negative (3 installed/1 selected, outside-positive error, outside0 valid). |
| SF07-04 Numeric phase guards | SF07; GDD§6; legacyP12 | C3 schema | Duty−.01/1.01/NaN/Infinity, phase duration0/negative/nonfinite, invalid dt/horizon reject path+reason, без clamp. Duty0/1 и positive finite duration valid. | PASS | Carryover r1 8568ffee: P:group-and-schema-negative exact duty± bounds/nonfinite/stocks; U:run-validation dt/horizon/phase guards. |
| SF07-05 Empty cycle/duty0 | SF07; GDD§7 | C3 schema/kernel | Repeated empty cycle reject, не infinite busy loop. Valid work duty0 даёт0output/0forced starvation/no first work blocker; planned time остаётся в horizon. | PASS | Carryover r1 8568ffee: P:group-and-schema-negative empty phases; P:no-output-duty-gate-target-cargo off requested=false/no limiter. |
| SF08-01 Zero electric bus | SF08; GDD§6 | C3 isolated energy | O4 command1, Q/source0: actual force0, drive useful0, output0SCU. Rated force не выдаётся бесплатно; finite source/bus/host ledger. | PASS | Carryover r1 8568ffee: P:electric-zero-partial-command share0: force0,useful0,cargo0, residual0. |
| SF08-02 Partial delivered force | SF08; GDD§6 | C3 isolated energy | O4 50% delivery даёт500N,3885W useful,658.859649W host; source/useful/host сходятся O10. Equal share при mixed load отражается фактической силой. | PASS | Carryover r1 8568ffee: P:electric-zero-partial-command share.5:500N,3885W,host658.859649W. |
| SF08-03 Command and thermal gate | SF08; GDD§6 | C3 kernel | Command.5/full requested delivery→500N; command0/gateclosed→0force. Recovery hysteresis не выдаёт force до open gate; delivered share×command применяется ровно один раз. | PASS | Carryover r1 8568ffee: P:electric-zero-partial-command duty.5:500N; U:kernel hysteresis + U:fitting-refinement gate; zero duty trace. |
| SF08-04 Electric/mining competition | SF08; GDD§6; powerbudget§6 | C3 mixed-load | Battery0, after protected load only half общей непривилегированной demand: engine и mining получают50% своих requests. Force/output scaled accordingly; mechanical useful не добавляется к beam/ore. | PASS | P2: protected100W then50% engine+laser request share: source1504643.8596491227W,engine4543.859649W→500N/3885W,laser1.5MW→.03125625SCU/1s,beam750150W,return262552.5W,residual−1.16e−10J. |
| SF08-05 Direct typed branch regression | SF08; GDD§6; legacyP3–4 | C3 D/H isolated | Direct fuel расход=αF_actual·dt соответствующей species, source energy/exhaust/host закрыты по declared typed input. Electric deficit при fuel available не обнуляет direct force. Diesel не списывает H₂, drive useful не mining. | PASS | P2: F3 sameSKU TTX preserved; R2 same diesel-M march/retro actualforce8820000N,typedαF burn closed ledger at zeroelectricalstock; no ore. U29 direct typed branch. |
| SF09-01 1/2/3 nominal additive lasers | SF09; GDD§4,7 | C3 analytical | Legal Pony/M fits с O2 fully delivered outputs; без penalties и не скрытые identical ID merges. Curated real fit может limit и не обязан достичь nominal; nominal/actual ясно различаются. | PASS | Carryover r1 8568ffee: P:O2-O3-additive-finite-battery n1/2/3 full nominal .0625125/.125025/.1875375; U:matrix legal series. |
| SF09-02 Three vs8MW finite Q | SF09; GDD§7 | C3 finite-stock | Exact O3: Q1MJ поддерживает burst1s, 3s output.5209375SCU; Q0 output.5001SCU. Не persistent9MW/3×nominal. Actual full preset дополнительно сохраняет background/path losses. | PASS | Carryover r1 8568ffee: P:O2-O3-additive-finite-battery source8MW: Q0=.5001 and Q1MJ=.5209375 over3s; U:matrix full preset costs. |
| SF09-03 Mid-step finite withdrawal | SF09; GDD§6; legacyP4 | C3 dt trio | Q0=.005MJ, deficit1MW исчерпывается .005s внутри dt.01; Q≥0, withdrawal≤5000J, delivered≤actual input+withdrawal, output integral O10; никакого полного лишнего tick. | PASS | Carryover r1 8568ffee: P:finiteQ-refinement-permutation Q5000J → depletion inside dt.01; identical output .0034381875 three dt. |
| SF09-04 Proportional deterministic governor | SF09; powerbudget§6 | C3 kernel/replay | После protected reserve share одинаков у всех eligible nonprivileged requests, одинаковые лазеры 8/9 each в O3. Reorder input массива сохраняет totals и per-ID allocation; re-run exact same spec воспроизводим. | PASS | Carryover r1 8568ffee: P:finiteQ-refinement-permutation per-ID array reorder invariant; P:O3 equal share; U:fitting-energy protected allocation. |
| SF09-05 Beam is actual and typed | SF09; GDD§6 | C3 analytical | Beam_i=actual delivered_i·η_i; disabled/gated laser0. Solar/cooling/electric useful не дают ore. CivilS и IndustrialS используют собственные O2η, не hull class multiplier. | PASS | Carryover r1 8568ffee: P:O1/O2 delivered→beam→SCU; P:electric-zero-partial-command no ore; U:catalog product-specific η. |
| SF10-01 Fixed LAB-ORE-01 rate | SF10; GDD§6–7 | C3 analytical | O1 all constants/factors exact; 10s extraction.625125SCU/937.6875kg. Новый fixed lab process не silently включает dynamic softening current game owner и не использует legacy100MJ/SCU. | PASS | Carryover r1 8568ffee: P:O1-full-10s-return: .625125SCU,937.6875kg, factors1,24MJ/SCU. |
| SF10-02 Return heat once | SF10; GDD§6 | C3 energy | O1 return5.25105MJ добавлено host ровно раз, вычтено external useful ровно раз; host20.24805MJ + external9.75195MJ=30MJ. Beam не независимый второй source. | PASS | Carryover r1 8568ffee: P:O1-full-10s-return: source30MJ,return5.25105MJ,host20.24805MJ,external9.75195MJ,residual0. |
| SF10-03 Extraction zero boundaries | SF10; GDD§6–7 | C3 isolated | Zero delivered bus, work0, closed gate и cargo0 каждый дают0SCU; no NaN/Infinity/phantom cargo. Unit output не создают non-mining consumers. | PASS | Carryover r1 8568ffee: P:no-output-duty-gate-target-cargo four zero boundaries; no phantom work/nonfinite values. |
| SF10-04 Finite limits convergence | SF10; VC numerical | C3 dt trio | Finite Q/tank/buffer, cargo fill и return/gate cases по .01/.005/.0025s: SCU difference≤1%, eventtime≤.01s, same firstcause/group semantics. One-step и repeated residual O10 без ослабления. | PASS | Carryover r1 8568ffee: P:finiteQ-refinement-permutation/cargo-fill-exact-dt; U:fitting-refinement cargo/return/depletion/gate three dt. |
| SF10-05 Process sensitivity bounds | SF10; GDD§6 | C3 numerical | Explicit density1000/3000 меняет kg, не beam-derived SCU при factors unchanged; return.30/.40 меняет host/external, их сумма постоянна. Factors1 и 24MJ оставлены fixed, без скрытой recipe substitution. | PASS | Carryover r1 8568ffee: U:matrix actual density1000/3000 and return.30/.40 experiments; accepted inputs/canonical factors inspected. |
| SF11-01 Shared H₂ three consumers | SF11; GDD§6; multifuel§3 | C3 finite-stock | O8 generator/engine/cooler одновременно: totalH₂=.001kg, depletion≈1/6s, stocks≥0. Добавить2tanks той же species→один суммарный physical circuit; different species изолированы. | PASS | Carryover r1 8568ffee: M:shared-H2-generator-engine-cooler-actual sum=.001kg, stock0, residual2.70e-8J; U:fitting-stocks; Lshared H2. Method adapted to actual declared three-consumer flow, not asserted O8 synthetic 1/6s timing. |
| SF11-02 Signed radiation/background | SF11; GDD§6; legacyP5,8 | C3 isolated | T_surface=T_env→net0; hotter environment→incoming/net heating, colder→outgoing. Не constant-MW sink и не double background+direct term; self exhaust не охлаждает прежнее hull heat. | PASS | Carryover r1 8568ffee: P:signed-radiation bg100/300/500 signs; U:kernel/boundaries energy/background/self-exhaust. |
| SF11-03 Thermal stop/restart | SF11; GDD§6; legacyP7 | C3 gate regression | High/low gate закрывается в accepted thresholds, restart только после hysteresis; no chatter и no work при closed. Проверить crossing внутри dt и peak до конца tick, force/mining actual согласованы. | PASS | Carryover r1 8568ffee: U:kernel thermal stop310/restart305 corridor; U:fitting-refinement gate inside dt; U:peak-cycle inner500K; P:closed mining gate0. |
| SF11-04 Finite inverter/buffer | SF11; GDD§6; legacyP6 | C3 device | Buffer cap10J, rate100W, dt.2: moved≤10J; full buffer не unlimited sink. Inverter hot rejection0→moved0; synthetic COP2/reject150W требует moved+electric≤150W (не200+100). Starvation не оставляет бесплатное cooling. | PASS | P2: buffer10J/100W/dt.2 moved10J then full→0; COP2/reject150W gives100Wcooling+50Welectric,starvation/reject0→0; actual residual0. |
| SF11-05 Preserve background floors | SF11; legacyP7; GDD§6 | C3 invariant fixtures | Background не тратит battery stock и source0/bg100W получает0J; within-step80%Q/20%usablefuel/10Kmargin eligibility соблюдена. Active/protected можно ниже bg floors, общего stock clamp нет. Contents не увеличивают C. | PASS | Carryover r1 8568ffee: U:kernel/boundaries no battery Background, fuel20%,hot10K within-step; P:finite stock + U:bill no content C. |
| SF12-01 Interval and unfinished cycle | SF12; GDD§7 | C3 metrics | O7 exact10s→.28130625SCU/cycle,101.27025SCU/h. Horizon5s cycle незавершён: only measured horizon result, completion time/cycle yield не invent. Display/export называют denominator interval. | PASS | Carryover r1 8568ffee: M:O7-online-exact-after-event-truncation exact10s101.27025SCU/h; A:incomplete interval labels; U:mining-metrics. |
| SF12-02 Typed kg/SCU H₂ subset | SF12; GDD§7 | C3 metrics | Extraction2SCU; diesel6kg, H₂gen1kg/cooler3kg/drive2kg: diesel3kg/SCU,H₂total3kg/SCU,cooler1.5kg/SCU subset. TotalH₂6kg, не9; назначения и species видимы. | PASS | Carryover r1 8568ffee: M:ties-and-N-A-typed-ratios diesel/H2 3kg/SCU,H2cooler3kg subset; P:CSV-units. |
| SF12-03 No-output N/A | SF12; GDD§7 | C3 + C5 | Extraction0 при positive fuel consumption: все удельные kg/SCU N/A/«не определено», не0/Infinity/NaN; no false economy. Абсолютный расход остаётся числом. | PASS | Carryover r1 8568ffee: M:ties-and-N-A-typed-ratios both ratios null at zero extraction; U:mining-metrics; B/A no-output labels. |
| SF12-04 Planned/forced/partial split | SF12; GDD§7 | C3 metrics | O7 planned3s, forcedzero2s, partial1s; planned intervals не forced downtime. De-rating отдельно от полного stop; overlaps не counted дважды в total union. | PASS | Carryover r1 8568ffee: M:O7-online-exact-after-event-truncation forced60000,partial30000,transit60000,service30000 at N30000; overlap30000. |
| SF12-05 Recovery summaries/open stop | SF12; GDD§7 | C3 metrics | O7 recovery2s к partial positive at6. RepeatedN: first2/countN/mean2/max2; append unrecovered stop→«не восстановился» separately, mean не включает open. Не ждёт100%charge. | PASS | Carryover r1 8568ffee: M:O7-online-exact-after-event-truncation count30000 first/mean/max2s; open stop pending30 excluded, completedcount3. |
| SF13-01 Three installed/one selected valid | SF13; GDD§7 | C3 integral | 3installed, group толькоid1, толькоid1positive: denominator r1, numerator id1actual. Два inactive вне группы не портят K; O7 K=.45, рядом абсолютные .28130625SCU. | PASS | Carryover r1 8568ffee: M:fixed-group-duty-transit-partial 3 installed/1selected K=.5 for10work+10transit; O7 K=.45 selected one. |
| SF13-02 Active outside group error | SF13; GDD§7 | C3 schema | 3installed/1selected, positive requests id1/id2/id3→error до Run; не K=3 и не hidden clampK=1. Duplicate/unknown/nonmining group ID также reject. | PASS | Carryover r1 8568ffee: P:group-and-schema-negative reject active outside selected and duplicate/nonmining/unknown IDs; session atomic guard. |
| SF13-03 Fixed denominator/off/duty | SF13; GDD§7 | C3 integral | 10s cycle, selected1, full power but duty.5 всю work10s→K=.5, не1; manualoff5s/full5s→K=.5. Transit/service0output входят10s, grouprated не уменьшается. | PASS | Carryover r1 8568ffee: M:fixed-group-duty-transit-partial K=.5,1/3,.25 for group1/group3(twoactive)/group3(duty.5), fixed20s. |
| SF13-04 Empty/time0/partial horizon | SF13; GDD§7 | C3 metrics/schema | Emptygroup или observedtime0 K=N/A; valid partial horizon O7 до5s: output2r, K_horizon=.4, без completed-cycle label. Invalid zero-duration phase при этом по SF07 reject. | PASS | P2 SF13 corrected isolated initialstate: actual500ticks/5s output.125025SCU,K.40000000000000596,90.018SCU/h,cycles0/partiallabel; emptygroup/time0 nullK,empty2s residual0. Initial adapter mismatch preserved separately. |
| SF13-05 Membership export/replay | SF13; GDD§7,9 | C3 roundtrip + C5 | Resolved group IDs/rated denominator сохранены. Replay не расширяет group до всехinstalled и не выбирает newest catalog. K∈[0,1] по физике/integral, не post-clamp; no universal score across roles. | PASS | Carryover r1 8568ffee: P:JSON-roundtrip-invalid-unknown-catalog resolved group preserved; P:CSV units; physical P/M K≤1 without clamp. |
| SF14-01 Earliest actual loss | SF14; GDD§7 | C3 metrics/kernel | O7 power first at4s; earlier resource event without loss игнорируется для firstblocker. Positive requested partial loss считается limiter onset; duty0 не starvation. | PASS | Carryover r1 8568ffee: M:O7 firstpower4; P:no-output duty0 no limiter; M:resource-event-no-mining-loss positive full output. |
| SF14-02 Ties and refinement | SF14; VC numerical | C3 deterministic + dt trio | O9 atdt.01:4.000/4.005 grouped simultaneous;4.020 separate. Refinement сохраняет honest grouping при near simultaneity≤largestdt, не уверенный wrong singleton. | PASS | P2: O9power4/thermal4.005/resource4.020 acrossdt.01/.005/.0025; literal≤dt groups [power,thermal]/[power,thermal]/[power],resource excluded. Pair4/4.00125 grouped all3 and swappedcause order; exactduration totals. |
| SF14-03 Target reached is success | SF14; GDD§7 | C3 kernel/metrics | Target reached до cargo full/ресурса завершает задачу; normal goal event не blocker. Фиксированное время transit не доказывает flight completion. | PASS | Carryover r1 8568ffee: P:no-output-duty-gate-target-cargo goal no request/no blocker; U:scenarios target; A unfinished honest label. |
| SF14-04 Resource exhausted without loss | SF14; GDD§7 | C3 kernel | CoolerH₂0 при достаточно холодном корабле и full requested mining: resource event есть, firstlimiter нет. No limiting event→«не выявлено за данный опыт», не infinite sustainability. | PASS | Carryover r1 8568ffee: M:resource-event-no-mining-loss event at1s/constraint yet output .0625125 and no first mining loss; U:mining-metrics. |
| SF14-05 Cause duration overlap | SF14; GDD§7 | C3 metrics | O7 power[4,6)/thermal[5,6):2s/1s cause,2s union,1s overlap. Не display300% или total3s; loss/forced/partial counters по measured request. | PASS | Carryover r1 8568ffee: M:O7 precise cause totals/union/overlap; forced-stop union2s/cycle (power includes later partial1s separately). |
| SF15-01 Same-task 1/2/3 series | SF15; GDD§4,7 | C3 matrix + C5 A/B | Legal Pony/M series сохраняет hull, ore/env/phases/service/horizon, initialstocks и auxiliaries; меняется числоlaser явно. O2nominal и O3actual различаются; source/experimental flags visible. | PASS | r1 Pony/M1/2/3 controlled series carryover: same preset declared numerical values preserved by explicit localvariants; corrected L3+hold fresh L2 physical run. PM fresh121suite includes rebuilt7series matrix; new matrix metadata/blob bound, no reuse old L mass/C result. |
| SF15-02 Non-comparable conditions | SF15; GDD§7 | C3 + C5 | Изменить ore density/return, horizon, phases/service, initialQ/fuel либо env между A/B→visible non-comparable condition. Нет молчаливого «same task» или ranking по чужому denominator. | PASS | Carryover r1 8568ffee: M:same-task-changed-conditions process/initial/environment/duration/phases each detected; U:comparison; B:A/B. |
| SF15-03 Repeated service no free reset | SF15; GDD§6–7 | C3 repeated kernel | Два+цикла без explicitrefuel/charge/cooling: boundary stocks/T/buffer наследуются. Unload меняет толькоcargo; nextcycle не Qmax/fuelmax/Tinitial. Burst ухудшается после finiteQ, recovery измеряется. | PASS | Carryover r1 8568ffee: M:repeated-unload-no-free-reset work2+unload1 two cycles: output.25005; Q/fuel/T continue; P finiteQ. |
| SF15-04 Sensitivity endpoints | SF15; GDD§5–6 | C3 paired endpoint | Builtin surface80/160kg/m², missingcp350/900J/kgK, ore1000/3000kg/m³, return.30/.40, shellM/L±25% явные endpoint experiments. No probability/guaranteedU2TTX; output/heat/mass consequences показаны. | PASS | P2: all6hulls12physical endpoint experiments builtinσ80/160, m480/960·V^(2/3),Cdelta470·Δm; CivilS10s output.625125 and T300+20248050/C match. r1 cp350/900,density1000/3000,return.30/.40,shell±25% carryover. |
| SF15-05 Added hardware full costs | SF15; GDD§4–7 | C3 + C5 | Addedlaser drymass/C/power/emitterreturnheat включены; cargo mass меняетF/currentmass. Триlaser не объявляются3×measured sustainability без actualrun; KрядомSCU/h, measured gain отдельным опытом. | PASS | P2 add/remove fullcost5families; U29 +2laserdry4400kg/onebill/cargoMdelC; L2 newactual limits after correctedC; A2 sidebyside swap/currentmass/K+SCU/h. |
| SF16-01 Preset-slot-swap flow | SF16; GDD§8 | C5 live DOM | Из ready preset выбратьslot, compatiblecatalog, swapgenerator/laser без JSON. До применения sidebyside mass/input/output/cargo/thermalbill delta, static conditions labelled. | PASS | A2 actualnewarchive all3origins touchslot→bulkS preview/apply/run; UI2 explicit retroTTX/localvariant/source/delta before application and exports. r1 broadswapflow carryover. |
| SF16-02 Explain incompatibility | SF16; GDD§8 | C5 live DOM | Incompatible larger/category/architecture item можно посмотреть с конкретным refusal; apply не портитfit. Builtin и removable два видимых блока; no hidden purchase/ownership requirement. | PASS | Carryover r1 8568ffee: B:incompatible preview reason/lastfit preserved; builtin/F3 visible; P:slots/category reasons. |
| SF16-03 Empty/error/loading persistence | SF16; GDD§8–9 | C5 | Empty slot/catalogfilter, invalid local input/import, loading и success имеют ясные тексты. Last validfit/run/result остаётся после error; inlinewarnings без modal cascade. | PASS | A2 malformedimport preserves lastrevision/result; R2 invalidedit atomic; U29 session/io; r1 empty/loading/control texts carryover. |
| SF16-04 Touch390 and keyboard | SF16; GDD§8 | C5 390px touch/keyboard | Viewport390px: readiness/F1/mainaction доступны; slotgroups сворачиваются touch; flow работает click/tap/keyboard, без hover/drag. Controls не перекрыты и scroll до F3/export доступен. | PASS | A2 all3origins390x844touch +keyboardArrowDown/Tab,width≤390; newPNGs. r1 broad accessibility assertions carryover. |
| SF16-05 F1/F2/F3 units/provenance | SF16; GDD§8 | C5 | F1task/readiness/firstlimiter/result; F2slot/delta/powerthermalcargomass; F3exactSI/source/ledger/export. Eachfield имеет unit/origin; retained/displayed channels/aggregation/cadence visible. | PASS | A2 F3sourceRef,J/(kg·K),SCU/h,K/recovery/currentmass/peak; UI2 explicit installed/selected variant provenance. r1 CSV/retention unit assertions unchanged. |
| SF17-01 Immutable A/running snapshot | SF17; GDD§8–9 | C3 + C5 Worker | Start A, save A, editnextfit: fitRevision меняется; runningresolvedsnapshot и savedA numbers/IDs/spec/result не меняются. Apply newvariant не mutatesoldcatalogsnapshot. | PASS | R2 nextcargo edit incrementsrevision preserves runningresolvedspec; U29 frozenA/localvariant edit no mutation; A2freezeA/error unchanged. r1 protocol carryover unchangedbytes. |
| SF17-02 New identity/stale messages | SF17; GDD§8 | C3 protocol + C5 | Start/reset/import меняютrunId; oldrun chunks/results/controlacks не обновляютnewfit/result. Old cancelACK не отменяетnewwork; IDs работают nonlocalHTTP без randomUUID. | PASS | Carryover r1 8568ffee: P:protocol-stale-ack-held-controls; B late reset results; A unique startIDs on securefalse HTTP without randomUUID. |
| SF17-03 Wrong/duplicate ACK | SF17; legacyP10 | C3 protocol | telemetryACK=(runId,chunkId); wrong/stale/duplicate не освобождаетcurrent чужойslot. controlACK=(runId,commandId,control); mismatch не matchingack и не меняетrun. | PASS | Carryover r1 8568ffee: P:protocol-stale-ack-held-controls wrong/stale/duplicate not free held queue; B oldAckReleasedNew=false. |
| SF17-04 Telemetry cap without control block | SF17; GDD§8; legacyP10 | C5 slow consumer | HoldtelemetryACK: unackedchunks≤1, queuebounded. Pause/Step/Cancel доступны без telemetryACK; cancelledwork не resumes после lateACK; Step не меняетphysicsdt. | PASS | Carryover r1 8568ffee: P protocol held=1 immediate pause/step/cancel; B held large trace at30176 controls proceed, step exactly unchanged dt1. |
| SF17-05 Control ACK≤500ms | SF17; VC SF19; legacyP10 | C5 long Worker | При≥40000buckets и delayedtelemetryACK measure UIcommand→matchingWorkerACK для Pause/Step/Cancel≤500ms на declaredhost. Записать всеlatencies/browser/CPU, не только click response. Acceptedcapadaptation118channels→34807v2;large30176r1held,oldv140000separate. | PASS | Carryover r1 8568ffee: B v2 held30176/118channels,max34807: pause.100000ms,step0,cancel0; v1 40000/42channels pause1.300000ms,cancel0. A own fresh control11–12.2ms. Adaptive-cap note below. |
| SF18-01 Resolved v2 roundtrip | SF18; GDD§9 | C3 export/import/replay | Fit+run содержит versions, SI resolvedsnapshot, IDs/slotassignments/localvariants/group/conditions/units/origins. Roundtrip сохранит числа/spec/trace/metrics; newestcatalog не substituteresolved. | PASS | R2 corrected universalM+localvariant fit/run JSON exact roundtrip/group/units preserved; U29 save/import/replay never substitute latest; UI2fit/run download exactdeclaredvariant. |
| SF18-02 Legacy goldens | SF18; GDD§9; P1–P14 | C3 legacy runner | Exact baseline6fb716 v1goldens для S/M/finiteQ/sharedH₂/peak сохраняют model/catalognumerics, old100MJ/SCU и oldcargoanchors. v2replay той же v1spec совпадает trace/events/metrics в legacy tolerance; no slotvalidbadge/auto24MJ/cargo96 conversion. | PASS | Carryover r1 8568ffee: M:legacy-three-goldens exact legacy0/1/external replay; U:legacy fixtures invariants; V1 real12h old rate/cargo retained; baseline legacy source blobs unchanged. |
| SF18-03 Unsupported model/schema | SF18; GDD§9 | C3 + C5 import | Unknownmodel/schema reject доrun, path+reason; wrongunit/nonfinite/negativecapacity/outofrangestock/wrongrefs reject без clamp. Previousfit/run/A/result immutable после каждогоfailure. | PASS | U29 io unknownmodel/schema/stocks/numericprovenance/refs rejected; A2malformedimport retains lastrevision/result; r1 broader negative inputs carryover unchangedparser. |
| SF18-04 Unknown catalog/revision replay | SF18; GDD§9 | C3 + C5 | Supportedmodel+trustedcomplete resolvednumericalsnapshot с unknowncatalog только explicit snapshotreplay mode; не validatedfitting. Unknownslotmodel no validation claim; missingtrustednumbers не silently repaired by latestcatalog. | PASS | Carryover r1 8568ffee: P:JSON-roundtrip-invalid-unknown-catalog explicit allowSnapshotReplay with identical trusted numerics; B label/replay/unknown catalog. |
| SF18-05 Text and atomic imports | SF18; GDD§9 | C5 security + C3 | MalformedJSON/unknownversion/importduringrun не уничтожаетpreviousvalid state. Labels вроде `<img src=x onerror=...>` выводятся текстом; no HTML execution/requests. Validimport меняетidentity, staleoldmessages ignored. | PASS | Carryover r1 8568ffee: B literal imported HTML-like label no executed HTML; A malformed import; P session/protocol atomic identities. |
| SF19-01 Actual worst-fit12h heap | SF19; VC retention | C4 actual kernel | Newcuratedfit worst fixedroster,43200s/dt.01: buckets≤50000, telemetryretention≤128MiB, actualheap включает metricstate. Зафиксировать CPU/channel/catalog/ticks/wallpeak; oldv112h не substituted. | PASS | L2 fresh43200s/dt.01,4320455ticks,20instances/118channels,21601buckets,cadence2s,actualheap75894040B; H2fullcap34807+20000events actual126539040B<128MiB. |
| SF19-02 Event truncation first/last | SF19; GDD§7 | C3 + C4 | >20000events сохраняет first128+last19872 exacttimestamps/order, events≤20000, droppedcount visible. Firstlimiter/firstrecovery не потеряны при truncation; eventretention не inputдляsummaries. | PASS | Carryover r1 8568ffee: M O7 events180000 retained20000 dropped160000 first128+last19872 checked firsttail26688:0,finalt300000; summaries unaffected. |
| SF19-03 Bounded online alternating metrics | SF19; GDD§7 | C3 metrics + C4 | O7N10 vsN30000 одинаковый fixedinstance/cause roster; exactoutput/durations/union/overlap/loss/recovery formula, constant-sized counters/openstate, no growinginterval/recoveryhistories. Unknown IDs/causes reject, не dynamicunboundedkey creation. | PASS | Carryover r1 8568ffee: M O7 N10/N30000 cells53=53 all hand aggregates/recovery exact; L cells50→54,limitation80=80; H metrics1414B. |
| SF19-04 Peaks despite downsampling/drop | SF19; GDD§7; legacyP13 | C3 + C4 | Within-basedt500K peak перед tickend и removedraw-event interval сохраняется actualpeak/channelminmax. Online metrics O7 остаются exactпосле truncation/coarsenedbuckets; не derivedfromdownsamplemeans/lostevents. | PASS | L2 fresh allchannelmin/max equals fullstepstream,Tmax445.79598283372053K at2scoarsening. r1 within-tick500K/removed-event/O7exactsummary proof carries over unchangedphysics/retention/metrics. |
| SF19-05 Correct export units/metadata | SF19; GDD§8–9 | C3 + C5 export | Export permodule requested/deliveredW, energyJ, forceN, miningSCU/rateSCU/s, currentmasskg, resourcekg/species, timestampss; retainedcadence/aggregation/channelcount/dropped explicit. C не mass и ore неtonne/SCU substitution. | PASS | Carryover r1 8568ffee: P:CSV-units typed headers/metadata; U:io; A F3 units/source; dynamic L channels requested/delivered/force/resource/time. |
| SF20-01 Fresh clean deterministic checks | SF20; VC | C0–C2 | Exactcandidate cleanbuild/type/test/browser pass; verify evidence currentHEAD. Anyfailure realFAIL, missingmeasurement NOTRUN. Countsпубликуются actual, skipped не PASS. | PASS | Initial/finald8859b1clean/diffcheck0,81actualblobs/fullVC; QAown29scopedunit +1UI2 +13privategroups +freshL2/H2/A2 PASS. PMprovided freshguard121unit/12browser+1SKIP/type/build separately attributed, not claimed QAownfullrerun. |
| SF20-02 Actual extracted artifact | SF20; GDD§1,9 | C6 live smoke | ActualZIP/extractedbytes match builddigest; S/M fittingrun/step/reset/A-B/importexports work, no pageerrors/404; sameoriginassets/Worker без simulationbackend/CDN. | PASS | NewZIP/dist/prefix/sourcebinding40+wholeVC actualSHA verified; A2 all10files each3origins exactnewmanifest,noerrors/crossorigin; run/reset/step/A/import/F3. UI2newvariant preview and fit/run exports. |
| SF20-03 Non-local ordinary HTTP | SF20; legacy0.1.1fix | C6 + C5 | Browser на реальном nonloopbackHTTP origin secure=false; randomUUID может отсутствовать. Start/reset/newCivilM/step создают validrunId и Worker работает; sameorigin4+requests не падают доWorker. | PASS | A2 real192.168.68.65:4183secure=false,randomUUIDundefined,getRandomValuesfunction; uniqueIDsandmatchingcontrolACK≤13.5ms;9sameoriginpage requests. |
| SF20-04 HTTPS Pages prefix equivalence | SF20; GDD§1 | C6 prefix browser | `/u2-lab/` base/prefix и HTTPS-compatible sameoriginWorker/assets; deep/prefixURLs no404. LocalHTTPS/prefix smoke label как emulation, не publicdeployment. PublicPages actual только handeddeployedbuild evidence. | PASS | A2 localselfsignedHTTPS192.168.68.65:4184/u2-lab/ all10asset/Workersha match/sameorigin/noerror; localprefix equivalence only. ActualpublicPagesNOTRUN. |
| SF20-05 Physical/native honest limits | SF20; VC boundaries | Manual operator/device | SecondphysicalLANdevice/nativehooks/bootstrap/finalize/operatormerge отдельные gates. Без actualdevice/native evidence NOTRUN; two browsercontexts/390emulation не физические2clients. Не приёмкаbasebootstrap и не deployment. | NOT RUN | Отдельные secondphysical/native/bootstrap/finalize/operator merge gates отсутствуют; actualpublicPagesdeployNOTRUN. No scopeexpansion/no manufacturedPASS. |

## Actual tested/reviewed paths и change scope

Source-case route/WHAT owners unchanged fromr1. Ни Developerexplanation ниfixreportnumericoracle не читались. Formal81declaredpaths below hash-verified; это declarationbinding, не утверждение чтения каждойстроки81files. Actualexecuted/reviewedaffectedpublicAPI/source/testentries дополнительно перечислены отдельно:

| Actual path | Actual git blob |
|---|---|
| src/app/fitting.ts | bb8c9235c7e367f53d18c3cd7cd5f97f8dca8e00 |
| src/app/fitting-session.ts | 79d13341654ba9f4ae32f77dfbd82940df5e2d32 |
| src/fitting/catalog.ts | 57cd8b5deaa723e30736c1a5f9a9d70871c60a61 |
| src/fitting/compile.ts | 15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4 |
| src/fitting/validate.ts | 671add1dd3302cd1c47852a9fc7c7f6ee74c3ee1 |
| src/fitting/cargo.ts | db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0 |
| src/fitting/data/modules.json | 8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d |
| src/fitting/data/hulls.json | e3e58cae57d5868f3459c444f6543590899f1939 |
| src/scenarios/fitting.ts | 92042fa5db627550c9c0fe824cd75d3c5a38ba58 |
| src/model/v2/physics.ts | 611cfb32566bf46128308357e6dc2224503d915a |
| src/model/v2/step.ts | 3b861c68aaa26960e76aca87bf0a74822be5b230 |
| src/model/thermal-gates.ts | 55b0cd91c368016f2485d3ccbb3924ab915d0e3d |
| src/model/step.ts | 1ac60444582b26ff610eba6e3cd943c51a3a4285 |
| src/runner/fitting-run.ts | f6e6e22071a2641233484a0a573e9e175c2e93f9 |
| src/runner/mining-metrics.ts | dd3125d63322cc07cbaef504bcad1933be6debc7 |
| src/runner/retention.ts | 412803e9de6c2bfcfc5275060a8f439ed35c3782 |
| src/runner/run.ts | 8145e6149237b37148c37056d0c8966f8f918daf |
| src/runner/protocol.ts | 7d6b7a95e2c11c775e4ce961c1a350f582d77268 |
| src/io/fitting-json.ts | f77387afd849d765ad24e8b2ba973637e6ad92a5 |
| src/io/fitting-csv.ts | 04780f50e258c773fe567ab321386bdf0e14d993 |
| src/runner/worker.ts | 7a74cd0f2a16999ff195aee1c24fc095d948a447 |
| tests/fitting/source-fidelity.test.ts | 6c2f162d5c35c13a260342ed0e6ad349d68bd5a4 |
| tests/fitting/bill.test.ts | 7724b9de8980a9fedb2ace73bc9b90be3b1aed8c |
| tests/fitting/controller.test.ts | e2c1fb818a36c9fc7758b45adb37db16335d23e8 |
| tests/fitting/io.test.ts | 1f90266c8c196d260de907fecf02da4aa45167b7 |
| tests/fitting/compatibility.test.ts | 1f94ff58d2464b40cd6f0f2ad4d758b3521d76d4 |
| tests/model/fitting-drive.test.ts | c193815c0546ca443f55278aaa0f6eb6b4e89306 |
| tests/browser/fitting.spec.ts | b243175b7747db4a161f55286bbf8c14b31a3deb |
| tests/fitting-long.mjs | b1210da55c15e09d11f21aeecda3d7811c42e6f4 |
| tests/fitting-memory.mjs | 1f35c7f02842cca147ef16df5e0eccb8847b020f |
| tests/fitting/worst-fit.ts | 70e48b70c0af9762eb1c1b345dde95f7032371f0 |

Changedpaths betweenr1candidate andr2candidate (metadata/documentsdistinctfromruntime):

- .memory-bank/activeContext.md
- docs/experiments/ship-fitting-matrix.json
- docs/experiments/ship-fitting-sensitivity.json
- docs/reviews/2026-10-05-ship-fitting-developer-fix-r1.md
- docs/reviews/2026-10-05-ship-fitting-qa-r1.md
- docs/user/ship-fitting.md
- docs/verification/ship-fitting-v0.2-code-review-contract.md
- docs/verification/ship-fitting-v0.2-runtime-binding.json
- src/app/fitting.ts
- src/fitting/catalog.ts
- src/fitting/compile.ts
- src/fitting/data/modules.json
- src/fitting/validate.ts
- tests/browser/fitting.spec.ts
- tests/fitting/source-fidelity.test.ts

## Full formal81path/blob binding

| Explicit bound path | Independently matched actual blob |
|---|---|
| .github/workflows/verify.yml | e037b53e4e0cc99685b2bfd2912bc0fadc3f1536 |
| docs/experiments/ship-fitting-matrix.json | 7bfc29b46603bf3e67eefdb3f27f2c7623b3c8d2 |
| docs/experiments/ship-fitting-sensitivity.json | 64721a3b787bdcc6ab9b9f8b6f722091fef35a3b |
| docs/gdd/gdd_u2_ship_fitting_v0.2.md | eac9ece236840af775181d5936799df1e8cff2bd |
| docs/plans/2026-10-05-ship-fitting-v0.2.md | aa48875c5c40aae0b3b98f137c704edc11bd0b44 |
| docs/product/ship-fitting-v0.2-acceptance.md | 49d640538146c38114e195dae9d796074c785588 |
| docs/research/ship_fitting_source_synthesis.md | a98c69894d98c688a0c4b19d4e7f39ff44004a67 |
| docs/research/ship_fitting_sources.json | a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec |
| docs/verification/ship-fitting-v0.2-code-review-contract.md | 8566261f46d864e6212d4abaadc49b706e609ae1 |
| index.html | 616d3e500291d24f43d2ecdd96d4a054f2c2680e |
| package-lock.json | af0a9d91cb82c090ac960f32dee6dfbed37ff4ff |
| package.json | 8c4e0cd7fa3722937070955d20d65fe6668c698e |
| src/app/charts.ts | a068ec31eec35cd288525c77e83cd30e77eee695 |
| src/app/compare.ts | 03ba109855b80e9628a8055021ff73ac9a311540 |
| src/app/fitting-session.ts | 79d13341654ba9f4ae32f77dfbd82940df5e2d32 |
| src/app/fitting.css | 18ea45fd7bc6257b023ccabed0781d548de661d9 |
| src/app/fitting.ts | bb8c9235c7e367f53d18c3cd7cd5f97f8dca8e00 |
| src/app/legacy.ts | 9b9dd1f720782ea9e97f80f82933d6c46937b22a |
| src/app/main.ts | 5519fb48cf46d01abec46f91b139a847e4e69975 |
| src/app/styles.css | 831ca51d176678d70628aaad4e432185c0f18390 |
| src/catalog/presets.ts | 1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3 |
| src/catalog/schema.ts | 1df4dd7e084fd760b7d740e7d63739bdcec00e45 |
| src/fitting/cargo.ts | db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0 |
| src/fitting/catalog.ts | 57cd8b5deaa723e30736c1a5f9a9d70871c60a61 |
| src/fitting/compile.ts | 15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4 |
| src/fitting/data/hulls.json | e3e58cae57d5868f3459c444f6543590899f1939 |
| src/fitting/data/modules.json | 8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d |
| src/fitting/types.ts | 3d424945b306c669b6216bc56d1b00be6ee606d6 |
| src/fitting/validate.ts | 671add1dd3302cd1c47852a9fc7c7f6ee74c3ee1 |
| src/io/fitting-csv.ts | 04780f50e258c773fe567ab321386bdf0e14d993 |
| src/io/fitting-json.ts | f77387afd849d765ad24e8b2ba973637e6ad92a5 |
| src/io/json.ts | 1068b436e651c290bf14f4a81b103b188bffdcf5 |
| src/model/scheduler.ts | 79dfea044f13c224c65c8a914fd9f04c5c75ea3f |
| src/model/step.ts | 1ac60444582b26ff610eba6e3cd943c51a3a4285 |
| src/model/thermal-gates.ts | 55b0cd91c368016f2485d3ccbb3924ab915d0e3d |
| src/model/types.ts | e317006703d9f63a88018b13d26ac93c4648a749 |
| src/model/v2/physics.ts | 611cfb32566bf46128308357e6dc2224503d915a |
| src/model/v2/step.ts | 3b861c68aaa26960e76aca87bf0a74822be5b230 |
| src/model/v2/types.ts | a3d839c0837a3abe14a477945bae8f0d98f6e956 |
| src/runner/fitting-run.ts | f6e6e22071a2641233484a0a573e9e175c2e93f9 |
| src/runner/metrics.ts | 7f43b033a956174d01d2ebb0249cdda118adb470 |
| src/runner/mining-metrics.ts | dd3125d63322cc07cbaef504bcad1933be6debc7 |
| src/runner/protocol.ts | 7d6b7a95e2c11c775e4ce961c1a350f582d77268 |
| src/runner/retention.ts | 412803e9de6c2bfcfc5275060a8f439ed35c3782 |
| src/runner/run.ts | 8145e6149237b37148c37056d0c8966f8f918daf |
| src/runner/worker.ts | 7a74cd0f2a16999ff195aee1c24fc095d948a447 |
| src/scenarios/fitting.ts | 92042fa5db627550c9c0fe824cd75d3c5a38ba58 |
| src/scenarios/schema.ts | d10c5101743da454e1ce0b647bd791e87ee94a41 |
| tests/artifact-smoke.mjs | a30437d621ba60feeac718494439b3991c4e07f0 |
| tests/browser/fitting.spec.ts | b243175b7747db4a161f55286bbf8c14b31a3deb |
| tests/browser/lab.spec.ts | 10cd77037856ebb119161dbf6a6b289d971ac463 |
| tests/fitting-long.mjs | b1210da55c15e09d11f21aeecda3d7811c42e6f4 |
| tests/fitting-memory.mjs | 1f35c7f02842cca147ef16df5e0eccb8847b020f |
| tests/fitting/bill.test.ts | 7724b9de8980a9fedb2ace73bc9b90be3b1aed8c |
| tests/fitting/bounded-state.test.ts | ba419869f018c8422db9a3fc373523fa42733aed |
| tests/fitting/cargo.test.ts | 3cfa32399765b681e8daa49874c884c88ede20ce |
| tests/fitting/catalog.test.ts | a817a29b7ef712bd5c8a20eeb3c12aa0da3e1986 |
| tests/fitting/comparison.test.ts | 492fb14ed6f023a314c90eb5af72954b1d309efd |
| tests/fitting/compatibility.test.ts | 1f94ff58d2464b40cd6f0f2ad4d758b3521d76d4 |
| tests/fitting/controller.test.ts | e2c1fb818a36c9fc7758b45adb37db16335d23e8 |
| tests/fitting/fixtures/legacy-0.json | 5e969149e2adaeb9a7811dc10a450cc7cf25276c |
| tests/fitting/fixtures/legacy-1.json | 98c1716219ad17bdb7d46b74619f9f53a8ba625f |
| tests/fitting/fixtures/legacy-external.json | 971d8e1837368020285c0f9d7bc3c6213e9360a4 |
| tests/fitting/io.test.ts | 1f90266c8c196d260de907fecf02da4aa45167b7 |
| tests/fitting/legacy.test.ts | 7828ff24c2bfedea4f8ff635b2b8788686ff94e7 |
| tests/fitting/matrix.test.ts | 3fa7e51e8a2d839b2437df72fdda5d25f1f15bd1 |
| tests/fitting/mining-metrics.test.ts | c6f5e394bbd52953865a33a4fce2a7ef5cac487e |
| tests/fitting/run-validation.test.ts | 6fa4480599efd63f48194438e490d717df9b0e51 |
| tests/fitting/scenarios.test.ts | b5d3fdba30804951802262dfad6ca25a3ddc42ce |
| tests/fitting/source-fidelity.test.ts | 6c2f162d5c35c13a260342ed0e6ad349d68bd5a4 |
| tests/fitting/test-spec.ts | 5ef1e0f932818a3f0275575a365c96f9f2976bcc |
| tests/fitting/worst-fit.ts | 70e48b70c0af9762eb1c1b345dde95f7032371f0 |
| tests/long-kernel.test.ts | 278de7b315a0a894ba9b4b20ca02e82137ff7be7 |
| tests/model/fitting-dispatch.test.ts | bd0d83364d3fc78c18826626be98285f65ed6389 |
| tests/model/fitting-drive.test.ts | c193815c0546ca443f55278aaa0f6eb6b4e89306 |
| tests/model/fitting-energy.test.ts | 0f5254d1e51896702d9d590f202bdf150f82a008 |
| tests/model/fitting-refinement.test.ts | 1d9164c4cdce5a37be750f2e3d24206e9da53b74 |
| tests/model/fitting-stocks.test.ts | 4b587883564c7df6f07e96dd254368e100a6a50a |
| tests/retention-memory.test.ts | e9c3f2d652fc26fb3f94f7b196bb82a63185c164 |
| tests/runner.test.ts | 71bb7286b55c00439ef3912fc00b7abdac6a4477 |
| vite.config.ts | 10e2c43ff8cb04792699695e9678d0d36c36d465 |

WholeVC `docs/verification/ship-fitting-v0.2-contract.md`,actualblob`314d1770363d642df4c2dec069a308b715911c58`,fulltext included in canonicalfingerprint.

## Immutable evidence / not-tested boundary

Evidence manifest `.overgate-runtime/ship-fitting-qa-affected-r2-evidence.json`,SHA256 **`44ff1963201839443dc4da326b5513d884e1b6d8c90dc8a91947a5059998125c`** binds exactcandidate to26private script/log/JSON/PNG files/sizes/SHA256. SelfSHA256report suppliedseparately toPM toavoidcircularhash. EarlysourceFAILhistory preserved byr1; correctedadapterinitialhistory retained. Результат не зависит от будущего liveworkspacehead.

UnresolvedruntimeACmeasurement gaps:0. ProductWHATambiguities:0. RemainingNOTRUN/external:secondphysicaldevice,actualpublicPagesdeployment,nativeintegration,bootstrapacceptance/finalize/operator merge. Не утверждены поlocalhost/nonloopbackhostsamephysicalmachine,390emulation,selfsignedlocalHTTPS,ordinaryguardPASSилиthisscopedruntimeQA. Mergeoperatoraction; productPR readiness stillsubject to separatebootstrap/CodeReview/finalize gates.

— Independent QA (Codex; exactprovider modelID unavailable). Signed exactSHA `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac`,actual81path+wholeVCfingerprint `25b73e117daa583617617dcb4c2fc25ae3e6acf74b3774dccfb1a8b093f4826c` and immutableevidencehashes above. ResultPASS onlyfor declaredruntimeacceptance scope; r1FAIL remains immutablehistory.
