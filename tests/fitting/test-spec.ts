import { compileFit } from "../../src/fitting/compile";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import type { RunSpecV2 } from "../../src/model/v2/types";
export function fixture(id = "industrial-M:3"): RunSpecV2 {
  const fit = getPresetFit(id),
    c = loadCandidateCatalog(),
    r = compileFit(fit, c);
  if (!r.ok) throw Error(JSON.stringify(r.errors));
  const s = r.value;
  return {
    schemaVersion: "u2-lab/2",
    modelVersion: "ship-fitting-ledger-0.2",
    catalogVersion: c.version,
    units: "SI",
    approvedBaseline: false,
    resolvedShip: s,
    origins: {},
    environment: {
      effectiveBackgroundK: 100,
      solarFluxWm2: 0,
      solarSourceId: "sun",
      backgroundSourceId: "space",
      energyInputs: [],
      directHeat: [],
      law: "radiative",
      linearWK: 0,
    },
    initial: {
      chargeJ: 0,
      temperatureK: 300,
      fuelKg: {
        diesel: s.resources.diesel.capacityKg,
        hydrogen: s.resources.hydrogen.capacityKg,
      },
      buffersJ: Object.fromEntries(
        Object.keys(s.bufferCapacityJ).map((k) => [k, 0]),
      ),
      cargoM3: {},
    },
    selectedWorkGroup: s.instances
      .filter((i) => i.item.family === "mining")
      .map((i) => i.id),
    process: {
      id: "LAB-ORE-01",
      energyJPerM3: 24e6,
      densityKgM3: 1500,
      extractFactor: 1,
      softFactor: 1,
      workFactor: 1,
      returnFraction: 0.35,
    },
    scenario: {
      name: "oracle",
      repeat: false,
      targetM3: 1000,
      phases: [
        {
          id: "work",
          action: "work",
          durationSeconds: 1,
          requests: Object.fromEntries(
            s.instances
              .filter((i) => i.item.family === "mining")
              .map((i) => [i.id, 1]),
          ),
        },
      ],
    },
    durationSeconds: 1,
    stepSeconds: 0.01,
  };
}
