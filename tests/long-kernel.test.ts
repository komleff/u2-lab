import { it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { presets, markEdits } from "../src/catalog/presets";
import { createRun, runChunk } from "../src/runner/run";
import {execFileSync} from 'node:child_process';
it('12h maximum curated v2 roster includes actual heap/GC, bounded metrics and every dynamic-channel peak',()=>{
  const output=execFileSync(process.execPath,['--expose-gc','tests/fitting-long.mjs'],{encoding:'utf8',timeout:1800000,maxBuffer:8*1024*1024});
  const evidence=JSON.parse(output.split('\n').find(line=>line.startsWith('{"fittingLongEvidence":'))!).fittingLongEvidence;
  expect(evidence.durationSeconds).toBe(43200);
  expect(evidence.memory.actualBytes).toBeLessThanOrEqual(128*1048576);
  expect(evidence.peakPreservation).toContain('all channel');
  console.log(JSON.stringify({fittingLongEvidence:evidence}));
},1805000);
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
