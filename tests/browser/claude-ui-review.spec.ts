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
  await page.goto("/");
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
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
  await expect(page.locator("#fit-result")).toContainText("ожидается первое измерение текущего теста");
  await expect(page.locator(".lab-context")).toContainText("run " + ids[1]);
  await expect(page.locator(".lab-context")).not.toContainText(ids[0]);
  await expect(page.locator(".fit-f1")).toContainText("предыдущий тест · run " + ids[0]);
  expect(await page.evaluate(() => ({
    inner: innerWidth, document: document.documentElement.scrollWidth,
    visual: visualViewport!.width, scale: visualViewport!.scale,
  }))).toEqual({ inner: 390, document: 390, visual: 390, scale: 1 });
  const retainedDownload = page.waitForEvent("download");
  await page.locator("#fit-export-result").tap();
  expect(await readFile((await (await retainedDownload).path())!)).toEqual(oldBytes);
  await page.getByRole("button", { name: "Сравнение", exact: true }).click();
  await expect(page.locator(".compare-desktop [data-compare-variant=A]")).toContainText("предыдущий тест · run " + ids[0]);
  await expect(page.locator(".compare-desktop [data-compare-variant=A]")).not.toContainText("предварительно");
  await page.getByRole("button", { name: /Вариант B ·/ }).click();
  await page.getByRole("button", { name: "Power & Heat", exact: true }).click();
  await expect(page.locator("#fit-start")).toBeDisabled();
  await expect(page.locator("#fit-time")).toHaveText("0 с / 20 с");
  expect(await page.locator("#fit-comparison .ab-side-a").innerHTML()).toBe(frozen);
  await page.evaluate(() => (window as any).releaseTelemetry());
  await expect(page.locator("#fit-time")).not.toHaveText("0 с / 20 с");
  await expect(page.locator(".lab-context")).toContainText("run " + ids[1]);
  await page.locator("#fit-speed").selectOption("20000");
  await page.locator("#fit-resume").click();
  await expect(page.locator("#fit-active-owner")).toContainText("активного теста нет");
  await page.getByRole("button", { name: /Вариант A ·/ }).click();
  await expect(page.locator("#fit-status")).toContainText("Завершён");
  await expect(page.locator(".lab-context")).toContainText("run " + ids[1]);
  expect(await page.locator("#fit-comparison .ab-side-a").innerHTML()).toBe(frozen);
});
