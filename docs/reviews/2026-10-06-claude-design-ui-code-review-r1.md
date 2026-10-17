# Независимый scoped Code Review — Claude Design UI, r1

Mode: CODE_REVIEW  
Role: независимый Reviewer, `.agents/RV_ROLE.md` v2.1; applicable PM lifecycle v3.0.  
Model: Codex; точный provider/model ID средой не сообщён, не приписывается.  
Session: `/root/fitting_adversarial_review`; первый и единственный scoped UI runtime Review, в существующей Reviewer session.  
Commit: `1d6dd472706572f36d5aaf993d694bdaa078fae2`  
Runtime source: `c8f8b36ee300fa0adf9c739755efab9f05ddd265`  
Base: `903d36b2ac4a2bfa90997803770ace13d520fbe9`  
Branch: `feat/claude-design-ui`  
Worktree: `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`  
Work item / Draft PR: `ulab-3lg`, https://github.com/komleff/u2-lab/pull/6  
Review Contract: `docs/verification/claude-design-ui-code-review-contract.md` v1.2, blob `af956308fa7645d36eadbcfcb4502bbc3335e0ae`.  
Whole Verification Contract: `docs/verification/claude-design-ui-v0.2-contract.md`, UI01–18, invariants и evidence целиком.  
Content-Fingerprint: `e8fcb471b0ce47aab34099774438891d7268e520408a7e3e25a5ace676e9e3a3`  
Verdict: **CHANGES_REQUESTED**  
BLOCKER: **2**  
ADVISORY: **0**  
Signed-at-UTC: `2026-10-05T22:27:08Z`

## Результат

В изменённой UI surface обнаружены два воспроизводимых correctness/invariant defects:
завершение поддержанного длинного теста ломает render, а повторный Start до первого
message выдаёт прошлое измерение за предварительный результат нового run. Они адресуют
named risks 1/3/4 и UI09/10/12/18. Это не расширение численной модели или миссии.

Независимые QA r1/r2/r3 и их PASS остаются immutable evidence своих executed cases.
Новые контрпримеры Reviewer не являются повторной 72-case QA, не переписывают её историю
и не означают, что уже исправленные D01–D12 снова открыты. UI13-02 missing attribution
остаётся явно deferred/NOT RUN, не повышен до blocker этого Review.

## Findings

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| CR-UI-B1 | IMPORTANT | [BLOCKER] Поддержанный retained trace вызывает RangeError при completion render | src/app/fitting-ui/lab-channels.ts:32 | fix now | UI12/UI18; changed renderer correctness, named risk3 |
| CR-UI-B2 | IMPORTANT | [BLOCKER] До первого chunk нового run прежний result показывается как текущий preliminary | src/app/fitting.ts:152 | fix now | UI09/UI10, run/result identity invariant, named risk1/3 |

### CR-UI-B1 — длинный retained trace ломает completion

Locations: `src/app/fitting-ui/lab-channels.ts:29–33`; caller `src/app/fitting-ui/lab-view.ts`
и `src/app/fitting.ts` render/complete handler. `values` содержит min/max всех buckets
каждой выбранной кривой и разворачивается в аргументы Math.min/Math.max. Cap retention
не делает такую операцию допустимой: лимит аргументов движка значительно меньше cap.

**Контрпример с genuine численным результатом**, без изменения ядра: текущий Sputnik1,
`durationSeconds=4096`, `stepSeconds=1`, прочие accepted условия workspace default.
Текущий makeMiningRun/validators принимают snapshot. Движок завершает 4096s/4096ticks,
87channels,4096buckets,cadence1,maxBuckets43129. Energy/W группа содержит21 фактический
канал; renderer передаёт172032 min/max значения как аргументы. `channelsView` выдаёт
`RangeError: Maximum call stack size exceeded` на строке32. Short actual20s trace
с20buckets/87channels рендерится успешно. Дополнительный synthetic4096bucket boundary
показал ту же ошибку, но finding доказан отдельно genuine trace и actual браузером.

**Actual immutable artifact**, ordinary LAN `http://192.168.68.65:4183/`, true390 touch:
поддержанный snapshot импортирован существующим JSON, Start активирован native tap.
Реальный Worker проходит до4096s; complete handler падает в
`assets/fitting-CDuQAKej.js:4:28655`, UI остаётся «Выполняется» при `4096 /4096с`,
показателях preliminary и незавершённом визуальном состоянии. Browser pageerror сохранён.
Физика завершена; численная ошибка не заявляется. Тот же Lab renderer вызывается при
каждом render, включая скрытый Lab, поэтому переход в другое представление не устраняет
дефект. Existing Reset позволил восстановить UI в этом private browser context.

**Минимальный fix:** считать extrema итерацией/reduce без variadic argument spread по
retained series; сохранить actual min/max/units/window semantics. Не уменьшать
поддержанный горизонт и не скрывать trace ошибочным clamp. Добавить meaningful guard
renderer/completion на допустимой многоканальной retention boundary и сохранить positive
короткий trace. Изменять model/Worker/catalog/schema не требуется. Если plotting window
ограничивается UI, ограничение должно быть честно подписано и не терять summary extrema.

### CR-UI-B2 — прошлый run становится «предварительным» нового

Locations: `src/app/fitting-workspace.ts:117–139` оставляет owner.result при новом start;
`src/app/fitting.ts:152–156` выбирает result по variantId без сопоставления result.runId
с active.runId; `lab-view.ts` соединяет этот result с новым active status/preliminary.
F1/ship/compare также читают последний owner result при active state без явной пометки
«предыдущий run». Совпадение fit/spec не означает совпадения run identity.

**Own boundary probe:** завершить run `old` дляSputnik1,H20; зафиксировать A; Start `new`
при той же сборке; до первого chunk установить статус paused для этого нового run через
workspace API. Состояние: activeRun=new/paused, result.runId=old/statuscomplete/time20s.
`labView` содержит `run old`, `Пауза`, `наблюдаемый интервал0–20с` и `предварительно`,
без stale пометки. Это окно существует после каждого успешного Start до первого chunk;
при паузе до первого chunk оно может сохраняться. Native pause-before-first-chunk timing
не заявляется: paused case — независимый boundary probe, не браузерная физическая гонка.

**Actual browser доказательство окна:** после завершения короткогоH20 теста повторный
Start вызван DOM click в одном evaluate turn; сразу прочитаны реальные видимые данные
до первого message. UI показывает «Выполняется», `20с /20с`, «предварительно» и прошлую
добычу0.63SCU/темп112.52SCU/ч. После доставки нового chunk время становится0.01s/20s.
Это controlled timing observation настоящего контроллера/Worker, без подмены Worker
payload и без утверждения native-touch timing для этого subcase.

**Минимальный fix:** active/current measurement projection должна принимать result только
при совпадении runId с active.runId; до первого chunk нового run — состояние ожидания
и отсутствие новых измерений. Если прежний owner result сохраняется как history, явно
пометить его предыдущим test/run и не соединять с current preliminary status/time.
Применить смысл consistently к Lab/F1/сравнению, сохранив immutable frozen A и independent
variant results. Guard: same-fit rerun до first chunk/paused boundary, changed-fit rerun,
положительный current chunk и frozen A unchanged. Новый protocol/schema не нужен.

## Собственные проверки и пределы выводов

- Прочитан formal Review Contract до анализа; accepted overlay/whole UI VC и exact
  Claude package сохранены от Plan Review. Прочитаны все изменённые TS controller/view
  файлы, fitting.css, новые UI tests/browser flows и affected diff прежнего fitting.spec.
  Assets проверены по local provenance/bytes; полного нового font/legal/cosmetic аудита нет.
- Exact HEAD/clean tracked worktree проверены до работы и перед подписью; `git diff --check`
  PASS. Independently reconstructed146 Git blobs + entire UI VC fingerprint совпали.
- `npx vitest run tests/ui/workspace.test.ts tests/ui/presentation.test.ts
  tests/ui/telemetry.test.ts tests/ui/qa-fixes.test.ts --reporter=verbose`: **22PASS,4files**.
  Это own execution существующих durable UI guards, не new authored tests и не full185.
- Private Node24.21.0 source-first probes: genuine20s positive render PASS;4096bucket
  synthetic boundary FAIL; genuine4096s/dt1 result renderer FAIL; same-fit rerun identity
  boundary FAIL. Numerical result сам завершён/finite, kernel здесь не ревьюился повторно.
- Read-only live probe на existing immutable ordinary LAN artifact, true390×844 touch:
  secure=false,randomUUIDundefined,inner/scroll390. Native Start genuine4096s snapshot
  →completion RangeError. Recovery Reset и короткий20s positive complete PASS.
  Повторный Start before first message доказал CR-UI-B2. Servers/source не изменялись.
- Независимо проверены source66 manifest hashes, protected85base blobs +2 experiment
  blobs,6 protected compiled assets; ZIP hash/CRC и all17 dist/extracted/TLS-prefix/ZIP
  files exact.9MB matrices не дампились, проверена их Git blob equivalence.
  Artifact manifest hash совпал; binary Titan SHA6137dc8b… равен local provenance.
- D12 CSS delta — только `overflow-wrap:anywhere` с сохранением `white-space:pre-wrap`;
  literal esc/error и native touch durable regression просмотрены. QA r3 current literal
  error/native export evidence прочитано и20 sealed files независимо hash/size checked.

Initial Node probe в strip-only mode не поддержал TypeScript parameter properties;
это harness failure, исправлен запуском `--experimental-transform-types`. Source/model
не менялись; этот tooling error не объявлялся productFAIL.

### Own live counterexample output

```json
{
  "origin": {
    "secure": false,
    "randomUUID": "undefined",
    "inner": 390,
    "scroll": 390,
    "touch": 1
  },
  "actualLong": {
    "status": "Выполняется",
    "time": "4 096 с / 4 096 с",
    "result": "Выполняетсянаблюдаемый интервал 0–4 096 с · наблюдаемый горизонт / неполный цикл · предварительноПолезная добыча113,85 SCUТемп100,06 SCU/чИспользование оснастки44,46 %Дизель6,9 кг/SCUH₂0 кг/SCUВынужденный прост",
    "errors": [
      {
        "name": "RangeError",
        "message": "Maximum call stack size exceeded",
        "stack": "RangeError: Maximum call stack size exceeded\n    at ae (http://192.168.68.65:4183/assets/fitting-CDuQAKej.js:4:28655)\n    at le (http://192.168.68.65:4183/assets/fitting-CDuQAKej.js:4:43298)\n    at z (http://192.168.68.65:4183/assets/fitting-CDuQAKej.js:7:3422)\n    at G.l.onmessage (http://192.168.68.65:4183/assets/fitting-CDuQAKej.js:11:791)"
      }
    ]
  },
  "rerunBeforeFirstMessage": [
    {
      "status": "Выполняется",
      "time": "20 с / 20 с",
      "result": "Выполняетсянаблюдаемый интервал 0–20 с · наблюдаемый горизонт / неполный цикл · предварительноПолезная добыча0,63 SCUТемп112,52 SCU/чИспользование оснастки50 %Дизель29,05 кг/SCUH₂0 кг/SCUВынужденный простой0 сЧ"
    }
  ],
  "pausedAfterDelivery": {
    "status": "Пауза",
    "time": "0,01 с / 20 с"
  }
}
```

### Собственные временные evidence files

Воспроизводимые исходники и raw outputs находятся в `/tmp`; main findings содержат
все необходимые параметры и наблюдения выше, verdict не зависит от их публикации.

| Own evidence | Bytes | SHA256 |
|---|---:|---|
| `/tmp/claude-ui-review-loader.mjs` | 407 | `a1163640998777e90bb47fbac1e601b7e33dd915c19c1105a6231a0b6bee6aed` |
| `/tmp/claude-ui-review-probes-r1.mjs` | 3377 | `663f2d1f14aae9967e0ea90ed4dee197e563a1ab95b3bab0a6b3d470db771786` |
| `/tmp/claude-ui-review-probes-r1.log` | 1708 | `731db23277a9f6228806d534f0ada5c9c71951f24a01a25a71eb37499c273e11` |
| `/tmp/claude-ui-review-browser-r1.mjs` | 3145 | `9341eb11a9ded8d556b499a3d7ebb36bf6172be4cbaa8acadc263231a1d31da5` |
| `/tmp/claude-ui-review-browser-r1.json` | 1685 | `036bb30c6d93f7484715556964c4f32f706c2b5c39a1ccd5199fe82c2caac10b` |

Запуск source probes:
`source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh`;
`node --experimental-transform-types --import /tmp/claude-ui-review-loader.mjs
/tmp/claude-ui-review-probes-r1.mjs`. Browser probe использует тот же Node env/loader
и `/tmp/claude-ui-review-browser-r1.mjs`, existing Playwright Chromium и existing4183.
Никакого нового server/native app/profile пользователя или test/source mutation.

## Что принято как inherited evidence

Independent QA r3: `.overgate-runtime/claude-design-ui-qa-affected-r3.md`,12019B,
SHA256 `afcab438443f095a6cbe9cf54cd20ebfeb6e5982a321d0eb79d5ca3048b1c123`, опубликован
PM без изменения: https://github.com/komleff/u2-lab/pull/6#issuecomment-6004227659.
Manifest `409d5064daed47a8470887b4b5db177cb5679ebe900540b024706442a8409c0e`,20files,
own mismatch count0. QA current4PASS закрывают D12; original72 mapping71PASS/1deferred
состоит из4fresh+67historical carryover, не71fresh execution. Ранее r1 54PASS/17FAIL/1NOTRUN,
r2 subset42=39PASS/3FAIL остаются историей. Эти totals не заменяют дополнительные
контрпримеры Review и не пересчитываются им.

PM fresh full guard:185unit/27browser PASS +1inherited screenshotSKIP,
type/build/reference/bootstrap26 PASS. Reviewer не повторял весь full guard и не
приписывает его себе. GitHub CI был in_progress на переданном handshake; текущий
CI success не заявляется. Protected numerical12h/maxheap и прежний scoped numerical
Review r3 — unchanged-core carryover, fresh12h UI этим Review не выполнялся.

## Named-risk closure кроме новых findings

- Workspace глубокими копиями отделяет variants, active spec и frozen A; global start
  guard, owner-targeted result acceptance/reset и runId/commandId filtering адресованы
  source и22tests. CR-UI-B2 — конкретное исключение в projection до первого chunk.
- Whole-fit apply/batch/rejected import используют существующие validators до commit;
  independent variants/frozenA сохраняются. Builtins read-only, batch не расходует их
  и не создаёт сменных slots. Никакого нового model/core fix не требуется.
- Replacement identity сравнивает actual snapshot instance/item/enabled/mode; prior
  delivered channel не переносится на другой item с тем же slot ID. Номинал и bucket
  mean размечены; undefined/N/A не заменяются DEMO; frozen compare same metrics API.
- Accepted sort controls/card identity/ring gap budget/breakpoints восстановлены;
  finite controls/source checks и QA evidence прочитаны, cosmetic expansion не добавлена.
- Missing event instance/cause attribution раскрыта literal unavailable affordance,
  aggregate propulsionShortfall сохранён. No inference from message text/no fabricated
  events; UI13-02 не превращён в PASS. Это explicit deferred core gap, не новый blocker.
- Literal errors escaped, newline retained/wrapped; local asset paths в source/build,
  separate Legacy defaults/source сохранены. Own HTTP secure=false Start действительно
  исполнен; TLS-prefix/live51 bodies и D12 export остаются отдельно attributed QA/PM proof.

## Reviewed-Paths / actual blobs

Formal binding состоит из146 paths ниже плюс всего UI VC. Changed surface — ровно26
отмеченных UI/controller/style/asset/test paths. Остальные source/acceptance owners
входят для dependency/content-equivalence proof, не полного повторного code audit.

| Reviewed path | Actual Git blob at `1d6dd472706572f36d5aaf993d694bdaa078fae2` | Review extent |
|---|---|---|
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `c6175fa39562a3c123e5b86531f3f9b9bd1ac5bf` | acceptance / source / dependency equivalence |
| `docs/plans/2026-10-06-claude-design-ui.md` | `4bebfddf3010f75c0b8c3af6496cd8e1b52d3b01` | acceptance / source / dependency equivalence |
| `docs/product/claude-design-ui-v0.2-acceptance.md` | `8017aebf7aebb2c1e1bbaa6ea356e651b3e31e19` | acceptance / source / dependency equivalence |
| `docs/product/ship-fitting-v0.2-acceptance.md` | `49d640538146c38114e195dae9d796074c785588` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/README.md` | `aad635b5d766bc4a01201f83ff71cef0680fc5da` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-AB.dc.html` | `1369e9e60d3d8526969b7df4288d609752be81aa` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-ABDiff.dc.html` | `0fdbbd8bd50f9a135c26d956be9654aa6882d398` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-Empty.dc.html` | `93d655dad60d5636ca93470aa5a8e072704e08b1` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-Heat.dc.html` | `77eb732a53d50afab35561637231ef1515619b13` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-Import.dc.html` | `27031bf8336aba1d4b7d905554329f0d1440450e` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-Paused.dc.html` | `984cba5872c16658810c38e6eecca0b95ee86f23` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab-Running.dc.html` | `e180dad831f1405dff157e8f887c9b75bf0bcbf0` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Lab.dc.html` | `c1440fd191013749afe3a799b02a8ac9ec9d0f53` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/LabM-AB.dc.html` | `a0c49715993357f51b330625c1bd8011978a787f` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/LabM-Channels.dc.html` | `2569c38ecb51f74a01f14c1396dfd2699444132e` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/LabM-Run.dc.html` | `47477faef793deef6206eebcef88af1f9ac04977` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/M2-Compare.dc.html` | `1cdeef3808f35778b8ee5b8b728db1ee149d130a` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/M2-Fitting.dc.html` | `4f8f5ffa94a2eee6ec6439db2e8e3f39d508130f` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/M2-Swap.dc.html` | `d87bdb6e974561a8e9a0ea86de1b138ba49ec3a1` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/Main.dc.html` | `99621bfe0f74f697e0b61934355da60c1819f1eb` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/PH.dc.html` | `63d13c702c0d34745ef1f4a8822df30f49a79622` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/States2.dc.html` | `27744f5da18c4b9f5a316bb876013899dbd8a3ac` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/V2-Flat.dc.html` | `65740f61ff447193d060139d996a95c073949e48` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/V2-Incomplete.dc.html` | `7d6c183b7930e99edf9c80bc163692d01a8301f6` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/V2-NotFinished.dc.html` | `1182284c6f09ea15d3e58d72067f86726be69337` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/V2-Running.dc.html` | `0ed8dabfcc02b51bef2bb09fb779c49e650d112d` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/V2-Swap.dc.html` | `45f356c0cacf9a382f998ecc88fa74ddc7ca4c01` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/canvas.json` | `79f4e6828d39c3e358d0aa72e3fc380cbb2495ec` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/mockups/ds/u2/tokens.json` | `be0fc63ca87db8fb4ad7472db125c01c89c35815` | acceptance / source / dependency equivalence |
| `docs/ux/claude-design/ship-fitting-power-heat-ux-v2.1.md` | `0b89e4cc860a187ede0b5f601b6483b113bd5169` | acceptance / source / dependency equivalence |
| `docs/ux/power-heat-lab-claude-design-brief.md` | `89b35b663ee14d7fcdf48b2b7b1e24f78495946c` | acceptance / source / dependency equivalence |
| `docs/ux/ship-fitting-v0.2-claude-design-brief.md` | `c303930bd5b44022c65088953a49ace15f368828` | acceptance / source / dependency equivalence |
| `docs/verification/claude-design-ui-code-review-contract.md` | `af956308fa7645d36eadbcfcb4502bbc3335e0ae` | acceptance / source / dependency equivalence |
| `docs/verification/claude-design-ui-v0.2-qa-cases.md` | `b56ad6ce2337e34e17130101b4cb87d0388dae14` | acceptance / source / dependency equivalence |
| `docs/verification/ship-fitting-v0.2-contract.md` | `314d1770363d642df4c2dec069a308b715911c58` | acceptance / source / dependency equivalence |
| `index.html` | `616d3e500291d24f43d2ecdd96d4a054f2c2680e` | acceptance / source / dependency equivalence |
| `package-lock.json` | `af0a9d91cb82c090ac960f32dee6dfbed37ff4ff` | acceptance / source / dependency equivalence |
| `package.json` | `8c4e0cd7fa3722937070955d20d65fe6668c698e` | acceptance / source / dependency equivalence |
| `playwright.config.ts` | `7640eddd834600b7d75331c878a6eefad3d0e5ad` | acceptance / source / dependency equivalence |
| `public/assets/README.md` | `8a8214a9f9014b45bdd2e76dc624eb4ad2e382d0` | changed UI / asset / test |
| `public/assets/fonts/IBM-Plex-Mono-OFL.txt` | `670c6c04ec17a19131aefbb47472a11c2a5d831c` | changed UI / asset / test |
| `public/assets/fonts/IBMPlexMono-Medium.ttf` | `33c546f68b6007a45a3f10e845523abb2db25399` | changed UI / asset / test |
| `public/assets/fonts/IBMPlexMono-Regular.ttf` | `0c9770d5183ba60dc4350d3e011b782a320761ae` | changed UI / asset / test |
| `public/assets/fonts/PT-Sans-Narrow-OFL.txt` | `297566b7d1e44269c07de66090240f0cc30a9b01` | changed UI / asset / test |
| `public/assets/fonts/PTSansNarrow-Bold.ttf` | `f0e2068a03c2355634ec75ccd1f1ffc5ac69feda` | changed UI / asset / test |
| `public/assets/titan-640.webp` | `596252a0b42a3e7282a914bd04c04db3c13ba3af` | changed UI / asset / test |
| `src/app/charts.ts` | `a068ec31eec35cd288525c77e83cd30e77eee695` | acceptance / source / dependency equivalence |
| `src/app/compare.ts` | `03ba109855b80e9628a8055021ff73ac9a311540` | acceptance / source / dependency equivalence |
| `src/app/fitting-session.ts` | `79d13341654ba9f4ae32f77dfbd82940df5e2d32` | acceptance / source / dependency equivalence |
| `src/app/fitting-ui/compare-view.ts` | `068ebc1c47f8ede6e6bf5eb7765170004beda41b` | changed UI / asset / test |
| `src/app/fitting-ui/dom.ts` | `b35636a7303e06d6349c6a3b24ba5f53df5bb0cc` | changed UI / asset / test |
| `src/app/fitting-ui/instance-details.ts` | `c5f1037a3365dc3b089018b689e0c2214fa8c7d1` | changed UI / asset / test |
| `src/app/fitting-ui/lab-channels.ts` | `21ab164d559db6a324067aa487ee4bee361752cf` | changed UI / asset / test |
| `src/app/fitting-ui/lab-view.ts` | `ba0f8f0fa9e9b9d28e5520b1899103695066a91a` | changed UI / asset / test |
| `src/app/fitting-ui/presentation.ts` | `44030c7fb716a3f4b057ded2afb24a985cc07a6a` | changed UI / asset / test |
| `src/app/fitting-ui/ship-view.ts` | `25cd539a6abb2e6f82754bbc59c077f9a377d0fc` | changed UI / asset / test |
| `src/app/fitting-ui/swap-dialog.ts` | `c74d810917aa87bd302a3d0340c006d6f38d067c` | changed UI / asset / test |
| `src/app/fitting-ui/telemetry.ts` | `59b3b6800147714f07963730be7b6b8b90100020` | changed UI / asset / test |
| `src/app/fitting-workspace.ts` | `baf265e9f315782df7e7adf1255c26d432d0b3f3` | changed UI / asset / test |
| `src/app/fitting.css` | `0194821577a63d67e45cf1c180162d610a934efb` | changed UI / asset / test |
| `src/app/fitting.ts` | `71b482de778abdcf6454e7e7e7f17144e7ec4017` | changed UI / asset / test |
| `src/app/legacy.ts` | `9b9dd1f720782ea9e97f80f82933d6c46937b22a` | acceptance / source / dependency equivalence |
| `src/app/main.ts` | `5519fb48cf46d01abec46f91b139a847e4e69975` | acceptance / source / dependency equivalence |
| `src/app/styles.css` | `831ca51d176678d70628aaad4e432185c0f18390` | acceptance / source / dependency equivalence |
| `src/catalog/presets.ts` | `1c9a44b72efe7d744c4e47b2f7fe4f36fcffb0b3` | acceptance / source / dependency equivalence |
| `src/catalog/schema.ts` | `1df4dd7e084fd760b7d740e7d63739bdcec00e45` | acceptance / source / dependency equivalence |
| `src/fitting/cargo.ts` | `db9202aaf0d083f7241e22bdd05fdbe3ca7a7fa0` | acceptance / source / dependency equivalence |
| `src/fitting/catalog.ts` | `57cd8b5deaa723e30736c1a5f9a9d70871c60a61` | acceptance / source / dependency equivalence |
| `src/fitting/compile.ts` | `15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4` | acceptance / source / dependency equivalence |
| `src/fitting/data/hulls.json` | `e3e58cae57d5868f3459c444f6543590899f1939` | acceptance / source / dependency equivalence |
| `src/fitting/data/modules.json` | `8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d` | acceptance / source / dependency equivalence |
| `src/fitting/types.ts` | `3d424945b306c669b6216bc56d1b00be6ee606d6` | acceptance / source / dependency equivalence |
| `src/fitting/validate.ts` | `8b49296c785a5fa75edfd840ddf2c784ff93f74c` | acceptance / source / dependency equivalence |
| `src/io/fitting-csv.ts` | `04780f50e258c773fe567ab321386bdf0e14d993` | acceptance / source / dependency equivalence |
| `src/io/fitting-json.ts` | `f77387afd849d765ad24e8b2ba973637e6ad92a5` | acceptance / source / dependency equivalence |
| `src/io/json.ts` | `1068b436e651c290bf14f4a81b103b188bffdcf5` | acceptance / source / dependency equivalence |
| `src/model/scheduler.ts` | `79dfea044f13c224c65c8a914fd9f04c5c75ea3f` | acceptance / source / dependency equivalence |
| `src/model/step.ts` | `1ac60444582b26ff610eba6e3cd943c51a3a4285` | acceptance / source / dependency equivalence |
| `src/model/thermal-gates.ts` | `55b0cd91c368016f2485d3ccbb3924ab915d0e3d` | acceptance / source / dependency equivalence |
| `src/model/types.ts` | `e317006703d9f63a88018b13d26ac93c4648a749` | acceptance / source / dependency equivalence |
| `src/model/v2/physics.ts` | `ab8a765826db1f035769327ee3a0a526d5ff73af` | acceptance / source / dependency equivalence |
| `src/model/v2/step.ts` | `5b403a856c0c04869e2a511d797f94eef0fd1b50` | acceptance / source / dependency equivalence |
| `src/model/v2/types.ts` | `a3d839c0837a3abe14a477945bae8f0d98f6e956` | acceptance / source / dependency equivalence |
| `src/runner/fitting-run.ts` | `9bee614bd5be7eba1f4504224b1f8465996da630` | acceptance / source / dependency equivalence |
| `src/runner/metrics.ts` | `7f43b033a956174d01d2ebb0249cdda118adb470` | acceptance / source / dependency equivalence |
| `src/runner/mining-metrics.ts` | `dd3125d63322cc07cbaef504bcad1933be6debc7` | acceptance / source / dependency equivalence |
| `src/runner/protocol.ts` | `7d6b7a95e2c11c775e4ce961c1a350f582d77268` | acceptance / source / dependency equivalence |
| `src/runner/retention.ts` | `412803e9de6c2bfcfc5275060a8f439ed35c3782` | acceptance / source / dependency equivalence |
| `src/runner/run.ts` | `8145e6149237b37148c37056d0c8966f8f918daf` | acceptance / source / dependency equivalence |
| `src/runner/worker.ts` | `7a74cd0f2a16999ff195aee1c24fc095d948a447` | acceptance / source / dependency equivalence |
| `src/scenarios/fitting.ts` | `92042fa5db627550c9c0fe824cd75d3c5a38ba58` | acceptance / source / dependency equivalence |
| `src/scenarios/schema.ts` | `d10c5101743da454e1ce0b647bd791e87ee94a41` | acceptance / source / dependency equivalence |
| `tests/artifact-smoke.mjs` | `a30437d621ba60feeac718494439b3991c4e07f0` | acceptance / source / dependency equivalence |
| `tests/browser/claude-ui-fixes.spec.ts` | `fe9512b555dbb744d9c1187289d2d78e427bb501` | changed UI / asset / test |
| `tests/browser/claude-ui.spec.ts` | `6d7c2f6703c61614e5626626f9b98579d6bf6996` | changed UI / asset / test |
| `tests/browser/fitting.spec.ts` | `18750d36b5909551cafee900a4639a39076b9fee` | changed UI / asset / test |
| `tests/browser/lab.spec.ts` | `10cd77037856ebb119161dbf6a6b289d971ac463` | acceptance / source / dependency equivalence |
| `tests/catalog.test.ts` | `d03ac5f5af7a0348937acd91342a41b2cc7c9398` | acceptance / source / dependency equivalence |
| `tests/fitting-long.mjs` | `b1210da55c15e09d11f21aeecda3d7811c42e6f4` | acceptance / source / dependency equivalence |
| `tests/fitting-memory.mjs` | `1f35c7f02842cca147ef16df5e0eccb8847b020f` | acceptance / source / dependency equivalence |
| `tests/fitting/bill.test.ts` | `7724b9de8980a9fedb2ace73bc9b90be3b1aed8c` | acceptance / source / dependency equivalence |
| `tests/fitting/bounded-state.test.ts` | `ba419869f018c8422db9a3fc373523fa42733aed` | acceptance / source / dependency equivalence |
| `tests/fitting/cargo.test.ts` | `3cfa32399765b681e8daa49874c884c88ede20ce` | acceptance / source / dependency equivalence |
| `tests/fitting/catalog.test.ts` | `a817a29b7ef712bd5c8a20eeb3c12aa0da3e1986` | acceptance / source / dependency equivalence |
| `tests/fitting/comparison.test.ts` | `492fb14ed6f023a314c90eb5af72954b1d309efd` | acceptance / source / dependency equivalence |
| `tests/fitting/compatibility.test.ts` | `1f94ff58d2464b40cd6f0f2ad4d758b3521d76d4` | acceptance / source / dependency equivalence |
| `tests/fitting/controller.test.ts` | `e2c1fb818a36c9fc7758b45adb37db16335d23e8` | acceptance / source / dependency equivalence |
| `tests/fitting/fixtures/legacy-0.json` | `5e969149e2adaeb9a7811dc10a450cc7cf25276c` | acceptance / source / dependency equivalence |
| `tests/fitting/fixtures/legacy-1.json` | `98c1716219ad17bdb7d46b74619f9f53a8ba625f` | acceptance / source / dependency equivalence |
| `tests/fitting/fixtures/legacy-external.json` | `971d8e1837368020285c0f9d7bc3c6213e9360a4` | acceptance / source / dependency equivalence |
| `tests/fitting/input-fixtures.ts` | `b6c2ad31b1c15149c409cd8862012c1f638d36d9` | acceptance / source / dependency equivalence |
| `tests/fitting/input-guards.test.ts` | `38b884eed3f649f92f9504e09814d0982f4ab5ca` | acceptance / source / dependency equivalence |
| `tests/fitting/io.test.ts` | `1f90266c8c196d260de907fecf02da4aa45167b7` | acceptance / source / dependency equivalence |
| `tests/fitting/legacy.test.ts` | `7828ff24c2bfedea4f8ff635b2b8788686ff94e7` | acceptance / source / dependency equivalence |
| `tests/fitting/matrix.test.ts` | `3fa7e51e8a2d839b2437df72fdda5d25f1f15bd1` | acceptance / source / dependency equivalence |
| `tests/fitting/mining-metrics.test.ts` | `c6f5e394bbd52953865a33a4fce2a7ef5cac487e` | acceptance / source / dependency equivalence |
| `tests/fitting/run-validation.test.ts` | `6fa4480599efd63f48194438e490d717df9b0e51` | acceptance / source / dependency equivalence |
| `tests/fitting/scenarios.test.ts` | `b5d3fdba30804951802262dfad6ca25a3ddc42ce` | acceptance / source / dependency equivalence |
| `tests/fitting/source-fidelity.test.ts` | `6c2f162d5c35c13a260342ed0e6ad349d68bd5a4` | acceptance / source / dependency equivalence |
| `tests/fitting/test-spec.ts` | `5ef1e0f932818a3f0275575a365c96f9f2976bcc` | acceptance / source / dependency equivalence |
| `tests/fitting/time-integration.test.ts` | `650894dd5bfe3e57840ff6690496ff961c8c3ebb` | acceptance / source / dependency equivalence |
| `tests/fitting/worst-fit.ts` | `70e48b70c0af9762eb1c1b345dde95f7032371f0` | acceptance / source / dependency equivalence |
| `tests/io.test.ts` | `f4c14b9770b215e9098581c0f51f5b43a2c0a003` | acceptance / source / dependency equivalence |
| `tests/long-kernel.test.ts` | `278de7b315a0a894ba9b4b20ca02e82137ff7be7` | acceptance / source / dependency equivalence |
| `tests/matrix.test.ts` | `a24aa01131860590d54ea7a5df5d649d8ed95d66` | acceptance / source / dependency equivalence |
| `tests/metrics.test.ts` | `9e29a208d74eace0cc5bd7b103a3a7edec9c9691` | acceptance / source / dependency equivalence |
| `tests/model/boundaries.test.ts` | `a3b9f1e160d43f2da39bde28bf9e96240e0d8ae9` | acceptance / source / dependency equivalence |
| `tests/model/fitting-dispatch.test.ts` | `bd0d83364d3fc78c18826626be98285f65ed6389` | acceptance / source / dependency equivalence |
| `tests/model/fitting-drive.test.ts` | `c193815c0546ca443f55278aaa0f6eb6b4e89306` | acceptance / source / dependency equivalence |
| `tests/model/fitting-energy.test.ts` | `0f5254d1e51896702d9d590f202bdf150f82a008` | acceptance / source / dependency equivalence |
| `tests/model/fitting-refinement.test.ts` | `1d9164c4cdce5a37be750f2e3d24206e9da53b74` | acceptance / source / dependency equivalence |
| `tests/model/fitting-stocks.test.ts` | `4b587883564c7df6f07e96dd254368e100a6a50a` | acceptance / source / dependency equivalence |
| `tests/model/kernel.test.ts` | `e9526f56158bc080641a193864d0f7c3628c5638` | acceptance / source / dependency equivalence |
| `tests/peak-cycle.test.ts` | `e0c0f3efc81e9a4231f9a7c382344a7967e9d505` | acceptance / source / dependency equivalence |
| `tests/performance.test.ts` | `4734efcfaf0d95139e4849b743a315ed58642dde` | acceptance / source / dependency equivalence |
| `tests/qa-regressions.test.ts` | `d9c2c3f954d211815c267a161d66072563e97828` | acceptance / source / dependency equivalence |
| `tests/retention-memory.mjs` | `63724dcf078a95e103091a90bb3effdd51db27f5` | acceptance / source / dependency equivalence |
| `tests/retention-memory.test.ts` | `e9c3f2d652fc26fb3f94f7b196bb82a63185c164` | acceptance / source / dependency equivalence |
| `tests/review-regressions.test.ts` | `cbcec8a835be44f56e9fcfe4d6bd0a97f760de2f` | acceptance / source / dependency equivalence |
| `tests/runner.test.ts` | `71bb7286b55c00439ef3912fc00b7abdac6a4477` | acceptance / source / dependency equivalence |
| `tests/ui/presentation.test.ts` | `80d9bedbe846232cf40a8072d51f733f665445ed` | changed UI / asset / test |
| `tests/ui/qa-fixes.test.ts` | `be1342cb7575d0c3dd4973fe6dada06a307d7095` | changed UI / asset / test |
| `tests/ui/telemetry.test.ts` | `b8cd1041e0ef5a466640cea5ae4d8d7304a1b40f` | changed UI / asset / test |
| `tests/ui/workspace.test.ts` | `0b6faf2dedf18849a44e141191962f68ae658225` | changed UI / asset / test |
| `tsconfig.json` | `67db4b67d70f4354dc0f6ea28206b2219e1c264b` | acceptance / source / dependency equivalence |
| `vite.config.ts` | `10e2c43ff8cb04792699695e9678d0d36c36d465` | acceptance / source / dependency equivalence |

Whole VC: `docs/verification/claude-design-ui-v0.2-contract.md`; actual blob `04a9714111f9c2cb6ab2e94da7f6fda7232d125f`;
actual full text получен через `git show 1d6dd472706572f36d5aaf993d694bdaa078fae2:docs/verification/claude-design-ui-v0.2-contract.md`.
Canonical SHA256 UTF-8 sorted-key compact JSON
`{"blobs":[{"path":...,"blob":...},...],"contract":{"path":...,"text":<entire VC>}}`
с `ensure_ascii=False`, `sort_keys=True`, `separators=(",", ":")` = `e8fcb471b0ce47aab34099774438891d7268e520408a7e3e25a5ace676e9e3a3`.
Все146actual blobs получены из exact HEAD; payload самостоятельно восстановлен и
сравнен с formal runtime-binding, без использования декларативных hashes как результата.

## Not-reviewed / not-tested / release

- Полный повтор72/42QA, полный27browser/fullguard, свежий12h/heap и все origins заново
  Reviewer не выполнялись. Own browser проверял одну ordinary LAN origin; localhost/
  TLS-prefix native controls/export proof — immutable QA. UI metadata publication не
  считается новым runtime execution.
- Физический Xiaomi/newUI full controls, native/base acceptance, public Pages deploy,
  main/operator merge остаются отдельными OPEN/NOTRUN gates; true-mobile emulation
  не является проверкой второго физического устройства.
- Новая физика/catalog/schema/protocol, full-hold mining/flight/refuel/mission (`ulab-dwi`),
  broad cosmetic/a11y/legal/font audit и pipeline governance — OUT.
- Reviewer не менял product/runtime/tests/requirements/Beads/GitHub, не запускал новых
  subagents и не изменял existing4183/4184/4186 servers. Только private read-only execution
  contexts, `/tmp` probes и этот ignored report. Предыдущие Plan Review и numerical
  Review r3 immutable; их findings не переоткрыты.
- После подписания этого отчёта все команды/probes завершены. **Source freeze released**
  для root PM и sole Developer в пределах двух UI blockers; не global readiness.

## Подпись

Независимый Reviewer: Codex, `/root/fitting_adversarial_review`; model ID unavailable.
Вердикт относится только к указанным exact SHA/build/scope. Root PM — sole publisher
отчёта без изменения байтов/смысла. ADVISORY0, никаких автоматических scope additions.
