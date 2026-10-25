import type {RunResultV3} from '../../runner/ship-model-run';
import {temperatureCorridor} from '../../model/v3/thermal-control';
import type {traceChart} from './trace-chart';
type Limits=NonNullable<Parameters<typeof traceChart>[3]>;
type Bands=NonNullable<Parameters<typeof traceChart>[5]>;
// График читает паспорт измеренной установки, а не следующий draft/текущий каталог.
export function shipModelThermalFrontiers(r:Pick<RunResultV3,'spec'>):{limits:Limits;bands:Bands;note:string;individual:string}{
 const ordinary=r.spec.resolvedShip.instances.filter(i=>i.item.thermalRole==='ordinary'),cold='#6AAEE8',hot='#E58B87';
 if(!ordinary.length)return {limits:[],bands:[],note:'Нет установленных обычных модулей с общими температурными опорами.',individual:''};
 const corridor=temperatureCorridor(r.spec.resolvedShip.instances),criticalLow=Math.max(...ordinary.map(i=>i.item.gate.low)),criticalHigh=Math.min(...ordinary.map(i=>i.item.gate.high));
 const disjoint=!corridor.compatible||criticalLow>=criticalHigh;
 const behavior='Пороги отдельных модулей; пассивный теплообмен сохраняется.'+(r.spec.resolvedShip.hull.class==='Military'?' В Military Combat горячая рабочая граница не снижает мощность активных модулей, но износ растёт; собственная критическая остановка и холодное ограничение остаются.':'');
 if(disjoint)return {limits:ordinary.flatMap(i=>[i.item.gate.low,i.item.gate.workLow,i.item.gate.workHigh,i.item.gate.high].map((value,index)=>({id:'individual',instance:i.id,label:'',value,color:index<2?cold:hot}))),bands:[],note:'Нет общего рабочего температурного диапазона; показаны индивидуальные границы. '+behavior,individual:ordinary.map(i=>`${i.item.label} [${i.id}]: ${i.item.gate.low} / ${i.item.gate.workLow} / ${i.item.gate.workHigh} / ${i.item.gate.high} K`).join(' · ')};
 const owners=(key:'low'|'workLow'|'workHigh'|'high',value:number)=>ordinary.filter(i=>i.item.gate[key]===value).map(i=>`${i.item.label} [${i.id}]`).join(', ');
 const limits:Limits=[{id:'critical-low',label:'Холод: первый критический порог · '+owners('low',criticalLow),value:criticalLow,color:cold},{id:'work-low',label:'Холод: рабочая от · '+owners('workLow',corridor.coldK),value:corridor.coldK,color:cold},{id:'work-high',label:'Жар: рабочая до · '+owners('workHigh',corridor.warmK),value:corridor.warmK,color:hot},{id:'critical-high',label:'Жар: первый критический порог · '+owners('high',criticalHigh),value:criticalHigh,color:hot}];
 return {limits,bands:[{side:'cold',from:criticalLow,to:corridor.coldK,color:cold},{side:'hot',from:corridor.warmK,to:criticalHigh,color:hot}],note:`Рабочий диапазон ${corridor.coldK}–${corridor.warmK} K; первые критические пороги ${criticalLow} / ${criticalHigh} K. Включая выключенные обычные модули. `+behavior,individual:''};
}
