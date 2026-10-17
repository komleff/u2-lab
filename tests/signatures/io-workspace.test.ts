import { expect, it } from "vitest";
import { bench } from "./bench-fixture";
import { createRun, runChunk, result } from "../../src/runner/run";
import { parseExperimentJson, serializeExperiment } from "../../src/io/fitting-json";
import { parseResultJson } from "../../src/io/fitting-result";
import { exportSignatureCsv, exportObserverJson } from "../../src/signatures/io";
import { restoreFittingRun } from "../../src/runner/fitting-run";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { loadCandidateCatalog } from "../../src/fitting/catalog";
import { observerView } from "../../src/signatures/runtime";

const json=(v:unknown)=>JSON.stringify(v,(_,x)=>ArrayBuffer.isView(x)?Array.from(x as Float64Array):x);
it("SS13/15 schema3 roundtrip preserves all pending events and resumed physical/source results",()=>{
  const spec=bench("S",400);spec.signatures!.radarEnabled=true;
  const input=parseExperimentJson(serializeExperiment(spec));expect(input.ok,input.ok?"":json(input.errors)).toBe(true);if(input.ok)expect(json(input.value)===json(spec)).toBe(true);
  const run=createRun("saved",spec);runChunk(run,23);
  const saved=result(run),wire=json(saved),parsed=parseResultJson(wire);
  expect(parsed.ok,parsed.ok?"":json(parsed.errors)).toBe(true);if(!parsed.ok)throw Error("parse failed");
  expect(json(parsed.value)).toBe(wire);
  const resumed=restoreFittingRun(parsed.value);
  while(!run.done)runChunk(run,30);while(!resumed.done)runChunk(resumed,7);
  expect(resumed.state).toEqual(run.state);expect(resumed.signatures).toEqual(run.signatures);expect(resumed.metrics).toEqual(run.metrics);
  expect(observerView(resumed.signatures!,spec.signatures!)).toEqual(observerView(run.signatures!,spec.signatures!));
});
it("SS13 new next draft cannot alter active/result/reference/A-B inputs and malformed imports are atomic",()=>{
  const spec=bench(),w=new FittingWorkspace(spec.resolvedShip.fit,loadCandidateCatalog("ship-fitting-0.2.5"));
  expect(w.importDocument(serializeExperiment(spec)).ok).toBe(true);const active=w.start("A");expect(active.ok).toBe(true);
  const run=createRun("A",spec);runChunk(run,1);w.acceptResult(result(run));w.setStatus("A","paused");expect(w.freeze()).toBe(true);
  const beforeActive=w.getActive(),reference=w.getFrozen(),conditions=w.getSelected().conditions;
  expect(w.setConditions({...conditions,signatures:{...spec.signatures!,rangeM:9000,aspectDeg:90}})).toBe(true);
  expect(w.getActive()).toEqual(beforeActive);expect(w.getFrozen()).toEqual(reference);
  w.abort();const before=w.snapshot();
  for(const mutate of [(x:any)=>delete x.signatures.pending,(x:any)=>x.spec.signatures.unknown=true,(x:any)=>x.state.schemaVersion="u2-lab/2",(x:any)=>x.signatures.radar.capJ+=1]){
    const bad=result(run);mutate(bad);expect(w.importDocument(json(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(before);
  }
});
it("SS13/15 GD CSV keeps weighted units/settings; observer JSON is an independent allowlisted export",()=>{
  const spec=bench("S",400),run=createRun("export",spec);runChunk(run,80);const r=result(run);
  const csv=exportSignatureCsv(r);expect(csv).toContain("IRobserver_mean_W");expect(csv).toContain("CS_mean_m2");expect(csv).toContain(spec.modelVersion);expect(csv).toContain(spec.signatures!.dataRevision);
  const view=JSON.parse(exportObserverJson(r));expect(view).toEqual(observerView(run.signatures!,spec.signatures!));
  expect(json(view)).not.toMatch(/spec|emittedAt|target|rangeM|identity|sourceStats|geometry|temperature/);
});

it("SS13/15 refuses locally inconsistent new source/observation/curve/bucket state without inventing prior history",()=>{
  const s=bench("S",400),run=createRun("negative",s);runChunk(run,80);
  const mutations=[
    (r:any)=>r.signatures.buckets.shift(),
    (r:any)=>r.signatures.pending[0].crossings.push({fraction:.3,fluxWm2:1}),
    (r:any)=>r.signatures.lastTruth.em.escapedParasiticW+=1,
    (r:any)=>r.signatures.lastTruth.unknown=1,
    (r:any)=>{r.signatures.held.EM=true;r.signatures.passive.EM={channel:"EM",bearingDeg:0,brightnessWm2:1};},
    (r:any)=>r.signatures.sourceStats.EM.phases.fiction={...r.signatures.sourceStats.EM.total},
  ];
  for(const mutate of mutations){const bad=result(run);mutate(bad);expect(parseResultJson(json(bad)).ok,mutate.toString()).toBe(false);}
});


it.each([
  {name:"duplicate actual cooler ID",mutate:(r:any)=>r.signatures.lastTruth.coolers.push(structuredClone(r.signatures.lastTruth.coolers[0]))},
  {name:"discontinuous interior gas/source piece",mutate:(r:any)=>{const f=r.signatures.pending.at(-1),c=structuredClone(f.ir);f.ir={pieces:[{from:0,to:.5,curve:c},{from:.5,to:1,curve:{...c,a:c.a+1}}]};}},
])("SS13/15 malformed new source $name is refused without changing the opened document",({mutate})=>{
  const spec=bench("S",400),run=createRun("shape-negative",spec);runChunk(run,80);
  const workspace=new FittingWorkspace(spec.resolvedShip.fit,loadCandidateCatalog("ship-fitting-0.2.5"));
  expect(workspace.importDocument(json(result(run))).ok).toBe(true);const before=workspace.snapshot(),bad=result(run);mutate(bad);
  expect(workspace.importDocument(json(bad)).ok).toBe(false);expect(workspace.snapshot()).toEqual(before);
});


it("H03–05 versioned retained history is explicit, old CSV literal and new imports atomic",async()=>{
  const {readFileSync}=await import("node:fs"),old=JSON.parse(readFileSync("tests/signatures/fixtures/received-result.json","utf8"));
  expect(old.signatures.version).toBe("signatures-runtime-0.1");
  const parsedOld=parseResultJson(json(old));expect(parsedOld.ok).toBe(true);if(!parsedOld.ok)throw Error("old parse");
  expect(json(parsedOld.value)).toBe(json(old));expect(exportSignatureCsv(parsedOld.value)).toBe(readFileSync("tests/signatures/fixtures/gd-trace.csv","utf8"));
  const oldRun=restoreFittingRun(parsedOld.value);runChunk(oldRun,2);expect(oldRun.signatures!.version).toBe("signatures-runtime-0.1");
  const spec=bench("S",400),run=createRun("uniform",spec);runChunk(run,8);const saved=result(run);
  expect(saved.signatures!.version).toBe("signatures-runtime-0.2");expect(saved.signatures!.buckets.length).toBeLessThanOrEqual(3);
  const csv=exportSignatureCsv(saved),meta=JSON.parse(csv.split("\n")[0].slice(2));expect(meta.history).toEqual({version:"signatures-runtime-0.2",representation:"uniform-horizon-100",horizonS:30});
  const w=new FittingWorkspace(spec.resolvedShip.fit,loadCandidateCatalog("ship-fitting-0.2.5"));expect(w.importDocument(json(saved)).ok).toBe(true);const before=w.snapshot();
  for(const mutate of [(r:any)=>r.signatures.version="unknown",(r:any)=>r.signatures.buckets[0].endS+=.001,(r:any)=>r.signatures.buckets.at(-1).endS-=.001,(r:any)=>r.spec.durationSeconds=31,(r:any)=>r.signatures.buckets.push(...Array(101).fill(r.signatures.buckets[0])),(r:any)=>r.signatures.buckets[0].values.EM={mean:2,min:0,max:1}]){const bad=structuredClone(saved);mutate(bad);expect(w.importDocument(json(bad)).ok,mutate.toString()).toBe(false);expect(w.snapshot()).toEqual(before);}
  const freshOldSpec=createRun("new-old-spec",old.spec as typeof spec);expect(freshOldSpec.signatures!.version).toBe("signatures-runtime-0.2");expect(json(old)).toBe(json(parsedOld.value));
});
