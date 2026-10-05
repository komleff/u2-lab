import { it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { presets, markEdits } from "../src/catalog/presets";
import { createRun, runChunk } from "../src/runner/run";
it("12h work replay at dt0.01 keeps resources and metrics bounded", () => {
  const p = structuredClone(presets[0]);
  p.durationSeconds = 43200;
  p.stepSeconds = 0.01;
  markEdits(p);
  const run = createRun("12h-kernel", p);
  const start = performance.now();
  while (!run.done) runChunk(run, 100000);
  expect(run.state.timeSeconds).toBe(43200);
  expect(run.metrics.ticks).toBeGreaterThanOrEqual(4320000);
  expect(run.state.fuelKg.diesel).toBeLessThan(p.initial.fuelKg.diesel);
  expect(run.state.chargeJ).toBeGreaterThanOrEqual(0);
  expect(run.retention.bytes).toBeLessThan(128 * 1024 * 1024);
  expect(
    Math.abs(run.metrics.energyResidualJ) /
      Math.max(run.metrics.sourceEnergyJ, 1),
  ).toBeLessThan(1e-9);
  expect(run.state.usefulWork).toBeGreaterThan(12);
  const evidence = {
    fixture: "12h real S mining kernel",
    ticks: run.metrics.ticks,
    buckets: run.retention.buckets.length,
    channels: run.retention.channels.length,
    bytes: run.retention.bytes,
    wallMs: performance.now() - start,
    metrics: run.metrics,
  };
  if (process.env.U2_PERFORMANCE_REPORT)
    writeFileSync(
      process.env.U2_PERFORMANCE_REPORT,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  console.log(JSON.stringify(evidence));
}, 240000);
