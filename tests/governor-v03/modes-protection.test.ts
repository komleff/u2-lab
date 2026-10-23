import { describe, expect, it } from "vitest";
import { fixture } from "./reference-clock";

async function kernel() {
  return import("../../src/model/governor-v03/governor");
}

describe("F2-G2 modes and independent protection", () => {
  it("keeps W freeze protection independent while a hot ship cooler remains available", async () => {
    const { input } = fixture("T16");
    const { stepGovernorV03 } = await kernel();
    const result = stepGovernorV03(input);
    expect(result.state.waterEnthalpyJByTank[0].enthalpyJ).toBeGreaterThan(input.state.waterEnthalpyJByTank[0].enthalpyJ);
    expect(result.packages.find(item => item.moduleId === "cooler")?.usefulOutputJ).toBeGreaterThan(0);
    expect(result.decisions).toContainEqual(expect.objectContaining({ stage: "1", reason: "tank-cold-protection" }));
  });

  it("T29 makes the first negative durability crossing an immediate function loss", async () => {
    const { input } = fixture("T29");
    const { stepGovernorV03 } = await kernel();
    const result = stepGovernorV03(input);
    expect(result.state.moduleStateById[0]).toEqual(expect.objectContaining({ durabilityStopped: true, firstNegativeCrossing: false }));
    expect(result.state.rng.state).not.toBe(input.state.rng.state);
    expect(result.trace.actualFailureChecks).toBe(1);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "durability-failure" }));
  });

  it("restarts a durability-stopped module only after authorization, cooldown, and thermal hysteresis", async () => {
    const { input } = fixture("T29");
    input.state = {
      ...input.state,
      shipEnergyJ: 680 * input.profile.ship.heatCapacityJPerK.value,
      moduleStateById: input.state.moduleStateById.map(module => ({ ...module, firstNegativeCrossing: false, durabilityStopped: true, cooldownUntilTick: 0, restartAuthorized: true, stopReasons: ["durability-failure"] })),
    };
    const { stepGovernorV03 } = await kernel();
    const restarted = stepGovernorV03(input);
    expect(restarted.state.moduleStateById[0].durabilityStopped).toBe(false);
    const unauthorized = stepGovernorV03({ ...input, state: { ...input.state, moduleStateById: input.state.moduleStateById.map(module => ({ ...module, restartAuthorized: false })) } });
    expect(unauthorized.state.moduleStateById[0].durabilityStopped).toBe(true);
    expect(unauthorized.decisions).toContainEqual(expect.objectContaining({ reason: "restart-unauthorized" }));
  });

  it("T30 stops at the critical boundary and restarts only after crossing restartHot", async () => {
    const { input } = fixture("T30");
    const { stepGovernorV03 } = await kernel();
    let state = input.state;
    let sawStop = false;
    let restartTick: number | null = null;
    for (let index = 0; index < input.profile.ship.heatCapacityJPerK.value / 1000 && restartTick === null; index++) {
      const result = stepGovernorV03({ ...input, state });
      const module = result.state.moduleStateById[0];
      sawStop ||= module.thermalStopped;
      if (sawStop && !module.thermalStopped) restartTick = result.state.tickIndex;
      state = result.state;
    }
    expect(sawStop).toBe(true);
    expect(restartTick).not.toBeNull();
    const restartTemperatureK = state.shipEnergyJ / input.profile.ship.heatCapacityJPerK.value;
    expect(restartTemperatureK).toBeLessThanOrEqual(input.profile.modules[0].temperatures.restartHotK.value);
  });
});
