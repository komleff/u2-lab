// Проверочные опыты ГД-ревью: энергия, тепло, EM по типам модулей. Только чтение движка.
import { test } from "vitest";
import { stepPhysicsV2, type PhysicsShip, type PhysicsModule } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { moduleBase } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/catalog/presets";
import cat from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules.json";

const C = cat as Record<string, any>;
const gate = { low: 200, workLow: 250, restartLow: 260, workHigh: 500, restartHigh: 480, high: 550 };
const sig = {
  observerPreset: "S-dedicated", rangeM: 16000, aspectDeg: 0, advancedIr: false, radar: false,
  geometry: { lengthM: 22, widthM: 16, heightM: 6 }, insulation: [], shielding: [], ram: [],
} as any;

function mod(id: string, catId: string, kind: PhysicsModule["kind"], extra: Partial<PhysicsModule> = {}): PhysicsModule {
  const m = C[catId];
  return { ...moduleBase(id, kind), ...m.numerics, gate: { ...m.gate }, tankId: m.species, species: m.species, ...extra } as PhysicsModule;
}
function ship(modules: PhysicsModule[], opts: Partial<PhysicsShip> = {}): PhysicsShip {
  return {
    label: "probe", size: "S", heatCapacityJK: 35000 * 470, dryMassKg: 35000, thermalMaterials: [],
    hullPowerW: 50000, hullRadiationM2: 300, dischargeEfficiency: 0.9, chargeEfficiency: 1,
    accumulators: [{ id: "common", capacityJ: C["battery-S"].numerics.capacityJ }],
    tanks: [
      { id: "diesel", species: "diesel", capacityKg: 6000, energyJKg: 43e6, gate: C["tank-diesel-S"].gate },
      { id: "hydrogen", species: "hydrogen", capacityKg: 633.45758, energyJKg: 120e6, gate: C["tank-hydrogen-S"].gate },
    ],
    modules, cargoCapacity: 1e9, cargoLimitM3: 1e9, targetLimitM3: 1e9, returnFraction: 0.35, ...opts,
  } as PhysicsShip;
}
const env = { effectiveBackgroundK: 100, solarFluxWm2: 0, solarSourceId: "sun", backgroundSourceId: "bg", energyInputs: [], directHeat: [], law: "radiative", linearWK: 0 } as any;
function state(T: number, chargeFrac = 1, extra: any = {}) {
  return { timeSeconds: 0, chargeJ: C["battery-S"].numerics.capacityJ * chargeFrac, temperatureK: T, fuelKg: { diesel: 6000, hydrogen: 633.45758 }, buffersJ: {}, gates: {}, cargo: 0, usefulWork: 0, phaseKey: "", constraints: [], miningStopSeconds: null, ...extra } as any;
}
const r = (x: number) => Number(x.toPrecision(5));
const pick = (t: Record<string, number>, keys: string[]) => Object.fromEntries(keys.map(k => [k, r(t[k] ?? 0)]));

test("P1 термоинвертор S без потребности в охлаждении", () => {
  for (const T of [260, 300, 400]) {
    const s = ship([mod("ti", "thermoinverter-S", "thermoinverter")]);
    const out = stepPhysicsV2(s, state(T), env, [], 1);
    console.log("P1 T=" + T, pick(out.telemetry, ["coolingAuxW:ti", "coolingW:ti", "tiRejectW", "deliveredW", "radiationOutW"]), "dT/1s", r(out.state.temperatureK - T));
  }
});

test("P2 заблокированный электродвигатель с запросом тяги", () => {
  const drive = mod("drv", "engine-electric-S-single", "load", { output: "drive" });
  drive.efficiency = 0.95 * 0.9;
  const dsl = mod("dsl", "engine-diesel-S-single", "engine");
  for (const [name, m] of [["electric", drive], ["diesel", dsl]] as const) {
    const s = ship([m]);
    const out = stepPhysicsV2(s, state(549, 1, { gates: { [m.id]: true } }), env, [{ moduleId: m.id, duty: 1 }], 0.01);
    console.log("P2", name, "gated, request=1 → propulsionShortfall =", out.mining.propulsionShortfall, "thrustN", r(out.telemetry.thrustN ?? 0));
  }
});

test("P3 активный радиатор S в зоне теплового снижения", () => {
  for (const T of [450, 525]) {
    const s = ship([mod("ar", "radiator-active-S", "radiator")], { hullRadiationM2: 0.0001 });
    const out = stepPhysicsV2(s, state(T), env, [], 0.001);
    console.log("P3 T=" + T, pick(out.telemetry, ["coolingAuxW:ar", "radiationOutW"]), "эффективная площадь м²", r(out.telemetry.radiationOutW / (5.670374419e-8 * T ** 4)));
  }
});

test("P4 полный трюм: метка ограничения", () => {
  const laser = mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 });
  const s = ship([laser], { cargoLimitM3: 10 });
  const out = stepPhysicsV2(s, state(300, 1, { cargo: 10 }), env, [{ moduleId: "las", duty: 1 }], 1);
  console.log("P4 cargo full", pick(out.telemetry, ["requestedW", "deliveredW", "soc"]), "constraints:", out.state.constraints);
});

test("P5 солнечная панель при полном аккумуляторе", () => {
  const s = ship([mod("sol", "solar-S", "solar")], { hullPowerW: 10000 });
  const sunny = { ...env, solarFluxWm2: 1361 };
  const out = stepPhysicsV2(s, state(300, 1), sunny, [], 1);
  console.log("P5 full battery", pick(out.telemetry, ["solarW", "solarHostW", "deliveredW", "energyResidualJ"]), "поглощено", 100 * 1361);
  const out2 = stepPhysicsV2(s, state(300, 0.5), sunny, [], 1);
  console.log("P5 half battery", pick(out2.telemetry, ["solarW", "solarHostW", "deliveredW"]), "ΔQ J", r(out2.state.chargeJ - C["battery-S"].numerics.capacityJ * 0.5));
});

test("P6 H₂-охладитель: legacy против режима сигнатур при 500 K", () => {
  for (const sigOn of [false, true]) {
    const h2 = mod("h2", "h2-cooler-S", "h2", sigOn ? { signature: { size: "S", kind: "hydrogen", motorEfficiency: 1, profile: "isotropic" } } as any : {});
    const gen = mod("gen", "generator-diesel-S", "generator");
    const s = ship([h2, gen], { hullRadiationM2: 1, ...(sigOn ? { signatures: sig } : {}) });
    const hot = { ...env, directHeat: [{ sourceId: "load", powerW: 40e6 }] };
    const out = stepPhysicsV2(s, state(500.5), hot, [], 0.01);
    console.log("P6 signatures=" + sigOn, pick(out.telemetry, ["h2CoolingW", "h2AuxRejectW", "coolingAuxW:h2"]), "H2 kg/s", r(out.coolantConsumedKg / 0.01));
  }
});

test("P7 дизельный двигатель S: куда идёт химическая мощность", () => {
  const s = ship([mod("dsl", "engine-diesel-S-single", "engine", { signature: { size: "S", kind: "diesel", motorEfficiency: 1, profile: "aft" } } as any)], { signatures: sig });
  const out = stepPhysicsV2(s, state(300), env, [{ moduleId: "dsl", duty: 1 }], 0.01);
  const f = out.signatureFrames!.at(-1)!;
  console.log("P7", pick(out.telemetry, ["chemicalW", "engineUsefulW", "propulsionHostW", "exhaustW", "thrustN"]), "IR двигателя", r(f.components.find(c => c.id === "engine:dsl")!.absoluteIrW), "EM", r(f.em.observedEmW));
});

test("P8 типовая добыча S: EM и баланс энергии", () => {
  const laser = mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 });
  const gen = mod("gen", "generator-diesel-S", "generator");
  const prad = mod("pr", "radiator-passive-S", "radiator");
  for (const sigOn of [false, true]) {
    const s = ship([laser, gen, prad], sigOn ? { signatures: sig } : {});
    const out = stepPhysicsV2(s, state(300, 0.85), env, [{ moduleId: "las", duty: 1 }], 1);
    const f = out.signatureFrames?.at(-1);
    console.log("P8 signatures=" + sigOn, pick(out.telemetry, ["generatorW", "deliveredW", "loadHostW", "generatorHostW", "pathLossW", "batteryLossW", "returnHeatW", "exhaustW", "energyResidualJ"]),
      f ? { stageBasisW: r(f.em.stageBasisW), emW: r(f.em.observedEmW), stages: f.stages.map(x => x.id + "=" + r(x.actualW)).join(" ") } : "");
  }
});

test("P9 баланс энергии полного набора модулей", () => {
  const laser = mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 });
  const drive = mod("drv", "engine-electric-S-pair", "load", { output: "drive", signature: { size: "S", kind: "electric", motorEfficiency: 0.9, profile: "lateral" } } as any);
  drive.efficiency = 0.95 * 0.9;
  const mods = () => [laser, drive,
    mod("gen", "generator-diesel-S", "generator"), mod("genh", "generator-hydrogen-S", "generator"),
    mod("dsl", "engine-diesel-S-single", "engine", { signature: { size: "S", kind: "diesel", motorEfficiency: 1, profile: "aft" } } as any),
    mod("sol", "solar-S", "solar"), mod("pr", "radiator-passive-S", "radiator"), mod("ar", "radiator-active-S", "radiator"),
    mod("buf", "buffer-S", "buffer"), mod("ti", "thermoinverter-S", "thermoinverter"),
    mod("h2", "h2-cooler-S", "h2", { signature: { size: "S", kind: "hydrogen", motorEfficiency: 1, profile: "isotropic" } } as any)];
  for (const sigOn of [false, true]) for (const T of [300, 505]) {
    const s = ship(mods(), sigOn ? { signatures: sig } : {});
    const out = stepPhysicsV2(s, state(T, 0.5), { ...env, solarFluxWm2: 1361 }, [{ moduleId: "las", duty: 1 }, { moduleId: "drv", duty: 0.5 }, { moduleId: "dsl", duty: 0.3 }], 1);
    console.log("P9 sig=" + sigOn + " T=" + T, pick(out.telemetry, ["requestedW", "deliveredW", "chemicalW", "energyResidualJ", "coolingAuxW:ti", "coolingAuxW:h2"]), "Tend", r(out.state.temperatureK));
  }
});
