import{expect,it}from'vitest';
import{getPresetFit,loadCandidateCatalog}from'../../src/fitting/catalog';
import{makeShipModelMissionRun}from'../../src/scenarios/ship-model-mission';
import{createShipModelRun,runShipModelChunk}from'../../src/runner/ship-model-run';
import{ermak}from'./mission-v2-fixture';
it('EF05 fresh current mission explicitly selects2; explicit1 and older catalogs stay1',()=>{
 const s=ermak();expect(s.mission!.version).toBe('ship-mission/2');
 const c=loadCandidateCatalog('ship-fitting-0.3.3'),f=getPresetFit('ermak-d',c.version),old=makeShipModelMissionRun(f,c);expect(old.ok&&old.value.mission!.version).toBe('ship-mission/1');
 const fit=getPresetFit('ermak-d','ship-fitting-0.3.4'),explicit=makeShipModelMissionRun(fit,loadCandidateCatalog('ship-fitting-0.3.4'),{mission:{...s.mission!,version:'ship-mission/1'}});expect(explicit.ok&&explicit.value.mission!.version).toBe('ship-mission/1');
});
it('EF01 stable paid thrust reaches the station without missed coast boundary or finite overshoot',()=>{
 const run=createShipModelRun('E4',ermak());let min=0;while(run.state.mission!.completedTrips<1&&run.state.timeSeconds<1200){runShipModelChunk(run,1);min=Math.min(min,run.state.mission!.positionM);}
 expect(min).toBeGreaterThanOrEqual(-1e-3);expect(run.state.mission!.completedTrips).toBe(1);expect(run.state.mission!.deliveredM3).toBeCloseTo(36,6);
});
import{stepMissionV2}from'../../src/runner/ship-model-flight-v2';
it('EF02 a fractional cruise event reports outer-interval mean force from its actual paid impulse',()=>{
 const s=ermak('active2',2);s.initialState.mission!.velocityMS=449.9;
 const out=stepMissionV2(s,s.initialState),dt=out.state.timeSeconds-s.initialState.timeSeconds;
 expect(out.telemetry['impulseNs:march']).toBeGreaterThan(0);
 expect(out.telemetry['forceN:march']).toBeCloseTo(out.telemetry['impulseNs:march']/dt,6);
});
