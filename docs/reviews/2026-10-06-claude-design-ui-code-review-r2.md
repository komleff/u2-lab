# Claude Design UI — affected scoped Code Review r2

**Verdict: APPROVED. BLOCKER: 0; ADVISORY: 0. CR-UI-B1 и CR-UI-B2 CLOSED.**

Роль: независимый Reviewer, CODE_REVIEW, та же verifier session `/root/fitting_adversarial_review`.
Модель/среда: Codex; точный provider/model ID средой не сообщён. Подпись означает авторство
этого независимого отчёта, без заявления о криптографической подписи.
Дата: 2026-10-06, Asia/Novosibirsk. Scope: только два findings r1, девять affected paths
и необходимая регрессия. Это affected re-review, не новый полный Review.

## Exact binding и границы

- Worktree: `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`.
- Reviewed HEAD: `c62e3fa2744e2ff2962c0e2483ef4e77d9857d2d`, clean.
- Runtime source: `30a1c9b0953bf61723cd8a9deb570044e1f26862`.
- Product base: `903d36b2ac4a2bfa90997803770ace13d520fbe9`.
- Affected comparison: initial Review HEAD `1d6dd472706572f36d5aaf993d694bdaa078fae2` → reviewed HEAD.
- Formal Review Contract v1.3: `docs/verification/claude-design-ui-code-review-contract.md`,
  blob `aee79eef952a4fc7d703485c55445bfd4bd26933`.
- Formal binding: `docs/verification/claude-design-ui-runtime-binding.json`,
  blob `1fe18740a08c09a416f7c80893a01ea6c19dea6b`.
- **148 exact paths/blobs + entire UI VC fingerprint:**
  `f3c824596bfbbf26b1ec96c0c67296f244b3de19522e22437b296bd2b4e7e515`.
- Entire UI VC: `docs/verification/claude-design-ui-v0.2-contract.md`,
  blob `04a9714111f9c2cb6ab2e94da7f6fda7232d125f`.

Reviewer самостоятельно получил все 148 actual Git blob IDs из reviewed HEAD, сверил
их с перечисленными в formal binding и recomputed SHA256 UTF-8 sorted-key compact JSON
`{blobs: [{path,blob},…], contract: {path,text}}`. `text` — полное содержимое VC из
`git show HEAD:<exact path>`, не выборка строк UI01–18. Результат точно совпал с fingerprint.
Полная explicit 148-path таблица принадлежит указанному immutable binding; здесь она
не дублируется и не означает новое содержательное ревью всех 148 owners.
Accepted WHAT, whole VC и Expected не изменены; прежние Plan Review и численный Review
не открывались заново.

## Actual affected reviewed paths

Прочитаны exact delta и необходимые owner участки этих девяти путей; новые durable
unit/browser guards оценены на соответствие findings, browser guard в этом r2 отдельно
не исполнялся.

| Path | Actual Git blob at reviewed HEAD |
|---|---|
| `src/app/fitting-ui/compare-view.ts` | `145ccfffb5801d02f0992bd955dd7dbf5aa0e7bd` |
| `src/app/fitting-ui/lab-channels.ts` | `95719d313f676dd84cd1a9afd638bf82334d173b` |
| `src/app/fitting-ui/lab-view.ts` | `7c2afd89f908a1a834d65d187931ef8a95bbc56f` |
| `src/app/fitting-ui/ship-view.ts` | `d356059caa5a2161c167cf74810fba1f23eb014a` |
| `src/app/fitting-workspace.ts` | `6abda3960cfae3e6b18eb0e72a8692695bba0d3d` |
| `src/app/fitting.css` | `7a3925472c0f64309c6f261468d3030048e2290c` |
| `src/app/fitting.ts` | `9cf02266db9649886302e27fec30477598178505` |
| `tests/browser/claude-ui-review.spec.ts` | `5bc81ac7edfa156fa7b266f892042861ac3d83ec` |
| `tests/ui/code-review.test.ts` | `c611d460d70449996266fb9d78798b75bd69f5b1` |

Остальные **19 paths первоначального 26-path Review** самостоятельно сверены:
`git rev-parse 1d6dd47:<path>` равен `git rev-parse c62e3fa:<path>` для каждого.
Их содержательное Review carryover — из immutable r1; exact blobs перечислены в formal
binding и r1, без нового широкого аудита:

- `public/assets/README.md`
- `public/assets/fonts/IBM-Plex-Mono-OFL.txt`
- `public/assets/fonts/IBMPlexMono-Medium.ttf`
- `public/assets/fonts/IBMPlexMono-Regular.ttf`
- `public/assets/fonts/PT-Sans-Narrow-OFL.txt`
- `public/assets/fonts/PTSansNarrow-Bold.ttf`
- `public/assets/titan-640.webp`
- `src/app/fitting-ui/dom.ts`
- `src/app/fitting-ui/instance-details.ts`
- `src/app/fitting-ui/presentation.ts`
- `src/app/fitting-ui/swap-dialog.ts`
- `src/app/fitting-ui/telemetry.ts`
- `tests/browser/claude-ui-fixes.spec.ts`
- `tests/browser/claude-ui.spec.ts`
- `tests/browser/fitting.spec.ts`
- `tests/ui/presentation.test.ts`
- `tests/ui/qa-fixes.test.ts`
- `tests/ui/telemetry.test.ts`
- `tests/ui/workspace.test.ts`

Первоначальный signed report сохранён без изменения:
`.overgate-runtime/claude-design-ui-code-review-r1.md`, 40081 B,
SHA256 `caa8f3eb0a89c35f4426d660e5a6bb0d57f3aa256389ab637bae3c3777abaddc`.

## Closure findings

**CR-UI-B1 CLOSED — finite extrema длинного retained trace.**
Location: `src/app/fitting-ui/lab-channels.ts`, `channelsView` finite-extrema loop;
`tests/ui/code-review.test.ts`, два B1 guards.
Исходный контрпример: supported Sputnik 1, horizon4096s/dt1, 4096 buckets,
21 Energy/W curves → 172032 min/max arguments; argument spread вызывал RangeError,
включая hidden-Lab render при завершении Worker.
Теперь минимум/максимум вычисляются по всему retained окну через scalar updates,
без неограниченного списка аргументов. Для extrema учитываются только finite значения,
выбранные видимые кривые; negative/empty/all-hidden bounds проверены durable guard.
Данные plot/table остаются действительными mean/min/max/count и единицами каналов.

Собственный независимый probe построил genuine current-run result через существующий
runner/validated workspace: 4096 ticks, 4096 buckets, 87 channels. Независимый extrema
oracle собрал и отсортировал finite min/max values; получил low0/high77384535.71428572W.
Renderer вывел все21 polyline, точную верхнюю подпись и4096s; hidden-Lab owner render
тоже завершился без исключения. Это короткий адресный reproduction исходного дефекта,
не повтор 12h acceptance или новая проверка физики.

**CR-UI-B2 CLOSED — current run, prior history и active immutable spec.**
Locations: `src/app/fitting-workspace.ts` (`getCurrentResult`, `isPreviousResult`);
`src/app/fitting.ts` (`currentResult`, render/F1/F3/instance callbacks);
`src/app/fitting-ui/{lab-view,ship-view,compare-view}.ts` и `.fit-f1 small` в `fitting.css`.
Исходный контрпример: completed20s old result, repeated Start с новым runId до first chunk;
Lab/F1 ранее выдавали old measurement как Running/Paused нового теста.
Теперь current projection требует exact active runId/owner match. До matching first chunk
Lab показывает ожидание измерений и фактический active runId, без старого measured interval.
Prior result сохраняется в history и явно подписан предыдущим run/revision в Fitting,
Compare и F1; экспорт prior result и frozen A не теряются.

Locked Lab scalars, F3 и callback выбора instance берутся из active immutable spec даже
при выборе foreign variant до first chunk. Следующие условия выбранной сборки остаются
её next-test данными; callback не подменяет active instance новым fit. F1 длинный caption
имеет `overflow-wrap:anywhere`; прежнее literal error/newline поведение сохранено.
Собственный probe прошёл waiting/paused-before-first → foreign selected B600s/background333
при active A20s/background100 → genuine first chunk active → terminal selection restore.
Prior JSON/frozen A побайтно равны сохранённым JSON snapshots, late old result/status
не изменяют active run; после terminal B получает собственные history/next conditions.
Четыре durable guards дополнительно покрывают same/changed-fit rerun, signed bounds и
foreign selection. Native touch export/390px caption wrapping — подтверждение независимого
QA ниже, без выдачи за новый собственный browser run.

**Open findings: нет.** Новых BLOCKER/ADVISORY в этом affected scope нет.
UI13-02 unavailable named attribution остаётся явным operator-deferred scope,
не новым failure или рекомендацией расширить реализацию.

## Own verification

1. Exact HEAD/clean status; actual148 Git blobs, whole VC canonical fingerprint;19 exact
   carried blobs. PASS. При повторной canonical проверке первая локальная команда ошибочно
   трактовала `binding.contract` как строку; метод исправлен на фактический `{path,text}`.
   Это ошибка review harness, без product FAIL или изменения binding.
2. Read-only targeted delta/static closure review всех девяти путей. PASS.
3. `source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh`;
   `npx vitest run tests/ui/code-review.test.ts --reporter=verbose`:
   **1 file /4 tests PASS**,914ms. Полный guard здесь не повторялся.
4. Node24.21.0 private independent counterexamples:
   `node --experimental-transform-types --import /tmp/claude-ui-review-loader.mjs /tmp/claude-ui-review-probes-r2.mjs`:
   **2 addressed closure probes PASS**, exit0. Genuine trace и owner-boundary assertions
   перечислены выше; test code и repository files не менялись.
5. QA r4 report/manifest seals и все27 перечисленных evidence files independently hashed:
   mismatch0. Старые127 seals в этой affected session заново не проверялись.

Private own evidence:

| File | Bytes | SHA256 |
|---|---:|---|
| `/tmp/claude-ui-review-loader.mjs` |407|`a1163640998777e90bb47fbac1e601b7e33dd915c19c1105a6231a0b6bee6aed`|
| `/tmp/claude-ui-review-probes-r2.mjs` |5792|`d9181b93ba513b45822462d2856fa7a0d28133ebf70413cedf090067ef67b3c1`|
| `/tmp/claude-ui-review-probes-r2.log` |643|`191893ba7adb417db7476ef21b23c4129ce054695457a7933e65f90df1d456ac`|

Own raw outcomes:

```json
{"check":"CR-UI-B1 independent genuine retained extrema","status":"PASS","ticks":4096,"buckets":4096,"channels":87,"Wcurves":21,"finiteExtrema":172032,"lower":0,"upper":77384535.71428572,"renderBytes":7039205}
{"check":"CR-UI-B2 independent waiting/history/foreign selection/real first chunk/terminal","status":"PASS","activeHorizon":20,"firstMeasurementSeconds":1,"foreignNextHorizon":600,"priorExportUnchanged":true,"frozenAUnchanged":true,"lateOldRejected":true}
```

## Inherited QA/build evidence

Независимый QA r4 прочитан полностью; signed exact bytes проверены:
`.overgate-runtime/claude-design-ui-qa-affected-r4.md`,19165 B,
SHA256 `a7225672862a73765837adfd8e9658c39df1fded094f1b130996ce140d88dd51`.
Manifest `.overgate-runtime/claude-design-ui-qa-affected-r4-evidence.json`,8358 B,
SHA256 `e96417126614636cb89064b60c6046e4cfb67ffd28f6d6c80e1a643d5b37ae29`.
Публикация PM: https://github.com/komleff/u2-lab/pull/6#issuecomment-6005658793.

QA fresh10 affected-risk slices PASS закрывают B1/B2 и linked D12: genuineLAN4096s/dt1
visible/hidden completion, independent21W extrema/table units; three-origin true390px
synchronous Start и held genuine first-message delivery, prior native export, foreign
next600vsactive20/31, controls/late-old/frozen A; literal refusal/export atomicity.
Это **не10 полных original methods fresh**. Original72 mapping71PASS/1deferred содержит
честно отмеченные исторические части/переносы; остальные старые случаи не стали новыми
Reviewer executions. Browser automation с isMobile/hasTouch не называется physical tablet.

Current full normal PM/Developer guard:189unit/28browserPASS+1inheritedSKIP,
type/build/reference/bootstrap26 PASS. GitHubCI37386731050/37386726084 SUCCESS — сведения
PM, не собственный новый CI/API execution. Независимые QA/PM148/68/protected85+2/core6/17dist/
51live bodies checks и source-equivalent numerical/12h proof используются как inherited
regression evidence, без нового широкого Review unchanged core.

Единственный review artifact:
`.overgate-runtime/claude-design-ui-v0.2-candidate-fix-r3-final3/`.
ZIP SHA256 `c6e89e0a38bcb0ca8cabe4897aef92d5faef0dfc69ab44a5f3191e0b6cd85ef2`;
dist digest `59bb555e2c59875be0d0242d2c382c94bacc59e3bfaf059e2b59cb78cc255beb`.
Artifact manifest3302 B, own SHA256
`3bb5209b9d00b9bf5352d1e44e12c78400382b0d47e41c69a59e5f426a4eccf2`.
Фактическое поле `sourceFingerprintSha256` source-manifest прочитано:
`9aeb826a6c3cd9ff69860b1debcf30a7414fabb3247933973901a9e2facedefd` (68 paths).
ZIP/all-dist/live-origin matching не исполнялось заново Reviewer в этом r2;
точные QA seals и формальный contract задают проверенную сборку.

## Not reviewed/tested и release

Не выполнялись новый full26/28-path Review, full72 QA, model/catalog/schema/protocol audit,
матрицы, новый12h/GC run, full legacy suite, physical second device/tablet/native,
base-bootstrap/publicPages/main merge или visual/cosmetic расширение. Main/merge readiness
этим отчётом не объявляется. Mining mission/flight/refuel остаются deferredulab-dwi;
unchanged UI13-02 gap и прочие separate operator gates сохраняются.

Все адресные probes завершены. **SOURCE FREEZE RELEASE для этого Reviewer:** финальный
reviewed HEADc62e3fa clean; продукт, tests, servers4183/4184/4186, Beads и PR не изменялись.
Единственные записи — private `/tmp` evidence и этот ignored immutable report.

Signed: independent Reviewer / Codex, session `/root/fitting_adversarial_review`.
Final scoped verdict: **APPROVED / BLOCKER0 / ADVISORY0; CR-UI-B1 CLOSED; CR-UI-B2 CLOSED.**
