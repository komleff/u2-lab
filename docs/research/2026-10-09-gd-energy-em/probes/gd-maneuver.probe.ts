// Массы, маршевая тяга и аккумулятор готовых кораблей: резерв 2×V_FA и время манёвров тихого хода.
import { test } from "vitest";
import { writeFileSync } from "node:fs";
import { initialStateV2 } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/model/v2/step";
import { loadCandidateCatalog, presetOptions } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/scenarios/mission";

const OUT = "/private/tmp/claude-501/-Users-komleff-Documents-GitHub-u2-lab/071d6f03-bc84-4af5-bd22-702c5dfac98b/scratchpad/";
test("манёвр", { timeout: 300000 }, () => {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  const rows: any[] = [];
  for (const o of presetOptions(catalog)) {
    const built = makeMissionRun(o.fit, catalog, { ...freshMissionConditions(o.fit, catalog), durationSeconds: 60, stepSeconds: 0.1 });
    if (!built.ok) { rows.push({ id: o.id, error: "build" }); continue; }
    const spec: any = built.value;
    const r = spec.resolvedShip;
    const st: any = initialStateV2(spec);
    // Маршевые — одиночные двигатели, кроме референсного ретро
    const marching = r.instances.filter((i: any) => i.item.family === "engine" && i.item.formFactor === "single" && !/retro/.test(i.item.id));
    const forceN = marching.reduce((s: number, i: any) => s + i.item.numerics.forceN, 0);
    const powerW = marching.reduce((s: number, i: any) => s + (i.item.numerics.powerW ?? 0), 0);
    const cargoM3 = (r.cargoCapacityM3.bulk ?? 0) + (r.cargoCapacityM3.universal ?? 0);
    rows.push({
      id: o.id, dryKg: r.dryMassKg, startKg: st.currentMassKg, fullKg: st.currentMassKg + cargoM3 * 1500,
      forceN, powerW, propulsion: marching.map((i: any) => i.item.propulsionType).join(","),
      batteryJ: r.batteryCapacityJ, cargoM3,
    });
  }
  writeFileSync(OUT + "maneuver.json", JSON.stringify(rows, null, 1));
});
