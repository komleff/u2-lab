import {expect,it} from 'vitest';
import {stepV3} from '../../src/model/v3/step';
import {runtimeFixture,install} from './runtime-fixture';
import {WorkerController} from '../../src/runner/protocol';
import {fixture} from './fixture';
import {controlModule} from '../../src/model/v3/durability';

function active(){
  const s=runtimeFixture(400),i=install(s,'sensor-S');
  i.item.numerics.powerW=1e6;i.item.durability.wearPerWorkSecond=0;
  const m=s.initialState.modules[i.id] as typeof s.initialState.modules[string]&{durabilityStopped:boolean};
  m.durabilityStopped=false;return {s,i,m};
}
it('CP05 positive wear ending exactly at R=0 is guaranteed without RNG or warning failure',()=>{
  const {s,i,m}=active();m.durabilityR=0.5;i.item.durability.wearPerWorkSecond=0.5;
  const r=stepV3(s,s.initialState,{});expect(r.state.modules[i.id].durabilityR).toBe(0);
  expect(r.telemetry['actualW:'+i.id]).toBe(1e6);expect(r.state.modules[i.id].firstNegativeCrossing).toBe(false);expect(r.state.rng).toEqual(s.initialState.rng);
});
it('first negative crossing clips actual work immediately at .5s, warns once and starts cooldown without RNG',()=>{
  const {s,i,m}=active();m.durabilityR=0.25;i.item.durability.wearPerWorkSecond=0.5;
  const r=stepV3(s,s.initialState,{}),next=r.state.modules[i.id];
  expect(r.telemetry['actualW:'+i.id]).toBeCloseTo(500000,6);expect(next.durabilityR).toBeLessThan(0);
  expect(next.firstNegativeCrossing).toBe(true);expect((next as any).durabilityStopped).toBe(true);expect(next.cooldownSeconds).toBeCloseTo(9.5,10);
  expect(r.diagnostics.filter(d=>d.reason==='first-negative-crossing')).toHaveLength(1);expect(r.state.rng).toEqual(s.initialState.rng);
  const paused=stepV3(s,r.state,{});expect(paused.telemetry['actualW:'+i.id]).toBe(0);expect(paused.state.modules[i.id].durabilityR).toBe(next.durabilityR);
  expect(paused.diagnostics.some(d=>d.reason==='first-negative-crossing')).toBe(false);expect(paused.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
it('the 60th accumulated working second checks seeded failure once, without extra R drain',()=>{
  const {s,i,m}=active();m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.restartAuthorized=false;m.emergencyExposureSeconds=59;
  const r=stepV3(s,s.initialState,{}),next=r.state.modules[i.id];
  expect(r.telemetry['actualW:'+i.id]).toBe(1e6);expect(next.emergencyExposureSeconds).toBe(0);expect(next.durabilityR).toBe(-0.5);
  expect(r.state.rng.state).toBe(724273890);expect((next as any).durabilityStopped).toBe(true);expect(next.cooldownSeconds).toBe(10);
  expect(r.diagnostics.filter(d=>d.reason==='emergency-failure')).toHaveLength(1);
});
it('off-time pauses exposure and power cycle never removes the next working-period check',()=>{
  const {s,i,m}=active();m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.restartAuthorized=false;m.emergencyExposureSeconds=59;i.enabled=false;
  const off=stepV3(s,s.initialState,{});expect(off.state.modules[i.id].emergencyExposureSeconds).toBe(59);expect(off.state.rng).toEqual(s.initialState.rng);
  i.enabled=true;const on=stepV3(s,off.state,{});expect(on.state.rng.state).toBe(724273890);expect(on.state.modules[i.id].emergencyExposureSeconds).toBe(0);
});
it('one authorization retries after failed-start cooldown; attempts do not damage R or accrue work exposure',()=>{
  const {s,i,m}=active();m.durabilityR=-0.9;m.firstNegativeCrossing=true;m.restartAuthorized=true;m.durabilityStopped=true;m.emergencyExposureSeconds=17;
  let r=stepV3(s,s.initialState,{});expect(r.state.rng.state).toBe(724273890);expect(r.state.modules[i.id].cooldownSeconds).toBe(9);
  expect(r.telemetry['actualW:'+i.id]).toBe(0);expect(r.diagnostics.some(d=>d.reason==='restart-failed')).toBe(true);
  for(let n=0;n<9;n++)r=stepV3(s,r.state,{});
  expect(r.state.rng.state).toBe(344661241);expect((r.state.modules[i.id] as any).durabilityStopped).toBe(false);
  expect(r.state.modules[i.id].durabilityR).toBe(-0.9);expect(r.state.modules[i.id].emergencyExposureSeconds).toBe(17);
  expect(r.diagnostics.some(d=>d.reason==='restart-succeeded')).toBe(true);
  expect(r.state.modules[i.id].restartAuthorized).toBe(false);
});
it('thermal stop has priority and changes neither R/exposure nor cooldown beyond elapsed time',()=>{
  const {s,i,m}=active();s.initialState.temperatureK=i.item.gate.high;m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.restartAuthorized=true;m.durabilityStopped=true;m.emergencyExposureSeconds=59;m.cooldownSeconds=5;
  const r=stepV3(s,s.initialState,{}),next=r.state.modules[i.id];expect(r.telemetry['actualW:'+i.id]).toBe(0);
  expect(next.thermalStopped).toBe(true);expect(next.durabilityR).toBe(-0.5);expect(next.emergencyExposureSeconds).toBe(59);expect(next.cooldownSeconds).toBe(4);expect(r.state.rng).toEqual(s.initialState.rng);
});
it('terminal floor forbids even authorized attempts until repaired, with no RNG or calendar drain',()=>{
  const {s,i,m}=active();m.durabilityR=-i.item.durability.emergencyDepthR;m.firstNegativeCrossing=true;m.restartAuthorized=true;m.durabilityStopped=true;
  const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+i.id]).toBe(0);expect(r.state.modules[i.id].durabilityR).toBe(m.durabilityR);expect(r.state.rng).toEqual(s.initialState.rng);
});
it('working emergency module stops at its terminal wear crossing inside the physical second',()=>{
  const {s,i,m}=active();m.durabilityR=-0.75;m.firstNegativeCrossing=true;i.item.durability.wearPerWorkSecond=0.5;
  const r=stepV3(s,s.initialState,{}),next=r.state.modules[i.id];
  expect(r.telemetry['actualW:'+i.id]).toBeCloseTo(500000,6);expect(next.durabilityR).toBe(-i.item.durability.emergencyDepthR);expect(next.durabilityStopped).toBe(true);expect(next.emergencyExposureSeconds).toBeCloseTo(0.5,10);expect(r.state.rng).toEqual(s.initialState.rng);expect(r.diagnostics.filter(d=>d.reason==='terminal-durability')).toHaveLength(1);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
function stoppedWorker(){
  const s=fixture(),id=s.resolvedShip.instances.find(i=>i.item.family==='mining')!.id,m=s.initialState.modules[id];
  m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.durabilityStopped=true;m.emergencyExposureSeconds=17;m.cooldownSeconds=5;
  const messages:any[]=[],worker=new WorkerController(x=>messages.push(x));worker.handle({runId:'repair',commandId:1,type:'start',payload:{spec:s,maxSteps:1}});
  return {s,id,worker,messages,state:()=>structuredClone((worker.context as any).state)};
}
it('RESTART explicitly authorizes a stopped module but does not reset exposure, cooldown, R or RNG',()=>{
  const {id,worker,state}=stoppedWorker(),before=state();worker.handle({runId:'repair',commandId:2,type:'restart',payload:{instanceId:id}} as any);
  const after=state();expect(after.modules[id].restartAuthorized).toBe(true);before.modules[id].restartAuthorized=true;expect(after).toEqual(before);
});
it.each([0,0.5])('repair to R=%s rearms exactly one next warning crossing without healing history/clocks',target=>{
  const {id,worker,state}=stoppedWorker(),before=state();worker.handle({runId:'repair',commandId:2,type:'repair',payload:{instanceId:id,durabilityR:target}} as any);
  const after=state();expect(after.modules[id].durabilityR).toBe(target);expect(after.modules[id].firstNegativeCrossing).toBe(false);expect(after.modules[id].durabilityStopped).toBe(false);
  expect(after.modules[id].emergencyExposureSeconds).toBe(17);expect(after.modules[id].cooldownSeconds).toBe(5);expect(after.rng).toEqual(before.rng);
});
it('repair remaining negative never rearms a warning or starts the stopped module',()=>{
  const {id,worker,state}=stoppedWorker();worker.handle({runId:'repair',commandId:2,type:'repair',payload:{instanceId:id,durabilityR:-0.1}} as any);
  const after=state();expect(after.modules[id].durabilityR).toBe(-0.1);expect(after.modules[id].firstNegativeCrossing).toBe(true);expect(after.modules[id].durabilityStopped).toBe(true);expect(after.modules[id].emergencyExposureSeconds).toBe(17);
});
it('invalid repair and unknown instance refuse atomically before changing live Worker state',()=>{
  const {worker,state,messages,id}=stoppedWorker(),before=state();
  for(const payload of [{instanceId:id,durabilityR:NaN},{instanceId:'missing',durabilityR:0}])worker.handle({runId:'repair',commandId:2,type:'repair',payload} as any);
  expect(state()).toEqual(before);expect(messages.filter(x=>x.type==='error')).toHaveLength(2);
});
it('operating exposure counts real active seconds, not a second load-weighted wear axis',()=>{
  const {s,i,m}=active();m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.restartAuthorized=false;
  const r=stepV3(s,s.initialState,{[i.id]:0.25});expect(r.telemetry['actualW:'+i.id]).toBe(250000);expect(r.state.modules[i.id].emergencyExposureSeconds).toBe(1);
});
it.each(['hull','armor'] as const)('%s does not gain a negative emergency working zone',behavior=>{
  const {s,i,m}=active();i.item.durability.behavior=behavior;m.durabilityR=0;
  const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+i.id]).toBe(0);expect(r.state.rng).toEqual(s.initialState.rng);
});
it('vital minimum is explicit module data and stays deterministic even beyond the ordinary terminal floor',()=>{
  const {s,i,m}=active();i.item.durability.behavior='vital';(i.item.durability as any).emergencyMinimumFraction=0.2;m.durabilityR=-2;
  const r=stepV3(s,s.initialState,{});expect(r.telemetry['actualW:'+i.id]).toBe(200000);expect(r.state.rng).toEqual(s.initialState.rng);
});
it('a thermal crossing stops a running emergency module independently and requires a new restart after hysteresis',()=>{
  const {s,i,m}=active();i.item.gate={low:200,workLow:300,workHigh:500,high:600,restartLow:310,restartHigh:490};s.initialState.temperatureK=599.99;m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.restartAuthorized=false;
  s.environment.directHeat=[{sourceId:'thermal-crossing',powerW:1e6}];const hot=stepV3(s,s.initialState,{});
  expect(hot.state.modules[i.id].thermalStopped).toBe(true);expect(hot.state.modules[i.id].durabilityStopped).toBe(true);expect(hot.state.rng).toEqual(s.initialState.rng);
  hot.state.temperatureK=400;const cooled=stepV3(s,hot.state,{});expect(cooled.state.modules[i.id].thermalStopped).toBe(false);expect(cooled.telemetry['actualW:'+i.id]).toBe(0);
  const authorized=controlModule(s.resolvedShip,cooled.state,i.id,'restart'),restarted=stepV3(s,authorized,{});expect(restarted.telemetry['actualW:'+i.id]).toBe(1e6);expect(restarted.state.rng.state).toBe(724273890);
});
it('repair to zero produces exactly one next warning; repair remaining negative never duplicates it',()=>{
  const {s,i,m}=active();m.durabilityR=-0.5;m.firstNegativeCrossing=true;m.durabilityStopped=true;i.item.durability.wearPerWorkSecond=0.5;
  const partial=controlModule(s.resolvedShip,s.initialState,i.id,'repair',-0.1),still=stepV3(s,partial,{});expect(still.diagnostics.some(d=>d.reason==='first-negative-crossing')).toBe(false);
  const repaired=controlModule(s.resolvedShip,still.state,i.id,'repair',0),crossed=stepV3(s,repaired,{});expect(crossed.diagnostics.filter(d=>d.reason==='first-negative-crossing')).toHaveLength(1);expect(crossed.telemetry['actualW:'+i.id]).toBe(0);
  expect(stepV3(s,crossed.state,{}).diagnostics.some(d=>d.reason==='first-negative-crossing')).toBe(false);expect(s.initialState.modules[i.id].durabilityR).toBe(-0.5);
});
