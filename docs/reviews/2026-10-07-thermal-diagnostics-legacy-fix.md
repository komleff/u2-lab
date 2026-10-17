---
title: "CR-TD-B1 — Developer FIX VERIFICATION"
status: DONE_WITH_CONCERNS
version: "0.1"
date: "2026-10-07"
role: Developer
model: "Codex / GPT-6 family; точный deployment identifier недоступен"
---

Источник зафиксирован: **a6c7430b795ca79377e210cfb032c53732d0654e**. Исправление детерминированно проверено; независимая проверка после него **NOT RUN**, бюджет 5/5 исчерпан. Исходный scoped Code Review на 48f остаётся CHANGES_REQUESTED; этот отчёт не является приёмкой или разрешением merge.

CR-TD-B1 (TD02/TD04): Legacy observer пропускал requested Active loads, поэтому реальный accepted thermal-stop/restart исчезал при фильтрации native events. Теперь observer сохраняет реальный переход, исходное время, точный module ID, фазу и безопасные restart thresholds. Для идентичности используется формат фактического native owner; ID с двоеточием и отключённый сосед не создают ложного родительского события. Виртуальная mining-group сохраняет measured aggregate, но не выдаётся за hardware protection. Индивидуальный полезный выход Legacy не придуман. Idle, полный трюм и disabled load не получают предупреждение о незаказанной работе.

**Delta относительно 48f1fba4686b9069c05db073e84512f39f28c536:** только src/runner/diagnostics.ts и tests/fitting/thermal-diagnostics.test.ts; 62 additions / 7 deletions. Общий observer также добавляет безопасные границы в restart text и подавляет синтетический aggregate hardware stop. Это диагностические изменения. Kernel, модели, каталог, TTX, IO, runner/protocol/Worker sources и UI в этой итерации не изменены. 30 защищённых source blobs равны frozen pre-observer base 0aa458b. Старые четыре физических oracle и 81 исторический golden/projection proof сохранены; прежние доказательства не представлены как новая независимая проверка.

**RED → GREEN:** пять meaningful missing-edge cases: 5 FAIL / 27 PASS → 32 PASS. Отдельный disabled colon-ID counterexample: 1 FAIL / 31 PASS → 32 PASS. Первые попытки также содержали ошибки экспериментального provenance и недостаточного controlled warming; они исправлены только в fixtures и отделены от meaningful RED. Четыре cold/hot stop/restart случая сверяют полные state и telemetry с независимым прямым kernel step. Исходный Review cold case сохраняет stop 2.5523750082356862e−8 s и T224.9216984542996 K. Проверены restart, positive cargo, две реальных chunks, no duplicate и CSV event.

Свежий штатный pre-bash commit guard: EXIT0, **489 unit PASS, 49 browser PASS / 1 SKIP, 26 cloud PASS**, typecheck/build/reference/bootstrap PASS. Первый guard outcome сохранён отдельно. Commit выполнен без bypass. Native adapter activation и физическое устройство NOT RUN.

Неизменяемый кандидат: .overgate-runtime/thermal-release-legacy-fix/dist, 17 assets 0444. binding.json: 10851 B, SHA256 659a45b95336ac36737169e08daee82769e47134293495aecc50af0a98f4f94b. Source FP 446976869a26ccd1f8effbe9f2ebe6ec881dec160b3a1d330d092d0fa1e271f7; build FP 352a78bc10557fe76a08ffbda01c50e3bf7cc9943bb353b764146828ed013400. Whole WHAT/HOW FP b6611a21e4bba36c43efed92b4b38296cf103dc91dba6dfb4cabf55f8d98905d unchanged. Compiled Worker изменился из-за observer dependency; actual bytes связаны manifest, их равенство прежнему bundle не заявляется.

Raw evidence: .overgate-runtime/thermal-legacy-fix-evidence/ledger.json (2718 B, SHA256 1de86e64a8c1fc7656f83d6063e00313136f1ecc37302efc77ea825ed1579ae6). Последний guard SHA256 3e000ca708e0c4d69d95440bf28abe0516501beb4ba82e33317407e986454fa8. Recipes явно записаны в binding; package.mjs сохранён.

Developer attestation: собственные src/tests committed и clean; PM documents/memory/report changes не staged. Старые candidates/seals и root servers не изменены. SOURCE FROZEN / IDLE для PM delivery с раскрытием pending independent verification.
