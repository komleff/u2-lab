import { getPresetFit } from "../../src/fitting/catalog";
import type { CandidateCatalog, ShipFit } from "../../src/fitting/types";

export function electricFit(catalog: CandidateCatalog): ShipFit {
  const fit = getPresetFit("sputnik:1");
  for (const role of ["march", "retro", "strafe", "turn"]) {
    const base =
      catalog.items[
        `engine-electric-S-${["strafe", "turn"].includes(role) ? "pair" : "single"}`
      ];
    const item = structuredClone(base);
    item.id = "local:electric:" + role;
    fit.localVariants[item.id] = item;
    fit.instances[fit.assignments[role]].itemId = item.id;
  }
  return fit;
}

export function thermoinverterFit(catalog: CandidateCatalog): ShipFit {
  const fit = getPresetFit("sputnik:1"),
    item = structuredClone(catalog.items["thermoinverter-S"]);
  item.id = "local:thermoinverter";
  fit.localVariants[item.id] = item;
  fit.instances[fit.assignments["signature-1"]].itemId = item.id;
  return fit;
}
