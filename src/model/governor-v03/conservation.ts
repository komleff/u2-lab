import { GOVERNOR_TOLERANCES } from "./tolerances";
import type { GovernorLedgerEntryV03 } from "./types";

export type NodeChangeV03 = Readonly<{ nodeId: string; energyDeltaJ: number; resources: readonly Readonly<{ id: string; deltaKg: number }>[] }>;
export function finite(value: number, name: string, minimum = -Infinity): number {
  if (!Number.isFinite(value) || value < minimum) throw new RangeError(name);
  return value;
}
export function stableId(id: string): string {
  if (typeof id !== "string" || !id.length) throw new RangeError("id");
  return id;
}
export function uniqueIds(ids: readonly string[]): void {
  const seen = new Set<string>();
  for (const id of ids) { stableId(id); if (seen.has(id)) throw new RangeError("duplicate id"); seen.add(id); }
}
export const lexical = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
export function immutableCopy<T>(value: T): T {
  const copy = structuredClone(value);
  function freeze(item: unknown): void {
    if (typeof item !== "object" || item === null) return;
    for (const child of Object.values(item)) freeze(child);
    Object.freeze(item);
  }
  freeze(copy);
  return copy;
}
export function tolerance(throughput: number, unit: "energy" | "mass" = "energy"): number {
  finite(throughput, "throughput", 0);
  const policy = GOVERNOR_TOLERANCES[unit];
  return policy.absolute + policy.relative * throughput;
}
export function assertWithinCap(actual: number, cap: number, unit: "energy" | "mass" = "energy"): void {
  finite(actual, "actual", 0); finite(cap, "cap", 0);
  if (actual - cap > tolerance(actual, unit)) throw new RangeError("cap overflow");
}
export function transferEntries(id: string, ownerId: string, from: string, to: string, energyJ: number): readonly GovernorLedgerEntryV03[] {
  stableId(id); stableId(ownerId); stableId(from); stableId(to); finite(energyJ, "transfer", 0);
  if (from === to) throw new RangeError("self transfer");
  return Object.freeze([
    Object.freeze({ id: `${id}:out`, ownerId, kind: "internal-transfer" as const, nodeId: from, counterpartyId: to, energyJ: -energyJ, resourceId: null, massKg: 0 }),
    Object.freeze({ id: `${id}:in`, ownerId, kind: "internal-transfer" as const, nodeId: to, counterpartyId: from, energyJ, resourceId: null, massKg: 0 }),
  ]);
}
export function auditConservation(entries: readonly GovernorLedgerEntryV03[], changes: readonly NodeChangeV03[]) {
  const ordered = [...entries].sort((a, b) => lexical(a.id, b.id));
  const nodes = [...changes].sort((a, b) => lexical(a.nodeId, b.nodeId));
  uniqueIds(ordered.map(x => x.id)); uniqueIds(nodes.map(x => x.nodeId));
  let energyThroughputJ = 0;
  const mass = new Map<string, { residualKg: number; throughputKg: number }>();
  const energyByNode = new Map<string, number>();
  const massByNode = new Map<string, Map<string, number>>();
  const pairs = new Map<string, number>();
  for (const entry of ordered) {
    stableId(entry.ownerId); stableId(entry.nodeId); stableId(entry.counterpartyId);
    finite(entry.energyJ, "energy"); finite(entry.massKg, "mass");
    if (entry.resourceId === null && entry.massKg !== 0) throw new RangeError("unowned mass");
    if (entry.resourceId !== null) stableId(entry.resourceId);
    if (entry.kind === "internal-transfer" || entry.kind === "conversion") {
      if (entry.nodeId === entry.counterpartyId) throw new RangeError("self transfer");
      const key = JSON.stringify([entry.kind, entry.ownerId, entry.nodeId, entry.counterpartyId, entry.resourceId, entry.energyJ, entry.massKg]);
      const opposite = JSON.stringify([entry.kind, entry.ownerId, entry.counterpartyId, entry.nodeId, entry.resourceId, -entry.energyJ, -entry.massKg]);
      if ((pairs.get(opposite) ?? 0) > 0) pairs.set(opposite, pairs.get(opposite)! - 1);
      else pairs.set(key, (pairs.get(key) ?? 0) + 1);
    } else if (entry.kind === "external-input") {
      if (entry.energyJ < 0 || entry.massKg < 0) throw new RangeError("input sign");
    } else if (entry.kind === "external-output") {
      if (entry.energyJ > 0 || entry.massKg > 0) throw new RangeError("output sign");
    } else throw new RangeError("ledger kind");
    energyThroughputJ = finite(energyThroughputJ + Math.abs(entry.energyJ), "energy throughput", 0);
    energyByNode.set(entry.nodeId, finite((energyByNode.get(entry.nodeId) ?? 0) + entry.energyJ, "node energy"));
    if (entry.resourceId !== null) {
      const total = mass.get(entry.resourceId) ?? { residualKg: 0, throughputKg: 0 };
      total.throughputKg = finite(total.throughputKg + Math.abs(entry.massKg), "mass throughput", 0); mass.set(entry.resourceId, total);
      const values = massByNode.get(entry.nodeId) ?? new Map<string, number>();
      values.set(entry.resourceId, finite((values.get(entry.resourceId) ?? 0) + entry.massKg, "node mass")); massByNode.set(entry.nodeId, values);
    }
  }
  if ([...pairs.values()].some(x => x !== 0)) throw new RangeError("unpaired transfer");
  let energyResidualJ = 0;
  for (const node of nodes) {
    finite(node.energyDeltaJ, "delta energy"); uniqueIds(node.resources.map(x => x.id));
    const nodeResidual = finite(node.energyDeltaJ - (energyByNode.get(node.nodeId) ?? 0), "node residual");
    if (Math.abs(nodeResidual) > tolerance(energyThroughputJ)) throw new RangeError("unowned node energy");
    energyResidualJ = finite(energyResidualJ + nodeResidual, "energy residual");
    energyByNode.delete(node.nodeId);
    const values = massByNode.get(node.nodeId) ?? new Map<string, number>();
    for (const resource of [...node.resources].sort((a, b) => lexical(a.id, b.id))) {
      finite(resource.deltaKg, "delta mass");
      const total = mass.get(resource.id) ?? { residualKg: 0, throughputKg: 0 };
      const residual = finite(resource.deltaKg - (values.get(resource.id) ?? 0), "node mass residual");
      if (Math.abs(residual) > tolerance(total.throughputKg, "mass")) throw new RangeError("unowned node mass");
      total.residualKg = finite(total.residualKg + residual, "mass residual");
      mass.set(resource.id, total); values.delete(resource.id);
    }
    if ([...values.values()].some(x => x !== 0)) throw new RangeError("missing resource change");
    massByNode.delete(node.nodeId);
  }
  if (energyByNode.size || massByNode.size) throw new RangeError("missing node change");
  if (Math.abs(energyResidualJ) > tolerance(energyThroughputJ)) throw new RangeError("energy conservation");
  const resources = [...mass].sort(([a], [b]) => lexical(a, b)).map(([id, value]) => {
    if (Math.abs(value.residualKg) > tolerance(value.throughputKg, "mass")) throw new RangeError("mass conservation");
    return Object.freeze({ id, ...value });
  });
  return Object.freeze({ energyResidualJ, energyThroughputJ, resources: Object.freeze(resources) });
}
