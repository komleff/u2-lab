import {ShipModelWorkspace,type ScenarioEdit} from './ship-model-workspace';
import type {WorkspaceShellParts} from './fitting';
import {esc,num} from './fitting-ui/presentation';
import {shipModelComparison,shipModelResults} from './fitting-ui/ship-model-results';
import {shipModelLabView} from './fitting-ui/ship-model-lab-view';
import type {ChannelState} from './fitting-ui/lab-channels';
import {serializeFit,serializeExperiment,serializeResultSnapshot} from '../io/fitting-json';
import {exportShipModelTelemetryCsv} from '../io/ship-model-csv';
import {validateShipModelResult} from '../io/ship-model-result';
import {compileShipModelFit} from '../model/v3/schema';
import {compileFit} from '../fitting/compile';
import type {ShipMode,ReceiverProfile} from '../model/v3/types';
import type {Control} from '../runner/protocol';
import {shipModelShipView,shipModelModuleProfile,shipModelItemDetails} from './fitting-ui/ship-model-ship-view';
import {shipModelSwapDialog,type ShipModelSwapState} from './fitting-ui/ship-model-swap-dialog';
import {shipModelConditions,readScenarioForm,changePhaseList} from './fitting-ui/ship-model-conditions';
import {updateDom} from './fitting-ui/dom';
import {DEFAULT_SHIP_MODEL_BACKGROUND_K,DEFAULT_SHIP_MODEL_PRESET_ID} from './ship-model-defaults';
import {MODEL_V02} from '../model/governor-v03/types';
import {shipModelGovernorConditions} from './fitting-ui/ship-model-conditions';
import {shipModelGovernorLabView} from './fitting-ui/ship-model-lab-view';
import {shipModelGovernorResults,shipModelGovernorComparison} from './fitting-ui/ship-model-results';
import {exportShipModelTelemetryCsvV02} from '../io/ship-model-csv-v02';
// Непрозрачный ID доступен и на HTTP/LAN, где randomUUID отсутствует.
const newId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
const quantity=(value:number|undefined,unit:string)=>`<span class="sm-quantity">${esc(num(value,unit))}</span>`;
const fileId=(value:string)=>value.replace(/[^A-Za-z0-9_-]/g,'_');
export function mountShipModel(root:HTMLElement,w:ShipModelWorkspace,onBack:(legacyText?:string)=>void,renderShell:(parts:WorkspaceShellParts)=>void){
  const worker=new Worker(new URL('../runner/worker.ts',import.meta.url),{type:'module'});
  let error='',runId='',commandId=0,ack='',revision=0,fileRead=0,mounted=true;
  let leaving:{text?:string;label:string;revision:number}|undefined;
  let swap:ShipModelSwapState|undefined,instanceId:string|undefined;
  let scenarioDraft:{value:ScenarioEdit;revision:number;variantId:'A'|'B'}|undefined;
  const channels:ChannelState={group:'energy',unit:'W',hidden:new Set(),eventIndex:0,bucketIndex:Number.MAX_SAFE_INTEGER,detailsOpen:false};
  let eventFilter='all',pendingGovernorReset=false;
  const pending=new Map<number,Control>();
  let pendingFreeze:{runId:string;commandId:number}|undefined,snapshotCommandId:number|undefined;
  const sourceCompiled=compileFit(w.source,w.sourceCatalog);
  const templates=Object.fromEntries(Object.entries(w.source.localVariants).map(([id,item])=>{
    const compatible=Object.values(w.catalog.items).filter(t=>t.thermalRole==='ordinary'&&t.family===item.family&&t.size===item.size&&t.formFactor===item.formFactor&&t.propulsionType===item.propulsionType&&t.species===item.species);
    return [id,{label:item.label,options:compatible,value:compatible.length===1?compatible[0].id:''}];
  }));
  const el=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>('#'+id);
  const act=(fn:()=>void,mutates=true)=>{try{fn();if(mutates)revision++;error='';}catch(e){error=String(e);}if(mounted)render();};
  const send=(type:Control,payload?:unknown)=>{const id=++commandId;pending.set(id,type);worker.postMessage({runId,commandId:id,type,payload});return id;};
  const download=(name:string,text:string,type='application/json')=>{const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  const bind=(id:string,fn:()=>void,mutates=true)=>{const node=el(id);if(node)node.onclick=()=>act(fn,mutates);};
  function requestLeave(text?:string,label='старая модель · редактор оснастки'){
    if(w.active)throw Error('Завершите или отмените тест, включая паузу, перед сменой модели.');
    leaving={text,label,revision:revision+1};
  }
  function render(){
    if(w.governorDocument||w.governorActive){renderGovernor();return;}
    const view=w.snapshotForRender(),active=view.active,r=active?view.currentResult:view.result,measured=view.result,c=view.conditions,fit=view.fit,compiled=fit?compileShipModelFit(fit,w.catalog):null,ship=compiled?.ok?compiled.value:undefined;
    const busy=!!active,locked=busy||!!leaving?'disabled':'',stale=!!r&&view.currentStale;
    const sourceName=w.sourceCatalog.hulls.find(h=>h.id===w.source.hullId)?.label??w.source.hullId;
    const label=ship?.hull.label??'Корабль ещё не открыт';
    const preset=fit?Object.entries(w.catalog.presets).find(([,p])=>JSON.stringify([p.hullId,p.assignments,p.instances,p.localVariants])===JSON.stringify([fit.hullId,fit.assignments,fit.instances,fit.localVariants]))?.[0]:undefined;
    const opening=fit?`${view.opened==='result'?'Результат / checkpoint':view.opened==='run'?'Опыт':'Сборка'} · ${view.opened==='fit'?fit.schemaVersion:'u2-lab/4'} · ${fit.catalogVersion}`:'Выберите корабль или откройте JSON. Для текущей старой сборки нужен явный перенос.';
    let validation='';if(fit)try{w.prepare();}catch(e){validation=String(e);}
    const startReason=busy?'Активный тест владеет управлением; на паузе сборку тоже нельзя менять.':leaving?'Сначала отмените или подтвердите переход в старую модель.':!fit?'Выберите готовый корабль, откройте JSON или подготовьте и примените перенос текущей сборки.':validation?`Исправьте условия перед запуском: ${validation}`:!view.taskEditable?'Импортированная задача сохранена: запуск воспроизводит её; простая форма задачи недоступна.':'Условия ниже относятся к следующему тесту; запуск фиксирует отдельный численный снимок.';
    const ownership=`${fit?`<p id="sm-draft-owner">Следующий черновик ${view.selected}: ${esc(label)} · ревизия ${fit.fitRevision} · ${esc(c.mode??'Efficient')} · T ${num(c.temperatureK??300,'K')} · фон ${num(c.backgroundK??DEFAULT_SHIP_MODEL_BACKGROUND_K,'K')} · ${esc(c.receiverProfile??'positive-only')}</p>`:''}${active?`<p id="sm-test-owner" data-run-id="${esc(active.runId)}">Активный тест ${active.variantId}: ${esc(active.spec.resolvedShip.hull.label)} · ревизия ${active.fitRevision} · run ${esc(active.runId)}${!r?' · ожидается текущее измерение':''}</p>`:''}${stale?'<p id="sm-stale" class="warning" role="status">Измерение устарело: следующий черновик изменён. Сохранённый результат не пересчитан; ждёт соответствующего нового снимка.</p>':''}`;
    renderShell({
      model:'ship-model',headerActions:`<button id="sm-back" ${locked}>← Старый редактор</button>`,context:'',
      overview:`<p class="muted">Экспериментальная модель · каталог ${esc(r?.spec.catalogVersion??fit?.catalogVersion??w.catalog.version)} — параметры-кандидаты, не канонические ТТХ.</p><p id="sm-error" role="alert">${esc(error)}</p>${r?shipModelResults(r):'<p>Overview: пока нет измерения.</p>'}
      ${leaving?`<section id="sm-leave" class="ui-panel limiter" role="alertdialog" aria-label="Переход в старую модель"><h2>Открыть: ${esc(leaving.label)}</h2><p>Это старая модель. Уход закроет текущие несохранённые варианты A/B и измерения /4. Они не перенесутся автоматически. Сначала сохраните нужные сборку, опыт и результат / checkpoint в JSON ниже.</p><a href="#sm-files">Сохранить JSON перед уходом</a><div class="sm-actions"><button id="sm-leave-cancel">Остаться здесь</button><button id="sm-leave-confirm">Открыть старую модель и закрыть /4</button></div></section>`:''}`,
      fitting:`      <section id="sm-entry" class="ui-panel"><span class="eyebrow">1 · выбор и открытие</span><h1>Открыть корабль</h1><p>Выберите готовую сборку или откройте свой файл. Затем задайте условия и нажмите «Запуск».</p><div class="sm-chooser"><label>Готовый корабль · новая модель<select id="sm-preset" ${locked}><option value="">Выберите корабль</option>${w.catalog.presetOptions.filter(option=>Object.hasOwn(w.catalog.presets,option.id)).map(({id,label})=>`<option value="${esc(id)}" ${preset===id?'selected':''}>${esc(label)}</option>`).join('')}</select></label><label class="ui-file">Открыть JSON<input id="sm-import" type="file" accept=".json" aria-label="Открыть JSON корабля, опыта или результата" ${locked}></label></div><p id="sm-opened" class="sm-version">${fit?`${esc(label)} · `:''}${esc(opening)}</p><p class="muted">Старые сборки и результаты открываются в прежнем редакторе без миграции. Старый результат не пересчитывается.</p>
      <button id="sm-source" ${locked}>Перенести текущую старую сборку: ${esc(sourceName)}</button>
      <details id="sm-compilation"><summary>Перенос старой сборки · предпросмотр → изменения → применение</summary><p>Источник: ${esc(sourceName)} · ${esc(w.source.catalogVersion)} / ${esc(w.source.schemaVersion)} / ревизия ${w.source.fitRevision}. Source snapshot не изменяется.</p><div class="sm-fields">${Object.entries(templates).map(([id,t])=>`<label>Основа для ${esc(t.label)}<select data-sm-template="${esc(id)}" ${locked}><option value="">Выберите совместимое изделие</option>${t.options.map(o=>`<option value="${esc(o.id)}" ${t.value===o.id?'selected':''}>${esc(o.label)}</option>`).join('')}</select><small>${t.options.length===1?'Единственная совместимая основа предвыбрана; перенос ещё не применён.':'Основа неоднозначна или отсутствует; выбор требуется явно.'}</small></label>`).join('')}</div><div class="sm-actions"><button id="sm-preview" ${locked}>Предпросмотр переноса</button><button id="sm-apply" class="primary" ${!view.preview||busy||leaving?'disabled':''}>Применить перенос</button></div>${view.preview?`<div id="sm-diff-summary" class="sm-version"><p>Версия: ${esc(w.source.schemaVersion)} / ${esc(w.source.catalogVersion)} → ${esc(view.preview.fit.schemaVersion)} / ${esc(view.preview.fit.catalogVersion)}</p><p>Масса: ${quantity(sourceCompiled.ok?sourceCompiled.value.dryMassKg/1000:undefined,'т')} → ${quantity(view.preview.ship.dryMassKg/1000,'т')} · C: ${quantity(sourceCompiled.ok?sourceCompiled.value.heatCapacityJK/1000:undefined,'кДж/K')} → ${quantity(view.preview.ship.heatCapacityJK/1000,'кДж/K')}</p><p>${view.preview.changes.length} изменений структуры, чисел и происхождения; источник не переписан.</p></div><details id="sm-diff"><summary>Полный diff / provenance JSON · ${view.preview.changes.length} изменений</summary><p>Это новые правила, не восстановленное старое измерение. Проверьте изменения перед применением.</p><pre>${esc(JSON.stringify(view.preview.changes,null,2))}</pre></details>`:''}</details>
      <div class="sm-actions"><label>Вариант<select id="sm-variant" ${leaving?'disabled':''}><option ${view.selected==='A'?'selected':''}>A</option><option ${view.selected==='B'?'selected':''}>B</option></select></label><button id="sm-copy" ${!fit||busy||leaving?'disabled':''}>Копия сборки и условий → B</button></div></section>
      ${fit?shipModelShipView(fit,w.catalog,busy||!!leaving):''}`,
      conditions:`${shipModelConditions(c,view.nextSpec,busy||!!leaving,view.taskEditable,scenarioDraft?.value)}
      <section class="ui-panel sm-ownership">${ownership||'<p>Измерения появятся после первого запуска.</p>'}</section>
      <div id="workspace-charts">${r?shipModelLabView(r,channels,eventFilter):'<section class="ui-panel"><h2>Результат</h2><p>Пока нет измерения. Откройте корабль → задайте условия → нажмите «Запуск».</p></section>'}</div>
      <details id="sm-transport" class="ui-panel"><summary>Управление текущим тестом · шаг, снимок, checkpoint</summary><div class="sm-actions"><button id="sm-step" ${active?.status!=='paused'?'disabled':''}>Шаг 1 с</button><button id="sm-snapshot" ${!active?'disabled':''}>Снимок</button><button id="sm-checkpoint" ${busy||leaving||r?.status!=='paused'||r.state.timeSeconds>=r.spec.durationSeconds?'disabled':''}>Продолжить checkpoint</button></div><p>Новый запуск создаёт fresh state. Checkpoint продолжает сохранённый paused результат, не новый черновик.</p></details>
      ${r?`<details id="sm-repair-controls" class="ui-panel"><summary>Остановки и обслуживание · restart / repair</summary><div class="sm-fields"><label>Установленный модуль<select id="sm-module">${r.spec.resolvedShip.instances.filter(i=>i.item.durability.behavior==='repairable-active').map(i=>`<option value="${esc(i.id)}">${esc(i.item.label)} · ${esc(i.id)}</option>`).join('')}</select></label><label>Прочность после ремонта, R<input id="sm-repair-r" type="number" min="0" step="any" value="1"></label></div><div class="sm-actions"><button id="sm-restart" ${!active?'disabled':''}>RESTART</button><button id="sm-repair" ${!active?'disabled':''}>Repair</button></div><p>Тепловая остановка, прочность и cooldown независимы. Терминальная прочность требует ремонта.</p></details>`:''}`,
      comparison:`<section class="ui-panel"><h2>Эталон измерения</h2><button id="sm-freeze" ${!r||active?.status==='running'||!['complete','paused'].includes(r.status)||leaving?'disabled':''}>Зафиксировать измерение</button>${view.frozen?`<details class="measured-passport"><summary>Подробности зафиксированного эталона</summary><p id="sm-frozen-owner">Замороженное измерение · ${esc(view.frozen.spec.resolvedShip.hull.label)} · ревизия ${view.frozen.spec.resolvedShip.fit.fitRevision} · run ${esc(view.frozen.runId)} · ${esc(view.frozen.status)} · <span class="measurement-value">${num(view.frozen.state.timeSeconds,'с')}</span></p></details>`:'<p>Эталон ещё не зафиксирован.</p>'}</section>
      ${shipModelComparison(view.frozen,measured,{sourceVariant:view.frozenSource?.variantId,selectedVariant:view.selected,frozenStale:view.frozenStale,bStale:view.stale})}`,
      more:`      <section id="sm-files" class="ui-panel"><h2>Сохранить работу</h2><p>Варианты существуют только в этой вкладке. Перед уходом сохраните нужные объекты отдельно для A и B.</p><p id="sm-export-owner">Result / CSV · выбранный ${view.selected}: ${measured?`${esc(measured.spec.resolvedShip.hull.label)} · ревизия ${measured.spec.resolvedShip.fit.fitRevision} · run ${esc(measured.runId)} · ${esc(measured.status)} · ${num(measured.spec.initialState.timeSeconds)}–${num(measured.state.timeSeconds,'с')}`:'нет измерения'}. Опыт: ${active?`captured active ${active.variantId} · run ${esc(active.runId)} · ревизия ${active.fitRevision}`:`следующий черновик ${view.selected}`}</p><div class="sm-actions"><button id="sm-save-fit" ${!fit?'disabled':''}>Сборка JSON</button><button id="sm-save-run" ${!active&&(!fit||validation)?'disabled':''}>Опыт JSON</button><button id="sm-save-result" ${!measured?'disabled':''}>Результат / checkpoint JSON</button><button id="sm-save-csv" ${!measured?'disabled':''}>Измерение CSV /4</button></div><p class="muted">Сборка — монтаж; опыт — численные условия; результат — raw измеренная история, exact frame statistics и checkpoint. CSV /4 — raw retained trace с availability markers; его bucket extrema не являются exact frame statistics. Нет результата выбранного варианта — нет подстановки active/latest. Открытие файла находится в «Открыть корабль».</p></section>`,
      footer:`UI4.8 · экспериментальная модель корабля v0.1 · ${fit?esc(fit.schemaVersion)+' · '+esc(fit.catalogVersion):'следующий черновик без корабля'} · U2 server / физический LAN / playtest NOT RUN`,
      controlsState:active?.status??'idle',dialogLabel:'dialog-title',controls:`<div class="control-status"><strong>Тест ${active?.variantId??view.selected} · <span id="sm-status">${esc(active?.status??(stale?'idle':r?.status??'idle'))}</span></strong><small id="sm-start-reason">${esc(startReason)}</small><small id="sm-ack">${esc(ack)}</small></div><div class="control-buttons"><button id="sm-start" class="primary" ${!fit||busy||leaving||validation?'disabled':''}>▶ Запуск</button><button id="sm-pause" ${active?.status!=='running'?'disabled':''}>Пауза</button><button id="sm-resume" ${active?.status!=='paused'?'disabled':''}>Продолжить</button><button id="sm-cancel" ${!active?'disabled':''}>Отмена</button></div>`,
    });
    el('fit-nav-compare')!.onclick=null;
    bind('sm-back',()=>requestLeave());bind('sm-leave-cancel',()=>{leaving=undefined;});
    bind('sm-leave-confirm',()=>{if(!leaving||leaving.revision!==revision||w.active)throw Error('Владелец изменился; переход не применён.');onBack(leaving.text);destroy();});
    bind('sm-source',()=>{el<HTMLDetailsElement>('sm-compilation')!.open=true;el('sm-compilation')!.scrollIntoView({block:'nearest'});},false);
    for(const select of root.querySelectorAll<HTMLSelectElement>('[data-sm-template]'))select.onchange=()=>act(()=>{templates[select.dataset.smTemplate!].value=select.value;w.preview=undefined;});
    bind('sm-preview',()=>w.previewCompilation(Object.fromEntries(Object.entries(templates).map(([id,t])=>[id,t.value]))));bind('sm-apply',()=>w.applyCompilation());bind('sm-copy',()=>w.copyToB());
    bind('sm-freeze',()=>{if(w.active?.status==='paused'){pendingFreeze={runId:w.active.runId,commandId:send('snapshot')};}else if(!w.freeze())throw Error('Эталон доступен для завершённого или paused текущего измерения.');});
    el<HTMLSelectElement>('sm-preset')!.onchange=()=>act(()=>{const value=el<HTMLSelectElement>('sm-preset')!.value;if(value)w.loadPreset(value,w.catalog.version);});el<HTMLSelectElement>('sm-variant')!.onchange=()=>act(()=>{w.selectVariant(el<HTMLSelectElement>('sm-variant')!.value as 'A'|'B');scenarioDraft=undefined;});
    el<HTMLSelectElement>('sm-mode')!.onchange=()=>act(()=>w.updateConditions({mode:el<HTMLSelectElement>('sm-mode')!.value as ShipMode}));el<HTMLSelectElement>('sm-profile')!.onchange=()=>act(()=>w.updateConditions({receiverProfile:el<HTMLSelectElement>('sm-profile')!.value as ReceiverProfile}));
    el<HTMLSelectElement>('sm-action')!.onchange=()=>act(()=>w.updateConditions({action:el<HTMLSelectElement>('sm-action')!.value as 'work'|'maneuver'|'recovery'|'idle'}));el<HTMLInputElement>('sm-duty')!.onchange=()=>act(()=>w.updateConditions({duty:Number(el<HTMLInputElement>('sm-duty')!.value)}));
    el<HTMLSelectElement>('sm-role')!.onchange=()=>act(()=>w.updateConditions({maneuverRole:el<HTMLSelectElement>('sm-role')!.value as 'march'|'retro'|'strafe'|'turn'}));
    for(const [id,key]of [['duration','durationSeconds'],['temperature','temperatureK'],['background','backgroundK']] as const)el<HTMLInputElement>('sm-'+id)!.onchange=()=>act(()=>w.updateConditions({[key]:Number(el<HTMLInputElement>('sm-'+id)!.value)}));
    for(const id of ['range','aspect'])el<HTMLInputElement>('sm-'+id)!.onchange=()=>act(()=>w.updateConditions({observer:{presetId:c.observer?.presetId??'S-dedicated-G1',rangeM:Number(el<HTMLInputElement>('sm-range')!.value)*1000,aspectDeg:Number(el<HTMLInputElement>('sm-aspect')!.value)}}));
    for(const node of root.querySelectorAll<HTMLInputElement>('[data-sm-enabled]'))node.onchange=()=>act(()=>w.setEnabled(node.dataset.smEnabled!,node.checked));
    for(const node of root.querySelectorAll<HTMLElement>('[data-sm-slot]'))node.onclick=()=>act(()=>{if(w.active||leaving)throw Error('Сначала завершите активный тест.');swap={slotId:node.dataset.smSlot!,query:'',family:'all',size:'all',sort:'name-asc',returnId:node.id};instanceId=undefined;},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-sm-instance]'))node.onclick=()=>act(()=>{instanceId=node.dataset.smInstance;swap=undefined;},false);
    bind('sm-scenario-edit',()=>{if(w.active||leaving)throw Error('Сначала завершите активный тест.');const spec=w.prepare();scenarioDraft={value:{...spec.scenario,durationSeconds:spec.durationSeconds},revision,variantId:w.selected};},false);
    bind('sm-scenario-cancel',()=>{scenarioDraft=undefined;},false);
    bind('sm-scenario-apply',()=>{if(!scenarioDraft||scenarioDraft.revision!==revision||scenarioDraft.variantId!==w.selected)throw Error('Черновик изменён после открытия сценария. Повторите редактирование.');scenarioDraft.value=readScenarioForm(root,scenarioDraft.value);w.replaceScenario(scenarioDraft.value);scenarioDraft=undefined;});
    bind('sm-phase-add',()=>{if(scenarioDraft)scenarioDraft.value=changePhaseList(readScenarioForm(root,scenarioDraft.value),'add');},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-phase-duplicate],[data-phase-remove]'))node.onclick=()=>act(()=>{if(scenarioDraft)scenarioDraft.value=changePhaseList(readScenarioForm(root,scenarioDraft.value),node.hasAttribute('data-phase-duplicate')?'duplicate':'remove',Number(node.dataset.phaseDuplicate??node.dataset.phaseRemove));},false);
    bind('sm-start',()=>{runId=newId();const spec=w.start(runId);send('start',{spec,maxSteps:1});});bind('sm-checkpoint',()=>{runId=newId();const checkpoint=w.startCheckpoint(runId);send('start',{checkpoint,maxSteps:1});});
    for(const [id,type]of [['pause','pause'],['resume','resume'],['step','step'],['cancel','cancel'],['snapshot','snapshot']] as const)bind('sm-'+id,()=>send(type));
    bind('sm-restart',()=>send('restart',{instanceId:el<HTMLSelectElement>('sm-module')!.value}));bind('sm-repair',()=>send('repair',{instanceId:el<HTMLSelectElement>('sm-module')!.value,durabilityR:Number(el<HTMLInputElement>('sm-repair-r')!.value)}));
    bind('sm-save-fit',()=>download(`u2-ship-model-fit-${view.selected}-r${fit!.fitRevision}.json`,serializeFit(w.fit!)),false);
    bind('sm-save-run',()=>download(`u2-ship-model-run-${active?.variantId??view.selected}-${active?fileId(active.runId):'draft-r'+fit!.fitRevision}.json`,serializeExperiment(active?.spec??w.prepare())),false);
    bind('sm-save-result',()=>{const checked=validateShipModelResult(measured);if(!checked.ok)throw Error(checked.errors.map(e=>e.path+': '+e.message).join('; '));download(`u2-ship-model-result-${view.selected}-${fileId(checked.value.runId)}.json`,serializeResultSnapshot(checked.value));},false);
    bind('sm-save-csv',()=>download(`u2-ship-model-result-${view.selected}-${fileId(measured!.runId)}.csv`,exportShipModelTelemetryCsv(measured!),'text/csv;charset=utf-8'),false);
    const details=el<HTMLDetailsElement>('channel-details');if(details)details.ontoggle=()=>{if(channels.detailsOpen!==details.open)act(()=>{channels.detailsOpen=details.open;},false);};
    const picker=el<HTMLInputElement>('chart-bucket');if(picker)picker.oninput=()=>act(()=>{channels.bucketIndex=Number(picker.value);},false);
    const event=(index:number)=>{channels.eventIndex=Math.max(0,Math.min(index,(r?.events.length??1)-1));channels.bucketIndex=undefined;};
    for(const node of root.querySelectorAll<HTMLElement>('[data-event-index]'))node.onclick=()=>act(()=>event(Number(node.dataset.eventIndex)),false);
    bind('channel-prev',()=>event(channels.eventIndex-1),false);bind('channel-next',()=>event(channels.eventIndex+1),false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-channel-group]'))node.onclick=()=>act(()=>{channels.group=node.dataset.channelGroup!;},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-curve]'))node.onclick=()=>act(()=>{const id=node.dataset.curve!;if(channels.hidden.has(id))channels.hidden.delete(id);else channels.hidden.add(id);},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-event-filter]'))node.onclick=()=>act(()=>{eventFilter=node.dataset.eventFilter!;},false);
    const unit=el<HTMLSelectElement>('channel-unit');if(unit)unit.onchange=()=>act(()=>{channels.unit=unit.value;},false);
    el<HTMLInputElement>('sm-import')!.onchange=async()=>{
      const input=el<HTMLInputElement>('sm-import')!,file=input.files?.[0];if(!file)return;
      const owner=revision,read=++fileRead;
      try{const text=await file.text();if(!mounted)return;if(read!==fileRead||owner!==revision||w.active||leaving)throw Error('Вариант или активный тест изменён во время чтения файла; импорт не применён.');
        const opening=w.inspectOpening(text);if(opening.legacy){requestLeave(text,`${opening.kind} · ${opening.schemaVersion} · старая модель`);}else w.importDocument(text);
        swap=undefined;instanceId=undefined;scenarioDraft=undefined;
        revision++;error='';
      }catch(e){if(!mounted)return;error=String(e);}
      input.value='';render();
    };
    const dialog=el<HTMLDialogElement>('ui-dialog')!;
    const closeDialog=()=>{const returnId=swap?.returnId;swap=undefined;instanceId=undefined;dialog.close();if(returnId)document.getElementById(returnId)?.focus();render();};
    if(swap&&fit){
      dialog.setAttribute('aria-labelledby','sm-swap-title');updateDom(dialog,shipModelSwapDialog(fit,w.catalog,c,swap,swap.candidate===undefined?undefined:w.replacementPreview));if(!dialog.open)dialog.showModal();
      bind('sm-swap-close',closeDialog,false);
      for(const [id,key]of [['search','query'],['family','family'],['size','size'],['sort','sort']] as const){const node=el<HTMLInputElement>('sm-swap-'+id)!;const change=()=>act(()=>{swap![key]=node.value;},false);if(id==='search')node.oninput=change;else node.onchange=change;}
      for(const node of root.querySelectorAll<HTMLElement>('[data-sm-candidate]'))node.onclick=()=>act(()=>{swap!.candidate=node.dataset.smCandidate!;w.previewReplacement(swap!.slotId,swap!.candidate);},false);
      bind('sm-swap-remove',()=>{swap!.candidate=null;w.previewReplacement(swap!.slotId,null);},false);
      bind('sm-swap-apply',()=>{w.applyReplacement();closeDialog();});
    }else if(instanceId&&fit){
      const hull=w.catalog.hulls.find(h=>h.id===fit.hullId),instance=hull?.builtins.find(i=>i.id===instanceId),item=instance?.item;
      if(item){dialog.setAttribute('aria-labelledby','sm-swap-title');updateDom(dialog,`<div class="dialog-header"><h2 id="sm-swap-title">Встроенный · ${esc(item.label)}</h2><button id="sm-swap-close" autofocus>Закрыть</button></div><div class="dialog-body">${shipModelModuleProfile(item)}${shipModelItemDetails(item)}<p>Встроенный модуль не снимается и не заменяется.</p></div>`);if(!dialog.open)dialog.showModal();bind('sm-swap-close',closeDialog,false);}
    }else if(dialog.open)dialog.close();
    dialog.oncancel=event=>{event.preventDefault();closeDialog();};
  }
  function renderGovernor(){
    const document=w.governorDocument,active=w.governorActive,spec=document?.spec??active!.spec,r=w.governorCurrentResult,measured=document?.result,frozen=w.governorFrozen,busy=!!active,disabled=busy?'disabled':'';
    const stale=measured&&JSON.stringify(measured.spec)!==JSON.stringify(spec),status=active?.status??(stale?'idle':r?.status??'idle');
    renderShell({model:'ship-model',headerActions:`<button id="sm-back" ${disabled}>← Старый редактор</button>`,context:'',
      overview:`<p class="muted">Модель 0.2 · synthetic qualification · runtimeAuthorization=false</p><p id="sm-error" role="alert">${esc(error)}</p>${r?shipModelGovernorResults(r):'<p>Пока нет измерения текущего теста.</p>'}${leaving?'<section class="ui-panel"><p>Сохраните JSON перед уходом: варианты текущей вкладки будут закрыты.</p><button id="sm-leave-cancel">Остаться здесь</button><button id="sm-leave-confirm">Открыть старую модель и закрыть /4</button></section>':''}`,
      fitting:`<section id="sm-entry" class="ui-panel"><h1>Открыть корабль</h1><label class="ui-file">Открыть versioned qualification JSON<input id="sm-import" type="file" accept=".json" ${disabled}></label><p id="sm-opened">${esc(spec.name)} · ${esc(spec.schemaVersion)} · ${esc(spec.modelVersion)} · ${esc(spec.stateVersion)} · ${esc(spec.profile.id)} / ${esc(spec.profile.revision)}</p><p>Профиль synthetic передан явно. Реальные корабли не активированы.</p><button id="sm-model-v01" ${disabled}>Открыть обычную модель 0.1</button><div class="sm-actions"><label>Вариант<select id="sm-variant" ${disabled}><option ${w.selected==='A'?'selected':''}>A</option><option ${w.selected==='B'?'selected':''}>B</option></select></label><button id="sm-copy" ${disabled}>Копия профиля и условий → B</button></div><details id="sm-governor-profile"><summary>Оснастка qualification · профиль и provenance</summary><pre>${esc(JSON.stringify(spec.profile,null,2))}</pre></details></section>`,
      conditions:shipModelGovernorConditions(spec,busy)+`<section class="ui-panel sm-ownership"><p id="sm-draft-owner">Следующий черновик ${w.selected} · ${esc(spec.name)}</p>${active?`<p id="sm-test-owner" data-run-id="${esc(active.runId)}">Активный тест ${active.variantId} · run ${esc(active.runId)} · ${esc(active.spec.name)}</p>`:''}${stale?'<p id="sm-stale" class="warning">Измерение устарело: следующий черновик изменён.</p>':''}</section><div id="workspace-charts">${r?shipModelGovernorLabView(r,channels,eventFilter):'<p>Запустите опыт, чтобы получить реальные измерения.</p>'}</div><details id="sm-transport" class="ui-panel"><summary>Управление текущим тестом · шаг, снимок, checkpoint</summary><button id="sm-step" ${active?.status==='paused'?'':'disabled'}>Шаг 1/30 с</button><button id="sm-snapshot" ${disabled?'':'disabled'}>Снимок</button><button id="sm-checkpoint" ${!busy&&measured?.status==='paused'&&measured.metrics.ticks<measured.spec.durationTicks?'':'disabled'}>Продолжить checkpoint</button><button id="sm-reset">Сброс теста</button><p>Reset очищает измерение; новый Start использует initial state. RESTART разрешает перезапуск отдельного модуля.</p></details>${r?`<details class="ui-panel"><summary>Остановки · модульный restart</summary><select id="sm-module">${spec.profile.modules.map(m=>`<option value="${esc(m.id)}">${esc(m.id)}</option>`).join('')}</select><button id="sm-restart" ${busy?'':'disabled'}>RESTART</button><p>Repair и service относятся к отдельному G4.</p></details>`:''}`,
      comparison:`<section class="ui-panel"><h2>Эталон измерения</h2><button id="sm-freeze" ${r&&active?.status!=='running'&&r.status!=='cancelled'?'':'disabled'}>Зафиксировать измерение</button></section>${shipModelGovernorComparison(frozen,measured)}`,
      more:`<section id="sm-files" class="ui-panel"><h2>Сохранить работу</h2><p id="sm-export-owner">Выбранный ${w.selected} · ${measured?esc(measured.runId)+' · '+measured.state.governor.tickIndex/30+' с':'нет измерения'}</p><button id="sm-save-run">Опыт JSON</button><button id="sm-save-result" ${measured?'':'disabled'}>Результат / checkpoint JSON</button><button id="sm-save-csv" ${measured?'':'disabled'}>Измерение CSV /4</button><p>Профиль оснастки включён в versioned опыт. JSON открывается без пересчёта и миграции.</p></section>`,
      footer:'Экспериментальная модель 0.2 · governor 0.3 · LAN / native / server NOT RUN',controlsState:status,dialogLabel:'dialog-title',
      controls:`<div class="control-status"><strong>Тест ${active?.variantId??w.selected} · <span id="sm-status">${status}</span></strong><small id="sm-ack">${esc(ack)}</small></div><div class="control-buttons"><button id="sm-start" ${disabled}>▶ Запуск</button><button id="sm-pause" ${active?.status==='running'?'':'disabled'}>Пауза</button><button id="sm-resume" ${active?.status==='paused'?'':'disabled'}>Продолжить</button><button id="sm-cancel" ${busy?'':'disabled'}>Отмена</button></div>`});
    // Пока решение об уходе открыто, snapshot для экспорта не должен сменить владельца.
    if(leaving){
      for(const id of ['sm-start','sm-reset','sm-freeze','sm-model-v01','sm-copy','sm-back','sm-governor-apply','sm-import','sm-variant','sm-checkpoint'])el<HTMLButtonElement>(id)!.disabled=true;
      root.querySelector<HTMLFieldSetElement>('#sm-conditions fieldset')!.disabled=true;
    }
    bind('sm-start',()=>{runId=newId();send('start',{spec:w.startGovernor(runId),maxSteps:1});});bind('sm-checkpoint',()=>{runId=newId();send('start',{checkpoint:w.startGovernor(runId,true),maxSteps:1});});
    for(const type of ['pause','resume','step','cancel','snapshot'] as const)bind('sm-'+type,()=>send(type));
    bind('sm-reset',()=>{if(w.governorActive){pendingGovernorReset=true;send('cancel');}else w.resetGovernor();});
    bind('sm-restart',()=>send('restart',{instanceId:el<HTMLSelectElement>('sm-module')!.value}));
    bind('sm-freeze',()=>{if(w.governorActive?.status==='paused')pendingFreeze={runId,commandId:send('snapshot')};else if(!w.freezeGovernor())throw Error('Нужен paused/complete результат');});
    bind('sm-governor-apply',()=>w.replaceGovernorSpec({...spec,name:el<HTMLInputElement>('sm-governor-name')!.value,durationTicks:Number(el<HTMLInputElement>('sm-governor-duration')!.value),scenario:JSON.parse(el<HTMLTextAreaElement>('sm-governor-scenario')!.value),environment:JSON.parse(el<HTMLTextAreaElement>('sm-governor-environment')!.value)}));
    bind('sm-copy',()=>w.copyToB());el<HTMLSelectElement>('sm-variant')!.onchange=()=>act(()=>w.selectVariant(el<HTMLSelectElement>('sm-variant')!.value as 'A'|'B'));
    bind('sm-model-v01',()=>w.loadPreset(DEFAULT_SHIP_MODEL_PRESET_ID));bind('sm-back',()=>requestLeave());bind('sm-leave-cancel',()=>{leaving=undefined;});bind('sm-leave-confirm',()=>{onBack(leaving?.text);destroy();});
    bind('sm-save-run',()=>download(`u2-governor-run-${w.selected}.json`,serializeExperiment(active?.spec??spec)),false);bind('sm-save-result',()=>download(`u2-governor-result-${w.selected}.json`,serializeResultSnapshot(measured!)),false);bind('sm-save-csv',()=>download(`u2-governor-result-${w.selected}.csv`,exportShipModelTelemetryCsvV02(measured!),'text/csv;charset=utf-8'),false);
    const picker=el<HTMLInputElement>('chart-bucket');if(picker)picker.oninput=()=>act(()=>{channels.bucketIndex=Number(picker.value);},false);
    const details=el<HTMLDetailsElement>('channel-details');if(details)details.ontoggle=()=>{if(details.open!==channels.detailsOpen)act(()=>{channels.detailsOpen=details.open;},false);};
    for(const node of root.querySelectorAll<HTMLElement>('[data-channel-group]'))node.onclick=()=>act(()=>{channels.group=node.dataset.channelGroup!;},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-curve]'))node.onclick=()=>act(()=>{const id=node.dataset.curve!;if(channels.hidden.has(id))channels.hidden.delete(id);else channels.hidden.add(id);},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-event-index]'))node.onclick=()=>act(()=>{channels.eventIndex=Number(node.dataset.eventIndex);channels.bucketIndex=undefined;},false);
    for(const node of root.querySelectorAll<HTMLElement>('[data-event-filter]'))node.onclick=()=>act(()=>{eventFilter=node.dataset.eventFilter!;},false);
    const unit=el<HTMLSelectElement>('channel-unit');if(unit)unit.onchange=()=>act(()=>{channels.unit=unit.value;},false);
    el<HTMLInputElement>('sm-import')!.onchange=async()=>{const input=el<HTMLInputElement>('sm-import')!,file=input.files?.[0];if(!file)return;const owner=revision,read=++fileRead;try{const text=await file.text();if(!mounted)return;if(read!==fileRead||owner!==revision||w.governorActive||leaving)throw Error('Владелец изменился во время чтения файла');const opening=w.inspectOpening(text);if(opening.legacy)requestLeave(text,opening.kind);else w.importDocument(text);revision++;error='';}catch(e){error=String(e);}input.value='';render();};
  }
  // Protocol отправляет snapshot сразу после ACK snapshot/cancel: commandId берём из этой пары.
  worker.onmessage=({data:m})=>{if(!mounted||m.runId!==runId)return;if(m.type==='control-ack'){if(pending.get(m.commandId)!==m.control)return;pending.delete(m.commandId);ack=m.control+' ACK';if(m.control==='snapshot'||m.control==='cancel')snapshotCommandId=m.commandId;if(m.control==='pause'||m.control==='step'){w.setStatus('paused');w.setGovernorStatus('paused');}if(m.control==='resume'){w.setStatus('running');w.setGovernorStatus('running');}if(['pause','restart','repair'].includes(m.control))send('snapshot');}
    else if(m.type==='chunk'){const {telemetry,...snapshot}=m.payload;if(snapshot.spec?.modelVersion===MODEL_V02)w.acceptGovernorResult(snapshot);else w.acceptResult(snapshot);worker.postMessage({runId,type:'telemetry-ack',chunkId:m.chunkId});}
    else if(m.type==='complete'||m.type==='snapshot'){const requestId=m.type==='snapshot'?snapshotCommandId:undefined;if(m.type==='snapshot')snapshotCommandId=undefined;const governor=m.payload.spec?.modelVersion===MODEL_V02,accepted=governor?w.acceptGovernorResult(m.payload):w.acceptResult(m.payload);if(accepted&&m.type==='snapshot'&&pendingFreeze&&pendingFreeze.runId===m.runId&&pendingFreeze.commandId===requestId){if(governor)w.freezeGovernor();else w.freeze();pendingFreeze=undefined;}if(accepted&&governor&&m.payload.status==='cancelled'&&pendingGovernorReset){w.resetGovernor();pendingGovernorReset=false;}}
    else if(m.type==='error'){error=String(m.payload);pending.clear();if(w.active)w.setStatus('paused');}
    render();};
  function destroy(){mounted=false;worker.terminate();}
  render();return {destroy,render,workspace:w};
}
