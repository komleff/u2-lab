import {createMissionV2Job,advanceMissionV2Job,createFlightMemo,type MissionV2Job,type FlightMemo} from './ship-model-flight-v2';
import type {RunSpecV3,StateV3} from '../model/v3/types';
import {validateRunSpecV3} from '../model/v3/schema';
import {stepShipModelMission} from './ship-model-mission';
import {stepV3} from '../model/v3/step';
import type {TickTelemetry,LabEvent} from '../model/types';
import {Retention,EventRetention} from './retention';
import {validateShipModelResult} from '../io/ship-model-result';
import {observeShipModelStep,SHIP_SIGNATURE_VERSION,createShipSignatureStatistics,accumulateShipModelFrames,type ShipModelSignatures} from '../signatures/ship-model';
import {shipModelChannelNames,observeShipModelState,shipModelEffectivePhase} from './ship-model-telemetry';
import {captureShipReferences,type ShipReferenceMeasurements} from '../signatures/ship-reference';
export type {ShipModelSignatures} from '../signatures/ship-model';
export type ShipModelMetrics={usefulWorkJ:number;totalResidualJ:number;maximumTemperatureK:number;firstConstraint:string|null};
export type RunContextV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;signatures:ShipModelSignatures;retention:Retention;events:EventRetention;done:boolean;last:TickTelemetry;referenceMeasurementsEnabled?:boolean;referenceMeasurements?:ShipReferenceMeasurements;missionJob?:{job:MissionV2Job;modeEvents:LabEvent[]};flightMemo?:FlightMemo};
export type RunResultV3={runId:string;spec:RunSpecV3;state:StateV3;metrics:ShipModelMetrics;signatures:ShipModelSignatures;channels:string[];buckets:Retention['buckets'];events:ReturnType<EventRetention['items']>;retention:ReturnType<Retention['metadata']>&{totalEvents:number;droppedEvents:number};status:'complete'|'paused'|'cancelled';checkpoint:{version:'ship-checkpoint/1';lastTelemetry:TickTelemetry};referenceMeasurements?:ShipReferenceMeasurements};
export function createShipModelRun(runId:string,input:RunSpecV3):RunContextV3{
  const checked=validateRunSpecV3(input);if(!checked.ok)throw new Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const spec=structuredClone(checked.value);
  return {runId,spec,state:structuredClone(spec.initialState),metrics:{usefulWorkJ:0,totalResidualJ:0,maximumTemperatureK:spec.initialState.temperatureK,firstConstraint:null},signatures:{version:SHIP_SIGNATURE_VERSION,last:null,statistics:createShipSignatureStatistics(spec.initialState.timeSeconds)},retention:new Retention(shipModelChannelNames(spec)),events:new EventRetention(),done:spec.initialState.timeSeconds>=spec.durationSeconds||spec.initialState.mission?.stage==='complete',last:{},referenceMeasurementsEnabled:true};
}
export function runShipModelChunk(run:RunContextV3,maxSteps:number,wallBudgetMs=Infinity){
  const started=performance.now();let steps=0,planningPending=false;
  while(!run.done&&steps<maxSteps){
    if(performance.now()-started>=wallBudgetMs){planningPending=run.spec.mission?.version==='ship-mission/2';break;}
    const mission=!!run.spec.mission;
    const effective=shipModelEffectivePhase(run.spec,run.state,'next'),phase=effective.phase;
    let step:ReturnType<typeof stepShipModelMission>|ReturnType<typeof stepV3>,modeEvents:LabEvent[]=[];
    if(run.spec.mission?.version==='ship-mission/2'){
      if(!run.missionJob){
        // Подготовка фазы тоже private: Pending не меняет даже mode/events actual state.
        const prepared=structuredClone(run.state);prepared.phaseIndex=effective.index;prepared.phaseElapsedSeconds=effective.elapsed;
        if(effective.entering&&phase.mode!==undefined&&phase.mode!==prepared.mode){modeEvents.push({timeSeconds:prepared.timeSeconds,kind:'mode',message:prepared.mode+' → '+phase.mode});prepared.mode=phase.mode;prepared.maskingEntryTemperatureK=phase.mode==='Masking'?prepared.temperatureK:null;if(phase.mode!=='Masking')prepared.generator.permission=false;}
        run.flightMemo??=createFlightMemo(run.spec);run.missionJob={job:createMissionV2Job(run.spec,prepared,run.flightMemo),modeEvents};
      }
      const out=advanceMissionV2Job(run.missionJob.job,started+wallBudgetMs);
      if(out.kind==='pending'){planningPending=true;break;}
      if(out.kind==='numerical-error')throw Error(out.message);
      step=out.interval;modeEvents=run.missionJob.modeEvents;run.missionJob=undefined;
    }else{
    run.state.phaseIndex=effective.index;run.state.phaseElapsedSeconds=effective.elapsed;
    if(!mission&&effective.entering)run.events.add({timeSeconds:run.state.timeSeconds,kind:'phase',message:phase.id+' · '+phase.action});
    if(effective.entering&&phase.mode!==undefined&&phase.mode!==run.state.mode){
      run.events.add({timeSeconds:run.state.timeSeconds,kind:'mode',message:run.state.mode+' → '+phase.mode});
      run.state.mode=phase.mode;run.state.maskingEntryTemperatureK=phase.mode==='Masking'?run.state.temperatureK:null;
      if(phase.mode!=='Masking')run.state.generator.permission=false;
    }
      step=mission?stepShipModelMission(run.spec,run.state):stepV3(phase.environment?{...run.spec,environment:phase.environment}:run.spec,run.state,phase.requests,phase.action);
    }
    const missionEvents=mission?[...modeEvents,...(step as ReturnType<typeof stepShipModelMission>).events]:[];
    if(step.frames.length){
      if(run.signatures.version===SHIP_SIGNATURE_VERSION)run.signatures.statistics=accumulateShipModelFrames(run.spec,run.signatures.statistics,step);
      run.signatures.last=observeShipModelStep(run.spec,step);
    }
    run.state=step.state;if(!mission&&effective.fallback)run.state.phaseElapsedSeconds=run.spec.scenario.phases[run.state.phaseIndex].durationSeconds;
    run.last=observeShipModelState(run.spec,run.state,step.telemetry,run.signatures.last,step);run.metrics.usefulWorkJ+=step.telemetry.usefulWorkW??0;run.metrics.totalResidualJ+=step.telemetry.totalResidualJ??0;
    run.metrics.maximumTemperatureK=Math.max(run.metrics.maximumTemperatureK,step.state.temperatureK);
    const pendingEvents=[...missionEvents];
    for(const d of step.diagnostics.sort((a,b)=>a.timeSeconds-b.timeSeconds)){
      const message=(d.instanceId?d.instanceId+': ':'')+d.reason+(d.remainingJ===undefined?'':' ('+d.remainingJ+' J)');
      // Keep the first causal installed limiter independently of bounded event
      // retention. Do not replace it with restart-success/recovery messages.
      if(d.limiting){
        if(run.metrics.firstConstraint===null)run.metrics.firstConstraint=message;
        else if(d.reason.startsWith('thermal-')||['power-limited','cooldown','durability-stop'].includes(d.reason))continue;
      }
      pendingEvents.push({timeSeconds:d.timeSeconds,kind:d.reason,message});
    }
    for(const event of pendingEvents.sort((a,b)=>a.timeSeconds-b.timeSeconds))run.events.add(event);
    if(step.frames.length){if(!run.retention.channels.length)run.retention=new Retention(shipModelChannelNames(run.spec),run.retention.maxBuckets);run.retention.add(run.state.timeSeconds,run.last);}
    run.done=run.state.timeSeconds>=run.spec.durationSeconds||run.state.mission?.stage==='complete';steps++;
  }
  return {steps,done:run.done,state:run.state,telemetry:run.last,...(planningPending?{planningPending:true}:{})};
}
export function shipModelResult(run:RunContextV3,status:RunResultV3['status']=run.done?'complete':'paused'):RunResultV3{
  const referenceMeasurements=run.referenceMeasurementsEnabled?(run.referenceMeasurements?.intervalSeconds[1]===run.state.timeSeconds?run.referenceMeasurements:captureShipReferences(run.spec,run.state.timeSeconds,run.signatures)):undefined;
  return structuredClone({runId:run.runId,spec:run.spec,state:run.state,metrics:run.metrics,signatures:run.signatures,channels:run.retention.channels,buckets:run.retention.buckets,events:run.events.items(),retention:{...run.retention.metadata(),totalEvents:run.events.total,droppedEvents:run.events.dropped},status,checkpoint:{version:'ship-checkpoint/1',lastTelemetry:run.last},...(referenceMeasurements?{referenceMeasurements}:{})});
}
export function restoreShipModelRun(input:RunResultV3):RunContextV3{
  const checked=validateShipModelResult(input);if(!checked.ok)throw Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const saved=checked.value,run=createShipModelRun(saved.runId,saved.spec);
  run.referenceMeasurementsEnabled=Object.hasOwn(saved,'referenceMeasurements');
  if(saved.referenceMeasurements)run.referenceMeasurements=structuredClone(saved.referenceMeasurements);
  run.state=structuredClone(saved.state);run.metrics=structuredClone(saved.metrics);run.signatures=structuredClone(saved.signatures);run.last=structuredClone(saved.checkpoint.lastTelemetry);run.done=saved.state.timeSeconds>=saved.spec.durationSeconds||saved.state.mission?.stage==='complete';
  run.retention=new Retention(saved.channels,saved.retention.maxBuckets);run.retention.buckets=structuredClone(saved.buckets);run.retention.cadenceSeconds=saved.retention.cadenceSeconds;run.retention.totalTicks=saved.retention.totalTicks;
  run.events.restore(saved.events,saved.retention.totalEvents);return run;
}
