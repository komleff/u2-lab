import type { Gate, Origin, Species } from "../model/types";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type Category = "propulsion" | "power" | "payload" | "signature";
export type PropulsionRole = "march" | "retro" | "strafe" | "turn";
export type FieldOrigin = Origin & { unit: string; range?: [number, number] };
export type Material = {
  id: string;
  massKg: number;
  cpJKgK: number;
  contents: "dry";
  origin: FieldOrigin;
};
export type ModuleItem = {
  id: string;
  label: string;
  category: Category;
  size: Size;
  family:
    | "engine"
    | "generator"
    | "solar"
    | "battery"
    | "tank"
    | "mining"
    | "cargo"
    | "radiator"
    | "buffer"
    | "h2"
    | "thermoinverter";
  formFactor: "single" | "pair";
  propulsionType?: "diesel" | "hydrogen" | "electric";
  species?: Species;
  class: "Civilian" | "Industrial" | "UNKNOWN";
  generation: number;
  generationState: "authored";
  materials: Material[];
  numerics: Record<string, number>;
  gate: Gate;
  origins: Record<string, FieldOrigin>;
  cargoType?: "universal" | "bulk" | "liquid";
};
export type ModuleInstance = {
  id: string;
  itemId: string;
  enabled: boolean;
  variant?: string;
  mode?: string;
};
export type Slot = {
  id: string;
  category: Category;
  size: Size;
  families: ModuleItem["family"][];
  mandatory: boolean;
  role?: PropulsionRole;
  formFactor: "single" | "pair";
};
export type Builtin = { id: string; item: ModuleItem; role?: PropulsionRole };
export type HullProfile = {
  id: string;
  label: string;
  size: "S" | "M" | "L";
  class: ModuleItem["class"];
  generation: number;
  architecture: "U" | "D" | "E" | "A";
  slots: Slot[];
  builtins: Builtin[];
  materials: Material[];
  hullPowerW: number;
  hullRadiationM2: number;
  origins: Record<string, FieldOrigin>;
};
export type ShipFit = {
  schemaVersion: "u2-ship-fit/1";
  fitRevision: number;
  catalogVersion: string;
  hullId: string;
  assignments: Record<string, string>;
  instances: Record<string, ModuleInstance>;
  localVariants: Record<string, ModuleItem>;
  builtinModes?: Record<string, { enabled: boolean; mode?: string }>;
  initial: {
    chargeFraction: number;
    fuelFraction: Partial<Record<Species, number>>;
  };
};
export type ResolvedInstance = {
  id: string;
  item: ModuleItem;
  enabled: boolean;
  builtin: boolean;
  slotId?: string;
  role?: PropulsionRole;
};
export type ResolvedShip = {
  hull: HullProfile;
  fit: ShipFit;
  instances: ResolvedInstance[];
  dryMassKg: number;
  heatCapacityJK: number;
  materials: Material[];
  batteryCapacityJ: number;
  bufferCapacityJ: Record<string, number>;
  cargoCapacityM3: { universal: number; bulk: number; liquid: number };
  resources: Record<
    Species,
    {
      capacityKg: number;
      energyJKg: number;
      consumerIds: string[];
      tankIds: string[];
    }
  >;
  origins: Record<string, FieldOrigin>;
};
export type FitIssue = {
  path: string;
  code: string;
  message: string;
  severity: "error" | "warning";
};
export type FitReadiness = {
  complete: boolean;
  canRun: boolean;
  missing: string[];
  resourceWarnings: FitIssue[];
};
export type FitValidation = {
  issues: FitIssue[];
  readiness: FitReadiness;
  valid: boolean;
};
export type CandidateCatalog = {
  version: "ship-fitting-0.2.0" | "ship-fitting-0.2.1" | "ship-fitting-0.2.2" | "ship-fitting-0.2.3";
  hulls: HullProfile[];
  items: Record<string, ModuleItem>;
};
