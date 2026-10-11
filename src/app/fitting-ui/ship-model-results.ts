import type {RunResultV3} from '../../runner/ship-model-run';
import {esc,num,compactSI,groupNames} from './presentation';
import {passiveDetectionReachM} from './signature-distance';
import {OBSERVER_PRESET_IDS} from '../../signatures/presets';

const channels=[['receiverIrW','IR'],['observedEmW','EM']] as const;
const fields=[['meanW','Mean','W'],['maxW','Production max','W'],['meanRangeM','Reference range по mean','м'],['maxRangeM','Reference range по max','м']] as const;
function savedStatistics(r:RunResultV3|undefined,name:typeof channels[number][0],channel:'IR'|'EM'){
  const stats=r?.signatures.version==='ship-signatures/2'?r.signatures.statistics[name]:undefined;
  const meanW=stats?.meanW??null,maxW=stats?.maxW??null;
  const preset=OBSERVER_PRESET_IDS.find(id=>id===r?.spec.observer.presetId);
  if(r&&!preset)throw Error('Неизвестный reference observer');
  return {meanW,maxW,meanRangeM:preset?passiveDetectionReachM(meanW,preset,channel):null,maxRangeM:preset?passiveDetectionReachM(maxW,preset,channel):null};
}
function measurement(id:string,value:number|null,unit:string,delta=false){
  return `<span class="measurement-value" data-stat="${id}" data-value="${value??''}">${delta&&value!==null&&value>0?'+':''}${value===null?'—':unit==='W'?compactSI(value,'W'):num(value,unit)}</span>`;
}
const bound=(text:string)=>`<span class="measurement-value">${esc(text)}</span>`;
function statisticsTable(r:RunResultV3){
  return `<div class="ui-table-scroll" tabindex="0"><table><thead><tr><th>Сигнал</th>${fields.map(([,label,unit])=>`<th>${label}, ${unit}</th>`).join('')}</tr></thead><tbody>${channels.map(([name,channel])=>{const s=savedStatistics(r,name,channel);return `<tr><th>${channel}</th>${fields.map(([field,,unit])=>`<td>${measurement(name+':'+field,s[field],unit)}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>`;
}
function moduleCosts(r:RunResultV3){
  return `<div class="ui-table-scroll" tabindex="0"><table><thead><tr><th>Установленный модуль</th><th>Категория</th><th>Масса</th><th>Enabled</th><th>Фактическая мощность latest</th></tr></thead><tbody>${r.spec.resolvedShip.instances.map(i=>`<tr data-cost-instance="${esc(i.id)}"><th>${esc(i.item.label)} [${esc(i.id)}]</th><td>${esc(i.item.category)} / ${esc(i.item.family)}</td><td>${bound(num(i.item.materials.reduce((n,m)=>n+m.massKg,0),'кг'))}</td><td>${i.enabled?'да':'нет'}</td><td>${r.checkpoint.lastTelemetry['actualMeasured:'+i.id]===1?bound(compactSI(r.checkpoint.lastTelemetry['actualW:'+i.id],'W')):'нет измерения'}</td></tr>`).join('')}</tbody></table></div>`;
}
export function shipModelResults(r:RunResultV3){
  const t=r.checkpoint.lastTelemetry,stock=Object.values(r.state.buffers).reduce((n,b)=>n+b.storedJ,0);
  const actual=(name:string,value:number,unit:string)=>`<span data-overview="${name}" data-value="${value}">${unit==='J'?compactSI(value,'J'):num(value,unit)}</span>`;
  return `<section id="sm-results" class="ui-panel" data-run-id="${esc(r.runId)}"><h2>Overview · фактическое измерение /4</h2><div id="sm-measured-owner">${esc(r.spec.resolvedShip.hull.label)} · ревизия ${r.spec.resolvedShip.fit.fitRevision} · run ${esc(r.runId)} · ${esc(r.status)} · ${esc(r.spec.schemaVersion)} / ${esc(r.spec.modelVersion)} · интервал ${num(r.spec.initialState.timeSeconds)}–${num(r.state.timeSeconds,'с')} / горизонт ${num(r.spec.durationSeconds,'с')}</div>
  <p>Работа ${actual('usefulWorkJ',r.metrics.usefulWorkJ,'J')} · время ${actual('timeSeconds',r.state.timeSeconds-r.spec.initialState.timeSeconds,'с')} · T ${num(r.state.temperatureK,'K')} · батарея ${actual('chargeJ',r.state.chargeJ,'J')} · diesel ${actual('dieselKg',r.state.fuelKg.diesel,'кг')} · H₂ ${actual('hydrogenKg',r.state.fuelKg.hydrogen,'кг')} · buffer debt ${actual('bufferDebtJ',stock,'J')}</p>
  <p>Первое ограничение: ${esc(r.metrics.firstConstraint??'нет')} · каскад ${esc(r.state.governor.coolingStageId??r.state.governor.heatingStageId??'естественный обмен')} · recovery ${r.state.governor.recoveringBuffer?'запрошен':'не запрошен'} · фактическая выдача буфера latest ${compactSI(t.bufferReleaseW,'W')}</p>
  <details id="sm-buffer-reachability"><summary>Буферы · запас и температурное условие recovery</summary>${Object.entries(r.state.buffers).map(([id,b])=>`<p data-buffer-id="${esc(id)}">${esc(id)}: ${compactSI(b.storedJ,'J')} · minimum capture ${num(b.minimumCaptureK,'K')} · T ${num(r.state.temperatureK,'K')} · температурное условие: ${b.storedJ===0?'нет долга':b.minimumCaptureK===null?'нет измерения':r.state.temperatureK<=b.minimumCaptureK?'выполнено':'не выполнено (hotter-than-capture)'}</p>`).join('')}<p>Температурное условие не гарантирует мощность или завершение recovery; выдача и ограничения берутся только из actual ledger.</p></details>
  <h3>IR / EM · ${esc(r.signatures.version)}</h3>${r.signatures.version==='ship-signatures/1'?'<p class="warning">Старое измерение: exact statistics отсутствуют — mean/max/range не восстановлены.</p>':''}<p>Duration-weighted mean и настоящий production max: сохранённые step.frames до retention, не latest и не extrema bucket. Наблюдатель ${esc(r.spec.observer.presetId)} · ${num(r.spec.observer.rangeM,'м')} / ${num(r.spec.observer.aspectDeg,'°')} · профиль ${esc(r.spec.receiverProfile)} · фон ${num(r.spec.environment.radiativeBackgroundK,'K')}.</p>${statisticsTable(r)}
  <p>Reference range = √(W / (4π · порог собственного reference observer)). Это не полученный контакт, не утверждение о скрытности. Experimental model: параметры — кандидаты, не канонические ТТХ.</p>
  <details id="sm-costs"><summary>Фактическая цена модулей · монтаж и причинные затраты</summary><p>Установленная масса ${num(r.spec.resolvedShip.dryMassKg,'кг')} не исчезает при выключении. hostHeatW ${compactSI(t.hostHeatW,'W')} · converterLossW ${compactSI(t.converterLossW,'W')} · bufferCaptureW ${compactSI(t.bufferCaptureW,'W')} · own antenna ${num(r.signatures.last?.ownAntennaTransmission)}. Агрегатное тепло не распределено по модулям; отсутствие per-instance измерения не заменяется номиналом.</p>${moduleCosts(r)}</details>
  <details id="sm-stops"><summary>Stops / restart / repair</summary>${r.spec.resolvedShip.instances.map(i=>{const m=r.state.modules[i.id];return `<p>${esc(i.id)} · R ${num(m.durabilityR)} · thermal ${m.thermalStopped} · durability ${m.durabilityStopped} · cooldown ${num(m.cooldownSeconds,'с')} · exposure ${num(m.emergencyExposureSeconds,'с')} · restartAuthorized ${m.restartAuthorized}</p>`;}).join('')}<p>Restart authorization, thermal stop и durability stop независимы; результат repair/restart подтверждает только следующий kernel interval.</p><pre>${esc(JSON.stringify(r.events.slice(-20),null,2))}</pre></details>
  <details id="sm-ledger"><summary>Ledger, формулы и origins</summary><p>IR field contact не является radiation. Frozen kernel EM split не пересчитывается adapter.</p><pre>${esc(JSON.stringify({telemetry:t,signatures:r.signatures,origins:r.spec.origins},null,2))}</pre></details></section>`;
}
export type ShipModelComparisonContext={sourceVariant?:'A'|'B';selectedVariant?:'A'|'B';frozenStale?:boolean;bStale?:boolean};
function passport(r:RunResultV3|undefined,side:'a'|'b',variant:string,stale:boolean){
  const composition=r?(Object.keys(groupNames) as (keyof typeof groupNames)[]).map(category=>`${groupNames[category]}: ${r.spec.resolvedShip.instances.filter(i=>i.item.category===category).length}`).join(' · '):'';
  const measured=r?{runId:r.runId,modelVersion:r.spec.modelVersion,revision:r.spec.resolvedShip.fit.fitRevision,status:r.status,partial:r.status!=='complete',stale,interval:[r.spec.initialState.timeSeconds,r.state.timeSeconds],signatures:r.signatures,state:{timeSeconds:r.state.timeSeconds,mode:r.state.mode,temperatureK:r.state.temperatureK,chargeJ:r.state.chargeJ,fuelKg:r.state.fuelKg,buffers:r.state.buffers,governor:r.state.governor}}:undefined;
  return `<article id="sm-comparison-${side}" data-run-id="${esc(r?.runId??'')}" data-stale="${stale}"><h3>${side==='a'?'Frozen A':'Выбранный B'} · источник ${variant}</h3>${r?`<p>${esc(r.spec.resolvedShip.hull.label)} · ревизия ${r.spec.resolvedShip.fit.fitRevision} · ${esc(r.status)}${r.status==='complete'?'':' / частичный'} · измерено ${bound(num(r.spec.initialState.timeSeconds)+'–'+num(r.state.timeSeconds,'с'))}</p><p>Состав · ${esc(composition)}</p><p>${stale?'Устарело относительно черновика источника; сохранённые bytes неизменны.':'Соответствует черновику источника.'}</p><details class="measured-passport"><summary>Отдельный паспорт измерения · ${side.toUpperCase()}</summary><p>run ${esc(r.runId)} · ${esc(r.spec.schemaVersion)} / ${esc(r.spec.modelVersion)} · масса ${bound(num(r.spec.resolvedShip.dryMassKg,'кг'))} · C ${bound(num(r.spec.resolvedShip.heatCapacityJK,'J/K'))} · работа ${bound(compactSI(r.metrics.usefulWorkJ,'J'))} · hostHeatW ${bound(compactSI(r.checkpoint.lastTelemetry.hostHeatW,'W'))}</p><p>Начальная T: ${bound(num(r.spec.initialState.temperatureK,'K'))} · режим: ${esc(r.spec.initialState.mode)} · фон ${bound(num(r.spec.environment.radiativeBackgroundK,'K'))} · ${esc(r.spec.receiverProfile)} · observer ${esc(r.spec.observer.presetId)} / ${bound(num(r.spec.observer.rangeM,'м'))} / ${bound(num(r.spec.observer.aspectDeg,'°'))}</p>${moduleCosts(r)}<pre data-measured-passport>${esc(JSON.stringify(measured,null,2))}</pre><h4>Raw snapshot · полные входные условия ${side.toUpperCase()}</h4><pre data-raw-spec>${esc(JSON.stringify(r.spec,null,2))}</pre><p>Retained trace и checkpoint находятся в raw result JSON export, не дублируются в DOM.</p></details>`:side==='a'?'<p>Frozen A: эталон ещё не зафиксирован.</p>':'<p>Выбранный B: нет измерения.</p>'}</article>`;
}
const literal=(value:unknown)=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
function conditions(r:RunResultV3){
  const {temperatureK,mode,...initial}=r.spec.initialState;
  return {observer:r.spec.observer,receiverProfile:r.spec.receiverProfile,temperature:temperatureK,mode,environment:r.spec.environment,initial,task:r.spec.scenario,horizon:r.spec.durationSeconds,interval:[r.spec.initialState.timeSeconds,r.state.timeSeconds],model:{schemaVersion:r.spec.schemaVersion,modelVersion:r.spec.modelVersion,catalogVersion:r.spec.catalogVersion,units:r.spec.units}};
}
type Difference={path:string;a:unknown;b:unknown};
function changedLeaves(a:unknown,b:unknown,path=''):Difference[]{
  if(literal(a)===literal(b))return [];
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
    const x=a as Record<string,unknown>,y=b as Record<string,unknown>;
    return [...new Set([...Object.keys(x),...Object.keys(y)])].sort().flatMap(key=>changedLeaves(x[key],y[key],path?path+'.'+key:key));
  }
  return [{path,a,b}];
}
const conditionLabels:Record<string,readonly [string,string?]>={
  'observer.presetId':['Наблюдатель'],'observer.aspectDeg':['Ракурс','°'],'observer.rangeM':['Дальность наблюдателя','м'],
  receiverProfile:['IR-профиль'],temperature:['Начальная T','K'],mode:['Режим'],horizon:['Горизонт','с'],
  'environment.radiativeBackgroundK':['Фон','K'],'environment.solarFluxWm2':['Солнечный поток','Вт/м²'],
  'initial.chargeJ':['Начальная энергия батареи','Дж'],'initial.fuelKg.diesel':['Начальный дизель','кг'],'initial.fuelKg.hydrogen':['Начальный H₂','кг'],
  'task.name':['Название задачи'],'task.repeat':['Повторять цикл'],
};
const scalar=(value:unknown)=>typeof value==='number'||typeof value==='string'||typeof value==='boolean';
function conditionValue(value:unknown,unit?:string){
  return typeof value==='number'&&unit?bound(num(value,unit).replace(' °','°')):esc(typeof value==='boolean'?value?'да':'нет':value);
}
export function shipModelComparison(a:RunResultV3|undefined,b:RunResultV3|undefined,context:ShipModelComparisonContext={}){
  const ca=a?conditions(a):undefined,cb=b?conditions(b):undefined;
  const changed=ca&&cb?changedLeaves(ca,cb):[],readable=changed.filter(d=>conditionLabels[d.path]&&scalar(d.a)&&scalar(d.b));
  const groups=[...new Set(changed.map(d=>d.path.split('.')[0]))],mainGroups=[...new Set(readable.map(d=>d.path.split('.')[0]))];
  const details=a&&b?`<details class="condition-snapshots"><summary>Полные условия A/B · различия и неизвестные параметры</summary><p>Full input snapshots находятся в отдельных паспортах A/B. Массивы, добавления/удаления и model differences не скрываются и не заменяются краткой формой.</p>${groups.map(group=>`<div${mainGroups.includes(group)?'':` data-condition="${esc(group)}"`}><ul>${changed.filter(d=>d.path.split('.')[0]===group).map(d=>`<li><strong>${esc(d.path)}</strong>: A ${esc(d.a===undefined?'отсутствует':literal(d.a))} → B ${esc(d.b===undefined?'отсутствует':literal(d.b))}</li>`).join('')}</ul></div>`).join('')}</details>`:'';
  return `<section id="sm-comparison" class="ui-panel"><h2>Frozen A / выбранный B / Δ</h2><div class="sm-comparison-pair">${passport(a,'a',context.sourceVariant??'A',context.frozenStale??false)}${passport(b,'b',context.selectedVariant??'B',context.bStale??false)}</div>${a&&b?changed.length?`<p class="warning">Разные условия: сравнение ограничено. Δ не означает выигрыш, скрытность или контакт.</p>${mainGroups.map(group=>`<ul data-condition="${esc(group)}">${readable.filter(d=>d.path.split('.')[0]===group).map(d=>{const [label,unit]=conditionLabels[d.path];return `<li data-condition-path="${esc(d.path)}">${esc(label)}: A ${conditionValue(d.a,unit)} → B ${conditionValue(d.b,unit)}</li>`;}).join('')}</ul>`).join('')}`:'<p>Одинаковые начальные условия, наблюдатель, профиль, задача и измеренный интервал. Δ — разность измерений, не игровой вывод.</p>':'<p>Без двух измерений Δ отсутствует. Черновик, latest и активный другой вариант не подставляются.</p>'}${details}
  <p>Mean/max берутся только из сохранённых frame statistics /2. Reference range каждого результата использует его собственные observer/profile; v1 отсутствует как —, измеренный ноль равен 0.</p><div class="ui-table-scroll" tabindex="0"><table><thead><tr><th>Измерение</th><th>A</th><th>B</th><th>Δ (B − A)</th></tr></thead><tbody>${channels.map(([name,channel])=>{const sa=savedStatistics(a,name,channel),sb=savedStatistics(b,name,channel);return fields.map(([field,label,unit])=>`<tr><th>${channel} · ${label}, ${unit}</th><td>${measurement('A:'+name+':'+field,sa[field],unit)}</td><td>${measurement('B:'+name+':'+field,sb[field],unit)}</td><td>${measurement('delta:'+name+':'+field,sa[field]!==null&&sb[field]!==null?sb[field]!-sa[field]!:null,unit,true)}</td></tr>`).join('');}).join('')}</tbody></table></div><p>Reference range — не полученный контакт; experimental model / candidate ТТХ.</p></section>`;
}
