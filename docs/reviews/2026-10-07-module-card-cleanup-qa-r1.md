---
title: "Module card cleanup — независимая QA"
date: 2026-10-07
role: QA
item: ulab-p2w
verifier_call: 2
verdict: FAIL
source_sha: 1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718
---

# Независимая QA MC01–05

**FAIL: один BLOCKER MC-UI-B1**, затрагивает MC02/MC04. Новые кнопки информации установленного/встроенного изделия открывают сведения, но при рендере/закрытии вызывают `SyntaxError` из-за colon-ID в CSS selector; возврат фокуса нарушен. Остальные адресные проверки выполнены, новую физическую кампанию не запускал.

Роль: independent QA; модель: Codex, точный provider/deployment model ID недоступен. Source-first [методы](../../.overgate-runtime/module-cleanup-qa/methods.md) записаны до чтения implementation/explanation. Developer GREEN не заменяет собственные измерения.

## Привязка

Runtime: `1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718`, база `ebd481433b0de027625d8970d14a32aa75245970`, worktree `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics`, immutable `.overgate-runtime/module-cleanup-release/dist`. Собственный HTTP4214, `http://192.168.68.65:4214/`, `isSecureContext=false`; сервер обслуживал только immutable dist.

Whole HOW/MC01–05: `docs/plans/2026-10-07-module-card-cleanup.md`, 9281 B, SHA256 `59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4`. Accepted working WHAT `docs/product/ship-fitting-gd-workspace-v4.md`0.3/4.1: 11824 B, SHA256 `234255da891419ea6754282a7c5cdd850c3b4ea2449bdc1b1e3567b45ab830ee`; это frozen uncommitted PM bytes, не заявлен committed blob.

Release binding SHA256 `b6cc669bd097e8735a00ca58818d0c1e45dde4808497a9a7663170adb4cbdf96`; sourceFP `af0c9d68f50cef7d7add8991d8904923040536629abdea9744f681fc6f920d7f`; buildFP `cfc232c913249c751e42b8b5f243885613c3b6aa6b715df7e61ee1661c962e7d`. Whole HOW contractFP `af4b1956f32bfb228d72667d705720dae0f28ae50b08bfc6edb8c3f6455f451f`.

Own contentFP `d717528b7aa6fe3aa4d07c6f67b5670d30cced7cef071bb124c67afc7d62a8b7`: ordered11 changed `path\0Gitblob\n` + literal whole HOW + literal accepted working WHAT. Полные строки/размеры: [source-binding.json](../../.overgate-runtime/module-cleanup-qa/source-binding.json). Самостоятельно подтверждено равенство52 protected source blobs базе. Прочитаны current owners `swap-dialog.ts`, `presentation.ts`, `instance-details.ts`, `ship-view.ts`, `fitting.ts`; стили проверены реальным styled DOM/снимками. Changed test paths привязаны, но не использованы как oracle. Независимые числа взяты из catalog/materials/process, не из profile renderer.

## Case ledger

| TestCase | Source AC | Метод / actual | Result | Evidence |
|---|---|---|---|---|
| MC-Q01 | MC01 | LAN1440/true-touch390: представители11 семейств из50 catalog items; масса=sum dry bill. Все4 cargo и5 mining дополнительно сверены с own data. Bulk S=24 SCU/1800kg, universal S=12 SCU/8945.439461kg; civil-S=3MW/0.0625125 SCU/s. В карточках нет чужих laser/full-fit/0power/unknown-volume/service полей; подробности закрыты. Оба screenshots просмотрены. | PASS | `catalog-oracle.json`; `native-initial-{1440,390}.json` → family-profiles; `catalog-{1440,390}.png` |
| MC-Q02 | MC02 | На обеих ширинах выбрать bulk S, открыть i OTHER universal S: выбор/apply/revision/native fit-export bytes неизменны. Desktop Space/Enter раскрывают сведения, Escape возвращает focus в slot. Но installed/builtin i вызывает invalid selector и ломает focus return. | FAIL | initial → other-info-independent; `native-continuation-initial-1440.json.errors`; `native-final-390.json.errors` |
| MC-Q03 | MC03 | Обе ширины: поиск «Навалочный», cargo/S filter, own capacity24→12 sort; M-in-S refusal и fit-byte equality; single apply/removal/revision, batch двух removable Payload, builtin modes сохранены; Changes default collapsed/expand, apply focus slot. | PASS | initial → search-filter-sort/incompatible-refusal; continuation1440 и final390 → single-apply-remove/batch-builtin-installed-info |
| MC-Q04 | MC04 | Cargo/laser/builtin профиль и реальные сведения; footer «интерфейс v4.1» обе ширины. Один touch390 timed Pony2 Worker: Start×1→time2.26s→Pause ACK→native result export. Builtin beam350000W/delivered1000000W совпадают с actual bucket, не synthetic. Замена laser→cargo показывает «не измерено — изменено после теста», не наследует лазерные каналы. Снятие батареи показывает «Не хватает: battery»/Start disabled; восстановление legal. Закрытие i всё же бросает исключения MC-UI-B1. | FAIL | `native-final-390.json` → short-worker-measured/stale-and-error-visible; `paused-result.json`; initial → context |
| MC-Q05 | MC05 | Own52 protected Gitblob equality; численные owners/TTX/IO/workspace не изменены. Собственные UI action/export и Worker наблюдения выше. Normalguard489unit/51browser+existingSKIP/26cloud — external Developer/PM evidence, не fresh QA suite. | PASS | `source-binding.json.protected`; native action records |

Итого **5 AC:3 PASS/2 FAIL, один blocker-класс**. Два workflow адреса1440/390 выполнены с явно сохранёнными harness остановками/продолжениями; это не два безошибочных непрерывных прогона. Один свежий Worker Start/Pause; исторические thermal/81/hour результаты не пересчитаны как собственные новые tests.

## MC-UI-B1 — воспроизведение

1. На immutable candidate выбрать Pony3; заменить Payload на cargo либо оставить builtin laser.
2. Настоящим mouse/touch открыть установленное i (`info-fit:payload-1`) или встроенное i (`info-builtin:laser`). Сведения открываются.
3. Закрыть ✕: `SyntaxError: Failed to execute 'querySelector' on 'Element': '#info-fit:payload-1' is not a valid selector` (аналогично builtin). Исключения возникают также при render, который восстанавливает focused ID.

`src/app/fitting.ts`: helper `el(id)` строит `root.querySelector('#'+id)`; `render`/`closeDialog` используют новые colon-containing info IDs. На1440 записано4 исключения, на3909; request failures0 в обоих проходах. Expected MC02/03: native close/Escape и focus работают без JS exceptions, информация не повреждает действия. Подтверждено на Chromium desktop и true isMobile+hasTouch390, **не на физическом Xiaomi**. Глобальный PageErrors0 не выполнен; дальнейшие montage/Worker действия при этом продолжались.

## Оснастка / границы

Сохранены исходные ошибки harness: нулевые timed phases закономерно rejected при построении fixture; заменены legal1s phases до actual Worker. `#fit-preview summary` сначала совпал с двумя summary, исправлен на direct child. На390 `scrollIntoViewIfNeeded` оставил summary за sticky dialog footer; исправлено только центрирование native click. Повторены только заблокированные действия, первые завершённые5 наблюдений каждой ширины не повторялись. Сырые `FAIL_OR_HARNESS` разобраны выше: selector/scroll — harness, pageexceptions — product. Последний health assertion остановился на реальном exception, дополнительный финальный geometry PASS не заявлен. Начальная documentWidth равна1440/390; screenshot показывает actual styled карточки/сведения.

NOT RUN: physical Xiaomi/native OS gestures, Unity/wear/newH₂ task, публичное deployment/merge, fullguard/81numeric/hour/12h/новая thermal campaign. Существующие user/root серверы не изменены. Отчёт подписан independent QA, SHA в отдельном evidence manifest; source freeze **можно снять после этого seal**. PM — единственный publisher.
