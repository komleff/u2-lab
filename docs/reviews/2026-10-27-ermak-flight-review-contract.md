---
title: "Review Contract: E1–E7, версия полёта2 и фактический счётчик"
status: "proposed / до independent PLAN_READY"
version: "0.1"
date: 2026-10-27
beads: [ulab-9do, ulab-b3y]
---

# Review Contract PR53

WHAT: прямое поручение оператора27.10 и PR52
`575f02ddf58a227111ce9b7f6d55919d9c9fc34a`, полный раздел «Передача агенту VS Code».
HOW: [план0.2](../plans/2026-10-27-ermak-flight-counter.md), EF01–EF08.
Точные relevant contract bytes — единственный CONTRACT-блок тела PR53 без marker
lines, включая финальный LF. PM сохраняет его hash перед Plan Review/DEV_RELEASE.

## Current package и граница review

GitHub base main `3b6c462…`; inherited physical/runtime source — PR51 C2
`cb67fcf…`. Все его данные/материалы/TTX и18 measured receipts сохраняются.
Прежние Plan/QA/Code Review физического пакета учитываются по content-equivalence
для неизменных paths; это не новые прогоны и не новый ручной review generated JSON.
Новая runtime surface — delta относительно C2: явная mission.version2,
event/variable-force flight, transient planning и E6. Модифицированные файлы
и реальные callers читаются полностью в scoped Review; новые QA адресуют E1–E7
с разделением inherited evidence и собственных новых исполнений.

Новый PRODUCT budget5: Plan Review1, QA2, scoped Code Review3, reserve2.
Один основной Developer; PM не реализует runtime. Только адресованный AC/FAIL/
named risk разрешает additional verifier; base movement само по себе его не требует.

## Обязательные поверхности

| Поверхность | Что проверить |
|---|---|
| Версия/IO | mission1 literal, включая C20.3.4; fresh current0.3.4 →2, older/explicit/imported версии не меняются; unknown reject; checkpoint/copy/frozen/reopen и new→old fail-closed |
| Честная геометрия | исходные E4 FAIL/причина закрыты; actual arrival использует прежние x1e-3m/v1e-4m/s, нет широкого clamp, скрытого force gain или teleport; слишком поздний checkpoint не получает невозможного обещания |
| Coupled physics | реально доступная тяга, impulse, fuel/cargo mass, battery/thermal/power/прочность; forecast вызывает kernel на клоне, actual resources/RNG тратятся один раз |
| Prefix/scheduling | общий first tick и1200s prefix при H1/1200/3600/10800 и CPU slicing совпадают по физике; observation end/wall clock не определяют команду |
| Planning job | Pending только вне persisted state, без actual commit/metrics/events; Step не теряется на0steps; Pause/Cancel/reset/checkpoint во время long forecast; cold restore/cache eviction numerical-exact |
| Slow/no-force | физически feasible1059s stopping не отсекается256 или H1; нулевое питание не создаёт service; current authority и computational/numerical outcomes различны |
| E6 shared UI | explicit scale vs actual integer counter из того же result.state; delivered/onboard точные, no-data не0, selected bucket/frozen/current fit не подменяют результат; desktop/mobile и другие chart consumers сохранены |
| Полезные опыты | source52 reproducible, новые1200/3600/10800s/повторные циклы измеряют работу, доставку, энергию/топливо, пики и ограничения, а не только finalT; fixed-heat вывод не выдан за mission norm |

Все ordinary gates/особые баки/D40% own-loss after efficiencies, generator-only
calibration, radiatorA/epsilon/mass/C и powered-off service300K/G10000 неизменны.
Дополнительные численные пределы автопилота или TTX не принимаются как канон.
Горячая среда не обещает работоспособность любомуfit; cold/heater остаются.

## OUT и честные пределы

Экономика/кошелёк/тарифы/покупка ресурсов/страховка/торговля/прогрессия и новая
repair/failure/exposure система OUT. U2 production/.NET/Unity/server/protocol,
Pages/deploy и AI merge OUT. U2 restart-schema blocker230/480 сохраняется.
Не принимать detection как новый product scope; shared UI regressions запрещены.
Не заявлять безграничную/многосуточную квалификацию по10800s.

## Вердикт и binding

Report публикует actual role/model, source contract/task bytes, base/head,
tested/reviewed paths с Git blob IDs, content/envelope fingerprints, собственные
и inherited checks, NOT RUN и findings severity. BLOCKER — достижимое нарушение
IN-scope AC/invariant; advisory не требует confirming pass. Устранённый BLOCKER
проверяется affected QA/scoped re-review, не новым whole-app review.
Final current-HEAD normal guard и CI обязательны. Merge — операторский.
