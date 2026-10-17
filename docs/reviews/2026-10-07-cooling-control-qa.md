---
title: "QA: автоматическое охлаждение H₂ / Active"
status: reference
date: 2026-10-07
role: "Independent QA2/5 · ulab-6xr"
model: "Codex; exact provider/deployment model ID unavailable"
source_commit: "a3d02995b5d8953330510bba9cf08f23469341b8"
---

**PASS в ограниченном CC01–05 scope.** Пять адресованных AC прошли собственные проверки; product BLOCKER/FAIL не обнаружены. Это исполнение той же QA2 session, в которой методы были записаны до реализации. Часовые числа и native результаты ниже измерены QA, не заимствованы из Developer GREEN. Физическое устройство и native engine hooks не проверены.

## Binding и независимость

Тестировались frozen source `a3d02995b5d8953330510bba9cf08f23469341b8`, baseline `c85047899a067c90e4c8f96224cbe8671ec54b76`, immutable `/Users/komleff/Documents/GitHub/u2-lab-cooling-control/.overgate-runtime/cooling-control-release/dist`. API — Vite SSR этого source, native — собственный HTTP4214 с теми же dist bytes, настоящий LAN `http://192.168.68.65:4214/`, secure=false. Root-owned серверы не менялись; QA4214 остановлен после измерений.

Candidate binding27215B SHA256 `92abf50955e2653ed54670683aba9b91625eeb925d891be93acc9108513e3a43`; release source FP `412bbeff3fcb03d8b20061e179360f7f10485bb86325c8cb9133f0fa68709190`; build FP `d7c5fd1fc1235138c2687a45a695417e84d9267c3338d7765ada3d6456086bf6`. Whole HOW10488B SHA `768bb5a2fa96721677d921125b247bb321f1cba43d88be71f9d2bcc5c067fde5`, source-authority7061B SHA `70a546ed7b09d0aa1368a25455986c18a8a68032ef60055f4ec4aa7e4a18a893`, candidate whole-contract FP `eef0e0126d76ec39d48e8285e20d148a151a5d7dd50b2d97a0a44d69e875cfa7`.

Собственный `execution-source-binding.json` связывает шесть affected runtime owners: physics.ts, diagnostics.ts, fitting-result.ts, fitting-csv.ts, fitting.ts, fitting-ui/telemetry.ts; пять неизменных Legacy kernel/builder/runner owners и неизменный suffix observeLegacy. Проверены committed/working bytes этих 11 путей и literal whole HOW/source-authority. Own FP `03c3190981a9d771e3e696276a17a1db9fb012fd8078a749d25bed74d970ae81`: ASCII sorted path + NUL + Git blob + LF, затем whole HOW и whole source-authority bytes. Full13 source/test и52 protected rows/17 assets — внешняя PM binding verification, не новая собственная пакетная кампания.

`methods.md`9307B SHA `90bfc7933712ffb17da876551370058f5bee875ff3f225cb2e5f5f3d7639221c` сохранён неизменным. Oracles: accepted palette0.4/doctrine0.2.8 U2@18d2c82, signed radiation, CΔT, finite buffer, m·q = host export + auxiliary energy. Controlled isolation C/gates явно private synthetic; S cap20MW/aux50kW/q10MJkg/Active882m² и M80MW/200kW/3528m² — actual catalog data. Developer report прочитан только после собственных измерений.

## Case ledger

| TestCase | Source AC | Метод и измеренный результат | Result | Evidence |
|---|---|---|---|---|
| CC-Q01 | CC01; palette§§7–9 | S/M: T299/300 и здоровый350K → own cooler flow/host/aux0. Natural radiation и конечный buffer покрывают ввод →0. После критического STOP нагрузки при530K cooler продолжает удалять stored heat. Empty H₂/aux power не создают ресурс. При floorOFF независимый H₂ generator продолжает свой расход. | PASS | api-short.json; buffer-corrected.json; api-corrections.json |
| CC-Q02 | CC02; palette§§4/10 | S/M Active при фоне=300/400K и корпусе300K: aux0, endpoint/charge совпадают с noActive. Hull/Passive принимают signed incoming heat. Без applyFit один установленный Active проходит фон100→500→100K: pump positive→0→positive. | PASS | api-short.json, Q02 rows |
| CC-Q03 | CC03; doctrine energy ledger | Те же два private S/M crossing fixtures, интервал0.05s, dt.01/.005/.0025: T300K, одинаковые endpoints/интегралы; S host4000J/aux10J/H₂0.000401kg, M16000J/40J/0.001604kg. m·10MJ = host+aux, CΔT=−host; residual ≤2.2e−11J. Другой natural path продолжает охлаждать ниже300 при coolerOFF. | PASS | api-short.json, Q03 rows |
| CC-Q04 | CC04 + CC01/02 | Собственная fresh hour-пара: все виды журнала учтены, adjacent-dt одинаковых diagnostic episodes0, dropped0. Auto225events/46423ticks, OFF67events; normal floorOFF не становится first limiter. Native touch390: genuine Worker→3.2s→Pause, ACK31.4ms; actual log показывает controls version/floor mode, errors0/request failures0. | PASS | hours.json; native.json; native-paused-result.json; native-paused-390.png |
| CC-Q05 | CC05; coupled operator risk | Exact Downloads Pony-DH/no generator + same fit only coolerOFF, fresh DEFAULT/stationReplenish=true/H3600/.1s, fractions1. Оба доходят доH и продолжают mining. Short lawful Industrial M/H₂gen+tank+cooler с сохранённым Diesel tank конечен/30s. Native new JSON/CSV/OPEN сохраняет actual channels; собственный old2.26s result OPEN/export byte-exact, no Worker posts; bad import оставляет last valid result. | PASS | hours.json; M-short-result.json; M-ledger-corrected.json; api-corrections.json; native.json/downloads |

Таблица — пять addressed AC, а не пять полных матриц всех корпусов/ширин. `case-ledger.json` содержит связь с original source-first methods и точные подадреса. Первые две buffer assertions после correction относятся к тем же исходным адресам, не к новым cases.

## Собственная часовая пара и короткий M

Inputs: exact `/Users/komleff/Downloads/u2-ship-fit-pony-dh.json`, Pony/battery-S/two H₂tanks/cooler-S/removable Industrial-S + builtin G0/hold36; **генератора нет**. Свежие DEFAULT:300K/background100K/100km/full-hold/repeat/stationReplenishON/H3600/dt.1; MAX-equivalent API без искусственного pacing. Raw spec/hash каждого опыта в hours.json/hour-*-spec.json.

| Own H3600 | Cycles / delivered SCU | Onboard SCU | End T / SOC | H₂ remaining kg | Received station J | Wall seconds |
|---|---:|---:|---:|---:|---:|---:|
| Auto | 4 /144 |33.480853 |500K /.866993 |944.654366 |8.610209e9 |25.038 |
| Only cooler OFF |2 /71.999999994 |12.996952 |530.139261K /.937848 |1266.915160 |4.532785e9 |21.701 |

Оба фактически интегрировали3600s, stage mining; нет ложного terminal. Initial+received−consumed=remaining: worst fuel residual <9e−10kg. Energy residual Auto+.004273J/OFF−.015436J. First actual limiter — thermal около685.05s, не normal floor control; контролируемая работа и сервисы продолжаются.

Auto event kinds: phase23, controls-version1, cooling-control29, arrival9, cargo-full4, service4, thrust-thermal72, thermal48, wear14, recovered21. OFF: phase13/version1/arrival5/cargo2/service2/thrust-thermal22/thermal21/wear1. Отсутствует рост одинаковых episode сообщений каждый dt; это собственные counts, не Developer oracle.

Auto97channels/3600buckets, actual cap40041 и estimated12067200B <128MiB; OFF имеет свой actual channel set/cap. Не вводится fixed118/135 acceptance. Большой hour JSON сохранён gzip; полные значения/array dimensions успешно прошли настоящий parser и actual export serializer. CSV содержит новые actual cooling W/1 поля. Это проверка обычной retention bound, не отдельный maximal eviction stress.

M30s: H₂ generator1.266872kg, cooler0, дизельные propulsion purposes отдельно; FirstLimiter null. GeneratorHost min не отрицателен. Независимо accounted source = chemical1.105294e9J + incoming hull310589.088J = source1.105604e9J; discrepancy−5.25e−6J, ledger residual.000537J, relative4.86e−13. Mean/min/max retained samples не выдаются за точный integral variable-dt flight; химический source и incoming radiation вычислены из stocks/actual area/time.

## Harness corrections, scope и подпись

Ошибки оснастки сохранены отдельно от product findings: plain JSON.stringify превратил Float64Array в numeric-key object; actual UI replacer Array.from исправил roundtrip. Первый M builder оставил orphan instances, следующий не сохранил требуемый Diesel tank; только fixture topology исправлена. Buffer benchmark пропустил coolingW при ненулевой storage; ровно два адреса повторены с явной conductance. Первый M post-readback не включил incoming blackbody source; исправлен полный source equation. Первые FAIL/error logs сохранены; исходные expected не ослаблены. Часы и native Worker не повторялись ради этих corrections. Guess binding key/indent/path и разовая Python syntax typo — metadata/harness, не runtime defects.

Fresh own: bounded S/M ledger/transitions/refinements, два H3600, один M30s, один native touch390 Worker+OPEN/export workflow. Inherited: Legacy numerical owners и observeLegacy suffix byte-equal; исторический recorded old result сохранён. Равенство compiled Legacy observer chunks не заявляется: общий observer изменён. External: Developer normalguard514unit/54browser+SKIP/26cloud; он не заменяет эту QA.

NOT RUN: физический Xiaomi/OS gesture, Unity/native engine hook activation, Pages deployment, merge;81 historical capture/12h/all-hull matrices, whole UI cleanup, новый Stealth/износ. Отдельный Active closed-gradient journal fixture/forced maximum retention eviction не прогонялся: Active physical behavior проверен S/M, actual H₂ journal/retention — часовой парой. Не делается universal performance promise. Own screenshot просмотрен; косметическая приёмка не заявлена.

Все ссылки на evidence в таблице относительны к `/Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/cooling-control-qa/`. Manifest фиксирует raw/download/script/report bytes и SHA256; compressed-raw-index.json связывает gzip с original bytes. Source freeze **можно снять после readback/seal**; root ports/исторические seals неизменны. QA завершена, IDLE.

Подпись: Independent QA / Codex (exact provider/deployment model ID unavailable),2026-10-07, runtime a3d02995b5d8953330510bba9cf08f23469341b8.
