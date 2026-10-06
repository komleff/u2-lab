import type { RunResultV2 } from "../../runner/run";
import { esc, num } from "./presentation";
import { channelNames, channelUnit } from "./telemetry";
const semanticColors: Record<string, string> = {
  requestedW: "#FFAA33", deliveredW: "#2EC4D9", generatorW: "#4DA6FF",
  temperatureK: "#EC8B66", soc: "#E5C23A", chargeJ: "#E5C23A",
  "fuelKg:diesel": "#A3906F", "fuelKg:hydrogen": "#4DA6FF",
  usefulWork: "#5F9E4E", cargoM3: "#FFAA33", workRate: "#2EC4D9",
};
export function channelStyle(id: string) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const palette = ["#2EC4D9", "#A3906F", "#FFAA33", "#E5C23A", "#5F9E4E", "#4DA6FF", "#EC8B66"];
  return { color: semanticColors[id] ?? palette[hash % palette.length], dashed: /Requested|requested/.test(id) };
}
export function traceChart(r: RunResultV2, ids: string[], time?: number, limits: { value: number; label: string }[] = [], meanAsPath = false) {
  const present = ids.filter(id => r.channels.includes(id));
  let low = 0, high = 1;
  for (const b of r.buckets) for (const id of present) {
    const i = r.channels.indexOf(id);
    for (const value of [b.min[i], b.max[i]]) if (Number.isFinite(value)) {
      low = Math.min(low, value); high = Math.max(high, value);
    }
  }
  for (const l of limits) { low = Math.min(low, l.value); high = Math.max(high, l.value); }
  const start = r.buckets[0]?.startSeconds ?? 0, end = r.buckets.at(-1)?.endSeconds ?? 1;
  const x = (t: number) => 40 + (t - start) / Math.max(1e-12, end - start) * 620;
  const y = (v: number) => 170 - (v - low) / (high - low) * 150;
  const unit = present.length ? channelUnit(present[0]) : "W";
  return `<svg viewBox="0 0 700 205" role="img" aria-label="Измеренные каналы: ${esc(unit)}"><path d="M40 20V170H660M40 95H660" stroke="#3a3226" fill="none"/><text x="40" y="195">${num(start, "с")}</text><text x="660" y="195" text-anchor="end">${num(end, "с")}</text><text x="42" y="16">${num(high, unit)}</text>${present.map(id => {
    const i = r.channels.indexOf(id), style = channelStyle(id);
    const points = r.buckets.map(b => `${x(b.endSeconds)},${y(b.sum[i] / b.count)}`).join(" ");
    return `<g stroke="${style.color}" data-channel="${esc(id)}" fill="none">${r.buckets.map(b => `<path opacity=".3" d="M${x(b.endSeconds)} ${y(b.min[i])}V${y(b.max[i])}"/>`).join("")}${meanAsPath ? `<path stroke-width="2" ${style.dashed ? 'stroke-dasharray="6 4"' : ""} d="${points.split(" ").map((p, n) => (n ? "L" : "M") + p).join(" ")}"/>` : `<polyline stroke-width="2" ${style.dashed ? 'stroke-dasharray="6 4"' : ""} points="${points}"/>`}</g>`;
  }).join("")}${limits.map(l => `<path d="M40 ${y(l.value)}H660" stroke="#D2B47C" stroke-dasharray="3 5"/><text x="80" y="${Math.max(25, y(l.value) - 3)}">${esc(l.label)} ${num(l.value, "K")}</text>`).join("")}${time !== undefined ? `<path d="M${x(time)} 20V170" stroke="#E8DCC6" data-time="${time}"/>` : ""}</svg>`;
}
export function overview(r: RunResultV2, time?: number) {
  let work = Infinity, critical = Infinity;
  for (const i of r.spec.resolvedShip.instances) {
    work = Math.min(work, i.item.gate.workHigh);
    critical = Math.min(critical, i.item.gate.high);
  }
  const limits = [{ value: work, label: "min workHigh" }, { value: critical, label: "min critical" }].filter(l => Number.isFinite(l.value));
  const panels = [
    { label: "Электричество · запрос / выдача / источник", ids: ["requestedW", "deliveredW", "generatorW"] },
    { label: "Температура · минимальные пороги установленных модулей", ids: ["temperatureK"], limits },
    { label: "Запасы · доля заряда", ids: ["soc"] },
    { label: "Запасы · топливо, кг", ids: ["fuelKg:diesel", "fuelKg:hydrogen"] },
    { label: "Добыча · темп SCU/с", ids: ["miningRateM3S"] },
    { label: "Добыча и груз на борту · SCU", ids: ["usefulWork", "cargoM3"] },
  ];
  return `<div class="overview-charts">${panels.map(p => `<figure><h3>${p.label}</h3>${traceChart(r, p.ids, time, p.limits, true)}<figcaption>${p.ids.filter(id => r.channels.includes(id)).map(id => `<span style="color:${channelStyle(id).color}">${esc(channelNames[id] ?? id)}${channelStyle(id).dashed ? " · пунктир" : ""}</span>`).join(" · ")}</figcaption></figure>`).join("")}</div>`;
}
