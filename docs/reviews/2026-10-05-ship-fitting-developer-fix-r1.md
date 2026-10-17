# Ship Fitting v0.2 — Developer fix r1

Статус: DONE_WITH_CONCERNS. Primary Developer: Codex, GPT-6; точный provider model identifier не предоставлен runtime. Дата2026-10-05, Asia/Novosibirsk. Исполнение в изолированной рабочей ветке feat/ship-fitting-v0.2; один implementer, без дополнительных agents. Это Developer evidence, не acceptance или merge verdict.

Exact HEAD: `d54dd4bd6beaa92e532c2bf537bb3a05860c4c0b`. Baseline QA freeze: `8568ffee9303f1b8c6d7ab1573da8944c22511f0`. QA завершила и сохранила исходные probes, PM явно разрешил исправления. Commit: fix: align fitting catalog and propulsion with source. Tracked tree CLEAN. Старые report, candidate ZIP/dist/manifest и исходные FAIL сохранены; старый archive/dist повторно сверены с исходным manifest. Beads/GitHub/parent checkout/main не изменялись Developer.

Использованы receiving-code-review, systematic-debugging, test-driven-development, executing-plans и verification-before-completion. Project pipeline и Beads single-writer policy имеют приоритет перед generic tracker/reviewer flows. Нового WHAT нет: пять принятых planning blobs и whole VC не изменены.

## Source-backed root cause и исправление

Frozen U2: cdc490e3517c8455f662f82579c45813cdbb9a76. Только manifest/INDEX/direct links и git show exact SHA:path; working copy/archive/keyword routing не использовались. Три owner blob сверены с manifest:

| Current owner | Blob | Применённая норма |
|---|---|---|
| docs/gdd/gdd_ship_cargo_payload_and_dimensions.md, primary1.7 | 002f34cb7f40cf065df6367b8576db8b16b49c21 | §5.2/5.3 dry mass; §6 separate builtin hold |
| docs/specs/spec_ship_slots_v0.7.md, active0.8-r14 | 3d9f260dbc20ad965efcb31fda0bbc7f56fb467e | §4.1 single SKU march/retro; §6.2 architecture/propulsion and hybrid |
| docs/specs/spec_engine_force_grid_v0.1.md, active0.1-r13 | fb8622925bdb0bb676ab2ee43e94ac52a96eda23 | §8.2 explicit reference axes/bill, not hidden role multiplier |

Cargo M ошибочно масштабировался по объёму ×8. Universal M теперь8945.439461×8×4^(−1/3)=45082.189909896595kg вместо71563.515688; Bulk M816×4+984×8=11136kg вместо14400. Volume96/192SCU, S anchors,40curated items и builtin recipe720V^(2/3) сохранены. Массовые origins теперь derived с точной формулой и source section; неверные mass ranges удалены. Cp470/диапазон350–900 остаётся отдельной experimental LAB-STEEL-MIX гипотезой. Исходные связанные mass/C deltas −26481.325778103404kg/−12446223.1157086J/K и −3264kg/−1534080J/K учитываются реальным compiled bill.

D predicate ошибочно требовал diesel propulsion и запрещал electric+diesel-generator hybrid. D теперь принимает однородные diesel либо electric роли; typed generator/tank references работают в существующем kernel. D directH₂ запрещён, E/A operating fuel запрещён, mixed roles и отсутствие matching enabled tank по-прежнему отклоняются. H hull не exposed: public enumU/D/E/A и шесть preset architecturesU,D,U,E,U,U; H-only predicate отсутствует, новый hull/roster не добавлен. H₂ utility на U/D по прежним правилам остаётся отдельным typed resource.

Скрытый compiler retro×0.4 был неверным Developer ruling в T2; исходная запись сохранена как history. compileFit больше не меняет installed SKU mass/force/power по роли. Каждый preset явно хранит отдельный локальный retro variant; Pony сохраняет свой UNKNOWN/G0 pony-engine-retro. Уточнённые force/power/mass origins раскрывают base×0.4, current §8.2 reference0.38/0.95, а пропорциональное масштабирование bill/power названо лабораторным допущением. Компилятор принимает заявленное изделие целиком. Preview показывает тягу и реальный bill; F3 показывает installed/selected items, flags и origins; actual fit/run JSON downloads сохраняют тот же numerical variant.

Все шесть reference axes/power/bill сверены до/после (reference-before.json/reference-after.json). Их числа сохранены, кроме точной BulkM mass/C correction в IndustrialL3. Arbitrary regular diesel SKU march/retro одинаков2950000N/2650kg; pair SKU один физический item в каждом paired slot, без удвоения bill.

## RED → GREEN и обязательные проверки

Каждый shell sourced primary env.sh, Node24.21.0. Полные raw logs и JSON evidence находятся в `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1`.

| Команда / evidence | Фактический результат |
|---|---|
| npx vitest run tests/fitting/source-fidelity.test.ts на baseline | RED11FAIL/1negativePASS: две mass formula, sameSKU identity, six explicit references, hybrid, variant roundtrip |
| npx playwright test tests/browser/fitting.spec.ts --grep 'reference retro' на original dist | RED1FAIL: preview2650kg скрывал compiled1060kg и не раскрывал local variant |
| source-fidelity.test.ts после исправления | GREEN12PASS |
| targeted source-fidelity/compatibility/bill/controller/io/fitting-drive | GREEN29PASS/6files; positive hybrid actual force, generator-only typed burn/no mining; negative architecture/tank/homogeneity; fit/run origins и running/A immutability |
| actual browser retro preview/F3/fit+run download/SKU replacement | GREEN1PASS |
| U2_FITTING_MATRIX_PATH=docs/experiments/ship-fitting-matrix.json U2_FITTING_SENSITIVITY_PATH=docs/experiments/ship-fitting-sensitivity.json npx vitest run tests/fitting/matrix.test.ts | PASS2tests22.58s; fresh7controlled rows и13sensitivity cases, complete spec/state/metrics and truthful incomplete outcomes |
| npm run test:long | PASS2tests326.96s, actual v2 and exact legacy v1 physical12h at dt0.01 |
| bash .claude/hooks/pre-bash.sh < commit-guard-payload.json | PASSexit0; actual .agents/project/verify.sh:121unit/31files,12ChromiumPASS+1screenshotSKIP, typecheck/build/reference/bootstrap/26cloudfixtures |
| python HTTP4195 + local TLS4196; node tests/artifact-smoke.mjs actual non-loopback/prefix URLs | PASS: extracted ZIP390px first/reset/second/step/Worker, every asset same-origin+prefix; secure=false HTTP preserved; local self-signed TLS only test context |
| git diff --check; source and artifact binding after commit | PASS; committed source blobs and fresh verify dist/extracted/prefix per-file digests match |

Fresh v2 physical12h: 4320455ticks,20instances/118channels,21601retained buckets, estimated83,293,456B; actual GC retained context+arrays **75917704B** <128MiB. All channel minima/maxima equal full step stream. Fixed metrics cells50→54; limitation cells80→80; no interval history. Actual useful output1256.6828988994616SCU, energy residual0.0001036726579367311J/source1.0483665887979028e12J. Legacyv1:4,320,033ticks/42channels/43,200buckets, exact original metrics incl residual−0.07214139105025236J.

Fresh maximum adaptive retention GC: **126549016B** <128MiB,34807buckets/118channels/20000events and bounded state80cells. Trace filling is synthetic; physical12h is separate above. Real Worker held30816buckets, one telemetry chunk; pause/step/cancel measured0ms timer resolution (<500ms), stale ACK did not release new run; actual single physics step1s in ACK fixture.

## Affected AC mapping

| AC | Evidence |
|---|---|
| SF04-02 / SF04 | source-fidelity hybrid positive/negative + compatibility; actual bus force and matching typed generator/tank references |
| SF05-01 / SF05 / SF08-05 | sameSKU item deep equality/bill once; pair once; six explicit source-derived local references; drive regression |
| SF06-01 / SF06 | UniversalM/BulkM owner formula relative1e−8; volume/builtin distinction; compiled mass/C delta and preserved S anchor |
| SF15 | regenerated controlled matrix/sensitivities with snapshots and actual metrics |
| SF16 | actual browser preview/F3 origins, resolved local variant and regular SKU swap |
| SF17 | local edits cannot mutate running snapshot/A; real Worker held chunk/ACK/stale identity checks |
| SF18 | fit/run parse+serialization with local variants/origins, actual browser downloads, legacy full regression |
| SF19 | fresh worst-curated12h, all-channel peaks, full adaptive capacity actualGC, bounded cells/events |
| SF20 | actual manual full verify, clean commit, extracted actual non-loopback HTTP and localTLS /u2-lab/ smoke, artifact digests |

Остальная SF01–20 regression выполнена полным project verify; v1 kernel/old exports/числовые baseline fixtures не изменены. Independent affected QA и scoped Code Review предстоят.

## Exact artifact и evidence binding

Runtime40blobs+wholeVC fingerprint: `8107ca70d7ad8c4b3aa797236a48cfa1a74fe8544bb8257539a1aea56a5ffe89`. Fix scope10committed paths+wholeVC fingerprint: `c0ce04a71df72869bc3a856a82803f9a385e81116640bad17dff1f2a9ce26ffc`. Exact reviewed Developer paths:

- docs/experiments/ship-fitting-matrix.json
- docs/experiments/ship-fitting-sensitivity.json
- docs/user/ship-fitting.md
- src/app/fitting.ts
- src/fitting/catalog.ts
- src/fitting/compile.ts
- src/fitting/data/modules.json
- src/fitting/validate.ts
- tests/browser/fitting.spec.ts
- tests/fitting/source-fidelity.test.ts

Archive: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/u2-lab-ship-fitting-v0.2.0-fix-r1.zip`

ZIP SHA256: `3f8467bc07b256a1c6435a900bad59bdf7410d86fe46ca68941d57c66cf37b49`

Extracted dist: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/dist`

Prefix root: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/prefix`

Dist digest: `a1d561744a60fb06b79b60b58ff442a515c33eb88bcd8e81429aa5e07c37e810`

Manifest: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/artifact-manifest.json`; fix-scope binding: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r1/fix-scope-binding.json`. Каждый final source blob совпал с git HEAD:path; свежий verify rebuild совпал с archive/extracted/prefix. Старый candidate32f399 ZIP/dist не изменён и parent4183/4184 не тронуты. Собственные временные4195/4196 остановлены через exact exec sessions;4173 свободен после Playwright.

NOT RUN: физическое второе LAN устройство, supplied ClaudeDesign visual integration, actual public Pages deployment/new-version smoke, native adapter hook activation, bootstrap/operator export/restore/acceptance/finalize и main/sourcePR merge. Screenshot-only test SKIP. Manual guard execution не объявляется native adapter smoke. Public Pages остаётся прежней сборкой. Нет новых dependencies/economy/detection/config writer.

Signature: primary Developer Codex/GPT-6, exact candidate `d54dd4bd6beaa92e532c2bf537bb3a05860c4c0b`, actual checks выше. Отчёт заморожен для PM/QA; SHA256 companion фиксирует exact bytes. Developer не объявляет acceptance/merge readiness.
