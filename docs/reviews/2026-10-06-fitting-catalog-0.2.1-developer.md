---
title: "Developer: fitting catalog0.2.1"
status: DONE_WITH_CONCERNS
version: "1.0"
date: 2026-10-06
related:
  - docs/product/ship-fitting-catalog-0.2.1.md
  - docs/plans/2026-10-06-fitting-catalog-0.2.1.md
---

# DONE_WITH_CONCERNS — source frozen, Developer IDLE

Role: sole primary Developer `/root/ship_fitting_developer`. Model: Codex, GPT-6 family;
exact provider model identifier среда не сообщила. Worktree `/Users/komleff/Documents/GitHub/u2-lab-claude-ui`,
branch `feat/gd-workspace-v4`. Planning checkpoint `5aac29d39dd697135d982b167ce4a66cbffce685`
получен guarded FF-only; PLAN_READY/frozen WHAT/HOW прочитаны целиком.
Final source **`131570d8f018d3617067bb558099f68aff7c9a53`**, один atomic implementation commit, clean tree.
Операторские catalog C01–08 реализованы; acceptance/merge readiness не объявляю.
PM — sole publisher/Beads writer; серверы/вкладки оператора Developer не менял.

## Что изменено

Additive JSON содержит три явных Industrial diesel M/G2 SKU для четырёх slots и два
laser SKU. Base40items, шесть hulls и builtins сохранены byte-exact. March16,2288MN,
retro6,9552MN и одна pair4,17312MN, установленная в Strafe/Turn: force-share bills дают
160t в сумме. η0.40/range0.32–0.50, path0.95/host0.70 и material/cp явно сохраняют
lab status; α=0.565e−6×0.32/η. Turn=Strafe указан как гипотеза; второго Class/G или
role multiplier нет. Civil M laser12MW/8.8t, Industrial L54.4MW/48t — authored
family-specific×4 candidates. Старые Civilian SKU доступны с прежними ТТХ.

Presets используют matching size/class/G. Pony дополнительные лазеры — явный local
UNKNOWN/G0 anchor:1MW/η0.35/2.2t, builtin не изменён. У18 count-addresses16 допустимых
presets; Sputnik/Industrial S :3 законно отвергаются прежними slots. Эту границу PM
подтвердил, frozen требования не переписывались. Новый Industrial retro обходит
старое reference×0.4; old edition сохраняет прежний exact reference.

Два известных inventory0.2.0/0.2.1 допускаются в fit/run/result paths. Old import/view
не заменяет модули и не повышает catalog stamp. Только явный Apply нового global SKU
повышает следующий draft; active spec, prior result и frozen A остаются неизменными.
Old local snapshots сохраняются. New-only SKU под falsely declared0.2.0 отвергается,
как и unknown fit/catalog loader; unknown numerical replay по-прежнему требует явного
флага и не допускается как native result. Форматы/serializers/schema не изменены.
`src/scenarios/fitting.ts` меняет только stamp `c.version→f.catalogVersion` (C05,
explicit PM confirmation); numerical/scenario algorithm прежний.

## Evidence и C mapping

| C | Собственное evidence |
|---|---|
| C01/C06 | Exact four-role force/share160t; lawful Industrial L cross-fit own-SKU identity; pair bill once/slot; incompatible pair/single отказ. Actual full-march flow7.3354176kg/s, useful/host energy, mass/C и energy residual. Origins/ranges не canonical uplift. |
| C02 | Independently assembled two M lasers/two M batteries/diesel M generator+tank/bulk M/four passive M radiators: dry412245.5504768165kg, diesel24t, cargo48+192SCU. Static full ore density1500 ledger gives796245.5504768165kg; actual compiled bills, без ship-total override/UI mission. |
| C03 | Все18 count-addresses:16 legal identity/count fixtures +2 expected отказа. Все16 новых default inputs проходят short finite mining interval. |
| C04/C05 | До production change captured16old fit/spec/native zero/partial/completed digests. Все80 object hashes и old catalog hash совпадают; interval2s/dt1 (approach), не long mining proof. Old native documents открываются exact в fresh workspace без rerun; actual browser old fit import/export0.2.0, explicit new promotion, native new fit/run/result fresh reopen. Unknown/malformed атомарно отказывают. |
| C07 | Genuine desktop1440/true-mobile390 selection→custom C02→5.25s/dt0.25 complete→analysis/actual limiter absence→fit/run/result exports→fresh reopen. Extracted localhost/LAN HTTP/local TLS-prefix:6 workflows PASS,54/54response body hashes. |
| C08 | Native held90ms desktop slot survives advancing Worker; old active spec/frozen A сохраняются при next edit/pause/cancel. Current full suite проверяет прежние nav/comparison/result ownership и v4 repairs. |

RED data17FAIL/5PASS→24PASS; edition19FAIL→19PASS; additional future-loader1FAIL→GREEN.
Native desktop RED против old dist — нового SKU нет; после build desktop/true-mobile
2PASS. Первый whole unit прогон4FAIL/270PASS обнаружил прежние numerical fixtures,
использовавшие изменённые defaults: они явно закреплены на0.2.0 с прежними expected
numbers. Исторические matrix/sensitivity documents не изменены. UI nominal Pony
ожидание теперь соответствует actual G0 anchor. Адресный affected повтор19PASS.

**Final normal guard PASS:** `bash .claude/hooks/pre-bash.sh < guard-payload.json`
перед обычным commit: `.agents/project/verify.sh` → typecheck,274unit, build,
37browser PASS +1 прежний screenshot SKIP, reference, bootstrap,26cloud tests,
shell syntax. Native adapter activation **NOT RUN**; manual dispatcher не выдан за
native activation. Raw full guard 11532B SHA256`ef0f8cbdf0ff7da8180ed38e1e39b8d04d74d6cfd2ecf98d00110a034e2308e8`.
После source commit — только read-only source/archive checks и extracted artifact smoke.
Отдельные новые12h/H3600/fullmatrix/sensitivity sweeps не запускались; mandatory suite
содержит прежние historical cases. Новый default outcome не приписывается old long evidence.

Raw ledger/RED/GREEN/harness corrections/commands: ignored
`.overgate-runtime/catalog-0.2.1-evidence/ledger.json`, exact41file evidence manifest.
Сохранены ошибки test harness (E diesel cross-fit, collapsed phone card, already-installed
Apply, heading/value selector). Они исправлены в oracle без изменения architecture/model.
Packaging helper после готовых source/build/ZIP встретил старый hash basename с trailing
hyphen; отдельный helper достроил только missing compiled proof, не переписывая snapshot.

## Source/artifact seal

Own delta vs planning checkpoint/ff8 runtime — **21paths** (9runtime/data +12test/fixture):

- `src/app/fitting-ui/presentation.ts`
- `src/fitting/catalog.ts`
- `src/fitting/data/modules-0.2.1.json`
- `src/fitting/editions.ts`
- `src/fitting/types.ts`
- `src/fitting/validate.ts`
- `src/io/fitting-json.ts`
- `src/io/fitting-result.ts`
- `src/scenarios/fitting.ts`
- `tests/browser/catalog-0.2.1.spec.ts`
- `tests/browser/fitting.spec.ts`
- `tests/fitting/bill.test.ts`
- `tests/fitting/catalog-0.2.1.test.ts`
- `tests/fitting/catalog-editions.test.ts`
- `tests/fitting/catalog.test.ts`
- `tests/fitting/fixtures/catalog-0.2.0-digests.json`
- `tests/fitting/matrix.test.ts`
- `tests/fitting/source-fidelity.test.ts`
- `tests/fitting/test-spec.ts`
- `tests/fitting/worst-fit.ts`
- `tests/ui/qa-fixes.test.ts`

Source manifest:149working+committed exact blob/byte rows, семь целых контрактов,
fingerprint`37b05e2e0da57b82231c0f632d56cc7bb092c3364ea124bfe183f4b2977fd42c`. Exact recipe:
`sha256(concat(path UTF-8 + NUL + gitBlob ASCII + LF for lexically sorted sources))`;
whole contracts — ordinary full-file blob rows, без separately appended literal text.
Actual script `.overgate-runtime/catalog-0.2.1-evidence/package-candidate.py` плюс
`complete-compiled-proof.py`; output paths/bytes — manifests.

Protected source comparison againstff8:74/85unchanged; accepted11deltas:
`src/fitting/catalog.ts`, `src/fitting/types.ts`, `src/fitting/validate.ts`, `src/io/fitting-json.ts`, `src/scenarios/fitting.ts`, `tests/fitting/bill.test.ts`, `tests/fitting/catalog.test.ts`, `tests/fitting/matrix.test.ts`, `tests/fitting/source-fidelity.test.ts`, `tests/fitting/test-spec.ts`, `tests/fitting/worst-fit.ts`.
Остальные numerical/model/runner/Worker/compile/cargo/Legacy sources exact.
Historical2experiment files exact. Protected compiled comparison2/6exact (Worker иCSS);
catalog/JSON/Legacy import graph изменён additive edition/data dependencies, поэтому
не заявляю6/6compiled equality. Old numerical equivalence доказывают source и native
fingerprints; это не перенос нового physical outcome. Первоначальные17bb/ff8 archives,
128source rows и51dist-copy hashes каждого повторно сверены и не изменились.

Immutable root: `.overgate-runtime/fitting-catalog-0.2.1-candidate/`.
Serve `extracted/dist`; prefix tree `https-root/u2-lab`.18dist files, extracted/ZIP/prefix
byte-exact; dist digest`d13b6049b49c557358ca0ccb8cc56f11ac780194de6a07a7d0db05b27485c254`. Завершённые artifact/source/evidence
files mode0444. Own ephemeral4197/4199 stopped; stable root servers untouched.

| File | Bytes | SHA256 |
|---|---:|---|
| `source-manifest.json` | 81646 | `91ce2b132eeb154175bee4a0af5071b83bc1004788fb818019ec265daaeea633` |
| `build-manifest.json` | 3437 | `23403c0dd7656c14b2557ac33adf01948950c6f56ff13f53ed260a8ef29d21b1` |
| `unchanged-runtime.json` | 33960 | `7dfedcbd7fba01f1004a1652168345ebb5d4a7a4b866bd6ff4870fcd8172adb4` |
| `source-snapshot.tar.gz` | 1069040 | `2a8358bd188cb114749e0407e12e82c1b21880e5efd2fe62f082a2647932d1c9` |
| `u2-lab-fitting-catalog-0.2.1.zip` | 525540 | `643fab21d1d7b3fc13c43c5c5a7e08e1c1cacef41f3cc7558d45173bcf3790db` |
| `evidence-manifest.json` | 8346 | `dbbe35e9ccf3441f5948c210fcebb0e3d6d0f354c92b878dcef00a55d92c6a32` |

## Limits и подпись

Physical device/pull gesture, public Pages/HTTPS deployment, native hook adapter,
main/base merges и independent QA/Review этой поправки Developer не выполнял.
TLS-prefix — локальный сертификат/emulation; viewport touch — headless Chromium,
не Xiaomi. C02 full cargo — статический ledger, не mission/refuel/flight.
η/Turn/path/host/cp/BOM hypotheses остаются lab candidates, не закрытый Industrial canon.
Новых внешних зависимостей/schema/persistence/physics не добавлено.

Signed: sole Developer / Codex,2026-10-06. **DONE_WITH_CONCERNS / IDLE**;
source/artifact frozen для PM handoff и адресной independent QA/Review.
