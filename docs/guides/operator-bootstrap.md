# Operator bootstrap — primary checkout

Эти действия выполняет оператор на своей машине. В hosted Work **NOT RUN**: реальные
bd init/import/apply/export/restore, native activation, finalize и merge. Предварительный
cloud PLAN_READY/fixture PASS не закрывает B0/B6/B8 или исторический B6 auth FAIL.

Процедура ниже предназначена для **нового primary clone без Beads DB** и отсутствующей
remote ветки `beads-backup`. Existing primary DB не перезаписывать checkpoint: если DB
или remote уже есть, остановиться и согласовать recovery по current evidence; для
обычного восстановления применять trusted restore-before-export. Не редактировать
snapshot/JSONL вручную; не использовать force/drop/skip/trust override envs.

## Выбор кода и проверка trusted export helper

Первый writer checkout — standalone clone, не linked worktree. Пока main ещё не принят,
оператор явно выбирает reviewed `bootstrap/overgate-v4` candidate и exact commit из
последнего scoped review/PR. Checkout этой ветки не делает новый applier доверенным.
После operator merge штатная рабочая ветка writer — trusted main.

```bash
git clone --branch bootstrap/overgate-v4 https://github.com/komleff/u2-lab.git u2-lab-primary
cd u2-lab-primary
git branch --show-current
git rev-parse HEAD
git status --porcelain
test -z "$(git status --porcelain --untracked-files=all)"
test "$(git rev-parse --path-format=absolute --git-common-dir)" = "$(git rev-parse --path-format=absolute --git-dir)"
test ! -d .beads/dolt
```

Перед продолжением сверить HEAD с reviewed candidate; status должен быть пустым.
Git CLI должен иметь действующий доступ к origin для push; browser/connector login
не доказывает CLI auth. Отдельно получить внешний frozen trusted OverGate:

```bash
git clone https://github.com/komleff/overgate.git ../overgate-trusted
git -C ../overgate-trusted checkout --detach 633937250fa8f47b49f928c1d8781ab17fe8c8e3
test "$(git -C ../overgate-trusted rev-parse HEAD)" = 633937250fa8f47b49f928c1d8781ab17fe8c8e3
test -z "$(git -C ../overgate-trusted status --porcelain --untracked-files=all)"
test "$(git hash-object ../overgate-trusted/scripts/bd-sync-export.sh)" = 0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85
```

Чистый exact commit связывает также sourced `bd-sync-common.sh` и INSTALL; не подменять
helper новой версией из PR. Source: OverGate v4.0.0-rc.1. Команды сети ограничивать
30s, локальные 120s штатным timeout runner платформы; при ошибке остановиться.

## Начальная пустая remote authority

Проверить отсутствие remote branch командой ниже. Только exit **2** и пустой вывод
означают «ветка отсутствует»; exit 0 означает existing authority, другой код — auth/network
failure. В обоих случаях этот initial-import сценарий остановить.

```bash
git ls-remote --exit-code --heads origin beads-backup
```

В новом primary clone использовать проверенный официальный bd 1.0.2. Не устанавливать
bd в hosted container. Checkpoint SHA256 должен быть ровно
`8abd77244e2cb6f580f923f37016d9fb77ad84745eddbcf219673c6f41e3d92a`:

```bash
python3 - <<'PY'
import hashlib, json
from pathlib import Path
data = Path('docs/verification/beads-prepared-checkpoint.jsonl').read_bytes()
assert hashlib.sha256(data).hexdigest() == '8abd77244e2cb6f580f923f37016d9fb77ad84745eddbcf219673c6f41e3d92a'
rows = [json.loads(line) for line in data.splitlines() if line.strip()]
assert {row['id'] for row in rows} == {'ulab-9aa', *('ulab-9aa.' + str(i) for i in range(1, 9))}
print('Checkpoint: exact 9 original IDs')
PY
bd init --prefix ulab --skip-agents --skip-hooks
bd config set export.auto false
bd import docs/verification/beads-prepared-checkpoint.jsonl
bd list --all
bash ../overgate-trusted/scripts/bd-sync-export.sh
```

Tracked `.beads/config.yaml` сохраняет `export.auto: false` и
`backup.git-push: false` (запрещает upstream auto-push). После init проверить, что эти
настройки сохранены. Оставить `sync.remote` unset (никаких Dolt remotes); init не переписывает AGENTS/hooks.
Проверить импорт всех исходных девяти IDs и data/status/dependencies; не создавать новые
задачи вместо них. Внешний export вызывается **из cwd u2-lab-primary**: это первичная
публикация generated records через bd API и trusted helper. Absent-remote first export
поддержан frozen helper без overrides; subsequent export сохраняет last-seen/drop guards.
При auth/export failure сохранить evidence и остановиться, не обходить guard.

Получить обязательное restore/re-export evidence в отдельном primary clone (через
trusted frozen `bd-sync-restore.sh` и `bd-sync-export.sh`), не второй concurrent writer.
Проверить remote snapshot через reader, выполнить actual native adapter smoke **строго по
внешнему frozen `.agents/INSTALL.md`**. Hosted smoke не является native activation.
Результаты направить в affected QA/scoped review, затем trusted finalize; merge делает оператор.

## Последующие pending intents

Только после независимого review и operator merge cloud tooling в trusted main:
переключить primary checkout на main, обновить его, проверить чистый exact trusted HEAD;
убедиться, что tooling совпадает с reviewed main и не изменено локально. Затем получить
нужную PR-очередь как данные через review/landing process. Очередь прочитать до apply.

```bash
scripts/bd-sync-restore.sh
scripts/bd-apply-intents.sh --dry-run .bd-intents/bootstrap-cloud.jsonl
scripts/bd-apply-intents.sh .bd-intents/bootstrap-cloud.jsonl
```

Wrapper dry-run читает live export; это operator operation. Mutable apply валидирует всю
очередь, использует process lock и receipt в Git common dir, затем публикует mutations.
Если execution оборвался, возможна частичная mutation; восстановить согласованное live/
remote состояние через trusted helpers, повторить с database markers. Receipt — кэш,
не source of truth; upstream доверяет `.git`, общего symlink guard для всех путей нет.
Pending notes не закрывают bootstrap. Удалять применённую очередь только после проверки
database markers и export evidence в landing-коммите; unapplied очередь не удалять.

Stacked product preparation разрешена cloud amendment после deterministic checks,
но product PR merge-ineligible до bootstrap acceptance. P1–P14, B0/B6/B8 и независимые
product QA/review gates сохраняются. Code rollback удаляет project additions/amendment,
сохраняет checkpoint и не восстанавливает/перезаписывает operator DB.
