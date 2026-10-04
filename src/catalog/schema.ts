import type {RunSpec} from '../model/types';
import {capacity} from '../model/types';
export type ValidationResult<T>={ok:true;value:T}|{ok:false;errors:{path:string;code:string;message:string}[]};
export function validateRunSpec(input:unknown):ValidationResult<RunSpec>{
 const errors:{path:string;code:string;message:string}[]=[];const bad=(path:string,message:string)=>errors.push({path,code:'INVALID',message});const p=input as RunSpec;
 if(!p||typeof p!=='object')return{ok:false,errors:[{path:'$',code:'INVALID',message:'Нужен объект опыта'}]};
 if(p.schemaVersion!=='u2-lab/1')bad('schemaVersion','Неподдерживаемая версия');if(!p.modelVersion||!p.catalogVersion)bad('modelVersion','Версии обязательны');if(p.approvedBaseline!==false)bad('approvedBaseline','Этот каталог содержит экспериментальные конфигурации');
 const walk=(v:any,path:string)=>{if(typeof v==='number'){if(!Number.isFinite(v)||v<0)bad(path,'Требуется конечное неотрицательное SI число');if(!p.origins?.[path]?.sourceRef||!['canonical','derived','experimental'].includes(p.origins?.[path]?.kind))bad(path,'Отсутствует provenance параметра')}else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v))if(k!=='origins')walk(x,path?`${path}.${k}`:k)};walk(p,'');
 try{
 for(const key of ['stepSeconds','durationSeconds'] as const)if(!(p[key]>0))bad(key,'Должно быть >0 s');
 const s=p.ship;if(!(s.heatCapacityJK>0))bad('ship.heatCapacityJK','Должно быть >0 J/K');if(!(capacity(s)>0))bad('ship.accumulators','Суммарная ёмкость должна быть >0 J');
 for(const key of ['chargeEfficiency','dischargeEfficiency'] as const)if(!(s[key]>0&&s[key]<=1))bad(`ship.${key}`,'КПД (0,1]');
 if(!(p.initial.chargeJ>=0&&p.initial.chargeJ<=capacity(s)))bad('initial.chargeJ','Запас вне ёмкости');
 const ids=new Set<string>();for(const m of s.modules){if(ids.has(m.id))bad('ship.modules','Повтор id');ids.add(m.id);if(m.tankId){const t=s.tanks.find(t=>t.id===m.tankId);if(!t||t.species!==m.species)bad(`ship.modules.${m.id}.tankId`,'Бак отсутствует или несовместимый species')}if(['generator','engine','h2'].includes(m.kind)&&!m.tankId)bad(`ship.modules.${m.id}.tankId`,'Обязателен бак');if(m.efficiency>1||m.pathEfficiency>1||m.hostFraction>1||m.exportFraction>1)bad(`ship.modules.${m.id}`,'Доли должны быть ≤1');const g=m.gate;if(!(g.low<g.restartLow&&g.restartLow<g.restartHigh&&g.restartHigh<g.high&&g.workHigh<g.high))bad(`ship.modules.${m.id}.gate`,'Неверный hysteresis corridor')}
 const tanks=new Set<string>();for(const t of s.tanks){if(tanks.has(t.id))bad('ship.tanks','Повтор баков');tanks.add(t.id);const q=p.initial.fuelKg[t.id];if(!(q>=0&&q<=t.capacityKg))bad(`initial.fuelKg.${t.id}`,'Запас вне ёмкости');if(!(t.energyJKg>0))bad(`ship.tanks.${t.id}.energyJKg`,'Требуется >0 J/kg')}
 for(const[id,q]of Object.entries(p.initial.buffersJ)){const m=s.modules.find(m=>m.id===id&&m.kind==='buffer');if(!m||q>m.capacityJ)bad(`initial.buffersJ.${id}`,'Буфер отсутствует или переполнен')}
 const env=(e:RunSpec['environment'],path:string)=>{const seen=new Set<string>();if(e.solarFluxWm2>0)seen.add(e.solarSourceId);for(const x of e.directHeat){if(seen.has(x.sourceId))bad(path,'Повторный учёт energy source');seen.add(x.sourceId)}if(!['radiative','linear-fog-experiment'].includes(e.law))bad(path+'.law','Неподдерживаемый закон')};env(p.environment,'environment');
 if(!p.scenario.phases.length)bad('scenario.phases','Нужна рабочая фаза');for(const [i,ph]of p.scenario.phases.entries()){if(!(ph.durationSeconds>0)||ph.duty>1)bad(`scenario.phases.${i}`,'Положительная длительность, duty [0,1]');if(ph.environment)env(ph.environment,`scenario.phases.${i}.environment`)}
 }catch{bad('$','Отсутствует обязательное поле или неверная структура')}
 return errors.length?{ok:false,errors}:{ok:true,value:structuredClone(p)};
}
