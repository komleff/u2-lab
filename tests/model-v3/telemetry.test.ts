import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {Retention} from '../../src/runner/retention';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {shipModelChannelNames,observeShipModelState} from '../../src/runner/ship-model-telemetry';
import {stepV3} from '../../src/model/v3/step';
import {fixture} from './fixture';

function latePumpSpec(durationSeconds=4){
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',c.version);
  fit.instances['fit:signature-1'].itemId='thermoinverter-S';
  fit.assignments['signature-2']='fit:signature-2';fit.instances['fit:signature-2']={id:'fit:signature-2',itemId:'radiator-passive-S',enabled:true};
  const made=makeShipModelMiningRun(fit,c,{backgroundK:100,durationSeconds,temperatureK:500,phases:[
    {id:'quiet',action:'idle',mode:'Masking',durationSeconds:1,requests:{},environment:null},
    {id:'cool',action:'idle',mode:'Efficient',durationSeconds:1,requests:{},environment:null},
  ],repeat:true});
  if(!made.ok)throw Error(JSON.stringify(made.errors));return made.value;
}
it('I3 declares late TI and installed state/work channels before the first tick',()=>{
  const run=createShipModelRun('registry',latePumpSpec());
  expect(run.retention.channels).toEqual(expect.arrayContaining(['requestedW','temperatureK','signal:receiverIrW','signal:observedEmW','fuelKg:diesel','tiHotK:fit:signature-1','tiActive:fit:signature-1','actualW:fit:power-1','actualMeasured:fit:power-1','durabilityR:fit:signature-1','cooldownSeconds:fit:signature-1','thermalStopped:fit:signature-1','durabilityStopped:fit:signature-1']));
  expect(run.retention.channels.some(id=>id.startsWith('surfaceOpen:'))).toBe(true);
  expect(run.retention.channels).toEqual([...new Set(run.retention.channels)].sort());
  expect(run.retention.maxBuckets).toBeLessThanOrEqual(Math.floor(128*1024*1024/(run.retention.channels.length*24+1024)));
});
it('I3 older checkpoints keep their literal historical channel set instead of backfilling new state',()=>{
  const run=createShipModelRun('old',latePumpSpec());runShipModelChunk(run,1);const saved=shipModelResult(run,'paused'),ids=['temperatureK','requestedW','actualW:fit:payload-1'],indices=ids.map(id=>saved.channels.indexOf(id));
  saved.buckets=saved.buckets.map(b=>({...b,sum:new Float64Array(indices.map(i=>b.sum[i])),min:new Float64Array(indices.map(i=>b.min[i])),max:new Float64Array(indices.map(i=>b.max[i]))}));saved.channels=ids;saved.retention.estimatedBytes=saved.buckets.length*(ids.length*24+1024);saved.checkpoint.lastTelemetry=Object.fromEntries(ids.map(id=>[id,run.last[id]]));
  const restored=restoreShipModelRun(saved);expect(serializeResultSnapshot(shipModelResult(restored,'paused'))).toBe(serializeResultSnapshot(saved));runShipModelChunk(restored,1);
  expect(restored.retention.channels).toEqual(ids);expect(restored.retention.buckets[0]).toEqual(saved.buckets[0]);expect(restored.last['tiActive:fit:signature-1']).toBe(1);
});
it('I3 every tick retains the identical finite registry through inactive then late TI',()=>{
  const run=createShipModelRun('late',latePumpSpec()),names=[...run.retention.channels];
  for(let tick=0;tick<4;tick++){
    runShipModelChunk(run,1);expect(Object.keys(run.last).sort()).toEqual(names);
    expect(Object.values(run.last).every(Number.isFinite)).toBe(true);
    expect(run.last['tiActive:fit:signature-1']).toBe(tick%2===0?0:1);
  }
  const i=names.indexOf('tiHotK:fit:signature-1');expect(run.retention.buckets[1].min[i]).toBeGreaterThan(500);
});
it('I3 telemetry reports actual latest stocks and latches, not nominal or requested work',()=>{
  const run=createShipModelRun('state',latePumpSpec());runShipModelChunk(run,1);
  expect(run.last['fuelKg:diesel']).toBe(run.state.fuelKg.diesel);
  for(const[id,m]of Object.entries(run.state.modules)){
    expect(run.last['durabilityR:'+id]).toBe(m.durabilityR);expect(run.last['cooldownSeconds:'+id]).toBe(m.cooldownSeconds);
    expect(run.last['thermalStopped:'+id]).toBe(Number(m.thermalStopped));expect(run.last['durabilityStopped:'+id]).toBe(Number(m.durabilityStopped));
  }
  for(const[id,open]of Object.entries(run.state.surfaceOpen))expect(run.last['surfaceOpen:'+id]).toBe(Number(open));
  expect(run.last['actualMeasured:fit:power-1']).toBe(0);expect(run.last['actualW:fit:power-1']).toBe(0);
  expect(run.last['actualMeasured:fit:payload-1']).toBe(1);expect(run.last['actualW:fit:payload-1']).toBe(0);
});
it('I3 journals phase and mode transitions at their actual boundaries, not continuous fake channels',()=>{
  const run=createShipModelRun('transitions',latePumpSpec());runShipModelChunk(run,4);
  const transitions=run.events.items().filter(e=>['phase','mode'].includes(e.kind));
  expect(transitions.map(e=>[e.timeSeconds,e.kind])).toEqual([[0,'phase'],[0,'mode'],[1,'phase'],[1,'mode'],[2,'phase'],[2,'mode'],[3,'phase'],[3,'mode']]);
  expect(transitions[0].message).toContain('quiet');expect(transitions[2].message).toContain('cool');expect(transitions[3].message).toContain('Efficient');
  expect(run.retention.channels.some(id=>/phase|mode/i.test(id))).toBe(false);
});
it('I3 bounded retention and phase/mode trace are literal-equal after resume at a phase boundary',()=>{
  const run=createShipModelRun('bounded',latePumpSpec(64));run.retention=new Retention(run.retention.channels,4);runShipModelChunk(run,17);
  const saved=shipModelResult(run,'paused'),parsed=parseShipModelResultJson(serializeResultSnapshot(saved));expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  const resumed=restoreShipModelRun(parsed.value);runShipModelChunk(run,47);runShipModelChunk(resumed,47);
  expect(serializeResultSnapshot(shipModelResult(resumed))).toBe(serializeResultSnapshot(shipModelResult(run)));
  expect(run.retention.channels).toContain('tiActive:fit:signature-1');expect(run.retention.buckets.length).toBeLessThanOrEqual(4);expect(run.retention.cadenceSeconds).toBeGreaterThan(1);
  expect(run.retention.totalTicks).toBe(64);expect(run.retention.bytes).toBeLessThanOrEqual(128*1024*1024);
});
it('I3 observer reads nonzero actual state and gates absent work instead of inventing nominal output',()=>{
  const spec=latePumpSpec(),state=structuredClone(spec.initialState);state.fuelKg={diesel:8.5,hydrogen:2.25};state.modules['fit:payload-1']={...state.modules['fit:payload-1'],durabilityR:-0.25,cooldownSeconds:13,thermalStopped:true,durabilityStopped:true};
  const surface=spec.resolvedShip.surfaces[0].id;state.surfaceOpen[surface]=false;
  const raw={requestedW:1e6,'actualW:fit:payload-1':7,'tiBusW:fit:signature-1':0,'tiHotK:fit:signature-1':0},before=structuredClone({spec,state,raw});
  const values=observeShipModelState(spec,state,raw,null);
  expect(values['fuelKg:diesel']).toBe(8.5);expect(values['fuelKg:hydrogen']).toBe(2.25);expect(values['durabilityR:fit:payload-1']).toBe(-0.25);expect(values['cooldownSeconds:fit:payload-1']).toBe(13);expect(values['thermalStopped:fit:payload-1']).toBe(1);expect(values['durabilityStopped:fit:payload-1']).toBe(1);expect(values['surfaceOpen:'+surface]).toBe(0);
  expect(values['actualW:fit:payload-1']).toBe(7);expect(values['actualMeasured:fit:payload-1']).toBe(1);expect(values['actualW:fit:signature-2']).toBe(0);expect(values['actualMeasured:fit:signature-2']).toBe(0);expect(values['tiActive:fit:signature-1']).toBe(0);
  expect(Object.keys(values).sort()).toEqual(shipModelChannelNames(spec));expect(Object.values(values).every(Number.isFinite)).toBe(true);expect({spec,state,raw}).toEqual(before);
  const reordered=structuredClone(spec);reordered.resolvedShip.instances.reverse();reordered.resolvedShip.surfaces.reverse();expect(shipModelChannelNames(reordered)).toEqual(shipModelChannelNames(spec));
});
it.each([1,2,3])('I3-R1 horizon-idle enters once and resumes literally at t=%s',cut=>{
  const spec=fixture();spec.durationSeconds=4;spec.scenario.phases[0].id='mine';spec.scenario.phases[0].durationSeconds=1;
  const full=createShipModelRun('horizon',spec),split=createShipModelRun('horizon',spec);
  runShipModelChunk(full,4);runShipModelChunk(split,cut);
  const parsed=parseShipModelResultJson(serializeResultSnapshot(shipModelResult(split,'paused')));expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  const resumed=restoreShipModelRun(parsed.value);runShipModelChunk(resumed,4-cut);
  // One work tick, then three actual idle ticks; no re-entry at checkpoint.
  expect(full.retention.buckets.map(b=>b.sum[full.retention.channels.indexOf('actualW:fit:payload-1')])).toEqual([3e6,0,0,0]);
  expect(full.events.items().filter(e=>e.kind==='phase').map(e=>[e.timeSeconds,e.message])).toEqual([[0,'mine · work'],[1,'horizon-idle · idle']]);
  expect(serializeResultSnapshot(shipModelResult(resumed))).toBe(serializeResultSnapshot(shipModelResult(full)));
});
it('I3-R2 a sub-second TI stop retains literal telemetry but not a full hot-side measurement',()=>{
  const spec=latePumpSpec(1);spec.scenario.phases=[spec.scenario.phases[1]];spec.scenario.repeat=false;
  spec.environment.directHeat=[{sourceId:'I3-R2-explicit-heat',powerW:1e10}];spec.origins['environment.directHeat.0.powerW']={kind:'experimental',unit:'W',sourceRef:'tests/model-v3/telemetry.test.ts: I3-R2'};
  const raw=stepV3(spec,spec.initialState,{},'idle'),id='fit:signature-1';
  const stop=raw.diagnostics.find(d=>d.instanceId===id&&d.reason==='critical-hot');
  // WI1: оболочка открыта вне Masking; дополнительное излучение слегка отдаляет critical-hot.
  expect(stop?.timeSeconds).toBeCloseTo(0.16009111053920166,8);expect(raw.frames.length).toBeGreaterThan(1);
  expect(raw.telemetry['tiHotK:'+id]).toBeCloseTo(87.41039856511269,4);
  const run=createShipModelRun('partial-TI',spec);runShipModelChunk(run,1);
  expect(run.last['tiHotK:'+id]).toBe(raw.telemetry['tiHotK:'+id]);expect(run.last['tiActive:'+id]).toBe(1);
  expect(run.state.modules[id].thermalStopped).toBe(true);expect(run.last['tiHotMeasured:'+id]).toBe(0);
  const i=run.retention.channels.indexOf('tiHotMeasured:'+id);expect(i).toBeGreaterThanOrEqual(0);expect(run.retention.buckets[0].min[i]).toBe(0);expect(run.retention.buckets[0].max[i]).toBe(0);
});
it('I3-R2 only a confirmed full-frame active TI tick has a physical hot-side measurement',()=>{
  const spec=latePumpSpec(1);spec.scenario.phases=[spec.scenario.phases[1]];spec.scenario.repeat=false;
  const raw=stepV3(spec,spec.initialState,{},'idle'),id='fit:signature-1';expect(raw.frames.map(f=>f.durationSeconds)).toEqual([1]);
  const run=createShipModelRun('full-TI',spec);runShipModelChunk(run,1);
  expect(run.last['tiActive:'+id]).toBe(1);expect(run.last['tiHotMeasured:'+id]).toBe(1);expect(run.last['tiHotK:'+id]).toBe(raw.telemetry['tiHotK:'+id]);
  // Positive average power alone proves only was-active, not interval coverage.
  const unconfirmed=observeShipModelState(spec,raw.state,raw.telemetry,null);expect(unconfirmed['tiActive:'+id]).toBe(1);expect(unconfirmed['tiHotMeasured:'+id]).toBe(0);
});
