# U2 Lab

Браузерная лаборатория оснастки, энергетики, тепла и добывающей работы кораблей U2.

## Текущий кандидат

Ship Fitting **v2.2**, интерфейс v4 и thermal diagnostics v0.1 доступны на
[GitHub Pages](https://komleff.github.io/u2-lab/?v=thermal-a6c7430).
Каталог0.2.3 содержит50 изделий, включая M-модули и гибридные комплектации.
Добывающий цикл включает порожний и загруженный полёты, добычу до заполнения трюма,
разгрузку и выбранное обслуживание станции. Поддерживаются варианты, графики,
анализ ограничений и JSON/CSV. [Текущие контракты и отчёты](docs/INDEX.md).

Публичная сборка — экспериментальный стенд из [Draft PR №10](https://github.com/komleff/u2-lab/pull/10),
runtime a6c7430; публикация не означает merge исходных веток. Публичные файлы,
запуск/рост времени/пауза и обе температурные полосы проверены; ошибок браузера нет.
Независимые affected QA и scoped Review подтвердили закрытие Legacy thermal protection/restart.
Физическое второе устройство на этой сборке, native hooks и полная bootstrap/operator acceptance — NOT RUN.
Числа с происхождением lab hypothesis не становятся каноническими ТТХ U2.

Самая первая [Power & Heat Lab](https://komleff.github.io/u2-lab/legacy-v1/) сохранена отдельно.
Обновлённый Legacy доступен по `?mode=legacy`. Legacy Power & Heat0.1.1 сохраняет модель `radiative-host-ledger-0.1` и exact replay
старых экспортов, включая внешний численный snapshot. Его ordinary LAN HTTP исправление
на `crypto.getRandomValues` сохранено. [Прежний отчёт](docs/handoffs/2026-10-05-mac-lan-http.md)
относится к0.1.1, а не к новой оснастке.

OverGate v4.0.0-rc.1, Memory Bank и исходные9 задач Beads подготовлены в
[Draft PR №1](https://github.com/komleff/u2-lab/pull/1). Планы независимо PLAN_READY.
Cloud read-snapshot/write-intents канал Beads прошёл QA C1–C6 PASS и scoped Review APPROVED.
Принятая cloud HOW-поправка разрешает обратимую подготовку runtime поверх bootstrap.
Полная приёмка B0/B6/B8 остаётся открытой: исходный CLI export/auth FAIL сохранён;
operator export/restore, native hooks, finalize/merge и второй LAN-клиент NOT RUN.
Canonical dependencies сохраняются; merge выполняет оператор после закрытия gates.

- [Документы](docs/INDEX.md)
- [Принятый продуктовый контракт](docs/product/power-heat-lab-v0.1.md)
- [План запуска](docs/plans/2026-10-05-u2-lab-launch.md)
- [План установки OverGate](docs/plans/2026-10-05-overgate-bootstrap.md)
- [Ревью плана](docs/reviews/2026-10-05-plan-review-round-2.md)
- [Ревью установки](docs/reviews/2026-10-05-install-plan-review.md)
- [Проверки и оставшиеся ограничения](docs/verification/bootstrap-evidence.md)
- [Текущий контекст](.memory-bank/activeContext.md)

U2 остаётся источником утверждённых правил и ТТХ. U2 Lab хранит эксперименты, версионные
наборы параметров и воспроизводимые результаты. Обнаружение, сенсоры и радары не входят в текущую лабораторию.

## Power & Heat Lab v0.1

Русскоязычный локальный browser lab: экспериментальные S/M, SI модель, Worker, рейсы, A/B, JSON/CSV.

```bash
git clone --branch feat/thermal-diagnostics https://github.com/komleff/u2-lab.git
cd u2-lab
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Откройте `http://localhost:4173` или `http://<LAN-IP>:4173`. Standalone `dist` также раздаётся
`python3 -m http.server 4173 --bind 0.0.0.0 --directory dist`.
[Руководство оснастки](docs/user/ship-fitting.md); [историческое руководство v1](docs/user/local-network.md), [источники параметров](docs/experiments/parameter-intake.md).

Runtime merge удерживается до acceptance bootstrap base; численные presets не утверждают U2 SKU.
