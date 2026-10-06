---
title: "Независимый Code Review: H₂ Efficient Auto / Active Radiator"
status: changes-requested
version: "1.0"
date: 2026-10-07
related:
  - docs/plans/2026-10-07-cooling-control.md
  - docs/architecture/source-authority.md
  - .overgate-runtime/cooling-control-code-review/binding.json
---

Mode: CODE_REVIEW. Item: ulab-6xr, вызов3/5.
Reviewer: независимый `/root/fitting_adversarial_review`.
Model: Codex, семейство GPT-6; точный serving/model ID среда не сообщает.
Commit: `a3d02995b5d8953330510bba9cf08f23469341b8`; baseline `c85047899a067c90e4c8f96224cbe8671ec54b76`.

**Verdict: CHANGES_REQUESTED. BLOCKER=1, ADVISORY=0.**

Whole HOW/CC01–05:10488B SHA256 `768bb5a2fa96721677d921125b247bb321f1cba43d88be71f9d2bcc5c067fde5`; whole source-authority:7061B SHA256 `70a546ed7b09d0aa1368a25455986c18a8a68032ef60055f4ec4aa7e4a18a893`. Оба прочитаны целиком и совпали с commit. Current behavioural U2 authority: `18d2c82a664ec2f58998608417bf199e8ded58ea`, palette0.4/doctrine0.2.8 через INDEX. Palette72–76 задаёт auto-close,124–131 — floor и настоящий спрос со stored excess,169–173 — mass/heat balance. Предыдущие numerical inventory/TTX не заменены.

Content-Fingerprint: `d61cf14aff900cb39d7d6eaa03c694cbfcae352e7f980754c795d7fd8e19f2e8`. Явные Reviewed-Paths/Gitblob/SHA256 и рецепт с **literal whole bytes обоих документов** — в sibling binding.json. Собственный проход: все13 changed paths (6 runtime/7 tests), необходимые step/scheduler/runner callers и physical-result helper; U2 direct cooling norms. Independently sourceFP `412bbeff3fcb03d8b20061e179360f7f10485bb86325c8cb9133f0fa68709190`, whole-contract FP `eef0e0126d76ec39d48e8285e20d148a151a5d7dd50b2d97a0a44d69e875cfa7`; working=committed. Все52 protected src byte-equal базе; observeLegacy suffix тоже равен. Это equality, не повторный аудит всего core. BuildFP `d7c5fd1fc1235138c2687a45a695417e84d9267c3338d7765ada3d6456086bf6` — внешняя release provenance; новый build/assets proof не запускался.

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|----------|-----------|-------------|--------|------------------------|
| 1 | IMPORTANT | [BLOCKER] CR-CC-B1: interval request выдаётся за мгновенное фактическое открытие | src/runner/diagnostics.ts:114 | fix now | CC04: недостоверное объяснение состояния/времени управления |

**CR-CC-B1.** Physics усредняет `coolingRequested`/`coolingClosed` по принятому dt. Observer113–114 выбирает requested при любой положительной доле, затем120–121 пишет «радиатор открыт: полезный температурный градиент» с `previous.timeSeconds` и **начальной** T. Средняя доля запроса не является состоянием в этой точке; исходное closed состояние смешанного шага исчезает из объяснения.

Собственный один validated API repro: getPresetFit('pony:1'), signature-1=radiator-active-S, T399.9K/background400K, dt0.5s; положительный private environment heat `0.4×actual C` W, hardware/TTX неизменны. Actual closed=0.474694060455, requested=0.525305939545; endpoint T400.1175662105K, elapsed0.5s, residual−7.10e−8J, spec immutable. Единственный control event **t=0**: «Активный радиатор открыт: полезный температурный градиент; T399.900K, фон400.000K». В t0 градиент неполезен и радиатор действительно закрыт. Raw JSON и воспроизводимый `.mjs` сохранены рядом; это один API crossing, не новая матрица/Worker workflow.

В том же классе статически: полезный градиент при Q0 и отсутствии выдачи source даёт activeRatio0, actual area/pump0, но requested=1 и тот же текст OPEN. Command eligibility не доказывает физическое deployment. Минимальное исправление — честная подпись **запроса/смешанного принятого интервала**, его долей и начальной/конечной T либо реально известного перехода; не нужна новая telemetry/event architecture. Durable controls: оба направления crossing и requested с actual aux0, сохранность real critical events, sparse журнал. Общая ветка H₂ тоже должна избегать point-state вывода из averaged flags.

Остальной released scope без дополнительных blocker: H₂ demand учитывает обычные пути и stored heat после STOP; floor300 не является постоянной целью. Trial evaluate пересчитывает общий generator/battery/aux ledger локально, фиксирует один выбранный поток; mass для cooler включает host+aux, общий typed stock ограничивает всех consumers. Active убирает свою площадь/pump при неполезном градиенте, hull/Passive sign и TI ledger сохраняются. Новые пороги разрешаются положительными физическими подшагами; numerical ledger в собственном crossing замкнулся.

Диагностика отделяет запрос от starvation, сохраняет реальный native stop/restart mapping и ограничивает episode state числом instances/режимов. Optional channels привязаны к существующему instance/family; JSON finite/dimensions/atomic refusal и CSV units сохранены. Старые recorded results не пересчитываются при OPEN; version event/footer явно говорят о **новом** расчёте. Fixture400→510 включает настоящий спрос вместо always-on допущения. ST05 physical projection исключает только events/counts, а отдельные assertions сохраняют исходные events/retention плюс ровно один version event; original full digest остаётся опорой. Структура/смысл assertions проверены, старый replay заново не запускал.

QA2 report11621B/SHA `e95125191356b67d833f1bf01a9713855e993e45d51c9a23459a5d5973a96ae8` полностью прочитан. Его собственные S/M, Auto/OFF H3600, M30s и LAN390/old-new OPEN остаются доказательствами указанного scope; отдельный Active journal fixture там явно NOT RUN и не закрывает CR-CC-B1. Guard514unit/54browser+SKIP/26cloud — внешний Developer/PM evidence. Моё fresh исполнение — только один crossing; чужие результаты не переименованы в свои.

**NOT RUN / OUT:** полный guard/build/browser/packaging, H3600/12h/81/all-hull campaigns, maximum eviction stress, physical/native/Public/merge, UI-card closure, balance/TTX/flight/Stealth/wear/general governor. Ни серверы, ни user tabs, ни source/tests/contracts не изменялись. Review закончен; freeze RELEASED для PM triage/sole Developer fix, Reviewer IDLE. Старые seals неизменны.

Подписано: независимый Reviewer `/root/fitting_adversarial_review`,2026-10-07.
