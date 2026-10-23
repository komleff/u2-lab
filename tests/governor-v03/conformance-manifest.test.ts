import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadGovernorConformanceV1 } from "../../src/model/governor-v03/conformance";

const read = (file: string) => JSON.parse(readFileSync(new URL(`../fixtures/f2-governor/${file}`, import.meta.url), "utf8"));
const bundle = () => ({ manifest: read("manifest.json"), vectors: read("vectors.json") });
function refusal(mutator: (data: ReturnType<typeof bundle>) => void, code: string) {
  const data = bundle(); mutator(data); const before = structuredClone(data);
  const result = loadGovernorConformanceV1(data.manifest, data.vectors);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors).toContainEqual(expect.objectContaining({ code }));
  expect(data).toEqual(before);
}
function malformedRefusal(mutator: (data: ReturnType<typeof bundle>) => void, path: string, code: string) {
  const data = bundle(); mutator(data); const before = structuredClone(data);
  let result: ReturnType<typeof loadGovernorConformanceV1> | undefined;
  expect(() => { result = loadGovernorConformanceV1(data.manifest, data.vectors); }).not.toThrow();
  expect(result).toBeDefined();
  if (!result) return;
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.map(({ path: errorPath, code: errorCode }) => ({ path: errorPath, code: errorCode }))).toEqual([{ path, code }]);
  expect(data).toEqual(before);
}
describe("G0 conformance inventory gate", () => {
  it("loads every exact T01–T39 once without claiming future execution", () => {
    const data = bundle(); const result = loadGovernorConformanceV1(data.manifest, data.vectors);
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    expect(result.ok).toBe(true);
    expect(result.value.records.map(row => row.id)).toEqual(Array.from({ length: 39 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`));
    expect(result.value.records.filter(row => row.status === "PASS")).toHaveLength(0);
    expect(result.value.records.filter(row => row.scope === "OUT").map(row => row.id)).toEqual(["T35", "T36"]);
    expect(result.value.records.find(row => row.id === "T16")?.scope).toBe("IN");
  });
  it("preserves the concrete T07 allocation and T37 TI accounting expectations", () => {
    const data = bundle(); const r = loadGovernorConformanceV1(data.manifest, data.vectors);
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.value.records.find(row => row.id === "T07")?.expected.filter(e => e.kind === "output").map(e => e.value)).toEqual([200000, 400000, 400000]);
    expect(r.value.records.find(row => row.id === "T37")?.expected.filter(e => e.kind === "output").map(e => e.value)).toEqual([1000000, 500000, 1500000]);
  });
  it("binds T38 shared H2 reserve and T39 allocator bound to explicit expectations", () => {
    const data = bundle(); const r = loadGovernorConformanceV1(data.manifest, data.vectors);
    expect(r.ok).toBe(true); if (!r.ok) return;
    const t38 = r.value.records.find(row => row.id === "T38");
    expect(t38?.expected).toContainEqual(expect.objectContaining({ metric: "coolerConsumedKg", operator: "lte", value: 0.1, unit: "kg", tolerance: "mass" }));
    const t39 = r.value.records.find(row => row.id === "T39");
    expect(t39?.expected.map(x => x.metric)).toEqual(["allocatorBound", "constrainedBankFirst"]);
  });
  it("binds representative T scenarios to their physical starting conditions", () => {
    const data = bundle();
    const byId = (id: string) => data.vectors.vectors.find((v: any) => v.id === `vector-${id}`).input;
    const profile = (id: string) => data.vectors.profiles.find((p: any) => p.id === byId(id).profileId);
    expect(profile("T02").banks).toHaveLength(0);
    expect(profile("T06").banks[0].outputW.value).toBe(20_000_000);
    expect(profile("T06").modules).toHaveLength(4);
    expect(byId("T09").state.shipEnergyJ / profile("T09").ship.heatCapacityJPerK.value).toBeLessThanOrEqual(300);
    expect(byId("T11").environment.temperatureK).toBeGreaterThanOrEqual(byId("T11").state.shipEnergyJ / profile("T11").ship.heatCapacityJPerK.value);
    expect(byId("T14").state.shipEnergyJ / profile("T14").ship.heatCapacityJPerK.value).toBeLessThan(profile("T14").modes.coldOnK.value);
    expect(byId("T20").environment.externalHeatingW).toBeGreaterThan(0);
    expect(profile("T26").modules.length).toBeGreaterThan(0);
    expect(profile("T39").banks.length).toBeGreaterThan(1);
  });
  it("T11 starts with deployed passive and active surfaces so hot-environment closure is observable", () => {
    const data = bundle();
    const input = data.vectors.vectors.find((v: any) => v.id === "vector-T11").input;
    const profile = data.vectors.profiles.find((p: any) => p.id === input.profileId);
    const active = profile.surfaces.find((s: any) => s.kind === "active");
    const passive = profile.surfaces.find((s: any) => s.kind === "passive");
    expect(profile.thermoinverters).toHaveLength(0);
    expect(profile.modules.find((m: any) => m.id === active?.moduleId)?.kind).toBe("active-radiator");
    expect(active?.thermoinverterId).toBeNull();
    expect(input.state.surfaceDeploymentById.find((s: any) => s.id === active.id)?.deployed).toBe(true);
    expect(input.state.surfaceDeploymentById.find((s: any) => s.id === passive?.id)?.deployed).toBe(true);
    expect(input.environment.temperatureK).toBeGreaterThanOrEqual(input.state.shipEnergyJ / profile.ship.heatCapacityJPerK.value);
    expect(data.manifest.records.find((r: any) => r.id === "T11")?.expected.map((e: any) => e.metric)).toEqual(["activeClosedInHotEnvironment", "passiveExchangeSigned"]);
  });
  it("T13 has generator-fed TI work with beta-source one and preserved fuel losses", () => {
    const data = bundle();
    const input = data.vectors.vectors.find((v: any) => v.id === "vector-T13").input;
    const profile = data.vectors.profiles.find((p: any) => p.id === input.profileId);
    const ti = profile.modules.find((m: any) => m.kind === "thermoinverter");
    const source = profile.electrical.sources[0];
    expect(input.requests.find((r: any) => r.id === ti.id)?.requestedW).toBe(1_000_000);
    expect(ti.electricJPerJ.value).toBe(2);
    expect(source.hostHeatFraction.value / source.efficiency.value).toBe(1);
    expect(source.maxOutputW.value).toBeGreaterThanOrEqual(2_000_000);
    expect(profile.modules.find((m: any) => m.id === source.moduleId)?.kind).toBe("generator");
    expect(profile.resources.find((r: any) => r.id === source.resourceId)?.species).toBe("diesel");
    expect(input.state.resourceMassKg.find((r: any) => r.id === source.resourceId)?.massKg).toBeGreaterThan(0);
    expect(data.manifest.records.find((r: any) => r.id === "T13")?.expected.map((e: any) => e.metric)).toContain("generatorLossesPreserved");
  });
  it("T26 places different Military module classes in the hot Combat override band", () => {
    const data = bundle();
    const input = data.vectors.vectors.find((v: any) => v.id === "vector-T26").input;
    const profile = data.vectors.profiles.find((p: any) => p.id === input.profileId);
    const shipK = input.state.shipEnergyJ / profile.ship.heatCapacityJPerK.value;
    expect(profile.ship.class).toBe("Military");
    expect(input.requestedMode).toBe("Combat");
    expect(new Set(profile.modules.map((m: any) => m.kind)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(profile.modules.map((m: any) => m.temperatures.criticalHighK.value)).size).toBeGreaterThanOrEqual(2);
    for (const module of profile.modules) {
      expect(shipK).toBeGreaterThan(module.temperatures.workHighK.value);
      expect(shipK).toBeLessThan(module.temperatures.criticalHighK.value);
    }
  });
  it("starts bank allocation with a usable hot bank and a colder ship", () => {
    const data = bundle();
    for (const id of ["T06", "T07", "T39"]) {
      const input = data.vectors.vectors.find((v: any) => v.id === `vector-${id}`).input;
      const p = data.vectors.profiles.find((x: any) => x.id === input.profileId);
      expect(input.state.shipEnergyJ / p.ship.heatCapacityJPerK.value).toBeLessThan(300);
      expect(input.state.bufferEnergyJByBank.every((b: any) => b.energyJ === p.banks.find((x: any) => x.id === b.id).capacityJ.value)).toBe(true);
    }
  });
  it("binds Quiet and shared resource cases to the equipment they exercise", () => {
    const data = bundle();
    const input = (id: string) => data.vectors.vectors.find((v: any) => v.id === `vector-${id}`).input;
    const p = (id: string) => data.vectors.profiles.find((x: any) => x.id === input(id).profileId);
    expect(p("T20").banks[0].inputW.value).toBeGreaterThanOrEqual(input("T20").environment.externalHeatingW);
    expect(p("T22").hydrogenCoolers[0].mode).toBe("cold");
    expect(p("T24").electrical.sources.length).toBeGreaterThan(0);
    expect(p("T28").modules.length).toBeGreaterThan(1);
    expect(p("T38").electrical.sources[0].resourceId).toBe("h2");
    expect(p("T38").modules.filter((m: any) => m.resourceId === "h2").length).toBeGreaterThan(1);
  });
  it("binds T14 heating, T31 rebind and T33 reference runs to explicit inputs", () => {
    const data = bundle();
    const input = (id: string) => data.vectors.vectors.find((v: any) => v.id === `vector-${id}`).input;
    const profile = (id: string) => data.vectors.profiles.find((p: any) => p.id === input(id).profileId);
    expect(profile("T14").modules.some((m: any) => m.kind === "heater")).toBe(true);
    expect(data.vectors.profiles.some((p: any) => p.id === input("T31").rebindProfileId)).toBe(true);
    expect(input("T31").events.some((e: any) => e.kind === "rebind")).toBe(true);
    for (const trajectory of input("T33").reference.trajectories) {
      const referenced = data.vectors.vectors.find((v: any) => v.id === trajectory.vectorId);
      expect(referenced?.input.durationTicks).toBe(trajectory.durationSeconds * 30);
    }
  });
  it("T33 exhaustion and threshold references have enough physical budget to reach their named events", () => {
    const data = bundle();
    const vector = (id: string) => data.vectors.vectors.find((v: any) => v.id === `vector-${id}`).input;
    const profile = (id: string) => data.vectors.profiles.find((p: any) => p.id === vector(id).profileId);
    const exhaustion = vector("T08"), resource = exhaustion.state.resourceMassKg.find((r: any) => r.id === "h2");
    const cooler = profile("T08").modules.find((m: any) => m.id === "cooler");
    const request = exhaustion.requests.find((r: any) => r.id === "cooler");
    expect(request.requestedW * 120 * cooler.massKgPerJ.value).toBeGreaterThanOrEqual(resource.massKg);
    const crossing = vector("T30"), threshold = profile("T30").ship.temperatures.restartHotK.value;
    const requiredJ = (crossing.state.shipEnergyJ / profile("T30").ship.heatCapacityJPerK.value - threshold) * profile("T30").ship.heatCapacityJPerK.value;
    expect(crossing.environment.externalCoolingW * 30).toBeGreaterThanOrEqual(requiredJ);
  });
  it("refuses a T33 exhaustion reference whose maximum resource draw cannot empty its tank", () => {
    refusal(d => { d.vectors.vectors.find((v: any) => v.id === "vector-T08").input.requests[0].requestedW = 1; }, "INVALID_EXPECTATION");
  });
  it("refuses a T33 threshold reference whose declared cooling cannot reach restartHot", () => {
    refusal(d => { d.vectors.vectors.find((v: any) => v.id === "vector-T30").input.environment.externalCoolingW = 0; }, "INVALID_EXPECTATION");
  });
  it("returns canonical order after input permutations", () => { const data = bundle(); data.manifest.records.reverse(); data.vectors.vectors.reverse(); const r = loadGovernorConformanceV1(data.manifest, data.vectors); expect(r.ok).toBe(true); if (r.ok) expect(r.value.records[0].id).toBe("T01"); });
  it("refuses unknown T-IDs", () => { refusal(d => { d.manifest.records[0].id = "T40"; }, "UNKNOWN_T_ID"); });
  it("refuses missing T-IDs", () => { refusal(d => { d.manifest.records.pop(); }, "MISSING_T_ID"); });
  it("refuses duplicate T-IDs", () => { refusal(d => { d.manifest.records.push(structuredClone(d.manifest.records[0])); }, "DUPLICATE_ID"); });
  it("refuses a dangling vector reference", () => { refusal(d => { d.manifest.records[0].vectorId = "missing"; }, "DANGLING_REFERENCE"); });
  it("refuses duplicate vector IDs", () => { refusal(d => { d.vectors.vectors.push(structuredClone(d.vectors.vectors[0])); }, "DUPLICATE_ID"); });
  it("refuses source drift in a record", () => { refusal(d => { d.manifest.records[0].sourceCommit = "0".repeat(40); }, "SOURCE_MISMATCH"); });
  it("refuses source drift in a vector", () => { refusal(d => { d.vectors.vectors[0].sourceSha256 = "0".repeat(64); }, "SOURCE_MISMATCH"); });
  it.each(["PASS-ish", "PENDING"])("refuses unknown status %s", status => { refusal(d => { d.manifest.records[0].status = status; }, "UNKNOWN_STATUS"); });
  it("refuses unknown units", () => { refusal(d => { d.manifest.records[0].units.push("MW"); }, "INVALID_UNIT"); });
  it("refuses an unknown future owner", () => { refusal(d => { d.manifest.records[0].owner = { item: "F2-G9", path: "tests/future.test.ts" }; }, "UNKNOWN_OWNER"); });
  it("refuses a numerical expectation without tolerance", () => { refusal(d => { delete d.manifest.records[6].expected[0].tolerance; }, "MISSING_TOLERANCE"); });
  it("refuses an invariant without tolerance", () => { refusal(d => { delete d.manifest.records[0].expected[0].tolerance; }, "MISSING_TOLERANCE"); });
  it("refuses a tolerance with incompatible units", () => { refusal(d => { d.manifest.records[6].expected[0].tolerance = "mass"; }, "INVALID_TOLERANCE"); });
  it("refuses unknown expectations", () => { refusal(d => { d.manifest.records[0].expected[0].metric = "free-energy"; }, "INVALID_EXPECTATION"); });
  it("refuses an expectation addressed to an absent physical owner", () => { refusal(d => { d.manifest.records[6].expected[0].targetId = "missing-module"; }, "DANGLING_REFERENCE"); });
  it("requires the four reference trajectories for T33", () => { refusal(d => { d.vectors.vectors[32].input.reference = null; }, "INVALID_EXPECTATION"); });
  it("refuses a T31 destination profile that is absent", () => { refusal(d => { d.vectors.vectors[30].input.rebindProfileId = "missing-profile"; }, "DANGLING_REFERENCE"); });
  it("refuses a dangling T33 reference trajectory", () => { refusal(d => { d.vectors.vectors[32].input.reference.trajectories[0].vectorId = "missing-vector"; }, "DANGLING_REFERENCE"); });
  it("refuses malformed vector input", () => { refusal(d => { d.vectors.vectors[0].input.environment.temperatureK = NaN; }, "INVALID_NUMBER"); });
  it("returns a structured refusal for null T16 state without throwing", () => {
    malformedRefusal(d => { d.vectors.vectors.find((v: any) => v.id === "vector-T16").input.state = null; }, "vectors.vector-T16.state", "INVALID_TYPE");
  });
  it("returns a structured refusal for missing T16 water enthalpy without throwing", () => {
    malformedRefusal(d => { delete d.vectors.vectors.find((v: any) => v.id === "vector-T16").input.state.waterEnthalpyJByTank; }, "vectors.vector-T16.state.waterEnthalpyJByTank", "MISSING_FIELD");
  });
  it("returns a structured refusal for null T08 resource mass without throwing", () => {
    malformedRefusal(d => { d.vectors.vectors.find((v: any) => v.id === "vector-T08").input.state.resourceMassKg = null; }, "vectors.vector-T08.state.resourceMassKg", "INVALID_TYPE");
  });
  it("returns a structured refusal for null T08 requests without throwing", () => {
    malformedRefusal(d => { d.vectors.vectors.find((v: any) => v.id === "vector-T08").input.requests = null; }, "vectors.vector-T08.tick.requests", "INVALID_TYPE");
  });
  it("refuses an unsupported bundle version with an exact structured refusal", () => {
    const data = bundle(); data.manifest.version = "conformance/99";
    const result = loadGovernorConformanceV1(data.manifest, data.vectors); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "manifest.version", code: "UNKNOWN_VERSION" }]);
  });
  it("refuses an extra vector field with an exact structured refusal", () => {
    const data = bundle(); data.vectors.vectors[0].hiddenCalculation = 1;
    const result = loadGovernorConformanceV1(data.manifest, data.vectors); expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.map(({ path, code }) => ({ path, code }))).toEqual([{ path: "vectors.vectors[0].hiddenCalculation", code: "UNKNOWN_FIELD" }]);
  });
  it("refuses T35/T36 inclusion or fake execution", () => { refusal(d => { d.manifest.records[34].scope = "IN"; d.manifest.records[34].status = "PASS"; }, "OUT_OF_SCOPE"); });
  it("requires an explicit OUT reason", () => { refusal(d => { d.manifest.records[34].reason = ""; }, "MISSING_REASON"); });
  it("refuses BLOCKED without an explicit game-data dependency", () => { refusal(d => { d.manifest.records[0].status = "BLOCKED"; d.manifest.records[0].reason = ""; d.manifest.records[0].missingDependencies = []; }, "MISSING_DEPENDENCY"); });
  it("refuses synthetic PASS placeholders before a runtime receipt exists", () => { refusal(d => { d.manifest.records[0].status = "PASS"; }, "UNEXECUTED_VECTOR"); });
  it("requires T16 tank state even though water propulsion is OUT", () => { refusal(d => { const v = d.vectors.vectors.find((v: any) => v.id === d.manifest.records[15].vectorId); v.input.state.waterEnthalpyJByTank = []; }, "STATE_ID_MISMATCH"); });
  it("refuses T16 if both profile and state are replaced by a valid dry ship", () => {
    refusal(d => {
      const t16 = d.vectors.vectors.find((v: any) => v.id === "vector-T16");
      const dry = d.vectors.vectors.find((v: any) => v.id === "vector-T01");
      t16.input = structuredClone(dry.input);
    }, "INVALID_EXPECTATION");
  });
});
