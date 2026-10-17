import { describe, expect, it } from "vitest";
import { bench } from "./bench-fixture";
import { createRun, runChunk, result } from "../../src/runner/run";
import { createSignatureRuntime, commitSignatureFrames, observerView, restoreSignatureRuntime } from "../../src/signatures/runtime";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
import { statisticsView } from "../../src/signatures/statistics";
import { scalarCurve, curveMean, curveBounds, curveValue, curveCrossings, transformCurve, sumCurves, frameIrCurves } from "../../src/signatures/history";
import { observerPreset } from "../../src/signatures/presets";

describe("SS04–08 coupled source clock and externally powered observer", () => {
  it("evaluated curve preserves RK moment and extrema through unequal cropped intervals", () => {
    const c = scalarCurve(10,50,35);
    expect(curveMean(c,0,1)).toBe(35);
    const splits = [0,.11,.43,.99,1];
    const integral = splits.slice(1).reduce((n,b,i)=>n+curveMean(c,splits[i],b)*(b-splits[i]),0);
    expect(Math.abs(integral-35)).toBeLessThan(1e-12*35);
    expect(curveBounds(c,0,1).max).toBeGreaterThanOrEqual(50);
  });
  it("real new model dispatch publishes once, passive waits R/c and radar earns range after RTT", () => {
    const s=bench("S",400);s.durationSeconds=15;s.mission!.approachSeconds=0;s.signatures!.aspectDeg=180;s.signatures!.radarEnabled=true;
    const run=createRun("actual",s);
    runChunk(run,1);
    expect(run.state.mission).toBeDefined();
    expect(run.signatures!.timeS).toBe(run.state.timeSeconds);
    expect(observerView(run.signatures!,s.signatures!).passive).toEqual([]);
    expect(observerView(run.signatures!,s.signatures!).radar).toEqual([]);
    while(run.state.timeSeconds<6)runChunk(run,1);
    expect(observerView(run.signatures!,s.signatures!).passive.length).toBeGreaterThan(0);
    expect(run.signatures!.radar.pending.length).toBeGreaterThan(1);
    expect(statisticsView(run.signatures!.sourceStats.IRtotal)).toMatchObject({durationS:run.state.timeSeconds});
    while(!run.done)runChunk(run,100);
    const view=observerView(run.signatures!,s.signatures!);
    expect(view.radar[0].measuredRangeM).toBeCloseTo(16000,8);
    expect(view.radar[0].receivedAtS).toBe(32000/3000);
    for(const spot of view.passive)expect(Object.keys(spot).sort()).toEqual(["bearingDeg","brightnessWm2","channel"]);
    expect(JSON.stringify(view)).not.toMatch(/targetId|emittedAt|velocity|trueRange|sourceCount/);
    expect(run.signatures!.instrument.initialCapJ+run.signatures!.instrument.externalEnergyJ-run.signatures!.instrument.rfExportJ-run.signatures!.instrument.hostHeatJ-run.signatures!.instrument.escapedEmJ-run.signatures!.instrument.remainingCapJ).toBeCloseTo(0,8);
    expect(statisticsView(run.signatures!.rfStats).status).toBe("measured");
    expect(statisticsView(run.signatures!.rfStats)).toMatchObject({max:1125000,pulsePeak:1125000});
  });
  it("trial mission flight/stop calculations never publish duplicate intervals",()=>{
    const s=bench("S",400);s.mission!.distanceM=10000;s.durationSeconds=3;
    const run=createRun("trial",s);while(!run.done)runChunk(run,5);
    expect(statisticsView(run.signatures!.sourceStats.IRtotal)).toMatchObject({durationS:3});
    expect(run.signatures!.pending.at(-1)!.endS).toBe(3);
    for(let i=1;i<run.signatures!.pending.length;i++)expect(run.signatures!.pending[i].startS).toBe(run.signatures!.pending[i-1].endS);
  });
  it("actual source checkpoint keeps partial intervals and yields same observations/statistics",()=>{
    const s=bench("S",400), whole=createSignatureRuntime(s.signatures!), resumed=createSignatureRuntime(s.signatures!);
    let state=initialStateV2(s);
    for(let i=0;i<150;i++){
      const p=stepV2(s,state,.1,{march:1});state=p.state;
      commitSignatureFrames(whole,p.signatureFrames!,"flight",s.signatures!);
      commitSignatureFrames(resumed,p.signatureFrames!,"flight",s.signatures!);
      Object.assign(resumed,restoreSignatureRuntime(JSON.parse(JSON.stringify(resumed)),s.signatures!,state.timeSeconds));
    }
    expect(resumed).toEqual(whole);
    expect(observerView(resumed,s.signatures!)).toEqual(observerView(whole,s.signatures!));
    const corrupt=structuredClone(resumed);corrupt.pending.shift();
    expect(()=>restoreSignatureRuntime(corrupt,s.signatures!,state.timeSeconds)).toThrow();
    expect(result(createRun("zero",s)).signatures).toBeDefined();
  });
  it("SS04/05 a computed within-step IR excursion below the average threshold still acquires and loses causally",()=>{
    const spec=bench("S",400);spec.signatures!.rangeM=3000;
    const settings=spec.signatures!,threshold=observerPreset(settings.observerPreset).ir.detectWm2,hold=observerPreset(settings.observerPreset).ir.holdWm2;
    const frame=structuredClone(stepV2(spec,initialStateV2(spec),.1,{}).signatureFrames![0]);
    // Explicit evaluated RK reference path; this is a curve fixture, not a fitted ship recipe.
    frame.startS=0;frame.endS=10;frame.startTemperatureK=20;frame.endTemperatureK=20;frame.rkTemperatureK=[20,100,100,20];frame.backgroundK=20;
    const area=4*Math.PI*3000**2,meanContrastW=.7*threshold*area;
    const fourthMean=(2*20**4+4*100**4)/6;frame.bodyK=meanContrastW/(5.670374419e-8*(fourthMean-20**4));frame.radiatorK=0;
    frame.components=[{id:"body",profile:"isotropic",absoluteIrW:frame.bodyK*5.670374419e-8*fourthMean,contrastW:meanContrastW},{id:"radiators",profile:"aft",absoluteIrW:0,contrastW:0}];frame.coolers=[];frame.exports=[];
    const state=createSignatureRuntime(settings);commitSignatureFrames(state,[frame],"reference_excursion",settings);
    const acquired=state.events.find(e=>e.channel==="IR"&&e.kind==="acquired")!,lost=state.events.find(e=>e.channel==="IR"&&e.kind==="lost")!;
    const peakFlux=1.05*threshold,expectedAcquire=1+5*(1-Math.sqrt(1-threshold/peakFlux)),expectedLoss=1+5*(1+Math.sqrt(1-hold/peakFlux));
    expect(Math.abs(acquired.timeS-expectedAcquire)).toBeLessThanOrEqual(1e-6*expectedAcquire+1e-12*expectedAcquire);
    expect(Math.abs(lost.timeS-expectedLoss)).toBeLessThanOrEqual(1e-6*expectedLoss+1e-12*expectedLoss);
    expect(state.sourceStats.IRcontrast.total.integral/10).toBeLessThan(threshold*area);
    expect(state.observerStats.IR.total.max).toBeGreaterThan(threshold);expect(state.passive.IR).toBeNull();
    expect(observerView(state,settings).passive.some(p=>p.channel==="IR")).toBe(false);
  });
  it("SS04/06 5ms RF integral/extrema survive partial waveform checkpoints and unequal accepted sampling",()=>{
    const spec=bench("S",400);spec.signatures!.radarEnabled=true;
    const state=createSignatureRuntime(spec.signatures!);let physical=initialStateV2(spec);
    const advance=(dt:number)=>{const p=stepV2(spec,physical,dt,{});physical=p.state;commitSignatureFrames(state,p.signatureFrames!,"rf_reference",spec.signatures!);};
    advance(2.004);const expectedJ=5625+1125000*.004;
    expect(Math.abs(state.rfStats.total.integral-expectedJ)).toBeLessThanOrEqual(1e-6*expectedJ+1e-12*11250);
    expect(state.rfStats.total.max).toBe(1125000);expect(state.instrument.rfExportJ).toBe(11250);expect(state.pulseTail).toHaveLength(1);
    Object.assign(state,restoreSignatureRuntime(JSON.parse(JSON.stringify(state)),spec.signatures!,physical.timeSeconds));advance(.001);
    expect(Math.abs(state.rfStats.total.integral-11250)).toBeLessThanOrEqual(1e-6*11250+1e-12*11250);expect(state.pulseTail).toEqual([]);
    const whole=createSignatureRuntime(spec.signatures!),p=stepV2(spec,initialStateV2(spec),2.005,{});commitSignatureFrames(whole,p.signatureFrames!,"rf_reference",spec.signatures!);
    expect(Math.abs(whole.rfStats.total.integral-state.rfStats.total.integral)).toBeLessThanOrEqual(1e-6*11250+1e-12*11250);
    expect(whole.instrument).toEqual(state.instrument);
  });
  it("SS12 peak explanation retains its real source interval after the source turns off",()=>{
    const spec=bench("S",400);spec.signatures!.aspectDeg=180;
    const runtime=createSignatureRuntime(spec.signatures!),a=stepV2(spec,initialStateV2(spec),.1,{march:1}),b=stepV2(spec,a.state,.1,{});
    commitSignatureFrames(runtime,a.signatureFrames!,"acceleration",spec.signatures!);commitSignatureFrames(runtime,b.signatureFrames!,"coast",spec.signatures!);
    expect((runtime as any).peakContexts.IRobserver).toMatchObject({phase:"acceleration",dominantSource:"engine:fit:march",startS:0,endS:.1});
    expect(runtime.lastTruth!.exports.find(x=>x.id==="engine:fit:march")!.powerW).toBe(0);
  });
  it("SS02/06 source shielding does not install a countermeasure on the fixed external instrument",()=>{
    const a=bench("S",400),b=structuredClone(a);b.signatures!.shielding=[.5];a.signatures!.radarEnabled=true;b.signatures!.radarEnabled=true;
    const one=createSignatureRuntime(a.signatures!),two=createSignatureRuntime(b.signatures!);
    const fa=stepV2(a,initialStateV2(a),.1,{}).signatureFrames!,fb=stepV2(b,initialStateV2(b),.1,{}).signatureFrames!;
    commitSignatureFrames(one,fa,"fixture",a.signatures!);commitSignatureFrames(two,fb,"fixture",b.signatures!);
    expect(two.instrument).toEqual(one.instrument);expect(two.instrument.capturedEmJ).toBe(0);
  });
});


describe("SS01/04/08 .7 evaluated gas floor then full signed sum",()=>{
  it("clips the evaluated gas crossing before moments and preserves crop/zero boundaries",()=>{
    // 1 kg/s, Tout 80 -> 120 K on 100 K background: direct linear reference.
    const gas=transformCurve(scalarCurve(-2840,2840,0),"positive");
    expect(curveValue(gas,.25)).toBe(0);expect(curveValue(gas,.5)).toBe(0);expect(curveValue(gas,.75)).toBe(1420);
    expect(curveMean(gas,0,1)).toBe(710); // integral of positive triangular half, not clip(mean)=0
    expect(curveMean(gas,0,.5)).toBe(0);expect(curveMean(gas,.5,1)).toBe(1420);
    expect(curveBounds(gas,0,1)).toEqual({min:0,max:2840});
    expect(curveCrossings(gas,1420)).toEqual([.75]);
    const total=sumCurves([scalarCurve(-1000,-1000,-1000),gas]);
    const standard=transformCurve(total,"positive"),advanced=transformCurve(total,"absolute");
    const positiveArea=(2840-1000)**2/(2*5680);
    expect(Math.abs(curveMean(standard,0,1)-positiveArea)).toBeLessThan(1e-12*2840);
    expect(Math.abs(curveMean(advanced,0,1)-(290+2*positiveArea))).toBeLessThan(1e-12*2840);
    const cuts=[0,.19,.5,.67,.9,1];
    for(const curve of [gas,total,standard,advanced]){
      const cropped=cuts.slice(1).reduce((n,to,i)=>n+curveMean(curve,cuts[i],to)*(to-cuts[i]),0);
      expect(Math.abs(cropped-curveMean(curve,0,1))).toBeLessThan(1e-12*2840);
    }
  });
  it("sums signed surface + positive active + gas before standard/advanced transform",()=>{
    const constant=(x:number)=>scalarCurve(x,x,x);
    const warm=sumCurves([constant(-30000),constant(100000),constant(40000)]);
    const cold=sumCurves([constant(40000),constant(100000),transformCurve(constant(-30000),"positive")]);
    expect(curveMean(transformCurve(warm,"positive"),0,1)).toBe(110000);
    expect(curveMean(transformCurve(cold,"positive"),0,1)).toBe(140000);
    expect(curveMean(transformCurve(constant(-30000),"positive"),0,1)).toBe(0);
    expect(curveMean(transformCurve(constant(-30000),"absolute"),0,1)).toBe(30000);
  });
  it("gas zero and detect boundaries survive retarded partial receipt and JSON checkpoint",()=>{
    const spec=bench("S",400);spec.signatures!.rangeM=3000;
    const settings=spec.signatures!,area=4*Math.PI*3000**2,threshold=observerPreset(settings.observerPreset).ir.detectWm2;
    const frame=structuredClone(stepV2(spec,initialStateV2(spec),.1,{}).signatureFrames![0]);
    // Isolated dense-path fixture, not a new fitted cooler or cold controller.
    const flow=threshold*area/1420;
    Object.assign(frame,{startS:0,endS:10,startTemperatureK:80,endTemperatureK:120,rkTemperatureK:[80,100,100,120],backgroundK:100,bodyK:0,radiatorK:0,exports:[]});
    frame.components=[{id:"body",profile:"isotropic",absoluteIrW:0,contrastW:0},{id:"radiators",profile:"aft",absoluteIrW:0,contrastW:0}];
    frame.coolers=[{id:"analytic-gas",flowKgS:flow,auxW:0,gasMeanW:14200*flow*80,netCoolingMeanW:14200*flow*80,allocatedIrBudgetMeanW:142*flow*80,contrastRkMeanW:2840*flow/6}];
    const state=createSignatureRuntime(settings);commitSignatureFrames(state,[frame],"gas_crossing",settings);
    expect(curveValue(state.pending[0].ir,.5)).toBe(0);
    expect(state.events.find(e=>e.channel==="IR"&&e.kind==="acquired")!.timeS).toBe(8.5);
    const expected=4544*flow/area;
    expect(Math.abs(state.observerStats.IR.total.integral-expected)).toBeLessThan(1e-12*expected);
    expect(state.sourceStats.IRknownOutward.total.integral).toBe(0);
    expect(state.sourceStats.IRobserver.total.integral).toBe(7100*flow);
    const restored=restoreSignatureRuntime(JSON.parse(JSON.stringify(state)),settings,10);
    expect(restored).toEqual(state);
    const bad=structuredClone(state);(bad.pending[0].ir as any).pieces[1].from=.6;
    expect(()=>restoreSignatureRuntime(bad,settings,10)).toThrow();
  });
  it("actual frame separates allocated budget from known outward and uses nonnegative gas curve",()=>{
    const spec=bench("S",510),frame=stepV2(spec,initialStateV2(spec),.1,{}).signatureFrames![0];
    const curve=frameIrCurves(frame,0);
    const known=frame.components.reduce((n,c)=>n+c.absoluteIrW,0);
    expect(Math.abs(curveMean(curve.intrinsic,0,1)-known)).toBeLessThan(1e-12*known);
    const gas=frame.coolers.reduce((n,c)=>n+c.contrastRkMeanW,0);
    const expected=frame.components.reduce((n,c)=>n+(c.profile==="isotropic"?c.contrastW:0),0)+gas;
    expect(Math.abs(curveMean(curve.contrast,0,1)-expected)).toBeLessThan(1e-6*Math.abs(expected)+1e-12*Math.abs(expected));
  });
});


it("SS06 changing the external S/M instrument never debits target physics and pays its own scaled radar",()=>{
  const a=bench("S",400),b=structuredClone(a);a.signatures!.radarEnabled=true;b.signatures!.radarEnabled=true;b.signatures!.observerPreset="M-dedicated-G1";
  const one=createSignatureRuntime(a.signatures!),two=createSignatureRuntime(b.signatures!);let sa=initialStateV2(a),sb=initialStateV2(b);
  for(let i=0;i<120;i++){const pa=stepV2(a,sa,.1,{}),pb=stepV2(b,sb,.1,{});sa=pa.state;sb=pb.state;commitSignatureFrames(one,pa.signatureFrames!,"same_target",a.signatures!);commitSignatureFrames(two,pb.signatureFrames!,"same_target",b.signatures!);}
  expect(sb).toEqual(sa);expect(two.instrument.initialCapJ).toBe(4*one.instrument.initialCapJ);expect(two.instrument.rfExportJ).toBe(4*one.instrument.rfExportJ);
  const l=two.instrument,residual=l.initialCapJ+l.externalEnergyJ-l.rfExportJ-l.hostHeatJ-l.escapedEmJ-l.remainingCapJ;
  expect(Math.abs(residual)).toBeLessThanOrEqual(1e-6*l.externalEnergyJ+1e-12*l.externalEnergyJ);
  expect(observerView(two,b.signatures!).radar[0].receivedAtS).toBe(32000/3000);
});


it("H02/03 new history version preserves full source, causal and instrument state and mid-bin checkpoints",()=>{
  const spec=bench("S",400);spec.signatures!.radarEnabled=true;
  const old=createSignatureRuntime(spec.signatures!),fresh=createSignatureRuntime(spec.signatures!,30);let physical=initialStateV2(spec);
  expect(fresh.version).toBe("signatures-runtime-0.2");
  for(let i=0;i<81;i++){const p=stepV2(spec,physical,.1,{});physical=p.state;commitSignatureFrames(old,p.signatureFrames!,"same_frame",spec.signatures!);commitSignatureFrames(fresh,p.signatureFrames!,"same_frame",spec.signatures!,30);}
  const {version:ov,buckets:ob,...oldData}=old,{version:nv,buckets:nb,...newData}=fresh;expect(newData).toEqual(oldData);expect(nb.length).toBeLessThanOrEqual(28);expect(ob.length).toBeGreaterThan(nb.length);
  const saved=JSON.parse(JSON.stringify(fresh));expect(restoreSignatureRuntime(saved,spec.signatures!,physical.timeSeconds,30)).toEqual(fresh);
  expect(()=>restoreSignatureRuntime(saved,spec.signatures!,physical.timeSeconds,31)).toThrow();
  for(const mutate of [(x:any)=>x.version="unknown",(x:any)=>x.buckets[0].startS=.01,(x:any)=>x.buckets[0].endS+=.001,(x:any)=>x.buckets.at(-1).endS-=.001,(x:any)=>x.buckets[0].values.EM.mean="0"]){const bad=structuredClone(saved);mutate(bad);expect(()=>restoreSignatureRuntime(bad,spec.signatures!,physical.timeSeconds,30)).toThrow();}
  const legacy=restoreSignatureRuntime(JSON.parse(JSON.stringify(old)),spec.signatures!,physical.timeSeconds,30);expect(legacy).toEqual(old);
  const p=stepV2(spec,physical,.1,{});commitSignatureFrames(legacy,p.signatureFrames!,"same_frame",spec.signatures!,30);commitSignatureFrames(old,p.signatureFrames!,"same_frame",spec.signatures!);expect(legacy).toEqual(old);
});


it("H05 old0.1 continuation keeps literal pair-merge retention after 2000 accepted intervals even with H",()=>{
  const spec=bench("S",400),a=createSignatureRuntime(spec.signatures!),b=createSignatureRuntime(spec.signatures!);let state=initialStateV2(spec);
  for(let i=0;i<2100;i++){const p=stepV2(spec,state,.1,{});state=p.state;commitSignatureFrames(a,p.signatureFrames!,"legacy",spec.signatures!);commitSignatureFrames(b,p.signatureFrames!,"legacy",spec.signatures!,300);}
  expect(b).toEqual(a);expect(b.version).toBe("signatures-runtime-0.1");expect(b.buckets.length).toBeLessThanOrEqual(2000);expect(b.buckets[0].endS).toBeGreaterThan(.1);
  expect(restoreSignatureRuntime(JSON.parse(JSON.stringify(b)),spec.signatures!,state.timeSeconds,300)).toEqual(a);
});
