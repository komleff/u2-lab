---
title: "Ship model v0.1 внутри существующей U2 Lab UI4.8"
status: proposed / affected Plan Review follow-up pending
version: "1.1"
date: 2026-10-11
tags: [pm, product, ui, ship-model, telemetry, signatures, compatibility]
related:
  - docs/plans/2026-10-10-ship-model-v0.1-update.md
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/specs/spec_u2_lab_ship_model_v0.1.md
  - docs/plans/2026-10-11-ship-model-entry-ux.md
  - docs/handoffs/2026-10-11-pm-ship-model-handoff.md
---

# Ship model v0.1 внутри существующей U2 Lab UI4.8

> Для исполнения: один основной Developer. Обязательный execution skill —
> `superpowers:subagent-driven-development`. Статус ведётся только в Beads
> `ulab-9aa.18`; номера этапов ниже задают порядок и приёмку, а не заменяют tracker.

**Цель:** встроить уже реализованную ship-model v0.1 в привычный единый интерфейс
U2 Lab, чтобы ГД мог открыть или переоснастить корабль, задать составной опыт,
запустить его, изучить настоящие новые графики/живые параметры/сигнатуры, сравнить
два измерения и сохранить работу без перехода в отдельный урезанный экран.

**Архитектура:** существующая Lab shell, навигация, control dock и низкоуровневые
компоненты trace/time/events остаются основой. `ShipModelWorkspace` владеет
versioned `/4` draft/active/result/checkpoint; узкие model-specific selectors и
панели отображают его реальные данные. Старые модели и readers не приводятся к
новой модели и не меняют поведение; presentation adapter не сериализуется.

**Стек:** TypeScript, DOM/Vite, Web Worker, Vitest, Playwright; без новых runtime
dependencies и без изменения принятых физических законов.

**Спецификация:** `docs/plans/2026-10-10-ship-model-v0.1-update.md` v1.2,
`docs/specs/spec_u2_lab_ship_model_v0.1.md` v0.11, current product owner
`docs/product/ship-fitting-gd-workspace-v4.md` v0.9.

**v1.1:** закрывает blocker `UI4I-PR-B1` первого affected Plan Review: exact
signature statistics берутся из фактических sub-second production frames до
секундного усреднения, а не из уже усреднённого `ShipSignal`.

## 1. Authority и границы решения

Режим — PRODUCT. План v1.2 на `692385dfae5232b6e2ab91d22d7431e144194a1c`
уже получил affected `PLAN_READY`; численное ядро, каталог, persistence и entry
кандидат находятся в stacked PR #22/#23. Этот план не переоткрывает SM-01–14 и
не переносит прежний verdict на новую UI surface. Нужен один affected Plan Review
именно интеграции WF01–15/UI48-01–06 с ship-model v0.1.

Прямое уточнение оператора 2026-10-11 задаёт результат: модернизировать старую
Лабу, а не строить её заново. Отдельный `mountShipModel` экран отклонён. Наличие
исправной старой модели рядом не является сохранением workflow для `/4`.

Принятые thermal/Combat/Masking/durability/signature правила, candidate/canon
граница и version discriminators остаются без изменений. Недостающие численные
ТТХ не становятся каноном из-за зелёных тестов.

Новая модель v0.1 считает полезную работу, энергию, тепло, прочность и сигнатуры,
но не содержит старый physical mission/cargo/trajectory, paid radar/CS/contact.
Эти данные запрещено имитировать V2 solver, snapshot cast или фиктивными SCU.
В общей оболочке `/4` показывает свои фактические `usefulWorkJ`, фазы, запасы и
reference observer; старые модели сохраняют прежние mission/SCU/paid-instrument
панели. Отсутствующие для `/4` показатели подписываются как не рассчитываемые
этой моделью. Реализация flight/delivery/detection остаётся отдельным work item.

## 2. Target → as-built → gap

Target — одна Lab shell: корабль/оснастка → составные условия → Worker/control →
обзорные и подробные графики → общий time/events → live/module diagnostics →
frozen A/B → JSON/CSV/reopen/resume.

As-built на `dedd6af978a104a076101088b22da99d343c3844`:

- `/4` schema/catalog/controller/buffer/surfaces/TI/durability/Masking/signatures
  и checkpoint работают, исторические guards/CI зелёные в их собственном scope;
- entry умеет открыть native/legacy JSON и сделать явный old-fit compile;
- `src/app/fitting.ts` при выборе новой модели делает early return в
  `src/app/ship-model.ts`, поэтому прежние cards/conditions/charts/time/events/
  compare/export workflow для `/4` недоступны;
- `/4` telemetry уже содержит power/heat/T/charge/buffer и signal values, но
  channel set фиксируется по первому tick, а fuel/durability/stops/surface state
  не имеют полного стабильного historical producer;
- `RunResultV3.signatures` хранит только `last`, поэтому UI48 exact mean/max
  нельзя честно восстановить из retained buckets;
- active run не запоминает variant owner, frozen measured baseline отделён от
  обычных результатов недостаточно; standalone UI может положить результат в
  выбранный позже вариант;
- настоящий V3 fit и catalog существуют, но общей validated slot replacement и
  полноценного whole-scenario edit в familiar shell нет.

Gap — не новый дизайн. Нужны model-specific state/selectors/producers внутри
существующей shell и адресное расширение versioned result для точной статистики.

## 3. Scope и неизменяемые границы

IN:

- единая UI4.8 shell/header/navigation/sections/control dock для old и `/4`;
- Спутник, Мир, Stealth reference, old-fit preview/diff/Apply и native `/4` files;
- реальные V3 cards, slot catalog, preview/Apply, builtin/enabled states;
- whole-scenario phases/repeat/requests/mode/environment с atomic validation;
- captured active owner, следующий draft, stale result и отдельный frozen A;
- actual Worker Start/Pause/Step/Resume/Cancel/Restart/Repair;
- overview/detail graphs, общий time selector, legend/group/hide, journal/events;
- live stocks, thermal stages, buffer, per-instance work/durability/stops;
- pre-1s-aggregation saved IR/EM integral/mean/min/max и UI48 A/B/range presentation;
- raw `/4` fit/run/result/checkpoint JSON и model-specific retained CSV;
- desktop 1440, tablet 820, touch 390, literal legacy/new reopen/resume.

OUT:

- новый solver, изменение thermal/energy/durability laws или candidate TTX;
- V3→V2 cast, скрытая миграция, пересчёт истории, fake SCU/flight/contact data;
- U2 server/Unity runtime, detection acceptance, paid radar/contact queue;
- новая универсальная Workspace framework или ещё один standalone UI;
- новые dependencies/guards, public deployment, base/bootstrap acceptance, merge;
- physical second LAN, OS-native picker/touch и playtest balance без фактического
  запуска; они остаются `NOT RUN`.

## 4. File map и интерфейсы

Existing owners:

- `src/app/fitting.ts` — единственная Lab shell, DOM event routing и control dock;
- `src/app/ship-model-workspace.ts` — `/4` variants/draft/active/result/baseline;
- `src/runner/ship-model-run.ts` — authoritative 1 s run, retention и checkpoint;
- `src/io/ship-model-result.ts` — strict versioned result validation;
- `src/signatures/ship-model.ts` — projection одного production step;
- `src/app/fitting-ui/lab-channels.ts`, `trace-chart.ts`, `telemetry.ts` — общий
  structural trace/time/events слой, без знания solver;
- `src/app/fitting-ui/ship-model-results.ts` — только V3 summaries/details.

Новые узкие units:

- `src/app/fitting-ui/ship-model-ship-view.ts` — V3 hull/module cards;
- `src/app/fitting-ui/ship-model-swap-dialog.ts` — V3 catalog preview/Apply;
- `src/app/fitting-ui/ship-model-conditions.ts` — whole-scenario editor/summary;
- `src/app/fitting-ui/ship-model-lab-view.ts` — V3 metrics/live/trace/journal;
- `src/app/fitting-ui/ship-model-channels.ts` — labels/groups/units/selectors;
- `src/runner/ship-model-telemetry.ts` — deterministic stable channel registry
  and state-derived observations; it does not decide physics;
- `src/io/ship-model-csv.ts` — `/4` retained export with explicit units/metadata.

`src/app/ship-model.ts` перестаёт быть владельцем отдельной страницы. Его полезный
entry/control wiring переносится в shell либо сворачивается в bounded controller,
который не рендерит второй header/main/footer и не владеет вторым UX.

## 5. Implementation sequence

### I0 — frozen integration contract

PM публикует этот план, product-owner v0.9 и handoff в Draft PR #23, обновляет
CONTRACT-BEGIN/END и Beads `.18`. Один independent Reviewer проверяет authority,
scope, исполнимость, compatibility и UI acceptance. Runtime DEV начинается
только после `PLAN_READY` на точном doc fingerprint.

### I1 — единая shell и ownership

Файлы: `src/app/fitting.ts`, `src/app/ship-model.ts`,
`src/app/ship-model-workspace.ts`, `tests/ui/ship-model-workspace-review.test.ts`,
`tests/browser/ship-model-entry.spec.ts`, `ship-model-ownership.spec.ts`.

Developer сначала добавляет RED cases, затем:

1. Убирает `/4` early-return в отдельную страницу. Model selection меняет
   model-specific content внутри того же header/nav/sections/dock.
2. Добавляет `ShipModelWorkspace.snapshotForRender()` и captured active owner:
   `{runId, variantId, fitRevision, spec, status}`. `acceptResult` пишет только
   владельцу `variantId`, даже если выбран другой draft.
3. Добавляет immutable `frozen` measured result и `baselineId`; freeze разрешён
   для complete или paused current result, никогда для следующего draft.
4. Сохраняет busy/async/legacy transition guards из entry patch. Paused остаётся
   active; model/fit/import/swap/scenario edits не меняют active snapshot.

Exit: old shell и `/4` доступны без второго full-page render; переключение
variant/navigation во время run не меняет владельца; stale/frozen/active labels
привязаны к фактическим spec/result.

### I2 — корабль, оснастка и составные условия

Файлы: `src/app/ship-model-workspace.ts`, новые `ship-model-ship-view.ts`,
`ship-model-swap-dialog.ts`, `ship-model-conditions.ts`, scoped `fitting.css`,
`tests/ui/ship-model-fitting.test.ts`, `tests/ui/ship-model-scenario.test.ts`,
`tests/browser/ship-model-integration.spec.ts`.

1. Cards читают `ShipFitV3/CandidateCatalogV3/ResolvedShipV3` напрямую: hull,
   slots, builtin, enabled, mass, heat capacity, category `sensors-thermal`,
   thermal gates, durability and origins. V2 presentation values не castятся.
2. `previewReplacement(slotId,itemId)` создаёт cloned fit и запускает
   `validateShipModelFit`/`compileShipModelFit`; `applyReplacement` принимает
   ровно previewed revision atomically. Search/family/size/sort и refusal reason
   повторяют familiar catalog workflow. Builtin не снимается.
3. `replaceScenario({name,repeat,phases,durationSeconds})` валидирует новый whole
   `RunSpecV3` до assign. UI редактирует список фаз, action, целые seconds,
   optional mode/environment и requests 0…1 только существующих instances;
   add/duplicate/remove сохраняют unique phase IDs. Изменение fit, удаляющее
   request owner, получает явный refusal/preview, а не молчаливое удаление.
4. Simple fresh task остаётся коротким preset редактора. Imported complex task
   больше не readonly: он проходит тот же whole-scenario edit; unsupported raw
   fields сохраняются или изменение отклоняется целиком.

Exit: в familiar «Оснастка» новый модуль можно preview/Apply; в «Условия» строится
как минимум work→recovery→repeat и per-phase mode/environment; actual Worker
получает literal validated scenario.

### I3 — стабильная telemetry и настоящие графики/live/journal

Файлы: новый `src/runner/ship-model-telemetry.ts`,
`src/runner/ship-model-run.ts`, существующие `lab-channels.ts`, `trace-chart.ts`,
`telemetry.ts`, новые `ship-model-channels.ts`, `ship-model-lab-view.ts`,
`tests/model-v3/telemetry.test.ts`, `tests/ui/ship-model-telemetry.test.ts`,
`tests/browser/ship-model-integration.spec.ts`.

1. `shipModelChannelNames(spec)` детерминированно объявляет полный channel set до
   первого tick. `observeShipModelState(spec,state,stepTelemetry,signal)` выдаёт
   finite value для каждого имени на каждом tick.
2. Существующие power/heat/T/charge/buffer/signal channels сохраняются. Добавляются
   реальные `fuelKg:*`, `durabilityR:*`, `cooldownSeconds:*`,
   `thermalStopped:*`, `durabilityStopped:*`, `surfaceOpen:*`, active TI marker
   и недостающие per-instance values. Off/inactive различается marker channel;
   `0 K` не показывается как реальная hot-side temperature.
3. Phase/mode transitions становятся journal events; latest phase/mode берутся
   из state/spec. Они не кодируются фиктивной непрерывной физической величиной.
4. Общие trace/time/events helpers принимают structural trace contract
   `{channels,buckets,events,retention}`. V2 behavior и DOM IDs остаются прежними.
   V3 selectors задают labels/groups/units и selected-bucket mean/min/max/count.
5. Live panels показывают latest actual state: заряд/топливо/T/buffer debt,
   current cascade, surfaces, first constraint, per-instance work/R/stops/cooldown.

Exit: power/T/IR/EM и новые state channels относятся к одному выбранному времени;
legend/table/chart/journal согласованы; long retention остаётся bounded и resume
даёт тот же trace, что uninterrupted run.

### I4 — exact signature statistics, persistence и CSV

Файлы: `src/signatures/ship-model.ts`, `src/runner/ship-model-run.ts`,
`src/io/ship-model-result.ts`, новый `src/io/ship-model-csv.ts`,
`tests/signatures/ship-model-v0.1.test.ts`,
`tests/model-v3/power-thermal-ledger.test.ts`, `tests/model-v3/persistence.test.ts`,
`tests/model-v3/ship-model-csv.test.ts`.

1. Fresh runs используют `ship-signatures/2`: совместимый секундный `last` плюс
   versioned statistics для actual `receiverIrW` и `observedEmW`. Statistics
   accumulator получает каждый frozen `step.frames` production interval до
   `observeShipModelStep` и retained aggregation. Для каждого frame он применяет
   тот же observer aspect/IR profile, а EM берёт как фактические
   `escapedEmW + intentionalRfW`; хранит фактический `dt`, duration-weighted
   integral/mean и min/max production values, включая границы phases. Ни
   усреднённый 1 s `ShipSignal`, ни retained bins не являются источником extrema.
2. Checkpoint сохраняет accumulator вместе с однозначной завершённой границей
   production interval. Restore продолжает со следующего frame без повторного
   учёта последнего interval и без reroll. Full run и pause/export/import/resume
   дают одинаковые duration/integral/mean/min/max.
3. Reader принимает старый `ship-signatures/1` буквально. Старый paused result
   продолжает v1 без синтетического прошлого; exact stats для него остаются
   unavailable и UI показывает «—». Никакого in-place upgrade/recompute.
4. `/4` CSV экспортирует retained intervals, channel, unit, mean/min/max/count и
   schema/model/catalog/run metadata. JSON остаётся raw validated result.
5. RED/green production fixture дробит одну секунду на ненулевой сигнал до
   внутренней границы (включая CP-04 depletion около `0.45 s`) и иной сигнал после:
   отдельно проверяются duration-weighted integral/mean и настоящий frame maximum.
   Тот же результат сохраняется после retention merge и checkpoint continuation;
   постоянный сигнал не считается достаточной проверкой extrema.

Exit: UI48 mean/max воспроизводятся из сохранённого accumulator независимо от
retention merge; malformed/mixed versions отклоняются atomically; old v1 literal
round-trip и resume сохраняются.

### I5 — результат, frozen A/B и model-specific честность

Файлы: `src/app/fitting-ui/ship-model-results.ts`,
`ship-model-lab-view.ts`, `src/app/fitting.ts`, tests UI/browser.

1. Overview показывает actual useful work/time, stocks, first constraint,
   recovery/buffer reachability, stops/repair и causal costs модулей.
2. Frozen A и выбранный measured B показывают identity/revision/interval/stale,
   только изменившиеся conditions и отдельные passports/details.
3. IR/EM comparison использует saved frame-level stats: duration-weighted mean и
   production max power, reference range by mean/max under each result's
   observer/profile, A/B/Δ. Missing v1 measurement — «—», measured zero — `0`;
   различие условий не называется выигрышем/контактом.
4. Old mission/SCU/paid-radar panels остаются byte/behavior-equivalent для old
   models. В `/4` вместо них показываются только actual work/reference-observer
   данные и явная граница модели.

Exit: ГД получает новые модули и настоящие новые traces в привычной Лабе; ни один
видимый показатель не принадлежит другому solver или следующему draft.

### I6 — docs, deterministic gate и preview

Файлы: `docs/user/ship-fitting.md`, `docs/INDEX.md`, focused tests/reports.

Developer обновляет инструкцию фактическими controls и выполняет focused tests,
typecheck/build, browser 1440/820/390 и обычный `.agents/project/verify.sh` без
skip/force/trust overrides. После frozen DEV candidate PM запускает independent
QA по UI4I-01–12 и один scoped Code Review. Blocker возвращается тому же Developer;
affected checks/re-review продолжаются в уже запущенных verifier sessions.

Только после QA PASS и scoped APPROVED проверенный dist может заменить preview4197
assets-first/index-last с сохранением rollback record. Public Pages не обновляется
этим планом. Preview не является merge/final acceptance.

## 6. Verification Contract

| AC | Expected / edge / error behavior | Method |
|---|---|---|
| UI4I-01 | `/4` работает внутри одного header/nav/sections/control dock UI4.8; отдельного standalone page/duplicate controls нет. Old default не изменён | DOM/source assertion + browser fresh old/new navigation |
| UI4I-02 | Спутник/Мир/Stealth, `/4` fit/run/result и old JSON открываются по versioned route; old Sputnik compile только preview/diff/explicit Apply; invalid/future/cancel/stale async сохраняют work | Unit atomic snapshots + real file-input browser chains |
| UI4I-03 | V3 cards показывают настоящий roster/categories/origins; compatible slot preview/Apply меняет cloned fit, incompatible отказ объяснён; builtin/active run immutable | Workspace/catalog tests + browser swap chain |
| UI4I-04 | Whole phases/repeat/requests/mode/environment редактируются atomically; complex import сохраняется; неизвестный instance, duplicate id, fractional/out-of-range/нецелая duration отвергаются без partial edit | Scenario unit table + actual Worker compound chain |
| UI4I-05 | Active owner captured; draft variant/navigation не перенаправляет result/control. Paused locked. Frozen A — отдельный immutable measured snapshot; stale result остаётся доступен | Ownership unit/browser race cases |
| UI4I-06 | Stable actual channels существуют с первого tick; selected time синхронизирует charts/table/journal, mean/min/max/count и units. Conditional TI не теряется и off не выдаётся за 0 K | Producer/retention tests + browser time/event chain |
| UI4I-07 | Live/latest показывает charge/fuel/T/buffer/cascade/surfaces/work/R/stops/cooldown из `/4` state/telemetry; historical values не размножают latest snapshot | Selector tests + pause/step/live browser assertions |
| UI4I-08 | Saved pre-1s-aggregation IR/EM stats дают duration-weighted mean, настоящий production-frame max и ranges A/B. Intra-second transition (CP-04 depletion) доказывает, что max не равен max секундных средних; unequal observer/profile/T/mode/task/interval visibly limits comparison; zero ≠ missing; no earned-contact claim | Frame statistics unit + comparison DOM tests |
| UI4I-09 | Fresh v2-signature checkpoint stats uninterrupted == pause/export/import/resume по duration/integral/mean/min/max без повторного frame; те же extrema переживают retention merge. Old signature-v1 result остаётся literal/resumable с stats «—»; malformed mixed version rejected atomically | Intra-second persistence/IO fixtures + actual Worker resume |
| UI4I-10 | JSON export raw/literal; `/4` CSV has model metadata/units/buckets. Reopen preserves fit/scenario/result/RNG/active continuation; no presentation adapter serialized | JSON digest and CSV round-trip tests |
| UI4I-11 | 1440/820/390: open→swap→compound conditions→start→time/events/live→freeze A→B→compare→export accessible; page overflow 0, primary targets ≥44 px, no console errors | Playwright whole-user chains + screenshots |
| UI4I-12 | Old `/1|2|3`, catalog0.2.x, mission/signature UI and stored fixtures unchanged; no fake SCU/flight/contact; normal project verify/type/build/browser PASS | Diff owner list, literal regressions, `.agents/project/verify.sh` |

## 7. Review focus и named risks

Plan Review проверяет: отсутствие второго UI, bounded scope, exact ownership,
whole-scenario feasibility, dual signature reader, old-model compatibility и
достаточность whole-user AC.

QA/Code Review адресуют классы риска:

- result попадает в выбранный после старта variant, а не captured owner;
- fit/scenario edit частично применяется после validation failure или async race;
- conditional channel отсутствует, потому что его не было в первом tick;
- inactive TI отображается как физические `0 K`;
- 1 s или retained mean выдаётся за exact production-frame signal maximum;
- old `ship-signatures/1` незаметно upgraded/recomputed;
- общий time selector рассинхронизирует chart/table/journal;
- familiar shell показывает V2-derived SCU/contact как `/4` measurement;
- slot replacement удаляет request owner или меняет active immutable spec;
- legacy behavior меняется из-за structural trace generalization.

Blocker — только достижимое нарушение этих AC/invariants. Advisory не расширяет
поставку автоматически.

## 8. Budget, rollback и completion gates

Для PR #23 уже использовано 2/5 verifier launches: прежний Plan Review и
остановленная QA. Оставшиеся launches: affected Plan Review этого плана, QA whole
candidate и один scoped Code Review. Fix-turns и affected follow-up внутри уже
запущенной verifier session не являются новым launch. При реальном exhaustion PR
остаётся merge-ineligible до решения оператора; recovery swarm запрещён.

Rollback: вернуть UI selection на прежний old-model shell и отменить integration
diff. Новые `/4` JSON остаются unsupported/newer, но не конвертируются назад.
Старые fit/result bytes, readers, releases 4196/4189/Pages и archived assets не
удаляются. Preview4197 имеет отдельную запись предыдущего PID/dist.

Completion requires: exact affected `PLAN_READY`; один Developer; frozen candidate
и normal verify PASS; independent QA UI4I-01–12 PASS; scoped Code Review APPROVED;
content fingerprint/current HEAD binding; preview smoke с явными NOT RUN limits;
FINAL ACCEPTANCE passport. Base/bootstrap/U2 server parity/operator merge остаются
отдельными gates. ИИ не merge/auto-merge и не обновляет main/master.
