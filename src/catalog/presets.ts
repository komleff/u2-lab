import intake from "../../docs/experiments/parameter-intake.json" with { type: "json" };
import type { Module, RunSpec, Gate, Origin } from "../model/types";
const gate: Gate = {
  low: 150,
  workLow: 200,
  high: 570,
  restartLow: 180,
  restartHigh: 550,
  workHigh: 510,
};
export function moduleBase(id: string, kind: Module["kind"]): Module {
  return {
    id,
    kind,
    enabled: true,
    policy: "Active",
    gate: { ...gate },
    powerW: 0,
    efficiency: 1,
    exportFraction: 0,
    pathEfficiency: 1,
    forceN: 0,
    alpha: 0,
    hostFraction: 1,
    areaM2: 0,
    capacityJ: 0,
    coolingW: 0,
    auxW: 0,
    qJKg: 1e7,
    hotK: 800,
    copEfficiency: 0.5,
    workPerJ: 0,
    absorbAboveK: 290,
    releaseBelowK: 280,
  };
}
export const presets: RunSpec[] = intake.configurations.map((c) => {
  const g = {
    ...moduleBase("generator", "generator"),
    tankId: "diesel",
    species: "diesel" as const,
    powerW: c.generator.rated_electrical_w,
    efficiency: c.generator.eta_gen,
    exportFraction: c.generator.self_export_fraction,
    pathEfficiency: c.generator.eta_useful_path,
  };
  const engine = {
    ...moduleBase("engine", "engine"),
    tankId: "diesel",
    species: "diesel" as const,
    forceN: c.propulsion.march_force_n,
    alpha: c.propulsion.alpha_kg_per_n_s,
    efficiency: c.propulsion.useful_fraction,
    hostFraction: c.propulsion.host_fraction_of_waste,
    gate: {
      low: 150,
      workLow: 200,
      high: 700,
      restartLow: 180,
      restartHigh: 680,
      workHigh: 570,
    },
  };
  const laser = {
    ...moduleBase("laser", "load"),
    powerW: c.mining_laser.request_bus_w,
    efficiency: c.mining_laser.beam_efficiency,
    workPerJ: 1 / 1e8,
  };
  const radiator = {
    ...moduleBase("passive", "radiator"),
    areaM2: c.radiator_passive.K_rad_m2,
  };
  const p: RunSpec = {
    schemaVersion: "u2-lab/1",
    units: "SI",
    modelVersion: "radiative-host-ledger-0.1",
    catalogVersion: "intake-0.1",
    approvedBaseline: false,
    origins: {},
    ship: {
      label: c.label,
      size: c.identity.size as "S" | "M",
      heatCapacityJK: c.thermal.C_ship_j_per_k,
      dryMassKg: c.mass_ledger.dry_total_kg,
      thermalMaterials: [
        {
          id: "intake-dry-assembly",
          massKg: c.mass_ledger.dry_total_kg,
          cpJKgK: c.thermal.C_ship_j_per_k / c.mass_ledger.dry_total_kg,
          contents: "dry",
        },
      ],
      hullPowerW: c.hull.background_w,
      hullRadiationM2: c.hull.K_rad_m2,
      dischargeEfficiency: 0.9,
      chargeEfficiency: 1,
      accumulators: [
        { id: "accumulator", capacityJ: c.accumulator.stored_capacity_j },
      ],
      tanks: [
        {
          id: "diesel",
          species: "diesel",
          capacityKg: c.tank.fuel_capacity_kg,
          energyJKg: 43e6,
          gate: {
            low: 150,
            workLow: 200,
            high: 570,
            restartLow: 180,
            restartHigh: 550,
            workHigh: 500,
          },
        },
      ],
      modules: [g, engine, laser, radiator],
      cargoCapacity: c.cargo_hold_universal.capacity_scu,
    },
    environment: {
      effectiveBackgroundK: 100,
      solarFluxWm2: 0,
      solarSourceId: "sun",
      backgroundSourceId: "deep-space",
      energyInputs: [],
      directHeat: [],
      law: "radiative",
      linearWK: 0,
    },
    initial: {
      chargeJ: c.accumulator.stored_capacity_j,
      temperatureK: 300,
      fuelKg: { diesel: c.tank.initial_fuel_kg },
      buffersJ: {},
    },
    scenario: {
      name: "Добыча → возвращение → разгрузка",
      repeat: true,
      targetWork: 12,
      phases: [
        { id: "approach", durationSeconds: 10, action: "approach", duty: 1 },
        { id: "mining", durationSeconds: 800, action: "work", duty: 1 },
        { id: "return", durationSeconds: 10, action: "return", duty: 0.4 },
        {
          id: "unload",
          durationSeconds: 10,
          action: "service",
          duty: 0,
          service: { refuel: false, unload: true, charge: false },
        },
        { id: "recovery", durationSeconds: 970, action: "recovery", duty: 0 },
      ],
    },
    durationSeconds: 600,
    stepSeconds: 0.1,
  };
  const annotate = (v: unknown, path: string) => {
    if (typeof v === "number") {
      let kind: Origin["kind"] = "experimental",
        sourceRef = "intake:X6";
      if (path.includes("capacityJ")) {
        kind = "derived";
        sourceRef = "s10 §4; stored e_acc × dry mass";
      }
      if (
        path.includes("cargoCapacity") ||
        path.includes("forceN") ||
        path.includes("hullPowerW")
      ) {
        kind = "canonical";
        sourceRef = "s8 §8; s29 cargo";
      }
      if (path.includes("heatCapacity")) sourceRef = "intake:X3";
      if (path.includes("alpha") || path.includes("hostFraction"))
        sourceRef = "intake:X2";
      if (path.includes("efficiency") || path.includes("pathEfficiency"))
        sourceRef = "intake:X1/X7";
      p.origins[path] = {
        kind,
        sourceRef,
        note: "Экспериментальная конфигурация; не утверждённый SKU",
      };
    } else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v))
        annotate(x, path ? `${path}.${k}` : k);
  };
  annotate(p.ship, "ship");
  annotate(p.initial, "initial");
  annotate(p.environment, "environment");
  annotate(p.scenario, "scenario");
  annotate(p.stepSeconds, "stepSeconds");
  annotate(p.durationSeconds, "durationSeconds");
  const put = (
    path: string,
    kind: Origin["kind"],
    sourceRef: string,
    derivation?: string,
  ) =>
    (p.origins[path] = {
      kind,
      sourceRef,
      derivation,
      note: "Источник закреплён в parameter-intake.json; полный preset экспериментальный",
    });
  put("ship.thermalMaterials.0.massKg", "derived", "intake:mass_ledger");
  put(
    "ship.thermalMaterials.0.cpJKgK",
    "experimental",
    "intake:X3",
    "Frozen C_ship / dry assembly mass; effective experimental cp, not complete canonical material closure",
  );
  put(
    "ship.dryMassKg",
    "derived",
    "intake:mass_ledger",
    "Сумма выбранных сухих масс, без cargo/fuel",
  );
  put("ship.hullRadiationM2", "experimental", "intake:X3");
  put("ship.chargeEfficiency", "experimental", "intake:X7");
  put("ship.dischargeEfficiency", "experimental", "intake:X7");
  put("ship.tanks.0.capacityKg", "canonical", "s29 tank_diesel");
  put("ship.tanks.0.energyJKg", "canonical", "s5 §3 diesel LHV");
  put("ship.modules.0.powerW", "canonical", "s10 §2–§3; s11 §2");
  put("ship.modules.0.efficiency", "experimental", "intake:X1");
  put("ship.modules.0.pathEfficiency", "experimental", "intake:X1");
  put(
    "ship.modules.0.exportFraction",
    "canonical",
    "s11 generator self-export",
  );
  put("ship.modules.1.forceN", "canonical", "s8 §8.1–§8.2");
  put(
    "ship.modules.1.alpha",
    "experimental",
    "intake:X2; s5 §3.2",
    "0.565 kg/(MN s) / 1e6",
  );
  put(
    "ship.modules.2.powerW",
    c.identity.size === "S" ? "canonical" : "experimental",
    c.identity.size === "S" ? "s34 §2 CivilS/G1" : "intake:X5",
  );
  put("ship.modules.2.efficiency", "canonical", "s34 §4 eta_laser=.5001");
  put(
    "ship.modules.2.workPerJ",
    "experimental",
    "lab:work-conversion-1",
    "Условная добыча1 SCU/100MJ beam; не промышленный U2 throughput",
  );
  put(
    "ship.modules.3.areaM2",
    c.identity.size === "S" ? "derived" : "experimental",
    c.identity.size === "S" ? "s14 §3 passive" : "intake:X5",
    "emissivity × area",
  );
  for (let i = 0; i < p.ship.modules.length; i++)
    for (const k of Object.keys(p.ship.modules[i].gate))
      put(`ship.modules.${i}.gate.${k}`, "experimental", "intake:X4");
  return p;
});
export function markEdits(p: RunSpec) {
  const walk = (v: any, path: string) => {
    if (typeof v === "number")
      p.origins[path] = {
        kind: "experimental",
        sourceRef: "user:editable-experiment",
        note: "Изменённый параметр опыта",
      };
    else if (v && typeof v === "object")
      for (const [k, x] of Object.entries(v))
        walk(x, path ? `${path}.${k}` : k);
  };
  walk(p.ship, "ship");
  walk(p.initial, "initial");
  walk(p.environment, "environment");
  walk(p.scenario, "scenario");
  walk(p.stepSeconds, "stepSeconds");
  walk(p.durationSeconds, "durationSeconds");
}
