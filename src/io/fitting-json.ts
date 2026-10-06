import { catalogHasItem, isKnownCatalogVersion } from "../fitting/editions";
import { validateRunSpec, type ValidationResult } from "../catalog/schema";
import { validateFit } from "../fitting/validate";
import { validateRunSpecV2 } from "../model/v2/step";
import type { ShipFit, CandidateCatalog } from "../fitting/types";
import type { AnyRunSpec } from "../model/v2/types";
const invalid = <T>(code: string, message: string): ValidationResult<T> => ({
  ok: false,
  errors: [{ path: "$", code, message }],
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
    if (spec?.schemaVersion !== "u2-lab/2")
      return invalid("SCHEMA", "Неподдерживаемая схема опыта");
    const validated = validateRunSpecV2(spec);
    if (!validated.ok) return validated;
    if (isKnownCatalogVersion(spec.catalogVersion)) {
      const fit = validated.value.resolvedShip.fit;
      if (fit.catalogVersion !== spec.catalogVersion ||
          Object.values(fit.instances).some(i => !fit.localVariants[i.itemId] && !catalogHasItem(spec.catalogVersion, i.itemId)) ||
          validated.value.resolvedShip.instances.some(i => !i.builtin && !fit.localVariants[i.item.id] && !catalogHasItem(spec.catalogVersion, i.item.id)))
        return invalid("CATALOG_INVENTORY", "Изделие или version stamp не принадлежит объявленному каталогу");
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
