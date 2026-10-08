import { catalogHasItem, fitHull, isKnownCatalogVersion } from "../fitting/editions";
import { validateRunSpec, type ValidationResult } from "../catalog/schema";
import { validateFit, installedInstances } from "../fitting/validate";
import { loadCandidateCatalog } from "../fitting/catalog";
import { validateRunSpecV2 } from "../model/v2/step";
import type { ShipFit, CandidateCatalog, ModuleItem, Slot } from "../fitting/types";
import type { AnyRunSpec } from "../model/v2/types";
const invalid = <T>(code: string, message: string, path = "$"): ValidationResult<T> => ({
  ok: false,
  errors: [{ path, code, message }],
});
export function parseFitJson(
  text: string,
  catalog: CandidateCatalog,
): ValidationResult<ShipFit> {
  try {
    const fit = JSON.parse(text);
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
export function serializeFit(fit: ShipFit): string {
  return JSON.stringify(fit, null, 2);
}
export function parseExperimentJson(
  text: string,
  options: { allowSnapshotReplay?: boolean } = {},
): ValidationResult<AnyRunSpec> {
  try {
    const document = JSON.parse(text),
      spec = document?.spec ?? document;
    if (spec?.schemaVersion === "u2-lab/1") return validateRunSpec(spec);
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
export function serializeExperiment(spec: AnyRunSpec): string {
  return JSON.stringify(spec, null, 2);
}
