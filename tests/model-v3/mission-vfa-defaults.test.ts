import {it,expect} from 'vitest';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {serializeExperiment} from '../../src/io/fitting-json';

const catalog=loadCandidateCatalog('ship-fitting-0.3.3');
const pony=getPresetFit('pony-d',catalog.version);
it('fresh Pony menu selection before route edits binds its accepted 225 m/s reference',()=>{
  const old=loadCandidateCatalog('ship-fitting-0.2.5'),w=new ShipModelWorkspace(getPresetFit('sputnik',old.version),old);
  w.loadPreset('pony-d');const spec=w.prepare();
  expect(spec.resolvedShip.hull.id).toBe('pony');expect(spec.resolvedShip.hull.class).toBe('UNKNOWN');
  expect(spec.mission!.route).toMatchObject({referenceVfaMS:225,speedPolicy:'vfa',speedMultiplier:2,cruiseSpeedMS:450});
});
it.each([
  ['sputnik-d',250],['sputnik-e',250],['ermak-d',225],['ermak-h',225],['ermak-e',225],['volna-m-h',225],
  ['titan-d',200],['titan-h',200],['titan-e',200],['severin-mir-d',225],['severin-mir-h',225],['severin-mir-e',225],
] as const)('other preset %s keeps its accepted fresh V_FA=%s',(id,referenceVfaMS)=>{
  const made=makeShipModelMissionRun(getPresetFit(id,catalog.version),catalog);if(!made.ok)throw Error(JSON.stringify(made.errors));
  expect(made.value.mission!.route.referenceVfaMS).toBe(referenceVfaMS);expect(made.value.mission!.route.cruiseSpeedMS).toBe(referenceVfaMS*2);
});
it('explicit Pony reference and custom cruise override the accepted fresh default',()=>{
  const made=makeShipModelMissionRun(pony,catalog,{referenceVfaMS:123,speedPolicy:'custom',cruiseSpeedMS:777});if(!made.ok)throw Error(JSON.stringify(made.errors));
  expect(made.value.mission!.route).toMatchObject({referenceVfaMS:123,speedPolicy:'custom',cruiseSpeedMS:777});
});
it('an explicit prior Pony route and literal imported run do not receive fresh defaults',()=>{
  const first=makeShipModelMissionRun(pony,catalog,{referenceVfaMS:250});if(!first.ok)throw Error(JSON.stringify(first.errors));
  const mission=structuredClone(first.value.mission!);Object.assign(mission.route,{speedMultiplier:1.5,cruiseSpeedMS:375});
  const made=makeShipModelMissionRun(pony,catalog,{referenceVfaMS:999,mission});if(!made.ok)throw Error(JSON.stringify(made.errors));
  expect(made.value.mission!.route).toEqual(mission.route);
  const old=loadCandidateCatalog('ship-fitting-0.2.5'),w=new ShipModelWorkspace(getPresetFit('sputnik',old.version),old),literal=serializeExperiment(made.value);
  w.importDocument(literal);expect(serializeExperiment(w.prepare())).toBe(literal);
});
it('a different UNKNOWN hull still needs an explicit reference instead of receiving the Pony value',()=>{
  const unknown=structuredClone(catalog);unknown.hulls.find(h=>h.id==='sputnik')!.class='UNKNOWN';
  const fit=getPresetFit('sputnik-d',catalog.version),refused=makeShipModelMissionRun(fit,unknown);
  expect(refused.ok).toBe(false);if(refused.ok)throw Error('Unexpected UNKNOWN default');
  expect(refused.errors.some(e=>e.path==='mission.route.referenceVfaMS')).toBe(true);
  const explicit=makeShipModelMissionRun(fit,unknown,{referenceVfaMS:190});if(!explicit.ok)throw Error(JSON.stringify(explicit.errors));
  expect(explicit.value.mission!.route.referenceVfaMS).toBe(190);
});
