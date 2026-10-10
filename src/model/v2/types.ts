import type {
  EnvironmentSample,
  ModelState,
  StepResult,
  Origin,
} from "../types";
import type { ResolvedShip, PropulsionRole } from "../../fitting/types";
export const MODEL_V2 = "ship-fitting-ledger-0.2" as const;
export const MODEL_MISSION = "ship-fitting-mission-0.2.2" as const;
export const MODEL_SIGNATURE_MISSION = "ship-fitting-signature-mission-0.1" as const;
export const isMissionModel = (model: string) => model === MODEL_MISSION || model === MODEL_SIGNATURE_MISSION;
import type { SignatureSettings } from "../../signatures/config";
import type { SignatureFrame } from "../../signatures/physics";
export type MissionConfig = {
  distanceM: number;
  cruiseSpeedMS: number | null;
  referenceVfaMS: number;
  cPrimeMS: 3000;
  stopPolicy: "full-hold" | "first-stop";
  approachSeconds: number;
  serviceSeconds: number;
  maneuverDuty: number;
  stationReplenish?: boolean;
};
export type MissionState = {
  stage: "outbound" | "approach" | "mining" | "inbound" | "service" | "done" | "stranded";
  flightMode: "acceleration" | "coast" | "braking";
  positionM: number;
  velocityMS: number;
  stageStartedSeconds: number;
  tripStartedSeconds: number;
  outboundMassKg: number;
  inboundMassKg: number | null;
  peakVelocityMS: number;
  deliveredM3: number;
  receivedFuelKg: Record<string, number>;
  receivedChargeJ?: number;
  elapsed: { flight: number; approach: number; mining: number; service: number; recovery: number };
  firstLimiter: { timeSeconds: number; phase: string; instanceIds: string[]; causes: Cause[]; message: string } | null;
  terminalReason: string | null;
};
export type Cause = "power" | "thermal" | "resource" | "cargo";
export const CAUSES: Cause[] = ["power", "thermal", "resource", "cargo"];
export type RequestFrame = Record<string, number>;
export type MiningProcess = {
  id: string;
  energyJPerM3: number;
  densityKgM3: number;
  extractFactor: number;
  softFactor: number;
  workFactor: number;
  returnFraction: number;
};
export type FittingPhase = {
  id: string;
  action: "work" | "approach" | "braking" | "transit" | "service" | "idle";
  durationSeconds: number;
  requests: RequestFrame;
  environment?: EnvironmentSample;
  service?: { unload?: boolean; refuel?: boolean; charge?: boolean };
};
export type RunSpecV2 = {
  schemaVersion: "u2-lab/2" | "u2-lab/3";
  modelVersion: typeof MODEL_V2 | typeof MODEL_MISSION | typeof MODEL_SIGNATURE_MISSION;
  signatures?: SignatureSettings;
  mission?: MissionConfig;
  catalogVersion: string;
  units: "SI";
  approvedBaseline: false;
  snapshotReplayOnly?: true;
  resolvedShip: ResolvedShip;
  origins: Record<string, Origin>;
  environment: EnvironmentSample;
  initial: {
    chargeJ: number;
    temperatureK: number;
    fuelKg: Record<string, number>;
    buffersJ: Record<string, number>;
    cargoM3: Record<string, number>;
  };
  selectedWorkGroup: string[];
  process: MiningProcess;
  scenario: {
    name: string;
    repeat: boolean;
    targetM3: number;
    phases: FittingPhase[];
  };
  durationSeconds: number;
  stepSeconds: number;
};
export type StateV2 = ModelState & {
  mission?: MissionState;
  schemaVersion: "u2-lab/2" | "u2-lab/3";
  cargoM3: Record<string, number>;
  currentMassKg: number;
  extractedByInstanceM3: Record<string, number>;
  consumptionKg: Record<string, number>;
  limitations: Record<string, Record<Cause, boolean>>;
  cyclesCompleted: number;
  miningStopSeconds: number | null;
};
export type MiningStepSummary = {
  requested: boolean;
  requestedM3: number;
  selectedM3: number;
  causeSeconds: Record<Cause, number>;
  unionSeconds: number;
  overlapSeconds: number;
  forcedDowntimeSeconds: number;
  partialLossM3: number;
  firstLoss: { timeSeconds: number; causes: Cause[] } | null;
  firstPositiveSeconds: number | null;
  firstCauseSeconds?: Record<Cause, number | null>;
  propulsionShortfall: boolean;
  recoveryDelta?: {
    firstSeconds: number | null;
    count: number;
    sumSeconds: number;
    maxSeconds: number;
  };
};
export type StepResultV2 = Omit<StepResult, "state"> & {
  state: StateV2;
  mining: MiningStepSummary;
  signatureFrames?: SignatureFrame[];
};
export type TelemetryDescriptor = {
  id: string;
  unit: string;
  instanceId?: string;
  role?: PropulsionRole;
};
export type AnyRunSpec = import("../types").RunSpec | RunSpecV2;
export type StoredRunSpec = AnyRunSpec | import("../v3/types").RunSpecV3;
