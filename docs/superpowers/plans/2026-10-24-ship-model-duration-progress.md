# Ship Model Duration and Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Вернуть fresh `/4` default `3600 с`, дать живую индикацию прогресса и убрать покадровую перерисовку, сохранив графики и управление.

**Architecture:** Canonical fresh default задаётся одним экспортируемым значением и используется workspace, builder и UI fallback. UI продолжает принимать те же Worker snapshots, но Worker считает bounded packages до 2000 шагов и существующего wall budget 80 ms; progress и графики рендерятся из одного принятого snapshot.

**Tech Stack:** TypeScript, Vite Worker, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-24-ship-model-duration-progress-design.md`

## Global Constraints

- Fresh ordinary `/4` default: ровно `3600` model seconds.
- Импортированные duration/spec/result/checkpoint не переписывать.
- Worker protocol, physics, step size, retention и catalog/TTX не менять.
- Графики остаются live; Pause/Cancel обрабатываются между пакетами.
- Один основной Developer; PM не реализует runtime.

## Review Focus

- Fresh workspace и прямой builder без conditions дают одинаковые `3600`.
- Explicit/imported duration не заменяется default.
- Progress не расходится с графиками: оба читают один accepted snapshot.
- Batching не ломает Pause/Cancel/checkpoint ownership.
- Ordinary v0.1 и governor v0.2 используют bounded batching, но Step остаётся ровно одним шагом.

---

### Task 1: Default, progress and bounded batching

**Files:**
- Create: `src/app/ship-model-runtime.ts`
- Modify: `src/scenarios/fitting.ts`
- Modify: `src/app/ship-model-workspace.ts`
- Modify: `src/app/fitting-ui/ship-model-conditions.ts`
- Modify: `src/app/ship-model.ts`
- Modify: `src/app/fitting.css`
- Modify: `tests/ui/ship-model-defaults.test.ts`
- Modify: `tests/browser/ship-model-governor-v03.spec.ts`
- Test: `tests/browser/ship-model-duration-progress.spec.ts`

**Interfaces:**
- Produces: `DEFAULT_SHIP_MODEL_DURATION_SECONDS = 3600` and `SHIP_MODEL_RUN_CHUNK_STEPS = 2000` from `src/app/ship-model-runtime.ts`.
- Consumes: existing `WorkerController` wall budget `80 ms`, unchanged chunk/snapshot/ACK protocol.

- [ ] **Step 1: Write failing default tests**

  In `tests/ui/ship-model-defaults.test.ts`, assert that direct `makeShipModelMiningRun(..., {})`, fresh `ShipModelWorkspace.prepare()` and the workspace conditions all resolve to literal `3600`; assert explicit `durationSeconds: 17` remains `17`.

- [ ] **Step 2: Write failing browser behavior tests**

  Add `tests/browser/ship-model-duration-progress.spec.ts`:
  - fresh `/4` shows `#sm-duration = 3600` and exported ordinary spec has `durationSeconds: 3600`;
  - a long real run exposes progressbar `#sm-progress`, visible `elapsed / total / percent`, reaches positive progress, keeps Pause enabled and pauses without error;
  - a fresh default 3600-second run completes within Playwright timeout 20 seconds and leaves graphs/live result visible.
  Extend the existing Worker command observer to prove ordinary and governor Start/checkpoint request a batch greater than one while Step still advances exactly one model step.

- [ ] **Step 3: Run RED**

  Run: `npx vitest run tests/ui/ship-model-defaults.test.ts && npx playwright test tests/browser/ship-model-duration-progress.spec.ts tests/browser/ship-model-governor-v03.spec.ts`

  Expected: failures name the old `60`, absent `#sm-progress`, and `maxSteps: 1`; no syntax/setup error.

- [ ] **Step 4: Implement the minimal fix**

  Add the two constants, replace only fresh `/4` fallbacks, render progress from accepted `r` and captured `active.spec`, add minimal responsive styling, and use `SHIP_MODEL_RUN_CHUNK_STEPS` only for Start/checkpoint. Do not alter `send('step')`, WorkerController, protocol or model code.

- [ ] **Step 5: Run GREEN and affected regression**

  Run: `npx vitest run tests/ui/ship-model-defaults.test.ts tests/ui/ship-model-governor-v03.test.ts && npx playwright test tests/browser/ship-model-duration-progress.spec.ts tests/browser/ship-model-governor-v03.spec.ts tests/browser/ship-model-ownership.spec.ts tests/browser/ship-model-acceptance.spec.ts`

  Expected: all PASS, with one visible intermediate progress sample and default 3600 completion under 20 seconds.

- [ ] **Step 6: Verify project and commit**

  Run: `npm run typecheck && npm run build && .agents/project/verify.sh`

  Expected: EXIT 0; existing inherited screenshot skip may remain. Then commit code, tests, spec and plan in one bounded hotfix commit.
