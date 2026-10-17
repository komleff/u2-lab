# GitHub Pages — фактическая публикация

2026-10-05. PM operational verification, FAST, без нового independent verifier launch.
Beads: `ulab-9aa.9`. [План/VC](../plans/2026-10-05-github-pages.md).

Публичный стенд: https://komleff.github.io/u2-lab/.
[Deployment](https://github.com/komleff/u2-lab/actions/runs/37268755843): completed/SUCCESS.
Source `0332d3b`, artifact `443af7b7d003909f267227cdef8408d56a21e311`.
Build: Node24.21.0, `npm run build -- --base=/u2-lab/ --outDir .overgate-runtime/pages-preview/u2-lab`.
Pages legacy source `gh-pages:/`, public=true, https_enforced=true, status=built.
При создании API вернул409 already enabled; GET подтвердил точную ожидаемую конфигурацию,
дополнительного изменения settings не потребовалось.

| Case | AC | Method | Result | Evidence |
|---|---|---|---|---|
| Публичные index, JS, CSS и Worker | AC1 | HTTPS curl с проверкой TLS; SHA256 bytes | PASS | 4 файла совпадают с локальным manifest |
| S и M14s, фиксация A, различия B | AC2 | Chromium local prefix + public URL | PASS | Все4 browser requests same-origin, errors/failed=[] |
| Мобильная ширина390px | AC3 | Chromium document.scrollWidth | PASS | 390px |
| Source/root, HTTPS, deployment, main | AC4 | GitHub API, Actions, git ls-remote | PASS | SUCCESS на artifact SHA; main9469d3e неизменён |

[Машиночитаемые результаты и точные SHA256](2026-10-05-github-pages.json).
Опубликованы только5 regular files: index,3 assets, пустой `.nojekyll`; secrets/cache/source
не включены. Локальный сервер4173 и его dist не изменены; временный prefix server4174 остановлен.

Public preview не означает full acceptance/merge. S/M остаются экспериментальными;
physical second device, Safari/Firefox и full12h через Pages не запускались в этом scope.
Runtime code unchanged; прошлые numeric/unit/review evidence сохраняются без нового full audit.
