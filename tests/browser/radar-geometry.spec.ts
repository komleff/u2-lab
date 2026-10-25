import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {serializeResultSnapshot} from '../../src/io/fitting-json';

const save=async(page:Page)=>{const waiting=page.waitForEvent('download');await page.locator('#sm-save-result').click();return readFileSync((await (await waiting).path())!,'utf8');};
test('ST4 actual Worker passport/result, frozen A vs next B, new/old literal reopen and unknown Pony geometry',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    (window as any).wi4Starts=[];(window as any).wi4Results=[];
    const Native=Worker;window.Worker=class extends Native{
      constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',({data})=>{if(data.type==='complete')(window as any).wi4Results.push(structuredClone(data.payload));});}
      postMessage(message:any,transfer:any=[]){if(message.type==='start')(window as any).wi4Starts.push(structuredClone(message.payload));super.postMessage(message,transfer);}
    };
  });
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');
  await page.locator('#sm-fit > summary').click();await expect(page.locator('#sm-radar-passport')).toBeVisible();
  await expect(page.locator('[data-radar-area="nose"]')).toHaveAttribute('data-value','54');await expect(page.locator('[data-radar-area="side"]')).toHaveAttribute('data-value','121.5');await expect(page.locator('#sm-radar-passport')).toContainText('H — ориентир, не утверждена');
  await page.locator('#sm-duration').fill('2');await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const aText=await save(page),a=JSON.parse(aText),ref=a.referenceMeasurements;
  expect(a.spec.resolvedShip.hull.id).toBe('sputnik');expect(a.spec.catalogVersion).toBe('ship-fitting-0.3.3');expect(ref.radar.noseCrossSectionM2).toBe(54);
  for(const key of ['current','mean','max']){
    const pair=ref.passive[key];expect(pair.rangeM).toBe(Math.max(pair.irM,pair.emM));
    await expect(page.locator('#sm-detection-distance [data-reference-distance="TOTAL:'+key+'"]')).toHaveAttribute('data-value',String(pair.rangeM));
    await expect(page.locator('#sm-detection-distance [data-reference-distance="TOTAL:'+key+'"]')).toHaveAttribute('data-channel',pair.channel);
  }
  await expect(page.locator('#sm-detection-distance [data-reference-distance="RADAR:current"]')).toHaveAttribute('data-value',String(ref.radar.rangeM));
  await page.locator('#sm-detection-distance').screenshot({path:testInfo.outputPath('wi4-measured-reference.png')});
  const referenceValues=await page.locator('#sm-detection-distance [data-reference-distance]').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-reference-distance'),value:n.getAttribute('data-value'),channel:n.getAttribute('data-channel'),text:n.textContent})));
  await page.getByRole('link',{name:'Графики',exact:true}).click();
  await expect(page.locator('#sm-chart-detection-distance [data-distance]')).toHaveCount(6);
  expect(await page.locator('#sm-chart-detection-distance [data-reference-distance]').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-reference-distance')?.replace('charts:',''),value:n.getAttribute('data-value'),channel:n.getAttribute('data-channel'),text:n.textContent})))).toEqual(referenceValues);
  expect(new Set(await page.locator('[data-reference-distance]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-reference-distance')))).size).toBe(8);
  expect(await save(page)).toBe(aText);
  const actual=await page.evaluate(()=>(window as any).wi4Results.at(-1));expect(serializeResultSnapshot(actual)).toBe(aText);
  await page.locator('#sm-freeze').click();const frozen=await page.locator('#sm-frozen-owner').textContent();await page.locator('#sm-copy').click();await expect(page.locator('#sm-comparison-b')).toContainText('нет измерения');
  await page.locator('#sm-preset').selectOption('severin-mir-h');await page.locator('#sm-duration').fill('2');await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const bText=await save(page),b=JSON.parse(bText);expect(b.spec.resolvedShip.hull.id).toBe('severin-mir');expect(b.referenceMeasurements.radar.noseCrossSectionM2).toBe(216);expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
  await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-run-id',a.runId);await expect(page.locator('#sm-comparison-b')).toHaveAttribute('data-run-id',b.runId);
  await page.locator('#sm-import').setInputFiles({name:'wi4-new.json',mimeType:'application/json',buffer:Buffer.from(aText)});expect(await save(page)).toBe(aText);
  const old=structuredClone(a);delete old.referenceMeasurements;const oldText=serializeResultSnapshot(old);
  await page.locator('#sm-import').setInputFiles({name:'wi4-old.json',mimeType:'application/json',buffer:Buffer.from(oldText)});await expect(page.locator('#sm-detection-distance')).toContainText('Старый результат: радар и max(IR, EM) не измерены');
  await expect(page.locator('#sm-detection-distance [data-reference-distance="TOTAL:current"]')).toHaveCount(0);expect(await save(page)).toBe(oldText);
  await page.screenshot({path:testInfo.outputPath('wi4-old-literal.png'),fullPage:true});
  await page.locator('#sm-preset').selectOption('pony-d');await page.locator('#sm-fit').evaluate(n=>(n as HTMLDetailsElement).open=true);await expect(page.locator('#sm-radar-passport')).toContainText('Нет габарита');
  expect(errors).toEqual([]);console.log('WI4_WORKER',JSON.stringify({runs:[a,b].map(r=>({runId:r.runId,hull:r.spec.resolvedShip.hull.id,catalog:r.spec.catalogVersion,fitRevision:r.spec.resolvedShip.fit.fitRevision,observer:r.spec.observer,interval:r.referenceMeasurements.intervalSeconds,noseM2:r.referenceMeasurements.radar.noseCrossSectionM2,total:r.referenceMeasurements.passive.current,radarM:r.referenceMeasurements.radar.rangeM})),oldLiteralBytes:oldText.length,errors}));
});
