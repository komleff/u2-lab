import { TICK_SECONDS, type SIUnit } from "./types";

export const TOLERANCE_VERSION = "governor-tolerances/1" as const;
const sourceRef = "lab:2026-10-23-f2-governor-pretest-implementation/v0.2§3.6";
export type GovernorToleranceV1 = Readonly<{
  version: typeof TOLERANCE_VERSION; unit: SIUnit; absolute: number; relative: number;
  scale: "exact" | "ledger-throughput" | "temperature-change-floor-1K" | "max-delta-or-reference-transfers" | "consumed-mass-floor-1e-6kg" | "physical-time";
  scaleFloor: number; sourceRef: string;
}>;
const tolerance = (unit: SIUnit, absolute: number, relative: number, scale: GovernorToleranceV1["scale"], scaleFloor = 0): GovernorToleranceV1 => Object.freeze({ version: TOLERANCE_VERSION, unit, absolute, relative, scale, scaleFloor, sourceRef });
// Данные policy; вычисление residual и reference trajectories принадлежит G1/G2.
export const GOVERNOR_TOLERANCES = Object.freeze({
  exact: tolerance("1", 0, 0, "exact"),
  energy: tolerance("J", 1e-6, 1e-10, "ledger-throughput"),
  mass: tolerance("kg", 1e-12, 1e-10, "ledger-throughput"),
  temperatureConvergence: tolerance("K", 0.02, 0.005, "temperature-change-floor-1K", 1),
  energyConvergence: tolerance("J", 1e-3, 0.005, "max-delta-or-reference-transfers"),
  massConvergence: tolerance("kg", 1e-9, 0.005, "consumed-mass-floor-1e-6kg", 1e-6),
  transitionTime: tolerance("s", TICK_SECONDS, 0, "physical-time"),
});
export type GovernorToleranceIdV1 = keyof typeof GOVERNOR_TOLERANCES;
