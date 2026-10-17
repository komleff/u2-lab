// Расширенная таблица IR/EM: (А) модули на эталонном стенде, (Б) корабли каталога в рейсе.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { stepPhysicsV2, type PhysicsShip, type PhysicsModule } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { moduleBase } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/catalog/presets";
import { projectIrComponents } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/projection";
import { loadCandidateCatalog, presetOptions } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/scenarios/mission";
import { signatureSpec } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/config";
import { createRun, runChunk } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/runner/run";
import cat from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules.json";
import cat21 from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules-0.2.1.json";
import cat23 from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/data/modules-0.2.3.json";

const OUT = "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/";
const C: Record<string, any> = { ...(cat as any), ...(cat21 as any), ...(cat23 as any) };
const IR_DETECT = 0.000274542277, EM_DETECT = 3.592038646e-8;
const km = (w: number, phi: number) => (w > 0 ? Math.sqrt(w / (4 * Math.PI * phi)) / 1000 : 0);
const sig = { observerPreset: "S-dedicated", rangeM: 16000, aspectDeg: 0, advancedIr: false, radar: false,
  geometry: { lengthM: 22, widthM: 16, heightM: 6 }, insulation: [], shielding: [], ram: [] } as any;

function mod(id: string, catId: string, extra: any = {}): PhysicsModule {
  const m = C[catId];
  if (!m) throw new Error("нет в каталоге: " + catId);
  const electric = m.family === "engine" && m.propulsionType === "electric";
  const kind = m.family === "mining" || electric ? "load" : m.family;
  const x = { ...moduleBase(id, kind), ...m.numerics, gate: { ...m.gate }, tankId: m.species, species: m.species,
    output: m.family === "mining" ? "mining" : electric ? "drive" : undefined,
    signature: { size: m.size === "M" ? "M" : "S", kind: m.propulsionType ?? (m.species === "hydrogen" ? "hydrogen" : "diesel"), motorEfficiency: m.numerics.efficiency ?? 1, profile: extra.profile ?? (m.family === "h2" ? "isotropic" : "aft") }, ...extra } as any;
  if (electric) x.efficiency = m.numerics.pathEfficiency * m.numerics.efficiency;
  if (m.family === "mining") x.workPerJ = 1 / 24e6;
  return x;
}
// Эталонный стенд: синтетический корпус S или M, пассивный радиатор, аккумулятор, оба бака
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
function look(out: any) {
  const f = out.signatureFrames.at(-1);
  const T = f.rkTemperatureK.reduce((a: number, b: number) => a + b, 0) / 4;
  const gas = f.coolers.reduce((n: number, c: any) => n + 142 * c.flowKgS * Math.max(T - f.backgroundK, 0), 0);
  const at = (a: number) => Math.max(projectIrComponents(f.components, a).projectedContrastW + gas, 0);
  const own = f.components.filter((c: any) => !["body", "radiators"].includes(c.id)).reduce((n: number, c: any) => n + c.absoluteIrW, 0) + gas;
  return { T, rear: at(180), nose: at(0), side: at(90), em: f.em.observedEmW, own };
}

type Row = { group: string; name: string; size: string; mode: string; ownW: number; hostMW: number; t0: any; t60: any; gateS: number | null; note: string };
function runDevice(group: string, name: string, size: "S" | "M", mods: PhysicsModule[], req: any[], soc: number, note = "", mode = "100%"): Row {
  const sh = stand(size, mods);
  let s: any = { timeSeconds: 0, chargeJ: C["battery-" + size].numerics.capacityJ * soc, temperatureK: 300,
    fuelKg: { diesel: 6000 * (size === "M" ? 4 : 1), hydrogen: size === "M" ? 3647.570429 : 633.45758 }, buffersJ: {}, gates: {}, cargo: 0, usefulWork: 0, phaseKey: "", constraints: [], miningStopSeconds: null };
  let t0: any = null, t60: any = null, gateS: number | null = null, hostMW = 0;
  for (let i = 0; i < 600; i++) {
    const out = stepPhysicsV2(sh, s, env, req, 0.1);
    if (i === 0) { t0 = look(out); hostMW = (out.telemetry.propulsionHostW + out.telemetry.loadHostW + out.telemetry.generatorHostW + out.telemetry.pathLossW + out.telemetry.batteryLossW + out.telemetry.returnHeatW + out.telemetry.radiatorHostW) / 1e6; }
    s = { ...out.state, miningStopSeconds: out.state.miningStopSeconds ?? null };
    if (gateS === null && Object.entries(s.gates).some(([k, v]) => v && !k.startsWith("rad"))) gateS = (i + 1) * 0.1;
    if (i === 599) t60 = look(out);
  }
  return { group, name, size, mode, ownW: t0.own, hostMW, t0, t60, gateS, note };
}

test("А: модули на эталонном стенде", () => {
  const rows: Row[] = [];
  for (const size of ["S", "M"] as const) {
    rows.push(runDevice("Корпус", "Только корпус + пассивный радиатор, 300 K", size, [], [], 1));
    for (const t of ["diesel", "hydrogen", "electric"]) for (const ff of ["single", "pair"]) {
      const id = `engine-${t}-${size}-${ff}`;
      if (!C[id]) continue;
      for (const duty of [1, 0.3]) rows.push(runDevice("Двигатель", `${t === "diesel" ? "Дизельный" : t === "hydrogen" ? "Водородный" : "Электрический"} ${size} ${ff === "single" ? "одиночный" : "пара"}`, size,
        [mod("e", id, { profile: ff === "pair" ? "lateral" : "aft" })], [{ moduleId: "e", duty }], 1, ff === "pair" ? "профиль бока (стрейф/поворот)" : "кормовой профиль", (duty * 100) + "%"));
    }
    for (const g of [`generator-diesel-${size}`, `generator-hydrogen-${size}`]) rows.push(runDevice("Генератор", (g.includes("diesel") ? "Дизель-генератор " : "H₂-генератор ") + size, size, [mod("g", g)], [], 0.85, "заряжает аккумулятор на полной мощности"));
    for (const l of Object.keys(C).filter(k => C[k].family === "mining" && C[k].size === size)) rows.push(runDevice("Лазер", C[l].label ?? l, size, [mod("l", l)], [{ moduleId: "l", duty: 1 }], 1, "питание от аккумулятора"));
    rows.push(runDevice("Лазер+генератор", "Лазер civil " + size + " + дизель-генератор", size, [mod("l", Object.keys(C).find(k => C[k].family === "mining" && C[k].size === size && k.includes("civil"))!), mod("g", `generator-diesel-${size}`)], [{ moduleId: "l", duty: 1 }], 0.85));
    rows.push(runDevice("Лазер+генератор", "Лазер civil " + size + " + H₂-генератор", size, [mod("l", Object.keys(C).find(k => C[k].family === "mining" && C[k].size === size && k.includes("civil"))!), mod("g", `generator-hydrogen-${size}`)], [{ moduleId: "l", duty: 1 }], 0.85));
    rows.push(runDevice("Охлаждение", "Активный радиатор " + size, size, [mod("a", "radiator-active-" + size)], [], 1, "насос всегда на полной"));
    rows.push(runDevice("Охлаждение", "Термоинвертор " + size + " (нынешний)", size, [mod("ti", "thermoinverter-" + size)], [], 1, "дефект: работает всегда"));
    rows.push(runDevice("Охлаждение", "Солнечная панель " + size + " (1361 Вт/м²)", size, [mod("sol", "solar-" + size)], [], 0.5));
  }
  writeFileSync(OUT + "table-a.json", JSON.stringify(rows));
});

test("Б: корабли каталога в часовом рейсе", { timeout: 900000 }, () => {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  const rows: any[] = [];
  for (const o of presetOptions(catalog)) {
    const built = makeMissionRun(o.fit, catalog, { ...freshMissionConditions(o.fit, catalog), durationSeconds: 3600, stepSeconds: 0.1 });
    if (!built.ok) { rows.push({ id: o.id, label: o.label, error: JSON.stringify(built.errors).slice(0, 200) }); continue; }
    const spec = signatureSpec(built.value);
    let run: any;
    try { run = createRun("t-" + o.id, spec); while (!run.done) runChunk(run, 20000); }
    catch (e) { rows.push({ id: o.id, label: o.label, error: String(e).slice(0, 200) }); continue; }
    const st = run.signatures.sourceStats;
    const phases: any = {};
    for (const ch of ["IRrear", "IRnose", "IRleft", "EM"]) for (const [ph, a] of Object.entries<any>(st[ch].phases)) {
      phases[ph] ??= {}; phases[ph][ch] = { mean: a.durationS ? a.integral / a.durationS : 0, max: a.max ?? 0, dur: a.durationS };
    }
    rows.push({ id: o.id, label: o.label, T: run.state.temperatureK, delivered: run.state.deliveredM3 ?? null, phases, total: Object.fromEntries(["IRrear", "IRnose", "IRleft", "EM"].map(ch => [ch, { mean: st[ch].total.integral / st[ch].total.durationS, max: st[ch].total.max }])) });
  }
  writeFileSync(OUT + "table-b.json", JSON.stringify(rows));
});
