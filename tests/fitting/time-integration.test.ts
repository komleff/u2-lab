import { expect, it } from "vitest";
import { fixture } from "./test-spec";
import { createRun, runChunk, result } from "../../src/runner/run";
import {
  initialStateV2,
  stepV2,
  validateRunSpecV2,
} from "../../src/model/v2/step";
import {
  parseExperimentJson,
  serializeExperiment,
} from "../../src/io/fitting-json";

// Независимый source oracle: один S laser даёт 2,000,400 W × 0.75 / 24 MJ/m³.
const ratedM3S = 0.0625125;
const charged = () => {
  const spec = fixture("sputnik:1");
  spec.initial.chargeJ = 1e9;
  return spec;
};
const closeRelative = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    Math.abs(expected) * 1e-12,
  );

it.each(
  [1.0001e-10, 2e-10, 7e-10].flatMap((dt) =>
    [2e-10, 1e-9, 1e-8].map((horizon) => ({ dt, horizon })),
  ),
)(
  "CR-B2 independent accepted dt=$dt × horizon=$horizon accounts for every completed interval",
  ({ dt, horizon }) => {
    const spec = charged();
    spec.stepSeconds = dt;
    spec.durationSeconds = horizon;
    expect(validateRunSpecV2(spec).ok).toBe(true);
    expect(parseExperimentJson(serializeExperiment(spec)).ok).toBe(true);
    const run = createRun("cross-product", spec);
    let calls = 0;
    while (!run.done && calls < 1000) {
      const before = run.state.timeSeconds;
      const measured = run.metrics.durationSeconds;
      const chunk = runChunk(run, 1);
      expect(chunk.steps).toBe(1);
      expect(run.state.timeSeconds).toBeGreaterThan(before);
      closeRelative(
        run.state.timeSeconds - before,
        run.metrics.durationSeconds - measured,
      );
      expect(run.state.timeSeconds).toBeLessThanOrEqual(horizon);
      closeRelative(
        run.metrics.usefulWork,
        ratedM3S * run.metrics.durationSeconds,
      );
      expect(Object.values(run.last).every(Number.isFinite)).toBe(true);
      if (calls === 0 && dt < horizon) {
        expect(run.done).toBe(false);
        expect(result(run).status).toBe("paused");
      }
      calls++;
    }
    expect(run.done).toBe(true);
    expect(run.metrics.ticks).toBe(calls);
    expect(run.retention.totalTicks).toBe(calls);
    expect(run.state.timeSeconds).toBe(horizon);
    expect(run.metrics.durationSeconds).toBe(horizon);
    closeRelative(run.metrics.usefulWork, ratedM3S * horizon);
    closeRelative(run.metrics.selectedWorkM3, ratedM3S * horizon);
    closeRelative(run.metrics.kUseHorizon!, 1);
    expect(result(run).status).toBe("complete");
  },
);

it.each([5e-11, 5e-12])(
  "CR-B2 positive clipped remainder %ss is measured and mined before completion",
  (tail) => {
    const spec = charged();
    spec.durationSeconds = 0.01 + tail;
    const run = createRun("clipped-tail", spec);
    runChunk(run, 1);
    expect(run.done).toBe(false);
    expect(run.state.timeSeconds).toBe(0.01);
    const priorWork = run.metrics.usefulWork;
    const chunk = runChunk(run, 1);
    expect(chunk.steps).toBe(1);
    expect(run.metrics.usefulWork).toBeGreaterThan(priorWork);
    expect(run.metrics.ticks).toBe(2);
    expect(run.state.timeSeconds).toBe(spec.durationSeconds);
    expect(run.metrics.durationSeconds).toBe(spec.durationSeconds);
    closeRelative(run.metrics.usefulWork, ratedM3S * spec.durationSeconds);
    expect(run.done).toBe(true);
  },
);

it.each([1e-12, 5e-11])(
  "CR-B2 kernel integrates a clipped %ss interval with finite actual work and telemetry",
  (dt) => {
    const spec = charged(),
      initial = initialStateV2(spec);
    const step = stepV2(spec, initial, dt, spec.scenario.phases[0].requests);
    expect(step.state.timeSeconds).toBe(dt);
    closeRelative(step.state.usefulWork, ratedM3S * dt);
    closeRelative(step.mining.requestedM3, ratedM3S * dt);
    closeRelative(step.mining.selectedM3, ratedM3S * dt);
    closeRelative(step.telemetry.workRate, ratedM3S);
    expect(Object.values(step.telemetry).every(Number.isFinite)).toBe(true);
    expect(initial.timeSeconds).toBe(0);
  },
);

it("CR-B2 kernel measures the entire interval across an internal battery-empty boundary", () => {
  const spec = charged(),
    dt = 2e-10;
  spec.initial.fuelKg.diesel = 0;
  const full = stepV2(
    spec,
    initialStateV2(spec),
    dt,
    spec.scenario.phases[0].requests,
  );
  const batterySeconds = 1.5e-10;
  spec.initial.chargeJ = (full.telemetry.deliveredW / 0.9) * batterySeconds;
  const split = stepV2(
    spec,
    initialStateV2(spec),
    dt,
    spec.scenario.phases[0].requests,
  );
  expect(split.state.timeSeconds).toBe(dt);
  closeRelative(split.mining.requestedM3, ratedM3S * dt);
  closeRelative(split.mining.selectedM3, ratedM3S * batterySeconds);
  closeRelative(split.mining.unionSeconds, dt - batterySeconds);
  expect(split.state.chargeJ).toBe(0);
  expect(Object.values(split.telemetry).every(Number.isFinite)).toBe(true);
});

it.each([0.01, 0.005, 0.0025])(
  "CR-B2 ordinary dt%s and clipped .025s horizon keep actual clock, work, metrics and retained ticks consistent",
  (dt) => {
    const spec = charged();
    spec.stepSeconds = dt;
    spec.durationSeconds = 0.025;
    const run = createRun("ordinary-clipped", spec);
    let calls = 0;
    while (!run.done && calls < 20) {
      const before = run.state.timeSeconds;
      runChunk(run, 1);
      expect(run.state.timeSeconds).toBeGreaterThan(before);
      expect(run.state.timeSeconds).toBe(run.metrics.durationSeconds);
      calls++;
    }
    expect(run.done).toBe(true);
    expect(run.state.timeSeconds).toBe(0.025);
    expect(run.metrics.durationSeconds).toBe(0.025);
    expect(run.metrics.ticks).toBe(calls);
    expect(run.retention.totalTicks).toBe(calls);
    expect(calls).toBeGreaterThanOrEqual(Math.ceil(0.025 / dt));
    expect(calls).toBeLessThanOrEqual(Math.ceil(0.025 / dt) + 1);
    closeRelative(run.metrics.usefulWork, ratedM3S * 0.025);
  },
);
