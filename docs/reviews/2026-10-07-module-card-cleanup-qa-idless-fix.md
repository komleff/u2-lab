---
title: "Module card cleanup — affected QA idless invoker"
date: 2026-10-07
role: QA
item: ulab-p2w
verifier_call: 5
verdict: PASS
source_sha: 721e815e0d46fd4deb9afc995caf9f2886598724
---

# Affected QA: CR-MC-B1 CLOSED

**PASS по классу empty invoker ID.** Настоящие builtin ring и measured-table кнопки без ID работают: opening/render, Close/Escape без исключений и безопасный fallback-фокус `fit-start`. Именованные colon-ID i сохраняют точный фокус; fit/result/revision не изменены.

Independent QA; модель Codex, точный provider/deployment model ID недоступен. Call5/5 ulab-p2w; только Review4 CR-MC-B1 / MC02–04, не новая полная MC/thermal кампания. [Source-first методы](../../.overgate-runtime/module-cleanup-qa-idless-fix/methods.md) не меняют original expected. Original Review4 прочитан целиком в thermal worktree: `docs/reviews/2026-10-07-module-card-cleanup-code-review-r1.md`, SHA256 `004311b77e54730ff2b976bbbfdbbf53fef4abcc96d313f9e157ac409a34a920`.

## Source / build / contracts

Runtime source `721e815e0d46fd4deb9afc995caf9f2886598724`, affected base `85fee8c413bba111b0d9b5a58d8d77d4111bef8d`. Worktree `/Users/komleff/Documents/GitHub/u2-lab-thermal-diagnostics`; immutable `.overgate-runtime/module-cleanup-idless-fix-release/dist`. Actual own plain LAN `http://192.168.68.65:4214/`, secure=false; desktop1440 и true `isMobile+hasTouch`390, оба initial documentWidth=viewport.

OwnHEAD и exact2 delta verified: `src/app/fitting.ts` + `tests/browser/module-card-cleanup.spec.ts`, другие tracked commit paths равны affected base. Runtime diff — nullish→truthy fallback выбора returnId в `closeDialog`; сохранён `CSS.escape(id)`. Current owner/read callers: fitting.ts:159/166/280, ship-view.ts:65 idless builtin ring, lab-view.ts:171 idless measured-table. Changed test привязан, не служит oracle. Полные actual Gitblob/SHA/byte rows: [source-binding.json](../../.overgate-runtime/module-cleanup-qa-idless-fix/source-binding.json).

Frozen whole HOW9281B SHA256 `59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4`; accepted working WHAT11824B SHA256 `234255da891419ea6754282a7c5cdd850c3b4ea2449bdc1b1e3567b45ab830ee` — самостоятельная сверка bytes, не committed WHAT claim. OwnFP `1ea5ab34b354820cf1e9cce0d118a32811d0eb768e863f2b16f5044c926414eb`: ordered2delta pathNULGitblobLF + literal wholeHOW + frozen workingWHAT + literalReview4.

Release binding SHA256 `e4426e9856ffd992a5e6868f24f004e070f493d1e4af80ea47124e0dd026a3ad`; sourceFP `68a8c11e40dbcba41e22ac29a13869d297d2f19241836ad4178e2a49e603987c`; buildFP `f2142ce5fd6353d444bd0575ddf7a19dc3338fc1b9a0f882eb9c8fedd5fc50ec`. PM17asset proof / fresh normalguard489unit/52browser+SKIP/26cloud — external, не собственный повтор.

## Actual affected ledger

| TestCase | Source AC | Method / actual result | Evidence |
|---|---|---|---|
| IDL-01 | CR-MC-B1, MC02/03/04 | PASS:1440 native раскрыть `fit-ring`, нажать actual `.ring-node[data-instance="builtin:laser"]`; DOM id действительно пустой. Close и Escape: dialog закрыт, focus=`fit-start`, pageerrors0; сведения относятся к измеренному builtin. | `native-1440.json`: ring-builtin-Close/Escape |
| IDL-02 | CR-MC-B1, MC02/03/04 | PASS:1440/touch390 actual measured-table button `[data-instance="fit:payload-1"]`, id=''. Native mouse/tap открывает измеренные сведения; Close/Escape безопасно возвращают `fit-start`, исключений0. | `native-{1440,390}.json`: measured-table-Close/Escape |
| IDL-03 | MC02/04, original MC-UI-B1 | PASS: native named `info-builtin:laser` Close на обеих ширинах возвращает этот exact colon-ID, fallback его не подменяет. | named-colon-regression |
| IDL-04 | MC02/03/04 ownership | PASS: native fit/result exports до/после, revision/владелец/интервал byte-identical обе ширины. PageErrors0, requestFailures0. | native-byte-equality-health |

Свежие результаты: **4 группы PASS,6 idless +2 named info cycles,10 check records (6desktop/4touch),0FAIL/0новых harness failures**. На390 Escape выполнен browser keyboard input, это не физическая OS Back gesture. Ring390 не требовался: desktop-only layout в данном scope; таблица реально доступна touch.

Saved view — собственный QA2 actual Worker result, не synthetic fixture: `module-cleanup-qa/paused-result.json`,433254B/SHA256 `4e2adcb28b3282615afa6c8a4d2f92f7417e07e8b58cc99b3d82e552cec1e6e2`, run `1aab7b3c326a2990cb7e512fdb24d512`, измерено2.26s. Native импорт восстановил этот результат; новый Worker не запускался. До/после result-export совпал также с исходными bytes. Fit-export40901B/SHA256 `12b85ec49ebde6f07211af076aeb64db8b789b36b9f7475163e5cd086a5b5c36`, revision1; оба viewport одинаковы.

## Inherited / NOT RUN / seal

QA2 FAIL report SHA256 `d4e95879dc277f8211665aab5affa8a9dc625890f0d990d6aee7c9985e450eab` и QA3 colon-fix PASS `388ed275765d161669a1a6525ec0659fe698517cda01649b92622c331dac82cb` проверены byte-identical, не переписаны. QA3 закрыл только прежний colon-ID класс; сегодняшний PASS независимо закрывает новый idless класс. MC01/MC03/MC05, prior Worker/measurement/stale/readiness/footer и прежний52protected-source proof переносятся по неизменным owners/контрактам и ограниченному fallback diff. Это не свежий повтор5MC методов/семейств/Worker/чисел.

NOT RUN: physical Xiaomi/native OS, новый Worker/hour/81/12h/numerical/thermal/H₂ scope, fullguard/build/deployment/Unity/wear/merge. Независимый повторный CodeReview вне budget5/5 не запускался. Подписано independent QA; source freeze можно снять после seal. Own4214 остановлен; root4196/4189/другие серверы и пользовательские tabs не затронуты. PM sole publisher; readback hashes — в отдельном manifest.
