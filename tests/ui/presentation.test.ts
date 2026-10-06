import { it, expect } from "vitest";
import {
  slotLayout,
  passport,
  replacement,
} from "../../src/app/fitting-ui/presentation";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
const catalog = loadCandidateCatalog();
it("ring uses the exact removable+builtin roster and accessible fallback boundaries", () => {
  for (const hull of catalog.hulls) {
    const all = [
      ...hull.slots.map((x) => ({
        id: x.id,
        category: x.category,
        builtin: false,
      })),
      ...hull.builtins.map((x) => ({
        id: x.id,
        category: x.item.category,
        builtin: true,
      })),
    ];
    const layout = slotLayout(all, 440);
    expect(layout.nodes.map((x) => x.id).sort()).toEqual(
      all.map((x) => x.id).sort(),
    );
    if (layout.ring) {
      expect(layout.minimumAngle).toBeGreaterThanOrEqual(18);
      expect(layout.nodes.every((x) => x.size === 44)).toBe(true);
    }
    expect(slotLayout(all, 439).ring).toBe(false);
  }
  expect(
    slotLayout(
      Array.from({ length: 21 }, (_, i) => ({
        id: String(i),
        category: "payload" as const,
        builtin: false,
      })),
      600,
    ).ring,
  ).toBe(false);
});
it("passport uses existing compile oracle for all six hulls, including typed cargo", () => {
  for (const h of catalog.hulls) {
    const f = getPresetFit(h.id + ":1");
    const compiled = compileFit(f, catalog);
    if (!compiled.ok) throw Error(h.id);
    expect(passport(f, catalog)).toMatchObject({
      dryMassKg: compiled.value.dryMassKg,
      heatCapacityJK: compiled.value.heatCapacityJK,
      cargo: compiled.value.cargoCapacityM3,
    });
  }
});
it("batch replaces only removable payload once, refuses whole-fit incompatible candidates", () => {
  const f = getPresetFit("pony:1");
  const next = replacement(f, catalog, "payload-1", "cargo-bulk-S", true);
  expect(next.builtinModes).toEqual(f.builtinModes);
  expect(
    Object.keys(next.assignments).filter((x) => x.startsWith("payload")).length,
  ).toBe(
    catalog.hulls
      .find((x) => x.id === "pony")!
      .slots.filter((x) => x.category === "payload").length,
  );
  expect(validateFit(next, catalog).valid).toBe(true);
  const bad = replacement(
    f,
    catalog,
    "payload-1",
    "engine-diesel-S-single",
    true,
  );
  expect(validateFit(bad, catalog).valid).toBe(false);
  expect(f).toEqual(getPresetFit("pony:1"));
});
