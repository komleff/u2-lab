---
title: "Обновление U2 Lab до модели корабля PR #19"
status: proposed / PRODUCT GAP open / affected Plan Review pending
version: "1.1"
date: 2026-10-10
tags: [pm, ship-model, thermal, energy, durability, signatures, compatibility]
related:
  - docs/gdd/gdd_ship_energy_thermal_model_v0.1.md
  - docs/specs/spec_u2_lab_ship_model_v0.1.md
  - docs/handoffs/2026-10-10-u2-gdd-ship-specs-update-list.md
  - docs/reviews/review_ship_model_adversarial_2026_10_10.md
  - docs/research/2026-10-10-ship-model-checks.json
---

# Обновление U2 Lab до модели корабля PR #19 — план реализации

Для исполнения: режим PRODUCT. После закрытия PRODUCT GAP в Draft PR этот план проходит
независимый affected Plan Review и получает новый `PLAN_READY`; затем каждый work item выполняет один основной
Developer, после чего независимые QA и scoped Code Review проверяют указанные AC.
Beads остаётся единственным статусом работ; шаги ниже задают порядок и приёмку, а не
заменяют tracker. Merge выполняет оператор.

Goal: перенести принятую в PR #19 модель энергии, тепла, прочности и сигнатур в
существующий U2 Lab без молчаливого изменения старых опытов и подготовить общий
дискретный контракт для будущего server parity.

Architecture: новая явная версия расчёта поверх существующего TypeScript/Vite
стенда; старые модели и каталоги остаются literal-compatible. Расчёт получает один
автоматический 1-секундный thermal-control profile, раздельные владельцы поверхностей,
полное сохраняемое состояние и фактические IR/EM-каналы. Быстрая физика полёта и
исторические результаты не пересчитываются.

Spec: `docs/specs/spec_u2_lab_ship_model_v0.1.md` v0.11, SM-01–14; физический
owner — `docs/gdd/gdd_ship_energy_thermal_model_v0.1.md` v0.11. Analytical evidence
имеет 16 PASS, но runtime, CI, UI, server parity, performance, persistence и полный
каталог пока **NOT RUN**.

## 1. Authority и принятое разрешение расхождений

Пакет PR #19 зафиксирован merge commit
`34b44d5fdc041d2bcd8949fadbb9e38f994b1cb9`; документальный parent —
`698845d6e3e09433ae21cd4b345d84263d38b182`. Runtime baseline для сравнения —
`01b15fdbb31464df84e9c3c6297383f90bf43a5b` из ветки PR #18. U2 owners проверены по `docs/INDEX.md` и
`docs/architecture/ADR-INDEX.md`; оператор подтвердил U2 main `c780ffaf...`, где относительно
источника PR #19 `2171a20a...` изменены только два roadmap-файла.

Прямое решение оператора в этой задаче: **данные GPT-агента из PR #19 являются
целевым authority при конфликте с текущим U2 Lab или действующим текстом U2,
кроме последующих явных решений оператора**. К таким решениям уже относятся граница
прочности и scope Military thermal exception: `Military hull + Combat`, но для всех
установленных модулей независимо от их класса; на Masking это решение не распространяется.
Для прочности оператор подтвердил ADR-0066 v1.3: точный `R=0` гарантирован, первый
отказ наступает при переходе в `R<0`. Для теплового исключения действуют только
принятые рамки U2, описанные в PG-SM-THERMAL-01 ниже. Числа, которые сам PR #19
помечает как кандидаты, не становятся каноном от этого решения.

| Расхождение | Принято для реализации | Действие синхронизации |
|---|---|---|
| Прочность: PR #19 ошибочно требует первую остановку при достижении нуля; U2 ADR-0066 гарантирует работу при `R=0` | По прямому уточнению оператора сохранить U2: однократный обязательный отказ при первом переходе `R>=0 -> R<0`, затем кулдаун и вероятностный аварийный запуск | Исправить Lab GDD/spec/тестовые границы; ADR-0066 и зависимые нормы U2 не менять |
| Общий TI в U2 использует установленные радиаторы; PR #19 добавляет собственный пассивный радиатор корпуса | Общий TI получает собственный passive radiator корпуса, встроенные/дополнительные passive и только открытые active; панели pump-radiator навсегда принадлежат своему изделию | Обновить U2 hot-environment TI owner, thermal palette и config projection; базовая обшивка остаётся при `T_ship` |
| U2 thermal field в текущем owner выражен через среду; PR #19 разделяет фон излучения и поле `hA(T-T_field)` | Хранить и считать два независимых signed потока; для hot side TI использовать `T_hot`, для прямой поверхности — `T_ship` | Amendment ADR-0036/runtime field DTO и профильным thermal owners; запрет двойного представления того же источника |
| Lab сейчас интегрирует с `stepSeconds=.01/.1`; PR #19 задаёт общий thermal profile 1 s | Новая модель принимает thermal-control решения только на границе 1 s; внутри секунды допускается лишь event clipping запасов/критической границы без раннего включения следующей ступени | Быстрый shared flight loop не меняется; для U2 выделяется 1 Hz authoritative thermal-control слой |
| Lab имеет частичную автоматику, но не полные каскады | Использовать каскады и очередь прогрева PR #19; игрок выбирает сборку, режим и действие, а не пороги/законы | U2 scheduler/governor owner синхронизируется отдельным doc work item |
| U2 governor ограничивает Combat hot override классом Military module | По прямому уточнению оператора Military hull в Combat позволяет использовать все установленные модули независимо от их класса; на hot work→critical участке они сохраняют полную мощность | Исправить U2 governor owner; поведение на/за hot critical boundary, cold side и restart остаются в PG-SM-THERMAL-01 |
| В старых предложениях Masking ограничивал тягу | Дополнительного потолка тяги нет; действуют обычные power/thermal/workability limits, фактический манёвр увеличивает расход и сигнатуры, радиаторы не открываются | Явно закрепить в U2 mode/HUD owner без изменения flight physics |
| U2 сохраняет earned range и server authority; Lab показывает расчётные дальности | Сохранить earned range. В Lab — только одинаковый reference observer и расчётный ориентир; HUD не узнаёт факта чужого обнаружения | Signature/HUD docs уточнить без free range/hidden-position shortcut |
| Lab category id/label — `signature` / «Контроль сигнатур» | В новом каталоге отображать «Сенсоры и тепло»; старый serialized id читать как compatibility alias | Новый id вводить только в versioned catalog/schema, старые fits не переписывать |

U2 doc sync для остальных расхождений не даёт права менять runtime U2 в рамках
этого Lab PR. Он является обязательным входом для отдельного server work item
и финальной проверки SM-14; граница прочности уже определена ADR-0066 и не
требует U2 amendment.

### PRODUCT GAP PG-SM-THERMAL-01 — критическая защита особых режимов

Question: какая точная thermal protection matrix действует для сочетания режима,
класса корпуса и класса модуля на горячей и холодной стороне, включая критическую
остановку и повторный запуск?

Why unresolved: ADR-0068 сохраняет только прежний Military hot override, а прежний
текст U2 governor ограничивал его сочетанием `Military hull + Combat + Military module`.
Оператор уточнил scope до `Military hull + Combat + any installed module` с полной
мощностью на hot work→critical участке, но ещё не определил поведение на/за hot critical
boundary, cold-side behavior и restart. Предложение Lab дополнительно
распространяет отсутствие обычного снижения мощности на Masking. Handoff v0.4.1 прямо
оставляет критическую защиту и повторный запуск на уточнение.

| Mode | Hull class | Module class | Hot work→critical | Cold work→critical | Critical stop | Restart | Статус D0 |
|---|---|---|---|---|---|---|---|
| Обычный, без special override | Любой | Любой | Линейное снижение + accelerated wear | Линейное снижение + accelerated wear | Обязательная thermal stop | После возврата в owner restart-band | Принято ADR-0068/ADR-0043 |
| Combat | Military | Любой установленный | Полная мощность от `T_work_high` до собственного `T_crit_high`, независимо от класса модуля | Cold bypass не принят | Поведение на/за `T_crit_high` и точная stop boundary требуют решения | Связь thermal hysteresis с durability/restart требует решения | Hot derate принят оператором; critical/restart требуют решения |
| Combat | non-Military | Любой | Обычная hot protection | Обычная cold protection | Обязательная stop по собственному `T_crit` | По собственному restart-band | Текущий U2; D0 подтверждает без расширения |
| Masking | Stealth / Masking-capable | Military | Special hot bypass не принят | Special cold bypass не принят | Обычная safety protection остаётся baseline, но special-mode boundary должна быть явно подтверждена | Требуется явное решение | **Решение оператора требуется** |
| Masking | Stealth / Masking-capable | non-Military | Special hot bypass не принят | Special cold bypass не принят | Обычная safety protection остаётся baseline, но special-mode boundary должна быть явно подтверждена | Требуется явное решение | **Решение оператора требуется** |

Affected behavior: полезная мощность, thermal wear, момент остановки, повторный запуск,
видимые причины ограничения и Lab↔server parity. Implementation не может выбрать
широкий override как technical default. До утверждения таблицы T2 не реализует
special-mode bypass и affected Plan Review не запускается.

## 2. Target → as-built → gap

Target: существующий workflow «корабль → сборка → работа → зона → режим → опыт → A/B»
с одним физически согласованным циклом энергии/тепла, автоматическими каскадами,
полным восстановлением теплового долга, прочностью, IR/EM и воспроизводимым состоянием.

As-built:

- `src/model/v2/physics.ts` уже замыкает фактические energy/fuel/heat ledgers,
  signed radiation, H₂ cooling, active radiator и базовый TI, но TI использует
  собственную площадь, buffer не хранит температурную метку, а полной mode cascade нет;
- `src/model/v2/types.ts` поддерживает `u2-lab/2|3` и модели ledger/mission/signature;
  checkpoint не содержит durability, Masking entry temperature, новых latches и RNG;
- catalog 0.2.x имеет одну hull radiation area, категории `propulsion/power/payload/signature`,
  неполные четыре температурных предела и нет принятой модели печей/поверхностей;
- signatures уже считают фактические IR/EM stages и отдельного observer, но не весь
  новый состав поверхностей, shielding trade-off, cold silhouette и режим Masking;
- UI4.8 уже даёт карточки, общий timeline, A/B и экспорт, поэтому новый универсальный
  editor, новая платформа исследований и встроенный AI-сервис не нужны.

Gap: versioned state/schema/catalog, полный 1 s controller, heating/cooling modes,
surface ownership и TI solver, temperature-marked buffer debt, durability/restart/RNG,
режим Masking, новые signature/sensor связи, понятный результат полного цикла,
опорные сборки/кандидаты и Lab↔server conformance vectors.

## 3. Scope и неизменяемые границы

IN:

- SM-01–14 и CP-01–05;
- Спутник S, Мир M и одна отдельная reference stealth build;
- электричество, топливо, фактическая работа и тепло; четыре температурных предела;
- modes `Efficient`, `Combat`, `Masking`, автоматические cooling/heating cascades;
- buffer capacity/power/debt/minimum capture-temperature marker;
- body, hull passive radiator, fitted radiators, pump-radiator и common TI;
- signed radiative background и optional thermal field;
- guaranteed durability at exact zero, first crossing below zero, emergency operation,
  cooldown и deterministic RNG;
- actual IR/EM, shielding heat/own-antenna cost, reference observer;
- immutable save/reopen/resume, A/B и объяснение первого ограничения/восстановления.

OUT:

- gameplay runtime/server implementation U2, Unity UI и network protocol;
- изменение fast flight/relativistic physics или расчёт kinetic energy в resource ledger;
- ручной wiring, priorities, thresholds, physics-law editor или AI inside Lab;
- полный перебор каталога, economy/price balance, доказанная вероятность обнаружения;
- автоматическое утверждение candidate TTX, 3D-derived radiator area или migration старых results;
- отдельные температуры каждого обычного модуля/панели и новая ship-wide electrical axis.

## 4. Versioning и rollback boundary

Новая ветка расчёта получает отдельные discriminators:

- `schemaVersion: "u2-lab/4"`;
- `modelVersion: "ship-fitting-ship-model-0.1"`;
- `catalogVersion: "ship-fitting-0.3.0"`.

Существующие `u2-lab/1|2|3`, model 0.2.x/signature 0.1 и catalog 0.2.x остаются
неизменными читателями и исполнителями. Новый reader открывает их как frozen snapshot;
новый run из старого fit возможен только после явной компиляции в catalog 0.3.0 с
показанным diff/provenance. Никакого in-place rewrite или скрытого пересчёта.

До полного QA новый model выбирается явным experiment toggle и не является default.
Rollback — вернуть default на прежний model, сохранив новые JSON как unsupported/newer,
а не конвертируя их назад. Публикация assets-first/index-last; предыдущий dist и Pages
остаются точкой возврата.

## 5. Кандидаты, которые не блокируют базовую механику

| Кандидат PR #19 | Как проходит через Lab | Условие решения |
|---|---|---|
| Эффективные площади корпуса/радиаторов | `origin.kind="experimental"`, sourceRef и диапазон; не выводить из mesh | Два TI-опыта на малой/большой встроенной площади, затем одна рекомендация оператору |
| Недостающие TTX Спутника/Мира/stealth reference | Явные candidate values, не нули и не скрытые class multipliers | Полный cycle и A/B показывают назначение, цену и чувствительность |
| Сжатие offsets узкого коридора `Δ` | Named experiment off/on, не player setting | Устойчивость при `T_w>T_c`; при `T_w<=T_c` правило не применяется |
| Общая регулировка Combat group и точные buffer-unload conditions | Named controller variant в коротком опыте | Нет двойного регулирования, chatter и раннего резерва; ledger замкнут |
| G1/G10/G20 и дальнейшая кривая | Отдельная experiment dataset/revision | Проверены неизменная задача и усложняющаяся задача; выбор оснастки не исчезает скрыто |

Принятые законы доступны независимо от этих чисел. Candidate dataset не может стать
`canonical` только потому, что unit/runtime tests зелёные.

## 6. Последовательность work items

Общий порядок: D0 → T1 → T2 → T3 → T4 → T5 → T6. Каждый runtime work item начинается
с адресных RED tests, заканчивается focused evidence и не меняет следующий слой «заодно».

### D0 — authority sync и frozen contract

Deliverables:

- этот план и независимый Plan Review;
- отдельный U2 doc-only amendment по таблице §1, routed через U2 `docs/INDEX.md` и
  `docs/architecture/ADR-INDEX.md`;
- handoff `docs/handoffs/2026-10-10-u2-gdd-ship-specs-update-list.md` и принятые
  качественные правила U2 PR #848 входят в frozen owner set без автоматического
  принятия открытых численных ТТХ;
- оператор утверждает PG-SM-THERMAL-01 как полную matrix hull/mode/module × hot/cold ×
  critical stop/restart; соответствующие U2 owners обновляются до реализации этой ветки T2;
- machine-readable conformance fixture `docs/verification/ship-model-v0.1-vectors.json`
  для CP-01–05 и аналитических точек PR #19 без runtime verdict;
- Beads children существующего epic `ulab-9aa` создаются canonical writer только после
  `PLAN_READY`; pending intent не считается статусом.

Exit: reviewer подтверждает authority, scope, version/rollback boundary, тестируемость
SM-01–14 и отсутствие неразрешённого WHAT. U2 amendment может идти параллельно с Lab T1–T5,
но должен быть принят до server implementation/SM-14 parity claim. Пока
PG-SM-THERMAL-01 открыт, D0 не завершён, T2 special-mode protection не реализуется и
affected Plan Review не запускается.

### T1 — schema, catalog и полный state

Files:

- create `src/model/v3/types.ts`, `src/model/v3/schema.ts`;
- modify `src/model/v2/types.ts` только для version dispatch, без изменения old behavior;
- modify `src/fitting/types.ts`, `src/fitting/compile.ts`, `src/fitting/catalog.ts`,
  `src/fitting/editions.ts`, `src/fitting/validate.ts`;
- modify `src/catalog/schema.ts` and `src/io/fitting-json.ts` so `/4` and catalog `0.3.0`
  reach the new validators while `/1|2|3` retain their exact legacy/fitting routes;
- create versioned catalog files under `src/fitting/data/*-0.3.0.json`;
- create `tests/model-v3/schema.test.ts`, `tests/fitting/catalog-0.3.0.test.ts`;
- extend `tests/fitting/catalog-editions.test.ts`, `tests/fitting/input-guards.test.ts`.

Contract:

- hull separates `bodyExchangeAreaM2` from immutable `hullPassiveRadiator`;
- every surface has area, emissivity, active/passive, closable, builtin and exclusive
  `circuitOwner`, versioned directional IR profile and origin; pump-radiator panels never
  migrate to common TI. An ordinary radiator remains omnidirectional on a Military hull;
- Military schema can represent its accepted built-in buffer and aft radiator surfaces;
  Stealth schema can represent its built-in buffer, RAM and controllable body shell as three
  separate physical functions. Stealth gains no implicit radiator. This delivery does not
  invent a complete Military passport or numerical TTX outside Sputnik/Mir/one Stealth reference;
- controllable shell changes only an explicit bounded fraction of effective signed body-exchange
  area; it is not a cold source. Buffer mass enters dry mass once and buffer J do not enter `C_ship`;
- ordinary modules have four temperatures and durability parameters; thermal-control
  devices do not define `T_w/T_c`;
- ship heat capacity is compiled from dry construction/modules once; cargo and fuel do not
  add free thermal inertia. Shielding and gyrodynes retain their real mass/slot/power cost;
- environment separates `radiativeBackgroundK` from optional field
  `{temperatureK, coefficientWPerM2K, sourceId}`;
- state persists buffer J + minimum capture K, mode + Masking entry K, governor/generator/
  thermal latches, durability, first-negative-crossing flag, emergency exposure, cooldown and RNG;
- experiment/result state persists the selected receiver profile independently from model version:
  existing `positive-only` and `absolute-contrast` profiles coexist and are not sequential old versions;
- origin is required for every new numeric field; candidate and canonical values remain distinct;
- `stepSeconds` for the new model is exactly 1 s and duration/phase boundaries are whole seconds;
- one explicit `compileFitToShipModelV01` operation promotes a validated old fit into catalog
  `0.3.0`, displays the structural/numeric/origin diff and produces a new object. Merely selecting
  the new model on an old fit is rejected; no parser silently promotes or mutates source bytes.

Exit: valid Sputnik/Mir/stealth reference compile; malformed/nonfinite/negative values,
duplicate surfaces/source representation, impossible temperature ordering, invalid stocks,
unknown circuit owners and missing origins fail atomically with path+reason. Old fixtures keep
their exact old discriminators and replay path. Positive parse/serialize covers `/4` + `0.3.0`;
negative cases prove old fit → new model refusal without the explicit compilation operation.

### T2 — 1 s power/thermal controller and automatic cascades

Files:

- create `src/model/v3/power.ts`, `thermal-control.ts`, `heating.ts`, `step.ts`;
- create `src/model/v3/em-ledger.ts` as the physical coupling owner for raw/escaped/captured EM;
- reuse pure v2 ledger helpers only after old-model regression proves byte/number stability;
- modify `src/scenarios/fitting.ts`, `src/scenarios/mission.ts`, `src/runner/run.ts`,
  `src/runner/fitting-run.ts` and `src/runner/protocol.ts` for `/4` context/result/Worker dispatch;
- create `tests/model-v3/power-thermal-ledger.test.ts`,
  `tests/model-v3/em-thermal-ledger.test.ts`, `tests/model-v3/discrete-profile.test.ts`,
  `tests/model-v3/thermal-control.test.ts`; extend actual-Worker protocol tests for `/4`.

Behavior:

1. Authorize the requested action before load construction. In Masking, forbidden laser/radar/
   outward-transmission and other owner-declared active-emission commands are rejected before
   electrical request, heat and IR/EM calculation; rejection produces no work or emission and does
   not exit the mode. Deferrable background work and optional pulse-device charging pause, while
   passive receivers, flight control and actual critical loads remain in the ledger.
2. Close the electrical balance with input/output efficiencies: source follows actual load
   when the accumulator is full, and actual work is clipped by delivered power when empty;
   rejected external electric input does not become hidden host heat.
   In Masking, the emergency fuel-generator permission arms below 1% battery only when
   permitted load exceeds solar/external supply. Its actual output covers only that deficit,
   never charges the battery, and falls to zero when independent supply covers the load.
   Permission clears on Masking exit or independent battery recovery to the upper threshold;
   2% is a balance candidate. Mode exit hands the generator to normal control without a
   forced power-off. Persist the permission latch and count actual fuel/heat/signatures.
3. From actual delivered electrical stages compute `rawEmW=escapedEmW+capturedEmW` in the kernel.
   Only `escapedEmW` leaves the ship energy/heat ledger; captured shielding loss stays in host
   heat exactly once. The thermal controller consumes that coupled host heat in the same step;
   signature adapters later project these frozen outputs and never recalculate the split.
4. Compute `T_w=min(T_work_high)` and `T_c=max(T_work_low)` over installed ordinary
   modules, including switched-off modules; exclude thermal regulators.
5. Apply ordinary linear derate and accelerated wear between work/critical boundaries and
   stop ordinary operation at critical. Do not generalize this rule into, or remove it from,
   special modes. A Military hull in Combat grants every installed module full power from its
   hot work boundary to its own `T_crit_high` regardless of class, but behavior on/beyond that
   critical boundary and restart remain blocked by
   PG-SM-THERMAL-01; non-Military Combat keeps ordinary protection. Masking gains no hot/cold
   bypass by default. Passive exchange remains after a stop. Report incompatible `T_w<=T_c`,
   do not invent a common corridor.
6. Evaluate natural exchange and current device heat first; allocate the accepted Efficient,
   Combat or Masking cascade. Earlier active stages run to available maximum, exactly one
   current stage regulates, later stages wait for their own threshold.
7. At equal setpoints the later stage regulates; the earlier stage runs at available maximum.
   Heating and cooling never fight; buffer recovery through cooling does not start a heater.
8. Heating order: diesel generator — fuel furnace then electric; H₂ generator — electric
   then furnace; no generator — battery electric then compatible furnace; Masking — electric only.
   Furnaces require fuel and delivered auxiliary power, efficiency 0.90/0.95.
9. At each 1 s boundary request only the power needed to reach/hold the setpoint by interval end.
   Clip depletion/critical crossings inside the interval so stocks never go negative, but do not
   grant a later reserve before the next controller boundary.
10. Keep a separate continuous/reference helper for convergence studies; it never decides the
   production Lab request or overwrites a stored result.

Exit: after PG-SM-THERMAL-01 closure, CP-01–04 pass, including 1.2 MW in CP-01, no premature
reserve, one regulator at equal setpoints and no negative E/B/fuel. Ordinary-mode work stops at
its critical boundary; every special-mode boundary follows the approved D0 matrix. Existing v2 convergence,
mission and ledger tests remain unchanged. Actual Worker accepts `/4`, starts and pauses through
the new runner branch. Shield off/on proves `raw=escaped+captured`, a closed total residual and
causal host-temperature/controller change from only the retained part.
Masking-generator fixtures cover battery just below/exactly at 1%, demand fully/partly
covered by independent supply, no battery charging from fuel, an armed permission across
save/resume, preserved permission with zero output when independent supply covers demand,
request reappearance on a later deficit, independent recovery to the configured upper threshold
(2% candidate) and handoff to normal governor on mode exit without a forced off/on transition.
Blocked-action fixtures prove authorization precedes all power/heat/signature ledgers.

### T3 — buffer, surfaces and both thermoinverters

Files:

- create `src/model/v3/buffer.ts`, `thermal-surfaces.ts`, `thermoinverter.ts`;
- extend `src/model/v3/step.ts` and v3 telemetry;
- create `tests/model-v3/buffer-cycle.test.ts`,
  `tests/model-v3/thermoinverter-surfaces.test.ts`,
  `tests/model-v3/thermal-fields.test.ts`.

Behavior:

- buffer enforces capacity and charge/discharge power, forbids simultaneous directions,
  preserves debt across phases/mode/save, records the minimum capture temperature of the
  remaining stock and never releases to a hotter ship; empty resets the marker;
- UI-facing diagnostics distinguish capacity limit, power limit and unreachable recovery;
- every surface participates exactly once: direct at `T_ship`, or in one running hot circuit
  at computed `T_hot`; closed active panels participate nowhere;
- common TI owns all eligible hull/fitted radiator surfaces; pump-radiator owns only its fixed
  panels even while off. When a pump stops, its own open panels return to direct exchange but
  never become common-TI area;
- solve `Qc+W=Qradiation_hot+Qfield_hot`, with COP/conductance/fluid/panel/power limits and
  at most 50 deterministic `double` iterations. Select the minimum useful `T_hot`; if the whole
  ship gains no cooling after source heat/power and displaced natural exchange, keep TI off;
- `hA(T-T_field)` and radiation remain independently signed; reject duplicated source IDs.
- directional profile belongs to each radiator version and does not change total thermal watts;
  a hot circuit inherits each connected surface profile without collapsing a mixed set into a
  hidden hull/class multiplier. Controllable shell affects only its declared body fraction.

Exit: PH-B1 cases reproduce direct −150 kW vs hot-side +50 kW with correct signs; all four
two-pump ownership states preserve total area without double count; full work→recovery→repeat
returns the buffer debt or reports the exact unreachable remainder/reason.

### T4 — durability, deterministic failure and persistence

Files:

- create `src/model/v3/durability.ts`, `src/model/v3/random.ts`;
- modify `src/runner/fitting-run.ts`, `src/runner/run.ts`, `src/runner/protocol.ts`,
  `src/io/fitting-json.ts`, `src/io/fitting-result.ts` and Worker checkpoint validation;
- create `tests/model-v3/durability.test.ts`, `tests/model-v3/persistence.test.ts`;
- extend `tests/fitting/io.test.ts`, `tests/fitting/mission-io.test.ts`.

Behavior:

- exact `R=0` remains guaranteed by durability; first `R>=0 -> R<0` crossing
  causes one immediate mandatory stop; after cooldown an emergency restart is allowed;
- below zero use `x=clamp(-R/R_emg,0,1)` per declared work period, with restart chance `1-x`;
  one player `RESTART` request authorizes automatic retries after each cooldown;
  terminal floor requires repair. Hull/armor/vital exceptions remain explicit data, not guesses;
- thermal stop and durability stop are independent, with stable priority in diagnostics;
- seed/state of RNG, work exposure, cooldown, first-negative-crossing flag, all latches, buffer marker/debt and
  Masking entry temperature round-trip through pause/export/import/resume;
- malformed or future state rejects atomically; no field silently defaults during continuation.
- repair that restores `R>=0` resets the first-negative-crossing flag; power-cycle, mode change,
  pause/reopen or a repair that remains below zero do not, so none grants or removes a warning failure.

Exit: CP-05 after 59 s + save + 1 s matches uninterrupted 60 s for request, failure, RNG,
stocks, latches and cooldown. One actual-Worker `/4` chain start→pause→export result/checkpoint→
atomic import→resume matches uninterrupted execution. Repeated import does not reroll; malformed
future state is rejected; repair to `R>=0` restores exactly one next-crossing warning failure;
old fit/results keep literal replay and never enter v3 restore dispatch.

### T5 — Masking, signatures, observer and UI explanation

Files:

- extend new-model adapters in `src/signatures/physics.ts`, `runtime.ts`, `config.ts`; adapters
  consume the v3 kernel `raw/escaped/captured` ledger and do not change host heat;
- modify `src/app/main.ts` and `src/app/fitting-workspace.ts` for explicit catalog `0.3.0` /
  model selection and the visible old-fit compilation action with diff/provenance;
- modify `src/app/fitting-ui/conditions.ts`, `ship-view.ts`, `lab-channels.ts`,
  `signatures.ts`, `signature-comparison.ts`, `compare-view.ts`, `result-context.ts`;
- modify `src/app/fitting.ts` and styles only for the accepted presentation;
- create `tests/signatures/ship-model-v0.1.test.ts`, `tests/ui/ship-model-results.test.ts`,
  `tests/browser/ship-model-v0.1.spec.ts`.

Behavior:

- Masking closes managed radiators and disables pumps/TI; buffer holds entry temperature then
  debt grows. Pilot thrust has no extra mode cap; actual delivered load drives heat/IR/EM;
- T5 renders the action authorization decision and reason but does not own enforcement; a refused
  active action already has zero delivered work/heat/emission from T2 and never auto-exits Masking;
- IR uses actual outward body/radiator/hot-circuit/exhaust paths and signed contrast, including
  cold silhouette. It applies the selected persisted receiver profile and each installed radiator
  version's observer-angle projection while preserving total emitted watts. EM uses the T2 actual-stage split; shielding reduces escaped output, while
  its already coupled retained host heat changes temperature/control, and degrades own antenna response;
- 10/20/40 km and other distances are reference calculations for the same observer conditions,
  never a guarantee of stealth or knowledge about an enemy contact;
- show work/time, stocks, first limiting installed module, cascade/stage reason, buffer debt and
  recovery reachability, stops/restart/repair, IR/EM, own view of one control target and A/B price;
- shielding/gyrodyne comparison keeps their actual mass, occupied category, power and heat costs;
- numerical cold-H₂ Masking (`ΔT_stealth`, anticipation and hysteresis) remains a later stage and
  is not enabled by the current GDD mention or by this first implementation;
- default view remains concise; formulas, origins and full ledger stay under details. No law editor.

Exit: same maneuver outside/inside Masking has the same requested flight command and ordinary
limits, while actual signatures/debt differ causally; radiators never auto-open for maneuver.
Shielding comparison shows lower escaped EM plus higher host heat/weaker own sensor, with no
free range leak. Native UI chain compiles an old fit only by the explicit operation, starts `/4`,
and displays its new discriminator; direct model switching on the old fit is refused. Desktop 1440,
touch 390 and tablet 820 preserve current control ownership.

### T6 — candidate experiments, full QA and delivery

Files/artifacts:

- `docs/experiments/ship-model-v0.1-matrix.md` and versioned result JSON;
- update `docs/user/ship-fitting.md`, `docs/guides/signatures-observer.md`, `docs/INDEX.md`;
- final QA/review reports with exact source/build/contract fingerprints.

Run matrix:

- Sputnik S and Mir M: standard/cold/hot field, idle/work/peak/recovery/repeat;
- one structural Military fixture proves built-in buffer/aft-radiator representation without
  claiming a complete Military passport or candidate balance;
- Stealth reference keeps RAM/buffer/controllable shell separate; no implicit radiator appears;
- small vs large built-in radiator area: common TI vs pump-radiator, battery and generator;
- ordinary vs aft-directed and mixed radiator versions: equal total watts, bow/stern projection,
  hot-circuit profile inheritance and no lost/double-counted area;
- buffer high-power-short vs low-power-long, reachable and unreachable recovery;
- Efficient/Combat/Masking, quiet work and emergency maneuver;
- Masking forbidden-action rejection before ledgers, no auto-exit, paused background/optional
  charging, persisted emergency-generator permission and later deficit reactivation;
- candidate G1/G10/G20/further: same task/environment plus harder task;
  useful laser power follows the accepted ×1→×2 direction and efficiency approaches, but never
  exceeds, 0.70; the unknown curve remains versioned candidate data;
- CP-01–05 and exported server conformance fixture;
- old 0.2.x fit/result open/replay, new 0.3.0 save/reopen/resume, malformed/future rejection.

Exit: normal `.agents/project/verify.sh`, typecheck/unit/build/browser and addressed long-run
performance are PASS on one frozen candidate. Physical second LAN device, Unity/server parity
and playtest balance remain NOT RUN unless actually executed. Independent QA covers SM-01–14;
one scoped Code Review covers changed runtime/schema/UI/test paths; blockers return to the same
Developer and only affected checks/re-review repeat. Operator decides candidate TTX separately.

## 7. Verification Contract

| AC | Expected / edge / error behavior | Method |
|---|---|---|
| SM-01 | Sputnik/Mir runnable; every gap is a signed candidate, never zero/hidden multiplier | Catalog schema/provenance tests + UI inspection |
| SM-02 | Source/load/loss/stock and fuel/work/heat ledgers close; full/empty battery neither creates nor deletes energy | Analytic constant-flow, mid-step depletion and residual tests |
| SM-03 | In ordinary mode four limits produce nominal corridor, linear derate/accelerated wear and critical stop in both hot/cold directions; Military Combat keeps every installed module at full power from `T_work_high` to its `T_crit_high`, while behavior on/beyond critical, restart and all unapproved special-mode behavior await PG-SM-THERMAL-01 without an implementation default | Boundary table including exact equality/crossing; approved D0 matrix before special-mode tests |
| SM-04 | Installed sensitive module defines `T_w/T_c`; accepted mode/heating order; reserve waits for own threshold; no opposing control | Discrete profile tests, CP-01–03, mount/off/demount comparison |
| SM-05 | Buffer J/power/marker persist; cold stock is not released to hotter ship; full debt restored or unreachable remainder explained | Full-cycle, partial discharge, mode/save/reopen cases |
| SM-06 | Body and hull passive radiator are distinct signed exchanges; shell changes only its declared body fraction; radiator version changes observer profile, not total watts | Surface ledger, hot/cold field signs, ordinary/aft bow-stern comparison |
| SM-07 | Common TI and pump-radiator obey exclusive area ownership; hot side inherits each surface profile; mixed versions preserve area and whole-ship benefit | PH-B1 + four ownership states + mixed-profile power/source-heat controls |
| SM-08 | Exact zero is guaranteed; first crossing below zero causes one immediate stop; below-zero risk/cooldown/restart/terminal repair are deterministic and saved; repair to `R>=0` rearms exactly one next-crossing stop | Seeded durability/repair boundaries + CP-05 |
| SM-09 | IR/EM separate; receiver model version and selected positive-only/absolute-contrast profile persist; same observer/angle; shielding has heat and own-antenna cost | Versioned signal ledger, bow/stern and shield A/B observer tests |
| SM-10 | Result explains useful work, first limiter, stop and upgrade trade-off without exposing a laws editor | Unit presentation + native browser chains |
| SM-11 | G10/G20/further and candidate correction are reproducible and visibly non-canonical | Matrix artifacts with origin/version and operator decision pending |
| SM-12 | Fit, candidate data, conditions, model/state/RNG and measured result round-trip without history recompute | Literal JSON fixtures, resume equivalence, atomic negative imports |
| SM-13 | Masking adds no thrust cap and never opens radiators for maneuver; forbidden active actions are rejected before ledgers without emission/auto-exit; emergency generator output tracks only unmet permitted load below 1%, never charges battery, can be zero while permission persists, reappears on later deficit and returns to normal control on mode exit; reference range does not reveal enemy truth | Authorization→flight/signature/power coupled cases + UI language inspection |
| SM-14 | Same full state/input on 1 s profile gives same stages, permissions, requests and final state in Lab/reference implementation; client uses server state | CP-01–05 JSON vectors; Lab adapter now, U2 server runner in separate work item before PASS |

Numerical policy: exact stock bounds, no NaN/Infinity; constant linear ledgers use absolute
`1e-6 J` and relative `1e-9`; nonlinear radiation/TI uses the stricter of owner tolerance or
half-step/reference difference `<=0.1%`. Equality boundaries are explicit tests, not epsilon
policy. A mismatch changes solver/contract, never hidden candidate TTX.

## 8. Review focus, risks and completion gates

Plan Review focuses on: precedence of PR #19, candidate/canon separation, frozen old readers,
closure of PG-SM-THERMAL-01, 1 s boundary semantics, area/profile ownership, buffer marker,
guaranteed exact-zero durability and first-negative crossing/reset-on-repair, deterministic save,
observer privacy and feasibility of CP-01–05.

QA/Code Review named risks:

- one surface or energy source counted twice;
- reserve activated inside the second before its threshold boundary;
- stock clamp erases energy or permits unpaid work;
- shielding changes observer EM without the matching escaped/captured/host-heat ledger change;
- buffer debt/marker, failure exposure or RNG lost on mode/save;
- pump-radiator area leaks into common TI while its pump is off;
- `T_ship` used instead of `T_hot` for hot-circuit field exchange;
- Masking silently caps thrust or opens panels;
- forbidden Masking action reaches load/heat/signature calculation or exits the mode;
- special-mode thermal bypass is inferred without the approved hull/mode/module matrix;
- radiator direction becomes a hull multiplier, changes total watts or is lost by a TI hot circuit;
- cold-H₂ Masking candidate is enabled without separate `ΔT`/anticipation/hysteresis decision;
- candidate numeric data displayed as accepted U2 canon;
- old catalog/result silently migrates or recomputes;
- Lab reference distance leaks into game contact/range authority.

Completion requires: operator closure of PG-SM-THERMAL-01; independent `PLAN_READY` on the
resulting exact plan; canonical Beads work items; all addressed AC
with actual evidence; project guard PASS; independent QA PASS; scoped Code Review APPROVED;
U2 doc sync accepted before server implementation; PM final binding; operator merge. This plan
does not claim runtime or server parity before those gates.
