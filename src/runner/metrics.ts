import type {
  TickTelemetry,
  LabEvent,
  RunSpec,
  ModelState,
} from "../model/types";
export type RunMetrics = {
  ticks: number;
  usefulWork: number;
  firstConstraintSeconds: number | null;
  forcedDowntimeSeconds: number;
  recoverySeconds: number | null;
  nextActionReadySeconds: number | null;
  firstTargetSeconds: number | null;
  firstSortieSeconds: number | null;
  fuelConsumedKg: Record<string, number>;
  coolantConsumedKg: number;
  maxTemperatureK: number;
  energyResidualJ: number;
  sourceEnergyJ: number;
  beamEnergyJ: number;
  thrustImpulseNs: number;
  targetCheckpoint?: MetricSnapshot;
  sortieCheckpoint?: MetricSnapshot;
};
export type MetricSnapshot = Omit<
  RunMetrics,
  "targetCheckpoint" | "sortieCheckpoint"
>;
export function snapshotMetrics(m: RunMetrics): MetricSnapshot {
  const { targetCheckpoint, sortieCheckpoint, ...rest } = m;
  return structuredClone(rest);
}
export function initialMetrics(temperatureK = 0): RunMetrics {
  return {
    ticks: 0,
    usefulWork: 0,
    firstConstraintSeconds: null,
    forcedDowntimeSeconds: 0,
    recoverySeconds: null,
    nextActionReadySeconds: null,
    firstTargetSeconds: null,
    firstSortieSeconds: null,
    fuelConsumedKg: {},
    coolantConsumedKg: 0,
    maxTemperatureK: temperatureK,
    energyResidualJ: 0,
    sourceEnergyJ: 0,
    beamEnergyJ: 0,
    thrustImpulseNs: 0,
  };
}
export function updateMetrics(
  m: RunMetrics,
  t: TickTelemetry,
  s: ModelState,
  events: LabEvent[],
  dt: number,
  spec: RunSpec,
  wantedWork: boolean,
  previous: ModelState,
  coolantConsumedKg: number,
) {
  m.ticks++;
  m.usefulWork = s.usefulWork;
  m.maxTemperatureK = Math.max(m.maxTemperatureK, s.temperatureK);
  m.energyResidualJ += t.energyResidualJ;
  m.sourceEnergyJ += (t.generatorW + t.solarW + t.externalElectricW) * dt;
  m.beamEnergyJ += t.beamW * dt;
  m.thrustImpulseNs += t.thrustN * dt;
  if (s.constraints.length && m.firstConstraintSeconds === null)
    m.firstConstraintSeconds = s.timeSeconds;
  if (wantedWork && t.workRate < 1e-12) m.forcedDowntimeSeconds += dt;
  if (
    m.firstConstraintSeconds !== null &&
    wantedWork &&
    t.workRate > 0 &&
    s.constraints.length === 0 &&
    m.nextActionReadySeconds === null
  ) {
    m.nextActionReadySeconds = s.timeSeconds;
    m.recoverySeconds = Math.max(0, s.timeSeconds - m.firstConstraintSeconds);
  }
  if (
    m.firstTargetSeconds === null &&
    s.usefulWork >= spec.scenario.targetWork - 1e-8
  )
    m.firstTargetSeconds = s.timeSeconds;
  for (const tank of spec.ship.tanks)
    m.fuelConsumedKg[tank.id] =
      (m.fuelConsumedKg[tank.id] ?? 0) +
      Math.max(0, previous.fuelKg[tank.id] - s.fuelKg[tank.id]);
  m.coolantConsumedKg += coolantConsumedKg;
  if (m.firstTargetSeconds !== null && !m.targetCheckpoint)
    m.targetCheckpoint = snapshotMetrics(m);
}
