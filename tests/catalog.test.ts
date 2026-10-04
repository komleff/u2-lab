import {describe,it,expect} from 'vitest';
import {presets} from '../src/catalog/presets';
import {validateRunSpec} from '../src/catalog/schema';
describe('versioned SI experiments',()=>{
 it('compiles both sourced experimental presets and preserves tiny constants',()=>{for(const p of presets){expect(validateRunSpec(p).ok).toBe(true);expect(p.ship.modules.find(m=>m.kind==='engine')!.alpha).toBe(5.65e-7);expect(p.approvedBaseline).toBe(false);}expect(presets[0].ship.accumulators[0].capacityJ).toBe(3.6825e9)});
 it.each(['stepSeconds','durationSeconds'])('rejects zero %s before running',key=>{const p=structuredClone(presets[0]);(p as any)[key]=0;expect(validateRunSpec(p).ok).toBe(false)});
 it('rejects negative/nonfinite/missing provenance/overfill/species/duplicate environment inputs',()=>{for(const mutate of [(p:any)=>p.initial.temperatureK=-1,(p:any)=>p.ship.heatCapacityJK=Infinity,(p:any)=>delete p.origins['ship.heatCapacityJK'],(p:any)=>p.initial.chargeJ=1e20,(p:any)=>p.ship.modules[0].tankId='missing',(p:any)=>p.environment.directHeat=[{sourceId:'sun',powerW:10},{sourceId:'sun',powerW:20}]]){const p=structuredClone(presets[0]);mutate(p);expect(validateRunSpec(p).ok).toBe(false)}});
});
