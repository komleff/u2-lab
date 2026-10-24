import {describe,it,expect} from 'vitest';
import {fixture} from './reference-clock';
import {WorkerController} from '../../src/runner/protocol';
import {makeGovernorExperiment} from '../../src/experiments/ship-model-v0.2';
import {createShipModelRunV02,runShipModelChunkV02,shipModelResultV02,restoreShipModelRunV02} from '../../src/runner/ship-model-run-v02';
import {Retention} from '../../src/runner/retention';

export async function qualificationSpec(id='T29',durationTicks=120){
  return makeGovernorExperiment({...fixture(id).input,durationTicks,name:'Synthetic '+id});
}
describe('F2-G3 Worker integration',()=>{
  it('steps exactly one committed tick and preserves ACK backpressure',async()=>{
    const spec=await qualificationSpec(),messages:any[]=[],worker=new WorkerController(m=>messages.push(m));
    worker.handle({runId:'g3',commandId:1,type:'start',payload:{spec,maxSteps:1}});
    worker.handle({runId:'g3',commandId:2,type:'pause'});worker.pump();
    expect(messages.filter(m=>m.type==='chunk')).toHaveLength(0);
    worker.handle({runId:'g3',commandId:3,type:'step'});worker.pump();
    const chunk=messages.find(m=>m.type==='chunk');expect(chunk.payload.state.governor.tickIndex).toBe(spec.initialState.governor.tickIndex+1);
    expect(chunk.payload.telemetry.timeSeconds).toBe((spec.initialState.governor.tickIndex+1)/30);
    worker.handle({runId:'g3',commandId:4,type:'resume'});worker.pump();expect(messages.filter(m=>m.type==='chunk')).toHaveLength(1);
    worker.handle({runId:'wrong',type:'telemetry-ack',chunkId:chunk.chunkId});worker.pump();expect(worker.pendingChunks).toBe(1);
    worker.handle({runId:'g3',type:'telemetry-ack',chunkId:chunk.chunkId});worker.pump();expect(messages.filter(m=>m.type==='chunk')).toHaveLength(2);
    worker.handle({runId:'g3',commandId:5,type:'cancel'});expect(messages.at(-1).payload.status).toBe('cancelled');
  });
  it('rejects a mixed tuple atomically without replacing the active run',async()=>{
    const spec=await qualificationSpec(),messages:any[]=[],worker=new WorkerController(m=>messages.push(m));
    worker.handle({runId:'valid',commandId:1,type:'start',payload:{spec,maxSteps:1}});const before=worker.currentContext;expect(before).toBeDefined();
    worker.handle({runId:'bad',commandId:2,type:'start',payload:{spec:{...spec,stateVersion:'ship-state/2'} as any}});
    expect(messages.at(-1).type).toBe('error');expect(worker.currentContext).toBe(before);
  });
  it('uses phase requests, explicit mode mapping and integer phase clocks through repeat',async()=>{
    const spec=await qualificationSpec('T29',5),first=spec.scenario.phases[0];
    spec.scenario={name:'Cycle',repeat:true,phases:[{...first,id:'work',durationTicks:2,mode:'Combat'},{...first,id:'recovery',durationTicks:1,mode:'Masking',requests:[],environment:{...spec.environment,externalHeatingW:0}}]};
    const literal=JSON.stringify(spec),run=createShipModelRunV02('phases',spec);runShipModelChunkV02(run,2);expect(run.state.phaseIndex).toBe(0);expect(run.state.phaseElapsedTicks).toBe(2);expect(run.state.governor.requestedMode).toBe('Combat');
    runShipModelChunkV02(run,1);expect(run.state.phaseIndex).toBe(1);expect(run.state.phaseElapsedTicks).toBe(1);expect(run.state.governor.requestedMode).toBe('Quiet');
    const reopened=restoreShipModelRunV02(shipModelResultV02(run));runShipModelChunkV02(run,2);runShipModelChunkV02(reopened,2);expect(shipModelResultV02(reopened)).toEqual(shipModelResultV02(run));expect(run.state.phaseIndex).toBe(0);expect(JSON.stringify(spec)).toBe(literal);
  });
  it('restores bounded retained measurements without changing cadence or final values',async()=>{
    const run=createShipModelRunV02('retained',await qualificationSpec('T29',90));run.retention=new Retention(run.retention.channels,2);runShipModelChunkV02(run,75);
    const saved=shipModelResultV02(run),reopened=restoreShipModelRunV02(saved);expect(saved.retention.buckets).toBeLessThanOrEqual(2);expect(saved.retention.cadenceSeconds).toBeGreaterThan(1);runShipModelChunkV02(run,15);runShipModelChunkV02(reopened,15);expect(shipModelResultV02(reopened)).toEqual(shipModelResultV02(run));
  });
});
