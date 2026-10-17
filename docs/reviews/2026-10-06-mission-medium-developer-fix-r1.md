---
title: "Developer fix-r1: восстановление и повтор физических рейсов"
status: report
version: "1.0"
date: 2026-10-06
related:
  - docs/plans/2026-10-06-mission-medium-delivery.md
  - docs/product/ship-fitting-v2.2-mission-brief.md
  - docs/product/ship-fitting-medium-modules.md
---

# DONE_WITH_CONCERNS / IDLE — candidate для независимой QA/Review

Actual role **Developer, единственный implementer**; actual model **Codex, GPT-6 family; точный provider identifier не раскрыт интерфейсом**. Source **ec2593157a0ed478e8cfa69cec6c71d860790180**, branch feat/ship-fitting-mission-medium-dev, clean. Fixdelta7 paths относительно9a76ef95f2d5a6d697c311af0738422ddfe055ab; branch delta42 относительно planning7a4cd5ea2b7087cbe33747e25c3d38d1d1476071. Original9a artifact/report и draft1 сохранены неизменно как история исходного дефекта; они не исправленный результат. Acceptance/merge readiness Developer не объявляет.

## Root cause и исправление класса M01/M03/M04/M05/M09

Controller ранее прекращал run при x>D+1, хотя временная потеря retro/электрической мощности допускает охлаждение и последующую коррекцию. Теперь движение продолжается: фактический engine impulse гасит инерцию, установленный retro может возвращать корабль назад, march тормозит обратное движение у точки назначения. Signed v/x не скрыты. Event-clipped физическое торможение и разрешённый arrival tolerance≤1м/≤0.1м/с остаются; trial не коммитит расход дважды. Service только после физического остановленного прибытия; unload/refuel в конце, затем новый пустой вылет. Temporary gate/partial allocation/x-crossing не terminal. Реальное истощение требуемого typed fuel либо пустая батарея без реального источника дают отдельную необратимую причину; shorecharge не добавлена.

False generic fuel event возникал в прежнем kernel из-за любого fuelKg==0, включая отсутствующий H₂. Mission-only adapter классифицирует actual requested instance/thermal duty/bus/установленный расходуемый запас; source/battery/request мощности показываются в диагнозе. Общие численные потоки kernel не меняются. Полный трюм — русское событие «Трюм заполнен → возврат», отдельное от отказа; capacity insight остаётся в журнале и card при отсутствии actual failure. Старые timed metrics/rules сохранены. Current mission limiter больше не подхватывает старый cargo firstLoss. Newtag parser принимает реальную signed correction velocity/position при finite/|v|<c′ и проверяет peak по |v|. Численные snapshot fields не нормализуются и не пересчитываются.

Fix paths: src/runner/mission.ts; src/io/fitting-result.ts; src/app/fitting-ui/lab-view.ts; src/app/fitting-ui/result-context.ts; tests/fitting/mission-recovery.test.ts; tests/fitting/mission-pony-observations.test.ts; tests/browser/mission-medium.spec.ts. Каталог/ТТХ/scenarios/step/kernel/Worker/protocol вне fixdelta.

## Собственные RED → GREEN и mandatory checks

Шесть meaningful RED на9a: default PonyC100km завершался548.04s, short C1615.66s, assumed Sputnik790.62s; ложное топливо у M/отсутствующего H₂; thermal overshoot прекращал run. recovery-red.txt сохранён. GREEN включает эти шесть + два H₂ cases, stage-by-stage cargo/fuel conservation и signed partial result import. First pass physics уже восстановил реальные циклы; четыре remaining FAIL были harness JSON.stringify(Float64Array), исправлен только serializer oracle на numeric arrays, как actual export. Первые native checks запускались со stale9a dist; этот baseline RED сохранён. Fresh build native3/3 GREEN.

Normal bash .claude/hooks/pre-bash.sh (JSON git-commit Bash intent, без override/skip): exit0, свежая .agents/project/verify.sh — **427 unit /46 browser +1 screenshot SKIP, typecheck/build/reference/bootstrap/cloud26/syntax PASS**. Потом штатный git commit; исходники после guard не менялись. Logs evidence/commit-guard.txt и commit.txt. Native adapter activation NOT RUN, manual guard выполнен по разрешённому task contract.

AC mapping: M01 first native Start/default/atomic inputs; M02/03/04 actual event/force/recovery/capped motion/irreversible absence; M05 ≥3 services/cargo/refill/T-charge continuity; M06 signed numeric result analysis/export и invalid cases; M07 old exact .0/.1/.2 oracles; M08 desktop/mobile immutable A/next/controls/navigation/files; M09 fixed9 rows/refinement/short baseline; MF01–04/HY01–02 M50/old45/typed shared stocks — все соответствующие durable suites включены в свежий guard. Refinement completed и near-power: .1/.05/.025, max event delta1.8e−7s, relative delivered/mined/fuel error<0.00001%, одинаковый final outcome. Нет H3600 reporting rerun: таблица взята из final guard.

## Actual M09 H3600 — исправленные девять исходов

Все actual time3600; H₂ consumed0. A/B/C — принятые Pony1/2/3 G0, capacities60/36/12,2/1/0 BulkHold S, passive signature. SCU=D/M/O: сдано/добыто/на борту. Wall — instrumented/concurrent unit run, не device benchmark.

| km | fit | SCU D/M/O | services | стадия в H | diesel kg | wall ms |
|---|---|---|---|---|---|---|
| 0 | A | 0/52.354/52.354 | 0 | добыча | 120.267 | 2955.7 |
| 0 | B | 72/103.542/31.542 | 2 | добыча | 121.933 | 2595.9 |
| 0 | C | 132/141.923/9.923 | 11 | добыча | 129.097 | 1324.5 |
| 100 | A | 0/50.482/50.482 | 0 | добыча | 240.394 | 2736.7 |
| 100 | B | 36/69.588/33.588 | 1 | добыча | 495.88 | 7707.2 |
| 100 | C | 36/48/12 | 3 | обратный перелёт | 755.386 | 15335.7 |
| 1000 | A | 0/6.931/6.931 | 0 | добыча | 876.518 | 7639.6 |
| 1000 | B | 0/13.462/13.462 | 0 | добыча | 874.281 | 8034.7 |
| 1000 | C | 0/12/12 | 0 | обратный перелёт | 944.785 | 8482.8 |

100km C реально завершает3цикла и идёт в четвёртом inbound; B завершает1 и продолжает добывать второй; A не успевает заполнить60SCU. Far1000km теперь достигает поля после thermal recovery/correction и продолжается доH; никаких controller-induced stranded. Horizon в незавершённом участке не объявлен невозможностью корабля. First thermal times100km B/C1416.922/513.923s и1000km A/B/C155.047/157.811/160.475s. Near0 C после11циклов реально исчерпывает заряд при источнике0.450MW/request3.200MW, продолжает partial mining.

## Два operator cases и честные Power assumptions

Sputnik1 +bulkS/две activeS/Sbattery в power1; lawful preset diesel generator/tank сохранены. Это baseline-допущение, не exact неизвестная сборка оператора. H3600:3 services/90SCU, fourth inbound, actual diesel5745.578kg и charge10.506GJ в конце; никакого ложного fuel stop.

CivilianM2 +bulkM192+builtin24=216SCU +two TIM. Assumed default power (без generator): actual battery0 около573.155s, supply0, следующий необходимый electric thrust необратимо недоступен; cargo208.284SCU сохраняется. Это честный no-generation negative, не attribution оператору.

Дополнительный lawful supplied вариант: SolarM/H₂ generatorM/tankM/batteryM +те же2TI/2laser/bulk. H3600:1 service216SCU, mined323.3819/onboard107.3819; H₂3463.7457kg, charge0, actual source3.960MW vs request84.811MW после1146.683s. Добыча partial, repeat не остановлен. H₂ refill≠electric charge; заданные module numbers не увеличивались для обещания3циклов. Отдельный feasible M/H₂ case с hold24/1km завершает35 services/840SCU, receivedH₂227.973kg/current3647.465kg/charge25.743GJ; третья и последующие service boundaries проверены по реальным ledger. Exact operator Power composition пока неизвестна.

## Новый immutable artifact / plain LAN

Root **/Users/komleff/Documents/GitHub/u2-lab-claude-ui/.overgate-runtime/mission-medium-v2.2-candidate-fix-r1**, serve extracted/dist,17files; все candidate bytes0444. source-manifest.json **62680B / 5d07e23ccb4bd8778fbbf200577a7b897cb56ccce9f0d80b3dd06d45ea93d6bf**,155rows/11wholecontracts, fp **b1b6ef6e8f62ca6893fe29fc2b5f42e1f53c778410d55b29208dfc7eb0ce3fa5**. build-manifest.json **3334B / 1a6562977fb431eb47f8ae276e23281e162d053e3b68ff93cc524db9ef141ce4**, fp **7a83cd4428ff5705b21a4379fc5538d73a901a9519dffdb26fee4b35b701c907**. ZIP u2-lab-mission-medium-v2.2-fix-r1.zip: **537480B / 53952652de99049555028638de8dbf86688a2be2864b9dbff5eee595d4c99cf5**,17/17 byte-equal extraction.

evidence-manifest.json **9970B / 605a25a540e03a676abab4474cf5ae8d1083e559a95eeb58564c3963379239c5**:41 copied files +11 initial large harness files сохранены отдельно immutable по absolute path/hash. M09-table.json **55753B / dbd1f746ab381f1d0a3dc4dff9ad298ebcda4787abc1ab103ea452306430588e**; protected-proof.json **9557B / d6e4fb677803d6d0cbe94e4d0ae1fa0d6b59333b786f0c1499af21697b3113d9**. Source recipe evidence/package-final.mjs: sorted full-file rows path NUL Git blob LF→SHA256; full contracts обычные rows один раз, без appended text. Build: sorted path NUL rawSHA256 LF.

Actual extracted http://192.168.68.65:4192: desktop1440 short trip done8.3098899s/delivery.01SCU/real propulsion fuel; true-mobile390 genuine focused-edit first Start→H3600/3services/36SCU/inbound4, positive diesel/charge, no pageerrors, viewport=document390. M picker15rows содержит пять новых семейств. Own server88547 остановлен; root4183/4184/4186/4188/4189 и user tabs не менялись.

## Protected proof / limits

Все3 принятых whole contracts unchanged, fp0daf7222dd44f9ab1238e03a1de3d59f59185d7b7a55b17bd028f6da77fed7f2. Old step numeric body SHA d0c35a12ecfa8e4c8a3c39b1c916aad872f68d555741674631ac7b8ee5c18a08 byte-exact planningbase. Old8 captured .2 native catalog/fit/spec/zero/partial/complete digests проходят, как .0/.1 goldens. 113 manifest rows неизменены от7a; fix не меняет численные старые модели/каталог/Worker. Compiled bundles изменены, их equivalence не заявляется.

NOT RUN: независимые QA/Review исправленного кандидата, physical Xiaomi/native gesture/public Pages/hostedCI/native adapter/12h/broadmatrix. Поведение exact operator Power layout не подтверждено. Сходимость двух заданных representatives не является all-fit proof. Исходный report9a14731B/597ed5469a507566d1817597aac328ee9abcf750b7fd9c5469a4d3913cebd44d и originalartifact неизменны; этот report заменяет прежний допустимый-stranded вывод для controller-induced transient class. Подпись — Developer/Codex GPT-6 family; byte-seal sidecar.signature.json. **IDLE, tracked source frozen** до named QA/Review feedback.
