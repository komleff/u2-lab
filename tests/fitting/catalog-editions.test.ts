import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import baseline from "./fixtures/catalog-0.2.0-digests.json";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun, runChunk, result } from "../../src/runner/run";
import { parseFitJson, parseExperimentJson, serializeFit, serializeExperiment } from "../../src/io/fitting-json";
import { parseResultJson } from "../../src/io/fitting-result";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { replacement } from "../../src/app/fitting-ui/presentation";
const old = "ship-fitting-0.2.0", current=loadCandidateCatalog();
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v);
const digest=(x:unknown)=>createHash("sha256").update(json(x)).digest("hex");
for(const [id,oracle] of Object.entries(baseline.rows)) it(`old ${id} retains exact native fit/spec/zero/partial/completed hashes in the current catalog`,()=>{
 const f=getPresetFit(id,old), c=loadCandidateCatalog(old);
 expect(digest(c)).toBe(baseline.catalog);expect(digest(f)).toBe(oracle.fit);
 expect(parseFitJson(serializeFit(f),current)).toEqual({ok:true,value:f});
 const s=makeMiningRun(f,current,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error(json(s));
 expect(digest(s.value)).toBe(oracle.spec);expect(parseExperimentJson(serializeExperiment(s.value))).toEqual(s);
 const run=createRun("old:"+id,s.value);
 for(const key of ["zero","partial","complete"] as const){
  if(key==="partial")runChunk(run,1);if(key==="complete")while(!run.done)runChunk(run,100);
  const native=result(run);expect(digest(native)).toBe(oracle[key]);
  const opened=parseResultJson(json(native));expect(opened).toEqual({ok:true,value:native});
  const fresh=new FittingWorkspace(getPresetFit("sputnik"),current);
  expect(fresh.importDocument(json(native)).ok).toBe(true);expect(fresh.getCurrentResult()).toEqual(native);expect(fresh.prepare()).toEqual(s);
 }
});
it("both known editions open fit/spec/native result; unknown catalogs still require explicit numerical replay and cannot open result",()=>{
 for(const version of [old,"ship-fitting-0.2.1"] as const){
  const f=getPresetFit("industrial-M:2",version), s=makeMiningRun(f,current,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error(json(s));
  expect(s.value.catalogVersion).toBe(version);expect(parseFitJson(serializeFit(f),current).ok).toBe(true);expect(parseExperimentJson(serializeExperiment(s.value))).toEqual(s);
  const run=createRun(version,s.value);while(!run.done)runChunk(run,10);expect(parseResultJson(json(result(run))).ok).toBe(true);
  const unknown=structuredClone(s.value);unknown.catalogVersion="ship-fitting-0.2.2";unknown.resolvedShip.fit.catalogVersion=unknown.catalogVersion;
  expect(parseExperimentJson(json(unknown)).ok).toBe(false);expect(parseExperimentJson(json(unknown),{allowSnapshotReplay:true}).ok).toBe(true);
  const r=result(run);r.spec=unknown;expect(parseResultJson(json(r)).ok).toBe(false);
 }
});
it("old declared inventory rejects new-only globals in fit/spec/result while retaining explicit local snapshots",()=>{
 const f=getPresetFit("industrial-M:2");f.catalogVersion=old;
 expect(parseFitJson(serializeFit(f),current).ok).toBe(false);
 const s=makeMiningRun(getPresetFit("industrial-M:2"),current,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error(json(s));
 s.value.catalogVersion=old;s.value.resolvedShip.fit.catalogVersion=old;
 expect(parseExperimentJson(json(s.value)).ok).toBe(false);expect(parseExperimentJson(json(s.value),{allowSnapshotReplay:true}).ok).toBe(false);
 expect(parseResultJson(json(result(createRun("false-old",s.value)))).ok).toBe(false);
 const local=getPresetFit("pony:2",old);local.localVariants.saved={...structuredClone(current.items["mining-civil-S"]),id:"saved",label:"Прежняя локальная гипотеза"};local.instances[local.assignments["payload-1"]].itemId="saved";
 expect(parseFitJson(serializeFit(local),current)).toEqual({ok:true,value:local});
});
it("explicit new SKU Apply promotes only next draft; old selection/import/removal keeps edition and active/reference/result ownership",()=>{
 const f=getPresetFit("industrial-M:2",old), w=new FittingWorkspace(f,current), started=w.start("old-active");if(!started.ok)throw Error("start");
 const run=createRun("old-active",started.value.spec);runChunk(run,1);w.setStatus(run.runId,"paused");expect(w.acceptResult(result(run))).toBe(true);expect(w.freeze()).toBe(true);
 const active=w.getActive(), frozen=w.getFrozen(), measured=w.getCurrentResult();
 const oldSelection=replacement(w.getFit(),current,"payload-1","mining-industrial-M");expect(oldSelection.catalogVersion).toBe(old);
 const next=replacement(w.getFit(),current,"march","engine-diesel-industrial-M-march");expect(next.catalogVersion).toBe("ship-fitting-0.2.1");expect(w.applyFit(next).valid).toBe(true);
 expect(w.getActive()).toEqual(active);expect(w.getFrozen()).toEqual(frozen);expect(w.getCurrentResult()).toEqual(measured);expect(w.isStale()).toBe(true);
 const before=w.snapshot();const bad=structuredClone(next);bad.catalogVersion=old;
 expect(w.importDocument(serializeFit(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(before);
 expect(w.importDocument(serializeFit({...next,catalogVersion:"future"})).ok).toBe(false);expect(w.snapshot()).toEqual(before);
});
