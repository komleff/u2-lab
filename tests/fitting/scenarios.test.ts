import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun, runChunk } from "../../src/runner/run";
const c = loadCandidateCatalog();
it("approach requests march only and service unload does not refuel, recharge or cool", () => {
  const v = makeMiningRun(getPresetFit("pony:3"), c, {
    approachSeconds: 1,
    workSeconds: 1,
    brakingSeconds: 1,
    serviceSeconds: 1,
    idleSeconds: 1,
    durationSeconds: 4.01,
  });
  if (!v.ok) throw Error("scenario missing");
  expect(v.value.scenario.phases[0].requests).toEqual({ march: 1 });
  const r = createRun("service", v.value);
  while (!r.done) runChunk(r, 1000);
  expect(r.state.cargo).toBe(0);
  expect(r.state.fuelKg.diesel).toBeLessThan(12000);
  expect(r.state.chargeJ).toBeLessThan(v.value.initial.chargeJ);
  expect(r.state.temperatureK).not.toBe(300);
});
it("repeat carries stocks, incomplete cycle is not invented completion; draft cannot run", () => {
  const f = getPresetFit("sputnik");
  const v = makeMiningRun(f, c, {
    approachSeconds: 1,
    workSeconds: 1,
    brakingSeconds: 1,
    serviceSeconds: 1,
    idleSeconds: 1,
    durationSeconds: 7,
    repeat: true,
  });
  if (!v.ok) throw Error("missing");
  const r = createRun("repeat", v.value);
  while (!r.done) runChunk(r, 1000);
  expect(r.state.cyclesCompleted).toBe(1);
  expect(r.state.fuelKg.diesel).toBeLessThan(v.value.initial.fuelKg.diesel);
  delete f.instances[f.assignments.march];
  delete f.assignments.march;
  expect(makeMiningRun(f, c).ok).toBe(false);
});
