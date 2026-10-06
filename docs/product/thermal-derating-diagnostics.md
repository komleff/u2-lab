---
title: "Температурное ограничение: объяснения и график Лабы"
status: active
version: "0.1"
date: 2026-10-07
beads: ulab-6ty
---

# Принятое изменение

Решение оператора: оставить текущую линейную hot/cold формулу, закрепить её
в U2 как единое игровое правило плюс повышенный износ. Добавить объяснения всех
действующих ограничений в журнал и обозначить обе зоны на температурном графике.

Authority — [ADR-0068](https://github.com/komleff/u2/blob/gd/thermal-derating-wear-20261007/docs/architecture/ADR-0068-Thermal-Derating-And-Wear.md)
и [контракт диагностики D01–06](https://github.com/komleff/u2/blob/gd/thermal-derating-wear-20261007/docs/specs/gameplay/spec_thermal_derating_diagnostics_v0.1.md).

> **Что видит игрок** — см. [ADR-0068, «Что видит игрок»](https://github.com/komleff/u2/blob/gd/thermal-derating-wear-20261007/docs/architecture/ADR-0068-Thermal-Derating-And-Wear.md#что-видит-игрок) (единый на пакет).

Lab не рассчитывает прочность/износ. Не выдумываем её значения: одно честное
объяснение на температурный эпизод. Избыточное H₂ always-on охлаждение — отдельный
известный дефект, этот observational пакет не меняет governor или физику.
