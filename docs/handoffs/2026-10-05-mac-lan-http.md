# Отчёт и передача агенту на Mac: LAN HTTP, версия 0.1.1

Snapshot 2026-10-05. Перед продолжением сверить свежие PR/branch SHA; этот отчёт не заменяет current owner и Verification Contract.

## Назначение и authority

PROJECT: `komleff/u2-lab`, Power & Heat Lab.
BOOTSTRAP: OverGate `v4.0.0-rc.1`, frozen source `633937250fa8f47b49f928c1d8781ab17fe8c8e3`.
PIPELINE: PRODUCT, accepted plan → DEV → affected QA → scoped Code Review. PM делегирует runtime Developer.
ROLE: локальный PM; ROLE OWNER: `.agents/PM_ROLE.md`; ROLE MODE: PRODUCT coordination. Runtime fix выполняет Developer; при Code Review используется `.agents/RV_ROLE.md`, режим CODE_REVIEW.
MISSION: подтвердить запуск версии0.1.1 на реальном Xiaomi через обычный LAN HTTP и продолжить отдельную operator acceptance bootstrap.

Первые источники: `AGENTS.md`, `.memory-bank/activeContext.md`, `.memory-bank/progress.md`, `docs/INDEX.md`, затем точные owner paths. Продукт: `docs/product/power-heat-lab-v0.1.md`; план: `docs/plans/2026-10-05-u2-lab-launch.md`; приёмка: `docs/verification/power-heat-v0.1-contract.md`, неизменные P1–P14. Не искать канон глобальным поиском по старым GDD.

REPOSITORY: https://github.com/komleff/u2-lab
PR: https://github.com/komleff/u2-lab/pull/2, open/draft; base branch `bootstrap/overgate-v4`; bootstrap PR https://github.com/komleff/u2-lab/pull/1.
BRANCH: `feat/power-heat-lab`.
BOOTSTRAP HEAD SNAPSHOT: `319da067b715edac16655e0f2ef7b7e28efc306d`; feature historical stack ancestor `c226669bcaae95284df18bd5d22824a1f6a7a00d`. Это разные ссылки; перед интеграцией проверить фактическую base branch.
MAIN SNAPSHOT: `9469d3e8998dada5ec3a6f99712fae8345fb3f7f`; облачная сессия main не меняла.
FIX SOURCE CANDIDATE: `fead162208d1e7d1918f36d8f51089110e924c51`, tree `e564b8ca7c7e86dc6a7322c64ca942286cd1d4e4`.
QA CANDIDATE: `c2ea755cc47ca9f8f3ac62dc0da8fc45e1abfa2d`, tree `b319501e5ab5cf6f903ba54b4e1710233b6ffaa0`; код идентичен fix source, добавлен только исторический FAIL report.

## Сообщение пользователя и установленная причина

На ноутбуке страница работала; Xiaomi Pad8Pro/Chrome по `http://192.168.68.65:4173` открывал интерфейс, но симуляция не запускалась. Точный URL рабочего ноутбука и версия Chrome планшета не были предоставлены.

В `src/app/main.ts`, `reset()` перед отправкой команды Worker безусловно вызывался `crypto.randomUUID()`. Chromium предоставляет этот API только в secure context. `localhost` считается доверенным; обычный удалённый HTTP origin — нет. На таком origin API отсутствует, возникает `TypeError: crypto.randomUUID is not a function`; Start/Reset/Step прерываются до Worker, время остаётся0.

Сбой воспроизведён до исправления на реальном Chromium153: localhost secure=true/API=function работал, non-local HTTP secure=false/API=undefined падал. Для non-local origin браузеру возвращались собственные собранные assets через Playwright request interception. Флаги доверия/security-context не менялись. Это проверяет настоящий browser API gate, но не физический LAN, firewall или сам Xiaomi.

Первичный smoke проверял две независимые localhost browser contexts. Он не покрывал non-local HTTP secure-context boundary. Это пробел первоначальной проверки, теперь добавлен постоянный regression case.

Официальное описание API: https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID и https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues.

## Исправление и границы

`reset()` создаёт opaque runId из16 криптографически случайных байтов через `crypto.getRandomValues(new Uint8Array(16))`, кодирует32hex символа. `getRandomValues` доступен в insecure context. Worker сравнивает ID как строки; UUID format не требуется. Каждый reset/new run получает новый ID, commandId продолжает расти, старые run/chunk/control-ack сообщения отбрасываются существующими правилами.

Версия приложения/package/lock/footer —0.1.1. В шапке остаётся название лаборатории v0.1; точный patch marker находится в footer: `Power & Heat v0.1.1`. Физические model/catalog/schema версии, параметры, dt, энерго/тепловая модель и Worker protocol не менялись. Зависимости не добавлены и их resolutions не менялись. HTTPS, Chrome security flags и новая серверная служба для запуска не требуются.

Production/test delta: `src/app/main.ts`, `tests/browser/lab.spec.ts`, `package.json`, `package-lock.json`. Остальные изменения исправления — Developer evidence. Fingerprint этих4paths + entire9901byte VC: `ad7d1b83cc852ea56c5291b26ea7236e4587a0bebec0cd7ec340071208a27ac8`.

## Проверки и доказательства

| Проверка | Исполнитель / результат | Границы |
|---|---|---|
| Первичное воспроизведение non-local HTTP | PM + независимая QA: FAIL до исправления | Настоящий secure=false origin; физический планшет не участвовал |
| TDD regression | Developer: RED → GREEN | Start/reset/new run/step,3 разных32hex runId, нет page errors |
| Быстрые tests/type/build | Developer:56unit PASS;6browser PASS;1screenshot-only SKIP; typecheck/build PASS;26bootstrap checks PASS | screenshot SKIP не функциональный тест |
| GitHub Actions exact fix source | SUCCESS: [37272666370](https://github.com/komleff/u2-lab/actions/runs/37272666370), [37272662118](https://github.com/komleff/u2-lab/actions/runs/37272662118) | Оба head=`fead162208d1e7d1918f36d8f51089110e924c51`; не физический LAN test |
| Affected QA | Независимая QA: PASS | Own build + two-origin Start/reset/new M/Step/stale isolation; физический Xiaomi NOT RUN |
| Scoped Code Review | APPROVED, BLOCKER=0 / ADVISORY=0 | 4changed code/test/package paths + ENTIRE VC; static/evidence review без расширения экспериментов |
| Упакованный/распакованный ZIP | PM: CRC/digests PASS; S/M14s completed; A/B;390px;2local contexts;4same-origin requests;0page errors | Тестировалась именно извлечённая поставка |
| Извлечённый ZIP под non-local HTTP | PM: secure=false,randomUUID undefined,getRandomValues function; запуск completed,0page errors | Origin emulation собственными assets; физический Xiaomi NOT RUN |
| Численная длительная физика | Сохранены предшествующие evidence физически неизменных source paths: Developer S12h/dt0.01,4.32Mticks/132.595s | Новый локальный PM/QA12h ради этого UI fix не запускался; CI evidence отдельно |
| Реальный Xiaomi/второе LAN устройство | NOT RUN облачной сессией | Следующий адрес локальному агенту/оператору |

Reports, неизменные producer evidence:

- Developer: `.superpowers/sdd/2026-10-05-u2-lab-launch/lan-http-fix-report.md`, SHA256 `bb8b87b910a2e19f1436f327678445c8c88020a6e9be2b88e0499d2cbd95f01f`.
- Baseline QA FAIL: `docs/reviews/2026-10-05-lan-http-qa.md`, SHA256 `c3479495ca70d6c666e206992cd6ed4684d6cd3c1687462e2c6a00f8f227e4fc`; baseline candidate `3b21aac1d7ca6b0939911b7f917a9781e4935f0a`.
- Affected QA: `docs/reviews/2026-10-05-lan-http-qa-affected.md`, SHA256 `c21055922e1e73d4039a83027b0719f90c82fdbe7b0034e05c68ba3f3827dc12`.
- Scoped Review: `docs/reviews/2026-10-05-lan-http-code-review.md`, SHA256 `1d04eb5b65303860cbe56a8ad9e56b25dd539cdcbcce69d588bcdbdda7a5bab9`.
- PM exact archive evidence: `docs/verification/lan-http-preview.json`; final PM metadata binding: `docs/reviews/2026-10-05-lan-http-final-binding.md`.
- Предыдущие исходные failures и closures сохранены; стартовая точка — `docs/INDEX.md`. Они не заменяют новый HTTP-specific closure.

Standalone archive family `u2-lab-v0.1-lan-preview.zip`, patch0.1.1 внутри `VERSION.json` и footer. SHA256 `2738ebf9b24a2f4694c9705e72afc228db5391962622f5457c3b9a02fea72c1c`,40075B,6files. Архив собирался из fix source `fead1622`; последующие QA/review/docs commits не меняют его runtime blobs.

## Next safe action: обновление на Mac

1. Прочитать owners/VC, проверить clean/dirty checkout и свежие PR/head SHA. Сохранить пользовательские изменения; при dirty checkout работать в отдельном clone/worktree. Не выполнять reset --hard/force push.
2. В чистом checkout актуальной feature ветки обновиться fast-forward, выполнить короткие tests/build. Сетевые инструменты ограничить deadline30s; при timeout сначала проверить итоговое состояние, не повторять mutation вслепую. `npm run test:long` не нужен для повторения HTTP-дефекта.

```bash
git status --short
git fetch origin feat/power-heat-lab
git switch feat/power-heat-lab
git merge --ff-only origin/feat/power-heat-lab
node --version
npm ci
npm run typecheck
npm test
npm run build
```

Требуется Node24 либо совместимый >=22.12. При отсутствии checkout можно clone именно `--branch feat/power-heat-lab`; main пока seed. Проверка package version: `node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version"`, ожидается0.1.1.

3. Остановить собственный старый preview/HTTP server Ctrl+C. Запустить новую dist, а не старую распакованную директорию:

```bash
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist
```

Альтернатива: `npm run preview -- --host 0.0.0.0 --port 4173`. Порт должен быть свободен; не завершать чужие процессы вслепую. При standalone ZIP распаковать в новую папку, сверить `VERSION.json`0.1.1 и SHA256 (`shasum -a 256 ...zip`), перейти в извлечённый `u2-lab-v0.1-lan-preview` и выполнить тот же Python command. Не накладывать новую сборку поверх старых assets.

4. На Mac открыть `http://localhost:4173/?v=0.1.1`. На планшете той же Wi-Fi сети открыть `http://192.168.68.65:4173/?v=0.1.1`, если сервер остаётся на этом ноутбуке/IP. Для другого Mac проверить его фактический LAN IP; прежний IP не переносится автоматически. Page query помогает запросить новую страницу; окончательная проверка — footer0.1.1. Если footer0.1 — остановлен/запущен не тот сервер или сохранилась старая страница: повторно загрузить правильный URL/обновить cache для этого origin.

## Минимальный физический test case на Xiaomi

1. Зафиксировать Chrome version, server host/IP, exact commit либо VERSION.json/archiveSHA, footer, timestamp. Page load уже работал; начать с версии, а не переписывать сетевую настройку.
2. S Civilian, duration14s, «Запуск»: время должно уйти от0 и достичь14s, статус «Завершён», появляются графики/события. «Сброс»:0s. M Civilian/new14s run: завершение. «Шаг» после сброса: время увеличивается на physics dt, Worker ACK виден.
3. Для pause/resume выбрать длительность600s и ускорение×1, «Запуск» → «Пауза» → «Шаг» → «Продолжить» → «Отмена». Не ждать12h; при новом запуске старое состояние не должно возвращаться.
4. Завершить A14s → «Зафиксировать A» → изменить S/M/нагрузку → B14s; проверить сравнение и JSON результата. Файл экспорта — evidence, не канонические параметры U2.
5. Если опять нет запуска при footer0.1.1, получить фактическое сообщение Console и Network failed request для main/Worker. В Console, если доступна, безопасно проверить `({origin:location.origin,secure:isSecureContext,randomUUID:typeof crypto.randomUUID,getRandomValues:typeof crypto.getRandomValues})`: на LAN HTTP ожидаетсяfalse/undefined/function. Нет Console на планшете — зафиксировать UI/status/time и запросить браузерную диагностику отдельно; не объявлять новый root cause без evidence.

Не включать Chrome insecure-origin-as-secure, не менять физические формулы для обхода запуска. USB debugging/ADB требует реального разрешения на устройстве и не был включён этой сессией.

## Open gates и остановка приёмки

HTTP runtime closure: Affected QA PASS и scoped Code Review APPROVED,0blockers/0advisories; физический Xiaomi NOT RUN. Фактическая tablet проверка остаётся адресным operator case; product/physical full acceptance ещё не заявляется.

Bootstrap B0/B6/B8: прежний actual Git CLI export/auth FAIL сохранён. Первый доверенный operator export, restore/re-export, native Claude/Codex hooks в реальном адаптере, trusted finalize и operator merge остаются OPEN. Процедура — `docs/guides/operator-bootstrap.md`; не начинать полную повторную установку/review заново.

Hosted side только read-snapshot/write-intents; original9-ID checkpoint неизменен. Облачная сессия не запускала bd/Dolt/applier/export и не меняла canonical status/dependencies. На Mac live-writer — только designated primary checkout, операции через bd API по owner guide. До проверки writer ownership не выполнять импорт/экспорт/применение queue.

PR2 stacked/draft; merge-ineligible до acceptance bootstrap base. Агент не обновляет main, не merge/auto-merge, не обходит guards; merge выполняет оператор. Detection/sensors/radars остаются за рамками текущей приёмки. S/M и palette экспериментальные, утверждённые U2 SKU не объявляются.

Rollback runtime fix при необходимости: revert exact fix commit в отдельной рабочей ветке после оценки возврата HTTP failure; архив версии0.1 остаётся историческим evidence. Existing tests/VC/исходные QA FAIL reports не удалять.
