import type {RunSpecV3,StateV3} from '../model/v3/types';
import type {TickTelemetry} from '../model/types';
import type {ShipSignal} from '../signatures/ship-model';

const stepChannels=['deliveredW','requestedW','converterLossW','generatorW','independentAcceptedW','rejectedIndependentW','usefulWorkW','hostHeatW','rawEmW','escapedEmW','capturedEmW','intentionalRfW','netHeatW','bufferCaptureW','bufferReleaseW','tiCoolingW','h2CoolingW','radiationW','fieldW','totalResidualJ','engineIrExportW','temperatureK','chargeJ'];
const signalChannels=['timeSeconds','intrinsicIrW','contrastIrW','receiverIrW','rawEmW','escapedEmW','capturedEmW','observedEmW','irFluxWm2','emFluxWm2','ownAntennaTransmission','ownSensorWorkingW'] as const;
const moduleChannels=['actualW','actualMeasured','durabilityR','cooldownSeconds','thermalStopped','durabilityStopped'];
const pump=(family:string)=>family==='thermoinverter'||family==='pump-radiator';
const finite=(value:number|undefined)=>Number.isFinite(value)?value!:0;

// An endpoint sample belongs to the phase just computed, not the next command.
// The fallback has no serialized phase index: its boundary is derived from the
// captured initial cursor and literal durations, so resume needs no new latch.
export function shipModelEffectivePhase(spec:RunSpecV3,state:StateV3,sample:'next'|'latest'){
  const phases=spec.scenario.phases;let index=state.phaseIndex,elapsed=state.phaseElapsedSeconds,phase=phases[index];
  const horizonStart=spec.initialState.timeSeconds+phases.slice(spec.initialState.phaseIndex).reduce((sum,p)=>sum+p.durationSeconds,0)-spec.initialState.phaseElapsedSeconds;
  const fallback=!spec.scenario.repeat&&index===phases.length-1&&elapsed>=phase.durationSeconds&&(sample==='next'||state.timeSeconds>horizonStart);
  if(fallback)return {phase:{id:'horizon-idle',action:'idle',durationSeconds:1,requests:{},environment:null} as RunSpecV3['scenario']['phases'][number],index,elapsed,entering:state.timeSeconds===horizonStart,fallback:true};
  if(sample==='next'&&elapsed>=phase.durationSeconds){index=(index+1)%phases.length;elapsed=0;phase=phases[index];}
  return {phase,index,elapsed,entering:elapsed===0,fallback:false};
}

// Registry belongs to the captured installation, never to the first observed tick.
export function shipModelChannelNames(spec:RunSpecV3):string[]{
  const ship=spec.resolvedShip;
  return [...new Set([...stepChannels,...signalChannels.map(id=>'signal:'+id),'fuelKg:diesel','fuelKg:hydrogen',
    ...Object.keys(ship.bufferCapacityJ).map(id=>'bufferJ:'+id),
    ...ship.surfaces.map(s=>'surfaceOpen:'+s.id),
    ...ship.instances.flatMap(i=>[...moduleChannels.map(name=>name+':'+i.id),...(pump(i.item.family)?['tiHotK','tiBusW','tiNetBenefitW','tiActive','tiHotMeasured'].map(name=>name+':'+i.id):[])]),
  ])].sort();
}
export function observeShipModelState(spec:RunSpecV3,state:StateV3,stepTelemetry:TickTelemetry,signal:ShipSignal|null,observation?:{frames:readonly {durationSeconds:number}[]}):TickTelemetry{
  const values:TickTelemetry=Object.fromEntries(shipModelChannelNames(spec).map(id=>[id,finite(stepTelemetry[id])]));
  values.temperatureK=finite(state.temperatureK);values.chargeJ=finite(state.chargeJ);
  for(const species of ['diesel','hydrogen'] as const)values['fuelKg:'+species]=finite(state.fuelKg[species]);
  for(const id of Object.keys(spec.resolvedShip.bufferCapacityJ))values['bufferJ:'+id]=finite(state.buffers[id]?.storedJ);
  for(const s of spec.resolvedShip.surfaces)values['surfaceOpen:'+s.id]=Number(!!state.surfaceOpen[s.id]);
  for(const i of spec.resolvedShip.instances){
    const m=state.modules[i.id];
    // A finite placeholder is not an inferred measurement. Only kernel exports
    // can mark delivered work as measured; passive/auxiliary work stays unknown.
    values['actualMeasured:'+i.id]=Number(Object.hasOwn(stepTelemetry,'actualW:'+i.id)&&Number.isFinite(stepTelemetry['actualW:'+i.id]));
    values['durabilityR:'+i.id]=finite(m?.durabilityR);values['cooldownSeconds:'+i.id]=finite(m?.cooldownSeconds);
    values['thermalStopped:'+i.id]=Number(!!m?.thermalStopped);values['durabilityStopped:'+i.id]=Number(!!m?.durabilityStopped);
    if(pump(i.item.family)){
      const active=finite(stepTelemetry['tiBusW:'+i.id])>0;
      values['tiActive:'+i.id]=Number(active);
      // Positive integrated bus proves was-active only. A single complete
      // kernel frame plus a healthy endpoint proves hot-side coverage. Any
      // clipped/unconfirmed tick stays conservative; raw kernel values remain
      // literal, never divided by inferred duty or time-active.
      values['tiHotMeasured:'+i.id]=Number(active&&observation?.frames.length===1&&observation.frames[0].durationSeconds===spec.stepSeconds&&Number.isFinite(stepTelemetry['tiHotK:'+i.id])&&!!m&&!m.thermalStopped&&!m.durabilityStopped&&m.cooldownSeconds===0);
    }
  }
  if(signal)for(const id of signalChannels)values['signal:'+id]=finite(signal[id]);
  return values;
}
