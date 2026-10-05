---
title: "Claude Design UI — scoped Code Review Contract"
status: active
version: "1.0"
date: 2026-10-06
---
# Цель и acceptance surface

Проверить реализацию принятого Claude Design v2.1 по UI01–18, без изменения численной
модели. Источники: accepted overlay, UX v2.1/Main/Lab/mobile, whole UI VC и final exact
runtime/asset/test binding. Runtime source SHA: ab8353d91d1ce3584549b780e66699118e575c56. PM metadata SHA сверяется при final handshake.
Полный content binding: docs/verification/claude-design-ui-runtime-binding.json.
Immutable archive SHA256: 7131c5006194ab952e68f19a2ae5e85e88f65143c55f6d9e3b26d0e424c39cba.
Dist digest: aa710b9b9f0c201799368ec40e4bff1876c3492e1c613706668ec138fbeeeb28.

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
- `tests/browser/claude-ui.spec.ts`
- `tests/browser/fitting.spec.ts`
- `tests/ui/presentation.test.ts`
- `tests/ui/telemetry.test.ts`
- `tests/ui/workspace.test.ts`

Базовые src/model, runner, fitting, io, scenarios и прежние Legacy owners входят в
binding для проверки эквивалентности, а не повторного полного ревью. Developer
independently reports85protected base blobs; PM actual source verification confirms
all85. Предыдущий физический12h QA r4 остаётся inherited proof unchanged core.
