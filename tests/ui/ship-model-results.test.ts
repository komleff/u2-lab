import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {shipModelResults,shipModelComparison} from '../../src/app/fitting-ui/ship-model-results';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {signatureDepletionFixture,fixture} from '../model-v3/fixture';
const oldCatalog=loadCandidateCatalog('ship-fitting-0.2.5');
function workspace(){return new ShipModelWorkspace(getPresetFit('sputnik',oldCatalog.version),oldCatalog);}
const templates={'reference-retro-engine-diesel-S-single':'engine-diesel-S-single'};
it('direct model selection refuses the old fit; explicit preview/apply leaves source literal and shows all changes',()=>{
  const w=workspace(),source=JSON.stringify(w.source);expect(()=>w.selectModel()).toThrow(/compile|компиляц/i);
  const preview=w.previewCompilation(templates);expect(preview.changes.length).toBeGreaterThan(0);expect(preview.changes.some(c=>c.kind==='origin')).toBe(true);expect(w.fit).toBeUndefined();
  w.applyCompilation();w.selectModel();expect(w.fit!.schemaVersion).toBe('u2-ship-fit/2');expect(JSON.stringify(w.source)).toBe(source);
});
it('new run owns its immutable conditions; A/B keeps real module mass, category, delivered power and heat',()=>{
  const w=workspace();w.loadPreset('stealth-reference');w.conditions.durationSeconds=2;const s=w.start('ui-A'),run=createShipModelRun('ui-A',s);runShipModelChunk(run,2);w.acceptResult(shipModelResult(run));
  const a=w.result!;w.copyToB();w.setEnabled(a.spec.resolvedShip.instances.find(i=>i.item.family==='shielding')!.id,false);
  const next=w.start('ui-B'),b=createShipModelRun('ui-B',next);runShipModelChunk(b,2);w.acceptResult(shipModelResult(b));
  const html=shipModelComparison(a,w.result!);expect(html).toContain('sensors-thermal');expect(html).toContain('кг');expect(html).toContain('hostHeatW');expect(a.spec.resolvedShip.fit).not.toEqual(w.result!.spec.resolvedShip.fit);
  expect(shipModelResults(w.result!)).toContain('u2-lab/4');expect(shipModelResults(w.result!)).toContain('reference');expect(shipModelResults(w.result!)).not.toContain('гарантия скрытности');
});
it('native /4 import preserves measured checkpoint, resumes it, rejects future atomically and never migrates old results',()=>{
  const w=workspace();w.loadPreset('sputnik');w.conditions.durationSeconds=3;const run=createShipModelRun('saved',w.start('saved'));runShipModelChunk(run,1);const saved=shipModelResult(run,'paused');
  const opened=workspace();opened.importDocument(serializeResultSnapshot(saved));expect(opened.result).toEqual(saved);const checkpoint=opened.startCheckpoint('resume');expect(checkpoint.state).toEqual(saved.state);expect(checkpoint.runId).toBe('resume');
  const before=serializeResultSnapshot(opened.result!);const future=structuredClone(saved);future.state.stateVersion='future' as any;expect(()=>opened.importDocument(serializeResultSnapshot(future))).toThrow();expect(serializeResultSnapshot(opened.result!)).toBe(before);
  expect(()=>workspace().importDocument(JSON.stringify({schemaVersion:'u2-ship-fit/1'}))).toThrow(/стар|old|схем/i);
});
it('active test owns controls; equipment, copy and import cannot replace running/paused source',()=>{
  const w=workspace();w.loadPreset('sputnik');w.start('active');expect(()=>w.loadPreset('mir')).toThrow(/тест/i);expect(()=>w.copyToB()).toThrow(/тест/i);expect(()=>w.setEnabled('fit:march',false)).toThrow(/тест/i);
});
it('UI maneuver asks the same installed march engine in Efficient and Masking; recovery is a distinct real task',()=>{
  const w=workspace();w.loadPreset('stealth-reference');w.updateConditions({action:'maneuver',duty:0.7});const a=w.prepare();w.updateConditions({mode:'Masking'});const b=w.prepare();
  expect(a.scenario.phases[0].action).toBe('maneuver');expect(Object.keys(a.scenario.phases[0].requests)).toContain('fit:march');expect(a.scenario.phases[0].requests).toEqual(b.scenario.phases[0].requests);
  w.updateConditions({action:'recovery'});expect(w.prepare().scenario.phases[0].requests).toEqual({});
  w.updateConditions({action:'maneuver',maneuverRole:'turn'});expect(w.prepare().scenario.phases[0].requests).toEqual({'fit:turn':0.7});
});
it.each([
  ['equal',{},true],
  ['only initial T',{temperatureK:310},false],
  ['only mode',{mode:'Masking' as const},false],
] as const)('measured A/B %s conditions show both initial T/mode without altering snapshots',(_,change,same)=>{
  const w=workspace();w.loadPreset('stealth-reference');w.updateConditions({durationSeconds:1});
  const runA=createShipModelRun('A',w.start('A'));runShipModelChunk(runA,1);w.acceptResult(shipModelResult(runA));
  const a=w.result!;w.copyToB();w.updateConditions(change);
  const runB=createShipModelRun('B',w.start('B'));runShipModelChunk(runB,1);w.acceptResult(shipModelResult(runB));
  const b=w.result!,before=[serializeResultSnapshot(a),serializeResultSnapshot(b)],html=shipModelComparison(a,b);
  expect(html).toContain('Начальная T');expect(html).toContain('Efficient');expect(html).toContain('300');
  if('temperatureK' in change)expect(html).toContain('310');
  if('mode' in change)expect(html).toContain('Masking');
  expect(html.includes('Одинаковые')).toBe(same);
  expect([serializeResultSnapshot(a),serializeResultSnapshot(b)]).toEqual(before);
});
function cp04Result(){const run=createShipModelRun('I5-CP04',signatureDepletionFixture());runShipModelChunk(run,1);return shipModelResult(run,'paused');}
function displayedValue(html:string,field:string){const match=html.match(new RegExp('data-stat="'+field+'"[^>]*data-value="([^"]*)"'));return match?.[1];}
it('I5 Overview exposes actual stocks, buffer thermal gate, stops and unavailable module cost without a nominal substitute',()=>{
  const run=createShipModelRun('actual-overview',fixture('stealth-reference'));runShipModelChunk(run,1);const r=shipModelResult(run,'paused'),html=shipModelResults(r);
  expect(html).toContain('data-overview="usefulWorkJ" data-value="'+r.metrics.usefulWorkJ+'"');expect(html).toContain('data-overview="chargeJ" data-value="'+r.state.chargeJ+'"');expect(html).toContain('data-buffer-id="builtin:buffer-S"');expect(html).toContain('температурное условие');
  expect(html).toContain('data-cost-instance="fit:power-1"');expect(html).toContain('нет измерения');expect(html).toContain('restartAuthorized');expect(html).not.toContain('power '+r.spec.resolvedShip.instances.find(i=>i.id==='fit:power-1')!.item.numerics.powerW);
});
it('I5 Overview reads saved frame mean/max and reference range, never latest or retained extrema',()=>{
  const r=cp04Result();expect(r.signatures.last!.receiverIrW).toBe(3891.434262156444);expect(r.signatures.last!.observedEmW).toBe(524.6226315789473);
  for(const bucket of r.buckets){bucket.sum.fill(999);bucket.min.fill(999);bucket.max.fill(999);}
  const before=serializeResultSnapshot(r),html=shipModelResults(r);
  expect(displayedValue(html,'receiverIrW:meanW')).toBe('3891.434262156444');expect(displayedValue(html,'receiverIrW:maxW')).toBe('8032.005217677903');
  expect(displayedValue(html,'observedEmW:meanW')).toBe('524.6226315789473');expect(displayedValue(html,'observedEmW:maxW')).toBe('1165.8280701754386');
  expect(Number(displayedValue(html,'receiverIrW:meanRangeM'))).toBeCloseTo(Math.sqrt(3891.434262156444/(4*Math.PI*0.000274542277)),7);
  expect(html).toContain('до retention');expect(html).toContain('не полученный контакт');expect(html).not.toContain('control target');expect(html).not.toMatch(/SCU|paid-radar|(?:id|class)="[^"]*\bmission\b/);expect(serializeResultSnapshot(r)).toBe(before);
});
it('I5 v1 missing frame stats are em dashes while actual measured zero stays numeric zero',()=>{
  const old=cp04Result();old.signatures={version:'ship-signatures/1',last:old.signatures.last};const oldHtml=shipModelResults(old);
  expect(displayedValue(oldHtml,'receiverIrW:meanW')).toBe('');expect(displayedValue(oldHtml,'observedEmW:maxW')).toBe('');expect(oldHtml).toContain('exact statistics отсутствуют');
  const spec=signatureDepletionFixture(1);spec.initialState.chargeJ=0;spec.scenario.phases=[{id:'zero',action:'idle',durationSeconds:1,requests:{},environment:null}];
  const run=createShipModelRun('actual-zero',spec);runShipModelChunk(run,1);const zero=shipModelResult(run),html=shipModelResults(zero);
  expect(zero.signatures.version).toBe('ship-signatures/2');expect(displayedValue(html,'receiverIrW:meanW')).toBe('0');expect(displayedValue(html,'observedEmW:maxW')).toBe('0');expect(displayedValue(html,'observedEmW:maxRangeM')).toBe('0');
});
it('I5 A/B uses each saved observer for range and explicit B-minus-A rather than a latest substitution',()=>{
  const a=cp04Result(),spec=structuredClone(a.spec);spec.observer.presetId='M-dedicated-G1';const run=createShipModelRun('I5-B',spec);runShipModelChunk(run,1);const b=shipModelResult(run,'paused'),before=[serializeResultSnapshot(a),serializeResultSnapshot(b)],html=shipModelComparison(a,b);
  expect(displayedValue(html,'A:receiverIrW:meanW')).toBe('3891.434262156444');expect(displayedValue(html,'B:receiverIrW:maxW')).toBe('8032.005217677903');expect(displayedValue(html,'delta:receiverIrW:meanW')).toBe('0');
  expect(Number(displayedValue(html,'B:receiverIrW:meanRangeM'))).toBeCloseTo(2*Number(displayedValue(html,'A:receiverIrW:meanRangeM')),7);
  expect(html).toContain('data-condition="observer"');expect(html).toContain('Δ не означает выигрыш');expect([serializeResultSnapshot(a),serializeResultSnapshot(b)]).toEqual(before);
});
it.each(['receiverProfile','temperature','mode','task','interval'] as const)('I5 lists only changed %s condition and visibly limits comparison',field=>{
  const a=cp04Result(),b=structuredClone(a);b.runId='different-condition';
  if(field==='receiverProfile')b.spec.receiverProfile='absolute-contrast';if(field==='temperature')b.spec.initialState.temperatureK=310;if(field==='mode')b.spec.initialState.mode='Combat';if(field==='task')b.spec.scenario.phases[0].requests['fit:march']=0.5;if(field==='interval')b.state.timeSeconds=2;
  const html=shipModelComparison(a,b);expect(html).toContain('data-condition="'+field+'"');expect(html).not.toContain('data-condition="observer"');expect(html).toContain('Разные условия');expect(html).toContain('сравнение ограничено');
});
it('I5 separate passports preserve frozen identity and report missing selected B without substituting A',()=>{
  const a=cp04Result(),before=serializeResultSnapshot(a),html=shipModelComparison(a,undefined,{sourceVariant:'A',selectedVariant:'B',frozenStale:true,bStale:false});
  expect(html).toContain('id="sm-comparison-a"');expect(html).toContain('data-run-id="I5-CP04"');expect(html).toContain('data-stale="true"');expect(html).toContain('id="sm-comparison-b"');expect(html).toContain('Выбранный B: нет измерения');expect(displayedValue(html,'B:receiverIrW:meanW')).toBe('');expect(displayedValue(html,'delta:receiverIrW:maxW')).toBe('');expect(serializeResultSnapshot(a)).toBe(before);
});
const mainLayer=(html:string)=>html.replace(/<details\b[\s\S]*?<\/details>/g,'').replace(/<[^>]*>/g,'');
it('QA B1 Compare shows only readable changed leaves, not unchanged observer/environment fields',()=>{
  const a=cp04Result();a.spec.environment.radiativeBackgroundK=100;a.spec.observer.aspectDeg=0;
  const b=structuredClone(a);b.runId='QA-selected-B';b.spec.environment.radiativeBackgroundK=120;b.spec.observer.aspectDeg=180;
  const before=[serializeResultSnapshot(a),serializeResultSnapshot(b)],html=shipModelComparison(a,b),main=mainLayer(html);
  expect(main).toContain('Ракурс: A 0° → B 180°');expect(main).toContain('Фон: A 100 K → B 120 K');
  expect(main).not.toMatch(/S-dedicated-G1|16000|solarFluxWm2|backgroundSourceId|energyInputs|aspectDeg|radiativeBackgroundK/);
  expect(html).toContain('Полные условия A/B');expect([serializeResultSnapshot(a),serializeResultSnapshot(b)]).toEqual(before);
});
it('QA B1 Compare main identity is compact/partial/stale, with full input/passport only in closed details and no retained trace DOM',()=>{
  const a=cp04Result(),b=structuredClone(a);b.runId='QA-selected-B';const html=shipModelComparison(a,b,{frozenStale:true}),main=mainLayer(html);
  expect(main).toContain(a.spec.resolvedShip.hull.label);expect(main).toContain('Состав');expect(main).toContain('ревизия');expect(main).toContain('измерено 0–1 с');expect(main).toContain('частичный');expect(main).toContain('Устарело');
  expect(main).not.toContain(a.runId);expect(main).not.toContain(b.runId);expect(main).not.toContain(a.spec.modelVersion);expect(main).not.toContain(a.spec.schemaVersion);
  expect(html).not.toMatch(/<details[^>]*\bopen\b/);expect(html).toContain(a.runId);expect(html).toContain(b.runId);expect(html).toContain(a.spec.modelVersion);expect(html).toContain('Raw snapshot');expect(html).toContain('&quot;statistics&quot;');expect(html).not.toContain('&quot;buckets&quot;');
});
it('QA B1 unknown/array/add/remove/model differences remain escaped and discoverable only in details',()=>{
  const a=cp04Result(),b=structuredClone(a);b.runId='QA-selected-B';
  Object.assign(a.spec.environment,{custom:{list:[1,2],removed:'<old>'}});Object.assign(b.spec.environment,{custom:{list:[1,3,4],added:'<script>'}});Object.assign(b.spec,{modelVersion:'different-model'});
  const html=shipModelComparison(a,b),main=mainLayer(html);
  expect(main).toContain('сравнение ограничено');expect(main).not.toMatch(/custom|list|removed|added|different-model/);
  expect(html).toContain('custom');expect(html).toContain('removed');expect(html).toContain('added');expect(html).toContain('different-model');expect(html).toContain('&lt;script&gt;');expect(html).not.toContain('<script>');
});
it('QA B2 all Compare power/range measurements bind the existing non-wrapping number-unit presentation',()=>{
  const a=cp04Result(),html=shipModelComparison(a,a),values=[...html.matchAll(/<span\b[^>]*\bdata-stat="[^"]+"[^>]*>/g)];
  expect(values).toHaveLength(24);for(const [tag]of values)expect(tag).toContain('class="measurement-value"');
});
it('Compare preserves one visible condition-group owner when several observer leaves change',()=>{
  const a=cp04Result(),b=structuredClone(a);b.spec.observer.aspectDeg=0;b.spec.observer.rangeM=20000;
  const html=shipModelComparison(a,b);expect([...html.matchAll(/data-condition="observer"/g)]).toHaveLength(1);expect(mainLayer(html)).toContain('Ракурс: A 180° → B 0°');expect(mainLayer(html)).toContain('Дальность наблюдателя');
});
function compositionRows(html:string){
  const text=html.match(/<p>Состав · ([\s\S]*?)<\/p>/)?.[1].replace(/<[^>]*>/g,'')??'';
  return text.split(' · ').map(row=>{const match=row.match(/^(.+): (\d+)$/);return {label:match?.[1],count:Number(match?.[2])};});
}
const categoryLabels:Record<string,string>={payload:'Полезная нагрузка',propulsion:'Двигатели',power:'Питание','sensors-thermal':'Сенсоры и тепло'};
it.each(Object.keys(loadCandidateCatalog('ship-fitting-0.3.0').presets))('QA B3 %s compact composition includes every actual V3 category exactly once, with no phantom legacy zero',id=>{
  const spec=fixture(id),run=createShipModelRun('QA-roster-'+id,spec);runShipModelChunk(run,1);const r=shipModelResult(run,'paused'),html=shipModelComparison(r,undefined),main=mainLayer(html);
  expect(main).toContain('Сенсоры и тепло: '+(id==='stealth-reference'?5:2));
  const rows=compositionRows(html),instances=r.spec.resolvedShip.instances,categories=[...new Set(instances.map(i=>i.item.category))];
  expect(rows).toHaveLength(categories.length);expect(rows.reduce((n,row)=>n+row.count,0)).toBe(instances.length);
  for(const category of categories)expect(rows.filter(row=>row.label===categoryLabels[category])).toEqual([{label:categoryLabels[category],count:instances.filter(i=>i.item.category===category).length}]);
  expect(rows.every(row=>row.count>0)).toBe(true);expect(main).not.toContain('Контроль сигнатур: 0');if(id==='sputnik')expect(instances).toHaveLength(10);
});
it('QA B3 disabled installed instances and builtins stay in measured composition instead of disappearing',()=>{
  const w=workspace();w.loadPreset('sputnik');w.setEnabled('fit:payload-1',false);w.setEnabled('builtin:electric-heater',false);w.updateConditions({durationSeconds:1});
  const run=createShipModelRun('QA-disabled-roster',w.start('QA-disabled-roster'));runShipModelChunk(run,1);const r=shipModelResult(run);expect(r.spec.resolvedShip.instances.filter(i=>i.builtin)).toHaveLength(2);expect(r.spec.resolvedShip.instances.filter(i=>!i.enabled)).toHaveLength(2);
  expect(compositionRows(shipModelComparison(r,undefined))).toEqual([{label:'Полезная нагрузка',count:2},{label:'Двигатели',count:4},{label:'Питание',count:2},{label:'Сенсоры и тепло',count:2}]);
});
it('QA B3 unknown categories get an escaped truthful fallback and deterministic order independent of roster ordering',()=>{
  const run=createShipModelRun('QA-future-roster',fixture());runShipModelChunk(run,1);const r=shipModelResult(run,'paused');Object.assign(r.spec.resolvedShip.instances[0].item,{category:'z-future<&>'});Object.assign(r.spec.resolvedShip.instances[1].item,{category:'a-future'});
  const before=serializeResultSnapshot(r),html=shipModelComparison(r,undefined),rows=compositionRows(html);expect(rows.map(row=>row.label)).toEqual(['Полезная нагрузка','Двигатели','Питание','Сенсоры и тепло','a-future','z-future&lt;&amp;&gt;']);expect(rows.reduce((n,row)=>n+row.count,0)).toBe(10);expect(html).not.toContain('<&>');expect(serializeResultSnapshot(r)).toBe(before);
  const reversed=structuredClone(r);reversed.spec.resolvedShip.instances.reverse();expect(compositionRows(shipModelComparison(reversed,undefined))).toEqual(rows);
});
