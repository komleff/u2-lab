import {it,expect} from 'vitest';
import {makeShipModelMissionRun} from '../../src/scenarios/ship-model-mission';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {createShipModelRun,runShipModelChunk,shipModelResult,restoreShipModelRun} from '../../src/runner/ship-model-run';
import {stepShipModelMission} from '../../src/runner/ship-model-mission';
import {validateShipModelResult,parseShipModelResultJson} from '../../src/io/ship-model-result';
import {serializeResultSnapshot} from '../../src/io/fitting-json';
import {exportShipModelTelemetryCsv,shipModelChannelUnit} from '../../src/io/ship-model-csv';
import {shipModelLive,shipModelChannelsView} from '../../src/app/fitting-ui/ship-model-lab-view';
import {num} from '../../src/app/fitting-ui/presentation';
import {shipModelResults} from '../../src/app/fitting-ui/ship-model-results';
const spec=(x={},disabled=false)=>{const c=loadCandidateCatalog('ship-fitting-0.3.2'),fit=getPresetFit('sputnik-d',c.version);if(disabled)fit.instances['fit:payload-1'].enabled=false;const r=makeShipModelMissionRun(fit,c,x);if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;};
const reopen=(r:ReturnType<typeof shipModelResult>)=>{const parsed=parseShipModelResultJson(serializeResultSnapshot(r));expect(parsed.ok,JSON.stringify(parsed)).toBe(true);if(!parsed.ok)throw Error('Invalid roundtrip');return restoreShipModelRun(parsed.value);};
it('offset initial199.25/H200 normalizes the .75s sample and roundtrips its own final measurement',()=>{
 const s=spec({durationSeconds:200});s.initialState.timeSeconds=199.25;const raw=stepShipModelMission(s,s.initialState),run=createShipModelRun('offset',s);runShipModelChunk(run,1);const r=shipModelResult(run);expect(r.signatures.version==='ship-signatures/2'&&r.signatures.statistics.durationSeconds).toBe(.75);expect(r.checkpoint.lastTelemetry.deliveredW).toBeCloseTo(raw.telemetry.deliveredW/.75,8);expect(validateShipModelResult(r)).toMatchObject({ok:true});expect(shipModelResult(reopen(r))).toEqual(r);
});
it('offset pause at one logical tick restores through the fractional horizon exactly',()=>{
 const s=spec({durationSeconds:201});s.initialState.timeSeconds=199.25;const run=createShipModelRun('offset-paused',s);runShipModelChunk(run,1);const restored=reopen(shipModelResult(run,'paused'));runShipModelChunk(run,1);runShipModelChunk(restored,1);expect(shipModelResult(restored)).toEqual(shipModelResult(run));expect(validateShipModelResult(shipModelResult(run))).toMatchObject({ok:true});
});
it('fractional terminal keeps raw useful joules but presents and retains actual watts in UI and CSV',()=>{
 const s=spec({distanceM:0,approachSeconds:0,serviceSeconds:0,targetM3:.001}),raw=stepShipModelMission(s,s.initialState),run=createShipModelRun('partial-power',s);runShipModelChunk(run,1);const r=shipModelResult(run),dt=r.state.timeSeconds-s.initialState.timeSeconds,id='actualW:fit:payload-1',power=raw.telemetry[id]/dt;
 expect(dt).toBeGreaterThan(0);expect(dt).toBeLessThan(1);expect(r.metrics.usefulWorkJ).toBeCloseTo(24000,6);expect(r.metrics.usefulWorkJ).toBe(raw.telemetry.usefulWorkW);expect(r.checkpoint.lastTelemetry[id]).toBeCloseTo(power,6);expect(r.checkpoint.lastTelemetry.processWorkJ).toBe(raw.telemetry.processWorkJ);
 const i=r.channels.indexOf(id),bucket=r.buckets[0];expect(bucket.sum[i]/bucket.count).toBeCloseTo(power,6);const csv=exportShipModelTelemetryCsv(r),row=csv.split('\n').map(x=>x.split(',')).find(x=>x[2]===id)!;expect(row[3]).toBe('W');expect(Number(row[4])).toBeCloseTo(power,6);
 expect(shipModelLive(r)).toContain(num(power,'W'));const html=shipModelChannelsView(r,{group:'work',unit:'W',hidden:new Set(),eventIndex:0});expect(html).toContain(`data-channel="${id}" data-mean="${power}"`);expect(shipModelResult(reopen(r))).toEqual(r);
});
it.each([['positionM','m'],['velocityMS','m/s'],['onboardM3','SCU'],['minedM3','SCU'],['deliveredM3','SCU']])('CSV %s declares explicit %s units',(channel,unit)=>expect(shipModelChannelUnit(channel)).toBe(unit));
it.each([false,true])('zero-time terminal has no fabricated signature/energy/tick and roundtrips; receipts=%s',receipts=>{
 const s=spec({distanceM:0,approachSeconds:0,serviceSeconds:0,stopPolicy:'first-stop',repeat:false},true);if(receipts){s.initialState.chargeJ=0;s.initialState.fuelKg.diesel=0;}const run=createShipModelRun('zero-'+receipts,s);expect(()=>runShipModelChunk(run,1)).not.toThrow();const r=shipModelResult(run);expect(r.state.timeSeconds).toBe(0);expect(r.state.mission!.terminalReason).toBe('single-trip');expect(r.metrics).toMatchObject({usefulWorkJ:0,totalResidualJ:0});expect(r.signatures.last).toBeNull();expect(r.retention.totalTicks).toBe(0);expect(r.buckets).toEqual([]);expect(r.state.temperatureK).toBe(s.initialState.temperatureK);expect(r.state.rng).toEqual(s.initialState.rng);expect(r.state.modules).toEqual(s.initialState.modules);expect(r.state.mission!.receivedChargeJ).toBe(receipts?s.resolvedShip.batteryCapacityJ:0);expect(r.state.mission!.receivedFuelKg.diesel).toBe(receipts?s.resolvedShip.resources.diesel.capacityKg:0);expect(validateShipModelResult(r)).toMatchObject({ok:true});const restored=reopen(r);runShipModelChunk(restored,2);expect(shipModelResult(restored)).toEqual(r);expect(exportShipModelTelemetryCsv(r).split('\n')).toHaveLength(3);expect(shipModelResults(r)+shipModelLive(r)).not.toMatch(/NaN|Infinity/);expect(shipModelResults(r)).toContain('нет измерения');
});
it('zero-time repeat without physical progress remains bounded and does not commit fictitious time or side effects',()=>{
 const s=spec({distanceM:0,approachSeconds:0,serviceSeconds:0,stopPolicy:'first-stop',repeat:true},true),run=createShipModelRun('zero-repeat',s);expect(()=>runShipModelChunk(run,1)).toThrow(/zero-time/);expect(run.state).toEqual(s.initialState);expect(run.retention.totalTicks).toBe(0);expect(run.metrics.usefulWorkJ).toBe(0);expect(run.signatures.last).toBeNull();
});
