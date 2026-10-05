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
const { Retention } = await server.ssrLoadModule("/src/runner/retention.ts");
await server.close();
global.gc();
const before = process.memoryUsage();
const run = createRun("memory", worstRun(60));
while (!run.done) runChunk(run, 10000);
const names = run.retention.channels;
run.retention = new Retention(names);
for (let i = 0; i < 22000; i++)
  run.events.add({
    timeSeconds: i,
    kind: "memory-fixture",
    message: "Ограничение " + i,
  });
for (let i = 1; i <= run.retention.maxBuckets; i++)
  run.retention.add(i, run.last);
global.gc();
const atCapacity = process.memoryUsage();
const actualBytes =
  atCapacity.heapUsed -
  before.heapUsed +
  atCapacity.arrayBuffers -
  before.arrayBuffers;
assert.ok(
  actualBytes <= 128 * 1048576,
  "max adaptive buckets + 20000 events + complete context and bounded metric state",
);
assert.equal(run.events.items().length, 20000);
assert.ok(run.events.dropped > 0);
assert.ok(run.retention.maxBuckets < 50000);
assert.equal(run.retention.buckets.length, run.retention.maxBuckets);
for (const i of run.spec.resolvedShip.instances)
  assert.ok(names.includes("installedMassKg:" + i.id));
const row = {
  channels: names.length,
  buckets: run.retention.buckets.length,
  maxBuckets: run.retention.maxBuckets,
  actualBytes,
  estimatedTraceBytes: run.retention.bytes,
  eventCount: run.events.items().length,
  metricBytes: JSON.stringify(run.metrics).length,
  limitationCells: Object.values(run.state.limitations).reduce(
    (n, v) => n + Object.keys(v).length,
    0,
  ),
  measurement:
    "Actual GC at full adaptive bucket limit, 20000 events, retained max-roster context and online metrics. Trace filling is synthetic; physics12h is a separate check.",
};
if (process.env.U2_FITTING_MEMORY_REPORT)
  writeFileSync(
    process.env.U2_FITTING_MEMORY_REPORT,
    JSON.stringify(row, null, 2) + "\n",
  );
console.log(JSON.stringify({ fittingMemory: row }));
