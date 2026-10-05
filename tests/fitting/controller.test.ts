import { it, expect } from "vitest";
import { FittingSession } from "../../src/app/fitting-session";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { createRun, runChunk, result } from "../../src/runner/run";
it("edits create next revision while running numerical snapshot and frozen A do not mutate", () => {
  const s = new FittingSession(
    getPresetFit("industrial-M:2"),
    loadCandidateCatalog(),
  );
  const v = s.prepareRun({ durationSeconds: 1 });
  if (!v.ok) throw Error("missing");
  const run = createRun("A", v.value);
  while (!run.done) runChunk(run, 1000);
  s.freeze(result(run));
  const original = structuredClone(s.a);
  const f = s.getFit();
  f.instances[f.assignments["payload-1"]].enabled = false;
  expect(s.applyFit(f).valid).toBe(true);
  expect(s.getFit().fitRevision).toBe(2);
  expect(run.spec.resolvedShip.fit.fitRevision).toBe(1);
  expect(
    run.spec.resolvedShip.instances.find((i) => i.id === "fit:payload-1")!
      .enabled,
  ).toBe(true);
  expect(s.a).toEqual(original);
  expect(s.getFit().instances["fit:payload-2"].enabled).toBe(true);
});
it("failed swap preserves last valid fit and partial draft accepted but run denied", () => {
  const s = new FittingSession(getPresetFit("sputnik"), loadCandidateCatalog());
  const a = s.getFit();
  const bad = structuredClone(a);
  bad.instances[bad.assignments.march].itemId = "cargo-bulk-S";
  expect(s.applyFit(bad).valid).toBe(false);
  expect(s.getFit()).toEqual(a);
  const draft = s.getFit();
  delete draft.instances[draft.assignments.march];
  delete draft.assignments.march;
  expect(s.applyFit(draft).valid).toBe(true);
  expect(s.prepareRun().ok).toBe(false);
});
it("builtin working mode changes next snapshot without removing builtin bill or freeing a slot", () => {
  const c = loadCandidateCatalog(),
    f = getPresetFit("pony:3");
  const s = new FittingSession(f, c);
  const before = s.prepareRun();
  if (!before.ok) throw Error("missing");
  const edited = s.getFit();
  (edited as any).builtinModes = { "builtin:laser": { enabled: false } };
  expect(s.applyFit(edited).valid).toBe(true);
  const after = s.prepareRun();
  if (!after.ok) throw Error("missing");
  expect(
    after.value.resolvedShip.instances.find((i) => i.id === "builtin:laser")!
      .enabled,
  ).toBe(false);
  expect(after.value.resolvedShip.dryMassKg).toBe(
    before.value.resolvedShip.dryMassKg,
  );
  expect(after.value.selectedWorkGroup).toContain("builtin:laser");
  expect(Object.keys(after.value.resolvedShip.fit.assignments)).toEqual(
    Object.keys(f.assignments),
  );
});
