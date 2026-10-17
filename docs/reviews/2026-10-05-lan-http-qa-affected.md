Result: **PASS** for affected P1/P10 ordinary non-local HTTP run initialization and controls on `c2ea755cc47ca9f8f3ac62dc0da8fc45e1abfa2d`; actual insecure context Start/Reset/new M Start/Step, stale-run isolation and localhost regression pass. Physical Xiaomi and real second LAN client **NOT RUN** by QA; this is a scoped defect closure, not full bootstrap/operator readiness.

# QA EXECUTION — LAN HTTP fix, affected surface

- Role: independent QA, installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5 reused, no new verifier launch.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Tested candidate: `c2ea755cc47ca9f8f3ac62dc0da8fc45e1abfa2d`; tree `b319501e5ab5cf6f903ba54b4e1710233b6ffaa0`; branch `feat/power-heat-lab`; worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Production fix source equals published `fead162208d1e7d1918f36d8f51089110e924c51` / Developer `12421364cf538e8e61194f79d4d787f232dc442e`. Candidate adds the immutable baseline LAN FAIL report. Tested source remained unchanged throughout QA.
- Content-Fingerprint: `ffb13a930d4225aeb1b8343486883116f471a2098fc91bdeca01a589b0d8ba4f` (ten scoped Tested-Paths plus ENTIRE exact unchanged VC).
- Four changed paths plus ENTIRE VC fingerprint: `ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8`.
- Source spec: `docs/product/power-heat-lab-v0.1.md`, SHA256 `61384c1829c6d66d54b3588fac203b1a5fb5f84205f0c626d739bd9af128ec40`. Entire P1–P14 VC: `docs/verification/power-heat-v0.1-contract.md`, 9901 bytes, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.

The accepted P1 ordinary HTTP LAN deployment and P10 run/control correlation requirements are unchanged. Six focused cases were derived before fixed implementation inspection and reused from the baseline preparation. This check introduces no new ID format, security prerequisite, numerical tolerance or product policy.

## Own execution and environment

Own fresh `npm run build` passed (exit0). Actual Chromium `153.0.8010.0` at `/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium` ran the focused independent probe (Node24.19.0):

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium timeout 60 node .superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/c2ea755c-lan/browser-lan.mjs
```

Exit0, both origin verdicts PASS. Browser and temporary server closed after execution. The localhost control uses a real Python HTTP static server on port4276. Non-local `http://lan-qa.test:4276` uses `context.route` to fulfill identical own built `dist` files at an ordinary non-loopback HTTP origin. This preserves native origin API gating and tests the actual app/Worker bundle; it does not prove LAN router, DNS, reachability or physical device compatibility. No crypto API override or secure-origin trust flags were used. Launch flags were only `--no-sandbox`, `--disable-dev-shm-usage`, `--use-angle=swiftshader`.

A Worker subclass observes and forwards real commands/responses. For stale-message isolation it dispatches a captured old-run chunk with time98765 and an old-run ACK (command999999/controlstep) after Reset. It does not alter protocol commands, crypto or Worker computation. The UI observation proves rejection of these stale messages; it is not a new exhaustive protocol/security audit.

| Native capability / result | Localhost HTTP | Non-local HTTP |
|---|---|---|
| Origin | `http://127.0.0.1:4276` | `http://lan-qa.test:4276` |
| `isSecureContext` | `true` | `false` |
| `typeof crypto.randomUUID` | `function` | `undefined` |
| `typeof crypto.getRandomValues` | `function` | `function` |
| S14s Start | Completed | Completed |
| Reset time | `0 s` | `0 s` |
| After old chunk + old ACK | `0 s`, `Готов к запуску` | `0 s`, `Готов к запуску` |
| New M14s Start | Completed | Completed |
| Reset then Step | `0.100 s`, matching ACK | `0.100 s`, matching ACK |
| Recorded page errors | None | None |
| Footer | `U2 · Power & Heat v0.1.1 / локальный Worker · без simulation backend` | Same |

## Focused cases / acceptance matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| L01 Native HTTP capability | P1 | Observe actual non-local origin APIs without overriding them; load own same-origin bundle | PASS | `secure=false`, UUID undefined, getRandomValues function; page and bundled Worker function in that context. |
| L02 Start S14s | P1 | Fill14s and Start; observe real Worker start/runId and completion/error state | PASS | Completed14s on insecure HTTP and localhost, no pageerror. Baseline TypeError absent. |
| L03 Reset / new M Start | P1/P10 | Complete S→Reset→select M→14s Start | PASS | Reset0s, M14s completes; new runId differs from S runId on both origins. |
| L04 Step after Reset | P1/P10 | Set duration43200/acceleration1, Reset→Step implicit new run | PASS | Time advances0.100s; real step ACK matches current runId/commandId10/controlstep on both origins. |
| L05 IDs / stale-run isolation | P10 | Observe real outbound controls and inbound ACK; inject captured old-run chunk+old ACK after Reset | PASS for measured surface | Three distinct nonempty start runIds per origin; commandIds1–10 strictly increase; stale messages leave UI0s/ready. |
| L06 Localhost / version preservation | P1/P10 | Same lifecycle on actual localhost server; inspect footer and manifest/lock metadata | PASS | Local control lifecycle passes; manifest/lock root version0.1.1 and UI footerv0.1.1. Dependency versions unchanged. Physical Xiaomi/real LAN remains NOT RUN. |

Observed run correlation samples (not a new ID representation/security policy):

| Origin | S start runId | M start runId | Step-start runId / ACK |
|---|---|---|---|
| Localhost | `a96afb2398315503c69c4d407f5d7ecc` | `f455802c8a8ac4530a0c555e72bbf63d` | `335794af9141083e961ca7d85a55bd09`; command10/controlstep |
| Non-local HTTP | `8cd23f50a75198709c5f79307ff759c1` | `dc042a5df7233a9a3bd35f250463b02e` | `fbcbdc3e9eb6c3799af1609d78b8764e`; command10/controlstep |

Source-bound explanation: reset() now obtains16 native `crypto.getRandomValues` bytes and encodes the runId without requiring secure-context-only `randomUUID`. Existing run/control/ACK gating is preserved. Production changes relative to baseline3b are main.ts and root version metadata in package/lock; the fourth changed path is the browser regression. Physics/catalog/schema/runner/protocol/retention source is unchanged; the built Worker asset remains byte-identical to baseline (`c71797fb56f7e395bc69cdb686398ead8fe2a621d72a61535a65df5d0746a8c5`). No long physical run is justified or claimed for this UI origin fix.

## Inherited and PM-supplied evidence, separately attributed

Developer report `.superpowers/sdd/2026-10-05-u2-lab-launch/lan-http-fix-report.md`, SHA256 `bb8b87b910a2e19f1436f327678445c8c88020a6e9be2b88e0499d2cbd95f01f`: Developer executed56unit/6browserPASS+1skip/typecheck/build/26bootstrapfixtures. These are inherited Developer results, not QA executions. QA's fresh execution is only the build and focused two-origin browser probe above.

PM supplied actual GitHub API evidence: exact fix source `fead162208d1e7d1918f36d8f51089110e924c51` CI runs37272666370 and37272662118 both completedSUCCESS. QA did not fetch or rerun these jobs. PM also independently packed/extracted corrected ZIP0.1.1 and exercised ordinary insecureHTTP Start to completion with no errors. PM-supplied archive SHA256 `2738ebf9b24a2f4694c9705e72afc228db5391962622f5457c3b9a02fea72c1c`,40075bytes. This is archive-specific PM evidence, distinct from QA's source-built dist; QA does not claim to have downloaded or byte-verified that archive.

## Remaining Mac / physical Xiaomi acceptance check

The user's Xiaomi Pad8 Pro Chrome report at `http://192.168.68.65:4173` is the supplied baseline incident. Physical tablet execution and current tablet Chrome version remain unknown to this QA session. The corrected source now passes native insecure-origin execution, while actual tablet/network confirmation remains actionable:

1. On the Mac, use the corrected0.1.1 ZIP; verify its SHA256 against the PM-supplied value above, then extract it. From the extracted directory serve the documented bundle: `python3 -m http.server 4173 --bind 0.0.0.0 --directory dist`.
2. On Xiaomi Chrome open ordinary HTTP `http://<Mac-LAN-IP>:4173/?v=0.1.1` (the observed192.168.68.65 is an example only if still the Mac's current LAN IP). Confirm the footer says `v0.1.1` before accepting results; refresh the new page if the old footer is cached.
3. With preset S and duration14s press Start; confirm completion/time14s and populated results. Reset should show0s. Select M and duration14s; Start should complete again. Reset then Step should advance the displayed simulation time.
4. Record actual URL, tablet Chrome version, displayed footer and the result of each gesture. Record any displayed error or available browser console error if a gesture fails. This report does not require new auth/native tooling or a security payload to run those checks.

Physical Xiaomi, real second LAN client, LAN IP reachability/router/DNS and device-specific rendering/control timing are **NOT RUN by QA**. No new12h/8h/metrics probes, whole audit, global RNG/collision audit, auth/native setup or live Beads operation. B0/B6/B8/operator/native/auth/livebd/Dolt/export/restore/applier/finalize/merge gates remain open or NOT RUN as before. This PASS closes only the named P1/P10 insecureHTTP source/runtime defect and its measured adjacent control surface; it does not close bootstrap readiness.

## Immutable history / own evidence

Baseline `docs/reviews/2026-10-05-lan-http-qa.md` remains byte-identical, SHA256 `c3479495ca70d6c666e206992cd6ed4684d6cd3c1687462e2c6a00f8f227e4fc`, preserving the actual3b FAIL and localhost-only PASS. All eleven previous producer reports below were independently SHA256-compared unchanged; original FAILs remain historical findings and are not rewritten as PASS.

| Preserved report | SHA256 |
|---|---|
| `docs/reviews/2026-10-05-lan-http-qa.md` | `c3479495ca70d6c666e206992cd6ed4684d6cd3c1687462e2c6a00f8f227e4fc` |
| `docs/reviews/2026-10-05-product-code-review-affected.md` | `9ce7e788f1d5f2b8e7f94472ab6d84d1bb89e3b17a5687ec1a1956d76c207b18` |
| `docs/reviews/2026-10-05-product-code-review.md` | `09bc28a89a6e8258c3b8880365eed3f3d0df1bf9ee009c64cee65779d7d1f4e6` |
| `docs/reviews/2026-10-05-product-final-binding.md` | `02f3491f4a11872a59cb96c4b6aa35b9409f6306d74bd7ce4842101a4b99c11c` |
| `docs/reviews/2026-10-05-product-metadata-qa.md` | `70e177a3c24635eda024e53d6ff2eb4c0cf11a255b79224d2d5080199f50e0fb` |
| `docs/reviews/2026-10-05-product-peak-code-review.md` | `5fe484abeef401f3a3bbfdedde998fe24052839cfa0bc4213ebee362219ded08` |
| `docs/reviews/2026-10-05-product-peak-qa-affected.md` | `1b460d5b141d76986f8ef2d10f4de4054993eedd478497db9bd889cf4025f136` |
| `docs/reviews/2026-10-05-product-peak-qa.md` | `47cd51e2e6925501ce015bb7d76ee3c46e3ca03cad02fd4fcfb15e1ee028c706` |
| `docs/reviews/2026-10-05-product-qa-affected.md` | `d93feb0fff650339f0a1627594c2ad15ecad2ce02f274186a1629a1232135059` |
| `docs/reviews/2026-10-05-product-qa.md` | `320ec703f8c9de9f6e1a37bd05c36ea597df917fdce2ac3c34554fad8c261605` |
| `docs/reviews/2026-10-05-product-review-fix-qa.md` | `f035e006da38a7ce03699ead6360f4184856b887ae8fa804a78d2a6588bbef46` |

Own ignored evidence directory: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/c2ea755c-lan/`. Probes are transient, not durable tests/product changes. Own build dist hashes are recorded in binding.json. No source fixes, commits, GitHub writes, resets, live bd or subagents.

| Own evidence file | SHA256 |
|---|---|
| `prepared-cases.md` | `102a91036b075ce70b4e9e62e74f3b9afeea1fe7ce6e6d7b8dcd8b42c192b775` |
| `browser-lan.mjs` | `3b80ebe1e55f682c46a6de1afd20d97f3e4dc718ca02dd8c4102cb48397ca6a3` |
| `browser-lan.json` | `df2b83315ea9e1bf7448be0a74f15f0069af39f77991c119b161a6e805c63881` |
| `binding.json` | `77ae139fb38d4a1a95da7d3bea60c319078ecffae7a5cc7baffbc1cb4d9aa05d` |

## Tested-Paths / canonical binding

Canonical SHA256 primitive: LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below, followed immediately by ENTIRE exact source VC bytes including finalLF, without Markdown fences/markers. All ten candidate blobs equal tested/read worktree bytes. The binding covers scoped HTTP docs/build/UI/control/probe wiring, not a new whole-product semantic audit. Report, generateddist, transient probes and supplied metadata are excluded from the canonical package and hashed separately. Four changed paths are package-lock.json/package.json/src/app/main.ts/tests/browser/lab.spec.ts; their separate fullVC fingerprint agrees with the supplied Developer binding.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `README.md` | `c0a4effc1b427c34983889dd89e2bf6b9e0b569c` |
| `docs/user/local-network.md` | `f02e86b0cdea963d190b41ec87f17748aee573dd` |
| `index.html` | `efcb4db2e7496e7b4be2469766af198001200540` |
| `package-lock.json` | `022eecdbd266af98777c83d9b8fe0b79ded81437` |
| `package.json` | `9f093feba894ff4bae30eba9402a90b7d422b85d` |
| `playwright.config.ts` | `7640eddd834600b7d75331c878a6eefad3d0e5ad` |
| `src/app/main.ts` | `70d13bcbab9720c68fdeaab3374775b016619948` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `tests/browser/lab.spec.ts` | `6e21abc7fcf7d782bcdf9d0d271ee6466ad0b131` |

## ENTIRE unchanged source VC (exact bytes)

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
