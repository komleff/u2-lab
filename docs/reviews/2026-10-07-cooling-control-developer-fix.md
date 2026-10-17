---
title: "Developer FIX VERIFICATION — CR-CC-B1"
status: reference
date: 2026-10-07
role: Developer
model: "Codex / GPT-6; exact serving ID не раскрыт"
source_commit: "c9e09b2c1037717d6209a7e38e3d13b893d66eb1"
---

DONE_WITH_CONCERNS / IDLE. Детерминированный фикс готов к affected QA4 и scoped Review5; прежний verdict CHANGES_REQUESTED не переименован в APPROVED.

Причина CC04: duration-weighted flags выбирались по приоритету mean>0 и объявлялись мгновенным состоянием при начальной T/time. OPEN также смешивал запрос с фактической выдачей.

Исправлены только src/runner/diagnostics.ts и tests/fitting/cooling-control.test.ts. cooling-control теперь описывает принятый start–end интервал и T_start→T_end, доли всех ненулевых requested/floor/noNeed/closed режимов, отдельно actual average auxiliary draw. Event timestamp — известный endpoint, не выдуманная внутренняя граница. Active подписан «запрошено», а не «открыт». Sparse ключ — набор режимов в фазе, без floating fractions; bounded state сохраняется. Реальные shortage/protection сообщения не подавлены; requested по-прежнему mean>0. Threshold .5 не вводился.

Meaningful validated RED6 → GREEN48: Active399.9/background400 heating crossing из Reviewer repro и обратный crossing с существующим TI; H₂ crossing300K в обе стороны, noNeed/requested при workHigh; uniform Active request с actualaux0 и сохранённой power cause. Существующие uniform/sparse, actual starvation/gated positive stock и Legacy native stop/restart/identity regressions GREEN. Первая ошибочная test-only law='linear' поправлена на существующий validated linear-fog-experiment до runtime fix; оба RED logs сохранены.

Один fresh normal pre-bash guard exit0:520 unit,54 browser PASS/1 прежний SKIP,typecheck/build/reference/bootstrap/26cloud PASS. Штатный guard реально вызван до commit; automatic native-hook activation NOT RUN.

Кандидат: .overgate-runtime/cooling-control-interval-fix-release/dist,17files0444; binding.json24171B/SHA2565dcd55d584795e969b67902bb7b6f4c5ba5a0f223acf20175aa7fbe34546026e. Source FP 1679209a4b5b409a59981fe40542a2e595a8c9d73b4ccb792baf4b3f2cad73b2; build FP 8b144bf2ea16377ad30b3e2c39ea04257257f297f0c01f1e2011c9afce99d529. Recipe: sorted relative path + NUL + lowercase SHA256 + LF, UTF-8, затем SHA256. Working blobs=HEAD.

От a3d02995b5d8953330510bba9cf08f23469341b8 изменились ровно2paths. Все57 остальных src blobs равны a3: numerical controller/kernel/TTX/catalog/compile/mission/Worker/IO/UI; предыдущие52 protected сохранены. observeLegacy suffix exact. WholeHOW+source-authority unchanged; FP eef0e0126d76ec39d48e8285e20d148a151a5d7dd50b2d97a0a44d69e875cfa7. Никаких новых schema/физики/данных. Compiled Legacy chunk equality не заявляю: shared observer dependency пересобрана.

QA2 и её numerical H3600/CC01–03/05 остаются историческим evidence a3; own controller equivalence — по exact blobs. Новых отдельных hour/matrix/native campaigns не было; mandatory existing suites выполнены. Physical Xiaomi/Public Pages/extra final LAN NOT RUN; final independent verification pending. Серверы/старые releases/reports не менял. Tracked clean, только authorized node_modules symlink unstaged.

Raw: .overgate-runtime/cooling-control-interval-fix-evidence/{red.txt,red-validated.txt,green-first.txt,commit-guard.txt}; hashes в binding. Полный sealed Reviewer report прочитан до фикса.

Подпись: Developer / Codex(GPT-6),2026-10-07,c9e09b2c1037717d6209a7e38e3d13b893d66eb1. Source/build/report freeze; IDLE.
