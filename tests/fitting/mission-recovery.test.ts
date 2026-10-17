import { it, expect } from 'vitest';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMissionRun } from '../../src/scenarios/mission';
import { createRun, runChunk, result } from '../../src/runner/run';
import { parseResultJson } from '../../src/io/fitting-result';
import { mkdirSync, writeFileSync } from 'node:fs';
const catalog=loadCandidateCatalog();
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v);
function validResult(x:Parameters<typeof json>[0]){const p=parseResultJson(json(x));expect(p.ok,p.ok?'':JSON.stringify(p.errors.slice(0,8))).toBe(true);}
function put(f:ReturnType<typeof getPresetFit>,slot:string,itemId:string){const id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};}
function observe(f:ReturnType<typeof getPresetFit>,distanceM=100000,label=''){
 const s=makeMissionRun(f,catalog,{durationSeconds:3600,stepSeconds:.1,distanceM,repeat:true});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun(f.hullId+'-recovery',s.value),started=performance.now(),stages=[];
 let prior='';while(!r.done){runChunk(r,1);const m=r.state.mission!;if(prior!==m.stage){prior=m.stage;stages.push({t:r.state.timeSeconds,mission:structuredClone(m),cargo:r.state.cargo,fuel:{...r.state.fuelKg},charge:r.state.chargeJ});}
  expect(r.state.usefulWork).toBeCloseTo(m.deliveredM3+r.state.cargo,5);
  for(const sp of ['diesel','hydrogen'])expect(s.value.initial.fuelKg[sp]+m.receivedFuelKg[sp]-r.metrics.fuelSpeciesKg[sp]).toBeCloseTo(r.state.fuelKg[sp],5);
 }
 const native=result(r),evidenceDirectory='.overgate-runtime/mission-medium-fix-r1-evidence';
 mkdirSync(evidenceDirectory,{recursive:true});
 writeFileSync(`${evidenceDirectory}/recovery-${f.hullId}-${distanceM}${label}.json`,JSON.stringify({wallMs:performance.now()-started,stages,result:{spec:native.spec,state:native.state,metrics:native.metrics,events:native.events,retention:native.retention}},null,2));return native;
}
it('operator default PonyC repeat H3600 recovers thermal braking and keeps actual cycles running',()=>{
 const r=observe(getPresetFit('pony:3'));expect(r.state.timeSeconds).toBe(3600);expect(r.state.mission!.stage).not.toBe('stranded');expect(r.state.cyclesCompleted).toBeGreaterThanOrEqual(1);
 expect(r.events.some(e=>e.kind==='service')).toBe(true);expect(r.state.mission!.firstLimiter?.causes).not.toContain('cargo');validResult(r);
},120000);
it('feasible short PonyC full-hold repeat completes at least three real station services and new empty departures',()=>{
 const r=observe(getPresetFit('pony:3'),1000);expect(r.state.timeSeconds).toBe(3600);expect(r.state.cyclesCompleted).toBeGreaterThanOrEqual(3);expect(r.events.filter(e=>e.kind==='service').length).toBe(r.state.cyclesCompleted);expect(r.state.mission!.deliveredM3).toBeCloseTo(12*r.state.cyclesCompleted,5);
},120000);
it('operator Sputnik active radiators/battery/bulk fit does not terminate temporarily or invent missing fuel',()=>{
 const f=getPresetFit('sputnik:1');put(f,'power-1','battery-S');put(f,'payload-2','cargo-bulk-S');for(const slot of ['signature-1','signature-2'])put(f,slot,'radiator-active-S');
 const r=observe(f);expect(r.state.timeSeconds).toBe(3600);expect(r.state.mission!.stage).not.toBe('stranded');expect(r.events.some(e=>e.message==='Топливо исчерпано')).toBe(false);validResult(r);
},120000);
it('operator CivilianM two lasers/bulk192/two TI records actual electric stock limitation without absent-species fuel alarm',()=>{
 const f=getPresetFit('civilian-M:2');put(f,'payload-3','cargo-bulk-M');for(const slot of ['signature-1','signature-2'])put(f,slot,'thermoinverter-M');
 const r=observe(f);expect(r.events.some(e=>e.message.includes('Топливо исчерпано'))).toBe(false);if(r.state.timeSeconds<3600)expect(r.state.mission!.firstLimiter?.causes).toContain('power');validResult(r);
},120000);
it('absent H2 zero is not a diesel fuel failure; full hold is a normal event, not first failure',()=>{
 const s=makeMissionRun(getPresetFit('pony:3'),catalog,{durationSeconds:3600,distanceM:0,stepSeconds:.1,repeat:true});if(!s.ok)throw Error(JSON.stringify(s));const r=createRun('cargo-context',s.value);runChunk(r,1);
 expect(r.state.fuelKg.diesel).toBeGreaterThan(10000);expect(r.state.constraints.join('|')).not.toContain('Топливо исчерпано');expect(r.events.items().some(e=>e.message.includes('Топливо исчерпано'))).toBe(false);
 while(!r.done)runChunk(r,1000);expect(r.state.mission!.firstLimiter?.causes??[]).not.toContain('cargo');expect(r.events.items().some(e=>e.message.includes('mining')||e.message.includes('cargo'))).toBe(false);
},120000);
it('thermal overshoot continues real braking and correction with signed measured velocity; no early unload',()=>{
 const s=makeMissionRun(getPresetFit('pony:1'),catalog,{durationSeconds:3600,stepSeconds:.1,distanceM:100,repeat:false,targetM3:.01,approachSeconds:0,serviceSeconds:0});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun('correction',s.value);r.state.mission!.positionM=150;r.state.mission!.velocityMS=20;r.state.mission!.peakVelocityMS=20;r.state.mission!.flightMode='braking';r.state.temperatureK=600;runChunk(r,1);
 expect(r.done).toBe(false);expect(r.state.mission!.stage).toBe('outbound');expect(r.state.mission!.positionM).toBeGreaterThan(150);expect(r.state.cargo).toBe(0);expect(r.state.mission!.deliveredM3).toBe(0);
 let reversed=false;while(!r.done){runChunk(r,1);if(!reversed&&r.state.mission!.velocityMS<0){reversed=true;validResult(result(r,'paused'));}}
 expect(reversed).toBe(true);expect(r.state.mission!.stage).toBe('done');expect(r.state.mission!.velocityMS).toBe(0);expect(r.state.mission!.positionM).toBe(100);expect(r.metrics.fuelPurposeKg['diesel:propulsion']).toBeGreaterThan(0);
},120000);
it('E/H2-supplied M repeat retains refilled hydrogen and real battery after third station service',()=>{
 const f=getPresetFit('civilian-M:2');put(f,'power-1','generator-hydrogen-M');put(f,'power-2','tank-hydrogen-M');put(f,'power-3','battery-M');
 const r=observe(f,1000);expect(r.state.timeSeconds).toBe(3600);expect(r.state.cyclesCompleted).toBeGreaterThanOrEqual(3);expect(r.state.mission!.receivedFuelKg.hydrogen).toBeGreaterThan(0);expect(r.state.fuelKg.hydrogen).toBeGreaterThan(0);expect(r.state.mission!.stage).not.toBe('stranded');
 expect(r.events.some(e=>e.message.includes('дизель исчерпан')||e.message.includes('Топливо исчерпано'))).toBe(false);validResult(r);
},120000);

it('operator-like M two TI/two lasers/bulk192 with explicit H2 supply distinguishes live fuel from electric allocation',()=>{
 const f=getPresetFit('civilian-M:2');put(f,'payload-3','cargo-bulk-M');for(const slot of ['signature-1','signature-2'])put(f,slot,'thermoinverter-M');put(f,'power-1','solar-M');put(f,'power-2','generator-hydrogen-M');put(f,'power-3','tank-hydrogen-M');put(f,'power-4','battery-M');
 const r=observe(f,100000,'-H2-two-TI');expect(r.state.timeSeconds).toBe(3600);expect(r.state.mission!.stage).not.toBe('stranded');expect(r.state.fuelKg.hydrogen).toBeGreaterThan(0);expect(r.metrics.fuelPurposeKg['hydrogen:generator']).toBeGreaterThan(0);expect(r.events.some(e=>e.message.includes('Топливо исчерпано')||e.message.includes('водород исчерпан'))).toBe(false);validResult(r);
},120000);
