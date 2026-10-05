# U2 Lab

Легковесная браузерная лаборатория энергетики и тепла кораблей U2.

Первый модуль — Power & Heat: конфигурации S и M Civilian, воспроизводимые сценарии,
графики, журнал событий и сравнение A/B. Запуск сначала в локальной сети.

## Текущий статус

Браузерный Power & Heat **0.1.1** подготовлен для локальных экспериментов в
[Draft PR №2](https://github.com/komleff/u2-lab/pull/2), ветка `feat/power-heat-lab`.
Исправлен запуск по обычному LAN HTTP: runId создаётся через `crypto.getRandomValues`,
доступный без secure context. Исходный non-local HTTP failure сохранён; affected QA PASS,
scoped Code Review APPROVED в проверенной области. [Отчёт для агента на Mac](docs/handoffs/2026-10-05-mac-lan-http.md).

56 unit tests,6 Chromium checks,typecheck/build — PASS;1 screenshot-only test SKIP.
[CI точного исправления](https://github.com/komleff/u2-lab/actions/runs/37272666370) — SUCCESS.
Упакованная и распакованная standalone0.1.1 проверена в localhost и non-local HTTP browser
origin с `isSecureContext=false`; фактический Xiaomi/второе LAN устройство — NOT RUN.
[Актуальные отчёты](docs/INDEX.md#проверка-реализации) сохраняют исходные failures и closures.
Предшествующий Developer12h replay132.595s относится к неизменным физическим source paths;
новый локальный12h ради UI fix не запускался. Полная bootstrap/operator acceptance и merge
readiness не заявляются. Пресеты S/M экспериментальные.

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
наборы параметров и воспроизводимые результаты. Обнаружение, сенсоры и радары — следующий
этап после согласования энергетики, тепла и параметров модулей.

## Power & Heat Lab v0.1

Русскоязычный локальный browser lab: экспериментальные S/M, SI модель, Worker, рейсы, A/B, JSON/CSV.

```bash
git clone --branch feat/power-heat-lab https://github.com/komleff/u2-lab.git
cd u2-lab
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Откройте `http://localhost:4173` или `http://<LAN-IP>:4173`. Standalone `dist` также раздаётся
`python3 -m http.server 4173 --bind 0.0.0.0 --directory dist`.
[Подробное руководство](docs/user/local-network.md), [источники параметров](docs/experiments/parameter-intake.md).

Runtime merge удерживается до acceptance bootstrap base; численные presets не утверждают U2 SKU.
