import type {DurabilityParameters,StateV3,ResolvedShipV3} from './types';
import {randomV3} from './random';
type ModuleState=StateV3['modules'][string];
export function durabilityFactor(p:DurabilityParameters,m:ModuleState){
  if(p.behavior==='hull'||p.behavior==='armor')return m.durabilityR>0?1:0;
  if(p.behavior==='vital')return m.durabilityR>=0?1:p.emergencyMinimumFraction!;
  if(p.behavior!=='repairable-active')return 1;
  return m.cooldownSeconds>0||m.durabilityStopped||m.durabilityR<=-p.emergencyDepthR||m.durabilityR<0&&!m.firstNegativeCrossing?0:1;
}
export function attemptRestart(p:DurabilityParameters,m:ModuleState,rng:StateV3['rng']){
  if(p.behavior!=='repairable-active'||m.thermalStopped||m.cooldownSeconds>0)return null;
  if(m.durabilityR>=0){m.durabilityStopped=false;return null;}
  if(m.durabilityR<=-p.emergencyDepthR||!m.durabilityStopped||!m.restartAuthorized)return null;
  const succeeded=randomV3(rng)<1-Math.min(1,-m.durabilityR/p.emergencyDepthR);
  m.durabilityStopped=!succeeded;if(succeeded)m.restartAuthorized=false;else m.cooldownSeconds=p.cooldownSeconds;
  return succeeded?'restart-succeeded':'restart-failed';
}
export function durabilityBoundary(p:DurabilityParameters,m:ModuleState,working:number,wearMultiplier:number,interval:number){
  if(p.behavior!=='repairable-active'||working<=0)return null;
  const wear=p.wearPerWorkSecond*wearMultiplier*working;
  if(m.durabilityR>=0&&!m.firstNegativeCrossing&&wear>0&&m.durabilityR-wear*interval<0)return {seconds:m.durabilityR/wear,reason:'first-negative-crossing'};
  if(m.durabilityR<0){
    const failure=Math.max(0,p.failurePeriodSeconds-m.emergencyExposureSeconds),terminal=wear>0?(m.durabilityR+p.emergencyDepthR)/wear:Infinity;
    return terminal>=0&&terminal<=failure?{seconds:terminal,reason:'terminal-durability'}:{seconds:failure,reason:'failure-period'};
  }
  return null;
}
export function advanceDurability(p:DurabilityParameters,m:ModuleState,rng:StateV3['rng'],working:number,wearMultiplier:number,dt:number){
  const before=m.durabilityR;m.cooldownSeconds=Math.max(0,m.cooldownSeconds-dt);
  if(working<=0)return null;
  m.durabilityR-=p.wearPerWorkSecond*wearMultiplier*working*dt;
  if(p.behavior==='hull'||p.behavior==='armor')m.durabilityR=Math.max(0,m.durabilityR);
  if(p.behavior!=='repairable-active')return null;
  if(m.durabilityR<0&&!m.firstNegativeCrossing){m.firstNegativeCrossing=true;m.durabilityStopped=true;m.cooldownSeconds=p.cooldownSeconds;return 'first-negative-crossing';}
  if(before<0)m.emergencyExposureSeconds+=dt;
  if(m.durabilityR<=-p.emergencyDepthR){m.durabilityStopped=true;return 'terminal-durability';}
  if(m.durabilityR<0&&m.emergencyExposureSeconds>=p.failurePeriodSeconds-1e-12){
    m.emergencyExposureSeconds=Math.max(0,m.emergencyExposureSeconds-p.failurePeriodSeconds);
    if(randomV3(rng)<Math.min(1,-m.durabilityR/p.emergencyDepthR)){m.durabilityStopped=true;m.cooldownSeconds=p.cooldownSeconds;return 'emergency-failure';}
  }
  return null;
}
export function stopAtFirstNegative(p:DurabilityParameters,m:ModuleState){
  // Right-hand limit of a crossing inside the interval. An interval ending
  // exactly at zero never reaches this event and remains guaranteed.
  m.durabilityR=Math.min(-Number.MIN_VALUE,m.durabilityR);m.firstNegativeCrossing=true;m.durabilityStopped=true;m.cooldownSeconds=p.cooldownSeconds;
}
export function controlModule(ship:ResolvedShipV3,input:StateV3,id:string,control:'restart'|'repair',durabilityR?:number):StateV3{
  const i=ship.instances.find(i=>i.id===id);if(!i||!input.modules[id])throw new Error('instanceId: неизвестный installed module');
  if(control==='repair'&&(typeof durabilityR!=='number'||!Number.isFinite(durabilityR)||durabilityR<input.modules[id].durabilityR))throw new Error('durabilityR: нужен конечный результат ремонта не ниже текущего R');
  const state=structuredClone(input),m=state.modules[id];
  if(control==='restart'){
    if(i.item.durability.behavior!=='repairable-active'||m.durabilityR<=-i.item.durability.emergencyDepthR)throw new Error('durabilityR: запуск требует ремонтируемой аварийной области');
    if(m.durabilityR<0&&m.durabilityStopped)m.restartAuthorized=true;
  }else{
    m.durabilityR=durabilityR!;if(m.durabilityR>=0){m.firstNegativeCrossing=false;m.durabilityStopped=false;m.restartAuthorized=false;}
  }
  return state;
}
