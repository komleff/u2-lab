import {it, expect} from 'vitest';
import {presets, moduleBase} from '../src/catalog/presets';
import {initialState, type RunSpec} from '../src/model/types';
import {stepModel} from '../src/model/step';
function fixture() {
  const p = structuredClone(presets[0]);
  p.ship.heatCapacityJK = 100; p.ship.hullPowerW = 0; p.ship.hullRadiationM2 = 1;
  p.ship.modules = []; p.ship.tanks = []; p.initial.fuelKg = {}; p.initial.temperatureK = 500;
  p.environment.effectiveBackgroundK = 100; p.ship.chargeEfficiency = 1; p.ship.dischargeEfficiency = 1;
  return p;
}
function advance(p: RunSpec, duration: number, dt: number) {
  let state = initialState(p), energyJ = 0, residualJ = 0, events: any[] = [];
  const requests = [{moduleId: 'e', duty: 1}];
  for (let time = 0; time < duration - 1e-9; time += dt) {
    const h = Math.min(dt, duration - time), r = stepModel(p.ship, state, p.environment, requests, h);
    state = r.state; energyJ += r.telemetry.radiationNetW * h; residualJ += r.telemetry.energyResidualJ;
    events.push(...r.events);
  }
  return {state, energyJ, residualJ, events};
}
it('RV-B1/P5 radiation dt10s converges in integrated energy to half-step and independently refined replay', () => {
  const p = fixture(), coarse = advance(p, 10, 10), half = advance(p, 10, 5), fine = advance(p, 10, .001);
  expect(Math.abs(coarse.energyJ - half.energyJ) / half.energyJ).toBeLessThan(.001);
  expect(Math.abs(coarse.energyJ - fine.energyJ) / fine.energyJ).toBeLessThan(.001);
  expect(Math.abs(coarse.state.temperatureK - fine.state.temperatureK)).toBeLessThan(.01);
  expect(Math.abs(coarse.residualJ)).toBeLessThan(1e-6);
});
function gatedTank() {
  const p = fixture(); p.ship.hullRadiationM2 = 0; p.ship.hullPowerW = 100;
  p.initial.temperatureK = 499; p.initial.chargeJ = 0;
  p.ship.tanks = [{id: 'd', species: 'diesel', capacityKg: 10, energyJKg: 1000,
    gate: {low: 150, restartLow: 180, workHigh: 480, restartHigh: 490, high: 500}}];
  p.initial.fuelKg = {d: 10};
  p.ship.modules = [{...moduleBase('g', 'generator'), tankId: 'd', species: 'diesel', powerW: 100, efficiency: 1}];
  return p;
}
it('RV-B2/P7 physical tank stops generator exactly at within-dt critical crossing', () => {
  const p = gatedTank(), a = advance(p, 2, 2), b = advance(p, 2, .001);
  expect(a.state.temperatureK).toBeCloseTo(500, 7);
  expect(a.state.fuelKg.d).toBeCloseTo(9.9, 7);
  expect(a.state.fuelKg.d).toBeCloseTo(b.state.fuelKg.d, 7);
  expect(a.events.filter(e => e.kind === 'thermal-stop' && e.message.startsWith('tank:d:'))).toHaveLength(1);
  expect(a.events.find(e => e.message.startsWith('tank:d:'))?.timeSeconds).toBeCloseTo(1, 7);
  expect(Math.abs(a.residualJ)).toBeLessThan(1e-6);
});
it('RV-B2/P4/P7 tank stop covers all shared consumers, restart occurs within dt during passive cooling', () => {
  const p = gatedTank();
  p.ship.modules.push({...moduleBase('e', 'engine'), tankId: 'd', species: 'diesel', forceN: 1, alpha: .1, efficiency: 1});
  const stopped = advance(p, 2, 2);
  expect(stopped.state.fuelKg.d).toBeCloseTo(9.8, 7);
  p.initial.temperatureK = 501; p.ship.hullRadiationM2 = 1;
  const a = advance(p, 1, 1), b = advance(p, 1, .001);
  expect(a.events.filter(e => e.kind === 'thermal-restart' && e.message.startsWith('tank:d:'))).toHaveLength(1);
  expect(a.state.fuelKg.d).toBeLessThan(10);
  expect(Math.abs(a.state.fuelKg.d - b.state.fuelKg.d)).toBeLessThan(.0001);
  expect(Math.abs(a.residualJ)).toBeLessThan(1e-6);
});
