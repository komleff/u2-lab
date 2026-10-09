import type { RunResultV2 } from "../../runner/run";
import { statisticsView } from "../../signatures/statistics";
import { distance, signatureReach } from "./signature-distance";
import { esc, num } from "./presentation";

function values(r: RunResultV2 | undefined, channel: "IR" | "EM") {
  const stats = r?.signatures ? statisticsView(r.signatures.sourceStats[channel === "IR" ? "IRobserver" : "EM"]) : undefined;
  const reach = signatureReach(r, channel);
  return [stats?.status === "measured" ? stats.mean : null, stats?.status === "measured" ? stats.max : null, reach.meanPowerM, reach.maxM];
}
function reachValue(value: number | null) {
  return value === null ? "—" : `${value < 0 ? "−" : ""}${distance(Math.abs(value))}`;
}
function context(r: RunResultV2 | undefined) {
  const s = r?.spec.signatures;
  return !r ? "нет результата" : !s ? "стенд сигнатур отсутствует" : `${esc(s.observerPreset)} · ракурс ${num(s.aspectDeg, "°")} · ${s.advancedIr ? "расширенный IR · модуль контраста" : "обычный IR · положительный контраст"} · фон ${num(r.spec.environment.effectiveBackgroundK, "K")} · интервал 0–${num(r.metrics.durationSeconds, "с")} из ${num(r.spec.durationSeconds, "с")} · ${r.status === "complete" ? "завершён" : "частичный"}`;
}
function contextInputs(r: RunResultV2 | undefined) {
  const s = r?.spec.signatures;
  return [s?.observerPreset, s?.aspectDeg, s?.advancedIr, r?.spec.environment.effectiveBackgroundK, r?.metrics.durationSeconds, r?.spec.durationSeconds];
}
export function signatureComparison(a: RunResultV2 | undefined, b: RunResultV2 | undefined) {
  const differs = a && b && JSON.stringify(contextInputs(a)) !== JSON.stringify(contextInputs(b));
  const labels = ["Средняя мощность", "Максимальная мощность", "Дальность по средней мощности", "Максимальная дальность"];
  return `<details id="signature-comparison"><summary>Сигнатуры и расчётные дальности A/B</summary><div class="signature-contexts"><p>A: ${context(a)}</p><p>B: ${context(b)}</p></div>${differs ? '<p class="warning">Контекст A/B отличается: прибор, ракурс, IR, фон или измеренный интервал. Δ не означает одинаковые условия.</p>' : ""}<p class="muted">IR — IRobserver выбранного ракурса, EM — полный изотропный сигнал. Дальность по средней мощности — не средняя дальность по времени. Расчётная дальность в чистом пространстве — не полученный контакт и не боевой рейтинг.</p>${(["IR", "EM"] as const).map(channel => {
    const aa = values(a, channel), bb = values(b, channel);
    return `<section data-signature-comparison="${channel}"><h3>${channel === "IR" ? "IR · выбранный ракурс" : "EM"}</h3><dl class="signature-comparison-rows">${labels.map((label, i) => {
      const format = (value: number | null) => i < 2 ? num(value, "Вт") : reachValue(value);
      const delta = aa[i] !== null && bb[i] !== null ? bb[i]! - aa[i]! : null;
      return `<div data-signature-metric="${i}"><dt>${label}</dt><dd><span>A <strong class="measurement-value">${format(aa[i])}</strong></span><span>B <strong class="measurement-value">${format(bb[i])}</strong></span><span>Δ B−A <strong class="measurement-value">${format(delta)}</strong></span></dd></div>`;
    }).join("")}</dl></section>`;
  }).join("")}<details class="signature-sources"><summary>Исходные статистики A/B · JSON</summary><pre>${esc(JSON.stringify({ A: a?.signatures?.sourceStats ?? null, B: b?.signatures?.sourceStats ?? null }, null, 2))}</pre></details></details>`;
}
