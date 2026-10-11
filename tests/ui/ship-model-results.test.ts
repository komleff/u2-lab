import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {shipModelResults,shipModelComparison} from '../../src/app/fitting-ui/ship-model-results';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
const oldCatalog=loadCandidateCatalog('ship-fitting-0.2.5');
function workspace(){return new ShipModelWorkspace(getPresetFit('sputnik',oldCatalog.version),oldCatalog);}
const templates={'reference-retro-engine-diesel-S-single':'engine-diesel-S-single'};
it('direct model selection refuses the old fit; explicit preview/apply leaves source literal and shows all changes',()=>{
  const w=workspace(),source=JSON.stringify(w.source);expect(()=>w.selectModel()).toThrow(/compile|компиляц/i);
  const preview=w.previewCompilation(templates);expect(preview.changes.length).toBeGreaterThan(0);expect(preview.changes.some(c=>c.kind==='origin')).toBe(true);expect(w.fit).toBeUndefined();
  w.applyCompilation();w.selectModel();expect(w.fit!.schemaVersion).toBe('u2-ship-fit/2');expect(JSON.stringify(w.source)).toBe(source);
});
it('new run owns its immutable conditions; A/B keeps real module mass, category, delivered power and heat',()=>{
  const w=workspace();w.loadPreset('stealth-reference');w.conditions.durationSeconds=2;const s=w.start('ui-A'),run=createShipModelRun('ui-A',s);runShipModelChunk(run,2);w.acceptResult(shipModelResult(run));
  const a=w.result!;w.copyToB();w.setEnabled(a.spec.resolvedShip.instances.find(i=>i.item.family==='shielding')!.id,false);
  const next=w.start('ui-B'),b=createShipModelRun('ui-B',next);runShipModelChunk(b,2);w.acceptResult(shipModelResult(b));
  const html=shipModelComparison(a,w.result!);expect(html).toContain('sensors-thermal');expect(html).toContain('кг');expect(html).toContain('hostHeatW');expect(a.spec.resolvedShip.fit).not.toEqual(w.result!.spec.resolvedShip.fit);
  expect(shipModelResults(w.result!)).toContain('u2-lab/4');expect(shipModelResults(w.result!)).toContain('reference');expect(shipModelResults(w.result!)).not.toContain('гарантия скрытности');
});
it('native /4 import preserves measured checkpoint, resumes it, rejects future atomically and never migrates old results',()=>{
  const w=workspace();w.loadPreset('sputnik');w.conditions.durationSeconds=3;const run=createShipModelRun('saved',w.start('saved'));runShipModelChunk(run,1);const saved=shipModelResult(run,'paused');
  const opened=workspace();opened.importDocument(serializeResultSnapshot(saved));expect(opened.result).toEqual(saved);const checkpoint=opened.startCheckpoint('resume');expect(checkpoint.state).toEqual(saved.state);expect(checkpoint.runId).toBe('resume');
  const before=serializeResultSnapshot(opened.result!);const future=structuredClone(saved);future.state.stateVersion='future' as any;expect(()=>opened.importDocument(serializeResultSnapshot(future))).toThrow();expect(serializeResultSnapshot(opened.result!)).toBe(before);
  expect(()=>workspace().importDocument(JSON.stringify({schemaVersion:'u2-ship-fit/1'}))).toThrow(/стар|old|схем/i);
});
it('active test owns controls; equipment, copy and import cannot replace running/paused source',()=>{
  const w=workspace();w.loadPreset('sputnik');w.start('active');expect(()=>w.loadPreset('mir')).toThrow(/тест/i);expect(()=>w.copyToB()).toThrow(/тест/i);expect(()=>w.setEnabled('fit:march',false)).toThrow(/тест/i);
});
it('UI maneuver asks the same installed march engine in Efficient and Masking; recovery is a distinct real task',()=>{
  const w=workspace();w.loadPreset('stealth-reference');w.updateConditions({action:'maneuver',duty:0.7});const a=w.prepare();w.updateConditions({mode:'Masking'});const b=w.prepare();
  expect(a.scenario.phases[0].action).toBe('maneuver');expect(Object.keys(a.scenario.phases[0].requests)).toContain('fit:march');expect(a.scenario.phases[0].requests).toEqual(b.scenario.phases[0].requests);
  w.updateConditions({action:'recovery'});expect(w.prepare().scenario.phases[0].requests).toEqual({});
  w.updateConditions({action:'maneuver',maneuverRole:'turn'});expect(w.prepare().scenario.phases[0].requests).toEqual({'fit:turn':0.7});
});
it.each([
  ['equal',{},true],
  ['only initial T',{temperatureK:310},false],
  ['only mode',{mode:'Masking' as const},false],
] as const)('measured A/B %s conditions show both initial T/mode without altering snapshots',(_,change,same)=>{
  const w=workspace();w.loadPreset('stealth-reference');w.updateConditions({durationSeconds:1});
  const runA=createShipModelRun('A',w.start('A'));runShipModelChunk(runA,1);w.acceptResult(shipModelResult(runA));
  const a=w.result!;w.copyToB();w.updateConditions(change);
  const runB=createShipModelRun('B',w.start('B'));runShipModelChunk(runB,1);w.acceptResult(shipModelResult(runB));
  const b=w.result!,before=[serializeResultSnapshot(a),serializeResultSnapshot(b)],html=shipModelComparison(a,b);
  expect(html).toContain('Начальная T');expect(html).toContain('Efficient');expect(html).toContain('300');
  if('temperatureK' in change)expect(html).toContain('310');
  if('mode' in change)expect(html).toContain('Masking');
  expect(html.includes('Одинаковые')).toBe(same);
  expect([serializeResultSnapshot(a),serializeResultSnapshot(b)]).toEqual(before);
});
