---
title: "Равномерная история сигнатур и текущий сигнал — UI4.7"
status: proposed
version: "1.0"
date: 2026-10-09
tags: [pm, signatures, performance, compatibility, verification]
related:
  - docs/product/signatures-observer-v0.1.md
  - docs/guides/signatures-observer.md
---

# Равномерная история сигнатур — план реализации

PM / Codex GPT-6, точный вариант модели не раскрыт. Beads: `ulab-i4g`.
Оператор поручил продолжить обсуждённый вариант 100 интервалов и текущего сигнала.
Повторное продуктовое подтверждение не требуется. Один основной Developer,
существующие QA и Reviewer; дополнительных verifier launches нет, budget 3/5.

Режим CRITICAL по одному named risk: изменение сохранённого представления истории
может повредить открытие/продолжение старого checkpoint. Это не новый протокол игры.
Draft PR18 уже существует; DEV только после независимого PLAN_READY этого плана.

## Цель, текущее состояние, разрыв

На UI4.6/source `84ef169fd47835b4cdf4ce63e4e08fe9e1ce3f04` IR/EM уже стоят
рядом с power/T, имеют общую шкалу 0..H; CS только числовой, стенд defaultON.
Старый retention попарно укрупняет начало истории после 2000 bins: начало теста
теряет временную детализацию, конец сохраняется подробнее. Исправляем только эту
асимметрию и рисование графиков во время расчёта. Для нового опыта: 100 равных
интервалов по неизменному горизонту H, среднее и min–max в каждом. Не хранить все ticks.

Authority: INDEX → product signatures 0.7 и H₂ 0.4; принятая численная модель
`61d44e7ce4be0c06fbb873ca643c6b8e750a81ee` сохраняется. Технические APIs исследованы
Developer в `.overgate-runtime/ulab-i4g-streaming-how-84ef169.md`, SHA256
`453dda1b6d6a696e3b5828adf4b4cc06df4883929952697af318e1204c703710`.
Это pinned HOW input; обязательное поведение и приёмка целиком приведены ниже.

## Архитектура и границы

TypeScript/Vite, существующий Worker и UI workspace. `signatures-runtime-0.2`
сохраняет shape SignatureBucket {startS,endS,values:{mean,min,max}}. H передаётся
из immutable RunSpec; нового saved H/count/latest-frame поля нет. Верхние schema3,
model/dataRevision, settings и protocol envelope остаются прежними.

`createSignatureRuntime(settings,horizonS?)` создаёт 0.2 при переданном H;
без H сохраняет прежний component caller 0.1. `commitSignatureFrames` и
`restoreSignatureRuntime` получают H и dispatch по saved component version.
Продолжение 0.1 использует старый retention даже при переданном H. Старые JSON,
CSV и trace сохраняются буквально; lost legacy detail не реконструируется.
Новый запуск из старого spec создаёт новый опыт 0.2, старый result не переписывается.

Сетка: H*(i/100), i=0..100, последний край буквально H; exact-dedup одинаковых
представимых соседних краёв для pure finite-positive helper даёт ≤100 bins без
нового epsilon/min-dt. Production H>1e−10 даёт все 100 интервалов. Наблюдённый
prefix начинается в 0; последний endS равен реально принятому времени. Частичное
среднее делится на фактическую длительность, будущие bins отсутствуют.

Accepted dense curves аналитически clip по bins через существующие frameIrCurves,
transformCurve, curveMean/curveBounds. Sensor positive/abs применяется ДО усреднения.
Не распределять whole-frame mean. Clipped constants и constant weighted mean
сохранять буквально, включая signed MIN_VALUE; никаких floors/clamps/обнулений.
Сохранять extrema внутри полинома и на общих endpoints без двойной длительности.
Полные sourceStats/phase integrals/peaks, pending/delayed reception, RF 5 ms/ledger,
radar IDs/TTL и physical trial/retry не зависят от retained bins и не меняются.

Reader 0.2 валидирует count≤100, производную сетку и непрерывный наблюдённый prefix
0..timeS≤H, typed finite значения и прежнюю endpoint-relative mean/bounds policy.
0.1 reader/continue остаются прежними. Некорректный импорт отказывает атомарно.
Только новый 0.2 trace CSV добавляет metadata version/representation/H; row schema
u2-signature-trace/1 прежняя, observer allowlist и exports вне изменения.

Во время matched active signature run со status=running весь overview (8 SVG)
не строится. Вместо него две IR/EM cards в существующем #sig-overview, progress и
результат сохраняются. IR берётся в endpoint lastTruth dense curve + прежний max/abs,
EM из lastTruth.em.observedEmW. Подпись: «На конец последнего принятого подшага»
и его время; до first chunk — «нет измерения». Это не mean 36-секундного bin и
не delayed observer readout. Gate — ACK-owned active.status + matching runId,
не r.status (chunk бывает paused). Pause/step ACK возвращают графики, resume ACK —
live cards; завершение/отмена/import без active owner показывают имеющиеся графики.
ManualOFF, иной выбранный вариант, Reference A/compare и раскрываемые каналы не скрываются.

OUT: физика/точность/dt, численные stats/radar/sensitivity, новый pointer UX,
новый TI-контур, классы/движущийся наблюдатель, CS SVG, удаление старых данных,
переделка Worker protocol/Workspace или whole SS/MAX campaign. Legacy telemetry
и полный payload остаются прежними; число bins не является обещанием общей скорости.

## Шаги одному Developer

1. Адресованные RED tests H01–04, затем минимальный bins helper и version dispatch.
   Create `src/signatures/bins.ts`; modify `src/signatures/runtime.ts`.
   Tests: новый bins test, `tests/signatures/runtime-integration.test.ts`.
2. Передать immutable H через `src/runner/fitting-run.ts`, `src/runner/mission.ts`,
   `src/io/fitting-result.ts`; новая CSV metadata в `src/signatures/io.ts`.
   Tests H03–05: checkpoint-validation, io-workspace, worker-integration.
   Existing history/physics/statistics/radar owners не менять.
3. ACK-owned running flag: `src/app/fitting-ui/lab-view.ts` → optional running arg
   `channelsView` в `lab-channels.ts` → existing endpoint helpers в `signatures.ts`.
   Tests H06: existing usability unit/browser suites; focused case допустим.
   Existing grid/plot geometry/nav/markers сохраняются, CSS/Workspace/protocol
   не требуют новой архитектуры. Guide/INDEX и footer UI4.7 синхронизировать.
4. Адресованные tests → normal `.agents/project/verify.sh` → frozen source/build.
   Отчёт включает changed paths, fingerprints, actual tests и bounded history size;
   класс stale version/retention assertions проверить одним поиском до guard retry.
5. Независимая QA по H01–06, один Code Review только changed surface и compatibility
   risk. Блокер: минимальный fix → affected QA/scoped closure. Затем обычный FF push
   PR18 и публикация того же source/build на 4196 и Pages; main/merge только оператор.

## Verification Contract

| AC | Expected / edge / error behavior | Метод и evidence |
|---|---|---|
| H01 | Полный H3600: ровно 100 bins по 36 s; tiny legal H, finite MAX helper без overflow, subnormal helper ≤100. Prefix/early final/last partial — actual duration, future пустой, один frame через несколько bins, exact edge без double time. | Focused grid/clip unit; actual Worker hourly trace count/coverage. |
| H02 | Regular/irregular разбиение тех же curves даёт те же clipped means/min/max в существующей observable-scaled policy; signed contrast, max/abs до mean, внутренние extrema/корни, ±MIN_VALUE constants, cancellation/large finite values. Полные sourceStats/peaks/RF/pending/ledger не теряются. | Analytic oracle и паритет по одним accepted frames, pulse/crossing через boundary; физический dt не увеличивать. |
| H03 | 0.2 mid-bin/exact-edge checkpoint и full/early-final import сохраняют trace, stats, component version; resume эквивалентен непрерывному опыту. | Save/reopen/resume component + actual Worker, без broad MAX campaign. |
| H04 | Unknown version, too many bins, gap/wrong nominal grid/partial end/H mismatch, nonfinite/typed/bounds errors отвергаются атомарно; допустимые signed/tiny сохраняются. | Negative checkpoint/import controls, existing workspace state unchanged. |
| H05 | Old0.1 JSON/trace/CSV literal; old checkpoint resume остаётся old retention. Новый run из old spec —0.2; новое CSV явно указывает representation/H. Observer privacy/exports прежние. | Пinned old fixture bytes; old/new IO и continuation controls. |
| H06 | Running matched signature owner: 0 overview SVG, actual endpoint IR/EM/time, first-chunk отсутствие явно. Pending/matching ACK pause/resume/step; final/cancel/import0.1/0.2/manualOFF/Reference/другой вариант работают. На паузе/final 0..H common x-scale, future пустой и min–max честны.390:1 column,820/1440:2, overflow0; CS numeric без SVG, progress/result/anchor доступны. | Addressed UI/browser lifecycle, responsive snapshots и existing marker/geometry checks. |

Нормальный guard обязателен. Независимые verifier reports: actual role/model,
reviewed/tested paths, exact source/build, own content/envelope fingerprints и
manifest hashes, PASS/FAIL, BLOCKER/ADVISORY и NOT RUN. Ранее пройденные unchanged
SS/UF/GL cases переносить по bytes, не объявлять новым запуском. Plan Review проверяет
whole contract, ownership, migration/compatibility, testability и минимальность.

## Rollback и публикация

Текущий UI4.6/source84ef и gh-pages f722e63182f1f9ee55e46f441c5fbcfa37b9a15c —
рабочая точка возврата. Не менять её frozen dist/evidence; новые assets и index
публикуются отдельно, старые assets сохраняются. При rollback 0.2 файлы сохранять,
не скармливать их старому reader и не конвертировать молча в0.1. Сам0.2 discriminator
обеспечивает явный отказ старого reader. Перед публикацией root сверяет source/build
и evidence; после — actual HTTP asset hashes и short Start/Pause/Step/Resume/export→
reopen smoke. Первая часовая проверка нужна по H01/H03 bounded prefix, не как новый
12h/18MAX benchmark. Физические Android устройства и game/server parity NOT RUN.
