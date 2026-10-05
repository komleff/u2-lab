import type { RunResultV2 } from "../../runner/run";
import {
  channelRows,
  channelGroup,
  channelNames,
  channelUnit,
} from "./telemetry";
import { esc, num } from "./presentation";
export type ChannelState = {
  group: string;
  unit: string;
  hidden: Set<string>;
  eventIndex: number;
};
export function channelsView(r: RunResultV2 | undefined, s: ChannelState) {
  if (!r)
    return '<section class="ui-panel"><h2>Каналы и графики</h2><p>Измерения появятся после теста.</p></section>';
  const events = r.events,
    e = events[Math.min(s.eventIndex, Math.max(0, events.length - 1))],
    b = e
      ? (r.buckets.find((b) => b.endSeconds >= e.timeSeconds) ??
        r.buckets.at(-1))
      : r.buckets.at(-1);
  const rows = channelRows(r, b).filter((x) => channelGroup(x.id) === s.group);
  const units = [...new Set(rows.map((x) => x.unit))];
  if (!units.includes(s.unit)) s.unit = units[0] ?? "W";
  const curves = rows.filter((x) => x.unit === s.unit && !s.hidden.has(x.id));
  const indices = curves.map((x) => r.channels.indexOf(x.id));
  // Retained trace может превышать лимит аргументов JS; границы учитывают всё окно.
  let low = 0, high = 1;
  for (const b of r.buckets)
    for (const i of indices)
      for (const value of [b.min[i], b.max[i]])
        if (Number.isFinite(value)) {
          low = Math.min(low, value);
          high = Math.max(high, value);
        }
  const start = r.buckets[0]?.startSeconds ?? 0,
    end = r.buckets.at(-1)?.endSeconds ?? 1;
  const x = (t: number) =>
      40 + ((t - start) / Math.max(1e-12, end - start)) * 620,
    y = (v: number) => 170 - ((v - low) / (high - low)) * 150;
  const colors = [
    "#2EC4D9",
    "#a3906f",
    "#FFAA33",
    "#E5C23A",
    "#5F9E4E",
    "#4DA6FF",
  ];
  const graph = `<svg viewBox="0 0 700 205" role="img" aria-label="Измеренные каналы: ${esc(s.unit)}"><path d="M40 20V170H660M40 95H660" stroke="#3a3226" fill="none"/><text x="40" y="195">${num(start, "с")}</text><text x="570" y="195">${num(end, "с")}</text><text x="42" y="16">${num(high, s.unit)}</text>${curves
    .map((row, j) => {
      const i = r.channels.indexOf(row.id);
      return `<g stroke="${colors[j % colors.length]}" fill="none">${r.buckets.map((b) => `<path opacity=".3" d="M${x(b.endSeconds)} ${y(b.min[i])}V${y(b.max[i])}"/>`).join("")}<polyline stroke-width="2" ${/Requested|requested/.test(row.id) ? 'stroke-dasharray="6 4"' : ""} points="${r.buckets.map((b) => `${x(b.endSeconds)},${y(b.sum[i] / b.count)}`).join(" ")}"/></g>`;
    })
    .join(
      "",
    )}${e ? `<path d="M${x(e.timeSeconds)} 20V170" stroke="#4DA6FF"/>` : ""}</svg>`;
  return `<section class="ui-panel" id="lab-channels"><h2>Каналы и графики</h2><div class="segments" role="group" aria-label="Группа каналов">${[
    ["energy", "Энергия"],
    ["heat", "Тепло"],
    ["stocks", "Запасы"],
    ["work", "Работа"],
  ]
    .map(
      ([id, label]) =>
        `<button data-channel-group="${id}" aria-pressed="${s.group === id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><label>Ось и единицы<select id="channel-unit">${units.map((u) => `<option ${s.unit === u ? "selected" : ""}>${u}</option>`).join("")}</select></label><div class="channel-legend" role="group" aria-label="Кривые">${rows
    .filter((x) => x.unit === s.unit)
    .map(
      (row, j) =>
        `<button data-curve="${esc(row.id)}" aria-pressed="${!s.hidden.has(row.id)}"><i style="border-top:2px ${/Requested|requested/.test(row.id) ? "dashed" : "solid"} ${colors[j % colors.length]}"></i>${esc(channelNames[row.id] ?? row.id)}</button>`,
    )
    .join(
      "",
    )}</div><figure>${graph}<figcaption>Среднее, min/max видимого окна ${num(start)}–${num(end, "с")}; ${curves.length} кривых. Запрос — пунктир, выдача — сплошная. Результаты выше относятся ко всему измеренному интервалу.</figcaption></figure><div class="event-selector"><button id="channel-prev" aria-label="Предыдущее событие" ${!events.length || s.eventIndex <= 0 ? "disabled" : ""}>◀</button><span>${e ? `${num(e.timeSeconds, "с")} · ${esc(e.message)}` : "Событий нет"}</span><button id="channel-next" aria-label="Следующее событие" ${!events.length || s.eventIndex >= events.length - 1 ? "disabled" : ""}>▶</button></div><p>Выбранный bucket ${num(b?.startSeconds)}–${num(b?.endSeconds, "с")} · mean/min/max/count, не мгновенное значение.</p><div class="ui-table-scroll" tabindex="0" aria-label="Измерения выбранного bucket"><table><thead><tr><th>Канал</th><th>Единица</th><th>mean</th><th>min</th><th>max</th><th>count</th></tr></thead><tbody>${rows.map((x) => `<tr><th>${esc(channelNames[x.id] ?? x.id)}</th><td>${x.unit}</td><td>${num(x.mean)}</td><td>${num(x.min)}</td><td>${num(x.max)}</td><td>${x.count}</td></tr>`).join("")}</tbody></table></div><p class="muted">Видимо ${r.buckets.length} buckets, сохранено ${r.retention.buckets} / ${r.retention.maxBuckets}; cadence ${r.retention.cadenceSeconds} с · ${num(r.retention.estimatedBytes / 1048576, "MiB")}. Во время расчёта передаётся окно последних 250 buckets и 100 событий.</p></section>`;
}
