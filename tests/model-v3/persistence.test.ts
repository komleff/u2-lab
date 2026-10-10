import {expect,it} from 'vitest';
import {createRun,runChunk,result} from '../../src/runner/run';
import {WorkerController} from '../../src/runner/protocol';
import {checkpointFixture} from './fixture';
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v);
function stoppedAt59(){const {spec,instanceId}=checkpointFixture(),run=createRun('cp05',spec);runChunk(run,59);return {run,saved:result(run),instanceId};}
it('a /4 result contains a versioned complete checkpoint and literal last request/ledger output',()=>{
  const {run,saved}=stoppedAt59();expect((saved as any).checkpoint?.version).toBe('ship-checkpoint/1');expect((saved as any).checkpoint.lastTelemetry).toEqual(run.last);
  expect(saved.state.timeSeconds).toBe(59);expect(saved.state.rng.state).toBe(424242);expect(saved.spec.receiverProfile).toBe('absolute-contrast');
});
it('CP05 production 59s export/import plus 1s exactly matches uninterrupted 60s for state, decisions, stocks and RNG',()=>{
  const {run,saved,instanceId}=stoppedAt59(),messages:any[]=[],worker=new WorkerController(x=>messages.push(x));
  worker.handle({runId:'cp05',commandId:1,type:'start',payload:{checkpoint:JSON.parse(json(saved)),maxSteps:1}} as any);
  expect(messages.some(x=>x.type==='error'),json(messages)).toBe(false);worker.pump();runChunk(run,1);
  const final=messages.find(x=>x.type==='complete')?.payload;expect(final).toEqual(result(run));
  expect(final.state.rng.state).toBe(724273890);expect(final.state.modules[instanceId].durabilityStopped).toBe(true);expect(final.state.modules[instanceId].cooldownSeconds).toBe(10);
});
it('repeated imports restore identical pending failure without drawing RNG early or rerolling the 60th second',()=>{
  const {saved}=stoppedAt59(),messages:any[]=[],worker=new WorkerController(x=>messages.push(x)),finals:any[]=[];
  for(let n=0;n<2;n++){
    worker.handle({runId:'cp05',commandId:n,type:'start',payload:{checkpoint:JSON.parse(json(saved)),maxSteps:1}} as any);
    expect(messages.some(x=>x.type==='error'),json(messages)).toBe(false);expect((worker.context as any).state).toEqual(saved.state);worker.pump();finals.push(messages.filter(x=>x.type==='complete').at(-1).payload);
  }
  expect(finals[0]).toEqual(finals[1]);
});
it('missing latch, future state/checkpoint version and malformed stocks reject atomically while an old live run stays untouched',()=>{
  const {saved,instanceId}=stoppedAt59(),messages:any[]=[],worker=new WorkerController(x=>messages.push(x));
  worker.handle({runId:'cp05',commandId:1,type:'start',payload:{spec:saved.spec,maxSteps:1}});worker.handle({runId:'cp05',commandId:2,type:'pause'});
  const before=result(worker.context!);
  for(const mutate of [(x:any)=>delete x.state.modules[instanceId].durabilityStopped,(x:any)=>x.state.stateVersion='ship-state/99',(x:any)=>(x.checkpoint??={}).version='ship-checkpoint/99',(x:any)=>x.state.chargeJ=-1,(x:any)=>x.state.modules[instanceId].emergencyExposureSeconds=60,(x:any)=>x.signatures.version='ship-signatures/99']){
    const bad=JSON.parse(json(saved));mutate(bad);worker.handle({runId:'replacement',commandId:3,type:'start',payload:{checkpoint:bad}} as any);expect(result(worker.context!)).toEqual(before);
  }
  expect(messages.filter(x=>x.type==='error')).toHaveLength(6);
});
