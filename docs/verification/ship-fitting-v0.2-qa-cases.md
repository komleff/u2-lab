# Ship Fitting v0.2 — независимый source-first QA case plan

Дата: 2026-10-05, Asia/Novosibirsk. Роль: independent QA, `.agents/QA_ROLE.md` v2.1.
Model: Codex; точный provider model ID не доступен этому runtime, не заявлен.
PRODUCT verifier launch: 2/5 по заданию PM; affected turns этой session не новые launches.
Публикация: PM переносит отчёт неизменно в Draft PR4 <https://github.com/komleff/u2-lab/pull/4>.

**Result: NOT RUN.** Это подготовка 100 test cases, по пять на SF01–SF20. Candidate SHA/build
ещё не переданы PM. Новый runtime, Developer implementation/report и его новые tests не
читались и не запускались. QA PASS, completeness implementation и merge readiness не заявлены.
Ни requirements, ни product code, ни automated tests, ни Beads/Dolt/GitHub не изменялись.
Единственный записанный артефакт — этот root-ignored report (`.gitignore:28`).

## Source и binding

Первый маршрут: `.memory-bank/activeContext.md` → `.memory-bank/progress.md` → `docs/INDEX.md`
→ QA role и перечисленные current source owners. Keyword repository search, grep/rg и archives
для маршрутизации не использовались. Source cases выведены до Developer explanation.

Current PO authority: `docs/product/ship-fitting-v0.2-acceptance.md`, blob
`49d640538146c38114e195dae9d796074c785588`. Его принятие распространяется на frozen GDD,
VC и plan; исторические draft/proposal формулировки не отменяют operator approval.
Metadata HEAD на момент подготовки: `3311d5cb093c0f31e883964bfcb8f760c28f9b4c`.

Детерминированно пересчитан approved five-path + entire-VC fingerprint:
`550085b4eb58989563863ee27fffd339e1398f26f084775aa353fa48b78627ce`.
Алгоритм: UTF-8 SHA256 canonical JSON `{blobs:[{path,blob}],contract:{path,text}}`, sorted keys,
без whitespace; пути в `blobs` отсортированы. Plan blob включён для проверки binding;
его HOW не использовался как источник численных expected.

| Bound path | Git blob |
|---|---|
| docs/gdd/gdd_u2_ship_fitting_v0.2.md | eac9ece236840af775181d5936799df1e8cff2bd |
| docs/plans/2026-10-05-ship-fitting-v0.2.md | aa48875c5c40aae0b3b98f137c704edc11bd0b44 |
| docs/research/ship_fitting_source_synthesis.md | a98c69894d98c688a0c4b19d4e7f39ff44004a67 |
| docs/research/ship_fitting_sources.json | a61c4e7d816d792b5a7e3cfea7c3554c9860c1ec |
| docs/verification/ship-fitting-v0.2-contract.md | 314d1770363d642df4c2dec069a308b715911c58 |

Reviewed source surface: acceptance, GDD§1–10, entire VC SF01–20, synthesis и 41-source
manifest; legacy `docs/product/power-heat-lab-v0.1.md` и entire P1–P14 VC. Role/pipeline
прочитаны по installed `.agents/{QA_ROLE,PM_ROLE,AGENT_ROLES,PIPELINE,SKILLS}.md`
и `.agents/PIPELINE_ADR.md §§3.28–3.32`.

Только необходимые exact U2 source blobs читались через `git show` frozen
`cdc490e3517c8455f662f82579c45813cdbb9a76`, по direct manifest paths:

| Owner / прочитанная часть | Git blob | Зачем |
|---|---|---|
| docs/specs/spec_ship_slots_v0.7.md §6–9, в т.ч. §6.5 | 3d9f260dbc20ad965efcb31fda0bbc7f56fb467e | Архитектура E/A/D/H/U, обязательность, direct/electric разделение |
| docs/specs/spec_ship_slots_multifuel_thermal_delta_v0.1.md | 9047b951d026ee1d947daba01dcd4bf6fcd5e782 | Shared typed circuits, physical cryotank, cargo-only fuel boundary |
| docs/gdd/gdd_ship_cargo_payload_and_dimensions.md §2–5 | 002f34cb7f40cf065df6367b8576db8b16b49c21 | Cargo1.7 volumes, allocation и family mass formula |
| docs/gdd/gdd_laser_energy_productivity_and_recovery_balance_v0.1_draft.md | bc8dc47eff0e9fe16179e407f9f92ad1d66f8b3d | η(G), beam и 24MJ/SCU; новый fixed process берётся из accepted lab GDD |
| docs/specs/spec_power_components_v0.1.md §6.6 | bc9a55064e389566f6e8009cb02b71fe712d4b26 | Coarse cF anchor, actual electric bus |
| docs/brand/u2_power_budget_doctrine.md §6 | e89f5d29768d8c99c8f5e2cd39815b61942a6ed0 | Protected first; одинаковая доля запроса всех непривилегированных consumers |
| docs/specs/spec_engine_force_grid_v0.1.md headings only | fb8622925bdb0bb676ab2ee43e94ac52a96eda23 | Проверка direct owner route; новые engine numerics из него не выводились |

Private owners целиком в публичный report не копируются. `package.json` прочитан только из
legacy baseline `6fb7166513627941e2ba2c4a9a01c79ae1667820`, для существующих команд.
Реализация в `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2` до exact candidate не читалась.
Runtime Tested-Paths и runtime Content-Fingerprint: **NOT RUN / не установлен**; появятся
только после candidate handshake и inspection фактически проверенной surface.

## Независимые оракулы

Все синтетические SI fixtures ниже проверяют принятые формулы/invariants и не объявляют
новые ТТХ U2. Для isolated analytic cases явно задаются lossless path/charge/discharge,
background=0, нулевая радиационная площадь, достаточные C/cargo и открытые gates, если
тестируемый фактор не thermal/cargo. Curated fit проверяется отдельно со своим полным
declared numerical snapshot, без обнуления его расходов.

- **O1 — один CivilS/G1:** P_bus=3,000,000W, η=0.5001, E_break=24,000,000J/SCU,
  factors=1, ρ=1500kg/m³, return=0.35. R=0.0625125SCU/s=225.045SCU/h.
  За 10s: 0.625125SCU и 937.6875kg; bus=30,000,000J, beam=15,003,000J,
  emitter host=14,997,000J, return host=5,251,050J, всего host=20,248,050J,
  external useful=9,751,950J. Host+external=bus. Электротяга и cooling дают 0SCU.
- **O2 — 1/2/3 fully powered duplicates:** bus=3/6/9MW,
  R=0.0625125/0.125025/0.1875375SCU/s. IndustrialS/G2 имеет η=0.47+0.43·(1−0.93²)
  =0.528093; при 3.4MW R=0.074813175SCU/s. Три IndustrialS требуют 10.2MW.
  Смешанный hull/laser class не изменяет эти изделие-specific числа.
- **O3 — finite battery при трёх CivilS:** isolated source 8MW, Q0=1MJ,
  Qmax≥1MJ, demand=9MW, horizon=3s. Полные 9MW только первые 1s; после depletion
  каждый получает 8/9 запроса, то есть 2,666,666.666…W. Withdrawal=1MJ,
  source input=24MJ, total delivered=25MJ, extraction=0.5209375SCU.
  Если Q0=0: rate=0.1667SCU/s, за 3s=0.5001SCU. Если source=0 и Q0=0: extraction=0.
  Для real path losses источник 8MW не считается автоматически 8MW доставленной шины;
  ожидаемый результат вычисляется из declared losses, actual background и stock ledger.
- **O4 — electric:** synthetic explicit c=7.77m/s, F_rated=1000N, η_path=.95,
  η_drive=.90. Rated bus=9087.719298245614W. При command=1 и 50% delivered share:
  F=500N, useful=3885W, host=658.859649122807W. При bus=0 F=0, useful=0,
  extraction=0. При command=.5 и полном питании его уменьшенного запроса F=500N;
  duty не применяется дважды. Curated candidate c проверяется как его explicit input,
  а не молчаливо заменяется этим synthetic anchor.
- **O5 — cargo1.7:** universal S/M=12/96SCU, bulk S/M=24/192SCU;
  S universal=8945.439461kg, S bulk=1800kg. Derived M universal≈45082.189909897kg
  (S mass·8·4^(−1/3)); M bulk=(.816·4+.984·8)t=11136kg.
  Shared U=C_builtin+Σuniversal; Σu_species≤U. `SCU=m³`, density даёт kg.
- **O6 — встроенный трюм:** lab hypothesis m=720·V^(2/3)kg, C=m·470J/K.
  Ниже значения до округления отображения; known stronger material bill сохраняется.

| Builtin V, SCU=m³ | Dry mass, kg | C при LAB-STEEL-MIX, J/K |
|---:|---:|---:|
| 6 | 2377.387619204131 | 1117372.1810259414 |
| 12 | 3773.867607660811 | 1773717.775600581 |
| 24 | 5990.641410389484 | 2815601.4628830575 |
| 48 | 9509.550476816523 | 4469488.7241037656 |
| 192 | 23962.565641557929 | 11262405.851532226 |

- **O7 — exact metric trace:** selected rate r=0.0625125SCU/s; 10s cycle:
  [0,2) transit=0; [2,4) requested work actual=r; [4,6) requested work actual=0,
  cause power; [6,7) requested work actual=r/2; [7,8) planned service=0;
  [8,10) requested work actual=r. Output=4.5r=0.28130625SCU/cycle;
  SCU/h=101.27025 на exact 10s interval; K_use=.45. Requested forced-zero downtime=2s;
  partial de-rating=1s, full-work equivalent loss=2.5r=0.15628125SCU;
  planned transit/service=3s. First limiter=power at4s; recovery=2s to first
  requested positive output at6s, даже если она partial. Если thermal cause ещё [5,6),
  power duration=2s, thermal=1s, union forced stop=2s, overlap=1s, не 3s общей остановки.
  При N повторениях output=4.5Nr, forced union=2N, partial=1N, overlap=1N,
  completed recovery count=N/mean2s/max2s/first2s. Append requested stop без следующей
  добычи даёт один open «не восстановился», не новый completed и не вклад в mean.
- **O8 — shared stock:** synthetic H₂ stock=.001kg, horizon1s, simultaneous desired
  generator/engine/cooler flows=.001/.002/.003kg/s. Aggregate demand=.006kg/s;
  физический stock исчерпывается через1/6s при открытых остальных gates. Actual суммарный
  расход=.001kg; ни одному consumer не выдается отдельная копия stock. Потребление cooler
  — часть общего H₂, не второй общий расход. Для direct source ledger chemical/thermal
  terms вычисляются по resolved typed enthalpy/efficiency, без подмены useful e химическим e.
- **O9 — ограничение/ties:** earliest requested loss в t=4.000s от power и thermal
  в4.005s при dt=.01s показывается «одновременно»; причина в4.020s не входит в этот tie.
  Target reached и cooler stock exhausted без потери requested mining не first blocker.
- **O10 — tolerances:** exact authored constants/metadata — exact; derived bill relative≤1e−8.
  One-step residual≤max(.001J,1e−8·sourceEnergyJ). Short repeated integrated residual
  ≤max(1J,1e−6·cumulativeInputEnergyJ). dt=.01/.005/.0025s: useful SCU differences≤1%,
  event timing≤.01s, first-cause/tie semantics согласованы. Legacy numerical model сохраняет
  P1–P14 tolerances, включая 1e−6J/1e−9relative analytic и ≤.1% nonlinear refinement.

## Команды и методы после candidate handshake

Ниже **план исполнения**, не выполненные команды. PM должен передать full candidate SHA,
clean build/artifact identity и approved run entry. До этого все строки matrix имеют NOT RUN.
Имя новой public API и новое test fixture не угадываются из будущего test code.

**C0 — binding:** cwd `/Users/komleff/Documents/GitHub/u2-lab-ship-fitting-v0.2`:

```sh
git rev-parse HEAD
git status --short
git diff --check 6fb7166513627941e2ba2c4a9a01c79ae1667820...<FULL_CANDIDATE_SHA>
git diff --name-only 6fb7166513627941e2ba2c4a9a01c79ae1667820...<FULL_CANDIDATE_SHA>
```

HEAD должен совпасть с handed candidate; runtime tested paths/blobs, build digest и entire VC
получат новый exact fingerprint. Source binding проверяется повторно. При иных bytes dependent
run не начинается до exact binding от PM. PM отдельно предоставляет project-owned
`.agents/project/verify.sh` evidence; QA не запускает Beads/Dolt/applier/export/writer.

**C1 — declared toolchain** (последовательные commands в отдельной QA shell):

```sh
source /Users/komleff/Documents/GitHub/u2-lab/.overgate-runtime/env.sh
node --version
npm --version
```

Ожидаемый Node24; значения в execution report фактические. Env/credentials не печатаются.

**C2 — existing deterministic suites/build**, commands известны из exact legacy package;
после candidate inspection подтверждается их наличие, а изменения wiring описываются явно:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run test:browser
npm run test:long
```

Существующие automated tests принадлежат Developer. QA их исполняет и проверяет достаточность
реальных assertions против matrix, не пишет новые automated tests. Case name/количество tests
не заменяют evidence expected values. Прежний `test:long` для v1 не доказывает новый v2 fit12h.

**C3 — независимые isolated/domain/kernel/metrics probes:** existing supported public API
из candidate, одноразовый Node REPL (`node --experimental-strip-types`) или его существующий
runner command. Числа O1–O10 вычислены здесь до чтения реализации. После candidate inspection
execution report укажет точный import/entry, SI inputs, command и actual JSON/ledger output.
QA не пишет тестовые source files. Если существующего executable access недостаточно,
PM получает точный NOT RUN case и запрос к Developer на durable fixture, а не invented PASS.

**C4 — 12h/heap:** 43200s simulated time, physics dt=.01s, наиболее тяжёлый законный
curated fit по installed/channel/metric roster, достаточная повторяемая scenario length.
Запускается actual kernel replay через existing long entry. При необходимости GC measurement
existing Vitest entry можно запускать как `node --expose-gc ./node_modules/vitest/vitest.mjs
run tests/long-kernel.test.ts --reporter=verbose`, если exact candidate сохраняет этот entry.
Evidence обязательно измеряет heap всего runner включая metrics, retention bytes/buckets,
events dropped/first/last, CPU/OS/browser/catalog/channels, physics ticks и peak.
Не объявлять telemetry byte estimate actual heap check. Сравнить одинаковый fixed roster
metric state при N=10 и N=30000 alternating O7 cycles; no histories proportional to N.

**C5 — browser/Worker:** existing `npm run test:browser`, затем actual built-artifact live
smoke с independently measured run/control ACKs. At≥40000 retained buckets hold telemetry ACK,
issue Pause/Step/Cancel; matching control ACK delta≤500ms, telemetry unacked≤1. Инструменты
браузера/host/version записываются; browser emulation не физическое устройство.

**C6 — actual artifact/static origins:** handed ZIP/build identity → extract в отдельный QA
temp directory → static serve extracted bytes. Образец existing preview command для build:

```sh
npm run preview -- --host 0.0.0.0 --port 4183 --strictPort
npm run build -- --base=/u2-lab/
```

Port4173 зарезервирован PM для Playwright; final preview планируется на4183.
Для extracted bytes server command будет назван точно после получения package; Vite preview
сам по себе не заменяет extracted ZIP check. Проверить localhost, реальный non-loopback host
HTTP origin (`secure=false`), HTTPS-hosted `/u2-lab/` prefix или честно локальный HTTPS/prefix
эквивалент; all runtime requests same-origin, без CDN/backend. Public Pages deployment и
second physical device/native acceptance только по фактическому отдельному evidence.

## Case matrix — 100 cases

Каждая строка — один case, перечисленные варианты negative input не раздуты в отдельный count.
Result NOT RUN означает «candidate ещё не передан», если Evidence не уточняет иной предел.

| Case | Source AC | Method | Условия и expected | Result | Evidence после запуска |
|---|---|---|---|---|---|
| SF01-01 Six hull anchors | SF01; GDD§4 | C3 catalog data | Спутник2×S/6SCU; Pony2×S/12; IndustrialS2×S/12; CivilM3×M/24; IndustrialM3×M/48; IndustrialL4×L/192. Builtin cargo сохраняется при заполненных Payload. | NOT RUN | Resolved six profile fields vs exact source |
| SF01-02 Pony identity | SF01; GDD§4–5 | C3 + C5 | Pony имеет builtin S laser, tank12000kg diesel capacity, Power3×S, G0 Class/National UNKNOWN. Его не переименовать CivilG1/Industrial; IndustrialS builtin laser не наследует. | NOT RUN | Catalog/preset JSON + DOM builtin block |
| SF01-03 Ready presets | SF01; GDD§3–5 | C3 presets integration | Для каждого ready preset march/retro/strafe-pair/turn-pair и аккумулятор установлены; pair одно изделие; defaults U/D/U/E/U/U, electric CivilM. Полные finite SI bill и stocks. | NOT RUN | Six resolved presets/readiness/bill |
| SF01-04 Curated catalog roster | SF01; GDD§5 | C3 data + C5 | 40 curated authored items по declared family/caliber roster, до local variants; builtins не дают бесплатные removable SKUs/slots. Civil≥G1, Industrial≥G2, H₂ generator≥G3, active radiator≥G2, inverter≥G4. | NOT RUN | Count/family/generation fields, exceptions labelled |
| SF01-05 Provenance/local variants | SF01; GDD§5 | C3 + C5 | Каждый numerical field содержит unit, canonical/derived/experimental, version и anchor/rule/hypothesis+sensitivity. Edit создаёт variant и не меняет original/provenance на canonical; missing/nonfinite bill не ready. | NOT RUN | Original/variant snapshot diff, field/error paths |
| SF02-01 Slot cardinality | SF02; GDD§3 | C3 domain | 1slot=1instance. Повторная установка не создаёт второе изделие/упаковку XS в S. Несовместимое assignment не применяется атомарно; last valid fit остаётся. | NOT RUN | Before/after assignments, error reason |
| SF02-02 Smaller fit | SF02; GDD§3–4 | C3 domain | S mining можно поставить в M/L compatible Payload; M в S и L в M reject. Не использовать универсальный размерный multiplier по всем TTX. | NOT RUN | Positive/negative assignment outputs |
| SF02-03 Category/role/pair | SF02; GDD§3 | C3 domain | Generator в Payload, laser в Power, single в strafe/turn-pair и paired в march/retro reject. Category/caliber alone не обходят declared role/family allowlist. | NOT RUN | Path+reason и неизменный fit |
| SF02-04 Legal laser boundaries | SF02; GDD§4 | C3 domain | Спутник2swappable максимум; третий reject. Pony builtin+2swappable=3total legal; IndustrialM3swappable legal; L3laser+1cargo legal. Ни extra Payload, ни builtin slot consumption. | NOT RUN | Four fit constructions and denied third S |
| SF02-05 Mixed class/duplicates | SF02; GDD§4–5 | C3 + C5 | CivilS laser в IndustrialM legal; его power/η/rate остаются CivilS. Два одинаковых SKU получают distinct installed IDs без stacking penalties. | NOT RUN | Installed identities/resolved nominal values |
| SF03-01 Builtin immutability | SF03; GDD§3,8 | C3 + C5 | Видимые builtin cargo/tank/laser/accumulator доступны по полям и допустимым modes; снять/заменить reject; свободные сменные slots сохраняют число. | NOT RUN | DOM и domain rejection/slot count |
| SF03-02 Independent duplicate state | SF03; GDD§3 | C3 + C5 | У двух одинаковых laser IDs разные commands/gates/states: выключение одного не выключает другой и не объединяет ledger channels. | NOT RUN | Requested/actual perinstance trace |
| SF03-03 Incomplete draft readiness | SF03; GDD§2 | C3 + C5 | Удалить mandatory retro или battery: save/export draft разрешён, completeness warning, Run закрыт. Readiness scenario отличается от совместимости установки. | NOT RUN | Saved fit, disabled Run, explained missing IDs |
| SF03-04 Optional generator | SF03; GDD§3 | C3 kernel/UI | Complete battery-only fit без generator legal/Run доступен при допустимом scenario. No battery не ready. Battery разряжается конечным stock без созданной генерации. | NOT RUN | Readiness и Q/energy trace |
| SF03-05 Zero initial stocks | SF03; GDD§2 | C3 + C5 | Complete allowed scenario с Q0/fuel0 показывает warning; legal fitting не объявляется incompatible. Run даёт actual stop/no target, finite values и resource event, не invented completion. | NOT RUN | Warning, zero output/resource result |
| SF04-01 Direct homogeneous type | SF04; GDD§3 | C3 table-driven | Diesel march+H₂ retro/strafe/turn reject; также electric/direct mix reject. Четыре powered propulsion roles одного declared type; изменение только generator не меняет propulsion type. | NOT RUN | Valid D/H/E vs mixed rejection |
| SF04-02 Electric architecture separate | SF04; GDD§3–4 | C3 domain | Electric propulsion на U с legal fuel generator+tank — electric hybrid, не новый fourth propulsion type; E остаётся архитектурой hull, не синоним любого electric engine. | NOT RUN | Separate type/architecture fields |
| SF04-03 Legal H₂ utility | SF04; GDD§3; multifuel§2–3 | C3 + C3 kernel | На U diesel drive + diesel tank + real H₂ Power cryotank + cooler/H₂ generator legal при всех slots. Нет cryotank/неправильная species/нет slot → reject/readiness reason, не hidden cooler store. | NOT RUN | Fit compatibility + physical stock ref |
| SF04-04 E/A restrictions | SF04; GDD§3–4; slots§6.2 | C3 table-driven | E/A не приобретают fuel tank/fuel generator даже при свободном Power slot; дополнительный H₂ utility не обходят restriction. E принимает declared environment source; A не входит в curated six. | NOT RUN | Architecture cases and rejection reason |
| SF04-05 Reactor/XXL boundary | SF04; GDD§3 | C3 domain/UI | XL reactor в S/M/L reject по caliber; reactor source не двигатель. XXL не активный playable preset/fit, reserved label не выдаёт готовое изделие. | NOT RUN | Domain refusal/catalog visibility |
| SF05-01 Exact dry bill | SF05; GDD§5–6 | C3 numerical | Независимая сумма shell+каждый builtin+каждый installed dry bill ровно один раз; C=Σm_material·cp. Для partial CivilS shell42500kg+6SCU O6 subtotal44877.387619kg, при cp470 subtotal C=21092372.181026J/K. | NOT RUN | Hand sum vs resolved totals, O10 tolerance |
| SF05-02 Included mass decomposition | SF05; GDD§5 | C3 numerical | Если source shell anchor включает изделие, decomposition исключает повторное сложение. Старые assembled Pony46.7t не переносятся поверх new shell+builtin cargo. Нет скрытого балласта/free zero builtin. | NOT RUN | Provenance/components subtotal |
| SF05-03 Module add/remove deltas | SF05; GDD§6 | C3 numerical | Добавить/снять battery, generator, buffer, radiator, cargo по одному: Δdry и ΔC их real bill; одновременно изменяются Qmax, source cap, buffer cap, radiator area, cargo volume. Одна reversible замена не теряет остальные sums. | NOT RUN | Before/after per-family delta |
| SF05-04 Contents vs dry C | SF05; GDD§6 | C3 numerical | Добавить2SCU LAB-ORE-01: +3000kg current mass, Δdry=0, ΔC=0. Изменить operating fuel на100kg: current+100kg, ΔC=0. Unload/refuel не перестраивает dry heat buffer. | NOT RUN | Current/dry/C independent outputs |
| SF05-05 Builtin cargo recipe | SF05; GDD§5 | C3 numerical | V6/12/24/48/192 дают O6 masses/C. Не mass0 и не interchangeable universal SKU mass; surface120kg/m² marked experiment, endpoints80/160 и cp350/900. | NOT RUN | Five source recipe comparisons |
| SF06-01 Cargo1.7 exact anchors | SF06; GDD§5; cargo§4–5 | C3 catalog/numerical | O5 universal/bulk S/M volumes/masses, ×8 capacity; old1.20t/×4 не authoritative для v2. Builtin volumes используют свою ×4 source curve. No automatic class/generation/national cargo multipliers. | NOT RUN | Units/anchors/mass formula |
| SF06-02 Universal shared allocation | SF06; GDD§6; cargo§4.3 | C3 cargo boundaries | U12: goods7+ore5 legal, goods7+ore6 reject; U нельзя по12SCU каждому виду. Universal+bulk24: goods12+ore24 legal; goods13 не берут bulk capacity. | NOT RUN | Accepted/rejected allocation totals |
| SF06-03 Density and forms | SF06; GDD§6 | C3 cargo | Ore2SCU at1500kg/m³=3000kg; endpoint1000→2000kg,3000→6000kg. Bulk не принимает liquid/goods; liquid commodity и packaged commodity не конвертируются бесплатно. Unsupported form reject с reason. | NOT RUN | Volume/kg/species compatibility |
| SF06-04 Fill/unload boundary | SF06; GDD§6 | C3 kernel dt | Remaining cargo=.1SCU при O1 full rate: full time=.1/.0625125≈1.599680063987s, output≤.1SCU, mass≤150kg. Unload освобождает только cargo; Q/fuel/T/buffer сохраняются, subsequent mining возможен. | NOT RUN | dt trio fill time, stock before/after service |
| SF06-05 Liquid is not operating fuel | SF06; GDD§3; multifuel§4 | C3 kernel/domain | Payload compatible liquid H₂/diesel с operating Power stock0 не питает generator/engine/cooler. Cargo неизменен без explicit unload/refuel; auto transfer отсутствует. | NOT RUN | Cargo/operating-stock independent traces |
| SF07-01 Explicit propulsion roles | SF07; GDD§6 | C3 scenario/kernel | Approach включает только march; braking только retro; strafe/turn0 до явного request. Нельзя автоматически включить все4roles или один SKU-ID трактовать как все duplicate instances. | NOT RUN | Perrole requested/actual channels |
| SF07-02 Instance target validation | SF07; GDD§6–7 | C3 schema | Requests называют installed instance/propulsion role; неизвестный instance и mismatched role reject до Run; valid duplicate target действует только на названный ID. | NOT RUN | Error paths и isolated command trace |
| SF07-03 Fixed group membership errors | SF07; GDD§7 | C3 schema | Unknown group ID, repeated ID, non-mining ID и positive mining request outside group reject. 3installed/1selected/3positive не запускается; outside duty0 разрешён. | NOT RUN | Four errors + zero outside positive case |
| SF07-04 Numeric phase guards | SF07; GDD§6; legacyP12 | C3 schema | Duty−.01/1.01/NaN/Infinity, phase duration0/negative/nonfinite, invalid dt/horizon reject path+reason, без clamp. Duty0/1 и positive finite duration valid. | NOT RUN | Input cases/atomic rejection |
| SF07-05 Empty cycle/duty0 | SF07; GDD§7 | C3 schema/kernel | Repeated empty cycle reject, не infinite busy loop. Valid work duty0 даёт0output/0forced starvation/no first work blocker; planned time остаётся в horizon. | NOT RUN | Empty-cycle error и zero-duty metrics |
| SF08-01 Zero electric bus | SF08; GDD§6 | C3 isolated energy | O4 command1, Q/source0: actual force0, drive useful0, output0SCU. Rated force не выдаётся бесплатно; finite source/bus/host ledger. | NOT RUN | Force/energy/mining channels |
| SF08-02 Partial delivered force | SF08; GDD§6 | C3 isolated energy | O4 50% delivery даёт500N,3885W useful,658.859649W host; source/useful/host сходятся O10. Equal share при mixed load отражается фактической силой. | NOT RUN | Hand oracle vs actual |
| SF08-03 Command and thermal gate | SF08; GDD§6 | C3 kernel | Command.5/full requested delivery→500N; command0/gateclosed→0force. Recovery hysteresis не выдаёт force до open gate; delivered share×command применяется ровно один раз. | NOT RUN | Force/duty/gate step channels |
| SF08-04 Electric/mining competition | SF08; GDD§6; powerbudget§6 | C3 mixed-load | Battery0, after protected load only half общей непривилегированной demand: engine и mining получают50% своих requests. Force/output scaled accordingly; mechanical useful не добавляется к beam/ore. | NOT RUN | Both requested/delivered channels and ledger |
| SF08-05 Direct typed branch regression | SF08; GDD§6; legacyP3–4 | C3 D/H isolated | Direct fuel расход=αF_actual·dt соответствующей species, source energy/exhaust/host закрыты по declared typed input. Electric deficit при fuel available не обнуляет direct force. Diesel не списывает H₂, drive useful не mining. | NOT RUN | Typed flow/force/energy residual |
| SF09-01 1/2/3 nominal additive lasers | SF09; GDD§4,7 | C3 analytical | Legal Pony/M fits с O2 fully delivered outputs; без penalties и не скрытые identical ID merges. Curated real fit может limit и не обязан достичь nominal; nominal/actual ясно различаются. | NOT RUN | Perinstance and aggregate output |
| SF09-02 Three vs8MW finite Q | SF09; GDD§7 | C3 finite-stock | Exact O3: Q1MJ поддерживает burst1s, 3s output.5209375SCU; Q0 output.5001SCU. Не persistent9MW/3×nominal. Actual full preset дополнительно сохраняет background/path losses. | NOT RUN | Withdrawal/depletion/request/delivery/output |
| SF09-03 Mid-step finite withdrawal | SF09; GDD§6; legacyP4 | C3 dt trio | Q0=.005MJ, deficit1MW исчерпывается .005s внутри dt.01; Q≥0, withdrawal≤5000J, delivered≤actual input+withdrawal, output integral O10; никакого полного лишнего tick. | NOT RUN | .01/.005/.0025 balance/depletion |
| SF09-04 Proportional deterministic governor | SF09; powerbudget§6 | C3 kernel/replay | После protected reserve share одинаков у всех eligible nonprivileged requests, одинаковые лазеры 8/9 each в O3. Reorder input массива сохраняет totals и per-ID allocation; re-run exact same spec воспроизводим. | NOT RUN | Per-ID traces, repeated/permuted output |
| SF09-05 Beam is actual and typed | SF09; GDD§6 | C3 analytical | Beam_i=actual delivered_i·η_i; disabled/gated laser0. Solar/cooling/electric useful не дают ore. CivilS и IndustrialS используют собственные O2η, не hull class multiplier. | NOT RUN | Delivered→beam→SCU mapping perinstance |
| SF10-01 Fixed LAB-ORE-01 rate | SF10; GDD§6–7 | C3 analytical | O1 all constants/factors exact; 10s extraction.625125SCU/937.6875kg. Новый fixed lab process не silently включает dynamic softening current game owner и не использует legacy100MJ/SCU. | NOT RUN | Input constants и actual scalar output |
| SF10-02 Return heat once | SF10; GDD§6 | C3 energy | O1 return5.25105MJ добавлено host ровно раз, вычтено external useful ровно раз; host20.24805MJ + external9.75195MJ=30MJ. Beam не независимый второй source. | NOT RUN | Source/sink ledger + residual |
| SF10-03 Extraction zero boundaries | SF10; GDD§6–7 | C3 isolated | Zero delivered bus, work0, closed gate и cargo0 каждый дают0SCU; no NaN/Infinity/phantom cargo. Unit output не создают non-mining consumers. | NOT RUN | Four reasoned zero-output traces |
| SF10-04 Finite limits convergence | SF10; VC numerical | C3 dt trio | Finite Q/tank/buffer, cargo fill и return/gate cases по .01/.005/.0025s: SCU difference≤1%, eventtime≤.01s, same firstcause/group semantics. One-step и repeated residual O10 без ослабления. | NOT RUN | Three independent outputs/residuals |
| SF10-05 Process sensitivity bounds | SF10; GDD§6 | C3 numerical | Explicit density1000/3000 меняет kg, не beam-derived SCU при factors unchanged; return.30/.40 меняет host/external, их сумма постоянна. Factors1 и 24MJ оставлены fixed, без скрытой recipe substitution. | NOT RUN | Endpoint ledger/output deltas |
| SF11-01 Shared H₂ three consumers | SF11; GDD§6; multifuel§3 | C3 finite-stock | O8 generator/engine/cooler одновременно: totalH₂=.001kg, depletion≈1/6s, stocks≥0. Добавить2tanks той же species→один суммарный physical circuit; different species изолированы. | NOT RUN | Perpurpose flow and aggregate stock conservation |
| SF11-02 Signed radiation/background | SF11; GDD§6; legacyP5,8 | C3 isolated | T_surface=T_env→net0; hotter environment→incoming/net heating, colder→outgoing. Не constant-MW sink и не double background+direct term; self exhaust не охлаждает прежнее hull heat. | NOT RUN | Signed in/out/net/heat balance |
| SF11-03 Thermal stop/restart | SF11; GDD§6; legacyP7 | C3 gate regression | High/low gate закрывается в accepted thresholds, restart только после hysteresis; no chatter и no work при closed. Проверить crossing внутри dt и peak до конца tick, force/mining actual согласованы. | NOT RUN | Threshold/gate/peak/event trace |
| SF11-04 Finite inverter/buffer | SF11; GDD§6; legacyP6 | C3 device | Buffer cap10J, rate100W, dt.2: moved≤10J; full buffer не unlimited sink. Inverter hot rejection0→moved0; synthetic COP2/reject150W требует moved+electric≤150W (не200+100). Starvation не оставляет бесплатное cooling. | NOT RUN | Stocks/power/hot rejection ledger |
| SF11-05 Preserve background floors | SF11; legacyP7; GDD§6 | C3 invariant fixtures | Background не тратит battery stock и source0/bg100W получает0J; within-step80%Q/20%usablefuel/10Kmargin eligibility соблюдена. Active/protected можно ниже bg floors, общего stock clamp нет. Contents не увеличивают C. | NOT RUN | Selected legacy invariant traces |
| SF12-01 Interval and unfinished cycle | SF12; GDD§7 | C3 metrics | O7 exact10s→.28130625SCU/cycle,101.27025SCU/h. Horizon5s cycle незавершён: only measured horizon result, completion time/cycle yield не invent. Display/export называют denominator interval. | NOT RUN | Metrics/units/labels exact intervals |
| SF12-02 Typed kg/SCU H₂ subset | SF12; GDD§7 | C3 metrics | Extraction2SCU; diesel6kg, H₂gen1kg/cooler3kg/drive2kg: diesel3kg/SCU,H₂total3kg/SCU,cooler1.5kg/SCU subset. TotalH₂6kg, не9; назначения и species видимы. | NOT RUN | Hand ratios vs metrics/CSV |
| SF12-03 No-output N/A | SF12; GDD§7 | C3 + C5 | Extraction0 при positive fuel consumption: все удельные kg/SCU N/A/«не определено», не0/Infinity/NaN; no false economy. Абсолютный расход остаётся числом. | NOT RUN | No-output metrics/DOM/export |
| SF12-04 Planned/forced/partial split | SF12; GDD§7 | C3 metrics | O7 planned3s, forcedzero2s, partial1s; planned intervals не forced downtime. De-rating отдельно от полного stop; overlaps не counted дважды в total union. | NOT RUN | Exact counters/union/overlap |
| SF12-05 Recovery summaries/open stop | SF12; GDD§7 | C3 metrics | O7 recovery2s к partial positive at6. RepeatedN: first2/countN/mean2/max2; append unrecovered stop→«не восстановился» separately, mean не включает open. Не ждёт100%charge. | NOT RUN | Completed/open counts and labels |
| SF13-01 Three installed/one selected valid | SF13; GDD§7 | C3 integral | 3installed, group толькоid1, толькоid1positive: denominator r1, numerator id1actual. Два inactive вне группы не портят K; O7 K=.45, рядом абсолютные .28130625SCU. | NOT RUN | Fixed group/membership and K oracle |
| SF13-02 Active outside group error | SF13; GDD§7 | C3 schema | 3installed/1selected, positive requests id1/id2/id3→error до Run; не K=3 и не hidden clampK=1. Duplicate/unknown/nonmining group ID также reject. | NOT RUN | Rejection paths + prior fit preserved |
| SF13-03 Fixed denominator/off/duty | SF13; GDD§7 | C3 integral | 10s cycle, selected1, full power but duty.5 всю work10s→K=.5, не1; manualoff5s/full5s→K=.5. Transit/service0output входят10s, grouprated не уменьшается. | NOT RUN | Rated vs requested/actual integral |
| SF13-04 Empty/time0/partial horizon | SF13; GDD§7 | C3 metrics/schema | Emptygroup или observedtime0 K=N/A; valid partial horizon O7 до5s: output2r, K_horizon=.4, без completed-cycle label. Invalid zero-duration phase при этом по SF07 reject. | NOT RUN | N/A and partial label/export |
| SF13-05 Membership export/replay | SF13; GDD§7,9 | C3 roundtrip + C5 | Resolved group IDs/rated denominator сохранены. Replay не расширяет group до всехinstalled и не выбирает newest catalog. K∈[0,1] по физике/integral, не post-clamp; no universal score across roles. | NOT RUN | Original/replay group/K and DOM labels |
| SF14-01 Earliest actual loss | SF14; GDD§7 | C3 metrics/kernel | O7 power first at4s; earlier resource event without loss игнорируется для firstblocker. Positive requested partial loss считается limiter onset; duty0 не starvation. | NOT RUN | Event chronology vs requested/actual work |
| SF14-02 Ties and refinement | SF14; VC numerical | C3 deterministic + dt trio | O9 atdt.01:4.000/4.005 grouped simultaneous;4.020 separate. Refinement сохраняет honest grouping при near simultaneity≤largestdt, не уверенный wrong singleton. | NOT RUN | Grouped causes/timestamps three dt |
| SF14-03 Target reached is success | SF14; GDD§7 | C3 kernel/metrics | Target reached до cargo full/ресурса завершает задачу; normal goal event не blocker. Фиксированное время transit не доказывает flight completion. | NOT RUN | Status/goal event/firstlimiter |
| SF14-04 Resource exhausted without loss | SF14; GDD§7 | C3 kernel | CoolerH₂0 при достаточно холодном корабле и full requested mining: resource event есть, firstlimiter нет. No limiting event→«не выявлено за данный опыт», не infinite sustainability. | NOT RUN | Resource/mining trace и F1 label |
| SF14-05 Cause duration overlap | SF14; GDD§7 | C3 metrics | O7 power[4,6)/thermal[5,6):2s/1s cause,2s union,1s overlap. Не display300% или total3s; loss/forced/partial counters по measured request. | NOT RUN | Exact union/overlap vs visible/exported totals |
| SF15-01 Same-task 1/2/3 series | SF15; GDD§4,7 | C3 matrix + C5 A/B | Legal Pony/M series сохраняет hull, ore/env/phases/service/horizon, initialstocks и auxiliaries; меняется числоlaser явно. O2nominal и O3actual различаются; source/experimental flags visible. | NOT RUN | Three resolved specs + comparison metadata |
| SF15-02 Non-comparable conditions | SF15; GDD§7 | C3 + C5 | Изменить ore density/return, horizon, phases/service, initialQ/fuel либо env между A/B→visible non-comparable condition. Нет молчаливого «same task» или ranking по чужому denominator. | NOT RUN | Changed-condition labels and export diff |
| SF15-03 Repeated service no free reset | SF15; GDD§6–7 | C3 repeated kernel | Два+цикла без explicitrefuel/charge/cooling: boundary stocks/T/buffer наследуются. Unload меняет толькоcargo; nextcycle не Qmax/fuelmax/Tinitial. Burst ухудшается после finiteQ, recovery измеряется. | NOT RUN | Boundary before/after and cycle result |
| SF15-04 Sensitivity endpoints | SF15; GDD§5–6 | C3 paired endpoint | Builtin surface80/160kg/m², missingcp350/900J/kgK, ore1000/3000kg/m³, return.30/.40, shellM/L±25% явные endpoint experiments. No probability/guaranteedU2TTX; output/heat/mass consequences показаны. | NOT RUN | Endpoint inputs/provenance/paired deltas |
| SF15-05 Added hardware full costs | SF15; GDD§4–7 | C3 + C5 | Addedlaser drymass/C/power/emitterreturnheat включены; cargo mass меняетF/currentmass. Триlaser не объявляются3×measured sustainability без actualrun; KрядомSCU/h, measured gain отдельным опытом. | NOT RUN | Bill/load delta and actual comparison |
| SF16-01 Preset-slot-swap flow | SF16; GDD§8 | C5 live DOM | Из ready preset выбратьslot, compatiblecatalog, swapgenerator/laser без JSON. До применения sidebyside mass/input/output/cargo/thermalbill delta, static conditions labelled. | NOT RUN | UI actions/screens/visible deltas |
| SF16-02 Explain incompatibility | SF16; GDD§8 | C5 live DOM | Incompatible larger/category/architecture item можно посмотреть с конкретным refusal; apply не портитfit. Builtin и removable два видимых блока; no hidden purchase/ownership requirement. | NOT RUN | Refusal text + unchanged selectedfit |
| SF16-03 Empty/error/loading persistence | SF16; GDD§8–9 | C5 | Empty slot/catalogfilter, invalid local input/import, loading и success имеют ясные тексты. Last validfit/run/result остаётся после error; inlinewarnings без modal cascade. | NOT RUN | DOM states and saved prior identities |
| SF16-04 Touch390 and keyboard | SF16; GDD§8 | C5 390px touch/keyboard | Viewport390px: readiness/F1/mainaction доступны; slotgroups сворачиваются touch; flow работает click/tap/keyboard, без hover/drag. Controls не перекрыты и scroll до F3/export доступен. | NOT RUN | 390px DOM/actual interaction + image |
| SF16-05 F1/F2/F3 units/provenance | SF16; GDD§8 | C5 | F1task/readiness/firstlimiter/result; F2slot/delta/powerthermalcargomass; F3exactSI/source/ledger/export. Eachfield имеет unit/origin; retained/displayed channels/aggregation/cadence visible. | NOT RUN | Text/units/provenance/retention labels |
| SF17-01 Immutable A/running snapshot | SF17; GDD§8–9 | C3 + C5 Worker | Start A, save A, editnextfit: fitRevision меняется; runningresolvedsnapshot и savedA numbers/IDs/spec/result не меняются. Apply newvariant не mutatesoldcatalogsnapshot. | NOT RUN | Identity/hash before/after edit |
| SF17-02 New identity/stale messages | SF17; GDD§8 | C3 protocol + C5 | Start/reset/import меняютrunId; oldrun chunks/results/controlacks не обновляютnewfit/result. Old cancelACK не отменяетnewwork; IDs работают nonlocalHTTP без randomUUID. | NOT RUN | Correlated IDs/stale injection/live state |
| SF17-03 Wrong/duplicate ACK | SF17; legacyP10 | C3 protocol | telemetryACK=(runId,chunkId); wrong/stale/duplicate не освобождаетcurrent чужойslot. controlACK=(runId,commandId,control); mismatch не matchingack и не меняетrun. | NOT RUN | Protocol input/output and retained queue |
| SF17-04 Telemetry cap without control block | SF17; GDD§8; legacyP10 | C5 slow consumer | HoldtelemetryACK: unackedchunks≤1, queuebounded. Pause/Step/Cancel доступны без telemetryACK; cancelledwork не resumes после lateACK; Step не меняетphysicsdt. | NOT RUN | Chunk/ACK sequence/queue measure |
| SF17-05 Control ACK≤500ms | SF17; VC SF19; legacyP10 | C5 long Worker | При≥40000buckets и delayedtelemetryACK measure UIcommand→matchingWorkerACK для Pause/Step/Cancel≤500ms на declaredhost. Записать всеlatencies/browser/CPU, не только click response. | NOT RUN | Raw timing/correlation IDs/host |
| SF18-01 Resolved v2 roundtrip | SF18; GDD§9 | C3 export/import/replay | Fit+run содержит versions, SI resolvedsnapshot, IDs/slotassignments/localvariants/group/conditions/units/origins. Roundtrip сохранит числа/spec/trace/metrics; newestcatalog не substituteresolved. | NOT RUN | Exact JSON diff/replay trace |
| SF18-02 Legacy goldens | SF18; GDD§9; P1–P14 | C3 legacy runner | Exact baseline6fb716 v1goldens для S/M/finiteQ/sharedH₂/peak сохраняют model/catalognumerics, old100MJ/SCU и oldcargoanchors. v2replay той же v1spec совпадает trace/events/metrics в legacy tolerance; no slotvalidbadge/auto24MJ/cargo96 conversion. | NOT RUN | Immutable v1input + baseline/new outputs/digests |
| SF18-03 Unsupported model/schema | SF18; GDD§9 | C3 + C5 import | Unknownmodel/schema reject доrun, path+reason; wrongunit/nonfinite/negativecapacity/outofrangestock/wrongrefs reject без clamp. Previousfit/run/A/result immutable после каждогоfailure. | NOT RUN | Atomic identities before/after each rejection |
| SF18-04 Unknown catalog/revision replay | SF18; GDD§9 | C3 + C5 | Supportedmodel+trustedcomplete resolvednumericalsnapshot с unknowncatalog только explicit snapshotreplay mode; не validatedfitting. Unknownslotmodel no validation claim; missingtrustednumbers не silently repaired by latestcatalog. | NOT RUN | Mode/reason/identical resolvednumbers |
| SF18-05 Text and atomic imports | SF18; GDD§9 | C5 security + C3 | MalformedJSON/unknownversion/importduringrun не уничтожаетpreviousvalid state. Labels вроде `<img src=x onerror=...>` выводятся текстом; no HTML execution/requests. Validimport меняетidentity, staleoldmessages ignored. | NOT RUN | Text DOM/no execution + state hashes |
| SF19-01 Actual worst-fit12h heap | SF19; VC retention | C4 actual kernel | Newcuratedfit worst fixedroster,43200s/dt.01: buckets≤50000, telemetryretention≤128MiB, actualheap включает metricstate. Зафиксировать CPU/channel/catalog/ticks/wallpeak; oldv112h не substituted. | NOT RUN | Independent long JSON + heap/timing |
| SF19-02 Event truncation first/last | SF19; GDD§7 | C3 + C4 | >20000events сохраняет first128+last19872 exacttimestamps/order, events≤20000, droppedcount visible. Firstlimiter/firstrecovery не потеряны при truncation; eventretention не inputдляsummaries. | NOT RUN | Original oracle first/last/dropped vs retained |
| SF19-03 Bounded online alternating metrics | SF19; GDD§7 | C3 metrics + C4 | O7N10 vsN30000 одинаковый fixedinstance/cause roster; exactoutput/durations/union/overlap/loss/recovery formula, constant-sized counters/openstate, no growinginterval/recoveryhistories. Unknown IDs/causes reject, не dynamicunboundedkey creation. | NOT RUN | Counts/schema/heap-growth and exactoracles |
| SF19-04 Peaks despite downsampling/drop | SF19; GDD§7; legacyP13 | C3 + C4 | Within-basedt500K peak перед tickend и removedraw-event interval сохраняется actualpeak/channelminmax. Online metrics O7 остаются exactпосле truncation/coarsenedbuckets; не derivedfromdownsamplemeans/lostevents. | NOT RUN | Tickpeak vs retained/summary + truncatedoracle |
| SF19-05 Correct export units/metadata | SF19; GDD§8–9 | C3 + C5 export | Export permodule requested/deliveredW, energyJ, forceN, miningSCU/rateSCU/s, currentmasskg, resourcekg/species, timestampss; retainedcadence/aggregation/channelcount/dropped explicit. C не mass и ore неtonne/SCU substitution. | NOT RUN | CSV/JSON header/unit/metadata checks |
| SF20-01 Fresh clean deterministic checks | SF20; VC | C0–C2 | Exactcandidate cleanbuild/type/test/browser pass; verify evidence currentHEAD. Anyfailure realFAIL, missingmeasurement NOTRUN. Countsпубликуются actual, skipped не PASS. | NOT RUN | Commands/exitcodes/currentSHA/builddigest |
| SF20-02 Actual extracted artifact | SF20; GDD§1,9 | C6 live smoke | ActualZIP/extractedbytes match builddigest; S/M fittingrun/step/reset/A-B/importexports work, no pageerrors/404; sameoriginassets/Worker без simulationbackend/CDN. | NOT RUN | ZIP/extraction/build SHA, network/errors/actions |
| SF20-03 Non-local ordinary HTTP | SF20; legacy0.1.1fix | C6 + C5 | Browser на реальном nonloopbackHTTP origin secure=false; randomUUID может отсутствовать. Start/reset/newCivilM/step создают validrunId и Worker работает; sameorigin4+requests не падают доWorker. | NOT RUN | Origin/isSecureContext/API/IDs/network/trace |
| SF20-04 HTTPS Pages prefix equivalence | SF20; GDD§1 | C6 prefix browser | `/u2-lab/` base/prefix и HTTPS-compatible sameoriginWorker/assets; deep/prefixURLs no404. LocalHTTPS/prefix smoke label как emulation, не publicdeployment. PublicPages actual только handeddeployedbuild evidence. | NOT RUN | Actual URL/build/requests or explicitlocal limit |
| SF20-05 Physical/native honest limits | SF20; VC boundaries | Manual operator/device | SecondphysicalLANdevice/nativehooks/bootstrap/finalize/operatormerge отдельные gates. Без actualdevice/native evidence NOTRUN; two browsercontexts/390emulation не физические2clients. Не приёмкаbasebootstrap и не deployment. | NOT RUN | Нет handed physical/native evidence |

## Ambiguities / известные пределы подготовки

Unresolved source WHAT ambiguities: **0 обнаружено при подготовке этих cases**. Automatic
proportional allocation отдельно подтверждён current owner §6; не выбран QA как новый WHAT.
Точное numeric recipe остальных authored experimental SKU допустимо объявлять Developer
по принятому GDD; оно будет проверено как finite declared SI bill с provenance и sensitivity,
а не выдумано здесь. Форма новых schema/API и executable fixture — технический execution
adapter, который читается после exact candidate, не новый product canon.

Если после candidate источник не определяет expected для конкретного reachable input:
`Result: NOT RUN`, `Reason: unresolved product/contract ambiguity`, точный case/path/input
возвращается PM. QA не вводит новый verdict enum, не решает WHAT и не понижает FAIL до advisory.
Если runtime просто не соответствует определённому source expected, это воспроизводимый FAIL.

Все 100 cases сейчас NOT RUN из-за отсутствия handed candidate/build, а SF20-05 также зависит
от реального отдельного evidence. Prior baseline QA/12h и emulated origins не заменяют новый
v2 runtime/physical/native acceptance. После PM followup работа продолжается в этой же QA
session; отдельного нового verifier launch/report rewrite для скрытия исходного результата нет.

— QA (Codex; точный provider model ID не доступен)
