import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';

async function saved(page:Page,id:string){
  const pending=page.waitForEvent('download');await page.locator('#'+id).click();
  return readFileSync((await (await pending).path())!,'utf8');
}
test('fresh Pony menu choice starts the actual unchanged H3600 mission with its accepted 225/450 route',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await page.locator('#sm-preset').selectOption('pony-d');
  await expect(page.locator('#sm-start')).toBeEnabled();await expect(page.locator('#sm-vfa')).toHaveValue('225');await expect(page.locator('#sm-cruise')).toHaveValue('450');
  await expect(page.locator('#sm-duration')).toHaveValue('3600');
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});
  await expect(page.locator('#sm-error')).toBeEmpty();const result=JSON.parse(await saved(page,'sm-save-result'));
  expect(result.spec.resolvedShip.hull.id).toBe('pony');expect(result.spec.mission.route).toMatchObject({referenceVfaMS:225,speedMultiplier:2,cruiseSpeedMS:450});
  expect(result.state.timeSeconds).toBeGreaterThan(0);expect(result.state.timeSeconds).toBeLessThanOrEqual(3600);
  expect(result.state.mission.minedM3).toBeGreaterThanOrEqual(0);expect(result.state.mission.deliveredM3).toBeGreaterThanOrEqual(0);expect(errors).toEqual([]);
  await info.attach('pony-h3600-outcome',{body:JSON.stringify({route:result.spec.mission.route,time:result.state.timeSeconds,mission:result.state.mission,errors}),contentType:'application/json'});
});
for(const width of [1440,390])test(`fresh Pony supports all four V_FA factors without prior route edits at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('#sm-preset').selectOption('pony-d');
  await expect(page.locator('#sm-start')).toBeEnabled();await expect(page.locator('#sm-vfa')).toHaveValue('225');
  await page.locator('#sm-duration').fill('1');await page.locator('#sm-duration').press('Tab');
  for(const multiplier of [1,2,3,4]){
    await page.locator('#sm-speed-policy').selectOption({label:`${multiplier}×V_FA`});await expect(page.locator('#sm-cruise')).toHaveValue(String(225*multiplier));
    await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
    const text=await saved(page,'sm-save-result'),result=JSON.parse(text);
    expect(result.spec.mission.route).toMatchObject({referenceVfaMS:225,speedMultiplier:multiplier,cruiseSpeedMS:225*multiplier});
    await page.locator('#sm-import').setInputFiles({name:'pony-result.json',mimeType:'application/json',buffer:Buffer.from(text)});
    expect(await saved(page,'sm-save-result')).toBe(text);
  }
});
