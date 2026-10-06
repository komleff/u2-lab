import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { loadCandidateCatalog } from '../../src/fitting/catalog';

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

test('MC03 tablet catalog families follow the slot, retain real refusals and repair incomplete mounting', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 1000 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  try {
    const p = await context.newPage(), errors: string[] = [];
    p.on('pageerror', e => errors.push(e.message));
    const act = async (selector: string) => { const x = p.locator(selector); await x.scrollIntoViewIfNeeded(); await x.tap(); };
    const save = async () => { await act('#fit-save'); const download = p.waitForEvent('download'); await act('#fit-save-confirm'); return readFile((await (await download).path())!); };
    await p.goto('/');
    await p.locator('#fit-preset').selectOption('pony:2');
    const before = await save(), original = JSON.parse(before.toString()), revision = await p.locator('#fit-next-revision').textContent();
    const items = { ...loadCandidateCatalog().items, ...original.localVariants };
    const familyOptions = () => p.locator('#swap-family option').evaluateAll(ns => ns.map(n => (n as HTMLOptionElement).value).sort());
    const groups = [
      ['payload-1', 'payload', ['cargo', 'mining']],
      ['power-3', 'power', ['battery', 'generator', 'solar', 'tank']],
      ['signature-1', 'signature', ['buffer', 'h2', 'radiator', 'thermoinverter']],
      ['march', 'propulsion', ['engine']],
      ['strafe', 'propulsion', ['engine']],
    ] as const;
    for (const [slot, category, families] of groups) {
      await act('#slot-' + slot);
      await expect(p.locator('#swap-close')).toBeFocused();
      expect.soft(await familyOptions(), slot).toEqual(['all', ...families].sort());
      const rendered = await p.locator('[data-candidate]').evaluateAll(ns => ns.map(n => (n as HTMLElement).dataset.candidate!));
      const outsideSlot = rendered.filter(id => items[id].category !== category || !(families as readonly string[]).includes(items[id].family));
      expect.soft(outsideSlot, `${slot}: catalog contains only slot categories/families`).toEqual([]);
      if (slot === 'payload-1') await expect(p.locator('[data-candidate="pony-removable-laser-S-G0"]')).toBeVisible();
      if (slot === 'power-3') await expect(p.locator('[data-candidate="pony-generator"]')).toBeVisible();
      if (slot === 'strafe') {
        await expect(p.locator('[data-candidate="engine-diesel-S-single"]')).toContainText('Нужен парный модуль');
        await expect(p.locator('[data-candidate="engine-diesel-S-pair"]')).not.toHaveClass(/incompatible/);
      }
      await p.locator('#swap-family').selectOption(families[0]);
      await p.locator('#swap-size').selectOption('M');
      expect.soft(await familyOptions(), `${slot}: family/size selection`).toEqual(['all', ...families].sort());
      await act('#swap-search'); await p.keyboard.type('НетТакогоИзделия');
      await expect(p.locator('[data-candidate]')).toHaveCount(0);
      expect.soft(await familyOptions(), `${slot}: empty search`).toEqual(['all', ...families].sort());
      await act('#swap-close');
      await expect(p.locator('#slot-' + slot)).toBeFocused();
      await expect(p.locator('#fit-next-revision')).toHaveText(revision!);
      await act('#slot-' + slot);
      await expect(p.locator('#swap-family')).toHaveValue('all');
      await expect(p.locator('#swap-search')).toHaveValue('');
      await act('#swap-close');
    }
    expect(await save()).toEqual(before);
    await act('#slot-march'); await act('#fit-remove');
    await expect(p.locator('#fit-start')).toBeDisabled();
    await expect(p.locator('#fit-readiness')).toContainText('march');
    await act('#slot-march');
    expect.soft(await familyOptions(), 'incomplete mandatory slot').toEqual(['all', 'engine']);
    await act('[data-candidate="engine-hydrogen-S-single"]');
    await act('#fit-preview > summary');
    await expect(p.locator('#fit-preview')).toContainText('D допускает');
    await expect(p.locator('#fit-apply')).toBeDisabled();
    await act('[data-candidate="pony-engine-march"]');
    await expect(p.locator('#fit-apply')).toBeEnabled();
    await act('#fit-apply');
    await expect(p.locator('#slot-march')).toBeFocused();
    const restored = structuredClone(original); restored.fitRevision += 2;
    expect(JSON.parse((await save()).toString())).toEqual(restored);
    await act('#slot-payload-1');
    await p.locator('#swap-family').selectOption('all');
    await act('[data-candidate="cargo-bulk-M"]');
    await expect(p.locator('#fit-apply')).toBeDisabled();
    await expect(p.locator('[data-candidate="cargo-bulk-M"]')).toContainText('Калибр изделия превышает слот');
    await act('[data-candidate="cargo-bulk-S"]');
    await p.locator('#swap-batch').check();
    await act('#fit-apply');
    restored.fitRevision++;
    for (const slot of ['payload-1', 'payload-2']) {
      restored.assignments[slot] = 'fit:' + slot;
      restored.instances['fit:' + slot] = { id: 'fit:' + slot, itemId: 'cargo-bulk-S', enabled: true };
    }
    expect(JSON.parse((await save()).toString())).toEqual(restored);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
