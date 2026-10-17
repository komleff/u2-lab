import {expect,it} from 'vitest';
import {stepV3} from '../../src/model/v3/step';
import {observeShipModelStep,controlTargetView,accumulateShipModelFrames,createShipSignatureStatistics} from '../../src/signatures/ship-model';
import {runtimeFixture,install} from '../model-v3/runtime-fixture';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {fixture,signatureDepletionFixture} from '../model-v3/fixture';

it('cold body keeps signed contrast and persisted receiver profile, excluding contact-field watts',()=>{
  const s=runtimeFixture(300);s.resolvedShip.hull.bodyExchangeAreaM2=10;s.environment.radiativeBackgroundK=400;s.environment.thermalField={sourceId:'hot',temperatureK:500,coefficientWPerM2K:100};
  const r=stepV3(s,s.initialState,{}),before=structuredClone(r);
  const positive=observeShipModelStep({...s,receiverProfile:'positive-only'},r),absolute=observeShipModelStep({...s,receiverProfile:'absolute-contrast'},r);
  expect(positive.contrastIrW).toBeLessThan(0);expect(positive.receiverIrW).toBe(0);expect(absolute.receiverIrW).toBe(-positive.contrastIrW);
  expect(positive.contrastIrW).toBe(r.telemetry.radiationW);expect(positive.contrastIrW).not.toBe(r.telemetry.radiationW+r.telemetry.fieldW);expect(r).toEqual(before);
});
it('mixed hot-side radiator profiles keep intrinsic watts and individual bow/stern projections',()=>{
  const s=runtimeFixture(450);const radiator=install(s,'radiator-active-S');s.resolvedShip.surfaces[0].active=false;s.resolvedShip.surfaces[0].irProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:0.7};
  const row=structuredClone(s.resolvedShip.surfaces[0]);row.id='second';row.irProfile={version:'radiator-ir/1',kind:'omnidirectional',aftFraction:0};s.resolvedShip.surfaces.push(row);s.initialState.surfaceOpen.second=true;
  const step=stepV3(s,s.initialState,{}),bow=observeShipModelStep({...s,observer:{...s.observer,aspectDeg:0}},step),stern=observeShipModelStep({...s,observer:{...s.observer,aspectDeg:180}},step);
  expect(bow.intrinsicIrW).toBe(stern.intrinsicIrW);expect(stern.contrastIrW).toBeGreaterThan(bow.contrastIrW);expect(bow.paths.filter(p=>p.kind==='radiator')).toHaveLength(2);expect(radiator.enabled).toBe(true);
});
it('actual electric engine IR is exported once before EM coupling and the production energy ledger closes',()=>{
  const s=runtimeFixture(400),engine=install(s,'engine-electric-S-single');engine.item.gate.workHigh=500;
  const r=stepV3(s,s.initialState,{[engine.id]:1}),signal=observeShipModelStep(s,r);
  const expected=r.telemetry['actualW:'+engine.id]*engine.item.numerics.pathEfficiency*(1-engine.item.numerics.efficiency)*0.001;
  expect(signal.paths.find(p=>p.id===engine.id)?.absoluteIrW).toBeCloseTo(expected,8);expect(r.telemetry.engineIrExportW).toBeCloseTo(expected,8);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);
});
it('chemical exhaust IR uses actual spent fuel; unpowered/stopped engines emit no requested plume',()=>{
  const s=runtimeFixture(400),engine=install(s,'engine-diesel-S-single');s.resolvedShip.resources.diesel.capacityKg=10;s.initialState.fuelKg.diesel=10;
  const run=stepV3(s,s.initialState,{[engine.id]:0.5}),signal=observeShipModelStep(s,run);expect(signal.paths.find(p=>p.id===engine.id)!.absoluteIrW).toBeGreaterThan(0);
  const off=observeShipModelStep(s,stepV3(s,s.initialState,{}));expect(off.paths.find(p=>p.id===engine.id)?.absoluteIrW??0).toBe(0);expect(run.telemetry.totalResidualJ).toBeCloseTo(0,5);
});
it('shielding consumes real power, lowers escaped EM, retains host heat and weakens a powered own receiver',()=>{
  const s=runtimeFixture(400),sensor=install(s,'sensor-S'),shield=install(s,'shielding-S');sensor.item.numerics.powerW=100000;shield.item.numerics.powerW=1000;shield.item.numerics.antennaTransmission=0.8;
  shield.enabled=false;const off=stepV3(s,s.initialState,{}),a=observeShipModelStep(s,off);shield.enabled=true;const on=stepV3(s,s.initialState,{}),b=observeShipModelStep(s,on);
  expect(b.escapedEmW).toBeLessThan(a.escapedEmW);expect(on.telemetry.hostHeatW).toBeGreaterThan(off.telemetry.hostHeatW);expect(b.capturedEmW).toBeGreaterThan(0);
  expect(b.escapedEmW).toBe(on.telemetry.escapedEmW);expect(b.rawEmW).toBe(on.telemetry.rawEmW);
  const target={irW:1e6,emW:20};expect(b.ownAntennaTransmission).toBe(0.8);expect(controlTargetView(s,b,target).emFluxWm2).toBeLessThan(controlTargetView(s,a,target).emFluxWm2);
  s.initialState.chargeJ=0;expect(controlTargetView(s,observeShipModelStep(s,stepV3(s,s.initialState,{})),target).emFluxWm2).toBe(0);
});
it('same engine command has ordinary limits in Masking without auto-opening radiators',()=>{
  const s=runtimeFixture(450),engine=install(s,'engine-electric-S-single');install(s,'buffer-S');install(s,'radiator-active-S');
  const requests={[engine.id]:0.8};const a=stepV3(s,s.initialState,requests);s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=450;const b=stepV3(s,s.initialState,requests);
  expect(b.telemetry['actualW:'+engine.id]).toBe(a.telemetry['actualW:'+engine.id]);expect(b.state.mode).toBe('Masking');expect(Object.values(b.state.surfaceOpen).every(v=>!v)).toBe(true);expect(b.telemetry.bufferCaptureW).toBeGreaterThan(0);
  expect(observeShipModelStep(s,b).intrinsicIrW).toBeLessThan(observeShipModelStep(s,a).intrinsicIrW);
});
it('measured signals and frozen outward paths restore literally, then resume without recomputing history',()=>{
  const s=fixture('sputnik');s.durationSeconds=2;s.scenario.phases[0].durationSeconds=2;
  const full=createShipModelRun('signals',s);runShipModelChunk(full,2);const split=createShipModelRun('signals',s);runShipModelChunk(split,1);
  const saved=shipModelResult(split,'paused');expect(saved.signatures.version).toBe('ship-signatures/2');expect(saved.signatures.last!.paths.length).toBeGreaterThan(0);
  const restored=restoreShipModelRun(saved);expect(shipModelResult(restored,'paused')).toEqual(saved);runShipModelChunk(restored,1);expect(shipModelResult(restored)).toEqual(shipModelResult(full));
});
it('H2 allocated gas budget stays isotropic and distinct from signed surface radiation',()=>{
  const s=runtimeFixture(500),cooler=install(s,'h2-cooler-S');for(const i of s.resolvedShip.instances)if(i.item.family==='battery')i.item.gate.workHigh=500;
  s.resolvedShip.resources.hydrogen.capacityKg=10;s.initialState.fuelKg.hydrogen=10;s.environment.directHeat=[{sourceId:'heat',powerW:1e6}];
  const step=stepV3(s,s.initialState,{}),bow=observeShipModelStep(s,step),stern=observeShipModelStep({...s,observer:{...s.observer,aspectDeg:180}},step);
  const path=bow.paths.find(p=>p.id===cooler.id)!;expect(path.absoluteIrW).toBeGreaterThan(0);expect(path.profile.kind).toBe('omnidirectional');expect(bow.contrastIrW).toBe(stern.contrastIrW);
});
it('I4 fresh boundary has nullable empty statistics, while a measured zero remains numeric zero',()=>{
  const spec=fixture();spec.durationSeconds=1;spec.initialState.chargeJ=0;spec.initialState.temperatureK=300;spec.environment.radiativeBackgroundK=300;spec.scenario.phases[0].action='idle';spec.scenario.phases[0].requests={};
  const run=createShipModelRun('zero-signals',spec),empty=(run.signatures as any).statistics;
  expect(run.signatures.version).toBe('ship-signatures/2');expect(empty).toEqual({durationSeconds:0,completedThroughSeconds:0,receiverIrW:{integralJ:0,meanW:null,minW:null,maxW:null},observedEmW:{integralJ:0,meanW:null,minW:null,maxW:null}});
  runShipModelChunk(run,1);expect((run.signatures as any).statistics).toEqual({durationSeconds:1,completedThroughSeconds:1,receiverIrW:{integralJ:0,meanW:0,minW:0,maxW:0},observedEmW:{integralJ:0,meanW:0,minW:0,maxW:0}});
});
it('I4 accumulator reads frozen production intervals and refuses replay of a completed boundary',()=>{
  const spec=signatureDepletionFixture(),step=stepV3(spec,spec.initialState,spec.scenario.phases[0].requests,'maneuver');
  const freeze=(value:any)=>{if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}};freeze(step);
  const empty={durationSeconds:0,completedThroughSeconds:0,receiverIrW:{integralJ:0,meanW:null,minW:null,maxW:null},observedEmW:{integralJ:0,meanW:null,minW:null,maxW:null}},before=structuredClone(empty);
  const completed=accumulateShipModelFrames(spec,empty,step);expect(empty).toEqual(before);expect(completed.completedThroughSeconds).toBe(1);expect(()=>accumulateShipModelFrames(spec,completed,step)).toThrow(/boundary|границ/);
});
it.each([0,180])('I4 frame statistics use individual mixed IR profiles at observer aspect %s',aspectDeg=>{
  const spec=runtimeFixture(450);spec.observer.aspectDeg=aspectDeg;install(spec,'radiator-active-S');const engine=install(spec,'engine-electric-S-single');engine.item.gate.workHigh=500;
  spec.resolvedShip.surfaces[0].active=false;spec.resolvedShip.surfaces[0].irProfile={version:'radiator-ir/1',kind:'aft-directed',aftFraction:0.7};const second=structuredClone(spec.resolvedShip.surfaces[0]);second.id='second';second.irProfile={version:'radiator-ir/1',kind:'omnidirectional',aftFraction:0};spec.resolvedShip.surfaces.push(second);spec.initialState.surfaceOpen.second=true;
  const step=stepV3(spec,spec.initialState,{[engine.id]:0.8}),lambert=aspectDeg===180?Math.PI:0;
  const watts=step.frames.map(frame=>Math.max(0,frame.body.radiationW+frame.surfaces.rows.reduce((sum,row)=>sum+row.radiationW*(1-row.irProfile.aftFraction+row.irProfile.aftFraction*lambert),0)+frame.outwardIr.reduce((sum,row)=>sum+row.contrastW*(row.profile==='aft-directed'?lambert:1),0)));
  const stats=accumulateShipModelFrames(spec,createShipSignatureStatistics(0),step);expect(stats.receiverIrW.minW).toBe(Math.min(...watts));expect(stats.receiverIrW.maxW).toBe(Math.max(...watts));expect(stats.receiverIrW.integralJ).toBe(watts.reduce((sum,value,index)=>sum+value*step.frames[index].durationSeconds,0));
});
it.each(['positive-only','absolute-contrast'] as const)('I4 frame clipping preserves signed cold contrast for %s',receiverProfile=>{
  const spec=runtimeFixture(300);spec.resolvedShip.hull.bodyExchangeAreaM2=10;spec.receiverProfile=receiverProfile;spec.environment.radiativeBackgroundK=400;const step=stepV3(spec,spec.initialState,{});
  const watts=step.frames.map(frame=>frame.body.radiationW+frame.surfaces.rows.reduce((sum,row)=>sum+row.radiationW,0));expect(watts.every(value=>value<0)).toBe(true);
  const stats=accumulateShipModelFrames(spec,createShipSignatureStatistics(0),step),measured=watts.map(value=>receiverProfile==='absolute-contrast'?Math.abs(value):0);
  expect(stats.receiverIrW.minW).toBe(Math.min(...measured));expect(stats.receiverIrW.maxW).toBe(Math.max(...measured));expect(stats.receiverIrW.integralJ).toBe(measured.reduce((sum,value,index)=>sum+value*step.frames[index].durationSeconds,0));
});
