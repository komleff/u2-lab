# Ship model v0.1 — воспроизводимая матрица кандидата

Статус: experimental candidate; независимые QA и scoped Code Review ещё не
объявлены PASS. Текущий commit и verdict читаются в
[runtime PR #22](https://github.com/komleff/u2-lab/pull/22). Это Lab evidence,
не новые канонические ТТХ U2 и не server acceptance.

[Измеренный JSON](ship-model-v0.1-results.json) (`ship-model-experiments/1`)
содержит 55 прогонов настоящего `stepV3` через `/4` runner. Каждый прогон хранит
условия, hash полного compiled spec, конечный state, metrics, telemetry,
frozen signature paths, events/retention и SHA256 полного result JSON.
Все исходные source/catalog/dataset fingerprints записаны в артефакте.
Производитель — `src/experiments/ship-model-v0.1.ts`; импорт в UI его не запускает.

| Серия | Фактически заданные условия |
|---|---|
| Sputnik S / Mir M | Standard/cold/hot field; 40 с: idle 5, work 10, peak 5, recovery 10, repeat 10. T₀=450 K; Efficient |
| Military structural | Реально добавленный builtin buffer и aft hull radiator; Combat. Только class/representation fixture, не полный паспорт и не balance verdict |
| Stealth | Efficient/Masking с duty 0.1/1; манёвр, gyro turn и запрещённая работа. RAM/buffer/body shell остаются разными установленными функциями, скрытого радиатора нет |
| Источник в Masking | Реальный diesel generator/tank, charge 0.5%; deficit → independent coverage → deficit. Permission сохраняется, средняя фаза даёт нулевой generator output, последняя вновь оплачивает дефицит |
| Background / optional charge | Установленные experimental policy variants `deferrable-background` / `optional-pulse-charge`; actual W=0 в Masking до ledger, масса остаётся |
| Cooling price | Builtin radiator 10/300 м² × common TI/pump-radiator × battery/generator; та же горячая среда и direct load |
| IR surface versions | Ordinary/aft hull radiator при равных thermal watts; mixed builtin/fitted surfaces в реально работающем общем горячем контуре сохраняют отдельные профили |
| Buffer | Равные внешние joules: high-short 10 с при 2× установленной capture power, low-long 100 с. Отдельные work/recovery 120 с в холодном/горячем поле |
| G1/G10/G20/G100 | Standard/cold/hot × та же задача 30 с duty 0.5 / harder 60 с duty 1. Меняется только laser sensitivity variant, остальные источник/масса/thermal gates сохраняются |

Для generations применяется отдельный
[candidate dataset](../../data/experiments/ship-model-v0.1-generations.json)
`ship-model-generations/1`: useful scale 1/1.7/1.9/1.99 и η 0.35/0.60/0.67/0.699.
Это четыре дискретные sensitivity точки в принятом направлении ×1→×2 и η<0.70,
не выдуманная непрерывная каноническая кривая. Оператор принимает баланс отдельно.

Примеры конечных измерений из JSON (округлены только здесь):

| Прогон | Работа, MJ | T, K | Долг буфера, MJ |
|---|---:|---:|---:|
| Sputnik standard / cold / hot | 22.5045 / 22.5045 / 22.5045 | 448.425 / 443.979 / 455.252 | 0 |
| Mir standard / cold / hot | 90.018 / 90.018 / 90.018 | 448.228 / 443.432 / 455.583 | 0 |
| G1 / G10 / G20 / G100 standard same-task | 22.5045 / 38.25765 / 42.75855 / 44.783955 | 449.785 / 449.224 / 449.072 / 449.013 | 0 |
| Buffer high-short / low-long | 0 | 456.467 / 450.134 | 200 / 413.62443 |
| Buffer recovery cold / hot | 0 | 436.514 / 478.925 | 0 / 1.178052 |

Мощный короткий импульс даёт настоящий `power-limit`; большая ёмкость не снимает
этого предела. Длинный опыт дополнительно оплачивает 90 с обычной нагрузки,
поэтому равные внешние joules не означают равный полный долг. Холодный recovery
возвращает весь долг; в горячем поле корабль достигает minimum capture contact
и сохраняет недостижимый остаток вместо стирания запаса. Все 55 результатов
заканчиваются `complete`, без отрицательных запасов; абсолютный суммарный
энергетический residual каждого меньше 1 J.

## Контрольный профиль и replay

[Исходные CP-01–05 и 16 исторических аналитических точек](../verification/ship-model-v0.1-vectors.json)
сохраняют provenance и явно отделены от runtime acceptance.
[Production conformance export](../verification/ship-model-v0.1-runtime.json)
(`ship-model-runtime-conformance/1`) хранит буквальные входы/выходы:
CP-01–03 — изолированный production `allocateCascade` (включая 1.2 MW CP-01,
ожидание reserve и единственный regulator при равных setpoints);
CP-04/05 — полный валидный runnable spec/state и настоящий `stepV3` output.
CP-04 пересекает заполнение B внутри секунды: остаток нагревает 490→490.025 K.
CP-05 после 59 с достигает первого seeded failure в следующую секунду:
RNG 424242→724273890. Export не исполняет U2 server и не выдаёт adapter за него.

Адресные production suites дополняют серии: `masking-generator.test.ts`
проверяет строгое <1%, точное 1%, partial/full supply, zero-output permission,
serialized recurrence, upper recovery 2% candidate и normal handoff;
`thermoinverter-surfaces.test.ts` — четыре состояния двух насосов, exclusive area,
signed hot field и whole-ship benefit; `production-step.test.ts` — E/B/fuel
depletion внутри секунды и обычную/Military Combat температурную матрицу.
Они проверяют runtime, не сравнением с готовыми ожидаемыми строками матрицы.

`experiments.test.ts` выполняет 10 000 физических секунд новой модели с bounded
retention 32 buckets, затем доказывает literal equivalence pause 5000 + restore +
5000 и непрерывных 10 000 с. Сравниваются весь result/checkpoint, RNG, метрики,
events и измеренная история. Бюджеты: <15 с для тестового workload,
≤128 MiB retention; solver accuracy не ослабляется. Исторические `.2.x` readers,
fixture hashes и replay остаются отдельной регрессией, не доказательством `/4`.
Actual browser Worker отдельно проверяет CP05 59+1=60, повторный импорт без reroll,
repair/restart/cooldown и atomic malformed/future refusal. Native UI проверяется
на 1440/390/820 и цепочке explicit compile → `/4` → save/import/resume.

Для воспроизведения из корня checkout:

```sh
npm test -- tests/model-v3/experiments.test.ts
npm test -- tests/model-v3 tests/signatures/ship-model-v0.1.test.ts tests/ui/ship-model-results.test.ts
npx playwright test tests/browser/ship-model-worker.spec.ts tests/browser/ship-model-v0.1.spec.ts
.agents/project/verify.sh
```

Обычный artifact test сравнивает вычисленные данные с сохранёнными буквально,
включая fingerprints; он не подставляет CP expected в runtime output.
Полный project guard и независимые verifier verdict привязываются PM к одному
frozen candidate в PR #22. Unity/U2 server parity (SM-14), физическое второе
LAN-устройство, native activation и playtest balance остаются **NOT RUN**.
Public Pages/архив и старые локальные стенды этой доставкой не обновляются.
