import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import generations from '../../data/experiments/ship-model-v0.1-generations.json';
import vectors from '../../docs/verification/ship-model-v0.1-vectors.json';
import {loadCandidateCatalog,getPresetFit} from '../fitting/catalog';
import {makeShipModelMiningRun,type ShipModelConditions} from '../scenarios/fitting';
import type {CandidateCatalogV3,ShipFitV3,RunSpecV3,ModuleItemV3,HullV3} from '../model/v3/types';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../runner/ship-model-run';
import {stepV3} from '../model/v3/step';
import {allocateCascade} from '../model/v3/thermal-control';
import {serializeResultSnapshot} from '../io/fitting-json';
const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
const unwrap=<T>(r:import('../catalog/schema').ValidationResult<T>):T=>{if(!r.ok)throw Error(r.errors.map(e=>e.path+': '+e.message).join('\n'));return r.value;};
const origin=(unit:string)=>({kind:'experimental' as const,unit,sourceRef:'src/experiments/ship-model-v0.1.ts; ship-model-generations/1',note:'Изолированное условие/sensitivity candidate, не канон и не паспорт U2.'});
function setNumber(item:ModuleItemV3,path:string,value:number){item.numerics[path]=value;item.origins['numerics.'+path]=origin('SI');}
function addBuiltin(hull:HullV3,id:string,item:ModuleItemV3){const index=hull.builtins.length;hull.builtins.push({id,item:structuredClone(item)});for(const[path,value]of Object.entries(item.origins))hull.origins['builtins.'+index+'.item.'+path]=structuredClone(value);}
type Case={id:string;spec:RunSpecV3;input:{preset:string;conditions:ShipModelConditions;candidate:string;durationSeconds:number;specSha256:string}};
export function buildExperimentalCases():Case[]{
  const cases:Case[]=[],base=loadCandidateCatalog('ship-fitting-0.3.0');
  const add=(id:string,preset:string,conditions:ShipModelConditions,change?:(c:CandidateCatalogV3,f:ShipFitV3,h:HullV3)=>void,candidate='literal 0.3.0 candidate')=>{
    const c=structuredClone(base),f=getPresetFit(preset,c.version),h=c.hulls.find(h=>h.id===f.hullId)!;change?.(c,f,h);const spec=unwrap(makeShipModelMiningRun(f,c,conditions));cases.push({id,spec,input:{preset,conditions:structuredClone(conditions),candidate,durationSeconds:spec.durationSeconds,specSha256:hash(JSON.stringify(spec))}});
  };
  const fields={standard:{radiativeBackgroundK:100,backgroundSourceId:'matrix-bg',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]},cold:{radiativeBackgroundK:100,backgroundSourceId:'matrix-bg',thermalField:{sourceId:'matrix-field',temperatureK:100,coefficientWPerM2K:10},solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]},hot:{radiativeBackgroundK:500,backgroundSourceId:'matrix-bg',thermalField:{sourceId:'matrix-field',temperatureK:650,coefficientWPerM2K:10},solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]}};
  for(const preset of ['sputnik','severin-mir'])for(const[field,environment]of Object.entries(fields))for(const mode of ['Efficient']as const){
    add(`${preset}-${field}-${mode}`,preset,{durationSeconds:40,temperatureK:450,environment,mode,phases:[{id:'idle',action:'idle',durationSeconds:5,requests:{},environment:null},{id:'work',action:'work',durationSeconds:10,requests:{'fit:payload-1':0.5},environment:null},{id:'peak',action:'work',durationSeconds:5,requests:{'fit:payload-1':1},environment:null},{id:'recovery',action:'recovery',durationSeconds:10,requests:{},environment:null},{id:'repeat',action:'work',durationSeconds:10,requests:{'fit:payload-1':0.5},environment:null}]});
  }
  for(const point of generations.points)for(const field of ['standard','hot','cold']as const)for(const harder of [false,true]){
    add(`generation-${point.generation}-${field}-${harder?'harder':'same-task'}`,'sputnik',{durationSeconds:harder?60:30,temperatureK:450,environment:fields[field],duty:harder?1:0.5},(c,f)=>{
      const item=structuredClone(c.items['mining-civil-S']);item.id='candidate-laser-G'+point.generation;item.label='Laser sensitivity G'+point.generation;item.generation=point.generation;item.origins.generation=origin('1');
      const useful=c.items['mining-civil-S'].numerics.powerW*c.items['mining-civil-S'].numerics.efficiency;setNumber(item,'efficiency',point.efficiency);setNumber(item,'powerW',useful*point.usefulScale/point.efficiency);f.localVariants[item.id]=item;f.instances['fit:payload-1'].itemId=item.id;
    },`ship-model-generations/1 G${point.generation}; laser only, mass/source/thermal gates unchanged`);
  }
  for(const mode of ['Efficient','Masking']as const)for(const duty of [0.1,1])add(`stealth-${mode}-maneuver-${duty}`,'stealth-reference',{durationSeconds:30,temperatureK:450,mode,action:'maneuver',duty});
  add('stealth-Masking-forbidden-work','stealth-reference',{durationSeconds:30,temperatureK:450,mode:'Masking'});
  add('stealth-Masking-gyro-turn','stealth-reference',{durationSeconds:30,temperatureK:450,mode:'Masking',action:'maneuver',maneuverRole:'turn'});
  add('stealth-Masking-generator-recurrence','stealth-reference',{durationSeconds:3,temperatureK:450,mode:'Masking',phases:[{id:'deficit',action:'idle',durationSeconds:1,requests:{},environment:fields.standard},{id:'covered',action:'idle',durationSeconds:1,requests:{},environment:{...fields.standard,energyInputs:[{sourceId:'independent',representation:'electric',powerW:1e6}]}},{id:'deficit-again',action:'idle',durationSeconds:1,requests:{},environment:fields.standard}]},(c,f,h)=>{f.initial.chargeFraction=0.005;f.instances['fit:power-2'].itemId='generator-diesel-S';addBuiltin(h,'experimental-diesel-tank',c.items['tank-diesel-S']);},'Real below-1% permission, zero-output covered phase and later permitted deficit');
  for(const policy of ['deferrable-background','optional-pulse-charge']as const)add('stealth-Masking-'+policy,'stealth-reference',{durationSeconds:3,temperatureK:450,mode:'Masking',action:'idle'},(c,_f,h)=>{const sensor=structuredClone(c.items['sensor-S']);sensor.operationPolicy=policy;addBuiltin(h,'experimental-background',sensor);},'Candidate operation policy; real installed mass/power, paused before Masking ledgers');
  add('military-structural-buffer-aft','sputnik',{durationSeconds:30,temperatureK:500,mode:'Combat'},(c,_f,h)=>{h.class='Military';h.modes=['Efficient','Combat'];h.label='Military structural fixture — not a passport';h.origins.class=origin('class');addBuiltin(h,'structural-buffer',c.items['buffer-S']);h.hullPassiveRadiator!.irProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:0.8};h.hullPassiveRadiator!.origins['irProfile.aftFraction']=origin('1');h.origins['hullPassiveRadiator.irProfile.aftFraction']=origin('1');},'Structural class only; inherited candidate components, no Military balance claim');
  for(const area of [10,300])for(const pump of ['thermoinverter-S','pump-radiator-S'])for(const generator of [false,true])add(`surface-${area}-${pump}-${generator?'generator':'battery'}`,'sputnik',{durationSeconds:30,temperatureK:500,environment:{...fields.hot,directHeat:[{sourceId:'hard-load',powerW:1e6}]}},(c,f,h)=>{
    h.hullPassiveRadiator!.areaM2=area;h.hullPassiveRadiator!.origins.areaM2=origin('m²');h.origins['hullPassiveRadiator.areaM2']=origin('m²');f.instances['fit:signature-1'].itemId=pump;if(generator){f.instances['fit:power-2'].itemId='generator-diesel-S';addBuiltin(h,'experimental-diesel-tank',c.items['tank-diesel-S']);}
  },`Candidate area ${area} m²; same thermal environment/load, real installed ${pump}/source`);
  for(const aft of [false,true])add(`surface-mixed-${aft?'aft':'ordinary'}`,'sputnik',{durationSeconds:30,temperatureK:450},(_c,_f,h)=>{h.hullPassiveRadiator!.irProfile={version:'radiator-ir/1',kind:aft?'aft-directed':'omnidirectional',aftFraction:aft?0.8:0};h.hullPassiveRadiator!.origins['irProfile.aftFraction']=origin('1');},'Observer direction changes only, equal total thermal watts');
  add('surface-mixed-hot-common-ti','sputnik',{durationSeconds:3,temperatureK:500,environment:{...fields.standard,directHeat:[{sourceId:'hard-load',powerW:1e6}]}},(c,f,h)=>{f.instances['fit:signature-1'].itemId='thermoinverter-S';h.hullPassiveRadiator!.areaM2=300;h.hullPassiveRadiator!.irProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:0.8};h.origins['hullPassiveRadiator.areaM2']=origin('m²');h.origins['hullPassiveRadiator.irProfile.aftFraction']=origin('1');addBuiltin(h,'experimental-ordinary-radiator',c.items['radiator-passive-S']);},'Actual common hot circuit retains each of the mixed surface profiles; no shared area multiplier');
  const peak=2*base.hulls.find(h=>h.id==='stealth-reference')!.builtins.find(b=>b.item.family==='buffer')!.item.numerics.chargePowerW;
  for(const [label,power,duration]of [['high-short',peak,10],['low-long',peak/10,100]]as const)add('buffer-'+label,'stealth-reference',{durationSeconds:duration,temperatureK:450,mode:'Masking',action:'idle',environment:{...fields.standard,directHeat:[{sourceId:'buffer-load',powerW:power}]}},undefined,'Equal external joules, high request = twice the installed capture power; capacity does not remove a power limit');
  for(const field of ['cold','hot']as const)add('buffer-recovery-'+field,'stealth-reference',{durationSeconds:120,temperatureK:450,phases:[{id:'work',action:'idle',mode:'Masking',durationSeconds:1,requests:{},environment:{...fields.standard,directHeat:[{sourceId:'buffer-work',powerW:1e6}]}},{id:'recovery',action:'recovery',mode:'Efficient',durationSeconds:119,requests:{},environment:{...fields.standard,thermalField:{sourceId:'recovery-field',temperatureK:field==='cold'?350:650,coefficientWPerM2K:2000}}}]},undefined,'Real debt/marker persists across mode; cold recovery or exact unreachable hot remainder');
  return cases;
}
export function executeExperiments(){return buildExperimentalCases().map(c=>{
  const run=createShipModelRun(c.id,c.spec);runShipModelChunk(run,c.spec.durationSeconds);const result=shipModelResult(run);
  return {id:c.id,input:c.input,measured:{state:result.state,metrics:result.metrics,lastTelemetry:result.checkpoint.lastTelemetry,signatures:result.signatures,events:result.events,retention:result.retention,status:result.status},fullResultSha256:hash(serializeResultSnapshot(result))};
});}
export function experimentFingerprints(){
  const files=[...readdirSync('src/model/v3').filter(n=>n.endsWith('.ts')).map(n=>'src/model/v3/'+n),'src/runner/ship-model-run.ts','src/signatures/ship-model.ts','src/signatures/sources.ts','src/scenarios/fitting.ts','src/io/ship-model-result.ts','src/experiments/ship-model-v0.1.ts','data/experiments/ship-model-v0.1-generations.json',...['items','hulls','presets'].map(n=>'src/fitting/data/'+n+'-0.3.0.json')].sort();
  return Object.fromEntries(files.map(path=>[path,hash(readFileSync(path,'utf8'))]));
}
function isolatedStockSpec(){
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',c.version),h=c.hulls.find(h=>h.id===fit.hullId)!;
  h.hullPowerW=0;h.origins.hullPowerW=origin('W');fit.instances['fit:signature-1'].enabled=false;
  for(const b of h.builtins){if(!['battery','tank','cargo'].includes(b.item.family))fit.builtinModes[b.id]={enabled:b.item.family==='buffer'};if(b.item.family==='buffer'){setNumber(b.item,'capacityJ',1e9);setNumber(b.item,'chargePowerW',2e6);setNumber(b.item,'dischargePowerW',2e6);}}
  // Synthetic 20 MJ/K dry bill is compiled normally; no detached C override.
  const other=h.materials.slice(1).reduce((n,m)=>n+m.massKg*m.cpJKgK,0)+[...h.builtins.map(b=>b.item),...Object.values(fit.instances).map(i=>c.items[i.itemId])].reduce((n,i)=>n+i.materials.reduce((a,m)=>a+m.massKg*m.cpJKgK,0),0);
  h.materials[0].cpJKgK=(20e6-other)/h.materials[0].massKg;h.origins['materials.0.cpJKgK']=origin('J/kg/K');
  return unwrap(makeShipModelMiningRun(fit,c,{durationSeconds:1,temperatureK:490,backgroundK:490,mode:'Masking',action:'idle',environment:{radiativeBackgroundK:490,backgroundSourceId:'CP04-equal-background',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[{sourceId:'CP04-heat',powerW:1e6}]}}));
}
export function buildRuntimeConformance(){
  const contractVectors=vectors.controlProfile.slice(0,3).map(v=>{const x=v.inputs as any,stages=v.id==='CP-01'?[{id:'active-radiator',setpointK:x.setpointK,maximumW:x.availableCoolingW}]:v.id==='CP-02'?[{id:'earlier',setpointK:x.earlierStage.setpointK,maximumW:x.earlierStage.availableCoolingW},{id:'reserve',setpointK:x.reserveStage.setpointK,maximumW:x.reserveStage.availableCoolingW}]:[{id:'pump',setpointK:x.pump.setpointK,maximumW:x.pump.availableCoolingW},{id:'buffer-release',setpointK:x.buffer.setpointK,maximumW:x.buffer.availableReleaseW,heatSource:true}];const input={temperatureK:x.temperatureK,heatCapacityJK:x.heatCapacityJK,netHeatW:x.netHostHeatW,durationSeconds:1,direction:'cooling' as const,stages};return {cp:v.id,adapter:'production-allocateCascade/1',input,output:allocateCascade(input)};});
  const stock=isolatedStockSpec(),buffer=Object.keys(stock.initialState.buffers)[0];stock.initialState.buffers[buffer]={storedJ:999500000,minimumCaptureK:490};stock.origins['initialState.buffers.'+buffer+'.minimumCaptureK']=origin('K');
  const cp04={cp:'CP-04',adapter:'production-stepV3/1',input:{spec:stock,state:stock.initialState,requests:{},action:'idle'},output:stepV3(stock,stock.initialState,{},'idle')};
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',c.version),shield=c.items['shielding-S'];shield.durability.wearPerWorkSecond=0;shield.origins['durability.wearPerWorkSecond']=origin('R/s');const spec=unwrap(makeShipModelMiningRun(fit,c,{durationSeconds:60,mode:'Masking',receiverProfile:'absolute-contrast',action:'idle'}));
  const id='fit:signature-1';spec.initialState.modules[id].durabilityR=-0.5;spec.initialState.modules[id].firstNegativeCrossing=true;const run=createShipModelRun('CP05-export',spec);runShipModelChunk(run,59);const input={spec,state:structuredClone(run.state),requests:{},action:'idle'};const output=stepV3(spec,input.state,{},'idle');
  return {schemaVersion:'ship-model-runtime-conformance/1',serverParity:'NOT RUN',scope:'CP01–03 isolated production allocator; CP04/05 complete runnable input-state/production-step output. Expected outputs are measured, not standalone server evidence.',fingerprints:experimentFingerprints(),vectors:[...contractVectors,cp04,{cp:'CP-05',adapter:'production-stepV3/1',input,output}]};
}
