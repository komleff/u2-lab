import { test,expect } from '@playwright/test';
import { getPresetFit } from '../../src/fitting/catalog';
import { readFile } from 'node:fs/promises';

for(const width of [1440,390])test(`CC04/05 ${width} actual Worker OFF log, stocks, pause, immutable replay and atomic rejection`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 const action=async(id:string)=>{const l=page.locator(id);await l.evaluate(n=>n.scrollIntoView({block:'center'}));if(width===390)await l.tap();else await l.click();};
 const open=async(x:unknown)=>page.locator('#fit-import').setInputFiles({name:'cooling.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(x))});
 const exported=async()=>{if(!await page.locator('#fit-more').evaluate(n=>(n as HTMLDetailsElement).open))await action('#fit-f3');const wait=page.waitForEvent('download');await action('#fit-export-result');return JSON.parse(await readFile((await(await wait).path())!,'utf8'));};
 const f=getPresetFit('pony:2');for(const [slot,itemId]of Object.entries({'power-1':'battery-S','power-2':'tank-hydrogen-S','power-3':'tank-hydrogen-S','signature-1':'h2-cooler-S','payload-1':'mining-industrial-S','payload-2':'cargo-bulk-S'})){const id='fit:'+slot;f.assignments[slot]=id;f.instances[id]={id,itemId,enabled:true};}
 await page.goto('/');await action('#fit-f3');await open(f);await expect(page.locator('#fit-error')).toHaveText('');
 await page.locator('#fit-duration').fill('50');await page.locator('#fit-temperature').fill('299');await page.locator('#fit-distance').fill('0');await page.locator('#fit-approach').fill('0');await page.locator('#fit-speed').selectOption('1');await action('#fit-start');
 await expect(page.locator('#fit-events')).toContainText('защита от переохлаждения300 K');await expect(page.locator('#fit-status')).toContainText('Выполняется');await action('#fit-pause');await expect(page.locator('#fit-status')).toContainText('Пауза');await expect(page.locator('footer')).toContainText('thermal controls v0.1');
 const measured=await exported();expect(measured.state.timeSeconds).toBeGreaterThan(0);expect(measured.state.usefulWork).toBeGreaterThan(0);expect(measured.state.consumptionKg['hydrogen:cooler:fit:signature-1']??0).toBe(0);expect(measured.state.fuelKg.hydrogen).toBe(measured.spec.initial.fuelKg.hydrogen);expect(measured.events.some((e:any)=>e.kind==='cooling-controls-version')).toBe(true);
 await action('#fit-freeze');const a=await page.locator('.ab-side-a').innerHTML();await action('#fit-cancel');await action('#cancel-yes');await expect(page.locator('#fit-active-owner')).toContainText('активного теста нет');
 await open(measured);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported()).toEqual(measured);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 const bad=structuredClone(measured);bad.channels[0]='coolingW:unknown-instance';await open(bad);await expect(page.locator('#fit-error')).toContainText('channels');expect(await exported()).toEqual(measured);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 if(process.env.U2_COOLING_OLD_RESULT){const old=JSON.parse(await readFile(process.env.U2_COOLING_OLD_RESULT,'utf8'));await open(old);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported()).toEqual(old);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);}
 expect(errors).toEqual([]);
 const geometry=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth}));expect(geometry).toEqual({inner:width,doc:width});await info.attach('cooling-worker',{body:JSON.stringify({url:page.url(),geometry,errors,state:measured.state,events:measured.events}),contentType:'application/json'});await context.close();
});
