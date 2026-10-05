import { describe, it, expect } from "vitest";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import { createRun, runChunk, result } from "../../src/runner/run";
const catalog = loadCandidateCatalog();
const workspace = () => new FittingWorkspace(getPresetFit("pony:1"), catalog);
function complete(w: FittingWorkspace) {
  w.setConditions({ ...w.getSelected().conditions, durationSeconds: 12 });
  const a = w.start("run1");
  if (!a.ok) throw Error("fixture");
  const r = createRun(a.value.runId, a.value.spec);
  while (!r.done) runChunk(r, 20000);
  const x = result(r);
  w.acceptResult(x);
  return x;
}
describe("UI workspace ownership and atomic transactions", () => {
  it("variants isolate applied edits and discard no committed state on selection", () => {
    const w = workspace();
    const a = w.getFit();
    w.select("B");
    const b = w.getFit();
    b.initial.chargeFraction = 0.25;
    expect(w.applyFit(b).valid).toBe(true);
    w.select("A");
    expect(w.getFit()).toEqual(a);
    w.select("B");
    expect(w.getFit().initial.chargeFraction).toBe(0.25);
    expect(w.getFit().fitRevision).toBe(b.fitRevision + 1);
  });
  it("copy creates an independent named variant without a measurement", () => {
    const w = workspace();
    complete(w);
    const id = w.copyVariant();
    expect(w.selectedId).toBe(id);
    expect(w.getSelected().result).toBeUndefined();
    expect(w.getFit().hullId).toBe("pony");
    w.select("A");
    expect(w.getSelected().result?.status).toBe("complete");
  });
  it("invalid multi-slot transaction preserves fit, revision, result and frozen A", () => {
    const w = workspace();
    complete(w);
    w.freeze();
    const before = w.snapshot();
    const fit = w.getFit();
    fit.assignments["payload-1"] = "bad";
    fit.instances.bad = {
      id: "bad",
      itemId: "engine-diesel-S-single",
      enabled: true,
    };
    expect(w.applyFit(fit).valid).toBe(false);
    expect(w.snapshot()).toEqual(before);
  });
  it("mandatory removal commits once but blocks start through owner readiness", () => {
    const w = workspace();
    const fit = w.getFit();
    delete fit.instances[fit.assignments.march];
    delete fit.assignments.march;
    expect(w.applyFit(fit).valid).toBe(true);
    expect(w.start("bad").ok).toBe(false);
    expect(w.getFit().fitRevision).toBe(fit.fitRevision + 1);
  });
  it("running variant switch retains owner and prevents a second start; fit edits do not mutate RunSpec", () => {
    const w = workspace();
    const first = w.start("first");
    expect(first.ok).toBe(true);
    const before = w.getActive();
    w.select("B");
    expect(w.start("second").ok).toBe(false);
    const f = w.getFit();
    f.initial.chargeFraction = 0.2;
    w.applyFit(f);
    expect(w.getActive()).toEqual(before);
    expect(w.getActive()?.variantId).toBe("A");
  });
  it("old run results cannot overwrite active or selected variant measurements", () => {
    const w = workspace();
    const a = w.start("first");
    if (!a.ok) throw Error();
    const r = createRun("old", a.value.spec);
    runChunk(r, 1);
    expect(w.acceptResult(result(r))).toBe(false);
    expect(w.getSelected().result).toBeUndefined();
    w.select("B");
    const rr = createRun("first", a.value.spec);
    runChunk(rr, 1);
    expect(w.acceptResult(result(rr, "cancelled"))).toBe(true);
    expect(w.getSelected().result).toBeUndefined();
    w.select("A");
    expect(w.getSelected().result?.runId).toBe("first");
  });
  it("own prior measurement becomes stale after edit; reset does not mutate frozen A", () => {
    const w = workspace();
    complete(w);
    w.freeze();
    const frozen = w.getFrozen();
    const f = w.getFit();
    f.initial.chargeFraction = 0.5;
    w.applyFit(f);
    expect(w.isStale()).toBe(true);
    w.reset();
    expect(w.getFrozen()).toEqual(frozen);
    expect(w.getSelected().result).toBeUndefined();
  });
  it("malformed and unsupported numeric imports preserve active snapshot and all last valid state", () => {
    const w = workspace();
    w.start("active");
    const before = w.snapshot();
    for (const text of [
      "{",
      '{"schemaVersion":"unknown"}',
      JSON.stringify({
        ...w.getFit(),
        initial: { chargeFraction: 2, fuelFraction: { diesel: 1 } },
      }),
    ]) {
      expect(w.importDocument(text).ok).toBe(false);
      expect(w.snapshot()).toEqual(before);
    }
  });
});
