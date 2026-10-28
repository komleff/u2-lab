import {it,expect} from 'vitest';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {validateShipModelResult} from '../../src/io/ship-model-result';
import {validateRunSpecV3} from '../../src/model/v3/schema';
const spec=(x={})=>{const c=loadCandidateCatalog('ship-fitting-0.3.2'),s=makeShipModelMissionRun(getPresetFit('sputnik-d',c.version),c,x);if(!s.ok)throw Error(JSON.stringify(s.errors));return s.value;};
const sample=()=>{const run=createShipModelRun('policy',spec());runShipModelChunk(run,2);return shipModelResult(run,'paused');};
for(const reason of ['single-trip','target','first-stop'])it.each(['complete','paused','cancelled']as const)(`refuses forged ${reason} terminal under status %s across result and restore`,status=>{
 const r=sample();Object.assign(r.state.mission!,{stage:'complete',terminalReason:reason,positionM:0,velocityMS:0});r.status=status;expect(validateShipModelResult(r).ok).toBe(false);expect(()=>restoreShipModelRun(r)).toThrow();
});
it.each(['single-trip','target','first-stop'])('run initial state cannot bypass %s terminal policy',reason=>{const s=spec();Object.assign(s.initialState.mission!,{stage:'complete',terminalReason:reason});expect(validateRunSpecV3(s).ok).toBe(false);expect(()=>createShipModelRun('forged-initial',s)).toThrow();});
const forgeries=[['mining',0,0,0],['mining',100000,100,0],['approach',0,0,0],['approach',100000,0,100],['service',0,0,100],['service',1000,100,0]]as const;
it.each(forgeries)('refuses %s at x=%s/v=%s/clock=%s for results, checkpoints and initial experiments',(stage,positionM,velocityMS,stageElapsedSeconds)=>{
 const r=sample();Object.assign(r.state.mission!,{stage,positionM,velocityMS,stageElapsedSeconds});expect(validateShipModelResult(r).ok).toBe(false);expect(()=>restoreShipModelRun(r)).toThrow();
 const s=spec();Object.assign(s.initialState.mission!,{stage,positionM,velocityMS,stageElapsedSeconds});expect(validateRunSpecV3(s).ok).toBe(false);expect(()=>createShipModelRun('forged-stage',s)).toThrow();
});
it('actual target and single-trip endpoints, horizon completion and zero-duration stage boundaries remain valid',()=>{
 for(const repeat of [true,false]){const s=spec({distanceM:0,targetM3:1,repeat,approachSeconds:0,serviceSeconds:0}),run=createShipModelRun('actual',s);runShipModelChunk(run,3600);const r=shipModelResult(run);expect(r.state.mission!.terminalReason).toBe('target');expect(validateShipModelResult(r)).toMatchObject({ok:true});expect(()=>restoreShipModelRun(r)).not.toThrow();}
 const s=spec({distanceM:0,approachSeconds:0,serviceSeconds:0});s.initialState.mission!.stage='approach';expect(validateRunSpecV3(s)).toMatchObject({ok:true});s.initialState.mission!.stage='service';expect(validateRunSpecV3(s)).toMatchObject({ok:true});
});
it('single-trip needs a measured completed-service event, not a forged counter',()=>{const r=sample();r.spec.mission!.repeat=false;Object.assign(r.state.mission!,{stage:'complete',terminalReason:'single-trip',positionM:0,velocityMS:0,completedTrips:1});expect(validateShipModelResult(r).ok).toBe(false);});
it.each(['outbound','inbound']as const)('natural starved %s overshoot stays signed, finite, serializable and resumable',stage=>{
 const s=spec({distanceM:stage==='outbound'?10000:1000,durationSeconds:1000});s.initialState.fuelKg.diesel=1;
 if(stage==='inbound')Object.assign(s.initialState.mission!,{stage,positionM:s.mission!.route.distanceM,onboardM3:30,minedM3:30});
 const whole=createShipModelRun('starved-'+stage,s);runShipModelChunk(whole,500);const paused=shipModelResult(whole,'paused');expect(validateShipModelResult(paused)).toMatchObject({ok:true});const resumed=restoreShipModelRun(paused);runShipModelChunk(whole,500);runShipModelChunk(resumed,500);const r=shipModelResult(whole);expect(validateShipModelResult(r)).toMatchObject({ok:true});expect(shipModelResult(resumed)).toEqual(r);expect(r.state.mission!.stage).toBe(stage);if(stage==='outbound')expect(r.state.mission!.positionM).toBeGreaterThan(s.mission!.route.distanceM);else expect(r.state.mission!.positionM).toBeLessThan(0);
},20000);
it('initial single-trip cannot claim a service before its physical minimum elapsed time',()=>{const s=spec({repeat:false});s.initialState.timeSeconds=2;Object.assign(s.initialState.mission!,{stage:'complete',terminalReason:'single-trip',completedTrips:1});expect(validateRunSpecV3(s).ok).toBe(false);});
