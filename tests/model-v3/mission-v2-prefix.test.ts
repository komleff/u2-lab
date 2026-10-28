import{it,expect}from'vitest';import{createHash}from'node:crypto';
import{createShipModelRun,runShipModelChunk,shipModelResult}from'../../src/runner/ship-model-run';
import{ermak,weak}from'./mission-v2-fixture';
const hash=(x:unknown)=>createHash('sha256').update(JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v)).digest('hex');
function physical(run:ReturnType<typeof createShipModelRun>){const r=shipModelResult(run);return{state:r.state,metrics:r.metrics,events:r.events,channels:r.channels,buckets:r.buckets,signatures:r.signatures,last:r.checkpoint.lastTelemetry};}
export function brakeWeak(H=10800){const s=weak(H);s.mission!.route.speedPolicy='custom';s.mission!.route.cruiseSpeedMS=450;s.initialState.mission!.positionM=239615.7064384307;return s;}
it.each(['coupled','weak']as const)('EF03 %s new2 physical first and1200s prefixes ignore observation horizon',kind=>{
 const outputs=[];for(const H of[1,1200,3600,10800]){const s=kind==='coupled'?ermak('active2',H):brakeWeak(H),run=createShipModelRun('prefix',s);runShipModelChunk(run,1);const first=hash(physical(run));let at1200:string|undefined;if(H>=1200){runShipModelChunk(run,1199);at1200=hash(physical(run));}outputs.push({first,at1200});}
 for(const x of outputs)expect(x.first).toBe(outputs[0].first);for(const x of outputs.slice(1))expect(x.at1200).toBe(outputs[1].at1200);
});
it('EF08 entire paid weak E braking exceeds256s, reaches station physically, then services cargo',()=>{
 const run=createShipModelRun('weak-leg',brakeWeak());let minimum=Infinity;while(run.state.mission!.completedTrips<1&&run.state.timeSeconds<1200){runShipModelChunk(run,1);minimum=Math.min(minimum,run.state.mission!.positionM);if(run.state.timeSeconds<1058)expect(run.state.mission!.deliveredM3).toBe(0);}
 expect(minimum).toBeGreaterThanOrEqual(-1e-3);expect(run.state.mission!.completedTrips).toBe(1);expect(run.state.mission!.deliveredM3).toBe(30);const arrival=run.events.items().find(x=>x.kind==='mission-arrival');expect(arrival?.timeSeconds).toBeGreaterThan(1058);expect(arrival?.timeSeconds).toBeLessThan(1060);
 expect(run.state.fuelKg.diesel).toBeGreaterThan(0);expect(run.state.mission!.receivedFuelKg.diesel).toBeGreaterThan(0);
});
