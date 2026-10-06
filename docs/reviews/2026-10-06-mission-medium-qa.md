---
title: "v2.2 mission + M/HY — независимая QA"
status: PASS
role: independent QA
model: "Codex; exact provider model ID unavailable"
date: 2026-10-06
source_commit: "ec2593157a0ed478e8cfa69cec6c71d860790180"
---

Результат: **PASS в адресованном local PRODUCT scope M01–09 / MF01–04 / HY01–02**. Подтверждённых product FAIL: **0**. Это15 AC-адресов с двумя сквозными LAN-цепочками и именованными аналитическими/ресурсными/IO срезами; это не15 полностью повторённых кампаний и не universal acceptance всех физических устройств. Исходные source-first methods/expected не заменялись Developer tests/output. Предыдущие reports и artifacts не изменены.

## Точный кандидат и authority

Runtime/artifact source `ec2593157a0ed478e8cfa69cec6c71d860790180`, planning base `7a4cd5ea2b7087cbe33747e25c3d38d1d1476071`. Исполнялся только immutable `u2-lab-claude-ui/.overgate-runtime/mission-medium-v2.2-candidate-fix-r1/extracted/dist`, actual LAN `http://192.168.68.65:4189/?v=mission-fix-ec25931`, **secure=false**; root-owned server сохранён. API использовали linked runtime owners этого source;27 собственных tested owner paths и их Git blobs/current byte-equivalence записаны в `source-binding.json`. Все27 совпали с frozen ec259. API module loader не слушал дополнительный HTTP port.

Whole authority: mission brief v0.3 SHA`e0d414eb48be123902fb05af3078e58d87d4c540c54f6bf4892af67da93fd5f4`, medium contract SHA`e6088c0a48434674634d6c0f5c7a57347b6c33245ad66c5d5a15ecb8bce91b70`, whole HOW/VC v1.2 SHA`dd585d3d481312c7b4286cedef80127ed0d864b4f35b7eaacfc4205c41e1bc53`. Уточнённый операторский FAIL и допустимые power/count assumptions связаны whole `.overgate-runtime/mission-medium-code-review-contract.md` в own binding. Подготовка: `../preparation/cases.md` SHA`4fc859730e65b04bf6dcecd7d55c53e6665b5605c9f0696969d0a936c0e7a966`, `analytical-oracles.json` SHA`4c7e7e55bddd795be4c14a9db0cf45a6b7c6232ec79cef8fbb14e1e90f950dae`.

**Own Content-Fingerprint:** `99f8c3da58783dd84f9640c404933e52fd43e3961b6f0d5f7c340657d6723ae3`. Recipe: sorted27 `path\0GitBlob\n` + literal whole brief + medium + HOW + whole review-contract/operator clarification, в указанном порядке. Binding SHA256`c20d113554f08f195208a7d0d36f73e8a6787cc1d4440d2e5a07faba241085f1`. Это own tested-surface binding, не заявление о проверке всех source-manifest entries.

PM packaging proof принят как внешний exact binding, не повторялся: source-manifest62680B/SHA`5d07e23ccb4bd8778fbbf200577a7b897cb56ccce9f0d80b3dd06d45ea93d6bf`, source FP`b1b6ef6e8f62ca6893fe29fc2b5f42e1f53c778410d55b29208dfc7eb0ce3fa5`; build-manifest3334B/SHA`1a6562977fb431eb47f8ae276e23281e162d053e3b68ff93cc524db9ef141ce4`, buildFP`7a83cd4428ff5705b21a4379fc5538d73a901a9519dffdb26fee4b35b701c907`; ZIP537480B/SHA`53952652de99049555028638de8dbf86688a2be2864b9dbff5eee595d4c99cf5`. QA не повторяла source149/ZIP/tar/17asset/HTTP-body proof или whole guard.

## Case / AC / method / result / evidence

Все пути evidence ниже относительно ignored `mission-medium-qa/execution-r1/`; slash-группы обозначают конкретные однотипные saved files. Полные observed values и source expected находятся в `case-ledger.json`/raw files, не в пересказе Developer.

| Case | Source AC | Собственный метод | Result | Evidence |
|---|---|---|---|---|
| M01 | HOW VC M01; brief§1/defaults | Fresh UI defaults и genuine field input→first native pointer/tap Start без Tab; invalid D/cap/dt validators | PASS | `W1-LAN1440-corrected.json; W2-LAN390-corrected.json; slices-output.log` |
| M02 | HOW work-policy / VC M02 | Actual 1/2/3 laser small-target controls; first-stop zero/partial power; fullhold thermal recovery; missing group/ore-capacity negatives | PASS | `ideal-1/2/3-result.json; first-stop-partial-power-result.json; zero-delivery-corrected-result.json; fullhold-thermal-recovery-extended-result.json; remaining-corrected-output.log` |
| M03 | brief§3; HOW motion / VC M03 | Independent relativistic constant-m anchor; no-force changed-m coast; real capped coast; separate chemical/electric march/retro step | PASS | `api-resume-output.log; capped-coast-result.json; chemical/electric-march/retro-step.json; oracle-corrections.json` |
| M04 | HOW station invariant / VC M04 | Actual horizon inside all5 stages, zero-propulsion negative, station-arrival/service boundary checks | PASS | `horizon-outbound/approach/mining/inbound/service-result.json; zero-thrust-result.json; W1-api-summary.json` |
| M05 | brief§4; HOW service / VC M05 | Single-voyage small target and service pre/end states; repeated physical H3600 fixtures; cargo/mass/typed fuel balances | PASS | `service-boundary-summary.json; W1/W2-api-result.json; five H3600 summaries; long-checks.json` |
| M06 | HOW IO / VC M06; CR-PONY-B1 | Native measured result fresh-open exact; API field/state/roster malformed refusal; native genuine old partial ghost refusal with A/next/result bytes | PASS | `W1/W2-LAN*-freshresult.json; linked-compare-old-open-LAN390.json; bad-*-rejected.json; api-resume-output.log` |
| M07 | HOW compatibility / VC M07 | Own saved .0/.1/.2 timed specs rerun, state/metrics compare to pre-mission oracles; native fresh old result | PASS | `golden-0.2.0/0.2.1/0.2.2/local-oldtimed-result.json; fresh-old-timed-labelled-LAN390.json; oracle-corrections.json` |
| M08 | HOW native workflow / VC M08 | Two whole LAN1440/touch390 chains plus linked measured B-vs-frozenA; first-click, running navigation, pause/step/resume/cancel, restart, analysis and native exports | PASS | `browser-results.json; linked-browser-results.json; W1/W2-LAN*-corrected*.json and screenshots` |
| M09 | HOW VC M09 homogeneous G0 / convergence | Own B100km/H3600 and C100km feasible-repeat control; compact completed voyage .1/.05/.025 and partial-power near-limiter refinement | PASS | `Pony2/3-H3600-summary.json; convergence-analysis.json; near-limiter-.1/.05/.025-result.json; remaining-checks.json` |
| MF01 | medium contract MF01 | Inventory editions and all5M explicit material/SI/class/G comparison to sealed independent source table; 45 previous profiles comparison | PASS | `api-output-initial.log; W1/W2-fit.json; preparation/analytical-oracles.json` |
| MF02 | medium contract MF02 | Common kernel finite M buffer/TI/H2/solar and off/dark/empty controls; independent effective-area radiation calculation and dry bill | PASS | `shared-h2-step.json; slices-output.log; rad-step.json; final-slices-output.log` |
| MF03 | medium contract MF03 | Old stamp rejects new globalM; old profiles/known roster/own local numeric snapshots preserved | PASS | `final-slices-output.log; oracle-corrections.json; old golden results; fresh-old-timed-labelled-LAN390.json` |
| MF04 | medium contract MF04 | Actual native compatible M filters/cards/install across two genuine LAN fits, real mission/analysis/native files/fresh result | PASS | `W1-LAN1440-corrected.json; W2-LAN390-corrected.json; browser-results.json` |
| HY01 | medium contract HY01 | Legal .3 E diesel/H2 utility fits; oldE/mixed chemical propulsion/missingcryotank negatives | PASS | `api-output-initial.log; W1/W2-fit.json; W1/W2-api-result.json` |
| HY02 | medium contract HY02 | Actual E+Diesel+H2 cooler, E+sharedH2 generator/cooler, D+auxH2 step; H2gen long branch and human source summary | PASS | `shared-h2-step.json; D-aux-H2-step.json; operator-CivilianM-H2-summary.json; operator-summaries-LAN390.json` |

## Реальные пользовательские цепочки

**W1 LAN1440:** freshdefaults → native compound CivilianM E+Diesel generator/tank+H₂ cryotank/cooler → реальные catalogM filters/cards/install radiator/buffer/cooler → editable mission D0.1km,target0.1,approach/service0.2,H180 → первый pointer Start после unblurred input (безTab) → actual Worker/time → running navigation → foreign nextB со своим H₂ utility fit/D200m → export активного A остаётся D100m/Diesel fit → Pause/Step/Resume/Pause/FreezeA → Cancel, затем restartA/MAX → real outbound/mining/inbound/service completion → measured charts/table/events/summary → Unicode native fit/run/result/CSV → freshresult без run → bad result atomic refusal и native export → duration181/first Start без workaround.

**W2 plain LAN touch390:** true `isMobile+hasTouch` → E+H₂ generator/sharedcryotank/cooler, solarM/TI M в реальных slots → такой же полноценный native workflow и свежий result/atomic error/restart. Состояния/labels/disabled flags/pointer-or-tap coordinates/Worker messages и downloaded bytes сохранены. Всего **53 fresh browser assertions PASS**,0 page exceptions/request failures. Это внутренние assertions, не53 новых AC. Исполнены2 whole chains,2 fresh-result продолжения и компактные linked slices: настоящее измерение B против immutable measured A, fresh old-timed open, три операторских human-limiter summaries. Второй Worker parallel не запускался: freeze на паузе сохраняет активный A, Cancel/terminal предшествует StartB.

Linked measured A/B сравнение показало **«Одинаковые условия»** несмотря на разные tanks/initial kg; сохранились обе measured identities и фиксированный A. API дополнительно сравнил разные hulls/capacities по одинаковым fractions и отметил изменённую distance как несовместимое условие. Native freshresult сохранил literal exported measurement bytes, не пересчитал их; baddistance и genuine old partial-resolved ghost оставили fit/run/result/reference exact.

## Операторский FAIL: repeat / реальные причины

Допущения видимы: пользователь не предоставил точный Power JSON; Sputnik сохраняет preset generator/tank и получает requested Sbattery; CivilianM сохраняет default solar, включает2TI M. D100km/Max/fullhold/repeat/H3600 взяты из PM explicit instruction. BulkM192 означает установленный192 + builtin24 = **216SCU**; не выдаём216 за пользовательское число. Дополнительный законный H₂gen/tank/battery вариант выделен отдельно.

| Actual fixture | t · s | Services | delivered / aboard SCU | final stage | own API wall · s |
|---|---:|---:|---:|---|---:|
| Pony2-H3600 | 3600.000000 | 1 | 36.000000 / 33.588180 | mining | 7.595 |
| Pony3-H3600 | 3600.000000 | 3 | 36.000000 / 12.000000 | inbound | 18.268 |
| operator-Sputnik | 3600.000000 | 3 | 90.000000 / 30.000000 | inbound | 12.774 |
| operator-CivilianM | 573.355017 | 0 | 0.000000 / 208.284048 | stranded | 0.292 |
| operator-CivilianM-H2 | 3600.000000 | 1 | 216.000000 / 109.220766 | mining | 8.798 |

Pony B — homogeneous enabled builtinG0+1copy, onebulk24+builtin12=36. Pony C — builtinG0+2copies, builtin hold12. C и Sputnik завершили **по3 настоящих обслуживания**, после чего продолжили доH3600. Температурная тяга/коррекция не стала ложным early terminal; неизрасходованный unused H₂ не назван дизельным отказом. Cargo full записано как штатное **«Трюм заполнен → возврат»**, затем реальные station/service/refuel/new outbound events. Нельзя объявить universal «все fits обязаны3рейса»: уB fill/flight медленнее; большой hold/ограниченная энергия имеют иной результат.

Default CivilianM действительно остановился на573.355017s: Q=0, electric source=0 при dark default solar, aboard208.284048SCU, delivered0, typed fuel stocks0. Никакой imaginary unload/arrival не произошёл. Это измеренное необратимое отсутствие энергии, не thermal controller termination. Human summary указал питание, реальные charge/source/request. Законный H₂gen вариант продолжил доH3600 при почти0 заряда и **реальных3.96MW источника**:216SCU доставлено, H₂refill56.063467kg, cumulativeH₂consumed240kg, remaining3463.633896kg; refill не был battery recharge. Raw balances и actual first-limiter instances/time/causes сохранены.

Wall измерен реальным API `performance.now()` вокруг run/retention/output; некоторые процессы выполнялись параллельно. Это собственные timings в данной машине, **не browser/physical performance benchmark**, не доказательство устранения неизвестного operator factor slowdown. Full nine A/B/C×0/100/1000km Developer campaign не повторялась QA; собственные значения выше не подменены её output. Никакого predetermined winning fit/экономической модели.

## Аналитика, ресурсы и сохранённые модели

Constant-m synthetic anchor (неcanonicalSKU):100t,Fa1MN,Fr0.4MN,c′3000,t10s далv99.94449069791544m/s,x499.861188218063m; stoppingd1249.652970545157m, within0.2%. Zero-force change100t→80t сохранил v; capped real mission peak9.999999999995m/s завершилась207.584505s после2legs+service. Electric march/retro доставили реальные8.82/3.528MN, load-host heat11.667157895/4.666863158MW; Diesel propulsionpurpose отсутствует уElectric и остаётся уChemical. Границы обоих видов доказаны actual common-kernel observations, без второго списания топлива.

Compact completed voyage refinement .1/.05/.025: mined/delivered exact0.2, maxeventΔ7.10169e−7s, maxfuelrelativeΔ7.57772e−8; near-power limiter H3 в тех же шагах далsamepositive0.00896875SCU иsameoutcome. Эти независимые адресные controls удовлетворяют prepared1%/.5s, не заменяют полную численную модель sweeping grid.

Own saved old .0/.1/.2 timed runs и coherent authored local .2 replay сохранили **все state/metrics values exact**. Native old fresh result показывает старую модель/поля work-duration, не mission migration. Genuine mission complete-before-H разрешён, oldtimed ранний complete отвергнут. Legacy численные владельцы/предыдущая long evidence — исторический carryover по unchanged-source binding PM; свежий Legacy run здесь NOT RUN.

## Harness corrections и отсутствующие проверки

Первоначальные FAIL/blocked outputs **сохранены**, не выданы за product findings: `api-output-initial.log`/`api-harness-error-initial.json`; original browser source/states/errors; `api-status.json`, slices/final-slices/remaining logs. Исправления только метода: `stepV2.consumptionKg` вместо вымышленного `.ledger`;1J способен дать tiny real ore — genuine0J контроль отдельно; уsource нет50s recovery promise (actual1142.588897s); JSON stringify insertion order давал false local mismatch — deep values exact; Electric heat имеет `loadHostW`, а `propulsionHostW` относится кChemical; builtin:cargo нельзя отключить — unsupportedfixture отказан, forgednohold snapshot проверен отдельно. Browser ring-selector заменён actualcard ID, '.2' нормализован0.2, heat-controls находятся в открытых `channel-details`. Ни WHAT, ни product/test runtime не правились. `oracle-corrections.json` связывает corrected assertions с прежними genuine measurements.

Сохранённое owned historical concern **ulab-w7j** для old imported timed duration blur не проверялось заново и не объявляется fixed. Новый mission first-click — измерен безTab. Не выполнены: физический Xiaomi/второе устройство/native OS gestures/PublicPages/OverGate/base/main/merge; full72/full9H/12h/Legacy rerun; полный Cartesian всехinputs/phase-loss timing/unknowncatalog fixture classes. Все optional branches подготовительного плана не выдаются за отдельные fresh wholecases. Размер820 не входил в эту15AC LAN1440/390 кампанию. Отказ noore проверен syntheticinvalid snapshot; текущиеcanonicalhulls все сохраняют builtinorehold.

Mandatory normalguard — Developer/PM gate, не собственное QA evidence. PM сообщил427unit/46browser+1inheritedscreenshotSKIP наcandidate, затем isolated fresh-checkout6ENOENT testlogging issues в primaryguard; их restricted test/helper fix не изменяет27 tested runtime owners или servedartifact. QA не исправляет и не снимает этот gate, currentguard completion остаётся PM. Source/build equivalence после такого test-only delta не означает новую runtime execution.

## Seal и handoff

Raw inventory: **188 files**, SHA256 of sorted `name\0fileSHA256\n`: **`a9e92271819c757f22024e813f3a69b7c3ea44f53687658bf4e2f6f87a5a661f`**. `evidence-manifest.json` хранит каждый localpath/bytes/hash, preparation/old oracle pointers и подписанный report hash; huge raw данные не требуется копировать в канон. Новые report/raw files0444 после readback; старые seals untouched.

Подпись: **independent QA / Codex; exact provider model ID unavailable / tested ec259315 / 2026-10-06**. Runtime execution завершено, дополнительных probes нет. **Source freeze для QA execution RELEASED после точного seal**; итоговые QA evidence привязаны кec259 и сохраняются независимо от последующей metadata/test-only работы. PM solepublisher; QA IDLE, scoped Reviewer отдельно.
