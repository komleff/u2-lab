import { describe, it, expect, vi } from "vitest";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import type { RunResultV2 } from "../../src/runner/run";
import native from "../signatures/fixtures/received-result.json";
import { signatureMeasurements } from "../../src/app/fitting-ui/signatures";
import { traceChart } from "../../src/app/fitting-ui/trace-chart";
import * as presentation from "../../src/app/fitting-ui/presentation";
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

it("UF02 merged signature intervals cover the beginning and keep the later peak without source mutation", () => {
  const r = receipt(), s = r.signatures!, old = s.buckets[0];
  s.buckets = [{...structuredClone(old),startS:0,endS:2550},{...structuredClone(old),startS:2550,endS:3600}];
  for (const c of Object.keys(s.buckets[0].values) as (keyof typeof old.values)[]) {
    s.buckets[0].values[c] = {mean:10,min:-5,max:20};s.buckets[1].values[c] = {mean:100,min:50,max:200};
  }
  const before = JSON.stringify(r), html = signatureMeasurements(r);
  expect(html).toContain('points="45,');
  expect(html).toContain('data-envelope');expect(html).toContain('655,');
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
