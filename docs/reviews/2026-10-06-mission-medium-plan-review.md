---
title: "Независимый Plan Review: интеграция миссии и модулей M"
status: PLAN_READY
version: "1.0"
date: "2026-10-06"
role: "Independent Reviewer / PLAN_REVIEW"
model: "Codex; точный deployment/model ID средой не сообщён"
related:
  - docs/plans/2026-10-06-mission-medium-delivery.md
  - docs/product/ship-fitting-v2.2-mission-brief.md
  - docs/product/ship-fitting-medium-modules.md
---

**PLAN_READY. Открытых BLOCKER: 0; ADVISORY: 0.** Найденный при этой проверке `PLAN-MISSION-B1` закрыт финальной редакцией плана v1.2 до запечатывания отчёта. Это отдельный gate миссии; предыдущие M Plan Review и Pony Code Review не заменены и не изменены.

Проверены достижимость M01–M09, интеграционные границы с ранее принятыми MF/HY, владельцы, зависимости, последовательность проверки и откат. Оператор требует настоящий цикл станция → астероид → станция и M-модули. План предусматривает одного Developer, два этапа и общий кандидат с 50 SKU. Повторного исследования ТТХ M и runtime-аудита всей лаборатории здесь нет.

## Привязка и authority

Контекст исходников: `ada38bc88e3a79e84e5a54dea071bf78126e1e01`; исходный контекст `545c7229b8a2359b001568888dcb6073921b8baa`; runtime Developer `bbe3fc9914109dfa2b671666fb0585bdcb38337c`. Все 24 связанные runtime/test blob совпадают между этими редакциями и проверенными рабочими файлами. Draft PR9 существует, base — `feat/pony-signature-slot`.

Reviewed WHAT/HOW/VC — **полные** документы, включая весь буквальный контракт M01–M09:

| Документ | Редакция / bytes | SHA256 |
|---|---|---|
| `docs/plans/2026-10-06-mission-medium-delivery.md` | v1.2 / 15024 | `dd585d3d481312c7b4286cedef80127ed0d864b4f35b7eaacfc4205c41e1bc53` |
| `docs/product/ship-fitting-v2.2-mission-brief.md` | accepted v0.3 / 22131 | `e0d414eb48be123902fb05af3078e58d87d4c540c54f6bf4892af67da93fd5f4` |
| `docs/product/ship-fitting-medium-modules.md` | accepted / 13078 | `e6088c0a48434674634d6c0f5c7a57347b6c33245ad66c5d5a15ecb8bce91b70` |

Привязка сформирована на exact working bytes v1.2: HEAD `ada38bc…` ещё содержал v1.1. PM сообщил о последующем точном document-only commit/push `7a4cd5e`; этот новый Git commit не выдаётся за независимо проверенный runtime. Разрешение DEV относится к указанным выше bytes и требует их commit до реализации; Draft PR до реализации уже создан. Правила роли: RV_ROLE 2.1 и PM_ROLE 3.0, §3.1.

Собственный sidecar: `.overgate-runtime/2026-10-06-mission-medium-plan-review-evidence.json`. В нём явно записаны все пути, Git blob, bytes/SHA256, полное содержимое трёх контрактов и границы проверки. **Content-Fingerprint `fef78c6ce4a65d9fccefc790f9094f27ddbdf7abce7cc1860f6774815e805e28`.** Рецепт: SHA256 UTF-8 canonical JSON объекта `contract`, рекурсивно отсортированные ключи, compact separators, `ensure_ascii=false`, без завершающего LF; payload 56034 bytes. Весь VC включён, а не только строки M09. Sidecar 60776 bytes / SHA256 `b8d24d847b3eebcba12c9ebb5968d55711b2fa63898bb5bbb9c32bd6b721ab11`.

## Вывод по достижимости

| Граница | Результат проверки плана |
|---|---|
| M01/M07/M08 — выбор модели и запуск | Новый mission tag и явные fresh UI conditions; импорт берёт фактический tag. Fit-only import не меняет catalog stamp. Old direct `makeMiningRun` и старые timed replay сохраняются. Первый native Start без предварительного Tab — явный сценарий QA. |
| M02/M03 — полёт | Движение использует фактический `forceN:<instanceId>` общего ledger; разгон и торможение расходуют топливо/энергию и дают тепло один раз. Приняты p=γmv и c′=3000, аналитический тормозной oracle, изменяющаяся масса и отсутствие ускорения от потери массы на coast. Нет бесплатного прибытия при исчерпании топлива, нулевой тяге или H. |
| M04 — цикл | Full hold — основной режим, частичное ограничение продолжает добычу. Опциональный first-stop имеет отдельный смысл. Разгрузка и дозаправка происходят в конце station service; received/consumed/remaining и mined/delivered/onboard различены. Horizon внутри фазы сохраняет реальные остатки. |
| M05/M06 — результат и сравнение | Доставка, время, события, фазы и причины остановки доступны для анализа. Новому tag нужна предусмотренная validation завершения раньше H: старое требование `complete.time == H` остаётся у timed модели. Это обязательная реализация M05/M06, а не повод менять старую численную ветку. Сравнение явно учитывает mission conditions/model tag. |
| M09 — проверяемый fixture | Финальная редакция физически помещается в два payload slots Pony; convergence имеет численные допуски и одинаковый исход остановки, а не предписанного победителя. |
| M + HY, зависимости и откат | Предыдущий M PLAN_READY сохранён; Pony structural-binding B1 уже APPROVED/закрыт. Старые издания и numeric snapshots не перекомпилируются. Новые flight/controller/factory — явные будущие владельцы; старые tag/артефакты сохраняют путь отката. |

Тестовая последовательность позволяет локализовать ошибки: аналитический и coupled flight → цикл/ledger → IO/compatibility → MF/HY → native desktop/LAN touch workflow → M09 convergence/H3600. Проверка нового mission tag не подменяется старой матрицей или прежним 12h. Гравитация, столкновения, IFCS, экономика, обнаружение и новый redesign в план не добавлены.

## Закрытая находка

**PLAN-MISSION-B1 — BLOCKER, CLOSED до seal.** Location: M09 v1.1 и уточнявшийся fixture. Требование 1/2/3 съёмных Industrial-S при 2/1/0 cargo модулей нуждалось в трёх payload slots, тогда как у Pony их два; отключение встроенного лазера не создаёт слот. Это делало AC невыполнимым без изменения корпуса вне scope.

Минимальное исправление принято в v1.2: существующие пресеты Pony, **включённый** `builtin:laser` UNKNOWN/G0, плюс 0/1/2 existing local `pony-removable-laser-S-G0` с теми же 1 MW и η=.35; workGroup включает все 1/2/3 лазера. Оставшиеся 2/1/0 slots содержат `cargo-bulk-S` по 24 SCU; с built-in cargo 12 итог A/B/C — **60/36/12 SCU**. Данные и формула existing preset проверены непосредственно в catalog/hulls. Нет смешанного Industrial G2, нового SKU или изменения слотов. Раннее указание отключить built-in superseded. Одновременно исправлен технический owner path на `src/app/fitting-session.ts`; открытой advisory по нему нет.

## Явные reviewed paths и пределы evidence

Следующие владельцы читались по относящимся к factory/dispatch/ledger/validation/conditions/result/comparison участкам; это не заявление о новом полном code review каждого файла. Exact blobs и SHA256 каждого — в sidecar:

```text
src/model/v2/types.ts
src/model/v2/step.ts
src/runner/fitting-run.ts
src/runner/mining-metrics.ts
src/runner/run.ts
src/runner/protocol.ts
src/scenarios/fitting.ts
src/io/fitting-json.ts
src/io/fitting-result.ts
src/app/fitting-workspace.ts
src/app/fitting-session.ts
src/app/fitting-ui/conditions.ts
src/app/fitting-ui/compare-view.ts
src/app/fitting-ui/result-context.ts
src/app/fitting-ui/lab-view.ts
src/app/fitting.ts
src/fitting/editions.ts
src/fitting/catalog.ts
src/fitting/data/modules.json
src/fitting/data/hulls.json
tests/fitting/catalog-editions.test.ts
tests/fitting/pony-signature-slot.test.ts
tests/fitting/fixtures/catalog-0.2.0-digests.json
tests/fitting/fixtures/catalog-0.2.1-pony-digests.json
```

Own evidence: полное чтение трёх контрактов, независимая проверка привязки/byte equality, конкретных владельцев и допустимости M09. Inherited: M PLAN_READY (`6f56cab3…`) и Pony scoped Code Review r2 APPROVED (`5baa88e2…`), а не новое исполнение их QA. Старые digest fixtures привязаны, но здесь не запускались.

**NOT RUN / NOT REVIEWED:** будущая реализация mission helpers и её QA, runtime probes, unit/browser/build/guard campaign, convergence/H3600, fresh 12h, вся старая матрица/137-path proof, ZIP/HTTP/package verification, physical/native/public/main acceptance, повторная M ТТХ/thermal проверка. Плановая готовность не означает, что новая миссия уже реализована или принята runtime QA.

Подпись: Independent Reviewer, Codex; точный ID модели недоступен. Отчёт и sidecar запечатаны отдельно от продуктовых файлов. Узкий freeze прочитанной поверхности **RELEASED** после seal; дальнейший exact commit и DEV release выполняет PM. Reviewer — **SEALED / IDLE**. Публикация — только PM; прежние отчёты неизменны.
