import { expect, it } from "vitest";
import fixtures from "../fixtures/f2-governor/vectors.json";
import { createResourceLedger, reserveResources, commitResources } from "../../src/model/governor-v03/resource-ledger";

it("T38 reserves original shared stock for ordinary work, generator and cooler", () => {
  const parameters = fixtures.vectors.find(x => x.id === "vector-T38")!.input.parameters;
  const value = (id: string) => parameters.find(x => x.id === id)!.value;
  const original = createResourceLedger([{ id: "h2", massKg: value("shared-h2-stock") }]);
  const ordinary = reserveResources(original, "propulsion", [{ id: "h2", massKg: value("propulsion-reserve") }]);
  const source = reserveResources(ordinary, "generator", [{ id: "h2", massKg: value("generator-reserve") }]);
  const cooler = reserveResources(source, "cooler", [{ id: "h2", massKg: 0.1 }]);
  const result = commitResources(cooler, [
    { ownerId: "propulsion", resources: [{ id: "h2", massKg: 0.4 }] },
    { ownerId: "generator", resources: [{ id: "h2", massKg: 0.2 }] },
    { ownerId: "cooler", resources: [{ id: "h2", massKg: 0.05 }] },
  ]);
  expect(result.balances[0].massKg).toBeCloseTo(0.35, 14);
  expect(result.reservationEvidence).toEqual(cooler);
  expect(original.reservations).toEqual([]);
  expect(() => reserveResources(cooler, "extra", [{ id: "h2", massKg: 0.01 }])).toThrow();
});

it.each([-1, NaN, Infinity, -Infinity])("refuses invalid stock or outgoing mass %s without mutation", massKg => {
  expect(() => createResourceLedger([{ id: "h2", massKg }])).toThrow();
  const ledger = createResourceLedger([{ id: "h2", massKg: 1 }]);
  const before = structuredClone(ledger);
  expect(() => reserveResources(ledger, "cooler", [{ id: "h2", massKg }])).toThrow();
  expect(ledger).toEqual(before);
  const reserved = reserveResources(ledger, "cooler", [{ id: "h2", massKg: 1 }]);
  expect(() => commitResources(reserved, [{ ownerId: "cooler", resources: [{ id: "h2", massKg }] }])).toThrow();
});

it("refuses duplicate IDs, owners, unknown resources and over-consumption atomically", () => {
  expect(() => createResourceLedger([{ id: "h2", massKg: 1 }, { id: "h2", massKg: 1 }])).toThrow();
  const ledger = reserveResources(createResourceLedger([{ id: "h2", massKg: 1 }]), "cooler", [{ id: "h2", massKg: 0.5 }]);
  const before = structuredClone(ledger);
  expect(() => reserveResources(ledger, "cooler", [])).toThrow();
  expect(() => reserveResources(ledger, "new", [{ id: "water", massKg: 0 }])).toThrow();
  expect(() => reserveResources(ledger, "new", [{ id: "h2", massKg: 0.6 }])).toThrow();
  expect(() => commitResources(ledger, [{ ownerId: "unknown", resources: [] }])).toThrow();
  expect(() => commitResources(ledger, [{ ownerId: "cooler", resources: [{ id: "h2", massKg: 0.6 }] }])).toThrow();
  expect(() => commitResources(ledger, [{ ownerId: "cooler", resources: [{ id: "water", massKg: 0 }] }])).toThrow();
  expect(() => commitResources(ledger, [{ ownerId: "cooler", resources: [] }, { ownerId: "cooler", resources: [] }])).toThrow();
  expect(ledger).toEqual(before);
  expect(Object.isFrozen(ledger.reservations[0].resources[0])).toBe(true);
});

it("T10 commits no idle consumption and exactly exhausted stock stays zero", () => {
  const empty = reserveResources(createResourceLedger([{ id: "h2", massKg: 0 }]), "cooler", [{ id: "h2", massKg: 0 }]);
  expect(commitResources(empty, []).balances).toEqual([{ id: "h2", massKg: 0 }]);
  const full = reserveResources(createResourceLedger([{ id: "h2", massKg: 1 }]), "cooler", [{ id: "h2", massKg: 1 }]);
  expect(commitResources(full, [{ ownerId: "cooler", resources: [{ id: "h2", massKg: 1 }] }]).balances).toEqual([{ id: "h2", massKg: 0 }]);
});

it("accounts only actual resource throughput, including an unused conservative reserve", () => {
  const ledger = reserveResources(createResourceLedger([{ id: "h2", massKg: 1e9 }]), "cooler", [{ id: "h2", massKg: 1 }]);
  const result = commitResources(ledger, [{ ownerId: "cooler", resources: [{ id: "h2", massKg: 0.25 }] }]);
  expect(result.accounting.resources).toEqual([{ id: "h2", residualKg: 0, throughputKg: 0.25 }]);
});
