import { it, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { Retention, EventRetention } from "../src/runner/retention";
import { WorkerController } from "../src/runner/protocol";
import { presets } from "../src/catalog/presets";
it("12h dt0.01s 64 channels preserves full-tick aggregates within128MiB and ACK latency after40000 buckets", () => {
  const names = Array.from({ length: 64 }, (_, i) => `channel${i}`),
    r = new Retention(names);
  const values: Record<string, number> = {};
  names.forEach((n, i) => (values[n] = i));
  const start = performance.now();
  const ticks = 4320000;
  let integral = 0;
  for (let i = 1; i <= ticks; i++) {
    values.channel0 = i * 0.01;
    integral += values.channel0 * 0.01;
    r.add(i * 0.01, values);
  }
  expect(r.totalTicks).toBe(ticks);
  expect(r.buckets.length).toBe(43200);
  expect(r.bytes).toBeLessThan(128 * 1024 * 1024);
  expect(r.buckets.reduce((n, b) => n + b.count, 0)).toBe(ticks);
  expect(r.buckets.reduce((n, b) => n + b.sum[0] * 0.01, 0)).toBeCloseTo(
    integral,
    1,
  );
  const out: any[] = [];
  const c = new WorkerController((m) => out.push(m));
  c.handle({
    runId: "long",
    commandId: 1,
    type: "start",
    payload: { spec: presets[0] },
  });
  c.context!.retention = r;
  c.pump();
  const at = performance.now();
  c.handle({ runId: "long", commandId: 2, type: "pause" });
  const pauseMs = performance.now() - at;
  expect(pauseMs).toBeLessThan(500);
  expect(out.at(-1)).toMatchObject({
    runId: "long",
    type: "control-ack",
    commandId: 2,
    control: "pause",
  });
  expect(c.pendingChunks).toBe(1);
  const evidence = {
    fixture: "12h/dt0.01/64channels",
    ticks,
    buckets: r.buckets.length,
    bytes: r.bytes,
    wallMs: performance.now() - start,
    pauseMs,
    queue: c.pendingChunks,
  };
  if (process.env.U2_RETENTION_REPORT)
    writeFileSync(
      process.env.U2_RETENTION_REPORT,
      JSON.stringify(evidence, null, 2) + "\n",
    );
  console.log(JSON.stringify(evidence));
});
it("duration beyond12h retention merges preserve extrema and all counts", () => {
  const r = new Retention(["x"]);
  for (let i = 1; i <= 100001; i++) r.add(i, { x: i });
  expect(r.buckets.length).toBeLessThanOrEqual(50000);
  expect(r.buckets.reduce((n, b) => n + b.count, 0)).toBe(100001);
  expect(Math.max(...r.buckets.map((b) => b.max[0]))).toBe(100001);
  expect(r.cadenceSeconds).toBeGreaterThan(1);
});
