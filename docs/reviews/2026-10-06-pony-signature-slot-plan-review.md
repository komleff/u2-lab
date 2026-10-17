---
title: "Pony: один signature slot — независимый Plan Review"
status: sealed / PLAN_READY
version: "1.0"
date: 2026-10-06
related:
  - .agents/RV_ROLE.md
  - docs/plans/2026-10-06-pony-signature-slot.md
  - docs/product/ship-fitting-catalog-0.2.1.md
---

**Verdict: PLAN_READY. BLOCKER: 0. ADVISORY: 0.**

**Mode:** PLAN_REVIEW. **Role:** независимый Reviewer / Codex, existing session.
**Model:** Codex; точный provider/model/deployment ID средой не сообщается.
**Commit:** `03826203eb5cef1d0102f71a98b07ec469fab1cb`.
Branch `feat/pony-signature-slot`, Draft PR8; runtime baseline
`15f5d90e97b696b8738a204953af852942bec704`.

Проверены только достижимость P01–P05, ownership/dependencies, compatibility,
testability, rollback и минимальность реализации по PM_ROLE3.0/RV_ROLE.
План прочитан целиком; C04/C05 предыдущего product contract прочитаны вместе с ним.
Прямое решение оператора разрешает новое ограничение Pony, не изменяя канон U2.
Повторное product approval не требуется. Mining mission v2.2 не входит в этот review.

# Основание вердикта

| Область | Почему план достаточен |
|---|---|
| P01/P02 — новая редакция | Отдельный catalog0.2.2 overlay удаляет только `signature-2` Pony. Новый preset сохраняет sole passive radiator; buffer второго слота не устанавливается. Все45 SKU, пять других hulls, builtin anchors и остальные Pony fields сохраняются. Industrial S остаётся с3signature slots. Локальное происхождение nerf обозначено честно. |
| P03 — исторические объекты | Hull выбирается по declared fit edition во всех relevant consumers, а не по глобальному default catalog. Исторический `hulls.json` не переписывается. Old0.2.0 oracle сохраняется; Pony0.2.1 digests фиксируются до реализации, включая fit/spec/zero/partial/complete. Old fit/run/result остаются двухслотовыми и редактируемыми, без silent remount или rerun. |
| P04 — ошибки/ownership | Known experiment/result import обязан проверять законность declared fit slots; restamp в0.2.2 не разрешает старый `signature-2`. Negative files отклоняются атомарно. Same-edition temporary reference для неполного fit сохраняет actual mount/group, Start readiness и разделение active/next/reference. Unknown0.2.3 отрицательный fixture не ослабляет прежний отказ. |
| P05 — реальные действия | Заданы native LAN desktop/mobile цепочки: sole-slot replacement нового Pony, экспорт/fresh reopen и редактирование второго слота старого Pony. Edition видна; измеренный owner отличён от draft. Есть short Worker run, F3/Compare и error/recovery, а не только проверка наличия кнопки. |

Принятый resolver учитывает matching caller catalog, включая test/local overrides,
и использует объявленную известную edition при несовпадении. Это устраняет общий
корень historical-slot regression в validate/installed/compile, passport/nominal,
replacement, ship-view/dialog/F3 и incomplete-conditions. Циклический импорт
запрещён явно. Расширение known/default до0.2.2 должно наследовать current0.2.1
presets и inventory; план отдельно называет риск ветки `current === 0.2.1`.

C05 сохраняет прежний explicit numerical replay неизвестной редакции. Поэтому
P04 unknown-negative читается как отказ обычного импорта без разрешения snapshot
replay; новый каталог не превращает unknown в known и не отменяет explicit opt-in.
Это наследуемая граница принятого WHAT, не дополнительная новая feature.

Последовательность пригодна к исполнению: pre-change oracle → RED/edition resolver
→ consumers/known import validation → targeted GREEN и normal guard → QA P01–P05
→ один scoped Code Review → обновление owned4188 после PASS/APPROVED. Serializers,
model/kernel/Worker/scenario algorithms остаются вне реализации. Новый баланс
конкурентоспособности не объявлен доказанным результатом; acceptance проверяет
принятый slot change. Более широкий catalog/history subsystem не требуется.

Rollback конкретен: вернуть owned4188 на сохранённый immutable0.2.1 dist.
Old4183/4186 и старые файлы не заменяются; user pages не reload автоматически.

# Reviewed-Paths / привязка

| Reviewed source/contract path | Exact frozen Git blob |
|---|---|
| docs/plans/2026-10-06-pony-signature-slot.md | 47e8249b91cb82b09d3388495d29da4839e0b970 |
| docs/product/ship-fitting-catalog-0.2.1.md | c7ffd66bb9db25c052015d125ac530bc7342a58f |
| src/fitting/types.ts | 4168d43c6d02a44c7f93cd0f71cc89c3a42a6a12 |
| src/fitting/editions.ts | ca40baa0e05c2b84224edca1e32efd54e0e50ae2 |
| src/fitting/catalog.ts | 68b536ad21b7c586f98709fc20de6af3e4c5392d |
| src/fitting/data/hulls.json | e3e58cae57d5868f3459c444f6543590899f1939 |
| src/fitting/data/modules.json | 8eeab46d4aea4b8bd665f5b1a9538cf3ff00547d |
| src/fitting/data/modules-0.2.1.json | 30b6827955012cda639114a661698417b14fafa5 |
| src/fitting/validate.ts | 4dfb91f5265823da6ba09c84ab916f05d13e628b |
| src/fitting/compile.ts | 15c08bbd71eac42ce05ed92e6c382cd93f4bf6b4 |
| src/io/fitting-json.ts | 32dcea33a86e2575d0dbc5be8abcb383fd9820fc |
| src/app/fitting-workspace.ts | 9eeb774ab637b0545f339005c0df6aa73ad45696 |
| src/app/fitting.ts | cdcfd0ed4de378d39cd6b8ab500283ca2093d5c2 |
| src/app/fitting-ui/presentation.ts | 135df79f9cf9040e685f7bd62d4638f7cf33de04 |
| src/app/fitting-ui/ship-view.ts | 42810a2924473f77c27cfc33427a760c1a6c012b |
| src/app/fitting-ui/swap-dialog.ts | c74d810917aa87bd302a3d0340c006d6f38d067c |

Данные catalog проверены по actual bytes/blobs; у hull records адресно сверены
signature counts. Это plan context и сохранность baseline, не новый runtime code
review всех прежних SKU. Предыдущие signed reviews/seals остаются неизменными.

**Content-Fingerprint:**
`85f5658d7e695beb1445516360df33e5b9ff963e2e34ba9ea91d8783ee158882`.
Независимо сверены16 actual working byte sets с plan HEAD Git blobs, SHA256 и length;
оба whole contracts совпадают с полным содержимым файлов. Независимо пересчитан
предоставленный binding: SHA256 канонического UTF-8 JSON объекта `contract`,
recursive sorted keys, compact separators, Unicode unescaped, без завершающего LF;
18487 B. В объект входят16 source rows и **полные** texts двух contracts, не только
P01–P05/C04–C05 excerpts.

Binding `.overgate-runtime/pony-slot-plan-review-binding.json`:19514 B,
SHA256 `11963e8ed0f87c26ae132c76f4591996383bdf09d62dcf8e5a03e5a5d0310c02`.
Whole contracts: `docs/plans/2026-10-06-pony-signature-slot.md` и
`docs/product/ship-fitting-catalog-0.2.1.md`. План7821 B,
SHA256 `36b0498e16b163a44b5fb843ea2cb814cc7f1a2fa654d77edef4a5be538e7319`.
Observed HEAD совпал с frozen plan commit. Memory/INDEX прочитаны как контекст,
не product authority, их paths не расширяют frozen acceptance surface.

# Ограничения и release

**NOT TESTED:** implementation, QA/runtime/browser/LAN/device checks, build/guard,
new numerical trajectories/12h/H3600/matrices. Fresh baseline guards PM не выданы
за собственное исполнение Reviewer. Не проверяется WHAT новой mining mission,
fullhold/flight/refuel/V_FA или её unresolved gap; он не блокирует эту отдельную
правку. Не разрешены code/docs changes, Beads/GitHub/server writes или main merge.

Подпись: Independent Reviewer / Codex, 2026-10-06.
**Source freeze release:** independent Plan Review завершён, Reviewer освобождает
freeze этих16 paths. PLAN_READY относится к HOW P01–P05, не к готовому runtime.
PM — sole publisher; после передачи Reviewer IDLE до отдельного scoped handoff.
