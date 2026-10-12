import {expect,it} from 'vitest';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {validateRunSpecV3} from '../../src/model/v3/schema';
import type {RunSpecV3} from '../../src/model/v3/types';
const catalog=loadCandidateCatalog('ship-fitting-0.2.5');
const workspace=()=>{const w=new ShipModelWorkspace(getPresetFit('sputnik',catalog.version),catalog);w.loadPreset('stealth-reference','ship-fitting-0.3.0');return w;};
const scenario:RunSpecV3['scenario']&{durationSeconds:number}={name:'Работа → восстановление',repeat:true,durationSeconds:6,phases:[
  {id:'work',action:'work',durationSeconds:2,requests:{'fit:payload-1':0.5},mode:'Efficient',environment:null},
  {id:'recover',action:'recovery' as const,durationSeconds:1,requests:{},mode:'Masking' as const,environment:{radiativeBackgroundK:250,backgroundSourceId:'phase-background',thermalField:{temperatureK:270,coefficientWPerM2K:0.1,sourceId:'field'},solarFluxWm2:10,solarSourceId:'sun',energyInputs:[{sourceId:'bus',representation:'electric' as const,powerW:1}],directHeat:[{sourceId:'heat',powerW:2}]}},
]};
it('I2 whole scenario edit is detached, validated and reaches the actual run with repeat and phase mode/environment',()=>{
  const w=workspace(),input=structuredClone(scenario);w.replaceScenario(input);input.phases[0].requests['fit:payload-1']=1;
  const spec=w.start('literal-scenario');expect(validateRunSpecV3(spec).ok).toBe(true);expect(spec.scenario).toEqual({name:scenario.name,repeat:true,phases:scenario.phases});expect(spec.durationSeconds).toBe(6);
  const run=createShipModelRun('literal-scenario',spec);runShipModelChunk(run,3);expect(run.state.mode).toBe('Masking');runShipModelChunk(run,1);expect(run.state.mode).toBe('Efficient');expect(run.state.phaseIndex).toBe(0);
});
it.each(['fractional seconds','duplicate ID','unknown owner','bad duty','bad mode','bad environment','unknown raw field','empty phases'])('I2 invalid %s whole edit rolls back every draft field',kind=>{
  const w=workspace();w.replaceScenario(scenario);const before=serializeExperiment(w.prepare()),view=w.snapshotForRender(),bad=structuredClone(scenario);
  if(kind==='fractional seconds')bad.phases[0].durationSeconds=1.5;if(kind==='duplicate ID')bad.phases[1].id='work';if(kind==='unknown owner')bad.phases[0].requests={'missing':0.5} as typeof bad.phases[0]['requests'];
  if(kind==='bad duty')bad.phases[0].requests['fit:payload-1']=1.1;if(kind==='bad mode')bad.phases[0].mode='UNKNOWN' as typeof bad.phases[0]['mode'];if(kind==='bad environment')bad.phases[1].environment!.radiativeBackgroundK=-1;
  if(kind==='unknown raw field')(bad.phases[0] as any).unsupported=1;if(kind==='empty phases')bad.phases=[];
  expect(()=>w.replaceScenario(bad)).toThrow();expect(serializeExperiment(w.prepare())).toBe(before);expect(w.snapshotForRender()).toEqual(view);
});
it('I2 imported complex task is editable without losing literal unrelated spec fields or measured checkpoint',()=>{
  const source=workspace();source.replaceScenario(scenario);const spec=source.prepare();spec.initialState.rng={algorithm:'xorshift32/1',seed:42,state:77};spec.initialState.chargeJ=123456;spec.origins['initialState.chargeJ']={kind:'experimental',sourceRef:'test:imported-condition',unit:'J',note:'literal imported condition'};
  expect(validateRunSpecV3(spec).ok).toBe(true);const run=createShipModelRun('saved',spec);runShipModelChunk(run,1);const saved=shipModelResult(run,'paused'),literal=serializeResultSnapshot(saved),w=workspace();w.importDocument(literal);
  const next={...structuredClone(scenario),name:'Отредактированный импорт',durationSeconds:9};next.phases[1].durationSeconds=2;w.replaceScenario(next);
  const actual=w.prepare();expect(actual.scenario).toEqual({name:next.name,repeat:true,phases:next.phases});expect(actual.durationSeconds).toBe(9);
  const outside=(s:RunSpecV3)=>{const {scenario:ignored,durationSeconds:duration,origins,...rest}=s;return rest;};expect(outside(actual)).toEqual(outside(spec));expect(actual.origins['initialState.chargeJ']).toEqual(spec.origins['initialState.chargeJ']);
  expect(serializeResultSnapshot(w.result!)).toBe(literal);expect(w.isStale()).toBe(true);w.updateConditions({backgroundK:260});expect(w.prepare().scenario).toEqual(actual.scenario);
});
it('I2 whole scenario replacement refuses during paused A regardless of selected next draft B',()=>{
  const w=workspace();w.copyToB();w.selectVariant('A');w.start('owner');w.setStatus('paused');w.selectVariant('B');const before=w.snapshotForRender();
  expect(()=>w.replaceScenario(scenario)).toThrow(/актив/i);expect(w.snapshotForRender()).toEqual(before);
});
