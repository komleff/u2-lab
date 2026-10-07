---
title: "Поставка каталога 0.2.4 — план и приёмка"
status: proposed / awaiting Plan Review
version: "0.3"
date: 2026-10-07
---

# Каталог 0.2.4 — план реализации

Goal: получить новую основную версию с правильными базовыми кораблями и
индивидуальными скоростями без изменения старых опытов.
Spec: docs/product/ship-fitting-catalog-0.2.4.md (принятые решения оператора).
Architecture: новая edition overlay и явные default данные; fit-aware свежие
условия; компактная правка общих UI owners. TypeScript/Vite, прежний Worker.
Один основной Developer; PM не пишет runtime. Beads ulab-9kh, PRODUCT budget5:
Plan Review1 → QA2 → scoped Code Review3, два вызова для адресованных blockers.
Старый ulab-p2w UI-budget/closure не переносится и не объявляется закрытым.

Target → as-built → gap: JSON допустимы; E/H₂ уже работает в0.2.3. UI предлагает
1/2/3, содержит старые имена/Legacy, скоростьgeneric500/MAX, buffer в остальных
presets, длинные подписи порогов. Нужна новая редакция и свежие условия, а не
переписывание 0.2.0–0.2.3 или новая физика.
База:25c54421dcd1a44cd7cd66f8e2b0c640e5ef4d0b; isolated checkout cooling-control,
ветка feat/catalog-defaults-0.2.4, Draft PR stacked на fix/catalog-dialog-focus.

## Шаги / owners

1. Plan Review WHAT+HOW с VC ниже; код только после PLAN_READY.
2. Developer добавляет edition0.2.4 в src/fitting/{types,editions,catalog,validate}.ts,
   явные default данные src/fitting/data/, профиль V_FA с происхождением.
   Сначала regressions на неизменность старых editions и точные JSON default.
3. Свежие условия/множитель в src/scenarios/mission.ts, src/app/fitting-workspace.ts
   и callers fitting.ts/lab-view.ts; сохранить старые imported literal значения.
   Не мигрировать JSON схемы, results/replay и numeric kernel.
4. Общие подписи trace-chart.ts и users ship-view.ts/fitting.ts, согласовать шапку/
   footer/name/default selectors. Браузерная проверка реальной геометрии порогов.
5. Обычный project guard; один build+source/whole-contract binding и краткий
   Developer report. QA по VC, один scoped Review. Выпустить LAN4196/Pages;
   проверить HTTP и native короткий Start/Pause/final на реальном Worker.
   После рабочего replacement остановить только owned старые U2 Lab процессы.

## Verification Contract

| AC | Expected / error / edge | Метод |
|---|---|---|
| CD01 | Три default равны исходным JSON по assignments/localVariants/resources; Пони2 включённых лазера сохранены; Sputnik XS/XS | Data equality + validate/compile, исходные file SHA |
| CD02 | Малые меню дают по одному default, ручной multilaser остаётся; новым прочим presets не ставится buffer, file radiators сохранены | UI выбор + assignments, старые count APIs |
| CD03 | Пять переименований + отдельный E/M Мир, численные параметры производного профиля совпадают; названия UI согласованы | Catalog data, реальное применение Мир/Титан |
| CD04 | .4 наследует M items/Etypedutility/one-slotPony; cryotank+H₂gen+cooler на E valid/compile; топливные propulsion запреты прежние | Аffected validator/resolver tests и одна fitting цепочка |
| CD05 | Fresh per-hull reference275/200/175/150/200/240/240 и ×2; V_FA edit сохраняет множитель; Max/custom literal понятны | UI свежий выбор/правка и compiled spec |
| CD06 | Старые .0–.3 fits/presets, imported custom/MAX conditions, активные/frozen/results не меняются; A/B ownership сохранён | Existing IO/workspace regression + bounded new cases; kernel blob equality |
| CD07 | Пороговые числа K слева от оси без смысловых префиксов/обрезания/перекрытия, цвета/полосы/значения прежние | Styled actual glyph bounds1440/1024/390; overview/detail/empty/disjoint/replay |
| CD08 | Header/footer текущей версии без Legacy-ссылки; короткий Worker run/results/dock и публичная версия доступны без query; старые owned servers остановлены после поставки | Native Start/Pause/final, HTTP asset hashes, process argv inventory |

IN Review: только новые data/default/edition/conditions/UI paths и их callers;
риски exact-version gates, скрытое переоснащение старых fits, absolute-vs-multiplier,
изменение active snapshot, ошибочный thermal label, утрата ручного fitting.
OUT: численная физика/runner, новый баланс модулей, холодные правила/износ,
station/service semantics, UI старого PR13 formal closure, base/main/operator gates.
Advisory не расширяет план. PM самоаудит после каждых3 review/QA+triage циклов;
не вводить новые инфраструктурные контуры или длинную численную кампанию.

Rollback: source25c5442; LAN result-dock-release immutable build;
Pages2b59732fa8d1f27b05b6b9a96d2a99af8bca675b. Старые hashed chunks и архивы
сохраняются, старые данные не мигрируются. PR остаётся Draft; merge оператором.
