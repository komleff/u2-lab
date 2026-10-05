# Независимое affected PLAN_REVIEW — Ship Fitting v0.2, round 2

Дата: 2026-10-05. PR: https://github.com/komleff/u2-lab/pull/3.

- Actual Role: независимый Reviewer, owner `.agents/RV_ROLE.md`, mode `PLAN_REVIEW`.
- Model: Codex; точный provider/model ID этой сессии средой не сообщён. Предполагаемый ID не заявляется.
- Delivery mode: PRODUCT. Это affected turn той же verifier session, не новый launch.
- Commit: `676862a980d4f6c41f6de279ebe41231cf2289ba`.
- Previous reviewed candidate: `95b26f25a917deb92120198ba658f60aa10618cf`.
- Baseline: `6fb7166513627941e2ba2c4a9a01c79ae1667820`.
- Source U2: `cdc490e3517c8455f662f82579c45813cdbb9a76`.
- Source WHAT: GDD; source HOW: T1–T7 plan; source Review Contract: VC целиком.
- Scope этого turn: closure B1/SF13 и B2/SF19 с непосредственными SF07/SF12/SF14/export-replay связями. Неизменённая часть общего design/plan review сохраняет evidence r1.
- Verdict — дизайн: **PLAN_READY**, active BLOCKER **0**.
- Verdict — план: **PLAN_READY**, active BLOCKER **0**.
- Overall Verdict: **PLAN_READY**, active BLOCKER **0**. B1/B2 закрыты. ADVISORY A1/A2 из r1 сохранены; новых findings нет.

## Привязка reviewed content

Reviewed-Paths — ровно пять acceptance paths:

| Path | Git blob |
|---|---|
| `docs/gdd/gdd_u2_ship_fitting_v0.2.md` | `eac9ece236840af775181d5936799df1e8cff2bd` |
| `docs/plans/2026-10-05-ship-fitting-v0.2.md` | `aa48875c5c40aae0b3b98f137c704edc11bd0b44` |
| `docs/research/ship_fitting_source_synthesis.md` | `a98c69894d98c688a0c4b19d4e7f39ff44004a67` |
| `docs/research/ship_fitting_sources.json` | `a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec` |
| `docs/verification/ship-fitting-v0.2-contract.md` | `314d1770363d642df4c2dec069a308b715911c58` |

Content-Fingerprint: `550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`.

Независимо пересчитан SHA256 canonical JSON `{blobs:[{path,blob}],contract:{path,text}}`: UTF-8, sorted keys, no extra whitespace; paths отсортированы по path, contract содержит **весь точный текст VC**. Результат совпал с `.overgate-runtime/ship-fitting-review-binding.json`. Аffected diff GDD/plan/VC прочитан полностью; весь current VC прочитан. Неизменённые source synthesis и 41-source manifest имеют те же blob IDs, поэтому source evidence r1 переносится без повторного broad audit.

Immutable r1: `docs/reviews/2026-10-05-ship-fitting-plan-review-r1.md` побайтно совпадает с сохранённым отчётом; SHA256 `16c28c3a123293099ca2c067a2838cdad90dcf0d68244be60a45c85df9d43a93`. PR evidence r1: https://github.com/komleff/u2-lab/pull/3#issuecomment-5995566009. Публикация в PR указана PM; Reviewer проверил локальные Git/report bytes.

`git diff --check previous candidate current candidate`: PASS. Changed path inventory не содержит runtime/source/test/config changes. Это deterministic document/binding check, не runtime QA.

## Часть 1 — affected closure дизайна

**B1 — CLOSED.** GDD §7 теперь определяет `R_actual_selected` как добычу тех же уникальных installed mining IDs, по которым фиксируется `R_rated_selected`. Положительный mining request вне этой группы является ошибкой сценария; нулевой запрос вне группы допускается. Правило membership сохраняется в export/replay. Hidden clamp явно исключён. Нулевая группа/время остаются N/A, а off/duty не изменяют знаменатель.

Исходный контрпример «3 installed / 1 selected / 3 positive» больше не является допустимым опытом: SF07/SF13 требуют rejection. Для допустимого случая «3 installed / 1 selected / только selected powered» план T4 даёт точный oracle: 10s полной работы + 10s idle → K=0.5. T3 отдельно проверяет unknown/duplicate/non-mining group IDs, T6 — сохранение и повторную валидацию membership. Это закрывает определение коэффициента и адреса проверки, не добавляя обязательного нового UI selector.

Bounded recovery summary в GDD поддерживает B2: первое завершённое восстановление и count/mean/max завершённых восстановлений; незавершённое показывается отдельно и не усредняется. Это явное уточнение нового lab proposal. Оно не выдаётся за принятое PO решение.

**Design verdict: PLAN_READY.** Неизменённые выводы дизайна и A2 provenance advisory из r1 остаются в силе; source authority и curated roster не переоткрывались.

## Часть 2 — affected closure плана

**B2 — CLOSED.** Global constraint, StateV2 и MiningMetrics больше не предусматривают коллекции прошлых limitation/recovery intervals. Ключи ограничены fixed installed roster и фиксированными causes power/thermal/resource/cargo. Exact durations, union/overlap, loss и downtime накапливаются online; объём counters/open-state O(knowninstances × knowncauses) не зависит от числа переключений. Recovery хранит first/count/sum/max и один pending timestamp; pending не входит в mean. Retained event trace сохраняет прежний cap, а SF19/T7 явно включают metric state в heap check после event truncation.

T4 содержит адресный metrics-only synthetic-step oracle `[1s work loss(power+heat), 1s full work, 1s service] × N`. Его ожидаемые суммы согласованы: union=N s, power=N s, thermal=N s, overlap=N s; при partial output forced downtime=0. В zero-output варианте forced downtime=N s и N завершённых восстановлений по 1s. Сравнение N=100 и N=10000 требует одинакового количества keys/collections и отсутствия history arrays. Synthetic fixture изолирует accumulator semantics и не заявляет такой сигнал результатом физического kernel. Future T7 отдельно проверяет фактический heap/GC с telemetry и event truncation.

Это закрывает обход retention cap, найденный в r1, сохраняя точные metrics независимо от потери raw events. ACK withholding/Pause/Step/Cancel и остальные SF19 numerical/peak требования не ослаблены. Ownership, sequencing и rollback не менялись.

**Plan verdict: PLAN_READY.** B1 также отражён в T3/T4/T6. A1 о моменте baseline v1 capture не исправлялся автоматически и остаётся advisory с rationale r1.

## Состояние findings и границы evidence

| Finding | Current state | Основание |
|---|---|---|
| B1 — group accounting K_use | CLOSED | GDD §7, SF07/SF13, T3/T4/T6: same-group accounting, rejection, oracle, replay membership |
| B2 — unbounded metric interval state | CLOSED | SF19, T3/T4/T7: fixed online state, exact alternating oracle, metric-inclusive heap check |
| A1 — ранний baseline v1 capture | ADVISORY, unchanged | T6 уже требует capture before new model changes; обязательное расширение fix отклонено в r1 |
| A2 — nominal Pony anchor / sensitivity provenance | ADVISORY, unchanged | Nominal 35t сохранён; explicit lab hypothesis не объявлена U2 SKU proof |

Нет новых BLOCKER/ADVISORY. Указанные expected oracle values проверены как определения планируемых cases; сами будущие unit/browser/12h tests **NOT RUN**. Не проверялись будущие catalog JSON/runtime, пользовательский плейтест, actual served Pages build, второе физическое LAN устройство, native hooks, bootstrap acceptance, finalize/merge или вся PR metadata surface. Не выполнялся новый source/governance/full-game audit; credentials, .env и secrets не читались. Reviewer не менял продуктовые документы, GitHub, Beads или tracked files.

Общий PLAN_READY относится к качеству review-ready proposal и implementation HOW после closure B1/B2. Он не принимает новые quantitative/UX/K/recovery детали вместо PO, не удостоверяет runtime completion и не отменяет предусмотренное планом PO acceptance до Developer work. Independent runtime QA/scoped Code Review, base bootstrap gates и operator merge остаются отдельными этапами.

— Независимый Reviewer (Codex; точный model ID не сообщён), affected PLAN_REVIEW
