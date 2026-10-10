import {expect,it} from 'vitest';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {makeShipModelMissionRun} from '../../src/scenarios/mission';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {createRun,runChunk} from '../../src/runner/run';
it('explicit new-model builder constructs complete frozen /4 input without touching old fit/defaults',()=>{
  const catalog=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('sputnik',catalog.version),before=structuredClone(fit),built=makeShipModelMiningRun(fit,catalog,{durationSeconds:2});
  expect(built.ok,JSON.stringify(built)).toBe(true);if(!built.ok)return;
  expect(built.value.stepSeconds).toBe(1);expect(built.value.initialState.chargeJ).toBe(built.value.resolvedShip.batteryCapacityJ);
  const run=createRun('new',built.value);runChunk(run,2);expect(run.metrics.usefulWorkJ).toBeGreaterThan(0);expect(fit).toEqual(before);
  expect(makeShipModelMiningRun(getPresetFit('sputnik') as any,loadCandidateCatalog() as any,{}).ok).toBe(false);
});
it('explicit cycle builder passes physical maneuver requests and phase modes; mode transition preserves debt and latches',()=>{
  const catalog=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',catalog.version),built=makeShipModelMissionRun(fit,catalog,{durationSeconds:3,phases:[
    {id:'quiet',action:'maneuver',mode:'Masking',durationSeconds:1,requests:{'fit:march':0.1},environment:null},
    {id:'recover',action:'recovery',mode:'Efficient',durationSeconds:2,requests:{},environment:null},
  ]});
  expect(built.ok,JSON.stringify(built)).toBe(true);if(!built.ok)return;const run=createRun('cycle',built.value);runChunk(run,1);
  const debt=Object.values(run.state.buffers).reduce((n,b)=>n+b.storedJ,0);expect(run.state.mode).toBe('Masking');expect(debt).toBeGreaterThan(0);
  runChunk(run,1);expect(run.state.mode).toBe('Efficient');expect(Object.values(run.state.buffers).reduce((n,b)=>n+b.storedJ,0)).toBeGreaterThan(0);expect(run.state.phaseIndex).toBe(1);expect(run.state.phaseElapsedSeconds).toBe(1);
});
it.each(['sputnik','severin-mir','stealth-reference'])('new %s reference carries a paid physical built-in electric warmup',id=>{
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),built=makeShipModelMiningRun(getPresetFit(id,c.version),c,{});expect(built.ok).toBe(true);if(!built.ok)return;
  const heater=built.value.resolvedShip.instances.find(i=>i.builtin&&i.item.family==='electric-heater');expect(heater).toBeDefined();expect(heater!.item.materials.reduce((n,m)=>n+m.massKg,0)).toBeGreaterThan(0);expect(heater!.item.numerics.powerW).toBeGreaterThan(0);
});
