import { expect, it } from 'vitest';
import { stepV3 } from '../../src/model/v3/step';
import { fixture } from './fixture';
import {runtimeFixture,install} from './runtime-fixture';
function isolated(){
  const s=fixture('stealth-reference'),ship=s.resolvedShip;
  ship.heatCapacityJK=20e6;ship.hull.hullPowerW=0;ship.hull.bodyExchangeAreaM2=0;ship.surfaces=[];
  for(const i of ship.instances)i.enabled=['battery','mining','buffer'].includes(i.item.family);
  const mining=ship.instances.find(i=>i.item.family==='mining')!;mining.item.numerics={powerW:1e6,efficiency:0};
  for(const i of ship.instances)i.item.gate={low:200,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};
  s.initialState.temperatureK=490;s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=490;
  return {s,mining,buffer:ship.instances.find(i=>i.item.family==='buffer')!};
}
it('production authorization precedes every requested laser ledger; Masking and critical costs persist',()=>{
  const s=fixture('stealth-reference'),id=s.resolvedShip.instances.find(i=>i.item.family==='mining')!.id;
  s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=s.initialState.temperatureK;
  const baseline=stepV3(s,s.initialState,{}),blocked=stepV3(s,s.initialState,{[id]:1});
  expect(blocked.state.mode).toBe('Masking');expect(blocked.telemetry.usefulWorkW).toBe(0);
  expect(blocked.telemetry.deliveredW).toBeGreaterThan(0);expect(blocked.telemetry).toEqual(baseline.telemetry);
  expect(blocked.diagnostics.some(x=>x.instanceId===id&&x.reason==='masking-forbidden')).toBe(true);
});
it('production CP-04 E depletion at .45s delivers 450kJ, retains 50kJ conversion loss, then stops unpaid work',()=>{
  const {s,mining}=isolated();s.initialState.mode='Efficient';s.initialState.maskingEntryTemperatureK=null;s.initialState.chargeJ=500000;
  const r=stepV3(s,s.initialState,{[mining.id]:1});
  expect(r.state.chargeJ).toBe(0);expect(r.telemetry.deliveredW).toBeCloseTo(450000,8);
  expect(r.telemetry.converterLossW).toBeCloseTo(50000,8);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,7);
});
it('production CP-04 buffer saturates at .5s and remaining 500kJ raises T to 490.025K',()=>{
  const {s,buffer}=isolated();s.environment.directHeat=[{sourceId:'CP-04',powerW:1e6}];
  s.resolvedShip.bufferCapacityJ[buffer.id]=1e9;buffer.item.numerics={capacityJ:1e9,chargePowerW:2e6,dischargePowerW:2e6};
  s.initialState.buffers[buffer.id]={storedJ:999500000,minimumCaptureK:490};
  const r=stepV3(s,s.initialState,{});expect(r.state.buffers[buffer.id].storedJ).toBe(1e9);expect(r.state.temperatureK).toBeCloseTo(490.025,10);
  expect(r.telemetry.bufferCaptureW).toBe(500000);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,7);
});
it.each([false,true])('production stops actual work exactly at its hot boundary, Military=%s',military=>{
  const {s,mining,buffer}=isolated();buffer.enabled=false;s.initialState.mode='Combat';s.initialState.maskingEntryTemperatureK=null;s.initialState.temperatureK=599.99;
  s.resolvedShip.hull.class=military?'Military':'Civilian';mining.item.gate.workHigh=600;mining.item.gate.high=600.001;
  s.environment.directHeat=[{sourceId:'CP-04-critical',powerW:1e6}];mining.item.gate.high=600;mining.item.gate.workHigh=599.995;
  const r=stepV3(s,s.initialState,{[mining.id]:1});
  expect(r.state.modules[mining.id].thermalStopped).toBe(true);expect(r.telemetry['actualW:'+mining.id]).toBeGreaterThan(0);
  expect(r.telemetry['actualW:'+mining.id]).toBeLessThan(1e6);expect(r.diagnostics.some(x=>x.reason==='critical-hot')).toBe(true);
  expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
it('production CP-04 critical boundary is reached at .2s by isolated 1MW/20MJ per K heating',()=>{
  const {s,mining,buffer}=isolated();buffer.enabled=false;s.initialState.temperatureK=599.99;s.environment.directHeat=[{sourceId:'CP-04-critical',powerW:1e6}];
  const r=stepV3(s,s.initialState,{}),event=r.diagnostics.find(x=>x.instanceId===mining.id&&x.reason==='critical-hot')!;
  expect(event.timeSeconds).toBeCloseTo(0.2,9);expect(r.state.modules[mining.id].thermalStopped).toBe(true);expect(r.telemetry['actualW:'+mining.id]).toBe(0);
});
it.each(['Efficient','Combat','Masking'] as const)('production ordinary hot/cold and Military-only hot override in %s count accelerated wear',mode=>{
  for(const hullClass of ['Civilian','Military']as const)for(const moduleClass of ['Civilian','Military']as const)for(const temperatureK of [250,550]){
    const s=runtimeFixture(temperatureK),sensor=install(s,'sensor-S');s.resolvedShip.hull.class=hullClass;sensor.item.class=moduleClass;sensor.item.numerics.powerW=1e6;sensor.item.gate={low:200,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};
    s.initialState.mode=mode;s.initialState.maskingEntryTemperatureK=mode==='Masking'?temperatureK:null;sensor.item.durability.wearPerWorkSecond=0.01;
    const r=stepV3(s,s.initialState,{}),override=mode==='Combat'&&hullClass==='Military'&&temperatureK>500;
    expect(r.telemetry['actualW:'+sensor.id]).toBe(override?1e6:500000);expect(r.state.modules[sensor.id].durabilityR).toBeCloseTo(1-(override?0.015:0.0075),12);
  }
});
it.each([200,600])('production exact critical %s stops actual operation while passive exchange remains',temperatureK=>{
  const s=runtimeFixture(temperatureK),sensor=install(s,'sensor-S');sensor.item.gate={low:200,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};s.resolvedShip.hull.bodyExchangeAreaM2=100;
  const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+sensor.id]).toBe(0);expect(r.state.modules[sensor.id].thermalStopped).toBe(true);expect(r.telemetry.radiationW).not.toBe(0);
});
it('production cold crossing clips at its exact boundary; restored temperature still obeys durability/cooldown',()=>{
  const s=runtimeFixture(200.01),sensor=install(s,'sensor-S');sensor.item.gate={low:200,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};s.environment.thermalField={sourceId:'cold',temperatureK:100,coefficientWPerM2K:100};s.resolvedShip.hull.bodyExchangeAreaM2=100;
  const cold=stepV3(s,s.initialState,{});expect(cold.diagnostics.some(x=>x.instanceId===sensor.id&&x.reason==='critical-cold')).toBe(true);expect(cold.state.modules[sensor.id].thermalStopped).toBe(true);
  cold.state.temperatureK=400;cold.state.modules[sensor.id].durabilityR=-0.1;cold.state.modules[sensor.id].firstNegativeCrossing=true;cold.state.modules[sensor.id].restartAuthorized=true;cold.state.modules[sensor.id].cooldownSeconds=5;
  const restart=stepV3(s,cold.state,{});expect(restart.state.modules[sensor.id].thermalStopped).toBe(false);expect(restart.telemetry['actualW:'+sensor.id]).toBe(0);expect(restart.state.modules[sensor.id].durabilityR).toBe(-0.1);expect(restart.state.modules[sensor.id].firstNegativeCrossing).toBe(true);
});
it('production power/fuel/R gates bind Military Combat output; exact R=0 is not a stop',()=>{
  const s=runtimeFixture(550),sensor=install(s,'sensor-S');s.resolvedShip.hull.class='Military';s.initialState.mode='Combat';sensor.item.gate.high=600;sensor.item.numerics.powerW=1e6;
  s.initialState.chargeJ=0;expect(stepV3(s,s.initialState,{}).telemetry['actualW:'+sensor.id]).toBe(0);
  s.initialState.chargeJ=1e9;s.initialState.modules[sensor.id].durabilityR=-sensor.item.durability.emergencyDepthR;expect(stepV3(s,s.initialState,{}).telemetry['actualW:'+sensor.id]).toBe(0);
  s.initialState.modules[sensor.id].durabilityR=0;sensor.item.durability.wearPerWorkSecond=0;expect(stepV3(s,s.initialState,{}).telemetry['actualW:'+sensor.id]).toBe(1e6);
  const engine=install(s,'engine-diesel-S-single');expect(stepV3(s,s.initialState,{[engine.id]:1}).telemetry['actualW:'+engine.id]).toBe(0);
});
it('production furnace needs delivered auxiliary electricity, clips fuel depletion, and closes chemical/thermal balance',()=>{
  const s=runtimeFixture(205),furnace=install(s,'furnace-diesel-S');furnace.item.gate={low:100,workLow:200,workHigh:500,high:600,restartLow:210,restartHigh:490};s.environment.radiativeBackgroundK=100;s.environment.thermalField={sourceId:'cold',temperatureK:100,coefficientWPerM2K:1};s.resolvedShip.hull.bodyExchangeAreaM2=1;
  s.resolvedShip.resources.diesel.capacityKg=1;s.initialState.fuelKg.diesel=0.5e6/s.resolvedShip.resources.diesel.energyJKg;s.initialState.chargeJ=1e9;
  const heated=stepV3(s,s.initialState,{});expect(heated.state.fuelKg.diesel,JSON.stringify(heated)).toBe(0);expect(heated.state.temperatureK).toBeGreaterThan(s.initialState.temperatureK);expect(heated.state.governor.heatingStageId).toBe('furnace');expect(heated.telemetry.totalResidualJ).toBeCloseTo(0,6);
  s.initialState.chargeJ=0;const unpowered=stepV3(s,s.initialState,{});expect(unpowered.state.fuelKg.diesel).toBe(s.initialState.fuelKg.diesel);expect(unpowered.state.temperatureK).toBeLessThan(s.initialState.temperatureK);expect(unpowered.diagnostics.some(x=>x.reason==='heating-unavailable')).toBe(true);
});
it('cold-stopped battery/gen cannot power warmup from fuel alone; independent electrical input can',()=>{
  const s=runtimeFixture(230),heater=install(s,'electric-heater-S'),generator=install(s,'generator-diesel-S');heater.item.gate={low:100,workLow:200,workHigh:500,high:600,restartLow:210,restartHigh:490};
  for(const i of s.resolvedShip.instances)if(['battery','generator'].includes(i.item.family))i.item.gate={low:250,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};
  s.resolvedShip.resources.diesel.capacityKg=1;s.initialState.fuelKg.diesel=1;s.environment.radiativeBackgroundK=100;s.resolvedShip.hull.bodyExchangeAreaM2=1;
  const blocked=stepV3(s,s.initialState,{});expect(blocked.telemetry.deliveredW).toBe(0);expect(blocked.state.chargeJ).toBe(s.initialState.chargeJ);expect(blocked.state.fuelKg.diesel).toBe(1);expect(blocked.diagnostics.some(x=>x.reason==='heating-unavailable')).toBe(true);
  s.environment.energyInputs=[{sourceId:'rescue',representation:'electric',powerW:1e6}];const powered=stepV3(s,s.initialState,{});expect(powered.telemetry.deliveredW).toBeGreaterThan(0);expect(powered.state.temperatureK).toBeGreaterThan(s.initialState.temperatureK);expect(powered.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
it('battery thermal derate clips paid load once, not again during actual-ledger construction',()=>{
  const s=runtimeFixture(475),sensor=install(s,'sensor-S');sensor.item.numerics.powerW=1e6;for(const i of s.resolvedShip.instances)if(i.item.family==='battery')i.item.gate={low:100,workLow:200,workHigh:450,high:500,restartLow:210,restartHigh:440};
  const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+sensor.id]).toBe(500000);expect(r.telemetry.deliveredW).toBe(500000);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
