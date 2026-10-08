import type { RunResultV2 } from "../../runner/run";
import { esc, num } from "./presentation";
import { channelNames, channelUnit } from "./telemetry";
import { gatedOperations } from '../../runner/diagnostics';
import { displaySeries, displayPaths } from "./display-series";
import { PLOT, plotX } from "./plot-geometry";
import { signatureOverview } from "./signatures";
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
type Boundary={value:number;label:string;id?:string;color?:string;instance?:string};
export function traceChart(r: RunResultV2, ids: string[], time?: number, limits: Boundary[] = [], meanAsPath = false, bands:{side:string;from:number;to:number;color:string}[] = [], selectedUnit?: string) {
  const present = ids.filter(id => r.channels.includes(id));
  let low = 0, high = 1;
  for (const b of r.buckets) for (const id of present) {
    const i = r.channels.indexOf(id);
    for (const value of [b.min[i], b.max[i]]) if (Number.isFinite(value)) {
      low = Math.min(low, value); high = Math.max(high, value);
    }
  }
  for (const l of limits) { low = Math.min(low, l.value); high = Math.max(high, l.value); }
  const unit = selectedUnit ?? channelUnit(present[0]??ids[0]??'requestedW');
  const axisX=PLOT.left,plotWidth=PLOT.width;
  const start = 0, end = r.spec.durationSeconds;
  const x = (t: number) => plotX(t, end);
  const y = (v: number) => 170 - (v - low) / (high - low) * 150;
  // В SVG размеры шрифта — user units: читаемые 28 дают glyph box около 36, а не 18.
  const labels=[...limits].filter(l=>l.label).sort((a,b)=>b.value-a.value),labelPositions=new Map<Boundary,number>();let nextY=35;
  for(const l of labels){const yy=Math.max(nextY,y(l.value)-3);labelPositions.set(l,yy);nextY=yy+40;}
  // Обратный проход удерживает все четыре подписи внутри графика, выше оси времени.
  let lastY=158;for(const l of [...labels].reverse()){const yy=Math.min(lastY,labelPositions.get(l)!);labelPositions.set(l,yy);lastY=yy-40;}
  // Верхняя отметка имеет тот же безопасный отступ и без порогов, включая пустой replay.
  const highLabel=unit==="K" ? (labels.length ? "" : `<text data-k-axis-label="scale" x="154" y="35" text-anchor="end">${num(high,unit)}</text>`) : `<text x="660" y="35" text-anchor="end">${num(high,unit)}</text>`;
  return `<svg data-axis-x="${axisX}" viewBox="0 0 700 205" role="img" aria-label="Измеренные каналы: ${esc(unit)}">${bands.filter(b=>b.to>=b.from).map(b=>`<rect data-thermal-band="${b.side}" x="${axisX}" y="${y(b.to)}" width="${plotWidth}" height="${y(b.from)-y(b.to)}" fill="${b.color}" opacity=".14"/>`).join('')}<path d="M${axisX} 20V170H660M${axisX} 95H660" stroke="#3a3226" fill="none"/><text x="${axisX}" y="195">${num(start, "с")}</text><text x="660" y="195" text-anchor="end">${num(end, "с")}</text>${highLabel}${present.map(id => {
    const i = r.channels.indexOf(id), style = channelStyle(id);
    const rows = displaySeries(r.buckets.map(b => ({startS:b.startSeconds,endS:b.endSeconds,
      mean:b.sum[i]/b.count,min:b.min[i],max:b.max[i],weight:b.count})),plotWidth);
    const {points,envelope} = displayPaths(rows,x,y);
    return `<g stroke="${style.color}" data-channel="${esc(id)}" fill="none"><path data-envelope opacity=".18" stroke="none" fill="${style.color}" d="${envelope}"/>${meanAsPath ? `<path stroke-width="2" ${style.dashed ? 'stroke-dasharray="6 4"' : ""} d="${points.split(" ").filter(Boolean).map((p, n) => (n ? "L" : "M") + p).join(" ")}"/>` : `<polyline stroke-width="2" ${style.dashed ? 'stroke-dasharray="6 4"' : ""} points="${points}"/>`}</g>`;
  }).join("")}${limits.map(l => `<path data-boundary="${esc(l.id??'')}" data-value="${l.value}" ${l.instance?'data-instance="'+esc(l.instance)+'" opacity=".5"':''} d="M${axisX} ${y(l.value)}H660" stroke="${l.color??'#D2B47C'}" stroke-dasharray="3 5"/>${l.label?`<path data-boundary-leader="${esc(l.id??'')}" d="M158 ${labelPositions.get(l)!-10}L${axisX} ${y(l.value)}" stroke="${l.color??'#D2B47C'}" fill="none"/><text data-k-axis-label="boundary" data-boundary-label="${esc(l.id??'')}" aria-label="${esc(l.label)} ${num(l.value,'K')}" fill="${l.color??'#D2B47C'}" text-anchor="end" x="154" y="${labelPositions.get(l)}" style="font-size:28px">${num(l.value, "K")}</text>`:''}`).join("")}${time !== undefined ? `<path d="M${x(time)} 20V170" stroke="#E8DCC6" data-time="${time}"/>` : ""}</svg>`;
}
export function thermalFrontiers(r:RunResultV2) {
 const ops=gatedOperations(r.spec),gates=ops.map(i=>i.item.gate),cold='#6AAEE8',hot='#E58B87';
 const criticalLow=Math.max(...gates.map(g=>g.low)),workLow=Math.max(...gates.flatMap(g=>g.workLow===undefined?[]:[g.workLow])),workHigh=Math.min(...gates.map(g=>g.workHigh)),criticalHigh=Math.min(...gates.map(g=>g.high));
 const limits:Boundary[]=[{id:'critical-low',label:'Холод: отключение',value:criticalLow,color:cold},{id:'work-low',label:'Холод: рабочая от',value:workLow,color:cold},{id:'work-high',label:'Жар: рабочая до',value:workHigh,color:hot},{id:'critical-high',label:'Жар: отключение',value:criticalHigh,color:hot}].filter(l=>Number.isFinite(l.value));
 const disjoint=ops.length>0&&(workLow>workHigh||criticalLow>=criticalHigh);
 const bands=disjoint?[]:[{side:'cold',from:criticalLow,to:workLow,color:cold},{side:'hot',from:workHigh,to:criticalHigh,color:hot}].filter(b=>Number.isFinite(b.from)&&Number.isFinite(b.to));
 const note=!ops.length?'Нет включённых операций с температурными порогами':disjoint?'Нет общего рабочего температурного диапазона; индивидуальные границы ниже':'Сводные границы чувствительных включённых операций: max нижних / min верхних; защита каждого модуля индивидуальна';
 const markers:Boundary[]=disjoint?ops.flatMap(i=>[{value:i.item.gate.low,color:cold},{value:i.item.gate.workLow!,color:cold},{value:i.item.gate.workHigh,color:hot},{value:i.item.gate.high,color:hot}].filter(l=>Number.isFinite(l.value)).map(l=>({...l,label:'',id:'individual',instance:i.id}))):[];
 return {limits:[...limits,...markers],bands,note,individual:disjoint?ops.map(i=>`${i.item.label} [${i.id}]: ${i.item.gate.low} / ${i.item.gate.workLow??'не записано'} / ${i.item.gate.workHigh} / ${i.item.gate.high} K`).join(' · '):''};
}
export function overview(r: RunResultV2, time?: number) {
  const thermal=thermalFrontiers(r),limits=thermal.limits;
  const panels = [
    { label: "Электричество · запрос / выдача / источник", ids: ["requestedW", "deliveredW", "generatorW"] },
    { label: "Температура · холодная и горячая зоны", ids: ["temperatureK"], limits,thermal:true },
    { label: "Запасы · доля заряда", ids: ["soc"] },
    { label: "Запасы · топливо, кг", ids: ["fuelKg:diesel", "fuelKg:hydrogen"] },
    { label: "Добыча · темп SCU/с", ids: ["miningRateM3S"] },
    { label: "Добыча и груз на борту · SCU", ids: ["usefulWork", "cargoM3"] },
  ];
  return `<div class="overview-charts">${panels.map((p,i) => `<figure><h3>${p.label}</h3>${traceChart(r, p.ids, time, p.limits, true,p.thermal?thermal.bands:[])}<figcaption>${p.ids.filter(id => r.channels.includes(id)).map(id => `<span style="color:${channelStyle(id).color}">${esc(channelNames[id] ?? id)}${channelStyle(id).dashed ? " · пунктир" : ""}</span>`).join(" · ")}${p.thermal?' · '+esc(thermal.note)+' '+esc(thermal.individual):''}</figcaption></figure>${i===1?signatureOverview(r,time):''}`).join("")}</div>`;
}
