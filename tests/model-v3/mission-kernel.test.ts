import {it,expect} from 'vitest';
import * as kernel from '../../src/model/v3/step';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
const spec=()=>{const c=loadCandidateCatalog('ship-fitting-0.3.2');const r=makeShipModelMiningRun(getPresetFit('sputnik-d',c.version),c);if(!r.ok)throw Error(JSON.stringify(r.errors));return r.value;};
it('mission has an interval primitive while stationary remains literal at dt=1',()=>{
 expect(kernel.stepV3Interval).toBeTypeOf('function');
 const s=spec(),requests=s.scenario.phases[0].requests;
 const old=kernel.stepV3(s,s.initialState,requests);const interval=kernel.stepV3Interval(s,s.initialState,requests,'work',1);
 expect(interval.state).toEqual(old.state);for(const [k,v]of Object.entries(old.telemetry))expect(interval.telemetry[k]).toBe(v);
});
it.each([1,.5,.1])('mission dt=%s integrates useful work, process heat and force without input mutation',dt=>{
 const s=spec(),before=structuredClone(s.initialState),requests=s.scenario.phases[0].requests;
 const plain=kernel.stepV3Interval(s,before,requests,'work',dt),process=kernel.stepV3Interval(s,before,requests,'work',dt,{returnFraction:.35});
 expect(before).toEqual(s.initialState);expect(process.state.timeSeconds).toBe(dt);
 expect(process.telemetry.processWorkJ).toBeCloseTo(plain.telemetry.usefulWorkW,6);
 expect(process.telemetry.processReturnJ).toBeCloseTo(process.telemetry.processWorkJ*.35,6);
 expect(process.state.temperatureK).toBeGreaterThan(plain.state.temperatureK);expect(Math.abs(process.telemetry.totalResidualJ)).toBeLessThan(1e-4);
 const march=Object.fromEntries(s.resolvedShip.instances.filter(i=>i.role==='march').map(i=>[i.id,1]));
 const flight=kernel.stepV3Interval(s,before,march,'maneuver',dt);expect(flight.telemetry['impulseNs:march']).toBeGreaterThan(0);
 const empty=structuredClone(before);empty.fuelKg={diesel:0,hydrogen:0};empty.chargeJ=0;expect(kernel.stepV3Interval(s,empty,march,'maneuver',dt).telemetry['impulseNs:march']).toBe(0);
});
it.each([0,-1,1.01,NaN])('rejects invalid mission dt %s',dt=>{const s=spec();expect(()=>kernel.stepV3Interval(s,s.initialState,{},'idle',dt)).toThrow();});
it.each(['sputnik-d','sputnik-e'])('interval force and impulse use the paid %s engine output, not nominal thrust',id=>{
 const c=loadCandidateCatalog('ship-fitting-0.3.2'),made=makeShipModelMiningRun(getPresetFit(id,c.version),c,{durationSeconds:1});if(!made.ok)throw Error(JSON.stringify(made.errors));const s=made.value,engine=s.resolvedShip.instances.find(i=>i.role==='march')!,req={[engine.id]:.4};
 const full=kernel.stepV3Interval(s,s.initialState,req,'maneuver',1);
 for(const dt of [.5,.1]){const part=kernel.stepV3Interval(s,s.initialState,req,'maneuver',dt);expect(part.telemetry['impulseNs:march']).toBeCloseTo(full.telemetry['impulseNs:march']*dt,6);expect(part.telemetry['forceN:'+engine.id]).toBeCloseTo(full.telemetry['forceN:'+engine.id],6);for(const sp of ['diesel','hydrogen']as const)expect(s.initialState.fuelKg[sp]-part.state.fuelKg[sp]).toBeCloseTo((s.initialState.fuelKg[sp]-full.state.fuelKg[sp])*dt,8);}
 if(engine.item.propulsionType==='electric')expect(full.telemetry['forceN:'+engine.id]).toBeCloseTo(engine.item.numerics.forceN*full.telemetry['actualW:'+engine.id]/engine.item.numerics.powerW,6);
});
