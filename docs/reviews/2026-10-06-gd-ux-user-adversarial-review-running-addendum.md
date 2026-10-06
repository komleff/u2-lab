---
title: "Уточнение evidence: навигация v3 во время RUNNING"
status: FINAL
version: "1.0"
date: "2026-10-06"
related:
  - docs/reviews/2026-10-06-gd-ux-user-adversarial-review.md
  - docs/product/ship-fitting-gd-workspace-v4.md
---

# Уточнение неизменяемого отчёта

Основной отчёт —31779B, SHA256 `805844ab6a1884a24714589cdff7b632b65797683de5c8c85308728e26ffb7d4` — не изменён. При его seal исходные шесть сквозных browser chains проверяли переходы **после Pause**. Фраза о работе переходов в active/paused была слишком широка для того browser evidence: RUNNING подтверждался тогда лишь source-read отсутствия disabled/active guard. Жалобу оператора нельзя было опровергать paused-проверкой.

Теперь QA независимо выполнила ровно недостающий named slice: Start → Оснастка → Сравнение → Power & Heat **без Pause**, horizon180s, speed1. Во всех переходах статус «Выполняется», navigation buttons disabled=false, один runId в каждой цепочке, реальный Worker продолжает расчёт. После проверки сделана штатная Cancel; pageerrors/requestfailed отсутствуют.

| Срез | Время до/после навигации, s | В Оснастке / Compare / Lab, s | runId | Origin |
|---|---|---|---|---|
| Desktop1440 | 0.11 → 1.32 | 0.44 / 0.80 / 1.24 | `d93b9e2ef2d74663b3d1db22b60e66dc` | `http://localhost:4183/` |
| True390 | 0.09 → 1.31 | 0.43 / 0.80 / 1.23 | `2ca9aa026f41792ce962e308ccf3d74d` | `http://192.168.68.65:4183/`, secure=false |

Reviewer прочитал raw records/steps и QA summary; browser execution принадлежит независимой QA, не Reviewer. Primary HEAD `131015414b12995af355de42f25d019862413c83`, v3 runtime `30a1c9b0953bf61723cd8a9deb570044e1f26862`. Новых own probes, fixes или расширения review нет.

Raw evidence в primary `.overgate-runtime/`:

- `gd-running-navigation.json`, SHA256 `c08d7361b3afb219c9729e09f9665c468f6c0d78e13274ad4b8bf3e91c0f1aa1`;
- `gd-v3-1440-running-navigation.json`, SHA256 `1e5187490c4fa1a75f7aac195495df0e54bb12402dada5408bd74683ecf6f286`;
- `gd-v3-390-running-navigation.json`, SHA256 `946731ff11ac967b9d741dce30709074cebb1bb71e5b75fbc72c7d26c3f747f1`;
- screenshots `gd-v3-1440-running-compare.png`, `gd-v3-1440-running-lab.png`, `gd-v3-390-running-compare.png`, `gd-v3-390-running-lab.png`.

**Итог:** nav lock не воспроизведён теперь и во время genuine RUNNING в двух проверенных окружениях. Это не утверждение обо всех браузерах/условиях. GD-UX01 остаётся: области скрываются, scroll сбрасывается, шапка уезжает, целевой workflow разорван. Общий NEEDS_REVISION и12 findings не изменены; соответствующий runtime факт уточнён, а исходная граница evidence сохранена.

Подпись: независимый Reviewer, session `/root/fitting_adversarial_review`, Codex; точный provider/model ID среда не сообщила. Никаких продуктовых изменений или разрешения merge. Аудит и factual addendum завершены.
