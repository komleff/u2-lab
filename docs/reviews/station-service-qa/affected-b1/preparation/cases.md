---
title: "CR-ST-B1 — affected QA методы"
role: independent QA
model: "Codex; exact provider model ID unavailable"
status: PREPARED_WAIT_TEST_RELEASE
runtime: NOT_RUN
---

ulab-558, call4/5. Whole plan ST03/ST05 и CR-ST-B1: explicit OFF запрещает positive received fuel обоих species; ledger consistency не отменяет policy. Исходный ST01–06 PASS остаётся историческим scoped evidence, этот counterexample им не покрыт.

| Адрес / SourceAC | Независимый метод → expected | Runtime |
|---|---|---|
| B1-01 / ST03, ST05 | Own OFF measured result; diesel receipt +1kg, remaining и currentMass +1kg, explicitOFF и charge receipt0. Initial+received−consumed=remaining и capacity проверены арифметикой. parseResultJson reject; workspace до/после deep-equal (fit/result/A/conditions). | NOT_RUN |
| B1-02 / ST03, ST05 | Такой же независимый H₂ receipt +.01kg; diesel receipt0. Та же balance/capacity/mass проверка; parser и workspace reject атомарно. | NOT_RUN |
| B1-03 / ST03, ST05 | Captured legal OFF0 и ON с положительными D/H₂ принимаются без смены данных. Absent fuel-only positive endpoint сохраняет absence и noCharge; при необходимости один короткий API capture полного legacy result, не повтор ST02. | NOT_RUN |
| B1-04 / ST05, ST06 | Одна LANtouch390 import-only цепочка: legal result→FreezeA→по одному bad D/H₂ import→native fit/result exports + A readback. Оба отказа видимы; bytes/identity/A неизменны. Затем legal open подтверждает recovery. Worker/горизонт native не требуется. | NOT_RUN |

Fixture recipes не используют Developer test helpers/GREEN; ожидаемый отказ — policy, не придуманное точное error wording. Forged documents — контролируемые parser counterexamples, не настоящие рейсы. Valid controls используют own captures, а не future fix output. До exact TEST_RELEASE никаких parser/Worker/browser probes, mutable code не читается. Только old a625 owners через git show.

Остальные initial ST01–06 claims переносятся лишь по bounded unchanged-owner delta proof при release. No full6ST/native chain/H3600/12h/guard/package/17assets campaign. Physical/native/public/main/merge NOT_RUN отдельно. После подготовки остаёмся в этой running session до release.
