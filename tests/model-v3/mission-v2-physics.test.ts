import{it,expect}from'vitest';
import{getPresetFit,loadCandidateCatalog}from'../../src/fitting/catalog';import{makeShipModelMissionRun}from'../../src/scenarios/ship-model-mission';
import{createShipModelRun,runShipModelChunk}from'../../src/runner/ship-model-run';
import{weak,ermak}from'./mission-v2-fixture';
it.each([210,300,525])('EF02 actual D thrust/cargo/fuel and gates reach the field from %sK without a coordinate shortcut',T=>{
 const s=ermak('active2',300);s.initialState.temperatureK=T;s.mission!.route={...s.mission!.route,distanceM:5000,speedPolicy:'custom',cruiseSpeedMS:100};s.initialState.mission!.velocityMS=50;
 const run=createShipModelRun('thermal-'+T,s),fuel=run.state.fuelKg.diesel;while(run.state.mission!.stage==='outbound'&&run.state.timeSeconds<300){runShipModelChunk(run,1);expect(Math.abs(run.last.totalResidualJ??0)).toBeLessThan(1e-4);}
 expect(run.state.mission!.stage).not.toBe('outbound');expect(run.state.mission!.positionM).toBe(5000);expect(run.state.mission!.velocityMS).toBe(0);expect(run.state.fuelKg.diesel).toBeLessThan(fuel);
});
it('EF02 mixed D/H roles spend each actual tank and brake with paid hydrogen thrust',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('sputnik-d',c.version);f.instances['fit:retro'].itemId='engine-hydrogen-S-single';f.instances['fit:power-2'].itemId='tank-hydrogen-S';f.initial.fuelFraction.hydrogen=1;
 const r=makeShipModelMissionRun(f,c,{durationSeconds:300,temperatureK:300,backgroundK:250,distanceM:5000,speedPolicy:'custom',cruiseSpeedMS:100});if(!r.ok)throw Error(JSON.stringify(r.errors));const run=createShipModelRun('mixed',r.value),initial=structuredClone(run.state.fuelKg);while(run.state.mission!.stage==='outbound'&&run.state.timeSeconds<300)runShipModelChunk(run,1);
 expect(run.state.mission!.positionM).toBe(5000);expect(run.state.mission!.velocityMS).toBe(0);expect(run.state.fuelKg.diesel).toBeLessThan(initial.diesel);expect(run.state.fuelKg.hydrogen).toBeLessThan(initial.hydrogen);
});
it('EF02 an empty installed energy source creates no impulse, station input or fictitious service',()=>{
 const s=weak(1200);s.initialState.fuelKg={diesel:0,hydrogen:0};s.initialState.chargeJ=0;const run=createShipModelRun('no-energy',s);runShipModelChunk(run,1200);
 expect(run.state.mission!.completedTrips).toBe(0);expect(run.state.mission!.deliveredM3).toBe(0);expect(run.state.mission!.onboardM3).toBe(30);expect(run.state.mission!.receivedFuelKg.diesel).toBe(0);expect(run.state.mission!.positionM).toBeCloseTo(500000-450*1200,6);expect(run.state.mission!.velocityMS).toBe(-450);expect(run.last['actualW:fit:march']).toBe(0);
});
it('EF02 cold critical no-force is honest motion, never an arrival from crossing the coordinate',()=>{
 const s=ermak('none',100);s.initialState.temperatureK=190;s.mission!.route.distanceM=5000;s.initialState.mission!.velocityMS=50;const run=createShipModelRun('cold-critical',s);runShipModelChunk(run,100);expect(run.state.mission!.stage).toBe('outbound');expect(run.state.mission!.velocityMS).toBe(50);expect(run.state.mission!.completedTrips).toBe(0);
});
it.each(['none','passive3','active2']as const)('EF01 entire %s repeated10800s route never substitutes service for an overshoot',kind=>{
 const run=createShipModelRun('cycles',ermak(kind));let min=0;while(!run.done){runShipModelChunk(run,1);if(run.state.mission!.stage==='inbound')min=Math.min(min,run.state.mission!.positionM);}
 expect(min).toBeGreaterThanOrEqual(-1e-3);expect(run.state.mission!.completedTrips).toBeGreaterThan(1);expect(run.state.mission!.deliveredM3).toBeCloseTo(run.state.mission!.completedTrips*36,5);
});
