# QA EXECUTION — ordinary LAN HTTP run initialization

Result: **FAIL** for the named P1/P10 non-local ordinaryHTTP run-init surface. The page loads, but Start/Reset/newStart/Step call unavailable `crypto.randomUUID` in a native insecure context, throwing before any Worker start command. Same built page on localhost passes the focused controls. This is one source-backed root defect, not four independent new policies/requirements. All earlier producer reports remain immutable history.

- Role: independent QA, installed `.agents/QA_ROLE.md`; same PRODUCT QA session #2/5 reused; no new verifier agent/launch.
- Model: selected/requested `gpt-6.1-sol`, requested reasoning `high`; provider deployment ID unavailable.
- Commit: `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`; tree `e902141473b527fcceb955b77b36d80c3de2fb4b`; branch `feat/power-heat-lab`; tested worktree `/workspace/scratch/faaeb0182a68/u2-lab-feature`. Runtime production source equals d469; newer changes were metadata/report landing.
- Source: `docs/product/power-heat-lab-v0.1.md`; entire exact unchanged P1–P14 `docs/verification/power-heat-v0.1-contract.md` below, SHA256 `68d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24`.
- Content-Fingerprint: `8f50bbbe2aa6eabd90a5dfa1bee43d5b23ce06f9828ab360fec3f91f6522fc15`; ten directly tested/read scoped UI/control/LAN/build/test paths + entire exact VC, explicit binding below.
- Browser: actual Chromium153.0.8010.0 at `/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium`, Node24.19.0, local static production build. No crypto/security-context overrides or secure-origin bypass flags.

P1 and README/local-network guide already accept ordinaryHTTP LAN static serving with no simulation backend/CDN. P10 already requires reliable run/control correlation/reset isolation. HTTPS/authentication is not introduced as a product prerequisite. Six focused cases were prepared before inspecting any fixed implementation in ignored `qa-evidence/3b21aac1-lan/prepared-cases.md`; fixed Developer candidate has not been tested here.

## Environment and actual reproduction

Parent/user reports Xiaomi Pad8 Pro Chrome opened `http://192.168.68.65:4173` but Start did nothing. **Physical Xiaomi/device/LAN-IP reproduction was NOT RUN by QA**; device Chrome version is not known. That observation is supplied, not substituted for independent execution below.

QA built the exact current source (`npm run build`,exit0) and independently launched actual Chromium. Local control URL `http://127.0.0.1:4276` uses a real Python static server over current `dist`. Non-local URL `http://lan-qa.test:4276` uses request interception to fulfill the **identical own dist files** at an ordinaryHTTP non-loopback origin. This is hosted origin emulation, not proof of physical network reachability, DNS or a second device. Native browser `isSecureContext`/crypto availability are observed without overriding them. All assets remain same-origin; no active/security payload or auth action.

Actual command from candidate root:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium timeout 60 node .superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/3b21aac1-lan/browser-lan.mjs
```

The capturing harness exits0 after observing localhostPASS/nonlocalFAIL; JSON verdicts, API values and pageerror/control logs determine acceptance. Server/browser closed after execution.

| Native capability | Actual localhostHTTP | Actual non-localHTTP |
|---|---|---|
| Origin |http://127.0.0.1:4276 |http://lan-qa.test:4276 |
| isSecureContext |true |false |
| typeof crypto.randomUUID |function |undefined |
| typeof crypto.getRandomValues |function |function |
| Browser |Chromium153.0.8010.0 |same Chromium153.0.8010.0 |

## Focused case matrix

| Test case | Source AC | Method | Result | Evidence |
|---|---|---|---|---|
| L01 Origin capability measurement | P1/LAN environment | Actual browser value inspection, identical own build at two origins | PASS for measurement | Nonlocal ordinaryHTTP actuallyfalse/UUIDundefined/getRandomValuesfunction. No artificial crypto deletion or secure flag modification; page/configuration loads. |
| L02 Nonlocal Start S14s | P1 | Fill14s→Start; pageerror/status/time and Worker-message observation | **FAIL** | `TypeError: crypto.randomUUID is not a function`;statusГотовкзапуску,time0s,0Workerstart/outgoing commands. Expected runnable LAN page emits nonempty runId/start and completes. |
| L03 Nonlocal Reset/newStart M14s | P1/P10 | Reset then selectM/fill14s/newStart | **FAIL**, same root cause | Each gesture throws same TypeError;no commands/no state advance. ID generation aborts before reset/newrun, so ordinaryHTTP cannot reproduce the localhost run lifecycle. |
| L04 Nonlocal Step after reset failure | P1/P10 | Step when no active run | **FAIL**, same root cause | Step's implicit start→reset uses same unavailable API;TypeError,time0s,0Workerstart/outgoing commands. |
| L05 Insecure-context run/control/stale correlation | P10 | Planned Start/Reset/newStart/Step ID+ACK checks | **NOT RUN** downstream | No insecure Workerstart exists to correlate; failure is not relabeled missing physics evidence or passing stale isolation. Same checks actually pass localhost below and are prepared for fixed-candidate affected QA. |
| L06 Localhost lifecycle/stale guard preservation | P1/P10 | Actual S14s completion→Reset→oldchunk+oldACK injection→M14s newStart→Reset→Step | PASS for measured local surface | S/M14s complete;Resettime0s;oldrun chunk withtime98765+oldcontrolACK ignored,UIremains0s/Готовкзапуску. Three distinct nonempty start runIDs;commandIDs1–10 strictlyincrease. StepACK matches runId/commandId10/controlstep,time0.100s;no pageerrors. |

On nonlocalHTTP all four gestures independently produced the same TypeError and zero outgoing Worker commands. Worker construction/page rendering is not claimed absent: failure is specifically before `start` protocol dispatch. `src/app/main.ts` reset() unconditionally assigns `runId = crypto.randomUUID()`; Start calls reset(), Reset invokes it directly, and inactive Step implicitly starts. The native API is unavailable at the observed acceptedHTTP origin. Source IDs/ACK correlation work on localhost, explaining why earlier localhost-only browser/packaged-dist checks passed while this LAN prerequisite was missed.

No secure-only API assumption is allowed to replace the already accepted HTTP deployment behavior. QA does not prescribe a new ID format/security policy or fix; Developer owns implementation, and same-session affected cases will require actual insecureHTTP runtime success plus localhost preservation.

## History / known NOT TESTED

All preceding product producer report bytes remain unchanged. In particular original peakFAIL47cd,affectedpeakPASS1b460,metadataPASS70e177 and previous runtimeQA/RV findings/closures are preserved. Their measured numerical/control/loopback successes are not claims of actual non-localHTTP or physical Xiaomi success. Snapshot hashes are retained in current ignored `binding.json`; no old report rewritten.

Physical Xiaomi/LAN-IP,actual second device/DNS/router transfer and its Chrome version NOT RUN by QA. This report uses same-origin HTTP interception as origin/security-context emulation and labels it explicitly. No longphysics/12h/unit-full-suite replays or newwholeaudit. Fixedcandidate execution NOT RUN pending PM exact publication. B0/B6/B8/native/operator/livebd/Dolt/export/restore/auth/applier/finalize/merge remain open or NOT RUN. No source fixes/durable tests/commits/GitHub writes/reset/subagents; only scoped probes/evidence and this immutable FAIL report written.

## Tested-Paths / canonical binding

Canonical SHA256: LC_ALL=C sorted `path SP candidate Git blob SHA1 LF` rows below followed by **entire exact source VC bytes**, including finalLF, no fences/markers. All ten candidate blobs independently equal tested/read worktree bytes. Main/protocol/worker cover observed run/control boundary; browser wiring,build metadata,HTTP docs and index bind the deployment environment rather than a fresh full semantic audit. Report/transient probes/generateddist/parent metadata excluded; generated own dist hashes separately frozen as execution proof.

| Tested-Path | Candidate Git blob SHA1 |
|---|---|
| `README.md` | `c0a4effc1b427c34983889dd89e2bf6b9e0b569c` |
| `docs/user/local-network.md` | `f02e86b0cdea963d190b41ec87f17748aee573dd` |
| `index.html` | `efcb4db2e7496e7b4be2469766af198001200540` |
| `package-lock.json` | `abf726f701e7847f4add67924bca11f4e256e940` |
| `package.json` | `b23b63d705bc2efa3802a518f445e24229c69590` |
| `playwright.config.ts` | `7640eddd834600b7d75331c878a6eefad3d0e5ad` |
| `src/app/main.ts` | `855e4091df7d657aff0b03ed40b57bf66af2e050` |
| `src/runner/protocol.ts` | `6c197c138bb31b3fc301183a7a1fb266adb97f24` |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` |
| `tests/browser/lab.spec.ts` | `76d7fd4026b7e18f0a90a0dc223438c4a55efe7b` |

## Frozen auxiliary evidence

Ignored actual directory `.superpowers/sdd/2026-10-05-u2-lab-launch/qa-evidence/3b21aac1-lan/`. Auxiliary hashes do not replace the canonical Git-blob+entireVC primitive. Parent `/workspace/scratch/faaeb0182a68/artifacts/lan-http-repro.mjs/json` was read as supplied reproduction evidence; the files below are independent QA execution.

| Evidence file | SHA256 |
|---|---|
| `prepared-cases.md` | `102a91036b075ce70b4e9e62e74f3b9afeea1fe7ce6e6d7b8dcd8b42c192b775` |
| `browser-lan.mjs` | `567d301b23feda150298b74a7fd9ee6c67826800a2c354983ad937a6ee5f30ea` |
| `browser-lan.json` | `c667e018391684c135eda5bfb7a44d11bc3bc9b92be537fe6f913aeaf79599f3` |
| `binding.json` | `1d167ff160dda6ad5c8fadb4ebd8af623c3d402c000994296d4e5c641f487663` |

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
