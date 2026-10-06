import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import old from '../fitting/fixtures/station-service-old.json' with { type:'json' };

for(const width of [1440,390])test(`TD01–06 ${width} actual Worker cold explanation, graph, pause/step/A and atomic replay`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const action=async(id:string)=>{const l=page.locator(id);await l.evaluate(n=>n.scrollIntoView({block:'center'}));if(width===390)await l.tap();else await l.click();};
 const detail=async()=>{if(!await page.locator('#fit-more').evaluate(n=>(n as HTMLDetailsElement).open))await action('#fit-f3');};
 const exported=async(id:string)=>{await detail();const wait=page.waitForEvent('download');await action(id);return JSON.parse(await readFile((await(await wait).path())!,'utf8'));};
 const opened=async(x:unknown)=>page.locator('#fit-import').setInputFiles({name:'thermal.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(x))});
 await page.goto('/');await page.locator('#fit-preset').selectOption('pony:2');await page.locator('#fit-distance').fill('0');await page.locator('#fit-approach').fill('0');await page.locator('#fit-service').fill('0');await page.locator('#fit-temperature').fill('225');await page.locator('#fit-duration').fill('50');await page.locator('#fit-speed').selectOption('1');await action('#fit-start');
 await expect(page.locator('#fit-events')).toContainText('переохлаждение');await action('#fit-pause');await expect(page.locator('#fit-status')).toContainText('Пауза');await expect(page.locator('#fit-first')).toContainText('переохлаждение');
 await expect(page.locator('footer')).toContainText('thermal diagnostics v0.1');await expect(page.locator('[data-thermal-band="cold"]')).toHaveCount(1);await expect(page.locator('[data-thermal-band="hot"]')).toHaveCount(1);await expect(page.locator('[data-boundary="work-low"]')).toHaveCount(1);
 await page.evaluate(()=>document.fonts.ready);
 const graph=await page.locator('[data-boundary="work-low"]').evaluate(n=>{
  const svg=n.closest('svg')!,v=svg.viewBox.baseVal;
  return {viewBox:{x:v.x,y:v.y,width:v.width,height:v.height},texts:Array.from(svg.querySelectorAll('text')).map(n=>{const b=n.getBBox(),r=n.getBoundingClientRect();return {text:n.textContent,x:b.x,y:b.y,width:b.width,height:b.height,screenHeight:r.height,boundary:n.hasAttribute('fill')};})};
 });
 await info.attach('actual-thermal-glyph-boxes',{body:JSON.stringify(graph,null,2),contentType:'application/json'});
 const labels=graph.texts.filter(t=>t.boundary);expect(labels).toHaveLength(4);
 for(const t of graph.texts){expect(t.x,t.text!).toBeGreaterThanOrEqual(graph.viewBox.x);expect(t.y,t.text!).toBeGreaterThanOrEqual(graph.viewBox.y);expect(t.x+t.width,t.text!).toBeLessThanOrEqual(graph.viewBox.x+graph.viewBox.width);expect(t.y+t.height,t.text!).toBeLessThanOrEqual(graph.viewBox.y+graph.viewBox.height);}
 for(const l of labels)expect(l.screenHeight,l.text!).toBeGreaterThanOrEqual(12);
 for(let i=0;i<graph.texts.length;i++)for(let j=i+1;j<graph.texts.length;j++){const a=graph.texts[i],b=graph.texts[j];expect(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,`${a.text} / ${b.text}`).toBe(true);}
 console.log(JSON.stringify({thermalGlyphGeometry:{width,...graph}}));
 const picture=info.outputPath('thermal-chart.png');await page.locator('[data-boundary="work-low"]').locator('xpath=ancestor::figure').screenshot({path:picture});await info.attach('thermal-chart',{path:picture,contentType:'image/png'});
 const before=await exported('#fit-export-result');expect(before.events.some((e:any)=>e.message.includes('Добыча')&&e.message.includes('переохлаждение'))).toBe(true);await action('#fit-step');const stepped=await exported('#fit-export-result');expect(stepped.state.timeSeconds).toBeGreaterThan(before.state.timeSeconds);await action('#fit-freeze');const a=await page.locator('.ab-side-a').innerHTML(),lastValid=await exported('#fit-export-result');
 const bad=structuredClone(lastValid);bad.events.push({timeSeconds:-1,kind:'diagnostic',message:'invalid'});await opened(bad);await expect(page.locator('#fit-error')).toContainText('events');expect(await exported('#fit-export-result')).toEqual(lastValid);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 await action('#fit-cancel');await action('#cancel-yes');await expect(page.locator('#fit-active-owner')).toContainText('активного теста нет');await opened(lastValid);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported('#fit-export-result')).toEqual(lastValid);await expect(page.locator('[data-thermal-band="cold"]')).toHaveCount(1);
 await opened(old.spec);await expect(page.locator('#fit-error')).toHaveText('');expect(await exported('#fit-export-run')).toEqual(old.spec);expect(await page.locator('.ab-side-a').innerHTML()).toBe(a);
 const geometry=await page.evaluate(()=>({inner:innerWidth,doc:document.documentElement.scrollWidth,visual:visualViewport!.width}));expect(geometry).toEqual({inner:width,doc:width,visual:width});expect(errors).toEqual([]);await info.attach('thermal-worker',{body:JSON.stringify({before,stepped,geometry,labels,errors}),contentType:'application/json'});await context.close();
});
