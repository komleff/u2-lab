import { auditConservation, finite, lexical, stableId, uniqueIds } from "./conservation";
import type { GovernorLedgerEntryV03 } from "./types";

export type ResourceAmountV03 = Readonly<{ id: string; massKg: number }>;
export type ResourceReservationV03 = Readonly<{ ownerId: string; resources: readonly ResourceAmountV03[] }>;
export type ResourceLedgerV03 = Readonly<{ originalStock: readonly ResourceAmountV03[]; reservations: readonly ResourceReservationV03[] }>;

function amounts(values: readonly ResourceAmountV03[]): readonly ResourceAmountV03[] {
  uniqueIds(values.map(x => x.id));
  return Object.freeze([...values].sort((a, b) => lexical(a.id, b.id)).map(x => Object.freeze({ id: x.id, massKg: finite(x.massKg, "resource mass", 0) })));
}
export function createResourceLedger(stock: readonly ResourceAmountV03[]): ResourceLedgerV03 {
  return Object.freeze({ originalStock: amounts(stock), reservations: Object.freeze([]) });
}
function snapshot(ledger: ResourceLedgerV03): ResourceLedgerV03 {
  const originalStock = amounts(ledger.originalStock);
  uniqueIds(ledger.reservations.map(x => x.ownerId));
  const reservations = Object.freeze([...ledger.reservations].sort((a, b) => lexical(a.ownerId, b.ownerId)).map(x => Object.freeze({ ownerId: x.ownerId, resources: amounts(x.resources) })));
  const remaining = new Map(originalStock.map(x => [x.id, x.massKg]));
  for (const owner of reservations) for (const resource of owner.resources) {
    if (!remaining.has(resource.id)) throw new RangeError("unknown resource");
    remaining.set(resource.id, finite(remaining.get(resource.id)! - resource.massKg, "over reservation", 0));
  }
  return Object.freeze({ originalStock, reservations });
}
export function reserveResources(ledger: ResourceLedgerV03, ownerId: string, resources: readonly ResourceAmountV03[]): ResourceLedgerV03 {
  stableId(ownerId);
  return snapshot({ originalStock: ledger.originalStock, reservations: [...ledger.reservations, { ownerId, resources }] });
}
export function commitResources(ledger: ResourceLedgerV03, consumption: readonly ResourceReservationV03[]) {
  const reservationEvidence = snapshot(ledger);
  uniqueIds(consumption.map(x => x.ownerId));
  const actual = [...consumption].sort((a, b) => lexical(a.ownerId, b.ownerId));
  const balances = new Map(reservationEvidence.originalStock.map(x => [x.id, x.massKg]));
  const reservations = new Map(reservationEvidence.reservations.map(x => [x.ownerId, new Map(x.resources.map(r => [r.id, r.massKg]))]));
  const consumed: ResourceReservationV03[] = [];
  const entries: GovernorLedgerEntryV03[] = [];
  for (const owner of actual) {
    const reserved = reservations.get(owner.ownerId);
    if (!reserved) throw new RangeError("unknown owner");
    const resources = amounts(owner.resources);
    for (const resource of resources) {
      const cap = reserved.get(resource.id);
      if (cap === undefined || resource.massKg > cap) throw new RangeError("unreserved consumption");
      balances.set(resource.id, finite(balances.get(resource.id)! - resource.massKg, "negative balance", 0));
      entries.push(Object.freeze({ id: JSON.stringify([owner.ownerId, resource.id]), ownerId: owner.ownerId, kind: "external-output", nodeId: `resource:${resource.id}`, counterpartyId: "consumed", energyJ: 0, resourceId: resource.id, massKg: -resource.massKg }));
    }
    consumed.push(Object.freeze({ ownerId: owner.ownerId, resources }));
  }
  const accounting = auditConservation(entries, reservationEvidence.originalStock.map(x => ({ nodeId: `resource:${x.id}`, energyDeltaJ: 0, resources: [{ id: x.id, deltaKg: balances.get(x.id)! - x.massKg }] })));
  return Object.freeze({ balances: amounts([...balances].map(([id, massKg]) => ({ id, massKg }))), consumed: Object.freeze(consumed), reservationEvidence, entries: Object.freeze(entries), accounting });
}
