# U2 Lab — project authority and agent bootstrap

Product authority: Dmitriy Komlev / komleff, оператор проекта.
Принятые решения оператора определяют WHAT; PM планирует HOW и делегирует код Developer.

Первое чтение: `.memory-bank/activeContext.md`, `.memory-bank/progress.md`, `docs/INDEX.md`,
затем ровно нужный current owner. Источники U2 выбираются по его `docs/INDEX.md` и
`docs/architecture/ADR-INDEX.md`; поиск по ключевым словам не устанавливает authority.

Bootstrap pipeline source: `komleff/overgate`, `v4.0.0-rc.1`,
`633937250fa8f47b49f928c1d8781ab17fe8c8e3`. До установки роли читаются в этом frozen
trusted Git checkout. После установки: `.agents/PM_ROLE.md`, `.agents/AGENT_ROLES.md`,
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
После установки Beads использовать только bd API из основного checkout; синхронизация —
`scripts/bd-sync-restore.sh` / `scripts/bd-sync-export.sh` и `origin/beads-backup`.
Не писать Dolt или JSONL руками и не считать локальный JSONL авторитетным.
План описывает последовательность и AC, не подменяет Beads статусом markdown checkbox.

Язык пользовательских документов — русский; paths и identifiers — английские.
