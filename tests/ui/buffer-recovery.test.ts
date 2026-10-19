import {expect,it} from 'vitest';
import {civilianRecoveryFixture,stealthRecoveryFixture} from '../model-v3/buffer-recovery-fixture';
import {EventRetention} from '../../src/runner/retention';
import {createShipModelRun,runShipModelChunk,shipModelResult} from '../../src/runner/ship-model-run';
import {shipModelResults} from '../../src/app/fitting-ui/ship-model-results';
it('ST1-06 result reports actual full recovery interval from retained production events',()=>{
  const s=civilianRecoveryFixture();s.initialState.temperatureK=400;s.initialState.buffers['fit:signature-1']={storedJ:1e5,minimumCaptureK:300};
  s.origins['initialState.buffers.fit:signature-1.minimumCaptureK']={kind:'experimental',unit:'K',sourceRef:'WI1 UI test'};s.scenario.phases[0].requests={};s.durationSeconds=3;
  const run=createShipModelRun('ui-recovery',s);runShipModelChunk(run,3);const result=shipModelResult(run);
  expect(result.state.buffers['fit:signature-1'].storedJ).toBe(0);
  expect(result.events.some(e=>e.kind==='buffer-recovery-start')).toBe(true);
  expect(shipModelResults(result)).toMatch(/data-recovery-seconds="[0-9.]+"/);
});
it('ST1-06 truncated two-cycle event history cannot pair a retained old start with a newer empty',()=>{
  const s=civilianRecoveryFixture(),run=createShipModelRun('truncated',s),result=shipModelResult(run,'paused'),history=new EventRetention(),id='fit:signature-1';
  history.add({timeSeconds:0,kind:'buffer-recovery-start',message:id+': buffer-recovery-start'});history.add({timeSeconds:1,kind:'buffer-empty',message:id+': buffer-empty'});
  for(let n=0;n<130;n++)history.add({timeSeconds:2,kind:'phase',message:'first cycle'});
  history.add({timeSeconds:3,kind:'buffer-recovery-start',message:id+': buffer-recovery-start'});
  for(let n=0;n<20000;n++)history.add({timeSeconds:4+n,kind:'phase',message:'second cycle'});
  history.add({timeSeconds:20004,kind:'buffer-empty',message:id+': buffer-empty'});
  result.events=history.items();result.retention.totalEvents=history.total;result.retention.droppedEvents=history.dropped;result.state.timeSeconds=20004;
  expect(result.events.some(e=>e.kind==='buffer-recovery-start'&&e.timeSeconds===3)).toBe(false);expect(result.events.some(e=>e.kind==='buffer-recovery-start'&&e.timeSeconds===0)).toBe(true);
  const html=shipModelResults(result);expect(/data-recovery-seconds="[0-9.]+"/.test(html)).toBe(false);expect(html.includes('история усечена')).toBe(true);expect(html.includes('длительность не измерена')).toBe(true);
});
it('ST1-06 actual long StealthS recovery retains its own measured interval in the rendered result',()=>{
  const s=stealthRecoveryFixture();s.durationSeconds=18985;s.scenario.phases=[{id:'mask-fill',action:'idle',durationSeconds:1907,requests:{},environment:null},{id:'real-recovery',action:'idle',mode:'Efficient',durationSeconds:17078,requests:{},environment:null}];
  s.origins['scenario.phases.1.durationSeconds']={kind:'experimental',unit:'s',sourceRef:'WI1 measured feasibility replay, explicit phase durations'};
  const run=createShipModelRun('long-stealth-recovery',s);runShipModelChunk(run,s.durationSeconds);const result=shipModelResult(run),start=result.events.find(e=>e.kind==='buffer-recovery-start'),empty=result.events.find(e=>e.kind==='buffer-empty');
  expect(result.state.buffers['builtin:buffer'].storedJ).toBe(0);expect(result.retention.droppedEvents).toBe(0);expect(start?.timeSeconds).toBe(1907);expect(empty).toBeDefined();const elapsed=empty!.timeSeconds-start!.timeSeconds;
  expect(Math.ceil(elapsed)).toBe(17078);expect(Math.abs(result.metrics.totalResidualJ)).toBeLessThan(1);expect(shipModelResults(result).includes(`data-recovery-seconds="${elapsed}"`)).toBe(true);
  console.log('WI1_LONG_RENDER',JSON.stringify({elapsedSeconds:elapsed,endSeconds:empty!.timeSeconds,startSeconds:start!.timeSeconds,retainedEvents:result.events.length,droppedEvents:result.retention.droppedEvents,energyResidualJ:result.metrics.totalResidualJ,temperatureK:result.state.temperatureK}));
},30000);
it('ST1-05/06 blocked recovery shows remaining debt and actual cause, not a temperature-marker forecast',()=>{
  const s=civilianRecoveryFixture();s.initialState.temperatureK=400;s.initialState.buffers['fit:signature-1']={storedJ:1e6,minimumCaptureK:300};
  s.origins['initialState.buffers.fit:signature-1.minimumCaptureK']={kind:'experimental',unit:'K',sourceRef:'WI1 UI test'};s.scenario.phases[0].requests={};s.environment.radiativeBackgroundK=650;s.durationSeconds=2;
  const run=createShipModelRun('ui-blocked',s);runShipModelChunk(run,2);const result=shipModelResult(run),html=shipModelResults(result);
  expect(result.state.buffers['fit:signature-1'].storedJ).toBe(1e6);expect(html).toContain('no-cooling-headroom');expect(html).toContain('Полная разгрузка не измерена');expect(html).not.toMatch(/data-recovery-seconds="[0-9.]+"/);
});
