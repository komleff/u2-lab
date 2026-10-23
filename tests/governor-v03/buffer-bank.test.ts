import { expect, it } from "vitest";
import fixtures from "../fixtures/f2-governor/vectors.json";
import type { BufferBankProfileV03 } from "../../src/model/governor-v03/types";
import { bufferTemperature, createBufferTransaction, transferBuffer } from "../../src/model/governor-v03/buffer-bank";
const profile = fixtures.profiles.find(x => x.id === "synthetic-base")!.banks[0] as BufferBankProfileV03;

it("interpolates T_B(Q) at both boundaries and between knots without clipping", () => {
  expect(bufferTemperature(profile, 0)).toBe(300);
  expect(bufferTemperature(profile, 250)).toBe(350);
  expect(bufferTemperature(profile, 1000)).toBe(500);
  expect(() => bufferTemperature(profile, -1)).toThrow();
  expect(() => bufferTemperature(profile, 1001)).toThrow();
});

it("T02/T15 has no flow or spontaneous heat when no bank exists", () => {
  const tx = createBufferTransaction(null, 0, 1);
  const flow = { id: "none", ownerId: "module", otherNodeId: "ship", direction: "in" as const, energyJ: 1, otherTemperatureK: 500 };
  expect(() => transferBuffer(tx, flow)).toThrow();
  expect(transferBuffer(tx, { ...flow, energyJ: 0 }).entries).toEqual([]);
  expect(() => createBufferTransaction(null, 1, 1)).toThrow();
  expect(tx.energyJ).toBe(0);
});

it("allows exactly full/empty boundaries but refuses overflow and newly captured output atomically", () => {
  const flow = { id: "fill", ownerId: "module", otherNodeId: "ship", direction: "in" as const, energyJ: 10, otherTemperatureK: 600 };
  const initial = createBufferTransaction(profile, 990, 1);
  const full = transferBuffer(initial, flow);
  expect(full.energyJ).toBe(1000);
  expect(() => transferBuffer(full, { ...flow, id: "overflow", energyJ: 1 })).toThrow();
  expect(() => transferBuffer(createBufferTransaction(profile, 1000, 1), { ...flow, energyJ: 1 })).toThrow();
  const empty = createBufferTransaction(profile, 0, 1);
  const captured = transferBuffer(empty, flow);
  const before = structuredClone(captured);
  expect(() => transferBuffer(captured, { ...flow, direction: "out", id: "reuse", energyJ: 1, otherTemperatureK: 200 })).toThrow();
  expect(captured).toEqual(before);
  expect(Object.isFrozen(captured.profile!.temperatureByEnergy[0])).toBe(true);
});

it("enforces the shared port even when separate in/out ports have room", () => {
  const initial = createBufferTransaction(profile, 500, 1);
  const flow = { id: "in", ownerId: "module", otherNodeId: "ship", direction: "in" as const, energyJ: 10, otherTemperatureK: 600 };
  const charged = transferBuffer(initial, flow);
  expect(() => transferBuffer(charged, { ...flow, id: "out", direction: "out", energyJ: 6, otherTemperatureK: 200 })).toThrow();
  expect(transferBuffer(charged, { ...flow, id: "out", direction: "out", energyJ: 5, otherTemperatureK: 200 }).energyJ).toBe(505);
});

it("caps accumulated conductance and refuses flow against the thermal head", () => {
  const initial = createBufferTransaction(profile, 500, 1);
  const flow = { id: "first", ownerId: "module", otherNodeId: "ship", direction: "in" as const, energyJ: 1, otherTemperatureK: 401 };
  const charged = transferBuffer(initial, flow);
  expect(() => transferBuffer(charged, { ...flow, id: "second", energyJ: 1 })).toThrow();
  expect(() => transferBuffer(initial, { ...flow, energyJ: 2 })).toThrow();
  expect(() => transferBuffer(initial, { ...flow, otherTemperatureK: 400 })).toThrow();
  expect(() => transferBuffer(initial, { ...flow, otherTemperatureK: 300 })).toThrow();
});

it.each([-1, NaN, Infinity, -Infinity])("refuses invalid bank state, request or finite budget %s", value => {
  expect(() => createBufferTransaction(profile, value, 1)).toThrow();
  expect(() => createBufferTransaction(profile, 0, value)).toThrow();
  const tx = createBufferTransaction(profile, 500, 1);
  const before = structuredClone(tx);
  expect(() => transferBuffer(tx, { id: "invalid", ownerId: "module", otherNodeId: "ship", direction: "in", energyJ: value, otherTemperatureK: 600 })).toThrow();
  expect(() => createBufferTransaction({ ...profile, inputW: { ...profile.inputW, value } }, 0, 1)).toThrow();
  expect(tx).toEqual(before);
});

it("refuses duplicate transfer IDs, missing owners and invalid maps", () => {
  const tx = createBufferTransaction(profile, 500, 1);
  const flow = { id: "transfer", ownerId: "module", otherNodeId: "ship", direction: "in" as const, energyJ: 1, otherTemperatureK: 600 };
  expect(() => transferBuffer(transferBuffer(tx, flow), flow)).toThrow();
  expect(() => transferBuffer(tx, { ...flow, ownerId: "" })).toThrow();
  expect(() => bufferTemperature({ ...profile, temperatureByEnergy: [...profile.temperatureByEnergy].reverse() }, 0)).toThrow();
  expect(() => bufferTemperature({ ...profile, temperatureByEnergy: [profile.temperatureByEnergy[0]] }, 0)).toThrow();
  expect(() => bufferTemperature({ ...profile, memberIds: ["same", "same"] }, 0)).toThrow();
});

it("refuses a finite capture lost below stored-energy precision instead of reporting conservation PASS", () => {
  const large = { ...profile, capacityJ: { ...profile.capacityJ, value: 2e20 }, temperatureByEnergy: [profile.temperatureByEnergy[0], { ...profile.temperatureByEnergy[1], energyJ: { ...profile.capacityJ, value: 2e20 } }] };
  const tx = createBufferTransaction(large, 1e20, 1);
  expect(() => transferBuffer(tx, { id: "lost", ownerId: "module", otherNodeId: "ship", direction: "in", energyJ: 1, otherTemperatureK: 600 })).toThrow();
});

it("T18/T19 uses original output stock and remaining shared/input budgets for late capture", () => {
  const initial = createBufferTransaction(profile, 5, 1);
  const flow = { id: "release", ownerId: "cooler", otherNodeId: "ship", direction: "out" as const, energyJ: 5, otherTemperatureK: 250 };
  const released = transferBuffer(initial, flow);
  const captured = transferBuffer(released, { ...flow, id: "late", direction: "in", energyJ: 10, otherTemperatureK: 600 });
  expect(captured.energyJ).toBe(10);
  expect(captured.inputJ + captured.outputJ).toBe(15);
  expect(captured.entries.map((x: {energyJ: number}) => x.energyJ)).toEqual([-5, 5, -10, 10]);
  expect(() => transferBuffer(captured, { ...flow, id: "reuse", energyJ: 1 })).toThrow();
  expect(() => transferBuffer(captured, { ...flow, id: "extra", direction: "in", energyJ: 1, otherTemperatureK: 600 })).toThrow();
  expect(initial.energyJ).toBe(5);
});
