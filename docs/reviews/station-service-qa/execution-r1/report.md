---
title: "Станционное обслуживание — независимая QA"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
status: PASS
source_sha: a625c79c5fbc8cfc706c87d0631fc0204c1689fb
scope: "ulab-558; ST01–06; QA call2"
---

Независимый scoped verdict: **ST01–06 PASS, продуктовых FAIL не обнаружено**. Выполнены шесть адресов принятого плана и одна настоящая Worker-цепочка на обычном LAN HTTP с эмуляцией touch390. API содержит 59 успешных assertions; native — 16 после исправления чтения сохранённого текста. Assertions пересекаются с AC и не считаются дополнительными cases. Предварительные методы [cases.md](../preparation/cases.md) сохранены неизменными, SHA256 `616f2b6b5c26f871798133586fb9b80a971a1e3386cb0f2346cc6753a8fef4d4`.

Источник: `a625c79c5fbc8cfc706c87d0631fc0204c1689fb`, baseline `3ced4ba1fd69df6f7c03d298d340ee69593113dd`. Whole accepted plan `docs/plans/2026-10-06-station-service.md`, 7955 B, SHA256 `05f63be7874e759af7b95f01c35de28692aad4922350562b509dd49e136b20aa`. В [source-binding.json](source-binding.json) перечислены 18 прочитанных/проверенных необходимых owners: 11 изменённых runtime и семь неизменённых. Собственный fingerprint `6260f937663c34c5025834568d6ad17934628a1e03fca132c72194304cb84bad`: SHA256(sorted path NUL gitBlob LF + literal whole plan/ST01–06). Это bounded binding, не заявление о проверке всего репозитория.

Исполненный immutable build: `u2-lab-claude-ui/.overgate-runtime/station-service-v2.2-candidate/extracted/dist`; URL `http://192.168.68.65:4194/?v=station-a625c79`. PM packaging proof унаследован: 17 source rows FP `dcd2722277380407ef17621ec81897091f1f9b01ed685c8d0eb20a54b3f7c866`, 17 assets build FP `e5cd36e11972cbacdcbd9fbb7ad05849cc3613643ba16f1a839186d8e7dd8747`; повторного ZIP/source/HTTP campaign QA не делал. ZIP для этой поставки не создавался.

| Case / SourceAC | Собственный метод → фактический результат | Result / Evidence |
|---|---|---|
| ST01 / whole plan ST01 | Fresh ON; первый native Start после H edit без Tab; при активном OFF следующий ON, pause/freeze/export/cancel. Started spec и active export остались OFF, next ON сохранился. | PASS · `api-final.json`, `native-OFF-start.json`, `native-active-OFF.json`, `native-corrected.json` |
| ST02 / ST02 | Pony:1/.3 с обоими typed stocks, H20/dt.1/D1m/target.01SCU/service2; endpoint против прямого физического шага predecessor. t=3.479560821 s: Q=10 GJ; получено 6.998090375 GJ, D=7200.756082 kg, H₂=380.132541 kg. T=298.267758 K и buffer=69.591216 MJ равны обычной physics. | PASS · `ON-actual.json`, `ON-spec.json`, `endpoint-mass-readback.json` |
| ST03 / ST03 | OFF тот же рейс: Q=3.001909625 GJ, station receipts=0, unload/cycle=1. Lawful no-tanks и full-stock controls finite/0; no-battery отказал по прежнему обязательному battery. | PASS · `OFF-actual.json`, `full-stock-actual.json`, `no-tanks-actual.json`, `no-battery-refusal.json` |
| ST04 / ST04 | H внутри inbound/service, точно endpoint и после; следующий completed chunk. До service-end receipt/unload=0, на границе один. Два реальных .2s service endpoint (.2/.4s) дали cumulative 10.000044444 GJ>C. Hot zero-phase H5: time5, cycles0/receipt0. | PASS · `mid-*-actual.json`, `exact-end-actual.json`, `after-end-actual.json`, `cumulative-short-services-actual.json`, `zero-service-recovery-actual.json` |
| ST05 / ST05 | Absent-policy остаётся fuel-only/no charge field; own prior .3 run/result и нынешние ON/OFF roundtrip. Неверные boolean/receipt и exponent1e309 атомарно отказали. Native bad result сохранил fit/result bytes и A; legal result открылся без нового Start; legacy warning явный. | PASS · `legacy-absent-actual.json`, `api-final.json`, `native-corrected.json`, refusal/reopen downloads |
| ST06 / ST06 | ON/OFF/absence различия несовместимы по mission policy. Station J отделён от kernel sourceEnergy/consumption; native ON t=21.479560821 s, receipt=6.984270375 GJ, tile=6,98 GJ. OFF frozen A t=1.396028734 s не изменился. | PASS · `native-station-tile.txt`, `native-policy-compare.txt`, `native-A-frozen.json`, `api-final.json` |

Формула receipt использовала фактический post-physics deficit, а не Developer expected. Проверены initial+received−consumed=remaining отдельно D/H₂, mined=delivered+aboard, масса=dry+actual stocks+cargo, немедленные chargeJ/SOC/storedJ. OFF сохраняет обычное изменение Q, а не постоянную зарядку. Full-stock control использовал явный private external100MW; это fixture, не новое каноническое ТТХ. No-battery не объявлен законной сборкой.

Native chain: fresh ON→импорт lawful dual-stock→OFF→×1/Start→advancing Worker→next ON→Pause/FreezeA→export active OFF→Cancel→MAX ON/completed service→Compare→bad result refusal→fit/result export→legal result reopen→legacy warning. `secure=false`, isMobile/hasTouch390; page exceptions/request failures **0/0**. Это один workflow с двумя Starts, не два независимых браузерных набора.

Единственный harness FAIL сохранён в `native-ST.json`: case-sensitive удаление русского label не учло CSS-uppercase, получилось NaN при чтении «СТАНЦИОННАЯ ЭНЕРГИЯ / 6,98 GJ». `native-corrected.json` разбирает число из уже сохранённого literal; разница с receivedJ/1e9=0.004270375 GJ укладывается в показанную точность. Runtime не повторялся, source Expected не менялся.

Numeric body `src/model/v2/step.ts` от `initialStateV2` до EOF равен baseline, SHA256 `d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08`. Унаследованные mission/M отчёты не переписаны. Fresh old .0/.1/.2 goldens, H3600/QA15/9-cell/12h/full guard **NOT RUN**; использованы собственные старые .3 fixtures и bounded equivalence. Developer normalguard 455 unit/47 browser +1 inherited SKIP — внешний evidence, не собственная QA. Его report прочитан после измерений, SHA256 `a72ebbdd5d578774bc6b64ecf73a6b81a749fe5e58d72c74dd10569584bd9d25`.

Полный six-row ledger: [case-ledger.json](case-ledger.json); scripts/downloads/исходный harness FAIL и corrected readback перечислены в [evidence-manifest.json](evidence-manifest.json). Точные report/manifest hashes — в `seal-receipt.json`.

Физический Xiaomi/OS gestures, native packaging, public deployment, base/bootstrap принятие, main/merge **NOT RUN / отдельные внешние gates**. Scoped PASS не заменяет их. Источники и root-owned servers QA не менял; после seal source freeze **RELEASED**.

Подписано: `/root/ship_fitting_qa`, independent QA; Codex, exact provider model ID unavailable; 2026-10-06. Повторных runtime-проверок не требуется; QA IDLE.
