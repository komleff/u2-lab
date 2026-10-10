import { describe, expect, it } from "vitest";
import { electricMotorLosses, engineIr } from "../../src/signatures/sources";
import { lambertGain, normalizeBearing, projectIrComponents } from "../../src/signatures/projection";

describe("accepted Lab engine IR components (SC01)", () => {
  it.each([
    ["diesel", 100_000, 0],
    ["hydrogen", 10_000, 0],
    ["electric", 1_000, 1_000],
  ] as const)("maps actual %s source watts without spending exhaust twice", (kind, ir, debit) => {
    expect(engineIr({ kind, enabled: true, actualSourceW: 1_000_000 })).toEqual({
      scope: "engine_component", kind, basisW: 1_000_000, absoluteIrW: ir, hostHeatDebitW: debit,
    });
  });

  it("separates motor loss from path loss before assigning the 900 W IR debit", () => {
    const loss = electricMotorLosses({ actualBusW: 10_000_000, pathEfficiency: 0.9, motorEfficiency: 0.9 });
    expect(loss.motorInputW).toBe(9_000_000);
    expect(loss.pathLossW).toBeCloseTo(1_000_000, 6);
    expect(loss.motorWasteW).toBeCloseTo(900_000, 6);
    expect(loss.usefulW).toBe(8_100_000);
    const ir = engineIr({ kind: "electric", enabled: true, actualSourceW: loss.motorWasteW });
    expect(ir.absoluteIrW).toBeCloseTo(900, 9);
    expect(loss.pathLossW + loss.motorWasteW + loss.usefulW).toBe(10_000_000);
  });

  it.each(["diesel", "hydrogen", "electric"] as const)("returns explicit OFF and actual-zero for %s", kind => {
    expect(engineIr({ kind, enabled: false, actualSourceW: 1_000_000 }).absoluteIrW).toBe(0);
    expect(engineIr({ kind, enabled: true, actualSourceW: 0 }).absoluteIrW).toBe(0);
  });

  it.each([undefined, NaN, Infinity, -1])("refuses an unknown/invalid actual flow even while OFF: %s", actualSourceW => {
    expect(() => engineIr({ kind: "diesel", enabled: false, actualSourceW } as never)).toThrow();
  });

  it("refuses unsupported engines and invalid loss domains", () => {
    expect(() => engineIr({ kind: "generator", enabled: true, actualSourceW: 1 } as never)).toThrow();
    expect(() => electricMotorLosses({ actualBusW: 1, pathEfficiency: 1.01, motorEfficiency: 0.9 })).toThrow();
    expect(() => electricMotorLosses({ actualBusW: 1, pathEfficiency: 0.9, motorEfficiency: NaN })).toThrow();
  });
});

describe("continuous normalized IR projection (SC01)", () => {
  it("uses exact orthogonal zeros and equivalent wrapped cardinal bearings", () => {
    expect(lambertGain(0)).toBe(Math.PI);
    for (const angle of [90, 180, 270, -90, 450]) expect(lambertGain(angle)).toBe(0);
    expect(lambertGain(360)).toBe(lambertGain(0));
    expect(normalizeBearing(-360)).toBe(0);
    expect(normalizeBearing(-1)).toBe(359);
    expect(normalizeBearing(-Number.EPSILON)).toBe(0);
    expect(() => normalizeBearing(NaN)).toThrow();
  });

  it("preserves circular mean and continuity across both 45 degree cuts", () => {
    const samples = 36_000;
    let integralMean = 0;
    for (let i = 0; i < samples; i++) integralMean += lambertGain((i + 0.5) * 360 / samples) / samples;
    expect(Math.abs(integralMean - 1)).toBeLessThan(1e-6 + 1e-12);
    for (const angle of [-45, 45]) {
      expect(Math.abs(lambertGain(angle - 1e-6) - lambertGain(angle + 1e-6))).toBeLessThan(1e-6);
    }
  });

  it("turns main/retro exhaust without hiding the isotropic body floor", () => {
    const body = { id: "body", profile: "isotropic", absoluteIrW: 100, contrastW: 80 } as const;
    const main = { id: "main", profile: "aft", absoluteIrW: 100_000, contrastW: 100_000 } as const;
    const nose = projectIrComponents([body, main], 0);
    const rear = projectIrComponents([body, main], 180);
    expect(nose.projectedAbsoluteW).toBe(100);
    expect(nose.projectedContrastW).toBe(80);
    expect(rear.projectedAbsoluteW).toBeCloseTo(314_259.2653589793, 6);
    expect(rear.intrinsicAbsoluteW).toBe(100_100);
    expect(rear.scope).toBe("partial_ir_components");
    const braking = projectIrComponents([body, { ...main, profile: "fore" }], 0);
    expect(braking.projectedAbsoluteW).toBe(rear.projectedAbsoluteW);
    expect(projectIrComponents([body, main], 360)).toEqual(nose);
  });

  it("splits lateral power symmetrically and keeps negative contrast separate", () => {
    const lateral = { id: "yaw", profile: "lateral", absoluteIrW: 200, contrastW: -50 } as const;
    const left = projectIrComponents([lateral], 90);
    expect(left.projectedAbsoluteW).toBeCloseTo(314.1592653589793, 9);
    expect(left.standardSignalW).toBe(0);
    expect(left.advancedSignalW).toBeCloseTo(78.53981633974483, 9);
    expect(projectIrComponents([lateral], 270)).toEqual(left);
    expect(projectIrComponents([lateral], 0).projectedAbsoluteW).toBe(0);
  });

  it("refuses incomplete, duplicate and unsupported component inputs", () => {
    expect(() => projectIrComponents([], 0)).toThrow();
    const body = { id: "body", profile: "isotropic", absoluteIrW: 1, contrastW: 1 } as const;
    expect(() => projectIrComponents([body, body], 0)).toThrow();
    expect(() => projectIrComponents([{ ...body, absoluteIrW: NaN }], 0)).toThrow();
    expect(() => projectIrComponents([{ ...body, profile: "h2-default" } as never], 0)).toThrow();
  });
});
