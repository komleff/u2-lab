import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
const c = loadCandidateCatalog();
it("swap rebuilds dry mass and C once, contents add neither dry mass nor C", () => {
  const f = getPresetFit("industrial-M:2");
  const a = compileFit(f, c);
  expect(a.ok).toBe(true);
  if (!a.ok) return;
  f.instances[f.assignments["payload-2"]].itemId = "cargo-bulk-S";
  const b = compileFit(f, c);
  expect(b.ok).toBe(true);
  if (!b.ok) return;
  expect(b.value.dryMassKg - a.value.dryMassKg).toBeCloseTo(-400, 8);
  expect(b.value.heatCapacityJK - a.value.heatCapacityJK).toBeCloseTo(
    -188000,
    8,
  );
  expect(b.value.cargoCapacityM3.bulk).toBe(24);
  f.initial.fuelFraction.diesel = 0;
  const d = compileFit(f, c);
  if (d.ok) expect(d.value.heatCapacityJK).toBe(b.value.heatCapacityJK);
});
it("builtin cargo contributes distinct nonzero bill; duplicate laser instances independently counted", () => {
  const a = compileFit(getPresetFit("pony:1"), c),
    b = compileFit(getPresetFit("pony:3"), c);
  if (!a.ok || !b.ok) throw Error("not ready");
  expect(b.value.dryMassKg - a.value.dryMassKg).toBe(4400);
  expect(
    a.value.materials.filter((m) => m.id.startsWith("builtin:cargo")),
  ).toHaveLength(1);
  expect(
    a.value.materials.find((m) => m.id.startsWith("builtin:cargo"))!.massKg,
  ).toBeCloseTo(3773.867608);
});
