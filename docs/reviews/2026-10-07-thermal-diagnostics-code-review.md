---
title: "Температурная диагностика — независимый Code Review"
status: reference
version: "0.1"
date: 2026-10-07
related:
  - docs/product/thermal-derating-diagnostics.md
  - docs/plans/2026-10-07-thermal-diagnostics.md
  - docs/reviews/2026-10-07-thermal-diagnostics-review-contract.md
  - docs/reviews/2026-10-07-thermal-diagnostics-qa-axis-fix.md
---

**Verdict: CHANGES_REQUESTED · BLOCKER=1 · ADVISORY=0.**

Mode: CODE_REVIEW. Роль: независимый Reviewer, `/root/fitting_adversarial_review`.
Model: Codex/GPT-6 family; точный serving/deployment ID средой не сообщается.
Подписано 2026-10-07. Это финальный scoped вызов5/5; последующий fix этим отчётом
не проверен и не одобрен.

Commit Lab: `48f1fba4686b9069c05db073e84512f39f28c536`, base
`0aa458b1e22f4d346178ee9538c736efdd81d86a`. U2: `775ea56309c5036cee091068123140014625874d`,
base `bd31d4a90eb1877c14d60c16db0e6994d8021ade`, отдельный DraftPR842.
Review Contract прочитан полностью; WHAT/HOW привязаны к фактическим working
bytes, включая ранее принятый fixture addendum. Независимо пересчитаны:

- Source-Fingerprint: `e9d402ab2a898d331770952e575640d52040c3faa8e53e41f62ba7cee57f4973`.
- Whole-WHAT/HOW: `b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d`.
- Build manifest: `4626bc3aa39d37673af35f4c512dd9b8ace94166f4c6ff70d5d1d878ed43d5ba`.
- **Content-Fingerprint:** `e69f76d554c17dc9162b48c8ad379fc644a091822a96875b3b6e9e5cd87855ec`.

Reviewed-Paths: все17 changed paths из source binding: `src/app/fitting-ui/{lab-view,telemetry,trace-chart}.ts`,
`src/app/fitting.ts`, `src/io/fitting-csv.ts`, `src/runner/{diagnostics,fitting-run,mission,run}.ts`,
`tests/browser/{mission-medium,thermal-diagnostics}.spec.ts`,
`tests/fitting/{catalog-editions,mission-io,pony-signature-slot,thermal-diagnostics}.test.ts`,
`tests/fitting/physical-result.ts`, `tests/fitting/fixtures/thermal-old-result-digests.json`.
Точные развёрнутые paths, Git blobs/SHA256, три whole Lab contracts, source-authority,
семь необходимых caller sections и десять U2 changed paths перечислены в sealed
`.overgate-runtime/2026-10-07-thermal-diagnostics-code-review-reviewed-paths.json`
(SHA256 `484aa8143573e1bd96051f306542e2f27045cb519706ff8adc12c93957678436`).
Рецепт собственного fingerprint: sorted `repository/path + NUL + raw SHA256 + LF`;
полный Review Contract и WHAT/HOW включены. Source17 и whole-WHAT/HOW считаются
отдельно, в порядке release manifest. Build fingerprint пересчитан по17 manifest
rows; новый build/asset/package sweep не выполнялся.

## Подтверждённая находка

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| CR-TD-B1 | IMPORTANT | [BLOCKER] Legacy теряет реальные protection/restart события запрошенных Active loads | src/runner/diagnostics.ts:31,118–125; src/runner/run.ts:164 | fix now | TD02/TD04, D02/D04: немедленный критический переход и отсутствие потери реальных событий |

`run.ts` удаляет native `thermal-stop/restart` по kind. Переводчик принимает
только событие, чей исходный module ID найден среди requested operations.
`observeLegacy` исключает Active-load из этого списка и создаёт единственную
`mining-group`. Реальный `laser:` не соответствует `mining-group`, поэтому
критическая защита исчезает, хотя kernel её записал и gate активирован.

Собственный поддерживаемый контрпример: Legacy `presets[0]`, radiative100K,
laser gate `{low:225,workLow:250,restartLow:260,workHigh:510,restartHigh:550,high:570}`,
initialT225.0000001K, passive.areaM2=1000000, одна work-фаза duty1,
H=dt=0.02s. `createRun` принимает spec. На том же физическом шаге native kernel
записывает `laser: тепловая остановка при225.000K` в2.5523750082356862e−8s;
finalT224.9216984542996K, laser gate=true. Текущий результат содержит только
partial `Добыча0.0%` и wear notice: отсутствуют сообщение о защите, module ID
лазера и безопасные restart260–550K. Это потеря доступного наблюдения, а не
требование выдумать индивидуальную производительность Legacy.

Минимальное исправление класса: сохранить либо перевести native transitions для
реально запрошенных Legacy loads с исходной атрибуцией и restart границами;
оставить η-weighted group output, фильтрацию disabled/idle и численный kernel.
Нужны durable protection/restart controls для этого маршрута. Raw proof:
`.overgate-runtime/thermal-review-legacy-transition.mjs` и одноимённый `.json`.
Первоначальная harness догадка `law=linear` была отвергнута validator до опыта;
фактическое доказательство использует существующий radiative закон. Других
runtime probes или новых кампаний не проводил.

## Остальная проверка и нормы

Accepted-step hooks, per-run sparse Map, полезный mining denominator, раздельные
capacity/governor load, positive-stock feed explanations, условный existing
stoppingDistance, JSON/CSV и renderer edge branches проверены статически.
30 numerical/catalog/scenario/protocol/IO owner blobs действительно равны base.
Три исходных golden files сохранены. Историческая projection исключает только
события и два event-count поля; прочие state/constraints/metrics/retention остаются.
Четыре saved pre/post physical fingerprints совпали; их проекция дополнительно
исключает textual constraints, что не следует смешивать с81 historical captures.
Это проверка сохранённых evidence/assertions, не новый численный прогон.

Current PRIMARY NORMS U2 проверены по exact775ea:

| Норма и цитата | Классификация |
|---|---|
| ADR-0043:81 — «доступная мощность/производительность плавно снижается по единой линейной формуле» | amended п.12; protection/hysteresis сохранены |
| thermal doctrine:89,91 — «линейное снижение доступной мощности» на горячей и холодной стороне | amended; повышенный износ сохранён |
| ADR-0043:81 / ADR-0068:90–92 — «Approved hot override может продолжать работу» | preserved узкий Military hot carve-out; холодный bypass не добавлен |
| ADR-0043:85 — «при R >= 0 функция по durability гарантирована»; outfitting:237 — «Это не debuff от уменьшения прочности» | preserved R-axis; clarified независимость температурного ограничения |
| defense:77,87 — «это независимая температурная ось», выход за рабочие температуры | clarified/amended источник wear; прежние durability/failure правила сохранены |

ADR0068/spec D01–06 и текущие owner/index amendments согласованы; Lab source-authority
явно маршрутизирует новый behavioral ADR через accepted product contract/PR/exactSHA,
сохраняя frozen численную inventory. U2 fixture delta — только comment+`unset`
унаследованного budget перед sandbox probes; explicit override cases, assertions
и parent hook/limits неизменны. RED/GREEN34/0 и два normalguard PASS — внешняя
Developer/PM evidence, Reviewer guard не запускал.

Последняя QA `qa-axis-fix.md` SHA44293a95… прочитана, точные bytes проверены:
18 styled views и2 nativeLAN starts PASS, пять TD перенесены по unchanged owners.
Она закрывает renderer overlap/clipping; исходные два signed FAIL сохранены.
Она не покрывает найденный Legacy critical-transition контрпример. Guard481unit/
49browser+1SKIP/26cloud — прочитанная внешняя evidence, не собственный запуск.

**NOT RUN / OUT:** новый fullguard/build/browser/матрица,81 fresh replays,
часовые/12h/physical-device/native audit, Unity/server, wear simulation,
H₂ always-on governor fix, новые TTX/кривые/режимы, public/base/main/merge.
Новые правила для solar/tank/пассивных поверхностей не навязываются неизменному
kernel. Style/metadata не превращены в обязательные правки.

Source freeze проверенного48f снят после этой seal для PM координации;
последующие изменения требуют отдельного честного статуса. Reviewer **SEALED / IDLE**.
