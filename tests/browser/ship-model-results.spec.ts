import {test,expect,type Page} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {signatureDepletionFixture} from '../model-v3/fixture';
import {serializeFit,serializeExperiment,serializeResultSnapshot} from '../../src/io/fitting-json';
import {getPresetFit} from '../../src/fitting/catalog';
import {exportShipModelTelemetryCsv} from '../../src/io/ship-model-csv';
const download=async(page:Page,id:string)=>{const pending=page.waitForEvent('download');await page.locator('#'+id).click();const file=await pending;return {name:file.suggestedFilename(),text:readFileSync((await file.path())!,'utf8')};};
const observeWorker=async(page:Page)=>page.addInitScript(()=>{
  (window as any).shipStarts=[];(window as any).shipResults=[];(window as any).exportTypes=[];
  const Native=Worker;window.Worker=class extends Native{
    constructor(url:string|URL,options?:WorkerOptions){super(url,options);this.addEventListener('message',({data})=>{if(data.type==='complete'||data.type==='snapshot')(window as any).shipResults.push(structuredClone(data.payload));});}
    postMessage(message:any,transfer:any=[]){if(message.type==='start'&&message.payload?.spec)(window as any).shipStarts.push(structuredClone(message.payload.spec));super.postMessage(message,transfer);}
  };
  const create=URL.createObjectURL;URL.createObjectURL=blob=>{(window as any).exportTypes.push(blob instanceof Blob?blob.type:'');return create(blob);};
});
test('I5 actual Worker exports captured active A experiment but refuses result/CSV fallback for empty selected B',async({page})=>{
  await observeWorker(page);await page.goto('/?shipModel=experimental');await page.locator('#sm-preset').selectOption('sputnik-d');await page.locator('#sm-duration').fill('3600');await page.locator('#sm-duration').press('Tab');await page.locator('#sm-start').click();
  await expect(page.locator('#sm-live')).toHaveAttribute('data-time',/^[1-9]/);await page.locator('#sm-variant').selectOption('B');await page.locator('#sm-pause').click();await expect(page.locator('#sm-status')).toHaveText('paused');
  await expect(page.locator('#sm-test-owner')).toContainText('Активный тест A');await expect(page.locator('#sm-save-run')).toBeEnabled();await expect(page.locator('#sm-save-result')).toBeDisabled();await expect(page.locator('#sm-save-csv')).toBeDisabled();
  const captured=await page.evaluate(()=>(window as any).shipStarts.at(-1)),runId=await page.locator('#sm-test-owner').getAttribute('data-run-id'),experiment=await download(page,'sm-save-run');expect(JSON.parse(experiment.text)).toEqual(captured);expect(experiment.name).toContain('A');expect(experiment.name).toContain(runId!);expect(await page.evaluate(()=>(window as any).exportTypes.at(-1))).toBe('application/json');
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toContainText(runId!);await expect(page.locator('#sm-comparison-b')).toContainText('Выбранный B: нет измерения');await expect(page.locator('#sm-comparison [data-stat="B:receiverIrW:meanW"]')).toHaveText('—');
  await page.locator('#sm-variant').selectOption('A');const result=await download(page,'sm-save-result'),measured=JSON.parse(result.text);expect(measured.runId).toBe(runId);expect(result.name).toContain(runId!);const csv=await download(page,'sm-save-csv');expect(csv.name).toContain(runId!);expect(csv.text).toBe(exportShipModelTelemetryCsv(measured));
  await page.locator('#sm-variant').selectOption('B');await expect(page.locator('#sm-save-result')).toBeDisabled();await page.locator('#sm-cancel').click();await expect(page.locator('#sm-test-owner')).toHaveCount(0);await expect(page.locator('#sm-save-run')).toBeDisabled();
});
test('I5 actual CP04 Worker freezes frame statistics and compares only selected measured B with independent passports',async({page})=>{
  await observeWorker(page);await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'cp04.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(signatureDepletionFixture()))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const saved=await download(page,'sm-save-result'),a=JSON.parse(saved.text);expect(a.signatures.statistics.receiverIrW.maxW).toBe(8032.005217677903);await expect(page.locator('#workspace-overview [data-stat="receiverIrW:maxW"]')).toHaveAttribute('data-value','8032.005217677903');
  await page.locator('#sm-freeze').click();await expect(page.locator('#sm-frozen-owner')).toContainText(a.runId);const frozenText=await page.locator('#sm-frozen-owner').textContent();await page.locator('#sm-copy').click();await expect(page.locator('#sm-comparison-b')).toContainText('нет измерения');await expect(page.locator('#sm-save-result')).toBeDisabled();
  await page.locator('#sm-range').fill('20');await page.locator('#sm-range').press('Tab');await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  const bFile=await download(page,'sm-save-result'),b=JSON.parse(bFile.text);expect(b.runId).not.toBe(a.runId);expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozenText);expect(await page.evaluate(()=>(window as any).exportTypes.at(-1))).toBe('application/json');
  await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-run-id',a.runId);await expect(page.locator('#sm-comparison-b')).toHaveAttribute('data-run-id',b.runId);await expect(page.locator('#sm-comparison [data-condition="observer"]')).toBeVisible();await expect(page.locator('#sm-comparison')).toContainText('сравнение ограничено');
  await expect(page.locator('#sm-comparison [data-stat="A:receiverIrW:meanW"]')).toHaveAttribute('data-value',String(a.signatures.statistics.receiverIrW.meanW));await expect(page.locator('#sm-comparison [data-stat="B:receiverIrW:maxW"]')).toHaveAttribute('data-value',String(b.signatures.statistics.receiverIrW.maxW));
  const csv=await download(page,'sm-save-csv');expect(csv.text).toBe(exportShipModelTelemetryCsv(b));expect(csv.name).toContain(b.runId);expect(await page.evaluate(()=>(window as any).exportTypes.at(-1))).toBe('text/csv;charset=utf-8');
  await page.locator('#sm-background').fill('250');await page.locator('#sm-background').press('Tab');await expect(page.locator('#sm-comparison-b')).toHaveAttribute('data-stale','true');await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-stale','false');expect((await download(page,'sm-save-result')).text).toBe(bFile.text);
  await page.locator('#sm-variant').selectOption('A');await page.locator('#sm-background').fill('250');await page.locator('#sm-background').press('Tab');await expect(page.locator('#sm-comparison-a')).toHaveAttribute('data-stale','true');expect(await page.locator('#sm-frozen-owner').textContent()).toBe(frozenText);expect((await download(page,'sm-save-result')).text).toBe(saved.text);
});
test('I5 actual zero and literal imported v1 have distinct measured DOM, with no synthetic statistics',async({page})=>{
  await observeWorker(page);const spec=signatureDepletionFixture(1);spec.initialState.chargeJ=0;spec.scenario.phases=[{id:'zero',action:'idle',durationSeconds:1,requests:{},environment:null}];
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'zero.json',mimeType:'application/json',buffer:Buffer.from(serializeExperiment(spec))});await page.locator('#sm-start').click();await expect(page.locator('#sm-status')).toHaveText('complete');
  await expect(page.locator('#sm-results [data-stat="receiverIrW:meanW"]')).toHaveAttribute('data-value','0');await expect(page.locator('#sm-results [data-stat="receiverIrW:meanW"]')).toHaveText('0 Вт');await expect(page.locator('#sm-results [data-stat="observedEmW:maxRangeM"]')).toHaveText('0 м');
  const measured=JSON.parse((await download(page,'sm-save-result')).text);measured.signatures={version:'ship-signatures/1',last:measured.signatures.last};const literal=serializeResultSnapshot(measured);await page.locator('#sm-import').setInputFiles({name:'old-v1.json',mimeType:'application/json',buffer:Buffer.from(literal)});
  await expect(page.locator('#sm-results [data-stat="receiverIrW:meanW"]')).toHaveAttribute('data-value','');await expect(page.locator('#sm-results [data-stat="receiverIrW:meanW"]')).toHaveText('—');await expect(page.locator('#sm-results [data-stat="observedEmW:maxRangeM"]')).toHaveText('—');expect((await download(page,'sm-save-result')).text).toBe(literal);await expect(page.locator('#sm-results')).not.toContainText('SCU');await expect(page.locator('[data-nominal-radar]')).toHaveCount(0);
});
async function qaMeasuredPair(page:Page,touch=false){
  const action=async(selector:string)=>{const node=page.locator(selector);await node.evaluate(n=>n.scrollIntoView({block:'center'}));if(touch)await node.tap();else await node.click();};
  const save=async()=>{const waiting=page.waitForEvent('download');await action('#sm-save-result');return readFileSync((await (await waiting).path())!,'utf8');};
  await page.goto('/?shipModel=experimental');await page.locator('#sm-import').setInputFiles({name:'literal-0.3.0.json',mimeType:'application/json',buffer:Buffer.from(serializeFit(getPresetFit('sputnik','ship-fitting-0.3.0')))});await page.locator('#sm-background').fill('100');await page.locator('#sm-background').press('Tab');await page.locator('#sm-duration').fill('1');await page.locator('#sm-duration').press('Tab');
  await action('#sm-start');await expect(page.locator('#sm-status')).toHaveText('complete');const aText=await save(),a=JSON.parse(aText);
  expect(a.spec.environment.radiativeBackgroundK).toBe(100);expect(a.spec.observer.aspectDeg).toBe(0);await action('#sm-freeze');await expect(page.locator('#sm-frozen-owner')).toContainText(a.runId);
  await action('#sm-copy');await page.locator('#sm-background').fill('120');await page.locator('#sm-background').press('Tab');await page.locator('#sm-aspect').fill('180');await page.locator('#sm-aspect').press('Tab');
  await action('#sm-start');await expect(page.locator('#sm-status')).toHaveText('complete');const bText=await save(),b=JSON.parse(bText);expect(b.runId).not.toBe(a.runId);await action('#fit-nav-compare');
  return {a,b,aText,bText,action,save};
}
test('QA B1 whole Compare main layer has readable changed leaves and compact identities; full literal owners remain in closed details',async({page})=>{
  const {a,b,bText,action,save}=await qaMeasuredPair(page);
  const main=await page.locator('#workspace-compare').evaluate(node=>{const copy=node.cloneNode(true) as HTMLElement;copy.querySelectorAll('details').forEach(d=>d.remove());return copy.textContent!;});
  expect(main).not.toContain(a.runId);expect(main).not.toContain(b.runId);expect(main).not.toContain(a.spec.modelVersion);expect(main).not.toContain(a.spec.schemaVersion);expect(main).not.toMatch(/S-dedicated-G1|16000|solarFluxWm2|backgroundSourceId|energyInputs/);
  await expect(page.locator('#sm-comparison [data-condition-path="observer.aspectDeg"]')).toHaveText('Ракурс: A 0° → B 180°');
  await expect(page.locator('#sm-comparison [data-condition-path="environment.radiativeBackgroundK"]')).toHaveText('Фон: A 100 K → B 120 K');
  await expect(page.locator('#sm-comparison-a')).toContainText('Состав');await expect(page.locator('#sm-comparison-b')).toContainText('измерено 0–1 с');await expect(page.locator('#workspace-compare details[open]')).toHaveCount(0);
  for(const [side,result]of [['a',a],['b',b]] as const){const details=page.locator('#sm-comparison-'+side+' > details');await details.locator(':scope > summary').click();await expect(details).toContainText(result.runId);await expect(details).toContainText(result.spec.modelVersion);const raw=await details.locator('[data-raw-spec]').textContent();expect(JSON.parse(raw!)).toEqual(result.spec);const passport=JSON.parse((await details.locator('[data-measured-passport]').textContent())!);expect(passport.signatures).toEqual(result.signatures);expect(passport.runId).toBe(result.runId);expect(passport.state.temperatureK).toBe(result.state.temperatureK);expect(passport).not.toHaveProperty('buckets');}
  await action('#sm-variant');await page.locator('#sm-variant').selectOption('B');expect(await save()).toBe(bText);
});
test('QA B2 actual mobile Chromium touch390x844 keeps every Compare number+unit on one line and the wide table contained',async({browser},info)=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,acceptDownloads:true}),page=await context.newPage(),errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{
    const {a,b,action}=await qaMeasuredPair(page,true);expect(await page.evaluate(()=>navigator.maxTouchPoints)).toBeGreaterThan(0);
    const audit=()=>page.locator('#workspace-compare').evaluate(node=>{
      const values=[...node.querySelectorAll('[data-stat],.measurement-value')].filter(n=>n.getClientRects().length>0&&!n.closest('details:not([open])')).map(n=>{const range=document.createRange();range.selectNodeContents(n);return {text:n.textContent,stat:n.hasAttribute('data-stat'),nowrap:getComputedStyle(n).whiteSpace,box:n.getBoundingClientRect().toJSON(),lines:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))};});
      const table=node.querySelector('#sm-comparison > .ui-table-scroll')!;return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,values,table:{box:table.getBoundingClientRect().toJSON(),scrollWidth:table.scrollWidth,clientWidth:table.clientWidth,overflowX:getComputedStyle(table).overflowX}};
    });
    const check=(geometry:Awaited<ReturnType<typeof audit>>)=>{for(const value of geometry.values){expect(new Set(value.lines.map(r=>r.y)).size,value.text!).toBe(1);expect(value.nowrap,value.text!).toBe('nowrap');expect(value.box.height).toBeLessThan(30);}expect(geometry.overflow).toBe(0);};
    const geometry=await audit();check(geometry);expect(geometry.values.filter(v=>v.stat)).toHaveLength(24);expect(geometry.values.length).toBeGreaterThanOrEqual(30);
    expect(geometry.width).toBe(390);expect(geometry.overflow).toBe(0);expect(geometry.table.box.x).toBeGreaterThanOrEqual(0);expect(geometry.table.box.x+geometry.table.box.width).toBeLessThanOrEqual(390);expect(geometry.table.overflowX).toBe('auto');expect(geometry.table.scrollWidth).toBeGreaterThanOrEqual(geometry.table.clientWidth);
    await page.screenshot({path:info.outputPath('qa-touch-compare-390.png')});await action('#sm-comparison-a > details > summary');await expect(page.locator('#sm-comparison-a > details')).toHaveAttribute('open','');
    await action('#sm-freeze + details > summary');const expanded=await audit();check(expanded);expect(expanded.values.length).toBeGreaterThan(geometry.values.length);expect(errors).toEqual([]);
    const evidence={a:a.runId,b:b.runId,geometry,expanded,errors},path=info.outputPath('qa-touch-geometry-390.json');writeFileSync(path,JSON.stringify(evidence,null,2)+'\n');await info.attach('qa-touch-number-unit-geometry',{path,contentType:'application/json'});
  }finally{await context.close();}
});
test('QA B3 literal 0.3.0 Sputnik Compare accounts for all10 installed modules including both sensors-thermal without phantom legacy categories',async({page})=>{
  const {a,b,bText,save}=await qaMeasuredPair(page);expect(a.spec.resolvedShip.instances).toHaveLength(10);expect(a.spec.resolvedShip.instances.filter((i:any)=>i.item.category==='sensors-thermal')).toHaveLength(2);
  for(const [side,result]of [['a',a],['b',b]] as const){
    const p=page.locator('#sm-comparison-'+side+' > p').filter({hasText:/^Состав/});await expect(p).toContainText('Сенсоры и тепло: 2');await expect(p).not.toContainText('Контроль сигнатур: 0');
    const rows=(await p.textContent())!.split(' · ').slice(1).map(row=>{const match=row.match(/^(.+): (\d+)$/);return {label:match?.[1],count:Number(match?.[2])};});
    expect(rows).toEqual([{label:'Полезная нагрузка',count:2},{label:'Двигатели',count:4},{label:'Питание',count:2},{label:'Сенсоры и тепло',count:2}]);expect(rows.reduce((n,row)=>n+row.count,0)).toBe(result.spec.resolvedShip.instances.length);
  }
  await expect(page.locator('#workspace-compare details[open]')).toHaveCount(0);expect(await save()).toBe(bText);
});
