---
title: "Ship Fitting v0.2 — Verification Contract"
status: draft
version: "0.2"
date: 2026-10-05
beads: [ulab-73w]
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
  - docs/plans/2026-10-05-ship-fitting-v0.2.md
---

# Приёмка Ship Fitting

Source WHAT: [GDD](../gdd/gdd_u2_ship_fitting_v0.2.md), current U241-source manifest
и решения оператора2026-10-05. Новые lab details пока proposal; independent review
проверяет непротиворечивость и проверяемость, не утверждает WHAT вместо PO.
Scope: mining fitting laboratory; SI внутри, понятные units снаружи.

## AC и проверяемые контрпримеры

| AC | Expected / error / edge behavior | Метод и owning task |
|---|---|---|
| SF01 | Шесть профилей с current Payload/builtin cargo; Pony встроенный лазер/12SCU/12t diesel tank/Power3×S/G0 UNKNOWN. Каждый ready preset имеет все четыре propulsion roles и аккумулятор; вся numeric bill полна и конечна | Catalog data check, presets integration; T1/T2 |
| SF02 | Ровно одно изделие/slot; category, caliber, single/pair и resource architecture проверяются. Smaller-fit разрешён. Нельзя поставить третий сменный лазер в S2×S; Pony3total и M3swappable разрешены, L3+hold разрешён | Domain positive/negative unit; T2 |
| SF03 | Built-ins видны, не снимаются, free slots не потребляют; duplicate SKUs независимы по ID/state. Неполный fit сохраняется, readiness отличается; missing mandatory закрывает Run. Generator optional, аккумулятор mandatory; zero stocks показывают warning и реальный resource failure | Domain/UI tests; T2/T5 |
| SF04 | Diesel/H₂ direct propulsion homogeneous; все четыре powered engines одного propulsion type. Electric≠energy architecture. Diesel+H₂ utility допустим только с реальным Power cryotank и разрешающими slots/architecture; E/A не приобретают fuel. XL Reactor не монтируется в L, XXL неактивен | Table-driven compatibility; T2 |
| SF05 | Dry mass и C=Σm·cp точно соответствуют material bill каждого installed/builtin изделия один раз. Fuel/cargo contents только current mass. Add/remove battery/generator/buffer/radiator/cargo меняет свои реальные sums; builtin cargo mass не0 и не спрятанная масса съёмного SKU | Numerical bill/property fixtures; T1/T2 |
| SF06 | Current cargo1.7 values, SCU=м³; mixed cargo: сумма universal allocations≤U, specialized volumes только compatible. Density даётkg. Full compatible cargo останавливает mining, unload освобождает cargo без refuel/charge/cooling reset. Payload liquid никогда auto-fuel | Cargo unit and simulation boundaries; T2/T4 |
| SF07 | Scenario requests называют instance/propulsion role; approach не включает retro/strafe/turn. Неизвестный ID, duty вне[0,1], zero/negative phase duration, repeated empty cycle отклоняются. Work duty0 не starvation | Schema/kernel tests; T3/T4 |
| SF08 | Electric actual force пропорциональна delivered bus и command/gate, при power0 force0; не создаёт mining output. Direct drive расходуетαF typed fuel, source energy и exhaust/host ledger закрыты. Useful mechanical energy не учитывается вторым beam output | Isolated energy test, mixed-load deficit, direct regression; T3 |
| SF09 | При двух/трёх laser duplicates actual beam равен actual delivered energy×η, typed output только mining.3×CivilS nominal9MW не получает9MW от8MW generator без finite battery withdrawal. Partial power делится deterministic governor policy, без stacking penalties | Analytical case and shared-deficit run; T3/T4 |
| SF10 | LAB-ORE-01:24MJbeam/SCU, factors1, density1500kg/m³, return0.35. Один fully powered CivilS/G1:0.0625125SCU/s. Beam return входит в host и вычитается из external useful output один раз; finite tank/buffer/accumulator и within-step bounds сохраняются | Kernel analytical/dt refinement; T3/T4 |
| SF11 | Diesel/H₂ shared stocks для generator/engine/cooler не клонируются; sums consumers≤actual stock. Signed radiation и thermal gates/restart/finite inverter rejection сохраняются; hotter background не «охлаждение». No freeC from contents | Existing invariants + selected new fixtures; T3 |
| SF12 | SCU/cycle и SCU/h подписывают точный интервал; unfinished cycle не получает invented completion. kg/SCU по species и назначениям; H₂cooler — subset общего H₂, не второе слагаемое. Extraction0→N/A. Planned transit/service отделены от forced downtime, de-rating показан отдельно; missing recovery→«не восстановился» | Exact metrics fixtures; T4 |
| SF13 | K_use фиксированной selected group∈[0,1]; 0group/time→N/A. Transit/service входят в cycle duration; manual off/duty не уменьшают denominator. Partial horizon отдельный K. Значение показывается рядом с абсолютной добычей, нет общего рейтинга всех ролей | Integral oracle, UI labels; T4/T5 |
| SF14 | First limiter — earliest actual requested mining loss; ties≤physics dt сгруппированы, target reached не blocker. Resource exhaustion без потери work остаётся resource event. Overlapping cause durations не суммируются100%; no event→«не выявлено за опыт» | Deterministic event/metrics fixtures; T4 |
| SF15 | Same-task1/2/3 series сохраняет hull, ore/environment/phases/service rules/horizon и объявленные initial stock. Added laser mass/heat не скрыты. Changed conditions отмечены как non-comparable. Repeated cycle не reset; sensitivity endpoints cargo mass/cp/ore density/return heat явны, не probability | Matrix JSON + paired UI test; T4/T5/T7 |
| SF16 | Preset→slot→swap без JSON; side-by-side delta до применения, отказ объясняется; builtin/removable разделены.390px touch/keyboard, no hover/drag dependency. Empty/error сохраняют последнюю валидную конфигурацию; fields F3 имеют units/provenance | Playwright DOM,390px smoke; T5 |
| SF17 | Edit creates next fitRevision; running/resolved A snapshots неизменны. Start/reset/import меняют runId; stale chunks/acks/results не меняют новый run. Pause/Step/Cancel acknowledgments≤500ms и не требуют telemetry ACK; не более1 unacked telemetry chunk | Protocol unit + Worker browser; T5/T7 |
| SF18 | Fit+run export содержит versions/resolved SI snapshot/instance IDs/conditions/origins. Known v1 остаётся exact legacy numeric experiment/model; не объявляется slot-valid v2. Unknown model/schema reject; unknown catalog с trusted supported numerical snapshot only explicit snapshot replay, не validated fit. Failed import не удаляет предыдущий fit/result; labels выводятся текстом | Versioned roundtrip/security/legacy fixtures; T6 |
| SF19 | Worst bounded curated fit12h: retention≤50000buckets/128MiB, events≤20000(first128+last19872), actual heap check; aggregation/cadence/channel count видны. Metrics не выводятся из потерянных raw events или downsampled peaks. Export units correct permodule/mining/currentmass | Retention/performance/peak +12h kernel; T4/T6/T7 |
| SF20 | Fresh clean build/test/typecheck/browser pass; ordinary LAN HTTP и Pages HTTPS/prefix same-origin work. Old0.1.1 fix не потерян. Second physical device/native/bootstrap acceptance отдельно и честно NOT RUN если нет evidence | Build/actual extracted dist/browser prefix+HTTP; T7 |

## Numerical agreement

Exact authored constants/metadata сравниваются точно, derived bill relative tolerance1e−8.
Одно-step analytic energy balance: residual≤max(1e−3J,1e−8·sourceEnergyJ).
Short repeated run: integrated residual≤max(1J,1e−6·cumulativeInputEnergyJ).
dt refinement0.01/0.005/0.0025s для finite depletion/gate/cargo/return cases:
разница useful SCU≤1%, event time≤largest dt плюс совпадение first cause/tie semantics.
Если near-simultaneous причины меняют порядок в пределахdt, вывод остаётся grouped,
а не подменяется уверенным одиночным ограничителем. Tolerances не ослабляются ради PASS.

## Совместимость и границы evidence

Baseline feature commit `6fb7166513627941e2ba2c4a9a01c79ae1667820`:0.1.1 LAN fix имеет
affected QA PASS/scoped APPROVED. Public Pages пока0.1.0, separate deployment не сделан
в design stage. Prior12h evidence для старого model не является новым fit12h acceptance.
Bootstrap/native/operator merge и физическое второе устройство остаются отдельными gates.
Старые P1–P14 не меняются для legacy model; новый model проверяется SF01–20 и переносимыми
energy/retention/protocol invariants. Устаревший cargo/laser anchor нельзя менять внутри v1.

## Review Contract текущего этапа

**Mode:** PLAN_REVIEW, PRODUCT, один independent Reviewer; бюджет5 unique verifier launches.
**Goal:** adversarial design audit + audit implementation plan, до runtime work.
**Acceptance surface:** GDD§1–10, source synthesis/manifest, этот VC целиком и planT1–T7.
**Changed runtime surface:** нет; runtime/source/test blobs равны baseline.
**Named risks:** ошибочная source authority, builtin double count/freeC, optimistic mining
при power/heat/cargo deficit, fictional electric ledger, legacy reinterpretation/data loss,
retention growth и freeze при delayed ACK, неопределённые сравнительные метрики.
**IN:** source fidelity/accepted vs proposed WHAT, slot/cargo/model/metrics correctness,
AC coverage, dependencies, ownership, rollback, меньший безопасный scope.
**OUT:** bootstrap governance re-audit, deployment/merge, invented complete U2 production
recipes, whole game balance/flight/market/sensor systems, runtime QA до реализации.

Reviewer выпускает отдельно результаты «дизайн» и «план» в одной verifier session;
общий PLAN_READY только если BLOCKER=0 в обеих частях. Advisory не расширяет scope.
Blocker fix→affected re-review той же session. PM публикует неизменный signed report в PR.

Каждый отчёт: actual role/model (если ID недоступен, так и написать), commit, explicit
reviewed paths, blob hashes + entire VC text fingerprint(SHA256 canonical JSON
`{blobs:[{path,blob}],contract:{path,text}}`, UTF-8, sorted keys, no extra whitespace),
verdict/BLOCKER/ADVISORY/not-reviewed surface. Пути в blobs сортируются по path.
После metadata landing совпавшие fingerprints сохраняют evidence; новое source/WHAT
изменение требует только affected review. QA позже: case|sourceAC|method|result|evidence,
один scoped Code Review после QA. Этот planning PR не удостоверяет runtime completion.
