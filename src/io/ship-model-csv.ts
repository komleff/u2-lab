import {validateShipModelResult} from './ship-model-result';

export function shipModelChannelUnit(channel:string):string{
  const name=channel.startsWith('signal:')?channel.slice(7):channel.split(':')[0];
  if(name.endsWith('Wm2'))return 'W/m2';
  if(name.endsWith('Kg'))return 'kg';
  if(name.endsWith('Seconds'))return 's';
  if(name.endsWith('K'))return 'K';
  if(name.endsWith('J'))return 'J';
  if(name.endsWith('W'))return 'W';
  return '1';
}
const csvCell=(value:string|number)=>{const text=String(value);return /[",\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;};

// Это raw retained trace, не physical/presentation view: availability markers
// сохраняются отдельными каналами, extrema здесь принадлежат секундным samples.
export function exportShipModelTelemetryCsv(input:unknown):string{
  const checked=validateShipModelResult(input);if(!checked.ok)throw Error(checked.errors.map(error=>error.path+': '+error.message).join('\n'));
  const r=checked.value,metadata={schema:r.spec.schemaVersion,model:r.spec.modelVersion,catalog:r.spec.catalogVersion,runId:r.runId,status:r.status,retention:r.retention};
  const lines=['# schema=u2-ship-model-trace/1','# '+JSON.stringify(metadata),'bucket_start_s,bucket_end_s,channel,unit,mean,min,max,count'];
  for(const bucket of r.buckets)for(const [index,channel]of r.channels.entries())lines.push([bucket.startSeconds,bucket.endSeconds,channel,shipModelChannelUnit(channel),bucket.sum[index]/bucket.count,bucket.min[index],bucket.max[index],bucket.count].map(csvCell).join(','));
  return lines.join('\n');
}
