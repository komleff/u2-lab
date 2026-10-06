import { it, expect } from 'vitest';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMissionRun, type MissionConditions } from '../../src/scenarios/mission';
import { createRun, runChunk, result } from '../../src/runner/run';
import { parseExperimentJson } from '../../src/io/fitting-json';
import { parseResultJson } from '../../src/io/fitting-result';
import { stepV2 } from '../../src/model/v2/step';
import { WorkerController } from '../../src/runner/protocol';
import type { RunContextV2 } from '../../src/runner/fitting-run';

const catalog = loadCandidateCatalog();
const json = (x: unknown) => JSON.stringify(x, (_, value) => ArrayBuffer.isView(value) ? Array.from(value as any) : value);
function spec(hull: string, conditions: MissionConditions = {}) {
  const fit = getPresetFit(hull);
  if (hull.startsWith('civilian-M')) fit.initial.chargeFraction = 0;
  // Исходные blocker fixtures воспроизводят старый fuel-only station policy.
  const prepared = makeMissionRun(fit, catalog, { stationReplenish: undefined, durationSeconds: 5, stepSeconds: .1, distanceM: 0, approachSeconds: 0, serviceSeconds: 0, targetM3: .01, repeat: false, temperatureK: 600, ...conditions });
  if (!prepared.ok) throw Error(JSON.stringify(prepared.errors));
  return prepared.value;
}
function solar(temperatureK: number) {
  const s = spec('civilian-M:1', { temperatureK });
  s.environment.solarFluxWm2 = 4e6;
  s.origins['environment.solarFluxWm2'] = { kind: 'experimental', sourceRef: 'lab:mission-review-solar', note: 'Явный численный контроль W/m², не каноническая среда' };
  const parsed = parseExperimentJson(json(s));
  if (!parsed.ok) throw Error(JSON.stringify(parsed.errors));
  return parsed.value as typeof s;
}
function validResult(run: ReturnType<typeof createRun>) {
  const parsed = parseResultJson(json(result(run)));
  expect(parsed.ok, parsed.ok ? '' : JSON.stringify(parsed.errors.slice(0, 6))).toBe(true);
}
function balance(run: RunContextV2) {
  const m = run.state.mission!;
  expect(run.state.usefulWork).toBeCloseTo(m.deliveredM3 + run.state.cargo, 8);
  for (const species of ['diesel', 'hydrogen']) expect(run.spec.initial.fuelKg[species] + m.receivedFuelKg[species] - run.metrics.fuelSpeciesKg[species]).toBeCloseTo(run.state.fuelKg[species], 8);
}
function untilDone(run: ReturnType<typeof createRun>) {
  for (let n = 0; n < 1000 && !run.done; n++) runChunk(run, 10);
  expect(run.done).toBe(true);
}
function finite(value: unknown) {
  if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  else if (value && typeof value === 'object') for (const child of Object.values(value)) finite(child);
}
function accepted(s: ReturnType<typeof spec>) {
  const p = parseExperimentJson(json(s));
  if (!p.ok) throw Error(JSON.stringify(p.errors));
  return p.value as typeof s;
}

it('CR-MISSION-B1 hot installed solar with zero stocks remains physical full-hold recovery', () => {
  const run = createRun('hot-solar', solar(600));
  runChunk(run, 1);
  console.info('B1 first chunk', { done: run.done, time: run.state.timeSeconds, stage: run.state.mission!.stage, delivered: run.state.mission!.deliveredM3, solarW: run.last.solarW });
  expect(run.done).toBe(false);
  expect(run.state.mission!.stage).toBe('mining');
  expect(run.state.cyclesCompleted).toBe(0);
  expect(run.last.solarW).toBe(0);
  expect(run.state.chargeJ).toBe(0);
  expect(run.state.temperatureK).not.toBe(600);
  while (!run.done) runChunk(run, 100);
  expect(run.state.timeSeconds).toBe(5);
  expect(run.state.mission!.deliveredM3).toBe(0);
  expect(run.events.items().some(e => e.message.includes('необратимое исчерпание'))).toBe(false);
  balance(run); validResult(run);
});

it('CR-MISSION-B1 cold positive source performs measured work and genuinely dark empty control stops', () => {
  const cold = createRun('cold-solar', solar(300)); runChunk(cold, 1);
  expect(cold.last.solarW).toBe(100e6);
  expect(cold.state.mission!.deliveredM3).toBeCloseTo(.01, 8);
  expect(cold.done).toBe(true); balance(cold); validResult(cold);
  const darkSpec = spec('civilian-M:1'); darkSpec.environment.solarFluxWm2 = 0;
  const dark = createRun('dark-empty', darkSpec); runChunk(dark, 1);
  expect(dark.done).toBe(true);
  expect(dark.state.mission!.deliveredM3).toBe(0);
  expect(dark.events.items().some(e => e.message.includes('необратимое исчерпание'))).toBe(true);
  balance(dark); validResult(dark);
});

it('CR-MISSION-B2 zero-phase hot repeated first-stop commits physical time instead of zero-time service flood', () => {
  const s = spec('pony:1', { repeat: true, stopPolicy: 'first-stop' });
  const run = createRun('zero-first-stop', s), chunk = runChunk(run, 1, 20);
  console.info('B2 bounded chunk', { steps: chunk.steps, time: run.state.timeSeconds, ticks: run.metrics.ticks, cycles: run.state.cyclesCompleted, events: run.events.total });
  expect(chunk.steps).toBe(1);
  expect(run.state.timeSeconds).toBeGreaterThan(0);
  expect(run.metrics.ticks).toBe(1);
  expect(run.state.cyclesCompleted).toBeLessThanOrEqual(1);
  expect(run.events.total).toBeLessThan(30);
  expect(run.state.usefulWork).toBe(0);
  balance(run); validResult(run);
  // До исправления предыдущие assertions падают до опасного вызова Infinity budget.
  const defaultBudget = createRun('zero-default-budget', s);
  expect(runChunk(defaultBudget, 1).steps).toBe(1);
  expect(defaultBudget.state.timeSeconds).toBeGreaterThan(0);
  balance(defaultBudget); validResult(defaultBudget);
});

for (const profile of ['disabled', 'zero-area', 'dark'] as const) it(`B1 solar ${profile} is not a positive future source`, () => {
  const s = solar(600), panel = s.resolvedShip.instances.find(i => i.item.family === 'solar')!;
  if (profile === 'disabled') { panel.enabled = false; s.resolvedShip.fit.instances[panel.id].enabled = false; }
  if (profile === 'zero-area') panel.item.numerics.areaM2 = 0;
  if (profile === 'dark') s.environment.solarFluxWm2 = 0;
  const run = createRun(profile, accepted(s)); runChunk(run, 1);
  expect(run.done).toBe(true); expect(run.last.solarW).toBe(0);
  expect(run.events.items().some(e => e.message.includes('необратимое исчерпание'))).toBe(true);
  expect(run.state.mission!.deliveredM3).toBe(0); balance(run); validResult(run);
});

for (const live of [true, false]) it(`B1 typed generator fuel ${live ? 'present' : 'empty'} distinguishes hot recovery from permanent depletion`, () => {
  const s = spec('pony:1', { durationSeconds: .3 }); s.initial.chargeJ = 0;
  if (!live) s.initial.fuelKg.diesel = 0;
  const run = createRun('hot-generator', accepted(s)); runChunk(run, 1);
  expect(run.last.generatorW).toBe(0); expect(run.state.mission!.stage === 'mining').toBe(live);
  expect(run.done).toBe(!live);
  untilDone(run); if (live) expect(run.state.timeSeconds).toBe(.3);
  expect(run.state.usefulWork).toBe(0); balance(run); validResult(run);
});

for (const profile of ['disabled', 'zero-power'] as const) it(`B1 ${profile} generator is not electric recovery despite live unrelated propulsion fuel`, () => {
  const s = spec('pony:1'), generator = s.resolvedShip.instances.find(i => i.item.family === 'generator')!;
  s.initial.chargeJ = 0;
  if (profile === 'zero-power') generator.item.numerics.powerW = 0;
  else {
    generator.enabled = false;
    s.resolvedShip.fit.instances[generator.id].enabled = false;
    s.resolvedShip.resources.diesel.consumerIds = s.resolvedShip.resources.diesel.consumerIds.filter(id => id !== generator.id);
  }
  const run = createRun(profile, accepted(s)); runChunk(run, 1);
  expect(run.state.fuelKg.diesel).toBeGreaterThan(0); expect(run.done).toBe(true);
  expect(run.last.generatorW).toBe(0); expect(run.state.chargeJ).toBe(0);
  expect(run.events.items().some(e => e.message.includes('необратимое исчерпание'))).toBe(true);
  balance(run); validResult(run);
});

for (const representation of ['electric', 'heat'] as const) it(`B1 external ${representation} is classified by its actual energy path`, () => {
  const s = spec('civilian-M:1', { durationSeconds: .3 }); s.environment.solarFluxWm2 = 0;
  s.environment.energyInputs.push({ sourceId: 'lab:review-source', representation, powerW: 100e6 });
  const run = createRun(representation, accepted(s)); runChunk(run, 1);
  expect(run.done).toBe(representation === 'heat');
  expect(run.last.externalElectricW).toBe(representation === 'electric' ? 100e6 : 0);
  untilDone(run); if (representation === 'electric') expect(run.state.timeSeconds).toBe(.3);
  expect(run.state.usefulWork).toBe(0); balance(run); validResult(run);
});

it('B1 future solar also prevents a false irreversible electric flight loss', () => {
  const s = solar(600); s.mission!.distanceM = 1;
  const run = createRun('hot-solar-flight', accepted(s)); runChunk(run, 1);
  expect(run.done).toBe(false); expect(run.state.mission!.stage).toBe('outbound');
  expect(run.state.mission!.positionM).toBe(0); expect(run.state.fuelKg).toEqual(s.initial.fuelKg);
  validResult(run);
});

it('B2 recovery commits exactly the idle kernel ledger once, without the discarded mining trial', () => {
  const s = spec('pony:1', { stopPolicy: 'first-stop', repeat: true }), run = createRun('idle-ledger', s);
  const idle = stepV2(run.spec, run.state, .1, {});
  runChunk(run, 1);
  for (const key of ['timeSeconds', 'chargeJ', 'temperatureK', 'fuelKg', 'buffersJ', 'currentMassKg', 'usefulWork', 'consumptionKg'] as const) expect(run.state[key]).toEqual(idle.state[key]);
  expect(run.state.mission!.elapsed.recovery).toBe(.1);
  expect(idle.mining.requested).toBe(false); expect(run.metrics.selectedWorkM3).toBe(0);
  expect(run.state.cyclesCompleted).toBe(0); balance(run); validResult(run);
});

for (const [distanceM, approachSeconds, serviceSeconds] of [[0, 0, 0], [0, .1, 0], [0, 0, .1], [1, 0, 0]]) it(`B2 allowed zero-phase class ${distanceM}/${approachSeconds}/${serviceSeconds} has bounded physical clock`, () => {
  const s = spec('pony:1', { stopPolicy: 'first-stop', repeat: true, durationSeconds: .5, distanceM, approachSeconds, serviceSeconds }), run = createRun('zero-class', accepted(s));
  untilDone(run);
  expect(run.state.timeSeconds).toBe(.5); expect(run.state.usefulWork).toBe(0);
  expect(run.metrics.ticks).toBeGreaterThan(0); expect(run.events.total).toBeLessThan(100);
  if (!distanceM && !approachSeconds && !serviceSeconds) expect(run.state.cyclesCompleted).toBe(0);
  finite(result(run)); balance(run); validResult(run);
});

it('B2 single first-stop at t=0 remains a finite valid result; tiny positive goal does not invent a zero-time service', () => {
  const single = createRun('single-zero', spec('pony:1', { stopPolicy: 'first-stop' }));
  runChunk(single, 1); expect(single.done).toBe(true); expect(single.state.timeSeconds).toBe(0);
  expect(single.metrics.lastCycle?.kUse).toBeNull(); finite(result(single)); validResult(single);
  const tiny = createRun('tiny-goal', accepted(spec('pony:1', { targetM3: 1e-10, repeat: true, durationSeconds: .3 })));
  expect(runChunk(tiny, 1).steps).toBe(1); expect(tiny.state.timeSeconds).toBe(.1); expect(tiny.state.cyclesCompleted).toBe(0);
  untilDone(tiny); expect(tiny.state.timeSeconds).toBe(.3); expect(tiny.state.usefulWork).toBe(0);
  finite(result(tiny)); balance(tiny); validResult(tiny);
});

it('B2 Worker ACK/pause/step/cancel stays bounded on the original repeated zero-phase request', () => {
  const messages: any[] = [], worker = new WorkerController(m => messages.push(structuredClone(m)));
  worker.handle({ runId: 'zero-worker', commandId: 1, type: 'start', payload: { spec: spec('pony:1', { stopPolicy: 'first-stop', repeat: true }), maxSteps: 1 } });
  worker.pump(); const chunk = messages.find(m => m.type === 'chunk');
  expect(chunk.payload.steps).toBe(1); expect(chunk.payload.state.timeSeconds).toBe(.1); expect(worker.pendingChunks).toBe(1);
  worker.pump(); expect(messages.filter(m => m.type === 'chunk')).toHaveLength(1);
  worker.handle({ runId: 'zero-worker', commandId: 2, type: 'pause' });
  worker.handle({ runId: 'zero-worker', type: 'telemetry-ack', chunkId: chunk.chunkId });
  worker.pump(); expect(worker.context!.state.timeSeconds).toBe(.1);
  worker.handle({ runId: 'zero-worker', commandId: 3, type: 'step' }); worker.pump();
  expect(worker.context!.state.timeSeconds).toBe(.2);
  worker.handle({ runId: 'zero-worker', commandId: 4, type: 'cancel' });
  expect(messages.filter(m => m.type === 'control-ack').map(m => m.control)).toEqual(['start', 'pause', 'step', 'cancel']);
  const snapshot = messages.find(m => m.type === 'snapshot').payload;
  expect(snapshot.status).toBe('cancelled'); expect(snapshot.state.timeSeconds).toBe(.2);
  expect(parseResultJson(json(snapshot)).ok).toBe(true); expect(snapshot.state.cyclesCompleted).toBe(0);
});
