---
title: "Компактная адаптивная вёрстка workspace v4.3"
status: proposed / awaiting Plan Review
version: "0.1"
date: 2026-10-07
---

# Цель и принятый объём

Оператору нужен компактный личный инструмент ГД на телефоне, планшете и обоих
экранах складного телефона, в обеих ориентациях. Исправляем существующий единый
рабочий лист; лишние пояснения можно сократить или перенести в раскрываемые
подробности. Основание: поручение оператора 2026-10-07 и accepted
`docs/product/ship-fitting-gd-workspace-v4.md`, WF01–15. Макет Claude — предложение
и ассеты. Новая архитектура экранов, численная физика и каталог не требуются.
Beads: ulab-kup. База: ca0ae0f44b1d22c1b13b811c3f92ddc0549ad140, PR14.

## As-built и классы дефектов

PM baseline: native Chromium touch, bare LAN4196, фактическая DOM-геометрия и
обычные pointer clicks. Evidence: `.overgate-runtime/responsive-baseline/`.
Это CSS viewport эмуляция, не физическая проверка устройств.

- На 780×360 шапка183.3 и dock118.1px оставляют58.6px; обычное открытие слота
  перекрывается закреплёнными панелями. На 640×400 остаётся82.1px.
- На 360×780 шапка205/dock183px, условия1495px, footer каталога204px.
- На 820×1230 условия753px, шапка138.5/dock114px. На 1230×820 шапка86.5px.
- Несколько последовательных CSS overrides и независимые width-only breakpoints
  создают скачки сеток. Условия на телефоне становятся одной длинной колонкой;
  в сравнении есть min-height92px на каждую пару свойств. Dialog использует
  несколько несогласованных ограничений высоты вместо одного flex/grid контейнера.
- Горизонтального overflow и page errors в десяти исходных профилях нет. Начальный
  фокус каталога уже Close — это сохранить, не открывать клавиатуру автоматически.

## Решение

1. Согласовать существующие responsive правила по компонентам. Grid/Flex children
   получают min-width:0; цельные числа с единицей и действия не дробятся. Перенос
   допускается между осмысленными группами и в длинном названии, а не между цифрами.
   Не маскировать ошибки global overflow:hidden, обрезанием данных или мелким шрифтом.
2. Сжать шапку: короткое название/версия, четыре якоря, Save/Import и компактный
   контекст выбранного/активного/измеренного владельца. Полные run IDs и служебные
   пояснения доступны в существующих подробностях. На низком экране закреплять
   только необходимую навигацию либо позволить шапке прокручиваться.
3. Dock сохраняет live/final SCU/ч, время, состояние/владельца, скорость расчёта.
   На узком экране показывать нужные текущему состоянию действия: Start/Reset;
   running Pause/Cancel; paused Resume/Step/Cancel. Все функции доступны в своём
   состоянии; кнопки не должны выталкивать результат или перекрывать страницу.
   Смена положения не меняет owner, math, Start ACK или управление Worker.
4. Условия: короткие однозначные подписи, компактные две колонки на телефоне,
   больше колонок при достаточной ширине. Единицы и значения остаются видны;
   уточнения о station policy/replay — в подробностях, но старый fuel-only режим
   и активный/следующий опыт должны по-прежнему различаться без угадывания.
5. Каждая группа слотов остаётся отдельным разделом. Сократить повторяющиеся
   подписи карточек и отступы; сетка по доступной ширине, без обязательного переноса
   calibre/действия на случайную строку. ТТХ и i, выключение, пустые/встроенные/
   несовместимые слоты, ручной multilaser и предупреждения сохраняются.
6. Dialog: один ограниченный viewport контейнер header/scrolling body/footer;
   header и действия доступны на низком экране, прокручивается содержимое. Фильтры
   занимают две намеренные строки на телефоне. Убрать постоянно видимый служебный
   текст footer, короткие «Снять»/«Применить», сохранить all-Payload и отказы.
   Info, Save с именем, import-error и Cancel-confirm следуют тому же контейнеру.
7. Графики/журнал/сравнение: компактные заголовки, метрики и строки без лишней
   минимальной высоты. Графики, оси/единицы, выбор bucket/event и A/B остаются.
   Широкие таблицы прокручиваются только внутри подписанного контейнера.
   Отказаться от дублирующей прозы, а не от аналитики или информации об устаревании.
8. UI версия v4.3 в шапке/footer; каталог0.2.4 и модель неизменны. Поставка заменяет
   текущий4196 и Pages после QA/review, без query-параметра; архивы не удалять.

## Матрица CSS viewport

Проверяем консервативные рабочие окна, не приравниваем hardware pixels к CSS.
Точная модель Fold8 Wide и Chrome viewport уточняются опционально; отсутствие
ответа не блокирует исправление общего класса адаптивности.

| Профиль | Portrait | Landscape |
|---|---|---|
| S25 envelope | 360×780 | 780×360 |
| Fold внешний envelope | 400×640 | 640×400 |
| Fold внутренний envelope | 768×1024 | 1024×768 |
| Wide внутренний дополнительный | 720×900 | 900×720 |
| Xiaomi Pad envelope | 820×1230 | 1230×820 |

Дополнительно короткое окно360×480 для keyboard/browser bars и границы реально
изменённых breakpoints. Это не обещание физического Android keyboard QA.

## Verification Contract

| AC | Expected / edge | Method |
|---|---|---|
| RC01 | Весь лист и dialog без document overflow>1px, glyph overlap/обрезанных значимых данных. Обязательные controls/checkbox-label touch≥44px, основной текст≥12px, mobile input≥16px. Намеренные grid rows допустимы. | Actual computed DOM/glyph/hit bounds, десять профилей, длинные имена/числа |
| RC02 | Нормальная portrait шапка≤148px phone /≤112px tablet, dock≤132/104px. На height≤400 закреплённые панели вместе≤45% viewport; после прокрутки slot/conditions/chart controls достижимы без force/JS clicks. | Before/after geometry + native click/tap во всех ориентациях, active/paused/final |
| RC03 | Fresh условия на360≤900px и820≤580px против1495/753. Labels/units/values читаемы; edit, ×2/Max/custom, old absent/false/true policy не меняют семантику; active form остаётся next draft. | DOM height + actual edits/export/Worker spec control; unchanged ownership tests |
| RC04 | Dialog footer≤116px на phone, Apply/Close/Remove/all-Payload доступны без перекрытия даже height360; min-height:0 scrolling body. Initialfocus Close, deliberate Search работает; i/Savename/Importerror/Cancelconfirmation доступны. | Native modal цепочки/scroll/resize360×480; никакой force click |
| RC05 | Open→edit/install→short real Start→Pause/Step/Resume→analysis bucket/event→freeze/copy/compare→export/import→final/reset работает. Dock result равен hero, owner/revision/stale/previous/result-only сохраняются. | Один полный phone и один tablet workflow; geometry/state checkpoints в остальных профилях; meaningful existing regressions |
| RC06 | Слоты питания/сигнатур отдельными строками, i и enable доступны; charts K thresholds/legend/unit/bands, numeric result и local table scroll сохраняются. Нет потери A/B/каталога/экспорта ради компактности. | Styled DOM/glyph bounds + touch, existing geometry and capability checks |
| RC07 | Physics/runner/workspace state/catalog/IO bytes прежние, ordinary verify PASS. LAN/Pages bare актуальны, короткий Worker run работает. Physical устройства и реальная Android keyboard проверка явно NOT RUN. | Protected source equality, project guard, HTTP assets + native smoke |

## Порядок, ownership и предел

PRODUCT: Draft PR с этим планом → один независимый responsive adversarial audit и
Plan Review8 → PLAN_READY → один Developer → обычный guard/build → mobile QA9 →
scoped Code Review10 → LAN/Pages. Эти три launches — остаток явно выданного extra5;
fix turns и deterministic tests не считаются. После каждых3 review/QA+triage —
самоаудит PM_ERR/DOC_PR; advisory не расширяет приёмку автоматически.

Runtime owners: src/app/fitting.css, fitting.ts и существующие fitting-ui presenters;
styles.css только если доказана утечка глобальных правил. Developer добавляет адресные
браузерные regressions реального перекрытия/доступности, не проверки текста CSS.
OUT: numeric kernel, Worker/runner, workspace mutation, catalog/ТТХ/баланс, новые
экранные режимы, persistence, framework, полное старое ulab-p2w closure, base/merge.

Rollback: immutable ca0/r2 и текущий4196/Pages snapshot, те же данные. Только
обратимая смена compiled static assets. Merge/main/auto-merge выполняет оператор.
