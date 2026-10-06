---
title: "Developer: автоматическое охлаждение H₂ / Active"
status: reference
date: 2026-10-07
role: Developer
model: "Codex / GPT-6; serving ID не раскрыт"
source_commit: "a3d02995b5d8953330510bba9cf08f23469341b8"
---

DONE_WITH_CONCERNS — реализация CC01–05 готова к независимой QA/Review. Acceptance и merge readiness не заявляю. Ветка feat/cooling-control; baseline c85047899a067c90e4c8f96224cbe8671ec54b76.

H₂ выбирает необходимую мощность из общего фактического теплового/electric ledger: обычные пути сначала, остаточное тепло и safe restart существующих gates — затем. Ниже/ровно300K own flow/aux/removal0;300K не постоянный target. Active закрывает площадь/pump/heat при неполезном градиенте и открывается после физического пересечения. Температура не обрезается. Shared H₂ consumers и actual generator heat/export сохраняют conservation. Optional control telemetry получила только допустимые W/1 каналы существующего JSON/CSV; новый расчёт явно отмечен в footer/event.

CC01–03: исходные6 meaningful RED → GREEN; S/M, shared stock, source coupling, stored heat после STOP/restart, natural cooling и dt .005/.05/.5. CC04: false OFF causes и два log-spam класса RED→GREEN;100 alternating propulsion requests →2 identity warnings/1 wear. CC05: exact operator Pony-DH, no generator, оба лазера, fresh DEFAULT_MISSION_CONDITIONS/stationReplenish=true:

| H3600 | Рейсы / доставлено | Добыто / onboard SCU | T / SOC | Events / dropped |
|---|---|---|---|---|
| Auto |4 /144|177.480853 /33.480853|500K /.866993|225 /0|
| Только cooler OFF |2 /72|84.996952 /12.996952|530.139K /.937848|67 /0|

Оба дошли до H, продолжают mining, terminal=null. Auto received charge8.610209GJ; stocks diesel11869.212/H₂944.654kg. OFF received4.532785GJ; diesel11955.702/H₂1266.915kg. Energy residual +.004273/−.015436J; wall24.47/21.08s. Medium30s: mined14.174289SCU, actual H₂ generator1.889527kg/cooler116.447934kg, residual−.000433J. Все event counts по видам и source SHA256 в operator-hour-sealed.json; предшествующие exploratory absent-policy пары не выдаются за defaults.

Fresh normal pre-bash commit guard exit0:514 unit,54 browser PASS/1 прежний SKIP,typecheck/build/reference/bootstrap/26cloud PASS. Адресные65 unit PASS. Первый guard512PASS/2FAIL сохранён:135channels требуют актуального fixture count; independent frozen-c850 FULL station hash подтверждён, все physical fields и старые events exact, добавлен только version event/totalEvents+1. Исходные historical fixtures неизменны; новый tiny digest addendum. Память127919512B,135channels/31476buckets/20000events — ниже128MiB.

Native localhost финального guard:1440/true-touch390, real Worker/Start/Pause/log, stock, A, replay/atomic rejection. Собственная LAN цепочка2PASS + старый paused-result OPEN byte-exact выполнена до финального observer episode fix; окончательная independent LAN QA pending. Physical Xiaomi, actual native hook activation, Pages deployment,12h/manual81 sweep NOT RUN. Реально вызван штатный pre-bash guard; обходов нет.

Изменённые пути:

- src/app/fitting-ui/telemetry.ts
- src/app/fitting.ts
- src/io/fitting-csv.ts
- src/io/fitting-result.ts
- src/model/v2/physics.ts
- src/runner/diagnostics.ts
- tests/browser/cooling-control.spec.ts
- tests/fitting/cooling-control.test.ts
- tests/fitting/fixtures/cooling-station-old-digest.json
- tests/fitting/medium-hybrid.test.ts
- tests/fitting/station-service.test.ts
- tests/model/cooling-control.test.ts
- tests/retention-memory.test.ts

binding.json содержит13 source rows,52 unchanged src blobs (Legacy numerical kernel/catalog/mission/Worker/workspace/render owners), wholeHOW+source-authority,17 readonly dist assets, guard/raw evidence. observeLegacy suffix byte-exact; общий observer изменён, равенство compiled Legacy chunks не заявляю. Никаких schema/catalog/TTX changes. Tracked tree clean; authorized node_modules symlink оставлен unstaged. Существующие серверы/артефакты не трогал.

Source FP 412bbeff3fcb03d8b20061e179360f7f10485bb86325c8cb9133f0fa68709190; build FP d7c5fd1fc1235138c2687a45a695417e84d9267c3338d7765ada3d6456086bf6; whole contracts FP eef0e0126d76ec39d48e8285e20d148a151a5d7dd50b2d97a0a44d69e875cfa7. Recipe: sorted relative path + NUL + lowercase SHA256 hex + LF, UTF-8; SHA256 всех bytes. Working blobs равны committed.

Подпись: Developer / Codex(GPT-6),2026-10-07, exact a3d02995b5d8953330510bba9cf08f23469341b8. Source/build frozen; IDLE.
