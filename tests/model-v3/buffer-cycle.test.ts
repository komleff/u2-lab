import { expect, it } from "vitest";
import { bufferFlow, advanceBuffer } from "../../src/model/v3/buffer";
import {stepV3} from '../../src/model/v3/step';
import {runtimeFixture,install} from './runtime-fixture';
const x=()=>({storedJ:0,minimumCaptureK:null as number|null,capacityJ:1e9,chargePowerW:1e6,dischargePowerW:2e6,temperatureK:490,captureW:1e6,releaseW:0});
it("CP-04 buffer fill clips at 0.5s: remaining heat raises T, not a negative/free stock",()=>{
  const a=x();a.storedJ=999500000;a.minimumCaptureK=490;const r=bufferFlow(a);expect(r.limitSeconds).toBe(0.5);
  const b=advanceBuffer(a,r,0.5,490);expect(b.storedJ).toBe(1e9);expect(b.transferredJ).toBe(500000);
  a.storedJ=b.storedJ;expect(bufferFlow(a).rateStoredJPerS).toBe(0);
  expect(490+1e6*0.5/20e6).toBeCloseTo(490.025,12);
});
it("capture marker is the minimum; hot recovery is unreachable, empty clears it, repeat never erases debt",()=>{
  const a=x(),first=advanceBuffer(a,bufferFlow(a),1,489);a.storedJ=first.storedJ;a.minimumCaptureK=first.minimumCaptureK;expect(a.minimumCaptureK).toBe(489);
  a.temperatureK=480;const second=advanceBuffer(a,bufferFlow(a),1,480);a.storedJ=second.storedJ;a.minimumCaptureK=second.minimumCaptureK;expect(a.minimumCaptureK).toBe(480);
  a.captureW=0;a.releaseW=2e6;a.temperatureK=481;expect(bufferFlow(a).reason).toBe("hotter-than-capture");expect(bufferFlow(a).rateStoredJPerS).toBe(0);
  a.temperatureK=450;const released=advanceBuffer(a,bufferFlow(a),1,450);expect(released.storedJ).toBe(0);expect(released.minimumCaptureK).toBeNull();
  a.storedJ=0;a.minimumCaptureK=null;a.releaseW=0;a.captureW=1e6;expect(advanceBuffer(a,bufferFlow(a),1,450).storedJ).toBe(1e6);
});
it("power/capacity constraints are distinct and simultaneous directions cannot be accepted",()=>{
  const a=x();a.captureW=4e6;expect(bufferFlow(a).reason).toBe("power-limit");expect(bufferFlow(a).rateStoredJPerS).toBe(1e6);
  a.storedJ=a.capacityJ;a.minimumCaptureK=490;expect(bufferFlow(a).reason).toBe("capacity-limit");
  a.releaseW=1;expect(()=>bufferFlow(a)).toThrow("simultaneous");
});
it('production work→recovery→repeat returns all debt, while an inaccessible capture temperature retains exact remainder',()=>{
  const s=runtimeFixture(450),buffer=install(s,'buffer-S');s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=450;s.environment.directHeat=[{sourceId:'work',powerW:1e6}];
  const work=stepV3(s,s.initialState,{});expect(work.state.buffers[buffer.id].storedJ).toBeCloseTo(1e6,2);
  s.environment.directHeat=[];s.environment.thermalField={sourceId:'recovery-field',temperatureK:350,coefficientWPerM2K:100};s.resolvedShip.hull.bodyExchangeAreaM2=200;
  work.state.mode='Efficient';work.state.maskingEntryTemperatureK=null;const recovered=stepV3(s,work.state,{},'recovery');expect(recovered.state.buffers[buffer.id].storedJ).toBe(0);expect(recovered.state.buffers[buffer.id].minimumCaptureK).toBeNull();expect(recovered.state.governor.heatingStageId).toBeNull();
  recovered.state.mode='Masking';recovered.state.maskingEntryTemperatureK=recovered.state.temperatureK;s.environment.thermalField=null;s.resolvedShip.hull.bodyExchangeAreaM2=0;s.environment.directHeat=[{sourceId:'repeat',powerW:1e6}];
  const repeated=stepV3(s,recovered.state,{});expect(repeated.state.buffers[buffer.id].storedJ).toBeCloseTo(work.state.buffers[buffer.id].storedJ,2);
  s.environment.directHeat=[];repeated.state.mode='Efficient';repeated.state.maskingEntryTemperatureK=null;repeated.state.buffers[buffer.id].minimumCaptureK=310;
  const blocked=stepV3(s,repeated.state,{},'recovery');expect(blocked.state.buffers[buffer.id]).toEqual(repeated.state.buffers[buffer.id]);expect(blocked.diagnostics).toContainEqual({instanceId:buffer.id,reason:'hotter-than-capture',timeSeconds:blocked.state.timeSeconds,remainingJ:repeated.state.buffers[buffer.id].storedJ});
});
it('production release clips at capture-temperature contact even if a frozen heating request would overshoot it',()=>{
  const s=runtimeFixture(309.99),buffer=install(s,'buffer-S');for(const i of s.resolvedShip.instances)if(i.item.thermalRole==='ordinary')i.item.gate.workLow=300;
  s.initialState.buffers[buffer.id]={storedJ:1e6,minimumCaptureK:310};s.environment.radiativeBackgroundK=100;s.resolvedShip.hull.bodyExchangeAreaM2=1;
  const r=stepV3(s,s.initialState,{});expect(r.state.temperatureK).toBeLessThanOrEqual(310);expect(r.state.buffers[buffer.id].storedJ).toBeGreaterThan(0);expect(r.state.buffers[buffer.id].minimumCaptureK).toBe(310);expect(Math.abs(r.telemetry.totalResidualJ)).toBeLessThan(1e-6);
});
