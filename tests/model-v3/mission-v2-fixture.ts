import{getPresetFit,loadCandidateCatalog}from'../../src/fitting/catalog';
import{makeShipModelMissionRun}from'../../src/scenarios/ship-model-mission';
export function ermak(kind:'none'|'passive3'|'active2'='active2',H=10800){
 const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('ermak-d',c.version);
 for(let k=1;k<=3;k++){const slot='signature-'+k,id=f.assignments[slot]??'fit:'+slot;delete f.assignments[slot];delete f.instances[id];if(kind==='passive3'||kind==='active2'&&k<=2){f.assignments[slot]=id;f.instances[id]={id,itemId:kind==='passive3'?'radiator-passive-S':'radiator-active-S',enabled:true};}}
 const r=makeShipModelMissionRun(f,c,{durationSeconds:H,temperatureK:300,backgroundK:250,distanceM:100000,referenceVfaMS:225,serviceSeconds:10,approachSeconds:10,stationReplenish:true,repeat:true});if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;
}

export function weak(H=10800){const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('sputnik-e',c.version);f.initial.chargeFraction=0;f.initial.fuelFraction.diesel=1;f.assignments['power-2']='fit:power-2';f.instances['fit:power-2']={id:'fit:power-2',itemId:'generator-diesel-XS',enabled:true};f.assignments['power-3']='fit:power-3';f.instances['fit:power-3']={id:'fit:power-3',itemId:'tank-diesel-S',enabled:true};const r=makeShipModelMissionRun(f,c,{durationSeconds:H,distanceM:1000000,temperatureK:300,backgroundK:300});if(!r.ok)throw Error(JSON.stringify(r.errors));Object.assign(r.value.initialState.mission!,{stage:'inbound',positionM:500000,velocityMS:-450,onboardM3:30,minedM3:30});return r.value;}
