---
title: "План каталога 0.2.5: D/H/E"
status: accepted / numeric amendment to reviewed v0.2
version: "0.3"
date: 2026-10-07
---

# Реализация вариантов питания D/H/E

Goal: рабочие средние2-laser/bulk192 defaults, ВолнаH/builtin cryotank,
МирU D/E и Ермак/ТитанU D/H/E.
Architecture: новая edition поверх literal .0–.4, реальные modules/resource ledger;
суффикс preset означает монтаж, без нового hidden runtime режима.
Tech Stack: TypeScript/JSON/Vitest/Playwright/Vite.
Spec: docs/product/ship-fitting-catalog-0.2.5.md0.3; прямой последний WHAT оператора.
Work itemulab-jc1; PRODUCTbudget5. Plan1 подписал PLAN_READY для HOW0.2; после него оператор изменил только capacity+10→+20%.
Этот numeric FAST amendment проверен PM; новая QA/CodeReview читаютwhole0.3.

QA2/CodeReview3 reserved, affected4/5 только при namedFAIL. Один Developer.
Runtimebaseline650007bcaf87df9fb3f74d0f71fb7f4bdf90af12, branchfeat/medium-defaults-0.2.5;
Draft stacked basefeat/mobile-compact-v4.3. Proposed0.1docs commit3449ec4 historical,
не реализован; .3 staged/frozen с принятым numeric amendment, Developer включает их в finalcommit.

## Scope и владельцы

Изменяются только known .5/type H, new edition hulls/defaults, реестр menu presets,
необходимые architecture/input gates и адресованные tests. Запрещены новый slot budget,
новыеglobal SKU, физическиеформулы/runner/kernel/scenarios и forced migration.
BuiltinVolnaM capacity+20% — единственная новая declared lab parameter hypothesis,
явно ограниченная этой моделью; все50global SKU неизменны.

1. До кода Developer фиксирует независимые .4 digests catalog/семьhulls/allfactorypresets/
   short resolvedspecs; новые tests/fitting/catalog-0.2.5.test.ts наMD01–06 даютRED
   по .5/архитектуре/сборкам. Existing .0–.4 digesttests не переписываются под новый результат.
2. src/fitting/types.ts/editions.ts: H допустим только как declared hull type,
   .5 known; derive .5 без mutation .4. MirU remove builtinbattery, VolnaH replace
   builtinbattery→explicitPowerbuiltincryotank поSpec (обычныеmaterials/numerics/gates).
   fitHull и fitItem по edition, false stamps не обходят known-version/declared-hull checks.
   src/fitting/validate.ts: H homogeneoushydrogen илиelectrichybrid, diesel direct запрещён;
   existing E utilities carry .5; все4roleshomogeneous и реальныеbattery/species sources обязательны.
3. src/fitting/catalog.ts getPresetFit(id,version): D/H/E aliases `${hullId}:${count}:${code}`,
   bare defaultsпоSpec, ErmakD exactoperator .4 assembly; others size/class/Power/payload поSpec.
   Existing reference retro localvariant bill preserved. Add shared exported
   presetOptions/catalog factory list here (id/label/fit), использует ship-view.ts;
   UI не должна копировать таблицу fuel/count policy. Explicit legacy preset/API поведение прежних
   edition не меняется; unsupported presetcode не подменяется молча другойсборкой.
4. src/app/main.ts current .5; ship-view.ts один option на declared assembly (Mir2,
   Ermak3,Titan3,Volna1), M no1/3. Actual selection по catalogversion и реальному
   mounted preset (revision отдельно); custom/oldimported fit — explicit current/custom option.
   src/io/fitting-json.ts только existing known-edition/H guards при необходимости;
   oldpositive roundtrip + forged architecture/builtin rejected atomically.
5. tests/browser/catalog-0.2.5.spec.ts genuine touch390 и1440 wholechain:
   все9addressed assemblies selectable/runnable; builtinvisible/count/mounts, shortactualWorker
   result с ресурсным ledger; одна полная Start/Pause/editnext/freeze/Resume/export/freshreopen цепочка;
   H builtin+extraH tank aggregate and old .4 import/replay. Обновлять только fresh-M
   existing browserselectors которые больше отсутствуют; old .4 pinned unit expectations сохранять.
6. AddressedGREEN→mandatory normal verify.sh guardedcommit/build→FFpush immutablecandidate.
   QA7AC и один scopedCodeReviewer; advisory не расширяют scope. PM после PASS/APPROVED
   публикуетLAN4196/Pages и проверяет bareURL/title/edition/menu, closesBeads/MemoryBank.
   Source/build и whole2 content fingerprints; old signedreports/assets retained.

## Verification Contract / Review Focus

| AC | Ожидаемое поведение и метод |
|---|---|
| MD01 | ВолнаH + МирD/E + ТитанD/H/E: каждаяMdefault valid/canRun,2ownclassMlasers +1cargo-bulk-M192. Ore capacities216/216/240; встроенное/сменное учитываетсяодинраз. Unit+native. |
| MD02 | МирU defaultsD/E; ЕрмакU/ТитанU D/H/E. Propulsionactual homogeneous4roles, typedfuel/battery required; mixedtype/нетbattery/нетtypedtank refusal. ErmakD exactpreviousJSON (apartstamp/revision), H/E sameS payload/signature. |
| MD03 | Волна .5 H: builtin cargo24 + builtinH₂ cryotank4377.0845148kg/declaredexperimental; нетbuiltinbattery. InstalledbatteryM/genH2M, fourhydrogenMroles. Hydrogen/electrichybrid allowed; dieseldirectrejected. Builtinне снимается/неподменяется; extraH₂ tank aggregates/bill/fuel ledgerодинраз, exhaustionне производитресурсы. |
| MD04 | Menu Мир2/Ермак3/Титан3/Волна1 fuel-labelled options; noM1/3 options, Спутник/Пони/L прежние. Dropdownactualselected/correctsamehull; custom1/3илиoldeditionfit explicitcustom, noforcedreset. Wrong code refuses; manualhydrogenMir possible although menuonlyD/E. |
| MD05 | .0–.4 snapshots/фабрики,50SKU и малыеJSON bytes exact. OldMir/VolnaE still replay exact; E utility permissions .3/.4/.5 remain. Newfit/run/result roundtripHсbuiltin и oldrun/result, unknown/forgedversion/architecture/builtin mismatch rejected atomically. |
| MD06 | Touch390 +1440 native actualWorker: all9newassembliesselected/runnable/result; onewholeedit/run/pause/next/freeze/analyze/IO chain; active/current/frozen owner and station checkbox/literalV_FA/distance/time conditions preserved. Browsererrors0, functionalcontrolsreachable. |
| MD07 | NumericglobalSKU/kernel/runner/scenarios byteexact650; finalguardPASS/actualsourcebuildbinding. LAN4196+barePages show GD LAB/current.5/assemblymenu; physical devicesNOTRUN. |

ReviewFocus:1builtinH fuel countedtwice(MD03);2type suffix hiddenmode versus actualmodules(MD02/04);
3historical .4 auto-restamp(MD05);4customselect depicts anotherhull(MD04);5active-next/condition
ownership onnewassembly(MD06). Каждому соответствует адресованный test, без полнойnewQAматрицы.
Экономическуюоптимальность/непрерывнуюработубезограничений не обещать и не чинитьчисленныйдвижок
в этойпоставке. Rollback — source650/gd-lab-label-release, priorassetsretain.
PMself-check: последнееWHAT покрыто, builtinadvantage explicittemporarynotcanon,
slotsunchanged; предыдущаяPlan0.1задачапрекращена доDEV. Status ведёт Beads, неcheckboxплана.
