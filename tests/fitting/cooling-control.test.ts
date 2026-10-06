import { describe, expect, it } from 'vitest';
import { getPresetFit,loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMiningRun } from '../../src/scenarios/fitting';
import { initialStateV2,stepV2,validateRunSpecV2 } from '../../src/model/v2/step';
import { DiagnosticObserver } from '../../src/runner/diagnostics';
import { createRun,runChunk,result } from '../../src/runner/run';
import { parseResultJson } from '../../src/io/fitting-result';
import old from './fixtures/station-service-old.json';

const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v);
function installed(size:'S'|'M',T=300){
 const c=loadCandidateCatalog(),f=getPresetFit(size==='S'?'pony:2':'civilian-M:1');
 const put=(slot:string,itemId:string)=>{const id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};};
 if(size==='M'){put('power-1','battery-M');put('power-2','generator-hydrogen-M');put('power-3','tank-hydrogen-M');}
 else put('power-3','tank-hydrogen-S');
 put('signature-1','h2-cooler-'+size);
 const s=makeMiningRun(f,c,{temperatureK:T,durationSeconds:2,stepSeconds:.1});if(!s.ok)throw Error(json(s));return s.value;
}

describe('CC01/CC04 compiled S/M actual demand and sparse diagnostics',()=>{
 it.each(['S','M'] as const)('%s floor does not invent cooler depletion/gate/power events and real other consumers remain',size=>{
  const s=installed(size,299),previous=initialStateV2(s),before=structuredClone(s),observer=new DiagnosticObserver();
  const step=stepV2(s,previous,.1,{}),events=observer.observeV2(s,previous,step,{},'idle');
  expect(s).toEqual(before);expect(step.telemetry.h2CoolingW).toBe(0);expect(step.telemetry.h2AuxRejectW).toBe(0);expect(step.state.consumptionKg['hydrogen:cooler:fit:signature-1']??0).toBe(0);
  if(size==='M')expect(step.state.consumptionKg['hydrogen:generator:fit:power-2']).toBeGreaterThan(0);
  const text=events.map(e=>e.message).join('\n');expect(text).toContain('защита от переохлаждения300 K');expect(events.filter(e=>e.message.includes('fit:signature-1')&&e.kind!=='cooling-control')).toEqual([]);
  const all=[...events];let state=step.state;for(let j=0;j<100;j++){const next=stepV2(s,state,.1,{});all.push(...observer.observeV2(s,state,next,{},'idle'));state=next.state;}
  expect(all.filter(e=>e.kind==='cooling-control'&&e.message.includes('fit:signature-1'))).toHaveLength(1);expect(all.filter(e=>e.kind==='cooling-controls-version')).toHaveLength(1);
 });
 it('a gated positive tank is only diagnosed when the cooler has a real thermal request',()=>{
  const s=installed('S',510),tank=s.resolvedShip.instances.find(i=>i.item.family==='tank'&&i.item.species==='hydrogen')!;tank.item.gate={...tank.item.gate,low:520,workLow:530,restartLow:525};const state=initialStateV2(s);
  const p=stepV2(s,state,.1,{}),text=new DiagnosticObserver().observeV2(s,state,p,{},'recovery').map(e=>e.message).join('\n');expect(p.state.fuelKg.hydrogen).toBeGreaterThan(0);expect(p.telemetry.h2CoolingW).toBe(0);expect(text).toContain('Топливо есть');expect(text).toContain('температур');expect(text).not.toContain('Исчерпан hydrogen');
  state.temperatureK=299;const cold=stepV2(s,state,.1,{});expect(new DiagnosticObserver().observeV2(s,state,cold,{},'cold').filter(e=>e.message.includes('Подача hydrogen'))).toEqual([]);
 });
 it('a genuinely needed empty cooler stock is a resource cause, not normal OFF',()=>{const s=installed('S',510);s.initial.fuelKg.hydrogen=0;const state=initialStateV2(s),p=stepV2(s,state,.1,{}),events=new DiagnosticObserver().observeV2(s,state,p,{},'hot');expect(p.telemetry['coolingRequested:fit:signature-1']).toBe(1);expect(events.some(e=>e.message.includes('fit:signature-1')&&e.message.includes('Исчерпан hydrogen'))).toBe(true);});
 it('old stored results reopen byte-for-byte; a new replay discloses the current controller once',()=>{
  const saved=result(createRun('saved-zero',old.spec as any)),before=json(saved),opened=parseResultJson(before);expect(opened.ok).toBe(true);if(!opened.ok)throw Error(json(opened));expect(json(opened.value)).toBe(before);
  const run=createRun('rerun',old.spec as any);runChunk(run,1);expect(result(run).events.filter(e=>e.kind==='cooling-controls-version')).toHaveLength(1);expect(json(saved)).toBe(before);
 });
 it('medium actual source heat/export and shared stock close without changing the numerical spec',()=>{
  const s=installed('M',510);s.initial.fuelKg.hydrogen=.001;expect(validateRunSpecV2(s).ok).toBe(true);const state=initialStateV2(s),p=stepV2(s,state,1,{[s.selectedWorkGroup[0]]:1});
  expect(p.state.fuelKg.hydrogen).toBe(0);expect(p.state.consumptionKg['hydrogen:cooler:fit:signature-1']).toBeGreaterThan(0);expect(p.state.consumptionKg['hydrogen:generator:fit:power-2']).toBeGreaterThan(0);expect(Math.abs(p.telemetry.energyResidualJ)).toBeLessThan(1);
  expect(Object.values(p.state.consumptionKg).reduce((n,v)=>n+v,0)).toBeCloseTo(.001,10);expect(p.telemetry.chemicalW).toBeCloseTo(p.telemetry.generatorW+p.telemetry.pathLossW+p.telemetry.generatorHostW+p.telemetry.exhaustW,6);expect(p.telemetry.generatorHostW).toBeGreaterThan(0);expect(p.telemetry.pathLossW).toBeGreaterThan(0);
 });
});

it('CC04/05 real cooled result JSON/CSV roundtrip preserves actual channels and rejects a foreign instance atomically',async()=>{
 const {exportFittingTelemetryCsv,fittingChannelUnit}=await import('../../src/io/fitting-csv');
 const {FittingWorkspace}=await import('../../src/app/fitting-workspace');
 const s=installed('S',510),r=createRun('hot-native',s);while(!r.done)runChunk(r,100);const native=result(r),saved=json(native),p=parseResultJson(saved);expect(p.ok,p.ok?'':json(p.errors)).toBe(true);if(p.ok)expect(json(p.value)).toBe(saved);
 expect(native.channels).toContain('coolingW:fit:signature-1');expect(fittingChannelUnit('coolingW:fit:signature-1')).toBe('W');expect(fittingChannelUnit('coolingRequested:fit:signature-1')).toBe('1');expect(exportFittingTelemetryCsv(native)).toContain('coolingW:fit:signature-1_mean_W');
 const w=new FittingWorkspace(getPresetFit('pony:1'),loadCandidateCatalog());expect(w.importDocument(saved).ok).toBe(true);expect(w.freeze()).toBe(true);const before=w.snapshot(),bad=structuredClone(native);bad.channels[0]='coolingW:foreign';expect(w.importDocument(json(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(before);
});

it('CC04 actual steady working-boundary cooling does not produce per-dt false thermal episodes',()=>{
 const s=installed('S',500),observer=new DiagnosticObserver();let state=initialStateV2(s);const events=[];
 for(let j=0;j<500;j++){const requests={retro:1},p=stepV2(s,state,.1,requests);events.push(...observer.observeV2(s,state,p,requests,'steady-braking'));state=p.state;}
 expect(state.temperatureK).toBeCloseTo(500,6);expect(events.filter(e=>e.kind==='cooling-control')).toHaveLength(1);expect(events.filter(e=>e.kind.startsWith('diagnostic'))).toEqual([]);
});

it('CC04 sub-display roundoff near workHigh and intermittent real requests do not spam 100.0% thermal warnings',()=>{
 const s=installed('S',500),observer=new DiagnosticObserver();let state=initialStateV2(s);const events=[];
 for(let j=0;j<100;j++){state.temperatureK=500+5e-7;const requests:Record<string,number>=j%2?{}:{retro:1},p=stepV2(s,state,.01,requests);events.push(...observer.observeV2(s,state,p,requests,'boundary'));state=p.state;}
 expect(events.filter(e=>e.kind.startsWith('diagnostic'))).toEqual([]);expect(events.filter(e=>e.kind==='cooling-control')).toHaveLength(2);expect(events.some(e=>e.message.includes('не требуется'))).toBe(true);expect(events.some(e=>e.message.includes('запрошено'))).toBe(true);
});

it('CC04 real alternating requested propulsion retains one ongoing cause per installed identity, not one event per pulse',()=>{
 const s=installed('S',510),observer=new DiagnosticObserver();let state=initialStateV2(s);const events=[];
 for(let j=0;j<100;j++){const requests:Record<string,number>=j%2?{march:.01}:{retro:.01},p=stepV2(s,state,.0001,requests);events.push(...observer.observeV2(s,state,p,requests,'flight'));state=p.state;}
 expect(events.filter(e=>e.kind==='diagnostic-thrust-thermal')).toHaveLength(2);expect(events.filter(e=>e.kind==='diagnostic-wear')).toHaveLength(1);expect(events.filter(e=>e.kind==='cooling-control')).toHaveLength(1);
});
