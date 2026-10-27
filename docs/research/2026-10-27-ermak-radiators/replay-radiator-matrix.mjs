import {getPresetFit,loadCandidateCatalog} from '../../../src/fitting/catalog.ts';
import {makeShipModelMiningRun} from '../../../src/scenarios/fitting.ts';
import {makeShipModelMissionRun} from '../../../src/scenarios/ship-model-mission.ts';
import {stepShipModelMission} from '../../../src/runner/ship-model-mission.ts';
import {stepV3} from '../../../src/model/v3/step.ts';
import {writeFileSync} from 'node:fs';
const cases=[['none',null,0,true],['passive1','radiator-passive-S',1,true],['passive2','radiator-passive-S',2,true],['passive2off','radiator-passive-S',2,false],['active1','radiator-active-S',1,true],['active1off','radiator-active-S',1,false],['active2','radiator-active-S',2,true],['active2off','radiator-active-S',2,false],['passive2-zero-area','radiator-passive-S',2,true]];
let rows=[];
for(const mode of ['mission','stationary'])for(const [name,itemId,count,enabled]of cases){
const c=loadCandidateCatalog('ship-fitting-0.3.3'),f=getPresetFit('ermak-d',c.version);
for(let k=1;k<=2;k++){const slot='signature-'+k,id='fit:'+slot;if(k<=count){f.assignments[slot]=id;f.instances[id]={id,itemId,enabled};}else{delete f.assignments[slot];delete f.instances[id];}}
const b=(mode==='mission'?makeShipModelMissionRun:makeShipModelMiningRun)(f,c,{temperatureK:300,backgroundK:250,durationSeconds:3600});if(!b.ok)throw Error(JSON.stringify(b.errors));const spec=b.value;
if(name==='passive2-zero-area')for(const x of spec.resolvedShip.surfaces)if(x.id.startsWith('fit:signature-'))x.areaM2=0;
let state=spec.initialState,firstHot=null,peak=300,firstCritical=null,usefulJ=0,radJ=0,hostJ=0,netJ=0,openSeconds=0,maxResidual=0,last300=0,trace=[],surfaceJ=0;
const workHigh=Math.min(...spec.resolvedShip.instances.filter(i=>i.item.thermalRole==='ordinary').map(i=>i.item.gate.workHigh));
for(let n=0;n<3600;n++){
const r=mode==='mission'?stepShipModelMission(spec,state):stepV3(spec,state,spec.scenario.phases[0].requests,'work');state=r.state;peak=Math.max(peak,state.temperatureK);
if(firstHot===null&&state.temperatureK>workHigh)firstHot=state.timeSeconds;
firstCritical??=r.diagnostics.find(d=>d.reason==='critical-hot'||d.reason==='thermal-stop-hot')??null;
usefulJ+=r.telemetry.usefulWorkW??0;radJ+=r.telemetry.radiationW??0;hostJ+=r.telemetry.hostHeatW??0;netJ+=r.telemetry.netHeatW??0;maxResidual=Math.max(maxResidual,Math.abs(r.telemetry.totalResidualJ??0));
if(Object.entries(state.surfaceOpen).some(([id,open])=>id.startsWith('fit:signature-')&&open))openSeconds++;
for(const frame of r.frames)surfaceJ+=frame.durationSeconds*frame.surfaces.rows.filter(x=>x.surfaceId.startsWith('fit:signature-')).reduce((sum,x)=>sum+x.totalW,0);
if(n>=3300)last300+=state.temperatureK/300;
if(n%300===299)trace.push({t:state.timeSeconds,T:state.temperatureK,workW:r.telemetry.usefulWorkW,radW:r.telemetry.radiationW,stage:state.mission?.stage??null});
}
const row={mode,name,itemId,count,enabled,Tfinal:state.temperatureK,peak,meanLast300:last300,firstHot,firstCritical,workHigh,usefulGJ:usefulJ/1e9,radiatedGJ:radJ/1e9,radiatorGJ:surfaceJ/1e9,hostGJ:hostJ/1e9,netGJ:netJ/1e9,openSeconds,maxResidual,C:spec.resolvedShip.heatCapacityJK,minedM3:state.mission?.minedM3??null,trips:state.mission?.completedTrips??null,trace};
rows.push(row);console.log(JSON.stringify({...row,trace:undefined,firstCritical:firstCritical?.timeSeconds??null}));
}
