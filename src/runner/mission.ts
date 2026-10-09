import type { RunContextV2 } from "./fitting-run";
import type { MissionState, RequestFrame, StateV2, StepResultV2 } from "../model/v2/types";
import { thermalDuty } from "../model/scheduler";
import { stepV2, physicsShip } from "../model/v2/step";
import { commitSignatureFrames } from "../signatures/runtime";
import { MODEL_SIGNATURE_MISSION } from "../model/v2/types";
import { advanceFlight, momentum, stoppingDistance } from "../model/v2/flight";
import { updateMiningMetrics } from "./mining-metrics";
import { Retention } from "./retention";
import { replacedDiagnosticEvent } from './diagnostics';

export function initializeMission(run:RunContextV2) {
  run.state.mission={stage:"outbound",flightMode:"acceleration",positionM:0,velocityMS:0,stageStartedSeconds:0,tripStartedSeconds:0,outboundMassKg:run.state.currentMassKg,inboundMassKg:null,peakVelocityMS:0,deliveredM3:0,receivedFuelKg:{diesel:0,hydrogen:0},...(run.spec.mission!.stationReplenish===undefined?{}:{receivedChargeJ:0}),elapsed:{flight:0,approach:0,mining:0,service:0,recovery:0},firstLimiter:null,terminalReason:null};
  syncMetrics(run);
  run.events.add({timeSeconds:0,kind:"phase",message:"Миссия: вылет от станции; местный подход strafe/turn по laboratory duty"});
}
function syncMetrics(run:RunContextV2) {
  const m=run.state.mission!,metrics=run.metrics,t=run.state.timeSeconds;
  metrics.mission={deliveredM3:m.deliveredM3,deliveredScuPerHour:t>0?m.deliveredM3*3600/t:null,fuelPerDeliveredScu:Object.fromEntries(["diesel","hydrogen"].map(sp=>[sp,m.deliveredM3>0?metrics.fuelSpeciesKg[sp]/m.deliveredM3:null])),flightSeconds:m.elapsed.flight,approachSeconds:m.elapsed.approach,miningSeconds:m.elapsed.mining,serviceSeconds:m.elapsed.service,recoverySeconds:m.elapsed.recovery,peakVelocityMS:m.peakVelocityMS,...(m.receivedChargeJ===undefined?{}:{receivedChargeJ:m.receivedChargeJ})};
  metrics.firstTargetSeconds=m.deliveredM3>=run.spec.scenario.targetM3-1e-8?metrics.firstTargetSeconds??t:null;
  metrics.intervalLabel=m.stage==="done"?"завершённая миссия":m.stage==="stranded"?"невозможный / незавершённый рейс":"наблюдаемый горизонт / незавершённый рейс";
}
function event(run:RunContextV2,kind:string,message:string) {
  run.events.add({timeSeconds:run.state.timeSeconds,kind,message});
}
function transition(run:RunContextV2,stage:MissionState["stage"],message:string) {
  run.state.mission={...run.state.mission!,stage,stageStartedSeconds:run.state.timeSeconds};
  run.state.phaseKey="mission:"+stage;event(run,"phase",message);
}
function finishLeg(run:RunContextV2) {
  const m=run.state.mission!;
  event(run,"mission-arrival",`${stageNames[m.stage]}: ${run.spec.mission!.distanceM===0?"нулевая дистанция, перелёт пропущен":"прибытие после реального торможения"}; x=${m.positionM} m, v=${m.velocityMS} m/s`);
  transition(run,m.stage==="outbound"?"approach":"service",m.stage==="outbound"?"Поле: местный подход":"Станция: обслуживание, груз и топливо изменятся в конце");
}
function beginInbound(run:RunContextV2,message:string) {
  transition(run,"inbound",message);
  run.state.mission={...run.state.mission!,positionM:0,velocityMS:0,flightMode:"acceleration",inboundMassKg:run.state.currentMassKg};
}
const stageNames:Record<string,string>={outbound:"перелёт к полю",inbound:"перелёт к станции",approach:"местный подход",mining:"добыча",service:"обслуживание станции"};
function requestedCauses(run:RunContextV2,previous:StateV2,step:StepResultV2,requests:RequestFrame) {
  const wanted=run.spec.resolvedShip.instances.filter(i=>(requests[i.id]??requests[i.role??""]??0)>0);
  let oldPhysics:ReturnType<typeof physicsShip>|undefined,newPhysics:ReturnType<typeof physicsShip>|undefined;
  const empty=run.spec.resolvedShip.instances.filter(i=>i.enabled&&i.item.species&&i.item.family!=="tank"&&(step.state.fuelKg[i.item.species]??0)<=1e-10);
  const causes=new Set<"thermal"|"power"|"resource">(),ids:string[]=[];
  for(const i of wanted){
    const duty=requests[i.id]??requests[i.role??""]??0;
    const actual=i.item.family==="engine"?(step.telemetry["forceN:"+i.id]??0):(step.telemetry["deliveredW:"+i.id]??0);
    const nominal=(i.item.family==="engine"?i.item.numerics.forceN:i.item.numerics.powerW)*duty;
    if(actual>=nominal-1e-6)continue;
    if(i.item.family==="mining"&&step.mining.causeSeconds.cargo>0&&step.mining.causeSeconds.power===0&&step.mining.causeSeconds.thermal===0)continue;
    ids.push(i.id);
    const heat=i.enabled&&(thermalDuty(oldPhysics??=physicsShip(run.spec,previous),previous,i.id)<1-1e-9||thermalDuty(newPhysics??=physicsShip(run.spec,step.state),step.state,i.id)<1-1e-9||!!(i.item.species&&(previous.gates['tank:'+i.item.species]||step.state.gates['tank:'+i.item.species])));
    if(heat)causes.add('thermal');
    if(!i.enabled||i.item.species&&(step.state.fuelKg[i.item.species]??0)<=1e-10)causes.add('resource');
    if(i.item.propulsionType==='electric'||i.item.family==='mining'){
      if(step.mining.causeSeconds.power>0||(!heat&&actual<nominal-1e-6))causes.add('power');
      if(causes.has('power')&&empty.some(x=>x.item.family==='generator')||heat&&empty.some(x=>x.item.family==='h2'))causes.add('resource');
    }
  }
  const stock=empty.map(i=>i.item.species==='diesel'?'дизель':'водород').filter((x,i,a)=>a.indexOf(x)===i);
  const message=[causes.has('thermal')?'Тепловое снижение тяги/выдачи; охлаждение и восстановление продолжаются':null,causes.has('power')?`Недостаточно доступной электрической мощности; заряд ${(step.state.chargeJ/1e6).toFixed(3)} МДж; источники ${((step.telemetry.generatorW+step.telemetry.solarW+step.telemetry.externalElectricW)/1e6).toFixed(3)} МВт, запрос ${(step.telemetry.requestedW/1e6).toFixed(3)} МВт`:null,causes.has('resource')?stock.length?`Исчерпан установленный расходуемый запас: ${stock.join(', ')}`:'Запрошенный модуль выключен или недоступен':null].filter(Boolean).join(' · ');
  return {causes:[...causes],ids,message};
}
function firstLimitation(run:RunContextV2,previous:StateV2,step:StepResultV2,requests:RequestFrame) {
  const m=run.state.mission!;if(m.firstLimiter)return;
  const diagnosis=requestedCauses(run,previous,step,requests);
  if(diagnosis.causes.length)m.firstLimiter={timeSeconds:previous.timeSeconds,phase:m.stage,instanceIds:diagnosis.ids,causes:diagnosis.causes,message:diagnosis.message};
}
function recordStep(run:RunContextV2,previous:StateV2,step:StepResultV2,dt:number,requests:RequestFrame) {
  const before=previous.mission!;
  if(run.signatures) {
    if(!step.signatureFrames)throw new Error("Accepted physical source frames missing");
    commitSignatureFrames(run.signatures,step.signatureFrames,before.stage+(before.stage==="outbound"||before.stage==="inbound"?":"+before.flightMode:""),run.spec.signatures!,run.spec.durationSeconds);
  }
  run.state=step.state;
  run.state.mission={...before,elapsed:{...before.elapsed},receivedFuelKg:{...before.receivedFuelKg}};
  const m=run.state.mission!;
  const key=before.stage==="outbound"||before.stage==="inbound"?"flight":before.stage;
  if(key==="flight"||key==="approach"||key==="mining"||key==="service")m.elapsed[key]+=dt;
  if(before.stage==="mining")m.elapsed.recovery+=step.mining.forcedDowntimeSeconds;
  // Kernel остаётся численно прежним; mission не переносит его общие сообщения
  // об отсутствующем контуре или ожидаемом полном трюме в диагноз отказа рейса.
  const diagnosis=requestedCauses(run,previous,step,requests),mining=structuredClone(step.mining);
  if(mining.causeSeconds.cargo>0&&mining.firstLoss?.causes.every(c=>c==='cargo')){
    mining.unionSeconds=0;mining.overlapSeconds=0;mining.forcedDowntimeSeconds=0;mining.firstLoss=null;mining.firstCauseSeconds!.cargo=null;
    run.state.miningStopSeconds=null;
  }
  mining.causeSeconds.cargo=0;
  run.state.constraints=diagnosis.message?[diagnosis.message]:[];
  run.last=step.telemetry;updateMiningMetrics(run.metrics,previous,{...step,mining},dt,run.spec);
  const events=[...step.events.filter(e=>!replacedDiagnosticEvent(e.kind)),...run.diagnostics.observeV2(run.spec,previous,step,requests,stageNames[before.stage]??before.stage)];
  for(const e of events.sort((a,b)=>a.timeSeconds-b.timeSeconds))run.events.add(e);
  firstLimitation(run,previous,step,requests);
  run.metrics.firstLimiter=m.firstLimiter?{timeSeconds:m.firstLimiter.timeSeconds,causes:m.firstLimiter.causes}:null;
}
function retain(run:RunContextV2) {
  const m=run.state.mission!;
  Object.assign(run.last,{positionM:m.positionM,velocityMS:m.velocityMS,deliveredM3:m.deliveredM3});
  for(const i of run.spec.resolvedShip.instances){
    run.last["installedMassKg:"+i.id]=i.item.materials.reduce((n,m)=>n+m.massKg,0);
    if(i.item.family==="battery")run.last["storedJ:"+i.id]=run.state.chargeJ*i.item.numerics.capacityJ/run.spec.resolvedShip.batteryCapacityJ;
    if(i.item.family==="tank")run.last["fuelKg:"+i.id]=run.state.fuelKg[i.item.species!]*i.item.numerics.fuelCapacityKg/run.spec.resolvedShip.resources[i.item.species!].capacityKg;
  }
  if(!run.retention.channels.length)run.retention=new Retention(Object.keys(run.last).sort());
  run.retention.add(run.state.timeSeconds,run.last);syncMetrics(run);
}
function strand(run:RunContextV2,reason:string) {
  const m=run.state.mission!;
  if(!m.firstLimiter)m.firstLimiter={timeSeconds:run.state.timeSeconds,phase:m.stage,instanceIds:run.spec.resolvedShip.instances.filter(i=>i.role===(m.flightMode==="braking"?"retro":"march")).map(i=>i.id),causes:["resource"],message:reason};
  transition(run,"stranded",reason);run.state.mission!.terminalReason=reason;run.done=true;syncMetrics(run);
}
function irreversibleEngineLoss(run:RunContextV2,role:string) {
  const i=run.spec.resolvedShip.instances.find(i=>i.role===role);
  if(!i||!i.enabled||i.item.numerics.forceN===0)return true;
  if(i.item.species)return (run.state.fuelKg[i.item.species]??0)<=1e-10;
  return !hasElectricEnergy(run);
}
function hasElectricEnergy(run:RunContextV2) {
  if(run.state.chargeJ>1e-10)return true;
  // Проверяем установленный положительный профиль и typed stock, а не текущий
  // thermal gate: временно остановленный источник остаётся путём восстановления.
  return run.spec.resolvedShip.instances.some(i=>i.enabled&&(
    i.item.family==='generator'&&i.item.species&&i.item.numerics.powerW>0&&i.item.numerics.pathEfficiency>0&&(run.state.fuelKg[i.item.species]??0)>1e-10||
    i.item.family==='solar'&&i.item.numerics.areaM2>0&&i.item.numerics.efficiency>0&&run.spec.environment.solarFluxWm2>0
  ))||run.spec.environment.energyInputs.some(i=>i.representation==='electric'&&i.powerW>0);
}
function engineLossReason(run:RunContextV2,role:string){
  const i=run.spec.resolvedShip.instances.find(i=>i.role===role);
  return !i||!i.enabled||i.item.numerics.forceN===0?'двигатель отсутствует или выключен':i.item.propulsionType==='electric'?'аккумулятор пуст и нет доступного источника электрической энергии':i.item.species==='diesel'?'дизель исчерпан':'водород исчерпан';
}
function force(run:RunContextV2,step:StepResultV2,role:string) {
  const i=run.spec.resolvedShip.instances.find(i=>i.role===role);
  return i?step.telemetry["forceN:"+i.id]??0:0;
}
function flightStep(run:RunContextV2,dt:number) {
  const state=run.state,m=state.mission!,cfg=run.spec.mission!,remaining=cfg.distanceM-m.positionM;
  const trial=(h:number,requests:RequestFrame)=>stepV2(run.spec,state,h,requests);
  // Направление выбирается к реальной точке назначения, не к пересечённому порогу.
  // После потери тормозной тяги сначала гасим инерцию, затем возвращаемся теми же двигателями.
  const direction=remaining>=0?1:-1,accelerator=direction>0?'march':'retro',brake=direction>0?'retro':'march';
  const speed=Math.abs(m.velocityMS),toward=m.velocityMS*direction>=0;
  let role:string|undefined,sign=0,duty=1;
  const brakeTrial=trial(dt,{[brake]:1}),brakeForce=force(run,brakeTrial,brake);
  const stop=brakeForce>0?stoppingDistance(speed,state.currentMassKg,brakeForce):Infinity;
  if(!toward&&speed>1e-9){role=m.velocityMS>0?'retro':'march';sign=m.velocityMS>0?-1:1;m.flightMode='braking';}
  else if(speed>1e-9&&stop>=Math.abs(remaining)-1e-7){role=brake;sign=-direction;m.flightMode='braking';duty=brakeForce>0&&Math.abs(remaining)>0?Math.min(1,stop/Math.abs(remaining)):1;}
  else if(cfg.cruiseSpeedMS!==null&&speed>=cfg.cruiseSpeedMS-1e-6){m.flightMode='coast';}
  else{role=accelerator;sign=direction;m.flightMode='acceleration';}
  let requests:RequestFrame=role?{[role]:duty}:{};
  let selected=trial(dt,requests);
  const projection=(h:number)=>{const s=trial(h,requests);return {s,a:advanceFlight(m,s.state.currentMassKg,role?sign*force(run,s,role):0,h)};};
  if(m.flightMode==='acceleration'){
    // Новая тепловая модель меняет availability внутри пробного h. Mode choice
    // и boundary search используют одну actual brake envelope этого решения:
    // смешивание full-dt и shortened-h force создаёт бесконечный chatter у границы.
    // Исторический controller сохраняет прежний путь буквально.
    const beyond=(h:number)=>{const {s,a}=projection(h),f=run.spec.modelVersion===MODEL_SIGNATURE_MISSION?brakeForce:force(run,trial(h,{[brake]:1}),brake);return (cfg.cruiseSpeedMS!==null&&Math.abs(a.velocityMS)>cfg.cruiseSpeedMS)||(f>0&&Math.abs(cfg.distanceM-a.positionM)<stoppingDistance(a.velocityMS,s.state.currentMassKg,f));};
    if(beyond(dt)){
      let lo=0,hi=dt;for(let n=0;n<36;n++){const h=(lo+hi)/2;if(beyond(h))hi=h;else lo=h;}
      if(lo>1e-10){dt=lo;selected=trial(dt,requests);}
      else{role=brake;sign=-direction;requests={[brake]:1};m.flightMode='braking';selected=trial(dt,requests);}
    }
  }else if(m.flightMode==='coast'&&speed>0&&brakeForce>0){
    const until=(Math.abs(remaining)-stop)/speed;
    if(until>0&&until<dt){dt=until;selected=trial(dt,requests);}
  }
  let signed=role?sign*force(run,selected,role):0;
  if(signed*m.velocityMS<0&&advanceFlight(m,selected.state.currentMassKg,signed,dt).velocityMS*m.velocityMS<0){
    let lo=0,hi=dt;for(let n=0;n<36;n++){const h=(lo+hi)/2,s=trial(h,requests);if(advanceFlight(m,s.state.currentMassKg,sign*force(run,s,role!),h).velocityMS*m.velocityMS<0)hi=h;else lo=h;}
    dt=hi;selected=trial(dt,requests);signed=sign*force(run,selected,role!);
  }
  const move=advanceFlight(m,selected.state.currentMassKg,signed,dt);
  recordStep(run,state,selected,dt,requests);
  const current=run.state.mission!;current.positionM=move.positionM;current.velocityMS=move.velocityMS;
  current.peakVelocityMS=Math.max(current.peakVelocityMS,Math.abs(current.velocityMS));
  if(signed*m.velocityMS<0&&Math.abs(cfg.distanceM-current.positionM)<=1&&Math.abs(current.velocityMS)<=.1){
    current.positionM=cfg.distanceM;current.velocityMS=0;finishLeg(run);
  }else if(role&&signed===0&&irreversibleEngineLoss(run,role))strand(run,"Необратимо недоступна требуемая тяга: "+engineLossReason(run,role));
  settleTransitions(run);retain(run);
}
function finishService(run:RunContextV2) {
  const m=run.state.mission!,s=run.spec;
  if(m.velocityMS!==0||m.positionM!==s.mission!.distanceM)throw Error("Обслуживание разрешено только в покое у станции");
  const delivered=run.state.cargo;m.deliveredM3+=delivered;
  run.state.cargo=0;run.state.cargoM3={};
  const fuelReceived={diesel:0,hydrogen:0};
  if(s.mission!.stationReplenish!==false)for(const sp of ["diesel","hydrogen"] as const){const refill=Math.max(0,s.resolvedShip.resources[sp].capacityKg-run.state.fuelKg[sp]);fuelReceived[sp]=refill;m.receivedFuelKg[sp]+=refill;run.state.fuelKg[sp]+=refill;}
  let chargeReceived=0;
  if(s.mission!.stationReplenish===true){chargeReceived=Math.max(0,s.resolvedShip.batteryCapacityJ-run.state.chargeJ);m.receivedChargeJ=(m.receivedChargeJ??0)+chargeReceived;run.state.chargeJ=s.resolvedShip.batteryCapacityJ;}
  // Endpoint-пополнение не является kernel source. Последний telemetry sample
  // должен показывать реальные запасы перед новым вылетом, legacy bytes сохраняем.
  if(s.mission!.stationReplenish!==undefined){run.last.chargeJ=run.state.chargeJ;run.last.soc=s.resolvedShip.batteryCapacityJ>0?run.state.chargeJ/s.resolvedShip.batteryCapacityJ:0;for(const sp of ["diesel","hydrogen"])run.last['fuelKg:'+sp]=run.state.fuelKg[sp];}
  run.state.currentMassKg=s.resolvedShip.dryMassKg+Object.values(run.state.fuelKg).reduce((n,v)=>n+v,0);
  run.state.cyclesCompleted++;run.metrics.cyclesCompleted=run.state.cyclesCompleted;
  const metrics=run.metrics;metrics.lastCycle={scu:delivered,durationSeconds:metrics.currentCycleSeconds,kUse:metrics.ratedSelectedM3S>0&&metrics.currentCycleSeconds>0?metrics.currentCycleScu/(metrics.ratedSelectedM3S*metrics.currentCycleSeconds):null};
  metrics.completedCycles.scu+=delivered;metrics.completedCycles.durationSeconds+=metrics.currentCycleSeconds;
  metrics.completedCycles.kUse=metrics.ratedSelectedM3S>0&&metrics.completedCycles.durationSeconds>0?metrics.completedCycles.scu/(metrics.ratedSelectedM3S*metrics.completedCycles.durationSeconds):null;
  metrics.currentCycleScu=0;metrics.currentCycleSeconds=0;
  event(run,"service",s.mission!.stationReplenish===undefined?`Сдано ${delivered} SCU; заправлены только установленные контуры, температура/заряд продолжаются`:`Сдано ${delivered} SCU; получено дизеля ${fuelReceived.diesel} кг, водорода ${fuelReceived.hydrogen} кг, станционной энергии ${chargeReceived/1e9} GJ; температура/буферы продолжаются`);
  if(!s.scenario.repeat||m.deliveredM3>=s.scenario.targetM3-1e-8){transition(run,"done","Миссия завершена после обслуживания");run.state.mission!.terminalReason=m.deliveredM3>=s.scenario.targetM3-1e-8?"delivered-target":"single-voyage";run.done=true;}
  else {transition(run,"outbound","Новый порожний вылет");run.state.mission={...run.state.mission!,positionM:0,velocityMS:0,flightMode:"acceleration",outboundMassKg:run.state.currentMassKg,inboundMassKg:null,tripStartedSeconds:run.state.timeSeconds};}
  syncMetrics(run);
}
function settleTransitions(run:RunContextV2) {
  const cfg=run.spec.mission!;
  for(let n=0;n<32&&!run.done;n++){
    const m=run.state.mission!;
    if((m.stage==="outbound"||m.stage==="inbound")&&cfg.distanceM===0)finishLeg(run);
    else if(m.stage==="approach"&&run.state.timeSeconds>=m.stageStartedSeconds+cfg.approachSeconds)transition(run,"mining","Добыча до события, без заданной рабочей длительности");
    else if(m.stage==="service"&&run.state.timeSeconds>=m.stageStartedSeconds+cfg.serviceSeconds)finishService(run);
    else if(m.stage==="mining"&&run.state.cargo>0&&Math.min(run.spec.resolvedShip.cargoCapacityM3.universal+run.spec.resolvedShip.cargoCapacityM3.bulk,run.spec.scenario.targetM3-m.deliveredM3)-run.state.cargo<=1e-8){event(run,'cargo-full','Трюм заполнен или добыт остаток цели → возврат; штатное событие цикла');beginInbound(run,"Возврат с добытым грузом");}
    else return;
  }
}
export function runMissionChunk(run:RunContextV2,maxSteps:number,wallBudgetMs=Infinity) {
  const started=performance.now();let steps=0,transitions=0;
  while(!run.done&&steps<maxSteps){
    settleTransitions(run);if(run.done)break;
    if(steps%32===0&&performance.now()-started>=wallBudgetMs)break;
    const m=run.state.mission!,cfg=run.spec.mission!;
    const left=run.spec.durationSeconds-run.state.timeSeconds;if(!(left>0)){run.done=true;break;}
    run.state.phaseKey="mission:"+m.stage;
    if((m.stage==="outbound"||m.stage==="inbound")&&cfg.distanceM===0){finishLeg(run);if(++transitions>32)throw Error("Не продвигается цикл миссии");continue;}
    if(m.stage==="approach"&&run.state.timeSeconds>=m.stageStartedSeconds+cfg.approachSeconds){transition(run,"mining","Добыча до события, без заданной рабочей длительности");continue;}
    if(m.stage==="service"&&run.state.timeSeconds>=m.stageStartedSeconds+cfg.serviceSeconds){finishService(run);continue;}
    let dt=Math.min(run.spec.stepSeconds,left);const previous=run.state;
    if(m.stage==="outbound"||m.stage==="inbound")flightStep(run,dt);
    else {
      let requests:RequestFrame={};
      if(m.stage==="approach"){dt=Math.min(dt,m.stageStartedSeconds+cfg.approachSeconds-run.state.timeSeconds);requests={strafe:cfg.maneuverDuty,turn:cfg.maneuverDuty};}
      if(m.stage==="service")dt=Math.min(dt,m.stageStartedSeconds+cfg.serviceSeconds-run.state.timeSeconds);
      if(m.stage==="mining"){
        const hold=run.spec.resolvedShip.cargoCapacityM3.universal+run.spec.resolvedShip.cargoCapacityM3.bulk;
        const target=Math.min(hold,run.spec.scenario.targetM3-m.deliveredM3),need=target-run.state.cargo;
        if(need<=1e-8&&run.state.cargo>0){event(run,'cargo-full','Трюм заполнен или добыт остаток цели → возврат; штатное событие цикла');beginInbound(run,"Возврат с добытым грузом");continue;}
        requests=Object.fromEntries(run.spec.selectedWorkGroup.map(id=>[id,1]));
        if(run.metrics.ratedSelectedM3S>0&&need>1e-8)dt=Math.min(dt,need/run.metrics.ratedSelectedM3S);
      }
      if(!(dt>0))throw Error("Не разрешён положительный остаток времени миссии");
      let step=stepV2(run.spec,previous,dt,requests);
      let firstStop=m.stage==="mining"&&cfg.stopPolicy==="first-stop"&&step.mining.forcedDowntimeSeconds>0;
      if(firstStop){
        const stop=step.state.miningStopSeconds??previous.timeSeconds+dt-step.mining.forcedDowntimeSeconds;
        if(stop<=previous.timeSeconds){
          firstLimitation(run,previous,step,requests);
          if(run.spec.scenario.repeat&&cfg.distanceM===0&&previous.timeSeconds+cfg.approachSeconds===previous.timeSeconds&&previous.timeSeconds+cfg.serviceSeconds===previous.timeSeconds&&previous.cargo===0){
            // Все переходы возврата и следующего запроса имеют одну точку/clock.
            // Сливаем пустой повтор в реальное пассивное восстановление: не считаем
            // фиктивные обслуживания и не коммитим пробный mining step.
            dt=Math.min(run.spec.stepSeconds,left);requests={};
            step=stepV2(run.spec,previous,dt,requests);firstStop=false;
            if(m.elapsed.recovery===0)event(run,'mission-recovery','Нулевой повтор без добычи: физическое восстановление перед следующим запросом, без пустого обслуживания');
            m.elapsed.recovery+=dt;
          }else{beginInbound(run,"Выход: выбранная группа не может начать работу");continue;}
        }else{dt=Math.min(dt,stop-previous.timeSeconds);step=stepV2(run.spec,previous,dt,requests);}
      }
      recordStep(run,previous,step,dt,requests);
      if(m.stage==="mining"&&(firstStop||step.mining.forcedDowntimeSeconds>0)){
        if(firstStop)beginInbound(run,"Выход: первая полная остановка выбранной группы");
        else if(!hasElectricEnergy(run))beginInbound(run,"Возврат с добытым грузом: необратимое исчерпание ресурсов");
      }
      settleTransitions(run);retain(run);
    }
    if(!(run.state.timeSeconds>previous.timeSeconds))throw Error("Миссия не продвигает время");
    steps++;transitions=0;
    if(run.state.timeSeconds>=run.spec.durationSeconds)run.done=true;
  }
  syncMetrics(run);return {steps,done:run.done,state:run.state,telemetry:run.last};
}
