import { it, expect } from 'vitest';
import { FittingWorkspace } from '../../src/app/fitting-workspace';
import { loadCandidateCatalog, getPresetFit } from '../../src/fitting/catalog';
import { MODEL_MISSION } from '../../src/model/v2/types';
import { createRun, runChunk, result } from '../../src/runner/run';
import { labView, firstLimiter } from '../../src/app/fitting-ui/lab-view';
const c=loadCandidateCatalog();
const conditions={modelVersion:MODEL_MISSION,durationSeconds:20,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:0,targetM3:.001,repeat:false} as const;
it('fresh explicit mission workspace runs tagged physical voyage and restores native result conditions',()=>{
 const w=new FittingWorkspace(getPresetFit('pony:1'),c,conditions);
 const p=w.start('native-mission');expect(p.ok).toBe(true);if(!p.ok)return;
 expect(p.value.spec.modelVersion).toBe(MODEL_MISSION);
 const ctx=createRun(p.value.runId,p.value.spec);while(!ctx.done)runChunk(ctx,1000);const r=result(ctx);expect(w.acceptResult(r)).toBe(true);
 expect(r.state.mission?.deliveredM3).toBeCloseTo(.001,8);
 expect(w.importDocument(JSON.stringify(r,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as any):v)).ok).toBe(true);expect(w.getSelected().conditions.modelVersion).toBe(MODEL_MISSION);
 expect(w.prepare()).toEqual({ok:true,value:r.spec});
 expect(w.setConditions({...w.getSelected().conditions,durationSeconds:40})).toBe(true);const changed=w.prepare();expect(changed.ok).toBe(true);if(changed.ok)expect(changed.value.mission).toEqual(r.spec.mission);
 const html=labView(w,r,{group:'energy',unit:'W',hidden:new Set(),eventIndex:0},'all','');
 expect(html).toContain('Доставлено');expect(html).toContain('До полного трюма');expect(html).not.toContain('не время до полного трюма');
});
it('next mission settings remain atomic and editable on incomplete zero-mining draft without creating readiness',()=>{
 const w=new FittingWorkspace(getPresetFit('sputnik:1'),c,conditions),f=w.getFit();
 const battery=f.assignments['power-1'];delete f.assignments['power-1'];delete f.instances[battery];
 for(const [slot,id] of Object.entries(f.assignments))if(slot.startsWith('payload')){delete f.assignments[slot];delete f.instances[id];}
 expect(w.applyFit(f).valid).toBe(true);expect(w.setConditions({...conditions,temperatureK:310})).toBe(true);
 const before=w.snapshot();expect(w.setConditions({...w.getSelected().conditions,distanceM:-1})).toBe(false);expect(w.snapshot()).toEqual(before);expect(w.start('incomplete').ok).toBe(false);
});
it('propulsion resource constraint is shown before mining starts',()=>{
 const f=getPresetFit('pony:1');f.initial.fuelFraction.diesel=0;const w=new FittingWorkspace(f,c,{...conditions,distanceM:100});const p=w.start('blocked');if(!p.ok)throw Error(JSON.stringify(p));const ctx=createRun('blocked',p.value.spec);while(!ctx.done)runChunk(ctx,100);expect(firstLimiter(result(ctx))).toContain('Ресурс');
});
