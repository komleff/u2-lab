import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {exportShipModelTelemetryCsv} from '../../src/io/ship-model-csv';
import {serializeResultSnapshot} from '../../src/io/fitting-json';

const environment={radiativeBackgroundK:250,backgroundSourceId:'UI4I-phase',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[]};
async function save(page:Page,id:string){
  const waiting=page.waitForEvent('download');await page.locator('#'+id).click();const file=await waiting;
  return {text:readFileSync((await file.path())!,'utf8'),name:file.suggestedFilename()};
}
for(const width of [1440,820,390])test(`UI4I-11 whole native /4 research chain at ${width}`,async({page},info)=>{
  const errors:string[]=[],geometry:unknown[]=[];
  page.on('pageerror',error=>errors.push('page: '+error.message));page.on('console',message=>{if(message.type()==='error')errors.push('console: '+message.text());});
  await page.setViewportSize({width,height:1000});
  const check=async(stage:string,selectors:string[])=>{
    const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth));expect(overflow,stage+' page overflow').toBe(0);
    const targets=[];for(const selector of selectors){const box=await page.locator(selector).boundingBox();expect(box,stage+' '+selector).not.toBeNull();expect(box!.width,selector+' width').toBeGreaterThanOrEqual(44);expect(box!.height,selector+' height').toBeGreaterThanOrEqual(44);targets.push({selector,width:box!.width,height:box!.height});}
    expect(errors,stage+' console/page errors').toEqual([]);geometry.push({stage,overflow,targets});
  };
  await page.goto('/?shipModel=experimental');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-preset').selectOption('sputnik-d');
  await expect(page.locator('#workspace-shell')).toHaveAttribute('data-model','ship-model');await expect(page.locator('#workspace-shell header')).toHaveCount(1);await expect(page.locator('.ui-controls')).toHaveCount(1);
  await check('open',['#sm-preset','#sm-source','#sm-start','#sm-variant','#sm-back']);
  await page.locator('#sm-fit > summary').click();await page.locator('#sm-slot-signature-2').click();await page.locator('[data-sm-candidate="buffer-S"]').click();
  await expect(page.locator('#sm-swap-preview')).toContainText('Масса');await check('swap-preview',['#sm-swap-apply','#sm-swap-close','#sm-swap-search']);
  await page.locator('#sm-swap-apply').click();await expect(page.locator('#sm-slot-signature-2')).toContainText('Тепловой буфер S');
  await check('swap-applied',['#sm-slot-signature-2','#sm-scenario-edit']);
  await page.locator('#sm-scenario-edit').click();await page.locator('#sm-scenario-name').fill('UI4I работа / recovery / repeat');await page.locator('#sm-scenario-repeat').check();await page.locator('#sm-scenario-duration').fill('3600');
  const first=page.locator('[data-sm-phase]').nth(0);await first.locator('[data-phase-field="durationSeconds"]').fill('2');await first.locator('[data-phase-field="mode"]').selectOption('Efficient');await first.locator('details > summary').click();await first.locator('[data-request-duty="fit:payload-1"]').fill('0.5');
  await page.locator('#sm-phase-add').click();const second=page.locator('[data-sm-phase]').nth(1);await second.locator('[data-phase-field="action"]').selectOption('recovery');await second.locator('[data-phase-field="mode"]').selectOption('Efficient');await second.locator('[data-phase-field="environment"]').fill(JSON.stringify(environment));
  await check('compound-editor',['#sm-phase-add','#sm-scenario-apply','#sm-scenario-cancel']);await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).toBeEmpty();
  await page.locator('#sm-start').click();await expect(page.locator('#sm-live')).toHaveAttribute('data-time',/^[1-9]/);await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-slot-signature-2')).toBeDisabled();await expect(page.locator('#sm-import')).toBeDisabled();
  await page.locator('#sm-transport > summary').click();const paused=JSON.parse((await save(page,'sm-save-result')).text);await page.locator('#sm-step').click();await expect(page.locator('#sm-live')).toHaveAttribute('data-time',String(paused.state.timeSeconds+1));
  await check('paused-step',['#sm-step','#sm-resume','#sm-cancel','#sm-freeze']);
  const captured=JSON.parse((await save(page,'sm-save-run')).text);expect(captured.resolvedShip.fit.instances['fit:signature-2'].itemId).toBe('buffer-S');expect(captured.scenario.repeat).toBe(true);expect(captured.scenario.phases).toEqual([{id:'work',action:'work',durationSeconds:2,mode:'Efficient',requests:{'fit:payload-1':0.5},environment:null},{id:'phase-1',action:'recovery',durationSeconds:1,mode:'Efficient',requests:{},environment}]);
  const live=await page.locator('#sm-live').getAttribute('data-time');await page.locator('#chart-bucket').fill('0');await expect(page.locator('#journal-interval')).toHaveAttribute('data-selected-end','1');await expect(page.locator('#sm-live')).toHaveAttribute('data-time',live!);
  await page.locator('#channel-details > summary').click();await page.locator('[data-channel-group="heat"]').click();await page.locator('#channel-unit').selectOption('K');
  const measured=JSON.parse((await save(page,'sm-save-result')).text),i=measured.channels.indexOf('temperatureK');await expect(page.locator('#sm-channel-table tr[data-channel="temperatureK"]')).toHaveAttribute('data-mean',String(measured.buckets[0].sum[i]/measured.buckets[0].count));
  const times=await page.locator('#lab-channels svg [data-time]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-time')));expect(times.length).toBeGreaterThanOrEqual(4);expect(new Set(times)).toEqual(new Set(['1']));
  await page.locator('#fit-journal-details > summary').click();await page.locator('[data-event-filter="phase"]').click();await page.locator('#fit-events [data-event-index]').first().click();await expect(page.locator('#sm-live')).toHaveAttribute('data-time',live!);
  await check('history-live',['#chart-bucket','#channel-unit','[data-event-filter="phase"]']);
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toContainText(measured.runId);const frozen=await page.locator('#sm-frozen-owner').textContent();await page.locator('#sm-resume').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await page.locator('#sm-copy').click();await expect(page.locator('#sm-save-result')).toBeDisabled();await expect(page.locator('#sm-save-csv')).toBeDisabled();await page.locator('#sm-range').fill('20');await page.locator('#sm-range').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await page.getByRole('link',{name:'Сравнение',exact:true}).click();expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozen);await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-run-id',measured.runId);await expect(page.locator('#sm-comparison-b')).not.toHaveAttribute('data-run-id',measured.runId);await expect(page.locator('#sm-comparison [data-condition="observer"]')).toBeVisible();await expect(page.locator('#sm-comparison')).toContainText('сравнение ограничено');
  await check('frozen-A-measured-B',['#sm-freeze','#sm-variant','#sm-save-fit','#sm-save-run','#sm-save-result','#sm-save-csv']);
  const fitFile=await save(page,'sm-save-fit'),runFile=await save(page,'sm-save-run'),resultFile=await save(page,'sm-save-result'),csv=await save(page,'sm-save-csv'),b=JSON.parse(resultFile.text);
  expect(resultFile.name).toContain(b.runId);expect(csv.name).toContain(b.runId);expect(csv.text).toBe(exportShipModelTelemetryCsv(b));expect(resultFile.text).toBe(serializeResultSnapshot(b));expect(b.spec.scenario).toEqual(captured.scenario);
  for(const [file,owner]of [[fitFile,'Сборка'],[runFile,'Опыт'],[resultFile,'Результат']] as const){await page.locator('#sm-import').setInputFiles({name:file.name,mimeType:'application/json',buffer:Buffer.from(file.text)});await expect(page.locator('#sm-error')).toBeEmpty();await expect(page.locator('#sm-opened')).toContainText(owner);}
  expect((await save(page,'sm-save-result')).text).toBe(resultFile.text);await check('exports-reopen',['#sm-save-result','#sm-save-csv','#sm-back']);
  await page.getByRole('link',{name:'Сравнение',exact:true}).click();await page.screenshot({path:info.outputPath('comparison-'+width+'.png')});
  const evidence={width,geometry,errors,runIds:{frozen:measured.runId,selected:b.runId},csvRows:csv.text.split('\n').length};
  const evidencePath=info.outputPath('geometry-'+width+'.json');writeFileSync(evidencePath,JSON.stringify(evidence,null,2)+'\n');
  await info.attach('UI4I-dev-acceptance',{path:evidencePath,contentType:'application/json'});
  console.log('UI4I_DEV_ACCEPTANCE '+JSON.stringify(evidence));
});
