import type {RunSpecV02,GovernorRunMetricsV02,GovernorCheckpointV02} from '../model/governor-v03/run-types';
import {TICK_HZ,type ShipModelStateV02} from '../model/governor-v03/types';
import {stepGovernorV03} from '../model/governor-v03/governor';
import {Retention,EventRetention} from './retention';
import {governorModeV02,governorPhaseV02,requireRunSpecV02} from './ship-model-v02-adapter';
import {observeGovernorV02,governorChannelNamesV02} from './ship-model-telemetry-v02';
import {validateShipModelResultV02} from '../io/ship-model-result-v02';

export type RunContextV02={runId:string;spec:RunSpecV02;state:ShipModelStateV02;metrics:GovernorRunMetricsV02;retention:Retention;events:EventRetention;checkpoint:GovernorCheckpointV02;done:boolean};
export type RunResultV02={version:'ship-result/0.2';runId:string;spec:RunSpecV02;state:ShipModelStateV02;metrics:GovernorRunMetricsV02;channels:string[];buckets:Retention['buckets'];events:ReturnType<EventRetention['items']>;retention:ReturnType<Retention['metadata']>&{totalEvents:number;droppedEvents:number};status:'complete'|'paused'|'cancelled';checkpoint:GovernorCheckpointV02};
export function createShipModelRunV02(runId:string,input:unknown):RunContextV02{
  const spec=requireRunSpecV02(input);return {runId,spec,state:structuredClone(spec.initialState),metrics:{ticks:0,usefulWorkJ:0,totalResidualJ:0,maximumTemperatureK:(spec.initialState.governor.shipEnergyJ+spec.initialState.governor.shipEnergyRemainderJ)/spec.profile.ship.heatCapacityJPerK.value,firstConstraint:null},retention:new Retention(governorChannelNamesV02(spec)),events:new EventRetention(),checkpoint:{version:'ship-checkpoint/0.2',lastTelemetry:{},lastTick:null,restartAuthorizationsSinceTick:[]},done:false};
}
export function runShipModelChunkV02(run:RunContextV02,maxSteps:number,wallBudgetMs=Infinity){
  const started=performance.now();let steps=0;
  while(!run.done&&steps<maxSteps&&performance.now()-started<wallBudgetMs){
    const current=governorPhaseV02(run.spec,run.state),phase=current.phase,time=run.state.governor.tickIndex/TICK_HZ;
    const tick=stepGovernorV03({profile:run.spec.profile,state:run.state.governor,requestedMode:governorModeV02(phase.mode),requests:phase.requests,environment:phase.environment??run.spec.environment});
    if(current.entering)run.events.add({timeSeconds:time,kind:'phase',message:phase.id+' · '+phase.mode});
    for(const d of tick.decisions)if(d.reason!=='idle'){const message=d.moduleId+': '+d.reason;run.events.add({timeSeconds:tick.state.tickIndex/TICK_HZ,kind:d.reason,message});run.metrics.firstConstraint??=message;}
    run.state={...run.state,phaseIndex:current.index,phaseElapsedTicks:current.fallback?current.elapsed:current.elapsed+1,governor:tick.state};
    const telemetry=observeGovernorV02(run.spec,tick);run.checkpoint={version:'ship-checkpoint/0.2',lastTelemetry:telemetry,lastTick:tick,restartAuthorizationsSinceTick:[]};
    run.metrics.ticks++;run.metrics.usefulWorkJ+=tick.packages.reduce((sum,p)=>sum+p.usefulOutputJ,0);run.metrics.totalResidualJ+=tick.ledger.energyResidualJ;run.metrics.maximumTemperatureK=Math.max(run.metrics.maximumTemperatureK,telemetry.temperatureK);
    run.retention.add(tick.state.tickIndex/TICK_HZ,telemetry);run.done=run.metrics.ticks>=run.spec.durationTicks;steps++;
  }
  return {steps,done:run.done,state:run.state,telemetry:run.checkpoint.lastTelemetry};
}
export function shipModelResultV02(run:RunContextV02,status:RunResultV02['status']=run.done?'complete':'paused'):RunResultV02{
  return structuredClone({version:'ship-result/0.2',runId:run.runId,spec:run.spec,state:run.state,metrics:run.metrics,channels:run.retention.channels,buckets:run.retention.buckets,events:run.events.items(),retention:{...run.retention.metadata(),totalEvents:run.events.total,droppedEvents:run.events.dropped},status,checkpoint:run.checkpoint});
}
export function restoreShipModelRunV02(input:unknown):RunContextV02{
  const checked=validateShipModelResultV02(input);if(!checked.ok)throw Error(checked.errors.map(e=>e.path+': '+e.message).join('\n'));
  const saved=checked.value,run=createShipModelRunV02(saved.runId,saved.spec);run.state=structuredClone(saved.state);run.metrics=structuredClone(saved.metrics);run.checkpoint=structuredClone(saved.checkpoint);run.done=saved.metrics.ticks===saved.spec.durationTicks;
  run.retention=new Retention(saved.channels,saved.retention.maxBuckets);run.retention.buckets=structuredClone(saved.buckets);run.retention.cadenceSeconds=saved.retention.cadenceSeconds;run.retention.totalTicks=saved.retention.totalTicks;run.events.restore(saved.events,saved.retention.totalEvents);return run;
}
