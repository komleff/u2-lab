import {test,expect} from '@playwright/test';
import {nativePauseWindow} from './native-pause-window';
import {fixture} from '../governor-v03/reference-clock';
import {makeGovernorExperiment} from '../../src/experiments/ship-model-v0.2';
import {readFileSync} from 'node:fs';

for(const width of [1440,390,820])test(`CR-G3-B1 ordinary A copy replaces imported governor B for open, start and export at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');
  await page.locator('#sm-duration').fill('3');
  const baselineDownloading=page.waitForEvent('download');await page.locator('#sm-save-run').click();const baseline=readFileSync((await (await baselineDownloading).path())!,'utf8');
  await page.locator('#sm-variant').selectOption('B');
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:30,name:'Previous governor B'});
  await page.locator('#sm-import').setInputFiles({name:'governor-B.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spec))});
  await expect(page.locator('#sm-opened')).toContainText('Previous governor B');
  await page.locator('#sm-variant').selectOption('A');await page.locator('#sm-copy').click();
  await expect(page.locator('#sm-variant')).toHaveValue('B');await expect(page.locator('#sm-governor-scenario')).toHaveCount(0);await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.4');
  const copiedDownloading=page.waitForEvent('download');await page.locator('#sm-save-run').click();expect(readFileSync((await (await copiedDownloading).path())!,'utf8')).toBe(baseline);
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const resultDownloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const result=JSON.parse(readFileSync((await (await resultDownloading).path())!,'utf8'));
  expect(result.spec).toEqual(JSON.parse(baseline));expect(result.status).toBe('complete');await expect(page.locator('#sm-error')).toBeEmpty();
});

for(const width of [1440,390,820])test(`CR-G3-B2 mixed-model selection and refused Start preserve original ordinary Worker controls at ${width}px`,async({page})=>{
  const horizon=86400; // Тест отменяет запуск: оставляем окно для Pause независимо от скорости H3600.
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');
  await page.locator('#sm-variant').selectOption('B');
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:30,name:'Governor B'});
  await page.locator('#sm-import').setInputFiles({name:'governor-B.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spec))});
  await expect(page.locator('#sm-opened')).toContainText('Governor B');await page.locator('#sm-variant').selectOption('A');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-duration').fill(String(horizon));
  await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).toBeVisible();await expect.poll(async()=>Number(await page.locator('#sm-live').getAttribute('data-time'))).toBeGreaterThan(0);await expect(page.locator('#sm-status')).toHaveText('running');await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');expect(Number(await page.locator('#sm-live').getAttribute('data-time'))).toBeLessThan(horizon);
  const originalRunId=await page.locator('#sm-test-owner').getAttribute('data-run-id');expect(originalRunId).toBeTruthy();
  await page.locator('#sm-variant').selectOption('B');
  await expect(page.locator('#sm-status')).toHaveText('paused');await expect(page.locator('#sm-test-owner')).toHaveAttribute('data-run-id',originalRunId!);await expect(page.locator('#sm-start')).toBeDisabled();await expect(page.locator('#sm-resume')).toBeEnabled();await expect(page.locator('#sm-cancel')).toBeEnabled();
  // Защитный отказ обработчика тоже не должен менять адрес уже активного Worker.
  for(const id of ['sm-start','sm-checkpoint']){
    await page.locator('#'+id).evaluate(node=>{const button=node as HTMLButtonElement;button.disabled=false;button.click();});await expect(page.locator('#sm-error')).toContainText('Сначала завершите/отмените активный тест');
  }
  await page.locator('#sm-variant').selectOption('A');await expect(page.locator('#sm-test-owner')).toHaveAttribute('data-run-id',originalRunId!);await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');await expect(page.locator('#sm-ack')).toHaveText('cancel ACK');
  const resultDownloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const result=JSON.parse(readFileSync((await (await resultDownloading).path())!,'utf8'));
  expect(result.runId).toBe(originalRunId);expect(result.spec.modelVersion).toBe('ship-fitting-ship-model-0.1');expect(result.status).toBe('cancelled');
});

test('CR-G3-B2 refused governor Start and checkpoint keep the paused Worker run address',async({page})=>{
  const pauseWindow=await nativePauseWindow(page);
  await page.goto('/?shipModel=experimental');
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:3000,name:'Governor ownership'});
  await page.locator('#sm-import').setInputFiles({name:'governor.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spec))});
  await pauseWindow.arm();await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).toBeVisible();await pauseWindow.pause();await expect(page.locator('#sm-status')).toHaveText('paused');
  const originalRunId=await page.locator('#sm-test-owner').getAttribute('data-run-id');
  for(const id of ['sm-start','sm-checkpoint']){
    await page.locator('#'+id).evaluate(node=>{const button=node as HTMLButtonElement;button.disabled=false;button.click();});await expect(page.locator('#sm-error')).toContainText('Сначала завершите/отмените активный тест');
  }
  await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');await expect(page.locator('#sm-ack')).toHaveText('cancel ACK');
  const resultDownloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const result=JSON.parse(readFileSync((await (await resultDownloading).path())!,'utf8'));
  expect(result.runId).toBe(originalRunId);expect(result.spec.modelVersion).toBe('ship-fitting-ship-model-0.2');expect(result.status).toBe('cancelled');
});

for(const width of [1440,390,820])test(`QA-G3-B1 actual model 0.2 control restores the literal ordinary default and runnable model 0.1 at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');
  const initialPreset=await page.locator('#sm-preset').inputValue();
  const baselineDownloading=page.waitForEvent('download');await page.locator('#sm-save-run').click();const baseline=readFileSync((await (await baselineDownloading).path())!,'utf8');
  expect(JSON.parse(baseline).modelVersion).toBe('ship-fitting-ship-model-mission-0.1');
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:30,name:'QA-G3-B1 model switch'});
  await page.locator('#sm-import').setInputFiles({name:'qualification.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spec))});
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-ship-model-0.2');
  await page.locator('#sm-model-v01').click();
  await expect(page.locator('#sm-error')).toBeEmpty();await expect(page.locator('#sm-governor-scenario')).toHaveCount(0);await expect(page.locator('#sm-preset')).toHaveValue(initialPreset);
  const restoredDownloading=page.waitForEvent('download');await page.locator('#sm-save-run').click();const restored=readFileSync((await (await restoredDownloading).path())!,'utf8');expect(restored).toBe(baseline);
  await page.locator('#sm-start').click();await expect(page.locator('#sm-ack')).toHaveText('start ACK');
  await expect.poll(async()=>Number(await page.locator('#sm-live').getAttribute('data-time'))).toBeGreaterThan(0);
  // Полный default mission run длится 3600 модельных секунд; startup ACK и progress проверены отдельно.
  await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});await expect(page.locator('#sm-error')).toBeEmpty();
});

for(const width of [1440,390,820])test(`native /4 imported governor runs through the real Worker and preserves frozen A/B and JSON at ${width}px`,async({page})=>{
  const pauseWindow=await nativePauseWindow(page);
  const spec=makeGovernorExperiment({...fixture('T29').input,durationTicks:3000,name:'Synthetic browser qualification'});
  await page.setViewportSize({width,height:1000});await page.goto('/?shipModel=experimental');await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.4');
  await page.locator('#sm-import').setInputFiles({name:'qualification.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(spec))});
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-ship-model-0.2');await expect(page.locator('#sm-tick-hz')).toContainText('30 Hz');
  await pauseWindow.arm();await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).toBeVisible();await pauseWindow.pause();await expect(page.locator('#sm-status')).toHaveText('paused');
  const tick=Number(await page.locator('#sm-live').getAttribute('data-tick'));await page.locator('#sm-transport > summary').click();await page.locator('#sm-step').click();await expect(page.locator('#sm-live')).toHaveAttribute('data-tick',String(tick+1));
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toBeVisible();const frozen=await page.locator('#sm-frozen-owner').textContent();
  const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const file=await downloading;
  await page.locator('#sm-cancel').click();await page.locator('#sm-import').setInputFiles((await file.path())!);await expect(page.locator('#sm-status')).toHaveText('paused');
  if(!await page.locator('#sm-transport').evaluate(node=>(node as HTMLDetailsElement).open))await page.locator('#sm-transport > summary').click();await page.locator('#sm-checkpoint').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:20000});expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
  await page.locator('#sm-copy').click();await expect(page.locator('#sm-variant')).toHaveValue('B');await expect(page.locator('#sm-results')).toHaveCount(0);expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
  const before=await page.locator('#sm-opened').textContent();await page.locator('#sm-import').setInputFiles({name:'bad.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...spec,stateVersion:'ship-state/2'}))});await expect(page.locator('#sm-error')).not.toBeEmpty();expect(await page.locator('#sm-opened').textContent()).toBe(before);
  await page.locator('#sm-governor-name').fill('Edited B');await page.locator('#sm-governor-apply').click();await expect(page.locator('#sm-opened')).toContainText('Edited B');
  await page.locator('#sm-governor-profile > summary').click();expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);await page.locator('#sm-governor-profile > summary').click();
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete',{timeout:15000});expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
  const csvDownloading=page.waitForEvent('download');await page.locator('#sm-save-csv').click();const csv=readFileSync((await (await csvDownloading).path())!,'utf8');expect(csv).toContain('ship-fitting-ship-model-0.2');expect(csv).toContain('endTick,3000');
  if(!await page.locator('#sm-transport').evaluate(node=>(node as HTMLDetailsElement).open))await page.locator('#sm-transport > summary').click();await page.locator('#sm-reset').click();await expect(page.locator('#sm-results')).toHaveCount(0);expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.locator('#sm-back').click();await expect(page.locator('#sm-start')).toBeDisabled();await expect(page.locator('#sm-governor-apply')).toBeDisabled();await page.locator('#sm-leave-cancel').click();await expect(page.locator('#sm-start')).toBeEnabled();
});
