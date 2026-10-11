import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
import {workspaceShell} from '../../src/app/fitting';
const catalog=loadCandidateCatalog('ship-fitting-0.2.5');
const workspace=()=>new ShipModelWorkspace(getPresetFit('sputnik',catalog.version),catalog);
const templates={'reference-retro-engine-diesel-S-single':'engine-diesel-S-single'};
it('I1 keeps A as the captured run owner after selecting B during running and paused intervals',()=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:3});w.copyToB();w.selectVariant('A');
  const spec=w.start('owner-A'),run=createShipModelRun('owner-A',spec);
  expect(w.active).toMatchObject({runId:'owner-A',variantId:'A',fitRevision:spec.resolvedShip.fit.fitRevision,status:'running'});
  const owner=structuredClone(w.active);w.selectVariant('B');expect(w.active).toEqual(owner);
  runShipModelChunk(run,1);expect(w.acceptResult(shipModelResult(run,'paused'))).toBe(true);
  expect(w.result).toBeUndefined();expect(w.comparison.A?.runId).toBe('owner-A');expect(w.comparison.B).toBeUndefined();
  w.setStatus('paused');w.selectVariant('A');w.selectVariant('B');
  expect(w.active).toMatchObject({variantId:'A',status:'paused'});
  for(const mutation of [()=>w.loadPreset('stealth-reference'),()=>w.setEnabled('fit:signature-1',false),()=>w.updateConditions({backgroundK:250}),()=>w.importDocument(serializeExperiment(spec)),()=>w.previewCompilation(templates),()=>w.start('second')])expect(mutation).toThrow(/актив/i);
  expect(w.active?.spec).toEqual(spec);
  runShipModelChunk(run,2);expect(w.acceptResult(shipModelResult(run))).toBe(true);
  expect(w.active).toBeUndefined();expect(w.result).toBeUndefined();expect(w.comparison.A?.status).toBe('complete');
});
it('I1 render snapshot separates the selected draft from current measured owner and is detached',()=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:3});w.copyToB();w.selectVariant('A');
  const run=createShipModelRun('render-owner',w.start('render-owner'));runShipModelChunk(run,1);w.acceptResult(shipModelResult(run,'paused'));w.selectVariant('B');
  const view=w.snapshotForRender();expect(view.selected).toBe('B');expect(view.result).toBeUndefined();expect(view.currentResult?.runId).toBe('render-owner');expect(view.active?.variantId).toBe('A');
  view.fit!.fitRevision=999;view.active!.spec.initialState.temperatureK=999;view.currentResult!.state.temperatureK=999;
  expect(w.fit!.fitRevision).not.toBe(999);expect(w.active!.spec.initialState.temperatureK).toBe(300);expect(w.comparison.A!.state.temperatureK).not.toBe(999);
  w.selectVariant('A');expect(view.selected).toBe('B');
});
it('I1 freezes measured A on pause while B is selected and keeps the reference after later results and edits',()=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:3});w.copyToB();w.selectVariant('A');
  const run=createShipModelRun('frozen-A',w.start('frozen-A'));expect(w.freeze()).toBe(false);runShipModelChunk(run,1);w.acceptResult(shipModelResult(run,'paused'));
  expect(w.freeze()).toBe(false);w.setStatus('paused');w.selectVariant('B');expect(w.freeze()).toBe(true);
  const frozen=serializeResultSnapshot(w.frozen!);expect(w.baselineId).toBe('reference');expect(w.frozen!.runId).toBe('frozen-A');expect(w.frozen!.state.timeSeconds).toBe(1);
  const detached=w.frozen!;detached.state.temperatureK=999;expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);
  runShipModelChunk(run,2);w.acceptResult(shipModelResult(run));w.loadPreset('stealth-reference');
  expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);expect(w.comparison.A!.state.timeSeconds).toBe(3);
});
it('I1 freeze refuses a previous measurement during a new run and a cancelled result',()=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:1});const run=createShipModelRun('complete',w.start('complete'));runShipModelChunk(run,1);w.acceptResult(shipModelResult(run));
  expect(w.freeze()).toBe(true);const frozen=serializeResultSnapshot(w.frozen!);w.updateConditions({durationSeconds:3});const next=createShipModelRun('next',w.start('next'));w.setStatus('paused');
  expect(w.freeze()).toBe(false);runShipModelChunk(next,1);w.acceptResult(shipModelResult(next,'cancelled'));expect(w.freeze()).toBe(false);expect(serializeResultSnapshot(w.frozen!)).toBe(frozen);
});
it('I1 renders one familiar shell with the same navigation and section owners for either model',()=>{
  for(const model of ['legacy','ship-model'] as const){
    const html=workspaceShell({model,headerActions:'',context:'',overview:'',fitting:'<p>draft</p>',conditions:'<p>conditions</p>',comparison:'<p>measurement</p>',more:'',controls:'<button>Run</button>',controlsState:'idle',footer:'model',dialogLabel:'dialog-title'});
    for(const tag of ['header','main','footer','nav'])expect(html.match(new RegExp('<'+tag+'\\b','g'))).toHaveLength(1);
    for(const id of ['workspace-fitting','workspace-conditions','workspace-compare','workspace-controls'])expect(html).toContain('id="'+id+'"');
    expect(html).toContain('href="#workspace-charts"');expect(html.match(/class="ui-controls"/g)).toHaveLength(1);
  }
});
it.each([
  {action:'idle' as const,mode:'Masking' as const,duty:1,role:'march' as const,requests:{}},
  {action:'maneuver' as const,mode:'Efficient' as const,duty:0.5,role:'turn' as const,requests:{'fit:turn':0.5}},
])('UI-B1 imported $action task survives receiver/background edits without changing requests',x=>{
  const source=workspace();source.loadPreset('stealth-reference');source.updateConditions({action:x.action,mode:x.mode,duty:x.duty,maneuverRole:x.role});
  const input=source.prepare(),literal=serializeExperiment(input),opened=workspace();opened.importDocument(literal);
  expect(opened.conditions.action).toBe(x.action);expect(opened.conditions.duty).toBe(x.duty);
  if(x.action==='maneuver')expect(opened.conditions.maneuverRole).toBe('turn');
  opened.updateConditions({receiverProfile:'absolute-contrast'});opened.updateConditions({backgroundK:250});
  const next=opened.prepare();expect(next.scenario).toEqual(input.scenario);expect(next.scenario.phases[0].requests).toEqual(x.requests);
  expect(next.receiverProfile).toBe('absolute-contrast');expect(next.environment.radiativeBackgroundK).toBe(250);
  expect(next.initialState).toEqual(input.initialState);expect(serializeExperiment(input)).toBe(literal);
  for(const edit of ['OFF','compile','preset']){
    const edited=workspace();edited.importDocument(literal);
    const mutate=()=>{
      if(edit==='OFF')edited.setEnabled('fit:signature-1',false);
      if(edit==='compile'){edited.previewCompilation(templates);edited.applyCompilation();}
      if(edit==='preset')edited.loadPreset('sputnik');
    };
    if(x.mode==='Masking'&&edit!=='OFF'){expect(mutate).toThrow(/mode/);expect(serializeExperiment(edited.prepare())).toBe(literal);}else mutate();
    expect(edited.conditions.action).toBe(x.action);expect(edited.conditions.duty).toBe(x.duty);expect(edited.prepare().scenario.phases).toEqual(input.scenario.phases);
  }
});
it('UI-B1 complex imported phases retain literal task and refuse unsupported form edits atomically',()=>{
  const source=workspace();source.loadPreset('stealth-reference');source.updateConditions({durationSeconds:4,phases:[
    {id:'quiet',action:'idle',durationSeconds:2,requests:{},environment:null,mode:'Masking'},
    {id:'turn',action:'maneuver',durationSeconds:2,requests:{'fit:turn':0.5},environment:null},
  ]});
  const input=source.prepare(),opened=workspace();opened.importDocument(serializeExperiment(input));
  expect(opened.taskEditable).toBe(false);opened.updateConditions({receiverProfile:'absolute-contrast'});opened.updateConditions({backgroundK:250});
  expect(opened.prepare().scenario).toEqual(input.scenario);const before=serializeExperiment(opened.prepare());
  expect(()=>opened.updateConditions({action:'work'})).toThrow(/импорт|сценар/i);expect(serializeExperiment(opened.prepare())).toBe(before);
  for(const edit of ['OFF','compile','preset']){
    const edited=workspace(),literal=serializeExperiment(input);edited.importDocument(literal);
    if(edit==='OFF')edited.setEnabled('fit:signature-1',false);
    if(edit==='compile'){edited.previewCompilation(templates);expect(()=>edited.applyCompilation()).toThrow(/mode/);expect(serializeExperiment(edited.prepare())).toBe(literal);}
    if(edit==='preset'){expect(()=>edited.loadPreset('sputnik')).toThrow(/mode/);expect(serializeExperiment(edited.prepare())).toBe(literal);}
    expect(edited.prepare().scenario.phases).toEqual(input.scenario.phases);expect(edited.taskEditable).toBe(false);
  }
});
it('UI-B1 non-task edits retain complete imported measurement/checkpoint/RNG and invalid import stays atomic',()=>{
  const source=workspace();source.loadPreset('stealth-reference');source.updateConditions({action:'maneuver',maneuverRole:'turn',duty:0.5,durationSeconds:4});
  const run=createShipModelRun('saved-turn',source.prepare());runShipModelChunk(run,1);const saved=shipModelResult(run,'paused'),literal=serializeResultSnapshot(saved),opened=workspace();opened.importDocument(literal);
  opened.updateConditions({receiverProfile:'absolute-contrast',backgroundK:250});expect(serializeResultSnapshot(opened.result!)).toBe(literal);
  const before=serializeExperiment(opened.prepare()),conditions=structuredClone(opened.conditions);expect(()=>opened.importDocument('{"schemaVersion":"u2-lab/99"}')).toThrow();
  expect(serializeExperiment(opened.prepare())).toBe(before);expect(opened.conditions).toEqual(conditions);expect(serializeResultSnapshot(opened.result!)).toBe(literal);
  const checkpoint=opened.startCheckpoint('resume');expect(checkpoint.state).toEqual(saved.state);expect(checkpoint.checkpoint).toEqual(saved.checkpoint);
});
it.each(['preset','compile','OFF','conditions'] as const)('UI-B2 %s draft edit preserves old measurement and stale clears only on accepted matching snapshot',edit=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:1});const run=createShipModelRun('measured',w.start('measured'));runShipModelChunk(run,1);w.acceptResult(shipModelResult(run));
  const literal=serializeResultSnapshot(w.result!);expect(w.isStale()).toBe(false);
  if(edit==='preset')w.loadPreset('stealth-reference');
  if(edit==='compile'){w.previewCompilation(templates);w.applyCompilation();}
  if(edit==='OFF')w.setEnabled('fit:signature-1',false);
  if(edit==='conditions')w.updateConditions({backgroundK:250});
  expect(w.isStale()).toBe(true);expect(serializeResultSnapshot(w.result!)).toBe(literal);
  const next=createShipModelRun('next',w.start('next'));expect(w.isStale()).toBe(true);expect(serializeResultSnapshot(w.result!)).toBe(literal);
  runShipModelChunk(next,1);w.acceptResult(shipModelResult(next));expect(w.isStale()).toBe(false);
});
it.each(['receiver','invalid OFF'] as const)('UI-B2 resumed old checkpoint does not claim a changed %s next draft was measured',edit=>{
  const w=workspace();w.loadPreset('sputnik');w.updateConditions({durationSeconds:3});const run=createShipModelRun('saved',w.prepare());runShipModelChunk(run,1);w.importDocument(serializeResultSnapshot(shipModelResult(run,'paused')));
  if(edit==='receiver')w.updateConditions({receiverProfile:'absolute-contrast'});else {w.updateConditions({action:'work'});w.setEnabled('fit:march',false);}
  expect(w.isStale()).toBe(true);
  const resumed=w.startCheckpoint('resume'),next=restoreShipModelRun(resumed);runShipModelChunk(next,1);expect(()=>w.acceptResult(shipModelResult(next,'paused'))).not.toThrow();
  expect(w.isStale()).toBe(true);expect(w.result!.spec.receiverProfile).toBe('positive-only');expect(w.result!.state.timeSeconds).toBe(2);
  if(edit==='receiver')expect(w.prepare().receiverProfile).toBe('absolute-contrast');else expect(()=>w.prepare()).toThrow(/обязательный|required/i);
});
