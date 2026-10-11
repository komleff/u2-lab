import {expect,it} from 'vitest';
import {traceChart} from '../../src/app/fitting-ui/trace-chart';
import {selectedBucket} from '../../src/app/fitting-ui/lab-channels';
import {channelRows,bucketValue} from '../../src/app/fitting-ui/telemetry';
import {Retention} from '../../src/runner/retention';
import {shipModelChannelInfo,shipModelChannelRows,shipModelAvailability,shipModelEventMatches} from '../../src/app/fitting-ui/ship-model-channels';
import {shipModelLabView} from '../../src/app/fitting-ui/ship-model-lab-view';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {fixture} from '../model-v3/fixture';

it('I3 common trace/time helpers consume structural retained data without a V2 spec',()=>{
  const retention=new Retention(['temperatureK']);retention.add(1,{temperatureK:300});retention.add(2,{temperatureK:320});
  const trace={channels:retention.channels,buckets:retention.buckets,events:[{timeSeconds:1,kind:'phase',message:'first'}],retention:{...retention.metadata(),totalEvents:1,droppedEvents:0}},s={group:'heat',unit:'K',hidden:new Set<string>(),eventIndex:0,bucketIndex:0};
  expect(selectedBucket(trace,s)).toBe(trace.buckets[0]);expect(channelRows(trace,selectedBucket(trace,s))[0].mean).toBe(300);expect(bucketValue(trace,trace.buckets[1],'temperatureK')).toBe(320);
  expect(()=>traceChart(trace,['temperatureK'],1)).not.toThrow();
  expect(traceChart(trace,['temperatureK'],1)).toContain('data-time="1"');
});
it('I3 selectors report retained literal mean/min/max/count with V3 labels and units',()=>{
  const trace={channels:['fuelKg:diesel','durabilityR:m','cooldownSeconds:m','surfaceOpen:s','signal:irFluxWm2','signal:ownAntennaTransmission']};
  // Hand-derived retained two-tick bucket (no production helper as oracle).
  const b={startSeconds:0,endSeconds:2,count:2,sum:new Float64Array([12,0.5,4,1,6,0.75]),min:new Float64Array([4,0,1,0,2,0.25]),max:new Float64Array([8,0.5,3,1,4,0.5])};
  const rows=shipModelChannelRows(trace,b);expect(rows[0]).toMatchObject({unit:'кг',group:'stocks',mean:6,min:4,max:8,count:2});expect(rows[1]).toMatchObject({unit:'R',group:'state',mean:0.25});expect(rows[2].unit).toBe('с');expect(rows[3].unit).toBe('флаг');expect(rows[4].unit).toBe('W/m²');expect(rows[5].unit).toBe('доля');
  expect(shipModelChannelInfo('signal:receiverIrW')).toMatchObject({label:'IR выбранного приёмника',group:'signals',unit:'W'});expect(shipModelEventMatches('mode','phase')).toBe(true);
});
it('I3 unavailable and mixed measurements are null, not a synthetic hot-side mean or inferred work',()=>{
  const r=new Retention(['tiHotK:p','tiActive:p','actualW:m','actualMeasured:m']);r.add(1,{'tiHotK:p':0,'tiActive:p':0,'actualW:m':0,'actualMeasured:m':0});
  const rows=shipModelChannelRows(r,r.buckets[0]);expect(rows[0]).toMatchObject({availability:'inactive',mean:null,min:null,max:null,count:1});expect(rows[2]).toMatchObject({availability:'unavailable',mean:null});
  const mixed={...r.buckets[0],count:2,sum:new Float64Array([600,1,10,1]),min:new Float64Array([0,0,0,0]),max:new Float64Array([600,1,10,1])};
  expect(shipModelChannelRows(r,mixed)[0]).toMatchObject({availability:'mixed',mean:null,min:null,max:null,count:2});expect(shipModelAvailability({channels:['tiHotK:p']},mixed,'tiHotK:p')).toBe('unavailable');
});
it('I3 rendered past chart/table/journal share one bucket while live retains actual latest state',()=>{
  const spec=fixture();spec.durationSeconds=3;const run=createShipModelRun('past',spec);runShipModelChunk(run,3);const r=shipModelResult(run),channels={group:'heat',unit:'K',hidden:new Set<string>(),eventIndex:0,bucketIndex:0,detailsOpen:true};
  const html=shipModelLabView(r,channels,'all'),i=r.channels.indexOf('temperatureK'),mean=r.buckets[0].sum[i]/r.buckets[0].count;
  expect(html).toContain('id="sm-live" class="ui-panel" data-time="3"');expect(html).toContain('data-channel="temperatureK" data-mean="'+mean+'"');expect(html).toContain('id="journal-interval" data-selected-start="0" data-selected-end="1"');expect([...html.matchAll(/data-time="([^"]+)"/g)].map(match=>match[1])).toEqual(['3','1','1','1','1','1','1','1']);
  expect(r.state.temperatureK).not.toBe(mean);expect(shipModelLabView(r,{...channels,group:'work'},'all')).toContain('нет измерения');
});
it('I3 unavailable TI buckets produce gaps instead of a physical zero-temperature curve',()=>{
  const r=new Retention(['tiHotK:pump','tiActive:pump']);r.add(1,{'tiHotK:pump':0,'tiActive:pump':0});r.add(2,{'tiHotK:pump':600,'tiActive:pump':1});r.add(3,{'tiHotK:pump':0,'tiActive:pump':0});
  const html=traceChart({channels:r.channels,buckets:r.buckets},['tiHotK:pump'],1,[],false,[],'K',(_id,b)=>b.min[1]===1);
  expect(html.match(/<polyline[^>]*points="([^"]*)"/)?.[1]).toBe('340,20 500,20');expect(html.match(/<polyline\b/g)).toHaveLength(1);
});
