import { it, expect } from "vitest";
import { presets } from "../src/catalog/presets";
import {
  parseRunJson,
  serializeRun,
  exportTelemetryCsv,
  exportEventsCsv,
} from "../src/io/json";
import { createRun, runChunk, result } from "../src/runner/run";
import { compareRuns, freezeRun } from "../src/app/compare";
it("JSON roundtrip preserves exact provenance and invalid imports report path", () => {
  expect(parseRunJson(serializeRun(presets[0]))).toEqual({
    ok: true,
    value: presets[0],
  });
  expect(parseRunJson("{oops").ok).toBe(false);
  const p = structuredClone(presets[0]);
  p.stepSeconds = 0;
  const v = parseRunJson(JSON.stringify(p));
  expect(v.ok).toBe(false);
  if (!v.ok) expect(v.errors.some((e) => e.path === "stepSeconds")).toBe(true);
});
it("CSV exposes SI units and aggregate cadence, escapes event text", () => {
  const r = createRun("x", presets[0]);
  runChunk(r, 2);
  const data = result(r);
  data.events.push({ timeSeconds: 1, kind: "test", message: 'a,"b"\ntext' });
  expect(exportTelemetryCsv(data)).toContain("temperatureK_mean_K");
  expect(exportTelemetryCsv(data)).toContain("originalCadenceSeconds");
  expect(exportEventsCsv(data)).toContain('"a,""b""\ntext"');
  expect(exportEventsCsv(data)).toContain("droppedEvents");
});
it("freezing A is immutable; same task and own sortie retain unmatched conditions", () => {
  const a = createRun("a", presets[0]);
  runChunk(a, 1);
  const frozen = freezeRun(result(a));
  a.spec.ship.cargoCapacity = 999;
  expect(frozen.spec.ship.cargoCapacity).toBe(12);
  const b = createRun("b", presets[1]);
  runChunk(b, 1);
  const same = compareRuns(frozen, result(b), "same-task"),
    own = compareRuns(frozen, result(b), "own-sortie");
  expect(same.conditionsMatch).toBe(true);
  expect(same.capacityA).toBe(12);
  expect(own.capacityB).toBe(48);
  expect(same.differences.length).toBeGreaterThan(0);
});
it("same-task uses actual metrics at target rather than fuel from the later full sortie", () => {
  const r = createRun("target", presets[1]);
  while (!r.done) runChunk(r, 10000);
  const data = result(r);
  const c = compareRuns(data, data, "same-task");
  expect(c.a.usefulWork).toBeCloseTo(12, 4);
  expect(c.a.fuelConsumedKg.diesel).toBeLessThan(
    data.metrics.fuelConsumedKg.diesel,
  );
});
