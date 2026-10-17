# Verification Contract — OverGate bootstrap

Mode: CRITICAL. Named risk: установка governance/runtime guards в новый проект;
ложный PASS hooks/Beads, повреждение authority или self-certification установщика.
Budget: 6 independent verifier launches. Первый install review ещё не запущен.
Trusted source: komleff/overgate v4.0.0-rc.1,
`633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
Trusted instructions: frozen `.agents/INSTALL.md`, PM/RV roles, ADR §§3.28–3.32.
Project authority: AGENTS.md / оператор. Product runtime OUT OF SCOPE.

| AC | Expected / error / edge | Verification |
|---|---|---|
| B1 | Реальный public komleff/u2-lab, рабочая ветка и один target Draft PR с plan/contract до managed copy | GitHub metadata + draft/base/head + tracked plan |
| B2 | Clean Git source, exact RC SHA, explicit inventory. Installer plan не меняет target; missing entry/source drift/conflict блокирует запись | Trusted installer plan, source status/SHA, before/after hashes, reference evidence |
| B3 | Install inventory опубликован с SHA256; independent PLAN_READY привязан к exact bytes и evidence того же фактического PR | PM validates report origin/paths/fingerprint; approval JSON; no fabricated URL/self-approval |
| B4 | Apply переносит managed .agents/skills/adapters/closure строго inventory; AGENTS/project overrides/context сохраняются, project verify заполнен. Backups ignored, state tracked | Installer apply + check-reference.py + manifest path/hash review + git status |
| B5 | Fresh Memory Bank описывает U2 Lab, не OverGate reference history. Six delivery role owners и PM role доступны, product authority остаётся оператором | Current context/role route smoke, exact managed role hashes |
| B6 | Local bd 1.0.2 функционален в primary checkout, fresh prefix ulab; task graph имеет dependencies/AC. export.auto=false, no Dolt remote; cross-machine source origin/beads-backup, generated only by helper | bd ready/show/export; export/restore/re-export helper smoke after remote; no handwritten snapshot |
| B7 | .agents/project/verify.sh выполняет реальные checks этапа, не unconfigured template. Source/reference deterministic tests PASS; runtime hooks smoke имеет честный PASS/FAIL/NOT RUN | structural/reference + bash project verify + live adapter evidence on actual runtime |
| B8 | QA → scoped review → current checks → one trusted finalize; rollback journal сохраняет managed originals и project state | QA/review reports + fingerprints/current SHA; install rollback fixtures; operator merge |

## Declared execution boundary

Этот hosted Work runtime не предоставляет загрузку project hooks как Claude/Codex CLI.
Static wiring/guard fixtures не доказывают actual activation. До фактического smoke native
adapter: NOT RUN, без заявления activation PASS. PM не оформляет known risk как принятый;
если это препятствует final acceptance, оператор решает по фактическому evidence.

Отсутствие repository/PR access сейчас — blocker B1/B3, не accepted risk и не повод
подставлять URLs. Beads local preparation не является cross-machine synchronization PASS.

## Scoped Code Review

IN: install state/inventory/hashes, preserved project authority/context/verification,
Beads config/task graph, B1–B8, actual hooks integration evidence, rollback/publication paths.
OUT: redesign OverGate policy, lab runtime/physics, unrelated U2 documents/catalog, extra reviewer swarm.
Report fields/triage/fingerprint follow trusted RV_ROLE and ADR 3.28/3.29.
Installer governance не сертифицируется новой installed версией; QA/review/finalize используют
prior trusted frozen source и bound plan/contract.
