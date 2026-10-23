import { expect, it } from "vitest";
import fixtures from "../fixtures/f2-governor/vectors.json";
import type { BufferBankProfileV03 } from "../../src/model/governor-v03/types";
import { TICK_SECONDS } from "../../src/model/governor-v03/types";
import { allocateStage, type AllocationInputV03 } from "../../src/model/governor-v03/allocation";
import { commitResources, createResourceLedger, reserveResources } from "../../src/model/governor-v03/resource-ledger";
import { tolerance } from "../../src/model/governor-v03/conservation";

function fixtureInput(id: string) {
  const vector = fixtures.vectors.find(x => x.id === `vector-${id}`)!;
  const profile = fixtures.profiles.find(x => x.id === vector.input.profileId)!;
  return {
    demandJ: 1_000_000,
    banks: profile.banks.map(profile => ({ profile: profile as BufferBankProfileV03, availableJ: profile.outputW.value * TICK_SECONDS })),
    consumers: profile.modules.map(module => ({ id: module.id, capJ: module.capW.value * TICK_SECONDS, resourceId: module.resourceId, massKgPerJ: module.massKgPerJ.value, compatibleBankIds: [...module.compatibleBankIds] as string[] })),
    resources: vector.input.state.resourceMassKg,
  };
}

it("T07 distributes 10/20/20 proportionally with the fixture SI scaling", () => {
  const input = fixtureInput("T07");
  const result = allocateStage(input);
  expect(result.allocations).toEqual([
    { bankId: "bank-a", consumerId: "cooler-10", energyJ: 200_000 },
    { bankId: "bank-a", consumerId: "cooler-20a", energyJ: 400_000 },
    { bankId: "bank-a", consumerId: "cooler-20b", energyJ: 400_000 },
  ]);
});

it("allocates the unscaled 10/20/20 → 6/12/12 case without ID priority", () => {
  const input = fixtureInput("T07"); input.demandJ = 30; input.banks[0].availableJ = 30;
  input.consumers.forEach((x, i) => x.capJ = [10, 20, 20][i]);
  expect(allocateStage(input).allocations.map(x => x.energyJ)).toEqual([6, 12, 12]);
});

it("does not redistribute the conservative resource reserve unused by a constrained source", () => {
  const input = fixtureInput("T39");
  input.resources = [{ id: "h2", massKg: 1 }];
  input.consumers = input.consumers.map(x => ({ ...x, capJ: 10, resourceId: "h2", massKgPerJ: 0.1 }));
  input.banks[0].availableJ = 0; input.banks[1].availableJ = 30; input.demandJ = 30;
  const result = allocateStage(input);
  expect(result.reservations.map(x => x.resources[0].massKg)).toEqual([1 / 3, 1 / 3, 1 / 3]);
  expect(result.allocations.reduce((sum, x) => sum + x.energyJ, 0)).toBeCloseTo(10, 12);
});

it.each(["T06", "T07", "T39"])("%s is invariant under bank, consumer and membership input permutations", id => {
  const input = fixtureInput(id), before = structuredClone(input);
  const expected = allocateStage(input);
  expect(input).toEqual(before);
  input.banks.reverse(); input.consumers.reverse();
  input.banks = input.banks.map(x => ({ ...x, profile: { ...x.profile, compatibleModuleIds: [...x.profile.compatibleModuleIds].reverse(), memberIds: [...x.profile.memberIds].reverse() } }));
  input.consumers.forEach(x => x.compatibleBankIds.reverse());
  expect(allocateStage(input)).toEqual(expected);
});

it("T06 caps the sum at one physical output/shared source budget", () => {
  const input = fixtureInput("T06");
  expect(allocateStage(input).allocations.reduce((sum, x) => sum + x.energyJ, 0)).toBeCloseTo(20_000_000 * TICK_SECONDS, 7);
});

it.each([1, 4, 16, 64])("measures real bounded pair visits for N=%s banks, K=2N consumers", n => {
  const base = fixtureInput("T07").banks[0].profile;
  const ids = Array.from({ length: 2 * n }, (_, i) => `consumer-${String(i).padStart(3, "0")}`);
  const bankIds = Array.from({ length: n }, (_, i) => `bank-${String(i).padStart(3, "0")}`);
  const result = allocateStage({ demandJ: n, resources: [], banks: bankIds.map((id, i) => ({ availableJ: 1, profile: { ...base, id, memberIds: [`physical-${i}`], compatibleModuleIds: ids, conductanceWPerK: { ...base.conductanceWPerK, value: i + 1 } } })), consumers: ids.map(id => ({ id, capJ: n, resourceId: null, massKgPerJ: 0, compatibleBankIds: bankIds })) });
  expect(result.compatibilityChecks).toBe(n * ids.length);
  expect(result.allocationVisits).toBe(3 * n * ids.length + 2 * n + 2 * ids.length);
  expect(result.allocationVisits).toBeLessThanOrEqual(3 * n * ids.length + 2 * n + 2 * ids.length);
});

it.each([-1, NaN, Infinity, -Infinity])("refuses invalid allocator amounts %s without mutating input", value => {
  for (const target of ["demand", "source", "consumer", "cost", "resource"]) {
    const input = fixtureInput("T07");
    if (target === "demand") input.demandJ = value;
    if (target === "source") input.banks[0].availableJ = value;
    if (target === "consumer") input.consumers[0].capJ = value;
    if (target === "cost") input.consumers[0].massKgPerJ = value;
    if (target === "resource") input.resources = [{ id: "h2", massKg: value }];
    const before = structuredClone(input);
    expect(() => allocateStage(input)).toThrow(); expect(input).toEqual(before);
  }
});

it("refuses duplicate IDs, dangling resources and incompatible bank membership", () => {
  const input = fixtureInput("T07");
  expect(() => allocateStage({ ...input, banks: [...input.banks, input.banks[0]] })).toThrow();
  expect(() => allocateStage({ ...input, consumers: [...input.consumers, input.consumers[0]] })).toThrow();
  expect(() => allocateStage({ ...input, resources: [{ id: "h2", massKg: 1 }, { id: "h2", massKg: 1 }] })).toThrow();
  input.consumers[0].compatibleBankIds = [];
  expect(() => allocateStage(input)).toThrow();
  input.consumers[0].compatibleBankIds = ["unknown"];
  expect(() => allocateStage(input)).toThrow();
  input.consumers[0].compatibleBankIds = ["bank-a"]; input.consumers[0].resourceId = "unknown";
  expect(() => allocateStage(input)).toThrow();
});

it("T01/T02/T10 has no allocation for a bare ship, empty source or zero demand", () => {
  expect(allocateStage({ demandJ: 10, banks: [], consumers: [], resources: [] })).toEqual({ allocations: [], reservations: [], compatibilityChecks: 0, allocationVisits: 0 });
  const input = fixtureInput("T07"); input.banks[0].availableJ = 0;
  expect(allocateStage(input).allocations).toEqual([]);
  input.banks[0].availableJ = 100; input.demandJ = 0;
  expect(allocateStage(input).allocations).toEqual([]);
});

it("T03/T04/T14 respects an already selected stage target and carries only remaining demand to the next call", () => {
  const input = fixtureInput("T07"); input.demandJ = 7;
  const first = allocateStage(input);
  const actual = first.allocations.reduce((sum, x) => sum + x.energyJ, 0);
  expect(actual).toBe(7);
  expect(allocateStage({ ...input, demandJ: 7 - actual }).allocations).toEqual([]);
});

it("T05/T09/T11/T13/T17 honors zero or reduced thermal/electrical caps supplied by its stage owner", () => {
  const input = fixtureInput("T07");
  input.consumers[0].capJ = 0;
  input.consumers[1].capJ = 2;
  input.consumers[2].capJ = 0;
  expect(allocateStage(input).allocations).toEqual([{ bankId: "bank-a", consumerId: "cooler-20a", energyJ: 2 }]);
});

it("returns fractional resource reservations that the shared finite ledger can accept", () => {
  for (let trial = 1; trial <= 40; trial++) {
    const input = fixtureInput("T07");
    input.resources = [{ id: "h2", massKg: trial / 97 }];
    input.consumers = input.consumers.map((x, i) => ({ ...x, resourceId: "h2", massKgPerJ: (i + 1) / 31, capJ: (i + 1) * 7 / 13 }));
    const result = allocateStage(input);
    let ledger = createResourceLedger(input.resources);
    expect(() => { for (const reservation of result.reservations) ledger = reserveResources(ledger, reservation.ownerId, reservation.resources); }).not.toThrow();
  }
});

function commitGrantedWork(input: AllocationInputV03, result: ReturnType<typeof allocateStage>, perBank: boolean) {
  let ledger = createResourceLedger(input.resources);
  for (const reservation of result.reservations) ledger = reserveResources(ledger, reservation.ownerId, reservation.resources);
  return commitResources(ledger, input.consumers.map(consumer => {
    const grants = result.allocations.filter(x => x.consumerId === consumer.id);
    const massKg = perBank ? grants.reduce((sum, x) => sum + x.energyJ * consumer.massKgPerJ, 0) : grants.reduce((sum, x) => sum + x.energyJ, 0) * consumer.massKgPerJ;
    return { ownerId: consumer.id, resources: [{ id: consumer.resourceId!, massKg }] };
  }));
}

it("QA-B1 commits natural actual mass for the exact 1-bank/2-consumer fractional residual", () => {
  const bank = fixtures.profiles.find(x => x.id === "synthetic-base")!.banks[0] as BufferBankProfileV03;
  const input = {
    demandJ: 10,
    banks: [{ profile: { ...bank, id: "b", compatibleModuleIds: ["c0", "c1"] }, availableJ: 10 }],
    resources: [{ id: "fuel", massKg: 0.1 }],
    consumers: [1, 2].map((capJ, i) => ({ id: `c${i}`, capJ, resourceId: "fuel", massKgPerJ: 0.1, compatibleBankIds: ["b"] })),
  };
  const before = structuredClone(input);
  const result = allocateStage(input);
  expect(result.allocations.map(x => x.energyJ)).toEqual([expect.closeTo(1 / 3, 12), expect.closeTo(2 / 3, 12)]);
  for (const perBank of [false, true]) expect(() => commitGrantedWork(input, result, perBank)).not.toThrow();
  expect(input).toEqual(before);
});

it.each([1, 2, 5])("QA-B1 commits fractional grants across %s banks with shared or distinct profiles", n => {
  const base = fixtures.profiles.find(x => x.id === "synthetic-base")!.banks[0] as BufferBankProfileV03;
  for (const distinctProfiles of [false, true]) for (let trial = 1; trial <= 40; trial++) {
    const bankIds = Array.from({ length: n }, (_, i) => `b${i}`);
    const input = {
      demandJ: 10,
      banks: bankIds.map((id, i) => ({ availableJ: (i + 1) / (n + 1), profile: { ...base, id, memberIds: [`physical-${i}`], compatibleModuleIds: ["c0", "c1", "c2"], conductanceWPerK: { ...base.conductanceWPerK, value: distinctProfiles ? i + 1 : 1 } } })),
      resources: [{ id: "fuel", massKg: trial / 97 }],
      consumers: [1, 2, 3].map((weight, i) => ({ id: `c${i}`, capJ: weight * trial / 23, resourceId: "fuel", massKgPerJ: weight / 17, compatibleBankIds: [...bankIds] })),
    };
    const result = allocateStage(input);
    expect(result.allocations.reduce((sum, allocation) => sum + allocation.energyJ, 0)).toBeGreaterThan(0);
    for (const perBank of [false, true]) {
      const committed = commitGrantedWork(input, result, perBank);
      expect(committed.balances[0].massKg).toBeGreaterThanOrEqual(0);
    }
    expect(allocateStage({ ...input, banks: [...input.banks].reverse(), consumers: [...input.consumers].reverse() })).toEqual(result);
  }
});

function overlappingInputs() {
  const base = fixtures.profiles.find(x => x.id === "synthetic-base")!.banks[0] as BufferBankProfileV03;
  let seed = 20261023;
  const random = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: 1000 }, (): AllocationInputV03 => {
    const n = 1 + Math.floor(random() * 9), k = 1 + Math.floor(random() * 13);
    const bankIds = Array.from({ length: n }, (_, i) => `b${i}`), ids = Array.from({ length: k }, (_, i) => `c${i}`);
    const memberships = bankIds.map(() => ids.filter(() => random() > 0.3));
    const banks = bankIds.map((id, i) => ({ availableJ: random() * 10, profile: { ...base, id, memberIds: [`p${i}`], compatibleModuleIds: memberships[i], conductanceWPerK: { ...base.conductanceWPerK, value: 1 + i % 3 } } }));
    const resources = [{ id: "fuel", massKg: 0.1 + random() * 10 }];
    const consumers = ids.map(id => ({ id, capJ: 0.2 + random() * 20, massKgPerJ: 0.01 + random() * 0.9, compatibleBankIds: bankIds.filter((_, i) => memberships[i].includes(id)), resourceId: "fuel" }));
    return { demandJ: 30, banks, resources, consumers };
  });
}

function expectSupportedOverlap(input: AllocationInputV03) {
  const before = structuredClone(input);
  const result = allocateStage(input);
  const totalJ = result.allocations.reduce((sum, x) => sum + x.energyJ, 0);
  expect(Number.isFinite(totalJ)).toBe(true);
  expect(totalJ).toBeLessThanOrEqual(input.demandJ + tolerance(totalJ));
  for (const allocation of result.allocations) {
    expect(allocation.energyJ).toBeGreaterThanOrEqual(0);
    expect(input.banks.find(x => x.profile.id === allocation.bankId)!.profile.compatibleModuleIds).toContain(allocation.consumerId);
  }
  for (const bank of input.banks) {
    const actualJ = result.allocations.filter(x => x.bankId === bank.profile.id).reduce((sum, x) => sum + x.energyJ, 0);
    expect(actualJ).toBeLessThanOrEqual(bank.availableJ + tolerance(actualJ));
  }
  const costKg = input.consumers.reduce((sum, x) => sum + x.capJ * x.massKgPerJ, 0);
  const gamma = Math.min(1, input.resources[0].massKg / costKg);
  for (const consumer of input.consumers) {
    const actualJ = result.allocations.filter(x => x.consumerId === consumer.id).reduce((sum, x) => sum + x.energyJ, 0);
    expect(actualJ).toBeLessThanOrEqual(gamma * consumer.capJ + tolerance(actualJ));
  }
  for (const perBank of [false, true]) expect(commitGrantedWork(input, result, perBank).balances[0].massKg).toBeGreaterThanOrEqual(0);
  expect(result.compatibilityChecks).toBe(input.banks.length * input.consumers.length);
  expect(result.allocationVisits).toBeLessThanOrEqual(3 * input.banks.length * input.consumers.length + 2 * input.banks.length + 2 * input.consumers.length);
  expect(input).toEqual(before);
  expect(allocateStage({ ...input, banks: [...input.banks].reverse().map(x => ({ ...x, profile: { ...x.profile, compatibleModuleIds: [...x.profile.compatibleModuleIds].reverse() } })), consumers: [...input.consumers].reverse().map(x => ({ ...x, compatibleBankIds: [...x.compatibleBankIds].reverse() })) })).toEqual(result);
}

it("DEV-C1 returns consumable nonnegative grants for literal trial241", () => {
  const base = fixtures.profiles.find(x => x.id === "synthetic-base")!.banks[0] as BufferBankProfileV03;
  const bankRows: [string, number, string[]][] = [
    ["b0", 9.058348170947284, ["c1", "c2", "c3", "c4", "c6", "c7", "c8", "c9"]],
    ["b1", 9.349925755523145, ["c0", "c1", "c3", "c4", "c5", "c8"]],
    ["b2", 7.528891891706735, ["c2", "c3", "c5", "c8", "c9"]],
    ["b3", 1.136722881346941, ["c5", "c6", "c7", "c8", "c9"]],
  ];
  const consumerRows: [string, number, number, string[]][] = [
    ["c0", 0.8774937827140092, 0.4627014171937481, ["b1"]],
    ["c1", 18.842568867653608, 0.30996057606767863, ["b0", "b1"]],
    ["c2", 19.98533840738237, 0.6910258417623117, ["b0", "b2"]],
    ["c3", 12.46045750081539, 0.13343068884219975, ["b0", "b1", "b2"]],
    ["c4", 17.52902751304209, 0.20091276305262, ["b0", "b1"]],
    ["c5", 1.9640297301113605, 0.7438542881188914, ["b1", "b2", "b3"]],
    ["c6", 7.3420505177229645, 0.2961717523308471, ["b0", "b3"]],
    ["c7", 19.055770640075206, 0.29557137881871315, ["b0", "b3"]],
    ["c8", 11.573097645118832, 0.46355953967664393, ["b0", "b1", "b2", "b3"]],
    ["c9", 0.3164764724671841, 0.13247618034016342, ["b0", "b2", "b3"]],
  ];
  const input = {
    demandJ: 30, resources: [{ id: "fuel", massKg: 6.11475374540314 }],
    banks: bankRows.map(([id, availableJ, compatibleModuleIds], i) => ({ availableJ, profile: { ...base, id, memberIds: [`p${i}`], compatibleModuleIds, conductanceWPerK: { ...base.conductanceWPerK, value: 1 + i % 3 } } })),
    consumers: consumerRows.map(([id, capJ, massKgPerJ, compatibleBankIds]) => ({ id, capJ, massKgPerJ, compatibleBankIds, resourceId: "fuel" })),
  };
  expect(input).toEqual(overlappingInputs()[241]);
  expectSupportedOverlap(input);
});

it.each([241, 286, 430, 451])("DEV-C1 preserves supported overlapping-bank allocation at generated trial%s", trial => {
  expectSupportedOverlap(overlappingInputs()[trial]);
});

it("DEV-C1 supports all 1000 overlapping-bank inputs from seed 20261023", () => {
  for (const input of overlappingInputs()) expectSupportedOverlap(input);
});

it("refuses a bank source budget above its physical capacity before returning a commit", () => {
  const input = fixtureInput("T07");
  input.banks[0].availableJ = input.banks[0].profile.capacityJ.value + 1;
  const before = structuredClone(input);
  expect(() => allocateStage(input)).toThrow();
  expect(input).toEqual(before);
});

it("scales each resource group conservatively before source allocation with no redistribution", () => {
  const input = fixtureInput("T07");
  input.demandJ = 30;
  input.banks[0].availableJ = 30;
  input.resources = [{ id: "h2", massKg: 5 }];
  input.consumers = input.consumers.map((x, i) => ({ ...x, capJ: [10, 20, 20][i], resourceId: "h2", massKgPerJ: 1 }));
  const result = allocateStage(input);
  expect(result.allocations.map(x => x.energyJ)).toEqual([1, 2, 2]);
  expect(result.reservations.map(x => x.resources[0].massKg)).toEqual([1, 2, 2]);
});

it("aggregates physically identical banks before allocation and divides their actual source use proportionally", () => {
  const input = fixtureInput("T07");
  const first = input.banks[0];
  input.banks.push({ profile: { ...first.profile, id: "bank-b", memberIds: ["buffer-b"] }, availableJ: first.availableJ });
  input.consumers.forEach(x => x.compatibleBankIds.push("bank-b"));
  const result = allocateStage(input);
  expect(result.allocations).toEqual([
    { bankId: "bank-a", consumerId: "cooler-10", energyJ: 100_000 },
    { bankId: "bank-a", consumerId: "cooler-20a", energyJ: 200_000 },
    { bankId: "bank-a", consumerId: "cooler-20b", energyJ: 200_000 },
    { bankId: "bank-b", consumerId: "cooler-10", energyJ: 100_000 },
    { bankId: "bank-b", consumerId: "cooler-20a", energyJ: 200_000 },
    { bankId: "bank-b", consumerId: "cooler-20b", energyJ: 200_000 },
  ]);
});

it("T39 serves the constrained B before the flexible bank serves remaining A, regardless of IDs", () => {
  const input = fixtureInput("T39");
  input.banks[0].profile = { ...input.banks[0].profile, id: "z-constrained" };
  input.banks[1].profile = { ...input.banks[1].profile, id: "a-flexible" };
  input.consumers.forEach(x => { x.compatibleBankIds = x.compatibleBankIds.map(id => id === "bank-a" ? "z-constrained" : "a-flexible"); });
  input.demandJ = 20_000_000 * TICK_SECONDS;
  const result = allocateStage(input);
  expect(result.allocations.find(x => x.bankId === "z-constrained")!.energyJ).toBeCloseTo(10_000_000 * TICK_SECONDS, 7);
  expect(result.allocations.filter(x => x.bankId === "a-flexible").map(x => x.consumerId)).toEqual(["cooler-20a", "cooler-20b"]);
});
