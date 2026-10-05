import type {RunResultV2} from '../runner/run';
export function fittingChannelUnit(channel:string):string {
 if(channel==='timeSeconds')return 's';
 if(channel==='workRate'||channel==='miningRateM3S')return 'SCU/s';
 if(channel==='cargo'||channel==='cargoM3'||channel==='usefulWork')return 'SCU';
 if(channel==='temperatureK')return 'K';
 if(channel.startsWith('fuelKg:')||channel.startsWith('installedMassKg:')||channel.endsWith('MassKg'))return 'kg';
 if(channel.startsWith('forceN:')||channel==='thrustN')return 'N';
 if(channel.startsWith('bufferJ:')||channel.startsWith('storedJ:')||channel.endsWith('J'))return 'J';
 if(channel.startsWith('deliveredW:')||channel.startsWith('beamW:')||channel.endsWith('W'))return 'W';
 return '1';
}
const csv=(v:unknown)=>{const s=String(v);return /[",\r\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
export function exportFittingTelemetryCsv(r:RunResultV2):string {
 const metadata={schema:r.spec.schemaVersion,model:r.spec.modelVersion,catalog:r.spec.catalogVersion,selectedWorkGroup:r.spec.selectedWorkGroup,physicsDtSeconds:r.spec.stepSeconds,retention:r.retention,metrics:r.metrics,instances:r.spec.resolvedShip.instances.map(i=>({id:i.id,role:i.role,family:i.item.family}))};
 const header=['bucket_start_s','bucket_end_s','tick_count',...r.channels.flatMap(c=>['mean','min','max'].map(k=>c+'_'+k+'_'+fittingChannelUnit(c)))];
 const rows=r.buckets.map(b=>[b.startSeconds,b.endSeconds,b.count,...r.channels.flatMap((_,i)=>[b.sum[i]/b.count,b.min[i],b.max[i]])].map(csv).join(','));
 return '# schema=u2-lab-trace/2\n# '+JSON.stringify(metadata)+'\n'+[header.map(csv).join(','),...rows].join('\n');
}
