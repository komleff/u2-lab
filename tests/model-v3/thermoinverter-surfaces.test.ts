import { expect, it } from "vitest";
import { evaluateSurfaces, exchangeAt } from "../../src/model/v3/thermal-surfaces";
import { solveThermoinverter } from "../../src/model/v3/thermoinverter";
import type { ThermalSurface } from "../../src/model/v3/types";
import {stepV3} from '../../src/model/v3/step';
import {runtimeFixture,install} from './runtime-fixture';
const panel=(id:string,areaM2:number,owner:string|null):ThermalSurface=>({id,areaM2,emissivity:0.9,active:true,closable:true,builtin:false,circuitOwner:owner?{kind:'pump-radiator',instanceId:owner}:{kind:'common-ti'},irProfile:{version:'radiator-ir/1',kind:'omnidirectional',aftFraction:0},origins:{}});
it.each([[false,false],[true,false],[false,true],[true,true]])("exclusive area/temperature graph with two pumps a=%s b=%s",(a,b)=>{
  const surfaces=[panel('common',10,null),panel('a',20,'pump-a'),panel('b',30,'pump-b')],temperatures:Record<string,number>={'common-ti':700,...(a?{'pump-a':800}:{}),...(b?{'pump-b':900}:{})};
  const r=evaluateSurfaces(surfaces,{common:true,a:true,b:true},500,100,null,temperatures);
  expect(r.areaM2).toBe(60);expect(r.rows.map(x=>x.temperatureK)).toEqual([700,a?800:500,b?900:500]);
  expect(r.rows.map(x=>x.surfaceId)).toEqual(['common','a','b']);expect(r.rows.filter(x=>x.circuitId==='common-ti').map(x=>x.surfaceId)).toEqual(['common']);
});
it("closed active panels participate nowhere; mixed direction profiles do not alter thermal watts",()=>{
  const surfaces=[panel('a',10,null),panel('b',20,null)];surfaces[1].irProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:0.8};
  const r=evaluateSurfaces(surfaces,{a:true,b:true},500,100,null,{'common-ti':700});expect(r.rows.map(x=>x.irProfile.kind)).toEqual(['omnidirectional','aft-directed']);
  const watts=r.totalW;surfaces[1].irProfile={version:'radiator-ir/1',kind:'omnidirectional',aftFraction:0};expect(evaluateSurfaces(surfaces,{a:true,b:true},500,100,null,{'common-ti':700}).totalW).toBe(watts);
  expect(evaluateSurfaces(surfaces,{a:false,b:true},500,100,null,{}).areaM2).toBe(20);
});
it("hot-side solver closes Qc+W=Qradiation+Qfield with bounded iterations and minimum useful Th",()=>{
  const surfaces=[panel('fixed',10,'pump')],x={temperatureK:500,backgroundK:100,field:{temperatureK:650,coefficientWPerM2K:100},surfaces,maximumBusPowerW:2e6,maximumCoolingW:10e6,copEfficiency:0.5,driveEfficiency:0.95,evaporatorConductanceWPerK:1e6,condenserConductanceWPerK:1e6,maximumHotK:1200,requestedCoolingW:1e6,sourceHeatPerBusW:1/0.9-1};
  const r=solveThermoinverter(x);expect(r.running,JSON.stringify(r)).toBe(true);expect(r.iterations).toBeLessThanOrEqual(50);expect(r.hotK).toBeGreaterThan(x.temperatureK);
  const hot=exchangeAt(10,0.9,r.hotK,100,x.field);expect(Math.abs(hot.totalW-r.coolingW-r.compressorW)).toBeLessThan(1e-6*Math.max(1,hot.totalW));
  expect(r.busW).toBeLessThanOrEqual(x.maximumBusPowerW);expect(r.hotFluidK).toBeLessThanOrEqual(x.maximumHotK+1e-8);expect(r.netBenefitW).toBeGreaterThan(0);
  expect(r.coolingW).toBeLessThanOrEqual(x.maximumCoolingW);
});
it("TI stays off if the ship gains no cooling after source loss and displaced natural exchange",()=>{
  const r=solveThermoinverter({temperatureK:500,backgroundK:100,field:null,surfaces:[panel('fixed',10,null)],maximumBusPowerW:2e6,maximumCoolingW:1e6,copEfficiency:0.5,driveEfficiency:0.95,evaporatorConductanceWPerK:1e6,condenserConductanceWPerK:1e6,maximumHotK:900,requestedCoolingW:1e6,sourceHeatPerBusW:100});
  expect(r.running).toBe(false);expect(r.busW).toBe(0);expect(r.reason).toBeTruthy();
});
it.each([[false,false],[true,false],[false,true],[true,true]])('production two-pump graph a=%s b=%s keeps stopped panels direct, never common', (a,b)=>{
  const s=runtimeFixture(600);for(const i of s.resolvedShip.instances)i.item.gate.workHigh=620;s.environment.directHeat=[{sourceId:'hot-load',powerW:5e6}];
  const first=install(s,'pump-radiator-S','pump-a'),second=install(s,'pump-radiator-S','pump-b');first.enabled=a;second.enabled=b;
  for(const i of [first,second]){i.item.gate.high=1800;i.item.numerics.maximumHotK=1500;}
  for(const surface of s.resolvedShip.surfaces)surface.areaM2=100;
  const r=stepV3(s,s.initialState,{}),frame=r.frames[0];expect(frame.surfaces.rows).toHaveLength(2);expect(frame.surfaces.areaM2).toBe(200);
  for(const [index,on]of [a,b].entries()){const row=frame.surfaces.rows[index];expect(row.circuitId).toBe(index===0?'pump-a':'pump-b');expect(row.temperatureK>600).toBe(on);}
  expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(0.1);
});
it('unfavorable active panels remain closed when no paid beneficial hot circuit exists',()=>{
  const s=runtimeFixture(600);s.environment.radiativeBackgroundK=900;s.environment.directHeat=[{sourceId:'heat',powerW:1e6}];
  const rad=install(s,'radiator-active-S');rad.item.gate.high=1800;const ti=install(s,'thermoinverter-S');ti.item.numerics.maximumHotK=650;ti.item.gate.high=1800;
  const r=stepV3(s,s.initialState,{});expect(r.frames[0].surfaces.rows).toHaveLength(0);expect(Object.values(r.state.surfaceOpen)).toEqual([false]);expect(r.telemetry['tiBusW:'+ti.id]).toBe(0);
});
