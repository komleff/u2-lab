import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {serializeResultSnapshot,parseExperimentJson} from '../../src/io/fitting-json';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {validateRunSpecV3} from '../../src/model/v3/schema';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {shipModelResults} from '../../src/app/fitting-ui/ship-model-results';
import {exchangeAt} from '../../src/model/v3/thermal-surfaces';
import {stepV3} from '../../src/model/v3/step';
import {runtimeFixture,install} from './runtime-fixture';
const unwrap=<T>(r:import('../../src/catalog/schema').ValidationResult<T>):T=>{if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;};
function native(preset='sputnik',conditions:import('../../src/scenarios/fitting').ShipModelConditions={}){
 const c=loadCandidateCatalog('ship-fitting-0.3.0');return unwrap(makeShipModelMiningRun(getPresetFit(preset,c.version),c,{durationSeconds:1,temperatureK:450,...conditions}));
}
it('stock shielding terminal/60s coincidence produces an importable checkpoint without an unnecessary RNG draw',()=>{
 const s=native('stealth-reference',{temperatureK:400,mode:'Masking',action:'idle',durationSeconds:2}),id='fit:signature-1',m=s.initialState.modules[id];
 m.durabilityR=-0.999999;m.firstNegativeCrossing=true;m.emergencyExposureSeconds=59;
 expect(validateRunSpecV3(s).ok).toBe(true);const run=createShipModelRun('terminal-stock',s);runShipModelChunk(run,1);const saved=shipModelResult(run,'paused');
 expect(saved.state.modules[id].durabilityR).toBe(-1);expect(saved.state.modules[id].durabilityStopped).toBe(true);
 expect(saved.state.modules[id].emergencyExposureSeconds).toBe(0);expect(saved.state.rng).toEqual(s.initialState.rng);
 const parsed=unwrap(parseShipModelResultJson(serializeResultSnapshot(saved))),restored=restoreShipModelRun(parsed);runShipModelChunk(restored,1);runShipModelChunk(run,1);
 expect(serializeResultSnapshot(shipModelResult(restored))).toBe(serializeResultSnapshot(shipModelResult(run)));
});
it('unsupported observer result and run imports refuse before replacing valid workspace, conditions or measurement',()=>{
 const run=createShipModelRun('observer-valid',native());runShipModelChunk(run,1);const valid=shipModelResult(run),bad=structuredClone(valid);bad.spec.observer.presetId='unsupported-preset';
 expect(parseShipModelResultJson(serializeResultSnapshot(bad)).ok).toBe(false);expect(parseExperimentJson(JSON.stringify(bad.spec)).ok).toBe(false);
 const old=loadCandidateCatalog('ship-fitting-0.2.5'),w=new ShipModelWorkspace(getPresetFit('sputnik',old.version),old);w.importDocument(serializeResultSnapshot(valid));
 const before={fit:structuredClone(w.fit),conditions:structuredClone(w.conditions),result:serializeResultSnapshot(w.result!),spec:w.prepare()};
 for(const doc of [serializeResultSnapshot(bad),JSON.stringify(bad.spec)])expect(()=>w.importDocument(doc)).toThrow(/observer.presetId/);
 expect({fit:w.fit,conditions:w.conditions,result:serializeResultSnapshot(w.result!),spec:w.prepare()}).toEqual(before);expect(()=>shipModelResults(w.result!)).not.toThrow();
});
it('fractional-temperature radiation uses a pinned IEEE-754 multiplication order, not platform integer pow',()=>{
 // 450.01² = 202509.0001; fixed square-then-square f64 evaluation of σ T⁴.
 const r=exchangeAt(1,1,450.01,100,null);expect(r.emittedIrW).toBe(2325.414602228367);expect(r.absorbedBackgroundW).toBe(5.670374419);
 expect(r.radiationW).toBe(2319.744227809367);expect(r.fieldW).toBe(0);
});
it.each([[525,'thermal-hot'],[225,'thermal-cold'],[550,'thermal-stop-hot'],[200,'thermal-stop-cold']]as const)('kernel identifies installed limiting module at %s K without changing the actual ledger', (T,reason)=>{
 const s=runtimeFixture(T);for(const i of s.resolvedShip.instances)i.item.gate={low:100,workLow:200,workHigh:800,high:900,restartLow:210,restartHigh:790};
 const i=install(s,'sensor-S','sensitive');i.item.numerics.powerW=1e6;
 const r=stepV3(s,s.initialState,{});expect(r.diagnostics).toContainEqual({instanceId:i.id,reason,timeSeconds:0,limiting:true});expect(r.telemetry['actualW:'+i.id]).toBe(T===525||T===225?500000:0);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
it.each([250,500])('exact ordinary work boundary %s K does not create a false derate',T=>{
 const s=runtimeFixture(T);for(const i of s.resolvedShip.instances)i.item.gate={low:100,workLow:200,workHigh:800,high:900,restartLow:210,restartHigh:790};
 const i=install(s,'sensor-S','sensitive');const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+i.id]).toBe(i.item.numerics.powerW);expect(r.diagnostics.some(d=>d.instanceId===i.id&&(d as any).limiting)).toBe(false);
});
it('Military Combat hot override removes the hot limiter, never cold or actual paying-power limitation',()=>{
 const s=runtimeFixture(525);s.resolvedShip.hull.class='Military';s.initialState.mode='Combat';for(const i of s.resolvedShip.instances)i.item.gate={low:100,workLow:200,workHigh:800,high:900,restartLow:210,restartHigh:790};
 const i=install(s,'sensor-S','sensitive');i.item.numerics.powerW=1e6;
 const hot=stepV3(s,s.initialState,{});expect(hot.telemetry['actualW:'+i.id]).toBe(1e6);expect(hot.diagnostics.some(d=>d.instanceId===i.id&&(d as any).limiting)).toBe(false);
 s.initialState.temperatureK=225;const cold=stepV3(s,s.initialState,{});expect(cold.diagnostics.some(d=>d.instanceId===i.id&&d.reason==='thermal-cold')).toBe(true);
 s.initialState.temperatureK=525;s.initialState.chargeJ=0;const empty=stepV3(s,s.initialState,{});expect(empty.telemetry['actualW:'+i.id]).toBe(0);expect(empty.diagnostics.some(d=>d.reason==='power-limited'&&(d as any).limiting&&!!d.instanceId)).toBe(true);
});
it('OFF ordinary corridor owner stays identifiable without inventing paid work for it',()=>{
 const s=runtimeFixture(475);for(const i of s.resolvedShip.instances)i.item.gate={low:100,workLow:200,workHigh:800,high:900,restartLow:210,restartHigh:790};
 const off=install(s,'mining-civil-S','off-sensitive');off.enabled=false;off.item.gate.workHigh=450;
 const r=stepV3(s,s.initialState,{});expect(r.diagnostics).toContainEqual({instanceId:off.id,reason:'thermal-hot',timeSeconds:0,limiting:true});expect(r.telemetry['actualW:'+off.id]).toBe(0);
});
it('first installed limiter survives checkpoint, later normal work and unrelated colon events',()=>{
 const s=native('sputnik',{temperatureK:525,durationSeconds:2}),run=createShipModelRun('first-limiter',s);runShipModelChunk(run,1);const saved=shipModelResult(run,'paused');
 expect(saved.metrics.firstConstraint).toMatch(/^(builtin:|fit:).+: thermal-hot$/);const first=saved.metrics.firstConstraint;
 const restored=restoreShipModelRun(unwrap(parseShipModelResultJson(serializeResultSnapshot(saved))));restored.state.temperatureK=450;runShipModelChunk(restored,1);
 const result=shipModelResult(restored);expect(result.metrics.firstConstraint).toBe(first);result.events.unshift({timeSeconds:0,kind:'restart-succeeded',message:'not-the-limiter: restart-succeeded'});
 expect(shipModelResults(result)).toContain('Первое ограничение: '+first);expect(shipModelResults(result)).not.toContain('Первое ограничение: not-the-limiter');
});
it('initial empty battery produces a named power limiter, not an absent depletion crossing',()=>{
 const s=native();s.initialState.chargeJ=0;const run=createShipModelRun('initial-empty',s);runShipModelChunk(run,1);const result=shipModelResult(run);
 expect(result.checkpoint.lastTelemetry.deliveredW).toBe(0);expect(result.metrics.usefulWorkJ).toBe(0);expect(result.metrics.firstConstraint).toMatch(/.+: power-limited$/);
});
it('recorded thermal first limiter never suppresses a later physical emergency-stop event',()=>{
 const s=native('stealth-reference',{temperatureK:525,action:'idle'}),m=s.initialState.modules['fit:signature-1'];m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.emergencyExposureSeconds=59;
 const run=createShipModelRun('thermal-then-failure',s);runShipModelChunk(run,1);const r=shipModelResult(run);expect(r.metrics.firstConstraint).toContain('thermal-hot');
 expect(r.events.some(e=>e.kind==='emergency-failure'&&e.timeSeconds===1&&e.message.includes('fit:signature-1'))).toBe(true);expect(r.state.rng.state).toBe(724273890);
});
it('existing buffer capture power limitation remains a first installed limiter after causal routing',()=>{
 const s=native('stealth-reference',{mode:'Masking',action:'idle',environment:{radiativeBackgroundK:100,backgroundSourceId:'background',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[{sourceId:'capture-overload',powerW:40e6}]}});
 const run=createShipModelRun('capture-limit',s);runShipModelChunk(run,1);const r=shipModelResult(run);expect(r.events.some(e=>e.kind==='power-limit')).toBe(true);expect(r.metrics.firstConstraint).toMatch(/.+: power-limit \(/);
});
it('Military Combat critical stop at the end of the accepted interval is a limiter even without a following segment',()=>{
 const s=runtimeFixture(549.95);s.resolvedShip.hull.class='Military';s.initialState.mode='Combat';for(const i of s.resolvedShip.instances)i.item.gate={low:100,workLow:200,workHigh:800,high:900,restartLow:210,restartHigh:790};
 const i=install(s,'sensor-S','end-stop');i.item.numerics.powerW=0;s.environment.directHeat=[{sourceId:'critical-end',powerW:1e6}];const r=stepV3(s,s.initialState,{});
 expect(r.state.modules[i.id].thermalStopped).toBe(true);expect(r.diagnostics).toContainEqual(expect.objectContaining({instanceId:i.id,reason:'critical-hot',limiting:true}));
});
