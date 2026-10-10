// Второй набор опытов ГД-ревью: буфер, EM против IR по дальностям, длинный баланс энергии.
import { test } from "vitest";
import { stepPhysicsV2, type PhysicsShip, type PhysicsModule } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { moduleBase } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/catalog/presets";
import { projectIrComponents } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/projection";
import cat from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules.json";

const C = cat as Record<string, any>;
const sig = { observerPreset: "S-dedicated", rangeM: 16000, aspectDeg: 0, advancedIr: false, radar: false,
  geometry: { lengthM: 22, widthM: 16, heightM: 6 }, insulation: [], shielding: [], ram: [] } as any;
const IR_DETECT = 0.000274542277, EM_DETECT = 3.592038646e-8;
const range = (w: number, phi: number) => (w > 0 ? Math.sqrt(w / (4 * Math.PI * phi)) / 1000 : 0);
const r = (x: number) => Number(x.toPrecision(4));

function mod(id: string, catId: string, kind: PhysicsModule["kind"], extra: any = {}): PhysicsModule {
  const m = C[catId];
  return { ...moduleBase(id, kind), ...m.numerics, gate: { ...m.gate }, tankId: m.species, species: m.species, ...extra } as PhysicsModule;
}
const engSig = (kind: string, profile: string, eta = 1) => ({ signature: { size: "S", kind, motorEfficiency: eta, profile } });
function ship(modules: PhysicsModule[], opts: any = {}): PhysicsShip {
  return { label: "probe", size: "S", heatCapacityJK: 35000 * 470, dryMassKg: 35000, thermalMaterials: [],
    hullPowerW: 50000, hullRadiationM2: 300, dischargeEfficiency: 0.9, chargeEfficiency: 1,
    accumulators: [{ id: "common", capacityJ: C["battery-S"].numerics.capacityJ }],
    tanks: [{ id: "diesel", species: "diesel", capacityKg: 6000, energyJKg: 43e6, gate: C["tank-diesel-S"].gate },
      { id: "hydrogen", species: "hydrogen", capacityKg: 633.45758, energyJKg: 120e6, gate: C["tank-hydrogen-S"].gate }],
    modules, cargoCapacity: 1e9, cargoLimitM3: 1e9, targetLimitM3: 1e9, returnFraction: 0.35, signatures: sig, ...opts } as PhysicsShip;
}
const env = { effectiveBackgroundK: 100, solarFluxWm2: 0, solarSourceId: "sun", backgroundSourceId: "bg", energyInputs: [], directHeat: [], law: "radiative", linearWK: 0 } as any;
const st = (T: number, q = 1, extra: any = {}) => ({ timeSeconds: 0, chargeJ: C["battery-S"].numerics.capacityJ * q, temperatureK: T,
  fuelKg: { diesel: 6000, hydrogen: 633.45758 }, buffersJ: {}, gates: {}, cargo: 0, usefulWork: 0, phaseKey: "", constraints: [], miningStopSeconds: null, ...extra }) as any;

// Сводка IR (стандартный прибор, ракурс) и EM одного кадра
function signals(out: any, aspect: number) {
  const f = out.signatureFrames.at(-1);
  const p = projectIrComponents(f.components, aspect);
  const T = f.rkTemperatureK.reduce((a: number, b: number) => a + b, 0) / 4;
  const gas = f.coolers.reduce((n: number, c: any) => n + 142 * c.flowKgS * Math.max(T - f.backgroundK, 0), 0);
  const ir = Math.max(p.projectedContrastW + gas, 0);
  const comps = Object.fromEntries(p.components.map(c => [c.id, r(c.projectedContrastW)]));
  return { irW: r(ir), emW: r(f.em.observedEmW), irKm: r(range(ir, IR_DETECT)), emKm: r(range(f.em.observedEmW, EM_DETECT)),
    emStages: f.stages.filter((s: any) => s.actualW > 0).map((s: any) => s.id + "=" + r(s.actualW / 1e6) + "MW").join(" "), irParts: comps, gasW: r(gas) };
}

test("P10 вклад каждого прибора в EM и IR в работе", () => {
  const cases: [string, () => PhysicsModule[], any[], number, number][] = [
    ["только корпус 300K", () => [], [], 300, 1],
    ["дизель-генератор заряжает", () => [mod("gen", "generator-diesel-S", "generator")], [], 300, 0.85],
    ["лазер S + генератор", () => [mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 }), mod("gen", "generator-diesel-S", "generator")], [{ moduleId: "las", duty: 1 }], 300, 0.85],
    ["электродвигатель S полный", () => [Object.assign(mod("drv", "engine-electric-S-single", "load", { output: "drive", ...engSig("electric", "aft", 0.9) }), { efficiency: 0.855 })], [{ moduleId: "drv", duty: 1 }], 300, 1],
    ["дизельный двигатель S полный", () => [mod("dsl", "engine-diesel-S-single", "engine", engSig("diesel", "aft"))], [{ moduleId: "dsl", duty: 1 }], 300, 1],
    ["H2-двигатель S полный", () => [mod("h2e", "engine-hydrogen-S-single", "engine", engSig("hydrogen", "aft"))], [{ moduleId: "h2e", duty: 1 }], 300, 1],
    ["активный радиатор S", () => [mod("ar", "radiator-active-S", "radiator")], [], 300, 1],
    ["термоинвертор S", () => [mod("ti", "thermoinverter-S", "thermoinverter")], [], 300, 1],
    ["H2-охладитель S при 505K", () => [mod("h2", "h2-cooler-S", "h2", engSig("hydrogen", "isotropic"))], [], 505, 1],
  ];
  for (const [name, mods, req, T, q] of cases) {
    const hot = T > 500 ? { ...env, directHeat: [{ sourceId: "x", powerW: 30e6 }] } : env;
    const out = stepPhysicsV2(ship(mods()), st(T, q), hot, req, 0.01);
    const s = signals(out, 180);
    console.log("P10", JSON.stringify({ name, ...s }));
  }
});

test("P11 буфер S: когда тратится ёмкость", () => {
  for (const withBuffer of [false, true]) {
    const mods = () => [mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 }), mod("gen", "generator-diesel-S", "generator"),
      mod("pr", "radiator-passive-S", "radiator"), ...(withBuffer ? [mod("buf", "buffer-S", "buffer")] : [])];
    let s = st(300, 1);
    const marks: any[] = [];
    for (let t = 0; t < 3600; t++) {
      const out = stepPhysicsV2(ship(mods(), { signatures: undefined }), s, env, [{ moduleId: "las", duty: 1 }], 1);
      s = { ...out.state, miningStopSeconds: out.state.miningStopSeconds ?? null };
      if ([60, 300, 600, 1200, 1800, 3599].includes(t)) marks.push({ t, T: r(s.temperatureK), bufferGJ: r((s.buffersJ.buf ?? 0) / 1e9) });
    }
    console.log("P11 buffer=" + withBuffer, JSON.stringify(marks));
  }
});

test("P12 длинный опыт: закон сохранения энергии с полным набором охлаждения", () => {
  const mods = () => [mod("las", "mining-civil-S", "load", { output: "mining", workPerJ: 1 / 24e6 }),
    Object.assign(mod("drv", "engine-electric-S-pair", "load", { output: "drive", ...engSig("electric", "lateral", 0.9) }), { efficiency: 0.855 }),
    mod("gen", "generator-diesel-S", "generator"), mod("genh", "generator-hydrogen-S", "generator"),
    mod("dsl", "engine-diesel-S-single", "engine", engSig("diesel", "aft")), mod("sol", "solar-S", "solar"),
    mod("pr", "radiator-passive-S", "radiator"), mod("ar", "radiator-active-S", "radiator"), mod("buf", "buffer-S", "buffer"),
    mod("ti", "thermoinverter-S", "thermoinverter"), mod("h2", "h2-cooler-S", "h2", engSig("hydrogen", "isotropic"))];
  for (const sigOn of [false, true]) {
    let s = st(300, 0.6); let residual = 0, throughput = 0, emJ = 0, irDebitJ = 0;
    for (let t = 0; t < 1800; t++) {
      const phase = Math.floor(t / 300) % 3;
      const req = phase === 0 ? [{ moduleId: "dsl", duty: 0.6 }] : phase === 1 ? [{ moduleId: "las", duty: 1 }] : [{ moduleId: "drv", duty: 1 }, { moduleId: "las", duty: 1 }];
      let out: any;
      try { out = stepPhysicsV2(ship(mods(), sigOn ? {} : { signatures: undefined }), s, { ...env, solarFluxWm2: 1361, directHeat: [{ sourceId: "x", powerW: 6e6 }] }, req, 1); }
      catch (e) {
        console.log("P12 CRASH sig=" + sigOn, JSON.stringify({ t, phase, error: String(e), timeS: s.timeSeconds, chargeJ: s.chargeJ, T: s.temperatureK, fuel: s.fuelKg, buffers: s.buffersJ, gates: Object.keys(s.gates).filter(k => s.gates[k]) }));
        break;
      }
      residual += out.telemetry.energyResidualJ; throughput += out.telemetry.chemicalW + out.telemetry.solarW + out.telemetry.solarHostW + 6e6 + out.telemetry.radiationInW;
      for (const f of out.signatureFrames ?? []) { emJ += f.em.escapedParasiticW * (f.endS - f.startS); irDebitJ += f.hostIrDebitW * (f.endS - f.startS); }
      s = { ...out.state, miningStopSeconds: out.state.miningStopSeconds ?? null };
    }
    console.log("P12 sig=" + sigOn, JSON.stringify({ residualJ: residual, inputJ: r(throughput), relative: residual / throughput, Tend: r(s.temperatureK), H2kg: r(s.fuelKg.hydrogen), soc: r(s.chargeJ / C["battery-S"].numerics.capacityJ), escapedEmJ: r(emJ), electricIrDebitJ: r(irDebitJ), bufferGJ: r((s.buffersJ.buf ?? 0) / 1e9) }));
  }
});
