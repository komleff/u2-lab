import { it, expect } from "vitest";
import { fixture } from "../fitting/test-spec";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { compileFit } from "../../src/fitting/compile";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";
it("hydrogen generator and cooler share one typed stock and cannot overconsume", () => {
  const s = fixture();
  const c = loadCandidateCatalog(),
    f = getPresetFit("industrial-M");
  f.instances[f.assignments["power-2"]].itemId = "generator-hydrogen-M";
  f.instances.h2tank = {
    id: "h2tank",
    itemId: "tank-hydrogen-S",
    enabled: true,
  };
  f.assignments["power-4"] = "h2tank";
  f.instances.cooler = { id: "cooler", itemId: "h2-cooler-S", enabled: true };
  f.assignments["signature-3"] = "cooler";
  const ship = compileFit(f, c);
  if (!ship.ok) throw Error(JSON.stringify(ship.errors));
  s.resolvedShip = ship.value;
  s.initial.fuelKg.hydrogen = 0.001;
  s.initial.chargeJ = 1e9;
  const r = stepV2(s, initialStateV2(s), 1, { "fit:payload-1": 1 });
  expect(r.state.fuelKg.hydrogen).toBe(0);
  expect(r.coolantConsumedKg).toBeLessThan(0.001);
  expect(
    Object.entries(r.state.consumptionKg)
      .filter(([k]) => k.startsWith("hydrogen:"))
      .reduce((n, [, v]) => n + v, 0),
  ).toBeCloseTo(0.001, 10);
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 3);
});
it("signed hot background heats the ship and preserves bounded thermal/buffer stocks", () => {
  const s = fixture("sputnik");
  s.environment.effectiveBackgroundK = 600;
  s.initial.temperatureK = 300;
  for (const i of s.resolvedShip.instances)
    if (i.item.family === "buffer") i.enabled = false;
  const r = stepV2(s, initialStateV2(s), 1, {});
  expect(r.telemetry.radiationNetW).toBeLessThan(0);
  expect(r.state.temperatureK).toBeGreaterThan(300);
  for (const [k, v] of Object.entries(r.state.buffersJ))
    expect(v).toBeLessThanOrEqual(s.resolvedShip.bufferCapacityJ[k]);
});
