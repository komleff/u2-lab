# Developer LAN HTTP launch fix — 0.1.1

Status DONE_WITH_CONCERNS — stable tested patch for PM publication/updated ZIP and affected validation;
no independent acceptance or operator merge/finalize claim. Role Developer; PM dispatch selected/requested
`gpt-6.1-sol`, reasoning `high`, provider deployment ID unavailable. Date2026-10-05.
Branch `fix/lan-http`, isolated `u2-lab-qa-fix`, clean base `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`.
Final candidate is the commit containing this report. Current feature/original immutable QA checkout untouched.
Approved scope P1 LAN static use and P10 run ID/stale messages; no new product WHAT.
Current four changed source/test/package paths + entire unchanged VC fingerprint `ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8`.
Exact path/blob manifest `lan-http-fix-evidence/fingerprint.txt`; full original VC bytes included in hash.

## RED → GREEN and change

User observed old archive page loaded on Xiaomi Pad8 Pro Chrome at ordinary LAN HTTP, simulation did not start.
Root reproduced missing secure-context-only crypto.randomUUID on a non-local HTTP origin.
Durable browser regression was added FIRST, executed against unchanged current3b dist: actual
isSecureContext=false, typeof crypto.randomUUID=undefined, getRandomValues=function;
first start stayed «Готов к запуску» and testRED. Named source call `reset()` unconditionally invoked
crypto.randomUUID. Root's earlier separate repro independently recorded the TypeError; this report does
not claim a new physical Xiaomi test.

Replace that one dependency with16CSPRNG bytes from crypto.getRandomValues encoded as32hex characters.
IDs are opaque;128bits entropy and fresh IDs for every reset retain stale-run/correlation protections.
No Math.random fallback, new dependency, HTTPS/server requirement or worker redesign.
Per PM rollout instruction, package.json + root package-lock metadata and visible footer are0.1.1.
Dependencies, physics model/catalog/schema versions remain unchanged.

Actual GREEN Chromium153.0.8010.0 non-localHTTP browser test covers start→completion, reset→time0,
secondstart→completion, reset→step→nonzero time,3distinct32hex run IDs and0pageerrors.
Footer version0.1.1 asserted. Actual secure-context settings unchanged, no API capability mocks/flags.
Own bundled dist assets are fulfilled through browser request interception at
http://u2-lab-lan.test:4173 because direct non-local DNS/network is unavailable in this cloud.
This faithfully exercises browser insecure-origin API gating and Worker/UI behavior; it is not a real
second LAN client or actual Xiaomi Pad8 Pro. Evidence `lan-http-fix-evidence/browser.json`.
Instrumentation only records Worker outbound command IDs/types and forwards the exact message unchanged.

## Verification (one fresh full quick run)

```sh
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium npx playwright test -g 'LAN HTTP'
U2_LAN_HTTP_REPORT=.superpowers/sdd/2026-10-05-u2-lab-launch/lan-http-fix-evidence/browser.json PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/workspace/scratch/faaeb0182a68/tooling/browser/extracted/chromium timeout 120 bash .agents/project/verify.sh
git diff --check
```

First targeted browser commandRED; final targetedGREEN. Fresh full project verify exit0:
56unit tests/12filesPASS; typecheckPASS; production buildPASS;6browserPASS +1screenshot-onlySKIPPED
(U2_SCREENSHOTS unset);26bootstrap fixturesPASS; reference/project structure and shell syntaxPASS.
Existing localhost browser tests, reset/stale-run unit tests and ACK correlation remainPASS.
Actual late40k buckets/42channels/dt1s Worker ACK pause0.1ms/cancel0.1ms. New insecureHTTP testPASS
with3fresh IDs and no pageerrors, preserved JSON evidence. Worker dist asset remains
worker-B2b-BfUr.js; only app bundle changes.

## Exact changed paths / limits

Source/test/package: `src/app/main.ts`, `tests/browser/lab.spec.ts`, `package.json`, `package-lock.json`.
Evidence/report: this file, `lan-http-fix-evidence/browser.json`, `lan-http-fix-evidence/fingerprint.txt`.
No physics/model/retention/protocol/source-authority/managed-framework/VC or9-task-checkpoint changes.
No new full physical12h run: prior benchmark untouched; required fullquick suite ran once after final patch/version.
Actual Xiaomi Pad8 Pro/physical second LAN client NOT RUN. PM owns source publication/corrected ZIP and
operator tablet retest, suggested cache-bust URL ?v=0.1.1 with visible footer confirmation.
Native/operator hooks, livebd/Dolt, remoteCI, GitHub publication, merge/finalize NOT RUN by Developer.
All prior reports/history preserved in currentfeature base; no feature reset/main merge.
