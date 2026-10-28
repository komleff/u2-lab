import {readFileSync,writeFileSync} from 'node:fs';
import {getPresetFit,loadCandidateCatalog} from '../../../src/fitting/catalog.ts';
import {makeShipModelMissionRun} from '../../../src/scenarios/ship-model-mission.ts';
import {createShipModelRun,runShipModelChunk} from '../../../src/runner/ship-model-run.ts';
let rows=[];const base=new URL('./',import.meta.url);
for(const [rev,change,bg]of [[8,'accepted',250]]){
const source=JSON.parse(readFileSync(new URL(rev===5?'ermak-no-radiators.json':'ermak-three-passive.json',base),'utf8'));
const fit=structuredClone(source.resolvedShip.fit),catalog=loadCandidateCatalog('ship-fitting-0.3.3');
if(change==='accepted')for(const i of [...Object.values(catalog.items),...Object.values(fit.localVariants??{}),...catalog.hulls.flatMap(h=>h.builtins.map(b=>b.item))]){
 if(i.thermalRole==='ordinary')i.gate={low:200,workLow:220,restartLow:230,workHigh:500,restartHigh:480,high:550};
 if(i.family==='engine'&&i.propulsionType==='diesel')i.numerics.hostFraction=.4;
}
const made=makeShipModelMissionRun(fit,catalog,{temperatureK:300,backgroundK:bg,durationSeconds:10800,mission:source.mission});if(!made.ok)throw Error(JSON.stringify(made.errors));
const run=createShipModelRun('diagnostic-'+rev+change+bg,made.value);runShipModelChunk(run,1200);const snap=()=>({t:run.state.timeSeconds,T:run.state.temperatureK,trips:run.state.mission.completedTrips,mined:run.state.mission.minedM3,delivered:run.state.mission.deliveredM3,stage:run.state.mission.stage,chargeFraction:run.state.chargeJ/made.value.resolvedShip.batteryCapacityJ});const at1200=snap();runShipModelChunk(run,9600);const row={rev,change,bg,at1200,at10800:snap(),firstConstraint:run.metrics.firstConstraint,events:run.events.items().filter(e=>e.kind==='thermal-hot'||e.kind==='mission-service')};rows.push(row);console.log(JSON.stringify(row));
}
