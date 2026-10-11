import type {RunSpecV3,StateV3} from '../model/v3/types';
import type {TickTelemetry} from '../model/types';
import type {ShipSignal} from '../signatures/ship-model';

const stepChannels=['deliveredW','requestedW','converterLossW','generatorW','independentAcceptedW','rejectedIndependentW','usefulWorkW','hostHeatW','rawEmW','escapedEmW','capturedEmW','intentionalRfW','netHeatW','bufferCaptureW','bufferReleaseW','tiCoolingW','h2CoolingW','radiationW','fieldW','totalResidualJ','engineIrExportW','temperatureK','chargeJ'];
const signalChannels=['timeSeconds','intrinsicIrW','contrastIrW','receiverIrW','rawEmW','escapedEmW','capturedEmW','observedEmW','irFluxWm2','emFluxWm2','ownAntennaTransmission','ownSensorWorkingW'] as const;
const moduleChannels=['actualW','actualMeasured','durabilityR','cooldownSeconds','thermalStopped','durabilityStopped'];
const pump=(family:string)=>family==='thermoinverter'||family==='pump-radiator';
const finite=(value:number|undefined)=>Number.isFinite(value)?value!:0;

// Registry belongs to the captured installation, never to the first observed tick.
export function shipModelChannelNames(spec:RunSpecV3):string[]{
  const ship=spec.resolvedShip;
  return [...new Set([...stepChannels,...signalChannels.map(id=>'signal:'+id),'fuelKg:diesel','fuelKg:hydrogen',
    ...Object.keys(ship.bufferCapacityJ).map(id=>'bufferJ:'+id),
    ...ship.surfaces.map(s=>'surfaceOpen:'+s.id),
    ...ship.instances.flatMap(i=>[...moduleChannels.map(name=>name+':'+i.id),...(pump(i.item.family)?['tiHotK','tiBusW','tiNetBenefitW','tiActive'].map(name=>name+':'+i.id):[])]),
  ])].sort();
}
export function observeShipModelState(spec:RunSpecV3,state:StateV3,stepTelemetry:TickTelemetry,signal:ShipSignal|null):TickTelemetry{
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
    if(pump(i.item.family))values['tiActive:'+i.id]=Number(finite(stepTelemetry['tiBusW:'+i.id])>0);
  }
  if(signal)for(const id of signalChannels)values['signal:'+id]=finite(signal[id]);
  return values;
}
