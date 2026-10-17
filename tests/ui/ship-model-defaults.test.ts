import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {shipModelConditions} from '../../src/app/fitting-ui/ship-model-conditions';
import {makeMiningRun,makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
const old=loadCandidateCatalog('ship-fitting-0.2.5'),current=loadCandidateCatalog('ship-fitting-0.3.2');
const workspace=()=>new ShipModelWorkspace(getPresetFit('sputnik',old.version),old);
const unwrap=<T>(r:{ok:true;value:T}|{ok:false;errors:unknown[]}):T=>{if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;};
it('fresh builder supplies 250 K, while explicit 100 K remains an authored condition',()=>{
  const fit=getPresetFit('sputnik-d',current.version);
  expect(unwrap(makeShipModelMiningRun(fit,current)).environment.radiativeBackgroundK).toBe(250);
  expect(unwrap(makeShipModelMiningRun(fit,current,{backgroundK:100})).environment.radiativeBackgroundK).toBe(100);
});
it('fresh conditions form uses 250 K without replacing an explicit 100 K value',()=>{
  expect(shipModelConditions({},undefined,false,true)).toMatch(/id="sm-background"[^>]*value="250"/);
  expect(shipModelConditions({backgroundK:100},undefined,false,true)).toMatch(/id="sm-background"[^>]*value="100"/);
});
it('empty B is not initialized implicitly; copy to B carries explicit authored conditions',()=>{
  const w=workspace();w.selectVariant('B');expect(w.fit).toBeUndefined();expect(()=>w.prepare()).toThrow();
  w.selectVariant('A');w.updateConditions({backgroundK:100});w.copyToB();
  expect(w.selected).toBe('B');expect(w.prepare().environment.radiativeBackgroundK).toBe(100);
  expect(w.fit?.hullId).toBe('sputnik');
});
it('imported run retains literal 100 K globally and per phase instead of fresh defaults',()=>{
  const environment=unwrap(makeShipModelMiningRun(getPresetFit('sputnik-d',current.version),current,{backgroundK:100})).environment;
  const spec=unwrap(makeShipModelMiningRun(getPresetFit('sputnik-d',current.version),current,{backgroundK:100,durationSeconds:2,phases:[{id:'explicit',action:'idle',durationSeconds:2,requests:{},environment}]}));
  const literal=serializeExperiment(spec),w=workspace();w.importDocument(literal);
  expect(serializeExperiment(w.prepare())).toBe(literal);
  expect(w.prepare().scenario.phases[0].environment?.radiativeBackgroundK).toBe(100);
});
it('imported paused result keeps literal 100 K and its checkpoint without reinitialization',()=>{
  const spec=unwrap(makeShipModelMiningRun(getPresetFit('sputnik-d',current.version),current,{backgroundK:100,durationSeconds:2}));
  const run=createShipModelRun('explicit-100',spec);runShipModelChunk(run,1);
  const literal=serializeResultSnapshot(shipModelResult(run,'paused')),w=workspace();w.importDocument(literal);
  expect(serializeResultSnapshot(w.result!)).toBe(literal);
  expect(w.prepare().environment.radiativeBackgroundK).toBe(100);
});
it('legacy mining builder retains its original 100 K default',()=>{
  expect(unwrap(makeMiningRun(getPresetFit('sputnik',old.version),old)).environment.effectiveBackgroundK).toBe(100);
});
