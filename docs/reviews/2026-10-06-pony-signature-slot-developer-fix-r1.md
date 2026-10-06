---
title: "Pony 0.2.2 — Developer fix CR-PONY-B1"
status: DONE_WITH_CONCERNS
version: "1.0"
date: "2026-10-06"
role: Developer
model: "Codex, GPT-6 family; exact provider identifier not exposed"
source_sha: "bbe3fc9914109dfa2b671666fb0585bdcb38337c"
---

Подпись Developer: единственный исполнитель `/root/ship_fitting_developer`. Кандидат передан для affected QA и scoped Review; приёмку или готовность к merge этот отчёт не устанавливает.

## Изменение и граница

CR-PONY-B1: проверялся только вложенный fit. Из старого Pony 0.2.1 можно было удалить его signature-2 assignment/instance, поставить stamp 0.2.2 и оставить второй модуль в resolvedShip. Собственный RED: такой снимок принимали experiment/result/workspace; настоящий расчёт 1 s поглощал скрытым буфером 20 MJ.

Теперь известный каталог требует легальный вложенный fit, соответствующий declared hull/slots/builtins и точный resolved roster по ID, slot, role, item identity, enabled и builtin: без лишнего или отсутствующего модуля. Диагностика `RESOLVED_MOUNT` указывает соответствующий путь. Проверка не перекомпилирует снимок: numerics, materials, C, resources, gates, origins остаются сериализованными значениями. Совпадающие авторские численные снимки/local variants, отключённый builtin и explicit unknown replay сохранены. Legacy ветка не изменена.

Коммит `bbe3fc9914109dfa2b671666fb0585bdcb38337c`, clean. Delta от `3265a687…`: только `src/io/fitting-json.ts`, `tests/fitting/pony-signature-slot.test.ts`, `tests/browser/pony-signature-slot.spec.ts` (136 insertions, 7 deletions). Полная Pony ветка от planning `03826203…` имеет прежние 17 адресов; точные blob/working SHA находятся в source-manifest.

P01/HOW §3/P04: known falsely restamped fit/run/result отказываются атомарно. P02/P03: каталог, hull resolver, presets и прежние SKU не менялись. P05: genuine Worker/JSON/desktop/touch регрессия. Whole plan неизменен: 7821 B, Git blob `47e8249b91cb82b09d3388495d29da4839e0b970`, SHA256 `36b0498e16b163a44b5fb843ea2cb814cc7f1a2fa654d77edef4a5be538e7319`. C05 product также неизменен: 7363 B / SHA256 `a5c55604317116c29734c4f4775d541d3109879d918f63df857281bcc8aa89a7`.

Review r1 прочитан полностью: 11801 B / SHA256 `2c13604c2e5cc343f82e83ea06d7d530623c640677dca3c5ec293002398524fe`; sidecar 18242 B / SHA256 `57f4fc51f4c443271b20bb51790dfd842a4e0bdfde01bbd5860b6c92ec9e25e0`.

## Собственные проверки

- RED: initial unit 28 FAIL; ещё три named ID-mismatch FAIL; desktop native forged import молча принимался. Исходные логи сохранены.
- GREEN: 35 новых unit cases: 31 отрицательный и 4 положительных. Десять coherent roster/hull нарушений проверены для трёх known editions; отдельно скрытый второй buffer. Numerics и nested fit сами валидны, поэтому отказ адресует структурный linkage. Fit/spec/result и frozen A после отказа неизменны. Три authored numeric positives и unknown opt-in проходят. Targeted suite: 178 PASS; Pony файл: 50 PASS.
- `npm run typecheck`, `npm run build`, адресный Playwright P05: PASS. Финальный normal pre-bash commit guard (включает `.agents/project/verify.sh`): 363 unit PASS; 43 browser PASS + 1 существующий screenshot SKIP; type/build/reference/bootstrap/cloud 26 и shell checks PASS, exit 0. Нативный hook adapter не заявляется выполненным.
- ZIP извлечён; standalone Playwright на `http://192.168.68.65:4191`: 2 PASS / 11.9 s (1440 и 390, mobile+touch). New/old Worker JSON; native rejected forged spec/result сохраняют fit/run/result/A. Geometry inner/document/visual: 1440/1440/1440 и 390/390/390; browser errors пусты.
- HTTP localhost + реальный private IPv4: все 17 файлов извлечённого ZIP, 34 GET body SHA256/bytes точно равны build manifest. Собственный сервер 4191 остановлен. Root 4188/4190 и остальные live servers не тронуты.

Точные команды/RED/GREEN/guard/native attachments/HTTP rows: immutable `evidence/` (17 файлов) и evidence-manifest. Это выполненные проверки; прежняя QA/Pony baseline evidence сохраняется отдельно и не выдаётся за повторный запуск.

## Поставка и доказательство

Root: `.overgate-runtime/pony-signature-slot-candidate-fix-r1/`; serving path `extracted/dist/`. Source SHA указан выше. Источники 137 строк: tracked src/public/tests, шесть build/config owners, восемь whole contracts. Recipe: UTF-8 sorted `path + NUL + Git blob ASCII + LF`; contracts — обычные полные строки, без дополнительного текста. Fingerprint `e000439b02e326d7ada71b5b386430eaf9b20253cb657b31a3ed33e3ca70b9e1`.

Dist: 17 файлов, fingerprint `54d4048e12703a62cec0eecd8066b1b4749a676efc7492cf1ad45e515fa90c5c`; recipe sorted relative path + NUL + file SHA256 + LF. ZIP CRC, source tar и extracted bytes проверены.

- `source-manifest.json`: 41985 B / SHA256 `6ecd10f09aa148c32c61bdb8affa2d9e4f8994a5c5285d9c38d30727642e2925`.
- `build-manifest.json`: 4039 B / SHA256 `99cc14665fc54563394bacd214e14ec3153235a1749b87d85ebfd934f8f0c7ce`.
- `source-snapshot.tar.gz`: 652881 B / SHA256 `a5add1cb802277bca31243d4ff4b0260db2735b089e8435f86d2cdb058c3fca8`.
- `u2-lab-pony-signature-slot-0.2.2-fix-r1.zip`: 525838 B / SHA256 `af385ba4f010e349f4be4edce904033dfd5f5598637b5ceb575ba466e73a78eb`.
- `evidence-manifest.json`: 3055 B / SHA256 `fa0f4e61227e0531311645b49edd4d4f62a42ee5b99179ee2be8d0e616cf4da0`.

`unchanged-runtime.json`: 84/85 protected sources равны 3265; единственный разрешённый delta — fitting-json. Оба historical experiment файла точны. Model/runner/Worker/protocol/scenario/Legacy/catalog/data sources неизменны. Compiled 4/6 точны: catalog shim/data, styles, Worker. JSON chunk изменён; Legacy chunk изменён по shared import graph при неизменном Legacy source. Заявления 85/85 source или 6/6 bundle equivalence нет. Pre-code 0.2.1 digests и 0.2.0 oracle unchanged проходят; дополнительные 12 h/matrix не запускались — numerical body/input не менялись.

## Ограничения

DONE_WITH_CONCERNS: прежний native first-Start blur/layout concern `ulab-w7j` остаётся вне этого fix. В P05 использован явный Tab/blur; его исправление не заявляется. Physical tablet gesture/device, public Pages/prefix deployment, hosted CI, H3600/12 h и новый full QA campaign NOT RUN. M modules и mission не реализованы. Исходный 3265 artifact/report/QA/Review seals сохранены byte-exact. После handoff — IDLE, без новых runtime/metadata правок.
