// Шкала температурных зон: холостой полёт 60 мин и добыча 15 мин у готовых кораблей при разном фоне.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { stepPhysicsV2 } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/physics";
import { physicsShip, initialStateV2 } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/step";
import { loadCandidateCatalog, presetOptions } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/scenarios/mission";

const OUT = "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/";
// Принятые пределы Civilian (ТЗ v1.4, раздел 7): [T_work_low, T_work_high]
function limits(item: any): [number, number] | null {
  const f = item.family, sp = item.species, p = item.propulsionType;
  if (f === "mining") return [250, 500];
  if (f === "solar") return [200, 500];
  if (f === "engine") return p === "electric" ? [240, 530] : p === "hydrogen" || sp === "hydrogen" ? [220, 560] : [230, 580];
  if (f === "generator") return sp === "hydrogen" ? [270, 540] : [230, 560];
  if (f === "tank") return [200, 580];
  return null; // охлаждение, пассивное железо, аккумулятор (закон отложен), трюм
}
test("зоны", { timeout: 900000 }, () => {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  const rows: any[] = [];
  for (const o of presetOptions(catalog)) {
    const built = makeMissionRun(o.fit, catalog, { ...freshMissionConditions(o.fit, catalog), durationSeconds: 3600, stepSeconds: 0.1 });
    if (!built.ok) { rows.push({ id: o.id, error: "build" }); continue; }
    const spec = built.value;
    const inst = spec.resolvedShip.instances;
    const lim = inst.map((i: any) => limits(i.item)).filter(Boolean) as [number, number][];
    const tCold = Math.max(...lim.map(l => l[0])), tWeak = Math.min(...lim.map(l => l[1]));
    const fit = inst.map((i: any) => i.item.id).sort().join(",");
    const base = { id: o.id, label: o.label, fit, tCold, tWeak, C_MJK: spec.resolvedShip.heatCapacityJK / 1e6, hullK: spec.resolvedShip.hull.hullRadiationM2, hullPowerKW: spec.resolvedShip.hull.hullPowerW / 1e3, solar: spec.environment.solarFluxWm2 };
    const out: any = { ...base, idle: {}, mining: {} };
    for (const T_env of [3, 50, 100, 150, 200, 230, 250, 270, 290, 300]) {
      // Холостой ход: насосы и термоинверторы по новому каскаду не работают — исключаем их площадь
      let st: any = initialStateV2(spec);
      const env = { ...spec.environment, effectiveBackgroundK: T_env };
      for (let t = 0; t < 3600; t++) {
        const ship = physicsShip(spec, st);
        ship.modules = ship.modules.filter((m: any) => !(m.kind === "radiator" && m.auxW > 0) && m.kind !== "thermoinverter");
        const r = stepPhysicsV2(ship, { ...st, miningStopSeconds: st.miningStopSeconds ?? null }, env, [], 1);
        st = { ...st, ...r.state };
      }
      out.idle[T_env] = { T60: st.temperatureK, soc: st.chargeJ / spec.resolvedShip.batteryCapacityJ };
    }
    for (const T_env of [3, 100, 200, 250, 300, 350, 400, 450]) {
      let st: any = initialStateV2(spec), maxT = st.temperatureK, mined = 0;
      const env = { ...spec.environment, effectiveBackgroundK: T_env };
      const h0 = st.fuelKg.hydrogen ?? 0, d0 = st.fuelKg.diesel ?? 0;
      const req = spec.selectedWorkGroup.map((id: string) => ({ moduleId: id, duty: 1 }));
      for (let t = 0; t < 900; t++) {
        const r = stepPhysicsV2(physicsShip(spec, st), { ...st, miningStopSeconds: st.miningStopSeconds ?? null }, env, req, 1);
        mined += r.state.usefulWork - st.usefulWork;
        st = { ...st, ...r.state };
        maxT = Math.max(maxT, r.maxTemperatureK);
      }
      out.mining[T_env] = { T15: st.temperatureK, maxT, minedM3: mined, h2Kg: h0 - (st.fuelKg.hydrogen ?? 0), dieselKg: d0 - (st.fuelKg.diesel ?? 0), soc: st.chargeJ / spec.resolvedShip.batteryCapacityJ };
    }
    rows.push(out);
  }
  writeFileSync(OUT + "zones.json", JSON.stringify(rows, null, 1));
});
