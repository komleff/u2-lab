import { describe, expect, it } from "vitest";
import type { RunResultV2 } from "../../src/runner/run";
import native from "../signatures/fixtures/received-result.json";
import { distance, nominalRadarReachM, passiveDetectionReachM, signatureReach } from "../../src/app/fitting-ui/signature-distance";
import { signatureLive, signatureMeasurements, signatureOverview } from "../../src/app/fitting-ui/signatures";
import { observerPreset } from "../../src/signatures/presets";
import { echoEnergy, radarAnchor } from "../../src/signatures/radar";
import { observerView } from "../../src/signatures/runtime";
import { curveMean, scalarCurve, transformCurve } from "../../src/signatures/history";
import { exportObserverCsv, exportObserverJson, exportSignatureCsv } from "../../src/signatures/io";
const receipt = () => structuredClone(native) as unknown as RunResultV2;
const relative = (actual: number, expected: number) => expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1e-12 * Math.abs(expected));

describe("H07 passive clean-space detection reach", () => {
  it.each(["IR", "EM"] as const)("inverts detect (not hold) for %s and scales existing presets", channel => {
    const threshold = observerPreset("S-dedicated-G1")[channel === "IR" ? "ir" : "em"].detectWm2;
    const range = 16000, power = threshold * 4 * Math.PI * range ** 2;
    relative(passiveDetectionReachM(power, "S-dedicated-G1", channel)!, range);
    relative(passiveDetectionReachM(power, "M-dedicated-G1", channel)!, range * 2);
    relative(passiveDetectionReachM(power, "S-3in1-G1", channel)!, range * 2 / 3);
    relative(passiveDetectionReachM(power, "M-3in1-G1", channel)!, range * 4 / 3);
  });
  it.each([Number.MIN_VALUE, 1e-300, 1, 1e100, Number.MAX_VALUE])("keeps %s positive and finite without quotient overflow/underflow", power => {
    for (const channel of ["IR", "EM"] as const) {
      const result = passiveDetectionReachM(power, "S-dedicated-G1", channel)!;
      expect(Number.isFinite(result)).toBe(true); expect(result).toBeGreaterThan(0);
      const threshold = observerPreset("S-dedicated-G1")[channel === "IR" ? "ir" : "em"].detectWm2;
      const logExpected = .5 * (Math.log(power) - Math.log(4 * Math.PI) - Math.log(threshold));
      relative(result, Math.exp(logExpected));
    }
  });
  it("distinguishes exact zero/absent and refuses invalid power", () => {
    expect(passiveDetectionReachM(0, "S-dedicated-G1", "IR")).toBe(0);
    expect(passiveDetectionReachM(null, "S-dedicated-G1", "IR")).toBeNull();
    for (const bad of [-1, NaN, Infinity]) expect(() => passiveDetectionReachM(bad, "S-dedicated-G1", "IR")).toThrow();
  });
});

describe("H07 nominal full-paid-ping radar reach", () => {
  it("inverts the one existing radar owner and preserves size/RAM fourth-root scaling", () => {
    const range = nominalRadarReachM(96, "S")!, anchor = radarAnchor("S");
    // Public threshold anchor округлён; exact inversion ниже проверяется
    // против его own echo observable, а nominal16км — по precision anchor.
    expect(Math.abs(range - 16000)).toBeLessThan(1e-10 * 16000); relative(echoEnergy("S", range, 96), anchor.thresholdJ);
    relative(nominalRadarReachM(96, "M")!, range * 2);
    relative(nominalRadarReachM(24, "S")!, range * Math.sqrt(.5));
  });
  it.each([Number.MIN_VALUE, 1e-300, 96, 1e100, Number.MAX_VALUE])("keeps %s CS finite and positive", cs => {
    const value = nominalRadarReachM(cs, "S")!;
    expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThan(0);
    const a = radarAnchor("S"), logExpected = .25 * (Math.log(cs) + Math.log(a.rfJ) + Math.log(a.apertureM2) - Math.log(a.thresholdJ) - 2 * Math.log(4 * Math.PI));
    relative(value, Math.exp(logExpected));
  });
  it("keeps zero/absent distinct and refuses invalid CS", () => {
    expect(nominalRadarReachM(0, "S")).toBe(0); expect(nominalRadarReachM(null, "S")).toBeNull();
    for (const bad of [-1, NaN, Infinity]) expect(() => nominalRadarReachM(bad, "S")).toThrow();
  });
});

describe("H07/H08 GD presentation owns saved measurements", () => {
  it("uses transform-before-mean full statistics, not display bins or abs(mean signed)", () => {
    for (const advanced of [false, true]) {
      const r = receipt(), settings = r.spec.signatures!, signed = scalarCurve(-10, 10, 0);
      settings.advancedIr = advanced;
      const expectedPower = curveMean(transformCurve(signed, advanced ? "absolute" : "positive"), 0, 1);
      const s = r.signatures!.sourceStats.IRobserver.total;
      Object.assign(s, {durationS: 2, integral: expectedPower * 2, min: 0, max: 10});
      r.signatures!.sourceStats.IRcontrast.total.integral = 0;
      r.signatures!.buckets[0].values.IRobserver.mean = 999999;
      const before = JSON.stringify(r), result = signatureReach(r, "IR");
      expect(expectedPower).toBe(advanced ? 5 : 2.5);
      relative(result.meanPowerM!, Math.sqrt(expectedPower / (4 * Math.PI * observerPreset(settings.observerPreset).ir.detectWm2)));
      expect(result.minM).toBe(0); expect(result.maxM).toBeGreaterThan(result.meanPowerM!); expect(JSON.stringify(r)).toBe(before);
    }
  });
  it("keeps saved preset/aspect and current endpoint independent of whole-bin mean", () => {
    const r = receipt(), before = JSON.stringify(r), initial = signatureReach(r, "IR");
    r.signatures!.buckets[0].values.IRobserver.mean = 123;
    expect(signatureReach(r, "IR")).toEqual(initial);
    const nextDraft = structuredClone(r.spec.signatures!); nextDraft.observerPreset = "M-3in1-G1"; nextDraft.aspectDeg = 180;
    const html = signatureOverview(r) + signatureLive(r);
    expect(html).toContain(r.spec.signatures!.observerPreset); expect(html).not.toContain(nextDraft.observerPreset);
    expect(html).toContain(distance(initial.currentM));
    r.signatures!.buckets[0].values.IRobserver.mean = JSON.parse(before).signatures.buckets[0].values.IRobserver.mean;
    expect(JSON.stringify(r)).toBe(before);
  });
  it("labels nominal radar OFF/EMPTY without changing paid state, source payload or ObserverView", () => {
    const r = receipt(); r.spec.signatures!.radarEnabled = false; r.spec.signatures!.initialCap = "EMPTY";
    const before = JSON.stringify(r), earnedBefore = JSON.stringify(observerView(r.signatures!, r.spec.signatures!));
    const exportsBefore = [exportSignatureCsv(r), exportObserverCsv(r), exportObserverJson(r)];
    const nominal = signatureReach(r, "radar"); expect(nominal.maxM).toBeGreaterThan(0);
    const html = signatureMeasurements(r), observerHtml = html.split('id="sig-observer-view"')[1];
    expect(html).toContain("полного оплаченного ping"); expect(html).toContain("radar OFF"); expect(html).toContain("EMPTY");
    expect(html).toContain("Геометрия стенда"); expect(html).toContain("RAM"); expect(html).not.toContain("<svg");
    expect(observerHtml).not.toContain("Расчётная дальность"); expect(observerHtml).not.toContain("CS стенда");
    expect(JSON.stringify(observerView(r.signatures!, r.spec.signatures!))).toBe(earnedBefore); expect(JSON.stringify(r)).toBe(before);
    expect([exportSignatureCsv(r), exportObserverCsv(r), exportObserverJson(r)]).toEqual(exportsBefore);
  });
  it.each(["signatures-runtime-0.1", "signatures-runtime-0.2"] as const)("clarifies %s mean/envelope without changing data and keeps EM→IR", version => {
    const r = receipt(); r.signatures!.version = version;
    const before = JSON.stringify(r), html = signatureOverview(r), live = signatureLive(r);
    expect(html.indexOf("<h3>EM</h3>")).toBeLessThan(html.indexOf("IR · выбранный ракурс"));
    expect(live.indexOf("<h3>EM</h3>")).toBeLessThan(live.indexOf("IR · выбранный ракурс"));
    expect(html.match(/Среднее за интервал; полоса min–max/g)).toHaveLength(2);
    expect(html).toContain("по средней мощности"); expect(html).not.toContain("средняя дальность");
    expect(live).toContain("На конец последнего принятого подшага"); expect(live).not.toContain("<svg");
    expect(JSON.stringify(r)).toBe(before);
  });
  it("keeps absent measurements distinct from a measured zero and weak positive distance", () => {
    expect(distance(null)).toBe("нет измерения"); expect(distance(0)).toBe("0 м"); expect(distance(16000)).toBe("16 км");
    for (const v of [Number.MIN_VALUE, 1e-20, .0001, .005]) expect(parseFloat(distance(v).replace(",", "."))).toBeGreaterThan(0);
    const r = receipt(); r.signatures!.lastTruth = null;
    for (const s of Object.values(r.signatures!.sourceStats)) Object.assign(s.total, {durationS: 0, integral: 0, min: null, max: null, liveValue: null, pulsePeak: null});
    expect(signatureReach(r, "IR")).toEqual({currentM: null, minM: null, meanPowerM: null, maxM: null});
    expect(signatureLive(r)).toContain("нет измерения");
  });
});
