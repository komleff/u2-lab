# CODE REVIEW — LAN HTTP affected closure

Verdict: **APPROVED** для scoped P1/P10 LAN HTTP fix. Active BLOCKER: **0**; ADVISORY: **0**. Source defect requiring secure-context-only UUID generation closed by native random-byte IDs and independent two-origin affected QA. Это не physical Xiaomi acceptance, full bootstrap readiness, finalize или merge approval.

- Mode: CODE_REVIEW; affected review в той же RV session.
- Role: independent OverGate Reviewer (RV), installed `.agents/RV_ROLE.md`; same PRODUCT #3/5 reused, без новых agents/verifier launches.
- Model: selected/requested `gpt-6.1-sol`, reasoning `high`; actual provider deployment ID среда не раскрыла.
- Commit: `437d340a3e0a3ce6611c688522c7db35ace9fcbf`; tree `d5620cf1251bf99705567801cdf4838171217dc3`; worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`.
- Published code source: `fead162208d1e7d1918f36d8f51089110e924c51`; pre-fix base `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`. No rebase/merge/source changes by RV.
- QA-tested candidate: `c2ea755cc47ca9f8f3ac62dc0da8fc45e1abfa2d`. Four changed code/test/package files are byte-identical in code source, current published candidate and worktree. Candidate movement adds reports; reviewed source/entire VC stay identical.
- Review Contract: PM same-session dispatch, goal P1 ordinary LAN HTTP and P10 opaque random IDs without stale run/ACK regression; explicit four-file surface and named risks below.
- QA read FIRST: `docs/reviews/2026-10-05-lan-http-qa-affected.md`; SHA256 independently verified `c21055922e1e73d4039a83027b0719f90c82fdbe7b0034e05c68ba3f3827dc12`.
- Source acceptance: unchanged ENTIRE `docs/verification/power-heat-v0.1-contract.md`, 9901 bytes, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`; exact bytes below.
- Content-Fingerprint: `ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8` (four reviewed files + ENTIRE exact VC).
- Independent QA ten-path + ENTIRE VC fingerprint `ffb13a930d4225aeb1b8343486883116f471a2098fc91bdeca01a589b0d8ba4f` is retained as QA binding, not a new ten-path semantic RV audit.

## Actual scoped Review Contract

Goal: Start/Reset/implicit Step work at ordinary non-local HTTP origins with 128-bit opaque random IDs, preserving run/control correlation. IN: four changed files, relevant existing main.ts reset/send/receive/control context, durable insecure-origin regression, supplied Developer RED→GREEN/independent QA/API documentation evidence and package consistency. Named risks: reused IDs/stale ACK; accidental UUID-format dependency; accidental HTTPS requirement; version/lock resolution drift.

OUT: physical model/catalog/canonical GDD, new whole-UI/security/protocol audit, new product policy/ID format requirement, native/auth/live Beads/bootstrap activation, broad browser/physics/long-run experiments. No active injection payload is run. Reviewed-Paths explicitly lists only the four changed files below; downstream Worker acceptance is supported by affected execution evidence, not claimed as a new Worker source audit.

## Finding closure

| Finding | Verdict | Evidence |
|---|---|---|
| LAN HTTP Start/Reset throws because `randomUUID` is unavailable at insecure origin | CLOSED | `src/app/main.ts:220–223` now generates 16 native random bytes on every reset and encodes each as exactly two hex digits. Independent QA observes native `secure=false`, UUID undefined/getRandomValues present, then actual Start/Reset/new M Start/Step completion and stale-run isolation. |

The replacement uses `crypto.getRandomValues(new Uint8Array(16))` directly: all16 bytes are encoded losslessly into32 characters, without time-based IDs, truncation, Math.random fallback, dependency or HTTPS prerequisite. It provides a fresh 128-bit random identifier per reset; no universal entropy/collision guarantee across unmeasured implementations is claimed. Main.ts treats IDs as opaque equality tokens. The existing cancel of the previous run occurs before new ID assignment; commandIds still increase; incoming messages are rejected by `m.runId !== runId` before chunk/control-ACK handling. Telemetry ACK still carries current runId/chunkId. These expressions and controls are unchanged by the fix.

The technical API premise was independently checked against the primary [W3C Web Cryptography Level2, Crypto interface](https://www.w3.org/TR/2025/WD-webcrypto-2-20250422/#crypto-interface): its IDL restricts randomUUID to secure contexts while getRandomValues has no such attribute and accepts Uint8Array. The captured browser capabilities confirm that distinction on the measured Chromium; documentation alone is not substituted for execution.

The durable browser regression fulfills the app's own built assets at an actual non-local HTTP origin and asserts `isSecureContext=false`, unavailable randomUUID and native getRandomValues. It records and forwards Worker commands unchanged; it does not mock crypto or enable secure-origin flags. Start/completion, Reset0s, second Start/completion, Reset→Step, three different IDs and no pageerror are asserted. Independent QA additionally selects M, observes matching step ACK and dispatches a captured old-run chunk/ACK after Reset: UI remains0s/ready on both origins. This supplies the downstream opaque-ID/correlation regression evidence within scope.

Package and lock root version are0.1.1 and match visible footerv0.1.1. Reviewer parsed both current and pre-fix JSON: excluding these root-version replacements, entire package/lock objects are exactly equal. Dependencies, lock resolution, scripts and model version strings therefore did not drift. UI text identifies the corrected archive while accepted product/VC remain unchanged.

## Verification / execution ownership

RV ran static source/test/diff inspection, Git/hash/evidence verification and package JSON equality checks. No fresh RV browser/test/build/long execution is claimed.

| Check / supplied evidence | Result and owner |
|---|---|
| Current candidate/tree, four paths in code source/candidate/worktree, ENTIRE VC | RV exact byte/blob binding PASS |
| Four-path canonical fingerprint, QA report SHA256, entire VC inside QA | RV independently recomputed/verified PASS |
| Affected base→candidate `git diff --check` | RV exit0 |
| Manifest/lock metadata vs baseline | RV JSON equality PASS excluding root0.1.1 updates; dependency resolution exact unchanged |
| Captured independent two-origin lifecycle/correlation JSON | RV hash/fields inspected; S14/M14 completion, Reset0s, stale chunk+ACK rejection, three IDs and matching StepACK10/controlstep verified |
| Fresh build and focused browser | Independent QA exit0 PASS on Chromium153.0.8010.0; localhost real server and routed non-local insecure HTTP assets; not physical LAN/router/device proof |
| Full quick suite / durable test RED→GREEN | Developer supplied56unit,6browserPASS+1screenshotSKIP,typecheck/build,26bootstrapfixtures; not fresh RV/QA full-suite execution |
| Exact-source CI runs37272666370/37272662118 and corrected ZIP smoke | PM supplied SUCCESS/PASS; RV did not fetch GitHub, verify ZIP or execute smoke |

QA transient evidence actually inspected: `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/c2ea755c-lan/browser-lan.json`, SHA256 `df2b83315ea9e1bf7448be0a74f15f0069af39f77991c119b161a6e805c63881`. Non-local row has `secure=false`, `randomUUID=undefined`, getRandomValues=function; S/M14 completed, Reset/after-stale0s/ready, Step0.100s with matching current runId/command10/controlstep, no pageerrors. Localhost row preserves the same lifecycle with native secure=true/UUID available. Three distinct observed IDs prove these lifecycles; they do not constitute a global randomness audit.

## Preserved history / limits

Baseline `docs/reviews/2026-10-05-lan-http-qa.md` remains SHA256 `c3479495ca70d6c666e206992cd6ed4684d6cd3c1687462e2c6a00f8f227e4fc`: actual ordinaryHTTP FAIL and localhost-only PASS are preserved. All older tracked reports remain unchanged; only this new report is written. Prior product CHANGES_REQUESTED/affected closures/QB1 evidence remain historical bytes.

Physical Xiaomi Pad8 Pro/current tablet Chrome, real second LAN client, router/DNS/IP reachability and device rendering/control timing are **NOT RUN by RV/QA**. The unchanged model/Worker does not justify a fresh physical12h replay for this scoped UI origin fix. Full B0/B6/B8/operator/native/auth/livebd/Dolt/export/restore/applier/finalize/merge remain open or NOT RUN; historical original Git push authentication FAIL remains FAIL. PM owns source/report publication and the detailed Mac handoff/tablet retest. APPROVED here means no active blocker in this supplied P1/P10 Review Contract.

## Reviewed-Paths / canonical binding

Canonical input: LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below immediately followed by ENTIRE exact VC bytes including finalLF. SHA256 = `ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8`. Fences/markers are excluded.

| Reviewed-Path | Candidate Git blob SHA1 |
|---|---|
| `package-lock.json` | `022eecdbd266af98777c83d9b8fe0b79ded81437` |
| `package.json` | `9f093feba894ff4bae30eba9402a90b7d422b85d` |
| `src/app/main.ts` | `70d13bcbab9720c68fdeaab3374775b016619948` |
| `tests/browser/lab.spec.ts` | `6e21abc7fcf7d782bcdf9d0d271ee6466ad0b131` |

## ENTIRE exact unchanged Verification Contract

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

## NOT TESTED / not-reviewed surface

RV fresh browser/unit/typecheck/build/physical12h/remoteCI/ZIP execution NOT RUN; ownership of supplied executions is explicit above. Physical Xiaomi/LAN-IP/second device, native/operator acceptance, live Beads/auth and finalize/merge NOT RUN. Global randomness audit, whole UI/security/physics/canonical-source audit OUT OF SCOPE. No source fixes, commits, GitHub/bd writes, resets or new agents. Only this new report is written; PM is single publisher.
