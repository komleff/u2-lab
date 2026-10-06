import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import baseline from "./fixtures/catalog-0.2.1-pony-digests.json";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import * as editions from "../../src/fitting/editions";
import { validateFit } from "../../src/fitting/validate";
import { compileFit } from "../../src/fitting/compile";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun, runChunk, result } from "../../src/runner/run";
import { parseFitJson, parseExperimentJson } from "../../src/io/fitting-json";
import { parseResultJson } from "../../src/io/fitting-result";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { replacement, passport } from "../../src/app/fitting-ui/presentation";
import { shipView } from "../../src/app/fitting-ui/ship-view";
import { swapDialog } from "../../src/app/fitting-ui/swap-dialog";
import { validateRunSpecV2 } from "../../src/model/v2/step";
import type { RunSpecV2 } from "../../src/model/v2/types";
const old = "ship-fitting-0.2.1", next = "ship-fitting-0.2.2";
const wire = (x: unknown) => JSON.stringify(x, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v);
const digest = (x: unknown) => createHash("sha256").update(wire(x)).digest("hex");
const signatureSlots = (h: ReturnType<typeof loadCandidateCatalog>["hulls"][number]) => h.slots.filter(s => s.category === "signature");
describe("P01–P04 edition-specific Pony signature mount", () => {
  it("defaults to0.2.2 and preserves45 items, other hulls and every Pony field except the accepted slot/provenance", () => {
    const c = loadCandidateCatalog(), previous = loadCandidateCatalog(old);
    expect(c.version).toBe(next); expect(c.items).toEqual(previous.items); expect(Object.keys(c.items)).toHaveLength(45);
    for (const h of c.hulls) {
      const before = previous.hulls.find(x => x.id === h.id)!;
      if (h.id !== "pony") expect(h).toEqual(before);
      else {
        expect(signatureSlots(h).map(s => s.id)).toEqual(["signature-1"]);
        const { slots, origins, ...unchanged } = h;
        expect(unchanged).toEqual((({ slots, origins, ...x }) => x)(before));
        expect(slots).toEqual(before.slots.filter(s => s.id !== "signature-2"));
        for (const [k, v] of Object.entries(before.origins)) expect(origins[k]).toEqual(v);
        expect(Object.values(origins).some(o => o.sourceRef.includes("2026-10-06-pony-signature-slot"))).toBe(true);
      }
    }
    expect(signatureSlots(c.hulls.find(h => h.id === "industrial-S")!)).toHaveLength(3);
  });
  for (const n of [1, 2, 3]) it(`new Pony${n} inherits all remaining mount defaults without a second signature module`, () => {
    const current = getPresetFit("pony:" + n), previous = getPresetFit("pony:" + n, old);
    expect(current.catalogVersion).toBe(next); expect(current.assignments["signature-2"]).toBeUndefined();
    const id = previous.assignments["signature-2"]; delete previous.assignments["signature-2"]; delete previous.instances[id]; previous.catalogVersion = next;
    expect(current).toEqual(previous);
    expect(current.instances[current.assignments["signature-1"]].itemId).toBe("radiator-passive-S");
    expect(validateFit(current, loadCandidateCatalog()).readiness.canRun).toBe(true);
  });
  for (const [id, oracle] of Object.entries(baseline.rows)) it(`preserves pre-change ${id} fit/spec/zero/partial/complete bytes`, () => {
    const c = loadCandidateCatalog(), f = getPresetFit(id, old);
    expect(digest(loadCandidateCatalog(old))).toBe(baseline.catalog); expect(digest(f)).toBe(oracle.fit);
    expect(parseFitJson(wire(f), c)).toEqual({ ok: true, value: f });
    const spec = makeMiningRun(f, c, baseline.conditions); if (!spec.ok) throw Error(wire(spec));
    expect(digest(spec.value)).toBe(oracle.spec); expect(parseExperimentJson(wire(spec.value))).toEqual(spec);
    const run = createRun("old021:" + id, spec.value);
    for (const key of ["zero", "partial", "complete"] as const) {
      if (key === "partial") runChunk(run, 3); if (key === "complete") while (!run.done) runChunk(run, 100);
      const native = result(run); expect(digest(native)).toBe(oracle[key]); expect(parseResultJson(wire(native))).toEqual({ ok: true, value: native });
      const w = new FittingWorkspace(getPresetFit("sputnik"), c); expect(w.importDocument(wire(native)).ok).toBe(true); expect(w.prepare()).toEqual(spec); expect(w.getCurrentResult()).toEqual(native);
    }
  });
  for (const version of ["ship-fitting-0.2.0", old] as const) it(`keeps ${version} Pony second-slot editing and declared shape in current UI`, () => {
    const c = loadCandidateCatalog(), f = getPresetFit("pony:2", version), w = new FittingWorkspace(f, c);
    expect(shipView(w, 1440, new Set())).toContain('id="slot-signature-2"');
    const swap = swapDialog(w, { slotId: "signature-2", candidate: "radiator-passive-S", query: "", family: "all", size: "all", sort: "name", batch: false, returnId: "slot-signature-2" });
    expect(swap).toContain("signature-2"); expect(swap).toContain("Монтаж совместим");
    const edited = replacement(f, c, "signature-2", "radiator-passive-S"); expect(edited.catalogVersion).toBe(version);
    expect(w.applyFit(edited).valid).toBe(true); expect(w.prepare().ok).toBe(true);
    const compiled = compileFit(edited, c); if (!compiled.ok) throw Error("legal historical mounting");
    expect(signatureSlots(compiled.value.hull)).toHaveLength(2); expect(passport(edited, c).complete).toBe(true);
  });
  it("uses caller hull overrides for matching editions without leaking them into another edition", () => {
    const c = loadCandidateCatalog(old); c.hulls.find(h => h.id === "pony")!.hullPowerW = 123;
    const same = compileFit(getPresetFit("pony:1", old), c); if (!same.ok) throw Error("override fixture"); expect(same.value.hull.hullPowerW).toBe(123);
    expect(editions.fitHull).toBeTypeOf("function");
    expect(editions.fitHull(getPresetFit("pony:1"), c)?.hullPowerW).not.toBe(123);
  });
  it("rejects a restamped two-slot fit/run/result atomically even with explicit unknown-snapshot opt-in", () => {
    const c = loadCandidateCatalog(), w = new FittingWorkspace(getPresetFit("pony:1"), c), before = w.snapshot();
    const previous = makeMiningRun(getPresetFit("pony:2", old), loadCandidateCatalog(old), baseline.conditions); if (!previous.ok) throw Error("old reference");
    const claimed = structuredClone(previous.value); claimed.catalogVersion = next; claimed.resolvedShip.fit.catalogVersion = next;
    const native = result(createRun("false-new", claimed));
    expect(parseFitJson(wire(claimed.resolvedShip.fit), c).ok).toBe(false);
    expect(parseExperimentJson(wire(claimed), { allowSnapshotReplay: true }).ok).toBe(false);
    for (const doc of [claimed.resolvedShip.fit, claimed, native]) { expect(w.importDocument(wire(doc), true).ok).toBe(false); expect(w.snapshot()).toEqual(before); }
    const unknown = structuredClone(previous.value); unknown.catalogVersion = "ship-fitting-0.2.3"; unknown.resolvedShip.fit.catalogVersion = unknown.catalogVersion;
    expect(parseExperimentJson(wire(unknown)).ok).toBe(false); expect(parseExperimentJson(wire(unknown), { allowSnapshotReplay: true }).ok).toBe(true);
    expect(parseResultJson(wire({ ...native, spec: unknown })).ok).toBe(false);
  });
  for (const version of ["ship-fitting-0.2.0", old, next] as const) it(`${version} incomplete Pony conditions retain actual fit and mining group`, () => {
    const c = loadCandidateCatalog(), f = getPresetFit("pony:3", version), id = f.assignments["power-1"];
    delete f.assignments["power-1"]; delete f.instances[id]; const w = new FittingWorkspace(f, c), before = w.getFit();
    expect(w.setConditions({ temperatureK: 310, repeat: false, selectedWorkGroup: ["builtin:laser", "fit:payload-1", "fit:payload-2"] })).toBe(true);
    expect(w.getFit()).toEqual(before); expect(w.prepare().ok).toBe(false); const state = w.snapshot();
    expect(w.setConditions({ ...w.getSelected().conditions, stepSeconds: 0 })).toBe(false); expect(w.snapshot()).toEqual(state);
  });
  it("keeps old active/result/reference immutable when the next variant chooses a new Pony preset", () => {
    const c = loadCandidateCatalog(), w = new FittingWorkspace(getPresetFit("pony:2", old), c); w.setConditions(baseline.conditions);
    const start = w.start("old-active"); if (!start.ok) throw Error("start fixture"); const run = createRun("old-active", start.value.spec); runChunk(run, 3);
    w.acceptResult(result(run)); w.setStatus("old-active", "paused"); expect(w.freeze()).toBe(true); const before = w.snapshot(); w.select("B"); w.applyFit(getPresetFit("pony:3"));
    expect(w.getFit().catalogVersion).toBe(next); expect(w.getActive()).toEqual(before.active); expect(w.getFrozen()).toEqual(before.frozen); expect(w.getVariants()[0]).toEqual(before.variants[0]);
  });
});

describe("CR-PONY-B1 known snapshot mounting identity", () => {
  const versions = ["ship-fitting-0.2.0", old, next] as const;
  const prepared = (version: typeof versions[number], edit?: (fit: ReturnType<typeof getPresetFit>) => void) => {
    const fit = getPresetFit("pony:2", version); edit?.(fit);
    const s = makeMiningRun(fit, loadCandidateCatalog(version), { durationSeconds: 1, stepSeconds: 1 });
    if (!s.ok) throw Error(wire(s)); return s.value;
  };
  const completed = (s: RunSpecV2) => { const run = createRun("mount-proof", s); while (!run.done) runChunk(run, 100); return result(run); };
  const keeper = () => {
    const w = new FittingWorkspace(getPresetFit("pony:1"), loadCandidateCatalog());
    const s = makeMiningRun(w.getFit(), w.catalog, { durationSeconds: 1, stepSeconds: 1 });
    if (!s.ok) throw Error("keeper fixture"); w.showRun(completed(s.value)); expect(w.freeze()).toBe(true); return w;
  };
  it("rejects the independently reproduced hidden20MJ buffer experiment/result atomically", () => {
    const s = prepared(old); s.catalogVersion = s.resolvedShip.fit.catalogVersion = next;
    const id = s.resolvedShip.fit.assignments["signature-2"];
    delete s.resolvedShip.fit.assignments["signature-2"]; delete s.resolvedShip.fit.instances[id];
    expect(validateFit(s.resolvedShip.fit, loadCandidateCatalog()).valid).toBe(true);
    expect(validateRunSpecV2(s).ok).toBe(true);
    const native = completed(s), w = keeper(), before = w.snapshot();
    const experiment = parseExperimentJson(wire(s)), parsedResult = parseResultJson(wire(native));
    const admission = w.importDocument(wire(native));
    console.log(JSON.stringify({ address: "CR-PONY-B1", experiment: experiment.ok, result: parsedResult.ok, workspace: admission.ok, changed: wire(before) !== wire(w.snapshot()), timeSeconds: native.state.timeSeconds, hiddenBufferJ: native.state.buffersJ[id] }));
    expect(native.state.buffersJ[id]).toBeCloseTo(20e6, 5); expect(experiment.ok).toBe(false); expect(parsedResult.ok).toBe(false); expect(admission.ok).toBe(false); expect(w.snapshot()).toEqual(before);
  });
  const mismatches = ["extra", "missing", "id", "item", "family disguise", "enabled", "slot/role", "builtin flag", "builtin owner", "extra hull slot"] as const;
  for (const version of versions) for (const kind of mismatches) it(`${version}: refuses internally numeric-valid ${kind} mounting mismatch`, () => {
    const original = prepared(version), fit = original.resolvedShip.fit;
    let s = structuredClone(original);
    if (kind === "extra") {
      const id = s.resolvedShip.fit.assignments["signature-1"];
      delete s.resolvedShip.fit.assignments["signature-1"]; delete s.resolvedShip.fit.instances[id];
    } else if (kind === "missing") {
      s = prepared(version, f => { const id = f.assignments["signature-1"]; delete f.assignments["signature-1"]; delete f.instances[id]; });
      s.resolvedShip.fit = structuredClone(fit);
    } else if (kind === "id") {
      s = prepared(version, f => { const id = f.assignments["signature-1"]; f.instances["hidden:radiator"] = { ...f.instances[id], id: "hidden:radiator" }; delete f.instances[id]; f.assignments["signature-1"] = "hidden:radiator"; });
      s.resolvedShip.fit = structuredClone(fit);
    } else if (kind === "item" || kind === "family disguise") {
      s = prepared(version, f => { f.instances[f.assignments["signature-1"]].itemId = "buffer-S"; });
      if (kind === "family disguise") s.resolvedShip.instances.find(i => i.slotId === "signature-1")!.item.id = "radiator-passive-S";
      s.resolvedShip.fit = structuredClone(fit);
    } else if (kind === "enabled") {
      s = prepared(version, f => { f.instances[f.assignments["signature-1"]].enabled = false; }); s.resolvedShip.fit = structuredClone(fit);
    } else if (kind === "slot/role") {
      for (const i of s.resolvedShip.instances.filter(i => i.role === "strafe" || i.role === "turn")) i.slotId = i.role = i.role === "strafe" ? "turn" : "strafe";
    } else if (kind === "builtin flag") {
      const i = s.resolvedShip.instances.find(i => i.builtin)!; i.builtin = false;
      s.resolvedShip.fit.localVariants[i.item.id] = structuredClone(i.item);
    } else if (kind === "builtin owner") {
      s.resolvedShip.hull.builtins[0].id = "builtin:hidden-owner";
    } else s.resolvedShip.hull.slots.push({ ...structuredClone(s.resolvedShip.hull.slots.find(x => x.id === "signature-1")!), id: "signature-hidden" });
    expect(validateFit(s.resolvedShip.fit, loadCandidateCatalog()).valid).toBe(true); expect(validateRunSpecV2(s).ok).toBe(true);
    const native = completed(s), w = keeper(), before = w.snapshot();
    for (const doc of [s, native]) {
      expect(parseExperimentJson(wire(doc), { allowSnapshotReplay: true }).ok).toBe(false);
      expect(w.importDocument(wire(doc), true).ok).toBe(false); expect(w.snapshot()).toEqual(before);
    }
    expect(parseResultJson(wire(native)).ok).toBe(false);
  });
  for (const version of versions) it(`${version}: keeps authored numeric hull/builtin/local-variant snapshots byte-exact`, () => {
    const c = loadCandidateCatalog(version), h = c.hulls.find(x => x.id === "pony")!, f = getPresetFit("pony:2", version);
    h.hullPowerW = 123; h.hullRadiationM2 *= 0.8; h.materials[0].massKg *= 1.05; h.materials[0].cpJKgK *= 1.1;
    h.builtins[0].item.materials[0].massKg *= 1.1;
    const variant = structuredClone(c.items["radiator-passive-S"]); variant.id = "authored:radiator"; variant.numerics.areaM2 *= 0.75; variant.materials[0].cpJKgK = 510;
    variant.origins["numerics.areaM2"] = { kind: "experimental", unit: "m²", sourceRef: "lab:authored-mount-proof" };
    f.localVariants[variant.id] = variant; f.instances[f.assignments["signature-1"]].itemId = variant.id;
    f.builtinModes = { "builtin:laser": { enabled: false } };
    const s = makeMiningRun(f, c, { durationSeconds: 1, stepSeconds: 1 }); if (!s.ok) throw Error(wire(s));
    expect(parseExperimentJson(wire(s.value))).toEqual(s);
    const native = completed(s.value); expect(parseResultJson(wire(native))).toEqual({ ok: true, value: native });
    const w = keeper(); expect(w.importDocument(wire(native)).ok).toBe(true); expect(w.getCurrentResult()).toEqual(native); expect(w.prepare()).toEqual(s);
  });
  it("retains explicit unknown numerical replay without claiming known hull compatibility", () => {
    const s = prepared(old), id = s.resolvedShip.fit.assignments["signature-2"];
    delete s.resolvedShip.fit.assignments["signature-2"]; delete s.resolvedShip.fit.instances[id];
    s.catalogVersion = s.resolvedShip.fit.catalogVersion = "ship-fitting-unregistered";
    expect(parseExperimentJson(wire(s)).ok).toBe(false);
    const replay = parseExperimentJson(wire(s), { allowSnapshotReplay: true });
    expect(replay).toEqual({ ok: true, value: { ...s, snapshotReplayOnly: true } });
    const w = keeper(), fit = w.getFit(); expect(w.importDocument(wire(s), true).ok).toBe(true); expect(w.getFit()).toEqual(fit); expect(w.prepare()).toEqual(replay);
  });
});
