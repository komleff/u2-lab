# Публичный Power & Heat Lab

Откройте https://komleff.github.io/u2-lab/ в браузере. Авторизация, локальный сервер
и установка зависимостей не нужны. Расчёт выполняется в браузере через Worker.
S/M — экспериментальные наборы параметров, не утверждённые SKU U2.

Hosting: GitHub Pages, ветка `gh-pages`, корень `/`, HTTPS. Ветка содержит только готовую
сборку и `.nojekyll`. Source PR1/PR2 остаются отдельной линией приёмки и operator merge.
[Проверка текущей публикации](../verification/2026-10-05-github-pages.md).

## Обновление публикации

После проверки выбранного source candidate соберите с base `/u2-lab/`:

```bash
source .overgate-runtime/env.sh
npm run build -- --base=/u2-lab/ --outDir .overgate-runtime/pages-preview/u2-lab
```

В отдельном checkout существующей `gh-pages` замените только статические файлы сборки,
сохраните пустой `.nojekyll`, проверьте manifest и prefixed browser smoke. Создайте commit
поверх текущего remote tip и выполните обычный fast-forward push. Force push не нужен.
GitHub Pages сам запускает deployment; дождитесь SUCCESS и проверьте публичный URL,
Worker, S/M, A/B и SHA256 ресурсов. Исходный main агент не обновляет.

Для отключения публичного preview оператор использует Settings → Pages → Unpublish site.
