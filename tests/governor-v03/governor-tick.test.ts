import { describe, expect, it } from "vitest";
import { fixture } from "./reference-clock";

async function step(input: ReturnType<typeof fixture>["input"]) {
  const { stepGovernorV03 } = await import("../../src/model/governor-v03/governor");
  return stepGovernorV03(input);
}

describe("F2-G2 staged 30 Hz governor", () => {
  it("runs exact stages 0-9 with preliminary/final caps and one electrical dispatch", async () => {
    const { input } = fixture("T22");
    input.state = { ...input.state, electricalChargeJ: 0 };
    const result = await step(input);
    expect(result.trace.stages).toEqual(["0", "1", "2", "3", "4", "5Q", "6", "7", "8", "9"]);
    expect(result.trace.electricalDispatchCount).toBe(1);
    expect(result.trace.allocatorCalls.some(call => call.pass === "preliminary")).toBe(true);
    expect(result.trace.allocatorCalls.some(call => call.pass === "final")).toBe(true);
    expect(result.packages.find(item => item.moduleId === "cooler")?.usefulOutputJ ?? 0).toBe(0);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "power-limited" }));
  });

  it("T20 accepts Quiet heat debt into a finite bank without a hot fallback", async () => {
    const { input } = fixture("T20");
    const result = await step(input);
    expect(result.state.effectiveMode).toBe("Quiet");
    expect(result.state.bufferEnergyJByBank[0].energyJ).toBeGreaterThan(0);
    expect(result.packages.some(item => item.moduleId === "cooler")).toBe(false);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "quiet-hot-path-forbidden" }));
  });

  it("T21 keeps uncovered Quiet heat in the ship when the bank is full", async () => {
    const open = fixture("T20");
    const full = fixture("T21");
    const [accepted, uncovered] = await Promise.all([step(open.input), step(full.input)]);
    expect(uncovered.state.bufferEnergyJByBank[0].energyJ).toBe(10_000);
    expect(uncovered.state.shipEnergyJ).toBeGreaterThan(accepted.state.shipEnergyJ);
  });

  it("T22 uses only the explicitly cold H2 path in Quiet", async () => {
    const { input } = fixture("T22");
    const result = await step(input);
    const cooler = result.packages.find(item => item.moduleId === "cooler");
    expect(result.state.effectiveMode).toBe("Quiet");
    expect(cooler?.usefulOutputJ).toBeGreaterThan(0);
    expect(cooler?.resourceKg[0].massKg).toBeGreaterThan(0);
  });

  it("T23 stops only the cooler at its own critical boundary", async () => {
    const { input } = fixture("T23");
    const result = await step(input);
    expect(result.packages.some(item => item.moduleId === "cooler")).toBe(false);
    expect(result.state.moduleStateById).toContainEqual(expect.objectContaining({ id: "cooler", thermalStopped: true }));
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "critical-hot-stop" }));
  });

  it("T24 permits a Quiet emergency generator only for an allowed deficit and never charges storage", async () => {
    const { input } = fixture("T24");
    const result = await step(input);
    expect(result.state.electricalChargeJ).toBeLessThanOrEqual(input.state.electricalChargeJ);
    expect(result.packages.some(item => item.moduleId === "generator" && item.usefulOutputJ > 0)).toBe(false);
    expect(result.state.resourceMassKg.find(item => item.id === "h2")?.massKg).toBe(1);
  });

  it("T25 exits Quiet to Normal without erasing the persisted Quiet checkpoint", async () => {
    const { input } = fixture("T25");
    const result = await step(input);
    expect(result.state.effectiveMode).toBe("Normal");
    expect(result.state.quietEntryTemperatureK).toBe(500);
    expect(result.state.quietHoldTemperatureK).toBe(500);
  });

  it("T26 keeps Military modules available through their individual Combat hot bands", async () => {
    const { input } = fixture("T26");
    const result = await step(input);
    expect(result.state.effectiveMode).toBe("Combat");
    expect(result.packages.filter(item => ["cooler", "payload"].includes(item.moduleId)).map(item => item.moduleId)).toEqual(["cooler", "payload"]);
  });

  it("T27 refuses an unauthorized hull mode with a typed reason", async () => {
    const { input } = fixture("T27");
    const result = await step(input);
    expect(result.state.effectiveMode).toBe("Normal");
    expect(result.decisions).toContainEqual(expect.objectContaining({ reason: "mode-not-permitted" }));
  });

  it("T28 exposes incompatible equipment bands instead of inventing a common target", async () => {
    const { input } = fixture("T28");
    const result = await step(input);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "high-temp-only", reason: "incompatible-thermal-bands" }));
  });

  it("T32 records every outward TI joule under one physical owner", async () => {
    const { input } = fixture("T32");
    const result = await step(input);
    const ti = result.packages.find(item => item.moduleId === "ti-module");
    expect(ti?.pickupShipJ).toBeGreaterThan(0);
    expect(ti?.outward[0].energyJ).toBeGreaterThan(ti?.pickupShipJ ?? Infinity);
    expect(new Set(result.ledger.outward.map(item => item.id)).size).toBe(result.ledger.outward.length);
  });

  it("T34 runs with no water propulsion, local steam state, or special reserve", async () => {
    const { input } = fixture("T34");
    const result = await step(input);
    expect(result.state.waterEnthalpyJByTank).toEqual([]);
    expect(result.state.bufferEnergyJByBank).toEqual([]);
    expect(result.packages).toEqual([]);
  });

  it("T38 keeps propulsion and generator H2 reservations unavailable to the cooler this tick", async () => {
    const { input } = fixture("T38");
    const result = await step(input);
    const cooler = result.packages.find(item => item.moduleId === "cooler");
    expect(cooler?.resourceKg.find(item => item.id === "h2")?.massKg ?? 0).toBeLessThanOrEqual(0.1 + 1e-12);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "resource-reserved" }));
  });

  it("refuses a malformed profile atomically before the tick", async () => {
    const { input } = fixture("T20");
    (input.profile.modules[0].capW as { value: number }).value = Number.NaN;
    const before = structuredClone(input);
    const { GovernorTickRefusalError, stepGovernorV03 } = await import("../../src/model/governor-v03/governor");
    expect(() => stepGovernorV03(input)).toThrow(GovernorTickRefusalError);
    expect(input).toEqual(before);
  });
});
