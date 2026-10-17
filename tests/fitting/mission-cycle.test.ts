import { it, expect } from "vitest";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMissionRun } from "../../src/scenarios/mission";
import { createRun, runChunk, result } from "../../src/runner/run";
const catalog=loadCandidateCatalog("ship-fitting-0.2.2");
function run(conditions:Parameters<typeof makeMissionRun>[2]={},count=1){
 // Исторические миссии этих контролей: топливо станции без зарядки батареи.
 const s=makeMissionRun(getPresetFit(`pony:${count}`,catalog.version),catalog,{stationReplenish:undefined,durationSeconds:300,stepSeconds:.1,approachSeconds:0,serviceSeconds:2,distanceM:0,targetM3:.02,repeat:false,...conditions});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun("mission",s.value);while(!r.done)runChunk(r,1000);return result(r);
}
it("M02/M05 event mining lasts actual selected power, stops at small delivery target, service commits only at endpoint",()=>{
 const a=run(),b=run({},2),c=run({},3);
 for(const r of [a,b,c]){
  expect(r.state.mission!.stage).toBe("done");expect(r.state.mission!.deliveredM3).toBeCloseTo(.02,7);expect(r.state.cargo).toBe(0);
  expect(r.state.usefulWork).toBeCloseTo(r.state.mission!.deliveredM3+r.state.cargo,9);
  expect(r.state.mission!.elapsed.service).toBeCloseTo(2,8);expect(r.state.mission!.elapsed.flight).toBe(0);
  expect(r.state.timeSeconds).toBeLessThan(r.spec.durationSeconds);expect(r.state.mission!.receivedFuelKg.diesel).toBeGreaterThan(0);
 }
 expect(a.state.mission!.elapsed.mining/b.state.mission!.elapsed.mining).toBeCloseTo(2,5);expect(a.state.mission!.elapsed.mining/c.state.mission!.elapsed.mining).toBeCloseTo(3,5);
});
it("M04 horizon during station service retains ore, does not refuel/unload early",()=>{
 const r=run({durationSeconds:1,serviceSeconds:10,targetM3:.001});
 expect(r.state.mission!.stage).toBe("service");expect(r.state.mission!.deliveredM3).toBe(0);expect(r.state.cargo).toBeCloseTo(.001,8);expect(r.state.mission!.receivedFuelKg.diesel).toBe(0);
});
it("M03/04 physical short triangular and capped cruise use actual empty/loaded mass and real retro before arrivals",()=>{
 for(const cap of [null,5]){
  const r=run({distanceM:100,cruiseSpeedMS:cap,durationSeconds:300,targetM3:.01});
  expect(r.state.mission!.stage).toBe("done");expect(r.state.mission!.positionM).toBe(100);expect(r.state.mission!.velocityMS).toBe(0);
  expect(r.state.mission!.peakVelocityMS).toBeGreaterThan(0);if(cap!==null)expect(r.state.mission!.peakVelocityMS).toBeLessThanOrEqual(cap+1e-5);
  expect(r.state.mission!.inboundMassKg).not.toBe(r.state.mission!.outboundMassKg);
  expect(r.metrics.fuelPurposeKg['diesel:propulsion']).toBeGreaterThan(0);expect(r.metrics.sourceEnergyJ).toBeGreaterThan(0);
  expect(r.events.filter(e=>e.kind==='mission-arrival')).toHaveLength(2);
 }
});
it("M04 empty tank does not teleport or unload; first constraint explains blocked propulsion before mining",()=>{
 const f=getPresetFit("pony:1",catalog.version);f.initial.fuelFraction.diesel=0;
 const s=makeMissionRun(f,catalog,{durationSeconds:30,stepSeconds:.1,distanceM:100,repeat:false});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun('empty',s.value);while(!r.done)runChunk(r,100);const m=r.state.mission!;
 expect(m.deliveredM3).toBe(0);expect(m.positionM).toBe(0);expect(m.receivedFuelKg.diesel).toBe(0);expect(m.stage).toBe('stranded');expect(m.firstLimiter?.causes).toContain('resource');
});
it("M05 repeat two complete voyages balances received/consumed/remaining and carries temperature/charge",()=>{
 const r=run({repeat:true,targetM3:.025,durationSeconds:50,serviceSeconds:1});const m=r.state.mission!;
 expect(m.deliveredM3).toBeCloseTo(.025,7);expect(r.state.usefulWork).toBeCloseTo(m.deliveredM3+r.state.cargo,8);
 for(const sp of ['diesel','hydrogen'])expect(r.spec.initial.fuelKg[sp]+m.receivedFuelKg[sp]-r.metrics.fuelSpeciesKg[sp]).toBeCloseTo(r.state.fuelKg[sp],7);
 expect(r.state.temperatureK).not.toBe(300);expect(r.state.chargeJ).not.toBe(r.spec.initial.chargeJ);
});
it("M01 refuses absent group/ore hold and nonfinite or superluminal mission fields before creating a run",()=>{
 const f=getPresetFit('pony:1',catalog.version);
 for(const x of [{distanceM:-1},{distanceM:Infinity},{cruiseSpeedMS:3000},{cruiseSpeedMS:0},{stepSeconds:0},{approachSeconds:-1},{serviceSeconds:-1},{targetM3:0},{selectedWorkGroup:[]}])expect(makeMissionRun(f,catalog,x).ok).toBe(false);
});
it("M02 first-stop exits a wholly stopped hot group; full-hold waits for real cooling and resumes",()=>{
 const f=getPresetFit('pony:1',catalog.version);f.instances[f.assignments['signature-1']].itemId='radiator-passive-S';
 const rows=[];
 for(const stopPolicy of ['first-stop','full-hold'] as const){
  const s=makeMissionRun(f,catalog,{durationSeconds:3600,stepSeconds:1,temperatureK:600,distanceM:0,approachSeconds:0,serviceSeconds:0,targetM3:.01,repeat:false,stopPolicy});if(!s.ok)throw Error(JSON.stringify(s));
  const r=createRun(stopPolicy,s.value);while(!r.done)runChunk(r,1000);rows.push(result(r));
 }
 expect(rows[0].state.usefulWork).toBe(0);expect(rows[0].state.mission!.elapsed.mining).toBe(0);
 expect(rows[1].state.mission!.elapsed.recovery).toBeGreaterThan(0);expect(rows[1].state.mission!.deliveredM3).toBeCloseTo(.01,7);
 expect(rows[1].state.temperatureK).toBeLessThan(600);
});
it("M02 first-stop continues partial power throttling of the group",()=>{
 const f=getPresetFit('pony:2',catalog.version);f.initial.chargeFraction=0;f.instances[f.assignments['signature-1']].itemId='radiator-passive-S';
 const s=makeMissionRun(f,catalog,{durationSeconds:100,stepSeconds:.1,distanceM:0,approachSeconds:0,serviceSeconds:0,targetM3:.01,repeat:false,stopPolicy:'first-stop'});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun('partial-loss',s.value);while(!r.done)runChunk(r,1000);
 expect(r.metrics.partialLossM3).toBeGreaterThan(0);expect(r.state.mission!.deliveredM3).toBeCloseTo(.01,7);expect(r.state.mission!.elapsed.mining).toBeGreaterThan(.01/r.metrics.ratedSelectedM3S);
});

it("M03/M04 partial thermal propulsion limiter is heat rather than invented fuel shortage",()=>{
 const f=getPresetFit('pony:1',catalog.version),g=catalog.items['engine-diesel-S-single'].gate;
 const s=makeMissionRun(f,catalog,{durationSeconds:2,stepSeconds:.1,distanceM:1000,temperatureK:(g.workHigh+g.high)/2});if(!s.ok)throw Error(JSON.stringify(s));
 const r=createRun('warm-drive',s.value);while(!r.done)runChunk(r,100);
 expect(r.state.mission!.firstLimiter?.causes).toContain('thermal');expect(r.state.fuelKg.diesel).toBeGreaterThan(0);expect(r.state.mission!.firstLimiter?.causes).not.toContain('resource');expect(r.state.mission!.deliveredM3).toBe(0);
});
for(const [durationSeconds,stage] of [[.05,'outbound'],[3.98,'approach'],[4.2,'mining'],[5.2,'inbound'],[9.1,'service']] as const)it(`M04/M05 horizon in ${stage} retains actual position/ore/fuel without station commit`,()=>{
 const r=run({durationSeconds,distanceM:100,approachSeconds:.2,serviceSeconds:.2,targetM3:.03},2),m=r.state.mission!;
 expect(r.state.timeSeconds).toBe(durationSeconds);expect(m.stage).toBe(stage);expect(m.deliveredM3).toBe(0);expect(m.receivedFuelKg.diesel).toBe(0);expect(r.state.cargo).toBeCloseTo(r.state.usefulWork,8);expect(m.elapsed.flight+m.elapsed.approach+m.elapsed.mining+m.elapsed.service).toBeCloseTo(durationSeconds,8);
 if(stage==='service'){expect(m.positionM).toBe(100);expect(m.velocityMS).toBe(0);expect(r.state.cargo).toBeCloseTo(.03,7);}
});
