import type { EnvironmentV3, RunSpecV3, StateV3 } from './types';
import type { TickTelemetry } from '../types';
import type { ActualElectricalStage } from '../../signatures/em-cs';
import { resolveElectrical } from './power';
import { coupledEm } from './em-ledger';
import { bufferFlow, advanceBuffer, type BufferInput } from './buffer';
import { exchangeAt, evaluateSurfaces } from './thermal-surfaces';
import { solveThermoinverter } from './thermoinverter';
import { allocateCascade, authorizedDuty, temperatureCorridor, thermalAvailability, type ThermalStage } from './thermal-control';
import { heatingOrder } from './heating';

// Явные balance candidates, не канонические ТТХ или continuation defaults.
export const CONTROLLER_CANDIDATES={chargeEfficiency:0.9,dischargeEfficiency:0.9,narrowOffsets:true,
  origin:{kind:'experimental' as const,unit:'1',sourceRef:'docs/gdd/gdd_ship_energy_thermal_model_v0.1.md §§4.1,4.3; frozen Lab accumulator efficiency anchor',note:'η=.9 и сжатие offsets требуют balance evidence; не канон'}};
type Controls={active:number;ti:number;capture:number;release:number;h2:number;furnace:number;electric:number};
const zero=():Controls=>({active:0,ti:0,capture:0,release:0,h2:0,furnace:0,electric:0});
export type StepDiagnostic={instanceId?:string;reason:string;timeSeconds:number;remainingJ?:number};
type PhaseAction=RunSpecV3['scenario']['phases'][number]['action'];

function flows(spec:RunSpecV3,state:StateV3,requests:Record<string,number>,c:Controls,env:EnvironmentV3){
  const ship=spec.resolvedShip,T=state.temperatureK;
  const availability=Object.fromEntries(ship.instances.map(i=>[i.id,i.enabled?thermalAvailability(i.item,state.modules[i.id],T,ship.hull.class,state.mode).factor:0]));
  const duty=Object.fromEntries(ship.instances.map(i=>[i.id,authorizedDuty(i.item,state.mode,requests[i.id]??(['sensor','shielding','shell'].includes(i.item.family)?1:0)).duty*availability[i.id]]));
  const consumers=ship.instances.filter(i=>['mining','engine','sensor','shielding','shell','gyrodyne','radar','transmitter'].includes(i.item.family));
  const electricalConsumers=consumers.filter(i=>i.item.family!=='engine'||i.item.propulsionType==='electric');
  const baseLoad=ship.hull.hullPowerW+electricalConsumers.reduce((n,i)=>n+(i.item.numerics.powerW??0)*duty[i.id],0);
  const solar=ship.instances.filter(i=>i.item.family==='solar').map(i=>({i,powerW:env.solarFluxWm2*i.item.numerics.areaM2*i.item.numerics.efficiency*availability[i.id]}));
  const solarW=solar.reduce((n,x)=>n+x.powerW,0),externalW=env.energyInputs.filter(x=>x.representation==='electric').reduce((n,x)=>n+x.powerW,0),independentSupplyW=solarW+externalW;
  const generators=ship.instances.filter(i=>i.item.family==='generator'&&state.fuelKg[i.item.species!]>0);
  const generatorMaximumW=generators.reduce((n,i)=>n+i.item.numerics.powerW*availability[i.id],0);
  const active=ship.instances.filter(i=>i.item.family==='radiator'&&i.item.surfaces.some(s=>s.active));
  const heaters=ship.instances.filter(i=>i.item.family==='electric-heater'),furnaces=ship.instances.filter(i=>i.item.family==='furnace'&&state.mode!=='Masking'&&state.fuelKg[i.item.species!]>0);
  const h2=ship.instances.filter(i=>i.item.family==='h2'&&state.mode!=='Masking'&&state.fuelKg.hydrogen>0);
  const pumps=ship.instances.filter(i=>['thermoinverter','pump-radiator'].includes(i.item.family)&&state.mode!=='Masking'&&availability[i.id]>0);
  const surfaceOwner=(id:string)=>ship.instances.find(i=>id.startsWith(i.id+':'));
  const naturalUseful=(s:typeof ship.surfaces[number])=>exchangeAt(s.areaM2,s.emissivity,T,env.radiativeBackgroundK,env.thermalField).totalW>0;
  // Остановленный насос не телепортирует/закрывает уже открытые панели: они
  // остаются direct, пока signed обмен полезен. Masking закрывает их явно.
  const heldOpen=(s:typeof ship.surfaces[number])=>s.active&&!!state.surfaceOpen[s.id]&&(availability[surfaceOwner(s.id)?.id??'']??0)===0&&naturalUseful(s)&&state.mode!=='Masking';
  const open:Record<string,boolean>={};
  for(const s of ship.surfaces){const owner=surfaceOwner(s.id);open[s.id]=!s.active||heldOpen(s)||(state.mode!=='Masking'&&!!owner&&availability[owner.id]>0&&(c.active>0&&naturalUseful(s)||c.ti>0));}
  const panelDuty=(id:string)=>{const s=ship.surfaces.find(s=>s.id===id)!;return !s.active||heldOpen(s)?1:c.ti>0?1:c.active;};
  const pumpResults=(fraction:number)=>pumps.map(i=>{
    const n=i.item.numerics,owner=i.item.family==='thermoinverter'?'common-ti':i.id;
    const surfaces=ship.surfaces.filter(s=>(s.circuitOwner.kind==='common-ti'?'common-ti':s.circuitOwner.instanceId)===owner&&open[s.id]).map(s=>({...s,areaM2:s.areaM2*panelDuty(s.id)}));
    // Несколько common TI делят один circuit: только первый установленный владеет им.
    if(i.item.family==='thermoinverter'&&pumps.find(p=>p.item.family==='thermoinverter')!==i)return {i,owner,result:solveThermoinverter({...n,temperatureK:T,backgroundK:env.radiativeBackgroundK,field:env.thermalField,surfaces:[],maximumBusPowerW:0,maximumCoolingW:0,copEfficiency:n.copEfficiency,driveEfficiency:n.driveEfficiency,evaporatorConductanceWPerK:n.evaporatorConductanceWPerK,condenserConductanceWPerK:n.condenserConductanceWPerK,maximumHotK:n.maximumHotK,requestedCoolingW:0,sourceHeatPerBusW:0})};
    const sourceHeatPerBusW=generatorMaximumW>0?generators.reduce((sum,g)=>{const p=g.item.numerics;return sum+p.powerW*availability[g.id]/generatorMaximumW*((1/p.pathEfficiency-1)+(1/p.efficiency-1)*(1-p.exportFraction)/p.pathEfficiency);},0):1/CONTROLLER_CANDIDATES.dischargeEfficiency-1;
    const result=solveThermoinverter({temperatureK:T,backgroundK:env.radiativeBackgroundK,field:env.thermalField,surfaces,maximumBusPowerW:n.maximumBusPowerW*availability[i.id]*fraction,maximumCoolingW:n.maximumCoolingW*availability[i.id],copEfficiency:n.copEfficiency,driveEfficiency:n.driveEfficiency,evaporatorConductanceWPerK:n.evaporatorConductanceWPerK,condenserConductanceWPerK:n.condenserConductanceWPerK,maximumHotK:Math.min(n.maximumHotK,i.item.gate.high),requestedCoolingW:n.maximumCoolingW*availability[i.id]*c.ti,sourceHeatPerBusW});
    return {i,owner,result};
  });
  const initialPumps=pumpResults(1);
  const auxiliary=(ti:typeof initialPumps)=>active.reduce((n,i)=>n+i.item.numerics.auxW*availability[i.id]*c.active,0)+h2.reduce((n,i)=>n+i.item.numerics.auxW*availability[i.id]*c.h2,0)+furnaces.reduce((n,i)=>n+i.item.numerics.auxW*availability[i.id]*c.furnace,0)+heaters.reduce((n,i)=>n+i.item.numerics.powerW*availability[i.id]*c.electric,0)+ti.reduce((n,p)=>n+p.result.busW+(p.result.running?(p.i.item.numerics.auxW??0):0),0);
  const batteryFactor=ship.instances.filter(i=>i.item.family==='battery').reduce((n,i)=>n+i.item.numerics.capacityJ*availability[i.id],0)/ship.batteryCapacityJ;
  const electrical=(loadW:number,batteryDischargeFactor:number)=>resolveElectrical({chargeJ:state.chargeJ,capacityJ:ship.batteryCapacityJ,loadW,independentSupplyW,generatorMaximumW,chargeEfficiency:CONTROLLER_CANDIDATES.chargeEfficiency,dischargeEfficiency:CONTROLLER_CANDIDATES.dischargeEfficiency,batteryChargeFactor:batteryFactor,batteryDischargeFactor,mode:state.mode,generator:state.generator});
  const requestedLoad=baseLoad+auxiliary(initialPumps),initialElectrical=electrical(requestedLoad,batteryFactor),fraction=requestedLoad>0?initialElectrical.deliveredW/requestedLoad:1;
  const actualPumps=fraction===1?initialPumps:pumpResults(fraction);
  const fixedAux=auxiliary([])*fraction,tiBus=actualPumps.reduce((n,p)=>n+p.result.busW+(p.result.running?(p.i.item.numerics.auxW??0)*fraction:0),0);
  // Delivered budget уже ограничен температурой источника. Повторный ledger
  // снимает только фактический оплаченный запрос, не derate его второй раз.
  const el=electrical(baseLoad*fraction+fixedAux+tiBus,1);
  const stages:ActualElectricalStage[]=[{id:'hull',kind:'consumer_input',actualW:ship.hull.hullPowerW*fraction},{id:'battery-in',kind:'battery_charge',actualW:el.batteryInputW},{id:'battery-out',kind:'battery_discharge',actualW:el.batteryOutputW}];
  let hostLossBudgetW=ship.hull.hullPowerW*fraction+el.converterLossW,usefulWorkW=0,exportW=0,chemicalW=0,intentionalRfW=0;
  const fuelRate={diesel:0,hydrogen:0},actualW:Record<string,number>={},working:Record<string,number>={};
  for(const i of generators){const n=i.item.numerics,bus=generatorMaximumW>0?el.generatorW*n.powerW*availability[i.id]/generatorMaximumW:0,chem=bus/n.pathEfficiency/n.efficiency,waste=chem-bus/n.pathEfficiency;
    chemicalW+=chem;fuelRate[i.item.species!]+=chem/ship.resources[i.item.species!].energyJKg;exportW+=waste*n.exportFraction;hostLossBudgetW+=bus*(1/n.pathEfficiency-1)+waste*(1-n.exportFraction);actualW[i.id]=bus;working[i.id]=bus/n.powerW;stages.push({id:i.id,kind:'generator_output',actualW:bus});}
  for(const i of consumers){const n=i.item.numerics;
    if(i.item.family==='engine'&&i.item.propulsionType!=='electric'){
      const sp=i.item.propulsionType as 'diesel'|'hydrogen',mass=state.fuelKg[sp]>0?n.forceN*n.alpha*duty[i.id]:0,chem=mass*ship.resources[sp].energyJKg,useful=chem*n.efficiency*n.pathEfficiency,waste=chem-useful;
      chemicalW+=chem;fuelRate[sp]+=mass;exportW+=useful+waste*(1-n.hostFraction);hostLossBudgetW+=waste*n.hostFraction;actualW[i.id]=chem;working[i.id]=mass>0?duty[i.id]:0;continue;
    }
    const power=(n.powerW??0)*duty[i.id]*fraction;actualW[i.id]=power;working[i.id]=power>0?duty[i.id]*fraction:0;stages.push({id:i.id,kind:'consumer_input',actualW:power});
    if(i.item.family==='mining'){const useful=power*n.efficiency;usefulWorkW+=useful;exportW+=useful;hostLossBudgetW+=power-useful;}
    else if(i.item.family==='engine'){const useful=power*n.efficiency*n.pathEfficiency,waste=power-useful;exportW+=useful+waste*(1-n.hostFraction);hostLossBudgetW+=waste*n.hostFraction;}
    else if(i.item.family==='transmitter'||i.item.family==='radar'){intentionalRfW+=power;exportW+=power;}
    else hostLossBudgetW+=power;
  }
  for(const i of furnaces){const n=i.item.numerics,heat=n.heatingW*availability[i.id]*c.furnace*fraction,chem=heat/n.efficiency;chemicalW+=chem;fuelRate[i.item.species!]+=chem/ship.resources[i.item.species!].energyJKg;hostLossBudgetW+=heat;exportW+=chem-heat;working[i.id]=c.furnace*availability[i.id]*fraction;}
  const compressorW=actualPumps.reduce((n,p)=>n+p.result.compressorW,0),tiCoolingW=actualPumps.reduce((n,p)=>n+p.result.coolingW,0);
  hostLossBudgetW+=fixedAux+tiBus-compressorW;
  stages.push({id:'thermal-aux',kind:'consumer_input',actualW:fixedAux+tiBus});
  for(const p of actualPumps){actualW[p.i.id]=p.result.busW;working[p.i.id]=p.result.running?c.ti*availability[p.i.id]*fraction:0;}
  for(const i of active)working[i.id]=c.active*availability[i.id]*fraction;
  for(const i of heaters)working[i.id]=c.electric*availability[i.id]*fraction;
  const acceptedFraction=independentSupplyW>0?el.independentAcceptedW/independentSupplyW:0;
  const solarHeatW=solar.reduce((n,s)=>n+s.powerW*acceptedFraction*(1/s.i.item.numerics.efficiency-1),0);hostLossBudgetW+=solarHeatW;
  const shields=ship.instances.filter(i=>i.item.family==='shielding'&&availability[i.id]>0&&fraction>0).map(i=>i.item.numerics.emTransmission);
  const em=coupledEm(stages,hostLossBudgetW,shields,intentionalRfW);
  const shellFraction=ship.instances.filter(i=>i.item.family==='shell'&&availability[i.id]>0&&fraction>0).reduce((n,i)=>Math.min(1,n+i.item.numerics.managedBodyFraction),0);
  const body=exchangeAt(ship.hull.bodyExchangeAreaM2*(1-shellFraction),ship.hull.bodyEmissivity,T,env.radiativeBackgroundK,env.thermalField);
  const circuitTemperatures=Object.fromEntries(actualPumps.filter(p=>p.result.running).map(p=>[p.owner,p.result.hotK]));
  for(const s of ship.surfaces)if(s.active){const circuit=s.circuitOwner.kind==='common-ti'?'common-ti':s.circuitOwner.instanceId;open[s.id]=heldOpen(s)||state.mode!=='Masking'&&(availability[surfaceOwner(s.id)?.id??'']??0)>0&&(c.active*fraction>0&&naturalUseful(s)||circuitTemperatures[circuit]!==undefined);}
  const surfaceRows=evaluateSurfaces(ship.surfaces.map(s=>{const circuit=s.circuitOwner.kind==='common-ti'?'common-ti':s.circuitOwner.instanceId;return {...s,areaM2:s.areaM2*(!s.active||heldOpen(s)||circuitTemperatures[circuit]!==undefined?1:c.active*fraction)};}),open,T,env.radiativeBackgroundK,env.thermalField,circuitTemperatures);
  const directSurfaceW=surfaceRows.rows.filter(r=>circuitTemperatures[r.circuitId]===undefined).reduce((n,r)=>n+r.totalW,0);
  const h2CoolingW=h2.reduce((n,i)=>n+i.item.numerics.coolingW*availability[i.id]*c.h2*fraction,0);
  for(const i of h2){fuelRate.hydrogen+=i.item.numerics.coolingW*availability[i.id]*c.h2*fraction/i.item.numerics.qJKg;working[i.id]=c.h2*availability[i.id]*fraction;}
  const directHeatW=env.directHeat.reduce((n,x)=>n+x.powerW,0)+env.energyInputs.filter(x=>x.representation==='heat').reduce((n,x)=>n+x.powerW,0);
  let buffers=ship.instances.filter(i=>i.item.family==='buffer').map(i=>{const n=i.item.numerics,x:BufferInput={...state.buffers[i.id],capacityJ:ship.bufferCapacityJ[i.id],chargePowerW:n.chargePowerW,dischargePowerW:n.dischargePowerW,temperatureK:T,captureW:n.chargePowerW*c.capture*availability[i.id],releaseW:n.dischargePowerW*c.release*availability[i.id]};return {i,input:x,flow:bufferFlow(x)};});
  const touching=buffers.filter(b=>b.flow.rateStoredJPerS<0&&T>=b.input.minimumCaptureK!),touchingW=touching.reduce((n,b)=>n-b.flow.rateStoredJPerS,0);
  if(touchingW>0){
    const otherReleaseW=buffers.filter(b=>!touching.includes(b)).reduce((n,b)=>n-Math.min(0,b.flow.rateStoredJPerS),0);
    const roomW=Math.max(0,body.totalW+directSurfaceW+tiCoolingW+h2CoolingW-em.hostHeatW-directHeatW-otherReleaseW),ratio=Math.min(1,roomW/touchingW);
    buffers=buffers.map(b=>{if(!touching.includes(b))return b;const input={...b.input,releaseW:b.input.releaseW*ratio};return {...b,input,flow:bufferFlow(input)};});
  }
  const bufferRateW=buffers.reduce((n,b)=>n+b.flow.rateStoredJPerS,0);
  const netHeatW=em.hostHeatW+directHeatW-body.totalW-directSurfaceW-tiCoolingW-h2CoolingW-bufferRateW;
  const inputW=chemicalW+el.independentAcceptedW+solarHeatW+directHeatW;
  const outputW=exportW+em.escapedEmW+body.totalW+surfaceRows.totalW+h2CoolingW;
  return {el,em,body,surfaceRows,open,actualPumps,availability,working,actualW,fuelRate,buffers,netHeatW,inputW,outputW,usefulWorkW,tiCoolingW,h2CoolingW,bufferRateW,requestedLoad,fraction};
}

function chooseControls(spec:RunSpecV3,state:StateV3,requests:Record<string,number>,env:EnvironmentV3,action:PhaseAction){
  const corridor=temperatureCorridor(spec.resolvedShip.instances),base=flows(spec,state,requests,zero(),env),T=state.temperatureK;
  if(!corridor.compatible)return {controls:zero(),coolingStageId:null,heatingStageId:null,recoveringBuffer:false,incompatible:true,heatingUnavailable:false};
  const delta=CONTROLLER_CANDIDATES.narrowOffsets?Math.min(10,(corridor.warmK-corridor.coldK)/12):10;
  const debt=Object.values(state.buffers).some(b=>b.storedJ>0),captureK=state.mode==='Masking'?state.maskingEntryTemperatureK!:corridor.warmK-delta;
  type Stage={id:string;key:keyof Controls;setpointK:number;heatSource?:boolean};
  let direction:'cooling'|'heating'='cooling',stages:Stage[];
  if(state.mode==='Masking')stages=[{id:'masking-buffer',key:'capture',setpointK:captureK}];
  else if(state.mode==='Combat')stages=[{id:'combat-group',key:'active',setpointK:corridor.warmK-6*delta},{id:'buffer-absorb',key:'capture',setpointK:captureK}];
  else stages=[{id:'active-radiator',key:'active',setpointK:corridor.warmK-5*delta},{id:'common-ti',key:'ti',setpointK:corridor.warmK-2*delta},{id:'buffer-absorb',key:'capture',setpointK:captureK},{id:'h2',key:'h2',setpointK:corridor.warmK}];
  const marker=Math.min(...Object.values(state.buffers).filter(b=>b.storedJ>0).map(b=>b.minimumCaptureK!));
  const recovery=debt&&state.mode!=='Masking'&&(action==='recovery'||base.netHeatW<0);
  if(recovery){const releaseK=Math.min(marker,state.mode==='Combat'?corridor.warmK-6*delta:corridor.warmK-5*delta);stages=stages.filter(s=>s.key!=='capture');stages.push({id:'buffer-release',key:'release',setpointK:releaseK,heatSource:true});}
  if(!recovery&&base.netHeatW<0&&T<=corridor.coldK+3*delta){
    direction='heating';const gen=spec.resolvedShip.instances.find(i=>i.enabled&&i.item.family==='generator');
    stages=[{id:'buffer-release',key:'release',setpointK:corridor.coldK+3*delta},...heatingOrder(gen?.item.species??null,state.mode).map((kind,index)=>({id:kind,key:(kind==='furnace'?'furnace':'electric') as keyof Controls,setpointK:corridor.coldK+(2-index)*delta}))];
  }
  const apply=(c:Controls,s:Stage,level:number)=>{c[s.key]=level;if(s.id==='combat-group'){c.ti=level;c.h2=level;}return c;};
  // Available maxima включают реальные source/aux/EM losses; один physical evaluator
  // используется и здесь, и при исполнении frozen решения.
  const candidates:ThermalStage[]=[],prefix=zero();let previous=base.netHeatW;
  for(const s of stages){apply(prefix,s,1);const next=flows(spec,state,requests,prefix,env).netHeatW;const maximumW=Math.max(0,(next-previous)*(direction==='heating'||s.heatSource?1:-1));candidates.push({...s,maximumW});previous=next;}
  const allocation=allocateCascade({temperatureK:T,heatCapacityJK:spec.resolvedShip.heatCapacityJK,netHeatW:base.netHeatW,durationSeconds:1,direction,stages:candidates});
  let c=zero();
  for(const s of stages){const requested=allocation.requests[s.id],maximum=candidates.find(x=>x.id===s.id)!.maximumW;if(requested<=0||maximum<=0)continue;if(requested>=maximum){apply(c,s,1);continue;}
    const before=flows(spec,state,requests,c,env).netHeatW,sign=direction==='heating'||s.heatSource?1:-1;let lo=0,hi=1;
    for(let i=0;i<32;i++){const middle=(lo+hi)/2,trial=flows(spec,state,requests,apply({...c},s,middle),env),effect=(trial.netHeatW-before)*sign;if(effect<requested)lo=middle;else hi=middle;}
    c=apply(c,s,hi);
  }
  return {controls:c,coolingStageId:direction==='cooling'?allocation.regulatingStageId:null,heatingStageId:direction==='heating'?allocation.regulatingStageId:null,recoveringBuffer:recovery,incompatible:false,heatingUnavailable:direction==='heating'&&allocation.regulatingStageId===null};
}

export function stepV3(spec:RunSpecV3,input:StateV3,requests:Record<string,number>,action:PhaseAction='work'){
  const state=structuredClone(input),env=spec.environment,diagnostics:StepDiagnostic[]=[],telemetry:TickTelemetry={};
  const frames:{durationSeconds:number;body:ReturnType<typeof exchangeAt>;surfaces:ReturnType<typeof evaluateSurfaces>;em:ReturnType<typeof coupledEm>}[]=[];
  const updateGates=()=>{for(const i of spec.resolvedShip.instances){const m=state.modules[i.id],a=thermalAvailability(i.item,m,state.temperatureK,spec.resolvedShip.hull.class,state.mode);m.thermalStopped=a.thermalStopped;}};
  updateGates();
  for(const i of spec.resolvedShip.instances)if((requests[i.id]??0)>0&&authorizedDuty(i.item,state.mode,requests[i.id]).duty===0)diagnostics.push({instanceId:i.id,reason:'masking-forbidden',timeSeconds:state.timeSeconds});
  const chosen=chooseControls(spec,state,requests,env,action);state.governor={coolingStageId:chosen.coolingStageId,heatingStageId:chosen.heatingStageId,recoveringBuffer:chosen.recoveringBuffer};
  if(chosen.incompatible)diagnostics.push({reason:'incompatible-temperature-corridor',timeSeconds:state.timeSeconds});
  if(chosen.heatingUnavailable)diagnostics.push({reason:'heating-unavailable',timeSeconds:state.timeSeconds});
  const add=(key:string,value:number,dt:number)=>{telemetry[key]=(telemetry[key]??0)+value*dt;};
  let left=1,segments=0;
  while(left>1e-12){
    if(++segments>128)throw new Error('v3 event clipping did not converge');
    const r=flows(spec,state,requests,chosen.controls,env);let dt=left;
    const boundaries:{seconds:number;instanceId?:string;reason:string;temperatureK?:number}[]=[];
    if(Number.isFinite(r.el.depletionSeconds)&&r.el.depletionSeconds>0)boundaries.push({seconds:r.el.depletionSeconds,reason:'battery-empty'});
    for(const sp of ['diesel','hydrogen']as const)if(r.fuelRate[sp]>0)boundaries.push({seconds:state.fuelKg[sp]/r.fuelRate[sp],reason:'fuel-empty:'+sp});
    for(const b of r.buffers)if(Number.isFinite(b.flow.limitSeconds)&&b.flow.limitSeconds>0)boundaries.push({seconds:b.flow.limitSeconds,instanceId:b.i.id,reason:b.flow.rateStoredJPerS>0?'buffer-full':'buffer-empty'});
    const temperatureRate=r.netHeatW/spec.resolvedShip.heatCapacityJK;
    if(temperatureRate>0)for(const b of r.buffers)if(b.flow.rateStoredJPerS<0&&b.input.minimumCaptureK!>state.temperatureK)boundaries.push({seconds:(b.input.minimumCaptureK!-state.temperatureK)/temperatureRate,instanceId:b.i.id,reason:'capture-temperature-contact',temperatureK:b.input.minimumCaptureK!});
    for(const i of spec.resolvedShip.instances){if(!i.enabled||state.modules[i.id].thermalStopped)continue;const boundary=temperatureRate>0?i.item.gate.high:i.item.gate.low,seconds=(boundary-state.temperatureK)/temperatureRate;if(seconds>0&&Number.isFinite(seconds))boundaries.push({seconds,instanceId:i.id,reason:temperatureRate>0?'critical-hot':'critical-cold',temperatureK:boundary});}
    for(const b of boundaries)if(b.seconds>0)dt=Math.min(dt,b.seconds);
    if(!(dt>0))throw new Error('nonpositive v3 event interval');
    frames.push({durationSeconds:dt,body:r.body,surfaces:r.surfaceRows,em:r.em});
    const beforeT=state.temperatureK;state.temperatureK+=temperatureRate*dt;
    state.chargeJ=Math.max(0,Math.min(spec.resolvedShip.batteryCapacityJ,state.chargeJ+r.el.chargeRateJPerS*dt));state.generator=r.el.generator;
    for(const sp of ['diesel','hydrogen']as const)state.fuelKg[sp]=Math.max(0,state.fuelKg[sp]-r.fuelRate[sp]*dt);
    for(const b of r.buffers){const next=advanceBuffer(b.input,b.flow,dt,state.temperatureK);state.buffers[b.i.id]={storedJ:next.storedJ,minimumCaptureK:next.minimumCaptureK};if(b.flow.reason)diagnostics.push({instanceId:b.i.id,reason:b.flow.reason,timeSeconds:state.timeSeconds,remainingJ:next.storedJ});}
    for(const i of spec.resolvedShip.instances){const m=state.modules[i.id],a=thermalAvailability(i.item,m,beforeT,spec.resolvedShip.hull.class,state.mode);m.cooldownSeconds=Math.max(0,m.cooldownSeconds-dt);const work=(r.working[i.id]??0)*dt;
      if(work>0){m.durabilityR-=i.item.durability.wearPerWorkSecond*a.wearMultiplier*work;if(m.durabilityR<0&&!m.firstNegativeCrossing){m.firstNegativeCrossing=true;m.cooldownSeconds=i.item.durability.cooldownSeconds;diagnostics.push({instanceId:i.id,reason:'first-negative-crossing',timeSeconds:state.timeSeconds+dt});}}
    }
    state.surfaceOpen=r.open;
    for(const [key,value]of Object.entries({deliveredW:r.el.deliveredW,requestedW:r.requestedLoad,converterLossW:r.el.converterLossW,generatorW:r.el.generatorW,independentAcceptedW:r.el.independentAcceptedW,rejectedIndependentW:r.el.rejectedIndependentW,usefulWorkW:r.usefulWorkW,hostHeatW:r.em.hostHeatW,rawEmW:r.em.rawEmW,escapedEmW:r.em.escapedEmW,capturedEmW:r.em.capturedEmW,intentionalRfW:r.em.intentionalRfW,netHeatW:r.netHeatW,bufferCaptureW:Math.max(0,r.bufferRateW),bufferReleaseW:Math.max(0,-r.bufferRateW),tiCoolingW:r.tiCoolingW,h2CoolingW:r.h2CoolingW,radiationW:r.body.radiationW+r.surfaceRows.radiationW,fieldW:r.body.fieldW+r.surfaceRows.fieldW,totalResidualJ:r.inputW-r.outputW-r.el.chargeRateJPerS-r.netHeatW-r.bufferRateW}))add(key,value,dt);
    for(const [id,power]of Object.entries(r.actualW))add('actualW:'+id,power,dt);
    for(const p of r.actualPumps){add('tiHotK:'+p.i.id,p.result.hotK,dt);add('tiBusW:'+p.i.id,p.result.busW,dt);add('tiNetBenefitW:'+p.i.id,p.result.netBenefitW,dt);}
    for(const b of boundaries)if(Math.abs(b.seconds-dt)<=1e-10*Math.max(1,dt)){if(b.temperatureK!==undefined){state.temperatureK=b.temperatureK;if(b.reason!=='capture-temperature-contact')state.modules[b.instanceId!].thermalStopped=true;}diagnostics.push({instanceId:b.instanceId,reason:b.reason,timeSeconds:state.timeSeconds+dt});}
    left-=dt;state.timeSeconds=input.timeSeconds+(1-left);updateGates();
  }
  state.timeSeconds=input.timeSeconds+1;state.phaseElapsedSeconds=input.phaseElapsedSeconds+1;
  telemetry.temperatureK=state.temperatureK;telemetry.chargeJ=state.chargeJ;
  for(const[id,b]of Object.entries(state.buffers)){telemetry['bufferJ:'+id]=b.storedJ;if(chosen.recoveringBuffer&&b.storedJ>0&&state.temperatureK>b.minimumCaptureK!)diagnostics.push({instanceId:id,reason:'hotter-than-capture',timeSeconds:state.timeSeconds,remainingJ:b.storedJ});}
  return {state,telemetry,diagnostics,frames};
}
