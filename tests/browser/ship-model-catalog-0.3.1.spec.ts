import {test,expect,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {getPresetFit} from '../../src/fitting/catalog';
import {serializeFit} from '../../src/io/fitting-json';
const rows=[
  ['sputnik-d','Северин Спутник · D (дизель)'],['sputnik-e','Северин Спутник · E (электро)'],['pony-d','Дизельный Пони · D (дизель)'],
  ['ermak-d','Демирмаш Ермак · D (дизель)'],['ermak-h','Демирмаш Ермак · H (водород)'],['ermak-e','Демирмаш Ермак · E (электро)'],
  ['volna-m-h','Северин Волна M · H (водород)'],['titan-d','Демирмаш Титан · D (дизель)'],['titan-h','Демирмаш Титан · H (водород)'],['titan-e','Демирмаш Титан · E (электро)'],
  ['severin-mir-d','Северин Мир · D (дизель)'],['severin-mir-h','Северин Мир · H (водород)'],['severin-mir-e','Северин Мир · E (электро)'],['stealth-reference','Стелс-сборка'],
];
const save=async(page:Page,id:string)=>{const waiting=page.waitForEvent('download');await page.locator('#'+id).click();return readFileSync((await (await waiting).path())!,'utf8');};
for(const width of [1440,820,390])test(`current manifest and default are literal at ${width}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');
  await expect(page.locator('#sm-preset')).toBeVisible();
  expect(await page.locator('#sm-preset option').evaluateAll(options=>options.filter(o=>(o as HTMLOptionElement).value).map(o=>[(o as HTMLOptionElement).value,o.textContent]))).toEqual(rows);
  await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');await expect(page.locator('#sm-background')).toHaveValue('250');
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.1');await expect(page.locator('footer')).toContainText('ship-fitting-0.3.1');
  await expect(page.locator('#sm-preset')).not.toContainText('Караван');expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);expect(errors).toEqual([]);
});
test('completed fresh Sputnik exposes primary saved IR/EM distances without details or Charts',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const card=page.locator('#workspace-overview #sm-detection-distance');await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeVisible();
  await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeInViewport();
  await expect(card).toContainText('IR');await expect(card).toContainText('EM');await expect(card).toContainText('S-dedicated-G1');await expect(card).toContainText('чистом космосе');await expect(card).toContainText('не фактический контакт');
  await expect(card).toContainText(/\d[\s\S]*(?:км|м)/);await expect(card.locator('[data-distance]')).toHaveCount(6);await expect(card.locator('details')).toHaveCount(0);await expect(page.locator('#sm-signature-statistics')).not.toHaveAttribute('open','');
  expect(await card.evaluate(n=>!!n.closest('details'))).toBe(false);
});
test('captured and frozen Sputnik A survive next Mir H draft B and atomic import/selection refusal',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-duration').fill('120');await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-live')).toHaveAttribute('data-time',/^[1-9]/);
  await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');const captured=JSON.parse(await save(page,'sm-save-run'));
  expect(captured.environment.radiativeBackgroundK).toBe(250);expect(captured.resolvedShip.fit).toEqual(getPresetFit('sputnik-d','ship-fitting-0.3.1'));
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-run-id',/\S+/);const frozen=await page.locator('#sm-comparison-a').textContent();
  await page.locator('#sm-variant').selectOption('B');await expect(page.locator('#sm-preset')).toBeDisabled();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(captured);
  await page.locator('#sm-cancel').click();await page.locator('#sm-preset').selectOption('severin-mir-h');await page.locator('#sm-background').fill('120');await page.locator('#sm-background').press('Tab');
  const next=JSON.parse(await save(page,'sm-save-run'));expect(next.resolvedShip.fit).toEqual(getPresetFit('severin-mir-h','ship-fitting-0.3.1'));expect(next.environment.radiativeBackgroundK).toBe(120);expect(await page.locator('#sm-comparison-a').textContent()).toBe(frozen);
  await page.locator('#sm-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":"u2-ship-fit/2","catalogVersion":"ship-fitting-0.3.9"}')});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(next);
  await page.locator('#sm-preset').evaluate(select=>{const option=new Option('Invalid','missing');select.append(option);(select as HTMLSelectElement).value='missing';select.dispatchEvent(new Event('change'));});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(next);
  await page.locator('#sm-variant').selectOption('A');expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(captured);
});
test('explicit old fit selects only its old versioned manifest and actual version copy',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'old-v3.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('sputnik','ship-fitting-0.3.0')))});
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.0');await expect(page.locator('footer')).toContainText('ship-fitting-0.3.0');await expect(page.locator('#sm-preset')).toHaveValue('sputnik');
  expect(await page.locator('#sm-preset option').evaluateAll(options=>options.filter(o=>(o as HTMLOptionElement).value).map(o=>(o as HTMLOptionElement).value))).toEqual(['sputnik','severin-mir','stealth-reference']);
});
