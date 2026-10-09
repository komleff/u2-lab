import type { RunResultV2 } from "../../runner/run";
import { finite, nonnegative } from "../../signatures/domain";
import { curveValue, frameIrCurves } from "../../signatures/history";
import { observerPreset, type ObserverPresetId, type PassiveChannel } from "../../signatures/presets";
import { radarAnchor, type RadarSize } from "../../signatures/radar";
import { statisticsView } from "../../signatures/statistics";

// Только GD display: actual acquisition, fixed range и сохранённый payload
// используют прежние owners. Не возводим мощность/дальность в большие степени.
export function passiveDetectionReachM(powerW: number | null, presetId: ObserverPresetId, channel: PassiveChannel): number | null {
  const preset = observerPreset(presetId);
  if (channel !== "IR" && channel !== "EM") throw new TypeError("unsupported passive channel");
  if (powerW === null) return null;
  const threshold = (channel === "IR" ? preset.ir : preset.em).detectWm2;
  return finite(Math.sqrt(nonnegative(powerW, "source power W")) / (Math.sqrt(4 * Math.PI) * Math.sqrt(threshold)), "nominal passive reach M");
}
export function nominalRadarReachM(crossSectionM2: number | null, size: RadarSize): number | null {
  const anchor = radarAnchor(size);
  if (crossSectionM2 === null) return null;
  return finite(Math.sqrt(Math.sqrt(nonnegative(crossSectionM2, "CS M2")))
    * Math.sqrt(Math.sqrt(anchor.rfJ * anchor.apertureM2 / anchor.thresholdJ)) / Math.sqrt(4 * Math.PI), "nominal radar reach M");
}
export function distance(valueM: number | null): string {
  if (valueM === null) return "нет измерения";
  nonnegative(valueM, "display distance M");
  const unit = valueM >= 1000 ? "км" : "м", value = unit === "км" ? valueM / 1000 : valueM;
  const text = value !== 0 && (Number(value.toFixed(2)) === 0 || value >= 1e9)
    ? value.toExponential(2).replace(/\.?(0+)(?=e)/, "")
    : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  return `${text} ${unit}`;
}
export function signatureCurrentPowers(r?: RunResultV2) {
  const state = r?.signatures, settings = r?.spec.signatures, frame = state?.lastTruth;
  if (!frame || !settings) return { IR: null, EM: null, radar: null };
  const contrast = curveValue(frameIrCurves(frame, settings.aspectDeg).contrast, 1);
  return { IR: settings.advancedIr ? Math.abs(contrast) : Math.max(contrast, 0),
    EM: frame.em.observedEmW, radar: state!.sourceStats.CS.total.liveValue };
}
export function signatureReach(r: RunResultV2 | undefined, channel: PassiveChannel | "radar") {
  const empty = { currentM: null, minM: null, meanPowerM: null, maxM: null };
  const state = r?.signatures, settings = r?.spec.signatures;
  if (!state || !settings) return empty;
  const current = signatureCurrentPowers(r)[channel];
  const reach = (value: number | null) => channel === "radar"
    ? nominalRadarReachM(value, observerPreset(settings.observerPreset).size)
    // IRobserver уже хранит max/abs полной кривой. На представленном корне
    // её min может округлиться ниже0; для derived reach возвращаем только
    // этот неотрицательный domain, не abs(mean signed) и не новую epsilon.
    // finite идёт до max: -Infinity/NaN не превращаются в измеренный0.
    : passiveDetectionReachM(channel === "IR" && value !== null
      ? Math.max(finite(value, "IR sensor-equivalent power W"), 0) : value, settings.observerPreset, channel);
  const stats = statisticsView(state.sourceStats[channel === "IR" ? "IRobserver" : channel === "EM" ? "EM" : "CS"]);
  return { currentM: reach(current), minM: stats.status === "absent" ? null : reach(stats.min),
    meanPowerM: stats.status === "absent" ? null : reach(stats.mean), maxM: stats.status === "absent" ? null : reach(stats.max) };
}
