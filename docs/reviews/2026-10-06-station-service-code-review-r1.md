---
title: "Станционное обслуживание — независимое Code Review r1"
status: sealed
version: "1.0"
date: 2026-10-06
related:
  - docs/plans/2026-10-06-station-service.md
  - docs/reviews/2026-10-06-station-service-developer.md
---

# Scoped Code Review — ulab-558

**Verdict: CHANGES_REQUESTED. BLOCKER=1; ADVISORY=0.**

Mode: CODE_REVIEW. Actual role: Independent Reviewer, session `/root/fitting_adversarial_review`. Model: Codex, семейство GPT-6 согласно среде; точный serving/deployment model ID не сообщён.

Commit: `a625c79c5fbc8cfc706c87d0631fc0204c1689fb`, baseline `3ced4ba1fd69df6f7c03d298d340ee69593113dd`. Root staged runtime/tests самостоятельно сверены с этими candidate blobs. Review Contract — весь `docs/plans/2026-10-06-station-service.md`: 7955B, SHA256 `05f63be7874e759af7b95f01c35de28692aad4922350562b509dd49e136b20aa`; ST01–ST06 и OUT не изменены.

Content-Fingerprint: `bcec8fbfa56f1e605a710557a00317d117faf2159aa6f92f4b22df265201e5c2`. Это 17 exact path/blob pairs плюс literal whole contract, не только строки AC. Явные Git blobs/bytes/SHA и recipe находятся в `2026-10-06-station-service-code-review-r1-binding.json` (SHA256 `064795e491a4ca32cc51e76021580e20913a54265d917f1c96afc3f22be466bc`). Предоставленный source17 fingerprint `dcd2722277380407ef17621ec81897091f1f9b01ed685c8d0eb20a54b3f7c866` независимо совпал.

## Finding

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| CR-ST-B1 | IMPORTANT | [BLOCKER] Explicit OFF принимает полученное станционное топливо | src/io/fitting-result.ts:100–104 | fix now | ST03: OFF только разгружает и ничего не доливает; ST05 / named parser mismatch и атомарность. |

**Supported repro:** взять captured old `spec` из `tests/fitting/fixtures/station-service-old.json`; выполнить его штатный короткий рейс текущим runner до service endpoint. Получен законный absent/fuel-only результат на t=0.5428571428571429s с `receivedFuelKg.diesel=6000.0180351210265`, hydrogen0. В его копии записать `spec.mission.stationReplenish=false`, `state.mission.receivedChargeJ=0`, `metrics.mission.receivedChargeJ=0`; остальные измерения сохранить.

Факт: `parseResultJson` возвращает `ok:true`; `FittingWorkspace.importDocument` также возвращает `ok:true` и заменяет workspace. Fuel balance initial+received−consumed=remaining согласован, однако заявленная политика OFF запрещает весь received fuel. Новый charge guard проверяет policy correspondence лишь для электричества; fuel loop проверяет finite/balance без OFF constraint.

Последствие: импортированный опыт маркируется «только разгрузка», хотя запас пополнен станцией; его автономность, native export и сравнение относятся к другой политике. Это известная логическая несовместимость, не требование пересчитывать произвольные численные снимки.

**Минимальное исправление класса:** при explicit `stationReplenish===false` отклонять положительный received fuel обоих species; сохранить существующие finite/balance guards, true и absent/fuel-only semantics. Отказ обязан предшествовать мутации workspace. Достаточны addressed negatives для diesel/hydrogen и legal OFF/ON/absence positives; полный старый QA не нужен.

Own script/result: `.overgate-runtime/station-service-review-policy-probe.mjs` и `.json`; точные hashes и literal bad document сохранены в binding/raw. Один bounded SSR repro занял0.458s. Первая попытка harness использовала отсутствующий vite-node; исправлен только запуск через существующий Vite SSR, product не менялся.

## Остальная проверенная поверхность

Diff11 runtime owners и5 test/fixture paths просмотрен по объявленным границам. Fresh ON, explicit OFF и legacy absence различаются без нового model tag. Readback использует own undefined; исходный replaySpec/export сохраняет отсутствие, а правка условий задаёт boolean. Validator отказывает nonboolean.

`finishService` пополняет после service physics и реального station endpoint; OFF разгружает без receipt. Положительная Q delta накоплена отдельно от kernel source/consumed; `syncMetrics` сохраняет её. Обновлены charge/SOC/typed fuel last, а `retain` формирует индивидуальные stocks из endpoint state. T/buffer/consumption не обнуляются. Partial H и passive zero-phase recovery не вызывают service refill. State/metrics received charge finite, согласованы и нулевые при отсутствии ON. Active spec, next conditions и frozen A имеют раздельных владельцев. Whole mission comparison показывает отличие политики.

Step diff меняет только validation; numerical body не затронут. Два legacy test helpers явно выбрали прежний absent mode, сохранив исходные assertions. Старый fixture просмотрен как структура/capture и digest, без JSON dump; его spec SHA проверен через JS JSON.stringify. Полный результат golden — внешний Developer/QA evidence.

## Own / inherited / NOT RUN

Подписанный QA прочитан и hash/bytes сверены: `.overgate-runtime/station-service-qa/execution-r1/report.md`, 8019B, SHA256 `8be3d53d0d975d34c6d5f52f7cfdf29aca856ce6b1804e7581a988ad47a31c14`. QA выполнила шесть ST методов:59 API assertions,16 native readbacks и одну LANtouch390 Worker chain, productFAIL0 по этим методам. Её PASS не покрывал новый policy/fuel counterexample. Developer455unit/47browser+1SKIP и build17FP — унаследованные evidence, не мои прогоны.

Own — static diff/context, content binding, fixture spec digest и один описанный counterexample. Повторные unit/browser/normalguard/build/package/HTTP proof, full old52/15AC/H3600/12h, каталог/ТТХ/flight/protocol, old numeric goldens, physical/native/public/main/merge **NOT RUN / OUT**. Новых advisory нет; no-battery Plan advisory остаётся отвергнутым расширением valid input domain.

## Reviewed-Paths

- `docs/plans/2026-10-06-station-service.md`
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

Подпись: Independent Reviewer `/root/fitting_adversarial_review`, 2026-10-06. **SEALED; source freeze RELEASED после readback; IDLE.** Исходники/тесты/contract не менялись Reviewer. PM — единственный publisher.
