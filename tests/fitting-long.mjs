import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { createServer } from "vite";

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
});
const { worstRun } = await server.ssrLoadModule("/tests/fitting/worst-fit.ts");
const { createRun, runChunk } =
  await server.ssrLoadModule("/src/runner/run.ts");
await server.close();
global.gc();
const before = process.memoryUsage();
const duration = Number(process.env.U2_FITTING_LONG_SECONDS ?? 43200);
const run = createRun("curated-12h", worstRun(duration, 0.01));
const cells = (v) =>
  v && typeof v === "object"
    ? Object.values(v).reduce((n, x) => n + cells(x), 0)
    : 1;
const initialMetricCells = cells(run.metrics);
const initialLimitationCells = cells(run.state.limitations);
const started = performance.now();
runChunk(run, 1);
const peaks = Object.fromEntries(
  run.retention.channels.map((k) => [
    k,
    { min: run.last[k], max: run.last[k] },
  ]),
);
const retain = run.retention.add.bind(run.retention);
run.retention.add = (time, values) => {
  for (const k of run.retention.channels) {
    peaks[k].min = Math.min(peaks[k].min, values[k] ?? 0);
    peaks[k].max = Math.max(peaks[k].max, values[k] ?? 0);
  }
  retain(time, values);
};
let lastProgress = performance.now();
while (!run.done) {
  runChunk(run, 10000);
  if (performance.now() - lastProgress > 30000) {
    console.log(
      JSON.stringify({
        progressSeconds: run.state.timeSeconds,
        ticks: run.metrics.ticks,
      }),
    );
    lastProgress = performance.now();
  }
}
global.gc();
const after = process.memoryUsage();
const actualBytes =
  after.heapUsed - before.heapUsed + after.arrayBuffers - before.arrayBuffers;
assert.equal(run.state.timeSeconds, duration);
assert.ok(run.metrics.ticks >= Math.floor(duration / 0.01));
assert.ok(run.retention.buckets.length <= 50000);
assert.ok(run.retention.bytes <= 128 * 1048576);
assert.ok(
  actualBytes <= 128 * 1048576,
  "actual retained heap + arrays including online metric state",
);
assert.equal(run.retention.totalTicks, run.metrics.ticks);
assert.equal(
  run.retention.buckets.reduce((n, b) => n + b.count, 0),
  run.metrics.ticks,
);
assert.equal(run.retention.buckets.at(-1).endSeconds, duration);
assert.equal(cells(run.state.limitations), initialLimitationCells);
// Первое ограничение и последний цикл становятся записями фиксированного размера.
assert.ok(cells(run.metrics) <= initialMetricCells + 12);
assert.ok(
  Math.abs(run.metrics.energyResidualJ) <=
    Math.max(1, 1e-6 * run.metrics.sourceEnergyJ),
);
assert.ok(run.state.chargeJ >= 0);
for (const n of Object.values(run.state.fuelKg)) assert.ok(n >= 0);
for (const i of run.spec.resolvedShip.instances)
  assert.ok(run.retention.channels.includes("installedMassKg:" + i.id));
for (const [j, k] of run.retention.channels.entries()) {
  assert.equal(
    run.retention.buckets.reduce((n, b) => Math.min(n, b.min[j]), Infinity),
    peaks[k].min,
    "retained minimum " + k,
  );
  assert.equal(
    run.retention.buckets.reduce((n, b) => Math.max(n, b.max[j]), -Infinity),
    peaks[k].max,
    "retained maximum " + k,
  );
}
const evidence = {
  fixture:
    "maximum curated IndustrialL roster, physical dt0.01, repeated mining/unload, finite shared stocks",
  durationSeconds: duration,
  stepSeconds: 0.01,
  ticks: run.metrics.ticks,
  instances: run.spec.resolvedShip.instances.map((i) => ({
    id: i.id,
    itemId: i.item.id,
  })),
  channels: run.retention.channels,
  retention: run.retention.metadata(),
  events: {
    retained: run.events.items().length,
    total: run.events.total,
    dropped: run.events.dropped,
  },
  memory: {
    actualBytes,
    heapBefore: before.heapUsed,
    heapAfter: after.heapUsed,
    arrayBuffersBefore: before.arrayBuffers,
    arrayBuffersAfter: after.arrayBuffers,
    includes:
      "run context, traces, events, snapshot, metric/open limitation state; explicit GC",
  },
  boundedCells: {
    initialMetricCells,
    finalMetricCells: cells(run.metrics),
    initialLimitationCells,
    finalLimitationCells: cells(run.state.limitations),
  },
  peakPreservation: "all channel min/max equal full step stream",
  wallMs: performance.now() - started,
  metrics: run.metrics,
};
if (process.env.U2_FITTING_LONG_REPORT)
  writeFileSync(
    process.env.U2_FITTING_LONG_REPORT,
    JSON.stringify(evidence, null, 2) + "\n",
  );
console.log(JSON.stringify({ fittingLongEvidence: evidence }));
