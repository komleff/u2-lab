// EM-закон v2: доля утечки по классам ступеней и перекалибровка порога EM-сенсора.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { stepPhysicsV2, type PhysicsShip, type PhysicsModule } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { moduleBase } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/catalog/presets";
import cat from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules.json";
import cat21 from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules-0.2.1.json";
import cat23 from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules-0.2.3.json";

const OUT = "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/";
const C: Record<string, any> = { ...(cat as any), ...(cat21 as any), ...(cat23 as any) };
const EM_OLD = 3.592038646e-8, KAPPA_OLD = 0.0000215;
// Кандидаты v2: высокий — приводы и импульсные драйверы, средний — генераторы и DC/DC, низкий — электроника корпуса
const K = { H: 1e-9, M: 3e-10, L: 1e-10 };
const sig = { observerPreset: "S-dedicated", rangeM: 16000, aspectDeg: 0, advancedIr: false, radar: false,
  geometry: { lengthM: 22, widthM: 16, heightM: 6 }, insulation: [], shielding: [], ram: [] } as any;
function mod(id: string, catId: string, extra: any = {}): PhysicsModule {
  const m = C[catId];
  const electric = m.family === "engine" && m.propulsionType === "electric";
  const kind = m.family === "mining" || electric ? "load" : m.family;
  const x = { ...moduleBase(id, kind), ...m.numerics, gate: { ...m.gate }, tankId: m.species, species: m.species,
    output: m.family === "mining" ? "mining" : electric ? "drive" : undefined,
    signature: { size: m.size === "M" ? "M" : "S", kind: m.propulsionType ?? (m.species === "hydrogen" ? "hydrogen" : "diesel"), motorEfficiency: m.numerics.efficiency ?? 1, profile: "aft" }, ...extra } as any;
  if (electric) x.efficiency = m.numerics.pathEfficiency * m.numerics.efficiency;
  if (m.family === "mining") x.workPerJ = 1 / 24e6;
  return x;
}
function stand(size: "S" | "M", modules: PhysicsModule[]): PhysicsShip {
  const k = size === "M" ? 4 : 1;
  return { label: "stand", size, heatCapacityJK: 35000 * 470 * k, dryMassKg: 35000 * k, thermalMaterials: [],
    hullPowerW: 50000 * k, hullRadiationM2: 300 * k, dischargeEfficiency: 0.9, chargeEfficiency: 1,
    accumulators: [{ id: "common", capacityJ: C["battery-" + size].numerics.capacityJ }],
    tanks: [{ id: "diesel", species: "diesel", capacityKg: 6000 * k, energyJKg: 43e6, gate: C["tank-diesel-S"].gate },
      { id: "hydrogen", species: "hydrogen", capacityKg: size === "M" ? 3647.570429 : 633.45758, energyJKg: 120e6, gate: C["tank-hydrogen-S"].gate }],
    modules: [mod("rad", "radiator-passive-" + size), ...modules], cargoCapacity: 1e9, cargoLimitM3: 1e9, targetLimitM3: 1e9, returnFraction: 0.35, signatures: sig } as PhysicsShip;
}
const env = { effectiveBackgroundK: 100, solarFluxWm2: 1361, solarSourceId: "sun", backgroundSourceId: "bg", energyInputs: [], directHeat: [], law: "radiative", linearWK: 0 } as any;
function stages(size: "S" | "M", mods: PhysicsModule[], req: any[], soc: number) {
  const out = stepPhysicsV2(stand(size, mods), { timeSeconds: 0, chargeJ: C["battery-" + size].numerics.capacityJ * soc, temperatureK: 300,
    fuelKg: { diesel: 24000, hydrogen: 3647 }, buffersJ: {}, gates: {}, cargo: 0, usefulWork: 0, phaseKey: "", constraints: [], miningStopSeconds: null } as any, env, req, 0.1);
  const f = out.signatureFrames!.at(-1)!;
  // Новая ступень выхода солнечной панели — по правилу «любой источник — одна ступень»
  const solar = out.telemetry.solarW ?? 0;
  let oldW = 0, newW = 0;
  for (const s of f.stages) {
    oldW += s.actualW * KAPPA_OLD;
    const cls = s.kind === "consumer_input" ? "H" : s.kind === "protected_processing" ? "L" : "M";
    newW += s.actualW * K[cls];
  }
  newW += solar * K.M;
  return { oldW, newW, emOld: f.em.observedEmW };
}
test("EM v2 против нынешней κ", () => {
  const anchor = stages("S", [mod("l", "mining-civil-S"), mod("g", "generator-diesel-S")], [{ moduleId: "l", duty: 1 }], 0.85);
  const EM_NEW = EM_OLD * anchor.newW / anchor.oldW;
  const km = (w: number, phi: number) => Math.sqrt(w / (4 * Math.PI * phi)) / 1000;
  const cases: [string, "S" | "M", PhysicsModule[], any[], number][] = [
    ["Только корпус", "S", [], [], 1],
    ["Дизель-генератор S заряжает", "S", [mod("g", "generator-diesel-S")], [], 0.85],
    ["H₂-генератор S заряжает", "S", [mod("g", "generator-hydrogen-S")], [], 0.85],
    ["Солнечная панель S заряжает", "S", [mod("s", "solar-S")], [], 0.5],
    ["Лазер civil S от аккумулятора", "S", [mod("l", "mining-civil-S")], [{ moduleId: "l", duty: 1 }], 1],
    ["Лазер civil S + дизель-генератор (эталон)", "S", [mod("l", "mining-civil-S"), mod("g", "generator-diesel-S")], [{ moduleId: "l", duty: 1 }], 0.85],
    ["Электродвигатель S, полная тяга", "S", [mod("d", "engine-electric-S-single")], [{ moduleId: "d", duty: 1 }], 1],
    ["Электродвигатель S, 30%", "S", [mod("d", "engine-electric-S-single")], [{ moduleId: "d", duty: 0.3 }], 1],
    ["Активный радиатор S (насос)", "S", [mod("a", "radiator-active-S")], [], 1],
    ["Дизельный двигатель S", "S", [mod("e", "engine-diesel-S-single")], [{ moduleId: "e", duty: 1 }], 1],
    ["Лазер industrial M + дизель-генератор M", "M", [mod("l", "mining-industrial-M"), mod("g", "generator-diesel-M")], [{ moduleId: "l", duty: 1 }], 0.85],
    ["Электродвигатель M, полная тяга", "M", [mod("d", "engine-electric-M-single")], [{ moduleId: "d", duty: 1 }], 1],
  ];
  const rows = cases.map(([name, size, mods, req, soc]) => {
    const s = stages(size, mods, req, soc);
    return { name, oldW: s.oldW, newW: s.newW, oldKm: km(s.oldW, EM_OLD), newKm: km(s.newW, EM_NEW) };
  });
  writeFileSync(OUT + "emv2.json", JSON.stringify({ K, EM_NEW, holdNew: EM_NEW * 0.6, anchorOld: anchor.oldW, anchorNew: anchor.newW, rows }, null, 1));
});
