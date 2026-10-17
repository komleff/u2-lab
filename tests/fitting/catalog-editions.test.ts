import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import baseline from "./fixtures/catalog-0.2.0-digests.json";
import physical from "./fixtures/thermal-old-result-digests.json";
import { physicalResult } from './physical-result';
import { getPresetFit as editionPreset, loadCandidateCatalog } from "../../src/fitting/catalog";
import type { CandidateCatalog } from "../../src/fitting/types";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun, runChunk, result } from "../../src/runner/run";
import { parseFitJson, parseExperimentJson, serializeFit, serializeExperiment } from "../../src/io/fitting-json";
import { parseResultJson } from "../../src/io/fitting-result";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { replacement } from "../../src/app/fitting-ui/presentation";
const old = "ship-fitting-0.2.0", current=loadCandidateCatalog("ship-fitting-0.2.1");
const getPresetFit = (id: string, v: CandidateCatalog["version"] = "ship-fitting-0.2.1") => editionPreset(id, v);
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v);
const digest=(x:unknown)=>createHash("sha256").update(json(x)).digest("hex");
// Frozen 692385d: guards остаются литералами, а не пересчитанными goldens.
const oldFileHashes = {
  "src/fitting/data/default-diesel-pony-0.2.4.json": "702d45e1576a9f1f24aad83833392527c8a886f552e63f67c5e4d049be5e98e0",
  "src/fitting/data/default-ermak-0.2.4.json": "bf02a939fe2c1acbd4c2db24a95bc94c8adcd752bf64bd2996c2a2e5c7d44a16",
  "src/fitting/data/default-sputnik-0.2.4.json": "58104a35a485e93e94a8cb5a06fada39aa360b9bfb8267df272f800e8c11918c",
  "src/fitting/data/hulls.json": "3261b2219b39f187db7666f1af16b4685ab32b62bc4af640ddeafd8d9e00cef4",
  "src/fitting/data/modules-0.2.1.json": "1f5d5e490d45b9cb7ef70f9cbdb4ae6fa56accc0accf8b66aef50e84e213df95",
  "src/fitting/data/modules-0.2.3.json": "7fb46f47018a8af5f8bbf2bf22fb4cc13ce61e472e4df35d89cdbe845b032832",
  "src/fitting/data/modules.json": "de854469f7b71799dde7a1fdea4ca00aab8a704337b8255f257a03cb48feea70",
  "tests/fitting/fixtures/catalog-0.2.0-digests.json": "cc937f04385c6cf462232d531fe786971f17da93205316e775ffd989e28ec16c",
  "tests/fitting/fixtures/catalog-0.2.1-pony-digests.json": "472ce0482ab532366161289dbe8bc584c5b6fba96031893fdbaec9560e8d279b",
  "tests/fitting/fixtures/catalog-0.2.2-digests.json": "19e32f99ae73fe29041c1c9db7b13ae5d6bed516586a3a06158be9e3ddc6b6f5",
  "tests/fitting/fixtures/catalog-0.2.3-inherited-digests.json": "014226805a7183a5dd6943b55c60fad9c67dddba87ea4059c8c3429585de4b6a",
  "tests/fitting/fixtures/catalog-0.2.4-digests.json": "41ca8c6b30780c686afa7f87b8af1a453bfea69771774c1d70a062b0cd081216",
  "tests/fitting/fixtures/legacy-0.json": "49654f9ec95522557fdf0574d50a20c2b0b71c54895f42c2c3088a5ae9fe9f6c",
  "tests/fitting/fixtures/legacy-1.json": "690a9d485ba4645062305bd2be5061a0b366c0ca2ca86ae8965e898c66ace29e",
  "tests/fitting/fixtures/legacy-external.json": "55f41118efbfb307082a68a3cd8d35395c29a93084308b4523149b46c5cc085d",
  "tests/fitting/fixtures/thermal-old-result-digests.json": "d726097652cfe27855a71593c59b578f2eb84fb7f75ceb5d4cb1c4fc04776857"
};
it("ship-model addition preserves every old catalog/default and literal replay/digest fixture byte",()=>{
  for(const[path,expected]of Object.entries(oldFileHashes))expect(createHash("sha256").update(readFileSync(path)).digest("hex"),path).toBe(expected);
});
for(const [id,oracle] of Object.entries(baseline.rows)) it(`old ${id} retains exact native fit/spec/zero/partial/completed hashes in the current catalog`,()=>{
 const f=getPresetFit(id,old), c=loadCandidateCatalog(old);
 expect(digest(c)).toBe(baseline.catalog);expect(digest(f)).toBe(oracle.fit);
 expect(parseFitJson(serializeFit(f),current)).toEqual({ok:true,value:f});
 const s=makeMiningRun(f,current,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error(json(s));
 expect(digest(s.value)).toBe(oracle.spec);expect(parseExperimentJson(serializeExperiment(s.value))).toEqual(s);
 const run=createRun("old:"+id,s.value);
 for(const key of ["zero","partial","complete"] as const){
  if(key==="partial")runChunk(run,1);if(key==="complete")while(!run.done)runChunk(run,100);
  const native=result(run);if(key==='zero')expect(digest(native)).toBe(oracle[key]);expect(digest(physicalResult(native))).toBe(physical.rows[old][id as keyof typeof physical.rows[typeof old]][key]);
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
  const unknown=structuredClone(s.value);unknown.catalogVersion="ship-fitting-future-test";unknown.resolvedShip.fit.catalogVersion=unknown.catalogVersion;
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
