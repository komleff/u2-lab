import { expect, it } from "vitest";
import { exchangeAt } from "../../src/model/v3/thermal-surfaces";
it("PH-B1 field at direct500K is -150kW; hot700K is +50kW, independent from signed radiation",()=>{
  const direct=exchangeAt(10,0.9,500,100,{temperatureK:650,coefficientWPerM2K:100}),hot=exchangeAt(10,0.9,700,100,{temperatureK:650,coefficientWPerM2K:100});
  expect(direct.fieldW).toBe(-150000);expect(hot.fieldW).toBe(50000);expect(direct.radiationW).toBeGreaterThan(0);
  expect(direct.totalW).toBe(direct.fieldW+direct.radiationW);expect(hot.totalW).toBe(hot.fieldW+hot.radiationW);
});
it("field/radiative sign disagreements are preserved rather than one cancelling law hiding the other",()=>{
  const r=exchangeAt(10,0.9,500,600,{temperatureK:300,coefficientWPerM2K:100});
  expect(r.radiationW).toBeLessThan(0);expect(r.fieldW).toBeGreaterThan(0);expect(r.emittedIrW-r.absorbedBackgroundW).toBeCloseTo(r.radiationW,8);
});
