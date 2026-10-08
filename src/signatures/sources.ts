import { finite, flag, fraction, nonnegative } from "./domain";

export type EngineIrKind = "diesel" | "hydrogen" | "electric";
export interface EngineIrInput {
  kind: EngineIrKind;
  enabled: boolean;
  // D/H: actual exhaust thermal export; E: только actual own motor loss после тракта.
  actualSourceW: number;
}

export interface EngineIrComponent {
  scope: "engine_component";
  kind: EngineIrKind;
  basisW: number;
  absoluteIrW: number;
  hostHeatDebitW: number;
}

// Lab-only решение GD: docs/product/signatures-observer-v0.1.md v0.2 §3, не канон U2.
export function engineIr(input: EngineIrInput): EngineIrComponent {
  const coefficients: Record<EngineIrKind, number> = { diesel: 0.10, hydrogen: 0.01, electric: 0.001 };
  if (!Object.hasOwn(coefficients, input.kind)) throw new TypeError("unsupported engine IR kind");
  const actualW = nonnegative(input.actualSourceW, "actualSourceW");
  const basisW = flag(input.enabled, "enabled") ? actualW : 0;
  const absoluteIrW = finite(basisW * coefficients[input.kind], "absoluteIrW");
  return { scope: "engine_component", kind: input.kind, basisW, absoluteIrW,
    hostHeatDebitW: input.kind === "electric" ? absoluteIrW : 0 };
}

export interface ElectricMotorLossInput {
  actualBusW: number;
  pathEfficiency: number;
  motorEfficiency: number;
}

export function electricMotorLosses(input: ElectricMotorLossInput) {
  const busW = nonnegative(input.actualBusW, "actualBusW");
  const path = fraction(input.pathEfficiency, "pathEfficiency");
  const motor = fraction(input.motorEfficiency, "motorEfficiency");
  const motorInputW = finite(busW * path, "motorInputW");
  return {
    motorInputW,
    pathLossW: finite(busW * (1 - path), "pathLossW"),
    motorWasteW: finite(motorInputW * (1 - motor), "motorWasteW"),
    usefulW: finite(motorInputW * motor, "usefulW"),
  };
}
