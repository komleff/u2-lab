---
title: "Affected QA: cooling interval diagnostics"
status: reference
date: 2026-10-07
role: "Independent QA4/5 · ulab-6xr"
model: "Codex; exact provider/deployment model ID unavailable"
source_commit: "c9e09b2c1037717d6209a7e38e3d13b893d66eb1"
---

**PASS — CR-CC-B1 CLOSED в адресованном scope.** Четыре risk rows прошли; product FAIL0. Own API/Worker evidence отделён от inherited QA2 и harness ошибок. Новая physics/hour/UI кампания не проводилась.

| Case | Source AC | Own method / actual | Result | Evidence |
|---|---|---|---|---|
| B1-01 | CC04/Active | Два validated mixed crossings: Active-S399.9→400.117566 при bg400; Active-M+finite buffer пересекает вниз. Closed/request shares, T endpoints и end timestamp честно подписаны принятым интервалом. Observer не меняет spec/state/telemetry. | PASS | api.json; correction.json |
| B1-02 | CC04/CC01 | Actual H₂ floor→request, noNeed→working request, downward noNeed→floor. Последний300.1→299.111458/.5s: floor89.9068%, noNeed10.0932%; event t.5, не t0. Positive mean flag не объявлен мгновенным состоянием начала. | PASS | api.json; correction.json |
| B1-03 | CC04/CC02 | Useful Active request/aux0 назван запросом, без OPEN/deployed claim; funded control даёт actual aux>0. Реальная requested mining power shortage сохранена. | PASS | api.json |
| B1-04 | CC04 | По100 real accepted uniform steps Active/H₂: один control event на класс. Actual critical mining и empty H₂ имеют honest thermal/combined resource причины. LAN touch390 Start→13.5s→Pause ACK30.1ms; actual DOM journal52.5% request/47.5% closed, interval0–.5/T399.900→400.118; errors0. | PASS, bounded native proof | api.json; correction.json; native-readback.json; native-dom.txt |

Всего четыре fresh risk rows,12 resolved targeted API assertions, один fraction-text readback, один bounded native workflow. Повторения/исправления оснастки не новые independent cases. Для всех positive flag shares отображаемое округление проверено по собственному telemetry. Private snapshot corridor/positive heat/fog — явные isolation inputs, не новые TTX; downward fog transport взят из Developer regression после source-first метода, но ожидаемая честность и исполнение собственные.

Harness history сохранена. Первый downward request fixture остался300.000001K/request100%, mixed input не получился: это не ошибочная label. Ровно его заменил validated actual noNeed→floor crossing. Empty H₂ event оказался законным diagnostic-thermal-resource; exact-kind assertion исправлен. Native Start/Pause/DOM чтение завершены до двух timeout строгого getByText scroll selector. Label screenshot/extra export НЕ выполнены; export вне affected scope. Это не product exception и не новый IO PASS. native-harness*.json/log и native.json сохраняют ошибки; native-readback.json явно ограничивает claim.

Runtime frozen c9e09b2…; immutable cooling-control-interval-fix-release/dist, собственный LAN4214, true isMobile+hasTouch390; не physical Xiaomi. Binding SHA `5dcd55d584795e969b67902bb7b6f4c5ba5a0f223acf20175aa7fbe34546026e`. Independently verified2 delta rows (diagnostics.ts/existing test) sourceFP `1679209a4b5b409a59981fe40542a2e595a8c9d73b4ccb792baf4b3f2cad73b2`; buildFP `8b144bf2ea16377ad30b3e2c39ea04257257f297f0c01f1e2011c9afce99d529` — PM17-assets proof, не повторялся.

Whole HOW10488B SHA768bb5a2… и source-authority7061B SHA70a546ed… unchanged; whole-contract FP `eef0e0126d76ec39d48e8285e20d148a151a5d7dd50b2d97a0a44d69e875cfa7`. Sealed methods3952B SHA19175b9… unchanged. Own source-binding.json:2delta+5physical/IO/UI carryover rows, committed/working bytes, literal whole HOW/source-authority+methods; own FP `b66469a59ca25b1639215bd9a8eaeefff9eb4a16b4d69386d2e66c52b2684b04`.

Inherited CC01–03/05 — QA2 report SHAe9512519…/exact physical+IO+UI owner equality кa3. Часовые physical/metric результаты сохраняют evidence; старые observer event counts остаются историческими, не объявлены current c9 measurements. Не повторялись часы/M sweep/oldOPEN/fullguard/package57/retention stress. NOT RUN physical/native engine hooks/Pages/merge. External Developer/PM GREEN не переименован в own execution.

Evidence root: `/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/cooling-control-qa-interval-fix/`; manifest содержит absolute paths/bytes/SHA256. Own4214 остановлен, root servers/старые seals неизменны. После exact seal/readback source freeze RELEASED; QA IDLE.

Подпись: Independent QA / Codex (deployment ID unavailable),2026-10-07, c9e09b2c1037717d6209a7e38e3d13b893d66eb1.
