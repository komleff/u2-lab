import {it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import * as factories from '../../src/fitting/catalog';
import {compileFit} from '../../src/fitting/compile';
import {fitHull} from '../../src/fitting/editions';
import {installedInstances,validateFit} from '../../src/fitting/validate';
import {makeMiningRun} from '../../src/scenarios/fitting';
import {freshMissionConditions} from '../../src/scenarios/mission';
import {initialStateV2,stepV2} from '../../src/model/v2/step';
import {createRun,runChunk,result} from '../../src/runner/run';
import {parseFitJson,parseExperimentJson} from '../../src/io/fitting-json';
import {parseResultJson} from '../../src/io/fitting-result';
import {FittingWorkspace} from '../../src/app/fitting-workspace';
import {shipView} from '../../src/app/fitting-ui/ship-view';
import old from './fixtures/catalog-0.2.4-digests.json';
import oldStation from './fixtures/station-service-old.json';
import type {ShipFit} from '../../src/fitting/types';
const version='ship-fitting-0.2.5' as any;
const {loadCandidateCatalog,getPresetFit}=factories;
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const put=(f:ShipFit,slot:string,itemId:string)=>{const id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};return f;};
const json=(x:unknown)=>JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v);
export const assemblies=[['civilian-M:2:H','H',216,'mining-civil-M','H'],['severin-mir:2:D','U',216,'mining-civil-M','D'],['severin-mir:2:E','U',216,'mining-civil-M','E'],['industrial-M:2:D','U',240,'mining-industrial-M','D'],['industrial-M:2:H','U',240,'mining-industrial-M','H'],['industrial-M:2:E','U',240,'mining-industrial-M','E'],['industrial-S:1:D','U',36,'mining-industrial-S','D'],['industrial-S:1:H','U',36,'mining-industrial-S','H'],['industrial-S:1:E','U',36,'mining-industrial-S','E']] as const;
for(const [id,architecture,capacity,laser,code] of assemblies)it(`MD01/02 real ${id} mounts, readiness, cargo and typed propulsion`,()=>{
 const c=loadCandidateCatalog(version),f=getPresetFit(id,version),compiled=compileFit(f,c);expect(compiled.ok,JSON.stringify(validateFit(f,c))).toBe(true);if(!compiled.ok)throw Error('compile');const r=compiled.value;
 expect(r.hull.architecture).toBe(architecture);expect(r.cargoCapacityM3.universal+r.cargoCapacityM3.bulk).toBe(capacity);
 const size=r.hull.size;expect(r.instances.filter(i=>i.item.family==='mining').map(i=>i.item.id)).toEqual(size==='M'?[laser,laser]:[laser]);expect(r.instances.filter(i=>i.item.family==='engine').map(i=>i.item.propulsionType)).toEqual(Array(4).fill({D:'diesel',H:'hydrogen',E:'electric'}[code]));
 expect(r.instances.filter(i=>!i.builtin&&i.item.family==='battery').map(i=>i.item.id)).toEqual([id==='industrial-S:1:D'?'battery-XS':'battery-'+size]);
 expect(r.instances.filter(i=>i.item.family==='generator').map(i=>i.item.id)).toEqual(code==='E'?[]:[id==='industrial-S:1:D'?'generator-diesel-XS':`generator-${code==='D'?'diesel':'hydrogen'}-${size}`]);
 if(code==='E')expect(r.instances.filter(i=>i.item.family==='solar').map(i=>i.item.id)).toEqual(['solar-'+size]);
 if(size==='M'){expect(r.instances.find(i=>i.slotId==='payload-3')!.item.id).toBe('cargo-bulk-M');expect(r.instances.filter(i=>i.item.family==='radiator').map(i=>i.slotId)).toEqual(['signature-1']);}
 expect(r.dryMassKg).toBe(r.materials.reduce((s,m)=>s+m.massKg,0));expect(r.heatCapacityJK).toBe(r.materials.reduce((s,m)=>s+m.massKg*m.cpJKgK,0));
 if(code!=='E')expect(r.resources[code==='D'?'diesel':'hydrogen'].tankIds.length).toBeGreaterThan(0);
});
it('MD02 Ermak D exact old operator mounts, H/E preserve payload and signatures; fuel reference retro bill explicit',()=>{
 const c=loadCandidateCatalog(version),d=getPresetFit('industrial-S:1:D',version),previous=getPresetFit('industrial-S:1','ship-fitting-0.2.4');expect({...d,catalogVersion:previous.catalogVersion}).toEqual(previous);
 for(const code of ['H','E']){const f=getPresetFit('industrial-S:1:'+code,version);for(const slot of ['payload-1','payload-2','signature-1','signature-2','signature-3'])expect(f.instances[f.assignments[slot]]).toEqual(d.instances[d.assignments[slot]]);}
 const f=getPresetFit('severin-mir:2:D',version),retro=f.localVariants[f.instances[f.assignments.retro].itemId],base=c.items['engine-diesel-M-single'];expect(retro.numerics.forceN).toBe(base.numerics.forceN*.4);expect(retro.materials.map(m=>m.massKg)).toEqual(base.materials.map(m=>m.massKg*.4));expect(retro.origins['numerics.forceN'].derivation).toContain('0.4');
});
it('MD03 builtin H₂ + optional tank share actual finite fuel and single dry/C bill, without builtin battery',()=>{
 const c=loadCandidateCatalog(version),f=getPresetFit('civilian-M',version),h=fitHull(f,c)!;expect(h.builtins.map(b=>b.item.family)).toEqual(['cargo','tank']);const builtin=h.builtins.find(b=>b.item.family==='tank')!;expect(builtin.item.numerics.fuelCapacityKg).toBe(4377.0845148);expect(builtin.item.origins['numerics.fuelCapacityKg'].kind).toBe('experimental');expect(builtin.item.origins['numerics.fuelCapacityKg'].derivation).toContain('1.20');expect(builtin.item.materials).toEqual(c.items['tank-hydrogen-M'].materials);expect(builtin.item.gate).toEqual(c.items['tank-hydrogen-M'].gate);
 put(f,'power-3','tank-hydrogen-M');put(f,'signature-2','h2-cooler-M');f.initial.fuelFraction.hydrogen=.00001;const compiled=compileFit(f,c);if(!compiled.ok)throw Error(JSON.stringify(compiled));expect(compiled.value.resources.hydrogen.capacityKg).toBe(4377.0845148+3647.570429);expect(compiled.value.resources.hydrogen.tankIds).toEqual([builtin.id,'fit:power-3']);expect(compiled.value.batteryCapacityJ).toBe(c.items['battery-M'].numerics.capacityJ);
 const spec=makeMiningRun(f,c,{durationSeconds:1,stepSeconds:1,temperatureK:510});if(!spec.ok)throw Error(JSON.stringify(spec));const initial=initialStateV2(spec.value),p=stepV2(spec.value,initial,1,{march:1});expect(p.state.fuelKg.hydrogen).toBe(0);expect(p.state.consumptionKg['hydrogen:generator:fit:power-2']).toBeGreaterThan(0);expect(Object.keys(p.state.consumptionKg).some(k=>k.startsWith('hydrogen:propulsion:'))).toBe(true);expect(Object.values(p.state.consumptionKg).reduce((s,v)=>s+v,0)).toBeCloseTo(initial.fuelKg.hydrogen,10);
 const exhausted=stepV2(spec.value,p.state,1,{march:1});expect(exhausted.state.fuelKg.hydrogen).toBe(0);expect(exhausted.telemetry.generatorW).toBe(0);
});
it('MD02/03 H direct diesel and mixed roles refused, electric hybrid legal; missing battery/tank not runnable',()=>{
 const c=loadCandidateCatalog(version);for(const type of ['hydrogen','electric','diesel']){const f=getPresetFit('civilian-M',version);for(const role of ['march','retro','strafe','turn'])put(f,role,`engine-${type}-M-${['strafe','turn'].includes(role)?'pair':'single'}`);expect(validateFit(f,c).valid).toBe(type!=='diesel');}
 const f=getPresetFit('severin-mir:2:D',version);put(f,'march','engine-electric-M-single');expect(validateFit(f,c).issues.some(i=>i.code==='PROPULSION_TYPE')).toBe(true);
 for(const slot of ['power-1','power-3']){const missing=getPresetFit('severin-mir:2:D',version);delete missing.instances[missing.assignments[slot]];delete missing.assignments[slot];expect(validateFit(missing,c).readiness.canRun).toBe(false);}
 const e=getPresetFit('severin-mir:2:E',version);const overlay=structuredClone(c);overlay.hulls.find(h=>h.id==='severin-mir')!.architecture='E';put(e,'power-3','tank-hydrogen-M');put(e,'power-4','generator-hydrogen-M');expect(validateFit(e,overlay).valid).toBe(true);
});
it('MD04 shared assembly menu and actual/custom/old selection ignore only revision and initial fractions',()=>{
 const c=loadCandidateCatalog(version),options=(factories as any).presetOptions;expect(typeof options).toBe('function');const listed=options(c);expect(listed.filter((x:any)=>['civilian-M','severin-mir','industrial-M','industrial-S'].includes(x.fit.hullId)).map((x:any)=>x.id).sort()).toEqual(assemblies.map(x=>x[0]).sort());
 for(const [id]of assemblies){const f=getPresetFit(id,version);f.fitRevision=88;f.initial.chargeFraction=.5;const w=new FittingWorkspace(f,c,freshMissionConditions(f,c));expect(shipView(w,1440,new Set())).toContain(`value="${id}" selected`);}
 for(const f of [getPresetFit('severin-mir:1',version),getPresetFit('civilian-M:1','ship-fitting-0.2.4')]){const w=new FittingWorkspace(f,c,freshMissionConditions(f,c));expect(shipView(w,1440,new Set())).toContain('value="" selected');}
 expect(()=>getPresetFit('severin-mir:2:X',version)).toThrow(/сборк|тип/i);expect(()=>getPresetFit('civilian-M:2:D',version)).toThrow(/сборк|тип/i);expect(validateFit(getPresetFit('severin-mir:2:H',version),c).readiness.canRun).toBe(true);for(const hull of ['civilian-M','severin-mir','industrial-M'])for(const count of [1,3])expect(validateFit(getPresetFit(`${hull}:${count}`,version),c).readiness.canRun).toBe(true);
});
it('MD05 pre-change .4 complete object/spec/results and all global SKU literal, old edition replay unchanged',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.2.4'),current=loadCandidateCatalog(version);expect(current.items).toEqual(c.items);expect(Object.keys(current.items)).toHaveLength(50);
 for(const row of old.rows){if('catalog'in row){expect(hash(c)).toBe(row.catalog);continue;}if('hull'in row){expect(hash(c.hulls.find(h=>h.id===row.hull))).toBe(row.sha256);continue;}if('error'in row){expect(()=>getPresetFit(row.preset!,'ship-fitting-0.2.4')).toThrow(row.error);continue;}const f=getPresetFit(row.preset!,'ship-fitting-0.2.4'),spec=makeMiningRun(f,c,{durationSeconds:2,stepSeconds:.1});expect(hash(f)).toBe(row.fit);expect(hash(spec)).toBe(row.spec);if(spec.ok){const r=createRun('old:'+row.preset,spec.value);while(!r.done)runChunk(r,100);const measured=result(r);expect(hash(measured)).toBe(row.result);expect(parseExperimentJson(JSON.stringify(spec.value)).ok).toBe(true);expect(parseResultJson(json(measured)).ok).toBe(true);if(['civilian-M','severin-mir'].includes(f.hullId)){const w=new FittingWorkspace(getPresetFit('sputnik',version),current);expect(w.importDocument(json(measured)).ok).toBe(true);expect(json(w.getCurrentResult())).toBe(json(measured));}}}
 expect(parseExperimentJson(JSON.stringify(oldStation.spec)).ok).toBe(true);
});
it('MD05 H fit/run/result roundtrip, forged known hull/builtin/old stamp refusal is atomic',()=>{
 const c=loadCandidateCatalog(version),f=getPresetFit('civilian-M',version),s=makeMiningRun(f,c,{durationSeconds:1,stepSeconds:.1});if(!s.ok)throw Error(JSON.stringify(s));expect(parseFitJson(JSON.stringify(f),c)).toEqual({ok:true,value:f});const run=createRun('new',s.value);while(!run.done)runChunk(run,100);const measured=result(run),w=new FittingWorkspace(f,c);expect(w.importDocument(json(measured)).ok).toBe(true);expect(w.freeze()).toBe(true);const before=w.snapshot();
 for(const change of ['architecture','builtin','stamp']){const bad=structuredClone(s.value);if(change==='architecture')bad.resolvedShip.hull.architecture='E';if(change==='builtin')bad.resolvedShip.hull.builtins.splice(1,1);if(change==='stamp'){bad.catalogVersion='ship-fitting-0.2.4';bad.resolvedShip.fit.catalogVersion='ship-fitting-0.2.4';}expect(parseExperimentJson(json(bad)).ok).toBe(false);expect(w.importDocument(json(bad)).ok).toBe(false);expect(w.snapshot()).toEqual(before);}
});
