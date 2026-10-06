---
title: "Verification Contract — Claude Design UI v2.1"
status: active
version: "1.0"
date: 2026-10-06
related:
  - docs/product/claude-design-ui-v0.2-acceptance.md
  - docs/ux/claude-design/ship-fitting-power-heat-ux-v2.1.md
  - docs/verification/ship-fitting-v0.2-contract.md
---
# Приёмка интерфейса

Source: accepted UX v2.1 §§1–12/UC01–17, token snapshot, exact mock packageabbd2943.
Существующий SF01–20 задаёт правила чисел/совместимости/snapshot; эта VC — affected UI
surface. Полный рейс/добыча до заполнения/заправка явно отложены оператором.

| ID | Источник | Expected / error / edge | Method |
|---|---|---|---|
| UI01 | UX4.1/5.1/7 | Fitting↔Lab↔Compare сохраняют выбранную сборку, результат, active test identity и frozen A; нет лишнего Worker/start/reset | actual browser navigation, observe Worker command and data |
| UI02 | UX4.2/9, SF17 | F1 видна при прокрутке, состояния no-test/running/paused/complete/task-not-finished/cancelled текстом; кнопка действует по состоянию; incomplete reason рядом | browser states; scroll/touch |
| UI03 | UX4.3/4.4, SF01/05/06 | Six-hull preset updates actual passport/slots; mass/C/cargo/nominals match compileFit; DEMO values/manufacturers не выдаются за каталог | source-derived compile oracle for S/M/L |
| UI04 | UX4.4/11.5 | Ring использует все категории и builtins, min18°/44px, сектор по количеству; insufficient space/column<440/phone→flat; slot click same dialog | layout function boundary + browser S/L/390px |
| UI05 | UX4.6/4.7, SF03 | Встроенное в собственной группе, замок/read-only и отдельный count; не занимает/removes slot; разные экземпляры и slot/item sizes различимы | all6 hulls counts and actual readonly interactions |
| UI06 | UX4.8/UC02–04, SF02/16 | Search/filter/sort compatible table, explicit refusal, whole-ship now/after preview; cancel/Esc no change, apply/remove one revision | catalog swap browser + compile/validation oracle |
| UI07 | UX4.8/7, SF16/17 | Batch payload targets only removable slots; preview all affected; success atomic+1revision; any refusal preserves completefit/revision/result/frozenA | positive batch + mixed/invalid target unit/browser |
| UI08 | UX4.5/4.10/9 | A/B/C/+ variants independent; switch discards only uncommitted candidate; stale own result never current/foreign; frozen test A immutable; oneglobal test identifies owner | workspace boundary tests + running variant switch |
| UI09 | UX5.3/5.4/UC06/11, SF17 | Start/Pause/Resume/Step/Cancel confirmation/Reset/speed real Worker; locked active conditions; fit edit nextrevision; cancel preserves partial interval; old chunks/ACK ignored | actual Worker + state/command tests |
| UI10 | UX4.7/4.9/5.5/9, SF12–14 | Metrics/cards use current result/identity; prior/stale/preliminary/time windows labeled; undefined denominator/zero/no-recovery/no-limit handled; selected-group K unchanged | seeded real results + direct metrics oracle |
| UI11 | UX4.10/M2-Compare, SF15 | Variant compare shows actual SCU/cycle/hour,K,typed fuel/limiter, condition differences and sorting; no invented overall score | equal/different conditions+missing/current/stale result |
| UI12 | UX5.6/LabM-Channels, SF19 | Energy/heat/stocks/work channels, requested dashed vs delivered solid, legend/button time selection/table units/textsummary; retained mean/min/max/count honest | actual captured trace and timestamp/bucket oracle |
| UI13 | UX5.7/5.8, SF05/09–11 | Instance card actualID/origins/material bill/energy/heat/resource; event filters/cause/time/instance inclpropulsionShortfall; dropped/count accurate; no DEMO fallback | real sample snapshot/channel/event and source selection |
| UI14 | UX5.10/UC12, SF15 | Frozen A/B table/difference and plot same fields; exact identical-conditions check; freeze/current edit/reset does not mutate A | original compare API + browser frozen provenance |
| UI15 | UX5.10/UC13, SF18 | Fit/run/result/CSV export existing formats; malformed/version/numeric import preserves last validfit/revision/result/A/active snapshot; supported legacy route/replay explicit | existing8invalid input variants + actual import/download bytes |
| UI16 | UX11.7/6 | Modal focus trap/Esc/return; touch44px, group aria-expanded, graph textsummary, button time navigation; critical function accessible390 and tablet without hover | keyboard/touch browser; no horizontal pageoverflow |
| UI17 | UX10/11, Main/Lab/mobile | Source layout hierarchy/colors/fonts/spacing/readonly hatch and desktop→mobile relationships implemented; all runtime assets local; visualsource no support.js/privatecanvas dependency | finite rendered screenshot/source inspection+assetrequest list |
| UI18 | SF18–20, namedLANregression | numerical/catalog/runner/scenario/io/legacy source untouched; existing unit/replay/build checks pass; immutable extracted artifact localhost+ordinary LAN IP secure=false+HTTPSprefix real Start/control/IO, noerrors/404 | Gitblob equivalence + guard + 3origin smoke |

# Инварианты и границы

- Тест привязан к owner variant, fit revision, immutable RunSpec и runId; навигация/рендер
  не меняет эти поля. Некорректный импорт или batch не меняет любое из прежних данных.
- Совместимость/readiness вычисляются существующими validators; warning нулевого
  operating resource не превращается в structural error. Число сменных слотов не растёт.
- SCU = м³; существующие actual model metrics/units/interval labels сохраняются.
  Нет попытки пересчитать K_use по включённому времени или вывести реальную ETA.
- DOM text uses escaped/textContent values; malicious label/import stays literal.
- Только локальные assets относительно root/prefix. HTTP не зависит от secure-only APIs.
- Numeric/model/worker/schema changes outside scope — остановка и запись отдельного
  finding, не исправление «заодно» после явного operator defer.
- Screenshot сравнение подтверждает перенос раскладки, не создаёт separate review cycle.
  Второе физическое устройство/native/publicdeploy/base gates показываются отдельно.

# Evidence

QA: Test case | Source AC | Method | Result | Evidence; exact SHA/build, source paths+blobs
и whole VC canonical SHA256, role/model, PASS/FAIL/NOTRUN. Developer tests — не replacement.
Один scoped Reviewer с именованными UI рисками. Advisory не mandatory fix.

После metadata/rebase deterministic checks на текущем HEAD. Source fingerprints проверяются
по actual Git blobs и relevant whole contract text; old result valid только для unchanged
reviewed surface. Положительный verdict не означает base-bootstrap acceptance/main merge.

