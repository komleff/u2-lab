import baseItems from "./data/modules.json" with { type: "json" };
import additions from "./data/modules-0.2.1.json" with { type: "json" };
import medium from "./data/modules-0.2.3.json" with { type: "json" };
import baseHulls from "./data/hulls.json" with { type: "json" };
import type { CandidateCatalog, ModuleItem, ShipFit, HullProfile } from "./types";
export function isKnownCatalogVersion(version: unknown): version is CandidateCatalog["version"] {
  return version === "ship-fitting-0.2.0" || version === "ship-fitting-0.2.1" || version === "ship-fitting-0.2.2" || version === "ship-fitting-0.2.3" || version === "ship-fitting-0.2.4" || version === "ship-fitting-0.2.5";
}
export function catalogHasItem(version: string, id: string) {
  return isKnownCatalogVersion(version) &&
    (Object.hasOwn(baseItems, id) || (version !== "ship-fitting-0.2.0" && Object.hasOwn(additions, id)) || (["ship-fitting-0.2.3","ship-fitting-0.2.4","ship-fitting-0.2.5"].includes(version) && Object.hasOwn(medium,id)));
}
export function hullsForEdition(version: CandidateCatalog["version"]): HullProfile[] {
  if (version === "ship-fitting-0.2.5") {
    return hullsForEdition("ship-fitting-0.2.4").map(h => {
      if (!["civilian-M", "severin-mir"].includes(h.id)) return h;
      const hull = structuredClone(h);
      hull.architecture = h.id === "civilian-M" ? "H" : "U";
      hull.builtins = hull.builtins.filter(b => b.item.family !== "battery");
      hull.origins.profile = {kind:"experimental",unit:"profile",sourceRef:"lab:operator-2026-10-07-catalog-0.2.5",note:h.id === "civilian-M" ? "Волна H: встроенный криобак, сменный аккумулятор." : "Мир U: сменное питание и однородные движители D/H/E; не полный канонический профиль."};
      if (h.id === "civilian-M") {
        const tank = structuredClone(baseItems["tank-hydrogen-M"]) as unknown as ModuleItem;
        tank.id = "builtin-cryotank-civilian-M";
        tank.label = "Встроенный криобак Волны M";
        tank.numerics.fuelCapacityKg = 4377.0845148;
        tank.origins["numerics.fuelCapacityKg"] = {kind:"experimental",unit:"kg",sourceRef:"lab:operator-2026-10-07-volna-builtin-cryotank",derivation:"3647.570429 × 1.20 = 4377.0845148 kg",note:"Явная гипотеза +20% только для встроенного бака Волны; dry bill/C/gates обычного M сохранены, не общий canonical множитель."};
        hull.builtins.push({id:"builtin:cryotank",item:tank});
      }
      return hull;
    });
  }
  const inherited = structuredClone(baseHulls).map(h => ["ship-fitting-0.2.2","ship-fitting-0.2.3","ship-fitting-0.2.4"].includes(version) && h.id === "pony" ? {
    ...h,
    slots: h.slots.filter(s => s.id !== "signature-2"),
    origins: { ...h.origins, "slots.signatureCount": {
      kind: "experimental", unit: "slot", sourceRef: "lab:operator-2026-10-06-pony-signature-slot",
      derivation: "2 − 1 = 1 removable signature slot",
      note: "Принятое ограничение Лабы; остальные поля и встроенные изделия сохранены. Не внешний канон U2.",
    } },
  } : ["ship-fitting-0.2.3","ship-fitting-0.2.4","ship-fitting-0.2.5"].includes(version) && h.architecture === "E" ? {...h, slots:h.slots.map(s=>s.category === "power" ? {...s,families:["battery","solar","generator","tank"]}:s),origins:{...h.origins,"slots.power.families":{kind:"experimental",unit:"family",sourceRef:"lab:ship-fitting-medium-modules-v1.0:HY01",note:"E utility fuel circuits; propulsion stays all Electric"}}} : h) as unknown as HullProfile[];
  if (version !== "ship-fitting-0.2.4") return inherited;
  const names: Record<string,string> = {sputnik:"Северин Спутник","industrial-S":"Демирмаш Ермак","industrial-M":"Демирмаш Титан","industrial-L":"Демирмаш Караван","civilian-M":"Северин Волна M"};
  const references: Record<string,number> = {sputnik:250,pony:225,"industrial-S":225,"industrial-M":200,"industrial-L":175,"civilian-M":225};
  const hulls: HullProfile[] = inherited.map(h=>({...h,label:names[h.id]??h.label,referenceVfaMS:references[h.id],origins:{...h.origins,referenceVfaMS:{kind:"experimental" as const,unit:"m/s",sourceRef:"lab:operator-2026-10-07-catalog-0.2.4-speed-correction",note:"Таблица оператора S/M/L/XL: Civil250/225/200/175; Industrial225/200/175/150. Пони наследует Industrial S; не канонический физический закон U2."}}}));
  const mir=structuredClone(hulls.find(h=>h.id==="civilian-M")!);
  mir.id="severin-mir";mir.label="Северин Мир";
  mir.origins.profile={kind:"experimental",unit:"profile",sourceRef:"lab:operator-2026-10-07-severin-mir-prototype",note:"Явный производный прототип Civilian M E: монтаж и численные поля Волны M; не канонические ТТХ Мира."};
  return [...hulls,mir];
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
