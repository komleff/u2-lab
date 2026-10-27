import type {RunSpecV3,StateV3} from './types';
import {exchangeAt,evaluateSurfaces,STEFAN_BOLTZMANN} from './thermal-surfaces';
import {coupledEm} from './em-ledger';
import type {stepV3Interval} from './step';
// Обесточивание сохраняет геометрию, накопленную энергию и все рабочие часы.
// RK4 считает реальную радиацию; контакт ангара не превращается в площадь.
export function stepStationService(spec:RunSpecV3,input:StateV3,durationSeconds:number):ReturnType<typeof stepV3Interval>{
  if(!Number.isFinite(durationSeconds)||durationSeconds<0)throw Error('Нужен конечный неотрицательный интервал стоянки');
  const state=structuredClone(input),ship=spec.resolvedShip,C=ship.heatCapacityJK,G=10000;
  const frames:ReturnType<typeof stepV3Interval>['frames']=[],telemetry:Record<string,number>={totalResidualJ:0};
  const bodyArea=ship.hull.bodyExchangeAreaM2*(state.bodyOpenFraction??1);
  const K=bodyArea*ship.hull.bodyEmissivity+ship.surfaces.filter(s=>!s.active||state.surfaceOpen[s.id]).reduce((n,s)=>n+s.areaM2*s.emissivity,0);
  const evaluate=(T:number)=>({body:exchangeAt(bodyArea,ship.hull.bodyEmissivity,T,300,null),surfaces:evaluateSurfaces(ship.surfaces,state.surfaceOpen,T,300,null,{}),contact:G*(T-300)});
  const rate=(T:number)=>-(STEFAN_BOLTZMANN*K*(T*T*T*T-300**4)+G*(T-300))/C;
  const avg=(values:number[])=>values.reduce((n,x,j)=>n+x*[1,2,2,1][j]/6,0);
  let left=durationSeconds;
  while(left>1e-12){
    const T=state.temperatureK,dt=Math.min(left,1,C/(G+4*STEFAN_BOLTZMANN*K*Math.max(T,300)**3)/4);
    const k1=rate(T),k2=rate(T+k1*dt/2),k3=rate(T+k2*dt/2),k4=rate(T+k3*dt);
    const samples=[T,T+k1*dt/2,T+k2*dt/2,T+k3*dt].map(evaluate);
    const body={...samples[0].body};for(const key of Object.keys(body)as (keyof typeof body)[])body[key]=avg(samples.map(x=>x.body[key]));
    const surfaces={...samples[0].surfaces,rows:samples[0].surfaces.rows.map((row,index)=>{const next={...row};for(const key of ['temperatureK','radiationW','fieldW','totalW','emittedIrW','absorbedBackgroundW']as const)next[key]=avg(samples.map(x=>x.surfaces.rows[index][key]));return next;})};
    for(const key of ['totalW','radiationW','fieldW']as const)surfaces[key]=avg(samples.map(x=>x.surfaces[key]));
    const contact=avg(samples.map(x=>x.contact)),radiation=body.radiationW+surfaces.radiationW,net=-(contact+radiation);
    state.temperatureK=T+avg([k1,k2,k3,k4])*dt;
    telemetry.totalResidualJ+=net*dt-C*(state.temperatureK-T);
    frames.push({durationSeconds:dt,body,surfaces,em:coupledEm([{id:'hull-off',kind:'consumer_input',actualW:0}],0,[],0),outwardIr:[],ownAntennaTransmission:1,ownSensorWorkingW:0});
    for(const [key,value]of Object.entries({radiationW:radiation,netHeatW:net,hangarExchangeJ:contact,dockSeconds:1}))telemetry[key]=(telemetry[key]??0)+value*dt;
    left-=dt;
  }
  for(const key of ['deliveredW','requestedW','generatorW','hostHeatW','converterLossW','h2CoolingW','tiCoolingW','usefulWorkW'])telemetry[key]=0;
  for(const i of ship.instances)telemetry['actualW:'+i.id]=0;
  state.timeSeconds=input.timeSeconds+durationSeconds;state.phaseElapsedSeconds=input.phaseElapsedSeconds+durationSeconds;
  state.governor={...state.governor,coolingStageId:null,heatingStageId:null,recoveringBuffer:false};
  telemetry.temperatureK=state.temperatureK;telemetry.chargeJ=state.chargeJ;
  return {state,telemetry,frames,diagnostics:[]};
}
