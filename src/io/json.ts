import type { RunSpec } from "../model/types";
import { validateRunSpec, type ValidationResult } from "../catalog/schema";
import type { RunResult } from "../runner/run";
export function parseRunJson(text: string): ValidationResult<RunSpec> {
  try {
    return validateRunSpec(JSON.parse(text));
  } catch (e) {
    return {
      ok: false,
      errors: [{ path: "$", code: "JSON_PARSE", message: String(e) }],
    };
  }
}
export function serializeRun(spec: RunSpec): string {
  return JSON.stringify(spec, null, 2);
}
const escape = (value: unknown) => {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
function unit(channel: string) {
  if (channel === "temperatureK") return "K";
  if (channel === "timeSeconds") return "s";
  if (channel.includes("fuelKg")) return "kg";
  if (channel.endsWith("J") || channel.startsWith("bufferJ")) return "J";
  if (channel.endsWith("W")) return "W";
  if (channel === "thrustN") return "N";
  if (channel === "workRate") return "work_s-1";
  return "1";
}
export function exportTelemetryCsv(r: RunResult) {
  const header = [
    "bucket_start_s",
    "bucket_end_s",
    "tick_count",
    ...r.channels.flatMap((c) =>
      ["mean", "min", "max"].map((k) => `${c}_${k}_${unit(c)}`),
    ),
  ];
  return (
    `# schema=u2-lab-trace/1\n# model=${r.spec.modelVersion}\n# physics_dt_s=${r.spec.stepSeconds}\n# retention=${JSON.stringify(r.retention)}\n` +
    [
      header.join(","),
      ...r.buckets.map((b) =>
        [
          b.startSeconds,
          b.endSeconds,
          b.count,
          ...r.channels.flatMap((_, i) => [
            b.sum[i] / b.count,
            b.min[i],
            b.max[i],
          ]),
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n")
  );
}
export function exportEventsCsv(r: RunResult) {
  return (
    `# retention=${JSON.stringify({ first: 128, last: 19872, totalEvents: r.retention.totalEvents, droppedEvents: r.retention.droppedEvents })}\n` +
    [
      "time_s,kind,message",
      ...r.events.map((e) =>
        [e.timeSeconds, e.kind, e.message].map(escape).join(","),
      ),
    ].join("\n")
  );
}
