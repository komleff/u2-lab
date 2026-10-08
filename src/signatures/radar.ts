import { finite, flag, nonnegative, positive } from "./domain";
import { receivedFlux } from "./presets";

export type RadarSize = "S" | "M";
export interface StationaryRadarInput {
  size: RadarSize;
  initialCap: "FULL" | "EMPTY";
  rangeM: number;
  crossSectionM2: number;
  intervalS: number;
  enabled: boolean;
}
export interface RadarPulse {
  pulseId: number;
  emittedAtS: number;
  rfEnergyJ: number;
  pulseWidthS: number;
  rfPeakW: number;
}
export interface PendingStationaryEcho {
  pulseId: number;
  emittedAtS: number;
  receivedAtS: number;
  echoEnergyJ: number;
}
export interface ReceivedRadarEcho {
  pulseId: number;
  receivedAtS: number;
  measuredRangeM: number;
}
export interface RadarRechargeEpoch {
  timeS: number;
  capJ: number;
  externalRechargeJ: number;
}
// Это GD/internal state компонента, а не observer wire DTO и не движущаяся цель.
export interface StationaryRadarState {
  version: "signature-radar-stationary-0.1";
  sourceStatus: "working_reference";
  size: RadarSize;
  rangeM: number;
  crossSectionM2: number;
  intervalS: number;
  enabled: boolean;
  timeS: number;
  lastEmittedAtS: number | null;
  nextPingS: number;
  initialCapJ: number;
  capJ: number;
  externalRechargeJ: number;
  rfExportJ: number;
  hostHeatJ: number;
  pulseSequence: number;
  rechargeEpoch: RadarRechargeEpoch;
  pending: PendingStationaryEcho[];
  tracks: ReceivedRadarEcho[];
}
export interface RadarObservation extends ReceivedRadarEcho {
  channel: "radar";
  freshness: "fresh" | "stale";
}

// Только public working_reference anchors: Lab package §2 / frozen active-radar owner.
function radarAnchor(size: RadarSize) {
  if (size !== "S" && size !== "M") throw new TypeError("unsupported radar size");
  const scale = size === "M" ? 4 : 1;
  return { capJ: 12_500 * scale, rfJ: 5625 * scale, heatJ: 6875 * scale,
    rechargeW: 6250 * scale, apertureM2: scale, thresholdJ: 5.217880169e-14,
    pulseWidthS: 0.005, propagationMps: 3000 };
}

function validateGeometry(rangeM: number, crossSectionM2: number, intervalS: number): void {
  positive(rangeM, "rangeM");
  nonnegative(crossSectionM2, "crossSectionM2");
  if (finite(intervalS, "intervalS") < 2) throw new RangeError("radar interval must be at least 2 s");
  positive(2 * rangeM / 3000, "stationary round trip S");
}

export function echoEnergy(size: RadarSize, rangeM: number, crossSectionM2: number): number {
  const anchor = radarAnchor(size);
  positive(rangeM, "rangeM");
  nonnegative(crossSectionM2, "crossSectionM2");
  const denominator = positive((4 * Math.PI) ** 2 * rangeM ** 4, "radar propagation denominator");
  return nonnegative(anchor.rfJ * anchor.apertureM2 * crossSectionM2 / denominator, "echoEnergyJ");
}

export function radarEchoDetected(size: RadarSize, echoEnergyJ: number): boolean {
  return nonnegative(echoEnergyJ, "echoEnergyJ") >= radarAnchor(size).thresholdJ;
}

export function createRadarState(input: StationaryRadarInput): StationaryRadarState {
  const anchor = radarAnchor(input.size);
  validateGeometry(input.rangeM, input.crossSectionM2, input.intervalS);
  if (input.initialCap !== "FULL" && input.initialCap !== "EMPTY") throw new TypeError("explicit initial capacitor condition required");
  const initialCapJ = input.initialCap === "FULL" ? anchor.capJ : 0;
  echoEnergy(input.size, input.rangeM, input.crossSectionM2);
  return { version: "signature-radar-stationary-0.1", sourceStatus: "working_reference",
    size: input.size, rangeM: input.rangeM, crossSectionM2: input.crossSectionM2,
    intervalS: input.intervalS, enabled: flag(input.enabled, "enabled"), timeS: 0, lastEmittedAtS: null, nextPingS: 0,
    initialCapJ, capJ: initialCapJ, externalRechargeJ: 0, rfExportJ: 0, hostHeatJ: 0,
    pulseSequence: 0, rechargeEpoch: { timeS: 0, capJ: initialCapJ, externalRechargeJ: 0 }, pending: [], tracks: [] };
}

function copyState(state: StationaryRadarState): StationaryRadarState {
  return { ...state, rechargeEpoch: { ...state.rechargeEpoch },
    pending: state.pending.map(event => ({ ...event })), tracks: state.tracks.map(track => ({ ...track })) };
}

function receiveDue(state: StationaryRadarState, receivedEchoes: ReceivedRadarEcho[]): void {
  const due = state.pending.filter(event => event.receivedAtS <= state.timeS);
  state.pending = state.pending.filter(event => event.receivedAtS > state.timeS);
  for (const event of due) {
    if (!radarEchoDetected(state.size, event.echoEnergyJ)) continue;
    const echo = { pulseId: event.pulseId, receivedAtS: event.receivedAtS,
      measuredRangeM: (event.receivedAtS - event.emittedAtS) * radarAnchor(state.size).propagationMps / 2 };
    state.tracks.push(echo);
    receivedEchoes.push({ ...echo });
  }
}

function nextClock(value: number): number {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, value);
  view.setBigUint64(0, view.getBigUint64(0) + 1n);
  return finite(view.getFloat64(0), "recharge completion clock");
}

function rechargeCompletionS(epoch: RadarRechargeEpoch, size: RadarSize): number {
  const anchor = radarAnchor(size);
  const remainingJ = anchor.capJ - epoch.capJ;
  let completionS = finite(epoch.timeS + remainingJ / anchor.rechargeW, "recharge completion clock");
  // Округление deadline вниз не должно выдавать Дж до достаточного elapsed time.
  if ((completionS - epoch.timeS) * anchor.rechargeW < remainingJ) completionS = nextClock(completionS);
  return completionS;
}

function rechargeAt(epoch: RadarRechargeEpoch, size: RadarSize, enabled: boolean, timeS: number) {
  if (!enabled) return { capJ: epoch.capJ, externalRechargeJ: epoch.externalRechargeJ };
  const anchor = radarAnchor(size);
  const remainingJ = anchor.capJ - epoch.capJ;
  const complete = timeS >= rechargeCompletionS(epoch, size);
  const earnedJ = complete ? remainingJ : Math.min(remainingJ, (timeS - epoch.timeS) * anchor.rechargeW);
  return { capJ: complete ? anchor.capJ : finite(epoch.capJ + earnedJ, "capJ"),
    externalRechargeJ: finite(epoch.externalRechargeJ + earnedJ, "externalRechargeJ") };
}

function resetRechargeEpoch(state: StationaryRadarState): void {
  state.rechargeEpoch = { timeS: state.timeS, capJ: state.capJ, externalRechargeJ: state.externalRechargeJ };
}

function chargeUntil(state: StationaryRadarState, timeS: number): void {
  // Epoch меняется только при расходе или ON/OFF, а не при polling/echo/checkpoint.
  // Поэтому разбиение времени не меняет ни Q, ни интегральный внешний ввод энергии.
  Object.assign(state, rechargeAt(state.rechargeEpoch, state.size, state.enabled, timeS));
  state.timeS = timeS;
}

export function advanceRadar(previous: StationaryRadarState, toTimeS: number) {
  const state = restoreRadarCheckpoint(previous);
  if (nonnegative(toTimeS, "toTimeS") < state.timeS) throw new RangeError("radar clock cannot move backwards");
  const anchor = radarAnchor(state.size);
  const emittedPulses: RadarPulse[] = [];
  const receivedEchoes: ReceivedRadarEcho[] = [];
  for (;;) {
    const readyAtS = state.enabled
      ? Math.max(state.nextPingS, state.timeS, rechargeCompletionS(state.rechargeEpoch, state.size)) : Infinity;
    const echoAtS = state.pending[0]?.receivedAtS ?? Infinity;
    const eventTimeS = Math.min(readyAtS, echoAtS);
    if (eventTimeS > toTimeS) break;
    chargeUntil(state, eventTimeS);
    receiveDue(state, receivedEchoes);
    if (readyAtS === eventTimeS) {
      if (!Number.isSafeInteger(state.pulseSequence + 1)) throw new RangeError("pulse sequence exhausted");
      const pulseId = ++state.pulseSequence;
      state.lastEmittedAtS = state.timeS;
      state.capJ -= anchor.capJ;
      state.rfExportJ = finite(state.rfExportJ + anchor.rfJ, "rfExportJ");
      state.hostHeatJ = finite(state.hostHeatJ + anchor.heatJ, "hostHeatJ");
      resetRechargeEpoch(state);
      state.nextPingS = finite(state.timeS + state.intervalS, "nextPingS");
      if (state.nextPingS <= state.timeS) throw new RangeError("clock precision cannot resolve ping interval");
      state.pending.push({ pulseId, emittedAtS: state.timeS,
        receivedAtS: finite(state.timeS + 2 * state.rangeM / anchor.propagationMps, "receivedAtS"),
        echoEnergyJ: echoEnergy(state.size, state.rangeM, state.crossSectionM2) });
      emittedPulses.push({ pulseId, emittedAtS: state.timeS, rfEnergyJ: anchor.rfJ,
        pulseWidthS: anchor.pulseWidthS, rfPeakW: anchor.rfJ / anchor.pulseWidthS });
    }
  }
  chargeUntil(state, toTimeS);
  receiveDue(state, receivedEchoes);
  state.tracks = state.tracks.filter(track => toTimeS < track.receivedAtS + 13);
  return { state, emittedPulses, receivedEchoes };
}

export function setRadarEnabled(previous: StationaryRadarState, enabled: boolean): StationaryRadarState {
  const state = restoreRadarCheckpoint(previous);
  const nextEnabled = flag(enabled, "enabled");
  if (nextEnabled !== state.enabled) resetRechargeEpoch(state);
  state.enabled = nextEnabled;
  return state;
}

export function radarObservations(state: StationaryRadarState): RadarObservation[] {
  const ready = restoreRadarCheckpoint(state);
  return ready.tracks.filter(track => ready.timeS < track.receivedAtS + 13).map(track => ({
    channel: "radar", pulseId: track.pulseId, measuredRangeM: track.measuredRangeM,
    receivedAtS: track.receivedAtS, freshness: ready.timeS < track.receivedAtS + 3 ? "fresh" : "stale",
  }));
}

export function rfPulseDiagnostic(pulse: RadarPulse, receiverRangeM: number) {
  nonnegative(pulse.rfEnergyJ, "rfEnergyJ");
  positive(pulse.pulseWidthS, "pulseWidthS");
  const rfPeakW = nonnegative(pulse.rfEnergyJ / pulse.pulseWidthS, "rfPeakW");
  // Только known RF/energy/flux diagnostic; steady Φ не определяет 5 ms passive acquisition.
  return { rfEnergyJ: pulse.rfEnergyJ, pulseWidthS: pulse.pulseWidthS, rfPeakW,
    receivedFluxWm2: receivedFlux(rfPeakW, receiverRangeM) };
}

function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("checkpoint object required");
  const obj = value as Record<string, unknown>;
  if (Object.keys(obj).length !== keys.length || keys.some(key => !Object.hasOwn(obj, key))) throw new TypeError("unknown/partial checkpoint fields");
  return obj;
}

function samePhysical(actual: number, expected: number, reference: number, name: string): void {
  finite(actual, name);
  if (expected === 0 ? actual !== 0 : Math.abs(actual - expected) > 1e-12 * reference) throw new RangeError(`inconsistent ${name}`);
}

function precedesDerivedClock(actualS: number, minimumS: number): boolean {
  // Тот же допуск производной cadence-границы: repeated-add отличается от product.
  // Прямые causal bounds и связь последнего ID с исходным clock проверяются точно.
  return minimumS - actualS > 1e-12 * minimumS;
}

export function restoreRadarCheckpoint(value: unknown): StationaryRadarState {
  const obj = record(value, ["version", "sourceStatus", "size", "rangeM", "crossSectionM2", "intervalS", "enabled", "timeS", "lastEmittedAtS",
    "nextPingS", "initialCapJ", "capJ", "externalRechargeJ", "rfExportJ", "hostHeatJ", "pulseSequence", "rechargeEpoch", "pending", "tracks"]);
  if (obj.version !== "signature-radar-stationary-0.1" || obj.sourceStatus !== "working_reference") throw new TypeError("unknown checkpoint version/provenance");
  const anchor = radarAnchor(obj.size as RadarSize);
  const state = obj as unknown as StationaryRadarState;
  validateGeometry(state.rangeM, state.crossSectionM2, state.intervalS);
  flag(state.enabled, "enabled");
  nonnegative(state.timeS, "timeS");
  nonnegative(state.nextPingS, "nextPingS");
  if (state.initialCapJ !== 0 && state.initialCapJ !== anchor.capJ) throw new RangeError("invalid initial reserve");
  if (nonnegative(state.capJ, "capJ") > anchor.capJ) throw new RangeError("capacitor over capacity");
  nonnegative(state.externalRechargeJ, "externalRechargeJ");
  const maximumRechargeJ = nonnegative(state.timeS * anchor.rechargeW, "maximumRechargeJ");
  if (state.externalRechargeJ - maximumRechargeJ > 1e-12 * maximumRechargeJ) throw new RangeError("recharge exceeds elapsed clock budget");
  nonnegative(state.rfExportJ, "rfExportJ");
  nonnegative(state.hostHeatJ, "hostHeatJ");
  if (!Number.isSafeInteger(state.pulseSequence) || state.pulseSequence < 0) throw new RangeError("invalid pulse sequence");
  // Последний emission хранится даже после TTL: nextPing нельзя переопределить скрытой правкой checkpoint.
  if (state.pulseSequence === 0) {
    if (state.lastEmittedAtS !== null || state.nextPingS !== 0) throw new RangeError("inconsistent initial ping clock");
  } else {
    if (state.lastEmittedAtS === null) throw new RangeError("last emission clock required");
    nonnegative(state.lastEmittedAtS, "lastEmittedAtS");
    const minimumCadenceS = nonnegative((state.pulseSequence - 1) * state.intervalS, "minimumCadenceS");
    // Повторное сложение и произведение interval расходятся на ulp. Допуск относится
    // только к этой производной нижней границе времени; causal ordering остаётся точным.
    const belowMinimum = precedesDerivedClock(state.lastEmittedAtS, minimumCadenceS);
    if (state.lastEmittedAtS > state.timeS || belowMinimum
      || state.nextPingS !== state.lastEmittedAtS + state.intervalS) throw new RangeError("inconsistent ping schedule");
  }
  const inputEnergyJ = finite(state.initialCapJ + state.externalRechargeJ, "inputEnergyJ");
  samePhysical(state.rfExportJ, state.pulseSequence * anchor.rfJ, Math.max(inputEnergyJ, anchor.capJ), "RF ledger");
  samePhysical(state.hostHeatJ, state.pulseSequence * anchor.heatJ, Math.max(inputEnergyJ, anchor.capJ), "host heat ledger");
  const spentAndStoredJ = finite(state.rfExportJ + state.hostHeatJ + state.capJ, "spentAndStoredJ");
  samePhysical(spentAndStoredJ, inputEnergyJ, inputEnergyJ || anchor.capJ, "energy balance");
  record(state.rechargeEpoch, ["timeS", "capJ", "externalRechargeJ"]);
  const epoch = state.rechargeEpoch;
  nonnegative(epoch.timeS, "recharge epoch timeS");
  nonnegative(epoch.capJ, "recharge epoch capJ");
  nonnegative(epoch.externalRechargeJ, "recharge epoch externalRechargeJ");
  if (epoch.timeS > state.timeS || (state.lastEmittedAtS !== null && epoch.timeS < state.lastEmittedAtS)
    || epoch.capJ > anchor.capJ || epoch.externalRechargeJ > state.externalRechargeJ) throw new RangeError("inconsistent recharge epoch");
  const epochInputJ = finite(state.initialCapJ + epoch.externalRechargeJ, "recharge epoch inputJ");
  samePhysical(state.rfExportJ + state.hostHeatJ + epoch.capJ, epochInputJ, epochInputJ || anchor.capJ, "recharge epoch ledger");
  const expectedCharge = rechargeAt(epoch, state.size, state.enabled, state.timeS);
  samePhysical(state.capJ, expectedCharge.capJ, anchor.capJ, "recharge epoch Q");
  samePhysical(state.externalRechargeJ, expectedCharge.externalRechargeJ, inputEnergyJ || anchor.capJ, "recharge epoch external input");
  if (!Array.isArray(state.pending) || !Array.isArray(state.tracks)) throw new TypeError("checkpoint event arrays required");
  const ids = new Set<number>();
  const validId = (id: number) => {
    if (!Number.isSafeInteger(id) || id < 1 || id > state.pulseSequence || ids.has(id)) throw new RangeError("invalid/duplicate pulse ID");
    ids.add(id);
  };
  const expectedEchoJ = echoEnergy(state.size, state.rangeM, state.crossSectionM2);
  let previousReceiptS = -Infinity;
  for (const event of state.pending) {
    record(event, ["pulseId", "emittedAtS", "receivedAtS", "echoEnergyJ"]);
    validId(event.pulseId);
    nonnegative(event.emittedAtS, "emittedAtS");
    finite(event.receivedAtS, "receivedAtS");
    if (event.emittedAtS > state.timeS || event.receivedAtS <= state.timeS || event.receivedAtS < previousReceiptS
      || event.emittedAtS >= state.nextPingS) throw new RangeError("inconsistent pending clock");
    samePhysical(event.receivedAtS, event.emittedAtS + 2 * state.rangeM / anchor.propagationMps,
      event.receivedAtS, "stationary receipt");
    samePhysical(event.echoEnergyJ, expectedEchoJ, anchor.thresholdJ, "stationary echo");
    previousReceiptS = event.receivedAtS;
  }
  previousReceiptS = -Infinity;
  for (const track of state.tracks) {
    record(track, ["pulseId", "receivedAtS", "measuredRangeM"]);
    validId(track.pulseId);
    nonnegative(track.receivedAtS, "receivedAtS");
    positive(track.measuredRangeM, "measuredRangeM");
    if (track.receivedAtS > state.timeS || state.timeS >= track.receivedAtS + 13 || track.receivedAtS < previousReceiptS
      || !radarEchoDetected(state.size, expectedEchoJ)) throw new RangeError("inconsistent received track");
    samePhysical(track.measuredRangeM, state.rangeM, state.rangeM, "stationary measured range");
    previousReceiptS = track.receivedAtS;
  }
  const roundTripS = 2 * state.rangeM / anchor.propagationMps;
  const earliestReceiptS = finite((state.initialCapJ === 0 ? anchor.capJ / anchor.rechargeW : 0) + roundTripS, "earliest receipt");
  const lastReceiptS = state.lastEmittedAtS === null ? null : finite(state.lastEmittedAtS + roundTripS, "last receipt");
  let previousPulseId: number | undefined;
  let previousSurvivorReceiptS: number | undefined;
  // При постоянной дальности tracks перед pending образуют surviving suffix pulse IDs.
  // TTL/слабое эхо удаляют только уже принятый prefix, но не событие внутри suffix.
  for (const receipt of [...state.tracks, ...state.pending]) {
    if (lastReceiptS === null || receipt.receivedAtS < earliestReceiptS || receipt.receivedAtS > lastReceiptS)
      throw new RangeError("receipt outside causal emission bounds");
    const minimumReceiptS = finite((receipt.pulseId - 1) * state.intervalS + earliestReceiptS, "minimum receipt");
    if (precedesDerivedClock(receipt.receivedAtS, minimumReceiptS)
      || (previousPulseId !== undefined && (receipt.pulseId !== previousPulseId + 1
        || precedesDerivedClock(receipt.receivedAtS, finite(previousSurvivorReceiptS! + state.intervalS, "receipt cadence")))))
      throw new RangeError("inconsistent causal pulse association");
    if (receipt.pulseId === state.pulseSequence && receipt.receivedAtS !== lastReceiptS)
      throw new RangeError("receipt does not belong to last emission");
    previousPulseId = receipt.pulseId;
    previousSurvivorReceiptS = receipt.receivedAtS;
  }
  const latestPending = state.pending.at(-1);
  if (latestPending?.pulseId === state.pulseSequence && latestPending.emittedAtS !== state.lastEmittedAtS)
    throw new RangeError("pending ID does not belong to last emission");
  if (lastReceiptS !== null && (lastReceiptS > state.timeS
    || (radarEchoDetected(state.size, expectedEchoJ) && state.timeS < lastReceiptS + 13))
    && previousPulseId !== state.pulseSequence) throw new RangeError("missing causal pulse receipt");
  const firstSurvivorId = state.tracks[0]?.pulseId ?? state.pending[0]?.pulseId;
  const omittedPrefixLastId = firstSurvivorId === undefined ? state.pulseSequence : firstSurvivorId - 1;
  if (omittedPrefixLastId > 0) {
    // Prefix мог уйти только после receipt (слабое эхо) либо receipt+TTL.
    // Earliest bound доказывает обязательное событие без выдуманной прошлой истории.
    const earliestDiscardS = finite(earliestReceiptS + (omittedPrefixLastId - 1) * state.intervalS
      + (radarEchoDetected(state.size, expectedEchoJ) ? 13 : 0), "earliest prefix discard");
    const beforeDiscard = omittedPrefixLastId === 1 ? state.timeS < earliestDiscardS
      : precedesDerivedClock(state.timeS, earliestDiscardS);
    if (beforeDiscard) throw new RangeError("missing mandatory causal prefix");
  }
  return copyState(state);
}

export function radarCheckpoint(state: StationaryRadarState): StationaryRadarState {
  return restoreRadarCheckpoint(state);
}
