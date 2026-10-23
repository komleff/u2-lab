export const GOVERNOR_VERSION = "ship-thermal-governor/0.3" as const;
export const GOVERNOR_PROFILE_VERSION = "governor-profile/0.3" as const;
export const MODEL_V02 = "ship-fitting-ship-model-0.2" as const;
export const STATE_V2 = "ship-state/2.1" as const;
export const TICK_HZ = 30 as const;
export const TICK_SECONDS = 1 / TICK_HZ;

export type SIUnit = "1" | "K" | "J" | "W" | "kg" | "s" | "tick" | "Hz" | "m2" | "J/K" | "W/K" | "kg/s" | "kg/J" | "J/kg" | "J/(kg*K)";
export type ProvenanceKind = "canonical" | "derived" | "experimental";
export type SIValue<U extends SIUnit> = Readonly<{
  value: number; unit: U; kind: ProvenanceKind; sourceRef: string;
  candidateRange?: readonly [number, number]; derivation?: string;
}>;
export type GovernorModeV03 = "Normal" | "Quiet" | "Combat";
export type HullClassV03 = "Civilian" | "Industrial" | "Sport" | "Military" | "Stealth";
export type ModuleKindV03 = "ordinary" | "generator" | "heater" | "active-radiator" | "thermoinverter" | "h2-cooler" | "water-cooler";
export type GovernorReasonV03 = "idle" | "resource-empty" | "resource-reserved" | "power-limited" | "input-port-limited" | "output-port-limited" | "shared-port-limited" | "capacity-limited" | "temperature-head" | "hot-derating" | "cold-derating" | "mode-not-permitted" | "quiet-hot-path-forbidden" | "ship-cold-protection" | "tank-cold-protection" | "critical-hot-stop" | "critical-cold-stop" | "durability-failure" | "restart-hysteresis" | "restart-unauthorized" | "cooldown" | "incompatible-thermal-bands" | "nonpositive-net-cooling";
export type StageIdV03 = "0" | "1" | "2" | "3" | "4" | "5Q" | "6" | "7" | "8" | "9";
export type TransitionDirectionV03 = "none" | "warming" | "cooling";
export type ThermalBandsV03 = Readonly<{
  criticalLowK: SIValue<"K">; workLowK: SIValue<"K">; workHighK: SIValue<"K">;
  criticalHighK: SIValue<"K">; restartColdK: SIValue<"K">; restartHotK: SIValue<"K">;
}>;
export type BufferTemperaturePointV03 = Readonly<{ energyJ: SIValue<"J">; temperatureK: SIValue<"K"> }>;
export type BufferPhysicalV03 = Readonly<{
  id: string; capacityJ: SIValue<"J">; temperatureByEnergy: readonly BufferTemperaturePointV03[];
  inputW: SIValue<"W">; outputW: SIValue<"W">; sharedW: SIValue<"W">;
  conductanceWPerK: SIValue<"W/K">; compatibleModuleIds: readonly string[];
}>;
export type BufferBankProfileV03 = BufferPhysicalV03 & Readonly<{ memberIds: readonly string[] }>;
export type ModuleProfileV03 = Readonly<{
  id: string; kind: ModuleKindV03; temperatures: ThermalBandsV03;
  requestCapW: SIValue<"W">; capW: SIValue<"W">; minSourceTemperatureK: SIValue<"K">;
  electricJPerJ: SIValue<"1">; massKgPerJ: SIValue<"kg/J">; auxHeatJPerJ: SIValue<"1">;
  standbyHeatW: SIValue<"W">; auxHeatDestination: "ship" | "export";
  resourceId: string | null; compatibleBankIds: readonly string[];
}>;
export type SurfaceProfileV03 = Readonly<{
  id: string; moduleId: string | null; kind: "hull" | "passive" | "active";
  areaM2: SIValue<"m2">; emissivity: SIValue<"1">; closable: boolean; thermoinverterId: string | null;
}>;
export type WaterTankProfileV03 = Readonly<{
  id: string; resourceId: string; heatCapacityJPerKgK: SIValue<"J/(kg*K)">;
  latentHeatJPerKg: SIValue<"J/kg">; referenceTemperatureK: SIValue<"K">; freezeK: SIValue<"K">;
  protectionOnK: SIValue<"K">; protectionOffK: SIValue<"K">;
  conductanceWPerK: SIValue<"W/K">; exchangeCapW: SIValue<"W">; heaterCapW: SIValue<"W">;
}>;
export type GovernorProfileV03 = Readonly<{
  version: typeof GOVERNOR_PROFILE_VERSION; governorVersion: typeof GOVERNOR_VERSION; id: string; revision: string;
  ship: Readonly<{ id: string; class: HullClassV03; heatCapacityJPerK: SIValue<"J/K">; temperatures: ThermalBandsV03 }>;
  buffers: readonly BufferPhysicalV03[]; banks: readonly BufferBankProfileV03[];
  electrical: Readonly<{
    storage: Readonly<{ capacityJ: SIValue<"J">; maxChargeW: SIValue<"W">; maxDischargeW: SIValue<"W"> }>;
    sources: readonly Readonly<{ id: string; moduleId: string; maxOutputW: SIValue<"W">; efficiency: SIValue<"1">; hostHeatFraction: SIValue<"1">; resourceId: string | null; fuelJPerKg: SIValue<"J/kg"> | null }>[];
    loads: readonly Readonly<{ id: string; moduleId: string; standbyW: SIValue<"W">; maxInputW: SIValue<"W"> }>[];
  }>;
  resources: readonly Readonly<{ id: string; species: "H2" | "water" | "diesel"; capacityKg: SIValue<"kg">; maxFlowKgPerS: SIValue<"kg/s"> }>[];
  modules: readonly ModuleProfileV03[]; surfaces: readonly SurfaceProfileV03[];
  thermoinverters: readonly Readonly<{ id: string; moduleId: string; surfaceIds: readonly string[]; cop: SIValue<"1">; maxColdSideW: SIValue<"W">; maxHotTemperatureK: SIValue<"K">; auxHostHeatFraction: SIValue<"1"> }>[];
  hydrogenCoolers: readonly Readonly<{ id: string; moduleId: string; resourceId: string; mode: "ordinary" | "cold"; floorK: SIValue<"K">; specificExportByTemperature: readonly Readonly<{ temperatureK: SIValue<"K">; specificEnergyJPerKg: SIValue<"J/kg"> }>[] }>[];
  waterTanks: readonly WaterTankProfileV03[];
  modes: Readonly<{
    allowed: readonly GovernorModeV03[]; normalTargetK: SIValue<"K">; coldOnK: SIValue<"K">; coldOffK: SIValue<"K">;
    quietOnK: SIValue<"K">; quietOffK: SIValue<"K">; quietUpperK: SIValue<"K">;
    coldMarginK: SIValue<"K">; hotMarginK: SIValue<"K">; separationK: SIValue<"K">;
    vitalModuleIds: readonly string[]; vitalMinK: SIValue<"K">; vitalMaxK: SIValue<"K">; quietEmergencyChargeFraction: SIValue<"1">;
  }>;
  failurePolicy: Readonly<{ rngAlgorithm: "xorshift32/1"; firstNegativePolicy: "check-on-first-negative-crossing"; checkIntervalSeconds: SIValue<"s">; probabilityPerCheck: SIValue<"1">; restartPolicy: "explicit-authorization-and-hysteresis" }>;
  numerical: Readonly<{ maxTickDeltaK: SIValue<"K">; minEnvironmentK: SIValue<"K">; maxEnvironmentK: SIValue<"K">; maxExternalHeatingW: SIValue<"W">; maxExternalCoolingW: SIValue<"W"> }>;
}>;

export type GovernorModuleStateV03 = Readonly<{
  id: string; durabilityR: number; firstNegativeCrossing: boolean; emergencyExposureSeconds: number;
  cooldownUntilTick: number; restartAuthorized: boolean; durabilityStopped: boolean; thermalStopped: boolean; stopReasons: readonly GovernorReasonV03[];
}>;
export type GovernorStateV03 = Readonly<{
  version: typeof STATE_V2; governorVersion: typeof GOVERNOR_VERSION; profileId: string; profileRevision: string; tickIndex: number;
  effectiveMode: GovernorModeV03; requestedMode: GovernorModeV03;
  quietEntryTemperatureK: number | null; quietHoldTemperatureK: number | null;
  modeLatches: Readonly<{ shipColdProtection: boolean; quietColdCooling: boolean }>;
  stageLatches: readonly Readonly<{ id: StageIdV03; active: boolean }>[];
  bankLatches: readonly Readonly<{ id: string; direction: "none" | "in" | "out" }>[];
  selectedStageIds: readonly StageIdV03[]; previousTransitionDirection: TransitionDirectionV03;
  surfaceDeploymentById: readonly Readonly<{ id: string; deployed: boolean }>[];
  shipEnergyJ: number; shipEnergyRemainderJ: number; bufferEnergyJByBank: readonly Readonly<{ id: string; energyJ: number }>[];
  waterEnthalpyJByTank: readonly Readonly<{ id: string; enthalpyJ: number; phase: "solid" | "mixed" | "liquid" }>[];
  electricalChargeJ: number; resourceMassKg: readonly Readonly<{ id: string; massKg: number }>[];
  moduleStateById: readonly GovernorModuleStateV03[];
  failureChecks: Readonly<{ emergencyExposureSeconds: number; nextCheckIndex: number; actualCheckCount: number; boundaryPolicy: "accumulated-exposure" }>;
  rng: Readonly<{ algorithm: "xorshift32/1"; seed: number; state: number }>;
  cumulativeServiceInputs: Readonly<{ electricalJ: number; fuelKgByResource: readonly Readonly<{ id: string; massKg: number }>[]; repairByModule: readonly Readonly<{ id: string; durabilityDeltaR: number }>[] }>;
  serviceReceiptSequence: number; lastLimitingReasons: readonly Readonly<{ id: string; reason: GovernorReasonV03 }>[];
}>;
export type ShipModelStateV02 = Readonly<{ modelVersion: typeof MODEL_V02; stateVersion: typeof STATE_V2; phaseIndex: number; phaseElapsedTicks: number; governor: GovernorStateV03 }>;
export type ModuleRequestV03 = Readonly<{ id: string; requestedW: number }>;
export type GovernorEnvironmentV03 = Readonly<{ temperatureK: number; externalHeatingW: number; externalCoolingW: number }>;
export type GovernorTickInputV03 = Readonly<{ profile: GovernorProfileV03; state: GovernorStateV03; requestedMode: GovernorModeV03; requests: readonly ModuleRequestV03[]; environment: GovernorEnvironmentV03 }>;
export type WorkPackageV03 = Readonly<{
  id: string; moduleId: string; stage: StageIdV03; usefulOutputJ: number; pickupShipJ: number;
  pickupByBank: readonly Readonly<{ id: string; energyJ: number }>[]; electricJ: number;
  resourceKg: readonly Readonly<{ id: string; massKg: number }>[]; hostHeatJ: number; exportedAuxHeatJ: number;
  outward: readonly OutwardPathV03[];
}>;
export type OutwardPathV03 = Readonly<{ id: string; ownerId: string; kind: "radiation" | "working-body" | "source-exhaust"; energyJ: number; irJ: number; emJ: number }>;
export type GovernorLedgerEntryV03 = Readonly<{ id: string; ownerId: string; kind: "internal-transfer" | "external-input" | "external-output" | "conversion"; nodeId: string; counterpartyId: string; energyJ: number; resourceId: string | null; massKg: number }>;
export type GovernorLedgerV03 = Readonly<{ entries: readonly GovernorLedgerEntryV03[]; outward: readonly OutwardPathV03[]; energyResidualJ: number; energyThroughputJ: number; resources: readonly Readonly<{ id: string; residualKg: number; throughputKg: number }>[] }>;
export type GovernorDecisionV03 = Readonly<{ id: string; moduleId: string; stage: StageIdV03; reason: GovernorReasonV03; requestedJ: number; actualJ: number }>;
export type GovernorAllocationTraceV03 = Readonly<{ id: string; stage: StageIdV03; pass: "preliminary" | "final"; direction: "in" | "out"; consumerCount: number; bankCount: number; compatibilityChecks: number; allocationVisits: number; allocations: readonly Readonly<{ bankId: string; consumerId: string; energyJ: number }>[] }>;
export type GovernorTickTraceV03 = Readonly<{ tickIndex: number; stages: readonly StageIdV03[]; executionOrder: readonly string[]; allocatorCalls: readonly GovernorAllocationTraceV03[]; compatibilityChecks: number; allocationVisits: number; electricalDispatchCount: number; actualFailureChecks: number }>;
export type GovernorTickResultV03 = Readonly<{ state: GovernorStateV03; packages: readonly WorkPackageV03[]; ledger: GovernorLedgerV03; decisions: readonly GovernorDecisionV03[]; trace: GovernorTickTraceV03 }>;

export type RefusalCodeV03 = "MISSING_FIELD" | "UNKNOWN_FIELD" | "UNKNOWN_VERSION" | "INVALID_TYPE" | "INVALID_NUMBER" | "INVALID_UNIT" | "INVALID_PROVENANCE" | "DUPLICATE_ID" | "DANGLING_REFERENCE" | "INVALID_TEMPERATURE_MAP" | "INCOMPATIBLE_BANK" | "INVALID_THERMAL_BANDS" | "INADMISSIBLE_TICK" | "STATE_ID_MISMATCH" | "UNKNOWN_T_ID" | "MISSING_T_ID" | "SOURCE_MISMATCH" | "UNKNOWN_STATUS" | "UNKNOWN_OWNER" | "INVALID_EXPECTATION" | "MISSING_TOLERANCE" | "INVALID_TOLERANCE" | "OUT_OF_SCOPE" | "MISSING_REASON" | "MISSING_DEPENDENCY" | "UNEXECUTED_VECTOR";
export type GovernorRefusalV03 = Readonly<{ path: string; code: RefusalCodeV03; message: string }>;
export type ValidationResultV03<T> = Readonly<{ ok: true; value: T }> | Readonly<{ ok: false; errors: readonly GovernorRefusalV03[] }>;

export type ConformanceIdV1 = `T0${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `T${1 | 2}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `T3${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
export type ConformanceStatusV1 = "PASS" | "FAIL" | "BLOCKED" | "NOT_RUN";
export type ConformanceOwnerV1 = Readonly<{ item: "F2-G1" | "F2-G2" | "F2-G4" | "F2-G5"; path: string }>;
export type ConformanceExpectationV1 = Readonly<{ id: string; kind: "invariant" | "output"; metric: string; targetId: string | null; operator: "eq" | "lte" | "gte"; value: number | boolean; unit: SIUnit; tolerance: string }>;
export type ConformanceRecordV1 = Readonly<{ id: ConformanceIdV1; sourceCommit: string; sourceSha256: string; status: ConformanceStatusV1; scope: "IN" | "OUT"; reason: string; missingDependencies: readonly string[]; units: readonly SIUnit[]; vectorId: string; expected: readonly ConformanceExpectationV1[]; owner: ConformanceOwnerV1 }>;
export type ConformanceScenarioV1 = Readonly<{
  profileId: string; state: GovernorStateV03; requestedMode: GovernorModeV03; requests: readonly ModuleRequestV03[]; environment: GovernorEnvironmentV03;
  rebindProfileId?: string;
  parameters: readonly Readonly<{ id: string; value: number; unit: SIUnit }>[];
  durationTicks: number; events: readonly Readonly<{ id: string; atTick: number; kind: "mode" | "failure" | "external-heat" | "service" | "rebind" | "checkpoint"; targetId: string | null; mode: GovernorModeV03 | null; value: number; unit: SIUnit }>[];
  reference: Readonly<{ tickHz: 120; trajectories: readonly Readonly<{ id: "steady-exchange" | "threshold-crossing" | "resource-exhaustion" | "work-recovery-repeat"; vectorId: string; durationSeconds: number }>[] }> | null;
}>;
export type ConformanceVectorV1 = Readonly<{ id: string; sourceCommit: string; sourceSha256: string; input: ConformanceScenarioV1 }>;
export type GovernorConformanceV1 = Readonly<{ version: "governor-conformance/1"; records: readonly ConformanceRecordV1[]; profiles: readonly GovernorProfileV03[]; vectors: readonly ConformanceVectorV1[] }>;
