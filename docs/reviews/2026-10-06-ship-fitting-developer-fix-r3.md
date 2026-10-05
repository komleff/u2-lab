# Developer fix-r3 — CR-B2

Actual role: единственный primary Developer. Actual model: Codex, GPT-6 family; exact serving variant недоступен.
Дата: 2026-10-06. Status: **DONE_WITH_CONCERNS**, только developer delivery; acceptance и merge readiness не заявляются.
Worktree: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`; branch `feat/ship-fitting-v0.2`. Baseline: `0c5ead9f179f7e5dfae6db2e325959c7d4f08d13`.
Final exact HEAD: `7d9460421e9a4b12e451c5add81f2785e9205309`; tracked tree clean. Review r2 SHA256 `6e3b9c141ecffda209325ff26aa2e9b68a268d2d6dfddfbe088717282e24eee9` прочитан полностью, исходный probe воспроизведён до production changes. Reviewer freeze released PM.

## Причина и ограниченный delta

CR-B2: абсолютный done tolerance1e−8 в runner выставлял горизонт после одного фактического шага. Для независимых dt/horizon `1.0001e−10/2e−10` и `2e−10/1e−8` measured duration и work недоставали49.995%/98%. Дополнительно runner `dt≤1e−10` и kernel `left>eps` отбрасывали положительный clipped остаток.

Теперь каждый положительный остаток интегрируется; done следует за actual horizon без присваивания вымышленного horizon clock. После полной интеграции kernel clock считается одной операцией input+dt, как duration метрик, устраняя только накопление округления внутренних границ. Resource/thermal epsilon и физические формулы неизменны. Непродвигающий floating clock шаг сообщает явную ошибку вместо ложного completion. Номинальный accepted validation диапазон не изменён, adjusted только comment о clipped остатках. Новых defaults/clamps/WHAT нет.

Ordinary .01/.005/.0025 controls и clipped .025 horizon сохранены. При .0025/.025 остаток округления требует11-го положительного тика; он реально рассчитывается и считается retention/metrics, вместо прежней принудительной правки времени после10-го. B1 coefficient guards/provenance и atomic import остаются прежними. v1 kernel/catalog/runner/exports и exact replay fixtures совпадают с baseline (unchanged-legacy.json); fresh short exact replay PASS.

## Own changed paths и fingerprint

Own6paths+entire VC fingerprint SHA256: `98315eff77db966e918559638f49ff62d1f362126c795c4ff91d08626bbd962a`. Accepted WHAT5 и wholeVC не изменены; источник U2 frozen `cdc490e3517c8455f662f82579c45813cdbb9a76` прежний. Generated matrix JSON меняет только результаты после interval fix; все20 experiment specs JSON-equal исходным.

| Path | Committed Git blob |
|---|---|
| docs/experiments/ship-fitting-matrix.json | `249226c0b8b29bc00a4902282569087b28f9a634` |
| docs/experiments/ship-fitting-sensitivity.json | `7778e9766062c1b52769d54eb80f9810d88a24a1` |
| src/model/v2/physics.ts | `ab8a765826db1f035769327ee3a0a526d5ff73af` |
| src/model/v2/step.ts | `5b403a856c0c04869e2a511d797f94eef0fd1b50` |
| src/runner/fitting-run.ts | `9bee614bd5be7eba1f4504224b1f8465996da630` |
| tests/fitting/time-integration.test.ts | `650894dd5bfe3e57840ff6690496ff961c8c3ebb` |

## RED → GREEN и проверки

Каждая shell source primary runtime env.sh; Node24.21.0. Raw outputs в `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3`.

- Own source-oracle RED на exact исходных source blobs: `npx vitest run tests/fitting/time-integration.test.ts` —13 FAIL/4 positive controls. Первоначальная internal depletion fixture ошибочно оставляла реальный diesel generator; исправлена initial diesel0 и весь suite повторён на исходном коде до GREEN. Оба raw RED сохранены.
- `npx vitest run tests/fitting/time-integration.test.ts tests/fitting/input-guards.test.ts` —42 PASS.17 новых:9 независимых dt×horizon,2 clipped tails<eps,2 lowlevel kernel tails, internal battery split,3 ordinary dt controls; state/measured/work/selectedK/ticks/retention согласованы.25 существующих B1/B2 input guards PASS.
- Исходный reviewer probe: before подтверждает49.995%/98% потери; after — оба первых chunks paused, final measured time exact,2/50 actual ticks, relative work error0/1.33e−15.
- `U2_FITTING_MATRIX_PATH=docs/experiments/ship-fitting-matrix.json U2_FITTING_SENSITIVITY_PATH=docs/experiments/ship-fitting-sensitivity.json npx vitest run tests/fitting/matrix.test.ts tests/model/fitting-refinement.test.ts tests/fitting/legacy.test.ts` —10 PASS/3files; fresh7series+13endpoints, cargo/return/depletion/gate .01/.005/.0025 refinement и legacy short exact replay. Largest absolute SCU delta8.01634314484545e−11; specs unchanged, tolerance не ослаблен.
- `bash .claude/hooks/pre-bash.sh < commit-guard-payload.json` —full normal guard exit0 на final committed source blobs: `.agents/project/verify.sh`, typecheck,163unit/33files, build,13browser PASS+1screenshot SKIP, reference/bootstrap structure,26offlinecloud checks и shell syntax PASS. Никаких guard overrides/skip; native adapter activation NOT RUN.
- `U2_FITTING_LONG_REPORT=.../long-v2.json node --expose-gc tests/fitting-long.mjs` —fresh **physical v2 12h PASS**:43200s actual measured,4320455ticks,20instances/118channels,21601buckets,actual heap+arrays75,915,352B, metric cells50→54, limitation80→80, everychannel min/max exact, residual0.00010367296159427466J; wall283195ms. Legacy actual12h не повторён: exact unchanged v1 proof + current short replay, прежняя legacy12h evidence переносима.
- Full-memory guard fixture:118channels,34807buckets,20000events,actual126,533,920B. RealWorker ACK Pause2.5/Step1.5/Cancel0ms; stale ACK не releasing new chunk.
- Actual extracted non-loopback HTTP `http://192.168.68.65:4195/` и localselfsigned TLS emulation `https://192.168.68.65:4196/u2-lab/` smoke PASS:390px, first/reset/second/Step, real Worker, everyasset same-origin/prefix, noerrors/failedrequests; insecure HTTP randomUUID отсутствует. Own servers остановлены; parent4183/4184 не тронуты.
- `git diff --check` PASS; atomic own6path commit `7d9460421e9a4b12e451c5add81f2785e9205309`.

## AC mapping и границы

SF08–14: positive intervals/actual mining/work-energy accounting; SF15: fresh matrix/sensitivity/refinement; SF17: realWorker/retainedticks/ACK; SF18: supported snapshot/import guards + exact legacy replay; SF19: fresh current physical12h/bounded memory/allchannel peaks; SF20: fresh guard/build + actual extracted ordinaryHTTP/localTLS-prefix. CR-B1 поддержан existing25guard cases без новых coefficient изменений. QA и scopedCodeReview остаются независимыми этапами PM.

**Незакрытая concern:** оператор сообщил XiaomiPad8ProChrome white screen на предыдущем immutablefix-r2 ordinaryLAN4183. PM собирает exact startup stack. Это actual physicalSF20 FAIL unresolved; desktop smoke не считается physical PASS. На fix-r3 физическое устройство ещё NOT RUN. Actual publicPages deployment, native adapter activation, bootstrap acceptance/operator finalize, main/sourcePR merges и внешний visual mock integration NOT RUN; screenshot SKIP. Новых предположительных compatibility/style fixes не введено.

## Новый immutable артефакт

Artifact source40paths+wholeVC SHA256 fingerprint: `2cc85b43685cca09dff252452420d6379824e44264ead1e27be561be81877559`.
Manifest: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/artifact-manifest.json`; SHA256 `842c8c7800483fd1eaa18f009cfac4b516c34874f20df3cf235427a2c519a15e`.
ZIP: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/u2-lab-ship-fitting-v0.2.0-fix-r3.zip`; SHA256 `2c910bc3f203ba0c2ff809a34ad51fa3e0649e7177ec9a11c923f20b7df102bc`.
Extracted: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/dist`; prefixRoot: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r3/prefix`.
Sorted per-file dist digest SHA256 `5b23d780c28adbcf8f946310561cd22c801f6e55f64b4904369edbeee6ec3f81`. Exact committed40blobs, build/extracted/prefix digests и ZIPCRC проверены; old candidate/fix-r1/fix-r2 dirs/reports untouched. Никаких GitHub/Beads/push/main mutations.

| Raw evidence file (new candidate dir) | SHA256 |
|---|---|
| red.log | `7e5e890a604c28a579dca03e85adeb84e66777380f492f153cf6e622f317a7ef` |
| red-corrected-oracle.log | `3b55198e8ae0339bd12dbe74e895e5cfd7a6cad97cdc2f04857516b0e5097493` |
| targeted.log | `c8507dee1a62544838d3601bca7921f2590355875cb4559446567b10d044632f` |
| reviewer-probe-before.json | `f73787d746a5e5c44204172b2ccfdcc2460c0a2eeb8954e275ed20671ff34402` |
| reviewer-probe-after.json | `ab4dfcd5dba49004d12e3c785b2e63b43413f71f3243550dd6d4f8904a1dff4c` |
| matrix-refinement.log | `9f749fba4ca35b71d057bdac375e6354e31e4bcc40c83512dad32cf04c27ed71` |
| matrix-delta.json | `a32944d2154640fdac2ca4ed0ffa4be2787652d44d8a0b537e02a600020f7193` |
| commit-guard.log | `c7f1b0411f4798fab97ce757e12651147ade5ab9d4ef9b93165012ef66f4e70d` |
| commit-guard.exit | `9a271f2a916b0b6ee6cecb2426f0b3206ef074578be55d9bc94f6f3fe3ab86aa` |
| memory.json | `c66c6857513592b3a33e4177c7b2136a7f1a88041e8cbe63fd1bcad26b78a3e5` |
| worker-browser.json | `59b53a4aad83562b4c578da2382463b93f4c53de0a498df1d5b73b57a802a634` |
| long-v2.log | `73e496241cfbb8fc29ec9b8ce1f407bc52a138161a6ee41daf641164575d384a` |
| long-v2.json | `e91aa9f37f66be6dad292f197961050c5e644ec1877273728fe20edb472a5422` |
| artifact-smoke.json | `ae03bfcfc21f3b7bdb6a4d2df2b5e55441390ea5bdfa6dd68240fd5b640752e8` |
| unchanged-legacy.json | `099373e197d5be35456cac552dd707821ccb8bceb339652c4da42732b7153845` |
| changed-source-binding.json | `b14556450993b27f7ab348adaf23bbde788a78301015e80168698c7f9918bc14` |

Signed: primary Developer / Codex GPT-6 family, exact finalHEAD `7d9460421e9a4b12e451c5add81f2785e9205309`. Report immutable после сохранения; content SHA256 хранится отдельным `.sha256`.
