import {expect,it} from 'vitest';
import {WorkerController} from '../../src/runner/protocol';
import {createRun,runChunk,result} from '../../src/runner/run';
import {fixture} from './fixture';
it('/4 dispatch starts the new physical runner, ACKs pause, and preserves immutable complete input',()=>{
  const spec=fixture(),before=structuredClone(spec),messages:any[]=[],worker=new WorkerController(m=>messages.push(structuredClone(m)));
  worker.handle({runId:'v3',commandId:1,type:'start',payload:{spec,maxSteps:1}} as any);expect(messages.at(-1)?.type).toBe('control-ack');
  worker.pump();expect(messages.at(-1)?.type).toBe('chunk');expect(messages.at(-1).payload.state.timeSeconds).toBe(1);
  expect(messages.at(-1).payload.telemetry.totalResidualJ).toBeCloseTo(0,5);
  worker.handle({runId:'v3',commandId:2,type:'pause'});const count=messages.length;worker.pump();expect(messages).toHaveLength(count);expect(messages.at(-1).control).toBe('pause');
  worker.handle({runId:'v3',commandId:3,type:'snapshot'});expect(messages.at(-1).payload.spec.schemaVersion).toBe('u2-lab/4');expect(messages.at(-1).payload.state.rng).toEqual(spec.initialState.rng);expect(spec).toEqual(before);
});
it('new runner returns real summed work, heat/energy residual, and advances explicit phase state without resetting stocks',()=>{
  const spec=fixture(),run=createRun('v3',spec);runChunk(run,60);const saved=result(run);
  expect(saved.status).toBe('complete');expect(saved.state.timeSeconds).toBe(60);expect(saved.metrics.usefulWorkJ).toBeGreaterThan(0);
  expect(Math.abs(saved.metrics.totalResidualJ)).toBeLessThan(1e-3);expect(saved.state.chargeJ).toBeLessThan(spec.initialState.chargeJ);
});
