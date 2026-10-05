import { it, expect } from 'vitest';
import { presets, moduleBase, markEdits } from '../src/catalog/presets';
import { stepModel } from '../src/model/step';
import { initialState, type RunSpec } from '../src/model/types';
import { validateRunSpec } from '../src/catalog/schema';
import { createRun, runChunk } from '../src/runner/run';
import { WorkerController } from '../src/runner/protocol';
function fixture() {
  const p = structuredClone(presets[0]);
  p.ship.modules = []; p.ship.tanks = []; p.initial.fuelKg = {};
  p.ship.hullPowerW = 0; p.ship.hullRadiationM2 = 0;
  p.ship.heatCapacityJK = 100; p.ship.dryMassKg = 1;
  p.ship.thermalMaterials = [{ id: 'dry', massKg: 1, cpJKgK: 100, contents: 'dry' }];
  p.ship.accumulators = [{ id: 'a', capacityJ: 40 }, { id: 'b', capacityJ: 60 }];
  p.initial.chargeJ = 100; p.ship.chargeEfficiency = 1; p.ship.dischargeEfficiency = 1;
  p.environment.effectiveBackgroundK = 300;
  p.scenario.phases = [{ id: 'work', action: 'work', durationSeconds: 10, duty: 1 }];
  p.scenario.repeat = false; p.durationSeconds = 10; p.stepSeconds = .1;
  markEdits(p); return p;
}
function advance(p: RunSpec, duration: number, dt: number) {
  let state = initialState(p), backgroundJ = 0, residualJ = 0;
  for (let time = 0; time < duration - 1e-10; time += dt) {
    const h = Math.min(dt, duration - time);
    const r = stepModel(p.ship, state, p.environment, [{moduleId: 'bg', duty: 1}], h);
    state = r.state; backgroundJ += r.telemetry.backgroundW * h;
    residualJ += r.telemetry.energyResidualJ;
  }
  return {state, backgroundJ, residualJ};
}
it('IP04/P7 resumes Background across the 80% charge boundary and converges to the continuous ramp', () => {
  const p = fixture(); p.initial.chargeJ = 79;
  p.environment.energyInputs = [{sourceId: 'electric', representation: 'electric', powerW: 100}];
  p.ship.modules = [{...moduleBase('bg', 'load'), policy: 'Background', powerW: 100, efficiency: 1}];
  const coarse = advance(p, .1, .1), fine = advance(p, .1, .0001);
  const expectedCharge = 100 - 20 * Math.exp(-5 * .09);
  expect(coarse.backgroundJ).toBeGreaterThan(0);
  expect(Math.abs(coarse.backgroundJ - fine.backgroundJ)).toBeLessThan(.001);
  expect(Math.abs(coarse.state.chargeJ - expectedCharge)).toBeLessThan(.001);
  expect(Math.abs(coarse.residualJ)).toBeLessThan(1e-7);
});
it('IP05/P7 resumes Background while cooling across the 10 K margin within a physics step', () => {
  const p = fixture(); p.initial.temperatureK = 500.1; p.ship.hullRadiationM2 = 1;
  p.environment.effectiveBackgroundK = 100;
  p.environment.energyInputs = [{sourceId: 'electric', representation: 'electric', powerW: 100}];
  p.ship.modules = [{...moduleBase('bg', 'load'), policy: 'Background', powerW: 100, efficiency: 1}];
  const coarse = advance(p, .01, .01), fine = advance(p, .01, .00001);
  expect(coarse.backgroundJ).toBeGreaterThan(.7);
  expect(Math.abs(coarse.backgroundJ - fine.backgroundJ)).toBeLessThan(.002);
  expect(Math.abs(coarse.residualJ)).toBeLessThan(1e-7);
});
it('IP06/P10 cancel flushes a step queued behind telemetry ACK', () => {
  const messages: any[] = [], c = new WorkerController(m => messages.push(m));
  c.handle({runId: 'r', commandId: 1, type: 'start', payload: {spec: fixture(), maxSteps: 1}});
  c.pump(); const before = c.context!.state.timeSeconds;
  c.handle({runId: 'r', commandId: 2, type: 'step'});
  c.handle({runId: 'r', commandId: 3, type: 'cancel'});
  c.handle({runId: 'r', type: 'telemetry-ack', chunkId: 1}); c.pump();
  expect(c.context!.state.timeSeconds).toBe(before);
  expect(messages.filter(m => m.type === 'chunk')).toHaveLength(1);
  expect(messages.find(m => m.type === 'control-ack' && m.commandId === 3)?.control).toBe('cancel');
});
it('IP07/P12 rejects missing or string-valued required fields with a path and reason before start', () => {
  const cases: [string, (p: any) => void][] = [
    ['ship.tanks.diesel.energyJKg', p => p.ship.tanks[0].energyJKg = '43000000'],
    ['ship.modules.generator.gate.low', p => p.ship.modules[0].gate.low = '150'],
    ['scenario.targetWork', p => delete p.scenario.targetWork],
    ['scenario.repeat', p => p.scenario.repeat = 'false'],
  ];
  for (const [path, edit] of cases) {
    const p = structuredClone(presets[0]); edit(p);
    const v = validateRunSpec(p);
    expect(v.ok, path).toBe(false);
    if (!v.ok) expect(v.errors.some(e => e.path.endsWith(path.split('.').slice(-2).join('.')) && e.message)).toBe(true);
    expect(() => createRun('invalid', p)).toThrow();
  }
});
it('IP08/P13 initial temperature is included in the peak of a cooling-only run', () => {
  const p = fixture(); p.initial.temperatureK = 500; p.ship.hullRadiationM2 = 1;
  p.durationSeconds = .1; markEdits(p);
  const r = createRun('peak', p); while (!r.done) runChunk(r, 100);
  expect(r.state.temperatureK).toBeLessThan(500);
  expect(r.metrics.maxTemperatureK).toBe(500);
});
it('IP13/P4/P6 a zero-area active radiator retains paid motor work as host heat', () => {
  const p = fixture(); p.ship.modules = [{...moduleBase('rad', 'radiator'), areaM2: 0, auxW: 10}];
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.state.chargeJ).toBe(90); expect(r.state.temperatureK).toBeCloseTo(300.1, 10);
  expect(r.telemetry.heatInW).toBeCloseTo(10, 8);
  expect(r.telemetry.radiationNetW).toBeCloseTo(0, 8);
  expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 8);
});
it('IP02/IP03 regression: shared H2 generator, engine and powered cooler retain a joint permutation-invariant budget', () => {
  const p = fixture(); p.ship.heatCapacityJK = 1e6; p.initial.chargeJ = 0; p.ship.hullPowerW = 400;
  p.ship.tanks = [{id: 'h', species: 'hydrogen', capacityKg: 1, energyJKg: 1000}, {id: 'd', species: 'diesel', capacityKg: 10, energyJKg: 1000}];
  p.initial.fuelKg = {h: 1, d: 10};
  p.ship.modules = [
    {...moduleBase('g', 'generator'), tankId: 'h', species: 'hydrogen', powerW: 400, efficiency: 1},
    {...moduleBase('e', 'engine'), tankId: 'h', species: 'hydrogen', forceN: 1, alpha: .4, efficiency: .5, hostFraction: .5},
    {...moduleBase('cool', 'h2'), tankId: 'h', species: 'hydrogen', coolingW: 400, qJKg: 1000, auxW: 0},
  ];
  const req = [{moduleId: 'e', duty: 1}], a = stepModel(p.ship, initialState(p), p.environment, req, 1);
  p.ship.modules.reverse(); const b = stepModel(p.ship, initialState(p), p.environment, req, 1);
  expect(a.state.fuelKg).toEqual({h: 0, d: 10});
  expect(a.telemetry.generatorW).toBeCloseTo(1000 / 3, 8);
  expect(a.telemetry.h2CoolingW).toBeCloseTo(1000 / 3, 8);
  expect(a.telemetry.thrustN).toBeCloseTo(5 / 6, 8);
  expect(a.telemetry.energyResidualJ).toBeCloseTo(0, 6);
  expect(a.state.temperatureK).toBeCloseTo(b.state.temperatureK, 10);
});
it('IP13/P6 radiator heat uses actual partial electricity and H2 auxiliary work remains coolant exhaust', () => {
  const p = fixture(); p.initial.chargeJ = 5;
  p.ship.modules = [{...moduleBase('rad', 'radiator'), areaM2: 0, auxW: 10}];
  const r = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(r.state.chargeJ).toBe(0); expect(r.telemetry.radiatorHostW).toBeCloseTo(5);
  expect(r.state.temperatureK).toBeCloseTo(300.05, 8); expect(r.telemetry.energyResidualJ).toBeCloseTo(0, 6);
  p.initial.chargeJ = 100;
  p.ship.tanks = [{id: 'h', species: 'hydrogen', capacityKg: 1, energyJKg: 1000}]; p.initial.fuelKg = {h: 1};
  p.ship.modules = [{...moduleBase('h2', 'h2'), tankId: 'h', species: 'hydrogen', coolingW: 100, qJKg: 1000, auxW: 10}];
  const c = stepModel(p.ship, initialState(p), p.environment, [], 1);
  expect(c.state.fuelKg.h).toBeCloseTo(.89, 8);
  expect(c.state.temperatureK).toBeCloseTo(299, 8); expect(c.telemetry.h2AuxRejectW).toBeCloseTo(10);
  expect(c.telemetry.energyResidualJ).toBeCloseTo(0, 6);
});
it('IP05/P7 a slow crossing at the exact margin advances beyond numerical eligibility tolerance without chatter', () => {
  const p = fixture(); p.initial.temperatureK = 500; p.ship.heatCapacityJK = 1e12; p.ship.hullRadiationM2 = 1;
  p.environment.effectiveBackgroundK = 100;
  p.environment.energyInputs = [{sourceId: 'electric', representation: 'electric', powerW: 100}];
  p.ship.modules = [{...moduleBase('bg', 'load'), policy: 'Background', powerW: 100, efficiency: 1}];
  const a = advance(p, 10, 10), b = advance(p, 10, 5);
  expect(a.backgroundJ).toBeGreaterThan(900);
  expect(Math.abs(a.backgroundJ - b.backgroundJ) / b.backgroundJ).toBeLessThan(.001);
});
