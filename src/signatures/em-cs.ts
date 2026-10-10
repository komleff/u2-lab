import { cosineDegrees, finite, label, nonnegative, positive, sineDegrees, strongestTransmission } from "./domain";

export type ElectricalStageKind = "generator_output" | "battery_charge" | "battery_discharge"
  | "consumer_input" | "protected_processing";
export interface ActualElectricalStage {
  id: string;
  kind: ElectricalStageKind;
  actualW: number;
}
export interface EmComponentInput {
  stages: readonly ActualElectricalStage[];
  hostLossBudgetW: number;
  otherHostExportW: number;
  shieldingTransmissions: readonly number[];
  // Уже оплаченный отдельным ledger intentional RF, shielding к нему не применяется.
  intentionalRfW: number;
}

// Frozen stage owner + Lab package §3: κ относится к actual ступеням, не к запросу шины.
export function emComponent(input: EmComponentInput) {
  if (!Array.isArray(input.stages) || input.stages.length === 0) throw new TypeError("ready actual stages required");
  const kinds: readonly string[] = ["generator_output", "battery_charge", "battery_discharge", "consumer_input", "protected_processing"];
  const ids = new Set<string>();
  const stageBasisW = finite(input.stages.reduce((total, stage) => {
    const id = label(stage.id, "stage id");
    if (ids.has(id)) throw new TypeError("duplicate electrical stage id");
    if (!kinds.includes(stage.kind)) throw new TypeError("unsupported electrical stage");
    ids.add(id);
    return total + nonnegative(stage.actualW, "actual stage W");
  }, 0), "stageBasisW");
  const hostLossBudgetW = nonnegative(input.hostLossBudgetW, "hostLossBudgetW");
  const otherHostExportW = nonnegative(input.otherHostExportW, "otherHostExportW");
  const intentionalRfW = nonnegative(input.intentionalRfW, "intentionalRfW");
  const rawParasiticW = finite(stageBasisW * 0.0000215, "rawParasiticW");
  // Captured тоже должен помещаться в имеющийся waste: экран не создаёт новые Дж.
  if (rawParasiticW + otherHostExportW > hostLossBudgetW) throw new RangeError("insufficient host loss budget");
  const escapedParasiticW = rawParasiticW * strongestTransmission(input.shieldingTransmissions);
  const capturedParasiticW = rawParasiticW - escapedParasiticW;
  const retainedHostHeatW = hostLossBudgetW - otherHostExportW - escapedParasiticW;
  return { scope: "em_component" as const, stageBasisW, rawParasiticW, escapedParasiticW,
    capturedParasiticW, retainedHostHeatW, intentionalRfW,
    observedEmW: finite(escapedParasiticW + intentionalRfW, "observedEmW") };
}

export interface ReferenceGeometry {
  lengthM: number;
  widthM: number;
  heightM: number;
}

// Только reference overlay пакета §2; ни named hull, ни температура не являются входами.
export function referenceCrossSection(geometry: ReferenceGeometry, bearingDeg: number, ramTransmissions: readonly number[]): number {
  const length = positive(geometry.lengthM, "lengthM");
  const width = positive(geometry.widthM, "widthM");
  const height = positive(geometry.heightM, "heightM");
  return finite(height * (Math.abs(width * cosineDegrees(bearingDeg)) + Math.abs(length * sineDegrees(bearingDeg)))
    * strongestTransmission(ramTransmissions), "crossSectionM2");
}

// К plume/radiator этот primitive неприменим: вход только intrinsic effective hull K.
export function intrinsicHullK(effectiveHullK: number, insulationTransmissions: readonly number[]): number {
  return finite(nonnegative(effectiveHullK, "effectiveHullK") * strongestTransmission(insulationTransmissions), "insulatedHullK");
}
