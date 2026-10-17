---
title: "v4 + catalog0.2.1 — Developer fix CR-V4-B1"
status: DONE_WITH_CONCERNS / IDLE
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/verification/gd-workspace-v4-contract.md
  - docs/plans/2026-10-06-fitting-catalog-0.2.1.md
---

# Результат и подпись

CR-V4-B1 исправлен на `15f5d90e97b696b8738a204953af852942bec704`.
Собственные адресные проверки и обязательный guard PASS. Независимые affected QA
и scoped re-review выполняет PM pipeline; acceptance/merge readiness не объявляю.
Developer / Codex, GPT-6 family; точный provider/model ID средой не раскрыт.
Linked checkout `u2-lab-claude-ui`, branch `feat/gd-workspace-v4`, clean source.

Прочитан весь signed Review r1: 17308 B, SHA256
`430ae60211cad25f2ff5f70022e42df92226db6be527e9768464a1001d854953`;
sidecar 19346 B / `8799d98d08fe545f386f4fb95a6ae52b8dee4d1f975bf1077a2051dc6f577412`.
Source freeze released PM; предыдущие source/artifact/report bytes 131570d8 сохранены.

# Причина и минимальная правка

В `src/app/fitting-workspace.ts:setConditions` неполный монтаж раньше проверял
условия через обязательный `hull:3`. Sputnik/Industrial S имеют два payload slots:
правильный запрет такого пресета бросал исключение из доступной формы условий.
Простая замена на `:1` также отвергала импортированные multi-laser WorkGroup IDs.

Теперь неполный допустимый draft проверяет условия через законный `:1` своей
catalog edition. Только временная опора получает реальные payload экземпляры,
ID, локальные ТТХ и builtin modes; её внутренние служебные ID избегают конфликтов
с импортированными ID. Existing makeMiningRun/validator проверяют реальные group
membership и численные диапазоны. Опора не монтируется в workspace, не экспортируется
и не делает Start доступным. Полный fit проходит прежний прямой путь.

Меняются ровно три existing paths относительно131570d8: workspace owner и
`tests/ui/gd-workspace-v4.test.ts`, `tests/browser/gd-workspace-v4.spec.ts`.
Никаких hull slots, catalog ТТХ, schema, model, runner, Worker, scenario или IO правок.

# AC и выполненные проверки

| Адрес | Собственное подтверждение |
|---|---|
| WF02/WF06, CR-V4-B1 | 34 неполных cases: шесть hulls × две editions, remove/disable march либо power-1; valid temp310/repeat/dt, Start отказ, invaliddt0 atomic |
| Group identity/C05 | Четыре импортированных custom multi-laser ID cases, включая collision с preset ID; неизвестная группа отказ; edition/fit bytes сохранены |
| Active/result/reference | Industrial L с четырьмя законными payload addresses; edit B сохраняет active A, измеренный прежний result и frozen reference; восстановленный complete fit готов |
| Native WF02/06/14 | Sputnik/Industrial S, old1440/newtrue-mobile390: genuine removal/input/blur/tap/download, repeat, отказ шага, fit unchanged, Start disabled, no pageerror/overflow |

RED unit:17FAIL/22PASS — 12 small-hull исключений, четыре imported-group исключения,
один false для четвёртого Industrial L ID. GREEN39/39. Native RED на1315: температура
310 после blur возвращалась300; после fix четыре browser cases PASS.
34 cases исключают удаление встроенной батареи Civilian M. У Sputnik power-1 —
обязательный солнечный источник, а батарея встроена; её не удаляли.

Normal `.claude/hooks/pre-bash.sh` commit guard выполнен на итоговом source:
313 unit /41 browser PASS +1 inherited screenshot SKIP; typecheck/build/reference/
bootstrap/cloud26/syntax PASS, exit0. Guard12164 B, SHA256
`56e8bd0b25833bd703a3e3c30bad4a7adfdf1622770e2472db9885d3107cac12`.
Native adapter activation остаётся NOT RUN; manual normal guard не обходился.

Свежий extracted smoke: localhost4197, LAN HTTP192.168.68.65:4197 и localTLS4199
`/u2-lab/`; четыре cases на каждом origin, итого12PASS. 18 files × три origins:
54/54 response bodies exact. Реальные geometry1440/390, empty pageerror arrays,
полные fit downloads; TLS — локальная эмуляция prefix, не public Pages.
Оба собственных сервера остановлены, listener отсутствует; root live не менял.

Дополнительный named-edge read-only probe:24/24PASS для empty/cargo-onlypayload
всех шести hulls/обеих editions, включая disabled builtin Pony laser. И default,
и explicit[]group принимают temp/repeat без изменения fit. Удалённые явные mining
IDs остаются недопустимой группой. Raw stdout с Vite log сохранён отдельно от JSON;
поправка parser harness не была product FAIL. Нового source/build изменения нет.

# Immutable source/artifact

Root: `.overgate-runtime/fitting-catalog-0.2.1-candidate-fix-r1/`;
serve `extracted/dist`, prefix `https-root/u2-lab`. Source/snapshot/dist/ZIP/manifests
0444, новый отдельный root; предыдущий1315 snapshot не перезаписывался.

149 exact committed/working source rows:
`5306313d0ee48094673655b2ae8bf151af7b75f1e019bae80ff020dfd809fa33`.
Recipe source: SHA256 UTF8 sorted path + NUL + Git blob ASCII + LF.
Acceptance137 rows + literal whole seven contracts sorted by path + layout note
bytes + defects note bytes, без добавочных разделителей:
`9458f05433fb89123d514d00aadb82a46daf48d3528dde054ca5c22e3f1d5988`.
Точные paths/lengths/blobs/whole VC/notes в source-manifest/acceptance-binding.

- source-manifest80092 B / `04352545743c7cd52cabeee9f1a49dab3b1c307fbe1a1d820ff0e624a8c4d2c2`.
- build-manifest3427 B / `16fb1fd35261b44f67b99dbff1bbf62654fc13dac95631d6adec5b4cae33ba09`.
- ZIP525792 B / `0c2e16b9f593adbd21273c1727deafffc1b4b41428004f8a42c8a0c3c184bf82`.
- dist18 digest `702bf1bf914892e37a5ddc3e0b81d4907dde5948a0783e2d55a3d3e866229f3d`.

85/85 protected prior source +2 experiment blobs identical versus1315; шесть
compiled numerical/catalog/Worker/Legacy dependency chunks identical. Это сравнение
с1315, не заявление85/85 baselinef52: прежние11 catalog amendment deltas сохранены.
Предыдущие16 old native identity digests проверены fresh mandatory suite; новые
numeric sweeps не нужны для validation-only UI delta. Detailed proof —
unchanged-runtime.json; source-snapshot/archive hashes — handoff-manifest.json.

# Evidence и границы

Raw `.overgate-runtime/catalog-0.2.1-fix-r1-evidence/`: unit/browser RED/GREEN,
full-guard/commit, package helper, native JSON/attachments, body hashes, ledger,
no-mining probe и prior-artifact verification. Evidence manifest фиксирует actual
bytes; этот readable report не дублирует telemetry/source tables.

NOT RUN: independent affected QA/re-review этой Developer session, физический
планшет/pull gesture, native hook adapter, public deploy/main/base/merge, новые
H3600/matrix/12h sweeps. Предыдущая численная evidence переносится только для
неизменных owner algorithms и declared inputs, не как свежий физический прогон.
Новых известных runtime blockers после own checks нет. PM metadata/publish отдельно.

Подпись: sole Developer / Codex, 2026-10-06. DONE_WITH_CONCERNS; IDLE после seal.
