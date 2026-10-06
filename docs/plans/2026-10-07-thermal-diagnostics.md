---
title: "Диагностика температуры — план и Verification Contract"
status: proposed
version: "0.1"
date: 2026-10-07
mode: PRODUCT
beads: ulab-6ty
---

# Температурная диагностика — Implementation Plan

**Goal:** ГД видит причину и размер ограничения сборки, обе температурные зоны
и честное предупреждение о влиянии температуры на тягу.
**Architecture:** наблюдатель над принятыми физическими шагами; sparse события
в существующем LabEvent и график из immutable resolved TTX. Физика неизменна.
**Tech Stack:** существующий TypeScript/Vitest/Playwright/Vite, без зависимостей.
**Spec:** [принятый WHAT](../product/thermal-derating-diagnostics.md), D01–06 U2.
Pipeline PM_ROLE имеет приоритет над дополнительными per-task reviews skill:
один Developer, Plan Review → QA → один scoped Review, budget 5.

> **Что видит игрок** — см. [ADR-0068, «Что видит игрок»](https://github.com/komleff/u2/blob/gd/thermal-derating-wear-20261007/docs/architecture/ADR-0068-Thermal-Derating-And-Wear.md#что-видит-игрок) (единый на пакет).

## Target → as-built → gap

thermalDuty уже зеркально линейна; protection/restart действуют. Износа нет.
LabEvent = time/kind/message; журнал/JSON/CSV уже сохраняют события.
Mission делает trial stepV2 для поиска торможения/границ: они не actual steps.
Текущая generic строка путает горячую/холодную сторону, не показывает выход и
может менять текст каждый tick при снижении заряда. График показывает только
минимальные верхние границы всех экземпляров, подписи 500/550 наложены.

## Scope и invariants

- Current mission и fitting Lab используют одинаковый diagnostic observer;
  Legacy получает адаптер имеющихся observed данных без нового kernel.
- mining% = сумма фактической полезной мощности выбранных лазеров / сумма
  запрошенной номинальной полезной мощности с η; не среднее процентов.
- generator capacity != governor load; zero request/disabled/cargo-full != thermal-stop.
- typed resource gate при положительном запасе != пустой бак; SOC не C-rate.
- Тяга: role/actual/request, предупреждение о разгон/торможение. Estimate только
  существующий stoppingDistance при current mass/speed/available retro force;
  условность оценки подписана, no-NaN/no-Infinity. Не создаём Newton-only модель.
- cooling/pump actual operation отличается от физической T⁴ поверхности.
- Один wear notice на эпизод; явное «численно не рассчитывается».
- Thermal transitions immediate; partial% updates при переходе к другой десятке
  процентных пунктов с защитой от дрожания у границы. Stable cause identity не
  зависит от каждого нового значения заряда. Episode state только внутри run.
- Только accepted-step events; observer не изменяет requested duties, шаг,
  trajectory, mass/energy/heat ledgers, stocks, cargo, station refill/charge,
  cycle boundaries, termination or first-cause ordering.
- Не меняем TTX, thermalDuty, protection/hysteresis, H₂ governor, wear physics,
  Unity/server, цены, режимы, layout всей страницы и старые обслуживаемые builds.
- Старые результаты читаемы без новых обязательных полей; предпочесть текущий
  LabEvent shape. Если новый optional observation неизбежен — finite/units,
  отсутствие в старом replay != fabricated measurement, invalid import atomic.

## File map и реализация

1. Developer: сначала meaningful failing tests и зафиксированный pre-change
   numerical oracle; затем минимальный observer/helper (новый runner module).
   Hook только real accepted step: `src/runner/fitting-run.ts`,
   `src/runner/mission.ts`, legacy `src/runner/run.ts`. Для промежуточного
   фактического thermal перехода допустим observational callback без изменения
   integration/decision logic. Не публиковать trial events.
2. Согласовать current limitation detail и журнал (types kind остаётся string).
   `src/app/fitting-ui/lab-view.ts`, `telemetry.ts` затрагивать по необходимости;
   export owners `src/io/fitting-result.ts`, `fitting-csv.ts` только если требуется
   для actual optional observations. Не вводить migration ради текста.
3. `src/app/fitting-ui/trace-chart.ts`: muted red/hot и blue/cold bands, четыре
   dashed labeled boundaries, читаемые nonoverlap labels. Lower=max, upper=min
   реально gated enabled operations + supplying tank gates. Exclude passive
   area/battery/cargo. При disjoint corridor предупреждение и индивидуальные
   маркеры, без misleading aggregate fill; empty без фиктивных чисел. Domain
   включает measured T и boundaries. Старый replay берёт saved resolved TTX.
4. Durable tests в `tests/fitting/thermal-diagnostics.test.ts`, graph tests по
   существующему UI pattern, browser regression в `tests/browser/fitting.spec.ts`
   либо отдельном thermal spec. Поднять candidate LAN host0.0.0.0, footer version.
5. Typecheck, affected tests, existing full unit/build/browser и обычный commit
   guard один раз на готовом пакете. Один bounded exact Pony run + hot Ermak
   control; не часовая матрица всех корпусов. QA против AC, scoped review.

## Verification Contract

| AC | Expected / error / edge | Method |
|---|---|---|
| TD01 = D01 | Hot/cold actual% + T/bounds/phase/module; weighted different η; no demand не ложное ограничение | Durable deterministic unit cases, replay one operator Pony cold / Ermak hot |
| TD02 = D02 | Partial→critical→restart→working; thermal+power/resource причинно верно при positive stocks; gen healthy part-load не fail; честный wear note | Unit synthetic transitions + run integration |
| TD03 = D03 | Requested propulsion roles, actual force, clear braking risk and conditional estimate; zero unavailable no NaN | Deterministic flight/log cases |
| TD04 = D04 | No trial events, sparse stable episodes, no false cargo/idle/service stop; run/pause/step/import/reset/A/B isolation | Chunk/step and episode unit + browser actual worker |
| TD05 = D05 | Both bands, 4 labeled colored boundaries; max low/min high; 200K visible; 500/550 labels separate; disjoint/empty/old replay | SVG assertions + desktop/LAN touch-width visual smoke |
| TD06 = D06 | Numeric pre/post equality and ledgers/stocks/cycles unchanged; event text survives JSON/CSV; invalid import remains atomic | Frozen pre-change oracle + exports/imports + current full regressions |

## Review focus

Trial events, wrong mining denominator, hot/cold confusion, positive-stock false
exhaustion, generator-demand confusion, event storm, shared-run state, invalid
aggregate corridor and numeric perturbation. Advisory does not expand scope.

## Ownership, evidence, rollback

U2 docs in separate `gd/thermal-derating-wear-20261007` PR; Lab stacked draft
`feat/thermal-diagnostics` from e4d3926 against `feat/ship-fitting-mission-medium`.
U2 canon sync и узкая test-fixture isolation reviewed with this plan;
Unity/server runtime не изменяется.
One Plan Reviewer gets both exact packages; QA/scoped Code Reviewer get AC and
changed runtime paths. Reviewed blob binding + explicit NOT RUN suffice; no
repeated giant provenance artifacts. Self-audit every 3 review/QA+triage/fix cycles.
Owned4189 remains current until candidate verified; rollback immutable station86,
old4183/4186/4188 kept. Revert observer/UI changes restores pre-feature behavior.
Operator merge; base PRs remain open, no auto-merge/main mutations.

## Обязательная совместимость проверки U2 — уточнение до DEV

Штатный U2 dispatcher экспортирует суженный budget в дочерний npm test.
`scripts/tests/commit-gate-timeout.test.sh` ошибочно принимает этот inherited
крючок за default собственного sandbox и краснеет (568 вместо570), даже когда
parent limiter работает правильно. Блокер commit необходимо устранить в fixture:
снять **только унаследованный** U2_COMMIT_GATE_TEST_MAX_SECONDS внутри этой
тестовой единицы до её sandbox probes. Её явные 1/99999/invalid override cases
остаются, все assertions и parent hook/timeouts неизменны. Это test isolation,
не bypass и не увеличение лимита. Один Developer, отдельный малый commit в U2
пакете; doc-only означает отсутствие Unity/server runtime, test fixture указать
явно. Proof: RED existing unit при inherited568 → GREEN corrected unit при
inherited568 и обычном environment; после этого normal dispatcher/full suite.
Для macOS Bash3.2 использовать LC_ALL=C/LANG=C для verification: это устраняет
неверный разбор UTF-8 пунктуации без изменения hook. Installer/guard overrides
не нужны. Scope review включает только этот test-isolation delta и неизменность
внешней защиты; не общий pipeline redesign.
