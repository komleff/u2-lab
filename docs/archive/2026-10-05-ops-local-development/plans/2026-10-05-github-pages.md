# GitHub Pages — публикация готового стенда

Запрос оператора: сделать существующий Power & Heat доступным всем.
Режим FAST: эксплуатационная публикация статического артефакта, без изменения runtime.
Источник сборки: `0332d3b`, текущая `ops/local-development`; product runtime соответствует PR2.

## Target / as-built / gap

Target — публичный HTTPS стенд. As-built — проверенный локальный runtime и сборка;
`main` содержит только исходный README, PR1/PR2 остаются открытыми. Gap — Pages hosting
и base path `/u2-lab/`. Build-time CLI base решает путь без изменения исходного кода.

## Scope и последовательность

1. Собрать с `--base=/u2-lab/` в отдельный ignored output; `.nojekyll`.
2. Проверить prefixed local hosting, Worker, S/M, A/B и viewport390px.
3. Опубликовать только пять regular artifact files в новой `gh-pages`, обычным push.
4. Проверить Pages source branch/root, HTTPS и успешный deployment.
5. Проверить публичные bytes и Chromium smoke; записать evidence/Beads/Memory Bank.

Вне scope: изменение runtime/параметров, CI исходного main, operator merge и закрытие
bootstrap acceptance. Публичный preview не меняет status S/M experimental.

## Verification Contract и self-adversarial check

- AC1: HTTPS URL публичен, index/assets HTTP200, SHA256 bytes совпадают с manifest.
- AC2: Worker исполняет S и M14s, A/B показывает различия; нет exceptions/failed requests.
- AC3: viewport390px не имеет горизонтального overflow.
- AC4: source/root верны; Pages Actions SUCCESS на artifact SHA, remote main неизменён.
- Errors: при ошибке deployment не объявлять URL готовым; при invalid prefix вернуть build step.
- Invariants: только пять статических файлов, без secrets/source/cache; no force/main merge.

Named risk — project prefix и Worker URL: закрывается actual prefixed и live smoke.
Push отдельной orphan ветки позволяет публикацию без преждевременной интеграции source PR.
Self-adversarial plan check: PASS; новый product WHAT/runtime surface отсутствует.

Rollback: оператор может отключить Pages в Settings → Pages; будущие deployment commits
создаются поверх текущего gh-pages tip обычным fast-forward, при необходимости revert.
