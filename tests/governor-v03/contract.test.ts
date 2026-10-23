import { describe, expect, it } from "vitest";
import {
  validateGovernorProfileV03,
  validateGovernorStateV03,
  validateGovernorTickInputV03,
  validateShipModelStateV02,
} from "../../src/model/governor-v03/schema";
import { GOVERNOR_TOLERANCES } from "../../src/model/governor-v03/tolerances";

// Все числа — синтетические входы контракта, не игровые ТТХ.
const si = (value: number, unit: string) => ({ value, unit, kind: "experimental", sourceRef: "lab:synthetic-g0/1" });
const bands = () => ({ criticalLowK: si(200, "K"), workLowK: si(250, "K"), workHighK: si(600, "K"), criticalHighK: si(700, "K"), restartColdK: si(220, "K"), restartHotK: si(680, "K") });
export function sampleProfile() {
  const characteristic = () => [{ energyJ: si(0, "J"), temperatureK: si(300, "K") }, { energyJ: si(1000, "J"), temperatureK: si(500, "K") }];
  return {
    version: "governor-profile/0.3", governorVersion: "ship-thermal-governor/0.3", id: "synthetic-g0", revision: "1",
    ship: { id: "ship", class: "Stealth", heatCapacityJPerK: si(1e6, "J/K"), temperatures: bands() },
    buffers: [{ id: "buffer-a", capacityJ: si(1000, "J"), temperatureByEnergy: characteristic(), inputW: si(10, "W"), outputW: si(10, "W"), sharedW: si(15, "W"), conductanceWPerK: si(1, "W/K"), compatibleModuleIds: ["cooler"] }],
    banks: [{ id: "bank-a", memberIds: ["buffer-a"], capacityJ: si(1000, "J"), temperatureByEnergy: characteristic(), inputW: si(10, "W"), outputW: si(10, "W"), sharedW: si(15, "W"), conductanceWPerK: si(1, "W/K"), compatibleModuleIds: ["cooler"] }],
    electrical: { storage: { capacityJ: si(10000, "J"), maxChargeW: si(100, "W"), maxDischargeW: si(100, "W") }, sources: [], loads: [{ id: "cooler-load", moduleId: "cooler", standbyW: si(0, "W"), maxInputW: si(100, "W") }] },
    resources: [{ id: "h2", species: "H2", capacityKg: si(1, "kg"), maxFlowKgPerS: si(1, "kg/s") }, { id: "water", species: "water", capacityKg: si(1, "kg"), maxFlowKgPerS: si(1, "kg/s") }],
    modules: [{ id: "cooler", kind: "h2-cooler", temperatures: bands(), requestCapW: si(100, "W"), capW: si(100, "W"), minSourceTemperatureK: si(300, "K"), electricJPerJ: si(0.1, "1"), massKgPerJ: si(1e-7, "kg/J"), auxHeatJPerJ: si(0.1, "1"), standbyHeatW: si(0, "W"), auxHeatDestination: "export", resourceId: "h2", compatibleBankIds: ["bank-a"] }],
    surfaces: [{ id: "hull", moduleId: null, kind: "hull", areaM2: si(1, "m2"), emissivity: si(0.5, "1"), closable: false, thermoinverterId: null }],
    thermoinverters: [],
    hydrogenCoolers: [{ id: "h2-path", moduleId: "cooler", resourceId: "h2", mode: "ordinary", floorK: si(300, "K"), specificExportByTemperature: [{ temperatureK: si(300, "K"), specificEnergyJPerKg: si(1e6, "J/kg") }, { temperatureK: si(700, "K"), specificEnergyJPerKg: si(3e6, "J/kg") }] }],
    waterTanks: [{ id: "water-tank", resourceId: "water", heatCapacityJPerKgK: si(4200, "J/(kg*K)"), latentHeatJPerKg: si(334000, "J/kg"), referenceTemperatureK: si(273, "K"), freezeK: si(273, "K"), protectionOnK: si(274, "K"), protectionOffK: si(276, "K"), conductanceWPerK: si(1, "W/K"), exchangeCapW: si(10, "W"), heaterCapW: si(10, "W") }],
    modes: { allowed: ["Normal", "Quiet"], normalTargetK: si(400, "K"), coldOnK: si(255, "K"), coldOffK: si(260, "K"), quietOnK: si(500, "K"), quietOffK: si(490, "K"), quietUpperK: si(550, "K"), coldMarginK: si(1, "K"), hotMarginK: si(1, "K"), separationK: si(1, "K"), vitalModuleIds: ["cooler"], vitalMinK: si(230, "K"), vitalMaxK: si(690, "K"), quietEmergencyChargeFraction: si(0.01, "1") },
    failurePolicy: { rngAlgorithm: "xorshift32/1", firstNegativePolicy: "check-on-first-negative-crossing", checkIntervalSeconds: si(1, "s"), probabilityPerCheck: si(0.1, "1"), restartPolicy: "explicit-authorization-and-hysteresis" },
    numerical: { maxTickDeltaK: si(0.1, "K"), minEnvironmentK: si(100, "K"), maxEnvironmentK: si(800, "K"), maxExternalHeatingW: si(100, "W"), maxExternalCoolingW: si(100, "W") },
  };
}
export function sampleState() {
  return {
    version: "ship-state/2", governorVersion: "ship-thermal-governor/0.3", profileId: "synthetic-g0", profileRevision: "1", tickIndex: 0,
    effectiveMode: "Normal", requestedMode: "Normal", quietEntryTemperatureK: null, quietHoldTemperatureK: null,
    modeLatches: { shipColdProtection: false, quietColdCooling: false },
    stageLatches: [], bankLatches: [{ id: "bank-a", direction: "none" }], selectedStageIds: [], previousTransitionDirection: "none",
    surfaceDeploymentById: [{ id: "hull", deployed: true }], shipEnergyJ: 400e6,
    bufferEnergyJByBank: [{ id: "bank-a", energyJ: 500 }], waterEnthalpyJByTank: [{ id: "water-tank", enthalpyJ: 0, phase: "solid" }],
    electricalChargeJ: 1000, resourceMassKg: [{ id: "h2", massKg: 1 }, { id: "water", massKg: 1 }],
    moduleStateById: [{ id: "cooler", durabilityR: 1, firstNegativeCrossing: false, emergencyExposureSeconds: 0, cooldownUntilTick: 0, restartAuthorized: true, durabilityStopped: false, thermalStopped: false, stopReasons: [] }],
    failureChecks: { emergencyExposureSeconds: 0, nextCheckIndex: 1, actualCheckCount: 0, boundaryPolicy: "accumulated-exposure" },
    rng: { algorithm: "xorshift32/1", seed: 123, state: 123 },
    cumulativeServiceInputs: { electricalJ: 0, fuelKgByResource: [{ id: "h2", massKg: 0 }, { id: "water", massKg: 0 }], repairByModule: [{ id: "cooler", durabilityDeltaR: 0 }] }, serviceReceiptSequence: 0, lastLimitingReasons: [],
  };
}
const tick = () => ({ profile: sampleProfile(), state: sampleState(), requestedMode: "Normal", requests: [{ id: "cooler", requestedW: 10 }], environment: { temperatureK: 250, externalHeatingW: 0, externalCoolingW: 0 } });
function refused(value: unknown, code: string, validator = validateGovernorProfileV03) {
  const before = structuredClone(value);
  const result = validator(value);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ code, path: expect.any(String) }));
  expect(value).toEqual(before);
}

describe("versioned governor input gate", () => {
  it("accepts an explicit synthetic SI profile without defaults or mutation", () => {
    const profile = sampleProfile();
    const before = structuredClone(profile);
    const result = validateGovernorProfileV03(profile);
    expect(result).toEqual({ ok: true, value: before });
    expect(profile).toEqual(before);
  });
  it.each(["governor-profile/0.2", "ship-fitting-ship-model-0.1", "future"])("refuses unsupported profile version %s", version => { refused({ ...sampleProfile(), version }, "UNKNOWN_VERSION"); });
  it("refuses unknown nested fields", () => { const p = sampleProfile(); Object.assign(p.banks[0], { hiddenReserveJ: 100 }); refused(p, "UNKNOWN_FIELD"); });
  it.each(["kind", "sourceRef", "unit"])("requires numeric leaf provenance %s", key => { const p = sampleProfile(); delete (p.ship.heatCapacityJPerK as any)[key]; refused(p, "MISSING_FIELD"); });
  it("refuses incompatible SI units", () => { const p = sampleProfile(); p.ship.heatCapacityJPerK.unit = "J"; refused(p, "INVALID_UNIT"); });
  it.each([NaN, Infinity, -Infinity])("refuses non-finite numeric values %s", value => { const p = sampleProfile(); p.resources[0].capacityKg.value = value; refused(p, "INVALID_NUMBER"); });
  it("refuses negative capacities", () => { const p = sampleProfile(); p.banks[0].capacityJ.value = -1; refused(p, "INVALID_NUMBER"); });
  it("refuses zero ship heat capacity", () => { const p = sampleProfile(); p.ship.heatCapacityJPerK.value = 0; refused(p, "INVALID_NUMBER"); });
  it("refuses duplicate stable IDs", () => { const p = sampleProfile(); p.modules.push(structuredClone(p.modules[0])); refused(p, "DUPLICATE_ID"); });
  it("refuses a sparse buffer list without throwing or filling the missing index", () => {
    const profile = sampleProfile(); delete profile.buffers[0];
    const before = structuredClone(profile);
    let result: ReturnType<typeof validateGovernorProfileV03> | undefined;
    expect(() => { result = validateGovernorProfileV03(profile); }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "profile.buffers[0]", code: "MISSING_FIELD" }]);
    expect(profile).toEqual(before);
    expect(0 in profile.buffers).toBe(false);
  });
  it("refuses both sparse candidate-range leaves without filling either index", () => {
    const profile = sampleProfile(); Object.assign(profile.ship.heatCapacityJPerK, { candidateRange: new Array(2) });
    const before = structuredClone(profile);
    let result: ReturnType<typeof validateGovernorProfileV03> | undefined;
    expect(() => { result = validateGovernorProfileV03(profile); }).not.toThrow();
    expect(result?.ok).toBe(false);
    if (result && !result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: "profile.ship.heatCapacityJPerK.candidateRange[0]", code: "MISSING_FIELD" },
      { path: "profile.ship.heatCapacityJPerK.candidateRange[1]", code: "MISSING_FIELD" },
    ]);
    expect(profile).toEqual(before);
    const range = (profile.ship.heatCapacityJPerK as typeof profile.ship.heatCapacityJPerK & { candidateRange: number[] }).candidateRange;
    expect(0 in range).toBe(false);
    expect(1 in range).toBe(false);
  });
  it.each(["missing-end", "descending-energy", "descending-temperature", "outside-capacity"])("refuses invalid T_B(Q): %s", scenario => {
    const p = sampleProfile(); const map = p.banks[0].temperatureByEnergy;
    if (scenario === "missing-end") map.pop();
    if (scenario === "descending-energy") map[1].energyJ.value = 0;
    if (scenario === "descending-temperature") map[1].temperatureK.value = 200;
    if (scenario === "outside-capacity") map[1].energyJ.value = 1001;
    refused(p, "INVALID_TEMPERATURE_MAP");
  });
  it("refuses thermally incompatible members of a bank", () => {
    const p = sampleProfile(); const member = structuredClone(p.buffers[0]); member.id = "buffer-b"; member.temperatureByEnergy[0].temperatureK.value = 310;
    p.buffers.push(member); p.banks[0].memberIds.push("buffer-b"); p.banks[0].capacityJ.value = 2000; p.banks[0].temperatureByEnergy[1].energyJ.value = 2000;
    const result = validateGovernorProfileV03(p); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "profile.bank-a.memberIds", code: "INCOMPATIBLE_BANK" }]);
  });
  it("refuses a bank capacity that disagrees with otherwise compatible physical members", () => {
    const p = sampleProfile(); const member = structuredClone(p.buffers[0]); member.id = "buffer-b";
    p.buffers.push(member); p.banks[0].memberIds.push("buffer-b");
    const result = validateGovernorProfileV03(p); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "profile.bank-a.capacityJ", code: "INCOMPATIBLE_BANK" }]);
  });
  it("refuses a module port without reciprocal bank compatibility", () => { const p = sampleProfile(); p.modules[0].compatibleBankIds = []; refused(p, "INCOMPATIBLE_BANK"); });
  it("refuses bank ports exceeding physical members", () => { const p = sampleProfile(); p.banks[0].outputW.value = 11; refused(p, "INCOMPATIBLE_BANK"); });
  it.each(["heaterCapW", "heatCapacityJPerKgK", "latentHeatJPerKg", "freezeK"])("requires W field %s for T16", key => { const p = sampleProfile(); delete (p.waterTanks[0] as any)[key]; refused(p, "MISSING_FIELD"); });
  it("refuses invalid thermal bands", () => { const p = sampleProfile(); p.modules[0].temperatures.workHighK.value = 701; refused(p, "INVALID_THERMAL_BANDS"); });
  it("requires experimental provenance on the numerical gate", () => { const p = sampleProfile(); p.numerical.maxTickDeltaK.kind = "canonical"; refused(p, "INVALID_PROVENANCE"); });
  it("refuses a worst-case tick that crosses the threshold-separation limit", () => { const p = sampleProfile(); p.modules[0].capW.value = 1e12; refused(p, "INADMISSIBLE_TICK"); });
  it("accepts empty optional equipment lists as an explicit bare ship", () => {
    const p = sampleProfile(); p.buffers = []; p.banks = []; p.electrical.loads = []; p.resources = []; p.modules = []; p.hydrogenCoolers = []; p.waterTanks = []; p.modes.vitalModuleIds = [];
    expect(validateGovernorProfileV03(p).ok).toBe(true);
  });
  it("accepts complete persisted state and runner state without advancing RNG", () => {
    const state = sampleState(); const before = structuredClone(state);
    expect(validateGovernorStateV03(state, sampleProfile())).toEqual({ ok: true, value: before });
    expect(validateShipModelStateV02({ modelVersion: "ship-fitting-ship-model-0.2", stateVersion: "ship-state/2", phaseIndex: 0, phaseElapsedTicks: 0, governor: state }, sampleProfile()).ok).toBe(true);
    expect(state).toEqual(before);
  });
  it("refuses legacy state instead of casting or migrating it", () => { const s = sampleState(); s.version = "ship-state/1"; const r = validateGovernorStateV03(s, sampleProfile()); expect(r.ok).toBe(false); });
  it("requires persisted W enthalpy for every tank", () => { const s = sampleState(); s.waterEnthalpyJByTank = []; expect(validateGovernorStateV03(s, sampleProfile()).ok).toBe(false); });
  it("refuses residual W enthalpy or liquid phase when the water tank is empty", () => {
    for (const water of [{ enthalpyJ: 1, phase: "solid" }, { enthalpyJ: 0, phase: "liquid" }]) {
      const state = sampleState(); state.resourceMassKg.find(x => x.id === "water")!.massKg = 0;
      Object.assign(state.waterEnthalpyJByTank[0], water);
      const result = validateGovernorStateV03(state, sampleProfile());
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ path: "state.waterEnthalpyJByTank[0]", code: "INVALID_NUMBER" }));
    }
  });
  it.each([-1_000_000_000, 1_000_000_000])("refuses W enthalpy outside the declared tank temperature envelope: %s", enthalpyJ => {
    const state = sampleState(); state.waterEnthalpyJByTank[0].enthalpyJ = enthalpyJ;
    const result = validateGovernorStateV03(state, sampleProfile());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ path: "state.waterEnthalpyJByTank[0]", code: "INVALID_NUMBER" }));
  });
  it("refuses a W phase inconsistent with its enthalpy and finite water mass", () => {
    const state = sampleState(); state.waterEnthalpyJByTank[0].enthalpyJ = 167000; state.waterEnthalpyJByTank[0].phase = "liquid";
    const result = validateGovernorStateV03(state, sampleProfile());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ path: "state.waterEnthalpyJByTank[0]", code: "INVALID_THERMAL_BANDS" }));
  });
  it("refuses W when finite profile leaves overflow their derived enthalpy envelope", () => {
    const profile = sampleProfile(); profile.resources.find(x => x.id === "water")!.capacityKg.value = 1e308;
    profile.waterTanks[0].heatCapacityJPerKgK.value = 1e308;
    const state = sampleState(); state.resourceMassKg.find(x => x.id === "water")!.massKg = 1e308;
    const result = validateGovernorStateV03(state, profile);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ path: "state.waterEnthalpyJByTank[0]", code: "INVALID_NUMBER" }));
  });
  it.each([
    [-4200, "solid"], [167000, "mixed"], [338200, "liquid"],
  ])("accepts physical W enthalpy %s J in phase %s", (enthalpyJ, phase) => {
    const state = sampleState(); state.waterEnthalpyJByTank[0].enthalpyJ = enthalpyJ as number; state.waterEnthalpyJByTank[0].phase = phase as "solid" | "mixed" | "liquid";
    expect(validateGovernorStateV03(state, sampleProfile()).ok).toBe(true);
  });
  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])("refuses unsafe tick index %s", tickIndex => { expect(validateGovernorStateV03({ ...sampleState(), tickIndex }, sampleProfile()).ok).toBe(false); });
  it("refuses persisted resource overflow without clipping", () => { const s = sampleState(); s.resourceMassKg[0].massKg = 2; expect(validateGovernorStateV03(s, sampleProfile()).ok).toBe(false); expect(s.resourceMassKg[0].massKg).toBe(2); });
  it("requires typed stop reasons", () => { const s = sampleState(); s.moduleStateById[0].stopReasons = ["unknown"] as never[]; expect(validateGovernorStateV03(s, sampleProfile()).ok).toBe(false); });
  it("validates a future tick input without stepping or reordering the caller", () => { expect(validateGovernorTickInputV03(tick()).ok).toBe(true); });
  it("refuses an unknown request ID with an exact structured refusal", () => {
    const t = tick(); t.requests[0].id = "unknown";
    const result = validateGovernorTickInputV03(t); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "tick.requests.unknown", code: "DANGLING_REFERENCE" }]);
  });
  it("refuses a non-finite environment with an exact structured refusal", () => {
    const t = tick(); t.environment.temperatureK = Infinity;
    const result = validateGovernorTickInputV03(t); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "tick.environment.temperatureK", code: "INVALID_NUMBER" }]);
  });
  it("refuses unknown model dispatch version", () => { expect(validateShipModelStateV02({ modelVersion: "ship-fitting-ship-model-0.1", stateVersion: "ship-state/2", phaseIndex: 0, phaseElapsedTicks: 0, governor: sampleState() }, sampleProfile()).ok).toBe(false); });
  it("exposes finite attributed SI conservation and convergence policy", () => {
    expect(GOVERNOR_TOLERANCES.energy.absolute).toBe(1e-6);
    expect(GOVERNOR_TOLERANCES.mass.absolute).toBe(1e-12);
    expect(GOVERNOR_TOLERANCES.temperatureConvergence.relative).toBe(0.005);
    expect(GOVERNOR_TOLERANCES.transitionTime.absolute).toBe(1 / 30);
    for (const tolerance of Object.values(GOVERNOR_TOLERANCES)) {
      expect(Number.isFinite(tolerance.absolute)).toBe(true); expect(tolerance.absolute).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(tolerance.relative)).toBe(true); expect(tolerance.relative).toBeGreaterThanOrEqual(0);
      expect(tolerance.unit.length).toBeGreaterThan(0); expect(tolerance.sourceRef).toContain("§3.6");
    }
  });
});
