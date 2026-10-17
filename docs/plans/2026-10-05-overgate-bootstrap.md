# U2 Lab — OverGate v4 bootstrap plan

Goal: новый public u2-lab с OverGate v4.0.0-rc.1, project Memory Bank и Beads.
Architecture: installer plan → independent PLAN_READY → apply → QA/review → operator merge.
Tech stack: Git, Bash, Python3, Node, jq; bd1.0.2; GitHub connector и approved fallback для create repo.
Spec: решение оператора 2026-10-05 и frozen OverGate INSTALL.
Contract: `../verification/bootstrap-contract.md`.
Mode: CRITICAL (named governance/hooks risk). Status: INSTALLED / FINAL ACCEPTANCE OPEN.

## Target → as-built → gap

Source уже получен через git clone, tag checkout чистый. Frozen SHA:
`633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
Local target primary checkout/branch `bootstrap/overgate-v4` создан, project context/plan готовы.
Public remote и Draft PR #1 созданы до managed copy. Exact inventory67operations получил
independent PLAN_READY, затем trusted apply выполнен; structural checker PASS.
PM role прочитан в frozen source. Native hooks и Beads transport имеют отдельную границу
фактического evidence; текущие результаты — docs/verification/bootstrap-evidence.md.

## Ограничения

- INSTALL требует target Draft PR до managed copy и независимый inventory PLAN_READY.
- Нет self-approval или фиктивных PR/comment URLs. Approval JSON только после фактического evidence.
- Product authority/Memory Bank/Beads/project checks принадлежат target, source history не копируется.
- Не копировать весь source checkout; только explicit distribution manifest через installer.
- Не обновлять existing main/master и не делать merge/auto-merge; final merge оператором.
- Local Beads только primary checkout; bd commands, не direct Dolt/manual JSONL.
- Fresh verify template до заполнения FAIL; actual runtime smoke не заменяется static fixture PASS.

## Шаги

1. Снять remote-access blocker: approved GitHub browser fallback создаёт public `komleff/u2-lab`
   с минимальным default-branch seed, необходимым для PR. Это одноразовое создание репозитория,
   не дальнейший direct-main delivery. Если имя уже занято, проверить owner/context, не overwrite.
2. Перенести local plan/context commits в рабочую ветку на реальном default branch base,
   push branch и открыть **один Draft PR** с bootstrap plan, product plan и bootstrap contract.
   Exact base/head и seed сохраняются; reviewed plan blobs не меняются при переносе.
3. Trusted installer генерирует plan без mutation target. Пути/PR подставить фактические:

```bash
python3 /trusted/overgate/scripts/install-overgate.py plan \
  --source /trusted/overgate \
  --source-sha 633937250fa8f47b49f928c1d8781ab17fe8c8e3 \
  --target /checkout/u2-lab \
  --contract /checkout/u2-lab/docs/verification/bootstrap-contract.md \
  --target-pr REAL_TARGET_DRAFT_PR_URL \
  --output /review/install-plan.json
```

4. Publish exact inventory + SHA256 в том же PR. Один independent Reviewer получает
   B1–B8, exact inventory/contract/source, explicit reviewed paths. При blockers — fix/replan;
   при PLAN_READY PM проверяет origin report и создаёт локальный approval JSON с plan hash
   и действительным comment URL того же PR. Это не продуктовый PLAN_READY лаборатории.
5. `install-overgate.py apply --plan /review/install-plan.json --approval /review/plan-ready.json`.
   Проверить .overgate/install-state.json, backup ignore, managed closure и preservation.
   Drift/conflict — stop/replan affected review; нет --force/обхода guards.
6. Сохранить project-owned Memory Bank (уже создан), заполнить `.agents/project/verify.sh`:
   на bootstrap — `python3 scripts/check-reference.py` + проверка project docs/authority/source
   metadata; после runtime — actual npm typecheck/unit/build/browser. Missing runtime tests
   обозначить NOT RUN, не подменять bootstrap check продуктовым PASS.
7. Local Beads initialize из main checkout с prefix ulab, сохранить AGENTS/hook authority
   через bd documented skip-agents/skip-hooks при init, не отключая существующие guards.
   `export.auto=false`, sync.remote unset. Создать epic + bootstrap/T1–T6 задачи/dependencies,
   acceptance links; source задач не копировать из OverGate. Пользоваться bd API.
8. После remote wiring `scripts/bd-sync-export.sh` публикует generated snapshot в beads-backup.
   Проверить frozen origin snapshot через bd-read/wt helpers и restore в отдельном primary
   clone. Синхронизацию не объявлять PASS до этих команд.
9. QA B1–B8, один scoped review. Static reference/installed checks и actual live adapters
   разделить. Недоступный live host — NOT RUN; если acceptance требует human risk decision,
   представить конкретное evidence, не назначать accepted risk самостоятельно.
10. Landing/context/bookkeeping commit → fresh checks и binding → один trusted finalize
    из frozen source. Merge делает оператор; затем product ветка/PR и согласованный PM запуск.

## Review focus / rollback

Critical focus: wrong source tag; copied U2/reference state; disabled/unloaded guards;
false activation PASS; Beads snapshot overwrite; mutable authority overwritten as managed.
Corresponding tests: installer source drift/closure/preservation fixtures, actual activation,
export last-seen/drop guards, project context route.

Rollback до commit: trusted installer rollback по сохранённому ignored rollback journal.
Rollback отказывает при managed drift; не удаляет Memory Bank/Beads/project overrides.
После commit/merge — revert install PR и адресно восстановить сохранённые overrides.
Откат code не стирает задачи/результаты экспериментов. Публичный repo не удаляется как rollback.

## Текущая граница

Create repo выполнен через GitHub browser после подтверждения оператора; connector
опубликовал ветку, PR и exact inventory/independent report. B1/B3/apply выполнены.
Hosted runtime не доказывает native hook loading; CLI Git push/gh не аутентифицированы.
Выполнить доступные deterministic/project QA и scoped review, записать реальные ограничения.
До native smoke/обязательного sync evidence не закрывать B0 и не заявлять full pipeline DONE.
