import {TICK_HZ,type GovernorTickResultV03} from '../model/governor-v03/types';
import type {RunSpecV02} from '../model/governor-v03/run-types';
export function observeGovernorV02(spec:RunSpecV02,tick:GovernorTickResultV03):Record<string,number>{
  const s=tick.state,values:Record<string,number>={timeSeconds:s.tickIndex/TICK_HZ,tickIndex:s.tickIndex,temperatureK:(s.shipEnergyJ+s.shipEnergyRemainderJ)/spec.profile.ship.heatCapacityJPerK.value,shipEnergyJ:s.shipEnergyJ+s.shipEnergyRemainderJ,chargeJ:s.electricalChargeJ,totalResidualJ:tick.ledger.energyResidualJ,usefulWorkW:tick.packages.reduce((sum,p)=>sum+p.usefulOutputJ,0)*TICK_HZ,requestedW:tick.decisions.reduce((sum,d)=>sum+d.requestedJ,0)*TICK_HZ};
  for(const b of s.bufferEnergyJByBank)values['bufferJ:'+b.id]=b.energyJ;
  for(const r of s.resourceMassKg)values['resourceKg:'+r.id]=r.massKg;
  for(const m of s.moduleStateById){values['actualW:'+m.id]=tick.packages.filter(p=>p.moduleId===m.id).reduce((sum,p)=>sum+p.usefulOutputJ,0)*TICK_HZ;values['durabilityR:'+m.id]=m.durabilityR;values['thermalStopped:'+m.id]=+m.thermalStopped;values['durabilityStopped:'+m.id]=+m.durabilityStopped;values['cooldownSeconds:'+m.id]=Math.max(0,m.cooldownUntilTick-s.tickIndex)/TICK_HZ;}
  return values;
}
export function governorChannelNamesV02(spec:RunSpecV02){return ['timeSeconds','tickIndex','temperatureK','shipEnergyJ','chargeJ','totalResidualJ','usefulWorkW','requestedW',...spec.profile.banks.map(b=>'bufferJ:'+b.id),...spec.profile.resources.map(r=>'resourceKg:'+r.id),...spec.profile.modules.flatMap(m=>['actualW:','durabilityR:','thermalStopped:','durabilityStopped:','cooldownSeconds:'].map(prefix=>prefix+m.id))];}
