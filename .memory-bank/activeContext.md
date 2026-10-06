# Ship Fitting — адверсальное ревью рабочего процесса, 2026-10-06

Оператор отклонил удобство v3: потеря сценариев сравнения и анализа, изолированные
разделы, неполное сохранение возможностей v1/v2. Текущий приоритет — тщательное
адверсальное ревью GD, UX/UI и пользовательских сценариев, затем полезная v4.
Claude Design — графические ассеты и предложение раскладки, не конечный обязательный
макет. Последнее решение оператора главнее прежнего UI acceptance overlay.
Прежние технические QA/review закрывают только свой scope; пользовательская
приёмка рабочего процесса OPEN. Все три стенда сохраняются.

## Правило оператора: повторный самоаудит

После каждого третьего завершённого прохода QA/Review с триажем провести короткий
PM-самоаудит: исходный пользовательский результат; actual состояние; повторяющийся
класс ошибки/дрейф; самый короткий полезный следующий шаг. Политика принята2026-10-06.
После GD/UX Review+triage и сценарной QA+triage счётчик2/3. Отметки итераций — через Beads API; внутренние tests,
ожидания и написание отчётов не отдельные циклы. Audit не новый independent verifier.
Ссылки и диагноз: docs/reviews/2026-10-06-pm-self-audit.md. Reference PM_ERR/DOC_PR
прочитаны в основном U2main@0fe06927…; текущие нормы — .agents/PM_ROLE.md3.0/ADR3.29.

## Рабочая версия

Primary branch feat/claude-design-ui; PR6 Draft, base PR4 Draft. Runtime source
30a1c9b0953bf61723cd8a9deb570044e1f26862. Full148+wholeUIVC fingerprint
f3c824596bfbbf26b1ec96c0c67296f244b3de19522e22437b296bd2b4e7e515.
Metadata-only commits не меняют QA/Review binding; actual blobs проверять при handover.

Новый UI: http://192.168.68.65:4183/?v=claude-ui-30a1c9b или localhost:4183.
Прежний Ship Fitting: http://192.168.68.65:4186/.
Legacy Lab: http://192.168.68.65:4186/?mode=legacy.
Root-owned PIDs76596/76597/58042, immutable roots и optional TLS4184 — ignored
.overgate-runtime/claude-ui-preview-verified.json. Рабочие страницы не перезагружать.
UI worktree сохранён /Users/komleff/Documents/GitHub/u2-lab-claude-ui, detached;
старый numeric worktree сохранён. Никакой чистки/kill неизвестных процессов.

Final artifact только candidate-fix-r3-final3: ZIPc6e89e0a38bcb0ca8cabe4897aef92d5faef0dfc69ab44a5f3191e0b6cd85ef2,
dist59bb555e2c59875be0d0242d2c382c94bacc59e3bfaf059e2b59cb78cc255beb.
Artifacts/raw evidence/предыдущие seals сохраняются. Fresh primary npm ci +verify,
final mandatory guard189unit/28browserPASS+1inherited screenshot SKIP; type/build/
reference/bootstrap26PASS. Source68/protected85+2/compiled6/primary17/served51 проверены.

## Текущий аудит и продолжение

Beads ulab-bn1 IN_PROGRESS: независимый GD/UX/User Review NEEDS_REVISION,12 findings;
QA GD/UX FAIL. Шесть v1/v2/v3×1440/390 whole chains дошли до конца, но это не UX PASS.
Матрица24адресов:9PASS/9FAIL/4user-taskBLOCKED/2NOTRUN, с непроверенными ветвями.
RUNNING native navigation на v3×1 desktop/LAN390 отдельно PASS; MAX/physical/tablet820
NOTRUN. Оригинальный Review и factual addendum публикуются вместе, без переписывания.
Все141rawQAhash проверены PM; signed canonical reports — docs/INDEX.md.

Главные факты: color/legend mismatch, draftrev вместо measuredrev в Compare,
result opening принимает толькоspec и показывает чужой паспорт, pausedFreeze v1YES/
v2refusal/v3disabled. Скрытые секции/scroll reset и21Wканал затрудняют workflow.
V3 comparison data и immutableactive ownership сохранены; не заявлять полную потерю.
Legacy paused export выдаёт nextdraft; отдельный обнаруженный дефект, не новаяv3регрессия.
Overlay/zoom/persistence раньше не было: новые proposals не делать автоматически.

WHAT draft WF01–14 и HOW proposed — docs/product/ship-fitting-gd-workspace-v4.md,
docs/plans/2026-10-06-gd-workspace-v4.md. Минимальное продолжение: один Plan Review
до PLAN_READY, затем единственный Developer; PM не кодит. Следующий завершённый
verifier+triage доведёт счётчик до3/3 и требует короткого самоаудита. Runtime и все
стенды пока прежние; v4/порт4188 не подняты. Миссия/refuel остаётся deferred.

## Прежняя техническая приёмка

QA r4: scopedPASS, CR-UI-B1/B2 и linkedD12 CLOSED;10 addressed affected slices,
не10 полных новых methods. Original72 mapping71PASS/1deferred включает historical
portions/carryover. Review r2: APPROVED0B0A;9changedpaths/19unchangedcarry.
Signed reports/manifests — docs/reviews и docs/INDEX.md. PR6 QA comment6005658793,
Review6005867840, PMbinding6006010957. c62 CI37386731050/37386726084 SUCCESS;
checks последующих metadata HEAD — отдельно. Нового full72/42/matrix/12h не было.
Старое numerical QA r4/Review r3/physical12h наследуется только на unchanged core.

Beads ulab-3lg/U1–U6 CLOSED по локальному UI scope; ulab-dwiOPEN/DEFERRED:
добыча до полного трюма, Aurora↔центр Северного,3FVA,полёт/расход/станционная заправка.
Следующие product tests/fixes привязать к замечаниям оператора и named AC/FAIL;
перед fix охватить класс по всем affected UI surfaces, затем только affected regression.
Без новой машины доказательств/полных повторов по инерции. PM не кодит продукт.

UI13-02 attribution раскрыта/deferred; numerical/Worker/catalog/IO/Legacy сохранены.
Physical новый UI/native adapter/public Pages/base bootstrap/full product acceptance
и main merge остаются OPEN отдельными gates. Main merge выполняет только оператор.
Node24.21/npm11.6/bd1.2.2; own PATH helper .overgate-runtime/env.sh. Primary sole Beads
writer, только bd API; trusted export helper frozenOverGate63393725…; cloud read-only.
Исходные9bootstrap IDs не менять; user docs/.DS_Store сохранить. Git guards применять
обычно; native hook activation NOTRUN, manual dispatch не заменяет native smoke.
