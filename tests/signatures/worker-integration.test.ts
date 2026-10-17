import { expect, it } from "vitest";
import { WorkerController } from "../../src/runner/protocol";
import { createRun, runChunk, result } from "../../src/runner/run";
import { bench } from "./bench-fixture";

it("SS07/12 a single Worker controller resumes a validated paid in-flight checkpoint and sends canonical new chunks",()=>{
  const spec=bench("S",400);spec.signatures!.radarEnabled=true;
  const run=createRun("saved",spec);runChunk(run,24);const saved=result(run);
  const messages:any[]=[],worker=new WorkerController(m=>messages.push(structuredClone(m)));
  worker.handle({runId:"resumed",commandId:1,type:"start",payload:{checkpoint:saved,maxSteps:1}} as any);
  expect(messages.at(-1)?.type,JSON.stringify(messages.at(-1))).toBe("control-ack");
  worker.pump();const chunk=messages.at(-1);
  expect(chunk.type).toBe("chunk");expect(chunk.payload.signatures.radar.pending).toHaveLength(2);
  expect(chunk.payload.checkpoint).toBeDefined();expect(chunk.payload.runId).toBe("resumed");
  expect(chunk.payload).not.toHaveProperty("steps");expect(chunk.payload.state.timeSeconds).toBeGreaterThan(saved.state.timeSeconds);
  worker.handle({runId:"resumed",type:"telemetry-ack",chunkId:chunk.chunkId});
  worker.handle({runId:"resumed",commandId:2,type:"pause"});worker.pump();expect(messages.at(-1).control).toBe("pause");
  worker.handle({runId:"resumed",commandId:3,type:"snapshot"});expect(messages.at(-1).payload.signatures.radar.pending).toHaveLength(2);
});
it("SS13 invalid checkpoint start is atomic in the Worker controller",()=>{
  const messages:any[]=[],worker=new WorkerController(m=>messages.push(m)),spec=bench();
  worker.handle({runId:"old",commandId:1,type:"start",payload:{spec}});const before=worker.context;
  const run=createRun("bad",spec);runChunk(run,20);const saved=result(run);saved.signatures!.pending.shift();
  worker.handle({runId:"bad",commandId:2,type:"start",payload:{checkpoint:saved}} as any);
  expect(messages.at(-1).type).toBe("error");expect(worker.context).toBe(before);
});
it("SS00/12 invalid actual source reports a Worker error and stops pumping without a fabricated result",()=>{
  const messages:any[]=[],worker=new WorkerController(m=>messages.push(m)),spec=bench();
  spec.environment.law="linear-fog-experiment";spec.environment.linearWK=100;
  worker.handle({runId:"invalid-source",commandId:1,type:"start",payload:{spec}});
  expect(()=>worker.pump()).not.toThrow();expect(messages.at(-1).type).toBe("error");expect(messages.at(-1).payload).toMatch(/mapping/);
  const count=messages.length;worker.pump();expect(messages).toHaveLength(count);expect(messages.some(m=>m.type==="complete")).toBe(false);
});
it("SS07/12 Cancel preserves paid queues and stale controls cannot mutate the next immutable signature run",()=>{
  const messages:any[]=[],worker=new WorkerController(m=>messages.push(structuredClone(m))),a=bench();
  a.signatures!.radarEnabled=true;
  worker.handle({runId:"A",commandId:1,type:"start",payload:{spec:a,maxSteps:1}});worker.pump();
  worker.handle({runId:"A",commandId:2,type:"cancel"});
  const cancelled=messages.at(-1).payload;
  expect(cancelled.status).toBe("cancelled");expect(cancelled.signatures.radar.pending).toHaveLength(1);
  const paidQueue=structuredClone(cancelled.signatures.radar.pending);
  const b=structuredClone(a);b.signatures!.rangeM=9000;
  worker.handle({runId:"B",commandId:3,type:"start",payload:{spec:b,maxSteps:1}});worker.pump();
  const current=messages.at(-1),time=current.payload.state.timeSeconds,count=messages.length;
  worker.handle({runId:"A",commandId:4,type:"cancel"});
  worker.handle({runId:"A",type:"telemetry-ack",chunkId:current.chunkId});worker.pump();
  expect(messages).toHaveLength(count);expect(worker.pendingChunks).toBe(1);expect(worker.context!.state.timeSeconds).toBe(time);
  worker.handle({runId:"B",type:"telemetry-ack",chunkId:current.chunkId});worker.pump();
  expect(messages.at(-1).payload.state.timeSeconds).toBeGreaterThan(time);
  expect(messages.at(-1).payload.spec.signatures.rangeM).toBe(9000);
  expect(cancelled.spec.signatures.rangeM).toBe(16000);expect(cancelled.signatures.radar.pending).toEqual(paidQueue);
});
