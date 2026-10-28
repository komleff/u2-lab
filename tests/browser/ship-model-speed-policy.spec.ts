import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {serializeExperiment} from '../../src/io/fitting-json';
import {nativePauseWindow} from './native-pause-window';

async function saved(page:Page,id:string){
  const pending=page.waitForEvent('download');await page.locator('#'+id).click();
  return readFileSync((await (await pending).path())!,'utf8');
}
async function edit(page:Page,id:string,value:number){
  await page.locator('#'+id).fill(String(value));await page.locator('#'+id).press('Tab');
}
const upload=(text:string)=>({name:'speed-policy.json',mimeType:'application/json',buffer:Buffer.from(text)});

for(const width of [1440,390])test(`speed policy selects 1x/2x/3x/4x and the actual Worker captures the route at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/');
  await expect(page.locator('#sm-cruise')).toHaveValue('500');
  await expect(page.locator('#sm-speed-policy option:checked')).toHaveText('2×V_FA');
  await expect(page.getByRole('option',{name:'1×V_FA',exact:true})).toBeAttached();
  await edit(page,'sm-duration',1);
  for(const multiplier of [1,3,4,2]){
    await page.locator('#sm-speed-policy').selectOption({label:`${multiplier}×V_FA`});
    await expect(page.locator('#sm-cruise')).toHaveValue(String(250*multiplier));
    await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
    const result=JSON.parse(await saved(page,'sm-save-result'));
    expect(result.spec.mission.route).toMatchObject({speedPolicy:'vfa',speedMultiplier:multiplier,referenceVfaMS:250,cruiseSpeedMS:250*multiplier});
  }
  await page.locator('#sm-speed-policy').selectOption({label:'3×V_FA'});await edit(page,'sm-vfa',200);
  await expect(page.locator('#sm-cruise')).toHaveValue('600');
  const route=JSON.parse(await saved(page,'sm-save-run')).mission.route;
  await page.locator('#sm-preset').selectOption('severin-mir-d');
  expect(JSON.parse(await saved(page,'sm-save-run')).mission.route).toEqual(route);
  await expect(page.locator('#sm-speed-policy option:checked')).toHaveText('3×V_FA');
});

test('imported fractional V_FA multiplier is shown literally and V_FA edits use it',async({page})=>{
  await page.goto('/');const spec=JSON.parse(await saved(page,'sm-save-run'));
  Object.assign(spec.mission.route,{referenceVfaMS:150,speedMultiplier:1.5,cruiseSpeedMS:225});spec.durationSeconds=1;
  const literal=serializeExperiment(spec);await page.locator('#sm-import').setInputFiles(upload(literal));
  await expect(page.locator('#sm-speed-policy option:checked')).toHaveText('1.5×V_FA');
  await expect(page.locator('#sm-cruise')).toHaveValue('225');expect(await saved(page,'sm-save-run')).toBe(literal);
  await edit(page,'sm-vfa',300);await expect(page.locator('#sm-cruise')).toHaveValue('450');
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const resultText=await saved(page,'sm-save-result'),route=JSON.parse(resultText).spec.mission.route;
  expect(route).toMatchObject({speedPolicy:'vfa',speedMultiplier:1.5,referenceVfaMS:300,cruiseSpeedMS:450});
  await page.locator('#sm-import').setInputFiles(upload(resultText));
  await expect(page.locator('#sm-speed-policy option:checked')).toHaveText('1.5×V_FA');
  expect(await saved(page,'sm-save-result')).toBe(resultText);
});

test('custom cruise remains literal after V_FA/preset edits and paused ownership blocks route edits',async({page})=>{
  const pauseWindow=await nativePauseWindow(page);await page.goto('/');
  await page.locator('#sm-speed-policy').selectOption({label:'4×V_FA'});
  await edit(page,'sm-cruise',777);await edit(page,'sm-vfa',125);
  await expect(page.locator('#sm-speed-policy')).toHaveValue('custom');await expect(page.locator('#sm-cruise')).toHaveValue('777');
  const literal=await saved(page,'sm-save-run'),route=JSON.parse(literal).mission.route;
  expect(route).toMatchObject({speedPolicy:'custom',speedMultiplier:4,referenceVfaMS:125,cruiseSpeedMS:777});
  await page.locator('#sm-preset').selectOption('severin-mir-d');expect(JSON.parse(await saved(page,'sm-save-run')).mission.route).toEqual(route);
  await page.locator('#sm-import').setInputFiles(upload(literal));expect(await saved(page,'sm-save-run')).toBe(literal);
  await pauseWindow.arm();await page.locator('#sm-start').click();await expect(page.locator('#sm-speed-policy')).toBeDisabled();
  await pauseWindow.pause();await expect(page.locator('#sm-status')).toHaveText('paused');
  for(const id of ['sm-speed-policy','sm-vfa','sm-cruise'])await expect(page.locator('#'+id)).toBeDisabled();
  expect(JSON.parse(await saved(page,'sm-save-run')).mission.route).toEqual(route);
  const result=JSON.parse(await saved(page,'sm-save-result'));expect(result.spec.mission.route).toEqual(route);
  await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');
});
