import {writeFileSync,appendFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadCandidateCatalog,getPresetFit} from '../../../src/fitting/catalog.ts';
import {makeShipModelMissionRun} from '../../../src/scenarios/ship-model-mission.ts';
import {stepShipModelMission} from '../../../src/runner/ship-model-mission.ts';
const group=process.argv[2]??'grid',output=process.argv[3]??('/tmp/u2-diesel-'+group);
const results:any[]=[];writeFileSync(output+'.jsonl','');
const hash=(x:any)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
function run(id:string,host:number,bg=250,area=1,duration=4500,bodyScale=1,removeSecond=false,equipment='',station=false){
 const c:any=loadCandidateCatalog('ship-fitting-0.3.3'),fit:any=getPresetFit(id,c.version);
 for(const i of [...Object.values(c.items),...c.hulls.flatMap((h:any)=>h.builtins.map((b:any)=>b.item)),...Object.values(fit.localVariants)] as any[]){
  if(i.thermalRole==='ordinary'&&i.gate.workHigh===360){i.gate.workHigh=500;i.gate.high=550;i.gate.restartHigh=480;}
  if(i.family==='engine'&&i.propulsionType==='diesel')i.numerics.hostFraction=host;
  if(i.id==='radiator-passive-M'||i.id==='radiator-passive-S')for(const s of i.surfaces)s.areaM2*=area;
 }
 if(equipment.includes('active'))fit.instances['fit:signature-1'].itemId=id==='severin-mir-d'?'radiator-active-M':'radiator-active-S';
 if(equipment.includes('buffer')){const key='fit:signature-2';fit.assignments['signature-2']=key;fit.instances[key]={id:key,itemId:id==='severin-mir-d'?'buffer-M':'buffer-S',enabled:true};}
 if(equipment.includes('rad3')){for(const slot of ['signature-2','signature-3']){const key='fit:'+slot;fit.assignments[slot]=key;fit.instances[key]={id:key,itemId:'radiator-passive-M',enabled:true};}}
 if(equipment.includes('double')){const key='fit:signature-3';fit.assignments['signature-3']=key;fit.instances[key]={id:key,itemId:'buffer-M',enabled:true};}
 if(equipment.includes('mass'))for(const i of Object.values(c.items) as any[])if(i.id==='radiator-passive-M'||i.id==='radiator-passive-S')for(const m of i.materials)m.massKg*=area;
 if(removeSecond){const id=fit.assignments['signature-2'];delete fit.assignments['signature-2'];if(id)delete fit.instances[id];}
 c.hulls.find((h:any)=>h.id===fit.hullId).bodyExchangeAreaM2*=bodyScale;
 const built=makeShipModelMissionRun(fit,c,{temperatureK:300,backgroundK:bg,durationSeconds:duration,...(id==='pony-d'?{referenceVfaMS:225}:{})});if(!built.ok)throw Error(JSON.stringify(built.errors));
 const spec=built.value,ship=spec.resolvedShip;let state=spec.initialState,peak=300,firstHot:any=null,firstPower:any=null,critical:any=null,hour:any=null,hotSeconds=0,maxResidualJ=0,minTempFactor=1,requestsOn=0,sourceExportJ=0;
 const events:any[]=[],trace:any[]=[],trips:any[]=[];const start=performance.now();
 for(let n=0;n<duration;n++){
  const before=state;let physicalSpec=spec;
  if(station&&state.mission!.stage==='service'){const A=ship.hull.bodyExchangeAreaM2+ship.surfaces.filter((s:any)=>!s.active||state.surfaceOpen[s.id]).reduce((a:number,s:any)=>a+s.areaM2,0);physicalSpec={...spec,environment:{...spec.environment,radiativeBackgroundK:300,thermalField:{temperatureK:300,coefficientWPerM2K:10000/A,sourceId:'probe-hangar-10000WK'}}};}
  const r=stepShipModelMission(physicalSpec,state);state=r.state;peak=Math.max(peak,state.temperatureK);
  const hot=ship.instances.some((i:any)=>i.item.thermalRole==='ordinary'&&state.temperatureK>i.item.gate.workHigh);
  if(hot){hotSeconds++;firstHot??={t:state.timeSeconds,trip:state.mission!.completedTrips+1,stage:state.mission!.stage,temperatureK:state.temperatureK};}
  for(const i of ship.instances.filter((i:any)=>['engine','mining','generator','battery'].includes(i.item.family))){const g=i.item.gate;if(state.temperatureK>g.workHigh)minTempFactor=Math.min(minTempFactor,Math.max(0,(g.high-state.temperatureK)/(g.high-g.workHigh)));}
  for(const d of r.diagnostics){if(d.reason==='power-limited')firstPower??={t:d.timeSeconds,trip:state.mission!.completedTrips+1,stage:state.mission!.stage};if(d.reason==='critical-hot'||d.reason==='thermal-stop-hot')critical??=d;}
  for(const e of r.events){if(e.kind==='mission-service')trips.push({t:e.timeSeconds,trip:state.mission!.completedTrips,temperatureK:state.temperatureK,mined:state.mission!.minedM3,delivered:state.mission!.deliveredM3,chargeJ:state.chargeJ});if(e.kind!=='mission-stage')events.push(e);}
  maxResidualJ=Math.max(maxResidualJ,Math.abs(r.telemetry.totalResidualJ??0));
  if(n%10===0)trace.push({t:state.timeSeconds,T:state.temperatureK,stage:state.mission!.stage,trip:state.mission!.completedTrips+1});
  if(n===3599)hour={state:structuredClone(state),peak,firstHot:structuredClone(firstHot),firstPower:structuredClone(firstPower),hotSeconds,minTempFactor};
 }
 const row={id,host,bg,area,bodyScale,removeSecond,equipment,station,duration,specHash:hash(spec),stateHash:hash(state),C:ship.heatCapacityJK,dryMassKg:ship.dryMassKg,Krad:ship.hull.bodyExchangeAreaM2*ship.hull.bodyEmissivity+ship.surfaces.reduce((a:any,s:any)=>a+s.areaM2*s.emissivity,0),ratedHeat:ship.instances.filter((i:any)=>i.item.family==='engine'&&i.role==='march').map((i:any)=>({id:i.id,n:i.item.numerics})),firstHot,firstPower,critical,hotSeconds,minTempFactor,peak,hour,trips,final:state,trace,events,maxResidualJ,wallSeconds:(performance.now()-start)/1000};
 results.push(row);appendFileSync(output+'.jsonl',JSON.stringify(row)+'\n');writeFileSync(output+'.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({id,host,bg,area,bodyScale,hot:firstHot,hourT:hour?.state.temperatureK,hourPeak:hour?.peak,hourTrips:hour?.state.mission?.completedTrips,hourMined:hour?.state.mission?.minedM3,hourFactor:hour?.minTempFactor,firstPower,critical,trips:trips.map(t=>[t.trip,Math.round(t.t),Math.round(t.temperatureK)])}));
}
if(group==='grid')for(const id of ['sputnik-d','pony-d','ermak-d','severin-mir-d'])for(const host of [.1,.2,.3,.4,.55])run(id,host);
if(group==='modules'){run('pony-d',.4,250,1,4500,1,false,'active');run('ermak-d',.4,250,1,4500,1,false,'buffer');run('severin-mir-d',.4,250,1,4500,1,false,'buffer');run('severin-mir-d',.4,250,1,4500,1,false,'active+buffer');}
if(group==='mirFits'){run('severin-mir-d',.4,250,1,4500,1,false,'rad3');run('severin-mir-d',.4,250,1,4500,1,false,'active+rad3');}
