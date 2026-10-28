import {expect,it} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {compileShipModelFit,validateShipModelFit} from '../../src/model/v3/schema';
import {CURRENT_SHIP_MODEL_CATALOG,type ShipModelCatalogVersion} from '../../src/model/v3/types';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
const version='ship-fitting-0.3.4' as ShipModelCatalogVersion;
const ordinary={low:200,workLow:220,restartLow:230,workHigh:500,restartHigh:480,high:550};
const tank={low:150,workLow:200,restartLow:180,workHigh:500,restartHigh:550,high:570};
it('TF01/03/04 current fourteen mining fits carry accepted physical parameters without rewriting 0.3.3',()=>{
 expect(CURRENT_SHIP_MODEL_CATALOG).toBe(version);
 const c=loadCandidateCatalog(version),old=loadCandidateCatalog('ship-fitting-0.3.3');
 expect(c.presetOptions).toEqual(old.presetOptions);expect(c.hulls).toHaveLength(7);
 for(const h of c.hulls){const before=old.hulls.find(x=>x.id===h.id)!;expect(h.slots.map(s=>({...s,families:[]}))).toEqual(before.slots.map(s=>({...s,families:[]})));expect(h.hullPassiveRadiator).toEqual(before.hullPassiveRadiator);}
 for(const {id} of c.presetOptions){const f=getPresetFit(id,version),r=compileShipModelFit(f,c);expect(r.ok,JSON.stringify(r)).toBe(true);if(!r.ok)throw Error(id);
  for(const i of r.value.instances){if(i.item.thermalRole==='ordinary')expect(i.item.gate).toEqual(i.item.family==='tank'&&i.item.species==='diesel'?tank:ordinary);if(i.item.family==='engine'&&i.item.propulsionType==='diesel')expect(i.item.numerics.hostFraction).toBe(.4);if(i.item.family==='engine')expect(i.item.durability.wearPerWorkSecond).toBe(1e-6);}
  expect(makeShipModelMissionRun(f,c,id==='stealth-reference'?{referenceVfaMS:225}:{}).ok,id).toBe(true);
 }
 for(const [size,A,m,C] of [['S',490,750,334900],['M',1960,3000,1339600]] as const){const i=c.items['radiator-passive-'+size];expect(i.surfaces[0].areaM2).toBe(A);expect(i.surfaces[0].emissivity).toBe(.9);expect(i.materials.reduce((n,x)=>n+x.massKg,0)).toBe(m);expect(i.materials.reduce((n,x)=>n+x.massKg*x.cpJKgK,0)).toBe(C);}
 const pony=c.hulls.find(h=>h.id==='pony')!;expect(pony.class).toBe('Industrial');expect(pony.materials.reduce((n,x)=>n+x.massKg,0)).toBe(31500);expect(pony).toMatchObject({manufacturer:'UNKNOWN',national:'UNKNOWN',generation:0});
 const pf=getPresetFit('pony-d',version),of=getPresetFit('pony-d','ship-fitting-0.3.3');
 for(const [id,item] of Object.entries(pf.localVariants))if(item.family==='engine'){const {hostFraction,...rest}=item.numerics;const {hostFraction:_,...before}=of.localVariants[id].numerics;expect(rest).toEqual(before);expect(item.class).toBe('Industrial');}
 for(const [name,hash] of Object.entries({hulls:'ca7f84b309a1a3e165ac4e266181197ad5e17150e805854d949751242c68f79a',items:'522fb15c6dea6af7cb9df8e9b66f0e455977b82c8bf6bde9c78fe3395049049b',presets:'8d9f4f5b10457c5693ffed37cabc0a69637d6d5114045557658afc0762da17a5','preset-manifest':'cd23263d57a5a3b6e06e8860d0bed2abd8082fc105ed8392a7509d4c61c7f777'}))expect(createHash('sha256').update(readFileSync(`src/fitting/data/${name}-0.3.3.json`)).digest('hex')).toBe(hash);
});
it('TF05/06 mixed physical mounting is editable and runnable sources identify each consumer',()=>{
 const c=loadCandidateCatalog(version),f=getPresetFit('sputnik-d',version);
 f.instances['fit:retro'].itemId='engine-hydrogen-S-single';delete f.localVariants['reference-retro-engine-diesel-S-single'];
 expect(validateShipModelFit(f,c).ok).toBe(true);
 const missing=validateShipModelFit(f,c,true);expect(missing.ok).toBe(false);if(missing.ok)throw Error('missing');expect(missing.errors.some(e=>e.code==='MISSING_SOURCE'&&e.path.includes('fit:retro')&&e.message.includes('hydrogen'))).toBe(true);
 f.assignments['power-2']='fit:power-2';f.instances['fit:power-2']={id:'fit:power-2',itemId:'tank-hydrogen-S',enabled:true};expect(validateShipModelFit(f,c,true).ok).toBe(true);
 f.initial.fuelFraction={diesel:0,hydrogen:0};expect(validateShipModelFit(f,c,true).ok).toBe(true);
});
it('TF05 all seven hulls accept exactly physical family/size/form/architecture candidates, including both furnaces and turn gyrodyne',()=>{
 const c=loadCandidateCatalog(version),size=['XS','S','M','L','XL'];let checks=0;
 const base:Record<string,string>={sputnik:'sputnik-d','severin-mir':'severin-mir-d',pony:'pony-d','industrial-S':'ermak-d','civilian-M':'volna-m-h','industrial-M':'titan-d','stealth-reference':'stealth-reference'};
 for(const h of c.hulls)for(const slot of h.slots)for(const item of Object.values(c.items)){
  if(!['sensors-thermal','propulsion'].includes(slot.category))continue;
  const f=getPresetFit(base[h.id],version),id=f.assignments[slot.id]??'fit:'+slot.id;f.assignments[slot.id]=id;f.instances[id]={id,itemId:item.id,enabled:true};
  const physical=item.category===slot.category&&slot.families.includes(item.family)&&item.formFactor===slot.formFactor&&size.indexOf(item.size)<=size.indexOf(slot.size);
  const architecture=item.family!=='engine'||h.architecture==='U'||(['E','A'].includes(h.architecture)?item.propulsionType==='electric':['electric',h.architecture==='D'?'diesel':'hydrogen'].includes(item.propulsionType!));
  expect(validateShipModelFit(f,c).ok,`${h.id}/${slot.id}/${item.id}`).toBe(physical&&architecture);checks++;
 }
 expect(checks).toBeGreaterThan(1000);
 for(const id of ['pony','industrial-S','civilian-M','industrial-M']){const h=c.hulls.find(x=>x.id===id)!;expect(h.slots.find(s=>s.role==='turn')!.families).toContain('gyrodyne');for(const family of ['electric-heater','furnace','pump-radiator','shielding','sensor'])expect(h.slots.filter(s=>s.category==='sensors-thermal').every(s=>s.families.includes(family as never))).toBe(true);}
});

import {thermalAvailability} from '../../src/model/v3/thermal-control';
it('TF03 ordinary safe restart equality and diesel tank exception retain separate hysteresis',()=>{
 const c=loadCandidateCatalog(version),normal=c.items['mining-civil-S'],special=c.items['tank-diesel-S'];
 const m={durabilityR:1,firstNegativeCrossing:false,emergencyExposureSeconds:0,cooldownSeconds:0,restartAuthorized:false,durabilityStopped:false,thermalStopped:true};
 for(const [i,lo,hi]of [[normal,230,480],[special,180,550]]as const){expect(thermalAvailability(i,m,lo,'Civilian','Efficient').thermalStopped).toBe(false);expect(thermalAvailability(i,m,lo-.01,'Civilian','Efficient').thermalStopped).toBe(true);expect(thermalAvailability(i,m,hi,'Civilian','Efficient').thermalStopped).toBe(false);expect(thermalAvailability(i,m,hi+.01,'Civilian','Efficient').thermalStopped).toBe(true);}
});
