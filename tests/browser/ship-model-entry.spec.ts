import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {serializeFit,serializeResultSnapshot} from '../../src/io/fitting-json';
import {makeMiningRun} from '../../src/scenarios/fitting';
import {createFittingRun,runFittingChunk,fittingResult} from '../../src/runner/fitting-run';
const oldCatalog=loadCandidateCatalog('ship-fitting-0.2.5');
const oldFit=getPresetFit('sputnik',oldCatalog.version);
const upload=(text:string,name='ship.json')=>({name,mimeType:'application/json',buffer:Buffer.from(text)});
test('fresh /4 opens independent Sputnik D at 250 K and actual Worker receives those defaults',async({page})=>{
  await page.goto('/?shipModel=experimental');
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.1');
  await expect(page.locator('#sm-background')).toHaveValue('250');
  await expect(page.locator('#sm-draft-owner')).toContainText('фон 250 K');
  await expect(page.locator('#sm-start')).toBeEnabled();
  await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();
  await expect(page.locator('#sm-status')).toHaveText('complete');
  const saving=page.waitForEvent('download');await page.locator('#sm-save-result').click();
  const result=JSON.parse(readFileSync((await (await saving).path())!,'utf8'));
  expect(result.spec.environment.radiativeBackgroundK).toBe(250);
  expect(result.spec.resolvedShip.fit).toEqual(getPresetFit('sputnik-d','ship-fitting-0.3.1'));
});
test('I1 switching models retains the same Lab header, navigation, sections and dock',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#fit-status')).toBeVisible();
  const selectors=['.ui-header','nav[aria-label="Разделы"]','.ui-main','#workspace-fitting','#workspace-conditions','#workspace-compare','#workspace-controls','footer'];
  await page.evaluate(selectors=>{(window as any).shellNodes=selectors.map(selector=>document.querySelector(selector));},selectors);
  await page.locator('#ship-model-open').click();await expect(page.locator('#sm-entry')).toBeVisible();
  for(const selector of ['header','main','footer','nav[aria-label="Разделы"]','.ui-controls'])await expect(page.locator(selector)).toHaveCount(1);
  expect(await page.evaluate(selectors=>selectors.every((selector,i)=>document.querySelector(selector)===(window as any).shellNodes[i]),selectors)).toBe(true);
  await page.getByRole('link',{name:'Графики',exact:true}).click();await expect(page.locator('#workspace-charts')).toBeVisible();
  await page.locator('#sm-back').click();await page.locator('#sm-leave-confirm').click();await expect(page.locator('#fit-status')).toBeVisible();
  expect(await page.evaluate(selectors=>selectors.every((selector,i)=>document.querySelector(selector)===(window as any).shellNodes[i]),selectors)).toBe(true);
});
test('visible entry compiles the actual old Sputnik with unique UI-prefill, then real Worker completes',async({page})=>{
  await page.goto('/?shipModel=experimental');
  await expect(page.getByRole('heading',{name:'Открыть корабль',exact:true})).toBeVisible();
  await expect(page.locator('#sm-model')).toHaveCount(0);
  await expect(page.locator('#sm-source')).toContainText('Спутник');await expect(page.locator('#sm-start')).toBeEnabled();
  const independent=await page.locator('#sm-opened').textContent();
  await page.locator('#sm-source').click();
  await expect(page.locator('[data-sm-template]')).toHaveValue('engine-diesel-S-single');
  await page.locator('#sm-preview').click();await expect(page.locator('#sm-diff')).toContainText('origin');
  await expect(page.locator('#sm-diff-summary')).toContainText('Масса');await expect(page.locator('#sm-diff-summary')).toContainText('кДж/K');expect(await page.locator('#sm-diff').evaluate(el=>(el as HTMLDetailsElement).open)).toBe(false);
  expect(await page.locator('#sm-opened').textContent()).toBe(independent);await expect(page.locator('#sm-start')).toBeEnabled();await page.locator('#sm-apply').click();
  await expect(page.locator('#sm-opened')).toContainText('u2-ship-fit/2');
  await page.locator('#sm-duration').fill('2');await page.locator('#sm-start').click();
  await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');
  await expect(page.locator('#sm-results')).toContainText('u2-lab/4');
});
test('ship change does not disguise an unsupported Masking mode as Efficient or enable an invalid start',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('stealth-reference');await page.locator('#sm-mode').selectOption('Masking');
  await page.locator('#sm-preset').selectOption('sputnik-d');await expect(page.locator('#sm-mode')).toHaveValue('Masking');await expect(page.locator('#sm-start')).toBeDisabled();await expect(page.locator('#sm-start-reason')).toContainText('mode');
  await page.locator('#sm-mode').selectOption('Efficient');await expect(page.locator('#sm-start')).toBeEnabled();await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
});
test('ambiguous source template is not auto-selected or silently applied',async({page})=>{
  const source=structuredClone(oldFit),item=structuredClone(oldCatalog.items['cargo-universal-S']);item.id='ui-choice-cargo';source.localVariants[item.id]=item;
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles(upload(serializeFit(source)));await page.locator('#sm-leave-confirm').click();
  await page.locator('#ship-model-open').click();await page.locator('#sm-source').click();
  const independent=await page.locator('#sm-opened').textContent();
  const choice=page.locator('[data-sm-template="ui-choice-cargo"]');await expect(choice).toHaveValue('');expect(await choice.locator('option').count()).toBe(3);
  await page.locator('#sm-preview').click();await expect(page.locator('#sm-error')).toContainText('localVariants.ui-choice-cargo');await expect(page.locator('#sm-apply')).toBeDisabled();await expect(page.locator('#sm-start')).toBeEnabled();expect(await page.locator('#sm-opened').textContent()).toBe(independent);
});
test('old JSON opens explicitly in old editor only after validation and a leave decision; malformed leaves /4 intact',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');
  await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const before=await page.locator('#sm-results').textContent();
  for(const text of ['{','{"schemaVersion":"u2-lab/99"}',JSON.stringify({...oldFit,hullId:'missing'})]){
    await page.locator('#sm-import').setInputFiles(upload(text));await expect(page.locator('#sm-error')).not.toBeEmpty();
    expect(await page.locator('#sm-results').textContent()).toBe(before);await expect(page.locator('#sm-leave')).toHaveCount(0);
  }
  await page.locator('#sm-import').setInputFiles(upload(serializeFit(oldFit),'old-fit.json'));
  await expect(page.locator('#sm-leave')).toContainText('старая модель');await expect(page.locator('#sm-save-result')).toBeEnabled();
  await page.locator('#sm-leave-cancel').click();expect(await page.locator('#sm-results').textContent()).toBe(before);
  await page.locator('#sm-import').setInputFiles(upload(serializeFit(oldFit),'old-fit.json'));
  const saving=page.waitForEvent('download');await page.locator('#sm-save-result').click();await saving;await page.locator('#sm-leave-confirm').click();
  await expect(page.locator('#fit-edition')).toContainText('ship-fitting-0.2.5');await expect(page.locator('#fit-status')).toBeVisible();
  await page.locator('#ship-model-open').click();await page.locator('#sm-source').click();await page.locator('#sm-preview').click();await page.locator('#sm-apply').click();await expect(page.locator('#sm-start')).toBeEnabled();
});
test('/4 fit/run/result file inputs and reexports preserve actual literal documents and show type/version',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const docs: {id:string;text:string;label:string;schema:string}[]=[];
  for(const [id,label,schema]of [['sm-save-result','Результат','u2-lab/4'],['sm-save-run','Опыт','u2-lab/4'],['sm-save-fit','Сборка','u2-ship-fit/2']]){
    const saving=page.waitForEvent('download');await page.locator('#'+id).click();docs.push({id,label,schema,text:readFileSync((await (await saving).path())!,'utf8')});
  }
  for(const doc of docs){
    await page.locator('#sm-import').setInputFiles(upload(doc.text));await expect(page.locator('#sm-error')).toBeEmpty();await expect(page.locator('#sm-opened')).toContainText(doc.label);await expect(page.locator('#sm-opened')).toContainText(doc.schema);
    const saving=page.waitForEvent('download');await page.locator('#'+doc.id).click();expect(readFileSync((await (await saving).path())!,'utf8')).toBe(doc.text);
  }
});
test('delayed file read cannot replace changed owner or a real paused Worker; cancelled chooser keeps work',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('60');
  await page.evaluate(()=>{const original=File.prototype.text;File.prototype.text=function(){return new Promise<string>(resolve=>{(window as any).releaseFile=async()=>resolve(await original.call(this));});};});
  await page.locator('#sm-import').setInputFiles(upload(serializeFit(oldFit)));await page.locator('#sm-copy').click();
  await page.evaluate(()=>(window as any).releaseFile());await expect(page.locator('#sm-error')).toContainText('изменён');await expect(page.locator('#sm-variant')).toHaveValue('B');await expect(page.locator('#sm-leave')).toHaveCount(0);
  await page.locator('#sm-import').setInputFiles(upload(serializeFit(oldFit)));await page.locator('#sm-start').click();await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  const before=await page.locator('#sm-results').textContent();await page.evaluate(()=>(window as any).releaseFile());await expect(page.locator('#sm-error')).toContainText('импорт не применён');
  await expect(page.locator('#sm-status')).toHaveText('paused');await expect(page.locator('#sm-back')).toBeDisabled();await expect(page.locator('#sm-import')).toBeDisabled();expect(await page.locator('#sm-results').textContent()).toBe(before);
  await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');const final=await page.locator('#sm-results').textContent();await page.locator('#sm-import').setInputFiles([]);expect(await page.locator('#sm-results').textContent()).toBe(final);
});
test('late file read from old editor cannot replace a newly opened /4 workspace and its measurement',async({page})=>{
  await page.goto('/');await page.evaluate(()=>{const original=File.prototype.text;File.prototype.text=function(){return new Promise<string>(resolve=>{(window as any).releaseFile=async()=>resolve(await original.call(this));});};});
  await page.locator('#fit-import').setInputFiles(upload(serializeFit(getPresetFit('severin-mir','ship-fitting-0.3.0'))));
  await page.locator('#ship-model-open').click();await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const before=await page.locator('#sm-results').textContent();await page.evaluate(()=>(window as any).releaseFile());await page.waitForFunction(()=>!document.querySelector('#fit-import'));
  await expect(page.locator('#sm-results')).toBeVisible();expect(await page.locator('#sm-results').textContent()).toBe(before);await expect(page.locator('#sm-opened')).toContainText('Спутник');
});
test('old measured result opens as immutable old measurement, not a /4 replay',async({page})=>{
  const made=makeMiningRun(oldFit,oldCatalog,{durationSeconds:1,workSeconds:1});if(!made.ok)throw Error(JSON.stringify(made.errors));
  const run=createFittingRun('old-measurement',made.value);runFittingChunk(run,20);const saved=fittingResult(run);
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles(upload(serializeResultSnapshot(saved),'old-result.json'));
  await expect(page.locator('#sm-leave')).toContainText('результат');await page.locator('#sm-leave-confirm').click();
  await expect(page.locator('#fit-context')).toContainText('измерено');await expect(page.locator('#sm-results')).toHaveCount(0);
  await page.locator('#fit-context').click();await expect(page.locator('#fit-context')).toContainText('Спутник');
});
for(const width of [1440,820,390])test(`familiar ship/open/start hierarchy and all native references at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');
  for(const [id,label]of [['sputnik-d','Спутник'],['severin-mir-h','Мир'],['stealth-reference','Стелс']]as const){
    await page.locator('#sm-preset').selectOption(id);await expect(page.locator('#sm-opened')).toContainText(label);
    await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('.ship-model-preview .ui-header')).toBeVisible();await expect(page.locator('#sm-start')).toHaveClass(/primary/);
  for(const id of ['sm-start','sm-source','sm-preset','sm-back'])expect((await page.locator('#'+id).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.locator('#sm-back').click();await expect(page.locator('#sm-leave')).toBeVisible();await page.locator('#sm-leave-cancel').click();await expect(page.locator('#sm-results')).toBeVisible();
});
