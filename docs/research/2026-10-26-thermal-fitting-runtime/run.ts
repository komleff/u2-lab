import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getPresetFit,loadCandidateCatalog} from '../../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../../src/scenarios/fitting';
import {makeShipModelMissionRun} from '../../../src/scenarios/ship-model-mission';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../../src/runner/ship-model-run';
import type {ShipFitV3} from '../../../src/model/v3/types';
const root=fileURLToPath(new URL('../../../',import.meta.url)),out=resolve(process.argv[2]??fileURLToPath(new URL('.',import.meta.url))),sourceCommit=process.argv[3]??execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const hash=(x:unknown)=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const sourceFiles=execFileSync('git',['ls-files','src','scripts/build-thermal-catalog-0.3.4.py','docs/research/2026-10-26-thermal-fitting-runtime/run.ts'],{cwd:root,encoding:'utf8'}).trim().split('\n').sort();
const sourceFingerprints=Object.fromEntries(sourceFiles.map(path=>{const actual=readFileSync(resolve(root,path)),frozen=execFileSync('git',['show',sourceCommit+':'+path],{cwd:root});if(!actual.equals(frozen))throw Error('Uncommitted/source-mismatched runtime: '+path);return [path,createHash('sha256').update(actual).digest('hex')];}));
const catalog=loadCandidateCatalog('ship-fitting-0.3.4');
function install(f:ShipFitV3,slot:string,item:string|null){const id=f.assignments[slot]??'fit:'+slot;if(item){f.assignments[slot]=id;f.instances[id]={id,itemId:item,enabled:true};}else{delete f.assignments[slot];delete f.instances[id];}}
function coldFit(f:ShipFitV3,heater=false,radiators=true){f.instances['fit:power-2'].enabled=false;install(f,'signature-3','electric-heater-S');f.instances['fit:signature-3'].enabled=heater;if(!radiators){install(f,'signature-1',null);install(f,'signature-2',null);}}
type Case={id:string;preset:string;mode:'mission'|'idle'|'work';seconds:number;temperatureK?:number;backgroundK?:number;edit?:(f:ShipFitV3)=>void};
const cases:Case[]=[...['sputnik-d','pony-d','ermak-d','severin-mir-d'].map(preset=>({id:preset+'-hour',preset,mode:'mission' as const,seconds:3600})),{id:'sputnik-d-fourth-trip-window',preset:'sputnik-d',mode:'mission',seconds:4500},
 {id:'cold-ermak-from300',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:300,backgroundK:3,edit:f=>coldFit(f)},
 {id:'cold-ermak-radiators',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:210,backgroundK:3,edit:f=>coldFit(f)},
 {id:'cold-ermak-heater',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:210,backgroundK:3,edit:f=>coldFit(f,true)},
 {id:'cold-ermak-225-heater-off',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:225,backgroundK:3,edit:f=>coldFit(f)},
 {id:'cold-ermak-225-heater-on',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:225,backgroundK:3,edit:f=>coldFit(f,true)},
 {id:'cold-ermak-no-removable-radiators',preset:'ermak-d',mode:'idle',seconds:3600,temperatureK:210,backgroundK:3,edit:f=>coldFit(f,false,false)},
 ...[450,600].flatMap(backgroundK=>[{id:'hot-mir-passive-'+backgroundK,preset:'severin-mir-d',mode:'work' as const,seconds:1800,backgroundK},{id:'hot-mir-pump-h2-'+backgroundK,preset:'severin-mir-d',mode:'work' as const,seconds:1800,backgroundK,edit:(f:ShipFitV3)=>{install(f,'power-4','tank-hydrogen-M');install(f,'signature-2','pump-radiator-S');install(f,'signature-3','h2-cooler-M');}}]),
 ...['sputnik-d','pony-d','severin-mir-d'].map(preset=>({id:preset+'-generator-hour',preset,mode:'idle' as const,seconds:3600}))];
const receipts:unknown[]=[];mkdirSync(out,{recursive:true});
for(const item of cases){
 const fit=getPresetFit(item.preset,catalog.version);item.edit?.(fit);
 const conditions={temperatureK:item.temperatureK??300,backgroundK:item.backgroundK??250,durationSeconds:item.seconds,mode:'Efficient' as const,...(item.mode==='mission'?{distanceM:100000,serviceSeconds:10,approachSeconds:10,stationReplenish:true,repeat:true}:{action:item.mode})};
 const built=item.mode==='mission'?makeShipModelMissionRun(fit,catalog,conditions):makeShipModelMiningRun(fit,catalog,conditions);if(!built.ok)throw Error(item.id+': '+JSON.stringify(built.errors));
 const spec=built.value,run=createShipModelRun(item.id,spec),trace:unknown[]=[],initial=structuredClone(spec.initialState);
 let firstWorkLimit:unknown=null,firstCritical:unknown=null,maxResidualJ=0,dockSeconds=0,hangarExchangeJ=0,generatorEnergyJ=0,heaterEnergyJ=0,h2CoolingJ=0,tiCoolingJ=0,previousTime=0;
 while(!run.done){
  runShipModelChunk(run,1);const st=run.state,t=st.timeSeconds,dt=t-previousTime;previousTime=t;
  maxResidualJ=Math.max(maxResidualJ,Math.abs(run.last.totalResidualJ??0));dockSeconds+=run.last.dockSeconds??0;hangarExchangeJ+=run.last.hangarExchangeJ??0;generatorEnergyJ+=(run.last.generatorW??0)*dt;h2CoolingJ+=(run.last.h2CoolingW??0)*dt;tiCoolingJ+=(run.last.tiCoolingW??0)*dt;
  for(const i of spec.resolvedShip.instances){if(i.item.family==='electric-heater')heaterEnergyJ+=(run.last['actualW:'+i.id]??0)*dt;
   const g=i.item.gate;if(!firstWorkLimit&&i.enabled&&['engine','mining'].includes(i.item.family)&&(run.last['actualW:'+i.id]??0)>0&&(st.temperatureK>g.workHigh||st.temperatureK<g.workLow))firstWorkLimit={timeSeconds:t,instanceId:i.id,temperatureK:st.temperatureK,actualW:run.last['actualW:'+i.id],side:st.temperatureK>g.workHigh?'hot':'cold',stage:st.mission?.stage??item.mode,trip:(st.mission?.completedTrips??0)+1};
   if(!firstCritical&&st.modules[i.id].thermalStopped)firstCritical={timeSeconds:t,instanceId:i.id,temperatureK:st.temperatureK,stage:st.mission?.stage??item.mode};
  }
  if(t%10===0||run.done)trace.push({timeSeconds:t,temperatureK:st.temperatureK,chargeJ:st.chargeJ,fuelKg:structuredClone(st.fuelKg),mission:st.mission?structuredClone(st.mission):null,generatorW:run.last.generatorW??0,hostHeatW:run.last.hostHeatW??0,netHeatW:run.last.netHeatW??0,deliveredW:run.last.deliveredW??0});
 }
 const result=shipModelResult(run),wear=spec.resolvedShip.instances.filter(i=>['engine','generator'].includes(i.item.family)).map(i=>({instanceId:i.id,family:i.item.family,ratePerWorkSecond:i.item.durability.wearPerWorkSecond,deltaR:initial.modules[i.id].durabilityR-run.state.modules[i.id].durabilityR,projectedHoursToZero:item.mode==='idle'&&i.item.family==='generator'?(initial.modules[i.id].durabilityR/(initial.modules[i.id].durabilityR-run.state.modules[i.id].durabilityR))*item.seconds/3600:null}));
 const consumedFuelKg={diesel:initial.fuelKg.diesel+(result.state.mission?.receivedFuelKg.diesel??0)-result.state.fuelKg.diesel,hydrogen:initial.fuelKg.hydrogen+(result.state.mission?.receivedFuelKg.hydrogen??0)-result.state.fuelKg.hydrogen};
 const receipt={id:item.id,consumedFuelKg,catalogVersion:catalog.version,spec,specSha256:hash(spec),initialStateSha256:hash(initial),finalState:result.state,finalStateSha256:hash(result.state),fullResultSha256:hash(result),metrics:result.metrics,firstWorkLimit,firstCritical,maxResidualJ,dockSeconds,hangarExchangeJ,generatorEnergyJ,heaterEnergyJ,h2CoolingJ,tiCoolingJ,wear,lifetimeProjectionStatus:'linear estimate from measured interval; no 20h qualification',events:result.events,trace};
 receipts.push(receipt);writeFileSync(resolve(out,item.id+'.json'),JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify({id:item.id,T:run.state.temperatureK,firstWorkLimit,firstCritical,trips:run.state.mission?.completedTrips??0,deliveredM3:run.state.mission?.deliveredM3??0}));
}
writeFileSync(resolve(out,'receipts.json'),JSON.stringify({schemaVersion:'thermal-fitting-physical/1',sourceCommit,catalogVersion:catalog.version,nodeVersion:process.version,seed:424242,sourceFingerprints,receipts:receipts.map(entry=>{const {spec,events,trace,...summary}=entry as any;return {...summary,receiptFile:(entry as any).id+'.json'};})},null,2)+'\n');
const rows=(receipts as any[]).map(r=>[r.id,r.finalState.timeSeconds,r.finalState.temperatureK,r.firstWorkLimit?.timeSeconds??'',r.firstCritical?.timeSeconds??'',r.metrics.usefulWorkJ,r.finalState.mission?.minedM3??'',r.finalState.mission?.deliveredM3??'',r.finalState.mission?.completedTrips??'',r.finalState.chargeJ,r.finalState.fuelKg.diesel,r.finalState.fuelKg.hydrogen,JSON.stringify(r.metrics.firstConstraint)]);
writeFileSync(resolve(out,'results.csv'),['id,time_s,T_K,first_work_limit_s,first_critical_s,useful_J,mined_m3,delivered_m3,trips,charge_J,diesel_kg,hydrogen_kg,first_constraint',...rows.map(row=>row.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(','))].join('\n')+'\n');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({schemaVersion:'thermal-fitting-evidence/1',sourceCommit,catalogVersion:catalog.version,sourceFingerprints,files:Object.fromEntries(['receipts.json','results.csv',...cases.map(x=>x.id+'.json')].map(name=>[name,createHash('sha256').update(readFileSync(resolve(out,name))).digest('hex')]))},null,2)+'\n');
