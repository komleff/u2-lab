---
title: "Рабочее пространство ГД v4 + каталог 0.2.1 — независимый Code Review r1"
status: sealed / CHANGES_REQUESTED
version: "1.0"
date: 2026-10-06
related:
  - .agents/RV_ROLE.md
  - docs/product/ship-fitting-gd-workspace-v4.md
  - docs/verification/gd-workspace-v4-contract.md
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/plans/2026-10-06-fitting-catalog-0.2.1.md
  - docs/reviews/2026-10-06-fitting-catalog-0.2.1-qa-r1.md
---

# Вердикт и подпись

**Verdict: CHANGES_REQUESTED. BLOCKER: 1. ADVISORY: 0.**

Независимая проверка обнаружила функциональный дефект подготовки следующего
опыта на разрешённой неполной оснастке малого корпуса. Остальная проверенная
поверхность не дала дополнительных подтверждённых blockers. QA PASS своего
покрытия сохраняется: найденный контрпример не входил в её выполненные цепочки.

- **Mode:** CODE_REVIEW.
- **Role:** независимый Reviewer / Codex, существующая verifier session;
  один combined review v4 + catalog0.2.1, без дополнительных агентов.
- **Model:** Codex; точный provider/model/deployment ID средой не сообщается.
- **Commit:** `131570d8f018d3617067bb558099f68aff7c9a53`.
- **Baseline:** `f52fa386a71183267e75d9b03def8dfa579d6af3`;
  просмотрен cumulative diff, а не только последний commit каталога.
- Primary: `/Users/komleff/Documents/GitHub/u2-lab`;
  linked runtime: `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`.
- **Review Contract:** `.overgate-runtime/gd-v4-catalog-code-review-contract.md`,
  прочитан полностью; 6912 B, SHA256
  `cec7df4acd3b3c2002595bf5614dc3c09c1ac635e779c2bd3015d040ec05f08e`.

Подпись: Independent Reviewer / Codex, 2026-10-06. Область определяется этим
Review Contract и принятыми WF01–15/C01–08. Решения оператора и дополнительные
layout/defects notes учтены; новый WHAT и численная модель не вводились.

# CR-V4-B1 — условия неполной сборки малого корпуса вызывают исключение

| # | Severity | Заголовок | Файл:строка | Статус | Beads ID / Обоснование |
|---|---|---|---|---|---|
| 1 | IMPORTANT | [BLOCKER] CR-V4-B1: неполный Sputnik/Industrial S нельзя штатно подготовить к следующему опыту | src/app/fitting-workspace.ts:127; src/app/fitting.ts:298 | fix now | WF02/WF06, обязательное поведение editable next draft; разрешённая неполная сборка не должна ломать форму |

**Сценарий.** Открыть Sputnik с одним лазером, удалить обязательное изделие,
например `power-1`, и изменить исходную температуру следующего опыта. Монтаж
остаётся допустимым неполным черновиком, Start правильно недоступен. Поля условий
при этом доступны (`lab-view.ts:53`, `locked = false`).

**Причина.** `setConditions()` при `readiness.canRun=false` подставляет
`getPresetFit(fit.hullId + ":3")`. У Sputnik и Industrial S только два сменных
payload slots. `catalog.ts:149–156` корректно отказывает пресету с тремя лазерами,
но бросает исключение «Число лазеров превышает слоты». Вызов из `oninput`
(`fitting.ts:296–300`) не перехватывает его. До обычного boolean refusal и сообщения
валидации выполнение не доходит. Переключатель repeat вызывает тот же метод.
Корневой дефект — выбор недопустимого fallback, а не запрет третьего лазера.

**Собственное воспроизведение.** Изолированный вызов текущих модулей под
Node 24.21.0, с разрешённым source environment и TS import loader:

```ts
const fit = getPresetFit("sputnik:1");
const batteryId = fit.assignments["power-1"];
delete fit.assignments["power-1"];
delete fit.instances[batteryId];
const w = new FittingWorkspace(fit, loadCandidateCatalog());
const before = JSON.stringify(w.snapshot());
w.setConditions({ ...w.getSelected().conditions, temperatureK: 310 });
```

Фактически поймано в review harness:

```json
{"probe":"WF02/WF06 incomplete Sputnik conditions","exception":"Число лазеров превышает слоты","afterUnchanged":true}
```

Исходное состояние сохранено; подтверждён отказ рабочего действия через
необработанное исключение, а не повреждение результата. Тот же путь статически
применяется к неполному Industrial S. Новый browser run этой ошибки Reviewer не
выполнял; доступность формы и отсутствие перехвата проверены в текущем source.

**Минимальная правка.** Валидировать условия на допустимой опорной сборке либо
отдельным существующим validator, не предполагать наличие `:3` у каждого корпуса.
Допустимые next conditions должны готовиться даже при неполном монтаже;
недопустимые должны возвращать штатный отказ, сохраняя draft/active/result/reference.
Нельзя обходить проверку слотов или объявлять неполную сборку готовой к Start.

**Affected closure.** Достаточны разрешённые неполные Sputnik и Industrial S,
изменение численного поля и repeat, invalid input atomicity и необходимая регрессия
полной сборки/immutable активного опыта. Полный повтор 7/72 кейсов, matrix и 12h
для этой правки не требуется. PM уже получил воспроизводимый blocker; исходники
до полного отчёта оставались заморожены.

# Что проверено независимо

Просмотрены все 39 изменённых runtime/test/guide paths по cumulative diff и
необходимому текущему контексту. Прочитаны новый result parser, workspace/controller,
chart/Compare helpers, CSS и пять authored SKU; рассмотрены durable assertions,
включая whole browser chains, edition digests и сохранение прежних fixtures.

- Active runId/spec/owner, предыдущий результат и frozen reference отделены от
  next draft. Один Worker и запрет второго Start сохранены. Paused Freeze запрашивает
  snapshot, а Cancel/terminal освобождает расчёт перед B; параллельный Worker не введён.
- Compare показывает измеренную идентичность и отличия значениями; сортировка
  не назначает новую базу. Native result открывается без запуска Worker;
  parse/fit validation предшествуют мутации workspace.
- Overview разделяет электричество, температуру/пороги, запасы и добычу;
  стили закреплены за channel ID. Bucket, таблица экземпляров и журнал используют
  общий выбранный интервал. Mean/min/max/count не выдаются за мгновенные ticks.
- ID сменных карточек и ring controls заданы до DOM reconciliation; позднее
  присвоение ID, вызвавшее исторический held-pointer FAIL, устранено. Сохранение
  имени файла хранит состояние диалога; CSS boundary не отменяет все touchmove.
- Result validation покрывает потребляемые поля, finite/count/array dimensions,
  supported model/catalog, bounds и временную согласованность; unsupported refusal
  не заменяется импортом одного spec. Closed detail SVG не строится, overview
  остаётся доступным; spread по длинному массиву в chart helper отсутствует.
- Каталог additive: прежние 40 SKU и hull/builtin records сохранены, добавлены
  три engine SKU и два лазера. Industrial M использует 16.2288 MN и force-share
  пакета 160 t, authored retro без повторного ×0.4, pair учитывается как два
  установленных экземпляра. η.40, Turn≈Strafe, path/host/cp явно experimental.
  α, heat и bill передаются существующим owners, а не новой flight simulation.
- Matching presets учитывают размер/класс; Pony остаётся UNKNOWN/G0 с явным
  локальным клоном builtin anchor. Два малых `:3` корректно запрещены — именно
  поэтому использование такого пресета внутри `setConditions()` является B1.
- Known editions сохраняются в fit/run/result; new-only global SKU под старой
  inventory запрещён, explicit Apply повышает только next draft. В scenario
  изменён только stamp `f.catalogVersion`. Старые numerical fixtures привязаны
  к 0.2.0 без переписывания expected; новая data path проверяется отдельно.

Новые numerical значения сопоставлены с ранее проверенными direct owners U2
на `cdc490e3517c8455f662f82579c45813cdbb9a76`: compact
`propulsion_force_mass_input.csv` M/Industrial, force-grid §8.2/8.8,
power-components §2.2/2.3, thermal-doctrine §3 и laser reference §2/4.
Канонический exact force input отличён от prose rounding и lab hypotheses.
Нового поиска по всему U2 или архивам не выполнялось.

# Reviewed-Paths и привязка

Явный список reviewed changed paths:

```text
docs/user/ship-fitting-ui.md
src/app/fitting-ui/compare-view.ts
src/app/fitting-ui/conditions.ts
src/app/fitting-ui/lab-channels.ts
src/app/fitting-ui/lab-view.ts
src/app/fitting-ui/local-variant.ts
src/app/fitting-ui/presentation.ts
src/app/fitting-ui/result-context.ts
src/app/fitting-ui/ship-view.ts
src/app/fitting-ui/trace-chart.ts
src/app/fitting-workspace.ts
src/app/fitting.css
src/app/fitting.ts
src/fitting/catalog.ts
src/fitting/data/modules-0.2.1.json
src/fitting/editions.ts
src/fitting/types.ts
src/fitting/validate.ts
src/io/fitting-json.ts
src/io/fitting-result.ts
src/scenarios/fitting.ts
tests/browser/catalog-0.2.1.spec.ts
tests/browser/claude-ui-fixes.spec.ts
tests/browser/claude-ui-review.spec.ts
tests/browser/claude-ui.spec.ts
tests/browser/fitting.spec.ts
tests/browser/gd-workspace-v4.spec.ts
tests/fitting/bill.test.ts
tests/fitting/catalog-0.2.1.test.ts
tests/fitting/catalog-editions.test.ts
tests/fitting/catalog.test.ts
tests/fitting/fixtures/catalog-0.2.0-digests.json
tests/fitting/matrix.test.ts
tests/fitting/source-fidelity.test.ts
tests/fitting/test-spec.ts
tests/fitting/worst-fit.ts
tests/ui/code-review.test.ts
tests/ui/gd-workspace-v4.test.ts
tests/ui/qa-fixes.test.ts
```

Необходимый owner context: `src/app/fitting-session.ts`,
`src/app/fitting-ui/telemetry.ts`, `src/fitting/compile.ts`,
`src/runner/mining-metrics.ts`. Это адресное чтение boundaries, а не новый аудит ядра.

Git blobs каждого reviewed path, baseline blobs и working SHA256/bytes находятся
в sealed `.overgate-runtime/2026-10-06-gd-v4-catalog-code-review-r1-reviewed-paths.json`
(19346 B; SHA256
`8799d98d08fe545f386f4fb95a6ae52b8dee4d1f975bf1077a2051dc6f577412`).

**Content-Fingerprint:**
`55562f6af68289e893a9170617255a2dc5d1fb5fadb835449230fd3761381e05`.

Независимо пересчитаны 137 relevant acceptance paths: actual working bytes,
Git blob SHA1, SHA256/length и exact HEAD blobs совпадают с binding; расхождений 0.
Метод: SHA256 от UTF-8, sorted `path NUL gitBlob LF`, затем literal bytes семи
**полных** contracts в порядке path и двух operator notes (layout, defects).
Семь whole paths: оба plans v4/catalog, оба product owners v4/catalog,
`claude-design-ui-v0.2-contract.md`, `gd-workspace-v4-contract.md`,
`ship-fitting-v0.2-contract.md`. Их blobs/bytes и note hashes явны в sidecar.
Это fingerprint всей VC, а не только выбранных AC строк.

Raw binding: `.overgate-runtime/fitting-catalog-0.2.1-runtime-binding.json`,
47295 B, SHA256 `83b90b145e5a3fe75d70c2d3ef8239ba7fb190d7f41c34dc48ae404cd04e835a`.
149-path source fingerprint —
`37b05e2e0da57b82231c0f632d56cc7bb092c3364ea124bfe183f4b2977fd42c`;
от acceptance исключены только PM memory/INDEX/reports. Сверка 137 bytes не
объявляет все эти файлы повторно семантически отревьюенными.

Artifact identity, подтверждённая PM/QA: linked
`.overgate-runtime/fitting-catalog-0.2.1-candidate`, ZIP 525540 B,
SHA256 `643fab21d1d7b3fc13c43c5c5a7e08e1c1cacef41f3cc7558d45173bcf3790db`;
dist 18 файлов, digest
`d13b6049b49c557358ca0ccb8cc56f11ac780194de6a07a7d0db05b27485c254`.
Reviewer заново не выполнял сетевую проверку всех artifact bodies.

# Собственные и унаследованные проверки

**Own:** actual diff/context review; independent 137-path/whole-contract binding
verification; bounded Node counterexample CR-V4-B1. Итоговый HEAD остался 131570d8,
`git status --short --untracked-files=no` пуст. Product/runtime/test files не менялись.

**Independent QA evidence прочитано:**

- `2026-10-06-gd-workspace-v4-qa-r1.md` — исторический initial FAIL 17bb;
  `2026-10-06-gd-workspace-v4-qa-affected-fix-r1.md` — affected closure PASS ff8.
  Они сохраняются дословно и не становятся свежим повтором на 1315.
- `2026-10-06-fitting-catalog-0.2.1-qa-r1.md`, 13070 B, SHA256
  `7ac6919f42eaf2baeaf72d104035ce55bd4c825d9ba2c56d465ffea323dbcde0`:
  C01–08 PASS, два LAN native workflow 1440/touch390, шесть fresh opens,
  bounded old-edition replay, actual mass/fuel/heat и атомарные version refusals.
  QA manifest 66163 B / `330ff7285de88ab1c4a02aa0a8ad75a45fed98d166ffbffa86aab4cee6e0535e`.
  Раскрытые harness corrections не переклассифицированы в product FAIL.

**Inherited, не own rerun:** normal guard 274 unit/37 browser PASS +1 inherited
SKIP, targeted 43 tests, type/build/reference/bootstrap; PM/QA artifact/origin seals.
74/85 protected source и два experiments unchanged, compiled core 2/6 equal —
не заявляется 6/6. H3600 performance pair относится к явно записанному прежнему
fixture и assumption, не ко всем новым пресетам 0.2.1.

# Not reviewed / not tested и завершение

Не выполнялись новый полный guard/QA sweep, matrix, H3600/12h, новый аудит
unchanged numerical/Worker/Legacy алгоритмов, физический планшет/native gesture,
public/main/base/merge readiness. Mining mission/full hold/flight/refuel, history,
persistence, A/B timeline overlay и pixel-perfect Claude вне этого contract.
Не проверены все возможные наборы ручных local hypotheses. Advisory scope не расширен.

**Source freeze release:** read-only Reviewer работа по 131570d8 завершена;
Reviewer больше не удерживает freeze. Вердикт остаётся CHANGES_REQUESTED до
affected fix CR-V4-B1, независимой affected QA и scoped re-review в этой session.
PM — единственный publisher/triage owner; этот отчёт не разрешает merge.
