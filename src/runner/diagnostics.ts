import type { Gate, LabEvent, ModelState, ShipConfig, StepResult } from '../model/types';
import type { ResolvedInstance } from '../fitting/types';
import type { RequestFrame, RunSpecV2, StateV2, StepResultV2 } from '../model/v2/types';
import { physicsShip } from '../model/v2/step';
import { thermalDuty } from '../model/scheduler';
import { stoppingDistance } from '../model/v2/flight';

type Operation = { id:string; label:string; gate:Gate; causeGate?:Gate; requested:boolean; thermal:number; nominal:number; actual:number; unit:string; species?:string; role?:string; capacity?:boolean; aggregate?:boolean; powerLimited?:boolean; resourceLimited?:string[]; detail?:string };
type Episode = { identity:string; bucket:number; thermal:boolean };
const n=(x:number)=>Number.isFinite(x)?x.toFixed(3):'не записано';
const side=(g:Gate,T:number)=>T<=g.low?'cold':T>=g.high?'hot':g.workLow!==undefined&&T<g.workLow?'cold':T>g.workHigh?'hot':'';
const thermalText=(g:Gate,T:number)=>side(g,T)==='cold'?`переохлаждение; T ${n(T)} K, рабочая от ${g.workLow??'не записано'} K, отключение ${g.low} K`:side(g,T)==='hot'?`недостаточно охлаждения; T ${n(T)} K, рабочая до ${g.workHigh} K, отключение ${g.high} K`:`температурный запрет удерживается; T ${n(T)} K; повторное включение ${g.restartLow}–${g.restartHigh} K`;
const wear='Повышенный износ предусмотрен правилом; численно в этой модели не рассчитывается';

// Только действительно gated операции: площадь, груз и общая батарея не являются нагрузкой.
export function gatedOperations(s:RunSpecV2):ResolvedInstance[] {
 const operations=s.resolvedShip.instances.filter(i=>i.enabled&&['engine','mining','generator','solar','h2','thermoinverter'].includes(i.item.family)||i.enabled&&i.item.family==='radiator'&&i.item.numerics.auxW>0);
 const tanks=s.resolvedShip.instances.filter(i=>i.item.family==='tank'&&i.item.species&&s.resolvedShip.resources[i.item.species].capacityKg>0&&operations.some(o=>o.item.species===i.item.species));
 // Общий typed stock использует один gate из первого установленного профиля.
 return [...operations,...tanks.filter((i,index)=>tanks.findIndex(t=>t.item.species===i.item.species)===index)];
}

export class DiagnosticObserver {
 private episodes=new Map<string,Episode>();
 private thermalEpisode=false;
 observe(phase:string,previous:ModelState,step:StepResult,operations:Operation[],native:LabEvent[]=step.events):LabEvent[] {
  const events:LabEvent[]=[],time=step.state.timeSeconds,T=previous.temperatureK;
  const emit=(kind:string,message:string,t=time)=>events.push({timeSeconds:t,kind,message:`${phase} · ${message}`});
  const active=new Set(operations.filter(o=>o.requested).map(o=>o.id));
  for(const [id] of this.episodes)if(!active.has(id))this.episodes.delete(id);
  // Native формат «ID: переход»: последний разделитель сохраняет ID с двоеточием.
  const transitionOperation=(e:LabEvent)=>operations.find(o=>!o.aggregate&&o.requested&&o.id===e.message.slice(0,e.message.lastIndexOf(': ')));
  for(const e of native.filter(e=>e.kind==='thermal-stop'||e.kind==='thermal-restart')) {
   const o=transitionOperation(e);
   if(!o)continue;
   const match=e.message.match(/при ([\d.]+) K/),at=match?Number(match[1]):T,g=o.gate;
   emit(e.kind,`${o.label} [${o.id}]: ${e.kind==='thermal-stop'?`температурный запрет (${side(g,at)==='cold'?'переохлаждение':'перегрев'})`:'Температурный запрет снят; фактическое возобновление зависит от запроса, питания и ресурса'}; T ${n(at)} K; безопасный диапазон повторного включения ${g.restartLow}–${g.restartHigh} K`,e.timeSeconds);
  }
  let hasThermal=false;
  for(const o of operations) {
   if(!o.requested||!(o.nominal>0))continue;
   const pct=100*o.actual/o.nominal,causes:string[]=[];
   if(o.thermal<1-1e-8)causes.push(side(o.causeGate??o.gate,T)||'protection');
   const stock=o.species?step.state.fuelKg[o.species]??0:undefined;
   if(stock!==undefined&&stock<=1e-10)causes.push('resource:'+o.species);
   for(const sp of o.resourceLimited??[])if(!causes.includes('resource:'+sp))causes.push('resource:'+sp);
   if(o.powerLimited)causes.push('power');
   const identity=causes.join('|'),old=this.episodes.get(o.id);
   if(!o.aggregate&&!old&&o.thermal===0&&(previous.gates[o.id]||T<=o.gate.low||T>=o.gate.high)&&!native.some(e=>e.kind==='thermal-stop'&&transitionOperation(e)===o))
    emit('thermal-stop',`${o.label} [${o.id}]: температурный запрет уже активен; ${thermalText(o.causeGate??o.gate,T)}; безопасный диапазон повторного включения ${o.gate.restartLow}–${o.gate.restartHigh} K`,previous.timeSeconds);
   if(!identity){if(old)emit('diagnostic-recovered',`${o.label} [${o.id}]: ${old.thermal?'Температурное ограничение снято / ':''}выдача восстановлена; ${pct.toFixed(1)}%${o.detail??''}`);this.episodes.delete(o.id);continue;}
   let bucket=Math.floor(pct/10);
   if(old&&identity===old.identity&&pct>=old.bucket*10-2&&pct<(old.bucket+1)*10+2)bucket=old.bucket;
   const thermal=causes.some(c=>['cold','hot','protection'].includes(c));
   if(old?.thermal&&!thermal)emit('diagnostic-thermal-recovered',`${o.label} [${o.id}]: Температурное ограничение снято; другие ограничения могут сохраняться`);
   if(!old||old.identity!==identity||old.bucket!==bucket){
    const descriptions=[thermal?thermalText(o.causeGate??o.gate,T):'',...causes.filter(c=>c.startsWith('resource:')).map(c=>`Исчерпан ${c.slice(9)}: ${n(step.state.fuelKg[c.slice(9)]??0)} кг`),causes.includes('power')?`${step.state.chargeJ>1e-10?'Запас энергии есть; доступной мощности недостаточно':'Недостаточно доступной электрической мощности'}; заряд ${n(step.state.chargeJ/1e6)} МДж; bus запрос ${n(step.telemetry.requestedW)} W, выдача ${n(step.telemetry.deliveredW)} W`:'',o.detail??''].filter(Boolean);
    emit('diagnostic'+(o.role?'-thrust':'')+(thermal?'-thermal':'')+(causes.includes('power')?'-power':'')+(causes.some(c=>c.startsWith('resource:'))?'-resource':''),`${o.label} ${pct.toFixed(1)}% [${o.id}]: ${descriptions.join(' · ')}; ${o.capacity?'доступная операция':'фактический выход'} ${n(o.actual)} / запрос ${n(o.nominal)} ${o.unit}; начало принятого интервала ${n(previous.timeSeconds)} с`);
   }
   hasThermal ||= thermal;
   this.episodes.set(o.id,{identity,bucket,thermal});
  }
  if(hasThermal&&!this.thermalEpisode)emit('diagnostic-wear',wear);
  this.thermalEpisode=hasThermal;
  return events.sort((a,b)=>a.timeSeconds-b.timeSeconds);
 }
 observeV2(s:RunSpecV2,previous:StateV2,step:StepResultV2,requests:RequestFrame,phase:string):LabEvent[] {
  const ship=physicsShip(s,previous),operations:Operation[]=[],t=step.telemetry;
  const miningRequested=step.mining.requested&&previous.cargo<ship.cargoLimitM3-1e-9&&previous.usefulWork<ship.targetLimitM3-1e-9;
  const nominalMining=s.resolvedShip.instances.filter(i=>i.enabled&&s.selectedWorkGroup.includes(i.id)).reduce((sum,i)=>sum+i.item.numerics.powerW*i.item.numerics.efficiency*(requests[i.id]??0),0);
  const actualMining=s.selectedWorkGroup.reduce((sum,id)=>sum+(t['beamW:'+id]??0),0);
  const missingSpecies=[...new Set(s.resolvedShip.instances.filter(i=>i.enabled&&i.item.species&&['generator','h2'].includes(i.item.family)&&(step.state.fuelKg[i.item.species]??0)<=1e-10).map(i=>i.item.species!))];
  let thermalMining=0;
  for(const i of s.resolvedShip.instances) {
   if(!i.enabled||['battery','cargo','buffer','tank'].includes(i.item.family))continue;
   const m=ship.modules.find(m=>m.id===i.id)!,duty=requests[i.id]??requests[i.role??'']??0;
   const thermal=thermalDuty(ship,previous,i.id),g=i.item.gate;
   const tank=i.item.species?ship.tanks.find(t=>t.species===i.item.species):undefined;
   const feedBlocked=!!tank&&(previous.gates['tank:'+tank.id]||previous.temperatureK<=tank.gate!.low||previous.temperatureK>=tank.gate!.high);
   const feedDetail=feedBlocked&&previous.fuelKg[tank!.id]>0?`; Топливо есть (${i.item.species} ${n(previous.fuelKg[tank!.id])} кг); подача ограничена температурой бака`:'';
   if(i.item.family==='mining') {
    if(!miningRequested||!(duty>0))continue;
    thermalMining+=i.item.numerics.powerW*i.item.numerics.efficiency*duty*thermal;
    operations.push({id:i.id,label:'Лазер '+i.item.label,gate:g,requested:true,thermal,nominal:i.item.numerics.powerW*i.item.numerics.efficiency*duty,actual:t['beamW:'+i.id]??0,unit:'полезных W',powerLimited:step.mining.causeSeconds.power>0,resourceLimited:step.mining.causeSeconds.resource>0?missingSpecies:[]});
   } else if(i.item.family==='engine') {
    const actual=t['forceN:'+i.id]??0,nominal=i.item.numerics.forceN*duty;
    let detail='';
    if(actual<nominal-1e-6)detail='Тяга ограничена: разгон медленнее; торможение может потребовать больше места'+(i.role==='retro'?'; снижена тормозная тяга':'');
    if(i.role==='retro'&&duty>0&&previous.mission)detail+=actual>0?`; тормозной путь ${n(stoppingDistance(previous.mission.velocityMS,previous.currentMassKg,actual/duty))} m — оценка при постоянной доступной тяге`:'; тормозная тяга недоступна, оценка пути отсутствует';
    const minimumThermal=Math.min(thermal,thermalDuty(ship,step.state,i.id));
    operations.push({id:i.id,label:'Тяга '+i.role+' · '+i.item.label,gate:g,causeGate:feedBlocked?tank!.gate:undefined,requested:duty>0,thermal:feedBlocked?0:thermal,nominal,actual,unit:'N',species:i.item.species,role:i.role,detail:detail+feedDetail,powerLimited:i.item.propulsionType==='electric'&&actual<nominal*minimumThermal-1e-5});
   } else if(i.item.family==='generator') {
    const tankBlocked=!!previous.gates['tank:'+i.item.species],fuel=(previous.fuelKg[i.item.species!]??0)>1e-10;
    operations.push({id:i.id,label:'Генератор '+i.item.label,gate:g,causeGate:feedBlocked?tank!.gate:undefined,requested:(t.requestedW??0)>0,thermal:feedBlocked?0:thermal,nominal:m.powerW*m.pathEfficiency,actual:m.powerW*m.pathEfficiency*thermal*(fuel&&!feedBlocked&&!tankBlocked?1:0),unit:'W',species:i.item.species,capacity:true,detail:'доступная мощность отдельно от фактической governor-нагрузки '+n(t.generatorW)+' W'+feedDetail});
   } else if(i.item.family==='solar') {
    const nominal=m.areaM2*s.environment.solarFluxWm2*m.efficiency,blocked=!!previous.gates[i.id]||previous.temperatureK<=g.low||previous.temperatureK>=g.high;
    operations.push({id:i.id,label:'Солнечный источник '+i.item.label,gate:g,requested:nominal>0,thermal:blocked?0:1,nominal,actual:blocked?0:nominal,unit:'W',capacity:true});
   } else if(['h2','thermoinverter','radiator'].includes(i.item.family)&&(i.item.family!=='radiator'||m.auxW>0)) {
    const working=thermal>0&&(i.item.family!=='h2'||(previous.fuelKg.hydrogen??0)>1e-10&&!previous.gates['tank:hydrogen']);
    const insufficient=working&&(t.requestedW??0)>0&&(t.deliveredW??0)<(t.protectedW??0)+(t.activeW??0)+(t.backgroundW??0)+(i.item.family==='h2'?m.auxW:i.item.family==='radiator'?m.auxW*thermal:0)-1e-6;
    operations.push({id:i.id,label:'Активное охлаждение '+i.item.label,gate:g,requested:true,thermal,nominal:1,actual:working?thermal:0,unit:'доля температурно доступной операции',species:i.item.species,capacity:true,powerLimited:insufficient,detail:`физический heat ledger: H₂ ${n(t.h2CoolingW)} W, TI ${n(t.tiCoolingW)} W, излучение ${n(t.radiationNetW)} W; питание охлаждения отдельно; пассивная площадь не умножается на процент`});
   }
  }
  if(miningRequested&&nominalMining>0&&operations.some(o=>s.selectedWorkGroup.includes(o.id))) {
   const lasers=operations.filter(o=>o.id!=='mining-group'&&s.selectedWorkGroup.includes(o.id)),g=lasers.find(o=>o.thermal<1)?.gate??lasers[0].gate;
   operations.unshift({id:'mining-group',label:'Добыча',gate:g,requested:true,aggregate:true,thermal:thermalMining/nominalMining,nominal:nominalMining,actual:actualMining,unit:'полезных W',powerLimited:step.mining.causeSeconds.power>0,resourceLimited:step.mining.causeSeconds.resource>0?missingSpecies:[],detail:'выбранные лазеры '+lasers.map(o=>o.id).join(', ')});
  }
  for(const tank of ship.tanks) {
   const providers=s.resolvedShip.instances.filter(i=>i.enabled&&i.item.species===tank.species&&i.item.family!=='tank');
   const requested=providers.some(i=>['generator','h2'].includes(i.item.family)||(requests[i.id]??requests[i.role??'']??0)>0);
   if(!requested)continue;
   const blocked=!!previous.gates['tank:'+tank.id]||previous.temperatureK<=tank.gate!.low||previous.temperatureK>=tank.gate!.high;
   const stock=step.state.fuelKg[tank.id]??0;
   operations.push({id:'tank:'+tank.id,label:'Подача '+tank.species,gate:tank.gate!,requested:true,thermal:blocked?0:1,nominal:1,actual:blocked?0:1,unit:'доля подачи',capacity:true,detail:stock>0?`Топливо есть (${tank.species} ${n(stock)} кг), подача ${blocked?'ограничена температурой бака':'доступна'}`:''});
  }
  return this.observe(phase,previous,step,operations);
 }
 observeLegacy(ship:ShipConfig,previous:ModelState,step:StepResult,requests:{moduleId:string;duty:number}[],phase:string):LabEvent[] {
  const operations:Operation[]=[],loads=ship.modules.filter(m=>m.enabled&&m.kind==='load'&&m.policy==='Active'),nominal=loads.reduce((sum,m)=>sum+m.powerW*m.efficiency*m.workPerJ*(requests.find(r=>r.moduleId===m.id)?.duty??0),0);
  for(const m of ship.modules.filter(m=>m.enabled&&m.kind!=='buffer'&&(m.kind!=='radiator'||m.auxW>0))) {
   const duty=requests.find(r=>r.moduleId===m.id)?.duty??0,thermal=thermalDuty(ship,previous,m.id);
   if(m.kind==='load'&&m.policy==='Active'){
    // В Legacy известны реальные gate edges, но индивидуальный useful output не записан.
    operations.push({id:m.id,label:'Активная нагрузка '+m.id,gate:m.gate,requested:duty>0&&previous.cargo<ship.cargoCapacity-1e-8,thermal,nominal:0,actual:0,unit:''});
    continue;
   }
   const capacity=m.kind!=='engine';
   operations.push({id:m.id,label:m.kind+' '+m.id,gate:m.gate,requested:capacity||duty>0,thermal,nominal:1,actual:thermal,unit:'доля доступной операции',capacity,detail:' · Legacy: индивидуальный фактический выход не записан'});
  }
  if(nominal>0&&previous.cargo<ship.cargoCapacity-1e-8)operations.unshift({id:'mining-group',label:'Добыча',gate:loads.find(m=>thermalDuty(ship,previous,m.id)<1)?.gate??loads[0].gate,requested:true,aggregate:true,thermal:loads.reduce((sum,m)=>sum+m.powerW*m.efficiency*m.workPerJ*(requests.find(r=>r.moduleId===m.id)?.duty??0)*thermalDuty(ship,previous,m.id),0)/nominal,nominal,actual:step.telemetry.workRate,unit:'SCU/s'});
  return this.observe(phase,previous,step,operations);
 }
}
export const replacedDiagnosticEvent=(kind:string)=>['constraint','recovered','thermal-stop','thermal-restart'].includes(kind);
