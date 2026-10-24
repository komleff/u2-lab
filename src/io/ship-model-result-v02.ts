import {ContractCheckV03,enumRule,numberRule,objectRule,listRule,textRule,validateShipModelStateV02,GOVERNOR_REASONS,STAGE_IDS} from '../model/governor-v03/schema';
import {requireRunSpecV02,governorCursorAfterTicksV02} from '../runner/ship-model-v02-adapter';
import {governorChannelNamesV02,observeGovernorV02} from '../runner/ship-model-telemetry-v02';
import type {RunResultV02} from '../runner/ship-model-run-v02';
import type {Bucket} from '../runner/retention';

const signed=numberRule(-Number.MAX_VALUE),count=numberRule(0,Number.MAX_SAFE_INTEGER,true),positiveCount=numberRule(1,Number.MAX_SAFE_INTEGER,true);
const energyById=listRule(objectRule({id:textRule,energyJ:numberRule()}));
const outwardRule=listRule(objectRule({id:textRule,ownerId:textRule,kind:enumRule(['radiation','working-body','source-exhaust']),energyJ:signed,irJ:signed,emJ:signed}));
const receiptRule=objectRule({state:()=>{},packages:listRule(objectRule({id:textRule,moduleId:textRule,stage:enumRule(STAGE_IDS),usefulOutputJ:numberRule(),pickupShipJ:numberRule(),pickupByBank:energyById,electricJ:numberRule(),resourceKg:listRule(objectRule({id:textRule,massKg:numberRule()})),hostHeatJ:numberRule(),exportedAuxHeatJ:numberRule(),outward:outwardRule})),ledger:objectRule({entries:listRule(objectRule({id:textRule,ownerId:textRule,kind:enumRule(['internal-transfer','external-input','external-output','conversion']),nodeId:textRule,counterpartyId:textRule,energyJ:signed,resourceId:(c,v,p)=>{if(v!==null)textRule(c,v,p);},massKg:signed})),outward:outwardRule,energyResidualJ:signed,energyThroughputJ:numberRule(),resources:listRule(objectRule({id:textRule,residualKg:signed,throughputKg:numberRule()}))}),decisions:listRule(objectRule({id:textRule,moduleId:textRule,stage:enumRule(STAGE_IDS),reason:enumRule(GOVERNOR_REASONS),requestedJ:numberRule(),actualJ:numberRule()})),trace:objectRule({tickIndex:count,stages:listRule(enumRule(STAGE_IDS)),executionOrder:listRule(textRule,false),allocatorCalls:listRule(objectRule({id:textRule,stage:enumRule(STAGE_IDS),pass:enumRule(['preliminary','final']),direction:enumRule(['in','out']),consumerCount:count,bankCount:count,compatibilityChecks:count,allocationVisits:count,allocations:listRule(objectRule({bankId:textRule,consumerId:textRule,energyJ:numberRule()}),false)})),compatibilityChecks:count,allocationVisits:count,electricalDispatchCount:count,actualFailureChecks:count})});

export function validateShipModelResultV02(input:unknown){
  const c=new ContractCheckV03();
  objectRule({version:enumRule(['ship-result/0.2'],'UNKNOWN_VERSION'),runId:textRule,spec:()=>{},state:()=>{},metrics:objectRule({ticks:count,usefulWorkJ:numberRule(),totalResidualJ:signed,maximumTemperatureK:numberRule(Number.MIN_VALUE),firstConstraint:(cc,v,p)=>{if(v!==null)textRule(cc,v,p);}}),channels:listRule(textRule),buckets:listRule(()=>{},false),events:listRule(objectRule({timeSeconds:numberRule(),kind:textRule,message:textRule}),false),retention:objectRule({policy:textRule,originalCadenceSeconds:enumRule([1]),cadenceSeconds:numberRule(1),totalTicks:count,buckets:count,maxBuckets:numberRule(2,50000,true),estimatedBytes:count,maxBytes:enumRule([128*1024*1024]),totalEvents:count,droppedEvents:count}),status:enumRule(['complete','paused','cancelled']),checkpoint:objectRule({version:enumRule(['ship-checkpoint/0.2'],'UNKNOWN_VERSION'),lastTelemetry:()=>{},restartAuthorizationsSinceTick:listRule(textRule),lastTick:(cc,v,p)=>{if(v!==null)receiptRule(cc,v,p);}})})(c,input,'result');
  if(c.errors.length)return c.result<RunResultV02>(input);
  try{
    const r=structuredClone(input) as RunResultV02,spec=requireRunSpecV02(r.spec),state=validateShipModelStateV02(r.state,spec.profile);
    if(!state.ok){c.errors.push(...state.errors);return c.result<RunResultV02>(input);}
    const bad=(path:string,message:string)=>c.bad(path,'INVALID_EXPECTATION',message),time=r.state.governor.tickIndex/30,ticks=r.state.governor.tickIndex-spec.initialState.governor.tickIndex;
    if(r.metrics.ticks!==ticks||ticks<0||ticks>spec.durationTicks||r.status==='complete'&&ticks!==spec.durationTicks)bad('metrics.ticks','Ticks не соответствуют exact интервалу');
    if(r.state.phaseIndex>=spec.scenario.phases.length||r.state.phaseElapsedTicks>spec.scenario.phases[r.state.phaseIndex]?.durationTicks)bad('state.phaseIndex','Фаза вне сценария');
    const cursor=governorCursorAfterTicksV02(spec,ticks);if(cursor.phaseIndex!==r.state.phaseIndex||cursor.phaseElapsedTicks!==r.state.phaseElapsedTicks)bad('state.phaseIndex','Phase cursor не соответствует сохранённому tick');
    if(JSON.stringify(r.channels)!==JSON.stringify(governorChannelNamesV02(spec)))bad('channels','Каналы не соответствуют profile owners');
    if(r.retention.totalTicks!==ticks||r.retention.buckets!==r.buckets.length||r.buckets.length>r.retention.maxBuckets||r.retention.maxBuckets>Math.floor(r.retention.maxBytes/(r.channels.length*24+1024))||r.retention.estimatedBytes>r.retention.maxBytes||r.retention.estimatedBytes!==r.buckets.length*(r.channels.length*24+1024)||!Number.isInteger(Math.log2(r.retention.cadenceSeconds)))bad('retention','Нарушены bounds или tick accounting');
    let previousEnd=spec.initialState.governor.tickIndex/30,total=0;
    const buckets:Bucket[]=[];
    for(const [index,b]of r.buckets.entries()){
      const path='buckets.'+index;objectRule({startSeconds:numberRule(),endSeconds:numberRule(),count:positiveCount,sum:()=>{},min:()=>{},max:()=>{}})(c,b,path);
      if(!b||typeof b!=='object')continue;
      if(!Number.isFinite(b.startSeconds)||!Number.isFinite(b.endSeconds)||b.startSeconds> b.endSeconds||b.endSeconds>time||b.endSeconds<previousEnd||b.startSeconds<Math.floor((spec.initialState.governor.tickIndex/30)/r.retention.cadenceSeconds)*r.retention.cadenceSeconds)bad(path,'Неверный retained интервал');
      previousEnd=b.endSeconds;total+=b.count;
      for(const key of ['sum','min','max'] as const){const values=b[key];if((!Array.isArray(values)&&!(values instanceof Float64Array))||values.length!==r.channels.length||Array.from(values).some(v=>!Number.isFinite(v)))bad(path+'.'+key,'Нужны конечные SI массивы размерности channels');}
      if(c.errors.length)continue;
      for(let i=0;i<r.channels.length;i++){const mean=b.sum[i]/b.count,tolerance=1e-9*Math.max(1,Math.abs(mean));if(b.min[i]>b.max[i]||mean<b.min[i]-tolerance||mean>b.max[i]+tolerance)bad(path,'Mean/min/max не согласованы');}
      buckets.push({...b,sum:new Float64Array(b.sum),min:new Float64Array(b.min),max:new Float64Array(b.max)});
    }
    if(total!==ticks)bad('buckets','Count не равен числу выполненных ticks');
    if(r.events.length>20000||r.retention.droppedEvents!==Math.max(0,r.retention.totalEvents-20000)||r.events.length!==r.retention.totalEvents-r.retention.droppedEvents)bad('events','Неверные границы journal');
    let eventTime=spec.initialState.governor.tickIndex/30;for(const e of r.events){if(e.timeSeconds<eventTime||e.timeSeconds>time)bad('events.timeSeconds','Событие вне измеренного времени');eventTime=e.timeSeconds;}
    if(!r.checkpoint.lastTelemetry||typeof r.checkpoint.lastTelemetry!=='object'||Object.values(r.checkpoint.lastTelemetry).some(v=>typeof v!=='number'||!Number.isFinite(v)))bad('checkpoint.lastTelemetry','Требуется конечная измеренная telemetry');
    const last=r.checkpoint.lastTick;
    const authorized=new Set(r.checkpoint.restartAuthorizationsSinceTick);
    for(const id of authorized)if(!spec.profile.modules.some(m=>m.id===id))bad('checkpoint.restartAuthorizationsSinceTick','Неизвестный module ID');
    const committed=last?.state??spec.initialState.governor,controlled={...committed,moduleStateById:committed.moduleStateById.map(m=>authorized.has(m.id)?{...m,restartAuthorized:true}:m)};
    if(ticks===0){if(last!==null||Object.keys(r.checkpoint.lastTelemetry).length||JSON.stringify(r.state)!==JSON.stringify({...spec.initialState,governor:controlled}))bad('checkpoint','Нулевой checkpoint обязан совпадать с initialState + явные controls');}
    else if(!last||JSON.stringify(controlled)!==JSON.stringify(r.state.governor)||last.trace.tickIndex!==r.state.governor.tickIndex-1)bad('checkpoint.lastTick','Receipt не принадлежит последнему committed tick');
    else if(JSON.stringify(r.checkpoint.lastTelemetry)!==JSON.stringify(observeGovernorV02(spec,last)))bad('checkpoint.lastTelemetry','Telemetry не соответствует сохранённому receipt');
    if(c.errors.length)return c.result<RunResultV02>(input);return {ok:true as const,value:{...r,spec,buckets}};
  }catch(error){c.bad('$','INVALID_TYPE',String(error));return c.result<RunResultV02>(input);}
}
export function parseShipModelResultJsonV02(text:string){try{return validateShipModelResultV02(JSON.parse(text));}catch{const c=new ContractCheckV03();c.bad('$','INVALID_TYPE','Не удалось прочитать JSON результата');return c.result<RunResultV02>(null);}}
