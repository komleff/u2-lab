import {stepMissionV2} from './ship-model-flight-v2';
import {stepStationService} from '../model/v3/station-service';
import {stepV3Interval,type StepDiagnostic} from '../model/v3/step';
import type {RunSpecV3,StateV3,MissionStateV3} from '../model/v3/types';
import type {TickTelemetry,LabEvent} from '../model/types';
import {advanceFlight,stoppingDistance} from '../model/v2/flight';
type Interval=ReturnType<typeof stepV3Interval>;
export function missionMassKg(spec:RunSpecV3,state:StateV3){return spec.resolvedShip.dryMassKg+state.fuelKg.diesel+state.fuelKg.hydrogen+state.mission!.onboardM3*spec.mission!.process.densityKgM3;}
// Временные preview начинают от одного state; только commit переносит физику и RNG.
export function stepShipModelMission(spec:RunSpecV3,input:StateV3){
 if(spec.mission?.version==='ship-mission/2')return stepMissionV2(spec,input);
 const cfg=spec.mission!,ship=spec.resolvedShip,end=Math.min(spec.durationSeconds,input.timeSeconds+1),telemetry:TickTelemetry={},frames:Interval['frames']=[],diagnostics:StepDiagnostic[]=[],events:LabEvent[]=[];
 let state=structuredClone(input),zeroTransitions=0;
 const event=(kind:string,message:string)=>events.push({timeSeconds:state.timeSeconds,kind,message});
 const transition=(stage:MissionStateV3['stage'])=>{state.mission!.stage=stage;state.mission!.stageElapsedSeconds=0;event('mission-stage',stage);};
 const requests=(role:string,duty=1)=>Object.fromEntries(ship.instances.filter(i=>i.item.family==='engine'&&i.role===role).map(i=>[i.id,duty]));
 const trial=(dt:number,req:Record<string,number>,action:'idle'|'work'|'maneuver')=>stepV3Interval(spec,state,req,action,dt,action==='work'?cfg.process:undefined);
 const bisect=(dt:number,beyond:(dt:number)=>boolean)=>{let lo=0,hi=dt;while(hi-lo>1e-7){const mid=(lo+hi)/2;if(beyond(mid))hi=mid;else lo=mid;}return hi;};
 const commit=(step:Interval)=>{const dt=step.state.timeSeconds-state.timeSeconds;state=step.state;state.mission!.stageElapsedSeconds+=dt;frames.push(...step.frames);diagnostics.push(...step.diagnostics);for(const[k,v]of Object.entries(step.telemetry))if(!['temperatureK','chargeJ'].includes(k)&&!k.startsWith('bufferJ:'))telemetry[k]=(telemetry[k]??0)+v;};
 while(state.timeSeconds<end-1e-10&&state.mission!.stage!=='complete'){
  const m=state.mission!,beforeTime=state.timeSeconds;let dt=end-state.timeSeconds;
  if(m.stage==='outbound'||m.stage==='inbound'){
   const target=m.stage==='outbound'?cfg.route.distanceM:0,remaining=target-m.positionM,sign=remaining>=0?1:-1,speed=Math.abs(m.velocityMS);
   if(Math.abs(remaining)<=1e-3&&speed<=1e-4){m.positionM=target;m.velocityMS=0;event('mission-arrival',`${m.stage}: x=${target} m, v=0 m/s`);transition(m.stage==='outbound'?'approach':'service');}
   else{
    const accelerator=sign>0?'march':'retro',brake=sign>0?'retro':'march',brakeStep=trial(dt,requests(brake),'maneuver'),brakeForce=(brakeStep.telemetry['impulseNs:'+brake]??0)/dt,mass=missionMassKg(spec,state),stop=brakeForce>0?stoppingDistance(speed,mass,brakeForce):Infinity;
    const away=m.velocityMS*sign<0;
    let role:string|undefined,forceSign=0;
    if(away&&speed>1e-8){role=m.velocityMS>0?'retro':'march';forceSign=m.velocityMS>0?-1:1;}
    else if(speed>1e-8&&stop>=Math.abs(remaining)-1e-4){role=brake;forceSign=-sign;}
    else if(speed<cfg.route.cruiseSpeedMS-1e-5){role=accelerator;forceSign=sign;}
    const req=role?requests(role):{},project=(h:number)=>{const step=trial(h,req,'maneuver'),massKg=(mass+missionMassKg(spec,step.state))/2,force=role?forceSign*(step.telemetry['impulseNs:'+role]??0)/h:0;return {step,move:advanceFlight(m,massKg,force,h)};};
    if(role===accelerator&&!away){const beyond=(h:number)=>{const p=project(h);return Math.abs(p.move.velocityMS)>=cfg.route.cruiseSpeedMS||brakeForce>0&&Math.abs(target-p.move.positionM)<=stoppingDistance(p.move.velocityMS,missionMassKg(spec,p.step.state),brakeForce);};if(beyond(dt)){const limit=bisect(dt,beyond);if(limit>1e-6)dt=limit;}}
    else if(!role&&speed>0&&brakeForce>0){const until=(Math.abs(remaining)-stop)/speed;if(until>1e-6&&until<dt)dt=until;}
    if(role&&forceSign*m.velocityMS<0&&project(dt).move.velocityMS*m.velocityMS<0)dt=bisect(dt,h=>project(h).move.velocityMS*m.velocityMS<=0);
    const p=project(dt);commit(p.step);state.mission!.positionM=p.move.positionM;state.mission!.velocityMS=Math.abs(p.move.velocityMS)<1e-4?0:p.move.velocityMS;
    // Ошибка корня ограничена точностью времени; не переносим корабль до остановки.
    if(Math.abs(target-state.mission!.positionM)<=1e-3&&state.mission!.velocityMS===0){state.mission!.positionM=target;event('mission-arrival',`${m.stage}: x=${target} m, v=0 m/s`);transition(m.stage==='outbound'?'approach':'service');}
   }
  }else if(m.stage==='approach'||m.stage==='service'){
   const duration=m.stage==='approach'?cfg.approachSeconds:cfg.serviceSeconds,left=duration-m.stageElapsedSeconds;
   if(left>1e-10){dt=Math.min(dt,left);commit(m.stage==='service'&&spec.catalogVersion==='ship-fitting-0.3.4'?stepStationService(spec,state,dt):trial(dt,{},'idle'));}
   if(state.mission!.stageElapsedSeconds>=duration-1e-9){
    if(m.stage==='approach')transition('mining');
    else{
     const current=state.mission!;if(current.positionM!==0||current.velocityMS!==0)throw Error('Service requires physical station arrival');
     const delivered=current.onboardM3;current.deliveredM3+=delivered;current.onboardM3=0;current.completedTrips++;
     if(cfg.stationReplenish!==false){for(const sp of ['diesel','hydrogen']as const){const amount=ship.resources[sp].capacityKg-state.fuelKg[sp];current.receivedFuelKg[sp]+=amount;state.fuelKg[sp]+=amount;}}
     if(cfg.stationReplenish===true){const charge=ship.batteryCapacityJ-state.chargeJ;current.receivedChargeJ+=charge;state.chargeJ+=charge;telemetry.stationInputJ=(telemetry.stationInputJ??0)+charge;}
     event('mission-service',`Рейс ${current.completedTrips}: доставлено ${delivered} SCU`);
     if(current.deliveredM3>=cfg.targetM3-1e-8||!cfg.repeat){current.terminalReason=current.deliveredM3>=cfg.targetM3-1e-8?'target':'single-trip';transition('complete');}
     else transition('outbound');
    }
   }
  }else if(m.stage==='mining'){
   const capacity=ship.cargoCapacityM3.bulk+ship.cargoCapacityM3.universal,limit=Math.min(capacity,cfg.targetM3-m.deliveredM3),left=limit-m.onboardM3;
   if(left<=1e-8){transition('inbound');}
   else{
    const req=Object.fromEntries(cfg.selectedWorkGroup.map(id=>[id,1])),conversion=cfg.process.extractFactor*cfg.process.softFactor*cfg.process.workFactor/cfg.process.energyJPerM3;
    const fullStop=(physical:StateV3)=>stepV3Interval(spec,physical,req,'work',1e-7,cfg.process).telemetry.processWorkJ===0;
    if(cfg.stopPolicy==='first-stop'&&fullStop(state)){event('mission-stop','Выбранная группа полностью прекратила добычу');transition('inbound');continue;}
    let step=trial(dt,req,'work');
    if(cfg.stopPolicy==='first-stop'&&fullStop(step.state)){dt=bisect(dt,h=>fullStop(trial(h,req,'work').state));step=trial(dt,req,'work');}
    if(step.telemetry.processWorkJ*conversion>=left){dt=bisect(dt,h=>trial(h,req,'work').telemetry.processWorkJ*conversion>=left);step=trial(dt,req,'work');}
    // Последний интервал вычисляется с ограниченным запросом, лишняя руда не обрезается бесплатно.
    const raw=step.telemetry.processWorkJ*conversion;if(raw>left){const duty=left/raw;step=trial(dt,Object.fromEntries(cfg.selectedWorkGroup.map(id=>[id,duty])),'work');}
    const amount=step.telemetry.processWorkJ*conversion;commit(step);state.mission!.onboardM3+=amount;state.mission!.minedM3+=amount;
    if(limit-state.mission!.onboardM3<=1e-7)transition('inbound');
    else if(cfg.stopPolicy==='first-stop'&&fullStop(state)){event('mission-stop','Выбранная группа полностью прекратила добычу');transition('inbound');}
   }
  }
  if(state.timeSeconds===beforeTime){if(++zeroTransitions>16)throw Error('Mission zero-time transition loop');}else zeroTransitions=0;
 }
 state.phaseIndex=0;state.phaseElapsedSeconds=state.timeSeconds-spec.initialState.timeSeconds;
 if(Math.abs(state.timeSeconds-end)<1e-9)state.timeSeconds=end;
 telemetry.temperatureK=state.temperatureK;telemetry.chargeJ=state.chargeJ;for(const[id,b]of Object.entries(state.buffers))telemetry['bufferJ:'+id]=b.storedJ;
 return {state,telemetry,frames,diagnostics,events};
}
