import {it,expect} from 'vitest';
import {fixture} from './reference-clock';
import {WorkerController} from '../../src/runner/protocol';
import {serializeResultSnapshot,parseExperimentJson} from '../../src/io/fitting-json';
import {parseStoredResultJson} from '../../src/io/fitting-result';
import {makeGovernorExperiment} from '../../src/experiments/ship-model-v0.2';
import {createShipModelRunV02,runShipModelChunkV02,shipModelResultV02,restoreShipModelRunV02} from '../../src/runner/ship-model-run-v02';

it('reopens before a failure check without repeating a tick, receipt or RNG draw',async()=>{
  const input=fixture('T29').input;input.state={...input.state,moduleStateById:input.state.moduleStateById.map(m=>({...m,firstNegativeCrossing:false,emergencyExposureSeconds:28/30})),failureChecks:{...input.state.failureChecks,emergencyExposureSeconds:28/30}};
  const spec=makeGovernorExperiment({...input,durationTicks:10,name:'Failure boundary'}),outputs:any[]=[],worker=new WorkerController(m=>outputs.push(m));
  worker.handle({runId:'before',commandId:1,type:'start',payload:{spec,maxSteps:1}});worker.pump();const first=outputs.at(-1);worker.handle({runId:'before',type:'telemetry-ack',chunkId:first.chunkId});worker.handle({runId:'before',commandId:2,type:'pause'});worker.handle({runId:'before',commandId:3,type:'snapshot'});
  const saved=outputs.at(-1).payload,text=serializeResultSnapshot(saved),parsed=parseStoredResultJson(text,{allowGovernorV02:true});expect(parsed.ok).toBe(true);
  if(!parsed.ok)throw Error(JSON.stringify(parsed.errors));expect(serializeResultSnapshot(parsed.value)).toBe(text);
  worker.handle({runId:'before',commandId:4,type:'step'});worker.pump();const next=outputs.at(-1).payload;
  const reopened:any[]=[],restored=new WorkerController(m=>reopened.push(m));restored.handle({runId:'reopened',commandId:1,type:'start',payload:{checkpoint:parsed.value}});restored.handle({runId:'reopened',commandId:2,type:'step'});restored.pump();
  expect(reopened.at(-1).payload.state).toEqual(next.state);expect(reopened.at(-1).payload.checkpoint).toEqual(next.checkpoint);expect(next.checkpoint.lastTick.trace.actualFailureChecks).toBe(1);
  expect(parseExperimentJson(JSON.stringify({...spec,governorVersion:'unknown'}),{allowGovernorV02:true}).ok).toBe(false);
});

it('exports the actual versioned SI trace and retention bounds to CSV',async()=>{
  const runner=await import('../../src/runner/ship-model-run-v02');
  const csv=await import('../../src/io/ship-model-csv-v02').catch(()=>({exportShipModelTelemetryCsvV02:undefined}));expect(csv.exportShipModelTelemetryCsvV02).toBeTypeOf('function');
  const run=runner.createShipModelRunV02('csv',makeGovernorExperiment({...fixture('T29').input,durationTicks:2,name:'CSV'}));runner.runShipModelChunkV02(run,2);const text=csv.exportShipModelTelemetryCsvV02!(runner.shipModelResultV02(run));
  expect(text).toContain('ship-fitting-ship-model-0.2');expect(text).toContain('ship-state/2.1');expect(text).toContain('ship-thermal-governor/0.3');expect(text).toContain('tickIndex [tick]');expect(text).toContain('temperatureK [K]');expect(text).toContain('totalTicks,2');expect(text).toContain('0.06666666666666667');
});

it('refuses a corrupted runner phase cursor instead of resuming a different phase',()=>{
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:10,name:'Phases'});
  spec.scenario.phases=[{...spec.scenario.phases[0],id:'first',durationTicks:2},{...spec.scenario.phases[0],id:'second',durationTicks:8,requests:[]}];
  const run=createShipModelRunV02('phase',spec);runShipModelChunkV02(run,1);const saved=shipModelResultV02(run);saved.state={...saved.state,phaseIndex:1};
  expect(parseStoredResultJson(serializeResultSnapshot(saved),{allowGovernorV02:true}).ok).toBe(false);
});

it('keeps next decisions and final state equal after JSON reopen beside restart hysteresis',()=>{
  const input=fixture('T30').input;input.state={...input.state,shipEnergyJ:690.01*input.profile.ship.heatCapacityJPerK.value,moduleStateById:input.state.moduleStateById.map(m=>({...m,thermalStopped:true,stopReasons:['critical-hot-stop']}))};
  const spec=makeGovernorExperiment({...input,durationTicks:4,name:'Hysteresis'}),run=createShipModelRunV02('hysteresis',spec);runShipModelChunkV02(run,1);
  const parsed=parseStoredResultJson(serializeResultSnapshot(shipModelResultV02(run)),{allowGovernorV02:true});if(!parsed.ok)throw Error(JSON.stringify(parsed.errors));const reopened=restoreShipModelRunV02(parsed.value);
  runShipModelChunkV02(run,1);runShipModelChunkV02(reopened,1);expect(reopened.checkpoint).toEqual(run.checkpoint);runShipModelChunkV02(run,2);runShipModelChunkV02(reopened,2);expect(shipModelResultV02(reopened)).toEqual(shipModelResultV02(run));
});

it('persists explicit module restart authorization without resetting physical time',async()=>{
  const {makeGovernorExperiment}=await import('../../src/experiments/ship-model-v0.2'),input=fixture('T29').input;input.state={...input.state,moduleStateById:input.state.moduleStateById.map(m=>({...m,restartAuthorized:false}))};const spec=makeGovernorExperiment({...input,durationTicks:10,name:'Restart'}),messages:any[]=[],worker=new WorkerController(m=>messages.push(m));
  worker.handle({runId:'restart',commandId:1,type:'start',payload:{spec,maxSteps:1}});worker.handle({runId:'restart',commandId:2,type:'pause'});worker.handle({runId:'restart',commandId:3,type:'step'});worker.pump();
  const before=messages.at(-1).payload;worker.handle({runId:'restart',commandId:4,type:'restart',payload:{instanceId:spec.profile.modules[0].id}});worker.handle({runId:'restart',commandId:5,type:'snapshot'});
  const saved=messages.at(-1).payload;expect(saved.state.governor.tickIndex).toBe(before.state.governor.tickIndex);expect(saved.state.governor.moduleStateById[0].restartAuthorized).toBe(true);expect(parseStoredResultJson(serializeResultSnapshot(saved),{allowGovernorV02:true}).ok).toBe(true);
});
