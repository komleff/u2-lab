---
title: "Независимый Code Review: миссия и M/HY v2.2"
status: CHANGES_REQUESTED
version: "1.0"
date: "2026-10-06"
role: "Independent Reviewer / CODE_REVIEW"
model: "Codex; точный provider/deployment ID средой не сообщён"
related:
  - docs/plans/2026-10-06-mission-medium-delivery.md
  - docs/product/ship-fitting-v2.2-mission-brief.md
  - docs/product/ship-fitting-medium-modules.md
  - docs/reviews/2026-10-06-mission-medium-qa.md
---

**Verdict: CHANGES_REQUESTED. BLOCKER: 2; ADVISORY: 0.** Обе находки находятся в изменённом mission controller и нарушают уже принятые AC. Других подтверждённых blockers в адресованной поверхности не найдено. Не требуется новое продуктовое проектирование, изменение ТТХ или полная повторная QA кампания.

## Точный вход и поверхность

Mode: **CODE_REVIEW**, один независимый Reviewer после signed QA. Commit/source: **`ac4d01ac96e495a8db63cc85c6b7716358b3bfbe`**; runtime/artifact: **`ec2593157a0ed478e8cfa69cec6c71d860790180`**. Planning/root HEAD при release: `7a4cd5ea2b7087cbe33747e25c3d38d1d1476071`; reviewed root content был staged, не отдельный final commit. Независимо сверены все 155 release rows с рабочими bytes и Git blobs ac4; runtime `src` ec259→ac4 не изменён. Два последних изменения — test helpers, не served runtime.

Полностью прочитан Review Contract `.overgate-runtime/mission-medium-code-review-contract.md`: **10132 B / SHA256 `7a23c35ed111b930e36909be8cec71b5564da096107186964c94c620b7926d58`**. Release envelope: **38952 B / `e8e20dada8e34decfdc7f5be683ee3592e792d15e6df7274ed8c6c713aab5d08`**. IN: его семь named risks и 15 AC M01–09/MF01–04/HY01–02, включая уточнение операторского FAIL. WHAT не переоткрывался.

**Reviewed-Paths:** 42 exact changed paths из release envelope плюс 10 необходимых текущих владельцев — 52 явные строки `path/GitBlob/bytes/SHA256` в signed sidecar `.overgate-runtime/2026-10-06-mission-medium-code-review-r1-reviewed-paths.json`. Runtime delta включает app conditions/workspace/session/ship/lab/compare/result-context; catalog/editions/types/validate/new M data; fitting-result IO; model step/types/flight; runner fitting-run/mining-metrics/mission; scenario mission; соответствующие unit/browser tests и .2 digest fixture. Дополнительный context: `src/runner/{run,protocol}.ts`, `src/io/fitting-json.ts`, `src/scenarios/fitting.ts`, `src/fitting/{cargo,compile}.ts`, `src/model/v2/physics.ts`, `src/model/scheduler.ts`, `src/fitting/data/{modules,hulls}.json`. Большие данные читались по относящимся к SKU/корпусам записям; unchanged kernel не подвергался новому общему аудиту.

**Own Content-Fingerprint: `277e007ada0840cbe99509512e4a8fbf6de8330b21bccff99367032ff9f1e1ea`.** Рецепт: SHA256 UTF-8 sorted52 `path NUL GitBlob LF` + literal whole mission brief + whole medium contract + whole HOW/VC + whole Review Contract, именно в этом порядке, без дополнительных разделителей; payload **64098 B**. Sidecar содержит весь текст четырёх контрактов, включая полный M01–09/MF/HY, а не только строки findings. Whole source authority SHA: brief `e0d414eb…`, medium `e6088c0a…`, HOW v1.2 `dd585d3d…`; полные hashes/bytes в sidecar. Release155 fingerprint самостоятельно воспроизведён: `bb3e27734e628f5f83c52ed9760c8e8b9c2e4e5642e95827080a389f66a55bc6`.

## Findings

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| CR-MISSION-B1 | IMPORTANT | [BLOCKER] Full-hold считает временно отключённый renewable source необратимым исчерпанием | `src/runner/mission.ts:224` | fix now | M02/M04; named risk 3 |
| CR-MISSION-B2 | IMPORTANT | [BLOCKER] First-stop + zero phases + repeat производят бесконечные zero-time services | `src/runner/mission.ts:218` | fix now | M01/M02/M04; named risk 2 |

**B1 — воспроизведение.** `getPresetFit('civilian-M:1')`, catalog .3, `initial.chargeFraction=0`; mission `H=5, dt=.1, T=600 K, distance=0, approach=0, service=0, target=.01, repeat=false, stopPolicy='full-hold'`. В разрешённом numerical snapshot задан `environment.solarFluxWm2=4e6` с explicit experimental provenance. `parseExperimentJson` принимает его. Это контролируемый лабораторный input, не утверждение о канонической солнечной среде.

Первый chunk заканчивает рейс в **0.03999200159968007 s**, `stage=done`, `delivered=0`, `charge=0`, diesel/H₂=0. События одновременно сообщают «охлаждение и восстановление продолжаются» и «необратимое исчерпание ресурсов», затем выполняют пустое station service. Контроль с единственным изменением T=300 даёт actual solar **100 MW** и доставку .01. При 600 источник и лазер выключены thermal gates; нулевые stocks не доказывают отсутствие будущей энергии. Full-hold должен сохранять recovery/mining до реальной возможности работы, истинной необратимой причины либо H. Здесь режим заменяется преждевременным возвратом и single-voyage completion.

Причина: строка224 проверяет только `all fuel<=eps && charge<=eps`, игнорируя восстановимость установленного солнечного/внешнего источника. Минимальная правка класса: для этого перехода проверять фактическую необратимость требуемой энергии, различая temporary thermal gate и окончательное отсутствие source; не считать unused species или временный zero bus доказательством невозможности. Область closure — full-hold stop при renewable/external input, recovery и честный terminal outcome. Уже accepted поля/модель/каталог не менять.

Own script/raw: `.overgate-runtime/mission-medium-review-probe.mjs` и `mission-medium-review-probe-solar.json`; hot/cold input, parser acceptance, kernel telemetry, state/metrics/events сохранены.

**B2 — воспроизведение.** Законный Pony:1/.3; `H=5, dt=.1, T=600, distance=0, approach=0, service=0, target=.01, repeat=true, stopPolicy='first-stop'`. Один ограниченный `runChunk(run,1,20)` возвращает **steps=0, time=0, ticks=0**, но успевает создать **462 cycles / 3700 events** за20.17ms; T=600 и diesel=12000 не изменились. Это не физическое восстановление или повторяемый рейс.

Строка218 при `stop<=previous.timeSeconds` выполняет `beginInbound(...); continue` без интеграции времени. Следующий `settleTransitions` при нулевых фазах возвращает controller в тот же mining state; `steps` и применяемый здесь transition counter не ограничивают этот путь. Finite wall budget лишь прерывает один pump, сохраняя endless zero-time loop для следующего. Из кода следует зависание API с default Infinity wall budget; бесконечный вызов намеренно не исполнялся.

Минимальная правка класса: явно ограничить переходы без продвижения и обеспечить физический clock progress либо объяснённый конечный no-progress outcome для повторного немедленного first-stop. Не добавлять фальшивое work/time/service и не запрещать принятые `distance=0 / approach=0 / service=0` как обход AC. Durable closure должен проверять finite/default-budget termination и отсутствие накопления zero-time cycles; временное охлаждение не должно выдаваться за необратимость.

Own bounded script/raw: `.overgate-runtime/mission-medium-review-probe-firststop.mjs` и `mission-medium-review-probe-firststop.json`. Результат одного20ms chunk сохранён; никакой long-run campaign для нахождения дефекта не понадобилось.

## Остальные адресованные границы и evidence

Проверены actual diff/context и meaningful tests: flight использует actual per-instance force и один коммит выбранного pure step; trial не списывает ресурсы повторно, coast сохраняет скорость при изменении массы. Signed correction и snap tolerance ограничены новым tag. Service требует station stop, unload/refuel меняют только груз и установленные stocks в конце; заряд/T не сбрасываются. M scaling S×4, intensive поля/class/G/gates и Cp470 проверены непосредственно; provenance явно candidate, E utility predicate ограничен .3, четыре Electric propulsion roles и distinct finite diesel/H₂ сохранены. Old timed dispatch/completion==H и known structural roster проверены по владельцам и exact delta, без новой перекомпиляции authored snapshots. Immutable active/next/reference и native first-Start paths рассмотрены вместе с отдельными новыми mission tests; `openTimedDraft` явно сохраняет старые test workflows, не заменяет тест default mission.

Независимая QA: full report **19335 B / `01a0bb6e9885c0f3bb7ac77095585465ad21b1c0582240fe235c9246a983cd69`** прочитан; own27+whole4 fingerprint самостоятельно воспроизведён — `99f8c3da58783dd84f9640c404933e52fd43e3961b6f0d5f7c340657d6723ae3`. Её PASS15 относится к выполненным методам; B1/B2 — новые поддерживаемые counterexamples вне тех конкретных срезов, а не переписывание исторической QA.

QA реальные Pony C/Sputnik >=3 services и H3600, B с меньшим числом рейсов, CivilianM battery-only stranded и supplied-H₂ partial mining имеют разные, объяснимые outcomes. Не требуется гарантировать три рейса любому fit, предписывать победителя M09 или вводить цены/ROI. Старые controller-induced stranded не принимаются как physical impossibility. Convergence .1/.05/.025 и long outcomes здесь **inherited execution**, не собственный повтор. Developer/PM guard427unit/46browser+1SKIP — также внешний gate; собственный guard не запускался, окончательный root guard/commit остаётся PM.

**NOT RUN / OUT:** полный build/unit/browser guard, девять H3600/вся матрица/12h, package/ZIP/tar/HTTP proof, новое native/browser исполнение всех рабочих цепочек, Xiaomi/physical/native OverGate/PublicPages/base/main/merge, UI asset fidelity/redesign/economy/IFCS и unchanged `ulab-w7j`. Точная неизвестная Power-сборка оператора не объявляется воспроизведённой. Advisory-расширений нет.

Подпись: Independent Reviewer / Codex, exact model ID unavailable / CODE_REVIEW / 2026-10-06. Report, sidecar и четыре собственных probe artifacts запечатаны0444 после hash/readback. Source/runtime/product/tests/servers не менялись; предыдущие reports неизменны. **Review source freeze RELEASED после seal**, два blockers остаются открытыми для одного Developer и только affected QA/scoped re-review. PM solepublisher; Reviewer **SEALED / IDLE**.
