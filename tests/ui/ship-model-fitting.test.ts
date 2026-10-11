import {expect,it} from 'vitest';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
const sourceCatalog=loadCandidateCatalog('ship-fitting-0.2.5');
const workspace=()=>{const w=new ShipModelWorkspace(getPresetFit('sputnik',sourceCatalog.version),sourceCatalog);w.loadPreset('sputnik');return w;};
it('I2 preview leaves fit/measurement untouched and Apply commits only the reviewed clone once',()=>{
  const w=workspace();w.updateConditions({durationSeconds:1});const run=createShipModelRun('measured',w.start('measured'));runShipModelChunk(run,1);w.acceptResult(shipModelResult(run));
  const fit=structuredClone(w.fit),measurement=serializeResultSnapshot(w.result!);
  const preview=w.previewReplacement('signature-1','radiator-active-S');
  expect(preview.ok).toBe(true);expect(preview.fit?.fitRevision).toBe(2);expect(w.fit).toEqual(fit);expect(serializeResultSnapshot(w.result!)).toBe(measurement);
  preview.fit!.instances['fit:signature-1'].itemId='battery-M';w.applyReplacement();
  expect(w.fit!.instances['fit:signature-1'].itemId).toBe('radiator-active-S');expect(w.fit!.fitRevision).toBe(2);expect(w.isStale()).toBe(true);
  expect(serializeResultSnapshot(w.result!)).toBe(measurement);expect(()=>w.applyReplacement()).toThrow(/предпросмотр|preview/i);
});
it.each([['march','engine-electric-M-single'],['march','engine-electric-S-pair'],['payload-1','battery-S'],['builtin:cargo',null]])('I2 refuses incompatible or builtin replacement %s / %s atomically',(slot,item)=>{
  const w=workspace(),before=serializeExperiment(w.prepare()),preview=w.previewReplacement(slot!,item);
  expect(preview.ok).toBe(false);expect(preview.errors.length).toBeGreaterThan(0);expect(()=>w.applyReplacement()).toThrow();expect(serializeExperiment(w.prepare())).toBe(before);
});
it('I2 stale fit revision, changed conditions and selected variant cannot apply a prior preview',()=>{
  for(const change of ['fit','conditions','variant']){
    const w=workspace();w.copyToB();w.selectVariant('A');w.previewReplacement('signature-1','radiator-active-S');
    if(change==='fit')w.setEnabled('fit:signature-1',false);if(change==='conditions')w.updateConditions({backgroundK:250});if(change==='variant')w.selectVariant('B');
    const before=structuredClone(w.snapshotForRender());expect(()=>w.applyReplacement()).toThrow(/измен|предпросмотр|revision/i);expect(w.snapshotForRender()).toEqual(before);
  }
});
it('I2 removing an explicit phase request owner is refused, while an unrequested optional module can be removed',()=>{
  const w=workspace(),spec=w.prepare();w.replaceScenario({...spec.scenario,durationSeconds:spec.durationSeconds});
  const before=serializeExperiment(w.prepare()),refused=w.previewReplacement('payload-1',null);
  expect(refused.ok).toBe(false);expect(refused.errors.map(e=>e.message).join(' ')).toMatch(/instance|запрос|владел/i);expect(()=>w.applyReplacement()).toThrow();expect(serializeExperiment(w.prepare())).toBe(before);
  expect(w.previewReplacement('signature-1',null).ok).toBe(true);w.applyReplacement();expect(w.fit!.assignments['signature-1']).toBeUndefined();expect(w.prepare().scenario).toEqual(spec.scenario);
});
it('I2 all fit preview/apply actions refuse during captured A run even with draft B selected',()=>{
  const w=workspace();w.copyToB();w.selectVariant('A');w.previewReplacement('signature-1','radiator-active-S');w.start('active');w.selectVariant('B');w.setStatus('paused');
  const owner=w.active,before=w.snapshotForRender();expect(()=>w.previewReplacement('signature-1','radiator-active-S')).toThrow(/актив/i);expect(()=>w.applyReplacement()).toThrow(/актив/i);
  expect(w.active).toEqual(owner);expect(w.snapshotForRender()).toEqual(before);
});
it('I2 copying A over B invalidates B preview even when its fit revision and mounting are identical',()=>{
  const w=workspace();w.copyToB();w.previewReplacement('signature-1','radiator-active-S');w.selectVariant('A');w.updateConditions({backgroundK:250});w.copyToB();
  const before=serializeExperiment(w.prepare());expect(()=>w.applyReplacement()).toThrow(/измен|предпросмотр/i);expect(serializeExperiment(w.prepare())).toBe(before);
});
it('I2 a named scenario survives fit Apply and a measured matching run clears stale for captured A',()=>{
  const w=workspace();const spec=w.prepare();w.replaceScenario({...spec.scenario,name:'Мой цикл',durationSeconds:1,phases:[{...spec.scenario.phases[0],durationSeconds:1}]});
  w.previewReplacement('signature-1','radiator-active-S');w.applyReplacement();const run=createShipModelRun('named-owner',w.start('named-owner'));
  expect(run.spec.scenario.name).toBe('Мой цикл');runShipModelChunk(run,1);w.acceptResult(shipModelResult(run));expect(w.isStale()).toBe(false);
});
