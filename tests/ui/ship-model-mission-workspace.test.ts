import {it,expect} from 'vitest';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {shipModelConditions} from '../../src/app/fitting-ui/ship-model-conditions';
import {serializeExperiment} from '../../src/io/fitting-json';
const c=loadCandidateCatalog('ship-fitting-0.2.5');
const workspace=()=>new ShipModelWorkspace(getPresetFit('sputnik',c.version),c);
it('fresh workspace presents mission H3600, editable route and a separate stationary choice',()=>{
 const w=workspace(),s=w.prepare();expect(s.mission).toBeDefined();expect(s.durationSeconds).toBe(3600);const html=shipModelConditions(w.conditions,s,false,true);expect(html).toContain('Шахтёрский рейс');expect(html).toContain('id="sm-distance"');expect(html).toContain('id="sm-station"');
 w.selectWorkMode('stationary');expect(w.prepare().mission).toBeUndefined();expect(w.prepare().modelVersion).toBe('ship-fitting-ship-model-0.1');expect(shipModelConditions(w.conditions,w.prepare(),false,true)).toContain('id="sm-action"');
});
it('mission route edits change next captured spec only and imports remain literal',()=>{
 const w=workspace(),s=w.start('owned');expect(()=>w.selectWorkMode('stationary')).toThrow();w.abort();w.updateMission({route:{...s.mission!.route,distanceM:50000}});expect(w.prepare().mission!.route.distanceM).toBe(50000);expect(s.mission!.route.distanceM).toBe(100000);
 const literal=serializeExperiment(s);w.importDocument(literal);expect(serializeExperiment(w.prepare())).toBe(literal);
});
it('invalid route stays editable and can be corrected without losing the mission draft',()=>{
 const w=workspace(),route=w.prepare().mission!.route;w.updateMission({route:{...route,distanceM:-1}});expect(()=>w.prepare()).toThrow();expect(shipModelConditions(w.conditions,undefined,false,true)).toContain('id="sm-distance"');w.updateMission({route:{...route,distanceM:20000}});expect(w.prepare().mission!.route.distanceM).toBe(20000);
});
