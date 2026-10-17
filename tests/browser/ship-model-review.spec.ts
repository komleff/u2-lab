import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {getPresetFit} from '../../src/fitting/catalog';
import {serializeFit} from '../../src/io/fitting-json';
test('ordinary insecure HTTP owns /4 start and saved checkpoint resume without randomUUID',async({page,baseURL})=>{
 await page.route('http://u2-lab-http.invalid/**',async route=>{const u=new URL(route.request().url());const response=await route.fetch({url:baseURL+u.pathname+u.search});await route.fulfill({response});});
 await page.goto('http://u2-lab-http.invalid/?shipModel=experimental');expect(await page.evaluate(()=>({secure:isSecureContext,uuid:typeof crypto.randomUUID,random:typeof crypto.getRandomValues}))).toEqual({secure:false,uuid:'undefined',random:'function'});
 await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('60');await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).toBeVisible();await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');await expect(page.locator('#sm-error')).toBeEmpty();
 const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const file=await downloading;const saved=JSON.parse(readFileSync((await file.path())!,'utf8'));expect(saved.runId).toMatch(/^[0-9a-f]{32}$/);expect(saved.state.timeSeconds).toBeLessThan(60);
 await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');await page.locator('#sm-import').setInputFiles((await file.path())!);await expect(page.locator('#sm-status')).toHaveText('paused');await page.locator('#sm-transport > summary').click();await page.locator('#sm-checkpoint').click();await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-error')).toBeEmpty();
 const completed=page.waitForEvent('download');await page.locator('#sm-save-result').click();const result=JSON.parse(readFileSync((await (await completed).path())!,'utf8'));expect(result.runId).toMatch(/^[0-9a-f]{32}$/);expect(result.runId).not.toBe(saved.runId);expect(result.state.timeSeconds).toBe(60);
});
test('native actual Worker explains precritical hot/cold work and refuses an unsupported observer upload atomically',async({page})=>{
 await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'literal-0.3.0.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('sputnik','ship-fitting-0.3.0')))});await page.locator('#sm-background').fill('100');await page.locator('#sm-background').press('Tab');await page.locator('#sm-duration').fill('1');
 for(const [T,work,limited]of [[450,1500300,false],[525,375075,true],[225,375075,true]]as const){
  await page.locator('#sm-temperature').fill(String(T));await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const ledger=JSON.parse((await page.locator('#sm-ledger pre').textContent())!);expect(ledger.telemetry.usefulWorkW).toBe(work);
  const limiter=await page.locator('#sm-results>p').nth(1).textContent();if(limited){expect(limiter).not.toContain('Первое ограничение: нет');expect(limiter).toMatch(/builtin:|fit:/);}else expect(limiter).toContain('Первое ограничение: нет');
 }
 const inputDownload=page.waitForEvent('download');await page.locator('#sm-save-result').click();const source=JSON.parse(readFileSync((await (await inputDownload).path())!,'utf8'));
 source.spec.initialState.temperatureK=450;source.spec.initialState.chargeJ=0;await page.locator('#sm-import').setInputFiles({name:'empty-power-run.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(source.spec))});await expect(page.locator('#sm-error')).toBeEmpty();await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
 const empty=JSON.parse((await page.locator('#sm-ledger pre').textContent())!);expect(empty.telemetry.deliveredW).toBe(0);expect(empty.telemetry.usefulWorkW).toBe(0);await expect(page.locator('#sm-results>p').nth(1)).toContainText('power-limited');
 const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const saved=JSON.parse(readFileSync((await (await downloading).path())!,'utf8')),before=await page.locator('#sm-results').textContent();saved.spec.observer.presetId='unsupported-preset';
 await page.locator('#sm-import').setInputFiles({name:'unsupported-observer.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await expect(page.locator('#sm-error')).toContainText('observer.presetId');expect(await page.locator('#sm-results').textContent()).toBe(before);
});
