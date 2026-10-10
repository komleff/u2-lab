import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import type { FieldOrigin } from "../../src/fitting/types";
import type { RunSpecV3, StateV3 } from "../../src/model/v3/types";
export function fixture(id = "sputnik"): RunSpecV3 {
  const catalog = loadCandidateCatalog("ship-fitting-0.3.0"), fit = getPresetFit(id, catalog.version);
  const compiled = compileFit(fit, catalog);
  if (!compiled.ok) throw Error(JSON.stringify(compiled.errors));
  const ship = compiled.value;
  const state: StateV3 = {
    schemaVersion: "u2-lab/4", modelVersion: "ship-fitting-ship-model-0.1", stateVersion: "ship-state/1",
    timeSeconds: 0, phaseIndex: 0, phaseElapsedSeconds: 0, mode: "Efficient", maskingEntryTemperatureK: null,
    temperatureK: 300, chargeJ: ship.batteryCapacityJ, fuelKg: { diesel: 0, hydrogen: 0 },
    buffers: Object.fromEntries(Object.keys(ship.bufferCapacityJ).map(id => [id, { storedJ: 0, minimumCaptureK: null }])),
    governor: { coolingStageId: null, heatingStageId: null, recoveringBuffer: false }, generator: { permission: false, normalOn: false },
    modules: Object.fromEntries(ship.instances.map(i => [i.id, { durabilityR: 1, firstNegativeCrossing: false, emergencyExposureSeconds: 0, cooldownSeconds: 0, restartAuthorized: false, thermalStopped: false }])),
    surfaceOpen: Object.fromEntries(ship.surfaces.map(s => [s.id, true])), rng: { algorithm: "xorshift32/1", seed: 424242, state: 424242 },
  };
  const spec: RunSpecV3 = {
    schemaVersion: "u2-lab/4", modelVersion: "ship-fitting-ship-model-0.1", catalogVersion: catalog.version, units: "SI", approvedBaseline: false,
    resolvedShip: ship, origins: {}, environment: { radiativeBackgroundK: 250, backgroundSourceId: "background", thermalField: null, solarFluxWm2: 0, solarSourceId: null, energyInputs: [], directHeat: [] },
    initialState: state, receiverProfile: "positive-only", observer: { presetId: "S-dedicated-G1", rangeM: 16000, aspectDeg: 0 },
    scenario: { name: "T1 schema fixture", repeat: false, phases: [{ id: "work", action: "work", durationSeconds: 60, requests: { "fit:payload-1": 1 }, environment: null }] }, durationSeconds: 60, stepSeconds: 1,
  };
  const walk = (value: unknown, path: string) => { if (typeof value === "number") spec.origins[path] = { kind: "experimental", unit: "SI", sourceRef: "tests/model-v3/fixture.ts", note: "Численное условие теста, не канонические ТТХ." } satisfies FieldOrigin; else if (value && typeof value === "object") for (const [k,v] of Object.entries(value)) if (!["origins","origin","resolvedShip"].includes(k)) walk(v, path ? path+"."+k : k); };
  walk(spec, ""); return spec;
}
