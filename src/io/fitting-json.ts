import { catalogHasItem, fitHull, isKnownCatalogVersion } from "../fitting/editions";
import { validateRunSpec, type ValidationResult } from "../catalog/schema";
import { validateFit, installedInstances } from "../fitting/validate";
import { loadCandidateCatalog } from "../fitting/catalog";
import { validateRunSpecV2 } from "../model/v2/step";
import type { ShipFit, CandidateCatalog, ModuleItem, Slot } from "../fitting/types";
import type { StoredRunSpec } from "../model/v2/types";
import type { CandidateCatalogV3, ShipFitV3 } from "../model/v3/types";
import { isShipModelCatalogVersion } from "../model/v3/types";
import { validateRunSpecV3, validateShipModelFit } from "../model/v3/schema";
import {MODEL_V02} from '../model/governor-v03/types';
import type {RunSpecV02} from '../model/governor-v03/run-types';
import {validateRunSpecV02} from '../runner/ship-model-v02-adapter';
const invalid = <T>(code: string, message: string, path = "$"): ValidationResult<T> => ({
  ok: false,
  errors: [{ path, code, message }],
});
export function parseFitJson(text: string, catalog: CandidateCatalog): ValidationResult<ShipFit>;
export function parseFitJson(text: string, catalog: CandidateCatalogV3): ValidationResult<ShipFitV3>;
export function parseFitJson(text: string, catalog: CandidateCatalog): ValidationResult<ShipFit>;
export function parseFitJson(text: string, catalog: CandidateCatalog | CandidateCatalogV3): ValidationResult<ShipFit | ShipFitV3> {
  try {
    const fit = JSON.parse(text);
    if (isShipModelCatalogVersion(catalog.version)) return validateShipModelFit(fit, catalog as CandidateCatalogV3);
    const checked = validateFit(fit, catalog);
    return checked.valid
      ? { ok: true, value: structuredClone(fit) }
      : {
          ok: false,
          errors: checked.issues.filter((i) => i.severity === "error"),
        };
  } catch {
    return invalid("FIT_JSON", "Не удалось прочитать fitting JSON");
  }
}
export function serializeFit(fit: ShipFit | ShipFitV3): string {
  return JSON.stringify(fit, null, 2);
}
export function parseExperimentJson(text:string,options:{allowGovernorV02:true}):ValidationResult<RunSpecV02>;
export function parseExperimentJson(text:string,options?:{allowSnapshotReplay?:boolean}):ValidationResult<StoredRunSpec>;
export function parseExperimentJson(
  text: string,
  options: { allowSnapshotReplay?: boolean;allowGovernorV02?:boolean } = {},
): ValidationResult<StoredRunSpec|RunSpecV02> {
  try {
    const document = JSON.parse(text),
      spec = document?.spec ?? document;
    if (spec?.schemaVersion === "u2-lab/1") return validateRunSpec(spec);
    if(options.allowGovernorV02){const checked=validateRunSpecV02(spec);return checked.ok?checked:{ok:false,errors:[...checked.errors]};}
    if (spec?.schemaVersion === "u2-lab/4") return spec.modelVersion===MODEL_V02?invalid('MODEL_OPT_IN','Модель 0.2 требует явного qualification reader'):validateRunSpecV3(spec);
    if (spec?.schemaVersion !== "u2-lab/2" && spec?.schemaVersion !== "u2-lab/3")
      return invalid("SCHEMA", "Неподдерживаемая схема опыта");
    const validated = validateRunSpecV2(spec);
    if (!validated.ok) return validated;
    if (isKnownCatalogVersion(spec.catalogVersion)) {
      const fit = validated.value.resolvedShip.fit;
      if (fit.catalogVersion !== spec.catalogVersion ||
          Object.values(fit.instances).some(i => !fit.localVariants[i.itemId] && !catalogHasItem(spec.catalogVersion, i.itemId)) ||
          validated.value.resolvedShip.instances.some(i => !i.builtin && !fit.localVariants[i.item.id] && !catalogHasItem(spec.catalogVersion, i.item.id)))
        return invalid("CATALOG_INVENTORY", "Изделие или version stamp не принадлежит объявленному каталогу");
      const catalog = loadCandidateCatalog(spec.catalogVersion);
      const mounting = validateFit(fit, catalog);
      if (!mounting.valid)
        return { ok: false, errors: mounting.issues.filter(i => i.severity === "error") };
      // Законный вложенный fit не разрешает скрытые изделия в численном roster.
      // Сверяем только монтажную идентичность; авторские ТТХ, bill и измерения не пересчитываем.
      const declared = fitHull(fit, catalog)!, resolved = validated.value.resolvedShip;
      const sameItem = (a: ModuleItem, b: ModuleItem) =>
        (["id", "family", "category", "size", "formFactor", "species", "propulsionType"] as const)
          .every(key => a[key] === b[key]);
      const sameSlot = (a: Slot, b: Slot) =>
        (["id", "category", "size", "formFactor", "mandatory", "role"] as const)
          .every(key => a[key] === b[key]) &&
        Array.isArray(b.families) && JSON.stringify([...a.families].sort()) === JSON.stringify([...b.families].sort());
      if (resolved.hull.id !== declared.id || resolved.hull.architecture !== declared.architecture || resolved.hull.size !== declared.size ||
          !Array.isArray(resolved.hull.slots) || resolved.hull.slots.length !== declared.slots.length ||
          declared.slots.some(s => { const actual = resolved.hull.slots.find(x => x.id === s.id); return !actual || !sameSlot(s, actual); }) ||
          !Array.isArray(resolved.hull.builtins) || resolved.hull.builtins.length !== declared.builtins.length ||
          declared.builtins.some(b => { const actual = resolved.hull.builtins.find(x => x.id === b.id); return !actual || actual.role !== b.role || !sameItem(b.item, actual.item); }))
        return invalid("RESOLVED_MOUNT", "Монтажный профиль корпуса не соответствует объявленной редакции fitting", "resolvedShip.hull");
      const expected = installedInstances(fit, catalog);
      if (resolved.instances.length !== expected.length)
        return invalid("RESOLVED_MOUNT", "Численный roster содержит лишние или пропущенные установленные экземпляры", "resolvedShip.instances");
      for (const wanted of expected) {
        const actual = resolved.instances.find(i => i.id === wanted.id);
        if (!actual || actual.slotId !== wanted.slotId || actual.role !== wanted.role ||
            actual.enabled !== wanted.enabled || actual.builtin !== wanted.builtin || !sameItem(actual.item, wanted.item))
          return invalid("RESOLVED_MOUNT", "ID, слот, изделие или режим экземпляра не соответствует объявленному fitting", "resolvedShip.instances." + wanted.id);
      }
    } else {
      if (!options.allowSnapshotReplay)
        return invalid(
          "SNAPSHOT_REPLAY_REQUIRED",
          "Неизвестный каталог: разрешите только явное воспроизведение численного снимка; совместимость слотов не проверена",
        );
      validated.value.snapshotReplayOnly = true;
    }
    return validated;
  } catch {
    return invalid(
      "EXPERIMENT_JSON",
      "Не удалось прочитать numerical experiment JSON",
    );
  }
}
export function serializeExperiment(spec: StoredRunSpec|RunSpecV02): string {
  return JSON.stringify(spec, null, 2);
}
export function serializeResultSnapshot(result:import('../runner/run').RunResultV2|import('../runner/run').RunResultV3|import('../runner/ship-model-run-v02').RunResultV02):string{
  return JSON.stringify(result,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v,2);
}
