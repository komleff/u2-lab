import { describe, it, expect } from "vitest";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
describe("curated catalog", () => {
  it("Pony G0 stored battery capacity cites its 9GJ usable owner rather than CivilG1 recipe", () => {
    const f = getPresetFit("pony");
    const battery = f.localVariants["pony-battery"];
    expect(battery.numerics.capacityJ).toBe(10e9);
    expect(battery.origins["numerics.capacityJ"].sourceRef).toContain(
      "gdd_survival_pony_power_buffer_balance",
    );
    expect(battery.origins["numerics.capacityJ"].derivation).toContain(
      "9e9 / 0.9",
    );
  });
  it("six_presets_and_40_items", () => {
    const c = loadCandidateCatalog("ship-fitting-0.2.0");
    expect(c.hulls).toHaveLength(6);
    expect(Object.keys(c.items)).toHaveLength(40);
    for (const h of c.hulls) {
      const f = getPresetFit(h.id);
      expect(f.hullId).toBe(h.id);
      for (const r of ["march", "retro", "strafe", "turn"])
        expect(h.slots.some((s) => s.role === r)).toBe(true);
    }
  });
  it("cargo_17_supersedes_csv", () => {
    const c = loadCandidateCatalog();
    expect(c.items["cargo-universal-S"].numerics.cargoM3).toBe(12);
    expect(
      c.items["cargo-universal-S"].materials.reduce((n, m) => n + m.massKg, 0),
    ).toBe(8945.439461);
    expect(c.items["cargo-bulk-S"].numerics.cargoM3).toBe(24);
    expect(c.items["cargo-bulk-S"].materials[0].massKg).toBe(1800);
    expect(c.items["cargo-universal-M"].numerics.cargoM3).toBe(96);
  });
  it("pony_identity_and_builtin_bill", () => {
    const h = loadCandidateCatalog().hulls.find((h) => h.id === "pony")!;
    expect(h.class).toBe("UNKNOWN");
    expect(h.generation).toBe(0);
    expect(h.slots.filter((s) => s.category === "power")).toHaveLength(3);
    expect(
      h.builtins.find((b) => b.item.family === "tank")!.item.numerics
        .fuelCapacityKg,
    ).toBe(12000);
    const cargo = h.builtins.find((b) => b.item.family === "cargo")!;
    expect(cargo.item.numerics.cargoM3).toBe(12);
    expect(cargo.item.materials[0].massKg).toBeCloseTo(3773.867608),
      expect(h.materials[0].massKg).toBe(35000);
  });
  it("no_unbounded_generation_interpolation", () => {
    const c = loadCandidateCatalog();
    for (const m of Object.values(c.items)) {
      expect(m.generationState).toBe("authored");
      expect(m.generation).toBeGreaterThanOrEqual(
        m.class === "Industrial" ? 2 : 1,
      );
      if (m.family === "generator" && m.species === "hydrogen")
        expect(m.generation).toBeGreaterThanOrEqual(3);
      for (const [key, value] of Object.entries(m.numerics)) {
        expect(Number.isFinite(value)).toBe(true);
        expect(m.origins["numerics." + key]?.unit).toBeTruthy();
      }
      for (const mat of m.materials) {
        expect(mat.massKg).toBeGreaterThan(0);
        expect(mat.cpJKgK).toBeGreaterThan(0);
        expect(mat.origin.sourceRef).toBeTruthy();
      }
    }
  });
});
