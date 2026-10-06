import type {
  RunSpecV2,
  StateV2,
  StepResultV2,
  Cause,
} from "../model/v2/types";
import { CAUSES, MODEL_MISSION } from "../model/v2/types";
export type RecoverySummary = {
  firstSeconds: number | null;
  count: number;
  sumSeconds: number;
  meanSeconds: number | null;
  maxSeconds: number;
  pendingStopSeconds: number | null;
};
export type MiningMetrics = {
  mission?: { deliveredM3: number; deliveredScuPerHour: number | null; fuelPerDeliveredScu: Record<string, number | null>; flightSeconds: number; approachSeconds: number; miningSeconds: number; serviceSeconds: number; recoverySeconds: number; peakVelocityMS: number };
  ticks: number;
  usefulWork: number;
  selectedWorkM3: number;
  durationSeconds: number;
  ratedSelectedM3S: number;
  kUseHorizon: number | null;
  scuPerHour: number | null;
  intervalLabel: string;
  cyclesCompleted: number;
  completedCycles: {
    scu: number;
    durationSeconds: number;
    kUse: number | null;
  };
  currentCycleScu: number;
  currentCycleSeconds: number;
  lastCycle: {
    scu: number;
    durationSeconds: number;
    kUse: number | null;
  } | null;
  firstTargetSeconds: number | null;
  firstLimiter: { timeSeconds: number; causes: Cause[] } | null;
  causeSeconds: Record<Cause, number>;
  limitationUnionSeconds: number;
  overlapSeconds: number;
  forcedDowntimeSeconds: number;
  partialLossSeconds: number;
  partialLossM3: number;
  plannedTransitSeconds: number;
  plannedServiceSeconds: number;
  fuelSpeciesKg: Record<string, number>;
  fuelPurposeKg: Record<string, number>;
  fuelPerScu: Record<string, number | null>;
  h2CoolerKg: number;
  recovery: RecoverySummary;
  propulsionShortfall: boolean;
  maxTemperatureK: number;
  energyResidualJ: number;
  sourceEnergyJ: number;
  beamEnergyJ: number;
  returnHeatJ: number;
};
export function initialMiningMetrics(s: RunSpecV2): MiningMetrics {
  const rated = s.resolvedShip.instances
    .filter((i) => s.selectedWorkGroup.includes(i.id))
    .reduce(
      (n, i) =>
        n +
        (i.item.numerics.powerW *
          i.item.numerics.efficiency *
          s.process.extractFactor *
          s.process.softFactor) /
          (s.process.energyJPerM3 * s.process.workFactor),
      0,
    );
  return {
    ticks: 0,
    usefulWork: 0,
    selectedWorkM3: 0,
    durationSeconds: 0,
    ratedSelectedM3S: rated,
    kUseHorizon: null,
    scuPerHour: null,
    intervalLabel: "наблюдаемый горизонт",
    cyclesCompleted: 0,
    completedCycles: { scu: 0, durationSeconds: 0, kUse: null },
    currentCycleScu: 0,
    currentCycleSeconds: 0,
    lastCycle: null,
    firstTargetSeconds: null,
    firstLimiter: null,
    causeSeconds: { power: 0, thermal: 0, resource: 0, cargo: 0 },
    limitationUnionSeconds: 0,
    overlapSeconds: 0,
    forcedDowntimeSeconds: 0,
    partialLossSeconds: 0,
    partialLossM3: 0,
    plannedTransitSeconds: 0,
    plannedServiceSeconds: 0,
    fuelSpeciesKg: { diesel: 0, hydrogen: 0 },
    fuelPurposeKg: {
      "diesel:generator": 0,
      "diesel:propulsion": 0,
      "hydrogen:generator": 0,
      "hydrogen:propulsion": 0,
      "hydrogen:cooler": 0,
    },
    fuelPerScu: { diesel: null, hydrogen: null },
    h2CoolerKg: 0,
    recovery: {
      firstSeconds: null,
      count: 0,
      sumSeconds: 0,
      meanSeconds: null,
      maxSeconds: 0,
      pendingStopSeconds: null,
    },
    propulsionShortfall: false,
    maxTemperatureK: s.initial.temperatureK,
    energyResidualJ: 0,
    sourceEnergyJ: 0,
    beamEnergyJ: 0,
    returnHeatJ: 0,
  };
}
export function updateMiningMetrics(
  m: MiningMetrics,
  previous: StateV2,
  step: StepResultV2,
  dt: number,
  s: RunSpecV2,
): void {
  const x = step.mining,
    t = step.telemetry,
    v = (k: string) => t[k] ?? 0;
  m.ticks++;
  m.usefulWork = step.state.usefulWork;
  m.selectedWorkM3 += x.selectedM3;
  m.durationSeconds += dt;
  m.currentCycleSeconds += dt;
  m.currentCycleScu += x.selectedM3;
  m.kUseHorizon =
    m.ratedSelectedM3S > 0 && m.durationSeconds > 0
      ? m.selectedWorkM3 / (m.ratedSelectedM3S * m.durationSeconds)
      : null;
  m.scuPerHour =
    m.durationSeconds > 0 ? (m.usefulWork * 3600) / m.durationSeconds : null;
  for (const c of CAUSES) m.causeSeconds[c] += x.causeSeconds[c];
  m.limitationUnionSeconds += x.unionSeconds;
  m.overlapSeconds += x.overlapSeconds;
  m.forcedDowntimeSeconds += x.forcedDowntimeSeconds;
  m.partialLossSeconds += Math.max(0, x.unionSeconds - x.forcedDowntimeSeconds);
  m.partialLossM3 += x.partialLossM3;
  if (x.firstLoss) {
    if (!m.firstLimiter)
      m.firstLimiter = { timeSeconds: x.firstLoss.timeSeconds, causes: [] };
    const first = m.firstLimiter;
    for (const c of CAUSES) {
      const time = x.firstCauseSeconds
        ? x.firstCauseSeconds[c]
        : x.firstLoss.causes.includes(c)
          ? x.firstLoss.timeSeconds
          : null;
      if (
        time !== null &&
        time - first.timeSeconds <= s.stepSeconds + 1e-9 &&
        !first.causes.includes(c)
      )
        first.causes.push(c);
    }
    first.causes = CAUSES.filter((c) => first.causes.includes(c));
  }
  const done = (seconds: number) => {
    if (m.recovery.firstSeconds === null) m.recovery.firstSeconds = seconds;
    m.recovery.count++;
    m.recovery.sumSeconds += seconds;
    m.recovery.maxSeconds = Math.max(m.recovery.maxSeconds, seconds);
  };
  if (x.recoveryDelta) {
    const d = x.recoveryDelta;
    if (d.count) {
      if (m.recovery.firstSeconds === null)
        m.recovery.firstSeconds = d.firstSeconds;
      m.recovery.count += d.count;
      m.recovery.sumSeconds += d.sumSeconds;
      m.recovery.maxSeconds = Math.max(m.recovery.maxSeconds, d.maxSeconds);
    }
    m.recovery.pendingStopSeconds = step.state.miningStopSeconds;
  } else {
    if (x.forcedDowntimeSeconds > 0 && m.recovery.pendingStopSeconds === null)
      m.recovery.pendingStopSeconds =
        x.firstLoss?.timeSeconds ?? previous.timeSeconds;
    if (
      m.recovery.pendingStopSeconds !== null &&
      x.firstPositiveSeconds !== null &&
      x.firstPositiveSeconds >= m.recovery.pendingStopSeconds
    ) {
      done(x.firstPositiveSeconds - m.recovery.pendingStopSeconds);
      m.recovery.pendingStopSeconds = null;
    }
  }
  m.recovery.meanSeconds = m.recovery.count
    ? m.recovery.sumSeconds / m.recovery.count
    : null;
  const phase = s.scenario.phases[Number(previous.phaseKey.split(":")[1])];
  if (phase?.action === "service") m.plannedServiceSeconds += dt;
  else if (
    phase &&
    ["approach", "braking", "transit", "idle"].includes(phase.action)
  )
    m.plannedTransitSeconds += dt;
  for (const [key, n] of Object.entries(step.state.consumptionKg)) {
    const [species, purpose] = key.split(":");
    const delta = n - (previous.consumptionKg[key] ?? 0);
    if (species in m.fuelSpeciesKg) {
      m.fuelSpeciesKg[species] += delta;
      m.fuelPurposeKg[species + ":" + purpose] =
        (m.fuelPurposeKg[species + ":" + purpose] ?? 0) + delta;
    }
  }
  m.h2CoolerKg = m.fuelPurposeKg["hydrogen:cooler"];
  for (const species of ["diesel", "hydrogen"])
    m.fuelPerScu[species] =
      m.usefulWork > 0 ? m.fuelSpeciesKg[species] / m.usefulWork : null;
  if (
    m.firstTargetSeconds === null &&
    step.state.usefulWork >= s.scenario.targetM3 - 1e-9
  )
    m.firstTargetSeconds = step.state.timeSeconds;
  if (s.modelVersion !== MODEL_MISSION) {
  const cycleDuration = s.scenario.phases.reduce(
    (n, p) => n + p.durationSeconds,
    0,
  );
  const completed = s.scenario.repeat
    ? Math.floor((step.state.timeSeconds + 1e-8) / cycleDuration)
    : step.state.timeSeconds >= cycleDuration - 1e-8
      ? 1
      : 0;
  if (completed > m.cyclesCompleted) {
    m.lastCycle = {
      scu: m.currentCycleScu,
      durationSeconds: m.currentCycleSeconds,
      kUse:
        m.ratedSelectedM3S > 0
          ? m.currentCycleScu / (m.ratedSelectedM3S * m.currentCycleSeconds)
          : null,
    };
    m.completedCycles.scu += m.currentCycleScu;
    m.completedCycles.durationSeconds += m.currentCycleSeconds;
    m.completedCycles.kUse =
      m.ratedSelectedM3S > 0
        ? m.completedCycles.scu /
          (m.ratedSelectedM3S * m.completedCycles.durationSeconds)
        : null;
    m.currentCycleScu = 0;
    m.currentCycleSeconds = 0;
    m.cyclesCompleted = completed;
  }
  m.intervalLabel =
    m.currentCycleSeconds > 1e-8
      ? "наблюдаемый горизонт / неполный цикл"
      : "завершённые циклы";
  }
  m.maxTemperatureK = Math.max(m.maxTemperatureK, step.maxTemperatureK);
  m.energyResidualJ += v("energyResidualJ");
  m.sourceEnergyJ +=
    (v("chemicalW") +
      v("solarW") +
      v("solarHostW") +
      v("externalElectricW") +
      v("directHeatW") +
      v("radiationInW")) *
    dt;
  m.beamEnergyJ += v("beamW") * dt;
  m.returnHeatJ += v("returnHeatW") * dt;
  m.propulsionShortfall ||= x.propulsionShortfall;
}
