# Ship Fitting — Developer fix r2, CR-B1/CR-B2

**DONE_WITH_CONCERNS**, primary Developer `/root/ship_fitting_developer`, Codex/GPT-6; exact provider model ID unavailable. Дата2026-10-06, Asia/Novosibirsk. Это собственное Developer evidence, не QA/review acceptance или merge readiness.

Exact HEAD `a9f3a84ff6fa42b5c830bceb965a7812feb1ffbb`, branch feat/ship-fitting-v0.2, isolated worktree `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`, tracked tree CLEAN. Baseline `d8859b1d7a690ce6882a2a9f76a4255172ccb3ac`. Commit: fix: reject unsupported fitting numerical inputs. Полностью прочитан immutable Code Review r1, SHA256774b54fb8d3f322ade421f95f1f723ada318f6d6ee170fe2002553937764c8c1. PM явно released source freeze. Использованы receiving-code-review/systematic-debugging, TDD, executing-plans и verification-before-completion; project pipeline/Beads writer authority сохранены.

CR-B1: required engine fields не включали pathEfficiency, а общая fraction check разрешала zeroCOP. Exact included reviewer probe сверён по SHA256a3db0941818c5b71b3ab9519344a8da9f81194e1bcf81cf2903b45ca5d923bcb и выполнен Developer на baseline: malformed fit/supported snapshot accepted, first step nonFinite thermal/ledger; own raw stdout сохранён. Исправлен shared itemIssues: electric engine явно требует pathEfficiency, electric pathEfficiency и thermoinverter copEfficiency должны быть finite в (0,1]. Numeric errors имеют точный field path. Existing SI origins обязательны; generator/primary efficiency checks и zero stocks сохранены. Нет hidden defaults/clamp или NaN repair после расчёта. Fit/local variant и supported snapshot одинаково отказывают до запуска/замены last valid state.

CR-B2: validator принимал шаг ниже v2 runner/kernel epsilon1e−10 s. Own original probe: step1e−12/horizon1s → done=true/time0/ticks0. Аналогичный horizon1e−12 с обычным step.01 отдельно воспроизведён через exact baseline validator source (git show), остальные numerical files неизменны: done/time0/ticks0. Оба validated interval поля теперь finite >1e−10 s, step также ≤1 s, ошибки отдельно stepSeconds/durationSeconds. Значения не исправляются молча. Boundary just-above epsilon и horizon2e−10 действительно выполняют step/tick и достигают времени. .01/.005/.0025 остаются поддержаны. Tiny phase с existing phaseAt tolerance пропускается, затем idle продвигает полный horizon (.02s/2ticks); нового phase solver не вводилось.

## Собственные RED → GREEN и проверки

Все shell source primary env.sh, Node24.21.0. Raw logs/JSON: `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2`.

| Команда/проверка | Actual result |
|---|---|
| node /tmp/ship-fitting-review-probe-r1.mjs на baseline | Подтверждены CR-B1 NaN и CR-B2 done/time0; tiny positive battery3controls PASS |
| npx vitest run tests/fitting/input-guards.test.ts до implementation | RED9FAIL/15PASS; missing/zero coefficients, local apply и неподдерживаемые step/horizon |
| npx playwright test tests/browser/fitting.spec.ts --grep 'CR-B1/B2' на старом dist | RED1FAIL: invalid fit accepted без field error/reset last-valid |
| targeted input-guards/run-validation/io/legacy/source-fidelity/drive/refinement | GREEN54tests/7files; 25new guards/boundary/state tests, 3exactv1 golden replays |
| npm run typecheck | PASS |
| bash .claude/hooks/pre-bash.sh < commit-guard-payload.json | PASSexit0; actual full .agents/project/verify.sh:146unit/32files,13ChromiumPASS+1screenshotSKIP, typecheck/build/reference/bootstrap/26cloudfixtures |
| actual new extracted ZIP HTTP4195/non-loopback + localTLS4196 /u2-lab/, node tests/artifact-smoke.mjs | PASS2origins,390px, actual Worker first/reset/second/step, no errors/failed assets, every request same-origin/prefix |
| git diff --check; source/artifact binding after commit | PASS; final source blobs and built/extracted/prefix per-file digests match |

Direct entry tests cover missing/zero/negative/>1/nonfinite coefficients, origins, fit parse, numerical snapshot import, createRun refusal, valid ordinary/upper1 coefficients with finite ledger; unsupported dt/horizon1e−12/below/equal epsilon, upperdt>1, clipped positive horizon, accurate ordinary ticks/metrics. Browser checks six malformed fit/snapshot inputs (missing path/zeroCOP/tiny dt/tiny horizon); last fit/revision/time/result/frozenA/status remain unchanged. Original input objects remain unchanged.

## Numerical evidence carry-forward

Новых numerical formulas/catalog inputs/runtime algorithms нет. `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/unchanged-numerical-proof.json` фиксирует actual unchanged blobs: v2physics/runner, v1model/types/catalog, both fitting catalog JSON и matrix/sensitivity JSON. Пост-validator v2 initialState/physicsShip/stepV2 body byte-identical baseline, SHA256 `d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08`. Baseline40runtime blobs совпадают с source binding repaired r1 artifact. Поэтому actual prior Developer/independent QA12h и matrices остаются carried-over evidence; **новый12h здесь NOT RUN**, не выдан за current own command. Полный normal verify заново исполнил matrix/refinement/retention/Worker regression. Numeric frozen WHAT/wholeVC и source manifest неизменны.

## AC и exact binding

| Address | Evidence |
|---|---|
| CR-B1 / SF01,SF08,SF10,SF11,SF18 | shared coefficient required/finite/provenance guards, fit/run import + finite positive ledger controls |
| CR-B2 / SF07,SF12,SF18,SF19 | exact step/horizon errors, epsilon boundaries, actual completion time/ticks/metrics and exact v1 regression |
| SF16/SF17/SF18 | actual browser atomic refusal preserving fit/result/A, next revision and running snapshot checks |
| SF20 | fresh manual full guard, clean source commit, actual extracted HTTP/localTLS prefix artifact |

Own5paths+wholeVC canonical fingerprint `12e83361eae08f3bc7e7b0f04258d20526707fb471240dcb893e5d6783f3d552`; canonical JSON sorted paths/keys, full UTF-8 VC text, compact separators. Actual committed paths/blobs:

| Path | Git blob |
|---|---|
| src/fitting/validate.ts | 8b49296c785a5fa75edfd840ddf2c784ff93f74c |
| src/model/v2/step.ts | b5eed666341800e1c085c476718ebfe28ffa91f5 |
| tests/browser/fitting.spec.ts | ee2c678e93a817514f8c276b062a7c3b970344ce |
| tests/fitting/input-fixtures.ts | b6c2ad31b1c15149c409cd8862012c1f638d36d9 |
| tests/fitting/input-guards.test.ts | 38b884eed3f649f92f9504e09814d0982f4ab5ca |

Artifact40paths+wholeVC source fingerprint `42767008891dbb09d64367956d30c604920fa0916e820af8e0f79c238c47c921`. `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/fix-scope-binding.json` contains full scoped object. `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/artifact-manifest.json` contains full actual source manifest/file digests and exact HEAD.

ZIP `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/u2-lab-ship-fitting-v0.2.0-fix-r2.zip`

ZIP SHA256 `4efe485b200d456705b84429ee8dbe42fe8a6f1a1f50f06e835437008c0e4970`

Extracted `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/dist`; prefix root `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2/.overgate-runtime/ship-fitting-v0.2-candidate-fix-r2/prefix`. Dist digest `5f18d8d6cb13cd7fa44b1307b8ee50e2998fdec5c11cf6a5228084734d387ba2`. Old initial/fixr1 ZIP/dist/report preserved and their original manifest hashes independently rechecked. Temporary own4195/4196 servers stopped through exact exec sessions; parent4183/4184 untouched;4173 free after Playwright.

NOT RUN: new12h (validation-only delta rationale above), physical second LAN device, actual public Pages deployment, native adapter activation, bootstrap/operator export/restore/acceptance/finalize/main/sourcePR merge, supplied external Claude mock integration. Screenshot case SKIP. Manual full guard is not native-adapter smoke. No dependencies/new physics/WHAT/refactor, no GitHub/Beads/Dolt/JSONL/main mutations or subagents.

Signature: primary Developer Codex/GPT-6, exact `a9f3a84ff6fa42b5c830bceb965a7812feb1ffbb` and actual evidence above. Frozen report bytes fixed by SHA256 companion; independent affected QA/re-review follow in existing sessions.
