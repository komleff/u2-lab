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

  it("T22 applies both coordinates of q(T) to one atomic mass/export package", async () => {
    const makeInput = (firstTemperatureK: number, energyScale: number) => {
      const { input } = fixture("T22");
      input.profile = {
        ...input.profile,
        resources: input.profile.resources.map(resource => resource.id === "h2"
          ? { ...resource, maxFlowKgPerS: { ...resource.maxFlowKgPerS, value: 1e-7 } }
          : resource),
        hydrogenCoolers: input.profile.hydrogenCoolers.map(path => ({
          ...path,
          specificExportByTemperature: path.specificExportByTemperature.map((point, index) => ({
            ...point,
            temperatureK: index === 0 ? { ...point.temperatureK, value: firstTemperatureK } : point.temperatureK,
            specificEnergyJPerKg: { ...point.specificEnergyJPerKg, value: point.specificEnergyJPerKg.value * energyScale },
          })),
        })),
      };
      input.requests = [{ id: "cooler", requestedW: 100 }];
      return input;
    };
    const interpolateQ = (input: ReturnType<typeof makeInput>) => {
      const path = input.profile.hydrogenCoolers[0];
      const [lower, upper] = path.specificExportByTemperature;
      const temperatureK = input.state.shipEnergyJ / input.profile.ship.heatCapacityJPerK.value;
      const fraction = (temperatureK - lower.temperatureK.value) / (upper.temperatureK.value - lower.temperatureK.value);
      return lower.specificEnergyJPerKg.value
        + fraction * (upper.specificEnergyJPerKg.value - lower.specificEnergyJPerKg.value);
    };
    const baseInput = makeInput(300, 1);
    const energyInput = makeInput(300, 2);
    const temperatureInput = makeInput(200, 1);
    const [base, energyChanged, temperatureChanged] = await Promise.all([
      step(baseInput),
      step(energyInput),
      step(temperatureInput),
    ]);
    const receipt = (result: Awaited<ReturnType<typeof step>>) => {
      const pack = result.packages.find(item => item.moduleId === "cooler")!;
      return { usefulJ: pack.usefulOutputJ, massKg: pack.resourceKg[0].massKg, outwardJ: pack.outward[0].energyJ };
    };
    const baseReceipt = receipt(base);
    const energyReceipt = receipt(energyChanged);
    const temperatureReceipt = receipt(temperatureChanged);
    expect(baseReceipt.massKg * interpolateQ(baseInput)).toBeCloseTo(baseReceipt.outwardJ, 12);
    expect(energyReceipt.massKg * interpolateQ(energyInput)).toBeCloseTo(energyReceipt.outwardJ, 12);
    expect(temperatureReceipt.massKg * interpolateQ(temperatureInput)).toBeCloseTo(temperatureReceipt.outwardJ, 12);
    expect(energyReceipt.usefulJ).toBeGreaterThan(baseReceipt.usefulJ);
    expect(energyReceipt.outwardJ).toBeGreaterThan(baseReceipt.outwardJ);
    expect(temperatureReceipt.usefulJ).toBeGreaterThan(baseReceipt.usefulJ);
    expect(temperatureReceipt.outwardJ).toBeGreaterThan(baseReceipt.outwardJ);
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
    input.profile = {
      ...input.profile,
      hydrogenCoolers: input.profile.hydrogenCoolers.map(path => ({
        ...path,
        mode: "cold" as const,
        floorK: { ...path.floorK, value: 100 },
      })),
    };
    input.state = {
      ...input.state,
      shipEnergyJ: 550 * input.profile.ship.heatCapacityJPerK.value,
      electricalChargeJ: 0,
    };
    const result = await step(input);
    const cooler = result.packages.find(item => item.moduleId === "cooler")!;
    const generatedJ = result.ledger.entries
      .filter(entry => entry.ownerId === "generator-source" && entry.nodeId === "electrical")
      .reduce((sum, entry) => sum + entry.energyJ, 0);
    const chemicalJ = result.ledger.entries
      .filter(entry => entry.ownerId === "generator-source" && entry.counterpartyId === "resource:h2")
      .reduce((sum, entry) => sum + entry.energyJ, 0);
    const hostHeatJ = result.ledger.entries
      .filter(entry => entry.ownerId === "generator-source" && entry.nodeId === "ship")
      .reduce((sum, entry) => sum + entry.energyJ, 0);
    const exhaustJ = result.ledger.outward
      .filter(path => path.ownerId === "generator-source")
      .reduce((sum, path) => sum + path.energyJ, 0);
    expect(cooler.electricJ).toBeGreaterThan(0);
    expect(generatedJ).toBeCloseTo(cooler.electricJ, 12);
    expect(chemicalJ).toBeCloseTo(generatedJ + hostHeatJ + exhaustJ, 12);
    expect(result.state.electricalChargeJ).toBe(0);
    expect(Math.abs(result.ledger.energyResidualJ)).toBeLessThanOrEqual(
      1e-6 + 1e-10 * result.ledger.energyThroughputJ,
    );
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "resource-reserved" }));
  });

  it("T24 commits actual source host heat before stage 8 captures the remaining late heat", async () => {
    const { input } = fixture("T24");
    input.profile = {
      ...input.profile,
      buffers: input.profile.buffers.map(bank => ({ ...bank, compatibleModuleIds: [] })),
      banks: input.profile.banks.map(bank => ({ ...bank, compatibleModuleIds: [] })),
      modules: input.profile.modules.map(module => module.id === "cooler" ? {
        ...module,
        kind: "ordinary" as const,
        electricJPerJ: { ...module.electricJPerJ, value: 1 },
        massKgPerJ: { ...module.massKgPerJ, value: 0 },
        auxHeatJPerJ: { ...module.auxHeatJPerJ, value: 0 },
        resourceId: null,
        compatibleBankIds: [],
      } : module),
      hydrogenCoolers: [],
    };
    input.state = {
      ...input.state,
      shipEnergyJ: 400 * input.profile.ship.heatCapacityJPerK.value,
      bufferEnergyJByBank: input.state.bufferEnergyJByBank.map(bank => ({ ...bank, energyJ: 0 })),
      waterEnthalpyJByTank: input.state.waterEnthalpyJByTank.map(tank => ({ ...tank, enthalpyJ: 346_600, phase: "liquid" as const })),
      electricalChargeJ: 0,
    };
    input.environment = { temperatureK: 400, externalHeatingW: 0, externalCoolingW: 0 };
    const result = await step(input);
    const sourceHostJ = result.ledger.entries
      .filter(entry => entry.ownerId === "generator-source" && entry.nodeId === "ship")
      .reduce((sum, entry) => sum + entry.energyJ, 0);
    const capturedJ = result.state.bufferEnergyJByBank[0].energyJ - input.state.bufferEnergyJByBank[0].energyJ;
    const executionOrder = (result.trace as typeof result.trace & { executionOrder: string[] }).executionOrder;
    expect(sourceHostJ).toBeCloseTo(1 / 6, 12);
    expect(capturedJ).toBeCloseTo(sourceHostJ, 12);
    expect(result.state.shipEnergyJ).toBeCloseTo(input.state.shipEnergyJ, 9);
    expect(result.state.selectedStageIds).toContain("8");
    expect(executionOrder.indexOf("actual-source-losses")).toBeLessThan(executionOrder.indexOf("stage-8-late-capture"));
    expect(executionOrder).toEqual([
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
    expect(Math.abs(result.ledger.energyResidualJ)).toBeLessThanOrEqual(1e-6 + 1e-10 * result.ledger.energyThroughputJ);
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

  it("T07 limits all shared-bank work packages to actual canonical port allocations", async () => {
    const { input } = fixture("T07");
    const result = await step(input);
    const final = result.trace.allocatorCalls.find(call => call.pass === "final")!;
    const usefulJ = result.packages.reduce((sum, item) => sum + item.usefulOutputJ, 0);
    const packagePickupJ = result.packages.reduce(
      (sum, item) => sum + item.pickupByBank.reduce((inner, pickup) => inner + pickup.energyJ, 0),
      0,
    );
    const allocatedJ = final.allocations.reduce((sum, item) => sum + item.energyJ, 0);
    expect(input.requests.reduce((sum, request) => sum + request.requestedW, 0)).toBe(50_000_000);
    expect(input.profile.banks[0].sharedW.value / 30).toBe(1_000_000);
    expect(final.allocations).toEqual([
      { bankId: "bank-a", consumerId: "cooler-10", energyJ: 200_000 },
      { bankId: "bank-a", consumerId: "cooler-20a", energyJ: 400_000 },
      { bankId: "bank-a", consumerId: "cooler-20b", energyJ: 400_000 },
    ]);
    expect(usefulJ).toBe(1_000_000);
    expect(packagePickupJ).toBe(1_000_000);
    expect(allocatedJ).toBe(1_000_000);
    expect(result.packages.map(item => [item.moduleId, item.usefulOutputJ])).toEqual([
      ["cooler-10", 200_000],
      ["cooler-20a", 400_000],
      ["cooler-20b", 400_000],
    ]);
    expect(result.decisions).toEqual(expect.arrayContaining([
      expect.objectContaining({ moduleId: "cooler-10", reason: "shared-port-limited" }),
      expect.objectContaining({ moduleId: "cooler-20a", reason: "shared-port-limited" }),
      expect.objectContaining({ moduleId: "cooler-20b", reason: "shared-port-limited" }),
    ]));
    expect(Math.abs(result.ledger.energyResidualJ)).toBeLessThanOrEqual(1e-6 + 1e-10 * result.ledger.energyThroughputJ);
  });

  it("T38 keeps propulsion and generator H2 reservations unavailable to the cooler this tick", async () => {
    const { input } = fixture("T38");
    input.profile = {
      ...input.profile,
      resources: input.profile.resources.map(resource => resource.id === "h2"
        ? { ...resource, maxFlowKgPerS: { ...resource.maxFlowKgPerS, value: 3 } }
        : resource),
    };
    input.state = { ...input.state, electricalChargeJ: 0 };
    const result = await step(input);
    const consumed = result.ledger.entries.filter(entry => entry.resourceId === "h2" && entry.massKg < 0);
    const ownerIds = consumed.map(entry => entry.ownerId);
    const totalConsumedKg = -consumed.reduce((sum, entry) => sum + entry.massKg, 0);
    const stockDeltaKg = input.state.resourceMassKg.find(resource => resource.id === "h2")!.massKg
      - result.state.resourceMassKg.find(resource => resource.id === "h2")!.massKg;
    expect(input.requests).toEqual([
      { id: "propulsion", requestedW: 30_000_000 },
      { id: "generator", requestedW: 9_000_000 },
      { id: "cooler", requestedW: 3_000_000 },
    ]);
    expect(input.profile.ship.heatCapacityJPerK.value).toBe(1_000_000_000);
    expect(input.profile.resources.find(resource => resource.id === "h2")?.maxFlowKgPerS.value).toBe(3);
    expect(input.state.electricalChargeJ).toBe(0);
    expect(result.packages.find(item => item.moduleId === "propulsion")?.resourceKg).toEqual([{ id: "h2", massKg: 0.1 }]);
    expect(ownerIds).toEqual(["module:propulsion"]);
    expect(new Set(ownerIds).size).toBe(ownerIds.length);
    expect(totalConsumedKg).toBeLessThanOrEqual(0.1 + 1e-12);
    expect(stockDeltaKg).toBeCloseTo(totalConsumedKg, 12);
    expect(result.state.resourceMassKg.every(resource => resource.massKg >= 0)).toBe(true);
    expect(Math.abs(result.ledger.energyResidualJ)).toBeLessThanOrEqual(1e-6 + 1e-10 * result.ledger.energyThroughputJ);
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "propulsion", reason: "resource-reserved" }));
    expect(result.decisions).toContainEqual(expect.objectContaining({ moduleId: "cooler", reason: "power-limited" }));
    expect(result.state.lastLimitingReasons).toEqual(expect.arrayContaining([
      { id: "propulsion", reason: "resource-reserved" },
      { id: "cooler", reason: "power-limited" },
    ]));
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
