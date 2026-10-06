import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('MC03 catalog opens without editable focus and intentional search preserves mounting and return focus', async ({ browser }) => {
  for (const width of [1440, 1024, 390]) {
    const touch = width !== 1440;
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: touch, hasTouch: touch, acceptDownloads: true });
    try {
      const p = await context.newPage(), errors: string[] = [];
      p.on('pageerror', e => errors.push(e.message));
      const act = async (selector: string) => {
        const x = p.locator(selector);
        await x.scrollIntoViewIfNeeded();
        if (touch) await x.tap(); else await x.click();
      };
      const save = async () => {
        await act('#fit-save');
        // Отдельное окно имени файла сохраняет прежний намеренный фокус для ввода.
        await expect(p.locator('#fit-save-name')).toBeFocused();
        const download = p.waitForEvent('download');
        await act('#fit-save-confirm');
        return readFile((await (await download).path())!);
      };
      await p.goto('/');
      await p.locator('#fit-preset').selectOption('pony:1');
      const before = await save(), revision = await p.locator('#fit-next-revision').textContent();
      await p.evaluate(() => {
        const page = window as typeof window & { catalogEditableFocus: string[] };
        page.catalogEditableFocus = [];
        document.addEventListener('focusin', e => {
          const target = e.target as HTMLElement;
          if (document.querySelector('#swap-title') && target.closest('#ui-dialog') && target.matches('input,textarea,[contenteditable="true"]')) page.catalogEditableFocus.push(target.id);
        }, true);
      });
      const open = async () => {
        await p.evaluate(() => { (window as typeof window & { catalogEditableFocus: string[] }).catalogEditableFocus = []; });
        if (touch) await act('#slot-payload-1');
        else { await p.locator('#slot-payload-1').focus(); await p.keyboard.press('Enter'); }
        await expect.soft(p.locator('#swap-close'), `${width}: non-editable initial focus`).toBeFocused({ timeout: 1000 });
        expect.soft(await p.evaluate(() => (window as typeof window & { catalogEditableFocus: string[] }).catalogEditableFocus), `${width}: no transient editable focus on open`).toEqual([]);
      };
      await open();
      await act('#swap-close');
      await expect(p.locator('#slot-payload-1')).toBeFocused();
      await expect(p.locator('#fit-next-revision')).toHaveText(revision!);
      expect(await save()).toEqual(before);

      await open();
      if (touch) await act('#swap-search'); else await p.keyboard.press('Tab');
      await p.keyboard.type('Груз');
      await expect(p.locator('#swap-search')).toBeFocused();
      await expect(p.locator('#swap-search')).toHaveValue('Груз');
      expect(await p.locator('#swap-search').evaluate(n => (n as HTMLInputElement).selectionStart)).toBe(4);
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      expect(await p.locator('#swap-search').evaluate(n => (n as HTMLInputElement).selectionStart)).toBe(1);
      await p.locator('#swap-family').selectOption('cargo');
      await p.locator('#swap-size').selectOption('S');
      await expect(p.locator('#swap-search')).toHaveValue('Груз');
      expect(await p.locator('#swap-search').evaluate(n => (n as HTMLInputElement).selectionStart)).toBe(1);
      await act('[data-candidate="cargo-bulk-S"]');
      await expect(p.locator('[data-candidate="cargo-bulk-S"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(p.locator('#swap-search')).toHaveValue('Груз');
      expect(await p.locator('#swap-search').evaluate(n => (n as HTMLInputElement).selectionStart)).toBe(1);
      await expect(p.locator('#fit-next-revision')).toHaveText(revision!);
      await act('#fit-apply');
      await expect(p.locator('#slot-payload-1')).toBeFocused();
      const after = await save(), expected = JSON.parse(before.toString());
      expected.fitRevision++;
      expected.assignments['payload-1'] = 'fit:payload-1';
      expected.instances['fit:payload-1'] = { id: 'fit:payload-1', itemId: 'cargo-bulk-S', enabled: true };
      expect(JSON.parse(after.toString())).toEqual(expected);

      await open();
      await p.keyboard.press('Escape');
      await expect(p.locator('#slot-payload-1')).toBeFocused();
      expect(await save()).toEqual(after);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  }
});
