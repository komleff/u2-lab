import { cosineDegrees, finite, label, nonnegative, normalizeDegrees } from "./domain";

export type IrAngularProfile = "isotropic" | "fore" | "aft" | "lateral";
export interface IrProjectionInput {
  id: string;
  profile: IrAngularProfile;
  absoluteIrW: number;
  contrastW: number;
}

export function normalizeBearing(degrees: number): number {
  return normalizeDegrees(degrees);
}

// U2 spec_signature_model_v0.1.md §6.7: circular mean = 1, это угловой эквивалент W.
export function lambertGain(deltaDeg: number): number {
  const angle = normalizeDegrees(deltaDeg);
  return angle >= 90 && angle <= 270 ? 0 : Math.PI * Math.max(cosineDegrees(angle), 0);
}

function profileGain(profile: IrAngularProfile, bearingDeg: number): number {
  switch (profile) {
    case "isotropic": return 1;
    case "fore": return lambertGain(bearingDeg);
    case "aft": return lambertGain(bearingDeg - 180);
    case "lateral": return (lambertGain(bearingDeg - 90) + lambertGain(bearingDeg - 270)) / 2;
    default: throw new TypeError("unsupported IR angular profile");
  }
}

export function projectIrComponents(components: readonly IrProjectionInput[], bearingDeg: number) {
  if (!Array.isArray(components) || components.length === 0) throw new TypeError("ready IR components required");
  const bearing = normalizeBearing(bearingDeg);
  const ids = new Set<string>();
  const projected = components.map(component => {
    const id = label(component.id, "component id");
    if (ids.has(id)) throw new TypeError("duplicate IR component id");
    ids.add(id);
    const absoluteIrW = nonnegative(component.absoluteIrW, "absoluteIrW");
    const contrastW = finite(component.contrastW, "contrastW");
    const gain = profileGain(component.profile, bearing);
    return { id, absoluteIrW, contrastW,
      projectedAbsoluteW: finite(absoluteIrW * gain, "projectedAbsoluteW"),
      projectedContrastW: finite(contrastW * gain, "projectedContrastW") };
  });
  const sum = (key: "absoluteIrW" | "contrastW" | "projectedAbsoluteW" | "projectedContrastW") =>
    finite(projected.reduce((total, component) => total + component[key], 0), key);
  const projectedContrastW = sum("projectedContrastW");
  // Не полная сигнатура корабля: caller обязан отдельно замкнуть все физические источники.
  return { scope: "partial_ir_components" as const, intrinsicAbsoluteW: sum("absoluteIrW"),
    intrinsicContrastW: sum("contrastW"), projectedAbsoluteW: sum("projectedAbsoluteW"),
    projectedContrastW, standardSignalW: Math.max(projectedContrastW, 0),
    advancedSignalW: Math.abs(projectedContrastW), components: projected };
}
