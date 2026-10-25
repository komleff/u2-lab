import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {compileShipModelFit} from '../../src/model/v3/schema';
import {CURRENT_SHIP_MODEL_CATALOG} from '../../src/model/v3/types';
import {temperatureCorridor,thermalAvailability} from '../../src/model/v3/thermal-control';
import {ShipModelWorkspace} from '../../src/app/ship-model-workspace';

it('fresh catalog 0.3.3 compiles all fourteen presets with the accepted ordinary corridor',()=>{
 expect(CURRENT_SHIP_MODEL_CATALOG).toBe('ship-fitting-0.3.3');
 const c=loadCandidateCatalog(CURRENT_SHIP_MODEL_CATALOG);expect(c.presetOptions).toHaveLength(14);
 for(const {id} of c.presetOptions){
  const built=compileShipModelFit(getPresetFit(id,c.version),c);expect(built.ok,JSON.stringify(built)).toBe(true);if(!built.ok)throw Error(id);
  expect(temperatureCorridor(built.value.instances),id).toEqual({coldK:220,warmK:360,compatible:true});
  const ordinary=built.value.instances.filter(i=>i.item.thermalRole==='ordinary');
  expect(Math.max(...ordinary.map(i=>i.item.gate.low)),id).toBe(200);expect(Math.min(...ordinary.map(i=>i.item.gate.high)),id).toBe(400);
 }
 const old=loadCandidateCatalog(),w=new ShipModelWorkspace(getPresetFit('sputnik',old.version),old);
 expect(w.fit?.catalogVersion).toBe('ship-fitting-0.3.3');expect(w.prepare().catalogVersion).toBe('ship-fitting-0.3.3');
});
it('an installed disabled local ordinary owner still narrows the compiled corridor',()=>{
 const c=loadCandidateCatalog(CURRENT_SHIP_MODEL_CATALOG),fit=getPresetFit('sputnik-d',c.version),instance=fit.instances['fit:payload-2'];
 const item=structuredClone(c.items[instance.itemId]);item.id='disabled-cargo-probe';item.gate={low:200,workLow:230,restartLow:240,workHigh:350,restartHigh:330,high:400};
 for(const key of Object.keys(item.gate))item.origins['gate.'+key]={kind:'experimental',unit:'K',sourceRef:'test:disabled-gate-owner'};
 fit.localVariants[item.id]=item;instance.itemId=item.id;instance.enabled=false;
 const built=compileShipModelFit(fit,c);expect(built.ok,JSON.stringify(built)).toBe(true);if(!built.ok)throw Error('compile');
 expect(temperatureCorridor(built.value.instances)).toEqual({coldK:230,warmK:350,compatible:true});
});
it('new ordinary gates keep nominal work at 230/250 K and derate at 380 K with the existing law',()=>{
 const c=loadCandidateCatalog(CURRENT_SHIP_MODEL_CATALOG),item=c.items['mining-civil-S'];
 const state={durabilityR:1,firstNegativeCrossing:false,emergencyExposureSeconds:0,cooldownSeconds:0,restartAuthorized:false,durabilityStopped:false,thermalStopped:false};
 for(const T of [230,250])expect(thermalAvailability(item,state,T,'Civilian','Efficient').factor).toBe(1);
 expect(thermalAvailability(item,state,380,'Civilian','Efficient').factor).toBe(.5);
 expect(thermalAvailability(item,state,400,'Civilian','Efficient').thermalStopped).toBe(true);
});
