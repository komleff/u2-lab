import { test, expect } from "@playwright/test";
test("v4 continuous research page keeps sections and navigation reachable during an advancing test", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#fit-preset")).toBeVisible();
  await expect(page.locator("#fit-duration")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сравнение вариантов", exact: true })).toBeVisible();
  await page.locator("#fit-preset").selectOption("pony:2");
  await page.locator("#fit-duration").fill("180");
  await page.locator("#fit-speed").selectOption("1");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-time")).not.toHaveText("0 с / 180 с");
  await page.getByRole("link", { name: "Графики", exact: true }).click();
  await page.locator("#fit-duration").fill("240");
  await expect(page.locator("#fit-running-revision")).toContainText("Тест использует сборку");
  await page.getByRole("link", { name: "Сравнение", exact: true }).click();
  await page.locator("#fit-pause").click();
  await expect(page.locator("#fit-status")).toContainText("Пауза");
  await expect(page.getByRole("link", { name: "Оснастка", exact: true })).toBeInViewport();
  await expect(page.locator("footer")).toContainText("интерфейс v4.0");
});

import { readFile } from "node:fs/promises";
for (const width of [1440, 820, 390]) test(`v4 whole native research chain at ${width}: paused reference, next hypothesis, analysis and atomic file reopening`, async ({ browser }) => {
  test.setTimeout(90000);
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width !== 1440, acceptDownloads: true });
  const page = await context.newPage(), errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => {
    const Native = Worker; (window as any).startedSpecs = [];
    window.Worker = class extends Native {
      constructor(url: string | URL, opts?: WorkerOptions) {
        super(url, opts); const send = this.postMessage.bind(this);
        this.postMessage = ((m: any) => { if (m.type === "start") (window as any).startedSpecs.push(structuredClone(m.payload.spec)); send(m); }) as any;
      }
    };
  });
  const action = async (selector: string) => {
    const b = page.locator(selector); await b.scrollIntoViewIfNeeded();
    if (width === 1440) await b.click(); else await b.tap();
  };
  const exported = async (selector: string, name?: string) => {
    const wait = page.waitForEvent("download"); await action(selector);
    if (selector === "#fit-save" || selector === "#fit-save-more") {
      await expect(page.getByRole("dialog")).toContainText("Сохранить сборку");
      if (name) await page.getByLabel("Имя файла").fill(name);
      await action("#fit-save-confirm");
    }
    const file = await wait;
    if (name) expect(file.suggestedFilename()).toBe(name.trim() + ".json");
    return readFile((await file.path())!, "utf8");
  };
  const importText = async (text: string) => page.locator("#fit-import").setInputFiles({ name: "research.json", mimeType: "application/json", buffer: Buffer.from(text) });
  await page.goto("/");
  await expect(page.locator("#fit-preset")).toBeVisible();
  expect(await page.evaluate(() => ({ html: getComputedStyle(document.documentElement).overscrollBehaviorY, body: getComputedStyle(document.body).overscrollBehaviorY }))).toEqual({ html: "none", body: "none" });
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page.locator("#fit-preset").selectOption("pony:3");
  const identityBeforeSave = await page.locator(".persistent-context").textContent();
  const downloads: string[] = []; page.on("download", d => downloads.push(d.suggestedFilename()));
  await action("#fit-save");
  await expect(page.getByRole("dialog")).toContainText("Сохранить сборку");
  await page.getByLabel("Имя файла").fill("Отменённая сборка"); await action("#fit-save-cancel");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(downloads).toEqual([]); await expect(page.locator(".persistent-context")).toHaveText(identityBeforeSave!);
  await page.locator("#fit-duration").fill("180");
  await page.locator("#fit-speed").selectOption("1");
  await action("#fit-start");
  await expect(page.locator("#fit-time")).not.toHaveText("0 с / 180 с");
  await page.getByRole("link", { name: "Графики", exact: true }).click();
  await expect(page.locator("#workspace-compare")).not.toHaveAttribute("hidden");
  await expect(page.locator("#workspace-fitting")).not.toHaveAttribute("hidden");
  await action("#fit-pause"); await expect(page.locator("#fit-status")).toContainText("Пауза");
  await action("#fit-freeze");
  await expect(page.locator("#fit-comparison")).toContainText("Неизменяемый снимок");
  const frozen = await page.locator(".ab-side-a").innerHTML();
  await action("#fit-f3"); const activeSpec = JSON.parse(await exported("#fit-export-run"));
  await page.locator("#fit-temperature").fill("330");
  await page.locator("#fit-duration").fill("25");
  expect(JSON.parse(await exported("#fit-export-run"))).toEqual(activeSpec);
  await action("#fit-cancel"); await action("#cancel-yes");
  await expect(page.locator("#fit-status")).toContainText("Отменён");
  expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  await page.getByRole("button", { name: /Вариант B ·/ }).click();
  await page.locator("#fit-preset").selectOption("civilian-M:2");
  await action('button.module-card[data-slot="payload-1"]'); await page.keyboard.press("Escape");
  await page.locator("#fit-variant-field").selectOption("efficiency");
  await page.locator("#fit-variant-value").fill("0.4"); await action("#fit-variant-numeric");
  await expect(page.locator("#fit-sources")).toContainText('"kind": "experimental"');
  for (const [id, value] of [["temperature", "320"], ["duration", "20.25"], ["dt", "1"], ["approach", "2"], ["work-seconds", "9"], ["braking", "3"], ["service", "2"], ["idle", "4"]]) await page.locator("#fit-" + id).fill(value);
  await page.locator("#fit-repeat").uncheck(); await page.locator("#fit-speed").selectOption("20000");
  await action("#fit-start"); await expect(page.locator("#fit-status")).toContainText("Завершён");
  expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  await expect(page.locator(".overview-charts figure")).toHaveCount(6);
  const font = await page.locator(".overview-charts svg text").evaluateAll(ns => Math.min(...ns.map(n => parseFloat(getComputedStyle(n).fontSize) * (n as SVGGraphicsElement).getScreenCTM()!.a)));
  expect(font).toBeGreaterThanOrEqual(11);
  await page.locator("#chart-bucket").fill("5");
  await expect(page.locator("#journal-interval")).toHaveAttribute("data-selected-end", "6");
  await page.locator("#channel-details summary").click();
  const curve = page.locator("[data-curve]").first(), id = await curve.getAttribute("data-curve");
  const remaining = page.locator("#channel-details g[data-channel]").nth(1), remainingId = await remaining.getAttribute("data-channel"), color = await remaining.getAttribute("stroke");
  await curve.click();
  await expect(page.locator(`#channel-details g[data-channel="${id}"]`)).toHaveCount(0);
  await expect(page.locator(`#channel-details g[data-channel="${remainingId}"]`)).toHaveAttribute("stroke", color!);
  await curve.click();
  await page.locator("#compare-sort").selectOption("rate-desc"); await expect(page.locator("#compare-base")).toHaveValue("reference");
  await expect(page.locator(".comparison-conditions")).toContainText("Условия варианта B");
  const resultText = await exported("#fit-export-result"), native = JSON.parse(resultText), fitText = await exported("#fit-save", "  Моя сборка ГД  "), runText = await exported("#fit-export-run"), csv = await exported("#fit-export-csv");
  expect(await exported("#fit-save-more")).toBe(fitText);
  expect(JSON.parse(fitText)).toEqual(native.spec.resolvedShip.fit);
  expect(native.state.timeSeconds).toBe(20.25); expect(native.spec.initial.temperatureK).toBe(320);
  expect(native.spec.resolvedShip.instances.find((i: any) => i.id === "fit:payload-1").item.numerics.efficiency).toBe(.4);
  expect(native.spec.scenario.repeat).toBe(false); expect(csv).toContain("bucket_start_s");
  const before = await page.locator("#fit-result").textContent();
  const bad = structuredClone(native); bad.buckets[0].sum[0] = null;
  await importText(JSON.stringify(bad)); await expect(page.locator("#fit-error")).not.toBeEmpty();
  await expect(page.locator("#fit-result")).toHaveText(before!); expect(await exported("#fit-export-result")).toBe(resultText);
  expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  const geometry = await page.evaluate(() => ({ inner: innerWidth, document: document.documentElement.scrollWidth, visual: visualViewport!.width }));
  expect(geometry.inner).toBe(width); expect(geometry.document).toBe(width); expect(geometry.visual).toBe(width);
  await page.reload();
  for (const [text, opened] of [[fitText, "сборка"], [runText, "численный опыт для повторения"], [resultText, "измеренный результат для анализа"]]) {
    await importText(text); await expect(page.locator("#fit-replay-note")).toContainText(opened);
    await expect(page.locator(".ship-hero")).toContainText("M");
  }
  expect(await page.evaluate(() => (window as any).startedSpecs.length)).toBe(0);
  await action("#fit-f3");
  expect(JSON.parse(await exported("#fit-export-result"))).toEqual(native);
  await expect(page.locator("#fit-duration")).toHaveValue("20.25");
  await expect(page.locator("#fit-temperature")).toHaveValue("320");
  await expect(page.locator("footer")).toContainText("интерфейс v4.0");
  expect(errors).toEqual([]); await context.close();
});
test("operator slot groups each occupy a separately findable full-width row at desktop/tablet/phone", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#fit-slots")).toBeVisible();
  for (const width of [1440, 820, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    const rows = await page.evaluate(() => {
      const bounds = (s: string) => { const r = document.querySelector(s)!.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }; };
      return { all: bounds("#fit-slots"), power: bounds(".system-power"), payload: bounds(".system-payload"), signature: bounds(".system-signature") };
    });
    for (const row of [rows.power, rows.payload, rows.signature]) {
      expect(row.width).toBe(rows.all.width); expect(row.left).toBe(rows.all.left);
    }
    expect(rows.signature.top).toBeGreaterThanOrEqual(rows.power.bottom);
    await expect(page.locator('.system-signature [data-group="signature"]')).toContainText("Контроль сигнатур");
  }
});
