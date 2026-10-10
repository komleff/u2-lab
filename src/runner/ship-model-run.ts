import type {RunSpecV3,StateV3} from '../model/v3/types';
import {validateRunSpecV3} from '../model/v3/schema';
import {stepV3} from '../model/v3/step';
import type {TickTelemetry} from '../model/types';
import {Retention,EventRetention} from './retention';
import {validateShipModelResult} from '../io/ship-model-result';
import {observeShipModelStep,SHIP_SIGNATURE_VERSION,type ShipSignal} from '../signatures/ship-model';
export type ShipModelSignatures={version:typeof SHIP_SIGNATURE_VERSION;last:ShipSignal|null};
export type ShipModelMetrics={usefulWorkJ:number;totalResidualJ:number;maximumTemperatureK:number;firstConstraint:string|null};
export type RunContextV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;signatures:ShipModelSignatures;retention:Retention;events:EventRetention;done:boolean;last:TickTelemetry};
export type RunResultV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;signatures:ShipModelSignatures;channels:string[];buckets:Retention['buckets'];events:ReturnType<EventRetention['items']>;retention:ReturnType<Retention['metadata']>&{totalEvents:number;droppedEvents:number};status:'complete'|'paused'|'cancelled';checkpoint:{version:'ship-checkpoint/1';lastTelemetry:TickTelemetry}};
export function createShipModelRun(runId:string,input:RunSpecV3):RunContextV3{
  const checked=validateRunSpecV3(input);if(!checked.ok)throw new Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const spec=structuredClone(checked.value);
  return {runId,spec,state:structuredClone(spec.initialState),metrics:{usefulWorkJ:0,totalResidualJ:0,maximumTemperatureK:spec.initialState.temperatureK,firstConstraint:null},signatures:{version:SHIP_SIGNATURE_VERSION,last:null},retention:new Retention([]),events:new EventRetention(),done:spec.initialState.timeSeconds>=spec.durationSeconds,last:{}};
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
    run.signatures.last=observeShipModelStep(run.spec,step);Object.assign(step.telemetry,Object.fromEntries(Object.entries(run.signatures.last).filter(([,value])=>typeof value==='number').map(([key,value])=>['signal:'+key,value])));
    run.state=step.state;if(phase.id==='horizon-idle')run.state.phaseElapsedSeconds=phases[run.state.phaseIndex].durationSeconds;
    run.last=step.telemetry;run.metrics.usefulWorkJ+=step.telemetry.usefulWorkW;run.metrics.totalResidualJ+=step.telemetry.totalResidualJ;
    run.metrics.maximumTemperatureK=Math.max(run.metrics.maximumTemperatureK,step.state.temperatureK);
    for(const d of step.diagnostics){run.events.add({timeSeconds:d.timeSeconds,kind:d.reason,message:(d.instanceId?d.instanceId+': ':'')+d.reason+(d.remainingJ===undefined?'':' ('+d.remainingJ+' J)')});run.metrics.firstConstraint??=d.reason;}
    if(!run.retention.channels.length)run.retention=new Retention(Object.keys(run.last).sort(),run.retention.maxBuckets);run.retention.add(run.state.timeSeconds,run.last);
    run.done=run.state.timeSeconds>=run.spec.durationSeconds;steps++;
  }
  return {steps,done:run.done,state:run.state,telemetry:run.last};
}
export function shipModelResult(run:RunContextV3,status:RunResultV3['status']=run.done?'complete':'paused'):RunResultV3{
  return structuredClone({runId:run.runId,spec:run.spec,state:run.state,metrics:run.metrics,signatures:run.signatures,channels:run.retention.channels,buckets:run.retention.buckets,events:run.events.items(),retention:{...run.retention.metadata(),totalEvents:run.events.total,droppedEvents:run.events.dropped},status,checkpoint:{version:'ship-checkpoint/1',lastTelemetry:run.last}});
}
export function restoreShipModelRun(input:RunResultV3):RunContextV3{
  const checked=validateShipModelResult(input);if(!checked.ok)throw Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const saved=checked.value,run=createShipModelRun(saved.runId,saved.spec);
  run.state=structuredClone(saved.state);run.metrics=structuredClone(saved.metrics);run.signatures=structuredClone(saved.signatures);run.last=structuredClone(saved.checkpoint.lastTelemetry);run.done=saved.state.timeSeconds>=saved.spec.durationSeconds;
  run.retention=new Retention(saved.channels,saved.retention.maxBuckets);run.retention.buckets=structuredClone(saved.buckets);run.retention.cadenceSeconds=saved.retention.cadenceSeconds;run.retention.totalTicks=saved.retention.totalTicks;
  run.events.restore(saved.events,saved.retention.totalEvents);return run;
}
