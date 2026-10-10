import {test,expect} from '@playwright/test';
import {readdirSync} from 'node:fs';
import {fixture} from '../model-v3/fixture';
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
