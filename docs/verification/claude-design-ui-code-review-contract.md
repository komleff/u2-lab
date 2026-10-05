---
title: "Claude Design UI — scoped Code Review Contract"
status: active
version: "1.1"
date: 2026-10-06
---
# Цель и acceptance surface

Проверить реализацию принятого Claude Design v2.1 по UI01–18, без изменения численной
модели. Источники: accepted overlay, UX v2.1/Main/Lab/mobile, whole UI VC и final exact
runtime/asset/test binding. Runtime source SHA: ff01dfa1b2411aa472bb7500babfde8277694f35. PM metadata SHA сверяется при final handshake.
Полный content binding: docs/verification/claude-design-ui-runtime-binding.json.
Immutable archive SHA256: 6d55860893fe0cccc63242df33aacc37d69fc7bd2f5afe875ac1311894508ab5.
Dist digest: 55ee3288d859bff990b40cbc91a269d744655086465b183cea365cb1058b2d55.

# Scope

IN: только изменённые UI/controller/style/local asset/test paths из final binding,
связь с существующими validators/Worker/metrics/IO. Один scoped Review, после independent QA.
OUT: новая физика/каталог/schema/protocol, динамическая добыча/полёт/станционная заправка,
рынок/детекция, native/base bootstrap/Pages/main merge, cosmetic advisory implementation.

# Named risks

1. Variant/result/run ownership: один global test, immutable RunSpec, late ACK/chunks,
   stale revision, navigation without controller recreation, distinct frozen A.
2. Atomic swap/batch/import: all-or-nothing fit/revision/result/frozen snapshot,
   builtin readonly and no removable-slot consumption, explicit compatibility refusal.
3. Honest measurement: numerical oracle identity, actual interval/units/undefined values,
   retained/dropped trace boundaries, no DEMO fallback or new overall efficiency score.
4. Reachability: ordinary non-loopback HTTP secure=false Start/control/IO,
   root/prefix same-origin assets, mobile390px critical actions, keyboard dialog.
5. Regression: numerical/catalog/runner/scenarios/IO/legacy exact source equivalence,
   current full deterministic guard and artifact matching tested source.
6. Instance measurement identity: replaced item in the same slot must not inherit prior
   item telemetry; unchanged stale history keeps its real revision/time window.
7. Accepted UI controls: source sorts/whole-fit nominal projection, mobile Compare cards,
   A/B visibility selectors, ring group-gap budget and breakpoint layouts remain reachable.
8. Missing event metadata: environment/instance filter affordances disclose unavailable
   payload fields, preserve actual aggregate propulsionShortfall and do not fabricate
   events, causes, times or attribution. The unchanged model attribution gap is deferred.

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
- `tests/browser/claude-ui.spec.ts`
- `tests/browser/fitting.spec.ts`
- `tests/ui/presentation.test.ts`
- `tests/ui/qa-fixes.test.ts`
- `tests/ui/telemetry.test.ts`
- `tests/ui/workspace.test.ts`

Базовые src/model, runner, fitting, io, scenarios и прежние Legacy owners входят в
binding для проверки эквивалентности, а не повторного полного ревью. Developer
independently reports85protected base blobs; PM actual source verification confirms
all85. Предыдущий физический12h QA r4 остаётся inherited proof unchanged core.

Initial independent QA r1:54 PASS/17 FAIL/1 NOT RUN; D01–D11 repaired by sole
Developer. Review begins after affected QA on this exact fixed artifact. Examine
the 11-path fix delta as part of the whole new UI surface; prior numerical review
is source-equivalent carryover, not a new review of model/Worker. UI13-02 unavailable
named attribution remains explicitly deferred by the operator scope.
