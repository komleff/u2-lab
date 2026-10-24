# U2 Lab — project authority and agent bootstrap

Product authority: Dmitriy Komlev / komleff, оператор проекта.
Принятые решения оператора определяют WHAT; PM планирует HOW и делегирует код Developer.

Первое чтение: `.memory-bank/activeContext.md`, `.memory-bank/progress.md`, `docs/INDEX.md`,
затем ровно нужный current owner. Источники U2 выбираются по его `docs/INDEX.md` и
`docs/architecture/ADR-INDEX.md`; поиск по ключевым словам не устанавливает authority.

Pipeline: `komleff/overgate` `v4.0.0-rc.3` `b830d5ed7ed31e597b45f7f3c18b8fb6baad6b29`
(bootstrap — `v4.0.0-rc.1` `633937250fa8f47b49f928c1d8781ab17fe8c8e3`). До установки роли
читаются в frozen trusted Git checkout источника. После установки: `.agents/PM_ROLE.md`, `.agents/AGENT_ROLES.md`,
`.agents/PIPELINE.md`, `.agents/PIPELINE_ADR.md §§3.28–3.32`, `.agents/SKILLS.md`.
Не копировать managed payload до реального Draft PR и независимого install PLAN_READY.

- Работа в рабочей ветке. ИИ не обновляет main/master напрямую и не merge/auto-merge.
- PM не реализует продуктовый runtime; один основной Developer на work item.
- PRODUCT: independent Plan Review → PLAN_READY → DEV → QA → scoped Code Review → finalize.
- Verifier запускается только по адресу AC / FAIL / named risk; reports с actual role/model,
  reviewed paths и fingerprint. Merge выполняет оператор.
- Не обходить guards, не читать и не публиковать credentials, `.env*` или secrets.
- При нерешённом WHAT — PRODUCT GAP оператору; отсутствующие ТТХ не придумывать как канон.
- Не включать обнаружение в текущую приёмку; не менять принятые правила U2 молча.
- Project verification: `.agents/project/verify.sh` после этапа установки; до этого —
  `git diff --check` и сверка документов/источников. Runtime tests пока NOT RUN.

Beads — единственный task tracker, Memory Bank — контекст, Git/PR — документы и evidence.
Доступ по классу окружения (ADR-0042, embedded и server поддержаны OverGate, `.claude/rules/beads.md`):
локальный агент в основном checkout или git-worktree читает и пишет только через
`bash scripts/bd-wt.sh <cmd>` (allowlist подкоманд); sync/apply-скрипты не запускает.
Cloud — read-snapshot/write-intents: `bash scripts/bd-read.sh` и append-only `.bd-intents/*.jsonl`.
В hosted Work не запускать bd/Dolt, applier wrapper, export и не пушить beads-backup.
Single-writer: физическая база одна — в основном checkout; второй clone/машина не пишет
параллельно. Синхронизация — только оператор: `bash scripts/bd-sync-restore.sh` /
`bash scripts/bd-sync-export.sh` и `origin/beads-backup`, в тишине и export-first.
Не писать Dolt или JSONL руками и не считать локальный JSONL авторитетным.
План описывает последовательность и AC, не подменяет Beads статусом markdown checkbox.
Generated checkpoint — только recovery input; исходные девять IDs сохраняются без правки.
Первый empty-remote import/export: `docs/guides/operator-bootstrap.md`, внешний exact frozen
OverGate helper. Project applier — только после operator review/merge в trusted main.
Pending intent не canonical status. Не применять force/skip/trust override envs.
Cloud amendment `docs/plans/2026-10-05-cloud-execution.md` получил независимый PLAN_READY:
после deterministic cloud checks разрешена обратимая stacked T1–T6 preparation; B0/B6/B8,
полная bootstrap/product QA/review/finalize и operator merge остаются обязательными.
Product PR merge-ineligible, пока base bootstrap не принят; P1–P14 не изменены.

Язык пользовательских документов — русский; paths и identifiers — английские.
