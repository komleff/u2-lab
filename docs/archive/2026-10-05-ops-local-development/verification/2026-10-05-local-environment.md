# Локальная среда и запуск — evidence PM

2026-10-05, Asia/Novosibirsk. PM / Codex (GPT-6); не independent QA/review.
Source candidate PR2: `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`.
Рабочая локальная ветка: `ops/local-development`, standalone primary checkout.
Plan/VC: `docs/plans/2026-10-05-local-environment.md`; product P1–P14 неизменны.
Контекст предыдущего shared-chat прочитан; task соответствует принятому product contract.

| Case | AC | Method | Result / evidence |
|---|---|---|---|
| Toolchain | L1 | node/bd versions; официальный release checksum | Node24.21.0; bd1.0.2 a3f834b3; SHA256 архива `f3b27edd4ed43ce8aa792837145f324e4b8a3cbf9dc0c81d144682da46189038` |
| Project verify | L2 | `bash .agents/project/verify.sh` с Node24 | exit0: typecheck/build,56unit,5browser,26cloud fixtures,reference/bootstrap PASS;1screenshot SKIP |
| Original tasks | L3 | exact checkpoint SHA256; bd import/export, JSON comparison |9 IDs; top-level data/status/AC/times и semantic dependencies PASS |
| First export | L3 | внешний frozen helper SHA `633937250fa8f47b49f928c1d8781ab17fe8c8e3` | origin/beads-backup опубликован; helper blob `0eb9eaaacd77ffcfdb1d7d682bc05d550cf1dc85` |
| Restore/re-export | L3 | отдельный primary clone `/tmp/u2-lab-beads-restore-20261005`, последовательно |9issues imported; re-export no-op; snapshot побайтно равен remote (сортировка строк) |
| Read route | L3 | `bash scripts/bd-read.sh list`, bd ready/config/remotes |9tasks доступны; export.auto=false,backup.git-push=false,sync.remote unset; Dolt remotes отсутствуют |
| Codex activation | L4 | Codex0.153.4 fresh root session `/hooks`; exact hook trust review | installed1/active1; trusted managed project entry, без trust override |
| Native allow/deny | L4 | fresh `codex exec`, read-only, gpt-5.6-sol; status + protected push dry-run | status exit0; `Command blocked by PreToolUse hook: ... HEAD:main`; dry-run до исполнения заблокирован |
| Skills discovery | L5 | actual CLI RED:5missing frontmatter; YAML correction; quick_validate/native loader GREEN |5valid; нет прежних loader errors; original Markdown bodies побайтно совпадают с candidate |
| Static app | L6 | Python HTTP server; реальный Chromium/Worker, S/M14s,A/B,390px | HTTP200; оба опыта завершены; A/B PASS; scrollWidth390; pageErrors/externalRequests пусты |
| Remote protection | L7 | initial protection404/rulesets пусты; guard-approved REST create; GET rules/branches/main | active ruleset24483674: PR-only,resolve threads,no deletion/no force-push,no bypass actors |

Local raw evidence: `.overgate-runtime/native-codex-smoke.jsonl` и stderr,
`local-preview.json`, `local-preview.png`, `beads-restore-result.json`.
Remote request/response: `main-ruleset-request.json`, `main-ruleset-response.json` там же.
Runtime/toolchain state ignored; пригодный для просмотра отчёт — этот файл.

[Main protection ruleset](https://github.com/komleff/u2-lab/rules/24483674)
применяет существующую pipeline policy; GitHub required approval count=0,
поскольку независимые reports — pipeline evidence/comments, не GitHub approving reviews.
CI/finalize остаются процедурными gates и не считаются пройденными из-за ruleset.

`bd init` автоматически назначил Dolt remote и создал локальный commit `49bd51b`.
Remote удалён через `bd dolt remote remove origin`, sync.remote снят через bd API;
tracked config возвращён к исходным bytes. `bd import` нормализовал dependency created_by
от Codex к Dmitriy Komlev; original checkpoint SHA256 не изменён:
`8abd77244e2cb6f580f923f37016d9fb77ad84745eddbcf219673c6f41e3d92a`.
Pending intents не применялись; canonical statuses/dependencies не закрывались.
В ulab-9aa.1 добавлена factual PM note через bd API и trusted export, без status update.
Второй clone используется только как последовательный recovery probe, не concurrent writer.

## Использование на этой машине

Из корня проекта:

```bash
source .overgate-runtime/env.sh
npm run dev -- --host 0.0.0.0
```

Текущая static сборка уже запущена отдельным процессом:
`http://localhost:4173`, LAN `http://192.168.68.65:4173`.
PID находится в `.overgate-runtime/server.pid`, log в `server.log`.
Для повторного static запуска: `npm run build`, затем
`python3 -m http.server 4173 --bind 0.0.0.0 --directory dist`.
Перед запуском второго сервера проверить, что порт свободен.

Локальный `.codex/config.toml` выбирает доступную gpt-5.6-sol: глобальная gpt-6.1-sol
получила actual400 unsupported для ChatGPT account. Настройка относится только к
CLI этого проекта, не меняет модель текущей PM-сессии. Unity MCP не требуется лаборатории;
в smoke отключён только per-invocation. Skills/hook semantics и runtime не менялись.

Правила hook trust/discovery сверены с [официальной документацией](https://learn.chatgpt.com/docs/hooks);
выбор доступной модели — с [официальной документацией](https://learn.chatgpt.com/docs/models)
и actual account model cache/успешным запросом.

## Продолжение

Local experiment readiness: PASS в проверенной области. Full acceptance не объявляется.
B6 получил фактическое operator export/restore evidence, но требует affected independent
QA/scoped review исходного acceptance blocker. B8/finalize/operator merge остаются открытыми.
Claude native activation, Windows и второе физическое LAN устройство NOT RUN.
12h physical benchmark в этом продолжении не повторялся; prior evidence сохранён.
Метаданные пяти skills отличаются от frozen install payload и должны быть явно сохранены
при следующем upgrade/review; автоматический overwrite конфликтов не разрешён.
Отчёт и metadata correction пока локальны; PR1/PR2 не обновлялись и не merge.
