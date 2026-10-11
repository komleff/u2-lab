# Ship Model Catalog 0.3.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить в существующую `/4` Лабу четырнадцать точных S/M-конфигураций, сделать дизельный `Северин Спутник` начальным кораблём и установить `250 K` fresh-default без изменения сохранённых данных и старых моделей.

**Architecture:** Новый versioned каталог `ship-fitting-0.3.1` сосуществует с буквальным reader каталога 0.3.0. Выбранный fit определяет каталог операций, а run/result остаются self-contained snapshots. UI читает порядок и русские подписи из versioned preset manifest; единая константа задаёт только fresh `/4` background.

**Tech Stack:** TypeScript, Vite, Vitest, Playwright, Web Worker, versioned JSON catalogs.

**Spec:** `docs/superpowers/specs/2026-10-12-ship-model-catalog-v0.3.1-design.md`

## Global Constraints

- Base implementation SHA: `80ce3379752f1a443506f0262a75a65d5bd87d0d`.
- Work item: `ulab-9aa.19`; mode: PRODUCT; один основной Developer.
- Новый каталог: `ship-fitting-0.3.1`; `ship-fitting-0.3.0` читается буквально.
- Ровно 14 preset в порядке из spec §3; первый и initial A — `sputnik-d`.
- Fresh `/4` background: `250 K`; explicit/imported values and `/1|2|3` unchanged.
- Никаких L hull/item/preset; будущая подпись — только `Северин Караван`.
- Candidate V3 fields require explicit provenance; отсутствующая identity не заменяется похожим SKU.
- Active/measured/frozen ownership из PR #23 не ослабляется.
- Новый preview не заменяет accepted `4197` до QA и scoped Code Review.
- AI не обновляет main/master и не выполняет merge/auto-merge.

## Review Focus

1. Fit 0.3.0 импортируется при latest 0.3.1 без переоснащения — покрывает Task 2 literal roundtrip test.
2. Fresh default `250 K` не перезаписывает imported `100 K` и phase environment — покрывает Task 3 default-boundary tests.
3. Diesel/electric Sputnik различаются реальным propulsion/power/fuel-составом, но оба имеют laser + bulk cargo — покрывает Task 1 exact identity tests.
4. Выбор нового preset при active/frozen state не меняет captured spec/result — покрывает Task 4 ownership tests.
5. Порядок object keys, label map и footer не расходятся с versioned manifest — покрывает Task 4 selector manifest test.

---

## Target → as-built → gap

| Область | Target | As-built на `80ce337` | Gap |
|---|---|---|---|
| Версия | latest 0.3.1 + literal 0.3.0 | singleton `CATALOG_V3 = 0.3.0` | version union, routing, version-owned operations |
| Каталог | 14 точных S/M preset | Sputnik E, Mir E, stealth | 11 вариантов, exact identities, manifest |
| Sputnik | D default; E retained; оба laser+bulk | только E, без bulk | exact D и исправленный E |
| Мир | D/H/E | E | D/H и explicit labels |
| Фон | fresh `/4` 250 K | три ship-model default `100` | единая constant и boundary tests |
| UI | default D и 14 versioned labels | пустой fit, 3 hard-coded labels | initial fit, manifest, actual version copy |
| Compatibility | imported 0.3.0 literal | workspace hard-coded to 0.3.0 | catalog selected by document/fit version |

## Verification Contract

| AC | Требование | Метод | PASS evidence |
|---|---|---|---|
| C031-01 | Manifest содержит ровно 14 ID в точном порядке spec §3 | Vitest deep equality | actual ordered array |
| C031-02 | Initial A и первый option — `sputnik-d` | Vitest + Playwright | selected value, opened hull |
| C031-03 | Sputnik D равен прежнему diesel identity и имеет Civilian S laser + bulk S | composition test | exact families/item IDs, negative E/solar assertions |
| C031-04 | Sputnik E сохранён и имеет electric powertrain + Civilian S laser + bulk S | composition test | exact families/item IDs, negative diesel assertions |
| C031-05 | Pony D сохраняет local variants/builtin laser | composition + provenance test | exact source identity |
| C031-06 | Ermak D/H/E и Titan D/H/E сохраняют industrial lasers и typed propulsion | table-driven test | six compiled rows |
| C031-07 | Volna M H сохраняет builtin cryotank | composition/resource test | builtin tank and finite H₂ capacity |
| C031-08 | Mir D/H/E — три runnable состава | table-driven test | propulsion/power/fuel assertions |
| C031-09 | Stealth reference literal; L отсутствует | digest/structural test | old equality; no size L |
| C031-10 | Все 14 preset validate/compile; D/H/E families реально стартуют в Worker | unit + native browser Worker | complete short results |
| C031-11 | Fresh `/4` workspace/form/run используют 250 K | unit + UI | conditions/spec/input all 250 |
| C031-12 | Explicit/imported 100 K, phase env и `/1|2|3` defaults не меняются | literal roundtrip + legacy regression | byte/deep equality |
| C031-13 | 0.3.0 fit/run/result открываются и переэкспортируются буквально | persistence/workspace tests | same serialized object/version |
| C031-14 | Selector/ownership работают на 1440/820/390 без overflow/errors | Playwright whole chain | selected IDs, actual Worker, captured/frozen unchanged |

## Task 1: Versioned catalog core and exact 0.3.1 assets

**Files:**

- Modify: `src/model/v3/types.ts`
- Modify: `src/fitting/catalog.ts`
- Modify: `src/fitting/editions.ts`
- Create: `src/fitting/data/hulls-0.3.1.json`
- Create: `src/fitting/data/items-0.3.1.json`
- Create: `src/fitting/data/presets-0.3.1.json`
- Create: `src/fitting/data/preset-manifest-0.3.1.json`
- Create: `tests/fitting/catalog-0.3.1.test.ts`
- Create: `tests/fitting/catalog-0.3.1-routing.test.ts`

**Interfaces:**

- Produces: `ShipModelCatalogVersion`, `CURRENT_SHIP_MODEL_CATALOG`, `isShipModelCatalogVersion(value)`, and fail-closed `loadCandidateCatalog(version)` / `getPresetFit(id, version)` for 0.3.0 and 0.3.1.
- Produces: `CandidateCatalogV3.presetOptions: readonly {id:string;label:string}[]`, 14 versioned presets and only S/M 0.3.1 assets.
- Consumes: unchanged 0.3.0 assets and exact old sources named in spec §3.

- [ ] **Step 1: Write the failing version, manifest and composition tests**

  Assert the supported version tuple is exactly `['ship-fitting-0.3.0','ship-fitting-0.3.1']`, current is 0.3.1, unknown versions fail closed, and 0.3.0 assets/digests are unchanged. Assert exact ordered IDs/labels, exactly 14 presets, no L size, every manifest ID resolves once, and every new preset is stamped 0.3.1.

- [ ] **Step 2: Add failing identity tests for all configurations**

  Table-test engine propulsion, battery/generator/solar/tank, laser class/count, cargo and special builtins. Add explicit negative assertions for Sputnik D/E, Pony local variants, Volna cryotank, Ermak/Titan industrial lasers, Mir D/H/E, and digest equality for `stealth-reference` against 0.3.0 apart from its catalog stamp.

- [ ] **Step 3: Run the catalog tests and confirm RED**

  Run: `npx vitest run tests/fitting/catalog-0.3.1-routing.test.ts tests/fitting/catalog-0.3.1.test.ts tests/fitting/catalog-0.3.0.test.ts`

  Expected: FAIL because 0.3.1 types/assets/routing are absent.

- [ ] **Step 4: Implement the version union and fail-closed loader**

  Replace the singleton version type with explicit previous/current literals. Route catalog and preset loading by the requested version; never fall back to current. Keep the old assets byte/content equivalent.

- [ ] **Step 5: Add versioned data with field-level provenance**

  Port exact legacy identities; add only V3-required candidate fields via the source order in spec §5. Do not edit 0.3.0/0.2.5 assets. Every hull/item/preset must pass existing material, gate, durability, signature, slot, power/fuel and origin validation.

- [ ] **Step 6: Wire the versioned manifest**

  Load the four 0.3.1 assets only for version 0.3.1. Keep the 0.3.0 preset names/order as a separate literal compatibility manifest.

- [ ] **Step 7: Run compile and source-fidelity tests**

  Run: `npx vitest run tests/fitting/catalog-0.3.1-routing.test.ts tests/fitting/catalog-0.3.1.test.ts tests/fitting/catalog-0.3.0.test.ts tests/fitting/source-fidelity.test.ts tests/model-v3/schema.test.ts`

  Expected: PASS.

- [ ] **Step 8: Commit**

  ```bash
  git add src/model/v3/types.ts src/fitting/catalog.ts src/fitting/editions.ts src/fitting/data/hulls-0.3.1.json src/fitting/data/items-0.3.1.json src/fitting/data/presets-0.3.1.json src/fitting/data/preset-manifest-0.3.1.json tests/fitting/catalog-0.3.1.test.ts tests/fitting/catalog-0.3.1-routing.test.ts
  git commit -m "feat(ship-model): add exact versioned catalog 0.3.1"
  ```

## Task 2: Version-owned workspace and literal persistence

**Files:**

- Modify: `src/model/v3/schema.ts`
- Modify: `src/io/fitting-json.ts`
- Modify: `src/io/fitting-result.ts`
- Modify: `src/app/ship-model-workspace.ts`
- Modify: `tests/model-v3/persistence.test.ts`

**Interfaces:**

- Consumes: Task 1 version union and both catalog loaders.
- Produces: document/fit-owned validation, compilation and slot operations; latest catalog only for new presets and legacy compilation.

- [ ] **Step 1: Write failing literal persistence and atomicity tests**

  Open 0.3.0 fit/run/result while current is 0.3.1 and assert every serialized field/version is retained. Open 0.3.1 equivalents. Assert mismatched/unknown nested catalog stamps fail without changing draft/result/frozen ownership.

- [ ] **Step 2: Run focused tests and confirm RED**

  Run: `npx vitest run tests/fitting/catalog-0.3.1-routing.test.ts tests/model-v3/persistence.test.ts tests/ui/ship-model-workspace-review.test.ts`

  Expected: FAIL because workspace and validators still assume one global catalog.

- [ ] **Step 3: Make V3 validators require one supported document version**

  Update fit/resolved/run/result checks so the outer stamp, resolved hull, fit and catalog agree. Preserve self-contained run/result snapshots and return field-addressed errors.

- [ ] **Step 4: Make workspace operations use the selected document's catalog**

  Resolve import validation, compile, slot replacement and scenario build from `fit.catalogVersion`. Keep a separate current catalog for new presets and legacy-fit compilation. A failed version resolution must leave the variant/result/frozen owner unchanged.

- [ ] **Step 5: Run focused tests and confirm GREEN**

  Run the command from Step 2.

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```bash
  git add src/model/v3/schema.ts src/io/fitting-json.ts src/io/fitting-result.ts src/app/ship-model-workspace.ts tests/model-v3/persistence.test.ts tests/fitting/catalog-0.3.1-routing.test.ts
  git commit -m "feat(ship-model): preserve version-owned documents"
  ```

## Task 3: Fresh background 250 K and diesel Sputnik default

**Files:**

- Create: `src/app/ship-model-defaults.ts`
- Modify: `src/scenarios/fitting.ts`
- Modify: `src/app/ship-model-workspace.ts`
- Modify: `src/app/fitting-ui/ship-model-conditions.ts`
- Modify: `src/app/ship-model.ts`
- Create: `tests/ui/ship-model-defaults.test.ts`
- Modify: `tests/ui/ship-model-workspace-review.test.ts`

**Interfaces:**

- Produces: `DEFAULT_SHIP_MODEL_BACKGROUND_K = 250` and `DEFAULT_SHIP_MODEL_PRESET_ID = 'sputnik-d'`.
- Consumes: Task 1 current catalog/`sputnik-d` preset and Task 2 version-owned workspace.

- [ ] **Step 1: Write failing boundary tests**

  Assert a new workspace A owns `sputnik-d`, conditions background is 250, generated run environment is 250 and fresh UI input/ownership copy show 250. Assert explicit builder `backgroundK:100`, imported run/result `100`, per-phase `100`, and legacy `makeMiningRun` default remain unchanged.

- [ ] **Step 2: Run focused tests and confirm RED**

  Run: `npx vitest run tests/ui/ship-model-defaults.test.ts tests/ui/ship-model-workspace-review.test.ts tests/fitting/scenarios.test.ts`

  Expected: FAIL on fresh default/initial preset only.

- [ ] **Step 3: Centralize fresh defaults**

  Use the named constants in workspace initialization, fresh builder fallback and form fallback. Do not apply defaults while importing or replaying a document. Initialize only variant A; copy-to-B copies explicit conditions, and an empty B receives a preset only through an explicit user choice.

- [ ] **Step 4: Run focused tests and confirm GREEN**

  Run: `npx vitest run tests/ui/ship-model-defaults.test.ts tests/ui/ship-model-workspace-review.test.ts tests/fitting/scenarios.test.ts`

  Expected: PASS.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/ship-model-defaults.ts src/scenarios/fitting.ts src/app/ship-model-workspace.ts src/app/fitting-ui/ship-model-conditions.ts src/app/ship-model.ts tests/ui/ship-model-defaults.test.ts tests/ui/ship-model-workspace-review.test.ts
  git commit -m "feat(ship-model): default fresh runs to Sputnik D at 250 K"
  ```

## Task 4: Versioned selector copy and ownership-safe UI

**Files:**

- Modify: `src/app/ship-model.ts`
- Modify: `src/app/fitting-ui/ship-model-ship-view.ts`
- Modify: `tests/ui/ship-model-fitting.test.ts`
- Modify: `tests/ui/ship-model-results.test.ts`
- Create: `tests/browser/ship-model-catalog-0.3.1.spec.ts`

**Interfaces:**

- Consumes: `catalog.presetOptions`, selected version-owned catalog and defaults from Tasks 1–3.
- Produces: exact 14-option selector, actual opened/footer version and unchanged captured ownership behavior.

- [ ] **Step 1: Write failing renderer and browser selector tests**

  Assert the exact 14 option values/texts, selected `sputnik-d` on entry, actual `fit.catalogVersion` in opened/footer copy, and absence of any Caravan/L option.

- [ ] **Step 2: Add failing ownership sequence**

  Start Sputnik D, pause/freeze A, switch or copy to B, choose Mir H and change background. Assert active/frozen A spec remains Sputnik D at captured background and next B is Mir H only. Invalid import/selection remains atomic.

- [ ] **Step 3: Run focused tests and confirm RED**

  Run: `npx vitest run tests/ui/ship-model-fitting.test.ts tests/ui/ship-model-results.test.ts`

  Run: `npx playwright test tests/browser/ship-model-catalog-0.3.1.spec.ts --project=chromium`

  Expected: FAIL on hard-coded three-name selector/default/version copy.

- [ ] **Step 4: Render from the selected versioned manifest**

  Delete the hand-written `presetNames` authority. Render only manifest rows whose preset exists. Show version from the actual fit/replay/result owner; preserve active locks and current draft/result/frozen separation.

- [ ] **Step 5: Run focused UI tests and confirm GREEN**

  Run the two commands from Step 3.

  Expected: PASS with no page/console errors and no horizontal overflow.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/ship-model.ts src/app/fitting-ui/ship-model-ship-view.ts tests/ui/ship-model-fitting.test.ts tests/ui/ship-model-results.test.ts tests/browser/ship-model-catalog-0.3.1.spec.ts
  git commit -m "feat(ui): expose the complete ship model catalog"
  ```

## Task 5: Actual Worker matrix, compatibility regression and delivery evidence

**Files:**

- Create: `tests/model-v3/catalog-0.3.1-worker.test.ts`
- Modify: `tests/browser/ship-model-worker.spec.ts`
- Modify: `tests/browser/ship-model-entry.spec.ts`
- Create: `docs/user/ship-model-catalog-0.3.1.md`
- Modify: `docs/INDEX.md`

**Interfaces:**

- Consumes: final 0.3.1 catalog/UI.
- Produces: C031-01–14 deterministic evidence and Russian user documentation.

- [ ] **Step 1: Write the failing Worker matrix**

  For all 14 presets, validate/compile and execute a bounded short run. Require actual D/H/E propulsion families to consume/deliver through their installed resources, finite telemetry/signatures and terminal `complete` or the explicitly expected physical stop — never validation failure or NaN.

- [ ] **Step 2: Extend browser whole chains at 1440/820/390**

  Verify initial Sputnik D/250 K, select representative Sputnik E, Ermak H, Titan D, Mir H and stealth, start actual Worker, save/reopen fit/run/result, reopen 0.3.0 literals, and check active/frozen ownership, controls ≥44 px, no overflow/page errors.

- [ ] **Step 3: Run targeted Worker/browser checks**

  Run: `npx vitest run tests/model-v3/catalog-0.3.1-worker.test.ts tests/fitting/catalog-0.3.1-routing.test.ts tests/ui/ship-model-defaults.test.ts`

  Run: `npx playwright test tests/browser/ship-model-catalog-0.3.1.spec.ts tests/browser/ship-model-worker.spec.ts tests/browser/ship-model-entry.spec.ts --project=chromium`

  Expected: PASS.

- [ ] **Step 4: Update Russian user documentation**

  Document the fourteen configurations, D/H/E notation, default Sputnik D, fresh 250 K boundary, literal 0.3.0 behavior, no L scope and future name `Северин Караван`. Do not claim server/native/physical LAN/playtest if not executed.

- [ ] **Step 5: Run full deterministic verification**

  Run: `npm run typecheck`

  Run: `npm test`

  Run: `npm run test:browser`

  Run: `npm run build`

  Run: `.agents/project/verify.sh`

  Expected: all mandatory checks PASS; only an already documented inherited optional skip may remain.

- [ ] **Step 6: Commit delivery evidence**

  ```bash
  git add tests/model-v3/catalog-0.3.1-worker.test.ts tests/browser/ship-model-worker.spec.ts tests/browser/ship-model-entry.spec.ts docs/user/ship-model-catalog-0.3.1.md docs/INDEX.md
  git commit -m "test(ship-model): verify catalog 0.3.1 end to end"
  ```

## PRODUCT gates and rollback

1. PM commits and pushes spec + plan to a stacked Draft PR.
2. Independent Plan Reviewer checks this exact plan/contract and returns
   `PLAN_READY` before runtime changes.
3. One primary Developer executes Tasks 1–5 using TDD.
4. Independent QA verifies C031-01–14 against the candidate SHA.
5. One scoped Code Reviewer receives changed paths, named risks and fingerprints.
6. Blocker fixes receive only affected QA and scoped re-review inside the budget.
7. PM runs fresh deterministic checks, publishes final acceptance and only then
   replaces preview `4197` with an immutable candidate artifact.
8. Rollback restores preview `80ce337`; 0.3.0 data stay available throughout.
9. Operator alone decides merge.

