import {test,expect} from '@playwright/test';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {civilianRecoveryFixture} from '../model-v3/buffer-recovery-fixture';
import {serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
for(const blocked of [false,true])test(`ST1-06 actual Worker/UI shows ${blocked?'remaining debt and actual blocked cause':'measured recovery time and literal saved result'}`,async({page})=>{
  const s=civilianRecoveryFixture();s.initialState.temperatureK=400;s.initialState.buffers['fit:signature-1']={storedJ:1e5,minimumCaptureK:300};s.origins['initialState.buffers.fit:signature-1.minimumCaptureK']={kind:'experimental',unit:'K',sourceRef:'WI1 browser explicit remaining debt'};
  s.durationSeconds=3;s.scenario.phases[0].requests={};if(blocked)s.environment.radiativeBackgroundK=650;
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?shipModel=experimental');
  const workerFile=readdirSync('dist/assets').find(n=>n.startsWith('worker-')&&n.endsWith('.js'))!,workerSha256=createHash('sha256').update(readFileSync('dist/assets/'+workerFile)).digest('hex');
  const servedWorker=await page.request.get('/assets/'+workerFile);expect(servedWorker.ok()).toBe(true);expect(createHash('sha256').update(await servedWorker.body()).digest('hex')).toBe(workerSha256);
  await page.locator('#sm-import').setInputFiles({name:'wi1-experiment.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(s))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await page.locator('#sm-buffer-reachability > summary').click();
  const waiting=page.waitForEvent('download');await page.locator('#sm-save-result').click();const literal=readFileSync((await (await waiting).path())!,'utf8'),result=JSON.parse(literal);
  expect(result.spec.resolvedShip.hull.id).toBe('sputnik');expect(result.spec.catalogVersion).toBe('ship-fitting-0.3.2');expect(result.spec.resolvedShip.fit.fitRevision).toBe(1);expect(Math.abs(result.metrics.totalResidualJ)).toBeLessThan(1);
  if(blocked){expect(result.state.buffers['fit:signature-1'].storedJ).toBe(1e5);await expect(page.locator('#sm-buffer-reachability')).toContainText('Полная разгрузка не измерена');await expect(page.locator('#sm-buffer-reachability')).toContainText('no-cooling-headroom');await expect(page.locator('[data-recovery-seconds]')).toHaveCount(0);}
  else{expect(result.state.buffers['fit:signature-1'].storedJ).toBe(0);const start=result.events.find((e:any)=>e.kind==='buffer-recovery-start'),end=result.events.find((e:any)=>e.kind==='buffer-empty');expect(start).toBeDefined();expect(end.timeSeconds).toBeGreaterThan(start.timeSeconds);await expect(page.locator('[data-recovery-seconds]')).toHaveAttribute('data-recovery-seconds',String(end.timeSeconds-start.timeSeconds));}
  await page.locator('#sm-import').setInputFiles({name:'wi1-saved.json',mimeType:'application/json',buffer:Buffer.from(literal)});const reopened=page.waitForEvent('download');await page.locator('#sm-save-result').click();expect(readFileSync((await (await reopened).path())!,'utf8')).toBe(serializeResultSnapshot(result));expect(errors).toEqual([]);
  console.log('WI1_WORKER',JSON.stringify({blocked,workerFile,workerSha256,specSha256:createHash('sha256').update(JSON.stringify(s)).digest('hex'),hullId:result.spec.resolvedShip.hull.id,presetId:'sputnik-d',catalogVersion:result.spec.catalogVersion,fitRevision:result.spec.resolvedShip.fit.fitRevision,remainingJ:result.state.buffers['fit:signature-1'].storedJ,events:result.events.filter((e:any)=>/buffer|headroom/.test(e.kind)),energyResidualJ:result.metrics.totalResidualJ}));
});
