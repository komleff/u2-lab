import {createServer} from 'vite';
import {writeFileSync} from 'node:fs';
const server = await createServer({configFile: false, server: {middlewareMode: true, hmr: false}});
const {presets, moduleBase} = await server.ssrLoadModule('/src/catalog/presets.ts');
const {stepModel} = await server.ssrLoadModule('/src/model/step.ts');
const {initialState} = await server.ssrLoadModule('/src/model/types.ts');
await server.close();
function fixture() {
  const p = structuredClone(presets[0]);
  p.ship.heatCapacityJK = 100; p.ship.hullPowerW = 0; p.ship.hullRadiationM2 = 1;
  p.ship.modules = []; p.ship.tanks = []; p.initial.fuelKg = {}; p.initial.temperatureK = 500;
  p.environment.effectiveBackgroundK = 100; p.ship.chargeEfficiency = 1; p.ship.dischargeEfficiency = 1;
  return p;
}
function advance(p, duration, dt) {
  let state = initialState(p), energyJ = 0, residualJ = 0, events = [];
  for (let time = 0; time < duration - 1e-9; time += dt) {
    const h = Math.min(dt, duration - time), r = stepModel(p.ship, state, p.environment, [{moduleId: 'e', duty: 1}], h);
    state = r.state; energyJ += r.telemetry.radiationNetW * h; residualJ += r.telemetry.energyResidualJ; events.push(...r.events);
  }
  return {temperatureK: state.temperatureK, fuelKg: state.fuelKg, energyJ, residualJ, events};
}
const p = fixture(), coarse = advance(p, 10, 10), half = advance(p, 10, 5), fine = advance(p, 10, .001);
const B1 = {coarse, half, fine, halfStepRelativeEnergy: Math.abs(coarse.energyJ - half.energyJ) / half.energyJ, refinedRelativeEnergy: Math.abs(coarse.energyJ - fine.energyJ) / fine.energyJ};
p.ship.hullRadiationM2 = 0; p.ship.hullPowerW = 100; p.initial.temperatureK = 499; p.initial.chargeJ = 0;
p.ship.tanks = [{id: 'd', species: 'diesel', capacityKg: 10, energyJKg: 1000, gate: {low: 150, restartLow: 180, workHigh: 480, restartHigh: 490, high: 500}}];
p.initial.fuelKg = {d: 10}; p.ship.modules = [{...moduleBase('g', 'generator'), tankId: 'd', species: 'diesel', powerW: 100, efficiency: 1}];
const B2 = {coarse: advance(p, 2, 2), fine: advance(p, 2, .001)};
p.ship.modules.push({...moduleBase('e', 'engine'), tankId: 'd', species: 'diesel', forceN: 1, alpha: .1, efficiency: 1});
const B2shared = advance(p, 2, 2);
p.initial.temperatureK = 501; p.ship.hullRadiationM2 = 1;
const B2restart = {coarse: advance(p, 1, 1), fine: advance(p, 1, .001)};
const evidence = {B1, B2, B2shared, B2restart};
writeFileSync(new URL('./model-probes.json', import.meta.url), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence));
