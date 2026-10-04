#!/usr/bin/env bash
# Проигрывает очередь заявок Beads (.bd-intents/*.jsonl) в живую базу.
#
# ВАЖНО (trust boundary, ADR-0042): запускать ТОЛЬКО доверенную, смерженную в main
# версию этого скрипта. Очередь — это данные (валидируются), но сам скрипт — код;
# его версия из недоверенной PR-ветки могла быть подменена. PR, меняющий tooling
# (scripts/bd-*.sh), доверяется лишь после ревью/merge.
# NB: env-guard ниже проверяет лишь, что это основной checkout (живой сервер), а НЕ что
# версия скрипта доверенная — последнее обеспечивается процессом (ревью tooling до merge),
# технически не enforced.
#
# Запуск только из основного checkout (живой dolt-сервер). Из worktree — откажет.
#
# Usage: scripts/bd-apply-intents.sh [--dry-run] [--no-export] [<queue.jsonl>]
#   --dry-run                     показать план, ничего не менять
#   --no-export                   ТЕСТ/ADVANCED: не публиковать снимок после мутаций.
#                                 Нарушает инвариант «apply завершается export'ом» —
#                                 только для e2e на временной базе; иначе публикуй вручную.
#   BD_BIN=...                    ТЕСТ: подменить бинарь bd (стаб).
#   BD_APPLY_SKIP_SYNC_CHECK=1    ТЕСТ/ADVANCED: пропустить fail-closed проверку расхождения
#                                 с origin/beads-backup (риск apply поверх устаревшей базы).
# Очередь по умолчанию — единственный *.jsonl в .bd-intents/; при нескольких укажи путь явно.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/lib/bd-env.sh
. "${SCRIPT_DIR}/lib/bd-env.sh"

DRY=0; NO_EXPORT=0; QUEUE=""; QUEUE_EXPLICIT=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --no-export) NO_EXPORT=1 ;;
    -*) echo "ERROR: неизвестный флаг '$a' (fail-closed — apply мутирует базу, опечатка недопустима)." >&2; exit 2 ;;
    *) if [ "$QUEUE_EXPLICIT" = "1" ]; then echo "ERROR: лишний аргумент '$a' — допускается не более одного пути очереди (fail-closed)." >&2; exit 2; fi
       QUEUE="$a"; QUEUE_EXPLICIT=1 ;;
  esac
done

BD_BIN="${BD_BIN:-bd}"

# 1. Guard: только из основного checkout.
bd_env_assert_main_checkout "bd-apply-intents.sh"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

# 1b. Best-effort trust-check (НЕ tamper-proof: сам скрипт и lib уже исполнились/source-нулись
# до этой точки). Ловит ЧАСТЫЙ СЛУЧАЙНЫЙ кейс — apply запущен из PR-ветки, где tooling beads
# изменён vs origin/main — и отказывает ДО мутаций базы. Против НАМЕРЕННОЙ подмены не защищает
# (подделанный скрипт снял бы собственную проверку) — реальная гарантия процессная: запускать
# merged-в-main версию. Override BD_APPLY_TRUST_LOCAL_TOOLING=1 (напр. для PR самого tooling).
if [ "${BD_APPLY_TRUST_LOCAL_TOOLING:-0}" != "1" ] && git rev-parse --verify -q origin/main >/dev/null 2>&1; then
  if git diff --name-only origin/main...HEAD 2>/dev/null | grep -qE '^scripts/(bd-[a-z-]+\.sh|lib/bd-)'; then
    echo "ERROR: tooling beads (scripts/bd-*) изменён в этой ветке vs origin/main — запусти" >&2
    echo "       доверенную (merged в main) версию, либо осознанно BD_APPLY_TRUST_LOCAL_TOOLING=1" >&2
    echo "       (это best-effort проверка до мутаций, не защита от намеренной подмены)." >&2
    exit 6
  fi
fi

# 2. Очередь по умолчанию: единственный файл в .bd-intents/. Привязку к имени ветки
# текущего checkout НЕ используем — на landing основной checkout стоит на main, и
# .bd-intents/main.jsonl != PR-очередь. 0 файлов → нечего применять; >1 → требуем явный путь.
if [ -z "$QUEUE" ]; then
  set -- .bd-intents/*.jsonl
  if [ ! -e "$1" ]; then
    echo "INFO: очередь заявок не найдена (.bd-intents/*.jsonl) — нечего применять."
    exit 0
  elif [ "$#" -gt 1 ]; then
    echo "ERROR: в .bd-intents/ несколько очередей — укажите нужную явным путём:" >&2
    printf '  %s\n' "$@" >&2
    exit 1
  fi
  QUEUE="$1"
fi
if [ ! -f "$QUEUE" ]; then
  if [ "$QUEUE_EXPLICIT" = "1" ]; then
    echo "ERROR: указанная очередь не найдена ($QUEUE) — опечатка в пути? (fail-closed)" >&2
    exit 2
  fi
  echo "INFO: очередь заявок не найдена ($QUEUE) — нечего применять."
  exit 0
fi
# Receipt — в доверенном .git-каталоге (вне PR-контролируемого worktree → нет риска,
# что подложенный в .bd-intents/ symlink перенаправит запись receipt на чужой файл).
GIT_COMMON="$(git rev-parse --path-format=absolute --git-common-dir)"
RECEIPT_DIR="${GIT_COMMON}/ulab-bd-receipts"
mkdir -p "$RECEIPT_DIR"
RECEIPT="${RECEIPT_DIR}/$(bd_env_slugify "$QUEUE").receipt.json"

# 3. Меж-процессный лок (mkdir атомарен; flock на macOS нет) — защита от гонки
# параллельных apply (две сессии в одном checkout не должны задвоить create).
LOCK="${GIT_COMMON}/ulab-bd-apply.lock.d"
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "ERROR: другой apply уже выполняется (есть $LOCK). Повторите позже или удалите каталог, если процесс мёртв." >&2
  exit 4
fi
LIVE=""; REMOTE=""; SUMMARY=""
cleanup() { [ -n "$LIVE" ] && rm -f "$LIVE" "$REMOTE" "$SUMMARY"; rmdir "$LOCK" 2>/dev/null || true; }
trap cleanup EXIT

# 4. Живой dolt-сервер основного checkout (для теста с BD_BIN-стабом — пропускаем).
if [ "$BD_BIN" = "bd" ]; then
  main_root="$(bd_env_main_root)"
  if ! bd_env_dolt_alive "$main_root"; then
    echo "ERROR: dolt-сервер основного checkout не запущен ($main_root)." >&2
    echo "       Прогрейте bd любой командой из основного checkout и повторите." >&2
    exit 3
  fi
fi

# 5. Свежий снимок + слепок живой базы для индекса и проверки расхождения.
TMP="${TMPDIR:-/tmp}"
LIVE="$(mktemp "${TMP%/}/ulab-bd-live.XXXXXX")"
REMOTE="$(mktemp "${TMP%/}/ulab-bd-remote.XXXXXX")"
SUMMARY="$(mktemp "${TMP%/}/ulab-bd-summary.XXXXXX")"

# Для мутирующего apply fetch/чтение снимка — fail-closed: на устаревшем/недоступном
# origin/beads-backup можно применить очередь поверх неактуальной базы, а последующий
# export затрёт чужие изменения. Осознанный обход — BD_APPLY_SKIP_SYNC_CHECK=1.
if [ "${BD_APPLY_SKIP_SYNC_CHECK:-0}" = "1" ]; then
  bd_env_fetch_backup 2>/dev/null || echo "ВНИМАНИЕ: fetch не удался (skip-sync) — снимок может быть устаревшим." >&2
  git show "origin/${BD_BACKUP_BRANCH}:.beads/issues.jsonl" > "$REMOTE" 2>/dev/null || : > "$REMOTE"
else
  if ! bd_env_fetch_backup; then
    echo "ERROR: не удалось обновить origin/beads-backup — apply на возможно устаревшей базе небезопасен." >&2
    echo "       Проверьте сеть/git-доступ, либо BD_APPLY_SKIP_SYNC_CHECK=1 осознанно." >&2
    exit 5
  fi
  if ! git show "origin/${BD_BACKUP_BRANCH}:.beads/issues.jsonl" > "$REMOTE" 2>/dev/null; then
    echo "ERROR: снимок origin/beads-backup не читается — apply прерван (fail-closed)." >&2
    exit 5
  fi
fi
"$BD_BIN" export --all -o "$LIVE"

# 5. Движок: фаза 1 (валидация всей очереди) + фаза 2 (выполнение).
engine_args=(--queue "$QUEUE" --receipt "$RECEIPT" --index "$LIVE" --remote "$REMOTE"
             --bd "$BD_BIN" --summary-file "$SUMMARY")
[ "$DRY" = "1" ] && engine_args+=(--dry-run)
[ "${BD_APPLY_SKIP_SYNC_CHECK:-0}" = "1" ] && engine_args+=(--skip-sync-check)
node "${SCRIPT_DIR}/lib/bd-apply-engine.mjs" "${engine_args[@]}"

# 6. Публикация снимка после мутаций (канон: apply обязан завершиться export'ом).
mutations="$(node -e 'const fs=require("fs");try{process.stdout.write(String(JSON.parse(fs.readFileSync(process.argv[1],"utf8")).mutations||0))}catch{process.stdout.write("0")}' "$SUMMARY")"
if [ "$DRY" = "0" ] && [ "$NO_EXPORT" = "0" ] && [ "${mutations:-0}" -gt 0 ]; then
  echo "Публикую снимок задач (scripts/bd-sync-export.sh)…"
  "${SCRIPT_DIR}/bd-sync-export.sh"
elif [ "$NO_EXPORT" = "1" ] && [ "${mutations:-0}" -gt 0 ]; then
  echo "ВНИМАНИЕ: --no-export — мутации НЕ опубликованы в beads-backup. Опубликуйте вручную."
fi
