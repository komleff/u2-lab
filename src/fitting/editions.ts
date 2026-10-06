import baseItems from "./data/modules.json" with { type: "json" };
import additions from "./data/modules-0.2.1.json" with { type: "json" };
import type { CandidateCatalog, ModuleItem, ShipFit } from "./types";
export function isKnownCatalogVersion(version: unknown): version is CandidateCatalog["version"] {
  return version === "ship-fitting-0.2.0" || version === "ship-fitting-0.2.1";
}
export function catalogHasItem(version: string, id: string) {
  return isKnownCatalogVersion(version) &&
    (Object.hasOwn(baseItems, id) || (version === "ship-fitting-0.2.1" && Object.hasOwn(additions, id)));
}
export function fitItem(fit: ShipFit, catalog: CandidateCatalog, id: string): ModuleItem | undefined {
  // Локальный снимок принадлежит fit; новый global SKU не может выдать себя за старый каталог.
  return fit.localVariants[id] ?? (catalogHasItem(fit.catalogVersion, id) ? catalog.items[id] : undefined);
}
