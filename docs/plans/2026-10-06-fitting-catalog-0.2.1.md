---
title: "План дополнения каталога Ship Fitting0.2.1"
status: proposed
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/verification/gd-workspace-v4-contract.md
---

# Цель, состояние и граница

WHAT/C01–08 — отдельный product contract. Runtime baseline v4 pointer fix
`ff8f3e8500a54b485dec507882f88820d0c2d304`; в его immutable artifact ещё нет обновления
ТТХ. В текущем каталоге40SKU нет Industrial engines M, Civilian laser M и Industrial
laser L; presets ставят Civilian S lasers на крупные/Industrial корпуса. Source каталог
не меняется до independent PLAN_READY этого дополнения. Draft PR6 уже открыт.

Один существующий Developer реализует связанный delta; существующие QA и Reviewer
проверяют адреса C01–08. PM не пишет runtime. Старые v4 QA/report seals сохраняются;
их неизменная UI область наследуется по blobs, новый catalog surface проверяется явно.
Beads ulab-agx — tracker, здесь нет второго журнала статусов.

## Реализация

1. Additive authored data: три Industrial diesel M изделия и два missing laser SKU,
   явные labels/Class/G/origins. Существующие40items и hulls/builtins не менять.
   Model code получает force/fuel/heat/material inputs штатным compile/build путём.
2. Presets выбирают matching laser size/class; Pony removable local S/G0 variant
   использует существующий builtin anchor. Industrial M выбирает явный новый retro
   без повторного scaling0.4. Default прочих power/signature/propulsion/count unchanged.
3. Catalog version0.2.1 и минимальная additive compatibility0.2.0 во всех existing
   fit/run/result opening paths. Без новой schema, rewrite старых snapshots или
   расширения разрешений unknown-catalog replay. Экспорт хранит actual identity.
4. Meaningful deterministic tests: expected exact force/package/full assembly,
   inventory preservation, default size/class/count, own-SKU cross-fit invariants,
   causal fuel/heat/material ledgers, old/new JSON opening and malformed atomicity.
5. Normal guard текущего exact HEAD, отдельный immutable artifact/manifest/ZIP;
   Developer report с actual changed paths и дельтой защищённой области. PM поднимет
   его на owned4188 после QA release старогоff8; исходные artifacts не переписываются.
6. Independent affected QA C01–08, затем один scoped Code Review всего ещё не
   reviewed v4 runtime + catalog amendment. Advisory не расширяют scope автоматически.
   Final metadata batch/feature push; main/base PR merge выполняет оператор.

## Verification Contract дополнения

| Адрес | Метод и expected result |
|---|---|
| C01/C06 | compile default/cross-fit three new engines, actual material/fuel/heat snapshots; nominal force and160t package, no slot multiplier/double pair count |
| C02 | independently assemble exact user fit; dry412245.550477kg, fuel24t, cargo240SCU; mass796245.550477kg at density1500; tolerances только floating rounding |
| C03 | inspect all curated1/2/3 presets, включая builtin count; class/size identity matches; new larger laser load intentionally consumes more power |
| C04/C05 | compare40old items/hulls byte/content againstff8; native old0.2.0 and new0.2.1 fit/run/result imports in fresh page, no automatic replacement/rerun; unknown catalog explicit replay unchanged |
| C07 | real LAN desktop1440 and touch390 selection→custom user fit→short completed run→limiter/analysis→export→fresh reopen; exact measured vs draft identity, sensible provenance |
| C08 | advancing Worker held90ms slot action, next edit without changing active spec, navigation/pause/freeze/compare; necessary v4 regression already covers unaffected sections |
| Error/edge | incompatible single/pair/size, malformed/nonfinite/unsupported catalog atomic; old local variants remain intact; no new catalog-created mass override |

Полный12h/matrix и H3600 повторно не нужны для data/preset изменения. Нельзя переносить
старый численный outcome на изменённые defaults; новый short actual fixture обязателен.
Legacy/kernel/Worker/scenario algorithms не входят в changed runtime surface; если
изменение этих owners окажется необходимым, Developer возвращает named requirement PM.
Native/physical/public deployment не подменяются viewport/localhost evidence.

Rollback: сохранить immutableff8 artifact и old0.2.0 exported objects; при дефекте
вернуть owned4188 на него, feature delta остаётся в Git для исправления. Пользовательские
страницы не перезагружаются автоматически. Existing4183/4186 не останавливаются.
