import { finite, immutableCopy, stableId, tolerance, transferEntries, uniqueIds } from "./conservation";
import type { BufferBankProfileV03, GovernorLedgerEntryV03 } from "./types";

export function validateBankProfile(profile: BufferBankProfileV03): void {
  stableId(profile.id); uniqueIds(profile.memberIds); uniqueIds(profile.compatibleModuleIds);
  const capacity = finite(profile.capacityJ.value, "capacity", 0);
  for (const value of [profile.inputW, profile.outputW, profile.sharedW, profile.conductanceWPerK]) finite(value.value, "bank cap", 0);
  const points = profile.temperatureByEnergy;
  if (points.length < 2 || capacity <= 0 || points[0].energyJ.value !== 0 || points[points.length - 1].energyJ.value !== capacity) throw new RangeError("temperature map endpoints");
  for (let i = 0; i < points.length; i++) {
    finite(points[i].energyJ.value, "map energy", 0); finite(points[i].temperatureK.value, "map temperature", 0);
    if (i > 0 && (points[i].energyJ.value <= points[i - 1].energyJ.value || points[i].temperatureK.value < points[i - 1].temperatureK.value)) throw new RangeError("nonmonotonic temperature map");
  }
}
export function bufferTemperature(profile: BufferBankProfileV03, energyJ: number): number {
  validateBankProfile(profile); finite(energyJ, "buffer energy", 0);
  if (energyJ > profile.capacityJ.value) throw new RangeError("buffer overflow");
  const points = profile.temperatureByEnergy;
  for (let i = 1; i < points.length; i++) if (energyJ <= points[i].energyJ.value) {
    const a = points[i - 1], b = points[i];
    return finite(a.temperatureK.value + (b.temperatureK.value - a.temperatureK.value) * ((energyJ - a.energyJ.value) / (b.energyJ.value - a.energyJ.value)), "buffer temperature", 0);
  }
  throw new RangeError("buffer map");
}
export type BufferTransactionV03 = Readonly<{
  profile: BufferBankProfileV03 | null; seconds: number; originalEnergyJ: number; energyJ: number;
  inputJ: number; outputJ: number; conductanceUsedJPerK: number; flowIds: readonly string[]; entries: readonly GovernorLedgerEntryV03[];
}>;
export type BufferTransferV03 = Readonly<{ id: string; ownerId: string; otherNodeId: string; direction: "in" | "out"; energyJ: number; otherTemperatureK: number }>;
export function createBufferTransaction(profile: BufferBankProfileV03 | null, energyJ: number, seconds: number): BufferTransactionV03 {
  finite(seconds, "seconds", 0); finite(energyJ, "initial energy", 0);
  if (profile) bufferTemperature(profile, energyJ);
  else if (energyJ !== 0) throw new RangeError("energy without buffer");
  return immutableCopy({ profile, seconds, originalEnergyJ: energyJ, energyJ, inputJ: 0, outputJ: 0, conductanceUsedJPerK: 0, flowIds: [], entries: [] });
}
export function transferBuffer(transaction: BufferTransactionV03, flow: BufferTransferV03): BufferTransactionV03 {
  const tx = transaction;
  stableId(flow.id); stableId(flow.ownerId); stableId(flow.otherNodeId); uniqueIds([...tx.flowIds, flow.id]);
  finite(flow.energyJ, "flow", 0); finite(flow.otherTemperatureK, "other temperature", 0);
  if (flow.direction !== "in" && flow.direction !== "out") throw new RangeError("direction");
  finite(tx.seconds, "seconds", 0); finite(tx.originalEnergyJ, "original stock", 0);
  finite(tx.inputJ, "input", 0); finite(tx.outputJ, "output", 0); finite(tx.conductanceUsedJPerK, "conductance use", 0);
  if (!tx.profile) {
    if (flow.energyJ !== 0 || tx.energyJ !== 0 || tx.originalEnergyJ !== 0 || tx.inputJ !== 0 || tx.outputJ !== 0) throw new RangeError("no buffer");
    return immutableCopy({ ...tx, flowIds: [...tx.flowIds, flow.id] });
  }
  const profile = tx.profile;
  const temperatureK = bufferTemperature(profile, tx.originalEnergyJ);
  if (tx.energyJ !== tx.originalEnergyJ + tx.inputJ - tx.outputJ) throw new RangeError("invalid transaction energy");
  const headK = flow.direction === "in" ? flow.otherTemperatureK - temperatureK : temperatureK - flow.otherTemperatureK;
  if (flow.energyJ > 0 && headK <= 0) throw new RangeError("temperature head");
  const inputJ = finite(tx.inputJ + (flow.direction === "in" ? flow.energyJ : 0), "input", 0);
  const outputJ = finite(tx.outputJ + (flow.direction === "out" ? flow.energyJ : 0), "output", 0);
  const energyJ = finite(tx.originalEnergyJ + inputJ - outputJ, "buffer underflow", 0);
  const residualJ = energyJ - tx.originalEnergyJ - (inputJ - outputJ);
  if (Math.abs(residualJ) > tolerance(finite(2 * (inputJ + outputJ), "buffer throughput", 0))) throw new RangeError("buffer energy precision");
  const conductanceUsedJPerK = finite(tx.conductanceUsedJPerK + (flow.energyJ === 0 ? 0 : flow.energyJ / headK), "conductance use", 0);
  if (energyJ > profile.capacityJ.value || outputJ > tx.originalEnergyJ) throw new RangeError("buffer stock or capacity");
  if (inputJ > finite(profile.inputW.value * tx.seconds, "input budget", 0) || outputJ > finite(profile.outputW.value * tx.seconds, "output budget", 0) || inputJ + outputJ > finite(profile.sharedW.value * tx.seconds, "shared budget", 0)) throw new RangeError("buffer port");
  if (conductanceUsedJPerK > finite(profile.conductanceWPerK.value * tx.seconds, "conductance budget", 0)) throw new RangeError("bank conductance");
  const [from, to] = flow.direction === "in" ? [flow.otherNodeId, profile.id] : [profile.id, flow.otherNodeId];
  return immutableCopy({ ...tx, energyJ, inputJ, outputJ, conductanceUsedJPerK, flowIds: [...tx.flowIds, flow.id], entries: [...tx.entries, ...transferEntries(flow.id, flow.ownerId, from, to, flow.energyJ)] });
}
