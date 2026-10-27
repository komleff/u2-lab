---
title: "Ермак: физическое торможение и фактический счётчик рейсов"
version: "0.1"
status: "HOW draft — техническая диагностика; НЕ PLAN_READY"
date: 2026-10-27
beads: [ulab-9do, ulab-b3y]
mode: PRODUCT
---

# План исправлений E4/E6 после сверки E1–E7

Принятый WHAT — прямое поручение оператора 27.10.2026 и
[PR #52, раздел «Передача агенту VS Code»](https://github.com/komleff/u2-lab/blob/575f02ddf58a227111ce9b7f6d55919d9c9fc34a/docs/research/2026-10-27-ermak-radiators/README.md).
Это готовый product source: нового продуктового проекта и выбора физических
правил не требуется. PM выбирает HOW; продуктовый код пишет один основной Developer.
Этот черновик не разрешает реализацию до независимого PLAN_READY.

## Граница поставки и регистрация

| Находка | Текущий результат сверки | Canonical Beads / поставка |
|---|---|---|
| E1: D engine 40%, ordinary 500/550 K | Уже реализовано в каталоге0.3.4 C2; старые0.3.3 сохранены буквально | ulab-16h / PR51 |
| E2: ordinary, built-in cargo, local variants | Новая редакция проверяется целиком; сохранённый старый input не мигрируется | ulab-16h / PR51 |
| E3: полезность Active | Exact old0.210K воспроизведён; whole-hour Δhost не равен generator loss. Новый C2 independently проверен по net heat/работе на1200/3600/10800s | ulab-1x6 / адресная QA4/5 в PR51 |
| E4: пролёт станции | Реально воспроизведён и вC2. Новый IN-scope по прямому поручению оператора | ulab-9do / эта поставка |
| E5: A/epsilon/K passive | Уже исправлено: S490×.9=441, M1960×.9=1764; Active TTX не переопределяются этим амендментом | ulab-16h / PR51 |
| E6: шкала вместо фактического счётчика | Actual UI воспроизведён: «1 рейсы» при completed0/delivered0/onboard36 | ulab-b3y / эта поставка |
| E7: powered service | В0.3.4 используется отдельный обесточенный пассивный helper; older replay прежний | ulab-16h / PR51 |

`tmp:ermak-radiator-thermal-20261027` зарегистрирован локальным разрешённым путём
как существующий `ulab-1x6`; create-intent `0633a826-4ced-4a00-9b85-e5783bd2cdf0`
связан штатным `external_ref=intent:0633a826-4ced-4a00-9b85-e5783bd2cdf0`.
Связи с `ulab-dwi` и `ulab-a3r` добавлены как related, не новые blockers.
Очередь source PR не редактируется; applier/sync/export не запускаются.
Статусы задач — только Beads, план содержит порядок и AC.

## Источник и изоляция

- Base numerical package: PR51 `cb67fcf096b5b2c046b7f65cc41500795803def0` (C2).
- Main после49: `3b6c4622435b7d6ea3353ef41899085e1731d7f9`; дерево равно прежней base51.
- Отдельная рабочая ветка `fix/ermak-flight-counter`, worktree
  `/Users/komleff/Documents/GitHub/u2-lab-ermak-flight-counter`.
- Baseline Node24.22.0:26 addressed unit tests/4files PASS; это не новый whole guard.
- Ветка51/его данные/evidence остаются неизменными. Документальный PR52 — чужая
  сохранённая диагностика, его runtime source не подменяет C2.

## Обязательные ограничения

Обычные: critical200/550 K, work220–500 K, restart230/480 K. Diesel tanks:
critical150/570, work200–500, restart180/550. D engine host =40% собственных потерь
после engine/path efficiencies; генераторные доли и износ на двигатель не переносить.
Масса, C, тяга и фактические fuel/electric/thermal limits остаются физическими.
Никаких скрытой тяги, температурного сброса, телепортации к станции или глобальной
смены физического шага. Service300K/G10000, onboardOFF и реальное время сохраняются.
Экономика, новая ремонтная система и новый автопилот как отдельный продукт OUT.

Frozen0.3.0–0.3.3 и сохранённые C2 specs/results0.3.4 остаются literal. Исправление
численного flight-control требует явной границы версии/политики для fresh runs;
отсутствующее старое поле не означает молчаливое применение нового алгоритма.

## Подтверждённая причина E4 и рассмотренные варианты

У constant-force C2activeON в972.199299s coast достигает x3958.704660m. Новый preview
получает stop3958.704429m: gap0.000231m больше guard1e-4m, но until≈5.1e-7s меньше
clipping guard1e-6s. Оставшиеся0.800701s ошибочно проходят как coast — торможение
опаздывает примерно на360m при исправной тяге. В hot-none дополнительно падает
реальная тормозная сила2.052→1.360MN, а прогноз постоянной силы этого не учитывает.

1. Только согласовать один coast guard — недостаточно: spike оставляет32/27/794m.
2. Глобально уменьшить dt — меняет все численные опыты и не исправляет событие;
   отклонено как способ скрыть причину.
3. Согласовать event handoff и физический прогноз торможения при переменной тяге/
   массе, с явной совместимостью и измеренной стоимостью — выбранное направление HOW.

Финальная граница версии, bounded algorithm, точные файлы и адресные тесты будут
зафиксированы после завершения discriminating spike. До этой редакции плана и
независимого Plan Review продуктовая реализация НЕ разрешена.

## Проверяемые результаты будущей реализации

1. Сохранены исходные FAIL с exact spec/state/time и trace вокруг опоздавшего
   coast/brake/terminal handoff; исправление проходит исходные reproductions.
2. Торможение использует реально доступную тягу/массу и оплаченный impulse;
   preview не изменяет state/RNG. Нулевые ресурсы не дают фиктивного service.
3. Статические, thermal-derated, переменная cargo/fuel mass и дробные события
   проверены на сходимость; old numerical results/replay/checkpoints сохраняются.
4. E6 показывает actual completedTrips, delivered и onboard из наблюдаемого
   результата, не из шкалы или текущего редактируемого fit. Без результата нет
   выдуманного нуля. Worker/pause/frozen/export/reopen и другие модели сохранены.
5. Новые1200/3600/10800s опыты сравнивают actual работу, доставки, пики, причины
   ограничений и энергию по циклам. Три часа — диагностический горизонт, не норма.
6. Нормальный current-HEAD project guard и CI без изменения глобальных workers/
   лимитов. Независимые QA и один scoped Code Review; operator merge отдельно.

## Процесс и бюджет

Новая навигационная/UI поверхность `ulab-9do` + `ulab-b3y`: PRODUCT budget5
(Plan Review → QA → scoped Code Review; reserve affected QA/re-review).
Это новая работа после прямого расширения scope; прежний физический PR51 остаётся
на своих4/5 и его unchanged content evidence переносится по fingerprint, без
ритуального второго Code Review. Один основной Developer на эту поставку.

Перед DEV: завершить root-cause proposal, конкретизировать HOW/AC/paths, создать
реальный Draft PR, получить independent PLAN_READY. После DEV: normal checks,
адресная QA, scoped Review, landing/finalize. Main/merge/production — операторские.
