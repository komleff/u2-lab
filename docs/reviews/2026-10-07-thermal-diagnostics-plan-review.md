---
title: "Температурная диагностика — независимое Plan Review"
status: sealed
version: "1.0"
date: 2026-10-07
related:
  - ../product/thermal-derating-diagnostics.md
  - ../plans/2026-10-07-thermal-diagnostics.md
---

**Verdict: PLAN_READY. BLOCKER0; ADVISORY1.**

Mode: PLAN_REVIEW; actual role: independent Reviewer `/root/fitting_adversarial_review`; Model: Codex/GPT-6 family, exact deployment ID не раскрыт. ulab-6ty/call1/5. Оператор принял сохранение алгоритма и изменение правила; WHAT/D01–06/TD01–06 прочитаны целиком. Publisher — PM.

Исходные нормы сверены с U2`bd31d4a90eb1877c14d60c16db0e6994d8021ade`. Current heads: U2`bd31d4a90eb1877c14d60c16db0e6994d8021ade`, Lab`0aa458b1e22f4d346178ee9538c736efdd81d86a`. Рабочие документы ещё не являются committed acceptance snapshot; staged U2 bytes совпадают с working bytes. Lab runtime неизменён.

**Нормативный diff** (строки candidate; пути ниже):

| Owner:строка | Цитата | Решение |
|---|---|---|
| ADR-0043:81 | «доступная мощность/производительность плавно снижается» | amended |
| thermal_doctrine:89,91 | «линейное снижение доступной мощности» | amended hot/cold |
| outfitting_doctrine:237 | «не debuff от уменьшения прочности» | clarified |
| defense_model:87 | «выход за рабочие температуры в горячую или холодную сторону» | clarified wear |
| gdd_overview:252 | «не меняет ось прочности ADR-0066» | preserved |
| ADR-0043:81,85 | «Approved hot override может продолжать работу»; «по durability гарантирована» | preserved Military/R |

ADR-0068:54–92 ограничивает ordinary operation, сохраняя узкое Military exception, protection/hysteresis и отдельный wear. Lab wear не вычисляет; thermalDuty, η, stocks, масса, радиативная площадь и governor не меняются.

План достижим минимальным observer/helper и chart diff. Accepted-step hook/callback отделён от mission trials; numeric pre/post oracle обязателен. Weighted% использует сумму requested useful power сη, не среднее. Positive-stock gates, generator capacity/load и passive radiation различаются. Braking estimate использует existing relativistic stoppingDistance, без новых законов. Sparse episodes принадлежат run; old replay не получает fabricated measurements. Max-low/min-high, disjoint/empty и сохранённые TTX явно проверяемы. TD01–06 имеют deterministic/unit/export/browser методы; Pony/Ermak bounded controls пропорциональны. Rollback — immutable station86/отмена observer/UI, старые builds сохранены.

**ADVISORY A1:** U2`docs/INDEX.md:121` summary всё ещё `ADR0000..0067/ADR0043v1.6`, хотя direct ADR0068 entry и amended1.7 существуют. Минимум — синхронизировать summary. `reject with rationale`: navigation/нормативные owners верны; это не BLOCKER, scope не расширяется.

**Reviewed-Paths / SHA256 целых bytes** (`ctx/context` — только необходимый контекст):

| Path | SHA256 |
|---|---|
| U2:docs/INDEX.md | `c3c18ef3bb074e26a4932d48f217cb4badb9f86be3fc91b6988f9ec34802cd07` |
| U2:docs/architecture/ADR-INDEX.md | `7f6dc4cbfecd4dea7b9b41253c024fd9c6ee9ff4283bb7b7c30deb04c5e46c06` |
| U2:docs/architecture/ADR-0043-Thermodynamics-And-Motoresurs.md | `d6689fddff661343f9069a76b36562a9db98b7e4c92b4ed5b6899b5b4b052a61` |
| U2:docs/architecture/ADR-0068-Thermal-Derating-And-Wear.md | `7c212529e870b61d48a2994b2c6583e7afc86f25265f5d809d29cefc47dab03f` |
| U2:docs/brand/u2_engine_thermal_doctrine.md | `6f78dcd44b2479e0652bfdf3c89201ef29b052f3df96d7785a5d2cd51939dfb8` |
| U2:docs/brand/u2_outfitting_doctrine.md | `95012d392ae72f60087a55bbdd7bd99eaafc9bbaf6a6fcce23ccc9bdd6b96164` |
| U2:docs/gdd/gdd_overview.md | `1b36b2158bb896f8fa9517c20e4fe0d3b826502dff8816413b02c78743cf2c8e` |
| U2:docs/specs/gameplay/spec_defense_model_v0.1.md | `00c82843a7768101ae79a12008d502f6cd30d537727752a0400574ddc4c0dd66` |
| U2:docs/specs/gameplay/spec_thermal_derating_diagnostics_v0.1.md | `fc57f19b096567c1f82b63857690f2d8301b47c2d2dedec12c808b8e6156b3ef` |
| Lab:docs/INDEX.md | `8028be353acde4ec2a6cff90d98cd76d9f7feda2098f10b04fdfa1815b6f5b7c` |
| Lab:docs/product/thermal-derating-diagnostics.md | `339dcd54a1553a976a74be7fd111875d47a746a338a03b5bc1e6a30d025539d1` |
| Lab:docs/plans/2026-10-07-thermal-diagnostics.md | `4e989240d7c6a392621219bef0ab196c7437744c4c7d62af31f794ddef401443` |
| ctx:src/model/scheduler.ts | `91dade9b95e522e3e902684437e82a98a2fe9ef79ff53bf940edd8ddbc4943d0` |
| ctx:src/model/v2/step.ts | `0e58798a5714c5e853c8a49759e1f2bf809ea05125348b930ca8a02c4b8f8b12` |
| ctx:src/model/v2/physics.ts | `d300e9d643126b60b3e3bd6892ccd42bce7ecf4c3f7f30f50c264388a9d0fbf5` |
| ctx:src/model/v2/flight.ts | `48d52527867ebd18edf6ffb64eef5a645befd092b8f27b0dc2ab6a3af8c92e5f` |
| ctx:src/runner/fitting-run.ts | `873cc1eb47f61ac3a80cdcf70a122295258b7287802fe6232e67e6f623107089` |
| ctx:src/runner/mission.ts | `061d904dd00ea80781f403a5fe62338be7e2a20c59a81d3b69316ecc6aa6770c` |
| ctx:src/runner/run.ts | `36aa3cdc9765899d375cf3f5c9e6a16b190079a778c48d790bbbb9fb9b33f859` |
| ctx:src/app/fitting-ui/trace-chart.ts | `753b790c203e3995b22d8b6a23b880632b69afc7898fbaea105b3666acc61677` |
| context:.agents/RV_ROLE.md | `361403255f04c6b7ded784d1a4437c513e5dc082b6f832844fc39644a4daeba1` |
| context:.memory-bank/activeContext.md | `500d1895597e0c33a02669b7ea6f57b56d2b59143ad6d5cea55ebbb19af0bca8` |
| context:.memory-bank/progress.md | `e0caa128118a30ffe3919db516554a324b195fb75a8738612e2629ad6d8e3ed0` |

Dirty-doc fingerprints: U2`9b980358124f2e2075cc994e043a7a281c3654c0cf0fc9f7366d4b1dff258549`; Lab`250e45e524be701ff3660b02fbfa1c89e95b433107f7c43b784f5a99ef4a6130`. Content-Fingerprint:`21c4c9566a92d9b448d1f522dd68d3e1927a82b709b1fe0da5ede80e6b61c4e3`. Recipe: SHA256(sorted tag:path+NUL+whole-file-SHA256+LF), UTF8; оба целых AC-документа включены.

**NOT RUN:** runtime implementation/tests, QA, numerical/browser probes, U2 game-code audit, packaging/physical/public/merge. Concurrent hook failure не исследован и не выдаётся за PASS; PLAN_READY не заменяет обязательный commit guard. Независимых агентов/правок продукта нет.

Подписано Reviewer `/root/fitting_adversarial_review`,2026-10-07. **SEALED/readback; IDLE.**
