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
function cp04Paused(){
  const run=createShipModelRun('cp04-reader',signatureDepletionFixture());runShipModelChunk(run,1);const saved=shipModelResult(run,'paused');
  expect(saved.signatures.last!.receiverIrW).toBe(3891.434262156444);expect(saved.signatures.last!.observedEmW).toBe(524.6226315789473);
  return saved;
}
function zeroLifetimeStatistics(saved:ReturnType<typeof cp04Paused>){
  if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен fresh v2');
  for(const name of ['receiverIrW','observedEmW'] as const)saved.signatures.statistics[name]={integralJ:0,meanW:0,minW:0,maxW:0};
}
it('I4-R1 rejects zero lifetime statistics with literal positive CP-04 last',()=>{
  const saved=cp04Paused(),before=structuredClone(saved);zeroLifetimeStatistics(saved);
  expect(saved.signatures.last).toEqual(before.signatures.last);expect(validateShipModelResult(saved).ok).toBe(false);
});
it('I4-R1 actual Worker refuses false zero statistics without replacing the held owner',()=>{
  const saved=cp04Paused();zeroLifetimeStatistics(saved);const messages:any[]=[],worker=new WorkerController(message=>messages.push(message));
  worker.handle({runId:'held-owner',commandId:1,type:'start',payload:{spec:saved.spec}});worker.handle({runId:'held-owner',commandId:2,type:'pause'});const held=result(worker.context!);
  worker.handle({runId:'false-statistics-owner',commandId:3,type:'start',payload:{checkpoint:saved}});
  expect(result(worker.context!).runId).toBe('held-owner');expect(result(worker.context!)).toEqual(held);expect(messages.filter(message=>message.type==='error')).toHaveLength(1);
});
it.each(['receiverIrW','observedEmW'] as const)('I4-R1 lifetime max must cover compatible latest %s independently at powered t=3',name=>{
  const run=createShipModelRun('powered-max',fixture());runShipModelChunk(run,3);const saved=shipModelResult(run,'paused');if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');const last=saved.signatures.last![name];expect(last).toBeGreaterThan(0);
  // Integral ≥ latest tick и EM min ≤ last; нарушена только lifetime max bound.
  saved.signatures.statistics[name]={integralJ:last*1.5,meanW:last/2,minW:0,maxW:last*0.75};expect(validateShipModelResult(saved).ok).toBe(false);
});
it.each(['receiverIrW','observedEmW'] as const)('I4-R1 lifetime integral must cover the latest actual tick %s',name=>{
  const saved=cp04Paused();if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');const last=saved.signatures.last![name];
  saved.signatures.statistics[name]={integralJ:last/2,meanW:last/2,minW:0,maxW:last*2};expect(validateShipModelResult(saved).ok).toBe(false);
});
it('I4-R1 lifetime EM minimum cannot exceed compatible latest EM',()=>{
  const saved=cp04Paused();if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');const last=saved.signatures.last!.observedEmW;
  saved.signatures.statistics.observedEmW={integralJ:last*2,meanW:last*2,minW:last*1.5,maxW:last*3};expect(validateShipModelResult(saved).ok).toBe(false);
});
it('I4-R1 round2 rejects impossible EM min despite an unrelated enormous max',()=>{
  const saved=cp04Paused(),before=structuredClone(saved);if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');
  saved.signatures.statistics.observedEmW={integralJ:1e6,meanW:1e6,minW:1e6,maxW:1e16};
  expect(saved.signatures.last).toEqual(before.signatures.last);const checked=validateShipModelResult(saved);
  expect(checked.ok).toBe(false);if(!checked.ok)expect(checked.errors.some(error=>error.path==='signatures.statistics.observedEmW')).toBe(true);
});
it('I4-R1 round2 actual Worker refuses impossible EM min while preserving held context and result',()=>{
  const saved=cp04Paused(),messages:any[]=[],worker=new WorkerController(message=>messages.push(message));
  worker.handle({runId:'held-owner',commandId:1,type:'start',payload:{checkpoint:saved}});worker.handle({runId:'held-owner',commandId:2,type:'pause'});const heldContext=worker.context!,held=result(heldContext);expect(held.runId).toBe('held-owner');expect(held.state.timeSeconds).toBe(1);
  const malformed=structuredClone(saved);if(malformed.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');malformed.signatures.statistics.observedEmW={integralJ:1e6,meanW:1e6,minW:1e6,maxW:1e16};
  worker.handle({runId:'impossible-em-min',commandId:3,type:'start',payload:{checkpoint:malformed}});
  expect(worker.context).toBe(heldContext);expect(result(worker.context!)).toEqual(held);const errors=messages.filter(message=>message.type==='error');expect(errors).toHaveLength(1);expect(errors[0].runId).toBe('impossible-em-min');
});
it.each([{difference:5e-10,accepted:true},{difference:2e-9,accepted:false}])('I4-R1 round2 EM min tolerance is local to compared values: $difference',({difference,accepted})=>{
  const saved=cp04Paused();if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');
  // max/integral bounds и internal mean/extrema согласованы; max не задаёт min tolerance.
  saved.signatures.statistics.observedEmW={integralJ:1e6,meanW:1e6,minW:saved.signatures.last!.observedEmW*(1+difference),maxW:1e16};expect(validateShipModelResult(saved).ok).toBe(accepted);
});
it('I4-R1 empty v2 cannot claim a last sample; measured nonempty v2 cannot omit last',()=>{
  const saved=cp04Paused(),empty=shipModelResult(createShipModelRun('empty',saved.spec),'paused');empty.signatures.last=structuredClone(saved.signatures.last);empty.signatures.last!.timeSeconds=0;
  expect(validateShipModelResult(empty).ok).toBe(false);saved.signatures.last=null;expect(validateShipModelResult(saved).ok).toBe(false);
});
it.each(['receiverIrW','observedEmW'] as const)('I4-R1 explicit cross-field tolerance accepts only rounding-sized %s differences',name=>{
  const saved=cp04Paused();if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');const last=saved.signatures.last![name];
  // Допустимая floating граница; mean намеренно не равен совместимому last.
  saved.signatures.statistics[name]={integralJ:last*(1-5e-10),meanW:last*(1-5e-10),minW:0,maxW:last*(1-5e-10)};expect(validateShipModelResult(saved).ok).toBe(true);
  saved.signatures.statistics[name]={integralJ:last*(1-2e-9),meanW:last*(1-2e-9),minW:0,maxW:last*(1-2e-9)};expect(validateShipModelResult(saved).ok).toBe(false);
});
it('I4-R1 IR clipping forbids neither IR min above compatible last nor lifetime mean different from last',()=>{
  const saved=cp04Paused();saved.spec.receiverProfile='absolute-contrast';if(saved.signatures.version!=='ship-signatures/2')throw Error('Нужен v2');const last=saved.signatures.last!.receiverIrW;
  // Exact: average(abs(frame contrast)); compatible: abs(average contrast).
  saved.signatures.statistics.receiverIrW={integralJ:last*2,meanW:last*2,minW:last*1.5,maxW:last*3};expect(validateShipModelResult(saved).ok).toBe(true);
});
