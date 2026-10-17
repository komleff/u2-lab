# Tech Context

Предложенный стек: TypeScript + Vite, простой browser UI, Web Worker, локальный HTTP
сервер для раздачи static assets. Backend симуляции не требуется.
Версии зависимостей будут закреплены lockfile при реализации. Test runner — Vitest,
browser smoke — Playwright; toolchain проверяет Developer до установки зависимостей.
OverGate source: v4.0.0-rc.1 / 633937250fa8f47b49f928c1d8781ab17fe8c8e3.
Beads route: bd 1.0.2 + origin/beads-backup; не Dolt remote.
Сейчас нет gh/authenticated CLI; GitHub connector не предоставляет create repository.
Live runtime activation и продуктовые тесты ещё NOT RUN.
