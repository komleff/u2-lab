import { expect, it } from "vitest";
import fixtures from "../fixtures/f2-governor/vectors.json";
import { auditConservation, assertWithinCap, transferEntries, tolerance } from "../../src/model/governor-v03/conservation";

it("T37 attributes ship pickup plus electrical work to one outward owner", () => {
  const parameters = fixtures.vectors.find(x => x.id === "vector-T37")!.input.parameters;
  const value = (id: string) => parameters.find(x => x.id === id)!.value;
  const entries = [
    { id: "pickup:out", ownerId: "ti", kind: "internal-transfer", nodeId: "ship", counterpartyId: "ti", energyJ: -value("ship-pickup"), resourceId: null, massKg: 0 },
    { id: "pickup:in", ownerId: "ti", kind: "internal-transfer", nodeId: "ti", counterpartyId: "ship", energyJ: value("ship-pickup"), resourceId: null, massKg: 0 },
    { id: "work:out", ownerId: "ti", kind: "conversion", nodeId: "electric", counterpartyId: "ti", energyJ: -value("electrical-work"), resourceId: null, massKg: 0 },
    { id: "work:in", ownerId: "ti", kind: "conversion", nodeId: "ti", counterpartyId: "electric", energyJ: value("electrical-work"), resourceId: null, massKg: 0 },
    { id: "outward", ownerId: "ti", kind: "external-output", nodeId: "ti", counterpartyId: "space", energyJ: -value("outward"), resourceId: null, massKg: 0 },
  ] as const;
  expect(auditConservation(entries, [
    { nodeId: "ship", energyDeltaJ: -1_000_000, resources: [] },
    { nodeId: "electric", energyDeltaJ: -500_000, resources: [] },
    { nodeId: "ti", energyDeltaJ: 0, resources: [] },
  ])).toEqual({ energyResidualJ: 0, energyThroughputJ: 4_500_000, resources: [] });
});

it.each([0, 1e9])("uses actual transfer throughput %s and absolute floors for energy and mass", throughput => {
  expect(tolerance(throughput)).toBe(1e-6 + 1e-10 * throughput);
  expect(tolerance(throughput, "mass")).toBe(1e-12 + 1e-10 * throughput);
  expect(() => assertWithinCap(throughput + tolerance(throughput) / 2, throughput)).not.toThrow();
  expect(() => assertWithinCap(throughput + tolerance(throughput) * 2, throughput)).toThrow();
});

it("audits resource mass independently and preserves external loss ownership", () => {
  const entry = { id: "exhaust", ownerId: "generator", kind: "external-output", nodeId: "fuel", counterpartyId: "space", energyJ: -20, resourceId: "h2", massKg: -0.25 } as const;
  expect(auditConservation([entry], [{ nodeId: "fuel", energyDeltaJ: -20, resources: [{ id: "h2", deltaKg: -0.25 }] }])).toEqual({ energyResidualJ: 0, energyThroughputJ: 20, resources: [{ id: "h2", residualKg: 0, throughputKg: 0.25 }] });
  expect(() => auditConservation([entry], [{ nodeId: "fuel", energyDeltaJ: -20, resources: [{ id: "h2", deltaKg: -0.2 }] }])).toThrow();
});

it.each([NaN, Infinity, -Infinity])("refuses non-finite ledger entry %s atomically", energyJ => {
  const entries = [{ id: "in", ownerId: "sun", kind: "external-input", nodeId: "ship", counterpartyId: "space", energyJ, resourceId: null, massKg: 0 }] as const;
  const before = structuredClone(entries);
  expect(() => auditConservation(entries, [{ nodeId: "ship", energyDeltaJ: 0, resources: [] }])).toThrow();
  expect(entries).toEqual(before);
});

it("refuses duplicate entries, missing owner, missing node and incorrect external signs", () => {
  const entry = { id: "in", ownerId: "sun", kind: "external-input", nodeId: "ship", counterpartyId: "space", energyJ: 10, resourceId: null, massKg: 0 } as const;
  const changes = [{ nodeId: "ship", energyDeltaJ: 10, resources: [] }];
  expect(() => auditConservation([entry, entry], changes)).toThrow();
  expect(() => auditConservation([{ ...entry, ownerId: "" }], changes)).toThrow();
  expect(() => auditConservation([entry], [])).toThrow();
  expect(() => auditConservation([{ ...entry, energyJ: -10 }], changes)).toThrow();
  expect(() => auditConservation([{ ...entry, kind: "external-output" }], changes)).toThrow();
  expect(() => auditConservation([{ ...entry, massKg: 1 }], changes)).toThrow();
});

it("refuses an unpaired internal transfer even when the state delta matches", () => {
  expect(() => auditConservation([transferEntries("x", "owner", "a", "b", 10)[0]], [{ nodeId: "a", energyDeltaJ: -10, resources: [] }])).toThrow();
});

it("does not hide two unowned state changes behind a zero global residual", () => {
  expect(() => auditConservation([], [
    { nodeId: "a", energyDeltaJ: 10, resources: [] },
    { nodeId: "b", energyDeltaJ: -10, resources: [] },
  ])).toThrow();
});
