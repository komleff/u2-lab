import { MODEL_SIGNATURE_MISSION, type RunSpecV2 } from "../model/v2/types";
import { finite, flag, fraction, positive, strongestTransmission } from "./domain";
import { observerPreset, type ObserverPresetId } from "./presets";
import { normalizeBearing } from "./projection";
import { referenceCrossSection, type ReferenceGeometry } from "./em-cs";

export const SIGNATURE_DATA_REVISION = "lab-signatures-0.7-h2-0.4" as const;
export interface SignatureSettings {
  version: "signatures-observer-0.1";
  dataRevision: typeof SIGNATURE_DATA_REVISION;
  observerPreset: ObserverPresetId;
  rangeM: number;
  aspectDeg: number;
  geometry: ReferenceGeometry;
  radarEnabled: boolean;
  radarIntervalS: number;
  initialCap: "FULL" | "EMPTY";
  advancedIr: boolean;
  insulation: number[];
  shielding: number[];
  ram: number[];
}
export function defaultSignatureSettings(size: "S" | "M" = "S"): SignatureSettings {
  const scale = size === "M" ? 2 : 1;
  return { version: "signatures-observer-0.1", dataRevision: SIGNATURE_DATA_REVISION,
    observerPreset: "S-dedicated-G1", rangeM: 16000, aspectDeg: 0,
    geometry: { lengthM: 22 * scale, widthM: 16 * scale, heightM: 6 * scale },
    radarEnabled: false, radarIntervalS: 2, initialCap: "FULL", advancedIr: false,
    insulation: [], shielding: [], ram: [] };
}
export function exactFields(value: unknown, keys: readonly string[], name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(name + ": требуется объект");
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== keys.length || keys.some(k => !Object.hasOwn(row,k))) throw new TypeError(name + ": неизвестные или пропущенные поля");
  return row;
}
export function validateSignatureSettings(value: unknown): SignatureSettings {
  const x = exactFields(value, ["version","dataRevision","observerPreset","rangeM","aspectDeg","geometry","radarEnabled","radarIntervalS","initialCap","advancedIr","insulation","shielding","ram"], "signatures") as unknown as SignatureSettings;
  if (x.version !== "signatures-observer-0.1" || x.dataRevision !== SIGNATURE_DATA_REVISION) throw new TypeError("Неизвестная версия сигнатур");
  observerPreset(x.observerPreset); positive(x.rangeM,"rangeM");
  const aspectDeg = normalizeBearing(finite(x.aspectDeg,"aspectDeg"));
  exactFields(x.geometry, ["lengthM","widthM","heightM"], "geometry");
  referenceCrossSection(x.geometry, aspectDeg, []);
  flag(x.radarEnabled,"radarEnabled"); flag(x.advancedIr,"advancedIr");
  if (finite(x.radarIntervalS,"radarIntervalS") < 2) throw new RangeError("Интервал ping должен быть ≥2 с");
  if (x.initialCap !== "FULL" && x.initialCap !== "EMPTY") throw new TypeError("Нужно явное начальное состояние capacitor");
  for (const values of [x.insulation,x.shielding,x.ram]) { if (!Array.isArray(values)) throw new TypeError("Нужны controls"); values.forEach(v=>fraction(v,"transmission")); strongestTransmission(values); }
  return { ...structuredClone(x), aspectDeg };
}
export function signatureSpec(spec: RunSpecV2, settings = defaultSignatureSettings(spec.resolvedShip.hull.size === "S" ? "S" : "M")): RunSpecV2 {
  if (!spec.mission) throw new TypeError("Стенд требует физический рейс");
  const origins=structuredClone(spec.origins);
  for(const [field,unit] of [["rangeM","m"],["aspectDeg","deg"],["geometry.lengthM","m"],["geometry.widthM","m"],["geometry.heightM","m"],["radarIntervalS","s"]])origins["signatures."+field]={kind:"experimental",sourceRef:"docs/product/signatures-observer-v0.1.md§1–3",note:"Фиксированный измерительный стенд, не геометрия named hull",...{unit}};
  return { ...structuredClone(spec), schemaVersion: "u2-lab/3", modelVersion: MODEL_SIGNATURE_MISSION,
    signatures: validateSignatureSettings(settings),origins };
}
