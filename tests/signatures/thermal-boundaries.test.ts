import {expect,it} from "vitest";
import {bench} from "./bench-fixture";
import {initialStateV2,physicsShip,stepV2} from "../../src/model/v2/step";
import {stepPhysicsV2} from "../../src/model/v2/physics";

const near=(a:number,b:number,ref=Math.abs(b))=>b===0?expect(a).toBe(0):expect(Math.abs(a-b)).toBeLessThanOrEqual(1e-6*Math.abs(b)+1e-12*ref);

it("SS16 isolated full-flow H2 linear thermal ODE matches independent exponential and gas energy",()=>{
  const s=bench("S",600),state=initialStateV2(s),ship=physicsShip(s,state);
  // Explicit analyst fixture: one S cooler, no surface K; known fixed heat,
  // protected processing and lossy battery, so parasitic export has a real host budget.
  const operation={...ship.modules.find(m=>m.kind==="load")!,powerW:0};
  ship.modules=ship.modules.filter(m=>m.kind==="h2");ship.hullRadiationM2=0;ship.hullPowerW=1000;ship.heatCapacityJK=1e6;
  ship.modules[0].auxW=100;ship.modules[0].gate={low:0,workLow:0,workHigh:1000,high:1100,restartLow:1,restartHigh:1090};
  operation.gate={...ship.modules[0].gate,workHigh:500};ship.modules.push(operation);
  for(const tank of ship.tanks)tank.gate=undefined;
  const heatW=20e6,env={...s.environment,directHeat:[{sourceId:"analytic-known-heat",powerW:heatW}]};
  const p=stepPhysicsV2(ship,state,env,[],.1),flow=1.875,slope=flow*14200;
  const grossBatteryW=1100/.9,lossW=grossBatteryW-1100,emW=.0000215*(grossBatteryW+1100);
  const constant=heatW+1000+lossW+100-emW,equilibrium=20+constant/slope;
  const expected=equilibrium+(600-equilibrium)*Math.exp(-slope*.1/1e6);
  near(p.state.temperatureK,expected);
  const gasJ=constant*.1-1e6*(expected-600);
  const actualGasJ=p.signatureFrames!.reduce((n,f)=>n+f.coolers[0].gasMeanW*(f.endS-f.startS),0);
  near(actualGasJ,gasJ);near(p.coolantConsumedKg,flow*.1);
  near(1e6*(p.state.temperatureK-600)+actualGasJ+emW*.1,heatW*.1+grossBatteryW*.1);
});
it.each(["S","M"] as const)("SS16 %s near-floor/workHigh, OFF/empty/actual-power-limited paths preserve finite source accounting",size=>{
  for(const temperatureK of [299.9,300,300.1,499.9,500,510]){
    const s=bench(size,temperatureK),state=initialStateV2(s);
    const p=stepV2(s,state,.5,{});expect(Number.isFinite(p.state.temperatureK)).toBe(true);
    if(temperatureK<=300)expect(p.telemetry.h2CoolingW).toBe(0);
    for(const f of p.signatureFrames!)for(const c of f.coolers)near(c.netCoolingMeanW+c.auxW,c.gasMeanW);
  }
  const empty=bench(size,510);empty.initial.fuelKg.hydrogen=0;const p=stepV2(empty,initialStateV2(empty),.5,{});
  expect(p.telemetry.h2CoolingW).toBe(0);expect(p.signatureFrames!.flatMap(f=>f.coolers).every(c=>c.flowKgS===0)).toBe(true);
  const unpowered=bench(size,510);unpowered.initial.chargeJ=0;unpowered.initial.fuelKg.diesel=0;
  for(const i of unpowered.resolvedShip.instances)if(i.item.family==="generator")i.enabled=false;
  const q=stepV2(unpowered,initialStateV2(unpowered),.5,{});expect(q.telemetry.h2CoolingW).toBe(0);expect(q.telemetry.h2AuxRejectW).toBe(0);
});
it("SS01 linear-fog refusal is limited to inconsistent actual radiative mapping; zero-K mapping remains usable",()=>{
  const s=bench("S",400);s.environment.law="linear-fog-experiment";s.environment.linearWK=0;s.resolvedShip.hull.hullRadiationM2=0;
  expect(()=>stepV2(s,initialStateV2(s),.1,{})).not.toThrow();
  s.environment.linearWK=100;expect(()=>stepV2(s,initialStateV2(s),.1,{})).toThrow(/mapping/);
  s.schemaVersion="u2-lab/2";s.modelVersion="ship-fitting-mission-0.2.2";delete s.signatures;
  expect(()=>stepV2(s,initialStateV2(s),.1,{})).not.toThrow();
});

it.each(["S","M"] as const)("SS01/16 %s two coolers and a hydrogen drive pay one shared mid-step tank boundary",size=>{
  const s=bench(size,600),state=initialStateV2(s),ship=physicsShip(s,state),wide={low:0,workLow:0,workHigh:1000,high:1100,restartLow:1,restartHigh:1090};
  const cooler={...ship.modules.find(m=>m.kind==="h2")!,auxW:100,gate:wide};
  const engine={...ship.modules.find(m=>m.kind==="engine")!,species:"hydrogen" as const,tankId:"hydrogen",forceN:100,alpha:.001,efficiency:.5,hostFraction:.5,gate:wide,signature:{size,kind:"hydrogen" as const,motorEfficiency:.5,profile:"aft" as const}};
  const operation={...ship.modules.find(m=>m.kind==="load")!,powerW:0,gate:{...wide,workHigh:500}};
  ship.modules=[cooler,{...cooler,id:"second-cooler"},engine,operation];ship.hullPowerW=1000;ship.hullRadiationM2=0;ship.heatCapacityJK=1e6;
  for(const tank of ship.tanks){tank.gate=undefined;if(tank.id==="hydrogen")tank.energyJKg=120e6;}
  state.fuelKg.hydrogen=.001;
  const env={...s.environment,directHeat:[{sourceId:"fixture-known-heating",powerW:20e6}]},p=stepPhysicsV2(ship,state,env,[{moduleId:engine.id,duty:1}],.5);
  const coolerRate=2*(size==="S"?1.875:7.5),driveRate=.1;
  near(Object.values(p.consumptionKg).reduce((a,b)=>a+b,0),.001);expect(p.state.fuelKg.hydrogen).toBe(0);
  near(p.coolantConsumedKg,.001*coolerRate/(coolerRate+driveRate));
  near(p.consumptionKg["hydrogen:propulsion:"+engine.id],.001*driveRate/(coolerRate+driveRate));
  const active=p.signatureFrames!.find(f=>f.coolers.some(c=>c.flowKgS>0))!;expect(active.coolers).toHaveLength(2);
  for(const c of active.coolers)expect(c.flowKgS).toBe(size==="S"?1.875:7.5);
  const tap=active.exports.find(x=>x.kind==="engine-hydrogen")!;expect(tap.powerW).toBe(3e6);expect(tap.absoluteIrW).toBe(30000);expect(tap.hostHeatDebitW).toBe(0);
  expect(p.signatureFrames!.at(-1)!.coolers).toEqual([]);
  const incomingJ=20e6*.5+120e6*.001-p.state.chargeJ+state.chargeJ;
  expect(Math.abs(p.telemetry.energyResidualJ)).toBeLessThanOrEqual(1e-6*incomingJ+1e-12*incomingJ);
});
