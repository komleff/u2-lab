import { expect, it } from "vitest";
import fixtures from "../fixtures/f2-governor/vectors.json";
import type { WaterTankProfileV03 } from "../../src/model/governor-v03/types";
import { waterState, exchangeWater } from "../../src/model/governor-v03/water-tank";
const profile = fixtures.profiles.find(x => x.id === "synthetic-base")!.waterTanks[0] as WaterTankProfileV03;
const resources = [{ id: "water", massKg: 1 }];
const envelope = { minTemperatureK: 200, maxTemperatureK: 700 };

it("T16 converts enthalpy to solid/mixed/liquid using the accepted water phase model", () => {
  expect(waterState(profile, resources, { enthalpyJ: -4200, phase: "solid" }, envelope)).toEqual({ temperatureK: 272, phase: "solid", liquidFraction: 0 });
  expect(waterState(profile, resources, { enthalpyJ: 167000, phase: "mixed" }, envelope)).toEqual({ temperatureK: 273, phase: "mixed", liquidFraction: 0.5 });
  expect(waterState(profile, resources, { enthalpyJ: 338200, phase: "liquid" }, envelope)).toEqual({ temperatureK: 274, phase: "liquid", liquidFraction: 1 });
});

it("holds W protection through the hysteresis interval and releases at protectionOffK", () => {
  const input = { profile, resources, envelope, seconds: 1, requestedJ: -10, id: "w-to-s", ownerId: "water-exchanger", shipNodeId: "ship", shipTemperatureK: 200 };
  const inside = { enthalpyJ: 342400, phase: "liquid" as const };
  expect(exchangeWater({ ...input, state: inside, protectionActive: true }).exchangeJ).toBe(0);
  expect(exchangeWater({ ...input, state: inside, protectionActive: false }).exchangeJ).toBe(-10);
  const boundary = exchangeWater({ ...input, state: { enthalpyJ: 346600, phase: "liquid" }, protectionActive: true, requestedJ: 0 });
  expect(boundary.protectionActive).toBe(false);
});

it("changes phase continuously at exact freezing and melting enthalpies", () => {
  expect(waterState(profile, resources, { enthalpyJ: 0, phase: "solid" }, envelope).phase).toBe("solid");
  expect(waterState(profile, resources, { enthalpyJ: 334000, phase: "liquid" }, envelope).phase).toBe("liquid");
  const input = { profile, resources, envelope, seconds: 1, requestedJ: 10, id: "melt", ownerId: "water-exchanger", shipNodeId: "ship", shipTemperatureK: 500, protectionActive: true };
  expect(exchangeWater({ ...input, state: { enthalpyJ: -5, phase: "solid" } }).state).toEqual({ enthalpyJ: 5, phase: "mixed" });
  expect(exchangeWater({ ...input, state: { enthalpyJ: 333995, phase: "mixed" } }).state).toEqual({ enthalpyJ: 334005, phase: "liquid" });
});

it("caps W exchange by conductance, request and actual direction without spontaneous heating", () => {
  const input = { profile, resources, envelope, state: { enthalpyJ: 338200, phase: "liquid" as const }, seconds: 1, requestedJ: 100, id: "exchange", ownerId: "water-exchanger", shipNodeId: "ship", protectionActive: false, shipTemperatureK: 275 };
  expect(exchangeWater(input).exchangeJ).toBe(1);
  expect(exchangeWater({ ...input, requestedJ: 0.25 }).exchangeJ).toBe(0.25);
  expect(exchangeWater({ ...input, requestedJ: -10 }).exchangeJ).toBe(0);
  expect(exchangeWater({ ...input, shipTemperatureK: 274 }).exchangeJ).toBe(0);
  expect(exchangeWater({ ...input, seconds: 0 }).exchangeJ).toBe(0);
});

it("accepts an explicit dry tank but requires finite water mass/resource state", () => {
  expect(waterState(profile, [{ id: "water", massKg: 0 }], { enthalpyJ: 0, phase: "solid" }, envelope).phase).toBe("solid");
  expect(() => waterState(profile, [], { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState(profile, [{ id: "water", massKg: 0 }], { enthalpyJ: 1, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState(profile, [{ id: "water", massKg: 0 }], { enthalpyJ: 0, phase: "liquid" }, envelope)).toThrow();
  expect(() => waterState(profile, [resources[0], resources[0]], { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
});

it("refuses phase mismatch and envelope underflow/overflow before commit", () => {
  expect(() => waterState(profile, resources, { enthalpyJ: 167000, phase: "liquid" }, envelope)).toThrow();
  expect(() => waterState(profile, resources, { enthalpyJ: -1e9, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState(profile, resources, { enthalpyJ: 1e9, phase: "liquid" }, envelope)).toThrow();
  const input = { profile, resources, envelope, state: { enthalpyJ: 2127400, phase: "liquid" as const }, seconds: 1, requestedJ: 1, id: "overflow", ownerId: "water-exchanger", shipNodeId: "ship", protectionActive: false, shipTemperatureK: 800 };
  const before = structuredClone(input);
  expect(() => exchangeWater(input)).toThrow();
  expect(input).toEqual(before);
});

it.each([NaN, Infinity, -Infinity])("refuses non-finite enthalpy, exchange and mass %s atomically", value => {
  const state = { enthalpyJ: value, phase: "liquid" as const };
  const before = structuredClone(state);
  expect(() => waterState(profile, resources, state, envelope)).toThrow();
  expect(() => waterState(profile, [{ id: "water", massKg: value }], { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
  expect(() => exchangeWater({ profile, resources, envelope, state: { enthalpyJ: 338200, phase: "liquid" }, seconds: 1, requestedJ: value, id: "bad", ownerId: "water-exchanger", shipNodeId: "ship", protectionActive: false, shipTemperatureK: 500 })).toThrow();
  expect(state).toEqual(before);
});

it("refuses invalid water profile properties and derived arithmetic overflow", () => {
  expect(() => waterState(profile, [{ id: "water", massKg: -1 }], { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState({ ...profile, heatCapacityJPerKgK: { ...profile.heatCapacityJPerKgK, value: 0 } }, resources, { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState({ ...profile, protectionOffK: profile.protectionOnK }, resources, { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
  expect(() => waterState(profile, [{ id: "water", massKg: 1e308 }], { enthalpyJ: 0, phase: "solid" }, envelope)).toThrow();
});

it("refuses an enthalpy update that loses the actual exchange below numerical precision", () => {
  expect(() => exchangeWater({ profile, resources: [{ id: "water", massKg: 1e15 }], envelope, state: { enthalpyJ: 338200e15, phase: "liquid" }, seconds: 1, requestedJ: 1, id: "lost", ownerId: "water-exchanger", shipNodeId: "ship", protectionActive: false, shipTemperatureK: 500 })).toThrow();
});

it("T16 keeps W cold protection independent and permits hot-S cooling into cold W", () => {
  const state = { enthalpyJ: 338200, phase: "liquid" as const };
  const result = exchangeWater({ profile, resources, state, envelope, protectionActive: false, shipTemperatureK: 500, seconds: 1, requestedJ: 100, id: "hot-ship", ownerId: "water-exchanger", shipNodeId: "ship" });
  expect(result.protectionActive).toBe(true);
  expect(result.exchangeJ).toBe(10);
  expect(result.state.enthalpyJ).toBe(338210);
  expect(result.entries.map((x: { energyJ: number }) => x.energyJ)).toEqual([-10, 10]);
});
