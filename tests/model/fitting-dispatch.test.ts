import { it, expect } from "vitest";
import { fixture } from "../fitting/test-spec";
import { createRun, runChunk, result } from "../../src/runner/run";
import baseline from "../fitting/fixtures/legacy-0.json";
it("runner dispatches v2 while exact frozen v1 numerical results stay untouched", () => {
  const legacy = createRun("legacy", baseline.spec as any);
  while (!legacy.done) runChunk(legacy, 1000);
  expect(result(legacy).state).toEqual(baseline.state);
  expect(result(legacy).metrics).toEqual(baseline.metrics);
  const s = fixture("sputnik");
  s.initial.chargeJ = 1e9;
  const run = createRun("v2", s);
  while (!run.done) runChunk(run, 1000);
  const r = result(run);
  expect(r.spec.schemaVersion).toBe("u2-lab/2");
  expect(r.state.usefulWork).toBeCloseTo(0.0625125, 8);
  expect(r.channels.some((c) => c === "beamW:fit:payload-1")).toBe(true);
});
