import { describe, it, expect } from 'vitest';
import { fixture } from './test-spec';
import { createFittingRun, runFittingChunk, fittingResult } from '../../src/runner/fitting-run';
import { overview } from '../../src/app/fitting-ui/trace-chart';
import { parseResultJson } from '../../src/io/fitting-result';
import { DiagnosticObserver, gatedOperations } from '../../src/runner/diagnostics';
import { initialStateV2, stepV2 } from '../../src/model/v2/step';
import { makeMissionRun } from '../../src/scenarios/mission';
import { loadCandidateCatalog, getPresetFit } from '../../src/fitting/catalog';
import { firstLimiter } from '../../src/app/fitting-ui/lab-view';
import { thermalFrontiers } from '../../src/app/fitting-ui/trace-chart';
import { createHash } from 'node:crypto';
import { presets } from '../../src/catalog/presets';
import { createRun, runChunk, result } from '../../src/runner/run';
import { exportFittingTelemetryCsv } from '../../src/io/fitting-csv';
import { exportEventsCsv } from '../../src/io/json';
import { stepModel } from '../../src/model/step';

function legacyTransition(kind:'cold-stop'|'cold-restart'|'hot-stop'|'hot-restart'='cold-stop'){
 const s=structuredClone(presets[0]);
 s.ship.modules.find(m=>m.id==='laser')!.gate={low:225,workLow:250,restartLow:260,workHigh:510,restartHigh:550,high:570};
 s.initial.temperatureK=kind==='cold-stop'?225.0000001:kind==='cold-restart'?259.9999999:kind==='hot-stop'?569.99999:550.0000001;
 s.ship.modules.find(m=>m.id==='passive')!.areaM2=1e6;
 if(kind==='cold-restart'||kind==='hot-stop'){s.environment.directHeat=[{sourceId:'controlled-transition',powerW:kind==='hot-stop'?1e10:1e9}];s.origins['environment.directHeat.0.powerW']={kind:'experimental',sourceRef:'test:CR-TD-B1 controlled warming'};}
 s.stepSeconds=.02;s.durationSeconds=.02;s.scenario.phases=[{id:'accepted-'+kind,action:'work',duty:1,durationSeconds:.02}];
 return s;
}

describe('CR-TD-B1 Legacy native protection transitions',()=>{
 it.each(['cold-stop','cold-restart','hot-stop','hot-restart'] as const)('retains the accepted %s edge, module identity and safe bounds without individual useful output',kind=>{
  const s=legacyTransition(kind),r=createRun('legacy-native',s);if(kind.endsWith('restart'))r.state.gates.laser=true;
  if(kind==='cold-restart')r.state.cargo=.25;
  const before=structuredClone(r.state);before.phaseKey='0:0';
  const native=stepModel(s.ship,before,s.environment,[{moduleId:'laser',duty:1}],.02),eventKind=kind.endsWith('stop')?'thermal-stop':'thermal-restart';
  const edge=native.events.find(e=>e.kind===eventKind&&e.message.startsWith('laser: '))!;expect(edge).toBeDefined();
  runChunk(r,1);expect(r.state).toEqual(native.state);expect(r.last).toEqual(native.telemetry);
  const edges=result(r).events.filter(e=>e.kind===eventKind&&e.message.includes('[laser]'));expect(edges).toHaveLength(1);
  expect(edges[0].timeSeconds).toBe(edge.timeSeconds);expect(edges[0].message).toContain('accepted-'+kind);expect(edges[0].message).toContain('260');expect(edges[0].message).toContain('550');
  if(kind.endsWith('stop'))expect(edges[0].message).toContain(kind.startsWith('cold')?'переохлаждение':'перегрев');
  else expect(edges[0].message).toContain('зависит от запроса, питания и ресурса');
  expect(edges[0].message).not.toMatch(/фактический выход|полезных W|%/);
  expect(result(r).events.filter(e=>['thermal-stop','thermal-restart'].includes(e.kind)&&e.message.includes('[mining-group]'))).toEqual([]);
  const csv=exportEventsCsv(result(r));expect(csv).toContain(edges[0].message.replaceAll('"','""'));
  if(kind==='cold-stop'){expect(edge.timeSeconds).toBe(2.5523750082356862e-8);expect(r.state.temperatureK).toBe(224.9216984542996);}
  if(kind==='cold-restart')expect(r.state.cargo).toBeGreaterThanOrEqual(.25);
 });
 it('keeps distinct requested Active identities and each edge once across two real chunks',()=>{
  const s=legacyTransition(),laser=s.ship.modules.find(m=>m.id==='laser')!;
  s.ship.modules.push({...structuredClone(laser),id:'laser: secondary',efficiency:.25});s.durationSeconds=.04;s.scenario.phases[0].durationSeconds=.04;
  for(const path of Object.keys(s.origins).filter(p=>p.startsWith('ship.modules.2.')))s.origins[path.replace('ship.modules.2.','ship.modules.4.')]={kind:'experimental',sourceRef:'test:CR-TD-B1 second Active load'};
  const r=createRun('legacy-two-loads',s);r.state.cargo=.25;runChunk(r,1);runChunk(r,1);
  const events=result(r).events.filter(e=>e.kind==='thermal-stop');
  for(const id of ['laser','laser: secondary']){const own=events.filter(e=>e.message.includes('['+id+']'));expect(own).toHaveLength(1);expect(own[0].timeSeconds).toBeGreaterThan(0);expect(own[0].timeSeconds).toBeLessThan(.02);}
  expect(events.filter(e=>e.message.includes('[mining-group]'))).toEqual([]);expect(r.state.cargo).toBeGreaterThanOrEqual(.25);
  const off=structuredClone(s);off.ship.modules.at(-1)!.enabled=false;const offRun=createRun('legacy-disabled-peer',off);runChunk(offRun,1);
  expect(result(offRun).events.filter(e=>e.kind==='thermal-stop'&&e.message.includes('[laser]'))).toHaveLength(1);
  expect(result(offRun).events.filter(e=>e.message.includes('[laser: secondary]'))).toEqual([]);
 });
 it.each(['idle','cargo-full','disabled'] as const)('does not turn a real but unrequested load gate into a mining warning during %s',mode=>{
  const s=legacyTransition();if(mode==='idle')s.scenario.phases[0].action='idle';if(mode==='disabled')s.ship.modules.find(m=>m.id==='laser')!.enabled=false;
  const r=createRun('legacy-unrequested',s);if(mode==='cargo-full')r.state.cargo=s.ship.cargoCapacity;
  runChunk(r,1);expect(r.state.gates.laser).toBe(true);
  expect(result(r).events.filter(e=>e.message.includes('[laser]')||e.message.includes('[mining-group]'))).toEqual([]);
 });
});

function observed(T=225,action:'work'|'idle'='work') {
 const s=fixture('pony:2');s.initial.temperatureK=T;s.initial.chargeJ=s.resolvedShip.batteryCapacityJ;
 s.durationSeconds=.1;s.scenario.phases[0].durationSeconds=.1;
 if(action==='idle'){s.scenario.phases[0].action='idle';s.scenario.phases[0].requests={};}
 const r=createFittingRun('diagnostic',s);runFittingChunk(r,1);return r;
}
describe('TD01–06 accepted-step observations',()=>{
 it('cold mining reports useful-output weighted percent and real module/bounds/phase',()=>{
  const r=observed(),ids=r.spec.selectedWorkGroup,nominal=r.spec.resolvedShip.instances.filter(i=>ids.includes(i.id)).reduce((n,i)=>n+i.item.numerics.powerW*i.item.numerics.efficiency,0),actual=ids.reduce((n,id)=>n+r.last['beamW:'+id],0);
  const text=r.events.items().map(e=>e.message).join('\n');
  expect(text).toContain(`Добыча ${(actual/nominal*100).toFixed(1)}%`);expect(text).toContain('переохлаждение');expect(text).toContain('work');expect(text).toContain('builtin:laser');expect(text).toContain('250');expect(text).toContain('численно в этой модели не рассчитывается');
 });
 it('hot mining explains cooling separately from available positive electric energy',()=>{
  const r=observed(525),text=r.events.items().filter(e=>e.kind.startsWith('diagnostic')).map(e=>e.message).join('\n');
  expect(text).toContain('недостаточно охлаждения');expect(text).toContain('525');expect(text).not.toContain('аккумулятор пуст');
 });
 it('critical positive typed fuel is described as gated feed, not exhausted stock',()=>{
  const r=observed(180),text=r.events.items().map(e=>e.message).join('\n');
  expect(r.state.fuelKg.diesel).toBeGreaterThan(0);expect(text).toContain('Топливо есть');expect(text).toContain('diesel');expect(text).toContain('температурный запрет');expect(text).toContain('повторного включения');
 });
 it('idle does not invent a requested mining thermal failure',()=>{const r=observed(225,'idle');expect(r.events.items().filter(e=>e.kind.startsWith('diagnostic')&&e.message.includes('Добыча'))).toEqual([]);});
 it('events retain literal text through JSON/CSV without adding required replay fields',()=>{
  const r=fittingResult(observed()),text=JSON.stringify(r,(_k,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v),parsed=parseResultJson(text);expect(parsed.ok).toBe(true);
  if(parsed.ok)expect(parsed.value.events).toEqual(r.events);
  expect(text).toContain('переохлаждение');
  const metadata=JSON.parse(exportFittingTelemetryCsv(r).split('\n')[1].slice(2));expect(metadata.events).toEqual(r.events);
 });
});
describe('TD02–04 sparse causal episodes',()=>{
 it('Legacy uses its recorded useful work and existing cold profile without inventing individual output',()=>{
  const s=structuredClone(presets[0]);s.initial.temperatureK=180;s.durationSeconds=.1;s.stepSeconds=.1;s.scenario.phases=[{id:'legacy-cold',action:'work',durationSeconds:1,duty:1}];const r=createRun('legacy-cold',s);runChunk(r,1);
  const text=r.events.items().map(e=>e.message).join('\n'),nominal=s.ship.modules.filter(m=>m.enabled&&m.kind==='load'&&m.policy==='Active').reduce((n,m)=>n+m.powerW*m.efficiency*m.workPerJ,0);expect(text).toContain(`Добыча ${(r.last.workRate/nominal*100).toFixed(1)}%`);expect(text).toContain('переохлаждение');expect(text).toContain('legacy-cold');expect(text).toContain('Legacy: индивидуальный фактический выход не записан');expect(text).toContain('численно в этой модели не рассчитывается');
  const csv=exportEventsCsv(result(r));for(const e of r.events.items())expect(csv).toContain(e.message.replaceAll('"','""'));
 });
 it('mixed laser efficiencies and different temperature profiles use useful power weights, not arithmetic percents',()=>{
  const s=fixture('pony:2');s.initial.temperatureK=225;s.initial.chargeJ=s.resolvedShip.batteryCapacityJ;
  const i=s.resolvedShip.instances.find(i=>i.id==='fit:payload-1')!;i.item.gate.workLow=300;
  const previous=initialStateV2(s),step=stepV2(s,previous,.01,s.scenario.phases[0].requests),events=new DiagnosticObserver().observeV2(s,previous,step,s.scenario.phases[0].requests,'mixed');
  const nominal=s.resolvedShip.instances.filter(i=>s.selectedWorkGroup.includes(i.id)).reduce((n,i)=>n+i.item.numerics.powerW*i.item.numerics.efficiency,0),actual=s.selectedWorkGroup.reduce((n,id)=>n+step.telemetry['beamW:'+id],0);
  expect(events.map(e=>e.message).join('\n')).toContain(`Добыча ${(100*actual/nominal).toFixed(1)}%`);expect(100*actual/nominal).not.toBeCloseTo(37.5,1);
 });
 it('critical stop/restart/working emits one wear notice and does not promise power after restart',()=>{
  const s=fixture('pony:2'),observer=new DiagnosticObserver(),requests=s.scenario.phases[0].requests,events=[];
  let state=initialStateV2(s);state.temperatureK=180;
  for(const T of [180,180,240,270,300]){state.temperatureK=T;const step=stepV2(s,state,.01,requests);events.push(...observer.observeV2(s,state,step,requests,'recovery'));state=step.state;}
  expect(events.filter(e=>e.kind==='diagnostic-wear')).toHaveLength(1);expect(events.some(e=>e.kind==='thermal-stop')).toBe(true);expect(events.some(e=>e.kind==='thermal-restart'&&e.message.includes('зависит от запроса, питания и ресурса'))).toBe(true);expect(events.some(e=>e.kind==='diagnostic-recovered')).toBe(true);
 });
 it('positive charge does not turn cold derating into a bus shortage; healthy generator partial load is quiet',()=>{
  const r=observed(225);expect(r.events.items().map(e=>e.message).join('\n')).not.toContain('мощности недостаточно');
  const healthy=observed(300,'idle');expect(healthy.last.generatorW).toBeLessThan(450000);expect(healthy.events.items().filter(e=>e.message.includes('Генератор')&&e.kind.startsWith('diagnostic'))).toEqual([]);
 });
 it('actual power and depleted installed generator fuel remain distinct causes',()=>{
  const s=fixture('pony:2');s.initial.chargeJ=0;s.initial.fuelKg.diesel=0;s.initial.temperatureK=225;
  const state=initialStateV2(s),step=stepV2(s,state,.01,s.scenario.phases[0].requests),events=new DiagnosticObserver().observeV2(s,state,step,s.scenario.phases[0].requests,'empty'),text=events.map(e=>e.message).join('\n');
  expect(text).toContain('переохлаждение');expect(text).toContain('электрической мощности');expect(text).toContain('Исчерпан diesel');expect(text).not.toContain('Исчерпан hydrogen');
 });
 it('retro with positive fuel but a separate cold supply gate warns about unavailable braking thrust',()=>{
  const s=fixture('pony:2'),state=initialStateV2(s);state.temperatureK=300;state.chargeJ=s.resolvedShip.batteryCapacityJ;const tank=s.resolvedShip.instances.find(i=>i.item.family==='tank'&&i.item.species==='diesel')!;tank.item.gate={...tank.item.gate,low:320,workLow:350,restartLow:340};
  const step=stepV2(s,state,.01,{retro:1}),text=new DiagnosticObserver().observeV2(s,state,step,{retro:1},'braking').map(e=>e.message).join('\n');expect(text).toContain('Тяга retro');expect(text).toContain('снижена тормозная тяга');expect(text).toContain('Топливо есть');expect(text).not.toContain('Исчерпан diesel');
 });
 it('cargo full and disabled mining have no false temperature-stop operation',()=>{
  const s=fixture('pony:2');s.initial.temperatureK=225;s.initial.cargoM3.ore=s.resolvedShip.cargoCapacityM3.universal+s.resolvedShip.cargoCapacityM3.bulk;
  const state=initialStateV2(s),step=stepV2(s,state,.01,s.scenario.phases[0].requests),text=new DiagnosticObserver().observeV2(s,state,step,s.scenario.phases[0].requests,'full').map(e=>e.message).join('\n');expect(text).not.toContain('Добыча');
  for(const i of s.resolvedShip.instances)if(i.item.family==='mining')i.enabled=false;
  expect(new DiagnosticObserver().observeV2(s,state,step,s.scenario.phases[0].requests,'disabled').map(e=>e.message).join('\n')).not.toContain('Лазер');
 });
 it('same cause and boundary jitter do not create per-tick events or cross-run episodes',()=>{
  const s=fixture('pony:2'),observer=new DiagnosticObserver(),state=initialStateV2(s),requests=s.scenario.phases[0].requests;state.temperatureK=225;state.chargeJ=s.resolvedShip.batteryCapacityJ;
  const events=[];for(let j=0;j<500;j++){const step=stepV2(s,state,.01,requests);step.telemetry['beamW:builtin:laser']=350000*(j%2?.601:.599);step.telemetry['beamW:fit:payload-1']=1500300*(j%2?.601:.599);events.push(...observer.observeV2(s,state,step,requests,'jitter'));}
  expect(events.length).toBeLessThan(12);expect(events.filter(e=>e.kind==='diagnostic-wear')).toHaveLength(1);const other=new DiagnosticObserver();expect(other.observeV2(s,state,stepV2(s,state,.01,requests),requests,'new-run').length).toBeGreaterThan(0);
 });
 it('retro thermal warning uses real accepted force and finite conditional stopping distance',()=>{
  const s=fixture('pony:2'),state=initialStateV2(s);state.temperatureK=525;state.chargeJ=s.resolvedShip.batteryCapacityJ;
  state.mission={stage:'inbound',flightMode:'braking',positionM:0,velocityMS:100,stageStartedSeconds:0,tripStartedSeconds:0,outboundMassKg:state.currentMassKg,inboundMassKg:state.currentMassKg,peakVelocityMS:100,deliveredM3:0,receivedFuelKg:{diesel:0,hydrogen:0},elapsed:{flight:0,approach:0,mining:0,service:0,recovery:0},firstLimiter:null,terminalReason:null};
  const step=stepV2(s,state,.01,{retro:1}),text=new DiagnosticObserver().observeV2(s,state,step,{retro:1},'braking').map(e=>e.message).join('\n');expect(text).toContain('Тяга retro');expect(text).toContain('снижена тормозная тяга');expect(text).toContain('оценка при постоянной доступной тяге');expect(text).not.toMatch(/NaN|Infinity/);
  state.temperatureK=600;const zero=stepV2(s,state,.01,{retro:1}),zeroText=new DiagnosticObserver().observeV2(s,state,zero,{retro:1},'braking').map(e=>e.message).join('\n');expect(zeroText).toContain('тормозная тяга недоступна');expect(zeroText).not.toMatch(/NaN|Infinity/);
 });
 it('mission first-limiter UI explains the same cold actual step as its journal without changing first cause/time',()=>{
  const s=makeMissionRun(getPresetFit('pony:1'),loadCandidateCatalog(),{temperatureK:225,durationSeconds:1,distanceM:0,approachSeconds:0,serviceSeconds:0});if(!s.ok)throw Error('fixture');const r=createFittingRun('cold',s.value);runFittingChunk(r,1);const native=fittingResult(r);
  expect(firstLimiter(native)).toContain('переохлаждение');expect(native.state.mission!.firstLimiter!.timeSeconds).toBe(0);expect(native.state.mission!.firstLimiter!.causes).toContain('thermal');
 });
 it('an already protected module explains its restart boundary on the first real request',()=>{
  const s=fixture('pony:2'),state=initialStateV2(s);state.temperatureK=180;state.chargeJ=s.resolvedShip.batteryCapacityJ;state.gates=Object.fromEntries(s.resolvedShip.instances.map(i=>[i.id,true]));state.gates['tank:diesel']=true;
  const step=stepV2(s,state,.01,s.scenario.phases[0].requests),events=new DiagnosticObserver().observeV2(s,state,step,s.scenario.phases[0].requests,'first-request');expect(events.some(e=>e.kind==='thermal-stop'&&e.message.includes('повторного включения'))).toBe(true);
 });
 it('warming removes only thermal cause while actual power/resource shortage remains',()=>{
  const s=fixture('pony:2'),observer=new DiagnosticObserver(),requests=s.scenario.phases[0].requests,state=initialStateV2(s);state.chargeJ=0;state.fuelKg.diesel=0;state.temperatureK=225;const cold=stepV2(s,state,.01,requests);observer.observeV2(s,state,cold,requests,'cold');state.temperatureK=300;
  const warm=stepV2(s,state,.01,requests),events=observer.observeV2(s,state,warm,requests,'warm'),text=events.map(e=>e.message).join('\n');expect(text).toContain('Температурное ограничение снято; другие ограничения могут сохраняться');expect(text).toContain('электрической мощности');expect(warm.mining.selectedM3).toBe(0);
 });
 it('mission planning trials for retro do not publish retro observations during an accepted march step',()=>{
  const s=makeMissionRun(getPresetFit('pony:1'),loadCandidateCatalog(),{temperatureK:525,durationSeconds:1,distanceM:100000});if(!s.ok)throw Error('fixture');const r=createFittingRun('trial-boundary',s.value);runFittingChunk(r,1);expect(r.state.timeSeconds).toBe(.1);expect(r.retention.totalTicks).toBe(1);
  const thrust=r.events.items().filter(e=>e.kind.startsWith('diagnostic-thrust'));expect(thrust.some(e=>e.message.includes('Тяга march'))).toBe(true);expect(thrust.some(e=>e.message.includes('Тяга retro'))).toBe(false);
 });
});
it.each([[225,'9ed8c2260a49c334e16f4ed478738b5faa42ff46bb17edd6c27c88c99f803f11'],[525,'c8260711b790e3d7366caf7152dd72bdac8f71e4d4aecc3067a01cf082996722']])('TD06 pre-change physical oracle T%s remains exact',(T,expected)=>{
 const s=fixture('pony:2');s.initial.temperatureK=Number(T);s.initial.chargeJ=s.resolvedShip.batteryCapacityJ;s.durationSeconds=5;s.scenario.phases[0].durationSeconds=5;const run=createFittingRun('oracle',s);while(!run.done)runFittingChunk(run,20000);const r=fittingResult(run),state=structuredClone(r.state);delete (state as Partial<typeof state>).constraints;
 expect(createHash('sha256').update(JSON.stringify({state,metrics:r.metrics,channels:r.channels,buckets:r.buckets})).digest('hex')).toBe(expected);
});
describe('TD05 thermal graph',()=>{
 it('shows both colored zones and all four boundaries from saved operating profiles',()=>{
  const r=fittingResult(observed()),svg=overview(r);expect(svg).toContain('data-thermal-band="cold"');expect(svg).toContain('data-thermal-band="hot"');
  for(const id of ['work-low','critical-low','work-high','critical-high'])expect(svg).toContain(`data-boundary="${id}"`);
 });
 it('reports disjoint enabled working ranges without a misleading common filled corridor',()=>{
  const r=fittingResult(observed()),laser=r.spec.resolvedShip.instances.find(i=>i.item.family==='mining')!;laser.item.gate.workLow=700;laser.item.gate.workHigh=750;laser.item.gate.high=800;
  expect(overview(r)).toContain('Нет общего рабочего температурного диапазона');expect(overview(r)).not.toContain('data-thermal-band=');
 });
 it('max lower/min upper excludes disabled, battery/cargo and passive radiative area',()=>{
  const r=fittingResult(observed()),ops=gatedOperations(r.spec);expect(ops.some(i=>['battery','cargo','buffer'].includes(i.item.family))).toBe(false);
  const laser=ops.find(i=>i.item.family==='mining')!;laser.item.gate.low=210;laser.item.gate.workLow=275;
  const f=thermalFrontiers(r);expect(f.limits.find(l=>l.id==='critical-low')?.value).toBe(210);expect(f.limits.find(l=>l.id==='work-low')?.value).toBe(275);expect(f.limits.find(l=>l.id==='work-high')?.value).toBe(500);expect(f.limits.find(l=>l.id==='critical-high')?.value).toBe(550);
 });
 it('empty old replay has no invented bands; measured 200K remains inside plot and 500/550 labels separate',()=>{
  const r=fittingResult(observed(200));const svg=overview(r),ys=[...svg.matchAll(/<text fill="#[^"]+" x="80" y="([\d.]+)"/g)].map(m=>Number(m[1]));expect(ys.length).toBe(4);expect(Math.abs(ys[0]-ys[1])).toBeGreaterThanOrEqual(18);expect(svg).not.toMatch(/height="-/);
  r.channels=[];r.buckets=[];expect(overview(r)).toContain('Холод: рабочая от');for(const i of r.spec.resolvedShip.instances)i.enabled=false;expect(overview(r)).toContain('Нет включённых операций');expect(overview(r)).not.toContain('data-thermal-band=');
 });
});
