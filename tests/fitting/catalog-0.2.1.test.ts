import { it, expect } from "vitest";
import { loadCandidateCatalog as loadEdition, getPresetFit as editionPreset } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { validateFit } from "../../src/fitting/validate";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
import { makeMiningRun } from "../../src/scenarios/fitting";
import baseItems from "../../src/fitting/data/modules.json";
import baseHulls from "../../src/fitting/data/hulls.json";
import type { ShipFit, CandidateCatalog } from "../../src/fitting/types";
const loadCandidateCatalog = (v: CandidateCatalog["version"] = "ship-fitting-0.2.1") => loadEdition(v);
const getPresetFit = (id: string, v: CandidateCatalog["version"] = "ship-fitting-0.2.1") => editionPreset(id, v);
const mass = (m: { materials: { massKg: number }[] }) => m.materials.reduce((s,b) => s+b.massKg,0);
const install = (f: ShipFit, slot: string, itemId: string) => {
 const id = "fit:"+slot; f.assignments[slot]=id; f.instances[id]={id,itemId,enabled:true};
};
const userFit = () => {
 const f=getPresetFit("industrial-M:2");
 for (const [slot,item] of [["power-1","battery-M"],["power-2","generator-diesel-M"],["power-3","tank-diesel-M"],["power-4","battery-M"],["payload-3","cargo-bulk-M"], ...[1,2,3,4].map(n=>["signature-"+n,"radiator-passive-M"])]) install(f,slot,item);
 return f;
};
it("adds exactly five authored SKUs while preserving all forty source items and six hulls",()=>{
 const c=loadCandidateCatalog(); expect(c.version).toBe("ship-fitting-0.2.1");
 expect(Object.keys(c.items)).toHaveLength(45); expect(c.hulls).toEqual(baseHulls);
 for(const [id,item] of Object.entries(baseItems)) expect(c.items[id]).toEqual(item);
 for(const id of ["engine-diesel-industrial-M-march","engine-diesel-industrial-M-retro","engine-diesel-industrial-M-pair","mining-civil-M","mining-industrial-L"]) expect(c.items[id]?.generationState).toBe("authored");
 for(const [id,power,dry,eta] of [["mining-civil-M",12e6,8800,.5001],["mining-industrial-L",54.4e6,48000,.528093]] as const){
  expect(c.items[id].numerics.powerW).toBe(power);expect(mass(c.items[id])).toBe(dry);expect(c.items[id].numerics.efficiency).toBeCloseTo(eta,12);
  expect(c.items[id].origins["numerics.powerW"].kind).toBe("derived");expect(c.items[id].origins["materials.0.massKg"].derivation).toContain("×4");
 }
});
for(const hull of baseHulls) for(const count of [1,2,3]) it(`matching ${hull.id}:${count} respects actual slots and total builtin count`,()=>{
 const max=hull.slots.filter(s=>s.category==="payload").length+(hull.id==="pony"?1:0);
 if(count>max){expect(()=>getPresetFit(hull.id+":"+count)).toThrow("Число лазеров");return;}
 const c=loadCandidateCatalog(), f=getPresetFit(hull.id+":"+count), r=compileFit(f,c);
 expect(r.ok).toBe(true); if(!r.ok) return;
 const lasers=r.value.instances.filter(i=>i.item.family==="mining");expect(lasers).toHaveLength(count);
 for(const i of lasers){expect(i.item.size).toBe(hull.size);expect(i.item.class).toBe(hull.class);expect(i.item.generation).toBe(hull.generation);}
 if(hull.id==="pony"){
  const builtin=lasers.find(i=>i.builtin)!;
  for(const i of lasers.filter(i=>!i.builtin)){
   expect(f.localVariants[i.item.id]).toEqual(i.item);
   expect(i.item.numerics).toEqual(builtin.item.numerics);expect(i.item.materials).toEqual(builtin.item.materials);
   expect(i.item.origins["numerics.powerW"].note).toContain("локальный");
  }
 }
 if(hull.id==="industrial-L"&&count===3) expect(r.value.cargoCapacityM3.bulk).toBe(192);
});
it("Industrial package uses the exact compact force profile and one bill per installed pair, including cross-fit",()=>{
 const c=loadCandidateCatalog(), r=compileFit(getPresetFit("industrial-M:2"),c); if(!r.ok)throw Error("compile");
 const engines=r.value.instances.filter(i=>i.role), expected=[16228800,6955200,4173120,4173120];
 expect(engines.map(i=>i.item.numerics.forceN)).toEqual(expected);
 expect(engines.map(i=>i.item.class)).toEqual(["Industrial","Industrial","Industrial","Industrial"]);
 expect(engines.reduce((s,i)=>s+mass(i.item),0)).toBeCloseTo(160000,8);
 const total=expected.reduce((a,b)=>a+b,0);
 for(const i of engines){
  expect(mass(i.item)).toBeCloseTo(160000*i.item.numerics.forceN/total,8);
  expect(i.item.numerics.efficiency).toBe(.4);expect(i.item.numerics.alpha).toBe(.565e-6*.32/.4);
  expect(i.item.origins["numerics.efficiency"]).toMatchObject({kind:"experimental",range:[.32,.5]});
  expect(i.item.origins["materials.0.massKg"].derivation).toContain("160000");
  expect(i.item.origins["materials.0.cpJKgK"].kind).toBe("experimental");
 }
 const f=getPresetFit("industrial-L:1");
 for(const role of ["march","retro","strafe","turn"]) install(f,role,engines.find(i=>i.role===role)!.item.id);
 const cross=compileFit(f,c);if(!cross.ok)throw Error("cross");
 expect(cross.value.instances.filter(i=>i.role).map(i=>i.item)).toEqual(engines.map(i=>i.item));
 install(f,"march","engine-diesel-industrial-M-pair");expect(validateFit(f,c).issues.some(i=>i.code==="FORM_FACTOR")).toBe(true);
});
it("actual user assembly and full ore analytical state derive 412245.550477kg dry and 796245.550477kg full",()=>{
 const c=loadCandidateCatalog(), s=makeMiningRun(userFit(),c,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error("fixture");
 const ship=s.value.resolvedShip;expect(ship.dryMassKg).toBeCloseTo(412245.5504768165,7);
 expect(ship.resources.diesel.capacityKg).toBe(24000);expect(ship.cargoCapacityM3).toEqual({universal:48,bulk:192,liquid:0});
 expect(ship.heatCapacityJK).toBeCloseTo(ship.materials.reduce((s,m)=>s+m.massKg*m.cpJKgK,0),6);
 s.value.initial.cargoM3={ore:240};expect(initialStateV2(s.value).currentMassKg).toBeCloseTo(796245.5504768165,7);
});
it("new thrust causes actual species fuel and useful/host/exhaust energy with finite conservation",()=>{
 const c=loadCandidateCatalog(), s=makeMiningRun(userFit(),c,{durationSeconds:2,stepSeconds:1});if(!s.ok)throw Error("fixture");
 const initial=initialStateV2(s.value), r=stepV2(s.value,initial,.1,{march:1});
 const chemical=7.3354176*43e6;
 expect(r.telemetry.thrustN).toBe(16228800);
 expect(r.state.consumptionKg["diesel:propulsion:fit:march"]).toBeCloseTo(7.3354176*.1,10);
 expect(r.telemetry.engineUsefulW).toBeCloseTo(chemical*.4,6);
 expect(r.telemetry.propulsionHostW).toBeCloseTo(chemical*(1-.4)*.7,6);
 expect(Math.abs(r.telemetry.energyResidualJ)).toBeLessThan(.01);
 expect(r.state.currentMassKg).toBeLessThan(initial.currentMassKg);
 expect(r.state.temperatureK).toBeGreaterThan(initial.temperatureK);
});
it("all supported new defaults produce short finite native measurements and actual immutable class inputs",()=>{
 for(const hull of baseHulls) for(const n of [1,2,3].filter(n=>n<=hull.slots.filter(s=>s.category==="payload").length+(hull.id==="pony"?1:0))){
  const f=getPresetFit(hull.id+":"+n), s=makeMiningRun(f,loadCandidateCatalog(),{durationSeconds:5.25,stepSeconds:.25,approachSeconds:1,workSeconds:2,brakingSeconds:1,serviceSeconds:1,idleSeconds:1});
  if(!s.ok)throw Error("fixture");
  let state=initialStateV2(s.value);
  for(let t=0;t<5.25;t+=.25)state=stepV2(s.value,state,.25,t<1?{march:1}:t<3?Object.fromEntries(s.value.selectedWorkGroup.map(id=>[id,1])):t<4?{retro:1}:{}).state;
  expect(state.timeSeconds).toBe(5.25);expect(state.usefulWork).toBeGreaterThan(0);
  expect(Number.isFinite(state.temperatureK)).toBe(true);expect(state.currentMassKg).toBeGreaterThan(0);
 }
});
it("rejects unsupported catalog loader/preset editions rather than manufacturing a future inventory",()=>{
 expect(()=>loadCandidateCatalog("ship-fitting-future-test" as any)).toThrow("Неизвестная версия каталога");
 expect(()=>getPresetFit("industrial-M:2","ship-fitting-future-test" as any)).toThrow("Неизвестная версия каталога");
});
