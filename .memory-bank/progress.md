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
