import {it,expect} from 'vitest';
import * as builders from '../../src/scenarios/ship-model-mission';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {validateRunSpecV3} from '../../src/model/v3/schema';
import {validateShipModelResult} from '../../src/io/ship-model-result';
export const missionSpec=(options={})=>{const c=loadCandidateCatalog('ship-fitting-0.3.2');const r=builders.makeShipModelMissionRun(getPresetFit('sputnik-d',c.version),c,options);if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;};
it('new contract is explicit and rejects partial mission, tags, negative cargo and forged roster',()=>{
 const s=missionSpec();expect(s.modelVersion).toBe('ship-fitting-ship-model-mission-0.1');expect(s.durationSeconds).toBe(3600);expect(s.environment.radiativeBackgroundK).toBe(250);expect(s.mission!.route.cruiseSpeedMS).toBe(500);
 for(const edit of [(x:any)=>delete x.mission,(x:any)=>x.initialState.modelVersion='ship-fitting-ship-model-0.1',(x:any)=>x.initialState.mission.onboardM3=-1,(x:any)=>x.mission.extra=1,(x:any)=>x.initialState.modules.forged=x.initialState.modules[Object.keys(x.initialState.modules)[0]]]){const x=structuredClone(s);edit(x);expect(validateRunSpecV3(x).ok).toBe(false);}
});
it('physical default hour repeats, accounts cargo and preserves exact checkpoint trajectory',()=>{
 const s=missionSpec(),run=createShipModelRun('mission',s),start=performance.now();runShipModelChunk(run,3600);const r=shipModelResult(run);
 console.log('MISSION_MEASURED',JSON.stringify({wallMs:performance.now()-start,mission:r.state.mission,services:r.events.filter(e=>e.kind==='mission-service'),residualJ:r.metrics.totalResidualJ}));
 expect(r.state.timeSeconds).toBe(3600);expect(r.state.mission!.completedTrips).toBeGreaterThanOrEqual(2);expect(r.state.mission!.minedM3).toBeCloseTo(r.state.mission!.deliveredM3+r.state.mission!.onboardM3,8);expect(Math.abs(r.metrics.totalResidualJ)).toBeLessThan(.1);expect(validateShipModelResult(r)).toMatchObject({ok:true});
 const partial=createShipModelRun('mission',s);runShipModelChunk(partial,1150);const restored=restoreShipModelRun(shipModelResult(partial,'paused'));runShipModelChunk(restored,3600);expect(shipModelResult(restored)).toEqual(r);
},20000);
it('distance changes physical schedule and no station receipt occurs before service endpoint',()=>{
 const a=createShipModelRun('a',missionSpec({distanceM:10000}));runShipModelChunk(a,1000);const b=createShipModelRun('b',missionSpec({distanceM:100000}));runShipModelChunk(b,1000);expect(a.state.mission!.stage).not.toBe(b.state.mission!.stage);
 const off=createShipModelRun('off',missionSpec({distanceM:0,stationReplenish:false}));runShipModelChunk(off,1200);expect(off.state.mission!.receivedChargeJ).toBe(0);expect(off.state.mission!.receivedFuelKg).toEqual({diesel:0,hydrogen:0});
});
it('first-stop waits for full selected-group stop; partial thermal limiting and one stopped laser keep mining',()=>{
 const s=missionSpec({stopPolicy:'first-stop'}),laser=s.resolvedShip.instances.find(i=>i.item.family==='mining')!;
 s.initialState.mission!.stage='mining';s.initialState.mission!.positionM=s.mission!.route.distanceM;s.initialState.temperatureK=(laser.item.gate.low+laser.item.gate.workLow)/2;
 const partial=createShipModelRun('partial',s);runShipModelChunk(partial,1);expect(partial.last.usefulWorkW).toBeGreaterThan(0);expect(partial.state.mission!.stage).toBe('mining');
 const c=loadCandidateCatalog('ship-fitting-0.3.2'),made=builders.makeShipModelMissionRun(getPresetFit('severin-mir-d',c.version),c,{stopPolicy:'first-stop'});if(!made.ok)throw Error(JSON.stringify(made.errors));const multi=made.value,ids=multi.mission!.selectedWorkGroup;expect(ids.length).toBeGreaterThan(1);multi.initialState.mission!.stage='mining';multi.initialState.mission!.positionM=multi.mission!.route.distanceM;const stop=(id:string)=>Object.assign(multi.initialState.modules[id],{durabilityR:-multi.resolvedShip.instances.find(i=>i.id===id)!.item.durability.emergencyDepthR,firstNegativeCrossing:true,durabilityStopped:true});stop(ids[0]);
 const one=createShipModelRun('one',multi);runShipModelChunk(one,1);expect(one.last.usefulWorkW).toBeGreaterThan(0);expect(one.state.mission!.stage).toBe('mining');
 for(const id of ids)stop(id);const none=createShipModelRun('none',multi);runShipModelChunk(none,1);expect(none.state.mission!.stage).toBe('inbound');expect(none.state.mission!.onboardM3).toBe(0);
});
