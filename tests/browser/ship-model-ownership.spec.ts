import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('I1 paused A owns controls, export and frozen measurement while navigation selects B',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik');await page.locator('#sm-duration').fill('120');await page.locator('#sm-copy').click();await page.locator('#sm-variant').selectOption('A');
  await page.locator('#sm-start').click();await page.locator('#sm-variant').selectOption('B');await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-test-owner')).toContainText('Активный тест A');await expect(page.locator('#sm-draft-owner')).toContainText('черновик B');
  await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');
  const saving=page.waitForEvent('download');await page.locator('#sm-save-result').click();const measured=JSON.parse(readFileSync((await (await saving).path())!,'utf8'));
  await page.getByRole('link',{name:'Сравнение',exact:true}).click();await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toContainText(measured.runId);
  const frozen=await page.locator('#sm-frozen-owner').textContent();
  await expect(page.locator('#sm-preset')).toBeDisabled();await expect(page.locator('#sm-import')).toBeDisabled();await expect(page.locator('#sm-back')).toBeDisabled();await expect(page.locator('#sm-duration')).toBeDisabled();
  await page.locator('#sm-cancel').click();await expect(page.locator('#sm-test-owner')).toHaveCount(0);await page.locator('#sm-variant').selectOption('A');await expect(page.locator('#sm-status')).toHaveText('cancelled');
  await page.locator('#sm-preset').selectOption('stealth-reference');await expect(page.locator('#sm-stale')).toContainText('устарело');expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
});
test('UI-B2 native draft edits visibly keep measured owner until actual new Worker snapshot',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik');await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');const measured=await page.locator('#sm-results').textContent();
  const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const original=readFileSync((await (await downloading).path())!,'utf8');
  await page.locator('#sm-preset').selectOption('stealth-reference');await expect(page.locator('#sm-draft-owner')).toContainText('Стелс');await expect(page.locator('#sm-stale')).toContainText('устарело');await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');expect(await page.locator('#sm-results').textContent()).toBe(measured);
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-stale')).toHaveCount(0);await expect(page.locator('#sm-measured-owner')).toContainText('Стелс');
  await page.locator('#sm-fit > summary').click();await page.locator('[data-sm-enabled="fit:signature-1"]').uncheck();await expect(page.locator('#sm-stale')).toContainText('устарело');await expect(page.locator('#sm-measured-owner')).toContainText('ревизия');
  await page.locator('#sm-background').fill('250');await page.locator('#sm-background').press('Tab');await page.locator('#sm-profile').selectOption('absolute-contrast');await expect(page.locator('#sm-stale')).toContainText('устарело');
  if(!await page.locator('#sm-compilation').evaluate(el=>(el as HTMLDetailsElement).open))await page.locator('#sm-compilation summary').click();for(const select of await page.locator('[data-sm-template]').all())await select.selectOption('engine-diesel-S-single');await page.locator('#sm-preview').click();await page.locator('#sm-apply').click();await expect(page.locator('#sm-stale')).toContainText('устарело');
  await page.locator('#sm-import').setInputFiles({name:'measured.json',mimeType:'application/json',buffer:Buffer.from(original)});await expect(page.locator('#sm-stale')).toHaveCount(0);expect(await page.locator('#sm-results').textContent()).toBe(measured);
  await page.locator('#sm-duration').fill('60');await page.locator('#sm-start').click();await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');await expect(page.locator('#sm-preset')).toBeDisabled();await expect(page.locator('#sm-background')).toBeDisabled();await expect(page.locator('#sm-test-owner')).toContainText('Активный тест');await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');
});
