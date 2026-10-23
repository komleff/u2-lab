import type {RunResultV02} from '../runner/ship-model-run-v02';
import {validateShipModelResultV02} from './ship-model-result-v02';
export function exportShipModelTelemetryCsvV02(input:RunResultV02){
  const checked=validateShipModelResultV02(input);if(!checked.ok)throw Error(JSON.stringify(checked.errors));const r=checked.value;
  const cell=(v:unknown)=>'"'+String(v).replaceAll('"','""')+'"',unit=(id:string)=>id==='tickIndex'?'tick':id==='timeSeconds'||id.startsWith('cooldownSeconds:')?'s':id.startsWith('resourceKg:')?'kg':id==='temperatureK'?'K':id.includes('J')?'J':id.startsWith('durabilityR:')||id.includes('Stopped:')?'1':'W';
  const rows=[['schemaVersion',r.spec.schemaVersion],['modelVersion',r.spec.modelVersion],['stateVersion',r.spec.stateVersion],['governorVersion',r.spec.governorVersion],['profileVersion',r.spec.profileVersion],['tickHz',r.spec.tickHz],['startTick',r.spec.initialState.governor.tickIndex],['endTick',r.state.governor.tickIndex],['totalTicks',r.retention.totalTicks],['maxBuckets',r.retention.maxBuckets],['cadenceSeconds',r.retention.cadenceSeconds],['maxBytes',r.retention.maxBytes],['estimatedBytes',r.retention.estimatedBytes],['retention',r.retention.policy],['profileId',r.spec.profile.id],['profileRevision',r.spec.profile.revision]].map(row=>row.join(','));
  rows.push(['startSeconds [s]','endSeconds [s]','count [tick]',...r.channels.flatMap(id=>['mean','min','max'].map(stat=>id+' ['+unit(id)+'] '+stat))].map(cell).join(','));
  for(const b of r.buckets)rows.push([b.startSeconds,b.endSeconds,b.count,...r.channels.flatMap((_,i)=>[b.sum[i]/b.count,b.min[i],b.max[i]])].join(','));
  return rows.join('\n')+'\n';
}
