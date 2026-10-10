import {fixture} from './fixture';
import {loadCandidateCatalog} from '../../src/fitting/catalog';
import type {RunSpecV3} from '../../src/model/v3/types';
export function runtimeFixture(temperatureK=450){
  const s=fixture('stealth-reference');s.resolvedShip.heatCapacityJK=20e6;s.resolvedShip.hull.hullPowerW=0;s.resolvedShip.hull.bodyExchangeAreaM2=0;s.resolvedShip.surfaces=[];
  for(const i of s.resolvedShip.instances){i.enabled=i.item.family==='battery';i.item.gate={low:100,workLow:200,workHigh:500,high:900,restartLow:210,restartHigh:490};}
  // Изолированная обычная source в рабочей полосе; source-gate cases задают её явно.
  for(const i of s.resolvedShip.instances)if(i.item.family==='battery')i.item.gate.workHigh=800;
  s.initialState.surfaceOpen={};s.initialState.mode='Efficient';s.initialState.maskingEntryTemperatureK=null;s.initialState.temperatureK=temperatureK;return s;
}
export function install(s:RunSpecV3,itemId:string,id=itemId){
  const item=structuredClone(loadCandidateCatalog('ship-fitting-0.3.0').items[itemId]),i={id,item,enabled:true,builtin:false};
  s.resolvedShip.instances.push(i);s.initialState.modules[id]={durabilityR:1,firstNegativeCrossing:false,emergencyExposureSeconds:0,cooldownSeconds:0,restartAuthorized:false,thermalStopped:false};
  if(item.family==='buffer'){s.resolvedShip.bufferCapacityJ[id]=item.numerics.capacityJ;s.initialState.buffers[id]={storedJ:0,minimumCaptureK:null};}
  for(const surface of item.surfaces){const row=structuredClone(surface);row.id=id+':'+row.id;if(row.circuitOwner.kind==='pump-radiator')row.circuitOwner.instanceId=id;s.resolvedShip.surfaces.push(row);s.initialState.surfaceOpen[row.id]=true;}
  return i;
}
