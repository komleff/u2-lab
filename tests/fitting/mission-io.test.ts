import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import oracle from "./fixtures/catalog-0.2.2-digests.json";
import physical from "./fixtures/thermal-old-result-digests.json";
import { physicalResult } from './physical-result';
import { getPresetFit,loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMissionRun,compareMissionConditions } from "../../src/scenarios/mission";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { createRun,runChunk,result } from "../../src/runner/run";
import { parseExperimentJson } from "../../src/io/fitting-json";
import { parseResultJson } from "../../src/io/fitting-result";
const c=loadCandidateCatalog("ship-fitting-0.2.2");
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v);
const digest=(x:unknown)=>createHash('sha256').update(json(x)).digest('hex');
function spec(){const s=makeMissionRun(getPresetFit('pony:2',c.version),c,{durationSeconds:50,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:1,targetM3:.01,repeat:false});if(!s.ok)throw Error(json(s));return s.value;}
it('M06 native zero/partial/completed-before-H/cancelled results roundtrip without recomputation',()=>{
 const s=spec();expect(parseExperimentJson(json(s))).toEqual({ok:true,value:s});
 const run=createRun('mission-io',s);const zero=result(run);const z=parseResultJson(json(zero));expect(z.ok,z.ok?'':json(z.errors)).toBe(true);if(z.ok)expect(digest(z.value)).toBe(digest(zero));
 runChunk(run,2);const partial=result(run);const p=parseResultJson(json(partial));expect(p.ok,p.ok?'':json(p.errors)).toBe(true);if(p.ok)expect(digest(p.value)).toBe(digest(partial));expect(parseResultJson(json(result(run,'cancelled'))).ok).toBe(true);
 while(!run.done)runChunk(run,1000);const final=result(run);expect(final.state.timeSeconds).toBeLessThan(s.durationSeconds);const f=parseResultJson(json(final));expect(f.ok,f.ok?'':json(f.errors)).toBe(true);if(f.ok)expect(digest(f.value)).toBe(digest(final));
 const opened=parseExperimentJson(json(final));if(!opened.ok||opened.value.schemaVersion!=='u2-lab/2')throw Error('parse');const again=createRun(run.runId,opened.value);while(!again.done)runChunk(again,1000);expect(digest(result(again))).toBe(digest(final));
});
it('M06 rejects false completion, nonfinite/unknown mission model/config and false measured cargo ledger',()=>{
 const s=spec();for(const change of [(s:any)=>s.modelVersion='ship-fitting-mission-wrong',(s:any)=>s.mission.distanceM=-1,(s:any)=>s.mission.cruiseSpeedMS=3000,(s:any)=>delete s.mission]){const bad=structuredClone(s);change(bad);expect(parseExperimentJson(json(bad)).ok).toBe(false);}
 const run=createRun('partial',s);runChunk(run,1);const partial=result(run);partial.status='complete';expect(parseResultJson(json(partial)).ok).toBe(false);
 while(!run.done)runChunk(run,1000);const bad=result(run);bad.state.mission!.deliveredM3+=1;expect(parseResultJson(json(bad)).ok).toBe(false);
});
it('M06 same known-tag ghost roster remains rejected under mission model',()=>{
 const s=spec();const extra=structuredClone(s.resolvedShip.instances.find(i=>!i.builtin)!);extra.id='ghost';s.resolvedShip.instances.push(extra);
 expect(parseExperimentJson(json(s)).ok).toBe(false);
});
it('M06 mission comparisons permit hull/hold/laser/capacity changes but compare fractions and immutable inputs',()=>{
 const a=spec(),b=makeMissionRun(getPresetFit('industrial-M:2',c.version),c,{durationSeconds:50,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:1,targetM3:.01,repeat:false});if(!b.ok)throw Error(json(b));
 expect(compareMissionConditions(a,b.value)).toEqual({comparable:true,differences:[]});
 const changed=structuredClone(a);changed.mission!.distanceM=100;expect(compareMissionConditions(a,changed).differences).toContain('mission');
 const timed=makeMiningRun(getPresetFit('pony:2',c.version),c);if(!timed.ok)throw Error('timed');expect(compareMissionConditions(a,timed.value).differences).toContain('modelVersion');
});
for(const [id,expected] of Object.entries(oracle.rows))it(`M07 pre-code .2 exact native oracle ${id} survives mission additions`,()=>{
 const fit=getPresetFit(id,c.version),s=makeMiningRun(fit,c,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error(json(s));
 expect(digest(c)).toBe(oracle.catalog);expect(digest(fit)).toBe(expected.fit);expect(digest(s.value)).toBe(expected.spec);
 const run=createRun('old022:'+id,s.value),numeric=physical.rows['ship-fitting-0.2.2'][id as keyof typeof physical.rows['ship-fitting-0.2.2']];expect(digest(result(run))).toBe(expected.zero);expect(digest(physicalResult(result(run)))).toBe(numeric.zero);runChunk(run,1);expect(digest(physicalResult(result(run)))).toBe(numeric.partial);while(!run.done)runChunk(run,100);expect(digest(physicalResult(result(run)))).toBe(numeric.complete);
});
