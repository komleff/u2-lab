// Помощники правки корпуса для опытов: встроенный задненаправленный радиатор, пассивная площадь
import type { CandidateCatalogV3, ShipFitV3, HullV3, ModuleItemV3 } from "../../../../src/model/v3/types";

export type Change = (c: CandidateCatalogV3, f: ShipFitV3, h: HullV3) => void;
export const builtinAftRadiator = (scale = 1): Change => (c, _f, h) => {
  const item = structuredClone(c.items["radiator-active-S"]) as ModuleItemV3;
  item.id = "builtin-radiator-active-aft-S";
  item.label = "Встроенный активный радиатор, задненаправленный";
  for (const s of item.surfaces) { s.irProfile = { version: "radiator-ir/1", kind: "aft-directed", aftFraction: 1 }; s.areaM2 *= scale; s.builtin = true; }
  item.numerics.auxW *= scale;
  const index = h.builtins.length;
  h.builtins.push({ id: "builtin:radiator-aft", item });
  for (const [path, value] of Object.entries(item.origins)) h.origins["builtins." + index + ".item." + path] = structuredClone(value);
};
export const passiveArea = (a: number): Change => (_c, _f, h) => { h.bodyExchangeAreaM2 = a; };
export const compose = (...xs: Change[]): Change => (c, f, h) => xs.forEach((x) => x(c, f, h));
