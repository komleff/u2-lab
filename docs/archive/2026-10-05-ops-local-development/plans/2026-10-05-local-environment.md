# Локальная среда разработки — продолжение PM

Дата: 2026-10-05, Asia/Novosibirsk. Роль: PM, owner `.agents/PM_ROLE.md`.
Исходный candidate: PR2 `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`.
Задача оператора: проверить/настроить локальную среду и pipeline, подхватить
предыдущую задачу, запустить приложение. WHAT и P1–P14 остаются принятыми.

## Target → as-built → gap

Локальный main содержал только README. Runtime и установленный OverGate находятся
в PR2 поверх PR1; переключение checkout восстановило контекст и готовый код.
Node25 не удовлетворяет engines Vitest; системный bd1.2.2 отличается от B6/bd1.0.2.
Базы/snapshot Beads не было. Codex0.153.4 обнаружил guard, но требовал trust review;
пять core SKILL.md пропущены из-за отсутствия YAML frontmatter.

## Scope и последовательность

1. Использовать проектный Node24 и проверенный официальный bd1.0.2 в локальном cache.
2. Выполнить существующий project verify без изменений runtime и lockfile.
3. В primary checkout импортировать exact recovery checkpoint через bd API;
   экспортировать внешним frozen OverGate helper; restore/re-export в отдельном clone
   последовательно, без concurrent mutations. Удалить автоматически назначенный
   `bd init` Dolt remote через bd API; `sync.remote` unset, auto exports/push выключены.
4. Пройти native Codex hook trust review; проверить allow/deny безопасными командами.
5. FAST metadata correction: добавить только YAML name/description пяти core skills;
   bodies, triggers/полномочия и owner paths сохранить побайтно. Проверить native discovery.
6. Запустить static server4173, проверить HTTP/Worker/UI, обновить Memory Bank и evidence.
7. Проверить remote protection; при отсутствии применить принятую PR-only policy к main:
   active ruleset без bypass, запрет удаления/non-fast-forward, resolve review threads.
   Policy acceptance не меняется; это восстановление её remote enforcement.

## Verification Contract

| AC | Проверка |
|---|---|
| L1 | Node24/bd1.0.2 версии, официальный checksum Beads |
| L2 | `bash .agents/project/verify.sh`: type/build/unit/browser/reference/bootstrap/cloud fixtures |
| L3 | Exact checkpoint hash/9 IDs; status/AC/data/semantic dependencies после bd import; trusted export/restore/re-export |
| L4 | Native hook installed/active; safe read allowed, protected push **dry-run** blocked до выполнения |
| L5 | Все пять skills принимаются native loader; bodies равны frozen original, новых инструкций нет |
| L6 | localhost4173 HTTP200 и browser simulation/Worker без page errors |
| L7 | GitHub rules/branches/main возвращает active deletion/non_fast_forward/pull_request; bypass отсутствует |

FAST self-adversarial plan check: metadata не меняет governance semantics, поэтому
не повторяет PRODUCT planning и не выдаёт local smoke за независимую QA/B8.
Named risk Beads recovery регулируется уже PLAN_READY operator procedure.
`bd init` автоматически создаёт локальный commit; он не публикуется как product change.
Импорт может нормализовать dependency `created_by` к текущему actor — отдельно фиксировать.
Полная bootstrap acceptance/finalize/merge и второе физическое LAN устройство OUT OF SCOPE
данного локального запуска; остаются открытыми по исходным contracts.

Rollback: остановить только записанный server PID; cache/env удалить при ненужности;
metadata patch обратим через Git. Не удалять DB/snapshot и не force-push recovery.
