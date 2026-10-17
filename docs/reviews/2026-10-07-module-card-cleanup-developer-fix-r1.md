# MC-UI-B1 — Developer fix verification

Дата2026-10-07; статус DONE / source frozen / IDLE. Роль: единственный Developer. Модель: Codex GPT-6 family, exact deployment ID не раскрыт. Независимые affected QA/scoped Review ожидаются; это не acceptance/merge verdict.

HEAD **85fee8c413bba111b0d9b5a58d8d77d4111bef8d**, branch feat/module-card-cleanup. База фикса1cb910f2e8d8acc6da3ae942c1a04fb4e7a10718. Delta ровно2 пути: src/app/fitting.ts и tests/browser/module-card-cleanup.spec.ts,13insertions/5deletions. Whole HOW/MC01–05 неизменён:59ff94bfd57664868374720ac3be19d8c5cc674bfd7b8e03a3955f0e80ffe5f4. Frozen PM WHAT также234255da… exact, не staged.

Причина: el(id) интерпретировал raw colon-containing ID как CSS selector. Исключение возникало при focused-opener render и Close/Escape; native dialog мог вернуть фокус сам, поэтому прежний focus-only assertion не ловил pageerror. Исправлена одна общая строка: root.querySelector('#'+CSS.escape(id)). Root scoping, реальные IDs и все callers сохранены; ни rename отдельных изделий, ни изменение action/state/model.

RED: existing desktop1440/true-touch390 chains дали2FAIL, каждый поймал2 SyntaxError на installed cargo. GREEN: те же2cases PASS после build. Обе цепочки теперь открывают mounted cargo и builtin laser из focused opener, закрывают настоящей кнопкой Close и Escape, требуют pageerrors0, правильный focus, прежние revision/full fitJSON bytes. OTHER candidate i/selection/Apply/refusal assertions сохранены. Screenshot output отделён от исходного evidence.

Обычный pre-bash guard exit0:489unit/51browser PASS+1existing SKIP/26cloud PASS, typecheck/build/reference/bootstrap PASS. Команда: bash .claude/hooks/pre-bash.sh < .overgate-runtime/module-cleanup-fix-evidence/commit-payload.json; лог guard-final.txt. Никаких дополнительных кампаний.

Artifact: .overgate-runtime/module-cleanup-fix-release/dist,17assets0444; binding.json 14584B, SHA256 5f97f2f0d985073371c6f2e15d7a5d83e2de4cb3a7e99063d83562d93ef6a2c3. Source FP 97e3006935d5b0ff028397ab41d811dec460bc37f4e8c317ff9060c84ce05810; build FP d887f51bfafe196dc358430f7d2c28a433ff387130ef577140ed84cc0a857559; whole HOW FP af4b1956f32bfb228d72667d705720dae0f28ae50b08bfc6edb8c3f6455f451f. Source.fixBaseCommit/fixChangedPaths связывает2delta; changedPaths сохраняет полный11-path UI/test scope. Остальные52tracked src Gitblob равны ebd4814, protected FP377f8d0e28db3b2fa566013aa669a6cd0f3ebe943c0a9ca5c8bf91ed2033fbd9. Working/committed63owners и actual/copied17assets MATCH; ordered path+NUL+digest+LF recipes в binding.

Raw: .overgate-runtime/module-cleanup-fix-evidence/{red.txt,green.txt,guard-final.txt,ledger.json}. Старые release/report/QA seals сохранены. Physical device/native hook activation/public delivery NOT RUN Developer; текущие серверы, thermal/H₂ алгоритмы, TTX/IO/catalog/runner/workspace не изменялись. Product src/tests working tree чист. PM doc/reports и node_modules находятся вне собственного commit; PM может публиковать metadata после source handoff.

Подпись: Developer / Codex GPT-6 family; sidecar SHA256 подписывает точные bytes.
