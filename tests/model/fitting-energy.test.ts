import { it, expect } from "vitest";
import { fixture } from "../fitting/test-spec";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
import { worstRun } from "../fitting/worst-fit";
import { createRun, runChunk } from "../../src/runner/run";
it("battery boundary under repeated real cooling and mining demand does not create bus energy", () => {
  const s = worstRun(60);
  s.initial.chargeJ = 0;
  const g = s.resolvedShip.instances.find(
    (i) => i.item.species === "hydrogen" && i.item.family === "generator",
  )!;
  g.enabled = false;
  s.resolvedShip.resources.hydrogen.consumerIds =
    s.resolvedShip.resources.hydrogen.consumerIds.filter((id) => id !== g.id);
  const r = createRun("boundary", s);
  while (!r.done) {
    const prior = { time: r.state.timeSeconds, chargeJ: r.state.chargeJ };
    runChunk(r, 1);
    expect(
      Math.abs(r.last.energyResidualJ),
      JSON.stringify({ prior, after: r.state.chargeJ, telemetry: r.last }),
    ).toBeLessThan(1);
  }
});
it("three 3MW lasers compete for 8MW real bus; beam return enters host exactly once", () => {
  const s = fixture();
  s.resolvedShip.hull.hullPowerW = 0;
  const g = s.resolvedShip.instances.find(
    (i) => i.item.family === "generator",
  )!;
  g.item.numerics.pathEfficiency = 1;
  const r = stepV2(s, initialStateV2(s), 0.01, s.scenario.phases[0].requests);
  expect(r.telemetry.beamW).toBeCloseTo(8e6 * 0.9 * 0.5001, 4);
  expect(r.telemetry.returnHeatW).toBeCloseTo(r.telemetry.beamW * 0.35, 4);
  expect(r.telemetry.externalBeamW).toBeCloseTo(r.telemetry.beamW * 0.65, 4);
  expect(Math.abs(r.telemetry.energyResidualJ)).toBeLessThan(0.01);
  expect(r.state.usefulWork).toBeCloseTo((0.01 * 8e6 * 0.9 * 0.5001) / 24e6, 9);
  for (const id of s.selectedWorkGroup)
    expect(r.telemetry["deliveredW:" + id]).toBeCloseTo(2.4e6, 4);
});
it("finite battery deficit ends within step and independent IDs cannot borrow phantom energy", () => {
  const s = fixture();
  s.resolvedShip.hull.hullPowerW = 0;
  s.initial.chargeJ = 10000;
  const r = stepV2(s, initialStateV2(s), 1, s.scenario.phases[0].requests);
  expect(r.state.chargeJ).toBe(0);
  expect(r.state.usefulWork).toBeLessThan(3 * 0.0625125);
  expect(r.state.usefulWork).toBeGreaterThan(0.1);
  expect(Math.abs(r.telemetry.energyResidualJ)).toBeLessThan(1);
});
it("one fully supplied CivilS mines .0625125 SCU/s with actual beam, no contents C", () => {
  const s = fixture("sputnik");
  s.initial.chargeJ = 1e9;
  const r = stepV2(s, initialStateV2(s), 1, s.scenario.phases[0].requests);
  expect(r.state.usefulWork).toBeCloseTo(0.0625125, 9);
  expect(r.state.currentMassKg).toBeCloseTo(
    s.resolvedShip.dryMassKg +
      Object.values(r.state.fuelKg).reduce((n, v) => n + v, 0) +
      93.76875,
    5,
  );
});
