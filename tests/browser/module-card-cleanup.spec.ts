import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openTimedDraft } from './timed-draft';
import { getPresetFit, loadCandidateCatalog } from '../../src/fitting/catalog';
import { makeMiningRun } from '../../src/scenarios/fitting';

for (const width of [1440,390]) test(`MC01–04 module information preserves selection and mounting at ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
 try {
  const p=await context.newPage(),errors:string[]=[],act=async(selector:string)=>{const x=p.locator(selector);await x.scrollIntoViewIfNeeded();width===390?await x.tap():await x.click();};
  p.on('pageerror',e=>errors.push(e.message));
  const save=async()=>{const wait=p.waitForEvent('download');await act('#fit-save');await act('#fit-save-confirm');return readFile((await (await wait).path())!);};
  await p.goto('/');await openTimedDraft(p,getPresetFit('pony:1'));
  const incomplete=getPresetFit('pony:1'),missing=incomplete.assignments.march;delete incomplete.assignments.march;delete incomplete.instances[missing];
  await p.locator('#fit-import').setInputFiles({name:'incomplete-pony.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incomplete))});
  const before=await save(),revision=await p.locator('#fit-next-revision').textContent(),refusal=await p.locator('.control-reason').textContent();
  await expect(p.locator('#fit-start')).toBeDisabled();
  await act('#slot-payload-1');await act('[data-candidate="cargo-bulk-S"]');
  await expect(p.locator('[data-candidate="mining-civil-S"]')).toContainText('0,0625125 SCU/с');
  const info=p.locator('[data-info-item="mining-civil-S"] summary');
  await expect(info).toHaveAccessibleName(/Технические сведения:/,{timeout:3000});
  if(width===1440){await info.focus();await p.keyboard.press('Enter');}else await info.tap();
  await expect(p.locator('[data-info-item="mining-civil-S"]')).toHaveAttribute('open','');
  await expect(p.locator('[data-info-item="mining-civil-S"] pre')).toContainText('numerics');
  if(width===1440){await p.keyboard.press('Space');await expect(p.locator('[data-info-item="mining-civil-S"]')).not.toHaveAttribute('open');await p.keyboard.press('Enter');}
  const hit=await info.boundingBox();expect(hit!.width).toBeGreaterThanOrEqual(44);expect(hit!.height).toBeGreaterThanOrEqual(44);
  await expect(p.locator('[data-candidate="cargo-bulk-S"]')).toHaveAttribute('aria-pressed','true');
  await expect(p.locator('[data-candidate="mining-civil-S"]')).toHaveAttribute('aria-pressed','false');
  await expect(p.locator('#fit-next-revision')).toHaveText(revision!);
  await p.keyboard.press('Escape');await expect(p.locator('#slot-payload-1')).toBeFocused();expect(await save()).toEqual(before);await expect(p.locator('#fit-start')).toBeDisabled();await expect(p.locator('.control-reason')).toHaveText(refusal!);
  // Вторая часть проверяет Apply с прежним кандидатом после просмотра другого изделия.
  await act('#slot-payload-1');await act('[data-candidate="cargo-bulk-S"]');await act('[data-info-item="mining-civil-S"] summary');
  await expect(p.locator('[data-candidate="cargo-bulk-S"]')).toHaveAttribute('aria-pressed','true');
  const cargoText=await p.locator('[data-candidate="cargo-bulk-S"]').innerText();expect(cargoText).toContain('24 SCU');expect(cargoText).not.toMatch(/Лазеров|Добыча|Потребление|Трюм после|Объём|Источник|производитель/);
  await p.screenshot({path:`.overgate-runtime/module-cleanup-idless-fix-evidence/catalog-${width}.png`});
  await expect(p.locator('#fit-preview')).not.toHaveAttribute('open');await act('#fit-preview > summary');await expect(p.locator('#fit-preview')).toHaveAttribute('open','');
  await act('#fit-apply');await expect(p.locator('#slot-payload-1')).toBeFocused();
  const afterBytes=await save(),after=JSON.parse(afterBytes.toString()),old=JSON.parse(before.toString());
  const expected=structuredClone(old);expected.fitRevision++;expected.assignments['payload-1']='fit:payload-1';expected.instances['fit:payload-1']={id:'fit:payload-1',itemId:'cargo-bulk-S',enabled:true};expect(after).toEqual(expected);
  const mountedRevision=await p.locator('#fit-next-revision').textContent();
  for(const [selector,label]of [['[id="info-fit:payload-1"]','Грузовой навалочный S'],['[id="info-builtin:laser"]','Встроено']]){
   // Настоящий opener остаётся focused при render; ID содержит двоеточие.
   await p.locator(selector).focus();await act(selector);await expect(p.getByRole('dialog')).toContainText(label);await expect(p.locator('#instance-sources')).toBeVisible();await expect(p.locator('#instance-sources')).toContainText('origins');
   await act('#instance-close');await expect(p.getByRole('dialog')).not.toBeVisible();await expect(p.locator(selector)).toBeFocused();expect(errors,`${selector}: render/Close`).toEqual([]);expect(await save()).toEqual(afterBytes);
   await p.locator(selector).focus();await act(selector);await p.keyboard.press('Escape');await expect(p.getByRole('dialog')).not.toBeVisible();await expect(p.locator(selector)).toBeFocused();expect(errors,`${selector}: render/Escape`).toEqual([]);expect(await save()).toEqual(afterBytes);
   await expect(p.locator('#fit-next-revision')).toHaveText(mountedRevision!);
  }
  await expect(p.locator('footer')).toContainText('интерфейс v4.7');
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);
 }finally{await context.close();}
});

test('CR-MC-B1 idless ring and measured invokers close safely without changing fit or actual Worker result',async({browser})=>{
 const prepared=makeMiningRun(getPresetFit('pony:1'),loadCandidateCatalog(),{durationSeconds:5,stepSeconds:.1,approachSeconds:1,workSeconds:3,brakingSeconds:1,serviceSeconds:1,idleSeconds:1});
 if(!prepared.ok)throw Error(JSON.stringify(prepared.errors));
 let measured:Buffer|undefined;
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
  try{
   const p=await context.newPage(),errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
   const act=async(selector:string)=>{const x=p.locator(selector);await x.evaluate(n=>n.scrollIntoView({block:'center'}));width===390?await x.tap():await x.click();};
   const fitBytes=async()=>{const wait=p.waitForEvent('download');await act('#fit-save');await act('#fit-save-confirm');return readFile((await(await wait).path())!);};
   const resultBytes=async()=>{if(!await p.locator('#fit-more').evaluate(n=>(n as HTMLDetailsElement).open))await act('#fit-f3');const wait=p.waitForEvent('download');await act('#fit-export-result');return readFile((await(await wait).path())!);};
   await p.goto('/');await p.locator('#fit-import').setInputFiles({name:'idless.json',mimeType:'application/json',buffer:measured??Buffer.from(JSON.stringify(prepared.value))});
   if(!measured){await act('#fit-start');await expect(p.locator('#fit-status')).toContainText('Завершён');measured=await resultBytes();const r=JSON.parse(measured.toString());expect(r.state.timeSeconds).toBe(5);expect(r.state.usefulWork).toBeGreaterThan(0);}
   const beforeFit=await fitBytes(),beforeResult=await resultBytes(),revision=await p.locator('#fit-next-revision').textContent();
   await act('#fit-modules-details > summary');
   const invokers=['.ui-table-scroll table button[data-instance="builtin:laser"]'];
   if(width===1440){await act('#fit-ring > summary');invokers.unshift('.ring-node[data-instance="builtin:laser"]');}
   for(const selector of invokers){
    await expect(p.locator(selector)).not.toHaveAttribute('id');
    for(const close of ['Close','Escape']){
     await act(selector);await expect(p.getByRole('dialog')).toContainText('Встроено');await expect(p.locator('#instance-sources')).toContainText('origins');
     if(close==='Close')await act('#instance-close');else await p.keyboard.press('Escape');
     await expect(p.getByRole('dialog')).not.toBeVisible();
     expect.soft(errors,`${width}/${selector}/${close}`).toEqual([]);
     await expect.soft(p.locator('#fit-start'),`${width}/${selector}/${close}: safe fallback`).toBeFocused({timeout:1000});
     expect(await fitBytes()).toEqual(beforeFit);expect(await resultBytes()).toEqual(beforeResult);await expect(p.locator('#fit-next-revision')).toHaveText(revision!);
    }
   }
  }finally{await context.close();}
 }
});
