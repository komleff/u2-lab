import { it, expect } from 'vitest';
import { existsSync, writeFileSync } from 'node:fs';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMissionRun } from '../../src/scenarios/mission';
import { createRun, runChunk, result } from '../../src/runner/run';
const c=loadCandidateCatalog(),steps=[.1,.05,.025];
for(const kind of ['completed','near-power-limiter'] as const)it(`M09 ${kind}: physical arrivals, actual mining and species ledger converge with dt refinement`,()=>{
 const rows=steps.map(stepSeconds=>{
  const f=getPresetFit('pony:2');if(kind==='near-power-limiter')f.initial.chargeFraction=0;
  const s=makeMissionRun(f,c,{durationSeconds:300,stepSeconds,distanceM:100,approachSeconds:.2,serviceSeconds:.2,targetM3:.03,repeat:false});if(!s.ok)throw Error(JSON.stringify(s));
  const started=performance.now(),r=createRun(kind+':'+stepSeconds,s.value);while(!r.done)runChunk(r,1000);const native=result(r);
  return {dt:stepSeconds,wallMs:performance.now()-started,result:native,events:native.events.filter(e=>e.kind==='mission-arrival'||e.kind==='phase').map(e=>({kind:e.kind,message:e.message.split(';')[0],t:e.timeSeconds}))};
 });
 const reference=rows.at(-1)!.result;
 for(const row of rows){const r=row.result;
  expect(r.state.mission!.stage).toBe(reference.state.mission!.stage);expect(r.state.mission!.terminalReason).toBe(reference.state.mission!.terminalReason);
  for(const [a,b]of [[r.state.usefulWork,reference.state.usefulWork],[r.state.mission!.deliveredM3,reference.state.mission!.deliveredM3],[r.metrics.fuelSpeciesKg.diesel,reference.metrics.fuelSpeciesKg.diesel],[r.metrics.fuelSpeciesKg.hydrogen,reference.metrics.fuelSpeciesKg.hydrogen]])expect(Math.abs(a-b)/Math.max(1e-10,Math.abs(b))).toBeLessThanOrEqual(.01);
  expect(row.events.length).toBe(rows.at(-1)!.events.length);row.events.forEach((e,i)=>expect(Math.abs(e.t-rows.at(-1)!.events[i].t)).toBeLessThanOrEqual(.5));
  expect(r.state.mission!.positionM).toBe(100);expect(r.state.mission!.velocityMS).toBe(0);
 }
 if(kind==='near-power-limiter')expect(reference.metrics.partialLossM3).toBeGreaterThan(0);
 const observation={address:'M09 refinement',kind,rows:rows.map(x=>({dt:x.dt,wallMs:x.wallMs,time:x.result.state.timeSeconds,mined:x.result.state.usefulWork,delivered:x.result.state.mission!.deliveredM3,fuel:x.result.metrics.fuelSpeciesKg,stage:x.result.state.mission!.stage,events:x.events}))};
 if(existsSync(".overgate-runtime/mission-medium-evidence"))writeFileSync(`.overgate-runtime/mission-medium-evidence/refinement-${kind}.json`,JSON.stringify(observation,null,2));
});
