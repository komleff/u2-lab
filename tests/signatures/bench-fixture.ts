import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMissionRun } from "../../src/scenarios/mission";
import { signatureSpec, defaultSignatureSettings } from "../../src/signatures/config";

export function bench(size: "S" | "M" = "S", temperatureK = 510) {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  const fit = getPresetFit(size === "S" ? "pony:1" : "severin-mir:1", catalog.version);
  const put = (slot: string, itemId: string) => {
    const id = "fit:" + slot; fit.assignments[slot] = id;
    fit.instances[id] = { id, itemId, enabled: true };
  };
  put("signature-1", "h2-cooler-" + size);
  if (size === "S") put("power-3", "tank-hydrogen-S");
  else { put("power-1", "battery-M"); put("power-2", "generator-hydrogen-M"); put("power-3", "tank-hydrogen-M"); put("power-4", "tank-diesel-M"); }
  const made = makeMissionRun(fit, catalog, { temperatureK, durationSeconds: 30, stepSeconds: .1, distanceM: 0 });
  if (!made.ok) throw Error(JSON.stringify(made.errors));
  return signatureSpec(made.value, defaultSignatureSettings(size));
}

