---
title: "Станция: управляемая заправка и полная зарядка"
status: proposed
version: "0.1"
date: 2026-10-06
mode: PRODUCT
beads: ulab-558
---

# Заправка и зарядка — краткий контракт и план

Goal: ГД включает/отключает пополнение ресурсов станции и сравнивает автономность
одного фита при полном восстановлении запасов между реальными рейсами.
Прямое поручение оператора: галочка «Заправлять и заряжать», полная зарядка
аккумуляторов на станции аналогично существующей заправке.
Это отдельное принятое дополнение к v2.2; исходные mission/M contracts и подписанное
ревью не переписываются. PRODUCT; budget5, один Developer/QA/scoped Reviewer.

## Поведение и граница

В новых опытах галочка включена. После реального возвращения и окончания заданной
фазы обслуживания станция разгружает трюм, доливает каждый установленный топливный
контур до его ёмкости и заряжает суммарную батарею до ёмкости. Выключенная галочка
оставляет только разгрузку: топливо и заряд продолжаются после обычной физики
обслуживания. Вдали от станции, до окончания обслуживания или при horizon внутри
него пополнения нет. Температуру, теплоёмкость, буфер и накопленный расход не
сбрасываем. Без бака/батареи соответствующее пополнение равно нулю.

Заряд — явное станционное пополнение, а не бесплатная генерация корабля.
Received station electricity показывается отдельной накопленной величиной вGJ.
Не разрабатываем кривую зарядки/береговую мощность/КПД/новое тепловыделение:
это такой же лабораторный endpoint-service abstraction, как текущая полная
заправка за заданную фазу. Подпись условия поясняет это. ТТХ модулей не меняем.

Исторические сохранённые mission1/.3 без новой настройки воспроизводятся в
прежнем режиме: только топливо, без береговой зарядки. Отсутствие поля не
переинтерпретируется в новое ON. При открытии такого опыта показывается явная
пометка старого режима; запуск/экспорт исходного снимка сохраняют его semantics.
Новый редактируемый опыт получает явное значение галочки при изменении условий.
Старые numeric.0/.1/.2, каталог/фит и Worker protocol сохраняются.

## HOW

1. Один необязательный mission flag; свежий builder явно записывает ON, validator
   требует boolean при наличии, отсутствие принадлежит legacy fuel-only.
   Condition readback, RunSpec/export и сравнение условий сохраняют различие.
2. Только endpoint finishService применяет выбранное пополнение. Received chargeJ
   сохраняется в mission state/metrics/result, в event видно actual fuel/charge
   поступление, а перед следующим вылетом charge-related last telemetry обновлена.
   Никакой подмены kernel source/consumed ledger/температуры. Старый импортированный
   результат с отсутствующим receivedCharge имеет legacy zero, без silent mutation.
3. Checkbox рядом с repeat/service в существующем Lab; компактная строка полученной
   энергии в результатах. Active vs next spec и frozenA независимы, на LANtouch390
   первый tap сохраняет актуальную галочку и остальные условия.

Current owners: src/scenarios/mission.ts, src/model/v2/types.ts,
src/model/v2/step.ts (validation only; numeric body protected),
src/runner/mission.ts, src/runner/mining-metrics.ts, src/io/fitting-result.ts,
src/app/fitting-ui/conditions.ts, src/app/fitting-ui/lab-view.ts,
src/app/fitting-ui/result-context.ts и фактические workspace callers при необходимости.
Не вводить новую подсистему/модельный tag/конвертер/сервис хранения.

## Приёмка / Review Contract

| AC | Expected и метод |
|---|---|
| ST01 | Свежий опыт ON; OFF/ON readback, started spec/native export совпадают с выбранным условием; правка next не меняет RUNNING/A. Короткий LANtouch390 Worker workflow. |
| ST02 | Actual completed station service: cargo0, каждый fuel=capacity и charge=capacity; receivedFuel и receivedCharge равны фактическим доливам после service physics. Independent short direct runner + endpoint state; no T/buffer reset. |
| ST03 | OFF разгружает и считает цикл, но не доливает ничего; no-tank/no-battery и full stocks дают0 received, без отрицательных/NaN. Negative controls. |
| ST04 | Horizon посередине inbound/service не телепортирует пополнение; наступает только endpoint и однократно. Zero phase repeat остаётся bounded, passive recovery не заменяется fake charge. |
| ST05 | Old mission snapshot absence = fuel-only/noCharge; old result импортируется без смены semantics, old numeric bodies/goldens untouched. Explicit malformed flag/received charge reject; current export/import roundtrip. |
| ST06 | Различие station policy объясняет несопоставимость условий; received station GJ отдельно в результатах/JSON, расход топлива/электрическая работа не обнуляются; frozenA не меняется. |

RED/negative controls — до реализации; затем meaningful targeted unit/browser,
один обязательный normalguard. QA по шести AC короткими runner/native измерениями;
не повторять QA15/девять H3600/ZIP+17assets proof. Один scoped Code Review по новым
resource, backwards-compatibility и active-owner boundaries. Finding triage строго
по AC; advisory не расширяет scope. Только при blocker affected QA/re-review.

Поставка: PR9 Draft остаётся base-dependent; accepted plan в PR до Developer,
immutable build на прежнем4189, старые большие версии сохранены. Local acceptance
не означает operator merge/native/bootstrap/public acceptance. Rollback — вернуть
предыдущий immutable d57 snapshot на4189; старые exports и docs не удаляются.
