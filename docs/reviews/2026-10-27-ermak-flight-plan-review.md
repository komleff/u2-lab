# Независимый Plan Review PR53 — Ермак, полёт и счётчик

**Verdict: PLAN_READY. BLOCKER: 0. ADVISORY: 0.**

Mode: PLAN_REVIEW. Actual role: независимый Reviewer, PRODUCT launch1/5 для `ulab-9do` + `ulab-b3y`. Actual dispatched model: **gpt-6-astra / high**, metadata существующего агента; serving internals не экспонированы. Reviewer не автор HOW, не Developer и не выполнял продуктовых правок.

PR: https://github.com/komleff/u2-lab/pull/53 . Base: `3b6c4622435b7d6ea3353ef41899085e1731d7f9`. Commit: `27a6dd164146c7d4cd4de8c49caca2d950757da9`. Source plan: `docs/plans/2026-10-27-ermak-flight-counter.md`, v0.2, blob `5b3c5b645ea3a35b89156a5e9b103672fed4a8c6`. Review Contract: `docs/reviews/2026-10-27-ermak-flight-review-contract.md` и supplied exact PR53 CONTRACT. Runtime остаётся C2 `cb67fcf096b5b2c046b7f65cc41500795803def0`.

## Вывод по HOW и EF01–EF08

План достаточен для начала реализации одним Developer. Он адресует две подтверждённые причины E4 — пропуск близкого coast/brake события и прогноз по постоянной тяге при её последующем изменении — и узкую неоднозначность E6. Повторная реализация E1/E2/E3/E5/E7 и новый физический ребаланс не требуются. Принятый WHAT не оставляет PRODUCT GAP, требующего нового решения оператора.

| AC / риск | Проверка плана |
|---|---|
| EF01: событие и arrival | Explicit handoff вместо пропуска root решает исходный guard mismatch; отдельная coupled projection адресует hot-force ошибку. Переход в approach/service требует actual x/v в прежних допусках, а не forecast или ширины bracket. Уже physically late checkpoint не получает невозможной гарантии остановиться до станции; оплаченные braking/recovery и запрет false service сохранены. |
| EF02: реальная физика | Shadow использует полный cloned State/RNG, `stepV3Interval`, фактический impulse и среднюю начальную/конечную массу через существующий `advanceFlight`. D/H/E/mixed, thermal/fuel/power/cargo cases включены. План не требует менять kernel, TTX, глобальный dt или экономику. |
| EF03: observation prefix | Horizon исключён из физического stopping domain. H1 проверяет общий первый tick; H1200/3600/10800 — общий1200s prefix. Spec/status/done правильно отделены от физического состояния/метрик/history. Отменённое предложение ограничивать forecast observation duration не является действующим HOW. |
| EF04: scheduling и сохранение | Owner job — RunContext; checkpoint содержит только actual state. Plan включает Pending0steps, сохранение Step intent, Pause/Cancel/discard, cold restore/cache eviction и deterministic CPU slicing. В текущем Worker Step действительно снимается безусловно после chunk; protocol.ts включён в planned surface, поэтому необходимое изменение не пропущено. Deadline передаётся внутрь job, а не только между целыми ticks. |
| EF05: совместимость | `mission.version` уже существует и валидируется отдельно от physical/state format. Explicit1/2 dispatch позволяет сохранить все старые1, включая C2/0.3.4, и явно включить2 только для fresh current input без explicit mission. Existing workspace хранит replay и imported mission буквально; copy/restore/unknown/new→old refusal включены в AC. Новая schema или migration framework не нужны. |
| EF06: factual UI | `traceChart` действительно начинает high=1 и показывает верхнюю отметку без слова «шкала»; `selectedOverview` передаёт единицу «рейсы». Existing Results/Live уже читают правильный `r.state.mission`. План сохраняет series/buckets и добавляет scoped scale label и factual figcaption из того же r.state; bucket selection/current fit/frozen не становятся новым численным owner. No-data отдельно от0,1440/390 и shared consumers покрыты. |
| EF07: полезный результат | Сохраняются source PR52 specs, original FAIL и новое различение C2/mission1/mission2.1200/3600/10800s controls измеряют работу, доставку, ресурсы, пики и ограничения, а не один finalT; Active source losses и fixed-heat reference не смешаны.3h не названы игровым нормативом или доказательством бесконечной устойчивости. |
| EF08: численная и практическая выполнимость | Global-boundary alignment устраняет самостоятельную shadow1s сетку после fractional candidate; classification bracket не изобретает negative rest distance. Stop witness и unresolved error отделены от computational Pending. Weak1059s leg и actual Worker latency/performance включены в будущую проверку;256steps/H1 не становятся физическим пределом. Reference0.5/0.25 остаётся instrumentation, не изменением публичного шага. |

В контексте раздела физических событий требование stop witness относится к уточнению перехода coast/accel→brake и допуску actual arrival. Обычный безопасный interval вдали от цели и немедленный paid brake при unsafe/no-force не требуют заранее прибыть на станцию: эти исходы отдельно описаны authoritative HOW v0.2. Это согласованное прочтение плана и предоставленного технического предложения, а не новый AC.

Последовательность разумна: сохранить RED/legacy fixtures, ввести discriminator, реализовать узкий job и Pending wiring, затем E6 и reproducible controls, normal guard/CI, independent QA и scoped Code Review. Сохранение legacy1 и явного default2 даёт обратимый dispatch для новых запусков; старые документы не требуют преобразования. Целый новый autopilot framework, отдельная state schema, новые UI screens или повторная кампания C2 здесь избыточны.

## Evidence и проверенные границы

Прочитаны полный README/«Передача агенту VS Code» PR52 на `575f02ddf58a227111ce9b7f6d55919d9c9fc34a`, три actual source specs (структура, version/route/conditions и hashes), действующий plan0.2/Review Contract и diagnosis `report.md` вместе с authoritative `report-v0.2.md`. Уточнение HOW SHA256 `ea8c4d8b2c74bb7eeb6a0db5f177db37c907345dd8fb5ef4a66fdef0c0f9dde5` сверено.

Просмотрены численный probe `prefix-domain-v02.mjs` и его36-case summary, baseline `actual-prefix-v02.mjs`/JSON и E6 DOM evidence. Они подтверждают техническую направленность HOW, но **не являются PASS будущего whole mission2 или browser responsiveness**. Probe finish() синхронно исчерпывает test job; shipping path обязан использовать предусмотренные Pending yields. Slow-leg end-to-end cost остаётся implementation/EF08 gate, не скрытым уже решённым риском.

Собственные действия Reviewer: read-only Git/source audit, hash/структурная сверка supplied inputs и source specs, проверка docs-only delta относительно C2, final HEAD/worktree и `git diff --check`. Новых full guard/browser/replay18/whole-flight runtime прогонов не запускал. Diagnosis55 artifacts/17 source pins и ранее принятые C2 QA/Review/CI указаны как предоставленное PM/Developer evidence; их полный аудит и старый Code Review не повторялись. Live Beads и PR state не изменялись; canonical registration/mapping приняты из supplied task и плана, не названы собственной новой Beads-проверкой.

Findings отсутствуют. Обязательные будущие EF01–EF08 проверки уже включены в план; они не оформляются как дополнительные findings или новый review budget.

## NOT RUN / OUT

Mission2 runtime, новый E6 UI, independent implementation QA/Code Review, current future-HEAD CI и finalize ещё не выполнены этим Plan Review. Нет обещания остановки physically impossible/no-resource checkpoint, unlimited hardware/многосуточной qualification или мгновенного завершения произвольно длинного forecast. Pending остаётся управляемым вычислением, не физическим отказом.

Принятые gates/D40%/mass/C/radiatorA·epsilon/generator calibration/passive service неизменны. Economics, новая repair/failure-exposure система, отдельный autopilot product, detection acceptance, production U2/server/protocol/Pages и AI merge OUT. U2 restart-schema230/480 blocker сохраняется. PLAN_READY разрешает следующий процессный этап; это не runtime acceptance, не PR ready/finalize и не разрешение слияния.

## Binding ADR3.28–3.29

Actual task input — точные bytes файла `/tmp/u2-ermak-flight-plan-review-task.txt`, предоставленного по ссылке, UTF-8 с финальным LF. Короткий dispatch-pointer сохранён отдельно как provenance: содержимое task-файла не выдаётся за буквальное тело dispatch-сообщения. Ни task, ни contract не переформулируются для fingerprint.

External diagnosis связан отдельно SHA256. Reviewed-Paths ниже — scoped Plan Review owners/callers и source52 документы, не новый аудит всего inherited PR package. Для source52 явно указан отдельный source commit; в fingerprint используется реальный path и blob из этого commit. Новые future implementation/test paths пока не существуют и не получают выдуманных blob IDs.

Content-Fingerprint: `cccde77fd5acfb76d3040313b9da0cade9f784c7bb7893f7535f6b173ea360c1`

Envelope-Fingerprint: `6bbf5e3a4677c7eae39e3261af26b539540a85749cd2822d6a7f6261b287b1a8`

Task input: `/tmp/u2-lab-ermak-flight-plan-review/task-input.txt`; 7374 bytes; SHA256 `d9396c823f824bcb59a57d5ca29044f2d8d145f233cbdded8170f5ce054d16d6`.

Dispatch-pointer provenance: `/tmp/u2-lab-ermak-flight-plan-review/dispatch-pointer.txt`; 1454 bytes; SHA256 `29407efb6e24508ff37cf5fc5f100ef1d7d0fa31cb5562ee484552169a457f2e`.

Contract input: `/tmp/u2-lab-ermak-flight-plan-review/contract-input.txt`; 2466 bytes; SHA256 `e1ec9b619d0b0ca4d842c1b0cebc302a9817d1d0b562d6c3aaaa06916af2e498`.

Формула: Content=SHA256(sorted path SP blob LF + exact contract); Envelope=SHA256(base LF head LF + package + contract + supplied task bytes). Separate pointer не подменяет actual supplied task.

Reviewed-Paths: 24; exact package input `/tmp/u2-lab-ermak-flight-plan-review/reviewed-paths.txt`.

| Path | Git blob | Source | Scope |
|---|---|---|---|
| `.agents/PIPELINE_ADR.md` | `31ed5ed3ef1976f87ff7730da4bfdba5a1721e9f` | `27a6dd16` | ADR3.28 fingerprint and3.29 lifecycle excerpt |
| `.agents/RV_ROLE.md` | `6e13e1023c90621172135e206e01fed8bd6b8c28` | `27a6dd16` | PLAN_REVIEW role and verdict requirements |
| `.memory-bank/activeContext.md` | `00bfae2b16d74de64c6612e020dc2f01028a7a76` | `27a6dd16` | current context and mission recovery excerpt |
| `.memory-bank/progress.md` | `f177d8bc8a411d6feb7e5158f067d172c36395cf` | `27a6dd16` | current progress excerpt |
| `docs/INDEX.md` | `ce60472ded1def90150b985edfe55cded223585b` | `27a6dd16` | authority/current owner entries excerpt |
| `docs/plans/2026-10-27-ermak-flight-counter.md` | `5b3c5b645ea3a35b89156a5e9b103672fed4a8c6` | `27a6dd16` | complete HOW0.2 and EF01-EF08 |
| `docs/research/2026-10-27-ermak-radiators/README.md` | `e37cb732f15bef782b0b4f0c40adef5a2f84017c` | `575f02dd` | complete WHAT/handoff |
| `docs/research/2026-10-27-ermak-radiators/ermak-no-radiators.json` | `231b74426b6c2c5380b52abe24634d64e73d0f66` | `575f02dd` | parsed input structure/mission/conditions and SHA256; no new replay |
| `docs/research/2026-10-27-ermak-radiators/ermak-three-passive-1K.json` | `06ca395d2cc484c553af6882308f25a73da813dc` | `575f02dd` | parsed input structure/mission/conditions and SHA256; no new replay |
| `docs/research/2026-10-27-ermak-radiators/ermak-three-passive.json` | `795fda4eef64dfd90fbfe1f62622a066f1c676e1` | `575f02dd` | parsed input structure/mission/conditions and SHA256; no new replay |
| `docs/reviews/2026-10-27-ermak-flight-review-contract.md` | `bd0c4fae5d1fd261de557db6ac6a4f12f09207ab` | `27a6dd16` | complete Review Contract |
| `src/app/fitting-ui/ship-model-lab-view.ts` | `9add8cb00ca7b6420f386a6369df06ab59721072` | `27a6dd16` | E6 overview/live/channel ownership |
| `src/app/fitting-ui/ship-model-results.ts` | `afc3a8e5be849c7115ad64b2e6327a89ec1601a7` | `27a6dd16` | mission factual summary excerpt |
| `src/app/fitting-ui/trace-chart.ts` | `39b365cd574a2da13c0acada09a88cdc41bcc414` | `27a6dd16` | complete shared chart scale owner |
| `src/app/ship-model-workspace.ts` | `dd25b546e3d6ef693537ac25889ed9611afbe5f8` | `27a6dd16` | copy/update/import/draft/replay ownership excerpts |
| `src/io/ship-model-result.ts` | `2efe25127e87d56143c8391ef7a927a0a3693231` | `27a6dd16` | spec/state/checkpoint validation excerpt |
| `src/model/v2/flight.ts` | `cccf715b9d01b4de661ff9c63c85ec082aa0c722` | `27a6dd16` | complete paid momentum/flight primitives |
| `src/model/v3/schema.ts` | `812113ed10f922e507b8eb8f423661a2f74e10cb` | `27a6dd16` | mission version/state and arrival validation excerpts |
| `src/model/v3/types.ts` | `88caa10d2ff6d5f8921bc7c01258bbcdd297cdf8` | `27a6dd16` | mission discriminator/state type excerpt |
| `src/runner/protocol.ts` | `2fbd7ee91fe246255ce44a7170a3d5dfaed9f979` | `27a6dd16` | complete Worker Pending/Step/Pause/Cancel caller |
| `src/runner/ship-model-dispatch.ts` | `c5288254768e312ba1a3b0a48df337b638ef16a9` | `27a6dd16` | complete dispatch and budget propagation |
| `src/runner/ship-model-mission.ts` | `d0a3b4c39cfd1e1bf967f0fedfb39a49f6c82218` | `27a6dd16` | complete current flight/event/service owner |
| `src/runner/ship-model-run.ts` | `a0ab0b2215524ac0fa579787081e3976c2db7a03` | `27a6dd16` | complete RunContext/chunk/commit/restore owner |
| `src/scenarios/ship-model-mission.ts` | `dbeeb6a9d7eee2dbc1dafe25f9a31f821e4a9156` | `27a6dd16` | complete fresh/explicit mission builder |

External diagnosis SHA256 (не Git blobs):

| File | SHA256 |
|---|---|
| `/tmp/u2-lab-navigation-diagnosis-20261027/report.md` | `95c36c73fe39ce4dcc1af26ed32715884ba7ab98df4dd814f56ba2992a7a88de` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/report-v0.2.md` | `ea8c4d8b2c74bb7eeb6a0db5f177db37c907345dd8fb5ef4a66fdef0c0f9dde5` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/manifest.json` | `3ccacb69bd2af4d435922dc01cdd3399cc4a6bef295f71bc044936a291b6fc23` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/prefix-domain-v02.mjs` | `2b12b27cc9846cc4eae7dc706ded009cb9f2d14337088bce6966bb152cb1f91c` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/prefix-domain-v02.json` | `ccfe08e78697b21fa68b84fc5c59a93c3873f61b1fcf96f3afa42fbc1597ed62` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/actual-prefix-v02.mjs` | `1ae2671522a8e3255c8b951699c1e4091e35fd7564f6aa657bd6b05afd84142b` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/actual-prefix-v02.json` | `e7c9e29a6296be87e4e602aed223479efeaa45a51bda39a503e12b67e9d0cb0b` |
| `/tmp/u2-lab-navigation-diagnosis-20261027/E6-ui-evidence.json` | `775496b39fdbe7b2e066306399958880f8b924f5b975e84906b11826aa43c115` |

Final deterministic check: HEAD и plan blob exact,2 docs delta от C2, runtime src/scripts/tests unchanged, git diff --check PASS, worktree clean. Ни код, ни Git index/HEAD/Beads/PR не менялись.
