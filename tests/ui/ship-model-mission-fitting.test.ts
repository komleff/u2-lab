import {it,expect} from 'vitest';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
const c=loadCandidateCatalog('ship-fitting-0.2.5');
const workspace=()=>new ShipModelWorkspace(getPresetFit('sputnik',c.version),c);
const miners=(s:ReturnType<ShipModelWorkspace['prepare']>)=>s.resolvedShip.instances.filter(i=>i.item.family==='mining').map(i=>i.id).sort();
it.each([false,true].flatMap(imported=>[1,2,3,4,1.5].map(multiplier=>[imported,multiplier] as const)))('explicit mission fitting reconciles add/remove after route edit; imported=%s multiplier=%s',(imported,multiplier)=>{
 const w=workspace();if(imported)w.importDocument(serializeExperiment(w.prepare()));
 w.updateConditions({durationSeconds:1});const run=createShipModelRun('measured',w.start('measured'));runShipModelChunk(run,1);w.acceptResult(shipModelResult(run));expect(w.freeze()).toBe(true);const measured=serializeResultSnapshot(w.result!),frozen=serializeResultSnapshot(w.frozen!);
 w.updateConditions({durationSeconds:3600});w.updateMission({route:{...w.prepare().mission!.route,distanceM:10000,referenceVfaMS:150,speedMultiplier:multiplier,cruiseSpeedMS:150*multiplier},stationReplenish:false});const conditions=structuredClone(w.prepare().mission!);
 expect(w.previewReplacement('payload-2','mining-civil-S').ok).toBe(true);w.applyReplacement();const added=w.prepare();expect(miners(added)).toEqual(['fit:payload-1','fit:payload-2']);expect([...added.mission!.selectedWorkGroup].sort()).toEqual(miners(added));expect(Object.keys(added.scenario.phases[0].requests).sort()).toEqual(miners(added));expect({...added.mission,selectedWorkGroup:conditions.selectedWorkGroup}).toEqual(conditions);
 const physical=structuredClone(added);physical.initialState.mission!.stage='mining';physical.initialState.mission!.positionM=physical.mission!.route.distanceM;const mining=createShipModelRun('two-paid-lasers',physical);runShipModelChunk(mining,1);expect(mining.last['actualW:fit:payload-1']).toBeGreaterThan(0);expect(mining.last['actualW:fit:payload-2']).toBeGreaterThan(0);
 expect(w.previewReplacement('payload-2',null).ok).toBe(true);w.applyReplacement();const removed=w.prepare();expect(removed.mission!.selectedWorkGroup).toEqual(['fit:payload-1']);expect(removed.scenario.phases[0].requests).not.toHaveProperty('fit:payload-2');expect(removed.mission!.route).toEqual(conditions.route);expect(removed.mission!.process).toEqual(conditions.process);expect(removed.mission!.stationReplenish).toBe(false);expect(serializeResultSnapshot(w.result!)).toBe(measured);expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);
 w.copyToB();expect(w.prepare().mission).toEqual(removed.mission);w.loadPreset('severin-mir-d');const preset=w.prepare();expect([...preset.mission!.selectedWorkGroup].sort()).toEqual(miners(preset));expect(preset.mission!.route).toEqual(conditions.route);expect(preset.mission!.stationReplenish).toBe(false);w.selectVariant('A');expect(serializeExperiment(w.prepare())).toBe(serializeExperiment(removed));expect(serializeResultSnapshot(w.result!)).toBe(measured);expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);
});
