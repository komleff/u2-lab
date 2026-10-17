import { it, expect } from "vitest";
import { advanceFlight, stoppingDistance, FLIGHT_C } from "../../src/model/v2/flight";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";
import { initialStateV2, stepV2 } from "../../src/model/v2/step";

it("M03 constant force matches independent relativistic momentum/energy anchors and unequal retro stop", () => {
  const m=500000,F=2200000,t=200,c=3000,p=F*t;
  const v=p/Math.sqrt(m*m+p*p/(c*c));
  const x=m*c*c/F*(Math.sqrt(1+(p/(m*c))**2)-1);
  let state={positionM:0,velocityMS:0};
  for(let n=0;n<2000;n++)state=advanceFlight(state,m,F,.1);
  expect(FLIGHT_C).toBe(c);expect(state.velocityMS).toBeCloseTo(v,7);expect(state.positionM).toBeCloseTo(x,5);
  const retro=F*.4,stopTime=p/retro,stop=m*c*c/retro*(1/Math.sqrt(1-(v/c)**2)-1);
  expect(stoppingDistance(v,m,retro)).toBeCloseTo(stop,6);
  const arrived=advanceFlight(state,m,-retro,stopTime);
  expect(Math.abs(arrived.velocityMS)).toBeLessThan(1e-9);expect(arrived.positionM).toBeCloseTo(x+stop,6);
});
it("M03 coasting fuel-mass change preserves velocity and covers distance without free acceleration",()=>{
 const a={positionM:100,velocityMS:2500};
 const first=advanceFlight(a,500000,0,7),second=advanceFlight(first,400000,0,9);
 expect(second.velocityMS).toBe(2500);expect(second.positionM).toBe(40100);
});
it("M01 flight domain refuses nonfinite/c-prime speeds, invalid mass/time and impossible stopping oracle",()=>{
 for(const args of [[0,0,1],[-1,2,1],[100,Infinity,1],[100,1,-1]] as const)expect(()=>advanceFlight({positionM:0,velocityMS:0},args[0],args[1],args[2])).toThrow();
 for(const v of [3000,-3000,NaN])expect(()=>advanceFlight({positionM:0,velocityMS:v},100,1,1)).toThrow();
 expect(()=>stoppingDistance(100,100,0)).toThrow();
});
for(const role of ["march","retro"] as const)it(`M03 actual ${role} impulse consumes its fuel and contributes heat only through shared stepV2`,()=>{
 const s=makeMiningRun(getPresetFit("pony:1","ship-fitting-0.2.2"),loadCandidateCatalog("ship-fitting-0.2.2"),{durationSeconds:10,stepSeconds:.1});if(!s.ok)throw Error(JSON.stringify(s));
 const start=initialStateV2(s.value),step=stepV2(s.value,start,.1,{[role]:1});
 const i=s.value.resolvedShip.instances.find(i=>i.role===role)!;
 const force=step.telemetry["forceN:"+i.id];expect(force).toBeGreaterThan(0);
 expect(step.state.consumptionKg["diesel:propulsion:"+i.id]).toBeGreaterThan(0);expect(step.telemetry.propulsionHostW).toBeGreaterThan(0);
 expect(start.fuelKg.diesel-step.state.fuelKg.diesel).toBeCloseTo(Object.entries(step.state.consumptionKg).filter(([key])=>key.startsWith("diesel:")).reduce((n,[,v])=>n+v,0),8);
 const oldV=role==="retro"?100:0;
 const move=advanceFlight({positionM:0,velocityMS:oldV},step.state.currentMassKg,role==="retro"?-force:force,.1);
 expect(role==="retro"?move.velocityMS<oldV:move.velocityMS>oldV).toBe(true);
});
for(const role of ['march','retro'] as const)it(`M03 electric ${role} competes for actual bus energy and sends host heat without chemical propulsion draw`,()=>{
 const c=loadCandidateCatalog(),f=getPresetFit('civilian-M:1');const s=makeMiningRun(f,c,{durationSeconds:1,stepSeconds:.1});if(!s.ok)throw Error(JSON.stringify(s));
 const start=initialStateV2(s.value),step=stepV2(s.value,start,.1,{[role]:1}),engine=s.value.resolvedShip.instances.find(i=>i.role===role)!;
 expect(step.telemetry['forceN:'+engine.id]).toBeGreaterThan(0);expect(step.telemetry['deliveredW:'+engine.id]).toBeGreaterThan(0);expect(step.telemetry.loadHostW).toBeGreaterThan(0);expect(step.state.chargeJ).toBeLessThan(start.chargeJ);expect(Object.keys(step.state.consumptionKg).some(k=>k.includes(':propulsion:'))).toBe(false);
});
