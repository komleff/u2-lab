import { assertWithinCap, finite, immutableCopy, lexical, tolerance, uniqueIds } from "./conservation";
import { validateBankProfile } from "./buffer-bank";
import type { BufferBankProfileV03 } from "./types";
import type { ResourceAmountV03, ResourceReservationV03 } from "./resource-ledger";

export type AllocationConsumerV03 = Readonly<{ id: string; capJ: number; resourceId: string | null; massKgPerJ: number; compatibleBankIds: readonly string[] }>;
export type AllocationBankV03 = Readonly<{ profile: BufferBankProfileV03; availableJ: number }>;
export type AllocationInputV03 = Readonly<{ demandJ: number; banks: readonly AllocationBankV03[]; consumers: readonly AllocationConsumerV03[]; resources: readonly ResourceAmountV03[] }>;
export type AllocationV03 = Readonly<{ bankId: string; consumerId: string; energyJ: number }>;

export function allocateStage(input: AllocationInputV03) {
  finite(input.demandJ, "demand", 0);
  uniqueIds(input.banks.map(x => x.profile.id)); uniqueIds(input.consumers.map(x => x.id)); uniqueIds(input.resources.map(x => x.id));
  const banks = [...input.banks].sort((a, b) => lexical(a.profile.id, b.profile.id));
  const consumers = [...input.consumers].sort((a, b) => lexical(a.id, b.id));
  for (const bank of banks) {
    validateBankProfile(bank.profile); finite(bank.availableJ, "source cap", 0);
    if (bank.availableJ > bank.profile.capacityJ.value) throw new RangeError("bank source capacity");
  }
  for (const resource of input.resources) finite(resource.massKg, "resource stock", 0);
  const bankIds = new Set(banks.map(x => x.profile.id));
  for (const consumer of consumers) {
    finite(consumer.capJ, "consumer cap", 0); finite(consumer.massKgPerJ, "mass cost", 0); uniqueIds(consumer.compatibleBankIds);
    if (consumer.compatibleBankIds.some(id => !bankIds.has(id))) throw new RangeError("unknown bank");
    if (consumer.resourceId === null && consumer.massKgPerJ !== 0) throw new RangeError("unowned resource cost");
  }
  // Считаются реальные проверки пар и арифметические visits; сортировка и validation — вне этих метрик.
  let compatibilityChecks = 0, allocationVisits = 0;
  const compatibility = new Map<string, boolean[]>();
  const bankMembership = new Map(banks.map(bank => [bank.profile.id, new Set(bank.profile.compatibleModuleIds)]));
  const consumerMembership = new Map(consumers.map(consumer => [consumer.id, new Set(consumer.compatibleBankIds)]));
  for (const bank of banks) compatibility.set(bank.profile.id, consumers.map(consumer => {
    compatibilityChecks++;
    const fromBank = bankMembership.get(bank.profile.id)!.has(consumer.id);
    const fromConsumer = consumerMembership.get(consumer.id)!.has(bank.profile.id);
    if (fromBank !== fromConsumer) throw new RangeError("incompatible membership");
    return fromBank;
  }));
  const fingerprint = (bank: AllocationBankV03) => JSON.stringify([
    bank.profile.capacityJ.value, bank.profile.temperatureByEnergy.map(x => [x.energyJ.value, x.temperatureK.value]),
    bank.profile.inputW.value, bank.profile.outputW.value, bank.profile.sharedW.value, bank.profile.conductanceWPerK.value,
    [...bank.profile.compatibleModuleIds].sort(lexical),
  ]);
  const grouped = new Map<string, { members: AllocationBankV03[]; availableJ: number; compatible: boolean[]; count: number; signature: string; fingerprint: string }>();
  for (const bank of banks) {
    allocationVisits++;
    const key = fingerprint(bank);
    const compatible = compatibility.get(bank.profile.id)!;
    const group = grouped.get(key) ?? { members: [], availableJ: 0, compatible, count: compatible.filter(Boolean).length, signature: JSON.stringify(consumers.filter((_, i) => compatible[i]).map(x => x.id)), fingerprint: key };
    group.members.push(bank); group.availableJ = finite(group.availableJ + bank.availableJ, "group source cap", 0); grouped.set(key, group);
  }
  const groups = [...grouped.values()].sort((a, b) => a.count - b.count || lexical(a.signature, b.signature) || lexical(a.fingerprint, b.fingerprint) || lexical(a.members[0].profile.id, b.members[0].profile.id));
  const stock = new Map(input.resources.map(x => [x.id, x.massKg]));
  const required = new Map<string, number>();
  for (const consumer of consumers) {
    allocationVisits++;
    if (consumer.resourceId === null) continue;
    if (!stock.has(consumer.resourceId)) throw new RangeError("unknown resource");
    required.set(consumer.resourceId, finite((required.get(consumer.resourceId) ?? 0) + finite(consumer.massKgPerJ * consumer.capJ, "resource cost", 0), "group resource cost", 0));
  }
  const reservations: ResourceReservationV03[] = [];
  const reservationRemaining = new Map(stock);
  const remaining = consumers.map(consumer => {
    allocationVisits++;
    if (consumer.resourceId === null) return consumer.capJ;
    const cost = required.get(consumer.resourceId)!;
    const gamma = cost === 0 ? 1 : Math.min(1, stock.get(consumer.resourceId)! / cost);
    let cap = finite(gamma * consumer.capJ, "scaled cap", 0);
    const formulaCap = cap;
    const availableKg = reservationRemaining.get(consumer.resourceId)!;
    let massKg = finite(cap * consumer.massKgPerJ, "reserved mass", 0);
    if (massKg > availableKg) {
      assertWithinCap(massKg, availableKg, "mass");
      cap = Math.min(formulaCap, availableKg / consumer.massKgPerJ);
      // Последний floating residual остаётся у canonical ID; округляем reserve вниз до commit.
      if (cap * consumer.massKgPerJ > availableKg) cap *= 1 - Number.EPSILON;
      if (Math.abs(formulaCap - cap) > tolerance(formulaCap)) throw new RangeError("resource rounding exceeds energy tolerance");
      massKg = finite(cap * consumer.massKgPerJ, "rounded reserved mass", 0);
    }
    reservationRemaining.set(consumer.resourceId, finite(availableKg - massKg, "reserved balance", 0));
    reservations.push({ ownerId: consumer.id, resources: [{ id: consumer.resourceId, massKg }] });
    return cap;
  });
  const allocations: AllocationV03[] = [];
  let demandJ = input.demandJ;
  for (const group of groups) {
    const compatible = group.compatible;
    let total = 0, last = -1;
    for (let i = 0; i < consumers.length; i++) {
      allocationVisits++;
      if (compatible[i]) { total = finite(total + remaining[i], "cap sum", 0); if (remaining[i] > 0) last = i; }
    }
    const actual = Math.min(demandJ, group.availableJ, total);
    let assigned = 0;
    const grants = new Float64Array(consumers.length);
    for (let i = 0; i < consumers.length; i++) {
      allocationVisits++;
      if (!compatible[i] || remaining[i] === 0 || actual === 0) continue;
      const energyJ = i === last ? actual - assigned : actual * (remaining[i] / total);
      assertWithinCap(energyJ, remaining[i]);
      assigned += energyJ; remaining[i] -= energyJ;
      grants[i] = energyJ;
    }
    const split = new Float64Array(consumers.length);
    const lastBank = group.members.findLastIndex(x => x.availableJ > 0);
    for (let j = 0; j < group.members.length; j++) {
      const bank = group.members[j];
      let bankTotal = 0;
      for (let i = 0; i < consumers.length; i++) {
        allocationVisits++;
        if (grants[i] === 0 || bank.availableJ === 0) continue;
        const energyJ = j === lastBank ? grants[i] - split[i] : grants[i] * (bank.availableJ / group.availableJ);
        finite(energyJ, "allocation", 0); split[i] += energyJ; bankTotal += energyJ;
        allocations.push({ bankId: bank.profile.id, consumerId: consumers[i].id, energyJ });
      }
      assertWithinCap(bankTotal, bank.availableJ);
    }
    demandJ -= actual;
  }
  if (compatibilityChecks > banks.length * consumers.length || allocationVisits > 3 * banks.length * consumers.length + 2 * banks.length + 2 * consumers.length) throw new RangeError("allocator operation bound");
  return immutableCopy({ allocations: allocations.sort((a, b) => lexical(a.bankId, b.bankId) || lexical(a.consumerId, b.consumerId)), reservations, compatibilityChecks, allocationVisits });
}
