import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {compileShipModelFit,validateRunSpecV3} from '../../src/model/v3/schema';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {WorkerController} from '../../src/runner/protocol';
import type {RunResultV3} from '../../src/runner/ship-model-run';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';

// Literal contract: a wrong preset family or omitted installed maneuver request
// must fail independently of the catalog's own manifest/label derivation.
const configurations=[
  ['sputnik-d','diesel'],['sputnik-e','electric'],['pony-d','diesel'],
  ['ermak-d','diesel'],['ermak-h','hydrogen'],['ermak-e','electric'],['volna-m-h','hydrogen'],
  ['titan-d','diesel'],['titan-h','hydrogen'],['titan-e','electric'],
  ['severin-mir-d','diesel'],['severin-mir-h','hydrogen'],['severin-mir-e','electric'],['stealth-reference','electric'],
] as const;
// Тот же список конфигураций у 0.3.1 и текущей 0.3.2.
const cases=(['ship-fitting-0.3.1','ship-fitting-0.3.2'] as const).flatMap(version=>configurations.map(([id,family])=>[version,id,family] as const));
it.each(cases)('%s %s actual Worker completes installed %s propulsion with finite measured output',(version,id,family)=>{
  const catalog=loadCandidateCatalog(version),fit=getPresetFit(id,catalog.version),compiled=compileShipModelFit(fit,catalog);
  expect(compiled.ok,JSON.stringify(compiled)).toBe(true);if(!compiled.ok)return;
  const made=makeShipModelMiningRun(fit,catalog,{durationSeconds:3,action:'maneuver'});
  expect(made.ok,JSON.stringify(made)).toBe(true);if(!made.ok)return;
  const spec=made.value,before=structuredClone(spec),engines=spec.resolvedShip.instances.filter(i=>i.item.family==='engine'&&i.role==='march');
  expect(engines.length).toBeGreaterThan(0);expect(engines.every(i=>i.item.propulsionType===family)).toBe(true);
  expect(validateRunSpecV3(spec).ok).toBe(true);
  const messages:any[]=[],worker=new WorkerController(m=>messages.push(structuredClone(m)));
  worker.handle({runId:id,commandId:1,type:'start',payload:{spec,maxSteps:1}});
  for(let tick=0;tick<3;tick++){
    worker.pump();const chunk=messages.findLast(m=>m.type==='chunk');
    expect(chunk?.payload.state.timeSeconds).toBe(tick+1);
    expect(Object.values(chunk.payload.telemetry).every(v=>typeof v==='number'&&Number.isFinite(v))).toBe(true);
    for(const engine of engines){expect(chunk.payload.telemetry['actualMeasured:'+engine.id]).toBe(1);expect(chunk.payload.telemetry['actualW:'+engine.id]).toBeGreaterThan(0);}
    worker.handle({runId:id,type:'telemetry-ack',chunkId:chunk.chunkId});
  }
  expect(messages.filter(m=>m.type==='error')).toEqual([]);
  const saved=messages.find(m=>m.type==='complete')?.payload as RunResultV3;
  expect(saved?.status).toBe('complete');expect(saved.state.timeSeconds).toBe(3);expect(saved.spec).toEqual(before);expect(spec).toEqual(before);
  expect(saved.signatures.last?.receiverIrW).toBeGreaterThanOrEqual(0);expect(saved.signatures.last?.observedEmW).toBeGreaterThanOrEqual(0);
  expect(parseShipModelResultJson(serializeResultSnapshot(saved)).ok).toBe(true);
  if(family==='electric'){
    expect(saved.state.chargeJ).toBeLessThan(spec.initialState.chargeJ);
    expect(saved.state.fuelKg).toEqual(spec.initialState.fuelKg);
    expect(messages.filter(m=>m.type==='chunk').some(m=>m.payload.telemetry.deliveredW>0)).toBe(true);
  }else{
    expect(spec.initialState.fuelKg[family]).toBeGreaterThan(0);
    expect(saved.state.fuelKg[family]).toBeLessThan(spec.initialState.fuelKg[family]);
  }
});
