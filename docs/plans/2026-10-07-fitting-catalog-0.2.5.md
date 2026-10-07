---
title: "План каталога 0.2.5"
status: proposed / awaiting Plan Review
version: "0.1"
date: 2026-10-07
---

# Реализация базовых M-сборок и архитектуры Мира

Goal: дать оператору три готовых M-сборки с двумя лазерами/192 SCU и честно разделить Мир U и Волна E.
Architecture: новая edition поверх неизменных .0–.4; существующие модули и движительные проверки.
Tech Stack: TypeScript, JSON, Vitest, Playwright, Vite.
Spec: docs/product/ship-fitting-catalog-0.2.5.md (accepted), прежний .4 — исторический baseline.
Work item ulab-jc1; PRODUCT budget5 для этой новой задачи, не продолжение закрытой ulab-kup.
Source baseline650007bcaf87df9fb3f74d0f71fb7f4bdf90af12; branchfeat/medium-defaults-0.2.5,
Draft stacked PR basefeat/mobile-compact-v4.3; один Developer, Plan Review → DEV → QA → Code Review.

## As-built и scope

Сейчас Мир копирует E и встроенный battery-M Волны. M меню содержит1/2/3 лазера,
базовый fit имеет один лазер без bulk cargo. Новые изменения: edition .5, only fresh defaults,
Mir U, M option:2 only. Не добавлять модули, новые физические коэффициенты, бюджет слотов,
изменения интерфейсной раскладки, симуляции, схемы файлов или принудительную миграцию.

## Владельцы и последовательность

1. Developer до правок сохраняет независимые pre-change digests .4 catalog/фабрик/численных
   коротких specs для семи корпусов и существующих1/2/3 presets. Добавляет tests/fitting/catalog-0.2.5.test.ts:
   новая архитектура/defaults/старые hash snapshots/IO atomicity; прогон RED только новых требований.
2. src/fitting/types.ts и editions.ts: добавить known .5, inherit .4 без её мутации;
   только новый Mir U remove builtin:battery и operator provenance. loadCandidateCatalog
   в src/fitting/catalog.ts должен включать те же50 SKU; getPresetFit bare M строит2+bulk192,
   используемые размеры/классы/Power наборы — по Spec. Явный ручной count допускается,
   хотя меню их не рекламирует. src/fitting/validate.ts: .5 carry existing E utility exception,
   остальные propulsion homogeneous/type/resource/battery проверки сохраняются.
3. src/app/main.ts default .5; src/app/fitting-ui/ship-view.ts один M option `${hullId}:2`.
   Для текущего .5 сохранить S base-only и L существующие options, правильное выбранное значение.
   src/io/fitting-json.ts — только если нужен перенос existing known-edition условия, без ослабления
   несовпадающей architecture/builtin/unknown stamp проверки. kernel/runner/scenarios/IO schema не меняются.
4. tests/browser/catalog-0.2.5.spec.ts: genuine touch390 workflow — выбрать каждый M,
   проверить2 лазера/cargo192/builtins/архитектуру, Start/Pause/Resume/result, edit next/freeze,
   JSON export→fresh reopen без потери монтажа и старый .4 run/result без restamp.
   Existing browser selectors1/3 изменять лишь для fresh M menu .5; old pinned .4 unit tests неизменны.
5. Адресованные tests GREEN → обязательный verify.sh normal guarded commit/build → FF push.
   Immutable candidate с source/build hashes. QA адресует AC ниже, scoped Reviewer проверяет
   только изменённые owners и версии/совместимость; advisory не расширяют работу.
6. После PASS/APPROVED PM обновляет текущий LAN4196/Pages, проверяет bare URL/title/edition/menu,
   закрывает Beads и обновляет MemoryBank. Старые builds/reports неизменны; operator merge отдельно.

## Verification Contract / Review Focus

| AC | Ожидаемое поведение и метод |
|---|---|
| MD01 | Все3 M fresh presets валидны и canRun; exactly2 own-class M mining + one bulk-M192. Compile даёт216/216/240 ore capacity и учитывает оборудование один раз; unit и native dropdown. |
| MD02 | Mir .5 U: четыреhydrogen M role modules, typed H₂ tank/generator, сменный battery-M; cargo24 builtin, builtin battery отсутствует. Альтернативные полные diesel/electric fits проходят; смешанный движительный набор/нетbattery/нетH₂ tank не проходят readiness. |
| MD03 | Volna .5 E: builtin battery-M/cargo24 неизменны; вседвижителиelectric. Utility H₂ tank+generator/cooler разрешены, chemical propulsion отвергается. Нельзя снятьbuiltin или подменитьего через instance. |
| MD04 | M menu только:2, S base/L старые options сохранены. Ручное редактирование1/3 lasers разрешено, сохранив выбранный корабль; нет forced preset reset после импорта пользовательского fit. |
| MD05 | .0–.4 snapshot digests и малыеJSON exact,50 SKU immutable; старый Mir E и builtin battery остаютсяв.4. Old fit/run/result roundtrip/replay неизменны; unknown version/forged stamp/architecture/builtin mismatch отклоняются атомарно. |
| MD06 | Native short actualWorker on390 и desktop1440: каждый M selectable/runnable/result; один whole edit→run→pause→next→analysis→export→reopen chain с active/frozen/result ownership и station/V_FA/literal conditions preserved. Browser errors0. |
| MD07 | Physics/kernel/runner/scenarios и numeric SKU файлы byteexact650; normalguardPASS, source/build binding; LAN4196 и Pages фактическипоказываютGD LAB/.5/M single options, без?v=. Physical devices отдельноNOTRUN. |

Именованные риски: borrowed builtin battery наU; незаметный рестамп старого .4; E utility
регрессия при .5; dropdown selection после ручного1/3 fit; предварительныеrun owners и
literal условия приwhole preset. Их проверяют MD02/05/03/04/06 соответственно.
Новый fit не обязан быть экономическим оптимумом или работать без термоограничения:
его эффективность измеряется существующей Лабой. Не добавлять фиксы симуляции по результатам этого прохода.
Rollback — предыдущее immutable gd-lab-label-release/source650; retained assets для открытых клиентов.
PM self-adversarial check: все direct WHAT покрыты MD01–04; исторические/состояния MD05–06;
нет придуманных ТТХ/дополнительныхslots, источникbuiltin разделён с naming proposal.
