import {ContractCheckV03,enumRule,numberRule,objectRule,listRule,textRule,validateGovernorTickInputV03,validateShipModelStateV02} from '../model/governor-v03/schema';
import {MODEL_V02,STATE_V2,GOVERNOR_VERSION,GOVERNOR_PROFILE_VERSION,TICK_HZ,TICK_SECONDS,type GovernorModeV03} from '../model/governor-v03/types';
import type {RunSpecV02,ShipModeV02} from '../model/governor-v03/run-types';

const modeMapping:Record<ShipModeV02,GovernorModeV03>={Efficient:'Normal',Masking:'Quiet',Combat:'Combat'};
export const governorModeV02=(mode:ShipModeV02)=>modeMapping[mode];
const literal=(value:unknown)=>enumRule([value],'UNKNOWN_VERSION');
const environmentRule=objectRule({temperatureK:numberRule(Number.MIN_VALUE),externalHeatingW:numberRule(),externalCoolingW:numberRule()});
export function validateRunSpecV02(input:unknown){
  const c=new ContractCheckV03();
  objectRule({schemaVersion:literal('u2-lab/4'),modelVersion:literal(MODEL_V02),stateVersion:literal(STATE_V2),governorVersion:literal(GOVERNOR_VERSION),profileVersion:literal(GOVERNOR_PROFILE_VERSION),tickHz:literal(TICK_HZ),dtSeconds:literal(TICK_SECONDS),name:textRule,durationTicks:numberRule(1,Number.MAX_SAFE_INTEGER,true),qualification:objectRule({kind:literal('synthetic'),runtimeAuthorization:literal(false),sourceRef:textRule}),profile:()=>{},initialState:()=>{},environment:environmentRule,scenario:objectRule({name:textRule,repeat:enumRule([true,false]),phases:listRule(objectRule({id:textRule,durationTicks:numberRule(1,Number.MAX_SAFE_INTEGER,true),mode:enumRule(Object.keys(modeMapping)),requests:listRule(objectRule({id:textRule,requestedW:numberRule()})),environment:(cc,v,p)=>{if(v!==null)environmentRule(cc,v,p);}}))})})(c,input,'spec');
  if(c.errors.length)return c.result<RunSpecV02>(input);
  const spec=input as RunSpecV02;
  const state=validateShipModelStateV02(spec.initialState,spec.profile);if(!state.ok)c.errors.push(...state.errors);
  if(c.errors.length)return c.result<RunSpecV02>(input);
  if(!spec.scenario.phases.length)c.bad('spec.scenario.phases','MISSING_FIELD','Нужна хотя бы одна фаза');
  if(!Number.isSafeInteger(spec.initialState.governor.tickIndex+spec.durationTicks))c.bad('spec.durationTicks','INVALID_NUMBER','Конечный tick должен оставаться safe integer');
  const cycleTicks=spec.scenario.phases.reduce((sum,p)=>sum+p.durationTicks,0);if(!Number.isSafeInteger(cycleTicks)||!Number.isSafeInteger(cycleTicks+spec.durationTicks))c.bad('spec.scenario','INVALID_NUMBER','Сумма phase ticks должна оставаться safe integer');
  if(spec.initialState.phaseIndex>=spec.scenario.phases.length||spec.initialState.phaseElapsedTicks>spec.scenario.phases[spec.initialState.phaseIndex]?.durationTicks)c.bad('spec.initialState','INVALID_NUMBER','Фаза checkpoint вне сценария');
  for(const phase of spec.scenario.phases){
    const tick=validateGovernorTickInputV03({profile:spec.profile,state:spec.initialState.governor,requestedMode:governorModeV02(phase.mode),requests:phase.requests,environment:phase.environment??spec.environment});
    if(!tick.ok)c.errors.push(...tick.errors);
  }
  return c.result<RunSpecV02>(input);
}
export function governorCursorAfterTicksV02(spec:RunSpecV02,ticks:number){
  if(ticks===0)return {phaseIndex:spec.initialState.phaseIndex,phaseElapsedTicks:spec.initialState.phaseElapsedTicks};
  const phases=spec.scenario.phases,cycle=phases.reduce((sum,p)=>sum+p.durationTicks,0),start=phases.slice(0,spec.initialState.phaseIndex).reduce((sum,p)=>sum+p.durationTicks,0)+spec.initialState.phaseElapsedTicks;
  let offset=start+ticks;if(spec.scenario.repeat)offset=(offset-1)%cycle+1;else offset=Math.min(offset,cycle);
  let phaseIndex=0;while(phaseIndex<phases.length-1&&offset>phases[phaseIndex].durationTicks){offset-=phases[phaseIndex].durationTicks;phaseIndex++;}
  return {phaseIndex,phaseElapsedTicks:offset};
}
export function requireRunSpecV02(input:unknown){const r=validateRunSpecV02(input);if(!r.ok)throw Error(r.errors.map(e=>e.path+': '+e.message).join('\n'));return r.value;}
export function governorPhaseV02(spec:RunSpecV02,state:RunSpecV02['initialState']){
  let index=state.phaseIndex,elapsed=state.phaseElapsedTicks;
  if(elapsed>=spec.scenario.phases[index].durationTicks){
    if(index+1<spec.scenario.phases.length){index++;elapsed=0;}
    else if(spec.scenario.repeat){index=0;elapsed=0;}
    else return {index,elapsed,phase:{...spec.scenario.phases[index],requests:[]},entering:false,fallback:true};
  }
  return {index,elapsed,phase:spec.scenario.phases[index],entering:elapsed===0,fallback:false};
}
