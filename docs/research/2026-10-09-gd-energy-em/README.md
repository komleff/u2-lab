---
title: "Исследование: энергия, тепло, IR и EM модулей и кораблей — данные и опыты"
status: research evidence
version: "1.0"
date: 2026-10-09
related:
  - docs/reviews/2026-10-09-gd-energy-heat-em-review.md
  - docs/product/thermoinverter-heat-pump-v0.1.md
---

# Исследование: энергия, тепло, IR и EM — данные и опыты

Сырые данные и скрипты к [ГД-ревью](../../reviews/2026-10-09-gd-energy-heat-em-review.md).
Проверенный расчётный код — runtime `b8894e0e27eabd230d0892467d3f3075e72773a0`; до головы
PR18 `01b15fd` файлы `src/model`, `src/signatures`, `src/fitting`, `src/runner`, `src/catalog`
не менялись.

## Состав

| Файл | Что внутри |
|---|---|
| [tables.md](tables.md) | Таблица А (модули S/M на эталонном стенде) и таблица Б (13 кораблей каталога 0.2.5 в рейсе по фазам) |
| [table-a.json](table-a.json), [table-b.json](table-b.json) | Сырые значения в ваттах для обеих таблиц |
| [probes/gd-energy.probe.ts](probes/gd-energy.probe.ts) | P1–P9: термоинвертор, недотяга, активный радиатор, трюм, солнце, H₂, двигатель, EM, баланс |
| [probes/gd-cooling-em.probe.ts](probes/gd-cooling-em.probe.ts) | P10–P12: EM/IR по приборам, буфер, 30-минутный баланс энергии и сбой часов |
| [probes/gd-table.probe.ts](probes/gd-table.probe.ts) | Генерация таблиц А и Б |
| [probes/gd-karavan.probe.ts](probes/gd-karavan.probe.ts) | Сбой часов сигнатур у Каравана 2/3 лазера и контроль без сигнатур |
| [probes/gd-emv2.probe.ts](probes/gd-emv2.probe.ts), [emv2.json](emv2.json) | EM-закон v2 по классам ступеней и перекалибровка порога EM-сенсора (ТЗ, раздел 2) |
| [probes/gd-zones.probe.ts](probes/gd-zones.probe.ts), [zones.json](zones.json) | Готовые корабли: холостой ход 60 мин и добыча 15 мин при фоне 3–450 K (температурные зоны) |
| [probes/gd-ircal.probe.ts](probes/gd-ircal.probe.ts), [ircal.json](ircal.json) | Перекалибровка IR-порогов при стандартном фоне 250 K (эталон — Ермак D, 15 мин добычи) |
| [probes/ti-model.cjs](probes/ti-model.cjs) | Решатель предлагаемого термоинвертора-теплового насоса (примеры документа) |
| [probes/ti-map-pump.cjs](probes/ti-map-pump.cjs) | Карта выгодности термоинвертора с насосом 0,3 МВт в горячей ветке (вторая проверка) |
| [probes/field.py](probes/field.py) | Время остывания в холодных полях и равновесия стоянки с генератором и без; EM-дальности маскировки при 200 кВт |
| [probes/eq-all.cjs](probes/eq-all.cjs) | Равновесие стоянки корпусов из zones.json при фоне 3 и 250 K (без пассивных радиаторов) |
| [probes/gd-maneuver.probe.ts](probes/gd-maneuver.probe.ts), [maneuver.json](maneuver.json), [probes/maneuver-calc.cjs](probes/maneuver-calc.cjs) | Массы, маршевая тяга и аккумулятор готовых кораблей; резерв 2×V_FA и время манёвров тихого хода (решения Г1, Г2) |
| [probes/quiet-criterion.cjs](probes/quiet-criterion.cjs) | Дальность заметности гражданского корабля на стоянке и тяга тихого хода при порогах 5–15 км |
| [probes/quiet-caliber.cjs](probes/quiet-caliber.cjs) | Порог тихого хода по калибру (S 10 / M 20 / L 40 км): тяга и время до `V_FA` для 14 кораблей; стелс-линейка электродвигателя; чувствительность к IR выхлопа H₂ |
| [probes/limits-matrix.cjs](probes/limits-matrix.cjs) | Матрица тепловых пределов ярус × класс × поколение по закону `p(G)` с малыми асимптотами |
| [probes/gen-sweep.cjs](probes/gen-sweep.cjs) | Прогон по поколениям G1…G∞ опорных шахтёров с канонными осями КПД: нужно ли охлаждение на высоких G (верхняя оценка тепла) |
| [probes/quiet-shield.cjs](probes/quiet-shield.cjs) | Цена электростелса: тихий ход с экранированием, стелс-линейкой двигателя и обоими |
| [probes/ti-rescue.cjs](probes/ti-rescue.cjs) | Варианты спасения термоинвертора: `η_II`, теплообменники, горячая сторона, площадь панелей |
| [probes/format.cjs](probes/format.cjs) | Перевод сырых JSON в таблицы markdown |

## Условия

**Дальности.** Для всех строк используется датчик S «выделенные IR+EM»: IR 2,74542277·10⁻⁴ Вт/м²,
EM 3,592038646·10⁻⁸ Вт/м²; дальность в чистом пространстве `R = √(W / (4π Φ_detect))`.
IR — стандартный прибор (положительный контраст), ракурсы: корма 180°, нос 0°, борт 90°.
Для M-кораблей пороги S оставлены намеренно — ради сравнимости строк.

**Таблица А — синтетический стенд, не именной корпус.** S: теплоёмкость 35 т × 470 Дж/(кг·K),
эффективная площадь корпуса 300 м², пассивный радиатор S, аккумулятор S, питание корпуса 50 кВт,
дизельный 6000 кг и водородный 633 кг баки; M: всё ×4 (радиатор и аккумулятор M, H₂ 3648 кг).
Фон 100 K, солнце 1361 Вт/м², старт 300 K. Модуль работает 60 с с шагом 0,1 с;
«старт» — первый кадр, «через 60 с» — последний. Пары двигателей — боковой профиль.

**Таблица Б — готовые корабли.** Все пресеты каталога `ship-fitting-0.2.5`, условия
`freshMissionConditions`, 3600 с, шаг 0,1 с, режим сигнатур по умолчанию. Среднее по фазе —
интеграл, делённый на длительность; максимум — по кадрам.

## Воспроизведение

Скрипты используют абсолютные пути к рабочей копии runtime
`/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime` (`b8894e0`). Для другой машины
поправьте пути импорта и `OUT`. Запуск — vitest проекта с отдельным конфигом:

```bash
node_modules/.bin/vitest run --config docs/research/2026-10-09-gd-energy-em/probes/vitest.probe.config.mjs --disableConsoleIntercept --silent=false
node docs/research/2026-10-09-gd-energy-em/probes/ti-model.cjs
```

В `vitest.probe.config.mjs` поле `root` указывает на папку со скриптами; при переносе его
нужно исправить. Скрипты только читают движок и не меняют код или данные Лабы.
