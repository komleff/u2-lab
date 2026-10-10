import { appendSignatureBins, signatureBinEdges } from "./bins";
import { exactFields, validateSignatureSettings, type SignatureSettings } from "./config";
import { referenceCrossSection } from "./em-cs";
import { finite, label, nonnegative } from "./domain";
import { observerPreset, passiveObservation, receivedFlux, type PassiveObservation } from "./presets";
import { advanceRadar, createRadarState, radarObservations, restoreRadarCheckpoint, type RadarPulse, type StationaryRadarState } from "./radar";
import { addStatisticsInterval, emptyStatistics, type SignatureStatistics } from "./statistics";
import { curveBounds, curveCrossings, curveMean, curveValue, frameIrCurves, type EvaluatedCurve, type PendingSourceInterval, transformCurve, scaleCurve, curveBreakpoints, validateCurve } from "./history";
import { validateSignatureFrame, type SignatureFrame } from "./physics";

export const SOURCE_CHANNELS = ["IRtotal","IRknownOutward","IRobserver","IRcontrast","IRnose","IRrear","IRleft","IRright","EM","CS"] as const;
export type SourceChannel = typeof SOURCE_CHANNELS[number];
export interface SignatureEvent { timeS: number; channel: "IR" | "EM" | "radar"; kind: "acquired" | "lost" | "ping" | "echo" | "stale" | "expired" }
export interface SignatureBucket { startS:number; endS:number; values:Record<SourceChannel,{mean:number;min:number;max:number}> }
export interface PeakContext { startS:number; endS:number; phase:string; dominantSource:string }
export interface InstrumentLedger {
  initialCapJ: number; externalEnergyJ: number; rfExportJ: number; hostHeatJ: number;
  escapedEmJ: number; capturedEmJ: number; remainingCapJ: number;
}
export interface SignatureRuntimeState {
  version: "signatures-runtime-0.1" | "signatures-runtime-0.2";
  timeS: number;
  pending: PendingSourceInterval[];
  lastTruth: SignatureFrame | null;
  sourceStats: Record<SourceChannel,SignatureStatistics>;
  peakContexts: Record<SourceChannel,PeakContext|null>;
  observerStats: Record<"IR"|"EM",SignatureStatistics>;
  rfStats: SignatureStatistics;
  buckets: SignatureBucket[];
  held: { IR:boolean; EM:boolean };
  passive: { IR:PassiveObservation|null; EM:PassiveObservation|null };
  radar: StationaryRadarState;
  pulseTail: RadarPulse[];
  instrument: InstrumentLedger;
  events: SignatureEvent[];
}
export function createSignatureRuntime(settings: SignatureSettings, horizonS?: number): SignatureRuntimeState {
  if(horizonS!==undefined)signatureBinEdges(horizonS);
  const s=validateSignatureSettings(settings),preset=observerPreset(s.observerPreset);
  const radar=createRadarState({size:preset.size,initialCap:s.initialCap,rangeM:s.rangeM,
    crossSectionM2:referenceCrossSection(s.geometry,s.aspectDeg,s.ram),intervalS:s.radarIntervalS,enabled:s.radarEnabled});
  return {version:horizonS===undefined?"signatures-runtime-0.1":"signatures-runtime-0.2",timeS:0,pending:[],lastTruth:null,
    sourceStats:Object.fromEntries(SOURCE_CHANNELS.map(k=>[k,emptyStatistics()])) as Record<SourceChannel,SignatureStatistics>,
    peakContexts:Object.fromEntries(SOURCE_CHANNELS.map(k=>[k,null])) as Record<SourceChannel,PeakContext|null>,
    observerStats:{IR:emptyStatistics(),EM:emptyStatistics()},rfStats:emptyStatistics(),buckets:[],held:{IR:false,EM:false},passive:{IR:null,EM:null},
    radar,pulseTail:[],instrument:{initialCapJ:radar.initialCapJ,externalEnergyJ:0,rfExportJ:0,hostHeatJ:0,escapedEmJ:0,capturedEmJ:0,remainingCapJ:radar.capJ},events:[]};
}
function emit(state:SignatureRuntimeState,event:SignatureEvent) {
  state.events.push(event);if(state.events.length>200)state.events.shift();
}
function statistics(state:SignatureStatistics,curve:EvaluatedCurve,startS:number,endS:number,phase:string,from=0,to=1,pulsePeakValue:number|null=null) {
  const bounds=curveBounds(curve,from,to),meanValue=curveMean(curve,from,to);
  return addStatisticsInterval(state,{startS,endS,phase,meanValue,minValue:Math.min(bounds.min,meanValue),maxValue:Math.max(bounds.max,meanValue),pulsePeakValue});
}
function recordSource(state:SignatureRuntimeState,f:SignatureFrame,phase:string,s:SignatureSettings,horizonS?:number) {
  if(state.version==="signatures-runtime-0.2") {
    signatureBinEdges(horizonS!);if(f.endS>horizonS!)throw new RangeError("Accepted source exceeds signature horizon");
  }
  if(f.startS!==state.timeS||!(f.endS>f.startS))throw new RangeError(`Accepted source intervals must be continuous and positive: clock=${state.timeS}, frame=${f.startS}–${f.endS}`);
  const selected=frameIrCurves(f,s.aspectDeg);
  const views={IRnose:frameIrCurves(f,0),IRrear:frameIrCurves(f,180),IRleft:frameIrCurves(f,90),IRright:frameIrCurves(f,270)};
  const constant=(value:number)=>({a:value,b:0,c:0});
  const curves:Record<SourceChannel,EvaluatedCurve>={IRtotal:transformCurve(selected.intrinsicContrast,s.advancedIr?"absolute":"positive"),IRknownOutward:selected.intrinsic,IRobserver:transformCurve(selected.contrast,s.advancedIr?"absolute":"positive"),IRcontrast:selected.contrast,
    IRnose:transformCurve(views.IRnose.contrast,s.advancedIr?"absolute":"positive"),IRrear:transformCurve(views.IRrear.contrast,s.advancedIr?"absolute":"positive"),IRleft:transformCurve(views.IRleft.contrast,s.advancedIr?"absolute":"positive"),IRright:transformCurve(views.IRright.contrast,s.advancedIr?"absolute":"positive"),
    EM:constant(f.em.observedEmW),CS:constant(referenceCrossSection(s.geometry,s.aspectDeg,s.ram))};
  const values={} as SignatureBucket["values"];
  for(const channel of SOURCE_CHANNELS) {
    const priorMax=state.sourceStats[channel].total.max;
    state.sourceStats[channel]=statistics(state.sourceStats[channel],curves[channel],f.startS,f.endS,phase);
    values[channel]={mean:curveMean(curves[channel],0,1),...curveBounds(curves[channel],0,1)};
    if(priorMax===null||state.sourceStats[channel].total.max!>priorMax){
      const dominant=(rows:readonly {id:string;value:number}[])=>rows.reduce((best,row)=>Math.abs(row.value)>Math.abs(best.value)?row:best,{id:"zero-flow",value:0}).id;
      const components=channel in views?views[channel as keyof typeof views].mean.components:selected.mean.components;
      const dominantSource=channel==="CS"?"reference-geometry/RAM":channel==="EM"?dominant(f.stages.map(x=>({id:x.id,value:x.actualW}))):dominant([...components.map(x=>({id:x.id,value:channel==="IRknownOutward"?x.absoluteIrW:channel==="IRtotal"?x.contrastW:x.projectedContrastW})),...(channel==="IRknownOutward"?[]:f.coolers.map(c=>({id:"cooler:"+c.id,value:c.contrastRkMeanW})))]);
      state.peakContexts[channel]={startS:f.startS,endS:f.endS,phase,dominantSource};
    }
  }
  if(state.version==="signatures-runtime-0.2")appendSignatureBins(state.buckets,curves,f.startS,f.endS,horizonS!);
  else {
  state.buckets.push({startS:f.startS,endS:f.endS,values});
  if(state.buckets.length>2000) {
    const merged:SignatureBucket[]=[];
    for(let i=0;i<state.buckets.length;i+=2){const a=state.buckets[i],b=state.buckets[i+1];if(!b){merged.push(a);continue;}
      const da=a.endS-a.startS,db=b.endS-b.startS,v={} as SignatureBucket["values"];
      for(const k of SOURCE_CHANNELS)v[k]={mean:(a.values[k].mean*da+b.values[k].mean*db)/(da+db),min:Math.min(a.values[k].min,b.values[k].min),max:Math.max(a.values[k].max,b.values[k].max)};
      merged.push({startS:a.startS,endS:b.endS,values:v});
    }state.buckets=merged;
  }
  }
  const preset=observerPreset(s.observerPreset),area=4*Math.PI*s.rangeM*s.rangeM;
  const thresholds=[preset.ir.detectWm2,preset.ir.holdWm2,0,...(s.advancedIr?[-preset.ir.detectWm2,-preset.ir.holdWm2]:[])];
  const crossings=thresholds.flatMap(fluxWm2=>curveCrossings(selected.contrast,fluxWm2*area).map(fraction=>({fraction,fluxWm2}))).sort((a,b)=>a.fraction-b.fraction);
  state.pending.push({startS:f.startS,endS:f.endS,phase,ir:selected.contrast,emW:f.em.observedEmW,crossings});
  state.lastTruth=f;
}
function contact(state:SignatureRuntimeState,s:SignatureSettings,channel:"IR"|"EM",flux:number,timeS:number) {
  const observed=passiveObservation({presetId:s.observerPreset,channel,signedFluxWm2:flux,bearingDeg:0,held:state.held[channel],advancedIr:s.advancedIr});
  if(!!observed!==state.held[channel])emit(state,{timeS,channel,kind:observed?"acquired":"lost"});
  state.held[channel]=!!observed;state.passive[channel]=observed;
}
function receiveSource(state:SignatureRuntimeState,s:SignatureSettings,previousTimeS:number,toTimeS:number) {
  const delay=s.rangeM/3000;
  for(const f of state.pending) {
    const start=Math.max(previousTimeS,f.startS+delay),end=Math.min(toTimeS,f.endS+delay);
    if(end<start||start>toTimeS)continue;
    const duration=f.endS-f.startS,from=(start-delay-f.startS)/duration,to=(end-delay-f.startS)/duration;
    const points=[...new Set([from,...f.crossings.map(x=>x.fraction).filter(x=>x>from&&x<to),...curveBreakpoints(f.ir).filter(x=>x>from&&x<to),to])].sort((a,b)=>a-b);
    // Граница equality использует сам точный порог. Правый открытый интервал
    // проверяем midpoint; epsilon не расширяет detect/hold predicates.
    const boundaryFlux=(fraction:number)=>f.crossings.find(x=>x.fraction===fraction)?.fluxWm2??receivedFlux(curveValue(f.ir,fraction),s.rangeM);
    contact(state,s,"IR",boundaryFlux(from),start);
    contact(state,s,"EM",receivedFlux(f.emW,s.rangeM),start);
    for(let i=1;i<points.length;i++) {
      if(points[i]>points[i-1])contact(state,s,"IR",receivedFlux(curveValue(f.ir,(points[i]+points[i-1])/2),s.rangeM),f.startS+delay+points[i-1]*duration);
      contact(state,s,"IR",boundaryFlux(points[i]),f.startS+delay+points[i]*duration);
    }
    if(end>start) {
      const area=4*Math.PI*s.rangeM*s.rangeM;
      state.observerStats.IR=statistics(state.observerStats.IR,scaleCurve(transformCurve(f.ir,s.advancedIr?"absolute":"positive"),1/area),start,end,f.phase,from,to);
      state.observerStats.EM=statistics(state.observerStats.EM,{a:receivedFlux(f.emW,s.rangeM),b:0,c:0},start,end,f.phase);
    }
  }
  state.pending=state.pending.filter(f=>f.endS+delay>toTimeS);
}
function instrumentLedger(state:SignatureRuntimeState,s:SignatureSettings) {
  const radar=state.radar,processingJ=observerPreset(s.observerPreset).receiverProcessingW*state.timeS;
  const rawEmJ=.0000215*(processingJ+radar.externalRechargeJ+radar.pulseSequence*(radar.size==="M"?50000:12500));
  const hostBudgetJ=processingJ+radar.hostHeatJ;
  if(rawEmJ>hostBudgetJ)throw new RangeError("Instrument parasitic export exceeds actual loss budget");
  // Аналитические покрытия цели не устанавливают оборудование на внешний прибор.
  const escapedEmJ=rawEmJ;
  state.instrument={initialCapJ:radar.initialCapJ,externalEnergyJ:processingJ+radar.externalRechargeJ,rfExportJ:radar.rfExportJ,
    hostHeatJ:hostBudgetJ-escapedEmJ,escapedEmJ,capturedEmJ:rawEmJ-escapedEmJ,remainingCapJ:radar.capJ};
}
function advanceInstrument(state:SignatureRuntimeState,s:SignatureSettings,toTimeS:number) {
  const before=radarObservations(state.radar),radar=advanceRadar(state.radar,toTimeS);
  state.radar=radar.state;
  for(const p of radar.emittedPulses)emit(state,{timeS:p.emittedAtS,channel:"radar",kind:"ping"});
  for(const e of radar.receivedEchoes)emit(state,{timeS:e.receivedAtS,channel:"radar",kind:"echo"});
  for(const e of before)if(e.freshness==="fresh"&&toTimeS>=e.receivedAtS+3)emit(state,{timeS:e.receivedAtS+3,channel:"radar",kind:"stale"});
  for(const e of before)if(toTimeS>=e.receivedAtS+13)emit(state,{timeS:e.receivedAtS+13,channel:"radar",kind:"expired"});
  const pulses=[...state.pulseTail,...radar.emittedPulses];let cursor=state.timeS;
  const segment=(end:number,value:number)=> {if(end>cursor){state.rfStats=statistics(state.rfStats,{a:value,b:0,c:0},cursor,end,"instrument",0,1,value>0?value:null);cursor=end;}};
  for(const pulse of pulses){const from=Math.max(cursor,pulse.emittedAtS),to=Math.min(toTimeS,pulse.emittedAtS+pulse.pulseWidthS);if(to<=from)continue;segment(from,0);segment(to,pulse.rfPeakW);}
  segment(toTimeS,0);state.pulseTail=pulses.filter(p=>p.emittedAtS+p.pulseWidthS>toTimeS);
}
export function commitSignatureFrames(state:SignatureRuntimeState,frames:readonly SignatureFrame[],phase:string,settings:SignatureSettings,horizonS?:number):void {
  // Вызывается только из accepted recordStep, никогда из physics trial.
  for(const frame of frames) {
    const previous=state.timeS;recordSource(state,frame,phase,settings,horizonS);
    receiveSource(state,settings,previous,frame.endS);advanceInstrument(state,settings,frame.endS);
    state.timeS=frame.endS;instrumentLedger(state,settings);
  }
  state.events.sort((a,b)=>a.timeS-b.timeS);
}
export function observerView(state:SignatureRuntimeState,settings:SignatureSettings) {
  return {version:"observer-view-0.1" as const,passive:Object.values(state.passive).filter((v):v is PassiveObservation=>v!==null).map(v=>({...v})),
    radar:radarObservations(state.radar).map(v=>({...v}))};
}

export function restoreSignatureRuntime(value:unknown,settings:SignatureSettings,timeS:number,horizonS?:number):SignatureRuntimeState {
  const obj=exactFields(value,["version","timeS","pending","lastTruth","sourceStats","peakContexts","observerStats","rfStats","buckets","held","passive","radar","pulseTail","instrument","events"],"signature checkpoint") as unknown as SignatureRuntimeState;
  nonnegative(timeS,"checkpoint clock");nonnegative(obj.timeS,"source clock");
  if(!["signatures-runtime-0.1","signatures-runtime-0.2"].includes(obj.version)||obj.timeS!==timeS)throw new RangeError("Inconsistent source checkpoint clock/version");
  const edges=obj.version==="signatures-runtime-0.2"?signatureBinEdges(horizonS!):null;
  if(edges&&timeS>horizonS!)throw new RangeError("Source checkpoint exceeds H");
  const walk=(v:unknown):void=>{if(typeof v==="number")finite(v,"checkpoint");else if(v&&typeof v==="object")Object.values(v).forEach(walk);};walk(obj);
  const radar=restoreRadarCheckpoint(obj.radar),expected=createSignatureRuntime(settings);
  for(const k of ["size","rangeM","crossSectionM2","intervalS","enabled","initialCapJ"] as const)if(radar[k]!==expected.radar[k])throw new RangeError("Radar/settings mismatch: "+k);
  if(radar.timeS!==timeS)throw new RangeError("Radar/source clocks differ");
  if(!Array.isArray(obj.pending)||!Array.isArray(obj.buckets)||!Array.isArray(obj.pulseTail)||!Array.isArray(obj.events)||obj.buckets.length>(edges?edges.length-1:2000)||obj.events.length>200)throw new TypeError("Invalid bounded source history");
  let end:number|null=null;
  for(const frame of obj.pending) {
    exactFields(frame,["startS","endS","phase","ir","emW","crossings"],"pending source");validateCurve(frame.ir);
    nonnegative(frame.startS,"source start");finite(frame.endS,"source end");nonnegative(frame.emW,"source EM");
    if(!(frame.endS>frame.startS)||frame.endS>timeS||(end!==null&&frame.startS!==end)||typeof frame.phase!=="string"||!frame.phase)throw new RangeError("Source history is not a continuous accepted sequence");
    end=frame.endS;
    if(!Array.isArray(frame.crossings))throw new TypeError("crossings required");
    for(const x of frame.crossings){exactFields(x,["fraction","fluxWm2"],"crossing");finite(x.fraction,"crossing fraction");finite(x.fluxWm2,"crossing flux");if(x.fraction<0||x.fraction>1)throw new RangeError("Invalid crossing");}
    const preset=observerPreset(settings.observerPreset),area=4*Math.PI*settings.rangeM*settings.rangeM;
    const thresholds=[preset.ir.detectWm2,preset.ir.holdWm2,0,...(settings.advancedIr?[-preset.ir.detectWm2,-preset.ir.holdWm2]:[])];
    const crossings=thresholds.flatMap(fluxWm2=>curveCrossings(frame.ir,fluxWm2*area).map(fraction=>({fraction,fluxWm2}))).sort((a,b)=>a.fraction-b.fraction);
    if(JSON.stringify(crossings)!==JSON.stringify(frame.crossings))throw new RangeError("Inconsistent source crossings");
  }
  if(timeS>0&&(!obj.pending.length||obj.pending[0].startS>Math.max(0,timeS-settings.rangeM/3000)||end!==timeS))throw new RangeError("Missing mandatory source interval");
  for(const [map,keys] of [[obj.sourceStats,SOURCE_CHANNELS],[obj.observerStats,["IR","EM"]]] as const){exactFields(map,keys,"statistics channels");}
  for(const stats of [...Object.values(obj.sourceStats),...Object.values(obj.observerStats),obj.rfStats]) {
    exactFields(stats,["lastEndS","total","phases"],"statistics");
    if(stats.lastEndS!==null)nonnegative(stats.lastEndS,"statistics lastEndS");
    exactFields(stats.phases,Object.keys(stats.phases),"statistics phases");
    Object.keys(stats.phases).forEach(phase=>label(phase,"statistics phase"));
    for(const aggregate of [stats.total,...Object.values(stats.phases)]) {
      exactFields(aggregate,["durationS","integral","min","max","liveValue","pulsePeak"],"aggregate");nonnegative(aggregate.durationS,"duration");
      finite(aggregate.integral,"statistics integral");
      for(const key of ["min","max","liveValue","pulsePeak"] as const)if(aggregate[key]!==null)finite(aggregate[key],"statistics "+key);
      if(aggregate.durationS===0) {
        if([aggregate.min,aggregate.max,aggregate.liveValue,aggregate.pulsePeak].some(v=>v!==null)||aggregate.integral!==0)throw new RangeError("Inconsistent statistics");
        continue;
      }
      if(aggregate.min===null||aggregate.max===null||aggregate.liveValue===null||aggregate.min>aggregate.max||aggregate.liveValue<aggregate.min||aggregate.liveValue>aggregate.max||(aggregate.pulsePeak!==null&&(aggregate.pulsePeak<aggregate.min||aggregate.pulsePeak>aggregate.max)))throw new RangeError("Inconsistent statistics");
      const mean=finite(aggregate.integral/aggregate.durationS,"statistics mean");
      // Сравниваем только выход за extrema: расширение ±MAX_VALUE на tolerance
      // переполнилось бы даже при допустимом конечном mean внутри интервала.
      if((mean<aggregate.min&&finite(aggregate.min-mean,"statistics lower difference")>1e-12*Math.abs(aggregate.min))||(mean>aggregate.max&&finite(mean-aggregate.max,"statistics upper difference")>1e-12*Math.abs(aggregate.max)))throw new RangeError("Inconsistent statistics");
    }
    const phaseDuration=finite(Object.values(stats.phases).reduce((n,p)=>n+p.durationS,0),"phase duration sum");
    const phaseIntegral=finite(Object.values(stats.phases).reduce((n,p)=>n+p.integral,0),"phase integral sum"),reference=finite(Object.values(stats.phases).reduce((n,p)=>n+Math.abs(p.integral),0),"phase integral reference");
    if(Math.abs(finite(phaseDuration-stats.total.durationS,"phase duration difference"))>1e-12*stats.total.durationS||Math.abs(finite(phaseIntegral-stats.total.integral,"phase integral difference"))>1e-12*reference)throw new RangeError("Inconsistent phase totals");
  }
  const ownEpoch=(stats:SignatureStatistics,durationS:number,name:string)=>{
    if(stats.lastEndS!==(durationS>0?timeS:null)||Math.abs(stats.total.durationS-durationS)>1e-12*durationS)throw new RangeError(name+" statistics clock mismatch");
  };
  for(const stats of Object.values(obj.sourceStats))ownEpoch(stats,timeS,"Source");
  ownEpoch(obj.rfStats,timeS,"RF");
  // На exact arrival границе ещё нет положительного received интервала.
  const receivedDurationS=Math.max(0,timeS-settings.rangeM/3000);
  for(const stats of Object.values(obj.observerStats))ownEpoch(stats,receivedDurationS,"Observer");
  exactFields(obj.peakContexts,SOURCE_CHANNELS,"peak contexts");
  for(const channel of SOURCE_CHANNELS){const peak=obj.peakContexts[channel],stats=obj.sourceStats[channel];
    if(stats.total.max===null?peak!==null:peak===null)throw new RangeError("Missing peak context");
    if(peak){exactFields(peak,["startS","endS","phase","dominantSource"],"peak context");nonnegative(peak.startS,"peak start");finite(peak.endS,"peak end");label(peak.phase,"peak phase");label(peak.dominantSource,"dominant source");if(!(peak.endS>peak.startS)||peak.endS>timeS||!Object.hasOwn(stats.phases,peak.phase)||stats.phases[peak.phase].max!==stats.total.max)throw new RangeError("Inconsistent peak context");}
  }
  exactFields(obj.held,["IR","EM"],"passive hold");exactFields(obj.passive,["IR","EM"],"passive state");
  for(const channel of ["IR","EM"] as const) {
    if(typeof obj.held[channel]!=="boolean"||obj.held[channel]!==!!obj.passive[channel])throw new TypeError("Inconsistent hold state");
    const spot=obj.passive[channel];if(spot){exactFields(spot,["channel","bearingDeg","brightnessWm2"],"passive observation");finite(spot.bearingDeg,"passive bearing");nonnegative(spot.brightnessWm2,"passive brightness");if(spot.channel!==channel||spot.bearingDeg!==0)throw new RangeError("Invalid observation");}
  }
  if(timeS<settings.rangeM/3000){if(obj.held.IR||obj.held.EM)throw new RangeError("Premature passive contact");}
  else if(obj.pending.length) {
    const source=obj.pending[0],fraction=(timeS-settings.rangeM/3000-source.startS)/(source.endS-source.startS);
    for(const channel of ["IR","EM"] as const) {
      const flux=channel==="IR"?source.crossings.find(x=>x.fraction===fraction)?.fluxWm2??receivedFlux(curveValue(source.ir,fraction),settings.rangeM):receivedFlux(source.emW,settings.rangeM);
      const expected=passiveObservation({presetId:settings.observerPreset,channel,signedFluxWm2:flux,bearingDeg:0,held:obj.held[channel],advancedIr:settings.advancedIr});
      if(JSON.stringify(expected)!==JSON.stringify(obj.passive[channel]))throw new RangeError("Inconsistent received observation");
    }
  }
  let bucketEnd=0;
  for(const [index,b] of obj.buckets.entries()) {
    exactFields(b,["startS","endS","values"],"signature bucket");exactFields(b.values,SOURCE_CHANNELS,"bucket channels");
    nonnegative(b.startS,"bucket start");finite(b.endS,"bucket end");
    if(edges&&(b.startS!==edges[index]||b.endS!==Math.min(edges[index+1],timeS)))throw new RangeError("Inconsistent uniform signature grid");
    if(b.startS!==bucketEnd||!(b.endS>b.startS)||b.endS>timeS)throw new RangeError("Missing or inconsistent signature buckets");bucketEnd=b.endS;
    for(const k of SOURCE_CHANNELS){
      const v=b.values[k];exactFields(v,["mean","min","max"],"bucket values");for(const x of Object.values(v))finite(x,"bucket value");
      // Retention division can round mean one ULP outside computed extrema.
      // Use the aggregate reader's endpoint-relative policy; zero stays exact.
      if(v.min>v.max||(v.mean<v.min&&finite(v.min-v.mean,"bucket lower difference")>1e-12*Math.abs(v.min))||(v.mean>v.max&&finite(v.mean-v.max,"bucket upper difference")>1e-12*Math.abs(v.max)))throw new RangeError("Inconsistent bucket bounds");
    }
  }
  if(bucketEnd!==timeS)throw new RangeError("Missing signature bucket suffix");
  if(timeS===0 ? obj.lastTruth!==null : obj.lastTruth===null||obj.lastTruth.endS!==timeS)throw new RangeError("Missing current source");
  if(obj.lastTruth)validateSignatureFrame(obj.lastTruth,settings);
  for(const pulse of obj.pulseTail) {
    exactFields(pulse,["pulseId","emittedAtS","rfEnergyJ","pulseWidthS","rfPeakW"],"active RF pulse");
    const energy=radar.size==="M"?22500:5625;
    if(pulse.pulseId!==radar.pulseSequence||pulse.emittedAtS!==radar.lastEmittedAtS||pulse.pulseWidthS!==.005||pulse.rfEnergyJ!==energy||pulse.rfPeakW!==energy/.005||!(timeS<pulse.emittedAtS+.005))throw new RangeError("Inconsistent active pulse");
  }
  if(obj.pulseTail.length>1||((radar.lastEmittedAtS!==null&&timeS<radar.lastEmittedAtS+.005)!==(obj.pulseTail.length===1)))throw new RangeError("Missing active pulse");
  // Оплата целого ping и уже проинтегрированный RF различаются во время 5 ms tail.
  const remainingRfJ=obj.pulseTail.reduce((sum,p)=>sum+p.rfEnergyJ*(1-Math.min(1,(timeS-p.emittedAtS)/p.pulseWidthS)),0);
  const integratedRfJ=radar.rfExportJ-remainingRfJ;
  if(integratedRfJ===0?obj.rfStats.total.integral!==0:Math.abs(obj.rfStats.total.integral-integratedRfJ)>1e-6*Math.abs(integratedRfJ)+1e-12*radar.rfExportJ)throw new RangeError("RF statistics/paid pulse mismatch");
  for(const event of obj.events){exactFields(event,["timeS","channel","kind"],"signature event");nonnegative(event.timeS,"event time");if(event.timeS>timeS||!["IR","EM","radar"].includes(event.channel)||!["acquired","lost","ping","echo","stale","expired"].includes(event.kind))throw new RangeError("Invalid signature event");}
  const cloned=structuredClone(obj);cloned.radar=radar;instrumentLedger(cloned,settings);
  exactFields(obj.instrument,Object.keys(cloned.instrument),"instrument ledger");
  for(const k of Object.keys(cloned.instrument) as (keyof InstrumentLedger)[])if(obj.instrument[k]!==cloned.instrument[k])throw new RangeError("Inconsistent instrument ledger");
  return cloned;
}
