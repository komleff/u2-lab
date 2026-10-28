import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
import {stepShipModelMission} from '../../src/runner/ship-model-mission';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
function spec(T:number,duration=10){const c=loadCandidateCatalog('ship-fitting-0.3.4'),r=makeShipModelMissionRun(getPresetFit('sputnik-d',c.version),c,{temperatureK:T,durationSeconds:duration,serviceSeconds:duration,repeat:false,stationReplenish:false});if(!r.ok)throw Error(JSON.stringify(r));r.value.initialState.mission!.stage='service';return r.value;}
it.each([250,300,500])('TF07 powered-off dock at %s K integrates actual radiation/contact without onboard burn',T=>{
 const s=spec(T),state=structuredClone(s.initialState),out=stepShipModelMission(s,state);
 expect(out.state.fuelKg).toEqual(state.fuelKg);expect(out.state.chargeJ).toBe(state.chargeJ);expect(out.state.modules).toEqual(state.modules);expect(out.state.rng).toEqual(state.rng);expect(out.state.surfaceOpen).toEqual(state.surfaceOpen);expect(out.state.buffers).toEqual(state.buffers);
 expect(out.telemetry.deliveredW??0).toBe(0);expect(out.telemetry.generatorW??0).toBe(0);expect(out.telemetry.hangarExchangeJ).toBeDefined();
 if(T===300)expect(out.state.temperatureK).toBe(300);else expect((out.state.temperatureK-T)*(300-T)).toBeGreaterThan(0);
});
it('TF07 real service checkpoint resumes exactly, old mission does not gain hangar semantics',()=>{
 const s=spec(500,10),a=createShipModelRun('dock',s);runShipModelChunk(a,5);const b=restoreShipModelRun(shipModelResult(a));runShipModelChunk(a,5);runShipModelChunk(b,5);expect(shipModelResult(b)).toEqual(shipModelResult(a));expect(a.state.temperatureK).toBeGreaterThan(300);expect(a.state.temperatureK).toBeLessThan(500);
 const c=loadCandidateCatalog('ship-fitting-0.3.3'),old=makeShipModelMissionRun(getPresetFit('sputnik-d',c.version),c);if(!old.ok)throw Error('old');old.value.initialState.mission!.stage='service';expect(stepShipModelMission(old.value,old.value.initialState).telemetry.hangarExchangeJ).toBeUndefined();
});

import {stepStationService} from '../../src/model/v3/station-service';
import {STEFAN_BOLTZMANN} from '../../src/model/v3/thermal-surfaces';
it.each([250,300,500])('TF07 ten-second and long dock converge to independent midpoint reference from %s K',T=>{
 const s=spec(T,3600),state=s.initialState,C=s.resolvedShip.heatCapacityJK,K=s.resolvedShip.hull.bodyExchangeAreaM2*s.resolvedShip.hull.bodyEmissivity+s.resolvedShip.surfaces.filter(x=>!x.active||state.surfaceOpen[x.id]).reduce((n,x)=>n+x.areaM2*x.emissivity,0);
 const rate=(x:number)=>-(STEFAN_BOLTZMANN*K*(x**4-300**4)+10000*(x-300))/C;
 for(const duration of [10,3600]){let reference=T;const dt=.1;for(let t=0;t<duration-1e-8;t+=dt)reference+=rate(reference+rate(reference)*dt/2)*dt;
  const one=stepStationService(s,state,duration),split=stepStationService(s,stepStationService(s,state,duration/2).state,duration/2);
  expect(one.state.temperatureK).toBeCloseTo(reference,2);expect(one.state.temperatureK).toBeCloseTo(split.state.temperatureK,6);expect((one.state.temperatureK-300)*(T-300)).toBeGreaterThanOrEqual(0);
 }
 expect(stepStationService(s,state,0).state).toEqual(state);
});
it('TF07 closed panels stay closed; already open panels exchange without pump; replacement only changes subsequent C',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('sputnik-d',c.version);f.assignments['signature-2']='fit:signature-2';f.instances['fit:signature-2']={id:'fit:signature-2',itemId:'radiator-active-S',enabled:true};const r=makeShipModelMissionRun(f,c,{temperatureK:500});if(!r.ok)throw Error('fit');const s=r.value,id=s.resolvedShip.surfaces.find(x=>x.active)!.id,closed=stepStationService(s,s.initialState,10),open=structuredClone(s.initialState);open.surfaceOpen[id]=true;
 const cooled=stepStationService(s,open,10);expect(cooled.state.temperatureK).toBeLessThan(closed.state.temperatureK);expect(cooled.state.surfaceOpen[id]).toBe(true);expect(closed.state.surfaceOpen[id]).toBe(false);expect(cooled.state.chargeJ).toBe(open.chargeJ);
 const altered={...s,resolvedShip:{...s.resolvedShip,heatCapacityJK:s.resolvedShip.heatCapacityJK*2}};expect(closed.state.temperatureK).toBe(stepStationService(altered,closed.state,0).state.temperatureK);expect(stepStationService(altered,closed.state,10).state.temperatureK).toBeGreaterThan(stepStationService(s,closed.state,10).state.temperatureK);
});
