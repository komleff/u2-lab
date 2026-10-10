import type {RunSpecV3,IrProfile} from '../model/v3/types';
import type {stepV3} from '../model/v3/step';
import {lambertGain} from './projection';
import {receivedFlux,observerPreset,type ObserverPresetId} from './presets';
export const SHIP_SIGNATURE_VERSION='ship-signatures/1' as const;
export type ShipSignalPath={id:string;kind:'body'|'radiator'|'engine'|'generator'|'h2';absoluteIrW:number;contrastW:number;projectedContrastW:number;temperatureK:number|null;profile:IrProfile};
export type ShipSignal={timeSeconds:number;intrinsicIrW:number;contrastIrW:number;receiverIrW:number;rawEmW:number;escapedEmW:number;capturedEmW:number;observedEmW:number;irFluxWm2:number;emFluxWm2:number;ownAntennaTransmission:number;ownSensorWorkingW:number;paths:ShipSignalPath[]};
const omni:IrProfile={version:'radiator-ir/1',kind:'omnidirectional',aftFraction:0};
const aft:IrProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:1};
// Projection only: all source/escaped/retained watts already belong to the kernel.
export function observeShipModelStep(spec:RunSpecV3,step:ReturnType<typeof stepV3>):ShipSignal{
  const paths=new Map<string,ShipSignalPath>();let rawEmW=0,escapedEmW=0,capturedEmW=0,observedEmW=0,ownAntennaTransmission=0,ownSensorWorkingW=0;
  const add=(id:string,kind:ShipSignalPath['kind'],absoluteIrW:number,contrastW:number,temperatureK:number|null,profile:IrProfile,dt:number)=>{
    const gain=(1-profile.aftFraction)+profile.aftFraction*lambertGain(spec.observer.aspectDeg-180),old=paths.get(id);
    if(old){old.absoluteIrW+=absoluteIrW*dt;old.contrastW+=contrastW*dt;old.projectedContrastW+=contrastW*gain*dt;}
    else paths.set(id,{id,kind,absoluteIrW:absoluteIrW*dt,contrastW:contrastW*dt,projectedContrastW:contrastW*gain*dt,temperatureK,profile:structuredClone(profile)});
  };
  for(const f of step.frames){const dt=f.durationSeconds;add('body','body',f.body.emittedIrW,f.body.radiationW,null,omni,dt);
    for(const row of f.surfaces.rows)add(row.surfaceId,'radiator',row.emittedIrW,row.radiationW,row.temperatureK,row.irProfile,dt);
    for(const row of f.outwardIr)add(row.id,row.kind,row.absoluteIrW,row.contrastW,null,row.profile==='aft-directed'?aft:omni,dt);
    rawEmW+=f.em.rawEmW*dt;escapedEmW+=f.em.escapedEmW*dt;capturedEmW+=f.em.capturedEmW*dt;observedEmW+=(f.em.escapedEmW+f.em.intentionalRfW)*dt;ownAntennaTransmission+=f.ownAntennaTransmission*dt;ownSensorWorkingW+=f.ownSensorWorkingW*dt;
  }
  const rows=[...paths.values()],intrinsicIrW=rows.reduce((sum,p)=>sum+p.absoluteIrW,0),contrastIrW=rows.reduce((sum,p)=>sum+p.projectedContrastW,0),receiverIrW=spec.receiverProfile==='absolute-contrast'?Math.abs(contrastIrW):Math.max(0,contrastIrW);
  return {timeSeconds:step.state.timeSeconds,intrinsicIrW,contrastIrW,receiverIrW,rawEmW,escapedEmW,capturedEmW,observedEmW,irFluxWm2:receivedFlux(receiverIrW,spec.observer.rangeM),emFluxWm2:receivedFlux(observedEmW,spec.observer.rangeM),ownAntennaTransmission,ownSensorWorkingW,paths:rows};
}
export function controlTargetView(spec:RunSpecV3,signal:ShipSignal,target:{irW:number;emW:number}){
  if(!Number.isFinite(target.irW)||!Number.isFinite(target.emW)||target.emW<0)throw Error('Нужен конечный явный control target');
  const preset=observerPreset(spec.observer.presetId as ObserverPresetId),powered=signal.ownSensorWorkingW>0,irFluxWm2=powered?receivedFlux(spec.receiverProfile==='absolute-contrast'?Math.abs(target.irW):Math.max(0,target.irW),spec.observer.rangeM):0,emFluxWm2=powered?receivedFlux(target.emW,spec.observer.rangeM)*signal.ownAntennaTransmission:0;
  return {irFluxWm2,emFluxWm2,irVisible:irFluxWm2>=preset.ir.detectWm2,emVisible:emFluxWm2>=preset.em.detectWm2,powered,scope:'lab-control-target-reference' as const};
}
