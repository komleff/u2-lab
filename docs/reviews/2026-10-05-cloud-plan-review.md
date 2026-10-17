# PLAN REVIEW — cloud execution amendment

Verdict: **PLAN_READY**. Active BLOCKER: **0**; ADVISORY: **0** в заданном scope.
Это готовность плана C1–C6 к реализации, не завершение bootstrap и не разрешение merge.

- Mode: PLAN_REVIEW.
- Role: independent OverGate Reviewer (RV), cloud amendment; исторический CRITICAL launch 3/6 по заданию PM.
- Model: requested/selected `gpt-6.1-sol`, reasoning high, по metadata запуска PM; фактический provider deployment ID среда не раскрыла.
- Commit: `71799a0e35ab2a83f108c58fe1879d9f4d09ac42` (`bootstrap/overgate-v4`).
- Source plan / Verification Contract: `docs/plans/2026-10-05-cloud-execution.md`, C1–C6 и concluding mode/rollback.
- Trusted roles/INSTALL/ADR: frozen OverGate `633937250fa8f47b49f928c1d8781ab17fe8c8e3`; installed tooling не используется для self-certification.
- Content-Fingerprint: `e6285c7d55351c83b6b307a81f53c9cd1a0a105f3763b5f533aab6a152963eb2`.
- Contract SHA256: `e3846bf44843a6b7d957b53745eff37217ac7f0ceedc4c41bb2f422d852c547a`.

## Вывод по контракту

| AC | Оценка плана | Основание |
|---|---|---|
| C1 | Проверяем и безопасно ограничен | Hosted checkout больше не writer; только snapshot readers и append-only pending intents, без публикации beads-backup или нового local bd mutation. Project authority/context/rules должны закрепить эту границу. |
| C2 | Проверяем | Пinned applier переносится с narrow project adaptation, сохранением whole-queue validation, argv execution, source-of-truth idempotency, refs/handles и существующих guards. Negative fixtures и повторное применение stub отличают отказ до мутации от успешного apply. |
| C3 | Проверяем | Девять bd-generated records сохранены как неизменный recovery input; первичный импорт сохраняет IDs, bootstrap queue содержит notes, не duplicate create. Hash и audit данных позволяют обнаружить drift. |
| C4 | Проверяем | Managed inventory исключён из изменения; project-owned additions и source provenance проверяются blob comparisons и существующими checks. |
| C5 | Проверяем | Первый export выполняется из primary clone через внешний frozen OverGate helper; новый applier запускается после operator review/merge trusted tooling. Это устраняет круговую зависимость trust-first-export. Actual operator run остаётся NOT RUN. |
| C6 | Допустимая HOW-поправка | Независимый PLAN_READY и deterministic cloud checks предшествуют stacked implementation. B0/B6/B8 не закрываются; product PR merge-ineligible до приёмки base. WHAT/P1–P14 и продуктовый QA/review сохранены. |

Исходный launch-план и context запрещали runtime до принятого B0. Поправка явно заменяет
только порядок обратимой engineering preparation по новому поручению оператора продолжать
автономно. Она не снимает dependencies с canonical Beads и не объявляет outstanding B6 PASS.
Существующий bootstrap Code Review остаётся CHANGES_REQUESTED: actual export/auth FAIL,
restore/re-export, native activation, finalize и operator merge не доказаны. Новый PLAN_READY
не заменяет это evidence и не принимает риск за оператора.

C2 «valid queue dry-run does not invoke bd» проверяется на движке с fixture index/stub;
upstream shell wrapper читает live `bd export` до engine, а engine может читать comments для
существующей comment-заявки. Это не hosted запуск wrapper: cloud его не выполняет, operator
wrapper имеет отдельную primary/trusted boundary. Evidence реализации должно назвать уровень
fixture и не выдать wrapper за offline/no-bd интерфейс. Whole-queue validation означает ноль
мутаций при validation failure; сбой исполнения может оставить часть операций, для чего
сохраняются database markers/idempotent retry. План не требует transaction rollback живой БД.

Первичная recovery процедура относится к initial empty-remote setup в primary clone, а не к
безусловному импорту поверх существующей операторской БД. Сохранение last-seen/drop/divergence
и trusted-tooling guards является обязательным требованием плана. Рассмотренный frozen export
helper поддерживает first absent-remote export без force/drop override. Фактические команды,
fixtures и implementation adaptation проверяются последующим scoped code review/QA.

Rollback ограничен project additions/authority amendment с сохранением generated checkpoint;
он не восстанавливает и не перезаписывает live operator database. Меньший runtime diff уже
обеспечен reuse pinned U2 applier вместо нового sync backend или изменения OverGate inventory.

## Reviewed-Paths и canonical binding

Ниже explicit candidate path set. Fingerprint: SHA256 от строк `path SP Git-blob-SHA1 LF`
в LC_ALL=C порядке, затем exact UTF-8 bytes contract ниже, включая финальный LF, без fences.
Report исключён. Это scoped binding C1–C6, не fingerprint полной bootstrap/product acceptance.

| Reviewed-Path | Candidate Git blob SHA1 |
|---|---|
| `.claude/rules/beads.md` | `5fecd9695535bfd6e6e37ffda09b6a7953571087` |
| `.memory-bank/activeContext.md` | `d2a2ce8d1d9ea8d397e8790cfcc331c244282e97` |
| `.memory-bank/progress.md` | `894c1c10dfe3659aa3f7879951a6c0e8a08fb87e` |
| `AGENTS.md` | `b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0` |
| `docs/INDEX.md` | `a577f15e5dac6804a41f5db07f33a27b84db1204` |
| `docs/architecture/source-authority.md` | `e75be660520826e1cdc09d98d25af04089421be1` |
| `docs/plans/2026-10-05-cloud-execution.md` | `f7258a5a5c0057a7f17694d974a7f651705b4aaf` |
| `docs/plans/2026-10-05-u2-lab-launch.md` | `ad0ee38d9317c4a0fa6631201da3535699265b96` |
| `docs/reviews/2026-10-05-bootstrap-binding.md` | `0c9d3bc695cdf37f01052dfae68a96146f516d26` |
| `docs/reviews/2026-10-05-bootstrap-code-review.md` | `c5438ed6be42ff713a8be862b9f5945978d9899a` |
| `docs/verification/beads-prepared-checkpoint.jsonl` | `a2878ae959783dce24b119a24a3ad0760f8abe01` |
| `docs/verification/bootstrap-contract.md` | `a825a618d80c35728626de6f8eaec896b468a269` |

## Immutable source references

Read-only trusted OverGate source paths at `633937250fa8f47b49f928c1d8781ab17fe8c8e3`:

| Path | Git blob SHA1 |
|---|---|
| `.agents/RV_ROLE.md` | `6e13e1023c90621172135e206e01fed8bd6b8c28` |
| `.agents/PM_ROLE.md` | `9861c3e2254b4f16bda32a832e5950d01cee7ea3` |
| `.agents/INSTALL.md` | `a958e4950733e8fda8205601021d015a2e1c4246` |
| `.agents/PIPELINE_ADR.md` | `473e7f77413284d00588ef9033b5d117e09ac661` |
| `scripts/bd-sync-export.sh` | `0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85` |

Pinned U2 source references at `cdc490e3517c8455f662f82579c45813cdbb9a76`, read from
`/workspace/scratch/faaeb0182a68/u2-cloud-source`; copied bytes independently match provenance:

| U2 Path | Git blob SHA1 |
|---|---|
| `scripts/bd-apply-intents.sh` | `3f1a08351841ca8b083c99376289bbafdf028aa6` |
| `scripts/lib/bd-apply-engine.mjs` | `48a8d4c90bb171e9f5b6fc1c40b0fcf5d1dc3f8a` |
| `.bd-intents/README.md` | `f31b9e58ae4e5cfced88d1960d666c53a0bb67b5` |

`provenance.json` SHA256: `156e4f3137ce995cbb0893bb5e28a76b1b93cbfd8b2975ea716ee777afa81432`.
ADR-0042 routing/active status принят из plan/PM source investigation; сам ADR текст в этой
scope-проверке не перечитан. Generated checkpoint SHA256: `8abd77244e2cb6f580f923f37016d9fb77ad84745eddbcf219673c6f41e3d92a`;
read-only parse: 9 records, `ulab-9aa.1` blocked, planning `.8` closed, epic и T1–T6 open.

## Exact relevant C contract text

```text
## Verification Contract: C1–C6

| AC | Expected | Method |
|---|---|---|
| C1 | Cloud is read-snapshot/write-intents; no further local bd mutation or snapshot push | Authority/context/queue review |
| C2 | Applier validates whole queue before mutation; handles/refs/idempotency preserved | Negative dry-run + stub fixtures |
| C3 | Original nine task IDs/data recoverable; no duplicate task creation queue | Checkpoint hash + guide + queue audit |
| C4 | Managed OverGate inventory unchanged; new cloud tooling provenance explicit | Blob comparisons + check-reference/project verify |
| C5 | Operator commands distinguish trusted external first export from later merged applier | Guide/first-remote fixture review; actual operator run NOT RUN |
| C6 | Stacked product work preserves P1–P14, full bootstrap/merge gates and honest task status | Branch/PR metadata and acceptance reports |

Mode CRITICAL for cloud tooling/data-loss boundaries; historical bootstrap verifier budget 2/6.
One independent reviewer handles this plan and scoped code; one QA checks C1–C6. No broad
bootstrap re-audit. Product implementation uses its existing reviewed plan/contract separately.
Rollback: revert new project cloud additions/authority amendment; keep generated checkpoint.
Never restore/overwrite a live operator database as part of code rollback.
```

## Not reviewed / not tested

Plan Review only: implementation files пока отсутствуют; dry-run/stub/security fixtures,
cloud project checks, first-remote fixture, actual primary-clone import/export/restore,
native hooks, stacked branch/PR metadata, runtime P1–P14 QA и trusted finalize здесь **NOT RUN**.
Remote current state/auth не проверялись; GitHub и Beads не мутировались. Полная managed
install inventory и released OverGate semantics не переаудировались. Продуктовые physics/UI
и unseen U2 owners OUT OF SCOPE. Для выполнения нужен Developer, затем QA и один scoped
Code Review по C1–C6; эта RV session доступна для affected review без нового broad audit.
