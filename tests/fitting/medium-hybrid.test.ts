import { it, expect } from "vitest";
import { getPresetFit,loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { initialStateV2,stepV2 } from "../../src/model/v2/step";
import { parseFitJson,serializeFit,parseExperimentJson } from "../../src/io/fitting-json";
const version="ship-fitting-0.2.3" as const;
const mounts=(f:ReturnType<typeof getPresetFit>,rows:Record<string,string>)=>{for(const [slot,itemId] of Object.entries(rows)){const id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};}return f;};
const expected={
 'radiator-active-M':{mass:5400,g:2,n:{areaM2:3528,auxW:1200000}},
 'buffer-M':{mass:20000,g:1,n:{capacityJ:8e9,coolingW:80e6,absorbAboveK:290,releaseBelowK:280}},
 'h2-cooler-M':{mass:3400,g:2,n:{coolingW:80e6,auxW:200000,qJKg:10e6}},
 'thermoinverter-M':{mass:3800,g:4,n:{coolingW:80e6,hotK:800,areaM2:1764,copEfficiency:.5}},
 'solar-M':{mass:4000,g:1,n:{areaM2:400,efficiency:.25}},
};
it('MF01 exact five new M candidates and old forty-five immutable; extensive scaling leaves cp/gates/efficiencies intensive',()=>{
 const c=loadCandidateCatalog(version),old=loadCandidateCatalog('ship-fitting-0.2.2');expect(Object.keys(c.items)).toHaveLength(50);
 for(const [id,item]of Object.entries(old.items))expect(c.items[id]).toEqual(item);
 for(const [id,row]of Object.entries(expected)){const item=c.items[id];expect(item.numerics).toEqual(row.n);expect(item.materials.reduce((n,m)=>n+m.massKg,0)).toBe(row.mass);expect(item.materials[0].cpJKgK).toBe(470);expect(item.class).toBe('Civilian');expect(item.generation).toBe(row.g);expect(item.gate).toEqual(old.items[id.replace(/-M$/,'-S')].gate);for(const k of Object.keys(row.n)){expect(item.origins['numerics.'+k].sourceRef).toContain('MF-01');expect(item.origins['numerics.'+k].unit).toBeTruthy();}}
 expect(c.hulls.find(h=>h.id==='pony')!.slots.filter(s=>s.category==='signature')).toHaveLength(1);
});
it('MF02 actual installed bill/C counts M items once and larger signature exceeds Pony slot',()=>{
 const c=loadCandidateCatalog(version),f=mounts(getPresetFit('civilian-M:1',version),{'power-1':'solar-M','signature-1':'buffer-M','signature-2':'thermoinverter-M','signature-3':'radiator-active-M'});
 const r=compileFit(f,c);expect(r.ok).toBe(true);if(!r.ok)throw Error('compile');
 expect(r.value.dryMassKg).toBeCloseTo(r.value.materials.reduce((n,m)=>n+m.massKg,0),8);expect(r.value.heatCapacityJK).toBeCloseTo(r.value.materials.reduce((n,m)=>n+m.massKg*m.cpJKgK,0),8);
 expect(r.value.bufferCapacityJ['fit:signature-1']).toBe(8e9);
 const pony=mounts(getPresetFit('pony:1',version),{'signature-1':'buffer-M'});expect(validateFit(pony,c).issues.some(i=>i.code==='SIZE')).toBe(true);
});
it('MF03 old inventory/stamps fail closed for new globals while explicit authored M local variant still opens',()=>{
 const c=loadCandidateCatalog(version);
 for(const v of ['ship-fitting-0.2.0','ship-fitting-0.2.1','ship-fitting-0.2.2'] as const){
  const f=mounts(getPresetFit('industrial-M:1',v),{'signature-1':'buffer-M'});expect(parseFitJson(serializeFit(f),c).ok).toBe(false);
  f.localVariants['buffer-M']=structuredClone(c.items['buffer-M']);expect(parseFitJson(serializeFit(f),c).ok).toBe(true);
  const run=makeMiningRun(f,c,{durationSeconds:1,stepSeconds:.1});expect(run.ok).toBe(true);if(run.ok)expect(parseExperimentJson(JSON.stringify(run.value)).ok).toBe(true);
 }
});
it('HY01 new E supports utility circuits while all four electric propulsion roles remain homogeneous; old E and A do not expand',()=>{
 const c=loadCandidateCatalog(version);
 const utility={'power-1':'generator-diesel-M','power-2':'tank-diesel-M','power-3':'tank-hydrogen-M','signature-1':'h2-cooler-M'};
 const f=mounts(getPresetFit('civilian-M:1',version),utility);expect(validateFit(f,c).readiness.canRun).toBe(true);
 const mixed=structuredClone(f);mixed.instances[mixed.assignments.march].itemId='engine-diesel-M-single';expect(validateFit(mixed,c).issues.some(i=>i.code==='ARCHITECTURE')).toBe(true);
 for(const v of ['ship-fitting-0.2.0','ship-fitting-0.2.1','ship-fitting-0.2.2'] as const)expect(validateFit(mounts(getPresetFit('civilian-M:1',v),utility),c).valid).toBe(false);
});
for(const generator of ['diesel','hydrogen'] as const)it(`HY02 E+${generator} generator/tank and shared finite H₂ cooler: actual species/purpose draw, no chemical electric engines`,()=>{
 const c=loadCandidateCatalog(version),f=mounts(getPresetFit('civilian-M:1',version),{'power-1':`generator-${generator}-M`,'power-2':`tank-${generator}-M`,'power-3':'tank-hydrogen-M','signature-1':'h2-cooler-M'});
 if(generator==='hydrogen'){delete f.instances[f.assignments['power-3']];delete f.assignments['power-3'];}
 f.initial.fuelFraction.hydrogen=.000001;
 const s=makeMiningRun(f,c,{durationSeconds:10,stepSeconds:1,temperatureK:400});if(!s.ok)throw Error(JSON.stringify(s));
 const start=initialStateV2(s.value),step=stepV2(s.value,start,1,{march:1,[s.value.selectedWorkGroup[0]]:1});
 expect(step.telemetry.h2CoolingW).toBeGreaterThan(0);expect(step.state.fuelKg.hydrogen).toBe(0);expect(step.state.consumptionKg['hydrogen:cooler:fit:signature-1']).toBeGreaterThan(0);expect(step.state.consumptionKg[`${generator}:generator:fit:power-1`]).toBeGreaterThan(0);
 expect(Object.keys(step.state.consumptionKg).some(k=>k.includes(':propulsion:'))).toBe(false);
 const next=stepV2(s.value,step.state,1,{});expect(next.telemetry.h2CoolingW).toBe(0);
 if(generator==='hydrogen')expect(next.telemetry.generatorW).toBe(0);else expect(next.telemetry.generatorW).toBeGreaterThan(0);
 expect(start.fuelKg.hydrogen).toBeCloseTo(Object.entries(step.state.consumptionKg).filter(([k])=>k.startsWith('hydrogen:')).reduce((n,[,v])=>n+v,0),10);
});
it('HY02 D propulsion keeps separate auxiliary H₂ circuit; without cryotank readiness remains incomplete',()=>{
 const c=loadCandidateCatalog(version),f=mounts(getPresetFit('pony:1',version),{'signature-1':'h2-cooler-S'});
 expect(validateFit(f,c).readiness.canRun).toBe(false);mounts(f,{'power-3':'tank-hydrogen-S'});expect(validateFit(f,c).readiness.canRun).toBe(true);
 const s=makeMiningRun(f,c,{durationSeconds:1,stepSeconds:1,temperatureK:400});if(!s.ok)throw Error(JSON.stringify(s));
 const p=stepV2(s.value,initialStateV2(s.value),1,{march:1});expect(p.state.consumptionKg['diesel:propulsion:fit:march']).toBeGreaterThan(0);expect(p.state.consumptionKg['hydrogen:cooler:fit:signature-1']).toBeGreaterThan(0);expect(p.state.consumptionKg['hydrogen:propulsion:fit:march']).toBeUndefined();
});
it('MF04/HY02 compound M mining/cooling/hybrid mission exports its exhausted shared H2 stock without normalization',async()=>{
 const {makeMissionRun}=await import('../../src/scenarios/mission');const {createRun,runChunk,result}=await import('../../src/runner/run');const {parseResultJson}=await import('../../src/io/fitting-result');
 const c=loadCandidateCatalog(version),f=mounts(getPresetFit('civilian-M:2',version),{'power-1':'battery-M','power-2':'generator-hydrogen-M','power-3':'tank-hydrogen-M','signature-1':'h2-cooler-M','signature-2':'radiator-active-M','signature-3':'thermoinverter-M'});f.initial.fuelFraction.hydrogen=.000001;
 const s=makeMissionRun(f,c,{durationSeconds:2,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:10,targetM3:.01,repeat:false,temperatureK:400});if(!s.ok)throw Error(JSON.stringify(s));const r=createRun('Mcompound',s.value);while(!r.done)runChunk(r,100);const native=result(r);
 expect(native.state.usefulWork).toBeGreaterThan(0);expect(native.state.fuelKg.hydrogen).toBe(0);expect(native.metrics.h2CoolerKg).toBeGreaterThan(0);expect(native.metrics.fuelPurposeKg['hydrogen:generator']).toBeGreaterThan(0);expect(native.metrics.fuelPurposeKg['hydrogen:propulsion']).toBe(0);
 const text=JSON.stringify(native,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v),p=parseResultJson(text);expect(p.ok,p.ok?'':JSON.stringify(p.errors)).toBe(true);if(p.ok)expect(JSON.stringify(p.value,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v)).toBe(text);
});
