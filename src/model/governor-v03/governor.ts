import { allocateStage, type AllocationConsumerV03 } from "./allocation";
import { bufferTemperature, createBufferTransaction, transferBuffer, type BufferTransactionV03 } from "./buffer-bank";
import { auditConservation, finite, immutableCopy, lexical, transferEntries } from "./conservation";
import { integrateOwnerEnergyV03, PRODUCTION_CLOCK_V03, shipTemperatureV03, signedRadiationJ, tickSecondsV03, type ClockPolicyV03 } from "./integrator";
import { hasCommonCriticalBandV03, moduleThermalFactorV03, resolveModeV03 } from "./modes";
import { applyProtectionV03 } from "./protection";
import { commitResources, createResourceLedger, reserveResources, type ResourceLedgerV03 } from "./resource-ledger";
import { validateGovernorTickInputV03 } from "./schema";
import { GOVERNOR_STAGE_ORDER_V03, GovernorTraceBuilderV03 } from "./trace";
import { exchangeWater } from "./water-tank";
import type {
  GovernorAllocationTraceV03,
  BufferBankProfileV03,
  GovernorDecisionV03,
  GovernorLedgerEntryV03,
  GovernorProfileV03,
  GovernorReasonV03,
  GovernorRefusalV03,
  GovernorTickInputV03,
  GovernorTickResultV03,
  OutwardPathV03,
  StageIdV03,
  WorkPackageV03,
} from "./types";

type ModulePlan = {
  module: GovernorProfileV03["modules"][number];
  stage: StageIdV03;
  requestedJ: number;
  desiredJ: number;
  powerCappedJ: number;
  resourceCappedJ: number;
  reason: GovernorReasonV03;
  deliveredElectricCapJ: number;
  massKgPerUsefulJ: number;
  reservedMassKg: number;
  pickupShipJ: number;
  pickupByBank: { id: string; energyJ: number }[];
  actualJ: number;
};

const materiallyLess = (actual: number, requested: number, absolute: number) =>
  requested - actual > absolute + 1e-10 * Math.max(Math.abs(actual), Math.abs(requested));

export class GovernorTickRefusalError extends Error {
  readonly errors: readonly GovernorRefusalV03[];
  constructor(errors: readonly GovernorRefusalV03[]) {
    super("Governor tick input refused");
    this.name = "GovernorTickRefusalError";
    this.errors = immutableCopy(errors);
  }
}

const moduleStage = (kind: GovernorProfileV03["modules"][number]["kind"]): StageIdV03 => {
  if (kind === "heater") return "1";
  if (kind === "h2-cooler" || kind === "water-cooler") return "6";
  return "4";
};

const requestMap = (input: GovernorTickInputV03) => new Map(input.requests.map(request => [request.id, request.requestedW]));

function externalEntry(
  id: string,
  ownerId: string,
  nodeId: string,
  counterpartyId: string,
  energyJ: number,
  resourceId: string | null = null,
  massKg = 0,
): GovernorLedgerEntryV03 {
  return Object.freeze({
    id,
    ownerId,
    kind: energyJ >= 0 && massKg >= 0 ? "external-input" : "external-output",
    nodeId,
    counterpartyId,
    energyJ,
    resourceId,
    massKg,
  });
}

function sourceTemperatureFloor(profile: GovernorProfileV03, plan: ModulePlan, mode: string): number {
  const h2 = profile.hydrogenCoolers.find(path => path.moduleId === plan.module.id);
  if (h2) return mode === "Quiet" ? Math.max(h2.floorK.value, profile.modes.quietOffK.value) : h2.floorK.value;
  return plan.module.minSourceTemperatureK.value;
}

function interpolateSpecificExportJPerKg(
  path: GovernorProfileV03["hydrogenCoolers"][number],
  temperatureK: number,
): number {
  const points = path.specificExportByTemperature;
  if (temperatureK <= points[0].temperatureK.value) return points[0].specificEnergyJPerKg.value;
  const last = points[points.length - 1];
  if (temperatureK >= last.temperatureK.value) return last.specificEnergyJPerKg.value;
  for (let index = 1; index < points.length; index++) {
    const upper = points[index];
    const lower = points[index - 1];
    if (temperatureK > upper.temperatureK.value) continue;
    const fraction = (temperatureK - lower.temperatureK.value)
      / (upper.temperatureK.value - lower.temperatureK.value);
    return lower.specificEnergyJPerKg.value
      + fraction * (upper.specificEnergyJPerKg.value - lower.specificEnergyJPerKg.value);
  }
  return last.specificEnergyJPerKg.value;
}

function massKgPerUsefulJ(
  profile: GovernorProfileV03,
  module: GovernorProfileV03["modules"][number],
  sourceTemperatureK: number,
): number {
  const path = profile.hydrogenCoolers.find(item => item.moduleId === module.id);
  if (!path) return module.massKgPerJ.value;
  const exportedAuxJPerJ = module.auxHeatDestination === "export" ? module.auxHeatJPerJ.value : 0;
  const outwardJPerUsefulJ = 1 + module.electricJPerJ.value + exportedAuxJPerJ;
  return outwardJPerUsefulJ / interpolateSpecificExportJPerKg(path, sourceTemperatureK);
}

function bankAvailableJ(profile: BufferBankProfileV03, energyJ: number, seconds: number, minTemperatureK: number): number {
  const temperatureK = bufferTemperature(profile, energyJ);
  return Math.max(0, Math.min(
    energyJ,
    profile.outputW.value * seconds,
    profile.sharedW.value * seconds,
    profile.conductanceWPerK.value * Math.max(0, temperatureK - minTemperatureK) * seconds,
  ));
}

function allocationTrace(
  pass: GovernorAllocationTraceV03["pass"],
  plans: readonly ModulePlan[],
  profile: GovernorProfileV03,
  transactions: ReadonlyMap<string, BufferTransactionV03>,
  seconds: number,
  trace: GovernorTraceBuilderV03,
): ReturnType<typeof allocateStage> {
  const consumers: AllocationConsumerV03[] = plans
    .filter(plan => plan.module.compatibleBankIds.length > 0)
    .map(plan => ({
      id: plan.module.id,
      capJ: pass === "preliminary" ? plan.desiredJ : plan.resourceCappedJ,
      resourceId: null,
      massKgPerJ: 0,
      compatibleBankIds: plan.module.compatibleBankIds,
    }));
  const banks = [...profile.banks].sort((a, b) => lexical(a.id, b.id)).map(bank => {
    const tx = transactions.get(bank.id)!;
    const floors = consumers
      .filter(consumer => consumer.compatibleBankIds.includes(bank.id))
      .map(consumer => plans.find(plan => plan.module.id === consumer.id)!.module.minSourceTemperatureK.value);
    const availableJ = tx.inputJ > 0 ? 0 : bankAvailableJ(bank, tx.originalEnergyJ, seconds, floors.length ? Math.min(...floors) : Number.MAX_VALUE);
    return { profile: bank, availableJ: Math.min(availableJ, Math.max(0, bank.outputW.value * seconds - tx.outputJ), Math.max(0, bank.sharedW.value * seconds - tx.inputJ - tx.outputJ)) };
  });
  const result = allocateStage({
    demandJ: consumers.reduce((sum, consumer) => sum + consumer.capJ, 0),
    banks,
    consumers,
    resources: [],
  });
  trace.allocation({
    id: `stage-6:${pass}`,
    stage: "6",
    pass,
    direction: "out",
    consumerCount: consumers.length,
    bankCount: banks.length,
    compatibilityChecks: result.compatibilityChecks,
    allocationVisits: result.allocationVisits,
    allocations: result.allocations,
  });
  return result;
}

function reserveUpTo(
  ledger: ResourceLedgerV03,
  remaining: Map<string, number>,
  flowRemaining: Map<string, number>,
  ownerId: string,
  resourceId: string,
  wantedKg: number,
): { ledger: ResourceLedgerV03; reservedKg: number } {
  const reservedKg = Math.max(0, Math.min(wantedKg, flowRemaining.get(resourceId) ?? 0, remaining.get(resourceId) ?? 0));
  remaining.set(resourceId, finite((remaining.get(resourceId) ?? 0) - reservedKg, "reservation remainder", 0));
  flowRemaining.set(resourceId, finite((flowRemaining.get(resourceId) ?? 0) - reservedKg, "flow reservation remainder", 0));
  return { ledger: reserveResources(ledger, ownerId, [{ id: resourceId, massKg: reservedKg }]), reservedKg };
}

export function stepGovernorV03(input: GovernorTickInputV03): GovernorTickResultV03 {
  return stepGovernorV03WithClock(input, PRODUCTION_CLOCK_V03);
}

/** Reference entrypoint только для тестов. Production callers используют stepGovernorV03. */
export function stepGovernorV03WithClock(
  input: GovernorTickInputV03,
  clock: ClockPolicyV03,
  validation: "full" | "validated-continuation" = "full",
): GovernorTickResultV03 {
  const seconds = tickSecondsV03(clock);
  const checked = validation === "full" ? validateGovernorTickInputV03(input) : { ok: true as const, value: input };
  if (!checked.ok) throw new GovernorTickRefusalError(checked.errors);
  const tick = checked.value;
  const { profile, state } = tick;
  const trace = new GovernorTraceBuilderV03();
  const initialShipTemperatureK = shipTemperatureV03(profile, state.shipEnergyJ);
  const mode = resolveModeV03(profile, state, tick.requestedMode, initialShipTemperatureK, tick.environment.temperatureK);
  const protection = applyProtectionV03(profile, state, initialShipTemperatureK, clock.tickHz);
  trace.actualFailureChecks = protection.actualFailureChecks;
  const protectedById = new Map(protection.modules.map(module => [module.id, module]));
  const requested = requestMap(tick);
  const requestedIds = new Set(tick.requests.filter(item => item.requestedW > 0).map(item => item.id));
  const commonCriticalBand = hasCommonCriticalBandV03(profile, requestedIds);
  const decisions: GovernorDecisionV03[] = [...mode.decisions, ...protection.decisions];
  if (!commonCriticalBand) {
    for (const module of profile.modules.filter(item => requestedIds.has(item.id)).sort((a, b) => lexical(a.id, b.id))) {
      decisions.push({
        id: `compatibility:${module.id}:incompatible-thermal-bands`,
        moduleId: module.id,
        stage: "0",
        reason: "incompatible-thermal-bands",
        requestedJ: 0,
        actualJ: 0,
      });
    }
  }
  const plans: ModulePlan[] = [];

  for (const module of [...profile.modules].sort((a, b) => lexical(a.id, b.id))) {
    if (module.kind === "generator") continue;
    const stage = moduleStage(module.kind);
    const requestW = module.kind === "heater" && mode.shipColdProtection
      ? module.requestCapW.value
      : requested.get(module.id) ?? 0;
    const requestedJ = Math.min(requestW, module.requestCapW.value) * seconds;
    const moduleState = protectedById.get(module.id)!;
    let desiredJ = Math.min(requestedJ, module.capW.value * seconds);
    let reason: GovernorReasonV03 = "idle";
    if (moduleState.durabilityStopped) { desiredJ = 0; reason = "durability-failure"; }
    else if (moduleState.thermalStopped) { desiredJ = 0; reason = moduleState.stopReasons.includes("critical-cold-stop") ? "critical-cold-stop" : "critical-hot-stop"; }
    else if (!commonCriticalBand && module.id !== profile.modes.vitalModuleIds[0]) { desiredJ = 0; reason = "incompatible-thermal-bands"; }
    else {
      const thermal = moduleThermalFactorV03(profile, mode.effectiveMode, module, initialShipTemperatureK);
      desiredJ *= thermal.factor;
      if (thermal.factor < 1) reason = thermal.reason;
    }
    const h2 = profile.hydrogenCoolers.find(path => path.moduleId === module.id);
    if (mode.effectiveMode === "Quiet" && (module.kind === "active-radiator" || module.kind === "thermoinverter" || h2?.mode === "ordinary")) {
      desiredJ = 0;
      reason = "quiet-hot-path-forbidden";
    }
    if (mode.effectiveMode === "Quiet" && h2?.mode === "cold" && !mode.quietColdCooling) {
      desiredJ = 0;
      reason = "temperature-head";
    }
    if (mode.shipColdProtection && ["active-radiator", "thermoinverter", "h2-cooler", "water-cooler"].includes(module.kind)) {
      desiredJ = 0;
      reason = "ship-cold-protection";
    }
    if (h2?.mode === "ordinary" && initialShipTemperatureK <= h2.floorK.value) {
      desiredJ = 0;
      reason = "temperature-head";
    }
    if (module.kind === "active-radiator" && tick.environment.temperatureK >= initialShipTemperatureK) {
      desiredJ = 0;
      reason = "nonpositive-net-cooling";
    }
    plans.push({
      module,
      stage,
      requestedJ,
      desiredJ,
      powerCappedJ: desiredJ,
      resourceCappedJ: desiredJ,
      reason,
      deliveredElectricCapJ: 0,
      massKgPerUsefulJ: massKgPerUsefulJ(profile, module, initialShipTemperatureK),
      reservedMassKg: 0,
      pickupShipJ: 0,
      pickupByBank: [],
      actualJ: 0,
    });
  }

  const transactions = new Map(profile.banks.map(bank => {
    const energyJ = state.bufferEnergyJByBank.find(item => item.id === bank.id)!.energyJ;
    return [bank.id, createBufferTransaction(bank, energyJ, seconds)] as const;
  }));

  const activeStages = new Set<StageIdV03>(["0", "9"]);
  let shipWorkingEnergyJ = state.shipEnergyJ;
  const captureIntoBanks = (stage: "5Q" | "8", requestedJ: number, ownerId: string) => {
    let remainingJ = Math.max(0, requestedJ);
    for (const bank of [...profile.banks].sort((a, b) => lexical(a.id, b.id))) {
      if (remainingJ <= 0) break;
      const tx = transactions.get(bank.id)!;
      if (tx.outputJ > 0) continue;
      const shipTemperatureK = shipTemperatureV03(profile, shipWorkingEnergyJ);
      const bankTemperatureK = bufferTemperature(bank, tx.originalEnergyJ);
      const headK = shipTemperatureK - bankTemperatureK;
      if (headK <= 0) continue;
      const remainingConductance = Math.max(0, bank.conductanceWPerK.value * seconds - tx.conductanceUsedJPerK) * headK;
      const amountJ = Math.min(
        remainingJ,
        bank.capacityJ.value - tx.energyJ,
        bank.inputW.value * seconds - tx.inputJ,
        bank.sharedW.value * seconds - tx.inputJ - tx.outputJ,
        remainingConductance,
      );
      if (amountJ <= 0) continue;
      const next = transferBuffer(tx, { id: `${stage}:${bank.id}:${ownerId}`, ownerId, otherNodeId: "ship", direction: "in", energyJ: amountJ, otherTemperatureK: shipTemperatureK });
      transactions.set(bank.id, next);
      shipWorkingEnergyJ -= amountJ;
      remainingJ -= amountJ;
      activeStages.add(stage);
    }
    return requestedJ - remainingJ;
  };

  const releaseFromBanks = (stage: "1" | "7", targetK: number) => {
    let needJ = Math.max(0, targetK * profile.ship.heatCapacityJPerK.value - shipWorkingEnergyJ);
    for (const bank of [...profile.banks].sort((a, b) => lexical(a.id, b.id))) {
      if (needJ <= 0) break;
      const tx = transactions.get(bank.id)!;
      if (tx.inputJ > 0) continue;
      const shipTemperatureK = shipTemperatureV03(profile, shipWorkingEnergyJ);
      const bankTemperatureK = bufferTemperature(bank, tx.originalEnergyJ);
      const headK = bankTemperatureK - shipTemperatureK;
      if (headK <= 0) continue;
      const remainingConductance = Math.max(0, bank.conductanceWPerK.value * seconds - tx.conductanceUsedJPerK) * headK;
      const amountJ = Math.min(
        needJ,
        tx.originalEnergyJ - tx.outputJ,
        bank.outputW.value * seconds - tx.outputJ,
        bank.sharedW.value * seconds - tx.inputJ - tx.outputJ,
        remainingConductance,
      );
      if (amountJ <= 0) continue;
      const next = transferBuffer(tx, { id: `${stage}:${bank.id}:ship-release`, ownerId: "governor", otherNodeId: "ship", direction: "out", energyJ: amountJ, otherTemperatureK: shipTemperatureK });
      transactions.set(bank.id, next);
      shipWorkingEnergyJ += amountJ;
      needJ -= amountJ;
      activeStages.add(stage);
    }
  };

  if (mode.shipColdProtection) releaseFromBanks("1", profile.modes.coldOffK.value);
  if (mode.effectiveMode === "Quiet" && mode.quietHoldTemperatureK !== null) {
    captureIntoBanks("5Q", Math.max(0, shipWorkingEnergyJ - mode.quietHoldTemperatureK * profile.ship.heatCapacityJPerK.value), "quiet-debt");
  }

  allocationTrace("preliminary", plans, profile, transactions, seconds, trace);

  const initialResources = state.resourceMassKg.map(resource => ({ id: resource.id, massKg: resource.massKg }));
  let resourceLedger = createResourceLedger(initialResources);
  const resourceRemaining = new Map(initialResources.map(resource => [resource.id, resource.massKg]));
  const resourceFlowRemaining = new Map(profile.resources.map(resource => [resource.id, resource.maxFlowKgPerS.value * seconds]));
  const reservationByOwner = new Map<string, { resourceId: string; massKg: number }>();

  for (const plan of plans.filter(item => item.module.kind === "ordinary" && item.module.resourceId !== null)) {
    const resourceId = plan.module.resourceId!;
    const reserved = reserveUpTo(resourceLedger, resourceRemaining, resourceFlowRemaining, `module:${plan.module.id}`, resourceId, plan.desiredJ * plan.massKgPerUsefulJ);
    resourceLedger = reserved.ledger;
    reservationByOwner.set(`module:${plan.module.id}`, { resourceId, massKg: reserved.reservedKg });
    plan.reservedMassKg = reserved.reservedKg;
  }

  const preliminaryElectricJ = plans.reduce((sum, plan) => sum + plan.desiredJ * plan.module.electricJPerJ.value, 0);
  const sourceReservation = new Map<string, { resourceId: string; massKg: number }>();
  for (const source of [...profile.electrical.sources].sort((a, b) => lexical(a.id, b.id))) {
    if (source.resourceId === null || source.fuelJPerKg === null) continue;
    const explicitJ = Math.min(requested.get(source.moduleId) ?? 0, source.maxOutputW.value) * seconds;
    const wantedOutputJ = Math.min(source.maxOutputW.value * seconds, Math.max(explicitJ, preliminaryElectricJ));
    const wantedKg = wantedOutputJ / (source.fuelJPerKg.value * source.efficiency.value);
    const ownerId = `source:${source.id}`;
    const reserved = reserveUpTo(resourceLedger, resourceRemaining, resourceFlowRemaining, ownerId, source.resourceId, wantedKg);
    resourceLedger = reserved.ledger;
    sourceReservation.set(source.id, { resourceId: source.resourceId, massKg: reserved.reservedKg });
  }

  const resourcePlans = plans.filter(plan => plan.module.resourceId !== null && plan.module.kind !== "ordinary" && plan.desiredJ > 0);
  const resourcePlansById = new Map<string, ModulePlan[]>();
  for (const plan of resourcePlans) {
    const resourceId = plan.module.resourceId!;
    resourcePlansById.set(resourceId, [...(resourcePlansById.get(resourceId) ?? []), plan]);
  }
  for (const [resourceId, grouped] of resourcePlansById) {
    const wantedKg = grouped.reduce((sum, plan) => sum + plan.desiredJ * plan.massKgPerUsefulJ, 0);
    const availableKg = Math.min(resourceRemaining.get(resourceId) ?? 0, resourceFlowRemaining.get(resourceId) ?? 0);
    const gamma = wantedKg === 0 ? 1 : Math.min(1, availableKg / wantedKg);
    const earlierRequestedOwner = plans.some(plan => plan.module.kind === "ordinary"
      && plan.module.resourceId === resourceId
      && plan.requestedJ > 0)
      || profile.electrical.sources.some(source => source.resourceId === resourceId
        && (requested.get(source.moduleId) ?? 0) > 0);
    for (const plan of grouped.sort((a, b) => lexical(a.module.id, b.module.id))) {
      const massKg = plan.desiredJ * plan.massKgPerUsefulJ * gamma;
      const ownerId = `module:${plan.module.id}`;
      const reserved = reserveUpTo(resourceLedger, resourceRemaining, resourceFlowRemaining, ownerId, resourceId, massKg);
      resourceLedger = reserved.ledger;
      reservationByOwner.set(ownerId, { resourceId, massKg: reserved.reservedKg });
      plan.reservedMassKg = reserved.reservedKg;
      if (materiallyLess(availableKg, wantedKg, 1e-12) || earlierRequestedOwner) plan.reason = "resource-reserved";
    }
  }

  trace.electricalDispatchCount++;
  const storageCapJ = Math.min(state.electricalChargeJ, profile.electrical.storage.maxDischargeW.value * seconds);
  const generatorCapJ = [...profile.electrical.sources].reduce((sum, source) => {
    const reservation = sourceReservation.get(source.id);
    const fuelCapJ = reservation && source.fuelJPerKg
      ? reservation.massKg * source.fuelJPerKg.value * source.efficiency.value
      : source.resourceId === null ? Number.MAX_VALUE : 0;
    const quietAllowed = mode.effectiveMode !== "Quiet"
      || state.electricalChargeJ / profile.electrical.storage.capacityJ.value < profile.modes.quietEmergencyChargeFraction.value;
    return sum + (quietAllowed ? Math.min(source.maxOutputW.value * seconds, fuelCapJ) : 0);
  }, 0);
  let electricalRemainingJ = storageCapJ + generatorCapJ;
  for (const plan of plans) {
    const electricWantedJ = plan.desiredJ * plan.module.electricJPerJ.value;
    const deliveredJ = Math.min(electricWantedJ, electricalRemainingJ);
    electricalRemainingJ -= deliveredJ;
    plan.deliveredElectricCapJ = deliveredJ;
    if (plan.module.electricJPerJ.value > 0) {
      plan.powerCappedJ = Math.min(plan.desiredJ, deliveredJ / plan.module.electricJPerJ.value);
      if (materiallyLess(plan.powerCappedJ, plan.desiredJ, 1e-6)) plan.reason = "power-limited";
    }
    if (plan.module.resourceId !== null && plan.massKgPerUsefulJ > 0) {
      plan.resourceCappedJ = Math.min(plan.powerCappedJ, plan.reservedMassKg / plan.massKgPerUsefulJ);
      if (plan.reason !== "resource-reserved" && (resourceRemaining.get(plan.module.resourceId) ?? 0) <= 1e-12 && plan.desiredJ > 0) plan.reason = "resource-empty";
      else if (materiallyLess(plan.resourceCappedJ, plan.powerCappedJ, 1e-6)) plan.reason = "resource-reserved";
    } else plan.resourceCappedJ = plan.powerCappedJ;
  }

  const finalAllocation = allocationTrace("final", plans, profile, transactions, seconds, trace);
  const allocatedByModule = new Map<string, { id: string; energyJ: number }[]>();
  for (const allocation of finalAllocation.allocations) {
    const values = allocatedByModule.get(allocation.consumerId) ?? [];
    values.push({ id: allocation.bankId, energyJ: allocation.energyJ });
    allocatedByModule.set(allocation.consumerId, values);
  }

  const packages: WorkPackageV03[] = [];
  const outward: OutwardPathV03[] = [];
  const entries: GovernorLedgerEntryV03[] = [];
  let entrySequence = 0;
  const nextId = (label: string) => `${String(entrySequence++).padStart(5, "0")}:${label}`;
  let hostHeatJ = 0;
  let electricalWantedActualJ = 0;

  for (const plan of plans) {
    const module = plan.module;
    if (module.kind === "heater") {
      const remainingColdJ = Math.max(0, profile.modes.coldOffK.value * profile.ship.heatCapacityJPerK.value - shipWorkingEnergyJ);
      plan.actualJ = Math.min(plan.resourceCappedJ, remainingColdJ);
      shipWorkingEnergyJ += plan.actualJ;
      if (plan.actualJ > 0) activeStages.add("1");
    } else if (["active-radiator", "thermoinverter", "h2-cooler", "water-cooler"].includes(module.kind)) {
      const floorK = sourceTemperatureFloor(profile, plan, mode.effectiveMode);
      const shipAvailableJ = Math.max(0, shipWorkingEnergyJ - floorK * profile.ship.heatCapacityJPerK.value);
      plan.pickupShipJ = Math.min(plan.resourceCappedJ, shipAvailableJ);
      shipWorkingEnergyJ -= plan.pickupShipJ;
      let remainingJ = plan.resourceCappedJ - plan.pickupShipJ;
      for (const allocation of allocatedByModule.get(module.id) ?? []) {
        if (remainingJ <= 0) break;
        const tx = transactions.get(allocation.id)!;
        const amountJ = Math.min(allocation.energyJ, remainingJ);
        if (amountJ <= 0) continue;
        try {
          const next = transferBuffer(tx, { id: `6:${allocation.id}:${module.id}`, ownerId: module.id, otherNodeId: `module:${module.id}`, direction: "out", energyJ: amountJ, otherTemperatureK: floorK });
          transactions.set(allocation.id, next);
          plan.pickupByBank.push({ id: allocation.id, energyJ: amountJ });
          remainingJ -= amountJ;
        } catch {
          plan.reason = "temperature-head";
        }
      }
      plan.actualJ = plan.pickupShipJ + plan.pickupByBank.reduce((sum, item) => sum + item.energyJ, 0);
      if (plan.actualJ > 0) activeStages.add(plan.stage);
    } else {
      plan.actualJ = plan.resourceCappedJ;
      if (plan.actualJ > 0) activeStages.add(plan.stage);
    }
    const electricJ = plan.actualJ * module.electricJPerJ.value;
    electricalWantedActualJ += electricJ;
    const moduleHostHeatJ = plan.actualJ * module.auxHeatJPerJ.value * (module.auxHeatDestination === "ship" ? 1 : 0);
    const exportedAuxHeatJ = plan.actualJ * module.auxHeatJPerJ.value * (module.auxHeatDestination === "export" ? 1 : 0);
    hostHeatJ += moduleHostHeatJ;
    const resourceKg = module.resourceId === null || plan.massKgPerUsefulJ === 0 ? [] : [{ id: module.resourceId, massKg: plan.actualJ * plan.massKgPerUsefulJ }];
    const outwardEnergyJ = ["active-radiator", "thermoinverter", "h2-cooler", "water-cooler"].includes(module.kind)
      ? plan.actualJ + electricJ + exportedAuxHeatJ
      : 0;
    const path: OutwardPathV03[] = outwardEnergyJ > 0 ? [{
      id: `outward:${module.id}:${state.tickIndex}`,
      ownerId: module.id,
      kind: module.kind === "h2-cooler" || module.kind === "water-cooler" ? "working-body" : "radiation",
      energyJ: outwardEnergyJ,
      irJ: outwardEnergyJ,
      emJ: 0,
    }] : [];
    outward.push(...path);
    if (plan.actualJ > 0) packages.push({
      id: `package:${module.id}:${state.tickIndex}`,
      moduleId: module.id,
      stage: plan.stage,
      usefulOutputJ: plan.actualJ,
      pickupShipJ: plan.pickupShipJ,
      pickupByBank: [...plan.pickupByBank].sort((a, b) => lexical(a.id, b.id)),
      electricJ,
      resourceKg,
      hostHeatJ: moduleHostHeatJ,
      exportedAuxHeatJ,
      outward: path,
    });
    if (plan.requestedJ > 0 || plan.reason !== "idle") decisions.push({
      id: `module:${module.id}:${plan.reason}`,
      moduleId: module.id,
      stage: plan.stage,
      reason: plan.reason,
      requestedJ: plan.requestedJ,
      actualJ: plan.actualJ,
    });
  }

  const waterStates: { id: string; enthalpyJ: number; phase: "liquid" | "mixed" | "solid" }[] = state.waterEnthalpyJByTank.map(item => ({ ...item }));
  for (const tank of [...profile.waterTanks].sort((a, b) => lexical(a.id, b.id))) {
    const index = waterStates.findIndex(item => item.id === tank.id);
    const current = waterStates[index];
    const massKg = state.resourceMassKg.find(item => item.id === tank.resourceId)!.massKg;
    const heatCapacityJPerK = massKg * tank.heatCapacityJPerKgK.value;
    const protectionTargetJ = Math.max(0, heatCapacityJPerK * (tank.protectionOffK.value - tank.referenceTemperatureK.value) - current.enthalpyJ);
    const exchanged = exchangeWater({
      profile: tank,
      resources: state.resourceMassKg,
      state: current,
      envelope: { minTemperatureK: profile.numerical.minEnvironmentK.value, maxTemperatureK: profile.numerical.maxEnvironmentK.value },
      protectionActive: current.enthalpyJ <= heatCapacityJPerK * (tank.protectionOnK.value - tank.referenceTemperatureK.value),
      shipTemperatureK: shipTemperatureV03(profile, shipWorkingEnergyJ),
      seconds,
      requestedJ: protectionTargetJ,
      id: `1:water:${tank.id}:${state.tickIndex}`,
      ownerId: tank.id,
      shipNodeId: "ship",
    });
    waterStates[index] = { id: tank.id, ...exchanged.state };
    shipWorkingEnergyJ -= exchanged.exchangeJ;
    entries.push(...exchanged.entries);
    if (exchanged.protectionActive) {
      activeStages.add("1");
      decisions.push({ id: `tank:${tank.id}:protection`, moduleId: tank.id, stage: "1", reason: "tank-cold-protection", requestedJ: protectionTargetJ, actualJ: exchanged.exchangeJ });
    }
  }

  if (mode.effectiveMode !== "Quiet" && !mode.shipColdProtection && shipTemperatureV03(profile, shipWorkingEnergyJ) < profile.modes.normalTargetK.value) {
    releaseFromBanks("7", profile.modes.normalTargetK.value);
  }

  const externalHeatingJ = tick.environment.externalHeatingW * seconds;
  const grossLateHeatJ = externalHeatingJ + hostHeatJ;
  shipWorkingEnergyJ += grossLateHeatJ;
  const holdK = mode.effectiveMode === "Quiet" && mode.quietHoldTemperatureK !== null ? mode.quietHoldTemperatureK : profile.modes.normalTargetK.value;
  const lateExcessJ = Math.min(grossLateHeatJ, Math.max(0, shipWorkingEnergyJ - holdK * profile.ship.heatCapacityJPerK.value));
  captureIntoBanks("8", lateExcessJ, "late-heat");

  let passiveRadiationJ = 0;
  const deployed = new Map(mode.surfaceDeploymentById.map(surface => [surface.id, surface.deployed]));
  for (const surface of profile.surfaces) {
    if (!deployed.get(surface.id) || surface.thermoinverterId !== null) continue;
    passiveRadiationJ += signedRadiationJ(surface, initialShipTemperatureK, tick.environment.temperatureK, seconds);
  }
  const externalCoolingJ = tick.environment.externalCoolingW * seconds;
  shipWorkingEnergyJ = integrateOwnerEnergyV03("ship", shipWorkingEnergyJ, -passiveRadiationJ - externalCoolingJ);

  const storageUsedJ = Math.min(electricalWantedActualJ, storageCapJ);
  let generationNeededJ = Math.max(0, electricalWantedActualJ - storageUsedJ);
  const sourceActual = new Map<string, { generatedJ: number; fuelKg: number; hostHeatJ: number; exhaustJ: number }>();
  for (const source of [...profile.electrical.sources].sort((a, b) => lexical(a.id, b.id))) {
    if (generationNeededJ <= 0) break;
    const reservation = sourceReservation.get(source.id);
    const fuelCapJ = reservation && source.fuelJPerKg
      ? reservation.massKg * source.fuelJPerKg.value * source.efficiency.value
      : source.resourceId === null ? Number.MAX_VALUE : 0;
    const quietAllowed = mode.effectiveMode !== "Quiet" || state.electricalChargeJ / profile.electrical.storage.capacityJ.value < profile.modes.quietEmergencyChargeFraction.value;
    if (!quietAllowed) continue;
    const generatedJ = Math.min(generationNeededJ, source.maxOutputW.value * seconds, fuelCapJ);
    const fuelKg = source.fuelJPerKg ? generatedJ / (source.fuelJPerKg.value * source.efficiency.value) : 0;
    const chemicalJ = source.fuelJPerKg ? fuelKg * source.fuelJPerKg.value : generatedJ;
    const lossJ = chemicalJ - generatedJ;
    const sourceHostHeatJ = lossJ * source.hostHeatFraction.value;
    const exhaustJ = lossJ - sourceHostHeatJ;
    sourceActual.set(source.id, { generatedJ, fuelKg, hostHeatJ: sourceHostHeatJ, exhaustJ });
    generationNeededJ -= generatedJ;
    shipWorkingEnergyJ += sourceHostHeatJ;
  }
  if (generationNeededJ > 1e-9) throw new RangeError("electrical dispatch exceeded final source cap");
  const electricalChargeJ = integrateOwnerEnergyV03("electrical", state.electricalChargeJ, -storageUsedJ);

  for (const plan of plans) {
    const moduleNode = `module:${plan.module.id}`;
    if (plan.pickupShipJ > 0) entries.push(...transferEntries(nextId(`ship-pickup:${plan.module.id}`), plan.module.id, "ship", moduleNode, plan.pickupShipJ));
    const electricJ = plan.actualJ * plan.module.electricJPerJ.value;
    if (electricJ > 0) entries.push(...transferEntries(nextId(`electric:${plan.module.id}`), plan.module.id, "electrical", moduleNode, electricJ));
    const moduleHostHeatJ = plan.actualJ * plan.module.auxHeatJPerJ.value * (plan.module.auxHeatDestination === "ship" ? 1 : 0);
    const exportedAuxHeatJ = plan.actualJ * plan.module.auxHeatJPerJ.value * (plan.module.auxHeatDestination === "export" ? 1 : 0);
    if (moduleHostHeatJ > 0) {
      entries.push(externalEntry(nextId(`aux-input:${plan.module.id}`), plan.module.id, moduleNode, "operation", moduleHostHeatJ));
      entries.push(...transferEntries(nextId(`aux-host:${plan.module.id}`), plan.module.id, moduleNode, "ship", moduleHostHeatJ));
    }
    if (exportedAuxHeatJ > 0) entries.push(externalEntry(nextId(`aux-input:${plan.module.id}`), plan.module.id, moduleNode, "operation", exportedAuxHeatJ));
    const path = packages.find(item => item.moduleId === plan.module.id)?.outward[0];
    if (path) entries.push(externalEntry(nextId(`outward:${plan.module.id}`), plan.module.id, moduleNode, path.id, -path.energyJ));
    else if (electricJ > 0 && plan.module.kind === "ordinary") entries.push(externalEntry(nextId(`work:${plan.module.id}`), plan.module.id, moduleNode, "useful-work", -electricJ));
    else if (plan.module.kind === "heater" && plan.actualJ > 0) entries.push(...transferEntries(nextId(`heater:${plan.module.id}`), plan.module.id, moduleNode, "ship", plan.actualJ));
  }
  for (const tx of transactions.values()) entries.push(...tx.entries);

  if (externalHeatingJ > 0) entries.push(externalEntry(nextId("environment-heating"), "environment", "ship", "environment", externalHeatingJ));
  if (externalCoolingJ > 0) entries.push(externalEntry(nextId("environment-cooling"), "environment", "ship", "environment", -externalCoolingJ));
  if (passiveRadiationJ > 0) entries.push(externalEntry(nextId("passive-radiation"), "surface", "ship", "space", -passiveRadiationJ));
  if (passiveRadiationJ < 0) entries.push(externalEntry(nextId("passive-radiation"), "surface", "ship", "space", -passiveRadiationJ));

  const resourceConsumption: { ownerId: string; resources: { id: string; massKg: number }[] }[] = [];
  for (const plan of plans) {
    if (plan.module.resourceId === null || plan.massKgPerUsefulJ === 0 || plan.actualJ === 0) continue;
    resourceConsumption.push({ ownerId: `module:${plan.module.id}`, resources: [{ id: plan.module.resourceId, massKg: plan.actualJ * plan.massKgPerUsefulJ }] });
  }
  for (const source of profile.electrical.sources) {
    const actual = sourceActual.get(source.id);
    if (!actual || source.resourceId === null || actual.fuelKg === 0) continue;
    resourceConsumption.push({ ownerId: `source:${source.id}`, resources: [{ id: source.resourceId, massKg: actual.fuelKg }] });
    const moduleNode = `module:${source.moduleId}`;
    const chemicalJ = source.fuelJPerKg ? actual.fuelKg * source.fuelJPerKg.value : actual.generatedJ;
    entries.push(externalEntry(nextId(`fuel-energy:${source.id}`), source.id, moduleNode, `resource:${source.resourceId}`, chemicalJ));
    if (actual.generatedJ > 0) entries.push(...transferEntries(nextId(`generation:${source.id}`), source.id, moduleNode, "electrical", actual.generatedJ));
    if (actual.hostHeatJ > 0) entries.push(...transferEntries(nextId(`source-host:${source.id}`), source.id, moduleNode, "ship", actual.hostHeatJ));
    if (actual.exhaustJ > 0) {
      const path = { id: `outward:${source.id}:${state.tickIndex}`, ownerId: source.id, kind: "source-exhaust" as const, energyJ: actual.exhaustJ, irJ: actual.exhaustJ, emJ: 0 };
      outward.push(path);
      entries.push(externalEntry(nextId(`source-exhaust:${source.id}`), source.id, moduleNode, path.id, -actual.exhaustJ));
    }
  }
  const resourceCommit = commitResources(resourceLedger, resourceConsumption);
  entries.push(...resourceCommit.entries.map(entry => ({ ...entry, id: nextId(`resource:${entry.ownerId}:${entry.resourceId}`) })));

  const bufferEnergyJByBank = [...profile.banks].sort((a, b) => lexical(a.id, b.id)).map(bank => ({ id: bank.id, energyJ: transactions.get(bank.id)!.energyJ }));
  const resourceMassKg = resourceCommit.balances;
  const shipEnergyJ = shipWorkingEnergyJ;
  const lastReasonByModule = new Map<string, GovernorReasonV03>();
  const moduleIds = new Set(profile.modules.map(module => module.id));
  for (const decision of decisions) if (moduleIds.has(decision.moduleId) && decision.reason !== "idle") lastReasonByModule.set(decision.moduleId, decision.reason);
  const selectedStageIds = GOVERNOR_STAGE_ORDER_V03.filter(stage => activeStages.has(stage));
  const nextState = immutableCopy({
    ...state,
    tickIndex: state.tickIndex + 1,
    effectiveMode: mode.effectiveMode,
    requestedMode: tick.requestedMode,
    quietEntryTemperatureK: mode.quietEntryTemperatureK,
    quietHoldTemperatureK: mode.quietHoldTemperatureK,
    modeLatches: { shipColdProtection: mode.shipColdProtection, quietColdCooling: mode.quietColdCooling },
    stageLatches: GOVERNOR_STAGE_ORDER_V03.map(stage => ({ id: stage, active: activeStages.has(stage) })),
    bankLatches: bufferEnergyJByBank.map(bank => {
      const tx = transactions.get(bank.id)!;
      return { id: bank.id, direction: tx.inputJ > 0 ? "in" as const : tx.outputJ > 0 ? "out" as const : "none" as const };
    }),
    selectedStageIds,
    previousTransitionDirection: shipEnergyJ > state.shipEnergyJ ? "warming" as const : shipEnergyJ < state.shipEnergyJ ? "cooling" as const : "none" as const,
    surfaceDeploymentById: mode.surfaceDeploymentById,
    shipEnergyJ,
    bufferEnergyJByBank,
    waterEnthalpyJByTank: waterStates,
    electricalChargeJ,
    resourceMassKg,
    moduleStateById: protection.modules,
    failureChecks: protection.failureChecks,
    rng: protection.rng,
    lastLimitingReasons: [...lastReasonByModule].sort(([a], [b]) => lexical(a, b)).map(([id, reason]) => ({ id, reason })),
  });

  const energyDeltaByNode = new Map<string, number>([
    ["ship", nextState.shipEnergyJ - state.shipEnergyJ],
    ["electrical", nextState.electricalChargeJ - state.electricalChargeJ],
    ...nextState.bufferEnergyJByBank.map(bank => [bank.id, bank.energyJ - state.bufferEnergyJByBank.find(item => item.id === bank.id)!.energyJ] as const),
    ...nextState.waterEnthalpyJByTank.map(water => [water.id, water.enthalpyJ - state.waterEnthalpyJByTank.find(item => item.id === water.id)!.enthalpyJ] as const),
  ]);
  for (const entry of entries) if (!energyDeltaByNode.has(entry.nodeId)) energyDeltaByNode.set(entry.nodeId, 0);
  const massDeltaByResource = new Map(nextState.resourceMassKg.map(resource => [resource.id, resource.massKg - state.resourceMassKg.find(item => item.id === resource.id)!.massKg]));
  const changes = [...energyDeltaByNode].sort(([a], [b]) => lexical(a, b)).map(([nodeId, energyDeltaJ]) => ({
    nodeId,
    energyDeltaJ,
    resources: nodeId.startsWith("resource:")
      ? [{ id: nodeId.slice("resource:".length), deltaKg: massDeltaByResource.get(nodeId.slice("resource:".length)) ?? 0 }]
      : [],
  }));
  const accounting = auditConservation(entries, changes);
  const orderedPackages = [...packages].sort((a, b) => lexical(a.moduleId, b.moduleId));
  const orderedDecisions = [...decisions].sort((a, b) => lexical(a.id, b.id));
  const orderedOutward = [...outward].sort((a, b) => lexical(a.id, b.id));
  return immutableCopy({
    state: nextState,
    packages: orderedPackages,
    ledger: { entries: [...entries].sort((a, b) => lexical(a.id, b.id)), outward: orderedOutward, ...accounting },
    decisions: orderedDecisions,
    trace: trace.finish(state.tickIndex),
  });
}
