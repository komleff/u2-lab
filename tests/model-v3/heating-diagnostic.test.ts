import {expect,it} from 'vitest';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {stepV3,CONTROLLER_CANDIDATES} from '../../src/model/v3/step';
import {temperatureCorridor} from '../../src/model/v3/thermal-control';
import type {RunSpecV3,ShipFitV3,ShipModelCatalogVersion,StateV3} from '../../src/model/v3/types';

// Холодное поле опыта, не ТТХ: корабль теряет тепло и требует прогрева.
const cold={radiativeBackgroundK:100,backgroundSourceId:'heating-cold-bg',thermalField:{sourceId:'heating-cold-field',temperatureK:100,coefficientWPerM2K:10},solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]};
const put=(fit:ShipFitV3,slot:string,itemId:string)=>{const id='fit:'+slot;fit.assignments[slot]=id;fit.instances[id]={id,itemId,enabled:true};};
function coldSputnik(version:ShipModelCatalogVersion,change:(fit:ShipFitV3)=>void=()=>{}){
  const catalog=loadCandidateCatalog(version),fit=getPresetFit('sputnik-d',version);change(fit);
  const probe=makeShipModelMiningRun(fit,catalog,{durationSeconds:1,action:'idle',environment:cold});if(!probe.ok)throw Error(JSON.stringify(probe.errors));
  const corridor=temperatureCorridor(probe.value.resolvedShip.instances),delta=CONTROLLER_CANDIDATES.narrowOffsets?Math.min(10,(corridor.warmK-corridor.coldK)/12):10;
  // Старт внутри полосы (cold+2δ, cold+3δ]: здесь работает только отдача буфера.
  const built=makeShipModelMiningRun(fit,catalog,{durationSeconds:1,action:'idle',environment:cold,temperatureK:corridor.coldK+2.5*delta});if(!built.ok)throw Error(JSON.stringify(built.errors));
  return {spec:built.value,corridor,delta};
}
function run(spec:RunSpecV3,state:StateV3,seconds:number){
  const rows:ReturnType<typeof stepV3>[]=[];let current=state;
  for(let t=0;t<seconds;t++){const r=stepV3(spec,current,{},'idle');rows.push(r);current=r.state;}
  return rows;
}
const heatingFamilies=['electric-heater','furnace'];
const unavailable=(r:ReturnType<typeof stepV3>)=>r.diagnostics.some(d=>d.reason==='heating-unavailable');

it('ST2-04 исправная печь в полосе (cold+2δ, cold+3δ] при пустом буфере не даёт ложного heating-unavailable',()=>{
  const {spec,corridor,delta}=coldSputnik('ship-fitting-0.3.1');
  expect(spec.resolvedShip.instances.some(i=>i.id==='builtin:electric-heater')).toBe(true);
  const r=stepV3(spec,spec.initialState,{},'idle');
  expect(r.telemetry.netHeatW).toBeLessThan(0);
  expect(spec.initialState.temperatureK).toBeGreaterThan(corridor.coldK+2*delta);
  expect(unavailable(r),JSON.stringify(r.diagnostics)).toBe(false);
});
it('ST2-04 без средств прогрева в той же полосе heating-unavailable остаётся',()=>{
  const {spec}=coldSputnik('ship-fitting-0.3.2');
  expect(spec.resolvedShip.instances.some(i=>heatingFamilies.includes(i.item.family))).toBe(false);
  const r=stepV3(spec,spec.initialState,{},'idle');
  expect(r.telemetry.netHeatW).toBeLessThan(0);expect(unavailable(r)).toBe(true);
});
it('ST2-04 Спутник 0.3.2 с buffer-S без нагревателя: отдача буфера, затем heating-unavailable, скрытого обогрева нет',()=>{
  const {spec,corridor,delta}=coldSputnik('ship-fitting-0.3.2',fit=>put(fit,'signature-2','buffer-S'));
  const buffer=spec.resolvedShip.instances.find(i=>i.item.family==='buffer')!;
  expect(spec.resolvedShip.instances.some(i=>heatingFamilies.includes(i.item.family))).toBe(false);
  // Долг буфера: заряд при температуре выше текущей, отдача прогревом разрешена.
  spec.initialState.buffers[buffer.id]={storedJ:1e8,minimumCaptureK:400};
  const rows=run(spec,spec.initialState,300);
  // При долге и дефиците тепла буфер отдаёт тепло веткой восстановления.
  expect(rows[0].telemetry.bufferReleaseW).toBeGreaterThan(0);expect(rows[0].state.governor.recoveringBuffer).toBe(true);expect(unavailable(rows[0])).toBe(false);
  const empty=rows.findIndex(r=>r.state.buffers[buffer.id].storedJ===0);expect(empty).toBeGreaterThan(0);
  const after=rows.slice(empty+1);
  // Шаг начинается с температуры предыдущего; в полосе прогрева средств нет — диагноз есть.
  const inBand=after.filter(r=>rows[rows.indexOf(r)-1].state.temperatureK<=corridor.coldK+3*delta);expect(inBand.length).toBeGreaterThan(100);
  for(const r of inBand){expect(unavailable(r)).toBe(true);expect(r.state.governor.heatingStageId).toBeNull();expect(r.telemetry.bufferReleaseW).toBe(0);}
  for(let i=1;i<after.length;i++)expect(after[i].state.temperatureK).toBeLessThan(after[i-1].state.temperatureK);
  for(const r of rows){expect(['electric-heater','furnace']).not.toContain(r.state.governor.heatingStageId);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-3);}
});
it('ST2-04 Спутник 0.3.2 с buffer-S и сменным нагревателем: печь греет, ложного heating-unavailable нет',()=>{
  const {spec,corridor,delta}=coldSputnik('ship-fitting-0.3.2',fit=>{put(fit,'signature-2','buffer-S');put(fit,'signature-1','electric-heater-S');});
  const buffer=spec.resolvedShip.instances.find(i=>i.item.family==='buffer')!,heater=spec.resolvedShip.instances.find(i=>i.item.family==='electric-heater')!;
  expect(heater.builtin).toBe(false);
  spec.initialState.buffers[buffer.id]={storedJ:1e8,minimumCaptureK:400};
  const rows=run(spec,spec.initialState,1200);
  expect(rows.filter(unavailable).map(r=>r.state.timeSeconds)).toEqual([]);
  expect(rows[0].telemetry.bufferReleaseW).toBeGreaterThan(0);expect(rows[0].state.governor.recoveringBuffer).toBe(true);
  // Траектория проходит прежнюю ложную полосу: буфер пуст, печь исправна, но ещё не нужна.
  const emptyCrossing=rows.find((r,i)=>i>0&&rows[i-1].state.buffers[buffer.id].storedJ>0&&r.state.buffers[buffer.id].storedJ===0)!;
  expect(emptyCrossing).toBeDefined();expect(emptyCrossing.telemetry.bufferReleaseW).toBeGreaterThan(0);expect(emptyCrossing.telemetry.bufferCaptureW).toBe(0);expect(emptyCrossing.state.governor.heatingStageId).toBe('buffer-release');expect(emptyCrossing.telemetry.deliveredW).toBe(rows[0].telemetry.deliveredW);
  const band=rows.filter((r,i)=>i>0&&rows[i-1].state.buffers[buffer.id].storedJ===0&&r.state.buffers[buffer.id].storedJ===0&&rows[i-1].state.temperatureK>corridor.coldK+2*delta&&rows[i-1].state.temperatureK<=corridor.coldK+3*delta);
  expect(band.length).toBeGreaterThan(100);for(const r of band)expect(r.state.governor.heatingStageId).toBeNull();
  // Дизельный Спутник: печь на топливе первой (её нет), электронагреватель держит cold+δ.
  const heated=rows.filter(r=>r.state.governor.heatingStageId==='electric-heater');expect(heated.length).toBeGreaterThan(100);
  for(const r of heated)expect(r.telemetry.deliveredW).toBeGreaterThan(rows[0].telemetry.deliveredW);
  for(const r of rows.slice(-100))expect(r.state.temperatureK).toBeGreaterThan(corridor.coldK+delta-0.1);
  for(const r of rows)expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-3);
});
