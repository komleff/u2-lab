import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import type { RunResultV2 } from "../../src/runner/run";
import { statisticsView } from "../../src/signatures/statistics";
import { distance, signatureReach } from "../../src/app/fitting-ui/signature-distance";
import { num } from "../../src/app/fitting-ui/presentation";

for (const [width, height] of [[360, 780], [820, 1230], [1440, 1000]] as const) test(`UI48 real Worker, common selection and immutable A/B ${width}`, async ({ browser }, info) => {
  test.setTimeout(60000);
  const context = await browser.newContext({ viewport: { width, height }, hasTouch: width !== 1440, isMobile: width === 360, acceptDownloads: true });
  const page = await context.newPage(), errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  const action = async (selector: string) => { const node = page.locator(selector); await node.evaluate(n => n.scrollIntoView({ block: "center" })); if (width === 1440) await node.click(); else await node.tap(); };
  const download = async () => {
    if (!await page.locator("#fit-more").evaluate(n => (n as HTMLDetailsElement).open)) await action("#fit-f3");
    const waiting = page.waitForEvent("download"); await action("#fit-export-result");
    return readFile((await (await waiting).path())!, "utf8");
  };
  try {
    await page.goto("/"); await page.locator("#fit-duration").fill("20"); await page.locator("#fit-duration").press("Tab");
    await page.locator("#fit-speed").selectOption("1"); await action("#fit-start");
    await expect.poll(async () => parseFloat((await page.locator("#fit-time").textContent())!.replace(",", "."))).toBeGreaterThanOrEqual(2);
    await expect(page.locator("[data-signature-live]")).toHaveCount(1); await expect(page.locator(".overview-charts svg")).toHaveCount(0);
    await action("#fit-pause"); await expect(page.locator("#fit-status")).toContainText("Пауза");
    await action("#fit-step"); await expect(page.locator("#fit-status")).toContainText("Пауза");
    const aText = await download(), a = JSON.parse(aText) as RunResultV2;
    await action("#fit-freeze"); await expect(page.locator("#signature-comparison")).not.toHaveAttribute("open");
    await page.getByRole("link", { name: "Графики", exact: true }).click();
    const picker = page.locator("#chart-bucket"); await expect(picker).toHaveCount(1);
    const position = await picker.evaluate(n => ({ picker: n.getBoundingClientRect().bottom, figure: document.querySelector(".overview-charts figure")!.getBoundingClientRect().top, position: getComputedStyle(n.closest("label")!).position }));
    expect(position.picker).toBeLessThan(position.figure); expect(position.position).toBe("static");
    await picker.evaluate(n => n.scrollIntoView({ block: "center" })); await picker.focus(); await picker.press("Home");
    await expect(picker).toBeFocused(); await picker.press("ArrowRight"); await expect(picker).toHaveValue("1"); await expect(picker).toBeFocused();
    const node = await picker.elementHandle();
    const bounds = (await picker.boundingBox())!; await page.mouse.move(bounds.x + bounds.width * .4, bounds.y + bounds.height / 2); await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * .75, bounds.y + bounds.height / 2, { steps: 4 }); await page.mouse.up();
    expect(await picker.evaluate((current, old) => current === old, node)).toBe(true); await expect(picker).toBeFocused();
    if (width !== 1440) { await picker.evaluate(n => n.scrollIntoView({ block: "center" })); await picker.tap({ position: { x: bounds.width * .4, y: bounds.height / 2 } }); }
    const selected = await picker.inputValue(), bucket = a.buckets[Number(selected)];
    await expect(page.locator("#journal-interval")).toHaveAttribute("data-selected-end", String(bucket.endSeconds));
    expect(await page.locator('.overview-charts [data-time]').evaluateAll(ns => ns.map(n => n.getAttribute("data-time")))).toEqual(Array(8).fill(String(bucket.endSeconds)));
    await page.locator("#fit-speed").selectOption("20000"); await action("#fit-resume"); await expect(page.locator("#fit-status")).toContainText("Завершён");
    await action("#fit-add-variant"); await page.locator("#sig-observer").selectOption("M-3in1-G1"); await page.locator("#sig-aspect").selectOption("180");
    await page.locator("#fit-background").fill("120"); await page.locator("#fit-background").press("Tab");
    await page.locator("#sig-settings-details > summary").click(); await page.locator("#sig-advanced").check();
    await action("#fit-start"); await expect(page.locator("#fit-status")).toContainText("Завершён");
    const bText = await download(), b = JSON.parse(bText) as RunResultV2;
    await action("#signature-comparison > summary");
    const comparison = page.locator("#signature-comparison"); await expect(comparison).toContainText("Контекст A/B отличается");
    await expect(comparison.locator(".signature-contexts")).toContainText("M-3in1-G1"); await expect(comparison.locator(".signature-contexts")).toContainText("180 °");
    for (const [channel, source] of [["IR", "IRobserver"], ["EM", "EM"]] as const) {
      const sa = statisticsView(a.signatures!.sourceStats[source]), sb = statisticsView(b.signatures!.sourceStats[source]);
      if (sa.status !== "measured" || sb.status !== "measured") throw Error("actual Worker statistics absent");
      const rows = comparison.locator(`[data-signature-comparison="${channel}"] [data-signature-metric]`);
      await expect(rows.nth(0).locator("strong")).toHaveText([num(sa.mean, "Вт"), num(sb.mean, "Вт"), num(sb.mean - sa.mean, "Вт")]);
      const x = signatureReach(a, channel), y = signatureReach(b, channel), delta = y.meanPowerM! - x.meanPowerM!;
      await expect(rows.nth(2).locator("strong")).toHaveText([distance(x.meanPowerM), distance(y.meanPowerM), (delta < 0 ? "−" : "") + distance(Math.abs(delta))]);
    }
    const conditions = page.locator("#fit-comparison > .condition-differences > dl"); await expect(conditions).toContainText("Ракурс"); await expect(conditions).toContainText("0 °"); await expect(conditions).toContainText("180 °");
    await expect(conditions).toContainText("Температура фона"); await expect(conditions).toContainText("100 K"); await expect(conditions).toContainText("120 K"); await expect(conditions).not.toContainText("geometry");
    const before = await comparison.innerHTML(); await page.locator("#fit-temperature").fill("330"); await page.locator("#fit-temperature").press("Tab");
    expect(await comparison.innerHTML()).toBe(before); await expect(page.locator(".measured-ownership")).toContainText("устарело");
    expect(await download()).toBe(bText);
    await page.locator("#fit-import").setInputFiles({ name: "result.json", mimeType: "application/json", buffer: Buffer.from(bText) });
    expect(await download()).toBe(bText); await expect(page.locator("footer")).toContainText("интерфейс v4.8");
    const geometry = await comparison.evaluate(n => ({ overflow: document.documentElement.scrollWidth - innerWidth, controls: [...n.querySelectorAll("summary")].map(s => s.getBoundingClientRect().height), values: [...n.querySelectorAll(".measurement-value")].map(s => { const r = document.createRange(); r.selectNodeContents(s); return [...r.getClientRects()].map(b => b.y); }) }));
    expect(geometry.overflow).toBe(0); geometry.controls.forEach(h => expect(h).toBeGreaterThanOrEqual(44)); geometry.values.forEach(rows => expect(new Set(rows).size).toBeLessThanOrEqual(1));
    expect(errors).toEqual([]); await info.attach("ui48-actual-chain", { body: JSON.stringify({ width, a: a.runId, b: b.runId, position, selected, geometry, errors }), contentType: "application/json" });
    await page.screenshot({ path: info.outputPath("ui48-comparison.png") });
  } finally { await context.close(); }
});

test("UI48 compact Compare remains reachable in the ten approved geometry envelopes", async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 780 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(), rows: unknown[] = [];
  try {
    await page.goto("/"); await page.locator("#fit-import").setInputFiles("tests/signatures/fixtures/received-result.json");
    await page.locator("#fit-freeze").click(); await page.locator("#fit-add-variant").click(); await page.locator("#signature-comparison > summary").click();
    for (const [width, height] of [[360,780], [780,360], [400,640], [640,400], [768,1024], [1024,768], [720,900], [900,720], [820,1230], [1230,820]]) {
      await page.setViewportSize({ width, height }); await page.locator("#signature-comparison > summary").evaluate(n => n.scrollIntoView({ block: "center" }));
      const g = await page.locator("#signature-comparison").evaluate(n => {
        const summary = n.querySelector("summary")!, box = summary.getBoundingClientRect(), hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return { overflow: document.documentElement.scrollWidth - innerWidth, reachable: summary === hit || summary.contains(hit), summaryHeight: box.height,
          fonts: [...n.querySelectorAll("dt,strong,p")].map(x => parseFloat(getComputedStyle(x).fontSize)),
          values: [...n.querySelectorAll(".measurement-value")].map(x => { const r = document.createRange(); r.selectNodeContents(x); return [...r.getClientRects()].map(b => b.y); }) };
      });
      expect(g.overflow, `${width}×${height}`).toBe(0); expect(g.reachable).toBe(true); expect(g.summaryHeight).toBeGreaterThanOrEqual(44);
      g.fonts.forEach(font => expect(font).toBeGreaterThanOrEqual(12)); g.values.forEach(lines => expect(new Set(lines).size).toBeLessThanOrEqual(1)); rows.push({ width, height, ...g });
    }
    await info.attach("ui48-ten-envelopes", { body: JSON.stringify(rows), contentType: "application/json" });
  } finally { await context.close(); }
});
