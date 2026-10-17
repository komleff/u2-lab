import {it, expect} from 'vitest';
import {presets, moduleBase, markEdits} from '../src/catalog/presets';
import {validateRunSpec} from '../src/catalog/schema';
import {createRun, runChunk} from '../src/runner/run';
import {stepModel} from '../src/model/step';
import {initialState} from '../src/model/types';
function fixture(dt: number) {
  const p = structuredClone(presets[0]);
  p.ship.heatCapacityJK = 100; p.ship.dryMassKg = 1;
  p.ship.thermalMaterials = [{id: 'dry', massKg: 1, cpJKgK: 100, contents: 'dry'}];
  p.ship.hullRadiationM2 = .01; p.ship.hullPowerW = 250;
  p.ship.chargeEfficiency = 1; p.ship.dischargeEfficiency = 1;
  p.ship.accumulators = [{id: 'a', capacityJ: 100}];
  p.initial.chargeJ = 0; p.initial.temperatureK = 490;
  p.ship.tanks = [{id: 'd', species: 'diesel', capacityKg: 10, energyJKg: 1000,
    gate: {low: 100, workLow: 120, restartLow: 110, restartHigh: 480, workHigh: 450, high: 500}}];
  p.initial.fuelKg = {d: 10}; p.initial.buffersJ = {};
  p.ship.modules = [{...moduleBase('g', 'generator'), tankId: 'd', species: 'diesel', powerW: 250,
    efficiency: .5, exportFraction: 0, pathEfficiency: 1}];
  p.environment.effectiveBackgroundK = 100; p.environment.solarFluxWm2 = 0;
  p.environment.directHeat = []; p.environment.energyInputs = [];
  p.durationSeconds = 20; p.stepSeconds = dt;
  p.scenario.phases = [{id: 'idle', action: 'idle', durationSeconds: 20, duty: 0}]; p.scenario.repeat = false;
  markEdits(p); expect(validateRunSpec(p).ok).toBe(true); return p;
}
it('QB1/P13 peak includes internal tank stop before cooling and meets half-step/refined peak convergence', () => {
  const runs = [20, 10, .001].map(dt => {
    const r = createRun('peak-' + dt, fixture(dt)); while (!r.done) runChunk(r, 100000); return r;
  });
  const [coarse, half, fine] = runs;
  for (const r of runs) {
    expect(r.metrics.maxTemperatureK).toBeCloseTo(500, 7);
    expect(r.state.temperatureK).toBeLessThan(494);
    expect(Math.abs(r.metrics.energyResidualJ)).toBeLessThan(1e-6);
  }
  expect(Math.abs(coarse.metrics.maxTemperatureK - half.metrics.maxTemperatureK) / half.metrics.maxTemperatureK).toBeLessThan(.001);
  expect(Math.abs(coarse.metrics.maxTemperatureK - fine.metrics.maxTemperatureK) / fine.metrics.maxTemperatureK).toBeLessThan(.001);
});
it('QB1/P13 kernel returns an unaveraged internal peak and retains the initial state on cooling-only steps', () => {
  const p = fixture(20);
  const r = stepModel(p.ship, initialState(p), p.environment, [], 20);
  expect(r.maxTemperatureK).toBeCloseTo(500, 7);
  expect(r.state.temperatureK).toBeLessThan(494);
  p.ship.modules = []; p.ship.hullPowerW = 0; p.initial.temperatureK = 500;
  const cooling = stepModel(p.ship, initialState(p), p.environment, [], 20);
  expect(cooling.maxTemperatureK).toBe(500);
  expect(cooling.state.temperatureK).toBeLessThan(500);
});
