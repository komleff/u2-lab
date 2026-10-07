import {createRun,runChunk,result} from '../../src/runner/run';
import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {fitHull} from '../../src/fitting/editions';
import {compileFit} from '../../src/fitting/compile';
import {validateFit} from '../../src/fitting/validate';
import {makeMiningRun} from '../../src/scenarios/fitting';
import {freshMissionConditions} from '../../src/scenarios/mission';
import {FittingWorkspace} from '../../src/app/fitting-workspace';
import {shipView} from '../../src/app/fitting-ui/ship-view';
import old from './fixtures/catalog-0.2.3-inherited-digests.json';
const edition='ship-fitting-0.2.4' as any;
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const userFiles=[['sputnik','sputnik','58104a35a485e93e94a8cb5a06fada39aa360b9bfb8267df272f800e8c11918c'],['industrial-S','ermak','bf02a939fe2c1acbd4c2db24a95bc94c8adcd752bf64bd2996c2a2e5c7d44a16'],['pony','diesel-pony','702d45e1576a9f1f24aad83833392527c8a886f552e63f67c5e4d049be5e98e0']] as const;
for(const [id,file,sha] of userFiles)it(`CD01 exact operator ${id} assembly and unmodified file bytes`,()=>{
 const raw=readFileSync(`src/fitting/data/default-${file}-0.2.4.json`);expect(createHash('sha256').update(raw).digest('hex')).toBe(sha);
 const source=JSON.parse(raw.toString()),c=loadCandidateCatalog(edition),fit=getPresetFit(id,edition);
 expect({...fit,catalogVersion:source.catalogVersion,fitRevision:source.fitRevision}).toEqual(source);
 const r=compileFit(fit,c);expect(r.ok).toBe(true);if(!r.ok)return;
 expect(r.value.instances.filter(i=>i.enabled&&i.item.family==='mining')).toHaveLength(id==='pony'?2:1);
 expect(r.value.instances.some(i=>i.item.family==='buffer')).toBe(false);
 if(id==='sputnik'){expect(fit.instances[fit.assignments['power-1']].itemId).toBe('battery-XS');expect(fit.instances[fit.assignments['power-2']].itemId).toBe('generator-diesel-XS');}
});
it('CD02 small menu one real assembly; no automatic buffers in fresh other presets; manual multi-laser preserved',()=>{
 const c=loadCandidateCatalog(edition);for(const h of c.hulls){const fit=getPresetFit(h.id,edition),w=new FittingWorkspace(fit,c,freshMissionConditions(fit,c));const html=shipView(w,1440,new Set());
 if(h.size==='S')expect([...html.matchAll(new RegExp('option value="'+h.id+'[^" ]*"','g'))]).toHaveLength(1);
 expect(Object.values(fit.instances).some(i=>i.itemId==='buffer-S')).toBe(false);
 }
 expect(compileFit(getPresetFit('sputnik:2',edition),c).ok).toBe(true);
 expect(getPresetFit('industrial-M:2','ship-fitting-0.2.3').instances['fit:signature-2'].itemId).toBe('buffer-S');
});
it('CD03–05 names, derived Mir, exact per-hull references and inherited E utilities',()=>{
 const c=loadCandidateCatalog(edition);expect(Object.keys(c.items)).toHaveLength(50);
 const rows=[['sputnik','Северин Спутник',250],['pony','Дизельный Пони',225],['industrial-S','Демирмаш Ермак',225],['industrial-M','Демирмаш Титан',200],['industrial-L','Демирмаш Караван',175],['civilian-M','Северин Волна M',225],['severin-mir','Северин Мир',225]] as const;
 for(const [id,label,vfa] of rows){const f=getPresetFit(id,edition),h=fitHull(f,c)!;expect(h.label).toBe(label);expect(h.referenceVfaMS).toBe(vfa);expect(h.origins.referenceVfaMS.kind).toBe('experimental');expect(freshMissionConditions(f,c)).toMatchObject({referenceVfaMS:vfa,cruiseSpeedMS:2*vfa});}
 const mir=c.hulls.find(h=>h.id==='severin-mir')!,volna=c.hulls.find(h=>h.id==='civilian-M')!;expect(mir.architecture).toBe('E');for(const key of ['size','materials','slots','builtins','hullPowerW','hullRadiationM2'] as const)expect(mir[key]).toEqual(volna[key]);expect(mir.origins.profile.note).toContain('производный');
 expect(c.hulls.find(h=>h.id==='pony')!.slots.filter(s=>s.category==='signature')).toHaveLength(1);
 const e=getPresetFit('severin-mir',edition);for(const [slot,itemId] of [['power-2','tank-hydrogen-S'],['power-3','generator-hydrogen-S'],['signature-1','h2-cooler-M']]){const id='fit:'+slot;e.assignments[slot]=id;e.instances[id]={id,itemId,enabled:true};}expect(validateFit(e,c).valid).toBe(true);expect(compileFit(e,c).ok).toBe(true);
 e.instances[e.assignments.march].itemId='engine-diesel-M-single';expect(validateFit(e,c).valid).toBe(false);
});
it('CD05 multiplier follows fresh reference and hull; imported literal/Max/active/frozen are never restamped',()=>{
 const c=loadCandidateCatalog(edition),f=getPresetFit('sputnik',edition),w=new FittingWorkspace(f,c,freshMissionConditions(f,c),2);w.setCruiseMultiplier(2);
 expect(w.setConditions({...w.getSelected().conditions,referenceVfaMS:260})).toBe(true);expect(w.getSelected().conditions.cruiseSpeedMS).toBe(520);
 expect(w.applyPreset('industrial-M:1').valid).toBe(true);expect(w.getSelected().conditions).toMatchObject({referenceVfaMS:200,cruiseSpeedMS:400});
 const active=w.start('immutable');expect(active.ok).toBe(true);const captured=w.getActive();if(!active.ok)throw Error('active');const run=createRun('immutable',active.value.spec);runChunk(run,1);w.acceptResult(result(run,'paused'));w.setStatus('immutable','paused');w.freeze();const frozen=w.getFrozen(),measured=w.getCurrentResult(),paused=w.getActive();w.select('B');w.applyPreset('pony');expect(w.getActive()).toEqual(paused);expect(w.getFrozen()).toEqual(frozen);expect(w.getCurrentResult()).toEqual(measured);
 for(const speed of [null,731,400]){ const literal={...freshMissionConditions(f,c),referenceVfaMS:200,cruiseSpeedMS:speed};w.setCruiseMultiplier(null);w.setConditions(literal);const spec=w.prepare();if(!spec.ok)throw Error('fixture');const fresh=new FittingWorkspace(f,c);expect(fresh.importDocument(JSON.stringify(spec.value)).ok).toBe(true);expect(fresh.applyPreset('industrial-M:1').valid).toBe(true);expect(fresh.getSelected().conditions).toMatchObject({referenceVfaMS:200,cruiseSpeedMS:speed});expect(fresh.setConditions({...fresh.getSelected().conditions,referenceVfaMS:210})).toBe(true);expect(fresh.getSelected().conditions.cruiseSpeedMS).toBe(speed);}
});
it('CD06 every old catalog/fit/numerical spec equals its independent pre-change digest',()=>{
 for(const row of old.rows){const c=loadCandidateCatalog(row.edition as any);if('catalog' in row){expect(hash(c)).toBe(row.catalog);continue;}if('error' in row){expect(()=>getPresetFit(row.preset!,row.edition as any)).toThrow(row.error);continue;}const f=getPresetFit(row.preset!,row.edition as any);expect(hash(f)).toBe(row.fit);expect(hash(makeMiningRun(f,c,{durationSeconds:2,stepSeconds:.1}))).toBe(row.spec);}
});
