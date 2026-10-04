import type {ShipConfig,ModelState,EnvironmentSample,StepResult,TickTelemetry,Module} from './types';
import {capacity} from './types';
import {updateThermalGates} from './thermal-gates';
import {backgroundFraction,thermalDuty} from './scheduler';
export const SIGMA=5.670374419e-8;
export type ActionRequest={moduleId:string;duty:number};
const eps=1e-10;
export function stepModel(ship:ShipConfig,input:ModelState,env:EnvironmentSample,requests:readonly ActionRequest[],dt:number):StepResult{
 if(!(dt>0&&Number.isFinite(dt)))throw new Error('dtSeconds must be finite >0');
 const state={...input,fuelKg:{...input.fuelKg},buffersJ:{...input.buffersJ},gates:{...input.gates},constraints:[] as string[]};const events=updateThermalGates(ship,state);const total:TickTelemetry={};const qmax=capacity(ship);let left=dt,iteration=0;
 const add=(k:string,v:number,h:number)=>total[k]=(total[k]??0)+v*h;
 const allowed=(m:Module)=>thermalDuty(ship,state,m.id);
 while(left>eps){if(++iteration>10000)throw new Error('Unresolved event boundary');
 const live=ship.modules.filter(m=>m.enabled&&!state.gates[m.id]);const req=new Map(requests.map(r=>[r.moduleId,r.duty]));const flows:Record<string,number>={};let chemical=0,genHeat=0,exhaust=0,pathLoss=0,engineHeat=0,thrust=0,engineUseful=0,solarHeat=0,solar=0;
 const tankLive=(m:Module)=>!!m.tankId&&(state.fuelKg[m.tankId]??0)>eps;
 const fuelFlow=(m:Module,flow:number)=>{flows[m.tankId!]=(flows[m.tankId!]??0)+flow};
 const requestedLoads=live.filter(m=>m.kind==='load').map(m=>({m,p:m.powerW*(req.get(m.id)??(m.policy==='Background'?1:0))*allowed(m)}));
 let activeRequest=requestedLoads.filter(x=>x.m.policy!=='Background').reduce((s,x)=>s+x.p,0),bgRequest=requestedLoads.filter(x=>x.m.policy==='Background').reduce((s,x)=>s+x.p,0);
 const coolers=live.filter(m=>['h2','thermoinverter','radiator'].includes(m.kind));const coolingRequests=coolers.map(m=>{let q=0,work=m.auxW;if(m.kind==='h2'&&tankLive(m))q=m.coolingW*allowed(m);if(m.kind==='h2'&&!tankLive(m))work=0;if(m.kind==='thermoinverter'&&m.hotK>state.temperatureK){const cop=m.copEfficiency*state.temperatureK/(m.hotK-state.temperatureK);const rejection=m.areaM2*SIGMA*Math.max(0,m.hotK**4-env.effectiveBackgroundK**4);q=Math.min(m.coolingW,rejection/(1+1/cop))*allowed(m);work=q/cop;}if(m.kind==='radiator')work=m.auxW*allowed(m);return {m,q,work}});
 const coolingRequest=coolingRequests.reduce((s,x)=>s+x.work,0);const demand=ship.hullPowerW+activeRequest+coolingRequest;
 for(const m of live.filter(m=>m.kind==='solar')){const absorbed=m.areaM2*env.solarFluxWm2;solar+=absorbed*m.efficiency;solarHeat+=absorbed*(1-m.efficiency)}
 const generators=live.filter(m=>m.kind==='generator'&&tankLive(m));const genCap=generators.reduce((s,m)=>s+m.powerW*m.pathEfficiency*allowed(m),0);
 const fraction=backgroundFraction(ship,state);const recharge=state.chargeJ<qmax-eps?genCap:0;let genBus=Math.min(genCap,Math.max(0,(demand+(recharge?0:bgRequest*fraction))/ship.dischargeEfficiency/ship.chargeEfficiency+recharge-solar));
 if(state.chargeJ>=qmax-eps)genBus=Math.min(genBus,Math.max(0,(demand+bgRequest*fraction)/ship.dischargeEfficiency/ship.chargeEfficiency-solar));
 const sourceBus=genBus+solar;const available=state.chargeJ>eps?Infinity:sourceBus*ship.chargeEfficiency*ship.dischargeEfficiency;
 const hull=Math.min(ship.hullPowerW,available);const activeRatio=Math.min(1,Math.max(0,(available-hull)/(activeRequest+coolingRequest||1)));const active=activeRequest*activeRatio;const coolingBus=coolingRequest*activeRatio;
 const bg=Math.min(bgRequest*fraction,Math.max(0,sourceBus*ship.chargeEfficiency*ship.dischargeEfficiency-hull-active-coolingBus-recharge*ship.chargeEfficiency*ship.dischargeEfficiency));
 const delivered=hull+active+coolingBus+bg;const withdraw=delivered/ship.dischargeEfficiency;
 // Общий аккумулятор: вход источников и фактический выход всех нагрузок, потери видимы.
 const storedIn=Math.min(sourceBus*ship.chargeEfficiency,state.chargeJ>=qmax-eps?withdraw:Infinity);const curtailed=sourceBus-storedIn/ship.chargeEfficiency;const chargeLoss=storedIn*(1/ship.chargeEfficiency-1),dischargeLoss=withdraw-delivered;let batteryRate=storedIn-withdraw;
 for(const m of generators){const electric=genCap>0?genBus*(m.powerW*m.pathEfficiency*allowed(m)/genCap)/m.pathEfficiency:0;const fuel=electric/m.efficiency;const tank=ship.tanks.find(t=>t.id===m.tankId)!;fuelFlow(m,fuel/tank.energyJKg);chemical+=fuel;const waste=fuel-electric;genHeat+=waste*(1-m.exportFraction);exhaust+=waste*m.exportFraction;pathLoss+=electric*(1-m.pathEfficiency)}
 for(const m of live.filter(m=>m.kind==='engine'&&tankLive(m))){const f=m.forceN*(req.get(m.id)??0)*allowed(m),flow=f*m.alpha,tank=ship.tanks.find(t=>t.id===m.tankId)!;fuelFlow(m,flow);const power=flow*tank.energyJKg;chemical+=power;engineUseful+=power*m.efficiency;engineHeat+=power*(1-m.efficiency)*m.hostFraction;exhaust+=power*(1-m.efficiency)*(1-m.hostFraction);thrust+=f}
 let loadHeat=0,beam=0,workRate=0;for(const {m,p}of requestedLoads){const actual=p*(m.policy==='Background'?(bgRequest?bg/bgRequest:0):activeRatio);loadHeat+=actual*(1-m.efficiency);beam+=actual*m.efficiency;workRate+=actual*m.efficiency*m.workPerJ}
 let h2=0,ti=0,tiReject=0,auxHeat=0,radiatorArea=ship.hullRadiationM2;for(const x of coolingRequests){const ratio=x.work>0?activeRatio:1;if(x.m.kind==='h2'&&tankLive(x.m)){const q=x.q*ratio,aux=x.work*ratio;h2+=q;auxHeat+=aux;fuelFlow(x.m,(q+aux)/x.m.qJKg)}if(x.m.kind==='thermoinverter'){ti+=x.q*ratio;tiReject+=(x.q+x.work)*ratio}if(x.m.kind==='radiator'){radiatorArea+=x.m.areaM2*(x.m.auxW>0?ratio:1);auxHeat+=x.work*ratio}}
 let bufferAbsorb=0,bufferRelease=0;const bufferRates:Record<string,number>={};for(const m of live.filter(m=>m.kind==='buffer')){const q=state.buffersJ[m.id]??0;let rate=state.temperatureK>290&&q<m.capacityJ-eps?m.coolingW:state.temperatureK<280&&q>eps?-m.coolingW:0;bufferRates[m.id]=rate;if(rate>0)bufferAbsorb+=rate;else bufferRelease-=rate}
 const direct=env.directHeat.reduce((s,x)=>s+x.powerW,0);const constantHeat=hull+genHeat+pathLoss+engineHeat+loadHeat+solarHeat+chargeLoss+dischargeLoss+auxHeat+direct-h2-auxHeat-ti-bufferAbsorb+bufferRelease;
 const net=(t:number)=>env.law==='radiative'?radiatorArea*SIGMA*(t**4-env.effectiveBackgroundK**4):env.linearWK*(t-env.effectiveBackgroundK);
 const temperatureAfter=(h:number)=>{const f=(t:number)=>(constantHeat-net(t))/ship.heatCapacityJK;const t=state.temperatureK,k1=f(t),k2=f(t+h*k1/2),k3=f(t+h*k2/2),k4=f(t+h*k3);return t+h*(k1+2*k2+2*k3+k4)/6};
 let h=left;const boundary=(time:number)=>{if(time>eps)h=Math.min(h,time)};
 if(batteryRate<0)boundary(state.chargeJ/-batteryRate);if(batteryRate>0)boundary((qmax-state.chargeJ)/batteryRate);
 for(const [id,flow]of Object.entries(flows)){if(flow>0){boundary(state.fuelKg[id]/flow);if(bg>0){const tank=ship.tanks.find(t=>t.id===id)!;boundary((state.fuelKg[id]-.2*tank.capacityKg)/flow)}}}
 for(const[id,rate]of Object.entries(bufferRates)){const m=ship.modules.find(m=>m.id===id)!;boundary(rate>0?(m.capacityJ-(state.buffersJ[id]??0))/rate:rate<0?(state.buffersJ[id]??0)/-rate:Infinity)}
 const startT=state.temperatureK;const endT=temperatureAfter(h);const thresholds=ship.modules.flatMap(m=>state.gates[m.id]?[m.gate.restartLow,m.gate.restartHigh]:[m.gate.low,m.gate.high,...(bg>0?[m.gate.workHigh-10]:[])]);
 for(const t of thresholds){if((startT<t-eps&&endT>=t)||(startT>t+eps&&endT<=t)){let lo=0,hi=h;for(let i=0;i<40;i++){const mid=(lo+hi)/2,v=temperatureAfter(mid);if((endT>startT&&v<t)||(endT<startT&&v>t))lo=mid;else hi=mid}h=Math.min(h,hi)}}
 if(!(h>eps))h=Math.min(left,1e-8);
 const tNext=Math.max(0,temperatureAfter(h));const thermalDelta=ship.heatCapacityJK*(tNext-startT);const radiationNet=(constantHeat*h-thermalDelta)/h;const radIn=env.law==='radiative'?radiatorArea*SIGMA*env.effectiveBackgroundK**4:Math.max(0,-radiationNet);const radOut=radIn+radiationNet;
 const oldCharge=state.chargeJ;state.chargeJ=Math.max(0,Math.min(qmax,state.chargeJ+batteryRate*h));state.temperatureK=tNext;
 for(const[id,flow]of Object.entries(flows)){state.fuelKg[id]=Math.max(0,state.fuelKg[id]-flow*h);if(state.fuelKg[id]<eps){state.fuelKg[id]=0;events.push({timeSeconds:state.timeSeconds+h,kind:'resource-empty',message:`${id}: запас исчерпан`})}}
 for(const[id,rate]of Object.entries(bufferRates))state.buffersJ[id]=(state.buffersJ[id]??0)+rate*h;
 state.usefulWork+=workRate*h;state.cargo+=workRate*h;state.timeSeconds+=h;left-=h;
 const residual=(chemical+solar+solarHeat+direct+radIn)*h-(state.chargeJ-oldCharge)-thermalDelta-(bufferAbsorb-bufferRelease)*h-(exhaust+engineUseful+beam+radOut+h2+auxHeat+tiReject+curtailed)*h;
 const values={requestedW:demand+bgRequest,deliveredW:delivered,activeRequestedW:activeRequest,activeW:active,protectedW:hull,backgroundRequestedW:bgRequest,backgroundW:bg,generatorW:genBus,solarW:solar,generatorHostW:genHeat,pathLossW:pathLoss,batteryLossW:chargeLoss+dischargeLoss,propulsionHostW:engineHeat,loadHostW:loadHeat,solarHostW:solarHeat,directHeatW:direct,exhaustW:exhaust,beamW:beam,thrustN:thrust,h2CoolingW:h2,tiCoolingW:ti,tiRejectW:tiReject,bufferAbsorbW:bufferAbsorb,bufferReleaseW:bufferRelease,radiationOutW:radOut,radiationInW:radIn,radiationNetW:radiationNet,heatInW:constantHeat+h2+ti+bufferAbsorb-bufferRelease,heatOutW:radOut+h2+ti+bufferAbsorb,workRate,chemicalW:chemical};for(const[k,v]of Object.entries(values))add(k,v,h);total.energyResidualJ=(total.energyResidualJ??0)+residual;
 events.push(...updateThermalGates(ship,state));
 }
 for(const key of Object.keys(total))if(key!=='energyResidualJ')total[key]/=dt;
 total.timeSeconds=state.timeSeconds;total.chargeJ=state.chargeJ;total.soc=state.chargeJ/qmax;total.temperatureK=state.temperatureK;total.usefulWork=state.usefulWork;total.cargo=state.cargo;for(const[id,q]of Object.entries(state.fuelKg))total[`fuelKg:${id}`]=q;for(const[id,q]of Object.entries(state.buffersJ))total[`bufferJ:${id}`]=q;
 if(total.deliveredW<total.requestedW-1e-6)state.constraints.push('Недостаток электропитания / тепловой лимит');if(Object.values(state.gates).some(Boolean))state.constraints.push('Тепловая защита');if(Object.values(state.fuelKg).some(q=>q===0))state.constraints.push('Топливо исчерпано');if(total.backgroundRequestedW>0&&total.backgroundW<total.backgroundRequestedW)state.constraints.push('Background: SoC / топливо / 10 K / свободная мощность');
 const prior=input.constraints.join('|'),now=state.constraints.join('|');if(now!==prior)events.push({timeSeconds:state.timeSeconds,kind:now?'constraint':'recovered',message:now||'Ограничения сняты'});
 return {state,telemetry:total,events};
}
