---
title: "Независимый Plan Review: fitting catalog0.2.1"
status: PLAN_READY
version: "1.0"
date: "2026-10-06"
related:
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/plans/2026-10-06-fitting-catalog-0.2.1.md
---

# PLAN_READY

**BLOCKER=0, ADVISORY=1.** C01–08 достижимы additive data/preset/compatibility изменением. Прямое решение оператора принято; гипотезы не объявлены каноном. Это PLAN_REVIEW дополнения `ulab-agx`, не Code Review v4 или runtime PASS.

Role: независимый Reviewer, session `/root/fitting_adversarial_review`, по RV_ROLE2.1. Model: Codex; точный provider/model ID среда не сообщила. Baseline/primary HEAD: `ff8f3e8500a54b485dec507882f88820d0c2d304`. Proposed документы прочитаны целиком как frozen working bytes, ещё не committed; до DEV PM публикует эти exact bytes. Ни runtime, ни документы требований Reviewer не менял.

# Reviewed-Paths / binding

| Proposed path | Git blob (`hash-object`, без записи) | SHA256 bytes |
|---|---|---|
| `docs/plans/2026-10-06-fitting-catalog-0.2.1.md` | `3fa8a97f554b2457f48a7f2eba0fe4121fc01f5e` | `297f091c3b3c001a6c37f9a44b985b4f2a45b15fedc8f78c7c1a6136d3276b6a` |
| `docs/product/ship-fitting-catalog-0.2.1.md` | `c7ffd66bb9db25c052015d125ac530bc7342a58f` | `a5c55604317116c29734c4f4775d541d3109879d918f63df857281bcc8aa89a7` |

Content-Fingerprint: `3e377216cb8661b9af4d63f04c1f7fdf9cf889d644d5c7f7115c15bcba4c70a5`.
ADR3.28 method: две отсортированные UTF-8 строки `path SP blob LF`, затем точные bytes **всего product**, затем **всего plan**, включая полный C-contract, error/edge, scope и rollback. Payload13016B; WHAT7363B, plan5481B; LF. Это не hash выбранной таблицы или короткого summary.

Supporting baseline reads: `src/fitting/{catalog,compile,validate}.ts`, `src/fitting/data/{modules,hulls}.json`, `src/io/{fitting-json,fitting-result}.ts`, imports `src/app/fitting-workspace.ts`. Это проверка достижимости и известных version gates, не повторный code audit.

# Exact source rows

U2 route INDEX→ADR-INDEX→registered owner/direct links, frozen `cdc490e3517c8455f662f82579c45813cdbb9a76`; Git blobs, не stale worktree/archives/keyword search. Все следующие refs относятся к этому SHA:

| Owner path | Прочитанный source address / значение |
|---|---|
| `docs/gdd/data/ship_module_ttx_master_v0.1/propulsion_force_mass_input.csv` | row13: M/Industrial, march16.228800000MN, package160.000000000t, locked_input; blob `147686a16e0511cfb3b853ca9b51a9e8ceb4104a` |
| `docs/specs/spec_engine_force_grid_v0.1.md` | §8.2 lines306–338: mass force-share, Industrial1.75/0.75/0.45, Turn approximation; §8.8 lines483–540: class reference/size/fuel neutrality |
| `docs/specs/spec_power_components_v0.1.md` | §2.2–2.3 lines53–80: α·F; diesel0.565kg/(MN·s), ηref0.32, useful-energy ratio |
| `docs/brand/u2_engine_thermal_doctrine.md` | §3 lines31–71: propulsion host/exhaust boundary; self-export не охлаждение чужого тепла |
| `docs/specs/spec_module_ttx_contract_v0.1.md` | §5 lines184–258: National force/efficiency/mass coupling; не основание для скрытого class bonus |
| `docs/specs/balance/spec_ship_module_ttx_master_v0.1_draft.md` | §§2/5/7.1: stronger owner, protected force/package, single/pair cross-fit с собственными ТТХ |
| `docs/specs/balance/spec_ship_module_ttx_generation_national_v0.1_draft.md` | §9 lines197–210: нет generic propulsion National/Generation force multiplier; derived fuel/input/heat после final force/η |
| `docs/gdd/gdd_laser_energy_productivity_and_recovery_balance_v0.1_draft.md` | §§2/4 lines30–43/66–80: η(G), Civil S3MW, Industrial S≈3.4MW; family anchors |

# Достижимость и minimal path

C01/C06: force-share даёт march16,2288MN, retro6,9552MN, pair4,17312MN; массы82,352941/35,294118/21,176471/21,176471t суммируются в160t. Pair — одно изделие на слот, установлено дважды. Прямой новый retro обходит старый preset scale0.4; cross-fit не меняет SKU. η0.40, Turn≈strafe, path/host и material/cp — explicit lab candidates. National tuning не вводится; mass reference не выдаётся за Industrial production BOM.

При η0.40 α=0.452e−6kg/(N·s), full-march fuel7.3354176kg/s. Масса входит через material bill; C через Σmass·cp, fuel/heat через actual inputs и существующий ledger. Новый численный алгоритм или hull-total override не нужен.

C02 независимо проверен **арифметически по baseline data**, не запуском модели: hull+builtin,160t пакет,2 Industrial M lasers,2 M batteries, generator/tank, bulk M,4 passive M radiators дают412245.5504768165kg. +24t топлива +240m³×1500kg/m³ =796245.5504768165kg. Это fixture/sum, не новая cargo-loading UI/flight mission.

C03: Civil M12MW/8.8t — Civil S×4; Industrial L54.4MW/48t — existing Industrial M×4; η0.5001/0.528093 совпадает с G-law. Все18 presets1/2/3 проверяются по full count с builtin. Pony baseline действительно S/UNKNOWN/G0; removable clone anchor не перекрашивает его в Civilian/Industrial. Более высокий bus load намеренно не обещает непрерывную работу.

C04/C05: сохраняются40 существующих SKU, hulls/builtins, old local variants и resolved snapshots. Known versions0.2.0/0.2.1 должны поддерживаться в fit, run и result gates; текущие validateFit/parseExperiment/parseResult строгие, потому одного изменения catalog loader недостаточно. План это явно охватывает. Нужны actual identity и atomic refusal, без auto refit/rerun и без общего unknown-version bypass.

C07/C08: адресные genuine LAN1440/touch390 цепочки, новая custom fixture, экспорт/fresh reopen и affected v4 ownership/slot-action regression; старые PASS не доказывают новый outcome defaults. Один Developer, новая QA, затем один Code Review v4+catalog — достаточная связанная линия. Rollback на immutableff8/4188 конкретен;4183/4186 и прежние artifacts сохраняются. Новые schema/mission/refuel/National system/full Cartesian catalog и12h не требуются.

# Advisory

| # | Severity | Заголовок | Файл:строка | Статус | Обоснование |
|---|---|---|---|---|---|
| 1 | MINOR | [ADVISORY] Проверять inventory identity при old-version compatibility | `docs/plans/2026-10-06-fitting-catalog-0.2.1.md:32` | reject with rationale | Обязательная правка плана не нужна: actual identity/unknown fail-closed уже входят в C04/C05; это implementation/test note, не новый scope |

Контрпример для слишком широкого alias: объявить0.2.0, сослаться на новый global SKU и принять его как старый каталог. Минимальный путь — явно две известные версии, соответствующая declared inventory, сохранение old local snapshots; не prefix-match всех будущих версий. Поздний Code Review/QA проверяет реальную реализацию. Advisory не является blocker и не запускает автоматическое расширение плана.

# Not tested / seal

Own evidence: чтение proposed owners/source rows, baseline gates/data, статические force/fuel/mass sums, blob/SHA/fingerprint расчёт. Runtime amendment ещё не реализован; guards/build/tests/browser/12h/matrix не запускались Reviewer. Не переаттестованы ядро, v4 whole runtime, physical/native/public/main/base gates. Исходные v4 WHAT/Plan/VC и прежние signed reports не менялись.

Подпись: independent Reviewer / Codex (exact model ID unavailable),2026-10-06. PLAN_READY относится к этим proposed bytes. PM — sole publisher. После передачи отчёта Reviewer IDLE до отдельного Code Review handoff.
