---
title: "CR-ST-B1 — независимая affected QA"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
status: PASS
source_sha: 86dee5da9e8a9c45723b7e9a476b8b16bfb98f2b
scope: "ulab-558; call4/5; B1-01–04"
---

**Четыре affected адреса PASS; CR-ST-B1 counterexamples больше не принимаются.** Product FAIL нет. Собственные измерения:13 API assertions и7 native assertions внутри одной LANtouch390 import-only цепочки. Они пересекаются с адресами; это не20 независимых cases и не повтор исходных ST01–06. Runner steps, Worker Starts и measurement frames: **0**.

Exact source `86dee5da9e8a9c45723b7e9a476b8b16bfb98f2b`, baseline `a625c79c5fbc8cfc706c87d0631fc0204c1689fb`. Самостоятельно сверена ровно двухфайловая дельта: `src/io/fitting-result.ts` (+1 explicit-OFF fuel guard) и `tests/fitting/station-service.test.ts`. Whole accepted plan 7955B, SHA256 `05f63be7874e759af7b95f01c35de28692aad4922350562b509dd49e136b20aa`; signed finding source SHA256 `3ad919c0b722bde2fb5fc138ae4293460c2ef0cccbe25af4bfab617a12e15b2d`. Prepared Expected сохранены: `../preparation/cases.md`, SHA256 `ad93582e70b28d61cc75f11cdb9c4f006a7c50309b79e8d032bdfcb6ae27250b`.

| Case / SourceAC | Собственный method → actual | Result / Evidence |
|---|---|---|
| B1-01 / ST03,ST05,CR-ST-B1 | Own captured OFF; diesel received/remaining/mass +1kg. Ledger initial+received−consumed=4800.243917514kg, capacity12000kg; charge receipt0. Parser отказал только по diesel policy; весь workspace snapshot unchanged. | PASS · `api-final.json`, `negative-diesel-recipe.json` |
| B1-02 / ST03,ST05,CR-ST-B1 | Независимый H₂ +.01kg, diesel receipt0. Remaining253.335039320kg≤633.45758kg; масса/ledger согласованы. Parser отказал только по H₂ policy; workspace unchanged. | PASS · `api-final.json`, `negative-hydrogen-recipe.json` |
| B1-03 / ST03,ST05 | Legal captured OFF0 и ON positive, плюс authored absent/fuel-only control: parser и workspace принимают exact data. Positive D/H₂7200.756082/380.132541kg; absence и отсутствующий charge receipt не дописаны. | PASS · `api-final.json`, `legacy-construction.json`, `fixtures.mjs` |
| B1-04 / ST05,ST06 | Native legal ON import→FreezeA→bad D/H₂ import→native fit/result export→legal OFF open. Оба отказа видимы; bytes fit/result и A identity/metrics не меняются; recovery exact. | PASS · `native-B1.json`, `native-*-error.txt`, downloads |

Дизель и H₂ проверены отдельно: другой species receipt0, explicitOFF, charge receipts0, положительный баланс и допустимые capacity/mass. Таким образом отказ не вызван иной формой JSON или несогласованным ledger. Forged documents — контролируемые parser counterexamples, не заявления о настоящем рейсе.

Legacy positive control честно **authored full numerical snapshot**, не новый runner result: собственные уже измеренные legacy state/metrics/events/spec, совпадающий OFF trace и ON fuel-stock columns. Из сохранённых данных проверены одинаковый интервал, legacy Q=OFF и legacy fuel=ON, отсутствие flag/charge fields. Это проверка поддержанного opening/schema boundary; physics заново не выполнялась. Полные реальные ON/OFF snapshots — прежние собственные captures. Developer helpers/числа не использовались как oracle.

Actual URL `http://192.168.68.65:4195/?v=station-fix-86dee5d`, `secure=false`, isMobile/hasTouch390/maxTouchPoints1. Настоящие coordinate taps, file input и downloads, без DOM mutation/Start. Page exceptions/request failures **0/0**. Native ошибка для обоих species: «Выключенная заправка запрещает полученное станционное топливо». Legal OFF recovery сохранил предыдущий frozen ON A.

[Source binding](source-binding.json): три necessary owners IO/workspace/native caller;17 других runtime owner blobs из initial QA совпали с baseline. Own fingerprint `a3fa8ca109e15acb5f0110bd58d5ad5a769a6e2f17846a4e5fc4923025fb28d2` =SHA256(sorted3 path NUL gitBlob LF +literalwholePlan +literalwholeReviewerReport). Initial ST01–06 остаётся историческим scoped PASS (`8be3d53d0d975d34c6d5f52f7cfdf29aca856ce6b1804e7581a988ad47a31c14`); новые четыре адреса измерены отдельно. Ни initial report, ни прежние seals не переписаны.

Immutable artifact `u2-lab-claude-ui/.overgate-runtime/station-service-v2.2-candidate-fix-r1/extracted/dist`. PM bounded3 source FP `76bfc9aa33ca24f79697b50a368822f7f731b419752963c2cd80fe0a0112b8eb`, build17 FP `cd7c227ad4150f707b6b1d2e79d71e9bc54dd3db1f33db33c3d5b5b2798a9ba4` — inherited proof, не повторён QA; ZIP отсутствует. Developer457unit/47browser+SKIP — внешний evidence; report4985B/SHA`3272fd16a75bfd1c8641c3defd1e8c7417f757f45e1da4c456180ea73c30ab54` прочитан **после** собственных измерений.

Runtime harness FAIL нет. Подготовительный schema-reader KeyError(`state.last`) раскрыт в preparation binding; corrected reader использовал actual state.fuelKg/metrics.fuelSpeciesKg, runtime тогда не запускался. Initial uppercase/GJ harness history сохранён в прежнем отчёте.

[Ledger](case-ledger.json), [raw manifest](evidence-manifest.json), `seal-receipt.json` связывают точные bytes/hashes, scripts и downloads; full package/full6ST/native Worker chain/H3600/12h/guard **NOT RUN**. Physical Xiaomi/OS/native/public/base/main/merge — отдельные NOT RUN gates. Scoped QA не заменяет final Reviewer5 или operator acceptance.

Подписано `/root/ship_fitting_qa`, independent QA; Codex, exact provider model ID unavailable;2026-10-06. После seal source freeze **RELEASED**, QA **IDLE**. Дополнительных probes не требуется.
