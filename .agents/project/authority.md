# Project-owned authority

Оператор: Dmitriy Komlev / komleff.
Продуктовый контракт: `docs/product/power-heat-lab-v0.1.md`.
Current U2 source route: `docs/architecture/source-authority.md`.
PM/Planner/Developer не принимают отсутствующее продуктовое решение.
Параметры лаборатории имеют provenance и статус; эксперимент не становится каноном U2.
Этот project-owned файл сохраняется установщиком OverGate.

Cloud execution: `docs/plans/2026-10-05-cloud-execution.md`, C1–C6; independent PLAN_READY
в `docs/reviews/2026-10-05-cloud-plan-review.md`. Hosted Work читает snapshot и дописывает
pending intents; только primary checkout оператора мутирует Beads. Recovery checkpoint
не источник remote authority. First export — trusted внешний frozen OverGate; новый
project applier — после review/merge. Route: `.bd-intents/README.md`,
`docs/guides/operator-bootstrap.md`, `docs/verification/cloud-tooling-provenance.json`.
Reversible stacked T1–T6 preparation не закрывает B0/B6/B8 и не снимает merge gates/P1–P14.
