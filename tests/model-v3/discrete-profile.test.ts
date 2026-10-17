import { expect, it } from "vitest";
import vectors from "../../docs/verification/ship-model-v0.1-vectors.json";
import { allocateCascade, referenceCooling } from "../../src/model/v3/thermal-control";
const cp=(id:string)=>vectors.controlProfile.find(x=>x.id===id) as any;
it("CP-01 production allocation requests 1.2 MW to reach setpoint in one second, not the continuous 2 MW peak",()=>{
  const v=cp("CP-01").inputs,r=allocateCascade({temperatureK:v.temperatureK,heatCapacityJK:v.heatCapacityJK,netHeatW:v.netHostHeatW,durationSeconds:v.stepSeconds,direction:"cooling",stages:[{id:"active-radiator",setpointK:v.setpointK,maximumW:v.availableCoolingW}]});
  expect(r.requests["active-radiator"]).toBeCloseTo(1200000,4);expect(r.regulatingStageId).toBe("active-radiator");
  expect(v.temperatureK+(v.netHostHeatW-r.requests["active-radiator"])/v.heatCapacityJK).toBeCloseTo(v.setpointK,12);
  expect(referenceCooling(v.temperatureK,v.setpointK,v.netHostHeatW,v.availableCoolingW)).toBe(2e6);
});
it("CP-02 reserve activation uses the next boundary, never a predicted crossing within the second",()=>{
  const v=cp("CP-02").inputs,stages=[{id:"earlier",setpointK:v.earlierStage.setpointK,maximumW:v.earlierStage.availableCoolingW},{id:"reserve",setpointK:v.reserveStage.setpointK,maximumW:v.reserveStage.availableCoolingW}];
  const a=allocateCascade({temperatureK:v.temperatureK,heatCapacityJK:v.heatCapacityJK,netHeatW:v.netHostHeatW,durationSeconds:1,direction:"cooling",stages});
  expect(a.requests).toEqual({earlier:1e6,reserve:0});const next=v.temperatureK+(v.netHostHeatW-1e6)/v.heatCapacityJK;expect(next).toBeCloseTo(480.04,12);
  const b=allocateCascade({temperatureK:next,heatCapacityJK:v.heatCapacityJK,netHeatW:v.netHostHeatW,durationSeconds:1,direction:"cooling",stages});
  expect(b.requests.earlier).toBe(1e6);expect(b.requests.reserve).toBeCloseTo(1.8e6,4);
});
it("CP-03 equal setpoints: earlier pump at maximum, exactly one buffer-release regulator",()=>{
  const v=cp("CP-03").inputs,r=allocateCascade({temperatureK:v.temperatureK,heatCapacityJK:v.heatCapacityJK,netHeatW:v.netHostHeatW,durationSeconds:1,direction:"cooling",stages:[{id:"pump",setpointK:v.pump.setpointK,maximumW:v.pump.availableCoolingW},{id:"buffer-release",setpointK:v.buffer.setpointK,maximumW:v.buffer.availableReleaseW,heatSource:true}]});
  expect(r.requests).toEqual({pump:2e6,"buffer-release":1e6});expect(r.regulatingStageId).toBe("buffer-release");
});
