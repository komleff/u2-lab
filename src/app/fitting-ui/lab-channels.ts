import type { RunResultV2 } from "../../runner/run";
import {
  channelRows,
  channelGroup,
  channelNames,
  channelUnit,
} from "./telemetry";
import { signatureLive } from "./signatures";
import { esc, num } from "./presentation";
import { channelStyle, traceChart, overview, thermalFrontiers } from "./trace-chart";
export type ChannelState = {
  group: string;
  unit: string;
  hidden: Set<string>;
  eventIndex: number;
  bucketIndex?: number;
  detailsOpen?: boolean;
};
export function selectedBucket(r: RunResultV2, s: ChannelState) {
  const e = r.events[Math.max(0, Math.min(s.eventIndex, r.events.length - 1))];
  return s.bucketIndex !== undefined
    ? r.buckets[Math.max(0, Math.min(s.bucketIndex, r.buckets.length - 1))]
    : e ? r.buckets.find(b => b.endSeconds >= e.timeSeconds) ?? r.buckets.at(-1)
    : r.buckets.at(-1);
}
export function channelsView(r: RunResultV2 | undefined, s: ChannelState, running = false) {
  if (!r&&running)return `<section class="ui-panel" id="lab-channels"><h2>Каналы и графики</h2>${signatureLive()}</section>`;
  if (!r)
    return '<section class="ui-panel"><h2>Каналы и графики</h2><p>Измерения появятся после теста.</p></section>';
  const events = r.events, e = events[Math.min(s.eventIndex, Math.max(0, events.length - 1))], b = selectedBucket(r, s);
  const rows = channelRows(r, b).filter((x) => channelGroup(x.id) === s.group);
  const units = [...new Set(rows.map((x) => x.unit))];
  if (!units.includes(s.unit)) s.unit = units[0] ?? "W";
  const curves = rows.filter((x) => x.unit === s.unit && !s.hidden.has(x.id));
  const start = r.buckets[0]?.startSeconds ?? 0, end = r.buckets.at(-1)?.endSeconds ?? 1;
  const selectedIndex = b ? r.buckets.indexOf(b) : 0;
  const thermal=s.unit==="K"?thermalFrontiers(r):undefined;
  const graph = s.detailsOpen === false ? "" : traceChart(r, curves.map(row => row.id), b?.endSeconds,thermal?.limits, false,thermal?.bands,s.unit);
  return `<section class="ui-panel" id="lab-channels"><h2>Каналы и графики</h2><label class="chart-time-picker">Выбранное время · bucket ${num(b?.startSeconds)}–${num(b?.endSeconds, "с")}<input id="chart-bucket" type="range" min="0" max="${Math.max(0, r.buckets.length - 1)}" step="1" value="${selectedIndex}" ${!r.buckets.length ? "disabled" : ""}></label><p>Выбор времени доступен мышью, touch и клавиатурой. Mean/min/max/count относятся к указанному интервалу, не к мгновенному состоянию.</p>${running?signatureLive(r):overview(r, b?.endSeconds)}<details id="channel-details"><summary>Полные каналы · исследовательские подробности</summary><div class="segments" role="group" aria-label="Группа каналов">${[
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
      (row) =>
        `<button data-curve="${esc(row.id)}" aria-pressed="${!s.hidden.has(row.id)}"><i style="border-top:2px ${/Requested|requested/.test(row.id) ? "dashed" : "solid"} ${channelStyle(row.id).color}"></i>${esc(channelNames[row.id] ?? row.id)}</button>`,
    )
    .join(
      "",
    )}</div><figure>${graph}<figcaption>Среднее, min/max видимого окна ${num(start)}–${num(end, "с")}; ${curves.length} кривых. Запрос — пунктир, выдача — сплошная. Результаты выше относятся ко всему измеренному интервалу.</figcaption></figure><div class="event-selector"><button id="channel-prev" aria-label="Предыдущее событие" ${!events.length || s.eventIndex <= 0 ? "disabled" : ""}>◀</button><span>${e ? `${num(e.timeSeconds, "с")} · ${esc(e.message)}` : "Событий нет"}</span><button id="channel-next" aria-label="Следующее событие" ${!events.length || s.eventIndex >= events.length - 1 ? "disabled" : ""}>▶</button></div><p>Выбранный bucket ${num(b?.startSeconds)}–${num(b?.endSeconds, "с")} · mean/min/max/count, не мгновенное значение.</p><div class="ui-table-scroll" tabindex="0" aria-label="Измерения выбранного bucket"><table><thead><tr><th>Канал</th><th>Единица</th><th>mean</th><th>min</th><th>max</th><th>count</th></tr></thead><tbody>${rows.map((x) => `<tr><th>${esc(channelNames[x.id] ?? x.id)}</th><td>${x.unit}</td><td>${num(x.mean)}</td><td>${num(x.min)}</td><td>${num(x.max)}</td><td>${x.count}</td></tr>`).join("")}</tbody></table></div></details><p class="muted">Видимо ${r.buckets.length} buckets, сохранено ${r.retention.buckets} / ${r.retention.maxBuckets}; cadence ${r.retention.cadenceSeconds} с · ${num(r.retention.estimatedBytes / 1048576, "MiB")}. Во время расчёта передаётся окно последних 250 buckets и 100 событий.</p></section>`;
}
