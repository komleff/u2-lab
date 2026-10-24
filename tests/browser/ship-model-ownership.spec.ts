import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {WorkerController,type WorkerCommand} from '../../src/runner/protocol';
test('I1-R1 Freeze waits for its snapshot request after an older pending snapshot and Step',async({page})=>{
  // Только транспорт управляемый: ACK, snapshots и численные шаги создаёт настоящий controller.
  await page.addInitScript(()=>{
    (window as any).controlledWorkers=[];
    (window as any).Worker=class extends EventTarget {
      onmessage:((event:{data:unknown})=>void)|null=null;
      commands:unknown[]=[];
      constructor(){super();(window as any).controlledWorkers.push(this);}
      postMessage(command:unknown){this.commands.push(structuredClone(command));}
      deliver(message:unknown){this.onmessage?.({data:message});}
      terminate(){}
    };
  });
  const responses:any[]=[],controller=new WorkerController(message=>responses.push(structuredClone(message)));
  const command=async(type:string)=>{
    const commands=await page.evaluate(()=>{const worker=(window as any).controlledWorkers.at(-1);return worker.commands.splice(0);}) as WorkerCommand[];
    for(const message of commands)controller.handle(message);
    const matching=commands.filter(message=>message.type===type);
    expect(matching).toHaveLength(1);return matching[0] as Extract<WorkerCommand,{commandId:number}>;
  };
  const deliver=async(messages:any[])=>{await page.evaluate(messages=>{
    const worker=(window as any).controlledWorkers.at(-1);for(const message of messages)worker.deliver(message);
  },messages);};
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('10');
  await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();expect((await command('start')).commandId).toBe(1);controller.maxSteps=1;
  controller.pump();await deliver(responses.splice(0));
  await page.locator('#sm-pause').click();expect((await command('pause')).commandId).toBe(2);await deliver(responses.splice(0));
  expect((await command('snapshot')).commandId).toBe(3);const older=responses.splice(0);
  expect(older.map(message=>message.type)).toEqual(['control-ack','snapshot']);expect(older[1].payload.state.timeSeconds).toBe(1);
  await page.locator('#sm-transport > summary').click();await page.locator('#sm-step').click();expect((await command('step')).commandId).toBe(4);
  controller.pump();const stepped=responses.splice(0);expect(stepped.at(-1).payload.state.timeSeconds).toBe(2);
  await page.locator('#sm-freeze').click();expect((await command('snapshot')).commandId).toBe(5);const requested=responses.splice(0);
  expect(requested[1].payload.state.timeSeconds).toBe(2);
  await deliver(older);
  await expect(page.locator('#sm-frozen-owner')).toHaveCount(0);
  await deliver(stepped);await deliver(requested);
  await expect(page.locator('#sm-frozen-owner')).toContainText('paused · 2 с');
  const saving=page.waitForEvent('download');await page.locator('#sm-save-result').click();const current=JSON.parse(readFileSync((await (await saving).path())!,'utf8'));
  expect(current.state.timeSeconds).toBe(2);await expect(page.locator('#sm-frozen-owner')).toContainText(current.runId);
});
test('I1 paused A owns controls, export and frozen measurement while navigation selects B',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('3600');await page.locator('#sm-copy').click();await page.locator('#sm-variant').selectOption('A');
  await page.locator('#sm-start').click();await page.locator('#sm-variant').selectOption('B');await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-test-owner')).toContainText('Активный тест A');await expect(page.locator('#sm-draft-owner')).toContainText('черновик B');
  await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');
  await expect(page.locator('#sm-save-result')).toBeDisabled();await page.locator('#sm-variant').selectOption('A');
  const saving=page.waitForEvent('download');await page.locator('#sm-save-result').click();const measured=JSON.parse(readFileSync((await (await saving).path())!,'utf8'));
  await page.locator('#sm-variant').selectOption('B');
  await page.getByRole('link',{name:'Сравнение',exact:true}).click();await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toContainText(measured.runId);
  const frozen=await page.locator('#sm-frozen-owner').textContent();
  await expect(page.locator('#sm-preset')).toBeDisabled();await expect(page.locator('#sm-import')).toBeDisabled();await expect(page.locator('#sm-back')).toBeDisabled();await expect(page.locator('#sm-duration')).toBeDisabled();
  await page.locator('#sm-cancel').click();await expect(page.locator('#sm-test-owner')).toHaveCount(0);await page.locator('#sm-variant').selectOption('A');await expect(page.locator('#sm-status')).toHaveText('cancelled');
  await page.locator('#sm-preset').selectOption('stealth-reference');await expect(page.locator('#sm-stale')).toContainText('устарело');expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);
});
test('UI-B2 native draft edits visibly keep measured owner until actual new Worker snapshot',async({page})=>{
  const horizon=86400; // Проверяется владение активным тестом, завершение горизонта не требуется.
  await page.goto('/?shipModel=experimental');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('1');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');const measured=await page.locator('#sm-results').textContent();
  const downloading=page.waitForEvent('download');await page.locator('#sm-save-result').click();const original=readFileSync((await (await downloading).path())!,'utf8');
  await page.locator('#sm-preset').selectOption('stealth-reference');await expect(page.locator('#sm-draft-owner')).toContainText('Стелс');await expect(page.locator('#sm-stale')).toContainText('устарело');await expect(page.locator('#sm-measured-owner')).toContainText('Спутник');expect(await page.locator('#sm-results').textContent()).toBe(measured);
  await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');await expect(page.locator('#sm-stale')).toHaveCount(0);await expect(page.locator('#sm-measured-owner')).toContainText('Стелс');
  await page.locator('#sm-fit > summary').click();await page.locator('[data-sm-enabled="fit:signature-1"]').uncheck();await expect(page.locator('#sm-stale')).toContainText('устарело');await expect(page.locator('#sm-measured-owner')).toContainText('ревизия');
  await page.locator('#sm-background').fill('250');await page.locator('#sm-background').press('Tab');await page.locator('#sm-profile').selectOption('absolute-contrast');await expect(page.locator('#sm-stale')).toContainText('устарело');
  if(!await page.locator('#sm-compilation').evaluate(el=>(el as HTMLDetailsElement).open))await page.locator('#sm-compilation summary').click();for(const select of await page.locator('[data-sm-template]').all())await select.selectOption('engine-diesel-S-single');await page.locator('#sm-preview').click();await page.locator('#sm-apply').click();await expect(page.locator('#sm-stale')).toContainText('устарело');
  await page.locator('#sm-import').setInputFiles({name:'measured.json',mimeType:'application/json',buffer:Buffer.from(original)});await expect(page.locator('#sm-stale')).toHaveCount(0);expect(await page.locator('#sm-results').textContent()).toBe(measured);
  await page.locator('#sm-duration').fill(String(horizon));await page.locator('#sm-start').click();await expect(page.locator('#sm-results')).not.toHaveAttribute('data-run-id',JSON.parse(original).runId);await expect.poll(async()=>Number(await page.locator('#sm-live').getAttribute('data-time'))).toBeGreaterThan(0);await expect(page.locator('#sm-status')).toHaveText('running');await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');expect(Number(await page.locator('#sm-live').getAttribute('data-time'))).toBeLessThan(horizon);await expect(page.locator('#sm-preset')).toBeDisabled();await expect(page.locator('#sm-background')).toBeDisabled();await expect(page.locator('#sm-test-owner')).toContainText('Активный тест');await page.locator('#sm-cancel').click();await expect(page.locator('#sm-status')).toHaveText('cancelled');
});
