# Станционное обслуживание — Developer evidence

Actual role: единственный Developer. Model: Codex, GPT-6 family; точный provider identifier не раскрыт средой. Status: **DONE_WITH_CONCERNS / IDLE**. Это implementation handoff, не приёмка и не разрешение merge.

Исходная ветка `feat/station-service-dev`, baseline `3ced4ba1fd69df6f7c03d298d340ee69593113dd`; чистый итоговый HEAD `a625c79c5fbc8cfc706c87d0631fc0204c1689fb`. Whole accepted plan `docs/plans/2026-10-06-station-service.md`: 7955 bytes, SHA-256 `05f63be7874e759af7b95f01c35de28692aad4922350562b509dd49e136b20aa`. Independent PLAN_READY получен до кода; WHAT и whole plan не менялись.

Реализована галочка «Заправлять и заряжать»: свежие миссии явно ON; OFF только разгружает. Только окончание реального service пополняет установленные топливные контуры и суммарный Q. Полученная электроэнергия — отдельный накопленный `receivedChargeJ` в state/metrics/result и GJ в UI; kernel generation/consumed ledger остаётся самостоятельным. Температура, C, буферы и расход не сбрасываются. Последняя telemetry батареи/SOC/контуров показывает endpoint stocks.

Старые mission snapshots без flag остаются fuel-only, без зарядки и без добавления новых ключей при replay/export. Внутренний condition readback использует собственный undefined как признак этого отсутствия; первое редактирование условий записывает явное OFF согласно отображаемой галочке. Активный spec, следующий черновик и frozen A независимы. ST-P-A1: валидные batteryless fits не расширены; соответствующий отрицательный контроль получает прежний отказ validator.

| AC | Собственное доказательство |
|---|---|
| ST01 | Fresh ON/OFF, boolean negatives; реальный Worker/native touch390, started spec и оба export, next OFF не меняет active/A. |
| ST02 | Независимый `stepV2` oracle физики service до endpoint; actual charge/fuel delta, full stocks, индивидуальная battery telemetry. |
| ST03 | OFF cargo unload/cycle без станции Q/fuel; full Q и отсутствующий H₂-контур дают нулевой refill, batteryless refusal. |
| ST04 | Horizon внутри service без пополнения; repeated zero-phase recovery продвигает физическое время без фиктивного service/shore charge. Старый inbound guard также PASS. |
| ST05 | Pre-code native spec/result oracle; exact replay/import/export; malformed flag/received charge и mismatch отклоняются атомарно. |
| ST06 | Три коротких actual service: cumulative receivedCharge больше одной ёмкости; sourceEnergyJ равен сумме реальных kernel inputs, без shore charge. Policy difference объясняет несопоставимость; GJ видимы; A неизменен. |

**RED → GREEN.** До production delta 8 corrected station cases FAIL; raw RED и первые harness correction сохранены. Capture writer исправлен на typed-array JSON encoding до кода, horizon выбран внутри actual service; это не product fixes. Первые GREEN уточнили независимый endpoint oracle для положительного floating остатка и полный список actual kernel inputs.

Первый обязательный guard: 452 PASS / 3 FAIL из 455 unit. Старые два fixture helpers теперь явно передают absent policy (`stationReplenish: undefined`), сохраняя прежние fuel-only assertions. Новое fresh ON законно делало Q=10GJ, тогда как эти проверки требовали old continued/zero Q. Runtime для этого FAIL не менялся. Адресные старые и новые контроли после fixture correction: **42/42 PASS**.

**Финальные команды и результаты:** `npx vitest run tests/fitting/station-service.test.ts` — 8 PASS; `npx vitest run tests/fitting/mission-cycle.test.ts tests/fitting/mission-review-blockers.test.ts tests/fitting/station-service.test.ts` — 42 PASS; `npx playwright test tests/browser/station-service.spec.ts` — 1 PASS (true mobile390, real Worker, native taps/files). Normal pre-bash commit guard, выполняющий `.agents/project/verify.sh`, exit0: **455 unit / 52 files; 47 browser PASS + 1 screenshot SKIP; typecheck/build/reference/bootstrap/cloud26/shell checks PASS**. После него обычный commit без override; tracked tree clean.

До кода на baseline сохранены SHA-256 native spec `a296026c77cc907950c48445f8cac7ef9d3127cb71c4babc368826d8a77fa222` и native result `f0931be5f1cb584fa7a73d8a4129551ca289d6a423db9ecc86c66e0a5c56a8d3`; новый runtime воспроизводит их точно. Numerical body `src/model/v2/step.ts`, от `export function initialStateV2` до EOF, byte-equal baseline, SHA-256 `d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08`. Step изменён только в validation. Catalog, flight, timed-model алгоритмы и protocol не затронуты; это не утверждение равенства всех compiled chunk bytes.

Изменены 11 runtime owners и 5 test/fixture paths (два legacy helpers + три новых):

- `src/app/fitting-ui/conditions.ts`
- `src/app/fitting-ui/lab-view.ts`
- `src/app/fitting-ui/result-context.ts`
- `src/app/fitting-workspace.ts`
- `src/app/fitting.ts`
- `src/io/fitting-result.ts`
- `src/model/v2/step.ts`
- `src/model/v2/types.ts`
- `src/runner/mining-metrics.ts`
- `src/runner/mission.ts`
- `src/scenarios/mission.ts`
- `tests/browser/station-service.spec.ts`
- `tests/fitting/fixtures/station-service-old.json`
- `tests/fitting/mission-cycle.test.ts`
- `tests/fitting/mission-review-blockers.test.ts`
- `tests/fitting/station-service.test.ts`

Immutable candidate: `.overgate-runtime/station-service-v2.2-candidate/extracted/dist`; 17 файлов. `source-manifest.json` содержит 16 changed rows + whole plan, raw SHA-256/bytes и committed Git blob identities; source fingerprint `dcd2722277380407ef17621ec81897091f1f9b01ed685c8d0eb20a54b3f7c866`. Recipe: sorted UTF-8 path, NUL, lowercase Git blob SHA-1, LF; SHA-256 всей конкатенации. `build-manifest.json`: sorted relative asset path, NUL, raw-file SHA-256, LF; build fingerprint `e5cd36e11972cbacdcbd9fbb7ad05849cc3613643ba16f1a839186d8e7dd8747`. Все candidate files 0444. ZIP не создавался; full155 proof не повторялся.

Raw evidence: `.overgate-runtime/station-service-evidence/`; manifest связывает corrected RED, legacy-control GREEN, native GREEN, оба mandatory guard logs, type/build и исходный pre-code native capture. Рецепт упаковки `package.py` и итоговые bytes/hash находятся рядом. Старые mission artifacts/reports и публичные серверы не изменены.

Ограничения: actual extracted LAN/native QA, физический планшет, native adapter activation, public deploy/merge — **NOT RUN этим Developer**. Headless Chromium true-mobile workflow не доказывает физическое устройство. Screenshot test SKIP сохранён. Дополнительные H3600/12h/matrix/native campaigns не запускались. Source/artifact frozen для подготовленной QA и scoped Review.
