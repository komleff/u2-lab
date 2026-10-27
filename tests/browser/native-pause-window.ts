import {expect,type Page} from '@playwright/test';

// Только lifecycle fixtures: настоящий первый chunk остаётся pending до native Pause.
// Production pacing проверяют отдельные неинструментированные mission/thermal тесты.
export async function nativePauseWindow(page:Page){
 await page.addInitScript(()=>{
  const NativeWorker=Worker,state={armed:false,disarmed:false,runId:'',held:null as any,released:null as any,order:[] as string[]};
  (window as any).__nativePauseWindow=state;
  window.Worker=class extends NativeWorker{
   private pending?:[any,any[]];
   postMessage(message:any,...args:any[]){
    if(message.type==='start'&&state.armed&&!state.disarmed){state.armed=false;state.runId=message.runId;}
    if(message.type==='telemetry-ack'&&message.runId===state.runId){
     if(this.pending)throw Error('Pause fixture: второй pending ACK');
     this.pending=[message,args];state.held=structuredClone(message);state.order.push('held');return;
    }
    (super.postMessage as any)(message,...args);
    if(message.type==='pause'&&message.runId===state.runId){
     state.order.push('pause');state.disarmed=true;state.runId='';
     if(this.pending){const [ack,ackArgs]=this.pending;this.pending=undefined;state.released=structuredClone(ack);state.order.push('released');(super.postMessage as any)(ack,...ackArgs);}
    }
   }
  };
 });
 return {
  arm:()=>page.evaluate(()=>{const state=(window as any).__nativePauseWindow;if(state.armed||state.disarmed||state.runId)throw Error('Pause fixture: одно окно на страницу');state.armed=true;}),
  pause:async()=>{
   await expect.poll(()=>page.evaluate(()=>(window as any).__nativePauseWindow.held!==null)).toBe(true);
   await expect(page.locator('#sm-status')).toHaveText('running');
   const value=Number(await page.locator('#sm-progress').getAttribute('value')),max=Number(await page.locator('#sm-progress').getAttribute('max'));
   expect(value).toBeGreaterThan(0);expect(value).toBeLessThan(max);
   await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
   await expect(page.locator('#sm-progress')).toHaveAttribute('value',String(value));
   const receipt=await page.evaluate(()=>(window as any).__nativePauseWindow);
   expect(receipt.released).toEqual(receipt.held);expect(receipt.order).toEqual(['held','pause','released']);expect(receipt.disarmed).toBe(true);expect(receipt.armed).toBe(false);
  },
 };
}
