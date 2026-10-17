---
title: "Рейс v2.2 — Developer fix-r2: временный источник и нулевой повтор"
status: DONE_WITH_CONCERNS / IDLE
version: "0.1"
date: 2026-10-06
related:
  - docs/plans/2026-10-06-mission-medium-delivery.md
  - docs/product/ship-fitting-v2.2-mission-brief.md
  - docs/product/ship-fitting-medium-modules.md
---

# Результат адресного исправления

Actual role: Developer, единственный implementer. Actual model: Codex, GPT-6 family;
точный provider identifier не предоставлен. Исправлены CR-MISSION-B1/B2 из sealed
Code Review r1; независимые affected QA и scoped re-review выполняются после передачи.
Этот отчёт не объявляет acceptance или merge readiness.

Final source: `d57ad5bc75c77954e7eefe63fbe5630ca4529c62`, ветка
`feat/ship-fitting-mission-medium-dev`, clean. Baseline исправления:
`ac4d01ac96e495a8db63cc85c6b7716358b3bfbe`; GUI до него — ec2593157a0ed478e8cfa69cec6c71d860790180.
Изменены ровно два path:

| Path | Git blob | Bytes |
|---|---|---:|
| src/runner/mission.ts | 47d18e841160df86e905621fed85c46ce6b7794a | 22873 |
| tests/fitting/mission-review-blockers.test.ts | 6584fda3876abb1753305f454495ded49ecfd929 | 12837 |

## Причины и изменения

B1: full-hold завершался по пустым stocks/charge, хотя установленная solar временно
закрыта теплом и остаётся реальным путём питания. Mission теперь отличает заряд и
положительные включённые электрические профили: solar area/efficiency/flux,
generator power/path + его typed finite fuel, внешнее electric input. Текущий thermal
gate не доказывает необратимость. Выключенный/нулевой профиль, heat input и топливо
без электрического генератора не являются путём пополнения bus. Тот же predicate
применяется к electric flight. Никаких бесплатного заряда, сброса T или фиктивного
источника: каждое изменение запасов остаётся результатом прежнего stepV2.

B2: пустой first-stop → нулевой возврат/обслуживание → тот же запрос повторялся на
одном clock без increment steps; Infinity budget мог никогда не вернуть управление.
Когда повтор действительно находится в той же точке и времени, controller объединяет
пустой повтор в один реальный passive kernel interval, затем снова проверяет запрос.
Пробный mining step не коммитится; services/work не добавляются. Учитывается также
граница представимости phase endpoint, без нового запрета допустимых zero inputs.
Положительные flight/approach/service сохраняют свои физические интервалы.
Single first-stop может завершиться при t=0; K для нулевой измеренной длительности
теперь null вместо NaN. Пустая рудная цель в пределах существующего cargo epsilon
не создаёт фиктивное нулевое обслуживание; положительный clock интегрируется обычным
шагом, kernel ore tolerance не изменён.

## RED → GREEN и AC

Полный report Review r1 прочитан: 13279 B, SHA256
4eda66a61f662f3c2e70cb89fde4ef1db55c7c496974366445682561fc233ac9;
sidecar 79220 B, SHA256 06c8ceb812b6fbda8090250df1c2dd7480eb8c74afee789111992c1cdabf40fe.
Исходные probes проверены; собственный RED получен до production fix.

| Адрес | Собственный RED | Итоговая проверка |
|---|---|---|
| B1 / M02, M04 | Accepted CivilianM, T600/charge0/solarFlux4e6: done при 0.03999200159968007 s, delivered0 | После первого шага mining/not done; до H5 физическое охлаждение, delivered0, без irreversible event. Cold T300 выдаёт actual100MW и сдаёт .01 SCU; dark empty честно завершает работу |
| B2 / M02, M05 | Pony first-stop/repeat, D/approach/service0: bounded20ms возвращал steps/time/ticks0, 420 services/3364 events | finite и default Infinity-budget chunks возвращают steps1, t=.1, ticks1, services0, events13; idle state равен прямому stepV2 по T/charge/fuel/buffers/mass/work/consumption |
| Class controls / M06–08 | Соседние регрессии, не отдельные исходные blockers | 20 durable tests: solar disabled/area0/dark; generator live/empty/disabled/power0; electric vs heat; flight; zero-phase combinations; finite zero-time result; tiny goal без fictive service; parser, ore/fuel ledgers, Worker ACK/backpressure/pause/step/cancel |

Команды и фактические результаты:

- `npm test -- tests/fitting/mission-review-blockers.test.ts --reporter=verbose`:
  original 2 FAIL + 1 control PASS; final 20 PASS.
- Normal `.claude/hooks/pre-bash.sh` с commit payload: exit0; project `/verify`
  выполнил typecheck, 447 unit / 51 files, build, 46 browser PASS + 1 прежний
  screenshot SKIP, reference/bootstrap/cloud26/shell syntax PASS. Затем атомарный
  обычный commit, без bypass. Guard log: 12831 B,
  cf907abf1ac802f4d7176cd176b42b666dca4bd278c7bc421e49b5e0aff5c705.
- `git diff --cached --check` PASS; после commit `git status --porcelain` пустой.
- ZIP extraction: все 17 файлов равны build dist по raw bytes.

Первый expanded test имел harness-only assertion отсутствующего metric field;
дополнительный disabled-generator fixture сначала неверно использовал builtinModes
для removable Power. Исправлены только тестовые поля/монтаж; parser не ослаблен.
Их промежуточные FAIL logs сохранены рядом с исходными product RED.

Свежий mandatory guard также исполнил ранее принятые repeat cases, без отдельной
добавочной матрицы: Sputnik H3600 — 3 services/89.99999999998 SCU delivered,
29.99999999998 onboard; PonyC H3600 — 3/35.99999998963, 11.99999999553 onboard;
H2-supplied CivilianM, D1km/H3600 — 35 services/839.99999995897 SCU.
Итоговые stage inbound/inbound/outbound, реальные charge/fuel остаются в
`evidence/guard-repeat-summary.json`; wall times включают параллельную нагрузку
unit suite, не служат отдельным perf benchmark. Настоящий native PonyC repeat был
в числе 46 обязательных browser checks.

## Неизменные владельцы и artifact binding

Все прочие tracked paths равны ac4d01ac: из 57 src files изменён только mission.ts.
Kernel, timed runner/model, IO/validators, UI, protocol/Worker, scenarios, catalog50
и old editions не менялись. `src/model/v2/step.ts` целиком byte-equal baseline;
numerical body от initialStateV2 — d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08.
Actual old fit/spec/zero/partial/complete golden fixtures прошли в normal guard.
Не заявляется равенство всех compiled chunks: mission runtime в bundle изменён.

Принятые whole contracts не редактировались: HOW v1.2 15024 B/dd585d3d…,
mission brief 22131 B/e0d414eb…, medium 13078 B/e6088c0a… . Полные bytes/hash/blob
каждого находятся в source-manifest; whole план/VC сохранён, новые WHAT не введены.

Immutable root, все files0444:
`.overgate-runtime/mission-medium-v2.2-candidate-fix-r2/`.
Для сервера использовать `extracted/dist/`; собственный сервер не запускался.

- source-manifest.json — 4914 B / 824d745fa34e33b979c62a970336bc442d18d8783a0347d25941981e48065613.
- build-manifest.json — 3334 B / 4d8ac94d9e783bc768f4d9dcfecaea26d88f717a0111b96e95934faf18f95b22.
- evidence-manifest.json — 2546 B / dd9bfcaeb9e89824afd521cae55617ee14403f188c1c1a74e73388683f0a81f0.
- protected-proof.json — 1083 B / b5a0f90aa48e5cae0bdc01ec1b4cb55cbfd00367175397cdfbdab2fda2555fbe.
- u2-lab-mission-medium-v2.2-fix-r2.zip — 537639 B / f0bbe5446a209f7e7b8d9c3da737dc3c2cc2657192286ea665beeb4a3ac293fc.

Source recipe явный: sorted path + NUL + Git blob + LF, SHA256;
2 delta paths + 3 полных contracts = 5 rows, fp103f9dd52637b7ec8316bc275c2c1db4ee413b92df4d12c0edf28bd8a687eb05.
Это bounded delta snapshot с явным ac4 baseline и ссылкой на ранее sealed full ec259
manifest, не новый полный 155-path архив. Build recipe: sorted path + NUL + rawSHA256
+ LF; 17 rows, fpf9800bf4c01633a1a31c81f5cd22ac3ff6c5558f964f069b663815ac4d6342d1.
Evidence хранит original RED, промежуточные FAIL, final GREEN, packaging helper и
fresh guard. Старые draft1/9a/fix-r1 ZIP/dist/source/report seals не перезаписывались.

## Ограничения и передача

Дополнительную extracted LAN/touch campaign Developer не запускал по прямому PM
поручению после guard: этот адрес принадлежит подготовленной affected QA4. PM
проверяет actual localhost/LAN index и запускает новый immutable artifact. До этого
нет Developer physical/LAN claim на fix-r2; прежний4189/ec259 не изменён.
Новые 12h/extra9-cell matrix, hosted CI, физический Xiaomi и native adapter activation
NOT RUN; screenshot-only SKIP сохранён. Bootstrap/operator/public/main gates этим
исправлением не закрываются. Код/артефакты frozen, tracked IDLE для QA4/re-review5.
