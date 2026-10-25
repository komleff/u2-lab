import {test,expect,type Page,type Worker as BrowserWorker} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {fixture} from '../governor-v03/reference-clock';
import {makeGovernorExperiment} from '../../src/experiments/ship-model-v0.2';

async function downloaded(page:Page,selector:string){const downloading=page.waitForEvent('download');await page.locator(selector).click();return readFileSync((await (await downloading).path())!,'utf8');}

const entries=[
  {name:'fitting',url:'/?shipModel=legacy',start:'#fit-start',error:'#fit-error',ack:'#fit-ack',time:'#fit-time',status:'#fit-active-owner'},
  {name:'ship-model',url:'/',start:'#sm-start',error:'#sm-error',ack:'#sm-ack',time:'#sm-live',status:'#sm-test-owner'},
  {name:'legacy',url:'/?mode=legacy',start:'#start',error:'#error',ack:'#ack',time:'#time',status:'#status'},
] as const;

for(const entry of entries)for(const when of ['before-start','during-start'])test(`WH-01/02 ${entry.name} real Worker load failure ${when}, retry failure, restore and progress`,async({page,context})=>{
  let blocked=true,requests=0;
  let releaseFirst!:()=>void;
  const firstGate=new Promise<void>(resolve=>{releaseFirst=resolve;});
  const failed:string[]=[];context.on('requestfailed',request=>{if(/\/assets\/worker-[^/]+\.js/.test(request.url()))failed.push(request.url());});
  await context.route('**/assets/worker-*.js',async route=>{requests++;if(when==='during-start')await firstGate;if(blocked)await route.abort('failed');else await route.continue();});
  await page.goto(entry.url);
  if(when==='during-start'){
    await page.locator(entry.start).click();releaseFirst();
  }
  await expect.poll(()=>failed.length).toBeGreaterThan(0);
  await expect(page.locator(entry.error)).toContainText('Расчётный Worker недоступен');
  const released=async()=>{
    await expect(page.locator(entry.start)).toBeEnabled();
    if(entry.name==='fitting')await expect(page.locator(entry.status)).toContainText('активного теста нет');
    else if(entry.name==='ship-model')await expect(page.locator(entry.status)).toHaveCount(0);
    else await expect(page.locator(entry.status)).toHaveText('Ошибка');
  };
  await released();
  const previousRequests=requests;await page.locator(entry.start).click();await expect.poll(()=>requests).toBeGreaterThan(previousRequests);await expect.poll(()=>failed.length).toBeGreaterThan(1);await released();
  await expect(page.locator(entry.error)).toContainText('Расчётный Worker недоступен');
  blocked=false;await page.locator(entry.start).click();
  await expect(page.locator(entry.ack)).toContainText('start ACK');await expect(page.locator(entry.error)).toBeEmpty();
  if(entry.name==='ship-model')await expect(page.locator(entry.time)).toHaveAttribute('data-time',/^[1-9]/);
  else await expect(page.locator(entry.time)).not.toContainText(/^0 (с|s)/);
});

for(const name of ['fitting','ship-model','governor','legacy'])test(`WH-01/02 ${name} actual uncaught Worker failure preserves measured result and frozen reference across failed retry`,async({page,context})=>{
  const workers:BrowserWorker[]=[];page.on('worker',worker=>workers.push(worker));
  const ship=name==='ship-model'||name==='governor',legacy=name==='legacy';
  const start=legacy?'#start':ship?'#sm-start':'#fit-start',error=legacy?'#error':ship?'#sm-error':'#fit-error',exportResult=legacy?'#export-result':ship?'#sm-save-result':'#fit-export-result';
  await page.goto(legacy?'/?mode=legacy':ship?'/':'/?shipModel=legacy');
  if(name==='governor')await page.locator('#sm-import').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(makeGovernorExperiment({...fixture('T29').input,durationTicks:3,name:'Worker preservation'})))});
  else await page.locator(legacy?'#duration':ship?'#sm-duration':'#fit-duration').fill('3');
  const complete=async()=>{await page.locator(start).click();if(legacy)await expect(page.locator('#status')).toHaveText('Завершён');else if(ship)await expect(page.locator('#sm-status')).toHaveText('complete');else await expect(page.locator('#fit-status')).toContainText('Завершён');};
  await complete();await page.locator(legacy?'#freeze':ship?'#sm-freeze':'#fit-freeze').click();
  if(legacy)await complete();
  if(name==='fitting')await page.locator('#fit-more > summary').click();
  const frozenSelector=legacy?'#comparison':ship?'#sm-frozen-owner':'#fit-comparison .ab-side-a';
  const frozen=await page.locator(frozenSelector).innerHTML(),result=await downloaded(page,exportResult);
  await workers[workers.length-1].evaluate(()=>{setTimeout(()=>{throw Error('WH actual uncaught Worker fault');},0);});
  await expect(page.locator(error)).toContainText('Расчётный Worker недоступен');
  expect(await downloaded(page,exportResult)).toBe(result);expect(await page.locator(frozenSelector).innerHTML()).toBe(frozen);
  let failed=0;await context.route('**/assets/worker-*.js',async route=>{failed++;await route.abort('failed');});
  await page.locator(start).click();await expect.poll(()=>failed).toBeGreaterThan(0);await expect(page.locator(error)).toContainText('Расчётный Worker недоступен');
  expect(await downloaded(page,exportResult)).toBe(result);expect(await page.locator(frozenSelector).innerHTML()).toBe(frozen);
});

for(const entry of entries)test(`WH-02 ${entry.name} messageerror releases active owner and next Start uses a fresh native Worker`,async({page})=>{
  await page.addInitScript(()=>{
    const NativeWorker=Worker,workers:Worker[]=[];(window as any).testWorkers=workers;
    window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);workers.push(this);}};
  });
  await page.goto(entry.url);await page.locator(entry.start).click();await expect(page.locator(entry.ack)).toContainText('start ACK');
  await page.locator(entry.name==='legacy'?'#pause':entry.name==='fitting'?'#fit-pause':'#sm-pause').click();await expect(page.locator(entry.ack)).toContainText(/pause ACK|snapshot ACK/);
  // Синтетический event проверяет listener boundary, не имитирует реальный deserialize failure.
  const created=await page.evaluate(()=>{const workers=(window as any).testWorkers as Worker[];workers[workers.length-1].dispatchEvent(new MessageEvent('messageerror'));return workers.length;});
  await expect(page.locator(entry.error)).toContainText('Расчётный Worker недоступен');await expect(page.locator(entry.start)).toBeEnabled();
  await page.locator(entry.start).click();await expect(page.locator(entry.ack)).toContainText('start ACK');expect(await page.evaluate(()=>(window as any).testWorkers.length)).toBe(created+1);await expect(page.locator(entry.error)).toBeEmpty();
});

test('WH-05 visible Lab release and technical patch keep the UI version independent',async({page})=>{
  await page.goto('/');await expect(page.locator('.ui-brand strong')).toHaveText('GD LAB');await expect(page.locator('.ui-brand small')).toHaveCount(0);await expect(page.locator('footer')).toContainText('О Лабе · версия Лабы 2.6.2 · интерфейс v4.8');
  expect(JSON.parse(readFileSync('package.json','utf8')).version).toBe('0.2.2');const lock=JSON.parse(readFileSync('package-lock.json','utf8'));expect(lock.version).toBe('0.2.2');expect(lock.packages[''].version).toBe('0.2.2');expect(readFileSync('README.md','utf8')).toContain('GD LAB v2.6.2 · UI 4.8');
});

test('WH-04 Legacy successful restart keeps its existing no-result export semantics until a new snapshot',async({page})=>{
  await page.goto('/?mode=legacy');await page.locator('#duration').fill('3');await page.locator('#start').click();await expect(page.locator('#status')).toHaveText('Завершён');
  await downloaded(page,'#export-result');await page.locator('#duration').fill('43200');await page.locator('#acceleration').selectOption('1');await page.locator('#start').click();await expect(page.locator('#ack')).toContainText('start ACK');await page.locator('#pause').click();await expect(page.locator('#status')).toHaveText('Пауза');
  await page.locator('#export-result').click();await expect(page.locator('#error')).toContainText('Сначала завершите опыт или нажмите Отмена для снимка');
});
