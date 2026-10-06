import { describe, expect, it } from "vitest";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import { createRun, runChunk, result } from "../../src/runner/run";
import { labView } from "../../src/app/fitting-ui/lab-view";
import { channelsView } from "../../src/app/fitting-ui/lab-channels";
import { compareView } from "../../src/app/fitting-ui/compare-view";
import { channelGroup, channelUnit } from "../../src/app/fitting-ui/telemetry";
import { numericalVariant } from "../../src/app/fitting-ui/local-variant";
import { validateFit } from "../../src/fitting/validate";
import { makeMiningRun } from "../../src/scenarios/fitting";
const catalog = loadCandidateCatalog();
const workspace = () => new FittingWorkspace(getPresetFit("pony:1"), catalog);
const channel = () => ({ group: "energy", unit: "W", hidden: new Set<string>(), eventIndex: 0 });
function measured(w: FittingWorkspace, id: string) {
  w.setConditions({ ...w.getSelected().conditions, durationSeconds: 20, stepSeconds: 1 });
  const s = w.prepare(); if (!s.ok) throw Error("fixture");
  const run = createRun(id, s.value); while (!run.done) runChunk(run, 20000);
  const r = result(run); w.showRun(r); return r;
}
describe("v4 preserves the complete GD research workflow", () => {
  it("prepares next conditions during an active test without changing its measured owner", () => {
    const w = workspace(), started = w.start("active");
    if (!started.ok) throw Error("fixture");
    const before = w.getActive();
    w.select("B");
    expect(w.setConditions({ durationSeconds: 900, temperatureK: 320, workSeconds: 90 })).toBe(true);
    expect(w.getSelected().conditions.temperatureK).toBe(320);
    expect(w.getActive()).toEqual(before);
    expect(w.start("second").ok).toBe(false);
    const view = labView(w, undefined, channel(), "all", "");
    expect(view).toMatch(/id="fit-duration"[^>]+value="900"/);
    expect(view).toContain("Следующий черновик");
    expect(view).toMatch(/активный/i);
  });
  it("freezes a genuine paused partial interval, then retains it after cancellation", () => {
    const w = workspace(), started = w.start("partial");
    if (!started.ok) throw Error("fixture");
    const run = createRun("partial", started.value.spec); runChunk(run, 17);
    const partial = result(run, "paused");
    expect(w.acceptResult(partial)).toBe(true); w.setStatus("partial", "paused");
    expect(w.freeze()).toBe(true);
    const reference = w.getFrozen(); expect(reference?.status).toBe("paused");
    expect(reference?.state.timeSeconds).toBeCloseTo(.17);
    expect(w.getSelected().result).toEqual(partial);
    expect(w.start("second").ok).toBe(false);
    runChunk(run, 12); w.acceptResult(result(run, "cancelled"));
    expect(w.getFrozen()).toEqual(reference);
  });
  it("keeps the color of a remaining curve and its legend after hiding its neighbor", () => {
    const w = workspace(), r = measured(w, "colors"), c = channel();
    const colors = (html: string) => [...(html.includes('id="channel-details"') ? html.slice(html.indexOf('id="channel-details"')) : html).matchAll(/<g stroke="([^"]+)"/g)].map(x => x[1]);
    const before = colors(channelsView(r, c));
    c.hidden.add(r.channels.find(id => channelGroup(id) === "energy" && channelUnit(id) === "W")!);
    const after = colors(channelsView(r, c));
    expect(before.length).toBeGreaterThan(2);
    expect(after[0]).toBe(before[1]);
  });
  it("shows measured revision separately from the edited draft and concrete condition values", () => {
    const w = workspace(), a = measured(w, "a"); w.freeze();
    w.select("B"); w.applyFit(getPresetFit("civilian-M:2"));
    w.setConditions({ ...w.getSelected().conditions, temperatureK: 320 });
    measured(w, "b");
    const f = w.getFit(); f.initial.chargeFraction = .5; w.applyFit(f);
    const html = compareView(w, "rate-desc");
    expect(html).toContain("измерена ревизия");
    expect(html).toContain("черновик");
    expect(html).toContain(a.spec.resolvedShip.hull.label);
    expect(html).toContain("temperatureK");
    expect(html).toContain("300");
  });
  it("opens a native result for analysis without rerunning or showing the previous hull", () => {
    const source = workspace(); source.applyFit(getPresetFit("civilian-M:2"));
    source.setConditions({ ...source.getSelected().conditions, temperatureK: 320, approachSeconds: 5, repeat: false });
    const r = measured(source, "imported-result"), fresh = workspace();
    const p = fresh.importDocument(JSON.stringify(r, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v));
    expect(p.ok && p.value).toBe("result");
    expect(fresh.getCurrentResult()?.metrics).toEqual(r.metrics);
    expect(fresh.getFit().hullId).toBe("civilian-M");
    expect(fresh.getSelected().conditions.temperatureK).toBe(320);
    expect(fresh.getActive()).toBeUndefined();
  });
  for (const [name, mutate] of [
    ["missing metrics", (r: any) => delete r.metrics],
    ["nonfinite metric", (r: any) => r.metrics.usefulWork = null],
    ["foreign array size", (r: any) => r.buckets[0].sum.pop()],
    ["reversed interval", (r: any) => r.buckets[0].endSeconds = -1],
    ["unknown channel", (r: any) => r.channels[0] = "invented:channel"],
    ["duplicate channel", (r: any) => r.channels[1] = r.channels[0]],
    ["wrong measured time", (r: any) => r.state.timeSeconds = 19],
    ["missing event text", (r: any) => delete r.events[0].message],
  ] as const) it(`rejects ${name} atomically before presenting imported measurements`, () => {
    const w = workspace(), original = measured(w, "valid"); w.freeze();
    const before = w.snapshot(), malformed = JSON.parse(JSON.stringify(original, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v));
    mutate(malformed);
    expect(w.importDocument(JSON.stringify(malformed)).ok).toBe(false);
    expect(w.snapshot()).toEqual(before);
  });
  it("exposes existing T, phase, physics dt and repeat controls and preserves valid next conditions", () => {
    const w = workspace(), c = w.getSelected().conditions;
    expect(w.setConditions({ ...c, temperatureK: 320, approachSeconds: 3, brakingSeconds: 4, serviceSeconds: 5, idleSeconds: 6, repeat: false })).toBe(true);
    const before = w.getSelected().conditions;
    expect(w.setConditions({ ...before, temperatureK: NaN })).toBe(false);
    expect(w.getSelected().conditions).toEqual(before);
    const html = labView(w, undefined, channel(), "all", "");
    for (const id of ["fit-temperature", "fit-approach", "fit-braking", "fit-service", "fit-idle", "fit-repeat", "fit-dt"]) expect(html).toContain(`id="${id}"`);
  });
});

it("uses the selected bucket for module means and marks the same journal interval", () => {
  const w = workspace(), r = measured(w, "selection"), c = { ...channel(), bucketIndex: 5 };
  const b = r.buckets[5], html = labView(w, r, c, "all", "");
  expect(html).toContain(`data-selected-start="${b.startSeconds}"`);
  expect(html).toContain(`data-selected-end="${b.endSeconds}"`);
  expect(html).toContain("Выдача — среднее выбранного bucket");
  expect(html).toContain("Выбрать время события");
});
it("does not call a live partial snapshot an operator pause", () => {
  const w = workspace(), s = w.start("live"); if (!s.ok) throw Error("fixture");
  const run = createRun("live", s.value.spec); runChunk(run, 2); w.acceptResult(result(run, "paused"));
  expect(compareView(w, "name")).not.toContain("частичный / пауза");
});

it("validates next conditions against the actual selected multi-laser fit", () => {
  const w = workspace(); w.applyFit(getPresetFit("pony:3"));
  expect(w.setConditions({ temperatureK: 310, selectedWorkGroup: ["fit:payload-2"] })).toBe(true);
  expect(w.prepare().ok).toBe(true);
});
for (const hull of catalog.hulls) for (const status of ["zero", "partial", "complete"] as const)
  it(`opens native ${hull.id} ${status} without regenerating measurements`, () => {
    const w = new FittingWorkspace(getPresetFit(hull.id + ":1"), catalog);
    w.setConditions({ durationSeconds: 25.25, stepSeconds: 1 });
    const spec = w.prepare(); if (!spec.ok) throw Error("fixture");
    const run = createRun("native", spec.value);
    if (status === "partial") runChunk(run, 13);
    if (status === "complete") while (!run.done) runChunk(run, 20000);
    const native = result(run), fresh = workspace();
    const p = fresh.importDocument(JSON.stringify(native, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v));
    expect(p, JSON.stringify(p)).toMatchObject({ ok: true, value: "result" });
    expect(fresh.getCurrentResult()).toEqual(native);
    expect(fresh.getActive()).toBeUndefined();
  });
it("keeps an explicitly experimental efficiency variant immutable and rejects unsupported or invalid values", () => {
  const base = catalog.items["mining-civil-S"], before = structuredClone(base);
  const p = numericalVariant(base, "efficiency", .4, "local:hypothesis");
  expect(p.ok).toBe(true); if (!p.ok) throw Error("fixture");
  expect(p.value.numerics.efficiency).toBe(.4);
  expect(p.value.origins["numerics.efficiency"]).toMatchObject({ kind: "experimental", sourceRef: "lab:user-variant" });
  expect(base).toEqual(before);
  for (const value of [-1, 2, NaN]) expect(numericalVariant(base, "efficiency", value, "local:bad").ok).toBe(false);
  expect(numericalVariant(base, "invented", 1, "local:bad").ok).toBe(false);
});
it("opens the real wire tail of a long partial result with honest retained counts", () => {
  const w = workspace(); w.setConditions({ durationSeconds: 1000, stepSeconds: 1, approachSeconds: 1, workSeconds: 1, brakingSeconds: 1, serviceSeconds: 1, idleSeconds: 1 });
  const s = w.prepare(); if (!s.ok) throw Error("fixture");
  const run = createRun("tail", s.value); runChunk(run, 500);
  const r = result(run); expect(r.events.length).toBeGreaterThan(100);
  r.buckets = r.buckets.slice(-250); r.events = r.events.slice(-100);
  const fresh = workspace();
  expect(fresh.importDocument(JSON.stringify(r, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v)).ok).toBe(true);
  expect(fresh.getCurrentResult()?.retention).toEqual(r.retention);
  expect(fresh.getCurrentResult()?.events).toEqual(r.events);
});
it("rejects a falsely complete zero interval in the supported tiny-time domain", () => {
  const w = workspace(); expect(w.setConditions({ durationSeconds: 2e-10, stepSeconds: 1.0001e-10 })).toBe(true);
  const s = w.prepare(); if (!s.ok) throw Error("fixture");
  const r = result(createRun("tiny", s.value)); r.status = "complete";
  expect(workspace().importDocument(JSON.stringify(r)).ok).toBe(false);
});
it("calls an opened native partial result a measured partial interval without an active Worker", () => {
  const w = workspace(), s = w.prepare(); if (!s.ok) throw Error("fixture");
  const run = createRun("partial-file", s.value); runChunk(run, 20); w.showRun(result(run));
  expect(labView(w, w.getCurrentResult(), channel(), "all", "")).toContain("Частичный результат");
});

it("opens a genuine supported tiny clipped native completion with its original measured interval", () => {
  const w = workspace(); expect(w.setConditions({ durationSeconds: 2e-10, stepSeconds: 1.0001e-10 })).toBe(true);
  const s = w.prepare(); if (!s.ok) throw Error("fixture");
  const run = createRun("tiny-valid", s.value); while (!run.done) runChunk(run, 10);
  const native = result(run), fresh = workspace();
  expect(fresh.importDocument(JSON.stringify(native, (_, v) => ArrayBuffer.isView(v) ? Array.from(v as any) : v)).ok).toBe(true);
  expect(fresh.getCurrentResult()).toEqual(native);
});

it("shows the actual first limiter immediately with the measured overview", () => {
  const w = workspace(), r = measured(w, "limiter");
  const html = labView(w, r, channel(), "all", "");
  const summary = html.slice(html.indexOf('id="fit-result"'), html.indexOf('id="workspace-charts"'));
  expect(summary).toContain('id="lab-first-limiter"');
  expect(summary).toContain("Первый ограничитель");
});
it("keeps overview and full data/table while avoiding a closed optional SVG", () => {
  const w = workspace(), r = measured(w, "lazy"), c = { ...channel(), detailsOpen: false };
  const closed = channelsView(r, c);
  expect(closed.match(/<polyline /g) ?? []).toHaveLength(0);
  expect(closed).toContain("count</th>"); expect(closed).toContain("Электричество");
  c.detailsOpen = true;
  const expanded = channelsView(r, c);
  expect((expanded.match(/<polyline /g) ?? []).length).toBeGreaterThan(2);
  expect(r.buckets).toHaveLength(20);
});

describe("CR-V4-B1 editable conditions of a valid incomplete fit", () => {
  for (const edition of ["ship-fitting-0.2.0", "ship-fitting-0.2.1"] as const)
    for (const hull of catalog.hulls)
      for (const missing of ["removed march", "disabled march", "removed battery"] as const) {
        if (hull.id === "civilian-M" && missing === "removed battery") continue;
        it(`${edition} ${hull.id}: ${missing} preserves draft and refuses invalid conditions atomically`, () => {
          const fit = getPresetFit(hull.id + ":1", edition);
          const slot = missing === "removed battery" ? (hull.id === "sputnik" ? undefined : "power-1") : "march";
          // У Sputnik батарея встроена; неполноту создаёт обязательный источник питания.
          const id = fit.assignments[slot ?? "power-1"];
          if (missing === "disabled march") fit.instances[id].enabled = false;
          else { delete fit.assignments[slot ?? "power-1"]; delete fit.instances[id]; }
          const w = new FittingWorkspace(fit, catalog), beforeFit = w.getFit();
          expect(validateFit(fit, catalog)).toMatchObject({ valid: true, readiness: { canRun: false } });
          const conditions = { ...w.getSelected().conditions, temperatureK: 310, repeat: false, stepSeconds: .005 };
          expect(w.setConditions(conditions)).toBe(true);
          expect(w.getSelected().conditions).toEqual(conditions);
          expect(w.getFit()).toEqual(beforeFit);
          expect(w.prepare().ok).toBe(false);
          expect(w.start("incomplete").ok).toBe(false);
          const before = w.snapshot();
          expect(w.setConditions({ ...conditions, stepSeconds: 0 })).toBe(false);
          expect(w.snapshot()).toEqual(before);
        });
      }
  for (const edition of ["ship-fitting-0.2.0", "ship-fitting-0.2.1"] as const)
    for (const hullId of ["sputnik", "industrial-S"]) it(`${edition} ${hullId}: imported multi-laser IDs survive incomplete-fit edits`, () => {
      const fit = getPresetFit(hullId + ":2", edition);
      const march = fit.assignments.march;
      fit.instances["imported:march"] = { ...fit.instances[march], id: "imported:march" };
      fit.assignments.march = "imported:march"; delete fit.instances[march];
      for (const [slot, id] of Object.entries(fit.assignments).filter(([slot]) => slot.startsWith("payload-"))) {
        const renamed = slot === "payload-1" ? march : "imported:beam:" + slot;
        fit.instances[renamed] = { ...fit.instances[id], id: renamed };
        fit.assignments[slot] = renamed; delete fit.instances[id];
      }
      const spec = makeMiningRun(fit, catalog, { durationSeconds: 20, stepSeconds: 1 });
      if (!spec.ok) throw Error("valid imported fixture");
      const w = workspace(); expect(w.importDocument(JSON.stringify(spec.value)).ok).toBe(true);
      const incomplete = w.getFit(), battery = incomplete.assignments["power-1"];
      delete incomplete.assignments["power-1"]; delete incomplete.instances[battery];
      expect(w.applyFit(incomplete).valid).toBe(true);
      const group = w.getSelected().conditions.selectedWorkGroup;
      expect(group).toHaveLength(2);
      expect(w.setConditions({ ...w.getSelected().conditions, temperatureK: 310, repeat: false })).toBe(true);
      expect(w.getSelected().conditions.selectedWorkGroup).toEqual(group);
      expect(w.getFit().catalogVersion).toBe(edition);
      const before = w.snapshot();
      expect(w.setConditions({ ...w.getSelected().conditions, selectedWorkGroup: ["not-installed"] })).toBe(false);
      expect(w.snapshot()).toEqual(before);
      expect(w.prepare().ok).toBe(false);
    });
  it("keeps all four supported Industrial L mining addresses and an active measured reference separate", () => {
    const w = workspace(), original = measured(w, "reference"); w.freeze();
    const started = w.start("active"); if (!started.ok) throw Error("active fixture");
    const active = w.getActive(), frozen = w.getFrozen(); w.select("B");
    const complete = getPresetFit("industrial-L:4"), spec = makeMiningRun(complete, catalog);
    if (!spec.ok) throw Error("four legal payload slots");
    const fit = structuredClone(complete), id = fit.assignments.march;
    delete fit.assignments.march; delete fit.instances[id];
    expect(w.applyFit(fit).valid).toBe(true);
    expect(w.setConditions({ temperatureK: 310, selectedWorkGroup: spec.value.selectedWorkGroup })).toBe(true);
    expect(w.getSelected().conditions.selectedWorkGroup).toHaveLength(4);
    expect(w.getActive()).toEqual(active); expect(w.getFrozen()).toEqual(frozen);
    expect(w.getVariants()[0].result).toEqual(original);
    expect(w.applyFit(complete).valid).toBe(true);
    const prepared = w.prepare(); expect(prepared.ok).toBe(true);
    if (prepared.ok) expect(prepared.value.selectedWorkGroup).toEqual(spec.value.selectedWorkGroup);
    expect(w.getActive()).toEqual(active);
  });
});
