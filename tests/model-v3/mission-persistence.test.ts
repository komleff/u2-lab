import {it,expect} from 'vitest';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {parseShipModelResultJson,validateShipModelResult} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
const spec=(x={})=>{const c=loadCandidateCatalog('ship-fitting-0.3.2'),s=makeShipModelMissionRun(getPresetFit('sputnik-d',c.version),c,x);if(!s.ok)throw Error(JSON.stringify(s.errors));return s.value;};
it('service horizon has no receipts; checkpoint before endpoint applies receipts once and keeps heat/durability/RNG',()=>{
 const s=spec({distanceM:0,serviceSeconds:10,repeat:false}),whole=createShipModelRun('endpoint',s);while(!whole.done&&whole.state.mission!.stage!=='service')runShipModelChunk(whole,1);
 expect(whole.state.mission!.stage).toBe('service');const t=whole.state.timeSeconds;expect(whole.state.mission!.receivedChargeJ).toBe(0);expect(whole.state.mission!.receivedFuelKg.diesel).toBe(0);
 const short=structuredClone(s);short.durationSeconds=Math.ceil(t)+2;const horizon=createShipModelRun('horizon',short);runShipModelChunk(horizon,3600);expect(horizon.state.mission!.stage).toBe('service');expect(horizon.state.mission!.receivedChargeJ).toBe(0);expect(horizon.state.mission!.completedTrips).toBe(0);
 runShipModelChunk(whole,9);expect(whole.state.mission!.stage).toBe('service');expect(10-whole.state.mission!.stageElapsedSeconds).toBeLessThanOrEqual(1);const partial=shipModelResult(whole,'paused');
 const checked=parseShipModelResultJson(serializeResultSnapshot(partial));expect(checked.ok).toBe(true);if(!checked.ok)return;const restored=restoreShipModelRun(checked.value);runShipModelChunk(restored,3600);runShipModelChunk(whole,3600);const r=shipModelResult(whole);expect(shipModelResult(restored)).toEqual(r);expect(r.state.mission!.completedTrips).toBe(1);expect(r.state.mission!.terminalReason).toBe('single-trip');expect(r.state.timeSeconds).toBeLessThan(3600);expect(validateShipModelResult(r)).toMatchObject({ok:true});expect(r.state.modules).not.toEqual(s.initialState.modules);expect(r.state.temperatureK).not.toBe(s.initialState.temperatureK);
 const after=restoreShipModelRun(r);runShipModelChunk(after,5);expect(shipModelResult(after)).toEqual(r);
});
it.each(['tag','cargo','position','clock','unknown','receipts','terminal'] as const)('strict mission result refuses forged %s',kind=>{
 const run=createShipModelRun('forged',spec());runShipModelChunk(run,2);const r=shipModelResult(run,'paused');
 if(kind==='tag')r.state.modelVersion='ship-fitting-ship-model-0.1';if(kind==='cargo')r.state.mission!.onboardM3=-1;if(kind==='position')r.state.mission!.positionM=-1;if(kind==='clock')r.state.mission!.stageElapsedSeconds=-1;if(kind==='unknown')(r.state.mission as any).extra=1;if(kind==='receipts'){r.spec.mission!.stationReplenish=false;r.state.mission!.receivedChargeJ=1;}if(kind==='terminal')r.status='complete';
 expect(validateShipModelResult(r).ok).toBe(false);
});
