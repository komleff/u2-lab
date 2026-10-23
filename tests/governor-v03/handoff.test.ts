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
  });

  it("passes the standalone drift verifier", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-f2-handoff.mjs"], { cwd: root, encoding: "utf8" });
    expect(output).toContain("F2 handoff PASS");
  });
});
