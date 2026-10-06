---
title: "Ship Fitting catalog0.2.1 — независимая affected QA"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
candidate: 131570d8f018d3617067bb558099f68aff7c9a53
baseline: ff8f3e8500a54b485dec507882f88820d0c2d304
result: PASS
scope: C01–08
---

Независимая affected QA C01–08: **PASS; подтверждённых product FAIL нет**. Выполнены две целые ordinary-LAN цепочки на1440 и true isMobile+hasTouch390, адресные inventory/numeric/version/ownership проверки и fresh opening. Это восемь адресов текущего дополнения; внутренние assertions, ширины и reopen не считаются новыми независимыми AC. Старые v4 QA1/QA2 и их FAIL/closure history не переписаны.

Ожидания зафиксированы до Developer explanation в `catalog-0.2.1-qa-case-plan.md` и `source-first-expected.json` (SHA256 b5740ea8a88f2652ecb9394f0761491886d4306884c3ca55957c74434366ad35). Authority: `docs/product/ship-fitting-catalog-0.2.1.md` и **весь** Verification Contract в `docs/plans/2026-10-06-fitting-catalog-0.2.1.md`, включая error/edge/scope/rollback. Plan Review PLAN_READY принят. Developer report/tests не использованы как oracle.

Exact runtime/worktree: `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`, clean HEAD131570d8f018d3617067bb558099f68aff7c9a53. Artifact: `.overgate-runtime/fitting-catalog-0.2.1-candidate/extracted/dist`. Обе browser-цепочки выполнены по `http://192.168.68.65:4188/?v=cat021-131570d8`, **secure=false**, в независимых QA pages; пользовательские страницы и owned servers не изменялись. Localhost использован только для сверки asset bodies.

| Case / source AC | Собственный метод и actual | Result | Evidence¹ |
|---|---|---|---|
| C01 · WHAT engines; VC C01/C06/error | 5 additive SKU; четыре engine bills160т; неизменные SKU mass/force при march↔retro и pair strafe↔turn; single/pair/size несовместимости отклонены | PASS | numeric-results; new-inventory; LAN-* |
| C02 · WHAT user fit; VC C02 | Независимый material ledger и native монтаж C02. Dry412245.5504768165kg, C193730758.72410375J/K, fuel24т, cargo240m³. Аналитическая loaded mass796245.5504768165kg | PASS | custom-fit/compiled; numeric-results; *-new-fit |
| C03 · WHAT defaults; VC C03 | Все18 count-addresses:16 valid +2 штатно rejected Sputnik:3/IndustrialS:3. Полный builtin/removable count; размер/Class/G; остальные defaults и L3 bulkM сохранены | PASS | preset-inventory; numeric-results |
| C04 · preservation; VC C04/C05 | 40 старых SKU неизменны; hull/builtin owners сохранены. Old/local fit/run/result не переписаны. Native old snapshots открыты без rerun; own20/25s replay совпал | PASS | binding; numeric-results; old-replay-proof; LAN-* |
| C05 · identity; VC C04/C05/error | Old/new catalog gates; unknown default refusal и прежний explicit snapshot-only opt-in. 8 native invalid classes атомарны; recovery valid. Три result version edges rejected | PASS | numeric-results; version-result-edges; corrected-slices-* |
| C06 · alpha/material origins; VC C01/C06 | Genuine isolated march .01s: fuel.073354176kg; chemical315422956.8W; useful126169182.72W; host132477641.856W; exhaust56776132.224W | PASS | isolated-engine-ledger; numeric-results; expected |
| C07 · LAN whole workflow; VC C07 | 1440/390: catalog→C02→Worker30s→limiter/analysis→native downloads→6 fresh fit/run/result opens. Linked zero-charge8s дал actual power limiter1.2639405204460965s; bucket values верны | PASS | LAN-*; fresh-*; corrected-slices-*; *-limiter-power.png |
| C08 · v4 regression; VC C08 | H180/×1 advances; held native march/payload actions; next edit/foreign oldB не меняют activeA. Navigation→Pause/FreezeA→Cancel→oldB5s→Compare, явная base сохраняется при sort | PASS | LAN-*; *-active-*.json; *-held-*.png; *-compare.png |

¹ Raw файлы — primary `.overgate-runtime/catalog-0.2.1-qa/execution-r1/`; сокращения соответствуют `.json`, если другое расширение не указано. Полные адреса/source/method/results находятся в `case-results.json`, hashes каждого raw файла — в отдельном `catalog-0.2.1-qa-evidence-r1.json`. Предварительный40KB/старые полные матрицы здесь не воспроизводятся.

Числовой oracle независимый: march16,2288MN; retro=3/7 march=6,9552MN; pair=9/35 march=4,17312MN на каждом из двух слотов. Массы четырёх bills82,352941176/35,294117647/21,176470588/21,176470588т дают160т, без скрытого role/Class/G множителя или удвоения pair. η.40 и α=.565e−6×.32/.40=.452e−6kg/(N·s); при diesel43MJ/kg измеренный fuel/heat ledger совпал с формулами. η/path.95/host.70/material cp/gates остаются явно лабораторными hypotheses, canonical/derived force не смешан с ними. C02 full cargo — только analytical1500kg/m³ ledger, без нового UI/mission или hardcoded ship total.

Default roster: Sputnik CivilianS/G1, IndustrialS IndustrialS/G2, CivilianM CivilianM/G1, IndustrialM IndustrialM/G2, IndustrialL IndustrialL/G2; Pony S/UNKNOWN/G0 builtin clone. Новые CivilM12MW/8.8т/η.5001 и IndustrialL54.4MW/48т/η.528093 совпали. Увеличенная нагрузка не трактуется как обещание непрерывной добычи. :3 у двух малых hulls отклонён из-за сохранённых двух payload slots.

Native C07 использует exact C02 roster, T300K/charge1, horizon30/.01/MAX и фазы1/10/1/1/1 с repeat. Genuine Worker завершил time=metrics duration=30s. Нулевой firstLimiter показан как «не выявлено за измеренный интервал». Отдельный charge0/8s fixture показал «Питание ·1,26с» в actual `#lab-first-limiter`, совпадающий с metrics. Выбранный interval heat/K проверен собственными sum/count/min/max против видимой таблицы. Fit открывается как монтаж, run как snapshot для явного Start, result немедленно даёт анализ без Start; native Unicode filenames/download bytes сохранены. Ошибок страниц и request failures в завершённых workflows/reopens/corrected slices:0.

C08 реально проверен во время RUNNING, без Pause до anchors. Desktop pointer удержан110.6ms на march и95.7ms на payload; узел connected и тот же на down/up/click. Touch390 adjacent actions также выполнены настоящими жестами. NewA.active.spec остаётся0.2.1/H180 при импорте oldB0.2.0/nextH60; один Worker/secondStart disabled. Pause→Freeze сохраняет activeA, Cancel не меняет reference; B затем запускается отдельно и экспортирует actual0.2.0 в spec и fit. Compare sort не меняет явную base. Old/native run и result повторно сохраняют исходные snapshots без автоматического remount/rerun.

C05 corrected negatives на каждой ширине: malformed JSON, consumed1e999, old catalog alias нового global SKU, unknown fit, unknown run, required generator path missing, required engine origin missing, broken result interval. Каждый отказ сохранил native fit/result bytes, frozenA и base; позитивный импорт после отказов прошёл. Дополнительно API отклонил result с old/global alias, unknown0.2.2 и spec/fit catalog mismatch. Unknown numerical RunSpec разрешён только прежним явным `allowSnapshotReplay` и маркируется `snapshotReplayOnly`; этот opt-in не обходит known inventory mismatch.

Harness history сохранена, **не переименована в product PASS**. Первые попытки остановились на легитимно disabled Apply уже установленного SKU и collapsed mobile slot group; controls скорректированы по actual DOM/source. Numeric harness ошибочно перебрал информационное поле method как fixture; исправлен только фильтр/logger. Завершённые LAN JSON содержат35PASS/3FAIL на ширину: неверный limiter container и удаление optional diesel path породили ложный отказ/изменение fit. Actual diesel path не required; sourceExpected требовал отказ missing **required** fields. Повторены только связанные assertions с правильным `#lab-first-limiter`, required generator path/origin и atomicity: corrected slices14PASS на каждой ширине. Порядок object keys нормализован для semantic equality; ни числовые ожидания, ни WHAT не изменены. Первоначальные logs/scripts/STOP shots и false assertions сохранены в manifest. Numeric70PASS — внутренние assertions, не70 новых cases.

Binding выполнен независимо до product imports. Все149 committed/working source entries совпали с immutable manifest. Source fingerprint (sorted path+NUL+GitBlob+LF):
`37b05e2e0da57b82231c0f632d56cc7bb092c3364ea124bfe183f4b2977fd42c`.
Для content-equivalence отдельно137 relevant paths + literalwhole7 contracts в указанном порядке +2 accepted operator notes:
`55562f6af68289e893a9170617255a2dc5d1fb5fadb835449230fd3761381e05`.
Полные paths/blobs/hash/метод — `binding.json`. Reviewed direct owners: fitting catalog/types/compile/validate/data, fitting/result JSON IO, scenarios/fitting, v2 step/runner, app/workspace controls и native DOM. Protected proof:74/85 unchanged, известные11 changed перечислены в binding; **не85/85**. Scenario delta ровно stamp `c.version→f.catalogVersion`, не phase/physics algorithm. Старый numerical replay20s +local25s реально повторён текущим runner: canonical spec/state/metrics/trace SHA одинаковы; runId/events/partition metadata исключены явно. Это bounded carryover, не новый12h и не equivalence изменённых presets.

Artifact независимо проверен: ZIP CRC,18 файлов extracted/dist/ZIP и36 fetched bodies localhost/LAN совпали. Source manifest81646B SHA91ce2b132eeb154175bee4a0af5071b83bc1004788fb818019ec265daaeea633; build manifest3437B SHA23403c0dd7656c14b2557ac33adf01948950c6f56ff13f53ed260a8ef29d21b1. ZIP525540B SHA643fab21d1d7b3fc13c43c5c5a7e08e1c1cacef41f3cc7558d45173bcf3790db; dist1327422B digestd13b6049b49c557358ca0ccb8cc56f11ac780194de6a07a7d0db05b27485c254. Own private Node24 probes: numeric.mjs, old-replay.mjs, version-result-edges.mjs; Playwright browser-chains.mjs и corrected-slices.mjs. SSR cache и всё output — ignored; product/tests/build/server не записывались. PM/DEV normal guard остаётся чужим evidence, own full guard здесь NOT RUN.

Старые QA1/QA2 seals и source-first prep проверены повторно:315 referenced read-only файлов совпали по bytes/SHA/mode. Новые defaults не наследуют старые outcomes; их current short Worker измерен заново. Не повторены old full7/72, H3600,12h/численный matrix/CI. Physical Xiaomi/tablet, native OS/browser gesture/public Pages/base/merge gates NOT RUN; touch emulation не physical PASS. Flight/full-hold/refuel/ROI/production BOM/National tuning вне C01–08. Других открытых source ambiguities или product blockers в выполненном scope нет.

Подпись: independent QA / Codex; exact provider model ID unavailable. Результат PASS ограничен C01–08 и измеренными workflows/slices. Runtime execution завершено. После byte/hash readback и seal текущий source freeze RELEASED для PM/combined scoped Code Review; публикацию и любые изменения выполняет PM.
