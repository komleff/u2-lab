# Module card cleanup — Developer verification

Дата: 2026-10-07. Статус: DONE, source frozen / IDLE для независимых QA и scoped Code Review. Роль: единственный Developer; модель: Codex GPT-6 family (точный deployment ID среда не раскрывает). Это implementer verification, не acceptance/merge verdict.

Исходник: **1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718**, branch feat/module-card-cleanup. База runtime: ebd481433b0de027625d8970d14a32aa75245970; план до кода: 6e2d5fb5f0994e3dc0f2c6cf57a10ad0548cede0. Whole HOW docs/plans/2026-10-07-module-card-cleanup.md: 9281 B, SHA256 59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4; контракт не изменён.

MC01: карточка показывает собственные профильные ТТХ и массу; cargo — собственную вместимость, laser — прежний nominal helper. Удалены чужие показатели/whole-fit counts/unknown volume. MC02: native sibling i раскрывает original item JSON; installed/builtin i открывает существующий readonly dialog. MC03: сравнение сборки сохранено под свёрнутым «Изменения сборки», фильтры/сортировка/Apply/batch/снятие/отказы сохранены. MC04: measured/stale и предыдущий run сохраняют владельца, footer UI4.1. MC05: 52 прочих tracked src blobs побайтно равны базе; model/runner/kernel/catalog/fitting/io/workspace/scenarios/Legacy/DOM не изменены. Три numeric helpers loadNominal/miningNominal/nominalFit также exact baseline.

Адресная граница: после импорта/смены корпуса чужие WorkGroup IDs делают реальный draft invalid. Только копия условий для reference nominalProcess очищает selectedWorkGroup; исходные условия, refusal, Start-disabled, fit/revision/export bytes не меняются. Никакой нормализации пользовательской сборки.

RED: 2 native i-chain FAIL (1440 и true-touch390); отдельный nominal RED 1. GREEN: 16 адресных browser cases; финальная пара info/nominal cases 2 PASS. Новый durable chain открывает сведения ДРУГОГО кандидата, сохраняет выбранный candidate/fit/revision/отказ/JSON, затем Apply меняет только ожидаемый payload, проверяет installed/builtin i, keyboard/touch44px/focus и mobile width. Существующие actions/ownership/numeric preview assertions сохранены.

Первый guard: 488 unit PASS/1 obsolete D02 label FAIL. Второй:489 unit PASS/49 browser PASS/2 obsolete footer FAIL +1 SKIP. Сохранены original logs, обновлены только отменённые presentation expectations; numerical deltas −3MW/−.0625125 и остальные исходные oracles не ослаблены. Адресная коррекция:8 UI unit +3 mission browser PASS. Финальный ordinary pre-bash guard exit0: **489 unit /51 browser PASS +1 existing SKIP /26 cloud PASS**, typecheck/build/reference/bootstrap PASS. Native hook activation NOT RUN, как сообщает сам guard.

Изменённые пути (11):
- src/app/fitting-ui/instance-details.ts
- src/app/fitting-ui/presentation.ts
- src/app/fitting-ui/ship-view.ts
- src/app/fitting-ui/swap-dialog.ts
- src/app/fitting.css
- src/app/fitting.ts
- tests/browser/claude-ui-fixes.spec.ts
- tests/browser/claude-ui.spec.ts
- tests/browser/mission-medium.spec.ts
- tests/browser/module-card-cleanup.spec.ts
- tests/ui/qa-fixes.test.ts

Immutable artifact: .overgate-runtime/module-cleanup-release/dist (17 файлов,0444) + binding.json (14012 B, SHA256 b6cc669bd097e8735a00ca58818d0c1e45dde4808497a9a7663170adb4cbdf96), guard-final.txt (33527 B, SHA256 be0874a1513fe98d2997feb445db637b16bcc517632c93f36c54f39c6947d0a2). Source FP af0c9d68f50cef7d7add8991d8904923040536629abdea9744f681fc6f920d7f; build FP cfc232c913249c751e42b8b5f243885613c3b6aa6b715df7e61ee1661c962e7d; whole HOW FP af4b1956f32bfb228d72667d705720dae0f28ae50b08bfc6edb8c3f6455f451f. Recipe: ordered rows path + NUL + digest + LF, SHA256; source uses gitBlob, build/contract SHA256. Protected FP377f8d0e28db3b2fa566013aa669a6cd0f3ebe943c0a9ca5c8bf91ed2033fbd9. Working/committed11+52 и copied/build17 verified MATCH.

Raw evidence: .overgate-runtime/module-cleanup-evidence/ledger.json, red.txt, nominal-red.txt, nominal-green.txt, targeted-first.txt, guard.txt, guard-footer-fail.txt, guard-final.txt, catalog-1440.png/catalog-390.png. Бounded cargo/laser/i screenshots осмотрены; физическое устройство, public/LAN deployment, независимые QA/review — NOT RUN Developer. Existing screenshot SKIP сохранён. Не добавлялись simulation sweeps, governor, schema/deps; серверы/PM doc/node_modules не изменялись и не staged.

Подпись: Developer / Codex GPT-6 family; SHA256 sidecar подписывает точные bytes этого отчёта.
