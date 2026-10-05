import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { validateFit } from "../../src/fitting/validate";
import { compileFit } from "../../src/fitting/compile";
const c = loadCandidateCatalog();
it("S2 has two slots while builtin Pony permits three total; M3 and L3+hold", () => {
  for (const id of ["sputnik:2", "pony:3", "industrial-M:3", "industrial-L:3"])
    expect(compileFit(getPresetFit(id), c).ok).toBe(true);
  const f = getPresetFit("sputnik:2");
  f.instances.extra = { id: "extra", itemId: "mining-civil-S", enabled: true };
  f.assignments["payload-3"] = "extra";
  expect(
    validateFit(f, c).issues.some((e) => e.path === "assignments.payload-3"),
  ).toBe(true);
});
it("one item per slot, smaller fit and single/pair must be respected", () => {
  const f = getPresetFit("sputnik");
  expect(validateFit(f, c).valid).toBe(true);
  f.instances[f.assignments.march].itemId = "engine-diesel-S-pair";
  expect(validateFit(f, c).issues.some((e) => e.code === "FORM_FACTOR")).toBe(
    true,
  );
  f.instances[f.assignments.march].itemId = "engine-diesel-M-single";
  expect(validateFit(f, c).issues.some((e) => e.code === "SIZE")).toBe(true);
});
it("builtins cannot be removed or replaced; repeated IDs do not share state", () => {
  const f = getPresetFit("pony:3");
  f.assignments["builtin:laser"] = f.assignments["payload-1"];
  expect(validateFit(f, c).valid).toBe(false);
  delete f.assignments["builtin:laser"];
  f.assignments["payload-2"] = f.assignments["payload-1"];
  expect(validateFit(f, c).issues.some((e) => e.code === "DUPLICATE_ID")).toBe(
    true,
  );
});
it("all four powered propulsion roles homogeneous; utility H2 requires real tank", () => {
  const f = getPresetFit("industrial-M");
  f.instances[f.assignments.retro].itemId = "engine-hydrogen-S-single";
  expect(
    validateFit(f, c).issues.some((e) => e.code === "PROPULSION_TYPE"),
  ).toBe(true);
  f.instances[f.assignments.retro].itemId = "engine-diesel-S-single";
  f.instances.cooler = { id: "cooler", itemId: "h2-cooler-S", enabled: true };
  f.assignments["signature-3"] = "cooler";
  expect(validateFit(f, c).readiness.canRun).toBe(false);
  f.instances.tank = { id: "tank", itemId: "tank-hydrogen-S", enabled: true };
  f.assignments["power-4"] = "tank";
  expect(validateFit(f, c).readiness.canRun).toBe(true);
});
it("E and A accept no fuel; XL reactor cannot mount in L; XXL inactive", () => {
  for (const arch of ["E", "A"] as const) {
    const copy = structuredClone(c);
    copy.hulls.find((h) => h.id === "industrial-L")!.architecture = arch;
    expect(
      validateFit(getPresetFit("industrial-L"), copy).issues.some(
        (e) => e.code === "ARCHITECTURE",
      ),
    ).toBe(true);
  }
  const f = getPresetFit("industrial-L");
  f.localVariants.reactor = {
    ...c.items["generator-diesel-M"],
    id: "reactor",
    size: "XL",
  };
  f.instances[f.assignments["power-2"]].itemId = "reactor";
  expect(validateFit(f, c).issues.some((e) => e.code === "SIZE")).toBe(true);
  f.localVariants.reactor.size = "XXL";
  expect(validateFit(f, c).issues.some((e) => e.code === "INACTIVE_SIZE")).toBe(
    true,
  );
});
it("generator optional, battery mandatory, zero stock warning; draft can be saved", () => {
  const f = getPresetFit("sputnik");
  delete f.instances[f.assignments["power-2"]];
  delete f.assignments["power-2"];
  expect(validateFit(f, c).readiness.canRun).toBe(true);
  f.initial.chargeFraction = 0;
  f.initial.fuelFraction.diesel = 0;
  expect(validateFit(f, c).readiness.resourceWarnings.length).toBeGreaterThan(
    0,
  );
  expect(validateFit(f, c).readiness.canRun).toBe(true);
  delete f.instances[f.assignments["power-1"]];
  delete f.assignments["power-1"];
  expect(validateFit(f, c).valid).toBe(true);
  expect(validateFit(f, c).readiness.canRun).toBe(false);
});
