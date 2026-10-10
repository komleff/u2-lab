import { expect, it } from "vitest";
import { resolveElectrical } from "../../src/model/v3/power";

const input = () => ({ chargeJ: 1e9, capacityJ: 1e9, loadW: 1e6, independentSupplyW: 0, generatorMaximumW: 2e6,
  chargeEfficiency: 0.9, dischargeEfficiency: 0.9,batteryChargeFactor:1,batteryDischargeFactor:1, mode: "Efficient" as const, generator: { permission:false, normalOn:false } });
it("full battery: generator follows delivered load; rejected external energy is not heat",()=>{
  const x=input(),a=resolveElectrical(x);expect(a.generatorW).toBe(1e6);expect(a.chargeRateJPerS).toBe(0);
  x.independentSupplyW=10e6;const b=resolveElectrical(x);expect(b.generatorW).toBe(0);expect(b.independentAcceptedW).toBe(1e6);expect(b.rejectedIndependentW).toBe(9e6);expect(b.converterLossW).toBe(0);
});
it("CP-04 empty/depleted battery never grants unpaid work and closes conversion energy",()=>{
  const x=input();x.generatorMaximumW=0;x.chargeJ=500000;
  const a=resolveElectrical(x);expect(a.deliveredW).toBe(1e6);expect(a.depletionSeconds).toBeCloseTo(0.45,12);
  const deliveredJ=a.deliveredW*a.depletionSeconds,lossJ=a.converterLossW*a.depletionSeconds;
  expect(deliveredJ).toBeCloseTo(450000,8);expect(lossJ).toBeCloseTo(50000,8);expect(deliveredJ+lossJ).toBeCloseTo(x.chargeJ,8);
  x.chargeJ=0;const b=resolveElectrical(x);expect(b.deliveredW).toBe(0);expect(b.chargeRateJPerS).toBe(0);expect(b.converterLossW).toBe(0);
});
it("input conversion credits only stored charge and keeps the remainder as host loss",()=>{
  const x=input();x.chargeJ=0;x.loadW=0;x.independentSupplyW=1e6;x.generatorMaximumW=0;
  const r=resolveElectrical(x);expect(r.chargeRateJPerS).toBe(900000);expect(r.converterLossW).toBeCloseTo(100000,8);
  expect(r.independentAcceptedW-r.chargeRateJPerS-r.converterLossW).toBeCloseTo(0,8);
});
it.each([0.009999,0.01])("Masking threshold SOC %s only arms strictly below 1%%",soc=>{
  const x={...input(),mode:"Masking" as const};x.chargeJ=x.capacityJ*soc;
  const r=resolveElectrical(x);expect(r.generator.permission).toBe(soc<0.01);expect(r.generatorW).toBe(soc<0.01?x.loadW:0);
});
it("Masking generator covers only actual deficit, never charges, holds zero-output permission and resumes later",()=>{
  const x={...input(),mode:"Masking" as const};x.chargeJ=0.005*x.capacityJ;x.independentSupplyW=400000;
  const a=resolveElectrical(x);expect(a.generatorW).toBe(600000);expect(a.chargeRateJPerS).toBe(0);
  x.generator=a.generator;x.independentSupplyW=x.loadW;const b=resolveElectrical(x);expect(b.generatorW).toBe(0);expect(b.generator.permission).toBe(true);
  x.generator=b.generator;x.independentSupplyW=400000;expect(resolveElectrical(x).generatorW).toBe(600000);
  x.chargeJ=0.02*x.capacityJ;expect(resolveElectrical(x).generator.permission).toBe(false);
});
it("independent supply at low SOC does not arm emergency generation; exit hands an armed generator to normal control",()=>{
  const x={...input(),mode:"Masking" as "Masking"|"Efficient"};x.chargeJ=0.005*x.capacityJ;x.independentSupplyW=x.loadW;
  expect(resolveElectrical(x).generator.permission).toBe(false);
  x.independentSupplyW=0;x.generator={permission:true,normalOn:true};x.mode="Efficient";
  const r=resolveElectrical(x);expect(r.generator.permission).toBe(false);expect(r.generator.normalOn).toBe(true);expect(r.generatorW).toBeGreaterThanOrEqual(x.loadW);
});
