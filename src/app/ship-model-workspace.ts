import type {CandidateCatalog,ShipFit} from '../fitting/types';
import {getPresetFit,loadCandidateCatalog} from '../fitting/catalog';
import {compileFitToShipModelV01} from '../fitting/compile';
import type {CandidateCatalogV3,ShipFitV3,PromotedFitV3,RunSpecV3,ResolvedShipV3} from '../model/v3/types';
import {CURRENT_SHIP_MODEL_CATALOG,isShipModelCatalogVersion,type ShipModelCatalogVersion} from '../model/v3/types';
import {makeShipModelMissionRun} from '../scenarios/ship-model-mission';
import {makeShipModelMiningRun,type ShipModelConditions} from '../scenarios/fitting';
import {parseFitJson,parseExperimentJson} from '../io/fitting-json';
import {parseStoredResultJson} from '../io/fitting-result';
import type {RunResultV3} from '../runner/ship-model-run';
import {validateRunSpecV3,validateShipModelFit,compileShipModelFit} from '../model/v3/schema';
import {DEFAULT_SHIP_MODEL_DURATION_SECONDS,DEFAULT_SHIP_MODEL_BACKGROUND_K,DEFAULT_SHIP_MODEL_PRESET_ID} from './ship-model-defaults';
import {MODEL_V02} from '../model/governor-v03/types';
import type {RunSpecV02} from '../model/governor-v03/run-types';
import type {RunResultV02} from '../runner/ship-model-run-v02';
import {requireRunSpecV02} from '../runner/ship-model-v02-adapter';
import {validateShipModelResultV02} from '../io/ship-model-result-v02';
type Variant={fit?:ShipFitV3;conditions:ShipModelConditions;result?:RunResultV3;replay?:RunSpecV3;scenarioName?:string;stale?:boolean;opened?:'fit'|'run'|'result'};
type ActiveTest={runId:string;variantId:'A'|'B';fitRevision:number;spec:RunSpecV3;status:'running'|'paused'};
export type ScenarioEdit=RunSpecV3['scenario']&{durationSeconds:number};
export type ReplacementPreview={ok:boolean;fit?:ShipFitV3;ship?:ResolvedShipV3;errors:{path:string;code:string;message:string}[]};
const unwrap=<T>(r:{ok:true;value:T}|{ok:false;errors:readonly {path:string;message:string}[]}):T=>{if(!r.ok)throw Error(r.errors.map(e=>e.path+': '+e.message).join('\n'));return r.value;};
// Явная правка монтажа создаёт следующий рейсовый draft с фактическим roster.
// Импортированный run и сохранённые измерения не проходят эту перекомпиляцию.
function missionConditionsForFit(conditions:ShipModelConditions,ship:ResolvedShipV3):ShipModelConditions{
  return {...structuredClone(conditions),phases:undefined,...(conditions.mission?{mission:{...structuredClone(conditions.mission),selectedWorkGroup:ship.instances.filter(i=>i.item.family==='mining').map(i=>i.id)}}:{})};
}
export function previewShipModelReplacement(fit:ShipFitV3,catalog:CandidateCatalogV3,conditions:ShipModelConditions,slotId:string,itemId:string|null):ReplacementPreview{
  const hull=catalog.hulls.find(h=>h.id===fit.hullId),slot=hull?.slots.find(s=>s.id===slotId);
  if(!slot)return {ok:false,errors:[{path:'slotId',code:'SLOT',message:hull?.builtins.some(i=>i.id===slotId)?'Встроенный модуль нельзя снять или заменить.':'Неизвестный сменный слот.'}]};
  const next=structuredClone(fit),id=next.assignments[slotId]??'fit:'+slotId;
  if(itemId===null){delete next.instances[id];delete next.assignments[slotId];}
  else {next.assignments[slotId]=id;next.instances[id]={id,itemId,enabled:next.instances[id]?.enabled??true};}
  next.fitRevision++;
  const checked=validateShipModelFit(next,catalog),compiled=checked.ok?compileShipModelFit(next,catalog):checked;
  const errors=compiled.ok?[]:[...compiled.errors];
  const mission=conditions.workMode==='mission';
  const original=makeShipModelMiningRun(fit,catalog,conditions),phases=mission?[]:conditions.phases??(original.ok?original.value.scenario.phases:[]);
  phases.forEach((phase,index)=>{for(const owner of Object.keys(phase.requests))if(!next.instances[owner]&&!hull?.builtins.some(i=>i.id===owner))errors.push({path:`scenario.phases.${index}.requests.${owner}`,code:'REQUEST_OWNER',message:'Снятие удаляет владельца запроса '+owner+'. Сначала явно измените сценарий.'});});
  if(compiled.ok){const run=mission?makeShipModelMissionRun(next,catalog,missionConditionsForFit(conditions,compiled.value)):makeShipModelMiningRun(next,catalog,conditions);if(!run.ok)errors.push(...run.errors);}
  return {ok:errors.length===0,fit:next,...(compiled.ok?{ship:compiled.value}:{}),errors};
}
// Черновики /4 и legacy сохраняют свои численные данные внутри общей Lab shell.
export class ShipModelWorkspace{
  private governorVariants:Partial<Record<'A'|'B',{spec:RunSpecV02;result?:RunResultV02}>>={};
  private governorTest?:{runId:string;variantId:'A'|'B';spec:RunSpecV02;status:'running'|'paused'};
  private governorReference?:RunResultV02;
  get governorDocument(){const v=this.governorVariants[this.selected];return v&&structuredClone(v);}
  get governorActive(){return this.governorTest&&structuredClone(this.governorTest);}
  get governorFrozen(){return this.governorReference&&structuredClone(this.governorReference);}
  get governorCurrentResult(){const r=this.governorVariants[this.governorTest?.variantId??this.selected]?.result;return r&&(!this.governorTest||r.runId===this.governorTest.runId)?structuredClone(r):undefined;}
  replaceGovernorSpec(input:unknown){this.idle();const spec=requireRunSpecV02(input);this.governorVariants[this.selected]={...this.governorVariants[this.selected],spec};}
  startGovernor(runId:string,checkpoint=false){
    this.idle();const v=this.governorVariants[this.selected];if(!v)throw Error('Нет versioned governor документа');
    const saved=checkpoint?unwrap(validateShipModelResultV02(v.result)):undefined;
    if(saved&&(saved.status!=='paused'||saved.metrics.ticks>=saved.spec.durationTicks))throw Error('Нужен незавершённый paused governor checkpoint');
    const spec=saved?saved.spec:requireRunSpecV02(v.spec);this.governorTest={runId,variantId:this.selected,spec:structuredClone(spec),status:'running'};
    return saved?{...saved,runId}:structuredClone(spec);
  }
  setGovernorStatus(status:'running'|'paused'){if(this.governorTest)this.governorTest.status=status;}
  acceptGovernorResult(input:RunResultV02){
    const active=this.governorTest;if(!active||input.runId!==active.runId)return false;
    const r=unwrap(validateShipModelResultV02(input));if(JSON.stringify(r.spec)!==JSON.stringify(active.spec))throw Error('Result не принадлежит captured spec');
    this.governorVariants[active.variantId]!.result=r;if(r.status==='complete'||r.status==='cancelled')this.governorTest=undefined;return true;
  }
  freezeGovernor(){const active=this.governorTest,v=this.governorVariants[active?.variantId??this.selected],r=v?.result;if(!r||active?.status==='running'||!['complete','paused'].includes(r.status))return false;this.governorReference=structuredClone(r);return true;}
  resetGovernor(){this.idle();const v=this.governorVariants[this.selected];if(v)v.result=undefined;}
  readonly source:ShipFit;readonly currentCatalog:CandidateCatalogV3=loadCandidateCatalog(CURRENT_SHIP_MODEL_CATALOG);
  private catalogs:Partial<Record<ShipModelCatalogVersion,CandidateCatalogV3>>={[CURRENT_SHIP_MODEL_CATALOG]:this.currentCatalog};
  preview?:PromotedFitV3;selected:'A'|'B'='A';
  private activeTest?:ActiveTest;
  private frozenResult?:RunResultV3;
  private frozenSource?:{variantId:'A'|'B'};
  private comparisonBaseId?:'A'|'B'|'reference';
  private draftRevision={A:0,B:0};
  private replacement?:{variantId:'A'|'B';revision:number;fitLiteral:string;preview:ReplacementPreview};
  private variants:Record<'A'|'B',Variant>={A:{fit:getPresetFit(DEFAULT_SHIP_MODEL_PRESET_ID,CURRENT_SHIP_MODEL_CATALOG),conditions:{workMode:'mission',durationSeconds:DEFAULT_SHIP_MODEL_DURATION_SECONDS,mode:'Efficient',receiverProfile:'positive-only',temperatureK:300,backgroundK:DEFAULT_SHIP_MODEL_BACKGROUND_K,observer:{presetId:'S-dedicated-G1',rangeM:16000,aspectDeg:0}}},B:{conditions:{}}};
  constructor(source:ShipFit,readonly sourceCatalog:CandidateCatalog){this.source=structuredClone(source);}
  private catalogFor(version:unknown){
    if(!isShipModelCatalogVersion(version))throw Error('catalogVersion: Неизвестная версия каталога: '+String(version));
    return this.catalogs[version]??(this.catalogs[version]=loadCandidateCatalog(version));
  }
  get catalog(){return this.catalogFor(this.fit?this.fit.catalogVersion:CURRENT_SHIP_MODEL_CATALOG);}
  get fit(){return this.variants[this.selected].fit;}
  get conditions(){return this.variants[this.selected].conditions;}
  get result(){return this.variants[this.selected].result;}
  get active(){return this.activeTest&&structuredClone(this.activeTest);}
  get frozen(){return this.frozenResult&&structuredClone(this.frozenResult);}
  get baselineId(){return this.comparisonBaseId;}
  get replacementPreview(){return this.replacement&&structuredClone(this.replacement.preview);}
  get currentResult(){
    const r=this.variants[this.activeTest?.variantId??this.selected].result;
    return r&&(!this.activeTest||r.runId===this.activeTest.runId)?r:undefined;
  }
  get opened(){return this.variants[this.selected].opened??'fit';}
  get comparison(){return {A:this.variants.A.result,B:this.variants.B.result};}
  isStale(){return !!this.result&&!!this.variants[this.selected].stale;}
  // Одна отделённая копия на render: история и captured owner читаются согласованно.
  snapshotForRender(){
    let nextSpec:RunSpecV3|undefined;try{nextSpec=this.prepare();}catch{/* Неполный черновик всё ещё доступен для исправления. */}
    const data=structuredClone({selected:this.selected,variants:this.variants,active:this.activeTest,frozen:this.frozenResult,frozenSource:this.frozenSource,baselineId:this.comparisonBaseId,preview:this.preview});
    const v=data.variants[data.selected],r=data.variants[data.active?.variantId??data.selected].result;
    const source=data.frozenSource&&data.variants[data.frozenSource.variantId],draft=source?.fit?this.draftSpec(source):undefined;
    const frozenStale=data.frozen?(!draft?.ok||JSON.stringify(data.frozen.spec)!==JSON.stringify(draft.value)):undefined;
    return {selected:data.selected,fit:v.fit,conditions:v.conditions,result:v.result,opened:v.opened??'fit',stale:!!v.result&&!!v.stale,
      active:data.active,currentResult:r&&(!data.active||r.runId===data.active.runId)?r:undefined,currentStale:!!r&&!!data.variants[data.active?.variantId??data.selected].stale,frozen:data.frozen,frozenSource:data.frozenSource,frozenStale,baselineId:data.baselineId,preview:data.preview,
      comparison:{A:data.variants.A.result,B:data.variants.B.result},taskEditable:this.taskEditable,nextSpec};
  }
  get taskEditable(){
    if(this.conditions.workMode==='mission')return true;
    const phases=this.conditions.phases;if(!phases)return true;
    if(phases.length!==1||phases[0].environment!==null||phases[0].mode!==undefined)return false;
    const fresh=this.fit&&makeShipModelMiningRun(this.fit,this.catalog,{...this.conditions,phases:undefined});
    return !!fresh?.ok&&phases[0].action===fresh.value.scenario.phases[0].action&&JSON.stringify(Object.entries(phases[0].requests).sort())===JSON.stringify(Object.entries(fresh.value.scenario.phases[0].requests).sort());
  }
  private edited(){this.variants[this.selected].stale=!!this.result;this.draftRevision[this.selected]++;}
  private replaceFit(fit:ShipFitV3){
    const v=this.variants[this.selected],catalog=this.catalogFor(fit.catalogVersion);
    if(v.conditions.workMode==='mission'){const compiled=compileShipModelFit(fit,catalog);if(compiled.ok)v.conditions=missionConditionsForFit(v.conditions,compiled.value);else v.conditions.phases=undefined;}
    else if(v.conditions.phases)unwrap(makeShipModelMiningRun(fit,catalog,v.conditions));
    v.fit=fit;v.replay=undefined;v.opened='fit';this.edited();
  }
  private idle(){if(this.activeTest||this.governorTest)throw Error('Сначала завершите/отмените активный тест; его controls принадлежат исходному варианту.');}
  selectModel(){if(!this.fit)throw Error('Старый fit: требуется явная компиляция с diff, model toggle не мигрирует данные.');}
  previewCompilation(templates:Record<string,string>){this.idle();this.preview=unwrap(compileFitToShipModelV01(this.source,this.sourceCatalog,this.currentCatalog,{variantTemplates:templates}));return structuredClone(this.preview);}
  applyCompilation(){this.idle();if(!this.preview)throw Error('Сначала просмотрите diff компиляции.');this.replaceFit(structuredClone(this.preview.fit));}
  loadPreset(id:string,version:ShipModelCatalogVersion=CURRENT_SHIP_MODEL_CATALOG){this.idle();const catalog=this.catalogFor(version),fit=getPresetFit(id,version);unwrap(parseFitJson(JSON.stringify(fit),catalog));this.replaceFit(fit);delete this.governorVariants[this.selected];}
  copyToB(){this.idle();if(this.governorVariants[this.selected]){this.governorVariants.B={spec:structuredClone(this.governorVariants[this.selected]!.spec)};this.selected='B';return;}this.selectModel();this.variants.B=structuredClone(this.variants[this.selected]);this.variants.B.result=undefined;this.variants.B.opened=this.variants.B.replay?'run':'fit';delete this.governorVariants.B;this.draftRevision.B++;this.selected='B';}
  selectVariant(id:'A'|'B'){this.selected=id;}
  previewReplacement(slotId:string,itemId:string|null){
    this.idle();this.selectModel();const preview=previewShipModelReplacement(this.fit!,this.catalog,this.conditions,slotId,itemId);
    this.replacement={variantId:this.selected,revision:this.draftRevision[this.selected],fitLiteral:JSON.stringify(this.fit),preview:structuredClone(preview)};
    return structuredClone(preview);
  }
  applyReplacement(){
    this.idle();const p=this.replacement;if(!p)throw Error('Сначала выполните предпросмотр замены.');
    if(p.variantId!==this.selected||p.revision!==this.draftRevision[this.selected]||p.fitLiteral!==JSON.stringify(this.fit))throw Error('Черновик или ревизия изменены после предпросмотра; повторите preview.');
    if(!p.preview.ok||!p.preview.fit)throw Error(p.preview.errors.map(e=>e.path+': '+e.message).join('\n'));
    this.replaceFit(structuredClone(p.preview.fit));this.replacement=undefined;
  }
  selectWorkMode(mode:'mission'|'stationary'){this.idle();const v=this.variants[this.selected];v.conditions={...v.conditions,workMode:mode,phases:undefined,mission:undefined};v.replay=undefined;v.opened='fit';this.edited();}
  updateMission(change:Partial<import('../model/v3/types').MissionSpecV3>){this.idle();const v=this.variants[this.selected],mission=v.conditions.mission??this.prepare().mission;if(!mission)throw Error('Выберите рейсовый режим');v.conditions.mission={...structuredClone(mission),...structuredClone(change)};v.replay=undefined;this.edited();}
  replaceScenario(edit:ScenarioEdit){
    this.idle();if(this.conditions.workMode==='mission')throw Error('Для составного сценария выберите стационарную нагрузку');const {durationSeconds,...scenario}=structuredClone(edit),next=this.prepare();next.scenario=scenario;next.durationSeconds=durationSeconds;
    // Новые численные условия получают provenance; остальные imported origins остаются буквально.
    const annotate=(value:unknown,path:string)=>{if(typeof value==='number')next.origins[path]={kind:'experimental',unit:'SI',sourceRef:'src/app/ship-model-workspace.ts: explicit whole-scenario edit',note:'Явное условие следующего опыта, не канонические ТТХ.'};else if(value&&typeof value==='object')for(const [key,v]of Object.entries(value))annotate(v,path+'.'+key);};
    annotate(next.scenario,'scenario');annotate(durationSeconds,'durationSeconds');unwrap(validateRunSpecV3(next));
    const v=this.variants[this.selected];v.replay=structuredClone(next);v.scenarioName=next.scenario.name;
    v.conditions={...structuredClone(v.conditions),phases:structuredClone(next.scenario.phases),repeat:next.scenario.repeat,durationSeconds:next.durationSeconds};this.edited();
  }
  updateConditions(change:ShipModelConditions){
    this.idle();const v=this.variants[this.selected],nonTask=Object.keys(change).every(k=>['receiverProfile','backgroundK','observer'].includes(k));
    if(!nonTask&&!this.taskEditable)throw Error('Импортированный сценарий не представим простой формой; сохранены все фазы и requests. Доступны receiver, background и observer.');
    let replay:RunSpecV3|undefined;
    if(v.replay&&nonTask){
      replay=structuredClone(v.replay);
      if(change.receiverProfile!==undefined)replay.receiverProfile=change.receiverProfile;
      if(change.backgroundK!==undefined)replay.environment.radiativeBackgroundK=change.backgroundK;
      if(change.observer!==undefined)replay.observer=structuredClone(change.observer);
      unwrap(validateRunSpecV3(replay));
    }
    Object.assign(this.conditions,structuredClone(change));
    if(change.backgroundK!==undefined&&this.conditions.environment)this.conditions.environment.radiativeBackgroundK=change.backgroundK;
    if(['action','duty','maneuverRole'].some(k=>k in change))this.conditions.phases=undefined;
    v.replay=replay;this.edited();
  }
  setEnabled(id:string,enabled:boolean){this.idle();this.selectModel();const fit=structuredClone(this.fit!);if(fit.instances[id])fit.instances[id].enabled=enabled;else if(id.startsWith('builtin:'))fit.builtinModes[id]={...fit.builtinModes[id],enabled};else throw Error('Неизвестный установленный module ID');fit.fitRevision++;unwrap(parseFitJson(JSON.stringify(fit),this.catalog));this.replaceFit(fit);}
  private draftSpec(v:Variant):import('../catalog/schema').ValidationResult<RunSpecV3>{
    const builder=v.conditions.workMode==='mission'?makeShipModelMissionRun:makeShipModelMiningRun;
    const checked=v.replay?{ok:true as const,value:structuredClone(v.replay)}:builder(v.fit!,this.catalogFor(v.fit?.catalogVersion),v.conditions);
    if(checked.ok&&v.scenarioName)checked.value.scenario.name=v.scenarioName;return checked;
  }
  prepare(){this.selectModel();return structuredClone(unwrap(this.draftSpec(this.variants[this.selected])));}
  start(runId:string){this.idle();const spec=this.prepare();this.activeTest={runId,variantId:this.selected,fitRevision:spec.resolvedShip.fit.fitRevision,spec:structuredClone(spec),status:'running'};return spec;}
  startCheckpoint(runId:string){this.idle();const r=this.result;if(!r||r.status!=='paused'||r.state.timeSeconds>=r.spec.durationSeconds)throw Error('Нужен незавершённый paused /4 checkpoint');const saved=unwrap(parseStoredResultJson(JSON.stringify(r,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v)));if(saved.spec.schemaVersion!=='u2-lab/4')throw Error('Checkpoint требует /4');const checkpoint=structuredClone(saved as RunResultV3);checkpoint.runId=runId;this.activeTest={runId,variantId:this.selected,fitRevision:checkpoint.spec.resolvedShip.fit.fitRevision,spec:structuredClone(checkpoint.spec),status:'running'};return checkpoint;}
  setStatus(status:'running'|'paused'){if(this.activeTest)this.activeTest.status=status;}
  abort(){this.activeTest=undefined;this.governorTest=undefined;}
  acceptResult(r:RunResultV3){
    if(!this.activeTest||r.runId!==this.activeTest.runId||r.spec.schemaVersion!=='u2-lab/4')return false;
    const v=this.variants[this.activeTest.variantId],draft=this.draftSpec(v);
    v.result=structuredClone(r);v.stale=!draft.ok||JSON.stringify(r.spec)!==JSON.stringify(draft.value);
    this.comparisonBaseId??=this.activeTest.variantId;
    if(r.status==='complete'||r.status==='cancelled')this.activeTest=undefined;return true;
  }
  freeze(){
    const r=this.currentResult;
    if(!r||(this.activeTest&&this.activeTest.status!=='paused')||!['complete','paused'].includes(r.status))return false;
    this.frozenResult=structuredClone(r);this.frozenSource={variantId:this.activeTest?.variantId??this.selected};this.comparisonBaseId='reference';return true;
  }
  importDocument(text:string){
    this.idle();const doc=JSON.parse(text);let fit:ShipFitV3,replay:RunSpecV3|undefined,result:RunResultV3|undefined;
    if((doc.spec??doc)?.modelVersion===MODEL_V02){
      const parsed=doc.spec?unwrap(validateShipModelResultV02(doc)):undefined,spec=parsed?.spec??requireRunSpecV02(doc);
      this.governorVariants[this.selected]={spec:structuredClone(spec),...(parsed?{result:parsed}:{})};return;
    }
    if(doc.schemaVersion==='u2-ship-fit/2')fit=unwrap(parseFitJson(text,this.catalogFor(doc.catalogVersion)));
    else if(doc.spec&&doc.state){const parsed=unwrap(parseStoredResultJson(text));if(parsed.spec.schemaVersion!=='u2-lab/4')throw Error('Старые results открываются в старой модели, без миграции.');result=parsed as RunResultV3;fit=structuredClone(result.spec.resolvedShip.fit);replay=structuredClone(result.spec);}
    else {const spec=unwrap(parseExperimentJson(text));if(spec.schemaVersion!=='u2-lab/4')throw Error('Старая схема открывается в старой модели; нужна явная компиляция.');replay=spec;fit=structuredClone(spec.resolvedShip.fit);}
    const phase=replay?.scenario.phases[0],duties=phase?Object.values(phase.requests):[],role=phase&&replay?.resolvedShip.instances.find(i=>i.id in phase.requests&&i.role)?.role;
    this.variants[this.selected]={fit,conditions:replay?{workMode:replay.mission?'mission':'stationary',...(replay.mission?{mission:structuredClone(replay.mission)}:{}),durationSeconds:replay.durationSeconds,mode:replay.initialState.mode,receiverProfile:replay.receiverProfile,temperatureK:replay.initialState.temperatureK,backgroundK:replay.environment.radiativeBackgroundK,observer:structuredClone(replay.observer),environment:structuredClone(replay.environment),repeat:replay.scenario.repeat,phases:structuredClone(replay.scenario.phases),action:phase!.action,duty:duties.length&&duties.every(d=>d===duties[0])?duties[0]:1,maneuverRole:role??'march'}:structuredClone(this.conditions),result,replay,opened:result?'result':replay?'run':'fit'};
    if(result)this.comparisonBaseId??=this.selected;
    this.variants[this.selected].scenarioName=replay?.scenario.name;this.draftRevision[this.selected]++;delete this.governorVariants[this.selected];
  }
  inspectOpening(text:string){
    this.idle();const doc=JSON.parse(text);
    if(doc?.schemaVersion==='u2-ship-fit/1'){unwrap(parseFitJson(text,this.sourceCatalog));return {kind:'сборка',schemaVersion:doc.schemaVersion,legacy:true};}
    if(doc?.schemaVersion==='u2-ship-fit/2'){unwrap(parseFitJson(text,this.catalogFor(doc.catalogVersion)));return {kind:'сборка',schemaVersion:doc.schemaVersion,legacy:false};}
    const isResult=!!doc?.spec&&['state','metrics','channels','buckets','runId'].some(k=>k in doc);
    const governor=(doc.spec??doc)?.modelVersion===MODEL_V02;
    const spec=isResult?unwrap(parseStoredResultJson(text,{allowGovernorV02:true})).spec:governor?unwrap(parseExperimentJson(text,{allowGovernorV02:true})):unwrap(parseExperimentJson(text));
    if(spec.schemaVersion!=='u2-lab/4'&&spec.schemaVersion!=='u2-lab/1')unwrap(parseFitJson(JSON.stringify(spec.resolvedShip.fit),this.sourceCatalog));
    return {kind:isResult?'результат / checkpoint':'опыт',schemaVersion:spec.schemaVersion,legacy:spec.schemaVersion!=='u2-lab/4'};
  }
}
