import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { openTimedDraft } from './timed-draft';

for (const width of [1440,390]) test(`MC01–04 module information preserves selection and mounting at ${width}`,async({browser})=>{
 const context=await browser.newContext({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390,acceptDownloads:true});
 try {
  const p=await context.newPage(),act=async(selector:string)=>{const x=p.locator(selector);await x.scrollIntoViewIfNeeded();width===390?await x.tap():await x.click();};
  const save=async()=>{const wait=p.waitForEvent('download');await act('#fit-save');await act('#fit-save-confirm');return readFile((await (await wait).path())!);};
  await p.goto('/');await openTimedDraft(p);await p.locator('#fit-preset').selectOption('pony:1');
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
  await p.screenshot({path:`.overgate-runtime/module-cleanup-evidence/catalog-${width}.png`});
  await expect(p.locator('#fit-preview')).not.toHaveAttribute('open');await act('#fit-preview > summary');await expect(p.locator('#fit-preview')).toHaveAttribute('open','');
  await act('#fit-apply');await expect(p.locator('#slot-payload-1')).toBeFocused();
  const afterBytes=await save(),after=JSON.parse(afterBytes.toString()),old=JSON.parse(before.toString());
  const expected=structuredClone(old);expected.fitRevision++;expected.assignments['payload-1']='fit:payload-1';expected.instances['fit:payload-1']={id:'fit:payload-1',itemId:'cargo-bulk-S',enabled:true};expect(after).toEqual(expected);
  await act('[data-instance="fit:payload-1"].module-info-button');await expect(p.getByRole('dialog')).toContainText('Грузовой навалочный S');await expect(p.locator('#instance-sources')).toBeVisible();await expect(p.locator('#instance-sources')).toContainText('origins');await p.keyboard.press('Escape');await expect(p.locator('[id="info-fit:payload-1"]')).toBeFocused();
  const builtin=p.locator('.system-payload .module-info-button[data-instance]').first();await builtin.scrollIntoViewIfNeeded();width===390?await builtin.tap():await builtin.click();await expect(p.getByRole('dialog')).toContainText('Встроено');await p.keyboard.press('Escape');expect(await save()).toEqual(afterBytes);
  await expect(p.locator('footer')).toContainText('интерфейс v4.1');
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }finally{await context.close();}
});
