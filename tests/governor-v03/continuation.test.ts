import { describe, expect, it } from "vitest";
import { fixture } from "./reference-clock";
import type { GovernorTickInputV03 } from "../../src/model/governor-v03/types";

async function continueTwice(input: GovernorTickInputV03, reopen: boolean) {
  const { stepGovernorV03 } = await import("../../src/model/governor-v03/governor");
  const first = stepGovernorV03(reopen ? JSON.parse(JSON.stringify(input)) : input);
  const checkpoint = reopen ? JSON.parse(JSON.stringify(first.state)) : first.state;
  return stepGovernorV03({ ...input, state: checkpoint });
}

describe("F2-G2 checkpoint continuation", () => {
  it("is deep-equal after reopen one tick before a failure check", async () => {
    const { input } = fixture("T29");
    input.state = {
      ...input.state,
      moduleStateById: input.state.moduleStateById.map(module => ({ ...module, firstNegativeCrossing: false, emergencyExposureSeconds: 29 / 30 })),
      failureChecks: { ...input.state.failureChecks, emergencyExposureSeconds: 29 / 30 },
    };
    expect(await continueTwice(input, true)).toEqual(await continueTwice(input, false));
  });

  it("is deep-equal after reopen one tick before restart hysteresis", async () => {
    const { input } = fixture("T30");
    input.state = {
      ...input.state,
      shipEnergyJ: 690.01 * input.profile.ship.heatCapacityJPerK.value,
      moduleStateById: input.state.moduleStateById.map(module => ({ ...module, thermalStopped: true, stopReasons: ["critical-hot-stop"] })),
    };
    expect(await continueTwice(input, true)).toEqual(await continueTwice(input, false));
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
    input.environment = { ...input.environment, externalHeatingW: 100 };
    expect(await continueTwice(input, true)).toEqual(await continueTwice(input, false));
  });
});
