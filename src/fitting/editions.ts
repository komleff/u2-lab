import baseItems from "./data/modules.json" with { type: "json" };
import additions from "./data/modules-0.2.1.json" with { type: "json" };
import medium from "./data/modules-0.2.3.json" with { type: "json" };
import baseHulls from "./data/hulls.json" with { type: "json" };
import type { CandidateCatalog, ModuleItem, ShipFit, HullProfile } from "./types";
export function isKnownCatalogVersion(version: unknown): version is CandidateCatalog["version"] {
  return version === "ship-fitting-0.2.0" || version === "ship-fitting-0.2.1" || version === "ship-fitting-0.2.2" || version === "ship-fitting-0.2.3";
}
export function catalogHasItem(version: string, id: string) {
  return isKnownCatalogVersion(version) &&
    (Object.hasOwn(baseItems, id) || (version !== "ship-fitting-0.2.0" && Object.hasOwn(additions, id)) || (version === "ship-fitting-0.2.3" && Object.hasOwn(medium,id)));
}
export function hullsForEdition(version: CandidateCatalog["version"]): HullProfile[] {
  return structuredClone(baseHulls).map(h => ["ship-fitting-0.2.2","ship-fitting-0.2.3"].includes(version) && h.id === "pony" ? {
    ...h,
    slots: h.slots.filter(s => s.id !== "signature-2"),
    origins: { ...h.origins, "slots.signatureCount": {
      kind: "experimental", unit: "slot", sourceRef: "lab:operator-2026-10-06-pony-signature-slot",
      derivation: "2 − 1 = 1 removable signature slot",
      note: "Принятое ограничение Лабы; остальные поля и встроенные изделия сохранены. Не внешний канон U2.",
    } },
  } : version === "ship-fitting-0.2.3" && h.architecture === "E" ? {...h, slots:h.slots.map(s=>s.category === "power" ? {...s,families:["battery","solar","generator","tank"]}:s),origins:{...h.origins,"slots.power.families":{kind:"experimental",unit:"family",sourceRef:"lab:ship-fitting-medium-modules-v1.0:HY01",note:"E utility fuel circuits; propulsion stays all Electric"}}} : h) as unknown as HullProfile[];
}
export function fitHull(fit: ShipFit, catalog: CandidateCatalog): HullProfile | undefined {
  if (!isKnownCatalogVersion(fit.catalogVersion)) return undefined;
  // Совпадающий каталог сохраняет явные локальные поправки вызывающего кода; прежняя
  // редакция получает собственный профиль вместо скрытого переоснащения текущим каталогом.
  return (fit.catalogVersion === catalog.version ? catalog.hulls : hullsForEdition(fit.catalogVersion))
    .find(h => h.id === fit.hullId);
}
export function fitItem(fit: ShipFit, catalog: CandidateCatalog, id: string): ModuleItem | undefined {
  // Локальный снимок принадлежит fit; новый global SKU не может выдать себя за старый каталог.
  return fit.localVariants[id] ?? (catalogHasItem(fit.catalogVersion, id) ? catalog.items[id] : undefined);
}
