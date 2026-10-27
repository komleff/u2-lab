---
title: "Каталог 0.3.4: тепловой баланс, монтаж и пассивный ангар"
status: "PRODUCT / PLAN_READY; binding report in PR #50"
version: "0.5"
date: 2026-10-26
beads: ulab-16h
---

# Цель и границы

Реализовать принятое оператором 2026-10-26 WHAT из PR #49 в существующей Лабе,
выпустить `ship-fitting-0.3.4`, сохранить старые каталоги и буквальные опыты.
Конечная точка — implementation PR с измерениями, QA и scoped Code Review;
merge выполняет оператор. База подготовки — PR #49 `f0732d326f346bf557ed582b8bbe7cdba60caa29`,
отдельная ветка `feat/thermal-fitting-0.3.4`, stacked PR к документальной ветке до её merge.
Документальный PR и его 35 исторических опытов/125 data checks не квалифицируют этот runtime.

WHAT owners: `docs/research/2026-10-26-diesel-balance/README.md`,
`balance-parameters.json`, `fitting-audit.md`, `u2-pr905-review.md`,
`docs/product/station-hangar-thermal-exchange-v0.1.md`,
`docs/gdd/gdd_u2_ship_fitting_v0.2.md`, `docs/architecture/source-authority.md`.
Точный текст задания оператора 2026-10-26 имеет приоритет над устаревшими описаниями.
Дополнение оператора 2026-10-26 принимает **весь** `proposed-adjustments.md`
U2 #905 на `ff58b7125d3325e85f72d449d7719c55c5c2cc8b`. Оно отменяет прежнее
исключение масс, D21/D22, износа генераторов и услуг; исторический план 0.1 superseded.
Точная принятая спецификация копируется в новый data revision и связывается hash.
Сначала нормативные данные/статусы/профили U2 и Lab, затем продуктовый runtime.
Позднейшее уточнение оператора: Лаба — симулятор тепла и энергии; тарифные
услуги неважны. Поддержать изменения физических параметров и ТТХ существующих
корпусов/модулей без усложнения. Экономика, кошелёк, оплата/quotes, fleet/insurance
процесс и новые service screens в runtime Лабы OUT. Экономические решения #905 остаются принятыми для U2 и передаются PM F2;
их упоминание в справке не создаёт задачи реализации или нового payload в Лабе.
Окончательная коррекция оператора: существующую прочность не расширять в
систему ремонта/обслуживания. Используются согласованные коэффициенты без
новых ремонтных, страховых и экономических механик. Рейсы/добыча — тестовая
нагрузка стенда; пополнение ресурсов задаётся физическими условиями без оплаты.

OUT: production U2, `configs/ships` и protocol/server deploy, активация synthetic governor
`ship-fitting-ship-model-0.2` без отдельной qualification,
сменный RAM/Stealth-shell, новые параметры иных корпусов, обнаружение как критерий приёмки.
Поток внешних потерь/существующей сигнатуры сохраняется физически корректным.

# As-built и HOW

Текущий вход `src/app/fitting.ts` → `src/app/ship-model.ts` →
`ShipModelWorkspace` создаёт `/4` с каталогом 0.3.3 и production Worker.
Governor 0.2 использует ту же schema `/4`, но отдельный modelVersion/imported path;
схемы `/5` в этом checkout нет. Старые /1–/4 и synthetic governor не мигрируют. Изменяется существующий `/4`,
без отдельной страницы и без молчаливого включения #905.

Каталоги выбираются `src/model/v3/types.ts` + `src/fitting/editions.ts`.
`validateShipModelFit` сейчас запрещает mixed propulsion, `compileShipModelFit`
требует runnable fit; это мешает preview неполной сборки.
Миссия `src/runner/ship-model-mission.ts` обслуживает через `idle`, который оставляет
бортовую автоматику и расход; нужен отдельный пассивный интервал.
Энергетика D уже вычисляет `chemical − useful(engine × path)` в `src/model/v3/step.ts`.
Новые коэффициенты вносятся данными, без второго пересчёта полезного выхода.

## Сохранение пользовательских цепочек

| Цепочка | Решение / проверка |
|---|---|
| Открытие, меню пресетов, монтаж | Существующий shell; 14 новых preset options, семь корпусов; preview/apply неполного fit |
| Условия и сценарии | Сохраняются режимы, пользовательские скорости, imported routes и explicit overrides; default Pony 225/450 м/с |
| Запуск и controls | Реальный Worker, pause/resume/cancel/checkpoint, блокировка save/start при missing source |
| Live, история, события | Данные фактического расчёта; passive service различим в telemetry, не подстановка latest в history |
| Frozen A/B и stale | Существующие владельцы, frozen payload неизменен; старое измерение не новое |
| JSON/CSV/export/reopen | Старые /1–/4 и synthetic governor открываются по своей версии; новые 0.3.4 results и checkpoint воспроизводимы |
| Каталоги и старые результаты | Старые JSON 0.2.x/0.3.0–0.3.3 byte-exact; старые физические semantics не мигрируют |
| Публичная поставка | Pages/release в задачу не включены; implementation PR/build, прежние deployment assets не трогаются |

# Последовательность одного Developer

0. **Сначала данные и нормативные owners, без игрового runtime.** U2 worktree
`/Users/komleff/Documents/GitHub/u2-f2-data-accepted`, branch
`data/f2-accepted-20261026` от #905 `ff58b712…`; результат fast-forward в ветку
#905 `data/f2-ship-profiles` только после текущего race check.
Обновить `docs/data/f2-ship-profiles/{proposed-adjustments,decisions,durability,
README,alignment-review,mapping-corrections,qualification-plan}.md`,
Экономическое принятие зафиксировать в ratification record/передаче PM F2;
расширять пакет услуг и генерировать для Лабы тарифный payload не требуется.
Зафиксировать дословное дополнение оператора и точные bytes принятого документа;
старые расчёты пометить историческими. Принятые пункты D1–D24 по их фактическому
scope больше не «ждут PO». Согласованные candidate material approximations не
становятся измеренным production рецептом. Blocked schema сохраняет
`runtimeAuthorization:false`/`BLOCKED_RESTART_SCHEMA`, approval WHAT отдельно.
Обновить адресные normative owners (через U2 INDEX/ADR-INDEX):
`docs/specs/balance/spec_f1_fixed_ship_presets_v0_1.md`,
`docs/gdd/gdd_survival_starting_ship_v0.1_draft.md`,
`docs/gdd/gdd_survival_pony_propulsion_thermal_balance_v0.1_draft.md`,
`docs/gdd/gdd_ship_material_class_generation_model_v0.1_draft.md`,
их INDEX entries. Изменения экономических owners/СТО делегируются PM F2;
они не входят в implementation PR Лабы.
Новый F2 data baseline имеет приоритет; старый F1 runtime не объявляется
обновлённым без изменения configs и квалификации принимающим PM F2.
Исправить генератор `docs/data/f2-ship-profiles/generator/{build_mass,
build_extra,build_durability,ships,main,common,verify_alignment}.py` по need:
- физическая dry mass = shell + installed materials, fuel/cargo отдельно;
  Pony shell=31500 kg, C_shell=31500×470=14805000 J/K;
  Courier dry masses приблизительно 52837/231631/46734 kg (точные суммы generator);
  старые 50000/200000/46700 — historical reference, не второй mass owner;
- собственные Pony Industrial/G0/UNKNOWN forces/flow/efficiencies сохраняются,
  без factory Industrial substitution; одинаковое численное происхождение в обеих копиях;
- три courier F2 комплекта: один passive radiator, Mir D, full start fuel/charge
  у нового борта; mining loadout отдельно, не автоматически новый courier;
- existing automation Normal370 K, cold225/230 K, margins/dispatch сохраняются;
  Quiet запрещён этим трём бортам, inert quiet fields не permission;
- **только generators**: Industrial `3.125e-5 1/s`, Civilian `×1.33`;
  engine/module rates из q1-candidate.4 не увеличиваются новым generator factor;
  данные exposure equivalent-full-load, vital0 и thermal multiplier2 в F2 profiles сохраняются;
  Lab generic engines сохраняют old1e-6, courier-specific profile rates остаются
  прежними .4 (Industrial1/72000, Civilian×1.33), это разные источники/loadouts;
Экономические D9–D17 приняты для U2, но не являются work items Лабы. В передаче
PM F2 указать принятие точного proposed-adjustments.md и необходимость его
нормативной/игровой реализации принимающей линией; не вводить новые тарифные
артефакты и проверки экономики в Lab diff.
Новая общая ревизия `q1-accepted.5` / `u2-f2-ship-profiles/0.5`.
Создать/пересчитать shared `balance-parameters.json`,
три JSON profiles, `sync-manifest.json` с **фактическими** generator/runtime-source SHA
(старый manifest имел 5 неверных hashes; не наследовать), frozen source SHA и qualification.
`verify_alignment.py` подтверждает старые125 и новые адресные assertions, exact reproduction,
отдельность engine/generator wear и physical identity/mass/startup invariants.
Сначала записать зеркальные данные и статус в документальный worktree PR49
`/Users/komleff/Documents/GitHub/u2-lab-docs49-finalize`, обновить research manifest,
README/audit addendum/INDEX/source-authority и создать commit; PM переносит exact commit
в implementation branch. U2 и Lab четыре физических payload должны совпасть bytes;
нового экономического payload не создаётся. Runtime code начинается только после этого data milestone.

1. **Каталог и provenance.** Создать `src/fitting/data/{hulls,items,presets,preset-manifest}-0.3.4.json`;
зарегистрировать в `src/fitting/editions.ts` и `src/model/v3/types.ts`, новый default.
Обычные gates: low 200, workLow 220, restartLow 230, workHigh 500,
restartHigh 480, high 550 K. Дизельные баки: 150/200/180/500/550/570 K
в том же порядке полей. Не навязывать бакам порядок обычного restart band.
Все дизельные двигатели, включая встроенные, получают hostFraction 0.4; H/E и
генераторы сохраняют собственные правила. Пони и собственные изделия Industrial/G0, manufacturer/national UNKNOWN;
class не подменяет manufacturer и не включает factory multiplier. Новые identity
поля optional для старых каталогов, normal governor использует Industrial.
Pony hull shell=31500 kg, C=14805000 J/K, old catalogs unchanged.
Три courier F2 комплекта остаются точными reference profiles в зеркале данных;
новые обязательные меню/пресеты/слоты для них в Lab UI не добавляются. Прежние
14 mining presets получают новую версию и физические ТТХ. Сумма конкретной
mining сборки не обязана совпасть с courier roster: mass/C считаются по её
реально установленным материалам. Courier source profiles проверяются отдельно
генератором, без скрытого добавления F1 scanner/radar в mining14.
Фиксированные поверхности Sputnik/Pony 40×0.9, Mir 400×0.9 уже существуют:
проверить включение один раз без нового bill; иные hull surfaces сохранить буквально.
Пассивные S/M: physical 490/1960, epsilon .9, effective 441/1764 м²;
dry mass 750/3000 кг, C 334900/1339600 J/K из общего пакета. Эффективную площадь
не умножать на epsilon второй раз. Остальные материалы/числа не ребалансировать. BodyExchangeArea — прежний отдельный
пассивный путь, hullPassiveRadiator — D3: не удалить body ради формального совпадения
и не удвоить fixed. Новая политика массы вычисляет фактический fit, не F1 scalar.

2. **Монтаж и готовность.** Изменить `src/model/v3/schema.ts`,
`src/app/ship-model-workspace.ts`, при необходимости
`src/app/fitting-ui/ship-model-swap-dialog.ts` и `src/app/ship-model.ts`.
Новый каталог расширяет семьи четырёх указанных корпусов: electric-heater,
обе species furnace, pump-radiator, shielding, sensor, gyrodyne в turn slot.
Слоты/размеры/formFactor/roles/архитектуры сохраняются. U допускает D/H/E,
Pony D — D/E, Volna H — H/E, E/A остаются electric.
Structural validation и preview/apply разрешают resource-incomplete fit.
Runnable/source validation вызывается при save/export fit и start/prepare;
ошибка содержит instance/slot/consumer label и нужный source/species.
Один enabled compatible tank/power source может питать несколько consumers.
Наличие источника отделено от заполненности/заряда, мощности и thermal availability:
пустой установленный бак — ресурсное состояние, не MISSING_SOURCE; слабый источник
может законно дать derating. Электрические потребители требуют совместимого
электропитания по существующей шине, не отдельной батареи для каждого.
Старые версии сохраняют свои правила; import/replay old result не проверяется как новый fit.
Для неполного preview компиляция получает явный structural-only путь, а не bypass
валидации в start/export/run parser. RAM/shell mounting неизменен.

3. **Обесточенное обслуживание.** Добавить адресный helper
`src/model/v3/station-service.ts`, связать из `src/runner/ship-model-mission.ts`;
при необходимости расширить типы/telemetry в `types.ts`,
`src/runner/ship-model-telemetry.ts`, `src/io/ship-model-result.ts`.
Только новый каталог использует новый service semantics; старые сохранённые
runs воспроизводят прежнюю модель. Во время service всё бортовое питание,
hull own load, генераторы, двигатели, подогрев, насосы/H2 cooling выключены.
Топливо/charge не расходуются; штатное пополнение в конце — отдельный station input.
Учитываются body + фиксированная + реально открытые panels ровно по разу,
существующее закрытие shell/панелей сохраняется; closed panel не открывать.
Пассивные поверхности в этот интервал имеют T_ship, без TI hot side.
Среда 300 K, G=10000 W/K:
`C dT/dt = −Σ sigma*A*epsilon*(T^4−300^4) − 10000*(T−300)`.
Интегратор сохраняет знак обмена, не перескакивает через 300, считает по реальному dt;
точность сравнивается с независимой численной reference, разбиение интервала устойчиво.
Нет reset при стыковке/refuel/charge/replacement; новая C применяется далее,
температура корпуса — носитель, снятые модули не требуют новых температур.
`idle` вне ангара сохраняет прежний смысл. Новая реализация не эмулирует серверный offline.

3а. **Принятая автоматика и коэффициенты износа в Лабе.** Новая catalog policy
задаёт для трёх courier profiles Normal370/cold225–230, источник class dispatch,
generator-only wear; соответствующий production `/4` принимает policy явно,
Efficient соответствует Normal, старые каталоги сохраняют прежние controller semantics.
Существующие прочность, отказы, repair/restart controls и их clocks не
расширяются новой системой; меняются только согласованные коэффициенты в
данных с проверкой фактической работы генератора и неизменности engines.
Собственные двигатели Пони не получают новое ускорение износа; проверяется exact
rate, длительность и equivalent work. Не объявлять перенос кода governor0.3 завершённым:
новая policy не меняет imported synthetic model/version.
Новый слой тарифных услуг/адресов/кошелька/quotes, purchasing и страховой
replacement runtime Лабе не нужен (прямое уточнение оператора).
Использовать существующее пополнение топлива/заряда benchmark mission на конце
обслуживания, сохранить отдельный stationInput/receivedFuel/receivedCharge ledger,
не сбрасывая T. Этот режим опыта не выдаётся за gameplay покупку/экономику U2.
Ремонт остаётся существующим исследовательским control с сохранением thermal gates,
без нового экрана и без денежного расчёта. Экономические условия U2 передаются PM F2 ссылкой на accepted record, без
нового экономического payload, UI или функциональности в Lab. Нулевой dock wear/расход и отличия engines от
generators проверяются физическим runner. Дополнительные controls/persisted state
вводятся только для физически нужных policy/cold-latch, не для новой экономики.

4. **Детерминированная проверка и воспроизводимые измерения.** Добавить адресные
`tests/fitting/catalog-0.3.4.test.ts`, `tests/model-v3/station-service.test.ts`,
`tests/ui/ship-model-thermal-fitting.test.ts`,
`tests/browser/ship-model-thermal-fitting.spec.ts` по AC ниже.
Сохранить command/script + JSON/CSV receipts + manifest в
`docs/research/2026-10-26-thermal-fitting-runtime/` с source SHA/catalog/hash,
полными составами и входными условиями. Удобен существующий TS loader из research;
production runner обязателен, нельзя модифицировать каталог в памяти вместо нового.
Вычислить нормальную матрицу Sputnik/Pony/Ermak (+ Mir сравнительно),
парные cold drift/heater/radiator и hot cooling/600 K controls; сравнивать одинаковые
условия, явные различия состава указать. Одночасовой горизонт 3600 с;
для времени четвёртого рейса допустим дополнительный горизонт 4500 с.
Если Sputnik не около часа, предъявить измеренный gap и GD/PO предложение,
не менять принятое WHAT для прохождения. Никакой гарантии всем fit при 600 K.

5. **Документы и поставка.** Обновить руководство каталога 0.3.4, INDEX,
source-authority (delivery vs historical), PM F2 handoff. Обе копии shared q1-accepted.5 подготовлены на data milestone; в runtime stage
они immutable, новые изменения данных требуют новой ревизии. В handoff — schema blocker
`GovernorSchemaV03.cs`, 230/480 K отклоняются старым U2 validator;
это не блокирует independent Lab implementation. После полного guard Developer
коммитит candidate, возвращает actual path set, команды/результаты и ограничения.
PM → независимая QA → один scoped Code Review → affected fixes лишь по blockers.

# Verification Contract

| AC | Expected / error / edge / invariant | Method |
|---|---|---|
| TF01 | 0.3.4 явно current; прежние14 mining presets/семь hulls компилируются; три courier profiles data-reproducible; новые численные поля из accepted subset, старые каталоги byte-exact | Data/compile assertions + old JSON hash inventory |
| TF02 | D: fuel = useful + .4*loss host + .6*loss external; engine/path efficiencies сохранены, generator D45/55 и H отличны | Isolated actual-step balance, несколько duty/КПД, existing conservation tolerances |
| TF03 | Ordinary все шесть порогов; tank exception; restart с обеих сторон; Pony Industrial/G0 + manufacturer/national UNKNOWN identity | Catalog/schema/control tests, boundary equality/above/below |
| TF04 | Fixed surfaces один раз, S/M physical/effective/mass/C exact, нет дополнительного bill и epsilon² | Compiled surface graph + analytic radiation/ledger checks |
| TF05 | Семь hulls × physically fitting candidates; четыре expanded families и turn gyrodyne; role/size/count/architecture и builtins сохранены; U mixed D/H/E проходит | Full addressed mount matrix positive/negative + preset compile; RAM/shell negative |
| TF06 | Incomplete edit/apply разрешён; save/start блокируются consumer-specific MISSING_SOURCE; общий source для нескольких; empty/weak/thermal отдельно; mixed UI→Worker→export | Structural/runnable validation and browser chain incl Pony + Volna architecture refusals |
| TF07 | Service при 250/300/500 K за 10 s и длительно к 300, без onboard burn/reset; closed panels closed, already open passive, refuel/replacement continuity, event interval | Actual service helper + production mission + independent reference; whole-vs-split and service checkpoint/resume |
| TF08 | Часовая добыча старт300/станция300/фон250/100km/service10s; first work limit, critical stop, work/mined/delivered/trips/stocks/reasons measured; cold/heater/radiators и hot600 controls persisted | Immutable runtime experiment matrix on actual new catalog, reproducible JSON/CSV plus hashes; measured gap is explicit result, not hidden tuning |
| TF10 | Accepted.5: all decisions/statuses/owners updated, exact generation & both mirrors, dry mass/C/identity/startups/engine wear unchanged by generator change | Data assertions/reproduce/hash and normative link checks |
| TF11 | Lab diff ограничен теплоэнергетическим стендом: нет экономики/нового repair system; физическое пополнение учитывается station inputs и не сбрасывает T. Экономическое принятие U2 передано PM F2 ссылкой | Diff scope audit + actual station inputs/conservation/persistence checks; существующая прочность сохранена |
| TF12 | Normal370/cold225-230/Industrial dispatch/new generator wear in actual /4; engine rates preserved, wear по actual working fraction, no Quiet activation | Production controller/step runs, lifetime measurements and explicit policy serialization |
| TF09 | Existing UI controls/plots/A-B/exports/imported literal paths работают; old /1–/4 + synthetic model0.2/schema4 unchanged/reopen, normal project verify PASS | Focused production Worker browser + full .agents/project/verify.sh; old result digest regression |

Numerical rules: energy residuals — существующие model tolerance helpers, не новый
произвольный общий epsilon. Service T — reference convergence error ≤0.001 K на
10 s и ≤0.01 K на длительном интервале; whole-vs-split ≤0.001 K.
Нулевая стоянка и 300 K не меняют T/resources. Fixed dt/reference и seed записать.
Ошибки tooling/QA неоднозначность дают NOT RUN, не PASS.

# Review Contract и доставка

PRODUCT budget 5: Plan Review, QA TF01–12, scoped Code Review, резерв affected QA
и re-review. Reviewer проверяет изменённые runtime/catalog/IO/UI paths и необходимые
callers по TF01–12; named risks — old replay drift, source bypass через preview/import,
service hidden consumption/panel reopening/reset, epsilon double counting, смешанные
архитектуры, смешение class/manufacturer, неподключённая physical automation policy и неотдельный engine wear.
OUT — серверная квалификация, detection, новый дизайн shell и независимые смежные F2 WI.
Reports содержат actual role/model, exact reviewed paths, contract, blob hashes,
content/envelope fingerprints ADR3.28. При content-equivalent base movement —
fresh deterministic checks, без повторного LLM review.

Rollback: current catalog pointer назад на 0.3.3, строка 0.3.4 и её files остаются
читаемыми; старые saved results не переписываются. Новый service version-gated,
поэтому rollback default не меняет историческое воспроизведение.
После merge #49 оператором штатно изменить PR base на main и сверить content;
force push/main merge агент не выполняет. До merge dependency явно видна.
