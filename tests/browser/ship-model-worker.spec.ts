import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {fixture,checkpointFixture} from '../model-v3/fixture';
import {loadCandidateCatalog,getPresetFit} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
test('actual Worker /4 starts production branch and ACKs pause while preserving the new state',async({page})=>{
  const file=readdirSync('dist/assets').find(n=>n.startsWith('worker-')&&n.endsWith('.js'))!,spec=fixture();
  await page.goto('/?mode=legacy');
  const receipt=await page.evaluate(async({file,spec})=>new Promise<any>((resolve,reject)=>{
    const worker=new Worker('/assets/'+file,{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(new Error('/4 Worker timeout'));},10000);let chunk:any;
    worker.onmessage=({data})=>{if(data.type==='error'){clearTimeout(timer);worker.terminate();reject(new Error(data.payload));}
      if(data.type==='chunk'){chunk=data;worker.postMessage({runId:'actual-v3',commandId:2,type:'pause'});}
      if(data.type==='control-ack'&&data.control==='pause')worker.postMessage({runId:'actual-v3',commandId:3,type:'snapshot'});
      if(data.type==='snapshot'){clearTimeout(timer);worker.terminate();resolve({chunk,snapshot:data.payload});}};
    worker.postMessage({runId:'actual-v3',commandId:1,type:'start',payload:{spec,maxSteps:1}});
  }),{file,spec});
  expect(receipt.chunk.payload.state.timeSeconds).toBe(1);expect(receipt.snapshot.status).toBe('paused');expect(receipt.snapshot.spec.schemaVersion).toBe('u2-lab/4');
  expect(receipt.snapshot.state.timeSeconds).toBe(1);expect(receipt.chunk.payload.telemetry.totalResidualJ).toBeCloseTo(0,5);expect(receipt.snapshot.state.rng).toEqual(spec.initialState.rng);
});
test('actual Worker stock terminal/60s result reopens and resumes with the same terminal latch and RNG',async({page})=>{
 const file=readdirSync('dist/assets').find(n=>n.startsWith('worker-')&&n.endsWith('.js'))!,c=loadCandidateCatalog('ship-fitting-0.3.0'),checked=makeShipModelMiningRun(getPresetFit('stealth-reference',c.version),c,{temperatureK:400,durationSeconds:2,mode:'Masking',action:'idle'});
 if(!checked.ok)throw Error(JSON.stringify(checked.errors));const spec=checked.value,m=spec.initialState.modules['fit:signature-1'];m.durabilityR=-0.999999;m.firstNegativeCrossing=true;m.emergencyExposureSeconds=59;
 await page.goto('/?mode=legacy');const receipt=await page.evaluate(async({file,spec})=>{
  const execute=(checkpoint?:any)=>new Promise<any>((resolve,reject)=>{
   const worker=new Worker('/assets/'+file,{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(Error('terminal Worker timeout'));},10000);
   worker.onmessage=({data})=>{
    if(data.type==='error'){clearTimeout(timer);worker.terminate();reject(Error(data.payload));}
    if(data.type==='chunk')worker.postMessage({runId:'terminal-actual',commandId:2,type:'pause'});
    if(data.type==='control-ack'&&data.control==='pause')worker.postMessage({runId:'terminal-actual',commandId:3,type:'snapshot'});
    if(data.type==='snapshot'||data.type==='complete'){clearTimeout(timer);worker.terminate();resolve(JSON.parse(JSON.stringify(data.payload,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v)));}
   };
   worker.postMessage({runId:'terminal-actual',commandId:1,type:'start',payload:{...(checkpoint?{checkpoint}:{spec}),maxSteps:1}});
  });
  const saved=await execute(),resumed=await execute(saved);return {saved,resumed};
 },{file,spec});
 expect(receipt.saved.state.timeSeconds).toBe(1);expect(receipt.saved.state.modules['fit:signature-1']).toMatchObject({durabilityR:-1,durabilityStopped:true,emergencyExposureSeconds:0});expect(receipt.saved.state.rng).toEqual(spec.initialState.rng);
 expect(receipt.resumed.state.timeSeconds).toBe(2);expect(receipt.resumed.state.modules['fit:signature-1']).toEqual(receipt.saved.state.modules['fit:signature-1']);expect(receipt.resumed.state.rng).toEqual(receipt.saved.state.rng);
});
test('CP05 actual Worker /4 pause-export-import-resume 59+1 matches 60 without reroll; future import is atomic',async({page})=>{
  const file=readdirSync('dist/assets').find(n=>n.startsWith('worker-')&&n.endsWith('.js'))!,{spec,instanceId}=checkpointFixture();
  await page.goto('/?mode=legacy');
  const receipt=await page.evaluate(async({file,spec})=>{
    const pack=(x:any)=>JSON.parse(JSON.stringify(x,(_,v)=>ArrayBuffer.isView(v)?Array.from(v as Float64Array):v));
    const execute=(stopAt:number,checkpoint?:any)=>new Promise<any>((resolve,reject)=>{
      const worker=new Worker('/assets/'+file,{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(Error('CP05 Worker timeout'));},15000);
      worker.onmessage=({data})=>{
        if(data.type==='error'){clearTimeout(timer);worker.terminate();reject(Error(data.payload));}
        if(data.type==='chunk'){if(data.payload.state.timeSeconds>=stopAt)worker.postMessage({runId:'cp05actual',commandId:2,type:'pause'});else worker.postMessage({runId:'cp05actual',type:'telemetry-ack',chunkId:data.chunkId});}
        if(data.type==='control-ack'&&data.control==='pause')worker.postMessage({runId:'cp05actual',commandId:3,type:'snapshot'});
        if(data.type==='snapshot'){clearTimeout(timer);worker.terminate();resolve(pack(data.payload));}
      };
      worker.postMessage({runId:'cp05actual',commandId:1,type:'start',payload:{...(checkpoint?{checkpoint}:{spec}),maxSteps:1}});
    });
    const saved=await execute(59),continuous=await execute(60),resumed=await execute(60,saved),repeated=await execute(60,saved);
    const atomic=await new Promise<any>((resolve,reject)=>{
      const worker=new Worker('/assets/'+file,{type:'module'}),timer=setTimeout(()=>{worker.terminate();reject(Error('CP05 atomic import timeout'));},10000);let refused=false;
      worker.onmessage=({data})=>{
        if(data.type==='control-ack'&&data.control==='start'){const bad=pack(continuous);bad.state.stateVersion='ship-state/99';worker.postMessage({runId:'future',commandId:2,type:'start',payload:{checkpoint:bad}});}
        if(data.type==='error'){refused=true;worker.postMessage({runId:'cp05actual',commandId:3,type:'snapshot'});}
        if(data.type==='snapshot'){clearTimeout(timer);worker.terminate();resolve({refused,snapshot:pack(data.payload)});}
      };worker.postMessage({runId:'cp05actual',commandId:1,type:'start',payload:{checkpoint:continuous,maxSteps:1}});
    });
    return {saved,continuous,resumed,repeated,atomic};
  },{file,spec});
  expect(receipt.saved.state.timeSeconds).toBe(59);expect(receipt.saved.state.rng.state).toBe(424242);
  expect(receipt.resumed).toEqual(receipt.continuous);expect(receipt.repeated).toEqual(receipt.continuous);
  expect(receipt.resumed.state.rng.state).toBe(724273890);expect(receipt.resumed.state.modules[instanceId].durabilityStopped).toBe(true);
  expect(receipt.atomic.refused).toBe(true);expect(receipt.atomic.snapshot).toEqual(receipt.continuous);
});
