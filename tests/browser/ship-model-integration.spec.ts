import {test,expect} from '@playwright/test';
import {nativePauseWindow} from './native-pause-window';
import {readFileSync} from 'node:fs';
import {getPresetFit,loadCandidateCatalog} from '../../src/fitting/catalog';
import {makeShipModelMiningRun} from '../../src/scenarios/fitting';
import {serializeExperiment,serializeFit} from '../../src/io/fitting-json';
import type {RunSpecV3} from '../../src/model/v3/types';
const environment={radiativeBackgroundK:250,backgroundSourceId:'phase-background',thermalField:{temperatureK:270,coefficientWPerM2K:0.1,sourceId:'field'},solarFluxWm2:10,solarSourceId:'sun',energyInputs:[{sourceId:'bus',representation:'electric' as const,powerW:1}],directHeat:[{sourceId:'heat',powerW:2}]};
const downloadRun=async(page:import('@playwright/test').Page)=>{const saving=page.waitForEvent('download');await page.locator('#sm-save-run').click();return readFileSync((await (await saving).path())!,'utf8');};
test('I3 actual Worker shares selected retained time across graphs/table/journal without backfilling latest live',async({page})=>{
  await page.addInitScript(()=>{const Native=Worker;window.Worker=class extends Native{constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',({data})=>{if(data.type==='complete')(window as any).shipModelMeasured=data.payload;});}};});
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),built=makeShipModelMiningRun(getPresetFit('stealth-reference',c.version),c,{durationSeconds:4,phases:[{id:'work',action:'work',mode:'Efficient',durationSeconds:2,requests:{'fit:payload-1':0.5},environment:null},{id:'quiet',action:'idle',mode:'Masking',durationSeconds:2,requests:{},environment:null}]});
  if(!built.ok)throw Error('Invalid I3 test fixture');
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'i3.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(built.value))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await expect(page.locator('#sm-live')).toContainText('quiet');await expect(page.locator('#sm-live')).toContainText('Masking');await expect(page.locator('#sm-live')).toHaveAttribute('data-time','4');
  await page.locator('#chart-bucket').fill('0');await expect(page.locator('#journal-interval')).toHaveAttribute('data-selected-start','0');await expect(page.locator('#journal-interval')).toHaveAttribute('data-selected-end','1');
  const selectedTimes=await page.locator('#lab-channels svg [data-time]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-time')));expect(selectedTimes.length).toBeGreaterThanOrEqual(4);expect(new Set(selectedTimes)).toEqual(new Set(['1']));
  await page.locator('#channel-details > summary').click();await page.locator('[data-channel-group="heat"]').click();
  const expected=await page.evaluate(()=>{const r=(window as any).shipModelMeasured,i=r.channels.indexOf('temperatureK');return r.buckets[0].sum[i]/r.buckets[0].count;});
  await expect(page.locator('#sm-channel-table tr[data-channel="temperatureK"]')).toHaveAttribute('data-mean',String(expected));await expect(page.locator('#sm-live')).toHaveAttribute('data-time','4');
  await page.locator('#fit-journal-details > summary').click();await page.locator('[data-event-filter="phase"]').click();await expect(page.locator('#fit-events')).toContainText('quiet');await expect(page.locator('#fit-events')).toContainText('Masking');
  await page.locator('#fit-events [data-event-index]').filter({hasText:'quiet'}).first().click();await expect(page.locator('#journal-interval')).toHaveAttribute('data-selected-end','2');await expect(page.locator('#lab-channels svg [data-time]')).toHaveCount(selectedTimes.length+1);
  await page.locator('[data-channel-group="work"]').click();await expect(page.locator('#sm-channel-table tr[data-channel="actualW:fit:power-1"]')).toContainText('нет измерения');
});
test('I3 actual late TI keeps inactive hot-side unavailable and measured work owned by the kernel',async({page})=>{
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',c.version);fit.instances['fit:signature-1'].itemId='thermoinverter-S';fit.assignments['signature-2']='fit:signature-2';fit.instances['fit:signature-2']={id:'fit:signature-2',itemId:'radiator-passive-S',enabled:true};
  const built=makeShipModelMiningRun(fit,c,{durationSeconds:3,temperatureK:500,phases:[{id:'off',action:'idle',mode:'Masking',durationSeconds:1,requests:{},environment:null},{id:'on',action:'idle',mode:'Efficient',durationSeconds:2,requests:{},environment:null}]});if(!built.ok)throw Error('Invalid late-TI fixture');
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'ti.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(built.value))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await page.locator('#channel-details > summary').click();await page.locator('[data-channel-group="heat"]').click();await page.locator('#channel-unit').selectOption('K');await page.locator('#chart-bucket').fill('0');
  const hot=page.locator('#sm-channel-table tr[data-channel="tiHotK:fit:signature-1"]');await expect(hot).toHaveAttribute('data-mean','');await expect(hot).toContainText('неактивен');await expect(hot).not.toContainText('0 K');await expect(page.locator('[data-curve="tiHotK:fit:signature-1"]')).toContainText('неактивен');
  await page.locator('#chart-bucket').fill('1');expect(Number(await hot.getAttribute('data-mean'))).toBeGreaterThan(500);await expect(hot).toContainText('измерено');
  await page.locator('#sm-live-details > summary').click();await expect(page.locator('[data-live-instance="fit:power-1"]')).toContainText('нет измерения');await expect(page.locator('[data-live-instance="fit:signature-1"]')).not.toContainText('неактивен');
  await page.locator('[data-curve="tiHotK:fit:signature-1"]').click();await expect(page.locator('#channel-details svg g[data-channel="tiHotK:fit:signature-1"]')).toHaveCount(0);await expect(hot).toContainText('измерено');
});
test('I3-R1 actual Worker enters horizon-idle once and Live follows its executed fallback',async({page})=>{
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),built=makeShipModelMiningRun(getPresetFit('sputnik',c.version),c,{durationSeconds:4,repeat:false,phases:[{id:'mine',action:'work',durationSeconds:1,requests:{'fit:payload-1':1},environment:null}]});if(!built.ok)throw Error('Invalid horizon-idle fixture');
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'horizon.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(built.value))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await expect(page.locator('#sm-live')).toHaveAttribute('data-time','4');await expect(page.locator('#sm-live')).toContainText('фаза horizon-idle / idle');
  await page.locator('#fit-journal-details > summary').click();await page.locator('[data-event-filter="phase"]').click();await expect(page.locator('#fit-events tbody tr')).toHaveCount(2);
  await expect(page.locator('#fit-events [data-event-index]').filter({hasText:'horizon-idle'})).toHaveText('1 с · horizon-idle · idle');
  await page.locator('#sm-live-details > summary').click();await expect(page.locator('[data-live-instance="fit:payload-1"] td').first()).toHaveText('0 Вт');
});
test('I3-R2 actual Worker preserves raw partial TI but never displays its integral as physical hot-side K',async({page})=>{
  await page.addInitScript(()=>{const Native=Worker;window.Worker=class extends Native{constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',({data})=>{if(data.type==='complete')(window as any).partialTiMeasured=data.payload;});}};});
  const c=loadCandidateCatalog('ship-fitting-0.3.0'),fit=getPresetFit('stealth-reference',c.version);fit.instances['fit:signature-1'].itemId='thermoinverter-S';fit.assignments['signature-2']='fit:signature-2';fit.instances['fit:signature-2']={id:'fit:signature-2',itemId:'radiator-passive-S',enabled:true};
  const built=makeShipModelMiningRun(fit,c,{durationSeconds:1,temperatureK:500,action:'idle',environment:{radiativeBackgroundK:100,backgroundSourceId:'I3-R2-background',thermalField:null,solarFluxWm2:0,solarSourceId:null,energyInputs:[],directHeat:[{sourceId:'I3-R2-explicit-heat',powerW:1e10}]}});if(!built.ok)throw Error('Invalid partial-TI fixture');
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'partial-ti.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(built.value))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const literal=await page.evaluate(()=>{const r=(window as any).partialTiMeasured,id='fit:signature-1';return {hot:r.checkpoint.lastTelemetry['tiHotK:'+id],active:r.checkpoint.lastTelemetry['tiActive:'+id],measured:r.checkpoint.lastTelemetry['tiHotMeasured:'+id],stopped:r.state.modules[id].thermalStopped};});
  // WI1: открытая оболочка вне Masking меняет physical event time, а не полноту измерения.
  expect(literal.hot).toBeCloseTo(87.41039856511269,4);expect(literal).toMatchObject({active:1,measured:0,stopped:true});
  await page.locator('#channel-details > summary').click();await page.locator('[data-channel-group="heat"]').click();await page.locator('#channel-unit').selectOption('K');
  const hot=page.locator('#sm-channel-table tr[data-channel="tiHotK:fit:signature-1"]');await expect(hot).toHaveAttribute('data-mean','');await expect(hot).toContainText('смешанная доступность');await expect(page.locator('#lab-channels svg g[data-channel="tiHotK:fit:signature-1"] polyline')).toHaveCount(0);
  await page.locator('#sm-live-details > summary').click();await expect(page.locator('[data-live-instance="fit:signature-1"] td').last()).toHaveText('смешанная доступность · нет полного измерения');
});
test('I2 V3 grouped cards expose atomic searchable catalog Apply and incompatible/builtin/request-owner refusals',async({page})=>{
  await page.goto('/?shipModel=experimental');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-fit > summary').click();
  await expect(page.locator('#sm-group-sensors-thermal')).toContainText('Сенсоры и тепло');await expect(page.locator('#sm-slot-signature-1')).toContainText('Тепловые границы');await expect(page.locator('#sm-slot-signature-1')).toContainText('Прочность');
  const before=await downloadRun(page);await page.locator('#sm-slot-signature-2').click();
  await page.locator('#sm-swap-family').selectOption('buffer');await page.locator('#sm-swap-size').selectOption('S');await page.locator('#sm-swap-sort').selectOption('mass-desc');await page.locator('#sm-swap-search').fill('buffer');
  await page.locator('[data-sm-candidate="buffer-S"]').click();await expect(page.locator('#sm-swap-preview')).toContainText('Масса');await expect(page.locator('#sm-swap-apply')).toBeEnabled();
  await page.locator('#sm-swap-close').click();expect(await downloadRun(page)).toBe(before);
  await page.locator('#sm-slot-signature-2').click();await page.locator('[data-sm-candidate="buffer-S"]').click();await page.locator('#sm-swap-apply').click();await expect(page.locator('#sm-slot-signature-2')).toContainText('Тепловой буфер S');
  const applied=JSON.parse(await downloadRun(page));expect(applied.resolvedShip.fit.fitRevision).toBe(2);expect(applied.resolvedShip.fit.instances['fit:signature-2'].itemId).toBe('buffer-S');
  await page.locator('#sm-slot-march').click();await page.locator('#sm-swap-size').selectOption('M');await page.locator('[data-sm-candidate="engine-electric-M-single"]').click();await expect(page.locator('#sm-swap-preview')).toContainText('Несовместимые');await expect(page.locator('#sm-swap-apply')).toBeDisabled();await page.locator('#sm-swap-close').click();
  await page.locator('#sm-instance-builtin\\:cargo').click();await expect(page.getByRole('dialog')).toContainText('Встроенный');await expect(page.locator('#sm-swap-remove')).toHaveCount(0);await page.locator('#sm-swap-close').click();
  await page.locator('#sm-slot-payload-1').click();await page.locator('#sm-swap-remove').click();await expect(page.locator('#sm-swap-preview')).toContainText('владельца запроса');await expect(page.locator('#sm-swap-apply')).toBeDisabled();await page.locator('#sm-swap-close').click();expect(JSON.parse(await downloadRun(page))).toEqual(applied);
});
test('I2 fresh whole phase editor add/duplicate/remove sends literal work→recovery→repeat modes and environment to real Worker',async({page})=>{
  const pauseWindow=await nativePauseWindow(page);
  await page.addInitScript(()=>{const Native=Worker;(window as any).shipModelStarts=[];window.Worker=class extends Native{postMessage(message:any,...args:any[]){if(message.type==='start')(window as any).shipModelStarts.push(structuredClone(message));return (super.postMessage as any)(message,...args);}};});
  await page.goto('/?shipModel=experimental');await page.locator('#sm-work-mode').selectOption('stationary');await page.locator('#sm-preset').selectOption('stealth-reference');await page.locator('#sm-scenario-edit').click();
  await page.locator('#sm-scenario-name').fill('Работа / охлаждение');await page.locator('#sm-scenario-repeat').check();await page.locator('#sm-scenario-duration').fill('6');
  const first=page.locator('[data-sm-phase]').nth(0);await first.locator('[data-phase-field="durationSeconds"]').fill('2');await first.locator('[data-phase-field="mode"]').selectOption('Efficient');await first.locator('details > summary').click();await first.locator('[data-request-duty="fit:payload-1"]').fill('0.5');
  await page.locator('#sm-phase-add').click();const second=page.locator('[data-sm-phase]').nth(1);await second.locator('[data-phase-field="action"]').selectOption('recovery');await second.locator('[data-phase-field="mode"]').selectOption('Masking');await second.locator('[data-phase-field="environment"]').fill(JSON.stringify(environment));
  await second.locator('[data-phase-duplicate]').click();await expect(page.locator('[data-sm-phase]')).toHaveCount(3);const ids=await page.locator('[data-phase-field="id"]').evaluateAll(nodes=>nodes.map(node=>(node as HTMLInputElement).value));expect(new Set(ids).size).toBe(3);await page.locator('[data-sm-phase]').nth(2).locator('[data-phase-remove]').click();await expect(page.locator('[data-sm-phase]')).toHaveCount(2);
  await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).toBeEmpty();await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const started=await page.evaluate(()=>(window as any).shipModelStarts.at(-1).payload.spec) as RunSpecV3;
  expect(started.scenario).toEqual({name:'Работа / охлаждение',repeat:true,phases:[{id:'work',action:'work',durationSeconds:2,requests:{'fit:payload-1':0.5},environment:null,mode:'Efficient'},{id:'phase-1',action:'recovery',durationSeconds:1,requests:{},environment,mode:'Masking'}]});expect(started.durationSeconds).toBe(6);
  await page.locator('#sm-fit > summary').click();await page.locator('#sm-scenario-edit').click();await page.locator('#sm-scenario-duration').fill('3600');await page.locator('#sm-scenario-apply').click();await page.locator('#sm-scenario-edit').click();await pauseWindow.arm();await page.locator('#sm-start').click();await pauseWindow.pause();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-scenario-apply')).toBeDisabled();await expect(page.locator('#sm-slot-signature-1')).toBeDisabled();
});
test('I2 imported complex task edits atomically while preserving literal fields outside the scenario',async({page})=>{
  const catalog=loadCandidateCatalog('ship-fitting-0.3.0'),built=makeShipModelMiningRun(getPresetFit('stealth-reference',catalog.version),catalog,{durationSeconds:6,repeat:true,phases:[{id:'work',action:'work',durationSeconds:2,requests:{'fit:payload-1':0.5},environment:null,mode:'Efficient'},{id:'recover',action:'recovery',durationSeconds:1,requests:{},environment,mode:'Masking'}]});
  if(!built.ok)throw Error('Invalid test fixture');const spec=built.value;spec.initialState.rng={algorithm:'xorshift32/1',seed:42,state:77};spec.initialState.chargeJ=123456;
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'complex.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(spec))});const original=await downloadRun(page);
  await page.locator('#sm-scenario-edit').click();await page.locator('[data-sm-phase]').nth(0).locator('[data-phase-field="durationSeconds"]').fill('1.5');await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).not.toBeEmpty();expect(await downloadRun(page)).toBe(original);
  await page.locator('[data-sm-phase]').nth(0).locator('[data-phase-field="durationSeconds"]').fill('3');await page.locator('#sm-scenario-name').fill('Новый сложный опыт');await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).toBeEmpty();
  const changed=JSON.parse(await downloadRun(page));expect(changed.scenario.name).toBe('Новый сложный опыт');expect(changed.scenario.phases[0].durationSeconds).toBe(3);expect(changed.scenario.phases[1]).toEqual(spec.scenario.phases[1]);expect(changed.initialState).toEqual(spec.initialState);expect(changed.environment).toEqual(spec.environment);expect(changed.resolvedShip).toEqual(spec.resolvedShip);
});
test('I2 a late valid JSON import closes a catalog whose slot is absent from the new hull without a page error',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{const original=File.prototype.text;File.prototype.text=function(){return new Promise<string>(resolve=>{original.call(this).then(text=>{(window as any).releaseShipFile=()=>resolve(text);});});};});
  await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('severin-mir-h');await page.locator('#sm-fit > summary').click();
  await page.locator('#sm-import').setInputFiles({name:'sputnik.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('sputnik','ship-fitting-0.3.0')))});
  await page.locator('#sm-slot-power-4').click();await expect(page.getByRole('dialog')).toBeVisible();await page.evaluate(()=>(window as any).releaseShipFile());
  await expect(page.locator('#sm-preset')).toHaveValue('sputnik');expect(errors).toEqual([]);await expect(page.getByRole('dialog')).toBeHidden();await expect(page.locator('#sm-start')).toBeEnabled();
});
const openTwoPhaseEditor=async(page:import('@playwright/test').Page)=>{
  const catalog=loadCandidateCatalog('ship-fitting-0.3.0'),built=makeShipModelMiningRun(getPresetFit('stealth-reference',catalog.version),catalog,{durationSeconds:6,repeat:true,phases:[{id:'first',action:'work',durationSeconds:2,requests:{'fit:payload-1':0.5},environment:{...environment,radiativeBackgroundK:100}},{id:'second',action:'recovery',durationSeconds:1,requests:{},environment:{...environment,radiativeBackgroundK:200}}]});
  if(!built.ok)throw Error('Invalid test fixture');await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'two-phase.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(built.value))});await page.locator('#sm-scenario-edit').click();
};
const renderedEnvironments=(page:import('@playwright/test').Page)=>page.locator('[data-sm-phase]').evaluateAll(rows=>rows.map(row=>({id:row.querySelector<HTMLInputElement>('[data-phase-field="id"]')!.value,environment:JSON.parse(row.querySelector<HTMLTextAreaElement>('[data-phase-field="environment"]')!.value)})));
test('I2-R1 duplicating a preceding phase preserves the dirty later environment without assigning it to the duplicate',async({page})=>{
  await openTwoPhaseEditor(page);await page.locator('[data-sm-phase]').nth(1).locator('[data-phase-field="environment"]').fill(JSON.stringify({...environment,radiativeBackgroundK:320}));
  await page.locator('[data-sm-phase]').nth(0).locator('[data-phase-duplicate]').click();
  const intended=[{id:'first',environment:{...environment,radiativeBackgroundK:100}},{id:'first-copy-1',environment:{...environment,radiativeBackgroundK:100}},{id:'second',environment:{...environment,radiativeBackgroundK:320}}];
  expect(await renderedEnvironments(page)).toEqual(intended);await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).toBeEmpty();expect(JSON.parse(await downloadRun(page)).scenario.phases.map(({id,environment}:RunSpecV3['scenario']['phases'][number])=>({id,environment}))).toEqual(intended);
});
test('I2-R1 removing a dirty preceding phase preserves the surviving phase identity and its own environment',async({page})=>{
  await openTwoPhaseEditor(page);await page.locator('[data-sm-phase]').nth(0).locator('[data-phase-field="environment"]').fill(JSON.stringify({...environment,radiativeBackgroundK:150}));
  await page.locator('[data-sm-phase]').nth(0).locator('[data-phase-remove]').click();
  const intended=[{id:'second',environment:{...environment,radiativeBackgroundK:200}}];expect(await renderedEnvironments(page)).toEqual(intended);
  await page.locator('#sm-scenario-apply').click();await expect(page.locator('#sm-error')).toBeEmpty();expect(JSON.parse(await downloadRun(page)).scenario.phases.map(({id,environment}:RunSpecV3['scenario']['phases'][number])=>({id,environment}))).toEqual(intended);
});
