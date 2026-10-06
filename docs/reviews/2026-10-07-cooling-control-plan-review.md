---
title: "Независимый Plan Review: автоматическое охлаждение"
status: accepted
version: "1.0"
date: 2026-10-07
related:
  - .overgate-runtime/cooling-control-plan-draft.md
  - .overgate-runtime/cooling-control-plan-review/binding.json
  - .agents/RV_ROLE.md
---

Mode: PLAN_REVIEW. Work item: ulab-6xr, вызов1/5.
Reviewer: независимый Reviewer, `/root/fitting_adversarial_review`.
Model: Codex, семейство GPT-6; точный serving/model ID среда не сообщает.
Commit: Lab `1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718`; численный baseline `ebd481433b0de027625d8970d14a32aa75245970`; U2 `775ea56309c5036cee091068123140014625874d`.

**Verdict: PLAN_READY. BLOCKER=0, ADVISORY=0.**

Whole Review Contract: предложенный `.overgate-runtime/cooling-control-plan-draft.md`, прочитан целиком: WHAT/HOW/CC01–05, SHA256 `768bb5a2fa96721677d921125b247bb321f1cba43d88be71f9d2bcc5c067fde5` (10488 B). Он ещё не tracked; настоящий Draft PR и перенос этих exact bytes должны предшествовать DEV. Content-Fingerprint: `69128976847857b88da78ec0adc8c4d67bcc9b45711fa2d04d893f2354a27d08`. Явные Reviewed-Paths, Git blobs/SHA256 и воспроизводимый рецепт находятся в sibling `binding.json`; все четыре численных Lab owner совпали с baseline, шесть U2 owner/index — с frozen U2 HEAD. Binding охватывает полные bytes контракта; анализ owners ограничен относящимися разделами.

Проверены physics.ts, v2/step.ts, scheduler.ts, diagnostics.ts; U2 INDEX → ADR-INDEX → ADR-0043, cooling palette, automatic scheduler, generator thermal topology. Текущая UI-задача независима и не включена в этот fingerprint.

План приводит к CC01–05 небольшим изменением существующей физики и необходимой диагностики. Один расчёт actual cooling demand предотвращает расхождение ledger и журнала; расширение snapshot/schema/catalog или универсальная governor architecture не требуется. Проверки отличают отсутствие запроса, floor, starvation и critical protection; S/M, crossing dt, общий H₂ и coupled generator имеют конкретные оракулы. Часовой Pony/control — предусмотренная адресная регрессия, не новый общий аудит. Rollback — immutable принятый module-cleanup build, который PM фиксирует перед передачей; прежние версии сохраняются.

Границы authority сверены по primary norms:

- Palette §§7/9, строки114–116/155: «flow is zero when radiation/buffer policy already meets thermal demand». CC01 сохраняет demand-following; **300 K ограничивает именно работу cooler**, а не гарантирует глобальную T≥300 K или постоянный cooling target.
- ADR-0043 строки53–59 и palette160: знаковый радиативный закон и host pump heat сохраняются. **Автозакрытие Active** — новое принятое уточнение: только deployed active area/aux исчезают; hull/Passive продолжают физический обмен. TI остаётся отдельным hot-side механизмом.
- ADR-0043 строки71/79; scheduler42–51: реальный расход H₂/aux и автоматическое управление. CC03 требует физически разрешённых переходов вместо post-hoc temperature clamp, hidden sink или zero-time loop.
- Generator topology36–38: «P_self_export никогда не охлаждает уже нагретый корабль». Сопряжённый генератор проверяется со своими спросом/расходом/потерями; новое исправление допустимо только по доказанному defect.

Фактически прочитан ADR-0043 v1.7 на указанном SHA; приведённые п.4/5/9/11 совпадают с нормами, обозначенными планом как v1.6. Новое floor/shutter уточнение PM закрепляет отдельным U2 doc PR; protections/hysteresis, Military carve-out и остальные физические правила не пересматриваются.

Новые вычисления текущего v2 намеренно меняются и должны иметь подпись thermal controls v0.1/floor через существующие origins/release/footer. Старые измеренные snapshots при открытии не пересчитываются; схема/catalog и историческая v1 не мигрируют. Сохранение прежнего buggy вывода нового расчёта не является AC.

**NOT RUN / не проверено:** runtime, tests, QA, browser/Worker, guard/build/packaging, UI candidate, физическое устройство и полнота будущего кода. Отчёт подтверждает готовность плана, не runtime correctness. Никаких product/source изменений или новых агентов. Review закончен; freeze только этой review surface RELEASED, Reviewer IDLE.

Подписано: независимый Reviewer `/root/fitting_adversarial_review`, 2026-10-07.
