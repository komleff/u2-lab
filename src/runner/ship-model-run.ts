import type {RunSpecV3,StateV3} from '../model/v3/types';
import {validateRunSpecV3} from '../model/v3/schema';
import {stepV3} from '../model/v3/step';
import type {TickTelemetry} from '../model/types';
import {Retention,EventRetention} from './retention';
export type ShipModelMetrics={usefulWorkJ:number;totalResidualJ:number;maximumTemperatureK:number;firstConstraint:string|null};
export type RunContextV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;retention:Retention;events:EventRetention;done:boolean;last:TickTelemetry};
export type RunResultV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;channels:string[];buckets:Retention['buckets'];events:ReturnType<EventRetention['items']>;retention:ReturnType<Retention['metadata']>&{totalEvents:number;droppedEvents:number};status:'complete'|'paused'|'cancelled'};
export function createShipModelRun(runId:string,input:RunSpecV3):RunContextV3{
  const checked=validateRunSpecV3(input);if(!checked.ok)throw new Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const spec=structuredClone(checked.value);
  return {runId,spec,state:structuredClone(spec.initialState),metrics:{usefulWorkJ:0,totalResidualJ:0,maximumTemperatureK:spec.initialState.temperatureK,firstConstraint:null},retention:new Retention([]),events:new EventRetention(),done:spec.initialState.timeSeconds>=spec.durationSeconds,last:{}};
}
export function runShipModelChunk(run:RunContextV3,maxSteps:number,wallBudgetMs=Infinity){
  const started=performance.now();let steps=0;
  while(!run.done&&steps<maxSteps){
    if(performance.now()-started>=wallBudgetMs)break;
    const phases=run.spec.scenario.phases;let phase=phases[run.state.phaseIndex];
    if(run.state.phaseElapsedSeconds>=phase.durationSeconds){
      if(run.state.phaseIndex+1<phases.length||run.spec.scenario.repeat){run.state.phaseIndex=(run.state.phaseIndex+1)%phases.length;run.state.phaseElapsedSeconds=0;phase=phases[run.state.phaseIndex];}
      else phase={id:'horizon-idle',action:'idle',durationSeconds:1,requests:{},environment:null};
    }
    if(run.state.phaseElapsedSeconds===0&&phase.mode!==undefined&&phase.mode!==run.state.mode){
      run.state.mode=phase.mode;run.state.maskingEntryTemperatureK=phase.mode==='Masking'?run.state.temperatureK:null;
      if(phase.mode!=='Masking')run.state.generator.permission=false;
    }
    const step=stepV3(phase.environment?{...run.spec,environment:phase.environment}:run.spec,run.state,phase.requests,phase.action);
    run.state=step.state;if(phase.id==='horizon-idle')run.state.phaseElapsedSeconds=phases[run.state.phaseIndex].durationSeconds;
    run.last=step.telemetry;run.metrics.usefulWorkJ+=step.telemetry.usefulWorkW;run.metrics.totalResidualJ+=step.telemetry.totalResidualJ;
    run.metrics.maximumTemperatureK=Math.max(run.metrics.maximumTemperatureK,step.state.temperatureK);
    for(const d of step.diagnostics){run.events.add({timeSeconds:d.timeSeconds,kind:d.reason,message:(d.instanceId?d.instanceId+': ':'')+d.reason+(d.remainingJ===undefined?'':' ('+d.remainingJ+' J)')});run.metrics.firstConstraint??=d.reason;}
    if(!run.retention.channels.length)run.retention=new Retention(Object.keys(run.last).sort());run.retention.add(run.state.timeSeconds,run.last);
    run.done=run.state.timeSeconds>=run.spec.durationSeconds;steps++;
  }
  return {steps,done:run.done,state:run.state,telemetry:run.last};
}
export function shipModelResult(run:RunContextV3,status:RunResultV3['status']=run.done?'complete':'paused'):RunResultV3{
  return structuredClone({runId:run.runId,spec:run.spec,state:run.state,metrics:run.metrics,channels:run.retention.channels,buckets:run.retention.buckets,events:run.events.items(),retention:{...run.retention.metadata(),totalEvents:run.events.total,droppedEvents:run.events.dropped},status});
}
