import type { ThermalSurface } from './types';
import { exchangeAt, type ThermalField } from './thermal-surfaces';
export type ThermoinverterInput={
  temperatureK:number;backgroundK:number;field:ThermalField|null;surfaces:ThermalSurface[];
  maximumBusPowerW:number;maximumCoolingW:number;copEfficiency:number;driveEfficiency:number;
  evaporatorConductanceWPerK:number;condenserConductanceWPerK:number;maximumHotK:number;
  requestedCoolingW:number;sourceHeatPerBusW:number;
};
export function solveThermoinverter(x:ThermoinverterInput){
  const off=(reason:string,iterations=0)=>({running:false,hotK:x.temperatureK,hotFluidK:x.temperatureK,coolingW:0,compressorW:0,busW:0,netBenefitW:0,iterations,reason});
  if(x.surfaces.length===0||x.requestedCoolingW<=0||x.maximumBusPowerW<=0||x.maximumHotK<=x.temperatureK)return off('unavailable');
  const exchange=(t:number)=>x.surfaces.reduce((n,s)=>n+exchangeAt(s.areaM2,s.emissivity,t,x.backgroundK,x.field).totalW,0);
  const eta=x.copEfficiency,ke=x.evaporatorConductanceWPerK,kc=x.condenserConductanceWPerK;
  const at=(hotK:number)=>{
    // Замкнутые корни ограничений заменяют вложенный итерационный solve.
    const availableW=x.maximumBusPowerW*x.driveEfficiency;
    const a=1/ke+1/kc,b=hotK-x.temperatureK+availableW/kc+eta*availableW/ke;
    const byBus=2*eta*availableW*x.temperatureK/(b+Math.sqrt(b*b+4*a*eta*availableW*x.temperatureK));
    const heatLimit=Math.max(0,kc*(x.maximumHotK-hotK));
    const af=(1-eta)/ke,bf=hotK+heatLimit/kc-x.temperatureK+eta*x.temperatureK+eta*heatLimit/ke;
    const byFluid=heatLimit===0?0:2*eta*heatLimit*x.temperatureK/(bf+Math.sqrt(bf*bf+4*af*eta*heatLimit*x.temperatureK));
    const coolingW=Math.max(0,Math.min(x.requestedCoolingW,x.maximumCoolingW,byBus,byFluid,ke*x.temperatureK*(1-1e-12)));
    const coldFluidK=x.temperatureK-coolingW/ke,ratio=coolingW/(eta*coldFluidK);
    const compressorW=ratio===0?0:ratio*(hotK-coldFluidK+coolingW/kc)/(1-ratio/kc);
    const hotFluidK=hotK+(coolingW+compressorW)/kc;
    return {coolingW,compressorW,hotFluidK,residual:exchange(hotK)-coolingW-compressorW};
  };
  let lo=x.temperatureK,hi=x.maximumHotK;
  if(at(lo).residual>=0)return off('natural-exchange-sufficient');
  if(at(hi).residual<0)return off('hot-side-limit');
  let iterations=0;
  while(iterations<50){const middle=(lo+hi)/2;iterations++;if(at(middle).residual<0)lo=middle;else hi=middle;if(hi-lo<=1e-10*Math.max(1,hi))break;}
  const hotK=(lo+hi)/2,result=at(hotK),busW=result.compressorW/x.driveEfficiency;
  const netBenefitW=result.coolingW-(busW-result.compressorW)-x.sourceHeatPerBusW*busW-exchange(x.temperatureK);
  if(netBenefitW<=0||!Number.isFinite(netBenefitW))return off('no-whole-ship-benefit',iterations);
  return {running:true,hotK,hotFluidK:result.hotFluidK,coolingW:result.coolingW,compressorW:result.compressorW,busW,netBenefitW,iterations,reason:null};
}
