import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { compileShipModelFit, validateCatalogV3, validateRunSpecV3 } from '../../src/model/v3/schema';
import { SHIP_MODEL_CATALOG_VERSIONS, type CandidateCatalogV3, type HullV3, type RunSpecV3, type ShipFitV3 } from '../../src/model/v3/types';
import { coupledEm } from '../../src/model/v3/em-ledger';
import { stepV3 } from '../../src/model/v3/step';
import { emComponent } from '../../src/signatures/em-cs';
import { makeShipModelMiningRun, type ShipModelConditions } from '../../src/scenarios/fitting';
import { createShipModelRun, runShipModelChunk, shipModelResult } from '../../src/runner/ship-model-run';
import { serializeResultSnapshot } from '../../src/io/fitting-json';
import { parseShipModelResultJson } from '../../src/io/ship-model-result';

// Фикстура WI3: кандидат Sinclair S по документу класса §6 (D = 0,35, A = 0,2) — только условие теста,
// данные каталогов не меняются; национальные корпуса — WI6.
const SINCLAIR_S = { lossFactor: 1.07, thrustFactors: { march: 1.1, retro: 0.94, strafe: 0.86 }, emLeakageFactor: 0.86 };
const NEUTRAL = { lossFactor: 1, thrustFactors: { march: 1, retro: 1, strafe: 1 }, emLeakageFactor: 1 };
const FIELDS = ['lossFactor', 'emLeakageFactor', 'thrustFactors.march', 'thrustFactors.retro', 'thrustFactors.strafe'];
const origin = { kind: 'experimental' as const, unit: '1', sourceRef: 'tests/model-v3/school-profile.test.ts', note: 'Фикстура профиля школы по документу класса §6; не данные каталога.' };
type Profile = typeof SINCLAIR_S;

function withSchool(preset: string, profile: Profile | null = SINCLAIR_S) {
  const c = loadCandidateCatalog('ship-fitting-0.3.2'), f = getPresetFit(preset, c.version), h = c.hulls.find(h => h.id === f.hullId)! as HullV3 & { schoolProfile?: Profile };
  if (profile) { h.schoolProfile = structuredClone(profile); for (const k of FIELDS) h.origins['schoolProfile.' + k] = origin; }
  return { c, f, h };
}
const ship = (c: CandidateCatalogV3, f: ShipFitV3) => { const r = compileShipModelFit(f, c); if (!r.ok) throw Error(JSON.stringify(r.errors)); return r.value as any; };
const run = (c: CandidateCatalogV3, f: ShipFitV3, x: ShipModelConditions = {}) => { const r = makeShipModelMiningRun(f, c, x); if (!r.ok) throw Error(JSON.stringify(r.errors)); return r.value; };
const ratio = (a: number, b: number) => expect(a / b).toBeCloseTo(1, 12);

it('ST3-05: каталоги 0.3.x проходят проверку без изменений, профиль необязателен', () => {
  for (const version of SHIP_MODEL_CATALOG_VERSIONS) {
    const c = loadCandidateCatalog(version), before = JSON.stringify(c);
    expect(validateCatalogV3(c).ok, version).toBe(true);
    expect(c.hulls.some(h => 'schoolProfile' in h)).toBe(false);
    expect(JSON.stringify(c)).toBe(before);
  }
  const { c } = withSchool('sputnik-d');
  const result = validateCatalogV3(c);
  expect(result.ok, JSON.stringify(!result.ok && result.errors)).toBe(true);
});

it.each([
  ['утечка EM 0', (p: any) => { p.emLeakageFactor = 0; }],
  ['утечка EM больше 1', (p: any) => { p.emLeakageFactor = 1.01; }],
  ['утечка EM отрицательна', (p: any) => { p.emLeakageFactor = -0.1; }],
  ['множитель потерь 0', (p: any) => { p.lossFactor = 0; }],
  ['множитель потерь отрицателен', (p: any) => { p.lossFactor = -1; }],
  ['тяга марша 0', (p: any) => { p.thrustFactors.march = 0; }],
  ['тяга торможения отрицательна', (p: any) => { p.thrustFactors.retro = -0.5; }],
  ['тяга стрейфа не число', (p: any) => { p.thrustFactors.strafe = Number.NaN; }],
  ['нет оси тяги', (p: any) => { delete p.thrustFactors.strafe; }],
  ['лишняя ось тяги', (p: any) => { p.thrustFactors.turn = 1; }],
  ['лишнее поле профиля', (p: any) => { p.irFactor = 0.9; }],
  ['нет множителя утечки', (p: any) => { delete p.emLeakageFactor; }],
])('ST3-05: недопустимый профиль (%s) отклоняется с адресом поля', (_, mutate) => {
  const { c, h } = withSchool('sputnik-d'); mutate(h.schoolProfile);
  const result = validateCatalogV3(c);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some(e => e.path.includes('schoolProfile')), JSON.stringify(result.errors)).toBe(true);
});

it('ST3-05: число профиля без происхождения отклоняется', () => {
  const { c, h } = withSchool('sputnik-d'); delete h.origins['schoolProfile.thrustFactors.retro'];
  const result = validateCatalogV3(c);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.some(e => e.path.includes('schoolProfile.thrustFactors.retro'))).toBe(true);
});

it('ST3-05: множитель потерь, дающий КПД ≤ 0 у установленного двигателя, отклоняется', () => {
  // Дизель η = 0,32: 1 − 0,68·1,5 < 0 — сборка невыполнима, ошибка адресована профилю.
  const { c, f, h } = withSchool('sputnik-d'); h.schoolProfile!.lossFactor = 1.5;
  const result = compileShipModelFit(f, c);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.some(e => e.path.includes('schoolProfile.lossFactor')), JSON.stringify(result.errors)).toBe(true);
});

it('ST3-01: компиляция применяет профиль к КПД двигателей и генератора, собственным нуждам и тяге по ролям слотов', () => {
  const plain = withSchool('sputnik-d', null), school = withSchool('sputnik-d');
  const a = ship(plain.c, plain.f), b = ship(school.c, school.f), k = SINCLAIR_S.lossFactor;
  expect('school' in a).toBe(false);
  expect(b.school.hullPowerW).toBeCloseTo(200000 * k, 6);
  expect(b.school.emLeakageFactor).toBe(SINCLAIR_S.emLeakageFactor);
  for (const i of b.instances.filter((i: any) => ['engine', 'generator'].includes(i.item.family))) {
    const eta = i.item.numerics.efficiency, eff = b.school.numerics[i.id];
    expect(eff.efficiency, i.id).toBeCloseTo(1 - (1 - eta) * k, 15);
    if (i.item.family === 'engine' && ['march', 'retro', 'strafe'].includes(i.role)) expect(eff.forceN, i.id).toBeCloseTo(i.item.numerics.forceN * (SINCLAIR_S.thrustFactors as any)[i.role], 6);
    else expect(eff.forceN, i.id).toBeUndefined();
  }
  expect(Object.keys(b.school.numerics).sort()).toEqual(['fit:march', 'fit:power-2', 'fit:retro', 'fit:strafe', 'fit:turn']);
  // Модули и масса — данные модулей: множитель тяги массу не тянет, паспорт изделия не переписан.
  expect(b.instances).toEqual(a.instances);
  expect(b.dryMassKg).toBe(a.dryMassKg); expect(b.heatCapacityJK).toBe(a.heatCapacityJK);
  for (const key of ['school.hullPowerW', 'school.emLeakageFactor', 'school.numerics.fit:march.efficiency', 'school.numerics.fit:march.forceN', 'school.numerics.fit:power-2.efficiency']) expect(b.origins[key]?.kind, key).toBe('derived');
});

it('ST3-01: тяга по роли не зависит от модуля в слоте — одинаковый двигатель в марше и торможении', () => {
  const { c, f } = withSchool('sputnik-e'), b = ship(c, f);
  const march = b.instances.find((i: any) => i.id === 'fit:march'), retro = b.instances.find((i: any) => i.id === 'fit:retro');
  expect(march.item.id).toBe(retro.item.id);
  ratio(b.school.numerics['fit:march'].forceN, march.item.numerics.forceN * 1.1);
  ratio(b.school.numerics['fit:retro'].forceN, retro.item.numerics.forceN * 0.94);
  expect(validateRunSpecV3(run(c, f)).ok).toBe(true);
});

it('ST3-01: шаг движка расходует топливо двигателя по тяге с профилем и собственные нужды hullPowerW·k', () => {
  const plain = withSchool('sputnik-d', null), school = withSchool('sputnik-d');
  const conditions: ShipModelConditions = { action: 'maneuver', maneuverRole: 'march', durationSeconds: 1 };
  const a = run(plain.c, plain.f, conditions), b = run(school.c, school.f, conditions);
  const req = a.scenario.phases[0].requests;
  const x = stepV3(a, a.initialState, req, 'maneuver'), y = stepV3(b, b.initialState, req, 'maneuver');
  const engine = a.resolvedShip.instances.find(i => i.id === 'fit:march')!.item.numerics, E = a.resolvedShip.resources.diesel.energyJKg;
  ratio(x.telemetry['actualW:fit:march'], engine.forceN * engine.alpha * E);
  ratio(y.telemetry['actualW:fit:march'], engine.forceN * 1.1 * engine.alpha * E);
  expect(y.telemetry.requestedW - x.telemetry.requestedW).toBeCloseTo(200000 * 0.07, 3);
  for (const r of [x, y]) expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-3);
});

it('ST3-01: генератор с профилем тратит топливо по η\' = 1 − (1 − η)·k', () => {
  const school = withSchool('sputnik-d'), spec = run(school.c, school.f, { durationSeconds: 1 });
  spec.initialState.chargeJ = 0; spec.initialState.generator = { permission: true, normalOn: true };
  const r = stepV3(spec, spec.initialState, spec.scenario.phases[0].requests, 'work');
  const g = spec.resolvedShip.instances.find(i => i.id === 'fit:power-2')!.item.numerics, E = spec.resolvedShip.resources.diesel.energyJKg;
  expect(r.telemetry.generatorW).toBeGreaterThan(0);
  const eta = 1 - (1 - g.efficiency) * SINCLAIR_S.lossFactor, burned = spec.initialState.fuelKg.diesel - r.state.fuelKg.diesel;
  // Разность остатка бака теряет ~1e-11 относительной точности; различие η и η' — 13 %.
  expect(burned * E / (r.telemetry.generatorW / g.pathEfficiency / eta)).toBeCloseTo(1, 9);
  expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-3);
});

it('ST3-02: утечка EM корпуса умножается на пропускание экрана, остаток — тепло; намеренное RF не меняется', () => {
  const stages = [{ id: 'hull', kind: 'consumer_input' as const, actualW: 1e6 }], budget = 5e5;
  const base = coupledEm(stages, budget, [0.2, 0.5], 1234), school = coupledEm(stages, budget, [0.2, 0.5], 1234, 0.86);
  const raw = emComponent({ stages, hostLossBudgetW: budget, otherHostExportW: 0, shieldingTransmissions: [0.2, 0.5], intentionalRfW: 1234 });
  expect(base).toEqual({ rawEmW: raw.rawParasiticW, escapedEmW: raw.escapedParasiticW, capturedEmW: raw.capturedParasiticW, hostHeatW: raw.retainedHostHeatW, intentionalRfW: 1234 });
  expect(school.rawEmW).toBe(base.rawEmW);
  ratio(school.escapedEmW, school.rawEmW * 0.2 * 0.86);
  expect(school.capturedEmW).toBeCloseTo(school.rawEmW - school.escapedEmW, 12);
  expect(school.hostHeatW - base.hostHeatW).toBeCloseTo(base.escapedEmW - school.escapedEmW, 9);
  expect(school.intentionalRfW).toBe(1234);
  // Без экрана: escaped = raw · k, не min(1, k) через strongestTransmission.
  ratio(coupledEm(stages, budget, [], 0, 0.7).escapedEmW, raw.rawParasiticW * 0.7);
  ratio(coupledEm(stages, budget, [0.6], 0, 0.7).escapedEmW, raw.rawParasiticW * 0.6 * 0.7);
});

it('ST3-02: в шаге сборки с экраном escaped = raw · T_экрана · k, баланс замкнут, собственный приём прежний', () => {
  const emOnly = { ...NEUTRAL, emLeakageFactor: 0.86 };
  const plain = withSchool('stealth-reference', null), school = withSchool('stealth-reference', emOnly);
  const a = run(plain.c, plain.f, { durationSeconds: 1 }), b = run(school.c, school.f, { durationSeconds: 1 });
  const x = stepV3(a, a.initialState, a.scenario.phases[0].requests), y = stepV3(b, b.initialState, b.scenario.phases[0].requests);
  ratio(x.telemetry.escapedEmW, x.telemetry.rawEmW * 0.2);
  ratio(y.telemetry.escapedEmW, y.telemetry.rawEmW * 0.2 * 0.86);
  for (const r of [x, y]) { expect(r.telemetry.capturedEmW).toBeCloseTo(r.telemetry.rawEmW - r.telemetry.escapedEmW, 9); expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-3); }
  expect(y.frames.map(f => f.ownAntennaTransmission)).toEqual(x.frames.map(f => f.ownAntennaTransmission));
  expect(y.telemetry.intentionalRfW).toBe(x.telemetry.intentionalRfW);
});

it('ST3-03: национального множителя сигнатур нет — нейтральный профиль даёт тот же прогон и те же сигнатуры', () => {
  const plain = withSchool('stealth-reference', null), neutral = withSchool('stealth-reference', NEUTRAL);
  const results = [plain, neutral].map(({ c, f }) => { const r = createShipModelRun('st3-03', run(c, f, { durationSeconds: 30 })); runShipModelChunk(r, 30); return shipModelResult(r); });
  expect(results[1].signatures).toEqual(results[0].signatures);
  expect(results[1].metrics).toEqual(results[0].metrics);
  expect(results[1].state).toEqual(results[0].state);
  // Сигнатурный слой не читает профиль школы: он меняется только через первичные потоки движка.
  for (const name of readdirSync('src/signatures').filter(n => n.endsWith('.ts'))) expect(readFileSync('src/signatures/' + name, 'utf8'), name).not.toMatch(/school/i);
});

it('ST3-03: EM-сигнатура с профилем следует только из escaped + намеренного RF', () => {
  const school = withSchool('stealth-reference', { ...NEUTRAL, emLeakageFactor: 0.7 });
  const r = createShipModelRun('st3-03-em', run(school.c, school.f, { durationSeconds: 5 })); runShipModelChunk(r, 5);
  const last = shipModelResult(r).signatures.last!;
  // Намеренного RF в этой сборке нет: наблюдаемая EM равна вышедшей утечке.
  expect(r.last.intentionalRfW).toBe(0);
  ratio(last.observedEmW, last.escapedEmW);
  ratio(last.escapedEmW, last.rawEmW * 0.2 * 0.7);
});

it('ST3-04: без профиля скомпилированный корабль не получает новых полей во всех версиях 0.3.x', () => {
  for (const version of SHIP_MODEL_CATALOG_VERSIONS) {
    const c = loadCandidateCatalog(version);
    for (const option of c.presetOptions) { const s = ship(c, getPresetFit(option.id, version)); expect('school' in s, version + ':' + option.id).toBe(false); expect(JSON.stringify(s)).not.toMatch(/school/i); }
  }
});

it('ST3-05: сохранённый прогон с профилем открывается буквально, подмена производных значений отклоняется', () => {
  const { c, f } = withSchool('sputnik-d'), spec = run(c, f, { durationSeconds: 3 });
  const r = createShipModelRun('st3-persist', spec); runShipModelChunk(r, 3);
  const saved = serializeResultSnapshot(shipModelResult(r)), parsed = parseShipModelResultJson(saved);
  expect(parsed.ok, JSON.stringify(parsed)).toBe(true);
  if (parsed.ok) expect(serializeResultSnapshot(parsed.value)).toBe(saved);
  const tampered = structuredClone(spec) as RunSpecV3 & { resolvedShip: any }; tampered.resolvedShip.school.hullPowerW = 1;
  expect(validateRunSpecV3(tampered).ok).toBe(false);
});
