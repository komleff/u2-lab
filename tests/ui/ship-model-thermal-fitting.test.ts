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

import {previewShipModelReplacement} from '../../src/app/ship-model-workspace';
import {shipModelSwapDialog} from '../../src/app/fitting-ui/ship-model-swap-dialog';
it('TF06 resource readiness message renders an imported consumer label literally in preview',()=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.4'),f=getPresetFit('sputnik-d',c.version),item=structuredClone(c.items['engine-hydrogen-S-single']);item.id='local-h-engine';item.label='<b data-imported-label>consumer</b>';f.localVariants[item.id]=item;
 const p=previewShipModelReplacement(f,c,{workMode:'stationary'},'retro',item.id);expect(p.ok).toBe(true);expect(p.readinessErrors?.length).toBeGreaterThan(0);
 const html=shipModelSwapDialog(f,c,{workMode:'stationary'},{slotId:'retro',candidate:item.id,query:'',family:'all',size:'all',sort:'name-asc',returnId:'sm-slot-retro'},p);
 expect(html).not.toContain('<b data-imported-label>');expect(html).toContain('&lt;b data-imported-label&gt;consumer&lt;/b&gt;');
});
