---
title: "Ship Fitting — первоначальное предложение"
status: reference
date: 2026-10-05
related:
  - docs/gdd/gdd_u2_ship_fitting_v0.2.md
---

# Первоначальное предложение

Исторический proposal сохраняется в commit211b432 ветки ops/local-development.
Он предшествует исследованию current cargo owner1.7 и не определяет новый Payload budget.
Его заменяют [GDD](../gdd/gdd_u2_ship_fitting_v0.2.md),
[сводка источников](../research/ship_fitting_source_synthesis.md) и
[implementation plan](../plans/2026-10-05-ship-fitting-v0.2.md).

Оператор принял критерии добычи за цикл/час, расхода fuel/H₂ на добычу, простоя и
восстановления; денежная модель отложена. Новый коэффициент использования рабочей
оснастки и первый ограничитель описаны в GDD§7. Runtime ещё не реализован.
