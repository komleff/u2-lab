import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
export function worstRun(durationSeconds = 43200, stepSeconds = 0.01) {
  const c = loadCandidateCatalog(),
    f = getPresetFit("industrial-L:3");
  const install = (slot: string, itemId: string) => {
    const id = "fit:" + slot;
    f.assignments[slot] = id;
    f.instances[id] = { id, itemId, enabled: true };
  };
  for (const [slot, item] of [
    ["power-1", "battery-M"],
    ["power-2", "generator-diesel-M"],
    ["power-3", "tank-diesel-M"],
    ["power-4", "tank-hydrogen-M"],
    ["power-5", "generator-hydrogen-M"],
    ["power-6", "solar-S"],
    ["signature-1", "radiator-passive-M"],
    ["signature-2", "radiator-active-S"],
    ["signature-3", "buffer-S"],
    ["signature-4", "h2-cooler-S"],
    ["signature-5", "thermoinverter-S"],
  ])
    install(slot, item);
  const r = makeMiningRun(f, c, {
    durationSeconds,
    stepSeconds,
    workSeconds: 120,
    approachSeconds: 10,
    brakingSeconds: 10,
    serviceSeconds: 10,
    idleSeconds: 30,
    targetM3: 1e9,
  });
  if (!r.ok) throw Error(JSON.stringify(r.errors));
  return r.value;
}
