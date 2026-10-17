import { it, expect } from "vitest";
import { fixture } from "./test-spec";
import { createRun, runChunk } from "../../src/runner/run";
import {
  initialMiningMetrics,
  updateMiningMetrics,
} from "../../src/runner/mining-metrics";
import { initialStateV2 } from "../../src/model/v2/step";
function full(group = 3, active = 3) {
  const s = fixture();
  s.initial.chargeJ = 1e9;
  s.durationSeconds = 20;
  s.scenario.phases = [
    {
      id: "work",
      action: "work",
      durationSeconds: 10,
      requests: Object.fromEntries(
        s.selectedWorkGroup.map((id, i) => [id, i < active ? 1 : 0]),
      ),
    },
    { id: "idle", action: "idle", durationSeconds: 10, requests: {} },
  ];
  s.selectedWorkGroup = s.selectedWorkGroup.slice(0, group);
  const r = createRun("K", s);
  while (!r.done) runChunk(r, 1000);
  return r;
}
it("fixed group denominator includes transit/manual off; horizonK beside absolute SCU/h", () => {
  const a = full();
  expect(a.metrics.kUseHorizon).toBeCloseTo(0.5, 8);
  expect(a.metrics.scuPerHour).toBeCloseTo(337.5675, 6);
  const b = full(3, 2);
  expect(b.metrics.kUseHorizon).toBeCloseTo(1 / 3, 8);
  const one = full(1, 1);
  expect(one.metrics.kUseHorizon).toBeCloseTo(0.5, 8);
  expect(one.metrics.selectedWorkM3).toBeCloseTo(0.625125, 8);
});
it("zero extraction/species perSCU and zero group become N/A, pending recovery stays null", () => {
  const s = fixture();
  s.selectedWorkGroup = [];
  s.scenario.phases[0].requests = {};
  const r = createRun("zero", s);
  while (!r.done) runChunk(r, 1000);
  expect(r.metrics.kUseHorizon).toBeNull();
  expect(r.metrics.fuelPerScu.diesel).toBeNull();
  expect(r.metrics.recovery.firstSeconds).toBeNull();
  expect(r.metrics.firstLimiter).toBeNull();
});
it("cargo fills inside step with exact returned heat; target reached is not limiter", () => {
  const s = fixture("sputnik");
  s.initial.chargeJ = 1e9;
  s.initial.cargoM3.ore = 5.99;
  const r = createRun("cargo", s);
  while (!r.done) runChunk(r, 1000);
  expect(r.state.usefulWork).toBeCloseTo(0.01, 8);
  expect(r.state.cargo).toBeCloseTo(6, 8);
  expect(r.metrics.firstLimiter!.causes).toContain("cargo");
  const t = fixture("sputnik");
  t.initial.chargeJ = 1e9;
  t.scenario.targetM3 = 0.01;
  const target = createRun("target", t);
  while (!target.done) runChunk(target, 1000);
  expect(target.metrics.firstTargetSeconds).not.toBeNull();
  expect(target.metrics.firstLimiter).toBeNull();
});
function synthetic(N: number, zero = false) {
  const s = fixture();
  const m = initialMiningMetrics(s);
  let state = initialStateV2(s);
  for (let i = 0; i < N * 3; i++) {
    const loss = i % 3 === 0,
      service = i % 3 === 2;
    const next = {
      ...state,
      timeSeconds: state.timeSeconds + 1,
      usefulWork:
        state.usefulWork + (service || (zero && loss) ? 0 : loss ? 0.5 : 1),
      consumptionKg: state.consumptionKg,
    };
    const delta = {
      requested: !service,
      requestedM3: service ? 0 : 1,
      selectedM3: service || (zero && loss) ? 0 : loss ? 0.5 : 1,
      causeSeconds: {
        power: loss ? 1 : 0,
        thermal: loss ? 1 : 0,
        resource: 0,
        cargo: 0,
      },
      unionSeconds: loss ? 1 : 0,
      overlapSeconds: loss ? 1 : 0,
      forcedDowntimeSeconds: zero && loss ? 1 : 0,
      partialLossM3: loss && !zero ? 0.5 : 0,
      firstLoss: loss
        ? { timeSeconds: state.timeSeconds, causes: ["power", "thermal"] }
        : null,
      firstPositiveSeconds:
        service || (zero && loss) ? null : state.timeSeconds,
      propulsionShortfall: false,
    };
    updateMiningMetrics(
      m,
      state,
      {
        state: next,
        telemetry: { energyResidualJ: 0, chemicalW: 0, temperatureK: 300 },
        events: [],
        coolantConsumedKg: 0,
        maxTemperatureK: 300,
        mining: delta,
      } as any,
      1,
      s,
    );
    state = next;
  }
  return m;
}
it("online durations union overlap partial loss remain exact with bounded cells for 100 vs10000cycles", () => {
  const a = synthetic(100),
    b = synthetic(10000);
  expect(b.causeSeconds.power).toBe(10000);
  expect(b.causeSeconds.thermal).toBe(10000);
  expect(b.limitationUnionSeconds).toBe(10000);
  expect(b.overlapSeconds).toBe(10000);
  expect(b.forcedDowntimeSeconds).toBe(0);
  expect(b.partialLossM3).toBe(5000);
  expect(Object.keys(a)).toEqual(Object.keys(b));
  expect(JSON.stringify(b).length).toBeLessThan(4000);
  expect(b.firstLimiter!.causes).toEqual(["power", "thermal"]);
});
it("zero-work recovery count mean excludes unfinished stops and overlapping causes not summed", () => {
  const b = synthetic(10000, true);
  expect(b.forcedDowntimeSeconds).toBe(10000);
  expect(b.recovery.count).toBe(10000);
  expect(b.recovery.meanSeconds).toBe(1);
  expect(b.recovery.maxSeconds).toBe(1);
});
