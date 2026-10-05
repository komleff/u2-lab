import { it, expect } from "vitest";
import { presets, moduleBase, markEdits } from "../../src/catalog/presets";
import { stepModel } from "../../src/model/step";
import { initialState } from "../../src/model/types";
function fixture() {
  const p = structuredClone(presets[0]);
  p.ship.accumulators = [{ id: "a", capacityJ: 1000 }];
  p.initial.chargeJ = 1000;
  p.ship.heatCapacityJK = 1e9;
  p.ship.dischargeEfficiency = 1;
  p.ship.hullPowerW = 0;
  p.ship.hullRadiationM2 = 0;
  p.ship.modules = [];
  return p;
}
it("background runs on source headroom at full battery and stops exactly at fuel20%", () => {
  const p = fixture();
  p.ship.tanks = [
    { id: "diesel", species: "diesel", capacityKg: 1000, energyJKg: 1 },
  ];
  p.initial.fuelKg.diesel = 200.1;
  p.ship.modules = [
    {
      ...moduleBase("g", "generator"),
      tankId: "diesel",
      species: "diesel",
      powerW: 100,
      efficiency: 1,
    },
    { ...moduleBase("b", "load"), policy: "Background", powerW: 100 },
  ];
  const r = stepModel(
    p.ship,
    initialState(p),
    p.environment,
    [{ moduleId: "b", duty: 1 }],
    1,
  );
  expect(r.telemetry.backgroundW).toBeCloseTo(0.1, 7);
  expect(r.state.fuelKg.diesel).toBeCloseTo(200, 8);
  expect(r.state.chargeJ).toBe(1000);
});
it("background stops within step at hot10K margin", () => {
  const p = fixture();
  p.ship.heatCapacityJK = 10;
  p.initial.temperatureK = 499.9;
  p.ship.modules = [
    {
      ...moduleBase("g", "generator"),
      tankId: "diesel",
      species: "diesel",
      powerW: 100,
      efficiency: 1,
    },
    {
      ...moduleBase("b", "load"),
      policy: "Background",
      powerW: 100,
      efficiency: 0,
    },
  ];
  const r = stepModel(
    p.ship,
    initialState(p),
    p.environment,
    [{ moduleId: "b", duty: 1 }],
    1,
  );
  expect(r.state.temperatureK).toBeCloseTo(500, 6);
  expect(r.telemetry.backgroundW).toBeCloseTo(1, 5);
});
it("all charge/discharge/gen path losses close energy ledger without usable fraction twice", () => {
  const p = fixture();
  p.ship.dischargeEfficiency = 0.9;
  p.ship.chargeEfficiency = 0.8;
  p.ship.modules = [
    {
      ...moduleBase("g", "generator"),
      tankId: "diesel",
      species: "diesel",
      powerW: 100,
      efficiency: 0.35,
      pathEfficiency: 0.9,
      exportFraction: 0.45,
    },
    { ...moduleBase("l", "load"), powerW: 200, efficiency: 0.5 },
  ];
  const r = stepModel(
    p.ship,
    initialState(p),
    p.environment,
    [{ moduleId: "l", duty: 1 }],
    1,
  );
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 4);
  expect(r.telemetry.pathLossW).toBeGreaterThan(0);
  expect(r.telemetry.batteryLossW).toBeGreaterThan(0);
});
it("hot-side rejection equals cooling plus electric work and active radiator is starved", () => {
  const p = fixture();
  p.ship.modules = [
    {
      ...moduleBase("ti", "thermoinverter"),
      coolingW: 100,
      hotK: 800,
      areaM2: 1e4,
      copEfficiency: 0.5,
    },
  ];
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.telemetry.tiRejectW).toBeCloseTo(
    r.telemetry.tiCoolingW + r.telemetry.deliveredW,
  );
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 4);
  p.ship.modules = [
    { ...moduleBase("rad", "radiator"), areaM2: 1e4, auxW: 100 },
  ];
  const s = initialState(p);
  s.chargeJ = 0;
  expect(
    stepModel(p.ship, s, p.environment, [], 1).telemetry.radiationNetW,
  ).toBe(0);
});
it("PV absorbed input splits once and no fake generator fuel burn at idle with no demand", () => {
  const p = fixture();
  p.environment.solarFluxWm2 = 100;
  p.ship.modules = [
    { ...moduleBase("pv", "solar"), areaM2: 2, efficiency: 0.25 },
    {
      ...moduleBase("g", "generator"),
      tankId: "diesel",
      species: "diesel",
      powerW: 100,
      efficiency: 1,
    },
  ];
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.telemetry.solarW + r.telemetry.solarHostW).toBe(200);
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 4);
  expect(r.state.fuelKg.diesel).toBe(6000);
});
it("half step nonlinear radiation converges below0.1%", () => {
  const p = fixture();
  p.ship.heatCapacityJK = 1e5;
  p.ship.hullRadiationM2 = 100;
  p.initial.temperatureK = 500;
  let a = initialState(p),
    b = initialState(p);
  for (let i = 0; i < 100; i++)
    a = stepModel(p.ship, a, p.environment, [], 0.1).state;
  for (let i = 0; i < 200; i++)
    b = stepModel(p.ship, b, p.environment, [], 0.05).state;
  expect(
    Math.abs(a.temperatureK - b.temperatureK) / b.temperatureK,
  ).toBeLessThan(0.001);
});
it("buffer editable band releases finite stored heat only and low work corridor derates", () => {
  const p = fixture();
  p.ship.heatCapacityJK = 100;
  p.ship.modules = [
    {
      ...moduleBase("buf", "buffer"),
      capacityJ: 20,
      coolingW: 100,
      absorbAboveK: 300,
      releaseBelowK: 290,
    },
  ];
  p.initial.temperatureK = 285;
  p.initial.buffersJ.buf = 20;
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.state.buffersJ.buf).toBeCloseTo(0);
  expect(r.state.temperatureK).toBeCloseTo(285.2);
  expect(r.telemetry.bufferReleaseW).toBeCloseTo(20);
  p.ship.modules = [
    {
      ...moduleBase("load", "load"),
      powerW: 100,
      gate: {
        low: 150,
        workLow: 200,
        high: 570,
        workHigh: 510,
        restartLow: 180,
        restartHigh: 550,
      },
    },
  ];
  p.initial.temperatureK = 175;
  const q = stepModel(
    p.ship,
    initialState(p),
    p.environment,
    [{ moduleId: "load", duty: 1 }],
    0.01,
  );
  expect(q.telemetry.deliveredW).toBeCloseTo(50, 4);
});
it("declared EM electric and thermal inputs are separate stock/heat channels", () => {
  const p = fixture();
  p.initial.chargeJ = 0;
  p.environment.energyInputs = [
    { sourceId: "em-electric", representation: "electric", powerW: 50 },
    { sourceId: "plasma-heat", representation: "heat", powerW: 30 },
  ];
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.state.chargeJ).toBe(50);
  expect(r.telemetry.externalElectricW).toBe(50);
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 4);
});
it("thermal stopped load keeps original requested power visible", () => {
  const p = fixture();
  p.ship.modules = [{ ...moduleBase("work", "load"), powerW: 100 }];
  p.initial.temperatureK = 570;
  const r = stepModel(
    p.ship,
    initialState(p),
    p.environment,
    [{ moduleId: "work", duty: 1 }],
    1,
  );
  expect(r.telemetry.requestedW).toBe(100);
  expect(r.telemetry.activeRequestedW).toBe(100);
  expect(r.telemetry.deliveredW).toBe(0);
  expect(r.state.constraints).toContain("Тепловая защита");
});
