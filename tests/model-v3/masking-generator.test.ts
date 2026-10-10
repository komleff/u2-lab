import {expect,it} from 'vitest';
import {stepV3} from '../../src/model/v3/step';
import {validateStateV3} from '../../src/model/v3/schema';
import {runtimeFixture,install} from './runtime-fixture';
function setup(soc:number,independentW=0){const s=runtimeFixture(450);install(s,'generator-diesel-S');s.resolvedShip.hull.hullPowerW=1e6;s.initialState.chargeJ=s.resolvedShip.batteryCapacityJ*soc;s.resolvedShip.resources.diesel.capacityKg=100;s.initialState.fuelKg.diesel=100;s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=450;s.environment.energyInputs=[{sourceId:'independent',representation:'electric',powerW:independentW}];return s;}
it.each([0.009999,0.01])('production Masking SOC %s arms strictly below 1%, never fuel-charges E, counts actual fuel/heat/EM',soc=>{
  const s=setup(soc),r=stepV3(s,s.initialState,{});expect(r.state.generator.permission).toBe(soc<0.01);expect(r.telemetry.generatorW).toBe(soc<0.01?1e6:0);expect(r.state.chargeJ).toBeLessThanOrEqual(s.initialState.chargeJ);expect(r.telemetry.hostHeatW).toBeGreaterThan(0);expect(r.telemetry.rawEmW).toBeGreaterThan(0);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
  expect(r.state.fuelKg.diesel<s.initialState.fuelKg.diesel).toBe(soc<0.01);
});
it('production independent supply prevents arming; partial deficit, serialized permission, zero output, recurrence, upper recovery and normal handoff',()=>{
  const s=setup(0.005,1e6);expect(stepV3(s,s.initialState,{}).state.generator.permission).toBe(false);
  s.environment.energyInputs[0].powerW=400000;const armed=stepV3(s,s.initialState,{});expect(armed.telemetry.generatorW).toBe(600000);expect(armed.state.chargeJ).toBe(s.initialState.chargeJ);
  const restored=validateStateV3(JSON.parse(JSON.stringify(armed.state)),s.resolvedShip);expect(restored.ok,JSON.stringify(restored)).toBe(true);if(!restored.ok)return;
  s.environment.energyInputs[0].powerW=1e6;const covered=stepV3(s,restored.value,{});expect(covered.state.generator.permission).toBe(true);expect(covered.telemetry.generatorW).toBe(0);expect(covered.state.fuelKg).toEqual(armed.state.fuelKg);
  s.environment.energyInputs[0].powerW=400000;expect(stepV3(s,covered.state,{}).telemetry.generatorW).toBe(600000);
  const upper=structuredClone(covered.state);upper.chargeJ=s.resolvedShip.batteryCapacityJ*0.02;expect(stepV3(s,upper,{}).state.generator.permission).toBe(false);
  const exit=structuredClone(covered.state);exit.mode='Efficient';exit.maskingEntryTemperatureK=null;const normal=stepV3(s,exit,{});expect(normal.state.generator.permission).toBe(false);expect(normal.state.generator.normalOn).toBe(true);expect(normal.telemetry.generatorW).toBeGreaterThan(0);
});
