import { test, expect, type Locator, type TestInfo } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import old from '../fitting/fixtures/station-service-old.json' with { type:'json' };
import { overview, traceChart } from '../../src/app/fitting-ui/trace-chart';
import type { RunResultV2 } from '../../src/runner/run';

async function checkGlyphGeometry(svg:Locator,info:TestInfo,name:string,boundaryCount:number){
 await svg.page().evaluate(()=>document.fonts.ready);
 const graph=await svg.evaluate(n=>{
  const v=(n as SVGSVGElement).viewBox.baseVal;
  return {viewBox:{x:v.x,y:v.y,width:v.width,height:v.height},texts:Array.from(n.querySelectorAll('text')).map(n=>{const b=n.getBBox(),r=n.getBoundingClientRect(),m=n.getScreenCTM()!;return {text:n.textContent,x:b.x,y:b.y,width:b.width,height:b.height,screenHeight:r.height,screenFontPixels:parseFloat(getComputedStyle(n).fontSize)*Math.hypot(m.a,m.b),boundary:n.hasAttribute('fill')};})};
 });
 await info.attach(name+'-glyph-boxes',{body:JSON.stringify(graph,null,2),contentType:'application/json'});
 const labels=graph.texts.filter(t=>t.boundary);expect(labels,name).toHaveLength(boundaryCount);
 for(const t of graph.texts){expect.soft(t.x,t.text!).toBeGreaterThanOrEqual(graph.viewBox.x);expect.soft(t.y,t.text!).toBeGreaterThanOrEqual(graph.viewBox.y);expect.soft(t.x+t.width,t.text!).toBeLessThanOrEqual(graph.viewBox.x+graph.viewBox.width);expect.soft(t.y+t.height,t.text!).toBeLessThanOrEqual(graph.viewBox.y+graph.viewBox.height);expect.soft(t.screenFontPixels,t.text!).toBeGreaterThanOrEqual(12);}
 for(let i=0;i<graph.texts.length;i++)for(let j=i+1;j<graph.texts.length;j++){const a=graph.texts[i],b=graph.texts[j];expect.soft(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`${name}: ${a.text} / ${b.text}`).toBe(true);}
 console.log(JSON.stringify({thermalGlyphGeometry:{name,...graph}}));
 return labels;
}

for(const width of [1440,390])test(`TD01–06 ${width} actual Worker cold explanation, graph, pause/step/A and atomic replay`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const action=async(id:string)=>{const l=page.locator(id);await l.evaluate(n=>n.scrollIntoView({block:'center'}));if(width===390)await l.tap();else await l.click();};
 const detail=async()=>{if(!await page.locator('#fit-more').evaluate(n=>(n as HTMLDetailsElement).open))await action('#fit-f3');};
 const exported=async(id:string)=>{await detail();const wait=page.waitForEvent('download');await action(id);return JSON.parse(await readFile((await(await wait).path())!,'utf8'));};
 const opened=async(x:unknown)=>page.locator('#fit-import').setInputFiles({name:'thermal.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(x))});
 await page.goto('/');await page.locator('#fit-preset').selectOption('pony:2');await page.locator('#fit-distance').fill('0');await page.locator('#fit-approach').fill('0');await page.locator('#fit-service').fill('0');await page.locator('#fit-temperature').fill('225');await page.locator('#fit-duration').fill('50');await page.locator('#fit-speed').selectOption('1');await action('#fit-start');
 await expect(page.locator('#fit-events')).toContainText('переохлаждение');await action('#fit-pause');await expect(page.locator('#fit-status')).toContainText('Пауза');await expect(page.locator('#fit-first')).toContainText('переохлаждение');
 await expect(page.locator('footer')).toContainText('thermal diagnostics v0.1');await expect(page.locator('[data-thermal-band="cold"]')).toHaveCount(1);await expect(page.locator('[data-thermal-band="hot"]')).toHaveCount(1);await expect(page.locator('[data-boundary="work-low"]')).toHaveCount(1);
 const labels=await checkGlyphGeometry(page.locator('.overview-charts figure').filter({hasText:'Температура'}).first().locator('svg'),info,'live-cold',4);
 const picture=info.outputPath('thermal-chart.png');await page.locator('[data-boundary="work-low"]').locator('xpath=ancestor::figure').screenshot({path:picture});await info.attach('thermal-chart',{path:picture,contentType:'image/png'});
 const before=await exported('#fit-export-result');expect(before.events.some((e:any)=>e.message.includes('Добыча')&&e.message.includes('переохлаждение'))).toBe(true);await action('#fit-step');const stepped=await exported('#fit-export-result');expect(stepped.state.timeSeconds).toBeGreaterThan(before.state.timeSeconds);await action('#fit-freeze');const a=await page.locator('.ab-side-a').innerHTML(),lastValid=await exported('#fit-export-result');
 const bad=structuredClone(lastValid);bad.events.push({timeSeconds:-1,kind:'diagnostic',message:'invalid'});await opened(bad);await expect(page.locator('#fit-error')).toContainText('events');expect(await exported('#fit-export-result')).toEqual(lastValid);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 await action('#fit-cancel');await action('#cancel-yes');await expect(page.locator('#fit-active-owner')).toContainText('активного теста нет');await opened(lastValid);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported('#fit-export-result')).toEqual(lastValid);await expect(page.locator('[data-thermal-band="cold"]')).toHaveCount(1);
 const thermalFigure=page.locator('.overview-charts figure').nth(1);
 await checkGlyphGeometry(thermalFigure.locator('svg'),info,'saved-replay',4);
 const empty=structuredClone(lastValid) as RunResultV2;for(const i of empty.spec.resolvedShip.instances)i.enabled=false;
 const disjoint=structuredClone(lastValid) as RunResultV2,laser=disjoint.spec.resolvedShip.instances.find(i=>i.enabled&&i.item.family==='mining')!;laser.item.gate={...laser.item.gate,low:580,workLow:600,workHigh:650,high:700};
 const sparse=structuredClone(lastValid) as RunResultV2;sparse.channels=[];sparse.buckets=[];
 const oldBounds=structuredClone(lastValid) as RunResultV2;for(const i of oldBounds.spec.resolvedShip.instances)delete i.item.gate.workLow;
 const cases=[
  {name:'empty-operations',r:empty,count:0,bands:0,note:'Нет включённых операций'},
  {name:'disjoint',r:disjoint,count:4,bands:0,note:'Нет общего рабочего'},
  {name:'missing-saved-channels',r:sparse,count:4,bands:2,note:'Сводные границы'},
  {name:'missing-old-work-low',r:oldBounds,count:3,bands:1,note:'Сводные границы'},
 ];
 for(const c of cases){
  const before=JSON.stringify(c.r),html=overview(c.r);expect(JSON.stringify(c.r)).toBe(before);
  await thermalFigure.evaluate((f,html)=>{const holder=document.createElement('div');holder.innerHTML=html;f.innerHTML=Array.from(holder.querySelectorAll('figure')).find(e=>e.querySelector('h3')?.textContent?.includes('Температура'))!.innerHTML;},html);
  await expect(thermalFigure).toContainText(c.note);await expect(thermalFigure.locator('[data-thermal-band]')).toHaveCount(c.bands);
  await checkGlyphGeometry(thermalFigure.locator('svg'),info,c.name,c.count);
  if(c.name==='empty-operations'||c.name==='disjoint')await info.attach(c.name,{body:await thermalFigure.screenshot(),contentType:'image/png'});
 }
 for(const ids of [['temperatureK'],[],['requestedW','deliveredW','generatorW']]){
  const name='detail-'+(ids.join('-')||'hidden-channels'),html=traceChart(lastValid,ids);
  await thermalFigure.evaluate((f,html)=>{f.innerHTML=html;},html);await checkGlyphGeometry(thermalFigure.locator('svg'),info,name,0);
  for(const id of ids)await expect(thermalFigure.locator(`[data-channel="${id}"]`)).toHaveCount(1);
 }
 await opened(lastValid);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported('#fit-export-result')).toEqual(lastValid);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 await opened(old.spec);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported('#fit-export-run')).toEqual(old.spec);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 const geometry=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,visual:visualViewport!.width}));expect(geometry).toEqual({inner:width,doc:width,visual:width});expect(errors).toEqual([]);await info.attach('thermal-worker',{body:JSON.stringify({before,stepped,geometry,labels,errors}),contentType:'application/json'});await context.close();
});
