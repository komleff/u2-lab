---
title: "Developer fix-r1 — стабильные targets слотов при RUNNING"
status: DONE_WITH_CONCERNS
version: "1.0"
date: 2026-10-06
role: Developer
model: "Codex GPT-6 family; exact provider model identifier not exposed"
source: ff8f3e8500a54b485dec507882f88820d0c2d304
previous: 17bb6b66e6384ee53ee1250e8dc2399ef4a2256f
branch_base: f52fa386a71183267e75d9b03def8dfa579d6af3
related:
  - docs/verification/gd-workspace-v4-contract.md
  - docs/product/ship-fitting-gd-workspace-v4.md
---

# Выполненный fix

Один Developer исправил подтверждённый QA blocker WF04/06, V4-02. При живом
Pony2/H180/×1 mouse down на payload-1 приходился на старую кнопку, а up через90ms —
на другую с тем же ID: каталог не открывался. QA заранее уведомлена, что её исходные
цепочки и H3600 остаются на frozen17bb/4188. Root server этим Developer не менялся.

Причина: `fitting.ts` присваивал `slot-*` ID после `updateDom`, но свежая `shipView`
markup не имела ID. `dom.ts` штатно сравнивает old.id и fresh.id и заменял кнопку
на каждом render. Теперь тот же ID включён непосредственно в generated flat/ring
markup, а императивное присваивание удалено. Все четыре группы используют один
путь. Builtins уже имели стабильный blank ID; их identity/ARIA/handlers сохранены
и проверены. DOM patch, Worker/protocol, модель, cadence и controls не изменялись.
Pointer hacks/throttle/cache не добавлены.

Clean atomic commit `ff8f3e8500a54b485dec507882f88820d0c2d304`.
Delta от17bb — ровно три пути:

- `src/app/fitting-ui/ship-view.ts`: стабильные прежние IDs в markup flat/ring.
- `src/app/fitting.ts`: удалены две строки post-patch ID assignment.
- `tests/browser/gd-workspace-v4.spec.ts`: два native browser regressions.

Полный branch diff отf52 остаётся21path; actual список и blob/content binding —
в source-manifest. Accepted product/HOW/wholeVC не менялись. Новое поручение
оператора про Industrial diesel catalogue отдельно, в этот fix не включено.

# RED → GREEN и normal guard

Genuine RED на source17bb/dist: down498.9ms connected/same=true; up615.5ms
connected/same=false. После class fix down578.9ms →up687.5ms connected/same=true,
каталог открывается и Worker time продолжается. Это настоящие mouse events и
90ms hold, без synthetic click dispatch или принудительного прекращения render.

Два адресных browser cases — PASS: точный Pony2 payload held click, затем node
retention/actions всех propulsion/payload/power/signature, optional ring и builtins.
Immutable active owner остаётся Pony/ревизия2/H180; текущий selection и handlers
сохранены. Первые RED attempts обнаружили detach во время locator scroll/bounding
query до самой pointer sequence; для genuine pointer RED координаты сняты одним
JS-read. Эти попытки сохранены и не выдаются за состоявшийся 90ms case.

Свежий обычный commit guard:
`.claude/hooks/pre-bash.sh < .overgate-runtime/gd-v4-fix-r1-evidence/commit-guard-input.json`
→ `.agents/project/verify.sh`, exit0: typecheck/build, **231 unit PASS**,
**35 browser PASS + 1 screenshot SKIP**, reference/bootstrap, **26 cloud checks**,
shell syntax — PASS. Guard на exact staged bytes commit, `git diff --cached --check`
PASS и обычный commit без override. Native adapter activation — NOT RUN.
Raw guard11129B SHA256
`18b95d340d857b17c7dde14079739d5bfef5b5344d21b60ff0c2b35789b29556`.

# Новый immutable artifact

Отдельный корень `.overgate-runtime/gd-workspace-v4-candidate-fix-r1/`:
`extracted/dist`, `https-root/u2-lab`, `source/`, ZIP и source archive.
Original17bb candidate и его signed report не переписывались.

| Объект | Bytes | SHA256 |
|---|---:|---|
| source-manifest.json | 49234 | d950fdc4942946739d8cabf682ccd625b28013db1270908c34c0383aa811eaa5 |
| build-manifest.json | 3275 | 616458dd05f5c2fe0087f818a20a5ab2ca443d64d3f7dce1e57ba4cd3dca0036 |
| unchanged-runtime.json | 20345 | 4777e0db6cf5b79b1af706cdeb20e7a946a5f391018194485ecd593ce09eb4f2 |
| source-snapshot.tar.gz | 995080 | 036f6cf86163cda47b3cc16a956f4f619d3b7646bbe0203e42487166b8239871 |
| u2-lab-gd-workspace-v4-fix-r1.zip | 522764 | ea9b29ed3192b58f24baaa7a4276d9fdb4b4327146a882c72782417bc13620e3 |
| evidence-manifest.json | 3894 | 01c5552a0879700f4a8a991df54fc636e9c6307a092d804f0aaef08f7ba7d45e |
| original-preserved-proof.json | 352 | d9be646e7909ab6ef8ee4283649d734744f43dc2fab96de37cae595ffaf4db90 |

128 complete source rows fingerprint
`1c46feb1b2e3ba4526492a7a44a31f1b5efa6f417b043bbed87b8e7101c6a794`:
SHA256 UTF-8 concatenation sorted `path + NUL + gitBlob + LF`. Five whole contracts
are normal complete-file rows, no separate text append. Whole v4 VC remains blob
`f71682ad5a7a6820d5a6b1c8eb9c0963da9ba853`, 7970B,
SHA256 `f50fca6976ac2f73daf4e4cc5653b6aabf23b7071e83e34f2febdf2c0a9160e5`.
17-file dist digest
`c3ae0161feeb1c4df59925679a555c81f5572dfc2d5797fd357126cb32ac244d`.

85 protected base source/fixtures + two matrix/sensitivity artifacts exact;
six protected compiled assets byte-exact against17bb. Earlier v4 shared JSON/Legacy
export-graph delta versus pre-v4 remains historical, not retrospectively erased.
Numerical/catalog/scenario/runner/Worker/IO/Legacy/DOM patch source unchanged byfix.
Numerical12h, fullmatrix/performance/CI не повторялись для markup-only correction;
соответствующее прежнее evidence переносится только по actual source equivalence.

# Extracted native smoke и ограничения

`node .overgate-runtime/gd-v4-fix-r1-evidence/artifact-pointer-smoke.mjs`, exit0.
Actual localhost HTTP4197, ordinary LAN192.168.68.65:4197 и local TLS prefix
192.168.68.65:4199/u2-lab. 17×3 response bodies совпали с build SHA256.
На каждой origin desktop1440 и true-mobile390: всего36 genuine held90ms actions
(native mouse / native Chromium CDP touch). Кнопка остаётся connected/same,
каталог/parameters открывается, время продвигается, один Worker с прежним owner.
Все четыре группы и builtins проверены; optional ring — на desktop. Native viewport
inner/document/visual равен1440/390, scale1, page errors0; footer v4.0 виден.
Observations46539B SHA256
`3846d5f5fcce8284221577469b8e28ea2c58fdd075858a27efe948b74c7f7e58`.

Первый ignored smoke ошибочно отправил direct touch в центр карточки у нижней
границы (y867): actual topmost target был fixed disabled fit-resume. Диагностические
hit/input traces сохранены. Только harness scroll исправлен: карточка размещается
по центру viewport, actual elementFromPoint owner проверяется перед input. Source,
ZIP/dist/build/source snapshots не менялись после commit/packaging.

После smoke собственные HTTP55106/TLS55120 на4197/4199 остановлены. Old parent
4183/4184/4186/4188 не тронуты. Original128source rows,118raw evidence files и все
17dist files во всех трёх original copies повторно rehashed без изменений.
Physical tablet gesture/chain, public Pages, native adapter, новая независимая QA
и scoped Code Review — NOT RUN этим Developer. Local TLS — emulation, не public.
Acceptance/merge readiness не объявлены. Source/artifact frozen, IDLE для PM.
