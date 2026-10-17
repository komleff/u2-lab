# Первая матрица опытов v0.1

Опорные S/M — экспериментальные configurations из `parameter-intake.json`, не approved SKU.
Стандартный kernel `radiative-host-ledger-0.1`, catalog `intake-0.1`, SI units. Default dt0.1s;
специальный long replay dt0.01s. Ни cargo, ни fuel contents не увеличивают C_ship.

`first-matrix-results.json` содержит фактически выполненные24 опыта: S/M × cold/hot/solar/EM ×
work/idle/full-thrust stress ×300s. Fixtures/числа/тестовый способ находятся в
`tests/matrix.test.ts`; output capture выполняется переменной `U2_MATRIX_OUTPUT`.
Solar case добавляет experimental PV100m²/25%; EM раздельно вводит1MW electric и1MW thermal
с разными source IDs. Full thrust явно stress, не опорная рабочая калибровка.

| Опыт | Настройки / повторение | Метод и evidence |
|---|---|---|
| S/M обычная работа | cold100K,5/10мин, approach10s → work до full → return10s → unload → recovery |24case short matrix + browser default600s |
| S/M простой | cold/hot/PV/EM,5мин |24case actual JSON |
| S/M stress | непрерывная march,5мин, state сохраняется |24case actual JSON; не baseline calibration |
| S/M hot/cold | hot600K/cold100K signed T⁴ |24case JSON + analytical radiation/gates |
| S/M solar | incident1361W/m²; PV absorbed100m² split25% electricity/75%heat |24case JSON + PV ledger test |
| S/M EM |1MW electric и1MW thermal, distinct IDs |24case JSON + source duplicate rejection |
| S recovery / repeated sortie | approach/work/full/return/unload/recovery; refuel=false/charge=false |deterministic replay/next-action fixture + full12h kernel |
| S long |12h, dt0.01, сохранённые stocks/heat/work |runtime-long-kernel.json; отдельный bounded compute |
| 64-channel retention |12h/dt0.01,4.32M synthetic numeric ticks |runtime-retention.json; не подмена физического S kernel |
| Worker late control |actual idle kernel,40k buckets,dt1s,40channels; missing telemetry ACK |runtime-browser.json, Chromium153; отдельная latency-поверхность |
|8h / beyond12h |UI presets8/12h/custom; без resource reset |runner repeat fixtures + bounded-merge beyond12h retention; отдельный full8h manual NOT RUN |

Воспроизведение:

```bash
U2_MATRIX_OUTPUT=docs/experiments/first-matrix-results.json npm test -- --run tests/matrix.test.ts
U2_RETENTION_REPORT=docs/verification/runtime-retention.json npm test -- --run tests/performance.test.ts --reporter=verbose
U2_PERFORMANCE_REPORT=docs/verification/runtime-long-kernel.json npm run test:long
npm run build
U2_BROWSER_REPORT=docs/verification/runtime-browser.json npm run test:browser
```

JSON результата хранит actual metrics, final stocks и сохранённые агрегаты. Dotted sourceRef
маршрутизируется через pinned source/section/blob из intake. Опыты не утверждают итоговый
закон поля или численный баланс U2; оператор решает отдельно.

Дополнительные именованные lab proposals, явно editable:

- `lab:work-conversion-1`: условная добыча1SCU/100MJ фактического beam. Cargo full немедленно
  прекращает добычу и переводит сценарий к следующей фазе. Это не canonical industrial throughput.
- `lab-palette-materials-1`: добавочные dry material bills, reference cp500J/(kgK); Cp/material
  mix экспериментален. H₂ power tank dry mass закреплён текущей S/M curve, contents не C credit.
  Форма палитры добавляет массу и C ровно один раз; отключённый installed device сохраняет массу.
- `lab-buffer-band-1`: absorbAbove290K/releaseBelow280K, transfer20MW/capacity2GJ для S палитры;
  temperature band editable, конечность мощности/энергии обязательна. Это не ambient heat pump.
- `lab-pv-1`: absorbing area100m², electric efficiency25%, dry500kg/reference cp500. Вход
  светила делится на электричество и host heat без двойного подсчёта.
- `lab-background-signal-1`: синтетическая Background100kW load, не refinery S/M. Источник
  user:editable-experiment; floors80%SoC/20%fuel/10K и source-only allocation остаются baseline.
- `linear-fog-experiment`: альтернативный single exchange linear coefficient10000W/K,
  editable. Не складывается с T⁴ того же источника. Baseline по умолчанию T⁴.

Полная fitted SKU/thermal material proof, durability/wear, detection tuning, реальные native
hooks и второй LAN client не заявляются этой матрицей. Native/LAN/operator gates — NOT RUN.
