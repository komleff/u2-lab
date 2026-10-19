import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {stealthHull,defaultFit} from '../../docs/research/2026-10-13-stealth-class/probes/stealthclass';

// Фикстура принятого плана §3, через существующий сборщик опытов ГД.
// Изменяется только копия каталога: новая SKU/версия не создаётся.
export function stealthRecoveryFixture(){
  const c=loadCandidateCatalog('ship-fitting-0.3.2'),f=getPresetFit('stealth-reference',c.version),h=c.hulls.find(h=>h.id===f.hullId)!;
  stealthHull('S')(c,f,h);defaultFit('S')(c,f,h);
  h.label='StealthS WI1 fixture — 120m² / aft441m² / 150kW / 0.4GJ';
  const provenance={kind:'experimental' as const,unit:'SI',sourceRef:'docs/product/stealth-class-v0.1.md §4; docs/plans/2026-10-17-stealth-thermal-delivery.md §3',note:'Явная принятая фикстура WI1, не catalog SKU или канонические ТТХ.'};
  for(const key of ['hullPowerW','bodyExchangeAreaM2','materials.0.massKg'])h.origins[key]=provenance;
  for(const b of h.builtins){for(const path of Object.keys(b.item.origins))b.item.origins[path]=provenance;}
  h.builtins.forEach((b,index)=>{for(const [path,value]of Object.entries(b.item.origins))h.origins[`builtins.${index}.item.${path}`]=value;});
  const made=makeShipModelMiningRun(f,c,{durationSeconds:30000,temperatureK:300,backgroundK:250,mode:'Masking',action:'idle'});
  if(!made.ok)throw Error(JSON.stringify(made.errors));return made.value;
}
export function civilianRecoveryFixture(){
  const c=loadCandidateCatalog('ship-fitting-0.3.2'),f=getPresetFit('sputnik-d',c.version);
  f.instances['fit:signature-1'].itemId='buffer-S';
  const made=makeShipModelMiningRun(f,c,{durationSeconds:1200,temperatureK:495,backgroundK:250,action:'work'});
  if(!made.ok)throw Error(JSON.stringify(made.errors));return made.value;
}
// CR-WI1-B1: законная сборка, новый пик после первого опустошения A.
// Второй буфер сохраняет общий recoveringBuffer между двумя циклами A.
export function repeatedBufferRecoveryFixture(twoBuffers=true,durationSeconds=20000){
  const c=loadCandidateCatalog('ship-fitting-0.3.2'),f=getPresetFit('sputnik-d',c.version),a='fit:signature-1',b='fit:signature-2';
  f.instances[a].itemId='buffer-S';
  if(twoBuffers){f.assignments['signature-2']=b;f.instances[b]={id:b,itemId:'buffer-S',enabled:true};}
  const made=makeShipModelMiningRun(f,c,{durationSeconds,temperatureK:400,backgroundK:250,action:'idle'});
  if(!made.ok)throw Error(JSON.stringify(made.errors));const s=made.value;
  s.initialState.buffers[a]={storedJ:1e4,minimumCaptureK:300};if(twoBuffers)s.initialState.buffers[b]={storedJ:1e9,minimumCaptureK:300};
  const hot=structuredClone(s.environment);hot.directHeat=[{sourceId:'new-peak',powerW:s.resolvedShip.heatCapacityJK*100}];
  s.scenario.phases=[{id:'first-release',action:'idle',durationSeconds:1,requests:{},environment:null},{id:'new-peak',action:'work',durationSeconds:2,requests:{},environment:hot},{id:'second-release',action:'idle',durationSeconds:durationSeconds-3,requests:{},environment:null}];
  const annotate=(v:unknown,p='')=>{if(typeof v==='number')s.origins[p]={kind:'experimental',unit:'SI',sourceRef:'CR-WI1-B1 exact production repeated buffer recovery probe'};else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))if(!['origins','origin','resolvedShip'].includes(k))annotate(x,p?p+'.'+k:k);};annotate(s);
  return s;
}
