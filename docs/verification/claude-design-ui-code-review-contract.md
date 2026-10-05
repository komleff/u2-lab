---
title: "Claude Design UI — scoped Code Review Contract"
status: active
version: "1.3"
date: 2026-10-06
---
# Цель и acceptance surface

Проверить реализацию принятого Claude Design v2.1 по UI01–18, без изменения численной
модели. Источники: accepted overlay, UX v2.1/Main/Lab/mobile, whole UI VC и final exact
runtime/asset/test binding. Runtime source SHA: 30a1c9b0953bf61723cd8a9deb570044e1f26862. PM metadata SHA сверяется при final handshake.
Полный content binding: docs/verification/claude-design-ui-runtime-binding.json.
Immutable archive SHA256: c6e89e0a38bcb0ca8cabe4897aef92d5faef0dfc69ab44a5f3191e0b6cd85ef2.
Dist digest: 59bb555e2c59875be0d0242d2c382c94bacc59e3bfaf059e2b59cb78cc255beb.

# Scope

IN: только изменённые UI/controller/style/local asset/test paths из final binding,
связь с существующими validators/Worker/metrics/IO. Один scoped Review, после independent QA.
OUT: новая физика/каталог/schema/protocol, динамическая добыча/полёт/станционная заправка,
рынок/детекция, native/base bootstrap/Pages/main merge, cosmetic advisory implementation.

# Named risks

1. Variant/result/run ownership: один global test, immutable RunSpec, late ACK/chunks,
   stale revision, navigation without controller recreation, distinct frozen A. Repeated
   Start before first chunk must not project a prior result under a new active runId;
   current conditions use active immutable RunSpec while prior variant history is kept.
2. Atomic swap/batch/import: all-or-nothing fit/revision/result/frozen snapshot,
   builtin readonly and no removable-slot consumption, explicit compatibility refusal.
3. Honest measurement: numerical oracle identity, actual interval/units/undefined values,
   retained/dropped trace boundaries, no DEMO fallback or new overall efficiency score.
   Supported long retained traces must render without argument-count RangeError; finite
   extrema, negative/empty/hidden channels and hidden-Lab render preserve measurement.
4. Reachability: ordinary non-loopback HTTP secure=false Start/control/IO,
   root/prefix same-origin assets, mobile390px critical actions, keyboard dialog. Full
   previous-run captions wrap inside the viewport and native history export works.
5. Regression: numerical/catalog/runner/scenarios/IO/legacy exact source equivalence,
   current full deterministic guard and artifact matching tested source.
6. Instance measurement identity: replaced item in the same slot must not inherit prior
   item telemetry; unchanged stale history keeps its real revision/time window.
7. Accepted UI controls: source sorts/whole-fit nominal projection, mobile Compare cards,
   A/B visibility selectors, ring group-gap budget and breakpoint layouts remain reachable.
8. Missing event metadata: environment/instance filter affordances disclose unavailable
   payload fields, preserve actual aggregate propulsionShortfall and do not fabricate
   events, causes, times or attribution. The unchanged model attribution gap is deferred.
9. Rejected import readability and native touch geometry: preserve full literal error
   text/newlines while long paths wrap inside the visual viewport; actual isMobile +
   hasTouch export after refusal remains reachable with fit/result/frozen A unchanged.

# Findings and evidence

BLOCKER только AC/regression/build/correctness/security/data-loss/mandatory runtime invariant.
ADVISORY не расширяет scope. Указать actual role/model, own commands vs inherited QA,
exact reviewed paths/blob/full contract fingerprint, evidence, not-tested surface.
После metadata source-equivalent reports сохраняются; изменение path требует affected scope.

# Изменённые paths

- `public/assets/README.md`
- `public/assets/fonts/IBM-Plex-Mono-OFL.txt`
- `public/assets/fonts/IBMPlexMono-Medium.ttf`
- `public/assets/fonts/IBMPlexMono-Regular.ttf`
- `public/assets/fonts/PT-Sans-Narrow-OFL.txt`
- `public/assets/fonts/PTSansNarrow-Bold.ttf`
- `public/assets/titan-640.webp`
- `src/app/fitting-ui/compare-view.ts`
- `src/app/fitting-ui/dom.ts`
- `src/app/fitting-ui/instance-details.ts`
- `src/app/fitting-ui/lab-channels.ts`
- `src/app/fitting-ui/lab-view.ts`
- `src/app/fitting-ui/presentation.ts`
- `src/app/fitting-ui/ship-view.ts`
- `src/app/fitting-ui/swap-dialog.ts`
- `src/app/fitting-ui/telemetry.ts`
- `src/app/fitting-workspace.ts`
- `src/app/fitting.css`
- `src/app/fitting.ts`
- `tests/browser/claude-ui-fixes.spec.ts`
- `tests/browser/claude-ui-review.spec.ts`
- `tests/browser/claude-ui.spec.ts`
- `tests/browser/fitting.spec.ts`
- `tests/ui/code-review.test.ts`
- `tests/ui/presentation.test.ts`
- `tests/ui/qa-fixes.test.ts`
- `tests/ui/telemetry.test.ts`
- `tests/ui/workspace.test.ts`

Базовые src/model, runner, fitting, io, scenarios и прежние Legacy owners входят в
binding для проверки эквивалентности, а не повторного полного ревью. Developer
independently reports85protected base blobs; PM actual source verification confirms
all85. Предыдущий физический12h QA r4 остаётся inherited proof unchanged core.

Initial independent QA r1:54 PASS/17 FAIL/1 NOT RUN; D01–D11 repaired by sole
Developer. Affected QA r2 closed D01–D11 counterexamples but found D12 under UI16-03/UI18-02/UI18-03: long rejected-import path expanded the true-mobile layout. One-property CSS fix and durable regression follow; review begins after targeted D12 affected QA on the exact final artifact. Examine
the 11-path fix delta as part of the whole new UI surface; prior numerical review
is source-equivalent carryover, not a new review of model/Worker. UI13-02 unavailable
named attribution remains explicitly deferred by the operator scope.

First scoped UI Review r1 (caa8f3eb…) found CR-UI-B1 long-trace render exception and
CR-UI-B2 prior-run measurement projected as current before first chunk. Sole Developer
fixes only these two blockers. Next review is scoped to changed blobs/these risks and
necessary regression; unchanged remainder of26-path initial review carries by exact
content equivalence. No advisory implementation or new review program.

Scoped closure includes foreign selected-variant boundaries: locked Lab scalars and
instance-detail callbacks use actual active immutable spec before the first matching
chunk; selected next-fit conditions, saved result and frozen A remain intact.
