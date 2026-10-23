---
title: "Адверсальная проверка F2 governor pretest design"
status: approved / 0 blocker / 0 advisory after affected re-review
version: "1.0"
date: 2026-10-23
tags: [review, product, f2, architecture, game-design, engineering, thermal, power]
related:
  - docs/plans/2026-10-23-f2-governor-pretest-design.md
---

# Адверсальная проверка F2 governor pretest design

## 1. Итог

PRODUCT design v0.2 одобрен по трём отдельно назначенным рискам:

- архитектура быстрой и однозначной реализации;
- настройка игрового баланса через параметры и измеримые эксперименты;
- инженерная правдоподобность без расширения fidelity в ущерб архитектуре или
  гейм-дизайну.

В первом раунде reviewers вернули четыре blocker ID. Два ID описывали одно и то
же противоречие scope воды/T16, поэтому независимых дефектов было три. После
исправления design те же reviewers перечитали весь v0.2 и единогласно вернули
`APPROVED`, `0 BLOCKER`, `0 ADVISORY`.

Это review не является `PLAN_READY` будущего implementation plan, не подтверждает
runtime, реальные ТТХ, баланс кораблей, server/Unity parity или релиз F2.

## 2. Review contract и участники

Review был read-only и адресным. Каждый reviewer получил один immutable HEAD,
одинаковые reviewed paths и собственный named risk. PM не редактировал findings
reviewers и не подменял их общим голосованием.

| Риск | Фактическая роль | Модель, сообщённая reviewer | Что reviewer не решал |
|---|---|---|---|
| Быстрая и однозначная реализация | independent Architecture Reviewer | Codex/GPT-6; exact backend ID не раскрыт harness | численный баланс и отдельную проверку физических законов |
| Баланс и управляемость параметрами | independent Game Design / Balance Reviewer | Codex/GPT-6; exact backend ID не раскрыт harness | архитектуру ядра, integrator и корректность физических законов |
| Инженерная правдоподобность | independent Engineering Plausibility Reviewer | Codex/GPT-6; exact backend ID не раскрыт harness | UI, экономику станции и баланс каталога |

Общие reviewed paths:

- `docs/INDEX.md`;
- весь `docs/plans/2026-10-23-f2-governor-pretest-design.md`.

Runtime tests и T-vectors reviewers не запускали: `NOT RUN`.

## 3. Round 1 — исходный design v0.1

- BASE: `d67ac61d6e0ff1611e8450025f74d4b2be20c417`;
- HEAD: `74ebfd13a66e916fef6a1b553e4a44cd269fda28`;
- Content-Fingerprint:
  `e9ef74c22b4c899aec0cf3b4778b4455fb273409c65ccb87de68c82e8717e951`;
- recipe: SHA-256 UTF-8 строк `path SP git-blob-id LF`, пути отсортированы
  `LC_ALL=C`, без дополнительного payload;
- `git diff --check`: PASS;
- verdict: Architecture `CHANGES_REQUIRED`, Game Design `CHANGES_REQUIRED`,
  Engineering `CHANGES_REQUIRED`.

### 3.1. BLOCKER

| ID | Достижимый сценарий | Требуемое исправление |
|---|---|---|
| `ARCH-F2-B1` | Design требовал весь T01–T19, включая T16 с холодным содержимым водяного термобака при горячем корпусе, но AC одновременно объявлял всю воду OUT. Developer должен был либо сам расширить WHAT, либо пропустить обязательный vector. | Отделить ограниченный storage-state `W` для T16 от водяных движителей/локального пара; закрепить state, ownership и conservation либо честно исключить T16. |
| `ENG-F2-B1` | При `T_S=400 K`, `T_W=270 K` подмена `T_W` температурой корпуса скрывает защиту бака, а включение воды в общий `C_S` уничтожает предусмотренную разницу температур. | То же scope-исправление с отдельной энергией/температурой `W` и противоположными записями `S↔W`. Это второй независимый адрес того же дефекта, а не четвёртая отдельная проблема. |
| `ARCH-F2-B2` | Hot bank совместим с A/B, constrained bank — только с B; каждый банк и cap A/B равны 100 J, запрос 200 J. Hot-first даёт 150 J, constrained-first — 200 J. Fixed arrays и `O(NK)` сами не задавали observable arbitration. | Закрепить bounded deterministic межбанковую policy, совместное уменьшение remaining request/caps и permutation vector; либо fail closed для таких profiles. |
| `GD-F2-B1` | Высокий `T_B0` или малая conductance могут сделать большую `Q_B,max` бесполезной в Quiet. Synthetic conformance всё равно проходит, а обязательного опыта, метрик полного цикла и формата рекомендации не было. | Ввести маршрут `parameter → direction/constraint → metric → paired full-cycle experiment → recommendation`, отделив candidate от fixture и принятого ТТХ. |

### 3.2. ADVISORY первого раунда

| ID | Требование к следующей конкретизации |
|---|---|
| `ARCH-F2-A1` | Не делать T31 exit gate F2-G2 до появления service owner F2-G4. |
| `ARCH-F2-A2` | Закрепить единый 30/120 Hz clock, physical timestamps, checkpoint и RNG/work-package alignment. |
| `ARCH-F2-A3` | Закрепить model/state dispatch, mapping режимов и полный create/restore/result/Worker adapter. |
| `GD-F2-A1` | Рядом с raw telemetry сохранять limiting module, requested/delivered output и различимую причину. |
| `GD-F2-A2` | Считать interventions и cumulative external service input в сравниваемом цикле. |
| `ENG-F2-A1` | Развести ownership `C_S`, `Q_B/T_B(Q)` и оболочки банка. |
| `ENG-F2-A2` | Проверять admissibility synthetic profile для выбранного 30 Hz integrator; не лечить overshoot clipping. |
| `ENG-F2-A3` | Нормировать residuals absolute + relative по фактическим transfer energies/masses. |
| `ENG-F2-A4` | Показывать service receipt как внешний ввод, а не закрытый физический tick. |
| `ENG-F2-A5` | Закрепить детерминированную политику несовместимых банков без требования global max-flow solver. |

## 4. Исправления design v0.2

PM внёс изменения отдельным commit и перебазировал документальную ветку на
актуальный `origin/main`. Runtime не менялся.

1. Scope разделён: `W` термобака и T16 находятся IN; водяные движители,
   локальный пар и T35/T36 — OUT.
2. `S`, `B`, `W`, electrical, TI/surface и shared-resource ledgers получили
   явные authority/ownership границы. Внутренний `S↔W` transfer записывается с
   противоположными знаками; теплоёмкость не дублируется.
3. Для K банков введена qualification policy `most-constrained first` с
   canonical signatures, одним bounded `O(NK)` проходом и уменьшением remaining
   request/caps. T39 включает исходный counterexample и перестановки input arrays.
   Policy не обещает global optimum; реальные `K>1` profiles требуют balance
   qualification.
4. Добавлен неканонический `balance-candidate` с provenance, baseline,
   hypothesis и owner-approved bounds. Он не попадает в default/catalog.
5. Матрица настройки связывает каждую группу параметров с направлением эффекта,
   ограничением, метриками и paired series `work → recovery → repeat`.
   Recommendation receipt хранит measured gain, measured price, failure/
   robustness conditions и proposal оператору.
6. Integer `tickIndex`, общие timestamps 30/120 Hz, admissibility integrator,
   residual normalization, typed limiting reasons и cumulative external service
   ledger стали обязательствами следующего implementation plan.
7. T31 удалён из exit gate F2-G2 и оставлен F2-G4.

Неизвестные реальные значения не заполнены. Они остаются PRODUCT GAP и дают
`BLOCKED` соответствующему real-profile/balance verdict.

## 5. Affected re-review — design v0.2

- BASE: `e3cf501f41803b48d3b4456e75884ade3b798773`;
- HEAD: `d1d419bc6114c83745966510f168b3222a61e82c`;
- rebased semantic v0.1: `c95f00ef34f9e5803f9f08fe30f38376ce812a16`;
- Content-Fingerprint:
  `b4291b6358951e110a527c84c85230f7b834da5229d5b39dd250a1b9eedd5fae`;
- blobs: `docs/INDEX.md` = `17b9c359d3131f2804984dcaa6d7263089022276`;
  design = `437269242f851968b6022b08c48bdbac405a6566`;
- fingerprint recipe тот же, что в round 1;
- все три reviewers независимо воспроизвели fingerprint;
- `git diff --check`: PASS; worktree clean; runtime tests `NOT RUN`.

| Reviewer | Закрытые ID | Новые findings | Вердикт |
|---|---|---|---|
| Architecture | `ARCH-F2-B1/B2`, `ARCH-F2-A1/A2/A3` | 0 BLOCKER / 0 ADVISORY | `APPROVED` |
| Game Design / Balance | `GD-F2-B1`, `GD-F2-A1/A2` | 0 BLOCKER / 0 ADVISORY | `APPROVED` |
| Engineering Plausibility | `ENG-F2-B1`, `ENG-F2-A1…A5` | 0 BLOCKER / 0 ADVISORY | `APPROVED` |

## 6. Граница доказанного

Review подтверждает, что design:

- достаточно замкнут для написания однозначного implementation plan;
- предусматривает проверяемую настройку параметров без объявления выдуманных ТТХ;
- физически согласован в выбранной агрегированной fidelity и не требует pipe graph,
  global solver или полной криогенной модели.

Не проверены и не утверждены:

- конкретные interfaces, файлы, integrator и численные tolerances будущего кода;
- исполнение T01–T39, benchmark и production 30 Hz budget;
- реальные balance candidates и результаты paired experiments;
- catalog promotion, server/Unity parity, station economy/UX, identity/session,
  detection, F3, native devices и release readiness.

Следующий обязательный gate: отдельный implementation plan с точными paths,
interfaces, RED tests, T/preservation mapping и собственным independent Plan
Review на новом content fingerprint.
