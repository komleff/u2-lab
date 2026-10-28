import {test,expect,type Page} from '@playwright/test';
import {nativePauseWindow} from './native-pause-window';
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
for(const width of [1440,820,390])test.describe(`C031-QA-B1 graph context at ${width}`,()=>{
  test.use({viewport:{width,height:width===390?844:1000},isMobile:width===390,hasTouch:width===390});
  test('completed fresh Sputnik exposes the same saved IR/EM distances beside /4 graphs without details',async({page})=>{
    test.setTimeout(60000);
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto('/');await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');await expect(page.locator('#sm-background')).toHaveValue('250');
    // Actual H3600 mission Worker + rendering on CI needs a run budget, not the 5s DOM default.
    if(width===390)await page.locator('#sm-start').tap();else await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:40000});
    const primary=page.locator('#workspace-overview #sm-detection-distance'),before=await primary.innerHTML(),values=await primary.locator('[data-distance]').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-distance'),value:n.getAttribute('data-value'),text:n.textContent})));
    const saved=await save(page,'sm-save-result'),result=JSON.parse(saved);expect(result.state.timeSeconds).toBe(3600);expect(result.spec.environment.radiativeBackgroundK).toBe(250);
    if(width===390)await page.getByRole('link',{name:'Графики',exact:true}).tap();else await page.getByRole('link',{name:'Графики',exact:true}).click();
    const card=page.locator('#workspace-charts #sm-chart-detection-distance');await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeVisible();
    await card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true}).scrollIntoViewIfNeeded();await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeInViewport();
    await expect(card.locator('[data-distance]')).toHaveCount(6);await expect(card.locator('details')).toHaveCount(0);expect(await card.evaluate(n=>!!n.closest('details'))).toBe(false);
    expect(await card.locator('[data-distance]').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-distance')?.replace('charts:',''),value:n.getAttribute('data-value'),text:n.textContent})))).toEqual(values);
    for(const text of ['IR','EM','В конце опыта','По среднему сигналу за интервал','Максимальная за интервал','S-dedicated-G1','Ракурс','positive-only','чистом космосе','не фактический контакт'])await expect(card).toContainText(text);
    await expect(card).toContainText(/\d[\s\S]*(?:км|м)/);await expect(page.locator('#workspace-charts .overview-charts')).toBeVisible();
    expect(await primary.innerHTML()).toBe(before);expect(await save(page,'sm-save-result')).toBe(saved);
    const identity=await page.locator('[data-distance]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-distance')));expect(identity).toHaveLength(12);expect(new Set(identity).size).toBe(12);
    await expect(page.locator('#sm-detection-distance')).toHaveCount(1);await expect(page.locator('#sm-chart-detection-distance')).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);expect(errors).toEqual([]);
  });
});
for(const width of [1440,820,390])test(`current manifest and default are literal at ${width}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width,height:1000});await page.goto('/');
  await expect(page.locator('#sm-preset')).toBeVisible();
  expect(await page.locator('#sm-preset option').evaluateAll(options=>options.filter(o=>(o as HTMLOptionElement).value).map(o=>[(o as HTMLOptionElement).value,o.textContent]))).toEqual(rows);
  await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');await expect(page.locator('#sm-background')).toHaveValue('250');
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.4');await expect(page.locator('footer')).toContainText('ship-fitting-0.3.4');
  await expect(page.locator('#sm-preset')).not.toContainText('Караван');expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);expect(errors).toEqual([]);
});
test('completed fresh Sputnik exposes primary saved IR/EM distances without details or Charts',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:40000});
  const card=page.locator('#workspace-overview #sm-detection-distance');await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeVisible();
  await expect(card.getByRole('heading',{name:'Расчётная дальность обнаружения',exact:true})).toBeInViewport();
  await expect(card).toContainText('IR');await expect(card).toContainText('EM');await expect(card).toContainText('S-dedicated-G1');await expect(card).toContainText('чистом космосе');await expect(card).toContainText('не фактический контакт');
  await expect(card).toContainText(/\d[\s\S]*(?:км|м)/);await expect(card.locator('[data-distance]')).toHaveCount(6);await expect(card.locator('details')).toHaveCount(0);await expect(page.locator('#sm-signature-statistics')).not.toHaveAttribute('open','');
  expect(await card.evaluate(n=>!!n.closest('details'))).toBe(false);
});
for(const width of [1440,820,390])test(`captured and frozen Sputnik A survive next Mir H draft B and atomic import/selection refusal at ${width}`,async({page})=>{
  const pauseWindow=await nativePauseWindow(page);
  await page.setViewportSize({width,height:1000});await page.goto('/');await page.locator('#sm-duration').fill('3600');await page.locator('#sm-duration').press('Tab');await pauseWindow.arm();await page.locator('#sm-start').click();await expect(page.locator('#sm-live')).toHaveAttribute('data-time',/^[1-9]/);
  await pauseWindow.pause();await expect(page.locator('#sm-status')).toHaveText('paused');const captured=JSON.parse(await save(page,'sm-save-run'));
  expect(captured.environment.radiativeBackgroundK).toBe(250);expect(captured.resolvedShip.fit).toEqual(getPresetFit('sputnik-d','ship-fitting-0.3.4'));
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-run-id',/\S+/);const frozen=await page.locator('#sm-comparison-a').textContent();
  await page.locator('#sm-variant').selectOption('B');await expect(page.locator('#sm-preset')).toBeDisabled();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(captured);
  await page.locator('#sm-cancel').click();await page.locator('#sm-preset').selectOption('severin-mir-h');await page.locator('#sm-background').fill('120');await page.locator('#sm-background').press('Tab');
  const next=JSON.parse(await save(page,'sm-save-run'));expect(next.resolvedShip.fit).toEqual(getPresetFit('severin-mir-h','ship-fitting-0.3.4'));expect(next.environment.radiativeBackgroundK).toBe(120);expect(await page.locator('#sm-comparison-a').textContent()).toBe(frozen);
  await page.locator('#sm-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":"u2-ship-fit/2","catalogVersion":"ship-fitting-0.3.9"}')});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(next);
  await page.locator('#sm-preset').evaluate(select=>{const option=new Option('Invalid','missing');select.append(option);(select as HTMLSelectElement).value='missing';select.dispatchEvent(new Event('change'));});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(next);
  await page.locator('#sm-variant').selectOption('A');expect(JSON.parse(await save(page,'sm-save-run'))).toEqual(captured);
});
for(const width of [1440,820,390])test.describe(`current catalog whole chain at ${width}`,()=>{
test.use({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
test(`representative current catalog whole chain exports and reopens literal fit/run/result at ${width}`,async({page})=>{
  test.setTimeout(60000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');await expect(page.locator('#sm-background')).toHaveValue('250');
  for(const id of ['sputnik-e','ermak-h','titan-d','severin-mir-h','stealth-reference']){
    // Reopened scenarios intentionally own whole-phase editing, not the fresh
    // shortcut. Start each representative chain from an independent fresh draft.
    await page.goto('/');await expect(page.locator('#sm-background')).toHaveValue('250');
    await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-preset').selectOption(id);await page.locator('#sm-duration').fill('1');if(width===390)await page.locator('#sm-start').tap();else await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
    await expect(page.locator('#sm-detection-distance')).toBeVisible();await expect(page.locator('#sm-detection-distance')).toContainText('чистом космосе');
    const documents=[];for(const control of ['sm-save-result','sm-save-run','sm-save-fit'])documents.push({control,text:await save(page,control)});
    const measured=JSON.parse(documents[0].text);expect(measured.status).toBe('complete');expect(measured.state.timeSeconds).toBe(1);expect(measured.spec.catalogVersion).toBe('ship-fitting-0.3.4');expect(measured.spec.environment.radiativeBackgroundK).toBe(250);expect(measured.spec.resolvedShip.fit).toEqual(getPresetFit(id,'ship-fitting-0.3.4'));
    for(const document of documents){await page.locator('#sm-import').setInputFiles({name:document.control+'.json',mimeType:'application/json',buffer:Buffer.from(document.text)});await expect(page.locator('#sm-error')).toBeEmpty();expect(await save(page,document.control)).toBe(document.text);}
    for(const control of ['sm-start','sm-preset','sm-variant','sm-save-fit','sm-save-run']){const box=(await page.locator('#'+control).boundingBox())!;expect(box.height).toBeGreaterThanOrEqual(44);expect(box.width).toBeGreaterThanOrEqual(44);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBe(0);
  }
  expect(errors).toEqual([]);
});
});
test('ST2-02/03 fresh 0.3.4 Sputnik has no builtin heater; explicit 0.3.1 fit opens literally with its own heater and version',async({page})=>{
  await page.goto('/');await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.4');
  await expect(page.locator('[data-sm-instance="builtin:electric-heater"]')).toHaveCount(0);
  const old=serializeFit(getPresetFit('sputnik-d','ship-fitting-0.3.1'));
  await page.locator('#sm-import').setInputFiles({name:'fit-0.3.1.json',mimeType:'application/json',buffer:Buffer.from(old)});await expect(page.locator('#sm-error')).toBeEmpty();
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.1');await expect(page.locator('footer')).toContainText('ship-fitting-0.3.1');await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');
  expect(await page.locator('#sm-preset option').evaluateAll(options=>options.filter(o=>(o as HTMLOptionElement).value).map(o=>[(o as HTMLOptionElement).value,o.textContent]))).toEqual(rows);
  await expect(page.locator('[data-sm-instance="builtin:electric-heater"]')).toHaveCount(1);expect(await save(page,'sm-save-fit')).toBe(old);
});
test('explicit old fit selects only its old versioned manifest and actual version copy',async({page})=>{
  await page.goto('/');await page.locator('#sm-import').setInputFiles({name:'old-v3.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('sputnik','ship-fitting-0.3.0')))});
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.0');await expect(page.locator('footer')).toContainText('ship-fitting-0.3.0');await expect(page.locator('#sm-preset')).toHaveValue('sputnik');
  expect(await page.locator('#sm-preset option').evaluateAll(options=>options.filter(o=>(o as HTMLOptionElement).value).map(o=>(o as HTMLOptionElement).value))).toEqual(['sputnik','severin-mir','stealth-reference']);
});
