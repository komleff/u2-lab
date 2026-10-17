// Локализация падения часов сигнатур на готовом Караване
import { test } from "vitest";
import { loadCandidateCatalog, presetOptions } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/scenarios/mission";
import { signatureSpec } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/signatures/config";
import { createRun, runChunk } from "/Users/komleff/Documents/GitHub/u2-lab-signatures-runtime/src/runner/run";

test("Караван 2/3 лазера: состояние перед падением", { timeout: 600000 }, () => {
  const catalog = loadCandidateCatalog("ship-fitting-0.2.5");
  for (const o of presetOptions(catalog).filter(o => o.id.startsWith("industrial-L") && !o.id.endsWith(":1"))) {
    const built = makeMissionRun(o.fit, catalog, { ...freshMissionConditions(o.fit, catalog), durationSeconds: 3600, stepSeconds: 0.1 });
    if (!built.ok) throw new Error("build");
    const run: any = createRun("c-" + o.id, signatureSpec(built.value));
    let last: any = null;
    try { while (!run.done) { last = structuredClone({ t: run.state.timeSeconds, chargeJ: run.state.chargeJ, T: run.state.temperatureK, fuel: run.state.fuelKg, cap: run.spec.resolvedShip.batteryCapacityJ }); runChunk(run, 1); } console.log("OK", o.id); }
    catch (e) { console.log("CRASH", o.id, String(e), JSON.stringify(last)); }
    // Тот же корабль без сигнатур
    const plain: any = createRun("p-" + o.id, built.value);
    try { while (!plain.done) runChunk(plain, 20000); console.log("NOSIG OK", o.id, "T", plain.state.temperatureK.toFixed(1), "charge", plain.state.chargeJ); }
    catch (e) { console.log("NOSIG CRASH", o.id, String(e)); }
  }
});
