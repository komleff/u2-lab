import type {CandidateCatalog,ShipFit} from '../fitting/types';
import {getPresetFit,loadCandidateCatalog} from '../fitting/catalog';
import {compileFitToShipModelV01} from '../fitting/compile';
import type {CandidateCatalogV3,ShipFitV3,PromotedFitV3,RunSpecV3} from '../model/v3/types';
import {makeShipModelMiningRun,type ShipModelConditions} from '../scenarios/fitting';
import {parseFitJson,parseExperimentJson} from '../io/fitting-json';
import {parseStoredResultJson} from '../io/fitting-result';
import type {RunResultV3} from '../runner/ship-model-run';
import {validateRunSpecV3} from '../model/v3/schema';
type Variant={fit?:ShipFitV3;conditions:ShipModelConditions;result?:RunResultV3;replay?:RunSpecV3;stale?:boolean;opened?:'fit'|'run'|'result'};
const unwrap=<T>(r:import('../catalog/schema').ValidationResult<T>):T=>{if(!r.ok)throw Error(r.errors.map(e=>e.path+': '+e.message).join('\n'));return r.value;};
/** Independent /4 draft: legacy variants and ReturnTypes remain untouched. */
export class ShipModelWorkspace{
  readonly source:ShipFit;readonly catalog:CandidateCatalogV3=loadCandidateCatalog('ship-fitting-0.3.0');
  preview?:PromotedFitV3;selected:'A'|'B'='A';active?:{runId:string;spec:RunSpecV3;status:'running'|'paused'};
  private variants:Record<'A'|'B',Variant>={A:{conditions:{durationSeconds:60,mode:'Efficient',receiverProfile:'positive-only',temperatureK:300,backgroundK:100,observer:{presetId:'S-dedicated-G1',rangeM:16000,aspectDeg:0}}},B:{conditions:{}}};
  constructor(source:ShipFit,readonly sourceCatalog:CandidateCatalog){this.source=structuredClone(source);}
  get fit(){return this.variants[this.selected].fit;}
  get conditions(){return this.variants[this.selected].conditions;}
  get result(){return this.variants[this.selected].result;}
  get opened(){return this.variants[this.selected].opened??'fit';}
  get comparison(){return {A:this.variants.A.result,B:this.variants.B.result};}
  isStale(){return !!this.result&&!!this.variants[this.selected].stale;}
  get taskEditable(){
    const phases=this.conditions.phases;if(!phases)return true;
    if(phases.length!==1||phases[0].environment!==null||phases[0].mode!==undefined)return false;
    const fresh=this.fit&&makeShipModelMiningRun(this.fit,this.catalog,{...this.conditions,phases:undefined});
    return !!fresh?.ok&&phases[0].action===fresh.value.scenario.phases[0].action&&JSON.stringify(Object.entries(phases[0].requests).sort())===JSON.stringify(Object.entries(fresh.value.scenario.phases[0].requests).sort());
  }
  private edited(){this.variants[this.selected].stale=!!this.result;}
  private replaceFit(fit:ShipFitV3){
    if(this.conditions.phases)unwrap(makeShipModelMiningRun(fit,this.catalog,this.conditions));
    const v=this.variants[this.selected];v.fit=fit;v.replay=undefined;v.opened='fit';this.edited();
  }
  private idle(){if(this.active)throw Error('Сначала завершите/отмените активный тест; его controls принадлежат исходному варианту.');}
  selectModel(){if(!this.fit)throw Error('Старый fit: требуется явная компиляция с diff, model toggle не мигрирует данные.');}
  previewCompilation(templates:Record<string,string>){this.idle();this.preview=unwrap(compileFitToShipModelV01(this.source,this.sourceCatalog,this.catalog,{variantTemplates:templates}));return structuredClone(this.preview);}
  applyCompilation(){this.idle();if(!this.preview)throw Error('Сначала просмотрите diff компиляции.');this.replaceFit(structuredClone(this.preview.fit));}
  loadPreset(id:string){this.idle();const fit=getPresetFit(id,this.catalog.version);unwrap(parseFitJson(JSON.stringify(fit),this.catalog));this.replaceFit(fit);}
  copyToB(){this.idle();this.selectModel();this.variants.B=structuredClone(this.variants[this.selected]);this.variants.B.result=undefined;this.variants.B.opened=this.variants.B.replay?'run':'fit';this.selected='B';}
  selectVariant(id:'A'|'B'){this.idle();this.selected=id;}
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
  prepare(){this.selectModel();return structuredClone(this.variants[this.selected].replay??unwrap(makeShipModelMiningRun(this.fit!,this.catalog,this.conditions)));}
  start(runId:string){this.idle();const spec=this.prepare();this.active={runId,spec:structuredClone(spec),status:'running'};return spec;}
  startCheckpoint(runId:string){this.idle();const r=this.result;if(!r||r.status!=='paused'||r.state.timeSeconds>=r.spec.durationSeconds)throw Error('Нужен незавершённый paused /4 checkpoint');const saved=unwrap(parseStoredResultJson(JSON.stringify(r,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v)));if(saved.spec.schemaVersion!=='u2-lab/4')throw Error('Checkpoint требует /4');const checkpoint=structuredClone(saved as RunResultV3);checkpoint.runId=runId;this.active={runId,spec:structuredClone(checkpoint.spec),status:'running'};return checkpoint;}
  setStatus(status:'running'|'paused'){if(this.active)this.active.status=status;}
  acceptResult(r:RunResultV3){
    if(!this.active||r.runId!==this.active.runId||r.spec.schemaVersion!=='u2-lab/4')return false;
    const v=this.variants[this.selected],draft=v.replay?{ok:true as const,value:v.replay}:makeShipModelMiningRun(this.fit!,this.catalog,this.conditions);
    v.result=structuredClone(r);v.stale=!draft.ok||JSON.stringify(r.spec)!==JSON.stringify(draft.value);
    if(r.status==='complete'||r.status==='cancelled')this.active=undefined;return true;
  }
  importDocument(text:string){
    this.idle();const doc=JSON.parse(text);let fit:ShipFitV3,replay:RunSpecV3|undefined,result:RunResultV3|undefined;
    if(doc.schemaVersion==='u2-ship-fit/2')fit=unwrap(parseFitJson(text,this.catalog));
    else if(doc.spec&&doc.state){const parsed=unwrap(parseStoredResultJson(text));if(parsed.spec.schemaVersion!=='u2-lab/4')throw Error('Старые results открываются в старой модели, без миграции.');result=parsed as RunResultV3;fit=structuredClone(result.spec.resolvedShip.fit);replay=structuredClone(result.spec);}
    else {const spec=unwrap(parseExperimentJson(text));if(spec.schemaVersion!=='u2-lab/4')throw Error('Старая схема открывается в старой модели; нужна явная компиляция.');replay=spec;fit=structuredClone(spec.resolvedShip.fit);}
    const phase=replay?.scenario.phases[0],duties=phase?Object.values(phase.requests):[],role=phase&&replay?.resolvedShip.instances.find(i=>i.id in phase.requests&&i.role)?.role;
    this.variants[this.selected]={fit,conditions:replay?{durationSeconds:replay.durationSeconds,mode:replay.initialState.mode,receiverProfile:replay.receiverProfile,temperatureK:replay.initialState.temperatureK,backgroundK:replay.environment.radiativeBackgroundK,observer:structuredClone(replay.observer),environment:structuredClone(replay.environment),repeat:replay.scenario.repeat,phases:structuredClone(replay.scenario.phases),action:phase!.action,duty:duties.length&&duties.every(d=>d===duties[0])?duties[0]:1,maneuverRole:role??'march'}:structuredClone(this.conditions),result,replay,opened:result?'result':replay?'run':'fit'};
  }
  inspectOpening(text:string){
    this.idle();const doc=JSON.parse(text);
    if(doc?.schemaVersion==='u2-ship-fit/1'){unwrap(parseFitJson(text,this.sourceCatalog));return {kind:'сборка',schemaVersion:doc.schemaVersion,legacy:true};}
    if(doc?.schemaVersion==='u2-ship-fit/2'){unwrap(parseFitJson(text,this.catalog));return {kind:'сборка',schemaVersion:doc.schemaVersion,legacy:false};}
    const isResult=!!doc?.spec&&['state','metrics','channels','buckets','runId'].some(k=>k in doc);
    const spec=isResult?unwrap(parseStoredResultJson(text)).spec:unwrap(parseExperimentJson(text));
    if(spec.schemaVersion!=='u2-lab/4'&&spec.schemaVersion!=='u2-lab/1')unwrap(parseFitJson(JSON.stringify(spec.resolvedShip.fit),this.sourceCatalog));
    return {kind:isResult?'результат / checkpoint':'опыт',schemaVersion:spec.schemaVersion,legacy:spec.schemaVersion!=='u2-lab/4'};
  }
}
