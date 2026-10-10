import type { ModuleItemV3, ResolvedInstanceV3, ShipClass, ShipMode, StateV3 } from "./types";
export type ThermalStage={id:string;setpointK:number;maximumW:number;heatSource?:boolean};
export type CascadeInput={temperatureK:number;heatCapacityJK:number;netHeatW:number;durationSeconds:number;direction:"cooling"|"heating";stages:ThermalStage[]};
export function allocateCascade(x:CascadeInput) {
  const requests=Object.fromEntries(x.stages.map(s=>[s.id,0]));
  const eligible=x.stages.filter(s=>s.maximumW>0&&((x.direction==='heating'||s.heatSource)?x.temperatureK<=s.setpointK:x.temperatureK>=s.setpointK));
  const current=eligible.at(-1);if(!current)return {requests,regulatingStageId:null};
  let residual=x.netHeatW;
  for(const s of eligible.slice(0,-1)){requests[s.id]=s.maximumW;residual+=(x.direction==='heating'||s.heatSource?1:-1)*s.maximumW;}
  const sign=x.direction==='heating'||current.heatSource?1:-1;
  requests[current.id]=Math.max(0,Math.min(current.maximumW,(x.heatCapacityJK*(current.setpointK-x.temperatureK)/x.durationSeconds-residual)/sign));
  return {requests,regulatingStageId:current.id};
}
// Только reference helper: production request определяется allocateCascade, не этой ветвью.
export function referenceCooling(temperatureK:number,setpointK:number,heatW:number,maximumW:number){return temperatureK>setpointK?maximumW:temperatureK===setpointK?Math.max(0,Math.min(maximumW,heatW)):0;}
export function temperatureCorridor(instances:readonly ResolvedInstanceV3[]) {
  const ordinary=instances.filter(i=>i.item.thermalRole==='ordinary');
  const warmK=Math.min(...ordinary.map(i=>i.item.gate.workHigh)),coldK=Math.max(...ordinary.map(i=>i.item.gate.workLow));
  return {warmK,coldK,compatible:Number.isFinite(warmK)&&Number.isFinite(coldK)&&warmK>coldK};
}
export function thermalAvailability(item:ModuleItemV3,state:StateV3['modules'][string],temperatureK:number,hullClass:ShipClass,mode:ShipMode) {
  const g=item.gate,critical=temperatureK>=g.high||temperatureK<=g.low;
  const inRestart=temperatureK>=g.restartLow&&temperatureK<=g.restartHigh;
  const thermalStopped=critical||(state.thermalStopped&&!inRestart);
  const hot=Math.max(0,Math.min(1,(temperatureK-g.workHigh)/(g.high-g.workHigh)));
  const cold=Math.max(0,Math.min(1,(g.workLow-temperatureK)/(g.workLow-g.low)));
  const override=hullClass==='Military'&&mode==='Combat'&&item.durability.behavior!=='passive';
  const temperatureFactor=thermalStopped?0:Math.min(override?1:1-hot,1-cold);
  const conditionBlocked=item.durability.behavior==='repairable-active'&&(state.cooldownSeconds>0||state.durabilityR<=-item.durability.emergencyDepthR||state.durabilityR<0&&(!state.restartAuthorized||!state.firstNegativeCrossing));
  return {thermalStopped,temperatureFactor,factor:conditionBlocked?0:temperatureFactor,wearMultiplier:1+Math.max(hot,cold),reason:thermalStopped?'thermal':conditionBlocked?'durability':null};
}
export function authorizedDuty(item:ModuleItemV3,mode:ShipMode,requested:number) {
  const forbidden=mode==='Masking'&&(['mining','radar','transmitter'].includes(item.family)||item.operationPolicy==='deferrable-background'||item.operationPolicy==='optional-pulse-charge');
  return {duty:forbidden?0:requested,reason:forbidden?'В Masking действие запрещено до построения нагрузки':null};
}
