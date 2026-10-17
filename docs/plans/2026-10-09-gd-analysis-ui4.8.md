---
title: "UI4.8 — анализ времени, A/B сигнатур и компактное Compare"
status: proposed / implementation authorized after independent PLAN_READY
version: "1.0"
date: 2026-10-09
related:
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/guides/signatures-observer.md
---

# UI4.8 — план реализации

Для исполнителя: один основной Developer по .agents/DEV_ROLE.md и принятому
PM_ROLE3.0. Subagent-driven execution; Beads является единственным статусом работ,
шаги ниже задают порядок и AC, а не markdown tracker. Existing Draft PR18.

Goal: быстро сопоставлять power/T/EM/IR во времени и сравнивать сохранённые
сборки без прокрутки через служебные JSON.
Architecture: существующий TypeScript/Vite рабочий лист; presentation helpers
читают immutable RunResultV2, новая физика/Worker/схема/порог/экспорт не нужны.
Spec: INDEX → product/ship-fitting-gd-workspace-v4.md0.8/UI48-01–06;
signatures guide/product0.7 и принятые H07/H08 сохраняются.

## As-built, scope, границы

Baseline b8894e0e27eabd230d0892467d3f3075e72773a0, UI4.7, LAN4196/Pagesd627.
Существующий #chart-bucket после восьми overview cards; на360 от заголовка1783.5px.
Compare A/B — семь mining/resource метрик, без IR/EM/reach. measuredIdentity и
conditionDifferences печатают полный паспорт/JSON до короткого смысла.
Изолированный linked worktree u2-lab-signatures-runtime, branch
feat/signatures-observer-runtime; PR18headRef plan/signatures-sensors-v1.0.
Primary predirty documents не включать в staging. Main и merge — оператору.

IN: src/app/fitting-ui/lab-channels.ts, compare-view.ts, result-context.ts,
опциональный новый focused signature-comparison.ts, fitting.ts/CSS для UI4.8 и
доступности, адресованные tests/ui и tests/browser, этот owner/guide/INDEX.
Использовать существующие signatureReach/statisticsView/num/distance; их численный
закон не менять. Один Developer, existing Plan/Code Reviewer и QA sessions.
New verifier budget4/5; сообщения внутри этих sessions не новые launches.
Счётчик selfaudit1/3 послеr9; после ещё двух review/QA+triage/fix cycles выполнить
PM_ERR/DOC_PR самоаудит, не создавать дополнительный approval gate.

OUT: model/runner/signatures kernel/mission/каталог, новые sensors/CS rules,
радиаторный контур/TI, nominal→earned conversion, persistence/schema/protocol,
moving observer, экономический/классовый баланс, overlay A/B graphs, новые экраны.
Старые raw JSON/CSV и ObserverView остаются byte-equivalent на тех же inputs.

## Последовательность одного work item

1. RED: адресованные тесты, воспроизводящие UI48-01/02/04 на baseline. После
   GREEN проверить mixed observer/advanced IR, ноль/нет данных, partial/stale и
   неписанные nested условия; не дублировать весь inverse/thermal test campaign.
2. Перенести существующий единственный #chart-bucket перед overview. Сохранить
   current bucket/event state и focus/keyboard/pointer/touch callbacks. Достаточен
   нормальный flow перед сеткой, новых sticky/fixed панелей и дублирующих controls
   не вводить. Во время RUNNING accepted endpoint/без8SVG, pause/step/final/import
   рисуют прежние common-axis graphs.
3. Добавить focused read-only presentation сравнения. Consumes RunResultV2|undefined
   для A/B, sourceStats.IRobserver/EM.total через statisticsView; signatureReach
   вычисляет meanPowerM/maxM по собственному сохранённому preset каждого опыта.
   Produces раскрываемый compact A/B/Δ блок внутри frozenCompare: IRmean/max,
   EMmean/max, IR/EM reach по meanPower/max, SI units и явно подписанные contexts.
   Null/absent остаются «—»; raw data и inverse helper не нормализовать по-новому.
4. Укоротить measuredIdentity на основном слое Compare с подробным паспортом в
   details. conditionDifferences сохраняет существующее compareMissionConditions
   как владельца equality; recursively сравнивает differing fields только для
   presentation. Известные ключи получают русские labels/units, неизвестные —
   читаемый literal path/value и полный JSON fallback в details. Arrays/добавление/
   удаление/разные model types не терять и не объявлять comparable ошибочно.
5. Адресованные unit/browser checks, normal .agents/project/verify.sh и commit
   одного frozen candidate. Указать actual SHA/diff paths/source/build fingerprints,
   команды/результаты, RED/GREEN, limitations. Исполнитель не публикует/не deploy.
6. Independent QA UI48-01–06, один scoped Code Review по changed surface, затем
   PM finalize и обновление прежнего LAN4196/Pages после binding проверок.

## Verification Contract

| AC | Проверяемое поведение и метод |
|---|---|
| UI48-01 | Actual phone/tablet Worker20–60с→pause/final→Graphs; picker перед первой figure, touch/keyboard выбирает интервал и все common markers/таблица/журнал согласованы. Range drag не теряет focus/выбор после render; nav и controls работают. |
| UI48-02 | Genuine immutable A→copy/edit/B→complete, раскрыть signatures compare; A/B/Δ powers совпадают с full sourceStats и reach с existing helper, не draft/bins. Same preset и различный preset/ракурс/advancedIR, one/no results, zero/absent: правильные units/contexts и отсутствие исключений. |
| UI48-03 | Изменить только nextdraft после A/B; сравнение неизменно/stale подписан. Для разных наблюдателей/ракурсов/IR режима/интервала виден предупреждающий context; mean-power reach отличён от time-average range и nominal от earned. |
| UI48-04 | Genuine A/B с ракурсом0→180° и фоном100→120K: короткие пары с единицами до rawdetails, неизменённые nested поля не заполняют основной слой. Unknown path/array/add/remove/model differences доступны; полного паспорта и snapshots/ownership не потерять. |
| UI48-05 | Freeze immutable A, sort fixed base, existing mining/resource metrics, pause/step/resume, newdraft, export→reopen0.1/0.2; raw exports/privacy byte-equivalent для frozen real inputs, malformed отказ атомарен. Проверить affected existing workspace/signature-distance tests, без новой часовой физической кампании. |
| UI48-06 | Actual desktop1440, touch360×780 и820×1230 chains; cheap geometry10approved envelopes, low780×360: overflow0, controls≥44, единицы без разрывов/скрытых действий, version4.8; basic text≥12/inputs≥16 mobile, old header/dock RC caps сохранены. Physical devices NOT RUN. |

Адресованные candidates: tests/ui/gd-workspace-v4.test.ts,
tests/ui/signature-distance.test.ts и новые focused gd-analysis tests;
tests/browser/gd-workspace-v4.spec.ts, signatures-layout-default.spec.ts,
responsive-compact.spec.ts и новый focused gd-analysis spec. Менять старый assertion
technical label только если accepted readable replacement проверен, не ослаблять AC.
Полный guard перед коммитом обязателен; после PASS не повторять без newdiff/FAIL.

## Review Focus и rollback

Reviewer проверяет UI48 acceptance, immutable ownership, отсутствие data mutation,
retention/timing/Worker drift, неправдоподобное сравнение разных observers, fallback
старых/unknown данных, escaping и mobile flow/focus. Advisory не расширяет scope.
После blocker — covering tests, affected QA и scoped re-review той же session.
Rollback: предыдущий UI4.7 dist/gh-pagesd627 сохранён; deploy atomic assets-first,
index-last. Нет data migration. Revert этого presentation diff не меняет старые
файлы исследований или численную модель. Старые assets сохранять до успешной
проверки обоих адресов. Operator merge/base gates остаются отдельными.
