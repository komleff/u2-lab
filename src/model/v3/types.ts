import type { FieldOrigin, Material, ModuleInstance, PropulsionRole, Size } from "../../fitting/types";
import type { Species } from "../types";
export const SCHEMA_V3 = "u2-lab/4" as const;
export const MODEL_V3 = "ship-fitting-ship-model-0.1" as const;
export const CATALOG_V3 = "ship-fitting-0.3.0" as const;
export type ShipClass = "Civilian" | "Industrial" | "Sport" | "Military" | "Stealth" | "UNKNOWN";
export type ShipMode = "Efficient" | "Combat" | "Masking";
export type ReceiverProfile = "positive-only" | "absolute-contrast";
export type CategoryV3 = "propulsion" | "power" | "payload" | "sensors-thermal";
export type FamilyV3 = "engine" | "generator" | "solar" | "battery" | "tank" | "mining" | "cargo" | "radiator" | "buffer" | "h2" | "thermoinverter" | "pump-radiator" | "furnace" | "electric-heater" | "shielding" | "gyrodyne" | "ram" | "shell" | "sensor" | "radar" | "transmitter";
export type ThermalGateV3 = { low: number; workLow: number; workHigh: number; high: number; restartLow: number; restartHigh: number };
export type CircuitOwner = { kind: "common-ti" } | { kind: "pump-radiator"; instanceId: string };
export type IrProfile = { version: "radiator-ir/1"; kind: "omnidirectional" | "aft-directed"; aftFraction: number };
export type ThermalSurface = {
  id: string; areaM2: number; emissivity: number; active: boolean; closable: boolean;
  builtin: boolean; circuitOwner: CircuitOwner; irProfile: IrProfile;
  origins: Record<string, FieldOrigin>;
};
export type DurabilityParameters = {
  behavior: "repairable-active" | "passive" | "hull" | "armor" | "vital";
  emergencyDepthR: number; wearPerWorkSecond: number; failurePeriodSeconds: number; cooldownSeconds: number;
};
export type ModuleItemV3 = {
  id: string; label: string; category: CategoryV3; size: Size; family: FamilyV3;
  formFactor: "single" | "pair"; propulsionType?: Species | "electric"; species?: Species;
  class: ShipClass; generation: number; generationState: "authored"; materials: Material[];
  numerics: Record<string, number>; gate: ThermalGateV3; thermalRole: "ordinary" | "regulator";
  durability: DurabilityParameters; surfaces: ThermalSurface[]; origins: Record<string, FieldOrigin>;
  cargoType?: "universal" | "bulk" | "liquid";
  operationPolicy?: "critical" | "deferrable-background" | "optional-pulse-charge";
};
export type SlotV3 = { id: string; category: CategoryV3; size: Size; families: FamilyV3[]; mandatory: boolean; role?: PropulsionRole; formFactor: "single" | "pair" };
export type HullV3 = {
  id: string; label: string; size: "S" | "M" | "L"; class: ShipClass; generation: number;
  architecture: "U" | "D" | "H" | "E" | "A"; slots: SlotV3[];
  builtins: { id: string; item: ModuleItemV3; role?: PropulsionRole }[]; materials: Material[];
  hullPowerW: number; bodyExchangeAreaM2: number; bodyEmissivity: number;
  hullPassiveRadiator: ThermalSurface | null; modes: ShipMode[];
  origins: Record<string, FieldOrigin>;
};
export type ShipFitV3 = {
  schemaVersion: "u2-ship-fit/2"; fitRevision: number; catalogVersion: typeof CATALOG_V3;
  hullId: string; assignments: Record<string, string>; instances: Record<string, ModuleInstance>;
  localVariants: Record<string, ModuleItemV3>; builtinModes: Record<string, { enabled: boolean; mode?: string }>;
  initial: { chargeFraction: number; fuelFraction: Record<Species, number> };
};
export type CandidateCatalogV3 = { version: typeof CATALOG_V3; hulls: HullV3[]; items: Record<string, ModuleItemV3>; presets: Record<string, ShipFitV3> };
export type ResolvedInstanceV3 = { id: string; item: ModuleItemV3; enabled: boolean; builtin: boolean; slotId?: string; role?: PropulsionRole };
export type ResolvedShipV3 = {
  catalogVersion: typeof CATALOG_V3; hull: HullV3; fit: ShipFitV3; instances: ResolvedInstanceV3[];
  materials: Material[]; dryMassKg: number; heatCapacityJK: number; batteryCapacityJ: number;
  bufferCapacityJ: Record<string, number>; cargoCapacityM3: { universal: number; bulk: number; liquid: number };
  resources: Record<Species, { capacityKg: number; energyJKg: number; tankIds: string[]; consumerIds: string[] }>;
  surfaces: ThermalSurface[]; origins: Record<string, FieldOrigin>;
};
export type EnvironmentV3 = {
  radiativeBackgroundK: number; backgroundSourceId: string;
  thermalField: { temperatureK: number; coefficientWPerM2K: number; sourceId: string } | null;
  solarFluxWm2: number; solarSourceId: string | null;
  energyInputs: { sourceId: string; representation: "electric" | "heat"; powerW: number }[];
  directHeat: { sourceId: string; powerW: number }[];
};
export type StateV3 = {
  schemaVersion: typeof SCHEMA_V3; modelVersion: typeof MODEL_V3; stateVersion: "ship-state/1";
  timeSeconds: number; phaseIndex: number; phaseElapsedSeconds: number;
  mode: ShipMode; maskingEntryTemperatureK: number | null; temperatureK: number; chargeJ: number;
  fuelKg: Record<Species, number>; buffers: Record<string, { storedJ: number; minimumCaptureK: number | null }>;
  governor: { coolingStageId: string | null; heatingStageId: string | null; recoveringBuffer: boolean };
  generator: { permission: boolean; normalOn: boolean };
  modules: Record<string, { durabilityR: number; firstNegativeCrossing: boolean; emergencyExposureSeconds: number; cooldownSeconds: number; restartAuthorized: boolean; thermalStopped: boolean }>;
  surfaceOpen: Record<string, boolean>;
  rng: { algorithm: "xorshift32/1"; seed: number; state: number };
};
export type RunSpecV3 = {
  schemaVersion: typeof SCHEMA_V3; modelVersion: typeof MODEL_V3; catalogVersion: typeof CATALOG_V3;
  units: "SI"; approvedBaseline: false; resolvedShip: ResolvedShipV3; origins: Record<string, FieldOrigin>;
  environment: EnvironmentV3; initialState: StateV3; receiverProfile: ReceiverProfile;
  observer: { presetId: string; rangeM: number; aspectDeg: number };
  scenario: { name: string; repeat: boolean; phases: { id: string; action: "idle" | "work" | "maneuver" | "recovery"; durationSeconds: number; requests: Record<string, number>; environment: EnvironmentV3 | null; mode?: ShipMode }[] };
  durationSeconds: number; stepSeconds: 1;
};
export type CompilationChange = { path: string; kind: "structural" | "numeric" | "origin"; before: unknown; after: unknown };
export type PromotedFitV3 = { fit: ShipFitV3; ship: ResolvedShipV3; changes: CompilationChange[]; sourceSnapshot: import("../../fitting/types").ShipFit };
