---
title: "Дизельный Пони0.2.2 — отчёт Developer"
status: developer-complete-with-concern
version: "1.0"
date: 2026-10-06
related:
  - docs/plans/2026-10-06-pony-signature-slot.md
---

# Результат и подпись

DONE_WITH_CONCERNS. Developer: Codex, семейство GPT-6; точный provider/model identifier
в этой сессии не предоставлен. Единственный implementer, branch
`feat/pony-signature-slot-dev`; источник `3265a6870578d409586b416eb0adfabff3b9a574`.
Один атомарный commit,17 собственных source/test paths, чистое дерево. PM выполняет
публикацию, independent QA и scoped Review; acceptance/merge readiness не заявляю.

План03826203eb5cef1d0102f71a98b07ec469fab1cb прочитан полностью: WHAT/HOW/P01–P05.
Whole plan:7821B, Git blob47e8249b91cb82b09d3388495d29da4839e0b970,
SHA25636b0498e16b163a44b5fb843ea2cb814cc7f1a2fa654d77edef4a5be538e7319.
Источник до кода совпадал с runtime15f5 по product blobs; независимая опора0.2.1
записана до production edits, существующая опора0.2.0 не изменена.

# Изменение и адреса

P01/P02: текущая редакция0.2.2, у нового Pony только removable signature-1 со штатным
passive radiator. Buffer старого signature-2 отсутствует. Все45 SKU, остальные пять
корпусов и прочие поля/builtins Pony равны0.2.1; Industrial S сохраняет3signature slots.
Overlay содержит происхождение принятого lab ограничения; внешний канон не изменён.

P03/P04: общий fitHull выбирает объявленную известную редакцию; совпадающий переданный
catalog сохраняет явные локальные поправки вызывающего кода. Старые0.2.0/0.2.1 Pony
сохраняют2слота в validation/compile/passport/dialog/replacement/F3 и проверке условий
неполной сборки. Parser known run/result проверяет законность actual fit mounting;
подложная0.2.2 с signature-2 отклоняется атомарно. Неизвестная0.2.3 fail-closed;
существующий explicit snapshot replay opt-in сохраняется.

P05: visible edition, sole-slot замена→5.25s real Worker→fit/run/result downloads→
fresh reopen; old second-slot Apply→short run→fresh reopen. Active old180s/×1/Pause,
frozen A, выбор нового Pony в B и отказ подложного импорта сохраняют владельца опыта,
исходный spec, reference и последний valid draft. Native desktop1440 и mobile390
прошли на извлечённом ZIP через actual private LAN HTTP.

Runtime delta: src/fitting/{types,editions,catalog,validate,compile}.ts,
src/io/fitting-json.ts, src/app/fitting-workspace.ts, src/app/fitting.ts,
src/app/fitting-ui/{presentation,ship-view,swap-dialog}.ts.
Tests: tests/fitting/{catalog-0.2.1,catalog-editions,pony-signature-slot}.test.ts,
tests/fitting/fixtures/catalog-0.2.1-pony-digests.json,
tests/browser/{catalog-0.2.1,pony-signature-slot}.spec.ts. Старые tests0.2.1 явно задают
историческую редакцию; только ожидаемый current UI stamp становится0.2.2.

# Собственные проверки

- До кода: capture-baseline.mjs, source0382/runtime15f5; Pony1/2/3 fit/spec/native
  zero/partial3ticks/complete26ticks при25.25s/dt1. SHA256 native JSON.stringify
  с typed arrays→arrays.15 result/fit/spec digests и catalog digest воспроизводятся.
- RED: новые15 unit cases дали8FAIL/7PASS; genuine desktop browser отверг старый
  двухслотовый default. GREEN:15/15 новых и43/43 адресных исторических cases.
  Старый0.2.0 oracle unchanged; numeric expected values не заменялись.
- Mandatory normal guard: exact commit payload через .claude/hooks/pre-bash.sh,
  без force/skip/trust. `.agents/project/verify.sh`: typecheck PASS,328/328 unit
  (42files), build PASS,43browser PASS/1 existing screenshot SKIP, reference PASS,
  bootstrap PASS,26cloud tests PASS, shell syntax PASS. Exit0; source после guard
  не менялся. Native adapter activation честно NOT RUN.
- Extracted ZIP P05: actual `http://192.168.68.65:4190`,2/2 native chains PASS;
  Chromium mobile case isMobile:true/hasTouch:true. Обе редакции дают actual5.25s,
  новый180s immutable spec/×1 принадлежит старому fit. Error events0; inner/document/
  visual widths1440/1440/1440 и390/390/390.17files×localhost/LAN=34 actual HTTP200
  bodies совпали с build manifest; route mocking нет. Собственный4190 остановлен
  после smoke; root4183/4184/4186/4188 и страницы оператора не затронуты.

Сырые RED/GREEN/diagnostics/guard/native/HTTP outputs сохранены отдельно:31files
в evidence manifest. Часть ранних browser FAIL была ошибками нового harness:
слепой toggle уже открытого F3, устаревший ожидаемый label и неоднозначный selector
варианта. Исправлены только проверки; исходные логи сохранены. Ещё один конкретный
первый-клик дефект — отдельный baseline concern ниже, не ошибка численного расчёта.

# Ограниченная эквивалентность

80/85 прежних protected paths равны baseline0382; разрешённые исключения — catalog,
compile, types, validate и fitting-json. Model/runner/protocol/scenario/Legacy source,
45 SKU JSON, исторический hulls.json и оба experiment files неизменны. Формулы compile
не менялись, только выбор declared hull. Из6 прежних compiled chunks совпадают2
(Worker и styles); catalog/JSON/Legacy import graph изменён честно. Поэтому blanket
6/6 binary-equivalence не заявляется. Старые численные опоры подтверждаются source
и captured digest tests, а не regenerated oracle. Нет новых12h/H3600/matrix sweeps;
эта delta не требует их по принятому плану. M-модули/миссия/refuel вне реализации.

# Immutable candidate и рецепт

Root: `.overgate-runtime/pony-signature-slot-candidate/`; final dist и ZIP-extracted/dist
имеют17 файлов. Source snapshot содержит137 complete files: все tracked src/public/tests,
6build/config files,8whole contracts (7previous+новый whole plan). Все committed/working
Git blobs совпадают. Source binding: sorted path + NUL + gitBlob ASCII + LF в UTF8,
SHA256; contracts — обычные строки этого списка, без appended text. Exact assembly:
`evidence/package-candidate.py`; весь plan дополнительно указан отдельным byte hash.

Source fingerprint f626e0eb1f1ef3e2228cd5d26103efb14b3620ed6e1240caa06037e0d6aeb88f.
Dist fingerprint b5f8f267f27917c8fd44c91a744af5808fbcfdbc896a01bd6e22cbbc8f5d0128.
ZIP525365B SHA1d17422c6c68e6e9404bebd15c7b0bb2c37701c70d2b4d1015766a785aa94b7b.
Source archive650469B SHAd6e0e73e2bea6d952f7bce312f6610ae06389c968afb0544f48fc2de68cb6a0b.
Source manifest41755B SHA3bac67f9012e9f9638feb01fd2ecdb8b8b71b3c4a731230df9452594d40f54d0.
Build manifest4032B SHA0e09c55542431bd6d9a4d3ca34817624ad299d1911c75357abedc69d0230e09b.
Evidence manifest5360B SHAee1a03a67e8aab0c8e5c858ebd2bde48b56675cf5f188b489185e6a497249ff0.
Protected proof26208B SHA34e81937a888e6a18e32faf712e195f1b89fc64c4045cd416369c887a5ee793a.
Все handed-off файлы0444; прежние artifacts/evidence/reports остаются неизменными.

# Concern и NOT RUN

На старом immutable15f5@4188 и новом candidate одинаково воспроизводится ранее
существовавший UI boundary: после импортированного result, редактирования duration
и первого native Start без предварительного blur onchange снимает replay section,
заменяя DOM Start между pointerdown/up. Click и Worker start отсутствуют; старый result
остаётся5.25s/complete. Raw baseline-pointer.json фиксирует oldConnected true→false и
zero starts. Дальнейший Tab/blur→Start даёт actual180s/maxSteps1, затем Pause работает.
Новый P05 harness явно завершает ввод через native Tab и проверяет реальный spec;
первый-клик UX не объявлен исправленным. PM поручил сохранить existing concern,
не расширяя Pony delta.

Physical Xiaomi/native download system dialogs/public HTTPS Pages и native hook adapter
NOT RUN. Screenshot suite SKIP прежний. Independent QA/Review новой delta ещё не мои
проверки. После sealed handoff IDLE; source/artifacts не меняю до нового PM release.

Подпись: Developer / Codex, GPT-6 family. Выводы ограничены указанными methods и exact SHA.
