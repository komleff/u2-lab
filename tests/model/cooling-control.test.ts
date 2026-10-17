import { describe, expect, it } from 'vitest';
import { moduleBase } from '../../src/catalog/presets';
import { initialState, type EnvironmentSample, type Module } from '../../src/model/types';
import { SIGMA, stepPhysicsV2, type PhysicsShip } from '../../src/model/v2/physics';

const environment=(T=100):EnvironmentSample=>({effectiveBackgroundK:T,solarFluxWm2:0,solarSourceId:'sun',backgroundSourceId:'space',energyInputs:[],directHeat:[],law:'radiative',linearWK:0});
function ship(modules:Module[],scale=1):PhysicsShip {
 return {label:'controlled ledger',size:'S',heatCapacityJK:1e6*scale,dryMassKg:1000*scale,thermalMaterials:[],hullPowerW:0,hullRadiationM2:0,dischargeEfficiency:1,chargeEfficiency:1,accumulators:[{id:'battery',capacityJ:1e10*scale}],tanks:[{id:'hydrogen',species:'hydrogen',capacityKg:10*scale,energyJKg:120e6}],modules,cargoCapacity:100,cargoLimitM3:100,targetLimitM3:100,returnFraction:0};
}
const cooler=(scale=1):Module=>({...moduleBase('cooler','h2'),tankId:'hydrogen',species:'hydrogen',coolingW:2e6*scale,auxW:2e4*scale,qJKg:1e7,gate:{low:100,workLow:200,workHigh:400,high:700,restartLow:150,restartHigh:650}});
const active=(scale=1):Module=>({...moduleBase('active','radiator'),areaM2:1000*scale,auxW:10000*scale});
const state=(s:PhysicsShip,T:number)=>({...initialState({ship:s,initial:{chargeJ:1e10,fuelKg:{hydrogen:10},temperatureK:T,buffersJ:{}}} as any),miningStopSeconds:null as number|null});
function step(s:PhysicsShip,T:number,env=environment(),dt=.1){return stepPhysicsV2(s,state(s,T),env,[],dt);}
const conserved=(r:ReturnType<typeof step>)=>{expect(Object.values(r.telemetry).every(Number.isFinite)).toBe(true);expect(Math.abs(r.telemetry.energyResidualJ)).toBeLessThan(.01);};

describe('CC01/CC02 real cooling request and signed ordinary paths',()=>{
 it.each([299,300])('H2 at %s K has no removal, auxiliary draw or own mass consumption',T=>{
  const s=ship([cooler()]),r=step(s,T);expect(r.telemetry.h2CoolingW).toBe(0);expect(r.telemetry.h2AuxRejectW).toBe(0);expect(r.telemetry.requestedW).toBe(0);expect(r.state.fuelKg.hydrogen).toBe(10);expect(r.coolantConsumedKg).toBe(0);expect(r.state.temperatureK).toBe(T);conserved(r);
 });
 it('does not treat the 300K safety floor as a constant cooling target',()=>{const s=ship([cooler()]);const r=step(s,350);expect(r.telemetry.h2CoolingW).toBe(0);expect(r.state.temperatureK).toBe(350);conserved(r);});
 it('ordinary radiation or a finite buffer covers the heat before H2',()=>{
  const s=ship([cooler()]);s.hullRadiationM2=1000;const e=environment();e.directHeat=[{sourceId:'heat',powerW:1e5}];const r=step(s,400,e);expect(r.telemetry.h2CoolingW).toBe(0);expect(r.state.temperatureK).toBeLessThan(400);conserved(r);
  const b=ship([cooler(),{...moduleBase('buffer','buffer'),capacityJ:1e7,coolingW:1e6,absorbAboveK:390}]);const initial=state(b,400);initial.buffersJ.buffer=0;const br=stepPhysicsV2(b,initial,e,[],.1);expect(br.telemetry.h2CoolingW).toBe(0);expect(br.state.buffersJ.buffer).toBeGreaterThan(0);conserved(br);
 });
 it('removes stored excess above the existing working boundary after requests stop',()=>{const s=ship([cooler()]),r=step(s,410);expect(r.telemetry.h2CoolingW).toBeGreaterThan(0);expect(r.state.temperatureK).toBeLessThan(410);expect(r.state.temperatureK).toBeGreaterThanOrEqual(400);conserved(r);});
 it.each([400,500])('Active at hull400/background%s is closed; hull and Passive still import signed heat',background=>{
  const a=active(),passive={...moduleBase('passive','radiator'),areaM2:200},s=ship([a,passive]);s.hullRadiationM2=50;
  const r=step(s,400,environment(background),.001),control=step({...s,modules:[passive]},400,environment(background),.001);
  expect(r.state.temperatureK).toBe(control.state.temperatureK);expect(r.state.chargeJ).toBe(control.state.chargeJ);expect(r.state.fuelKg).toEqual(control.state.fuelKg);expect(r.telemetry.requestedW).toBe(0);expect(r.telemetry.radiatorHostW).toBe(0);expect(r.telemetry.radiationNetW).toBeLessThanOrEqual(0);if(background>400)expect(r.telemetry.radiationInW).toBeGreaterThan(r.telemetry.radiationOutW);conserved(r);
 });
});

describe('CC03 coupled ledgers and physical crossings',()=>{
 it('coupled actual generator/pump heat needs only residual H2 and exports its own auxiliary heat',()=>{
  const gen={...moduleBase('generator','generator'),tankId:'hydrogen',species:'hydrogen' as const,powerW:1e6,efficiency:.5,pathEfficiency:.8,exportFraction:.5};
  const s=ship([cooler(),gen]);s.hullPowerW=1e5;const r=step(s,400,environment(),1);
  expect(r.telemetry.h2CoolingW).toBeGreaterThan(1e5);expect(r.telemetry.h2CoolingW).toBeLessThan(2e6);expect(r.state.temperatureK).toBeCloseTo(400,7);
  expect(r.telemetry.h2CoolingW).toBeCloseTo(r.telemetry.heatInW,3);expect(r.telemetry.generatorHostW).toBeGreaterThan(0);expect(r.telemetry.pathLossW).toBeGreaterThan(0);
  const consumed=Object.entries(r.consumptionKg).filter(([k])=>k.startsWith('hydrogen:')).reduce((n,[,v])=>n+v,0);
  expect(10-r.state.fuelKg.hydrogen).toBeCloseTo(consumed,12);expect(r.consumptionKg['hydrogen:generator:generator']).toBeGreaterThan(0);
  expect(r.consumptionKg['hydrogen:cooler:cooler']*1e7).toBeCloseTo(r.telemetry.h2CoolingW+r.telemetry.h2AuxRejectW,6);conserved(r);
 });
 it('finite shared tank ends at its real boundary and all consumers stop together',()=>{
  const s=ship([cooler(),{...moduleBase('generator','generator'),tankId:'hydrogen',species:'hydrogen',powerW:1e6,efficiency:.5}]);s.hullPowerW=1e5;const st=state(s,410);st.fuelKg.hydrogen=.001;const r=stepPhysicsV2(s,st,environment(),[],1);
  expect(r.state.timeSeconds).toBe(1);expect(r.state.fuelKg.hydrogen).toBe(0);expect(r.consumptionKg['hydrogen:cooler:cooler']).toBeGreaterThan(0);expect(r.consumptionKg['hydrogen:generator:generator']).toBeGreaterThan(0);expect(Object.values(r.consumptionKg).reduce((n,v)=>n+v,0)).toBeCloseTo(.001,12);conserved(r);
 });
 it.each([1,4])('floor/work boundary refinement scale%s does not invent a cold sink or energy clamp',scale=>{
  const c=cooler(scale);c.gate.workHigh=300;
  const s=ship([c],scale);s.hullPowerW=1e5*scale;
  const rows=[.005,.05,.5].map(dt=>{let st=state(s,300.01);st.chargeJ=1e10*scale;let fuel=0,energy=0;for(let j=0;j<Math.round(2/dt);j++){const r=stepPhysicsV2(s,st,environment(),[],dt);st=r.state;fuel+=r.coolantConsumedKg;energy+=r.telemetry.energyResidualJ;expect(st.temperatureK).toBeGreaterThanOrEqual(300-1e-9);expect(st.timeSeconds).toBeGreaterThan(0);}return {T:st.temperatureK,Q:st.chargeJ,fuel,energy};});
  for(const r of rows){expect(r.T).toBeCloseTo(300,5);expect(r.fuel).toBeCloseTo(rows[0].fuel,5);expect(r.Q).toBeCloseTo(rows[0].Q,-1);expect(Math.abs(r.energy)).toBeLessThan(.01);}
 });
 it('natural hull cooling can fall below300 with the cooler OFF, with all heat retained in ledger',()=>{
  const s=ship([cooler()]);s.hullRadiationM2=1e4;const r=step(s,300.01,environment(),1);expect(r.state.temperatureK).toBeLessThan(300);expect(r.telemetry.h2CoolingW).toBe(0);expect(r.telemetry.radiationNetW).toBeGreaterThan(0);conserved(r);
 });
 it('Active closes inside a cooling crossing and reopens inside a heating crossing without a new fit',()=>{
  const s=ship([active(),{...moduleBase('ti','thermoinverter'),coolingW:2e6,areaM2:1000,hotK:800,copEfficiency:.5}]);
  const r=step(s,400.05,environment(400),.5);expect(r.state.temperatureK).toBeLessThan(400);expect(r.telemetry['coolingClosed:active']).toBeGreaterThan(0);expect(r.telemetry.radiatorHostW).toBeGreaterThan(0);expect(r.telemetry.radiatorHostW).toBeLessThan(10000);conserved(r);
  const hot={...s,modules:[active()]},env=environment(400);env.directHeat=[{sourceId:'warm',powerW:2e6}];const warm=step(hot,399.9,env,.5);expect(warm.state.temperatureK).toBeGreaterThan(400);expect(warm.telemetry['coolingClosed:active']).toBeGreaterThan(0);expect(warm.telemetry['coolingRequested:active']).toBeGreaterThan(0);expect(warm.telemetry.radiatorHostW).toBeGreaterThan(0);conserved(warm);
 });
});

it('CC03 demand begins at the existing working boundary within one large physical step',()=>{
 const s=ship([cooler()]);const env=environment();env.directHeat=[{sourceId:'working-heat',powerW:1e6}];
 const rows=[.005,.05,.5].map(dt=>{let st=state(s,399.8),used=0;for(let j=0;j<Math.round(1/dt);j++){const r=stepPhysicsV2(s,st,env,[],dt);st=r.state;used+=r.coolantConsumedKg;conserved(r);}return {st,used};});
 for(const r of rows){expect(r.st.temperatureK).toBeCloseTo(400,6);expect(r.used).toBeCloseTo((1e6*.8*(1+.01))/1e7,6);expect(r.st.timeSeconds).toBeCloseTo(1,12);}
});

it('CC01 stored heat after a protected load STOP reaches its existing safe restart threshold, then ordinary working corridor',()=>{
 const load={...moduleBase('stopped-load','load'),output:'drive' as const,powerW:1e5,gate:{low:100,workLow:200,workHigh:390,high:410,restartLow:250,restartHigh:350}};
 const s=ship([cooler(),load]);let st=state(s,420),delivered=0;const events=[];
 for(let j=0;j<100;j++){const r=stepPhysicsV2(s,st,environment(),[{moduleId:load.id,duty:1}],.5);st=r.state;delivered+=r.telemetry['deliveredW:'+load.id]*.5;events.push(...r.events);conserved(r);}
 expect(st.timeSeconds).toBe(50);expect(st.gates[load.id]).toBe(false);expect(delivered).toBeGreaterThan(0);expect(events.filter(e=>e.kind==='thermal-restart'&&e.message.startsWith(load.id+':'))).toHaveLength(1);expect(st.temperatureK).toBeLessThan(390);expect(st.temperatureK).toBeGreaterThan(300);
});
