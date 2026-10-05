import { it, expect } from "vitest";
import { fixture } from "./test-spec";
import {
  initialMiningMetrics,
  updateMiningMetrics,
} from "../../src/runner/mining-metrics";
import { initialStateV2 } from "../../src/model/v2/step";
import { EventRetention } from "../../src/runner/retention";
import type { StepResultV2 } from "../../src/model/v2/types";

it("alternating limit/recovery/service remains exact after event truncation, with constant online cells", () => {
  const oracle = (cycles: number) => {
    const s = fixture();
    s.scenario.targetM3 = 1e9;
    s.scenario.repeat = true;
    s.scenario.phases = [
      { id: "limit", action: "work", durationSeconds: 1, requests: {} },
      { id: "recover", action: "work", durationSeconds: 1, requests: {} },
      { id: "service", action: "service", durationSeconds: 1, requests: {} },
    ];
    const m = initialMiningMetrics(s),
      events = new EventRetention();
    let state = initialStateV2(s);
    for (let cycle = 0; cycle < cycles; cycle++)
      for (let phase = 0; phase < 3; phase++) {
        const loss = phase === 0,
          service = phase === 2;
        state.phaseKey = cycle + ":" + phase;
        const next = {
          ...state,
          timeSeconds: state.timeSeconds + 1,
          usefulWork: state.usefulWork + (phase === 1 ? 1 : 0),
          miningStopSeconds: loss ? state.timeSeconds : null,
        };
        const step = {
          state: next,
          telemetry: { energyResidualJ: 0 },
          maxTemperatureK: 300,
          events: [],
          coolantConsumedKg: 0,
          mining: {
            requested: !service,
            requestedM3: service ? 0 : 1,
            selectedM3: phase === 1 ? 1 : 0,
            causeSeconds: {
              power: loss ? 1 : 0,
              thermal: loss ? 1 : 0,
              resource: 0,
              cargo: 0,
            },
            unionSeconds: loss ? 1 : 0,
            overlapSeconds: loss ? 1 : 0,
            forcedDowntimeSeconds: loss ? 1 : 0,
            partialLossM3: 0,
            firstLoss: loss
              ? { timeSeconds: state.timeSeconds, causes: ["power", "thermal"] }
              : null,
            firstCauseSeconds: {
              power: loss ? state.timeSeconds : null,
              thermal: loss ? state.timeSeconds : null,
              resource: null,
              cargo: null,
            },
            firstPositiveSeconds: phase === 1 ? state.timeSeconds : null,
            propulsionShortfall: false,
            recoveryDelta: {
              firstSeconds: phase === 1 ? 1 : null,
              count: phase === 1 ? 1 : 0,
              sumSeconds: phase === 1 ? 1 : 0,
              maxSeconds: phase === 1 ? 1 : 0,
            },
          },
        } as StepResultV2;
        updateMiningMetrics(m, state, step, 1, s);
        events.add({
          timeSeconds: next.timeSeconds,
          kind: "phase",
          message: s.scenario.phases[phase].id,
        });
        state = next;
      }
    return { m, events };
  };
  const short = oracle(100),
    long = oracle(30000);
  expect(long.events.items()).toHaveLength(20000);
  expect(long.events.dropped).toBe(70000);
  expect(long.events.items()[127].timeSeconds).toBe(128);
  expect(long.events.items()[128].timeSeconds).toBe(70129);
  expect(long.m.usefulWork).toBe(30000);
  expect(long.m.causeSeconds.power).toBe(30000);
  expect(long.m.causeSeconds.thermal).toBe(30000);
  expect(long.m.limitationUnionSeconds).toBe(30000);
  expect(long.m.overlapSeconds).toBe(30000);
  expect(long.m.forcedDowntimeSeconds).toBe(30000);
  expect(long.m.plannedServiceSeconds).toBe(30000);
  expect(long.m.recovery.count).toBe(30000);
  expect(long.m.recovery.meanSeconds).toBe(1);
  expect(long.m.completedCycles.scu).toBe(30000);
  expect(long.m.cyclesCompleted).toBe(30000);
  const topology = (v: unknown): unknown =>
    v && typeof v === "object"
      ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, topology(x)]))
      : typeof v;
  expect(topology(long.m)).toEqual(topology(short.m));
  expect(JSON.stringify(long.m).length).toBeLessThan(4000);
});
