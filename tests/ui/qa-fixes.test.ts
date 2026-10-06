import { it, expect } from "vitest";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import {
  slotLayout,
  replacement,
  loadNominal,
  nominalFit,
  nominalProcess,
} from "../../src/app/fitting-ui/presentation";
import { shipView } from "../../src/app/fitting-ui/ship-view";
import { swapDialog } from "../../src/app/fitting-ui/swap-dialog";
import {
  compareView,
  sortVariants,
} from "../../src/app/fitting-ui/compare-view";
import { eventMatches } from "../../src/app/fitting-ui/telemetry";
import { labView } from "../../src/app/fitting-ui/lab-view";
import { createRun, runChunk, result } from "../../src/runner/run";
const c = loadCandidateCatalog();
const workspace = (id = "sputnik:1") =>
  new FittingWorkspace(getPresetFit(id), c);
function measure(w: FittingWorkspace) {
  w.setConditions({ ...w.getSelected().conditions, durationSeconds: 20 });
  const a = w.start("measured");
  if (!a.ok) throw Error("fixture");
  const run = createRun(a.value.runId, a.value.spec);
  while (!run.done) runChunk(run, 20000);
  const r = result(run);
  w.acceptResult(r);
  return r;
}
it("D01 Industrial L budgets category gaps before choosing a ring", () => {
  const h = c.hulls.find((h) => h.id === "industrial-L")!;
  const all = [
    ...h.slots.map((s) => ({ id: s.id, category: s.category, builtin: false })),
    ...h.builtins.map((b) => ({
      id: b.id,
      category: b.item.category,
      builtin: true,
    })),
  ];
  expect(all).toHaveLength(20);
  expect(slotLayout(all, 700).ring).toBe(false);
  const layout = slotLayout(all.slice(1), 700);
  expect(layout.ring).toBe(true);
  for (let i = 0; i < layout.nodes.length; i++) {
    const a = layout.nodes[i],
      b = layout.nodes[(i + 1) % layout.nodes.length];
    const gap = (b.angle - a.angle + 360) % 360;
    expect(gap).toBeGreaterThanOrEqual(18);
    if (a.category !== b.category)
      expect(gap - layout.minimumAngle).toBeCloseTo(2, 10);
  }
});
it("D02 preview displays source-oracle nominal ship load/mining deltas and catalogue columns", () => {
  const w = workspace();
  const html = swapDialog(w, {
    slotId: "payload-1",
    candidate: "cargo-universal-S",
    query: "",
    family: "all",
    size: "all",
    sort: "name",
    batch: false,
    returnId: "slot-payload-1",
  });
  expect(html).toContain('data-delta-power-w="-3000000"');
  expect(html).toContain('data-delta-mining-scu-s="-0.0625125"');
  for (const label of [
    "Потребление",
    "Добыча",
    "Лазеров после",
    "Трюм после",
    "Источник",
    "Объём изделия",
  ])
    expect(html).toContain(label);
  for (const value of ["power-asc", "power-desc", "mining-asc", "mining-desc"])
    expect(html).toContain(`value="${value}"`);
  expect(html).toContain("последний лазер");
});
it("D04/D10 all Pony lasers have distinct visible ordinal actions including built-in", () => {
  const html = shipView(workspace("pony:3"), 700, new Set());
  for (const label of ["Лазер 1", "Лазер 2", "Лазер 3"])
    expect(html).toContain(`<h3>${label}</h3>`);
  expect(html).toMatch(/<button[^>]*class="module-card/);
});
it("D09 changed item and same-item changed local TTX cannot borrow historical delivered channel", () => {
  const w = workspace();
  measure(w);
  w.freeze();
  const a = w.getFrozen();
  expect(shipView(w, 700, new Set())).toContain("% номинала");
  w.applyFit(replacement(w.getFit(), c, "payload-1", "cargo-universal-S"));
  const html = shipView(w, 700, new Set());
  expect(
    html
      .split('class="system system-payload"')[1]
      .split('class="system system-propulsion"')[0],
  ).not.toContain("% номинала");
  expect(html).toContain("изменено после теста");
  expect(w.getFrozen()).toEqual(a);
  const v = workspace();
  measure(v);
  const fit = v.getFit();
  const item = structuredClone(
    c.items[fit.instances[fit.assignments["payload-1"]].itemId],
  );
  item.numerics.powerW *= 0.5;
  item.origins["numerics.powerW"] = {
    kind: "experimental",
    sourceRef: "lab:test",
    note: "explicit local TTX",
    unit: "W",
  };
  fit.localVariants[item.id] = item;
  v.applyFit(fit);
  expect(
    shipView(v, 700, new Set())
      .split('class="system system-payload"')[1]
      .split('class="system system-propulsion"')[0],
  ).not.toContain("% номинала");
});
it("D03/D05/D06/D11 accepted controls retain real absent-data semantics", () => {
  const w = workspace();
  measure(w);
  w.freeze();
  const before = w.snapshot();
  const compare = compareView(w, "rate-desc");
  for (const v of [
    "rate-asc",
    "rate-desc",
    "k-asc",
    "k-desc",
    "diesel-asc",
    "diesel-desc",
  ])
    expect(compare).toContain(`value="${v}"`);
  expect(compare).toContain('class="compare-cards"');
  const html = labView(
    w,
    w.getSelected().result,
    { group: "energy", unit: "W", hidden: new Set(), eventIndex: 0 },
    "all",
    "",
  );
  expect(html).toContain('data-event-filter="environment"');
  expect(html).toContain('id="event-instance"');
  expect(compare).toContain("Только A");
  expect(compare).toContain("Только B");
  expect(html).toContain('class="lab-right"');
  expect(w.snapshot()).toEqual(before);
});
it("D03 every metric sorts both directions with unmeasured values last and stable independent cards", () => {
  const w = workspace();
  const a = measure(w);
  const vs = w.getVariants();
  // Явные UI fixtures проверяют порядок, не заявляют физический результат.
  vs[0].result = structuredClone(a);
  vs[1].result = structuredClone(a);
  vs[0].result!.metrics.scuPerHour = 100;
  vs[1].result!.metrics.scuPerHour = 200;
  vs[0].result!.metrics.kUseHorizon = 0.9;
  vs[1].result!.metrics.kUseHorizon = 0.5;
  vs[0].result!.metrics.fuelPerScu.diesel = 2;
  vs[1].result!.metrics.fuelPerScu.diesel = 1;
  for (const [sort, ids] of [
    ["rate-asc", "ABC"],
    ["rate-desc", "BAC"],
    ["k-asc", "BAC"],
    ["k-desc", "ABC"],
    ["diesel-asc", "BAC"],
    ["diesel-desc", "ABC"],
  ])
    expect(
      sortVariants(vs, sort)
        .map((v) => v.id)
        .join(""),
    ).toBe(ids);
  expect(vs.map((v) => v.id).join("")).toBe("ABC");
});
it("D05 environment filtering uses literal kind; missing attribution is never inferred", () => {
  expect(eventMatches("environment-input", "environment")).toBe(true);
  expect(eventMatches("phase", "environment")).toBe(false);
  expect(eventMatches("propulsion-shortfall", "thrust")).toBe(true);
  const w = workspace();
  const r = measure(w);
  r.events = [
    {
      timeSeconds: 3,
      kind: "phase",
      message: "instance fit:payload-1 environment",
    },
  ];
  const html = labView(
    w,
    r,
    { group: "energy", unit: "W", hidden: new Set(), eventIndex: 0 },
    "environment",
    "",
  );
  expect(html).toContain("Событий по фильтру нет");
  expect(html).not.toContain(">3</td>");
});

it("D02 nominal projection retains explicit absent thermal demand and enabled/local roster semantics", () => {
  const w = workspace("pony:3"),
    f = w.getFit(),
    process = nominalProcess(w);
  expect(loadNominal(c.items["thermoinverter-S"])).toBeNull();
  expect(loadNominal(c.items["generator-diesel-S"])).toBe(0);
  expect(loadNominal(c.items["radiator-active-S"])).toBe(300000);
  expect(nominalFit(f, c, process).lasers).toBe(3);
  const builtin = c.hulls
    .find((h) => h.id === "pony")!
    .builtins.find((b) => b.item.family === "mining")!;
  f.builtinModes = { ...f.builtinModes, [builtin.id]: { enabled: false } };
  const after = nominalFit(f, c, process);
  expect(after.lasers).toBe(2);
  expect(after.miningScuS).toBeCloseTo(2 * 1e6 * .35 / 24e6, 10);
});
