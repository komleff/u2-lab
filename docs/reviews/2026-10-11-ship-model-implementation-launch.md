# Начало реализации ship-model v0.1

Дата: 2026-10-11. Роль: Project Manager, Codex / GPT-6.

Оператор одобрил план v1.2 и поручил реализацию. Выбран основной Developer:
GPT-6.1 Sol, effort `xhigh`. Режим PRODUCT; последовательность D0 → T1 → T2 →
T3 → T4 → T5 → T6 соответствует утверждённому плану.

## Входной контракт

- План: `docs/plans/2026-10-10-ship-model-v0.1-update.md`, v1.2 на
  `692385dfae5232b6e2ab91d22d7431e144194a1c`.
- Независимый affected [Plan Review](https://github.com/komleff/u2-lab/pull/21#issuecomment-6100571178):
  `PLAN_READY`, 0 BLOCKER, 0 ADVISORY, PRODUCT GAP отсутствует.
- Fingerprint review:
  `95d7430f13b91ba9650fbdf2a4ec016bb9b842031435eafd5b095f85c1a2b314`.
- Продуктовые источники: GDD/spec v0.11; позднейшие решения §1 и thermal matrix
  плана имеют приоритет над прежними thermal owner-строками и handoff.
- Frozen U2 PR #842: `5140593658bd315951129ffddd0ded240845dc2f`;
  PR #848: `db32125f769d12d4307ed88356a0907e2f4e148c`.
- GitHub PR verify исходного коммита: SUCCESS,
  [run 38073818092](https://github.com/komleff/u2-lab/actions/runs/38073818092).

Ветка реализации `feat/ship-model-v0.1-runtime` создана поверх PR #21 в существующем
изолированном checkout. Текст утверждённого плана сохранён без изменений. Эта запись
фиксирует запуск, а не новый Plan Review или runtime acceptance.

## Canonical work items

Beads — единственный tracker. Из primary checkout через bd API созданы новые дети
существующего epic `ulab-9aa`; исходные девять IDs сохранены.

| Work item | Beads ID |
|---|---|
| D0: frozen contract и conformance vectors | `ulab-9aa.10` |
| T1: schema/catalog/state | `ulab-9aa.11` |
| T2: power/thermal controller | `ulab-9aa.12` |
| T3: buffer/surfaces/TI | `ulab-9aa.13` |
| T4: durability/persistence | `ulab-9aa.14` |
| T5: Masking/signatures/UI | `ulab-9aa.15` |
| T6: experiments/QA/review | `ulab-9aa.16` |

Зависимости заданы последовательной цепью. Эта таблица — адреса задач, не их статус.
Публикация snapshot в `origin/beads-backup` выполнена обычным sync helper без overrides.

## Проверки и границы поставки

Каждый шаг начинается с адресных RED tests и получает GREEN/self-review/commit evidence.
Полный кандидат проходит `.agents/project/verify.sh`, затем независимую QA по SM-01–14
и один scoped Code Review по явному Review Contract. Existing Plan Review составляет
первый independent verifier launch PRODUCT budget; generic per-task review loops не
добавляются к проектному пайплайну.

SM-14 разделяет экспортированный Lab conformance contract и фактический U2 server runner:
server parity остаётся NOT RUN до отдельного U2 work item. Physical second LAN device,
native activation, playtest/balance, bootstrap/base acceptance и operator merge сохраняют
свои обязательные границы. Новые численные ТТХ остаются явно маркированными кандидатами.
До QA новая модель доступна только через явный experimental toggle.
