import {readFileSync,writeFileSync} from 'node:fs';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../../src/runner/ship-model-run.ts';
const base=new URL('./',import.meta.url);let rows=[];
for(const rev of [5,8]){
const source=JSON.parse(readFileSync(new URL(rev===5?'ermak-no-radiators.json':'ermak-three-passive.json',base),'utf8'));
const spec=structuredClone(source);spec.durationSeconds=3600;
const run=createShipModelRun('diagnostic-r'+rev,spec);runShipModelChunk(run,1200);const snapshot=()=>({t:run.state.timeSeconds,T:run.state.temperatureK,chargeFraction:run.state.chargeJ/spec.resolvedShip.batteryCapacityJ,mission:structuredClone(run.state.mission),usefulGJ:run.metrics.usefulWorkJ/1e9,last:structuredClone(run.last)});
const at1200=snapshot();runShipModelChunk(run,2400);const result=shipModelResult(run);
const sums=Object.fromEntries(['radiationW','hostHeatW','usefulWorkW','netHeatW'].map(k=>[k,result.buckets.reduce((n,b)=>n+b.sum[result.channels.indexOf(k)],0)]));
const row={rev,at1200,at3600:snapshot(),sums,firstConstraint:run.metrics.firstConstraint,events:run.events.items().filter(e=>['thermal-hot','mission-service','mission-stage'].includes(e.kind))};rows.push(row);
console.log(JSON.stringify({rev,at1200:{...at1200,last:undefined},at3600:{...row.at3600,last:undefined},sums,firstConstraint:row.firstConstraint,events:row.events}));
}
