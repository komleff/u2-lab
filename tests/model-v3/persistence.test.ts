import {expect,it} from 'vitest';
import {createRun,runChunk,result} from '../../src/runner/run';
import {WorkerController} from '../../src/runner/protocol';
import {checkpointFixture,signatureDepletionFixture,fixture} from './fixture';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {parseShipModelResultJson,validateShipModelResult} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {Retention} from '../../src/runner/retention';
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
it.each([1,2,3])('I4 frame accumulator resumes from its completed boundary at %s without double counting',cut=>{
  const spec=signatureDepletionFixture(),full=createShipModelRun('frame-resume',spec),split=createShipModelRun('frame-resume',spec);
  full.retention=new Retention(full.retention.channels,2);split.retention=new Retention(split.retention.channels,2);runShipModelChunk(full,4);runShipModelChunk(split,cut);
  const saved=shipModelResult(split,'paused');expect((saved.signatures as any).statistics?.completedThroughSeconds).toBe(cut);
  const encoded=serializeResultSnapshot(saved),parsed=parseShipModelResultJson(encoded);expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  const resumed=restoreShipModelRun(parsed.value);expect(serializeResultSnapshot(shipModelResult(resumed,'paused'))).toBe(encoded);runShipModelChunk(resumed,4-cut);
  expect(serializeResultSnapshot(shipModelResult(resumed))).toBe(serializeResultSnapshot(shipModelResult(full)));expect((resumed.signatures as any).statistics.durationSeconds).toBe(4);
});
it('I4 literal v1 snapshot round-trips and continues as v1 with exact statistics unavailable',()=>{
  const spec=signatureDepletionFixture(),run=createShipModelRun('old-signals',spec);runShipModelChunk(run,1);
  const old=shipModelResult(run,'paused');(old as any).signatures={version:'ship-signatures/1',last:old.signatures.last};const encoded=serializeResultSnapshot(old),parsed=parseShipModelResultJson(encoded);expect(parsed.ok).toBe(true);if(!parsed.ok)return;
  const resumed=restoreShipModelRun(parsed.value);expect(serializeResultSnapshot(shipModelResult(resumed,'paused'))).toBe(encoded);runShipModelChunk(resumed,3);
  expect(resumed.signatures.version).toBe('ship-signatures/1');expect(Object.keys(resumed.signatures).sort()).toEqual(['last','version']);expect(resumed.signatures.last!.timeSeconds).toBe(4);expect(resumed.state.timeSeconds).toBe(4);
});
it('I4 reader accepts an explicit empty v2 checkpoint',()=>{
  const fresh=shipModelResult(createShipModelRun('empty-v2',fixture()),'paused') as any;
  fresh.signatures={version:'ship-signatures/2',last:null,statistics:{durationSeconds:0,completedThroughSeconds:0,receiverIrW:{integralJ:0,meanW:null,minW:null,maxW:null},observedEmW:{integralJ:0,meanW:null,minW:null,maxW:null}}};
  expect(validateShipModelResult(fresh).ok).toBe(true);
});
it('I4 empty checkpoint refuses any invented duration or measured extrema',()=>{
  const fresh=shipModelResult(createShipModelRun('empty-v2',fixture()),'paused') as any;
  const mutations=[(r:any)=>r.signatures.statistics.durationSeconds=1e-10,(r:any)=>r.signatures.statistics.receiverIrW.meanW=0,(r:any)=>r.signatures.statistics.observedEmW.maxW=0,(r:any)=>r.signatures.statistics.receiverIrW.integralJ=1];
  for(const mutate of mutations){const malformed=structuredClone(fresh);mutate(malformed);expect(validateShipModelResult(malformed).ok).toBe(false);}
});
it('I4 malformed v2 statistics and v1/v2 mixed records never replace the live Worker owner',()=>{
  const spec=signatureDepletionFixture(),run=createShipModelRun('source-v2',spec);runShipModelChunk(run,1);const saved=shipModelResult(run,'paused') as any;expect(saved.signatures.statistics).toBeDefined();
  const messages:any[]=[],worker=new WorkerController(message=>messages.push(message));worker.handle({runId:'held-owner',commandId:1,type:'start',payload:{spec}});worker.handle({runId:'held-owner',commandId:2,type:'pause'});const held=result(worker.context!);
  const mutations=[
    (r:any)=>delete r.signatures.statistics,
    (r:any)=>r.signatures.version='ship-signatures/1',
    (r:any)=>r.signatures.statistics.version='unknown',
    (r:any)=>r.signatures.statistics.durationSeconds=-1,
    (r:any)=>r.signatures.statistics.durationSeconds=0,
    (r:any)=>r.signatures.statistics.completedThroughSeconds=0,
    (r:any)=>r.signatures.statistics.completedThroughSeconds=2,
    (r:any)=>r.signatures.statistics.receiverIrW.integralJ=Infinity,
    (r:any)=>r.signatures.statistics.receiverIrW.integralJ=-1,
    (r:any)=>r.signatures.statistics.receiverIrW.meanW=null,
    (r:any)=>r.signatures.statistics.receiverIrW.meanW=1e99,
    (r:any)=>r.signatures.statistics.observedEmW.maxW=-1,
    (r:any)=>r.signatures.statistics.observedEmW.minW=r.signatures.statistics.observedEmW.maxW+1,
    (r:any)=>r.signatures.statistics.receiverIrW.minW='0',
    (r:any)=>delete r.signatures.statistics.observedEmW,
  ];
  for(const mutate of mutations){const malformed=structuredClone(saved);mutate(malformed);expect(validateShipModelResult(malformed).ok).toBe(false);worker.handle({runId:'foreign-owner',commandId:3,type:'start',payload:{checkpoint:malformed}});expect(result(worker.context!)).toEqual(held);}
  expect(messages.filter(message=>message.type==='error')).toHaveLength(mutations.length);
});
