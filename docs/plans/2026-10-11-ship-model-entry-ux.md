# Понятный вход в экспериментальную модель корабля

> Исполнение: один основной Developer, `superpowers:subagent-driven-development`.
> PRODUCT: independent Plan Review → PLAN_READY → DEV → QA → scoped Code Review.
> Статус работы ведётся только в Beads `ulab-9aa.18`, не checklist этого документа.

**Цель:** ГД без знания внутренних версий выбирает готовый корабль или открывает свой JSON,
видит, что открыто, и может запустить первый опыт; внедрены UI-A1/A2/A3.

**Основание:** решение оператора 2026-10-11; current owner
`docs/product/ship-fitting-gd-workspace-v4.md` v0.8 / UI4.8, WF01/03/06/12/13/14;
`docs/user/ship-fitting.md`; [итоговое ГД/UX/UI ревью PR #22](https://github.com/komleff/u2-lab/pull/22#issuecomment-6103661908).
Принятое WHAT достаточно для PASS_THROUGH: новый spec, U2 согласование и новый паспорт не нужны.

**Архитектура:** обновить presentation/entry orchestration существующего `/4` workspace.
Открытие файлов использует существующие versioned validators/readers; Worker и численные
данные не меняются. Стек: TypeScript, DOM/Vite, Vitest, Playwright.

## Target → as-built → gap

База: `d03fb99ac5c34914843baf765edc8b3a9a994bae` / PR #22; новая stacked ветка
`feat/ship-model-entry-ux`. Уточнение оператора: старый Спутник в текущем экране не запускается
из-за отказа model toggle; native preset не заменяет исправление этого source flow.
После адресного smoke исправленная сборка заменяет preview4197; baseline evidence сохраняется.

На первом экране нет `/4` fit, запуск выключен. Рабочий chooser спрятан под
«Новый native 0.3.0 fit» с raw IDs; importer `/4` смешан с transport controls.
Model-select игнорирует выбранное значение и не является рабочим переключателем.
Старые JSON открываются через прежний редактор; из нового экрана этот маршрут неясен.
A/B equality не учитывает измеренные initial T/mode; масса отдельных модулей показана raw decimal.
JSON уже имеет CSS max-height450px: исправить группировку/достижимость, а не обещать отсутствующий лимит.

## Scope и ограничения

- Первым поставить «Открыть корабль»: Спутник, Мир, отдельная Стелс-сборка;
  видимое открытие JSON; текущая старая сборка с человеческим именем и понятным переносом
  preview → diff → Apply → запуск. Unique compatible template можно предварительно выбрать
  в форме, неоднозначный выбор остаётся явным; никаких auto-Apply/скрытой миграции.
  Показывать выбранный корабль, тип файла и version badge, не ложный model toggle.
- Пустой экран объясняет три действия: выбрать/открыть → задать условия → запустить.
  При disabled запуске есть причина и достижимый следующий шаг. Не автозагружать канонический fit.
- Для старого JSON явно показать старую модель и открыть её существующим reader/editor.
  Старый fit можно затем явно скомпилировать; старый result не пересчитывается и не выдаётся за `/4`.
  Переход в прежний редактор не должен молча уничтожать `/4` draft/result: перед уходом
  показать границу сохранения и обеспечить существующий JSON export/явное действие пользователя.
- Сохранить A/B, draft/active/measured/checkpoint ownership, readonly complex imported task,
  candidate/noncanonical labels. Busy включает paused: редактирование/импорт/смена workspace запрещены.
- OUT: полный slot/module editor `/4`, новые presets/TTX, physics/catalog/kernel/runner/IO-schema,
  старый default, скрытая миграция/history recompute, detection acceptance, U2 сервер, deployment,
  guards/dependencies и полировка всего прежнего интерфейса. Ограничение `/4` редактора обозначить честно.
- Человеческие подписи русские; identifiers/точный JSON сохраняются. Не заявлять, что вся модель
  канон или server/LAN проверены; убрать устаревшую безусловную надпись «QA/Review ещё не завершены».

## Один deliverable: entry + рекомендации

Основные paths: `src/app/ship-model.ts` — render/events; `ship-model-workspace.ts` — только
UI draft/validated opening если необходимо; `fitting.ts` — existing legacy entry callback;
`fitting-ui/ship-model-results.ts` — A/B presentation; `fitting.css` — scoped experimental styles;
`docs/user/ship-fitting.md` — короткий новый маршрут. Малый presentation helper допустим при необходимости.
Не переписывать архитектуру и не расширять allowlist молча.

1. Developer пишет failing tests: видимый chooser/open, false-toggle regression,
   atomic invalid/future/old import, measured A/B initial T/mode. Запускает адресные tests, фиксирует RED.
2. Реализует entry routing на существующих `loadPreset`, `importDocument`, legacy readers и
   `previewCompilation`/`applyCompilation`. Routing validation завершается до смены workspace;
   при async file read проверяется актуальный owner/busy, устаревший read не применяется.
   Native fit не смешивается с непредставимым imported task; объяснить сохранённую задачу/отказ.
3. A1: у обоих **измеренных** A/B вывести initial T и mode из `result.spec.initialState`.
   Равенство/предупреждение учитывать T/mode вместе с существующими environment/observer/profile/task/duration.
   Не менять immutable snapshots или расчёт ради UI.
4. A2/A3: отделить основной запуск, transport, файлы, restart/repair; краткие summaries,
   bounded raw JSON; человекочитаемые массы/единицы/decimals через существующие formatters;
   небольшой primary accent запуска. Не прятать критические действия/причины отказа за технической свалкой.
5. GREEN: address tests, typecheck/build, real Worker browser flow и обычный
   `.agents/project/verify.sh` (без обходов). Commit на feature branch, отчёт freeze/diff/commands.
   PM: QA по контракту ниже → один scoped Code Review; blocker fixes тем же Developer,
   affected QA/re-review. Каждые три фактических review/fix итерации — PM_ERR/DOC_PR самоаудит.

## Verification Contract

| AC | Expected / edge / error | Проверка |
|---|---|---|
| UE-01 | Fresh opt-in: понятные Спутник/Мир/Стелс, текущая старая сборка и «Открыть JSON» доступны до technical details; нет ложного model toggle. Native выбор и перенос именно source старого Спутника делают запуск достижимым, не заменяя source новым reference. | Browser fresh entry, все3 presets; source старого Спутника → preview/diff/Apply → actual Worker complete; desktop screenshot. |
| UE-02 | `/4` fit/run/result открываются с точным type/version; replay/checkpoint остаются literal. Старый fit/result открываются явно в старой модели; fit → explicit preview/diff/apply → `/4`, source не переписан. | Unit source/literal/atomic; browser реальные file inputs для fit/run/result и legacy fit/result; explicit compile. Не выдавать автоматизацию за OS chooser. |
| UE-03 | Malformed/future/unsupported/cancelled file, owner change/busy during async read сохраняют прежние draft/result/active. Paused locked; явный переход legacy не теряет `/4` незаметно. Complex task сохранена/readonly, отказ объяснён. | Browser + workspace unit: snapshots до/после, busy/async и invalid; прежние UI-B1/B2 tests. |
| UE-04 | A/B показывает измеренные initial T/mode обоих; различие T или mode запрещает надпись об одинаковых условиях. Равные условия подтверждаются, old snapshots/export неизменны. | Results unit: equal / onlyT / onlyMode; measured-owner/stale browser regression. |
| UE-05 | Основной workflow/файлы/transport/repair различимы; bounded JSON, читаемые массы, primary запуск. 1440/820/390: ship→conditions→start→result и открытие файлов достижимы, page overflow0, основные targets≥44px; numeric/unit не распадаются. | Browser размерные/DOM assertions, screenshots; PM desktop GD/UX/UI smoke. Manual physical/touch/OS download-import отдельно NOT RUN если недоступны. |
| UE-06 | Physics/catalog/runner/IO-schema/dependencies/guards/старый default unchanged; полная обычная regression PASS. Публичная инструкция соответствует реальным controls, без ложного canonical/server readiness. | Diff allowlist, `.agents/project/verify.sh`, typecheck/build/tests; source/guide сверка. |

**Named risks:** atomic межмодельное открытие; async ownership; случайная потеря draft при навигации;
ложная A/B сопоставимость. QA и Reviewer адресуются только UE-01–06/этим рискам, не повторяют
приёмку неизменившегося kernel. PRODUCT budget5 launches; source review считать iteration1.

**Rollback:** operator revert только нового UI diff; прежний opt-in и JSON readers остаются.
Никаких in-place migrations и изменений сохранённых данных. PR stacked over PR #22 / #21;
base/bootstrap/external gates сохраняются, merge только оператор. До QA/review новый preview кандидат.
