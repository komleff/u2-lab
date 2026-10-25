import {test,expect} from '@playwright/test';

for(const width of [1440,390])test.describe(`current Lab entry at ${width}`,()=>{
  test.use({viewport:{width,height:1000},isMobile:width===390,hasTouch:width===390});
  test('clean root opens the current complete workspace and reload keeps the URL clean',async({page})=>{
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/');
    for(const reload of [false,true]){
      if(reload)await page.reload();
      await expect(page.locator('#sm-preset')).toHaveValue('sputnik-d');
      await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.3');
      await expect(page.locator('#sm-work-mode')).toHaveValue('mission');
      await expect(page.locator('#sm-duration')).toHaveValue('3600');
      await expect(page.locator('#sm-start')).toBeEnabled();
      for(const section of ['#workspace-fitting','#workspace-conditions','#workspace-compare','#workspace-controls'])await expect(page.locator(section)).toBeAttached();
      await expect(page.locator('.ui-header')).not.toContainText(/эксперимент|старый редактор|v2\.|UI v/i);
      await expect(page.locator('#sm-back')).toHaveCount(0);
      await expect(page.locator('#sm-source')).toBeHidden();
      await expect(page.locator('#sm-compilation')).not.toHaveAttribute('open','');
      await expect(page.locator('footer[aria-label="О Лабе"]')).toContainText('версия Лабы 2.6.2');
      await expect(page.locator('footer')).toContainText('интерфейс v4.8');
      await expect(page.locator('footer')).toContainText('модель корабля v0.1');
      await expect(page.locator('footer')).toContainText('каталог 0.3.3');
      expect(new URL(page.url()).search).toBe('');
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
    expect(errors).toEqual([]);
  });
});

for(const query of ['shipModel=experimental','shipModel=unknown'])test(`${query} preserves its URL and opens the current model`,async({page})=>{
  await page.goto('/?'+query);
  await expect(page.locator('#sm-opened')).toContainText('ship-fitting-0.3.3');
  await expect(page.locator('#sm-start')).toBeEnabled();
  expect(new URL(page.url()).search).toBe('?'+query);
});

test('explicit fitting compatibility entry keeps its historical catalog',async({page})=>{
  await page.goto('/?shipModel=legacy');
  await expect(page.locator('#fit-edition')).toContainText('ship-fitting-0.2.5');
  await expect(page.locator('#fit-status')).toBeVisible();
  await expect(page.locator('#sm-entry')).toHaveCount(0);
});
