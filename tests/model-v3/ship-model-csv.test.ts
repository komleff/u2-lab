import {expect,it} from 'vitest';
import {exportShipModelTelemetryCsv,shipModelChannelUnit} from '../../src/io/ship-model-csv';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {Retention} from '../../src/runner/retention';
import {fixture} from './fixture';

it.each([['temperatureK','K'],['tiHotK:p','K'],['fuelKg:diesel','kg'],['bufferJ:b','J'],['chargeJ','J'],['totalResidualJ','J'],['actualW:m','W'],['signal:receiverIrW','W'],['signal:irFluxWm2','W/m2'],['cooldownSeconds:m','s'],['signal:timeSeconds','s'],['signal:ownAntennaTransmission','1'],['durabilityR:m','1'],['tiHotMeasured:p','1']])('I4 CSV model-specific channel %s uses SI unit %s',(id,unit)=>expect(shipModelChannelUnit(id)).toBe(unit));
it('I4 CSV exports literal retained intervals/statistics and captured /4 metadata, not a presentation adapter',()=>{
  const spec=fixture();spec.durationSeconds=4;const run=createShipModelRun('csv-run',spec);run.retention=new Retention(run.retention.channels,2);runShipModelChunk(run,4);const r=shipModelResult(run),before=structuredClone(r),csv=exportShipModelTelemetryCsv(r),lines=csv.split('\n');
  expect(lines[0]).toBe('# schema=u2-ship-model-trace/1');const meta=JSON.parse(lines[1].slice(2));expect(meta).toMatchObject({schema:'u2-lab/4',model:'ship-fitting-ship-model-0.1',catalog:'ship-fitting-0.3.0',runId:'csv-run',status:'complete'});expect(meta.retention).toEqual(r.retention);
  expect(lines[2]).toBe('bucket_start_s,bucket_end_s,channel,unit,mean,min,max,count');expect(lines.slice(3)).toHaveLength(r.buckets.length*r.channels.length);
  const i=r.channels.indexOf('temperatureK'),b=r.buckets[0];expect(lines).toContain([b.startSeconds,b.endSeconds,'temperatureK','K',b.sum[i]/b.count,b.min[i],b.max[i],b.count].join(','));expect(r).toEqual(before);expect(csv).not.toContain('availabilityLabel');
});
it('I4 CSV quotes literal channel IDs and rejects malformed/mixed or other model results',()=>{
  const spec=fixture();spec.durationSeconds=1;const run=createShipModelRun('csv-quotes',spec);runShipModelChunk(run,1);const r=shipModelResult(run);r.channels[0]='literal,"channel\nname';
  expect(exportShipModelTelemetryCsv(r)).toContain('"literal,""channel\nname"');
  const invalid=structuredClone(r) as any;delete invalid.checkpoint.lastTelemetry;expect(()=>exportShipModelTelemetryCsv(invalid)).toThrow();
  invalid.spec.schemaVersion='u2-lab/2';expect(()=>exportShipModelTelemetryCsv(invalid)).toThrow();
  const mixed=structuredClone(r) as any;mixed.signatures.version='ship-signatures/1';mixed.signatures.statistics={};expect(()=>exportShipModelTelemetryCsv(mixed)).toThrow();
});
