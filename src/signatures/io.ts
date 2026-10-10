import type { RunResultV2 } from "../runner/fitting-run";
import { observerView, SOURCE_CHANNELS } from "./runtime";
import { statisticsView } from "./statistics";

export function exportObserverJson(result:RunResultV2):string {
  if(!result.signatures||!result.spec.signatures)throw new Error("Нет измерений observer");
  return JSON.stringify(observerView(result.signatures,result.spec.signatures),null,2);
}
export function exportObserverCsv(result:RunResultV2):string {
  const view=JSON.parse(exportObserverJson(result)) as ReturnType<typeof observerView>;
  return "# "+view.version+"\nchannel,bearing_deg,brightness_Wm2,pulse_id,received_s,measured_range_m,freshness\n"+
    [...view.passive.map(p=>[p.channel,p.bearingDeg,p.brightnessWm2,"","","",""].join(",")),
      ...view.radar.map(r=>[r.channel,"","",r.pulseId,r.receivedAtS,r.measuredRangeM,r.freshness].join(","))].join("\n");
}
export function exportSignatureCsv(result:RunResultV2):string {
  const state=result.signatures;if(!state)throw new Error("Нет измерений сигнатур");
  const meta={...(state.version==="signatures-runtime-0.2"?{history:{version:state.version,representation:"uniform-horizon-100",horizonS:result.spec.durationSeconds}}:{}),schema:"u2-signature-trace/1",model:result.spec.modelVersion,settings:result.spec.signatures,
    statistics:Object.fromEntries(SOURCE_CHANNELS.map(k=>[k,statisticsView(state.sourceStats[k])])),instrument:state.instrument,sourceAccounting:state.lastTruth?{knownOutwardComponents:state.lastTruth.components,coolers:state.lastTruth.coolers,exports:state.lastTruth.exports,stages:state.lastTruth.stages}:null,channelMeaning:{IRtotal:"intrinsic sensor equivalent before angular projection; gas included",IRknownOutward:"known surface/active outward only; gas absolute photons unspecified",IRobserver:"sensor equivalent at selected aspect",IRcontrast:"signed total at selected aspect"}};
  const units=(k:string)=>k==="CS"?"m2":"W";
  const header=["start_s","end_s",...SOURCE_CHANNELS.flatMap(k=>["mean","min","max"].map(field=>`${k}_${field}_${units(k)}`))];
  return "# "+JSON.stringify(meta)+"\n"+[header.join(","),...state.buckets.map(b=>[b.startS,b.endS,...SOURCE_CHANNELS.flatMap(k=>[b.values[k].mean,b.values[k].min,b.values[k].max])].join(","))].join("\n");
}
