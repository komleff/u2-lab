import { describe, expect, it } from "vitest";
import { fixture } from "./reference-clock";
import type { GovernorTickInputV03 } from "../../src/model/governor-v03/types";

async function continueFromCheckpoint(input: GovernorTickInputV03, reopen: boolean, ticks: number) {
  const { stepGovernorV03 } = await import("../../src/model/governor-v03/governor");
  let current = reopen ? JSON.parse(JSON.stringify(input)) as GovernorTickInputV03 : input;
  const results = [];
  for (let index = 0; index < ticks; index++) {
    const result = stepGovernorV03(current);
    results.push(result);
    current = {
      ...current,
      state: reopen ? JSON.parse(JSON.stringify(result.state)) as GovernorTickInputV03["state"] : result.state,
    };
  }
  return results;
}

describe("F2-G2 checkpoint continuation", () => {
  it("is deep-equal after reopen one tick before a failure check", async () => {
    const { input } = fixture("T29");
    input.state = {
      ...input.state,
      moduleStateById: input.state.moduleStateById.map(module => ({ ...module, firstNegativeCrossing: false, emergencyExposureSeconds: 29 / 30 })),
      failureChecks: { ...input.state.failureChecks, emergencyExposureSeconds: 29 / 30 },
    };
    const reopened = await continueFromCheckpoint(input, true, 2);
    const uninterrupted = await continueFromCheckpoint(input, false, 2);
    expect(reopened).toEqual(uninterrupted);
    expect(reopened[0].trace.actualFailureChecks).toBe(1);
    expect(reopened[0].state.rng).toEqual(uninterrupted[0].state.rng);
    expect(reopened[1].state).toEqual(uninterrupted[1].state);
  });

  it("is deep-equal after reopen one tick before restart hysteresis", async () => {
    const { input } = fixture("T30");
    input.state = {
      ...input.state,
      shipEnergyJ: 690.01 * input.profile.ship.heatCapacityJPerK.value,
      moduleStateById: input.state.moduleStateById.map(module => ({ ...module, thermalStopped: true, stopReasons: ["critical-hot-stop"] })),
    };
    const reopened = await continueFromCheckpoint(input, true, 3);
    const uninterrupted = await continueFromCheckpoint(input, false, 3);
    expect(reopened).toEqual(uninterrupted);
    expect(reopened[0].decisions).toContainEqual(expect.objectContaining({ reason: "restart-hysteresis" }));
    expect(reopened[1].state.moduleStateById[0].thermalStopped).toBe(false);
    expect(reopened[2].state).toEqual(uninterrupted[2].state);
  });

  it("is deep-equal after reopen next to Quiet cold-cooling hysteresis", async () => {
    const { input } = fixture("T22");
    input.state = {
      ...input.state,
      shipEnergyJ: 499.999999 * input.profile.ship.heatCapacityJPerK.value,
      effectiveMode: "Quiet",
      requestedMode: "Quiet",
      quietEntryTemperatureK: 499.999999,
      quietHoldTemperatureK: 499.999999,
    };
    input.environment = { ...input.environment, temperatureK: 800, externalHeatingW: 0 };
    const reopened = await continueFromCheckpoint(input, true, 3);
    const uninterrupted = await continueFromCheckpoint(input, false, 3);
    expect(reopened).toEqual(uninterrupted);
    expect(reopened[0].state.modeLatches.quietColdCooling).toBe(false);
    expect(reopened[1].state.modeLatches.quietColdCooling).toBe(true);
    expect(reopened[2].trace.allocatorCalls).toEqual(uninterrupted[2].trace.allocatorCalls);
  });

  it("is deep-equal through T30 cold critical stop and the following tick", async () => {
    const { input } = fixture("T30");
    input.state = {
      ...input.state,
      shipEnergyJ: 200.01 * input.profile.ship.heatCapacityJPerK.value,
    };
    const reopened = await continueFromCheckpoint(input, true, 3);
    const uninterrupted = await continueFromCheckpoint(input, false, 3);
    expect(reopened).toEqual(uninterrupted);
    expect(reopened[1].decisions).toContainEqual(expect.objectContaining({ reason: "critical-cold-stop" }));
    expect(reopened[2].state.moduleStateById[0].thermalStopped).toBe(true);
  });

  it("is deep-equal through T30 cold restart hysteresis and the following tick", async () => {
    const { input } = fixture("T30");
    input.environment = { ...input.environment, temperatureK: 800, externalHeatingW: 0, externalCoolingW: 0 };
    input.state = {
      ...input.state,
      shipEnergyJ: 229.999999 * input.profile.ship.heatCapacityJPerK.value,
      moduleStateById: input.state.moduleStateById.map(module => ({
        ...module,
        thermalStopped: true,
        stopReasons: ["critical-cold-stop"],
      })),
    };
    const reopened = await continueFromCheckpoint(input, true, 3);
    const uninterrupted = await continueFromCheckpoint(input, false, 3);
    expect(reopened).toEqual(uninterrupted);
    expect(reopened[0].decisions).toContainEqual(expect.objectContaining({ reason: "restart-hysteresis" }));
    expect(reopened[1].state.moduleStateById[0].thermalStopped).toBe(false);
    expect(reopened[2].state).toEqual(uninterrupted[2].state);
  });
});
