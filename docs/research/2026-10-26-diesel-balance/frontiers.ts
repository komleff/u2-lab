import{writeFileSync,appendFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{loadCandidateCatalog,getPresetFit}from'../../../src/fitting/catalog.ts';
import{makeShipModelMissionRun}from'../../../src/scenarios/ship-model-mission.ts';
import{makeShipModelMiningRun}from'../../../src/scenarios/fitting.ts';
import{stepShipModelMission}from'../../../src/runner/ship-model-mission.ts';
import{stepV3}from'../../../src/model/v3/step.ts';
const rows:any[]=[],file=process.argv[2]??'/tmp/u2-diesel-frontiers';writeFileSync(file+'.jsonl','');
function experiment(id:string,kind:string,duration=3600){
 const c:any=loadCandidateCatalog('ship-fitting-0.3.3'),f:any=getPresetFit(id,c.version);
 const remove=(slot:string)=>{const k=f.assignments[slot];delete f.assignments[slot];if(k)delete f.instances[k];};
 const add=(slot:string,itemId:string)=>{const k='fit:'+slot;f.assignments[slot]=k;f.instances[k]={id:k,itemId,enabled:true};};
 for(const m of [...Object.values(c.items),...c.hulls.flatMap((h:any)=>h.builtins.map((b:any)=>b.item)),...Object.values(f.localVariants)]as any[]){if(m.thermalRole==='ordinary'&&m.gate.workHigh===360){m.gate.workHigh=500;m.gate.high=550;m.gate.restartHigh=480;}if(m.family==='engine'&&m.propulsionType==='diesel')m.numerics.hostFraction=.4;}
 if(kind.startsWith('insurance')){remove('payload-1');remove('payload-2');}
 const hot=kind.startsWith('hot'),cold=kind.startsWith('cold');
 if(hot){const size=id==='severin-mir-d'?'M':'S';add('power-'+(id==='pony-d'?3:4),'tank-hydrogen-'+size);if(kind!=='hot-no-cooler')add('signature-'+(id==='pony-d'?1:2),'h2-cooler-'+size);}
 if(cold){f.instances['fit:power-2'].enabled=false;if(kind.includes('bare')||kind.includes('heater'))for(const s of Object.keys(f.assignments))if(s.startsWith('signature'))remove(s);if(kind.includes('heater'))add('signature-1','electric-heater-S');}
 const env={radiativeBackgroundK:hot?600:cold?100:250,backgroundSourceId:'probe-background',thermalField:cold&&!kind.includes('vacuum')?{temperatureK:100,coefficientWPerM2K:5,sourceId:'probe-cold-field'}:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]};
 const built=(cold?makeShipModelMiningRun:makeShipModelMissionRun)(f,c,{temperatureK:300,durationSeconds:duration,environment:env,...(cold?{action:'idle'}:{}),...(id==='pony-d'?{referenceVfaMS:225}:{})});if(!built.ok){console.log(JSON.stringify({id,kind,error:built.errors}));return;}
 const spec:any=built.value;let state=spec.initialState,peak=300,minT=300,firstHot:any=null,firstCold:any=null,stop:any=null,power:any=null;let maxResidualJ=0,H2zero:any=null;const trace:any[]=[],events:any[]=[];
 for(let t=0;t<duration;t++){const r=cold?stepV3(spec,state,{},'idle'):stepShipModelMission(spec,state);state=r.state;peak=Math.max(peak,state.temperatureK);minT=Math.min(minT,state.temperatureK);if(t%20===0)trace.push({t:state.timeSeconds,T:state.temperatureK,H2:state.fuelKg.hydrogen,charge:state.chargeJ,stage:state.mission?.stage});for(const i of spec.resolvedShip.instances){if(i.item.thermalRole==='ordinary'){if(state.temperatureK>i.item.gate.workHigh)firstHot??=state.timeSeconds;if(state.temperatureK<i.item.gate.workLow)firstCold??=state.timeSeconds;}}for(const d of r.diagnostics){if(d.reason.includes('critical-')||d.reason.includes('thermal-stop-'))stop??=d;if(d.reason==='power-limited')power??=d;}if(hot&&state.fuelKg.hydrogen===0)H2zero??=state.timeSeconds;for(const e of r.events??[])if(e.kind==='mission-service')events.push(e);maxResidualJ=Math.max(maxResidualJ,Math.abs(r.telemetry.totalResidualJ??0));}
 const row={id,kind,duration,environment:env,specHash:createHash('sha256').update(JSON.stringify(spec)).digest('hex'),stateHash:createHash('sha256').update(JSON.stringify(state)).digest('hex'),dryMassKg:spec.resolvedShip.dryMassKg,C:spec.resolvedShip.heatCapacityJK,firstHot,firstCold,stop,power,peak,minT,H2zero,H2initial:spec.initialState.fuelKg.hydrogen,H2used:spec.initialState.fuelKg.hydrogen-state.fuelKg.hydrogen,maxResidualJ,final:state,trace,events};rows.push(row);appendFileSync(file+'.jsonl',JSON.stringify(row)+'\n');writeFileSync(file+'.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({id,kind,duration,firstHot,firstCold,stop,power,peak,minT,H2zero,H2used:row.H2used,delivered:state.mission?.deliveredM3,charge:state.chargeJ}));
}
for(const id of ['pony-d','ermak-d','severin-mir-d']){experiment(id,'hot-no-cooler',900);experiment(id,'hot-H2',1800);}
for(const kind of ['cold-vacuum','cold-panels'])experiment('ermak-d',kind,3600);
