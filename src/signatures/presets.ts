import { cosineDegrees, finite, flag, nonnegative, positive, sineDegrees } from "./domain";
import { normalizeBearing } from "./projection";

export type ObserverPresetId = "S-dedicated-G1" | "S-3in1-G1" | "M-dedicated-G1" | "M-3in1-G1";
export type PassiveChannel = "IR" | "EM";
export interface PassiveObservation {
  channel: PassiveChannel;
  bearingDeg: number;
  brightnessWm2: number;
}

// Компактные public anchors: Lab package §2; статусы CSV не повышаются до production SKU.
export function observerPreset(id: ObserverPresetId) {
  if (!["S-dedicated-G1", "S-3in1-G1", "M-dedicated-G1", "M-3in1-G1"].includes(id)) throw new TypeError("unsupported observer preset");
  const size = id.startsWith("M") ? "M" as const : "S" as const;
  const factor = (id.includes("3in1") ? 2.25 : 1) / (size === "M" ? 4 : 1);
  return { id, size,
    ir: { detectWm2: 0.000274542277 * factor, holdWm2: 0.0001647253662 * factor },
    em: { detectWm2: 3.592038646e-8 * factor, holdWm2: 2.1552231876e-8 * factor },
    receiverProcessingW: size === "M" ? 3000 : 750,
    thresholdStatus: "accepted_design_direction" as const, powerStatus: "working_reference" as const };
}

function passiveChannel(channel: PassiveChannel): PassiveChannel {
  if (channel !== "IR" && channel !== "EM") throw new TypeError("unsupported passive channel");
  return channel;
}

export interface PassiveObservationInput {
  presetId: ObserverPresetId;
  channel: PassiveChannel;
  signedFluxWm2: number;
  bearingDeg: number;
  held: boolean;
  advancedIr: boolean;
}

export function passiveObservation(input: PassiveObservationInput): PassiveObservation | null {
  const preset = observerPreset(input.presetId);
  const channel = passiveChannel(input.channel);
  const flux = finite(input.signedFluxWm2, "signedFluxWm2");
  const bearingDeg = normalizeBearing(input.bearingDeg);
  const held = flag(input.held, "held");
  const advanced = flag(input.advancedIr, "advancedIr");
  if (channel === "EM" && flux < 0) throw new RangeError("EM flux must be nonnegative");
  const brightnessWm2 = channel === "IR" && advanced ? Math.abs(flux) : Math.max(flux, 0);
  const thresholds = channel === "IR" ? preset.ir : preset.em;
  return brightnessWm2 >= (held ? thresholds.holdWm2 : thresholds.detectWm2)
    ? { channel, bearingDeg, brightnessWm2 } : null;
}

export function receivedFlux(signedEquivalentW: number, rangeM: number): number {
  finite(signedEquivalentW, "signedEquivalentW");
  positive(rangeM, "rangeM");
  const area = positive(4 * Math.PI * rangeM * rangeM, "propagation area");
  return finite(signedEquivalentW / area, "receivedFluxWm2");
}

export interface PassiveSpotInput {
  bearingDeg: number;
  brightnessWm2: number;
}

// resolutionDeg — явный параметр fixture, абсолютного канонического IR/EM resolution нет.
export function mergePassiveSpots(channel: PassiveChannel, spots: readonly PassiveSpotInput[], resolutionDeg: number): PassiveObservation[] {
  passiveChannel(channel);
  if (positive(resolutionDeg, "resolutionDeg") >= 180) throw new RangeError("resolution must be below 180 degrees");
  if (!Array.isArray(spots)) throw new TypeError("spots must be an array");
  const ready = spots.map(spot => ({ bearingDeg: normalizeBearing(spot.bearingDeg),
    brightnessWm2: nonnegative(spot.brightnessWm2, "brightnessWm2") })).filter(spot => spot.brightnessWm2 > 0);
  const groups: number[][] = [];
  const visited = new Set<number>();
  for (let seed = 0; seed < ready.length; seed++) {
    if (visited.has(seed)) continue;
    const group = [seed];
    visited.add(seed);
    for (let cursor = 0; cursor < group.length; cursor++) {
      for (let candidate = 0; candidate < ready.length; candidate++) {
        const gap = Math.abs(ready[group[cursor]].bearingDeg - ready[candidate].bearingDeg);
        if (!visited.has(candidate) && Math.min(gap, 360 - gap) <= resolutionDeg) {
          visited.add(candidate); group.push(candidate);
        }
      }
    }
    groups.push(group);
  }
  return groups.map(group => {
    let x = 0; let y = 0; let brightnessWm2 = 0;
    for (const index of group) {
      const spot = ready[index];
      x += spot.brightnessWm2 * cosineDegrees(spot.bearingDeg);
      y += spot.brightnessWm2 * sineDegrees(spot.bearingDeg);
      brightnessWm2 += spot.brightnessWm2;
    }
    finite(brightnessWm2, "merged brightnessWm2");
    if (Math.hypot(x, y) <= brightnessWm2 * Number.EPSILON * 8) throw new RangeError("ambiguous circular bearing");
    return { channel, bearingDeg: normalizeBearing(Math.atan2(y, x) * 180 / Math.PI), brightnessWm2 };
  }).sort((a, b) => a.bearingDeg - b.bearingDeg);
}
