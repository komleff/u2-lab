import { it, expect } from "vitest";
import { presets, moduleBase, markEdits } from "../src/catalog/presets";
import { createRun, runChunk } from "../src/runner/run";
it("next useful action resumes before100% charge, recovery uses actual unconstrained work", () => {
  const p = structuredClone(presets[0]);
  p.ship.accumulators = [{ id: "a", capacityJ: 1000 }];
  p.initial.chargeJ = 0;
  p.ship.hullPowerW = 0;
  p.ship.hullRadiationM2 = 0;
  p.ship.dischargeEfficiency = 1;
  p.ship.modules = [
    {
      ...moduleBase("g", "generator"),
      tankId: "diesel",
      species: "diesel",
      powerW: 10,
      efficiency: 1,
    },
    {
      ...moduleBase("work", "load"),
      powerW: 100,
      efficiency: 1,
      workPerJ: 0.01,
    },
  ];
  p.scenario.phases = [
    { id: "work1", action: "work", durationSeconds: 1, duty: 1 },
    { id: "recovery", action: "recovery", durationSeconds: 20, duty: 0 },
    { id: "work2", action: "work", durationSeconds: 1, duty: 1 },
  ];
  p.scenario.repeat = false;
  p.durationSeconds = 22;
  markEdits(p);
  const r = createRun("ready", p);
  while (!r.done) runChunk(r, 1000);
  expect(r.metrics.nextActionReadySeconds).toBeGreaterThan(20);
  expect(r.metrics.nextActionReadySeconds).toBeLessThan(22);
  expect(r.state.chargeJ).toBeLessThan(1000);
  expect(r.metrics.recoverySeconds).toBeGreaterThan(0);
});
it("explicit refuel does not erase cumulative consumed fuel", () => {
  const p = structuredClone(presets[0]);
  p.ship.modules = [
    {
      ...moduleBase("engine", "engine"),
      tankId: "diesel",
      species: "diesel",
      forceN: 1e6,
      alpha: 5.65e-7,
      efficiency: 0.32,
      hostFraction: 0.05,
    },
  ];
  p.durationSeconds = 22;
  p.scenario.phases = [
    { id: "march", action: "approach", durationSeconds: 10, duty: 1 },
    {
      id: "refuel",
      action: "service",
      durationSeconds: 1,
      duty: 0,
      service: { unload: false, charge: false, refuel: true },
    },
  ];
  markEdits(p);
  const r = createRun("service", p);
  while (!r.done) runChunk(r, 1000);
  expect(r.metrics.fuelConsumedKg.diesel).toBeCloseTo(11.3, 5);
});
