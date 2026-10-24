import type {ValidationResult} from '../catalog/schema';
import type {RunResultV3} from '../runner/ship-model-run';
import {validateRunSpecV3,validateStateV3,validateMissionStatePolicy} from '../model/v3/schema';
import {exactFields} from '../signatures/config';
import {validateShipReferences} from '../signatures/ship-reference';
const object=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
const integer=(x:unknown):x is number=>finite(x)&&Number.isSafeInteger(x)&&x>=0;
export function validateShipModelResult(input:unknown):ValidationResult<RunResultV3>{
  const errors:{path:string;code:string;message:string}[]=[],bad=(path:string,message:string)=>errors.push({path,code:'SHIP_RESULT',message});
  try{
    const r=structuredClone(input);if(!object(r))throw Error('Нужен объект результата');exactFields(r,['runId','spec','state','metrics','signatures','channels','buckets','events','retention','status','checkpoint',...(Object.hasOwn(r,'referenceMeasurements')?['referenceMeasurements']:[])],'ship result');
    const spec=validateRunSpecV3(r.spec);if(!spec.ok)return spec as ValidationResult<RunResultV3>;
    const mission=!!spec.value.mission;
    const state=validateStateV3(r.state,spec.value.resolvedShip);if(!state.ok)return state as ValidationResult<RunResultV3>;
    if(state.value.modelVersion!==spec.value.modelVersion)bad('state.modelVersion','Model tag не соответствует spec');
    if(mission){const policy=validateMissionStatePolicy(spec.value,state.value);if(!policy.ok)return policy as ValidationResult<RunResultV3>;}
    if(Object.hasOwn(r,'referenceMeasurements'))validateShipReferences(r.referenceMeasurements,spec.value,state.value.timeSeconds);
    if(typeof r.runId!=='string'||!r.runId)bad('runId','Нужен ID опыта');
    if(!['complete','paused','cancelled'].includes(r.status))bad('status','Неизвестный status');
    if(state.value.timeSeconds<spec.value.initialState.timeSeconds||state.value.timeSeconds>spec.value.durationSeconds||r.status==='complete'&&state.value.timeSeconds!==spec.value.durationSeconds&&!(mission&&state.value.mission?.terminalReason))bad('state.timeSeconds','Время результата вне собственного горизонта');
    const phase=spec.value.scenario.phases[state.value.phaseIndex];if(!phase||!mission&&state.value.phaseElapsedSeconds>phase.durationSeconds)bad('state.phaseIndex','Фаза продолжения вне сохранённого сценария');
    exactFields(r.metrics,['usefulWorkJ','totalResidualJ','maximumTemperatureK','firstConstraint'],'ship metrics');
    for(const key of ['usefulWorkJ','totalResidualJ','maximumTemperatureK'])if(!finite(r.metrics[key])||key!=='totalResidualJ'&&r.metrics[key]<0)bad('metrics.'+key,'Нужна конечная измеренная метрика');
    if(r.metrics.firstConstraint!==null&&typeof r.metrics.firstConstraint!=='string')bad('metrics.firstConstraint','Нужен diagnostic или null');
    exactFields(r.checkpoint,['version','lastTelemetry'],'ship checkpoint');
    if(r.checkpoint.version!=='ship-checkpoint/1')bad('checkpoint.version','Неподдерживаемая версия checkpoint');
    if(!object(r.checkpoint.lastTelemetry)||Object.values(r.checkpoint.lastTelemetry).some(v=>!finite(v)))bad('checkpoint.lastTelemetry','Нужен полный конечный kernel telemetry record');
    if(r.signatures?.version==='ship-signatures/2'){
      exactFields(r.signatures,['version','last','statistics'],'ship signatures v2');
      const stats=r.signatures.statistics;exactFields(stats,['durationSeconds','completedThroughSeconds','receiverIrW','observedEmW'],'ship signature statistics');
      const duration=state.value.timeSeconds-spec.value.initialState.timeSeconds,tolerance=1e-9*Math.max(1,duration);
      if(!finite(stats.durationSeconds)||stats.durationSeconds<0||duration===0&&stats.durationSeconds!==0||Math.abs(stats.durationSeconds-duration)>tolerance||stats.completedThroughSeconds!==state.value.timeSeconds)bad('signatures.statistics','Statistics должны завершаться на собственной production границе');
      for(const name of ['receiverIrW','observedEmW']){
        const channel=stats[name];exactFields(channel,['integralJ','meanW','minW','maxW'],'ship signature statistics '+name);
        if(duration===0){
          if(channel.integralJ!==0||channel.meanW!==null||channel.minW!==null||channel.maxW!==null)bad('signatures.statistics.'+name,'Пустой интервал не содержит measured mean/extrema');
        }else{
          if(![channel.integralJ,channel.meanW,channel.minW,channel.maxW].every(value=>finite(value)&&value>=0))bad('signatures.statistics.'+name,'Нужны конечные неотрицательные measured statistics');
          else{
            const minimumTolerance=1e-9*Math.max(1,channel.meanW,channel.minW),maximumTolerance=1e-9*Math.max(1,channel.meanW,channel.maxW),joulesTolerance=1e-9*Math.max(1,channel.integralJ);
            if(channel.minW>channel.maxW||channel.meanW<channel.minW-minimumTolerance||channel.meanW>channel.maxW+maximumTolerance||Math.abs(channel.integralJ-channel.meanW*stats.durationSeconds)>joulesTolerance)bad('signatures.statistics.'+name,'Несогласованные integral/mean/min/max');
          }
        }
      }
    }else{
      exactFields(r.signatures,['version','last'],'ship signatures v1');
      if(r.signatures.version!=='ship-signatures/1')bad('signatures.version','Неподдерживаемая версия measured signatures');
    }
    if(r.signatures.last===null){if(state.value.timeSeconds!==spec.value.initialState.timeSeconds)bad('signatures.last','Отсутствует сохранённое измерение');}
    else{
      const signal=r.signatures.last;exactFields(signal,['timeSeconds','intrinsicIrW','contrastIrW','receiverIrW','rawEmW','escapedEmW','capturedEmW','observedEmW','irFluxWm2','emFluxWm2','ownAntennaTransmission','ownSensorWorkingW','paths'],'ship signal');
      if(Object.entries(signal).some(([key,value])=>key!=='paths'&&!finite(value))||signal.timeSeconds!==state.value.timeSeconds||signal.ownAntennaTransmission<0||signal.ownAntennaTransmission>1)bad('signatures.last','Нужно конечное измерение собственного времени');
      if(!Array.isArray(signal.paths))throw Error('signatures.paths: нужны сохранённые outward paths');
      const ids=new Set();for(const row of signal.paths){exactFields(row,['id','kind','absoluteIrW','contrastW','projectedContrastW','temperatureK','profile'],'signal path');exactFields(row.profile,['version','kind','aftFraction'],'signal profile');if(typeof row.id!=='string'||ids.has(row.id)||!['body','radiator','engine','generator','h2'].includes(row.kind)||![row.absoluteIrW,row.contrastW,row.projectedContrastW].every(finite)||row.absoluteIrW<0||row.temperatureK!==null&&!finite(row.temperatureK)||row.profile.version!=='radiator-ir/1'||!['omnidirectional','aft-directed'].includes(row.profile.kind)||!finite(row.profile.aftFraction)||row.profile.aftFraction<0||row.profile.aftFraction>1)bad('signatures.paths','Некорректный frozen path/profile');ids.add(row.id);}
      if(r.signatures.version==='ship-signatures/2'){
        if(state.value.timeSeconds===spec.value.initialState.timeSeconds)bad('signatures.last','Пустой v2 интервал не содержит последнего measured sample');
        else for(const name of ['receiverIrW','observedEmW']){
          const elapsed=state.value.timeSeconds-spec.value.initialState.timeSeconds;
          const channel=r.signatures.statistics[name],latest=signal[name],latestIntegralJ=latest*(mission?Math.min(1,elapsed-Math.floor(elapsed-1e-10)):spec.value.stepSeconds);
          if(![latest,channel.maxW,channel.integralJ].every(finite))continue;
          // Явный relative tolerance 1e-9 с абсолютным floor 1e-9 W/J.
          const wattsTolerance=1e-9*Math.max(1,Math.abs(latest),Math.abs(channel.maxW)),joulesTolerance=1e-9*Math.max(1,Math.abs(latestIntegralJ),Math.abs(channel.integralJ));
          const minimumTolerance=1e-9*Math.max(1,Math.abs(channel.minW),Math.abs(latest));
          if(channel.maxW<latest-wattsTolerance||channel.integralJ<latestIntegralJ-joulesTolerance||name==='observedEmW'&&finite(channel.minW)&&channel.minW>latest+minimumTolerance)bad('signatures.statistics.'+name,'Lifetime statistics не покрывают совместимый последний measured interval');
          // IR min не ограничивает last: abs/clipping в frames и после
          // секундного averaging различаются; lifetime mean тоже независим.
        }
      }
    }
    if(!Array.isArray(r.channels)||r.channels.some((v:any)=>typeof v!=='string'||!v)||new Set(r.channels).size!==r.channels.length)bad('channels','Нужны уникальные имена каналов');
    exactFields(r.retention,['policy','originalCadenceSeconds','cadenceSeconds','totalTicks','buckets','maxBuckets','estimatedBytes','maxBytes','totalEvents','droppedEvents'],'ship retention');
    const meta=r.retention;
    for(const key of ['totalTicks','buckets','maxBuckets','estimatedBytes','maxBytes','totalEvents','droppedEvents'])if(!integer(meta[key]))bad('retention.'+key,'Нужен конечный целый счётчик');
    if(typeof meta.policy!=='string'||meta.originalCadenceSeconds!==1||!finite(meta.cadenceSeconds)||meta.cadenceSeconds<1||meta.maxBuckets<2||meta.maxBuckets>50000||meta.maxBytes>128*1024*1024||meta.estimatedBytes>meta.maxBytes||meta.totalTicks!==(mission?Math.ceil(state.value.timeSeconds-spec.value.initialState.timeSeconds-1e-9):state.value.timeSeconds-spec.value.initialState.timeSeconds))bad('retention','Неверные пределы или измеренный интервал');
    if(!Array.isArray(r.buckets)||r.buckets.length!==meta.buckets||r.buckets.length>meta.maxBuckets)throw Error('buckets: нужен полный сохранённый trace');
    let previous=-Infinity,count=0;
    for(const [j,b]of r.buckets.entries()){
      exactFields(b,['startSeconds','endSeconds','count','sum','min','max'],'bucket');
      if(!finite(b.startSeconds)||!finite(b.endSeconds)||b.startSeconds<0||b.endSeconds<b.startSeconds||b.startSeconds<previous-1e-9||b.endSeconds>state.value.timeSeconds||!integer(b.count)||b.count===0)bad('buckets.'+j,'Неверный интервал/count');
      previous=b.endSeconds;count+=b.count;
      for(const key of ['sum','min','max']){
        if(!Array.isArray(b[key])&&!(b[key] instanceof Float64Array)||b[key].length!==r.channels.length||Array.from(b[key] as ArrayLike<number>).some(v=>!finite(v)))bad('buckets.'+j+'.'+key,'Нужен finite массив размерности channels');
        else b[key]=new Float64Array(b[key]);
      }
      for(let n=0;n<r.channels.length;n++){const mean=b.sum[n]/b.count,minimumTolerance=1e-8*Math.max(1,Math.abs(mean),Math.abs(b.min[n])),maximumTolerance=1e-8*Math.max(1,Math.abs(mean),Math.abs(b.max[n]));if(b.min[n]>b.max[n]||mean<b.min[n]-minimumTolerance||mean>b.max[n]+maximumTolerance)bad('buckets.'+j,'Несогласованные sum/min/max');}
    }
    if(count!==meta.totalTicks||meta.estimatedBytes!==r.buckets.length*(r.channels.length*24+1024))bad('retention','Counts/bytes не соответствуют полному trace');
    if(!Array.isArray(r.events)||r.events.length!==meta.totalEvents-meta.droppedEvents||r.events.length>20000||meta.droppedEvents!==Math.max(0,meta.totalEvents-20000))throw Error('events: неполные или несогласованные counters');
    previous=spec.value.initialState.timeSeconds;
    for(const [j,e]of r.events.entries()){exactFields(e,['timeSeconds','kind','message'],'ship event');if(!finite(e.timeSeconds)||e.timeSeconds<previous-1e-9||e.timeSeconds>state.value.timeSeconds||typeof e.kind!=='string'||typeof e.message!=='string')bad('events.'+j,'Неверное время/kind/message');previous=e.timeSeconds;}
    if(mission){
      const m=state.value.mission!,initial=spec.value.initialState.mission!,services=r.events.filter(e=>e.kind==='mission-service');
      if(m.completedTrips<initial.completedTrips||meta.droppedEvents===0&&m.completedTrips-initial.completedTrips!==services.length)bad('state.mission.completedTrips','Счётчик рейсов не соответствует завершённым service events');
      if(m.stage==='complete'&&initial.stage!=='complete'&&(!services.length||Math.abs(services.at(-1).timeSeconds-state.value.timeSeconds)>1e-6))bad('state.mission','Terminal требует последнего завершённого service endpoint');
    }
    if(errors.length)return {ok:false,errors};r.spec=spec.value;r.state=state.value;return {ok:true,value:r as RunResultV3};
  }catch(error){bad('$',error instanceof Error?error.message:'Неполный checkpoint');return {ok:false,errors};}
}
export function parseShipModelResultJson(text:string):ValidationResult<RunResultV3>{
  try{return validateShipModelResult(JSON.parse(text));}catch{return {ok:false,errors:[{path:'$',code:'SHIP_RESULT',message:'Не удалось прочитать result JSON'}]};}
}
