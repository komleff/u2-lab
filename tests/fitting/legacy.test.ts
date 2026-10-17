import { it, expect } from "vitest";
import {
  parseExperimentJson,
  serializeExperiment,
} from "../../src/io/fitting-json";
import { createRun, runChunk, result } from "../../src/runner/run";
import a from "./fixtures/legacy-0.json";
import b from "./fixtures/legacy-1.json";
import external from "./fixtures/legacy-external.json";
it.each([a, b, external])(
  "exact frozen v1 snapshot with untyped cargo replays without v2 reinterpretation",
  (x) => {
    const p = parseExperimentJson(JSON.stringify(x.spec));
    if (!p.ok) throw Error("legacy rejected");
    expect(p.value.schemaVersion).toBe("u2-lab/1");
    const r = createRun("legacy", p.value);
    while (!r.done) runChunk(r, 1000);
    expect(result(r).state).toEqual(x.state);
    expect(result(r).metrics).toEqual(x.metrics);
    expect(JSON.parse(serializeExperiment(p.value))).toEqual(x.spec);
    expect((p.value as any).resolvedShip).toBeUndefined();
  },
);
