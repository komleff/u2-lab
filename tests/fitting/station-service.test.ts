import { it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import old from './fixtures/station-service-old.json';
import coolingOracle from './fixtures/cooling-station-old-digest.json';
import { physicalResult } from './physical-result';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMissionRun, compareMissionConditions } from '../../src/scenarios/mission';
import { createRun, runChunk, result } from '../../src/runner/run';
import { stepV2 } from '../../src/model/v2/step';
import { parseExperimentJson } from '../../src/io/fitting-json';
import { parseResultJson } from '../../src/io/fitting-result';
import { conditionsFromSpec } from '../../src/app/fitting-ui/conditions';
import { FittingWorkspace } from '../../src/app/fitting-workspace';
import type { RunSpecV2 } from '../../src/model/v2/types';
const c=loadCandidateCatalog(),json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v),hash=(x:unknown)=>createHash('sha256').update(json(x)).digest('hex');
function spec(flag?:boolean){const f=getPresetFit('pony:2');f.initial.chargeFraction=.1;f.initial.fuelFraction.diesel=.5;const s=makeMissionRun(f,c,{durationSeconds:5,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:.2,targetM3:.01,repeat:false,...(flag===undefined?{}:{stationReplenish:flag})} as any);if(!s.ok)throw Error(json(s));return s.value;}
function run(s:RunSpecV2){const r=createRun('station',s);for(let n=0;n<100&&!r.done;n++)runChunk(r,100);expect(r.done).toBe(true);return r;}
function parsed(r:ReturnType<typeof result>){const p=parseResultJson(json(r));expect(p.ok,p.ok?'':json(p.errors)).toBe(true);}
it('ST01 fresh ON and explicit OFF readback compare independently; malformed flags refuse',()=>{
 const on=spec(),off=spec(false);expect((on.mission as any).stationReplenish).toBe(true);expect((off.mission as any).stationReplenish).toBe(false);
 expect((conditionsFromSpec(on) as any).stationReplenish).toBe(true);expect(compareMissionConditions(on,off).comparable).toBe(false);
 for(const value of [0,'true',null]){const bad=structuredClone(on);(bad.mission as any).stationReplenish=value;expect(parseExperimentJson(json(bad)).ok).toBe(false);}
});
for(const flag of [true,false])it(`ST02/ST03 actual endpoint ${flag?'ON':'OFF'} follows service physics without T/buffer/consumption reset`,()=>{
 const s=spec(flag),r=createRun('endpoint',s);while(r.state.mission!.stage!=='service')runChunk(r,1);
 const before=structuredClone(r.state);let expected=before;
 const endpoint=before.mission!.stageStartedSeconds+s.mission!.serviceSeconds;
 while(expected.timeSeconds<endpoint)expected=stepV2(s,expected,Math.min(.1,endpoint-expected.timeSeconds),{}).state;
 runChunk(r,1);expect(r.state.mission!.stage).toBe('service');expect((r.state.mission as any).receivedChargeJ).toBe(0);
 while(!r.done)runChunk(r,1);expect(r.state.cargo).toBe(0);expect(r.state.cyclesCompleted).toBe(1);
 expect(r.state.temperatureK).toBe(expected.temperatureK);expect(r.state.buffersJ).toEqual(expected.buffersJ);expect(r.state.consumptionKg).toEqual(expected.consumptionKg);
 const delta=flag?s.resolvedShip.batteryCapacityJ-expected.chargeJ:0;
 expect((r.state.mission as any).receivedChargeJ).toBe(delta);expect((r.metrics.mission as any).receivedChargeJ).toBe(delta);
 expect(r.state.chargeJ).toBe(flag?s.resolvedShip.batteryCapacityJ:expected.chargeJ);
 for(const sp of ['diesel','hydrogen'] as const){expect(r.state.fuelKg[sp]).toBe(flag?s.resolvedShip.resources[sp].capacityKg:expected.fuelKg[sp]);expect(r.state.mission!.receivedFuelKg[sp]).toBe(flag?s.resolvedShip.resources[sp].capacityKg-expected.fuelKg[sp]:0);}
 expect(r.last.chargeJ).toBe(r.state.chargeJ);expect(r.last.soc).toBe(r.state.chargeJ/s.resolvedShip.batteryCapacityJ);
 for(const i of s.resolvedShip.instances.filter(i=>i.item.family==='battery'))expect(r.last['storedJ:'+i.id]).toBe(r.state.chargeJ*i.item.numerics.capacityJ/s.resolvedShip.batteryCapacityJ);
 parsed(result(r));
});
it('ST04 horizon inside service has no refill; zero repeated recovery does not create shore charge',()=>{
 const s=spec(true);s.durationSeconds=old.miningSeconds+.1;const r=run(s);expect(r.state.mission!.stage).toBe('service');expect(r.state.cargo).toBeGreaterThan(0);expect((r.state.mission as any).receivedChargeJ).toBe(0);expect(r.state.mission!.receivedFuelKg.diesel).toBe(0);parsed(result(r));
 const hot=spec(true);hot.initial.temperatureK=600;hot.mission!.serviceSeconds=0;hot.scenario.repeat=true;hot.mission!.stopPolicy='first-stop';const z=createRun('zero-service',hot);expect(runChunk(z,1).steps).toBe(1);expect(z.state.timeSeconds).toBe(.1);expect(z.state.cyclesCompleted).toBe(0);expect((z.state.mission as any).receivedChargeJ).toBe(0);parsed(result(z,'cancelled'));
});
it('ST03 full Q/no tanks gives no negative refill; batteryless control remains rejected',()=>{
 const s=spec(true);s.initial.chargeJ=s.resolvedShip.batteryCapacityJ;s.initial.temperatureK=600;s.mission!.stopPolicy='first-stop';s.mission!.serviceSeconds=0;const r=run(s);expect((r.state.mission as any).receivedChargeJ).toBe(0);expect(r.state.mission!.receivedFuelKg.hydrogen).toBe(0);parsed(result(r));
 const bad=spec();bad.resolvedShip.batteryCapacityJ=0;bad.initial.chargeJ=0;expect(parseExperimentJson(json(bad)).ok).toBe(false);
});
it('ST05 captured pre-code legacy spec/result exactly replay and import without new keys',()=>{
 const s=old.spec as unknown as RunSpecV2;expect(hash(s)).toBe(old.digests.spec);const r=createRun('station-old-oracle',s);while(!r.done)runChunk(r,100);
 const measured=result(r);expect(coolingOracle.originalFullResultSHA256).toBe(old.digests.result);expect(hash(physicalResult(measured))).toBe(coolingOracle.physicalResultSHA256);
 expect(measured.events.filter(e=>e.kind!=='cooling-controls-version')).toEqual(coolingOracle.originalEvents);expect(measured.retention.totalEvents).toBe(coolingOracle.originalEventRetention.totalEvents+1);expect(measured.retention.droppedEvents).toBe(coolingOracle.originalEventRetention.droppedEvents);
 expect(measured.events.filter(e=>e.kind==='cooling-controls-version')).toHaveLength(1);expect((r.state.mission as any).receivedChargeJ).toBeUndefined();expect((r.metrics.mission as any).receivedChargeJ).toBeUndefined();
 parsed(result(r));const w=new FittingWorkspace(getPresetFit('pony:2'),c);expect(w.importDocument(json(result(r))).ok).toBe(true);expect(w.prepare()).toEqual({ok:true,value:s});
 const conditions=w.getSelected().conditions;expect((conditions as any).stationReplenish).toBeUndefined();expect(w.setConditions({...conditions,durationSeconds:10})).toBe(true);const next=w.prepare();if(!next.ok)throw Error(json(next));expect((next.value.mission as any).stationReplenish).toBe(false);
});
it('ST05 malformed received charge rejects atomically; valid roundtrip and A/active/next remain independent',()=>{
 const s=spec(true),r=result(run(s)),w=new FittingWorkspace(getPresetFit('pony:2'),c,conditionsFromSpec(s));expect(w.importDocument(json(r)).ok).toBe(true);expect(w.freeze()).toBe(true);const prior=w.snapshot();
 for(const value of [-1,null,'1']){const bad=structuredClone(r);(bad.state.mission as any).receivedChargeJ=value;expect(w.importDocument(json(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(prior);}
 const mismatch=structuredClone(r);(mismatch.metrics.mission as any).receivedChargeJ+=1e6;expect(w.importDocument(json(mismatch)).ok).toBe(false);expect(w.snapshot()).toEqual(prior);
 const start=w.start('owned');expect(start.ok).toBe(true);expect(w.setConditions({...w.getSelected().conditions,stationReplenish:false} as any)).toBe(true);expect(w.getActive()!.spec).toEqual(s);expect(w.getFrozen()).toEqual(r);
});
it('ST02/ST06 cumulative actual station charge over three short services may exceed battery capacity',()=>{
 const s=spec(true);s.scenario.repeat=true;s.scenario.targetM3=.0003;s.mission!.serviceSeconds=0;
 for(const i of s.resolvedShip.instances){if(i.item.family==='cargo'){i.item.numerics.cargoM3=.0001;s.resolvedShip.cargoCapacityM3[i.item.cargoType!]=.0001;}if(i.item.family==='battery')i.item.numerics.capacityJ=20000;if(i.item.family==='generator')i.item.numerics.powerW=0;}
 s.resolvedShip.batteryCapacityJ=20000;s.initial.chargeJ=16000;
 expect(parseExperimentJson(json(s)).ok).toBe(true);const r=createRun('cumulative',s);let sourceJ=0;
 while(!r.done){const t=r.state.timeSeconds;runChunk(r,1);sourceJ+=(['chemicalW','solarW','solarHostW','externalElectricW','directHeatW','radiationInW'].reduce((n,key)=>n+(r.last[key]??0),0))*(r.state.timeSeconds-t);}
 expect(r.state.cyclesCompleted).toBe(3);expect((r.state.mission as any).receivedChargeJ).toBeGreaterThan(20000);expect(r.state.chargeJ).toBe(20000);expect(r.metrics.sourceEnergyJ).toBeCloseTo(sourceJ,8);expect(r.metrics.usefulWork).toBeGreaterThan(0);parsed(result(r));
});
for(const species of ['diesel','hydrogen'] as const)it(`CR-ST-B1 forged OFF refuses positive ${species} receipt atomically while ON/absence remain legal`,()=>{
 let legacy=old.spec as unknown as RunSpecV2;
 if(species==='hydrogen'){
  const fit=getPresetFit('pony:2');fit.instances[fit.assignments['power-2']].itemId='generator-hydrogen-S';
  fit.assignments['power-3']='fit:power-3';fit.instances['fit:power-3']={id:'fit:power-3',itemId:'tank-hydrogen-S',enabled:true};
  fit.initial.fuelFraction.hydrogen=.5;
  const s=makeMissionRun(fit,c,{stationReplenish:undefined,durationSeconds:5,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:.2,targetM3:.01,repeat:false});
  if(!s.ok)throw Error(json(s));legacy=s.value;
 }
 const receipt=result(run(legacy));parsed(receipt);
 expect(receipt.spec.mission!.stationReplenish).toBeUndefined();expect(receipt.state.mission!.receivedFuelKg[species]).toBeGreaterThan(0);
 expect(receipt.state.mission!.receivedFuelKg[species==='diesel'?'hydrogen':'diesel']).toBe(0);
 const w=new FittingWorkspace(getPresetFit('pony:2'),c);expect(w.importDocument(json(receipt)).ok).toBe(true);expect(w.freeze()).toBe(true);const before=w.snapshot();
 const bad=structuredClone(receipt);bad.spec.mission!.stationReplenish=false;bad.state.mission!.receivedChargeJ=0;bad.metrics.mission!.receivedChargeJ=0;
 expect(parseExperimentJson(json(bad.spec)).ok).toBe(true);
 const rejected=parseResultJson(json(bad));console.info('CR-ST-B1', {species,receivedFuelKg:bad.state.mission!.receivedFuelKg,parserAccepted:rejected.ok});
 expect(rejected.ok).toBe(false);if(!rejected.ok)expect(rejected.errors.some(e=>e.path==='state.mission.receivedFuelKg.'+species&&e.message.includes('Выключенная'))).toBe(true);
 expect(w.importDocument(json(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(before);
 const on=structuredClone(legacy);on.mission!.stationReplenish=true;const positive=result(run(on));parsed(positive);expect(positive.state.mission!.receivedFuelKg[species]).toBeGreaterThan(0);expect(w.importDocument(json(positive)).ok).toBe(true);
});
