import { expect,it } from 'vitest';
import { stepV3 } from '../../src/model/v3/step';
import { fixture } from './fixture';
it('shield off/on changes only escaped/retained parasitic share causally in the same production step',()=>{
  const s=fixture('stealth-reference');s.initialState.mode='Masking';s.initialState.maskingEntryTemperatureK=300;
  for(const i of s.resolvedShip.instances)if(i.item.family==='shielding')i.item.numerics.powerW=0;
  const off=structuredClone(s);for(const i of off.resolvedShip.instances)if(i.item.family==='shielding')i.enabled=false;
  const a=stepV3(off,off.initialState,{}),b=stepV3(s,s.initialState,{});
  for(const r of [a,b]){expect(r.telemetry.rawEmW).toBeCloseTo(r.telemetry.escapedEmW+r.telemetry.capturedEmW,12);expect(r.telemetry.totalResidualJ).toBeCloseTo(0,6);}
  expect(b.telemetry.rawEmW).toBe(a.telemetry.rawEmW);expect(b.telemetry.escapedEmW).toBeLessThan(a.telemetry.escapedEmW);
  expect(b.telemetry.bufferCaptureW).toBeGreaterThan(a.telemetry.bufferCaptureW);expect(b.state.buffers).not.toEqual(a.state.buffers);
  expect(b.telemetry.hostHeatW-a.telemetry.hostHeatW).toBeCloseTo(a.telemetry.escapedEmW-b.telemetry.escapedEmW,7);
});
