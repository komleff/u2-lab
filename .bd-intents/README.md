# Очередь заявок Beads (`.bd-intents/`)

Канал, через который ИИ-агент в **изолированном облачном контейнере** запрашивает изменения
Beads без запуска `bd`/Dolt и доступа к диску оператора. Канон — pinned U2 **ADR-0042**;
применение в Lab — `docs/plans/2026-10-05-cloud-execution.md`, C1–C6.

Агент **не мутирует базу** и **не ставит bd**. Он дописывает заявки (намерения) в файл своей
PR-ветки; скрипт `scripts/bd-apply-intents.sh` на основном checkout оператора проигрывает их в
живую базу и публикует снимок. Так база остаётся single-writer.

## Файлы

- `<имя>.jsonl` — append-only очередь заявок (пишет агент, коммитит в PR-ветку, tracked).
  Имя произвольно (удобно — имя/slug ветки). `scripts/bd-apply-intents.sh` без аргумента берёт
  **единственный** `*.jsonl` в этом каталоге; если их несколько — путь указывается явно.
- Receipt apply (локальный кэш-ускоритель, не источник истины) пишется **вне worktree** —
  в `.git/ulab-bd-receipts/` основного checkout, поэтому в PR/`main` не попадает и здесь не лежит
  (защита от symlink-подмены; ADR-0042).

## Формат заявки (одна на строку, JSON Lines)

Общие поля: `intent_id` (уникальный, ключ идемпотентности — например UUID), `op`, опц. `created_at`, `actor`.

| `op` | Обязательные | Опциональные |
|---|---|---|
| `create` | `title` | `handle` (`tmp:<slug>`), `type`, `priority`, `description`, `assignee`, `acceptance`, `labels`, `notes` |
| `close` | `ref`, `close_reason` | — |
| `update` | `ref` | `status`, `priority`, `assignee`, `type` |
| `dep_add` | `ref`, `blocked_by` | `dep_type` (по умолчанию `blocks`) |
| `note` | `ref`, `text` | — |
| `comment` | `ref`, `text` | — |

`ref`/`blocked_by` — реальный `ulab-xxxx / ulab-xxxx.1` **или** `tmp:<slug>` (хэндл созданной в этой же очереди задачи).
Реальный ID будущей задачи агент не знает → объявляет `handle: "tmp:<slug>"` в `create` и ссылается на
него ниже. Хэндл должен быть объявлен **выше** по файлу (forward-ref запрещён). Незнакомый `op` или лишний
ключ → вся очередь отклоняется (валидация — двухфазная, до любых мутаций).

Прочитать текущие задачи (без bd) можно через `scripts/bd-read.sh ready|list|show <id>`.
Пока remote snapshot не опубликован, reader вправе отказать. Generated checkpoint
`docs/verification/beads-prepared-checkpoint.jsonl` — неизменный recovery input из девяти
задач, не canonical snapshot. `bootstrap-cloud.jsonl` содержит только **PENDING** notes
к существующим `ulab-9aa` / `ulab-9aa.1`; это не применённый статус и не создание дублей.
Дальнейшие updates добавляются новыми строками/уникальными intent IDs в очередь своей ветки.

## Пример

```jsonl
{"intent_id":"a1","op":"create","handle":"tmp:fix-bug","title":"Чинить рассинхрон астероидов","type":"bug","priority":"1"}
{"intent_id":"a2","op":"create","handle":"tmp:followup","title":"Добавить тест регресса","type":"task"}
{"intent_id":"a3","op":"dep_add","ref":"tmp:followup","blocked_by":"tmp:fix-bug"}
{"intent_id":"a4","op":"close","ref":"ulab-example","close_reason":"Сделано в этом PR"}
{"intent_id":"a5","op":"note","ref":"tmp:fix-bug","text":"Корень — порядок reconciliation"}
```

## Идемпотентность

`scripts/bd-apply-intents.sh` безопасно перезапускать: маркер `intent:<intent_id>` пишется в саму базу
(`--external-ref` для `create`, `[intent:<id>]` в текст для `note`/`comment`), `close`/`dep_add`
пропускаются, если уже применены. Дубль не создаётся даже при потере receipt.

## Lifecycle

Очередь живёт в PR-ветке. На **pre-merge landing** оператор из основного checkout запускает
**доверенную (смерженную в main)** версию `scripts/bd-apply-intents.sh`, затем удаляет очередь
`git rm` в landing-коммите — в `main` файлы не копятся.

Первую публикацию выполняет оператор по `docs/guides/operator-bootstrap.md` через внешний
frozen OverGate helper. Новый applier запускается только после review/merge tooling в
доверенный main. В hosted Work applier wrapper **NOT RUN** даже с `--dry-run`: wrapper
делает fetch и live `bd export`, comment dry-run engine может читать `bd comments`.
Offline no-bd evidence относится к engine с fixture index и notes/новыми tmp handles;
`node --test scripts/tests/test-bd-cloud.mjs` не использует live DB.

Receipt внутри Git common dir и process lock сохранены из upstream. Это граница доверия
к операторскому `.git`, а не новая проверка всех symlink/path аргументов: pinned upstream
не содержит общего symlink-rejection для queue или receipt. Не передавать пути к чужим
файлам и не запускать engine напрямую для live apply. Validation failure даёт ноль
мутаций; execution failure может оставить частичные операции, повтор докатывает их
по database markers. Provenance и точные target blobs:
`docs/verification/cloud-tooling-provenance.json`.
