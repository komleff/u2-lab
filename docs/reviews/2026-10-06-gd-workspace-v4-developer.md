---
title: "Developer — GD workspace v4: реализация и проверяемый кандидат"
status: DONE_WITH_CONCERNS
version: "1.0"
date: 2026-10-06
role: Developer
model: "Codex — GPT-6 family; exact provider model identifier is not exposed"
base: f52fa386a71183267e75d9b03def8dfa579d6af3
source: 17bb6b66e6384ee53ee1250e8dc2399ef4a2256f
related:
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/plans/2026-10-06-gd-workspace-v4.md
  - docs/verification/gd-workspace-v4-contract.md
  - docs/user/ship-fitting-ui.md
---

# Результат

Один Developer выполнил три связанных этапа WF01–15 в изолированном
`feat/gd-workspace-v4`. Чистый atomic commit
`17bb6b66e6384ee53ee1250e8dc2399ef4a2256f`; 21 изменённый путь. Это кандидат для
независимой QA и scoped Code Review, не заявление acceptance или merge readiness.

Рабочая страница непрерывна: оснастка, условия, графики и сравнение доступны
якорями. Компактный паспорт, отдельные полноширинные разделы Питание / Полезная
нагрузка / Контроль сигнатур и optional кольцо сохраняют монтаж/каталог/preview.
Следующий черновик можно готовить при расчёте; active spec, измеренный результат и
замороженный эталон имеют собственные корпус, условия и ревизии. Один Worker
сохранён. Частичный live snapshot не обозначается операторской паузой при RUNNING.

Шесть обзорных графиков используют рабочую ширину, читаемые оси и закреплённые за
ID цвета/стили. Полные каналы и таблица retained mean/min/max/count раскрываются
дополнительно. Выбор bucket/события связывает графики, модули и журнал; итоговые
метрики и конечные запасы отдельно подписаны. Первый ограничитель из существующих
численных metrics виден рядом с обзором результатов, включая честное отсутствие.

Поддерживаемые initial T, dt, длительности фаз/repeat и существующие локальные SI
поля доступны для гипотез. Поле помимо powerW проверено с experimental provenance;
каталог не изменяется. Native fit/run/result различаются по типу открытого объекта.
Новый отдельный result validator проверяет потребляемые числа, ownership,
каналы/массивы/интервалы/retention перед показом измерений; отказ атомарен. Genuine
zero/partial/completed файлы всех шести корпусов открываются без нового расчёта.
Legacy/неподдерживаемый result model/catalog отвергается с объяснением, а прежний
RunSpec replay остаётся отдельным действием.

Последние прямые поручения оператора включены: filename dialog обеих кнопок
«Сохранить сборку» (header/F3), Unicode basename и .json, Отмена без скачивания и
изменения данных; viewport overscroll boundary только текущей fitting page. Обычный
scroll сохранён, без blanket touch events, persistence или browser settings.
Footer показывает точное «интерфейс v4.0» отдельно от версии численной модели.

# AC и проверка

| Область | Реализовано и адресное evidence |
|---|---|
| WF01–03, V4-01 | Сборка/каталог/варианты и паспорт; сохранены прежние монтажные tests. Новые tests проверяют measured hull/laser/cargo/revision и импортированный объект. |
| WF04–06/12, V4-02 | Advancing H180×1, переходы якорями, редактируемый next draft, immutable active export, Pause/Freeze/Cancel и новый B; прежние Step/Resume/late/foreign-owner regressions проходят normal guard. |
| WF07–09, V4-03 | Шесть обзоров, физический размер шрифта осей ≥11px в browser chain, stable adjacent-channel color, selected bucket/module/journal и честные final summaries. First limiter не спрятан в aside. |
| WF10–12, V4-04 | Genuine Pause→Freeze snapshot A→Cancel→другой корпус B; reference не заменён cancel result, baseline не зависит от sort, измеренные и next условия/ревизии различены. |
| WF01/03/06/13, V4-05 | T/фазы/repeat/dt и local efficiency=.4 с единицей/provenance, отрицательные проверки и неизменность catalogue/active. |
| WF01/06/13, V4-06 | Native fit/run/result/CSV export→fresh page→reopen без Worker start. Полные native identity/metrics сохранены; bad result не портит fit/result/reference. Custom filename/content и Cancel проверены. |
| WF13–15, V4-07 | Полная цепочка 1440/820/390, реальные touch tap/viewport/ошибки/export. Extracted actual localhost/LAN/TLS-prefix smoke ниже. Footer, отдельные строки слотов, overscroll и scrollability включены. |

Meaningful RED→GREEN получены до соответствующих production changes: три исходных
workflow counterexample; десять result/atomic/T cases; два selected-interval/live
label cases; actual selected multi-laser group; wire-tail partial; opened partial;
читаемая строка слотов; первый ограничитель; lazy closed optional graph; overscroll
boundary; filename dialog. New UI unit owner содержит 42 cases. Полный исходный
ledger/logs сохранён в `.overgate-runtime/gd-v4-evidence/`, включая FAIL.

В первом full guard обнаружен настоящий mobile overflow: длинный runId в узком
Compare dd. Leaf wrapping исправлен во всех затронутых identity/context surfaces;
полный ID сохраняется, inspector bounds не ослаблены. Свежий normal guard после
последних filename/CSS изменений завершился exit0:

- `.claude/hooks/pre-bash.sh < .overgate-runtime/gd-v4-evidence/commit-guard-input.json`
  → `.agents/project/verify.sh`: typecheck, **231 unit PASS**, build,
  **33 browser PASS + 1 screenshot SKIP**, reference/bootstrap, **26 cloud checks**,
  shell syntax — PASS. Native hook adapter activation остаётся NOT RUN.
- `git diff --cached --check` до commit — PASS; обычный `git commit` без override.
- `node .overgate-runtime/gd-v4-evidence/final-smoke.mjs` — exit0, три actual origins.

Guard log 10595B, SHA256
`79da34fd1f0c39452de45d4c9f31439a099809eb30e66c5dcc6cecb7f246522e`.
Guard был выполнен на точно тех staged source bytes, которые вошли в commit.

Ранние ошибки harness не выдаются за product RED: ошибочно скрытый requestedW;
нет ожидания DOM readiness первого rows-case; кнопка экспорта внутри закрытого F3;
первый filename запуск со старым dist; неверный parent selector заголовка эталона
в первом standalone smoke. Tiny negative уже отвергался исходной validation.
Исправленные expectations соответствуют реальным accepted owners. Все оригиналы
сохранены; перечень решений — `gd-v4-evidence/evidence-ledger.json`.

# Runtime performance risk

Оператор сообщил H3600 и «в разы дольше»; точные fit/speed не предоставлены.
Представительный источник — Pony:3, 3600s, dt=.01, MAX, одинаковые условия v3 и v4.
Сначала измерены before bytes, затем устранён доказанный лишний work: закрытый
optional full-channel SVG больше не генерируется. Overview и полная таблица/данные
сохранены. Render cadence, throttling/cache и Worker schedule не менялись.

| Desktop trials | UI wall | UI long tasks |
|---|---|---|
| v4 before, два H3600 | 9.848 / 9.923s | 103/104; сумма 5.972/6.027s |
| v4 after, два H3600 | 9.645 / 9.578s | 1/1; сумма .222/.224s |
| v3 в after парах | 9.818 / 9.629s | исходный сравниваемый stand |

Все before/after/v3 samples имеют одинаковые sorted JSON hashes численного spec,
state и metrics, time3600 и ticks360001:

- spec `f0bd0f953170c3edc4dc40c9cb0473355c3209577893e03b73b14a7b06a85cba`
- state `5046db21c9478a9eaf4f9be71a10a3a87362f7b10183842f36f876707fb66efe`
- metrics `5c19a9381f23093e3c6e8185012e8948424748e2f73bad19344d7dd77cd566ce`

Многократное общее замедление в этом desktop workload НЕ воспроизведено;
универсального закрытия operator performance case нет. Cold H600 sample
конфаундирован и не использован как доказательство v4 regression. Физическая
Xiaomi performance не проверена. Raw before/after outputs и отдельные dist
snapshots остаются неизменяемыми evidence.

# Артефакт и источник

Корень `.overgate-runtime/gd-workspace-v4-candidate/` в этом worktree:
standalone `u2-lab-gd-workspace-v4.zip`, extracted `extracted/dist`, local prefix
`https-root/u2-lab`, exact source tree и `source-snapshot.tar.gz`. ZIP CRC и equality
original/extracted/prefix проверены. Preview1 и прежние Claude/Ship Fitting artifact
seals не перезаписывались.

| Объект | Bytes | SHA256 |
|---|---:|---|
| source-manifest.json | 49023 | ba562b75f66ef0bd13baaf7053ff85f45d9e42c2cd7ab55a2f8e46cad2018371 |
| build-manifest.json | 3268 | 37970c4f1e8b03e218d4a9dfc3f801958ce930e1b8fb020cf24496df6b467a1a |
| unchanged-runtime.json | 20291 | e07d8cf33a0c292ac775876d8355adfc9fe361acb9a00a1e161fa8e24872c0a7 |
| source-snapshot.tar.gz | 993868 | 8f961db9385ef44b5e7c4610cd29fa8890c195c5c0d0a850cd94d870be6ea989 |
| u2-lab-gd-workspace-v4.zip | 522775 | 9e448c39636726f87a7a88f4300190d5cef2b5b20cbccac831b2e148479567a1 |
| evidence-manifest.json | 23592 | bf52eaef2652a44c833e3de7439a47a9728944dd6b38d6d9e3caabb728f5409e |
| guard-evidence.json | 410 | 76280f024d80a977c4e906a58432699b589eac2f6d12661b83c9e096c8fd5741 |

17 dist files, digest
`0d732b56ee77e1d86546900cce46d1ccd5f80562e64fb78567100c17d6caf8ca`.
128 complete source paths, content binding
`a725c39a21f9c8c9c0e071baef52ee7d8e63d9a32878f0b09bba143777883f2c`.
Точный recipe: rows lexically sorted по path; SHA256 UTF-8 конкатенации
`path + NUL + gitBlob + LF`. Никакой отдельной текстовой конкатенации contract после
rows нет. Все пять целых contracts входят обычными complete-file Git blob rows.
Whole v4 VC: blob `f71682ad5a7a6820d5a6b1c8eb9c0963da9ba853`, 7970B, SHA256
`f50fca6976ac2f73daf4e4cc5653b6aabf23b7071e83e34f2febdf2c0a9160e5`.

Изменённые пути:

```text
docs/user/ship-fitting-ui.md
src/app/fitting-ui/{compare-view,conditions,lab-channels,lab-view,local-variant,result-context,ship-view,trace-chart}.ts
src/app/fitting-workspace.ts
src/app/fitting.css
src/app/fitting.ts
src/io/fitting-result.ts
 tests/browser/{claude-ui-fixes,claude-ui-review,claude-ui,fitting,gd-workspace-v4}.spec.ts
 tests/ui/{code-review,gd-workspace-v4,qa-fixes}.test.ts
```

Brace groups перечисляют точные имена; source-manifest.changedPaths содержит
отдельные 21 path без сокращений. Approved product/HOW/wholeVC не редактировались.

85 защищённых source/fixture blobs и два matrix/sensitivity artifacts совпадают
с base f52 (и прежним numerical owner903). Kernel, runner, Worker/protocol,
сценарии, каталог, существующие IO/Legacy source не менялись. **Compiled4/6** exact:
two catalog chunks, Worker и Legacy CSS. Общий fitting-json chunk и Legacy import
chunk отличаются: новый UI result validator потребляет existing
initialMiningMetrics, изменяя Rollup shared-export graph. Это новая review surface,
не заявленная six-bundle byte equivalence. Full guard проверяет Legacy; прежние
numerical12h/matrices не запускались заново на unchanged source. Fresh same3600
spec/state/metrics equality дополняет source proof и не заменяет физический long run.

# Extracted smoke и пределы

На actual `127.0.0.1:4197`, `192.168.68.65:4197` и local TLS emulation
`192.168.68.65:4199/u2-lab/` все **17×3 HTTP bodies** имеют expected SHA256.
True-mobile isMobile/hasTouch390 на каждой origin: Start advances, один Worker,
Pause→FreezeA→Cancel→B complete20.25s, активный export не меняется от next edits,
reference неизменен. Result/fit/run/CSV скачиваются native tap; Unicode filename
«Моя сборка ГД.json» совпадает с выбранным монтажом. Header/F3 одинаковы,
Cancel не скачивает/не меняет owner/result/reference. Неверный result атомарно
отклонён, полный error literal сохранён, после него export работает. Fresh result
reopen не запускает Worker. Ошибок страницы0; inner/document/visual390, scale1;
overscroll computed none/none и scrollY650 подтверждены. В этом коротком B
firstLimiter=null; UI честно показывает отсутствие за измеренный интервал.
Observations — `gd-v4-evidence/final-smoke-observations.json`.

TLS — локальная certificate emulation, НЕ public Pages. Physical Xiaomi gesture,
полная физическая device chain/performance, public deployment, native adapter,
новая независимая QA/Review и operator merge — NOT RUN этим Developer. Old device
PASS не переносится на v4. Screenshot test явно SKIP. Временные собственные
4197/4198/4199 процессы остановлены; родительские4183/4184/4186/4188 не тронуты.
Source/artifact freeze: дальнейших tracked edits нет. IDLE для PM metadata и
точного QA/Review binding.
