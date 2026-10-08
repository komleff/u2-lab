import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

for (const viewport of [{ width: 360, height: 480 }, { width: 1440, height: 900 }]) {
  test(`signature editor labels and focus without starting physics ${viewport.width}×${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.goto("/");
      await expect(page.locator("#sig-mode")).not.toBeChecked();
      const signatureGroup = page.locator('.group-toggle[data-group="signature"]');
      if (await signatureGroup.getAttribute("aria-expanded") === "false") await signatureGroup.click();
      await expect(page.locator("#fit-slots")).toContainText("обнаружение пока не рассчитывается");
      await page.locator("#sig-mode").check();
      await expect(page.locator("#sig-observer option:checked")).toHaveText("S / G1 · IR + EM · радар S");
      await expect(page.locator("#fit-slots")).toContainText("Излучение этой оснастки измеряет условный внешний наблюдатель");
      await expect(page.locator("#fit-slots")).not.toContainText("обнаружение пока не рассчитывается");
      await page.locator("#sig-settings-details summary").click();
      await expect(page.locator("#sig-cap option:checked")).toHaveText("Полный");
      await page.locator("#sig-cap").selectOption("EMPTY");
      await expect(page.locator("#sig-cap option:checked")).toHaveText("Пустой");
      await page.locator("#slot-payload-1").click();
      await expect(page.locator("#swap-close")).toBeFocused();
      await page.locator("#swap-close").click();
      await page.locator("#sig-mode").uncheck();
      await expect(page.locator("#fit-slots")).toContainText("обнаружение пока не рассчитывается");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await expect(page.locator("#fit-time")).toContainText("0 с");
    } finally { await context.close(); }
  });

  test(`signature result details remain readable and private without recomputation ${viewport.width}×${viewport.height}`, async ({ browser }, info) => {
    const context = await browser.newContext({ viewport, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.goto("/");
      const buffer = await readFile("tests/signatures/fixtures/received-result.json");
      await page.locator("#fit-import").setInputFiles({ name: "received-result.json", mimeType: "application/json", buffer });
      await expect(page.locator("#sig-measurements")).toBeVisible();
      await page.locator("#sig-truth-details summary").click();
      await expect(page.locator("#sig-truth-details")).toContainText("Фактические электрические stages");
      await expect(page.locator("#sig-truth-details")).toContainText("RF peak flux на дальности стенда");
      await expect(page.locator("#sig-measurements")).toContainText("доминирующий средний источник подшага");
      const observer = page.locator("#sig-observer-view");
      await expect(observer).toContainText("Radar · pulse");
      await expect(observer).not.toContainText(/geometry|temperature|emittedAt|engine:|fit:|источников|16000/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      await observer.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath("signature-imported-result.png") });
    } finally { await context.close(); }
  });
}
