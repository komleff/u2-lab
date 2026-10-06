---
title: "CR-TD-B1 — независимое scoped Code Review закрытия"
status: reference
version: "0.1"
date: 2026-10-07
related:
  - docs/product/thermal-derating-diagnostics.md
  - docs/plans/2026-10-07-thermal-diagnostics.md
  - docs/reviews/2026-10-07-thermal-diagnostics-review-contract.md
  - docs/reviews/2026-10-07-thermal-diagnostics-code-review.md
  - docs/reviews/2026-10-07-thermal-diagnostics-qa-legacy-fix.md
---

**Verdict: APPROVED · CR-TD-B1 CLOSED · BLOCKER=0 · ADVISORY=0.**

Mode: CODE_REVIEW, scoped call7/10 после явно разрешённого расширения budget.
Роль: независимый Reviewer `/root/fitting_adversarial_review`.
Model: Codex/GPT-6 family; точный serving/deployment ID средой не сообщается.
Подписано 2026-10-07. Первоначальный CHANGES_REQUESTED не изменён.

Runtime source: `a6c7430b795ca79377e210cfb032c53732d0654e`;
metadata HEAD: `4975facb0d0dd14f2f8203a614f155f41d2493ef`;
before: `48f1fba4686b9069c05db073e84512f39f28c536`.
Whole WHAT/HOW и Review Contract прочитаны/сверены с предыдущей seal: байты неизменны.
Проверены только два changed paths и необходимые участки неизменных callers;
15 прежних runtime/test paths перенесены по независимой Git-blob equality.

**Reviewed-Paths:**

- `src/runner/diagnostics.ts` — `795ec085faa0ee7a578ca8ba31c43e7e35ea2917`.
- `tests/fitting/thermal-diagnostics.test.ts` — `465762f40eb8888f94ee157346ebf772e424f0d0`.
- Необходимый context: `src/runner/run.ts`, `src/model/thermal-gates.ts`,
  `src/model/step.ts`, `src/model/scheduler.ts`; их актуальные blobs равны48f.
- Полные `docs/product/thermal-derating-diagnostics.md`,
  `docs/plans/2026-10-07-thermal-diagnostics.md`,
  `docs/reviews/2026-10-07-thermal-diagnostics-review-contract.md`.

**Content-Fingerprint:** `660fd06971b2f02d1bec5922a14110b428094bf33f8e52902e6555a1f69d9c91`.
Рецепт: sorted `path + NUL + raw SHA256 + LF`, включая три whole contracts.
Явные9 paths/blobs/SHA256,15 carryover rows и raw proof hashes — sealed
`.overgate-runtime/2026-10-07-thermal-diagnostics-code-review-legacy-fix-reviewed-paths.json`,
7643B/SHA256 `36cdb2a70c2786f8920e86098ca82857500577966ef5bdb95db1ac9b5717a961`.

Независимо воспроизведены source manifest FP
`446976869a26ccd1f8effbe9f2ebe6ec881dec160b3a1d330d092d0fa1e271f7`, whole WHAT/HOW
`b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d` и build manifest FP
`352a78bc10557fe76a08ffbda01c50e3bf7cc9943bb353b764146828ed013400`.
Это проверка manifest recipes/content identity, без нового build/package/deployment sweep.

## Закрытие класса

Native producer `thermal-gates.ts:31` создаёт реальный формат `fullID: переход при T K`.
Exact ID извлекается по последнему `: ` (`diagnostics.ts:32`); двоеточие внутри ID
не превращает событие secondary в событие родителя. Дальнейший текст producer
не содержит такого разделителя. Requested Legacy Active loads теперь имеют
индивидуальные descriptors (`:122–125`), поэтому их реальные cold/hot stop/restart
переводятся с исходным native временем, фазой и безопасными границами (`:33–37`).
Номинал0 исключает выдуманный индивидуальный useful output; η-weighted aggregate
сохраняет записанный групповой выход. Aggregate явно не hardware: для него
подавлены native и synthetic protection transitions. Enabled/requested/cargo
фильтры сохраняются; observer вызывается после accepted `stepModel`, не trial.

**Собственная проверка:** два коротких0.02s accepted Legacy контроля: исходный
CR-TD-B1 repro и disabled `laser` + enabled `laser: secondary`. Оба PASS:
ровно одно событие нужного полного ID, исходный native timestamp, restart260–550K,
отсутствие disabled-parent/fake aggregate события. State и telemetry строго
равны прямому kernel; входы не изменены. Raw source/output:
`.overgate-runtime/thermal-review-legacy-fix-probe.mjs` и одноимённый `.json`.
Других runtime-прогонов не выполнял.

Durable delta проверяет cold/hot protection и hysteresis restart относительно
реально сгенерированных kernel edges, времена, полное имя и raw state/telemetry;
содержит two-load/disabled/idle/cargo controls. Original numerical/model/TTX
источники не затронуты: global src/tests delta vs48f составляет только эти два файла.

**Унаследованная execution evidence:** полный sealed QA6 прочитан,6924B/SHA256
`76f753407ac59fc37134c2859bffbe7728933a4944d87c468aa4187a48cf64cb` сверены.
Пять risk rows,26 API+7 native assertions и один genuine LANtouch390 Legacy Worker
Start→Pause→Resume→JSON/CSV PASS принадлежат QA, не новым Reviewer измерениям.
Held/restart controls и неизменность наблюдаемых inputs подтверждают static closure.
TD05/15 неизменных paths, четыре physical/81historical proof и U2 canon остаются
прежней evidence; здесь они не проигрывались заново. Исходные FAIL reports сохранены.

**NOT RUN / OUT:** полный17-path review, шесть TD/18graph campaigns, browser/native
повтор,81/4 numerical reruns, hour/12h/physical-device, guard/build/package/public
повтор, U2 canon/parent guards, Unity/server/wear/H₂fix, base/main/operator merge.
APPROVED относится к закрытию CR-TD-B1 и carryover неизменной поверхности;
не заявляет закрытие внешних gates.

Seal0444/readback завершены. Source freeze проверенных bytes RELEASED для PM
координации; Reviewer **SEALED / IDLE**. PM — единственный publisher.
