---
title: "GD workspace v4 — targeted affected QA fix-r1"
date: 2026-10-06
role: independent QA
model: "Codex; exact provider model ID unavailable"
candidate: ff8f3e8500a54b485dec507882f88820d0c2d304
previous_candidate: 17bb6b66e6384ee53ee1250e8dc2399ef4a2256f
result: PASS
---

Affected QA: PASS. Исходный desktop BLOCKER V4-B1 закрыт собственным настоящим held-pointer воспроизведением на ff8f3e8. Оригинальный QA1 FAIL на17bb не переписан. Новый результат относится к узкому slot-fix scope и необходимым соседним ownership/navigation/touch slices; полные семь исходных цепочек и H3600 повторно не запускались.

| Адрес исходной приёмки | Source / expected | Выполненный affected метод | Result / evidence |
|---|---|---|---|
| V4-02 · V4-B1 | WF04/WF06: управление next draft доступно при неизменном активном опыте | Pony2/H180/.01/×1, advancing Worker; actual pointerdown на payload slot → hold90 ms → pointerup | PASS: catalog нужного payload-1 открылся, node подключён и идентичен. affected-1440.json |
| V4-01 / V4-02 · соседние действия | WF01–03/WF04/WF06: правильный slot либо builtin readonly action | На1440/820/390 held gesture по payload, propulsion, power, signature; ring и ring builtin на1440/820; builtin card на всех ширинах. Все видимые slot/builtin refs сверены через реальные chunks | PASS: правильный каталог/параметры, builtin не показывает Apply. affected-{width}.json; inventory-{width}.json |
| V4-02 / V4-04 · ownership | WF04–06/WF10–12: active A immutable, B editable, один Worker | Native payload cargo Apply в next A; own RunSpec export exact до/после; RUNNING anchors через четыре секции; foreign B/IndustrialM600; Pause/Freeze A → Cancel | PASS: A180 spec не изменён, B600 editable/second Start disabled, время растёт, reference полного текста неизменен. ownership-continuation-{width}.json; cancel-boundary-{width}.json |
| V4-07 · соседняя mobile проверка | WF14: ordinary LAN/native touch действия доступны | isMobile+hasTouch820/390, secure=false, настоящие удержания и действия в той же сборке/active Worker; snapshots управления и reference | PASS: LAN controls работают; no page exceptions/request failures. ownership-{width}-running.png; cancel-{width}-reference.png |

Это четыре affected-risk строки, а не четыре новых acceptance cases или fresh full replay V4-01/02/04/07. Семь исходных адресов сохраняют исходный sourceExpected: V4-02 получает свежую closure V4-B1; в V4-01/04/07 измерены только перечисленные связанные slices. Остальные representative результаты QA1 переносим по unchanged owner/contract/source proof, с прежними NOT RUN краями. Техническая closure не превращает физические/неизмеренные ветви в PASS.

Actual native жесты: desktop payload111,8 ms при requested90 ms; propulsion103,0, power94,5, signature104,8, ring104,0 ms. Во всех этих жестах pointerdown попал именно на intended node; pointerup сохранил тот же connected node и открыл нужный dialog. На1440 и820 проверены28 slot/builtin button refs, на390 —14: все остались connected/identical через genuine advancing chunks. На390 ring source fallback отсутствует, его touch действие не симулировалось. Для820/390 actual hold duration134,8/149,4 ms у payload, подробные timings сохранены. Это browser emulation, не физический планшет/Xiaomi.

Source delta ровно3paths: src/app/fitting-ui/ship-view.ts, src/app/fitting.ts, tests/browser/gd-workspace-v4.spec.ts. QA независимо просмотрел runtime diff: стабильные ids теперь формируются в fresh card/ring markup, post-render assignment удалён. DOM update owner/Worker/numerical/model/import owners не менялись. Expectations и source authority из frozen product0.2/plan0.2/VC0.1 на f52fa386a71183267e75d9b03def8dfa579d6af3 и прежних accepted operator notes; Developer explanation не использован как oracle.

Точная binding: clean tracked HEADff8f3e8500a54b485dec507882f88820d0c2d304,128 actual committed+working source entries независимо сверены, protected85+2 unchanged, five whole contracts неизменны. Source-blob fingerprint1c46feb1b2e3ba4526492a7a44a31f1b5efa6f417b043bbed87b8e7101c6a794 = sorted path+NUL+Gitblob+LF. Acceptance fingerprint1f8b4fb65141dfdb889eaf268b2dafe67c2cb3cfc099e2617bae56d27bfb68a2 = тот же list + literal whole v4 VC + layout4115B + defects2891B. Whole VC SHA256f50fca6976ac2f73daf4e4cc5653b6aabf23b7071e83e34f2febdf2c0a9160e5. Полные paths/blobs, reviewed delta и34 fetched responses находятся в affected-fix-r1/binding.json, без копирования128 строк здесь.

Immutable build root: u2-lab-claude-ui/.overgate-runtime/gd-workspace-v4-candidate-fix-r1/. Source manifest49234B SHAd950fdc4942946739d8cabf682ccd625b28013db1270908c34c0383aa811eaa5; build manifest3275B SHA616458dd05f5c2fe0087f818a20a5ab2ca443d64d3f7dce1e57ba4cd3dca0036; ZIP522764B SHAea9b29ed3192b58f24baaa7a4276d9fdb4b4327146a882c72782417bc13620e3; dist17files1306246B digestc3ae0161feeb1c4df59925679a555c81f5572dfc2d5797fd357126cb32ac244d. QA проверил actual ZIP CRC/17 archive+dist+extracted bytes и34 exact HTTP bodies localhost/LAN4188. Ordinary LAN192.168.68.65:4188/?v=gd-v4-ff8f3e8 на820/390 secure=false; localhost1440 secure=true. Servers и пользовательские tabs QA не менял.

Harness history сохранён: первая попытка завершила held-actions и Apply atomicity, затем неверно ожидала RunSpec в .spec вместо фактического top-level объекта. Continuation исправил только oracle и завершил восемь ownership assertions, но запись Cancel actual ошиблась на await/Promise.slice после native Cancel. Оригинальные остановленные records/scripts/errors оставлены без перезаписи; отдельный cancel-boundary прошёл на всех трёх ширинах и сверил полный before/after reference text. Эти ошибки адаптера не зарегистрированы как product FAIL; непройденные assertions не унаследовали PASS. Итоговые saved checks и их связывание явно представлены в saved-evidence-check.json.

QA1 report16179B SHAaf5d438223641fedb6ad6de65509324ae6c21a044f63b7bcac1b5a108014c05f; original manifest60141B SHA080591b3f8e9256bfc40eaac64d24a50ccb4c7d3bad5fbb627865e9ee31e235d. Все245 rawfiles и original report/ledger independently byte-identical/read-only. Сохраняются старые source-first prep, весь QA history и оригинальный FAIL. Новый affected manifest запечатывает только новые outputs/evidence.

NOT RUN: новая полная7-chain/72-case кампания, H3600/full numerical sweep/12h/CI guard; физический tablet/Xiaomi/OS pull-to-refresh/second device, native install/public Pages/base merge gates; отсутствующий390 ring action; исходные QA1 неисполненные HTML-like/full8-line error и exhaustive mount/time edges. IndustrialM/default-size catalog0.2.1 — отдельная будущая C01–08 приёмка, здесь не проверяется. PM/DEV guard является отдельным evidence и не заменяет own QA. При source-equivalence переносится прежний H3600 результат, а не выдуманный свежий measurement.

Подпись: independent QA / Codex; exact provider model ID unavailable. Узкое runtime исполнение завершено, новые product FAIL не выявлены. Source freeze ff8f3e8 отпускается после seal и byte readback; root остаётся единственным publisher. Scope Review и внешние gates остаются отдельными этапами.
