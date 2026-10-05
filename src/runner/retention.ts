import type { LabEvent, TickTelemetry } from "../model/types";
export type Bucket = {
  startSeconds: number;
  endSeconds: number;
  count: number;
  sum: Float64Array;
  min: Float64Array;
  max: Float64Array;
};
// Включает объект bucket, три typed-array wrapper и ссылки массива;
// numeric backing stores считаются отдельно. Запас подтверждён actual heap/GC fixture.
const BUCKET_OVERHEAD_BYTES = 1024;
export class Retention {
  buckets: Bucket[] = [];
  cadenceSeconds = 1;
  totalTicks = 0;
  readonly maxBuckets: number;
  channels: string[];
  constructor(channels: string[], maxBuckets = 50000) {
    this.channels = [...channels];
    this.maxBuckets = Math.max(
      2,
      Math.min(
        maxBuckets,
        Math.floor((128 * 1024 * 1024) / (channels.length * 24 + BUCKET_OVERHEAD_BYTES)),
      ),
    );
  }
  add(timeSeconds: number, values: TickTelemetry) {
    this.totalTicks++;
    const start =
      Math.floor((timeSeconds - 1e-9) / this.cadenceSeconds) *
      this.cadenceSeconds;
    let b = this.buckets.at(-1);
    if (!b || start >= b.startSeconds + this.cadenceSeconds - 1e-9) {
      if (this.buckets.length >= this.maxBuckets) this.merge();
      const s =
        Math.floor((timeSeconds - 1e-9) / this.cadenceSeconds) *
        this.cadenceSeconds;
      b = {
        startSeconds: s,
        endSeconds: timeSeconds,
        count: 0,
        sum: new Float64Array(this.channels.length),
        min: new Float64Array(this.channels.length).fill(Infinity),
        max: new Float64Array(this.channels.length).fill(-Infinity),
      };
      this.buckets.push(b);
    }
    b.endSeconds = timeSeconds;
    b.count++;
    for (let i = 0; i < this.channels.length; i++) {
      const v = values[this.channels[i]] ?? 0;
      b.sum[i] += v;
      b.min[i] = Math.min(b.min[i], v);
      b.max[i] = Math.max(b.max[i], v);
    }
  }
  private merge() {
    const merged: Bucket[] = [];
    for (let i = 0; i < this.buckets.length; i += 2) {
      const a = this.buckets[i],
        b = this.buckets[i + 1];
      if (b) {
        a.endSeconds = b.endSeconds;
        a.count += b.count;
        for (let j = 0; j < this.channels.length; j++) {
          a.sum[j] += b.sum[j];
          a.min[j] = Math.min(a.min[j], b.min[j]);
          a.max[j] = Math.max(a.max[j], b.max[j]);
        }
      }
      merged.push(a);
    }
    this.buckets = merged;
    this.cadenceSeconds *= 2;
  }
  get bytes() {
    return this.buckets.length * (this.channels.length * 24 + BUCKET_OVERHEAD_BYTES);
  }
  metadata() {
    return {
      policy: "mean/min/max/count; deterministic adjacent merge",
      originalCadenceSeconds: 1,
      cadenceSeconds: this.cadenceSeconds,
      totalTicks: this.totalTicks,
      buckets: this.buckets.length,
      maxBuckets: this.maxBuckets,
      estimatedBytes: this.bytes,
      maxBytes: 128 * 1024 * 1024,
    };
  }
}
export class EventRetention {
  private first: LabEvent[] = [];
  private tail: LabEvent[] = [];
  private cursor = 0;
  total = 0;
  add(e: LabEvent) {
    this.total++;
    if (this.first.length < 128) this.first.push(e);
    else if (this.tail.length < 19872) this.tail.push(e);
    else {
      this.tail[this.cursor] = e;
      this.cursor = (this.cursor + 1) % 19872;
    }
  }
  items() {
    return [
      ...this.first,
      ...this.tail.slice(this.cursor),
      ...this.tail.slice(0, this.cursor),
    ];
  }
  get dropped() {
    return Math.max(0, this.total - 20000);
  }
}
