import {expect,it} from 'vitest';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {validateShipModelFit} from '../../src/model/v3/schema';
const source=loadCandidateCatalog('ship-fitting-0.2.5');
it.each(['mission','stationary'] as const)('TF06 incomplete %s fit can be repaired, while save/start stays source checked',mode=>{
 const w=new ShipModelWorkspace(getPresetFit('sputnik',source.version),source);w.selectWorkMode(mode);
 const before=structuredClone(w.fit);const p=w.previewReplacement('power-3',null);
 expect(p.ok,JSON.stringify(p.errors)).toBe(true);w.applyReplacement();expect(w.fit!.assignments['power-3']).toBeUndefined();
 expect(()=>w.prepare()).toThrow(/diesel/);expect(()=>w.saveFit()).toThrow(/diesel/);
 expect(w.previewReplacement('power-3','tank-diesel-S').ok).toBe(true);w.applyReplacement();expect(w.prepare().catalogVersion).toBe('ship-fitting-0.3.4');expect(w.saveFit().hullId).toBe(before!.hullId);
});
it('TF06 mixed U engines share fuel tanks, Pony/Volna retain architecture refusals',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.4');
 for(const [id,item]of [['pony-d','engine-hydrogen-S-single'],['volna-m-h','engine-diesel-M-single']]){const f=getPresetFit(id,'ship-fitting-0.3.4');f.instances['fit:retro'].itemId=item;expect(validateShipModelFit(f,c).ok).toBe(false);}
});
