# Независимый Plan Review — Claude Design UI v2.1, r1

Mode: PLAN_REVIEW  
Role: независимый Reviewer, `.agents/RV_ROLE.md` v2.1; applicable PM lifecycle v3.0.  
Model: Codex; точный provider/model ID средой не сообщён и не приписывается.  
Session: `/root/fitting_adversarial_review`, существующая независимая Reviewer session; отдельный новый UI work item.  
Commit: `9aa3abe8422127992501de0891cdeae0bed73dec`  
Base: `903d36b2ac4a2bfa90997803770ace13d520fbe9`  
Branch: `feat/claude-design-ui`  
Worktree: `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`  
Work item: `ulab-3lg`  
Draft PR: https://github.com/komleff/u2-lab/pull/6  
Source mock PR: https://github.com/komleff/u2-lab/pull/5, `abbd2943d51bb2a063b056f38033aca5f03b064f`  
Source plan: `docs/plans/2026-10-06-claude-design-ui.md`  
Product authority: принятое поручение оператора, структурированное в `docs/product/claude-design-ui-v0.2-acceptance.md`.  
Verification Contract: весь `docs/verification/claude-design-ui-v0.2-contract.md`, UI01–18 и все invariants/evidence paragraphs.  
Content-Fingerprint: `39a3ec3408a6dc830574101a8b38242a37955da6f39cfd22fbda43d1193ca3a2`  
Verdict: **PLAN_READY**  
BLOCKER: **0**  
ADVISORY: **0**  
Signed-at-UTC: `2026-10-05T19:16:46Z`

## Итог и граница verdict

U1–U6 ведут к принятому UI outcome без изменения численной модели. Приёмка проверяема,
владельцы состояния определены, порядок работ устраняет основной риск повторной сборки
контроллера при навигации. Обязательных изменений плана перед реализацией не обнаружено.
Это разрешение начать UI implementation; runtime UI, окончательная приёмка и готовность
к main merge этим review не подтверждаются.

Новый WHAT не принят Reviewer. Принятый оператором overlay явно разрешает два вопроса
Claude-пакета: DEMO таблицы не задают расчёт; «Титан» показывает существующий экспериментальный
Industrial M с явной подписью. Производители модулей из макета не становятся каталогом.
Наличие неподдержанного канала требует честного отсутствующего значения, а не DEMO fallback.
Полный шахтёрский рейс, динамическое заполнение, маршрут и заправка отложены в `ulab-dwi`;
их отсутствие не является blocker этого интерфейсного плана.

## Проверка плана по адресам acceptance

| Surface | Evidence и вывод |
|---|---|
| Ownership и навигация, UI01/08/09 | U1 вводит один workspace над текущими FittingSession/compile/makeMiningRun/Worker. Accepted overlay различает выбранный вариант, owner действующего теста, fit revision, immutable RunSpec/runId и frozen test A. Переключение варианта сохраняет применённые изменения и убирает только неприменённый dialog candidate; новый вариант не наследует измерение. Навигация меняет представление без нового Worker/reset. Ошибочная модель «активный результат принадлежит выбранной вкладке» явно исключена. |
| Preview/apply/batch/import, UI06/07/15 | U3 — whole-ship validation/preview до одного атомарного применения; batch только сменных Payload slots, builtins исключены. VC требует отказа без изменения fit/revision/result/A/active snapshot и success с одной ревизией. Cancel/Esc сохраняет прежнее состояние. U5 предусматривает positive и mixed/invalid target tests, malformed/version/numeric imports и actual download bytes. Обновлять существующие IO/schema для этого не требуется. |
| Passport, builtin, ring, UI02–05 | U2 получает slot/item calibre, instances и nominal/mass/C/cargo из текущих owners; source и contract различают встроенное и сменные slots/counts. Ring остаётся вторым представлением тех же слотов, с min18°/44px и fallback при недостатке места/<440/phone. Проверки all6 hulls, S/L boundaries и 390px адресуют риск макета, рассчитанного только на демонстрационный M. |
| Данные результатов и сравнение, UI10–14 | U4 использует actual metric/state/event/channel fields. Overlay и VC требуют подписи preliminary/stale/partial/time window, N/A при нулевом знаменателе, фиксированную selected work group K, provenance и честные bucket mean/min/max/count. Per-instance measurement не выдаётся за среднее всего теста. Existing compareMiningConditions сохраняет смысл разных условий; frozen A отделён от variant A и неизменяем. |
| Controls и stale messages, UI09/18 | Один controller, runId/commandId filtering и ACK запланированы в U1; U4 блокирует условия active/paused теста, сохраняя editing для следующей ревизии. U5 требует actual Worker Start/Pause/Resume/Step/Cancel/Reset, partial interval и ordinary LAN HTTP, включая отсутствие secure-only randomUUID. Изменять protocol/kernel для переноса UI не требуется. |
| Mobile, доступность, source fidelity, UI16/17 | U2/U3/U4 используют M2/LabM структуры; modal focus/Esc/return, 44px touch, safe area, кнопочное время/легенда, text summary и отсутствие page overflow входят в проверяемые AC. U5 заменяет private `_blob`/support.js/CDN на локальные assets. U6 задаёт конечную визуальную сверку с исходником вместе с functional QA, без нового cosmetic review loop. |
| Последовательность, UI18 | Workspace и shell идут до экранов/диалога/диагностики. Затем meaningful automated checks и immutable extracted artifact, независимая QA по final exact SHA, один scoped Code Review с заранее перечисленными UI рисками. Численные regression/input/replay checks сохраняются, source equivalence необходима для переноса старых long-run evidence. Developer tests не объявляются независимой QA. |
| Scope reduction/rollback | План ограничен presentation/controller state/assets/UI tests/docs, совместимый adapter сохраняет mountFitting/FittingController. Shared charts меняются только optional presentation options с прежними Legacy defaults. Новый backend, numeric catalog, сценарий, persistence и миграции не нужны. Rollback — прежний immutable fix-r3 dist/server path; старые артефакты сохраняются. In-memory variants и сохранение выбранного fit/run существующим JSON описаны явно. |

## Что действительно проверено

1. Прочитаны актуальный приоритет в Memory Bank/INDEX, RV_ROLE и relevant PM lifecycle,
   accepted UI overlay, весь implementation plan и весь UI Verification Contract.
2. Прочитан UX v2.1, карта UC/состояний/отклонений, README и canvas manifest. Из exact
   HTML mock package прочитана структура Main/Lab и текст/связи остальных desktop/mobile/
   boundary boards, включая `dc-import` варианты. Token snapshot проверен как источник
   palette/fonts/spacing/radius. Private canvas/support.js не запускался и не нужен
   для реализации плана.
3. Проверены текущие integration/ownership points FittingSession, mountFitting/controller,
   main route, makeMiningRun/compareMiningConditions и Worker protocol. Численные owners
   включены в binding как неизменённая baseline dependency; нового полного ревью ядра нет.
4. Независимо пересчитаны 39 actual Git blob IDs и whole UI VC text fingerprint. Все
   26 mock package blobs byte-identical к source PR5 commit. Все 8 bound `src/` owner
   blobs совпадают с base `903d36b2ac4a2bfa90997803770ace13d520fbe9`.
5. `git diff --name-status 903d36b2ac4a2bfa90997803770ace13d520fbe9..9aa3abe8422127992501de0891cdeae0bed73dec` показывает документацию/Memory Bank/INDEX/mock
   package; продуктовый runtime ещё не менялся. Exact HEAD и чистый tracked worktree
   повторно проверены перед подписанием. Plan-stage readiness не выведена из mock DEMO
   исполнения или из отсутствия runtime failures.

Baseline 163 unit, 13 browser/1 SKIP, type/build/reference/bootstrap26 PASS переданы PM.
В этом PLAN_REVIEW они **не выполнялись Reviewer заново** и не подтверждают будущий UI.
Функциональные/визуальные UI01–18 проверки остаются задачей final-candidate QA.

## Findings

BLOCKER = 0; ADVISORY = 0. Отдельных обязательных или отложенных правок этот review
не добавляет. Обнаруженная сложность диагностики не является основанием расширить scope
до новых каналов или модели: принятые правила actual-data/no-DEMO-fallback уже проверяемы.

## Reviewed-Paths и content binding

Явная acceptance/owner/source surface — следующие **39 paths**. Таблица привязывает
review к exact входам; она не означает полный runtime Code Review каждого baseline файла.

| Reviewed path | Actual Git blob |
|---|---|
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `eac9ece236840af775181d5936799df1e8cff2bd` |
| `docs/plans/2026-10-06-claude-design-ui.md` | `4bebfddf3010f75c0b8c3af6496cd8e1b52d3b01` |
| `docs/product/claude-design-ui-v0.2-acceptance.md` | `8017aebf7aebb2c1e1bbaa6ea356e651b3e31e19` |
| `docs/product/ship-fitting-v0.2-acceptance.md` | `49d640538146c38114e195dae9d796074c785588` |
| `docs/ux/claude-design/README.md` | `aad635b5d766bc4a01201f83ff71cef0680fc5da` |
| `docs/ux/claude-design/mockups/Lab-AB.dc.html` | `1369e9e60d3d8526969b7df4288d609752be81aa` |
| `docs/ux/claude-design/mockups/Lab-ABDiff.dc.html` | `0fdbbd8bd50f9a135c26d956be9654aa6882d398` |
| `docs/ux/claude-design/mockups/Lab-Empty.dc.html` | `93d655dad60d5636ca93470aa5a8e072704e08b1` |
| `docs/ux/claude-design/mockups/Lab-Heat.dc.html` | `77eb732a53d50afab35561637231ef1515619b13` |
| `docs/ux/claude-design/mockups/Lab-Import.dc.html` | `27031bf8336aba1d4b7d905554329f0d1440450e` |
| `docs/ux/claude-design/mockups/Lab-Paused.dc.html` | `984cba5872c16658810c38e6eecca0b95ee86f23` |
| `docs/ux/claude-design/mockups/Lab-Running.dc.html` | `e180dad831f1405dff157e8f887c9b75bf0bcbf0` |
| `docs/ux/claude-design/mockups/Lab.dc.html` | `c1440fd191013749afe3a799b02a8ac9ec9d0f53` |
| `docs/ux/claude-design/mockups/LabM-AB.dc.html` | `a0c49715993357f51b330625c1bd8011978a787f` |
| `docs/ux/claude-design/mockups/LabM-Channels.dc.html` | `2569c38ecb51f74a01f14c1396dfd2699444132e` |
| `docs/ux/claude-design/mockups/LabM-Run.dc.html` | `47477faef793deef6206eebcef88af1f9ac04977` |
| `docs/ux/claude-design/mockups/M2-Compare.dc.html` | `1cdeef3808f35778b8ee5b8b728db1ee149d130a` |
| `docs/ux/claude-design/mockups/M2-Fitting.dc.html` | `4f8f5ffa94a2eee6ec6439db2e8e3f39d508130f` |
| `docs/ux/claude-design/mockups/M2-Swap.dc.html` | `d87bdb6e974561a8e9a0ea86de1b138ba49ec3a1` |
| `docs/ux/claude-design/mockups/Main.dc.html` | `99621bfe0f74f697e0b61934355da60c1819f1eb` |
| `docs/ux/claude-design/mockups/PH.dc.html` | `63d13c702c0d34745ef1f4a8822df30f49a79622` |
| `docs/ux/claude-design/mockups/States2.dc.html` | `27744f5da18c4b9f5a316bb876013899dbd8a3ac` |
| `docs/ux/claude-design/mockups/V2-Flat.dc.html` | `65740f61ff447193d060139d996a95c073949e48` |
| `docs/ux/claude-design/mockups/V2-Incomplete.dc.html` | `7d6c183b7930e99edf9c80bc163692d01a8301f6` |
| `docs/ux/claude-design/mockups/V2-NotFinished.dc.html` | `1182284c6f09ea15d3e58d72067f86726be69337` |
| `docs/ux/claude-design/mockups/V2-Running.dc.html` | `0ed8dabfcc02b51bef2bb09fb779c49e650d112d` |
| `docs/ux/claude-design/mockups/V2-Swap.dc.html` | `45f356c0cacf9a382f998ecc88fa74ddc7ca4c01` |
| `docs/ux/claude-design/mockups/canvas.json` | `79f4e6828d39c3e358d0aa72e3fc380cbb2495ec` |
| `docs/ux/claude-design/mockups/ds/u2/tokens.json` | `be0fc63ca87db8fb4ad7472db125c01c89c35815` |
| `docs/ux/claude-design/ship-fitting-power-heat-ux-v2.1.md` | `0b89e4cc860a187ede0b5f601b6483b113bd5169` |
| `docs/verification/ship-fitting-v0.2-contract.md` | `314d1770363d642df4c2dec069a308b715911c58` |
| `src/app/fitting-session.ts` | `79d13341654ba9f4ae32f77dfbd82940df5e2d32` |
| `src/app/fitting.ts` | `bb8c9235c7e367f53d18c3cd7cd5f97f8dca8e00` |
| `src/app/main.ts` | `5519fb48cf46d01abec46f91b139a847e4e69975` |
| `src/fitting/compile.ts` | `15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4` |
| `src/fitting/types.ts` | `3d424945b306c669b6216bc56d1b00be6ee606d6` |
| `src/fitting/validate.ts` | `8b49296c785a5fa75edfd840ddf2c784ff93f74c` |
| `src/runner/protocol.ts` | `7d6b7a95e2c11c775e4ce961c1a350f582d77268` |
| `src/scenarios/fitting.ts` | `92042fa5db627550c9c0fe824cd75d3c5a38ba58` |

Whole Verification Contract добавлен отдельно, целиком, а не выборкой таблицы AC:
`docs/verification/claude-design-ui-v0.2-contract.md`, actual blob `04a9714111f9c2cb6ab2e94da7f6fda7232d125f`.

Канонический payload:
`{"blobs":[{"path":...,"blob":...},...],"contract":{"path":...,"text":<entire VC>}}`.
Paths отсортированы; hashes получены через `git rev-parse 9aa3abe8422127992501de0891cdeae0bed73dec:path`; text через
`git show 9aa3abe8422127992501de0891cdeae0bed73dec:docs/verification/claude-design-ui-v0.2-contract.md`. SHA256 от UTF-8 JSON с `ensure_ascii=False`,
`sort_keys=True`, `separators=(",", ":")` = `39a3ec3408a6dc830574101a8b38242a37955da6f39cfd22fbda43d1193ca3a2`.
Payload независимо восстановлен из Git и совпал с
`/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/claude-ui-plan-binding.json`.

## Not-reviewed / not-tested

- UI runtime implementation, rendered final screenshots, browser/LAN controls/IO и physical
  tablet ещё не существуют в этом candidate; **NOT RUN**. Никакого UI Code Review не было.
- Полные numerical/model/catalog/scenario/IO/Worker audits, повторные 12h/heap executions,
  дальнейшие старые Lab fixes/features и `ulab-dwi` — OUT.
- Native/bootstrap governance re-audit, public deployment, base acceptance и main merge — OUT.
  Физическое второе устройство остаётся отдельным operator gate, browser device context
  не заменяет фактический Xiaomi.
- Beads/GitHub/requirements/source не изменялись. Эта session не запускала новых агентов.

## Подпись

Независимый Reviewer: Codex, session `/root/fitting_adversarial_review`.
Точный model ID недоступен; verdict относится только к указанным immutable входам.
Root PM — sole publisher данного отчёта без изменения байтов/смысла.
