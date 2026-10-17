import { it, expect } from "vitest";
import { loadCandidateCatalog, getPresetFit } from "../../src/fitting/catalog";
import { validateFit } from "../../src/fitting/validate";
import { makeMiningRun } from "../../src/scenarios/fitting";
import {
  validateRunSpecV2,
  initialStateV2,
  stepV2,
} from "../../src/model/v2/step";
import {
  parseFitJson,
  parseExperimentJson,
  serializeFit,
  serializeExperiment,
} from "../../src/io/fitting-json";
import { createRun, runChunk, result } from "../../src/runner/run";
import { FittingSession } from "../../src/app/fitting-session";
import { fixture } from "./test-spec";
import { electricFit, thermoinverterFit } from "./input-fixtures";
import type { ModuleItem } from "../../src/fitting/types";
import { compileFit } from "../../src/fitting/compile";

it.each([null, [], {}, {schemaVersion:"u2-ship-fit/1"}])("new fit input guard refuses incomplete/old objects without promotion",input=>{
  const c=loadCandidateCatalog("ship-fitting-0.3.0"), before=structuredClone(input);
  const result=compileFit(input as any,c);expect(result.ok).toBe(false);
  if(!result.ok)expect(result.errors.every(e=>e.path&&e.message)).toBe(true);
  expect(input).toEqual(before);expect(parseFitJson(JSON.stringify(input),c).ok).toBe(false);
});

const invalidValues = [undefined, 0, -0.01, 1.01, NaN, Infinity];
const change = (item: ModuleItem, key: string, value: number | undefined) => {
  if (value === undefined) {
    delete item.numerics[key];
    delete item.origins["numerics." + key];
  } else item.numerics[key] = value;
};

it.each(
  ["pathEfficiency", "copEfficiency"].flatMap((key) =>
    invalidValues.map((value) => ({ key, value })),
  ),
)(
  "CR-B1 $key=$value rejects at fit, snapshot import and createRun",
  ({ key, value }) => {
    const catalog = loadCandidateCatalog(),
      fit =
        key === "pathEfficiency"
          ? electricFit(catalog)
          : thermoinverterFit(catalog);
    const id =
      fit.assignments[key === "pathEfficiency" ? "march" : "signature-1"];
    const good = makeMiningRun(fit, catalog, { durationSeconds: 1 });
    if (!good.ok) throw Error("positive fixture invalid");
    change(fit.localVariants[fit.instances[id].itemId], key, value);
    const checked = validateFit(fit, catalog);
    expect(checked.valid).toBe(false);
    expect(checked.readiness.canRun).toBe(false);
    expect(
      checked.issues.some((issue) => issue.path.endsWith(".numerics." + key)),
    ).toBe(true);
    expect(parseFitJson(serializeFit(fit), catalog).ok).toBe(false);
    expect(makeMiningRun(fit, catalog).ok).toBe(false);
    const snapshot = structuredClone(good.value);
    change(
      snapshot.resolvedShip.instances.find((instance) => instance.id === id)!
        .item,
      key,
      value,
    );
    const validated = validateRunSpecV2(snapshot);
    expect(validated.ok).toBe(false);
    if (!validated.ok)
      expect(
        validated.errors.some((issue) =>
          issue.path.endsWith(".numerics." + key),
        ),
      ).toBe(true);
    expect(parseExperimentJson(serializeExperiment(snapshot)).ok).toBe(false);
    expect(() => createRun("invalid-coefficient", snapshot)).toThrow(
      ".numerics." + key,
    );
  },
);

it.each(["pathEfficiency", "copEfficiency"])(
  "CR-B1 %s positive coefficient still requires provenance",
  (key) => {
    const c = loadCandidateCatalog(),
      f = key === "pathEfficiency" ? electricFit(c) : thermoinverterFit(c);
    const id =
        f.assignments[key === "pathEfficiency" ? "march" : "signature-1"],
      item = f.localVariants[f.instances[id].itemId];
    const prepared = makeMiningRun(f, c);
    if (!prepared.ok) throw Error("positive fixture invalid");
    delete item.origins["numerics." + key];
    const checked = validateFit(f, c);
    expect(checked.issues).toContainEqual(
      expect.objectContaining({
        code: "ORIGIN",
        path: "instances." + id + ".numerics." + key,
      }),
    );
    expect(parseFitJson(serializeFit(f), c).ok).toBe(false);
    delete prepared.value.resolvedShip.instances.find((i) => i.id === id)!.item
      .origins["numerics." + key];
    expect(parseExperimentJson(serializeExperiment(prepared.value)).ok).toBe(
      false,
    );
  },
);

it.each(["pathEfficiency", "copEfficiency"])(
  "CR-B1 %s finite positive ordinary and upper-bound controls preserve inputs and finite physical ledger",
  (key) => {
    for (const value of [0.45, 1]) {
      const c = loadCandidateCatalog(),
        f = key === "pathEfficiency" ? electricFit(c) : thermoinverterFit(c);
      const id =
          f.assignments[key === "pathEfficiency" ? "march" : "signature-1"],
        item = f.localVariants[f.instances[id].itemId];
      item.numerics[key] = value;
      const prepared = makeMiningRun(f, c, { durationSeconds: 1 });
      if (!prepared.ok) throw Error(JSON.stringify(prepared.errors));
      expect(parseFitJson(serializeFit(f), c)).toEqual({ ok: true, value: f });
      expect(parseExperimentJson(serializeExperiment(prepared.value))).toEqual(
        prepared,
      );
      const before = structuredClone(prepared.value),
        state = initialStateV2(prepared.value);
      const step = stepV2(
        prepared.value,
        state,
        0.01,
        key === "pathEfficiency" ? { march: 1 } : {},
      );
      expect(Object.values(step.telemetry).every(Number.isFinite)).toBe(true);
      expect(step.state.timeSeconds).toBe(0.01);
      expect(Number.isFinite(step.state.currentMassKg)).toBe(true);
      expect(Math.abs(step.telemetry.energyResidualJ)).toBeLessThan(1e-3);
      if (key === "pathEfficiency")
        expect(step.telemetry.thrustN).toBeGreaterThan(0);
      expect(prepared.value).toEqual(before);
    }
  },
);

it("CR-B1 failed local-variant apply preserves last valid fit, running snapshot and A", () => {
  const c = loadCandidateCatalog(),
    f = electricFit(c),
    session = new FittingSession(f, c),
    prepared = session.prepareRun({ durationSeconds: 0.01 });
  if (!prepared.ok) throw Error("missing");
  const run = createRun("last-valid", prepared.value);
  runChunk(run, 1);
  session.freeze(result(run));
  const prior = structuredClone(session.a),
    spec = structuredClone(run.spec),
    current = session.getFit(),
    invalid = session.getFit();
  delete invalid.localVariants[
    invalid.instances[invalid.assignments.march].itemId
  ].numerics.pathEfficiency;
  expect(session.applyFit(invalid).valid).toBe(false);
  expect(session.getFit()).toEqual(current);
  expect(session.a).toEqual(prior);
  expect(run.spec).toEqual(spec);
});

it.each(["stepSeconds", "durationSeconds"])(
  "CR-B2 unsupported %s rejects before run and supported snapshot import with exact field diagnosis",
  (key) => {
    for (const seconds of [
      1e-12,
      1e-10 * (1 - Number.EPSILON),
      1e-10,
      0,
      -0.01,
      NaN,
      Infinity,
      ...(key === "stepSeconds" ? [1.001] : []),
    ]) {
      const spec = fixture("sputnik:1");
      spec[key as "stepSeconds" | "durationSeconds"] = seconds;
      const checked = validateRunSpecV2(spec);
      expect(checked.ok).toBe(false);
      if (!checked.ok)
        expect(checked.errors.some((issue) => issue.path === key)).toBe(true);
      expect(parseExperimentJson(serializeExperiment(spec)).ok).toBe(false);
      expect(() => createRun("unsupported-time", spec)).toThrow(key);
      expect(
        makeMiningRun(getPresetFit("sputnik:1"), loadCandidateCatalog(), {
          [key]: seconds,
        }).ok,
      ).toBe(false);
    }
  },
);

it.each([1e-10 * (1 + Number.EPSILON), 2e-10])(
  "CR-B2 boundary dt/horizon %s above epsilon executes an actual step before complete",
  (seconds) => {
    const spec = fixture("sputnik:1");
    spec.durationSeconds = seconds;
    spec.stepSeconds = seconds;
    expect(validateRunSpecV2(spec).ok).toBe(true);
    const run = createRun("boundary", spec),
      chunk = runChunk(run, 1);
    expect(chunk.steps).toBe(1);
    expect(run.metrics.ticks).toBe(1);
    expect(run.state.timeSeconds).toBe(seconds);
    expect(run.metrics.durationSeconds).toBe(seconds);
    expect(run.done).toBe(true);
    expect(result(run).status).toBe("complete");
    expect(Object.values(run.last).every(Number.isFinite)).toBe(true);
  },
);

it.each([0.01, 0.005, 0.0025])(
  "CR-B2 supported dt%s completes exact horizon with truthful time, tick count and metrics",
  (dt) => {
    const spec = fixture("sputnik:1");
    spec.stepSeconds = dt;
    spec.durationSeconds = 0.02;
    const run = createRun("supported", spec);
    runChunk(run, 1);
    expect(run.done).toBe(false);
    expect(result(run).status).toBe("paused");
    while (!run.done) runChunk(run, 100);
    expect(run.state.timeSeconds).toBe(0.02);
    expect(run.metrics.ticks).toBe(Math.round(0.02 / dt));
    expect(run.metrics.durationSeconds).toBeCloseTo(0.02, 12);
    expect(run.metrics.usefulWork).toBeGreaterThan(0);
    expect(Math.abs(run.metrics.energyResidualJ)).toBeLessThan(1e-3);
    expect(result(run).status).toBe("complete");
  },
);

it("CR-B2 supported horizon below nominal step executes clipped positive time, not a zero-time completion", () => {
  const spec = fixture("sputnik:1");
  spec.durationSeconds = 2e-10;
  spec.stepSeconds = 0.01;
  const run = createRun("clipped-horizon", spec),
    chunk = runChunk(run, 1);
  expect(chunk.steps).toBe(1);
  expect(run.metrics.ticks).toBe(1);
  expect(run.state.timeSeconds).toBe(2e-10);
  expect(run.metrics.durationSeconds).toBe(2e-10);
  expect(result(run).status).toBe("complete");
});
