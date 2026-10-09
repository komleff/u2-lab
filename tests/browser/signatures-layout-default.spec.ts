import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { getPresetFit, loadCandidateCatalog } from "../../src/fitting/catalog";
import { makeMiningRun } from "../../src/scenarios/fitting";

for (const width of [390, 820, 1440]) test(`GL01–04 default model, immutable imports and aligned plots ${width}`, async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width === 390, isMobile: width === 390, acceptDownloads: true });
  const page = await context.newPage(), errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => { const W = Worker; Object.assign(window, { starts: [] }); window.Worker = class extends W {
    postMessage(m: any, ...args: any[]) { if (m.type === "start") (window as any).starts.push(structuredClone(m)); return (super.postMessage as any)(m, ...args); }
  }; });
  try {
    await page.goto("/"); await expect(page.locator("#sig-mode")).toBeChecked();
    await expect(page.locator("#fit-nav-signatures")).toHaveAttribute("href", "#sig-controls");
    await page.locator("#sig-mode").uncheck(); await page.locator("#fit-preset").selectOption("pony:1");
    await page.locator('[data-variant="B"][aria-pressed]').click(); await expect(page.locator("#sig-mode")).toBeChecked();
    await page.locator('[data-variant="A"][aria-pressed]').click(); await expect(page.locator("#sig-mode")).not.toBeChecked();
    await page.locator("#sig-mode").check(); await page.locator("#fit-duration").fill("2"); await page.locator("#fit-duration").blur();
    await page.locator("#fit-speed").selectOption("20000"); await page.locator("#fit-start").click();
    await expect(page.locator("#fit-start")).toBeEnabled(); await expect(page.locator("#fit-time")).toContainText("2 с / 2 с");
    expect(await page.evaluate(() => (window as any).starts[0].payload.spec.modelVersion)).toBe("ship-fitting-signature-mission-0.1");
    await expect(page.locator(".overview-charts figure")).toHaveCount(8); await expect(page.locator(".signature-chart")).toHaveCount(2);
    await expect(page.locator('svg[aria-label="CS · м²"]')).toHaveCount(0); await expect(page.locator("#sig-measurements")).toContainText("CS · м²");
    const saved = JSON.parse(await readFile("tests/signatures/fixtures/received-result.json", "utf8"));
    await page.locator("#fit-import").setInputFiles({ name: "paused.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(saved)) });
    await expect(page.locator("#fit-status")).toContainText("Частичный результат"); await expect(page.locator("#sig-mode")).toBeChecked();
    await expect(page.locator("#fit-nav-signatures")).toHaveAttribute("href", "#sig-overview"); await page.locator("#fit-nav-signatures").click();
    await expect(page).toHaveURL(/#sig-overview$/);
    const geometry = await page.locator(".overview-charts").evaluate((grid, horizon) => {
      const figures = [...grid.querySelectorAll("figure")].slice(0, 4), rows = figures.map(f => {
        const svg = f.querySelector("svg")!, matrix = svg.getScreenCTM()!, b = f.getBoundingClientRect();
        const x = (v: number) => new DOMPoint(180 + v / horizon * 480, 20).matrixTransform(matrix).x - b.left;
        return { width: b.width, left: b.left, top: b.top, viewBox: svg.getAttribute("viewBox"), axis: svg.dataset.axisX,
          times: [0, horizon / 2, horizon].map(x), marker: svg.querySelector("[data-time]")?.getAttribute("d"),
          fonts: [...svg.querySelectorAll("text")].map(n => parseFloat(getComputedStyle(n).fontSize) * matrix.a),
          lastDataX: Math.max(...[...svg.querySelectorAll("polyline")].flatMap(n => (n.getAttribute("points") ?? "").trim().split(/\s+/).filter(Boolean).map(p => Number(p.split(",")[0])))) };
      }); return { rows, overflow: document.documentElement.scrollWidth - innerWidth };
    }, saved.spec.durationSeconds);
    expect(geometry.overflow).toBe(0); const first = geometry.rows[0];
    for (const row of geometry.rows) {
      expect(row.viewBox).toBe("0 0 700 205"); expect(row.axis).toBe("180"); expect(Math.abs(row.width - first.width)).toBeLessThan(.01);
      row.times.forEach((x, i) => expect(Math.abs(x - first.times[i])).toBeLessThan(.01));
      expect(row.marker).toBe(first.marker); row.fonts.forEach(f => expect(f).toBeGreaterThanOrEqual(12));
    }
    const observedEndX = 180 + saved.state.timeSeconds / saved.spec.durationSeconds * 480;
    for (const row of geometry.rows.slice(2)) { expect(row.lastDataX).toBeLessThan(660); expect(Math.abs(row.lastDataX - observedEndX)).toBeLessThan(1e-10); }
    if (width === 390) expect(new Set(geometry.rows.map(r => r.left)).size).toBe(1);
    else { expect(geometry.rows[0].top).toBe(geometry.rows[1].top); expect(geometry.rows[2].top).toBe(geometry.rows[3].top); }
    await info.attach("aligned-plot-geometry", { body: JSON.stringify(geometry), contentType: "application/json" }); await page.screenshot({ path: info.outputPath("aligned-plots.png") });
    await page.locator("#fit-more > summary").click(); const receiptDownload = page.waitForEvent("download"); await page.locator("#fit-export-result").click();
    expect(JSON.parse(await readFile((await (await receiptDownload).path())!, "utf8"))).toEqual(saved);
    const catalog = loadCandidateCatalog(), old = makeMiningRun(getPresetFit("pony:1"), catalog, { durationSeconds: 2, stepSeconds: .1 });
    if (!old.ok) throw Error("old run fixture");
    await page.locator("#fit-import").setInputFiles({ name: "old-run.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(old.value)) });
    await expect(page.locator("#sig-mode")).not.toBeChecked();
    if (!await page.locator("#fit-more").evaluate(n => (n as HTMLDetailsElement).open)) await page.locator("#fit-more > summary").click();
    const download = page.waitForEvent("download"); await page.locator("#fit-export-run").click();
    expect(JSON.parse(await readFile((await (await download).path())!, "utf8"))).toEqual(old.value);
    await page.locator("#sig-mode").check();await page.locator("#fit-duration").fill("60");await page.locator("#fit-duration").blur();await page.locator("#fit-speed").selectOption("1");await page.locator("#fit-start").click();
    await expect(page.locator("[data-signature-live]")).toHaveCount(1);await expect(page.locator(".overview-charts svg")).toHaveCount(0);
    await expect(page.locator("#fit-time")).not.toHaveText("0 с / 60 с");await expect(page.locator("#sig-overview")).toContainText("На конец последнего принятого подшага");
    await page.locator("#fit-pause").click();await expect(page.locator("#fit-status")).toContainText("Пауза");await expect(page.locator(".overview-charts svg")).toHaveCount(8);
    await page.locator("#fit-step").click();await expect(page.locator("#fit-status")).toContainText("Пауза");await expect(page.locator(".overview-charts svg")).toHaveCount(8);
    await page.locator("#fit-resume").click();await expect(page.locator("[data-signature-live]")).toHaveCount(1);await expect(page.locator(".overview-charts svg")).toHaveCount(0);
    await page.locator("#fit-cancel").click();await page.locator("#cancel-yes").click();await expect(page.locator(".overview-charts svg")).toHaveCount(8);expect(errors).toEqual([]);
  } finally { await context.close(); }
});
