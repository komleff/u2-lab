import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
for(const [width,height] of [[360,780],[390,844],[820,1101],[1440,900]])test(`UF06 compact disclosures and signature navigation ${width}×${height}`,async({browser},info)=>{
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<=390,isMobile:width<=390,acceptDownloads:true});
 const p=await context.newPage(),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
 const action=async(selector:string)=>{const n=p.locator(selector);await n.scrollIntoViewIfNeeded();width<=390?await n.tap():await n.click();};
 const folds=['#fit-modules-details','#fit-journal-details','#compare-variants-details'];
 try{
  await p.goto('/');
  const nav=await p.locator('.ui-header nav').evaluate(n=>[...n.querySelectorAll('a')].map(a=>{const r=document.createRange();r.selectNodeContents(a);return{label:a.textContent,box:a.getBoundingClientRect().toJSON(),text:r.getBoundingClientRect().toJSON()};}));
  for(const a of nav){expect(a.text.left,a.label!).toBeGreaterThanOrEqual(a.box.left);expect(a.text.right,a.label!).toBeLessThanOrEqual(a.box.right);expect(a.box.height).toBeGreaterThanOrEqual(44);}
  for(let i=1;i<nav.length;i++)expect(nav[i-1].text.right).toBeLessThanOrEqual(nav[i].text.left);
  await info.attach('navigation-geometry',{body:JSON.stringify({width,nav}),contentType:'application/json'});
  for(const id of folds){await expect(p.locator(id)).toHaveCount(1);expect(await p.locator(id).evaluate(n=>(n as HTMLDetailsElement).open)).toBe(false);}
  await expect(p.locator('#lab-first-limiter')).toBeVisible();await expect(p.locator('#fit-comparison')).toBeVisible();
  await expect(p.locator('#fit-nav-signatures')).toHaveAttribute('href','#sig-controls');await action('#fit-nav-signatures');await expect(p).toHaveURL(/#sig-controls$/);
  await p.screenshot({path:info.outputPath('fresh-closed.png')});
  const r=await readFile('tests/signatures/fixtures/received-result.json','utf8');await p.locator('#fit-import').setInputFiles({name:'received.json',mimeType:'application/json',buffer:Buffer.from(r)});
  await expect(p.locator('#fit-nav-signatures')).toHaveAttribute('href','#sig-overview');await action('#fit-nav-signatures');await expect(p).toHaveURL(/#sig-overview$/);
  await expect(p.locator('.signature-chart')).toHaveCount(2);
  await action('#fit-modules-details > summary');await expect(p.locator('#fit-modules-details table')).toBeVisible();
  await p.locator('#fit-journal-details > summary').focus();await p.keyboard.press('Enter');await expect(p.locator('#fit-events')).toBeVisible();await action('[data-event-filter="phase"]');
  await action('#fit-nav-compare');expect(await p.locator('#compare-variants-details').evaluate(n=>(n as HTMLDetailsElement).open)).toBe(true);
  await p.locator('#compare-sort').selectOption('rate-desc');await p.locator('#compare-base').selectOption('A');
  await action('[data-variant="B"][aria-pressed]');await action('[data-variant="A"][aria-pressed]');
  await p.locator('#fit-duration').fill('60');await p.locator('#fit-duration').blur();await p.locator('#fit-speed').selectOption('1');await action('#fit-start');await expect(p.locator('#fit-time')).not.toHaveText('0 с / 60 с');
  await action('#fit-pause');await expect(p.locator('#fit-status')).toContainText('Пауза');
  for(const id of folds)expect(await p.locator(id).evaluate(n=>(n as HTMLDetailsElement).open)).toBe(true);
  await expect(p.locator('[data-event-filter="phase"]')).toHaveAttribute('aria-pressed','true');await expect(p.locator('#compare-sort')).toHaveValue('rate-desc');await expect(p.locator('#compare-base')).toHaveValue('A');
  expect(await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  await action('#fit-nav-signatures');await p.screenshot({path:info.outputPath('measurement.png')});expect(errors).toEqual([]);
 }finally{await context.close();}
});
