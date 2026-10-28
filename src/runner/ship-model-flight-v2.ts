import type {RunSpecV3,StateV3} from '../model/v3/types';
import type {LabEvent,TickTelemetry} from '../model/types';
import {stepV3Interval} from '../model/v3/step';
import {stepStationService} from '../model/v3/station-service';
import {advanceFlight,momentum} from '../model/v2/flight';

type Physical=ReturnType<typeof stepV3Interval>;
export type MissionInterval=Physical&{events:LabEvent[]};
type Work<T>=Generator<void,T,unknown>;
type Command={role?:'march'|'retro';sign:number};
type Trial={interval:Physical;dt:number;momentum:number;impulse:number};
type Witness={kind:'stop'|'cross'|'no-force';state:StateV3;remaining:number};
export type FlightMemo={specKey:string;entries:Map<string,Witness>};
export type MissionV2Job={iterator:Work<MissionInterval>;result?:MissionInterval;error?:string;operations:number};
const POSITION_EPS=1e-3,VELOCITY_EPS=1e-4;
const mass=(s:RunSpecV3,x:StateV3)=>s.resolvedShip.dryMassKg+x.fuelKg.diesel+x.fuelKg.hydrogen+x.mission!.onboardM3*s.mission!.process.densityKgM3;
const role=(sign:number):'march'|'retro'=>sign>0?'march':'retro';
const requests=(s:RunSpecV3,c:Command)=>c.role?Object.fromEntries(s.resolvedShip.instances.filter(i=>i.item.family==='engine'&&i.role===c.role).map(i=>[i.id,1])):{};
function gridRemaining(spec:RunSpecV3,t:number){const n=Math.floor((t-spec.initialState.timeSeconds)/spec.stepSeconds)+1;return spec.initialState.timeSeconds+n*spec.stepSeconds-t;}
export function createFlightMemo(spec:RunSpecV3):FlightMemo{return{specKey:JSON.stringify(spec),entries:new Map()};}
function* physical(spec:RunSpecV3,state:StateV3,req:Record<string,number>,action:'idle'|'maneuver'|'work',dt:number):Work<Physical>{
 if(!(dt>0&&dt<=1))throw Error('Неразрешимый физический interval полёта');
 const out=stepV3Interval(spec,state,req,action,dt,action==='work'?spec.mission!.process:undefined);yield;return out;
}
function* trial(spec:RunSpecV3,state:StateV3,command:Command,dt:number):Work<Trial>{
 const out=yield* physical(spec,state,requests(spec,command),'maneuver',dt),meanMass=(mass(spec,state)+mass(spec,out.state))/2,I=command.role?(out.telemetry['impulseNs:'+command.role]??0)*command.sign:0;
 const move=advanceFlight(state.mission!,meanMass,I/dt,dt);
 Object.assign(out.state.mission!,move);out.state.mission!.stageElapsedSeconds=state.mission!.stageElapsedSeconds+dt;
 out.state.phaseElapsedSeconds=out.state.timeSeconds-spec.initialState.timeSeconds;
 return{interval:out,dt,momentum:momentum(move.velocityMS,meanMass),impulse:I};
}
// Root сохраняет bracket между yields: вычислительный deadline не выбирает физический исход.
function* velocityRoot(spec:RunSpecV3,state:StateV3,command:Command,full:Trial,targetVelocity:number):Work<Trial>{
 const residual=(x:Trial)=>x.momentum-momentum(targetVelocity,(mass(spec,state)+mass(spec,x.interval.state))/2);
 let lo=0,hi=full.dt,fl=momentum(state.mission!.velocityMS,mass(spec,state))-momentum(targetVelocity,mass(spec,state)),fh=residual(full);
 for(let n=0;n<64;n++){
  let h=lo-fl*(hi-lo)/(fh-fl);if(!(h>lo&&h<hi))h=(lo+hi)/2;
  if(!(h>lo&&h<hi))throw Error('Не найден разрешимый velocity root');
  const p=yield* trial(spec,state,command,h),v=p.interval.state.mission!.velocityMS-targetVelocity;
  if(Math.abs(v)<=1e-7)return p;
  const f=residual(p);if((f>=0)===(fl>=0)){lo=h;fl=f;}else{hi=h;fh=f;}
 }
 throw Error('Velocity root не сошёлся');
}
function* forecast(spec:RunSpecV3,input:StateV3,target:number,direction:number,memo:FlightMemo):Work<Witness>{
 const key=JSON.stringify([target,direction,input]),cached=memo.entries.get(key);if(cached)return cached;
 let state=structuredClone(input),first=true;
 // Сохраняются только exact successor keys реального полного торможения.
 // Размер cache ограничивает память, а не физическую длительность прогноза.
 const prefix=[key];
 const finish=(kind:Witness['kind']):Witness=>{const w={kind,state,remaining:direction*(target-state.mission!.positionM)};for(const k of prefix)memo.entries.set(k,w);while(memo.entries.size>128)memo.entries.delete(memo.entries.keys().next().value!);return w;};
 while(true){
  if(Math.abs(state.mission!.velocityMS)<=VELOCITY_EPS)return finish(direction*(target-state.mission!.positionM)>=-POSITION_EPS?'stop':'cross');
  const command={role:role(-direction),sign:-direction},p=yield* trial(spec,state,command,gridRemaining(spec,state.timeSeconds));
  if(first&&p.impulse===0)return finish('no-force');
  if(!first&&p.impulse!==0&&prefix.length<32)prefix.push(JSON.stringify([target,direction,state]));
  first=false;
  const before=state;
  if(p.interval.state.mission!.velocityMS*direction<=0){const root=yield* velocityRoot(spec,state,command,p,0);state=root.interval.state;return finish(direction*(target-state.mission!.positionM)>=-POSITION_EPS?'stop':'cross');}
  state=p.interval.state;
  if(direction*(target-state.mission!.positionM)<=0)return finish('cross');
  if(!(state.timeSeconds>before.timeSeconds))throw Error('Прогноз не продвигает физическое время');
 }
}
function* flightDecision(spec:RunSpecV3,state:StateV3,target:number,dt:number,memo:FlightMemo):Work<Trial>{
 const m=state.mission!,remaining=target-m.positionM,direction=remaining>=0?1:-1,v=m.velocityMS,speed=Math.abs(v),braking={role:role(v!==0?-Math.sign(v):-direction),sign:v!==0?-Math.sign(v):-direction};
 // Уже слишком поздний checkpoint честно тормозит и возвращается, не получает fake arrival.
 if(v*direction<0){const p=yield* trial(spec,state,braking,dt);return p.interval.state.mission!.velocityMS*v<0?yield* velocityRoot(spec,state,braking,p,0):p;}
 const now=yield* forecast(spec,state,target,direction,memo);
 if(now.kind!=='stop'||Math.abs(now.remaining)<=POSITION_EPS){const p=yield* trial(spec,state,braking,dt);return v!==0&&p.interval.state.mission!.velocityMS*v<0?yield* velocityRoot(spec,state,braking,p,0):p;}
 const command:Command=speed<spec.mission!.route.cruiseSpeedMS-1e-5?{role:role(direction),sign:direction}:{sign:0};
 let candidate=yield* trial(spec,state,command,dt);
 if(command.role&&Math.abs(candidate.interval.state.mission!.velocityMS)>spec.mission!.route.cruiseSpeedMS){candidate=yield* velocityRoot(spec,state,command,candidate,direction*spec.mission!.route.cruiseSpeedMS);dt=candidate.dt;}
 const end=yield* forecast(spec,candidate.interval.state,target,direction,memo);
 if(end.kind==='stop')return candidate;
 if(end.kind==='no-force')return yield* trial(spec,state,braking,dt);
 let lo=0,hi=dt;
 for(let n=0;n<64;n++){
  const mid=(lo+hi)/2;if(!(mid>lo&&mid<hi))throw Error('Нет разрешимого flight event bracket');
  const p=yield* trial(spec,state,command,mid),w=yield* forecast(spec,p.interval.state,target,direction,memo);
  if(w.kind==='stop'&&Math.abs(w.remaining)<=POSITION_EPS&&Math.abs(w.state.mission!.velocityMS)<=VELOCITY_EPS)return p;
  if(w.kind==='stop')lo=mid;else if(w.kind==='cross')hi=mid;else return yield* trial(spec,state,braking,dt);
 }
 throw Error('Flight event root не сошёлся');
}
function* mission(spec:RunSpecV3,input:StateV3,memo:FlightMemo):Work<MissionInterval>{
 const cfg=spec.mission!,end=Math.min(spec.durationSeconds,input.timeSeconds+spec.stepSeconds),telemetry:TickTelemetry={},frames:Physical['frames']=[],diagnostics:Physical['diagnostics']=[],events:LabEvent[]=[];
 let state=structuredClone(input),zeroTransitions=0;
 const event=(kind:string,message:string)=>events.push({timeSeconds:state.timeSeconds,kind,message});
 const transition=(stage:NonNullable<StateV3['mission']>['stage'])=>{state.mission!.stage=stage;state.mission!.stageElapsedSeconds=0;event('mission-stage',stage);};
 const accept=(out:Physical,flight=false)=>{const dt=out.state.timeSeconds-state.timeSeconds;state=out.state;if(!flight)state.mission!.stageElapsedSeconds+=dt;frames.push(...out.frames);diagnostics.push(...out.diagnostics);for(const[k,v]of Object.entries(out.telemetry))if(!['temperatureK','chargeJ'].includes(k)&&!k.startsWith('bufferJ:'))telemetry[k]=(telemetry[k]??0)+v;};
 while(state.timeSeconds<end-1e-10&&state.mission!.stage!=='complete'){
  const m=state.mission!,before=state.timeSeconds;let dt=end-before;
  if(m.stage==='outbound'||m.stage==='inbound'){
   const target=m.stage==='outbound'?cfg.route.distanceM:0;
   if(Math.abs(target-m.positionM)<=POSITION_EPS&&Math.abs(m.velocityMS)<=VELOCITY_EPS){
    // Только прежняя численная точность физического arrival, не проекция finite overshoot.
    m.positionM=target;m.velocityMS=0;event('mission-arrival',`${m.stage}: x=${target} m, v=0 m/s`);transition(m.stage==='outbound'?'approach':'service');
   }else{const p=yield* flightDecision(spec,state,target,dt,memo);accept(p.interval,true);}
  }else if(m.stage==='approach'||m.stage==='service'){
   const service=m.stage==='service',duration=service?cfg.serviceSeconds:cfg.approachSeconds,left=duration-m.stageElapsedSeconds;
   if(left>1e-10){dt=Math.min(dt,left);if(service&&spec.catalogVersion==='ship-fitting-0.3.4'){const out=stepStationService(spec,state,dt);yield;accept(out);}else accept(yield* physical(spec,state,{},'idle',dt));}
   if(state.mission!.stageElapsedSeconds>=duration-1e-9){
    if(!service)transition('mining');else{
     const current=state.mission!;if(current.positionM!==0||current.velocityMS!==0)throw Error('Service requires physical station arrival');
     const delivered=current.onboardM3;current.deliveredM3+=delivered;current.onboardM3=0;current.completedTrips++;
     if(cfg.stationReplenish!==false)for(const sp of['diesel','hydrogen']as const){const amount=spec.resolvedShip.resources[sp].capacityKg-state.fuelKg[sp];current.receivedFuelKg[sp]+=amount;state.fuelKg[sp]+=amount;}
     if(cfg.stationReplenish===true){const charge=spec.resolvedShip.batteryCapacityJ-state.chargeJ;current.receivedChargeJ+=charge;state.chargeJ+=charge;telemetry.stationInputJ=(telemetry.stationInputJ??0)+charge;}
     event('mission-service',`Рейс ${current.completedTrips}: доставлено ${delivered} SCU`);
     if(current.deliveredM3>=cfg.targetM3-1e-8||!cfg.repeat){current.terminalReason=current.deliveredM3>=cfg.targetM3-1e-8?'target':'single-trip';transition('complete');}else transition('outbound');
    }
   }
  }else if(m.stage==='mining'){
   const capacity=spec.resolvedShip.cargoCapacityM3.bulk+spec.resolvedShip.cargoCapacityM3.universal,limit=Math.min(capacity,cfg.targetM3-m.deliveredM3),left=limit-m.onboardM3;
   if(left<=1e-8)transition('inbound');else{
    const req=Object.fromEntries(cfg.selectedWorkGroup.map(id=>[id,1])),conversion=cfg.process.extractFactor*cfg.process.softFactor*cfg.process.workFactor/cfg.process.energyJPerM3;
    const stopped=function*(x:StateV3):Work<boolean>{return(yield* physical(spec,x,req,'work',1e-7)).telemetry.processWorkJ===0;};
    if(cfg.stopPolicy==='first-stop'&&(yield* stopped(state))){event('mission-stop','Выбранная группа полностью прекратила добычу');transition('inbound');continue;}
    let out=yield* physical(spec,state,req,'work',dt);
    if(cfg.stopPolicy==='first-stop'&&(yield* stopped(out.state))){let lo=0,hi=dt;while(hi-lo>1e-7){const mid=(lo+hi)/2,p=yield* physical(spec,state,req,'work',mid);if(yield* stopped(p.state))hi=mid;else lo=mid;}dt=hi;out=yield* physical(spec,state,req,'work',dt);}
    if(out.telemetry.processWorkJ*conversion>=left){let lo=0,hi=dt;while(hi-lo>1e-7){const mid=(lo+hi)/2,p=yield* physical(spec,state,req,'work',mid);if(p.telemetry.processWorkJ*conversion>=left)hi=mid;else lo=mid;}dt=hi;out=yield* physical(spec,state,req,'work',dt);}
    const raw=out.telemetry.processWorkJ*conversion;if(raw>left){const duty=left/raw;out=yield* physical(spec,state,Object.fromEntries(cfg.selectedWorkGroup.map(id=>[id,duty])),'work',dt);}
    const amount=out.telemetry.processWorkJ*conversion;accept(out);state.mission!.onboardM3+=amount;state.mission!.minedM3+=amount;
    if(limit-state.mission!.onboardM3<=1e-7)transition('inbound');else if(cfg.stopPolicy==='first-stop'&&(yield* stopped(state))){event('mission-stop','Выбранная группа полностью прекратила добычу');transition('inbound');}
   }
  }
  if(state.timeSeconds===before){if(++zeroTransitions>16)throw Error('Mission zero-time transition loop');}else zeroTransitions=0;
 }
 state.phaseIndex=0;state.phaseElapsedSeconds=state.timeSeconds-spec.initialState.timeSeconds;
 if(Math.abs(state.timeSeconds-end)<1e-9)state.timeSeconds=end;
 // Сегменты содержат интегралы импульса, а forceN — среднее за весь actual interval.
 const elapsed=state.timeSeconds-input.timeSeconds;
 if(elapsed>0)for(const key of Object.keys(telemetry))if(key.startsWith('impulseNs:'))telemetry['forceN:'+key.slice('impulseNs:'.length)]=telemetry[key]/elapsed;
 telemetry.temperatureK=state.temperatureK;telemetry.chargeJ=state.chargeJ;for(const[id,b]of Object.entries(state.buffers))telemetry['bufferJ:'+id]=b.storedJ;
 return{state,telemetry,frames,diagnostics,events};
}
export function createMissionV2Job(spec:RunSpecV3,input:StateV3,memo=createFlightMemo(spec),specKey=JSON.stringify(spec)):MissionV2Job{
 if(memo.specKey!==specKey){memo.entries.clear();memo.specKey=specKey;}
 return{iterator:mission(spec,input,memo),operations:0};
}
export function advanceMissionV2Job(job:MissionV2Job,deadlineMs:number,operationLimit=Infinity):{kind:'pending'}|{kind:'ready';interval:MissionInterval}|{kind:'numerical-error';message:string}{
 if(job.error)return{kind:'numerical-error',message:job.error};if(job.result)return{kind:'ready',interval:job.result};
 let operations=0;try{while(operations<operationLimit&&performance.now()<deadlineMs){const next=job.iterator.next();operations++;job.operations++;if(next.done){job.result=next.value;return{kind:'ready',interval:next.value};}}}catch(error){job.error=String(error);return{kind:'numerical-error',message:job.error};}
 return{kind:'pending'};
}
export function stepMissionV2(spec:RunSpecV3,input:StateV3):MissionInterval{const job=createMissionV2Job(spec,input),out=advanceMissionV2Job(job,Infinity);if(out.kind!=='ready')throw Error(out.kind==='numerical-error'?out.message:'Не завершён synchronous job');return out.interval;}
