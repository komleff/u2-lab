import {test,expect} from '@playwright/test';
for(const width of [1440,390,820])test(`native /4 explicit compile, Worker run and save/reopen at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/');
  await page.locator('#ship-model-open').waitFor();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);expect((await page.locator('header').boundingBox())!.height).toBeLessThanOrEqual(148);
  await page.locator('#ship-model-open').click();await expect(page.locator('#sm-model')).toHaveCount(0);await page.locator('#sm-source').click();
  await expect(page.locator('#sm-start')).toBeDisabled();await expect(page.locator('#sm-start-reason')).toContainText('перенос');
  for(const select of await page.locator('[data-sm-template]').all())await select.selectOption('engine-diesel-S-single');
  await page.locator('#sm-preview').click();await expect(page.locator('#sm-diff')).toContainText('origin');await expect(page.locator('#sm-start')).toBeDisabled();
  await page.locator('#sm-apply').click();await page.locator('#sm-duration').fill('3');await page.locator('#sm-start').click();
  await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:15000});await expect(page.locator('#sm-results')).toContainText('u2-lab/4');await expect(page.locator('#sm-results')).toContainText('ship-signatures/1');
  await expect(page.locator('#sm-transport')).toContainText('Снимок');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const download=page.waitForEvent('download');await page.locator('#sm-save-result').click();const file=await download;expect(file.suggestedFilename()).toBe('u2-ship-model-result.json');
  await page.locator('#sm-import').setInputFiles((await file.path())!);await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-error')).toBeEmpty();
  await page.locator('#sm-back').click();await page.locator('#sm-leave-confirm').click();await expect(page.locator('#fit-status')).toBeVisible();
});
test('native /4 pause/save/reopen/resume owns controls and malformed future import preserves measurement',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('stealth-reference');await page.locator('#sm-duration').fill('30');await page.locator('#sm-mode').selectOption('Masking');
  await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).toBeVisible();await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-preset')).toBeDisabled();await expect(page.locator('#sm-copy')).toBeDisabled();await expect(page.locator('#sm-results')).toContainText('masking-forbidden');
  const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const file=await downloading;await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');
  await page.locator('#sm-import').setInputFiles((await file.path())!);await expect(page.locator('#sm-status')).toHaveText('paused');await expect(page.locator('#sm-checkpoint')).toBeEnabled();
  await page.locator('#sm-transport > summary').click();await page.locator('#sm-checkpoint').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});
  const before=await page.locator('#sm-results').textContent();const bad=await page.locator('#sm-ledger pre').textContent();expect(bad).toContain('escapedEmW');
  await page.locator('#sm-import').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":"u2-lab/99"}')});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(await page.locator('#sm-results').textContent()).toBe(before);
});
