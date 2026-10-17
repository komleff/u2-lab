import { it, expect } from 'vitest';
import { existsSync, writeFileSync } from 'node:fs';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { compileFit } from '../../src/fitting/compile';
import { makeMissionRun } from '../../src/scenarios/mission';
import { makeMiningRun } from '../../src/scenarios/fitting';
import { createRun, runChunk, result } from '../../src/runner/run';
const c=loadCandidateCatalog();
for(const distanceM of [0,100000,1000000])for(const count of [1,2,3])it(`M09 Pony${count} H3600 ${distanceM/1000}km observes actual ore delivery, unfinished phases and fuel balance`,()=>{
 const f=getPresetFit('pony:'+count);for(let i=count;i<=2;i++){const slot='payload-'+i,id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId:'cargo-bulk-S',enabled:true};}
 const ship=compileFit(f,c);if(!ship.ok)throw Error(JSON.stringify(ship));expect(ship.value.cargoCapacityM3.bulk+ship.value.cargoCapacityM3.universal).toBe([60,36,12][count-1]);
 const s=makeMissionRun(f,c,{durationSeconds:3600,stepSeconds:.1,distanceM,cruiseSpeedMS:null,stopPolicy:'full-hold'});if(!s.ok)throw Error(JSON.stringify(s));expect(s.value.selectedWorkGroup).toHaveLength(count);expect(s.value.selectedWorkGroup).toContain('builtin:laser');
 const start=performance.now(),r=createRun('Pony'+count+':'+distanceM,s.value);let chunks=0;while(!r.done){runChunk(r,20000);chunks++;}const native=result(r),m=native.state.mission!;
 expect(native.state.timeSeconds).toBeLessThanOrEqual(3600);expect(native.state.usefulWork).toBeCloseTo(m.deliveredM3+native.state.cargo,6);
 for(const sp of ['diesel','hydrogen'])expect(native.spec.initial.fuelKg[sp]+m.receivedFuelKg[sp]-native.metrics.fuelSpeciesKg[sp]).toBeCloseTo(native.state.fuelKg[sp],5);
 expect(m.elapsed.flight+m.elapsed.approach+m.elapsed.mining+m.elapsed.service).toBeCloseTo(native.state.timeSeconds,5);
 if(m.stage==='outbound')expect(m.deliveredM3).toBe(0);if(m.deliveredM3>0)expect(native.events.some(e=>e.kind==='service')).toBe(true);
 expect(native.state.timeSeconds).toBe(3600);expect(m.stage).not.toBe("stranded");expect(m.velocityMS).toBeLessThan(3000);
 const observation={address:'M09 H3600',count,distanceM,hold:ship.value.cargoCapacityM3.bulk+ship.value.cargoCapacityM3.universal,time:native.state.timeSeconds,wallMs:performance.now()-start,chunks,ticks:native.retention.totalTicks,stage:m.stage,mode:m.flightMode,position:m.positionM,velocity:m.velocityMS,peak:m.peakVelocityMS,mined:native.state.usefulWork,delivered:m.deliveredM3,onboard:native.state.cargo,cycles:native.metrics.cyclesCompleted,scuHour:native.metrics.mission!.deliveredScuPerHour,kUse:native.metrics.kUseHorizon,fuel:native.metrics.fuelSpeciesKg,received:m.receivedFuelKg,remaining:native.state.fuelKg,elapsed:m.elapsed,firstLimiter:m.firstLimiter,events:native.events};
 if(existsSync(".overgate-runtime/mission-medium-evidence"))writeFileSync(`.overgate-runtime/${existsSync(".overgate-runtime/mission-medium-fix-r1-evidence")?"mission-medium-fix-r1-evidence":"mission-medium-evidence"}/Pony${count}-${distanceM}.json`,JSON.stringify(observation,null,2));
},120000);
it('M09 recorded short timed baseline uses preserved direct API, not a renamed physical voyage',()=>{const s=makeMiningRun(getPresetFit('pony:1'),c,{durationSeconds:20,stepSeconds:.1});if(!s.ok)throw Error(JSON.stringify(s));const started=performance.now(),r=createRun('short-timed',s.value);while(!r.done)runChunk(r,20000);console.log(JSON.stringify({address:'M09 short timed baseline',time:r.state.timeSeconds,ticks:r.retention.totalTicks,wallMs:performance.now()-started,model:s.value.modelVersion,mined:r.state.usefulWork}));expect(r.state.mission).toBeUndefined();expect(r.state.timeSeconds).toBe(20);});
