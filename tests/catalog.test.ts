import { describe, it, expect } from "vitest";
import { presets } from "../src/catalog/presets";
import { validateRunSpec } from "../src/catalog/schema";
describe("versioned SI experiments", () => {
  it("compiles both sourced experimental presets and preserves tiny constants", () => {
    for (const p of presets) {
      expect(validateRunSpec(p).ok).toBe(true);
      expect(p.ship.modules.find((m) => m.kind === "engine")!.alpha).toBe(
        5.65e-7,
      );
      expect(p.approvedBaseline).toBe(false);
    }
    expect(presets[0].ship.accumulators[0].capacityJ).toBe(3.6825e9);
  });
  it.each(["stepSeconds", "durationSeconds"])(
    "rejects zero %s before running",
    (key) => {
      const p = structuredClone(presets[0]);
      (p as any)[key] = 0;
      expect(validateRunSpec(p).ok).toBe(false);
    },
  );
  it("rejects negative/nonfinite/missing provenance/overfill/species/duplicate environment inputs", () => {
    for (const mutate of [
      (p: any) => (p.initial.temperatureK = -1),
      (p: any) => (p.ship.heatCapacityJK = Infinity),
      (p: any) => delete p.origins["ship.heatCapacityJK"],
      (p: any) => (p.initial.chargeJ = 1e20),
      (p: any) => (p.ship.modules[0].tankId = "missing"),
      (p: any) =>
        (p.environment.directHeat = [
          { sourceId: "sun", powerW: 10 },
          { sourceId: "sun", powerW: 20 },
        ]),
    ]) {
      const p = structuredClone(presets[0]);
      mutate(p);
      expect(validateRunSpec(p).ok).toBe(false);
    }
  });
});
it("requires SI units, supported model, finite required fields and physical denominators", () => {
  for (const mutate of [
    (p: any) => (p.units = "kWh/Celsius"),
    (p: any) => (p.modelVersion = "unknown"),
    (p: any) => delete p.initial.temperatureK,
    (p: any) => delete p.ship.modules[0].powerW,
    (p: any) => (p.ship.modules[0].efficiency = 0),
    (p: any) => (p.ship.modules[1].kind = "warp-drive"),
    (p: any) => (p.scenario.phases[0].action = "magic"),
    (p: any) => (p.ship.accumulators[0].capacityJ = "100"),
  ]) {
    const p = structuredClone(presets[0]);
    mutate(p);
    expect(validateRunSpec(p).ok).toBe(false);
  }
});
it("dry thermal bill closes once and never includes cargo/fuel contents", () => {
  for (const p of presets) {
    expect(
      p.ship.thermalMaterials.reduce(
        (n: any, x: any) => n + x.massKg * x.cpJKgK,
        0,
      ),
    ).toBeCloseTo(p.ship.heatCapacityJK, 5);
    const duplicate = structuredClone(p);
    duplicate.ship.thermalMaterials.push({
      ...duplicate.ship.thermalMaterials[0],
    });
    expect(validateRunSpec(duplicate).ok).toBe(false);
  }
});
it("rejects numeric strings, incompatible cooler species and unreferenced initial stocks", () => {
  for (const mutate of [
    (p: any) => (p.stepSeconds = "0.1"),
    (p: any) => (p.initial.fuelKg.unknown = 1),
    (p: any) => {
      p.ship.modules[0].kind = "h2";
      p.ship.modules[0].species = "diesel";
    },
  ]) {
    const p = structuredClone(presets[0]);
    mutate(p);
    expect(validateRunSpec(p).ok).toBe(false);
  }
});
import { writeFileSync } from "node:fs";
if (process.env.U2_CATALOG_OUTPUT) {
  for (const p of presets)
    writeFileSync(
      `data/catalog/${p.ship.size.toLowerCase()}-civilian.json`,
      JSON.stringify(p, null, 2) + "\n",
    );
  writeFileSync(
    "data/scenarios/mining.json",
    JSON.stringify(
      {
        schema: "u2-scenario/1",
        units: "SI",
        status: "EXPERIMENTAL",
        scenario: presets[0].scenario,
      },
      null,
      2,
    ) + "\n",
  );
}
it('rejects nonfinite summed accumulator capacity even when components are finite',()=>{const p=structuredClone(presets[0]);p.ship.accumulators=[{id:'a',capacityJ:1e308},{id:'b',capacityJ:1e308}];p.initial.chargeJ=0;p.origins['ship.accumulators.1.capacityJ']={kind:'experimental',sourceRef:'test:overflow'};expect(validateRunSpec(p).ok).toBe(false)});
