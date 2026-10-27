import { describe, expect, it } from "vitest";
import { GOVERNOR_TOLERANCES } from "../../src/model/governor-v03/tolerances";
import { fixture, runFixture } from "./reference-clock";

const trajectories = [
  ["T05", "steady exchange"],
  ["T30", "threshold crossing"],
  ["T08", "finite resource exhaustion"],
  ["T25", "work to recovery to repeat"],
] as const;

describe("T33 30/120 Hz same-algorithm reference", () => {
  it.each(trajectories)("converges for %s %s without a systematic coarse-step advantage", async (tId) => {
    const [coarse, reference] = await Promise.all([runFixture(tId, 30), runFixture(tId, 120)]);
    const profile = fixture(tId).profile;
    const initialTemperatureK = coarse.initialShipEnergyJ / profile.ship.heatCapacityJPerK.value;
    const coarseTemperatureK = coarse.final.state.shipEnergyJ / profile.ship.heatCapacityJPerK.value;
    const referenceTemperatureK = reference.final.state.shipEnergyJ / profile.ship.heatCapacityJPerK.value;
    const temperatureTolerance = GOVERNOR_TOLERANCES.temperatureConvergence.absolute
      + GOVERNOR_TOLERANCES.temperatureConvergence.relative * Math.max(1, Math.abs(referenceTemperatureK - initialTemperatureK));
    expect(Math.abs(coarseTemperatureK - referenceTemperatureK)).toBeLessThanOrEqual(temperatureTolerance);

    const energyScale = Math.max(
      Math.abs(coarse.final.state.shipEnergyJ - coarse.initialShipEnergyJ),
      Math.abs(reference.final.state.shipEnergyJ - reference.initialShipEnergyJ),
      reference.outwardJ,
    );
    const energyTolerance = GOVERNOR_TOLERANCES.energyConvergence.absolute + GOVERNOR_TOLERANCES.energyConvergence.relative * energyScale;
    expect(Math.abs((coarse.final.state.shipEnergyJ - coarse.initialShipEnergyJ) - (reference.final.state.shipEnergyJ - reference.initialShipEnergyJ))).toBeLessThanOrEqual(energyTolerance);

    for (const id of new Set([...Object.keys(coarse.resourceConsumedKg), ...Object.keys(reference.resourceConsumedKg)])) {
      const consumed30 = coarse.resourceConsumedKg[id] ?? 0;
      const consumed120 = reference.resourceConsumedKg[id] ?? 0;
      const massTolerance = GOVERNOR_TOLERANCES.massConvergence.absolute
        + GOVERNOR_TOLERANCES.massConvergence.relative * Math.max(consumed120, 1e-6);
      expect(Math.abs(consumed30 - consumed120)).toBeLessThanOrEqual(massTolerance);
    }

    expect(coarse.transitions.map(item => ({ ...item, timeSeconds: 0 }))).toEqual(reference.transitions.map(item => ({ ...item, timeSeconds: 0 })));
    for (let index = 0; index < coarse.transitions.length; index++) {
      expect(Math.abs(coarse.transitions[index].timeSeconds - reference.transitions[index].timeSeconds)).toBeLessThanOrEqual(1 / 30);
    }
    expect(coarse.usefulOutputJ).toBeLessThanOrEqual(reference.usefulOutputJ + energyTolerance);
  }, 60_000);

  it("executes all four exact physical trajectory durations from T33", () => {
    const { vector } = fixture("T33");
    expect(vector.input.reference?.trajectories.map(item => [item.id, item.durationSeconds])).toEqual([
      ["steady-exchange", 60],
      ["threshold-crossing", 30],
      ["resource-exhaustion", 120],
      ["work-recovery-repeat", 180],
    ]);
  });
});
