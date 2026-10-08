import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseResultJson } from "../../src/io/fitting-result";
import { FittingWorkspace } from "../../src/app/fitting-workspace";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { freshMissionConditions, makeMissionRun } from "../../src/scenarios/mission";
import { defaultSignatureSettings, signatureSpec } from "../../src/signatures/config";
import { WorkerController } from "../../src/runner/protocol";
import { createRun, result, runChunk } from "../../src/runner/run";
import { restoreFittingRun } from "../../src/runner/fitting-run";
import { emptyStatistics } from "../../src/signatures/statistics";
import { exportSignatureCsv } from "../../src/signatures/io";
import { createSignatureRuntime, commitSignatureFrames, restoreSignatureRuntime } from "../../src/signatures/runtime";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
import { bench } from "./bench-fixture";

const json = (v: unknown) => JSON.stringify(v, (_, x) => ArrayBuffer.isView(x) ? Array.from(x as Float64Array) : x);
const received = JSON.parse(readFileSync("tests/signatures/fixtures/received-result.json", "utf8"));
const phase = Object.keys(received.signatures.sourceStats.EM.phases)[0];
type Mutation = { name: string; mutate: (r: any) => void };
const slot = (r: any, path: string) => path.split(".").slice(0, -1).reduce((v, k) => v[k], r);
const set = (r: any, path: string, value: unknown) => { slot(r, path)[path.split(".").at(-1)!] = value; };
const invalidTypes = ["oops", "0", null, { bad: true }, true, []];
const numericPaths = [
  "sourceStats.EM.total.durationS", "sourceStats.EM.total.integral",
  "sourceStats.EM.total.min", "sourceStats.EM.total.max", "sourceStats.EM.total.liveValue",
  `sourceStats.EM.phases.${phase}.integral`, "sourceStats.EM.lastEndS",
  "observerStats.IR.total.integral", "observerStats.IR.lastEndS", "rfStats.total.integral", "rfStats.lastEndS",
  "buckets.0.values.EM.mean", "buckets.0.values.EM.min", "buckets.0.values.EM.max",
  "peakContexts.EM.startS", "peakContexts.EM.endS", "events.0.timeS",
  "lastTruth.exports.0.absoluteIrW", "lastTruth.exports.0.pathLossW", "lastTruth.exports.0.motorInputW",
];
const typedMutations: Mutation[] = numericPaths.flatMap(path => invalidTypes.map(value => ({
  name: `${path} = ${JSON.stringify(value)}`,
  mutate: r => set(r.signatures, path, structuredClone(value)),
})));
// pulsePeak is nullable even after a measured interval; non-null values must be numeric.
typedMutations.push(...invalidTypes.filter(v => v !== null).map(value => ({
  name: `rfStats.total.pulsePeak = ${JSON.stringify(value)}`,
  mutate: (r: any) => { r.signatures.rfStats.total.pulsePeak = structuredClone(value); },
})));
const shapeAndEpochMutations: Mutation[] = [
  { name: "required source channel map is an array", mutate: r => { r.signatures.sourceStats = []; } },
  { name: "required observer channel is missing", mutate: r => { delete r.signatures.observerStats.IR; } },
  { name: "required aggregate is null", mutate: r => { r.signatures.rfStats.total = null; } },
  { name: "RF phase map is an array of a valid aggregate", mutate: r => { r.signatures.rfStats.phases = [structuredClone(r.signatures.rfStats.total)]; } },
  { name: "observer phase map is an array of a valid aggregate", mutate: r => { r.signatures.observerStats.IR.phases = [structuredClone(r.signatures.observerStats.IR.total)]; } },
  { name: "paid RF statistics erased", mutate: r => { r.signatures.rfStats = emptyStatistics(); } },
  { name: "RF own lastEnd reset to zero", mutate: r => { r.signatures.rfStats.lastEndS = 0; } },
  { name: "arrived IR statistics erased", mutate: r => { r.signatures.observerStats.IR = emptyStatistics(); } },
  { name: "arrived EM statistics erased", mutate: r => { r.signatures.observerStats.EM = emptyStatistics(); } },
  { name: "arrived observer own lastEnd reset to zero", mutate: r => { r.signatures.observerStats.IR.lastEndS = 0; } },
  { name: "finite last value outside measured extrema", mutate: r => { r.signatures.sourceStats.EM.total.liveValue = 2 * r.signatures.sourceStats.EM.total.max; } },
  { name: "finite pulse peak outside measured extrema", mutate: r => { r.signatures.rfStats.total.pulsePeak = 2 * r.signatures.rfStats.total.max; } },
  ...["rfStats", "observerStats.IR", "observerStats.EM"].map(path => ({
    name: `${path} coherent aggregates cover only half the own epoch`,
    mutate: (r: any) => {
      const stats = path.split(".").reduce((v, k) => v[k], r.signatures);
      for (const aggregate of [stats.total, ...Object.values(stats.phases)] as any[]) {
        aggregate.durationS /= 2; aggregate.integral /= 2;
      }
    },
  })),
  { name: "paid RF integral and phases replaced with coherent zero values", mutate: r => {
    const aggregate = { durationS: r.signatures.timeS, integral: 0, min: 0, max: 0, liveValue: 0, pulsePeak: null };
    r.signatures.rfStats = { lastEndS: r.signatures.timeS, total: aggregate, phases: { instrument: structuredClone(aggregate) } };
  } },
  { name: "piecewise numeric boundary strings", mutate: r => {
    const f = r.signatures.pending[0], c = structuredClone(f.ir);
    f.ir = { pieces: [{ from: 0, to: "0.5", curve: c }, { from: "0.5", to: 1, curve: structuredClone(c) }] };
  } },
];

function atomicRefusal(bad: any, good = received) {
  const parsed = parseResultJson(json(bad));
  expect(parsed.ok).toBe(false);
  const workspace = new FittingWorkspace(good.spec.resolvedShip.fit, loadCandidateCatalog(good.spec.catalogVersion));
  expect(workspace.importDocument(json(good)).ok).toBe(true);
  const before = workspace.snapshot(), csv = exportSignatureCsv(workspace.getCurrentResult()!);
  expect(workspace.importDocument(json(bad)).ok).toBe(false);
  expect(workspace.snapshot()).toEqual(before);
  expect(exportSignatureCsv(workspace.getCurrentResult()!)).toBe(csv);
  const messages: any[] = [], worker = new WorkerController(m => messages.push(m));
  worker.handle({ runId: "kept", commandId: 1, type: "start", payload: { checkpoint: good, maxSteps: 1 } });
  expect(messages.at(-1).type).toBe("control-ack");
  const context = worker.context;
  worker.handle({ runId: "bad", commandId: 2, type: "start", payload: { checkpoint: bad, maxSteps: 99 } });
  expect(messages.at(-1).type).toBe("error");
  expect(worker.context).toBe(context); expect(worker.maxSteps).toBe(1);
}

describe("CR-SS-B1 typed checkpoint refusal is atomic at parser/workspace/Worker boundaries", () => {
  it.each([...typedMutations, ...shapeAndEpochMutations])("$name", ({ mutate }) => {
    const bad = structuredClone(received); mutate(bad); atomicRefusal(bad);
  });
  it("empty initial phase maps remain objects, including when all values are absent", () => {
    const good = result(createRun("initial", bench()));
    for (const target of ["sourceStats.EM", "observerStats.IR", "rfStats"]) {
      const bad = JSON.parse(json(good));
      target.split(".").reduce((v, k) => v[k], bad.signatures).phases = [];
      atomicRefusal(bad, good);
    }
  });
  it.each(["gasMeanW", "netCoolingMeanW", "allocatedIrBudgetMeanW", "contrastRkMeanW"])("actual positive cooler %s requires numbers before tolerance arithmetic", field => {
    const run = createRun("warm", bench("S", 510)); runChunk(run, 1);
    const good = result(run); expect(good.signatures!.lastTruth!.coolers[0].gasMeanW).toBeGreaterThan(0);
    for (const value of invalidTypes) {
      const bad = JSON.parse(json(good)); bad.signatures.lastTruth.coolers[0][field] = structuredClone(value);
      atomicRefusal(bad, good);
    }
  });
  it.each([NaN, Infinity, -Infinity])("direct checkpoint nonfinite %s is refused without JSON null coercion", value => {
    const bad = structuredClone(received.signatures); bad.sourceStats.EM.total.integral = value;
    expect(() => restoreSignatureRuntime(bad, received.spec.signatures, received.state.timeSeconds)).toThrow();
  });
});

describe("CR-SS-B1 legitimate own epochs, optional fields and signed signals remain resumable", () => {
  it.each(["S", "M"] as const)("%s FULL/EMPTY clocks preserve exact arrival and live RF tails", size => {
    for (const initialCap of ["FULL", "EMPTY"] as const) {
      const spec = bench(size, 400); spec.signatures!.observerPreset = `${size}-dedicated-G1`;
      Object.assign(spec.signatures!, { rangeM: 3000, radarEnabled: true, initialCap });
      const settings = spec.signatures!, runtime = createSignatureRuntime(settings);
      let state = initialStateV2(spec);
      expect(restoreSignatureRuntime(JSON.parse(json(runtime)), settings, 0)).toEqual(runtime);
      for (const to of [.002, .005, 1, 1.001, 2, 2.002, 2.005, 3, 3.1]) {
        const p = stepV2(spec, state, to - state.timeSeconds, {}); state = p.state;
        commitSignatureFrames(runtime, p.signatureFrames!, "epoch_fixture", settings);
        const restored = restoreSignatureRuntime(JSON.parse(json(runtime)), settings, state.timeSeconds);
        expect(restored).toEqual(runtime);
        if (state.timeSeconds <= 1) {
          expect(restored.observerStats.IR).toEqual(emptyStatistics());
          expect(restored.observerStats.EM).toEqual(emptyStatistics());
        } else expect(restored.observerStats.IR.lastEndS).toBe(state.timeSeconds);
        if (initialCap === "EMPTY" && to === 2) {
          expect(restored.rfStats.total.integral).toBe(0);
          expect(restored.radar.rfExportJ).toBe(size === "S" ? 5625 : 22500);
          expect(restored.pulseTail).toHaveLength(1);
        }
        if (to === 2.002) {
          expect(restored.pulseTail).toHaveLength(1);
          expect(restored.rfStats.total.integral).toBeLessThan(restored.radar.rfExportJ);
        }
      }
    }
  });
  it("valid numeric optional source taps stay optional and absent pulsePeak stays null", () => {
    const good = structuredClone(received);
    Object.assign(good.signatures.lastTruth.exports[0], { pathLossW: 0, motorInputW: 1 });
    const parsed = parseResultJson(json(good)); expect(parsed.ok).toBe(true);
    if (!parsed.ok) throw Error("valid optional fields refused");
    expect(parsed.value.signatures!.sourceStats.EM.total.pulsePeak).toBeNull();
    expect(exportSignatureCsv(parsed.value)).not.toContain("oops");
  });
  it("OFF processing covers its own zero-RF epoch; first arrival still has empty received aggregates", () => {
    const spec = bench(); spec.signatures!.rangeM = 3000;
    const runtime = createSignatureRuntime(spec.signatures!); let state = initialStateV2(spec);
    for (const to of [.1, 1, 1.001]) {
      const p = stepV2(spec, state, to - state.timeSeconds, {}); state = p.state;
      commitSignatureFrames(runtime, p.signatureFrames!, "off_fixture", spec.signatures!);
      expect(restoreSignatureRuntime(JSON.parse(json(runtime)), spec.signatures!, state.timeSeconds)).toEqual(runtime);
      expect(runtime.rfStats.total.integral).toBe(0); expect(runtime.rfStats.lastEndS).toBe(state.timeSeconds);
      if (to === 1) expect(runtime.observerStats.IR).toEqual(emptyStatistics());
    }
  });
  it("represented nextUp2 cadence and tiny live-tail intervals stay valid", () => {
    const spec = bench(); Object.assign(spec.signatures!, { radarEnabled: true, radarIntervalS: 2 + 2 * Number.EPSILON });
    const runtime = createSignatureRuntime(spec.signatures!); let state = initialStateV2(spec);
    const emittedAt = spec.signatures!.radarIntervalS;
    for (const to of [1, 2, emittedAt, emittedAt + 2 * Number.EPSILON, emittedAt + .001, emittedAt + .005]) {
      const p = stepV2(spec, state, to - state.timeSeconds, {}); state = p.state;
      commitSignatureFrames(runtime, p.signatureFrames!, "represented_clock_fixture", spec.signatures!);
      expect(restoreSignatureRuntime(JSON.parse(json(runtime)), spec.signatures!, state.timeSeconds)).toEqual(runtime);
      if (to === emittedAt) {
        expect(runtime.rfStats.total.integral).toBe(5625);
        expect(runtime.pulseTail[0].emittedAtS).toBe(emittedAt);
      }
    }
  });
  it.each([false, true])("signed cold surface/zero gas advanced=%s still exports and resumes without changing history", advancedIr => {
    const spec = bench("S", 400); spec.environment.effectiveBackgroundK = 700;
    spec.signatures!.advancedIr = advancedIr; spec.durationSeconds = 8;
    const run = createRun("signed", spec); runChunk(run, 60);
    const saved = result(run), parsed = parseResultJson(json(saved));
    expect(saved.signatures!.sourceStats.IRcontrast.total.min).toBeLessThan(0);
    expect(parsed.ok, parsed.ok ? "" : json(parsed.errors)).toBe(true);
    if (!parsed.ok) throw Error("valid signed checkpoint refused");
    expect(exportSignatureCsv(parsed.value)).toBe(exportSignatureCsv(saved));
    const resumed = restoreFittingRun(parsed.value);
    while (!run.done) runChunk(run, 30); while (!resumed.done) runChunk(resumed, 7);
    expect(resumed.state).toEqual(run.state); expect(resumed.signatures).toEqual(run.signatures);
  });
});

function localPhases(r: any, channel: string, totalIntegral: number, integrals: number[], min: number, max: number) {
  const stats = r.signatures.sourceStats[channel], durationS = r.signatures.timeS;
  const aggregate = (durationS: number, integral: number) => ({ durationS, integral, min, max, liveValue: min <= 0 && max >= 0 ? 0 : min, pulsePeak: null });
  stats.total = aggregate(durationS, totalIntegral);
  stats.phases = Object.fromEntries(integrals.map((integral, i) => [i === 0 ? r.signatures.peakContexts[channel].phase : `local_reference_${i}`, aggregate(durationS / integrals.length, integral)]));
}

describe("CR-SS-B1 finite persisted leaves cannot hide derived consistency overflow", () => {
  it.each([
    { name: "Review positive integral and absolute-reference overflow", channel: "EM", total: 1e308, phases: [1e308, 1e308], min: 0, max: 1e308 },
    { name: "negative signed integral overflow", total: -1e308, phases: [-1e308, -1e308], min: -1e308, max: 0 },
    { name: "absolute reference overflow despite finite cancellation", total: 0, phases: [1e308, -1e308], min: -1e308, max: 1e308 },
    { name: "finite cancellation with inconsistent total and overflowing reference", total: 1e308, phases: [1e308, -1e308], min: -1e308, max: 1e308 },
    { name: "finite sums but overflowing mismatch subtraction", total: -1e308, phases: [8e307, 8e307], min: -1e308, max: 1e308 },
  ])("$name", ({ channel, total, phases, min, max }) => {
    const bad = structuredClone(received); localPhases(bad, channel ?? "IRcontrast", total, phases, min, max); atomicRefusal(bad);
  });
  it("duration reduction overflow remains refused with finite persisted durations", () => {
    const bad = structuredClone(received); localPhases(bad, "EM", 0, [0, 0], 0, 0);
    Object.values(bad.signatures.sourceStats.EM.phases).forEach((p: any) => { p.durationS = 1e308; });
    atomicRefusal(bad);
  });
  it("derived mean overflow cannot pass an overflowing expanded upper bound", () => {
    const run = createRun("short", bench("S", 400)); runChunk(run, 1); const good = JSON.parse(json(result(run)));
    const bad = structuredClone(good); localPhases(bad, "EM", 1e308, [1e308], 0, Number.MAX_VALUE);
    atomicRefusal(bad, good);
  });
  it("derived surface expectations cannot become Infinity and satisfy relative equality", () => {
    const bad = structuredClone(received); bad.signatures.lastTruth.rkTemperatureK = [1e80, 1e80, 1e80, 1e80];
    bad.signatures.lastTruth.radiatorK = 1; // Both expected T4 surfaces overflow; stored slots stay finite.
    atomicRefusal(bad);
  });
  it("piece continuity cannot compare Infinity minus Infinity before first receipt", () => {
    const run = createRun("short-curve", bench("S", 400)); runChunk(run, 1); const good = JSON.parse(json(result(run)));
    const bad = structuredClone(good), f = bad.signatures.pending[0], q = Number.MAX_VALUE;
    f.ir = { pieces: [{ from: 0, to: .5, curve: { a: q, b: q, c: 0 } }, { from: .5, to: 1, curve: { a: q / 2, b: .9 * q, c: q } }] };
    f.crossings = []; atomicRefusal(bad, good);
  });
  it.each([
    { name: "finite scalar coefficients with overflowing endpoint", curve: { a: Number.MAX_VALUE, b: Number.MAX_VALUE, c: 0 } },
    { name: "finite endpoints with overflowing interior value and mean", curve: { a: 1.45e308, b: Number.MAX_VALUE, c: -Number.MAX_VALUE } },
  ])("$name", ({ curve }) => {
    const run = createRun("short-scalar", bench("S", 400)); runChunk(run, 1); const good = JSON.parse(json(result(run)));
    const bad = structuredClone(good); bad.signatures.pending[0].ir = curve; bad.signatures.pending[0].crossings = [];
    atomicRefusal(bad, good);
  });
  it("a large finite constant source curve before arrival remains accepted", () => {
    const run = createRun("large-constant", bench("S", 400)); runChunk(run, 1); const good = JSON.parse(json(result(run)));
    good.signatures.pending[0].ir = { a: Number.MAX_VALUE, b: 0, c: 0 }; good.signatures.pending[0].crossings = [];
    const parsed = parseResultJson(json(good)); expect(parsed.ok, parsed.ok ? "" : json(parsed.errors)).toBe(true);
    if (parsed.ok) expect(exportSignatureCsv(parsed.value)).not.toContain("Infinity");
  });
  it.each([
    { total: 2e307, phases: [1e307, 1e307], min: 0, max: 1e308 },
    { total: 0, phases: [1e307, -1e307], min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
  ])("large finite local sums and signed extrema remain accepted: $total", ({ total, phases, min, max }) => {
    const good = structuredClone(received); localPhases(good, "IRcontrast", total, phases, min, max);
    const parsed = parseResultJson(json(good)); expect(parsed.ok, parsed.ok ? "" : json(parsed.errors)).toBe(true);
    if (parsed.ok) expect(exportSignatureCsv(parsed.value)).not.toContain("Infinity");
  });
});

function nextUp(value: number) {
  const bits = new DataView(new ArrayBuffer(8)); bits.setFloat64(0, value);
  bits.setBigUint64(0, bits.getBigUint64(0) + (value > 0 ? 1n : -1n));
  return bits.getFloat64(0);
}
const nativeEm = 76.6567901234568;
const smallSignals = [1e-18, -1e-18, 1e-100, -1e-100, 1e-300, -1e-300];
const bucketControls = [
  { name: "actual Titan bucket439 lower", mean: 76.65679012345679, min: nativeEm, max: nativeEm },
  { name: "actual Titan bucket608 upper", mean: 76.65679012345682, min: nativeEm, max: nativeEm },
  { name: "actual Titan bucket673 upper", mean: 76.65679012345682, min: nativeEm, max: nativeEm },
  ...smallSignals.map(value => ({ name: `nonzero adjacent signed/weak ${value}`, mean: nextUp(value), min: value, max: value })),
  { name: "signed lower roundoff", mean: -76.65679012345682, min: -nativeEm, max: -nativeEm },
  { name: "signed upper roundoff", mean: -76.65679012345679, min: -nativeEm, max: -nativeEm },
  { name: "exact zero", mean: 0, min: 0, max: 0 },
  { name: "positive subnormal exact", mean: Number.MIN_VALUE, min: Number.MIN_VALUE, max: Number.MIN_VALUE },
  { name: "negative subnormal exact", mean: -Number.MIN_VALUE, min: -Number.MIN_VALUE, max: -Number.MIN_VALUE },
  { name: "large finite adjacent", mean: nextUp(1e308), min: 1e308, max: 1e308 },
  { name: "finite +/-MAX extrema", mean: 0, min: -Number.MAX_VALUE, max: Number.MAX_VALUE },
];
const bucketCorruptions = [
  { name: "reversed extrema by one ULP", mean: nativeEm, min: nextUp(nativeEm), max: nativeEm },
  { name: "lower beyond endpoint allowance", mean: nativeEm * (1 - 2e-12), min: nativeEm, max: nativeEm },
  { name: "upper beyond endpoint allowance", mean: nativeEm * (1 + 2e-12), min: nativeEm, max: nativeEm },
  ...smallSignals.map(value => ({ name: `weak/signed ${value} erased as zero`, mean: 0, min: value, max: value })),
  { name: "positive nonzero outside exact zero", mean: Number.MIN_VALUE, min: 0, max: 0 },
  { name: "negative nonzero outside exact zero", mean: -Number.MIN_VALUE, min: 0, max: 0 },
  { name: "positive subnormal erased as zero", mean: 0, min: Number.MIN_VALUE, max: Number.MIN_VALUE },
  { name: "negative subnormal erased as zero", mean: 0, min: -Number.MIN_VALUE, max: -Number.MIN_VALUE },
  { name: "wrong sign above zero endpoint", mean: Number.MIN_VALUE, min: -1e-18, max: 0 },
  { name: "wrong sign below zero endpoint", mean: -Number.MIN_VALUE, min: 0, max: 1e-18 },
  { name: "finite lower difference overflows", mean: -1e308, min: 1e308, max: 1e308 },
  { name: "finite upper difference overflows", mean: 1e308, min: -1e308, max: -1e308 },
];
describe("B-QA-UF04-01 local retained bucket roundoff preserves literal result data", () => {
  it.each(bucketControls)("accepts $name without changing mean/extrema", ({ mean, min, max }) => {
    const saved = structuredClone(received); saved.signatures.buckets[0].values.IRcontrast = { mean, min, max };
    const wire = json(saved), parsed = parseResultJson(wire);
    expect(parsed.ok, parsed.ok ? "" : json(parsed.errors)).toBe(true);
    if (!parsed.ok) throw Error("valid local bucket refused");
    expect(json(parsed.value)).toBe(wire); expect(exportSignatureCsv(parsed.value)).toBe(exportSignatureCsv(saved));
    const workspace = new FittingWorkspace(saved.spec.resolvedShip.fit, loadCandidateCatalog(saved.spec.catalogVersion));
    expect(workspace.importDocument(wire).ok).toBe(true); expect(json(workspace.getCurrentResult())).toBe(wire);
  });
  it.each(bucketCorruptions)("refuses $name atomically", ({ mean, min, max }) => {
    const bad = structuredClone(received); bad.signatures.buckets[0].values.IRcontrast = { mean, min, max }; atomicRefusal(bad);
  });
  it("actual default Titan3600 exports, reopens and restores without numeric changes", { timeout: 60000 }, () => {
    const catalog = loadCandidateCatalog("ship-fitting-0.2.5"), fit = getPresetFit("industrial-M:2:D", catalog.version);
    const built = makeMissionRun(fit, catalog, freshMissionConditions(fit, catalog));
    if (!built.ok) throw Error(json(built.errors));
    const spec = signatureSpec(built.value, defaultSignatureSettings("M")), run = createRun("native-titan-roundtrip", spec);
    while (!run.done) runChunk(run, 20000);
    const saved = result(run), wire = json(saved); expect(saved.state.timeSeconds).toBe(3600);
    // This is the real producer, including retention division; no normalized fixture.
    expect(saved.signatures!.buckets.some(b => b.values.EM.mean < b.values.EM.min || b.values.EM.mean > b.values.EM.max)).toBe(true);
    const parsed = parseResultJson(wire); expect(parsed.ok, parsed.ok ? "" : json(parsed.errors)).toBe(true);
    if (!parsed.ok) throw Error("actual Titan export refused");
    expect(json(parsed.value)).toBe(wire); expect(exportSignatureCsv(parsed.value)).toBe(exportSignatureCsv(saved));
    const workspace = new FittingWorkspace(fit, catalog); expect(workspace.importDocument(wire).ok).toBe(true);
    expect(json(workspace.getCurrentResult())).toBe(wire);
    const restored = restoreFittingRun(parsed.value); expect(restored.done).toBe(true);
    expect(restored.state).toEqual(run.state); expect(restored.signatures).toEqual(run.signatures); expect(restored.metrics).toEqual(run.metrics);
  });
});
