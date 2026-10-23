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
  });

  it("passes the standalone drift verifier", () => {
    const output = execFileSync(process.execPath, ["scripts/verify-f2-handoff.mjs"], { cwd: root, encoding: "utf8" });
    expect(output).toContain("F2 handoff PASS");
  });
});
