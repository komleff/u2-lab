# Independent adversarial PLAN_REVIEW — round 1

Verdict: **CHANGES_REQUIRED**. Это review продуктового плана; установка OverGate и реализация
лаборатории этим отчётом не сертифицируются. Report authored independent Reviewer, retained PM.

- Mode: PLAN_REVIEW
- Role: independent Reviewer
- Model: actual provider/model ID недоступен; предполагаемое имя не подставлено.
- Commit: a62d27cde9d7351f68192f3de380a0db08ac66b9
- Committed plan root:2ac44830ce1b51506f818f26aa56f28a83689e28
- Trusted source: OverGate v4.0.0-rc.1 /633937250fa8f47b49f928c1d8781ab17fe8c8e3
- Source: product/power-heat-lab-v0.1.md, verification/power-heat-v0.1-contract.md
- PRODUCT budget5; independent launch1.
- Content-Fingerprint:a9d712382685aede65d27c3774200c6dd67bd1bf39b5f19d523bfdd0331e7ba6

Это недостатки спецификации реализации и проверки, а не заявления о найденных ошибках
существующего runtime: runtime отсутствует.

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| B1 | IMPORTANT | [BLOCKER] Не закреплены отдельные fuel stocks и общий бюджет одновременно использующих H₂ устройств | docs/plans/2026-10-05-u2-lab-launch.md:69–72,100–110 | fix now | P3/P4/P6; фактический cryotank обязателен |
| B2 | IMPORTANT | [BLOCKER] Background floors проверяются на входных границах, но не защищены внутри шага | docs/plans/2026-10-05-u2-lab-launch.md:115–127 | fix now | P7; достижимый расход ниже reserve |
| B3 | IMPORTANT | [BLOCKER] Bounded chunks не ограничивают память телеметрии и очередь UI длинного опыта | launch:133–146; verification:19,40–41 | fix now | P10; long-run responsiveness не имеет resource boundary |
| B4 | IMPORTANT | [BLOCKER] Не заданы обязательные положительные знаменатели/шаг и допустимые initial stocks | launch:67–81; verification:21 | fix now | P3/P5/P9/P12 |

## B1 — ресурсы и совместное исчерпание

ShipConfig содержит несколько fuel tanks, но ModelState обозначает только fuelKg, без
закреплённого соответствия tank/species/consumer. При этом продукт требует расход H₂ из
фактического power cryotank (product:39). Отдельные тесты cooler и generator не доказывают
отсутствие двойного расхода общего остатка.

Контрпример: в одном H₂ tank остался1kg; generator/cooler в том же шаге каждый запрашивают
0.75kg. Независимый clamp допускает1.5kg оплаченной работы из1kg либо порядок обхода меняет
generation/cooling/heat. Diesel и H₂ также нельзя смешать в единый неидентифицированный stock.

Минимальная правка: stocks по tankId/species и consumer references; единый actual-flow budget
каждого бака для generation/direct thrust/cooling с политикой из current owner. Simultaneous-
depletion fixture: sum расхода = decrease этого tank; electrical output/thrust/cooling/waste
heat следуют реально выделенному fuel. Не придумывать новую игровую priority policy.

## B2 — floors внутри dt

resolveDispatch получает state, но не interval; kernel ограничивает stocks/capacity, а
reserve limits в его contract не закреплены. Tests 79.9/80/80.1% проверяют начальные точки,
но не crossing floor за время шага.

Исходный counterexample Reviewer: Qmax1000J/Q801J/bg100W/dt1s/no source/no Active;
start-state проверка допускает расход до701J, хотя над80% всего1J. Аналогично fuel20.1%
до19.6% и thermal10K crossing. Минимальная правка Reviewer: interval-aware background
allocation после protected/Active/recovery либо reserve invariants coupled kernel;
within-step fixtures для трёх floors, Active вправе тратить ниже background floor,
thermal feasibility учитывает actual cooling и электрическую цену.

**PM clarification к этому counterexample:** canonical Background вообще не намеренно
тратит battery stock; питается свободной генерацией. В no-source fixture ожидается0J
Background, не1J до80%. Это не отменяет необходимость within-step eligibility/fuel/thermal
guards, но не разрешает новый battery-spending режим. Уточнение передано тому же Reviewer
для affected re-review; исходный finding сохранён как история, не молча переписан.

## B3 — память длинного опыта

Bounded chunks ограничивают непрерывный worker compute, но не RunResult/message/chart/event
накопление. Retention/backpressure и поддерживаемый worst-case run не объявлены.
12h/dt0.01 →4,320,000 ticks;64 numeric channels ≈2.21GB плотных Float64 до объектов/UI copies.
Начальный interaction smoke может пройти, а целевой long run потеряет вкладку/UI.

Минимальная правка T4: bounded telemetry/chart retention, queue cap и incremental metrics;
cadence/export semantics не меняют kernel dt/replay. Concrete12h fixture с dt/catalog/channel
count, limits samples/queue; controls проверять после накопления. Не новый backend/feature.

## B4 — numerical input guards

Nonfinite/negative fixtures не покрывают dt0, C_ship0, Qmax0 и initial overfill.
dt0 не продвигает время; C0 делит на0; Qmax0 делает SoC неопределённым; buffer overfill создаёт
искусственное cooling. Ошибка должна быть path+reason до старта, не runtime crash/hidden clamp.

Минимальная правка T1/P12: finite dt>0, positive finite duration/Qmax/C_ship, absolute temperature,
initial stocks в resource bounds. Zero optional parts допустимы при valid aggregates.
Compact rejection fixtures без произвольных ограничений ТТХ.

## ADVISORY — не расширяют обязательный scope

- A1 numerical norm (verification:28–30): явно combine absolute/relative, zero net energy
  возле equilibrium требует определённой нормы. Triage Reviewer: reject with rationale —
  инженерная детализация DEV внутри принятого tolerance, не новый gate/ужесточение баланса.
- A2 environment attribution (launch:73–74): scalar background/solar должны сохранять constituent
  source attribution. Triage: reject with rationale — single-count уже обязателен P8/T2,
  отдельную feature не добавлять.
- A3 matrix (launch:169–171): воспроизводимая выбранная матрица, не полный Cartesian product.
  Triage: reject with rationale — where meaningful уже разрешает меньший scope.

По остальным направлениям scalar power/shared T согласованы; одно kernel ownership,
no-generator/chemical/cooling power/sign-changing radiation/cargo-stop/repeat state/stale runIds/
equal-task vs own-sortie A/B/provenance/rollback отражены. New systems не требуются.
Incomplete S/M правильно отложены в T1 с provenance/gap gate; это не approved preset до заполнения.

Отдельная execution dependency: B0 blocked real Draft PR/inventory/approval, план признаёт
это; не скрытый product defect. Report **не install PLAN_READY**, managed apply не разрешает.

## Reviewed-Paths / fingerprint

```text
.memory-bank/activeContext.md 0c306224d8d5fbe0533ffa19f7f86a79b0a2e2af
.memory-bank/progress.md 71363abdfa415d8cd23ec13eb0a03053cfb940da
AGENTS.md b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0
docs/INDEX.md adf155d23ff12cbc4104adce861636d74ca1ff02
docs/architecture/source-authority.md e75be660520826e1cdc09d98d25af04089421be1
docs/architecture/u2-source-inventory.json 4f9597b66d49fb05701a8e92f941ba1e6e4caa98
docs/plans/2026-10-05-u2-lab-launch.md 1d2b2b5cfbad6eeb5f71ce5ad9e6d654b99b8679
docs/product/power-heat-lab-v0.1.md 7fb875dc5b4a7c34ae13ba2e9c297c57c42103ba
docs/verification/power-heat-v0.1-contract.md bb2888fc58948f9662cee7d0fcf680a173940475
```

Hash input: sorted UTF8 `path SP gitblob LF` + exact LF-normalized VC bytes без marker lines.
VC8180bytes, SHA2565e601f1f15ba2f370893883b73738d6623efc81e990fb432955b24de11eed45f.
Frozen RV/PM/current ADR прочитаны как policy context, не target package.

Verification: diff whitespace PASS; HEAD и unchanged reviewed docs проверены перед report.
NOT RUN: runtime/model/browser/LAN; U2 full owner contents против inventory; actual SKU data;
installer inventory/apply; CI/remote PR/hooks activation/pipeline runtime/implementation.
Reviewer не менял файлы и ничего не публиковал. После B1–B4 нужен affected re-review в той же
verifier session, без нового полного аудита.
