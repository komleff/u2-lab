# Independent adversarial PLAN_REVIEW — affected re-review

**Verdict: PLAN_READY. Active BLOCKER:0.**

- Mode / Role: PLAN_REVIEW / independent Reviewer
- Model: actual provider/model ID недоступен.
- Commit:2febe037bc9db9475c426aa7907d3121962fc8ca
- Review: affected re-review B1–B4 в прежней verifier session; PRODUCT остаётся1/5 launches.
- Source: product contract, launch plan и product Verification Contract.
- Trusted policy: OverGate v4.0.0-rc.1 /633937250fa8f47b49f928c1d8781ab17fe8c8e3;
  RV/PM roles и ADR §§3.28–3.32.
- Content-Fingerprint:6d1d4bc86e8f465e58d6412010d5226e26b44fbfc6f771f66cefd0b4dfbeb673

Проверены исправления четырёх blockers и связанная правка ACK protocol. Полный новый аудит
не выполнялся. Report authored independent Reviewer, сохранён PM без изменения выводов.

| Finding | Результат | Reviewed surface / evidence |
|---|---|---|
| B1 | CLOSED | launch:71–78,103–114,125–130; VC P4. tankId/species/consumer refs, joint simultaneous-flow budget, event-aligned depletion; shared generator/engine/cooler, species isolation, permutation fixtures. Unknown multiple-tank policy remains gap |
| B2 | CLOSED | launch:107–114,135–152; VC P7. remaining interval resolver, within-dt recompute, actual protected/Active/cooling flows; no common80% clamp |
| B3 | CLOSED | launch:163–191; VC P10,43–50. bounded telemetry/events, incremental metrics/aggregation, queue cap/concrete12h performance fixture; correlated ACK protocol; slow/missing ACK doesn't block controls; stale/wrong ACK fixtures |
| B4 | CLOSED | launch:86–92; VC P12. finite positive dt/duration/Qmax/C_ship, Kelvin/stock bounds and tank refs; reject invalid before run with path/reason |

## Исправление интерпретации B2 независимым Reviewer

Исходный пример неправильно допускал расход Background из аккумулятора до80% floor.
Qmax1000J/Q801J/source0/Active0/bg100W/dt1s → правильный Background delivery **0J**, не1J.
Protected load учитывается отдельно. План закрепляет существующее canonical правило.
Within-step guard относится к actual source headroom/recovery eligibility, fuel reserve и
thermal margin. Это уточнение существующей policy, не новое игровое правило.

ADVISORY A1–A3 не повышены до blockers и не расширяли scope. Triage остаётся reject with
rationale: numerical norm — DEV детализация внутри tolerances; attribution обязателен P8;
ограниченная матрица разрешена where meaningful.

## Reviewed-Paths / acceptance package

```text
AGENTS.md b3ea6f1456b6e6ac7e13a3430b2135bcb072dfb0
docs/architecture/source-authority.md e75be660520826e1cdc09d98d25af04089421be1
docs/architecture/u2-source-inventory.json 4f9597b66d49fb05701a8e92f941ba1e6e4caa98
docs/plans/2026-10-05-u2-lab-launch.md ad0ee38d9317c4a0fa6631201da3535699265b96
docs/product/power-heat-lab-v0.1.md 7fb875dc5b4a7c34ae13ba2e9c297c57c42103ba
docs/verification/power-heat-v0.1-contract.md 4276fff6498f85ba84912105add8f415035867c5
```

SHA256(sorted UTF8 `path SP gitblob LF` + exact LF-normalized product VC bytes), no markers.
VC9901bytes; SHA25668d0112709a0fb35ad4ee69284a88ab0778739fb28f4828a669dac3f820aff24.
INDEX/Memory Bank — routing/bookkeeping context, OUT of narrow acceptance fingerprint.
Fingerprint не является fingerprint полного PR или installer inventory.

Verification: diff whitespace PASS; committed reviewed blobs проверены перед report.
Runtime/model/browser/LAN NOT RUN. Не сертифицированы implementation, actual SKU числа,
полные U2 owners против inventory, installer inventory/apply, source full-suite results,
CI/remote PR/hooks activation. Reviewer не менял файлы и ничего не публиковал.

**PLAN_READY относится только к продуктовой реализуемости плана.** Реальные Draft PR и
installer inventory/approval остаются обязательными B0 dependencies. Report не является
install PLAN_READY, runtime QA или разрешением обходить B0.

## PM binding check / publication state

PM независимо пересчитывает fingerprint на финальном local HEAD. Последующие изменения
INDEX/Memory Bank/review reports/bootstrap evidence не входят в acceptance package выше.
Remote/PR пока отсутствуют; report local, publication pending. Первое CHANGES_REQUIRED
сохранено отдельно, выводы и исправленная интерпретация B2 не скрыты.
