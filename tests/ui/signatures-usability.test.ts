import { describe, it, expect, vi } from "vitest";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import type { RunResultV2 } from "../../src/runner/run";
import native from "../signatures/fixtures/received-result.json";
import { signatureMeasurements, signatureOverview } from "../../src/app/fitting-ui/signatures";
import { traceChart, overview } from "../../src/app/fitting-ui/trace-chart";
import * as presentation from "../../src/app/fitting-ui/presentation";
import { displaySeries, type DisplayInterval } from "../../src/app/fitting-ui/display-series";
const receipt = () => structuredClone(native) as unknown as RunResultV2;

describe("UF01/04 isolated render snapshot", () => {
  it("copies once and reuses detached results across render readers, preserving public ownership", () => {
    const w = new FittingWorkspace(getPresetFit("pony:1"), loadCandidateCatalog());
    const r = receipt();w.showRun(r);expect(w.freeze()).toBe(true);
    const before = w.snapshot(), spy = vi.spyOn(globalThis, "structuredClone");
    const view = w.snapshotForRender();expect(spy).toHaveBeenCalledTimes(1);spy.mockRestore();
    expect(view.getSelected()).toBe(view.getVariants()[0]);
    expect(view.getCurrentResult()).toBe(view.getSelected().result);
    expect(view.getFit()).toBe(view.getSelected().fit);
    expect(view.getFrozen()).toBe(view.getComparisonBase());
    expect(view.getFrozen()).toEqual(before.frozen);
    view.getSelected().result!.buckets[0].sum[0] = -100;
    view.getFit().initial.chargeFraction = .123;
    expect(w.snapshot()).toEqual(before);
    const external = w.getSelected();external.result!.buckets[0].sum[0] = -200;
    const results = w.getVariants();results[0].result!.signatures!.timeS = 0;
    expect(w.snapshot()).toEqual(before);
    expect(view).not.toHaveProperty("start");expect(view).not.toHaveProperty("applyFit");
  });
  it("freezes render selection and the active owner even when the real workspace changes", () => {
    const w = new FittingWorkspace(getPresetFit("pony:1"), loadCandidateCatalog());
    expect(w.start("active-A").ok).toBe(true);w.select("B");
    const view = w.snapshotForRender();const active = view.getActive();
    expect(active?.variantId).toBe("A");expect(view.selectedId).toBe("B");
    w.select("C");w.abort();expect(view.getActive()).toBe(active);
    expect(view.getSelected().id).toBe("B");expect(view.getCurrentResult()).toBeUndefined();
  });
});

it("GL02/03 shared overview preserves source data, full horizon and the existing selected-time marker", () => {
  const r = receipt(); r.spec.durationSeconds = 3600;
  r.buckets = [{ ...structuredClone(r.buckets[0]), startSeconds: 0, endSeconds: 900 }];
  r.signatures!.buckets = [{ ...structuredClone(r.signatures!.buckets[0]), startS: 0, endS: 900 }];
  const before = JSON.stringify(r), html = overview(r, 450), diagnostics = signatureMeasurements(r);
  expect((html.match(/<figure/g) ?? []).length).toBe(8);
  const first = html.split("<figure").slice(1, 5);
  expect(first[0]).toContain("Электричество"); expect(first[1]).toContain("Температура");
  expect(first[2]).toContain("IR · выбранный ракурс"); expect(first[3]).toContain("EM");
  for (const figure of first) {
    expect(figure).toContain('viewBox="0 0 700 205"'); expect(figure).toContain('data-axis-x="180"');
    expect(figure).toContain('d="M240 20V170"'); expect(figure).toContain('data-time="450"');
    expect(figure).toContain("3 600 с"); expect(figure).toMatch(/(?:M|L| |,|H)300(?:[ ,V])/);
    expect(figure).not.toMatch(/NaN|Infinity/);
  }
  expect(diagnostics).not.toContain("<svg"); expect(diagnostics).toContain("CS · м²");
  expect(JSON.stringify(r)).toBe(before);
});

it("UF02 merged signature intervals cover the beginning and keep the later peak without source mutation", () => {
  const r = receipt(), s = r.signatures!, old = s.buckets[0];
  r.spec.durationSeconds = 3600;
  s.buckets = [{...structuredClone(old),startS:0,endS:2550},{...structuredClone(old),startS:2550,endS:3600}];
  for (const c of Object.keys(s.buckets[0].values) as (keyof typeof old.values)[]) {
    s.buckets[0].values[c] = {mean:10,min:-5,max:20};s.buckets[1].values[c] = {mean:100,min:50,max:200};
  }
  const before = JSON.stringify(r), html = signatureOverview(r);
  expect(html).toContain('points="180,');
  expect(html).toContain('data-envelope');expect(html).toContain('660,');
  expect(html).not.toMatch(/NaN|Infinity/);expect(JSON.stringify(r)).toBe(before);
});

it("UF02 long legacy curves batch envelopes and keep thermal markers and cursor", () => {
  const r = receipt(), i = r.channels.indexOf("temperatureK"), b = r.buckets[0];
  r.buckets = Array.from({length:3600}, (_, n) => ({...structuredClone(b),startSeconds:n,endSeconds:n+1}));
  r.buckets[2250].min[i] = -40;r.buckets[2250].max[i] = 900;
  const before = JSON.stringify(r), html = traceChart(r,["temperatureK"],2250,[{value:700,label:"limit",id:"hot"}]);
  expect((html.match(/<path /g) ?? []).length).toBeLessThan(10);
  expect(html).toContain('data-boundary="hot"');expect(html).toContain('data-time="2250"');
  expect(html).toContain('points="180,');expect(html).not.toMatch(/NaN|Infinity/);
  expect(JSON.stringify(r)).toBe(before);
});

describe("UF03 compact display SI", () => {
  const fmt = (v:number|null|undefined,u:string) => presentation.compactSI(v,u);
  it.each([[0,"Вт","0 Вт"],[1000,"W","1 кВт"],[1e6,"Вт","1 МВт"],[-1.25e6,"Вт","-1,25 МВт"],[1000,"J","1 кДж"],[1e6,"Дж","1 МДж"],[999.999,"Вт","1 кВт"],[1e-6,"Вт/м²","1 мкВт/м²"],[1e-9,"Вт/м²","1 нВт/м²"]] as const)("%s %s",(v,u,expected)=>expect(fmt(v,u)).toBe(expected));
  it("keeps absent/zero/weak signed values distinct with at most two fractional digits",()=>{
    expect(fmt(null,"Вт")).toBe("—");expect(fmt(undefined,"Дж")).toBe("—");
    for(const v of [1e-18,-1e-18,1.234567e-9,12345.6789,-999999.99]) {
      const text=fmt(v,"Вт/м²");expect(text).not.toMatch(/^[-]?0(?:[ ,]|$)/);
      expect(text).not.toMatch(/[,\.]\d{3}/);
    }
  });
});

it("UF02 display grouping preserves the chosen observable weight, extrema and full span", async () => {
  const {displaySeries,displayPaths} = await import("../../src/app/fitting-ui/display-series");
  const rows=[{startS:0,endS:2550,mean:10,min:-5,max:20,weight:2550},
    {startS:2550,endS:3600,mean:100,min:50,max:200,weight:1050}];
  const before=structuredClone(rows), signature=displaySeries(rows,1);
  expect(signature).toEqual([{startS:0,endS:3600,mean:36.25,min:-5,max:200,weight:3600}]);
  const legacy=displaySeries(rows.map((r,i)=>({...r,weight:i?99:1})),1);
  expect(legacy[0].mean).toBeCloseTo((10+9900)/100,12);
  expect(rows).toEqual(before);
  const geometry=displayPaths(signature,x=>x,v=>v);
  expect(geometry.envelope).toBe("M0 -5H3600V200H0Z");
  expect(geometry.points).toBe("0,36.25 3600,36.25");
  const many=Array.from({length:10000},(_,n)=>({startS:n,endS:n+1,mean:n,min:n-2,max:n+2,weight:1}));
  const grouped=displaySeries(many,610);
  expect(grouped.length).toBeLessThanOrEqual(610);
  expect(grouped[0].startS).toBe(0);expect(grouped.at(-1)!.endS).toBe(10000);
  expect(Math.min(...grouped.map(b=>b.min))).toBe(-2);expect(Math.max(...grouped.map(b=>b.max))).toBe(10001);
  expect(grouped.reduce((a,b)=>a+b.mean*b.weight,0)).toBe(49995000);
});

describe("CR-UF-B1 display weighted means preserve finite signed signals", () => {
  const rows = (means: number[], weights = means.map(() => 1)): DisplayInterval[] => means.map((mean, i) =>
    ({ startS: i, endS: i + 1, mean, min: mean, max: mean, weight: weights[i] }));
  it.each([Number.MIN_VALUE, -Number.MIN_VALUE, 1e-300, -1e-300, 1e308, -1e308])("preserves constant %s across the real 610-column grouping", mean => {
    const input = rows(Array(1220).fill(mean)), before = structuredClone(input), groups = displaySeries(input, 610);
    expect(groups).toHaveLength(610); expect(groups.every(g => g.mean === mean && g.min === mean && g.max === mean)).toBe(true);
    expect(groups[0].startS).toBe(0); expect(groups.at(-1)!.endS).toBe(1220); expect(input).toEqual(before);
  });
  it.each([Number.MIN_VALUE, -Number.MIN_VALUE, 1e-300, -1e-300])("preserves constant %s with unequal count and duration weights", mean => {
    for (const weights of [[1, 99], [.1, .3]]) {
      const input = rows([mean, mean], weights), before = structuredClone(input), group = displaySeries(input, 1)[0];
      expect(group.mean).toBe(mean); expect(group.weight).toBe(weights[0] + weights[1]); expect(input).toEqual(before);
    }
  });
  it.each([
    { means: [Number.MIN_VALUE, 2 * Number.MIN_VALUE], weights: [1, 1], expected: 2 * Number.MIN_VALUE },
    { means: [-Number.MIN_VALUE, -2 * Number.MIN_VALUE], weights: [1, 1], expected: -2 * Number.MIN_VALUE },
    { means: [Number.MIN_VALUE, 3 * Number.MIN_VALUE], weights: [3, 1], expected: 2 * Number.MIN_VALUE },
    { means: [Number.MIN_VALUE, -3 * Number.MIN_VALUE], weights: [1, 1], expected: -Number.MIN_VALUE },
    { means: [-Number.MIN_VALUE, 3 * Number.MIN_VALUE], weights: [1, 1], expected: Number.MIN_VALUE },
    { means: [Number.MIN_VALUE, -Number.MIN_VALUE], weights: [1, 1], expected: 0 },
    { means: [1e308, -1e308], weights: [1, 1], expected: 0 },
  ])("rounds the analytic weighted signal $means / $weights", ({ means, weights, expected }) => {
    const input = rows(means, weights), before = structuredClone(input), group = displaySeries(input, 1)[0];
    expect(group.mean).toBe(expected); expect(group.min).toBe(Math.min(...means)); expect(group.max).toBe(Math.max(...means));
    expect(group.startS).toBe(0); expect(group.endS).toBe(2); expect(input).toEqual(before);
  });
  it.each([
    { means: [1e308, 2e307], weights: [1, 3], expected: 4e307 },
    { means: [-1e308, -2e307], weights: [1, 3], expected: -4e307 },
    { means: [1e308, -1e308], weights: [3, 1], expected: 5e307 },
    { means: [10, 100], weights: [2550, 1050], expected: 36.25 },
    { means: [10, 100], weights: [1, 99], expected: 99.1 },
  ])("keeps the finite weighted magnitude $expected", ({ means, weights, expected }) => {
    const input = rows(means, weights), before = structuredClone(input), group = displaySeries(input, 1)[0];
    expect(Number.isFinite(group.mean)).toBe(true);
    expect(Math.abs(group.mean - expected)).toBeLessThanOrEqual(1e-15 * Math.abs(expected));
    expect(group.mean).toBeGreaterThanOrEqual(group.min); expect(group.mean).toBeLessThanOrEqual(group.max); expect(input).toEqual(before);
  });
});


it("H06 live overview is ACK-owned and reports accepted endpoints without bin mean or mutation",async()=>{
  const {channelsView}=await import("../../src/app/fitting-ui/lab-channels"),{labView}=await import("../../src/app/fitting-ui/lab-view"),{frameIrCurves,curveValue}=await import("../../src/signatures/history");
  const r=receipt(),displayed=structuredClone(r);displayed.signatures!.buckets[0].values.IRobserver.mean=123;
  const channel={group:"energy",unit:"W",hidden:new Set<string>(),eventIndex:0,detailsOpen:false};
  const running=channelsView(displayed,channel,true);expect(running).not.toContain("<svg");expect(running).toContain('id="sig-overview"');expect(running).toContain("На конец последнего принятого подшага");
  const value=Math.max(curveValue(frameIrCurves(r.signatures!.lastTruth!,r.spec.signatures!.aspectDeg).contrast,1),0);expect(running).toContain(presentation.num(value,"Вт"));
  expect(running).toContain(presentation.num(r.signatures!.lastTruth!.em.observedEmW,"Вт"));
  const before=JSON.stringify(r),w=new FittingWorkspace(r.spec.resolvedShip.fit,loadCandidateCatalog());expect(w.importDocument(JSON.stringify(r)).ok).toBe(true);
  expect(w.startCheckpoint(r.runId).ok).toBe(true);w.acceptResult(r);
  const render=()=>labView(w.snapshotForRender(),w.getCurrentResult(),channel,"all","");
  expect(render()).toContain('data-signature-live');
  w.select("B");expect(render()).toContain('data-signature-live');
  w.setStatus(r.runId,"paused");expect(render()).not.toContain('data-signature-live');
  w.setStatus(r.runId,"running");expect(render()).toContain('data-signature-live');
  w.abort();w.select("A");expect(render()).not.toContain('data-signature-live');expect(JSON.stringify(r)).toBe(before);
  const absent=receipt();absent.signatures!.lastTruth=null;expect(channelsView(absent,channel,true)).toContain("нет измерения");expect(channelsView(undefined,channel,true)).toContain("нет измерения");
});
