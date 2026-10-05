# Независимое PLAN_REVIEW — Ship Fitting v0.2, round 1

Дата: 2026-10-05. PR: https://github.com/komleff/u2-lab/pull/3.

- Actual Role: независимый Reviewer, owner `.agents/RV_ROLE.md`, mode `PLAN_REVIEW`.
- Model: Codex; точный provider/model ID этой сессии средой не сообщён. Предполагаемый ID не заявляется.
- Delivery mode: PRODUCT. Одна independent verifier session для двух частей: адверсальное ревью дизайна и аудит плана. Аffected follow-up относится к этой же сессии.
- Commit: `95b26f25a917deb92120198ba658f60aa10618cf`.
- Baseline: `6fb7166513627941e2ba2c4a9a01c79ae1667820`, ветка `feat/power-heat-lab`.
- Source U2: `cdc490e3517c8455f662f82579c45813cdbb9a76`; читались Git blobs этого snapshot, не содержимое отстающего worktree.
- Source WHAT: GDD и решения оператора, перечисленные в GDD §1. Source HOW: план T1–T7. Review Contract: VC целиком, раздел «Review Contract текущего этапа».
- Verdict — дизайн: **CHANGES_REQUIRED**, BLOCKER 1.
- Verdict — план: **CHANGES_REQUIRED**, BLOCKER 1, плюс зависимость от закрытия дефекта дизайна.
- Overall Verdict: **CHANGES_REQUIRED**, уникальных BLOCKER **2**, ADVISORY **2**. `PLAN_READY` не выдан.

## Привязка reviewed content

Reviewed-Paths — ровно пять acceptance paths:

| Path | Git blob |
|---|---|
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `97a9e4e2d0a8facf4ce372070dab2486a6722197` |
| `docs/plans/2026-10-05-ship-fitting-v0.2.md` | `ec0926adc534c51bbc5375c73588e8c5ed2310ed` |
| `docs/research/ship_fitting_source_synthesis.md` | `a98c69894d98c688a0c4b19d4e7f39ff44004a67` |
| `docs/research/ship_fitting_sources.json` | `a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec` |
| `docs/verification/ship-fitting-v0.2-contract.md` | `a8140d51bd4238b7909a8d5c60589a7ee059b634` |

Content-Fingerprint: `fd046943cd1f7112950bd6fa174b5d55686d832c4f818268dae8a0b31f74bb66`.

Независимо пересчитан SHA256 canonical JSON `{blobs:[{path,blob}],contract:{path,text}}`: UTF-8, sorted keys, no extra whitespace; paths отсортированы по path, contract содержит **весь точный текст VC**, включая review scope и numerical tolerances. Результат совпал с `.overgate-runtime/ship-fitting-review-binding.json`. Все пять документов прочитаны целиком. Все 41 blob hash в source manifest независимо сверены с указанным U2 commit: совпали.

`git diff --check baseline candidate`: PASS. Список changed paths содержит только документы и Memory Bank; runtime/source/test blobs в candidate не менялись. Это проверка состава design diff, не runtime QA.

Owner routing: lab Memory Bank → lab INDEX/role owners; U2 INDEX/ADR-INDEX/overview §16 → explicit source manifest/direct owner links. Семантически проверены релевантные части slot owner, multifuel delta, cargo primary 1.7, dry-mass owner 0.4, Pony owner 1.4, power components/load, laser energy owner, generator thermal topology, thermal palette и ADR-0043/0045/0049. Для игровой оценки прочитаны frozen GD_ROLE 1.4, game-designer skill и его heuristics. Hash verification всех 41 sources не означает полный самостоятельный semantic audit всех 41 документов.

## Часть 1 — адверсальное ревью system/game design

Основа дизайна согласована с назначением лаборатории. Монтаж не обещает поддерживаемую производительность; встроенные изделия учтены отдельно, одно место принимает одно изделие, меньший калибр допустим, повторяющиеся SKU имеют независимые экземпляры. Cargo 1.7 явно вытесняет старые сменные грузовые числа и не превращает неизвестный встроенный dry bill в ноль. Сохраняются общая T_ship, dry-material C, конечные stocks, signed radiation, раздельные электрическая тяга и beam output. Возвратное тепло вычитается из внешнего выхода один раз. Устаревший v1 эксперимент сохраняет собственную модель.

Применены шесть уместных линз: цель, значимый выбор, честность результата, мастерство, любопытство, простота. Четыре вопроса игроку и MDA здесь дают проверяемый вывод: fitting → измеренное ограничение → сравнимый опыт поддерживают инженерное исследование; простои, расход и абсолютная добыча удерживают K от роли общего рейтинга. Мгновенная дельта замены, результат опыта и серия сравнений покрывают три горизонта обратной связи. Значимость выбора и привлекательность обучения остаются гипотезами для будущего UI/пользовательского опыта, а не доказанным плейтестом.

### B1 — числитель K_use не привязан к selected group

**Severity: IMPORTANT / BLOCKER.** Адрес: GDD `docs/gdd/gdd_u2_ship_fitting_v0.2.md:235`, определение выбранной группы на строке 238; VC `docs/verification/ship-fitting-v0.2-contract.md:35` (SF13); plan `docs/plans/2026-10-05-ship-fitting-v0.2.md:168` и `:203`.

GDD определяет `R` как полезную добычу опыта, а в K задаёт только знаменатель `R_rated_selected`. RunSpec позволяет одновременно иметь произвольные requests по экземплярам и отдельную fixed selectedWorkGroup. Не определено, учитывается ли добыча вне группы в числителе и разрешён ли положительный запрос такого экземпляра.

**Достижимый контрпример:** установлены три Civil S/G1 лазера; selectedWorkGroup содержит один; все три получают положительный запрос и полное питание на коротком безопасном интервале от конечного аккумулятора. Общая добыча равна `3 × 0.0625125 SCU/s`, знаменатель выбранной группы — `0.0625125 SCU/s`. Буквальная формула даёт K=3 и нарушает SF13. Clamp до 1 скрывает чужую добычу и также не доказывает коэффициент использования выбранной группы. Нынешний oracle с группой из всех трёх этот случай не различает.

**Минимальный fix:** явно связать numerator и denominator с одним неизменным набором mining IDs. Зафиксировать существующий смысл selected group: либо положительные mining requests вне неё отвергаются validator, либо только добыча выбранных экземпляров участвует в K, а общая добыча остаётся отдельной метрикой. Не использовать clamp как решение нарушения. Новый UI selector для закрытия finding не требуется. Добавить oracle «3 installed / 1 selected», проверку IDs/group membership и сохранение правила при replay; сохранить уже описанный off/duty denominator.

**Affected closure surface:** GDD §7, SF13/связанный SF07, T3 validation и T4 metric oracle. Это clarification нового lab WHAT для GD/PO, не самостоятельный выбор Reviewer.

## Часть 2 — аудит implementation plan

T1–T7 имеют понятные границы владения: catalog authoring → fit resolver → v2 kernel → scenarios/metrics → UI/persistence → comparative acceptance. Один numerical bill и immutable resolved snapshot предотвращают второй расчёт в UI. Версионированный dispatch и отдельный v1 путь уменьшают риск переинтерпретации экспортов. Отказ импорта атомарен; откат v2/UI и предыдущего Pages artifact не требует изменения исходных exports. Статические проверки и independent QA/review находятся после реализации. PO acceptance новых деталей и PLAN_READY сохраняются как preconditions.

Покрытие AC последовательностью:

| Acceptance surface | Owning steps и оценка |
|---|---|
| SF01–05: presets, slots, readiness, architecture, bill | T1/T2, T5 для readiness; положительные и отрицательные случаи адресны |
| SF06–11: cargo, requests, electric/mining ledger, finite stocks | T2–T4; analytic и dt refinement предусмотрены |
| SF12–15: metrics, first limiter, comparable series | T4/T5/T7; **B1** оставляет неоднозначный oracle K |
| SF16–18: browser flow, revisions/ACK, versioned persistence | T5–T7; stale identity и failed import покрыты |
| SF19–20: retention/performance/export/static HTTP | T4/T6/T7; **B2** оставляет обход retained-state bound |

40-item JSON authoring является будущим результатом T1. Его отсутствие на design stage не является failure и не требует предварительной runtime реализации. Минимальный безопасный diff уже использует отдельную v2 модель, существующие Worker/charts и curated roster; оснований расширять поставку до полного каталога или flight/economy/detection нет.

### B2 — массивы metric intervals могут расти мимо retention cap

**Severity: IMPORTANT / BLOCKER.** Адрес: plan `docs/plans/2026-10-05-ship-fitting-v0.2.md:170`, `:201`, `:277`; VC `docs/verification/ship-fitting-v0.2-contract.md:41` (SF19). Связанные SF12/SF14 требуют точных durations независимо от потери raw events.

План предусматривает `limitation intervals` в StateV2 и `per-cause overlapped intervals` в MiningMetrics. Для них не установлен bound, правило online aggregation или запрет хранить историю каждого переключения. Лимиты 50000 buckets и 20000 events ограничивают traces/events, но сами по себе не ограничивают эти коллекции. Requirement «считать метрики до retention» не закрывает память accumulator state.

**Достижимый контрпример:** законный repeated cycle чередует короткие положительные work и service фазы; при work возникает частичная power/thermal/cargo loss, при service рабочий запрос равен нулю. Длительности положительны и могут быть порядка physics dt; повтор имеет реальные requests, поэтому не является empty cycle. За 12h возникают миллионы границ интервалов. Даже после event truncation массивы причин продолжают увеличиваться. Heap и экспорт могут расти с длительностью/частотой переключений, хотя bucket/event checks проходят. Это конкретный обход SF19 и named retention risk, не просьба об общей оптимизации.

**Минимальный fix:** явно ограничить **весь retained metric state**, включая limitation/recovery history. Exact per-cause и union durations, loss integrals, earliest cause и recovery считать online по physics steps; хранить counters/open state с объёмом O(числа известных instances × числа известных causes), либо столь же явно ограниченное представление. Полная raw история не нужна для принятых summary metrics; retained event trace сохраняет объявленный cap и честную truncation metadata. Добавить deterministic oracle чередующихся work/service/limit фаз: точные durations/overlap/recovery плюс постоянный объём metric state при увеличении числа циклов. В T7 heap check должен учитывать эти состояния вместе с telemetry; delayed ACK/control requirements сохраняются.

**Affected closure surface:** T3/T4 state contract, SF19/связанные SF12/SF14, T7 retention oracle. Новые зависимости и больший product scope не нужны.

## ADVISORY — не расширяют текущую приёмку

**A1. Ранний baseline v1 fixture capture.** Plan `docs/plans/2026-10-05-ship-fitting-v0.2.md:254`. Шаг T6 правильно требует capture до new model changes, но по dependency order следует после T3. Если исполнитель читает только последовательность шагов, он может записать baseline из уже изменённого dispatch. Минимальное улучшение: сделать этот capture явным preparation до T3 либо извлекать golden из точного baseline commit. Не blocker: требование «before new model changes» уже присутствует, baseline SHA назван и старый kernel запрещено менять.

**A2. Provenance Pony shell 35t.** GDD `docs/gdd/gdd_u2_ship_fitting_v0.2.md:168`; frozen source `docs/gdd/gdd_survival_starting_ship_v0.1_draft.md:181`. Current starting-ship owner уже даёт bare UNKNOWN/G0 S hull 35.0t. Cargo 1.7 меняет грузовые опоры и оставляет construction неизвестного встроенного трюма открытой; это не удаляет отдельный nominal shell anchor. Гипотезой остаётся material/cp closure и диапазон собственного lab variant. Минимальное улучшение: отделить source-derived nominal 35t от experimental sensitivity 25–45t и сослаться на §7 Pony owner. Не blocker: предложенное nominal значение совпадает с owner; варианты явно экспериментальны, готовность U2 SKU не заявлена.

Compatibility triage:

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| B1 | IMPORTANT | [BLOCKER] Group accounting K_use | docs/gdd/gdd_u2_ship_fitting_v0.2.md:235 | fix now | SF13; numerator/membership ambiguity |
| B2 | IMPORTANT | [BLOCKER] Unbounded metric interval state | docs/plans/2026-10-05-ship-fitting-v0.2.md:170 | fix now | SF19; traces/events cap не ограничивает accumulator history |
| A1 | MINOR | [ADVISORY] Уточнить момент v1 capture | docs/plans/2026-10-05-ship-fitting-v0.2.md:254 | reject with rationale | Не включать в обязательный fix: early capture уже явно требуется |
| A2 | MINOR | [ADVISORY] Разделить nominal Pony anchor и sensitivity | docs/gdd/gdd_u2_ship_fitting_v0.2.md:168 | reject with rationale | Не включать в обязательный fix: nominal сохранён, вариант объявлен hypothesis |

Статус `reject with rationale` выше отвергает обязательное расширение текущего blocker fix; PM/PO могут отдельно принять улучшение. Beads/status/GitHub mutations Reviewer не выполнял.

## Границы verdict и evidence

Не проверялись и не запускались: будущий runtime/code/catalog JSON, unit/browser/12h execution, пользовательский плейтест, actual served Pages build, второе физическое LAN устройство, native hooks, bootstrap acceptance и finalize/merge. Changed runtime surface отсутствует. Прошлое QA v1 не выдано за QA v2. Не выполнялся re-audit pipeline governance, всего U2 balance/production, whole-flight/economy/sensor/detection или всей PR metadata surface вне пяти acceptance paths. Не читались credentials, .env или secrets.

Review проверяет непротиворечивость и исполнимость proposal. Оно не утверждает новые числа/UX/K details вместо PO и не разрешает runtime work до product acceptance. После targeted fix достаточно affected review B1/B2 в этой же session с новым five-path/entire-VC fingerprint; новый полный аудит не требуется.

— Независимый Reviewer (Codex; точный model ID не сообщён), PLAN_REVIEW
