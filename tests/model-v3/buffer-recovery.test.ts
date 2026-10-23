import {expect,it} from 'vitest';
import {stepV3} from '../../src/model/v3/step';
import {runtimeFixture,install} from './runtime-fixture';
import {stealthRecoveryFixture,civilianRecoveryFixture} from './buffer-recovery-fixture';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {parseShipModelResultJson} from '../../src/io/ship-model-result';
import {createHash} from 'node:crypto';

for(const action of ['work','maneuver','idle','recovery'] as const)it(`ST1-01 recovery through actual cooling ignores capture marker during ${action}`,()=>{
  const s=runtimeFixture(400),b=install(s,'buffer-S');install(s,'radiator-active-S');
  s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};
  s.environment.directHeat=[{sourceId:'hotel',powerW:200e3}];
  const r=stepV3(s,s.initialState,{},action);
  expect(r.telemetry.bufferReleaseW).toBeGreaterThan(0);
  expect(r.telemetry.bufferReleaseW).toBeLessThanOrEqual(r.telemetry.radiationW+r.telemetry.fieldW-r.telemetry.hostHeatW-200e3+1e-6);
  expect(r.state.temperatureK).toBeLessThanOrEqual(400+1e-9);
  expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
});
it('ST1-01/02/08 real StealthS fixture fills, recovers through paid external paths, then fills a second finite window',()=>{
  const s=stealthRecoveryFixture(),id='builtin:buffer';let state=s.initialState,energy=0,peakT=300,maxHeadroomExcess=0,noHeadroomTicks=0,firstRelease:unknown=null;
  const tick=()=>{const r=stepV3(s,state,{},'idle');state=r.state;energy+=r.telemetry.totalResidualJ;peakT=Math.max(peakT,state.temperatureK);return r;};
  while(state.buffers[id].storedJ<0.4e9&&state.timeSeconds<3600)tick();
  expect(state.buffers[id].storedJ).toBe(0.4e9);const filledAt=state.timeSeconds;
  state.mode='Efficient';state.maskingEntryTemperatureK=null;
  while(state.buffers[id].storedJ>0&&state.timeSeconds<24000){
    const before=structuredClone(state),r=tick();
    if(r.telemetry.bufferReleaseW>0&&firstRelease===null)firstRelease={timeSeconds:before.timeSeconds,temperatureK:before.temperatureK,nextTemperatureK:state.temperatureK,hostHeatW:r.telemetry.hostHeatW,radiationW:r.telemetry.radiationW,releaseW:r.telemetry.bufferReleaseW,netHeatW:r.telemetry.netHeatW};
    if(r.telemetry.bufferReleaseW>0)maxHeadroomExcess=Math.max(maxHeadroomExcess,r.telemetry.bufferReleaseW-(r.telemetry.radiationW+r.telemetry.fieldW+r.telemetry.h2CoolingW+r.telemetry.tiCoolingW-r.telemetry.hostHeatW));
    else if(r.telemetry.radiationW+r.telemetry.fieldW+r.telemetry.tiCoolingW+r.telemetry.h2CoolingW-r.telemetry.hostHeatW<=0){noHeadroomTicks++;const empty=structuredClone(before);empty.buffers[id]={storedJ:0,minimumCaptureK:null};const control=stepV3(s,empty,{},'idle');expect(r.state.temperatureK).toBe(control.state.temperatureK);}
  }
  expect(state.buffers[id].storedJ).toBe(0);expect(state.buffers[id].minimumCaptureK).toBeNull();expect(peakT).toBeLessThanOrEqual(450);
  expect(maxHeadroomExcess).toBeLessThan(1e-6);expect(noHeadroomTicks).toBeGreaterThan(0);
  const recoveredAt=state.timeSeconds,entryK=state.temperatureK;state.mode='Masking';state.maskingEntryTemperatureK=entryK;
  expect(tick().telemetry.bufferCaptureW).toBeGreaterThan(0);
  while(state.buffers[id].storedJ<0.4e9&&state.timeSeconds<30000)tick();
  expect(state.buffers[id].storedJ).toBe(0.4e9);expect(state.timeSeconds-recoveredAt).toBeGreaterThan(1);expect(Math.abs(energy)).toBeLessThan(1);
  console.log('WI1_STEALTH',JSON.stringify({fixture:'StealthS WI1',specSha256:createHash('sha256').update(JSON.stringify(s)).digest('hex'),hullId:s.resolvedShip.hull.id,presetId:'stealth-reference',catalogVersion:s.catalogVersion,fitRevision:s.resolvedShip.fit.fitRevision,heatCapacityJK:s.resolvedShip.heatCapacityJK,filledAt,recoverySeconds:recoveredAt-filledAt,recoveredAt,firstRelease,peakT,repeatEntryK:entryK,repeatWindowSeconds:state.timeSeconds-recoveredAt,noHeadroomTicks,maxHeadroomExcess,energyResidualJ:energy}));
},30000);
it('ST1-03 Civilian Sputnik with buffer-S captures work heat and fully recovers',()=>{
  const s=civilianRecoveryFixture(),id='fit:signature-1';expect(s.resolvedShip.hull.class).toBe('Civilian');
  let state=s.initialState,energy=0;for(let n=0;n<30;n++){const r=stepV3(s,state,{'fit:payload-1':1},'work');state=r.state;energy+=r.telemetry.totalResidualJ;}
  expect(state.buffers[id].storedJ).toBeGreaterThan(0);const workDebt=state.buffers[id].storedJ;
  while(state.buffers[id].storedJ>0&&state.timeSeconds<18000){const r=stepV3(s,state,{},'idle');state=r.state;energy+=r.telemetry.totalResidualJ;}
  expect(state.buffers[id].storedJ).toBe(0);expect(Math.abs(energy)).toBeLessThan(1);
  console.log('WI1_CIVILIAN',JSON.stringify({hullId:s.resolvedShip.hull.id,presetId:'sputnik-d',catalogVersion:s.catalogVersion,fitRevision:s.resolvedShip.fit.fitRevision,workDebt,recoverySeconds:state.timeSeconds-30,temperatureK:state.temperatureK,energyResidualJ:energy}));
},10000);
it('recovery save/reopen retains partial debt literally and resumes identically',()=>{
  const s=civilianRecoveryFixture();s.initialState.temperatureK=400;s.initialState.buffers['fit:signature-1']={storedJ:1e9,minimumCaptureK:300};
  s.origins['initialState.buffers.fit:signature-1.minimumCaptureK']={kind:'experimental',unit:'K',sourceRef:'WI1 checkpoint test'};s.scenario.phases[0].requests={};s.durationSeconds=4;
  const run=createShipModelRun('wi1-checkpoint',s);runShipModelChunk(run,2);const saved=serializeResultSnapshot(shipModelResult(run,'paused')),parsed=parseShipModelResultJson(saved);expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)return;
  const restored=restoreShipModelRun(parsed.value);expect(serializeResultSnapshot(shipModelResult(restored,'paused'))).toBe(saved);expect(restored.state.buffers['fit:signature-1'].storedJ).toBeGreaterThan(0);
  runShipModelChunk(run,2);runShipModelChunk(restored,2);expect(serializeResultSnapshot(shipModelResult(restored))).toBe(serializeResultSnapshot(shipModelResult(run)));
});
it('ST1-10 no external headroom retains debt and follows the debt-free temperature trajectory',()=>{
  const s=runtimeFixture(300),b=install(s,'buffer-S');install(s,'radiator-active-S');
  s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};s.environment.directHeat=[{sourceId:'hotel',powerW:200e3}];
  const control=structuredClone(s.initialState);control.buffers[b.id]={storedJ:0,minimumCaptureK:null};
  const r=stepV3(s,s.initialState,{},'recovery'),empty=stepV3(s,control,{},'recovery');
  expect(r.telemetry.bufferReleaseW).toBe(0);expect(r.state.buffers[b.id]).toEqual(s.initialState.buffers[b.id]);
  expect(r.state.temperatureK).toBe(empty.state.temperatureK);
  expect((r.state.temperatureK-300)*20e6+r.state.buffers[b.id].storedJ-1e6).toBeCloseTo(200e3-r.telemetry.radiationW-r.telemetry.fieldW,4);
});
it('ST1-04 partial debt still absorbs a new hot peak during a recovery action',()=>{
  const s=runtimeFixture(495),b=install(s,'buffer-S');s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};
  s.environment.directHeat=[{sourceId:'peak',powerW:1e6}];const r=stepV3(s,s.initialState,{},'recovery');
  expect(r.telemetry.bufferCaptureW).toBeGreaterThan(0);expect(r.telemetry.bufferReleaseW).toBe(0);
});
it('ST1-07 shell closes only in Masking and opens on the next physical step',()=>{
  const s=runtimeFixture(400);install(s,'shell-S');s.resolvedShip.hull.bodyExchangeAreaM2=120;
  const a=stepV3(s,s.initialState,{});const masked=structuredClone(s.initialState);masked.mode='Masking';masked.maskingEntryTemperatureK=400;
  const b=stepV3(s,masked,{});expect(a.frames[0].body.emittedIrW).toBeCloseTo(2*b.frames[0].body.emittedIrW,8);
  b.state.mode='Efficient';b.state.maskingEntryTemperatureK=null;const reopened=stepV3(s,b.state,{});
  expect(reopened.frames[0].body.emittedIrW).toBeGreaterThan(1.99*b.frames[0].body.emittedIrW);
});
it('pump power shortage and an in-step empty battery bound release by the actually powered surface',()=>{
  for(const chargeJ of [0,10000]){
    const s=runtimeFixture(400),b=install(s,'buffer-S');install(s,'radiator-active-S');s.initialState.chargeJ=chargeJ;
    s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};s.environment.directHeat=[{sourceId:'hotel',powerW:200e3}];
    s.environment.energyInputs=chargeJ===0?[{sourceId:'limited-power',representation:'electric',powerW:100e3}]:[];
    const r=stepV3(s,s.initialState,{},'idle');expect(r.telemetry.deliveredW).toBeLessThan(r.telemetry.requestedW);
    const paidHeadroomJ=r.frames.reduce((sum,f)=>sum+f.durationSeconds*Math.max(0,f.body.totalW+f.surfaces.totalW-f.em.hostHeatW-200e3),0);
    expect(r.telemetry.bufferReleaseW).toBeLessThanOrEqual(paidHeadroomJ+1e-6);expect(r.telemetry.bufferReleaseW).toBeGreaterThan(0);
    expect(r.state.buffers[b.id].storedJ).toBeGreaterThan(0);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
    if(chargeJ>0){expect(r.frames.length).toBeGreaterThan(1);expect(r.frames.at(-1)!.surfaces.areaM2).toBe(0);}
  }
});
it('multiple buffers share one external headroom budget without simultaneous capture/release',()=>{
  const s=runtimeFixture(400);install(s,'radiator-active-S');for(const id of ['a','b']){install(s,'buffer-S',id);s.initialState.buffers[id]={storedJ:1e6,minimumCaptureK:300};}
  s.environment.directHeat=[{sourceId:'hotel',powerW:200e3}];const r=stepV3(s,s.initialState,{});
  expect(r.telemetry.bufferCaptureW).toBe(0);expect(r.telemetry.bufferReleaseW).toBeGreaterThan(0);
  expect(r.telemetry.bufferReleaseW).toBeLessThanOrEqual(r.telemetry.radiationW-r.telemetry.hostHeatW-200e3+1e-6);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
});
it('cold warmup retains the capture rule, while hot field and missing export retain debt with a cause',()=>{
  for(const marker of [220,240]){
    const s=runtimeFixture(230),b=install(s,'buffer-S');s.resolvedShip.hull.bodyExchangeAreaM2=1;s.environment.radiativeBackgroundK=100;s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:marker};
    for(const i of s.resolvedShip.instances)if(i.item.thermalRole==='ordinary')i.item.gate.workLow=250;
    const r=stepV3(s,s.initialState,{});expect(r.telemetry.bufferReleaseW>0).toBe(marker===240);expect(r.telemetry.bufferCaptureW).toBe(0);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
  }
  for(const hot of [false,true]){
    const s=runtimeFixture(400),b=install(s,'buffer-S');s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};
    if(hot){s.resolvedShip.hull.bodyExchangeAreaM2=120;s.environment.thermalField={sourceId:'hot',temperatureK:650,coefficientWPerM2K:10};install(s,'radiator-active-S');}
    const r=stepV3(s,s.initialState,{});expect(r.state.buffers[b.id]).toEqual(s.initialState.buffers[b.id]);expect(r.telemetry.bufferReleaseW).toBe(0);expect(r.diagnostics.some(d=>d.reason==='no-cooling-headroom')).toBe(true);
  }
});
it('partial-debt Masking reentry preserves debt and the minimum capture marker',()=>{
  const s=runtimeFixture(400),b=install(s,'buffer-S');s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=400;s.initialState.buffers[b.id]={storedJ:1e6,minimumCaptureK:300};s.environment.directHeat=[{sourceId:'repeat',powerW:1e6}];
  const r=stepV3(s,s.initialState,{});expect(r.state.buffers[b.id].storedJ).toBeGreaterThan(1e6);expect(r.state.buffers[b.id].minimumCaptureK).toBe(300);expect(r.telemetry.bufferReleaseW).toBe(0);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
});
