import{it,expect,vi}from'vitest';
import{createMissionV2Job,advanceMissionV2Job}from'../../src/runner/ship-model-flight-v2';
import{createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun}from'../../src/runner/ship-model-run';
import{WorkerController}from'../../src/runner/protocol';
import{weak,ermak}from'./mission-v2-fixture';
it('EF04 actual runner yields Pending before committing a heavy flight decision',()=>{
 const run=createShipModelRun('pending',weak()),before=structuredClone(run.state),result=runShipModelChunk(run,1,.1);
 expect(result.steps).toBe(0);expect((result as any).planningPending).toBe(true);expect(run.state).toEqual(before);expect(run.metrics.usefulWorkJ).toBe(0);expect(run.retention.totalTicks).toBe(0);expect(run.events.items()).toEqual([]);
});
it('EF04 resumable forecast operation slices do not spend actual stocks/RNG and have identical output',()=>{
 const s=weak(1),snapshot=JSON.stringify(s),outputs=[];
 for(const n of[1,7,64,Infinity]){const job=createMissionV2Job(s,s.initialState);let out=advanceMissionV2Job(job,Infinity,n);if(n!==Infinity)expect(out.kind).toBe('pending');while(out.kind==='pending')out=advanceMissionV2Job(job,Infinity,n);expect(out.kind).toBe('ready');outputs.push(out);expect(JSON.stringify(s)).toBe(snapshot);}
 for(const out of outputs)expect(out).toEqual(outputs[0]);
});
it('EF04 one Worker Step survives zero-step Pending; Pause discards planning without changing actual state',()=>{
 const messages:any[]=[],ctl=new WorkerController(x=>messages.push(x));ctl.handle({runId:'step',commandId:1,type:'start',payload:{spec:weak()}});ctl.handle({runId:'step',commandId:2,type:'pause'});ctl.handle({runId:'step',commandId:3,type:'step'});
 let clock=0;const spy=vi.spyOn(performance,'now').mockImplementation(()=>clock+=10);
 try{ctl.pump();expect(ctl.context!.state.timeSeconds).toBe(0);let msg=messages.filter(x=>x.type==='chunk').at(-1);ctl.handle({runId:'step',type:'telemetry-ack',chunkId:msg.chunkId});let pumps=0;while(ctl.context!.state.timeSeconds===0&&pumps++<2000){ctl.pump();msg=messages.filter(x=>x.type==='chunk').at(-1);ctl.handle({runId:'step',type:'telemetry-ack',chunkId:msg.chunkId});}expect(ctl.context!.state.timeSeconds).toBe(1);ctl.pump();expect(ctl.context!.state.timeSeconds).toBe(1);}finally{spy.mockRestore();}
 ctl.handle({runId:'step',commandId:4,type:'resume'});runShipModelChunk(ctl.context as any,1,.01);const snapshot=structuredClone(ctl.context!.state);ctl.handle({runId:'step',commandId:5,type:'pause'});expect(ctl.context!.state).toEqual(snapshot);expect((ctl.context as any).missionJob).toBeUndefined();
});
it('EF05 cold checkpoint restore and memo eviction keep the numerical result literal',()=>{
 const s=ermak('active2',5),a=createShipModelRun('cold',s);runShipModelChunk(a,2);const b=restoreShipModelRun(shipModelResult(a));runShipModelChunk(a,3);runShipModelChunk(b,3);expect(shipModelResult(b)).toEqual(shipModelResult(a));
});
import{createFlightMemo}from'../../src/runner/ship-model-flight-v2';
it('EF08 certified full-braking suffix is reused only for the exact physical successor',()=>{
 const s=weak();s.initialState.mission!.positionM=100000;const memo=createFlightMemo(s),a=createMissionV2Job(s,s.initialState,memo);const one=advanceMissionV2Job(a,Infinity);expect(one.kind).toBe('ready');if(one.kind!=='ready')return;
 const hot=createMissionV2Job(s,one.interval.state,memo),cold=createMissionV2Job(s,one.interval.state);const x=advanceMissionV2Job(hot,Infinity),y=advanceMissionV2Job(cold,Infinity);expect(x).toEqual(y);expect(hot.operations).toBeLessThan(cold.operations/4);
 const changed=structuredClone(one.interval.state);changed.fuelKg.diesel-=1;const altered=createMissionV2Job(s,changed,memo),fresh=createMissionV2Job(s,changed);expect(advanceMissionV2Job(altered,Infinity)).toEqual(advanceMissionV2Job(fresh,Infinity));
});
it('EF08 a fractional root just before an outer boundary forecasts the tiny remainder rather than dt greater than1',()=>{
 const s=ermak('active2',10),state=structuredClone(s.initialState);state.timeSeconds=.9999999995;state.phaseElapsedSeconds=state.timeSeconds;state.mission!.stageElapsedSeconds=state.timeSeconds;state.mission!.positionM=100;state.mission!.velocityMS=10;
 expect(advanceMissionV2Job(createMissionV2Job(s,state),Infinity).kind).toBe('ready');
});
it('EF04 a deadline before the first planner operation preserves Step intent until an actual tick',()=>{
 const messages:any[]=[],ctl=new WorkerController(x=>messages.push(x));ctl.handle({runId:'clock',commandId:1,type:'start',payload:{spec:ermak('active2',2)}});ctl.handle({runId:'clock',commandId:2,type:'pause'});ctl.handle({runId:'clock',commandId:3,type:'step'});
 let clock=0;const spy=vi.spyOn(performance,'now').mockImplementation(()=>clock+=100);try{ctl.pump();}finally{spy.mockRestore();}expect(ctl.context!.state.timeSeconds).toBe(0);const msg=messages.filter(x=>x.type==='chunk').at(-1);ctl.handle({runId:'clock',type:'telemetry-ack',chunkId:msg.chunkId});ctl.pump();expect(ctl.context!.state.timeSeconds).toBe(1);
});
it('FC04 standalone same-object spec change invalidates an existing braking forecast',()=>{
 const s=ermak('none',3);Object.assign(s.initialState.mission!,{stage:'inbound',positionM:500,velocityMS:-50,onboardM3:36,minedM3:36});
 const memo=createFlightMemo(s),previous=advanceMissionV2Job(createMissionV2Job(s,s.initialState,memo),Infinity);expect(previous.kind).toBe('ready');
 s.resolvedShip.instances.find(i=>i.item.family==='engine'&&i.role==='march')!.item.numerics.forceN*=.01;
 const hot=advanceMissionV2Job(createMissionV2Job(s,s.initialState,memo),Infinity),cold=advanceMissionV2Job(createMissionV2Job(s,s.initialState),Infinity);
 expect(hot.kind).toBe('ready');expect(hot).toEqual(cold);expect(hot).not.toEqual(previous);
});
it('FC04 same-object spec change between chunks preserves cold-run braking and complete output',()=>{
 const s=ermak('none',3);Object.assign(s.initialState.mission!,{stage:'inbound',positionM:500,velocityMS:-50,onboardM3:36,minedM3:36});
 const hot=createShipModelRun('changed',s);runShipModelChunk(hot,1);const cold=restoreShipModelRun(shipModelResult(hot)),velocity=hot.state.mission!.velocityMS;
 for(const run of[hot,cold])run.spec.resolvedShip.instances.find(i=>i.item.family==='engine'&&i.role==='march')!.item.numerics.forceN*=.01;
 runShipModelChunk(hot,2);runShipModelChunk(cold,2);
 expect(hot.state.timeSeconds).toBe(3);expect(hot.state.mission!.velocityMS).toBeGreaterThan(velocity);expect(shipModelResult(hot)).toEqual(shipModelResult(cold));
});
