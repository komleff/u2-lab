import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../..", import.meta.url);
const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const manifest = readJson("docs/verification/f2-governor-handoff/manifest.json");
const results = readJson("docs/verification/f2-governor-handoff/reference-results.json");
const traces = readJson("docs/verification/f2-governor-handoff/representative-traces.json");

describe("F2-G2 early U2 handoff freeze", () => {
  it("binds the immutable kernel commit and rejects runtime authorization", () => {
    expect(manifest.kernelCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(manifest.runtimeAuthorization).toBe(false);
    expect(manifest.versions.state).toBe("ship-state/2.1");
    expect(results.kernelCommit).toBe(manifest.kernelCommit);
    expect(traces.kernelCommit).toBe(manifest.kernelCommit);
  });

  it("records every T-ID without overstating deferred and OUT rows", () => {
    expect(results.tIds.map((item: { id: string }) => item.id)).toEqual(
      Array.from({ length: 39 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`),
    );
    expect(results.tIds.filter((item: { status: string }) => item.status === "NOT_RUN").map((item: { id: string }) => item.id)).toEqual(["T31", "T35", "T36"]);
    expect(results.trajectories).toHaveLength(4);
    expect(results.trajectories.every((item: { status: string }) => item.status === "PASS")).toBe(true);
  });

  it("retains the required trace scenarios and complete row receipts", () => {
    expect(traces.scenarios.map((item: { id: string }) => item.id)).toEqual([
      "shared-port-proportional",
      "quiet-debt-recovery-repeat",
      "power-fuel-shortage",
      "t22-temperature-dependent-h2",
      "t24-quiet-emergency-source",
      "t38-shared-resource-order",
      "checkpoint-before-failure",
      "checkpoint-before-restart",
      "checkpoint-before-hysteresis",
      "t24-stopped-generator-protection",
      "t24-source-loss-late-capture",
      "t34-sub-ulp-json-continuation",
    ]);
    for (const scenario of traces.scenarios) for (const row of scenario.rows) {
      expect(row).toEqual(expect.objectContaining({
        tick: expect.any(Number),
        requests: expect.any(Array),
        reservations: expect.any(Array),
        actualAllocations: expect.any(Object),
        stateBeforeDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
        stateAfterDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
        limitingReasons: expect.any(Array),
      }));
    }
    const emergency = traces.scenarios.find((item: { id: string }) => item.id === "t24-quiet-emergency-source").rows[0];
    expect(emergency.actualAllocations.sourceEntries).toEqual(expect.arrayContaining([
      expect.objectContaining({ ownerId: "generator-source", nodeId: "electrical", energyJ: expect.any(Number) }),
      expect.objectContaining({ ownerId: "generator-source", nodeId: "ship", energyJ: expect.any(Number) }),
    ]));
    const sharedFlow = traces.scenarios.find((item: { id: string }) => item.id === "t38-shared-resource-order");
    expect(sharedFlow.inputBoundary).toEqual({
      mutations: { h2MaxFlowKgPerS: 3, electricalChargeJ: 0 },
      retained: {
        requests: [
          { id: "propulsion", requestedW: 30_000_000 },
          { id: "generator", requestedW: 9_000_000 },
          { id: "cooler", requestedW: 3_000_000 },
        ],
        shipHeatCapacityJPerK: 1_000_000_000,
      },
    });
    expect(sharedFlow.rows[0].reservations).toEqual([
      { ownerId: "module:propulsion", resourceId: "h2", reservedKg: 0.1 },
      { ownerId: "source:generator-source", resourceId: "h2", reservedKg: 0 },
      { ownerId: "module:cooler", resourceId: "h2", reservedKg: 0 },
    ]);
    expect(sharedFlow.rows[0].actualAllocations.workPackages).toEqual([
      expect.objectContaining({ moduleId: "propulsion", resourceKg: [{ id: "h2", massKg: 0.1 }] }),
    ]);
    expect(sharedFlow.rows[0].limitingReasons).toEqual(expect.arrayContaining([
      { moduleId: "propulsion", reason: "resource-reserved" },
      { moduleId: "cooler", reason: "power-limited" },
    ]));

    const sharedPort = traces.scenarios.find((item: { id: string }) => item.id === "shared-port-proportional").rows[0];
    const sharedAllocatedJ = sharedPort.actualAllocations.banks.reduce((sum: number, item: { energyJ: number }) => sum + item.energyJ, 0);
    const sharedUsefulJ = sharedPort.actualAllocations.workPackages.reduce((sum: number, item: { usefulOutputJ: number }) => sum + item.usefulOutputJ, 0);
    const sharedPickupJ = sharedPort.actualAllocations.workPackages.reduce(
      (sum: number, item: { pickupByBank: { energyJ: number }[] }) => sum + item.pickupByBank.reduce((inner, pickup) => inner + pickup.energyJ, 0),
      0,
    );
    expect(sharedPort.actualAllocations.banks).toEqual([
      { bankId: "bank-a", consumerId: "cooler-10", energyJ: 200_000 },
      { bankId: "bank-a", consumerId: "cooler-20a", energyJ: 400_000 },
      { bankId: "bank-a", consumerId: "cooler-20b", energyJ: 400_000 },
    ]);
    expect({ sharedAllocatedJ, sharedUsefulJ, sharedPickupJ }).toEqual({
      sharedAllocatedJ: 1_000_000,
      sharedUsefulJ: 1_000_000,
      sharedPickupJ: 1_000_000,
    });

    const stoppedSource = traces.scenarios.find((item: { id: string }) => item.id === "t24-stopped-generator-protection");
    expect(stoppedSource.rows[0]).toEqual(expect.objectContaining({ generatedJ: 0, fuelUsedKg: 0 }));
    expect(stoppedSource.rows[0].actualAllocations.sourceEntries).toEqual([]);
    expect(stoppedSource.rows[0].actualAllocations.workPackages).toEqual([]);
    expect(stoppedSource.rows[0].limitingReasons).toContainEqual({ moduleId: "generator", reason: "restart-unauthorized" });

    const lateCaptureScenario = traces.scenarios.find((item: { id: string }) => item.id === "t24-source-loss-late-capture");
    const lateCapture = lateCaptureScenario.rows[0];
    expect(lateCapture.sourceHostJ).toBeCloseTo(1 / 6, 12);
    expect(lateCapture.lateCaptureJ).toBeCloseTo(lateCapture.sourceHostJ, 12);
    expect(lateCapture.executionOrder).toEqual([
      "stage-0-snapshot",
      "preliminary-stages-1-7",
      "electrical-dispatch",
      "final-stages-1-7",
      "actual-work-packages",
      "actual-source-losses",
      "environment-outward",
      "stage-8-late-capture",
      "stage-9-commit",
    ]);
    expect(lateCaptureScenario.signedExchangeCases).toEqual([
      expect.objectContaining({
        sign: "positive",
        externalCoolingW: 0,
        signedLateHeatJ: 1 / 6,
        lateCaptureJ: 1 / 6,
        bankDeltaJ: 1 / 6,
        shipDeltaJ: 0,
        stage8Selected: true,
        energyResidualJ: 0,
      }),
      expect.objectContaining({
        sign: "zero",
        externalCoolingW: 5,
        signedLateHeatJ: 0,
        lateCaptureJ: 0,
        bankDeltaJ: 0,
        shipDeltaJ: 0,
        stage8Selected: false,
        energyResidualJ: 0,
      }),
      expect.objectContaining({
        sign: "negative",
        externalCoolingW: 10,
        signedLateHeatJ: -1 / 6,
        lateCaptureJ: 0,
        bankDeltaJ: 0,
        shipDeltaJ: -1 / 6,
        stage8Selected: false,
        energyResidualJ: 0,
      }),
    ]);

    const precision = traces.scenarios.find((item: { id: string }) => item.id === "t34-sub-ulp-json-continuation");
    expect(precision.rows).toHaveLength(10);
    expect(precision.authoritativeDeltaJ).toBeCloseTo(0.0001, 12);
    expect(precision.rows.every((item: { shipEnergyRemainderJ: number; energyResidualJ: number }) =>
      Number.isFinite(item.shipEnergyRemainderJ) && Math.abs(item.energyResidualJ) <= 1e-6)).toBe(true);

    expect(results.reviewRegressions).toEqual([
      expect.objectContaining({ id: "CR-G2-B1", status: "PASS", generatedJ: 0, fuelUsedKg: 0, coolerUsefulJ: 0 }),
      expect.objectContaining({
        id: "CR-G2-B2",
        status: "PASS",
        sourceHostJ: expect.any(Number),
        signedCases: [
          expect.objectContaining({ sign: "positive", lateCaptureJ: 1 / 6, stage8Selected: true }),
          expect.objectContaining({ sign: "zero", lateCaptureJ: 0, bankDeltaJ: 0, shipDeltaJ: 0, stage8Selected: false }),
          expect.objectContaining({ sign: "negative", lateCaptureJ: 0, shipDeltaJ: -1 / 6, stage8Selected: false }),
        ],
      }),
      expect.objectContaining({ id: "CR-G2-B3", status: "PASS", ticks: 10, jsonCheckpoint: "deep-equal" }),
      expect.objectContaining({ id: "CR-G2-B4", status: "PASS", sharedPortJ: 1_000_000, usefulOutputJ: 1_000_000, allocatedJ: 1_000_000 }),
    ]);
  });

  it("passes the standalone drift verifier", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-f2-handoff.mjs"], { cwd: root, encoding: "utf8" });
    expect(output).toContain("F2 handoff PASS");
  });
});
