---
title: "Module card cleanup — affected QA MC-UI-B1"
date: 2026-10-07
role: QA
item: ulab-p2w
verifier_call: 3
verdict: PASS
source_sha: 85fee8c413bba111b0d9b5a58d8d77d4111bef8d
---

# Affected QA: MC-UI-B1 CLOSED

**PASS по исправленному классу MC02/MC04.** На actual LAN1440 и true `isMobile+hasTouch`390 сведения installed/builtin открываются без исключений; Close и Escape возвращают фокус к точной кнопке с colon-ID. Исходный QA2 FAIL сохранён неизменным.

Independent QA; модель Codex, точный provider/deployment model ID недоступен. Это call3/5, узкая проверка MC-UI-B1, не повтор всей MC/thermal кампании. [Методы](../../.overgate-runtime/module-cleanup-qa-affected/methods.md) сохраняют исходные expected.

## Привязка

Source `85fee8c413bba111b0d9b5a58d8d77d4111bef8d`, база QA2 `1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718`. Worktree `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics`; immutable `.overgate-runtime/module-cleanup-fix-release/dist`. Собственный HTTP4214: `http://192.168.68.65:4214/`, secure=false, viewport/documentWidth1440/1440 и390/390.

Own currentHEAD и exact2path delta verified: `src/app/fitting.ts` blob `75772a13cdf2242863d68b33f2a394e2e60a0e15`; `tests/browser/module-card-cleanup.spec.ts` blob `c8a96c9ef8a9b54c73639b70ca89603d8fb6900c`. Runtime diff — `CSS.escape(id)` в ID lookup; тест привязан, не является oracle. Остальные tracked paths равны QA2 base. Полные rows/hashes и provenance: [source-binding.json](../../.overgate-runtime/module-cleanup-qa-affected/source-binding.json).

Whole HOW9281B SHA256 `59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4`; accepted working WHAT11824B SHA256 `234255da891419ea6754282a7c5cdd850c3b4ea2449bdc1b1e3567b45ab830ee` — frozen PM bytes, не committed blob. Оба самостоятельно сверены неизменными. OwnFP `fc572232f4748d93117d8a167b030508f38574abda461a0e3f806a14a8f97771`: ordered2delta pathNULGitblobLF + literal whole HOW + working WHAT.

Release binding SHA256 `5f97f2f0d985073371c6f2e15d7a5d83e2de4cb3a7e99063d83562d93ef6a2c3`; sourceFP `97e3006935d5b0ff028397ab41d811dec460bc37f4e8c317ff9060c84ce05810`; buildFP `d887f51bfafe196dc358430f7d2c28a433ff387130ef577140ed84cc0a857559`. PM17asset verification и normalguard489/51+SKIP/26 — external evidence, не повтор собственным fullsuite.

## Actual affected ledger

| TestCase | Source AC | Метод / Result | Evidence |
|---|---|---|---|
| B1-A | MC02/MC04 | PASS: native installed `info-fit:payload-1` и builtin `info-builtin:laser`, обе ширины. Opening/render сохраняет фокус внутри dialog; Close закрывает и возвращает exact invoker focus. Правильные cargo/mining сведения. | `native-{1440,390}.json`: installed-Close/builtin-Close |
| B1-B | MC02/MC04 | PASS: те же2 colon-ID ×2width, native browser Escape закрывает dialog и возвращает exact invoker; ошибки0. На touch Escape — browser keyboard emulation, не физическая OS Back gesture. | installed-Escape/builtin-Escape |
| B1-C | MC02/MC03 | PASS: select universal S→i OTHER bulk S сохраняет candidate/apply state; close focus slot. Native fit export до/после всех info interactions совпал:41048B, SHA256 `efe881520fb630e916a2790062bfe2b2181846d568c6ff81b31630952b380328`, revision3 обе ширины. PageErrors0/requestFailures0. | neighbor-other-info-selection/native-fit-bytes-and-health |
| B1-D | MC03 | PASS: соседняя legal cargo replacement настоящим mouse/touch;24SCU установлен, apply возвращает фокус `slot-payload-1`. | neighbor-legal-apply |

Свежие результаты: **4 affected группы PASS,8 info open/close cycles,14 check records (7/width),0FAIL**. Не представлять эти records как14 новых исходных AC.

## Carryover / границы

[QA2 report](../../.overgate-runtime/module-cleanup-qa/report.md)9290B/SHA256 `d4e95879dc277f8211665aab5affa8a9dc625890f0d990d6aee7c9985e450eab` проверен byte-identical. MC01/MC03/MC05 PASS, предыдущие реальные MC04 Worker/measurement/stale/readiness/footer наблюдения и MC02 candidate-info invariants перенесены по неизменным owners/whole контракту и только escaped-ID runtime delta. Предыдущий52protected-source proof не повторён. **Итоговое покрытие MC01–05:5PASS с3 inherited AC и affected closure MC02/04; это не5 fresh full-method replays.** История исходного FAIL и harness corrections остаётся literal.

Новых harness failures нет. NOT RUN: физический Xiaomi, native OS gestures, новая симуляция/Worker campaign, numeric/hour/81/12h/fullguard, новый H₂ task, Unity/wear, deployment/merge. Отчёт подписан independent QA, manifest содержит readback SHA. Source freeze можно снять после seal. Own4214 остановлен; root4196/4189 и остальные серверы не изменялись. PM единственный publisher.
