import { it, expect } from "vitest";
import { presets } from "../src/catalog/presets";
import { createRun, runChunk, result } from "../src/runner/run";
import { Retention, EventRetention } from "../src/runner/retention";
import { WorkerController } from "../src/runner/protocol";
it("chunked replay equals single runner and repeated sorties keep fuel, service unloads only", () => {
  const p = structuredClone(presets[0]);
  p.durationSeconds = 80;
  p.scenario.phases = [
    { id: "work", action: "work", durationSeconds: 10, duty: 1 },
    {
      id: "unload",
      action: "service",
      durationSeconds: 10,
      duty: 0,
      service: { unload: true, charge: false, refuel: false },
    },
  ];
  const a = createRun("a", p),
    b = createRun("b", p);
  while (!a.done) runChunk(a, 100000);
  while (!b.done) runChunk(b, 7);
  expect(a.state).toEqual(b.state);
  expect(a.metrics).toEqual(b.metrics);
  expect(a.state.fuelKg.diesel).toBeLessThan(p.initial.fuelKg.diesel);
  expect(a.state.usefulWork).toBeGreaterThan(a.state.cargo);
});
it("retained buckets preserve all mean/min/max/count and explicitly bounded events", () => {
  const r = new Retention(["a"], 4);
  for (let i = 0; i < 20; i++) r.add(i + 0.1, { a: i });
  expect(r.buckets.length).toBeLessThanOrEqual(4);
  expect(r.buckets.reduce((s, b) => s + b.count, 0)).toBe(20);
  expect(Math.min(...r.buckets.map((b) => b.min[0]))).toBe(0);
  expect(Math.max(...r.buckets.map((b) => b.max[0]))).toBe(19);
  const e = new EventRetention();
  for (let i = 0; i < 21000; i++)
    e.add({ timeSeconds: i, kind: "test", message: "event" });
  expect(e.items().length).toBe(20000);
  expect(e.dropped).toBe(1000);
  expect(e.items()[127].timeSeconds).toBe(127);
  expect(e.items()[128].timeSeconds).toBe(1128);
});
it("matching telemetry ACK queue stays one and controls work while ACK missing", () => {
  const out: any[] = [];
  const c = new WorkerController((m) => out.push(m));
  const p = structuredClone(presets[0]);
  p.durationSeconds = 10;
  c.handle({ runId: "r", commandId: 1, type: "start", payload: { spec: p } });
  c.pump();
  expect(c.pendingChunks).toBe(1);
  c.handle({ runId: "r", type: "telemetry-ack", chunkId: 999 });
  c.pump();
  expect(out.filter((x) => x.type === "chunk")).toHaveLength(1);
  c.handle({ runId: "r", commandId: 2, type: "pause" });
  expect(out.at(-1)).toMatchObject({
    runId: "r",
    commandId: 2,
    control: "pause",
    type: "control-ack",
  });
  c.handle({ runId: "r", commandId: 3, type: "cancel" });
  c.handle({ runId: "r", type: "telemetry-ack", chunkId: 1 });
  c.pump();
  expect(out.filter((x) => x.type === "chunk")).toHaveLength(1);
});
it("old run ACK cannot release new slot; reset replaces state", () => {
  const out: any[] = [];
  const c = new WorkerController((m) => out.push(m));
  c.handle({
    runId: "a",
    commandId: 1,
    type: "start",
    payload: { spec: presets[0] },
  });
  c.pump();
  c.handle({
    runId: "b",
    commandId: 2,
    type: "start",
    payload: { spec: presets[1] },
  });
  c.pump();
  c.handle({ runId: "a", type: "telemetry-ack", chunkId: 1 });
  expect(c.pendingChunks).toBe(1);
  expect(c.context?.spec.ship.size).toBe("M");
});
it("cargo full advances immediately to return and unload with actual full-sortie time", () => {
  const p = structuredClone(presets[0]);
  p.ship.cargoCapacity = 0.01;
  p.durationSeconds = 30;
  const r = createRun("sortie", p);
  while (!r.done) runChunk(r, 1000);
  expect(r.metrics.firstSortieSeconds).not.toBeNull();
  expect(r.metrics.firstSortieSeconds!).toBeLessThan(25);
  expect(r.events.items().some((e) => e.kind === "cargo-full")).toBe(true);
});
