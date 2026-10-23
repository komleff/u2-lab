import {it,expect} from 'vitest';
import {fixture} from '../governor-v03/reference-clock';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeGovernorExperiment} from '../../src/experiments/ship-model-v0.2';
import {createShipModelRunV02,runShipModelChunkV02,shipModelResultV02} from '../../src/runner/ship-model-run-v02';
import {shipModelGovernorConditions} from '../../src/app/fitting-ui/ship-model-conditions';
import {shipModelGovernorLabView} from '../../src/app/fitting-ui/ship-model-lab-view';
import {governorChannelInfoV02} from '../../src/app/fitting-ui/ship-model-channels';

it('opens an explicit qualification document atomically and freezes captured results',async()=>{
  const w=new ShipModelWorkspace(getPresetFit('sputnik'),loadCandidateCatalog()),legacy=JSON.stringify(w.prepare());
  expect(()=>w.importDocument('{"schemaVersion":"u2-lab/4","modelVersion":"unknown"}')).toThrow();expect(JSON.stringify(w.prepare())).toBe(legacy);
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:90,name:'Synthetic UI'});w.importDocument(JSON.stringify(spec));
  expect(w.governorDocument?.spec).toEqual(spec);expect(w.inspectOpening(JSON.stringify(spec)).legacy).toBe(false);
  const run=await import('../../src/runner/ship-model-run-v02');w.startGovernor('frozen');const context=run.createShipModelRunV02('frozen',spec);run.runShipModelChunkV02(context,1);w.setGovernorStatus('paused');w.acceptGovernorResult(run.shipModelResultV02(context));expect(w.freezeGovernor()).toBe(true);w.acceptGovernorResult(run.shipModelResultV02(context,'cancelled'));
  const frozen=JSON.stringify(w.governorFrozen);w.replaceGovernorSpec({...spec,name:'Edited'});expect(JSON.stringify(w.governorFrozen)).toBe(frozen);
  expect(()=>w.importDocument(JSON.stringify({...spec,stateVersion:'ship-state/2'}))).toThrow();expect(w.governorDocument?.spec.name).toBe('Edited');
});

it('keeps frozen A independent of B runs, draft edits and profile inspection',()=>{
  const w=new ShipModelWorkspace(getPresetFit('sputnik'),loadCandidateCatalog()),spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:3,name:'A'});w.importDocument(JSON.stringify(spec));w.startGovernor('A');const a=createShipModelRunV02('A',spec);runShipModelChunkV02(a,3);w.acceptGovernorResult(shipModelResultV02(a));expect(w.freezeGovernor()).toBe(true);const frozen=JSON.stringify(w.governorFrozen);
  const preview=w.governorDocument!;preview.spec.profile={...preview.spec.profile,id:'mutated-view'};w.copyToB();w.replaceGovernorSpec({...spec,name:'B'});w.startGovernor('B');const b=createShipModelRunV02('B',w.governorDocument!.spec);runShipModelChunkV02(b,3);w.acceptGovernorResult(shipModelResultV02(b));expect(w.governorDocument!.result!.runId).toBe('B');expect(JSON.stringify(w.governorFrozen)).toBe(frozen);w.resetGovernor();expect(w.governorDocument!.result).toBeUndefined();expect(JSON.stringify(w.governorFrozen)).toBe(frozen);
});

it('renders measured time, SI values and journal from the committed producer',()=>{
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:2,name:'Views'}),run=createShipModelRunV02('views',spec);runShipModelChunkV02(run,2);const r=shipModelResultV02(run),literal=JSON.stringify(r),html=shipModelGovernorLabView(r,{group:'heat',unit:'K',hidden:new Set(),eventIndex:0,bucketIndex:0,detailsOpen:true},'all');
  expect(html).toContain('data-time="0.06666666666666667"');expect(html).toContain('data-tick="2"');expect(html).toContain('data-channel="temperatureK"');expect(html).toContain('data-mean="'+(r.buckets[0].sum[r.channels.indexOf('temperatureK')]/2)+'"');expect(html).toContain(r.events[0].message);expect(JSON.stringify(r)).toBe(literal);expect(shipModelGovernorConditions(spec,false)).toContain('30 Hz');
});

for(const mutate of [(s:any)=>{s.modelVersion='unknown';},(s:any)=>{s.stateVersion='ship-state/2';},(s:any)=>{s.governorVersion='unknown';},(s:any)=>{s.profileVersion='unknown';},(s:any)=>{s.dtSeconds=1;},(s:any)=>{s.qualification.runtimeAuthorization=true;},(s:any)=>{s.initialState.governor.rng.state=-1;}])it('refuses unknown or mixed versions atomically',()=>{
  const w=new ShipModelWorkspace(getPresetFit('sputnik'),loadCandidateCatalog()),spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:3,name:'Atomic'});w.importDocument(JSON.stringify(spec));const before=JSON.stringify(w.governorDocument),bad=structuredClone(spec);mutate(bad);expect(()=>w.importDocument(JSON.stringify(bad))).toThrow();expect(JSON.stringify(w.governorDocument)).toBe(before);
});

it('labels water as a measured resource stock with SI mass, rather than as fuel',()=>{
  const spec=makeGovernorExperiment({...fixture('T16').input,durationTicks:1,name:'Water'}),run=createShipModelRunV02('water',spec);runShipModelChunkV02(run,1);const water=spec.profile.resources.find(r=>r.species==='water')!,id='resourceKg:'+water.id;
  expect(run.checkpoint.lastTelemetry[id]).toBe(run.state.governor.resourceMassKg.find(r=>r.id===water.id)!.massKg);expect(governorChannelInfoV02(id)).toMatchObject({unit:'кг',group:'stocks'});expect(governorChannelInfoV02(id).label).toContain('Ресурс');
});
