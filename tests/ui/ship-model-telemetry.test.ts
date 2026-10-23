import {expect,it} from 'vitest';
import {traceChart} from '../../src/app/fitting-ui/trace-chart';
import {selectedBucket} from '../../src/app/fitting-ui/lab-channels';
import {channelRows,bucketValue} from '../../src/app/fitting-ui/telemetry';
import {Retention} from '../../src/runner/retention';
import {shipModelChannelInfo,shipModelChannelRows,shipModelAvailability,shipModelEventMatches} from '../../src/app/fitting-ui/ship-model-channels';
import {shipModelLabView,shipModelLive,shipModelChannelsView} from '../../src/app/fitting-ui/ship-model-lab-view';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {fixture,signatureDepletionFixture} from '../model-v3/fixture';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';

it.each(['v2','v1','zero'] as const)('C031-QA-B1 graph context exposes saved %s distances, not selected bucket or reconstructed statistics',kind=>{
  const spec=signatureDepletionFixture(1);if(kind==='zero'){spec.initialState.chargeJ=0;spec.scenario.phases=[{id:'zero',action:'idle',durationSeconds:1,requests:{},environment:null}];}
  const run=createShipModelRun('chart-range-'+kind,spec);runShipModelChunk(run,1);const r=shipModelResult(run);
  if(kind==='v1')r.signatures={version:'ship-signatures/1',last:r.signatures.last};
  for(const b of r.buckets){b.sum.fill(999);b.min.fill(999);b.max.fill(999);}
  const before=serializeResultSnapshot(r),html=shipModelChannelsView(r,{group:'signals',unit:'W',hidden:new Set(),eventIndex:0,bucketIndex:0});
  const block=html.match(/<section id="sm-chart-detection-distance"[\s\S]*?<\/section>/)?.[0]??'';
  expect(block).toContain('Расчётная дальность обнаружения');expect(block).not.toContain('<details');expect(block).toContain('S-dedicated-G1');expect(block).toContain('positive-only');expect(block).toContain('Ракурс');expect(block).toContain('чистом космосе');expect(block).toContain('не фактический контакт');
  for(const label of ['В конце опыта','По среднему сигналу за интервал','Максимальная за интервал'])expect(block).toContain(label);
  const value=(id:string)=>block.match(new RegExp('data-distance="charts:'+id+'"[^>]*data-value="([^"]*)"'))?.[1];
  for(const channel of ['IR','EM'])for(const field of ['current','mean','max'])expect(value(channel+':'+field)).toBeDefined();
  if(kind==='zero'){for(const channel of ['IR','EM'])for(const field of ['current','mean','max'])expect(value(channel+':'+field)).toBe('0');expect(block).toContain('>0 м</strong>');}
  else{
    expect(Number(value('IR:current'))).toBeCloseTo(Math.sqrt(3891.434262156444/(4*Math.PI*0.000274542277)),7);
    if(kind==='v1'){expect(value('IR:mean')).toBe('');expect(value('EM:max')).toBe('');}
    else{expect(Number(value('IR:max'))).toBeCloseTo(Math.sqrt(8032.005217677903/(4*Math.PI*0.000274542277)),7);expect(Number(value('IR:mean'))).toBeCloseTo(Math.sqrt(3891.434262156444/(4*Math.PI*0.000274542277)),7);expect(block).toContain('км');}
  }
  expect(serializeResultSnapshot(r)).toBe(before);
});

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
it('I3-R1 Live keeps the just-computed real phase at its endpoint, then follows actual horizon-idle',()=>{
  const spec=fixture();spec.durationSeconds=4;spec.scenario.phases[0].id='mine';spec.scenario.phases[0].durationSeconds=1;
  const run=createShipModelRun('live-horizon',spec);runShipModelChunk(run,1);
  expect(shipModelLive(shipModelResult(run,'paused'))).toContain('фаза mine / work');expect(run.events.items().filter(e=>e.kind==='phase')).toHaveLength(1);
  runShipModelChunk(run,1);expect(shipModelLive(shipModelResult(run,'paused'))).toContain('фаза horizon-idle / idle');
  runShipModelChunk(run,2);expect(shipModelLive(shipModelResult(run))).toContain('фаза horizon-idle / idle');
  expect(run.events.items().filter(e=>e.kind==='phase').map(e=>[e.timeSeconds,e.message])).toEqual([[0,'mine · work'],[1,'horizon-idle · idle']]);
});
it('I3-R2 partial stopped TI stays unavailable through producer, retention, selected table, curves and Live',()=>{
  const catalog=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',catalog.version),id='fit:signature-1';
  fit.instances[id].itemId='thermoinverter-S';fit.assignments['signature-2']='fit:signature-2';fit.instances['fit:signature-2']={id:'fit:signature-2',itemId:'radiator-passive-S',enabled:true};
  const made=makeShipModelMiningRun(fit,catalog,{durationSeconds:1,temperatureK:500,action:'idle',environment:{radiativeBackgroundK:100,backgroundSourceId:'I3-R2-background',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[{sourceId:'I3-R2-explicit-heat',powerW:1e10}]}});
  expect(made.ok,JSON.stringify(made)).toBe(true);if(!made.ok)return;
  const run=createShipModelRun('physical-TI',made.value);runShipModelChunk(run,1);const result=shipModelResult(run),b=result.buckets[0],hot='tiHotK:'+id;
  // WI1: открытая вне Masking оболочка меняет physical event time, но не полноту измерения TI.
  expect(result.checkpoint.lastTelemetry[hot]).toBeCloseTo(87.41039856511269,4);expect(result.checkpoint.lastTelemetry['tiActive:'+id]).toBe(1);
  const row=shipModelChannelRows(result,b,result.spec).find(row=>row.id===hot)!;expect(row).toMatchObject({availability:'mixed',mean:null,min:null,max:null,count:1});
  expect(shipModelChannelInfo('tiHotMeasured:'+id)).toMatchObject({unit:'флаг',group:'state'});
  const curve=traceChart(result,[hot],1,[],false,[],'K',(channel,bucket)=>shipModelAvailability(result,bucket,channel)==='measured');expect(curve).not.toContain('<polyline');
  const html=shipModelLabView(result,{group:'heat',unit:'K',hidden:new Set(),eventIndex:0,bucketIndex:0,detailsOpen:true},'all');
  const tableRow=html.match(/<tr data-channel="tiHotK:fit:signature-1"[^>]*>[\s\S]*?<\/tr>/)?.[0];expect(tableRow).toContain('data-mean=""');expect(tableRow).toContain('смешанная доступность');
  const liveRow=html.match(/<tr data-live-instance="fit:signature-1"[^>]*>[\s\S]*?<\/tr>/)?.[0];expect(liveRow?.match(/<td>[^<]*<\/td>/g)?.at(-1)).toBe('<td>смешанная доступность · нет полного измерения</td>');
});
it('I3-R2 hot-side coverage is retained separately from was-active across merged and unconfirmed buckets',()=>{
  const trace=new Retention(['tiHotK:p','tiActive:p','tiHotMeasured:p'],2);
  trace.add(1,{'tiHotK:p':600,'tiActive:p':1,'tiHotMeasured:p':1});expect(shipModelChannelRows(trace,trace.buckets[0])[0]).toMatchObject({availability:'measured',mean:600});
  trace.add(2,{'tiHotK:p':87,'tiActive:p':1,'tiHotMeasured:p':0});trace.add(3,{'tiHotK:p':600,'tiActive:p':1,'tiHotMeasured:p':1});expect(trace.buckets).toHaveLength(2);
  expect(shipModelChannelRows(trace,trace.buckets[0])[0]).toMatchObject({availability:'mixed',mean:null,min:null,max:null,count:2});
  const legacy={channels:['tiHotK:p','tiActive:p']},b={startSeconds:0,endSeconds:1,count:1,sum:new Float64Array([87,1]),min:new Float64Array([87,1]),max:new Float64Array([87,1])};
  expect(shipModelAvailability(legacy,b,'tiHotK:p')).toBe('mixed');expect(shipModelAvailability(legacy,b,'tiBusW:p')).toBe('measured');
});
