import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
async function save(page:Page,id:string){const download=page.waitForEvent('download');await page.locator('#'+id).click();return readFileSync((await(await download).path())!,'utf8');}
for(const lifecycle of [false,true])test(lifecycle
 ? 'mission Sputnik-D H3600 lifecycle: pause, checkpoint export, resume and retained graphs'
 : 'mission cold fresh Sputnik-D H3600 real Worker: strict 20s, progress, physical ore and live graphs',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('#sm-preset').selectOption('sputnik-d');
 await expect(page.locator('#sm-work-mode')).toHaveValue('mission');await expect(page.locator('#sm-duration')).toHaveValue('3600');await expect(page.locator('#sm-distance')).toHaveValue('100');await expect(page.locator('#sm-vfa')).toHaveValue('250');await expect(page.locator('#sm-cruise')).toHaveValue('500');await expect(page.locator('#sm-repeat')).toBeChecked();await expect(page.locator('#sm-station')).toBeChecked();
 const spec=JSON.parse(await save(page,'sm-save-run'));expect(spec.modelVersion).toBe('ship-fitting-ship-model-mission-0.1');expect(spec.catalogVersion).toBe('ship-fitting-0.3.4');expect(spec.mission.route.distanceM).toBe(100000);expect(spec.mission.version).toBe('ship-mission/2');expect(spec.durationSeconds).toBe(3600);
 const progress:number[]=[],graphEnds:string[]=[];
 await page.evaluate(()=>{const samples:{time:number;graph:string}[]=[];(window as any).__missionSamples=samples;const record=()=>{const p=document.querySelector<HTMLProgressElement>('#sm-progress'),graph=document.querySelector('#lab-channels svg [data-time]');if(p&&p.value>0&&p.value<p.max&&samples.at(-1)?.time!==p.value)samples.push({time:p.value,graph:graph?.getAttribute('data-time')??''});};new MutationObserver(record).observe(document.body,{childList:true,subtree:true,attributes:true});});
 const timestamps:Record<string,number>={startBeforeClick:Date.now()};await page.locator('#sm-start').click();timestamps.startClickReturned=Date.now();await expect(page.locator('#sm-progress')).toHaveAttribute('value',/^[1-9]/);timestamps.firstProgressObserved=Date.now();
 if(lifecycle){
  timestamps.pauseBeforeClick=Date.now();await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');timestamps.pausedObserved=Date.now();await expect(page.locator('#sm-error')).toBeEmpty();
  timestamps.checkpointExportBefore=Date.now();const paused=JSON.parse(await save(page,'sm-save-result'));timestamps.checkpointExportAfter=Date.now();expect(paused.state.timeSeconds).toBeGreaterThan(0);expect(paused.state.timeSeconds).toBeLessThan(3600);timestamps.resumeBeforeClick=Date.now();await page.locator('#sm-resume').click();timestamps.resumeClickReturned=Date.now();
 }
 await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});timestamps.completeObserved=Date.now();
 const wallMs=timestamps.completeObserved-timestamps.startBeforeClick;
 // AC7 измеряет непрерывный fresh-run; пользовательская пауза и экспорт относятся к AC6.
 if(!lifecycle)expect(wallMs).toBeLessThan(20000);
 await expect(page.locator('#sm-progress-text')).toHaveText('3600 / 3600 с · 100%');await expect(page.locator('#sm-error')).toBeEmpty();
 const result=JSON.parse(await save(page,'sm-save-result'));expect(result.state.timeSeconds).toBe(3600);expect(result.state.mission.completedTrips).toBeGreaterThan(0);expect(result.state.mission.deliveredM3).toBeGreaterThan(0);expect(result.state.mission.minedM3).toBeCloseTo(result.state.mission.deliveredM3+result.state.mission.onboardM3,8);expect(result.state.mission.stage).not.toBe('complete');
 const samples=await page.evaluate(()=>(window as any).__missionSamples as {time:number;graph:string}[]);for(const s of samples){progress.push(s.time);graphEnds.push(s.graph);}expect(new Set(progress).size).toBeGreaterThanOrEqual(2);expect(new Set(graphEnds).size).toBeGreaterThanOrEqual(2);
 await expect(page.locator('[data-mission="overview:deliveredM3"]')).toHaveAttribute('data-value',String(result.state.mission.deliveredM3));expect(errors).toEqual([]);
 const evidence={measurement:lifecycle?'lifecycle':'cold-fresh',wallMs,timestamps,progress,graphEnds,mission:result.state.mission,services:result.events.filter((e:any)=>e.kind==='mission-service'),residualJ:result.metrics.totalResidualJ,errors};writeFileSync(info.outputPath('mission-worker-evidence.json'),JSON.stringify(evidence,null,2));await info.attach('mission-worker-evidence',{path:info.outputPath('mission-worker-evidence.json'),contentType:'application/json'});console.log('MISSION_BROWSER '+JSON.stringify(evidence));
 await page.screenshot({path:info.outputPath('mission-desktop.png'),fullPage:true});
});
for(const width of [820,390])test(`mission route and progress accessible at ${width}`,async({page})=>{await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.locator('#sm-distance')).toBeVisible();await expect(page.locator('#sm-progress')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);await page.locator('#sm-distance').fill('10');await page.locator('#sm-distance').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});await expect(page.locator('#sm-error')).toBeEmpty();});
