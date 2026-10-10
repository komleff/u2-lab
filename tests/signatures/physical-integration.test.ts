import { describe, expect, it } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMissionRun } from "../../src/scenarios/mission";
import { initialStateV2, stepV2, validateRunSpecV2 } from "../../src/model/v2/step";
import { signatureSpec, defaultSignatureSettings } from "../../src/signatures/config";
import { generatorIr, hydrogenCoolerIr } from "../../src/signatures/sources";
import {validateSignatureFrame} from "../../src/signatures/physics";
import { SIGMA } from "../../src/model/v2/physics";

import { bench } from "./bench-fixture";

const near = (actual: number, expected: number, reference = Math.abs(expected)) => {
  if (expected === 0) expect(actual).toBe(0);
  else expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-6 * Math.abs(expected) + 1e-12 * reference);
};

describe("SS01/02 accepted actual sources before thermal update", () => {
  it("generator/H2 projection closes accepted source rules and refuses impossible flow", () => {
    expect(generatorIr("diesel", 1e6)).toBe(100000);
    expect(generatorIr("hydrogen", 0)).toBe(0);
    const hot = hydrogenCoolerIr(6.816e6, 1, 100);
    near(hot.outletTemperatureK, 500); near(hot.allocatedIrBudgetW, 68160); near(hot.contrastW, 56800);
    near(hydrogenCoolerIr(6.816e6, 3.33, 100).contrastW, 30331.2);
    expect(hydrogenCoolerIr(6.816e6, 6, 100).contrastW).toBe(0);
    expect(hydrogenCoolerIr(6.816e6, 7.5, 100).contrastW).toBe(0);
    near(hydrogenCoolerIr(6.816e6, 1, 0).contrastW, 71000);
    expect(hot).not.toHaveProperty("absoluteIrW");
    expect(hydrogenCoolerIr(0, 0, 100)).toEqual({outletTemperatureK:20,allocatedIrBudgetW:0,contrastW:0});
    expect(() => hydrogenCoolerIr(1, 0, 100)).toThrow();
    expect(() => hydrogenCoolerIr(0, 1, 100)).toThrow();
    expect(() => hydrogenCoolerIr(1, 1, NaN)).toThrow();
    expect(() => generatorIr("diesel", NaN)).toThrow();
  });
  it("new explicit model keeps literal old spec/state/result path and publishes actual per-source stages", () => {
    const s = bench(), plain = structuredClone(s);
    plain.schemaVersion = "u2-lab/2"; plain.modelVersion = "ship-fitting-mission-0.2.2"; delete plain.signatures;
    const before = JSON.stringify(plain), state = initialStateV2(plain);
    const legacy = stepV2(plain, state, .1, { march: 1 });
    expect(JSON.stringify(plain)).toBe(before); expect(legacy).not.toHaveProperty("signatureFrames");
    expect(legacy.state.schemaVersion).toBe("u2-lab/2");
    expect(validateRunSpecV2(s).ok).toBe(true);
    const p = stepV2(s, initialStateV2(s), .1, { march: 1 });
    expect(p.state.schemaVersion).toBe("u2-lab/3");
    expect(p.signatureFrames!.length).toBeGreaterThan(0);
    const f = p.signatureFrames![0];
    near(f.em.stageBasisW, f.stages.reduce((sum, x) => sum + x.actualW, 0));
    near(f.em.rawParasiticW, f.em.stageBasisW * .0000215);
    near(f.em.retainedHostHeatW + f.em.escapedParasiticW + f.hostIrDebitW, f.hostLossBudgetW);
    expect(f.components.some(x => x.id === "body")).toBe(true);
    expect(f.components.some(x => x.id.startsWith("engine:"))).toBe(true);
    expect(Math.abs(p.telemetry.energyResidualJ)).toBeLessThan(1e-6 * p.telemetry.chemicalW * .1);
  });
  it.each(["S", "M"] as const)("%s cooler actual gas/aux/flow share RK energy weights and common finite fuel", size => {
    const s = bench(size); s.initial.fuelKg.hydrogen = .001;
    const p = stepV2(s, initialStateV2(s), .5, { retro: 1 });
    const frames = p.signatureFrames!;
    expect(p.state.fuelKg.hydrogen).toBe(0);
    expect(frames.some(f => f.coolers.some(c => c.flowKgS > 0))).toBe(true);
    const fuel = frames.reduce((n, f) => n + f.coolers.reduce((q, c) => q + c.flowKgS, 0) * (f.endS - f.startS), 0);
    near(fuel, p.state.consumptionKg["hydrogen:cooler:fit:signature-1"]);
    for (const f of frames) for (const c of f.coolers) {
      expect(c.flowKgS).toBeLessThanOrEqual(size === "S" ? 1.875 : 7.5);
      near(c.gasMeanW, c.flowKgS * 14200 * f.rkTemperatureK.reduce((n, t, i) => n + Math.max(t - 20, 0) * [1,2,2,1][i] / 6, 0));
      near(c.netCoolingMeanW, c.gasMeanW - c.auxW);
      near(c.allocatedIrBudgetMeanW, .01*c.gasMeanW);
      near(c.contrastRkMeanW, c.flowKgS * 142 * f.rkTemperatureK.reduce((n,t,i)=>n+Math.max(t-f.backgroundK,0)*[1,2,2,1][i]/6,0));
      expect(f.components.some(x=>x.id==="cooler:"+c.id)).toBe(false);
    }
    expect(Math.abs(p.telemetry.energyResidualJ)).toBeLessThan(1e-6 * (p.telemetry.chemicalW + s.resolvedShip.heatCapacityJK * 510) * .5);
  });
  it("surface absolute radiation and signed contrast use actual K/T4, without buffer or second emissivity", () => {
    const s = bench("S", 299), p = stepV2(s, initialStateV2(s), .1, {});
    for (const f of p.signatureFrames!) {
      const body = f.components.find(x => x.id === "body")!;
      const abs = s.resolvedShip.hull.hullRadiationM2 * SIGMA * f.rkTemperatureK.reduce((n,t,i) => n + t ** 4 * [1,2,2,1][i] / 6, 0);
      near(body.absoluteIrW, abs);
      near(body.contrastW, abs - s.resolvedShip.hull.hullRadiationM2 * SIGMA * s.environment.effectiveBackgroundK ** 4);
    }
    expect(p.telemetry.h2CoolingW).toBe(0);
  });
  it("screen retains captured EM once and changes T through the real host partition", () => {
    const s = bench("S", 400), b = structuredClone(s); b.signatures!.shielding = [.5];
    const a = stepV2(s, initialStateV2(s), .2, { march: 1 }), p = stepV2(b, initialStateV2(b), .2, { march: 1 });
    expect(p.state.temperatureK).toBeGreaterThan(a.state.temperatureK);
    near(p.signatureFrames![0].em.escapedParasiticW, a.signatureFrames![0].em.rawParasiticW / 2);
    near(p.signatureFrames![0].em.capturedParasiticW, p.signatureFrames![0].em.escapedParasiticW);
  });
  it("actual E bus tap separates path/motor loss and debits only the accepted 900 W own IR",()=>{
    const catalog=loadCandidateCatalog("ship-fitting-0.2.5"),fit=getPresetFit("severin-mir:1:E",catalog.version);
    const built=makeMissionRun(fit,catalog,{temperatureK:400});if(!built.ok)throw Error(JSON.stringify(built.errors));
    const s=signatureSpec(built.value),motor=s.resolvedShip.instances.find(i=>i.role==="march")!;
    motor.item.numerics.powerW=10e6;motor.item.numerics.pathEfficiency=.9;motor.item.numerics.efficiency=.9;
    const p=stepV2(s,initialStateV2(s),.1,{march:1}),tap=p.signatureFrames![0].exports.find(e=>e.id==="engine:"+motor.id)!;
    expect(tap.kind).toBe("engine-electric");near(tap.powerW,900000);near(tap.pathLossW!,1000000);near(tap.absoluteIrW,900);near(tap.hostHeatDebitW,900);
    expect(Math.abs(p.telemetry.energyResidualJ)).toBeLessThan(1e-6*10e6*.1);
  });
  it("temperature-dependent H2/IR converge with .1 to .05 s instead of evaluating averaged T", () => {
    const run = (dt: number) => { const s = bench(); let state = initialStateV2(s), gasJ = 0, irJ = 0;
      for (let t = 0; t < 2 - dt / 2; t += dt) { const p = stepV2(s, state, dt, { march: 1 }); state = p.state;
        for (const f of p.signatureFrames!) { gasJ += f.coolers.reduce((n,c) => n+c.gasMeanW,0)*(f.endS-f.startS); irJ += f.components.reduce((n,c)=>n+c.absoluteIrW,0)*(f.endS-f.startS); }
      } return { state, gasJ, irJ }; };
    const a = run(.1), b = run(.05);
    expect(Math.abs(a.state.temperatureK - b.state.temperatureK)).toBeLessThan(.02);
    expect(Math.abs(a.gasJ-b.gasJ)/b.gasJ).toBeLessThan(.001);
    expect(Math.abs(a.irJ-b.irJ)/b.irJ).toBeLessThan(.001);
  });
});

it("SS01 asbuilt TI uses its own hot output and stays idle at hotK≤background",()=>{
  const catalog=loadCandidateCatalog("ship-fitting-0.2.5"),fit=getPresetFit("pony:1",catalog.version);
  fit.assignments["signature-1"]="fit:signature-1";fit.instances["fit:signature-1"]={id:"fit:signature-1",itemId:"thermoinverter-S",enabled:true};
  const make=(backgroundK:number)=>{const built=makeMissionRun(fit,catalog,{temperatureK:400,effectiveBackgroundK:backgroundK,distanceM:0});if(!built.ok)throw Error(JSON.stringify(built.errors));return signatureSpec(built.value);};
  const normal=make(100),p=stepV2(normal,initialStateV2(normal),.1,{}),source=p.signatureFrames![0].components.find(x=>x.id==="ti:fit:signature-1")!;
  expect(source.contrastW).toBeGreaterThan(0);
  const hotK=normal.resolvedShip.instances.find(i=>i.item.family==="thermoinverter")!.item.numerics.hotK;
  near(source.absoluteIrW,source.contrastW/(1-(100/hotK)**4));
  for(const bg of [hotK,hotK+50]){const idle=make(bg),step=stepV2(idle,initialStateV2(idle),.1,{}),ti=step.signatureFrames![0].components.find(c=>c.id==="ti:fit:signature-1")!;expect(step.telemetry.tiCoolingW).toBe(0);expect(step.telemetry.tiRejectW).toBe(0);expect(ti.absoluteIrW).toBe(0);expect(ti.contrastW).toBe(0);}
  const malformed=structuredClone(p.signatureFrames![0]);malformed.components.find(c=>c.id===source.id)!.absoluteIrW=0;
  expect(()=>validateSignatureFrame(malformed,normal.signatures!)).toThrow(/TI/);
  const coldSurface=structuredClone(malformed);coldSurface.components.find(c=>c.id===source.id)!.contrastW=-1e6;
  expect(()=>validateSignatureFrame(coldSurface,normal.signatures!)).not.toThrow();
  const old=make(hotK+50);old.schemaVersion="u2-lab/2";old.modelVersion="ship-fitting-mission-0.2.2";delete old.signatures;
  expect(()=>stepV2(old,initialStateV2(old),.1,{})).not.toThrow();
});
