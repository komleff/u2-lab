import { GOVERNOR_PROFILE_VERSION, GOVERNOR_VERSION, MODEL_V02, STATE_V2, TICK_HZ, type ConformanceRecordV1, type GovernorConformanceV1, type GovernorProfileV03, type ConformanceVectorV1, type ValidationResultV03 } from "./types";
import { ContractCheckV03, SI_UNITS, GOVERNOR_MODES, enumRule, listRule, numberRule, objectRule, textRule, validateGovernorProfileV03, validateGovernorTickInputV03 } from "./schema";
import { GOVERNOR_TOLERANCES, TOLERANCE_VERSION, type GovernorToleranceIdV1 } from "./tolerances";

export const GOVERNOR_SOURCE_COMMIT = "df7e3cd699dafde5175b48a5853c2c04ece244b2" as const;
export const GOVERNOR_SOURCE_SHA256 = "3ef04723155e9b9f8e285d3bb01228eccfb254623bb2dd51e2d7c6bcd0fc9034" as const;
export const CONFORMANCE_VERSION = "governor-conformance/1" as const;
export const VECTOR_VERSION = "governor-vectors/1" as const;
export const CONFORMANCE_IDS = Object.freeze(Array.from({ length: 39 }, (_, i) => `T${String(i + 1).padStart(2, "0")}`));
const owners: Readonly<Record<string, readonly string[]>> = {
  "F2-G1": ["tests/governor-v03/allocation.test.ts", "tests/governor-v03/resource-ledger.test.ts", "tests/governor-v03/buffer-bank.test.ts", "tests/governor-v03/water-tank.test.ts", "tests/governor-v03/conservation.test.ts"],
  "F2-G2": ["tests/governor-v03/governor-tick.test.ts", "tests/governor-v03/modes-protection.test.ts", "tests/governor-v03/convergence.test.ts", "tests/governor-v03/continuation.test.ts"],
  "F2-G4": ["tests/governor-v03/service.test.ts", "tests/governor-v03/profile-rebind.test.ts", "tests/governor-v03/service-persistence.test.ts"],
  "F2-G5": ["tests/governor-v03/qualification.test.ts"],
};
// Закрытые keys означают проверяемый будущий producer, а не разбор сообщения UI.
export const CONFORMANCE_METRICS = Object.freeze({
  energyConserved: "1", signedExchange: "1", bufferFlowsZero: "1", releaseStopsAtTarget: "1", shipCoolingFirst: "1", noPassiveTransfer: "1", resourceNonnegative: "1", emptyCircuitOnlyStops: "1", h2OffAtFloor: "1", noIdleConsumption: "1", activeClosedInHotEnvironment: "1", passiveExchangeSigned: "1", tiAreaSingleOwner: "1", noNonpositiveCooling: "1", generatorLossesPreserved: "1", bufferBeforeHeater: "1", noSpontaneousWarming: "1", tankProtectionIndependent: "1", actualPowerOnly: "1", originalBufferStockOnly: "1", lateCaptureRemainingBudgetOnly: "1", quietDebtAccepted: "1", uncoveredHeatStaysInShip: "1", noQuietFallback: "1", coldH2Only: "1", criticalStopsOwnModule: "1", emergencyGeneratorNoCharge: "1", normalRecoveryPreservesState: "1", militaryHotOverride: "1", hullModePermission: "1", incompatibleBandsExplicit: "1", failureBudgetRespected: "1", restartHysteresis: "1", serviceConserved: "1", outwardSingleOwner: "1", latentHeatNotAutomaticallyIR: "1", noCoarseStepAdvantage: "1", discreteTransitionsEqual: "1", noWaterPropulsionOrReserve: "1", noDoubleShipCooling: "1", missingBrakingImpulseNotCreated: "1", permutationInvariant: "1", constrainedBankFirst: "1", allocatorBound: "1",
  bufferOutJ: "J", allocationJ: "J", shipPickupJ: "J", electricalWorkJ: "J", outwardJ: "J", coolerConsumedKg: "kg", temperatureDifferenceK: "K", cumulativeEnergyDifferenceJ: "J", resourceDifferenceKg: "kg", transitionTimeDifferenceS: "s",
} as const);
const versions = {
  governorVersion: enumRule([GOVERNOR_VERSION], "UNKNOWN_VERSION"), profileVersion: enumRule([GOVERNOR_PROFILE_VERSION], "UNKNOWN_VERSION"), modelVersion: enumRule([MODEL_V02], "UNKNOWN_VERSION"), stateVersion: enumRule([STATE_V2], "UNKNOWN_VERSION"), toleranceVersion: enumRule([TOLERANCE_VERSION], "UNKNOWN_VERSION"),
  sourceCommit: enumRule([GOVERNOR_SOURCE_COMMIT], "SOURCE_MISMATCH"), sourceSha256: enumRule([GOVERNOR_SOURCE_SHA256], "SOURCE_MISMATCH"),
};
const sourceFields = { sourceCommit: versions.sourceCommit, sourceSha256: versions.sourceSha256 };
const nullableText = (c: ContractCheckV03, v: unknown, p: string) => { if (v !== null) textRule(c, v, p); };
const expectationRule = objectRule({ id: textRule, kind: enumRule(["invariant", "output"], "INVALID_EXPECTATION"), metric: enumRule(Object.keys(CONFORMANCE_METRICS), "INVALID_EXPECTATION"), targetId: nullableText, operator: enumRule(["eq", "lte", "gte"], "INVALID_EXPECTATION"), value: (c, v, p) => { if (typeof v !== "boolean") numberRule(-Number.MAX_VALUE)(c, v, p); }, unit: enumRule(SI_UNITS, "INVALID_UNIT") }, { tolerance: textRule });
const recordRule = objectRule({ id: enumRule(CONFORMANCE_IDS, "UNKNOWN_T_ID"), ...sourceFields, status: enumRule(["PASS", "FAIL", "BLOCKED", "NOT_RUN"], "UNKNOWN_STATUS"), scope: enumRule(["IN", "OUT"]), reason: (c, v, p) => { if (typeof v !== "string") c.bad(p, "INVALID_TYPE", "Причина должна быть строкой"); }, missingDependencies: listRule(textRule), units: listRule(enumRule(SI_UNITS, "INVALID_UNIT")), vectorId: textRule, expected: listRule(expectationRule), owner: objectRule({ item: enumRule(Object.keys(owners), "UNKNOWN_OWNER"), path: textRule }) });
const eventRule = objectRule({ id: textRule, atTick: numberRule(0, Number.MAX_SAFE_INTEGER, true), kind: enumRule(["mode", "failure", "external-heat", "service", "rebind", "checkpoint"]), targetId: nullableText, mode: (c, v, p) => { if (v !== null) enumRule(GOVERNOR_MODES)(c, v, p); }, value: numberRule(-Number.MAX_VALUE), unit: enumRule(SI_UNITS, "INVALID_UNIT") });
const vectorRule = objectRule({ id: textRule, ...sourceFields, input: objectRule({ profileId: textRule, state: () => {}, requestedMode: enumRule(GOVERNOR_MODES), requests: () => {}, environment: () => {}, parameters: listRule(objectRule({ id: textRule, value: numberRule(-Number.MAX_VALUE), unit: enumRule(SI_UNITS, "INVALID_UNIT") })), durationTicks: numberRule(1, Number.MAX_SAFE_INTEGER, true), events: listRule(eventRule), reference: (c, v, p) => {
  if (v !== null) objectRule({ tickHz: enumRule([120]), trajectories: listRule(objectRule({ id: enumRule(["steady-exchange", "threshold-crossing", "resource-exhaustion", "work-recovery-repeat"]), vectorId: textRule, durationSeconds: numberRule(Number.MIN_VALUE) })) })(c, v, p);
} }, { rebindProfileId: textRule }) });
function canonical<T>(value: T): T {
  if (Array.isArray(value)) {
    const copy = value.map(canonical);
    if (copy.every(x => x && typeof x === "object" && "id" in x)) copy.sort((a, b) => String(a.id) < String(b.id) ? -1 : String(a.id) > String(b.id) ? 1 : 0);
    return copy as T;
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, canonical(item)])) as T;
  return value;
}
export function loadGovernorConformanceV1(manifest: unknown, vectors: unknown): ValidationResultV03<GovernorConformanceV1> {
  const c = new ContractCheckV03();
  objectRule({ version: enumRule([CONFORMANCE_VERSION], "UNKNOWN_VERSION"), ...versions, records: listRule(recordRule) })(c, manifest, "manifest");
  objectRule({ version: enumRule([VECTOR_VERSION], "UNKNOWN_VERSION"), ...versions, profiles: listRule((cc, input, path) => { const result = validateGovernorProfileV03(input); if (!result.ok) cc.errors.push(...result.errors.map(e => ({ ...e, path: `${path}.${e.path}` }))); }), vectors: listRule(vectorRule) })(c, vectors, "vectors");
  if (c.errors.length) return c.result(undefined);
  const m = manifest as { records: readonly ConformanceRecordV1[] }, data = vectors as { profiles: readonly GovernorProfileV03[]; vectors: readonly ConformanceVectorV1[] };
  for (const id of CONFORMANCE_IDS) if (!m.records.some(r => r.id === id)) c.bad("manifest.records", "MISSING_T_ID", `Отсутствует ${id}`);
  const used = new Set<string>();
  for (const record of m.records) {
    const path = `manifest.${record.id}`;
    if (!record.expected.length || !record.units.length) c.bad(path, "INVALID_EXPECTATION", "Нужны непустые expected и units");
    if (!owners[record.owner.item]?.includes(record.owner.path)) c.bad(`${path}.owner`, "UNKNOWN_OWNER", "Owner должен адресовать утверждённый later item/path");
    const isOut = record.id === "T35" || record.id === "T36";
    if (isOut && (record.scope !== "OUT" || record.status !== "NOT_RUN") || !isOut && record.scope !== "IN") c.bad(path, "OUT_OF_SCOPE", "Только T35/T36 имеют OUT и exact NOT_RUN");
    if (!record.reason.trim()) c.bad(`${path}.reason`, "MISSING_REASON", "Статус требует явной причины; OUT должен объяснять отложенное изделие");
    if (record.status === "BLOCKED" && (!record.missingDependencies.length || record.missingDependencies.some(x => !x.startsWith("u2-ttx:")))) c.bad(path, "MISSING_DEPENDENCY", "BLOCKED допустим только с явной отсутствующей U2 game-data dependency");
    if (record.status === "PASS" || record.status === "FAIL") c.bad(path, "UNEXECUTED_VECTOR", "G0 хранит inputs/expectations, а не runtime results");
    const vector = data.vectors.find(v => v.id === record.vectorId);
    if (!vector) c.bad(`${path}.vectorId`, "DANGLING_REFERENCE", "Неизвестный vector ID");
    if (used.has(record.vectorId)) c.bad(`${path}.vectorId`, "DUPLICATE_ID", "Vector принадлежит одному T-ID"); used.add(record.vectorId);
    if (record.id === "T33" && vector?.input.reference === null) c.bad(`${path}.vectorId`, "INVALID_EXPECTATION", "T33 требует четыре reference trajectories");
    if (record.id === "T31" && !vector?.input.rebindProfileId) c.bad(`${path}.vectorId`, "INVALID_EXPECTATION", "T31 требует exact destination profile");
    const profile = data.profiles.find(p => p.id === vector?.input.profileId);
    const targetIds = new Set(profile ? [profile.ship.id, ...profile.modules.map(x => x.id), ...profile.banks.map(x => x.id), ...profile.buffers.map(x => x.id), ...profile.resources.map(x => x.id), ...profile.surfaces.map(x => x.id), ...profile.thermoinverters.map(x => x.id), ...profile.hydrogenCoolers.map(x => x.id), ...profile.waterTanks.map(x => x.id), ...profile.electrical.sources.map(x => x.id), ...profile.electrical.loads.map(x => x.id)] : []);
    for (const expectation of record.expected) {
      const ep = `${path}.expected.${expectation.id}`;
      if (expectation.targetId !== null && profile && !targetIds.has(expectation.targetId)) c.bad(`${ep}.targetId`, "DANGLING_REFERENCE", "Expected target должен быть physical owner из vector profile");
      const metricUnit = CONFORMANCE_METRICS[expectation.metric as keyof typeof CONFORMANCE_METRICS];
      if (metricUnit !== expectation.unit || !record.units.includes(expectation.unit) || expectation.kind === "invariant" !== (typeof expectation.value === "boolean") || expectation.kind === "invariant" !== (metricUnit === "1")) c.bad(ep, "INVALID_EXPECTATION", "Expected kind/value/unit не соответствуют typed metric");
      if (!expectation.tolerance) { c.bad(ep, "MISSING_TOLERANCE", "Каждый expected output/invariant требует applicable tolerance"); continue; }
      const tolerance = GOVERNOR_TOLERANCES[expectation.tolerance as GovernorToleranceIdV1];
      if (!tolerance || tolerance.unit !== expectation.unit) c.bad(ep, "INVALID_TOLERANCE", "Tolerance отсутствует или имеет другую SI unit");
    }
  }
  for (const vector of data.vectors) {
    const path = `vectors.${vector.id}`, input = vector.input;
    if (!used.has(vector.id)) c.bad(path, "DANGLING_REFERENCE", "Orphan vector не имеет T-ID");
    const profile = data.profiles.find(p => p.id === input.profileId);
    if (!profile) { c.bad(`${path}.profileId`, "DANGLING_REFERENCE", "Неизвестный profile ID"); continue; }
    if (input.rebindProfileId && !data.profiles.some(p => p.id === input.rebindProfileId)) c.bad(`${path}.rebindProfileId`, "DANGLING_REFERENCE", "Неизвестный destination profile ID");
    const tick = validateGovernorTickInputV03({ profile, state: input.state, requestedMode: input.requestedMode, requests: input.requests, environment: input.environment });
    if (!tick.ok) c.errors.push(...tick.errors.map(e => ({ ...e, path: `${path}.${e.path}` })));
    for (const event of input.events) {
      if (event.atTick > input.durationTicks) c.bad(path, "INVALID_NUMBER", "Event вне длительности fixture");
      const unit = event.kind === "external-heat" ? ["J"] : event.kind === "service" ? ["J", "kg", "1"] : ["1"];
      if (!unit.includes(event.unit) || event.kind === "mode" && event.mode === null || event.kind !== "mode" && event.mode !== null) c.bad(path, "INVALID_UNIT", "Event имеет typed SI payload");
      if (event.targetId !== null && ![...profile.modules, ...profile.resources, ...profile.banks, ...profile.waterTanks, profile.ship].some(x => x.id === event.targetId)) c.bad(path, "DANGLING_REFERENCE", "Event ссылается на неизвестный physical ID");
    }
    if (input.reference !== null) {
      const expected = { "steady-exchange": 60, "threshold-crossing": 30, "resource-exhaustion": 120, "work-recovery-repeat": 180 };
      if (input.reference.trajectories.length !== 4 || input.reference.trajectories.some(x => expected[x.id] !== x.durationSeconds)) c.bad(`${path}.reference`, "INVALID_EXPECTATION", "T33 требует четыре exact physical trajectories из §3.6");
      for (const trajectory of input.reference.trajectories) {
        const target = data.vectors.find(v => v.id === trajectory.vectorId);
        if (!target) c.bad(`${path}.reference.${trajectory.id}`, "DANGLING_REFERENCE", "Reference trajectory требует stable vector ID");
        else if (target.input.durationTicks !== trajectory.durationSeconds * TICK_HZ) c.bad(`${path}.reference.${trajectory.id}`, "INVALID_EXPECTATION", "Reference input обязан покрывать exact physical duration");
      }
    }
  }
  return c.result(canonical({ version: CONFORMANCE_VERSION, records: m.records, profiles: data.profiles, vectors: data.vectors }));
}
