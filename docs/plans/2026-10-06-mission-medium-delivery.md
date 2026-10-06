---
title: "v2.2 — основной шахтёрский рейс и M-модули"
status: proposed
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-v2.2-mission-brief.md
  - docs/product/ship-fitting-medium-modules.md
---

# План реализации шахтёрского рейса и каталога M

**Цель:** дать оператору рабочую версию для сравнения оснастки по доставке руды
с реальным перелётом и предоставить пять отсутствующих семейств M-модулей.
WHAT: mission brief v0.3 и medium-modules MF01–04/HY01–02; числа с provenance.
PRODUCT. Один существующий Developer, QA, Reviewer. Beads — единственный tracker.

## Target → as-built → gap

Сейчас `makeMiningRun`/`phaseAtV2` задают120с добычи и10с «полёта» без координат.
Тяга/расход/тепло уже рассчитываются в `stepV2`, но поступательного движения нет.
Старые45 SKU не содержат пяти M-семейств; medium contract прошёл Plan Review.
Pony CR-PONY-B1 исправлен bbe3fc, affected QA/scoped closure должны закончиться
до DEV_RELEASE этой поставки. Основной рейс — первый runtime milestone;
M/HY — второй в том же кандидате, без отдельного UI redesign.

## Архитектура и границы

- Старый `ship-fitting-ledger-0.2` и legacy запускаются прежним алгоритмом.
  Новый явный model tag `ship-fitting-mission-0.2.2` в том же JSON envelope
  `u2-lab/2`. Новый import не переименовывает и не пересчитывает старые snapshots.
- Новый контроллер рейса в `src/runner/mission.ts`, движение в
  `src/model/v2/flight.ts`, фабрика `makeMissionRun` в `src/scenarios/mission.ts`.
  Общие energy/fuel/thermal вычисления только через `stepV2`, не второй баланс.
  `src/runner/fitting-run.ts` dispatch по model tag; protocol/Worker commands прежние.
- `src/model/v2/types.ts`: расширение spec/state/metrics для миссии, старые объекты
  без новых обязательных полей. `src/model/v2/step.ts` и `src/io/fitting-json.ts`:
  валидация двух известных численных моделей, конечные SI inputs, atomic refusal.
- `src/runner/mining-metrics.ts`: дополнительные mission metrics; старые сохранены.
  `src/app/fitting-ui/conditions.ts`, `src/app/fitting-workspace.ts`,
  `src/fitting/session.ts`: новый default/экспорт/условия/воспроизводимость/сравнение.
  `src/app/fitting-ui/lab-view.ts`, `src/app/fitting.ts`: поля и видимые результаты,
  без удаления шести графиков, таблицы, журнала, фиксированного сравнения и файлов.
- M/HY owners и точные значения — неизменный medium contract; новая edition0.2.3,
  old45+5=50 SKU, old0.2.0/.1/.2 и authored local variants сохраняются.
- Никаких ворот, collision/IFCS, игрового автопилота, цен, обнаружения, переработки
  GDD, новых fuel species или UI из трёх экранов. Никакого merge/main update.

## Движение и события

Одномерная положительная координата участка0→distance; на обратном участке новая
локальная координата, масса остаётся фактической. c′=3000м/с; p=γmv.
Запрос march/retro идёт к установленным двигателям; impulse берётся из их
фактической `forceN:<instanceId>` telemetry, с учётом питания, защиты и запаса.
На coasting изменение массы не создаёт ускорения: пересчитать p из прежней v и
текущей массы до приложения импульса. Никакого отдельного списания топлива.

При constant m/F контрольная stopping distance = m·c′²/F_retro·(γ−1).
Контроллер учитывает изменяющуюся массу/доступную тягу и выбирает торможение до
конца пути. Нельзя «достигнуть станции» принудительным обнулением v или перемещением
при исчерпании топлива. Пробный прогноз шага не коммитит расход/тепло дважды.
Допустимое численное совмещение последнего event: ошибка позиции≤1м и скорости
≤0.1м/с при наличии реального тормозного импульса; event должен сходиться по шагу.
Если торможение/питание потеряно, показать незавершённый/невозможный рейс и настоящий
state, не unload. Max — максимально доступная тяга до момента нужного торможения,
без заданного cruise cap; остальные caps — V_FA×1/2/3/4, editable lab V_FA500м/с.

Событийные состояния: outbound → approach → mining → inbound → service.
Outbound/inbound содержат acceleration/coast/braking. Approach10с — местная
операция без поступательного перелёта; lab requests strafe=.1/turn=.1, не march=1
в стоящем корабле; пометить эту манёвровую гипотезу в spec/provenance/журнале.
Нулевое время approach/service допустимо; нулевое расстояние пропускает обе
flight legs и не создаёт тягу/расход на них. Mining requests — выбранные лазеры,
не фиксированная duration. До полного совместимого рудного трюма либо остатка
delivery target; временное gate recovery продолжает миссию. First-stop policy:
первое полное прекращение выбранной группы после запроса work, включая невозможность
начать из-за heat/power, либо fullhold; частичное throttling — только limiter.
При необратимом resource stop default допускает возврат с добытым грузом.
Без лазеров/compatible ore hold run readiness объясняет причину, не зависает.

Service запускается только после физического возвращения к станции; unload/refuel
коммитятся в конце10с, не на входе. Добыто = сдано + на борту (initial cargo0).
Баки до capacity, cumulative received separately; батарея и T не сбрасываются.
Repeat=false завершает один рейс; repeat=true — horizon/доставленная цель.
Горизонт посреди участка сохраняет незавершённое состояние, груз и запасы.

## Реализация — проверяемые шаги

1. Developer RED tests `tests/fitting/mission-flight.test.ts`: constant force
   analytic relativistic acceleration/braking, no-thrust mass change, triangular
   short trip/capped coast, unequal march/retro, depleted fuel/no arrival.
   Реализовать flight helpers и контроллер на реальной telemetry; GREEN.
2. RED `tests/fitting/mission-cycle.test.ts`: empty/loaded actual masses,
   fullhold variable duration1/2/3 lasers, first-stop vs partial loss, recovery,
   distance0, target smaller than hold, repeat/refuel/service endpoint/horizon.
   Реализовать makeMissionRun + tag dispatch/validation/metric events; GREEN.
3. RED `tests/fitting/mission-io.test.ts`: spec/result round-trip, active/next,
   invalid input atomic refusal, old .0/.1/.2 replay digests identical.
   Новые поля distance/speed/stop policy входят в сравнение условий; масса/число
   лазеров/ёмкость разных fit — переменные сравнения, не причина запрета.
   В mission comparison начальные запасы сравнивать по fractions, не kg двух
   разных баков. Старое сравнение timed experiences остаётся прежним.
4. M/HY implement по уже PlanReady medium contract: data0.2.3/editions/validate,
   finite typed stocks, no hidden tank installation; unit positives/negatives.
5. UI: свежая сборка default mission H3600/distance100km/Max/fullhold/repeat;
   workSeconds/brakingSeconds/idleSeconds только для импортированного old timed
   опыта. Fullhold/first-stop selectors и speed; расширенные density/return/T/dt/
   labV_FA. Видимые сдано/добыто/на борту, SCU/hour и fuel/H₂ per delivered SCU,
   elapsed flight/mining/service/recovery, текущий участок, first limiter, peak v.
   Footer: «U2 Ship Fitting v2.2 · интерфейс v4 · каталог0.2.3».
   Native changing conditions→первое нажатие Start запускает Worker; никакого
   Tab workaround в новой цепочке. Достаточно сохранять stable event targets.
6. Developer normal guard/type/build/meaningful tests. Сходимость и замеры ниже.
   Immutable extracted dist/ZIP и source/blob manifest одним штатным рецептом.
   PM проверяет manifests/changed blobs, QA поведение; упаковку трижды не проверяют.
   Старые servers/artifacts сохранить; PM поднимает intermediate на свободном
   LAN порту по готовому extract, затем QA и один scoped Review.

## Verification Contract

| AC | Expected/edge/error и method |
|---|---|
| M01 | Свежий UI defaults по brief, hidden120s отсутствует; native conditions→Start с первого клика. Invalid distance/cap≥c′/dt≤0/NaN refuse atomically. |
| M02 | Fill time зависит от actual selected lasers/hold;1/2/3 cases плюс recovery/full first-stop, partial loss продолжает группу; deterministic step/event assertions. |
| M03 | По отдельности march и retro chemical/electric расходуют typed stocks/charge и дают своё тепло; фактическая тяга определяет trajectory. Analytic constant-m anchor relative≤0.2%; zero-thrust inertia; loaded/empty masses differ. |
| M04 | Нельзя unload/refuel вдали/на скорости; shortage/horizon сохраняют cargo/state. Negative depleted/zero propulsion fixtures и station v/position assertions. |
| M05 | Добыто=сдано+на борту; initial+received−consumed=remaining отдельно для diesel/H₂; repeat0/1, малая target, horizon в каждом участке; continuous T/charge. |
| M06 | Export/import numeric mission snapshots reproduces state/metrics; false-known roster B1 and invalid model/fields atomically refused; no current numeric recompilation. |
| M07 | Старые versioned fit/run/result legal/numerically unchanged, old timed mode clearly labelled; golden oracle/digests, fresh browser import. |
| M08 | LAN desktop1440 и touch390: edit M fit→first-click Start→pause/step/resume/cancel→restart→graphs/table/events→freeze A→edit B→compare→export→fresh open result без run. Navigation accessible while running; original continuous layout. No UI asset redesign. |
| M09 | Pony A/B/C H3600: A1laser+2cargo24, B2laser+1cargo24, C3laser+builtin12, one passive sig; near0/100km/far1000km results+timings recorded. No predetermined winning fit. Convergence default dt.1 vs.05/.025 on representative completed voyage and near limiter: delivered/mined/fuel within1%, arrival/mining events within0.5с and no different final stop outcome; choose smaller dt if fail. H3600 wall/steps + short baseline recorded, no unjustified12h matrix. |
| MF01–04/HY01–02 | Exact medium contract values/50SKU/provenance/versioned compatibility, compound CivilianM fixtures full mining+hydrogen cooling/hybrid, shared finite H₂ ledger, negative old E/size/class, native catalog M filter/install/run/export. |

Review Focus: arrival without retro; horizon during unload; no thrust mass loss;
known numeric snapshot vs forged roster; comparing different capacities/fit hulls.
Каждый риск имеет cases в шагах1–3 и соответствующую строку AC.

## QA/Review/finalize и rollback

Budget5 PRODUCT: Plan Review → QA → Code Review; оставшиеся два только affected
blocker fix. M contract Review уже проведён, новый Plan Review — только новый
mission HOW/VC и integration seam, не повтор thermal catalogue authority.
QA source = оба whole contracts + этот plan; signed case/AC/method/evidence table.
Scoped Review: changed mission runtime/IO/default/UI seams + M additions, named
risks M03/04/06/07. Не повторять broad catalog baseline и unrelated advisory.
Normal checks current HEAD, reviewed blob/content equivalence после импорта.
Rollback: прежние numeric tags/editions и immutable servers/artifacts остаются;
при blocker новый кандидат не становится final accepted, старые ссылки действуют.
Счётчик selfaudit PM_ERR/DOC_PR каждые3 завершённых Review/QA+triage.
Не закрывать work items по готовности плана. Acceptance означает реальные M
в каталоге и реально выполняемый рейс, с явными not-tested areas.
