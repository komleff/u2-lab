import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {getPresetFit} from '../../src/fitting/catalog';
import {serializeFit} from '../../src/io/fitting-json';
async function save(page:Page,id:string){const d=page.waitForEvent('download');await page.locator('#'+id).click();return readFileSync((await(await d).path())!,'utf8');}
test('TF06 incomplete mixed fit is edited through existing catalog and reaches actual Worker with its compatible tank',async({page})=>{
 await page.addInitScript(()=>{const Native=Worker;window.Worker=class extends Native{constructor(url:string|URL,o?:WorkerOptions){super(url,o);this.addEventListener('message',({data})=>{if(data.type==='complete')(window as any).thermalResult=data.payload;});}};});
 await page.goto('/?shipModel=experimental');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-fit > summary').click();
 await page.locator('#sm-slot-retro').click();await page.locator('[data-sm-candidate="engine-hydrogen-S-single"]').click();await expect(page.locator('#sm-swap-apply')).toBeEnabled();await expect(page.locator('#sm-swap-preview')).toContainText('hydrogen');await page.locator('#sm-swap-apply').click();
 await expect(page.locator('#sm-start')).toBeDisabled();await expect(page.locator('#sm-save-fit')).toBeDisabled();await expect(page.locator('#sm-start-reason')).toContainText('fit:retro');
 await page.locator('#sm-slot-power-2').click();await page.locator('[data-sm-candidate="tank-hydrogen-S"]').click();await page.locator('#sm-swap-apply').click();await expect(page.locator('#sm-start')).toBeEnabled();await expect(page.locator('#sm-save-fit')).toBeEnabled();
 await page.locator('#sm-action').selectOption('maneuver');await page.locator('#sm-role').selectOption('retro');await page.locator('#sm-duration').fill('2');await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-error')).toBeEmpty();
 const r=await page.evaluate(()=>(window as any).thermalResult);expect(r.spec.catalogVersion).toBe('ship-fitting-0.3.4');expect(r.state.fuelKg.hydrogen).toBeLessThan(r.spec.initialState.fuelKg.hydrogen);expect(r.spec.resolvedShip.instances.find((x:any)=>x.id==='fit:march').item.propulsionType).toBe('diesel');
 const literal=await save(page,'sm-save-result');await page.locator('#sm-import').setInputFiles({name:'mixed.json',mimeType:'application/json',buffer:Buffer.from(literal)});expect(await save(page,'sm-save-result')).toBe(literal);
});
for(const version of ['ship-fitting-0.3.3','ship-fitting-0.3.4'] as const)test(`TF09 Pony ${version} fresh menu/import has 225/450 and preserves explicit route`,async({page})=>{
 await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('pony-d');if(version==='ship-fitting-0.3.3')await page.locator('#sm-import').setInputFiles({name:'pony-old.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('pony-d',version)))});
 await expect(page.locator('#sm-vfa')).toHaveValue('225');await expect(page.locator('#sm-cruise')).toHaveValue('450');await expect(page.locator('#sm-start')).toBeEnabled();
 await page.locator('#sm-cruise').fill('321');await page.locator('#sm-cruise').press('Tab');const text=await save(page,'sm-save-run'),spec=JSON.parse(text);expect(spec.mission.route).toMatchObject({referenceVfaMS:225,cruiseSpeedMS:321,speedPolicy:'custom'});
 await page.locator('#sm-import').setInputFiles({name:'pony-route.json',mimeType:'application/json',buffer:Buffer.from(text)});expect(await save(page,'sm-save-run')).toBe(text);
});
