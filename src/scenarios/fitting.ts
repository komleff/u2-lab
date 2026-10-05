import type { ValidationResult } from "../catalog/schema";
import type { ShipFit, CandidateCatalog } from "../fitting/types";
import { compileFit } from "../fitting/compile";
import type { RunSpecV2, FittingPhase } from "../model/v2/types";
import { validateRunSpecV2 } from "../model/v2/step";
export type MiningConditions = {
  durationSeconds?: number;
  stepSeconds?: number;
  workSeconds?: number;
  approachSeconds?: number;
  brakingSeconds?: number;
  serviceSeconds?: number;
  idleSeconds?: number;
  temperatureK?: number;
  effectiveBackgroundK?: number;
  targetM3?: number;
  repeat?: boolean;
  duty?: number;
  selectedWorkGroup?: string[];
  densityKgM3?: number;
  returnFraction?: number;
};
export function makeMiningRun(
  f: ShipFit,
  c: CandidateCatalog,
  x: MiningConditions = {},
): ValidationResult<RunSpecV2> {
  const r = compileFit(f, c);
  if (!r.ok) return r;
  const ship = r.value;
  const selected =
    x.selectedWorkGroup ??
    ship.instances.filter((i) => i.item.family === "mining").map((i) => i.id);
  const phases: FittingPhase[] = [
    {
      id: "approach",
      action: "approach",
      durationSeconds: x.approachSeconds ?? 10,
      requests: { march: 1 },
    },
    {
      id: "mining",
      action: "work",
      durationSeconds: x.workSeconds ?? 120,
      requests: Object.fromEntries(selected.map((id) => [id, x.duty ?? 1])),
    },
    {
      id: "braking",
      action: "braking",
      durationSeconds: x.brakingSeconds ?? 10,
      requests: { retro: 1 },
    },
    {
      id: "unload",
      action: "service",
      durationSeconds: x.serviceSeconds ?? 10,
      requests: {},
      service: { unload: true, refuel: false, charge: false },
    },
    {
      id: "recovery",
      action: "idle",
      durationSeconds: x.idleSeconds ?? 30,
      requests: {},
    },
  ];
  const s: RunSpecV2 = {
    schemaVersion: "u2-lab/2",
    modelVersion: "ship-fitting-ledger-0.2",
    catalogVersion: c.version,
    units: "SI",
    approvedBaseline: false,
    resolvedShip: ship,
    origins: ship.origins,
    environment: {
      effectiveBackgroundK: x.effectiveBackgroundK ?? 100,
      solarFluxWm2: 0,
      solarSourceId: "sun",
      backgroundSourceId: "lab-background",
      energyInputs: [],
      directHeat: [],
      law: "radiative",
      linearWK: 0,
    },
    initial: {
      chargeJ: ship.batteryCapacityJ * f.initial.chargeFraction,
      temperatureK: x.temperatureK ?? 300,
      fuelKg: {
        diesel:
          ship.resources.diesel.capacityKg *
          (f.initial.fuelFraction.diesel ?? 1),
        hydrogen:
          ship.resources.hydrogen.capacityKg *
          (f.initial.fuelFraction.hydrogen ?? 1),
      },
      buffersJ: Object.fromEntries(
        Object.keys(ship.bufferCapacityJ).map((id) => [id, 0]),
      ),
      cargoM3: {},
    },
    selectedWorkGroup: selected,
    process: {
      id: "LAB-ORE-01",
      energyJPerM3: 24e6,
      densityKgM3: x.densityKgM3 ?? 1500,
      extractFactor: 1,
      softFactor: 1,
      workFactor: 1,
      returnFraction: x.returnFraction ?? 0.35,
    },
    scenario: {
      name: "Добыча → торможение → разгрузка",
      repeat: x.repeat ?? true,
      targetM3: x.targetM3 ?? 1000,
      phases,
    },
    durationSeconds: x.durationSeconds ?? 600,
    stepSeconds: x.stepSeconds ?? 0.01,
  };
  const annotate = (v: unknown, path: string) => {
    if (typeof v === "number" && !s.origins[path])
      s.origins[path] = {
        kind: "experimental",
        sourceRef: "lab:conditions-LAB-ORE-01",
        note: "Явное SI условие опыта; GDD§6/7",
      };
    else if (v && typeof v === "object")
      for (const [k, value] of Object.entries(v))
        if (k !== "origins") annotate(value, path ? path + "." + k : k);
  };
  annotate(s, "");
  return validateRunSpecV2(s);
}
export function compareMiningConditions(
  a: RunSpecV2,
  b: RunSpecV2,
): { comparable: boolean; differences: string[] } {
  const normalized = (s: RunSpecV2) => ({
    hull: s.resolvedShip.hull.id,
    process: s.process,
    environment: s.environment,
    initial: s.initial,
    durationSeconds: s.durationSeconds,
    stepSeconds: s.stepSeconds,
    targetM3: s.scenario.targetM3,
    repeat: s.scenario.repeat,
    phases: s.scenario.phases.map((p) => ({
      ...p,
      requests: Object.fromEntries(
        Object.entries(p.requests).filter(
          ([key]) => !s.selectedWorkGroup.includes(key),
        ),
      ),
      miningDuties: [
        ...new Set(
          Object.entries(p.requests)
            .filter(([key]) => s.selectedWorkGroup.includes(key))
            .map(([, v]) => v),
        ),
      ].sort(),
    })),
  });
  const x = normalized(a),
    y = normalized(b);
  const differences: string[] = [];
  for (const k of Object.keys(x) as (keyof typeof x)[])
    if (JSON.stringify(x[k]) !== JSON.stringify(y[k])) differences.push(k);
  return { comparable: !differences.length, differences };
}
