import type { ThermalSurface } from './types';
export const STEFAN_BOLTZMANN=5.670374419e-8;
export type ThermalField={temperatureK:number;coefficientWPerM2K:number};
export function exchangeAt(areaM2:number,emissivity:number,temperatureK:number,backgroundK:number,field:ThermalField|null){
  // Pin T⁴ to IEEE-754 square-then-square. Integer exponentiation uses a
  // runtime-specific pow path; its ULPs changed literal exports on Node 24.
  const temperatureSquared=temperatureK*temperatureK,backgroundSquared=backgroundK*backgroundK;
  const emittedIrW=STEFAN_BOLTZMANN*emissivity*areaM2*(temperatureSquared*temperatureSquared);
  const absorbedBackgroundW=STEFAN_BOLTZMANN*emissivity*areaM2*(backgroundSquared*backgroundSquared);
  const radiationW=emittedIrW-absorbedBackgroundW;
  const fieldW=field?field.coefficientWPerM2K*areaM2*(temperatureK-field.temperatureK):0;
  return {radiationW,fieldW,totalW:radiationW+fieldW,emittedIrW,absorbedBackgroundW};
}
export function evaluateSurfaces(surfaces:ThermalSurface[],open:Record<string,boolean>,temperatureK:number,backgroundK:number,field:ThermalField|null,circuitTemperatures:Record<string,number>){
  const rows=surfaces.filter(s=>!s.active||open[s.id]).map(s=>{
    const circuitId=s.circuitOwner.kind==='common-ti'?'common-ti':s.circuitOwner.instanceId;
    const surfaceTemperatureK=circuitTemperatures[circuitId]??temperatureK;
    return {surfaceId:s.id,circuitId,temperatureK:surfaceTemperatureK,areaM2:s.areaM2,irProfile:s.irProfile,...exchangeAt(s.areaM2,s.emissivity,surfaceTemperatureK,backgroundK,field)};
  });
  return {rows,areaM2:rows.reduce((n,s)=>n+s.areaM2,0),totalW:rows.reduce((n,s)=>n+s.totalW,0),radiationW:rows.reduce((n,s)=>n+s.radiationW,0),fieldW:rows.reduce((n,s)=>n+s.fieldW,0)};
}
