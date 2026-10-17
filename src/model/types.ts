export type Origin = {
  kind: "canonical" | "derived" | "experimental";
  sourceRef: string;
  note?: string;
  derivation?: string;
};
export type Species = "diesel" | "hydrogen";
export type Gate = {
  low: number;
  workLow?: number;
  high: number;
  restartLow: number;
  restartHigh: number;
  workHigh: number;
};
export type Module = {
  id: string;
  kind:
    | "generator"
    | "engine"
    | "load"
    | "radiator"
    | "buffer"
    | "h2"
    | "thermoinverter"
    | "solar";
  enabled: boolean;
  policy: "Protected" | "Active" | "Background";
  gate: Gate;
  tankId?: string;
  species?: Species;
  powerW: number;
  efficiency: number;
  exportFraction: number;
  pathEfficiency: number;
  forceN: number;
  alpha: number;
  hostFraction: number;
  areaM2: number;
  capacityJ: number;
  coolingW: number;
  auxW: number;
  qJKg: number;
  hotK: number;
  copEfficiency: number;
  workPerJ: number;
  absorbAboveK: number;
  releaseBelowK: number;
};
export type ShipConfig = {
  label: string;
  size: "S" | "M";
  heatCapacityJK: number;
  dryMassKg: number;
  thermalMaterials: {
    id: string;
    massKg: number;
    cpJKgK: number;
    contents: "dry";
  }[];
  hullPowerW: number;
  hullRadiationM2: number;
  dischargeEfficiency: number;
  chargeEfficiency: number;
  accumulators: { id: string; capacityJ: number }[];
  tanks: {
    id: string;
    species: Species;
    capacityKg: number;
    energyJKg: number;
    gate?: Gate;
  }[];
  modules: Module[];
  cargoCapacity: number;
};
export type EnvironmentSample = {
  effectiveBackgroundK: number;
  solarFluxWm2: number;
  solarSourceId: string;
  backgroundSourceId: string;
  energyInputs: {
    sourceId: string;
    representation: "electric" | "heat";
    powerW: number;
  }[];
  directHeat: { sourceId: string; powerW: number }[];
  law: "radiative" | "linear-fog-experiment";
  linearWK: number;
};
export type Phase = {
  id: string;
  durationSeconds: number;
  action:
    | "idle"
    | "approach"
    | "work"
    | "overload"
    | "return"
    | "recovery"
    | "service";
  duty: number;
  environment?: EnvironmentSample;
  service?: { refuel: boolean; unload: boolean; charge: boolean };
};
export type RunSpec = {
  schemaVersion: "u2-lab/1";
  units: "SI";
  modelVersion: string;
  catalogVersion: string;
  approvedBaseline: false;
  origins: Record<string, Origin>;
  ship: ShipConfig;
  environment: EnvironmentSample;
  initial: {
    chargeJ: number;
    temperatureK: number;
    fuelKg: Record<string, number>;
    buffersJ: Record<string, number>;
  };
  scenario: {
    name: string;
    repeat: boolean;
    phases: Phase[];
    targetWork: number;
  };
  durationSeconds: number;
  stepSeconds: number;
};
export type ModelState = {
  timeSeconds: number;
  chargeJ: number;
  temperatureK: number;
  fuelKg: Record<string, number>;
  buffersJ: Record<string, number>;
  gates: Record<string, boolean>;
  cargo: number;
  usefulWork: number;
  phaseKey: string;
  constraints: string[];
  sourceRecovery?: boolean;
  scenarioOffsetSeconds?: number;
};
export type LabEvent = { timeSeconds: number; kind: string; message: string };
export type TickTelemetry = Record<string, number>;
export type StepResult = {
  state: ModelState;
  telemetry: TickTelemetry;
  events: LabEvent[];
  coolantConsumedKg: number;
  maxTemperatureK: number;
};
export const capacity = (s: ShipConfig) =>
  s.accumulators.reduce((n, a) => n + a.capacityJ, 0);
export const initialState = (s: RunSpec): ModelState => ({
  timeSeconds: 0,
  chargeJ: s.initial.chargeJ,
  temperatureK: s.initial.temperatureK,
  fuelKg: { ...s.initial.fuelKg },
  buffersJ: { ...s.initial.buffersJ },
  gates: {},
  cargo: 0,
  usefulWork: 0,
  phaseKey: "",
  constraints: [],
});
