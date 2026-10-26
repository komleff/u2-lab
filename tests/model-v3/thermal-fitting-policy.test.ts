import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {stepV3} from '../../src/model/v3/step';
function spec(id='sputnik-d',T=300,heater=false){const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit(id,c.version);if(heater){f.assignments['signature-2']='fit:signature-2';f.instances['fit:signature-2']={id:'fit:signature-2',itemId:'electric-heater-S',enabled:true};}const r=makeShipModelMiningRun(f,c,{temperatureK:T,action:'idle',backgroundK:3});if(!r.ok)throw Error(JSON.stringify(r));return r.value;}
it('TF12 new source hysteresis uses class threshold rather than bypassing battery on every deficit',()=>{
 for(const [id,on] of [['sputnik-d',.9],['pony-d',.95]] as const){const s=spec(id),a=stepV3(s,s.initialState,{},'idle');expect(a.telemetry.generatorW,id).toBe(0);const state=structuredClone(s.initialState);state.chargeJ=s.resolvedShip.batteryCapacityJ*on;expect(stepV3(s,state,{},'idle').telemetry.generatorW,id).toBeGreaterThan(0);}
});
it('TF12 cold225/230 latch controls physical heater, not the previous global warm-up band',()=>{
 const s=spec('sputnik-d',240,true);expect(stepV3(s,s.initialState,{},'idle').telemetry['actualW:fit:signature-2']).toBe(0);
 s.initialState.temperatureK=224;const cold=stepV3(s,s.initialState,{},'idle');expect(cold.telemetry['actualW:fit:signature-2']).toBeGreaterThan(0);
 const warming={...cold.state,temperatureK:228};expect(stepV3(s,warming,{},'idle').telemetry['actualW:fit:signature-2']).toBeGreaterThan(0);
 expect(stepV3(s,{...warming,temperatureK:230},{},'idle').telemetry['actualW:fit:signature-2']).toBe(0);
});
it('TF02 accepted diesel F08 separates raw/bus and actual fuel/host/external exactly once',()=>{
 const s=spec(),g=s.resolvedShip.instances.find(i=>i.item.family==='generator')!;s.initialState.chargeJ=s.resolvedShip.batteryCapacityJ*.5;
 const r=stepV3(s,s.initialState,{},'idle'),bus=r.telemetry.generatorW,chemical=(s.initialState.fuelKg.diesel-r.state.fuelKg.diesel)*43e6;
 expect(g.item.numerics.ratedOutputBeforePathW).toBe(500000);expect(bus).toBe(450000);expect(chemical).toBeCloseTo(bus/.9/.35,3);
 const host=r.telemetry.hostHeatW+r.telemetry.escapedEmW-r.telemetry.converterLossW-s.resolvedShip.hull.hullPowerW;
 const external=(chemical-500000)*.45;expect(host).toBeCloseTo(50000+(500000/.35-500000)*.55,4);expect(chemical-bus-host-external).toBeCloseTo(0,3);
 const genBefore=s.initialState.modules[g.id].durabilityR,working=bus/g.item.numerics.powerW;
 expect(genBefore-r.state.modules[g.id].durabilityR).toBeCloseTo(g.item.durability.wearPerWorkSecond*working,12);
});
it('TF04 physical body area retains radiation K while using actual area in thermal field',()=>{
 const s=spec();expect(s.resolvedShip.hull.bodyExchangeAreaM2).toBe(537);expect(s.resolvedShip.hull.bodyEmissivity).toBe(.85);
 s.environment.thermalField={temperatureK:290,coefficientWPerM2K:10,sourceId:'test-field'};const r=stepV3(s,s.initialState,{},'idle');expect(r.frames[0].body.fieldW).toBe(537*10*10);
});
it('TF12 accepted background floor sheds only explicitly deferrable load, keeping hull power',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('sputnik-d',c.version),i=f.instances['fit:payload-1'],m=structuredClone(c.items[i.itemId]);m.id='deferred-mining-test';m.operationPolicy='deferrable-background';f.localVariants[m.id]=m;i.itemId=m.id;
 const made=makeShipModelMiningRun(f,c,{action:'work',durationSeconds:1});if(!made.ok)throw Error('spec');const s=made.value;s.initialState.chargeJ=s.resolvedShip.batteryCapacityJ*.79;
 const r=stepV3(s,s.initialState,{'fit:payload-1':1},'work');expect(r.telemetry['actualW:fit:payload-1']).toBe(0);expect(r.telemetry.deliveredW).toBeGreaterThan(0);
});
it.each([.25,1])('TF02 diesel engine duty%s sends forty percent of chemical-minus-useful losses to hull',duty=>{
 const s=spec(),engine=s.resolvedShip.instances.find(i=>i.role==='march')!,n=engine.item.numerics;
 const r=stepV3(s,s.initialState,{[engine.id]:duty},'maneuver'),chemical=n.forceN*n.alpha*duty*43e6,useful=chemical*n.efficiency*n.pathEfficiency;
 const host=r.telemetry.hostHeatW+r.telemetry.escapedEmW-r.telemetry.converterLossW-s.resolvedShip.hull.hullPowerW;
 expect(host).toBeCloseTo((chemical-useful)*.4,6);expect((s.initialState.fuelKg.diesel-r.state.fuelKg.diesel)*43e6).toBeCloseTo(chemical,3);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
});
