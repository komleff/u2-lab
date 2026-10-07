import { openTimedDraft } from "./timed-draft";
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test("CR-UI-B2 real repeated Start/Pause before new telemetry retains previous result and frozen A honestly", async ({ page }) => {
  await page.addInitScript(() => {
    const Native = Worker;
    let hold = false, owner: Worker;
    const queued: any[] = [];
    (window as any).starts = [];
    (window as any).releaseTelemetry = () => {
      hold = false;
      for (const data of queued.splice(0)) owner.dispatchEvent(new MessageEvent("message", { data }));
    };
    window.Worker = class extends Native {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options); owner = this;
        this.addEventListener("message", event => {
          if (hold && ["chunk", "complete", "snapshot"].includes(event.data.type)) {
            queued.push(event.data); event.stopImmediatePropagation();
          }
        });
        const send = this.postMessage.bind(this);
        this.postMessage = ((data: any) => {
          if (data.type === "start") {
            (window as any).starts.push(data.runId);
            hold = (window as any).starts.length === 2;
          }
          send(data);
        }) as any;
      }
    };
  });
  await page.goto("/"); await openTimedDraft(page);
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await page.locator("#fit-duration").fill("20");
  await page.locator("#fit-start").click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await page.locator("#fit-freeze").click();
  const frozen = await page.locator("#fit-comparison .ab-side-a").innerHTML();
  await page.locator("#fit-f3").click();
  const oldDownload = page.waitForEvent("download");
  await page.locator("#fit-export-result").tap();
  const oldBytes = await readFile((await (await oldDownload).path())!);
  await page.locator("#fit-speed").selectOption("1");
  await page.evaluate(() => {
    (document.querySelector("#fit-start") as HTMLButtonElement).click();
    (document.querySelector("#fit-pause") as HTMLButtonElement).click();
  });
  await expect(page.locator("#fit-status")).toContainText("Пауза");
  const ids = await page.evaluate(() => (window as any).starts as string[]);
  await expect(page.locator("#fit-time")).toHaveText("0 с / 20 с");
  await expect(page.locator("#fit-rate")).toHaveText("—");
  await expect(page.locator("#fit-dock-rate")).toHaveText("—");
  await expect(page.locator("#fit-dock-result-context")).toContainText("Пауза");
  await expect(page.locator("#fit-dock-result-context")).toHaveAttribute("data-run-id", ids[1]);
  await expect(page.locator("#fit-dock-result-context")).not.toHaveAttribute("data-run-id", ids[0]);
  await expect(page.locator("#fit-result")).toContainText("ожидается первое измерение текущего теста");
  await page.locator("#condition-notes summary").tap();
  await expect(page.locator("#condition-notes p").first()).toBeVisible();
  await expect(page.locator("#condition-notes")).toContainText("run " + ids[1]);
  await expect(page.locator("#condition-notes")).not.toContainText(ids[0]);
  await page.locator("#condition-notes summary").tap();
  await expect(page.locator(".fit-f1")).toContainText("предыдущий тест · run " + ids[0]);
  await expect(page.locator('.compare-cards [data-compare-variant="A"]')).toContainText("предыдущий тест · run " + ids[0]);

  expect(await page.evaluate(() => ({
    inner: innerWidth, document: document.documentElement.scrollWidth,
    visual: visualViewport!.width, scale: visualViewport!.scale,
  }))).toEqual({ inner: 390, document: 390, visual: 390, scale: 1 });
  const retainedDownload = page.waitForEvent("download");
  await page.locator("#fit-export-result").tap();
  expect(await readFile((await (await retainedDownload).path())!)).toEqual(oldBytes);
  await page.getByRole("link", { name: "Сравнение", exact: true }).click();
  await expect(page.locator(".compare-desktop [data-compare-variant=A]")).toContainText("предыдущий тест · run " + ids[0]);
  await expect(page.locator(".compare-desktop [data-compare-variant=A]")).not.toContainText("предварительно");
  await page.getByRole("button", { name: /Вариант B ·/ }).click();
  await page.getByRole("link", { name: "Оснастка", exact: true }).click();
  await page.locator("#fit-preset").selectOption("pony:1");
  await page.getByRole("link", { name: "Условия", exact: true }).click();
  await expect(page.locator("#fit-start")).toBeDisabled();
  await expect(page.locator("#fit-duration")).toHaveValue("3600");
  await expect(page.locator(".lab-context")).toContainText("Активный тест: вариант A");
  await expect(page.locator(".lab-side")).toContainText("Следующий черновик");
  await expect(page.locator("#fit-time")).toHaveText("0 с / 20 с");
  await expect(page.locator("#fit-dock-rate")).toHaveText("—");
  await expect(page.locator("#fit-dock-result-context")).toContainText("вариант A");
  await page.locator('.lab-main [data-instance="fit:march"]').click();
  const oldMarch = JSON.parse(oldBytes.toString()).spec.resolvedShip.instances.find((i: any) => i.id === "fit:march");
  await expect(page.getByRole("dialog")).toContainText('"id": "' + oldMarch.item.id + '"');
  await page.locator("#instance-close").click();
  expect(await page.locator("#fit-comparison .ab-side-a").innerHTML()).toBe(frozen);
  await page.evaluate(() => (window as any).releaseTelemetry());
  await expect(page.locator("#fit-time")).not.toHaveText("0 с / 20 с");
  await expect(page.locator("#condition-notes")).toContainText("run " + ids[1]);
  await page.locator("#fit-speed").selectOption("20000");
  await page.locator("#fit-resume").click();
  await expect(page.locator("#fit-active-owner")).toContainText("активного теста нет");
  await page.getByRole("button", { name: /Вариант A ·/ }).click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await expect(page.locator("#condition-notes")).toContainText("run " + ids[1]);
  expect(await page.locator("#fit-comparison .ab-side-a").innerHTML()).toBe(frozen);
  const finalDownload = page.waitForEvent("download");
  await page.locator("#fit-export-result").tap();
  const final = JSON.parse((await readFile((await (await finalDownload).path())!)).toString());
  expect(final.metrics.scuPerHour).toBeGreaterThan(0);
  await expect(page.locator("#fit-dock-rate")).toHaveText(final.metrics.scuPerHour.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " SCU/ч");
  await expect(page.locator("#fit-dock-rate")).toHaveText(await page.locator(".hero-result .metric-focus").innerText());
  await expect(page.locator("#fit-dock-result-context")).toHaveAttribute("data-run-id", ids[1]);
});

for (const width of [1440, 1024, 390]) test(`result dock real mission zero/live/Pause/foreign variant/final/stale/import/reset at ${width}`, async ({ browser }, info) => {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width !== 1440, hasTouch: width !== 1440, acceptDownloads: true });
  const page = await context.newPage(), errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(() => {
    const Native = Worker;
    (window as any).dockStarts = [];
    window.Worker = class extends Native {
      postMessage(message: any, ...args: any[]) {
        if (message.type === "start") (window as any).dockStarts.push(structuredClone(message));
        return (super.postMessage as any)(message, ...args);
      }
    };
  });
  const action = async (selector: string) => {
    const n = page.locator(selector);
    if (width === 1440) await n.click(); else await n.tap();
  };
  const exported = async () => {
    if (!await page.locator("#fit-more").evaluate(n => (n as HTMLDetailsElement).open)) await action("#fit-f3");
    const wait = page.waitForEvent("download"); await action("#fit-export-result");
    return JSON.parse(await readFile((await (await wait).path())!, "utf8"));
  };
  const geometry = async () => {
    await page.locator("#workspace-compare").evaluate(n => n.scrollIntoView({ block: "start" }));
    const g = await page.evaluate(() => {
      const selectors = ["#fit-dock-rate", "#fit-start", "#fit-pause", "#fit-resume", "#fit-reset"];
      return { width: innerWidth, document: document.documentElement.scrollWidth, visual: visualViewport!.width,
        controls: selectors.filter(selector => document.querySelector(selector)!.getClientRects().length).map(selector => {
          const n = document.querySelector(selector)!, b = n.getBoundingClientRect();
          const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
          return { selector, inside: b.x >= 0 && b.right <= innerWidth && b.y >= 0 && b.bottom <= innerHeight, reachable: n === hit || n.contains(hit) };
        }), color: getComputedStyle(document.querySelector("#fit-dock-rate")!).color,
        heroColor: getComputedStyle(document.querySelector(".metric-focus")!).color,
        footerHeight: document.querySelector(".ui-controls")!.getBoundingClientRect().height };
    });
    expect(g.width).toBe(width); expect(g.document).toBe(width); expect(g.visual).toBe(width);
    expect(g.controls.every(c => c.inside && c.reachable)).toBe(true); expect(g.color).toBe(g.heroColor);
    return g;
  };
  await page.goto("/");
  await expect(page.locator("#fit-dock-rate")).toHaveText("—");
  await page.locator("#fit-duration").fill("60");
  await page.locator("#fit-distance").fill("0"); await page.locator("#fit-approach").fill("0");
  // Цель сохраняет живой опыт до нативной Pause; короткий service сам по себе заканчивается до действий оснастки.
  await page.locator("#fit-service").fill("2"); await page.locator("#fit-target").fill(".5");
  await page.locator("#fit-stop-policy").selectOption("first-stop"); await page.locator("#fit-speed").selectOption("1");
  await action("#fit-start"); await expect(page.locator("#fit-time")).not.toHaveText("0 с / 60 с");
  await expect(page.locator("#fit-dock-rate")).toHaveText("0 SCU/ч");
  await expect(page.locator("#fit-dock-result-context")).toContainText("Выполняется");
  await action("#fit-pause"); await expect(page.locator("#fit-status")).toContainText("Пауза");
  const paused = await exported(), starts = await page.evaluate(() => (window as any).dockStarts);
  expect(paused.runId).toBe(starts[0].runId); expect(paused.metrics.scuPerHour).toBeGreaterThan(0);
  expect(paused.metrics.mission.deliveredScuPerHour).toBe(0);
  await expect(page.locator("#fit-dock-rate")).toHaveText("0 SCU/ч");
  await expect(page.locator("#fit-dock-result-context")).toContainText("Пауза");
  await expect(page.locator("#fit-dock-result-context")).toContainText("ревизия " + paused.spec.resolvedShip.fit.fitRevision);
  await action("#fit-freeze"); const frozen = await page.locator(".ab-side-a").innerHTML();
  await action('[data-variant="B"][aria-pressed]'); await page.locator("#fit-preset").selectOption("pony:1");
  await expect(page.locator("#fit-dock-result-context")).toContainText("вариант A");
  await expect(page.locator("#fit-dock-result-context")).toHaveAttribute("data-run-id", paused.runId);
  await expect(page.locator(".hero-result .metric-focus")).toHaveText("—");
  const runningGeometry = await geometry();
  await page.locator("#fit-speed").selectOption("20000"); await action("#fit-resume");
  await expect(page.locator("#fit-active-owner")).toContainText("активного теста нет");
  await expect(page.locator("#fit-dock-rate")).toHaveText("—");
  await action('[data-variant="A"][aria-pressed]'); const final = await exported();
  expect(final.status).toBe("complete"); expect(final.metrics.mission.deliveredScuPerHour).toBeGreaterThan(0);
  const rate = final.metrics.mission.deliveredScuPerHour.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) + " SCU/ч";
  await expect(page.locator("#fit-dock-rate")).toHaveText(rate);
  await expect(page.locator("#fit-dock-rate")).toHaveText(await page.locator(".hero-result .metric-focus").innerText());
  await expect(page.locator("#fit-dock-result-context")).toContainText(/завершён/i);
  await page.locator("#fit-duration").fill("7"); await page.locator("#fit-duration").press("Tab");
  await expect(page.locator("#fit-dock-result-context")).toContainText("устаревший результат");
  await expect(page.locator("#fit-dock-rate")).toHaveText(rate); expect(await exported()).toEqual(final);
  expect(await page.locator(".ab-side-a").innerHTML()).toBe(frozen);
  const finalGeometry = await geometry();
  console.log("RESULT_DOCK_GEOMETRY", JSON.stringify({ width, runningGeometry, finalGeometry }));
  await action("#fit-reset"); await expect(page.locator("#fit-dock-rate")).toHaveText("—");
  await page.reload();
  await page.locator("#fit-import").setInputFiles({ name: "measured-mission.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(final)) });
  await expect(page.locator("#fit-dock-rate")).toHaveText(rate);
  await expect(page.locator("#fit-dock-result-context")).toHaveAttribute("data-run-id", final.runId);
  expect(await page.evaluate(() => (window as any).dockStarts.length)).toBe(0); expect(await exported()).toEqual(final);
  expect(errors).toEqual([]);
  await info.attach("result-dock-lifecycle", { body: JSON.stringify({ width, paused, final, runningGeometry, finalGeometry, errors }), contentType: "application/json" });
  await context.close();
});
