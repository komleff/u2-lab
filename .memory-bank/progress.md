# Подготовка Лабы2.7.0 — 2026-10-28

Текущая release-интеграция: [PR54](https://github.com/komleff/u2-lab/pull/54),
Beads `ulab-sqb`. Accepted main5b363287 после PR53/31 объединяется с уже публичными
clean-root/О Лабе/V_FA1–4 из2.6.2. Физика/catalog0.3.4/mission2 и старые literal
маршруты/форматы сохраняются;22 receipts не пересоздаются. Source-readiness и
Save Fit guards main сохранены. UI2.7.0, интерфейс4.8 и модель0.1 — разные версии.
[Release scope/proof](../docs/releases/2026-10-28-v2.7.0.md). QA/Review/CI и публикация
идут отдельно; Pages/GHRelease выполняет PM после qualification, main merge — оператор.
Canonical task status — Beads. Это preparation context, не объявление публикации.

# PR53: рейсовое управление2 и фактический счётчик — 2026-10-27

Текущий Developer candidate — [PR53](https://github.com/komleff/u2-lab/pull/53),
Beads `ulab-9do` / `ulab-b3y`; independent Plan Review1/5 — PLAN_READY на HOW0.2.
Новые QA2/5, scoped Review3/5 и current guard/CI публикуются отдельно, acceptance
не объявлена. PR51 C2 остаётся frozen Draft; физический пакет наследуется в53.
Source S3: `d43e6a45f4044fa2a1082f401df9b5aaa3b933ea`; физический каталог0.3.4 прежний.
Fresh current рейсы получают mission/2, любой explicit/imported mission/1, включая
saved C2 catalog0.3.4, остаётся literal при copy/export/reopen/checkpoint.

[22 измерения](../docs/research/2026-10-27-ermak-flight-corrections/README.md):
Ermak10800 s none/ActiveOFF —7 рейсов, passive3/ActiveON —10; soft derate2325/2385 s
у первых двух, у passive/ActiveON не наблюдался. Это measured outcomes без rebalance,
не универсальная стабильность. Weak full leg: arrival1570.985 s, отдельный paid-brake
control —1058.880 s; stocks/energy/CPU Pending и actual Worker измерены отдельно.
18 прежних receipts/64:03/рейс5 остаются historical mission/1 и не квалифицируют
новый default2. ТТХ/gates/heat/mass/C/dock и старые каталоги не переписаны.
Экономика/repair/exposure/U2 production/Pages OUT. Canonical task status — Beads.

# Теплоэнергетический стенд 0.3.4 — контекст 2026-10-26

Beads `ulab-16h` — canonical task state; current implementation/evidence —
[PR #51](https://github.com/komleff/u2-lab/pull/51), source — #49 b1cbc3 и U2 #905 f08558a9.
Принятый общий пакет q1-accepted.5, план0.5 PLAN_READY. Окончательная коррекция
оператора: только heat/energy/physical TTX, actual resources, монтаж/source readiness,
пассивный обесточенный ангар и воспроизводимые опыты. Экономика/новая ремонтная
система/failure-exposure expansion в Lab OUT; решения U2 переданы PM F2.

Новый numerical source7082ec74/catalog0.3.4: temps/D40%/surface physical A·ε,
Pony shell31.5t/IndustrialG0/UNKNOWN, генераторные coefficients отдельно от engines,
автоматика и dock300K/G10000 без расхода/temperature reset. Старые каталоги/35 research
опытов не мигрируют. 18 actual receipts: Спутник first work limit64:03/рейс5,
Пони42:16, Ермак холоднее; cold heater полезен, но не обещает nominal во всяком fit;
при600K специализированное охлаждение тоже ограничено. Измеренный разрыв к рейсу4
передан GD/PO без подгонки принятого WHAT.

[Передача PM F2](../docs/handoffs/2026-10-26-f2-thermal-energy.md) содержит source SHA,
данные/измерения и границы. Фактические QA/scoped Review/CI/finalize — в PR51,
не в этом checkpoint. Серверный restart-schema230/480 blocker сохраняется;
U2 production/merge/deploy не выполнялись. Plan-only PR50 GitHub автоматически
пометил merged после ошибочного порядка PM base integration; runtime в нём не было,
main не менялся. Новая реализация отдельно в PR51.

# Рейсовый `/4` и прогресс — recovery, 2026-10-24

`ulab-9aa.24` / PR #44, ветка `fix/ship-model-duration-progress`. Источники:
`docs/superpowers/plans/2026-10-24-ship-model-duration-progress.md` и связанный design.
Fresh Sputnik-D: mission H3600 / D100 км / laboratory V_FA250 / cruise500 м/с /
background250 K / repeat и station replenishment ON. Stationary и старые документы
сохранены отдельно; mission model `ship-fitting-ship-model-mission-0.1`, state
`ship-mission-state/1`. Frozen input/state/events/result digest:
`tests/fixtures/ship-model-mission/sputnik-d-hour.json` (измерены 3 service, 90 SCU доставлено).
Актуальные SHA/QA/Review/merge status — canonical Beads и PR #44; эта запись — recovery context.

# Пайплайн OverGate v4.0.0-rc.3, 2026-10-24

PR #40: managed payload rc.3 `b830d5ed` установлен по install-плану 3a8b616e (apply →
rollback → повторный apply, 0 расхождений с manifest). Обёртки Beads — upstream rc.3,
override PR #30 и 4 allow-правила сняты; `beads.md`, `AGENTS.md` (§5 плана), techContext,
source-authority и `check-bootstrap.py` — на rc.3. Live smoke обёртки из worktree на
embedded: `ready`/`show` проходят, `--description-file` и `--global` — отказ rc=2.
Далее QA, Code Review, `/finalize-pr`; merge — оператор.

# Ship-model v0.1 — подготовлен функциональный кандидат, 2026-10-11

Актуальный task status: canonical Beads ulab-9aa.10–.16 (primary bd API only),
snapshot1895799. Актуальные commit/evidence/acceptance: Draft PR22, не этот checkpoint.
Milestones D0/T1 b5cb313 и T2/T3 476392d: обычный full guard PASS; последний
1198unit/118browser+1inheritedskip/type/build/reference/bootstrap/26cloud PASS.
T4–T6 ещё до final guard/commit: focused T4 и actual Worker CP05 PASS; T5 functional
155unit/19files, type/build и actual browser6 PASS (compile1440/390/820,
pause-save-import-resume, ownership/atomic refusal, real RESTART/repair).
T6 latest receipt:55 actual production cases, measured matrix/CP exports,
literal artifact reproduction,10,000s bounded retention и5000+restore5000 equivalence GREEN.

Не объявлено: whole-candidate acceptance, независимые QA/Code Review, current CI
final candidate. Следующий шаг — normal full guard, frozen SHA, QA SM-01–14 и один
scoped Review по плану §8. Один основной Developer; no per-task reviewers/swarm.
PRODUCT1/5 до QA; review/fix counter0/3, каждый третий цикл — PM_ERR/DOC_PR аудит.
Early PM manual audit выполнен; тактика — полезные combined milestones, no cosmetics,
no speculative hardening/новый канон/лишние metadata guard-циклы. План692385d неизменен.
Preview4197 experimental opt-in; existing live releases сохранены. Межрепозиторный
server parity, physical second LAN, native activation, playtest/balance и bootstrap/base
acceptance отдельные NOT RUN/open gates; merge только оператору.

## Начало реализации — историческая квитанция

Accepted plan1.2/frozen692385d, affected PLAN_READY PR21comment6100571178,
0blocker/0advisory/noPRODUCTGAP. Operator approved implementation and selected
GPT-6.1 Sol/xhigh. Runtime DraftPR22/feat/ship-model-v0.1-runtime from692385d,
basePR21. Source binding и Beads IDs: docs/reviews/2026-10-11-ship-model-implementation-launch.md.
Canonical ulab-9aa.10–.16 созданы primary bdAPI; snapshot0ba144a опубликован.
Исходные девять IDs не изменялись. Статус работ — только Beads, не этот checkpoint.

Metadata launch5f209e7 full baseline .agents/project/verify.sh PASS:
77files/1075unit,117browser+1inheritedskip,26cloud,type/build/reference/bootstrap.
Это baseline evidence, не QA новой модели. DEV_RELEASE D0 vectors+T1 schema/catalog/state
основному /root/ship_model_developer. PRODUCT independent budget1/5: existing PlanReview;
QA и scopedReview whole candidate ещё не запускались. PM runtime не пишет.
Actual server parity/physical second LAN/native activation/playtest/base/bootstrap
acceptance/finalize/operator merge отдельные OPEN gates. Cold-H2 Masking numeric stage OUT.
Legacy results/catalog0.2.x и текущие live releases сохраняются.

## Предыдущий checkpoint

# Operator result-dock fix, 2026-10-07

ulab-p2w, PR13/fix/catalog-dialog-focus от7eef0c0. Accepted WHAT0.7:
нижняя панель дублирует SCU/ч текущего опыта; paused/final/stale/import/reset
и active-owner понятны, старое число не выдаётся за новый run. WF03–06/12–14,
MC04; HOW0.1 прежний, no physics/runner/workspace/IO. Один existing Developer,
короткий actual Worker lifecycle и нормальный guard, затем experimental4196/Pages.
Семейства и menu-only уже LIVE7eef, сохраняются; старые архивы/4189 не трогать.
PM_ERR/DOC_PR аудит после трёх operator UI-итераций выполнен, counter0/3;
UI independent budget5/5/final+1 pending прежний, новых verifier нет.

# Operator sort-menu fix каталога, 2026-10-07

ulab-p2w/MC03, один прежний Developer, PR13/fix/catalog-dialog-focus от55279fd.
WHAT0.6: удалить весь ряд duplicate сортировочных кнопок; правое dropdown меню
и все его варианты/порядок/совместимые-first сохраняются. No physics/catalog/IO.
HOW0.1/PLAN_READY прежний. Source/tests/обычный guard → experimental4196/Pages;
старые архивы и hashed assets сохраняются. Бюджет independent5/5/final+1 pending
прежний; no new verifier. Счётчик самоаудита1/3→после этогоfix-turn2/3.
Текущая55279fd поставка доступна до нового проверенного build; history ниже.

# Operator family-filter fix каталога, 2026-10-07

ulab-p2w/MC03, один существующий Developer, PR13/fix/catalog-dialog-focus от2ede529.
WHAT0.5: семейства и All только category+families выбранного слота; search/size
не сужают список семейств, refusals внутри семейства остаются. Неполный fit
можно чинить, stale family→all; initial Close/intentional search сохраняются.
HOW0.1/PLAN_READY прежний; no physics/catalog/schema. Developer RED/GREEN+
normalguard → experimentalLAN4196/Pages с сохранением архивов/старого4189.
Независимый budget5/5/final+1 pending прежний; не запускать новых verifier.
Последний самоаудит выполнен, counter0/3; эта fix-итерация затем1/3.
Прежняя поставка2ede529 live до новой проверенной сборки; history ниже.

# Operator focus-fix каталога, 2026-10-07

ulab-p2w/MC03, existing Developer fix-turn; fix/catalog-dialog-focus от4339eca2.
WHAT v0.4: каталог открывается с фокусом Close, manual search/Tab/caret сохраняются.
ROOT reproducedLAN1024: nativeClose→explicitsearch, keyboard trigger confirmed.
Цель — genuine open/reopen без любого editablefocus; OSkeyboard физически NOT RUN.
Developer RED/GREEN и normalguard → experimentalLAN/Pages, no new physics/hour.
Independent UI budget5/5 прежний, final+1 ожидаетоператора, не брать cooling budget.
Самоаудит после QA4+Review5+operatorfix3/3, counter0/3; PR Draft/merge-ineligible.
Существующие публичная cooling версия и архивы/старый4189 сохраняются до нового build.

## Предыдущий checkpoint

# Автоматика охлаждения — поставлен, 2026-10-07

Beads ulab-6xr; PRODUCT5/5: QA4 PASS, Review5 APPROVED/0B0A, CR-CC-B1 CLOSED. Accepted WHAT:
H₂ Efficient Auto по потребности;≤300K own heat/aux/H₂0. Active закрывает
площадь/насос при Tenv≥Tship. Signed hull/Passive и TI сохраняются; generator
независим. U2 current INDEX→palette0.4/doctrine0.2.8, DraftPR843/18d2c82.
HOW/CC01–05: docs/plans/2026-10-07-cooling-control.md, весь контракт неизменен.

Runtime c9e09b2: исходная физика a3 + observer/test fix CR-CC-B1,2paths;
57other src exacta3. Guard520unit/54browser+1SKIP/26cloud/type/build PASS.
Plan1 READY; QA2 PASS; Review3 historical CHANGES_REQUESTED1B0A. QA4 PASS, Review5 APPROVED/0B0A, обе независимые проверки sealed. Selfaudit PM_ERR/DOC_PR выполнен3/3, counter2/3 после QA4+Review5.
Immutable release .overgate-runtime/cooling-control-interval-fix-release/.
LAN4196 c9e09b2/PID13066,17HTTPassets exact, Start1.5s/Pause/iClose/errors0.
http://192.168.68.65:4196/?v=cooling-c9e09b2
PUBLIC https://komleff.github.io/u2-lab/?v=cooling-c9e09b2
Pages c13791a built/error=null;41HTTPSfiles exact, actualStart1.5/Pause/iClose/errors0.
Archive thermal-v0.1/17 exact/Start1.8/Pause/errors0; legacy-v1/4+root3 unchanged.
Metadata-only normalguard commit и reviewed-content equivalence — финальный checkpoint PR12.

UI4.1 PR11 base a97262b: QA5 PASS/CR-MC-B1 closed по QA, numerical unchanged.
Его budget5/5 отдельный, +1 final closure ожидает оператора. Не объявлять UI
review APPROVED и не заимствовать budget thermal/cooling. PR12/PR843 Draft,
main/bootstrap/native/physicalXiaomi/operator merge отдельно OPEN.
Sole Beads writer rootprimary bd API; старый4189 и Legacy-v1 сохранить.

## История checkpoint ниже; ссылки/процессы могут быть прежними

# Прогресс — 2026-10-07

PUBLIC https://komleff.github.io/u2-lab/?v=thermal-a6c7430: v2.2/UI4/catalog0.2.3/
thermal diagnostics0.1. Exact17assets и настоящий WorkerStart/advance/Pause/
bands/errors0 PASS. Первая Lab /legacy-v1/4files exact/Start/Pause/errors0 PASS.
LAN4196/latest и4189/previous сохранены; source a6, gh-pages b2842bc.

PR10 thermal diagnostics: QA6 PASS/CR-TD-B1 CLOSED, Review7 APPROVED/0B0A.
5affectedriskrows/26API+7native assertions, один LegacyWorker; reviewer2bounded
controls. Старые FAIL/CHANGES_REQUESTED сохранены. TD05 classQA4 и неизменные
AC/численные доказательства перенесены, без новой полной кампании.
Normalguard489unit/49browser+1SKIP/26cloud PASS; финальный metadata commit
проходит обычный guard, currentHEAD/result — FINAL ACCEPTANCE в PR10.

U2 canon DraftPR842/775ea: единая thermal curve+wear; Unity/server не менялись.
H₂governor/численный wear OUT. Stacked bases/bootstrap/native/main/merge OPEN,
обеPR Draft; operator merge отдельно. Beads ulab-6ty/rootprimary solewriter.
Оператор дал +5, использовано7/10, reserve3; два самоаудита PM_ERR1.3/DOC_PR,
второй при3/3, counter2/3 после QA4+Review5. Новых verifier launches без namedFAIL не нужно.

Прежняя v2.2: physical missions/M/HY/station service, PR9Draft; миссионные и
станционные blockers локально закрыты. Полная неизменная история — docs/INDEX.md.
